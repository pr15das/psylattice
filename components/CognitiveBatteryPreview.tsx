"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BatteryMedium, Check, Clock3, Layers3, Play, X } from "lucide-react";
import CognitiveRunner from "@/components/CognitiveRunner";

export type BatteryPreviewItem = {
  local_id: string;
  task_id: string;
  task_version_id: string;
  title: string;
  version_label: string;
  transition_text: string;
  break_after_seconds: number;
};

export default function CognitiveBatteryPreview({
  title,
  participantIntro,
  orderLabel,
  showTaskProgress,
  showTransitionScreens,
  items,
  onClose,
}: {
  title: string;
  participantIntro: string;
  orderLabel: string;
  showTaskProgress: boolean;
  showTransitionScreens: boolean;
  items: BatteryPreviewItem[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState<"intro" | "transition" | "task" | "break" | "complete">("intro");
  const [remaining, setRemaining] = useState(0);
  const current = items[index] || null;

  const progress = useMemo(() => items.length ? Math.round((index / items.length) * 100) : 0, [index, items.length]);

  useEffect(() => {
    if (stage !== "break" || remaining <= 0) return;
    const id = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [stage, remaining]);

  function enterTask() {
    if (!current) return;
    setStage("task");
  }

  function afterTask() {
    if (!current) return;
    if (current.break_after_seconds > 0 && index < items.length - 1) {
      setRemaining(current.break_after_seconds);
      setStage("break");
      return;
    }
    goNext();
  }

  function goNext() {
    if (index >= items.length - 1) {
      setStage("complete");
      return;
    }
    setIndex((value) => value + 1);
    setStage(showTransitionScreens ? "transition" : "task");
  }

  if (stage === "task" && current) {
    return (
      <CognitiveRunner
        taskId={current.task_id}
        versionId={current.task_version_id}
        onClose={onClose}
        onCompletionAction={afterTask}
        completionActionLabel={index < items.length - 1 ? "Continue battery" : "Finish battery preview"}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-5xl overflow-hidden rounded-[30px] border border-slate-700/60 bg-[#f7fafb] shadow-2xl sm:min-h-[calc(100vh-40px)]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></button>
            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Battery Preview · 2M</p><p className="truncate text-sm font-semibold text-slate-950">{title}</p></div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" /></button>
        </header>

        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
          {showTaskProgress && stage !== "intro" && stage !== "complete" && (
            <div className="mb-6 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>Task {Math.min(index + 1, items.length)} of {items.length}</span><span>{progress}% through battery</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-700 transition-all" style={{ width: `${Math.max(4, progress)}%` }} /></div>
            </div>
          )}

          {stage === "intro" && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800"><BatteryMedium className="h-5 w-5" /></div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">Whole-battery preview</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{participantIntro || "You will complete a series of cognitive tasks. Follow the instructions shown before each task."}</p>
              <div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600"><Layers3 className="mr-1 inline h-3 w-3" /> {items.length} tasks</span><span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600">{orderLabel}</span></div>
              <p className="mt-4 text-[11px] leading-5 text-slate-500">Preview follows the listed battery order. Participant-specific randomisation/counterbalancing is assigned when the published battery runs inside a Study.</p>
              <button type="button" onClick={() => setStage(showTransitionScreens ? "transition" : "task")} disabled={!items.length} className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"><Play className="h-4 w-4" /> Start battery preview</button>
            </div>
          )}

          {stage === "transition" && current && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800"><Layers3 className="h-5 w-5" /></div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">Task {index + 1} of {items.length}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{current.title}</h2>
              <p className="mt-1 text-xs text-slate-400">Pinned · {current.version_label}</p>
              {current.transition_text && <p className="mx-auto mt-4 max-w-xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{current.transition_text}</p>}
              <button type="button" onClick={enterTask} className="mt-7 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Start this task</button>
            </div>
          )}

          {stage === "break" && (
            <div className="rounded-[28px] border border-slate-200 bg-white p-7 text-center shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800"><Clock3 className="h-5 w-5" /></div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">Battery break</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">{remaining}s</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">The battery requests a short break after this task. Preview can continue when the countdown reaches zero.</p>
              <button type="button" disabled={remaining > 0} onClick={goNext} className="mt-7 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue preview</button>
            </div>
          )}

          {stage === "complete" && (
            <div className="rounded-[28px] border border-cyan-200 bg-white p-7 text-center shadow-[0_18px_44px_rgba(8,145,178,0.10)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800"><Check className="h-5 w-5" /></div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">Battery preview complete</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">All {items.length} tasks finished.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">Each task kept its own Preview session and deterministic scoring. The battery only orchestrated task order, transitions and breaks.</p>
              <button type="button" onClick={onClose} className="mt-7 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Back to Battery Builder</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
