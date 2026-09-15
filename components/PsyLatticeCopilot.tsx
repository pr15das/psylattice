"use client";

import {
  ArrowRight,
  BrainCircuit,
  Check,
  Copy,
  ChevronDown,
  Database,
  FileText,
  History,
  ListChecks,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Navigation,
  Pin,
  PinOff,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clearCopilotContexts,
  getCopilotContextSnapshot,
  subscribeCopilotContext,
  type PsyLatticeCopilotContextEnvelope,
} from "@/lib/research/copilotBridge";

type CopilotAction = {
  type: "navigate";
  target: string;
  label: string;
};

type ChatMessage = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  actions?: CopilotAction[];
  created_at?: string;
  pinned_at?: string | null;
};

type SavedConversation = {
  id: string;
  study_id?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
  pinned_message_count?: number;
};

type PinnedMessage = {
  id: string;
  conversation_id: string;
  conversation_title: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  pinned_at: string;
};

type HistoryStats = {
  conversationCount: number;
  messageCount: number;
  warning: boolean;
};

type ModelOption = {
  key: string;
  name: string;
  description: string;
  impact: string;
  allowed: boolean;
  available: boolean;
  badge?: string;
};

type ModelState = {
  ok?: boolean;
  selectedModel?: string;
  modelAccess?: string;
  models?: ModelOption[];
  error?: string;
};

type Permissions = {
  confirmed: boolean;
  studyStructure: boolean;
  dataExplorer: boolean;
  analysis: boolean;
  thesis: boolean;
  cognitive: boolean;
  ambulatory: boolean;
  participantRows: boolean;
  directIdentifiers: boolean;
  navigationActions: boolean;
  saveHistory: boolean;
  applyAnalysisSetup: boolean;
  draftCreation: boolean;
};

type AutoSignal =
  | "study_exists"
  | "participants_present"
  | "data_explorer_connected"
  | "analysis_connected"
  | "analysis_result_present"
  | "thesis_context_present"
  | "cognitive_context_present";

type ResearchPlanTask = {
  id: string;
  title: string;
  detail: string;
  completion: "auto" | "manual";
  auto_signal?: AutoSignal;
  action?: CopilotAction | null;
};

type ResearchPlanStage = {
  id: string;
  title: string;
  goal: string;
  tasks: ResearchPlanTask[];
};

type ResearchPlan = {
  schema_version: 1;
  title: string;
  summary: string;
  stages: ResearchPlanStage[];
  manual_completed_task_ids?: string[];
  generated_at?: string;
};

type VerifiedWorkspaceState = {
  study_exists?: boolean;
  participant_count?: number;
  live_participant_count?: number;
  test_participant_count?: number;
  participant_status_counts?: Record<string, number>;
  measure_count?: number;
  cognitive_task_count?: number;
  thesis_document_count?: number;
};

const PERMISSION_KEY = "psylattice.copilot.permissions.v2";
const PLAN_KEY = "psylattice.research-assistant.plan.session.v1";
const HISTORY_NUDGE_INTERVAL = 12;

const TAB_OPTIONS: Array<{
  value: "chat" | "plan" | "context" | "permissions";
  label: string;
  icon: LucideIcon;
}> = [
  { value: "chat", label: "Chat", icon: MessageCircle },
  { value: "plan", label: "Research plan", icon: ListChecks },
  { value: "context", label: "Context", icon: Database },
  { value: "permissions", label: "Permissions", icon: ShieldCheck },
];

const READ_PERMISSION_OPTIONS: Array<{
  key: keyof Permissions;
  title: string;
  detail: string;
  icon: LucideIcon;
  unavailable?: boolean;
}> = [
  {
    key: "studyStructure",
    title: "Study structure",
    detail: "Study Builder drafts, Questionnaire Library/catalogue, custom questionnaire design, measures, phases and high-level status.",
    icon: BrainCircuit,
  },
  {
    key: "dataExplorer",
    title: "Data Explorer",
    detail: "Dataset structure, codebook and verified study summaries.",
    icon: Database,
  },
  {
    key: "analysis",
    title: "Analysis Lab",
    detail: "Variables, setup, deterministic results, figures and guardrails.",
    icon: Database,
  },
  {
    key: "thesis",
    title: "Thesis Builder",
    detail: "Owned thesis/paper drafts and the current document context.",
    icon: FileText,
  },
  {
    key: "cognitive",
    title: "Cognitive Lab",
    detail: "Cognitive Lab templates, task library, live Task Builder configuration, versions, pilots and batteries when available.",
    icon: BrainCircuit,
  },
  {
    key: "ambulatory",
    title: "EMA / ESM",
    detail: "Kept off until the mobile/Ambulatory integration is stable.",
    icon: Navigation,
    unavailable: true,
  },
  {
    key: "participantRows",
    title: "Participant-level rows",
    detail: "Pseudonymous row-level working data. Off by default.",
    icon: Database,
  },
  {
    key: "directIdentifiers",
    title: "Direct identifiers",
    detail: "Names/contact identifiers. Keep off unless a future workflow genuinely requires them.",
    icon: LockKeyhole,
  },
];

const ACTION_PERMISSION_OPTIONS: Array<{
  key: keyof Permissions;
  title: string;
  detail: string;
}> = [
  {
    key: "navigationActions",
    title: "Navigate me between PsyLattice sections",
    detail: "Allows safe Take me there buttons. Navigation never changes research data.",
  },
];

const DEFAULT_PERMISSIONS: Permissions = {
  confirmed: false,
  studyStructure: true,
  dataExplorer: true,
  analysis: true,
  thesis: true,
  cognitive: true,
  ambulatory: false,
  participantRows: false,
  directIdentifiers: false,
  navigationActions: true,
  saveHistory: true,
  applyAnalysisSetup: false,
  draftCreation: false,
};

function readPermissions(): Permissions {
  if (typeof window === "undefined") return DEFAULT_PERMISSIONS;
  try {
    const stored = window.localStorage.getItem(PERMISSION_KEY);
    if (!stored) return { ...DEFAULT_PERMISSIONS, saveHistory: true };
    return { ...DEFAULT_PERMISSIONS, ...(JSON.parse(stored) as Partial<Permissions>), saveHistory: true };
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}

function savePermissions(value: Permissions) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PERMISSION_KEY, JSON.stringify(value));
}

function readPlan(): ResearchPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ResearchPlan;
    return parsed?.schema_version === 1 && Array.isArray(parsed.stages) ? parsed : null;
  } catch {
    return null;
  }
}

function savePlan(plan: ResearchPlan | null) {
  if (typeof window === "undefined") return;
  try {
    if (!plan) window.sessionStorage.removeItem(PLAN_KEY);
    else window.sessionStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch {
    // Plan persistence is session-local by design in this phase.
  }
}

function permissionForSurface(surface: string, permissions: Permissions) {
  if (surface === "analysis") return permissions.analysis;
  if (surface === "thesis") return permissions.thesis;
  if (surface === "cognitive" || surface === "cognitive_builder") return permissions.cognitive;
  if (surface === "ambulatory") return permissions.ambulatory;
  if (surface === "data_explorer") return permissions.dataExplorer;
  if (surface === "research" || surface === "study_builder" || surface === "questionnaire") return permissions.studyStructure;
  return true;
}

function surfaceLabel(screen: string) {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    studies: "Studies",
    builder: "Study Builder",
    library: "Questionnaire Library",
    cognitive: "Cognitive Lab",
    writing: "Thesis Builder",
    ambulatory: "Ambulatory Assessment",
    followup: "Follow-up Manager",
    participants: "Participants",
    links: "Participant Links",
    data: "Data Dashboard",
    explorer: "Data Explorer",
    analysis: "Analysis Lab",
    exports: "Export Data",
    ethics: "Ethics & Consent",
    team: "Team & Permissions",
    billing: "Plans & Billing",
  };
  return labels[screen] || screen || "Research workspace";
}

function clip(value: unknown, max = 180_000) {
  const text = JSON.stringify(value ?? {});
  if (text.length <= max) return value;
  return { clipped: true, preview: text.slice(0, max) };
}

function contextHasAnalysisResult(envelope?: PsyLatticeCopilotContextEnvelope) {
  const root = envelope?.publicContext as Record<string, unknown> | undefined;
  const analysisContext = root?.analysis_context as Record<string, unknown> | undefined;
  const results = analysisContext?.results as Record<string, unknown> | undefined;
  return Boolean(results?.primary_result);
}

function contextHasParticipants(envelope?: PsyLatticeCopilotContextEnvelope) {
  const root = envelope?.publicContext as Record<string, unknown> | undefined;
  const participant = root?.participant_accumulation as Record<string, unknown> | undefined;
  const value = Number(participant?.included_participants ?? participant?.live_participants ?? 0);
  return Number.isFinite(value) && value > 0;
}

function modelBrandKind(modelKey: string, modelName = "") {
  const value = `${modelKey} ${modelName}`.toLowerCase();
  if (value.includes("claude") || value.includes("anthropic")) return "claude";
  if (value.includes("gemini")) return "gemini";
  if (value.includes("openai") || value.includes("gpt")) return "openai";
  return "auto";
}

function aiProviderForModel(modelKey: string, modelName = "") {
  const kind = modelBrandKind(modelKey, modelName);
  return kind === "auto" ? "psylattice" : kind;
}

type AiProviderKey = "psylattice" | "openai" | "claude" | "gemini";

function aiProviderLabel(provider: AiProviderKey) {
  if (provider === "openai") return "OpenAI";
  if (provider === "claude") return "Anthropic";
  if (provider === "gemini") return "Google Gemini";
  return "PsyLattice";
}

function AiProviderMark({
  provider,
  size = "md",
  bare = false,
}: {
  provider: AiProviderKey;
  size?: "sm" | "md" | "lg";
  bare?: boolean;
}) {
  const boxClass =
    size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const imageClass =
    size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (provider === "psylattice") {
    if (bare) {
      return (
        <span className={`${boxClass} flex shrink-0 items-center justify-center`} aria-label="PsyLattice">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/psylattice-mark.svg" alt="" aria-hidden="true" className={`${imageClass} object-contain drop-shadow-[0_0_2px_rgba(255,255,255,.55)]`} />
        </span>
      );
    }
    return (
      <span
        className={`${boxClass} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-100/80 bg-white shadow-sm`}
        aria-label="PsyLattice"
      >
        {/* Exact PsyLattice mark supplied by the product team. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/psylattice-mark.svg"
          alt=""
          aria-hidden="true"
          className={`${imageClass} object-contain`}
        />
      </span>
    );
  }

  const src =
    provider === "openai"
      ? "/ai-models/openai.svg"
      : provider === "claude"
        ? "/ai-models/claude.svg"
        : "/ai-models/gemini.svg";

  if (bare) {
    return (
      <span className={`${boxClass} flex shrink-0 items-center justify-center`} aria-label={aiProviderLabel(provider)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          aria-hidden="true"
          className={`${imageClass} object-contain ${provider === "openai" ? "brightness-0 invert" : ""}`}
        />
      </span>
    );
  }

  return (
    <span
      className={`${boxClass} flex shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-sm`}
      aria-label={aiProviderLabel(provider)}
    >
      {/* These are the same project assets used by the existing AI model switcher. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden="true" className={`${imageClass} object-contain`} />
    </span>
  );
}


function renderInlineMarkdown(value: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > lastIndex) parts.push(value.slice(lastIndex, match.index));
    const token = match[0];
    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      parts.push(<strong key={`strong-${key++}`} className="font-semibold text-slate-950">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(<code key={`code-${key++}`} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[.92em] text-slate-800">{token.slice(1, -1)}</code>);
    } else {
      parts.push(<em key={`em-${key++}`} className="italic">{token.slice(1, -1)}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < value.length) parts.push(value.slice(lastIndex));
  return parts;
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const output: ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushCode = (key: number) => {
    if (!codeLines.length) return;
    output.push(
      <pre key={`codeblock-${key}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 px-4 py-3 text-[11px] leading-5 text-slate-100">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
    codeLines = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) flushCode(index);
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }
    if (!line.trim()) {
      output.push(<div key={`space-${index}`} className="h-2" />);
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      output.push(
        <div key={`heading-${index}`} className={`${level <= 2 ? "mt-4 text-[14px]" : "mt-3 text-[13px]"} font-semibold leading-6 text-slate-950 first:mt-0`}>
          {renderInlineMarkdown(heading[2])}
        </div>
      );
      return;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      output.push(
        <div key={`bullet-${index}`} className="my-1.5 flex items-start gap-2.5">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
          <span className="min-w-0">{renderInlineMarkdown(bullet[1])}</span>
        </div>
      );
      return;
    }

    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      output.push(
        <div key={`number-${index}`} className="my-1.5 flex items-start gap-2.5">
          <span className="min-w-[20px] shrink-0 pt-[1px] font-semibold text-slate-500">{numbered[1]}.</span>
          <span className="min-w-0">{renderInlineMarkdown(numbered[2])}</span>
        </div>
      );
      return;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      output.push(
        <div key={`quote-${index}`} className="my-2 border-l-2 border-cyan-300 pl-3 text-slate-600">
          {renderInlineMarkdown(quote[1])}
        </div>
      );
      return;
    }

    output.push(<p key={`paragraph-${index}`} className="my-1.5 first:mt-0 last:mb-0">{renderInlineMarkdown(line)}</p>);
  });
  if (inCodeBlock || codeLines.length) flushCode(lines.length + 1);

  return <div className="research-assistant-markdown text-[13px] leading-[1.72] text-slate-700">{output}</div>;
}


export default function PsyLatticeCopilot({
  currentScreen,
  preferredStudyId = "",
  onNavigate,
}: {
  currentScreen: string;
  preferredStudyId?: string;
  onNavigate?: (target: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "plan" | "context" | "permissions">("chat");
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const [contexts, setContexts] = useState<Record<string, PsyLatticeCopilotContextEnvelope>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [modelState, setModelState] = useState<ModelState>({});
  const [modelOpen, setModelOpen] = useState(false);
  const [modelSaving, setModelSaving] = useState(false);
  const [expandedPlanStage, setExpandedPlanStage] = useState("analysis");
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [planBuilding, setPlanBuilding] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyNote, setHistoryNote] = useState("");
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [historyConversations, setHistoryConversations] = useState<SavedConversation[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [historyStats, setHistoryStats] = useState<HistoryStats>({ conversationCount: 0, messageCount: 0, warning: false });
  const [historyActionBusy, setHistoryActionBusy] = useState("");
  const [historyNudgeDismissedAt, setHistoryNudgeDismissedAt] = useState(0);
  const [copiedMessageKey, setCopiedMessageKey] = useState("");
  const [verifiedState, setVerifiedState] = useState<VerifiedWorkspaceState>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const historyPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const next = readPermissions();
    setPermissions(next);
    setResearchPlan(readPlan());
    if (!next.confirmed) setTab("permissions");

    // Saved Research Assistant history belongs to the signed-in PsyLattice account,
    // not to the browser session. Always restore it after mount, including after
    // sign-out -> sign-in. Permissions govern what NEW context may be sent to AI;
    // they must never gate access to the user's own saved chat history.
    void resumeSavedConversation();

    // Auth/session hydration can finish just after the client mounts on Safari.
    // A small retry makes account history restoration resilient without creating
    // a second persistence layer in sessionStorage.
    const retry = window.setTimeout(() => void resumeSavedConversation(true), 900);
    return () => window.clearTimeout(retry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    savePlan(researchPlan);
  }, [researchPlan]);

  useEffect(() => {
    const sync = () => setContexts(getCopilotContextSnapshot());
    sync();
    return subscribeCopilotContext(sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages, open, sending]);

  useEffect(() => {
    if (!open) return;
    // Re-read account history when the drawer opens. This catches sign-in/session
    // changes without making the user refresh the Research workspace.
    void loadHistoryIndex();
    if (!conversationId && messages.length === 0) void resumeSavedConversation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadModels() {
    try {
      const response = await fetch("/api/billing/ai/model", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as ModelState;
      setModelState(data);
    } catch {
      setModelState({ error: "Model status unavailable" });
    }
  }

  useEffect(() => {
    void loadModels();
    const refresh = () => void loadModels();
    window.addEventListener("psylattice-ai-budget-refresh", refresh);
    return () => window.removeEventListener("psylattice-ai-budget-refresh", refresh);
  }, []);

  const selectedModelKey = modelState.selectedModel || "auto";
  const selectedModelName =
    modelState.models?.find((item) => item.key === selectedModelKey)?.name || "PsyLattice Auto";
  const selectedProvider = aiProviderForModel(selectedModelKey, selectedModelName) as AiProviderKey;

  const allowedContext = useMemo(() => {
    const included: Record<string, unknown> = {
      workspace: {
        current_screen: currentScreen,
        current_screen_label: surfaceLabel(currentScreen),
      },
    };

    for (const [surface, envelope] of Object.entries(contexts) as Array<
      [string, PsyLatticeCopilotContextEnvelope]
    >) {
      if (!permissionForSurface(surface, permissions)) continue;
      const item: Record<string, unknown> = {
        label: envelope.label,
        active: envelope.active,
        updated_at: envelope.updatedAt,
        study_id: envelope.studyId || null,
        study_title: envelope.studyTitle || null,
        context: clip(envelope.publicContext || {}),
      };
      if (permissions.participantRows && envelope.participantContext) {
        item.participant_context = clip(envelope.participantContext, 120_000);
      }
      if (permissions.directIdentifiers && envelope.directIdentifierContext) {
        item.direct_identifier_context = clip(envelope.directIdentifierContext, 60_000);
      }
      included[surface] = item;
    }

    if (pinnedMessages.length) {
      included.pinned_message_context = pinnedMessages.slice(0, 24).map((message) => ({
        message_id: message.id,
        conversation_id: message.conversation_id,
        conversation_title: message.conversation_title,
        role: message.role,
        created_at: message.created_at,
        content: message.content,
        note: "Explicitly pinned by the researcher. Treat as background continuity, not authoritative statistical evidence.",
      }));
    }

    included.permissions = {
      study_structure: permissions.studyStructure,
      data_explorer: permissions.dataExplorer,
      analysis: permissions.analysis,
      thesis: permissions.thesis,
      cognitive: permissions.cognitive,
      ambulatory: permissions.ambulatory,
      navigation_actions: permissions.navigationActions,
      save_history: true,
      apply_analysis_setup: permissions.applyAnalysisSetup,
      draft_creation: permissions.draftCreation,
      participant_rows: permissions.participantRows,
      direct_identifiers: permissions.directIdentifiers,
      navigation_handler_connected: Boolean(onNavigate),
    };

    return included;
  }, [contexts, currentScreen, onNavigate, permissions, pinnedMessages]);

  const primaryStudy = useMemo(() => {
    const values = Object.values(contexts) as PsyLatticeCopilotContextEnvelope[];
    const active = values.find((item) => item.active && item.studyId);
    if (active?.studyId) return { id: active.studyId, title: active.studyTitle || "" };
    if (preferredStudyId) return { id: preferredStudyId, title: "" };
    const stale = values.find((item) => item.studyId);
    return stale?.studyId ? { id: stale.studyId, title: stale.studyTitle || "" } : null;
  }, [contexts, preferredStudyId]);

  const autoSignals = useMemo<Record<AutoSignal, boolean>>(
    () => ({
      study_exists: Boolean(verifiedState.study_exists || primaryStudy?.id || contexts.data_explorer?.studyId || contexts.analysis?.studyId),
      participants_present: Boolean((verifiedState.participant_count || 0) > 0 || contextHasParticipants(contexts.data_explorer)),
      data_explorer_connected: Boolean(contexts.data_explorer),
      analysis_connected: Boolean(contexts.analysis),
      analysis_result_present: contextHasAnalysisResult(contexts.analysis),
      thesis_context_present: Boolean((verifiedState.thesis_document_count || 0) > 0 || contexts.thesis?.publicContext),
      cognitive_context_present: Boolean((verifiedState.cognitive_task_count || 0) > 0 || contexts.cognitive?.publicContext),
    }),
    [contexts, primaryStudy, verifiedState],
  );

  const fallbackPlanStages = useMemo(() => {
    const hasStudy = autoSignals.study_exists;
    const hasParticipants = autoSignals.participants_present;
    const hasAnalysis = autoSignals.analysis_result_present;
    const hasThesis = autoSignals.thesis_context_present;
    return [
      {
        id: "question",
        title: "Research question & hypotheses",
        state: hasThesis ? "review" : "todo",
        detail: hasThesis
          ? "Thesis context is available for Research Assistant to connect the written aims to the study workflow."
          : "Open Thesis Builder or describe the research question in chat.",
      },
      {
        id: "study",
        title: "Study design & measures",
        state: hasStudy ? "done" : "todo",
        detail: hasStudy ? "A study is available in the current context." : "Create or select a study in Study Builder.",
      },
      {
        id: "ambulatory",
        title: "EMA / ESM protocol",
        state: "waiting",
        detail: "Kept isolated while the mobile/Ambulatory implementation is being completed. Research Assistant will connect here after that integration is stable.",
      },
      {
        id: "collection",
        title: "Recruitment & data collection",
        state: hasParticipants ? "done" : hasStudy ? "review" : "todo",
        detail: hasParticipants
          ? "Participant/data context has been detected."
          : "Research Assistant will use Data Explorer context to verify when data begin arriving.",
      },
      {
        id: "quality",
        title: "Data quality & preparation",
        state: contexts.data_explorer ? "review" : "todo",
        detail: contexts.data_explorer
          ? "Data Explorer context is available. Review missingness, quality flags and the intended analysis grain."
          : "Open Data Explorer when data are available.",
      },
      {
        id: "analysis",
        title: "Statistical analysis",
        state: hasAnalysis ? "done" : contexts.analysis ? "review" : "todo",
        detail: hasAnalysis
          ? "A deterministic Analysis Lab result is present in the last-known context."
          : contexts.analysis
            ? "Analysis Lab is connected; choose and verify the model before interpretation."
            : "Open Analysis Lab when the dataset is ready.",
      },
      {
        id: "report",
        title: "Results & thesis reporting",
        state: hasAnalysis && hasThesis ? "review" : "todo",
        detail:
          hasAnalysis && hasThesis
            ? "Research Assistant can connect the verified analysis output with permitted Thesis Builder material."
            : "This becomes active once both analysis output and thesis context are available.",
      },
    ];
  }, [autoSignals, contexts.analysis, contexts.data_explorer]);

  async function loadHistoryIndex() {
    try {
      const response = await fetch("/api/psylattice-copilot?mode=list", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as {
        ok?: boolean;
        conversations?: SavedConversation[];
        pinnedMessages?: PinnedMessage[];
        stats?: Partial<HistoryStats>;
        warning?: string;
      };
      if (!response.ok || !data.ok) throw new Error(data.warning || "Saved Research Assistant chats could not be loaded.");
      setHistoryConversations(Array.isArray(data.conversations) ? data.conversations : []);
      setPinnedMessages(Array.isArray(data.pinnedMessages) ? data.pinnedMessages : []);
      setHistoryStats({
        conversationCount: Number(data.stats?.conversationCount || 0),
        messageCount: Number(data.stats?.messageCount || 0),
        warning: Boolean(data.stats?.warning),
      });
      if (data.warning) setHistoryNote(data.warning);
    } catch (failure) {
      setHistoryNote(failure instanceof Error ? failure.message : "Saved Research Assistant chats are temporarily unavailable.");
    }
  }

  async function resumeSavedConversation(silentRetry = false) {
    setHistoryLoading(true);
    if (!silentRetry) setHistoryNote("");
    try {
      const response = await fetch("/api/psylattice-copilot?mode=latest", { method: "GET", cache: "no-store" });
      const data = (await response.json()) as {
        ok?: boolean;
        historyAvailable?: boolean;
        conversation?: { id?: string; study_id?: string | null } | null;
        messages?: ChatMessage[];
        plan?: ResearchPlan | null;
        verifiedState?: VerifiedWorkspaceState | null;
        warning?: string;
      };
      if (!response.ok || !data.ok) throw new Error(data.warning || "Saved Research Assistant history could not be loaded.");
      if (data.warning && !silentRetry) setHistoryNote(data.warning);
      if (data.conversation?.id) {
        setConversationId(String(data.conversation.id));
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } else if (data.historyAvailable) {
        // Database history is authoritative for the signed-in account.
        setConversationId("");
        setMessages([]);
      }
      if (data.plan) {
        setResearchPlan(data.plan);
        setExpandedPlanStage(data.plan.stages[0]?.id || "analysis");
      }
      if (data.verifiedState) setVerifiedState(data.verifiedState);
      await loadHistoryIndex();
    } catch (failure) {
      if (!silentRetry) {
        setHistoryNote(failure instanceof Error ? failure.message : "Saved Research Assistant history is temporarily unavailable. Your account history has not been deleted.");
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  async function openSavedConversation(targetConversationId: string) {
    if (!targetConversationId || historyActionBusy) return;
    setHistoryActionBusy(targetConversationId);
    setError("");
    try {
      const response = await fetch(`/api/psylattice-copilot?mode=conversation&id=${encodeURIComponent(targetConversationId)}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        conversation?: { id?: string } | null;
        messages?: ChatMessage[];
        plan?: ResearchPlan | null;
        verifiedState?: VerifiedWorkspaceState | null;
        savedUserMessage?: ChatMessage | null;
        savedAssistantMessage?: ChatMessage | null;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.conversation?.id) throw new Error(data.error || "That saved chat could not be opened.");
      setConversationId(String(data.conversation.id));
      setHistoryNudgeDismissedAt(0);
      setMessages(Array.isArray(data.messages) ? data.messages.slice(-80) : []);
      setResearchPlan(data.plan || null);
      if (data.plan) setExpandedPlanStage(data.plan.stages[0]?.id || "analysis");
      if (data.verifiedState) setVerifiedState(data.verifiedState);
      setHistoryPanelOpen(false);
      setTab("chat");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That saved chat could not be opened.");
    } finally {
      setHistoryActionBusy("");
    }
  }

  async function copyMessageText(message: ChatMessage, fallbackKey: string) {
    const key = message.id || fallbackKey;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = message.content;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      setCopiedMessageKey(key);
      window.setTimeout(() => setCopiedMessageKey((current) => current === key ? "" : current), 1600);
    } catch {
      setError("That message could not be copied. Try selecting the text manually.");
    }
  }

  async function setMessagePinned(message: ChatMessage, pinned: boolean) {
    if (!message.id || historyActionBusy) return;
    setHistoryActionBusy(message.id);
    setError("");
    try {
      const response = await fetch("/api/psylattice-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: pinned ? "pin_message" : "unpin_message",
          message_id: message.id,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; pinned_at?: string | null; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "That message could not be updated.");
      setMessages((current) => current.map((item) =>
        item.id === message.id ? { ...item, pinned_at: pinned ? (data.pinned_at || new Date().toISOString()) : null } : item
      ));
      await loadHistoryIndex();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That message could not be updated.");
    } finally {
      setHistoryActionBusy("");
    }
  }

  async function deleteSavedConversation(conversation: SavedConversation) {
    const pinnedCount = Number(conversation.pinned_message_count || 0);
    const prompt = pinnedCount > 0
      ? `Delete the unpinned history from “${conversation.title}”? ${pinnedCount} pinned message${pinnedCount === 1 ? "" : "s"} will stay saved and remain available in this chat and the Context tab.`
      : `Delete “${conversation.title}”? This cannot be undone.`;
    if (!window.confirm(prompt)) return;
    if (historyActionBusy) return;
    setHistoryActionBusy(conversation.id);
    setError("");
    try {
      const response = await fetch("/api/psylattice-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "delete_conversation", conversation_id: conversation.id }),
      });
      const data = (await response.json()) as { ok?: boolean; preservedPinned?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "The saved chat could not be deleted.");
      if (conversation.id === conversationId) {
        if (data.preservedPinned) await openSavedConversation(conversation.id);
        else newChat();
      }
      await loadHistoryIndex();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The saved chat could not be deleted.");
    } finally {
      setHistoryActionBusy("");
    }
  }

  function reviewSavedChats() {
    setHistoryPanelOpen(true);
    void loadHistoryIndex();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const container = scrollRef.current;
        const target = historyPanelRef.current;
        if (!container || !target) return;
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const nextTop = Math.max(0, container.scrollTop + targetRect.top - containerRect.top - 12);
        container.scrollTo({ top: nextTop, behavior: "smooth" });
      });
    });
  }

  async function deleteUnpinnedHistory() {
    if (!window.confirm("Delete your unpinned Research Assistant history? Pinned messages will stay saved exactly as they are and remain available in Context and saved chats. This cannot be undone.")) return;
    if (historyActionBusy) return;
    setHistoryActionBusy("delete-history");
    setError("");
    try {
      const response = await fetch("/api/psylattice-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "delete_unpinned_history" }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "Chat history could not be deleted.");
      const currentHasPinned = pinnedMessages.some((message) => message.conversation_id === conversationId);
      if (currentHasPinned && conversationId) {
        await openSavedConversation(conversationId);
      } else {
        newChat();
      }
      await loadHistoryIndex();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Chat history could not be deleted.");
    } finally {
      setHistoryActionBusy("");
    }
  }

  async function syncResearchPlan(nextPlan: ResearchPlan, targetConversationId = conversationId) {
    if (!targetConversationId) return;
    try {
      const response = await fetch("/api/psylattice-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "save_plan_state",
          save_history: true,
          conversation_id: targetConversationId,
          plan: nextPlan,
        }),
      });
      const data = (await response.json()) as { ok?: boolean; warning?: string };
      if (data.warning) setHistoryNote(data.warning);
    } catch {
      setHistoryNote("Research Plan changes are available in this tab, but could not be saved to your account.");
    }
  }

  function togglePermission(key: keyof Permissions) {
    setPermissions((current) => ({ ...current, [key]: !Boolean(current[key]) }) as Permissions);
  }

  function confirmPermissions() {
    const next = { ...permissions, confirmed: true };
    setPermissions(next);
    savePermissions(next);
    setTab("chat");
    void resumeSavedConversation();
  }

  function persistPermissionChanges() {
    savePermissions(permissions);
    if (!conversationId && !historyLoading) void resumeSavedConversation();
  }

  async function chooseModel(model: ModelOption) {
    if (!model.allowed || !model.available || modelSaving) return;
    setModelSaving(true);
    setError("");
    try {
      const response = await fetch("/api/billing/ai/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.key }),
      });
      const data = (await response.json()) as ModelState;
      if (!response.ok || !data.ok) throw new Error(data.error || "Model could not be changed.");
      setModelState(data);
      setModelOpen(false);
      window.dispatchEvent(new Event("psylattice-ai-budget-refresh"));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Model could not be changed.");
    } finally {
      setModelSaving(false);
    }
  }

  async function send(questionOverride?: string) {
    const question = (questionOverride ?? draft).trim();
    if (!question || sending) return;
    if (!permissions.confirmed) {
      setOpen(true);
      setTab("permissions");
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/psylattice-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_id: primaryStudy?.id || undefined,
          current_screen: currentScreen,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          context: allowedContext,
          permissions,
          save_history: true,
          conversation_id: conversationId || undefined,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        reply?: string;
        actions?: CopilotAction[];
        conversationId?: string | null;
        historyWarning?: string | null;
        verifiedState?: VerifiedWorkspaceState | null;
        savedUserMessage?: ChatMessage | null;
        savedAssistantMessage?: ChatMessage | null;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.reply) {
        throw new Error(data.error || "Research Assistant could not respond.");
      }
      setMessages((current) => {
        const next = [...current];
        for (let index = next.length - 1; index >= 0; index -= 1) {
          if (next[index].role === "user" && !next[index].id) {
            next[index] = { ...next[index], ...(data.savedUserMessage || {}) };
            break;
          }
        }
        return [
          ...next,
          { role: "assistant", content: data.reply as string, actions: data.actions || [], ...(data.savedAssistantMessage || {}) },
        ];
      });
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.historyWarning) setHistoryNote(data.historyWarning);
      if (data.verifiedState) setVerifiedState(data.verifiedState);
      void loadHistoryIndex();
      window.dispatchEvent(new Event("psylattice-ai-budget-refresh"));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Research Assistant could not respond.");
    } finally {
      setSending(false);
    }
  }

  async function buildResearchPlan() {
    if (planBuilding || sending) return;
    if (!permissions.confirmed) {
      setOpen(true);
      setTab("permissions");
      return;
    }

    const question = researchPlan
      ? "Refresh my structured research plan using the latest permitted PsyLattice context. Preserve the logical research workflow, update what is already complete, and give me concrete next steps."
      : "Build my structured step-by-step research plan from the permitted study, thesis, data, cognitive and analysis context. Include concrete tasks, what PsyLattice can verify automatically, and safe navigation destinations where useful.";
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setPlanBuilding(true);
    setError("");

    try {
      const response = await fetch("/api/psylattice-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_id: primaryStudy?.id || undefined,
          current_screen: currentScreen,
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          context: allowedContext,
          permissions,
          request_plan: true,
          save_history: true,
          conversation_id: conversationId || undefined,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        reply?: string;
        actions?: CopilotAction[];
        plan?: ResearchPlan | null;
        conversationId?: string | null;
        historyWarning?: string | null;
        verifiedState?: VerifiedWorkspaceState | null;
        savedUserMessage?: ChatMessage | null;
        savedAssistantMessage?: ChatMessage | null;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.reply) {
        throw new Error(data.error || "Research Assistant could not build the research plan.");
      }

      setMessages((current) => {
        const next = [...current];
        for (let index = next.length - 1; index >= 0; index -= 1) {
          if (next[index].role === "user" && !next[index].id) {
            next[index] = { ...next[index], ...(data.savedUserMessage || {}) };
            break;
          }
        }
        return [
          ...next,
          { role: "assistant", content: data.reply as string, actions: data.actions || [], ...(data.savedAssistantMessage || {}) },
        ];
      });
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.historyWarning) setHistoryNote(data.historyWarning);
      if (data.verifiedState) setVerifiedState(data.verifiedState);

      if (data.plan) {
        const previousManual = new Set(researchPlan?.manual_completed_task_ids || []);
        const nextPlan: ResearchPlan = {
          ...data.plan,
          generated_at: new Date().toISOString(),
          manual_completed_task_ids: Array.from(previousManual),
        };
        setResearchPlan(nextPlan);
        setExpandedPlanStage(data.plan.stages[0]?.id || "");
        if (data.conversationId) void syncResearchPlan(nextPlan, data.conversationId);
      } else {
        setError("Research Assistant replied, but no structured plan was returned. Try Refresh plan again.");
      }
      window.dispatchEvent(new Event("psylattice-ai-budget-refresh"));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Research Assistant could not build the research plan.");
    } finally {
      setPlanBuilding(false);
    }
  }

  const connectedContextCount = (Object.entries(contexts) as Array<
    [string, PsyLatticeCopilotContextEnvelope]
  >).filter(([surface]) => permissionForSurface(surface, permissions)).length;

  const showHistoryNudge =
    messages.length >= HISTORY_NUDGE_INTERVAL &&
    messages.length - historyNudgeDismissedAt >= HISTORY_NUDGE_INTERVAL;

  function executeAction(action: CopilotAction) {
    if (action.type !== "navigate" || !permissions.navigationActions || !onNavigate) return;
    onNavigate(action.target);
    setOpen(false);
  }

  function newChat() {
    setMessages([]);
    setDraft("");
    setError("");
    setConversationId("");
    setHistoryNote("");
    setHistoryNudgeDismissedAt(0);
  }

  function resetPlan() {
    setResearchPlan(null);
    setExpandedPlanStage("analysis");
    savePlan(null);
    if (conversationId) {
      void fetch("/api/psylattice-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "clear_plan_state",
          save_history: true,
          conversation_id: conversationId,
        }),
      }).catch(() => undefined);
    }
  }

  function taskComplete(task: ResearchPlanTask) {
    if (task.completion === "auto" && task.auto_signal) return Boolean(autoSignals[task.auto_signal]);
    return Boolean(researchPlan?.manual_completed_task_ids?.includes(task.id));
  }

  function toggleManualTask(task: ResearchPlanTask) {
    if (!researchPlan || task.completion !== "manual") return;
    const current = new Set(researchPlan.manual_completed_task_ids || []);
    if (current.has(task.id)) current.delete(task.id);
    else current.add(task.id);
    const nextPlan = { ...researchPlan, manual_completed_task_ids: Array.from(current) };
    setResearchPlan(nextPlan);
    void syncResearchPlan(nextPlan);
  }

  const planProgress = useMemo(() => {
    if (!researchPlan) return { completed: 0, total: 0, percent: 0 };
    const tasks = researchPlan.stages.flatMap((stage) => stage.tasks);
    const completed = tasks.filter((task) => taskComplete(task)).length;
    return {
      completed,
      total: tasks.length,
      percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    };
  // taskComplete intentionally derives from current researchPlan and autoSignals.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchPlan, autoSignals]);

  function stageState(stage: ResearchPlanStage) {
    if (!stage.tasks.length) return "todo";
    const completed = stage.tasks.filter((task) => taskComplete(task)).length;
    if (completed === stage.tasks.length) return "done";
    if (completed > 0) return "review";
    return "todo";
  }

  const stateTone = (state: string) =>
    state === "done"
      ? "bg-cyan-500"
      : state === "review"
        ? "bg-violet-500"
        : state === "waiting"
          ? "bg-amber-400"
          : "bg-slate-300";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          if (!permissions.confirmed) setTab("permissions");
        }}
        className="group fixed bottom-5 right-5 z-[230] isolate h-[52px] w-[52px] overflow-visible rounded-[18px] bg-black shadow-[0_12px_30px_rgba(2,8,23,.24)] transition-[width,transform,box-shadow] duration-[650ms] ease-[cubic-bezier(.22,.8,.25,1)] hover:w-[248px] hover:-translate-y-1 hover:shadow-[0_18px_44px_rgba(2,8,23,.31)] focus-visible:w-[248px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[.985]"
        aria-label={`Open Research Assistant · ${selectedModelName}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[30px] bg-[radial-gradient(circle_at_28%_50%,rgba(34,211,238,.26),transparent_42%),radial-gradient(circle_at_82%_52%,rgba(139,92,246,.20),transparent_40%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
        />

        <span className="relative flex h-full w-full items-center overflow-hidden rounded-[18px] bg-black px-[6px] pr-12 text-white">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-20 w-12 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 blur-md transition-all duration-700 ease-out group-hover:translate-x-[300px] group-hover:opacity-60 group-focus-visible:translate-x-[300px] group-focus-visible:opacity-60 motion-reduce:hidden"
          />

          <AiProviderMark provider={selectedProvider} size="lg" />

          <span className="min-w-0 max-w-0 overflow-hidden text-left opacity-0 transition-[max-width,opacity,margin] duration-[600ms] ease-[cubic-bezier(.22,.8,.25,1)] group-hover:ml-2.5 group-hover:max-w-[150px] group-hover:opacity-100 group-focus-visible:ml-2.5 group-focus-visible:max-w-[150px] group-focus-visible:opacity-100">
            <span className="block whitespace-nowrap text-[11px] font-semibold leading-none tracking-[-0.012em] text-white">
              Research Assistant
            </span>
            <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[8px] font-medium text-slate-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_0_3px_rgba(34,211,238,.10)]" />
              <span className="max-w-[112px] truncate">{selectedModelName}</span>
            </span>
          </span>

          <span className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 opacity-0 transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(.22,.8,.25,1)] group-hover:opacity-100 group-focus-visible:opacity-100">
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
          </span>
        </span>
      </button>

      <style jsx global>{`
        @keyframes researchAssistantDrawerIn {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes researchAssistantBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes researchAssistantMenuIn {
          from { opacity: 0; transform: translateY(-4px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes researchAssistantMessageIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes researchAssistantSoftCardIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes researchAssistantHeaderMarkAmbient {
          0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 4px 14px rgba(8,145,178,.08); }
          50% { transform: translateY(-1px) scale(1.012); box-shadow: 0 7px 20px rgba(8,145,178,.14); }
        }
        @keyframes researchAssistantThinkingDot {
          0%, 80%, 100% { transform: translateY(0) scale(.82); opacity: .38; }
          40% { transform: translateY(-4px) scale(1); opacity: 1; }
        }
        @keyframes researchAssistantAnswerIn {
          0% { opacity: 0; transform: translateY(7px); filter: blur(1.5px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes researchAssistantThinkingGlow {
          0%, 100% { opacity: .35; transform: scale(.96); }
          50% { opacity: .8; transform: scale(1.04); }
        }
        .research-assistant-thinking-dot { animation: researchAssistantThinkingDot 1.15s ease-in-out infinite; }
        .research-assistant-thinking-dot:nth-child(2) { animation-delay: 140ms; }
        .research-assistant-thinking-dot:nth-child(3) { animation-delay: 280ms; }
        .research-assistant-answer { animation: researchAssistantAnswerIn 320ms cubic-bezier(.22,.8,.25,1) both; }
        .research-assistant-thinking-glow { animation: researchAssistantThinkingGlow 1.8s ease-in-out infinite; }

        .research-assistant-drawer {
          animation: researchAssistantDrawerIn 260ms cubic-bezier(.22,.8,.25,1) both;
        }
        .research-assistant-backdrop {
          animation: researchAssistantBackdropIn 180ms ease-out both;
        }
        .research-assistant-model-menu {
          transform-origin: top center;
          animation: researchAssistantMenuIn 180ms cubic-bezier(.22,.8,.25,1) both;
        }
        .research-assistant-message {
          animation: researchAssistantMessageIn 180ms ease-out both;
        }
        .research-assistant-soft-card {
          animation: researchAssistantSoftCardIn 220ms ease-out both;
        }
        .research-assistant-header-mark {
          animation: researchAssistantHeaderMarkAmbient 5.5s ease-in-out infinite;
        }
        @keyframes researchAssistantModelAura {
          0%, 100% { transform: translate3d(0,-50%,0) scale(.92); opacity: .42; }
          50% { transform: translate3d(12px,-50%,0) scale(1.08); opacity: .72; }
        }
        @keyframes researchAssistantModelAuraDelayed {
          0%, 100% { transform: translate3d(0,-50%,0) scale(1.04); opacity: .34; }
          50% { transform: translate3d(-10px,-50%,0) scale(.9); opacity: .64; }
        }
        .research-assistant-model-aura { animation: researchAssistantModelAura 5.8s ease-in-out infinite; }
        .research-assistant-model-aura-delayed { animation: researchAssistantModelAuraDelayed 6.8s ease-in-out infinite; }
        .research-assistant-model-switcher::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(108deg, transparent 18%, rgba(255,255,255,.78) 45%, transparent 72%);
          transform: translateX(-125%);
          transition: transform 850ms cubic-bezier(.2,.8,.2,1);
        }
        .research-assistant-model-switcher { position: relative; overflow: hidden; }
        .research-assistant-model-switcher:hover::after { transform: translateX(125%); }
        @keyframes researchAssistantHistoryNudgeIn {
          from { opacity: 0; transform: translateY(10px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .research-assistant-history-nudge {
          animation: researchAssistantHistoryNudgeIn 240ms cubic-bezier(.22,.8,.25,1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .research-assistant-drawer,
          .research-assistant-backdrop,
          .research-assistant-model-menu,
          .research-assistant-message,
          .research-assistant-soft-card,
          .research-assistant-header-mark,
          .research-assistant-thinking-dot,
          .research-assistant-answer,
          .research-assistant-thinking-glow,
          .research-assistant-model-aura,
          .research-assistant-model-aura-delayed,
          .research-assistant-history-nudge { animation: none !important; }
          .research-assistant-model-switcher::after { display: none; }
        }
      `}</style>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close Research Assistant"
            onClick={() => setOpen(false)}
            className="research-assistant-backdrop fixed inset-0 z-[239] bg-slate-950/20 backdrop-blur-[1px]"
          />
          <aside className="research-assistant-drawer fixed bottom-0 right-0 top-0 z-[240] flex w-[min(640px,100vw)] flex-col border-l border-slate-200 bg-white shadow-[-28px_0_90px_rgba(15,23,42,.22)]">
            <header className="shrink-0 border-b border-slate-200 bg-white px-5 pt-4">
              <div className="flex items-center justify-between gap-4 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="research-assistant-header-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-white shadow-sm">
                    <AiProviderMark provider={selectedProvider} size="md" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[.17em] text-cyan-700">Unified research assistant</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="truncate text-[16px] font-semibold tracking-[-0.015em] text-slate-950">Research Assistant</p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                        {historyLoading ? "Syncing" : conversationId ? "Saved" : "History on"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[9px] text-slate-500">{surfaceLabel(currentScreen)} · {connectedContextCount} permitted context source{connectedContextCount === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative pb-2">
                <button
                  type="button"
                  onClick={() => setModelOpen((value) => !value)}
                  className="research-assistant-model-switcher group/model relative flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-cyan-200/80 bg-[linear-gradient(135deg,rgba(236,254,255,.96)_0%,rgba(255,255,255,.98)_46%,rgba(245,243,255,.96)_100%)] px-3.5 py-2.5 text-left shadow-[0_10px_28px_rgba(15,23,42,.08),0_0_0_1px_rgba(139,92,246,.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_16px_38px_rgba(15,23,42,.11),0_0_22px_rgba(34,211,238,.10)]"
                >
                  <span className="research-assistant-model-aura pointer-events-none absolute -left-8 top-1/2 h-16 w-24 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-2xl" />
                  <span className="research-assistant-model-aura-delayed pointer-events-none absolute -right-6 top-1/2 h-14 w-20 -translate-y-1/2 rounded-full bg-violet-300/20 blur-2xl" />
                  <span className="relative z-10">
                    <AiProviderMark provider={selectedProvider} size="md" />
                  </span>
                  <span className="relative z-10 min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[.11em] text-slate-400">
                      Current model
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,.10)]" />
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] font-semibold tracking-[-0.01em] text-slate-900">{selectedModelName}</span>
                    <span className="mt-0.5 block truncate text-[8px] text-slate-500">{aiProviderLabel(selectedProvider)} · click to switch</span>
                  </span>
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/80 text-slate-500 shadow-sm transition group-hover/model:text-violet-600">
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${modelOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {modelOpen && (
                  <div className="research-assistant-model-menu absolute left-0 right-0 top-[calc(100%-1px)] z-20 max-h-[320px] overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,.22)]">
                    {(modelState.models || []).map((model) => {
                      const locked = !model.allowed || !model.available;
                      return (
                        <button
                          type="button"
                          key={model.key}
                          disabled={modelSaving || locked}
                          onClick={() => void chooseModel(model)}
                          className={`mb-1 flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left last:mb-0 ${model.key === modelState.selectedModel ? "border-cyan-200 bg-cyan-50" : "border-transparent hover:bg-slate-50"} disabled:opacity-50`}
                        >
                          <span className="relative shrink-0">
                            <AiProviderMark provider={aiProviderForModel(model.key, model.name) as AiProviderKey} size="md" />
                            {locked && <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-slate-700 text-white"><LockKeyhole className="h-2.5 w-2.5" /></span>}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold text-slate-800">{model.name}</span>
                            <span className="block truncate text-[9px] text-slate-400">{model.description}</span>
                          </span>
                          {model.key === modelState.selectedModel && <Check className="h-3.5 w-3.5 text-cyan-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <nav className="flex border-b border-slate-200">
                {TAB_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setTab(value)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 px-2 py-3 text-[9px] font-semibold transition-colors ${tab === value ? "text-slate-950" : "text-slate-400 hover:text-slate-700"}`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                    {tab === value && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-cyan-500" />}
                  </button>
                ))}
              </nav>
            </header>

            {tab === "chat" && (
              <>
                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => { setHistoryPanelOpen((value) => !value); if (!historyPanelOpen) void loadHistoryIndex(); }}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[9px] font-semibold transition ${historyPanelOpen ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      <History className="h-3 w-3" />
                      Saved chats
                      {historyStats.conversationCount > 0 && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[7px] text-slate-500">{historyStats.conversationCount}</span>}
                    </button>
                  </div>

                  {historyPanelOpen && (
                    <div ref={historyPanelRef} className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
                        <div>
                          <p className="text-[9px] font-semibold text-slate-900">Chat history</p>
                          <p className="mt-0.5 text-[8.5px] text-slate-400">Saved to your PsyLattice account until you delete it · signing out does not remove chats · pinned messages stay protected</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void deleteUnpinnedHistory()}
                          disabled={historyActionBusy === "delete-history" || historyStats.messageCount === 0}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[7.5px] font-semibold text-slate-500 hover:text-rose-700 disabled:opacity-35"
                        >
                          <Trash2 className="h-3 w-3" /> Delete history
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {historyLoading && historyConversations.length === 0 ? (
                          <div className="flex items-center gap-2 px-2 py-4 text-[8px] text-slate-400"><Loader2 className="h-3 w-3 animate-spin" /> Loading saved chats…</div>
                        ) : historyConversations.length === 0 ? (
                          <p className="px-2 py-4 text-[8px] text-slate-400">No saved chats yet. Your next Research Assistant conversation will appear here automatically.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {historyConversations.map((conversation) => {
                              const active = conversation.id === conversationId;
                              const pinnedCount = Number(conversation.pinned_message_count || 0);
                              return (
                                <div key={conversation.id} className={`group/history flex items-start gap-2 rounded-xl border p-2 ${active ? "border-cyan-200 bg-cyan-50/45" : pinnedCount > 0 ? "border-violet-200 bg-violet-50/30" : "border-slate-100 bg-slate-50/55"}`}>
                                  <button type="button" onClick={() => void openSavedConversation(conversation.id)} className="min-w-0 flex-1 text-left">
                                    <div className="flex items-center gap-1.5">
                                      <p className="truncate text-[10px] font-semibold text-slate-800">{conversation.title.replace(/^Research Assistant ·\s*/, "")}</p>
                                      {pinnedCount > 0 && (
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[6.5px] font-semibold text-violet-700">
                                          <Pin className="h-2.5 w-2.5" /> {pinnedCount}
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-[7.5px] leading-3.5 text-slate-400">{conversation.last_message || `${conversation.message_count} saved messages`}</p>
                                  </button>
                                  <button
                                    type="button"
                                    title={pinnedCount > 0 ? "Delete unpinned history; pinned messages will stay saved" : "Delete chat"}
                                    onClick={() => void deleteSavedConversation(conversation)}
                                    disabled={historyActionBusy === conversation.id}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-30"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div className="space-y-3">
                      <div className="research-assistant-soft-card rounded-2xl bg-cyan-50/60 p-4">
                        <p className="text-[12px] font-semibold text-slate-900">One conversation across your research workflow.</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          Research Assistant follows the permitted study, data, analysis and thesis context as you move through PsyLattice. Last-known module context stays available for this page session and is marked as a snapshot when it is no longer live.
                        </p>
                      </div>
                      {[
                        "What should I do next in this study?",
                        "Guide me step by step from where I am now.",
                        "Connect my latest analysis to what I should write in the thesis.",
                        "What information can you currently see?",
                      ].map((prompt) => (
                        <button
                          type="button"
                          key={prompt}
                          onClick={() => void send(prompt)}
                          className="group/prompt flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left text-[11px] font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/30 hover:shadow-[0_8px_22px_rgba(15,23,42,.07)]"
                        >
                          <span>{prompt}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover/prompt:translate-x-0.5 group-hover/prompt:text-cyan-600" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {messages.map((message, index) => {
                        const pinned = Boolean(message.pinned_at);
                        if (message.role === "user") {
                          return (
                            <div key={message.id || `${message.role}-${index}`} className="group/message research-assistant-message ml-auto max-w-[82%]">
                              <div className={`rounded-[18px] bg-slate-950 px-4 py-3 text-[13px] leading-[1.65] text-white shadow-sm ${pinned ? "ring-2 ring-violet-300/80" : ""}`}>
                                {message.content}
                              </div>
                              <div className="mt-1 flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => void copyMessageText(message, `user-${index}`)}
                                  title="Copy message"
                                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[8px] font-semibold transition ${copiedMessageKey === (message.id || `user-${index}`) ? "bg-cyan-50 text-cyan-700 opacity-100" : "text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover/message:opacity-100 group-focus-within/message:opacity-100"}`}
                                >
                                  {copiedMessageKey === (message.id || `user-${index}`) ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                                  {copiedMessageKey === (message.id || `user-${index}`) ? "Copied" : "Copy"}
                                </button>
                                {message.id && (
                                  <button
                                    type="button"
                                    onClick={() => void setMessagePinned(message, !pinned)}
                                    disabled={historyActionBusy === message.id}
                                    title={pinned ? "Unpin this message" : "Pin this message"}
                                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[8px] font-semibold transition ${pinned ? "bg-violet-50 text-violet-700 opacity-100" : "text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover/message:opacity-100 group-focus-within/message:opacity-100"} disabled:opacity-35`}
                                  >
                                    {pinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
                                    {pinned ? "Pinned" : "Pin"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={message.id || `${message.role}-${index}`} className="group/message research-assistant-answer w-full">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                                <AiProviderMark provider={selectedProvider} size="sm" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`rounded-xl px-1 py-0.5 ${pinned ? "bg-violet-50/60 ring-1 ring-violet-200" : ""}`}>
                                  <MarkdownMessage content={message.content} />
                                </div>
                                <div className="mt-1.5 flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => void copyMessageText(message, `assistant-${index}`)}
                                    title="Copy message"
                                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[8px] font-semibold transition ${copiedMessageKey === (message.id || `assistant-${index}`) ? "bg-cyan-50 text-cyan-700 opacity-100" : "text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover/message:opacity-100 group-focus-within/message:opacity-100"}`}
                                  >
                                    {copiedMessageKey === (message.id || `assistant-${index}`) ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                                    {copiedMessageKey === (message.id || `assistant-${index}`) ? "Copied" : "Copy"}
                                  </button>
                                  {message.id && (
                                    <button
                                      type="button"
                                      onClick={() => void setMessagePinned(message, !pinned)}
                                      disabled={historyActionBusy === message.id}
                                      title={pinned ? "Unpin this message" : "Pin this message"}
                                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[8px] font-semibold transition ${pinned ? "bg-violet-50 text-violet-700 opacity-100" : "text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover/message:opacity-100 group-focus-within/message:opacity-100"} disabled:opacity-35`}
                                    >
                                      {pinned ? <PinOff className="h-2.5 w-2.5" /> : <Pin className="h-2.5 w-2.5" />}
                                      {pinned ? "Pinned" : "Pin"}
                                    </button>
                                  )}
                                </div>
                                {message.actions?.length ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {message.actions.map((action) => (
                                      <button
                                        type="button"
                                        key={`${action.target}-${action.label}`}
                                        disabled={!permissions.navigationActions || !onNavigate}
                                        onClick={() => executeAction(action)}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[9px] font-semibold text-cyan-900 transition hover:bg-cyan-100 disabled:opacity-40"
                                      >
                                        <Navigation className="h-3 w-3" />
                                        {action.label}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {sending && (
                        <div className="flex w-full items-start gap-3 py-1">
                          <div className="research-assistant-thinking-glow mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-white shadow-sm">
                            <AiProviderMark provider={selectedProvider} size="sm" />
                          </div>
                          <div className="pt-1">
                            <div className="flex h-5 items-center gap-1.5">
                              <span className="research-assistant-thinking-dot h-1.5 w-1.5 rounded-full bg-cyan-500" />
                              <span className="research-assistant-thinking-dot h-1.5 w-1.5 rounded-full bg-cyan-500" />
                              <span className="research-assistant-thinking-dot h-1.5 w-1.5 rounded-full bg-cyan-500" />
                            </div>
                            <p className="mt-0.5 text-[9px] font-medium text-slate-400">Research Assistant is working…</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {error && (
                    <div className="pl-inline-error mt-4 border-l-2 border-rose-400 px-3 py-2 text-[10px] leading-5 text-slate-600">
                      {error}
                    </div>
                  )}
                </div>
                {showHistoryNudge && (
                  <div className="shrink-0 px-4 pt-2 sm:px-5">
                    <div className="research-assistant-history-nudge relative overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,.14)]">
                      <span className="absolute inset-y-0 left-0 w-[3px] bg-rose-500" />
                      <div className="flex items-start gap-3 px-4 py-3.5 pl-5">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600">
                          <TriangleAlert className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1 pr-7">
                          <p className="text-[11px] font-semibold text-slate-900">Keep Research Assistant running smoothly</p>
                          <p className="mt-1 text-[10px] leading-5 text-slate-600">
                            For the best experience, delete chats you no longer need. Pin important messages first — pinned messages stay protected and remain available from Context and saved chat history.
                          </p>
                          <button
                            type="button"
                            onClick={reviewSavedChats}
                            className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-rose-700 transition hover:text-rose-900"
                          >
                            Review saved chats <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHistoryNudgeDismissedAt(messages.length)}
                          aria-label="Dismiss chat history reminder"
                          title="Dismiss"
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-3 pt-3 sm:px-5">
                  <div className="rounded-[24px] border border-slate-200 bg-white px-3 py-2.5 shadow-[0_10px_30px_rgba(15,23,42,.08)] transition focus-within:border-cyan-300 focus-within:shadow-[0_14px_34px_rgba(8,145,178,.10)]">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void send();
                        }
                      }}
                      rows={2}
                      placeholder="Message Research Assistant…"
                      className="max-h-44 min-h-[54px] w-full resize-none bg-transparent px-1 py-1 text-[13px] leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="hidden text-[8px] text-slate-400 sm:inline">Enter to send · Shift + Enter for new line</span>
                        <button type="button" onClick={() => { setHistoryPanelOpen(true); void loadHistoryIndex(); }} className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-400 hover:text-slate-700">
                          <History className="h-3 w-3" /> History
                        </button>
                        <button type="button" onClick={newChat} className="text-[9px] font-semibold text-slate-400 hover:text-slate-700">New chat</button>
                      </div>
                      <button
                        type="button"
                        disabled={sending || !draft.trim()}
                        onClick={() => void send()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm transition hover:scale-[1.03] hover:bg-slate-800 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Send message"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 px-1 text-[8.5px] text-slate-400">Statistics remain deterministic. Research Assistant uses only permitted context and server-verified study state.</p>
                </div>
              </>
            )}

            {tab === "plan" && (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {researchPlan ? (
                  <>
                    <div className="rounded-2xl border border-violet-200 bg-[linear-gradient(135deg,rgba(245,243,255,.95),rgba(236,254,255,.8))] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4 text-violet-700" />
                            <p className="text-[10px] font-semibold text-violet-950">{researchPlan.title}</p>
                          </div>
                          <p className="mt-1 text-[9px] leading-4 text-slate-600">{researchPlan.summary}</p>
                        </div>
                        <button
                          type="button"
                          onClick={resetPlan}
                          title="Reset plan"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/75 text-slate-400 hover:text-slate-700"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[8px] font-semibold text-slate-500">
                        <span>{planProgress.completed}/{planProgress.total} tasks complete</span>
                        <span>{planProgress.percent}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/90">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all" style={{ width: `${planProgress.percent}%` }} />
                      </div>
                    </div>

                    <div className="relative mt-4 space-y-2 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-slate-200">
                      {researchPlan.stages.map((stage, stageIndex) => {
                        const openStage = expandedPlanStage === stage.id;
                        const state = stageState(stage);
                        const completeCount = stage.tasks.filter((task) => taskComplete(task)).length;
                        return (
                          <div key={stage.id} className="relative pl-9">
                            <span className={`absolute left-[10px] top-4 z-10 h-3 w-3 rounded-full border-2 border-white ${stateTone(state)} shadow-sm`} />
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                              <button
                                type="button"
                                onClick={() => setExpandedPlanStage(openStage ? "" : stage.id)}
                                className="w-full p-3 text-left"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">Step {stageIndex + 1}</p>
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[7px] font-semibold text-slate-500">{completeCount}/{stage.tasks.length}</span>
                                    </div>
                                    <p className="mt-0.5 text-[9px] font-semibold text-slate-800">{stage.title}</p>
                                  </div>
                                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${openStage ? "rotate-180" : ""}`} />
                                </div>
                              </button>

                              {openStage && (
                                <div className="border-t border-slate-100 px-3 pb-3 pt-2">
                                  <p className="text-[8px] leading-4 text-slate-500">{stage.goal}</p>
                                  <div className="mt-3 space-y-2">
                                    {stage.tasks.map((task) => {
                                      const complete = taskComplete(task);
                                      const auto = task.completion === "auto";
                                      return (
                                        <div key={task.id} className={`rounded-xl border p-2.5 ${complete ? "border-cyan-100 bg-cyan-50/50" : "border-slate-200 bg-slate-50/60"}`}>
                                          <div className="flex items-start gap-2.5">
                                            <button
                                              type="button"
                                              disabled={auto}
                                              onClick={() => toggleManualTask(task)}
                                              title={auto ? "Automatically verified from PsyLattice context" : complete ? "Mark incomplete" : "Mark complete"}
                                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                                complete
                                                  ? "border-cyan-500 bg-cyan-500 text-white"
                                                  : auto
                                                    ? "border-slate-200 bg-white text-transparent"
                                                    : "border-slate-300 bg-white text-transparent hover:border-violet-400"
                                              }`}
                                            >
                                              <Check className="h-3 w-3" />
                                            </button>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <p className={`text-[8.5px] font-semibold ${complete ? "text-slate-500 line-through" : "text-slate-800"}`}>{task.title}</p>
                                                <span className={`rounded-full px-1.5 py-0.5 text-[6.5px] font-bold uppercase tracking-[.08em] ${auto ? "bg-cyan-100 text-cyan-700" : "bg-violet-100 text-violet-700"}`}>
                                                  {auto ? "Auto" : "Manual"}
                                                </span>
                                              </div>
                                              <p className="mt-0.5 text-[7.5px] leading-3.5 text-slate-400">{task.detail}</p>
                                              {task.action && (
                                                <button
                                                  type="button"
                                                  disabled={!permissions.navigationActions || !onNavigate}
                                                  onClick={() => executeAction(task.action as CopilotAction)}
                                                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-2.5 py-1.5 text-[7.5px] font-semibold text-cyan-800 disabled:opacity-40"
                                                >
                                                  <Navigation className="h-3 w-3" />
                                                  {task.action.label}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={planBuilding}
                      onClick={() => void buildResearchPlan()}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[9px] font-semibold text-white disabled:opacity-50"
                    >
                      {planBuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {planBuilding ? "Refreshing plan…" : "Refresh plan with Research Assistant"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                      <div className="flex items-start gap-3">
                        <ListChecks className="mt-0.5 h-4 w-4 text-violet-700" />
                        <div>
                          <p className="text-[10px] font-semibold text-violet-950">Build a research plan from your actual PsyLattice context</p>
                          <p className="mt-1 text-[9px] leading-4 text-violet-800">
                            Research Assistant can turn permitted thesis ideas, study design, collected data and analysis state into a task-by-task workflow. Tasks that PsyLattice can verify will complete automatically; external or judgment-based tasks remain manual checkboxes.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative mt-4 space-y-2 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-slate-200">
                      {fallbackPlanStages.map((stage, index) => {
                        const openStage = expandedPlanStage === stage.id;
                        return (
                          <div key={stage.id} className="relative pl-9">
                            <span className={`absolute left-[10px] top-4 z-10 h-3 w-3 rounded-full border-2 border-white ${stateTone(stage.state)} shadow-sm`} />
                            <button
                              type="button"
                              onClick={() => setExpandedPlanStage(openStage ? "" : stage.id)}
                              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">Step {index + 1}</p>
                                  <p className="mt-0.5 text-[9px] font-semibold text-slate-800">{stage.title}</p>
                                </div>
                                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${openStage ? "rotate-180" : ""}`} />
                              </div>
                              {openStage && <div className="mt-2 border-t border-slate-100 pt-2 text-[8px] leading-4 text-slate-500">{stage.detail}</div>}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={planBuilding}
                      onClick={() => void buildResearchPlan()}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[9px] font-semibold text-white disabled:opacity-50"
                    >
                      {planBuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {planBuilding ? "Building research plan…" : "Build plan with Research Assistant"}
                    </button>
                  </>
                )}

                {error && (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[9px] leading-4 text-rose-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {tab === "context" && (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[9px] font-semibold text-slate-900">Current location</p>
                  <p className="mt-1 text-[9px] text-slate-500">{surfaceLabel(currentScreen)}</p>
                </div>
                {pinnedMessages.length > 0 && (
                  <div className="mt-3 rounded-2xl border border-violet-200 bg-[linear-gradient(180deg,rgba(250,245,255,.72),rgba(255,255,255,.94))] p-3.5">
                    <div className="flex items-center gap-2">
                      <Pin className="h-3.5 w-3.5 text-violet-700" />
                      <p className="text-[10px] font-semibold text-violet-950">Pinned messages</p>
                    </div>
                    <p className="mt-1 text-[8.5px] leading-4 text-violet-800/70">Pinned messages keep the same appearance they had in Chat, stay protected from bulk deletion, and remain available as background continuity.</p>
                    <div className="mt-4 space-y-5">
                      {pinnedMessages.slice(0, 24).map((message) => (
                        <div key={message.id} className="research-assistant-soft-card">
                          {message.role === "user" ? (
                            <div className="ml-auto max-w-[82%]">
                              <div className="rounded-[18px] bg-slate-950 px-4 py-3 text-[13px] leading-[1.65] text-white shadow-sm ring-2 ring-violet-300/60">
                                {message.content}
                              </div>
                              <div className="mt-1 flex justify-end">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[8px] font-semibold text-violet-700"><Pin className="h-2.5 w-2.5" />Pinned</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
                                  <AiProviderMark provider={selectedProvider} size="sm" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="rounded-xl bg-violet-50/60 px-1 py-0.5 ring-1 ring-violet-200">
                                    <MarkdownMessage content={message.content} />
                                  </div>
                                  <div className="mt-1.5"><span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 text-[8px] font-semibold text-violet-700"><Pin className="h-2.5 w-2.5" />Pinned</span></div>
                                </div>
                              </div>
                            </div>
                          )}
                          <button type="button" onClick={() => { setTab("chat"); setHistoryPanelOpen(true); void openSavedConversation(message.conversation_id); }} className="mt-2 text-[8px] font-semibold text-slate-400 hover:text-slate-700">Open in chat · {message.conversation_title.replace(/^Research Assistant ·\s*/, "")}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  {(Object.values(contexts) as PsyLatticeCopilotContextEnvelope[]).length === 0 && (
                    <p className="rounded-2xl border border-slate-200 bg-white p-4 text-[9px] text-slate-500">
                      No live browser module has published context yet. With permission, the server can still load owned study and Thesis Builder records when you ask a question.
                    </p>
                  )}
                  {(Object.values(contexts) as PsyLatticeCopilotContextEnvelope[]).map((item) => {
                    const allowed = permissionForSurface(item.surface, permissions);
                    return (
                      <div key={item.surface} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[9px] font-semibold text-slate-800">{item.label}</p>
                            <p className="mt-0.5 truncate text-[8px] text-slate-400">
                              {item.studyTitle || "Workspace context"} · {item.active ? "Live" : "Last known"}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[7px] font-semibold ${allowed ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-400"}`}>
                            {allowed ? "Permitted" : "Blocked"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearCopilotContexts();
                    setContexts({});
                  }}
                  className="mt-4 text-[8px] font-semibold text-slate-400 hover:text-slate-700"
                >
                  Clear last-known browser context
                </button>
              </div>
            )}

            {tab === "permissions" && (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-900">Choose what Research Assistant can use</p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-500">
                        Grant this once and change it whenever you want. Participant-level rows and direct identifiers remain off by default. Research Assistant chat history is saved to your PsyLattice account automatically; you can delete chats and pin individual messages from the Chat tab.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mb-2 mt-4 text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">Read access</p>
                <div className="space-y-2">
                  {READ_PERMISSION_OPTIONS.map(({ key, title, detail, icon: Icon, unavailable }) => {
                    const enabled = Boolean(permissions[key]);
                    return (
                      <button
                        type="button"
                        key={key}
                        disabled={unavailable}
                        onClick={() => togglePermission(key)}
                        className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left disabled:opacity-55"
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-400"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[9px] font-semibold text-slate-800">{title}</span>
                            {unavailable && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[7px] font-semibold text-violet-700">
                                Waiting for engineer integration
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[8px] leading-4 text-slate-400">{detail}</span>
                        </span>
                        <span className={`mt-1 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${enabled ? "bg-cyan-500" : "bg-slate-200"}`}>
                          <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "translate-x-4" : "translate-x-0"}`} />
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mb-2 mt-5 text-[8px] font-bold uppercase tracking-[.12em] text-slate-400">Action access</p>
                <div className="space-y-2">
                  {ACTION_PERMISSION_OPTIONS.map(({ key, title, detail }) => {
                    const enabled = Boolean(permissions[key]);
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => togglePermission(key)}
                        className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left"
                      >
                        <span className={`mt-1 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${enabled ? "bg-violet-500" : "bg-slate-200"}`}>
                          <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "translate-x-4" : "translate-x-0"}`} />
                        </span>
                        <span>
                          <span className="block text-[9px] font-semibold text-slate-800">{title}</span>
                          <span className="mt-0.5 block text-[8px] leading-4 text-slate-400">{detail}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 flex gap-2">
                  {!permissions.confirmed ? (
                    <button
                      type="button"
                      onClick={confirmPermissions}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[9px] font-semibold text-white"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Allow selected access
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        persistPermissionChanges();
                        setTab("chat");
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-[9px] font-semibold text-white"
                    >
                      <Check className="h-3.5 w-3.5" /> Save permissions
                    </button>
                  )}
                </div>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
