"use client";

import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronDown,
  Database,
  FileText,
  ListChecks,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Navigation,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  role: "user" | "assistant";
  content: string;
  actions?: CopilotAction[];
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
const CHAT_KEY = "psylattice.copilot.chat.session.v1";
const PLAN_KEY = "psylattice.research-assistant.plan.session.v1";

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
    detail: "Owned study design, measures, phases and high-level status.",
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
    detail: "Study task structure and verified task context when available.",
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
  {
    key: "saveHistory",
    title: "Save this Research Assistant conversation",
    detail: "Keeps the same unified chat and Research Plan available after refresh or sign-in. Stored in your own PsyLattice account.",
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
  saveHistory: false,
  applyAnalysisSetup: false,
  draftCreation: false,
};

function readPermissions(): Permissions {
  if (typeof window === "undefined") return DEFAULT_PERMISSIONS;
  try {
    const stored = window.localStorage.getItem(PERMISSION_KEY);
    if (!stored) return DEFAULT_PERMISSIONS;
    return { ...DEFAULT_PERMISSIONS, ...(JSON.parse(stored) as Partial<Permissions>) };
  } catch {
    return DEFAULT_PERMISSIONS;
  }
}

function savePermissions(value: Permissions) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PERMISSION_KEY, JSON.stringify(value));
}

function readChat(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed.slice(-40) : [];
  } catch {
    return [];
  }
}

function saveChat(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    // Session persistence is a convenience only; chat still works in memory.
  }
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
  if (surface === "cognitive") return permissions.cognitive;
  if (surface === "ambulatory") return permissions.ambulatory;
  if (surface === "data_explorer") return permissions.dataExplorer;
  if (surface === "research" || surface === "study_builder") return permissions.studyStructure;
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
}: {
  provider: AiProviderKey;
  size?: "sm" | "md" | "lg";
}) {
  const boxClass =
    size === "lg" ? "h-10 w-10" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const imageClass =
    size === "lg" ? "h-6 w-6" : size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (provider === "psylattice") {
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
  const [verifiedState, setVerifiedState] = useState<VerifiedWorkspaceState>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const next = readPermissions();
    setPermissions(next);
    setMessages(readChat());
    setResearchPlan(readPlan());
    if (!next.confirmed) {
      setTab("permissions");
      return;
    }
    if (next.saveHistory) void resumeSavedConversation();
    // resumeSavedConversation is intentionally called only once from the persisted permission snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveChat(messages);
  }, [messages]);

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

    included.permissions = {
      study_structure: permissions.studyStructure,
      data_explorer: permissions.dataExplorer,
      analysis: permissions.analysis,
      thesis: permissions.thesis,
      cognitive: permissions.cognitive,
      ambulatory: permissions.ambulatory,
      navigation_actions: permissions.navigationActions,
      save_history: permissions.saveHistory,
      apply_analysis_setup: permissions.applyAnalysisSetup,
      draft_creation: permissions.draftCreation,
      participant_rows: permissions.participantRows,
      direct_identifiers: permissions.directIdentifiers,
      navigation_handler_connected: Boolean(onNavigate),
    };

    return included;
  }, [contexts, currentScreen, onNavigate, permissions]);

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

  async function resumeSavedConversation() {
    setHistoryLoading(true);
    setHistoryNote("");
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
      if (data.warning) setHistoryNote(data.warning);
      if (data.conversation?.id) setConversationId(String(data.conversation.id));
      if (Array.isArray(data.messages) && data.messages.length) setMessages(data.messages.slice(-80));
      if (data.plan) {
        setResearchPlan(data.plan);
        setExpandedPlanStage(data.plan.stages[0]?.id || "analysis");
      }
      if (data.verifiedState) setVerifiedState(data.verifiedState);
    } catch (failure) {
      setHistoryNote(failure instanceof Error ? failure.message : "Saved Research Assistant history is unavailable; this tab will continue using session-only history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function syncResearchPlan(nextPlan: ResearchPlan, targetConversationId = conversationId) {
    if (!permissions.saveHistory || !targetConversationId) return;
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
    if (next.saveHistory) void resumeSavedConversation();
  }

  function persistPermissionChanges() {
    savePermissions(permissions);
    if (permissions.saveHistory && !conversationId && !historyLoading) void resumeSavedConversation();
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
          save_history: permissions.saveHistory,
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
        error?: string;
      };
      if (!response.ok || !data.ok || !data.reply) {
        throw new Error(data.error || "Research Assistant could not respond.");
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply as string, actions: data.actions || [] },
      ]);
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.historyWarning) setHistoryNote(data.historyWarning);
      if (data.verifiedState) setVerifiedState(data.verifiedState);
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
          save_history: permissions.saveHistory,
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
        error?: string;
      };
      if (!response.ok || !data.ok || !data.reply) {
        throw new Error(data.error || "Research Assistant could not build the research plan.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply as string, actions: data.actions || [] },
      ]);
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
        if (permissions.saveHistory && data.conversationId) void syncResearchPlan(nextPlan, data.conversationId);
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
    if (typeof window !== "undefined") window.sessionStorage.removeItem(CHAT_KEY);
  }

  function resetPlan() {
    setResearchPlan(null);
    setExpandedPlanStage("analysis");
    savePlan(null);
    if (permissions.saveHistory && conversationId) {
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
        className="group fixed bottom-5 right-5 z-[230] isolate rounded-[22px] bg-[linear-gradient(135deg,rgba(34,211,238,.72),rgba(99,102,241,.42)_52%,rgba(139,92,246,.58))] p-px shadow-[0_14px_36px_rgba(2,8,23,.22),0_4px_14px_rgba(6,182,212,.12)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(2,8,23,.28),0_8px_26px_rgba(6,182,212,.18)] active:translate-y-0 active:scale-[.985]"
        aria-label="Open Research Assistant"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 -z-10 rounded-[30px] bg-[radial-gradient(circle_at_24%_48%,rgba(34,211,238,.24),transparent_42%),radial-gradient(circle_at_82%_52%,rgba(139,92,246,.18),transparent_40%)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        />

        <span className="relative flex items-center gap-3 overflow-hidden rounded-[21px] bg-[linear-gradient(135deg,rgba(7,17,30,.98),rgba(15,23,42,.97)_58%,rgba(20,25,45,.98))] px-3 py-2.5 text-white backdrop-blur-xl">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-20 w-12 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 blur-md transition-all duration-700 ease-out group-hover:translate-x-[300px] group-hover:opacity-70 motion-reduce:hidden"
          />

          <span className="shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.035]">
            <AiProviderMark provider={selectedProvider} size="lg" />
          </span>

          <span className="min-w-0 text-left">
            <span className="block whitespace-nowrap text-[11px] font-semibold leading-none tracking-[-0.012em] text-white">
              Research Assistant
            </span>
            <span className="mt-1.5 flex min-w-0 items-center gap-1.5 text-[8px] font-medium text-slate-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300 shadow-[0_0_0_3px_rgba(34,211,238,.10)] transition-transform duration-300 group-hover:scale-110" />
              <span className="max-w-[126px] truncate">{selectedModelName}</span>
            </span>
          </span>

          <span className="ml-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 shadow-sm transition-all duration-300 group-hover:border-cyan-300/40 group-hover:bg-cyan-300/10 group-hover:text-cyan-200">
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
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
        .research-assistant-model-switcher::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(110deg, transparent 18%, rgba(255,255,255,.08) 44%, transparent 70%);
          transform: translateX(-120%);
          transition: transform 650ms cubic-bezier(.2,.8,.2,1);
        }
        .research-assistant-model-switcher { position: relative; overflow: hidden; }
        .research-assistant-model-switcher:hover::after { transform: translateX(120%); }
        @media (prefers-reduced-motion: reduce) {
          .research-assistant-drawer,
          .research-assistant-backdrop,
          .research-assistant-model-menu,
          .research-assistant-message,
          .research-assistant-soft-card { animation: none !important; }
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
          <aside className="research-assistant-drawer fixed bottom-0 right-0 top-0 z-[240] flex w-[min(490px,96vw)] flex-col border-l border-slate-200 bg-white shadow-[-28px_0_90px_rgba(15,23,42,.22)]">
            <header className="shrink-0 border-b border-slate-200 bg-[radial-gradient(circle_at_0%_0%,rgba(34,211,238,.13),transparent_36%),radial-gradient(circle_at_100%_0%,rgba(139,92,246,.10),transparent_34%),#fff] px-4 pb-3 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-white text-cyan-800 shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[.16em] text-cyan-700">
                      Unified research assistant
                    </p>
                    <p className="mt-0.5 truncate text-[15px] font-semibold text-slate-950">Research Assistant</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[9px] text-slate-500">
                        {surfaceLabel(currentScreen)} · {connectedContextCount} permitted context source
                        {connectedContextCount === 1 ? "" : "s"}
                      </p>
                      {permissions.saveHistory && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[6.5px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                          {historyLoading ? "Syncing" : conversationId ? "Saved" : "History on"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mt-3">
                <button
                  type="button"
                  onClick={() => setModelOpen((value) => !value)}
                  className="research-assistant-model-switcher group/model flex w-full items-center gap-2.5 rounded-2xl border border-slate-700/80 bg-[linear-gradient(135deg,#0b1220_0%,#111c31_58%,#17213a_100%)] px-3 py-2.5 text-left shadow-[0_10px_26px_rgba(15,23,42,.18),0_0_0_1px_rgba(34,211,238,.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/45 hover:shadow-[0_14px_34px_rgba(15,23,42,.22),0_0_24px_rgba(34,211,238,.10)]"
                >
                  <AiProviderMark provider={selectedProvider} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400 group-hover/model:text-cyan-300/80">
                      Current model
                    </span>
                    <span className="block truncate text-[10px] font-semibold text-white">{selectedModelName}</span>
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-300 transition-all duration-300 group-hover/model:text-cyan-200 ${modelOpen ? "rotate-180" : ""}`} />
                </button>
                {modelOpen && (
                  <div className="research-assistant-model-menu absolute left-0 right-0 top-[calc(100%+7px)] z-20 max-h-[300px] overflow-auto rounded-2xl border border-cyan-200/70 bg-white/95 p-2 shadow-[0_22px_54px_rgba(15,23,42,.24),0_0_0_1px_rgba(34,211,238,.05)] backdrop-blur-xl">
                    {(modelState.models || []).map((model) => {
                      const locked = !model.allowed || !model.available;
                      return (
                        <button
                          type="button"
                          key={model.key}
                          disabled={modelSaving || locked}
                          onClick={() => void chooseModel(model)}
                          className={`mb-1 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left last:mb-0 ${
                            model.key === modelState.selectedModel
                              ? "border-cyan-200 bg-cyan-50"
                              : "border-transparent hover:bg-slate-50"
                          } disabled:opacity-50`}
                        >
                          <span className="relative shrink-0">
                            <AiProviderMark
                              provider={aiProviderForModel(model.key, model.name) as AiProviderKey}
                              size="md"
                            />
                            {locked && (
                              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-slate-700 text-white">
                                <LockKeyhole className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[10px] font-semibold text-slate-800">{model.name}</span>
                            <span className="block truncate text-[8px] text-slate-400">{model.description}</span>
                          </span>
                          {model.key === modelState.selectedModel && <Check className="h-3.5 w-3.5 text-cyan-700" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <nav className="mt-3 flex gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/90 p-1 shadow-inner">
                {TAB_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setTab(value)}
                    className={`research-assistant-tab flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[8px] font-semibold transition-all duration-200 ${
                      tab === value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    <Icon className="h-3 w-3" /> {label}
                  </button>
                ))}
              </nav>
            </header>

            {tab === "chat" && (
              <>
                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  {messages.length === 0 ? (
                    <div className="space-y-3">
                      <div className="research-assistant-soft-card rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                        <p className="text-[10px] font-semibold text-slate-900">One conversation across your research workflow.</p>
                        <p className="mt-1 text-[9px] leading-4 text-slate-500">
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
                          className="group/prompt flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-[9px] font-medium text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/30 hover:shadow-[0_8px_22px_rgba(15,23,42,.07)]"
                        >
                          <span>{prompt}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover/prompt:translate-x-0.5 group-hover/prompt:text-cyan-600" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message, index) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`research-assistant-message ${message.role === "user" ? "ml-auto max-w-[88%]" : "mr-auto max-w-[94%]"}`}
                        >
                          <div
                            className={`whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-[10px] leading-5 ${
                              message.role === "user"
                                ? "bg-slate-950 text-white"
                                : "border border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {message.content}
                          </div>
                          {message.role === "assistant" && message.actions?.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {message.actions.map((action) => (
                                <button
                                  type="button"
                                  key={`${action.target}-${action.label}`}
                                  disabled={!permissions.navigationActions || !onNavigate}
                                  onClick={() => executeAction(action)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[8px] font-semibold text-cyan-900 disabled:opacity-40"
                                >
                                  <Navigation className="h-3 w-3" />
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {sending && (
                        <div className="mr-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[10px] text-slate-400">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Research Assistant is thinking…
                        </div>
                      )}
                    </div>
                  )}
                  {error && (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[9px] leading-4 text-rose-700">
                      {error}
                    </div>
                  )}
                </div>
                <div className="shrink-0 border-t border-slate-200 bg-white p-3">
                  <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-cyan-300 focus-within:bg-white">
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
                      placeholder="Ask Research Assistant…"
                      className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent px-1 py-1 text-[10px] leading-5 text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      disabled={sending || !draft.trim()}
                      onClick={() => void send()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white disabled:opacity-35"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-[7px] text-slate-400">Statistics remain deterministic. Research Assistant guides from permitted context and server-verified study state.</p>
                    <button type="button" onClick={newChat} className="shrink-0 text-[8px] font-semibold text-slate-400 hover:text-slate-700">
                      New chat
                    </button>
                  </div>
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
                        Grant this once and change it whenever you want. Participant-level rows and direct identifiers remain off by default. Enable saved history if you want this same unified chat and Research Plan to resume across browser sessions.
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
