"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stages = [
  {
    id: "design",
    label: "Design",
    title: "Study Builder",
    copy: "Structure consent, measures, tasks and participant flow.",
    href: "/features/study-builder",
    focus: { x: 30, y: 29 },
  },
  {
    id: "measure",
    label: "Measure",
    title: "EMA / ESM",
    copy: "Capture repeated and event-contingent experience in daily life.",
    href: "/features/ambulatory",
    focus: { x: 57, y: 25 },
  },
  {
    id: "follow",
    label: "Follow",
    title: "Participant Companion",
    copy: "Keep tasks, notifications and completion state in one participant flow.",
    href: "/features/participant-companion",
    focus: { x: 79, y: 34 },
  },
  {
    id: "analyse",
    label: "Analyse",
    title: "Analysis Lab",
    copy: "Move from collected data to interpretable models and research outputs.",
    href: "/features/analysis-lab",
    focus: { x: 33, y: 70 },
  },
  {
    id: "write",
    label: "Write",
    title: "Thesis Builder + AI",
    copy: "Carry permitted study and analysis context into the writing workspace.",
    href: "/features/thesis-builder",
    focus: { x: 77, y: 70 },
  },
];

export default function ResearchCanvasHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stage = stages[active];
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (paused) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % stages.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [paused]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const glow = glowRef.current;
    if (!glow) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    glow.style.transform = `translate3d(${x - 110}px, ${y - 110}px, 0)`;
    glow.style.opacity = "1";
  }

  function handlePointerLeave() {
    setPaused(false);
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[790px]"
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={handlePointerLeave}
    >
      <style>{`
        @keyframes canvasFocus {
          0%,100% { opacity: .34; transform: translate(-50%,-50%) scale(.92); }
          50% { opacity: .72; transform: translate(-50%,-50%) scale(1.08); }
        }
        @keyframes captionIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="relative min-h-[455px] overflow-hidden rounded-[38px] sm:min-h-[500px] lg:min-h-[530px]">
        <img
          src="/marketing/svg/hero-signal-field.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-78"
        />

        <div className="pointer-events-none absolute inset-[8%] rounded-full bg-cyan-100/50 blur-3xl" />

        <div
          ref={glowRef}
          className="pointer-events-none absolute left-0 top-0 z-10 h-[220px] w-[220px] rounded-full bg-cyan-200/28 opacity-0 blur-3xl transition-opacity duration-300"
        />

        <div
          className="pointer-events-none absolute z-10 h-[130px] w-[130px] rounded-full border border-cyan-300/60 bg-cyan-100/12 shadow-[0_0_50px_rgba(34,211,238,.20)]"
          style={{
            left: `${stage.focus.x}%`,
            top: `${stage.focus.y}%`,
            animation: "canvasFocus 3.4s ease-in-out infinite",
          }}
        />

        <div className="absolute inset-0 z-20 flex items-center justify-center px-2">
          <img
            src="/marketing/illustrations/research-workflow.webp"
            alt="PsyLattice connected research workflow"
            draggable={false}
            className="w-full max-w-[720px] select-none object-contain drop-shadow-[0_28px_38px_rgba(15,23,42,.14)]"
          />
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200/90 pt-4">
        <div className="flex items-center justify-between gap-5">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {stages.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className={`relative pb-2 text-[11px] font-semibold transition ${
                  index === active
                    ? "text-cyan-950"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {item.label}
                <span
                  className={`absolute inset-x-0 bottom-0 h-[2px] rounded-full transition ${
                    index === active ? "bg-cyan-600" : "bg-transparent"
                  }`}
                />
              </button>
            ))}
          </div>

          <span className="hidden text-[9px] font-bold uppercase tracking-[.12em] text-slate-400 sm:block">
            Interactive research flow
          </span>
        </div>

        <div
          key={stage.id}
          className="mt-3 flex min-h-[54px] items-start justify-between gap-5"
          style={{ animation: "captionIn .28s ease-out both" }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.12em] text-cyan-800">
              {stage.title}
            </p>
            <p className="mt-1 max-w-[520px] text-[12px] leading-5 text-slate-500">
              {stage.copy}
            </p>
          </div>

          <Link
            href={stage.href}
            className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 text-[11px] font-bold text-cyan-900 transition hover:gap-2"
          >
            Explore
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
