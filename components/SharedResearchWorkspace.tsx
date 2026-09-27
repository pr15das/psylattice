"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Database,
  FileDown,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Link2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import PsyLatticeCopilot from "@/components/PsyLatticeCopilot";
import StudyReviewManager from "@/components/StudyReviewManager";
import StudyHealthPanel from "@/components/StudyHealthPanel";
import SharedThesisReview from "@/components/SharedThesisReview";
import SharedDataAnalysisWorkspace from "@/components/SharedDataAnalysisWorkspace";
import SharedStudyBuilder from "@/components/SharedStudyBuilder";
import SharedRecruitmentWorkspace from "@/components/SharedRecruitmentWorkspace";
import SharedParticipantsWorkspace from "@/components/SharedParticipantsWorkspace";
import SharedExportWorkspace from "@/components/SharedExportWorkspace";

type AccessPayload = {
  allowed: boolean;
  access_type: "owner" | "collaborator" | null;
  role: string | null;
  study_id: string;
  study_title: string;
  owner_user_id: string | null;
  study_status: string | null;
  permissions: Record<string, boolean>;
};

type SharedScreen =
  | "overview"
  | "builder"
  | "recruitment"
  | "participants"
  | "explorer"
  | "analysis"
  | "writing"
  | "health"
  | "exports";

type NavItem = {
  id: SharedScreen;
  label: string;
  permission: string | null;
  icon: LucideIcon;
  description: string;
};

const NAVIGATION: NavItem[] = [
  {
    id: "overview",
    label: "Shared overview",
    permission: null,
    icon: LayoutDashboard,
    description: "Collaboration scope, permissions and study context.",
  },
  {
    id: "builder",
    label: "Study Builder",
    permission: "study_builder",
    icon: Workflow,
    description: "Study structure, measures, design and configuration.",
  },
  {
    id: "recruitment",
    label: "Recruitment",
    permission: "recruitment",
    icon: Link2,
    description: "Recruitment configuration and participant-link workflows.",
  },
  {
    id: "participants",
    label: "Participants",
    permission: "participants",
    icon: Users,
    description: "Participant operations allowed by the study owner.",
  },
  {
    id: "explorer",
    label: "Data Explorer",
    permission: "data_explorer",
    icon: Database,
    description: "Study-scoped data exploration and codebook tools.",
  },
  {
    id: "analysis",
    label: "Analysis Lab",
    permission: "analysis",
    icon: BarChart3,
    description: "Statistical analysis tools for this shared study.",
  },
  {
    id: "writing",
    label: "Thesis Builder",
    permission: "thesis",
    icon: FileText,
    description: "Study-linked research writing and document review.",
  },
  {
    id: "health",
    label: "Study Health",
    permission: "study_health",
    icon: ShieldCheck,
    description: "Research-readiness checks and review findings.",
  },
  {
    id: "exports",
    label: "Exports",
    permission: "exports",
    icon: FileDown,
    description: "Export access when explicitly granted by the study owner.",
  },
];

function roleLabel(role: string | null) {
  if (!role) return "Collaborator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function PermissionPill({
  children,
  tone = "cyan",
}: {
  children: React.ReactNode;
  tone?: "cyan" | "violet" | "neutral";
}) {
  const classes =
    tone === "violet"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : tone === "neutral"
        ? "border-stone-200 bg-white text-stone-600"
        : "border-cyan-200 bg-cyan-50 text-cyan-800";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${classes}`}>
      {children}
    </span>
  );
}

export default function SharedResearchWorkspace() {
  const params = useParams<{ studyId: string }>();
  const studyId = String(params?.studyId || "");
  const [access, setAccess] = useState<AccessPayload | null>(null);
  const [screen, setScreen] = useState<SharedScreen>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#f4f8fa";
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAccess() {
      if (!studyId) {
        setError("This shared-study link is incomplete.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/research/access?study_id=${encodeURIComponent(studyId)}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          },
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.ok || !payload?.access) {
          throw new Error(
            payload?.error || "PsyLattice could not resolve this shared workspace.",
          );
        }

        if (cancelled) return;

        const next = payload.access as AccessPayload;
        if (!next.allowed) {
          setError("You no longer have access to this shared study.");
          setAccess(null);
          return;
        }

        if (next.access_type !== "collaborator") {
          setError(
            "This route is reserved for shared studies. Open your own study from My Workspace instead.",
          );
          setAccess(null);
          return;
        }

        setAccess(next);
      } catch (failure) {
        if (!cancelled) {
          setError(
            failure instanceof Error
              ? failure.message
              : "PsyLattice could not open this shared workspace.",
          );
          setAccess(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAccess();

    return () => {
      cancelled = true;
    };
  }, [studyId]);

  const visibleNavigation = useMemo(() => {
    if (!access) return NAVIGATION.filter((item) => item.id === "overview");
    return NAVIGATION.filter(
      (item) =>
        item.permission === null ||
        access.permissions?.[item.permission] === true,
    );
  }, [access]);

  const selectedItem =
    visibleNavigation.find((item) => item.id === screen) ||
    visibleNavigation[0] ||
    NAVIGATION[0];

  function navigate(target: string) {
    const matched = visibleNavigation.find((item) => item.id === target);
    if (matched) setScreen(matched.id);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f8fa]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-200 bg-white px-5 py-4 text-sm text-stone-600 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
            Opening shared workspace…
          </div>
        </div>
      </main>
    );
  }

  if (error || !access) {
    return (
      <main className="min-h-screen bg-[#f4f8fa] px-5 py-10">
        <div className="mx-auto max-w-xl rounded-[28px] border border-violet-200 bg-white p-7 shadow-[0_24px_80px_rgba(15,23,42,.08)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-stone-950">
            Shared workspace unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {error || "You do not currently have access to this shared study."}
          </p>
          <Link
            href="/researcher"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Workspace
          </Link>
        </div>
      </main>
    );
  }

  const edit = access.permissions?.can_edit === true;
  const comment = access.permissions?.can_comment === true;
  const review = access.permissions?.can_review === true;

  return (
    <main className="psylattice-research-ui min-h-[100dvh] bg-[#f4f8fa] text-slate-950" style={{ background: "#f4f8fa", backgroundColor: "#f4f8fa" }}>
      <div className="sticky top-0 z-40 border-b border-cyan-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1700px] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl border border-cyan-200 bg-white p-1.5 shadow-sm">
              <PsyLatticeLogo />
            </div>
            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-stone-950">
                  Shared Workspace
                </p>
                <PermissionPill>{roleLabel(access.role)}</PermissionPill>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-stone-500">
                {access.study_title}
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-1.5 md:flex">
              {edit && <PermissionPill>Edit</PermissionPill>}
              {comment && <PermissionPill>Comment</PermissionPill>}
              {review && <PermissionPill>Review</PermissionPill>}
            </div>

            <Link
              href="/researcher"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-white px-3 py-2 text-[11px] font-semibold text-cyan-900 shadow-sm transition hover:bg-cyan-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              My Workspace
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1700px] grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[235px_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-[26px] border border-cyan-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,.07)] lg:sticky lg:top-[82px]">
          <div className="border-b border-cyan-100 bg-gradient-to-br from-cyan-50 to-violet-50/35 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-sm">
                <FlaskConical className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-stone-900">
                  {access.study_title}
                </p>
                <p className="mt-0.5 text-[9px] capitalize text-stone-500">
                  {access.study_status || "study"} · shared
                </p>
              </div>
            </div>
          </div>

          <nav className="max-h-[calc(100vh-180px)] space-y-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              const active = selectedItem.id === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScreen(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    active
                      ? "bg-cyan-500 text-white shadow-[0_8px_20px_rgba(8,145,178,.20)]"
                      : "text-stone-600 hover:bg-cyan-50 hover:text-cyan-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <StudyReviewManager
            studyId={studyId}
            currentScreen={screen}
            triggerVariant="sidebar"
          />

          <div className="border-t border-violet-100 bg-violet-50/55 px-4 py-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
              <p className="text-[8.5px] leading-4 text-violet-800">
                Owner-controlled workspace. Your access can be changed or revoked at any time.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="overflow-hidden rounded-[28px] border border-cyan-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,.07)]">
            <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50/90 via-white to-violet-50/45 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cyan-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-white">
                      Shared
                    </span>
                    <span className="text-[10px] font-semibold text-violet-600">
                      {roleLabel(access.role)} mode
                    </span>
                  </div>
                  <h1 className="mt-3 text-2xl font-semibold tracking-[-.03em] text-stone-950">
                    {selectedItem.label}
                  </h1>
                  <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-stone-500">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <PermissionPill tone={edit ? "cyan" : "neutral"}>
                    {edit ? "Editing allowed" : "Read-only"}
                  </PermissionPill>
                  {review && <PermissionPill>Review enabled</PermissionPill>}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {screen === "overview" ? (
                <SharedOverview
                  access={access}
                  visibleNavigation={visibleNavigation}
                  onOpen={setScreen}
                />
              ) : screen === "builder" ? (
                <SharedStudyBuilder studyId={studyId} />
              ) : screen === "recruitment" ? (
                <SharedRecruitmentWorkspace studyId={studyId} />
              ) : screen === "participants" ? (
                <SharedParticipantsWorkspace studyId={studyId} />
              ) : screen === "explorer" ? (
                <SharedDataAnalysisWorkspace studyId={studyId} mode="explorer" />
              ) : screen === "analysis" ? (
                <SharedDataAnalysisWorkspace studyId={studyId} mode="analysis" />
              ) : screen === "writing" ? (
                <SharedThesisReview studyId={studyId} />
              ) : screen === "exports" ? (
                <SharedExportWorkspace studyId={studyId} />
              ) : screen === "health" ? (
                <div className="shared-study-health [&_[data-psylattice-semantic-audit-panel]]:hidden">
                  <StudyHealthPanel
                    studyId={studyId}
                    onNavigate={(target) => navigate(String(target))}
                  />
                  <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/55 px-4 py-3">
                    <p className="text-[9px] leading-4 text-violet-800">
                      Study Health summarizes this shared study using the research data available to your collaboration role. AI-assisted actions use your personal PsyLattice AI allowance.
                    </p>
                  </div>
                </div>
              ) : (
                <ModuleBridgeCard item={selectedItem} />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/65 px-4 py-3">
            <p className="text-[9px] leading-4 text-cyan-900">
              <span className="font-semibold">Shared-workspace billing:</span>{" "}
              AI usage comes from your own PsyLattice AI allowance. This shared study does not consume one of your simultaneous-study slots. Participant capacity, study passes, storage, messaging and other study-specific add-ons remain attached to the study owner.
            </p>
          </div>
        </section>
      </div>

      <PsyLatticeCopilot
        currentScreen={screen}
        preferredStudyId={studyId}
        onNavigate={navigate}
      />
    </main>
  );
}

function SharedOverview({
  access,
  visibleNavigation,
  onOpen,
}: {
  access: AccessPayload;
  visibleNavigation: NavItem[];
  onOpen: (screen: SharedScreen) => void;
}) {
  const moduleItems = visibleNavigation.filter((item) => item.id !== "overview");

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/55 p-4">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-cyan-700">
            Role
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-950">
            {roleLabel(access.role)}
          </p>
          <p className="mt-1 text-[9px] text-stone-500">
            Assigned by the study owner
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-white p-4">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-cyan-700">
            Modules
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-950">
            {moduleItems.length}
          </p>
          <p className="mt-1 text-[9px] text-stone-500">
            currently available to you
          </p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50/45 p-4">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-violet-600">
            Workspace boundary
          </p>
          <p className="mt-2 text-sm font-semibold text-stone-950">
            Shared study only
          </p>
          <p className="mt-1 text-[9px] text-stone-500">
            Your own studies remain in My Workspace and this shared study does not use your study slot.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-cyan-700" />
          <h2 className="text-sm font-semibold text-stone-950">
            Available research modules
          </h2>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {moduleItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(item.id)}
                className="group rounded-2xl border border-stone-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_12px_28px_rgba(8,145,178,.10)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 transition group-hover:bg-cyan-500 group-hover:text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-cyan-600">→</span>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-stone-900">
                  {item.label}
                </p>
                <p className="mt-1 text-[9px] leading-4 text-stone-500">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ModuleBridgeCard({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <div className="rounded-[24px] border border-cyan-200 bg-gradient-to-br from-white to-cyan-50/45 p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-[0_8px_22px_rgba(8,145,178,.20)]">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-stone-950">
        {item.label} access is active
      </h2>
      <p className="mt-2 max-w-2xl text-[11px] leading-5 text-stone-600">
        This module is not available in the shared workspace for this study.
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[9px] font-semibold text-violet-700">
        <LockKeyhole className="h-3.5 w-3.5" />
        Ask the study owner to review your module permissions if you need access.
      </div>
    </div>
  );
}
