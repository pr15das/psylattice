import {
  Activity,
  BarChart3,
  BellRing,
  Brain,
  Check,
  CircleDot,
  Clock3,
  FileText,
  FlaskConical,
  HeartPulse,
  Smartphone,
  Sparkles,
  Watch,
} from "lucide-react";
import type { MarketingFeature } from "@/lib/marketing-features";

function BrowserShell({
  children,
  label = "PsyLattice Research",
  dark = false,
}: {
  children: React.ReactNode;
  label?: string;
  dark?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-[26px] border shadow-[0_30px_80px_-38px_rgba(15,23,42,.38)] ${dark ? "border-white/10 bg-slate-950" : "border-slate-200 bg-white"}`}>
      <div className={`flex items-center justify-between border-b px-4 py-3 ${dark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className={`text-[9px] font-semibold ${dark ? "text-slate-400" : "text-slate-400"}`}>{label}</span>
        </div>
        <span className="rounded-full border border-cyan-200/60 bg-cyan-50 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.12em] text-cyan-800">
          Live workflow
        </span>
      </div>
      {children}
    </div>
  );
}

export function RealDashboardVisual({ ai = false }: { ai?: boolean }) {
  return (
    <BrowserShell label={ai ? "Research workspace · AI" : "Research workspace"}>
      <div className="relative overflow-hidden bg-[#f4f8f8]">
        <img
          src={ai ? "/product/researcher-ai.webp" : "/product/researcher-dashboard.webp"}
          alt={ai ? "PsyLattice Research dashboard with AI model selector" : "PsyLattice Research dashboard"}
          className="block w-full"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/15 via-transparent to-transparent" />
      </div>
    </BrowserShell>
  );
}

function StudyBuilderVisual() {
  const steps = ["Basics", "Consent", "Measures", "Cognitive", "EMA / ESM", "Launch"];
  return (
    <BrowserShell label="Study Builder">
      <div className="grid min-h-[360px] grid-cols-[128px_1fr] bg-[#f5f9f9]">
        <div className="border-r border-slate-200 bg-white p-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-800">Study flow</p>
          <div className="mt-3 space-y-1.5">
            {steps.map((step, index) => (
              <div key={step} className={`rounded-lg px-2.5 py-2 text-[8px] font-semibold ${index === 2 ? "bg-cyan-50 text-cyan-900" : "text-slate-400"}`}>
                {String(index + 1).padStart(2, "0")} · {step}
              </div>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-cyan-800">Measures</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">Assemble your study battery</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[7px] font-bold text-emerald-700">Draft saved</span>
          </div>
          <div className="mt-5 space-y-2">
            {[
              ["Perceived Stress Scale", "Questionnaire"],
              ["Go / No-Go", "Cognitive task"],
              ["Daily stress check-in", "EMA / ESM"],
            ].map(([name, kind], index) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${index === 1 ? "bg-violet-50 text-violet-700" : "bg-cyan-50 text-cyan-800"}`}>
                    {index === 1 ? <Brain className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-[9px] font-bold text-slate-800">{name}</p>
                    <p className="mt-0.5 text-[7px] text-slate-400">{kind}</p>
                  </div>
                </div>
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
            ))}
          </div>
          <button className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-[8px] font-bold text-white">
            Add component
          </button>
        </div>
      </div>
    </BrowserShell>
  );
}

function CognitiveVisual() {
  return (
    <BrowserShell label="Cognitive Lab" dark>
      <div className="grid min-h-[360px] place-items-center bg-[radial-gradient(circle_at_50%_32%,rgba(34,211,238,.12),transparent_36%),#020617] p-7">
        <div className="w-full max-w-[470px]">
          <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <span>Go / No-Go · trial 18 / 80</span>
            <span>Practice complete</span>
          </div>
          <div className="relative mt-6 grid h-[190px] place-items-center overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035]">
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15" />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_55px_rgba(34,211,238,.18)]">
              <CircleDot className="h-9 w-9 text-cyan-200" />
            </div>
            <span className="absolute bottom-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[7px] font-semibold text-slate-400">
              Respond only to target stimuli
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Reaction time", "428 ms"],
              ["Accuracy", "94%"],
              ["Omissions", "2"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                <p className="text-[7px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserShell>
  );
}

function AmbulatoryVisual() {
  return (
    <div className="relative mx-auto max-w-[560px] py-5">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/35 blur-3xl" />
      <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_220px_1fr]">
        <div className="space-y-3">
          {[
            ["08:30", "Morning check-in"],
            ["13:00", "Stress + context"],
            ["20:30", "Evening reflection"],
          ].map(([time, label]) => (
            <div key={time} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-[8px] font-bold text-cyan-800">{time}</p>
              <p className="mt-1 text-[10px] font-semibold text-slate-800">{label}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto w-[210px] rounded-[36px] border-[7px] border-slate-950 bg-slate-950 p-2 shadow-[0_28px_70px_-28px_rgba(15,23,42,.55)]">
          <div className="overflow-hidden rounded-[27px] bg-[#f5f9f9]">
            <div className="border-b border-slate-200 bg-white px-3 pb-2 pt-5">
              <p className="text-[8px] font-bold text-slate-900">PsyLattice participant</p>
            </div>
            <div className="p-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <BellRing className="h-4 w-4 text-cyan-300" />
                <p className="mt-3 text-xs font-semibold">Stress check-in is ready</p>
                <p className="mt-1 text-[7px] leading-3 text-slate-300">Complete by 14:00 · about 1 minute</p>
                <button className="mt-3 rounded-lg bg-cyan-300 px-3 py-2 text-[7px] font-bold text-slate-950">Open task</button>
              </div>
              <div className="mt-3 space-y-2">
                {["Morning check-in", "Corsi task"].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-[7px] font-semibold text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <Activity className="h-5 w-5 text-cyan-800" />
            <p className="mt-2 text-[9px] font-bold text-cyan-950">Repeated real-world measurement</p>
            <p className="mt-1 text-[8px] leading-4 text-cyan-900/70">Responses stay attached to time, study phase and participant.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Clock3 className="h-5 w-5 text-slate-600" />
            <p className="mt-2 text-[9px] font-bold text-slate-900">Windows + reminders</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WearablesVisual() {
  return (
    <BrowserShell label="Sensor-contingent rule">
      <div className="relative min-h-[360px] overflow-hidden bg-[#f6faf9] p-6">
        <svg viewBox="0 0 720 330" className="h-full w-full" role="img" aria-label="Wearable sensor rule pipeline">
          <defs>
            <linearGradient id="lineGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <path d="M130 165 C210 165 220 90 300 90 S390 165 455 165 S545 235 610 235" fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeDasharray="7 8" opacity=".55">
            <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="2s" repeatCount="indefinite" />
          </path>
          {[
            [95,165,"Wearable"],
            [300,90,"Health Connect"],
            [465,165,"Rule engine"],
            [625,235,"Prompt"],
          ].map(([x,y,label], index) => (
            <g key={String(label)} transform={`translate(${x} ${y})`}>
              <circle r="46" fill={index === 2 ? "#ecfeff" : "#fff"} stroke={index === 2 ? "#22d3ee" : "#cbd5e1"} strokeWidth="2" />
              <circle r="9" fill="#0891b2" filter="url(#softGlow)">
                <animate attributeName="r" values="7;10;7" dur={`${2 + index * .25}s`} repeatCount="indefinite" />
              </circle>
              <text x="0" y="72" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="600">{label}</text>
            </g>
          ))}
          <g transform="translate(430 260)">
            <rect x="-92" y="-36" width="184" height="72" rx="18" fill="#0f172a" />
            <text x="0" y="-7" textAnchor="middle" fill="#67e8f9" fontSize="11" fontWeight="700">IF HR &gt; threshold</text>
            <text x="0" y="14" textAnchor="middle" fill="#cbd5e1" fontSize="10">for duration · fresh sample</text>
          </g>
        </svg>
        <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
          {["Threshold", "Duration", "Freshness", "Cooldown", "Max / day"].map((item) => (
            <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[8px] font-semibold text-slate-600 shadow-sm">
              {item}
            </span>
          ))}
        </div>
      </div>
    </BrowserShell>
  );
}

function AnalysisVisual() {
  const points = [
    [70,175],[105,160],[138,155],[164,132],[198,142],[220,112],[253,118],[284,94],[315,86],[350,75]
  ];
  return (
    <BrowserShell label="Analysis Lab">
      <div className="grid min-h-[360px] gap-3 bg-[#f5f9f9] p-4 sm:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-800">Regression</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Stress → reaction time</p>
            </div>
            <BarChart3 className="h-5 w-5 text-cyan-800" />
          </div>
          <svg viewBox="0 0 420 220" className="mt-3 w-full">
            <line x1="45" y1="190" x2="390" y2="190" stroke="#cbd5e1" />
            <line x1="45" y1="20" x2="45" y2="190" stroke="#cbd5e1" />
            <line x1="65" y1="174" x2="365" y2="62" stroke="#0891b2" strokeWidth="3" />
            {points.map(([x,y], i) => (
              <circle key={i} cx={x} cy={y} r="5" fill="#0f172a" opacity=".78">
                <animate attributeName="r" values="4;6;4" dur={`${2.4 + i * .08}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </svg>
          <div className="grid grid-cols-3 gap-2">
            {[["β","0.31"],["p","0.018"],["R²","0.14"]].map(([a,b]) => (
              <div key={a} className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[7px] text-slate-400">{a}</p>
                <p className="mt-1 text-xs font-bold text-slate-800">{b}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {["Descriptives","Correlations","Regression","ANOVA / GLM","Mixed models"].map((label,index) => (
            <div key={label} className={`flex items-center justify-between rounded-xl border p-3 ${index===2 ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white"}`}>
              <span className="text-[9px] font-semibold text-slate-700">{label}</span>
              {index===2 && <Check className="h-3.5 w-3.5 text-cyan-700" />}
            </div>
          ))}
        </div>
      </div>
    </BrowserShell>
  );
}

function ThesisVisual() {
  return (
    <BrowserShell label="Thesis Builder + Analyst AI">
      <div className="grid min-h-[360px] gap-0 bg-white sm:grid-cols-[1.2fr_.8fr]">
        <div className="border-r border-slate-200 p-5">
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-cyan-800">Results</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">3.2 Stress and cognitive performance</h3>
          <div className="mt-5 space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-100" />
            <div className="h-2 w-[92%] rounded-full bg-slate-100" />
            <div className="h-2 w-[96%] rounded-full bg-slate-100" />
            <div className="h-2 w-[76%] rounded-full bg-slate-100" />
          </div>
          <div className="mt-5 rounded-xl border-l-2 border-cyan-500 bg-cyan-50/70 p-3">
            <p className="text-[8px] leading-4 text-cyan-900">Regression output linked from Analysis Lab · β = .31 · p = .018</p>
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-100" />
            <div className="h-2 w-[86%] rounded-full bg-slate-100" />
            <div className="h-2 w-[94%] rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] font-bold">PsyLattice AI</p>
              <p className="text-[7px] text-slate-400">Document access allowed</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-white/10 p-3 text-[8px] leading-4 text-slate-200">
              Explain this result in relation to my hypothesis.
            </div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-cyan-300/20 bg-cyan-300/10 p-3 text-[8px] leading-4 text-slate-200">
              Your model suggests a positive association. I would report the estimate, uncertainty and model context rather than treating the p-value alone as the conclusion.
            </div>
          </div>
        </div>
      </div>
    </BrowserShell>
  );
}

function ParticipantVisual() {
  return (
    <div className="relative mx-auto max-w-[560px] py-4">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/35 blur-3xl" />
      <div className="relative mx-auto grid max-w-[510px] items-center gap-5 sm:grid-cols-[190px_1fr]">
        <div className="mx-auto w-[190px] rounded-[34px] border-[7px] border-slate-950 bg-slate-950 p-2 shadow-[0_30px_70px_-28px_rgba(15,23,42,.6)]">
          <div className="overflow-hidden rounded-[25px] bg-[#f5f9f9]">
            <div className="bg-white px-3 pb-2 pt-5">
              <p className="text-[8px] font-bold text-slate-900">Today</p>
              <p className="mt-0.5 text-[6px] text-slate-400">Stress & attention study</p>
            </div>
            <div className="p-3">
              <div className="rounded-2xl bg-cyan-950 p-3 text-white">
                <p className="text-[7px] uppercase tracking-[0.12em] text-cyan-300">Next task</p>
                <p className="mt-1 text-[10px] font-bold">Afternoon check-in</p>
                <p className="mt-1 text-[6px] text-cyan-100/70">Due before 15:00</p>
              </div>
              <div className="mt-3 space-y-2">
                {[["Morning check-in",true],["Corsi task",true],["Evening reflection",false]].map(([label,done]) => (
                  <div key={String(label)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                      {done ? <Check className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                    </span>
                    <span className="text-[7px] font-semibold text-slate-600">{String(label)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-cyan-800" />
              <div>
                <p className="text-[9px] font-bold text-slate-900">Push notification</p>
                <p className="mt-1 text-[8px] text-slate-500">Tap → exact study task</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <HeartPulse className="h-5 w-5 text-cyan-800" />
              <div>
                <p className="text-[9px] font-bold text-slate-900">Health context</p>
                <p className="mt-1 text-[8px] text-slate-500">Permission-based Android data</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-cyan-800" />
              <div>
                <p className="text-[9px] font-bold text-slate-900">One participant dashboard</p>
                <p className="mt-1 text-[8px] text-slate-500">Due · upcoming · complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeatureVisual({ feature }: { feature: MarketingFeature }) {
  switch (feature.visual) {
    case "study-builder":
      return <StudyBuilderVisual />;
    case "cognitive":
      return <CognitiveVisual />;
    case "ambulatory":
      return <AmbulatoryVisual />;
    case "wearables":
      return <WearablesVisual />;
    case "analysis":
      return <AnalysisVisual />;
    case "thesis":
      return <ThesisVisual />;
    case "participant":
      return <ParticipantVisual />;
    default:
      return null;
  }
}

export function FeatureMiniVisual({ feature }: { feature: MarketingFeature }) {
  if (feature.visual === "cognitive") {
    return (
      <div className="relative h-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(34,211,238,.18),transparent_35%)]" />
        <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10">
          <CircleDot className="h-5 w-5 text-cyan-200" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[6px] font-bold uppercase tracking-[.12em] text-slate-500">
          <span>428 ms</span><span>94% accuracy</span>
        </div>
      </div>
    );
  }

  if (feature.visual === "analysis") {
    return (
      <div className="h-24 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
        <svg viewBox="0 0 260 78" className="h-full w-full">
          <line x1="15" y1="65" x2="245" y2="65" stroke="#cbd5e1" />
          <line x1="15" y1="12" x2="15" y2="65" stroke="#cbd5e1" />
          <line x1="25" y1="58" x2="230" y2="22" stroke="#0891b2" strokeWidth="2" />
          {[35,65,95,125,155,185,215].map((x, i) => (
            <circle key={x} cx={x} cy={58 - i * 5 + (i % 2) * 5} r="3.5" fill="#0f172a" />
          ))}
        </svg>
      </div>
    );
  }

  if (feature.visual === "wearables") {
    return (
      <div className="relative h-24 overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50">
        <div className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-cyan-800 shadow-sm">
          <Watch className="h-5 w-5" />
        </div>
        <div className="absolute left-[66px] right-[66px] top-1/2 h-px bg-cyan-300" />
        <div className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950 text-cyan-200 shadow-sm">
          <BellRing className="h-5 w-5" />
        </div>
        <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-white px-2 py-1 text-[6px] font-bold text-cyan-800 shadow-sm">IF condition</span>
      </div>
    );
  }

  if (feature.visual === "participant") {
    return (
      <div className="flex h-24 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50">
        <div className="h-[74px] w-[42px] rounded-[10px] border-[3px] border-slate-950 bg-slate-950 p-1">
          <div className="h-full rounded-[6px] bg-white p-1">
            <div className="h-3 rounded bg-cyan-950" />
            <div className="mt-1 h-2 rounded bg-slate-100" />
            <div className="mt-1 h-2 rounded bg-slate-100" />
            <div className="mt-1 h-2 rounded bg-cyan-50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-24 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/50 to-white p-3">
      <div className="flex h-full gap-2">
        <div className="w-1/3 rounded-xl bg-slate-950/95 p-2">
          <div className="h-1.5 w-8 rounded-full bg-cyan-300/60" />
          <div className="mt-2 h-1.5 w-10 rounded-full bg-white/20" />
          <div className="mt-2 h-1.5 w-6 rounded-full bg-white/20" />
        </div>
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-2">
          <div className="h-2 w-16 rounded-full bg-slate-200" />
          <div className="mt-3 h-2 w-full rounded-full bg-cyan-100" />
          <div className="mt-2 h-2 w-[78%] rounded-full bg-slate-100" />
          <div className="mt-2 h-2 w-[88%] rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
