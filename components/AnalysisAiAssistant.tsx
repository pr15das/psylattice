"use client";

import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Check,
  Database,
  FileText,
  FolderOpen,
  History,
  LockKeyhole,
  Minimize2,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AnalysisAiVariableContext = {
  name: string;
  label: string;
  source?: string;
  level: string;
  validCount?: number;
  missingCount?: number;
  distinctCount?: number;
  levels?: string[];
  isIdentifier?: boolean;
};

export type AnalysisAiTableContext = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  note?: string;
};

export type AnalysisAiSetupProposal = {
  schema_version: 1;
  analysis_id: string;
  analysis_label: string;
  title: string;
  rationale: string;
  setup: Record<string, unknown>;
  selected_variables?: string[];
  review_steps?: string[];
  cautions?: string[];
  requires_raw_rows?: boolean;
  can_apply: boolean;
};

export type AnalysisAiPreparationStep =
  | {
      kind: "working_view";
      label: string;
      reason?: string;
      view: "raw" | "prepared";
    }
  | {
      kind: "filter";
      label: string;
      reason?: string;
      variable: string;
      operator: "equals" | "not_equals" | "contains" | "not_contains" | "gt" | "gte" | "lt" | "lte" | "is_missing" | "not_missing";
      value?: string;
    }
  | {
      kind: "numeric_transform";
      label: string;
      reason?: string;
      source_variable: string;
      output_variable: string;
      transform: "zscore" | "center" | "ln" | "log10" | "sqrt" | "absolute";
    }
  | {
      kind: "computed_variable";
      label: string;
      reason?: string;
      left_variable: string;
      right_variable: string;
      output_variable: string;
      operation: "difference" | "sum" | "mean" | "ratio" | "product";
    }
  | {
      kind: "recode";
      label: string;
      reason?: string;
      source_variable: string;
      output_variable: string;
      mappings: Array<{ from: string; to: string }>;
      keep_unmapped?: boolean;
    }
  | {
      kind: "repeated_variable";
      label: string;
      reason?: string;
      cluster_variable: string;
      time_variable?: string;
      source_variable?: string;
      output_variable: string;
      operation: "observation_index" | "elapsed_time" | "cluster_mean" | "within_cluster_center" | "lag1" | "change_from_previous";
    };

export type AnalysisAiWorkflowProposal = {
  schema_version: 1;
  title: string;
  rationale: string;
  source_data_fingerprint?: string;
  preparation_steps: AnalysisAiPreparationStep[];
  analysis_setup?: AnalysisAiSetupProposal | null;
  review_steps?: string[];
  cautions?: string[];
  can_apply: boolean;
};

export type AnalysisAiContext = {
  schema_version: string;
  generated_at?: string;
  source_policy: Record<string, unknown>;
  study: {
    id?: string;
    title?: string;
  };
  dataset: Record<string, unknown>;
  sample: Record<string, unknown>;
  preparation: Record<string, unknown>;
  variables: AnalysisAiVariableContext[];
  current_analysis: {
    id: string;
    label: string;
    setup: Record<string, unknown>;
    selected_variables: string[];
    data_fingerprint?: string;
    primary_result?: AnalysisAiTableContext | null;
    supplementary_results?: AnalysisAiTableContext[];
  };
  saved_analysis_records?: Array<Record<string, unknown>>;
  capability_registry: Array<Record<string, unknown>>;
  apply_setup_schema?: Record<string, unknown>;
  apply_preparation_schema?: Record<string, unknown>;
};

type WorkingRow = Record<string, string | number | boolean | null>;

type ApplySetupResult = { ok: boolean; message: string };

type Props = {
  studyId?: string;
  studyTitle?: string;
  datasetLabel: string;
  context: AnalysisAiContext;
  workingRows?: WorkingRow[];
  workingRowsTotal?: number;
  onApplySetup?: (proposal: AnalysisAiSetupProposal) => ApplySetupResult;
  onApplyWorkflow?: (proposal: AnalysisAiWorkflowProposal) => ApplySetupResult;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  proposal?: AnalysisAiSetupProposal | null;
  workflow?: AnalysisAiWorkflowProposal | null;
};

type FolderRow = {
  id: string;
  parent_folder_id: string | null;
  name: string;
  position: number;
};

type DocumentRow = {
  id: string;
  folder_id: string | null;
  title: string;
  document_type: string;
  updated_at: string;
};

type GrantedDocument = {
  id: string;
  folder_id: string | null;
  folder_path: string;
  title: string;
  document_type: string;
  content_text: string;
  updated_at: string;
};

type ConversationIndexRow = {
  id: string;
  surface: "analysis" | "research" | "writing";
  study_id: string | null;
  document_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
};

type PendingPermission =
  | { kind: "working_rows" }
  | { kind: "thesis"; documentIds: string[] }
  | { kind: "save_history" }
  | { kind: "past_conversations"; conversationIds: string[] }
  | null;

const MAX_DOCUMENT_CONTEXT_CHARS = 160_000;
const MAX_WORKING_ROWS = 250;
const MAX_PAST_CONVERSATIONS = 6;

const QUICK_PROMPTS = [
  "Which analysis best fits my current variables and research question?",
  "Guide me through the current analysis step by step.",
  "Do I need to prepare, derive, recode, center, lag, or filter anything before the best analysis?",
  "Explain what my current result means and what I should check next.",
  "What should I report from this analysis in my thesis?",
];

function clip(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n[Context clipped by PsyLattice]`;
}

function folderPath(folderId: string | null, folders: FolderRow[]) {
  if (!folderId) return "Unfiled";
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const parts: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(folderId) || null;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name);
    current = current.parent_folder_id ? byId.get(current.parent_folder_id) || null : null;
  }
  return parts.join(" / ") || "Unfiled";
}

function folderOptions(folders: FolderRow[]) {
  return [...folders]
    .sort((a, b) => folderPath(a.id, folders).localeCompare(folderPath(b.id, folders)))
    .map((folder) => ({ id: folder.id, label: folderPath(folder.id, folders) }));
}

function conversationSurfaceLabel(surface: ConversationIndexRow["surface"]) {
  if (surface === "analysis") return "Analysis AI";
  if (surface === "research") return "Research Assistant";
  return "Writing AI";
}

function conversationTitleFromQuestion(question: string) {
  const clean = question.replace(/\s+/g, " ").trim();
  if (!clean) return "Research conversation";
  return clean.length <= 88 ? clean : `${clean.slice(0, 85)}…`;
}

function permissionTitle(permission: Exclude<PendingPermission, null>) {
  if (permission.kind === "working_rows") return "Allow AI to inspect working analysis rows?";
  if (permission.kind === "thesis") return "Allow AI to read the selected Thesis Builder work?";
  if (permission.kind === "save_history") return "Save this research AI conversation to your PsyLattice account?";
  return "Allow AI to read the selected past conversations?";
}

function permissionDescription(permission: Exclude<PendingPermission, null>) {
  if (permission.kind === "working_rows") {
    return `While this permission is on, each Analysis AI question may include up to ${MAX_WORKING_ROWS} sanitized rows from the current Analysis Lab view. Direct identifiers and free-text fields are excluded. The AI is instructed not to calculate new inferential statistics from these rows.`;
  }
  if (permission.kind === "thesis") {
    return `PsyLattice will load and send the text of ${permission.documentIds.length} exact selected Thesis Builder work${permission.documentIds.length === 1 ? "" : "s"} with Analysis AI questions until you remove access or leave/reload this page.`;
  }
  if (permission.kind === "save_history") {
    return "PsyLattice will save this Analysis AI conversation in your own research account so you can reopen or explicitly use it as context later. Saving can be turned off at any time. Saved chats are not automatically supplied to future AI sessions.";
  }
  return `PsyLattice will supply the stored message text from ${permission.conversationIds.length} exact selected conversation${permission.conversationIds.length === 1 ? "" : "s"} as background context for this Analysis AI session. You can remove this access at any time.`;
}

function permissionActionLabel(permission: Exclude<PendingPermission, null>) {
  return permission.kind === "save_history" ? "Enable saving" : "Allow access";
}

export default function AnalysisAiAssistant({
  studyId = "",
  studyTitle = "",
  datasetLabel,
  context,
  workingRows = [],
  workingRowsTotal = 0,
  onApplySetup,
  onApplyWorkflow,
}: Props) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [pendingSetupProposal, setPendingSetupProposal] = useState<AnalysisAiSetupProposal | null>(null);
  const [pendingWorkflowProposal, setPendingWorkflowProposal] = useState<AnalysisAiWorkflowProposal | null>(null);
  const [applyNotice, setApplyNotice] = useState("");
  const [includeWorkingRows, setIncludeWorkingRows] = useState(false);
  const [pendingPermission, setPendingPermission] = useState<PendingPermission>(null);

  const [contextPickerOpen, setContextPickerOpen] = useState(false);
  const [thesisLoading, setThesisLoading] = useState(false);
  const [thesisError, setThesisError] = useState("");
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [documentSearch, setDocumentSearch] = useState("");
  const [grantedDocuments, setGrantedDocuments] = useState<GrantedDocument[]>([]);

  const [saveHistoryEnabled, setSaveHistoryEnabled] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState("");
  const [savedMessageCount, setSavedMessageCount] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [conversationIndex, setConversationIndex] = useState<ConversationIndexRow[]>([]);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [grantedConversationIds, setGrantedConversationIds] = useState<string[]>([]);
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationScope, setConversationScope] = useState<"study" | "all">(studyId ? "study" : "all");

  const thesisAccessOn = grantedDocuments.length > 0;
  const pastConversationAccessOn = grantedConversationIds.length > 0;

  const currentFolderDocuments = useMemo(() => {
    const query = documentSearch.trim().toLowerCase();
    return documents
      .filter((document) =>
        selectedFolderId === "__unfiled__"
          ? !document.folder_id
          : document.folder_id === selectedFolderId
      )
      .filter((document) => !query || document.title.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [documents, selectedFolderId, documentSearch]);

  const visibleConversationIndex = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    return conversationIndex
      .filter((conversation) => conversation.id !== currentConversationId)
      .filter((conversation) => conversationScope === "all" || !studyId || conversation.study_id === studyId)
      .filter((conversation) =>
        !query ||
        conversation.title.toLowerCase().includes(query) ||
        conversationSurfaceLabel(conversation.surface).toLowerCase().includes(query)
      )
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [conversationIndex, conversationSearch, conversationScope, currentConversationId, studyId]);

  async function loadThesisIndex() {
    setThesisLoading(true);
    setThesisError("");
    try {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Your PsyLattice session has expired.");

      const [folderResult, documentResult] = await Promise.all([
        supabase
          .from("research_writing_folders")
          .select("id,parent_folder_id,name,position")
          .order("position")
          .order("name"),
        supabase
          .from("research_writing_documents")
          .select("id,folder_id,title,document_type,updated_at")
          .order("updated_at", { ascending: false }),
      ]);

      const firstError = folderResult.error || documentResult.error;
      if (firstError) throw new Error(firstError.message || "Thesis Builder context could not be loaded.");

      const nextFolders = (folderResult.data || []) as FolderRow[];
      const nextDocuments = (documentResult.data || []) as DocumentRow[];
      setFolders(nextFolders);
      setDocuments(nextDocuments);

      const currentStillExists = nextFolders.some((folder) => folder.id === selectedFolderId);
      if (!currentStillExists) {
        const firstFolder = folderOptions(nextFolders)[0]?.id || "__unfiled__";
        setSelectedFolderId(firstFolder);
      }
    } catch (error) {
      setThesisError(error instanceof Error ? error.message : "Thesis Builder context could not be loaded.");
    } finally {
      setThesisLoading(false);
    }
  }

  async function openContextPicker() {
    setContextPickerOpen(true);
    const jobs: Promise<unknown>[] = [];
    if (folders.length === 0 && documents.length === 0 && !thesisLoading) jobs.push(loadThesisIndex());
    if (conversationIndex.length === 0 && !historyLoading) jobs.push(loadConversationIndex());
    if (jobs.length) await Promise.all(jobs);
  }

  async function grantSelectedThesisDocuments(documentIds: string[]) {
    if (documentIds.length === 0) return;
    setThesisLoading(true);
    setThesisError("");
    try {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Your PsyLattice session has expired.");

      const { data, error } = await supabase
        .from("research_writing_documents")
        .select("id,folder_id,title,document_type,content_text,updated_at")
        .in("id", documentIds);
      if (error) throw new Error(error.message || "Selected Thesis Builder work could not be loaded.");

      const rows = (data || []) as Array<DocumentRow & { content_text: string }>;
      if (rows.length !== documentIds.length) {
        throw new Error("One or more selected Thesis Builder documents are no longer available.");
      }

      let remaining = MAX_DOCUMENT_CONTEXT_CHARS;
      const next: GrantedDocument[] = [];
      for (const document of rows) {
        if (remaining <= 0) break;
        const content = clip(String(document.content_text || ""), remaining);
        remaining -= content.length;
        next.push({
          id: document.id,
          folder_id: document.folder_id,
          folder_path: folderPath(document.folder_id, folders),
          title: document.title,
          document_type: document.document_type,
          content_text: content,
          updated_at: document.updated_at,
        });
      }
      setGrantedDocuments(next);
      setSelectedDocumentIds(next.map((document) => document.id));
      setContextPickerOpen(false);
    } catch (error) {
      setThesisError(error instanceof Error ? error.message : "Selected Thesis Builder work could not be loaded.");
    } finally {
      setThesisLoading(false);
    }
  }

  async function loadConversationIndex() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const supabase = createClient();
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Your PsyLattice session has expired.");

      const { data, error } = await supabase
        .from("research_ai_conversations")
        .select("id,surface,study_id,document_id,title,created_at,updated_at")
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .limit(80);
      if (error) {
        throw new Error(
          error.message.includes("research_ai_conversations")
            ? "Saved AI conversation history is not available yet. Run the PsyLattice research AI conversation-history migration first."
            : error.message || "Saved AI conversations could not be loaded."
        );
      }
      setConversationIndex((data || []) as ConversationIndexRow[]);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Saved AI conversations could not be loaded.");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function createSavedConversation(title: string) {
    const supabase = createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new Error("Your PsyLattice session has expired.");
    const { data, error } = await supabase
      .from("research_ai_conversations")
      .insert({
        owner_user_id: auth.user.id,
        surface: "analysis",
        study_id: studyId || null,
        document_id: null,
        title: title || "Analysis AI conversation",
      })
      .select("id")
      .single();
    if (error || !data?.id) throw new Error(error?.message || "The Analysis AI conversation could not be saved.");
    const id = String(data.id);
    setCurrentConversationId(id);
    setSavedMessageCount(0);
    return id;
  }

  async function persistSavedMessage(conversationId: string, message: ChatMessage) {
    const supabase = createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw new Error("Your PsyLattice session has expired.");
    const metadata = message.role === "assistant"
      ? { proposal: message.proposal || null, workflow: message.workflow || null }
      : {};
    const { error } = await supabase.from("research_ai_messages").insert({
      conversation_id: conversationId,
      owner_user_id: auth.user.id,
      role: message.role,
      content: message.content.slice(0, 12000),
      metadata,
    });
    if (error) throw new Error(error.message || "The AI message could not be saved.");
    await supabase
      .from("research_ai_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  async function enableHistorySaving() {
    setHistoryError("");
    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        const firstUser = messages.find((message) => message.role === "user")?.content || "Analysis AI conversation";
        conversationId = await createSavedConversation(conversationTitleFromQuestion(firstUser));
      }
      const unsavedMessages = messages.slice(currentConversationId ? savedMessageCount : 0);
      for (const message of unsavedMessages) await persistSavedMessage(conversationId, message);
      setSavedMessageCount(messages.length);
      setSaveHistoryEnabled(true);
      await loadConversationIndex();
    } catch (error) {
      setSaveHistoryEnabled(false);
      setHistoryError(error instanceof Error ? error.message : "Conversation saving could not be enabled.");
    }
  }

  function disableHistorySaving() {
    setSaveHistoryEnabled(false);
  }

  function toggleConversationSelection(conversationId: string) {
    setSelectedConversationIds((current) => {
      if (current.includes(conversationId)) return current.filter((id) => id !== conversationId);
      if (current.length >= MAX_PAST_CONVERSATIONS) return current;
      return [...current, conversationId];
    });
  }

  function grantPastConversationAccess(conversationIds: string[]) {
    const valid = conversationIds
      .filter((id) => conversationIndex.some((conversation) => conversation.id === id))
      .slice(0, MAX_PAST_CONVERSATIONS);
    setGrantedConversationIds(valid);
    setSelectedConversationIds(valid);
  }

  async function approvePermission() {
    const pending = pendingPermission;
    setPendingPermission(null);
    if (!pending) return;
    if (pending.kind === "working_rows") {
      setIncludeWorkingRows(true);
      return;
    }
    if (pending.kind === "save_history") {
      await enableHistorySaving();
      return;
    }
    if (pending.kind === "past_conversations") {
      grantPastConversationAccess(pending.conversationIds);
      return;
    }
    await grantSelectedThesisDocuments(pending.documentIds);
  }

  function revokeThesisAccess() {
    setGrantedDocuments([]);
    setSelectedDocumentIds([]);
  }

  function toggleDocumentSelection(documentId: string) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId]
    );
  }

  const requestContext = useMemo(() => {
    const base = {
      ...context,
      generated_at: new Date().toISOString(),
      source_policy: {
        ...context.source_policy,
        working_rows_included: includeWorkingRows,
        thesis_context_included: thesisAccessOn,
        past_ai_conversations_included: pastConversationAccessOn,
      },
    } as AnalysisAiContext & { working_rows?: Record<string, unknown> };

    if (includeWorkingRows) {
      base.working_rows = {
        rows_supplied: Math.min(workingRows.length, MAX_WORKING_ROWS),
        total_rows_in_current_view: workingRowsTotal,
        note: "PsyLattice supplies only the sanitized working-row snapshot prepared by Analysis Lab. Direct identifiers and free-text variables are excluded. The AI must not calculate new inferential statistics from these rows.",
        rows: workingRows.slice(0, MAX_WORKING_ROWS),
      };
    }
    return base;
  }, [context, includeWorkingRows, thesisAccessOn, pastConversationAccessOn, workingRows, workingRowsTotal]);

  async function send(questionOverride?: string) {
    const question = (questionOverride ?? draft).trim();
    if (!question || sending) return;

    const userMessage: ChatMessage = { role: "user", content: question };
    const nextMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setChatError("");

    let persistenceConversationId = currentConversationId;
    if (saveHistoryEnabled) {
      try {
        if (!persistenceConversationId) {
          persistenceConversationId = await createSavedConversation(conversationTitleFromQuestion(question));
        }
        await persistSavedMessage(persistenceConversationId, userMessage);
        setSavedMessageCount((count) => count + 1);
      } catch (error) {
        setSaveHistoryEnabled(false);
        persistenceConversationId = "";
        setHistoryError(error instanceof Error ? error.message : "This conversation could not be saved.");
      }
    }

    try {
      const response = await fetch("/api/analysis-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_id: studyId || undefined,
          messages: nextMessages,
          context: requestContext,
          thesis_context: thesisAccessOn
            ? {
                documents: grantedDocuments.map((document) => ({
                  id: document.id,
                  title: document.title,
                  folder_path: document.folder_path,
                  document_type: document.document_type,
                  content_text: document.content_text,
                  updated_at: document.updated_at,
                })),
              }
            : undefined,
          conversation_context: pastConversationAccessOn
            ? { conversation_ids: grantedConversationIds }
            : undefined,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        reply?: string;
        proposal?: AnalysisAiSetupProposal | null;
        workflow?: AnalysisAiWorkflowProposal | null;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.reply) {
        throw new Error(data.error || "Analysis AI could not respond.");
      }
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply as string,
        proposal: data.proposal || null,
        workflow: data.workflow || null,
      };
      setMessages((current) => [...current, assistantMessage]);

      if (saveHistoryEnabled && persistenceConversationId) {
        try {
          await persistSavedMessage(persistenceConversationId, assistantMessage);
          setSavedMessageCount((count) => count + 1);
          await loadConversationIndex();
        } catch (error) {
          setSaveHistoryEnabled(false);
          setHistoryError(error instanceof Error ? error.message : "The AI reply could not be saved.");
        }
      }
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Analysis AI could not respond.");
    } finally {
      setSending(false);
    }
  }

  function proposalValue(value: unknown) {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "boolean") return value ? "On" : "Off";
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function applyPendingSetup() {
    const proposal = pendingSetupProposal;
    if (!proposal || !onApplySetup) return;
    const result = onApplySetup(proposal);
    setPendingSetupProposal(null);
    setApplyNotice(result.message);
    window.setTimeout(() => setApplyNotice(""), 3200);
  }

  function applyPendingWorkflow() {
    const proposal = pendingWorkflowProposal;
    if (!proposal || !onApplyWorkflow) return;
    const result = onApplyWorkflow(proposal);
    setPendingWorkflowProposal(null);
    setApplyNotice(result.message);
    window.setTimeout(() => setApplyNotice(""), 3600);
  }

  function preparationStepSummary(step: AnalysisAiPreparationStep) {
    if (step.kind === "working_view") return `Working view → ${step.view === "prepared" ? "Prepared" : "Raw"}`;
    if (step.kind === "filter") return `${step.variable} · ${step.operator.replaceAll("_", " ")}${step.value ? ` · ${step.value}` : ""}`;
    if (step.kind === "numeric_transform") return `${step.source_variable} → ${step.output_variable} · ${step.transform}`;
    if (step.kind === "computed_variable") return `${step.left_variable} + ${step.right_variable} → ${step.output_variable} · ${step.operation}`;
    if (step.kind === "recode") return `${step.source_variable} → ${step.output_variable} · ${step.mappings.length} mapping${step.mappings.length === 1 ? "" : "s"}`;
    return `${step.source_variable || step.time_variable || step.cluster_variable} → ${step.output_variable} · ${step.operation.replaceAll("_", " ")}`;
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMinimized(false);
          }}
          className="fixed bottom-6 right-6 z-[250] flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-[0_16px_45px_rgba(15,23,42,0.30)]"
        >
          <Sparkles className="h-4 w-4 text-cyan-300" />
          Analysis AI
          {thesisAccessOn ? <span className="text-[9px] text-cyan-300">· Thesis context on</span> : null}
        </button>
      )}

      {open && (
        <div
          className={`fixed bottom-5 right-5 z-[260] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl transition-all ${
            minimized
              ? "h-14 w-60"
              : "h-[700px] w-[430px] max-h-[calc(100vh-40px)] max-w-[calc(100vw-40px)]"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-slate-950 px-4 text-white">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-cyan-300" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">PsyLattice Analysis AI</p>
                {!minimized && (
                  <p className="truncate text-[9px] text-slate-400">
                    {context.current_analysis.label} · guidance + approved workflows
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMinimized((value) => !value)}
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
                title={minimized ? "Restore" : "Minimize"}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <div className="flex h-[646px] max-h-[calc(100vh-94px)] flex-col">
              <div className="border-b border-slate-100 bg-[linear-gradient(100deg,#ecfeff_0%,#f8fafc_58%,#faf5ff_100%)] px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white px-2 py-1 text-[8px] font-semibold text-cyan-900">
                    <BarChart3 className="h-3 w-3" /> Lab context on
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (includeWorkingRows) setIncludeWorkingRows(false);
                      else setPendingPermission({ kind: "working_rows" });
                    }}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-semibold ${
                      includeWorkingRows
                        ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <Database className="h-3 w-3" /> Working data {includeWorkingRows ? "on" : "off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void openContextPicker()}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-semibold ${
                      thesisAccessOn
                        ? "border-violet-200 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <FileText className="h-3 w-3" /> Thesis {thesisAccessOn ? `${grantedDocuments.length} work${grantedDocuments.length === 1 ? "" : "s"}` : "off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (saveHistoryEnabled) disableHistorySaving();
                      else setPendingPermission({ kind: "save_history" });
                    }}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-semibold ${
                      saveHistoryEnabled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                    title="Saving is opt-in and can be turned off at any time"
                  >
                    <History className="h-3 w-3" /> Save history {saveHistoryEnabled ? "on" : "off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void openContextPicker()}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-semibold ${
                      pastConversationAccessOn
                        ? "border-amber-200 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <History className="h-3 w-3" /> Past chats {pastConversationAccessOn ? grantedConversationIds.length : "off"}
                  </button>
                </div>
                <div className="mt-2 flex items-start gap-2 text-[9px] leading-4 text-slate-500">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" />
                  <p>
                    Analysis setup, variable metadata and deterministic results are available to the AI. Row-level working data, Thesis Builder text and past AI conversations each require separate permission.
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-semibold text-slate-900">Ask about the analysis you are actually building</p>
                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        I can see the current Analysis Lab structure, available variables, selected options, filters, saved analysis records and deterministic output already produced. When preparation is needed, I can propose a non-destructive Prepare data workflow for you to review before anything changes. I will not invent statistics that have not been calculated.
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[9px]">
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                          <p className="text-slate-400">Study</p>
                          <p className="mt-0.5 truncate font-semibold text-slate-800">{studyTitle || "External / current dataset"}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                          <p className="text-slate-400">Dataset</p>
                          <p className="mt-0.5 truncate font-semibold text-slate-800">{datasetLabel}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Try asking</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => void send(prompt)}
                            disabled={sending}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[9px] leading-4 text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 disabled:opacity-40"
                          >
                            {prompt}
                          </button>
                        ))}
                        {thesisAccessOn && (
                          <button
                            type="button"
                            onClick={() => void send("Read the Thesis Builder work I permitted. Does my current analysis actually match the research question or hypothesis in that work? Guide me through the best PsyLattice setup step by step.")}
                            disabled={sending}
                            className="rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-[9px] leading-4 text-violet-800 disabled:opacity-40"
                          >
                            Does this match my hypothesis?
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[94%] rounded-2xl px-3.5 py-3 text-[11px] leading-5 ${
                      message.role === "user"
                        ? "ml-auto bg-slate-950 text-white"
                        : "mr-auto border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role === "assistant" && message.workflow && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-violet-200 bg-white text-slate-700 shadow-sm">
                        <div className="border-b border-violet-100 bg-[linear-gradient(100deg,#f5f3ff_0%,#ffffff_68%,#ecfeff_100%)] px-3 py-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-800">
                              <Sparkles className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-violet-700">Suggested PsyLattice workflow</p>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-950">{message.workflow.title}</p>
                              <p className="mt-1 text-[9px] leading-4 text-slate-500">{message.workflow.rationale}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 p-3">
                          {message.workflow.preparation_steps.length > 0 ? (
                            <div className="space-y-1.5">
                              {message.workflow.preparation_steps.slice(0, 8).map((step, stepIndex) => (
                                <div key={`${step.kind}-${stepIndex}`} className="flex gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[8px] font-semibold text-violet-700 shadow-sm">{stepIndex + 1}</span>
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-semibold text-slate-800">{step.label}</p>
                                    <p className="mt-0.5 text-[8px] leading-3.5 text-slate-500">{preparationStepSummary(step)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          {message.workflow.analysis_setup ? (
                            <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 px-3 py-2.5">
                              <p className="text-[7px] font-semibold uppercase tracking-[.08em] text-cyan-700">Then analyze</p>
                              <p className="mt-1 text-[9px] font-semibold text-cyan-950">{message.workflow.analysis_setup.title}</p>
                            </div>
                          ) : null}
                          {message.workflow.cautions && message.workflow.cautions.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[8px] leading-4 text-amber-900">
                              {message.workflow.cautions.slice(0, 2).join(" · ")}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[8px] text-slate-400">Non-destructive preparation · researcher approval required</p>
                            {message.workflow.can_apply && onApplyWorkflow ? (
                              <button type="button" onClick={() => setPendingWorkflowProposal(message.workflow || null)} className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white">Review workflow</button>
                            ) : (
                              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[7px] font-semibold text-slate-500">Guidance only</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {message.role === "assistant" && message.proposal && (
                      <div className="mt-3 overflow-hidden rounded-2xl border border-cyan-200 bg-white text-slate-700 shadow-sm">
                        <div className="border-b border-cyan-100 bg-[linear-gradient(100deg,#ecfeff_0%,#ffffff_68%)] px-3 py-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Suggested PsyLattice setup</p>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-950">{message.proposal.title}</p>
                              <p className="mt-1 text-[9px] leading-4 text-slate-500">{message.proposal.rationale}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 p-3">
                          <div className="grid grid-cols-2 gap-1.5">
                            {Object.entries(message.proposal.setup).slice(0, 10).map(([key, value]) => (
                              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">
                                <p className="text-[7px] font-semibold uppercase tracking-[.08em] text-slate-400">{key.replaceAll("_", " ")}</p>
                                <p className="mt-0.5 truncate text-[9px] font-semibold text-slate-700" title={proposalValue(value)}>{proposalValue(value)}</p>
                              </div>
                            ))}
                          </div>
                          {message.proposal.cautions && message.proposal.cautions.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[8px] leading-4 text-amber-900">
                              {message.proposal.cautions.slice(0, 2).join(" · ")}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[8px] text-slate-400">Configuration only · deterministic engine calculates afterward</p>
                            {message.proposal.can_apply && onApplySetup ? (
                              <button
                                type="button"
                                onClick={() => setPendingSetupProposal(message.proposal || null)}
                                className="shrink-0 rounded-xl bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white"
                              >
                                Review & apply
                              </button>
                            ) : (
                              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[7px] font-semibold text-slate-500">Guidance only</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {applyNotice && (
                  <div className="mr-auto flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {applyNotice}
                  </div>
                )}

                {sending && (
                  <div className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[10px] text-slate-500">
                    <BrainCircuit className="h-4 w-4 animate-pulse text-cyan-700" />
                    Reading the permitted research context…
                  </div>
                )}

                {chatError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[10px] leading-5 text-red-700">
                    {chatError}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => void openContextPicker()}
                    className="flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    <LockKeyhole className="h-3.5 w-3.5" /> Manage context
                  </button>
                  <span className="text-[8px] text-slate-400">{saveHistoryEnabled ? "Saving this chat" : "Not saved"}</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.slice(0, 5000))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                    placeholder="Ask Analysis AI…"
                    className="min-h-[76px] min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!draft.trim() || sending}
                    className="self-end rounded-xl bg-slate-950 p-3 text-white disabled:opacity-40"
                    title="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setDraft("");
                      setChatError("");
                      setPendingSetupProposal(null);
                      setPendingWorkflowProposal(null);
                      setCurrentConversationId("");
                      setSavedMessageCount(0);
                      setApplyNotice("");
                    }}
                    disabled={sending || messages.length === 0}
                    className="text-[9px] text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    New chat
                  </button>
                  <p className="text-[8px] text-slate-400">AI guides; Analysis Lab calculates.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {contextPickerOpen && (
        <div className="fixed inset-0 z-[280] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-cyan-700">Analysis AI context</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-950">Choose exactly what the AI may read</h3>
                <p className="mt-1 text-[10px] leading-5 text-slate-500">Analysis Lab state is always available. Thesis Builder text, row-level working data and saved AI conversations remain separately permission-scoped.</p>
              </div>
              <button type="button" onClick={() => setContextPickerOpen(false)} className="rounded-full border border-slate-200 p-2 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/55 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-800" /><p className="text-xs font-semibold text-cyan-950">Current Analysis Lab</p></div>
                    <span className="rounded-full bg-white px-2 py-1 text-[8px] font-semibold text-cyan-800">Always on</span>
                  </div>
                  <p className="mt-2 text-[9px] leading-4 text-cyan-900/70">Study/dataset metadata, variable definitions, filters, derived-variable setup, current analysis settings, deterministic result tables and saved record summaries.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Database className="h-4 w-4 text-slate-600" /><p className="text-xs font-semibold text-slate-900">Working analysis rows</p></div>
                    <button
                      type="button"
                      onClick={() => {
                        if (includeWorkingRows) setIncludeWorkingRows(false);
                        else setPendingPermission({ kind: "working_rows" });
                      }}
                      className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${includeWorkingRows ? "bg-cyan-100 text-cyan-900" : "bg-slate-100 text-slate-500"}`}
                    >
                      {includeWorkingRows ? "On" : "Off"}
                    </button>
                  </div>
                  <p className="mt-2 text-[9px] leading-4 text-slate-500">Up to {MAX_WORKING_ROWS} sanitized rows from the current filtered view. Direct identifiers and free-text fields are excluded before they reach this panel.</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/35 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-violet-700" /><div><p className="text-xs font-semibold text-slate-950">Thesis Builder context</p><p className="mt-0.5 text-[9px] text-slate-500">Choose a folder, then the exact work the AI may read.</p></div></div>
                  <div className="flex items-center gap-2">
                    {thesisAccessOn && <button type="button" onClick={revokeThesisAccess} className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[8px] font-semibold text-violet-700">Remove access</button>}
                    <button type="button" onClick={() => void loadThesisIndex()} disabled={thesisLoading} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 disabled:opacity-40" title="Refresh Thesis Builder index"><RefreshCw className={`h-3.5 w-3.5 ${thesisLoading ? "animate-spin" : ""}`} /></button>
                  </div>
                </div>

                {thesisAccessOn && (
                  <div className="mt-3 rounded-xl border border-violet-200 bg-white p-3">
                    <p className="text-[9px] font-semibold text-violet-800">Currently permitted</p>
                    <div className="mt-2 space-y-1.5">
                      {grantedDocuments.map((document) => (
                        <div key={document.id} className="flex items-center gap-2 text-[9px] text-slate-600"><Check className="h-3.5 w-3.5 shrink-0 text-violet-600" /><span className="truncate"><span className="font-semibold">{document.title}</span> · {document.folder_path}</span></div>
                      ))}
                    </div>
                  </div>
                )}

                {thesisLoading ? (
                  <div className="mt-3 rounded-xl bg-white p-4 text-[10px] text-slate-500">Loading Thesis Builder index…</div>
                ) : thesisError ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[10px] text-red-700">{thesisError}</div>
                ) : (
                  <>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]">
                      <label className="block">
                        <span className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">1 · Folder</span>
                        <div className="relative mt-1">
                          <FolderOpen className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <select value={selectedFolderId} onChange={(event) => { setSelectedFolderId(event.target.value); setSelectedDocumentIds([]); }} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-[10px] font-semibold text-slate-700">
                            {folderOptions(folders).map((folder) => <option key={folder.id} value={folder.id}>{folder.label}</option>)}
                            <option value="__unfiled__">Unfiled</option>
                          </select>
                        </div>
                      </label>
                      <label className="block">
                        <span className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">Find work</span>
                        <div className="relative mt-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={documentSearch} onChange={(event) => setDocumentSearch(event.target.value)} placeholder="Search this folder" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[10px] outline-none focus:border-violet-300" /></div>
                      </label>
                    </div>

                    <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                      {currentFolderDocuments.length === 0 ? (
                        <div className="p-4 text-[10px] text-slate-400">No Thesis Builder work is stored directly in this folder.</div>
                      ) : currentFolderDocuments.map((document) => {
                        const selected = selectedDocumentIds.includes(document.id);
                        return (
                          <button key={document.id} type="button" onClick={() => toggleDocumentSelection(document.id)} className={`flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 ${selected ? "bg-violet-50/65" : "bg-white hover:bg-slate-50"}`}>
                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-violet-500 bg-violet-600 text-white" : "border-slate-300 bg-white"}`}>{selected ? <Check className="h-3 w-3" /> : null}</span>
                            <div className="min-w-0"><p className="truncate text-[10px] font-semibold text-slate-800">{document.title}</p><p className="mt-0.5 text-[8px] text-slate-400">{document.document_type} · updated {new Date(document.updated_at).toLocaleDateString()}</p></div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[9px] text-slate-500">{selectedDocumentIds.length} exact work{selectedDocumentIds.length === 1 ? "" : "s"} selected</p>
                      <button type="button" onClick={() => setPendingPermission({ kind: "thesis", documentIds: [...selectedDocumentIds] })} disabled={selectedDocumentIds.length === 0 || thesisLoading} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-semibold text-white disabled:opacity-35">Allow selected work</button>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/35 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div>
                      <p className="text-xs font-semibold text-slate-950">Past PsyLattice AI conversations</p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-500">Saved research conversations are never added automatically. Choose the exact chats, then explicitly allow Analysis AI to use them as background context.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (saveHistoryEnabled) disableHistorySaving();
                        else setPendingPermission({ kind: "save_history" });
                      }}
                      className={`rounded-full border px-3 py-1.5 text-[8px] font-semibold ${saveHistoryEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}
                    >
                      {saveHistoryEnabled ? "Saving current chat" : "Save current chat"}
                    </button>
                    {pastConversationAccessOn && (
                      <button type="button" onClick={() => setGrantedConversationIds([])} className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-[8px] font-semibold text-amber-800">Remove past-chat access</button>
                    )}
                    <button type="button" onClick={() => void loadConversationIndex()} disabled={historyLoading} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 disabled:opacity-40" title="Refresh saved conversations"><RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} /></button>
                  </div>
                </div>

                {pastConversationAccessOn && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-white p-3">
                    <p className="text-[9px] font-semibold text-amber-800">Currently permitted as background context</p>
                    <div className="mt-2 space-y-1.5">
                      {grantedConversationIds.map((id) => {
                        const conversation = conversationIndex.find((item) => item.id === id);
                        if (!conversation) return null;
                        return <div key={id} className="flex items-center gap-2 text-[9px] text-slate-600"><Check className="h-3.5 w-3.5 shrink-0 text-amber-600" /><span className="truncate"><span className="font-semibold">{conversation.title}</span> · {conversationSurfaceLabel(conversation.surface)}</span></div>;
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {studyId && (
                    <button type="button" onClick={() => setConversationScope("study")} className={`rounded-full px-3 py-1.5 text-[8px] font-semibold ${conversationScope === "study" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-500"}`}>Same study</button>
                  )}
                  <button type="button" onClick={() => setConversationScope("all")} className={`rounded-full px-3 py-1.5 text-[8px] font-semibold ${conversationScope === "all" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-500"}`}>All research chats</button>
                  <div className="relative min-w-[190px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} placeholder="Search saved conversations" className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[9px] outline-none focus:border-amber-300" /></div>
                </div>

                {historyError ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-[9px] leading-4 text-red-700">{historyError}</div>
                ) : historyLoading ? (
                  <div className="mt-3 rounded-xl bg-white p-4 text-[10px] text-slate-500">Loading saved AI conversations…</div>
                ) : visibleConversationIndex.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-[9px] leading-4 text-slate-500">
                    No saved conversations match this view yet. Conversations created before this history feature were not persisted by PsyLattice, so they cannot be retroactively recovered. Turn on <span className="font-semibold text-slate-700">Save current chat</span> to keep new research discussions for later use.
                  </div>
                ) : (
                  <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    {visibleConversationIndex.map((conversation) => {
                      const selected = selectedConversationIds.includes(conversation.id);
                      const permitted = grantedConversationIds.includes(conversation.id);
                      return (
                        <button key={conversation.id} type="button" onClick={() => toggleConversationSelection(conversation.id)} className={`flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 ${selected ? "bg-amber-50/70" : "bg-white hover:bg-slate-50"}`}>
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? "border-amber-500 bg-amber-500 text-white" : "border-slate-300 bg-white"}`}>{selected ? <Check className="h-3 w-3" /> : null}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2"><p className="truncate text-[10px] font-semibold text-slate-800">{conversation.title}</p>{permitted ? <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[7px] font-semibold text-amber-800">Permitted</span> : null}</div>
                            <p className="mt-0.5 text-[8px] text-slate-400">{conversationSurfaceLabel(conversation.surface)}{conversation.study_id === studyId && studyId ? " · same study" : ""} · updated {new Date(conversation.updated_at).toLocaleDateString()}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[9px] text-slate-500">{selectedConversationIds.length}/{MAX_PAST_CONVERSATIONS} conversations selected · titles/metadata are visible before permission; message text is not supplied to Analysis AI until you approve.</p>
                  <button type="button" onClick={() => setPendingPermission({ kind: "past_conversations", conversationIds: [...selectedConversationIds] })} disabled={selectedConversationIds.length === 0 || historyLoading} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-semibold text-white disabled:opacity-35">Allow selected conversations</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingWorkflowProposal && (
        <div className="fixed inset-0 z-[306] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xl overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-[linear-gradient(110deg,#f5f3ff_0%,#ffffff_58%,#ecfeff_100%)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[.11em] text-violet-700">Review Analysis AI workflow</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">{pendingWorkflowProposal.title}</h3>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500">{pendingWorkflowProposal.rationale}</p>
                </div>
                <button type="button" onClick={() => setPendingWorkflowProposal(null)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-400"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="max-h-[62vh] overflow-y-auto p-5">
              <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-violet-800" /><p className="text-[10px] font-semibold text-violet-950">Prepare data changes</p></div>
                {pendingWorkflowProposal.preparation_steps.length === 0 ? (
                  <p className="mt-3 text-[9px] text-slate-500">No data-preparation changes are required.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {pendingWorkflowProposal.preparation_steps.map((step, index) => (
                      <div key={`${step.kind}-${index}`} className="rounded-xl border border-violet-100 bg-white px-3 py-3">
                        <div className="flex gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[8px] font-semibold text-violet-800">{index + 1}</span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-850">{step.label}</p>
                            <p className="mt-1 break-words text-[9px] text-slate-600">{preparationStepSummary(step)}</p>
                            {step.reason ? <p className="mt-1 text-[8px] leading-4 text-slate-400">{step.reason}</p> : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {pendingWorkflowProposal.analysis_setup ? (
                <div className="mt-3 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-cyan-700">Then configure analysis</p>
                  <p className="mt-1 text-[11px] font-semibold text-cyan-950">{pendingWorkflowProposal.analysis_setup.title}</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-500">{pendingWorkflowProposal.analysis_setup.rationale}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {Object.entries(pendingWorkflowProposal.analysis_setup.setup).map(([key, value]) => (
                      <div key={key} className="rounded-xl border border-cyan-100 bg-white px-3 py-2.5">
                        <p className="text-[7px] font-semibold uppercase tracking-[.08em] text-slate-400">{key.replaceAll("_", " ")}</p>
                        <p className="mt-1 break-words text-[10px] font-semibold text-slate-800">{proposalValue(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {pendingWorkflowProposal.review_steps && pendingWorkflowProposal.review_steps.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-500">Review after applying</p>
                  <div className="mt-2 space-y-1.5">
                    {pendingWorkflowProposal.review_steps.map((step, index) => (
                      <div key={`${step}-${index}`} className="flex gap-2 text-[9px] leading-4 text-slate-600"><span className="font-semibold text-slate-400">{index + 1}.</span><span>{step}</span></div>
                    ))}
                  </div>
                </div>
              ) : null}

              {pendingWorkflowProposal.cautions && pendingWorkflowProposal.cautions.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div><p className="text-[9px] font-semibold text-amber-900">Review before applying</p><p className="mt-1 text-[9px] leading-4 text-amber-900/80">{pendingWorkflowProposal.cautions.join(" · ")}</p></div></div>
                </div>
              ) : null}

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-[9px] leading-4 text-slate-500">
                Applying this workflow changes only the current Analysis Lab working view. Derived variables, recodes and filters are non-destructive and do not alter stored study responses. Filters affect the current analysis sample, so review them carefully. If an analysis setup follows the preparation steps, the deterministic Analysis Lab engine calculates the result only after those approved changes are applied.
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
              <button type="button" onClick={() => setPendingWorkflowProposal(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-semibold text-slate-600">Cancel</button>
              <button type="button" onClick={applyPendingWorkflow} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[10px] font-semibold text-white">Apply workflow</button>
            </div>
          </div>
        </div>
      )}

      {pendingSetupProposal && (
        <div className="fixed inset-0 z-[305] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-[linear-gradient(110deg,#ecfeff_0%,#ffffff_65%,#faf5ff_100%)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[.11em] text-cyan-700">Review Analysis AI setup</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">{pendingSetupProposal.title}</h3>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500">{pendingSetupProposal.rationale}</p>
                </div>
                <button type="button" onClick={() => setPendingSetupProposal(null)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-400"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="max-h-[58vh] overflow-y-auto p-5">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50/45 p-4">
                <div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-cyan-800" /><p className="text-[10px] font-semibold text-cyan-950">Controls PsyLattice will configure</p></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(pendingSetupProposal.setup).map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-cyan-100 bg-white px-3 py-2.5">
                      <p className="text-[7px] font-semibold uppercase tracking-[.08em] text-slate-400">{key.replaceAll("_", " ")}</p>
                      <p className="mt-1 break-words text-[10px] font-semibold text-slate-800">{proposalValue(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {pendingSetupProposal.review_steps && pendingSetupProposal.review_steps.length > 0 && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-500">After applying</p>
                  <div className="mt-2 space-y-1.5">
                    {pendingSetupProposal.review_steps.map((step, index) => (
                      <div key={`${step}-${index}`} className="flex gap-2 text-[9px] leading-4 text-slate-600"><span className="font-semibold text-slate-400">{index + 1}.</span><span>{step}</span></div>
                    ))}
                  </div>
                </div>
              )}

              {pendingSetupProposal.cautions && pendingSetupProposal.cautions.length > 0 && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" /><div><p className="text-[9px] font-semibold text-amber-900">Review before interpreting</p><p className="mt-1 text-[9px] leading-4 text-amber-900/80">{pendingSetupProposal.cautions.join(" · ")}</p></div></div>
                </div>
              )}

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-[9px] leading-4 text-slate-500">
                Applying this proposal changes only visible Analysis Lab controls. It does not edit Thesis Builder text, alter stored study data, create exclusions, or let the AI calculate statistics. Any results that appear afterward come from the deterministic Analysis Lab engine.
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4">
              <button type="button" onClick={() => setPendingSetupProposal(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-semibold text-slate-600">Cancel</button>
              <button type="button" onClick={applyPendingSetup} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[10px] font-semibold text-white">Apply setup</button>
            </div>
          </div>
        </div>
      )}

      {pendingPermission && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800"><LockKeyhole className="h-5 w-5" /></div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{permissionTitle(pendingPermission)}</h3>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">{permissionDescription(pendingPermission)}</p>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-4 text-amber-900">
              <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{pendingPermission.kind === "past_conversations" ? "Past AI replies are background research discussion, not authoritative numerical evidence. Current deterministic Analysis Lab results remain the source of truth." : pendingPermission.kind === "save_history" ? "Conversation storage is opt-in. Saving history does not grant another AI session permission to read it later; that requires separate selection and approval." : "This permission does not allow the AI to edit your thesis, alter your data, or run hidden statistical calculations."}</span></div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingPermission(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-semibold text-slate-600">Cancel</button>
              <button type="button" onClick={() => void approvePermission()} className="rounded-xl bg-slate-950 px-4 py-2.5 text-[10px] font-semibold text-white">{permissionActionLabel(pendingPermission)}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
