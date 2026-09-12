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
    eyebrow: "Design",
    copy: "Structure consent, measures and participant flow in one protocol.",
    href: "/features/study-builder",
    icon: FileText,
  },
  {
    id: "cognition",
    label: "Cognitive Lab",
    eyebrow: "Experiment",
    copy: "Run reaction-time and cognitive tasks without leaving the study.",
    href: "/features/cognitive-lab",
    icon: Brain,
  },
  {
    id: "ambulatory",
    label: "EMA / ESM",
    eyebrow: "Capture",
    copy: "Measure experience repeatedly as it unfolds in daily life.",
    href: "/features/ambulatory",
    icon: Activity,
  },
  {
    id: "wearables",
    label: "Wearables + sensors",
    eyebrow: "Sense",
    copy: "Bring permitted health and wearable context into research workflows.",
    href: "/features/wearables",
    icon: Watch,
  },
  {
    id: "analysis",
    label: "Analysis Lab",
    eyebrow: "Analyse",
    copy: "Move from collected data to models and interpretable outputs.",
    href: "/features/analysis-lab",
    icon: BarChart3,
  },
  {
    id: "write",
    label: "Thesis Builder + AI",
    eyebrow: "Write",
    copy: "Carry permitted study and analysis context into the final document.",
    href: "/features/thesis-builder",
    icon: Sparkles,
  },
];

export default function LightResearchEcosystem() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  const current = modules[active];
  const ActiveIcon = current.icon;

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % modules.length);
    }, 5600);

    return () => window.clearInterval(timer);
  }, [paused]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const scene = sceneRef.current;
    const glow = glowRef.current;
    if (!scene || !glow) return;

    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    scene.style.setProperty("--px", `${x * 7}px`);
    scene.style.setProperty("--py", `${y * 6}px`);
    scene.style.setProperty("--rx", `${-y * 1.0}deg`);
    scene.style.setProperty("--ry", `${x * 1.3}deg`);

    glow.style.transform = `translate3d(${event.clientX - rect.left - 150}px, ${event.clientY - rect.top - 150}px,0)`;
    glow.style.opacity = "1";
  }

  function resetPointer() {
    const scene = sceneRef.current;
    const glow = glowRef.current;
    if (scene) {
      scene.style.setProperty("--px", "0px");
      scene.style.setProperty("--py", "0px");
      scene.style.setProperty("--rx", "0deg");
      scene.style.setProperty("--ry", "0deg");
    }
    if (glow) glow.style.opacity = "0";
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[830px] [perspective:1600px]"
      onPointerEnter={() => setPaused(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        setPaused(false);
        resetPointer();
      }}
    >
      <style>{`
        @keyframes ecosystemFloatA {
          0%,100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-8px) rotate(.4deg); }
        }
        @keyframes ecosystemFloatB {
          0%,100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(7px) rotate(-.4deg); }
        }
        @keyframes ecosystemDash {
          to { stroke-dashoffset: -150; }
        }
        @keyframes ecosystemPulse {
          0%,100% { opacity:.32; transform:scale(.92); }
          50% { opacity:.72; transform:scale(1.1); }
        }
        @keyframes ecosystemShimmer {
          from { transform: translateX(-140%); }
          to { transform: translateX(240%); }
        }
        @keyframes ecosystemContent {
          from { opacity:0; transform:translateY(7px); }
          to { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div
        ref={sceneRef}
        className="relative min-h-[520px] transition-transform duration-300 ease-out will-change-transform sm:min-h-[560px] lg:min-h-[610px]"
        style={{
          transform:
            "translate3d(var(--px,0px),var(--py,0px),0) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
          transformStyle: "preserve-3d",
        }}
      >
        <img
          src="/marketing/svg/hero-ecosystem-orbits.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1%] h-[98%] w-[98%] object-contain"
        />

        <div className="pointer-events-none absolute left-[18%] top-[12%] h-[320px] w-[320px] rounded-full bg-cyan-200/28 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-[7%] right-[7%] h-[280px] w-[280px] rounded-full bg-sky-200/24 blur-[80px]" />

        <div
          ref={glowRef}
          className="pointer-events-none absolute left-0 top-0 z-10 h-[300px] w-[300px] rounded-full bg-cyan-200/20 opacity-0 blur-[65px] transition-opacity duration-300"
        />

        <div className="absolute left-[18%] right-[13%] top-[15%] bottom-[13%] z-20 overflow-hidden rounded-[34px] border border-white/90 bg-white/78 shadow-[0_34px_70px_-46px_rgba(15,23,42,.34)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.92),rgba(239,250,251,.68)_48%,rgba(235,248,252,.72))]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" />

          <div className="relative border-b border-slate-200/70 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950 text-cyan-200 shadow-sm">
                  <ActiveIcon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[.15em] text-cyan-800">Connected research workspace</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-900">{current.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,.55)]" />
                <span className="text-[8px] font-bold uppercase tracking-[.12em] text-emerald-800">Live</span>
              </div>
            </div>
          </div>

          <div
            key={current.id}
            className="relative grid h-[calc(100%-70px)] gap-4 p-5 sm:grid-cols-[.68fr_1.32fr]"
            style={{ animation: "ecosystemContent .34s ease-out both" }}
          >
            <div className="flex min-h-[245px] flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white/78 p-5 shadow-[0_16px_30px_-28px_rgba(15,23,42,.24)]">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-cyan-800">{current.eyebrow}</p>
                <h3 className="mt-2 text-[27px] font-semibold leading-[1.03] tracking-[-.042em] text-slate-950">
                  {current.label}
                </h3>
                <p className="mt-3 text-[12px] leading-5 text-slate-500">
                  {current.copy}
                </p>
              </div>

              <div className="mt-5">
                <Link
                  href={current.href}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-900 transition hover:gap-2"
                >
                  Explore feature
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="relative min-h-[245px] overflow-hidden rounded-[24px] border border-cyan-100/90 bg-[#f8fcfc]">
              <img
                src={`/marketing/svg/hero-${current.id}.svg`}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
            <span className="block h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent motion-safe:animate-[ecosystemShimmer_5.8s_linear_infinite]" />
          </div>
        </div>

        <button
          type="button"
          onMouseEnter={() => setActive(0)}
          onFocus={() => setActive(0)}
          onClick={() => setActive(0)}
          className={`absolute left-[4%] top-[11%] z-30 hidden rounded-[22px] border bg-white/84 p-3 shadow-[0_20px_38px_-28px_rgba(15,23,42,.38)] backdrop-blur-xl transition md:block ${
            active === 0 ? "border-cyan-300 -translate-y-1" : "border-white/90 hover:border-cyan-200 hover:-translate-y-1"
          }`}
          style={{ animation: "ecosystemFloatA 7s ease-in-out infinite" }}
        >
          <img src="/marketing/svg/hero-study-mini.svg" alt="" aria-hidden="true" className="h-[108px] w-[155px]" />
        </button>

        <button
          type="button"
          onMouseEnter={() => setActive(2)}
          onFocus={() => setActive(2)}
          onClick={() => setActive(2)}
          className={`absolute right-[1%] top-[13%] z-30 hidden rounded-[24px] border bg-white/86 p-3 shadow-[0_20px_38px_-28px_rgba(15,23,42,.38)] backdrop-blur-xl transition md:block ${
            active === 2 ? "border-cyan-300 -translate-y-1" : "border-white/90 hover:border-cyan-200 hover:-translate-y-1"
          }`}
          style={{ animation: "ecosystemFloatB 8s ease-in-out infinite" }}
        >
          <img src="/marketing/svg/hero-ambulatory-mini.svg" alt="" aria-hidden="true" className="h-[142px] w-[116px]" />
        </button>

        <button
          type="button"
          onMouseEnter={() => setActive(4)}
          onFocus={() => setActive(4)}
          onClick={() => setActive(4)}
          className={`absolute bottom-[4%] left-[7%] z-30 hidden rounded-[22px] border bg-white/86 p-3 shadow-[0_20px_38px_-28px_rgba(15,23,42,.38)] backdrop-blur-xl transition md:block ${
            active === 4 ? "border-cyan-300 -translate-y-1" : "border-white/90 hover:border-cyan-200 hover:-translate-y-1"
          }`}
          style={{ animation: "ecosystemFloatB 7.5s ease-in-out infinite" }}
        >
          <img src="/marketing/svg/hero-analysis-mini.svg" alt="" aria-hidden="true" className="h-[96px] w-[160px]" />
        </button>

        <button
          type="button"
          onMouseEnter={() => setActive(5)}
          onFocus={() => setActive(5)}
          onClick={() => setActive(5)}
          className={`absolute bottom-[3%] right-[2%] z-30 hidden rounded-[22px] border bg-white/86 p-3 shadow-[0_20px_38px_-28px_rgba(15,23,42,.38)] backdrop-blur-xl transition md:block ${
            active === 5 ? "border-cyan-300 -translate-y-1" : "border-white/90 hover:border-cyan-200 hover:-translate-y-1"
          }`}
          style={{ animation: "ecosystemFloatA 8.5s ease-in-out infinite" }}
        >
          <img src="/marketing/svg/hero-writing-mini.svg" alt="" aria-hidden="true" className="h-[103px] w-[145px]" />
        </button>

        <div className="absolute bottom-[4%] left-1/2 z-40 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/80 bg-white/78 p-1.5 shadow-sm backdrop-blur md:hidden">
          {modules.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              className={`rounded-full px-3 py-2 text-[9px] font-semibold transition ${
                index === active ? "bg-cyan-950 text-white" : "text-slate-500"
              }`}
            >
              {item.eyebrow}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
