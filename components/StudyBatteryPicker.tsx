"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BatteryMedium, Layers3, Loader2, Plus, Search, SplitSquareVertical } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type StudyBatteryItemSelection = {
  id: string;
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
  task_description?: string;
  version_label?: string;
};

export type StudyBatterySelection = {
  battery_id: string;
  battery_version_id: string;
  title: string;
  description: string;
  version_label: string;
  order_mode: "fixed" | "randomized" | "counterbalanced";
  counterbalance_strategy: "latin_square" | "balanced_latin_square";
  participant_intro: string;
  show_task_progress: boolean;
  show_transition_screens: boolean;
  default_break_seconds: number;
  items: StudyBatteryItemSelection[];
};

function orderLabel(value: StudyBatterySelection["order_mode"], strategy: StudyBatterySelection["counterbalance_strategy"]) {
  if (value === "randomized") return "Randomised per participant";
  if (value === "counterbalanced") return strategy === "balanced_latin_square" ? "Balanced Latin square" : "Latin square";
  return "Fixed order";
}

export default function StudyBatteryPicker({
  onAddBattery,
}: {
  onAddBattery: (battery: StudyBatterySelection, mode: "battery" | "expand") => void;
}) {
  const [batteries, setBatteries] = useState<StudyBatterySelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const user = auth.user;
    if (authError || !user) {
      setError("Your cognitive batteries could not be loaded.");
      setLoading(false);
      return;
    }

    const { data: batteryRows, error: batteryError } = await supabase
      .from("cognitive_batteries")
      .select("id,title,description,status,updated_at")
      .eq("owner_user_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false });

    if (batteryError) {
      setError(batteryError.message);
      setLoading(false);
      return;
    }

    const batteryIds = (batteryRows || []).map((row: any) => String(row.id));
    if (!batteryIds.length) {
      setBatteries([]);
      setLoading(false);
      return;
    }

    const { data: versionRows, error: versionError } = await supabase
      .from("cognitive_battery_versions")
      .select("id,battery_id,version_number,version_label,status,title_snapshot,description_snapshot,participant_intro,order_mode,counterbalance_strategy,show_task_progress,show_transition_screens,default_break_seconds")
      .in("battery_id", batteryIds)
      .in("status", ["published", "locked"])
      .order("version_number", { ascending: false });

    if (versionError) {
      setError(versionError.message);
      setLoading(false);
      return;
    }

    const latest = new Map<string, any>();
    (versionRows || []).forEach((row: any) => {
      if (!latest.has(String(row.battery_id))) latest.set(String(row.battery_id), row);
    });
    const versionIds = Array.from(latest.values()).map((row: any) => String(row.id));

    const { data: itemRows, error: itemError } = versionIds.length
      ? await supabase
          .from("cognitive_battery_items")
          .select("id,battery_version_id,position,task_id,task_version_id,required,transition_text,break_after_seconds,task_title_snapshot,task_domain_snapshot,estimated_minutes_snapshot,config")
          .in("battery_version_id", versionIds)
          .order("position", { ascending: true })
      : { data: [], error: null } as any;

    if (itemError) {
      setError(itemError.message);
      setLoading(false);
      return;
    }

    const taskIds = Array.from(new Set((itemRows || []).map((row: any) => String(row.task_id))));
    const versionTaskIds = Array.from(new Set((itemRows || []).map((row: any) => String(row.task_version_id))));
    const [taskResult, taskVersionResult] = await Promise.all([
      taskIds.length
        ? supabase.from("cognitive_tasks").select("id,description").in("id", taskIds)
        : Promise.resolve({ data: [], error: null } as any),
      versionTaskIds.length
        ? supabase.from("cognitive_task_versions").select("id,version_label").in("id", versionTaskIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    const descriptionByTask = new Map((taskResult.data || []).map((row: any) => [String(row.id), String(row.description || "")]));
    const labelByVersion = new Map((taskVersionResult.data || []).map((row: any) => [String(row.id), String(row.version_label || "Published version")]));

    const batteryById = new Map((batteryRows || []).map((row: any) => [String(row.id), row]));
    const next: StudyBatterySelection[] = [];
    latest.forEach((version: any, batteryId: string) => {
      const battery = batteryById.get(batteryId);
      if (!battery) return;
      const items = (itemRows || [])
        .filter((row: any) => String(row.battery_version_id) === String(version.id))
        .sort((a: any, b: any) => Number(a.position) - Number(b.position))
        .map((row: any) => ({
          id: String(row.id),
          position: Number(row.position || 1),
          task_id: String(row.task_id),
          task_version_id: String(row.task_version_id),
          required: row.required !== false,
          transition_text: String(row.transition_text || ""),
          break_after_seconds: Number(row.break_after_seconds || 0),
          task_title_snapshot: String(row.task_title_snapshot || "Cognitive task"),
          task_domain_snapshot: String(row.task_domain_snapshot || "general"),
          estimated_minutes_snapshot: row.estimated_minutes_snapshot == null ? null : String(row.estimated_minutes_snapshot),
          config: row.config && typeof row.config === "object" ? row.config : {},
          task_description: descriptionByTask.get(String(row.task_id)) || "",
          version_label: labelByVersion.get(String(row.task_version_id)) || "Published version",
        }));

      next.push({
        battery_id: batteryId,
        battery_version_id: String(version.id),
        title: String(version.title_snapshot || battery.title || "Cognitive battery"),
        description: String(version.description_snapshot || battery.description || ""),
        version_label: String(version.version_label || `v${version.version_number || 1}`),
        order_mode: ["randomized", "counterbalanced"].includes(String(version.order_mode)) ? version.order_mode : "fixed",
        counterbalance_strategy: String(version.counterbalance_strategy) === "balanced_latin_square" ? "balanced_latin_square" : "latin_square",
        participant_intro: String(version.participant_intro || ""),
        show_task_progress: version.show_task_progress !== false,
        show_transition_screens: version.show_transition_screens !== false,
        default_break_seconds: Number(version.default_break_seconds || 0),
        items,
      });
    });

    setBatteries(next);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return batteries;
    return batteries.filter((battery) =>
      [battery.title, battery.description, ...battery.items.map((item) => item.task_title_snapshot)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [batteries, search]);

  return (
    <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/30 p-5 shadow-[0_8px_24px_rgba(8,145,178,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-800"><BatteryMedium className="h-4 w-4" /><p className="text-[10px] font-semibold uppercase tracking-[0.15em]">Cognitive batteries · 2M</p></div>
          <h4 className="mt-1 text-base font-semibold text-slate-950">Add a whole reusable battery.</h4>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Keep the battery together so PsyLattice can apply its fixed, randomised or counterbalanced order for each participant — or expand the tasks into ordinary Study Flow items.</p>
        </div>
        <label className="relative block sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search batteries" className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-cyan-400" />
        </label>
      </div>

      {error && <div className="mt-4 border-l-2 border-rose-400 py-1 pl-3 text-xs text-slate-600">{error}</div>}
      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading study-ready batteries…</div>
      ) : filtered.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-center text-xs leading-5 text-slate-500">No Ready for studies batteries match this search. Build and publish one in Cognitive Lab → Batteries first.</div>
      ) : (
        <div className="mt-5 grid gap-3">
          {filtered.map((battery) => (
            <div key={battery.battery_version_id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{battery.title}</p><span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[9px] font-semibold text-cyan-900">{battery.version_label}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold text-slate-600">{orderLabel(battery.order_mode, battery.counterbalance_strategy)}</span></div>
                  {battery.description && <p className="mt-2 text-xs leading-5 text-slate-500">{battery.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">{battery.items.map((item, index) => <span key={item.id} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-semibold text-slate-500">{index + 1}. {item.task_title_snapshot}</span>)}</div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button type="button" onClick={() => onAddBattery(battery, "expand")} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700"><SplitSquareVertical className="h-3.5 w-3.5" /> Expand into flow</button>
                  <button type="button" onClick={() => onAddBattery(battery, "battery")} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"><Plus className="h-3.5 w-3.5" /> Add as battery</button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400"><Layers3 className="h-3.5 w-3.5" /> {battery.items.length} task{battery.items.length === 1 ? "" : "s"} · exact task versions remain pinned</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
