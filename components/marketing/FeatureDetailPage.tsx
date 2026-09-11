"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BellRing,
  Brain,
  Check,
  FileText,
  FlaskConical,
  HeartPulse,
  Smartphone,
  Sparkles,
  Watch,
} from "lucide-react";
import type { MarketingFeature } from "@/lib/marketing-features";
import { marketingFeatures } from "@/lib/marketing-features";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { FeatureVisual } from "@/components/marketing/ProductVisuals";

const iconMap = {
  flask: FlaskConical,
  brain: Brain,
  activity: Activity,
  watch: Watch,
  chart: BarChart3,
  file: FileText,
  phone: Smartphone,
};

type SpecialRouteConfig = {
  heroImage: string;
  heroAlt: string;
  flowSvg: string;
  storyEyebrow: string;
  storyTitle: string;
  storyCopy: string;
  flowSteps: Array<{
    number: string;
    title: string;
    copy: string;
  }>;
};

const specialRoutes: Partial<Record<MarketingFeature["slug"], SpecialRouteConfig>> = {
  ambulatory: {
    heroImage: "/marketing/routes/ambulatory-hero.webp",
    heroAlt:
      "PsyLattice ambulatory assessment system showing EMA prompts, daily scheduling, participant check-ins and context signals",
    flowSvg: "/marketing/svg/ambulatory-route-flow.svg",
    storyEyebrow: "Moment-level research",
    storyTitle: "From a study schedule to data captured in context.",
    storyCopy:
      "PsyLattice connects the sampling rule, participant prompt, response and surrounding context so repeated measurement remains part of the same research timeline.",
    flowSteps: [
      {
        number: "01",
        title: "Schedule",
        copy: "Define time windows, repeated assessments or event-contingent rules.",
      },
      {
        number: "02",
        title: "Trigger",
        copy: "Surface the right prompt when the study condition or schedule is met.",
      },
      {
        number: "03",
        title: "Respond",
        copy: "Participants complete a short check-in from the companion experience.",
      },
      {
        number: "04",
        title: "Contextualise",
        copy: "Keep the response tied to time, study phase and permitted context.",
      },
      {
        number: "05",
        title: "Analyse",
        copy: "Bring repeated measures into the same study-linked analysis workflow.",
      },
    ],
  },
  "participant-companion": {
    heroImage: "/marketing/routes/participant-companion-hero.webp",
    heroAlt:
      "PsyLattice Participant Companion showing study tasks, push notifications, deep-links, wearable context and completion progress",
    flowSvg: "/marketing/svg/participant-route-flow.svg",
    storyEyebrow: "Participant flow",
    storyTitle: "One continuous path from joining a study to completing a task.",
    storyCopy:
      "The participant experience keeps recruitment, today's tasks, notifications, health permissions and completion state inside one mobile flow.",
    flowSteps: [
      {
        number: "01",
        title: "Join",
        copy: "Enter through the participant link or pairing flow.",
      },
      {
        number: "02",
        title: "See today",
        copy: "The dashboard prioritises the task that needs attention now.",
      },
      {
        number: "03",
        title: "Open directly",
        copy: "Push notifications deep-link into the exact assigned study task.",
      },
      {
        number: "04",
        title: "Complete",
        copy: "Questionnaires, EMA and cognitive tasks use the same participant flow.",
      },
      {
        number: "05",
        title: "Sync",
        copy: "Completion and permitted health context return to the connected study.",
      },
    ],
  },
};

function SpecialHeroArtwork({
  config,
  slug,
}: {
  config: SpecialRouteConfig;
  slug: string;
}) {
  return (
    <div className="relative min-h-[470px] lg:min-h-[580px]">
      <div className="pointer-events-none absolute inset-[14%] rounded-full bg-cyan-200/45 blur-3xl" />
      <img
        src="/marketing/svg/dot-field.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-4 w-[380px] opacity-45"
      />

      <img
        src={config.heroImage}
        alt={config.heroAlt}
        className={`relative z-10 mx-auto max-w-none object-contain drop-shadow-[0_30px_45px_rgba(15,23,42,.15)] motion-safe:animate-[routeFloat_7s_ease-in-out_infinite] ${
          slug === "ambulatory"
            ? "w-[112%] -translate-x-[3%] lg:w-[118%]"
            : "w-[114%] -translate-x-[4%] lg:w-[120%]"
        }`}
      />
    </div>
  );
}

function SpecialFlowSection({ config }: { config: SpecialRouteConfig }) {
  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-800">
              {config.storyEyebrow}
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
              {config.storyTitle}
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
            {config.storyCopy}
          </p>
        </div>

        <div className="relative mt-12">
          <img
            src={config.flowSvg}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[76px] hidden w-[94%] max-w-[1240px] -translate-x-1/2 lg:block"
          />

          <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {config.flowSteps.map((step) => (
              <div
                key={step.number}
                className="min-h-[190px] rounded-[22px] border border-slate-200 bg-[#f7faf9]/95 p-5 shadow-[0_14px_30px_-26px_rgba(15,23,42,.24)] backdrop-blur"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950 text-[10px] font-bold text-cyan-100">
                  {step.number}
                </span>
                <h3 className="mt-5 text-base font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContextCallout({ slug }: { slug: string }) {
  if (slug === "ambulatory") {
    return (
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          [BellRing, "Time + event contingent", "Use scheduled windows and event-based triggers."],
          [HeartPulse, "Context-aware", "Connect permitted wearable and environmental context."],
          [BarChart3, "Repeated-measures ready", "Keep moment-level responses attached to the study timeline."],
        ].map(([Icon, title, copy]) => {
          const C = Icon as typeof BellRing;
          return (
            <div key={String(title)} className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
              <C className="h-5 w-5 text-cyan-800" />
              <p className="mt-3 text-sm font-semibold text-slate-900">{String(title)}</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{String(copy)}</p>
            </div>
          );
        })}
      </div>
    );
  }

  if (slug === "participant-companion") {
    return (
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          [BellRing, "Push → exact task", "Open directly into the questionnaire, EMA prompt or cognitive task."],
          [Smartphone, "One daily dashboard", "See what is due, upcoming and already completed."],
          [HeartPulse, "Permission-based context", "Connect supported health and wearable data when the study requires it."],
        ].map(([Icon, title, copy]) => {
          const C = Icon as typeof BellRing;
          return (
            <div key={String(title)} className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
              <C className="h-5 w-5 text-cyan-800" />
              <p className="mt-3 text-sm font-semibold text-slate-900">{String(title)}</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{String(copy)}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

export default function FeatureDetailPage({ feature }: { feature: MarketingFeature }) {
  const Icon = iconMap[feature.icon];
  const special = specialRoutes[feature.slug];
  const related = feature.connectsTo
    .map((slug) => marketingFeatures.find((item) => item.slug === slug))
    .filter(Boolean) as MarketingFeature[];

  return (
    <main className="min-h-screen bg-[#f4f8f8] text-slate-950">
      <style>{`
        @keyframes routeFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="routeFloat"] { animation: none !important; }
        }
      `}</style>

      <MarketingHeader />

      <section className="relative overflow-hidden px-6 pb-16 pt-14 lg:px-8 lg:pb-20 lg:pt-18">
        <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[600px] w-[980px] -translate-x-1/2 rounded-full bg-cyan-200/32 blur-3xl" />
        <div className="relative mx-auto max-w-[1460px]">
          <Link
            href="/#features"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-cyan-900"
          >
            <ArrowLeft className="h-4 w-4" /> All research features
          </Link>

          <div
            className={`mt-8 grid gap-10 lg:items-center ${
              special ? "lg:grid-cols-[.68fr_1.32fr]" : "lg:grid-cols-[.82fr_1.18fr]"
            }`}
          >
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200 bg-white text-cyan-900 shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                {feature.number} · {feature.eyebrow}
              </p>

              <h1
                className={`mt-4 max-w-3xl font-semibold leading-[.98] tracking-[-0.055em] ${
                  special ? "text-5xl sm:text-6xl lg:text-[66px]" : "text-5xl sm:text-6xl lg:text-[74px]"
                }`}
              >
                {feature.title}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {feature.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-cyan-950"
                >
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-900"
                >
                  See how it works
                </a>
              </div>

              {special && <ContextCallout slug={feature.slug} />}
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-8 rounded-[42px] bg-gradient-to-br from-cyan-100/72 via-white/0 to-sky-100/60 blur-2xl" />
              <div className="relative">
                {special ? (
                  <SpecialHeroArtwork config={special} slug={feature.slug} />
                ) : (
                  <FeatureVisual feature={feature} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {special && <SpecialFlowSection config={special} />}

      <section className={`${special ? "bg-[#f4f8f8]" : "border-y border-slate-200 bg-white"} py-20 lg:py-24`}>
        <div className="mx-auto grid max-w-[1380px] gap-12 px-6 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">What it changes</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {feature.outcome}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {feature.capabilities.map((capability) => (
              <div
                key={capability}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-800">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm leading-6 text-slate-600">{capability}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-slate-950 py-20 text-white lg:py-24">
        <div className="mx-auto max-w-[1380px] px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">How it works</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              A clear workflow, not another disconnected tool.
            </h2>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {feature.steps.map((step, index) => (
              <div key={step.title} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-sm font-bold text-slate-950">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-[1380px] px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">Connected workflow</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">Works with the rest of PsyLattice.</h2>
            </div>
            <Link href="/#features" className="text-sm font-semibold text-cyan-900">
              Explore every feature →
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => {
              const RelatedIcon = iconMap[item.icon];

              return (
                <Link
                  key={item.slug}
                  href={`/features/${item.slug}`}
                  className="group rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-lg"
                >
                  <RelatedIcon className="h-5 w-5 text-cyan-800" />
                  <p className="mt-5 text-sm font-semibold text-slate-900">{item.shortTitle}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.description}</p>
                  <span className="mt-4 inline-flex text-xs font-bold text-cyan-900 transition group-hover:translate-x-1">
                    Learn more →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 lg:px-8 lg:pb-24">
        <div className="mx-auto max-w-[1380px] overflow-hidden rounded-[34px] bg-cyan-950 p-8 text-white sm:p-10 lg:p-14">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Build with PsyLattice</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Keep the entire research workflow connected.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-100/75">
                Start with the free research workspace and expand only when the study needs additional capacity or Pro features.
              </p>
            </div>
            <Link
              href="/signin"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-cyan-950"
            >
              Start researching free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
