"use client";

import { useState } from "react";
import { ChevronDown, Cpu, Sparkles, X } from "lucide-react";
import StudyPassCheckout from "@/components/StudyPassCheckout";

export const AI_USAGE_MOCK = {
  usedPercentage: 62,
  remainingPercentage: 38,
};

export const AI_MODELS = [
  { name: "PsyLattice Auto", description: "Chooses the best model for your task while preserving your remaining budget.", impact: "Low", badge: "Recommended", active: true },
  { name: "OpenAI GPT", description: "Best for complex reasoning, writing and detailed analysis.", impact: "High", active: false, badge: "" },
  { name: "Claude", description: "Best for research analysis, summaries and interpretation.", impact: "Medium", active: false, badge: "" },
  { name: "Gemini Pro", description: "Best for long documents and large research context.", impact: "Medium", active: false, badge: "" },
  { name: "Gemini Flash", description: "Best for everyday analysis and quick research tasks.", impact: "Low", active: false, badge: "" },
  { name: "Gemini Flash Economy", description: "Fast economical model for routine research tasks.", impact: "Lowest", active: false, badge: "" },
] as const;

export function AiBudgetIndicator({ onAddons }: { onAddons?: () => void }) {
  return <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-600 shadow-sm">
    <span className="font-semibold text-slate-800">AI budget</span>
    <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 sm:block"><span className="block h-full rounded-full bg-cyan-500" style={{ width: `${AI_USAGE_MOCK.usedPercentage}%` }} /></span>
    <span className="whitespace-nowrap">{AI_USAGE_MOCK.remainingPercentage}% left</span>
    {onAddons && <button type="button" onClick={onAddons} className="font-semibold text-cyan-700 hover:text-cyan-900">Buy add-ons</button>}
  </div>;
}

export function AiModelSwitcher() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  return <div className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"><Sparkles className="h-3.5 w-3.5 text-cyan-600" /> PsyLattice Auto <ChevronDown className="h-3.5 w-3.5 text-slate-400" /></button>
    {open && <div className="absolute right-0 top-11 z-[70] w-[min(360px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Choose a model</p><button type="button" onClick={() => setOpen(false)} aria-label="Close model picker"><X className="h-3.5 w-3.5 text-slate-400" /></button></div>
      <div className="space-y-1">{AI_MODELS.map((model) => <button key={model.name} type="button" onClick={() => { if (!model.active) setNotice("Model integration coming soon."); setOpen(false); }} className="w-full rounded-xl border border-transparent p-2.5 text-left hover:border-cyan-100 hover:bg-cyan-50/60"><div className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-cyan-700" /><span className="text-[11px] font-semibold text-slate-800">{model.name}</span>{model.badge && <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[8px] font-semibold text-cyan-800">{model.badge}</span>}<span className="ml-auto text-[9px] text-slate-400">{model.active ? "ACTIVE" : "COMING SOON"}</span></div><p className="mt-1 pl-5 text-[9px] leading-4 text-slate-500">{model.description}</p><p className="pl-5 text-[9px] font-semibold text-slate-400">Budget impact: {model.impact}</p></button>)}</div>
      {notice && <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[9px] text-slate-500">{notice}</p>}
    </div>}
  </div>;
}

export function AiBudgetWarning() {
  if (AI_USAGE_MOCK.usedPercentage < 80) return null;
  return <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-xs text-violet-950"><p className="font-semibold">Your AI budget is getting low</p><p className="mt-1 text-[10px] leading-4">You&apos;ve used {AI_USAGE_MOCK.usedPercentage}% of your AI allowance. Use PsyLattice Auto to make your remaining budget last longer, or add more AI capacity.</p></div>;
}

export function AiAddonPopover({ onClose }: { onClose: () => void }) {
  return <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"><div className="flex items-center justify-between"><p className="text-xs font-semibold">AI add-ons</p><button type="button" onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button></div><div className="mt-3 space-y-2">{[["Starter Boost", "Best for light users"], ["Research Boost", "Best for active researchers"], ["Power Boost", "Best for heavy users"]].map(([name, detail]) => <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="text-[11px] font-semibold">{name}</p><p className="mt-0.5 text-[9px] text-slate-500">{detail}</p></div><span className="text-[9px] font-semibold text-slate-400">Coming soon</span></div>)}</div></div>;
}

export function PlansAndBilling() {
  const [tab, setTab] = useState("AI Add-ons");
  const plans = [["FREE", "₹0", ["One study", "Basic participant capacity", "Small AI allowance", "PsyLattice Auto", "No custom media"]], ["STUDY PASS", "₹499 per study", ["One serious study", "500 participants", "200 AI credits", "Some model choice", "No custom media"]], ["PRO MONTHLY", "₹749 / month", ["Multiple studies", "700 participants", "300 AI credits", "Full AI model switcher", "Custom media", "2 GB media"]], ["PRO ANNUAL", "₹7,499 / year", ["Everything in Pro", "700 participants", "300 AI credits", "Full AI model switcher", "5 GB media", "Approximately 17% cheaper than monthly"]]] as const;
  const options: Record<string, string[]> = { "AI Add-ons": ["Starter Boost", "Research Boost", "Power Boost"], "Participant Expansion": ["+250 participants", "+500 participants", "+1,000 participants"], "Media Storage": ["+50 GB", "+200 GB", "+1 TB"], "Notification Emails": ["+5,000 emails", "+25,000 emails", "+100,000 emails"] };
  return <div className="space-y-5"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-cyan-700">Plans & usage</p><div className="mt-3 flex flex-wrap items-center gap-3"><AiBudgetIndicator /><AiModelSwitcher /></div><AiBudgetWarning /></div><div><h2 className="text-xl font-semibold">Plans & pricing</h2><p className="mt-1 text-xs text-slate-500">Choose the research capacity that fits your next study.</p><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{plans.map(([name, price, features]) => <div key={name} className={`rounded-2xl border p-5 ${name === "PRO MONTHLY" ? "border-cyan-300 bg-cyan-50/50 ring-2 ring-cyan-100" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between"><p className="text-xs font-bold tracking-wide">{name}</p>{name === "PRO MONTHLY" && <span className="rounded-full bg-cyan-100 px-2 py-1 text-[8px] font-bold text-cyan-800">POPULAR</span>}</div><p className="mt-4 text-xl font-semibold">{price}</p><ul className="mt-4 space-y-2 text-[10px] text-slate-600">{features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>{name === "STUDY PASS" ? <StudyPassCheckout className="mt-5" /> : <button type="button" className="mt-5 w-full rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600">View options</button>}</div>)}</div></div><div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 text-xs"><p className="font-semibold">Custom media uploads</p><p className="mt-1 text-[10px] leading-4 text-slate-600">Available only on Pro Monthly and Pro Annual for Questionnaire Builder, Ambulatory Assessments, Cognitive Lab and Thesis Builder.</p></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap gap-2">{[...Object.keys(options), "Plans & Pricing"].map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-3 py-2 text-[10px] font-semibold ${tab === item ? "bg-slate-950 text-white" : "border border-slate-200 text-slate-600"}`}>{item}</button>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-3">{(options[tab] || ["Your plan & usage", "Purchase summary", "Proceed to checkout — Coming soon"]).map((item) => <div key={item} className="rounded-xl bg-slate-50 p-4 text-xs font-semibold text-slate-700">{item}<p className="mt-2 text-[9px] font-normal text-slate-400">Presentation option · Coming soon</p></div>)}</div><div className="mt-5 rounded-xl border border-slate-100 p-4 text-[10px] text-slate-500"><p className="font-semibold text-slate-800">Model budget impact</p><p className="mt-2">PsyLattice Auto — Low · OpenAI GPT — High · Claude — Medium · Gemini — Medium/Low depending on mode.</p></div></div></div>;
}
