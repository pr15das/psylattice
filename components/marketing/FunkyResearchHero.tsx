"use client";

import { useEffect, useRef, useState } from "react";

const satellites = [
  {
    id: "cognition",
    label: "Cognitive task",
    tone: "lavender",
    src: "/marketing/svg/hero-pop-cognition.svg",
    className: "left-[1%] top-[8%]",
  },
  {
    id: "ema",
    label: "EMA prompt",
    tone: "mint",
    src: "/marketing/svg/hero-pop-ema.svg",
    className: "right-[1%] top-[10%]",
  },
  {
    id: "wearable",
    label: "Wearable context",
    tone: "coral",
    src: "/marketing/svg/hero-pop-wearable.svg",
    className: "left-[2%] bottom-[8%]",
  },
  {
    id: "ai",
    label: "Contextual AI",
    tone: "blue",
    src: "/marketing/svg/hero-pop-ai.svg",
    className: "right-[0%] bottom-[7%]",
  },
];

const activeColors = {
  cognition: {
    ring: "rgba(139,92,246,.48)",
    glow: "rgba(196,181,253,.28)",
  },
  ema: {
    ring: "rgba(16,185,129,.42)",
    glow: "rgba(167,243,208,.28)",
  },
  wearable: {
    ring: "rgba(244,114,182,.38)",
    glow: "rgba(251,207,232,.25)",
  },
  ai: {
    ring: "rgba(37,99,235,.42)",
    glow: "rgba(191,219,254,.28)",
  },
};

export default function FunkyResearchHero() {
  const [active, setActive] = useState<keyof typeof activeColors>("cognition");
  const [paused, setPaused] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const pointerGlowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const order: Array<keyof typeof activeColors> = ["cognition", "ema", "wearable", "ai"];
    const timer = window.setInterval(() => {
      setActive((current) => {
        const index = order.indexOf(current);
        return order[(index + 1) % order.length];
      });
    }, 4300);

    return () => window.clearInterval(timer);
  }, [paused]);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const scene = sceneRef.current;
    const glow = pointerGlowRef.current;
    if (!scene || !glow) return;

    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    scene.style.setProperty("--hero-x", `${x * 7}px`);
    scene.style.setProperty("--hero-y", `${y * 6}px`);
    scene.style.setProperty("--hero-rx", `${-y * .85}deg`);
    scene.style.setProperty("--hero-ry", `${x * 1.0}deg`);

    glow.style.transform = `translate3d(${event.clientX - rect.left - 145}px, ${event.clientY - rect.top - 145}px, 0)`;
    glow.style.opacity = "1";
  }

  function resetPointer() {
    const scene = sceneRef.current;
    const glow = pointerGlowRef.current;

    if (scene) {
      scene.style.setProperty("--hero-x", "0px");
      scene.style.setProperty("--hero-y", "0px");
      scene.style.setProperty("--hero-rx", "0deg");
      scene.style.setProperty("--hero-ry", "0deg");
    }

    if (glow) glow.style.opacity = "0";
  }

  const accent = activeColors[active];

  return (
    <div
      className="relative mx-auto w-full max-w-[850px] [perspective:1600px]"
      onPointerEnter={() => setPaused(true)}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        setPaused(false);
        resetPointer();
      }}
    >
      <style>{`
        @keyframes heroFloatOne {
          0%,100% { transform: translateY(0px) rotate(-1.4deg); }
          50% { transform: translateY(-9px) rotate(.7deg); }
        }
        @keyframes heroFloatTwo {
          0%,100% { transform: translateY(0px) rotate(1.3deg); }
          50% { transform: translateY(8px) rotate(-.6deg); }
        }
        @keyframes heroBeam {
          to { stroke-dashoffset: -140; }
        }
        @keyframes heroPulseDot {
          0%,100% { opacity:.28; transform:scale(.85); }
          50% { opacity:.95; transform:scale(1.15); }
        }
        @keyframes heroSparkle {
          0%,100% { transform:scale(.86) rotate(0deg); opacity:.42; }
          50% { transform:scale(1.12) rotate(12deg); opacity:1; }
        }
      `}</style>

      <div
        ref={sceneRef}
        className="relative min-h-[520px] transition-transform duration-300 ease-out will-change-transform sm:min-h-[560px] lg:min-h-[600px]"
        style={{
          transform:
            "translate3d(var(--hero-x,0px),var(--hero-y,0px),0) rotateX(var(--hero-rx,0deg)) rotateY(var(--hero-ry,0deg))",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="pointer-events-none absolute inset-[7%] rounded-full bg-cyan-200/25 blur-[80px]" />
        <div
          className="pointer-events-none absolute left-[21%] top-[20%] h-[330px] w-[420px] rounded-[50%] blur-[85px] transition-colors duration-500"
          style={{ backgroundColor: accent.glow }}
        />

        <img
          src="/marketing/svg/hero-funky-orbits.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1%] h-[98%] w-[98%] object-contain"
        />

        <div
          ref={pointerGlowRef}
          className="pointer-events-none absolute left-0 top-0 z-10 h-[290px] w-[290px] rounded-full bg-white/55 opacity-0 blur-[55px] transition-opacity duration-300"
        />

        <svg
          viewBox="0 0 850 600"
          className="pointer-events-none absolute inset-0 z-[12] h-full w-full"
          aria-hidden="true"
        >
          {[
            { id: "cognition", d: "M125 126 C250 120 285 205 390 270" },
            { id: "ema", d: "M725 130 C605 127 566 198 470 267" },
            { id: "wearable", d: "M130 480 C240 468 293 394 390 330" },
            { id: "ai", d: "M720 478 C612 460 563 390 470 330" },
          ].map((beam) => {
            const selected = active === beam.id;
            return (
              <g key={beam.id}>
                <path
                  d={beam.d}
                  fill="none"
                  stroke="rgba(148,163,184,.17)"
                  strokeWidth="2"
                />
                <path
                  d={beam.d}
                  fill="none"
                  stroke={selected ? accent.ring : "rgba(34,211,238,.13)"}
                  strokeWidth={selected ? "3.6" : "2"}
                  strokeLinecap="round"
                  strokeDasharray="8 13"
                  style={{ animation: `heroBeam ${selected ? 4.2 : 8.8}s linear infinite` }}
                />
              </g>
            );
          })}

          <circle
            cx="430"
            cy="302"
            r="8"
            fill={accent.ring}
            style={{
              transformOrigin: "430px 302px",
              animation: "heroPulseDot 3s ease-in-out infinite",
            }}
          />
        </svg>

        <div className="absolute inset-x-[8%] top-[8%] bottom-[7%] z-20 flex items-center justify-center">
          <img
            src="/marketing/illustrations/hero-research-showcase.webp"
            alt="PsyLattice research workspace surrounded by study building, cognitive tasks, EMA, analysis and AI-assisted writing"
            draggable={false}
            className="w-full max-w-[735px] select-none object-contain drop-shadow-[0_28px_38px_rgba(15,23,42,.14)]"
          />
        </div>

        {satellites.map((satellite, index) => {
          const selected = active === satellite.id;
          return (
            <button
              key={satellite.id}
              type="button"
              aria-label={`Highlight ${satellite.label}`}
              onMouseEnter={() => setActive(satellite.id as keyof typeof activeColors)}
              onFocus={() => setActive(satellite.id as keyof typeof activeColors)}
              onClick={() => setActive(satellite.id as keyof typeof activeColors)}
              className={`absolute z-30 hidden rounded-[24px] border p-2.5 shadow-[0_20px_42px_-28px_rgba(15,23,42,.34)] backdrop-blur-xl transition duration-300 md:block ${satellite.className} ${
                selected
                  ? "scale-[1.04] border-white bg-white/96 shadow-[0_24px_50px_-28px_rgba(15,23,42,.42)]"
                  : "border-white/85 bg-white/82 hover:scale-[1.03] hover:bg-white/94"
              }`}
              style={{
                animation:
                  index % 2 === 0
                    ? "heroFloatOne 7s ease-in-out infinite"
                    : "heroFloatTwo 8s ease-in-out infinite",
              }}
            >
              <img src={satellite.src} alt="" aria-hidden="true" className="h-[116px] w-[142px]" />
            </button>
          );
        })}

        <div className="absolute left-[18%] top-[4%] z-30 hidden rounded-full border border-violet-100 bg-violet-50/90 px-3 py-2 text-[8px] font-bold uppercase tracking-[.13em] text-violet-700 shadow-sm backdrop-blur md:block">
          Experimental psychology
        </div>

        <div className="absolute right-[16%] top-[4%] z-30 hidden rounded-full border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-[8px] font-bold uppercase tracking-[.13em] text-emerald-700 shadow-sm backdrop-blur md:block">
          Real-world measurement
        </div>

        <div className="absolute left-[19%] bottom-[2%] z-30 hidden rounded-full border border-rose-100 bg-rose-50/90 px-3 py-2 text-[8px] font-bold uppercase tracking-[.13em] text-rose-700 shadow-sm backdrop-blur md:block">
          Wearable context
        </div>

        <div className="absolute right-[17%] bottom-[2%] z-30 hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-2 text-[8px] font-bold uppercase tracking-[.13em] text-blue-700 shadow-sm backdrop-blur md:flex">
          <span
            className="inline-block h-2 w-2 rounded-[3px] bg-blue-500"
            style={{ animation: "heroSparkle 3.4s ease-in-out infinite" }}
          />
          Contextual AI
        </div>
      </div>
    </div>
  );
}
