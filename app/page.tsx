"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileDown,
  FileText,
  FlaskConical,
  HeartPulse,
  Layers3,
  LockKeyhole,
  MessageSquare,
  Microscope,
  NotebookPen,
  Search,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Stethoscope,
  Target,
  Users,
  Watch,
  Workflow,
  X,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Send,
  type LucideIcon,
} from "lucide-react";

type WorkspaceId = "self" | "research" | "clinical";
type PricingRegion = "India" | "europe";
type PreviewKind =
  | "assessment"
  | "ai"
  | "ambulatory"
  | "regulation"
  | "progress"
  | "wearables"
  | "summary"
  | "library"
  | "builder"
  | "custom"
  | "participants"
  | "data"
  | "export"
  | "clients"
  | "history"
  | "notes"
  | "followup";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  preview: PreviewKind;
  badge?: string;
};

type Workspace = {
  id: WorkspaceId;
  number: string;
  navLabel: string;
  label: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: LucideIcon;
  features: Feature[];
};

const workspaces: Workspace[] = [
  {
    id: "self",
    number: "01",
    navLabel: "Self",
    label: "For individuals",
    title: "PsyLattice Self",
    shortDescription: "Assess · Monitor · Regulate",
    description:
      "Understand your psychological patterns through structured self-assessments, real-world check-ins and guided self-regulation.",
    icon: Brain,
    features: [
      {
        id: "self-assessments",
        title: "Validated self-assessment questionnaires",
        description:
          "Use structured psychological self-checks while keeping results organised in your personal workspace.",
        icon: ClipboardCheck,
        preview: "assessment",
      },
      {
        id: "ai-guide",
        title: "AI-guided assessment discovery",
        description:
          "Describe what you have been experiencing and use AI guidance to navigate suitable self-checks without automated diagnosis.",
        icon: Sparkles,
        preview: "ai",
        badge: "AI",
      },
      {
        id: "ambulatory",
        title: "Ambulatory assessments",
        description:
          "Capture repeated experiences as they occur across everyday situations and routines.",
        icon: Activity,
        preview: "ambulatory",
      },
      {
        id: "self-regulation",
        title: "Self-regulation tools",
        description:
          "Turn reflection into small, structured routines that can be followed over time.",
        icon: Target,
        preview: "regulation",
      },
      {
        id: "progress",
        title: "Progress tracking",
        description:
          "Bring repeated measures together to make patterns across time easier to notice.",
        icon: BarChart3,
        preview: "progress",
      },
      {
        id: "wearables",
        title: "Optional wearable integration",
        description:
          "Add sleep, activity and physiological context when you choose to connect supported wearable data.",
        icon: Watch,
        preview: "wearables",
      },
      {
        id: "therapist-summary",
        title: "Therapist Summary",
        description:
          "Prepare selected information to discuss with your therapist while retaining control over what you share.",
        icon: FileText,
        preview: "summary",
      },
    ],
  },
  {
    id: "research",
    number: "02",
    navLabel: "Research",
    label: "For researchers",
    title: "PsyLattice Research",
    shortDescription: "Build · Collect · Export",
    description:
      "Design psychological studies, deploy questionnaires and ambulatory protocols, manage participants and export research-ready data.",
    icon: Microscope,
    features: [
      {
        id: "library",
        title: "Questionnaire Library",
        description:
          "Find reusable psychological measures and keep study instruments organised in one research workflow.",
        icon: ClipboardList,
        preview: "library",
      },
      {
        id: "study-builder",
        title: "Study Builder",
        description:
          "Configure study information, consent, measures and participant flow before a study goes live.",
        icon: FlaskConical,
        preview: "builder",
      },
      {
        id: "custom-questionnaires",
        title: "Custom questionnaires",
        description:
          "Build study-specific questionnaires when a library measure is not the right fit.",
        icon: Layers3,
        preview: "custom",
      },
      {
        id: "ema-esm",
        title: "EMA / ESM protocols",
        description:
          "Create repeated real-world assessment schedules with ambulatory windows and participant prompts.",
        icon: Activity,
        preview: "ambulatory",
      },
      {
        id: "participant-dashboards",
        title: "Participant dashboards",
        description:
          "Track participation, phases and completion without mixing research participation with personal Self records.",
        icon: Users,
        preview: "participants",
      },
      {
        id: "research-monitoring",
        title: "Research data monitoring",
        description:
          "Inspect study activity, completion, responses and data flags while collection is underway.",
        icon: Database,
        preview: "data",
      },
      {
        id: "exports",
        title: "CSV, XLSX and analysis-ready exports",
        description:
          "Move from collection to structured datasets with multiple export formats and research-ready views.",
        icon: FileDown,
        preview: "export",
      },
    ],
  },
  {
    id: "clinical",
    number: "03",
    navLabel: "Clinical",
    label: "For professionals",
    title: "PsyLattice Clinical",
    shortDescription: "Review · Document · Follow up",
    description:
      "Bring assessments, everyday monitoring and authorised physiological context together in a structured professional workspace.",
    icon: Stethoscope,
    features: [
      {
        id: "client-dashboard",
        title: "Assigned client dashboard",
        description:
          "Keep connected client relationships, access status and relevant shared information in one professional context.",
        icon: Users,
        preview: "clients",
      },
      {
        id: "assessment-history",
        title: "Assessment history",
        description:
          "Review supported assessment information across time within the connected client workflow.",
        icon: ClipboardCheck,
        preview: "history",
      },
      {
        id: "clinical-monitoring",
        title: "Ambulatory monitoring",
        description:
          "Review authorised real-world monitoring information shared through the connected-care workflow.",
        icon: Activity,
        preview: "ambulatory",
      },
      {
        id: "wearable-summaries",
        title: "Wearable summaries",
        description:
          "Add authorised sleep, activity and physiological summaries as context when clients choose to share them.",
        icon: Watch,
        preview: "wearables",
      },
      {
        id: "longitudinal-progress",
        title: "Longitudinal progress",
        description:
          "Bring repeated information together to support qualified professional review over time.",
        icon: BarChart3,
        preview: "progress",
      },
      {
        id: "professional-notes",
        title: "Professional notes",
        description:
          "Keep clinician-authored working notes organised in a dedicated professional record.",
        icon: NotebookPen,
        preview: "notes",
      },
      {
        id: "follow-up",
        title: "Professional notes and follow-up",
        description:
          "Keep appointments, follow-up activity and non-emergency communication attached to the professional workflow.",
        icon: BellRing,
        preview: "followup",
      },
    ],
  },
];

const process = [
  {
    number: "01",
    title: "Measure",
    icon: ClipboardCheck,
    description:
      "Collect psychological information through validated questionnaires, repeated self-report and real-world assessments.",
    detail:
      "Structured measures and repeated check-ins create the raw material for understanding change.",
  },
  {
    number: "02",
    title: "Observe",
    icon: Activity,
    description:
      "Understand how experiences change across time, situations and everyday routines.",
    detail:
      "Ambulatory measurement helps move beyond a single retrospective snapshot.",
  },
  {
    number: "03",
    title: "Understand",
    icon: BarChart3,
    description:
      "Organise scores, patterns and longitudinal information into clear, interpretable views.",
    detail:
      "PsyLattice keeps the information structured so people can review the pattern rather than hunt for it.",
  },
  {
    number: "04",
    title: "Act",
    icon: Target,
    description:
      "Support self-regulation, research decisions or qualified professional review.",
    detail:
      "The next action depends on context: personal reflection, research decisions or human professional review.",
  },
];

const securityItems = [
  {
    title: "Role-based access",
    description:
      "Personal, research and clinical information remain within appropriately authorised workflows.",
    icon: LockKeyhole,
  },
  {
    title: "Granular sharing",
    description:
      "Users control which optional information is shared with professionals or studies.",
    icon: ShieldCheck,
  },
  {
    title: "Auditability",
    description:
      "Sensitive professional and administrative actions can be recorded in access logs.",
    icon: FileText,
  },
  {
    title: "Human clinical responsibility",
    description:
      "Clinical interpretation, diagnosis and treatment decisions remain with qualified professionals.",
    icon: Stethoscope,
  },
];

const pricingContent = {
  India: {
    label: "India",
    sublabel: "Early-access pricing for India and Asia",
    cards: [
      {
        id: "self",
        eyebrow: "For individuals and clients",
        title: "PsyLattice Self",
        price: "₹59",
        cadence: "/month",
        featured: true,
        description:
          "A personal PsyLattice account for self-assessment, daily monitoring, self-regulation, progress tracking and Luna AI.",
        bullets: [
          "Full Self workspace",
          "Assessments and structured self-checks",
          "Monitoring and longitudinal progress",
          "Self-regulation tools",
          "AI guidance",
          "Can also be used by clients connected to clinicians",
        ],
        ctaLabel: "Start with Self",
        ctaHref: "/signin",
        note: "Also available annually at ₹590/year.",
      },
      {
        id: "clinician",
        eyebrow: "For professionals",
        title: "Clinician account",
        price: "Free",
        cadence: "",
        featured: false,
        description:
          "Clinicians can onboard clients, assign assessments, review authorised progress and use the clinical workspace without a subscription fee.",
        bullets: [
          "Clinical workspace access",
          "Invite and onboard clients",
          "Assign assessments and monitoring",
          "Review shared progress and summaries",
          "Clients subscribe to PsyLattice Self if needed",
        ],
        ctaLabel: "Create clinician account",
        ctaHref: "/signin",
        note: "Clients control what information is shared.",
      },
      {
        id: "researcher",
        eyebrow: "For researchers",
        title: "Researcher account",
        price: "Free",
        cadence: "",
        featured: false,
        description:
          "Build and test research without paying. Your first live PsyLattice study is free, then choose pay-as-you-go or Researcher Pro.",
        bullets: [
          "Questionnaire Library and Study Builder",
          "Custom questionnaires and EMA / ESM protocols",
          "Longitudinal follow-up and mobile workflows",
          "Unlimited drafts and preview testing",
          "First live study free",
        ],
        ctaLabel: "Create researcher account",
        ctaHref: "/signin",
        note: "Your first live study is on us. After that, pay per study or switch to Researcher Pro.",
      },
      {
        id: "study-standard",
        eyebrow: "Pay as you go",
        title: "Standard Study",
        price: "₹29",
        cadence: "/study",
        featured: false,
        description:
          "For occasional research. Publish a live study and collect data from up to 500 participants.",
        bullets: [
          "Up to 500 participants",
          "Participants do not pay",
          "EMA / ESM and longitudinal workflows included",
          "Build and test before publication for free",
        ],
        ctaLabel: "Choose Standard",
        ctaHref: "/signin",
        note: "Applies from your second live study onward if you are not subscribed to Researcher Pro.",
      },
      {
        id: "study-large",
        eyebrow: "Pay as you go",
        title: "Large Study",
        price: "₹99",
        cadence: "/study",
        featured: false,
        description:
          "For larger projects. Publish a live study and collect data from up to 1,000 participants.",
        bullets: [
          "Up to 1,000 participants",
          "Participants do not pay",
          "EMA / ESM and longitudinal workflows included",
          "Wearable / Health Connect research workflows included",
        ],
        ctaLabel: "Choose Large",
        ctaHref: "/signin",
        note: "Applies from your second live study onward if you are not subscribed to Researcher Pro.",
      },
      {
        id: "research-pro-monthly",
        eyebrow: "For regular researchers",
        title: "Researcher Pro",
        price: "₹129",
        cadence: "/month",
        featured: true,
        description:
          "For researchers who run studies regularly and do not want to pay every time they publish.",
        bullets: [
          "Publish multiple studies while subscribed",
          "Up to 3 simultaneously live studies",
          "Up to 1,000 participants per live study",
          "EMA / ESM, longitudinal and wearable workflows included",
        ],
        ctaLabel: "Get Researcher Pro",
        ctaHref: "/signin",
        note: "Best for researchers running multiple studies throughout the year.",
      },
      {
        id: "research-pro-annual",
        eyebrow: "Best value",
        title: "Researcher Pro Annual",
        price: "₹999",
        cadence: "/year",
        featured: true,
        description:
          "The same Researcher Pro access at a lower effective monthly price for long-term PsyLattice users.",
        bullets: [
          "Everything in Researcher Pro",
          "Equivalent to about ₹83/month",
          "Up to 3 simultaneously live studies",
          "No per-study publication charge while subscribed",
        ],
        ctaLabel: "Choose annual Pro",
        ctaHref: "/signin",
        note: "Save ₹549 compared with paying ₹129 every month for a full year.",
      },
      {
        id: "participants",
        eyebrow: "For study participants",
        title: "Participant access",
        price: "Free",
        cadence: "",
        featured: false,
        description:
          "People invited into a PsyLattice study can participate without paying for an account.",
        bullets: [
          "No subscription required",
          "Access through study link or participant mobile flow",
          "Complete assigned study measures",
          "Research participants never pay to participate",
        ],
        ctaLabel: "Learn how studies work",
        ctaHref: "/signin",
        note: "Participant access remains free regardless of the researcher's billing option.",
      },
    ],
  },
  europe: {
    label: "Europe",
    sublabel: "Early-access pricing for Europe",
    cards: [
      {
        id: "self",
        eyebrow: "For individuals and clients",
        title: "PsyLattice Self",
        price: "€4.99",
        cadence: "/month",
        featured: true,
        description:
          "A personal PsyLattice account for self-assessment, daily monitoring, self-regulation, progress tracking and Luna AI.",
        bullets: [
          "Full Self workspace",
          "Assessments and structured self-checks",
          "Monitoring and longitudinal progress",
          "Self-regulation tools",
          "AI guidance",
          "Can also be used by clients connected to clinicians",
        ],
        ctaLabel: "Start with Self",
        ctaHref: "/signin",
        note: "Also available annually at €49.90/year.",
      },
      {
        id: "clinician",
        eyebrow: "For professionals",
        title: "Clinician account",
        price: "Free",
        cadence: "",
        featured: false,
        description:
          "Clinicians can onboard clients, assign assessments, review authorised progress and use the clinical workspace without a subscription fee.",
        bullets: [
          "Clinical workspace access",
          "Invite and onboard clients",
          "Assign assessments and monitoring",
          "Review shared progress and summaries",
          "Clients subscribe to PsyLattice Self if needed",
        ],
        ctaLabel: "Create clinician account",
        ctaHref: "/signin",
        note: "Clients control what information is shared.",
      },
      {
        id: "researcher",
        eyebrow: "For researchers",
        title: "Researcher account",
        price: "Free",
        cadence: "",
        featured: false,
        description:
          "Build and test research without paying. Your first live PsyLattice study is free, then choose pay-as-you-go or Researcher Pro.",
        bullets: [
          "Questionnaire Library and Study Builder",
          "Custom questionnaires and EMA / ESM protocols",
          "Longitudinal follow-up and mobile workflows",
          "Unlimited drafts and preview testing",
          "First live study free",
        ],
        ctaLabel: "Create researcher account",
        ctaHref: "/signin",
        note: "Your first live study is on us. After that, pay per study or switch to Researcher Pro.",
      },
      {
        id: "study-standard",
        eyebrow: "Pay as you go",
        title: "Standard Study",
        price: "€3.99",
        cadence: "/study",
        featured: false,
        description:
          "For occasional research. Publish a live study and collect data from up to 500 participants.",
        bullets: [
          "Up to 500 participants",
          "Participants do not pay",
          "EMA / ESM and longitudinal workflows included",
          "Build and test before publication for free",
        ],
        ctaLabel: "Choose Standard",
        ctaHref: "/signin",
        note: "Applies from your second live study onward if you are not subscribed to Researcher Pro.",
      },
      {
        id: "study-large",
        eyebrow: "Pay as you go",
        title: "Large Study",
        price: "€7.99",
        cadence: "/study",
        featured: false,
        description:
          "For larger projects. Publish a live study and collect data from up to 1,000 participants.",
        bullets: [
          "Up to 1,000 participants",
          "Participants do not pay",
          "EMA / ESM and longitudinal workflows included",
          "Wearable / Health Connect research workflows included",
        ],
        ctaLabel: "Choose Large",
        ctaHref: "/signin",
        note: "Applies from your second live study onward if you are not subscribed to Researcher Pro.",
      },
      {
        id: "research-pro-monthly",
        eyebrow: "For regular researchers",
        title: "Researcher Pro",
        price: "€9.99",
        cadence: "/month",
        featured: true,
        description:
          "For researchers who run studies regularly and do not want to pay every time they publish.",
        bullets: [
          "Publish multiple studies while subscribed",
          "Up to 3 simultaneously live studies",
          "Up to 1,000 participants per live study",
          "EMA / ESM, longitudinal and wearable workflows included",
        ],
        ctaLabel: "Get Researcher Pro",
        ctaHref: "/signin",
        note: "Best for researchers running multiple studies throughout the year.",
      },
      {
        id: "research-pro-annual",
        eyebrow: "Best value",
        title: "Researcher Pro Annual",
        price: "€79.99",
        cadence: "/year",
        featured: true,
        description:
          "The same Researcher Pro access at a lower effective monthly price for long-term PsyLattice users.",
        bullets: [
          "Everything in Researcher Pro",
          "Equivalent to about €6.67/month",
          "Up to 3 simultaneously live studies",
          "No per-study publication charge while subscribed",
        ],
        ctaLabel: "Choose annual Pro",
        ctaHref: "/signin",
        note: "Save €39.89 compared with paying €9.99 every month for a full year.",
      },
      {
        id: "participants",
        eyebrow: "For study participants",
        title: "Participant access",
        price: "Free",
        cadence: "",
        featured: false,
        description:
          "People invited into a PsyLattice study can participate without paying for an account.",
        bullets: [
          "No subscription required",
          "Access through study link or participant mobile flow",
          "Complete assigned study measures",
          "Research participants never pay to participate",
        ],
        ctaLabel: "Learn how studies work",
        ctaHref: "/signin",
        note: "Participant access remains free regardless of the researcher's billing option.",
      },
    ],
  },
} as const;

const ANDROID_BETA_FILE_ID = "1hzWlv_JGRLd047m0dd2pqoSmjKlQ9Mha";
const ANDROID_BETA_URL = `https://drive.google.com/uc?export=download&id=${ANDROID_BETA_FILE_ID}`;
const ANDROID_BETA_DRIVE_URL =
  "https://drive.google.com/file/d/1hzWlv_JGRLd047m0dd2pqoSmjKlQ9Mha/view?usp=drive_web";

function CheckMark() {
  return <Check className="h-4 w-4 shrink-0" strokeWidth={1.9} />;
}

function MobileEcosystemVisual() {
  const modes = [
    {
      id: "health",
      icon: HeartPulse,
      label: "Health Connect",
      title: "Permission-based health context",
      description:
        "Sleep, activity and supported physiological context can feed configured Android workflows.",
      screenTitle: "Health context",
      screenMeta: "Health Connect active",
      screenBody: "Permission-based signals can add real-world context to supported research and monitoring workflows.",
      statOne: "Sleep",
      statTwo: "Activity",
      badge: "Connected",
    },
    {
      id: "wearables",
      icon: Watch,
      label: "Wearable context",
      title: "Supported wearable-derived data",
      description:
        "Bring supported wearable-derived data into configured research workflows through Android Health Connect.",
      screenTitle: "Wearable context",
      screenMeta: "Synced through Health Connect",
      screenBody: "Keep wearable context alongside the psychological measurements that give it meaning.",
      statOne: "Steps",
      statTwo: "Sleep",
      badge: "Permission active",
    },
    {
      id: "research",
      icon: Microscope,
      label: "Research",
      title: "Ambulatory and longitudinal studies",
      description:
        "EMA / ESM protocols, participant prompts and repeated follow-up stay connected across time.",
      screenTitle: "EMA / ESM protocol",
      screenMeta: "3 prompts today",
      screenBody: "Repeated check-ins capture experiences closer to when they happen instead of relying only on recall.",
      statOne: "91%",
      statTwo: "14 days",
      badge: "Study active",
    },
    {
      id: "care",
      icon: Stethoscope,
      label: "Connected care",
      title: "Follow-up beyond the session",
      description:
        "Appointments, secure messages and authorised longitudinal context stay available in the same account.",
      screenTitle: "Connected follow-up",
      screenMeta: "Next appointment · 25 Aug",
      screenBody: "Keep appointments, secure communication and authorised progress connected between sessions.",
      statOne: "1 appt",
      statTwo: "2 messages",
      badge: "Connected",
    },
  ] as const;

  const [activeModeId, setActiveModeId] = useState<(typeof modes)[number]["id"]>("research");
  const activeMode = modes.find((mode) => mode.id === activeModeId) ?? modes[2];

  const leftModes = modes.slice(0, 2);
  const rightModes = modes.slice(2);

  return (
    <div className="relative mx-auto w-full max-w-[590px] py-3">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[410px] w-[410px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/35 blur-3xl" />

      <div className="relative grid items-center gap-5 sm:grid-cols-[1fr_230px_1fr]">
        <div className="space-y-3 sm:text-right">
          {leftModes.map((mode) => {
            const Icon = mode.icon;
            const selected = mode.id === activeModeId;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveModeId(mode.id)}
                className={`w-full rounded-2xl border p-4 text-left shadow-sm backdrop-blur transition duration-200 sm:text-right ${
                  selected
                    ? "border-cyan-300 bg-white shadow-[0_12px_30px_-22px_rgba(8,145,178,.55)]"
                    : "border-slate-200 bg-white/90 hover:border-cyan-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3 sm:flex-row-reverse">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                      selected ? "bg-cyan-100 text-cyan-900" : "bg-cyan-50 text-cyan-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 sm:justify-end">
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          selected ? "text-cyan-900" : "text-slate-800"
                        }`}
                      >
                        {mode.label}
                      </p>
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{mode.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative mx-auto w-[220px] rounded-[38px] border-[7px] border-slate-950 bg-slate-950 p-2 shadow-[0_32px_80px_-30px_rgba(15,23,42,.58)]">
          <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-950" />
          <div className="overflow-hidden rounded-[28px] bg-[#f7faf9]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 pb-2 pt-5">
              <div className="flex items-center gap-2">
                <PsyLatticeLogo size={22} />
              </div>
              <BellRing className="h-3.5 w-3.5 text-slate-500" />
            </div>

            <div className="p-3">
              <div key={activeMode.id} className="rounded-2xl bg-slate-950 p-3 text-white">
                <p className="text-[7px] font-semibold uppercase tracking-[0.15em] text-cyan-300">
                  {activeMode.label}
                </p>
                <p className="mt-1 text-sm font-semibold">{activeMode.screenTitle}</p>
                <p className="mt-1 text-[8px] leading-4 text-slate-300">{activeMode.screenBody}</p>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <Activity className="h-3.5 w-3.5 text-cyan-700" />
                  <p className="mt-2 text-[9px] font-semibold text-slate-800">{activeMode.statOne}</p>
                  <p className="mt-0.5 text-[7px] text-slate-400">{activeMode.label}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <HeartPulse className="h-3.5 w-3.5 text-cyan-700" />
                  <p className="mt-2 text-[9px] font-semibold text-slate-800">{activeMode.statTwo}</p>
                  <p className="mt-0.5 text-[7px] text-slate-400">Current context</p>
                </div>
              </div>

              <div className="mt-2.5 rounded-xl border border-cyan-100 bg-cyan-50/80 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[8px] font-semibold text-cyan-900">{activeMode.title}</p>
                  <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[6px] font-semibold text-cyan-700">
                    {activeMode.badge}
                  </span>
                </div>
                <p className="mt-1 text-[7px] leading-3 text-cyan-800/70">{activeMode.screenMeta}</p>
              </div>

              <div className="mt-3 flex items-center justify-around rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  const selected = mode.id === activeModeId;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveModeId(mode.id)}
                      aria-label={`Show ${mode.label}`}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                        selected ? "bg-cyan-50 text-cyan-800" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {rightModes.map((mode) => {
            const Icon = mode.icon;
            const selected = mode.id === activeModeId;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setActiveModeId(mode.id)}
                className={`w-full rounded-2xl border p-4 text-left shadow-sm backdrop-blur transition duration-200 ${
                  selected
                    ? "border-cyan-300 bg-white shadow-[0_12px_30px_-22px_rgba(8,145,178,.55)]"
                    : "border-slate-200 bg-white/90 hover:border-cyan-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                      selected ? "bg-cyan-100 text-cyan-900" : "bg-slate-950 text-cyan-200"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
                          selected ? "text-cyan-900" : "text-slate-800"
                        }`}
                      >
                        {mode.label}
                      </p>
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{mode.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap justify-center gap-2">
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-800">
          Android beta · available now
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500">
          iPhone + Apple Health + Apple Watch · coming soon
        </span>
      </div>
    </div>
  );
}


function UpcomingCapabilitiesShowcase() {
  const upcoming = [
    {
      id: "cognitive",
      icon: Brain,
      eyebrow: "Cognitive Lab",
      title: "Run real cognitive experiments inside PsyLattice.",
      description:
        "Template-based and custom cognitive tasks will let researchers combine questionnaires, EMA and cognitive performance in one study pipeline.",
      points: [
        "Template library for Stroop, Flanker, Go/No-Go, N-back, PVT and more.",
        "Trial-level reaction time, accuracy and timing-ready exports.",
        "Practice blocks, randomisation, feedback, counterbalancing and adaptive flow.",
      ],
      chips: ["Task Builder", "Reaction time", "Templates", "Longitudinal cognition"],
      statA: "10+ launch templates",
      statB: "Trial-level exports",
      accent: "from-cyan-300/22 via-cyan-50 to-white",
      panelTint: "border-cyan-200 bg-cyan-50/85 text-cyan-900",
      illustration: (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-800">
                  Task Builder
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-900">Emotional Stroop · draft</p>
              </div>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[9px] font-semibold text-cyan-800">
                Preview
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {[
                ["Fixation", "500 ms"],
                ["Word stimulus", "max 1500 ms"],
                ["Response keys", "R · G · B · Y"],
                ["Feedback", "practice only"],
              ].map(([label, meta]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] font-semibold text-slate-800">{label}</p>
                  <p className="text-[10px] text-slate-500">{meta}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <FlaskConical className="h-4 w-4 text-cyan-700" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Trial table</p>
              <p className="mt-1 text-xs font-semibold text-slate-900">Conditions + correct responses</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <BarChart3 className="h-4 w-4 text-cyan-700" />
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Outputs</p>
              <p className="mt-1 text-xs font-semibold text-slate-900">RT, accuracy & summary scores</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "device-data",
      icon: Database,
      eyebrow: "Device-based collection",
      title: "Broader device and sensor-aware study workflows.",
      description:
        "PsyLattice will expand contextual data collection while remaining selective about what is actually stored and used in research workflows.",
      points: [
        "Health Connect today, with Apple Health / HealthKit support planned on iPhone.",
        "Event-based and windowed data capture instead of default raw-data warehousing.",
        "Use contextual signals to trigger EMA, follow-up, or future cognitive tasks.",
      ],
      chips: ["Health Connect", "HealthKit", "Event windows", "Context triggers"],
      statA: "Selective storage",
      statB: "Cross-device design",
      accent: "from-cyan-500/20 via-sky-100 to-white",
      panelTint: "border-cyan-200 bg-cyan-50/85 text-cyan-900",
      illustration: (
        <div className="space-y-3">
          <div className="rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,.035),0_12px_28px_rgba(15,23,42,.07)]">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <Watch className="mx-auto h-5 w-5 text-cyan-700" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Wearable</p>
              </div>
              <ArrowRight className="mx-auto hidden h-4 w-4 text-slate-300 sm:block" />
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-3 py-3 text-center">
                <HeartPulse className="mx-auto h-5 w-5 text-cyan-800" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Health layer</p>
              </div>
              <ArrowRight className="mx-auto hidden h-4 w-4 text-slate-300 sm:block" />
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
                <Workflow className="mx-auto h-5 w-5 text-slate-800" />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Study rule</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Storage strategy</p>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[9px] font-semibold text-cyan-800">Lean by default</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold text-slate-800">Trigger event only</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">Small, practical, privacy-conscious.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] font-semibold text-slate-800">Event window</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">Keep useful context when the study truly needs it.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ios",
      icon: Smartphone,
      eyebrow: "Apple ecosystem",
      title: "Native iPhone app with Apple Health context.",
      description:
        "The next major mobile step is a native iPhone experience so participants and self users are not limited to Android.",
      points: [
        "Native iPhone workspace shell aligned with Self, Research and Clinical.",
        "Apple Health / HealthKit access for steps, sleep, heart rate and workouts.",
        "Clear path to iPhone research participation and clinician-connected follow-up.",
      ],
      chips: ["iPhone app", "Apple Health", "HealthKit", "TestFlight beta"],
      statA: "iPhone participant support",
      statB: "Apple Health integration",
      accent: "from-slate-300/30 via-slate-100 to-white",
      panelTint: "border-slate-300 bg-slate-100/85 text-slate-900",
      illustration: (
        <div className="space-y-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-700">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                  <path d="M16.37 12.61c.02 2.43 2.13 3.24 2.15 3.25-.02.06-.34 1.18-1.12 2.34-.67 1-1.36 2-2.46 2.02-1.08.02-1.43-.64-2.67-.64-1.24 0-1.62.62-2.65.66-1.06.04-1.88-1.06-2.55-2.06-1.37-1.98-2.42-5.59-1.01-8.05.7-1.22 1.95-2 3.31-2.02 1.03-.02 2 .7 2.67.7.67 0 1.92-.87 3.24-.74.55.02 2.08.22 3.06 1.65-.08.05-1.82 1.06-1.8 2.89Zm-2.19-6.86c.56-.68.95-1.63.85-2.57-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.57-.86 2.49.9.07 1.82-.46 2.38-1.14Z" />
                </svg>
                Apple support coming up
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-800">
                <HeartPulse className="h-3.5 w-3.5" />
                Apple Health / HealthKit
              </span>
            </div>

            <div className="mt-4 rounded-[26px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(207,250,254,.9),rgba(255,255,255,1)_55%)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-slate-900" aria-hidden="true">
                      <path d="M16.37 12.61c.02 2.43 2.13 3.24 2.15 3.25-.02.06-.34 1.18-1.12 2.34-.67 1-1.36 2-2.46 2.02-1.08.02-1.43-.64-2.67-.64-1.24 0-1.62.62-2.65.66-1.06.04-1.88-1.06-2.55-2.06-1.37-1.98-2.42-5.59-1.01-8.05.7-1.22 1.95-2 3.31-2.02 1.03-.02 2 .7 2.67.7.67 0 1.92-.87 3.24-.74.55.02 2.08.22 3.06 1.65-.08.05-1.82 1.06-1.8 2.89Zm-2.19-6.86c.56-.68.95-1.63.85-2.57-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.57-.86 2.49.9.07 1.82-.46 2.38-1.14Z" />
                    </svg>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">iPhone app</p>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-950">PsyLattice on iPhone</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">A clean native shell for Self, Research and Clinical—designed for Apple Health-enabled real-world follow-up.</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-600">Soon</span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <HeartPulse className="h-4 w-4 text-cyan-700" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Health</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">Heart rate + sleep</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <Activity className="h-4 w-4 text-cyan-700" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Activity</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">Steps, workouts, movement</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-950 p-3 text-white shadow-sm">
                  <Smartphone className="h-4 w-4 text-cyan-300" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Use case</p>
                  <p className="mt-1 text-xs font-semibold">Cross-platform participant support</p>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Distribution path</p>
            <p className="mt-2 text-xs font-semibold text-slate-900">Build now, test free on your own iPhone, then move to TestFlight when ready.</p>
          </div>
        </div>
      ),
    },
    {
      id: "wear-os",
      icon: Watch,
      eyebrow: "Wrist-based experiences",
      title: "Wear OS and Apple Watch companion experiences.",
      description:
        "Short prompts and contextual study interactions can eventually extend from the phone to the wrist, making PsyLattice even more real-world.",
      points: [
        "Quick responses, reminders and micro-interactions on the wrist.",
        "Useful for ambulatory and longitudinal research with less disruption.",
        "Complements—not replaces—the phone-based PsyLattice experience.",
      ],
      chips: ["Wear OS", "Apple Watch", "Micro-prompts", "Real-world research"],
      statA: "Wrist prompts",
      statB: "Companion workflows",
      accent: "from-cyan-400/20 via-white to-cyan-100",
      panelTint: "border-cyan-200 bg-cyan-50/90 text-cyan-900",
      illustration: (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-700">
                  <Watch className="h-3.5 w-3.5" />
                  Wear OS
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Google ecosystem</span>
              </div>
              <div className="mt-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbfb_0%,#ffffff_100%)] p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm">
                    <Watch className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Wrist companion</p>
                    <p className="text-sm font-semibold text-slate-900">Quick micro-prompts on Wear OS</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-300">Prompt</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[8px] font-semibold text-slate-200">2 sec response</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold">Stress check-in</p>
                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {[1,2,3,4,5].map((n) => (
                      <div key={n} className={`rounded-lg py-2 text-center text-[10px] font-semibold ${n === 3 ? "bg-cyan-400 text-slate-950" : "bg-white/10 text-slate-200"}`}>
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-700">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                    <path d="M16.37 12.61c.02 2.43 2.13 3.24 2.15 3.25-.02.06-.34 1.18-1.12 2.34-.67 1-1.36 2-2.46 2.02-1.08.02-1.43-.64-2.67-.64-1.24 0-1.62.62-2.65.66-1.06.04-1.88-1.06-2.55-2.06-1.37-1.98-2.42-5.59-1.01-8.05.7-1.22 1.95-2 3.31-2.02 1.03-.02 2 .7 2.67.7.67 0 1.92-.87 3.24-.74.55.02 2.08.22 3.06 1.65-.08.05-1.82 1.06-1.8 2.89Zm-2.19-6.86c.56-.68.95-1.63.85-2.57-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.57-.86 2.49.9.07 1.82-.46 2.38-1.14Z" />
                  </svg>
                  Apple Watch
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Apple ecosystem</span>
              </div>
              <div className="mt-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbfb_0%,#ffffff_100%)] p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white shadow-sm">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M16.37 12.61c.02 2.43 2.13 3.24 2.15 3.25-.02.06-.34 1.18-1.12 2.34-.67 1-1.36 2-2.46 2.02-1.08.02-1.43-.64-2.67-.64-1.24 0-1.62.62-2.65.66-1.06.04-1.88-1.06-2.55-2.06-1.37-1.98-2.42-5.59-1.01-8.05.7-1.22 1.95-2 3.31-2.02 1.03-.02 2 .7 2.67.7.67 0 1.92-.87 3.24-.74.55.02 2.08.22 3.06 1.65-.08.05-1.82 1.06-1.8 2.89Zm-2.19-6.86c.56-.68.95-1.63.85-2.57-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.57-.86 2.49.9.07 1.82-.46 2.38-1.14Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Apple support</p>
                    <p className="text-sm font-semibold text-slate-900">Fast prompt handoff from Apple Watch</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Prompt ready</p>
                    <BellRing className="h-4 w-4 text-cyan-700" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-cyan-950">Respond on the wrist, continue on iPhone when needed.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-cyan-800">Quick answer</span>
                    <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-cyan-800">Reminder</span>
                    <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-cyan-800">Continue on phone</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Why this matters</p>
            <p className="mt-2 text-xs text-slate-600">For students and early-career researchers, a wrist companion can make repeated real-world participation far easier without requiring a large custom hardware budget.</p>
          </div>
        </div>
      ),
    },
  ] as const;

  const [activeId, setActiveId] = useState<(typeof upcoming)[number]["id"]>("cognitive");
  const active = upcoming.find((item) => item.id === activeId) ?? upcoming[0];

  return (
    <div className="relative mx-auto w-full max-w-[1180px]">
      <div className={`pointer-events-none absolute inset-x-12 top-10 h-[340px] rounded-[56px] bg-gradient-to-br ${active.accent} blur-3xl opacity-80`} />
      <div className="relative overflow-hidden rounded-[34px] border border-slate-200/90 bg-white/92 p-5 shadow-[0_4px_10px_rgba(15,23,42,.04),0_30px_76px_rgba(15,23,42,.11)] backdrop-blur-xl sm:p-6 lg:p-7">
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-cyan-800 shadow-[0_2px_5px_rgba(15,23,42,.035),0_10px_24px_rgba(8,145,178,.09)]">
              <Sparkles className="h-3.5 w-3.5" />
              Coming next for PsyLattice Research
            </div>
            <h3 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Build the platform students and young researchers wish already existed.
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              PsyLattice is expanding beyond questionnaires and EMA into an integrated research environment: cognitive experiments, broader device-aware workflows and companion apps that keep serious research accessible instead of institution-only.
            </p>

            <div className="mt-6 grid gap-3">
              {upcoming.map((item) => {
                const Icon = item.icon;
                const selected = item.id === activeId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={`w-full rounded-[24px] border p-4 text-left transition duration-200 ${
                      selected
                        ? "border-cyan-300 bg-white shadow-[0_16px_44px_-30px_rgba(8,145,178,.35)]"
                        : "border-slate-200 bg-white/80 hover:border-cyan-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${selected ? "bg-cyan-100 text-cyan-900" : "bg-slate-100 text-slate-600"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${selected ? "text-cyan-900" : "text-slate-500"}`}>
                          {item.eyebrow}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="rounded-[28px] border border-slate-200/90 bg-[#f8fbfb] p-4 shadow-[0_2px_5px_rgba(15,23,42,.03),0_14px_30px_rgba(15,23,42,.06)] sm:p-5 lg:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{active.eyebrow}</p>
                  <h4 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{active.title}</h4>
                </div>
                <div className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold ${active.panelTint}`}>
                  Planned feature set
                </div>
              </div>

              <div className="mt-5">{active.illustration}</div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,.035),0_12px_28px_rgba(15,23,42,.07)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Launch value</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{active.statA}</p>
                </div>
                <div className="rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,.035),0_12px_28px_rgba(15,23,42,.07)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Research payoff</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{active.statB}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Why it matters</p>
                <ul className="mt-3 space-y-2.5">
                  {active.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-700" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {active.chips.map((chip) => (
                    <span key={chip} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroWorkspaceStage({
  activeWorkspace,
  onChange,
}: {
  activeWorkspace: WorkspaceId;
  onChange: (workspace: WorkspaceId) => void;
}) {
  const active =
    workspaces.find((workspace) => workspace.id === activeWorkspace) ??
    workspaces[0];
  const [rotationPaused, setRotationPaused] = useState(false);

  useEffect(() => {
    if (rotationPaused) return;

    const timer = window.setTimeout(() => {
      const currentIndex = workspaces.findIndex(
        (workspace) => workspace.id === activeWorkspace
      );
      const nextWorkspace =
        workspaces[(currentIndex + 1) % workspaces.length];
      onChange(nextWorkspace.id);
    }, 6500);

    return () => window.clearTimeout(timer);
  }, [activeWorkspace, onChange, rotationPaused]);

  return (
    <div
      className="relative mx-auto w-full max-w-[555px]"
      onMouseEnter={() => setRotationPaused(true)}
      onMouseLeave={() => setRotationPaused(false)}
      onFocusCapture={() => setRotationPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setRotationPaused(false);
        }
      }}
    >
      <div className="pointer-events-none absolute -inset-7 rounded-[46px] bg-gradient-to-br from-cyan-100/70 via-white to-sky-100/40 blur-2xl" />

      <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_34px_100px_-44px_rgba(15,23,42,0.36)]">
        {/* browser chrome */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            </div>
            <div className="hidden w-52 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-400 sm:block">
              psylattice.com
            </div>
          </div>

          <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-cyan-800">
            Live workspace preview
          </span>
        </div>

        {/* app header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <PsyLatticeLogo size={34} />
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div>
              
            </div>
          </div>

          <div className="w-fit">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {workspaces.map((workspace) => {
                const Icon = workspace.icon;
                const selected = workspace.id === activeWorkspace;

                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => onChange(workspace.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[9px] font-semibold transition ${
                      selected
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {workspace.navLabel}
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 h-[2px] overflow-hidden rounded-full bg-slate-100">
              {!rotationPaused && (
                <div
                  key={`cycle-${activeWorkspace}`}
                  className="hero-cycle-progress h-full rounded-full bg-cyan-700"
                />
              )}
            </div>
          </div>
        </div>

        <div
          key={activeWorkspace}
          className="hero-panel-in grid min-h-[405px] grid-cols-[120px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)]"
        >
          {/* sidebar */}
          <aside className="border-r border-slate-200 bg-white p-3 sm:p-4">
            <div className="mb-4 rounded-xl bg-cyan-50/70 px-3 py-2.5">
              <p className="text-[8px] font-semibold uppercase tracking-[0.15em] text-cyan-800">
                {active.label}
              </p>
              <p className="mt-1 text-[10px] font-semibold text-slate-800">
                {active.title.replace("PsyLattice ", "")}
              </p>
            </div>

            <p className="px-2 text-[8px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Workspace
            </p>

            <div className="mt-2 space-y-1">
              {active.features.slice(0, 5).map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.id}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2.5 ${
                      index === 0
                        ? "bg-cyan-50 text-cyan-900"
                        : "text-slate-400"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-[8px] font-semibold">
                      {feature.title}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Context
              </p>
              <p className="mt-1 text-[9px] leading-4 text-slate-500">
                {active.shortDescription}
              </p>
            </div>
          </aside>

          {/* workspace content */}
          <div className="min-w-0 bg-[#f7f9f9]">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-5">
              <div>
                <p className="text-[10px] font-semibold text-slate-800">
                  {active.title}
                </p>
                <p className="mt-0.5 text-[8px] text-slate-400">
                  PsyLattice workspace
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">
                  Active
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-500">
                  PD
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {activeWorkspace === "self" && <HeroSelfPreview />}
              {activeWorkspace === "research" && <HeroResearchPreview />}
              {activeWorkspace === "clinical" && <HeroClinicalPreview />}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-800">
              {active.label}
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              {active.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("platform")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="inline-flex shrink-0 items-center gap-2 text-[10px] font-semibold text-slate-800 transition hover:text-cyan-800"
          >
            Explore features
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroSelfPreview() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
          Your overview
        </p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-slate-950">
          Good morning.
        </h3>
        <p className="mt-1 text-[10px] leading-5 text-slate-500">
          A calm snapshot of today’s personal psychological tools.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["2 / 3", "Check-ins", "completed today"],
          ["Day 8", "Current plan", "stress regulation"],
          ["3", "Assessments", "completed"],
        ].map(([value, label, detail]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="text-[8px] text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {value}
            </p>
            <p className="mt-1 text-[8px] text-slate-400">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.13em] text-slate-400">
                Latest self-assessment
              </p>
              <p className="mt-1 text-[11px] font-semibold text-slate-800">
                Perceived Stress
              </p>
            </div>
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">
              Moderate range
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-full w-[58%] rounded-full bg-cyan-700" />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            <p className="text-[8px] font-semibold uppercase tracking-[0.13em] text-cyan-300">
              Luna AI
            </p>
          </div>
          <p className="mt-3 text-[9px] leading-5 text-slate-300">
            Not sure what to assess? Explore suitable self-checks without
            automated diagnosis.
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroResearchPreview() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
            Active study
          </p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.025em] text-slate-950">
            Daily Stress in University Students
          </h3>
          <p className="mt-1 text-[10px] text-slate-500">
            14-day ambulatory protocol
          </p>
        </div>
        <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-700">
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["93", "Participants"],
          ["81%", "Compliance"],
          ["2,846", "Responses"],
          ["7", "Data flags"],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-3.5"
          >
            <p className="text-base font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-[8px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[9px] font-semibold text-slate-700">
          Study workflow
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {["Measures", "EMA", "Participants", "Export"].map(
            (label, index) => (
              <div key={label}>
                <div className="flex items-center">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold ${
                      index < 3
                        ? "bg-cyan-800 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {index < 3 ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {index < 3 && (
                    <span className="ml-1 hidden h-px flex-1 bg-cyan-200 sm:block" />
                  )}
                </div>
                <p className="mt-2 text-[8px] text-slate-400">{label}</p>
              </div>
            )
          )}
        </div>
      </div>

      <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileDown className="h-3.5 w-3.5 text-cyan-800" />
          <p className="text-[9px] font-semibold text-cyan-900">
            CSV · XLSX · analysis-ready exports
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroClinicalPreview() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
          Connected clients
        </p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-slate-950">
          Professional workspace
        </h3>
        <p className="mt-1 text-[10px] leading-5 text-slate-500">
          Authorised assessments, monitoring, notes and follow-up in one context.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["AS", "A. Sharma", "Monitoring + assessments shared", "Today"],
          ["RK", "R. Kapoor", "Assessment history shared", "Yesterday"],
        ].map(([initials, name, shared, updated]) => (
          <button
            key={name}
            type="button"
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-[9px] font-semibold text-cyan-800">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-800">
                  {name}
                </p>
                <p className="mt-1 truncate text-[8px] text-slate-400">
                  {shared}
                </p>
              </div>
              <span className="text-[7px] text-slate-300">{updated}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-cyan-800" />
            <p className="text-[9px] font-semibold text-slate-700">
              Shared monitoring
            </p>
          </div>
          <div className="mt-4 flex h-20 items-end gap-2">
            {[44, 57, 51, 68, 60, 73, 64].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t bg-cyan-700/65"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-cyan-800" />
            <p className="text-[9px] font-semibold text-slate-700">
              Next appointment
            </p>
          </div>
          <p className="mt-4 text-lg font-semibold text-slate-900">
            25 Aug
          </p>
          <p className="mt-1 text-[8px] text-slate-400">
            10:00 · 50 minutes
          </p>
          <div className="mt-4 flex items-center gap-2 text-[8px] font-semibold text-cyan-800">
            <MessageSquare className="h-3 w-3" />
            Secure follow-up available
          </div>
        </div>
      </div>
    </div>
  );
}

function ExplorerCard({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white ${
        highlight
          ? "border-cyan-300 shadow-[0_0_0_3px_rgba(8,145,178,0.08),0_14px_35px_rgba(15,23,42,0.08)]"
          : "border-slate-200 shadow-sm"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function ExplorerMiniStat({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">{value}</p>
      {helper && <p className="mt-1 text-[10px] text-slate-400">{helper}</p>}
    </div>
  );
}

function ExplorerScreenTitle({
  eyebrow,
  title,
  action,
  onAction,
  secondary,
  onSecondary,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-800">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        {secondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            {secondary}
          </button>
        )}
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-xl bg-slate-950 px-3.5 py-2 text-[10px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

function ExplorerNotice({ text }: { text: string }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2.5 text-[10px] text-cyan-900">
      <span>{text}</span>
      
    </div>
  );
}

function ExplorerToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`h-5 w-9 rounded-full p-0.5 transition ${enabled ? "bg-cyan-600" : "bg-slate-200"}`}
      aria-pressed={enabled}
    >
      <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function ExplorerSelfCore({ slideId }: { slideId: string }) {
  const [notice, setNotice] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { side: "ai", text: "What would you like to understand better today?" },
    { side: "user", text: "I keep getting tense before group presentations." },
    { side: "ai", text: "We can unpack what happens before, during and after those moments, then decide what may be worth monitoring." },
  ]);
  const [assessmentStarted, setAssessmentStarted] = useState<string | null>(null);
  const [checkins, setCheckins] = useState({ morning: true, evening: false });
  const [routines, setRoutines] = useState({ grounding: true, winddown: false, rehearsal: true });
  const [progressRange, setProgressRange] = useState<"7d" | "30d" | "90d">("30d");
  const [wearables, setWearables] = useState({ apple: true, fitbit: false, garmin: false, health: false });
  const [selectedDay, setSelectedDay] = useState(17);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { side: "clinician", text: "How did the presentation go yesterday?" },
    { side: "self", text: "Better than expected. I used the grounding routine before it started." },
  ]);
  const [sharing, setSharing] = useState({ assessments: true, monitoring: false, progress: true, wearables: false, regulation: true });

  function sendAi() {
    const text = aiInput.trim();
    if (!text) return;
    setAiMessages((current) => [...current, { side: "user", text }, { side: "ai", text: "That makes sense. We can explore what happens before, during and after those moments, then decide what may be useful to monitor." }]);
    setAiInput("");
  }

  if (slideId === "dashboard") {
    return (
      <div>
        <ExplorerScreenTitle eyebrow="Personal workspace" title="Good afternoon, Priya" action="Start check-in" onAction={() => { setCheckins((c) => ({ ...c, evening: true })); setNotice("Evening reflection marked complete."); }} secondary="Refresh" onSecondary={() => setNotice("Dashboard refreshed.")} />
        {notice && <ExplorerNotice text={notice} />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ExplorerMiniStat label="Today" value={`${Number(checkins.morning) + Number(checkins.evening)} / 2`} helper="scheduled check-ins" />
          <ExplorerMiniStat label="Assessments" value="3" helper="last updated 4d ago" />
          <ExplorerMiniStat label="Clinician" value="Connected" helper="Dr. Mehta" />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.18fr_.82fr]">
          <ExplorerCard className="p-4" highlight>
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Today</p><span className="text-[9px] text-slate-400">Wednesday · 19 Aug</span></div>
            <div className="mt-3 space-y-2">
              {[{key:"morning",label:"Mood check-in",time:"08:00"},{key:"evening",label:"Evening reflection",time:"20:00"}].map((item) => {
                const done = checkins[item.key as keyof typeof checkins];
                return <button key={item.key} type="button" onClick={() => setCheckins((c) => ({...c,[item.key]:!done}))} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100">
                  <div><p className="text-[11px] font-medium text-slate-800">{item.label}</p><p className="text-[9px] text-slate-400">{item.time}</p></div>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${done ? "bg-cyan-50 text-cyan-700" : "bg-cyan-50 text-cyan-700"}`}>{done ? "Done" : "Open"}</span>
                </button>;
              })}
            </div>
          </ExplorerCard>
          <div className="space-y-3">
            <ExplorerCard className="p-4">
              <p className="text-xs font-semibold text-slate-900">Your clinician</p>
              <button type="button" onClick={() => setNotice("Clinician profile opened.")} className="mt-3 flex w-full items-center gap-3 rounded-xl bg-cyan-50 p-3 text-left transition hover:bg-cyan-100/70">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-cyan-800 shadow-sm"><Stethoscope className="h-4 w-4" /></div>
                <div><p className="text-[11px] font-semibold text-slate-800">Dr. A. Mehta</p><p className="text-[9px] text-slate-500">Connected clinician</p></div>
              </button>
            </ExplorerCard>
            <ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">Quick actions</p><div className="mt-3 grid grid-cols-2 gap-2">{["Assessment","Message","Progress","Privacy"].map((x)=><button key={x} onClick={()=>setNotice(`${x} opened.`)} className="rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-semibold text-slate-600 hover:bg-slate-50">{x}</button>)}</div></ExplorerCard>
          </div>
        </div>
      </div>
    );
  }

  if (slideId === "ai") {
    return <div><ExplorerScreenTitle eyebrow="AI Guide" title="Luna" secondary="New conversation" onSecondary={()=>{setAiMessages([{side:"ai",text:"What would you like to understand better today?"}]);setNotice("Started a fresh conversation.");}} />{notice&&<ExplorerNotice text={notice}/>}<ExplorerCard className="overflow-hidden" highlight>
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[10px] font-medium text-slate-500">Private reflection space · not shared with clinicians</p></div>
      <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">{aiMessages.map((m,i)=><div key={i} className={`${m.side==="user"?"ml-auto rounded-tr-md bg-cyan-700 text-white":"rounded-tl-md bg-slate-100 text-slate-700"} max-w-[82%] rounded-2xl px-3 py-2.5 text-[11px] leading-5`}>{m.text}</div>)}</div>
      <div className="border-t border-slate-200 p-3"><div className="flex gap-2"><input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendAi()}} className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] outline-none focus:border-cyan-400" placeholder="Ask Luna something..."/><button onClick={sendAi} className="rounded-xl bg-slate-950 px-4 text-[10px] font-semibold text-white">Send</button></div></div>
    </ExplorerCard></div>;
  }

  if (slideId === "assessments") {
    const measures=["Perceived Stress Scale","General Self-Efficacy Scale","WHO-5 Well-Being","Sleep Quality Check"];
    return <div><ExplorerScreenTitle eyebrow="Self-assessments" title="Assessment library" action="Browse all" onAction={()=>setNotice("Assessment library opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid gap-3 sm:grid-cols-2">{measures.map((name,index)=><ExplorerCard key={name} className="p-4" highlight={assessmentStarted===name||index===0}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Short structured assessment for personal reflection.</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500">{[10,10,5,8][index]} items</span></div><button onClick={()=>{setAssessmentStarted(name);setNotice(`${name} started.`)}} className="mt-3 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600 hover:bg-slate-50">{assessmentStarted===name?"Continue":"Start"}</button></ExplorerCard>)}</div></div>;
  }

  if (slideId === "monitoring") {
    return <div><ExplorerScreenTitle eyebrow="Daily monitoring" title="This week" action="New check-in" onAction={()=>{setCheckins(c=>({...c,evening:!c.evening}));setNotice("Check-in opened.")}} secondary="Customise" onSecondary={()=>setNotice("Monitoring schedule editor opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<ExplorerCard className="p-4" highlight><div className="flex h-40 items-end gap-2">{[46,70,54,82,65,76,61].map((height,index)=><button key={index} onClick={()=>setNotice(`${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index]}: ${height/10} average mood.`)} className="group flex flex-1 flex-col items-center justify-end"><div className="w-full max-w-8 rounded-t-lg bg-cyan-200 transition group-hover:bg-cyan-300" style={{height:`${height}px`}}/><span className="mt-2 text-[8px] text-slate-400">{["M","T","W","T","F","S","S"][index]}</span></button>)}</div><div className="mt-3 grid grid-cols-3 gap-2"><ExplorerMiniStat label="Check-ins" value="11"/><ExplorerMiniStat label="Completed" value="91%"/><ExplorerMiniStat label="Next" value="20:00"/></div></ExplorerCard></div>;
  }

  if (slideId === "regulation") {
    const list=[{key:"grounding",title:"2-minute grounding",meta:"5 of 7 days"},{key:"winddown",title:"Evening wind-down",meta:"4 of 7 days"},{key:"rehearsal",title:"Presentation rehearsal",meta:"2 of 3 sessions"}] as const;
    return <div><ExplorerScreenTitle eyebrow="Self-regulation" title="Current routines" action="Add routine" onAction={()=>setNotice("Routine builder opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="space-y-3">{list.map((item,index)=>{const done=routines[item.key];return <ExplorerCard key={item.key} className="p-4" highlight={index===0}><div className="flex items-center justify-between gap-3"><button onClick={()=>setRoutines(c=>({...c,[item.key]:!done}))} className="flex items-center gap-3 text-left"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${done?"bg-cyan-100 text-cyan-700":"bg-slate-100 text-slate-400"}`}>{done?<Check className="h-3.5 w-3.5"/>:index+1}</span><div><p className="text-xs font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-[10px] text-slate-500">{item.meta}</p></div></button><ExplorerToggle enabled={done} onToggle={()=>setRoutines(c=>({...c,[item.key]:!done}))}/></div></ExplorerCard>})}</div></div>;
  }

  if (slideId === "progress") {
    const heights=progressRange==="7d"?[58,64,61,70,73,79,82]:progressRange==="30d"?[48,52,49,61,65,72,76,82]:[41,45,52,55,63,69,77,84];
    return <div><ExplorerScreenTitle eyebrow="Progress" title="Your trends"/><div className="mb-3 flex gap-2">{(["7d","30d","90d"] as const).map(r=><button key={r} onClick={()=>setProgressRange(r)} className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold ${progressRange===r?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{r}</button>)}</div><ExplorerCard className="p-4" highlight><div className="flex h-36 items-end gap-2 rounded-xl bg-slate-50 p-4">{heights.map((h,i)=><div key={i} className="flex-1 rounded-t-md bg-cyan-300" style={{height:`${h}px`}}/>)}</div><div className="mt-3 grid grid-cols-3 gap-2"><ExplorerMiniStat label="Well-being" value="+12%"/><ExplorerMiniStat label="Routine" value="76%"/><ExplorerMiniStat label="Check-ins" value="23"/></div></ExplorerCard></div>;
  }

  if (slideId === "wearables") {
    const devices=[['apple','Apple Health'],['fitbit','Fitbit'],['garmin','Garmin'],['health','Google Health Connect']] as const;
    return <div><ExplorerScreenTitle eyebrow="Wearables" title="Connected sources"/><div className="grid gap-3 sm:grid-cols-2">{devices.map(([key,name],index)=>{const enabled=wearables[key];return <ExplorerCard key={key} className="p-4" highlight={index===0}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[10px] text-slate-500">{enabled?"Connected · syncing":"Not connected"}</p></div><ExplorerToggle enabled={enabled} onToggle={()=>setWearables(c=>({...c,[key]:!enabled}))}/></div></ExplorerCard>})}</div></div>;
  }

  if (slideId === "appointments") {
    return <div><ExplorerScreenTitle eyebrow="Appointments" title="August 2026" action="Request appointment" onAction={()=>setNotice(`Request prepared for ${selectedDay} August.`)}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]"><ExplorerCard className="p-4" highlight><div className="grid grid-cols-7 gap-1 text-center text-[9px] text-slate-400">{["M","T","W","T","F","S","S"].map((day,index)=><span key={`${day}-${index}`}>{day}</span>)}{Array.from({length:31}).map((_,index)=><button key={index} onClick={()=>setSelectedDay(index+1)} className={`rounded-lg py-2 text-[9px] transition ${selectedDay===index+1?"bg-cyan-600 font-semibold text-white":"bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{index+1}</button>)}</div></ExplorerCard><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">{selectedDay} August</p><div className="mt-3 rounded-xl bg-cyan-50 p-3"><p className="text-[11px] font-semibold text-slate-800">Available request</p><p className="mt-1 text-[9px] text-slate-500">10:00–10:50 AM</p><button onClick={()=>setNotice(`10:00 slot selected for ${selectedDay} August.`)} className="mt-3 rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-semibold text-cyan-700 shadow-sm">Choose</button></div></ExplorerCard></div></div>;
  }

  if (slideId === "messages") {
    function send(){const text=message.trim();if(!text)return;setMessages(c=>[...c,{side:"self",text}]);setMessage("");}
    return <div><ExplorerScreenTitle eyebrow="Messages" title="Dr. A. Mehta"/><ExplorerCard className="overflow-hidden" highlight><div className="max-h-[360px] space-y-3 overflow-y-auto p-4">{messages.map((m,i)=><div key={i} className={`${m.side==="self"?"ml-auto rounded-tr-md bg-cyan-700 text-white":"rounded-tl-md bg-slate-100 text-slate-700"} max-w-[72%] rounded-2xl px-3 py-2.5 text-[10px] leading-4`}>{m.text}</div>)}</div><div className="flex gap-2 border-t border-slate-200 p-3"><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send()}} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] outline-none focus:border-cyan-400" placeholder="Write a message..."/><button onClick={send} className="rounded-xl bg-slate-950 px-3 text-[10px] font-semibold text-white"><Send className="h-3.5 w-3.5"/></button></div></ExplorerCard></div>;
  }

  const perms=[['assessments','Assessments'],['monitoring','Daily monitoring'],['progress','Progress'],['wearables','Wearables'],['regulation','Self-regulation']] as const;
  return <div><ExplorerScreenTitle eyebrow="Privacy & Sharing" title="What your clinician can see" secondary="Reset" onSecondary={()=>setSharing({assessments:true,monitoring:false,progress:true,wearables:false,regulation:true})}/><ExplorerCard className="p-4" highlight><div className="space-y-2.5">{perms.map(([key,label])=>{const enabled=sharing[key];return <div key={key} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><button onClick={()=>setSharing(c=>({...c,[key]:!enabled}))} className="text-left"><p className="text-[11px] font-semibold text-slate-800">{label}</p><p className="mt-0.5 text-[9px] text-slate-400">Separate permission · {enabled?"shared":"private"}</p></button><ExplorerToggle enabled={enabled} onToggle={()=>setSharing(c=>({...c,[key]:!enabled}))}/></div>})}</div></ExplorerCard></div>;
}

function ExplorerResearchCore({ slideId }: { slideId: string }) {
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [selectedStep, setSelectedStep] = useState("Measures");
  const [studyFilter, setStudyFilter] = useState<"All" | "Active" | "Draft">("All");
  const [selectedStudy, setSelectedStudy] = useState("Sleep & Attention");
  const [builderMeasures, setBuilderMeasures] = useState({ pss: true, image: true, rt: false });
  const [builderTitle, setBuilderTitle] = useState("Sleep & Attention");
  const [questionnaireCategory, setQuestionnaireCategory] = useState("All");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState("General Self-Efficacy Scale");
  const [customItem, setCustomItem] = useState("Image choice");
  const [customOption, setCustomOption] = useState("A");
  const [scheduleEnabled, setScheduleEnabled] = useState({ morning: true, afternoon: true, evening: true });
  const [selectedParticipant, setSelectedParticipant] = useState("PL-1042");
  const [followupActive, setFollowupActive] = useState({ baseline: true, day7: true, day30: false });
  const [dataTab, setDataTab] = useState<"Overview" | "Responses" | "Uploads">("Overview");
  const [exportDataset, setExportDataset] = useState("Analysis wide");
  const [exportFormat, setExportFormat] = useState("XLSX");
  const [includeCodebook, setIncludeCodebook] = useState(true);

  const studies=[
    {name:"Sleep & Attention",status:"Active",people:42,progress:74},
    {name:"Social Cognition Pilot",status:"Active",people:31,progress:65},
    {name:"EMA Mood Study",status:"Draft",people:0,progress:46},
    {name:"Hazard Awareness",status:"Active",people:55,progress:82},
  ].filter(s=>studyFilter==="All"||s.status===studyFilter);

  if (slideId === "studies") {
    return <div><ExplorerScreenTitle eyebrow="Research workspace" title="Studies" action="New study" onAction={()=>setNotice("A new draft study was created.")} secondary="Refresh" onSecondary={()=>setNotice("Study list refreshed.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><ExplorerMiniStat label="Active studies" value="4" helper="2 collecting today"/><ExplorerMiniStat label="Participants" value="128" helper="across live studies"/><ExplorerMiniStat label="Due today" value="7" helper="follow-ups + EMA"/></div><div className="my-3 flex flex-wrap gap-2">{(["All","Active","Draft"] as const).map(f=><button key={f} onClick={()=>setStudyFilter(f)} className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold ${studyFilter===f?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{f}</button>)}</div><div className="grid gap-3 sm:grid-cols-2">{studies.map((study,index)=><button key={study.name} onClick={()=>setSelectedStudy(study.name)} className="text-left"><ExplorerCard className="p-4" highlight={selectedStudy===study.name}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{study.name}</p><p className="mt-1 text-[9px] text-slate-400">{study.people} participants · updated {index+1}h ago</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${study.status==="Active"?"bg-cyan-50 text-cyan-700":"bg-cyan-50 text-cyan-700"}`}>{study.status}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600" style={{width:`${study.progress}%`}}/></div></ExplorerCard></button>)}</div></div>;
  }

  if (slideId === "study-builder") {
    const steps=["Study info","Consent","Measures","Ambulatory","Follow-ups","Launch"];
    const measureRows=[['pss','Perceived Stress Scale'],['image','Custom Image Choice'],['rt','Reaction-time task']] as const;
    return <div><ExplorerScreenTitle eyebrow="Study Builder" title={builderTitle} action="Save draft" onAction={()=>setNotice("Draft saved.")} secondary="Preview participant flow" onSecondary={()=>setNotice("Participant preview opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[.7fr_1.3fr]"><ExplorerCard className="p-3"><div className="space-y-1.5">{steps.map((step,index)=><button key={step} onClick={()=>setSelectedStep(step)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold ${selectedStep===step?"bg-cyan-50 text-cyan-800":"text-slate-600 hover:bg-slate-50"}`}><span>{index+1}. {step}</span><ChevronRight className="h-3 w-3"/></button>)}</div></ExplorerCard><ExplorerCard className="p-4" highlight><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800">{selectedStep}</p><h4 className="mt-1 text-sm font-semibold text-slate-900">Configure {selectedStep.toLowerCase()}</h4>{selectedStep==="Study info"?<div className="mt-4 space-y-3"><label className="block text-[9px] font-semibold text-slate-500">Study title<input value={builderTitle} onChange={e=>setBuilderTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] outline-none focus:border-cyan-400"/></label><label className="block text-[9px] font-semibold text-slate-500">Short description<textarea className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-[10px] outline-none" defaultValue="Study attention, sleep and daily cognitive performance."/></label></div>:selectedStep==="Measures"?<div className="mt-4 space-y-2">{measureRows.map(([key,name])=>{const enabled=builderMeasures[key];return <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-medium text-slate-700">{name}</p><p className="mt-0.5 text-[8px] text-slate-400">Baseline measure</p></div><ExplorerToggle enabled={enabled} onToggle={()=>setBuilderMeasures(c=>({...c,[key]:!enabled}))}/></div>})}<button onClick={()=>setNotice("Measure picker opened.")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-[9px] font-semibold text-slate-500"><Plus className="h-3 w-3"/> Add measure</button></div>:<div className="mt-4 space-y-3"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[10px] text-slate-600">Interactive {selectedStep.toLowerCase()} settings would appear here. Try the controls below.</div><div className="flex gap-2"><button onClick={()=>setNotice(`${selectedStep} settings updated.`)} className="rounded-lg bg-slate-950 px-3 py-2 text-[9px] font-semibold text-white">Configure</button><button onClick={()=>setNotice(`${selectedStep} preview opened.`)} className="rounded-lg border border-slate-200 px-3 py-2 text-[9px] font-semibold text-slate-600">Preview</button></div></div>}</ExplorerCard></div></div>;
  }

  if (slideId === "questionnaires") {
    const qs=[{name:"General Self-Efficacy Scale",cat:"Self-efficacy",items:10},{name:"WHO-5 Well-Being",cat:"Well-being",items:5},{name:"Perceived Stress Scale",cat:"Stress",items:10},{name:"UCLA Loneliness Scale",cat:"Social",items:20}].filter(item=>(questionnaireCategory==="All"||item.cat===questionnaireCategory)&&item.name.toLowerCase().includes(query.toLowerCase()));
    return <div><ExplorerScreenTitle eyebrow="Questionnaire Library" title="Measures" action="New custom questionnaire" onAction={()=>setNotice("Custom questionnaire builder opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="mb-3 flex flex-wrap gap-2"><div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><Search className="h-3.5 w-3.5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="flex-1 text-[10px] outline-none" placeholder="Search questionnaires..."/></div>{["All","Self-efficacy","Well-being","Stress","Social"].map(c=><button key={c} onClick={()=>setQuestionnaireCategory(c)} className={`rounded-xl px-3 py-2 text-[9px] font-semibold ${questionnaireCategory===c?"bg-cyan-50 text-cyan-800":"border border-slate-200 bg-white text-slate-500"}`}>{c}</button>)}</div><div className="grid gap-3 sm:grid-cols-2">{qs.map((q,index)=><ExplorerCard key={q.name} className="p-4" highlight={selectedQuestionnaire===q.name||index===0}><button onClick={()=>setSelectedQuestionnaire(q.name)} className="w-full text-left"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{q.name}</p><p className="mt-1 text-[9px] text-slate-500">{q.cat} · {q.items} items · resources available</p></div><MoreHorizontal className="h-4 w-4 text-slate-300"/></div></button><div className="mt-3 flex gap-2"><button onClick={()=>{setSelectedQuestionnaire(q.name);setNotice(`${q.name} detail opened.`)}} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] font-semibold text-slate-600">Open</button><button onClick={()=>setNotice(`${q.name} added to Sleep & Attention.`)} className="rounded-lg bg-cyan-700 px-2 py-1.5 text-[8px] font-semibold text-white">Use in study</button></div></ExplorerCard>)}</div></div>;
  }

  if (slideId === "custom-questionnaires") {
    const types=["Intro text","Single choice","Multiple choice","Image choice","Slider","Free text","Matrix"];
    return <div><ExplorerScreenTitle eyebrow="Custom Questionnaire" title="Image preference task" action="Preview" onAction={()=>setNotice("Participant preview opened.")} secondary="Save" onSecondary={()=>setNotice("Custom questionnaire saved.")}/>{notice&&<ExplorerNotice text={notice}/>}<ExplorerCard className="p-4" highlight><div className="grid gap-3 lg:grid-cols-[.72fr_1.28fr]"><div><p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Items</p><div className="space-y-2">{types.map(item=><button key={item} onClick={()=>setCustomItem(item)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[10px] font-medium ${customItem===item?"border-cyan-300 bg-cyan-50 text-cyan-800":"border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><span>{item}</span><ChevronRight className="h-3 w-3"/></button>)}</div></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-cyan-800">Live preview</p><p className="mt-1 text-[11px] font-semibold text-slate-800">{customItem}</p></div><span className="rounded-full bg-white px-2 py-1 text-[8px] text-slate-500">Required</span></div>{customItem==="Image choice"?<><p className="mt-4 text-[10px] font-semibold text-slate-800">Which image do you prefer?</p><div className="mt-3 grid grid-cols-2 gap-2">{['A','B'].map(opt=><button key={opt} onClick={()=>setCustomOption(opt)} className={`rounded-xl border bg-white p-3 text-left ${customOption===opt?"border-cyan-400 ring-2 ring-cyan-100":"border-slate-200"}`}><div className={`h-24 rounded-lg ${opt==='A'?"bg-gradient-to-br from-cyan-100 to-slate-100":"bg-gradient-to-br from-cyan-100 to-slate-100"}`}/><p className="mt-2 text-[9px] font-medium text-slate-600">Option {opt}</p></button>)}</div></>:<div className="mt-4 space-y-3"><input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px]" defaultValue="Edit the item prompt here..."/><div className="h-24 rounded-xl border border-dashed border-slate-300 bg-white"/></div>}</div></div></ExplorerCard></div>;
  }

  if (slideId === "ambulatory") {
    const rows=[['morning','09:00','Morning'],['afternoon','14:00','Afternoon'],['evening','20:00','Evening']] as const;
    return <div><ExplorerScreenTitle eyebrow="Ambulatory Assessment" title="Daily emotion protocol" action="Add check-in" onAction={()=>setNotice("A new schedule editor opened.")} secondary="Preview day" onSecondary={()=>setNotice("Participant day preview opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[1.05fr_.95fr]"><ExplorerCard className="p-4" highlight><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Schedules</p><span className="text-[9px] text-slate-400">3 configured</span></div><div className="mt-3 space-y-2">{rows.map(([key,time,label])=>{const enabled=scheduleEnabled[key];return <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">{time} · {label}</p><p className="mt-0.5 text-[8px] text-slate-400">Fixed time · email reminder</p></div><ExplorerToggle enabled={enabled} onToggle={()=>setScheduleEnabled(c=>({...c,[key]:!enabled}))}/></div>})}</div></ExplorerCard><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">Questionnaire flow</p><div className="mt-3 space-y-2">{["Mood rating","Stress slider","Current context","If stress ≥ 7 → follow-up"].map((item,index)=><button key={item} onClick={()=>setNotice(`${item} selected in the protocol.`)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-[10px] text-slate-600 hover:bg-slate-50"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-50 text-[8px] font-semibold text-cyan-700">{index+1}</span>{item}</button>)}</div></ExplorerCard></div></div>;
  }

  if (slideId === "participants") {
    const rows=[["PL-1042","Active","Complete","Due","2h ago"],["PL-1043","Active","Complete","Complete","1d ago"],["PL-1044","Invited","Pending","—","3d ago"],["PL-1045","Active","Complete","Due","5h ago"]];
    const selected=rows.find(r=>r[0]===selectedParticipant)!;
    return <div><ExplorerScreenTitle eyebrow="Participants" title="Study participants" action="Create participant link" onAction={()=>setNotice("A TEST participant link was generated.")} secondary="Refresh" onSecondary={()=>setNotice("Participant table refreshed.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[1.35fr_.65fr]"><ExplorerCard className="overflow-hidden" highlight><div className="grid grid-cols-5 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400"><span>ID</span><span>Status</span><span>Baseline</span><span>Follow-up</span><span>Last activity</span></div>{rows.map(row=><button key={row[0]} onClick={()=>setSelectedParticipant(row[0])} className={`grid w-full grid-cols-5 border-t border-slate-200 px-4 py-3 text-left text-[9px] ${selectedParticipant===row[0]?"bg-cyan-50 text-cyan-900":"text-slate-600 hover:bg-slate-50"}`}>{row.map((cell, cellIndex)=><span key={`${row[0]}-${cellIndex}-${cell}`}>{cell}</span>)}</button>)}</ExplorerCard><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">{selected[0]}</p><p className="mt-1 text-[9px] text-slate-400">Participant detail</p><div className="mt-3 space-y-2"><ExplorerMiniStat label="Status" value={selected[1]}/><button onClick={()=>setNotice("Participant response summary opened.")} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-semibold text-slate-600">View responses</button><button onClick={()=>setNotice("Uploaded file preview opened.")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-semibold text-slate-600"><Eye className="h-3 w-3"/> View uploaded file</button></div></ExplorerCard></div></div>;
  }

  if (slideId === "followups") {
    const waves=[['baseline','Baseline','Complete','128 participants'],['day7','Day 7','Sending','93 invited'],['day30','Day 30','Scheduled','Starts 18 Sep']] as const;
    return <div><ExplorerScreenTitle eyebrow="Follow-up Manager" title="Longitudinal waves" action="Add wave" onAction={()=>setNotice("Follow-up wave editor opened.")} secondary="Send due invitations" onSecondary={()=>setNotice("Due invitations queued.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="space-y-3">{waves.map(([key,name,status,helper],index)=>{const active=followupActive[key];return <ExplorerCard key={key} className="p-4" highlight={index===1}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[9px] text-slate-400">{helper}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500">{status}</span><ExplorerToggle enabled={active} onToggle={()=>setFollowupActive(c=>({...c,[key]:!active}))}/><button onClick={()=>setNotice(`${name} settings opened.`)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] font-semibold text-slate-600">Manage</button></div></div></ExplorerCard>})}</div></div>;
  }

  if (slideId === "data") {
    return <div><ExplorerScreenTitle eyebrow="Research Data" title="Sleep & Attention" action="Refresh data" onAction={()=>setNotice("Data bundle refreshed.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="mb-3 flex gap-2">{(["Overview","Responses","Uploads"] as const).map(tab=><button key={tab} onClick={()=>setDataTab(tab)} className={`rounded-xl px-3 py-2 text-[9px] font-semibold ${dataTab===tab?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{tab}</button>)}</div>{dataTab==="Overview"?<div className="grid gap-3 sm:grid-cols-3"><ExplorerMiniStat label="Participants" value="128" helper="112 completed baseline"/><ExplorerMiniStat label="Responses" value="1,842" helper="questionnaire items"/><ExplorerMiniStat label="Uploads" value="37" helper="participant files"/></div>:dataTab==="Uploads"?<ExplorerCard className="overflow-hidden" highlight><div className="grid grid-cols-4 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold text-slate-400"><span>Participant</span><span>File</span><span>Type</span><span>Action</span></div>{[["PL-1042","drawing.png","PNG"],["PL-1043","voice-note.m4a","Audio"],["PL-1045","task-photo.jpg","JPG"]].map(r=><div key={r[1]} className="grid grid-cols-4 border-t border-slate-200 px-4 py-3 text-[9px] text-slate-600"><span>{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span><button onClick={()=>setNotice(`${r[1]} opened.`)} className="text-left font-semibold text-cyan-700">View</button></div>)}</ExplorerCard>:<ExplorerCard className="overflow-hidden" highlight><div className="grid grid-cols-4 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold text-slate-400"><span>Participant</span><span>Measure</span><span>Phase</span><span>Complete</span></div>{[["PL-1042","PSS-10","Baseline","Yes"],["PL-1043","WHO-5","Day 7","Yes"],["PL-1044","Image task","Baseline","Pending"]].map(r=><button key={r.join('-')} onClick={()=>setNotice(`${r[0]} ${r[1]} response opened.`)} className="grid w-full grid-cols-4 border-t border-slate-200 px-4 py-3 text-left text-[9px] text-slate-600 hover:bg-slate-50">{r.map((c, cellIndex)=><span key={`${r[0]}-${cellIndex}-${c}`}>{c}</span>)}</button>)}</ExplorerCard>}</div>;
  }

  return <div><ExplorerScreenTitle eyebrow="Export Data" title="Prepare analysis dataset" action="Export now" onAction={()=>setNotice(`${exportFormat} export prepared for ${exportDataset}.`)} secondary="Reset" onSecondary={()=>{setExportDataset("Analysis wide");setExportFormat("XLSX");setIncludeCodebook(true)}}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[.9fr_1.1fr]"><ExplorerCard className="p-4" highlight><p className="text-xs font-semibold text-slate-900">Dataset</p><div className="mt-3 space-y-2">{["Analysis wide","Participant summary","Questionnaire responses","Ambulatory responses"].map(x=><button key={x} onClick={()=>setExportDataset(x)} className={`w-full rounded-xl border px-3 py-2.5 text-left text-[10px] font-medium ${exportDataset===x?"border-cyan-300 bg-cyan-50 text-cyan-800":"border-slate-200 text-slate-600"}`}>{x}</button>)}</div><p className="mt-4 text-xs font-semibold text-slate-900">Format</p><div className="mt-2 flex gap-2">{["XLSX","CSV","JSON"].map(x=><button key={x} onClick={()=>setExportFormat(x)} className={`rounded-lg px-3 py-2 text-[9px] font-semibold ${exportFormat===x?"bg-slate-950 text-white":"border border-slate-200 text-slate-500"}`}>{x}</button>)}</div><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">Include codebook</p><p className="text-[8px] text-slate-400">Recommended for analysis handoff</p></div><ExplorerToggle enabled={includeCodebook} onToggle={()=>setIncludeCodebook(v=>!v)}/></div></ExplorerCard><ExplorerCard className="p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Export preview</p><span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-semibold text-cyan-700">{exportFormat}</span></div><div className="mt-3 rounded-xl bg-slate-950 p-3 font-mono text-[8px] leading-4 text-cyan-100">participant_id, phase, PSS_1, PSS_2, image_choice<br/>PL-1042, baseline, 2, 3, option_a<br/>PL-1043, baseline, 4, 2, option_b</div><button onClick={()=>setNotice(`${exportFormat} download prepared.`)} className="mt-3 flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-[9px] font-semibold text-white"><FileDown className="h-3 w-3"/> Export {exportFormat}</button></ExplorerCard></div></div>;
}

function ExplorerClinicalCore({ slideId }: { slideId: string }) {
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState("Aarav S.");
  const [assigned, setAssigned] = useState<string[]>(["Perceived Stress Scale"]);
  const [monitorRange, setMonitorRange] = useState<"7d" | "30d">("7d");
  const [progressMetric, setProgressMetric] = useState<"Well-being" | "Stress">("Well-being");
  const [pathwayDone, setPathwayDone] = useState([true, true, false, false]);

  // Professional Notes state — mirrors ClinicalNotesWorkspace locally.
  const clinicalEditorRef = useRef<HTMLDivElement | null>(null);
  const [clinicalFolders, setClinicalFolders] = useState([
    { id: "sessions", name: "Sessions" },
    { id: "formulation", name: "Formulation" },
    { id: "reviews", name: "Reviews" },
  ]);
  const [clinicalNotes, setClinicalNotes] = useState([
    {
      id: "note-1",
      title: "Presentation anxiety · follow-up",
      content:
        "<p>Client reported improved confidence after using the grounding routine before the presentation.</p><p>Reviewed anticipatory thoughts and agreed to repeat the routine before the next high-pressure task.</p>",
      text:
        "Client reported improved confidence after using the grounding routine before the presentation. Reviewed anticipatory thoughts and agreed to repeat the routine before the next high-pressure task.",
      folderId: "sessions",
      type: "session",
      pinned: true,
      updated: "Today, 14:20",
      session: "2026-08-19T10:30",
    },
    {
      id: "note-2",
      title: "Working formulation",
      content:
        "<p>Current formulation emphasises performance-related threat appraisal, avoidance and post-event rumination.</p>",
      text:
        "Current formulation emphasises performance-related threat appraisal, avoidance and post-event rumination.",
      folderId: "formulation",
      type: "formulation",
      pinned: false,
      updated: "18 Aug",
      session: "2026-08-18T16:00",
    },
    {
      id: "note-3",
      title: "Four-week review",
      content:
        "<p>Monitoring adherence remains high. Sleep regularity has improved and self-rated stress has reduced across the last two weeks.</p>",
      text:
        "Monitoring adherence remains high. Sleep regularity has improved and self-rated stress has reduced across the last two weeks.",
      folderId: "reviews",
      type: "review",
      pinned: false,
      updated: "14 Aug",
      session: "2026-08-14T09:00",
    },
    {
      id: "note-4",
      title: "Initial session",
      content:
        "<p>Established goals for monitoring and discussed privacy boundaries inside PsyLattice.</p>",
      text:
        "Established goals for monitoring and discussed privacy boundaries inside PsyLattice.",
      folderId: null,
      type: "session",
      pinned: false,
      updated: "04 Aug",
      session: "2026-08-04T11:00",
    },
  ].map((note) => ({ ...note, folderId: note.folderId ?? null })));
  const [clinicalSelectedFolder, setClinicalSelectedFolder] = useState("all");
  const [clinicalSelectedNoteId, setClinicalSelectedNoteId] = useState("note-1");
  const [clinicalNoteSearch, setClinicalNoteSearch] = useState("");
  const [clinicalNewFolderName, setClinicalNewFolderName] = useState("");
  const [clinicalNoteTitle, setClinicalNoteTitle] = useState("Presentation anxiety · follow-up");
  const [clinicalNoteFolderId, setClinicalNoteFolderId] = useState<string | null>("sessions");
  const [clinicalNoteType, setClinicalNoteType] = useState("session");
  const [clinicalSessionAt, setClinicalSessionAt] = useState("2026-08-19T10:30");
  const [clinicalPinned, setClinicalPinned] = useState(true);
  const [clinicalEditorHtml, setClinicalEditorHtml] = useState(
    "<p>Client reported improved confidence after using the grounding routine before the presentation.</p><p>Reviewed anticipatory thoughts and agreed to repeat the routine before the next high-pressure task.</p>"
  );
  const [clinicalNoteDirty, setClinicalNoteDirty] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState("10:30 Maya R.");

  // Secure Messages state — mirrors PsyLatticeMessagesWorkspace locally.
  const [messageThreadPanelOpen, setMessageThreadPanelOpen] = useState(true);
  const [messageEmailAlerts, setMessageEmailAlerts] = useState(true);
  const [selectedMessageThreadId, setSelectedMessageThreadId] = useState("aarav");
  const [messageDraft, setMessageDraft] = useState("");
  const [messageThreads, setMessageThreads] = useState([
    {
      id: "aarav",
      peer: "Aarav S.",
      unread: 2,
      last: "I completed the evening monitoring yesterday.",
      time: "14:12",
    },
    {
      id: "maya",
      peer: "Maya R.",
      unread: 0,
      last: "Thank you, Friday works for me.",
      time: "11:03",
    },
    {
      id: "nisha",
      peer: "Nisha K.",
      unread: 1,
      last: "Could we review the questionnaire next session?",
      time: "Yesterday",
    },
  ]);
  const [threadMessages, setThreadMessages] = useState<Record<string, Array<{
    id: string;
    body: string;
    isMine: boolean;
    time: string;
    read?: boolean;
  }>>>({
    aarav: [
      { id: "a1", body: "Hi, I wanted to let you know that I used the grounding routine before the presentation.", isMine: false, time: "10:24" },
      { id: "a2", body: "That sounds useful. How did it feel compared with the previous presentation?", isMine: true, time: "10:31", read: true },
      { id: "a3", body: "Much better. I was still nervous, but I did not avoid it.", isMine: false, time: "10:36" },
      { id: "a4", body: "I completed the evening monitoring yesterday.", isMine: false, time: "14:12" },
    ],
    maya: [
      { id: "m1", body: "Would Friday at 10:30 still work for our appointment?", isMine: true, time: "09:48", read: true },
      { id: "m2", body: "Thank you, Friday works for me.", isMine: false, time: "11:03" },
    ],
    nisha: [
      { id: "n1", body: "Could we review the questionnaire next session?", isMine: false, time: "Yesterday" },
    ],
  });

  const [reception, setReception] = useState({ calendar:true, reschedule:true, assessments:false, notes:false, monitoring:false });

  const clients=["Aarav S.","Maya R.","Nisha K.","Rohan D."].filter(n=>n.toLowerCase().includes(query.toLowerCase()));

  const filteredClinicalNotes = clinicalNotes.filter((note) => {
    const inFolder =
      clinicalSelectedFolder === "all" ||
      (clinicalSelectedFolder === "unfiled" && !note.folderId) ||
      note.folderId === clinicalSelectedFolder;
    const q = clinicalNoteSearch.trim().toLowerCase();
    return (
      inFolder &&
      (!q ||
        note.title.toLowerCase().includes(q) ||
        note.text.toLowerCase().includes(q))
    );
  });

  function openClinicalNote(noteId: string) {
    const next = clinicalNotes.find((note) => note.id === noteId);
    if (!next) return;
    setClinicalSelectedNoteId(next.id);
    setClinicalNoteTitle(next.title);
    setClinicalNoteFolderId(next.folderId);
    setClinicalNoteType(next.type);
    setClinicalSessionAt(next.session);
    setClinicalPinned(next.pinned);
    setClinicalEditorHtml(next.content);
    setClinicalNoteDirty(false);
  }

  function createClinicalNote() {
    const id = `note-${Date.now()}`;
    const note = {
      id,
      title: "Untitled note",
      content: "",
      text: "",
      folderId:
        clinicalSelectedFolder !== "all" &&
        clinicalSelectedFolder !== "unfiled"
          ? clinicalSelectedFolder
          : null,
      type: "session",
      pinned: false,
      updated: "Just now",
      session: "2026-08-19T15:00",
    };
    setClinicalNotes((current) => [note, ...current]);
    setClinicalSelectedNoteId(id);
    setClinicalNoteTitle(note.title);
    setClinicalNoteFolderId(note.folderId);
    setClinicalNoteType(note.type);
    setClinicalSessionAt(note.session);
    setClinicalPinned(false);
    setClinicalEditorHtml("");
    setClinicalNoteDirty(true);
  }

  function saveClinicalNote() {
    const textValue =
      clinicalEditorRef.current?.innerText?.trim() ||
      clinicalEditorHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const htmlValue =
      clinicalEditorRef.current?.innerHTML ?? clinicalEditorHtml;

    setClinicalNotes((current) =>
      current.map((item) =>
        item.id === clinicalSelectedNoteId
          ? {
              ...item,
              title: clinicalNoteTitle || "Untitled note",
              content: htmlValue,
              text: textValue,
              folderId: clinicalNoteFolderId,
              type: clinicalNoteType,
              session: clinicalSessionAt,
              pinned: clinicalPinned,
              updated: "Just now",
            }
          : item
      )
    );
    setClinicalEditorHtml(htmlValue);
    setClinicalNoteDirty(false);
    setNotice("Professional note saved.");
  }

  function deleteClinicalNote() {
    const remaining = clinicalNotes.filter(
      (item) => item.id !== clinicalSelectedNoteId
    );
    setClinicalNotes(remaining);
    if (remaining[0]) {
      openClinicalNote(remaining[0].id);
    }
    setNotice("Professional note deleted.");
  }

  function createClinicalFolder() {
    const name = clinicalNewFolderName.trim();
    if (!name) return;
    const id = `folder-${Date.now()}`;
    setClinicalFolders((current) => [...current, { id, name }]);
    setClinicalSelectedFolder(id);
    setClinicalNewFolderName("");
  }

  function clinicalExec(command: string, value?: string) {
    clinicalEditorRef.current?.focus();
    try {
      document.execCommand(command, false, value);
      setClinicalNoteDirty(true);
    } catch {
      setNotice(`${command} formatting applied.`);
    }
  }

  function messageInitials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function sendClinicalMessage() {
    const body = messageDraft.trim();
    if (!body) return;
    const id = `msg-${Date.now()}`;
    setThreadMessages((current) => ({
      ...current,
      [selectedMessageThreadId]: [
        ...(current[selectedMessageThreadId] || []),
        { id, body, isMine: true, time: "Now", read: false },
      ],
    }));
    setMessageThreads((current) =>
      current.map((thread) =>
        thread.id === selectedMessageThreadId
          ? { ...thread, last: body, time: "Now", unread: 0 }
          : thread
      )
    );
    setMessageDraft("");
  }


  if (slideId === "clients") {
    return <div><ExplorerScreenTitle eyebrow="Clinical workspace" title="Clients" action="Invite client" onAction={()=>setNotice("Client invitation form opened.")} secondary="Refresh" onSecondary={()=>setNotice("Client list refreshed.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><ExplorerMiniStat label="Connected" value="18"/><ExplorerMiniStat label="Needs review" value="4"/><ExplorerMiniStat label="Today" value="6 appts"/></div><div className="my-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><Search className="h-3.5 w-3.5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="flex-1 text-[10px] outline-none" placeholder="Search clients..."/><Filter className="h-3.5 w-3.5 text-slate-400"/></div><div className="grid gap-3 sm:grid-cols-2">{clients.map((name,index)=><button key={name} onClick={()=>setSelectedClient(name)} className="text-left"><ExplorerCard className="p-4" highlight={selectedClient===name}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-800"><Users className="h-4 w-4"/></div><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[9px] text-slate-400">Connected · updated {index+1}h ago</p></div></div><ChevronRight className="h-4 w-4 text-slate-300"/></div></ExplorerCard></button>)}</div></div>;
  }

  if (slideId === "client-overview") {
    return <div><ExplorerScreenTitle eyebrow="Client overview" title={selectedClient} action="Message" onAction={()=>setNotice("Secure message composer opened.")} secondary="Appointment" onSecondary={()=>setNotice("Appointment request opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><ExplorerMiniStat label="Assessments" value="4"/><ExplorerMiniStat label="Monitoring" value="Active"/><ExplorerMiniStat label="Next appt" value="Fri 10:00"/></div><div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_.8fr]"><ExplorerCard className="p-4" highlight><p className="text-xs font-semibold text-slate-900">Recent shared activity</p><div className="mt-3 space-y-2">{["Mood check-in completed","PSS-10 shared","Progress permission updated"].map(item=><button key={item} onClick={()=>setNotice(`${item} detail opened.`)} className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left text-[10px] text-slate-600 hover:bg-slate-100">{item}</button>)}</div></ExplorerCard><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">Client permissions</p><div className="mt-3 space-y-2 text-[9px] text-slate-500"><p>✓ Assessments</p><p>✓ Monitoring</p><p>✓ Progress</p><p className="text-slate-300">– AI Guide</p></div><button onClick={()=>setNotice("Permission detail opened.")} className="mt-3 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">View permissions</button></ExplorerCard></div></div>;
  }

  if (slideId === "assessments") {
    const measures=["Perceived Stress Scale","WHO-5 Well-Being","General Self-Efficacy Scale","Sleep Quality Check"];
    return <div><ExplorerScreenTitle eyebrow="Assessments" title={selectedClient} action="Assign measure" onAction={()=>setNotice("Measure picker opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="space-y-3">{measures.map((name,index)=>{const isAssigned=assigned.includes(name);return <ExplorerCard key={name} className="p-4" highlight={index===0}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[9px] text-slate-400">{isAssigned?"Assigned · completed 1 week ago":"Available to assign"}</p></div><div className="flex gap-2"><button onClick={()=>setNotice(`${name} result opened.`)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">Review</button><button onClick={()=>setAssigned(c=>isAssigned?c.filter(x=>x!==name):[...c,name])} className={`rounded-lg px-2.5 py-1.5 text-[8px] font-semibold ${isAssigned?"bg-cyan-50 text-cyan-700":"bg-slate-950 text-white"}`}>{isAssigned?"Assigned":"Assign"}</button></div></div></ExplorerCard>})}</div></div>;
  }

  if (slideId === "monitoring") {
    const values=monitorRange==="7d"?[42,68,55,80,61,73,66]:[35,48,52,60,55,72,64,70,78,68,72,75];
    return <div><ExplorerScreenTitle eyebrow="Monitoring" title="Shared daily data" action="Propose protocol" onAction={()=>setNotice("Protocol proposal builder opened.")} secondary="Request sharing" onSecondary={()=>setNotice("Sharing request opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="mb-3 flex gap-2">{(["7d","30d"] as const).map(r=><button key={r} onClick={()=>setMonitorRange(r)} className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold ${monitorRange===r?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{r}</button>)}</div><ExplorerCard className="p-4" highlight><div className="flex h-40 items-end gap-2 rounded-xl bg-slate-50 p-4">{values.map((height,index)=><button key={index} onClick={()=>setNotice(`Check-in ${index+1}: stress ${(height/15).toFixed(1)}.`)} className="flex-1 rounded-t-md bg-cyan-300 transition hover:bg-cyan-400" style={{height:`${height}px`}}/>)}</div><div className="mt-3 grid grid-cols-3 gap-2"><ExplorerMiniStat label="Check-ins" value="19"/><ExplorerMiniStat label="Completion" value="95%"/><ExplorerMiniStat label="Stress avg" value="4.1"/></div></ExplorerCard></div>;
  }

  if (slideId === "progress") {
    const isWell=progressMetric==="Well-being"; const vals=isWell?[48,50,57,61,66,71]:[82,75,70,64,58,52];
    return <div><ExplorerScreenTitle eyebrow="Progress" title="Longitudinal view"/><div className="mb-3 flex gap-2">{(["Well-being","Stress"] as const).map(x=><button key={x} onClick={()=>setProgressMetric(x)} className={`rounded-xl px-3 py-2 text-[9px] font-semibold ${progressMetric===x?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{x}</button>)}</div><ExplorerCard className="p-4" highlight><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">{progressMetric}</p><span className={`text-[10px] font-semibold ${isWell?"text-cyan-700":"text-cyan-700"}`}>{isWell?"Improving":"Decreasing"}</span></div><div className="mt-4 flex h-36 items-end gap-2 rounded-xl bg-slate-50 p-4">{vals.map((h,i)=><div key={i} className={`flex-1 rounded-t-md ${isWell?"bg-cyan-200":"bg-cyan-200"}`} style={{height:`${h}px`}}/>)}</div></ExplorerCard></div>;
  }

  if (slideId === "care-pathway") {
    const items=["Stabilise sleep routine","Practice pre-presentation grounding","Review monitoring data","Reassess after 4 weeks"];
    return <div><ExplorerScreenTitle eyebrow="Care Pathway" title="Current plan" action="Add step" onAction={()=>setNotice("Care-pathway step editor opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="space-y-3">{items.map((item,index)=>{const done=pathwayDone[index];return <ExplorerCard key={item} className="p-4" highlight={index===1}><button onClick={()=>setPathwayDone(c=>c.map((x,i)=>i===index?!x:x))} className="flex w-full items-center gap-3 text-left"><div className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold ${done?"bg-cyan-700 text-white":"bg-slate-100 text-slate-500"}`}>{done?<Check className="h-3.5 w-3.5"/>:index+1}</div><div className="flex-1"><p className="text-[10px] font-medium text-slate-700">{item}</p><p className="mt-0.5 text-[8px] text-slate-400">{done?"Completed":"Planned"}</p></div></button></ExplorerCard>})}</div></div>;
  }

  if (slideId === "notes") {
    const selectedNote =
      clinicalNotes.find((item) => item.id === clinicalSelectedNoteId) || null;
    const editorWordCount =
      (clinicalEditorRef.current?.innerText || clinicalEditorHtml.replace(/<[^>]*>/g, " "))
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    return (
      <div className="space-y-5">
        {notice && <ExplorerNotice text={notice} />}

        <ExplorerCard className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-950">
              {selectedClient} · Professional Notes
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Private clinician-authored documentation for the selected client.
              Organise notes into folders and edit them with the rich-text workspace below.
            </p>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Client
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {selectedClient}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Record type
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                Private professional notes
              </p>
            </div>

            <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Sharing
              </p>
              <p className="mt-2 text-sm font-semibold text-cyan-950">
                Not shared with client
              </p>
            </div>
          </div>
        </ExplorerCard>

        <div className="grid min-h-[720px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:grid-cols-[230px_300px_minmax(0,1fr)]">
          {/* FOLDERS */}
          <aside className="border-b border-slate-200 bg-slate-50/70 p-4 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Folders</p>
                <p className="mt-1 text-[11px] text-slate-400">{selectedClient}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  document.getElementById("clinical-note-folder")?.focus()
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600"
                title="New folder"
              >
                +
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <button
                type="button"
                onClick={() => setClinicalSelectedFolder("all")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${
                  clinicalSelectedFolder === "all"
                    ? "bg-cyan-50 font-semibold text-cyan-950"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <span>All notes</span>
                <span className="text-xs text-slate-400">{clinicalNotes.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setClinicalSelectedFolder("unfiled")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${
                  clinicalSelectedFolder === "unfiled"
                    ? "bg-cyan-50 font-semibold text-cyan-950"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <span>Unfiled</span>
                <span className="text-xs text-slate-400">
                  {clinicalNotes.filter((note) => !note.folderId).length}
                </span>
              </button>

              {clinicalFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`group flex items-center rounded-xl ${
                    clinicalSelectedFolder === folder.id
                      ? "bg-cyan-50"
                      : "hover:bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setClinicalSelectedFolder(folder.id)}
                    className={`min-w-0 flex-1 px-3 py-2.5 text-left text-sm ${
                      clinicalSelectedFolder === folder.id
                        ? "font-semibold text-cyan-950"
                        : "text-slate-600"
                    }`}
                  >
                    <span className="block truncate">{folder.name}</span>
                  </button>
                  <span className="mr-3 text-[10px] text-slate-400">
                    {clinicalNotes.filter((note) => note.folderId === folder.id).length}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <input
                id="clinical-note-folder"
                value={clinicalNewFolderName}
                onChange={(event) => setClinicalNewFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") createClinicalFolder();
                }}
                placeholder="New folder name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-cyan-700"
              />

              <button
                type="button"
                disabled={!clinicalNewFolderName.trim()}
                onClick={createClinicalFolder}
                className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Create folder
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
              <p className="text-[11px] font-semibold text-cyan-950">
                Private clinician record
              </p>
              <p className="mt-1 text-[10px] leading-4 text-cyan-900/70">
                Professional Notes are clinician-authored and are not exposed through the client sharing controls.
              </p>
            </div>
          </aside>

          {/* NOTE LIST */}
          <section className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-2">
              <input
                value={clinicalNoteSearch}
                onChange={(event) => setClinicalNoteSearch(event.target.value)}
                placeholder="Search notes..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-cyan-700"
              />

              <button
                type="button"
                onClick={createClinicalNote}
                className="shrink-0 rounded-xl bg-cyan-800 px-3 py-2.5 text-xs font-semibold text-white"
              >
                + Note
              </button>
            </div>

            <div className="mt-4 max-h-[650px] space-y-2 overflow-y-auto pr-1">
              {filteredClinicalNotes.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No notes here yet
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Create a note or choose another folder.
                  </p>
                </div>
              ) : (
                filteredClinicalNotes.map((noteItem) => {
                  const folder = clinicalFolders.find(
                    (candidate) => candidate.id === noteItem.folderId
                  );

                  return (
                    <button
                      key={noteItem.id}
                      type="button"
                      onClick={() => openClinicalNote(noteItem.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        noteItem.id === clinicalSelectedNoteId
                          ? "border-cyan-300 bg-cyan-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                          {noteItem.title}
                        </p>
                        {noteItem.pinned && (
                          <span title="Pinned" className="text-xs text-cyan-500">
                            ★
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                        {noteItem.text || "Empty note"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">
                          {noteItem.type === "session"
                            ? "Session note"
                            : noteItem.type === "formulation"
                              ? "Formulation"
                              : "Review"}
                        </span>
                        {folder && (
                          <span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-medium text-cyan-700">
                            {folder.name}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-[9px] text-slate-400">
                        Updated {noteItem.updated}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* EDITOR */}
          <main className="min-w-0">
            {!selectedNote ? (
              <div className="flex min-h-[720px] items-center justify-center p-8">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-lg font-semibold text-cyan-800">
                    N
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-900">
                    Start a professional note
                  </p>
                  <button
                    type="button"
                    onClick={createClinicalNote}
                    className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Create first note
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[720px] flex-col">
                <div className="border-b border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <input
                        value={clinicalNoteTitle}
                        onChange={(event) => {
                          setClinicalNoteTitle(event.target.value);
                          setClinicalNoteDirty(true);
                        }}
                        placeholder="Note title"
                        className="w-full border-0 bg-transparent text-xl font-semibold text-slate-950 outline-none"
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                          value={clinicalNoteFolderId || ""}
                          onChange={(event) => {
                            setClinicalNoteFolderId(event.target.value || null);
                            setClinicalNoteDirty(true);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600"
                        >
                          <option value="">Unfiled</option>
                          {clinicalFolders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={clinicalNoteType}
                          onChange={(event) => {
                            setClinicalNoteType(event.target.value);
                            setClinicalNoteDirty(true);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600"
                        >
                          <option value="session">Session note</option>
                          <option value="formulation">Formulation</option>
                          <option value="review">Review</option>
                        </select>

                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                          Session
                          <input
                            type="datetime-local"
                            value={clinicalSessionAt}
                            onChange={(event) => {
                              setClinicalSessionAt(event.target.value);
                              setClinicalNoteDirty(true);
                            }}
                            className="bg-transparent outline-none"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setClinicalPinned((current) => !current);
                          setClinicalNoteDirty(true);
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                          clinicalPinned
                            ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {clinicalPinned ? "★ Pinned" : "☆ Pin"}
                      </button>

                      <button
                        type="button"
                        onClick={saveClinicalNote}
                        disabled={!clinicalNoteDirty}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {clinicalNoteDirty ? "Save" : "Saved"}
                      </button>

                      <button
                        type="button"
                        onClick={deleteClinicalNote}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                    <span>{clinicalSessionAt.replace("T", " ")}</span>
                    <span>•</span>
                    <span>{editorWordCount} words</span>
                    <span>•</span>
                    <span>{clinicalNoteDirty ? "Unsaved changes" : "Saved"}</span>
                  </div>
                </div>

                {/* RICH TOOLBAR */}
                <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      defaultValue="Arial"
                      onChange={(event) => clinicalExec("fontName", event.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    >
                      {["Arial", "Georgia", "Times New Roman", "Verdana"].map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>

                    <select
                      defaultValue="3"
                      onChange={(event) => clinicalExec("fontSize", event.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    >
                      <option value="2">Small</option>
                      <option value="3">Normal</option>
                      <option value="4">Large</option>
                    </select>

                    <select
                      defaultValue="p"
                      onChange={(event) => clinicalExec("formatBlock", event.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    >
                      <option value="p">Normal</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                      <option value="blockquote">Quote</option>
                    </select>

                    <span className="mx-1 h-6 w-px bg-slate-200" />

                    {[
                      ["B", "bold", "font-black"],
                      ["I", "italic", "italic"],
                      ["U", "underline", "underline"],
                      ["S", "strikeThrough", "line-through"],
                    ].map(([label, command, style]) => (
                      <button
                        key={command}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          clinicalExec(command);
                        }}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${style}`}
                      >
                        {label}
                      </button>
                    ))}

                    <span className="mx-1 h-6 w-px bg-slate-200" />

                    {[
                      ["≡", "justifyLeft"],
                      ["≣", "justifyCenter"],
                      ["≡", "justifyRight"],
                      ["• List", "insertUnorderedList"],
                      ["1. List", "insertOrderedList"],
                      ["←", "outdent"],
                      ["→", "indent"],
                    ].map(([label, command], index) => (
                      <button
                        key={`${command}-${index}`}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          clinicalExec(command);
                        }}
                        className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setNotice("Link tool opened.")}
                      className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Link
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 bg-slate-50/40 p-4 sm:p-6">
                  <div
                    key={clinicalSelectedNoteId}
                    ref={clinicalEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(event) => {
                      setClinicalEditorHtml(event.currentTarget.innerHTML);
                      setClinicalNoteDirty(true);
                    }}
                    dangerouslySetInnerHTML={{ __html: clinicalEditorHtml }}
                    data-placeholder="Start writing your professional note..."
                    className="mx-auto min-h-[560px] max-w-[900px] rounded-2xl border border-slate-200 bg-white px-8 py-9 text-[15px] leading-7 text-slate-800 shadow-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (slideId === "appointments") {
    const appts=["09:00 Aarav S.","10:30 Maya R.","13:00 Nisha K.","16:00 Rohan D."];
    return <div><ExplorerScreenTitle eyebrow="Appointments" title="Today" action="New appointment" onAction={()=>setNotice("New appointment form opened.")} secondary="Calendar" onSecondary={()=>setNotice("Calendar view opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="space-y-2">{appts.map((item)=><button key={item} onClick={()=>setSelectedAppointment(item)} className="block w-full text-left"><ExplorerCard className="flex items-center justify-between p-4" highlight={selectedAppointment===item}><div><span className="text-[10px] font-semibold text-slate-700">{item}</span><p className="mt-1 text-[8px] text-slate-400">50 minute session · Milan time</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500">Confirmed</span><ChevronRight className="h-3.5 w-3.5 text-slate-300"/></div></ExplorerCard></button>)}</div></div>;
  }

  if (slideId === "messages") {
    const selectedThread =
      messageThreads.find((thread) => thread.id === selectedMessageThreadId) ||
      messageThreads[0];
    const activeMessages = threadMessages[selectedThread?.id] || [];
    const unreadTotal = messageThreads.reduce(
      (sum, thread) => sum + thread.unread,
      0
    );

    return (
      <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="bg-gradient-to-r from-cyan-50/70 via-white to-white px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-800">
              Connected care
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Client conversations
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              View all active client conversations in one secure inbox. Select a
              client inside the messaging workspace instead of changing the
              Clinical client-context selector.
            </p>
          </div>
        </section>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/80 via-white to-slate-50/60 px-5 py-4">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm">
                  ✦
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-500" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">
                      Secure Messages
                    </h2>
                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold text-cyan-700">
                      Live
                    </span>
                    {unreadTotal > 0 && (
                      <span className="rounded-full bg-cyan-800 px-2.5 py-1 text-[10px] font-semibold text-white">
                        {unreadTotal} unread
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your secure client inbox for non-urgent clinical communication.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMessageThreadPanelOpen((current) => !current)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {messageThreadPanelOpen ? "⇤ Focus conversation" : "☰ Clients"}
                </button>

                <button
                  type="button"
                  onClick={() => setMessageEmailAlerts((current) => !current)}
                  className={`rounded-xl border px-3 py-2 text-[10px] font-semibold transition ${
                    messageEmailAlerts
                      ? "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {messageEmailAlerts ? "✉ Email alerts on" : "✉ Email alerts off"}
                </button>

                <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-[10px] font-medium text-cyan-800">
                  Not for urgent or emergency support
                </div>
              </div>
            </div>
          </div>

          <div
            className={`grid min-h-[680px] ${
              messageThreadPanelOpen
                ? "lg:grid-cols-[290px_minmax(0,1fr)]"
                : "grid-cols-1"
            }`}
          >
            {messageThreadPanelOpen && (
              <aside className="border-b border-slate-100 bg-slate-50/55 lg:border-b-0 lg:border-r">
                <div className="border-b border-slate-100 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Client conversations
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose a connected client to open their secure conversation.
                  </p>
                </div>

                <div className="max-h-[590px] space-y-2 overflow-y-auto p-3">
                  {messageThreads.map((thread) => {
                    const selected = thread.id === selectedMessageThreadId;
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => {
                          setSelectedMessageThreadId(thread.id);
                          setMessageThreads((current) =>
                            current.map((item) =>
                              item.id === thread.id
                                ? { ...item, unread: 0 }
                                : item
                            )
                          );
                        }}
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-cyan-200 bg-cyan-50 shadow-sm"
                            : "border-transparent bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                            {messageInitials(thread.peer)}
                            {thread.unread > 0 && (
                              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-cyan-700 px-1 text-[9px] font-semibold text-white">
                                {thread.unread}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {thread.peer}
                              </p>
                              <span className="shrink-0 text-[9px] text-slate-400">
                                {thread.time}
                              </span>
                            </div>
                            <p
                              className={`mt-1 truncate text-[11px] ${
                                thread.unread > 0
                                  ? "font-semibold text-slate-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {thread.last}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            <section className="flex min-w-0 flex-col bg-white">
              {selectedThread && (
                <>
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-900">
                        {messageInitials(selectedThread.peer)}
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-cyan-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {selectedThread.peer}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Connected through PsyLattice · New messages appear automatically
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-[10px] leading-4 text-cyan-900">
                      Messaging does not change your assessment or monitoring sharing permissions.
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto bg-[linear-gradient(to_bottom,#ffffff,#fbfdfe)] px-4 py-5 sm:px-6">
                      <div className="mx-auto max-w-3xl space-y-2">
                        <div className="my-5 flex items-center gap-3">
                          <div className="h-px flex-1 bg-slate-100" />
                          <span className="rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-medium text-slate-400">
                            Today
                          </span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>

                        {activeMessages.map((messageItem, index) => {
                          const previous = activeMessages[index - 1];
                          const previousSameSender =
                            previous && previous.isMine === messageItem.isMine;

                          return (
                            <div
                              key={messageItem.id}
                              className={`flex ${
                                messageItem.isMine ? "justify-end" : "justify-start"
                              } ${previousSameSender ? "mt-1" : "mt-3"}`}
                            >
                              <div
                                className={`max-w-[86%] sm:max-w-[72%] ${
                                  messageItem.isMine ? "items-end" : "items-start"
                                } flex flex-col`}
                              >
                                <div
                                  className={`whitespace-pre-wrap break-words px-4 py-3 text-sm leading-6 ${
                                    messageItem.isMine
                                      ? "rounded-[20px] rounded-br-md bg-slate-950 text-white shadow-sm"
                                      : "rounded-[20px] rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.4)]"
                                  }`}
                                >
                                  {messageItem.body}
                                </div>

                                <div className="mt-1 flex items-center gap-1.5 px-1 text-[9px] text-slate-400">
                                  <span>{messageItem.time}</span>
                                  {messageItem.isMine && (
                                    <>
                                      <span>·</span>
                                      <span>{messageItem.read ? "Read" : "Sent"}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
                      <div className="mx-auto max-w-3xl">
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50/60 p-2 transition focus-within:border-cyan-300 focus-within:bg-white focus-within:shadow-[0_14px_34px_-24px_rgba(8,145,178,0.35)]">
                          <textarea
                            value={messageDraft}
                            onChange={(event) =>
                              setMessageDraft(event.target.value.slice(0, 4000))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                sendClinicalMessage();
                              }
                            }}
                            rows={2}
                            placeholder={`Message ${selectedThread.peer}…`}
                            className="max-h-36 min-h-[58px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                          />

                          <div className="flex flex-col justify-between gap-2 border-t border-slate-200/70 px-2 pt-2 sm:flex-row sm:items-center">
                            <span className="text-[10px] text-slate-400">
                              Enter to send · Shift + Enter for a new line
                            </span>

                            <button
                              type="button"
                              disabled={!messageDraft.trim()}
                              onClick={sendClinicalMessage}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Send message <span aria-hidden="true">↗</span>
                            </button>
                          </div>
                        </div>

                        <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                          Keep urgent or emergency concerns outside this asynchronous messaging channel and use the appropriate local emergency or crisis service.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  const perms=[['calendar','View appointment calendar'],['reschedule','Create / reschedule appointments'],['assessments','View assessments'],['notes','View professional notes'],['monitoring','View client monitoring']] as const;
  return <div><ExplorerScreenTitle eyebrow="Receptionist Access" title="Appointment-only permissions" action="Save permissions" onAction={()=>setNotice("Receptionist permissions saved.")}/>{notice&&<ExplorerNotice text={notice}/>}<ExplorerCard className="p-4" highlight><div className="space-y-2">{perms.map(([key,label])=>{const enabled=reception[key];return <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-medium text-slate-700">{label}</p><p className="mt-0.5 text-[8px] text-slate-400">{enabled?"Allowed":"Blocked"}</p></div><ExplorerToggle enabled={enabled} onToggle={()=>setReception(c=>({...c,[key]:!enabled}))}/></div>})}</div></ExplorerCard></div>;
}



type ExplorerWorkspace = "self" | "researcher" | "clinician";

type ExplorerNavItem = { id: string; title: string };
type ExplorerNavGroup = { label: string; items: ExplorerNavItem[] };

const explorerNavigation: Record<ExplorerWorkspace, ExplorerNavGroup[]> = {
  self: [
    {
      label: "Personal",
      items: [
        { id: "dashboard", title: "Dashboard" },
        { id: "ai", title: "AI Guide" },
        { id: "assessments", title: "Self-Assessments" },
        { id: "monitoring", title: "Daily Monitoring" },
        { id: "regulation", title: "Self-Regulation" },
        { id: "progress", title: "Progress" },
      ],
    },
    {
      label: "Connected",
      items: [
        { id: "wearables", title: "Wearables" },
        { id: "appointments", title: "Appointments" },
        { id: "messages", title: "Messages" },
        { id: "notifications", title: "Notifications" },
        { id: "privacy", title: "Privacy & Sharing" },
      ],
    },
  ],
  researcher: [
    {
      label: "Research",
      items: [
        { id: "dashboard", title: "Dashboard" },
        { id: "studies", title: "Studies" },
        { id: "study-builder", title: "Study Builder" },
        { id: "questionnaires", title: "Questionnaire Library" },
        { id: "ambulatory", title: "Ambulatory Assessment" },
        { id: "followups", title: "Follow-up Manager" },
        { id: "participants", title: "Participants" },
        { id: "participant-links", title: "Participant Links" },
      ],
    },
    {
      label: "Data",
      items: [
        { id: "data-dashboard", title: "Data Dashboard" },
        { id: "data-explorer", title: "Data Explorer" },
        { id: "export", title: "Export Data" },
      ],
    },
    {
      label: "Governance",
      items: [
        { id: "ethics", title: "Ethics & Consent" },
        { id: "team", title: "Team & Permissions" },
      ],
    },
  ],
  clinician: [
    {
      label: "Clinical",
      items: [
        { id: "dashboard", title: "Dashboard" },
        { id: "notifications", title: "Notifications" },
        { id: "clients", title: "Clients" },
        { id: "client-overview", title: "Client Overview" },
      ],
    },
    {
      label: "Monitoring",
      items: [
        { id: "assessments", title: "Assessments" },
        { id: "monitoring", title: "Ambulatory Monitoring" },
        { id: "wearables", title: "Wearables & Physiology" },
        { id: "progress", title: "Progress Timeline" },
      ],
    },
    {
      label: "Care",
      items: [
        { id: "notes", title: "Professional Notes" },
        { id: "care-pathway", title: "Care Pathway" },
        { id: "appointments", title: "Appointments" },
        { id: "messages", title: "Messages" },
      ],
    },
    {
      label: "Governance",
      items: [
        { id: "reports", title: "Reports" },
        { id: "permissions", title: "Consent & Data Access" },
        { id: "settings", title: "Clinical Settings" },
      ],
    },
  ],
};

function SelfNotificationsView() {
  const [email, setEmail] = useState(true);
  const [appointment, setAppointment] = useState(true);
  const [messages, setMessages] = useState(true);
  const [quiet, setQuiet] = useState(true);
  return (
    <div>
      <ExplorerScreenTitle eyebrow="Notifications" title="Notification preferences" />
      <div className="grid gap-3 lg:grid-cols-2">
        <ExplorerCard className="p-4" highlight>
          <p className="text-xs font-semibold text-slate-900">Email reminders</p>
          <div className="mt-3 space-y-2">
            {[
              ["Monitoring check-ins", email, () => setEmail((v) => !v)],
              ["Appointments", appointment, () => setAppointment((v) => !v)],
              ["Secure messages", messages, () => setMessages((v) => !v)],
            ].map(([label, enabled, onToggle]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                <span className="text-[10px] font-medium text-slate-700">{String(label)}</span>
                <ExplorerToggle enabled={Boolean(enabled)} onToggle={onToggle as () => void} />
              </div>
            ))}
          </div>
        </ExplorerCard>
        <ExplorerCard className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold text-slate-900">Quiet hours</p><p className="mt-1 text-[9px] text-slate-400">Reduce non-essential reminders overnight.</p></div>
            <ExplorerToggle enabled={quiet} onToggle={() => setQuiet((v) => !v)} />
          </div>
          {quiet && <div className="mt-4 grid grid-cols-2 gap-2"><input type="time" defaultValue="22:00" className="rounded-xl border border-slate-200 px-3 py-2 text-[10px]"/><input type="time" defaultValue="07:00" className="rounded-xl border border-slate-200 px-3 py-2 text-[10px]"/></div>}
        </ExplorerCard>
      </div>
    </div>
  );
}

function ResearchParticipantLinksView() {
  const [links, setLinks] = useState([
    { name: "Main recruitment link", type: "LIVE", token: "stress-study-2026" },
    { name: "Researcher test link", type: "TEST", token: "stress-study-test" },
  ]);
  const [kind, setKind] = useState("LIVE");
  return (
    <div>
      <ExplorerScreenTitle eyebrow="Participant Links" title="Recruitment channels" action="Create link" onAction={() => setLinks((current) => [...current, {name: `${kind === "TEST" ? "Test" : "Recruitment"} link ${current.length + 1}`, type: kind, token: `study-${Math.random().toString(36).slice(2,8)}` }])}/>
      <div className="grid gap-3 lg:grid-cols-[.75fr_1.25fr]">
        <ExplorerCard className="p-4">
          <p className="text-xs font-semibold text-slate-900">New link</p>
          <div className="mt-3 flex gap-2">{["LIVE","TEST"].map(x=><button key={x} onClick={()=>setKind(x)} className={`rounded-lg px-3 py-2 text-[9px] font-semibold ${kind===x?"bg-slate-950 text-white":"border border-slate-200 text-slate-500"}`}>{x}</button>)}</div>
          <label className="mt-4 block text-[9px] font-semibold text-slate-500">Maximum participants<input type="number" defaultValue={150} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px]"/></label>
        </ExplorerCard>
        <div className="space-y-3">{links.map((link,index)=><ExplorerCard key={`${link.token}-${index}`} className="p-4" highlight={index===0}><div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${link.type==="TEST"?"bg-cyan-50 text-cyan-700":"bg-cyan-50 text-cyan-700"}`}>{link.type}</span><p className="mt-3 text-xs font-semibold text-slate-900">{link.name}</p><p className="mt-1 font-mono text-[8px] text-slate-400">psylattice.com/study/{link.token}</p></div><button onClick={()=>navigator.clipboard?.writeText(`https://psylattice.com/study/${link.token}`)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">Copy link</button></div></ExplorerCard>)}</div>
      </div>
    </div>
  );
}

function ResearchEthicsView() {
  const [consentVersion, setConsentVersion] = useState(1);
  return <div><ExplorerScreenTitle eyebrow="Ethics & Consent" title="Study governance" action="New consent version" onAction={()=>setConsentVersion(v=>v+1)}/><div className="grid gap-3 lg:grid-cols-2"><ExplorerCard className="p-4" highlight><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-900">Ethics approval</p><p className="mt-1 text-[9px] text-slate-400">Daily Stress in University Students</p></div><span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-semibold text-cyan-700">Approved</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><label className="text-[9px] font-semibold text-slate-500">Reference<input defaultValue="PSY-2026-041" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px]"/></label><label className="text-[9px] font-semibold text-slate-500">Approval date<input type="date" defaultValue="2026-06-12" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px]"/></label></div></ExplorerCard><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">Consent versions</p><div className="mt-3 space-y-2">{Array.from({length:consentVersion}).map((_,i)=><button key={i} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-left"><div><p className="text-[10px] font-semibold text-slate-700">Version {i+1}.0</p><p className="mt-0.5 text-[8px] text-slate-400">Participant information + consent items</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${i===consentVersion-1?"bg-cyan-50 text-cyan-700":"bg-slate-100 text-slate-500"}`}>{i===consentVersion-1?"Active":"Archived"}</span></button>)}</div></ExplorerCard></div></div>;
}

function ResearchTeamView() {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState([{name:"Alex Morgan",role:"Owner"},{name:"Sofia Bianchi",role:"Editor"},{name:"Ravi Mehta",role:"Viewer"}]);
  return <div><ExplorerScreenTitle eyebrow="Team & Permissions" title="Study access"/><div className="grid gap-3 lg:grid-cols-[1.15fr_.85fr]"><ExplorerCard className="p-4" highlight><div className="space-y-2">{members.map((m,i)=><div key={`${m.name}-${i}`} className="grid grid-cols-[1fr_110px_auto] items-center gap-2 rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">{m.name}</p><p className="mt-0.5 text-[8px] text-slate-400">{i===0?"alex.morgan@example.com":"collaborator@example.com"}</p></div><select value={m.role} disabled={i===0} onChange={e=>setMembers(c=>c.map((x,j)=>j===i?{...x,role:e.target.value}:x))} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-[9px]"><option>Owner</option><option>Editor</option><option>Viewer</option><option>Exporter</option></select><button disabled={i===0} onClick={()=>setMembers(c=>c.filter((_,j)=>j!==i))} className="text-[8px] font-semibold text-slate-400 disabled:opacity-20">Remove</button></div>)}</div></ExplorerCard><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">Invite collaborator</p><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="researcher@example.com" className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px]"/><select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px]"><option>Editor</option><option>Viewer</option><option>Exporter</option></select><button onClick={()=>{if(email.trim()){setMembers(c=>[...c,{name:email.trim(),role:"Editor"}]);setEmail("")}}} className="mt-3 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-[9px] font-semibold text-white">Invite</button></ExplorerCard></div></div>;
}

function ClinicalNotificationsView() {
  const [read, setRead] = useState([false,false,true]);
  const rows=[["Arjun K. completed Perceived Stress Scale","Today · 08:42"],["New secure message from Lina P.","Today · 08:15"],["Appointment updated for Maya S.","Yesterday · 16:30"]];
  return <div><ExplorerScreenTitle eyebrow="Notifications" title="Clinical updates" secondary="Mark all read" onSecondary={()=>setRead([true,true,true])}/><div className="space-y-2">{rows.map(([title,time],i)=><button key={title} onClick={()=>setRead(c=>c.map((x,j)=>j===i?true:x))} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${read[i]?"border-slate-200 bg-white":"border-cyan-200 bg-cyan-50/50"}`}><span className={`mt-1 h-2.5 w-2.5 rounded-full ${read[i]?"bg-slate-300":"bg-cyan-700"}`}/><div><p className="text-[11px] font-semibold text-slate-700">{title}</p><p className="mt-1 text-[9px] text-slate-400">{time}</p></div></button>)}</div></div>;
}

function ClinicalWearablesView() {
  const [permission]=useState({sleep:true,activity:true,heart:false});
  return <div><ExplorerScreenTitle eyebrow="Wearables & Physiology" title="Arjun K."/><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><ExplorerMiniStat label="Sleep" value="7h 11m" helper="7-day average"/><ExplorerMiniStat label="Steps" value="8,920" helper="daily average"/><ExplorerMiniStat label="Resting HR" value="61 bpm" helper="7-day average"/></div><ExplorerCard className="mt-3 p-4" highlight><div className="space-y-2">{([['sleep','Sleep summary'],['activity','Activity summary'],['heart','Heart-rate summary']] as const).map(([key,label])=><div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">{label}</p><p className="mt-0.5 text-[8px] text-slate-400">{permission[key]?"Shared by client":"Not shared by client"}</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${permission[key]?"bg-cyan-50 text-cyan-700":"bg-slate-100 text-slate-500"}`}>{permission[key]?"Shared":"Private"}</span></div>)}</div></ExplorerCard></div>;
}

function ClinicalReportsView() {
  const [include,setInclude]=useState({assessments:true,monitoring:true,wearables:false,notes:false});
  return <div><ExplorerScreenTitle eyebrow="Reports" title="Clinical summary" action="Prepare report"/><div className="grid gap-3 lg:grid-cols-[.75fr_1.25fr]"><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">Report content</p><div className="mt-3 space-y-2">{([['assessments','Assessment history'],['monitoring','Ambulatory monitoring'],['wearables','Wearable summary'],['notes','Professional notes']] as const).map(([key,label])=><div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><span className="text-[10px] font-medium text-slate-700">{label}</span><ExplorerToggle enabled={include[key]} onToggle={()=>setInclude(c=>({...c,[key]:!c[key]}))}/></div>)}</div></ExplorerCard><ExplorerCard className="p-5" highlight><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-cyan-800">PsyLattice clinical summary</p><h4 className="mt-2 text-lg font-semibold text-slate-900">Arjun K.</h4><p className="mt-1 text-[9px] text-slate-400">Prepared 20 Aug 2026</p><div className="mt-5 space-y-4">{include.assessments&&<div><p className="text-[10px] font-semibold text-slate-800">Assessment history</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Latest Perceived Stress Scale score: 16.</p></div>}{include.monitoring&&<div><p className="text-[10px] font-semibold text-slate-800">Monitoring summary</p><p className="mt-1 text-[9px] leading-4 text-slate-500">86% scheduled check-in completion during the past seven days.</p></div>}{include.wearables&&<div><p className="text-[10px] font-semibold text-slate-800">Wearables</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Shared sleep and activity summaries included.</p></div>}{include.notes&&<div><p className="text-[10px] font-semibold text-slate-800">Professional notes</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Selected clinician-authored documentation included.</p></div>}</div></ExplorerCard></div></div>;
}

function ClinicalPermissionsView() {
  const [permissions] = useState({assessments:true,monitoring:true,progress:true,wearables:false,regulation:false});
  return <div><ExplorerScreenTitle eyebrow="Consent & Data Access" title="Arjun K."/><ExplorerCard className="p-4" highlight><p className="text-[10px] leading-5 text-slate-500">The client controls these categories from Self → Privacy & Sharing. Clinical reflects the resulting access state.</p><div className="mt-4 space-y-2">{Object.entries(permissions).map(([key,enabled])=><div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-semibold capitalize text-slate-700">{key}</p><p className="mt-0.5 text-[8px] text-slate-400">Category-specific permission</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${enabled?"bg-cyan-50 text-cyan-700":"bg-slate-100 text-slate-500"}`}>{enabled?"Shared":"Not shared"}</span></div>)}</div></ExplorerCard></div>;
}

function ClinicalSettingsView() {
  const [alerts,setAlerts]=useState(true); const [receptionist,setReceptionist]=useState(false);
  return <div><ExplorerScreenTitle eyebrow="Clinical Settings" title="Professional workspace" action="Save settings"/><div className="grid gap-3 lg:grid-cols-2"><ExplorerCard className="p-4" highlight><p className="text-xs font-semibold text-slate-900">Professional profile</p><label className="mt-3 block text-[9px] font-semibold text-slate-500">Display name<input defaultValue="Dr. Alex Morgan" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px]"/></label><label className="mt-3 block text-[9px] font-semibold text-slate-500">Professional title<input defaultValue="Psychologist" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px]"/></label></ExplorerCard><ExplorerCard className="p-4"><div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">Email alerts</p><p className="text-[8px] text-slate-400">Appointments and secure messages</p></div><ExplorerToggle enabled={alerts} onToggle={()=>setAlerts(v=>!v)}/></div><div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">Receptionist appointment access</p><p className="text-[8px] text-slate-400">Appointment-only delegated access</p></div><ExplorerToggle enabled={receptionist} onToggle={()=>setReceptionist(v=>!v)}/></div>{receptionist&&<div className="mt-2 rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-[8px] text-slate-400">psylattice.com/receptionist/clinical-access</div>}</ExplorerCard></div></div>;
}

function ExplorerWorkspaceContent({ workspace, screen }: { workspace: ExplorerWorkspace; screen: string }) {
  if (workspace === "self") {
    if (screen === "notifications") return <SelfNotificationsView />;
    return <ExplorerSelfCore slideId={screen} />;
  }
  if (workspace === "researcher") {
    if (screen === "dashboard") return <ExplorerResearchCore slideId="studies" />;
    if (screen === "participant-links") return <ResearchParticipantLinksView />;
    if (screen === "data-dashboard") return <ExplorerResearchCore slideId="data" />;
    if (screen === "data-explorer") return <ExplorerResearchCore slideId="data" />;
    if (screen === "ethics") return <ResearchEthicsView />;
    if (screen === "team") return <ResearchTeamView />;
    return <ExplorerResearchCore slideId={screen} />;
  }
  if (screen === "dashboard") return <ExplorerClinicalCore slideId="client-overview" />;
  if (screen === "notifications") return <ClinicalNotificationsView />;
  if (screen === "wearables") return <ClinicalWearablesView />;
  if (screen === "reports") return <ClinicalReportsView />;
  if (screen === "permissions") return <ClinicalPermissionsView />;
  if (screen === "settings") return <ClinicalSettingsView />;
  return <ExplorerClinicalCore slideId={screen} />;
}

function ExactWorkspaceEnvironment({ workspace }: { workspace: ExplorerWorkspace }) {
  const defaultScreen = workspace === "self" ? "dashboard" : workspace === "researcher" ? "dashboard" : "dashboard";
  const [screen, setScreen] = useState(defaultScreen);
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navGroups = explorerNavigation[workspace];
  const workspaceLabel = workspace === "self" ? "Self" : workspace === "researcher" ? "Research" : "Clinical";
  const screenTitle = navGroups.flatMap((g)=>g.items).find((item)=>item.id===screen)?.title || workspaceLabel;

  useEffect(() => { setScreen(defaultScreen); }, [workspace, defaultScreen]);

  return (
    <div className="relative h-[860px] overflow-hidden bg-[#f6f8f8] text-slate-950">
      <header className="absolute inset-x-0 top-0 z-30 h-[74px] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex h-full items-center justify-between gap-4 px-5 lg:px-7">
          <div className="min-w-0"><PsyLatticeLogo size={38}/><p className="mt-0.5 pl-[52px] text-[10px] font-medium text-slate-400">{workspaceLabel} workspace</p></div>
          <div className="relative flex items-center gap-2">
            {workspace === "clinician" && <span className="hidden rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[9px] font-semibold text-cyan-800 sm:inline-flex">Verified clinician</span>}
            <button onClick={()=>setAccountOpen(v=>!v)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">AM</div><ChevronDown className="h-3.5 w-3.5 text-slate-400"/></button>
            {accountOpen&&<div className="absolute right-0 top-11 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"><p className="px-2 py-2 text-[9px] font-semibold uppercase tracking-[.12em] text-slate-400">Alex Morgan</p>{["Workspace selector","Profile","Notifications","Sign out"].map(x=><button key={x} onClick={()=>setAccountOpen(false)} className="block w-full rounded-xl px-3 py-2.5 text-left text-[10px] text-slate-600 hover:bg-slate-50">{x}</button>)}</div>}
          </div>
        </div>
      </header>

      <aside className={`absolute bottom-0 left-0 top-[74px] z-20 hidden overflow-y-auto border-r border-slate-200 bg-white p-3 transition-[width] duration-200 lg:block ${collapsed?"w-[76px]":"w-[250px]"}`}>
        <div className={`mb-4 flex ${collapsed?"justify-center":"justify-end"}`}><button onClick={()=>setCollapsed(v=>!v)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-semibold text-slate-500 hover:bg-slate-50">{collapsed?"›":"‹"}</button></div>
        {!collapsed &&
          navGroups.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.17em] text-slate-400">
                {group.label}
              </p>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const active = item.id === screen;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setScreen(item.id)}
                      className={`block w-full rounded-xl px-3 py-2.5 text-left text-[11px] transition ${
                        active
                          ? "bg-cyan-50 font-semibold text-cyan-900"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
      </aside>

      <section className={`absolute bottom-0 right-0 top-[74px] overflow-y-auto overscroll-contain p-4 pb-16 transition-[left] duration-200 sm:p-5 lg:p-7 ${collapsed?"lg:left-[76px]":"lg:left-[250px]"} left-0`}>
        <div className="mx-auto max-w-[1450px]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="flex items-center gap-2"><span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">{workspaceLabel}</span><span className="text-[9px] text-slate-400">{screenTitle}</span></div></div></div>
          <ExplorerWorkspaceContent workspace={workspace} screen={screen}/>
        </div>
      </section>
    </div>
  );
}

function ProductExplorer({ activeWorkspace, onWorkspaceChange }: { activeWorkspace: WorkspaceId; onWorkspaceChange: (workspace: WorkspaceId) => void }) {
  const [resetKey,setResetKey]=useState(0);
  const explorerWorkspace: ExplorerWorkspace =
    activeWorkspace === "research"
      ? "researcher"
      : activeWorkspace === "clinical"
        ? "clinician"
        : "self";
  return (
    <div className="rounded-[32px] border border-slate-200/90 bg-white/75 p-3 shadow-[0_4px_10px_rgba(15,23,42,.045),0_28px_70px_rgba(15,23,42,.11)] backdrop-blur sm:p-4">
      <div className="mb-3 flex flex-col gap-3 rounded-[24px] border border-slate-200/90 bg-white px-4 py-4 shadow-[0_2px_5px_rgba(15,23,42,.035),0_10px_24px_rgba(15,23,42,.06)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">{workspaces.map(workspace=>{const Icon=workspace.icon; const selected=workspace.id===activeWorkspace; return <button key={workspace.id} onClick={()=>{onWorkspaceChange(workspace.id);setResetKey(0)}} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${selected?"border-cyan-300 bg-cyan-50 text-cyan-950 shadow-[0_2px_6px_rgba(8,145,178,.08),0_10px_24px_rgba(8,145,178,.12)]":"border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900 hover:shadow-[0_2px_5px_rgba(15,23,42,.04),0_8px_18px_rgba(15,23,42,.06)]"}`}><Icon className="h-4 w-4"/>{workspace.id==="research"?"Researcher":workspace.navLabel}</button>})}</div>
        <button onClick={()=>setResetKey(v=>v+1)} className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-[0_2px_5px_rgba(15,23,42,.035),0_8px_18px_rgba(15,23,42,.055)] transition hover:-translate-y-px hover:border-cyan-200">Reset workspace</button>
      </div>
      <div key={`${explorerWorkspace}-${resetKey}`} className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-white shadow-[0_4px_10px_rgba(15,23,42,.045),0_28px_72px_rgba(15,23,42,.13)]"><ExactWorkspaceEnvironment workspace={explorerWorkspace}/></div>
    </div>
  );
}

export default function Home() {
  const [heroWorkspace, setHeroWorkspace] =
    useState<WorkspaceId>("research");
  const [explorerWorkspace, setExplorerWorkspace] =
    useState<WorkspaceId>("research");
  const [researchStep, setResearchStep] = useState(0);
  const [processStep, setProcessStep] = useState(0);
  const [openSecurity, setOpenSecurity] = useState(0);
  const [pricingRegion, setPricingRegion] =
    useState<PricingRegion>("India");
  const [showResearchPricing, setShowResearchPricing] = useState(false);

  const activeHeroWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === heroWorkspace) ??
      workspaces[1],
    [heroWorkspace]
  );

  const activePricing = pricingContent[pricingRegion];
  const activeProcess = process[processStep];

  return (
    <main className="psylattice-public-shell min-h-screen bg-[#f4f8f8] text-slate-950">
      <style>{`
        @keyframes heroPanelIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.995);
            filter: blur(1.5px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        .hero-panel-in {
          animation: heroPanelIn 680ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes heroCycleProgress {
          from { width: 0%; }
          to { width: 100%; }
        }

        .hero-cycle-progress {
          animation: heroCycleProgress 6500ms linear both;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-panel-in,
          .hero-cycle-progress {
            animation: none !important;
          }
        }

        .psylattice-public-shell {
          --pl-shadow-soft: 0 2px 5px rgba(15,23,42,.035), 0 12px 30px rgba(15,23,42,.07);
          --pl-shadow-float: 0 3px 8px rgba(15,23,42,.045), 0 20px 50px rgba(15,23,42,.10);
          --pl-shadow-cyan: 0 3px 8px rgba(8,145,178,.07), 0 18px 44px rgba(8,145,178,.13);
        }
        .psylattice-public-shell button,
        .psylattice-public-shell a {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      {/* Navigation */}
      <header className="sticky top-3 z-50 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between rounded-[26px] border border-slate-200/90 bg-white/95 px-5 shadow-[0_3px_8px_rgba(15,23,42,.05),0_18px_42px_rgba(15,23,42,.10)] backdrop-blur-xl sm:px-6">
          <PsyLatticeLogo />

          <nav className="hidden items-center gap-7 text-sm text-slate-600 lg:flex">
            <a href="#platform" className="transition hover:text-slate-950">
              Platform
            </a>
            <a href="#mobile" className="transition hover:text-slate-950">
              Mobile
            </a>
            <a href="#research" className="transition hover:text-slate-950">
              Research
            </a>
            <a href="#coming-next" className="transition hover:text-slate-950">
              Coming next
            </a>
            <a href="#how-it-works" className="transition hover:text-slate-950">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-slate-950">
              Pricing
            </a>
            <a href="#security" className="transition hover:text-slate-950">
              Security
            </a>
            <Link href="/about" className="transition hover:text-slate-950">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="hidden rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-[0_2px_5px_rgba(15,23,42,.04),0_8px_20px_rgba(15,23,42,.06)] transition hover:-translate-y-px hover:border-cyan-200 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_10px_rgba(15,23,42,.18),0_12px_26px_rgba(15,23,42,.14)] transition hover:-translate-y-px hover:bg-slate-800"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-80px] h-[620px] w-[1050px] -translate-x-1/2 rounded-full bg-cyan-100/50 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.12) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-24 pt-20 lg:grid-cols-[.94fr_1.06fr] lg:px-8 lg:pb-28 lg:pt-28">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200/90 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-[0_2px_5px_rgba(15,23,42,.04),0_10px_24px_rgba(8,145,178,.08)]">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
              A unified psychological measurement ecosystem
            </div>

            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-[72px]">
              Psychological
              <br />
              measurements,
              <br />
              <span className="text-cyan-800">connected.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              PsyLattice connects psychological self-assessment, ambulatory
              measurement, research workflows and professional monitoring
              within one carefully structured platform.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#mobile"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-900 transition hover:border-cyan-300"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Android beta available
                <ArrowRight className="h-3.5 w-3.5" />
              </a>

              <Link
                href="/self?screen=ai"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold text-cyan-900 transition hover:border-cyan-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Now equipped with AI
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <span className="text-xs text-slate-400">
                Supportive guidance, not automated diagnosis.
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-medium text-white shadow-[0_4px_10px_rgba(15,23,42,.18),0_14px_30px_rgba(15,23,42,.14)] transition hover:-translate-y-px hover:bg-slate-800"
              >
                Explore PsyLattice
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#platform"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-medium text-slate-800 shadow-[0_2px_5px_rgba(15,23,42,.04),0_10px_24px_rgba(15,23,42,.07)] transition hover:-translate-y-px hover:border-cyan-200"
              >
                Try the interactive tour
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500">
              {[
                "Non-diagnostic by design",
                "Role-based workspaces",
                "Privacy-conscious architecture",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckMark />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_2px_5px_rgba(15,23,42,.04),0_14px_34px_rgba(15,23,42,.08)] backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-800">
                Selected workspace
              </p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {activeHeroWorkspace.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeHeroWorkspace.shortDescription}
                  </p>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[9px] font-semibold text-white">
                  Auto-switching preview →
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <HeroWorkspaceStage
              activeWorkspace={heroWorkspace}
              onChange={setHeroWorkspace}
            />
          </div>
        </div>
      </section>

      {/* PsyLattice Mobile */}
      <section
        id="mobile"
        className="scroll-mt-24 border-y border-slate-200/80 bg-[#f2f8f8] py-20 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-cyan-800 shadow-[0_2px_5px_rgba(15,23,42,.035),0_10px_24px_rgba(8,145,178,.09)]">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                Android beta available now
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
                PsyLattice Mobile
              </p>
              <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Psychological measurement,
                <span className="text-cyan-800"> beyond the browser.</span>
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                PsyLattice Mobile is designed for the moments that desktop research cannot capture:
                repeated real-world assessment, longitudinal follow-up, connected wearable context
                and participant workflows that travel with the person.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={ANDROID_BETA_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(15,23,42,.18),0_14px_30px_rgba(15,23,42,.14)] transition hover:-translate-y-px hover:bg-slate-800"
                >
                  <FileDown className="h-4 w-4" />
                  Download Android Beta
                </a>
                <a
                  href={ANDROID_BETA_DRIVE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_2px_5px_rgba(15,23,42,.035),0_10px_24px_rgba(15,23,42,.07)] transition hover:-translate-y-px hover:border-cyan-200"
                >
                  Open in Google Drive
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <p className="mt-3 max-w-xl text-[11px] leading-5 text-slate-400">
                Beta distribution currently uses a signed APK outside Google Play. Android may ask
                you to allow installation from your browser or file manager. Only install PsyLattice
                from the official link on this website.
              </p>

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: Activity,
                    title: "Ambulatory / EMA / ESM",
                    text: "Schedule repeated check-ins across everyday contexts instead of relying on a single retrospective snapshot.",
                  },
                  {
                    icon: HeartPulse,
                    title: "Android Health Connect",
                    text: "Use permission-based supported health data as contextual input for configured mobile research workflows.",
                  },
                  {
                    icon: Workflow,
                    title: "Longitudinal research",
                    text: "Keep repeated assessments, follow-up waves, prompts and participant activity connected across time.",
                  },
                  {
                    icon: BellRing,
                    title: "Mobile follow-up",
                    text: "Bring study reminders, appointments and secure communication closer to the participant or client.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[22px] border border-slate-200/90 bg-white p-4 shadow-[0_2px_5px_rgba(15,23,42,.035),0_12px_28px_rgba(15,23,42,.07)]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">{item.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white/75 p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      iPhone, Apple Health &amp; Apple Watch support is coming next.
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      The current beta is Android-first. The iOS companion and Apple ecosystem
                      integration are planned, not yet available in this release.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <MobileEcosystemVisual />
            </div>
          </div>

          <div className="mt-14 grid gap-4 rounded-[30px] border border-slate-200/90 bg-white p-5 text-slate-950 shadow-[0_4px_10px_rgba(15,23,42,.04),0_24px_58px_rgba(15,23,42,.10)] sm:grid-cols-4 sm:p-6">
            {[
              ["01", "Measure in context", "Repeated self-report while experiences are happening."],
              ["02", "Connect permitted data", "Health Connect adds optional contextual signals to supported Android workflows."],
              ["03", "Follow over time", "Longitudinal protocols keep days, phases and follow-up linked."],
              ["04", "Bring it back to the workspace", "Research and clinical views remain structured around role and permission."],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-[22px] border border-slate-200 bg-[#f8fbfb] p-4 shadow-[0_2px_5px_rgba(15,23,42,.03),0_10px_22px_rgba(15,23,42,.055)]">
                <p className="text-[10px] font-semibold text-cyan-700">{number}</p>
                <p className="mt-2 text-sm font-semibold">{title}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming next */}
      <section
        id="coming-next"
        className="scroll-mt-24 border-y border-slate-200 bg-[linear-gradient(180deg,#f7faf9_0%,#eef5f4_100%)] py-20 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              Upcoming research capabilities
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              The next wave of PsyLattice is being designed as a real differentiator.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              We want PsyLattice to be the platform that ambitious students, thesis researchers and early-career labs can actually afford—without giving up serious cognitive experimentation, richer device-aware workflows and truly cross-platform participation.
            </p>
          </div>

          <div className="mt-10">
            <UpcomingCapabilitiesShowcase />
          </div>
        </div>
      </section>

      {/* Interactive platform explorer */}
      <section
        id="platform"
        className="scroll-mt-24 border-y border-slate-200 bg-white py-20 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              Explore the product
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Step directly into all three PsyLattice workspaces.
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              Switch between Self, Researcher and Clinical, then use the full
              navigation, forms, builders, records and workspace views directly
              on this page.
            </p>
          </div>

          <div className="mt-10">
            <ProductExplorer
              activeWorkspace={explorerWorkspace}
              onWorkspaceChange={setExplorerWorkspace}
            />
          </div>
        </div>
      </section>

      {/* Research lifecycle */}
      <section
        id="research"
        className="scroll-mt-24 mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28"
      >
        <div className="grid gap-14 lg:grid-cols-[.72fr_1.28fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              PsyLattice Research
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Psychological research, from study design to dataset.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Researchers can assemble questionnaire studies and ambulatory
              protocols, distribute participant links, monitor completion and
              export structured data.
            </p>

            <Link
              href="/signin"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold"
            >
              Explore Research
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <div className="grid gap-2 sm:grid-cols-4">
              {[
                {
                  title: "Measures",
                  icon: ClipboardList,
                  copy: "Questionnaires and custom items",
                },
                {
                  title: "EMA protocol",
                  icon: Activity,
                  copy: "Repeated real-world assessment",
                },
                {
                  title: "Participants",
                  icon: Users,
                  copy: "Links, phases and completion",
                },
                {
                  title: "Export",
                  icon: FileDown,
                  copy: "Structured research datasets",
                },
              ].map((step, index) => {
                const Icon = step.icon;
                const selected = index === researchStep;

                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setResearchStep(index)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-cyan-300 bg-cyan-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-cyan-800 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-4 text-xs font-semibold text-slate-900">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">
                      {step.copy}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.3)]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Active study
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">
                    Daily Stress in University Students
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    14-day ambulatory protocol
                  </p>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-6">
                {[
                  ["93", "Participants"],
                  ["81%", "Compliance"],
                  ["2,846", "Responses"],
                  ["7", "Data flags"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className={`rounded-xl px-4 py-4 transition ${
                      researchStep === 2 && label === "Participants"
                        ? "bg-cyan-50 ring-1 ring-cyan-200"
                        : "bg-slate-50"
                    }`}
                  >
                    <p className="text-xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="rounded-2xl border border-slate-100 bg-[#f9fbfb] p-5">
                  {researchStep === 0 && (
                    <div>
                      <p className="text-sm font-semibold">Measures</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {[
                          "Perceived Stress Scale",
                          "General Self-Efficacy Scale",
                          "Weekly custom check-in",
                        ].map((item) => (
                          <div
                            key={item}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-[10px] font-medium text-slate-600"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {researchStep === 1 && (
                    <div>
                      <p className="text-sm font-semibold">EMA protocol</p>
                      <div className="mt-4 space-y-2">
                        {[
                          ["Morning window", "08:00–10:00"],
                          ["Afternoon window", "13:00–15:00"],
                          ["Evening window", "19:00–21:00"],
                        ].map(([label, time]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
                          >
                            <span className="text-[10px] font-medium text-slate-600">
                              {label}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {researchStep === 2 && (
                    <div>
                      <p className="text-sm font-semibold">Participants</p>
                      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {[
                          ["PL-1042", "Complete"],
                          ["PL-1043", "Day 7 due"],
                          ["PL-1044", "In progress"],
                        ].map(([id, status]) => (
                          <div
                            key={id}
                            className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0"
                          >
                            <span className="text-[10px] font-semibold text-slate-700">
                              {id}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {researchStep === 3 && (
                    <div>
                      <p className="text-sm font-semibold">Export</p>
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {["CSV", "XLSX", "Analysis ready"].map(
                          (format, index) => (
                            <button
                              key={format}
                              className={`rounded-xl border px-4 py-4 text-[10px] font-semibold ${
                                index === 1
                                  ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                                  : "border-slate-200 bg-white text-slate-600"
                              }`}
                            >
                              {format}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-y border-slate-200 bg-slate-950 py-20 text-white lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                How PsyLattice works
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
                Measure.
                <br />
                Observe.
                <br />
                Understand.
                <br />
                Act.
              </h2>
            </div>

            <div>
              <div className="grid gap-2 sm:grid-cols-4">
                {process.map((step, index) => {
                  const Icon = step.icon;
                  const selected = index === processStep;

                  return (
                    <button
                      key={step.number}
                      type="button"
                      onClick={() => setProcessStep(index)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-cyan-500/50 bg-cyan-500/10"
                          : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-cyan-300 text-slate-950"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                        {step.number}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{step.title}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.045] p-6 sm:p-8">
                <div className="flex items-start gap-5">
                  <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-semibold text-slate-950 sm:flex">
                    {activeProcess.number}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">
                      {activeProcess.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                      {activeProcess.description}
                    </p>
                    <p className="mt-4 max-w-2xl border-l-2 border-cyan-400/60 pl-4 text-sm leading-7 text-slate-400">
                      {activeProcess.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section
        id="security"
        className="scroll-mt-24 mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28"
      >
        <div className="grid gap-14 lg:grid-cols-[.76fr_1.24fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              Privacy & security
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              Sensitive information requires careful design.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
              PsyLattice is built so connected workflows do not automatically
              mean unrestricted information sharing.
            </p>

            <div className="mt-7 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-800" />
                <p className="text-sm leading-7 text-cyan-950">
                  Human clinical responsibility remains with qualified
                  professionals. PsyLattice does not automate diagnosis or
                  treatment decisions.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {securityItems.map((item, index) => {
              const Icon = item.icon;
              const open = openSecurity === index;

              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setOpenSecurity(open ? -1 : index)}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    open
                      ? "border-cyan-200 bg-cyan-50/60"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        open
                          ? "bg-cyan-800 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {open && (
                    <p className="mt-4 pl-14 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="scroll-mt-24 border-y border-slate-200 bg-white py-24 lg:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
                Pricing
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Our unbeatable pricing.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Individuals subscribe to Self, clinicians can join for free, and researchers
                build for free, publish their first live study free, then choose pay-as-you-go
                or Researcher Pro.
              </p>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPricingRegion("India")}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                    pricingRegion === "India"
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-transparent text-slate-600 hover:bg-white"
                  }`}
                >
                  India
                </button>
                <button
                  type="button"
                  onClick={() => setPricingRegion("europe")}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                    pricingRegion === "europe"
                      ? "bg-slate-950 text-white shadow-sm"
                      : "bg-transparent text-slate-600 hover:bg-white"
                  }`}
                >
                  Europe
                </button>
              </div>
              <p className="px-2 pt-3 text-xs text-slate-500">
                {activePricing.sublabel}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {activePricing.cards
              .filter((card) =>
                ["self", "researcher", "clinician"].includes(card.id)
              )
              .sort(
                (a, b) =>
                  ["self", "researcher", "clinician"].indexOf(a.id) -
                  ["self", "researcher", "clinician"].indexOf(b.id)
              )
              .map((card) => {
                const isResearcher = card.id === "researcher";

                return (
                  <article
                    key={card.id}
                    className={`relative flex h-full flex-col rounded-[28px] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      isResearcher
                        ? "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-white shadow-lg shadow-cyan-100/50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {isResearcher && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="whitespace-nowrap rounded-full bg-cyan-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                          Start here
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
                      {card.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight">
                      {card.title}
                    </h3>

                    <div className="mt-5 flex items-end gap-2">
                      <span className="text-3xl font-semibold tracking-tight">
                        {card.price}
                      </span>
                      {card.cadence && (
                        <span className="pb-0.5 text-sm text-slate-500">
                          {card.cadence}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {card.description}
                    </p>

                    <div className="my-5 h-px bg-slate-100" />

                    <ul className="space-y-2.5">
                      {card.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2.5 text-sm leading-5 text-slate-600"
                        >
                          <span className="mt-0.5 text-cyan-700">
                            <CheckMark />
                          </span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {isResearcher ? (
                      <button
                        type="button"
                        onClick={() => setShowResearchPricing(true)}
                        className="mt-6 flex w-full items-center justify-between rounded-xl bg-cyan-950 px-4 py-3.5 text-left text-sm font-semibold text-white transition hover:bg-cyan-900"
                      >
                        <span>First live study free · then pay per study or go Pro</span>
                        <ArrowRight className="ml-3 h-4 w-4 text-cyan-200" />
                      </button>
                    ) : (
                      <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                        {card.note}
                      </div>
                    )}

                    <div className="mt-auto pt-5">
                      <Link
                        href={card.ctaHref}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition ${
                          isResearcher
                            ? "border border-cyan-900 bg-white text-cyan-950 hover:bg-cyan-50"
                            : "border border-slate-300 bg-white text-slate-900 hover:border-slate-400"
                        }`}
                      >
                        {card.ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <p className="mt-3 text-[11px] leading-5 text-slate-400">
                        By continuing, you agree to the{" "}
                        <Link
                          href="/terms"
                          className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-950"
                        >
                          Terms of Use
                        </Link>
                        .
                      </p>
                    </div>
                  </article>
                );
              })}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#f8faf9] px-5 py-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>
                <strong className="font-semibold text-slate-800">Self:</strong>{" "}
                personal subscription
              </span>
              <span>
                <strong className="font-semibold text-slate-800">
                  Clinicians:
                </strong>{" "}
                free
              </span>
              <span>
                <strong className="font-semibold text-slate-800">
                  Researchers:
                </strong>{" "}
                first live study free · then PAYG or Pro
              </span>
              <span>
                <strong className="font-semibold text-slate-800">
                  Participants:
                </strong>{" "}
                always free
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowResearchPricing(true)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-900"
            >
              See research launch pricing
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {showResearchPricing && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm"
            onMouseDown={() => setShowResearchPricing(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="research-pricing-title"
              onMouseDown={(event) => event.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[30px] border border-slate-200 bg-[#f8fafb] shadow-[0_32px_100px_-24px_rgba(15,23,42,0.45)]"
            >
              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-[#f8fafb]/95 px-6 py-5 backdrop-blur-xl sm:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
                    Research study pricing
                  </p>
                  <h3
                    id="research-pricing-title"
                    className="mt-2 text-2xl font-semibold tracking-tight"
                  >
                    First study free. Then choose how you want to keep researching.
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Build and test for free. Your first live study is free. From your second
                    study onward, pay per study or use Researcher Pro.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResearchPricing(false)}
                  aria-label="Close research pricing"
                  className="ml-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                <div className="rounded-[22px] border border-cyan-200 bg-cyan-50/80 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
                        Your first live study is on us
                      </p>
                      <p className="mt-2 text-sm leading-6 text-cyan-950">
                        Create, configure and test for free, then publish your first real PsyLattice study without payment.
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-semibold text-cyan-800 shadow-sm">
                      1 free study credit
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4 sm:p-8">
                {activePricing.cards
                  .filter((card) =>
                    [
                      "study-standard",
                      "study-large",
                      "research-pro-monthly",
                      "research-pro-annual",
                    ].includes(card.id)
                  )
                  .map((card) => (
                    <article
                      key={card.id}
                      className={`relative flex flex-col rounded-[22px] border bg-white p-6 ${
                        card.id === "research-pro-monthly"
                          ? "border-cyan-300 shadow-lg shadow-cyan-100/50"
                          : card.id === "research-pro-annual"
                            ? "border-cyan-300 shadow-lg shadow-cyan-100/50"
                            : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
                            {card.eyebrow}
                          </p>
                          <h4 className="mt-2 text-xl font-semibold tracking-tight">
                            {card.title}
                          </h4>
                        </div>

                        {card.id === "research-pro-monthly" && (
                          <span className="rounded-full bg-cyan-950 px-3 py-1 text-[10px] font-semibold text-white">
                            Regular use
                          </span>
                        )}
                        {card.id === "research-pro-annual" && (
                          <span className="rounded-full bg-cyan-700 px-3 py-1 text-[10px] font-semibold text-white">
                            Best value
                          </span>
                        )}
                      </div>

                      <div className="mt-5 flex items-end gap-2">
                        <span className="text-3xl font-semibold tracking-tight">
                          {card.price}
                        </span>
                        {card.cadence && (
                          <span className="pb-0.5 text-sm text-slate-500">
                            {card.cadence}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {card.description}
                      </p>

                      <div className="my-5 h-px bg-slate-100" />

                      <ul className="space-y-2.5">
                        {card.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex items-start gap-2.5 text-sm leading-5 text-slate-600"
                          >
                            <span className="mt-0.5 text-cyan-700">
                              <CheckMark />
                            </span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-6">
                        <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                          {card.note}
                        </div>

                        <Link
                          href={card.ctaHref}
                          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                            card.id === "research-pro-monthly"
                              ? "bg-cyan-950 text-white hover:bg-cyan-900"
                              : card.id === "research-pro-annual"
                                ? "bg-cyan-700 text-white hover:bg-cyan-600"
                                : "bg-slate-950 text-white hover:bg-slate-800"
                          }`}
                        >
                          {card.ctaLabel}
                          <ArrowRight className="h-4 w-4" />
                        </Link>

                        <p className="mt-3 text-[11px] leading-5 text-slate-400">
                          By continuing, you agree to the{" "}
                          <Link
                            href="/terms"
                            className="font-medium text-slate-600 underline underline-offset-2 hover:text-slate-950"
                          >
                            Terms of Use
                          </Link>
                          .
                        </p>
                      </div>
                    </article>
                  ))}
              </div>

              <div className="mx-6 mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-4 sm:mx-8 sm:mb-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Study participants remain free</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Participants never need a paid PsyLattice subscription to take part in a study.
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600">
                    Participant access · Free
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 px-6 py-5 sm:px-8">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-500">
                    Need a study with more than 1,000 participants?
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-900 transition hover:text-cyan-700"
                  >
                    Contact PsyLattice for larger studies
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="px-6 py-20 lg:px-8 lg:py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-cyan-900 px-7 py-14 text-white sm:px-10 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Start with PsyLattice
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                A connected foundation for psychological measurement.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-cyan-100/80">
                Choose the workspace designed for your role and begin building
                a clearer view of psychological information over time.
              </p>
            </div>

            <Link
              href="/signin"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-cyan-950 transition hover:bg-cyan-50"
            >
              Choose your workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div>
              <PsyLatticeLogo />
              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
                A modular platform for psychological assessment, research,
                real-world monitoring and professional support.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-14 gap-y-8 text-sm sm:grid-cols-3">
              <div>
                <p className="font-semibold">Platform</p>
                <div className="mt-4 space-y-3 text-slate-500">
                  <a href="#platform" className="block hover:text-slate-950">
                    Self
                  </a>
                  <a href="#platform" className="block hover:text-slate-950">
                    Research
                  </a>
                  <a href="#platform" className="block hover:text-slate-950">
                    Clinical
                  </a>
                  <a href="#mobile" className="block hover:text-slate-950">
                    Mobile
                  </a>
                  <a href="#coming-next" className="block hover:text-slate-950">
                    Coming next
                  </a>
                  <a
                    href={ANDROID_BETA_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="block font-medium text-cyan-800 hover:text-cyan-700"
                  >
                    Android Beta ↓
                  </a>
                </div>
              </div>

              <div>
                <p className="font-semibold">Company</p>
                <div className="mt-4 space-y-3 text-slate-500">
                  <Link href="/about" className="block hover:text-slate-950">
                    About
                  </Link>
                  <Link href="/security" className="block hover:text-slate-950">
                    Security
                  </Link>
                  <Link href="/contact" className="block hover:text-slate-950">
                    Contact
                  </Link>
                </div>
              </div>

              <div>
                <p className="font-semibold">Legal</p>
                <div className="mt-4 space-y-3 text-slate-500">
                  <Link href="/privacy" className="block hover:text-slate-950">
                    Privacy
                  </Link>
                  <Link href="/terms" className="block hover:text-slate-950">
                    Terms
                  </Link>
                  <Link
                    href="/data-policy"
                    className="block hover:text-slate-950"
                  >
                    Data policy
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
            <p>© 2026 PsyLattice. Concept platform.</p>
            <p>Designed for responsible psychological measurement.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
