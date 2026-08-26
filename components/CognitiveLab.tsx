"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BookOpenCheck,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  FlaskConical,
  Gauge,
  Layers3,
  Library,
  Link2,
  Loader2,
  Monitor,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  Target,
  TimerReset,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CognitiveTaskBuilder from "./CognitiveTaskBuilder";
import CognitiveLearningHub from "./CognitiveLearningHub";

type CognitiveTab = "overview" | "learn" | "library" | "tasks" | "pilots";

type CognitiveTask = {
  id: string;
  owner_user_id: string | null;
  source_type: "system_template" | "researcher_created" | "imported";
  source_template_id: string | null;
  template_key: string | null;
  title: string;
  short_title: string | null;
  description: string;
  domain: string;
  tags: string[] | null;
  status: "draft" | "active" | "archived";
  template_stage: "foundation" | "builder_ready" | "runner_ready";
  default_device_support: Record<string, boolean> | null;
  library_metadata: {
    typical_outputs?: string[];
    default_structure?: string;
    launch_note?: string;
  } | null;
  created_at: string;
  updated_at: string;
};

type CognitiveVersion = {
  id: string;
  task_id: string;
  version_number: number;
  version_label: string;
  status: "draft" | "published" | "locked" | "archived";
  runtime_engine: string;
  updated_at: string;
};

type CognitiveSession = {
  id: string;
  task_id: string;
  version_id: string;
  session_mode: "preview" | "pilot" | "study";
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type CognitivePilotLink = {
  id: string;
  task_id: string;
  version_id: string;
  token: string;
  label: string;
  status: "active" | "closed";
  max_completions: number | null;
  completion_count: number;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

type Notice = { type: "success" | "error"; text: string } | null;

type TemplateProfile = {
  icon: LucideIcon;
  kicker: string;
  fallbackOutputs: string[];
};

const templateProfiles: Record<string, TemplateProfile> = {
  simple_rt: {
    icon: TimerReset,
    kicker: "Response speed",
    fallbackOutputs: ["Mean reaction time", "Median reaction time", "Omissions"],
  },
  choice_rt: {
    icon: Gauge,
    kicker: "Choice speed",
    fallbackOutputs: ["Correct RT", "Accuracy", "Choice errors"],
  },
  stroop: {
    icon: BrainCircuit,
    kicker: "Interference",
    fallbackOutputs: ["Congruent RT", "Incongruent RT", "Accuracy", "Interference"],
  },
  flanker: {
    icon: Target,
    kicker: "Selective attention",
    fallbackOutputs: ["Congruent RT", "Incongruent RT", "Accuracy", "Conflict effect"],
  },
  go_nogo: {
    icon: Activity,
    kicker: "Response inhibition",
    fallbackOutputs: ["Go RT", "Go accuracy", "Commission errors", "Omissions"],
  },
  n_back: {
    icon: Layers3,
    kicker: "Working memory",
    fallbackOutputs: ["Hits", "Misses", "False alarms", "Accuracy", "Correct RT"],
  },
};

function formatDomain(domain: string) {
  return domain
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StagePill({ stage }: { stage: CognitiveTask["template_stage"] }) {
  const copy = {
    foundation: "Foundation",
    builder_ready: "Builder ready",
    runner_ready: "Runner ready",
  }[stage];

  const style = {
    foundation: "border-slate-200 bg-white text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.05)]",
    builder_ready: "border-cyan-200 bg-cyan-50/80 text-cyan-900 shadow-[0_5px_16px_rgba(8,145,178,0.09)]",
    runner_ready: "border-cyan-300 bg-white text-cyan-900 shadow-[0_6px_18px_rgba(8,145,178,0.14)]",
  }[stage];

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${style}`}>
      {copy}
    </span>
  );
}

function DevicePills({ support }: { support: Record<string, boolean> | null }) {
  const devices = [
    { key: "desktop", label: "Desktop", icon: Monitor },
    { key: "tablet", label: "Tablet", icon: Tablet },
    { key: "phone", label: "Phone", icon: Smartphone },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {devices
        .filter((device) => support?.[device.key] !== false)
        .map((device) => {
          const Icon = device.icon;
          return (
            <span
              key={device.key}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-500"
            >
              <Icon className="h-3 w-3" />
              {device.label}
            </span>
          );
        })}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default function CognitiveLab() {
  const [tab, setTab] = useState<CognitiveTab>("overview");
  const [templates, setTemplates] = useState<CognitiveTask[]>([]);
  const [tasks, setTasks] = useState<CognitiveTask[]>([]);
  const [versions, setVersions] = useState<CognitiveVersion[]>([]);
  const [pilotSessions, setPilotSessions] = useState<CognitiveSession[]>([]);
  const [pilotLinks, setPilotLinks] = useState<CognitivePilotLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTaskId, setBusyTaskId] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDomain, setNewTaskDomain] = useState("general");
  const [builderTaskId, setBuilderTaskId] = useState("");
  const [pilotTaskId, setPilotTaskId] = useState("");
  const [pilotLabel, setPilotLabel] = useState("Usability pilot");
  const [pilotLimit, setPilotLimit] = useState("20");
  const [pilotExpiryDays, setPilotExpiryDays] = useState("14");
  const [creatingPilot, setCreatingPilot] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setNotice({ type: "error", text: "Your Cognitive Lab could not be loaded." });
      setLoading(false);
      return;
    }

    const [templateResult, taskResult, sessionResult, linkResult] = await Promise.all([
      supabase
        .from("cognitive_tasks")
        .select(
          "id,owner_user_id,source_type,source_template_id,template_key,title,short_title,description,domain,tags,status,template_stage,default_device_support,library_metadata,created_at,updated_at"
        )
        .eq("source_type", "system_template")
        .eq("status", "active")
        .eq("researcher_available", true)
        .order("title", { ascending: true }),
      supabase
        .from("cognitive_tasks")
        .select(
          "id,owner_user_id,source_type,source_template_id,template_key,title,short_title,description,domain,tags,status,template_stage,default_device_support,library_metadata,created_at,updated_at"
        )
        .eq("owner_user_id", user.id)
        .neq("status", "archived")
        .order("updated_at", { ascending: false }),
      supabase
        .from("cognitive_task_sessions")
        .select("id,task_id,version_id,session_mode,status,started_at,completed_at,created_at")
        .eq("owner_user_id", user.id)
        .eq("session_mode", "pilot")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("cognitive_pilot_links")
        .select("id,task_id,version_id,token,label,status,max_completions,completion_count,expires_at,last_used_at,created_at")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const firstError = templateResult.error || taskResult.error || sessionResult.error || linkResult.error;
    if (firstError) {
      setNotice({ type: "error", text: firstError.message || "Cognitive Lab data could not be loaded." });
      setLoading(false);
      return;
    }

    const nextTemplates = (templateResult.data || []) as CognitiveTask[];
    const nextTasks = (taskResult.data || []) as CognitiveTask[];
    const taskIds = [...nextTemplates, ...nextTasks].map((task) => task.id);

    let nextVersions: CognitiveVersion[] = [];
    if (taskIds.length > 0) {
      const versionResult = await supabase
        .from("cognitive_task_versions")
        .select("id,task_id,version_number,version_label,status,runtime_engine,updated_at")
        .in("task_id", taskIds)
        .order("version_number", { ascending: false });

      if (versionResult.error) {
        setNotice({ type: "error", text: versionResult.error.message });
        setLoading(false);
        return;
      }
      nextVersions = (versionResult.data || []) as CognitiveVersion[];
    }

    setTemplates(nextTemplates);
    setTasks(nextTasks);
    setVersions(nextVersions);
    setPilotSessions((sessionResult.data || []) as CognitiveSession[]);
    setPilotLinks((linkResult.data || []) as CognitivePilotLink[]);
    setPilotTaskId((current) => current || nextTasks[0]?.id || "");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const versionFor = useCallback(
    (taskId: string) =>
      versions
        .filter((version) => version.task_id === taskId)
        .sort((a, b) => b.version_number - a.version_number)[0] || null,
    [versions]
  );

  const publishedVersionFor = useCallback(
    (taskId: string) =>
      versions
        .filter(
          (version) =>
            version.task_id === taskId &&
            (version.status === "published" || version.status === "locked")
        )
        .sort((a, b) => b.version_number - a.version_number)[0] || null,
    [versions]
  );

  const domains = useMemo(
    () => Array.from(new Set(templates.map((task) => task.domain))).sort(),
    [templates]
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((task) => {
      if (selectedDomain !== "all" && task.domain !== selectedDomain) return false;
      if (!query) return true;
      return [task.title, task.short_title || "", task.description, ...(task.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [templates, search, selectedDomain]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const completedPilots = pilotSessions.filter((session) => session.status === "completed").length;
  const activePilotLinks = pilotLinks.filter((link) => link.status === "active" && (!link.expires_at || new Date(link.expires_at).getTime() > Date.now())).length;

  function pilotUrl(token: string) {
    // Pilot and study links intentionally share the existing public /study/[token]
    // route. The participant page identifies the token type against Supabase.
    const path = `/study/${encodeURIComponent(token)}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }

  async function copyPilotLink(token: string) {
    try {
      await navigator.clipboard.writeText(pilotUrl(token));
      setNotice({ type: "success", text: "Pilot link copied." });
    } catch {
      setNotice({ type: "error", text: "The pilot link could not be copied automatically." });
    }
  }

  function openPilotLink(token: string) {
    const url = pilotUrl(token);
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.assign(url);
    }
  }

  async function createPilotLink() {
    const task = tasks.find((item) => item.id === pilotTaskId);
    const version = task ? versionFor(task.id) : null;
    if (!task || !version) {
      setNotice({ type: "error", text: "Choose a saved cognitive task first." });
      return;
    }

    const limit = pilotLimit.trim() ? Number(pilotLimit) : null;
    const days = pilotExpiryDays.trim() ? Number(pilotExpiryDays) : null;
    if (limit !== null && (!Number.isFinite(limit) || limit < 1)) {
      setNotice({ type: "error", text: "Pilot completion limit must be at least 1." });
      return;
    }
    if (days !== null && (!Number.isFinite(days) || days < 1)) {
      setNotice({ type: "error", text: "Pilot expiry must be at least 1 day." });
      return;
    }

    setCreatingPilot(true);
    setNotice(null);
    const supabase = createClient();
    const expiresAt = days === null ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase.rpc("psylattice_create_cognitive_pilot_link", {
      p_task_id: task.id,
      p_version_id: version.id,
      p_label: pilotLabel.trim() || "Pilot",
      p_expires_at: expiresAt,
      p_max_completions: limit === null ? null : Math.floor(limit),
    });
    setCreatingPilot(false);

    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }

    const token = typeof data === "object" && data ? String((data as any).token || "") : "";
    await load();
    setTab("pilots");
    if (token) {
      try { await navigator.clipboard.writeText(pilotUrl(token)); } catch { /* copy is optional */ }
      setNotice({ type: "success", text: "Pilot link created. A fixed snapshot of this task was saved for the pilot." });
    }
  }

  async function setPilotLinkStatus(link: CognitivePilotLink, status: "active" | "closed") {
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("psylattice_set_cognitive_pilot_link_status", {
      p_link_id: link.id,
      p_status: status,
    });
    if (error) {
      setNotice({ type: "error", text: error.message });
      return;
    }
    setNotice({ type: "success", text: status === "active" ? "Pilot link reopened." : "Pilot link closed." });
    await load();
  }

  async function cloneTemplate(task: CognitiveTask) {
    setBusyTaskId(task.id);
    setNotice(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("psylattice_clone_cognitive_template", {
      p_template_task_id: task.id,
      p_title: null,
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusyTaskId("");
      return;
    }

    const clonedTaskId = typeof data === "object" && data && "task_id" in data ? String((data as { task_id?: string }).task_id || "") : "";
    setNotice({ type: "success", text: `${task.title} was added to My Cognitive Tasks as an editable draft.` });
    setBusyTaskId("");
    await load();
    setTab("tasks");
    if (clonedTaskId) setSelectedTaskId(clonedTaskId);
  }

  async function createTask() {
    const title = newTaskTitle.trim();
    if (!title) {
      setNotice({ type: "error", text: "Give the cognitive task a title first." });
      return;
    }

    setBusyTaskId("create");
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("psylattice_create_cognitive_task", {
      p_title: title,
      p_description: newTaskDescription.trim(),
      p_domain: newTaskDomain,
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusyTaskId("");
      return;
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskDomain("general");
    setShowCreate(false);
    setNotice({ type: "success", text: "Blank cognitive task created. It is ready for the Task Builder phase." });
    setBusyTaskId("");
    await load();
    setTab("tasks");
  }

  async function publishTask(task: CognitiveTask) {
    const version = versionFor(task.id);
    if (!version || version.status !== "draft") {
      setNotice({ type: "error", text: "Open or create an editable draft before marking this task ready for studies." });
      return;
    }

    const confirmed = window.confirm(
      `Mark “${task.title}” ${version.version_label} as Ready for studies?\n\nThis freezes that version so studies can pin it safely. Future edits will happen in a new draft version.`
    );
    if (!confirmed) return;

    setBusyTaskId(`publish:${task.id}`);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("psylattice_publish_cognitive_task_version", {
      p_task_id: task.id,
      p_version_id: version.id,
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusyTaskId("");
      return;
    }

    setNotice({ type: "success", text: `${task.title} is now study-ready. Study Builder can pin this published version.` });
    setBusyTaskId("");
    await load();
  }

  async function createEditableVersion(task: CognitiveTask) {
    const published = publishedVersionFor(task.id);
    if (!published) {
      setNotice({ type: "error", text: "Publish the first study-ready version before creating another editable version." });
      return;
    }

    setBusyTaskId(`draft:${task.id}`);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("psylattice_create_cognitive_draft_version", {
      p_task_id: task.id,
      p_source_version_id: published.id,
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusyTaskId("");
      return;
    }

    setNotice({ type: "success", text: `A new editable version of ${task.title} is ready. Existing studies still use the frozen published version.` });
    setBusyTaskId("");
    await load();
    setBuilderTaskId(task.id);
  }

  async function archiveTask(task: CognitiveTask) {
    const confirmed = window.confirm(`Archive “${task.title}”?`);
    if (!confirmed) return;

    setBusyTaskId(task.id);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("cognitive_tasks")
      .update({ status: "archived" })
      .eq("id", task.id);

    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusyTaskId("");
      return;
    }

    if (selectedTaskId === task.id) setSelectedTaskId("");
    setNotice({ type: "success", text: `${task.title} was archived.` });
    setBusyTaskId("");
    await load();
  }

  if (builderTaskId) {
    return (
      <CognitiveTaskBuilder
        taskId={builderTaskId}
        onBack={() => setBuilderTaskId("")}
        onSaved={() => void load()}
      />
    );
  }

  const tabs: { id: CognitiveTab; label: string; icon: LucideIcon }[] = [
    { id: "overview", label: "Overview", icon: BrainCircuit },
    { id: "learn", label: "Learn", icon: BookOpenCheck },
    { id: "library", label: "Task Templates", icon: Library },
    { id: "tasks", label: "My Cognitive Tasks", icon: FlaskConical },
    { id: "pilots", label: "Pilot Sessions", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-300/75 bg-white text-slate-950 shadow-[0_3px_8px_rgba(15,23,42,0.055),0_18px_44px_rgba(15,23,42,0.085),0_36px_90px_rgba(8,145,178,0.05)]">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-cyan-100/70 blur-3xl" />
        <div className="pointer-events-none absolute right-24 top-10 h-48 w-48 rounded-full bg-cyan-50 blur-3xl" />
        <div className="relative grid gap-8 px-6 py-7 lg:grid-cols-[1fr_.8fr] lg:px-8 lg:py-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-900 shadow-[0_5px_16px_rgba(8,145,178,0.09)]">
                Cognitive Lab · Phase 1F
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                Learn + Preview + Pilot + Study execution
              </span>
            </div>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Build reusable cognitive tasks, then place them inside complete PsyLattice studies.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Cognitive Lab owns the task definition and version history. Study Builder owns when and where the task runs in the participant flow. The Participant Runner executes it, and Research Data owns the resulting trial-level dataset.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { value: String(templates.length), label: "Starter templates", icon: Library, accent: "text-cyan-700" },
              { value: String(tasks.length), label: "My tasks", icon: FlaskConical, accent: "text-cyan-700" },
              { value: String(activePilotLinks), label: "Active pilot links", icon: Link2, accent: "text-cyan-700" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-[22px] border border-slate-200 bg-white/95 p-4 shadow-[0_2px_6px_rgba(15,23,42,0.045),0_12px_28px_rgba(15,23,42,0.075)]">
                  <Icon className={`h-4 w-4 ${stat.accent}`} />
                  <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 rounded-[24px] border border-slate-300/75 bg-white p-2 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_28px_rgba(15,23,42,0.075)]">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-xs font-semibold transition-all ${
                active
                  ? "border border-cyan-200 bg-white text-cyan-950 shadow-[0_5px_16px_rgba(8,145,178,0.14),0_10px_24px_rgba(15,23,42,0.055)]"
                  : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900 hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <div className={`flex items-start gap-3 px-1 text-sm ${notice.type === "success" ? "text-cyan-900" : "text-rose-700"}`}>
          <span className={`mt-1 h-4 w-1 rounded-full ${notice.type === "success" ? "bg-cyan-500" : "bg-rose-500"}`} aria-hidden="true" />
          <span className="leading-6">{notice.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-[26px] border border-slate-300/70 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)]">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Cognitive Lab…
          </div>
        </div>
      ) : tab === "overview" ? (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Workflow foundation</p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-slate-950">One task, reusable across many studies.</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab("learn")}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2.5 shadow-[0_5px_16px_rgba(8,145,178,0.10)] transition hover:-translate-y-px text-xs font-semibold text-cyan-900"
                >
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  Learn how it works
                </button>
                <button
                  type="button"
                  onClick={() => setTab("library")}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 shadow-[0_4px_10px_rgba(15,23,42,0.16),0_10px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-px text-xs font-semibold text-white"
                >
                  Browse templates
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["01", "Cognitive Lab", "Create or clone a reusable task definition."],
                ["02", "Version", "Freeze the exact task configuration used in research."],
                ["03", "Study Builder", "Choose when the task is administered."],
                ["04", "Research Data", "Keep trial-level results aligned with the study."],
              ].map(([number, title, text]) => (
                <div key={number} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,0.055)] shadow-[0_5px_16px_rgba(15,23,42,0.055)]">
                  <p className="text-[10px] font-semibold text-cyan-700">{number}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-200/80 bg-cyan-50/55 shadow-[0_7px_20px_rgba(8,145,178,0.07)] p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
                <div>
                  <p className="text-sm font-semibold text-cyan-950">What Cognitive Lab does now</p>
                  <p className="mt-1 text-xs leading-5 text-cyan-900/70">
                    The task templates, personal Cognitive Task Library, visual Task Builder, calibrated Preview runner and Pilot Sessions work together. Publish a tested version when it is ready to be selected inside Study Builder.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Quick start</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Start from a task family or create your own.</h3>
            <div className="mt-5 space-y-3">
              {templates.slice(0, 3).map((task) => {
                const profile = templateProfiles[task.template_key || ""];
                const Icon = profile?.icon || BrainCircuit;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      setSearch(task.title);
                      setTab("library");
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_4px_14px_rgba(15,23,42,0.05)] text-left transition hover:border-cyan-200 hover:bg-cyan-50/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{profile?.kicker || formatDomain(task.domain)}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
            >
              <Plus className="h-4 w-4" />
              Create blank cognitive task
            </button>
          </section>
        </div>
      ) : tab === "learn" ? (
        <CognitiveLearningHub />
      ) : tab === "library" ? (
        <div className="space-y-5">
          <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Cognitive Task Library</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Starter task structures for common cognitive paradigms.</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  These are configurable implementation templates. A template name does not by itself make a particular configuration psychometrically or experimentally valid for every protocol.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search cognitive tasks"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-300 sm:w-64"
                  />
                </label>
                <select
                  value={selectedDomain}
                  onChange={(event) => setSelectedDomain(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-px.5 text-sm text-slate-600"
                >
                  <option value="all">All domains</option>
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>{formatDomain(domain)}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredTemplates.map((task) => {
              const profile = templateProfiles[task.template_key || ""];
              const Icon = profile?.icon || BrainCircuit;
              const outputs = task.library_metadata?.typical_outputs || profile?.fallbackOutputs || [];
              const cloning = busyTaskId === task.id;
              return (
                <article key={task.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <StagePill stage={task.template_stage} />
                  </div>
                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {profile?.kicker || formatDomain(task.domain)}
                  </p>
                  <h4 className="mt-1 text-lg font-semibold text-slate-950">{task.title}</h4>
                  <p className="mt-2 min-h-12 text-xs leading-5 text-slate-500">{task.description}</p>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Typical outputs</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {outputs.slice(0, 4).map((output) => (
                        <span key={output} className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-600">
                          {output}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <DevicePills support={task.default_device_support} />
                    <button
                      type="button"
                      onClick={() => void cloneTemplate(task)}
                      disabled={cloning}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950 px-3.5 py-2.5 shadow-[0_4px_10px_rgba(15,23,42,0.16),0_10px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-px text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {cloning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      Use template
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <EmptyState icon={Search} title="No matching task templates" text="Try another search term or cognitive domain." />
          )}
        </div>
      ) : tab === "tasks" ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
          <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">My Cognitive Tasks</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Your personal library of reusable cognitive tasks.</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 shadow-[0_4px_10px_rgba(15,23,42,0.16),0_10px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-px text-xs font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Create task
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  icon={FlaskConical}
                  title="No cognitive tasks yet"
                  text="Clone a starter task from Task Templates or create a blank task. Drafts and study-ready versions live here independently of any one study."
                  action={
                    <button
                      type="button"
                      onClick={() => setTab("library")}
                      className="rounded-full bg-slate-950 px-4 py-2.5 shadow-[0_4px_10px_rgba(15,23,42,0.16),0_10px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-px text-xs font-semibold text-white"
                    >
                      Browse Task Templates
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {tasks.map((task) => {
                  const version = versionFor(task.id);
                  const selected = selectedTaskId === task.id;
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-cyan-300 bg-cyan-50/45"
                          : "border-slate-200 bg-white hover:border-cyan-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                              {version?.version_label || "Draft v1"}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatDomain(task.domain)} · Updated {formatDate(task.updated_at)}
                          </p>
                        </div>
                        {publishedVersionFor(task.id) ? (
                          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[9px] font-semibold text-cyan-900 shadow-[0_4px_12px_rgba(8,145,178,0.08)]">
                            {version?.status === "draft" ? "Study-ready + draft" : "Ready for studies"}
                          </span>
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.05)]">
                            Draft only
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
            {selectedTask ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Selected task</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">{selectedTask.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{selectedTask.description || "No description yet."}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void archiveTask(selectedTask)}
                    disabled={busyTaskId === selectedTask.id}
                    aria-label="Archive task"
                    title="Archive task"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    {busyTaskId === selectedTask.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,0.055)] shadow-[0_5px_16px_rgba(15,23,42,0.055)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Working version</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{versionFor(selectedTask.id)?.version_label || "Draft v1"}</p>
                    <p className="mt-1 text-[10px] capitalize text-slate-400">{versionFor(selectedTask.id)?.status || "draft"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,0.055)] shadow-[0_5px_16px_rgba(15,23,42,0.055)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Study-ready version</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{publishedVersionFor(selectedTask.id)?.version_label || "Not published yet"}</p>
                    <p className="mt-1 text-[10px] text-slate-400">Study Builder only uses frozen published versions</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,0.055)] shadow-[0_5px_16px_rgba(15,23,42,0.055)]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Source</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedTask.source_template_id ? "PsyLattice template" : "Blank custom task"}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-200/80 bg-cyan-50/55 shadow-[0_7px_20px_rgba(8,145,178,0.07)] p-4">
                  <p className="text-sm font-semibold text-cyan-950">Personal Cognitive Task Library</p>
                  <p className="mt-1 text-xs leading-5 text-cyan-900/70">
                    Preview and pilot your working draft. When it is ready, publish that exact version for studies. Published versions stay frozen so later edits cannot silently change an existing protocol.
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setBuilderTaskId(selectedTask.id)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:border-cyan-200"
                  >
                    {versionFor(selectedTask.id)?.status === "draft" ? "Open Task Builder" : "View Task Builder"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {versionFor(selectedTask.id)?.status === "draft" ? (
                    <button
                      type="button"
                      onClick={() => void publishTask(selectedTask)}
                      disabled={busyTaskId === `publish:${selectedTask.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busyTaskId === `publish:${selectedTask.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Mark ready for studies
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void createEditableVersion(selectedTask)}
                      disabled={busyTaskId === `draft:${selectedTask.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busyTaskId === `draft:${selectedTask.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create editable version
                    </button>
                  )}
                </div>

                {versionFor(selectedTask.id)?.status === "draft" && publishedVersionFor(selectedTask.id) && (
                  <p className="mt-3 text-[11px] leading-5 text-slate-500">
                    Your current draft is newer than the published study version. Existing and newly configured studies keep using <strong>{publishedVersionFor(selectedTask.id)?.version_label}</strong> until you publish this draft.
                  </p>
                )}
              </div>
            ) : (
              <EmptyState icon={BrainCircuit} title="Select a cognitive task" text="Choose a task on the left to inspect its current version and source." />
            )}
          </section>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><Link2 className="h-4 w-4" /></span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Pilot Sessions</p>
                    <h3 className="mt-1 text-xl font-semibold text-slate-950">Share a real task before putting it in a study.</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Creating a pilot link freezes a snapshot of the current saved task. Testers can run that snapshot without a PsyLattice account, while their pilot data remains separate from final study data.
                </p>
              </div>
              <div className="grid min-w-[240px] grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,0.055)] shadow-[0_5px_16px_rgba(15,23,42,0.055)]"><p className="text-2xl font-semibold text-slate-950">{activePilotLinks}</p><p className="mt-1 text-[10px] text-slate-500">Active links</p></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,0.055)] shadow-[0_5px_16px_rgba(15,23,42,0.055)]"><p className="text-2xl font-semibold text-slate-950">{completedPilots}</p><p className="mt-1 text-[10px] text-slate-500">Completed runs</p></div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-200/80 bg-cyan-50/55 shadow-[0_7px_20px_rgba(8,145,178,0.07)] p-4">
              <p className="text-sm font-semibold text-cyan-950">Create pilot link</p>
              {tasks.length === 0 ? (
                <p className="mt-2 text-xs leading-5 text-cyan-900/70">Create or clone a cognitive task first, then save it in the Task Builder.</p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_.7fr_.7fr_auto]">
                  <label className="block"><span className="text-[10px] font-semibold text-slate-600">Task</span><select value={pilotTaskId} onChange={(event) => setPilotTaskId(event.target.value)} className="mt-1.5 w-full rounded-full border border-slate-300/80 bg-white px-3 py-2.5 text-xs shadow-[0_4px_14px_rgba(15,23,42,0.05)] text-slate-700">{tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>
                  <label className="block"><span className="text-[10px] font-semibold text-slate-600">Pilot name</span><input value={pilotLabel} onChange={(event) => setPilotLabel(event.target.value)} className="mt-1.5 w-full rounded-full border border-slate-300/80 bg-white px-3 py-2.5 text-xs shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-400" /></label>
                  <label className="block"><span className="text-[10px] font-semibold text-slate-600">Max runs</span><input type="number" min="1" value={pilotLimit} onChange={(event) => setPilotLimit(event.target.value)} placeholder="No limit" className="mt-1.5 w-full rounded-full border border-slate-300/80 bg-white px-3 py-2.5 text-xs shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-400" /></label>
                  <label className="block"><span className="text-[10px] font-semibold text-slate-600">Expires in</span><div className="mt-1.5 flex items-center gap-1.5"><input type="number" min="1" value={pilotExpiryDays} onChange={(event) => setPilotExpiryDays(event.target.value)} className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-cyan-400" /><span className="text-[10px] text-slate-500">days</span></div></label>
                  <button type="button" onClick={() => void createPilotLink()} disabled={creatingPilot || !pilotTaskId} className="self-end rounded-full bg-slate-950 px-4 py-2.5 shadow-[0_4px_10px_rgba(15,23,42,0.16),0_10px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-px text-xs font-semibold text-white disabled:opacity-50">{creatingPilot ? "Creating…" : "Create link"}</button>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Shareable pilots</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Pilot links</h3></div></div>
            {pilotLinks.length === 0 ? (
              <div className="mt-5"><EmptyState icon={Link2} title="No pilot links yet" text="Choose a saved task above and create a link. Each link keeps its own immutable task snapshot." /></div>
            ) : (
              <div className="mt-5 space-y-3">
                {pilotLinks.map((link) => {
                  const task = tasks.find((item) => item.id === link.task_id);
                  const expired = !!link.expires_at && new Date(link.expires_at).getTime() <= Date.now();
                  const exhausted = link.max_completions !== null && link.completion_count >= link.max_completions;
                  const live = link.status === "active" && !expired && !exhausted;
                  return (
                    <div key={link.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,0.055)]">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-950">{link.label}</p><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${live ? "border border-cyan-200 bg-cyan-50 text-cyan-900 shadow-[0_4px_12px_rgba(8,145,178,0.08)]" : "bg-slate-100 text-slate-500"}`}>{live ? "Active" : expired ? "Expired" : exhausted ? "Limit reached" : "Closed"}</span></div>
                          <p className="mt-1 text-[11px] text-slate-500">{task?.title || "Cognitive task"} · {link.completion_count}{link.max_completions !== null ? ` / ${link.max_completions}` : ""} completed · Created {formatDate(link.created_at)}</p>
                          <p className="mt-1 truncate font-mono text-[9px] text-slate-400">{pilotUrl(link.token)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => void copyPilotLink(link.token)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-px text-[10px] font-semibold text-slate-600"><Copy className="h-3.5 w-3.5" /> Copy</button>
                          {live && <a href={pilotUrl(link.token)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-px text-[10px] font-semibold text-slate-600"><ExternalLink className="h-3.5 w-3.5" /> Test</a>}
                          <button type="button" onClick={() => void setPilotLinkStatus(link, link.status === "active" ? "closed" : "active")} className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-px text-[10px] font-semibold text-slate-600">{link.status === "active" ? "Close link" : "Reopen"}</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Incoming runs</p><h3 className="mt-1 text-lg font-semibold text-slate-950">Recent pilot sessions</h3></div>
            {pilotSessions.length === 0 ? (
              <div className="mt-5"><EmptyState icon={Clock3} title="No pilot runs yet" text="Completed and abandoned pilot runs will appear here after testers open your pilot links." /></div>
            ) : (
              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                <div className="grid grid-cols-[1.2fr_.7fr_.8fr] bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500"><span>Task</span><span>Status</span><span>Created</span></div>
                {pilotSessions.map((session) => {
                  const task = tasks.find((item) => item.id === session.task_id);
                  return <div key={session.id} className="grid grid-cols-[1.2fr_.7fr_.8fr] border-t border-slate-100 px-4 py-3 text-xs text-slate-600"><span className="font-semibold text-slate-900">{task?.title || "Cognitive task"}</span><span className="capitalize">{session.status.replace("_", " ")}</span><span>{formatDate(session.created_at)}</span></div>;
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[26px] border border-slate-300/70 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">New cognitive task</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Create a blank reusable task.</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Task title</span>
                <input
                  value={newTaskTitle}
                  onChange={(event) => setNewTaskTitle(event.target.value)}
                  placeholder="e.g. Emotional Stroop"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-cyan-300"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Domain</span>
                <select
                  value={newTaskDomain}
                  onChange={(event) => setNewTaskDomain(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm"
                >
                  <option value="general">General</option>
                  <option value="attention">Attention</option>
                  <option value="inhibitory_control">Inhibitory control</option>
                  <option value="working_memory">Working memory</option>
                  <option value="memory">Memory</option>
                  <option value="perception">Perception</option>
                  <option value="decision_making">Decision making</option>
                  <option value="social_affective">Social / affective</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">Description</span>
                <textarea
                  value={newTaskDescription}
                  onChange={(event) => setNewTaskDescription(event.target.value)}
                  rows={4}
                  placeholder="What will this task measure or manipulate?"
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none transition focus:border-cyan-300"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createTask()}
                disabled={busyTaskId === "create"}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white disabled:opacity-60"
              >
                {busyTaskId === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
