"use client";

import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  FileText,
  Sparkles,
  Watch,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const stages = [
  {
    id: "design",
    label: "Design",
    eyebrow: "STUDY BUILDER",
    title: "Structure the whole protocol.",
    description: "Consent, demographics, measures, tasks and participant flow stay inside one study.",
    icon: FileText,
    accent: "text-cyan-800",
  },
  {
    id: "measure",
    label: "Measure",
    eyebrow: "COGNITION + EMA",
    title: "Measure performance and experience.",
    description: "Combine cognitive tasks with repeated real-world assessment instead of splitting the study across tools.",
    icon: Brain,
    accent: "text-sky-800",
  },
  {
    id: "context",
    label: "Context",
    eyebrow: "WEARABLES + SENSORS",
    title: "Bring context into the study logic.",
    description: "Use permitted health and wearable signals alongside participant responses and task performance.",
    icon: Watch,
    accent: "text-teal-800",
  },
  {
    id: "analyse",
    label: "Analyse",
    eyebrow: "ANALYSIS LAB",
    title: "Move from data to models.",
    description: "Explore distributions, relationships and statistical models while preserving study context.",
    icon: BarChart3,
    accent: "text-cyan-900",
  },
  {
    id: "write",
    label: "Write",
    eyebrow: "THESIS BUILDER + AI",
    title: "Carry context into the final document.",
    description: "Study and analysis context can enter the writing workspace when the researcher explicitly allows it.",
    icon: Sparkles,
    accent: "text-violet-800",
  },
];

const stagePanels = {
  design: (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-[18px] border border-slate-200 bg-white p-4">
        <p className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">Study structure</p>
        <div className="mt-3 space-y-2">
          {["Consent + demographics", "Questionnaires", "Cognitive tasks"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-600">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[18px] border border-cyan-100 bg-cyan-50/60 p-4">
        <p className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">Participant flow</p>
        <div className="mt-4 flex items-center gap-2">
          {["TEST", "REVIEW", "LIVE"].map((item, index) => (
            <div key={item} className="flex min-w-0 flex-1 items-center gap-2">
              <div className={`flex h-8 flex-1 items-center justify-center rounded-xl text-[9px] font-bold ${
                index === 2 ? "bg-cyan-950 text-white" : "bg-white text-slate-500"
              }`}>
                {item}
              </div>
              {index < 2 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  measure: (
    <div className="grid gap-3 sm:grid-cols-[1.08fr_.92fr]">
      <div className="rounded-[18px] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">Cognitive trial</p>
          <span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-bold text-cyan-900">424 ms</span>
        </div>
        <div className="mt-6 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[22px] border border-cyan-200 bg-cyan-50 text-lg font-bold text-cyan-950 shadow-inner">
            BLUE
          </div>
        </div>
      </div>

      <div className="rounded-[18px] border border-cyan-100 bg-cyan-50/55 p-4">
        <p className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">Today's EMA</p>
        <div className="mt-3 space-y-2">
          {["09:00 Morning check-in", "13:00 Stress + context", "20:30 Evening reflection"].map((item, index) => (
            <div key={item} className="flex items-center gap-2 text-[10px] leading-4 text-slate-600">
              <CheckCircle2 className={`h-3.5 w-3.5 ${index === 0 ? "text-cyan-700" : "text-slate-300"}`} />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  context: (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        ["Heart rate", "72 bpm", "Live context"],
        ["Sleep", "7h 12m", "Last night"],
        ["Activity", "6,840", "Steps today"],
      ].map(([title, value, meta], index) => (
        <div key={title} className="rounded-[18px] border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
              {index === 0 ? <Activity className="h-4 w-4" /> : index === 1 ? <Watch className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <p className="mt-4 text-[10px] font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-xl font-semibold tracking-[-.03em] text-slate-950">{value}</p>
          <p className="mt-1 text-[9px] text-slate-400">{meta}</p>
        </div>
      ))}
    </div>
  ),
  analyse: (
    <div className="grid gap-3 sm:grid-cols-[1.1fr_.9fr]">
      <div className="rounded-[18px] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">Model preview</p>
          <span className="text-[9px] font-semibold text-slate-400">n = 128</span>
        </div>
        <div className="mt-5 flex h-28 items-end gap-2">
          {[42, 68, 55, 82, 61, 92, 74, 104].map((height, index) => (
            <div key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-cyan-700 to-cyan-300" style={{ height }} />
          ))}
        </div>
      </div>

      <div className="rounded-[18px] border border-cyan-100 bg-cyan-50/55 p-4">
        <p className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">Research signal</p>
        <p className="mt-4 text-3xl font-semibold tracking-[-.05em] text-slate-950">β = .31</p>
        <p className="mt-1 text-[10px] text-slate-500">Sleep → working memory</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white">
          <div className="h-full w-[72%] rounded-full bg-cyan-600" />
        </div>
      </div>
    </div>
  ),
  write: (
    <div className="grid gap-3 sm:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-[18px] border border-slate-200 bg-white p-4">
        <p className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">Thesis Builder</p>
        <div className="mt-4 space-y-3">
          <div className="h-3 w-4/5 rounded-full bg-slate-200" />
          <div className="h-3 w-full rounded-full bg-slate-100" />
          <div className="h-3 w-11/12 rounded-full bg-slate-100" />
          <div className="h-3 w-3/4 rounded-full bg-cyan-100" />
        </div>
      </div>

      <div className="rounded-[18px] bg-slate-950 p-4 text-white">
        <div className="flex items-center gap-2 text-cyan-300">
          <Sparkles className="h-4 w-4" />
          <p className="text-[9px] font-bold uppercase tracking-[.13em]">Contextual AI</p>
        </div>
        <p className="mt-4 text-sm font-semibold leading-5">
          Study context available
        </p>
        <p className="mt-2 text-[10px] leading-4 text-slate-400">
          Analysis outputs and document context are permission-controlled.
        </p>
      </div>
    </div>
  ),
} as const;

export default function ResearchSystemHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerRef = useRef<HTMLDivElement | null>(null);
  const stage = stages[active];
  const StageIcon = stage.icon;

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % stages.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [paused]);

  const progress = useMemo(() => ((active + 1) / stages.length) * 100, [active]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = pointerRef.current;
    if (!node) return;
    const rect = event.currentTarget.getBoundingClientRect();
    node.style.transform = `translate3d(${event.clientX - rect.left - 150}px, ${event.clientY - rect.top - 150}px, 0)`;
    node.style.opacity = "1";
  }

  function handlePointerLeave() {
    setPaused(false);
    if (pointerRef.current) pointerRef.current.style.opacity = "0";
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[760px]"
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={handlePointerLeave}
    >
      <style>{`
        @keyframes heroDash {
          to { stroke-dashoffset: -140; }
        }
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroFloatA {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-7px,0); }
        }
        @keyframes heroFloatB {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,6px,0); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-[9%] rounded-full bg-cyan-200/32 blur-3xl" />
      <div
        ref={pointerRef}
        className="pointer-events-none absolute left-0 top-0 h-[300px] w-[300px] rounded-full bg-cyan-200/22 opacity-0 blur-3xl transition-opacity duration-300"
      />

      <svg viewBox="0 0 760 560" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <path
          d="M72 161 C175 58 285 123 374 87 C487 42 571 88 688 166"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.6"
          opacity=".52"
        />
        <path
          d="M72 161 C175 58 285 123 374 87 C487 42 571 88 688 166"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="10 14"
          opacity=".72"
          style={{ animation: "heroDash 8s linear infinite" }}
        />
        <path
          d="M85 411 C197 503 293 461 377 493 C484 533 578 480 679 401"
          fill="none"
          stroke="#0e7490"
          strokeWidth="1.4"
          opacity=".17"
        />
        <path
          d="M85 411 C197 503 293 461 377 493 C484 533 578 480 679 401"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 16"
          opacity=".44"
          style={{ animation: "heroDash 10s linear infinite reverse" }}
        />
      </svg>

      <div className="relative z-10 overflow-hidden rounded-[34px] border border-slate-200/90 bg-white/88 shadow-[0_30px_70px_-42px_rgba(15,23,42,.38)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950 text-cyan-200">
              <StageIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-cyan-800">PsyLattice research system</p>
              <p className="mt-0.5 text-[12px] font-semibold text-slate-900">{stage.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[9px] font-semibold text-slate-400">LIVE WORKSPACE</span>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          <div className="flex flex-wrap gap-2">
            {stages.map((item, index) => {
              const Icon = item.icon;
              const selected = index === active;

              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onClick={() => setActive(index)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold transition ${
                    selected
                      ? "bg-cyan-950 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-cyan-50 hover:text-cyan-900"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${selected ? "text-cyan-200" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div key={stage.id} style={{ animation: "heroFade .32s ease-out both" }}>
            <div className="grid gap-4 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
              <div className="pt-1">
                <p className={`text-[9px] font-bold uppercase tracking-[.13em] ${stage.accent}`}>
                  {stage.eyebrow}
                </p>
                <h3 className="mt-2 text-[25px] font-semibold leading-[1.04] tracking-[-.04em] text-slate-950">
                  {stage.title}
                </h3>
                <p className="mt-3 text-[12px] leading-5 text-slate-500">
                  {stage.description}
                </p>

                <div className="mt-5 grid gap-2">
                  {[
                    ["Study", "Connected"],
                    ["Participants", "128"],
                    ["Context", "Permissioned"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-[9px] font-semibold text-slate-400">{label}</span>
                      <span className="text-[9px] font-bold text-slate-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[250px] overflow-hidden rounded-[24px] border border-slate-200 bg-[#f7fbfa] p-4">
                <div className="pointer-events-none absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-cyan-200/38 blur-3xl" />
                <div className="relative">
                  {stagePanels[stage.id as keyof typeof stagePanels]}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute -left-5 top-[18%] hidden rounded-2xl border border-cyan-100 bg-white/88 px-4 py-3 shadow-[0_18px_38px_-28px_rgba(15,23,42,.35)] backdrop-blur md:block"
        style={{ animation: "heroFloatA 6s ease-in-out infinite" }}
      >
        <p className="text-[8px] font-bold uppercase tracking-[.13em] text-cyan-800">Live study</p>
        <p className="mt-1 text-[11px] font-semibold text-slate-900">Stress, sleep & attention</p>
      </div>

      <div
        className="pointer-events-none absolute -right-4 bottom-[18%] hidden rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-[0_18px_38px_-28px_rgba(15,23,42,.55)] md:block"
        style={{ animation: "heroFloatB 7s ease-in-out infinite" }}
      >
        <p className="text-[8px] font-bold uppercase tracking-[.13em] text-cyan-300">Research context</p>
        <p className="mt-1 text-[11px] font-semibold">Moves with the workflow</p>
      </div>
    </div>
  );
}
