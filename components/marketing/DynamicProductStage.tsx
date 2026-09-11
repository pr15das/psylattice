"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

export default function DynamicProductStage() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      rafRef.current = null;
      const section = sectionRef.current;
      const stage = stageRef.current;
      if (!section || !stage) return;

      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const progress = Math.max(-1, Math.min(1, (viewport * 0.54 - rect.top) / viewport));

      stage.style.setProperty("--scroll-y", `${progress * 12}px`);
      stage.style.setProperty("--scroll-r", `${progress * -0.22}deg`);
    };

    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const node = stageRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    node.style.setProperty("--pointer-x", `${x * 10}px`);
    node.style.setProperty("--pointer-y", `${y * 8}px`);
    node.style.setProperty("--rotate-x", `${-y * 0.85}deg`);
    node.style.setProperty("--rotate-y", `${x * 1.15}deg`);
  }

  function resetPointer() {
    const node = stageRef.current;
    if (!node) return;
    node.style.setProperty("--pointer-x", "0px");
    node.style.setProperty("--pointer-y", "0px");
    node.style.setProperty("--rotate-x", "0deg");
    node.style.setProperty("--rotate-y", "0deg");
  }

  return (
    <section ref={sectionRef} className="relative flex min-h-[calc(100svh-78px)] items-center overflow-hidden px-5 py-10 sm:px-6 lg:px-8 lg:py-12">
      <img
        src="/marketing/svg/lattice-hero.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-180px] w-[1440px] max-w-none -translate-x-1/2 opacity-72"
      />
      <div className="pointer-events-none absolute left-[8%] top-[14%] h-44 w-44 rounded-full bg-cyan-200/24 blur-3xl" />
      <div className="pointer-events-none absolute right-[7%] top-[8%] h-60 w-60 rounded-full bg-cyan-100/70 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1380px]">
        <div className="grid w-full gap-8 lg:grid-cols-[.76fr_1.24fr] lg:items-center">
          <div className="relative z-10 py-2 lg:py-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/92 px-4 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-cyan-900 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
              World-class research made accessible
            </span>

            <h1 className="mt-6 max-w-[620px] text-[44px] font-semibold leading-[.97] tracking-[-.05em] text-slate-950 sm:text-[56px] lg:text-[66px]">
              One connected
              <span className="text-cyan-900"> research environment.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[16px] leading-7 text-slate-600">
              Design studies, run cognitive tasks, collect real-world measures, use wearable context, analyse results and write with contextual AI—inside one connected research workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-px hover:bg-cyan-950"
              >
                Start researching free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#workflow"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-px hover:border-cyan-200 hover:text-cyan-900"
              >
                See the workflow
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-slate-500">
              {["1 live study free", "Participants never pay", "No-code research workflow"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-cyan-700" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div
            ref={stageRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={resetPointer}
            className="relative min-h-[400px] [perspective:1500px] sm:min-h-[470px] lg:min-h-[520px]"
          >
            <div className="pointer-events-none absolute inset-[11%] rounded-full bg-cyan-200/40 blur-3xl" />

            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out will-change-transform"
              style={{
                transform:
                  "translate3d(var(--pointer-x,0px),calc(var(--pointer-y,0px) + var(--scroll-y,0px)),0) rotateX(var(--rotate-x,0deg)) rotateY(var(--rotate-y,0deg)) rotate(var(--scroll-r,0deg))",
              }}
            >
              <img
                src="/marketing/illustrations/research-workflow.webp"
                alt="PsyLattice connected research workflow"
                className="w-[86%] max-w-none select-none object-contain drop-shadow-[0_30px_46px_rgba(15,23,42,.15)] sm:w-[88%] lg:w-[90%]"
                draggable={false}
              />
            </div>

            <div className="absolute left-[3%] top-[10%] hidden rounded-[18px] border border-cyan-200 bg-white/94 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,.12)] backdrop-blur md:block">
              <p className="text-[8px] font-bold uppercase tracking-[.12em] text-cyan-800">Connected study context</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-900">Design → collect → analyse → write</p>
            </div>

            <div className="absolute bottom-[10%] right-[2%] hidden rounded-[18px] border border-slate-200 bg-slate-950 px-4 py-3 text-white shadow-[0_16px_40px_rgba(15,23,42,.18)] md:block">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                <p className="text-[8px] font-bold uppercase tracking-[.12em] text-cyan-300">Contextual AI</p>
              </div>
              <p className="mt-1 text-[11px] font-semibold">AI can follow the research workflow</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
