import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  Clock3,
  FlaskConical,
  GraduationCap,
  LockKeyhole,
  MapPin,
  MessageCircleMore,
  Microscope,
  Network,
  Search,
  Sparkles,
  UsersRound,
  Waves,
} from "lucide-react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const WORKSHOP_TITLE = "Foundations of Modern Psychological Research with PsyLattice";

const benefits = [
  {
    title: "Move beyond one-time surveys",
    text: "Learn how research questions can become longitudinal, experimental and cognitively informed designs.",
    icon: Network,
  },
  {
    title: "Connect design and analysis",
    text: "See how variables, measurement, study structure and statistical decisions belong to one research workflow.",
    icon: Microscope,
  },
  {
    title: "Build with PsyLattice",
    text: "Use PsyLattice to turn research concepts into studies, assessments, cognitive tasks and analysis workflows.",
    icon: BookOpenCheck,
  },
  {
    title: "Earn a verifiable certificate",
    text: "Complete attendance across the workshop and receive a PsyLattice certificate with a public Workshop Reference.",
    icon: Award,
  },
];

const learningPath = [
  {
    week: "Week 1",
    title: "Research foundations",
    text: "Move from a research question to constructs, variables, hypotheses, operational definitions, sampling and a defensible study design.",
    icon: FlaskConical,
  },
  {
    week: "Week 2",
    title: "Longitudinal & ambulatory research",
    text: "Understand repeated measurement, follow-up designs, EMA / ESM and how to capture psychological processes in daily life.",
    icon: Waves,
  },
  {
    week: "Week 3",
    title: "Cognitive & experimental methods",
    text: "Learn how manipulations, cognitive tasks, reaction-time measures and batteries extend research beyond questionnaires.",
    icon: BrainCircuit,
  },
  {
    week: "Week 4",
    title: "Statistical measurement & analysis",
    text: "Connect measurement to descriptives, reliability, effect sizes, relationships, model selection and interpretation inside PsyLattice.",
    icon: BarChart3,
  },
];

function WorkshopHeroVisual() {
  return (
    <svg
      viewBox="0 0 820 590"
      role="img"
      aria-label="PsyLattice workshop research workflow illustration"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id="wk-hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="44%" stopColor="#ecfeff" />
          <stop offset="100%" stopColor="#eef2ff" />
        </linearGradient>
        <linearGradient id="wk-hero-route" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="wk-hero-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="22" stdDeviation="24" floodColor="#0f172a" floodOpacity=".13" />
        </filter>
      </defs>

      <rect x="22" y="22" width="776" height="546" rx="48" fill="url(#wk-hero-bg)" />
      <circle cx="694" cy="100" r="58" fill="#cffafe" opacity=".85" />
      <circle cx="110" cy="470" r="76" fill="#ede9fe" opacity=".78" />

      <g filter="url(#wk-hero-shadow)">
        <rect x="96" y="82" width="628" height="416" rx="38" fill="#ffffff" stroke="#dbeafe" />
      </g>

      <g transform="translate(134 118)">
        <rect width="198" height="76" rx="22" fill="#f8fafc" stroke="#e2e8f0" />
        <circle cx="34" cy="38" r="14" fill="#06b6d4" opacity=".18" />
        <path d="M29 38h10M34 33v10" stroke="#0891b2" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M62 29h104M62 42h76" stroke="#64748b" strokeWidth="6" strokeLinecap="round" opacity=".35" />
      </g>

      <g transform="translate(489 118)">
        <rect width="196" height="76" rx="22" fill="#0f172a" />
        <circle cx="34" cy="38" r="14" fill="#67e8f9" opacity=".18" />
        <path d="M26 40l7-9 7 7 7-11" fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M62 29h101M62 42h66" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" opacity=".7" />
      </g>

      <path
        d="M180 286 C255 226 311 349 390 282 C470 214 517 348 638 265"
        fill="none"
        stroke="url(#wk-hero-route)"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {[
        [180, 286, "W1", "#ecfeff", "#0e7490"],
        [330, 302, "W2", "#f0fdfa", "#0f766e"],
        [485, 286, "W3", "#f5f3ff", "#6d28d9"],
        [638, 265, "W4", "#eef2ff", "#4338ca"],
      ].map(([x, y, label, fill, color]) => (
        <g key={String(label)}>
          <circle cx={Number(x)} cy={Number(y)} r="34" fill={String(fill)} stroke="#ffffff" strokeWidth="8" />
          <circle cx={Number(x)} cy={Number(y)} r="27" fill="#ffffff" stroke={String(color)} strokeWidth="2.5" />
          <text x={Number(x)} y={Number(y) + 5} textAnchor="middle" fontSize="12" fontWeight="800" fill={String(color)}>
            {label}
          </text>
        </g>
      ))}

      <g transform="translate(144 370)">
        <rect width="244" height="86" rx="24" fill="#f8fafc" stroke="#e2e8f0" />
        <text x="22" y="31" fontSize="11" fontWeight="800" fill="#0e7490" letterSpacing="1.4">
          RESEARCH PATH
        </text>
        <path d="M23 52h46l21-14 28 19 35-27 54 21" fill="none" stroke="#0891b2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g transform="translate(438 370)">
        <rect width="238" height="86" rx="24" fill="#fafafa" stroke="#e2e8f0" />
        <text x="22" y="31" fontSize="11" fontWeight="800" fill="#6d28d9" letterSpacing="1.4">
          COMPLETE PATH
        </text>
        <circle cx="40" cy="57" r="11" fill="#ede9fe" />
        <path d="M35 57l4 4 8-10" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M64 53h134M64 64h92" stroke="#64748b" strokeWidth="5" strokeLinecap="round" opacity=".33" />
      </g>

      <text x="410" y="530" textAnchor="middle" fontSize="12" fontWeight="700" fill="#475569" letterSpacing="1">
        7 · 14 · 21 · 28 NOVEMBER 2026
      </text>
    </svg>
  );
}

function PricingTimelineVisual() {
  return (
    <svg viewBox="0 0 900 270" aria-hidden="true" className="h-auto w-full">
      <defs>
        <linearGradient id="wk-price-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M105 136H795" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
      <path d="M105 136H795" stroke="url(#wk-price-line)" strokeWidth="5" strokeLinecap="round" opacity=".55" />

      {[
        [140, "EARLY", "₹299", "1–30 Sep 2026"],
        [450, "STANDARD", "₹399", "1–24 Oct 2026"],
        [760, "FINAL", "₹599", "25 Oct–7 Nov 2026"],
      ].map(([x, top, price, caption]) => (
        <g key={String(top)}>
          <circle cx={Number(x)} cy="136" r="18" fill="#ffffff" stroke="#0e7490" strokeWidth="4" />
          <circle cx={Number(x)} cy="136" r="7" fill="#06b6d4" />
          <text x={Number(x)} y="48" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a" letterSpacing="1.4">
            {top}
          </text>
          <text x={Number(x)} y="88" textAnchor="middle" fontSize="30" fontWeight="800" fill="#0f172a">
            {price}
          </text>
          <text x={Number(x)} y="198" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
            {caption}
          </text>
        </g>
      ))}
    </svg>
  );
}

function CertificatePreview() {
  return (
    <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,.11)] sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-violet-100/70 blur-3xl" />

      <div className="relative overflow-hidden rounded-[28px] border border-cyan-100 bg-[linear-gradient(145deg,#ffffff_0%,#fbffff_55%,#f7f5ff_100%)] px-7 py-8 text-center sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-3 rounded-[22px] border border-slate-200/80" />
        <div className="pointer-events-none absolute -right-10 top-7 h-32 w-32 rounded-full border-[18px] border-cyan-100/60" />
        <div className="pointer-events-none absolute -left-10 bottom-7 h-28 w-28 rounded-full border-[16px] border-violet-100/65" />
        <Image
          src="/psylattice-mark.svg"
          alt=""
          width={190}
          height={190}
          className="pointer-events-none absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 opacity-[.025]"
        />

        <div className="relative">
          <div className="flex items-center justify-center gap-2.5">
            <Image src="/psylattice-mark.svg" alt="PsyLattice" width={34} height={34} className="h-8.5 w-8.5" />
            <span className="text-lg font-semibold tracking-[-.03em]">
              <span className="text-slate-950">Psy</span>
              <span className="text-cyan-600">L</span>
              <span className="text-slate-950">attice</span>
            </span>
          </div>

          <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          <p className="mt-5 text-[9px] font-bold uppercase tracking-[.26em] text-cyan-800">Certificate of Completion</p>
          <p className="mt-5 text-xs text-slate-500">This certifies that</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-.04em] text-slate-950">Participant Name</p>

          <p className="mt-5 text-xs leading-5 text-slate-500">successfully completed the PsyLattice Workshop on</p>
          <p className="mx-auto mt-2 max-w-[520px] text-base font-semibold leading-6 text-slate-900">
            “{WORKSHOP_TITLE}”
          </p>
          <p className="mx-auto mt-4 max-w-[500px] text-[11px] leading-5 text-slate-500">
            Covering research design, ambulatory assessment, cognitive tasks and statistical measurement techniques using PsyLattice.
          </p>

          <div className="mx-auto mt-7 grid max-w-[520px] gap-3 border-t border-slate-200 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-400">Cohort</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-700">November 2026</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-400">Workshop Reference</p>
              <p className="mt-1 font-mono text-[11px] font-semibold text-slate-700">PSY-W26-XXXXXX</p>
            </div>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[.14em] text-slate-400">Status</p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-700">Verified completion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkshopLanding() {
  return (
    <main className="min-h-screen bg-[#f5f9f8] text-slate-950">
      <MarketingHeader />

      <section className="px-5 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[.86fr_1.14fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-cyan-800 shadow-[0_7px_22px_rgba(8,145,178,.08)]">
              <Sparkles className="h-3.5 w-3.5" />
              PsyLattice Workshops
            </div>

            <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-[-.055em] text-slate-950 sm:text-6xl lg:text-[72px] lg:leading-[.98]">
              Research methods that connect.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              A one-month live workshop that takes you from research fundamentals to ambulatory assessments, cognitive tasks and statistical measurement — all built through PsyLattice.
            </p>

            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,.055)]">
                <div className="flex items-center gap-2 text-cyan-800">
                  <CalendarDays className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-[.12em]">Begins</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">7 November 2026</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,.055)]">
                <div className="flex items-center gap-2 text-violet-700">
                  <Clock3 className="h-4 w-4" />
                  <p className="text-xs font-bold uppercase tracking-[.12em]">Format</p>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-950">1 hour every weekend · 4 sessions</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-cyan-950"
              >
                Create account to register
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#upcoming"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-900"
              >
                View workshop details
              </a>
            </div>

            <p className="mt-4 max-w-xl text-xs leading-5 text-slate-500">
              Registration requires a PsyLattice account. Exact session timings, meeting information and the detailed brochure are shared privately after confirmed registration.
            </p>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-[18%] rounded-full bg-cyan-200/50 blur-3xl" />
            <div className="relative overflow-hidden rounded-[42px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,.1)]">
              <WorkshopHeroVisual />
            </div>
          </div>
        </div>
      </section>

      <section id="upcoming" className="scroll-mt-28 border-y border-slate-200 bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 lg:grid-cols-[.76fr_1.24fr] lg:items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">Upcoming workshop</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-[48px]">
                One month. Four weekends. One connected research journey.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                The cohort runs across four November weekends. Exact session timings and the detailed workshop brochure are shared privately with registered participants.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: CalendarDays, label: "Session dates", value: "7 · 14 · 21 · 28 November 2026" },
                { icon: Clock3, label: "Session length", value: "1 hour each weekend" },
                { icon: UsersRound, label: "Live format", value: "4 sessions across one month" },
                { icon: MessageCircleMore, label: "Private channel", value: "Timings + brochure via WhatsApp" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-[24px] border border-slate-200 bg-[#f8fbfb] p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-cyan-800 shadow-[0_8px_20px_rgba(15,23,42,.06)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">Registration pricing</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-[48px]">Register earlier. Pay less.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The fee is determined by the date your registration payment is successfully completed.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_22px_65px_rgba(15,23,42,.07)] sm:p-8">
            <PricingTimelineVisual />
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { price: "₹299", title: "Early registration", text: "1 September – 30 September 2026" },
                { price: "₹399", title: "Standard registration", text: "1 October – 24 October 2026" },
                { price: "₹599", title: "Final registration", text: "25 October – 7 November 2026" },
              ].map((item) => (
                <div key={item.price} className="rounded-2xl border border-slate-200 bg-[#f8fbfb] p-5">
                  <p className="text-3xl font-semibold tracking-[-.04em] text-slate-950">{item.price}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              Final registration remains open through 7 November 2026, the day the workshop begins.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                <GraduationCap className="h-5 w-5" />
              </div>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-cyan-300">Why join</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-[48px]">
                Build research thinking, not just software familiarity.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                The workshop is designed around transferable research reasoning. PsyLattice is the environment used to make those ideas tangible from design through analysis.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/[.045] p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="mt-5 text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">What you will learn</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-[48px]">
              From a research question to a modern psychological study.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Each weekend advances the same connected workflow, so the methods build on one another rather than feeling like isolated topics.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {learningPath.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.week} className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[#f8fbfb] p-6 shadow-[0_16px_44px_rgba(15,23,42,.05)]">
                  <div className="absolute right-4 top-3 text-[56px] font-semibold leading-none tracking-[-.08em] text-cyan-950/[.035]">
                    0{index + 1}
                  </div>
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-cyan-800 shadow-[0_8px_22px_rgba(15,23,42,.07)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="relative mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-cyan-700">{item.week}</p>
                  <h3 className="relative mt-2 text-base font-semibold text-slate-950">{item.title}</h3>
                  <p className="relative mt-3 text-xs leading-5 text-slate-500">{item.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-[28px] border border-cyan-200 bg-cyan-50/70 p-6 sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">The connecting thread</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-.035em] text-slate-950">You build the ideas through PsyLattice.</h3>
              </div>
              <div className="grid gap-2 sm:grid-cols-5">
                {["Question", "Study design", "Ambulatory", "Cognition", "Analysis"].map((label, index) => (
                  <div key={label} className="relative rounded-2xl bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,.05)]">
                    {label}
                    {index < 4 && <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-cyan-500 sm:block">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <CertificatePreview />

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-violet-700">Completion certificate</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-[48px]">
              Complete the workshop. Earn a verifiable certificate.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              Attend all four live sessions to earn your PsyLattice Workshop certificate. Once complete attendance is recorded, your certificate becomes available with a unique Workshop Reference for public verification.
            </p>

            <div className="mt-6 space-y-3">
              {[
                ["Registration", "Verified workshop payment"],
                ["Attendance", "Complete attendance to earn your certificate"],
                ["Certificate", `Participant name + “${WORKSHOP_TITLE}”`],
                ["Verification", "Public lookup using the Workshop Reference"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="max-w-[70%] text-right text-xs font-semibold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[.72fr_1.28fr] lg:items-center">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">Certificate verification</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-[48px]">Check a PsyLattice workshop reference.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              Anyone will be able to verify whether a workshop certificate was issued and who it was granted to. Personal registration and payment information stays private.
            </p>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-[#f8fbfb] p-6 shadow-[0_22px_60px_rgba(15,23,42,.06)] sm:p-8">
            <label htmlFor="workshop-reference" className="text-xs font-semibold text-slate-700">
              Workshop Reference
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="flex min-h-12 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4">
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  id="workshop-reference"
                  name="reference"
                  placeholder="PSY-W26-XXXXXX"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  readOnly
                  aria-describedby="verification-status"
                />
              </div>
              <button type="button" disabled className="rounded-xl bg-slate-300 px-5 py-3 text-sm font-semibold text-white">
                Verify
              </button>
            </div>
            <p id="verification-status" className="mt-3 text-xs leading-5 text-slate-500">
              Public verification will activate when the first workshop certificates are issued.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-800">Private participant channel</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-[48px]">
              Registration unlocks the operational details.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              The public page shows the workshop dates and format, while exact session timings, meeting links and the detailed brochure remain private.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: LockKeyhole, title: "After verified payment", text: "Your registration becomes confirmed and your Workshop Reference is created." },
              { icon: MessageCircleMore, title: "WhatsApp group", text: "The official group invitation becomes available only to confirmed participants." },
              { icon: MapPin, title: "Exact timings", text: "Session timings and live-session logistics are shared through the private group." },
              { icon: BookOpenCheck, title: "Detailed brochure", text: "The full session-wise brochure is distributed through private participant channels." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,.05)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="mt-5 text-sm font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[34px] bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-[35%] h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-cyan-300">First cohort · November 2026</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-.045em] sm:text-[48px]">
                Create your PsyLattice account to register.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                Workshop registration, payment, your Workshop Reference, private participant access and certificate status will all be connected to the same PsyLattice account.
              </p>
            </div>

            <Link href="/signin" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-px">
              Create PsyLattice account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
