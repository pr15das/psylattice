"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  FileText,
  PlayCircle,
  Sparkles,
  Watch,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const stages = [
  {
    id: "design",
    nav: "Design",
    eyebrow: "Study Builder",
    title: "Build the study once.",
    copy: "Consent, demographics, questionnaires, cognitive tasks, EMA / ESM, wearable context and participant links stay attached to one study definition.",
    bullets: ["Consent + demographics", "Questionnaires + cognition", "TEST and LIVE participant flow"],
    image: "/marketing/illustrations/study-builder.webp",
    href: "/features/study-builder",
    icon: FileText,
  },
  {
    id: "experiment",
    nav: "Experiment",
    eyebrow: "Cognitive Lab",
    title: "Run cognition inside the same protocol.",
    copy: "Reaction time and accuracy can sit beside questionnaires and real-world measures instead of living in a separate experiment platform.",
    bullets: ["Trial-level outcomes", "Practice + experimental blocks", "Study-linked cognitive variables"],
    image: "/marketing/illustrations/cognitive-lab.webp",
    href: "/features/cognitive-lab",
    icon: Brain,
  },
  {
    id: "capture",
    nav: "Capture",
    eyebrow: "EMA / ESM",
    title: "Measure experience as it changes.",
    copy: "Schedule repeated check-ins and event-contingent assessments so the study follows moments, days and contexts.",
    bullets: ["Time-contingent prompts", "Event-contingent workflows", "Participant notifications"],
    image: "/marketing/illustrations/ema-esm.webp",
    href: "/features/ambulatory",
    icon: Activity,
  },
  {
    id: "sense",
    nav: "Sense",
    eyebrow: "Wearables + sensors",
    title: "Let context become part of the trigger.",
    copy: "Supported health and wearable data can feed threshold, duration, freshness and cooldown rules for sensor-contingent research.",
    bullets: ["Health Connect", "Wear OS pathway", "Sensor-contingent rules"],
    image: "/marketing/illustrations/wearables-health.webp",
    href: "/features/wearables",
    icon: Watch,
  },
  {
    id: "analyse",
    nav: "Analyse",
    eyebrow: "Analysis Lab",
    title: "Move from raw data to interpretable models.",
    copy: "Inspect distributions, relationships and statistical models while the research design stays visible around the output.",
    bullets: ["Descriptives + visualizations", "Regression + model workflows", "AI-assisted explanation"],
    image: "/marketing/illustrations/analysis-lab.webp",
    href: "/features/analysis-lab",
    icon: BarChart3,
  },
  {
    id: "write",
    nav: "Write",
    eyebrow: "Thesis Builder + AI",
    title: "Carry context into the writing stage.",
    copy: "Study, analysis and document context can move into AI-assisted writing when the researcher explicitly grants access.",
    bullets: ["Study-aware assistance", "Analysis-to-writing flow", "Permission-controlled context"],
    image: "/marketing/illustrations/thesis-ai.webp",
    href: "/features/thesis-builder",
    icon: Sparkles,
  },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export default function ScrollWorkflowStory() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const stickyTop = 80;

    const update = () => {
      rafRef.current = null;
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const stickyHeight = Math.max(1, viewport - stickyTop);
      const scrollRange = Math.max(1, section.offsetHeight - stickyHeight);
      const raw = (stickyTop - rect.top) / scrollRange;

      setProgress(clamp(raw));
    };

    const scheduleUpdate = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Each stage has a real dwell period before the next transition begins.
  // This prevents the experience from feeling "runny": normal scrolling can
  // continue while the current product remains fully settled and readable.
  const HOLD = 0.72;
  const TRANSITION = 0.28;
  const timelineUnits = stages.length * HOLD + (stages.length - 1) * TRANSITION;
  const timelinePosition = progress * timelineUnits;

  let stageFloat = stages.length - 1;
  let activeIndex = stages.length - 1;
  let cursor = 0;

  for (let index = 0; index < stages.length; index += 1) {
    const holdEnd = cursor + HOLD;

    if (timelinePosition <= holdEnd || index === stages.length - 1) {
      stageFloat = index;
      activeIndex = index;
      break;
    }

    cursor = holdEnd;

    if (index < stages.length - 1) {
      const transitionEnd = cursor + TRANSITION;

      if (timelinePosition <= transitionEnd) {
        const local = clamp((timelinePosition - cursor) / TRANSITION);
        stageFloat = index + local;
        activeIndex = local < 0.5 ? index : index + 1;
        break;
      }

      cursor = transitionEnd;
    }
  }

  const progressPct = useMemo(() => `${progress * 100}%`, [progress]);

  function jumpTo(index: number) {
    const section = sectionRef.current;
    if (!section) return;

    const stickyTop = 80;
    const stickyHeight = Math.max(1, window.innerHeight - stickyTop);
    const scrollRange = Math.max(1, section.offsetHeight - stickyHeight);
    const ratio = index / (stages.length - 1);

    window.scrollTo({
      top: section.offsetTop - stickyTop + scrollRange * ratio,
      behavior: "smooth",
    });
  }

  return (
    <>
      <section
        ref={sectionRef}
        id="workflow"
        className="relative hidden bg-[#f4f8f8] lg:block"
        style={{ height: "390vh" }}
      >
        <div className="sticky top-[80px] h-[calc(100vh-80px)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_44%,rgba(165,243,252,.26),transparent_35%),linear-gradient(180deg,#f9fcfb_0%,#f3f8f7_100%)]" />
          <img
            src="/marketing/svg/research-flow-large.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[5%] left-1/2 w-[980px] max-w-none -translate-x-1/2 opacity-58"
          />

          <div className="relative mx-auto flex h-full max-w-[1360px] flex-col px-7 pb-6 pt-5">
            <div className="flex items-center justify-between gap-5">
              <div className="shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-[.14em] text-cyan-800">
                  The PsyLattice workflow
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  Stay in one screen while the research flow changes stage by stage.
                </p>
              </div>

              <div className="flex items-center gap-1 rounded-[16px] border border-slate-200 bg-white/88 p-1.5 shadow-sm backdrop-blur">
                {stages.map((stage, index) => {
                  const Icon = stage.icon;
                  const active = index === activeIndex;

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => jumpTo(index)}
                      className={`flex items-center gap-1.5 rounded-[11px] px-2.5 py-2 transition ${
                        active
                          ? "bg-cyan-950 text-white"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${active ? "text-cyan-200" : "text-slate-400"}`} />
                      <span className="text-[9px] font-bold">{stage.nav}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative mt-2 min-h-0 flex-1">
              {stages.map((stage, index) => {
                const distance = Math.abs(index - stageFloat);
                const visibility = clamp(1 - distance * 2.15);
                const delta = index - stageFloat;
                const Icon = stage.icon;

                return (
                  <div
                    key={stage.id}
                    className="absolute inset-0 grid grid-cols-[.72fr_1.28fr] items-center gap-8"
                    style={{
                      opacity: visibility,
                      zIndex: Math.round(visibility * 100),
                      pointerEvents: visibility > 0.45 ? "auto" : "none",
                    }}
                  >
                    <div
                      className="pl-1"
                      style={{
                        transform: `translate3d(${delta * 118}px, 0, 0)`,
                        filter: `blur(${(1 - visibility) * 5}px)`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-200">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">
                          0{index + 1} · {stage.eyebrow}
                        </span>
                      </div>

                      <h2 className="mt-5 max-w-[520px] text-[42px] font-semibold leading-[1.02] tracking-[-.042em] text-slate-950">
                        {stage.title}
                      </h2>

                      <p className="mt-4 max-w-[500px] text-[14px] leading-6 text-slate-600">
                        {stage.copy}
                      </p>

                      <div className="mt-5 space-y-2">
                        {stage.bullets.map((item) => (
                          <div key={item} className="flex items-center gap-2.5 text-[12px] text-slate-600">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-50 text-cyan-800">
                              <Check className="h-3 w-3" />
                            </span>
                            {item}
                          </div>
                        ))}
                      </div>

                      <Link
                        href={stage.href}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-cyan-950"
                      >
                        Explore {stage.nav}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div
                      className="relative flex h-full items-center justify-center"
                      style={{
                        transform: `translate3d(${delta * 150}px, 0, 0) scale(${1 - (1 - visibility) * 0.025})`,
                        filter: `blur(${(1 - visibility) * 5}px)`,
                      }}
                    >
                      <div className="pointer-events-none absolute inset-[18%] rounded-full bg-cyan-200/34 blur-3xl" />
                      <img
                        src={stage.image}
                        alt=""
                        aria-hidden="true"
                        className="relative w-[97%] max-w-none object-contain drop-shadow-[0_28px_34px_rgba(15,23,42,.12)]"
                        style={{ maxHeight: "58vh" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <div className="h-1 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-slate-900"
                  style={{ width: progressPct }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[7px] font-bold uppercase tracking-[.1em] text-slate-400">
                <span>Research question</span>
                <span>Study output</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f4f8f8] py-16 lg:hidden">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-cyan-800">The PsyLattice workflow</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-slate-950">
            One connected research environment.
          </h2>

          <div className="mt-8 space-y-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <article key={stage.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-200">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <p className="text-[9px] font-bold uppercase tracking-[.13em] text-cyan-800">
                      0{index + 1} · {stage.eyebrow}
                    </p>
                  </div>
                  <h3 className="mt-4 text-3xl font-semibold tracking-[-.035em] text-slate-950">{stage.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{stage.copy}</p>
                  <img src={stage.image} alt="" aria-hidden="true" className="mt-4 w-full object-contain" />
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="demo" className="scroll-mt-28 bg-white px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-7 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-cyan-800">Product walkthrough</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] text-slate-950 sm:text-5xl">
                See the PsyLattice workflow in action.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
              A guided look at how study design, participant activity, data and analysis stay connected across the research workspace.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[30px] border border-slate-200 bg-[#f4f8f8] p-4 shadow-[0_20px_50px_-36px_rgba(15,23,42,.18)] sm:p-5">
            <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950">
              <img
                src="/marketing/illustrations/research-dashboard-showcase.webp"
                alt="PsyLattice product walkthrough preview"
                className="aspect-[16/9] w-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/48 via-slate-950/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                <div className="max-w-xl text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-cyan-200">Product walkthrough</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-.03em] sm:text-[30px]">
                    From study design to research output
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-200/90">
                    See how the researcher workspace brings study building, participant management and analysis into one continuous environment.
                  </p>
                </div>

                <div className="hidden shrink-0 rounded-full border border-white/20 bg-white/12 p-4 text-white backdrop-blur md:block">
                  <PlayCircle className="h-9 w-9" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
