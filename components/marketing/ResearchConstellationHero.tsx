"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Brain,
  FileText,
  Smartphone,
  Sparkles,
  Watch,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const modules = [
  {
    id: "study",
    label: "Study Builder",
    short: "Design",
    copy: "Protocol, consent and measures stay connected.",
    href: "/features/study-builder",
    icon: FileText,
    position: "left-[3%] top-[12%]",
  },
  {
    id: "cognition",
    label: "Cognitive Lab",
    short: "Experiment",
    copy: "Reaction-time tasks become part of the study graph.",
    href: "/features/cognitive-lab",
    icon: Brain,
    position: "right-[2%] top-[13%]",
  },
  {
    id: "ambulatory",
    label: "EMA / ESM",
    short: "Capture",
    copy: "Repeated measurement follows participants into daily life.",
    href: "/features/ambulatory",
    icon: Activity,
    position: "left-[0%] bottom-[17%]",
  },
  {
    id: "analysis",
    label: "Analysis Lab",
    short: "Analyse",
    copy: "Study-linked data moves into statistical workflows.",
    href: "/features/analysis-lab",
    icon: BarChart3,
    position: "right-[0%] bottom-[17%]",
  },
  {
    id: "write",
    label: "Thesis Builder + AI",
    short: "Write",
    copy: "Permitted study context follows into writing.",
    href: "/features/thesis-builder",
    icon: Sparkles,
    position: "left-1/2 bottom-[2%] -translate-x-1/2",
  },
];

const beamPaths = [
  "M118 104 C220 106 255 177 370 240",
  "M622 104 C520 106 485 177 370 240",
  "M104 398 C226 382 264 314 370 240",
  "M636 398 C514 382 476 314 370 240",
  "M370 492 C370 404 370 334 370 240",
];

export default function ResearchConstellationHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);

  const current = modules[active];
  const ActiveIcon = current.icon;

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % modules.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [paused]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const scene = sceneRef.current;
    const spotlight = spotlightRef.current;
    if (!scene || !spotlight) return;

    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    scene.style.setProperty("--rx", `${-y * 2.2}deg`);
    scene.style.setProperty("--ry", `${x * 2.8}deg`);
    scene.style.setProperty("--tx", `${x * 8}px`);
    scene.style.setProperty("--ty", `${y * 7}px`);

    spotlight.style.transform = `translate3d(${event.clientX - rect.left - 170}px, ${event.clientY - rect.top - 170}px, 0)`;
    spotlight.style.opacity = "1";
  }

  function resetScene() {
    const scene = sceneRef.current;
    const spotlight = spotlightRef.current;
    if (scene) {
      scene.style.setProperty("--rx", "0deg");
      scene.style.setProperty("--ry", "0deg");
      scene.style.setProperty("--tx", "0px");
      scene.style.setProperty("--ty", "0px");
    }
    if (spotlight) spotlight.style.opacity = "0";
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[790px] [perspective:1500px]"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => {
        setPaused(false);
        resetScene();
      }}
      onPointerMove={handlePointerMove}
    >
      <style>{`
        @keyframes constellationDash {
          to { stroke-dashoffset: -140; }
        }
        @keyframes haloSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes haloSpinReverse {
          to { transform: rotate(-360deg); }
        }
        @keyframes softFloatOne {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes softFloatTwo {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(5px); }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(8px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        ref={sceneRef}
        className="relative min-h-[525px] transition-transform duration-300 ease-out will-change-transform lg:min-h-[570px]"
        style={{
          transform:
            "translate3d(var(--tx,0px),var(--ty,0px),0) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-[4%] rounded-[42px] bg-[radial-gradient(circle_at_48%_35%,rgba(34,211,238,.24),transparent_25%),radial-gradient(circle_at_72%_68%,rgba(45,212,191,.16),transparent_26%),linear-gradient(145deg,#07131f_0%,#0a1726_52%,#0a1c28_100%)] shadow-[0_34px_80px_-46px_rgba(2,8,23,.75)]" />
        <div className="absolute inset-[4%] overflow-hidden rounded-[42px] border border-white/10">
          <div className="absolute inset-0 opacity-[.18] [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="absolute inset-x-[14%] top-[-12%] h-[42%] rounded-full bg-cyan-400/20 blur-[80px]" />
          <div className="absolute bottom-[-12%] right-[5%] h-[42%] w-[42%] rounded-full bg-teal-300/10 blur-[90px]" />
        </div>

        <div
          ref={spotlightRef}
          className="pointer-events-none absolute left-[4%] top-[4%] z-10 h-[340px] w-[340px] rounded-full bg-cyan-200/10 opacity-0 blur-[70px] transition-opacity duration-300"
        />

        <svg
          viewBox="0 0 740 520"
          className="pointer-events-none absolute inset-[4%] z-10 h-[92%] w-[92%]"
          aria-hidden="true"
        >
          {beamPaths.map((path, index) => (
            <g key={path}>
              <path d={path} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="1.4" />
              <path
                d={path}
                fill="none"
                stroke={index === active ? "#22d3ee" : "rgba(34,211,238,.18)"}
                strokeWidth={index === active ? "2.8" : "1.2"}
                strokeLinecap="round"
                strokeDasharray={index === active ? "8 13" : "2 14"}
                style={
                  index === active
                    ? { animation: "constellationDash 4.8s linear infinite" }
                    : undefined
                }
              />
            </g>
          ))}
        </svg>

        <div
          className="absolute left-1/2 top-[46%] z-20 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="absolute inset-[-24px] rounded-full border border-cyan-300/20"
            style={{ animation: "haloSpin 18s linear infinite" }}
          >
            <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_22px_rgba(103,232,249,.8)]" />
            <span className="absolute bottom-[18px] right-[14px] h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,.7)]" />
          </div>

          <div
            className="absolute inset-[-10px] rounded-full border border-white/10"
            style={{ animation: "haloSpinReverse 13s linear infinite" }}
          >
            <span className="absolute left-[22px] top-[8px] h-1.5 w-1.5 rounded-full bg-white/80" />
          </div>

          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_30%,rgba(255,255,255,.20),transparent_32%),linear-gradient(145deg,rgba(13,148,136,.34),rgba(8,145,178,.26)_42%,rgba(15,23,42,.92)_100%)] shadow-[inset_0_0_40px_rgba(34,211,238,.16),0_22px_60px_rgba(2,8,23,.5)] backdrop-blur-xl" />

          <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full border border-white/10 bg-slate-950/52 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
              <ActiveIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[8px] font-bold uppercase tracking-[.18em] text-cyan-300">
              PsyLattice Core
            </p>
            <p className="mt-1.5 max-w-[120px] text-[12px] font-semibold leading-4 text-white">
              {current.short}
            </p>
            <p className="mt-1 max-w-[135px] text-[9px] leading-4 text-slate-400">
              Research context stays connected.
            </p>
          </div>
        </div>

        {modules.map((item, index) => {
          const Icon = item.icon;
          const selected = active === index;

          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              className={`absolute z-30 hidden w-[150px] rounded-[18px] border p-3 text-left backdrop-blur-xl transition duration-300 md:block ${item.position} ${
                selected
                  ? "border-cyan-300/40 bg-cyan-300/[.09] shadow-[0_16px_40px_-24px_rgba(34,211,238,.7)]"
                  : "border-white/10 bg-white/[.045] hover:border-white/20 hover:bg-white/[.07]"
              }`}
              style={{
                animation: index % 2 === 0
                  ? "softFloatOne 6s ease-in-out infinite"
                  : "softFloatTwo 7s ease-in-out infinite",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    selected ? "bg-cyan-300 text-slate-950" : "bg-white/[.06] text-cyan-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={`h-2 w-2 rounded-full ${selected ? "bg-cyan-300" : "bg-white/15"}`} />
              </div>
              <p className="mt-3 text-[10px] font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-[8px] leading-4 text-slate-400">{item.copy}</p>
            </button>
          );
        })}

        <div
          key={current.id}
          className="absolute bottom-[8%] left-1/2 z-30 hidden w-[360px] -translate-x-1/2 rounded-[18px] border border-white/10 bg-slate-950/72 px-4 py-3 backdrop-blur-xl md:block"
          style={{ animation: "panelIn .32s ease-out both" }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.15em] text-cyan-300">{current.short}</p>
              <p className="mt-1 text-[11px] font-medium leading-4 text-slate-300">{current.copy}</p>
            </div>
            <Link
              href={current.href}
              className="inline-flex shrink-0 items-center gap-1.5 text-[9px] font-bold text-white transition hover:text-cyan-200"
            >
              Explore
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="absolute left-[9%] top-[8%] z-20 hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-3 py-2 text-[8px] font-bold uppercase tracking-[.14em] text-cyan-200 backdrop-blur md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,.65)]" />
          Live research graph
        </div>

        <div className="absolute right-[9%] top-[8%] z-20 hidden rounded-full border border-white/10 bg-white/[.045] px-3 py-2 text-[8px] font-bold uppercase tracking-[.14em] text-slate-300 backdrop-blur md:block">
          Context synced
        </div>

        <div className="absolute inset-x-[12%] bottom-[5%] z-20 flex justify-center gap-1.5 md:hidden">
          {modules.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              className={`rounded-full px-3 py-2 text-[9px] font-semibold ${
                active === index ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-white"
              }`}
            >
              {item.short}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
