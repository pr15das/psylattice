"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  Link2,
  LockKeyhole,
  MessageSquare,
  Microscope,
  Moon,
  NotebookPen,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  Watch,
  Workflow,
  X,
  Zap,
  BookOpen,
  Eye,
  Filter,
  LayoutDashboard,
  Lock,
  MonitorSmartphone,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  UserPlus,
  WandSparkles,
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
    sublabel: "Launch pricing for India and Asia",
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
          "Researchers can explore the platform, build studies, test flows and prepare protocols without paying for an account.",
        bullets: [
          "Questionnaire Library",
          "Study Builder",
          "Custom questionnaires",
          "Preview and test study flows",
          "No charge until you publish a live study",
        ],
        ctaLabel: "Create researcher account",
        ctaHref: "/signin",
        note: "You only pay when you launch a live study.",
      },
      {
        id: "study-standard",
        eyebrow: "Research launch",
        title: "Standard Study",
        price: "₹29",
        cadence: "/study",
        featured: false,
        description:
          "For smaller live studies. Publish one real study and collect data from up to 500 participants.",
        bullets: [
          "Up to 500 participants",
          "Participants do not pay",
          "Build and test the study beforehand for free",
          "Suitable for most student and standard research projects",
        ],
        ctaLabel: "Launch a standard study",
        ctaHref: "/signin",
        note: "Best for pilots, thesis studies and medium-sized projects.",
      },
      {
        id: "study-large",
        eyebrow: "Research launch",
        title: "Large Study",
        price: "₹99",
        cadence: "/study",
        featured: false,
        description:
          "For larger live studies. Publish one real study and collect data from up to 1,000 participants.",
        bullets: [
          "Up to 1,000 participants",
          "Participants do not pay",
          "Build and test the study beforehand for free",
          "Designed for larger projects and broader recruitment",
        ],
        ctaLabel: "Launch a large study",
        ctaHref: "/signin",
        note: "Need more than 1,000 participants? Contact PsyLattice later for larger research plans.",
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
          "Access through study link",
          "Complete assigned study measures",
          "Designed for simple participation",
        ],
        ctaLabel: "Learn how studies work",
        ctaHref: "/signin",
        note: "Research participants never need to pay to participate.",
      },
    ],
  },
  europe: {
    label: "Europe",
    sublabel: "Launch pricing for Europe",
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
          "Researchers can explore the platform, build studies, test flows and prepare protocols without paying for an account.",
        bullets: [
          "Questionnaire Library",
          "Study Builder",
          "Custom questionnaires",
          "Preview and test study flows",
          "No charge until you publish a live study",
        ],
        ctaLabel: "Create researcher account",
        ctaHref: "/signin",
        note: "You only pay when you launch a live study.",
      },
      {
        id: "study-standard",
        eyebrow: "Research launch",
        title: "Standard Study",
        price: "€3.99",
        cadence: "/study",
        featured: false,
        description:
          "For smaller live studies. Publish one real study and collect data from up to 500 participants.",
        bullets: [
          "Up to 500 participants",
          "Participants do not pay",
          "Build and test the study beforehand for free",
          "Suitable for most student and standard research projects",
        ],
        ctaLabel: "Launch a standard study",
        ctaHref: "/signin",
        note: "Best for pilots, thesis studies and medium-sized projects.",
      },
      {
        id: "study-large",
        eyebrow: "Research launch",
        title: "Large Study",
        price: "€7.99",
        cadence: "/study",
        featured: false,
        description:
          "For larger live studies. Publish one real study and collect data from up to 1,000 participants.",
        bullets: [
          "Up to 1,000 participants",
          "Participants do not pay",
          "Build and test the study beforehand for free",
          "Designed for larger projects and broader recruitment",
        ],
        ctaLabel: "Launch a large study",
        ctaHref: "/signin",
        note: "Need more than 1,000 participants? Contact PsyLattice later for larger research plans.",
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
          "Access through study link",
          "Complete assigned study measures",
          "Designed for simple participation",
        ],
        ctaLabel: "Learn how studies work",
        ctaHref: "/signin",
        note: "Research participants never need to pay to participate.",
      },
    ],
  },
} as const;

function CheckMark() {
  return <Check className="h-4 w-4 shrink-0" strokeWidth={1.9} />;
}

function DemoChrome({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_-48px_rgba(15,23,42,0.42)]">
      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] text-slate-400 sm:block">
            psylattice.com
          </div>
        </div>

        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
      </div>

      {children}
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
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
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
              <p className="text-[10px] font-semibold text-slate-800">
                One account
              </p>
              <p className="mt-0.5 text-[9px] text-slate-400">
                Switch context without changing login
              </p>
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
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[8px] font-semibold text-emerald-700">
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

function FeaturePreview({
  feature,
  workspace,
}: {
  feature: Feature;
  workspace: Workspace;
}) {
  const preview = feature.preview;

  if (preview === "assessment") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Self-Assessments"
          title="Choose a structured self-check"
          description="Example personal assessment library"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Perceived Stress", "10 items", "≈ 3 min"],
            ["Wellbeing Check", "8 items", "≈ 2 min"],
          ].map(([title, items, time]) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[9px] font-semibold text-cyan-800">
                {items}
              </span>
              <p className="mt-3 text-xs font-semibold text-slate-900">
                {title}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">{time}</p>
              <button className="mt-4 rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-semibold text-white">
                Start assessment
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "ai") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="AI Guide"
          title="What would you like to understand?"
          description="Supportive assessment navigation — not diagnosis"
        />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="space-y-3 p-4">
            <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5 text-[10px] leading-5 text-slate-600">
              I have been feeling overwhelmed before presentations. What could I
              reflect on?
            </div>
            <div className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-slate-950 px-3 py-2.5 text-[10px] leading-5 text-white">
              I can help you explore structured self-checks related to stress,
              anxiety and coping. This is not a diagnosis.
            </div>
          </div>
          <div className="border-t border-slate-100 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-cyan-700" />
              Describe what you have been experiencing…
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (preview === "ambulatory") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow={
            workspace.id === "research"
              ? "EMA / ESM"
              : workspace.id === "clinical"
                ? "Shared monitoring"
                : "Daily Monitoring"
          }
          title={
            workspace.id === "research"
              ? "14-day ambulatory protocol"
              : "Repeated real-world check-ins"
          }
          description="Example schedule and completion view"
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {[
            ["Morning", "08:30", "Complete"],
            ["Afternoon", "14:00", "Ready"],
            ["Evening", "20:30", "Upcoming"],
          ].map(([label, time, status]) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    status === "Complete"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-cyan-50 text-cyan-800"
                  }`}
                >
                  {status === "Complete" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <BellRing className="h-3.5 w-3.5" />
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-800">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-400">{time}</p>
                </div>
              </div>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[9px] font-semibold text-slate-500">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "regulation") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Self-Regulation"
          title="Small routines, made trackable"
          description="Example grounding plan"
        />
        <div className="space-y-2">
          {[
            ["Pause before the trigger", true],
            ["5–4–3–2–1 grounding", true],
            ["Short reflection afterwards", false],
          ].map(([label, complete]) => (
            <button
              key={String(label)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  complete
                    ? "bg-cyan-800 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-300"
                }`}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="text-[11px] font-semibold text-slate-700">
                {String(label)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "progress") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Longitudinal view"
          title="Patterns across time"
          description="Example repeated-measure trend"
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex h-40 items-end gap-2">
            {[42, 55, 48, 64, 58, 73, 67, 79, 71, 84].map(
              (height, index) => (
                <button
                  key={index}
                  title={`Day ${index + 1}`}
                  className="group flex h-full flex-1 items-end"
                >
                  <span
                    className="w-full rounded-t-md bg-cyan-700/70 transition group-hover:bg-cyan-800"
                    style={{ height: `${height}%` }}
                  />
                </button>
              )
            )}
          </div>
          <div className="mt-3 flex justify-between text-[9px] text-slate-400">
            <span>Earlier</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    );
  }

  if (preview === "wearables") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Wearables"
          title="Optional physiological context"
          description="Example connected summary"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["7h 24m", "Sleep", Moon],
            ["8,412", "Steps", Activity],
            ["63 bpm", "Resting HR", HeartPulse],
          ].map(([value, label, Icon]) => {
            const MetricIcon = Icon as LucideIcon;
            return (
              <div
                key={String(label)}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <MetricIcon className="h-4 w-4 text-cyan-800" />
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  {String(value)}
                </p>
                <p className="mt-1 text-[9px] text-slate-400">
                  {String(label)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-4 py-3 text-[10px] leading-5 text-cyan-900">
          Wearable information is optional and adds context rather than replacing
          psychological measures.
        </div>
      </div>
    );
  }

  if (preview === "summary") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Therapist Summary"
          title="Choose what to bring into the conversation"
          description="Example selected-information summary"
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {[
            ["Latest self-assessment", true],
            ["7-day monitoring pattern", true],
            ["Wearable summary", false],
            ["Personal notes", false],
          ].map(([label, selected]) => (
            <div
              key={String(label)}
              className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
            >
              <span className="text-[10px] font-medium text-slate-600">
                {String(label)}
              </span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                  selected
                    ? "border-cyan-800 bg-cyan-800 text-white"
                    : "border-slate-200 bg-white"
                }`}
              >
                {selected ? <Check className="h-3 w-3" /> : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "library") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Questionnaire Library"
          title="Find a measure without leaving the study workflow"
          description="Example research library"
        />
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] text-slate-400">
          <Search className="h-3.5 w-3.5" />
          Search questionnaires…
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Perceived Stress Scale", "Stress", "Library"],
            ["General Self-Efficacy Scale", "Self-efficacy", "Library"],
            ["Weekly Research Check-in", "Custom", "Your questionnaire"],
          ].map(([title, category, source]) => (
            <button
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-200"
            >
              <span className="rounded-full bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">
                {source}
              </span>
              <p className="mt-3 text-[11px] font-semibold text-slate-800">
                {title}
              </p>
              <p className="mt-1 text-[9px] text-slate-400">{category}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "builder") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Study Builder"
          title="Daily Stress in University Students"
          description="Example study configuration"
        />
        <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="space-y-2">
            {[
              ["Study information", true],
              ["Consent", true],
              ["Measures", false],
              ["Ambulatory", false],
            ].map(([label, done], index) => (
              <button
                key={String(label)}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-[10px] font-semibold ${
                  index === 2
                    ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    done
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {String(label)}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-900">
              Study measures
            </p>
            <div className="mt-3 space-y-2">
              {[
                ["Perceived Stress Scale", "Library"],
                ["General Self-Efficacy Scale", "Library"],
                ["Weekly follow-up", "Custom"],
              ].map(([label, source]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
                >
                  <span className="text-[10px] font-medium text-slate-600">
                    {label}
                  </span>
                  <span className="text-[8px] text-slate-400">{source}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (preview === "custom") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Custom questionnaire"
          title="Build study-specific items"
          description="Example item builder"
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {["Single choice", "Scale", "Text", "Image choice"].map(
              (type, index) => (
                <button
                  key={type}
                  className={`rounded-lg border px-3 py-2 text-[9px] font-semibold ${
                    index === 1
                      ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-[10px] font-semibold text-slate-700">
              How mentally demanding was the last task?
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div className="h-full w-[64%] rounded-full bg-cyan-700" />
            </div>
            <div className="mt-2 flex justify-between text-[8px] text-slate-400">
              <span>Not at all</span>
              <span>Extremely</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (preview === "participants") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Participants"
          title="Participation at a glance"
          description="Example study participant dashboard"
        />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-4 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span>ID</span>
            <span>Phase</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          {[
            ["PL-1042", "Baseline", "Complete", "Today"],
            ["PL-1043", "Day 7", "Due", "Today"],
            ["PL-1044", "Baseline", "In progress", "Yesterday"],
          ].map((row) => (
            <button
              key={row[0]}
              className="grid w-full grid-cols-4 border-t border-slate-100 px-4 py-3 text-left text-[9px] text-slate-600 hover:bg-slate-50"
            >
              {row.map((cell, index) => (
                <span key={`${row[0]}-${index}`}>{cell}</span>
              ))}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "data") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Research data"
          title="Monitor collection while the study is live"
          description="Example study activity"
        />
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["93", "Participants"],
            ["81%", "Compliance"],
            ["2,846", "Responses"],
            ["7", "Data flags"],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="text-lg font-semibold text-slate-900">{value}</p>
              <p className="mt-1 text-[8px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex h-28 items-end gap-2">
            {[62, 72, 54, 81, 76, 88, 83].map((height, index) => (
              <span
                key={index}
                className="flex-1 rounded-t-md bg-cyan-700/70"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (preview === "export") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Export Data"
          title="Choose the dataset you need"
          description="Example structured export workflow"
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {[
              ["Participant summary", true],
              ["Questionnaire responses", true],
              ["Ambulatory responses", true],
              ["Analysis wide", false],
            ].map(([label, selected]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
              >
                <span className="text-[10px] text-slate-600">
                  {String(label)}
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md ${
                    selected
                      ? "bg-cyan-800 text-white"
                      : "border border-slate-200"
                  }`}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {["XLSX", "CSV", "JSON"].map((format, index) => (
              <button
                key={format}
                className={`w-full rounded-xl border px-3 py-3 text-[10px] font-semibold ${
                  index === 0
                    ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                    : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (preview === "clients") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Clients"
          title="Connected client workspace"
          description="Example assigned-client overview"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["AS", "A. Sharma", "Monitoring + assessments shared"],
            ["RK", "R. Kapoor", "Assessment history shared"],
          ].map(([initials, name, shared]) => (
            <button
              key={name}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-[10px] font-semibold text-cyan-800">
                  {initials}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-800">
                    {name}
                  </p>
                  <p className="mt-1 text-[8px] text-slate-400">{shared}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "history") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Assessment history"
          title="Review supported assessments across time"
          description="Example client history"
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {[
            ["18 Aug", "Wellbeing assessment", "Completed"],
            ["11 Aug", "Stress measure", "Completed"],
            ["02 Aug", "Initial baseline", "Completed"],
          ].map(([date, title, status], index) => (
            <div
              key={`${date}-${title}`}
              className="relative flex gap-4 border-l border-slate-200 pb-5 pl-5 last:pb-0"
            >
              <span
                className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${
                  index === 0 ? "bg-cyan-700" : "bg-slate-300"
                }`}
              />
              <div className="flex-1">
                <p className="text-[9px] text-slate-400">{date}</p>
                <p className="mt-1 text-[10px] font-semibold text-slate-700">
                  {title}
                </p>
              </div>
              <span className="text-[8px] font-semibold text-emerald-700">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "notes") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Professional Notes"
          title="Working formulation"
          description="Example clinician-authored record"
        />
        <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Notes
            </p>
            {["Working formulation", "Session 18 Aug", "Review plan"].map(
              (note, index) => (
                <button
                  key={note}
                  className={`mt-2 w-full rounded-xl px-3 py-2.5 text-left text-[9px] font-semibold ${
                    index === 0
                      ? "bg-cyan-50 text-cyan-900"
                      : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {note}
                </button>
              )
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
              {["B", "I", "U", "• List", "1. List"].map((tool) => (
                <button
                  key={tool}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] font-semibold text-slate-600"
                >
                  {tool}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[10px] leading-5 text-slate-600">
              Current formulation: client reports improved confidence following
              use of grounding strategies before presentations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (preview === "followup") {
    return (
      <div className="space-y-4">
        <DemoTitle
          eyebrow="Follow-up"
          title="Keep the professional workflow connected"
          description="Example appointment and secure follow-up"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan-800" />
              <p className="text-[10px] font-semibold text-slate-700">
                Next appointment
              </p>
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-900">
              25 Aug
            </p>
            <p className="mt-1 text-[9px] text-slate-400">10:00 · 50 min</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-800" />
              <p className="text-[10px] font-semibold text-slate-700">
                Secure message
              </p>
            </div>
            <p className="mt-4 text-[10px] leading-5 text-slate-500">
              “The grounding exercise helped before the presentation.”
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function DemoTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
        {eyebrow}
      </p>
      <h4 className="mt-1.5 text-lg font-semibold tracking-[-0.025em] text-slate-950">
        {title}
      </h4>
      <p className="mt-1 text-[10px] leading-5 text-slate-500">{description}</p>
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
                  <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${done ? "bg-emerald-50 text-emerald-700" : "bg-cyan-50 text-cyan-700"}`}>{done ? "Done" : "Open"}</span>
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
    return <div><ExplorerScreenTitle eyebrow="Self-regulation" title="Current routines" action="Add routine" onAction={()=>setNotice("Routine builder opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="space-y-3">{list.map((item,index)=>{const done=routines[item.key];return <ExplorerCard key={item.key} className="p-4" highlight={index===0}><div className="flex items-center justify-between gap-3"><button onClick={()=>setRoutines(c=>({...c,[item.key]:!done}))} className="flex items-center gap-3 text-left"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${done?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-400"}`}>{done?<Check className="h-3.5 w-3.5"/>:index+1}</span><div><p className="text-xs font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-[10px] text-slate-500">{item.meta}</p></div></button><ExplorerToggle enabled={done} onToggle={()=>setRoutines(c=>({...c,[item.key]:!done}))}/></div></ExplorerCard>})}</div></div>;
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
    return <div><ExplorerScreenTitle eyebrow="Research workspace" title="Studies" action="New study" onAction={()=>setNotice("A new draft study was created.")} secondary="Refresh" onSecondary={()=>setNotice("Study list refreshed.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><ExplorerMiniStat label="Active studies" value="4" helper="2 collecting today"/><ExplorerMiniStat label="Participants" value="128" helper="across live studies"/><ExplorerMiniStat label="Due today" value="7" helper="follow-ups + EMA"/></div><div className="my-3 flex flex-wrap gap-2">{(["All","Active","Draft"] as const).map(f=><button key={f} onClick={()=>setStudyFilter(f)} className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold ${studyFilter===f?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{f}</button>)}</div><div className="grid gap-3 sm:grid-cols-2">{studies.map((study,index)=><button key={study.name} onClick={()=>setSelectedStudy(study.name)} className="text-left"><ExplorerCard className="p-4" highlight={selectedStudy===study.name}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{study.name}</p><p className="mt-1 text-[9px] text-slate-400">{study.people} participants · updated {index+1}h ago</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${study.status==="Active"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{study.status}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600" style={{width:`${study.progress}%`}}/></div></ExplorerCard></button>)}</div></div>;
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
    return <div><ExplorerScreenTitle eyebrow="Custom Questionnaire" title="Image preference task" action="Preview" onAction={()=>setNotice("Participant preview opened.")} secondary="Save" onSecondary={()=>setNotice("Custom questionnaire saved.")}/>{notice&&<ExplorerNotice text={notice}/>}<ExplorerCard className="p-4" highlight><div className="grid gap-3 lg:grid-cols-[.72fr_1.28fr]"><div><p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Items</p><div className="space-y-2">{types.map(item=><button key={item} onClick={()=>setCustomItem(item)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[10px] font-medium ${customItem===item?"border-cyan-300 bg-cyan-50 text-cyan-800":"border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><span>{item}</span><ChevronRight className="h-3 w-3"/></button>)}</div></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-cyan-800">Live preview</p><p className="mt-1 text-[11px] font-semibold text-slate-800">{customItem}</p></div><span className="rounded-full bg-white px-2 py-1 text-[8px] text-slate-500">Required</span></div>{customItem==="Image choice"?<><p className="mt-4 text-[10px] font-semibold text-slate-800">Which image do you prefer?</p><div className="mt-3 grid grid-cols-2 gap-2">{['A','B'].map(opt=><button key={opt} onClick={()=>setCustomOption(opt)} className={`rounded-xl border bg-white p-3 text-left ${customOption===opt?"border-cyan-400 ring-2 ring-cyan-100":"border-slate-200"}`}><div className={`h-24 rounded-lg ${opt==='A'?"bg-gradient-to-br from-cyan-100 to-slate-100":"bg-gradient-to-br from-amber-100 to-slate-100"}`}/><p className="mt-2 text-[9px] font-medium text-slate-600">Option {opt}</p></button>)}</div></>:<div className="mt-4 space-y-3"><input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px]" defaultValue="Edit the item prompt here..."/><div className="h-24 rounded-xl border border-dashed border-slate-300 bg-white"/></div>}</div></div></ExplorerCard></div>;
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
    return <div><ExplorerScreenTitle eyebrow="Assessments" title={selectedClient} action="Assign measure" onAction={()=>setNotice("Measure picker opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="space-y-3">{measures.map((name,index)=>{const isAssigned=assigned.includes(name);return <ExplorerCard key={name} className="p-4" highlight={index===0}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[9px] text-slate-400">{isAssigned?"Assigned · completed 1 week ago":"Available to assign"}</p></div><div className="flex gap-2"><button onClick={()=>setNotice(`${name} result opened.`)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">Review</button><button onClick={()=>setAssigned(c=>isAssigned?c.filter(x=>x!==name):[...c,name])} className={`rounded-lg px-2.5 py-1.5 text-[8px] font-semibold ${isAssigned?"bg-emerald-50 text-emerald-700":"bg-slate-950 text-white"}`}>{isAssigned?"Assigned":"Assign"}</button></div></div></ExplorerCard>})}</div></div>;
  }

  if (slideId === "monitoring") {
    const values=monitorRange==="7d"?[42,68,55,80,61,73,66]:[35,48,52,60,55,72,64,70,78,68,72,75];
    return <div><ExplorerScreenTitle eyebrow="Monitoring" title="Shared daily data" action="Propose protocol" onAction={()=>setNotice("Protocol proposal builder opened.")} secondary="Request sharing" onSecondary={()=>setNotice("Sharing request opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="mb-3 flex gap-2">{(["7d","30d"] as const).map(r=><button key={r} onClick={()=>setMonitorRange(r)} className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold ${monitorRange===r?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{r}</button>)}</div><ExplorerCard className="p-4" highlight><div className="flex h-40 items-end gap-2 rounded-xl bg-slate-50 p-4">{values.map((height,index)=><button key={index} onClick={()=>setNotice(`Check-in ${index+1}: stress ${(height/15).toFixed(1)}.`)} className="flex-1 rounded-t-md bg-cyan-300 transition hover:bg-cyan-400" style={{height:`${height}px`}}/>)}</div><div className="mt-3 grid grid-cols-3 gap-2"><ExplorerMiniStat label="Check-ins" value="19"/><ExplorerMiniStat label="Completion" value="95%"/><ExplorerMiniStat label="Stress avg" value="4.1"/></div></ExplorerCard></div>;
  }

  if (slideId === "progress") {
    const isWell=progressMetric==="Well-being"; const vals=isWell?[48,50,57,61,66,71]:[82,75,70,64,58,52];
    return <div><ExplorerScreenTitle eyebrow="Progress" title="Longitudinal view"/><div className="mb-3 flex gap-2">{(["Well-being","Stress"] as const).map(x=><button key={x} onClick={()=>setProgressMetric(x)} className={`rounded-xl px-3 py-2 text-[9px] font-semibold ${progressMetric===x?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{x}</button>)}</div><ExplorerCard className="p-4" highlight><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">{progressMetric}</p><span className={`text-[10px] font-semibold ${isWell?"text-emerald-700":"text-cyan-700"}`}>{isWell?"Improving":"Decreasing"}</span></div><div className="mt-4 flex h-36 items-end gap-2 rounded-xl bg-slate-50 p-4">{vals.map((h,i)=><div key={i} className={`flex-1 rounded-t-md ${isWell?"bg-emerald-200":"bg-cyan-200"}`} style={{height:`${h}px`}}/>)}</div></ExplorerCard></div>;
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
                          <span title="Pinned" className="text-xs text-amber-500">
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
                    className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
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
                            ? "border-amber-200 bg-amber-50 text-amber-700"
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
    return <div><ExplorerScreenTitle eyebrow="Appointments" title="Today" action="New appointment" onAction={()=>setNotice("New appointment form opened.")} secondary="Calendar" onSecondary={()=>setNotice("Calendar view opened.")}/>{notice&&<ExplorerNotice text={notice}/>}<div className="space-y-2">{appts.map((item,index)=><button key={item} onClick={()=>setSelectedAppointment(item)} className="block w-full text-left"><ExplorerCard className="flex items-center justify-between p-4" highlight={selectedAppointment===item}><div><span className="text-[10px] font-semibold text-slate-700">{item}</span><p className="mt-1 text-[8px] text-slate-400">50 minute session · Milan time</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500">Confirmed</span><ChevronRight className="h-3.5 w-3.5 text-slate-300"/></div></ExplorerCard></button>)}</div></div>;
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
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">
                      Secure Messages
                    </h2>
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
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
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {messageEmailAlerts ? "✉ Email alerts on" : "✉ Email alerts off"}
                </button>

                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-800">
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
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
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

const explorerNavIcons: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-3.5 w-3.5" />,
  ai: <Sparkles className="h-3.5 w-3.5" />,
  assessments: <ClipboardList className="h-3.5 w-3.5" />,
  monitoring: <Activity className="h-3.5 w-3.5" />,
  regulation: <HeartPulse className="h-3.5 w-3.5" />,
  progress: <BarChart3 className="h-3.5 w-3.5" />,
  wearables: <MonitorSmartphone className="h-3.5 w-3.5" />,
  appointments: <CalendarDays className="h-3.5 w-3.5" />,
  messages: <MessageSquare className="h-3.5 w-3.5" />,
  notifications: <BellRing className="h-3.5 w-3.5" />,
  privacy: <ShieldCheck className="h-3.5 w-3.5" />,
  studies: <BookOpen className="h-3.5 w-3.5" />,
  "study-builder": <Workflow className="h-3.5 w-3.5" />,
  questionnaires: <ClipboardList className="h-3.5 w-3.5" />,
  ambulatory: <BellRing className="h-3.5 w-3.5" />,
  followups: <RefreshCw className="h-3.5 w-3.5" />,
  participants: <Users className="h-3.5 w-3.5" />,
  "participant-links": <Link2 className="h-3.5 w-3.5" />,
  "data-dashboard": <BarChart3 className="h-3.5 w-3.5" />,
  "data-explorer": <Database className="h-3.5 w-3.5" />,
  export: <FileDown className="h-3.5 w-3.5" />,
  ethics: <ShieldCheck className="h-3.5 w-3.5" />,
  team: <Users className="h-3.5 w-3.5" />,
  clients: <Users className="h-3.5 w-3.5" />,
  "client-overview": <LayoutDashboard className="h-3.5 w-3.5" />,
  notes: <FileText className="h-3.5 w-3.5" />,
  "care-pathway": <Workflow className="h-3.5 w-3.5" />,
  reports: <FileText className="h-3.5 w-3.5" />,
  permissions: <Lock className="h-3.5 w-3.5" />,
  settings: <Settings2 className="h-3.5 w-3.5" />,
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
        <div className="space-y-3">{links.map((link,index)=><ExplorerCard key={`${link.token}-${index}`} className="p-4" highlight={index===0}><div className="flex flex-wrap items-start justify-between gap-3"><div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${link.type==="TEST"?"bg-amber-50 text-amber-700":"bg-emerald-50 text-emerald-700"}`}>{link.type}</span><p className="mt-3 text-xs font-semibold text-slate-900">{link.name}</p><p className="mt-1 font-mono text-[8px] text-slate-400">psylattice.com/study/{link.token}</p></div><button onClick={()=>navigator.clipboard?.writeText(`https://psylattice.com/study/${link.token}`)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">Copy link</button></div></ExplorerCard>)}</div>
      </div>
    </div>
  );
}

function ResearchEthicsView() {
  const [consentVersion, setConsentVersion] = useState(1);
  return <div><ExplorerScreenTitle eyebrow="Ethics & Consent" title="Study governance" action="New consent version" onAction={()=>setConsentVersion(v=>v+1)}/><div className="grid gap-3 lg:grid-cols-2"><ExplorerCard className="p-4" highlight><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-900">Ethics approval</p><p className="mt-1 text-[9px] text-slate-400">Daily Stress in University Students</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-700">Approved</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><label className="text-[9px] font-semibold text-slate-500">Reference<input defaultValue="PSY-2026-041" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px]"/></label><label className="text-[9px] font-semibold text-slate-500">Approval date<input type="date" defaultValue="2026-06-12" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px]"/></label></div></ExplorerCard><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">Consent versions</p><div className="mt-3 space-y-2">{Array.from({length:consentVersion}).map((_,i)=><button key={i} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-left"><div><p className="text-[10px] font-semibold text-slate-700">Version {i+1}.0</p><p className="mt-0.5 text-[8px] text-slate-400">Participant information + consent items</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${i===consentVersion-1?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{i===consentVersion-1?"Active":"Archived"}</span></button>)}</div></ExplorerCard></div></div>;
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
  const [permission,setPermission]=useState({sleep:true,activity:true,heart:false});
  return <div><ExplorerScreenTitle eyebrow="Wearables & Physiology" title="Arjun K."/><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><ExplorerMiniStat label="Sleep" value="7h 11m" helper="7-day average"/><ExplorerMiniStat label="Steps" value="8,920" helper="daily average"/><ExplorerMiniStat label="Resting HR" value="61 bpm" helper="7-day average"/></div><ExplorerCard className="mt-3 p-4" highlight><div className="space-y-2">{([['sleep','Sleep summary'],['activity','Activity summary'],['heart','Heart-rate summary']] as const).map(([key,label])=><div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">{label}</p><p className="mt-0.5 text-[8px] text-slate-400">{permission[key]?"Shared by client":"Not shared by client"}</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${permission[key]?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{permission[key]?"Shared":"Private"}</span></div>)}</div></ExplorerCard></div>;
}

function ClinicalReportsView() {
  const [include,setInclude]=useState({assessments:true,monitoring:true,wearables:false,notes:false});
  return <div><ExplorerScreenTitle eyebrow="Reports" title="Clinical summary" action="Prepare report"/><div className="grid gap-3 lg:grid-cols-[.75fr_1.25fr]"><ExplorerCard className="p-4"><p className="text-xs font-semibold text-slate-900">Report content</p><div className="mt-3 space-y-2">{([['assessments','Assessment history'],['monitoring','Ambulatory monitoring'],['wearables','Wearable summary'],['notes','Professional notes']] as const).map(([key,label])=><div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><span className="text-[10px] font-medium text-slate-700">{label}</span><ExplorerToggle enabled={include[key]} onToggle={()=>setInclude(c=>({...c,[key]:!c[key]}))}/></div>)}</div></ExplorerCard><ExplorerCard className="p-5" highlight><p className="text-[9px] font-semibold uppercase tracking-[.14em] text-cyan-800">PsyLattice clinical summary</p><h4 className="mt-2 text-lg font-semibold text-slate-900">Arjun K.</h4><p className="mt-1 text-[9px] text-slate-400">Prepared 20 Aug 2026</p><div className="mt-5 space-y-4">{include.assessments&&<div><p className="text-[10px] font-semibold text-slate-800">Assessment history</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Latest Perceived Stress Scale score: 16.</p></div>}{include.monitoring&&<div><p className="text-[10px] font-semibold text-slate-800">Monitoring summary</p><p className="mt-1 text-[9px] leading-4 text-slate-500">86% scheduled check-in completion during the past seven days.</p></div>}{include.wearables&&<div><p className="text-[10px] font-semibold text-slate-800">Wearables</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Shared sleep and activity summaries included.</p></div>}{include.notes&&<div><p className="text-[10px] font-semibold text-slate-800">Professional notes</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Selected clinician-authored documentation included.</p></div>}</div></ExplorerCard></div></div>;
}

function ClinicalPermissionsView() {
  const [permissions] = useState({assessments:true,monitoring:true,progress:true,wearables:false,regulation:false});
  return <div><ExplorerScreenTitle eyebrow="Consent & Data Access" title="Arjun K."/><ExplorerCard className="p-4" highlight><p className="text-[10px] leading-5 text-slate-500">The client controls these categories from Self → Privacy & Sharing. Clinical reflects the resulting access state.</p><div className="mt-4 space-y-2">{Object.entries(permissions).map(([key,enabled])=><div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-semibold capitalize text-slate-700">{key}</p><p className="mt-0.5 text-[8px] text-slate-400">Category-specific permission</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${enabled?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{enabled?"Shared":"Not shared"}</span></div>)}</div></ExplorerCard></div>;
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
        {navGroups.map((group,gi)=><div key={group.label} className={`mb-6 ${collapsed&&gi>0?"border-t border-slate-100 pt-4":""}`}>{!collapsed&&<p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[.17em] text-slate-400">{group.label}</p>}<nav className="space-y-1">{group.items.map(item=>{const active=item.id===screen; return <button key={item.id} title={collapsed?item.title:undefined} onClick={()=>setScreen(item.id)} className={`flex w-full items-center rounded-xl py-2.5 text-[11px] transition ${collapsed?"justify-center px-2":"gap-3 px-3 text-left"} ${active?"bg-cyan-50 font-semibold text-cyan-900":"text-slate-500 hover:bg-slate-50 hover:text-slate-950"}`}><span className={active?"text-cyan-700":"text-slate-400"}>{explorerNavIcons[item.id]??<ChevronRight className="h-3.5 w-3.5"/>}</span>{!collapsed&&<span className="truncate">{item.title}</span>}</button>})}</nav></div>)}
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
    <div className="rounded-[30px] border border-slate-200 bg-[#edf1f1] p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">{workspaces.map(workspace=>{const Icon=workspace.icon; const selected=workspace.id===activeWorkspace; return <button key={workspace.id} onClick={()=>{onWorkspaceChange(workspace.id);setResetKey(0)}} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${selected?"border-slate-950 bg-slate-950 text-white":"border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900"}`}><Icon className="h-4 w-4"/>{workspace.id==="research"?"Researcher":workspace.navLabel}</button>})}</div>
        <button onClick={()=>setResetKey(v=>v+1)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Reset workspace</button>
      </div>
      <div key={`${explorerWorkspace}-${resetKey}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_90px_-50px_rgba(15,23,42,.34)]"><ExactWorkspaceEnvironment workspace={explorerWorkspace}/></div>
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
    <main className="min-h-screen bg-[#f7faf9] text-slate-950">
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
      `}</style>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f7faf9]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-8">
          <PsyLatticeLogo />

          <nav className="hidden items-center gap-7 text-sm text-slate-600 lg:flex">
            <a href="#platform" className="transition hover:text-slate-950">
              Platform
            </a>
            <a href="#research" className="transition hover:text-slate-950">
              Research
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
              className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
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
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
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
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Explore PsyLattice
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#platform"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-medium text-slate-800 transition hover:border-slate-400"
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

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
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
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
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
                Individuals subscribe to Self, clinicians can join for free,
                and researchers only pay when they publish a live study.
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
                          Most valuable
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
                        <span>You only pay when you launch a live study</span>
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
                free until launch
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
                    Choose the size of your live study.
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Build and test for free. Pay only when you publish for real
                    participant data collection.
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

              <div className="grid gap-4 p-6 md:grid-cols-3 sm:p-8">
                {activePricing.cards
                  .filter((card) =>
                    ["study-standard", "study-large", "participants"].includes(
                      card.id
                    )
                  )
                  .map((card) => (
                    <article
                      key={card.id}
                      className={`flex flex-col rounded-[22px] border bg-white p-6 ${
                        card.id === "study-large"
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

                        {card.id === "study-large" && (
                          <span className="rounded-full bg-cyan-950 px-3 py-1 text-[10px] font-semibold text-white">
                            1,000 participants
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

                        {card.id !== "participants" && (
                          <Link
                            href={card.ctaHref}
                            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                              card.id === "study-large"
                                ? "bg-cyan-950 text-white hover:bg-cyan-900"
                                : "bg-slate-950 text-white hover:bg-slate-800"
                            }`}
                          >
                            {card.ctaLabel}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        )}

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
