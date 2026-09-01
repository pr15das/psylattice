"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BatteryMedium,
  Check,
  Clock3,
  Layers3,
  Loader2,
  LockKeyhole,
  Plus,
  Search,
  Shuffle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CognitiveBatteryPreview, { type BatteryPreviewItem } from "@/components/CognitiveBatteryPreview";

type Battery = {
  id: string;
  owner_user_id: string;
  title: string;
  description: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

type BatteryVersion = {
  id: string;
  battery_id: string;
  version_number: number;
  version_label: string;
  status: "draft" | "published" | "locked" | "archived";
  title_snapshot: string;
  description_snapshot: string;
  participant_intro: string;
  order_mode: "fixed" | "randomized" | "counterbalanced";
  counterbalance_strategy: "latin_square" | "balanced_latin_square";
  randomization_config: Record<string, unknown> | null;
  show_task_progress: boolean;
  show_transition_screens: boolean;
  default_break_seconds: number;
  published_at: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

type BatteryItemRow = {
  id: string;
  battery_version_id: string;
  position: number;
  task_id: string;
  task_version_id: string;
  required: boolean;
  transition_text: string;
  break_after_seconds: number;
  task_title_snapshot: string;
  task_domain_snapshot: string;
  estimated_minutes_snapshot: string | null;
  config: Record<string, unknown> | null;
};

type CognitiveTask = {
  id: string;
  title: string;
  short_title: string | null;
  description: string;
  domain: string;
  status: string;
  template_key: string | null;
  source_template_id: string | null;
  library_metadata: {
    estimated_minutes?: string;
    what_it_measures?: string;
  } | null;
};

type CognitiveVersion = {
  id: string;
  task_id: string;
  version_number: number;
  version_label: string;
  status: "draft" | "published" | "locked" | "archived";
  runtime_engine: string;
};

type EditableItem = {
  local_id: string;
  task_id: string;
  task_version_id: string;
  required: boolean;
  transition_text: string;
  break_after_seconds: number;
};

type Notice = { type: "success" | "error"; text: string } | null;

function formatDomain(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function estimateRange(text: string | null | undefined): [number, number] | null {
  if (!text) return null;
  const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (!numbers.length) return null;
  if (numbers.length === 1) return [numbers[0], numbers[0]];
  return [Math.min(numbers[0], numbers[1]), Math.max(numbers[0], numbers[1])];
}

function estimateLabel(items: EditableItem[], taskById: Map<string, CognitiveTask>) {
  let min = 0;
  let max = 0;
  let known = 0;
  items.forEach((item) => {
    const range = estimateRange(taskById.get(item.task_id)?.library_metadata?.estimated_minutes);
    if (!range) return;
    min += range[0];
    max += range[1];
    known += 1;
  });
  if (!known) return "Duration depends on task settings";
  const suffix = known < items.length ? " + configured tasks" : "";
  return `${Math.round(min)}${Math.round(max) !== Math.round(min) ? `–${Math.round(max)}` : ""} min${suffix}`;
}

function StatusPill({ status }: { status: BatteryVersion["status"] }) {
  const published = status === "published" || status === "locked";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-semibold ${published ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-500"}`}>
      {published && <LockKeyhole className="h-3 w-3" />}
      {published ? "Ready for studies" : status === "draft" ? "Editable draft" : status}
    </span>
  );
}

function OrderCard({
  active,
  title,
  text,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  text: string;
  icon: typeof Layers3;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[20px] border p-4 text-left transition ${active ? "border-cyan-300 bg-cyan-50/60 shadow-[0_8px_24px_rgba(8,145,178,0.10)]" : "border-slate-200 bg-white hover:border-cyan-200"}`}
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? "bg-white text-cyan-700" : "bg-slate-100 text-slate-500"}`}><Icon className="h-4 w-4" /></span>
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        {active && <Check className="ml-auto h-4 w-4 text-cyan-700" />}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-slate-500">{text}</p>
    </button>
  );
}

export default function CognitiveBatteryBuilder() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [versions, setVersions] = useState<BatteryVersion[]>([]);
  const [storedItems, setStoredItems] = useState<BatteryItemRow[]>([]);
  const [tasks, setTasks] = useState<CognitiveTask[]>([]);
  const [taskVersions, setTaskVersions] = useState<CognitiveVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedBatteryId, setSelectedBatteryId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState("Executive Function Battery");
  const [createDescription, setCreateDescription] = useState("");
  const [taskSearch, setTaskSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participantIntro, setParticipantIntro] = useState("");
  const [orderMode, setOrderMode] = useState<BatteryVersion["order_mode"]>("fixed");
  const [counterbalanceStrategy, setCounterbalanceStrategy] = useState<BatteryVersion["counterbalance_strategy"]>("latin_square");
  const [showTaskProgress, setShowTaskProgress] = useState(true);
  const [showTransitionScreens, setShowTransitionScreens] = useState(true);
  const [defaultBreakSeconds, setDefaultBreakSeconds] = useState(0);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const user = auth.user;
    if (authError || !user) {
      setNotice({ type: "error", text: "Your cognitive batteries could not be loaded." });
      setLoading(false);
      return;
    }

    const [batteryResult, taskResult] = await Promise.all([
      supabase
        .from("cognitive_batteries")
        .select("id,owner_user_id,title,description,status,created_at,updated_at")
        .eq("owner_user_id", user.id)
        .neq("status", "archived")
        .order("updated_at", { ascending: false }),
      supabase
        .from("cognitive_tasks")
        .select("id,title,short_title,description,domain,status,template_key,source_template_id,library_metadata")
        .eq("owner_user_id", user.id)
        .neq("status", "archived")
        .order("title", { ascending: true }),
    ]);

    const firstError = batteryResult.error || taskResult.error;
    if (firstError) {
      setNotice({ type: "error", text: firstError.message });
      setLoading(false);
      return;
    }

    const nextBatteries = (batteryResult.data || []) as Battery[];
    const nextTasks = (taskResult.data || []) as CognitiveTask[];

    let nextVersions: BatteryVersion[] = [];
    let nextItems: BatteryItemRow[] = [];
    if (nextBatteries.length) {
      const versionResult = await supabase
        .from("cognitive_battery_versions")
        .select("id,battery_id,version_number,version_label,status,title_snapshot,description_snapshot,participant_intro,order_mode,counterbalance_strategy,randomization_config,show_task_progress,show_transition_screens,default_break_seconds,published_at,locked_at,created_at,updated_at")
        .in("battery_id", nextBatteries.map((item) => item.id))
        .order("version_number", { ascending: false });
      if (versionResult.error) {
        setNotice({ type: "error", text: versionResult.error.message });
        setLoading(false);
        return;
      }
      nextVersions = (versionResult.data || []) as BatteryVersion[];

      if (nextVersions.length) {
        const itemResult = await supabase
          .from("cognitive_battery_items")
          .select("id,battery_version_id,position,task_id,task_version_id,required,transition_text,break_after_seconds,task_title_snapshot,task_domain_snapshot,estimated_minutes_snapshot,config")
          .in("battery_version_id", nextVersions.map((item) => item.id))
          .order("position", { ascending: true });
        if (itemResult.error) {
          setNotice({ type: "error", text: itemResult.error.message });
          setLoading(false);
          return;
        }
        nextItems = (itemResult.data || []) as BatteryItemRow[];
      }
    }

    let nextTaskVersions: CognitiveVersion[] = [];
    if (nextTasks.length) {
      const taskVersionResult = await supabase
        .from("cognitive_task_versions")
        .select("id,task_id,version_number,version_label,status,runtime_engine")
        .in("task_id", nextTasks.map((item) => item.id))
        .in("status", ["published", "locked"])
        .order("version_number", { ascending: false });
      if (taskVersionResult.error) {
        setNotice({ type: "error", text: taskVersionResult.error.message });
        setLoading(false);
        return;
      }
      nextTaskVersions = (taskVersionResult.data || []) as CognitiveVersion[];
    }

    setBatteries(nextBatteries);
    setVersions(nextVersions);
    setStoredItems(nextItems);
    setTasks(nextTasks);
    setTaskVersions(nextTaskVersions);
    setSelectedBatteryId((current) => current && nextBatteries.some((b) => b.id === current) ? current : nextBatteries[0]?.id || "");
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const latestVersionFor = useCallback((batteryId: string) =>
    versions.filter((v) => v.battery_id === batteryId).sort((a, b) => b.version_number - a.version_number)[0] || null,
  [versions]);

  const publishedVersionFor = useCallback((batteryId: string) =>
    versions.filter((v) => v.battery_id === batteryId && (v.status === "published" || v.status === "locked")).sort((a, b) => b.version_number - a.version_number)[0] || null,
  [versions]);

  const publishedTaskVersionFor = useCallback((taskId: string) =>
    taskVersions.filter((v) => v.task_id === taskId).sort((a, b) => b.version_number - a.version_number)[0] || null,
  [taskVersions]);

  const selectedBattery = batteries.find((b) => b.id === selectedBatteryId) || null;
  const selectedVersion = selectedBattery ? latestVersionFor(selectedBattery.id) : null;
  const editable = selectedVersion?.status === "draft";

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const previewItems: BatteryPreviewItem[] = useMemo(() =>
    items.map((item) => {
      const task = taskById.get(item.task_id);
      const version = taskVersions.find((candidate) => candidate.id === item.task_version_id);
      return {
        local_id: item.local_id,
        task_id: item.task_id,
        task_version_id: item.task_version_id,
        title: task?.title || "Cognitive task",
        version_label: version?.version_label || "Published version",
        transition_text: item.transition_text,
        break_after_seconds: item.break_after_seconds,
      };
    }),
  [items, taskById, taskVersions]);

  const previewOrderLabel = orderMode === "randomized"
    ? "Randomised in Study execution"
    : orderMode === "counterbalanced"
      ? (counterbalanceStrategy === "balanced_latin_square" ? "Balanced Latin square in Study execution" : "Latin square in Study execution")
      : "Fixed order";

  useEffect(() => {
    if (!selectedBattery || !selectedVersion) {
      setTitle("");
      setDescription("");
      setParticipantIntro("");
      setItems([]);
      return;
    }
    setTitle(selectedVersion.title_snapshot || selectedBattery.title);
    setDescription(selectedVersion.description_snapshot || selectedBattery.description || "");
    setParticipantIntro(selectedVersion.participant_intro || "");
    setOrderMode(selectedVersion.order_mode || "fixed");
    setCounterbalanceStrategy(selectedVersion.counterbalance_strategy || "latin_square");
    setShowTaskProgress(selectedVersion.show_task_progress !== false);
    setShowTransitionScreens(selectedVersion.show_transition_screens !== false);
    setDefaultBreakSeconds(Number(selectedVersion.default_break_seconds || 0));
    setItems(
      storedItems
        .filter((row) => row.battery_version_id === selectedVersion.id)
        .sort((a, b) => a.position - b.position)
        .map((row) => ({
          local_id: row.id,
          task_id: row.task_id,
          task_version_id: row.task_version_id,
          required: row.required,
          transition_text: row.transition_text || "",
          break_after_seconds: Number(row.break_after_seconds || 0),
        }))
    );
  }, [selectedBatteryId, selectedBattery, selectedVersion, storedItems]);

  const readyTasks = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();
    return tasks
      .filter((task) => Boolean(publishedTaskVersionFor(task.id)))
      .filter((task) => !query || [task.title, task.description, task.domain, task.library_metadata?.what_it_measures || ""].join(" ").toLowerCase().includes(query));
  }, [tasks, taskSearch, publishedTaskVersionFor]);

  async function createBattery() {
    const nextTitle = createTitle.trim();
    if (!nextTitle) {
      setNotice({ type: "error", text: "Give the battery a title first." });
      return;
    }
    setBusy(true);
    setNotice(null);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("psylattice_create_cognitive_battery", {
      p_title: nextTitle,
      p_description: createDescription.trim(),
    });
    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusy(false);
      return;
    }
    const batteryId = data && typeof data === "object" && "battery_id" in data ? String((data as { battery_id?: unknown }).battery_id || "") : "";
    setShowCreate(false);
    setCreateTitle("Executive Function Battery");
    setCreateDescription("");
    setNotice({ type: "success", text: "Battery created. Add study-ready cognitive tasks and save the draft." });
    await load();
    if (batteryId) setSelectedBatteryId(batteryId);
    setBusy(false);
  }

  function addTask(task: CognitiveTask) {
    if (!editable || !selectedVersion) return;
    const version = publishedTaskVersionFor(task.id);
    if (!version) return;
    setItems((current) => [
      ...current,
      {
        local_id: `new-${crypto.randomUUID()}`,
        task_id: task.id,
        task_version_id: version.id,
        required: true,
        transition_text: "",
        break_after_seconds: defaultBreakSeconds,
      },
    ]);
  }

  function updateItem(localId: string, patch: Partial<EditableItem>) {
    setItems((current) => current.map((item) => item.local_id === localId ? { ...item, ...patch } : item));
  }

  function moveItem(index: number, delta: -1 | 1) {
    setItems((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      return next;
    });
  }

  async function saveDraft() {
    if (!selectedBattery || !selectedVersion || !editable) return;
    if (!title.trim()) {
      setNotice({ type: "error", text: "Battery title is required." });
      return;
    }
    setBusy(true);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("psylattice_save_cognitive_battery_draft", {
      p_battery_id: selectedBattery.id,
      p_version_id: selectedVersion.id,
      p_payload: {
        title: title.trim(),
        description: description.trim(),
        participant_intro: participantIntro.trim(),
        order_mode: orderMode,
        counterbalance_strategy: counterbalanceStrategy,
        randomization_config: { seed_mode: "participant" },
        show_task_progress: showTaskProgress,
        show_transition_screens: showTransitionScreens,
        default_break_seconds: defaultBreakSeconds,
        items: items.map((item) => ({
          task_id: item.task_id,
          task_version_id: item.task_version_id,
          required: item.required,
          transition_text: item.transition_text,
          break_after_seconds: item.break_after_seconds,
        })),
      },
    });
    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusy(false);
      return;
    }
    setNotice({ type: "success", text: "Battery draft saved. Every task remains pinned to its exact Ready for studies version." });
    await load();
    setBusy(false);
  }

  async function publishBattery() {
    if (!selectedBattery || !selectedVersion || !editable) return;
    if (!items.length) {
      setNotice({ type: "error", text: "Add at least one cognitive task before publishing this battery." });
      return;
    }
    const confirmed = window.confirm(
      `Mark “${title || selectedBattery.title}” as Ready for studies?\n\nThis freezes the current battery version and every pinned cognitive task version. Future edits will happen in a new draft.`
    );
    if (!confirmed) return;
    setBusy(true);
    setNotice(null);

    const supabase = createClient();
    const saveResult = await supabase.rpc("psylattice_save_cognitive_battery_draft", {
      p_battery_id: selectedBattery.id,
      p_version_id: selectedVersion.id,
      p_payload: {
        title: title.trim(), description: description.trim(), participant_intro: participantIntro.trim(),
        order_mode: orderMode, counterbalance_strategy: counterbalanceStrategy,
        randomization_config: { seed_mode: "participant" }, show_task_progress: showTaskProgress,
        show_transition_screens: showTransitionScreens, default_break_seconds: defaultBreakSeconds,
        items: items.map((item) => ({ task_id: item.task_id, task_version_id: item.task_version_id, required: item.required, transition_text: item.transition_text, break_after_seconds: item.break_after_seconds })),
      },
    });
    if (saveResult.error) {
      setNotice({ type: "error", text: saveResult.error.message });
      setBusy(false);
      return;
    }

    const { error } = await supabase.rpc("psylattice_publish_cognitive_battery_version", {
      p_battery_id: selectedBattery.id,
      p_version_id: selectedVersion.id,
    });
    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusy(false);
      return;
    }
    setNotice({ type: "success", text: "Battery is now Ready for studies and frozen for reproducibility." });
    await load();
    setBusy(false);
  }

  async function createEditableVersion() {
    if (!selectedBattery) return;
    const published = publishedVersionFor(selectedBattery.id);
    if (!published) return;
    setBusy(true);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("psylattice_create_cognitive_battery_draft_version", {
      p_battery_id: selectedBattery.id,
      p_source_version_id: published.id,
    });
    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusy(false);
      return;
    }
    setNotice({ type: "success", text: "New editable battery version created. The published version remains frozen." });
    await load();
    setBusy(false);
  }

  async function archiveBattery() {
    if (!selectedBattery) return;
    if (!window.confirm(`Archive “${selectedBattery.title}”? Published versions remain in the database for reproducibility.`)) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("psylattice_archive_cognitive_battery", { p_battery_id: selectedBattery.id });
    if (error) {
      setNotice({ type: "error", text: error.message });
      setBusy(false);
      return;
    }
    setSelectedBatteryId("");
    setNotice({ type: "success", text: "Battery archived." });
    await load();
    setBusy(false);
  }

  const duration = estimateLabel(items, taskById);

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[26px] border border-slate-200 bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {notice && (
        <div className={`rounded-2xl border px-4 py-3 text-xs ${notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-cyan-200 bg-cyan-50 text-cyan-900"}`}>
          {notice.text}
        </div>
      )}

      <section className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.07)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700"><BatteryMedium className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Cognitive Batteries · 2M</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">Package study-ready tasks into a reusable battery.</h3>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              A battery pins exact cognitive task versions. Build it once, reuse it across studies later, and keep each underlying task independently reproducible.
            </p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(15,23,42,0.16)]">
            <Plus className="h-4 w-4" /> Create battery
          </button>
        </div>
      </section>

      {showCreate && (
        <section className="rounded-[24px] border border-cyan-200 bg-cyan-50/40 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-end">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Battery title</span>
              <input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400" />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Description</span>
              <input value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="What this battery measures or why you use it" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400" />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600">Cancel</button>
              <button type="button" onClick={() => void createBattery()} disabled={busy} className="rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Create</button>
            </div>
          </div>
        </section>
      )}

      {batteries.length === 0 ? (
        <section className="rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <BatteryMedium className="mx-auto h-8 w-8 text-cyan-700" />
          <h4 className="mt-4 text-lg font-semibold text-slate-950">No batteries yet</h4>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Create your first battery, then add any cognitive task that you have already marked Ready for studies.</p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[.72fr_1.4fr]">
          <section className="rounded-[26px] border border-slate-300/70 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between px-1 pb-3">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Saved batteries</p><p className="mt-1 text-sm font-semibold text-slate-900">{batteries.length} reusable {batteries.length === 1 ? "battery" : "batteries"}</p></div>
            </div>
            <div className="space-y-2">
              {batteries.map((battery) => {
                const version = latestVersionFor(battery.id);
                const count = version ? storedItems.filter((row) => row.battery_version_id === version.id).length : 0;
                const active = battery.id === selectedBatteryId;
                return (
                  <button key={battery.id} type="button" onClick={() => setSelectedBatteryId(battery.id)} className={`w-full rounded-[20px] border p-4 text-left transition ${active ? "border-cyan-300 bg-cyan-50/50" : "border-slate-200 bg-white hover:border-cyan-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{battery.title}</p><p className="mt-1 text-[10px] text-slate-500">{count} {count === 1 ? "task" : "tasks"} · Updated {formatDate(battery.updated_at)}</p></div>
                      {version && <StatusPill status={version.status} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedBattery && selectedVersion ? (
            <section className="space-y-4">
              <div className="rounded-[26px] border border-slate-300/70 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><StatusPill status={selectedVersion.status} /><span className="rounded-full border border-slate-200 px-2.5 py-1 text-[9px] font-semibold text-slate-500">{selectedVersion.version_label}</span><span className="rounded-full border border-slate-200 px-2.5 py-1 text-[9px] font-semibold text-slate-500">{items.length} tasks · {duration}</span></div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{selectedBattery.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">Battery versions are frozen independently from task versions. A published battery keeps the exact task versions it was built with.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setPreviewOpen(true)} disabled={busy || !items.length} className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-semibold text-cyan-900 disabled:opacity-40">Preview battery</button>
                    {!editable && publishedVersionFor(selectedBattery.id) && <button type="button" onClick={() => void createEditableVersion()} disabled={busy} className="rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">Create editable version</button>}
                    <button type="button" onClick={() => void archiveBattery()} disabled={busy} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500 disabled:opacity-50">Archive</button>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-slate-300/70 bg-white p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Battery title</span><input disabled={!editable} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm disabled:bg-slate-50" /></label>
                  <label><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Short description</span><input disabled={!editable} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm disabled:bg-slate-50" /></label>
                </div>
                <label className="mt-4 block"><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Participant introduction</span><textarea disabled={!editable} value={participantIntro} onChange={(e) => setParticipantIntro(e.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 disabled:bg-slate-50" /></label>
              </div>

              <div className="rounded-[26px] border border-slate-300/70 bg-white p-5 sm:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">Task order</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-950">Choose how PsyLattice should assign the battery order.</h4>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <OrderCard active={orderMode === "fixed"} title="Fixed" text="Everyone receives the tasks in the order shown below." icon={Layers3} onClick={() => editable && setOrderMode("fixed")} />
                  <OrderCard active={orderMode === "randomized"} title="Randomised" text="2M will assign a reproducible participant-specific task order." icon={Shuffle} onClick={() => editable && setOrderMode("randomized")} />
                  <OrderCard active={orderMode === "counterbalanced"} title="Counterbalanced" text="2M will assign participants across Latin-square order sequences." icon={Sparkles} onClick={() => editable && setOrderMode("counterbalanced")} />
                </div>
                {orderMode === "counterbalanced" && (
                  <label className="mt-4 block max-w-sm"><span className="text-[10px] font-semibold text-slate-500">Counterbalancing strategy</span><select disabled={!editable} value={counterbalanceStrategy} onChange={(e) => setCounterbalanceStrategy(e.target.value as BatteryVersion["counterbalance_strategy"])} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs"><option value="latin_square">Latin square</option><option value="balanced_latin_square">Balanced Latin square</option></select></label>
                )}
              </div>

              <div className="rounded-[26px] border border-slate-300/70 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">Battery flow</p><h4 className="mt-1 text-lg font-semibold text-slate-950">{items.length ? `${items.length} pinned tasks` : "Add your first task"}</h4><p className="mt-1 text-xs text-slate-500">Every row stores the exact published task version.</p></div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500"><span className="rounded-full bg-slate-100 px-2.5 py-1.5">Estimated · {duration}</span><span className="rounded-full bg-slate-100 px-2.5 py-1.5">Order · {orderMode}</span></div>
                </div>

                <div className="mt-5 space-y-3">
                  {items.map((item, index) => {
                    const task = taskById.get(item.task_id);
                    const version = taskVersions.find((v) => v.id === item.task_version_id);
                    return (
                      <div key={item.local_id} className="rounded-[22px] border border-slate-200 bg-[#fbfdfd] p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-semibold text-cyan-800 shadow-[0_3px_10px_rgba(15,23,42,0.05)]">{index + 1}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-950">{task?.title || "Cognitive task"}</p><span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-500">Pinned · {version?.version_label || "published version"}</span>{task && <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-500">{formatDomain(task.domain)}</span>}</div>
                            <p className="mt-1 text-[10px] text-slate-500">{task?.library_metadata?.estimated_minutes || "Duration depends on configuration"}</p>
                            {showTransitionScreens && <input disabled={!editable} value={item.transition_text} onChange={(e) => updateItem(item.local_id, { transition_text: e.target.value })} placeholder="Optional transition text before this task" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs disabled:bg-slate-50" />}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button type="button" disabled={!editable} onClick={() => updateItem(item.local_id, { required: !item.required })} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${item.required ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-500"}`}>{item.required ? "Required" : "Optional"}</button>
                              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-500"><Clock3 className="h-3 w-3" /><span>Break after</span><select disabled={!editable} value={item.break_after_seconds} onChange={(e) => updateItem(item.local_id, { break_after_seconds: Number(e.target.value) })} className="bg-transparent font-semibold text-slate-700 outline-none"><option value={0}>None</option><option value={30}>30 sec</option><option value={60}>1 min</option><option value={120}>2 min</option><option value={300}>5 min</option></select></label>
                            </div>
                          </div>
                          {editable && <div className="flex gap-1"><button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setItems((current) => current.filter((row) => row.local_id !== item.local_id))} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {editable && (
                <div className="rounded-[26px] border border-slate-300/70 bg-white p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">Add cognitive task</p><h4 className="mt-1 text-lg font-semibold text-slate-950">Only Ready for studies versions appear here.</h4></div><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} placeholder="Search your tasks" className="w-full rounded-full border border-slate-200 py-2.5 pl-9 pr-3 text-xs sm:w-64" /></label></div>
                  {readyTasks.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs leading-5 text-slate-500">No study-ready cognitive tasks match this search. Mark a task Ready for studies in My Cognitive Tasks first.</div> : <div className="mt-5 grid gap-3 md:grid-cols-2">{readyTasks.map((task) => { const version = publishedTaskVersionFor(task.id)!; return <button key={task.id} type="button" onClick={() => addTask(task)} className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50/30"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-cyan-700"><Plus className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-950">{task.title}</p><p className="mt-1 text-[10px] text-slate-500">{formatDomain(task.domain)} · {version.version_label} · {task.library_metadata?.estimated_minutes || "configured duration"}</p></div></button>; })}</div>}
                </div>
              )}

              <div className="rounded-[26px] border border-slate-300/70 bg-white p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <button type="button" disabled={!editable} onClick={() => setShowTaskProgress((value) => !value)} className={`rounded-[20px] border p-4 text-left ${showTaskProgress ? "border-cyan-200 bg-cyan-50/50" : "border-slate-200 bg-white"}`}><p className="text-xs font-semibold text-slate-900">Task progress</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{showTaskProgress ? "Show Task 2 of 5 during battery execution." : "Hide battery-level task progress."}</p></button>
                  <button type="button" disabled={!editable} onClick={() => setShowTransitionScreens((value) => !value)} className={`rounded-[20px] border p-4 text-left ${showTransitionScreens ? "border-cyan-200 bg-cyan-50/50" : "border-slate-200 bg-white"}`}><p className="text-xs font-semibold text-slate-900">Transition screens</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{showTransitionScreens ? "Allow a short message between tasks." : "Move directly between tasks."}</p></button>
                  <label className="rounded-[20px] border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-900">Default break</p><p className="mt-1 text-[10px] text-slate-500">Applied when a newly added task is inserted.</p><select disabled={!editable} value={defaultBreakSeconds} onChange={(e) => setDefaultBreakSeconds(Number(e.target.value))} className="mt-3 w-full rounded-lg border border-slate-200 px-2 py-2 text-xs"><option value={0}>No automatic break</option><option value={30}>30 seconds</option><option value={60}>1 minute</option><option value={120}>2 minutes</option></select></label>
                </div>
              </div>

              {editable && (
                <div className="sticky bottom-4 z-10 flex flex-col gap-2 rounded-[22px] border border-slate-200 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setPreviewOpen(true)} disabled={busy || !items.length} className="rounded-full border border-cyan-200 bg-cyan-50 px-5 py-2.5 text-xs font-semibold text-cyan-900 disabled:opacity-40">Preview battery</button>
                  <button type="button" onClick={() => void saveDraft()} disabled={busy} className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button>
                  <button type="button" onClick={() => void publishBattery()} disabled={busy || !items.length} className="rounded-full bg-slate-950 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-40">Mark Ready for studies</button>
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Select a battery to edit it.</section>
          )}
        </div>
      )}

      {previewOpen && selectedBattery && selectedVersion && (
        <CognitiveBatteryPreview
          title={title || selectedBattery.title}
          participantIntro={participantIntro}
          orderLabel={previewOrderLabel}
          showTaskProgress={showTaskProgress}
          showTransitionScreens={showTransitionScreens}
          items={previewItems}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      <section className="rounded-[24px] border border-cyan-200/80 bg-cyan-50/45 p-4">
        <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" /><div><p className="text-xs font-semibold text-cyan-950">Battery execution · 2M</p><p className="mt-1 text-[11px] leading-5 text-cyan-900/75">Whole-battery Preview is now live. Published batteries can also be added to Study Builder as a preserved battery or expanded into ordinary Study Flow tasks. Participant-specific randomisation/counterbalancing, transition screens and configured breaks are applied during Study execution.</p></div></div>
      </section>
    </div>
  );
}
