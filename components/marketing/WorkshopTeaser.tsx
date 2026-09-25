"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Sparkles } from "lucide-react";

function WorkshopTeaserIllustration() {
  return (
    <svg viewBox="0 0 760 460" role="img" aria-label="PsyLattice workshop pathway illustration" className="h-auto w-full">
      <defs>
        <linearGradient id="workshop-teaser-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecfeff" />
          <stop offset="55%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef2ff" />
        </linearGradient>
        <linearGradient id="workshop-teaser-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="workshop-teaser-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="18" stdDeviation="20" floodColor="#0f172a" floodOpacity=".10" />
        </filter>
      </defs>
      <rect x="20" y="20" width="720" height="420" rx="44" fill="url(#workshop-teaser-bg)" />
      <circle cx="650" cy="80" r="44" fill="#cffafe" opacity=".8" />
      <circle cx="98" cy="360" r="54" fill="#ede9fe" opacity=".85" />
      <g filter="url(#workshop-teaser-shadow)">
        <rect x="105" y="104" width="550" height="244" rx="32" fill="#ffffff" stroke="#dbeafe" />
      </g>
      <path d="M164 232 C225 168 286 296 347 222 C407 151 470 289 586 202" fill="none" stroke="url(#workshop-teaser-line)" strokeWidth="7" strokeLinecap="round" />
      {[164, 300, 438, 586].map((x, index) => (
        <g key={x}>
          <circle cx={x} cy={[232,246,226,202][index]} r="28" fill="#ffffff" stroke="#0e7490" strokeWidth="3" />
          <text x={x} y={[237,251,231,207][index]} textAnchor="middle" fontSize="12" fontWeight="800" fill="#164e63">W{index + 1}</text>
        </g>
      ))}
      <g transform="translate(138 140)">
        <rect width="138" height="54" rx="18" fill="#f8fafc" stroke="#e2e8f0" />
        <circle cx="26" cy="27" r="9" fill="#22d3ee" />
        <path d="M46 22h66M46 31h48" stroke="#64748b" strokeWidth="5" strokeLinecap="round" opacity=".45" />
      </g>
      <g transform="translate(448 276)">
        <rect width="150" height="50" rx="18" fill="#0f172a" />
        <circle cx="26" cy="25" r="8" fill="#67e8f9" />
        <path d="M45 20h79M45 29h56" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" opacity=".78" />
      </g>
      <text x="380" y="74" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0e7490" letterSpacing="2">POSSIBLE START · 7 NOVEMBER 2026</text>
      <text x="380" y="392" textAnchor="middle" fontSize="12" fill="#64748b">One live session each weekend · one month · PsyLattice workflows</text>
    </svg>
  );
}

export default function WorkshopTeaser() {
  return (
    <section className="border-y border-slate-200 bg-white px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] text-cyan-800">
            <Sparkles className="h-3.5 w-3.5" />
            PsyLattice Workshops
          </div>
          <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-.04em] text-slate-950 sm:text-[48px]">Learn modern research by building it.</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">A one-month live workshop moving from research fundamentals to ambulatory assessment, cognitive tasks and statistical measurement — all through PsyLattice.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f5f9f8] px-3 py-2 text-xs font-semibold text-slate-700"><CalendarDays className="h-4 w-4 text-cyan-700" />Possible start: 7 November 2026</span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f5f9f8] px-3 py-2 text-xs font-semibold text-slate-700"><Clock3 className="h-4 w-4 text-cyan-700" />1 hour each weekend · 4 live sessions</span>
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">Exact timings, detailed session information and the full brochure are shared privately with registered participants.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/workshops/register" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-cyan-950">Register now<ArrowRight className="h-4 w-4" /></Link>
            <Link href="/workshops" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">View workshop details</Link>
          </div>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-[16%] rounded-full bg-cyan-200/45 blur-3xl" />
          <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-[#f8fbfb] shadow-[0_24px_70px_rgba(15,23,42,.09)]"><WorkshopTeaserIllustration /></div>
        </div>
      </div>
    </section>
  );
}
