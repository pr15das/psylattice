"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  FileText,
  FlaskConical,
  Smartphone,
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


export default function FeatureDetailPage({ feature }: { feature: MarketingFeature }) {
  const Icon = iconMap[feature.icon];
  const related = feature.connectsTo
    .map((slug) => marketingFeatures.find((item) => item.slug === slug))
    .filter(Boolean) as MarketingFeature[];

  return (
    <main className="min-h-screen bg-[#f4f8f8] text-slate-950">
      <MarketingHeader />

      <section className="relative overflow-hidden px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-[-100px] h-[540px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-[1380px]">
          <Link href="/#features" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-cyan-900">
            <ArrowLeft className="h-4 w-4" /> All research features
          </Link>

          <div className="mt-10 grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200 bg-white text-cyan-900 shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">
                {feature.number} · {feature.eyebrow}
              </p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl lg:text-[74px]">
                {feature.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{feature.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signin" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-cyan-950">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-900">
                  See how it works
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute -inset-8 rounded-[42px] bg-gradient-to-br from-cyan-100/70 via-white/0 to-sky-100/60 blur-2xl" />
              <div className="relative">
                <FeatureVisual feature={feature} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-20 lg:py-24">
        <div className="mx-auto grid max-w-[1380px] gap-12 px-6 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">What it changes</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">{feature.outcome}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {feature.capabilities.map((capability) => (
              <div key={capability} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#f8faf9] p-4">
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
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">A clear workflow, not another disconnected tool.</h2>
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
            <Link href="/#features" className="text-sm font-semibold text-cyan-900">Explore every feature →</Link>
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
                  <span className="mt-4 inline-flex text-xs font-bold text-cyan-900 transition group-hover:translate-x-1">Learn more →</span>
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
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Keep the entire research workflow connected.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-100/75">
                Start with the free research workspace and expand only when the study needs additional capacity or Pro features.
              </p>
            </div>
            <Link href="/signin" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-cyan-950">
              Start researching free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
