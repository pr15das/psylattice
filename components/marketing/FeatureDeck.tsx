"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  Smartphone,
  Watch,
} from "lucide-react";

const cards = [
  {
    slug: "ambulatory",
    eyebrow: "Real-world measurement",
    number: "01",
    title: "EMA / ESM",
    copy: "Schedule repeated and event-contingent check-ins that follow participants through daily life.",
    image: "/marketing/illustrations/ema-esm.webp",
    icon: Activity,
    tint: "bg-[#eaf8f8]",
    outline: "border-[#ccebed]",
    accent: "text-cyan-900",
  },
  {
    slug: "cognitive-lab",
    eyebrow: "Experimental psychology",
    number: "02",
    title: "Cognitive Lab",
    copy: "Run cognitive and reaction-time tasks inside the same study that contains your measures and participant flow.",
    image: "/marketing/illustrations/cognitive-lab.webp",
    icon: Brain,
    tint: "bg-[#eaf3f8]",
    outline: "border-[#d3e4ed]",
    accent: "text-cyan-900",
  },
  {
    slug: "participant-companion",
    eyebrow: "Participant experience",
    number: "03",
    title: "Participant Companion",
    copy: "Give participants one dashboard for tasks, notifications, progress and study activity.",
    image: "/marketing/illustrations/participant-companion.webp",
    icon: Smartphone,
    tint: "bg-[#eaf7f3]",
    outline: "border-[#d0e9e1]",
    accent: "text-slate-950",
  },
  {
    slug: "wearables",
    eyebrow: "Context-aware research",
    number: "04",
    title: "Wearables + sensors",
    copy: "Use Health Connect and supported wearable context in sensor-contingent research workflows.",
    image: "/marketing/illustrations/wearables-health.webp",
    icon: Watch,
    tint: "bg-[#eef3f5]",
    outline: "border-[#d8e2e6]",
    accent: "text-slate-950",
  },
];

export default function FeatureDeck() {
  return (
    <section id="features" className="scroll-mt-28 bg-white py-16 sm:py-18">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-cyan-800">
              Research beyond a survey
            </p>
            <h2 className="mt-4 max-w-[620px] text-4xl font-semibold tracking-[-.04em] text-slate-950 sm:text-5xl">
              See the core research modes immediately.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
            Different kinds of measurement, one PsyLattice study. Each card opens into a full product explanation.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.slug}
                href={`/features/${card.slug}`}
                className={`group relative flex min-h-[500px] flex-col overflow-hidden rounded-[30px] border ${card.outline} ${card.tint} p-5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_55px_-38px_rgba(15,23,42,.28)]`}
              >
                <div className="absolute inset-x-5 top-5 h-24 rounded-[20px] bg-cyan-100/24 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/75 bg-white/74 text-cyan-900 shadow-sm backdrop-blur">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-cyan-900/80">
                          {card.number} · {card.eyebrow}
                        </p>
                        <div className="mt-1 h-[2px] w-9 rounded-full bg-cyan-600/65" />
                      </div>
                    </div>

                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/74 text-slate-600 shadow-sm transition group-hover:translate-x-0.5 group-hover:bg-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>

                  <h3 className={`mt-6 max-w-[240px] text-[30px] font-semibold leading-[1.04] tracking-[-.038em] ${card.accent}`}>
                    {card.title}
                  </h3>

                  <p className="mt-3 max-w-[260px] text-sm leading-6 text-slate-700/80">
                    {card.copy}
                  </p>

                </div>

                <div className="relative mt-auto min-h-[260px] pt-4">
                  <div className="pointer-events-none absolute inset-x-[8%] bottom-[2%] h-32 rounded-full bg-white/42 blur-3xl" />

                  <img
                    src={card.image}
                    alt=""
                    aria-hidden="true"
                    className="absolute bottom-[-18px] left-1/2 w-[132%] max-w-none -translate-x-1/2 object-contain drop-shadow-[0_22px_28px_rgba(15,23,42,.11)] transition duration-500 group-hover:bottom-[-10px] group-hover:scale-[1.02]"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
