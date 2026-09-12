"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import FunkyResearchHero from "@/components/marketing/FunkyResearchHero";

export default function DynamicProductStage() {
  return (
    <section className="relative flex min-h-[calc(100svh-78px)] items-center overflow-hidden px-5 py-10 sm:px-6 lg:px-8 lg:py-12">
      <img
        src="/marketing/svg/hero-funky-field.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute left-[3%] top-[13%] h-60 w-60 rounded-full bg-cyan-200/18 blur-3xl" />
      <div className="pointer-events-none absolute right-[2%] top-[7%] h-80 w-80 rounded-full bg-sky-200/22 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[4%] left-[46%] h-64 w-64 rounded-full bg-violet-100/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1400px]">
        <div className="grid w-full gap-8 lg:grid-cols-[.69fr_1.31fr] lg:items-center">
          <div className="relative z-20 py-2 lg:py-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/88 px-4 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-cyan-900 shadow-[0_8px_28px_-18px_rgba(8,145,178,.36)] backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(34,211,238,.7)]" />
              World-class research made accessible
            </span>

            <h1 className="mt-6 max-w-[620px] text-[44px] font-semibold leading-[.97] tracking-[-.05em] text-slate-950 sm:text-[56px] lg:text-[68px]">
              One connected
              <span className="text-cyan-900"> research environment.</span>
            </h1>

            <p className="mt-5 max-w-xl text-[16px] leading-7 text-slate-600">
              Design studies, run cognitive tasks, collect real-world measures, use wearable context, analyse results and write with contextual AI—inside one connected research workspace.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-px hover:bg-cyan-950"
              >
                Start researching free
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/84 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-px hover:border-cyan-200 hover:text-cyan-900"
              >
                Explore the platform
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

          <FunkyResearchHero />
        </div>
      </div>
    </section>
  );
}
