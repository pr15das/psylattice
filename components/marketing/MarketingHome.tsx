"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  Smartphone,
  Sparkles,
} from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingPricing from "@/components/marketing/MarketingPricing";
import DynamicProductStage from "@/components/marketing/DynamicProductStage";
import FeatureDeck from "@/components/marketing/FeatureDeck";
import ScrollWorkflowStory from "@/components/marketing/ScrollWorkflowStory";

const ANDROID_APP_FILE_ID = "1hzWlv_JGRLd047m0dd2pqoSmjKlQ9Mha";
const ANDROID_APP_URL = `https://drive.google.com/uc?export=download&id=${ANDROID_APP_FILE_ID}`;

export default function MarketingHome() {
  return (
    <main className="min-h-screen bg-[#f5f9f8] text-slate-950">
      <style>{`
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
        }
      `}</style>

      <MarketingHeader />
      <DynamicProductStage />
      <FeatureDeck />
      <ScrollWorkflowStory />

      <section id="trusted-ai" className="scroll-mt-28 bg-slate-950 px-5 py-18 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-9 lg:grid-cols-[.76fr_1.24fr] lg:items-center">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
              <LockKeyhole className="h-4.5 w-4.5" />
            </span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-cyan-300">Trusted Context</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-[46px]">
              Control what AI can access.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              Studies, participants, data, documents and analysis context can be independently allowed or denied.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                "Granular study and document access",
                "Clear allowed / denied state",
                "Analysis context can move into writing",
                "Researcher reviews final claims",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 rounded-xl bg-white/[.045] px-3 py-2.5 text-xs leading-5 text-slate-300">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  {item}
                </div>
              ))}
            </div>

            <Link
              href="/features/thesis-builder"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-950"
            >
              Explore contextual AI
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-[17%] rounded-full bg-cyan-300/12 blur-3xl" />
            <img
              src="/marketing/illustrations/trusted-context.webp"
              alt="PsyLattice Trusted Context permissions"
              className="relative mx-auto w-full max-w-[760px] object-contain drop-shadow-[0_26px_34px_rgba(0,0,0,.2)]"
            />
          </div>
        </div>
      </section>

      <section id="mobile" className="scroll-mt-28 border-b border-slate-200 bg-white px-5 py-18 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-9 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-200">
              <Smartphone className="h-4.5 w-4.5" />
            </span>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-cyan-800">Participant Companion</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-[46px]">
              One dashboard for participation in daily life.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
              Participants can see today's tasks, upcoming assessments, completion progress and study notifications from one mobile companion.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                "Push notifications open the assigned task",
                "Today / upcoming / completed activity",
                "Cognition and EMA in one participant flow",
                "Health Connect and wearable context",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 rounded-xl bg-[#f5f9f8] px-3 py-2.5 text-xs leading-5 text-slate-600">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/features/participant-companion" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white">
                Explore companion
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a href={ANDROID_APP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700">
                Android companion
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-[16%] rounded-full bg-cyan-200/38 blur-3xl" />
            <img
              src="/marketing/illustrations/participant-companion.webp"
              alt="PsyLattice participant companion"
              className="relative mx-auto w-full max-w-[790px] object-contain drop-shadow-[0_26px_34px_rgba(15,23,42,.13)]"
            />
          </div>
        </div>
      </section>

      <MarketingPricing />

      <section className="px-5 py-18 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[32px] bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
          <img
            src="/marketing/svg/spark-cluster.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-[5%] top-[-20%] w-[360px] opacity-52"
          />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-cyan-300">
                <Sparkles className="h-4 w-4" />
                <p className="text-[10px] font-bold uppercase tracking-[.14em]">Start with one real study</p>
              </div>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-[46px]">
                Build the workflow before you pay for Pro.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                Create the study, test the participant experience and run your first live research project from the free workspace.
              </p>
            </div>

            <Link href="/signin" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">
              Start researching free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
