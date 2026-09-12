"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  FileText,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stages = [
  {
    id: "design",
    number: "1",
    label: "Design",
    eyebrow: "Study Builder",
    title: "Structure the study.",
    copy: "Consent, measures, cognition and participant flow remain attached to one study.",
    href: "/features/study-builder",
    icon: FileText,
    hotspot: "left-[17%] top-[13%]",
    panel: "left-[3%] bottom-[8%]",
  },
  {
    id: "measure",
    number: "2",
    label: "Measure",
    eyebrow: "EMA / ESM",
    title: "Measure in daily life.",
    copy: "Repeated and event-contingent assessments stay connected to the same research timeline.",
    href: "/features/ambulatory",
    icon: Activity,
    hotspot: "left-[49%] top-[7%]",
    panel: "left-[3%] bottom-[8%]",
  },
  {
    id: "follow",
    number: "3",
    label: "Follow",
    eyebrow: "Participant Companion",
    title: "Keep participation clear.",
    copy: "Tasks, notifications and completion state live in one participant experience.",
    href: "/features/participant-companion",
    icon: Users,
    hotspot: "right-[9%] top-[16%]",
    panel: "right-[3%] bottom-[8%]",
  },
  {
    id: "analyse",
    number: "4",
    label: "Analyse",
    eyebrow: "Analysis Lab",
    title: "Understand the data.",
    copy: "Explore distributions, relationships and models without losing the study context.",
    href: "/features/analysis-lab",
    icon: BarChart3,
    hotspot: "left-[16%] bottom-[20%]",
    panel: "left-[3%] bottom-[8%]",
  },
  {
    id: "write",
    number: "5",
    label: "Write",
    eyebrow: "Thesis Builder + AI",
    title: "Carry context into writing.",
    copy: "Study and analysis context can enter the writing workspace through explicit permissions.",
    href: "/features/thesis-builder",
    icon: Sparkles,
    hotspot: "right-[11%] bottom-[18%]",
    panel: "right-[3%] bottom-[8%]",
  },
];

export default function InteractiveResearchHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stage = stages[active];
  const ActiveIcon = stage.icon;
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (paused) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % stages.length);
    }, 5600);

    return () => window.clearInterval(timer);
  }, [paused]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = stageRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    node.style.setProperty("--hero-x", `${x * 9}px`);
    node.style.setProperty("--hero-y", `${y * 7}px`);
    node.style.setProperty("--hero-rx", `${-y * .65}deg`);
    node.style.setProperty("--hero-ry", `${x * .85}deg`);
  }

  function resetPointer() {
    const node = stageRef.current;
    if (!node) return;

    node.style.setProperty("--hero-x", "0px");
    node.style.setProperty("--hero-y", "0px");
    node.style.setProperty("--hero-rx", "0deg");
    node.style.setProperty("--hero-ry", "0deg");
  }

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        resetPointer();
        setPaused(false);
      }}
      onPointerEnter={() => setPaused(true)}
      className="relative min-h-[475px] w-full [perspective:1500px] sm:min-h-[520px] lg:min-h-[565px]"
    >
      <style>{`
        @keyframes heroPulse {
          0%,100% { transform: scale(.92); opacity: .34; }
          50% { transform: scale(1.14); opacity: .78; }
        }
        @keyframes heroPanelIn {
          from { opacity: 0; transform: translateY(7px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes heroSweep {
          from { transform: translateX(-120%); }
          to { transform: translateX(220%); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-[8%] rounded-full bg-cyan-200/34 blur-3xl" />
      <img
        src="/marketing/svg/dot-field.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-4%] top-[10%] w-[360px] opacity-40"
      />

      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out will-change-transform"
        style={{
          transform:
            "translate3d(var(--hero-x,0px),var(--hero-y,0px),0) rotateX(var(--hero-rx,0deg)) rotateY(var(--hero-ry,0deg))",
        }}
      >
        <img
          src="/marketing/illustrations/research-workflow.webp"
          alt="Interactive PsyLattice research workflow from study design through measurement, participation, analysis and writing"
          className="w-[103%] max-w-none select-none object-contain drop-shadow-[0_28px_40px_rgba(15,23,42,.15)]"
          draggable={false}
        />
      </div>

      <div className="pointer-events-none absolute left-[10%] right-[7%] top-[12%] h-px overflow-hidden rounded-full bg-cyan-200/60">
        <span className="block h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent motion-safe:animate-[heroSweep_5s_linear_infinite]" />
      </div>

      {stages.map((item, index) => {
        const selected = active === index;

        return (
          <button
            key={item.id}
            type="button"
            aria-label={`Highlight ${item.label}`}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            className={`absolute z-30 flex h-9 w-9 items-center justify-center rounded-full border shadow-[0_10px_24px_-14px_rgba(15,23,42,.5)] backdrop-blur transition ${item.hotspot} ${
              selected
                ? "scale-110 border-cyan-300 bg-cyan-950 text-white"
                : "border-white/85 bg-white/88 text-cyan-900 hover:border-cyan-200 hover:bg-white"
            }`}
          >
            {selected && (
              <span
                className="pointer-events-none absolute inset-[-7px] rounded-full border border-cyan-300"
                style={{ animation: "heroPulse 2.6s ease-in-out infinite" }}
              />
            )}
            <span className="relative text-[10px] font-bold">{item.number}</span>
          </button>
        );
      })}

      <div
        key={stage.id}
        className={`absolute z-40 hidden w-[255px] rounded-[20px] border border-slate-200/90 bg-white/94 p-4 shadow-[0_22px_50px_-28px_rgba(15,23,42,.38)] backdrop-blur-xl md:block ${stage.panel}`}
        style={{ animation: "heroPanelIn .32s ease-out both" }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950 text-cyan-200">
            <ActiveIcon className="h-4 w-4" />
          </span>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.11em] text-cyan-800">
            {stage.label}
          </span>
        </div>

        <p className="mt-3 text-[9px] font-bold uppercase tracking-[.12em] text-cyan-800">
          {stage.eyebrow}
        </p>
        <h3 className="mt-1 text-[18px] font-semibold tracking-[-.03em] text-slate-950">
          {stage.title}
        </h3>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          {stage.copy}
        </p>
        <Link
          href={stage.href}
          className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-900 transition hover:gap-2"
        >
          Explore
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="absolute bottom-[1%] left-1/2 z-40 flex -translate-x-1/2 gap-1.5 md:hidden">
        {stages.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(index)}
            className={`rounded-full px-3 py-2 text-[9px] font-semibold transition ${
              index === active
                ? "bg-cyan-950 text-white"
                : "border border-slate-200 bg-white/90 text-slate-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
