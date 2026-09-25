"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  Expand,
  FileText,
  Sparkles,
  Volume2,
  VolumeX,
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
  const demoVideoRef = useRef<HTMLVideoElement | null>(null);
  const demoMediaRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDemoMuted, setIsDemoMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  useEffect(() => {
    const video = demoVideoRef.current;
    const media = demoMediaRef.current;
    if (!video || !media) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const playMuted = async () => {
      if (prefersReducedMotion) return;
      video.loop = true;
      video.playsInline = true;
      video.muted = true;
      setIsDemoMuted(true);
      await video.play().catch(() => undefined);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          void playMuted();
          return;
        }

        video.pause();
      },
      { threshold: [0, 0.3, 0.5, 0.75] },
    );

    observer.observe(media);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const media = demoMediaRef.current;
      setIsFullscreen(document.fullscreenElement === media);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  async function toggleDemoMute() {
    const video = demoVideoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsDemoMuted(nextMuted);

    if (!nextMuted) {
      await video.play().catch(() => undefined);
    }
  }

  async function toggleFullscreen() {
    const media = demoMediaRef.current;
    if (!media) return;

    if (document.fullscreenElement === media) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }

    await media.requestFullscreen?.().catch(() => undefined);
  }

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

      <section id="demo" className="relative h-[100svh] w-full overflow-hidden bg-[#06151d]">
        <div ref={demoMediaRef} className="group relative h-full w-full overflow-hidden bg-[#06151d]">
          <video
            ref={demoVideoRef}
            src="/videos/psylattice-product-demo.mp4"
            poster="/videos/psylattice-product-demo-poster.jpg"
            muted={isDemoMuted}
            loop
            playsInline
            preload="metadata"
            controls={isFullscreen}
            onVolumeChange={(event) => setIsDemoMuted(event.currentTarget.muted)}
            aria-label="PsyLattice promotional film showing the connected research workflow"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 opacity-100 transition-opacity duration-300 sm:right-6 sm:top-6 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button
              type="button"
              onClick={toggleDemoMute}
              aria-label={isDemoMuted ? "Turn sound on" : "Turn sound off"}
              title={isDemoMuted ? "Sound on" : "Sound off"}
              className="rounded-full border border-white/25 bg-slate-950/45 p-3 text-white shadow-[0_12px_35px_rgba(0,0,0,.24)] backdrop-blur-md transition duration-200 hover:scale-[1.04] hover:bg-slate-950/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              {isDemoMuted ? <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" /> : <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
              className="rounded-full border border-white/25 bg-slate-950/45 p-3 text-white shadow-[0_12px_35px_rgba(0,0,0,.24)] backdrop-blur-md transition duration-200 hover:scale-[1.04] hover:bg-slate-950/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              <Expand className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </section>

    </>
  );
}
