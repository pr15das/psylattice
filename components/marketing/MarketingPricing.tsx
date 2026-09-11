"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import StudyPassCheckout from "@/components/StudyPassCheckout";

const researchPlans = [
  {
    id: "researcher",
    eyebrow: "Start researching for free",
    title: "Free",
    price: "₹0",
    cadence: "",
    featured: false,
    description:
      "Build, publish and run one real PsyLattice study at no cost. Upgrade when you need another study, more participants, media or higher usage.",
    bullets: ["1 study", "Basic participant capacity", "Small AI allowance", "PsyLattice Auto only", "No custom media"],
    note: "Participants never pay. Upgrade only when your research needs more.",
  },
  {
    id: "study-pass",
    eyebrow: "Pay once for one project",
    title: "Study Pass",
    price: "₹499",
    cadence: "/study",
    featured: false,
    description:
      "For a thesis, dissertation or individual research project that needs the full PsyLattice research toolkit without a recurring subscription.",
    bullets: ["1 serious study", "500 participants", "200 AI credits", "Some model choice", "No custom media"],
    note: "Includes up to 12 months of active data collection. Review, analysis and export remain available afterwards.",
  },
  {
    id: "research-pro-monthly",
    eyebrow: "Complete research workspace",
    title: "Pro Monthly",
    price: "₹749",
    cadence: "/month",
    featured: true,
    description:
      "For researchers running multiple projects with the complete PsyLattice research workspace.",
    bullets: ["Multiple studies", "700 participants", "300 AI credits", "Full AI model switcher", "Custom image/audio/video stimuli", "2 GB media storage"],
    note: "No per-study publication charge while subscribed.",
  },
  {
    id: "research-pro-annual",
    eyebrow: "Best value",
    title: "Pro Annual",
    price: "₹7,499",
    cadence: "/year",
    featured: true,
    description:
      "The complete Researcher Pro workspace at a lower effective monthly price for researchers who use PsyLattice throughout the year.",
    bullets: ["Everything in Pro", "Multiple studies", "700 participants", "300 AI credits", "Full AI model switcher", "Custom media", "5 GB media storage"],
    note: "Approximately 17% cheaper than monthly.",
  },
] as const;

export default function MarketingPricing() {
  return (
    <section id="pricing" className="scroll-mt-28 border-y border-slate-200 bg-white py-24 lg:py-28">
      <div className="mx-auto max-w-[1380px] px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">Research pricing</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Start with a real study. Pay when you need more.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
            PsyLattice keeps the entry point low for students and independent researchers while Pro unlocks the higher-capacity workspace, model choice and custom media.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {researchPlans.map((plan) => (
            <article
              key={plan.id}
              className={`relative flex min-h-[480px] flex-col rounded-[26px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                plan.featured
                  ? "border-cyan-300 bg-gradient-to-br from-cyan-50 via-white to-white shadow-[0_18px_50px_-30px_rgba(8,145,178,.45)]"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.id === "research-pro-monthly" && (
                <span className="absolute right-5 top-5 rounded-full bg-cyan-950 px-3 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-white">
                  Popular
                </span>
              )}
              <p className="pr-16 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-800">{plan.eyebrow}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">{plan.title}</h3>
              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">{plan.price}</span>
                {plan.cadence && <span className="pb-1 text-sm text-slate-500">{plan.cadence}</span>}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>
              <div className="my-5 h-px bg-slate-100" />
              <ul className="space-y-2.5">
                {plan.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-5 text-slate-500">{plan.note}</div>
                {plan.id === "study-pass" ? (
                  <StudyPassCheckout className="mt-4" />
                ) : (
                  <Link
                    href="/signin"
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      plan.featured
                        ? "bg-cyan-950 text-white hover:bg-cyan-900"
                        : "bg-slate-950 text-white hover:bg-slate-800"
                    }`}
                  >
                    {plan.id === "researcher" ? "Start researching free" : `Choose ${plan.title}`}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            ["PsyLattice Self", "₹59/month", "Personal assessment, monitoring and self-regulation workspace."],
            ["Clinician account", "Free", "Professional workspace with connected-care workflows."],
            ["Research participants", "Always free", "Participants never pay to take part in a PsyLattice study."],
          ].map(([title, price, copy]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <span className="text-sm font-bold text-cyan-900">{price}</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
