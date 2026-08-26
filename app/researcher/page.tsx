"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarClock,
  Database,
  FileDown,
  FlaskConical,
  LayoutDashboard,
  Link2,
  ShieldCheck,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import AccountSwitcher from "@/components/AccountSwitcher";
import FollowupManager from "@/components/FollowupManager";
import ResearchAiAssistant from "@/components/ResearchAiAssistant";
import CognitiveLab from "../../components/CognitiveLab";
import {
  buildCognitiveAttachmentAnalysis,
  compareConditions,
  type CognitiveAttachmentAnalysis,
  type PairedComparison,
} from "@/lib/research/cognitiveAnalysis";
import {
  AmbulatoryProtocolBuilder,
  defaultAmbulatoryProtocol,
  nestAmbulatoryProtocol,
  serializeAmbulatoryProtocol,
  validateAmbulatoryProtocol,
  type AmbulatoryScheduleDraft,
  type AmbulatoryQuestionnaireOption,
} from "@/components/AmbulatoryProtocolBuilder";

type Screen =
  | "dashboard"
  | "studies"
  | "builder"
  | "library"
  | "cognitive"
  | "ambulatory"
  | "followup"
  | "participants"
  | "links"
  | "data"
  | "explorer"
  | "exports"
  | "ethics"
  | "team";

const navigation: {
  id: Screen;
  label: string;
  group: "Research" | "Data" | "Governance";
}[] = [
  { id: "dashboard", label: "Dashboard", group: "Research" },
  { id: "studies", label: "Studies", group: "Research" },
  { id: "builder", label: "Study Builder", group: "Research" },
  { id: "library", label: "Questionnaire Library", group: "Research" },
  { id: "cognitive", label: "Cognitive Lab", group: "Research" },
  { id: "ambulatory", label: "Ambulatory Assessment", group: "Research" },
  { id: "followup", label: "Follow-up Manager", group: "Research" },
  { id: "participants", label: "Participants", group: "Research" },
  { id: "links", label: "Participant Links", group: "Research" },

  { id: "data", label: "Data Dashboard", group: "Data" },
  { id: "explorer", label: "Data Explorer", group: "Data" },
  { id: "exports", label: "Export Data", group: "Data" },

  { id: "ethics", label: "Ethics & Consent", group: "Governance" },
  { id: "team", label: "Team & Permissions", group: "Governance" },
];

const sidebarIcons: Record<Screen, LucideIcon> = {
  dashboard: LayoutDashboard,
  studies: FlaskConical,
  builder: Workflow,
  library: BookOpen,
  cognitive: BrainCircuit,
  ambulatory: Activity,
  followup: CalendarClock,
  participants: Users,
  links: Link2,
  data: BarChart3,
  explorer: Database,
  exports: FileDown,
  ethics: ShieldCheck,
  team: Users,
};

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4 10h11M11 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4.5 10.5 8 14l7.5-8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-slate-300/65 bg-white p-5 shadow-[0_4px_12px_rgba(15,23,42,0.055),0_18px_44px_rgba(15,23,42,0.085)] transition-shadow hover:shadow-[0_4px_10px_rgba(15,23,42,0.045),0_18px_40px_rgba(15,23,42,0.07)]">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/80" aria-hidden="true" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      </div>

      <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.035em] text-slate-950">{value}</p>

      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-300/65 bg-white shadow-[0_5px_14px_rgba(15,23,42,0.05),0_20px_52px_rgba(15,23,42,0.075)]">
      <div className="border-b border-slate-100/90 px-5 py-4 sm:px-6 sm:py-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.012em] text-slate-950">{title}</h2>

        {description && (
          <p className="mt-1.5 max-w-4xl text-[13px] leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ProgressBar({
  label,
  value,
  text,
}: {
  label: string;
  value: number;
  text: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{text}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-cyan-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Status({
  children,
  type = "neutral",
}: {
  children: React.ReactNode;
  type?: "neutral" | "success" | "warning" | "accent";
}) {
  const classes = {
    neutral: "border-slate-300/70 bg-white text-slate-600",
    success: "border-cyan-300/70 bg-[#ecfbff] text-cyan-800",
    warning: "border-violet-200/90 bg-violet-50/80 text-violet-800",
    accent: "border-cyan-200/90 bg-cyan-50/85 text-cyan-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-1 text-[11px] font-semibold shadow-[0_2px_5px_rgba(15,23,42,0.04)] ${classes[type]}`}
    >
      {children}
    </span>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  type DashboardStudy = {
    id: string;
    title: string;
    design: string | null;
    target_sample_size: number | null;
    status: string;
    components: Record<string, boolean>;
    updated_at: string;
  };

  type DashboardParticipant = {
    study_id: string;
    is_test: boolean;
    status: string;
  };

  type DashboardLink = {
    study_id: string;
    is_test_link: boolean;
    status: string;
  };

  const [studies, setStudies] = useState<DashboardStudy[]>([]);
  const [participants, setParticipants] = useState<DashboardParticipant[]>([]);
  const [links, setLinks] = useState<DashboardLink[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoadingDashboard(true);
      setDashboardError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setDashboardError("Your research dashboard could not be loaded.");
        setLoadingDashboard(false);
        return;
      }

      const [studyResult, participantResult, linkResult] = await Promise.all([
        supabase
          .from("research_studies")
          .select(
            "id, title, design, target_sample_size, status, components, updated_at"
          )
          .eq("owner_user_id", user.id)
          .order("updated_at", { ascending: false }),

        supabase
          .from("study_participants")
          .select("study_id, is_test, status")
          .eq("owner_user_id", user.id),

        supabase
          .from("study_links")
          .select("study_id, is_test_link, status")
          .eq("owner_user_id", user.id),
      ]);

      if (studyResult.error) {
        console.error("Could not load research studies:", studyResult.error);
        setDashboardError("Your saved studies could not be loaded.");
        setLoadingDashboard(false);
        return;
      }

      if (participantResult.error) {
        console.error(
          "Could not load research participants:",
          participantResult.error
        );
      }

      if (linkResult.error) {
        console.error("Could not load recruitment links:", linkResult.error);
      }

      setStudies((studyResult.data || []) as DashboardStudy[]);
      setParticipants(
        (participantResult.data || []) as DashboardParticipant[]
      );
      setLinks((linkResult.data || []) as DashboardLink[]);
      setLoadingDashboard(false);
    }

    void loadDashboard();
  }, []);

  function statusType(status: string) {
    if (status === "active" || status === "completed") {
      return "success" as const;
    }

    if (status === "ready_for_review") {
      return "accent" as const;
    }

    if (status === "draft") {
      return "warning" as const;
    }

    return "neutral" as const;
  }

  function statusLabel(status: string) {
    const labels: Record<string, string> = {
      draft: "Draft",
      ready_for_review: "Ready for review",
      active: "Active",
      paused: "Paused",
      completed: "Completed",
      archived: "Archived",
    };

    return labels[status] || status.replaceAll("_", " ");
  }

  function componentSummary(components: Record<string, boolean>) {
    const labels: Array<[string, string]> = [
      ["demographics", "Demographics"],
      ["baseline", "Baseline"],
      ["ambulatory", "EMA / ESM"],
      ["followup", "Follow-up"],
      ["wearables", "Wearables"],
    ];

    const enabled = labels
      .filter(([key]) => Boolean(components?.[key]))
      .map(([, label]) => label);

    return enabled.length > 0 ? enabled.join(" · ") : "No study components selected";
  }

  function liveParticipantsForStudy(studyId: string) {
    return participants.filter(
      (participant) =>
        participant.study_id === studyId &&
        !participant.is_test &&
        participant.status !== "withdrawn"
    ).length;
  }

  function activeLiveLinksForStudy(studyId: string) {
    return links.filter(
      (link) =>
        link.study_id === studyId &&
        !link.is_test_link &&
        link.status === "active"
    ).length;
  }

  const activeStudies = studies.filter((study) => study.status === "active");
  const draftStudies = studies.filter((study) => study.status === "draft");

  const liveParticipants = participants.filter(
    (participant) =>
      !participant.is_test && participant.status !== "withdrawn"
  );

  const completedParticipants = liveParticipants.filter(
    (participant) => participant.status === "completed"
  ).length;

  const testParticipants = participants.filter(
    (participant) => participant.is_test
  ).length;

  const liveRecruitmentLinks = links.filter(
    (link) => !link.is_test_link && link.status === "active"
  ).length;

  const studiesWithoutLiveLink = studies.filter(
    (study) =>
      ["active", "ready_for_review"].includes(study.status) &&
      activeLiveLinksForStudy(study.id) === 0
  ).length;

  const latestStudy = studies[0] || null;

  const latestStudyParticipants = latestStudy
    ? liveParticipantsForStudy(latestStudy.id)
    : 0;

  const latestTarget = latestStudy?.target_sample_size || null;

  const latestRecruitmentPercent =
    latestTarget && latestTarget > 0
      ? Math.min(
          100,
          Math.round((latestStudyParticipants / latestTarget) * 100)
        )
      : 0;

  const completionPercent =
    liveParticipants.length > 0
      ? Math.round(
          (completedParticipants / liveParticipants.length) * 100
        )
      : 0;

  return (
    <div className="space-y-5">
      {dashboardError && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm text-red-700">{dashboardError}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active studies"
          value={loadingDashboard ? "..." : String(activeStudies.length)}
          detail={`${liveRecruitmentLinks} active live recruitment link${
            liveRecruitmentLinks === 1 ? "" : "s"
          }`}
        />

        <StatCard
          label="Live participants"
          value={loadingDashboard ? "..." : String(liveParticipants.length)}
          detail="Excludes test participants and withdrawals"
        />

        <StatCard
          label="Completed"
          value={loadingDashboard ? "..." : String(completedParticipants)}
          detail={
            liveParticipants.length > 0
              ? `${completionPercent}% of live participants`
              : "No live completions yet"
          }
        />

        <StatCard
          label="Test participants"
          value={loadingDashboard ? "..." : String(testParticipants)}
          detail="Kept separate from live research"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title="Your studies"
          description="Your most recently updated studies from Supabase."
        >
          {loadingDashboard ? (
            <p className="text-sm text-slate-500">Loading your studies...</p>
          ) : studies.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium">No saved studies yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create a study in Study Builder and save the draft. It will
                appear here automatically.
              </p>
              <button
                type="button"
                onClick={() => changeScreen("builder")}
                className="mt-4 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"
              >
                Create study
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {studies.slice(0, 5).map((study) => {
                  const participantCount =
                    liveParticipantsForStudy(study.id);

                  return (
                    <div
                      key={study.id}
                      className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">{study.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {study.design || "Study design not specified"} ·{" "}
                          {participantCount} live participant
                          {participantCount === 1 ? "" : "s"}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {componentSummary(study.components || {})}
                        </p>
                      </div>

                      <Status type={statusType(study.status)}>
                        {statusLabel(study.status)}
                      </Status>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => changeScreen("studies")}
                className="mt-5 flex items-center gap-2 text-sm font-semibold"
              >
                View all studies
                <ArrowIcon />
              </button>
            </>
          )}
        </Panel>

        <Panel title="Research workspace status">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">Draft studies</p>
                <Status type={draftStudies.length > 0 ? "warning" : "success"}>
                  {draftStudies.length}
                </Status>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Saved studies that have not been activated.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">
                  Studies without live recruitment
                </p>
                <Status
                  type={studiesWithoutLiveLink > 0 ? "warning" : "success"}
                >
                  {studiesWithoutLiveLink}
                </Status>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Active or review-ready studies without an active live link.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">Test participants</p>
                <Status type="accent">{testParticipants}</Status>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Test records remain identifiable and separate from live data.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Quick actions"
        description="Continue your most common research workflows."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Create study",
              text: "Build a new survey or longitudinal protocol.",
              screen: "builder" as Screen,
            },
            {
              title: "Find questionnaire",
              text: "Browse approved and licensed measures.",
              screen: "library" as Screen,
            },
            {
              title: "Create participant link",
              text: "Create a TEST or live recruitment link.",
              screen: "links" as Screen,
            },
            {
              title: "View participants",
              text: "Inspect real participant and test records.",
              screen: "participants" as Screen,
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => changeScreen(item.screen)}
              className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.text}
              </p>
            </button>
          ))}
        </div>
      </Panel>

      {latestStudy && (
        <Panel
          title="Latest study"
          description="A live summary of your most recently updated study."
        >
          <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Status type={statusType(latestStudy.status)}>
                  {statusLabel(latestStudy.status)}
                </Status>
                <span className="text-xs text-slate-400">
                  Updated{" "}
                  {new Date(latestStudy.updated_at).toLocaleDateString()}
                </span>
              </div>

              <h3 className="mt-4 text-xl font-semibold">
                {latestStudy.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {latestStudy.design || "Study design not specified"}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {componentSummary(latestStudy.components || {})}
              </p>

              <button
                type="button"
                onClick={() => changeScreen("studies")}
                className="mt-5 flex items-center gap-2 text-sm font-semibold text-cyan-800"
              >
                Open studies
                <ArrowIcon />
              </button>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                Recruitment
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {latestTarget
                  ? `${latestStudyParticipants} / ${latestTarget}`
                  : latestStudyParticipants}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {latestTarget
                  ? `${latestRecruitmentPercent}% of recruitment target`
                  : "Live participants enrolled"}
              </p>

              {latestTarget && (
                <div className="mt-5">
                  <ProgressBar
                    label="Participant target"
                    value={latestRecruitmentPercent}
                    text={`${latestStudyParticipants} / ${latestTarget}`}
                  />
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatCard
                  label="Live links"
                  value={String(activeLiveLinksForStudy(latestStudy.id))}
                  detail="Active recruitment"
                />
                <StatCard
                  label="Participants"
                  value={String(latestStudyParticipants)}
                  detail="Live, non-withdrawn"
                />
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* =========================================================
   STUDIES
   ========================================================= */

function Studies({
  changeScreen,
  editStudy,
}: {
  changeScreen: (screen: Screen) => void;
  editStudy: (studyId: string) => void;
}) {
  type ResearchStudy = {
    id: string;
    title: string;
    participant_description: string | null;
    design: string | null;
    target_sample_size: number | null;
    status: string;
    components: Record<string, boolean>;
    created_at: string;
    updated_at: string;
  };

  type StudyParticipantSummary = {
    study_id: string;
    is_test: boolean;
    status: string;
  };

  type StudyLinkSummary = {
    study_id: string;
    is_test_link: boolean;
    status: string;
  };

  type StudyMeasureSummary = {
    study_id: string;
  };

  const [studies, setStudies] = useState<ResearchStudy[]>([]);
  const [participants, setParticipants] = useState<StudyParticipantSummary[]>(
    []
  );
  const [links, setLinks] = useState<StudyLinkSummary[]>([]);
  const [measures, setMeasures] = useState<StudyMeasureSummary[]>([]);

  const [loadingStudies, setLoadingStudies] = useState(true);
  const [studiesError, setStudiesError] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [updatingStudyId, setUpdatingStudyId] = useState("");
  const [studyActionMessage, setStudyActionMessage] = useState("");
  const [studyActionError, setStudyActionError] = useState("");
  const [deleteStudyTarget, setDeleteStudyTarget] =
    useState<ResearchStudy | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingStudy, setDeletingStudy] = useState(false);

  useEffect(() => {
    async function loadStudies() {
      setLoadingStudies(true);
      setStudiesError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStudiesError("Your studies could not be loaded.");
        setLoadingStudies(false);
        return;
      }

      const [studyResult, participantResult, linkResult, measureResult] =
        await Promise.all([
          supabase
            .from("research_studies")
            .select(
              "id, title, participant_description, design, target_sample_size, status, components, created_at, updated_at"
            )
            .eq("owner_user_id", user.id)
            .order("updated_at", { ascending: false }),

          supabase
            .from("study_participants")
            .select("study_id, is_test, status")
            .eq("owner_user_id", user.id),

          supabase
            .from("study_links")
            .select("study_id, is_test_link, status")
            .eq("owner_user_id", user.id),

          supabase
            .from("study_measures")
            .select("study_id")
            .eq("owner_user_id", user.id),
        ]);

      if (studyResult.error) {
        console.error("Could not load studies:", studyResult.error);
        setStudiesError("Your saved studies could not be loaded.");
        setLoadingStudies(false);
        return;
      }

      if (participantResult.error) {
        console.error(
          "Could not load study participants:",
          participantResult.error
        );
      }

      if (linkResult.error) {
        console.error("Could not load study links:", linkResult.error);
      }

      if (measureResult.error) {
        console.error("Could not load study measures:", measureResult.error);
      }

      const studyRows = (studyResult.data || []) as ResearchStudy[];

      setStudies(studyRows);
      setParticipants(
        (participantResult.data || []) as StudyParticipantSummary[]
      );
      setLinks((linkResult.data || []) as StudyLinkSummary[]);
      setMeasures((measureResult.data || []) as StudyMeasureSummary[]);

      if (studyRows.length > 0) {
        setSelectedStudyId((current) =>
          studyRows.some((study) => study.id === current)
            ? current
            : studyRows[0].id
        );
      }

      setLoadingStudies(false);
    }

    void loadStudies();
  }, []);

  function statusType(status: string) {
    if (status === "active" || status === "completed") {
      return "success" as const;
    }

    if (status === "ready_for_review") {
      return "accent" as const;
    }

    if (status === "draft") {
      return "warning" as const;
    }

    return "neutral" as const;
  }

  function statusLabel(status: string) {
    const labels: Record<string, string> = {
      draft: "Draft",
      ready_for_review: "Ready for review",
      active: "Active",
      paused: "Paused",
      completed: "Completed",
      archived: "Archived",
    };

    return labels[status] || status.replaceAll("_", " ");
  }

  const studyStatusOptions = [
    "draft",
    "ready_for_review",
    "active",
    "paused",
    "completed",
    "archived",
  ];

  async function updateStudyStatus(
    studyId: string,
    nextStatus: string
  ) {
    if (updatingStudyId || !studyId) {
      return;
    }

    setUpdatingStudyId(studyId);
    setStudyActionMessage("");
    setStudyActionError("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStudyActionError(
        "Your study status could not be changed."
      );
      setUpdatingStudyId("");
      return;
    }

    const updatedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("research_studies")
      .update({
        status: nextStatus,
        updated_at: updatedAt,
      })
      .eq("id", studyId)
      .eq("owner_user_id", user.id)
      .select(
        "id, title, participant_description, design, target_sample_size, status, components, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      console.error(
        "Could not update study status:",
        error
      );
      setStudyActionError(
        error?.message ||
          "The study status could not be changed."
      );
      setUpdatingStudyId("");
      return;
    }

    setStudies((current) =>
      current.map((study) =>
        study.id === studyId
          ? (data as ResearchStudy)
          : study
      )
    );

    setStudyActionMessage(
      `${data.title} is now ${statusLabel(
        data.status
      ).toLowerCase()}.`
    );
    setUpdatingStudyId("");
  }

  async function deleteStudyPermanently() {
    const study = deleteStudyTarget;

    if (
      !study ||
      deletingStudy ||
      deleteConfirmation !== study.title
    ) {
      return;
    }

    setDeletingStudy(true);
    setStudyActionMessage("");
    setStudyActionError("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStudyActionError(
        "The study could not be deleted."
      );
      setDeletingStudy(false);
      return;
    }

    const { error } = await supabase
      .from("research_studies")
      .delete()
      .eq("id", study.id)
      .eq("owner_user_id", user.id);

    if (error) {
      console.error("Could not delete study:", error);
      setStudyActionError(
        error.message ||
          "The study could not be deleted."
      );
      setDeletingStudy(false);
      return;
    }

    const remainingStudies = studies.filter(
      (candidate) => candidate.id !== study.id
    );

    setStudies(remainingStudies);
    setParticipants((current) =>
      current.filter(
        (participant) =>
          participant.study_id !== study.id
      )
    );
    setLinks((current) =>
      current.filter(
        (link) => link.study_id !== study.id
      )
    );
    setMeasures((current) =>
      current.filter(
        (measure) => measure.study_id !== study.id
      )
    );

    setSelectedStudyId(
      remainingStudies[0]?.id || ""
    );
    setDeleteStudyTarget(null);
    setDeleteConfirmation("");
    setDeletingStudy(false);
    setStudyActionMessage(
      `${study.title} was permanently deleted.`
    );
  }

  function componentLabels(study: ResearchStudy) {
    const available: Array<[string, string]> = [
      ["consent", "Consent"],
      ["demographics", "Demographics"],
      ["baseline", "Baseline questionnaires"],
      ["ambulatory", "Ambulatory / EMA"],
      ["followup", "Follow-up"],
      ["wearables", "Wearables"],
      ["passive", "Passive context"],
      ["uploads", "Participant uploads"],
    ];

    return available
      .filter(([key]) => Boolean(study.components?.[key]))
      .map(([, label]) => label);
  }

  function liveParticipantCount(studyId: string) {
    return participants.filter(
      (participant) =>
        participant.study_id === studyId &&
        !participant.is_test &&
        participant.status !== "withdrawn"
    ).length;
  }

  function testParticipantCount(studyId: string) {
    return participants.filter(
      (participant) =>
        participant.study_id === studyId && participant.is_test
    ).length;
  }

  function activeLiveLinkCount(studyId: string) {
    return links.filter(
      (link) =>
        link.study_id === studyId &&
        !link.is_test_link &&
        link.status === "active"
    ).length;
  }

  function testLinkCount(studyId: string) {
    return links.filter(
      (link) => link.study_id === studyId && link.is_test_link
    ).length;
  }

  function measureCount(studyId: string) {
    return measures.filter((measure) => measure.study_id === studyId).length;
  }

  const statusForFilter: Record<string, string[]> = {
    All: [],
    Draft: ["draft"],
    Review: ["ready_for_review"],
    Active: ["active", "paused"],
    Completed: ["completed"],
    Archived: ["archived"],
  };

  const filteredStudies = studies.filter((study) => {
    const allowedStatuses = statusForFilter[filter] || [];
    const statusMatches =
      allowedStatuses.length === 0 ||
      allowedStatuses.includes(study.status);

    const query = search.trim().toLowerCase();
    const searchMatches =
      !query ||
      study.title.toLowerCase().includes(query) ||
      (study.design || "").toLowerCase().includes(query);

    return statusMatches && searchMatches;
  });

  const selectedStudy =
    studies.find((study) => study.id === selectedStudyId) || null;

  return (
    <div className="space-y-5">
      {studiesError && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm text-red-700">{studiesError}</p>
        </div>
      )}

      {studyActionError && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm text-red-700">
            {studyActionError}
          </p>
        </div>
      )}

      {studyActionMessage && (
        <div className="border-l-2 border-cyan-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm text-cyan-800">
            {studyActionMessage}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {["All", "Draft", "Review", "Active", "Completed", "Archived"].map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-2 text-xs font-medium ${
                  filter === item
                    ? "border-cyan-700 bg-cyan-50 text-cyan-900"
                    : "border-slate-300/70 bg-white text-slate-500"
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your studies..."
            className="min-w-[260px] rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)] outline-none focus:border-cyan-700"
          />

          <button
            type="button"
            onClick={() => editStudy("")}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            + New study
          </button>
        </div>
      </div>

      <Panel
        title="Your studies"
        description="Saved directly from your PsyLattice Study Builder."
      >
        {loadingStudies ? (
          <p className="text-sm text-slate-500">Loading your studies...</p>
        ) : studies.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No saved studies yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a study and use Save draft in the Study Builder. It will
              appear here automatically.
            </p>
            <button
              type="button"
              onClick={() => editStudy("")}
              className="mt-4 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"
            >
              Create your first study
            </button>
          </div>
        ) : filteredStudies.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No studies match this view</p>
            <p className="mt-2 text-sm text-slate-500">
              Change the status filter or search term.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudies.map((study) => {
              const participantCount = liveParticipantCount(study.id);
              const target = study.target_sample_size;
              const selected = selectedStudyId === study.id;

              return (
                <div
                  key={study.id}
                  className={`grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_170px_150px_100px] md:items-center ${
                    selected ? "rounded-xl bg-cyan-50/40 px-3" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{study.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {study.design || "Study design not specified"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {componentLabels(study).join(" · ") ||
                        "No study components selected"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Participants</p>
                    <p className="mt-1 text-sm font-medium">
                      {target
                        ? `${participantCount} / ${target}`
                        : participantCount}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {testParticipantCount(study.id)} test
                    </p>
                  </div>

                  <div>
                    <select
                      value={study.status}
                      disabled={
                        updatingStudyId === study.id
                      }
                      onChange={(event) =>
                        void updateStudyStatus(
                          study.id,
                          event.target.value
                        )
                      }
                      aria-label={`Change status for ${study.title}`}
                      className="w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-cyan-700 disabled:opacity-50"
                    >
                      {studyStatusOptions.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {statusLabel(status)}
                          </option>
                        )
                      )}
                    </select>

                    <p className="mt-2 text-[11px] text-slate-400">
                      {updatingStudyId === study.id
                        ? "Updating status..."
                        : `Updated ${new Date(
                            study.updated_at
                          ).toLocaleDateString()}`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedStudyId(study.id)}
                    className="text-left text-sm font-semibold text-cyan-800"
                  >
                    {selected ? "Opened" : "Open"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {selectedStudy && (
        <Panel
          title={selectedStudy.title}
          description="Study overview from your saved configuration."
        >
          <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Status type={statusType(selectedStudy.status)}>
                  {statusLabel(selectedStudy.status)}
                </Status>
                <span className="text-xs text-slate-400">
                  Created{" "}
                  {new Date(selectedStudy.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="mt-5 text-sm font-medium">
                {selectedStudy.design || "Study design not specified"}
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-500">
                {selectedStudy.participant_description ||
                  "No participant-facing description has been saved yet."}
              </p>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-[0.13em] text-slate-400">
                  Components
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {componentLabels(selectedStudy).length > 0 ? (
                    componentLabels(selectedStudy).map((label) => (
                      <span
                        key={label}
                        className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">
                      No components selected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <StatCard
                label="Live participants"
                value={String(liveParticipantCount(selectedStudy.id))}
                detail={
                  selectedStudy.target_sample_size
                    ? `Target ${selectedStudy.target_sample_size}`
                    : "No target set"
                }
              />

              <StatCard
                label="Questionnaires"
                value={String(measureCount(selectedStudy.id))}
                detail="Baseline + follow-up selections"
              />

              <StatCard
                label="Live links"
                value={String(activeLiveLinkCount(selectedStudy.id))}
                detail={`${testLinkCount(selectedStudy.id)} test link${
                  testLinkCount(selectedStudy.id) === 1 ? "" : "s"
                }`}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="mb-5 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Study status
                  </p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    Active studies accept live participants. Paused,
                    completed and archived studies stop new live
                    participation while preserving the study record.
                  </p>
                </div>

                <select
                  value={selectedStudy.status}
                  disabled={
                    updatingStudyId === selectedStudy.id
                  }
                  onChange={(event) =>
                    void updateStudyStatus(
                      selectedStudy.id,
                      event.target.value
                    )
                  }
                  className="min-w-[190px] rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-700 disabled:opacity-50"
                >
                  {studyStatusOptions.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => editStudy(selectedStudy.id)}
                  className="rounded-xl bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Edit study
                </button>

                <button
                  type="button"
                  onClick={() => changeScreen("participants")}
                  className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.04)]"
                >
                  View participants
                </button>

                <button
                  type="button"
                  onClick={() => changeScreen("links")}
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"
                >
                  Participant links
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStudyActionError("");
                  setStudyActionMessage("");
                  setDeleteConfirmation("");
                  setDeleteStudyTarget(
                    selectedStudy
                  );
                }}
                className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                Delete study
              </button>
            </div>
          </div>
        </Panel>
      )}

      {deleteStudyTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-300/70 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <p className="text-lg font-semibold text-slate-950">
                Delete study permanently?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This is a destructive action. The study and its linked
                research records will be removed according to the database
                deletion rules.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  {deleteStudyTarget.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-red-700">
                  {liveParticipantCount(
                    deleteStudyTarget.id
                  )} live participant
                  {liveParticipantCount(
                    deleteStudyTarget.id
                  ) === 1
                    ? ""
                    : "s"}
                  {" · "}
                  {testParticipantCount(
                    deleteStudyTarget.id
                  )} test participant
                  {testParticipantCount(
                    deleteStudyTarget.id
                  ) === 1
                    ? ""
                    : "s"}
                  {" · "}
                  {measureCount(
                    deleteStudyTarget.id
                  )} questionnaire selection
                  {measureCount(
                    deleteStudyTarget.id
                  ) === 1
                    ? ""
                    : "s"}
                </p>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  Type the exact study title to confirm deletion
                </span>
                <input
                  value={deleteConfirmation}
                  onChange={(event) =>
                    setDeleteConfirmation(
                      event.target.value
                    )
                  }
                  placeholder={deleteStudyTarget.title}
                  autoFocus
                  className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400"
                />
              </label>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteStudyTarget(null);
                    setDeleteConfirmation("");
                  }}
                  disabled={deletingStudy}
                  className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.04)] text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void deleteStudyPermanently()
                  }
                  disabled={
                    deletingStudy ||
                    deleteConfirmation !==
                      deleteStudyTarget.title
                  }
                  className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingStudy
                    ? "Deleting..."
                    : "Permanently delete study"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STUDY BUILDER
   ========================================================= */

function StudyBuilder({
  changeScreen,
  initialStudyId,
  onStudyIdChange,
}: {
  changeScreen: (screen: Screen) => void;
  initialStudyId: string;
  onStudyIdChange: (studyId: string) => void;
}) {
  type StudyComponents = {
    consent: boolean;
    demographics: boolean;
    baseline: boolean;
    cognitive: boolean;
    ambulatory: boolean;
    followup: boolean;
    wearables: boolean;
    passive: boolean;
    uploads: boolean;
  };

  type ConsentItemDraft = {
    id: string;
    prompt: string;
    response_type:
      | "checkbox"
      | "yes_no"
      | "initials"
      | "typed_name"
      | "date"
      | "single_choice"
      | "comprehension";
    required: boolean;
    options: string[];
    correct_option: string;
  };

  type DemographicQuestionDraft = {
    id: string;
    field_key: string;
    label: string;
    description: string;
    question_type:
      | "short_text"
      | "long_text"
      | "number"
      | "single_choice"
      | "multiple_choice"
      | "dropdown"
      | "yes_no"
      | "date"
      | "email";
    required: boolean;
    direct_identifier: boolean;
    options: string[];
    placeholder: string;
    min_value: string;
    max_value: string;
  };

  type AmbulatoryWindowDraft = {
    id: string;
    label: string;
    sampling_type:
      | "random_window"
      | "fixed_time"
      | "interval"
      | "participant_initiated"
      | "event_contingent";
    start_time: string;
    end_time: string;
    fixed_time: string;
    response_window_minutes: number;
  };

  type StudyMeasureCatalogueItem = {
    id: string;
    name: string;
    acronym: string | null;
    category: string;
    description: string;
    item_count: number;
    estimated_minutes: number | null;
    license_status: string;
    owner_user_id: string | null;
    source_type: string;
    current_version_id: string | null;
    current_version_label: string | null;
  };

  type StudyMeasureDraft = {
    id: string;
    questionnaire_id: string;
    questionnaire_version_id: string;
    name: string;
    acronym: string | null;
    category: string;
    source_type: string;
    version_label: string;
    measurement_point: "baseline" | "followup";
    required: boolean;
    position?: number;
  };

  type StudyCognitiveCatalogueItem = {
    id: string;
    title: string;
    description: string;
    domain: string;
    tags: string[] | null;
    published_version_id: string | null;
    published_version_label: string | null;
    published_version_number: number | null;
  };

  type StudyCognitiveTaskDraft = {
    id: string;
    task_id: string;
    version_id: string;
    title: string;
    description: string;
    domain: string;
    version_label: string;
    required: boolean;
    administration_mode: "once" | "scheduled" | "repeated" | "conditional";
    position?: number;
  };

  type BaselineFlowItem = {
    id: string;
    kind: "demographics" | "measure" | "cognitive";
    ref_id: string;
  };

  const makeId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const [studyId, setStudyId] = useState("");
  const [consentVersionId, setConsentVersionId] = useState("");
  const [ambulatoryProtocolId, setAmbulatoryProtocolId] = useState("");
  const [ambulatoryProtocolSummary, setAmbulatoryProtocolSummary] = useState<{
    name: string;
    duration_days: number | null;
    is_enabled: boolean;
    updated_at: string | null;
    schedule_count: number;
  } | null>(null);
  const [followupWaveSummary, setFollowupWaveSummary] = useState<{
    count: number;
    active: number;
    names: string[];
  }>({
    count: 0,
    active: 0,
    names: [],
  });
  const [savingStudy, setSavingStudy] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [studyError, setStudyError] = useState("");

  const [measureCatalogue, setMeasureCatalogue] = useState<
    StudyMeasureCatalogueItem[]
  >([]);
  const [loadingMeasureCatalogue, setLoadingMeasureCatalogue] = useState(true);
  const [measureCatalogueError, setMeasureCatalogueError] = useState("");
  const [measureSearch, setMeasureSearch] = useState("");
  const [studyMeasures, setStudyMeasures] = useState<StudyMeasureDraft[]>([]);

  const [cognitiveCatalogue, setCognitiveCatalogue] = useState<StudyCognitiveCatalogueItem[]>([]);
  const [loadingCognitiveCatalogue, setLoadingCognitiveCatalogue] = useState(true);
  const [cognitiveCatalogueError, setCognitiveCatalogueError] = useState("");
  const [cognitiveSearch, setCognitiveSearch] = useState("");
  const [studyCognitiveTasks, setStudyCognitiveTasks] = useState<StudyCognitiveTaskDraft[]>([]);
  const [baselineFlow, setBaselineFlow] = useState<BaselineFlowItem[]>([
    { id: "flow-demographics", kind: "demographics", ref_id: "demographics" },
  ]);
  const [existingStudyConfig, setExistingStudyConfig] = useState<Record<string, any>>({});

  const [title, setTitle] = useState("Untitled research study");
  const [description, setDescription] = useState("");
  const [design, setDesign] = useState("Cross-sectional survey");
  const [targetSampleSize, setTargetSampleSize] = useState(100);

  const [components, setComponents] = useState<StudyComponents>({
    consent: true,
    demographics: true,
    baseline: true,
    cognitive: false,
    ambulatory: false,
    followup: false,
    wearables: false,
    passive: false,
    uploads: false,
  });

  const [consentMethod, setConsentMethod] = useState<
    "psylattice" | "external" | "none"
  >("psylattice");
  const [participantInformation, setParticipantInformation] = useState("");
  const [externalConsentNote, setExternalConsentNote] = useState("");
  const [consentItems, setConsentItems] = useState<ConsentItemDraft[]>([
    {
      id: "consent-1",
      prompt: "I confirm that I have read the participant information.",
      response_type: "checkbox",
      required: true,
      options: [],
      correct_option: "",
    },
    {
      id: "consent-2",
      prompt: "I voluntarily agree to participate in this study.",
      response_type: "yes_no",
      required: true,
      options: [],
      correct_option: "",
    },
  ]);

  const [demographicQuestions, setDemographicQuestions] = useState<
    DemographicQuestionDraft[]
  >([
    {
      id: "demo-age",
      field_key: "age",
      label: "Age",
      description: "Age in completed years.",
      question_type: "number",
      required: false,
      direct_identifier: false,
      options: [],
      placeholder: "e.g. 24",
      min_value: "",
      max_value: "",
    },
    {
      id: "demo-gender",
      field_key: "gender",
      label: "Gender",
      description: "Choose the option that best describes you.",
      question_type: "single_choice",
      required: false,
      direct_identifier: false,
      options: [
        "Woman",
        "Man",
        "Non-binary / gender diverse",
        "Prefer to self-describe",
        "Prefer not to answer",
      ],
      placeholder: "",
      min_value: "",
      max_value: "",
    },
    {
      id: "demo-education",
      field_key: "education",
      label: "Highest educational qualification",
      description: "Select the highest level completed.",
      question_type: "dropdown",
      required: false,
      direct_identifier: false,
      options: [
        "Secondary school or below",
        "Higher secondary / equivalent",
        "Diploma / vocational qualification",
        "Bachelor's degree",
        "Master's degree",
        "Doctorate / professional degree",
        "Other",
        "Prefer not to answer",
      ],
      placeholder: "",
      min_value: "",
      max_value: "",
    },
  ]);

  const [protocolName, setProtocolName] = useState("Ambulatory protocol");
  const [durationMode, setDurationMode] = useState<
    "relative_days" | "fixed_dates" | "participant_defined"
  >("relative_days");
  const [durationDays, setDurationDays] = useState(14);
  const [fixedStartDate, setFixedStartDate] = useState("");
  const [fixedEndDate, setFixedEndDate] = useState("");
  const [samplingModes, setSamplingModes] = useState<string[]>([
    "random_window",
  ]);
  const [minimumIntervalMinutes, setMinimumIntervalMinutes] = useState(60);
  const [reminderCount, setReminderCount] = useState(1);
  const [reminderDelayMinutes, setReminderDelayMinutes] = useState(15);
  const [allowSnooze, setAllowSnooze] = useState(false);
  const [timezoneMode, setTimezoneMode] = useState("participant_local");
  const [dndStart, setDndStart] = useState("22:30");
  const [dndEnd, setDndEnd] = useState("07:00");
  const [weekdayMode, setWeekdayMode] = useState("all_days");
  const [eventName, setEventName] = useState("Defined event");
  const [eventMaxPerDay, setEventMaxPerDay] = useState(5);
  const [ambulatoryWindows, setAmbulatoryWindows] = useState<
    AmbulatoryWindowDraft[]
  >([
    {
      id: "window-1",
      label: "Morning",
      sampling_type: "random_window",
      start_time: "08:00",
      end_time: "10:00",
      fixed_time: "09:00",
      response_window_minutes: 30,
    },
  ]);

  const [activeStepKey, setActiveStepKey] = useState("overview");

  const steps = [
    { key: "overview", label: "Overview" },
    { key: "components", label: "Study components" },
    { key: "flow", label: "Study flow" },
    ...(components.consent ? [{ key: "consent", label: "Consent" }] : []),
    ...(components.demographics
      ? [{ key: "demographics", label: "Demographics" }]
      : []),
    ...(components.baseline
      ? [{ key: "measures", label: "Baseline measures" }]
      : []),
    ...(components.cognitive
      ? [{ key: "cognitive", label: "Cognitive tasks" }]
      : []),
    ...(components.ambulatory
      ? [{ key: "ambulatory", label: "Ambulatory" }]
      : []),
    ...(components.followup ? [{ key: "followup", label: "Follow-ups" }] : []),
    { key: "recruitment", label: "Recruitment" },
    { key: "review", label: "Review" },
  ];

  const currentStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === activeStepKey)
  );
  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    if (!steps.some((step) => step.key === activeStepKey)) {
      setActiveStepKey("components");
    }
  }, [
    activeStepKey,
    components.ambulatory,
    components.baseline,
    components.cognitive,
    components.consent,
    components.demographics,
    components.followup,
  ]);

  useEffect(() => {
    async function loadMeasureCatalogue() {
      setLoadingMeasureCatalogue(true);
      setMeasureCatalogueError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMeasureCatalogueError(
          "The questionnaire catalogue could not be loaded."
        );
        setLoadingMeasureCatalogue(false);
        return;
      }

      const { data: questionnaireData, error: questionnaireError } =
        await supabase
          .from("questionnaires")
          .select(
            "id, name, acronym, category, description, item_count, estimated_minutes, license_status, owner_user_id, source_type"
          )
          .eq("researcher_available", true)
          .eq("status", "active")
          .order("name", { ascending: true });

      if (questionnaireError) {
        console.error(
          "Could not load Study Builder questionnaire catalogue:",
          questionnaireError
        );
        setMeasureCatalogueError(
          "The questionnaire catalogue could not be loaded."
        );
        setLoadingMeasureCatalogue(false);
        return;
      }

      const questionnaires = questionnaireData || [];
      const questionnaireIds = questionnaires.map((item) => item.id);

      let versionRows: Array<{
        id: string;
        questionnaire_id: string;
        version_label: string;
      }> = [];

      if (questionnaireIds.length > 0) {
        const { data: versionData, error: versionError } = await supabase
          .from("questionnaire_versions")
          .select("id, questionnaire_id, version_label")
          .in("questionnaire_id", questionnaireIds)
          .eq("is_current", true);

        if (versionError) {
          console.error(
            "Could not load current questionnaire versions:",
            versionError
          );
          setMeasureCatalogueError(
            "Questionnaire versions could not be loaded."
          );
          setLoadingMeasureCatalogue(false);
          return;
        }

        versionRows = (versionData || []) as typeof versionRows;
      }

      const versionByQuestionnaire = new Map(
        versionRows.map((version) => [version.questionnaire_id, version])
      );

      setMeasureCatalogue(
        questionnaires.map((questionnaire) => {
          const version = versionByQuestionnaire.get(questionnaire.id);

          return {
            ...(questionnaire as Omit<
              StudyMeasureCatalogueItem,
              "current_version_id" | "current_version_label"
            >),
            current_version_id: version?.id || null,
            current_version_label: version?.version_label || null,
          };
        })
      );

      setLoadingMeasureCatalogue(false);
    }

    void loadMeasureCatalogue();
  }, []);

  useEffect(() => {
    async function loadCognitiveCatalogue() {
      setLoadingCognitiveCatalogue(true);
      setCognitiveCatalogueError("");

      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setCognitiveCatalogueError("Your cognitive task library could not be loaded.");
        setLoadingCognitiveCatalogue(false);
        return;
      }

      const { data: taskData, error: taskError } = await supabase
        .from("cognitive_tasks")
        .select("id,title,description,domain,tags,status,updated_at")
        .eq("owner_user_id", user.id)
        .neq("status", "archived")
        .order("updated_at", { ascending: false });

      if (taskError) {
        console.error("Could not load Cognitive Task Library:", taskError);
        setCognitiveCatalogueError("Your cognitive task library could not be loaded.");
        setLoadingCognitiveCatalogue(false);
        return;
      }

      const tasks = taskData || [];
      const taskIds = tasks.map((task) => task.id);
      let versionRows: Array<{ id: string; task_id: string; version_label: string; version_number: number; status: string }> = [];

      if (taskIds.length > 0) {
        const { data: versionData, error: versionError } = await supabase
          .from("cognitive_task_versions")
          .select("id,task_id,version_label,version_number,status")
          .in("task_id", taskIds)
          .in("status", ["published", "locked"])
          .order("version_number", { ascending: false });

        if (versionError) {
          console.error("Could not load published cognitive task versions:", versionError);
          setCognitiveCatalogueError("Study-ready cognitive task versions could not be loaded.");
          setLoadingCognitiveCatalogue(false);
          return;
        }
        versionRows = (versionData || []) as typeof versionRows;
      }

      const latestPublished = new Map<string, (typeof versionRows)[number]>();
      versionRows.forEach((version) => {
        if (!latestPublished.has(version.task_id)) latestPublished.set(version.task_id, version);
      });

      setCognitiveCatalogue(tasks.map((task: any) => {
        const version = latestPublished.get(task.id);
        return {
          id: task.id,
          title: task.title,
          description: task.description || "",
          domain: task.domain || "general",
          tags: Array.isArray(task.tags) ? task.tags : [],
          published_version_id: version?.id || null,
          published_version_label: version?.version_label || null,
          published_version_number: version?.version_number ?? null,
        };
      }));
      setLoadingCognitiveCatalogue(false);
    }

    void loadCognitiveCatalogue();
  }, []);

  useEffect(() => {
    if (!initialStudyId) {
      setFollowupWaveSummary({
        count: 0,
        active: 0,
        names: [],
      });
      return;
    }

    let cancelled = false;

    async function loadFollowupSummary() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("study_followup_waves")
        .select("id, name, status, position")
        .eq("study_id", initialStudyId)
        .order("position", { ascending: true });

      if (cancelled || error) {
        if (error) {
          console.error(
            "Could not load follow-up wave summary:",
            error
          );
        }
        return;
      }

      const rows = data || [];

      setFollowupWaveSummary({
        count: rows.length,
        active: rows.filter(
          (wave: any) => wave.status === "active"
        ).length,
        names: rows.map(
          (wave: any) => wave.name || "Follow-up"
        ),
      });
    }

    void loadFollowupSummary();

    return () => {
      cancelled = true;
    };
  }, [initialStudyId]);

  useEffect(() => {
    if (!initialStudyId) {
      return;
    }

    let cancelled = false;

    async function loadSavedStudyDraft() {
      setStudyError("");
      setSaveMessage("Loading saved study draft...");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || cancelled) {
        if (!cancelled) {
          setStudyError("The saved study draft could not be loaded.");
          setSaveMessage("");
        }
        return;
      }

      const [
        studyResult,
        measuresResult,
        cognitiveResult,
        demographicsResult,
        consentVersionResult,
        protocolResult,
      ] = await Promise.all([
        supabase
          .from("research_studies")
          .select(
            "id, title, participant_description, design, target_sample_size, components, study_config"
          )
          .eq("id", initialStudyId)
          .eq("owner_user_id", user.id)
          .maybeSingle(),

        supabase
          .from("study_measures")
          .select(
            "id, questionnaire_id, questionnaire_version_id, measurement_point, required, config, position, followup_wave_id"
          )
          .eq("study_id", initialStudyId)
          .eq("owner_user_id", user.id)
          .is("followup_wave_id", null)
          .order("position", { ascending: true }),

        supabase
          .from("study_cognitive_tasks")
          .select("id,task_id,version_id,position,required,administration_mode,cognitive_tasks(title,description,domain),cognitive_task_versions(version_label,version_number,status)")
          .eq("study_id", initialStudyId)
          .eq("owner_user_id", user.id)
          .order("position", { ascending: true }),

        supabase
          .from("study_demographic_questions")
          .select(
            "id, field_key, label, description, question_type, required, direct_identifier, response_config, validation_config, position"
          )
          .eq("study_id", initialStudyId)
          .eq("owner_user_id", user.id)
          .order("position", { ascending: true }),

        supabase
          .from("study_consent_versions")
          .select(
            "id, consent_method, participant_information, external_consent_note, updated_at"
          )
          .eq("study_id", initialStudyId)
          .eq("owner_user_id", user.id)
          .eq("is_current", true)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("study_ambulatory_protocols")
          .select(
            "id, name, duration_days, is_enabled, updated_at, protocol_v3"
          )
          .eq("study_id", initialStudyId)
          .eq("owner_user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (cancelled) {
        return;
      }

      if (studyResult.error || !studyResult.data) {
        console.error(
          "Could not load saved study:",
          studyResult.error
        );
        setStudyError("The saved study draft could not be loaded.");
        setSaveMessage("");
        return;
      }

      const savedStudy = studyResult.data;
      const savedComponents =
        (savedStudy.components || {}) as Partial<StudyComponents>;
      const savedStudyConfig =
        (savedStudy.study_config || {}) as Record<string, any>;

      setExistingStudyConfig(savedStudyConfig);
      setStudyId(savedStudy.id);
      setTitle(savedStudy.title || "Untitled research study");
      setDescription(savedStudy.participant_description || "");
      setDesign(savedStudy.design || "Cross-sectional survey");
      setTargetSampleSize(
        Number(savedStudy.target_sample_size || 100)
      );
      setComponents({
        consent: savedComponents.consent ?? true,
        demographics: savedComponents.demographics ?? true,
        baseline: savedComponents.baseline ?? true,
        cognitive: savedComponents.cognitive ?? false,
        ambulatory: savedComponents.ambulatory ?? false,
        followup: savedComponents.followup ?? false,
        wearables: savedComponents.wearables ?? false,
        passive: savedComponents.passive ?? false,
        uploads: savedComponents.uploads ?? false,
      });

      if (!measuresResult.error) {
        setStudyMeasures(
          (measuresResult.data || [])
            .filter(
              (row: any) =>
                row.measurement_point === "baseline"
            )
            .map((row: any) => ({
              id: row.id,
              questionnaire_id: row.questionnaire_id,
              questionnaire_version_id:
                row.questionnaire_version_id,
              name:
                row.config?.questionnaire_name_snapshot ||
                "Questionnaire",
              acronym:
                row.config?.questionnaire_acronym_snapshot ||
                null,
              category: row.config?.category || "Questionnaire",
              source_type:
                row.config?.source_type || "catalogue",
              version_label:
                row.config?.version_label_snapshot ||
                "Saved version",
              measurement_point: "baseline",
              required: row.required !== false,
              position: Number(row.position || 0),
            }))
        );
      }

      if (!cognitiveResult.error) {
        setStudyCognitiveTasks(
          (cognitiveResult.data || []).map((row: any) => ({
            id: row.id,
            task_id: row.task_id,
            version_id: row.version_id,
            title: row.cognitive_tasks?.title || "Cognitive task",
            description: row.cognitive_tasks?.description || "",
            domain: row.cognitive_tasks?.domain || "general",
            version_label: row.cognitive_task_versions?.version_label || "Published version",
            required: row.required !== false,
            administration_mode: ["scheduled", "repeated", "conditional"].includes(row.administration_mode)
              ? row.administration_mode
              : "once",
            position: Number(row.position || 0),
          }))
        );
      }

      {
        const legacyFlow = Number(savedStudyConfig.baseline_flow_schema || 0) !== 1;
        const flowRows: Array<{ position: number; item: BaselineFlowItem }> = [];
        let legacyPosition = 1;

        if (savedComponents.demographics ?? true) {
          flowRows.push({
            position: legacyFlow
              ? legacyPosition++
              : Number(savedStudyConfig.demographics_position || 1),
            item: { id: "flow-demographics", kind: "demographics", ref_id: "demographics" },
          });
        }

        (measuresResult.data || [])
          .filter((row: any) => row.measurement_point === "baseline")
          .forEach((row: any) => {
            flowRows.push({
              position: legacyFlow ? legacyPosition++ : Number(row.position || legacyPosition++),
              item: { id: `flow-${row.id}`, kind: "measure", ref_id: row.id },
            });
          });

        (cognitiveResult.data || []).forEach((row: any) => {
          flowRows.push({
            position: legacyFlow ? legacyPosition++ : Number(row.position || legacyPosition++),
            item: { id: `flow-${row.id}`, kind: "cognitive", ref_id: row.id },
          });
        });

        setBaselineFlow(
          flowRows
            .sort((a, b) => a.position - b.position)
            .map((row) => row.item)
        );
      }

      if (!demographicsResult.error) {
        setDemographicQuestions(
          (demographicsResult.data || []).map((row: any) => ({
            id: row.id,
            field_key: row.field_key,
            label: row.label,
            description: row.description || "",
            question_type: row.question_type,
            required: Boolean(row.required),
            direct_identifier: Boolean(row.direct_identifier),
            options: Array.isArray(
              row.response_config?.options
            )
              ? row.response_config.options
              : [],
            placeholder:
              row.response_config?.placeholder || "",
            min_value:
              row.validation_config?.min_value == null
                ? ""
                : String(row.validation_config.min_value),
            max_value:
              row.validation_config?.max_value == null
                ? ""
                : String(row.validation_config.max_value),
          }))
        );
      }

      if (
        !consentVersionResult.error &&
        consentVersionResult.data
      ) {
        const savedConsent = consentVersionResult.data;

        setConsentVersionId(savedConsent.id);
        setConsentMethod(
          (savedConsent.consent_method ||
            "psylattice") as
            | "psylattice"
            | "external"
            | "none"
        );
        setParticipantInformation(
          savedConsent.participant_information || ""
        );
        setExternalConsentNote(
          savedConsent.external_consent_note || ""
        );

        const { data: consentItemRows, error: consentItemsError } =
          await supabase
            .from("study_consent_items")
            .select(
              "id, prompt, response_type, required, response_config, position"
            )
            .eq("consent_version_id", savedConsent.id)
            .eq("owner_user_id", user.id)
            .order("position", { ascending: true });

        if (!cancelled && !consentItemsError) {
          setConsentItems(
            (consentItemRows || []).map((row: any) => ({
              id: row.id,
              prompt: row.prompt,
              response_type: row.response_type,
              required: Boolean(row.required),
              options: Array.isArray(
                row.response_config?.options
              )
                ? row.response_config.options
                : [],
              correct_option:
                row.response_config?.correct_option || "",
            }))
          );
        }
      } else {
        setConsentVersionId("");
      }

      setAmbulatoryProtocolId(
        protocolResult.data?.id || ""
      );

      if (protocolResult.data?.id) {
        const protocolRows = Array.isArray(
          protocolResult.data.protocol_v3
        )
          ? protocolResult.data.protocol_v3
          : [];

        setAmbulatoryProtocolSummary({
          name:
            protocolResult.data.name ||
            "Ambulatory assessment",
          duration_days:
            protocolResult.data.duration_days == null
              ? null
              : Number(protocolResult.data.duration_days),
          is_enabled:
            protocolResult.data.is_enabled !== false,
          updated_at:
            protocolResult.data.updated_at || null,
          schedule_count: protocolRows.length,
        });
      } else {
        setAmbulatoryProtocolSummary(null);
      }

      setActiveStepKey("overview");
      setSaveMessage("Saved study draft loaded.");
      onStudyIdChange(savedStudy.id);
    }

    void loadSavedStudyDraft();

    return () => {
      cancelled = true;
    };
  }, [initialStudyId]);

  useEffect(() => {
    setStudyMeasures((previous) =>
      previous.filter(
        (measure) =>
          measure.measurement_point === "baseline" &&
          components.baseline
      )
    );
  }, [components.baseline]);

  useEffect(() => {
    if (!components.cognitive) setStudyCognitiveTasks([]);
  }, [components.cognitive]);

  useEffect(() => {
    setBaselineFlow((previous) => {
      const withoutDemographics = previous.filter((item) => item.kind !== "demographics");
      if (!components.demographics) return withoutDemographics;
      const existing = previous.find((item) => item.kind === "demographics");
      return existing
        ? previous
        : [{ id: "flow-demographics", kind: "demographics", ref_id: "demographics" }, ...previous];
    });
  }, [components.demographics]);

  useEffect(() => {
    setBaselineFlow((previous) =>
      previous.filter(
        (item) =>
          item.kind !== "measure" || studyMeasures.some((measure) => measure.id === item.ref_id)
      )
    );
  }, [studyMeasures]);

  useEffect(() => {
    setBaselineFlow((previous) =>
      previous.filter(
        (item) =>
          item.kind !== "cognitive" || studyCognitiveTasks.some((task) => task.id === item.ref_id)
      )
    );
  }, [studyCognitiveTasks]);

  function addStudyCognitiveTask(task: StudyCognitiveCatalogueItem) {
    setStudyError("");
    setSaveMessage("");

    if (!task.published_version_id) {
      setStudyError(`${task.title} is still a draft. Open Cognitive Lab and mark a tested version Ready for studies first.`);
      return;
    }

    const localId = makeId("cognitive");
    setStudyCognitiveTasks((previous) => [
      ...previous,
      {
        id: localId,
        task_id: task.id,
        version_id: task.published_version_id as string,
        title: task.title,
        description: task.description,
        domain: task.domain,
        version_label: task.published_version_label || "Published version",
        required: true,
        administration_mode: "once",
      },
    ]);
    setBaselineFlow((previous) => [
      ...previous,
      { id: `flow-${localId}`, kind: "cognitive", ref_id: localId },
    ]);
  }

  function updateStudyCognitiveTask(id: string, patch: Partial<StudyCognitiveTaskDraft>) {
    setStudyCognitiveTasks((previous) => previous.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function removeStudyCognitiveTask(id: string) {
    setStudyCognitiveTasks((previous) => previous.filter((item) => item.id !== id));
    setBaselineFlow((previous) => previous.filter((item) => !(item.kind === "cognitive" && item.ref_id === id)));
  }

  function moveBaselineFlowItem(refId: string, direction: -1 | 1) {
    setBaselineFlow((previous) => {
      const index = previous.findIndex((item) => item.ref_id === refId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function moveStudyCognitiveTask(id: string, direction: -1 | 1) {
    moveBaselineFlowItem(id, direction);
  }

  function addStudyMeasure(
    questionnaire: StudyMeasureCatalogueItem,
    measurementPoint: "baseline" | "followup"
  ) {
    setStudyError("");
    setSaveMessage("");

    if (!questionnaire.current_version_id) {
      setStudyError(
        `${questionnaire.name} does not have a current questionnaire version and cannot be added yet.`
      );
      return;
    }

    const localId = makeId("measure");

    setStudyMeasures((previous) => [
      ...previous,
      {
        id: localId,
        questionnaire_id: questionnaire.id,
        questionnaire_version_id: questionnaire.current_version_id as string,
        name: questionnaire.name,
        acronym: questionnaire.acronym,
        category: questionnaire.category,
        source_type: questionnaire.source_type,
        version_label:
          questionnaire.current_version_label || "Current version",
        measurement_point: measurementPoint,
        required: true,
      },
    ]);

    if (measurementPoint === "baseline") {
      setBaselineFlow((previous) => [
        ...previous,
        { id: `flow-${localId}`, kind: "measure", ref_id: localId },
      ]);
    }
  }

  function removeStudyMeasure(id: string) {
    setStudyMeasures((previous) =>
      previous.filter((measure) => measure.id !== id)
    );
    setBaselineFlow((previous) => previous.filter((item) => !(item.kind === "measure" && item.ref_id === id)));
  }

  function moveStudyMeasure(id: string, direction: -1 | 1) {
    moveBaselineFlowItem(id, direction);
  }

  function updateStudyMeasure(
    id: string,
    patch: Partial<StudyMeasureDraft>
  ) {
    setStudyMeasures((previous) =>
      previous.map((measure) =>
        measure.id === id ? { ...measure, ...patch } : measure
      )
    );
  }

  function toggleComponent(key: keyof StudyComponents) {
    setComponents((previous) => ({ ...previous, [key]: !previous[key] }));
  }

  const demographicPresets: Array<{
    key: string;
    label: string;
    description: string;
    question_type: DemographicQuestionDraft["question_type"];
    direct_identifier?: boolean;
    options?: string[];
    placeholder?: string;
  }> = [
    {
      key: "name",
      label: "Name",
      description: "Participant name. This is directly identifying information.",
      question_type: "short_text",
      direct_identifier: true,
      placeholder: "Full name",
    },
    {
      key: "initials",
      label: "Initials",
      description: "Participant initials. These may still be identifying in small samples.",
      question_type: "short_text",
      direct_identifier: true,
      placeholder: "e.g. PD",
    },
    {
      key: "age",
      label: "Age",
      description: "Age in completed years.",
      question_type: "number",
      placeholder: "e.g. 24",
    },
    {
      key: "gender",
      label: "Gender",
      description: "Participant-reported gender.",
      question_type: "single_choice",
      options: [
        "Woman",
        "Man",
        "Non-binary / gender diverse",
        "Prefer to self-describe",
        "Prefer not to answer",
      ],
    },
    {
      key: "education",
      label: "Highest educational qualification",
      description: "Highest level of education completed.",
      question_type: "dropdown",
      options: [
        "Secondary school or below",
        "Higher secondary / equivalent",
        "Diploma / vocational qualification",
        "Bachelor's degree",
        "Master's degree",
        "Doctorate / professional degree",
        "Other",
        "Prefer not to answer",
      ],
    },
    {
      key: "occupation",
      label: "Occupation",
      description: "Current occupation or primary role.",
      question_type: "short_text",
      placeholder: "e.g. Student, teacher, engineer",
    },
    {
      key: "employment_status",
      label: "Employment status",
      description: "Current employment status.",
      question_type: "single_choice",
      options: [
        "Employed full-time",
        "Employed part-time",
        "Self-employed",
        "Student",
        "Unemployed / seeking work",
        "Not currently working",
        "Retired",
        "Other",
        "Prefer not to answer",
      ],
    },
    {
      key: "student_status",
      label: "Student status",
      description: "Whether the participant is currently enrolled in education.",
      question_type: "yes_no",
    },
    {
      key: "country",
      label: "Country of residence",
      description: "Country where the participant currently lives.",
      question_type: "short_text",
      placeholder: "Country",
    },
    {
      key: "nationality",
      label: "Nationality",
      description: "Participant-reported nationality.",
      question_type: "short_text",
      placeholder: "Nationality",
    },
    {
      key: "primary_language",
      label: "Primary language",
      description: "Language the participant primarily uses.",
      question_type: "short_text",
      placeholder: "Language",
    },
    {
      key: "relationship_status",
      label: "Relationship / marital status",
      description: "Participant-reported relationship status.",
      question_type: "single_choice",
      options: [
        "Single",
        "In a relationship",
        "Married / civil partnership",
        "Separated / divorced",
        "Widowed",
        "Other",
        "Prefer not to answer",
      ],
    },
  ];

  function uniqueDemographicKey(base: string) {
    const normalized =
      base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "field";

    const existing = new Set(
      demographicQuestions.map((question) => question.field_key)
    );

    if (!existing.has(normalized)) return normalized;

    let index = 2;
    while (existing.has(`${normalized}_${index}`)) index += 1;
    return `${normalized}_${index}`;
  }

  function addDemographicPreset(presetKey: string) {
    const preset = demographicPresets.find(
      (candidate) => candidate.key === presetKey
    );
    if (!preset) return;

    setDemographicQuestions((previous) => [
      ...previous,
      {
        id: makeId("demographic"),
        field_key: uniqueDemographicKey(preset.key),
        label: preset.label,
        description: preset.description,
        question_type: preset.question_type,
        required: false,
        direct_identifier: Boolean(preset.direct_identifier),
        options: preset.options || [],
        placeholder: preset.placeholder || "",
        min_value: "",
        max_value: "",
      },
    ]);
  }

  function addCustomDemographicQuestion() {
    setDemographicQuestions((previous) => [
      ...previous,
      {
        id: makeId("demographic"),
        field_key: uniqueDemographicKey(`custom_${previous.length + 1}`),
        label: "Custom demographic question",
        description: "",
        question_type: "short_text",
        required: false,
        direct_identifier: false,
        options: [],
        placeholder: "",
        min_value: "",
        max_value: "",
      },
    ]);
  }

  function updateDemographicQuestion(
    id: string,
    patch: Partial<DemographicQuestionDraft>
  ) {
    setDemographicQuestions((previous) =>
      previous.map((question) =>
        question.id === id ? { ...question, ...patch } : question
      )
    );
  }

  function removeDemographicQuestion(id: string) {
    setDemographicQuestions((previous) =>
      previous.filter((question) => question.id !== id)
    );
  }

  function moveDemographicQuestion(id: string, direction: -1 | 1) {
    setDemographicQuestions((previous) => {
      const index = previous.findIndex((question) => question.id === id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= previous.length) {
        return previous;
      }

      const next = [...previous];
      const [moved] = next.splice(index, 1);
      next.splice(nextIndex, 0, moved);
      return next;
    });
  }

  function addConsentItem() {
    setConsentItems((previous) => [
      ...previous,
      {
        id: makeId("consent"),
        prompt: "",
        response_type: "checkbox",
        required: true,
        options: [],
        correct_option: "",
      },
    ]);
  }

  function updateConsentItem(
    id: string,
    patch: Partial<ConsentItemDraft>
  ) {
    setConsentItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function removeConsentItem(id: string) {
    setConsentItems((previous) => previous.filter((item) => item.id !== id));
  }

  function moveConsentItem(id: string, direction: -1 | 1) {
    setConsentItems((previous) => {
      const index = previous.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleSamplingMode(mode: string) {
    setSamplingModes((previous) =>
      previous.includes(mode)
        ? previous.filter((item) => item !== mode)
        : [...previous, mode]
    );
  }

  function addAmbulatoryWindow() {
    setAmbulatoryWindows((previous) => [
      ...previous,
      {
        id: makeId("window"),
        label: `Window ${previous.length + 1}`,
        sampling_type: "random_window",
        start_time: "12:00",
        end_time: "14:00",
        fixed_time: "13:00",
        response_window_minutes: 30,
      },
    ]);
  }

  function updateAmbulatoryWindow(
    id: string,
    patch: Partial<AmbulatoryWindowDraft>
  ) {
    setAmbulatoryWindows((previous) =>
      previous.map((window) =>
        window.id === id ? { ...window, ...patch } : window
      )
    );
  }

  function removeAmbulatoryWindow(id: string) {
    setAmbulatoryWindows((previous) =>
      previous.filter((window) => window.id !== id)
    );
  }

  function flowPosition(kind: BaselineFlowItem["kind"], refId: string, fallback: number) {
    const index = baselineFlow.findIndex(
      (item) => item.kind === kind && item.ref_id === refId
    );
    return index >= 0 ? index + 1 : Math.max(1, fallback);
  }

  function removeBaselineFlowEntry(item: BaselineFlowItem) {
    if (item.kind === "demographics") {
      setComponents((previous) => ({ ...previous, demographics: false }));
      return;
    }

    if (item.kind === "measure") {
      removeStudyMeasure(item.ref_id);
      return;
    }

    removeStudyCognitiveTask(item.ref_id);
  }

  async function saveStudyDraft(): Promise<string | null> {
    if (savingStudy) return null;
    setStudyError("");
    setSaveMessage("");

    if (!title.trim()) {
      setStudyError("Enter a study title before saving.");
      return null;
    }

    if (targetSampleSize < 1) {
      setStudyError("Target sample size must be at least 1.");
      return null;
    }

    if (
      components.consent &&
      consentMethod === "psylattice" &&
      consentItems.some((item) => !item.prompt.trim())
    ) {
      setStudyError("Every consent question needs wording.");
      return null;
    }

    if (
      components.demographics &&
      demographicQuestions.some((question) => !question.label.trim())
    ) {
      setStudyError("Every demographic question needs a label.");
      return null;
    }

    setSavingStudy(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to save a study draft.");
      }

      const studyPayload = {
        owner_user_id: user.id,
        title: title.trim(),
        participant_description: description.trim() || null,
        design,
        target_sample_size: targetSampleSize,
        status: "draft",
        components,
        study_config: {
          ...existingStudyConfig,
          builder_version: "universal-v2",
          baseline_flow_schema: 1,
          demographics_position: components.demographics
            ? flowPosition("demographics", "demographics", 1)
            : null,
        },
        updated_at: new Date().toISOString(),
      };

      let savedStudyId = studyId;

      if (savedStudyId) {
        const { error } = await supabase
          .from("research_studies")
          .update(studyPayload)
          .eq("id", savedStudyId)
          .eq("owner_user_id", user.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("research_studies")
          .insert(studyPayload)
          .select("id")
          .single();
        if (error || !data) throw error || new Error("Study draft could not be created.");
        savedStudyId = data.id;
        setStudyId(data.id);
      }

      onStudyIdChange(savedStudyId);

      const { error: deleteMeasuresError } = await supabase
        .from("study_measures")
        .delete()
        .eq("study_id", savedStudyId)
        .eq("owner_user_id", user.id)
        .is("followup_wave_id", null);

      if (deleteMeasuresError) {
        throw deleteMeasuresError;
      }

      const measuresToSave = studyMeasures.filter(
        (measure) =>
          measure.measurement_point === "baseline" &&
          components.baseline
      );

      if (measuresToSave.length > 0) {
        const { error: measuresError } = await supabase
          .from("study_measures")
          .insert(
            measuresToSave.map((measure, index) => ({
              study_id: savedStudyId,
              owner_user_id: user.id,
              questionnaire_id: measure.questionnaire_id,
              questionnaire_version_id: measure.questionnaire_version_id,
              measurement_point: measure.measurement_point,
              position: flowPosition("measure", measure.id, index + 1),
              required: measure.required,
              config: {
                source_type: measure.source_type,
                questionnaire_name_snapshot: measure.name,
                questionnaire_acronym_snapshot: measure.acronym,
                version_label_snapshot: measure.version_label,
              },
            }))
          );

        if (measuresError) {
          throw measuresError;
        }
      }

      const { error: deleteCognitiveError } = await supabase
        .from("study_cognitive_tasks")
        .delete()
        .eq("study_id", savedStudyId)
        .eq("owner_user_id", user.id);

      if (deleteCognitiveError) throw deleteCognitiveError;

      if (components.cognitive && studyCognitiveTasks.length > 0) {
        const { error: cognitiveError } = await supabase
          .from("study_cognitive_tasks")
          .insert(
            studyCognitiveTasks.map((item, index) => ({
              study_id: savedStudyId,
              owner_user_id: user.id,
              task_id: item.task_id,
              version_id: item.version_id,
              position: flowPosition("cognitive", item.id, index + 1),
              required: item.required,
              administration_mode: item.administration_mode,
              schedule_config: {},
              condition_config: {},
            }))
          );
        if (cognitiveError) throw cognitiveError;
      }

      const { error: deleteDemographicQuestionsError } = await supabase
        .from("study_demographic_questions")
        .delete()
        .eq("study_id", savedStudyId)
        .eq("owner_user_id", user.id);

      if (deleteDemographicQuestionsError) {
        throw deleteDemographicQuestionsError;
      }

      if (components.demographics && demographicQuestions.length > 0) {
        const { error: demographicQuestionError } = await supabase
          .from("study_demographic_questions")
          .insert(
            demographicQuestions.map((question, index) => ({
              study_id: savedStudyId,
              owner_user_id: user.id,
              position: index + 1,
              field_key: question.field_key,
              label: question.label.trim(),
              description: question.description.trim() || null,
              question_type: question.question_type,
              required: question.required,
              direct_identifier: question.direct_identifier,
              response_config: {
                options: question.options.filter(Boolean),
                placeholder: question.placeholder || null,
              },
              validation_config: {
                min_value:
                  question.min_value.trim() === ""
                    ? null
                    : Number(question.min_value),
                max_value:
                  question.max_value.trim() === ""
                    ? null
                    : Number(question.max_value),
              },
            }))
          );

        if (demographicQuestionError) {
          throw demographicQuestionError;
        }
      }

      if (components.consent) {
        const consentPayload = {
          study_id: savedStudyId,
          owner_user_id: user.id,
          version_label: "Draft consent",
          consent_method: consentMethod,
          participant_information: participantInformation.trim() || null,
          external_consent_note: externalConsentNote.trim() || null,
          is_current: true,
          updated_at: new Date().toISOString(),
        };

        let savedConsentVersionId = consentVersionId;

        if (savedConsentVersionId) {
          const { error } = await supabase
            .from("study_consent_versions")
            .update(consentPayload)
            .eq("id", savedConsentVersionId)
            .eq("owner_user_id", user.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("study_consent_versions")
            .insert(consentPayload)
            .select("id")
            .single();
          if (error || !data) throw error || new Error("Consent draft could not be saved.");
          savedConsentVersionId = data.id;
          setConsentVersionId(data.id);
        }

        const { error: deleteConsentItemsError } = await supabase
          .from("study_consent_items")
          .delete()
          .eq("consent_version_id", savedConsentVersionId)
          .eq("owner_user_id", user.id);
        if (deleteConsentItemsError) throw deleteConsentItemsError;

        if (consentMethod === "psylattice" && consentItems.length > 0) {
          const { error: consentItemError } = await supabase
            .from("study_consent_items")
            .insert(
              consentItems.map((item, index) => ({
                consent_version_id: savedConsentVersionId,
                study_id: savedStudyId,
                owner_user_id: user.id,
                position: index + 1,
                prompt: item.prompt.trim(),
                response_type: item.response_type,
                required: item.required,
                response_config: {
                  options: item.options.filter(Boolean),
                  correct_option: item.correct_option || null,
                },
                validation_config: {
                  must_be_correct: item.response_type === "comprehension",
                },
              }))
            );
          if (consentItemError) throw consentItemError;
        }
      }

      // The unified Ambulatory Assessment workspace owns all ambulatory
      // protocol configuration. The Study Builder only records whether the
      // study includes an ambulatory component, so returning here cannot
      // overwrite the protocol configured in the unified builder.


      setSaveMessage("Study draft saved to Supabase.");
      return savedStudyId;
    } catch (error) {
      console.error("Saving study draft failed:", error);
      setStudyError(
        error instanceof Error ? error.message : "The study draft could not be saved."
      );
      return null;
    } finally {
      setSavingStudy(false);
    }
  }


  async function openUnifiedAmbulatoryBuilder() {
    const savedStudyId = await saveStudyDraft();

    if (!savedStudyId) {
      return;
    }

    onStudyIdChange(savedStudyId);
    changeScreen("ambulatory");
  }

  async function openFollowupManager() {
    const savedStudyId = await saveStudyDraft();

    if (!savedStudyId) {
      return;
    }

    onStudyIdChange(savedStudyId);
    changeScreen("followup");
  }


  const componentCards: Array<{
    key: keyof StudyComponents;
    title: string;
    text: string;
  }> = [
    { key: "consent", title: "Consent", text: "PsyLattice consent, external consent, or documented alternative." },
    { key: "demographics", title: "Participant demographics", text: "Preset or custom demographic fields, including optional open-response fields." },
    { key: "baseline", title: "Baseline / questionnaires", text: "One or more library or custom research instruments." },
    { key: "cognitive", title: "Cognitive tasks", text: "Reusable tasks from your personal Cognitive Task Library, pinned to a frozen study-ready version." },
    { key: "ambulatory", title: "Ambulatory / EMA / ESM", text: "Repeated real-world assessments. Completely optional." },
    { key: "followup", title: "Follow-up assessments", text: "Post-study or later follow-up measurement points." },
    { key: "wearables", title: "Wearables", text: "Optional device-derived data with appropriate consent." },
    { key: "passive", title: "Passive / device context", text: "Future context or sensing integrations where approved." },
    { key: "uploads", title: "Participant uploads", text: "Files, images, audio or other participant-provided material." },
  ];

  const filteredMeasureCatalogue = measureCatalogue.filter((questionnaire) => {
    const query = measureSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [
      questionnaire.name,
      questionnaire.acronym || "",
      questionnaire.category,
      questionnaire.description,
      questionnaire.source_type,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const filteredCognitiveCatalogue = cognitiveCatalogue.filter((task) => {
    const query = cognitiveSearch.trim().toLowerCase();
    if (!query) return true;
    return [task.title, task.description, task.domain, ...(task.tags || [])]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <div className="space-y-5">
      <Panel
        title="Study creation"
        description="The workflow changes automatically according to the components you select."
      >
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <button
              key={step.key}
              type="button"
              onClick={() => setActiveStepKey(step.key)}
              className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-2 text-xs font-medium ${
                currentStep.key === step.key
                  ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {index + 1}. {step.label}
            </button>
          ))}
        </div>
      </Panel>

      {(studyError || saveMessage) && (
        <div
          className={`rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] px-5 py-4 ${
            studyError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-cyan-300/70 bg-[#ecfbff] text-cyan-900"
          }`}
        >
          <p className="text-sm">{studyError || saveMessage}</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Panel
          title={currentStep.label}
          description={`Study Builder · Step ${currentStepIndex + 1} of ${steps.length}`}
        >
          {currentStep.key === "overview" && (
            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-medium">Study title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Participant-facing description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Explain what participants will be asked to do."
                  className="mt-2 min-h-28 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium">Study design</span>
                  <select
                    value={design}
                    onChange={(event) => setDesign(event.target.value)}
                    className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                  >
                    <option>Cross-sectional survey</option>
                    <option>Longitudinal</option>
                    <option>Repeated measures</option>
                    <option>Ambulatory / EMA / ESM</option>
                    <option>Experimental + questionnaire</option>
                    <option>Mixed methods</option>
                    <option>Observational</option>
                    <option>Other / custom</option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-medium">Target sample size</span>
                  <input
                    type="number"
                    min={1}
                    value={targetSampleSize}
                    onChange={(event) => setTargetSampleSize(Number(event.target.value))}
                    className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm"
                  />
                </label>
              </div>
            </div>
          )}

          {currentStep.key === "components" && (
            <div>
              <p className="text-sm leading-6 text-slate-500">
                Select the kinds of elements that belong to this protocol. You can add multiple questionnaires and cognitive tasks, then arrange their participant order in Study flow.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {componentCards.map((component) => (
                  <button
                    key={component.key}
                    type="button"
                    onClick={() => toggleComponent(component.key)}
                    className={`rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] p-5 text-left transition ${
                      components[component.key]
                        ? "border-cyan-200 bg-cyan-50/60"
                        : "border-slate-300/70 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{component.title}</p>
                      <Status type={components[component.key] ? "success" : "neutral"}>
                        {components[component.key] ? "Included" : "Not included"}
                      </Status>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{component.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep.key === "flow" && (
            <div className="space-y-5">
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-medium text-cyan-950">Participant study flow</p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                  Reposition questionnaires, demographics and cognitive tasks into the exact order participants should encounter them. The same questionnaire or cognitive task may be added more than once when your design requires repeated administration.
                </p>
              </div>

              {components.consent && consentMethod === "psylattice" && (
                <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-200 bg-cyan-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-cyan-950">1. Consent</p>
                      <p className="mt-1 text-xs text-cyan-800/70">Locked before research data collection.</p>
                    </div>
                    <Status type="success">Locked first</Status>
                  </div>
                </div>
              )}

              {baselineFlow.length === 0 ? (
                <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <p className="font-medium">No baseline study elements yet</p>
                  <p className="mt-2 text-sm text-slate-500">Add questionnaires or cognitive tasks, or enable demographics.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {baselineFlow.map((item, index) => {
                    const measure = item.kind === "measure" ? studyMeasures.find((candidate) => candidate.id === item.ref_id) : null;
                    const cognitive = item.kind === "cognitive" ? studyCognitiveTasks.find((candidate) => candidate.id === item.ref_id) : null;
                    const label = item.kind === "demographics"
                      ? "Participant demographics"
                      : item.kind === "measure"
                        ? `${measure?.name || "Questionnaire"}${measure?.acronym ? ` (${measure.acronym})` : ""}`
                        : cognitive?.title || "Cognitive task";
                    const detail = item.kind === "demographics"
                      ? `${demographicQuestions.length} configured field${demographicQuestions.length === 1 ? "" : "s"}`
                      : item.kind === "measure"
                        ? `Questionnaire · ${measure?.version_label || "Pinned version"}`
                        : `Cognitive task · ${cognitive?.version_label || "Pinned version"}`;
                    const displayNumber = index + 1 + (components.consent && consentMethod === "psylattice" ? 1 : 0);
                    return (
                      <div key={item.id} className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white">{displayNumber}</span>
                              <p className="font-medium">{label}</p>
                              <Status type={item.kind === "cognitive" ? "success" : "neutral"}>
                                {item.kind === "demographics" ? "Demographics" : item.kind === "measure" ? "Questionnaire" : "Cognitive"}
                              </Status>
                            </div>
                            <p className="mt-1 pl-9 text-xs text-slate-500">{detail}</p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => moveBaselineFlowItem(item.ref_id, -1)} disabled={index === 0} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-30">↑</button>
                            <button type="button" onClick={() => moveBaselineFlowItem(item.ref_id, 1)} disabled={index === baselineFlow.length - 1} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-30">↓</button>
                            <button type="button" onClick={() => removeBaselineFlowEntry(item)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Remove</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => { setComponents((previous) => ({ ...previous, baseline: true })); setActiveStepKey("measures"); }} className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)] font-semibold text-slate-700">+ Add questionnaire</button>
                <button type="button" onClick={() => { setComponents((previous) => ({ ...previous, cognitive: true })); setActiveStepKey("cognitive"); }} className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)] font-semibold text-slate-700">+ Add cognitive task</button>
              </div>
            </div>
          )}

          {currentStep.key === "consent" && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium">Consent method</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    ["psylattice", "Build in PsyLattice"],
                    ["external", "Consent obtained externally"],
                    ["none", "No digital consent in PsyLattice"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setConsentMethod(value as typeof consentMethod)}
                      className={`rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] p-4 text-left text-sm font-medium ${
                        consentMethod === value
                          ? "border-cyan-700 bg-cyan-50 text-cyan-900"
                          : "border-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {consentMethod === "psylattice" && (
                <>
                  <label className="block">
                    <span className="text-sm font-medium">Participant information</span>
                    <textarea
                      value={participantInformation}
                      onChange={(event) => setParticipantInformation(event.target.value)}
                      placeholder="Paste or write the approved participant information shown before consent items."
                      className="mt-2 min-h-40 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm"
                    />
                  </label>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Consent questions</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Add as many required or optional consent/comprehension items as the approved protocol needs.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addConsentItem}
                        className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"
                      >
                        + Add consent question
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {consentItems.map((item, index) => (
                        <div key={item.id} className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold">Consent item {index + 1}</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => moveConsentItem(item.id, -1)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs">↑</button>
                              <button type="button" onClick={() => moveConsentItem(item.id, 1)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs">↓</button>
                              <button type="button" onClick={() => removeConsentItem(item.id)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-red-200 px-2 py-1 text-xs text-red-700">Remove</button>
                            </div>
                          </div>

                          <textarea
                            value={item.prompt}
                            onChange={(event) => updateConsentItem(item.id, { prompt: event.target.value })}
                            placeholder="Consent or comprehension statement"
                            className="mt-4 min-h-20 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm"
                          />

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label>
                              <span className="text-xs font-medium text-slate-500">Response type</span>
                              <select
                                value={item.response_type}
                                onChange={(event) => updateConsentItem(item.id, { response_type: event.target.value as ConsentItemDraft["response_type"] })}
                                className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                              >
                                <option value="checkbox">Acknowledgment checkbox</option>
                                <option value="yes_no">Yes / No</option>
                                <option value="initials">Initials</option>
                                <option value="typed_name">Typed name</option>
                                <option value="date">Date</option>
                                <option value="single_choice">Single choice</option>
                                <option value="comprehension">Comprehension check</option>
                              </select>
                            </label>

                            <label className="flex items-center gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 sm:self-end">
                              <input
                                type="checkbox"
                                checked={item.required}
                                onChange={(event) => updateConsentItem(item.id, { required: event.target.checked })}
                              />
                              <span className="text-sm">Required to proceed</span>
                            </label>
                          </div>

                          {(item.response_type === "single_choice" || item.response_type === "comprehension") && (
                            <div className="mt-4">
                              <label className="block">
                                <span className="text-xs font-medium text-slate-500">Options — one per line</span>
                                <textarea
                                  value={item.options.join("\n")}
                                  onChange={(event) => updateConsentItem(item.id, { options: event.target.value.split("\n") })}
                                  className="mt-2 min-h-24 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm"
                                />
                              </label>

                              {item.response_type === "comprehension" && (
                                <label className="mt-3 block">
                                  <span className="text-xs font-medium text-slate-500">Correct option</span>
                                  <select
                                    value={item.correct_option}
                                    onChange={(event) => updateConsentItem(item.id, { correct_option: event.target.value })}
                                    className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                                  >
                                    <option value="">Choose the approved correct answer</option>
                                    {item.options.filter(Boolean).map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {consentMethod !== "psylattice" && (
                <label className="block">
                  <span className="text-sm font-medium">Documentation note</span>
                  <textarea
                    value={externalConsentNote}
                    onChange={(event) => setExternalConsentNote(event.target.value)}
                    placeholder="Record where/how consent is obtained, the relevant ethics approval, document version, or approved justification."
                    className="mt-2 min-h-32 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm"
                  />
                </label>
              )}
            </div>
          )}

          {currentStep.key === "demographics" && (
            <div className="space-y-6">
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-medium text-cyan-950">
                  Participant demographics
                </p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/70">
                  Add standard demographic fields or create your own questions.
                  Every field is optional unless you mark it required. Prefer
                  pseudonymous data where possible; directly identifying fields
                  such as a full name should only be collected when the approved
                  protocol genuinely requires them.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Quick-add common fields</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {demographicPresets.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => addDemographicPreset(preset.key)}
                      className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300"
                    >
                      + {preset.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={addCustomDemographicQuestion}
                    className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                  >
                    + Custom question
                  </button>
                </div>
              </div>

              {demographicQuestions.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="font-medium">No demographic questions yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use a preset above or add a fully custom demographic/open
                    field.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {demographicQuestions.map((question, index) => {
                    const choiceType = [
                      "single_choice",
                      "multiple_choice",
                      "dropdown",
                    ].includes(question.question_type);

                    return (
                      <div
                        key={question.id}
                        className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              Demographic field {index + 1}
                            </p>
                            {question.direct_identifier && (
                              <Status type="warning">Direct identifier</Status>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                moveDemographicQuestion(question.id, -1)
                              }
                              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                moveDemographicQuestion(question.id, 1)
                              }
                              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeDemographicQuestion(question.id)
                              }
                              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-red-200 px-2 py-1 text-xs text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <label>
                            <span className="text-xs font-medium text-slate-500">
                              Question / field label
                            </span>
                            <input
                              value={question.label}
                              onChange={(event) =>
                                updateDemographicQuestion(question.id, {
                                  label: event.target.value,
                                })
                              }
                              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm"
                            />
                          </label>

                          <label>
                            <span className="text-xs font-medium text-slate-500">
                              Response type
                            </span>
                            <select
                              value={question.question_type}
                              onChange={(event) =>
                                updateDemographicQuestion(question.id, {
                                  question_type: event.target
                                    .value as DemographicQuestionDraft["question_type"],
                                })
                              }
                              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                            >
                              <option value="short_text">Short open field</option>
                              <option value="long_text">Long open field</option>
                              <option value="number">Number</option>
                              <option value="single_choice">Single choice</option>
                              <option value="multiple_choice">Multiple choice</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="yes_no">Yes / No</option>
                              <option value="date">Date</option>
                              <option value="email">Email</option>
                            </select>
                          </label>
                        </div>

                        <label className="mt-4 block">
                          <span className="text-xs font-medium text-slate-500">
                            Participant guidance / description
                          </span>
                          <textarea
                            value={question.description}
                            onChange={(event) =>
                              updateDemographicQuestion(question.id, {
                                description: event.target.value,
                              })
                            }
                            rows={2}
                            className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm"
                          />
                        </label>

                        {choiceType && (
                          <label className="mt-4 block">
                            <span className="text-xs font-medium text-slate-500">
                              Response options — one per line
                            </span>
                            <textarea
                              value={question.options.join("\n")}
                              onChange={(event) =>
                                updateDemographicQuestion(question.id, {
                                  options: event.target.value.split("\n"),
                                })
                              }
                              rows={6}
                              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm"
                            />
                          </label>
                        )}

                        {["short_text", "long_text", "email"].includes(
                          question.question_type
                        ) && (
                          <label className="mt-4 block">
                            <span className="text-xs font-medium text-slate-500">
                              Placeholder
                            </span>
                            <input
                              value={question.placeholder}
                              onChange={(event) =>
                                updateDemographicQuestion(question.id, {
                                  placeholder: event.target.value,
                                })
                              }
                              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm"
                            />
                          </label>
                        )}

                        {question.question_type === "number" && (
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label>
                              <span className="text-xs font-medium text-slate-500">
                                Minimum value
                              </span>
                              <input
                                type="number"
                                value={question.min_value}
                                onChange={(event) =>
                                  updateDemographicQuestion(question.id, {
                                    min_value: event.target.value,
                                  })
                                }
                                className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm"
                              />
                            </label>
                            <label>
                              <span className="text-xs font-medium text-slate-500">
                                Maximum value
                              </span>
                              <input
                                type="number"
                                value={question.max_value}
                                onChange={(event) =>
                                  updateDemographicQuestion(question.id, {
                                    max_value: event.target.value,
                                  })
                                }
                                className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm"
                              />
                            </label>
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                            <input
                              type="checkbox"
                              checked={question.required}
                              onChange={(event) =>
                                updateDemographicQuestion(question.id, {
                                  required: event.target.checked,
                                })
                              }
                              className="mt-1"
                            />
                            <div>
                              <p className="text-sm font-medium">Required</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Participant must answer before continuing.
                              </p>
                            </div>
                          </label>

                          <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                            <input
                              type="checkbox"
                              checked={question.direct_identifier}
                              onChange={(event) =>
                                updateDemographicQuestion(question.id, {
                                  direct_identifier: event.target.checked,
                                })
                              }
                              className="mt-1"
                            />
                            <div>
                              <p className="text-sm font-medium">
                                Directly identifying field
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Mark names, email addresses, or similar direct
                                identifiers so they can be treated separately in
                                exports and privacy controls.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep.key === "measures" && (
            <div className="space-y-6">
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-medium text-cyan-950">
                  Select questionnaires for this study
                </p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/70">
                  Choose directly from the PsyLattice Questionnaire Library or
                  from questionnaires you created yourself. PsyLattice pins the
                  current questionnaire version to this study so later edits do
                  not silently change a deployed protocol.
                </p>
              </div>

              <div>
                <div>
                  <p className="font-medium">Selected measures</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {studyMeasures.length === 0
                      ? "No questionnaires selected yet."
                      : `${studyMeasures.length} questionnaire ${
                          studyMeasures.length === 1 ? "placement" : "placements"
                        } selected.`}
                  </p>
                </div>

                {studyMeasures.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {studyMeasures.map((measure, index) => (
                      <div
                        key={measure.id}
                        className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">
                                {measure.name}
                                {measure.acronym ? ` (${measure.acronym})` : ""}
                              </p>
                              <Status
                                type={
                                  measure.source_type === "researcher_created"
                                    ? "accent"
                                    : "neutral"
                                }
                              >
                                {measure.source_type === "researcher_created"
                                  ? "Your questionnaire"
                                  : "Library measure"}
                              </Status>
                              <Status type="success">
                                {measure.measurement_point === "baseline"
                                  ? "Baseline"
                                  : "Follow-up"}
                              </Status>
                            </div>

                            <p className="mt-1 text-xs text-slate-400">
                              {measure.category} · {measure.version_label}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => moveStudyMeasure(measure.id, -1)}
                              disabled={index === 0}
                              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2.5 py-1.5 text-xs disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStudyMeasure(measure.id, 1)}
                              disabled={index === studyMeasures.length - 1}
                              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2.5 py-1.5 text-xs disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStudyMeasure(measure.id)}
                              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-red-200 px-2.5 py-1.5 text-xs text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <label className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={measure.required}
                            onChange={(event) =>
                              updateStudyMeasure(measure.id, {
                                required: event.target.checked,
                              })
                            }
                          />
                          <span className="text-sm">
                            Required at this measurement point
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <label className="min-w-[260px] flex-1">
                    <span className="text-sm font-medium">
                      Browse available questionnaires
                    </span>
                    <input
                      value={measureSearch}
                      onChange={(event) => setMeasureSearch(event.target.value)}
                      placeholder="Search name, acronym, construct or category..."
                      className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                    />
                  </label>

                  <div className="text-xs text-slate-400">
                    {loadingMeasureCatalogue
                      ? "Loading..."
                      : `${filteredMeasureCatalogue.length} available`}
                  </div>
                </div>

                {measureCatalogueError && (
                  <div className="mt-4 border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1 text-sm text-slate-600">
                    {measureCatalogueError}
                  </div>
                )}

                {loadingMeasureCatalogue ? (
                  <p className="mt-5 text-sm text-slate-500">
                    Loading questionnaire library...
                  </p>
                ) : filteredMeasureCatalogue.length > 0 ? (
                  <div className="mt-5 grid gap-3">
                    {filteredMeasureCatalogue.map((questionnaire) => {
                      const baselineCount = studyMeasures.filter(
                        (measure) =>
                          measure.questionnaire_version_id ===
                            questionnaire.current_version_id &&
                          measure.measurement_point === "baseline"
                      ).length;

                      return (
                        <div
                          key={questionnaire.id}
                          className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-5"
                        >
                          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">
                                  {questionnaire.name}
                                  {questionnaire.acronym
                                    ? ` (${questionnaire.acronym})`
                                    : ""}
                                </p>

                                <Status
                                  type={
                                    questionnaire.source_type ===
                                    "researcher_created"
                                      ? "accent"
                                      : "neutral"
                                  }
                                >
                                  {questionnaire.source_type ===
                                  "researcher_created"
                                    ? "Your questionnaire"
                                    : "Library"}
                                </Status>
                              </div>

                              <p className="mt-1 text-xs text-slate-400">
                                {questionnaire.category} ·{" "}
                                {questionnaire.item_count} items
                                {questionnaire.estimated_minutes
                                  ? ` · ~${questionnaire.estimated_minutes} min`
                                  : ""}
                              </p>

                              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                {questionnaire.description}
                              </p>

                              <p className="mt-2 text-xs text-slate-400">
                                {questionnaire.current_version_label
                                  ? `Current version: ${questionnaire.current_version_label}`
                                  : "No current version available"}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-wrap gap-2">
                              {components.baseline && (
                                <button
                                  type="button"
                                  disabled={!questionnaire.current_version_id}
                                  onClick={() =>
                                    addStudyMeasure(
                                      questionnaire,
                                      "baseline"
                                    )
                                  }
                                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                                    baselineCount > 0
                                      ? "border border-cyan-200 bg-cyan-50 text-cyan-900"
                                      : "bg-slate-950 text-white"
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  {baselineCount > 0
                                    ? `+ Add again (${baselineCount})`
                                    : "+ Add to study"}
                                </button>
                              )}

                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                    <p className="font-medium">No questionnaires found</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Try another search. Questionnaires you create in the
                      Researcher Questionnaire Library also appear here
                      automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep.key === "cognitive" && (
            <div className="space-y-5">
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-medium text-cyan-950">Cognitive tasks from your personal library</p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                  Study Builder pins a published task version. If you later edit that task in Cognitive Lab, this study does not change unless you deliberately replace the pinned version.
                </p>
              </div>

              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
                <div>
                  <p className="font-medium">Selected cognitive tasks</p>
                  <p className="mt-1 text-sm text-slate-500">{studyCognitiveTasks.length} task{studyCognitiveTasks.length === 1 ? "" : "s"} in this study</p>
                </div>

                {studyCognitiveTasks.length === 0 ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No cognitive tasks selected yet.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {studyCognitiveTasks.map((item, index) => (
                      <div key={item.id} className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{item.title}</p>
                              <Status type="success">{item.version_label}</Status>
                            </div>
                            <p className="mt-1 text-xs capitalize text-slate-400">{item.domain.replaceAll("_", " ")}</p>
                            {item.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => moveStudyCognitiveTask(item.id, -1)} disabled={index === 0} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2.5 py-1.5 text-xs disabled:opacity-30">↑</button>
                            <button type="button" onClick={() => moveStudyCognitiveTask(item.id, 1)} disabled={index === studyCognitiveTasks.length - 1} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2.5 py-1.5 text-xs disabled:opacity-30">↓</button>
                            <button type="button" onClick={() => removeStudyCognitiveTask(item.id)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-red-200 px-2.5 py-1.5 text-xs text-red-700">Remove</button>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button type="button" onClick={() => updateStudyCognitiveTask(item.id, { required: !item.required })} className={`rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] px-3 py-2.5 text-xs font-semibold ${item.required ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-slate-300/70 bg-white text-slate-600"}`}>
                            {item.required ? "✓ Required" : "Optional"}
                          </button>
                          <select value={item.administration_mode} onChange={(event) => updateStudyCognitiveTask(item.id, { administration_mode: event.target.value as StudyCognitiveTaskDraft["administration_mode"] })} className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-xs">
                            <option value="once">Run once</option>
                            <option value="repeated">Repeated</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="conditional">Conditional</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <label className="block flex-1">
                    <span className="text-sm font-medium">Browse My Cognitive Tasks</span>
                    <input value={cognitiveSearch} onChange={(event) => setCognitiveSearch(event.target.value)} placeholder="Search task, domain or description" className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" />
                  </label>
                  <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                    {loadingCognitiveCatalogue ? "Loading..." : `${filteredCognitiveCatalogue.length} in library`}
                  </div>
                </div>

                {cognitiveCatalogueError && <div className="mt-4 border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1 text-sm text-slate-600">{cognitiveCatalogueError}</div>}

                {loadingCognitiveCatalogue ? (
                  <p className="mt-5 text-sm text-slate-500">Loading your Cognitive Task Library...</p>
                ) : filteredCognitiveCatalogue.length > 0 ? (
                  <div className="mt-5 grid gap-3">
                    {filteredCognitiveCatalogue.map((task) => {
                      const addedCount = task.published_version_id
                        ? studyCognitiveTasks.filter((item) => item.version_id === task.published_version_id).length
                        : 0;
                      return (
                        <div key={task.id} className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-5">
                          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{task.title}</p>
                                {task.published_version_id ? <Status type="success">Ready for studies</Status> : <Status type="warning">Draft only</Status>}
                              </div>
                              <p className="mt-1 text-xs capitalize text-slate-400">{task.domain.replaceAll("_", " ")}{task.published_version_label ? ` · ${task.published_version_label}` : ""}</p>
                              {task.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{task.description}</p>}
                            </div>
                            <button type="button" disabled={!task.published_version_id} onClick={() => addStudyCognitiveTask(task)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${addedCount > 0 ? "border border-cyan-200 bg-cyan-50 text-cyan-900" : "bg-slate-950 text-white"} disabled:cursor-not-allowed disabled:opacity-60`}>
                              {!task.published_version_id ? "Publish in Cognitive Lab first" : addedCount > 0 ? `+ Add again (${addedCount})` : "+ Add to study"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                    <p className="font-medium">No cognitive tasks found</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Create or clone a task in Cognitive Lab, test it in Preview/Pilot, then mark a version Ready for studies.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep.key === "ambulatory" && (
            <div className="space-y-5">
              <div
                className={`rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] p-5 ${
                  ambulatoryProtocolId
                    ? "border-cyan-200 bg-cyan-50/70"
                    : "border-cyan-100 bg-cyan-50/60"
                }`}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`font-medium ${
                          ambulatoryProtocolId
                            ? "text-cyan-950"
                            : "text-cyan-950"
                        }`}
                      >
                        {ambulatoryProtocolId
                          ? "✓ Ambulatory assessment saved and connected"
                          : "Ambulatory Assessment is enabled for this study"}
                      </p>

                      {ambulatoryProtocolId && (
                        <span className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-cyan-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
                          CONFIRMED
                        </span>
                      )}
                    </div>

                    {ambulatoryProtocolSummary ? (
                      <div className="mt-3 grid gap-2 text-sm text-cyan-900/80 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="block text-xs font-medium text-cyan-700">
                            Protocol
                          </span>
                          <span className="font-medium">
                            {ambulatoryProtocolSummary.name}
                          </span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium text-cyan-700">
                            Duration
                          </span>
                          <span className="font-medium">
                            {ambulatoryProtocolSummary.duration_days
                              ? `${ambulatoryProtocolSummary.duration_days} days`
                              : "Protocol-defined"}
                          </span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium text-cyan-700">
                            Blocks / schedules
                          </span>
                          <span className="font-medium">
                            {ambulatoryProtocolSummary.schedule_count}
                          </span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium text-cyan-700">
                            Status
                          </span>
                          <span className="font-medium">
                            {ambulatoryProtocolSummary.is_enabled
                              ? "Active"
                              : "Saved · disabled"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                        The ambulatory component is selected, but no ambulatory
                        protocol has been saved for this study yet.
                      </p>
                    )}

                    {ambulatoryProtocolSummary?.updated_at && (
                      <p className="mt-3 text-xs text-cyan-700/70">
                        Last saved{" "}
                        {new Date(
                          ambulatoryProtocolSummary.updated_at
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void openUnifiedAmbulatoryBuilder()}
                    disabled={savingStudy}
                    className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {savingStudy
                      ? "Saving study..."
                      : ambulatoryProtocolId
                        ? "Edit ambulatory assessment"
                        : "Save & configure ambulatory assessment"}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  [
                    "Time contingent",
                    "Fixed times, random windows and interval-contingent prompts with response windows and email reminders.",
                  ],
                  [
                    "Event contingent",
                    "Researcher-defined participant buttons such as Report craving, Report conflict or Report panic episode.",
                  ],
                  [
                    "Nested branching",
                    "Sliders, choices, numbers, activities and questionnaire-library blocks with recursively nested conditional questions.",
                  ],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5"
                  >
                    <p className="font-medium">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {description}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-xs leading-5 text-slate-400">
                Important: participant links show the special longitudinal
                Study Dashboard only after an active V3 ambulatory protocol
                exists. Ordinary non-ambulatory study links remain unchanged.
              </p>
            </div>
          )}

          {currentStep.key === "followup" && (
            <div
              className={`rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] p-5 ${
                followupWaveSummary.count > 0
                  ? "border-cyan-200 bg-cyan-50/70"
                  : "border-cyan-100 bg-cyan-50/60"
              }`}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-medium ${
                        followupWaveSummary.count > 0
                          ? "text-cyan-950"
                          : "text-cyan-950"
                      }`}
                    >
                      {followupWaveSummary.count > 0
                        ? "✓ Follow-up waves saved and connected"
                        : "Follow-up component enabled"}
                    </p>

                    {followupWaveSummary.count > 0 && (
                      <span className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-cyan-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-cyan-700">
                        CONFIRMED
                      </span>
                    )}
                  </div>

                  {followupWaveSummary.count > 0 ? (
                    <>
                      <p className="mt-3 text-sm text-cyan-900/80">
                        {followupWaveSummary.count} wave
                        {followupWaveSummary.count === 1 ? "" : "s"} configured
                        {" · "}
                        {followupWaveSummary.active} active.
                      </p>
                      <p className="mt-1 text-xs leading-5 text-cyan-700/80">
                        {followupWaveSummary.names.join(" · ")}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-900/75">
                      Create one or more follow-up waves. Every wave can use
                      different questionnaires, invitation timing, completion
                      windows and email reminder schedules.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void openFollowupManager()}
                  disabled={savingStudy}
                  className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingStudy
                    ? "Saving study..."
                    : followupWaveSummary.count > 0
                      ? "Edit follow-up waves"
                      : "Save & configure follow-ups"}
                </button>
              </div>
            </div>
          )}

          {currentStep.key === "recruitment" && (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-500">
                Save the study draft first, then use Participant Links to create TEST or live recruitment routes for this exact protocol.
              </p>
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-5">
                <p className="text-sm font-medium">Study draft ID</p>
                <code className="mt-2 block rounded-lg bg-slate-50 p-3 text-xs">{studyId || "Save this draft to create a study ID"}</code>
              </div>
            </div>
          )}

          {currentStep.key === "review" && (
            <div className="space-y-4">
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50 p-5">
                <p className="font-medium text-cyan-900">Builder review</p>
                <p className="mt-2 text-sm leading-6 text-cyan-800">
                  This draft records the selected study components, configurable demographics, pinned questionnaire versions, pinned cognitive-task versions, consent, and optional ambulatory protocol. Use a TEST participant link before live recruitment and verify the full participant experience against the approved protocol.
                </p>
              </div>
              <button type="button" onClick={() => void saveStudyDraft()} disabled={savingStudy} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {savingStudy ? "Saving..." : "Save study draft"}
              </button>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentStepIndex === 0}
                onClick={() => setActiveStepKey(steps[Math.max(0, currentStepIndex - 1)].key)}
                className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.04)] disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                disabled={currentStepIndex === steps.length - 1}
                onClick={() => setActiveStepKey(steps[Math.min(steps.length - 1, currentStepIndex + 1)].key)}
                className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.04)] disabled:opacity-40"
              >
                Continue
              </button>
            </div>

            <button
              type="button"
              onClick={() => void saveStudyDraft()}
              disabled={savingStudy}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingStudy ? "Saving..." : "Save draft"}
            </button>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Study components">
            <div className="space-y-3">
              {componentCards.map((component) => (
                <div key={component.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm">{component.title}</span>
                  <Status type={components[component.key] ? "success" : "neutral"}>
                    {components[component.key] ? "Included" : "Off"}
                  </Status>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Builder safeguards">
            <div className="space-y-4 text-sm leading-6 text-slate-500">
              <p>Consent content must match the approved ethics protocol; PsyLattice does not decide whether a consent waiver or optional component is ethically sufficient.</p>
              <p>Demographic fields can include direct identifiers, but collect names, email addresses or similarly identifying data only when the approved protocol and data-management plan require them.</p>
              <p>Ambulatory scheduling is optional and should only be enabled when it belongs to the research design.</p>
              <p>Published questionnaire, consent and cognitive-task versions are pinned for historical reproducibility; later library edits do not silently alter an existing study. Study flow order is saved separately from the content of each element.</p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   QUESTIONNAIRE LIBRARY
   ========================================================= */

function QuestionnaireLibrary({
  changeScreen,
  openCustomBuilderOnMount = false,
  onCustomBuilderOpened,
}: {
  changeScreen: (screen: Screen) => void;
  openCustomBuilderOnMount?: boolean;
  onCustomBuilderOpened?: () => void;
}) {
  type Questionnaire = {
    id: string;
    slug: string;
    name: string;
    acronym: string | null;
    category: string;
    description: string;
    constructs: string[];
    population: string | null;
    item_count: number;
    estimated_minutes: number | null;
    languages: string[];
    administration_mode: string | null;
    recall_period: string | null;
    self_available: boolean;
    researcher_available: boolean;
    license_status:
      | "public_domain"
      | "permitted"
      | "restricted"
      | "unknown"
      | "researcher_owned";
    license_summary: string | null;
    license_source_url: string | null;
    commercial_use_note: string | null;
    modification_note: string | null;
    redistribution_note: string | null;
    owner_user_id: string | null;
    source_type: "system" | "researcher_created" | "imported";
    publication_scope: "private" | "published";
    access_mode: "owner_only" | "free" | "request";
    publisher_display_name: string | null;
    publisher_affiliation: string | null;
    publisher_url: string | null;
    published_at: string | null;
    my_access_status?: "pending" | "approved" | "denied" | "revoked" | null;
  };

  type QuestionnaireAccessRequest = {
    id: string;
    questionnaire_id: string;
    requester_user_id: string;
    requester_display_name: string;
    requester_affiliation: string | null;
    message: string | null;
    status: "pending" | "approved" | "denied" | "revoked";
    created_at: string;
    reviewed_at: string | null;
  };

  type QuestionnaireVersion = {
    id: string;
    questionnaire_id: string;
    version_label: string;
    participant_instructions: string;
    researcher_instructions: string | null;
    response_scale_description: string | null;
    scoring_summary: string | null;
    score_multiplier: number;
  };

  type ResponseOption = {
    value: number;
    label: string;
  };

  type QuestionnaireItem = {
    id: string;
    position: number;
    prompt: string;
    subscale: string | null;
    reverse_scored: boolean;
    response_type: string;
    response_options: ResponseOption[];
    required: boolean;
  };

  type QuestionnaireResource = {
    id: string;
    resource_type: string;
    title: string;
    url: string;
    source_name: string | null;
    is_official: boolean;
    download_allowed: boolean;
    access_note: string | null;
    sort_order: number;
  };

  type QuestionnaireReference = {
    id: string;
    citation: string;
    url: string | null;
    sort_order: number;
  };

  type BuilderOption = {
    id: string;
    label: string;
    value: number;
    weight: number;
    media_url?: string;
    media_mime_type?: string;
  };

  type BuilderLogicRule = {
    id: string;
    source_key: string;
    operator:
      | "equals"
      | "not_equals"
      | "greater_than"
      | "greater_than_or_equal"
      | "less_than"
      | "less_than_or_equal"
      | "contains"
      | "not_contains"
      | "answered"
      | "not_answered";
    value: string;
  };

  type BuilderBlock = {
    id: string;
    key: string;
    title: string;
    instructions: string;
    randomize_items: boolean;
    page_break_after: boolean;
  };

  type BuilderItem = {
    id: string;
    key: string;
    prompt: string;
    help_text: string;
    item_type: string;
    block_id: string;
    subscale: string;
    reverse_scored: boolean;
    required: boolean;
    options: BuilderOption[];
    numeric_min: number;
    numeric_max: number;
    numeric_step: number;
    left_anchor: string;
    right_anchor: string;
    min_selections: number;
    max_selections: number;
    max_words: number;
    max_characters: number;
    thurstone_weight: number;
    constant_sum_target: number;
    matrix_rows: string;
    media_url: string;
    media_mime_type: string;
    randomize_options: boolean;
    logic_mode: "all" | "any";
    logic_rules: BuilderLogicRule[];
    custom_config_notes: string;
  };

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryError, setLibraryError] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [licenceFilter, setLicenceFilter] = useState("All");

  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [selectedVersion, setSelectedVersion] =
    useState<QuestionnaireVersion | null>(null);
  const [items, setItems] = useState<QuestionnaireItem[]>([]);
  const [resources, setResources] = useState<QuestionnaireResource[]>([]);
  const [references, setReferences] = useState<QuestionnaireReference[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedReferenceId, setCopiedReferenceId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState("Researcher");
  const [accessRequests, setAccessRequests] = useState<QuestionnaireAccessRequest[]>([]);
  const [accessRequestMessage, setAccessRequestMessage] = useState("");
  const [accessBusy, setAccessBusy] = useState(false);

  const [builderOpen, setBuilderOpen] = useState(false);
  const [savingCustomQuestionnaire, setSavingCustomQuestionnaire] =
    useState(false);
  const [builderError, setBuilderError] = useState("");
  const [builderSuccess, setBuilderSuccess] = useState("");

  const [builderName, setBuilderName] = useState("");
  const [builderAcronym, setBuilderAcronym] = useState("");
  const [builderCategory, setBuilderCategory] = useState("Custom");
  const [builderDescription, setBuilderDescription] = useState("");
  const [builderConstructs, setBuilderConstructs] = useState("");
  const [builderPopulation, setBuilderPopulation] = useState("");
  const [builderEstimatedMinutes, setBuilderEstimatedMinutes] = useState(5);
  const [builderRecallPeriod, setBuilderRecallPeriod] = useState("");
  const [builderLanguages, setBuilderLanguages] = useState("English");
  const [builderParticipantInstructions, setBuilderParticipantInstructions] =
    useState("");
  const [builderResearcherInstructions, setBuilderResearcherInstructions] =
    useState("");
  const [builderScoringSummary, setBuilderScoringSummary] = useState("");
  const [builderScoringMethod, setBuilderScoringMethod] = useState("none");
  const [builderScoringFormula, setBuilderScoringFormula] = useState("");
  const [builderMissingRule, setBuilderMissingRule] = useState("complete_case");
  const [builderRandomizeItems, setBuilderRandomizeItems] = useState(false);
  const [builderRightsConfirmed, setBuilderRightsConfirmed] = useState(false);
  const [builderPublicationMode, setBuilderPublicationMode] = useState<"private" | "free" | "restricted">("private");
  const [builderPublisherName, setBuilderPublisherName] = useState("");
  const [builderPublisherAffiliation, setBuilderPublisherAffiliation] = useState("");
  const [builderPublisherUrl, setBuilderPublisherUrl] = useState("");
  const [builderMediaUploadState, setBuilderMediaUploadState] = useState<Record<string, string>>({});
  const [builderMediaPreviews, setBuilderMediaPreviews] = useState<Record<string, string>>({});

  const [builderBlocks, setBuilderBlocks] = useState<BuilderBlock[]>([
    {
      id: "block-1",
      key: "block_1",
      title: "Main questionnaire",
      instructions: "",
      randomize_items: false,
      page_break_after: true,
    },
  ]);

  const [builderItems, setBuilderItems] = useState<BuilderItem[]>([
    {
      id: "item-1",
      key: "q1",
      prompt: "",
      help_text: "",
      item_type: "likert",
      block_id: "block-1",
      subscale: "",
      reverse_scored: false,
      required: true,
      options: [
        { id: "option-1", label: "Strongly disagree", value: 1, weight: 1 },
        { id: "option-2", label: "Disagree", value: 2, weight: 1 },
        { id: "option-3", label: "Neither agree nor disagree", value: 3, weight: 1 },
        { id: "option-4", label: "Agree", value: 4, weight: 1 },
        { id: "option-5", label: "Strongly agree", value: 5, weight: 1 },
      ],
      numeric_min: 0,
      numeric_max: 10,
      numeric_step: 1,
      left_anchor: "Not at all",
      right_anchor: "Extremely",
      min_selections: 0,
      max_selections: 0,
      max_words: 250,
      max_characters: 2000,
      thurstone_weight: 0,
      constant_sum_target: 100,
      matrix_rows: "",
      media_url: "",
      media_mime_type: "",
      randomize_options: false,
      logic_mode: "all",
      logic_rules: [],
      custom_config_notes: "",
    },
  ]);

  useEffect(() => {
    async function loadLibrary() {
      setLoading(true);
      setLibraryError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLibraryError("The researcher questionnaire library could not be loaded.");
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);
      const displayName = String(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "Researcher"
      ).trim() || "Researcher";
      setCurrentUserDisplayName(displayName);

      const [questionnaireResult, accessResult] = await Promise.all([
        supabase
          .from("questionnaires")
          .select(
            "id, slug, name, acronym, category, description, constructs, population, item_count, estimated_minutes, languages, administration_mode, recall_period, self_available, researcher_available, license_status, license_summary, license_source_url, commercial_use_note, modification_note, redistribution_note, owner_user_id, source_type, publication_scope, access_mode, publisher_display_name, publisher_affiliation, publisher_url, published_at"
          )
          .eq("researcher_available", true)
          .eq("status", "active")
          .order("name", { ascending: true }),
        supabase
          .from("questionnaire_access_requests")
          .select("questionnaire_id, status")
          .eq("requester_user_id", user.id),
      ]);

      if (questionnaireResult.error) {
        console.error("Could not load researcher questionnaire library:", questionnaireResult.error);
        setLibraryError(
          "The questionnaire library could not be loaded. Make sure the questionnaire publishing migration has been run in Supabase."
        );
        setLoading(false);
        return;
      }

      const accessByQuestionnaire = new Map<string, Questionnaire["my_access_status"]>();
      if (!accessResult.error) {
        for (const row of accessResult.data || []) {
          accessByQuestionnaire.set(
            String(row.questionnaire_id),
            row.status as Questionnaire["my_access_status"]
          );
        }
      }

      setQuestionnaires(
        ((questionnaireResult.data || []) as Questionnaire[]).map((questionnaire) => ({
          ...questionnaire,
          my_access_status: accessByQuestionnaire.get(questionnaire.id) || null,
        }))
      );
      setLoading(false);
    }

    void loadLibrary();
  }, []);

  function questionnaireCanUse(questionnaire: Questionnaire) {
    if (!questionnaire.owner_user_id) return true;
    if (questionnaire.owner_user_id === currentUserId) return true;
    if (questionnaire.publication_scope !== "published") return false;
    if (questionnaire.access_mode === "free") return true;
    return (
      questionnaire.access_mode === "request" &&
      questionnaire.my_access_status === "approved"
    );
  }

  function questionnairePublicationLabel(questionnaire: Questionnaire) {
    if (questionnaire.owner_user_id === currentUserId) {
      if (questionnaire.publication_scope !== "published") return "Private";
      return questionnaire.access_mode === "free"
        ? "Published · free to use"
        : "Published · permission required";
    }

    if (questionnaire.source_type !== "researcher_created") return "PsyLattice catalogue";
    if (questionnaire.access_mode === "free") return "Free to use";
    if (questionnaire.my_access_status === "approved") return "Access granted";
    if (questionnaire.my_access_status === "pending") return "Access requested";
    return "Permission required";
  }

  async function loadQuestionnaireAccessRequests(questionnaireId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("questionnaire_access_requests")
      .select(
        "id, questionnaire_id, requester_user_id, requester_display_name, requester_affiliation, message, status, created_at, reviewed_at"
      )
      .eq("questionnaire_id", questionnaireId)
      .order("created_at", { ascending: false });

    if (!error) {
      setAccessRequests((data || []) as QuestionnaireAccessRequest[]);
    }
  }

  async function requestQuestionnaireAccess(questionnaire: Questionnaire) {
    if (accessBusy || questionnaire.owner_user_id === currentUserId) return;
    setAccessBusy(true);
    setLibraryError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "psylattice_request_questionnaire_access",
        {
          p_questionnaire_id: questionnaire.id,
          p_requester_display_name: currentUserDisplayName,
          p_requester_affiliation: null,
          p_message: accessRequestMessage.trim() || null,
        }
      );

      if (error || !data?.ok) {
        throw error || new Error(data?.error || "The access request could not be sent.");
      }

      const next = { ...questionnaire, my_access_status: "pending" as const };
      setQuestionnaires((previous) =>
        previous.map((item) => (item.id === questionnaire.id ? next : item))
      );
      setSelectedQuestionnaire(next);
      setAccessRequestMessage("");
    } catch (error) {
      setLibraryError(
        error instanceof Error ? error.message : "The access request could not be sent."
      );
    } finally {
      setAccessBusy(false);
    }
  }

  async function reviewQuestionnaireAccess(
    requestId: string,
    decision: "approved" | "denied" | "revoked"
  ) {
    if (accessBusy || !selectedQuestionnaire) return;
    setAccessBusy(true);
    setLibraryError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "psylattice_review_questionnaire_access",
        {
          p_request_id: requestId,
          p_decision: decision,
        }
      );

      if (error || !data?.ok) {
        throw error || new Error(data?.error || "The access request could not be updated.");
      }

      await loadQuestionnaireAccessRequests(selectedQuestionnaire.id);
    } catch (error) {
      setLibraryError(
        error instanceof Error ? error.message : "The access request could not be updated."
      );
    } finally {
      setAccessBusy(false);
    }
  }

  async function updateQuestionnairePublication(
    questionnaire: Questionnaire,
    mode: "private" | "free" | "restricted"
  ) {
    if (accessBusy || questionnaire.owner_user_id !== currentUserId) return;
    setAccessBusy(true);
    setLibraryError("");

    const publicationScope = mode === "private" ? "private" : "published";
    const accessMode =
      mode === "private" ? "owner_only" : mode === "free" ? "free" : "request";

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("questionnaires")
        .update({
          publication_scope: publicationScope,
          access_mode: accessMode,
          publisher_display_name:
            questionnaire.publisher_display_name || currentUserDisplayName,
          published_at: publicationScope === "published" ? new Date().toISOString() : null,
        })
        .eq("id", questionnaire.id)
        .eq("owner_user_id", currentUserId)
        .select(
          "id, slug, name, acronym, category, description, constructs, population, item_count, estimated_minutes, languages, administration_mode, recall_period, self_available, researcher_available, license_status, license_summary, license_source_url, commercial_use_note, modification_note, redistribution_note, owner_user_id, source_type, publication_scope, access_mode, publisher_display_name, publisher_affiliation, publisher_url, published_at"
        )
        .single();

      if (error || !data) {
        throw error || new Error("Publication settings could not be updated.");
      }

      const updated = {
        ...(data as Questionnaire),
        my_access_status: questionnaire.my_access_status || null,
      };
      setQuestionnaires((previous) =>
        previous.map((item) => (item.id === questionnaire.id ? updated : item))
      );
      setSelectedQuestionnaire(updated);

      if (updated.access_mode === "request") {
        await loadQuestionnaireAccessRequests(updated.id);
      } else {
        setAccessRequests([]);
      }
    } catch (error) {
      setLibraryError(
        error instanceof Error ? error.message : "Publication settings could not be updated."
      );
    } finally {
      setAccessBusy(false);
    }
  }

  async function openQuestionnaire(questionnaire: Questionnaire) {
    setSelectedQuestionnaire(questionnaire);
    setSelectedVersion(null);
    setItems([]);
    setResources([]);
    setReferences([]);
    setAccessRequests([]);
    setAccessRequestMessage("");
    setDetailLoading(true);
    setLibraryError("");
    setCopiedReferenceId("");

    const isOwner = questionnaire.owner_user_id === currentUserId;
    if (isOwner && questionnaire.access_mode === "request") {
      void loadQuestionnaireAccessRequests(questionnaire.id);
    }

    if (!questionnaireCanUse(questionnaire)) {
      setDetailLoading(false);
      return;
    }

    const supabase = createClient();

    const [versionResult, resourceResult, referenceResult] = await Promise.all([
      supabase
        .from("questionnaire_versions")
        .select(
          "id, questionnaire_id, version_label, participant_instructions, researcher_instructions, response_scale_description, scoring_summary, score_multiplier"
        )
        .eq("questionnaire_id", questionnaire.id)
        .eq("is_current", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("questionnaire_resources")
        .select(
          "id, resource_type, title, url, source_name, is_official, download_allowed, access_note, sort_order"
        )
        .eq("questionnaire_id", questionnaire.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("questionnaire_references")
        .select("id, citation, url, sort_order")
        .eq("questionnaire_id", questionnaire.id)
        .order("sort_order", { ascending: true }),
    ]);

    if (versionResult.error) {
      setLibraryError("This questionnaire's administration information could not be loaded.");
      setDetailLoading(false);
      return;
    }

    const version = versionResult.data
      ? (versionResult.data as QuestionnaireVersion)
      : null;

    setSelectedVersion(version);
    setResources((resourceResult.data || []) as QuestionnaireResource[]);
    setReferences((referenceResult.data || []) as QuestionnaireReference[]);

    if (version) {
      const { data: itemData, error: itemError } = await supabase
        .from("questionnaire_items")
        .select(
          "id, position, prompt, subscale, reverse_scored, response_type, response_options, required"
        )
        .eq("version_id", version.id)
        .order("position", { ascending: true });

      if (!itemError) {
        setItems((itemData || []) as QuestionnaireItem[]);
      }
    }

    setDetailLoading(false);
  }

  async function copyCitation(reference: QuestionnaireReference) {
    try {
      await navigator.clipboard.writeText(reference.citation);
      setCopiedReferenceId(reference.id);
      window.setTimeout(() => setCopiedReferenceId(""), 1800);
    } catch (error) {
      console.error("Could not copy citation:", error);
    }
  }

  function licenceLabel(status: Questionnaire["license_status"]) {
    if (status === "public_domain") return "Public domain";
    if (status === "permitted") return "Use permitted / terms apply";
    if (status === "restricted") return "Restricted";
    if (status === "researcher_owned") return "Researcher-created";
    return "Rights need verification";
  }

  function licenceStatusType(
    status: Questionnaire["license_status"]
  ): "success" | "warning" | "neutral" | "accent" {
    if (status === "public_domain") return "success";
    if (status === "permitted") return "accent";
    if (status === "restricted") return "warning";
    if (status === "researcher_owned") return "accent";
    return "neutral";
  }

  const itemTypeDefinitions = [
    { value: "likert", label: "Likert / agreement scale", group: "Ratings" },
    { value: "frequency", label: "Frequency scale", group: "Ratings" },
    { value: "intensity", label: "Intensity / severity scale", group: "Ratings" },
    { value: "numeric_rating", label: "Numeric rating scale", group: "Ratings" },
    { value: "slider", label: "Slider", group: "Ratings" },
    { value: "visual_analogue", label: "Visual analogue scale (VAS)", group: "Ratings" },
    { value: "semantic_differential", label: "Semantic differential", group: "Ratings" },
    { value: "star_rating", label: "Star / icon rating", group: "Ratings" },
    { value: "yes_no", label: "Yes / No", group: "Choice" },
    { value: "true_false", label: "True / False", group: "Choice" },
    { value: "single_choice", label: "Single choice", group: "Choice" },
    { value: "multiple_choice", label: "Multiple choice", group: "Choice" },
    { value: "dropdown", label: "Dropdown", group: "Choice" },
    { value: "checklist", label: "Checklist", group: "Choice" },
    { value: "image_choice", label: "Image choice", group: "Choice" },
    { value: "thurstone", label: "Thurstone weighted endorsement", group: "Psychometric" },
    { value: "guttman", label: "Guttman / cumulative item", group: "Psychometric" },
    { value: "forced_choice", label: "Forced choice / ipsative", group: "Psychometric" },
    { value: "q_sort", label: "Q-sort", group: "Psychometric" },
    { value: "ranking", label: "Ranking", group: "Comparative" },
    { value: "pairwise", label: "Pairwise comparison", group: "Comparative" },
    { value: "best_worst", label: "Best–worst / MaxDiff", group: "Comparative" },
    { value: "constant_sum", label: "Constant sum / allocate points", group: "Comparative" },
    { value: "likert_matrix", label: "Likert matrix / grid", group: "Matrix" },
    { value: "single_choice_matrix", label: "Single-choice matrix", group: "Matrix" },
    { value: "multiple_choice_matrix", label: "Multiple-choice matrix", group: "Matrix" },
    { value: "semantic_matrix", label: "Semantic differential matrix", group: "Matrix" },
    { value: "short_text", label: "Short text", group: "Text & data" },
    { value: "long_text", label: "Long text / paragraph", group: "Text & data" },
    { value: "integer", label: "Integer", group: "Text & data" },
    { value: "decimal", label: "Decimal number", group: "Text & data" },
    { value: "percentage", label: "Percentage", group: "Text & data" },
    { value: "date", label: "Date", group: "Text & data" },
    { value: "time", label: "Time", group: "Text & data" },
    { value: "datetime", label: "Date + time", group: "Text & data" },
    { value: "duration", label: "Duration", group: "Text & data" },
    { value: "email", label: "Email field", group: "Text & data" },
    { value: "phone", label: "Phone field", group: "Text & data" },
    { value: "location", label: "Location entry", group: "Text & data" },
    { value: "file_upload", label: "File upload", group: "Uploads" },
    { value: "image_upload", label: "Image upload", group: "Uploads" },
    { value: "audio_response", label: "Audio response", group: "Uploads" },
    { value: "video_response", label: "Video response", group: "Uploads" },
    { value: "heading", label: "Heading / section title", group: "Content" },
    { value: "instructions", label: "Instruction / information text", group: "Content" },
    { value: "divider", label: "Divider / page separator", group: "Content" },
    { value: "image_content", label: "Image stimulus / content", group: "Content" },
    { value: "audio_content", label: "Audio stimulus / content", group: "Content" },
    { value: "video_content", label: "Video stimulus / content", group: "Content" },
    { value: "custom", label: "Custom / future item type", group: "Advanced" },
  ];

  const optionItemTypes = new Set([
    "likert", "frequency", "intensity", "yes_no", "true_false",
    "single_choice", "multiple_choice", "dropdown", "checklist", "image_choice",
    "thurstone", "guttman", "forced_choice", "q_sort", "ranking", "pairwise",
    "best_worst", "constant_sum", "likert_matrix", "single_choice_matrix",
    "multiple_choice_matrix", "semantic_matrix", "semantic_differential",
  ]);

  const numericItemTypes = new Set([
    "numeric_rating", "slider", "visual_analogue", "star_rating",
    "integer", "decimal", "percentage", "duration",
  ]);

  const textItemTypes = new Set(["short_text", "long_text", "email", "phone", "location"]);
  const matrixItemTypes = new Set(["likert_matrix", "single_choice_matrix", "multiple_choice_matrix", "semantic_matrix"]);
  const contentItemTypes = new Set(["heading", "instructions", "divider", "image_content", "audio_content", "video_content"]);
  const collectionLogicTypes = new Set(["multiple_choice", "checklist"]);
  const orderedChoiceLogicTypes = new Set([
    "likert",
    "frequency",
    "intensity",
    "thurstone",
    "guttman",
    "semantic_differential",
  ]);
  const objectLogicTypes = new Set([
    "q_sort",
    "ranking",
    "pairwise",
    "best_worst",
    "constant_sum",
    "likert_matrix",
    "single_choice_matrix",
    "multiple_choice_matrix",
    "semantic_matrix",
  ]);
  const dateTimeLogicTypes = new Set(["date", "time", "datetime"]);

  const logicOperatorLabels: Record<BuilderLogicRule["operator"], string> = {
    equals: "is",
    not_equals: "is not",
    greater_than: "is greater than",
    greater_than_or_equal: "is greater than or equal to",
    less_than: "is less than",
    less_than_or_equal: "is less than or equal to",
    contains: "includes",
    not_contains: "does not include",
    answered: "has been answered",
    not_answered: "has not been answered",
  };

  function logicOperatorsForSource(source: BuilderItem | null) {
    if (!source) {
      return ["answered", "not_answered"] as BuilderLogicRule["operator"][];
    }

    if (collectionLogicTypes.has(source.item_type)) {
      return [
        "contains",
        "not_contains",
        "answered",
        "not_answered",
      ] as BuilderLogicRule["operator"][];
    }

    if (objectLogicTypes.has(source.item_type)) {
      return ["answered", "not_answered"] as BuilderLogicRule["operator"][];
    }

    if (
      numericItemTypes.has(source.item_type) ||
      orderedChoiceLogicTypes.has(source.item_type) ||
      dateTimeLogicTypes.has(source.item_type)
    ) {
      return [
        "equals",
        "not_equals",
        "greater_than",
        "greater_than_or_equal",
        "less_than",
        "less_than_or_equal",
        "answered",
        "not_answered",
      ] as BuilderLogicRule["operator"][];
    }

    if (source.options.length > 0) {
      return [
        "equals",
        "not_equals",
        "answered",
        "not_answered",
      ] as BuilderLogicRule["operator"][];
    }

    return [
      "equals",
      "not_equals",
      "contains",
      "not_contains",
      "answered",
      "not_answered",
    ] as BuilderLogicRule["operator"][];
  }

  function logicRuleNeedsValue(operator: BuilderLogicRule["operator"]) {
    return operator !== "answered" && operator !== "not_answered";
  }

  function logicDefaultValueForSource(source: BuilderItem | null) {
    if (!source || source.options.length === 0) return "";
    return String(source.options[0]?.value ?? "");
  }

  function logicSourceDisplay(source: BuilderItem, sourceIndex: number) {
    const wording = source.prompt.trim().replace(/\s+/g, " ");
    const shortWording = wording.length > 72 ? `${wording.slice(0, 69)}…` : wording;
    return `Q${sourceIndex + 1} · ${source.key || "unnamed"}${shortWording ? ` · ${shortWording}` : ""}`;
  }

  function logicExpectedDisplay(source: BuilderItem | null, value: string) {
    if (!source) return value;
    const option = source.options.find(
      (candidate) => String(candidate.value) === String(value)
    );
    return option?.label || value;
  }

  function firstLogicOrderIssue(itemsToCheck: BuilderItem[]) {
    const indexes = new Map(
      itemsToCheck.map((candidate, candidateIndex) => [
        candidate.key.trim(),
        candidateIndex,
      ])
    );

    for (let itemIndex = 0; itemIndex < itemsToCheck.length; itemIndex += 1) {
      const item = itemsToCheck[itemIndex];
      for (const rule of item.logic_rules) {
        const sourceIndex = indexes.get(rule.source_key.trim());
        if (sourceIndex !== undefined && sourceIndex >= itemIndex) {
          return `Branching on ${item.key || `Q${itemIndex + 1}`} must use an earlier question. Move the source question above it or update the condition.`;
        }
      }
    }

    return "";
  }

  function makeBuilderId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function defaultOptionsForType(type: string): BuilderOption[] {
    if (type === "yes_no") {
      return [
        { id: makeBuilderId("option"), label: "Yes", value: 1, weight: 1 },
        { id: makeBuilderId("option"), label: "No", value: 0, weight: 1 },
      ];
    }
    if (type === "true_false") {
      return [
        { id: makeBuilderId("option"), label: "True", value: 1, weight: 1 },
        { id: makeBuilderId("option"), label: "False", value: 0, weight: 1 },
      ];
    }
    if (type === "thurstone") {
      return [
        { id: makeBuilderId("option"), label: "Endorse", value: 1, weight: 1 },
        { id: makeBuilderId("option"), label: "Do not endorse", value: 0, weight: 1 },
      ];
    }
    if (type === "semantic_differential" || type === "semantic_matrix") {
      return Array.from({ length: 7 }, (_, index) => ({
        id: makeBuilderId("option"),
        label: String(index + 1),
        value: index + 1,
        weight: 1,
      }));
    }
    if (type === "likert" || type === "likert_matrix") {
      return [
        { id: makeBuilderId("option"), label: "Strongly disagree", value: 1, weight: 1 },
        { id: makeBuilderId("option"), label: "Disagree", value: 2, weight: 1 },
        { id: makeBuilderId("option"), label: "Neither agree nor disagree", value: 3, weight: 1 },
        { id: makeBuilderId("option"), label: "Agree", value: 4, weight: 1 },
        { id: makeBuilderId("option"), label: "Strongly agree", value: 5, weight: 1 },
      ];
    }
    return [
      { id: makeBuilderId("option"), label: "Option 1", value: 1, weight: 1 },
      { id: makeBuilderId("option"), label: "Option 2", value: 2, weight: 1 },
    ];
  }

  function makeDefaultItem(position: number, blockId?: string): BuilderItem {
    return {
      id: makeBuilderId("item"),
      key: `q${position}`,
      prompt: "",
      help_text: "",
      item_type: "likert",
      block_id: blockId || builderBlocks[0]?.id || "",
      subscale: "",
      reverse_scored: false,
      required: true,
      options: defaultOptionsForType("likert"),
      numeric_min: 0,
      numeric_max: 10,
      numeric_step: 1,
      left_anchor: "Not at all",
      right_anchor: "Extremely",
      min_selections: 0,
      max_selections: 0,
      max_words: 250,
      max_characters: 2000,
      thurstone_weight: 0,
      constant_sum_target: 100,
      matrix_rows: "",
      media_url: "",
      media_mime_type: "",
      randomize_options: false,
      logic_mode: "all",
      logic_rules: [],
      custom_config_notes: "",
    };
  }

  function resetCustomBuilder() {
    const blockId = makeBuilderId("block");
    setBuilderName("");
    setBuilderAcronym("");
    setBuilderCategory("Custom");
    setBuilderDescription("");
    setBuilderConstructs("");
    setBuilderPopulation("");
    setBuilderEstimatedMinutes(5);
    setBuilderRecallPeriod("");
    setBuilderLanguages("English");
    setBuilderParticipantInstructions("");
    setBuilderResearcherInstructions("");
    setBuilderScoringSummary("");
    setBuilderScoringMethod("none");
    setBuilderScoringFormula("");
    setBuilderMissingRule("complete_case");
    setBuilderRandomizeItems(false);
    setBuilderRightsConfirmed(false);
    setBuilderPublicationMode("private");
    setBuilderPublisherName(currentUserDisplayName);
    setBuilderPublisherAffiliation("");
    setBuilderPublisherUrl("");
    setBuilderMediaUploadState({});
    Object.values(builderMediaPreviews).forEach((url) => URL.revokeObjectURL(url));
    setBuilderMediaPreviews({});
    setBuilderBlocks([
      {
        id: blockId,
        key: "block_1",
        title: "Main questionnaire",
        instructions: "",
        randomize_items: false,
        page_break_after: true,
      },
    ]);
    const firstItem = makeDefaultItem(1, blockId);
    setBuilderItems([firstItem]);
    setBuilderError("");
    setBuilderSuccess("");
  }

  function openCustomBuilder() {
    resetCustomBuilder();
    setSelectedQuestionnaire(null);
    setBuilderOpen(true);
  }

  useEffect(() => {
    if (!openCustomBuilderOnMount) {
      return;
    }

    openCustomBuilder();
    onCustomBuilderOpened?.();
  }, [openCustomBuilderOnMount]);

  function itemTypeLabel(type: string) {
    return itemTypeDefinitions.find((item) => item.value === type)?.label || type;
  }

  function questionnaireItemTheme(type: string) {
    const group = itemTypeDefinitions.find((item) => item.value === type)?.group || "Advanced";

    // Keep the questionnaire builder inside the PsyLattice brand palette.
    // Distinction comes from surface tone, border treatment and badge weight,
    // rather than a different hue for every response format.
    const themes: Record<string, { card: string; badge: string; number: string; soft: string; accent: string }> = {
      Ratings: {
        card: "border-cyan-200 border-l-cyan-600 bg-white",
        badge: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200",
        number: "bg-cyan-50 text-cyan-800",
        soft: "border-cyan-100 bg-cyan-50/40",
        accent: "text-cyan-700",
      },
      Choice: {
        card: "border-slate-200 border-l-cyan-400 bg-slate-50/45",
        badge: "bg-white text-cyan-800 ring-1 ring-cyan-200",
        number: "bg-white text-cyan-800 ring-1 ring-cyan-100",
        soft: "border-slate-300/70 bg-white",
        accent: "text-cyan-700",
      },
      Psychometric: {
        card: "border-slate-300 border-l-slate-950 bg-white",
        badge: "bg-slate-950 text-white",
        number: "bg-slate-950 text-white",
        soft: "border-slate-200 bg-slate-50/60",
        accent: "text-slate-900",
      },
      Comparative: {
        card: "border-slate-200 border-l-slate-600 bg-slate-50/45",
        badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        number: "bg-slate-100 text-slate-700",
        soft: "border-slate-300/70 bg-white",
        accent: "text-slate-700",
      },
      Matrix: {
        card: "border-cyan-200 border-l-cyan-800 bg-cyan-50/25",
        badge: "bg-cyan-950 text-cyan-50",
        number: "bg-cyan-950 text-cyan-50",
        soft: "border-cyan-100 bg-white",
        accent: "text-cyan-900",
      },
      "Text & data": {
        card: "border-slate-200 border-l-cyan-500 bg-white",
        badge: "bg-white text-cyan-800 ring-1 ring-cyan-200",
        number: "bg-cyan-50 text-cyan-800",
        soft: "border-slate-200 bg-slate-50/55",
        accent: "text-cyan-700",
      },
      Uploads: {
        card: "border-dashed border-cyan-300 border-l-cyan-700 bg-cyan-50/20",
        badge: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200",
        number: "bg-cyan-50 text-cyan-800",
        soft: "border-dashed border-cyan-200 bg-white",
        accent: "text-cyan-700",
      },
      Content: {
        card: "border-dashed border-slate-300 border-l-slate-500 bg-slate-50",
        badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        number: "bg-slate-100 text-slate-700",
        soft: "border-dashed border-slate-300/70 bg-white",
        accent: "text-slate-600",
      },
      Advanced: {
        card: "border-slate-300 border-l-slate-800 bg-slate-50/60",
        badge: "bg-slate-800 text-white",
        number: "bg-slate-800 text-white",
        soft: "border-slate-300/70 bg-white",
        accent: "text-slate-800",
      },
    };

    return themes[group] || themes.Advanced;
  }

  function questionnairePageTheme(_index: number) {
    // Pages are navigation/structure, so they deliberately use one neutral
    // treatment. This keeps them visually distinct from answerable items.
    return {
      card: "border-slate-300 border-l-slate-950 bg-slate-50/70",
      badge: "bg-slate-950 text-white",
    };
  }

  function builderMediaAccept(type: string) {
    if (type === "image_content" || type === "image_choice") return "image/*";
    if (type === "audio_content") return "audio/*";
    if (type === "video_content") return "video/*";
    return "image/*,audio/*,video/*";
  }

  function builderMediaLabel(type: string) {
    if (type === "image_content") return "Upload image stimulus";
    if (type === "audio_content") return "Upload audio stimulus";
    if (type === "video_content") return "Upload video stimulus";
    return "Attach image / audio / video (optional)";
  }

  async function uploadBuilderMedia(
    file: File,
    itemId: string,
    optionId?: string
  ) {
    const uploadKey = optionId ? `${itemId}:${optionId}` : itemId;
    setBuilderError("");
    setBuilderMediaUploadState((previous) => ({
      ...previous,
      [uploadKey]: "Uploading...",
    }));

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Your researcher session expired. Please sign in again.");
      }

      const ticketResponse = await fetch("/api/media/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: "researcher_upload",
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
          mediaKind: optionId ? "option_image" : "question_media",
        }),
      });

      const ticket = (await ticketResponse.json()) as {
        ok?: boolean;
        error?: string;
        bucket?: string;
        path?: string;
        token?: string;
        storage_ref?: string;
      };

      if (!ticketResponse.ok || !ticket.ok || !ticket.bucket || !ticket.path || !ticket.token || !ticket.storage_ref) {
        throw new Error(ticket.error || "Could not prepare the media upload.");
      }

      const { error: uploadError } = await supabase.storage
        .from(ticket.bucket)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type || undefined,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      if (optionId) {
        updateBuilderOption(itemId, optionId, {
          media_url: ticket.storage_ref,
          media_mime_type: file.type,
        });
      } else {
        updateBuilderItem(itemId, {
          media_url: ticket.storage_ref,
          media_mime_type: file.type,
        });
      }

      setBuilderMediaPreviews((previous) => {
        const prior = previous[uploadKey];
        if (prior) URL.revokeObjectURL(prior);
        return { ...previous, [uploadKey]: URL.createObjectURL(file) };
      });

      setBuilderMediaUploadState((previous) => ({
        ...previous,
        [uploadKey]: "Uploaded",
      }));
    } catch (error) {
      console.error("Questionnaire media upload failed:", error);
      const message = error instanceof Error ? error.message : "Media upload failed.";
      setBuilderMediaUploadState((previous) => ({
        ...previous,
        [uploadKey]: `Error: ${message}`,
      }));
      setBuilderError(message);
    }
  }

  function updateBuilderItem(id: string, patch: Partial<BuilderItem>) {
    setBuilderItems((previous) => {
      const source = previous.find((item) => item.id === id);
      const oldKey = source?.key.trim() || "";
      const nextKey =
        typeof patch.key === "string" ? patch.key.trim() : oldKey;

      return previous.map((item) => {
        const updated = item.id === id ? { ...item, ...patch } : item;

        if (!oldKey || !nextKey || oldKey === nextKey) {
          return updated;
        }

        return {
          ...updated,
          logic_rules: updated.logic_rules.map((rule) =>
            rule.source_key.trim() === oldKey
              ? { ...rule, source_key: nextKey }
              : rule
          ),
        };
      });
    });
  }

  function changeBuilderItemType(id: string, type: string) {
    setBuilderItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;
        const contentOnly = contentItemTypes.has(type);
        return {
          ...item,
          item_type: type,
          required: contentOnly ? false : item.required,
          reverse_scored: contentOnly ? false : item.reverse_scored,
          options: optionItemTypes.has(type) ? defaultOptionsForType(type) : [],
        };
      })
    );
  }

  function addBuilderItem(blockId?: string, itemType = "likert") {
    if (builderItems.length >= 500) return;
    setBuilderItems((previous) => {
      const targetBlockId = blockId || builderBlocks[0]?.id || "";
      const base = makeDefaultItem(previous.length + 1, targetBlockId);
      const contentOnly = contentItemTypes.has(itemType);
      const nextItem: BuilderItem = {
        ...base,
        item_type: itemType,
        required: contentOnly ? false : base.required,
        reverse_scored: contentOnly ? false : base.reverse_scored,
        options: optionItemTypes.has(itemType)
          ? defaultOptionsForType(itemType)
          : [],
      };

      const targetBlockIndex = builderBlocks.findIndex(
        (block) => block.id === targetBlockId
      );
      const insertAt = previous.findIndex((item) => {
        const itemBlockIndex = builderBlocks.findIndex(
          (block) => block.id === item.block_id
        );
        return itemBlockIndex > targetBlockIndex;
      });

      if (insertAt < 0) return [...previous, nextItem];
      const next = [...previous];
      next.splice(insertAt, 0, nextItem);
      return next;
    });
  }

  function duplicateBuilderItem(id: string) {
    setBuilderItems((previous) => {
      const sourceIndex = previous.findIndex((item) => item.id === id);
      const source = previous[sourceIndex];
      if (!source || sourceIndex < 0 || previous.length >= 500) return previous;

      const duplicate: BuilderItem = {
        ...source,
        id: makeBuilderId("item"),
        key: `${source.key || "q"}_copy_${previous.length + 1}`,
        options: source.options.map((option) => ({
          ...option,
          id: makeBuilderId("option"),
        })),
        logic_rules: source.logic_rules.map((rule) => ({
          ...rule,
          id: makeBuilderId("logic"),
        })),
      };

      const next = [...previous];
      next.splice(sourceIndex + 1, 0, duplicate);
      return next;
    });
  }

  function removeBuilderItem(id: string) {
    if (builderItems.length <= 1) return;

    setBuilderItems((previous) => {
      const removed = previous.find((item) => item.id === id);
      const removedKey = removed?.key.trim() || "";

      return previous
        .filter((item) => item.id !== id)
        .map((item) => ({
          ...item,
          logic_rules: removedKey
            ? item.logic_rules.filter(
                (rule) => rule.source_key.trim() !== removedKey
              )
            : item.logic_rules,
        }));
    });
  }

  function moveBuilderItemWithinBlock(id: string, direction: -1 | 1) {
    const sourceIndex = builderItems.findIndex((item) => item.id === id);
    if (sourceIndex < 0) return;

    const source = builderItems[sourceIndex];
    const siblingIndexes = builderItems
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.block_id === source.block_id)
      .map((entry) => entry.index);

    const localIndex = siblingIndexes.indexOf(sourceIndex);
    const targetLocalIndex = localIndex + direction;
    if (
      localIndex < 0 ||
      targetLocalIndex < 0 ||
      targetLocalIndex >= siblingIndexes.length
    ) {
      return;
    }

    const targetIndex = siblingIndexes[targetLocalIndex];
    const next = [...builderItems];
    [next[sourceIndex], next[targetIndex]] = [next[targetIndex], next[sourceIndex]];

    const issue = firstLogicOrderIssue(next);
    if (issue) {
      setBuilderError(issue);
      return;
    }

    setBuilderError("");
    setBuilderItems(next);
  }

  function addBuilderOption(itemId: string) {
    setBuilderItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              options: [
                ...item.options,
                {
                  id: makeBuilderId("option"),
                  label: `Option ${item.options.length + 1}`,
                  value: item.options.length + 1,
                  weight: 1,
                  media_url: "",
                  media_mime_type: "",
                },
              ],
            }
          : item
      )
    );
  }

  function updateBuilderOption(
    itemId: string,
    optionId: string,
    patch: Partial<BuilderOption>
  ) {
    setBuilderItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              options: item.options.map((option) =>
                option.id === optionId ? { ...option, ...patch } : option
              ),
            }
          : item
      )
    );
  }

  function removeBuilderOption(itemId: string, optionId: string) {
    setBuilderItems((previous) =>
      previous.map((item) =>
        item.id === itemId && item.options.length > 2
          ? {
              ...item,
              options: item.options.filter((option) => option.id !== optionId),
            }
          : item
      )
    );
  }

  function addBuilderBlock() {
    const number = builderBlocks.length + 1;
    const blockId = makeBuilderId("block");
    setBuilderBlocks((previous) => [
      ...previous,
      {
        id: blockId,
        key: `block_${number}`,
        title: `Section ${number}`,
        instructions: "",
        randomize_items: false,
        page_break_after: true,
      },
    ]);
    addBuilderItem(blockId, "likert");
  }

  function updateBuilderBlock(id: string, patch: Partial<BuilderBlock>) {
    setBuilderBlocks((previous) =>
      previous.map((block) =>
        block.id === id ? { ...block, ...patch } : block
      )
    );
  }

  function removeBuilderBlock(id: string) {
    if (builderBlocks.length <= 1) return;
    const block = builderBlocks.find((candidate) => candidate.id === id);
    const itemCount = builderItems.filter((item) => item.block_id === id).length;
    const confirmed =
      itemCount === 0 ||
      window.confirm(
        `Remove ${block?.title || "this block"} and its ${itemCount} item${
          itemCount === 1 ? "" : "s"
        }?`
      );
    if (!confirmed) return;

    const removedKeys = new Set(
      builderItems
        .filter((item) => item.block_id === id)
        .map((item) => item.key.trim())
        .filter(Boolean)
    );

    setBuilderBlocks((previous) => previous.filter((candidate) => candidate.id !== id));
    setBuilderItems((previous) =>
      previous
        .filter((item) => item.block_id !== id)
        .map((item) => ({
          ...item,
          logic_rules: item.logic_rules.filter(
            (rule) => !removedKeys.has(rule.source_key.trim())
          ),
        }))
    );
  }

  function addLogicRule(itemId: string) {
    setBuilderItems((previous) => {
      const itemIndex = previous.findIndex((item) => item.id === itemId);
      if (itemIndex < 0) return previous;

      const source = [...previous.slice(0, itemIndex)]
        .reverse()
        .find((candidate) => !contentItemTypes.has(candidate.item_type));

      if (!source) return previous;

      const operator = logicOperatorsForSource(source)[0] || "answered";

      return previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              logic_rules: [
                ...item.logic_rules,
                {
                  id: makeBuilderId("logic"),
                  source_key: source.key.trim(),
                  operator,
                  value: logicRuleNeedsValue(operator)
                    ? logicDefaultValueForSource(source)
                    : "",
                },
              ],
            }
          : item
      );
    });
  }

  function updateLogicRule(
    itemId: string,
    ruleId: string,
    patch: Partial<BuilderLogicRule>
  ) {
    setBuilderItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              logic_rules: item.logic_rules.map((rule) =>
                rule.id === ruleId ? { ...rule, ...patch } : rule
              ),
            }
          : item
      )
    );
  }

  function changeLogicRuleSource(
    itemId: string,
    ruleId: string,
    sourceKey: string
  ) {
    const source = builderItems.find(
      (candidate) => candidate.key.trim() === sourceKey
    );
    const operator = logicOperatorsForSource(source || null)[0] || "answered";

    updateLogicRule(itemId, ruleId, {
      source_key: sourceKey,
      operator,
      value: logicRuleNeedsValue(operator)
        ? logicDefaultValueForSource(source || null)
        : "",
    });
  }

  function removeLogicRule(itemId: string, ruleId: string) {
    setBuilderItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              logic_rules: item.logic_rules.filter((rule) => rule.id !== ruleId),
            }
          : item
      )
    );
  }

  function renderLogicValueControl(
    item: BuilderItem,
    rule: BuilderLogicRule,
    source: BuilderItem | null
  ) {
    if (!logicRuleNeedsValue(rule.operator)) {
      return (
        <div className="flex min-h-11 items-center rounded-xl bg-slate-50 px-3 text-xs text-slate-400">
          No comparison value needed
        </div>
      );
    }

    if (source && source.options.length > 0 && !objectLogicTypes.has(source.item_type)) {
      return (
        <select
          value={rule.value}
          onChange={(event) =>
            updateLogicRule(item.id, rule.id, { value: event.target.value })
          }
          className="w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
        >
          <option value="">Choose a response...</option>
          {source.options.map((option) => (
            <option key={option.id} value={String(option.value)}>
              {option.label} ({option.value})
            </option>
          ))}
        </select>
      );
    }

    const inputType = numericItemTypes.has(source?.item_type || "")
      ? "number"
      : source?.item_type === "date"
        ? "date"
        : source?.item_type === "time"
          ? "time"
          : source?.item_type === "datetime"
            ? "datetime-local"
            : "text";

    return (
      <input
        type={inputType}
        value={rule.value}
        onChange={(event) =>
          updateLogicRule(item.id, rule.id, { value: event.target.value })
        }
        placeholder={inputType === "text" ? "Comparison value" : undefined}
        className="w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
      />
    );
  }

  function renderLogicBuilder(item: BuilderItem, itemIndex: number) {
    const previousSources = builderItems
      .slice(0, itemIndex)
      .filter((candidate) => !contentItemTypes.has(candidate.item_type));

    return (
      <div className="mt-5 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-200 bg-cyan-50/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Display logic / branching</p>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
              Show this item only when earlier answers meet the conditions below.
              Choose the source question and response — no item-key typing is required.
            </p>
          </div>
          <button
            type="button"
            onClick={() => addLogicRule(item.id)}
            disabled={previousSources.length === 0}
            className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Condition
          </button>
        </div>

        {previousSources.length === 0 && (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-500">
            Add an earlier answerable question before using branching here.
          </div>
        )}

        {item.logic_rules.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-100 bg-white p-3">
              <span className="text-xs font-medium text-slate-500">Show this item when</span>
              <select
                value={item.logic_mode}
                onChange={(event) =>
                  updateBuilderItem(item.id, {
                    logic_mode: event.target.value as "all" | "any",
                  })
                }
                className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-xs font-semibold"
              >
                <option value="all">ALL conditions are true (AND)</option>
                <option value="any">ANY condition is true (OR)</option>
              </select>
            </div>

            <div className="mt-3 space-y-3">
              {item.logic_rules.map((rule, ruleIndex) => {
                const source =
                  previousSources.find(
                    (candidate) => candidate.key.trim() === rule.source_key.trim()
                  ) || null;
                const operators = logicOperatorsForSource(source);
                const invalidSource = !source;

                return (
                  <div
                    key={rule.id}
                    className={`rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] p-3 ${
                      invalidSource
                        ? "border-cyan-300 bg-cyan-50/60"
                        : "border-slate-300/70 bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Condition {ruleIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLogicRule(item.id, rule.id)}
                        className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-700"
                        aria-label={`Remove condition ${ruleIndex + 1}`}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-2 lg:grid-cols-[1.25fr_.9fr_1fr]">
                      <label>
                        <span className="text-[11px] font-medium text-slate-500">Earlier question</span>
                        <select
                          value={source?.key.trim() || ""}
                          onChange={(event) =>
                            changeLogicRuleSource(
                              item.id,
                              rule.id,
                              event.target.value
                            )
                          }
                          className={`mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] bg-white px-3 py-2.5 text-sm ${
                            invalidSource ? "border-violet-300" : "border-slate-200"
                          }`}
                        >
                          <option value="">Choose an earlier question...</option>
                          {previousSources.map((candidate) => {
                            const sourceIndex = builderItems.findIndex(
                              (entry) => entry.id === candidate.id
                            );
                            return (
                              <option key={candidate.id} value={candidate.key.trim()}>
                                {logicSourceDisplay(candidate, sourceIndex)}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      <label>
                        <span className="text-[11px] font-medium text-slate-500">Condition</span>
                        <select
                          value={operators.includes(rule.operator) ? rule.operator : operators[0]}
                          onChange={(event) => {
                            const operator = event.target
                              .value as BuilderLogicRule["operator"];
                            updateLogicRule(item.id, rule.id, {
                              operator,
                              value: logicRuleNeedsValue(operator)
                                ? rule.value || logicDefaultValueForSource(source)
                                : "",
                            });
                          }}
                          disabled={!source}
                          className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)] disabled:opacity-50"
                        >
                          {operators.map((operator) => (
                            <option key={operator} value={operator}>
                              {logicOperatorLabels[operator]}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span className="text-[11px] font-medium text-slate-500">Response / value</span>
                        <div className="mt-1">
                          {renderLogicValueControl(item, rule, source)}
                        </div>
                      </label>
                    </div>

                    {invalidSource ? (
                      <p className="mt-2 text-xs leading-5 text-violet-800">
                        This condition points to a missing, renamed, or later question.
                        Choose a valid earlier question before saving.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        <span className="font-medium text-slate-700">Preview:</span>{" "}
                        {logicSourceDisplay(
                          source,
                          builderItems.findIndex((entry) => entry.id === source.id)
                        )}{" "}
                        {logicOperatorLabels[rule.operator]}
                        {logicRuleNeedsValue(rule.operator)
                          ? ` ${logicExpectedDisplay(source, rule.value)}`
                          : ""}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/50 px-3 py-2.5 text-xs leading-5 text-cyan-950">
              {item.logic_mode === "all"
                ? "The item appears only after every condition above is true."
                : "The item appears as soon as at least one condition above is true."}
            </div>
          </>
        )}
      </div>
    );
  }


  function renderBuilderItemEditor(item: BuilderItem, index: number) {
    return (
      <div key={item.id} className={`rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-l-4 p-5 ${questionnaireItemTheme(item.item_type).card}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold ${questionnaireItemTheme(item.item_type).number}`}>{index + 1}</div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold">{item.key || `Item ${index + 1}`}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${questionnaireItemTheme(item.item_type).badge}`}>{itemTypeLabel(item.item_type)}</span></div><p className="mt-1 text-[11px] font-medium text-slate-500">{itemTypeDefinitions.find((definition) => definition.value === item.item_type)?.group || "Advanced"}</p></div></div>
          <div className="flex gap-2"><button type="button" onClick={() => moveBuilderItemWithinBlock(item.id, -1)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs">↑</button><button type="button" onClick={() => moveBuilderItemWithinBlock(item.id, 1)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs">↓</button><button type="button" onClick={() => duplicateBuilderItem(item.id)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs">Duplicate</button><button type="button" onClick={() => removeBuilderItem(item.id)} disabled={builderItems.length <= 1} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-red-200 px-2 py-1 text-xs text-red-700 disabled:opacity-30">Remove</button></div>
        </div>
      
        <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr]">
          <label><span className="text-xs text-slate-500">Item key</span><input value={item.key} onChange={(event) => updateBuilderItem(item.id, { key: event.target.value })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label>
          <label><span className="text-xs text-slate-500">Response / content type</span><select value={item.item_type} onChange={(event) => changeBuilderItemType(item.id, event.target.value)} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]">{Array.from(new Set(itemTypeDefinitions.map((definition) => definition.group))).map((group) => <optgroup key={group} label={group}>{itemTypeDefinitions.filter((definition) => definition.group === group).map((definition) => <option key={definition.value} value={definition.value}>{definition.label}</option>)}</optgroup>)}</select></label>
          
        </div>
      
        <label className="mt-4 block"><span className="text-sm font-medium">{contentItemTypes.has(item.item_type) ? "Content / heading" : "Question / statement"}</span><textarea value={item.prompt} onChange={(event) => updateBuilderItem(item.id, { prompt: event.target.value })} rows={2} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
        <label className="mt-3 block"><span className="text-xs text-slate-500">Help text / secondary instructions</span><input value={item.help_text} onChange={(event) => updateBuilderItem(item.id, { help_text: event.target.value })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label>
      
        {!contentItemTypes.has(item.item_type) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label><span className="text-xs text-slate-500">Subscale</span><input value={item.subscale} onChange={(event) => updateBuilderItem(item.id, { subscale: event.target.value })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label>
            <label className="flex items-center gap-2 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm sm:self-end"><input type="checkbox" checked={item.required} onChange={(event) => updateBuilderItem(item.id, { required: event.target.checked })} />Required</label>
            <label className="flex items-center gap-2 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm sm:self-end"><input type="checkbox" checked={item.reverse_scored} onChange={(event) => updateBuilderItem(item.id, { reverse_scored: event.target.checked })} />Reverse scored</label>
          </div>
        )}
      
        {optionItemTypes.has(item.item_type) && (
          <div className={`mt-5 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] p-4 ${questionnaireItemTheme(item.item_type).soft}`}>
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Response options</p><p className="mt-1 text-xs text-slate-400">Participant label, numeric code/score and optional weight are stored separately.</p></div><button type="button" onClick={() => addBuilderOption(item.id)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-xs font-semibold">+ Option</button></div>
            <div className="mt-3 space-y-3">
              {item.options.map((option) => {
                const optionUploadKey = `${item.id}:${option.id}`;
                return (
                  <div key={option.id} className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_90px_90px_auto]">
                      <input value={option.label} onChange={(event) => updateBuilderOption(item.id, option.id, { label: event.target.value })} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-sm" />
                      <input type="number" value={option.value} onChange={(event) => updateBuilderOption(item.id, option.id, { value: Number(event.target.value) })} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-sm" title="Numeric code / score" />
                      <input type="number" step="0.01" value={option.weight} onChange={(event) => updateBuilderOption(item.id, option.id, { weight: Number(event.target.value) })} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-sm" title="Weight" />
                      <button type="button" onClick={() => removeBuilderOption(item.id, option.id)} className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-red-200 bg-white px-3 py-2 text-xs text-red-700">×</button>
                    </div>
      
                    {item.item_type === "image_choice" && (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <label
                            htmlFor={`option-media-${item.id}-${option.id}`}
                            className={`cursor-pointer rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${
                              builderMediaUploadState[optionUploadKey] === "Uploading..."
                                ? "pointer-events-none opacity-60"
                                : ""
                            }`}
                          >
                            {builderMediaUploadState[optionUploadKey] === "Uploading..."
                              ? "Uploading image..."
                              : option.media_url
                                ? "Replace option image"
                                : "Upload option image"}
                          </label>
                          <input
                            id={`option-media-${item.id}-${option.id}`}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={builderMediaUploadState[optionUploadKey] === "Uploading..."}
                            onChange={async (event) => {
                              const input = event.currentTarget;
                              const file = input.files?.[0];
                              if (!file) return;
                              await uploadBuilderMedia(file, item.id, option.id);
                              input.value = "";
                            }}
                          />
                          {builderMediaUploadState[optionUploadKey] && (
                            <span
                              className={`text-xs ${
                                builderMediaUploadState[optionUploadKey].startsWith("Error:")
                                  ? "font-medium text-red-700"
                                  : builderMediaUploadState[optionUploadKey] === "Uploaded"
                                    ? "font-medium text-cyan-700"
                                    : "text-slate-500"
                              }`}
                            >
                              {builderMediaUploadState[optionUploadKey]}
                            </span>
                          )}
                          {option.media_url && (
                            <button
                              type="button"
                              onClick={() => {
                                updateBuilderOption(item.id, option.id, { media_url: "", media_mime_type: "" });
                                setBuilderMediaPreviews((previous) => {
                                  const next = { ...previous };
                                  if (next[optionUploadKey]) URL.revokeObjectURL(next[optionUploadKey]);
                                  delete next[optionUploadKey];
                                  return next;
                                });
                              }}
                              className="text-xs font-semibold text-red-700"
                            >
                              Remove image
                            </button>
                          )}
                        </div>
                        {builderMediaPreviews[optionUploadKey] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={builderMediaPreviews[optionUploadKey]} alt="" className="mt-3 max-h-40 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 object-contain" />
                        ) : option.media_url ? (
                          <p className="mt-2 text-xs text-cyan-700">Stored private option image attached.</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={item.randomize_options} onChange={(event) => updateBuilderItem(item.id, { randomize_options: event.target.checked })} />Randomize option order</label>
          </div>
        )}
      
        {numericItemTypes.has(item.item_type) && (
          <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3"><label><span className="text-xs text-slate-500">Minimum</span><input type="number" value={item.numeric_min} onChange={(event) => updateBuilderItem(item.id, { numeric_min: Number(event.target.value) })} className="mt-1 w-full rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-sm" /></label><label><span className="text-xs text-slate-500">Maximum</span><input type="number" value={item.numeric_max} onChange={(event) => updateBuilderItem(item.id, { numeric_max: Number(event.target.value) })} className="mt-1 w-full rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-sm" /></label><label><span className="text-xs text-slate-500">Step</span><input type="number" step="0.01" value={item.numeric_step} onChange={(event) => updateBuilderItem(item.id, { numeric_step: Number(event.target.value) })} className="mt-1 w-full rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-sm" /></label><label><span className="text-xs text-slate-500">Left / low anchor</span><input value={item.left_anchor} onChange={(event) => updateBuilderItem(item.id, { left_anchor: event.target.value })} className="mt-1 w-full rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-sm" /></label><label><span className="text-xs text-slate-500">Right / high anchor</span><input value={item.right_anchor} onChange={(event) => updateBuilderItem(item.id, { right_anchor: event.target.value })} className="mt-1 w-full rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-2 text-sm" /></label></div>
        )}
      
        {(item.item_type === "multiple_choice" || item.item_type === "checklist" || item.item_type === "ranking" || item.item_type === "best_worst") && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="text-xs text-slate-500">Minimum selections</span><input type="number" min={0} value={item.min_selections} onChange={(event) => updateBuilderItem(item.id, { min_selections: Number(event.target.value) })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="text-xs text-slate-500">Maximum selections</span><input type="number" min={0} value={item.max_selections} onChange={(event) => updateBuilderItem(item.id, { max_selections: Number(event.target.value) })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label></div>
        )}
      
        {textItemTypes.has(item.item_type) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="text-xs text-slate-500">Maximum words</span><input type="number" min={0} value={item.max_words} onChange={(event) => updateBuilderItem(item.id, { max_words: Number(event.target.value) })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="text-xs text-slate-500">Maximum characters</span><input type="number" min={0} value={item.max_characters} onChange={(event) => updateBuilderItem(item.id, { max_characters: Number(event.target.value) })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label></div>
        )}
      
        {item.item_type === "thurstone" && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Hidden Thurstone statement scale value</span><input type="number" step="0.01" value={item.thurstone_weight} onChange={(event) => updateBuilderItem(item.id, { thurstone_weight: Number(event.target.value) })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label>}
        {item.item_type === "constant_sum" && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Required allocation total</span><input type="number" value={item.constant_sum_target} onChange={(event) => updateBuilderItem(item.id, { constant_sum_target: Number(event.target.value) })} className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label>}
        {matrixItemTypes.has(item.item_type) && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Matrix rows — one per line</span><textarea value={item.matrix_rows} onChange={(event) => updateBuilderItem(item.id, { matrix_rows: event.target.value })} className="mt-1 min-h-28 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label>}
        {item.item_type !== "divider" && (
          <div className="mt-4 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{builderMediaLabel(item.item_type)}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Stored privately. Participants receive only a temporary signed viewing URL.</p>
              </div>
              <div>
                <label
                  htmlFor={`question-media-${item.id}`}
                  className={`cursor-pointer rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 ${
                    builderMediaUploadState[item.id] === "Uploading..."
                      ? "pointer-events-none opacity-60"
                      : ""
                  }`}
                >
                  {builderMediaUploadState[item.id] === "Uploading..."
                    ? "Uploading media..."
                    : item.media_url
                      ? "Replace media"
                      : "Upload media"}
                </label>
                <input
                  id={`question-media-${item.id}`}
                  type="file"
                  accept={builderMediaAccept(item.item_type)}
                  className="sr-only"
                  disabled={builderMediaUploadState[item.id] === "Uploading..."}
                  onChange={async (event) => {
                    const input = event.currentTarget;
                    const file = input.files?.[0];
                    if (!file) return;
                    await uploadBuilderMedia(file, item.id);
                    input.value = "";
                  }}
                />
              </div>
            </div>
      
            {builderMediaUploadState[item.id] && (
              <p
                className={`mt-2 text-xs ${
                  builderMediaUploadState[item.id].startsWith("Error:")
                    ? "font-medium text-red-700"
                    : builderMediaUploadState[item.id] === "Uploaded"
                      ? "font-medium text-cyan-700"
                      : "text-slate-500"
                }`}
              >
                {builderMediaUploadState[item.id]}
              </p>
            )}
      
            {builderMediaPreviews[item.id] && item.media_mime_type.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={builderMediaPreviews[item.id]} alt="" className="mt-3 max-h-64 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 object-contain" />
            )}
            {builderMediaPreviews[item.id] && item.media_mime_type.startsWith("audio/") && (
              <audio controls src={builderMediaPreviews[item.id]} className="mt-3 w-full" />
            )}
            {builderMediaPreviews[item.id] && item.media_mime_type.startsWith("video/") && (
              <video controls src={builderMediaPreviews[item.id]} className="mt-3 max-h-80 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200" />
            )}
            {!builderMediaPreviews[item.id] && item.media_url.startsWith("storage://") && (
              <p className="mt-2 text-xs text-cyan-700">Stored private media attached.</p>
            )}
      
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={item.media_url}
                onChange={(event) => updateBuilderItem(item.id, { media_url: event.target.value, media_mime_type: "" })}
                placeholder="Or paste an https:// media URL"
                className="w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-xs"
              />
              {item.media_url && (
                <button
                  type="button"
                  onClick={() => {
                    updateBuilderItem(item.id, { media_url: "", media_mime_type: "" });
                    setBuilderMediaPreviews((previous) => {
                      const next = { ...previous };
                      if (next[item.id]) URL.revokeObjectURL(next[item.id]);
                      delete next[item.id];
                      return next;
                    });
                  }}
                  className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        )}
      
        {renderLogicBuilder(item, index)}
      
        {item.item_type === "custom" && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Custom item configuration / implementation notes</span><textarea value={item.custom_config_notes} onChange={(event) => updateBuilderItem(item.id, { custom_config_notes: event.target.value })} placeholder="Describe any format not represented above. The database stores this as structured extension metadata for a future renderer/plugin." className="mt-1 min-h-28 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2.5 text-sm" /></label>}
      </div>
    );
  }

  async function saveCustomQuestionnaire() {
    if (savingCustomQuestionnaire) return;
    setBuilderError("");
    setBuilderSuccess("");

    const name = builderName.trim();
    const category = builderCategory.trim();
    const description = builderDescription.trim();
    const participantInstructions = builderParticipantInstructions.trim();

    if (!name) return setBuilderError("Enter a questionnaire name.");
    if (!category) return setBuilderError("Enter a questionnaire category.");
    if (!description) return setBuilderError("Add a short description of what the questionnaire measures or contains.");
    if (!participantInstructions) return setBuilderError("Add clear participant instructions.");
    if (!Number.isFinite(builderEstimatedMinutes) || builderEstimatedMinutes < 1 || builderEstimatedMinutes > 1440) {
      return setBuilderError("Estimated completion time must be between 1 and 1440 minutes.");
    }
    if (builderBlocks.length < 1) return setBuilderError("Add at least one block/page.");
    const blockKeys = builderBlocks.map((block) => block.key.trim());
    if (blockKeys.some((key) => !key)) return setBuilderError("Every block needs a block key.");
    if (new Set(blockKeys).size !== blockKeys.length) return setBuilderError("Block keys must be unique.");
    if (builderItems.length < 1) return setBuilderError("Add at least one questionnaire item or content element.");

    const itemKeys = builderItems.map((item) => item.key.trim()).filter(Boolean);
    if (itemKeys.length !== builderItems.length) return setBuilderError("Every item needs a unique item key.");
    if (new Set(itemKeys).size !== itemKeys.length) return setBuilderError("Item keys must be unique.");

    for (const item of builderItems) {
      if (!item.prompt.trim() && item.item_type !== "divider") {
        return setBuilderError(`Item ${item.key} needs wording/content.`);
      }
      if (optionItemTypes.has(item.item_type)) {
        if (item.options.length < 2 || item.options.some((option) => !option.label.trim())) {
          return setBuilderError(`${item.key} needs at least two labelled response options.`);
        }
      }
      if (["image_content", "audio_content", "video_content"].includes(item.item_type) && !item.media_url.trim()) {
        return setBuilderError(`${item.key} needs an uploaded media file or media URL.`);
      }
      if (item.item_type === "image_choice" && item.options.some((option) => !option.media_url?.trim())) {
        return setBuilderError(`${item.key} is an image-choice item, so every response option needs an image.`);
      }
      if (numericItemTypes.has(item.item_type) && item.numeric_min >= item.numeric_max) {
        return setBuilderError(`${item.key} needs a maximum greater than its minimum.`);
      }
      if (matrixItemTypes.has(item.item_type) && !item.matrix_rows.trim()) {
        return setBuilderError(`${item.key} needs at least one matrix row.`);
      }

      const itemIndex = builderItems.findIndex((candidate) => candidate.id === item.id);
      for (const rule of item.logic_rules) {
        const sourceIndex = builderItems.findIndex(
          (candidate) =>
            candidate.key.trim() === rule.source_key.trim() &&
            !contentItemTypes.has(candidate.item_type)
        );

        if (!rule.source_key.trim() || sourceIndex < 0) {
          return setBuilderError(
            `${item.key} has a branching condition with no valid source question.`
          );
        }

        if (sourceIndex >= itemIndex) {
          return setBuilderError(
            `${item.key} can only branch from an earlier question.`
          );
        }

        const source = builderItems[sourceIndex];
        const allowedOperators = logicOperatorsForSource(source);
        if (!allowedOperators.includes(rule.operator)) {
          return setBuilderError(
            `${item.key} uses a branching comparison that is not valid for ${source.key}.`
          );
        }

        if (logicRuleNeedsValue(rule.operator) && !rule.value.trim()) {
          return setBuilderError(
            `${item.key} needs a response/value for its condition based on ${source.key}.`
          );
        }
      }
    }

    if (builderScoringMethod === "custom_formula" && !builderScoringFormula.trim()) {
      return setBuilderError("Enter the custom scoring formula or algorithm notes.");
    }
    if (builderPublicationMode !== "private" && !builderPublisherName.trim()) {
      return setBuilderError("Add the publisher / author name before publishing this questionnaire to PsyLattice.");
    }
    if (builderPublisherUrl.trim() && !/^https?:\/\//i.test(builderPublisherUrl.trim())) {
      return setBuilderError("Publisher profile / website must start with http:// or https://.");
    }
    if (!builderRightsConfirmed) {
      return setBuilderError("Confirm that you created this content or have the rights required to use it.");
    }

    setSavingCustomQuestionnaire(true);
    const supabase = createClient();
    let createdQuestionnaireId = "";

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be signed in to create a questionnaire.");

      const slugBase =
        name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) ||
        "custom-questionnaire";
      const slug = `${slugBase}-${Date.now().toString(36)}`;
      const constructs = Array.from(
        new Set(builderConstructs.split(",").map((construct) => construct.trim()).filter(Boolean))
      );
      const languages = Array.from(
        new Set(builderLanguages.split(",").map((language) => language.trim()).filter(Boolean))
      );
      const scorableItems = builderItems.filter((item) => !contentItemTypes.has(item.item_type));
      const publicationScope = builderPublicationMode === "private" ? "private" : "published";
      const accessMode =
        builderPublicationMode === "private"
          ? "owner_only"
          : builderPublicationMode === "free"
            ? "free"
            : "request";

      const { data: createdQuestionnaire, error: questionnaireError } = await supabase
        .from("questionnaires")
        .insert({
          slug,
          name,
          acronym: builderAcronym.trim() || null,
          category,
          description,
          constructs,
          population: builderPopulation.trim() || null,
          item_count: scorableItems.length,
          estimated_minutes: builderEstimatedMinutes,
          languages: languages.length > 0 ? languages : ["English"],
          administration_mode: "Researcher configured / participant-facing",
          recall_period: builderRecallPeriod.trim() || null,
          self_available: false,
          researcher_available: true,
          status: "active",
          license_status: "researcher_owned",
          license_summary:
            "Created in this researcher's PsyLattice workspace. The researcher confirmed that they created the content or hold the rights required to use it. PsyLattice does not independently verify authorship or third-party permissions.",
          commercial_use_note: "Rights depend on the content entered by the researcher and any underlying third-party material.",
          modification_note: "The researcher controls this custom instrument. Modifications should create a new version after deployment.",
          redistribution_note:
            accessMode === "free"
              ? "The owner has published this questionnaire for free research use in PsyLattice. Any external redistribution still depends on the owner's stated terms."
              : accessMode === "request"
                ? "The owner has published the questionnaire metadata in PsyLattice but requires approval before other researchers can use the questionnaire content."
                : "Private researcher-owned questionnaire. Not shared with other PsyLattice researchers.",
          owner_user_id: user.id,
          source_type: "researcher_created",
          publication_scope: publicationScope,
          access_mode: accessMode,
          publisher_display_name:
            builderPublisherName.trim() || currentUserDisplayName,
          publisher_affiliation: builderPublisherAffiliation.trim() || null,
          publisher_url: builderPublisherUrl.trim() || null,
          published_at:
            publicationScope === "published" ? new Date().toISOString() : null,
        })
        .select("id, slug, name, acronym, category, description, constructs, population, item_count, estimated_minutes, languages, administration_mode, recall_period, self_available, researcher_available, license_status, license_summary, license_source_url, commercial_use_note, modification_note, redistribution_note, owner_user_id, source_type, publication_scope, access_mode, publisher_display_name, publisher_affiliation, publisher_url, published_at")
        .single();

      if (questionnaireError || !createdQuestionnaire) throw questionnaireError || new Error("The questionnaire could not be created.");
      createdQuestionnaireId = createdQuestionnaire.id;

      const defaultScoringSummary =
        builderScoringMethod === "none"
          ? "No automatic score is configured. Responses are stored as research data for analysis according to the study protocol."
          : "This researcher-created instrument uses the structured scoring configuration stored with this version. PsyLattice does not infer validation, norms, reliability, validity or clinical meaning from that configuration.";

      const { data: createdVersion, error: versionError } = await supabase
        .from("questionnaire_versions")
        .insert({
          questionnaire_id: createdQuestionnaire.id,
          version_label: "Version 1",
          participant_instructions: participantInstructions,
          researcher_instructions:
            builderResearcherInstructions.trim() ||
            "Researcher-created instrument. Confirm administration, scoring, missing-data and interpretation procedures in the approved study protocol before deployment.",
          response_scale_description: "Mixed / item-specific response formats. See item configuration.",
          scoring_summary: builderScoringSummary.trim() || defaultScoringSummary,
          score_multiplier: 1,
          scoring_method: builderScoringMethod,
          scoring_config: {
            formula: builderScoringFormula.trim() || null,
            supported_subscales: Array.from(new Set(builderItems.map((item) => item.subscale.trim()).filter(Boolean))),
          },
          missing_data_config: { method: builderMissingRule },
          randomization_config: { randomize_all_items: builderRandomizeItems },
          display_config: { supports_piping: true, piping_syntax: "{{item_key}}" },
          is_current: true,
        })
        .select("id")
        .single();

      if (versionError || !createdVersion) throw versionError || new Error("The questionnaire version could not be created.");

      const { data: createdBlocks, error: blockError } = await supabase
        .from("questionnaire_blocks")
        .insert(
          builderBlocks.map((block, index) => ({
            version_id: createdVersion.id,
            block_key: block.key.trim() || `block_${index + 1}`,
            position: index + 1,
            title: block.title.trim() || null,
            instructions: block.instructions.trim() || null,
            randomize_items: block.randomize_items,
            page_break_after: block.page_break_after,
            display_logic: {},
          }))
        )
        .select("id, block_key");
      if (blockError) throw blockError;

      const blockIdByClientId = new Map<string, string>();
      builderBlocks.forEach((block) => {
        const dbBlock = (createdBlocks || []).find((candidate) => candidate.block_key === block.key.trim());
        if (dbBlock) blockIdByClientId.set(block.id, dbBlock.id);
      });

      const { error: itemError } = await supabase
        .from("questionnaire_items")
        .insert(
          builderItems.map((item, index) => ({
            version_id: createdVersion.id,
            block_id: blockIdByClientId.get(item.block_id) || null,
            item_key: item.key.trim(),
            position: index + 1,
            prompt: item.item_type === "divider" ? item.prompt.trim() || "Divider" : item.prompt.trim(),
            help_text: item.help_text.trim() || null,
            subscale: item.subscale.trim() || null,
            reverse_scored: item.reverse_scored,
            response_type: item.item_type,
            response_options: item.options.map((option) => ({
              label: option.label.trim(),
              value: option.value,
              weight: option.weight,
              media_url: option.media_url?.trim() || null,
              media_mime_type: option.media_mime_type?.trim() || null,
            })),
            required: contentItemTypes.has(item.item_type) ? false : item.required,
            response_config: {
              min: item.numeric_min,
              max: item.numeric_max,
              step: item.numeric_step,
              left_anchor: item.left_anchor.trim() || null,
              right_anchor: item.right_anchor.trim() || null,
              min_selections: item.min_selections || null,
              max_selections: item.max_selections || null,
              max_words: item.max_words || null,
              max_characters: item.max_characters || null,
              constant_sum_target: item.constant_sum_target || null,
              matrix_rows: item.matrix_rows.split("\n").map((row) => row.trim()).filter(Boolean),
              custom_config_notes: item.custom_config_notes.trim() || null,
            },
            validation_config: {
              required: item.required,
              min_selections: item.min_selections || null,
              max_selections: item.max_selections || null,
              max_words: item.max_words || null,
              max_characters: item.max_characters || null,
              min: numericItemTypes.has(item.item_type) ? item.numeric_min : null,
              max: numericItemTypes.has(item.item_type) ? item.numeric_max : null,
            },
            scoring_config: {
              reverse_scored: item.reverse_scored,
              thurstone_weight: item.item_type === "thurstone" ? item.thurstone_weight : null,
              subscale: item.subscale.trim() || null,
            },
            display_logic: {
              mode: item.logic_mode,
              rules: item.logic_rules.map((rule) => ({
                source_key: rule.source_key.trim(),
                operator: rule.operator,
                value: rule.value,
              })),
            },
            randomization_config: { randomize_options: item.randomize_options },
            media_config: {
              url: item.media_url.trim() || null,
              mime_type: item.media_mime_type.trim() || null,
            },
            is_content_only: contentItemTypes.has(item.item_type),
          }))
        );
      if (itemError) throw itemError;

      const typedQuestionnaire = createdQuestionnaire as Questionnaire;
      setQuestionnaires((previous) => [...previous, typedQuestionnaire].sort((a, b) => a.name.localeCompare(b.name)));
      setBuilderSuccess(
        publicationScope === "published"
          ? accessMode === "free"
            ? "Questionnaire published to PsyLattice and available for other researchers to use."
            : "Questionnaire published to PsyLattice. Other researchers can discover it and request access."
          : "Questionnaire saved privately to your research library."
      );
      setBuilderOpen(false);
      resetCustomBuilder();
      await openQuestionnaire(typedQuestionnaire);
    } catch (error) {
      console.error("Creating custom questionnaire failed:", error);
      if (createdQuestionnaireId) {
        await createClient().from("questionnaires").delete().eq("id", createdQuestionnaireId);
      }
      setBuilderError(error instanceof Error ? error.message : "The questionnaire could not be created.");
    } finally {
      setSavingCustomQuestionnaire(false);
    }
  }

  function resourceTypeLabel(type: string) {
    const labels: Record<string, string> = {
      questionnaire: "Questionnaire",
      manual: "Manual / documentation",
      scoring_guide: "Scoring guide",
      official_page: "Official page",
      license: "Permission / licence",
      translations: "Translations",
      validation_paper: "Validation paper",
      citation_guide: "Citation guide",
    };

    return labels[type] || type.replaceAll("_", " ");
  }

  const categories = [
    "All",
    ...Array.from(new Set(questionnaires.map((item) => item.category))).sort(),
  ];

  const filteredQuestionnaires = questionnaires.filter((item) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      (item.acronym || "").toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.constructs.some((construct) =>
        construct.toLowerCase().includes(query)
      );

    const matchesCategory =
      categoryFilter === "All" || item.category === categoryFilter;

    const matchesLicence =
      licenceFilter === "All" || item.license_status === licenceFilter;

    return matchesSearch && matchesCategory && matchesLicence;
  });

  const publicDomainCount = questionnaires.filter(
    (item) => item.license_status === "public_domain"
  ).length;
  const researchOnlyCount = questionnaires.filter(
    (item) => !item.self_available
  ).length;
  const customQuestionnaireCount = questionnaires.filter(
    (item) =>
      item.source_type === "researcher_created" &&
      item.owner_user_id === currentUserId
  ).length;

  if (builderOpen) {
    const subscales = Array.from(new Set(builderItems.map((item) => item.subscale.trim()).filter(Boolean)));
    const responseTypesUsed = Array.from(new Set(builderItems.map((item) => item.item_type)));

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setBuilderOpen(false);
            resetCustomBuilder();
          }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to questionnaire library
        </button>

        <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-6 sm:p-7">
          <div className="max-w-5xl">
            <div className="flex flex-wrap gap-2">
              <Status type="accent">Universal research builder</Status>
              <Status>Research workspace only</Status>
              <Status>{itemTypeDefinitions.length} configured item types</Status>
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.025em] text-slate-950">
              Create research instrument
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Mix ratings, choices, Thurstone items, matrices, rankings, text, numbers, media, uploads and information blocks in the same instrument. Every item stores its own response, validation, scoring, display-logic and randomisation configuration.
            </p>
          </div>
        </div>

        {builderError && <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1"><p className="text-sm text-slate-600">{builderError}</p></div>}
        {builderSuccess && <div className="border-l-2 border-cyan-400 bg-transparent py-1 pl-3 pr-1"><p className="text-sm text-slate-600">{builderSuccess}</p></div>}

        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-5">
            <Panel title="Instrument overview" description="Metadata shown to researchers in the library.">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <label><span className="text-sm font-medium">Name</span><input value={builderName} onChange={(event) => setBuilderName(event.target.value)} placeholder="e.g. Academic Coping Questionnaire" className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">Acronym</span><input value={builderAcronym} onChange={(event) => setBuilderAcronym(event.target.value)} placeholder="ACQ" maxLength={20} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label><span className="text-sm font-medium">Category</span><input value={builderCategory} onChange={(event) => setBuilderCategory(event.target.value)} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">Estimated time (minutes)</span><input type="number" min={1} max={1440} value={builderEstimatedMinutes} onChange={(event) => setBuilderEstimatedMinutes(Number(event.target.value))} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
                <label className="block"><span className="text-sm font-medium">Description</span><textarea value={builderDescription} onChange={(event) => setBuilderDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label><span className="text-sm font-medium">Constructs — comma separated</span><input value={builderConstructs} onChange={(event) => setBuilderConstructs(event.target.value)} placeholder="Stress, coping" className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">Languages — comma separated</span><input value={builderLanguages} onChange={(event) => setBuilderLanguages(event.target.value)} placeholder="English, Italian" className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label><span className="text-sm font-medium">Target population</span><input value={builderPopulation} onChange={(event) => setBuilderPopulation(event.target.value)} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">Recall period</span><input value={builderRecallPeriod} onChange={(event) => setBuilderRecallPeriod(event.target.value)} placeholder="Past 7 days / Right now / General" className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
              </div>
            </Panel>

            <Panel title="Administration" description="Participant and researcher-facing instructions.">
              <div className="space-y-5">
                <label className="block"><span className="text-sm font-medium">Participant instructions</span><textarea value={builderParticipantInstructions} onChange={(event) => setBuilderParticipantInstructions(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
                <label className="block"><span className="text-sm font-medium">Researcher instructions</span><textarea value={builderResearcherInstructions} onChange={(event) => setBuilderResearcherInstructions(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
              </div>
            </Panel>

            <Panel
              title="Questionnaire structure"
              description="Build the questionnaire the way participants experience it: blocks contain their own questions and content."
            >
              <div className="space-y-5">
                {builderBlocks.map((block, blockIndex) => {
                  const blockItems = builderItems.filter(
                    (item) => item.block_id === block.id
                  );

                  return (
                    <section
                      key={block.id}
                      className={`overflow-hidden rounded-3xl border border-l-4 shadow-sm ${questionnairePageTheme(blockIndex).card}`}
                    >
                      <div className="border-b border-slate-300/65 bg-white/75 p-5">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${questionnairePageTheme(blockIndex).badge}`}
                              >
                                Block {blockIndex + 1}
                              </span>
                              <span className="text-xs font-medium text-slate-400">
                                {blockItems.length} item{blockItems.length === 1 ? "" : "s"}
                              </span>
                            </div>

                            <input
                              value={block.title}
                              onChange={(event) =>
                                updateBuilderBlock(block.id, {
                                  title: event.target.value,
                                })
                              }
                              placeholder={`Section ${blockIndex + 1} title`}
                              className="mt-3 w-full border-0 bg-transparent p-0 text-lg font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                            />

                            <textarea
                              value={block.instructions}
                              onChange={(event) =>
                                updateBuilderBlock(block.id, {
                                  instructions: event.target.value,
                                })
                              }
                              placeholder="Optional instructions shown before the questions in this block"
                              rows={2}
                              className="mt-2 w-full resize-y rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)] text-slate-600"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeBuilderBlock(block.id)}
                            disabled={builderBlocks.length <= 1}
                            className="shrink-0 text-xs font-semibold text-red-600 disabled:opacity-30"
                          >
                            Remove block
                          </button>
                        </div>

                        <details className="mt-4 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50/70 px-4 py-3">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-600">
                            Block settings
                          </summary>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <label>
                              <span className="text-xs text-slate-500">Block key</span>
                              <input
                                value={block.key}
                                onChange={(event) =>
                                  updateBuilderBlock(block.id, {
                                    key: event.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                              />
                            </label>
                            <div className="space-y-2 pt-1 text-sm">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={block.randomize_items}
                                  onChange={(event) =>
                                    updateBuilderBlock(block.id, {
                                      randomize_items: event.target.checked,
                                    })
                                  }
                                />
                                Randomize items in this block
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={block.page_break_after}
                                  onChange={(event) =>
                                    updateBuilderBlock(block.id, {
                                      page_break_after: event.target.checked,
                                    })
                                  }
                                />
                                Page break after this block
                              </label>
                            </div>
                          </div>
                        </details>
                      </div>

                      <div className="space-y-4 bg-slate-50/45 p-5">
                        {blockItems.length > 0 ? (
                          blockItems.map((item) =>
                            renderBuilderItemEditor(
                              item,
                              builderItems.findIndex(
                                (candidate) => candidate.id === item.id
                              )
                            )
                          )
                        ) : (
                          <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-dashed border-slate-300 bg-white px-5 py-7 text-center">
                            <p className="text-sm font-medium text-slate-700">
                              This block is empty
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              Add the first question or content element below.
                            </p>
                          </div>
                        )}

                        <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-dashed border-cyan-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                Add to {block.title || `Block ${blockIndex + 1}`}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Choose a question or content type. It will be created inside this block.
                              </p>
                            </div>
                            <select
                              value=""
                              disabled={builderItems.length >= 500}
                              onChange={(event) => {
                                const type = event.target.value;
                                if (type) addBuilderItem(block.id, type);
                              }}
                              className="min-w-[230px] rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-cyan-700 disabled:opacity-40"
                            >
                              <option value="">+ Add question / content…</option>
                              {Array.from(
                                new Set(
                                  itemTypeDefinitions.map(
                                    (definition) => definition.group
                                  )
                                )
                              ).map((group) => (
                                <optgroup key={group} label={group}>
                                  {itemTypeDefinitions
                                    .filter(
                                      (definition) => definition.group === group
                                    )
                                    .map((definition) => (
                                      <option
                                        key={definition.value}
                                        value={definition.value}
                                      >
                                        {definition.label}
                                      </option>
                                    ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addBuilderBlock}
                className="mt-5 w-full rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-dashed border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/30"
              >
                + Add another block / page
              </button>
            </Panel>

            <Panel title="Scoring, missing data & randomisation" description="Store the scoring plan without implying that a new measure has been validated.">
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="text-sm font-medium">Scoring method</span><select value={builderScoringMethod} onChange={(event) => setBuilderScoringMethod(event.target.value)} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"><option value="none">No automatic score</option><option value="sum">Sum</option><option value="mean">Mean / average</option><option value="median">Median</option><option value="count_endorsed">Count endorsed</option><option value="percentage">Percentage</option><option value="weighted_sum">Weighted sum</option><option value="weighted_mean">Weighted mean</option><option value="thurstone_median">Thurstone median of endorsed values</option><option value="subscale_sum">Subscale sums</option><option value="subscale_mean">Subscale means</option><option value="total_and_subscales">Total + subscales</option><option value="custom_formula">Custom formula / algorithm</option><option value="irt_rasch">IRT / Rasch parameters supplied by researcher</option></select></label>
                <label><span className="text-sm font-medium">Missing-data rule</span><select value={builderMissingRule} onChange={(event) => setBuilderMissingRule(event.target.value)} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"><option value="complete_case">Do not score if required items are missing</option><option value="available_items">Use available items</option><option value="allow_10_percent">Allow up to 10% missing</option><option value="allow_20_percent">Allow up to 20% missing</option><option value="prorate_80_percent">Prorate if at least 80% completed</option><option value="subscale_mean_imputation">Subscale-mean imputation</option><option value="custom">Custom rule documented below</option></select></label>
              </div>
              {(builderScoringMethod === "custom_formula" || builderScoringMethod === "irt_rasch" || builderMissingRule === "custom") && <textarea value={builderScoringFormula} onChange={(event) => setBuilderScoringFormula(event.target.value)} placeholder="Formula, calibrated parameters, or algorithm/missing-data specification. Example: stress=(q1+q2+reverse(q3))/3" className="mt-4 min-h-28 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" />}
              <label className="mt-4 flex items-center gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4 text-sm"><input type="checkbox" checked={builderRandomizeItems} onChange={(event) => setBuilderRandomizeItems(event.target.checked)} />Allow questionnaire-level item randomisation (block settings can override/structure this).</label>
              <label className="mt-4 block"><span className="text-sm font-medium">Scoring / analysis notes</span><textarea value={builderScoringSummary} onChange={(event) => setBuilderScoringSummary(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm" /></label>
              <p className="mt-3 text-xs leading-5 text-slate-400">PsyLattice stores researcher-defined scoring. It does not infer psychometric validity, norms, diagnostic meaning or calibrated IRT/Rasch parameters.</p>
            </Panel>
          </div>

          <div className="space-y-5">
            <Panel title="Builder summary">
              <div className="grid grid-cols-2 gap-3"><StatCard label="Items/content" value={String(builderItems.length)} detail={`${builderBlocks.length} block(s)`} /><StatCard label="Response types" value={String(responseTypesUsed.length)} detail="Mixed formats supported" /></div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Subscales</p><p className="mt-2 text-sm font-medium text-slate-700">{subscales.length > 0 ? subscales.join(", ") : "No subscales assigned"}</p></div>
              <div className="mt-4 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/60 p-5"><p className="font-medium text-cyan-950">Extensible by design</p><p className="mt-2 text-sm leading-6 text-cyan-900/75">The custom item type and JSONB configuration mean new research formats can be added later without redesigning the core database.</p></div>
            </Panel>

            <Panel title="Included capabilities">
              <div className="space-y-3 text-sm text-slate-600">{["Item-specific response formats", "Blocks/pages and page breaks", "Branching / display logic", "Piping via {{item_key}}", "Option and block randomisation", "Subscales and reverse scoring", "Weighted / Thurstone scoring metadata", "Missing-data rules", "Matrices, ranking, Q-sort and allocation", "Text, numeric, date/time and uploads", "Media/stimulus metadata", "Custom/future item configuration"].map((capability) => <div key={capability} className="flex gap-2"><span className="mt-0.5 text-cyan-700"><CheckIcon /></span><span>{capability}</span></div>)}</div>
            </Panel>

            <Panel
              title="Publication & ownership"
              description="Keep the questionnaire private, publish it freely, or let other researchers request permission to use it."
            >
              <div className="space-y-3">
                {[
                  {
                    value: "private" as const,
                    title: "Private · my library only",
                    text: "Only you can see and use the questionnaire. You can publish it later.",
                  },
                  {
                    value: "free" as const,
                    title: "Publish · free to use",
                    text: "All PsyLattice researchers can discover and use the questionnaire in their studies.",
                  },
                  {
                    value: "restricted" as const,
                    title: "Publish · permission required",
                    text: "Researchers can discover the questionnaire and publisher, but must request access before using its content.",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] p-4 transition ${
                      builderPublicationMode === option.value
                        ? "border-cyan-300 bg-cyan-50/60"
                        : "border-slate-300/70 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="questionnaire-publication"
                      value={option.value}
                      checked={builderPublicationMode === option.value}
                      onChange={() => setBuilderPublicationMode(option.value)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">
                        {option.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        {option.text}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {builderPublicationMode !== "private" && (
                <div className="mt-5 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Publisher details shown in the PsyLattice library
                  </p>
                  <div className="mt-3 space-y-3">
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600">
                        Publisher / author name
                      </span>
                      <input
                        value={builderPublisherName}
                        onChange={(event) => setBuilderPublisherName(event.target.value)}
                        placeholder="Your name, lab, group or organisation"
                        className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600">
                        Affiliation · optional
                      </span>
                      <input
                        value={builderPublisherAffiliation}
                        onChange={(event) =>
                          setBuilderPublisherAffiliation(event.target.value)
                        }
                        placeholder="University, lab, organisation"
                        className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-600">
                        Publisher profile / website · optional
                      </span>
                      <input
                        value={builderPublisherUrl}
                        onChange={(event) => setBuilderPublisherUrl(event.target.value)}
                        placeholder="https://…"
                        className="mt-1 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Ownership remains attached to your PsyLattice account. Publishing changes visibility and access, not ownership.
                  </p>
                </div>
              )}
            </Panel>

            <Panel title="Rights confirmation">
              <label className="flex items-start gap-3 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-[#cfc6f6] bg-[#f7f5ff] p-5"><input type="checkbox" checked={builderRightsConfirmed} onChange={(event) => setBuilderRightsConfirmed(event.target.checked)} className="mt-1" /><span className="text-sm leading-6 text-violet-900">I confirm that I created this instrument content, or I have the permission/licence required to reproduce and digitally administer it.</span></label>
              <p className="mt-4 text-xs leading-5 text-slate-400">PsyLattice records this confirmation but does not independently verify third-party rights.</p>
            </Panel>

            <Panel title="Save instrument">
              <button type="button" onClick={() => void saveCustomQuestionnaire()} disabled={savingCustomQuestionnaire} className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingCustomQuestionnaire ? "Saving instrument..." : builderPublicationMode === "private" ? "Save privately" : builderPublicationMode === "free" ? "Publish free to PsyLattice" : "Publish with permission required"}</button>
              <button type="button" onClick={() => { setBuilderOpen(false); resetCustomBuilder(); }} disabled={savingCustomQuestionnaire} className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancel</button>
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  if (selectedQuestionnaire) {
    const manualResources = resources.filter(
      (resource) => resource.resource_type === "manual"
    );
    const questionnaireResources = resources.filter(
      (resource) => resource.resource_type === "questionnaire"
    );

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setSelectedQuestionnaire(null);
            setSelectedVersion(null);
            setItems([]);
            setResources([]);
            setReferences([]);
            setLibraryError("");
          }}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ← Back to questionnaire library
        </button>

        {libraryError && (
          <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
            <p className="text-sm text-red-700">{libraryError}</p>
          </div>
        )}

        <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-2">
                <Status
                  type={licenceStatusType(selectedQuestionnaire.license_status)}
                >
                  {licenceLabel(selectedQuestionnaire.license_status)}
                </Status>

                <Status type="accent">Research use</Status>

                {selectedQuestionnaire.source_type === "researcher_created" && (
                  <Status type="accent">
                    {selectedQuestionnaire.owner_user_id === currentUserId
                      ? "You own this questionnaire"
                      : questionnairePublicationLabel(selectedQuestionnaire)}
                  </Status>
                )}

                <Status
                  type={selectedQuestionnaire.self_available ? "success" : "neutral"}
                >
                  {selectedQuestionnaire.self_available
                    ? "Self + research"
                    : "Research only"}
                </Status>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                {selectedQuestionnaire.category}
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-slate-950">
                {selectedQuestionnaire.name}
                {selectedQuestionnaire.acronym
                  ? ` (${selectedQuestionnaire.acronym})`
                  : ""}
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {selectedQuestionnaire.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {questionnaireResources[0] && (
                <a
                  href={questionnaireResources[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"
                >
                  Open questionnaire source ↗
                </a>
              )}

              <button
                type="button"
                onClick={() => changeScreen("builder")}
                className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Open Study Builder
              </button>
            </div>
          </div>
        </div>

        {selectedQuestionnaire.source_type === "researcher_created" && (
          <Panel
            title={
              selectedQuestionnaire.owner_user_id === currentUserId
                ? "Publication & ownership"
                : "Publisher & access"
            }
            description={
              selectedQuestionnaire.owner_user_id === currentUserId
                ? "You remain the owner. Change how other PsyLattice researchers can discover and use this questionnaire."
                : "Researcher-published questionnaire metadata and access terms."
            }
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Publisher
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedQuestionnaire.publisher_display_name || "Researcher publisher"}
                </p>
                {selectedQuestionnaire.publisher_affiliation && (
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedQuestionnaire.publisher_affiliation}
                  </p>
                )}
                {selectedQuestionnaire.publisher_url && (
                  <a
                    href={selectedQuestionnaire.publisher_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-cyan-800"
                  >
                    Publisher profile ↗
                  </a>
                )}
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Ownership is attached to the publisher's PsyLattice account.
                </p>
              </div>

              <Status
                type={
                  selectedQuestionnaire.access_mode === "free"
                    ? "success"
                    : selectedQuestionnaire.publication_scope === "published"
                      ? "warning"
                      : "neutral"
                }
              >
                {questionnairePublicationLabel(selectedQuestionnaire)}
              </Status>
            </div>

            {selectedQuestionnaire.owner_user_id === currentUserId ? (
              <>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {[
                    ["private", "Private"],
                    ["free", "Publish free"],
                    ["restricted", "Require permission"],
                  ].map(([mode, label]) => {
                    const active =
                      mode === "private"
                        ? selectedQuestionnaire.publication_scope !== "published"
                        : mode === "free"
                          ? selectedQuestionnaire.publication_scope === "published" &&
                            selectedQuestionnaire.access_mode === "free"
                          : selectedQuestionnaire.publication_scope === "published" &&
                            selectedQuestionnaire.access_mode === "request";

                    return (
                      <button
                        key={mode}
                        type="button"
                        disabled={accessBusy || active}
                        onClick={() =>
                          void updateQuestionnairePublication(
                            selectedQuestionnaire,
                            mode as "private" | "free" | "restricted"
                          )
                        }
                        className={`rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] px-3 py-2.5 text-xs font-semibold transition disabled:cursor-default ${
                          active
                            ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                            : "border-slate-300/70 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {selectedQuestionnaire.access_mode === "request" &&
                  selectedQuestionnaire.publication_scope === "published" && (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Access requests
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Approve researchers before they can open the questionnaire content.
                          </p>
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                          {accessRequests.length}
                        </span>
                      </div>

                      <div className="mt-3 space-y-3">
                        {accessRequests.length === 0 ? (
                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            No access requests yet.
                          </div>
                        ) : (
                          accessRequests.map((request) => (
                            <div
                              key={request.id}
                              className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-4"
                            >
                              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {request.requester_display_name || "Researcher"}
                                  </p>
                                  {request.requester_affiliation && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      {request.requester_affiliation}
                                    </p>
                                  )}
                                  {request.message && (
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                      {request.message}
                                    </p>
                                  )}
                                </div>
                                <Status
                                  type={
                                    request.status === "approved"
                                      ? "success"
                                      : request.status === "pending"
                                        ? "warning"
                                        : "neutral"
                                  }
                                >
                                  {request.status}
                                </Status>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {request.status !== "approved" && (
                                  <button
                                    type="button"
                                    disabled={accessBusy}
                                    onClick={() =>
                                      void reviewQuestionnaireAccess(
                                        request.id,
                                        "approved"
                                      )
                                    }
                                    className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                )}
                                {request.status === "approved" ? (
                                  <button
                                    type="button"
                                    disabled={accessBusy}
                                    onClick={() =>
                                      void reviewQuestionnaireAccess(
                                        request.id,
                                        "revoked"
                                      )
                                    }
                                    className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                                  >
                                    Revoke
                                  </button>
                                ) : request.status === "pending" ? (
                                  <button
                                    type="button"
                                    disabled={accessBusy}
                                    onClick={() =>
                                      void reviewQuestionnaireAccess(
                                        request.id,
                                        "denied"
                                      )
                                    }
                                    className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                                  >
                                    Decline
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
              </>
            ) : !questionnaireCanUse(selectedQuestionnaire) ? (
              <div className="mt-5 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-semibold text-cyan-950">
                  Permission is required to use this questionnaire
                </p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                  You can review the public metadata and publisher details. The questionnaire items, scoring and administration content stay hidden until the owner approves your request.
                </p>
                {selectedQuestionnaire.my_access_status === "pending" ? (
                  <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-600">
                    Your access request is pending.
                  </div>
                ) : (
                  <>
                    <textarea
                      value={accessRequestMessage}
                      onChange={(event) =>
                        setAccessRequestMessage(event.target.value)
                      }
                      rows={3}
                      placeholder="Optional note to the publisher about how you plan to use the questionnaire"
                      className="mt-4 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-200 bg-white px-3 py-2.5 text-sm"
                    />
                    <button
                      type="button"
                      disabled={accessBusy}
                      onClick={() =>
                        void requestQuestionnaireAccess(selectedQuestionnaire)
                      }
                      className="mt-3 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)] disabled:opacity-50"
                    >
                      {accessBusy ? "Sending request…" : "Request access"}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="mt-5 border-l-2 border-cyan-400 bg-transparent py-1 pl-3 pr-1 text-sm font-medium text-slate-600">
                {selectedQuestionnaire.access_mode === "free"
                  ? "The publisher allows free research use in PsyLattice."
                  : "The publisher has granted your account access."}
              </div>
            )}
          </Panel>
        )}

        {!questionnaireCanUse(selectedQuestionnaire) ? (
          <Panel title="Questionnaire content locked">
            <p className="text-sm leading-6 text-slate-500">
              The publisher has made this questionnaire discoverable, but its items, scoring and administration content require approval.
            </p>
          </Panel>
        ) : detailLoading ? (
          <Panel title="Questionnaire details">
            <p className="text-sm text-slate-500">
              Loading administration, scoring and research resources...
            </p>
          </Panel>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Items"
                value={String(selectedQuestionnaire.item_count)}
                detail={
                  selectedQuestionnaire.estimated_minutes
                    ? `~${selectedQuestionnaire.estimated_minutes} min`
                    : "Completion time not specified"
                }
              />

              <StatCard
                label="Administration"
                value={selectedQuestionnaire.administration_mode || "Not specified"}
                detail={selectedQuestionnaire.recall_period || "No recall period"}
              />

              <StatCard
                label="Languages"
                value={String(selectedQuestionnaire.languages.length)}
                detail={selectedQuestionnaire.languages.slice(0, 3).join(", ")}
              />

              <StatCard
                label="Current version"
                value={selectedVersion?.version_label || "—"}
                detail="Version stored in PsyLattice"
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
              <Panel
                title="Administration"
                description="Clear instructions for researchers and participants."
              >
                <div className="space-y-5">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Participant instructions
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {selectedVersion?.participant_instructions ||
                        "Participant instructions have not been entered for this version."}
                    </p>
                  </div>

                  <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Researcher instructions
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {selectedVersion?.researcher_instructions ||
                        "No additional researcher instructions have been stored."}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                      <p className="text-xs text-slate-400">Response format</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {selectedVersion?.response_scale_description ||
                          "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                      <p className="text-xs text-slate-400">Population</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {selectedQuestionnaire.population || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Scoring"
                description="Stored scoring guidance for the current questionnaire version."
              >
                <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/60 p-5">
                  <p className="text-sm leading-7 text-cyan-950">
                    {selectedVersion?.scoring_summary ||
                      "A scoring summary has not yet been stored for this questionnaire."}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                  <p className="font-medium">Interpretation boundary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    PsyLattice stores scoring guidance as research metadata. Researchers
                    remain responsible for using the appropriate validation literature,
                    population norms, missing-data rules and study protocol when
                    interpreting scores.
                  </p>
                </div>
              </Panel>
            </div>

            <Panel
              title="Questionnaire items"
              description="Item wording and response coding stored for the current version."
            >
              {selectedQuestionnaire.license_status === "restricted" ? (
                <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-[#cfc6f6] bg-[#f7f5ff] p-5">
                  <p className="font-medium text-violet-900">
                    Item text is hidden for this restricted measure.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-violet-800">
                    PsyLattice should only expose or digitally administer restricted item
                    content after the required rights and licence terms are documented.
                  </p>
                </div>
              ) : items.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[55px_1fr_260px]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
                        {item.position}
                      </div>

                      <div>
                        <p className="text-sm font-medium leading-6 text-slate-900">
                          {item.prompt}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.subscale && <Status>{item.subscale}</Status>}
                          {item.reverse_scored && (
                            <Status type="warning">Reverse scored</Status>
                          )}
                          {!item.required && <Status>Optional</Status>}
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          {item.response_options.length > 0 ? "Response coding" : "Response type"}
                        </p>
                        {item.response_options.length > 0 ? (
                          <div className="mt-2 space-y-1.5">
                            {item.response_options.map((option) => (
                              <div
                                key={`${item.id}-${option.value}-${option.label}`}
                                className="flex items-start justify-between gap-3 text-xs"
                              >
                                <span className="text-slate-600">{option.label}</span>
                                <code className="font-semibold text-slate-500">{option.value}</code>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs font-medium text-slate-600">
                            {item.response_type.replaceAll("_", " ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No item-level content is stored for this questionnaire version yet.
                </p>
              )}
            </Panel>

            <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
              <Panel
                title="Usage & licensing"
                description="Check the documented usage status before deploying a measure."
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                    <span className="text-sm font-medium">Research use</span>
                    <Status type="success">
                      {selectedQuestionnaire.owner_user_id === currentUserId
                        ? "Your workspace"
                        : "Available"}
                    </Status>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                    <span className="text-sm font-medium">Self workspace</span>
                    <Status
                      type={selectedQuestionnaire.self_available ? "success" : "neutral"}
                    >
                      {selectedQuestionnaire.self_available
                        ? "Available"
                        : "Not exposed"}
                    </Status>
                  </div>

                  <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Licence status
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {licenceLabel(selectedQuestionnaire.license_status)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {selectedQuestionnaire.license_summary ||
                        "No licensing summary has been stored."}
                    </p>
                  </div>

                  <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-400">Commercial use</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedQuestionnaire.commercial_use_note || "Not documented"}
                    </p>
                  </div>

                  <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-400">Modification</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedQuestionnaire.modification_note || "Not documented"}
                    </p>
                  </div>

                  <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-400">Redistribution</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedQuestionnaire.redistribution_note || "Not documented"}
                    </p>
                  </div>

                  {selectedQuestionnaire.license_source_url && (
                    <a
                      href={selectedQuestionnaire.license_source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"
                    >
                      Open licence source ↗
                    </a>
                  )}
                </div>
              </Panel>

              <Panel
                title="Research resources"
                description="Manuals, official questionnaires, scoring guides, translations and permission sources."
              >
                {resources.length > 0 ? (
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-4"
                      >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <Status type="accent">
                                {resourceTypeLabel(resource.resource_type)}
                              </Status>
                              {resource.is_official && (
                                <Status type="success">Official</Status>
                              )}
                            </div>

                            <p className="mt-3 text-sm font-semibold">
                              {resource.title}
                            </p>

                            {resource.source_name && (
                              <p className="mt-1 text-xs text-slate-400">
                                {resource.source_name}
                              </p>
                            )}

                            {resource.access_note && (
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {resource.access_note}
                              </p>
                            )}
                          </div>

                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {resource.download_allowed
                              ? "Open / download ↗"
                              : resource.resource_type === "manual"
                                ? "View manual source ↗"
                                : "Open source ↗"}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="font-medium">No resources stored yet</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Add an official questionnaire page, manual, scoring guide,
                      permission source or validation paper before deploying this measure.
                    </p>
                  </div>
                )}

                {manualResources.length === 0 && (
                  <p className="mt-4 text-xs leading-5 text-slate-400">
                    No separate manual resource is currently stored. Some measures use an
                    official FAQ, documentation page, original publication or publisher
                    source instead of a standalone manual PDF.
                  </p>
                )}
              </Panel>
            </div>

            <Panel
              title="References & citation"
              description="Original sources, validation references and recommended citations stored with the measure."
            >
              {references.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {references.map((reference, index) => (
                    <div
                      key={reference.id}
                      className="flex flex-col justify-between gap-4 py-5 first:pt-0 last:pb-0 md:flex-row md:items-start"
                    >
                      <div className="flex max-w-4xl gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-7 text-slate-700">
                          {reference.citation}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => void copyCitation(reference)}
                          className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2 text-xs font-semibold"
                        >
                          {copiedReferenceId === reference.id
                            ? "Copied"
                            : "Copy citation"}
                        </button>

                        {reference.url && (
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-3 py-2 text-xs font-semibold"
                          >
                            Source ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No citation records are stored for this questionnaire yet.
                </p>
              )}
            </Panel>

            <Panel title="Psychometric evidence">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-medium">Structured psychometrics are the next library layer</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  PsyLattice currently stores the questionnaire, instructions, scoring,
                  resources, rights and references. Reliability, validity coefficients,
                  norms and validation populations should be added as structured,
                  source-linked records rather than invented or copied without context.
                  Until then, use the linked original and validation sources above.
                </p>
              </div>
            </Panel>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {libraryError && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm text-red-700">{libraryError}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Research measures"
          value={loading ? "..." : String(questionnaires.length)}
          detail="Available in the researcher catalogue"
        />
        <StatCard
          label="Public domain"
          value={loading ? "..." : String(publicDomainCount)}
          detail="Rights recorded as public domain"
        />
        <StatCard
          label="Research-only"
          value={loading ? "..." : String(researchOnlyCount)}
          detail="Not exposed in the Self workspace"
        />
        <StatCard
          label="Your questionnaires"
          value={loading ? "..." : String(customQuestionnaireCount)}
          detail="Owned by your PsyLattice account"
        />
      </div>

      <Panel
        title="Questionnaire library"
        description="Discover measures, review administration and scoring, inspect item content, open manuals and official resources, and verify usage rights before deployment."
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, acronym, construct, category or description..."
            className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All categories" : category}
              </option>
            ))}
          </select>

          <select
            value={licenceFilter}
            onChange={(event) => setLicenceFilter(event.target.value)}
            className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
          >
            <option value="All">All licence statuses</option>
            <option value="public_domain">Public domain</option>
            <option value="permitted">Use permitted / terms apply</option>
            <option value="researcher_owned">Researcher-created</option>
            <option value="restricted">Restricted</option>
            <option value="unknown">Needs verification</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            {loading
              ? "Loading catalogue..."
              : `${filteredQuestionnaires.length} of ${questionnaires.length} measures shown`}
          </p>

          {(search || categoryFilter !== "All" || licenceFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategoryFilter("All");
                setLicenceFilter("All");
              }}
              className="text-xs font-semibold text-cyan-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </Panel>

      {loading ? (
        <Panel title="Research catalogue">
          <p className="text-sm text-slate-500">Loading questionnaires...</p>
        </Panel>
      ) : filteredQuestionnaires.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredQuestionnaires.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-6 transition hover:border-slate-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Status type={licenceStatusType(item.license_status)}>
                    {licenceLabel(item.license_status)}
                  </Status>

                  {!item.self_available && <Status>Research only</Status>}
                  {item.source_type === "researcher_created" && (
                    <Status
                      type={
                        item.owner_user_id === currentUserId ||
                        item.access_mode === "free" ||
                        item.my_access_status === "approved"
                          ? "accent"
                          : "warning"
                      }
                    >
                      {item.owner_user_id === currentUserId
                        ? questionnairePublicationLabel(item)
                        : questionnairePublicationLabel(item)}
                    </Status>
                  )}
                </div>

                <span className="text-xs font-medium text-slate-400">
                  {item.category}
                </span>
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                {item.name}
                {item.acronym ? ` (${item.acronym})` : ""}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {item.description}
              </p>

              {item.source_type === "researcher_created" &&
                item.publisher_display_name && (
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    Published by {item.publisher_display_name}
                    {item.publisher_affiliation
                      ? ` · ${item.publisher_affiliation}`
                      : ""}
                  </p>
                )}

              <div className="mt-4 flex flex-wrap gap-2">
                {item.constructs.slice(0, 4).map((construct) => (
                  <span
                    key={construct}
                    className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500"
                  >
                    {construct}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-y border-slate-100 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    Items
                  </p>
                  <p className="mt-1 text-sm font-semibold">{item.item_count}</p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    Time
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {item.estimated_minutes ? `~${item.estimated_minutes} min` : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    Languages
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {item.languages.length}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void openQuestionnaire(item)}
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"
                >
                  {questionnaireCanUse(item)
                    ? "View research details"
                    : "View & request access"}
                </button>

                {item.license_source_url && (
                  <a
                    href={item.license_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.04)] text-slate-700"
                  >
                    Licence source ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Panel title="No matching questionnaires">
          <p className="text-sm leading-6 text-slate-500">
            No research measures match the current search and filters.
          </p>
        </Panel>
      )}

      <Panel title="Create custom questionnaire">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-medium">
              Build an original measure for your research.
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Build blocks with their questions inside them, configure scoring and
              branching, then choose whether the questionnaire stays private or is
              published to the PsyLattice research catalogue. Published questionnaires
              keep their original owner and publisher details.
            </p>
          </div>

          <button
            type="button"
            onClick={openCustomBuilder}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            + Create questionnaire
          </button>
        </div>
      </Panel>

      <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-[#cfc6f6] bg-[#f7f5ff] p-5">
        <p className="font-medium text-violet-900">
          Questionnaire licensing safeguard
        </p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-violet-800">
          Finding a questionnaire online does not automatically grant rights to
          reproduce, digitally administer, modify, score or redistribute it. PsyLattice
          records the source and current usage status, but researchers should verify the
          applicable terms for their study, jurisdiction and mode of use before launch.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   AMBULATORY PROTOCOL BUILDER
   ========================================================= */

function AmbulatoryBuilder({
  changeScreen,
  preferredStudyId,
  onStudyIdChange,
}: {
  changeScreen: (screen: Screen) => void;
  preferredStudyId: string;
  onStudyIdChange: (studyId: string) => void;
}) {
  type StudyOption = {
    id: string;
    title: string;
    status: string;
    components: Record<string, boolean>;
  };

  const [studies, setStudies] = useState<StudyOption[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [protocolName, setProtocolName] =
    useState("Ambulatory protocol");
  const [durationDays, setDurationDays] = useState(14);
  const [participantFeedbackEnabled, setParticipantFeedbackEnabled] =
    useState(false);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);
  const [protocol, setProtocol] = useState<AmbulatoryScheduleDraft[]>(
    defaultAmbulatoryProtocol()
  );
  const [questionnaires, setQuestionnaires] = useState<
    AmbulatoryQuestionnaireOption[]
  >([]);

  const selectedStudy =
    studies.find((study) => study.id === selectedStudyId) || null;

  async function loadStudies() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage("Your research studies could not be loaded.");
      setLoading(false);
      return;
    }

    const [studyResult, questionnaireResult] = await Promise.all([
      supabase
        .from("research_studies")
        .select("id, title, status, components")
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),

      supabase.rpc(
        "psylattice_research_ambulatory_questionnaire_catalogue"
      ),
    ]);

    if (studyResult.error) {
      console.error(
        "Could not load ambulatory studies:",
        studyResult.error
      );
      setErrorMessage("Your research studies could not be loaded.");
      setLoading(false);
      return;
    }

    const rows = (studyResult.data || []) as StudyOption[];
    setStudies(rows);

    if (!questionnaireResult.error) {
      setQuestionnaires(
        (questionnaireResult.data || []) as AmbulatoryQuestionnaireOption[]
      );
    }

    setSelectedStudyId((current) => {
      if (rows.some((study) => study.id === current)) {
        return current;
      }

      if (
        preferredStudyId &&
        rows.some((study) => study.id === preferredStudyId)
      ) {
        return preferredStudyId;
      }

      return rows[0]?.id || "";
    });

    setLoading(false);
  }

  async function loadProtocol(studyId: string) {
    if (!studyId) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = createClient();

    let { data, error } = await supabase.rpc(
      "psylattice_get_study_ambulatory_v3",
      {
        p_study_id: studyId,
      }
    );

    // During local development / hot reload, a Supabase request can occasionally
    // be interrupted while the component is remounting. Retry once before
    // treating the protocol as unavailable. Keep handled API failures out of
    // Next.js' intrusive development error overlay.
    if (error) {
      await new Promise((resolve) => setTimeout(resolve, 250));

      const retry = await supabase.rpc(
        "psylattice_get_study_ambulatory_v3",
        {
          p_study_id: studyId,
        }
      );

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn(
        "Could not load research ambulatory protocol:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
      );
      setErrorMessage(
        error.message ||
          "The ambulatory protocol could not be loaded. Please try reloading the saved protocol."
      );
      setLoading(false);
      return;
    }

    const row =
      Array.isArray(data) && data.length > 0
        ? data[0]
        : null;

    if (row) {
      setProtocolName(row.protocol_name || "Ambulatory protocol");
      setDurationDays(row.duration_days || 14);
      setParticipantFeedbackEnabled(
        Boolean(row.participant_feedback_enabled)
      );
      setNotificationsEnabled(
        row.notifications_enabled !== false
      );

      const loaded =
        Array.isArray(row.protocol) && row.protocol.length > 0
          ? nestAmbulatoryProtocol(
              row.protocol as AmbulatoryScheduleDraft[]
            )
          : defaultAmbulatoryProtocol();

      setProtocol(loaded);
    } else {
      setProtocolName("Ambulatory protocol");
      setDurationDays(14);
      setParticipantFeedbackEnabled(false);
      setNotificationsEnabled(true);
      setProtocol(defaultAmbulatoryProtocol());
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadStudies();
  }, []);

  useEffect(() => {
    if (selectedStudyId) {
      onStudyIdChange(selectedStudyId);
      void loadProtocol(selectedStudyId);
    }
  }, [selectedStudyId]);

  async function saveProtocol() {
    if (!selectedStudy || saving) {
      return;
    }

    const validation =
      validateAmbulatoryProtocol(protocol);

    if (validation) {
      setErrorMessage(validation);
      return;
    }

    if (durationDays < 1 || durationDays > 730) {
      setErrorMessage("Duration must be between 1 and 730 days.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_save_study_ambulatory_v3",
      {
        p_study_id: selectedStudy.id,
        p_name: protocolName.trim() || "Ambulatory protocol",
        p_duration_days: durationDays,
        p_protocol: serializeAmbulatoryProtocol(protocol),
        p_participant_feedback_enabled:
          participantFeedbackEnabled,
        p_notifications_enabled: notificationsEnabled,
      }
    );

    if (error) {
      console.error(
        "Could not save research ambulatory protocol:",
        error
      );
      setErrorMessage(
        error.message ||
          "The ambulatory protocol could not be saved."
      );
      setSaving(false);
      return;
    }

    setSuccessMessage(
      `Ambulatory protocol saved for ${selectedStudy.title}. Participant study links will use the Study Dashboard only because this study now has an active ambulatory protocol.`
    );

    setSaving(false);
    await loadProtocol(selectedStudy.id);
  }

  if (loading && studies.length === 0) {
    return (
      <Panel title="Ambulatory Assessment">
        <p className="text-sm text-slate-500">
          Loading ambulatory workspace...
        </p>
      </Panel>
    );
  }

  if (studies.length === 0) {
    return (
      <Panel title="Ambulatory Assessment">
        <p className="font-medium">Create a study first.</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Ambulatory protocols belong to a research study. Ordinary studies
          that do not use Ambulatory Assessment continue using the existing
          one-session participant flow.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => changeScreen("builder")}
          className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          ← Back to Study Builder
        </button>

        {selectedStudy && (
          <p className="text-sm text-slate-500">
            Editing ambulatory protocol for{" "}
            <span className="font-semibold text-slate-700">
              {selectedStudy.title}
            </span>
          </p>
        )}
      </div>

      {errorMessage && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="border-l-2 border-cyan-400 bg-transparent py-1 pl-3 pr-1 text-sm text-cyan-800">
          {successMessage}
        </div>
      )}

      <Panel
        title="Ambulatory Assessment"
        description="The Research workspace now uses the same nested, conditional ambulatory engine as Clinical."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
          <label>
            <span className="text-sm font-medium">Study</span>
            <select
              value={selectedStudyId}
              onChange={(event) =>
                setSelectedStudyId(event.target.value)
              }
              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
            >
              {studies.map((study) => (
                <option key={study.id} value={study.id}>
                  {study.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">
              Duration (days)
            </span>
            <input
              type="number"
              min="1"
              max="730"
              value={durationDays}
              onChange={(event) =>
                setDurationDays(Number(event.target.value))
              }
              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium">
            Protocol name
          </span>
          <input
            value={protocolName}
            onChange={(event) =>
              setProtocolName(event.target.value)
            }
            className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm"
          />
        </label>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(event) =>
                setNotificationsEnabled(event.target.checked)
              }
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium">
                Enable study email reminders
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Time-contingent schedules can create reminder emails after the participant supplies an email address and explicitly enables reminders.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
            <input
              type="checkbox"
              checked={participantFeedbackEnabled}
              onChange={(event) =>
                setParticipantFeedbackEnabled(event.target.checked)
              }
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium">
                Allow participant feedback summaries
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Off by default. Study participants normally see adherence and
                progress through the study, not psychological score feedback,
                because feedback itself can influence subsequent responses.
              </p>
            </div>
          </label>
        </div>
      </Panel>

      <AmbulatoryProtocolBuilder
        protocol={protocol}
        onChange={setProtocol}
        questionnaires={questionnaires}
        context="research"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || !selectedStudy}
          onClick={() => void saveProtocol()}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save ambulatory protocol"}
        </button>

        <button
          type="button"
          disabled={loading || !selectedStudy}
          onClick={() => void loadProtocol(selectedStudyId)}
          className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          Reload saved protocol
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Participant experience">
          <p className="text-sm leading-6 text-slate-500">
            Only studies with this ambulatory component use the longitudinal
            Study Dashboard. Studies without ambulatory assessment keep the
            existing consent → demographics → questionnaires → completion flow.
          </p>
        </Panel>

        <Panel title="Research data structure">
          <p className="text-sm leading-6 text-slate-500">
            PsyLattice stores scheduled prompt instances, missed/completed
            prompts, event-triggered check-ins, item-level responses and
            timestamps separately so compliance and response latency can be
            analysed rather than inferred.
          </p>
        </Panel>

        <Panel title="Research-ready outputs">
          <p className="text-sm leading-6 text-slate-500">
            Data Dashboard, Data Explorer and Export Data can use one row per
            check-in, one row per item response or one participant-day. XLSX
            exports can then be shaped by the researcher.
          </p>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   PARTICIPANTS
   ========================================================= */

function Participants() {
  type ResearchStudyOption = {
    id: string;
    title: string;
    status: string;
  };

  type ResearchParticipant = {
    id: string;
    study_link_id: string;
    public_id: string;
    participant_code: string | null;
    is_test: boolean;
    status: string;
    enrolled_at: string;
    completed_at: string | null;
  };

  type ResearchParticipantSession = {
    participant_id: string;
    phase: string;
    status: string;
    last_seen_at: string;
    completed_at: string | null;
  };

  type ResearchLink = {
    id: string;
    name: string;
  };


  type DemographicResponseRow = {
    id: string;
    participant_id: string;
    response: unknown;
    text_value: string | null;
    numeric_value: number | null;
    question_snapshot: {
      label?: string;
      question_type?: string;
      direct_identifier?: boolean;
    };
  };

  const [studies, setStudies] = useState<ResearchStudyOption[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [participants, setParticipants] = useState<ResearchParticipant[]>([]);
  const [sessions, setSessions] = useState<ResearchParticipantSession[]>([]);
  const [links, setLinks] = useState<ResearchLink[]>([]);
  const [responseCount, setResponseCount] = useState(0);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [participantError, setParticipantError] = useState("");
  const [participantMessage, setParticipantMessage] = useState("");
  const [selectedDemographicParticipantId, setSelectedDemographicParticipantId] =
    useState("");
  const [demographicResponses, setDemographicResponses] = useState<
    DemographicResponseRow[]
  >([]);
  const [loadingDemographicResponses, setLoadingDemographicResponses] =
    useState(false);

  useEffect(() => {
    async function loadStudies() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setParticipantError("Your research studies could not be loaded.");
        setLoadingParticipants(false);
        return;
      }

      const { data, error } = await supabase
        .from("research_studies")
        .select("id, title, status")
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Could not load participant studies:", error);
        setParticipantError("Your research studies could not be loaded.");
        setLoadingParticipants(false);
        return;
      }

      const rows = (data || []) as ResearchStudyOption[];
      setStudies(rows);

      if (rows.length > 0) {
        setSelectedStudyId((current) => current || rows[0].id);
      } else {
        setLoadingParticipants(false);
      }
    }

    void loadStudies();
  }, []);

  useEffect(() => {
    async function loadParticipants() {
      if (!selectedStudyId) return;

      setLoadingParticipants(true);
      setParticipantError("");
      setParticipantMessage("");

      const supabase = createClient();

      const [participantResult, linkResult, responseResult] =
        await Promise.all([
          supabase
            .from("study_participants")
            .select(
              "id, study_link_id, public_id, participant_code, is_test, status, enrolled_at, completed_at"
            )
            .eq("study_id", selectedStudyId)
            .order("enrolled_at", { ascending: false }),
          supabase
            .from("study_links")
            .select("id, name")
            .eq("study_id", selectedStudyId),
          supabase
            .from("research_responses")
            .select("id", { count: "exact", head: true })
            .eq("study_id", selectedStudyId),
        ]);

      if (participantResult.error) {
        console.error(
          "Could not load research participants:",
          participantResult.error
        );
        setParticipantError("Participant records could not be loaded.");
        setLoadingParticipants(false);
        return;
      }

      if (linkResult.error) {
        console.error("Could not load participant links:", linkResult.error);
      }

      const participantRows =
        (participantResult.data || []) as ResearchParticipant[];

      let sessionRows: ResearchParticipantSession[] = [];

      if (participantRows.length > 0) {
        const { data: sessionData, error: sessionError } = await supabase
          .from("participant_sessions")
          .select(
            "participant_id, phase, status, last_seen_at, completed_at"
          )
          .in(
            "participant_id",
            participantRows.map((participant) => participant.id)
          )
          .order("started_at", { ascending: false });

        if (sessionError) {
          console.error(
            "Could not load participant sessions:",
            sessionError
          );
        } else {
          sessionRows =
            (sessionData || []) as ResearchParticipantSession[];
        }
      }

      setParticipants(participantRows);
      setSelectedDemographicParticipantId((current) =>
        participantRows.some((participant) => participant.id === current)
          ? current
          : participantRows[0]?.id || ""
      );
      setSessions(sessionRows);
      setLinks((linkResult.data || []) as ResearchLink[]);
      setResponseCount(responseResult.count || 0);
      setLoadingParticipants(false);
    }

    void loadParticipants();
  }, [selectedStudyId]);

  useEffect(() => {
    async function loadDemographicResponses() {
      if (!selectedDemographicParticipantId) {
        setDemographicResponses([]);
        return;
      }

      setLoadingDemographicResponses(true);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("participant_demographic_responses")
        .select(
          "id, participant_id, response, text_value, numeric_value, question_snapshot"
        )
        .eq("participant_id", selectedDemographicParticipantId)
        .order("answered_at", { ascending: true });

      if (error) {
        console.error("Could not load demographic responses:", error);
        setParticipantError("Participant demographic data could not be loaded.");
        setDemographicResponses([]);
        setLoadingDemographicResponses(false);
        return;
      }

      setDemographicResponses((data || []) as DemographicResponseRow[]);
      setLoadingDemographicResponses(false);
    }

    void loadDemographicResponses();
  }, [selectedDemographicParticipantId]);

  function demographicDisplayValue(row: DemographicResponseRow) {
    if (row.text_value !== null) return row.text_value;
    if (row.numeric_value !== null) return String(row.numeric_value);
    if (Array.isArray(row.response)) return row.response.join(", ");
    if (row.response === null || row.response === undefined) return "—";
    if (typeof row.response === "object") return JSON.stringify(row.response);
    return String(row.response);
  }

  function latestSessionForParticipant(participantId: string) {
    return sessions.find(
      (session) => session.participant_id === participantId
    );
  }

  function linkName(linkId: string) {
    return links.find((link) => link.id === linkId)?.name || "Study link";
  }

  async function markWithdrawn(participantId: string) {
    setParticipantError("");
    setParticipantMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("study_participants")
      .update({ status: "withdrawn" })
      .eq("id", participantId);

    if (error) {
      console.error("Could not record withdrawal:", error);
      setParticipantError("Withdrawal status could not be updated.");
      return;
    }

    setParticipants((previous) =>
      previous.map((participant) =>
        participant.id === participantId
          ? { ...participant, status: "withdrawn" }
          : participant
      )
    );
    setParticipantMessage("Participant marked as withdrawn.");
  }

  const liveParticipants = participants.filter(
    (participant) => !participant.is_test
  );
  const testParticipants = participants.filter(
    (participant) => participant.is_test
  );
  const completedParticipants = liveParticipants.filter(
    (participant) =>
      participant.status === "completed" ||
      participant.status === "baseline_complete"
  ).length;
  const activeParticipants = liveParticipants.filter(
    (participant) => participant.status === "active"
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="min-w-[280px]">
          <span className="text-sm font-medium">Study</span>
          <select
            value={selectedStudyId}
            onChange={(event) => setSelectedStudyId(event.target.value)}
            className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
          >
            {studies.map((study) => (
              <option key={study.id} value={study.id}>
                {study.title}
              </option>
            ))}
          </select>
        </label>

        <Status type="accent">
          {studies.find((study) => study.id === selectedStudyId)?.status ||
            "No study"}
        </Status>
      </div>

      {participantError && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm text-red-700">{participantError}</p>
        </div>
      )}

      {participantMessage && (
        <div className="border-l-2 border-cyan-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm text-cyan-800">{participantMessage}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live participants"
          value={loadingParticipants ? "..." : String(liveParticipants.length)}
          detail="Excludes test participation"
        />
        <StatCard
          label="Active"
          value={loadingParticipants ? "..." : String(activeParticipants)}
          detail="Baseline currently in progress"
        />
        <StatCard
          label="Baseline complete"
          value={loadingParticipants ? "..." : String(completedParticipants)}
          detail="Live participants"
        />
        <StatCard
          label="Responses"
          value={loadingParticipants ? "..." : String(responseCount)}
          detail={`${testParticipants.length} test participant${
            testParticipants.length === 1 ? "" : "s"
          } kept separate`}
        />
      </div>

      <Panel
        title="Participant records"
        description="Pseudonymous participant IDs and study-session status. Test participation is visibly separated from live research data."
      >
        {loadingParticipants ? (
          <p className="text-sm text-slate-500">Loading participants...</p>
        ) : participants.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No participants yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a Participant Link and run a test participation. New
              participant records will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Participant</th>
                  <th className="pb-3 font-medium">Recruitment link</th>
                  <th className="pb-3 font-medium">Code</th>
                  <th className="pb-3 font-medium">Session</th>
                  <th className="pb-3 font-medium">Last activity</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {participants.map((participant) => {
                  const session = latestSessionForParticipant(
                    participant.id
                  );

                  return (
                    <tr key={participant.id}>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {participant.public_id}
                          </span>
                          {participant.is_test && (
                            <Status type="warning">TEST</Status>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(
                            participant.enrolled_at
                          ).toLocaleString()}
                        </p>
                      </td>

                      <td className="py-4 text-slate-500">
                        {linkName(participant.study_link_id)}
                      </td>

                      <td className="py-4 text-slate-500">
                        {participant.participant_code || "—"}
                      </td>

                      <td className="py-4 text-slate-500">
                        {session
                          ? `${session.phase} · ${session.status}`
                          : "—"}
                      </td>

                      <td className="py-4 text-slate-500">
                        {session
                          ? new Date(
                              session.last_seen_at
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td className="py-4">
                        <Status
                          type={
                            participant.status === "completed" ||
                            participant.status === "baseline_complete"
                              ? "success"
                              : participant.status === "withdrawn"
                                ? "neutral"
                                : "accent"
                          }
                        >
                          {participant.status.replaceAll("_", " ")}
                        </Status>
                      </td>

                      <td className="py-4 text-right">
                        {participant.status !== "withdrawn" && (
                          <button
                            type="button"
                            onClick={() =>
                              void markWithdrawn(participant.id)
                            }
                            className="text-xs font-semibold text-slate-500 hover:text-red-700"
                          >
                            Record withdrawal
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="Participant demographics"
        description="View the demographic fields submitted for a participant. Direct identifiers are visibly marked."
      >
        {participants.length === 0 ? (
          <p className="text-sm text-slate-500">
            Demographic responses will appear after a participant submits the
            Demographics study component.
          </p>
        ) : (
          <div className="space-y-5">
            <label className="block max-w-md">
              <span className="text-sm font-medium">Participant</span>
              <select
                value={selectedDemographicParticipantId}
                onChange={(event) =>
                  setSelectedDemographicParticipantId(event.target.value)
                }
                className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
              >
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.public_id}
                    {participant.is_test ? " · TEST" : ""}
                  </option>
                ))}
              </select>
            </label>

            {loadingDemographicResponses ? (
              <p className="text-sm text-slate-500">
                Loading demographic responses...
              </p>
            ) : demographicResponses.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-medium">No demographic submission yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This participant has not submitted demographic data for this
                  study session.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {demographicResponses.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        {row.question_snapshot?.label || "Demographic field"}
                      </p>
                      {row.question_snapshot?.direct_identifier && (
                        <Status type="warning">Identifier</Status>
                      )}
                    </div>
                    <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                      {demographicDisplayValue(row)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>

      <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
        <p className="text-sm leading-6 text-slate-500">
          Participant IDs are pseudonymous by default. Avoid entering names,
          emails or other directly identifying information into participant
          codes unless your approved protocol and data-management plan
          explicitly require it.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PARTICIPANT LINKS
   ========================================================= */

function ParticipantLinks() {
  type LinkStudy = {
    id: string;
    title: string;
    status: string;
    target_sample_size: number | null;
    components: Record<string, boolean>;
  };

  type RecruitmentLink = {
    id: string;
    study_id: string;
    name: string;
    token: string;
    access_mode: "open" | "participant_code";
    max_participants: number | null;
    starts_at: string | null;
    ends_at: string | null;
    allow_multiple_submissions: boolean;
    is_test_link: boolean;
    status: "active" | "paused" | "closed";
    created_at: string;
  };

  type LinkParticipant = {
    id: string;
    study_link_id: string;
    is_test: boolean;
    status: string;
  };

  const [studies, setStudies] = useState<LinkStudy[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [links, setLinks] = useState<RecruitmentLink[]>([]);
  const [participants, setParticipants] = useState<LinkParticipant[]>([]);

  const [loadingLinks, setLoadingLinks] = useState(true);
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkMessage, setLinkMessage] = useState("");

  const [linkNameDraft, setLinkNameDraft] = useState("Main study link");
  const [linkKind, setLinkKind] = useState<"test" | "live">("test");
  const [accessMode, setAccessMode] =
    useState<"open" | "participant_code">("open");
  const [participantCodes, setParticipantCodes] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] =
    useState(false);
  const [activationConfirmed, setActivationConfirmed] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function loadRecruitmentData(preferredStudyId?: string) {
    setLoadingLinks(true);
    setLinkError("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLinkError("Your participant links could not be loaded.");
      setLoadingLinks(false);
      return;
    }

    const { data: studyData, error: studyError } = await supabase
      .from("research_studies")
      .select("id, title, status, target_sample_size, components")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (studyError) {
      console.error("Could not load studies for participant links:", studyError);
      setLinkError("Your saved studies could not be loaded.");
      setLoadingLinks(false);
      return;
    }

    const studyRows = (studyData || []) as LinkStudy[];
    setStudies(studyRows);

    const studyToUse =
      preferredStudyId ||
      selectedStudyId ||
      studyRows[0]?.id ||
      "";

    if (!studyToUse) {
      setLinks([]);
      setParticipants([]);
      setLoadingLinks(false);
      return;
    }

    if (studyToUse !== selectedStudyId) {
      setSelectedStudyId(studyToUse);
    }

    const [linkResult, participantResult] = await Promise.all([
      supabase
        .from("study_links")
        .select(
          "id, study_id, name, token, access_mode, max_participants, starts_at, ends_at, allow_multiple_submissions, is_test_link, status, created_at"
        )
        .eq("study_id", studyToUse)
        .order("created_at", { ascending: false }),
      supabase
        .from("study_participants")
        .select("id, study_link_id, is_test, status")
        .eq("study_id", studyToUse),
    ]);

    if (linkResult.error) {
      console.error("Could not load study links:", linkResult.error);
      setLinkError("Participant links could not be loaded.");
      setLoadingLinks(false);
      return;
    }

    if (participantResult.error) {
      console.error(
        "Could not load participant counts:",
        participantResult.error
      );
    }

    setLinks((linkResult.data || []) as RecruitmentLink[]);
    setParticipants(
      (participantResult.data || []) as LinkParticipant[]
    );
    setLoadingLinks(false);
  }

  useEffect(() => {
    void loadRecruitmentData();
    // Initial recruitment workspace load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedStudyId || studies.length === 0) return;
    void loadRecruitmentData(selectedStudyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudyId]);

  function participantCountForLink(linkId: string, includeTests: boolean) {
    return participants.filter(
      (participant) =>
        participant.study_link_id === linkId &&
        participant.status !== "withdrawn" &&
        (includeTests || !participant.is_test)
    ).length;
  }

  function publicUrl(link: RecruitmentLink) {
    if (typeof window === "undefined") {
      return `/study/${link.token}`;
    }

    return `${window.location.origin}/study/${link.token}`;
  }

  async function copyLink(link: RecruitmentLink) {
    try {
      await navigator.clipboard.writeText(publicUrl(link));
      setLinkMessage("Participant link copied.");
      setLinkError("");
    } catch {
      setLinkError("The link could not be copied automatically.");
    }
  }

  async function createRecruitmentLink() {
    if (creatingLink || !selectedStudyId) return;

    setCreatingLink(true);
    setLinkError("");
    setLinkMessage("");

    if (!linkNameDraft.trim()) {
      setLinkError("Give this participant link a name.");
      setCreatingLink(false);
      return;
    }

    const codes = Array.from(
      new Set(
        participantCodes
          .split(/\r?\n|,/)
          .map((code) => code.trim())
          .filter(Boolean)
      )
    );

    if (accessMode === "participant_code" && codes.length === 0) {
      setLinkError(
        "Add at least one pseudonymous participant code for a code-protected link."
      );
      setCreatingLink(false);
      return;
    }

    if (linkKind === "live" && !activationConfirmed) {
      setLinkError(
        "Confirm that the study is ready for live recruitment before creating a live participant link."
      );
      setCreatingLink(false);
      return;
    }

    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to create a participant link.");
      }

      const { data: selectedMeasures, error: measureError } = await supabase
        .from("study_measures")
        .select("questionnaire_id")
        .eq("study_id", selectedStudyId);

      if (measureError) {
        throw measureError;
      }

      const questionnaireIds = Array.from(
        new Set(
          (selectedMeasures || []).map((measure) => measure.questionnaire_id)
        )
      );

      if (linkKind === "live" && questionnaireIds.length > 0) {
        const { data: selectedQuestionnaires, error: questionnaireError } =
          await supabase
            .from("questionnaires")
            .select("slug, name")
            .in("id", questionnaireIds);

        if (questionnaireError) {
          throw questionnaireError;
        }

        const containsPhq9 = (selectedQuestionnaires || []).some(
          (questionnaire) =>
            questionnaire.slug === "patient-health-questionnaire-9"
        );

        if (containsPhq9) {
          throw new Error(
            "This study contains PHQ-9. Test links are available now, but live deployment is blocked until PsyLattice has a study-specific safety-response protocol for item 9."
          );
        }
      }

      if (linkKind === "live") {
        const { error: activateError } = await supabase
          .from("research_studies")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedStudyId)
          .eq("owner_user_id", user.id);

        if (activateError) {
          throw activateError;
        }
      }

      const { data: createdLink, error: createError } = await supabase
        .from("study_links")
        .insert({
          study_id: selectedStudyId,
          owner_user_id: user.id,
          name: linkNameDraft.trim(),
          access_mode: accessMode,
          max_participants:
            linkKind === "test" ? null : Math.max(1, maxParticipants),
          allow_multiple_submissions:
            accessMode === "open" && allowMultipleSubmissions,
          is_test_link: linkKind === "test",
          status: "active",
        })
        .select(
          "id, study_id, name, token, access_mode, max_participants, starts_at, ends_at, allow_multiple_submissions, is_test_link, status, created_at"
        )
        .single();

      if (createError || !createdLink) {
        throw createError || new Error("The participant link could not be created.");
      }

      if (accessMode === "participant_code" && codes.length > 0) {
        const { error: codeError } = await supabase
          .from("study_link_codes")
          .insert(
            codes.map((code) => ({
              study_link_id: createdLink.id,
              owner_user_id: user.id,
              code,
              max_uses: 1,
              is_active: true,
            }))
          );

        if (codeError) {
          await supabase
            .from("study_links")
            .delete()
            .eq("id", createdLink.id)
            .eq("owner_user_id", user.id);
          throw codeError;
        }
      }

      setLinkMessage(
        linkKind === "test"
          ? "Test participant link created. Test responses will be marked separately."
          : "Live participant link created and the study was activated."
      );
      setShowCreateForm(false);
      setParticipantCodes("");
      setActivationConfirmed(false);
      setLinkNameDraft("Main study link");
      setLinkKind("test");
      setAccessMode("open");

      await loadRecruitmentData(selectedStudyId);
    } catch (error) {
      console.error("Creating participant link failed:", error);
      setLinkError(
        error instanceof Error
          ? error.message
          : "The participant link could not be created."
      );
    } finally {
      setCreatingLink(false);
    }
  }

  async function toggleLinkStatus(link: RecruitmentLink) {
    const nextStatus = link.status === "active" ? "paused" : "active";

    setLinkError("");
    setLinkMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("study_links")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", link.id);

    if (error) {
      console.error("Could not update participant link:", error);
      setLinkError("The participant link status could not be changed.");
      return;
    }

    setLinks((previous) =>
      previous.map((candidate) =>
        candidate.id === link.id
          ? { ...candidate, status: nextStatus }
          : candidate
      )
    );

    setLinkMessage(
      nextStatus === "active"
        ? "Participant link activated."
        : "Participant link paused."
    );
  }

  const selectedStudy = studies.find(
    (study) => study.id === selectedStudyId
  );

  return (
    <div className="space-y-5">
      <Panel
        title="Participant links"
        description="Create secure token-based participant routes for saved PsyLattice studies. Test data and live research data remain distinguishable."
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label>
            <span className="text-sm font-medium">Study</span>
            <select
              value={selectedStudyId}
              onChange={(event) => {
                setSelectedStudyId(event.target.value);
                setLinkError("");
                setLinkMessage("");
              }}
              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
            >
              {studies.map((study) => (
                <option key={study.id} value={study.id}>
                  {study.title}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            disabled={!selectedStudyId}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {showCreateForm ? "Close" : "+ Create participant link"}
          </button>
        </div>

        {selectedStudy && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Status
              type={
                selectedStudy.status === "active" ? "success" : "neutral"
              }
            >
              Study {selectedStudy.status}
            </Status>
            <span className="text-xs text-slate-400">
              Target sample: {selectedStudy.target_sample_size || "Not set"}
            </span>
          </div>
        )}
      </Panel>

      {linkError && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm leading-6 text-red-700">{linkError}</p>
        </div>
      )}

      {linkMessage && (
        <div className="border-l-2 border-cyan-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm leading-6 text-cyan-800">{linkMessage}</p>
        </div>
      )}

      {showCreateForm && (
        <Panel
          title="Create participant link"
          description="Use a TEST link first. Live links activate the study for recruitment."
        >
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-medium">Link name</span>
                <input
                  value={linkNameDraft}
                  onChange={(event) => setLinkNameDraft(event.target.value)}
                  placeholder="Psychology cohort"
                  className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm"
                />
              </label>

              <label>
                <span className="text-sm font-medium">Link type</span>
                <select
                  value={linkKind}
                  onChange={(event) => {
                    setLinkKind(event.target.value as "test" | "live");
                    setActivationConfirmed(false);
                  }}
                  className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                >
                  <option value="test">TEST link</option>
                  <option value="live">Live recruitment link</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-medium">Participant access</span>
                <select
                  value={accessMode}
                  onChange={(event) =>
                    setAccessMode(
                      event.target.value as "open" | "participant_code"
                    )
                  }
                  className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                >
                  <option value="open">Anyone with the link</option>
                  <option value="participant_code">
                    Assigned participant code required
                  </option>
                </select>
              </label>

              {linkKind === "live" && (
                <label>
                  <span className="text-sm font-medium">
                    Maximum participants
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={maxParticipants}
                    onChange={(event) =>
                      setMaxParticipants(
                        Math.max(1, Number(event.target.value))
                      )
                    }
                    className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm"
                  />
                </label>
              )}
            </div>

            {accessMode === "participant_code" && (
              <label className="block">
                <span className="text-sm font-medium">
                  Assigned participant codes
                </span>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Enter one pseudonymous code per line. Each code can be used
                  once in this version.
                </p>
                <textarea
                  value={participantCodes}
                  onChange={(event) =>
                    setParticipantCodes(event.target.value)
                  }
                  rows={6}
                  placeholder={"P001\nP002\nP003"}
                  className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 font-mono text-sm"
                />
              </label>
            )}

            {accessMode === "open" && (
              <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={allowMultipleSubmissions}
                  onChange={(event) =>
                    setAllowMultipleSubmissions(event.target.checked)
                  }
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">
                    Allow multiple submissions from the same open link
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Open links cannot reliably identify the same person across
                    devices without a participant code. Leave this off for most
                    studies.
                  </p>
                </div>
              </label>
            )}

            {linkKind === "live" && (
              <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-[#cfc6f6] bg-[#f7f5ff] p-4">
                <input
                  type="checkbox"
                  checked={activationConfirmed}
                  onChange={(event) =>
                    setActivationConfirmed(event.target.checked)
                  }
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-violet-950">
                    Confirm live deployment
                  </p>
                  <p className="mt-1 text-xs leading-5 text-violet-800">
                    I confirm that the study is ready for recruitment and that
                    its consent, questionnaire rights, ethics requirements,
                    participant information, and approved study procedures have
                    been reviewed by the research team.
                  </p>
                </div>
              </label>
            )}

            <button
              type="button"
              onClick={() => void createRecruitmentLink()}
              disabled={creatingLink}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creatingLink
                ? "Creating..."
                : linkKind === "test"
                  ? "Create TEST link"
                  : "Activate study & create live link"}
            </button>
          </div>
        </Panel>
      )}

      <Panel
        title="Recruitment links"
        description="Each link uses a long random token. Participants never enter the Researcher workspace."
      >
        {loadingLinks ? (
          <p className="text-sm text-slate-500">Loading participant links...</p>
        ) : links.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No participant links yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a TEST link first, complete the participant flow yourself,
              and inspect the resulting participant/response records before
              live recruitment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {links.map((link) => {
              const count = participantCountForLink(
                link.id,
                link.is_test_link
              );

              return (
                <div
                  key={link.id}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{link.name}</p>
                        <Status
                          type={link.is_test_link ? "warning" : "success"}
                        >
                          {link.is_test_link ? "TEST" : "LIVE"}
                        </Status>
                        <Status
                          type={
                            link.status === "active"
                              ? "success"
                              : "neutral"
                          }
                        >
                          {link.status}
                        </Status>
                      </div>

                      <code className="mt-2 block max-w-3xl break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                        {publicUrl(link)}
                      </code>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                        <span>
                          Access:{" "}
                          {link.access_mode === "participant_code"
                            ? "Assigned code"
                            : "Open link"}
                        </span>
                        <span>
                          Participants: {count}
                          {!link.is_test_link && link.max_participants
                            ? ` / ${link.max_participants}`
                            : ""}
                        </span>
                        <span>
                          Created{" "}
                          {new Date(link.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void copyLink(link)}
                        className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-2.5 text-xs font-semibold"
                      >
                        Copy link
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            publicUrl(link),
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                        className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-2.5 text-xs font-semibold"
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleLinkStatus(link)}
                        className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-2.5 text-xs font-semibold"
                      >
                        {link.status === "active" ? "Pause" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Participant flow">
          <div className="space-y-3">
            {[
              "Study landing page",
              "Participant code, when configured",
              "Consent using the study's current consent version",
              "Configured participant demographics",
              "Baseline questionnaires in the selected order",
              "Pseudonymous participant record",
              "Completion / follow-up status",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-900">
                  {index + 1}
                </span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Deployment safeguards">
          <div className="space-y-4 text-sm leading-6 text-slate-600">
            <p>
              Test links create records marked <strong>TEST</strong> so they
              can be distinguished from live research participation.
            </p>
            <p>
              Live links require an explicit deployment confirmation and
              activate the selected study.
            </p>
            <p>
              Live deployment is currently blocked when PHQ-9 is selected until
              a study-specific item-9 safety-response protocol is configured.
              TEST links remain available for interface testing.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   RESEARCH DATA WORKSPACE — SHARED TYPES / HELPERS
   ========================================================= */

type ResearchDatasetType =
  | "participant_summary"
  | "demographics"
  | "questionnaire_responses"
  | "participant_uploads"
  | "questionnaire_scores"
  | "cognitive_sessions"
  | "cognitive_trials"
  | "cognitive_participant_summary"
  | "consent"
  | "ambulatory_checkins"
  | "ambulatory_responses"
  | "ambulatory_wide"
  | "ambulatory_participant_days"
  | "analysis_wide";

type ResearchIdentityMode = "pseudonymous" | "anonymous";

type ResearchDataStudy = {
  id: string;
  title: string;
  status: string;
  target_sample_size: number | null;
  components: Record<string, boolean>;
};

type ResearchDataParticipant = {
  id: string;
  study_link_id: string;
  public_id: string;
  participant_code: string | null;
  is_test: boolean;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
};

type ResearchDataSession = {
  id: string;
  participant_id: string;
  phase: string;
  followup_wave_id: string | null;
  status: string;
  is_test: boolean;
  started_at: string;
  last_seen_at: string;
  completed_at: string | null;
};

type ResearchDataConsent = {
  id: string;
  participant_id: string;
  participant_session_id: string;
  consent_version_id: string | null;
  consented: boolean;
  responses: Record<string, unknown>;
  consent_snapshot: Record<string, unknown>;
  consented_at: string;
};

type ResearchDataDemographicQuestion = {
  id: string;
  position: number;
  field_key: string;
  label: string;
  description: string | null;
  question_type: string;
  required: boolean;
  direct_identifier: boolean;
  response_config: Record<string, unknown>;
  validation_config: Record<string, unknown>;
};

type ResearchDataDemographicResponse = {
  id: string;
  participant_id: string;
  question_id: string;
  response: unknown;
  text_value: string | null;
  numeric_value: number | null;
  question_snapshot: Record<string, unknown>;
  answered_at: string;
};

type ResearchDataMeasure = {
  id: string;
  questionnaire_id: string;
  questionnaire_version_id: string;
  measurement_point: string;
  followup_wave_id: string | null;
  position: number;
  required: boolean;
};

type ResearchDataMeasureSession = {
  id: string;
  participant_id: string;
  participant_session_id: string;
  study_measure_id: string;
  questionnaire_version_id: string;
  status: string;
  scores: Record<string, unknown>;
  started_at: string;
  completed_at: string | null;
};

type ResearchDataResponse = {
  id: string;
  measure_session_id: string;
  participant_id: string;
  study_measure_id: string;
  questionnaire_version_id: string;
  item_id: string;
  response: unknown;
  numeric_value: number | null;
  text_value: string | null;
  score_value: number | null;
  answered_at: string;
};

type ResearchDataQuestionnaire = {
  id: string;
  name: string;
  acronym: string | null;
  category: string;
};

type ResearchDataQuestionnaireVersion = {
  id: string;
  questionnaire_id: string;
  version_label: string;
};

type ResearchDataQuestionnaireItem = {
  id: string;
  version_id: string;
  item_key: string | null;
  position: number;
  prompt: string;
  subscale: string | null;
  reverse_scored: boolean;
  response_type: string;
  required: boolean;
  response_options: unknown;
  response_config: Record<string, unknown>;
  validation_config: Record<string, unknown>;
  scoring_config: Record<string, unknown>;
  display_logic: Record<string, unknown>;
  randomization_config: Record<string, unknown>;
  is_content_only: boolean;
};

type ResearchDataAmbulatoryPrompt = {
  id: string;
  participant_id: string;
  schedule_key: string;
  schedule_label: string;
  trigger_type: string;
  local_date: string;
  occurrence_index: number;
  scheduled_for: string | null;
  expires_at: string | null;
  status: string;
  notification_sent_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
};

type ResearchDataAmbulatoryCheckin = {
  id: string;
  participant_id: string;
  prompt_instance_id: string | null;
  schedule_key: string;
  schedule_label: string;
  trigger_type: string;
  local_date: string;
  occurrence_index: number;
  trigger_source: string;
  started_at: string;
  completed_at: string | null;
};

type ResearchDataAmbulatoryResponse = {
  id: string;
  checkin_id: string;
  participant_id: string;
  item_key: string;
  item_type: string;
  prompt_snapshot: string;
  response: unknown;
  numeric_value: number | null;
  text_value: string | null;
  answered_at: string;
};

type ResearchDataCognitiveAttachment = {
  id: string;
  task_id: string;
  version_id: string;
  position: number;
  required: boolean;
  administration_mode: string;
  title: string;
  short_title: string | null;
  domain: string;
  version_label: string;
  version_number: number;
};

type ResearchDataCognitiveSession = {
  id: string;
  task_id: string;
  version_id: string;
  study_cognitive_task_id: string | null;
  participant_id: string | null;
  participant_session_id: string | null;
  session_mode: string;
  status: string;
  device_info: Record<string, unknown>;
  timing_quality: Record<string, unknown>;
  summary_scores: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type ResearchDataCognitiveTrial = {
  id: string;
  session_id: string;
  block_key: string | null;
  trial_index: number;
  condition_label: string | null;
  stimulus_payload: Record<string, unknown>;
  response_payload: Record<string, unknown>;
  correct: boolean | null;
  reaction_time_ms: number | null;
  timing: Record<string, unknown>;
  created_at: string;
};

type ResearchDataFollowupWave = {
  id: string;
  name: string;
  position: number;
  status: string;
};

type ResearchDataExportLog = {
  id: string;
  dataset_type: string;
  export_format: "csv" | "json" | "xlsx";
  identity_mode: ResearchIdentityMode;
  include_test_data: boolean;
  include_direct_identifiers: boolean;
  row_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ResearchDataBundle = {
  participants: ResearchDataParticipant[];
  sessions: ResearchDataSession[];
  consents: ResearchDataConsent[];
  demographicQuestions: ResearchDataDemographicQuestion[];
  demographicResponses: ResearchDataDemographicResponse[];
  measures: ResearchDataMeasure[];
  measureSessions: ResearchDataMeasureSession[];
  responses: ResearchDataResponse[];
  questionnaires: ResearchDataQuestionnaire[];
  questionnaireVersions: ResearchDataQuestionnaireVersion[];
  questionnaireItems: ResearchDataQuestionnaireItem[];
  ambulatoryPrompts: ResearchDataAmbulatoryPrompt[];
  ambulatoryCheckins: ResearchDataAmbulatoryCheckin[];
  ambulatoryResponses: ResearchDataAmbulatoryResponse[];
  cognitiveAttachments: ResearchDataCognitiveAttachment[];
  cognitiveSessions: ResearchDataCognitiveSession[];
  cognitiveTrials: ResearchDataCognitiveTrial[];
  followupWaves: ResearchDataFollowupWave[];
  exportLogs: ResearchDataExportLog[];
};

type ResearchTableRow = Record<string, unknown>;

type ResearchCodebookRow = {
  variable: string;
  label: string;
  type: string;
  source: string;
  notes: string;
  questionnaire?: string;
  phase?: string;
  item_key?: string;
  item_position?: number | string;
  response_type?: string;
  component?: string;
  value_labels?: string;
  required?: boolean | string;
  reverse_scored?: boolean | string;
  storage?: string;
};

const emptyResearchDataBundle: ResearchDataBundle = {
  participants: [],
  sessions: [],
  consents: [],
  demographicQuestions: [],
  demographicResponses: [],
  measures: [],
  measureSessions: [],
  responses: [],
  questionnaires: [],
  questionnaireVersions: [],
  questionnaireItems: [],
  ambulatoryPrompts: [],
  ambulatoryCheckins: [],
  ambulatoryResponses: [],
  cognitiveAttachments: [],
  cognitiveSessions: [],
  cognitiveTrials: [],
  followupWaves: [],
  exportLogs: [],
};


type ResearchAnalysisSample = {
  id: string;
  study_id: string;
  owner_user_id: string;
  name: string;
  description: string;
  sample_type: "primary" | "per_protocol" | "sensitivity" | "custom";
  created_at: string;
  updated_at: string;
};

type ResearchAnalysisSampleMember = {
  id: string;
  sample_id: string;
  participant_id: string;
  decision: "include" | "review" | "exclude";
  reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

function useResearchAnalysisSamples(studyId: string) {
  const [samples, setSamples] = useState<ResearchAnalysisSample[]>([]);
  const [members, setMembers] = useState<ResearchAnalysisSampleMember[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);
  const [sampleError, setSampleError] = useState("");

  async function reloadSamples() {
    if (!studyId) {
      setSamples([]);
      setMembers([]);
      setSampleError("");
      return;
    }

    setLoadingSamples(true);
    setSampleError("");

    try {
      const supabase = createClient();
      const { data: sampleRows, error: samplesError } = await supabase
        .from("research_analysis_samples")
        .select(
          "id, study_id, owner_user_id, name, description, sample_type, created_at, updated_at"
        )
        .eq("study_id", studyId)
        .order("updated_at", { ascending: false });

      if (samplesError) throw samplesError;

      const nextSamples = (sampleRows || []) as ResearchAnalysisSample[];
      setSamples(nextSamples);

      if (nextSamples.length === 0) {
        setMembers([]);
        return;
      }

      const { data: memberRows, error: membersError } = await supabase
        .from("research_analysis_sample_members")
        .select(
          "id, sample_id, participant_id, decision, reason, notes, created_at, updated_at"
        )
        .in(
          "sample_id",
          nextSamples.map((sample) => sample.id)
        );

      if (membersError) throw membersError;
      setMembers((memberRows || []) as ResearchAnalysisSampleMember[]);
    } catch (error) {
      setSamples([]);
      setMembers([]);
      setSampleError(
        error instanceof Error
          ? error.message
          : "Analysis samples could not be loaded."
      );
    } finally {
      setLoadingSamples(false);
    }
  }

  useEffect(() => {
    void reloadSamples();
  }, [studyId]);

  return {
    samples,
    members,
    loadingSamples,
    sampleError,
    reloadSamples,
  };
}

function researchFilterBundleToParticipantIds(
  bundle: ResearchDataBundle,
  participantIds: Set<string>
): ResearchDataBundle {
  const cognitiveSessions = bundle.cognitiveSessions.filter(
    (session) =>
      Boolean(session.participant_id) &&
      participantIds.has(session.participant_id as string)
  );
  const cognitiveSessionIds = new Set(
    cognitiveSessions.map((session) => session.id)
  );
  const ambulatoryCheckinIds = new Set(
    bundle.ambulatoryCheckins
      .filter((checkin) => participantIds.has(checkin.participant_id))
      .map((checkin) => checkin.id)
  );

  return {
    ...bundle,
    participants: bundle.participants.filter((participant) =>
      participantIds.has(participant.id)
    ),
    sessions: bundle.sessions.filter((session) =>
      participantIds.has(session.participant_id)
    ),
    consents: bundle.consents.filter((consent) =>
      participantIds.has(consent.participant_id)
    ),
    demographicResponses: bundle.demographicResponses.filter((response) =>
      participantIds.has(response.participant_id)
    ),
    measureSessions: bundle.measureSessions.filter((session) =>
      participantIds.has(session.participant_id)
    ),
    responses: bundle.responses.filter((response) =>
      participantIds.has(response.participant_id)
    ),
    ambulatoryPrompts: bundle.ambulatoryPrompts.filter((prompt) =>
      participantIds.has(prompt.participant_id)
    ),
    ambulatoryCheckins: bundle.ambulatoryCheckins.filter((checkin) =>
      participantIds.has(checkin.participant_id)
    ),
    ambulatoryResponses: bundle.ambulatoryResponses.filter(
      (response) =>
        participantIds.has(response.participant_id) &&
        ambulatoryCheckinIds.has(response.checkin_id)
    ),
    cognitiveSessions,
    cognitiveTrials: bundle.cognitiveTrials.filter((trial) =>
      cognitiveSessionIds.has(trial.session_id)
    ),
  };
}

const researchDatasetLabels: Record<ResearchDatasetType, string> = {
  participant_summary: "Participant summary",
  demographics: "Demographics — long format",
  questionnaire_responses: "Questionnaire responses — long format",
  participant_uploads: "Participant uploads — files & media",
  questionnaire_scores: "Questionnaire scores — long format",
  cognitive_sessions: "Cognitive task sessions",
  cognitive_trials: "Cognitive trials — raw data",
  cognitive_participant_summary: "Cognitive participant summaries",
  consent: "Consent records",
  ambulatory_checkins: "Ambulatory check-ins — one row per check-in",
  ambulatory_responses: "Ambulatory responses — one row per item response",
  ambulatory_wide: "Ambulatory check-ins — analysis wide / one row per check-in",
  ambulatory_participant_days: "Ambulatory participant-days — one row per participant per day",
  analysis_wide: "Analysis dataset — one row per participant",
};

function researchValueText(value: unknown) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function researchShortValue(value: unknown, maxLength = 90) {
  const text = researchValueText(value);

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

const researchParticipantUploadTypes = new Set([
  "file_upload",
  "image_upload",
  "audio_response",
  "video_response",
]);

type ResearchParticipantUploadMetadata = {
  storageRef: string;
  bucket: string;
  path: string;
  name: string;
  mimeType: string;
  size: number | null;
  uploadedAt: string;
};

function researchParticipantUploadMetadata(
  response: unknown
): ResearchParticipantUploadMetadata | null {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    return null;
  }

  const record = response as Record<string, unknown>;
  const storageRef =
    typeof record.storage_ref === "string" ? record.storage_ref.trim() : "";
  const bucket = typeof record.bucket === "string" ? record.bucket.trim() : "";
  const path = typeof record.path === "string" ? record.path.trim() : "";
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const mimeType =
    typeof record.mime_type === "string" ? record.mime_type.trim() : "";
  const uploadedAt =
    typeof record.uploaded_at === "string" ? record.uploaded_at.trim() : "";
  const rawSize = record.size;
  const size =
    typeof rawSize === "number" && Number.isFinite(rawSize)
      ? rawSize
      : typeof rawSize === "string" && Number.isFinite(Number(rawSize))
        ? Number(rawSize)
        : null;

  if (!storageRef || !storageRef.startsWith("storage://study-uploads/")) {
    return null;
  }

  return {
    storageRef,
    bucket,
    path,
    name: name || "Participant upload",
    mimeType,
    size,
    uploadedAt,
  };
}

function researchFormatBytes(value: unknown) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round((bytes / 1024) * 10) / 10} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  }
  return `${Math.round((bytes / (1024 * 1024 * 1024)) * 10) / 10} GB`;
}

function researchSafeVariable(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function researchCsvCell(value: unknown) {
  const text = researchValueText(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function researchRowsToCsv(rows: ResearchTableRow[]) {
  if (rows.length === 0) return "";

  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  const header = columns.map(researchCsvCell).join(",");
  const body = rows.map((row) =>
    columns.map((column) => researchCsvCell(row[column])).join(",")
  );

  return [header, ...body].join("\n");
}

function researchDownloadText(
  filename: string,
  content: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function researchFilename(value: string) {
  const safe = value
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return safe || "psylattice-study";
}

function useResearchDataWorkspace() {
  const [studies, setStudies] = useState<ResearchDataStudy[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [bundle, setBundle] = useState<ResearchDataBundle>(
    emptyResearchDataBundle
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudies() {
      setLoading(true);
      setError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Your research data could not be loaded.");
        setLoading(false);
        return;
      }

      const { data, error: studyError } = await supabase
        .from("research_studies")
        .select("id, title, status, target_sample_size, components")
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false });

      if (studyError) {
        console.error("Could not load studies for data workspace:", studyError);
        setError("Your saved studies could not be loaded.");
        setLoading(false);
        return;
      }

      const rows = (data || []) as ResearchDataStudy[];
      setStudies(rows);

      if (rows.length > 0) {
        setSelectedStudyId((current) =>
          rows.some((study) => study.id === current)
            ? current
            : rows[0].id
        );
      } else {
        setBundle(emptyResearchDataBundle);
        setLoading(false);
      }
    }

    void loadStudies();
  }, []);

  useEffect(() => {
    async function loadStudyData() {
      if (!selectedStudyId) return;

      setLoading(true);
      setError("");

      const supabase = createClient();

      const [
        participantResult,
        sessionResult,
        consentResult,
        demographicQuestionResult,
        demographicResponseResult,
        measureResult,
        measureSessionResult,
        responseResult,
        ambulatoryPromptResult,
        ambulatoryCheckinResult,
        ambulatoryResponseResult,
        cognitiveAttachmentResult,
        followupWaveResult,
        exportLogResult,
      ] = await Promise.all([
        supabase
          .from("study_participants")
          .select(
            "id, study_link_id, public_id, participant_code, is_test, status, enrolled_at, completed_at"
          )
          .eq("study_id", selectedStudyId)
          .order("enrolled_at", { ascending: false }),

        supabase
          .from("participant_sessions")
          .select(
            "id, participant_id, phase, followup_wave_id, status, is_test, started_at, last_seen_at, completed_at"
          )
          .eq("study_id", selectedStudyId)
          .order("started_at", { ascending: false }),

        supabase
          .from("participant_consents")
          .select(
            "id, participant_id, participant_session_id, consent_version_id, consented, responses, consent_snapshot, consented_at"
          )
          .eq("study_id", selectedStudyId)
          .order("consented_at", { ascending: false }),

        supabase
          .from("study_demographic_questions")
          .select(
            "id, position, field_key, label, description, question_type, required, direct_identifier, response_config, validation_config"
          )
          .eq("study_id", selectedStudyId)
          .order("position", { ascending: true }),

        supabase
          .from("participant_demographic_responses")
          .select(
            "id, participant_id, question_id, response, text_value, numeric_value, question_snapshot, answered_at"
          )
          .eq("study_id", selectedStudyId)
          .order("answered_at", { ascending: false }),

        supabase
          .from("study_measures")
          .select(
            "id, questionnaire_id, questionnaire_version_id, measurement_point, followup_wave_id, position, required"
          )
          .eq("study_id", selectedStudyId)
          .order("position", { ascending: true }),

        supabase
          .from("study_measure_sessions")
          .select(
            "id, participant_id, participant_session_id, study_measure_id, questionnaire_version_id, status, scores, started_at, completed_at"
          )
          .eq("study_id", selectedStudyId)
          .order("started_at", { ascending: false }),

        supabase
          .from("research_responses")
          .select(
            "id, measure_session_id, participant_id, study_measure_id, questionnaire_version_id, item_id, response, numeric_value, text_value, score_value, answered_at"
          )
          .eq("study_id", selectedStudyId)
          .order("answered_at", { ascending: false }),

        supabase
          .from("study_ambulatory_prompt_instances")
          .select(
            "id, participant_id, schedule_key, schedule_label, trigger_type, local_date, occurrence_index, scheduled_for, expires_at, status, notification_sent_at, opened_at, completed_at"
          )
          .eq("study_id", selectedStudyId)
          .order("scheduled_for", { ascending: false }),

        supabase
          .from("study_ambulatory_checkins")
          .select(
            "id, participant_id, prompt_instance_id, schedule_key, schedule_label, trigger_type, local_date, occurrence_index, trigger_source, started_at, completed_at"
          )
          .eq("study_id", selectedStudyId)
          .order("started_at", { ascending: false }),

        supabase
          .from("study_ambulatory_responses")
          .select(
            "id, checkin_id, participant_id, item_key, item_type, prompt_snapshot, response, numeric_value, text_value, answered_at"
          )
          .eq("study_id", selectedStudyId)
          .order("answered_at", { ascending: false }),

        supabase
          .from("study_cognitive_tasks")
          .select(
            "id, task_id, version_id, position, required, administration_mode, cognitive_tasks(title,short_title,domain), cognitive_task_versions(version_label,version_number)"
          )
          .eq("study_id", selectedStudyId)
          .order("position", { ascending: true }),

        supabase
          .from("study_followup_waves")
          .select("id, name, position, status")
          .eq("study_id", selectedStudyId)
          .order("position", { ascending: true }),

        supabase
          .from("research_export_logs")
          .select(
            "id, dataset_type, export_format, identity_mode, include_test_data, include_direct_identifiers, row_count, metadata, created_at"
          )
          .eq("study_id", selectedStudyId)
          .order("created_at", { ascending: false })
          .limit(25),
      ]);

      const requiredResults = [
        participantResult,
        sessionResult,
        consentResult,
        demographicQuestionResult,
        demographicResponseResult,
        measureResult,
        measureSessionResult,
        responseResult,
        ambulatoryPromptResult,
        ambulatoryCheckinResult,
        ambulatoryResponseResult,
        cognitiveAttachmentResult,
        followupWaveResult,
      ];

      const requiredError = requiredResults.find((result) => result.error);

      if (requiredError?.error) {
        console.error(
          "Could not load research data workspace:",
          requiredError.error
        );
        setError(
          "Some study data could not be loaded. Confirm that the participant and demographics migrations have been run."
        );
        setLoading(false);
        return;
      }

      if (exportLogResult.error) {
        console.error(
          "Could not load research export history:",
          exportLogResult.error
        );
      }

      const measureRows = (measureResult.data || []) as ResearchDataMeasure[];
      const questionnaireIds = Array.from(
        new Set(measureRows.map((measure) => measure.questionnaire_id))
      );
      const versionIds = Array.from(
        new Set(measureRows.map((measure) => measure.questionnaire_version_id))
      );

      let questionnaires: ResearchDataQuestionnaire[] = [];
      let questionnaireVersions: ResearchDataQuestionnaireVersion[] = [];
      let questionnaireItems: ResearchDataQuestionnaireItem[] = [];

      if (questionnaireIds.length > 0) {
        const { data, error: questionnaireError } = await supabase
          .from("questionnaires")
          .select("id, name, acronym, category")
          .in("id", questionnaireIds);

        if (questionnaireError) {
          console.error(
            "Could not load questionnaire metadata:",
            questionnaireError
          );
        } else {
          questionnaires = (data || []) as ResearchDataQuestionnaire[];
        }
      }

      if (versionIds.length > 0) {
        const [versionResult, itemResult] = await Promise.all([
          supabase
            .from("questionnaire_versions")
            .select("id, questionnaire_id, version_label")
            .in("id", versionIds),

          supabase
            .from("questionnaire_items")
            .select(
              "id, version_id, item_key, position, prompt, subscale, reverse_scored, response_type, required, response_options, response_config, validation_config, scoring_config, display_logic, randomization_config, is_content_only"
            )
            .in("version_id", versionIds)
            .order("position", { ascending: true }),
        ]);

        if (versionResult.error) {
          console.error(
            "Could not load questionnaire versions:",
            versionResult.error
          );
        } else {
          questionnaireVersions =
            (versionResult.data || []) as ResearchDataQuestionnaireVersion[];
        }

        if (itemResult.error) {
          console.error("Could not load questionnaire items:", itemResult.error);
        } else {
          questionnaireItems =
            (itemResult.data || []) as ResearchDataQuestionnaireItem[];
        }
      }

      const cognitiveAttachments: ResearchDataCognitiveAttachment[] =
        (cognitiveAttachmentResult.data || []).map((row: any) => ({
          id: String(row.id),
          task_id: String(row.task_id),
          version_id: String(row.version_id),
          position: Number(row.position || 0),
          required: Boolean(row.required),
          administration_mode: String(row.administration_mode || "once"),
          title: String(row.cognitive_tasks?.title || "Cognitive task"),
          short_title: row.cognitive_tasks?.short_title || null,
          domain: String(row.cognitive_tasks?.domain || "general"),
          version_label: String(row.cognitive_task_versions?.version_label || "Published version"),
          version_number: Number(row.cognitive_task_versions?.version_number || 1),
        }));

      let cognitiveSessions: ResearchDataCognitiveSession[] = [];
      let cognitiveTrials: ResearchDataCognitiveTrial[] = [];

      const cognitiveAttachmentIds = cognitiveAttachments.map((item) => item.id);
      if (cognitiveAttachmentIds.length > 0) {
        const { data: sessionData, error: cognitiveSessionError } = await supabase
          .from("cognitive_task_sessions")
          .select(
            "id, task_id, version_id, study_cognitive_task_id, participant_id, participant_session_id, session_mode, status, device_info, timing_quality, summary_scores, started_at, completed_at, created_at"
          )
          .in("study_cognitive_task_id", cognitiveAttachmentIds)
          .eq("session_mode", "study")
          .order("created_at", { ascending: false });

        if (cognitiveSessionError) {
          console.error("Could not load study cognitive sessions:", cognitiveSessionError);
          setError("Some cognitive-task study data could not be loaded.");
          setLoading(false);
          return;
        }

        cognitiveSessions = (sessionData || []) as ResearchDataCognitiveSession[];
        const cognitiveSessionIds = cognitiveSessions.map((session) => session.id);

        if (cognitiveSessionIds.length > 0) {
          const { data: trialData, error: cognitiveTrialError } = await supabase
            .from("cognitive_trial_results")
            .select(
              "id, session_id, block_key, trial_index, condition_label, stimulus_payload, response_payload, correct, reaction_time_ms, timing, created_at"
            )
            .in("session_id", cognitiveSessionIds)
            .order("trial_index", { ascending: true });

          if (cognitiveTrialError) {
            console.error("Could not load cognitive trial data:", cognitiveTrialError);
            setError("Some cognitive-task trial data could not be loaded.");
            setLoading(false);
            return;
          }

          cognitiveTrials = (trialData || []) as ResearchDataCognitiveTrial[];
        }
      }

      setBundle({
        participants:
          (participantResult.data || []) as ResearchDataParticipant[],
        sessions: (sessionResult.data || []) as ResearchDataSession[],
        consents: (consentResult.data || []) as ResearchDataConsent[],
        demographicQuestions:
          (demographicQuestionResult.data ||
            []) as ResearchDataDemographicQuestion[],
        demographicResponses:
          (demographicResponseResult.data ||
            []) as ResearchDataDemographicResponse[],
        measures: measureRows,
        measureSessions:
          (measureSessionResult.data || []) as ResearchDataMeasureSession[],
        responses: (responseResult.data || []) as ResearchDataResponse[],
        questionnaires,
        questionnaireVersions,
        questionnaireItems,
        ambulatoryPrompts:
          (ambulatoryPromptResult.data || []) as ResearchDataAmbulatoryPrompt[],
        ambulatoryCheckins:
          (ambulatoryCheckinResult.data || []) as ResearchDataAmbulatoryCheckin[],
        ambulatoryResponses:
          (ambulatoryResponseResult.data || []) as ResearchDataAmbulatoryResponse[],
        cognitiveAttachments,
        cognitiveSessions,
        cognitiveTrials,
        followupWaves:
          (followupWaveResult.data || []) as ResearchDataFollowupWave[],
        exportLogs: exportLogResult.error
          ? []
          : ((exportLogResult.data || []) as ResearchDataExportLog[]),
      });

      setLoading(false);
    }

    void loadStudyData();
  }, [selectedStudyId]);

  const selectedStudy =
    studies.find((study) => study.id === selectedStudyId) || null;

  return {
    studies,
    selectedStudyId,
    setSelectedStudyId,
    selectedStudy,
    bundle,
    setBundle,
    loading,
    error,
  };
}

function researchFollowupWaveForMeasure(
  bundle: ResearchDataBundle,
  measure: ResearchDataMeasure | undefined
) {
  if (!measure?.followup_wave_id) return null;

  return (
    bundle.followupWaves.find(
      (wave) => wave.id === measure.followup_wave_id
    ) || null
  );
}

function researchMeasurePhaseDisplay(
  bundle: ResearchDataBundle,
  measure: ResearchDataMeasure
) {
  if (
    measure.measurement_point !== "followup" ||
    !measure.followup_wave_id
  ) {
    return measure.measurement_point;
  }

  const wave = researchFollowupWaveForMeasure(
    bundle,
    measure
  );

  return wave
    ? `Follow-up ${wave.position}: ${wave.name}`
    : "Follow-up";
}

function researchMeasurePhaseVariable(
  bundle: ResearchDataBundle,
  measure: ResearchDataMeasure
) {
  if (
    measure.measurement_point !== "followup" ||
    !measure.followup_wave_id
  ) {
    return researchSafeVariable(
      measure.measurement_point
    );
  }

  const wave = researchFollowupWaveForMeasure(
    bundle,
    measure
  );

  if (!wave) {
    return `followup_${researchSafeVariable(
      measure.followup_wave_id.slice(0, 8)
    )}`;
  }

  return `followup_${wave.position}_${researchSafeVariable(
    wave.name
  )}`;
}

function researchQuestionnaireForMeasure(
  bundle: ResearchDataBundle,
  measure: ResearchDataMeasure | undefined
) {
  if (!measure) return null;

  return (
    bundle.questionnaires.find(
      (questionnaire) => questionnaire.id === measure.questionnaire_id
    ) || null
  );
}


function researchCognitiveAttachmentForId(
  bundle: ResearchDataBundle,
  id: string | null | undefined
) {
  if (!id) return null;
  return bundle.cognitiveAttachments.find((item) => item.id === id) || null;
}

function researchCognitiveSessionForTrial(
  bundle: ResearchDataBundle,
  trial: ResearchDataCognitiveTrial
) {
  return bundle.cognitiveSessions.find((session) => session.id === trial.session_id) || null;
}

function researchNumber(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function researchMedian(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function researchMean(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function researchCognitiveParticipantSummary(
  bundle: ResearchDataBundle,
  participantId: string,
  attachmentId: string
) {
  const session = [...bundle.cognitiveSessions]
    .filter(
      (candidate) =>
        candidate.participant_id === participantId &&
        candidate.study_cognitive_task_id === attachmentId &&
        candidate.session_mode === "study"
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;

  if (!session) {
    return { session: null, trials: [] as ResearchDataCognitiveTrial[], accuracy: null, meanRt: null, medianRt: null, omissions: 0 };
  }

  const trials = bundle.cognitiveTrials.filter((trial) => trial.session_id === session.id);
  const scorable = trials.filter((trial) => trial.correct !== null);
  const correct = scorable.filter((trial) => trial.correct === true).length;
  const rts = trials
    .map((trial) => researchNumber(trial.reaction_time_ms))
    .filter((value): value is number => value !== null);
  const omissions = trials.filter((trial) => {
    const response = trial.response_payload?.response;
    return response === null || response === undefined || response === "";
  }).length;

  return {
    session,
    trials,
    accuracy: scorable.length > 0 ? correct / scorable.length : null,
    meanRt: researchMean(rts),
    medianRt: researchMedian(rts),
    omissions,
  };
}

function researchCognitiveAnalysisVariables(attachment: ResearchDataCognitiveAttachment) {
  const base = researchStatVariable("cog", attachment.position, attachment.short_title || attachment.title);
  return {
    completed: `${base}_completed`,
    accuracy: `${base}_accuracy`,
    meanRt: `${base}_mean_rt_ms`,
    medianRt: `${base}_median_rt_ms`,
    omissions: `${base}_omissions`,
  };
}


type ResearchQuestionnaireScoreField = {
  source: string;
  label: string;
  measureId: string;
  scoreName: string;
  questionnaireName: string;
  phaseLabel: string;
};

function researchQuestionnaireScoreFields(
  bundle: ResearchDataBundle
): ResearchQuestionnaireScoreField[] {
  const fields: ResearchQuestionnaireScoreField[] = [];
  const seen = new Set<string>();
  const measures = [...bundle.measures].sort((a, b) => {
    const aWave =
      a.measurement_point === "baseline"
        ? 0
        : researchFollowupWaveForMeasure(bundle, a)?.position ?? 999;
    const bWave =
      b.measurement_point === "baseline"
        ? 0
        : researchFollowupWaveForMeasure(bundle, b)?.position ?? 999;
    if (aWave !== bWave) return aWave - bWave;
    return a.position - b.position;
  });

  for (const measure of measures) {
    const questionnaire = researchQuestionnaireForMeasure(bundle, measure);
    if (!questionnaire) continue;

    const scoreNames = new Set<string>();
    for (const session of bundle.measureSessions) {
      if (session.study_measure_id !== measure.id) continue;
      if (!session.scores || typeof session.scores !== "object") continue;
      Object.keys(session.scores).forEach((name) => scoreNames.add(name));
    }

    for (const scoreName of scoreNames) {
      const source = researchStatVariable(
        "score",
        researchMeasurePhaseVariable(bundle, measure),
        measure.position,
        questionnaire.acronym || questionnaire.name,
        scoreName
      );
      if (seen.has(source)) continue;
      seen.add(source);
      const phaseLabel = researchMeasurePhaseDisplay(bundle, measure);
      fields.push({
        source,
        label: `${phaseLabel} - ${questionnaire.name} - ${scoreName}`,
        measureId: measure.id,
        scoreName,
        questionnaireName: questionnaire.name,
        phaseLabel,
      });
    }
  }

  return fields;
}

type ResearchParticipantSummaryQuestionnaireField = {
  source: string;
  label: string;
  measureId: string;
  itemId: string;
  itemPosition: number;
  responseType: string;
  questionnaireName: string;
  phaseLabel: string;
  groupLabel: string;
  prompt: string;
};

type ResearchAnalysisQuestionnaireField = {
  source: string;
  label: string;
  measureId: string;
  itemId: string;
  itemKey: string;
  itemPosition: number;
  responseType: string;
  questionnaireName: string;
  phaseLabel: string;
  groupLabel: string;
  prompt: string;
  required: boolean;
  reverseScored: boolean;
  kind:
    | "scalar"
    | "multi_binary"
    | "object_option_value"
    | "object_row_value"
    | "matrix_binary"
    | "pairwise_choice"
    | "best_worst"
    | "raw_json";
  optionValue?: string;
  optionLabel?: string;
  rowKey?: string;
  pairKey?: string;
  component?: string;
  valueLabels?: string;
};

function researchStatVariable(...parts: Array<string | number | null | undefined>) {
  const joined = parts
    .map((part) => researchSafeVariable(String(part ?? "")))
    .filter(Boolean)
    .join("_") || "variable";

  const withPrefix = /^[a-z]/.test(joined) ? joined : `v_${joined}`;

  if (withPrefix.length <= 60) {
    return withPrefix;
  }

  let hash = 2166136261;
  for (let index = 0; index < withPrefix.length; index += 1) {
    hash ^= withPrefix.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const suffix = (hash >>> 0).toString(36).slice(0, 7);
  return `${withPrefix.slice(0, Math.max(1, 52 - suffix.length))}_${suffix}`;
}

function researchResponseOptions(item: ResearchDataQuestionnaireItem) {
  if (!Array.isArray(item.response_options)) return [];

  return item.response_options
    .filter((option) => option && typeof option === "object")
    .map((option) => option as Record<string, unknown>);
}

function researchOptionLabel(
  item: ResearchDataQuestionnaireItem,
  value: unknown
) {
  const match = researchResponseOptions(item).find(
    (option) => String(option.value ?? "") === String(value ?? "")
  );

  return typeof match?.label === "string" && match.label.trim()
    ? match.label
    : value;
}

function researchValueLabels(item: ResearchDataQuestionnaireItem) {
  return researchResponseOptions(item)
    .map((option) => `${String(option.value ?? "")}=${String(option.label ?? "")}`)
    .join(" | ");
}

function researchObjectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function researchAnalysisMeasurementType(
  item: ResearchDataQuestionnaireItem,
  field?: ResearchAnalysisQuestionnaireField
) {
  if (field?.kind === "multi_binary" || field?.kind === "matrix_binary") {
    return "Binary numeric (0/1)";
  }

  if (
    [
      "numeric_rating",
      "slider",
      "visual_analogue",
      "star_rating",
      "integer",
      "decimal",
      "percentage",
      "duration",
      "constant_sum",
    ].includes(item.response_type)
  ) {
    return "Numeric";
  }

  if (
    [
      "likert",
      "frequency",
      "intensity",
      "semantic_differential",
      "ranking",
      "q_sort",
    ].includes(item.response_type)
  ) {
    return "Ordinal / coded";
  }

  if (
    [
      "yes_no",
      "true_false",
      "single_choice",
      "dropdown",
      "image_choice",
      "forced_choice",
      "guttman",
      "thurstone",
      "best_worst",
      "pairwise",
      "single_choice_matrix",
      "likert_matrix",
      "semantic_matrix",
    ].includes(item.response_type)
  ) {
    return "Categorical / coded";
  }

  if (["date", "time", "datetime"].includes(item.response_type)) {
    return "Date/time text";
  }

  if (["short_text", "long_text", "email", "phone", "location"].includes(item.response_type)) {
    return "Text";
  }

  return "Mixed / structured";
}

function researchAnalysisQuestionnaireFields(
  bundle: ResearchDataBundle
): ResearchAnalysisQuestionnaireField[] {
  const measures = [...bundle.measures].sort((a, b) => {
    const aWave =
      a.measurement_point === "baseline"
        ? 0
        : researchFollowupWaveForMeasure(bundle, a)?.position ?? 999;
    const bWave =
      b.measurement_point === "baseline"
        ? 0
        : researchFollowupWaveForMeasure(bundle, b)?.position ?? 999;

    if (aWave !== bWave) return aWave - bWave;
    return a.position - b.position;
  });

  const questionnaireUseCount = new Map<string, number>();
  for (const measure of measures) {
    questionnaireUseCount.set(
      measure.questionnaire_id,
      (questionnaireUseCount.get(measure.questionnaire_id) || 0) + 1
    );
  }

  const fields: ResearchAnalysisQuestionnaireField[] = [];

  for (const measure of measures) {
    const questionnaire = researchQuestionnaireForMeasure(bundle, measure);
    if (!questionnaire) continue;

    const phaseLabel = researchMeasurePhaseDisplay(bundle, measure);
    const repeatedQuestionnaire =
      (questionnaireUseCount.get(questionnaire.id) || 0) > 1;
    const followupWave = researchFollowupWaveForMeasure(bundle, measure);
    const groupLabel =
      measure.measurement_point === "followup"
        ? `${followupWave ? `Follow-up ${followupWave.position}` : "Follow-up"} - ${questionnaire.name}`
        : repeatedQuestionnaire
          ? `${phaseLabel} - ${questionnaire.name}`
          : questionnaire.name;

    const phaseVariable = researchMeasurePhaseVariable(bundle, measure);
    const questionnaireKey = questionnaire.acronym || questionnaire.name;

    const items = bundle.questionnaireItems
      .filter(
        (item) =>
          item.version_id === measure.questionnaire_version_id &&
          !item.is_content_only
      )
      .sort((a, b) => a.position - b.position);

    for (const item of items) {
      const itemKey = item.item_key || `item_${item.position}`;
      const options = researchResponseOptions(item);
      const optionLabels = researchValueLabels(item);
      const base = [
        "q",
        phaseVariable,
        measure.position,
        questionnaireKey,
        itemKey,
      ];

      const baseField = {
        measureId: measure.id,
        itemId: item.id,
        itemKey,
        itemPosition: item.position,
        responseType: item.response_type,
        questionnaireName: questionnaire.name,
        phaseLabel,
        groupLabel,
        prompt: item.prompt,
        required: item.required,
        reverseScored: Boolean(item.reverse_scored),
        valueLabels: optionLabels,
      };

      if (["multiple_choice", "checklist"].includes(item.response_type) && options.length > 0) {
        for (const option of options) {
          const optionValue = String(option.value ?? "");
          const optionLabel = String(option.label ?? optionValue);
          fields.push({
            ...baseField,
            source: researchStatVariable(...base, "selected", optionLabel || optionValue),
            label: `${groupLabel} - ${itemKey} - ${optionLabel}`,
            kind: "multi_binary",
            optionValue,
            optionLabel,
            component: `Selected: ${optionLabel}`,
          });
        }
        continue;
      }

      if (["ranking", "q_sort", "constant_sum"].includes(item.response_type) && options.length > 0) {
        for (const option of options) {
          const optionValue = String(option.value ?? "");
          const optionLabel = String(option.label ?? optionValue);
          fields.push({
            ...baseField,
            source: researchStatVariable(...base, optionLabel || optionValue),
            label: `${groupLabel} - ${itemKey} - ${optionLabel}`,
            kind: "object_option_value",
            optionValue,
            optionLabel,
            component: optionLabel,
          });
        }
        continue;
      }

      if (item.response_type === "best_worst") {
        for (const component of ["best", "worst"] as const) {
          fields.push({
            ...baseField,
            source: researchStatVariable(...base, component),
            label: `${groupLabel} - ${itemKey} - ${component === "best" ? "Most / best" : "Least / worst"}`,
            kind: "best_worst",
            component,
          });
        }
        continue;
      }

      if (item.response_type === "pairwise" && options.length >= 2) {
        for (let a = 0; a < options.length; a += 1) {
          for (let b = a + 1; b < options.length; b += 1) {
            const left = String(options[a].label ?? options[a].value ?? `Option ${a + 1}`);
            const right = String(options[b].label ?? options[b].value ?? `Option ${b + 1}`);
            const pairKey = `${a}-${b}`;
            fields.push({
              ...baseField,
              source: researchStatVariable(...base, "pair", a + 1, b + 1),
              label: `${groupLabel} - ${itemKey} - ${left} vs ${right}`,
              kind: "pairwise_choice",
              pairKey,
              component: `${left} vs ${right}`,
            });
          }
        }
        continue;
      }

      if (["likert_matrix", "single_choice_matrix", "semantic_matrix", "multiple_choice_matrix"].includes(item.response_type)) {
        const rows = Array.isArray(item.response_config?.matrix_rows)
          ? (item.response_config.matrix_rows as unknown[]).map(String)
          : [];

        if (item.response_type === "multiple_choice_matrix" && options.length > 0) {
          for (const rowKey of rows) {
            for (const option of options) {
              const optionValue = String(option.value ?? "");
              const optionLabel = String(option.label ?? optionValue);
              fields.push({
                ...baseField,
                source: researchStatVariable(...base, rowKey, optionLabel || optionValue),
                label: `${groupLabel} - ${itemKey} - ${rowKey} - ${optionLabel}`,
                kind: "matrix_binary",
                rowKey,
                optionValue,
                optionLabel,
                component: `${rowKey} / ${optionLabel}`,
              });
            }
          }
        } else {
          for (const rowKey of rows) {
            fields.push({
              ...baseField,
              source: researchStatVariable(...base, rowKey),
              label: `${groupLabel} - ${itemKey} - ${rowKey}`,
              kind: "object_row_value",
              rowKey,
              component: rowKey,
            });
          }
        }

        if (rows.length > 0) continue;
      }

      const structuredFallback = [
        "custom",
        "file_upload",
        "image_upload",
        "audio_response",
        "video_response",
      ].includes(item.response_type);

      fields.push({
        ...baseField,
        source: researchStatVariable(...base),
        label: `${groupLabel} - ${itemKey}`,
        kind: structuredFallback ? "raw_json" : "scalar",
        component: structuredFallback ? "Raw structured response" : "Response",
      });
    }
  }

  return fields;
}

function researchAnalysisFieldValue(
  field: ResearchAnalysisQuestionnaireField,
  item: ResearchDataQuestionnaireItem,
  response: ResearchDataResponse
) {
  const raw = response.response;

  if (field.kind === "multi_binary") {
    if (!Array.isArray(raw)) return "";
    return raw.map(String).includes(String(field.optionValue ?? "")) ? 1 : 0;
  }

  const objectValue = researchObjectValue(raw);

  if (field.kind === "object_option_value") {
    return objectValue ? objectValue[String(field.optionValue ?? "")] ?? "" : "";
  }

  if (field.kind === "object_row_value") {
    return objectValue ? objectValue[String(field.rowKey ?? "")] ?? "" : "";
  }

  if (field.kind === "matrix_binary") {
    if (!objectValue) return "";
    const row = objectValue[String(field.rowKey ?? "")];
    if (!Array.isArray(row)) return "";
    return row.map(String).includes(String(field.optionValue ?? "")) ? 1 : 0;
  }

  if (field.kind === "pairwise_choice") {
    return objectValue ? objectValue[String(field.pairKey ?? "")] ?? "" : "";
  }

  if (field.kind === "best_worst") {
    return objectValue ? objectValue[String(field.component ?? "")] ?? "" : "";
  }

  if (field.kind === "raw_json") {
    return researchValueText(raw);
  }

  if (response.numeric_value !== null && response.numeric_value !== undefined) {
    return response.numeric_value;
  }

  if (response.text_value !== null && response.text_value !== undefined && response.text_value !== "") {
    return response.text_value;
  }

  if (raw !== null && raw !== undefined && typeof raw !== "object") {
    return raw;
  }

  if (Array.isArray(raw)) {
    return raw.map((value) => researchOptionLabel(item, value)).join(" | ");
  }

  return raw === null || raw === undefined ? "" : researchValueText(raw);
}

function researchParticipantSummaryQuestionnaireFields(
  bundle: ResearchDataBundle
): ResearchParticipantSummaryQuestionnaireField[] {
  const measures = [...bundle.measures].sort((a, b) => {
    const aWave =
      a.measurement_point === "baseline"
        ? 0
        : researchFollowupWaveForMeasure(bundle, a)?.position ?? 999;
    const bWave =
      b.measurement_point === "baseline"
        ? 0
        : researchFollowupWaveForMeasure(bundle, b)?.position ?? 999;

    if (aWave !== bWave) {
      return aWave - bWave;
    }

    return a.position - b.position;
  });

  const questionnaireUseCount = new Map<string, number>();

  for (const measure of measures) {
    questionnaireUseCount.set(
      measure.questionnaire_id,
      (questionnaireUseCount.get(measure.questionnaire_id) || 0) + 1
    );
  }

  const fields: ResearchParticipantSummaryQuestionnaireField[] = [];

  for (const measure of measures) {
    const questionnaire = researchQuestionnaireForMeasure(
      bundle,
      measure
    );

    if (!questionnaire) {
      continue;
    }

    const phaseLabel = researchMeasurePhaseDisplay(
      bundle,
      measure
    );

    const repeatedQuestionnaire =
      (questionnaireUseCount.get(questionnaire.id) || 0) > 1;

    const followupWave =
      researchFollowupWaveForMeasure(
        bundle,
        measure
      );

    // Baseline:
    //   General Self-Efficacy Scale - 1
    //
    // Follow-up:
    //   Follow-up 1 - General Self-Efficacy Scale - 1
    //   Follow-up 2 - General Self-Efficacy Scale - 1
    //
    // This makes follow-up columns immediately identifiable even when the
    // questionnaire is used only once in the whole study.
    const labelPrefix =
      measure.measurement_point === "followup"
        ? `${
            followupWave
              ? `Follow-up ${followupWave.position}`
              : "Follow-up"
          } - ${questionnaire.name}`
        : repeatedQuestionnaire
          ? `${phaseLabel} - ${questionnaire.name}`
          : questionnaire.name;

    const questionnaireKey = researchSafeVariable(
      questionnaire.acronym || questionnaire.name
    );

    const items = bundle.questionnaireItems
      .filter(
        (item) =>
          item.version_id ===
          measure.questionnaire_version_id
      )
      .sort((a, b) => a.position - b.position);

    for (const item of items) {
      fields.push({
        source: `questionnaire_${researchMeasurePhaseVariable(
          bundle,
          measure
        )}_${measure.position}_${questionnaireKey}_${item.position}`,
        label: `${labelPrefix} - ${item.position}`,
        measureId: measure.id,
        itemId: item.id,
        itemPosition: item.position,
        responseType: item.response_type,
        questionnaireName: questionnaire.name,
        phaseLabel,
        groupLabel: labelPrefix,
        prompt: item.prompt,
      });
    }
  }

  return fields;
}

function researchParticipantSummaryResponseValue(
  item: ResearchDataQuestionnaireItem,
  response: ResearchDataResponse
) {
  const raw = response.response;

  // For choice-based questions, prefer the human-readable option label in
  // participant-summary exports while preserving raw/numeric values in the
  // dedicated long-format response dataset.
  if (Array.isArray(item.response_options)) {
    const options = item.response_options as Array<
      Record<string, unknown>
    >;

    const labelForValue = (value: unknown) => {
      const option = options.find(
        (candidate) =>
          String(candidate.value ?? "") === String(value ?? "")
      );

      if (
        option &&
        typeof option.label === "string" &&
        option.label.trim()
      ) {
        return option.label;
      }

      return value;
    };

    if (Array.isArray(raw)) {
      return raw.map(labelForValue).join(", ");
    }

    if (
      raw !== null &&
      raw !== undefined &&
      typeof raw !== "object"
    ) {
      return labelForValue(raw);
    }
  }

  if (
    response.text_value !== null &&
    response.text_value !== undefined &&
    response.text_value !== ""
  ) {
    return response.text_value;
  }

  if (raw !== null && raw !== undefined) {
    return raw;
  }

  if (response.numeric_value !== null) {
    return response.numeric_value;
  }

  return "";
}

function researchItemForResponse(
  bundle: ResearchDataBundle,
  response: ResearchDataResponse
) {
  return (
    bundle.questionnaireItems.find((item) => item.id === response.item_id) ||
    null
  );
}

function researchMeasureForId(
  bundle: ResearchDataBundle,
  studyMeasureId: string
) {
  return (
    bundle.measures.find((measure) => measure.id === studyMeasureId) || null
  );
}

function researchParticipantForId(
  bundle: ResearchDataBundle,
  participantId: string
) {
  return (
    bundle.participants.find(
      (participant) => participant.id === participantId
    ) || null
  );
}

function researchParticipantLabelMap(
  participants: ResearchDataParticipant[],
  identityMode: ResearchIdentityMode
) {
  const map = new Map<string, string>();

  participants.forEach((participant, index) => {
    map.set(
      participant.id,
      identityMode === "pseudonymous"
        ? participant.public_id
        : `ANON-${String(index + 1).padStart(4, "0")}`
    );
  });

  return map;
}

function researchFilteredParticipants(
  bundle: ResearchDataBundle,
  includeTestData: boolean
) {
  return bundle.participants.filter(
    (participant) =>
      participant.status !== "withdrawn" &&
      (includeTestData || !participant.is_test)
  );
}

type ResearchAmbulatoryWideField = {
  variable: string;
  itemKey: string;
  itemType: string;
  prompt: string;
  kind: "scalar" | "binary" | "object" | "nested";
  component?: string;
  responsePath?: string[];
};

function researchAmbulatoryWideFields(
  bundle: ResearchDataBundle
): ResearchAmbulatoryWideField[] {
  const fields = new Map<string, ResearchAmbulatoryWideField>();

  const add = (field: ResearchAmbulatoryWideField) => {
    if (!fields.has(field.variable)) {
      fields.set(field.variable, field);
    }
  };

  for (const response of bundle.ambulatoryResponses) {
    const itemKey = response.item_key || "item";
    const itemType = response.item_type || "unknown";
    const prompt = response.prompt_snapshot || itemKey;
    const base = `ema_${researchSafeVariable(itemKey) || "item"}`;
    const raw = response.response;

    if (Array.isArray(raw)) {
      const values = raw
        .filter((value) =>
          ["string", "number", "boolean"].includes(typeof value)
        )
        .map((value) => String(value));

      for (const value of values) {
        add({
          variable: `${base}__${researchSafeVariable(value) || "selected"}`,
          itemKey,
          itemType,
          prompt,
          kind: "binary",
          component: value,
        });
      }

      if (values.length === 0) {
        add({
          variable: base,
          itemKey,
          itemType,
          prompt,
          kind: "object",
        });
      }

      continue;
    }

    if (raw && typeof raw === "object") {
      const object = raw as Record<string, unknown>;
      const answers =
        object.answers &&
        typeof object.answers === "object" &&
        !Array.isArray(object.answers)
          ? (object.answers as Record<string, unknown>)
          : null;

      if (answers) {
        for (const [answerKey, answerValue] of Object.entries(answers)) {
          if (Array.isArray(answerValue)) {
            const observed = answerValue
              .filter((value) =>
                ["string", "number", "boolean"].includes(typeof value)
              )
              .map((value) => String(value));

            if (observed.length > 0) {
              for (const value of observed) {
                add({
                  variable: `${base}__q_${researchSafeVariable(answerKey)}__${researchSafeVariable(value) || "selected"}`,
                  itemKey,
                  itemType,
                  prompt,
                  kind: "binary",
                  component: `Embedded questionnaire ${answerKey}: ${value}`,
                  responsePath: ["answers", answerKey],
                });
              }
            } else {
              add({
                variable: `${base}__q_${researchSafeVariable(answerKey)}`,
                itemKey,
                itemType,
                prompt,
                kind: "nested",
                component: `Embedded questionnaire ${answerKey}`,
                responsePath: ["answers", answerKey],
              });
            }
          } else {
            add({
              variable: `${base}__q_${researchSafeVariable(answerKey)}`,
              itemKey,
              itemType,
              prompt,
              kind: "nested",
              component: `Embedded questionnaire ${answerKey}`,
              responsePath: ["answers", answerKey],
            });
          }
        }

        add({
          variable: `${base}__completed`,
          itemKey,
          itemType,
          prompt,
          kind: "nested",
          component: "Embedded questionnaire completed",
          responsePath: ["completed"],
        });
        continue;
      }

      const entries = Object.entries(object);
      if (entries.length > 0) {
        for (const [key] of entries) {
          add({
            variable: `${base}__${researchSafeVariable(key) || "value"}`,
            itemKey,
            itemType,
            prompt,
            kind: "nested",
            component: key,
            responsePath: [key],
          });
        }
      } else {
        add({
          variable: base,
          itemKey,
          itemType,
          prompt,
          kind: "object",
        });
      }
      continue;
    }

    add({
      variable: base,
      itemKey,
      itemType,
      prompt,
      kind: "scalar",
    });
  }

  return Array.from(fields.values()).sort((a, b) =>
    a.variable.localeCompare(b.variable)
  );
}

function researchReadPath(value: unknown, path: string[] | undefined) {
  let current = value;
  for (const part of path || []) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function researchAmbulatoryWideValue(
  field: ResearchAmbulatoryWideField,
  response: ResearchDataAmbulatoryResponse
) {
  const raw = response.response;

  if (field.kind === "binary") {
    const value = researchReadPath(raw, field.responsePath);
    if (field.responsePath && value === undefined) return "";
    const source = field.responsePath ? value : raw;
    if (!Array.isArray(source)) return "";
    const selected = source.map(String);
    const component = field.component || "";
    const expected = component.includes(": ")
      ? component.split(": ").slice(-1)[0]
      : component;
    return selected.includes(expected) ? 1 : 0;
  }

  if (field.kind === "nested") {
    const value = researchReadPath(raw, field.responsePath);
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return researchValueText(value);
    return value;
  }

  if (field.kind === "object") {
    return researchValueText(raw);
  }

  if (response.numeric_value !== null) return response.numeric_value;
  if (response.text_value !== null && response.text_value !== "") {
    return response.text_value;
  }
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "object") return researchValueText(raw);
  return raw;
}

function researchBuildRows(
  bundle: ResearchDataBundle,
  datasetType: ResearchDatasetType,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean,
  includeDirectIdentifiers: boolean
): ResearchTableRow[] {
  const participants = researchFilteredParticipants(
    bundle,
    includeTestData
  );
  const participantIds = new Set(
    participants.map((participant) => participant.id)
  );
  const identityMap = researchParticipantLabelMap(
    participants,
    identityMode
  );

  const participantBase = (participant: ResearchDataParticipant) => ({
    participant:
      identityMap.get(participant.id) || "",
    is_test: participant.is_test,
    status: participant.status,
    enrolled_at: participant.enrolled_at,
    completed_at: participant.completed_at || "",
  });

  if (datasetType === "participant_summary") {
    const questionnaireFields =
      researchParticipantSummaryQuestionnaireFields(bundle);

    return participants.map((participant) => {
      const sessions = bundle.sessions.filter(
        (session) => session.participant_id === participant.id
      );
      const consent = bundle.consents.find(
        (record) => record.participant_id === participant.id
      );
      const completedMeasures = bundle.measureSessions.filter(
        (session) =>
          session.participant_id === participant.id &&
          session.status === "completed"
      );
      const responses = bundle.responses.filter(
        (response) => response.participant_id === participant.id
      );
      const demographics = bundle.demographicResponses.filter(
        (response) => response.participant_id === participant.id
      );
      const completedCognitive = bundle.cognitiveSessions.filter(
        (session) =>
          session.participant_id === participant.id &&
          session.session_mode === "study" &&
          session.status === "completed"
      );

      const row: ResearchTableRow = {
        ...participantBase(participant),
        participant_code:
          identityMode === "pseudonymous" && includeDirectIdentifiers
            ? participant.participant_code || ""
            : "",
        consented: consent?.consented ?? false,
        session_count: sessions.length,
        completed_questionnaires: completedMeasures.length,
        completed_cognitive_tasks: completedCognitive.length,
      };

      // Every configured questionnaire item becomes its own participant-level
      // export field, even when this participant has no response yet.
      for (const field of questionnaireFields) {
        row[field.source] = "";
      }

      for (const response of responses) {
        const field = questionnaireFields.find(
          (candidate) =>
            candidate.measureId === response.study_measure_id &&
            candidate.itemId === response.item_id
        );

        if (!field) {
          continue;
        }

        const item = bundle.questionnaireItems.find(
          (candidate) => candidate.id === response.item_id
        );

        if (!item) {
          continue;
        }

        row[field.source] =
          researchParticipantSummaryResponseValue(
            item,
            response
          );
      }

      row.demographic_responses = demographics.length;

      return row;
    });
  }

  if (datasetType === "demographics") {
    return bundle.demographicResponses
      .filter((response) => participantIds.has(response.participant_id))
      .flatMap((response) => {
        const participant = researchParticipantForId(
          bundle,
          response.participant_id
        );
        const question = bundle.demographicQuestions.find(
          (candidate) => candidate.id === response.question_id
        );

        if (!participant || !question) return [];

        if (question.direct_identifier && !includeDirectIdentifiers) {
          return [];
        }

        return [
          {
            participant: identityMap.get(participant.id) || "",
            is_test: participant.is_test,
            variable: question.field_key,
            question: question.label,
            question_type: question.question_type,
            required: question.required,
            direct_identifier: question.direct_identifier,
            response:
              response.text_value ??
              response.numeric_value ??
              response.response,
            answered_at: response.answered_at,
          },
        ];
      });
  }

  if (datasetType === "questionnaire_responses") {
    return bundle.responses
      .filter((response) => participantIds.has(response.participant_id))
      .flatMap((response) => {
        const participant = researchParticipantForId(
          bundle,
          response.participant_id
        );
        const measure = researchMeasureForId(
          bundle,
          response.study_measure_id
        );
        const questionnaire = researchQuestionnaireForMeasure(
          bundle,
          measure || undefined
        );
        const item = researchItemForResponse(bundle, response);

        if (!participant || !measure || !questionnaire || !item) return [];

        return [
          {
            participant: identityMap.get(participant.id) || "",
            is_test: participant.is_test,
            phase: researchMeasurePhaseDisplay(
              bundle,
              measure
            ),
            questionnaire: questionnaire.name,
            acronym: questionnaire.acronym || "",
            item_key: item.item_key || `item_${item.position}`,
            item_position: item.position,
            item_prompt: item.prompt,
            subscale: item.subscale || "",
            response_type: item.response_type,
            required: item.required,
            reverse_scored: item.reverse_scored,
            response: response.response,
            response_display: researchParticipantSummaryResponseValue(
              item,
              response
            ),
            response_json:
              response.response !== null &&
              typeof response.response === "object"
                ? researchValueText(response.response)
                : "",
            numeric_value: response.numeric_value,
            text_value: response.text_value,
            score_value: response.score_value,
            measure_session_id: response.measure_session_id,
            study_measure_id: response.study_measure_id,
            questionnaire_version_id: response.questionnaire_version_id,
            item_id: response.item_id,
            answered_at: response.answered_at,
          },
        ];
      });
  }

  if (datasetType === "participant_uploads") {
    return bundle.responses
      .filter((response) => participantIds.has(response.participant_id))
      .flatMap((response) => {
        const participant = researchParticipantForId(
          bundle,
          response.participant_id
        );
        const measure = researchMeasureForId(
          bundle,
          response.study_measure_id
        );
        const questionnaire = researchQuestionnaireForMeasure(
          bundle,
          measure || undefined
        );
        const item = researchItemForResponse(bundle, response);
        const upload = researchParticipantUploadMetadata(response.response);

        if (
          !participant ||
          !measure ||
          !questionnaire ||
          !item ||
          !researchParticipantUploadTypes.has(item.response_type) ||
          !upload
        ) {
          return [];
        }

        return [
          {
            participant: identityMap.get(participant.id) || "",
            is_test: participant.is_test,
            phase: researchMeasurePhaseDisplay(bundle, measure),
            questionnaire: questionnaire.name,
            acronym: questionnaire.acronym || "",
            item_key: item.item_key || `item_${item.position}`,
            item_prompt: item.prompt,
            response_type: item.response_type,
            file_name: upload.name,
            mime_type: upload.mimeType || "unknown",
            size_bytes: upload.size ?? "",
            uploaded_at: upload.uploadedAt || response.answered_at,
            answered_at: response.answered_at,
            response_id: response.id,
            measure_session_id: response.measure_session_id,
            item_id: response.item_id,
          },
        ];
      });
  }

  if (datasetType === "questionnaire_scores") {
    const rows: ResearchTableRow[] = [];

    for (const session of bundle.measureSessions) {
      if (
        session.status !== "completed" ||
        !participantIds.has(session.participant_id)
      ) {
        continue;
      }

      const participant = researchParticipantForId(
        bundle,
        session.participant_id
      );
      const measure = researchMeasureForId(
        bundle,
        session.study_measure_id
      );
      const questionnaire = researchQuestionnaireForMeasure(
        bundle,
        measure || undefined
      );

      if (!participant || !measure || !questionnaire) continue;

      const scores =
        session.scores && typeof session.scores === "object"
          ? Object.entries(session.scores)
          : [];

      if (scores.length === 0) {
        rows.push({
          participant: identityMap.get(participant.id) || "",
          is_test: participant.is_test,
          phase: researchMeasurePhaseDisplay(
            bundle,
            measure
          ),
          questionnaire: questionnaire.name,
          acronym: questionnaire.acronym || "",
          score_name: "",
          score_value: "",
          completed_at: session.completed_at || "",
        });
      } else {
        scores.forEach(([scoreName, scoreValue]) => {
          rows.push({
            participant: identityMap.get(participant.id) || "",
            is_test: participant.is_test,
            phase: researchMeasurePhaseDisplay(
              bundle,
              measure
            ),
            questionnaire: questionnaire.name,
            acronym: questionnaire.acronym || "",
            score_name: scoreName,
            score_value: scoreValue,
            completed_at: session.completed_at || "",
          });
        });
      }
    }

    return rows;
  }

  if (datasetType === "ambulatory_checkins") {
    return bundle.ambulatoryCheckins
      .filter((checkin) =>
        participantIds.has(checkin.participant_id)
      )
      .map((checkin) => {
        const participant = researchParticipantForId(
          bundle,
          checkin.participant_id
        );
        const prompt = checkin.prompt_instance_id
          ? bundle.ambulatoryPrompts.find(
              (candidate) => candidate.id === checkin.prompt_instance_id
            )
          : null;
        const responseCount = bundle.ambulatoryResponses.filter(
          (response) => response.checkin_id === checkin.id
        ).length;

        const latencyMinutes =
          prompt?.scheduled_for && checkin.completed_at
            ? Math.round(
                ((new Date(checkin.completed_at).getTime() -
                  new Date(prompt.scheduled_for).getTime()) /
                  60000) *
                  10
              ) / 10
            : null;

        return {
          participant: participant
            ? identityMap.get(participant.id) || ""
            : "",
          checkin_id: checkin.id,
          prompt_instance_id: checkin.prompt_instance_id || "",
          local_date: checkin.local_date,
          schedule_key: checkin.schedule_key,
          checkin: checkin.schedule_label,
          trigger_type: checkin.trigger_type,
          trigger_source: checkin.trigger_source,
          occurrence: checkin.occurrence_index,
          scheduled_for: prompt?.scheduled_for || "",
          expires_at: prompt?.expires_at || "",
          notification_sent_at: prompt?.notification_sent_at || "",
          opened_at: prompt?.opened_at || "",
          started_at: checkin.started_at,
          completed_at: checkin.completed_at || "",
          response_latency_minutes: latencyMinutes ?? "",
          item_responses: responseCount,
          prompt_status: prompt?.status || "event",
          is_test: participant?.is_test || false,
        };
      });
  }

  if (datasetType === "ambulatory_responses") {
    return bundle.ambulatoryResponses
      .filter((response) => participantIds.has(response.participant_id))
      .map((response) => {
        const participant = researchParticipantForId(
          bundle,
          response.participant_id
        );
        const checkin = bundle.ambulatoryCheckins.find(
          (candidate) => candidate.id === response.checkin_id
        );
        const prompt = checkin?.prompt_instance_id
          ? bundle.ambulatoryPrompts.find(
              (candidate) => candidate.id === checkin.prompt_instance_id
            )
          : null;

        return {
          participant: participant
            ? identityMap.get(participant.id) || ""
            : "",
          response_id: response.id,
          checkin_id: response.checkin_id,
          prompt_instance_id: checkin?.prompt_instance_id || "",
          local_date: checkin?.local_date || "",
          schedule_key: checkin?.schedule_key || "",
          checkin: checkin?.schedule_label || "",
          trigger_type: checkin?.trigger_type || "",
          trigger_source: checkin?.trigger_source || "",
          occurrence: checkin?.occurrence_index ?? "",
          scheduled_for: prompt?.scheduled_for || "",
          opened_at: prompt?.opened_at || "",
          checkin_started_at: checkin?.started_at || "",
          checkin_completed_at: checkin?.completed_at || "",
          item_key: response.item_key,
          item_type: response.item_type,
          prompt: response.prompt_snapshot,
          raw_response: researchValueText(response.response),
          numeric_value: response.numeric_value ?? "",
          text_value: response.text_value ?? "",
          answered_at: response.answered_at,
          is_test: participant?.is_test || false,
        };
      });
  }

  if (datasetType === "ambulatory_wide") {
    const fields = researchAmbulatoryWideFields(bundle);

    return bundle.ambulatoryCheckins
      .filter((checkin) => participantIds.has(checkin.participant_id))
      .map((checkin) => {
        const participant = researchParticipantForId(
          bundle,
          checkin.participant_id
        );
        const prompt = checkin.prompt_instance_id
          ? bundle.ambulatoryPrompts.find(
              (candidate) => candidate.id === checkin.prompt_instance_id
            )
          : null;
        const responses = bundle.ambulatoryResponses.filter(
          (response) => response.checkin_id === checkin.id
        );
        const latencyMinutes =
          prompt?.scheduled_for && checkin.completed_at
            ? Math.round(
                ((new Date(checkin.completed_at).getTime() -
                  new Date(prompt.scheduled_for).getTime()) /
                  60000) *
                  10
              ) / 10
            : null;

        const row: ResearchTableRow = {
          participant: participant
            ? identityMap.get(participant.id) || ""
            : "",
          checkin_id: checkin.id,
          prompt_instance_id: checkin.prompt_instance_id || "",
          local_date: checkin.local_date,
          schedule_key: checkin.schedule_key,
          checkin: checkin.schedule_label,
          trigger_type: checkin.trigger_type,
          trigger_source: checkin.trigger_source,
          occurrence: checkin.occurrence_index,
          scheduled_for: prompt?.scheduled_for || "",
          expires_at: prompt?.expires_at || "",
          opened_at: prompt?.opened_at || "",
          started_at: checkin.started_at,
          completed_at: checkin.completed_at || "",
          response_latency_minutes: latencyMinutes ?? "",
          prompt_status: prompt?.status || "event",
          is_test: participant?.is_test || false,
        };

        for (const field of fields) {
          row[field.variable] = "";
        }

        for (const response of responses) {
          const responseFields = fields.filter(
            (field) => field.itemKey === response.item_key
          );

          for (const field of responseFields) {
            row[field.variable] = researchAmbulatoryWideValue(field, response);
          }
        }

        return row;
      });
  }

  if (
    datasetType ===
    "ambulatory_participant_days"
  ) {
    const rows: ResearchTableRow[] = [];

    for (const participant of participants) {
      const dates = Array.from(
        new Set([
          ...bundle.ambulatoryPrompts
            .filter(
              (prompt) =>
                prompt.participant_id ===
                participant.id
            )
            .map(
              (prompt) =>
                prompt.local_date
            ),
          ...bundle.ambulatoryCheckins
            .filter(
              (checkin) =>
                checkin.participant_id ===
                participant.id
            )
            .map(
              (checkin) =>
                checkin.local_date
            ),
        ])
      ).sort();

      for (const date of dates) {
        const prompts =
          bundle.ambulatoryPrompts.filter(
            (prompt) =>
              prompt.participant_id ===
                participant.id &&
              prompt.local_date === date
          );

        const scheduledCompleted =
          prompts.filter(
            (prompt) =>
              prompt.status ===
              "completed"
          ).length;

        const scheduledMissed =
          prompts.filter(
            (prompt) =>
              prompt.status === "missed"
          ).length;

        const checkins =
          bundle.ambulatoryCheckins.filter(
            (checkin) =>
              checkin.participant_id ===
                participant.id &&
              checkin.local_date === date &&
              Boolean(
                checkin.completed_at
              )
          );

        const eventCheckins =
          checkins.filter(
            (checkin) =>
              checkin.trigger_type ===
                "event_contingent" ||
              checkin.trigger_type ===
                "participant_initiated"
          ).length;

        const numeric =
          bundle.ambulatoryResponses
            .filter(
              (response) =>
                checkins.some(
                  (checkin) =>
                    checkin.id ===
                    response.checkin_id
                ) &&
                typeof response.numeric_value ===
                  "number"
            )
            .map(
              (response) =>
                response.numeric_value as number
            );

        rows.push({
          participant:
            identityMap.get(
              participant.id
            ) || "",
          local_date: date,
          scheduled_prompts:
            prompts.length,
          scheduled_completed:
            scheduledCompleted,
          scheduled_missed:
            scheduledMissed,
          scheduled_compliance_percent:
            prompts.length > 0
              ? Math.round(
                  (scheduledCompleted /
                    prompts.length) *
                    1000
                ) / 10
              : "",
          total_completed_checkins:
            checkins.length,
          event_checkins:
            eventCheckins,
          mean_numeric_response:
            numeric.length > 0
              ? Math.round(
                  (numeric.reduce(
                    (sum, value) =>
                      sum + value,
                    0
                  ) /
                    numeric.length) *
                    100
                ) / 100
              : "",
          is_test:
            participant.is_test,
        });
      }
    }

    return rows;
  }

  if (datasetType === "cognitive_sessions") {
    return bundle.cognitiveSessions
      .filter(
        (session) =>
          session.participant_id && participantIds.has(session.participant_id)
      )
      .flatMap((session) => {
        const participant = session.participant_id
          ? researchParticipantForId(bundle, session.participant_id)
          : null;
        const attachment = researchCognitiveAttachmentForId(
          bundle,
          session.study_cognitive_task_id
        );
        if (!participant || !attachment) return [];
        const summary = session.summary_scores || {};
        const timing = session.timing_quality || {};
        const device = session.device_info || {};
        return [{
          participant: identityMap.get(participant.id) || "",
          is_test: participant.is_test,
          administration_position: attachment.position,
          cognitive_task: attachment.title,
          version: attachment.version_label,
          required: attachment.required,
          session_status: session.status,
          trials: researchNumber(summary.trials) ?? "",
          scorable_trials: researchNumber(summary.scorable_trials) ?? "",
          correct_trials: researchNumber(summary.correct_trials) ?? "",
          accuracy: researchNumber(summary.accuracy) ?? "",
          mean_rt_ms: researchNumber(summary.mean_rt_ms) ?? "",
          median_rt_ms: researchNumber(summary.median_rt_ms) ?? "",
          response_observations: researchNumber(summary.response_observations) ?? "",
          refresh_hz: researchNumber(timing.refresh_hz) ?? researchNumber(device.refresh_hz) ?? "",
          refresh_stability: researchNumber(timing.refresh_stability) ?? "",
          visibility_interruptions: researchNumber(timing.visibility_interruptions) ?? "",
          cognitive_session_id: session.id,
          participant_session_id: session.participant_session_id || "",
          started_at: session.started_at || "",
          completed_at: session.completed_at || "",
          condition_summary_json: researchValueText(summary.conditions || {}),
          timing_quality_json: researchValueText(timing),
          device_info_json: researchValueText(device),
        }];
      });
  }

  if (datasetType === "cognitive_trials") {
    return bundle.cognitiveTrials.flatMap((trial) => {
      const session = researchCognitiveSessionForTrial(bundle, trial);
      if (!session?.participant_id || !participantIds.has(session.participant_id)) return [];
      const participant = researchParticipantForId(bundle, session.participant_id);
      const attachment = researchCognitiveAttachmentForId(bundle, session.study_cognitive_task_id);
      if (!participant || !attachment) return [];
      const response = trial.response_payload || {};
      const stimulus = trial.stimulus_payload || {};
      return [{
        participant: identityMap.get(participant.id) || "",
        is_test: participant.is_test,
        administration_position: attachment.position,
        cognitive_task: attachment.title,
        version: attachment.version_label,
        cognitive_session_id: session.id,
        block_key: trial.block_key || "",
        trial_index: trial.trial_index,
        condition: trial.condition_label || "",
        response: response.response ?? "",
        correct_response: response.correct_response ?? "",
        correct: trial.correct ?? "",
        reaction_time_ms: trial.reaction_time_ms ?? "",
        stimulus_variables_json: researchValueText(stimulus.variables || {}),
        stimulus_payload_json: researchValueText(stimulus),
        response_payload_json: researchValueText(response),
        timing_json: researchValueText(trial.timing || {}),
        recorded_at: trial.created_at,
      }];
    });
  }

  if (datasetType === "cognitive_participant_summary") {
    const rows: ResearchTableRow[] = [];
    for (const participant of participants) {
      for (const attachment of [...bundle.cognitiveAttachments].sort((a, b) => a.position - b.position)) {
        const summary = researchCognitiveParticipantSummary(bundle, participant.id, attachment.id);
        const scores = summary.session?.summary_scores || {};
        const timing = summary.session?.timing_quality || {};
        rows.push({
          participant: identityMap.get(participant.id) || "",
          is_test: participant.is_test,
          administration_position: attachment.position,
          cognitive_task: attachment.title,
          version: attachment.version_label,
          required: attachment.required,
          completed: summary.session?.status === "completed",
          session_status: summary.session?.status || "not_started",
          trials: summary.trials.length,
          scorable_trials: summary.trials.filter((trial) => trial.correct !== null).length,
          accuracy: summary.accuracy ?? researchNumber(scores.accuracy) ?? "",
          mean_rt_ms: summary.meanRt ?? researchNumber(scores.mean_rt_ms) ?? "",
          median_rt_ms: summary.medianRt ?? researchNumber(scores.median_rt_ms) ?? "",
          omissions: summary.omissions,
          refresh_hz: researchNumber(timing.refresh_hz) ?? "",
          refresh_stability: researchNumber(timing.refresh_stability) ?? "",
          visibility_interruptions: researchNumber(timing.visibility_interruptions) ?? "",
          completed_at: summary.session?.completed_at || "",
        });
      }
    }
    return rows;
  }

  if (datasetType === "consent") {
    return bundle.consents
      .filter((consent) => participantIds.has(consent.participant_id))
      .flatMap((consent) => {
        const participant = researchParticipantForId(
          bundle,
          consent.participant_id
        );

        if (!participant) return [];

        const versionLabel =
          typeof consent.consent_snapshot?.version_label === "string"
            ? consent.consent_snapshot.version_label
            : "";

        return [
          {
            participant: identityMap.get(participant.id) || "",
            is_test: participant.is_test,
            consented: consent.consented,
            consent_version: versionLabel,
            consented_at: consent.consented_at,
            consent_responses: includeDirectIdentifiers
              ? consent.responses
              : "[excluded by export settings]",
          },
        ];
      });
  }

  // analysis_wide — one row per participant with demographics +
  // analysis-ready questionnaire variables. Complex custom item responses are
  // expanded into stable scalar columns while the lossless long-format export
  // continues to preserve each original raw response.
  const questionnaireFields =
    researchAnalysisQuestionnaireFields(bundle);
  const questionnaireScoreFields =
    researchQuestionnaireScoreFields(bundle);

  return participants.map((participant) => {
    const row: ResearchTableRow = {
      ...participantBase(participant),
    };

    if (identityMode === "pseudonymous" && includeDirectIdentifiers) {
      row.participant_code = participant.participant_code || "";
    }

    for (const question of bundle.demographicQuestions) {
      if (question.direct_identifier && !includeDirectIdentifiers) {
        continue;
      }

      const response = bundle.demographicResponses.find(
        (candidate) =>
          candidate.participant_id === participant.id &&
          candidate.question_id === question.id
      );

      row[`demo_${researchSafeVariable(question.field_key)}`] = response
        ? response.text_value ??
          response.numeric_value ??
          response.response
        : "";
    }

    // Create all questionnaire item and computed score columns even when this
    // participant has missing data, so every Excel export keeps a stable
    // study-level structure across participants.
    for (const field of questionnaireFields) {
      row[field.source] = "";
    }
    for (const field of questionnaireScoreFields) {
      row[field.source] = "";
    }

    const participantResponses = bundle.responses.filter(
      (response) => response.participant_id === participant.id
    );

    for (const response of participantResponses) {
      const matchingFields = questionnaireFields.filter(
        (candidate) =>
          candidate.measureId === response.study_measure_id &&
          candidate.itemId === response.item_id
      );

      if (matchingFields.length === 0) {
        continue;
      }

      const item = bundle.questionnaireItems.find(
        (candidate) => candidate.id === response.item_id
      );

      if (!item) {
        continue;
      }

      for (const field of matchingFields) {
        row[field.source] = researchAnalysisFieldValue(
          field,
          item,
          response
        );
      }
    }

    const participantMeasureSessions = bundle.measureSessions.filter(
      (session) =>
        session.participant_id === participant.id &&
        session.status === "completed"
    );

    for (const session of participantMeasureSessions) {
      const matchingScoreFields = questionnaireScoreFields.filter(
        (field) => field.measureId === session.study_measure_id
      );
      for (const field of matchingScoreFields) {
        const value = session.scores?.[field.scoreName];
        row[field.source] =
          value === null || value === undefined
            ? ""
            : typeof value === "object"
              ? researchValueText(value)
              : value;
      }
    }

    for (const attachment of bundle.cognitiveAttachments) {
      const variables = researchCognitiveAnalysisVariables(attachment);
      const summary = researchCognitiveParticipantSummary(bundle, participant.id, attachment.id);
      row[variables.completed] = summary.session?.status === "completed" ? 1 : 0;
      row[variables.accuracy] = summary.accuracy ?? "";
      row[variables.meanRt] = summary.meanRt ?? "";
      row[variables.medianRt] = summary.medianRt ?? "";
      row[variables.omissions] = summary.session ? summary.omissions : "";
    }

    return row;
  });
}

function researchBuildCodebook(
  bundle: ResearchDataBundle,
  datasetType: ResearchDatasetType,
  includeDirectIdentifiers: boolean
): ResearchCodebookRow[] {
  const common: ResearchCodebookRow[] = [
    {
      variable: "participant",
      label: "Export participant identifier",
      type: "String",
      source: "PsyLattice participant record",
      notes:
        "Pseudonymous PsyLattice ID or export-scoped ANON ID, depending on export settings.",
    },
    {
      variable: "is_test",
      label: "Test participation flag",
      type: "Boolean",
      source: "study_participants",
      notes: "TRUE identifies test participation.",
    },
  ];

  if (datasetType === "participant_summary") {
    const questionnaireFields =
      researchParticipantSummaryQuestionnaireFields(bundle);

    return [
      ...common,
      {
        variable: "status",
        label: "Participant study status",
        type: "Categorical",
        source: "study_participants",
        notes: "active, baseline_complete, completed, or withdrawn.",
      },
      {
        variable: "consented",
        label: "Recorded consent",
        type: "Boolean",
        source: "participant_consents",
        notes: "Indicates whether a consent record was stored.",
      },
      {
        variable: "completed_questionnaires",
        label: "Completed questionnaire sessions",
        type: "Integer",
        source: "study_measure_sessions",
        notes: "Number of completed questionnaire sessions.",
      },
      {
        variable: "completed_cognitive_tasks",
        label: "Completed cognitive task administrations",
        type: "Integer",
        source: "cognitive_task_sessions",
        notes: "Number of completed study-mode cognitive task administrations.",
      },
      ...questionnaireFields.map((field) => ({
        variable: field.source,
        label: field.label,
        type: field.responseType,
        source: "research_responses",
        notes: `${field.phaseLabel} · ${field.questionnaireName} · Item ${field.itemPosition}: ${field.prompt}`,
      })),
    ];
  }

  if (datasetType === "demographics") {
    return bundle.demographicQuestions
      .filter(
        (question) =>
          includeDirectIdentifiers || !question.direct_identifier
      )
      .map((question) => ({
        variable: question.field_key,
        label: question.label,
        type: question.question_type,
        source: "Study demographics",
        notes: `${question.required ? "Required" : "Optional"}${
          question.direct_identifier ? " · Direct identifier" : ""
        }`,
      }));
  }

  if (datasetType === "questionnaire_responses") {
    const rows: ResearchCodebookRow[] = [];

    for (const measure of bundle.measures) {
      const questionnaire = researchQuestionnaireForMeasure(
        bundle,
        measure
      );

      if (!questionnaire) continue;

      const items = bundle.questionnaireItems.filter(
        (item) => item.version_id === measure.questionnaire_version_id
      );

      for (const item of items) {
        rows.push({
          variable: `${researchMeasurePhaseVariable(
            bundle,
            measure
          )}_${researchSafeVariable(
            questionnaire.acronym || questionnaire.name
          )}_${researchSafeVariable(
            item.item_key || `item_${item.position}`
          )}`,
          label: item.prompt,
          type: item.response_type,
          source: questionnaire.name,
          notes: `${researchMeasurePhaseDisplay(
            bundle,
            measure
          )}${
            item.subscale ? ` · Subscale: ${item.subscale}` : ""
          }${item.required ? " · Required" : ""}`,
          questionnaire: questionnaire.name,
          phase: researchMeasurePhaseDisplay(bundle, measure),
          item_key: item.item_key || `item_${item.position}`,
          item_position: item.position,
          response_type: item.response_type,
          value_labels: researchValueLabels(item),
          required: item.required,
          reverse_scored: item.reverse_scored,
          storage: "Lossless raw response + numeric/text/score helpers",
        });
      }
    }

    return rows;
  }

  if (datasetType === "participant_uploads") {
    return [
      ["participant", "Participant", "text", "participant", "Pseudonymous or export-scoped anonymous participant identifier."],
      ["is_test", "Test participation flag", "boolean", "participant", "TRUE identifies test participation."],
      ["phase", "Study phase", "text", "study measure", "Baseline or follow-up phase/wave."],
      ["questionnaire", "Questionnaire", "text", "questionnaire", "Questionnaire containing the upload item."],
      ["acronym", "Questionnaire acronym", "text", "questionnaire", "Blank when no acronym is configured."],
      ["item_key", "Item key", "text", "questionnaire item", "Stable item key inside the questionnaire version."],
      ["item_prompt", "Item prompt", "text", "questionnaire item", "Prompt shown to the participant."],
      ["response_type", "Upload response type", "text", "questionnaire item", "file_upload, image_upload, audio_response, or video_response."],
      ["file_name", "Original file name", "text", "participant upload metadata", "Participant-supplied filename stored with the private upload reference."],
      ["mime_type", "MIME type", "text", "participant upload metadata", "Browser-reported media/file MIME type."],
      ["size_bytes", "File size (bytes)", "number", "participant upload metadata", "Stored upload size in bytes."],
      ["uploaded_at", "Upload timestamp", "datetime", "participant upload metadata", "Client upload timestamp stored with the response."],
      ["answered_at", "Response saved at", "datetime", "research_responses", "Database timestamp when the questionnaire response was stored."],
      ["measure_session_id", "Questionnaire session ID", "text", "research_responses", "Used internally to bind secure researcher file access to the exact stored response."],
      ["item_id", "Questionnaire item ID", "text", "research_responses", "Used internally to bind secure researcher file access to the exact stored response."],
    ].map(([variable, label, type, source, notes]) => ({
      variable,
      label,
      type,
      source,
      notes,
    }));
  }

  if (datasetType === "questionnaire_scores") {
    const seen = new Set<string>();
    const rows: ResearchCodebookRow[] = [];

    for (const session of bundle.measureSessions) {
      const measure = researchMeasureForId(bundle, session.study_measure_id);
      const questionnaire = researchQuestionnaireForMeasure(
        bundle,
        measure || undefined
      );

      if (!measure || !questionnaire) continue;

      const scores =
        session.scores && typeof session.scores === "object"
          ? Object.keys(session.scores)
          : [];

      for (const score of scores) {
        const variable = `${researchMeasurePhaseVariable(
          bundle,
          measure
        )}_${researchSafeVariable(
          questionnaire.acronym || questionnaire.name
        )}_${researchSafeVariable(score)}`;

        if (seen.has(variable)) continue;
        seen.add(variable);

        rows.push({
          variable,
          label: `${questionnaire.name} — ${score}`,
          type: "Numeric / computed",
          source: questionnaire.name,
          notes: `${researchMeasurePhaseDisplay(
            bundle,
            measure
          )} score stored by the participant runner.`,
        });
      }
    }

    return rows;
  }

  if (datasetType === "ambulatory_checkins") {
    return [
      ["participant", "Participant", "text", "participant", "Pseudonymous or export-scoped anonymous participant identifier."],
      ["checkin_id", "Check-in record ID", "text", "ambulatory check-in", "Stable PsyLattice check-in identifier."],
      ["prompt_instance_id", "Scheduled prompt instance ID", "text", "prompt instance", "Blank for event/participant-initiated check-ins without a scheduled prompt."],
      ["local_date", "Participant-local date", "date", "ambulatory check-in", ""],
      ["schedule_key", "Schedule key", "text", "ambulatory protocol", "Stable schedule key configured by the researcher."],
      ["checkin", "Check-in / event title", "text", "ambulatory check-in", ""],
      ["trigger_type", "Trigger type", "text", "ambulatory check-in", "fixed_time, random_window, interval, event_contingent or participant_initiated."],
      ["trigger_source", "Trigger source", "text", "ambulatory check-in", "How the check-in was initiated."],
      ["occurrence", "Occurrence within day", "number", "ambulatory check-in", ""],
      ["scheduled_for", "Scheduled timestamp", "datetime", "prompt instance", "Blank for participant/event-triggered check-ins."],
      ["expires_at", "Prompt expiry timestamp", "datetime", "prompt instance", ""],
      ["notification_sent_at", "Reminder notification timestamp", "datetime", "prompt instance", ""],
      ["opened_at", "Prompt opened timestamp", "datetime", "prompt instance", ""],
      ["started_at", "Check-in started", "datetime", "ambulatory check-in", ""],
      ["completed_at", "Check-in completed", "datetime", "ambulatory check-in", ""],
      ["response_latency_minutes", "Scheduled-to-completion latency (minutes)", "number", "derived", "Available for scheduled prompts."],
      ["item_responses", "Number of stored item responses", "number", "derived", ""],
      ["prompt_status", "Prompt status", "text", "prompt instance", ""],
      ["is_test", "Test participation flag", "boolean", "participant", "TRUE identifies test participation."],
    ].map(([variable, label, type, source, notes]) => ({
      variable,
      label,
      type,
      source,
      notes,
    }));
  }

  if (datasetType === "ambulatory_responses") {
    return [
      ["participant", "Participant", "text", "participant", ""],
      ["response_id", "Ambulatory response ID", "text", "ambulatory response", "Stable response-record identifier."],
      ["checkin_id", "Check-in record ID", "text", "ambulatory check-in", ""],
      ["prompt_instance_id", "Scheduled prompt instance ID", "text", "prompt instance", ""],
      ["local_date", "Participant-local date", "date", "ambulatory check-in", ""],
      ["schedule_key", "Schedule key", "text", "ambulatory protocol", ""],
      ["checkin", "Check-in / event title", "text", "ambulatory check-in", ""],
      ["trigger_type", "Trigger type", "text", "ambulatory check-in", ""],
      ["trigger_source", "Trigger source", "text", "ambulatory check-in", ""],
      ["occurrence", "Occurrence within day", "number", "ambulatory check-in", ""],
      ["scheduled_for", "Scheduled timestamp", "datetime", "prompt instance", ""],
      ["opened_at", "Prompt opened timestamp", "datetime", "prompt instance", ""],
      ["checkin_started_at", "Check-in started", "datetime", "ambulatory check-in", ""],
      ["checkin_completed_at", "Check-in completed", "datetime", "ambulatory check-in", ""],
      ["item_key", "Protocol item key", "text", "ambulatory response", ""],
      ["item_type", "Protocol item type", "text", "ambulatory response", ""],
      ["prompt", "Prompt snapshot", "text", "ambulatory response", "The prompt shown when this response was saved."],
      ["raw_response", "Lossless stored response", "mixed / JSON", "ambulatory response", "Arrays and objects are JSON encoded in CSV/XLSX. This is the lossless source response."],
      ["numeric_value", "Numeric helper", "number", "ambulatory response", "Filled when the response is stored as a scalar number."],
      ["text_value", "Text helper", "text", "ambulatory response", "Filled when the response is stored as scalar text."],
      ["answered_at", "Answered at", "datetime", "ambulatory response", ""],
      ["is_test", "Test participation flag", "boolean", "participant", ""],
    ].map(([variable, label, type, source, notes]) => ({
      variable,
      label,
      type,
      source,
      notes,
    }));
  }

  if (datasetType === "ambulatory_wide") {
    const baseRows: ResearchCodebookRow[] = [
      ["participant", "Participant", "text", "participant", "Pseudonymous or export-scoped anonymous participant identifier."],
      ["checkin_id", "Check-in record ID", "text", "ambulatory check-in", "One row represents one check-in."],
      ["prompt_instance_id", "Scheduled prompt instance ID", "text", "prompt instance", "Blank for event/participant-initiated check-ins without a scheduled prompt."],
      ["local_date", "Participant-local date", "date", "ambulatory check-in", ""],
      ["schedule_key", "Schedule key", "text", "ambulatory protocol", ""],
      ["checkin", "Check-in / event title", "text", "ambulatory check-in", ""],
      ["trigger_type", "Trigger type", "text", "ambulatory check-in", ""],
      ["trigger_source", "Trigger source", "text", "ambulatory check-in", ""],
      ["occurrence", "Occurrence within day", "number", "ambulatory check-in", ""],
      ["scheduled_for", "Scheduled timestamp", "datetime", "prompt instance", ""],
      ["expires_at", "Prompt expiry timestamp", "datetime", "prompt instance", ""],
      ["opened_at", "Prompt opened timestamp", "datetime", "prompt instance", ""],
      ["started_at", "Check-in started", "datetime", "ambulatory check-in", ""],
      ["completed_at", "Check-in completed", "datetime", "ambulatory check-in", ""],
      ["response_latency_minutes", "Scheduled-to-completion latency (minutes)", "number", "derived", ""],
      ["prompt_status", "Prompt status", "text", "prompt instance", ""],
      ["is_test", "Test participation flag", "boolean", "participant", ""],
    ].map(([variable, label, type, source, notes]) => ({
      variable, label, type, source, notes,
    }));

    const responseRows = researchAmbulatoryWideFields(bundle).map((field) => ({
      variable: field.variable,
      label: field.component
        ? `${field.prompt} — ${field.component}`
        : field.prompt,
      type: field.kind === "binary" ? "0/1 binary" : field.itemType,
      source: "study_ambulatory_responses",
      notes:
        field.kind === "binary"
          ? "Analysis-ready binary expansion. The lossless original remains in Ambulatory responses — one row per item response."
          : field.kind === "nested"
            ? "Expanded from a structured ambulatory response. The lossless original remains in the long-format ambulatory response dataset."
            : field.kind === "object"
              ? "JSON text in the wide dataset; use the long-format ambulatory response dataset for the exact stored response."
              : "Analysis-ready scalar ambulatory response.",
      item_key: field.itemKey,
      response_type: field.itemType,
      component: field.component || "Response",
      storage:
        field.kind === "binary"
          ? "Derived 0/1 column"
          : field.kind === "nested"
            ? "Structured response component"
            : field.kind === "object"
              ? "JSON text"
              : "Scalar response",
    }));

    return [...baseRows, ...responseRows];
  }

  if (datasetType === "ambulatory_participant_days") {
    return [
      ["participant", "Participant", "text", "participant", ""],
      ["local_date", "Participant-local date", "date", "ambulatory", ""],
      ["scheduled_prompts", "Scheduled prompts", "number", "derived", ""],
      ["scheduled_completed", "Scheduled prompts completed", "number", "derived", ""],
      ["scheduled_missed", "Scheduled prompts missed", "number", "derived", ""],
      ["scheduled_compliance_percent", "Scheduled prompt compliance (%)", "number", "derived", ""],
      ["total_completed_checkins", "All completed check-ins", "number", "derived", ""],
      ["event_checkins", "Event/participant-initiated check-ins", "number", "derived", ""],
      ["mean_numeric_response", "Mean numeric ambulatory response", "number", "derived", "Descriptive only; interpretation depends on the protocol item scales included."],
    ].map(([variable, label, type, source, notes]) => ({
      variable,
      label,
      type,
      source,
      notes,
    }));
  }

  if (datasetType === "cognitive_sessions") {
    return [
      ["participant", "Participant", "text", "study_participants", "Pseudonymous or export-scoped anonymous participant identifier."],
      ["is_test", "Test participation flag", "boolean", "study_participants", "TRUE identifies test participation."],
      ["administration_position", "Study-flow administration position", "integer", "study_cognitive_tasks", "Distinguishes repeated uses of the same cognitive task."],
      ["cognitive_task", "Cognitive task", "text", "cognitive_tasks", "Task title pinned into the study."],
      ["version", "Pinned task version", "text", "cognitive_task_versions", "Frozen study-ready version used for this administration."],
      ["session_status", "Cognitive session status", "categorical", "cognitive_task_sessions", "Study-mode execution status."],
      ["accuracy", "Accuracy proportion", "numeric 0-1", "summary_scores", "Correct / scorable trials; blank when the task has no scorable trials."],
      ["mean_rt_ms", "Mean reaction time", "milliseconds", "summary_scores", "Mean of recorded reaction times."],
      ["median_rt_ms", "Median reaction time", "milliseconds", "summary_scores", "Median of recorded reaction times."],
      ["refresh_hz", "Effective refresh rate", "Hz", "timing_quality", "Display refresh rate used for frame-aware task timing."],
      ["refresh_stability", "Refresh stability", "proportion", "timing_quality", "Runner refresh-sampling stability diagnostic."],
      ["condition_summary_json", "Condition summaries", "JSON", "summary_scores", "Deterministic per-condition trial count, accuracy and mean RT summaries."],
      ["timing_quality_json", "Timing diagnostics", "JSON", "cognitive_task_sessions", "Lossless browser/display timing diagnostics."],
    ].map(([variable, label, type, source, notes]) => ({ variable, label, type, source, notes }));
  }

  if (datasetType === "cognitive_trials") {
    return [
      ["participant", "Participant", "text", "study_participants", "Pseudonymous or export-scoped anonymous participant identifier."],
      ["administration_position", "Study-flow administration position", "integer", "study_cognitive_tasks", "Distinguishes repeated task administrations."],
      ["cognitive_task", "Cognitive task", "text", "cognitive_tasks", "Task title."],
      ["block_key", "Block key", "text", "cognitive_trial_results", "Task block identifier."],
      ["trial_index", "Trial index", "integer", "cognitive_trial_results", "Zero-based execution index stored by the runner."],
      ["condition", "Condition label", "text", "cognitive_trial_results", "Trial condition configured by the task definition."],
      ["response", "Participant response", "text/JSON", "response_payload", "Raw normalized participant response."],
      ["correct_response", "Correct response", "text/JSON", "response_payload", "Resolved correct answer for the executed trial."],
      ["correct", "Correctness", "boolean/null", "cognitive_trial_results", "NULL means the trial was not scorable."],
      ["reaction_time_ms", "Reaction time", "milliseconds", "cognitive_trial_results", "RT relative to the configured response anchor."],
      ["stimulus_variables_json", "Trial variables", "JSON", "stimulus_payload", "Lossless Trial Table variables for the executed trial."],
      ["timing_json", "Component timing", "JSON", "cognitive_trial_results", "Per-component requested/actual timing and frame diagnostics."],
    ].map(([variable, label, type, source, notes]) => ({ variable, label, type, source, notes }));
  }

  if (datasetType === "cognitive_participant_summary") {
    return [
      ["participant", "Participant", "text", "study_participants", "Pseudonymous or export-scoped anonymous participant identifier."],
      ["administration_position", "Study-flow administration position", "integer", "study_cognitive_tasks", "Identifies the task placement in this study."],
      ["cognitive_task", "Cognitive task", "text", "cognitive_tasks", "Task title."],
      ["completed", "Completed administration", "binary", "derived", "1/TRUE when the study-mode task session is completed."],
      ["trials", "Recorded trials", "integer", "derived", "Number of stored raw trial rows."],
      ["accuracy", "Accuracy proportion", "numeric 0-1", "derived", "Correct / scorable trials."],
      ["mean_rt_ms", "Mean reaction time", "milliseconds", "derived", "Mean participant RT across recorded RT trials."],
      ["median_rt_ms", "Median reaction time", "milliseconds", "derived", "Median participant RT across recorded RT trials."],
      ["omissions", "Omitted responses", "integer", "derived", "Trials with no participant response value."],
      ["refresh_hz", "Effective refresh rate", "Hz", "timing_quality", "Display refresh rate used for the session."],
    ].map(([variable, label, type, source, notes]) => ({ variable, label, type, source, notes }));
  }

  if (datasetType === "consent") {
    return [
      ...common,
      {
        variable: "consented",
        label: "Consent recorded",
        type: "Boolean",
        source: "participant_consents",
        notes: "TRUE means a consent record was stored.",
      },
      {
        variable: "consent_version",
        label: "Consent version label",
        type: "String",
        source: "Consent snapshot",
        notes: "Version of consent presented to the participant.",
      },
      {
        variable: "consented_at",
        label: "Consent timestamp",
        type: "ISO timestamp",
        source: "participant_consents",
        notes: "",
      },
    ];
  }

  const rows: ResearchCodebookRow[] = [
    ...common,
    {
      variable: "status",
      label: "Participant study status",
      type: "Categorical",
      source: "study_participants",
      notes: "",
    },
    {
      variable: "enrolled_at",
      label: "Enrollment timestamp",
      type: "ISO timestamp",
      source: "study_participants",
      notes: "",
    },
  ];

  bundle.demographicQuestions
    .filter(
      (question) =>
        includeDirectIdentifiers || !question.direct_identifier
    )
    .forEach((question) => {
      rows.push({
        variable: `demo_${researchSafeVariable(question.field_key)}`,
        label: question.label,
        type: question.question_type,
        source: "Study demographics",
        notes: question.direct_identifier
          ? "Direct identifier — included only when explicitly enabled."
          : "",
      });
    });

  researchAnalysisQuestionnaireFields(bundle).forEach(
    (field) => {
      const item = bundle.questionnaireItems.find(
        (candidate) => candidate.id === field.itemId
      );

      rows.push({
        variable: field.source,
        label: field.label,
        type: item
          ? researchAnalysisMeasurementType(item, field)
          : field.responseType,
        source: "research_responses",
        notes: `${field.phaseLabel} · ${field.questionnaireName} · ${field.itemKey}: ${field.prompt}`,
        questionnaire: field.questionnaireName,
        phase: field.phaseLabel,
        item_key: field.itemKey,
        item_position: field.itemPosition,
        response_type: field.responseType,
        component: field.component || "Response",
        value_labels: field.valueLabels || "",
        required: field.required,
        reverse_scored: field.reverseScored,
        storage:
          field.kind === "raw_json"
            ? "JSON text in analysis-wide; complete original retained in questionnaire long export"
            : field.kind === "multi_binary" || field.kind === "matrix_binary"
              ? "Derived 0/1 analysis column; complete original retained in questionnaire long export"
              : "Analysis-ready scalar derived from the stored response",
      });
    }
  );

  for (const field of researchQuestionnaireScoreFields(bundle)) {
    rows.push({
      variable: field.source,
      label: field.label,
      type: "Numeric / computed",
      source: "study_measure_sessions.scores",
      notes: `${field.phaseLabel} · ${field.questionnaireName} · Deterministically scored questionnaire output stored by PsyLattice.`,
      questionnaire: field.questionnaireName,
      phase: field.phaseLabel,
      component: field.scoreName,
      storage: "Computed score retained alongside lossless item-level questionnaire responses",
    });
  }

  for (const attachment of bundle.cognitiveAttachments) {
    const variables = researchCognitiveAnalysisVariables(attachment);
    const baseNotes = `Cognitive task administration ${attachment.position}: ${attachment.title} · ${attachment.version_label}`;
    rows.push(
      { variable: variables.completed, label: `${attachment.title} — completed`, type: "Binary numeric (0/1)", source: "cognitive_task_sessions", notes: baseNotes },
      { variable: variables.accuracy, label: `${attachment.title} — accuracy`, type: "Numeric proportion", source: "cognitive_trial_results", notes: `${baseNotes} · Correct / scorable trials.` },
      { variable: variables.meanRt, label: `${attachment.title} — mean RT (ms)`, type: "Numeric milliseconds", source: "cognitive_trial_results", notes: baseNotes },
      { variable: variables.medianRt, label: `${attachment.title} — median RT (ms)`, type: "Numeric milliseconds", source: "cognitive_trial_results", notes: baseNotes },
      { variable: variables.omissions, label: `${attachment.title} — omissions`, type: "Integer", source: "cognitive_trial_results", notes: baseNotes }
    );
  }

  return rows;
}


type ResearchWorkbookMode = "complete" | "clean" | "raw";
type ResearchVisualExportPreset = "complete" | "analysis" | "stats" | "raw";

type ResearchWorkbookSheet = {
  name: string;
  kind: "meta" | "clean" | "raw" | "codebook";
  description: string;
  rows: ResearchTableRow[];
};

function researchDemographicsWideRows(
  bundle: ResearchDataBundle,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean,
  includeDirectIdentifiers: boolean
): ResearchTableRow[] {
  const participants = researchFilteredParticipants(bundle, includeTestData);
  const identityMap = researchParticipantLabelMap(participants, identityMode);
  const questions = [...bundle.demographicQuestions]
    .filter((question) => includeDirectIdentifiers || !question.direct_identifier)
    .sort((a, b) => a.position - b.position);

  return participants.map((participant) => {
    const row: ResearchTableRow = {
      participant: identityMap.get(participant.id) || "",
      is_test: participant.is_test,
    };

    for (const question of questions) {
      const response = bundle.demographicResponses.find(
        (candidate) =>
          candidate.participant_id === participant.id &&
          candidate.question_id === question.id
      );
      row[`demo_${researchSafeVariable(question.field_key)}`] = response
        ? response.text_value ?? response.numeric_value ?? response.response
        : "";
    }

    return row;
  });
}

function researchFollowupExportRows(
  bundle: ResearchDataBundle,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean
): ResearchTableRow[] {
  const participants = researchFilteredParticipants(bundle, includeTestData);
  const identityMap = researchParticipantLabelMap(participants, identityMode);
  const rows: ResearchTableRow[] = [];

  for (const participant of participants) {
    for (const wave of [...bundle.followupWaves].sort((a, b) => a.position - b.position)) {
      const session = [...bundle.sessions]
        .filter(
          (candidate) =>
            candidate.participant_id === participant.id &&
            candidate.followup_wave_id === wave.id
        )
        .sort(
          (a, b) =>
            new Date(b.started_at).getTime() -
            new Date(a.started_at).getTime()
        )[0];
      const measures = bundle.measures.filter(
        (measure) => measure.followup_wave_id === wave.id
      );
      const completed = bundle.measureSessions.filter(
        (measureSession) =>
          measureSession.participant_id === participant.id &&
          measureSession.status === "completed" &&
          measures.some((measure) => measure.id === measureSession.study_measure_id)
      );

      rows.push({
        participant: identityMap.get(participant.id) || "",
        is_test: participant.is_test,
        followup_position: wave.position,
        followup_name: wave.name,
        followup_status: wave.status,
        participant_session_status: session?.status || "not_started",
        session_started_at: session?.started_at || "",
        session_completed_at: session?.completed_at || "",
        configured_questionnaires: measures.length,
        completed_questionnaires: completed.length,
      });
    }
  }

  return rows;
}

function researchParticipantSessionExportRows(
  bundle: ResearchDataBundle,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean
): ResearchTableRow[] {
  const participants = researchFilteredParticipants(bundle, includeTestData);
  const participantIds = new Set(participants.map((participant) => participant.id));
  const identityMap = researchParticipantLabelMap(participants, identityMode);

  return bundle.sessions
    .filter((session) => participantIds.has(session.participant_id))
    .map((session) => {
      const participant = researchParticipantForId(bundle, session.participant_id);
      const wave = session.followup_wave_id
        ? bundle.followupWaves.find((candidate) => candidate.id === session.followup_wave_id)
        : null;
      return {
        participant: identityMap.get(session.participant_id) || "",
        is_test: participant?.is_test ?? session.is_test,
        participant_session_id: session.id,
        phase: session.phase,
        followup_wave_position: wave?.position ?? "",
        followup_wave_name: wave?.name ?? "",
        session_status: session.status,
        started_at: session.started_at,
        last_seen_at: session.last_seen_at,
        completed_at: session.completed_at || "",
      };
    });
}

function researchAmbulatoryPromptExportRows(
  bundle: ResearchDataBundle,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean
): ResearchTableRow[] {
  const participants = researchFilteredParticipants(bundle, includeTestData);
  const participantIds = new Set(participants.map((participant) => participant.id));
  const identityMap = researchParticipantLabelMap(participants, identityMode);

  return bundle.ambulatoryPrompts
    .filter((prompt) => participantIds.has(prompt.participant_id))
    .map((prompt) => {
      const participant = researchParticipantForId(bundle, prompt.participant_id);
      return {
        participant: identityMap.get(prompt.participant_id) || "",
        is_test: participant?.is_test ?? false,
        prompt_instance_id: prompt.id,
        schedule_key: prompt.schedule_key,
        schedule_label: prompt.schedule_label,
        trigger_type: prompt.trigger_type,
        local_date: prompt.local_date,
        occurrence_index: prompt.occurrence_index,
        scheduled_for: prompt.scheduled_for || "",
        expires_at: prompt.expires_at || "",
        prompt_status: prompt.status,
        notification_sent_at: prompt.notification_sent_at || "",
        opened_at: prompt.opened_at || "",
        completed_at: prompt.completed_at || "",
      };
    });
}

function researchCognitiveConditionExportRows(
  bundle: ResearchDataBundle,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean
): ResearchTableRow[] {
  const participants = researchFilteredParticipants(bundle, includeTestData);
  const identityMap = researchParticipantLabelMap(participants, identityMode);
  const rows: ResearchTableRow[] = [];

  for (const participant of participants) {
    for (const attachment of [...bundle.cognitiveAttachments].sort((a, b) => a.position - b.position)) {
      const summary = researchCognitiveParticipantSummary(
        bundle,
        participant.id,
        attachment.id
      );
      if (!summary.session) continue;

      const conditionLabels = Array.from(
        new Set(
          summary.trials.map((trial) => trial.condition_label || "(unlabelled)")
        )
      );

      for (const condition of conditionLabels) {
        const trials = summary.trials.filter(
          (trial) => (trial.condition_label || "(unlabelled)") === condition
        );
        const scorable = trials.filter((trial) => trial.correct !== null);
        const correct = scorable.filter((trial) => trial.correct === true).length;
        const rts = trials
          .map((trial) => researchNumber(trial.reaction_time_ms))
          .filter((value): value is number => value !== null);
        const omissions = trials.filter((trial) => {
          const response = trial.response_payload?.response;
          return response === null || response === undefined || response === "";
        }).length;

        rows.push({
          participant: identityMap.get(participant.id) || "",
          is_test: participant.is_test,
          administration_position: attachment.position,
          cognitive_task: attachment.title,
          version: attachment.version_label,
          condition,
          trials: trials.length,
          scorable_trials: scorable.length,
          correct_trials: correct,
          accuracy: scorable.length > 0 ? correct / scorable.length : "",
          mean_rt_ms: researchMean(rts) ?? "",
          median_rt_ms: researchMedian(rts) ?? "",
          omissions,
          cognitive_session_id: summary.session.id,
        });
      }
    }
  }

  return rows;
}

function researchWorkbookDatasetSheet(
  bundle: ResearchDataBundle,
  datasetType: ResearchDatasetType,
  name: string,
  kind: "clean" | "raw",
  description: string,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean,
  includeDirectIdentifiers: boolean
): ResearchWorkbookSheet {
  return {
    name,
    kind,
    description,
    rows: researchBuildRows(
      bundle,
      datasetType,
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
  };
}


function researchCompatibleVariableBase(value: string) {
  let base = researchSafeVariable(value).slice(0, 58);
  if (!base) base = "variable";
  if (!/^[a-z]/.test(base)) base = `v_${base}`;
  return base.slice(0, 60);
}

function researchCompatibleVariableMap(
  rows: ResearchTableRow[],
  codebook: ResearchCodebookRow[]
) {
  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );
  const codebookByVariable = new Map(
    codebook.map((row) => [row.variable, row])
  );
  const used = new Set<string>();

  return columns.map((sourceVariable) => {
    const base = researchCompatibleVariableBase(sourceVariable);
    let compatibleVariable = base;
    let suffix = 2;

    while (used.has(compatibleVariable.toLowerCase())) {
      const tail = `_${suffix}`;
      compatibleVariable = `${base.slice(0, Math.max(1, 60 - tail.length))}${tail}`;
      suffix += 1;
    }
    used.add(compatibleVariable.toLowerCase());

    const documented = codebookByVariable.get(sourceVariable);
    return {
      source_variable: sourceVariable,
      compatible_variable: compatibleVariable,
      label: documented?.label || sourceVariable,
      type: documented?.type || "Derived / inferred",
      source: documented?.source || "Analysis_Wide",
      value_labels: documented?.value_labels || "",
      missing_value: "Blank cell",
      missing_meaning:
        "No stored/derived value or not applicable. Raw sheets preserve the source observation where available.",
    };
  });
}

function researchCompatibilityValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : "";
  if (typeof value === "string") return value;
  return researchValueText(value);
}

function researchBuildCompatibleAnalysis(
  bundle: ResearchDataBundle,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean,
  includeDirectIdentifiers: boolean
) {
  const sourceRows = researchBuildRows(
    bundle,
    "analysis_wide",
    identityMode,
    includeTestData,
    includeDirectIdentifiers
  );
  const variableMapRows = researchCompatibleVariableMap(
    sourceRows,
    researchBuildCodebook(bundle, "analysis_wide", includeDirectIdentifiers)
  );
  const mapping = new Map(
    variableMapRows.map((row) => [row.source_variable, row.compatible_variable])
  );

  const rows = sourceRows.map((sourceRow) => {
    const row: ResearchTableRow = {};
    for (const [sourceVariable, value] of Object.entries(sourceRow)) {
      const compatible = mapping.get(sourceVariable);
      if (!compatible) continue;
      row[compatible] = researchCompatibilityValue(value);
    }
    return row;
  });

  return { rows, variableMapRows };
}

function researchBuildDataQualitySheets(
  bundle: ResearchDataBundle,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean
) {
  const participants = researchFilteredParticipants(bundle, includeTestData);
  const identityMap = researchParticipantLabelMap(participants, identityMode);
  const participantIds = new Set(participants.map((participant) => participant.id));

  const qualityFlagRows: ResearchTableRow[] = [];
  const flagsByParticipant = new Map<string, Array<{ code: string; label: string; detail: string; domain: string; sessionId: string }>>();

  for (const attachment of bundle.cognitiveAttachments) {
    const analysis = buildCognitiveAttachmentAnalysis({
      attachment,
      participants: bundle.participants,
      sessions: bundle.cognitiveSessions,
      trials: bundle.cognitiveTrials,
      includeTestData,
    });

    for (const flag of analysis.qualityFlags) {
      if (!participantIds.has(flag.participantId)) continue;
      const participant = bundle.participants.find((candidate) => candidate.id === flag.participantId);
      if (!participant) continue;
      const entry = {
        code: flag.code,
        label: flag.label,
        detail: flag.detail,
        domain: `Cognitive · ${attachment.title} · position ${attachment.position}`,
        sessionId: flag.sessionId,
      };
      const current = flagsByParticipant.get(flag.participantId) || [];
      current.push(entry);
      flagsByParticipant.set(flag.participantId, current);
      qualityFlagRows.push({
        participant: identityMap.get(flag.participantId) || "",
        is_test: participant.is_test ? 1 : 0,
        domain: entry.domain,
        administration_position: attachment.position,
        flag_code: flag.code,
        severity: flag.severity,
        flag_label: flag.label,
        detail: flag.detail,
        source_session_id: flag.sessionId,
        automatic_exclusion: 0,
      });
    }
  }

  const requiredDemographics = bundle.demographicQuestions.filter((question) => question.required);
  const requiredMeasures = bundle.measures.filter((measure) => measure.required);
  const requiredCognitive = bundle.cognitiveAttachments.filter((attachment) => attachment.required);

  const summaryRows = participants.map((participant) => {
    const reasons: string[] = [];
    const demographicAnsweredIds = new Set(
      bundle.demographicResponses
        .filter((response) => response.participant_id === participant.id)
        .map((response) => response.question_id)
    );
    const missingRequiredDemographics = requiredDemographics.filter(
      (question) => !demographicAnsweredIds.has(question.id)
    ).length;
    if (missingRequiredDemographics > 0) {
      reasons.push(`${missingRequiredDemographics} required demographic field(s) missing`);
    }

    const completedMeasureIds = new Set(
      bundle.measureSessions
        .filter(
          (session) =>
            session.participant_id === participant.id && session.status === "completed"
        )
        .map((session) => session.study_measure_id)
    );
    const incompleteRequiredQuestionnaires = requiredMeasures.filter(
      (measure) => !completedMeasureIds.has(measure.id)
    ).length;
    if (incompleteRequiredQuestionnaires > 0) {
      reasons.push(`${incompleteRequiredQuestionnaires} required questionnaire administration(s) incomplete`);
    }

    let completedCognitive = 0;
    let incompleteRequiredCognitive = 0;
    for (const attachment of bundle.cognitiveAttachments) {
      const summary = researchCognitiveParticipantSummary(bundle, participant.id, attachment.id);
      if (summary.session?.status === "completed") completedCognitive += 1;
      if (attachment.required && summary.session?.status !== "completed") {
        incompleteRequiredCognitive += 1;
      }
    }
    if (incompleteRequiredCognitive > 0) {
      reasons.push(`${incompleteRequiredCognitive} required cognitive task administration(s) incomplete`);
    }

    const prompts = bundle.ambulatoryPrompts.filter(
      (prompt) => prompt.participant_id === participant.id
    );
    const completedPrompts = prompts.filter((prompt) => prompt.status === "completed").length;
    const missedPrompts = prompts.filter((prompt) => prompt.status === "missed").length;
    const ambulatoryCompliance = prompts.length > 0
      ? Math.round((completedPrompts / prompts.length) * 1000) / 10
      : "";

    const participantFlags = flagsByParticipant.get(participant.id) || [];
    if (participantFlags.length > 0) {
      reasons.push(...Array.from(new Set(participantFlags.map((flag) => flag.label))));
    }

    const consent = bundle.consents.find((row) => row.participant_id === participant.id);
    const participantSessions = bundle.sessions.filter((session) => session.participant_id === participant.id);
    const incompleteSessions = participantSessions.filter((session) => session.status !== "completed").length;

    return {
      participant: identityMap.get(participant.id) || "",
      is_test: participant.is_test ? 1 : 0,
      participant_status: participant.status,
      consent_recorded: consent ? 1 : 0,
      consented: consent?.consented ? 1 : 0,
      demographics_configured: bundle.demographicQuestions.length,
      demographics_answered: demographicAnsweredIds.size,
      required_demographics_missing: missingRequiredDemographics,
      questionnaires_configured: bundle.measures.length,
      questionnaires_completed: completedMeasureIds.size,
      required_questionnaires_incomplete: incompleteRequiredQuestionnaires,
      cognitive_tasks_configured: bundle.cognitiveAttachments.length,
      cognitive_tasks_completed: completedCognitive,
      required_cognitive_tasks_incomplete: incompleteRequiredCognitive,
      ambulatory_prompts: prompts.length,
      ambulatory_prompts_completed: completedPrompts,
      ambulatory_prompts_missed: missedPrompts,
      ambulatory_compliance_percent: ambulatoryCompliance,
      participant_sessions: participantSessions.length,
      incomplete_participant_sessions: incompleteSessions,
      cognitive_quality_flags: participantFlags.length,
      researcher_review_recommended: reasons.length > 0 ? 1 : 0,
      review_reasons: reasons.join(" | "),
      automatic_exclusion: 0,
      raw_data_retained: 1,
    };
  });

  return { summaryRows, qualityFlagRows };
}

function researchImportGuideRows(): ResearchTableRow[] {
  return [
    {
      tool: "SPSS",
      recommended_sheet: "Analysis_Compatible",
      variable_names: "Lower-case ASCII/underscore names, max 60 characters, unique and letter-prefixed.",
      boolean_coding: "0 = false/no; 1 = true/yes",
      missing_values: "Blank cells are system-missing on import.",
      notes: "Use Variable_Map and Codebook for labels/coding. Raw sheets remain available for verification.",
    },
    {
      tool: "jamovi",
      recommended_sheet: "Analysis_Compatible",
      variable_names: "Stable machine-friendly names.",
      boolean_coding: "0/1",
      missing_values: "Blank cells",
      notes: "Set measurement level after import where jamovi cannot infer it from the workbook alone.",
    },
    {
      tool: "JASP",
      recommended_sheet: "Analysis_Compatible",
      variable_names: "Stable machine-friendly names.",
      boolean_coding: "0/1",
      missing_values: "Blank cells",
      notes: "Use Codebook/Variable_Map to confirm scale and categorical coding.",
    },
    {
      tool: "R / Python",
      recommended_sheet: "Analysis_Compatible or the relevant *_RAW sheet",
      variable_names: "Stable snake_case names.",
      boolean_coding: "0/1 in Analysis_Compatible; raw sheets preserve source values.",
      missing_values: "Blank Excel cells import as missing/NA depending on reader.",
      notes: "Use raw long-format sheets for trial-level, item-level, or multilevel analyses.",
    },
  ];
}

function researchBuildUniversalWorkbook(
  bundle: ResearchDataBundle,
  study: ResearchDataStudy,
  mode: ResearchWorkbookMode,
  identityMode: ResearchIdentityMode,
  includeTestData: boolean,
  includeDirectIdentifiers: boolean
): ResearchWorkbookSheet[] {
  const compatibleAnalysis = researchBuildCompatibleAnalysis(
    bundle,
    identityMode,
    includeTestData,
    includeDirectIdentifiers
  );
  const dataQuality = researchBuildDataQualitySheets(
    bundle,
    identityMode,
    includeTestData
  );

  const cleanSheets: ResearchWorkbookSheet[] = [
    researchWorkbookDatasetSheet(
      bundle,
      "participant_summary",
      "Participants",
      "clean",
      "One row per participant with study status and questionnaire item fields.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "analysis_wide",
      "Analysis_Wide",
      "clean",
      "Primary analysis-ready sheet: one row per participant with demographics, questionnaire items/scores and cognitive summaries.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    {
      name: "Analysis_Compatible",
      kind: "clean",
      description: "Statistical-software-friendly one-row-per-participant sheet with safe variable names, 0/1 booleans and blank missing cells.",
      rows: compatibleAnalysis.rows,
    },
    {
      name: "Data_Quality",
      kind: "clean",
      description: "Participant-level completeness and quality review summary. Flags never automatically exclude data.",
      rows: dataQuality.summaryRows,
    },
    {
      name: "Quality_Flags",
      kind: "clean",
      description: "Long-format review flags with source session and reason. automatic_exclusion is always 0.",
      rows: dataQuality.qualityFlagRows,
    },
    {
      name: "Demographics_Clean",
      kind: "clean",
      description: "One row per participant with configured demographic variables expanded into columns.",
      rows: researchDemographicsWideRows(
        bundle,
        identityMode,
        includeTestData,
        includeDirectIdentifiers
      ),
    },
    researchWorkbookDatasetSheet(
      bundle,
      "questionnaire_scores",
      "Questionnaire_Scores",
      "clean",
      "Deterministically computed questionnaire scores in long format, preserving study phase/administration.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "cognitive_participant_summary",
      "Cognitive_Summary",
      "clean",
      "Participant × cognitive-task-administration summaries with accuracy, RT and omissions.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    {
      name: "Cognitive_Conditions",
      kind: "clean",
      description: "Participant × task administration × condition summaries for direct condition-level analysis.",
      rows: researchCognitiveConditionExportRows(
        bundle,
        identityMode,
        includeTestData
      ),
    },
    researchWorkbookDatasetSheet(
      bundle,
      "ambulatory_wide",
      "Ambulatory_Wide",
      "clean",
      "One row per ambulatory check-in with structured responses expanded into analysis-ready columns.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "ambulatory_participant_days",
      "Participant_Days",
      "clean",
      "Participant-day compliance and descriptive ambulatory summaries.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    {
      name: "Followups",
      kind: "clean",
      description: "Participant × follow-up wave status and questionnaire-completion summary.",
      rows: researchFollowupExportRows(
        bundle,
        identityMode,
        includeTestData
      ),
    },
  ];

  const rawSheets: ResearchWorkbookSheet[] = [
    {
      name: "Participant_Sessions_RAW",
      kind: "raw",
      description: "Every stored participant session, including baseline/follow-up/ambulatory phase and resume timestamps.",
      rows: researchParticipantSessionExportRows(
        bundle,
        identityMode,
        includeTestData
      ),
    },
    researchWorkbookDatasetSheet(
      bundle,
      "demographics",
      "Demographics_RAW",
      "raw",
      "One row per stored demographic response.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "questionnaire_responses",
      "Questionnaire_RAW",
      "raw",
      "Lossless item-level questionnaire responses with raw response JSON and scalar helper values.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "participant_uploads",
      "Participant_Uploads",
      "raw",
      "Metadata for participant file/image/audio/video responses; private file content is not embedded in the workbook.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "cognitive_sessions",
      "Cognitive_Sessions_RAW",
      "raw",
      "Study cognitive sessions including deterministic summaries, device information and timing diagnostics.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "cognitive_trials",
      "Cognitive_Trials_RAW",
      "raw",
      "Every stored cognitive trial with condition, response, correctness, RT, stimulus payload and timing JSON.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    {
      name: "Ambulatory_Prompts_RAW",
      kind: "raw",
      description: "Every scheduled ambulatory/ESM prompt instance, including missed prompts that never produced a check-in.",
      rows: researchAmbulatoryPromptExportRows(
        bundle,
        identityMode,
        includeTestData
      ),
    },
    researchWorkbookDatasetSheet(
      bundle,
      "ambulatory_checkins",
      "Ambulatory_Checkins_RAW",
      "raw",
      "Every stored ambulatory check-in with scheduling and timing metadata.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "ambulatory_responses",
      "Ambulatory_Responses_RAW",
      "raw",
      "Every stored ambulatory/ESM item response with the original response preserved.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
    researchWorkbookDatasetSheet(
      bundle,
      "consent",
      "Consent",
      "raw",
      "Consent status/version/timestamp. Consent response payload is included only when direct-identifier export is explicitly enabled.",
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    ),
  ];

  const dataSheets =
    mode === "clean"
      ? cleanSheets
      : mode === "raw"
        ? rawSheets
        : [...cleanSheets, ...rawSheets];

  const codebookDatasetTypes: ResearchDatasetType[] =
    mode === "clean"
      ? [
          "participant_summary",
          "analysis_wide",
          "demographics",
          "questionnaire_scores",
          "cognitive_participant_summary",
          "ambulatory_wide",
          "ambulatory_participant_days",
        ]
      : mode === "raw"
        ? [
            "demographics",
            "questionnaire_responses",
            "participant_uploads",
            "cognitive_sessions",
            "cognitive_trials",
            "ambulatory_checkins",
            "ambulatory_responses",
            "consent",
          ]
        : [
            "participant_summary",
            "analysis_wide",
            "demographics",
            "questionnaire_responses",
            "participant_uploads",
            "questionnaire_scores",
            "cognitive_sessions",
            "cognitive_trials",
            "cognitive_participant_summary",
            "consent",
            "ambulatory_checkins",
            "ambulatory_responses",
            "ambulatory_wide",
            "ambulatory_participant_days",
          ];

  const codebookRows: ResearchTableRow[] = [];
  for (const datasetType of codebookDatasetTypes) {
    for (const variable of researchBuildCodebook(
      bundle,
      datasetType,
      includeDirectIdentifiers
    )) {
      codebookRows.push({
        dataset: datasetType,
        dataset_label: researchDatasetLabels[datasetType],
        variable: variable.variable,
        label: variable.label,
        type: variable.type,
        source: variable.source,
        questionnaire: variable.questionnaire || "",
        phase: variable.phase || "",
        item_key: variable.item_key || "",
        item_position: variable.item_position ?? "",
        response_type: variable.response_type || "",
        component: variable.component || "",
        value_labels: variable.value_labels || "",
        required: variable.required ?? "",
        reverse_scored: variable.reverse_scored ?? "",
        storage: variable.storage || "",
        missing_value: "Blank cell",
        missing_meaning: "No stored/derived value or not applicable; inspect raw source sheets when distinction matters.",
        notes: variable.notes,
      });
    }
  }

  const customCodebookRows: ResearchTableRow[] = [
    ["Participant_Sessions_RAW", "participant_session_id", "Participant session ID", "text", "participant_sessions"],
    ["Participant_Sessions_RAW", "phase", "Session phase", "categorical", "participant_sessions"],
    ["Participant_Sessions_RAW", "followup_wave_name", "Follow-up wave name", "text", "study_followup_waves"],
    ["Participant_Sessions_RAW", "session_status", "Session status", "categorical", "participant_sessions"],
    ["Participant_Sessions_RAW", "started_at", "Session started", "datetime", "participant_sessions"],
    ["Participant_Sessions_RAW", "last_seen_at", "Last participant activity", "datetime", "participant_sessions"],
    ["Cognitive_Conditions", "condition", "Cognitive condition", "text", "cognitive_trial_results"],
    ["Cognitive_Conditions", "accuracy", "Condition accuracy", "numeric proportion", "derived from cognitive_trial_results"],
    ["Cognitive_Conditions", "mean_rt_ms", "Condition mean reaction time", "milliseconds", "derived from cognitive_trial_results"],
    ["Cognitive_Conditions", "median_rt_ms", "Condition median reaction time", "milliseconds", "derived from cognitive_trial_results"],
    ["Ambulatory_Prompts_RAW", "prompt_instance_id", "Ambulatory prompt instance ID", "text", "study_ambulatory_prompt_instances"],
    ["Ambulatory_Prompts_RAW", "prompt_status", "Prompt status", "categorical", "study_ambulatory_prompt_instances"],
    ["Ambulatory_Prompts_RAW", "scheduled_for", "Prompt scheduled timestamp", "datetime", "study_ambulatory_prompt_instances"],
    ["Ambulatory_Prompts_RAW", "expires_at", "Prompt expiry timestamp", "datetime", "study_ambulatory_prompt_instances"],
    ["Followups", "followup_name", "Follow-up wave", "text", "study_followup_waves"],
    ["Followups", "configured_questionnaires", "Configured questionnaires", "integer", "derived"],
    ["Followups", "completed_questionnaires", "Completed questionnaires", "integer", "derived"],
    ["Data_Quality", "researcher_review_recommended", "Researcher review recommended", "binary 0/1", "derived"],
    ["Data_Quality", "review_reasons", "Review reasons", "text", "derived"],
    ["Data_Quality", "automatic_exclusion", "Automatic exclusion applied", "binary 0/1", "derived; always 0"],
    ["Quality_Flags", "flag_code", "Quality review flag code", "categorical", "deterministic quality engine"],
    ["Quality_Flags", "detail", "Quality review detail", "text", "deterministic quality engine"],
    ["Analysis_Compatible", "participant", "Export participant identifier", "text", "Analysis_Wide"],
  ].map(([dataset, variable, label, type, source]) => ({
    dataset,
    dataset_label: dataset,
    variable,
    label,
    type,
    source,
    notes: "Universal workbook helper variable.",
  }));
  codebookRows.push(...customCodebookRows);

  const manifestRows: ResearchTableRow[] = [
    ...dataSheets.map((sheet) => ({
      sheet: sheet.name,
      layer: sheet.kind === "raw" ? "RAW / lossless" : "CLEAN / analysis-ready",
      rows: sheet.rows.length,
      description: sheet.description,
    })),
    ...(mode === "raw"
      ? []
      : [
          {
            sheet: "Variable_Map",
            layer: "DOCUMENTATION",
            rows: compatibleAnalysis.variableMapRows.length,
            description: "Original-to-compatible variable-name map and missing-value convention.",
          },
          {
            sheet: "Import_Guide",
            layer: "DOCUMENTATION",
            rows: researchImportGuideRows().length,
            description: "Import guidance for SPSS, jamovi, JASP, R and Python.",
          },
        ]),
    {
      sheet: "Codebook",
      layer: "DOCUMENTATION",
      rows: codebookRows.length,
      description: "Variable-level documentation across included datasets.",
    },
  ];

  const readmeRows: ResearchTableRow[] = [
    { section: "Study", field: "Study title", value: study.title, notes: "" },
    { section: "Study", field: "Study ID", value: study.id, notes: "Stable PsyLattice study identifier." },
    { section: "Study", field: "Study status", value: study.status, notes: "" },
    { section: "Study", field: "Target sample size", value: study.target_sample_size ?? "", notes: "Blank when no target N is configured." },
    { section: "Study", field: "Configured components", value: researchValueText(study.components), notes: "Study component flags serialized as JSON." },
    { section: "Export", field: "Workbook mode", value: mode, notes: mode === "complete" ? "Contains clean and raw layers." : mode === "clean" ? "Contains analysis-ready/summary layers." : "Contains lossless/raw layers." },
    { section: "Export", field: "Generated at", value: new Date().toISOString(), notes: "UTC ISO timestamp." },
    { section: "Privacy", field: "Participant identity mode", value: identityMode, notes: identityMode === "anonymous" ? "Participant identifiers are replaced with export-scoped ANON IDs." : "PsyLattice pseudonymous participant IDs are retained." },
    { section: "Privacy", field: "TEST data included", value: includeTestData, notes: "TEST participants are excluded by default." },
    { section: "Privacy", field: "Direct identifiers included", value: includeDirectIdentifiers, notes: "Direct demographic identifiers are excluded unless explicitly enabled and confirmed." },
    { section: "Structure", field: "Missing values", value: "Blank cell", notes: "Blank is the default cross-software missing convention. PsyLattice does not inject -999/-99 sentinels into clean numeric variables." },
    { section: "Analysis", field: "Compatibility sheet", value: mode === "raw" ? "Not included in raw-only workbook" : "Analysis_Compatible", notes: "Uses conservative variable names and 0/1 booleans for straightforward SPSS, jamovi, JASP, R and Python import." },
    { section: "Analysis", field: "Variable map", value: mode === "raw" ? "Not included in raw-only workbook" : "Variable_Map", notes: "Maps original Analysis_Wide names to compatibility names so renaming never loses meaning." },
    { section: "Quality", field: "Automatic exclusions", value: "None", notes: "Data_Quality and Quality_Flags identify records for researcher review; PsyLattice does not silently delete or exclude participant data." },
    { section: "Structure", field: "Repeated administrations", value: "Preserved", notes: "Questionnaire and cognitive-task placements retain phase/position/administration information so repeated pre/post uses are not silently merged." },
    { section: "Raw data", field: "JSON fields", value: "JSON text", notes: "Structured/raw payloads are serialized as JSON text without discarding nested values." },
    { section: "Raw data", field: "Participant uploads", value: "Metadata only", notes: "Private uploaded files are not embedded in Excel; their response metadata remains exportable." },
    { section: "Analysis", field: "Primary sheet", value: mode === "raw" ? "Use the relevant *_RAW sheet" : "Analysis_Compatible", notes: mode === "raw" ? "Raw sheets preserve individual observations." : "Analysis_Compatible is the safest direct import sheet; Analysis_Wide retains the original PsyLattice variable names." },
    { section: "Codebook", field: "Variable documentation", value: "Codebook worksheet", notes: "Use it to map exported variables to PsyLattice source, item, phase, coding and storage meaning." },
  ];

  return [
    {
      name: "README",
      kind: "meta",
      description: "Workbook interpretation, privacy and data-structure notes.",
      rows: readmeRows,
    },
    {
      name: "Manifest",
      kind: "meta",
      description: "Worksheet inventory and row counts.",
      rows: manifestRows,
    },
    ...dataSheets,
    ...(mode === "raw"
      ? []
      : [
          {
            name: "Variable_Map",
            kind: "codebook" as const,
            description: "Maps Analysis_Wide variables to Analysis_Compatible names and documents missing-value handling.",
            rows: compatibleAnalysis.variableMapRows,
          },
          {
            name: "Import_Guide",
            kind: "meta" as const,
            description: "Recommended worksheet and conventions for common statistical software.",
            rows: researchImportGuideRows(),
          },
        ]),
    {
      name: "Codebook",
      kind: "codebook",
      description: "Variable-level documentation across included datasets.",
      rows: codebookRows,
    },
  ];
}

/* =========================================================
   DATA DASHBOARD
   ========================================================= */

function ResearchAmbulatoryDataPanel({
  studyId,
}: {
  studyId: string;
}) {
  type Summary = {
    participants: number;
    scheduled_prompts: number;
    completed_prompts: number;
    missed_prompts: number;
    scheduled_compliance_percent: number;
    completed_checkins: number;
    event_checkins: number;
    median_response_latency_minutes: number;
    days: number;
  };

  const [days, setDays] = useState<7 | 14 | 30>(14);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSummary() {
    if (!studyId) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_research_ambulatory_summary",
      {
        p_study_id: studyId,
        p_days: days,
      }
    );

    if (error) {
      console.error(
        "Could not load ambulatory research summary:",
        error
      );
      setErrorMessage(
        "Ambulatory research summary could not be loaded."
      );
      setSummary(null);
    } else {
      setSummary((data || null) as Summary | null);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadSummary();
  }, [studyId, days]);

  return (
    <Panel
      title="Ambulatory research data"
      description="Research-ready compliance, prompt and event metrics from real V3 participant records."
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-1">
          {([7, 14, 30] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                days === value
                  ? "bg-slate-950 text-white"
                  : "text-slate-500"
              }`}
            >
              {value} days
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void loadSummary()}
          className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {errorMessage ? (
        <p className="text-sm text-red-700">{errorMessage}</p>
      ) : loading ? (
        <p className="text-sm text-slate-500">
          Loading ambulatory data...
        </p>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Scheduled compliance"
              value={`${summary.scheduled_compliance_percent || 0}%`}
              detail={`${summary.completed_prompts || 0} of ${summary.scheduled_prompts || 0} prompts completed`}
            />
            <StatCard
              label="Missed prompts"
              value={String(summary.missed_prompts || 0)}
              detail="Expired scheduled prompts"
            />
            <StatCard
              label="Event reports"
              value={String(summary.event_checkins || 0)}
              detail="Event/participant-initiated check-ins"
            />
            <StatCard
              label="Median response latency"
              value={`${summary.median_response_latency_minutes || 0} min`}
              detail="Scheduled prompt → completion"
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {[
              [
                "Participant-level",
                "Compliance, missed prompts, event counts, response latency, first/last activity and study-day progression.",
              ],
              [
                "Participant-day",
                "One row per participant per day: scheduled/completed/missed prompts, events and descriptive numeric summaries.",
              ],
              [
                "Check-in / item level",
                "Exact trigger type, schedule, timestamps, conditional visible responses and raw item-level data.",
              ],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50/50 p-4"
              >
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">
          No ambulatory data is available yet.
        </p>
      )}
    </Panel>
  );
}

function ResearchCognitiveDataPanel({
  bundle,
  includeTestData = false,
}: {
  bundle: ResearchDataBundle;
  includeTestData?: boolean;
}) {
  const participants = bundle.participants.filter(
    (participant) =>
      participant.status !== "withdrawn" &&
      (includeTestData || !participant.is_test)
  );
  const participantIds = new Set(participants.map((participant) => participant.id));

  if (bundle.cognitiveAttachments.length === 0) {
    return null;
  }

  const attachments = [...bundle.cognitiveAttachments].sort((a, b) => a.position - b.position);

  return (
    <Panel
      title="Cognitive task results"
      description="Study-level descriptive performance calculated from stored participant trial data. TEST participants are excluded from these cards."
    >
      <div className="space-y-5">
        {attachments.map((attachment) => {
          const sessions = bundle.cognitiveSessions.filter(
            (session) =>
              session.study_cognitive_task_id === attachment.id &&
              session.participant_id &&
              participantIds.has(session.participant_id) &&
              session.session_mode === "study"
          );
          const completedSessions = sessions.filter((session) => session.status === "completed");
          const sessionIds = new Set(completedSessions.map((session) => session.id));
          const trials = bundle.cognitiveTrials.filter((trial) => sessionIds.has(trial.session_id));
          const scorable = trials.filter((trial) => trial.correct !== null);
          const correct = scorable.filter((trial) => trial.correct === true).length;
          const rts = trials
            .map((trial) => researchNumber(trial.reaction_time_ms))
            .filter((value): value is number => value !== null);
          const omissions = trials.filter((trial) => {
            const response = trial.response_payload?.response;
            return response === null || response === undefined || response === "";
          }).length;
          const conditionLabels = Array.from(new Set(trials.map((trial) => trial.condition_label || "Unlabelled")));

          return (
            <div key={attachment.id} className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">Administration {attachment.position}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">{attachment.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{attachment.version_label} · {attachment.domain.replaceAll("_", " ")} · {attachment.required ? "Required" : "Optional"}</p>
                </div>
                <Status type={completedSessions.length > 0 ? "success" : "neutral"}>
                  {completedSessions.length} completed
                </Status>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Completion" value={`${completedSessions.length}/${participants.length}`} detail="Live participants" />
                <StatCard label="Accuracy" value={scorable.length ? `${Math.round((correct / scorable.length) * 1000) / 10}%` : "—"} detail={`${scorable.length} scorable trials`} />
                <StatCard label="Mean RT" value={rts.length ? `${Math.round((researchMean(rts) || 0) * 10) / 10} ms` : "—"} detail={`${rts.length} RT observations`} />
                <StatCard label="Median RT" value={rts.length ? `${Math.round((researchMedian(rts) || 0) * 10) / 10} ms` : "—"} detail="Across stored trials" />
                <StatCard label="Omissions" value={String(omissions)} detail={`${trials.length} recorded trials`} />
              </div>

              {conditionLabels.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200">
                  <table className="w-full min-w-[620px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Condition</th>
                        <th className="px-4 py-3 font-semibold">Trials</th>
                        <th className="px-4 py-3 font-semibold">Accuracy</th>
                        <th className="px-4 py-3 font-semibold">Mean RT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {conditionLabels.slice(0, 12).map((condition) => {
                        const rows = trials.filter((trial) => (trial.condition_label || "Unlabelled") === condition);
                        const scored = rows.filter((trial) => trial.correct !== null);
                        const conditionCorrect = scored.filter((trial) => trial.correct === true).length;
                        const conditionRts = rows.map((trial) => researchNumber(trial.reaction_time_ms)).filter((value): value is number => value !== null);
                        return (
                          <tr key={condition}>
                            <td className="px-4 py-3 font-medium text-slate-800">{condition}</td>
                            <td className="px-4 py-3 text-slate-600">{rows.length}</td>
                            <td className="px-4 py-3 text-slate-600">{scored.length ? `${Math.round((conditionCorrect / scored.length) * 1000) / 10}%` : "—"}</td>
                            <td className="px-4 py-3 text-slate-600">{conditionRts.length ? `${Math.round((researchMean(conditionRts) || 0) * 10) / 10} ms` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mt-3 text-[11px] leading-5 text-slate-400">
                Descriptive summaries only. Inferential statistics and AI interpretation will be added on top of these stored deterministic results, not instead of them.
              </p>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}


function researchFormatEstimate(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function researchFormatP(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value < 0.001) return "< .001";
  return `= ${value.toFixed(3).replace(/^0/, "")}`;
}

function researchFormatCi(
  ci: [number, number] | null,
  digits = 2,
  suffix = ""
) {
  if (!ci) return "—";
  return `[${ci[0].toFixed(digits)}, ${ci[1].toFixed(digits)}]${suffix}`;
}

function ResearchPairedComparisonCard({
  title,
  comparison,
  scale = 1,
  unit = "",
  note,
}: {
  title: string;
  comparison: PairedComparison;
  scale?: number;
  unit?: string;
  note: string;
}) {
  const difference = comparison.difference === null ? null : comparison.difference * scale;
  const meanA = comparison.meanA === null ? null : comparison.meanA * scale;
  const meanB = comparison.meanB === null ? null : comparison.meanB * scale;
  const ci = comparison.ci95
    ? ([comparison.ci95[0] * scale, comparison.ci95[1] * scale] as [number, number])
    : null;
  const enoughPairs = comparison.n >= 3 && comparison.t !== null;

  return (
    <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">
            Paired participant-level comparison
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">{title}</h4>
        </div>
        <Status type={enoughPairs ? "success" : "neutral"}>
          n = {comparison.n} paired
        </Status>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={comparison.conditionA}
          value={meanA === null ? "—" : `${researchFormatEstimate(meanA, 2)}${unit}`}
          detail="Participant-level mean"
        />
        <StatCard
          label={comparison.conditionB}
          value={meanB === null ? "—" : `${researchFormatEstimate(meanB, 2)}${unit}`}
          detail="Participant-level mean"
        />
        <StatCard
          label={`${comparison.conditionB} − ${comparison.conditionA}`}
          value={difference === null ? "—" : `${difference >= 0 ? "+" : ""}${researchFormatEstimate(difference, 2)}${unit}`}
          detail={`95% CI ${researchFormatCi(ci, 2, unit)}`}
        />
        <StatCard
          label="Effect size"
          value={comparison.cohenDz === null ? "—" : `dz = ${researchFormatEstimate(comparison.cohenDz, 2)}`}
          detail="Cohen’s dz for paired differences"
        />
      </div>

      {enoughPairs ? (
        <div className="mt-4 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
          <span className="font-semibold text-slate-900">
            t({comparison.df}) = {researchFormatEstimate(comparison.t, 3)}, p {researchFormatP(comparison.pTwoSided)}
          </span>
          <span className="text-slate-400"> · </span>
          {note}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-[#d8d1f6] bg-[#f8f6ff] px-4 py-3 text-xs leading-5 text-violet-800">
          At least 3 participants with usable data in both selected conditions are required before PsyLattice displays this paired inferential test.
        </div>
      )}
    </div>
  );
}

function ResearchCognitiveAnalysisPanel({
  bundle,
}: {
  bundle: ResearchDataBundle;
}) {
  const attachments = [...bundle.cognitiveAttachments].sort(
    (a, b) => a.position - b.position
  );
  const [selectedAttachmentId, setSelectedAttachmentId] = useState(
    attachments[0]?.id || ""
  );
  const [includeTestData, setIncludeTestData] = useState(false);
  const selectedAttachment =
    attachments.find((attachment) => attachment.id === selectedAttachmentId) ||
    attachments[0] ||
    null;

  const analysis: CognitiveAttachmentAnalysis | null = selectedAttachment
    ? buildCognitiveAttachmentAnalysis({
        attachment: selectedAttachment,
        participants: bundle.participants,
        sessions: bundle.cognitiveSessions,
        trials: bundle.cognitiveTrials,
        includeTestData,
      })
    : null;

  const [conditionA, setConditionA] = useState("");
  const [conditionB, setConditionB] = useState("");

  useEffect(() => {
    if (!analysis) {
      setConditionA("");
      setConditionB("");
      return;
    }
    setConditionA((current) =>
      analysis.conditionLabels.includes(current)
        ? current
        : analysis.conditionLabels[0] || ""
    );
    setConditionB((current) =>
      analysis.conditionLabels.includes(current) && current !== analysis.conditionLabels[0]
        ? current
        : analysis.conditionLabels[1] || ""
    );
  }, [selectedAttachmentId, analysis?.conditionLabels.join("|")]);

  if (attachments.length === 0 || !analysis || !selectedAttachment) {
    return null;
  }

  const comparison =
    conditionA && conditionB && conditionA !== conditionB
      ? compareConditions(analysis, conditionA, conditionB)
      : null;

  const participantById = new Map(
    bundle.participants.map((participant) => [participant.id, participant])
  );
  const warningCount = analysis.qualityFlags.filter(
    (flag) => flag.severity === "warning"
  ).length;
  const reviewCount = analysis.qualityFlags.filter(
    (flag) => flag.severity === "review"
  ).length;

  return (
    <Panel
      title="Study analysis"
      description="Deterministic participant-level cognitive analysis. PsyLattice calculates these statistics directly from stored study data; no AI is used for the numbers."
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <label className="min-w-[280px] flex-1">
          <span className="text-xs font-semibold text-slate-600">Cognitive task administration</span>
          <select
            value={selectedAttachment.id}
            onChange={(event) => setSelectedAttachmentId(event.target.value)}
            className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
          >
            {attachments.map((attachment) => (
              <option key={attachment.id} value={attachment.id}>
                {attachment.position}. {attachment.title} · {attachment.version_label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIncludeTestData((current) => !current)}
            className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-1.5 text-xs font-semibold transition ${
              includeTestData
                ? "border-[#d8d1f6] bg-[#f8f6ff] text-violet-800"
                : "border-slate-300/70 bg-white text-slate-500"
            }`}
          >
            {includeTestData ? "TEST data included" : "Include TEST data"}
          </button>
          <Status type="neutral">
            {analysis.completedParticipantCount}/{analysis.participantCount} completed
          </Status>
          <Status type={warningCount > 0 ? "warning" : "success"}>
            {warningCount} warning{warningCount === 1 ? "" : "s"}
          </Status>
          <Status type={reviewCount > 0 ? "warning" : "success"}>
            {reviewCount} review flag{reviewCount === 1 ? "" : "s"}
          </Status>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Condition</th>
              <th className="px-4 py-3 font-semibold">Participants</th>
              <th className="px-4 py-3 font-semibold">Mean accuracy</th>
              <th className="px-4 py-3 font-semibold">95% CI</th>
              <th className="px-4 py-3 font-semibold">Mean RT</th>
              <th className="px-4 py-3 font-semibold">95% CI</th>
              <th className="px-4 py-3 font-semibold">Omissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {analysis.conditionSummaries.map((summary) => (
              <tr key={summary.condition}>
                <td className="px-4 py-3 font-semibold text-slate-800">{summary.condition}</td>
                <td className="px-4 py-3 text-slate-600">{summary.participants}</td>
                <td className="px-4 py-3 text-slate-600">
                  {summary.meanAccuracy === null
                    ? "—"
                    : `${researchFormatEstimate(summary.meanAccuracy * 100, 1)}%`}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {summary.accuracyCi95
                    ? researchFormatCi(
                        [summary.accuracyCi95[0] * 100, summary.accuracyCi95[1] * 100],
                        1,
                        "%"
                      )
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {summary.meanRt === null
                    ? "—"
                    : `${researchFormatEstimate(summary.meanRt, 1)} ms`}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {researchFormatCi(summary.rtCi95, 1, " ms")}
                </td>
                <td className="px-4 py-3 text-slate-600">{summary.omissions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {analysis.conditionLabels.length >= 2 && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/40 p-4">
            <p className="text-sm font-semibold text-cyan-950">Compare two conditions</p>
            <p className="mt-1 text-xs leading-5 text-cyan-900/70">
              PsyLattice matches the same participants across both conditions and compares their participant-level condition summaries.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-800">Condition A</span>
                <select
                  value={conditionA}
                  onChange={(event) => {
                    const next = event.target.value;
                    setConditionA(next);
                    if (next === conditionB) {
                      setConditionB(analysis.conditionLabels.find((item) => item !== next) || "");
                    }
                  }}
                  className="mt-1.5 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-100 bg-white px-3 py-2.5 text-sm"
                >
                  {analysis.conditionLabels.map((condition) => (
                    <option key={condition} value={condition} disabled={condition === conditionB}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-800">Condition B</span>
                <select
                  value={conditionB}
                  onChange={(event) => {
                    const next = event.target.value;
                    setConditionB(next);
                    if (next === conditionA) {
                      setConditionA(analysis.conditionLabels.find((item) => item !== next) || "");
                    }
                  }}
                  className="mt-1.5 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-100 bg-white px-3 py-2.5 text-sm"
                >
                  {analysis.conditionLabels.map((condition) => (
                    <option key={condition} value={condition} disabled={condition === conditionA}>
                      {condition}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {comparison && (
            <div className="grid gap-4 xl:grid-cols-2">
              <ResearchPairedComparisonCard
                title="Reaction time"
                comparison={comparison.rt}
                unit=" ms"
                note={`Positive differences mean ${conditionB} was slower than ${conditionA}. The test uses each participant’s mean RT within each condition.`}
              />
              <ResearchPairedComparisonCard
                title="Accuracy"
                comparison={comparison.accuracy}
                scale={100}
                unit=" pp"
                note={`Positive differences mean higher accuracy in ${conditionB}. This is a paired t-test on participant accuracy proportions; because proportions are bounded, interpret it as an initial participant-level inferential summary rather than a substitute for a trial-level binomial model.`}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-5 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Data quality</p>
            <h4 className="mt-1 text-base font-semibold text-slate-950">Review flags — never automatic exclusions</h4>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
              Flags identify sessions worth inspecting. PsyLattice does not remove participants or trials automatically; the researcher retains the exclusion decision and the raw record remains exportable.
            </p>
          </div>
          <Status type={analysis.qualityFlags.length ? "warning" : "success"}>
            {analysis.qualityFlags.length} flag{analysis.qualityFlags.length === 1 ? "" : "s"}
          </Status>
        </div>

        {analysis.qualityFlags.length === 0 ? (
          <div className="mt-4 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-200 bg-cyan-50 px-4 py-3 text-xs text-cyan-800">
            No built-in review flags were triggered for the current live participant sessions.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {analysis.qualityFlags.slice(0, 24).map((flag, index) => {
              const participant = participantById.get(flag.participantId);
              return (
                <div
                  key={`${flag.sessionId}-${flag.code}-${index}`}
                  className="flex flex-col gap-2 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {participant?.public_id || `Participant ${flag.participantId.slice(0, 8)}`} · {flag.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">{flag.detail}</p>
                  </div>
                  <Status type={flag.severity === "warning" ? "warning" : "neutral"}>
                    {flag.severity}
                  </Status>
                </div>
              );
            })}
            {analysis.qualityFlags.length > 24 && (
              <p className="pt-2 text-xs text-slate-400">
                Showing the first 24 flags. Participant-level cognitive exports retain the complete session/timing information for further review.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-[11px] leading-5 text-slate-500">
        <span className="font-semibold text-slate-700">Analysis boundary:</span> the current engine provides participant-level descriptive summaries, 95% confidence intervals, paired t-tests for selected two-condition contrasts, Cohen’s dz, and transparent quality flags. It does not automatically choose a complex statistical model or claim that a hypothesis is supported. Trial-level mixed models, regression, questionnaire–cognitive associations and preregistered analysis plans are later analysis modules.
      </div>
    </Panel>
  );
}

function DataDashboard({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  const {
    studies,
    selectedStudyId,
    setSelectedStudyId,
    selectedStudy,
    bundle,
    loading,
    error,
  } = useResearchDataWorkspace();

  const {
    samples: analysisSamples,
    members: analysisSampleMembers,
    loadingSamples,
    sampleError,
    reloadSamples,
  } = useResearchAnalysisSamples(selectedStudyId);

  const liveParticipants = bundle.participants.filter(
    (participant) =>
      !participant.is_test && participant.status !== "withdrawn"
  );
  const testParticipants = bundle.participants.filter(
    (participant) => participant.is_test
  );

  const liveParticipantIds = new Set(
    liveParticipants.map((participant) => participant.id)
  );

  const liveResponses = bundle.responses.filter((response) =>
    liveParticipantIds.has(response.participant_id)
  );

  const completedLiveMeasureSessions = bundle.measureSessions.filter(
    (session) =>
      liveParticipantIds.has(session.participant_id) &&
      session.status === "completed"
  );

  const completedLiveCognitiveSessions = bundle.cognitiveSessions.filter(
    (session) =>
      Boolean(session.participant_id) &&
      liveParticipantIds.has(session.participant_id as string) &&
      session.session_mode === "study" &&
      session.status === "completed"
  );

  const requiredBaselineMeasures = bundle.measures.filter(
    (measure) =>
      measure.measurement_point === "baseline" && measure.required
  );

  const requiredFollowupMeasures = bundle.measures.filter(
    (measure) =>
      measure.measurement_point === "followup" && measure.required
  );

  function requiredMeasureCompletion(
    participantId: string,
    measures: ResearchDataMeasure[]
  ) {
    return measures.filter((measure) =>
      bundle.measureSessions.some(
        (session) =>
          session.participant_id === participantId &&
          session.study_measure_id === measure.id &&
          session.status === "completed"
      )
    ).length;
  }

  const expectedBaseline =
    liveParticipants.length * requiredBaselineMeasures.length;
  const completedBaseline = liveParticipants.reduce(
    (sum, participant) =>
      sum +
      requiredMeasureCompletion(
        participant.id,
        requiredBaselineMeasures
      ),
    0
  );

  const baselinePercent =
    expectedBaseline > 0
      ? Math.round((completedBaseline / expectedBaseline) * 100)
      : 0;

  const expectedFollowup =
    liveParticipants.length * requiredFollowupMeasures.length;
  const completedFollowup = liveParticipants.reduce(
    (sum, participant) =>
      sum +
      requiredMeasureCompletion(
        participant.id,
        requiredFollowupMeasures
      ),
    0
  );

  const followupPercent =
    expectedFollowup > 0
      ? Math.round((completedFollowup / expectedFollowup) * 100)
      : 0;

  const consentRequired = Boolean(selectedStudy?.components?.consent);
  const consentedLiveParticipants = liveParticipants.filter(
    (participant) =>
      bundle.consents.some(
        (consent) =>
          consent.participant_id === participant.id &&
          consent.consented
      )
  ).length;

  const consentPercent =
    consentRequired && liveParticipants.length > 0
      ? Math.round(
          (consentedLiveParticipants / liveParticipants.length) * 100
        )
      : 0;

  const demographicsRequired = Boolean(
    selectedStudy?.components?.demographics
  );
  const requiredDemographicQuestions =
    bundle.demographicQuestions.filter((question) => question.required);

  const participantsWithCompleteRequiredDemographics =
    liveParticipants.filter((participant) =>
      requiredDemographicQuestions.every((question) =>
        bundle.demographicResponses.some(
          (response) =>
            response.participant_id === participant.id &&
            response.question_id === question.id
        )
      )
    ).length;

  const demographicsPercent =
    demographicsRequired && liveParticipants.length > 0
      ? Math.round(
          (participantsWithCompleteRequiredDemographics /
            liveParticipants.length) *
            100
        )
      : 0;

  const missingBaselineParticipants =
    requiredBaselineMeasures.length === 0
      ? 0
      : liveParticipants.filter(
          (participant) =>
            requiredMeasureCompletion(
              participant.id,
              requiredBaselineMeasures
            ) < requiredBaselineMeasures.length
        ).length;

  const missingConsentParticipants = consentRequired
    ? Math.max(
        liveParticipants.length - consentedLiveParticipants,
        0
      )
    : 0;

  const missingDemographicsParticipants =
    demographicsRequired && requiredDemographicQuestions.length > 0
      ? Math.max(
          liveParticipants.length -
            participantsWithCompleteRequiredDemographics,
          0
        )
      : 0;

  const directIdentifierFields =
    bundle.demographicQuestions.filter(
      (question) => question.direct_identifier
    ).length;

  const participantMap = new Map(
    bundle.participants.map((participant) => [
      participant.id,
      participant,
    ])
  );

  const recentResponses = [...bundle.responses]
    .sort(
      (a, b) =>
        new Date(b.answered_at).getTime() -
        new Date(a.answered_at).getTime()
    )
    .slice(0, 10);


  const { summaryRows: dataQualityRows, qualityFlagRows } =
    researchBuildDataQualitySheets(
      bundle,
      "pseudonymous",
      false
    );

  const summaryByParticipant = new Map<string, ResearchTableRow>();
  dataQualityRows.forEach((row) => {
    summaryByParticipant.set(String(row.participant ?? ""), row);
  });

  const flagsByParticipant = new Map<string, ResearchTableRow[]>();
  qualityFlagRows.forEach((row) => {
    const key = String(row.participant ?? "");
    const current = flagsByParticipant.get(key) || [];
    current.push(row);
    flagsByParticipant.set(key, current);
  });

  const reviewRows = [...liveParticipants]
    .map((participant) => {
      const participantLabel = participant.public_id;
      const summary = summaryByParticipant.get(participantLabel) || {};
      const flags = flagsByParticipant.get(participantLabel) || [];
      const consentOk = !consentRequired || Number(summary.consented ?? 0) === 1;
      const demographicsOk =
        !demographicsRequired ||
        requiredDemographicQuestions.length === 0 ||
        Number(summary.required_demographics_missing ?? 0) === 0;
      const questionnairesOk =
        Number(summary.required_questionnaires_incomplete ?? 0) === 0;
      const cognitiveOk =
        Number(summary.required_cognitive_tasks_incomplete ?? 0) === 0;
      const incompleteSessions = Number(
        summary.incomplete_participant_sessions ?? 0
      );
      const coreComplete =
        consentOk && demographicsOk && questionnairesOk && cognitiveOk;
      const reviewReasons = Array.from(
        new Set(
          String(summary.review_reasons ?? "")
            .split("|")
            .map((value) => value.trim())
            .filter(Boolean)
        )
      );

      let stage: "ready" | "review" | "incomplete" = "ready";
      if (!coreComplete) {
        stage = "incomplete";
      } else if (flags.length > 0 || incompleteSessions > 0) {
        stage = "review";
      }

      return {
        participant,
        participantLabel,
        summary,
        flags,
        consentOk,
        demographicsOk,
        questionnairesOk,
        cognitiveOk,
        incompleteSessions,
        coreComplete,
        reviewReasons,
        stage,
      };
    })
    .sort((a, b) => {
      const order = { review: 0, incomplete: 1, ready: 2 } as const;
      if (order[a.stage] !== order[b.stage]) {
        return order[a.stage] - order[b.stage];
      }
      return a.participantLabel.localeCompare(b.participantLabel);
    });

  const totalLiveParticipants = reviewRows.length;
  const consentReadyCount = reviewRows.filter((row) => row.consentOk).length;
  const requiredDataCompleteCount = reviewRows.filter(
    (row) => row.coreComplete
  ).length;
  const readyPreviewCount = reviewRows.filter(
    (row) => row.stage === "ready"
  ).length;
  const reviewPreviewCount = reviewRows.filter(
    (row) => row.stage === "review"
  ).length;
  const incompletePreviewCount = reviewRows.filter(
    (row) => row.stage === "incomplete"
  ).length;

  const stagePercent = (value: number) =>
    totalLiveParticipants > 0
      ? Math.round((value / totalLiveParticipants) * 100)
      : 0;

  const [reviewFilter, setReviewFilter] = useState<
    "all" | "review" | "incomplete" | "ready"
  >("review");
  const [selectedReviewParticipantId, setSelectedReviewParticipantId] =
    useState("");

  const filteredReviewRows = reviewRows.filter((row) => {
    if (reviewFilter === "all") return true;
    return row.stage === reviewFilter;
  });

  useEffect(() => {
    if (
      !filteredReviewRows.some(
        (row) => row.participant.id === selectedReviewParticipantId
      )
    ) {
      setSelectedReviewParticipantId(
        filteredReviewRows[0]?.participant.id || ""
      );
    }
  }, [
    reviewFilter,
    selectedReviewParticipantId,
    filteredReviewRows
      .map((row) => row.participant.id)
      .join("|"),
  ]);

  const selectedReviewRow =
    filteredReviewRows.find(
      (row) => row.participant.id === selectedReviewParticipantId
    ) || filteredReviewRows[0] || reviewRows[0] || null;

  const [newSampleName, setNewSampleName] = useState("Primary analysis");
  const [newSampleType, setNewSampleType] = useState<
    "primary" | "per_protocol" | "sensitivity" | "custom"
  >("primary");
  const [selectedAnalysisSampleId, setSelectedAnalysisSampleId] = useState("");
  const [sampleActionError, setSampleActionError] = useState("");
  const [sampleActionMessage, setSampleActionMessage] = useState("");
  const [sampleSaving, setSampleSaving] = useState(false);
  const [sampleParticipantId, setSampleParticipantId] = useState("");
  const [sampleDecision, setSampleDecision] = useState<
    "include" | "review" | "exclude"
  >("include");
  const [sampleReason, setSampleReason] = useState("");
  const [sampleNotes, setSampleNotes] = useState("");

  useEffect(() => {
    setSelectedAnalysisSampleId((current) =>
      analysisSamples.some((sample) => sample.id === current)
        ? current
        : analysisSamples[0]?.id || ""
    );
  }, [analysisSamples.map((sample) => sample.id).join("|")]);

  const selectedAnalysisSample =
    analysisSamples.find((sample) => sample.id === selectedAnalysisSampleId) ||
    analysisSamples[0] ||
    null;

  const selectedSampleMembers = selectedAnalysisSample
    ? analysisSampleMembers.filter(
        (member) => member.sample_id === selectedAnalysisSample.id
      )
    : [];

  const selectedSampleMemberMap = new Map(
    selectedSampleMembers.map((member) => [member.participant_id, member])
  );

  const includedSampleCount = selectedSampleMembers.filter(
    (member) => member.decision === "include"
  ).length;
  const reviewSampleCount = selectedSampleMembers.filter(
    (member) => member.decision === "review"
  ).length;
  const excludedSampleCount = selectedSampleMembers.filter(
    (member) => member.decision === "exclude"
  ).length;
  const notYetInSampleCount = Math.max(
    liveParticipants.length - selectedSampleMembers.length,
    0
  );

  useEffect(() => {
    const fallbackId =
      selectedReviewRow?.participant.id || liveParticipants[0]?.id || "";
    setSampleParticipantId((current) =>
      liveParticipants.some((participant) => participant.id === current)
        ? current
        : fallbackId
    );
  }, [
    selectedAnalysisSampleId,
    selectedReviewRow?.participant.id,
    liveParticipants.map((participant) => participant.id).join("|"),
  ]);

  const currentSampleMember = sampleParticipantId
    ? selectedSampleMemberMap.get(sampleParticipantId) || null
    : null;

  useEffect(() => {
    setSampleDecision(currentSampleMember?.decision || "include");
    setSampleReason(currentSampleMember?.reason || "");
    setSampleNotes(currentSampleMember?.notes || "");
  }, [
    currentSampleMember?.id,
    currentSampleMember?.decision,
    currentSampleMember?.reason,
    currentSampleMember?.notes,
    sampleParticipantId,
    selectedAnalysisSampleId,
  ]);

  async function createAnalysisSample() {
    if (!selectedStudyId || sampleSaving) return;
    const name = newSampleName.trim();
    if (!name) {
      setSampleActionError("Give this analysis sample a name.");
      return;
    }

    setSampleSaving(true);
    setSampleActionError("");
    setSampleActionMessage("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Your researcher session has expired.");
      }

      const { data: sample, error: sampleInsertError } = await supabase
        .from("research_analysis_samples")
        .insert({
          study_id: selectedStudyId,
          owner_user_id: user.id,
          name,
          sample_type: newSampleType,
          description:
            "Researcher-controlled analysis sample. All live participants present at creation start included; exclusions/review decisions are explicit and reversible.",
        })
        .select(
          "id, study_id, owner_user_id, name, description, sample_type, created_at, updated_at"
        )
        .single();

      if (sampleInsertError || !sample) {
        throw sampleInsertError || new Error("The analysis sample could not be created.");
      }

      if (liveParticipants.length > 0) {
        const { error: membersInsertError } = await supabase
          .from("research_analysis_sample_members")
          .insert(
            liveParticipants.map((participant) => ({
              sample_id: sample.id,
              participant_id: participant.id,
              decision: "include",
              reason: "",
              notes: "",
            }))
          );

        if (membersInsertError) throw membersInsertError;
      }

      await reloadSamples();
      setSelectedAnalysisSampleId(sample.id);
      setSampleActionMessage(
        `${name} created with ${liveParticipants.length} current live participant${liveParticipants.length === 1 ? "" : "s"} included. Nobody was automatically excluded.`
      );
    } catch (error) {
      setSampleActionError(
        error instanceof Error
          ? error.message
          : "The analysis sample could not be created."
      );
    } finally {
      setSampleSaving(false);
    }
  }

  async function saveSampleParticipantDecision() {
    if (!selectedAnalysisSample || !sampleParticipantId || sampleSaving) return;
    if ((sampleDecision === "exclude" || sampleDecision === "review") && !sampleReason.trim()) {
      setSampleActionError(
        "Add a reason when marking a participant for review or exclusion."
      );
      return;
    }

    setSampleSaving(true);
    setSampleActionError("");
    setSampleActionMessage("");

    try {
      const supabase = createClient();
      const { error: upsertError } = await supabase
        .from("research_analysis_sample_members")
        .upsert(
          {
            sample_id: selectedAnalysisSample.id,
            participant_id: sampleParticipantId,
            decision: sampleDecision,
            reason: sampleReason.trim(),
            notes: sampleNotes.trim(),
          },
          { onConflict: "sample_id,participant_id" }
        );

      if (upsertError) throw upsertError;
      await reloadSamples();
      const participant = liveParticipants.find(
        (candidate) => candidate.id === sampleParticipantId
      );
      setSampleActionMessage(
        `${participant?.public_id || "Participant"} marked ${sampleDecision} in ${selectedAnalysisSample.name}.`
      );
    } catch (error) {
      setSampleActionError(
        error instanceof Error
          ? error.message
          : "This sample decision could not be saved."
      );
    } finally {
      setSampleSaving(false);
    }
  }

  async function addCurrentLiveParticipantsToSample() {
    if (!selectedAnalysisSample || sampleSaving) return;
    const missing = liveParticipants.filter(
      (participant) => !selectedSampleMemberMap.has(participant.id)
    );
    if (missing.length === 0) {
      setSampleActionMessage("All current live participants are already represented in this sample.");
      return;
    }

    setSampleSaving(true);
    setSampleActionError("");
    setSampleActionMessage("");
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("research_analysis_sample_members")
        .insert(
          missing.map((participant) => ({
            sample_id: selectedAnalysisSample.id,
            participant_id: participant.id,
            decision: "include",
            reason: "",
            notes: "",
          }))
        );
      if (insertError) throw insertError;
      await reloadSamples();
      setSampleActionMessage(
        `${missing.length} newer live participant${missing.length === 1 ? "" : "s"} added as included. No exclusion rule was applied.`
      );
    } catch (error) {
      setSampleActionError(
        error instanceof Error ? error.message : "Participants could not be added."
      );
    } finally {
      setSampleSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="min-w-[300px]">
          <span className="text-sm font-medium">Study</span>
          <select
            value={selectedStudyId}
            onChange={(event) => setSelectedStudyId(event.target.value)}
            className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
          >
            {studies.map((study) => (
              <option key={study.id} value={study.id}>
                {study.title}
              </option>
            ))}
          </select>
        </label>

        {selectedStudy && (
          <Status
            type={
              selectedStudy.status === "active"
                ? "success"
                : selectedStudy.status === "draft"
                  ? "warning"
                  : "neutral"
            }
          >
            {selectedStudy.status.replaceAll("_", " ")}
          </Status>
        )}
      </div>

      {error && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm leading-6 text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live participants"
          value={loading ? "..." : String(liveParticipants.length)}
          detail={`${testParticipants.length} test record${
            testParticipants.length === 1 ? "" : "s"
          } excluded`}
        />

        <StatCard
          label="Item responses"
          value={loading ? "..." : String(liveResponses.length)}
          detail="Stored live questionnaire responses"
        />

        <StatCard
          label="Questionnaires completed"
          value={
            loading
              ? "..."
              : String(completedLiveMeasureSessions.length)
          }
          detail="Completed live measure sessions"
        />

        <StatCard
          label="Cognitive task runs"
          value={loading ? "..." : String(completedLiveCognitiveSessions.length)}
          detail="Completed live study administrations"
        />

        <StatCard
          label="Direct identifier fields"
          value={loading ? "..." : String(directIdentifierFields)}
          detail="Excluded from exports by default"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <Panel
          title="Data completeness"
          description="Calculated from required study components and live participants."
        >
          {loading ? (
            <p className="text-sm text-slate-500">
              Calculating completeness...
            </p>
          ) : liveParticipants.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium">No live participant data yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                TEST participants are deliberately excluded from the main
                completeness metrics.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {consentRequired ? (
                <ProgressBar
                  label="Consent"
                  value={consentPercent}
                  text={`${consentedLiveParticipants} / ${liveParticipants.length}`}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  Consent is not enabled as a study component.
                </p>
              )}

              {demographicsRequired ? (
                <ProgressBar
                  label="Required demographics"
                  value={demographicsPercent}
                  text={`${participantsWithCompleteRequiredDemographics} / ${liveParticipants.length}`}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  Demographics are not enabled as a study component.
                </p>
              )}

              {requiredBaselineMeasures.length > 0 ? (
                <ProgressBar
                  label="Required baseline measures"
                  value={baselinePercent}
                  text={`${completedBaseline} / ${expectedBaseline}`}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  No required baseline questionnaires are configured.
                </p>
              )}

              {requiredFollowupMeasures.length > 0 ? (
                <ProgressBar
                  label="Required follow-up measures"
                  value={followupPercent}
                  text={`${completedFollowup} / ${expectedFollowup}`}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  No required follow-up questionnaires are configured.
                </p>
              )}

              {selectedStudy?.components?.ambulatory && (
                <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-[#cfc6f6] bg-[#f7f5ff] p-4">
                  <p className="text-sm font-medium text-violet-950">
                    Ambulatory component configured
                  </p>
                  <p className="mt-1 text-xs leading-5 text-violet-800">
                    The participant EMA delivery/response pipeline is not
                    connected yet, so PsyLattice does not invent an ambulatory
                    compliance percentage here.
                  </p>
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel
          title="Data-quality checks"
          description="Rule-based checks from the data currently stored in this study."
        >
          <div className="space-y-5">
            {[
              [
                "Missing required baseline measures",
                missingBaselineParticipants,
              ],
              [
                "Missing required demographic fields",
                missingDemographicsParticipants,
              ],
              ["Missing recorded consent", missingConsentParticipants],
              ["TEST participants", testParticipants.length],
              ["Direct identifier fields configured", directIdentifierFields],
            ].map(([label, count], index) => {
              const numericCount = Number(count);

              return (
                <div
                  key={String(label)}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm">{String(label)}</span>
                  <Status
                    type={
                      index < 3 && numericCount > 0
                        ? "warning"
                        : numericCount === 0
                          ? "success"
                          : "accent"
                    }
                  >
                    {numericCount}
                  </Status>
                </div>
              );
            })}
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            These are transparent data-completeness checks, not statistical
            outlier detection or clinical judgments.
          </p>
        </Panel>
      </div>

      <Panel
        title="Visual analysis sample overview"
        description="See how live participants move from recruitment to a primary-analysis-ready sample. These counts are visual guidance for the researcher — not hidden exclusion logic."
      >
        {loading ? (
          <p className="text-sm text-slate-500">Preparing sample overview...</p>
        ) : totalLiveParticipants === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No live participants yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Recruit participants or finish a TEST run and then switch to live data to see a visual sample overview here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="All live participants"
                value={String(totalLiveParticipants)}
                detail="Current live sample entering the study"
              />
              <StatCard
                label="Required data complete"
                value={String(requiredDataCompleteCount)}
                detail={`${stagePercent(requiredDataCompleteCount)}% have consent + required measures/components complete`}
              />
              <StatCard
                label="Needs researcher review"
                value={String(reviewPreviewCount)}
                detail="Transparent flags only — nobody is auto-excluded"
              />
              <StatCard
                label="Primary sample preview"
                value={String(readyPreviewCount)}
                detail={`${stagePercent(readyPreviewCount)}% ready without current review flags`}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
                <p className="text-sm font-semibold text-slate-900">Participant flow</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  A visual funnel for the current study. This helps researchers see where participants are being lost or flagged before exporting a sample.
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      label: "Live participants",
                      count: totalLiveParticipants,
                      color: "bg-slate-900",
                      detail: "All live, non-withdrawn participants",
                    },
                    {
                      label: consentRequired ? "Consent recorded" : "Consent step not required",
                      count: consentRequired ? consentReadyCount : totalLiveParticipants,
                      color: "bg-cyan-500",
                      detail: consentRequired
                        ? `${consentReadyCount} participants have a consent record`
                        : "All participants continue because consent is not a configured component",
                    },
                    {
                      label: "Required data complete",
                      count: requiredDataCompleteCount,
                      color: "bg-cyan-500",
                      detail: "Consent + required demographics/questionnaires/cognitive tasks complete",
                    },
                    {
                      label: "Primary sample preview",
                      count: readyPreviewCount,
                      color: "bg-violet-500",
                      detail: "Ready right now without current review flags",
                    },
                  ].map((stage) => (
                    <div key={stage.label}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{stage.label}</p>
                          <p className="text-[11px] leading-4 text-slate-400">{stage.detail}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-base font-semibold text-slate-950">{stage.count}</p>
                          <p className="text-[11px] text-slate-400">{stagePercent(stage.count)}%</p>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${stage.color}`}
                          style={{ width: `${Math.max(stagePercent(stage.count), stage.count > 0 ? 6 : 0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-[#d8d1f6] bg-[#f8f6ff]/70 p-5">
                <p className="text-sm font-semibold text-violet-950">Primary analysis sample preview</p>
                <p className="mt-1 text-xs leading-5 text-violet-900/80">
                  PsyLattice is not excluding anyone behind the scenes. This is a visual preview to help you inspect which records look analysis-ready right now.
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                    <span className="text-sm text-slate-700">Ready without current flags</span>
                    <Status type="success">{readyPreviewCount}</Status>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                    <span className="text-sm text-slate-700">Needs review</span>
                    <Status type={reviewPreviewCount > 0 ? "warning" : "success"}>{reviewPreviewCount}</Status>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                    <span className="text-sm text-slate-700">Incomplete required data</span>
                    <Status type={incompletePreviewCount > 0 ? "warning" : "success"}>{incompletePreviewCount}</Status>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-violet-200 bg-white/80 px-4 py-3 text-xs leading-5 text-violet-950">
                  <span className="font-semibold">Next step:</span> inspect the Participant review queue below, then later save formal analysis samples/export presets from this visual overview.
                </div>
              </div>
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title="Participant review queue"
        description="Visual review workflow for included, incomplete and flagged participants. Use this before deciding what should go into your final analysis sample or export."
      >
        {loading ? (
          <p className="text-sm text-slate-500">Preparing participant review queue...</p>
        ) : reviewRows.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No live participant records yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Once live participants begin responding, PsyLattice will surface them here with visual quality and completeness indicators.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {[
                ["review", `Needs review (${reviewPreviewCount})`],
                ["incomplete", `Incomplete (${incompletePreviewCount})`],
                ["ready", `Ready (${readyPreviewCount})`],
                ["all", `All (${reviewRows.length})`],
              ].map(([value, label]) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setReviewFilter(value as "all" | "review" | "incomplete" | "ready")}
                  className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-1.5 text-xs font-semibold transition ${
                    reviewFilter === value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300/70 bg-white text-slate-600"
                  }`}
                >
                  {String(label)}
                </button>
              ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                {filteredReviewRows.length === 0 ? (
                  <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    No participants match the current filter.
                  </div>
                ) : (
                  filteredReviewRows.slice(0, 18).map((row) => {
                    const active = row.participant.id === selectedReviewParticipantId;
                    const stageType =
                      row.stage === "ready"
                        ? "success"
                        : row.stage === "review"
                          ? "warning"
                          : "accent";
                    const stageLabel =
                      row.stage === "ready"
                        ? "Ready"
                        : row.stage === "review"
                          ? "Needs review"
                          : "Incomplete";
                    return (
                      <button
                        key={row.participant.id}
                        type="button"
                        onClick={() => setSelectedReviewParticipantId(row.participant.id)}
                        className={`w-full rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] px-4 py-4 text-left transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-300/70 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className={`text-sm font-semibold ${active ? "text-white" : "text-slate-900"}`}>{row.participantLabel}</p>
                            <p className={`mt-1 text-xs ${active ? "text-slate-300" : "text-slate-500"}`}>
                              {row.reviewReasons[0] || "No current review reason"}
                            </p>
                          </div>
                          <Status type={stageType as any}>{stageLabel}</Status>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                          <span className={`rounded-full px-2.5 py-1 ${active ? "bg-white/10 text-slate-100" : row.consentOk ? "bg-cyan-50 text-cyan-700" : "bg-violet-50 text-violet-700"}`}>
                            Consent {row.consentOk ? "ok" : "missing"}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 ${active ? "bg-white/10 text-slate-100" : row.demographicsOk ? "bg-cyan-50 text-cyan-700" : "bg-violet-50 text-violet-700"}`}>
                            Demographics {row.demographicsOk ? "ok" : "missing"}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 ${active ? "bg-white/10 text-slate-100" : row.questionnairesOk ? "bg-cyan-50 text-cyan-700" : "bg-violet-50 text-violet-700"}`}>
                            Questionnaires {row.questionnairesOk ? "ok" : "incomplete"}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 ${active ? "bg-white/10 text-slate-100" : row.cognitiveOk ? "bg-cyan-50 text-cyan-700" : "bg-violet-50 text-violet-700"}`}>
                            Cognitive {row.cognitiveOk ? "ok" : "incomplete"}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 ${active ? "bg-white/10 text-slate-100" : "bg-slate-100 text-slate-600"}`}>
                            {row.flags.length} flag{row.flags.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
                {filteredReviewRows.length > 18 && (
                  <p className="px-1 text-xs text-slate-400">
                    Showing the first 18 participants for visual review. Use Data Explorer or Export Data for the full dataset.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
                {!selectedReviewRow ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Select a participant from the queue to inspect their current completeness and quality summary.
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{selectedReviewRow.participantLabel}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Status: {selectedReviewRow.participant.status.replaceAll("_", " ")}
                        </p>
                      </div>
                      <Status
                        type={
                          selectedReviewRow.stage === "ready"
                            ? "success"
                            : selectedReviewRow.stage === "review"
                              ? "warning"
                              : "accent"
                        }
                      >
                        {selectedReviewRow.stage === "ready"
                          ? "Primary sample preview: ready"
                          : selectedReviewRow.stage === "review"
                            ? "Primary sample preview: review"
                            : "Primary sample preview: incomplete"}
                      </Status>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Consent</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{selectedReviewRow.consentOk ? "Recorded" : "Missing"}</p>
                      </div>
                      <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Demographics</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{selectedReviewRow.demographicsOk ? "Complete" : "Needs attention"}</p>
                      </div>
                      <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Questionnaires</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{selectedReviewRow.questionnairesOk ? "Complete" : "Incomplete"}</p>
                      </div>
                      <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Cognitive tasks</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{selectedReviewRow.cognitiveOk ? "Complete" : "Incomplete"}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1fr_.95fr]">
                      <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-900">Review reasons</p>
                        {selectedReviewRow.reviewReasons.length === 0 ? (
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            No current review reasons. This participant is ready in the current primary-sample preview.
                          </p>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedReviewRow.reviewReasons.map((reason) => (
                              <span
                                key={reason}
                                className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                        <p className="text-sm font-semibold text-slate-900">Session summary</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <div className="flex items-center justify-between gap-3">
                            <span>Participant sessions</span>
                            <span className="font-medium text-slate-900">{Number(selectedReviewRow.summary.participant_sessions ?? 0)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Incomplete sessions</span>
                            <span className="font-medium text-slate-900">{selectedReviewRow.incompleteSessions}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Ambulatory compliance</span>
                            <span className="font-medium text-slate-900">
                              {selectedReviewRow.summary.ambulatory_compliance_percent === ""
                                ? "—"
                                : `${selectedReviewRow.summary.ambulatory_compliance_percent}%`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Cognitive quality flags</span>
                            <span className="font-medium text-slate-900">{Number(selectedReviewRow.summary.cognitive_quality_flags ?? 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Detailed quality flags</p>
                      {selectedReviewRow.flags.length === 0 ? (
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          No detailed quality flags are currently stored for this participant.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {selectedReviewRow.flags.map((flag, index) => (
                            <div key={`${String(flag.flag_code)}-${index}`} className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{String(flag.flag_label || flag.flag_code || "Quality flag")}</p>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">{String(flag.domain || "")}</p>
                                </div>
                                <Status type={String(flag.severity || "review") === "warning" ? "warning" : "accent"}>
                                  {String(flag.severity || "review")}
                                </Status>
                              </div>
                              {flag.detail ? (
                                <p className="mt-2 text-sm leading-6 text-slate-600">{String(flag.detail)}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Panel>

      <Panel
        title="Saved analysis samples"
        description="Create reproducible participant sets for primary, per-protocol or sensitivity analyses. Quality flags guide review, but only researcher decisions change a saved sample."
      >
        {sampleError && (
          <div className="mb-4 border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1 text-sm text-slate-600">
            {sampleError}
          </div>
        )}
        {sampleActionError && (
          <div className="mb-4 border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1 text-sm text-slate-600">
            {sampleActionError}
          </div>
        )}
        {sampleActionMessage && (
          <div className="mb-4 border-l-2 border-cyan-400 bg-transparent py-1 pl-3 pr-1 text-sm text-slate-600">
            {sampleActionMessage}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Create analysis sample</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    New samples begin with all current live participants included. Review/exclude decisions are always explicit.
                  </p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  No auto-exclusion
                </span>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold text-slate-600">Sample name</span>
                <input
                  value={newSampleName}
                  onChange={(event) => setNewSampleName(event.target.value)}
                  className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                  placeholder="Primary analysis"
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["primary", "Primary"],
                  ["per_protocol", "Per-protocol"],
                  ["sensitivity", "Sensitivity"],
                  ["custom", "Custom"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setNewSampleType(value as typeof newSampleType);
                      if (value === "primary") setNewSampleName("Primary analysis");
                      if (value === "per_protocol") setNewSampleName("Per-protocol");
                      if (value === "sensitivity") setNewSampleName("Sensitivity analysis");
                      if (value === "custom" && newSampleName === "Primary analysis") setNewSampleName("Custom sample");
                    }}
                    className={`rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] px-3 py-2 text-xs font-semibold ${
                      newSampleType === value
                        ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                        : "border-slate-300/70 bg-white text-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void createAnalysisSample()}
                disabled={sampleSaving || !selectedStudyId || liveParticipants.length === 0}
                className="mt-4 w-full rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)] disabled:opacity-50"
              >
                {sampleSaving ? "Saving..." : "Create sample"}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Saved samples</p>
                {loadingSamples && <span className="text-xs text-slate-400">Loading...</span>}
              </div>
              {analysisSamples.length === 0 ? (
                <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-dashed border-slate-300/70 bg-white p-4 text-sm leading-6 text-slate-500">
                  No saved sample yet. Create one above when you are ready to formalize participant inclusion decisions.
                </div>
              ) : (
                analysisSamples.map((sample) => {
                  const sampleMembers = analysisSampleMembers.filter((member) => member.sample_id === sample.id);
                  const included = sampleMembers.filter((member) => member.decision === "include").length;
                  const review = sampleMembers.filter((member) => member.decision === "review").length;
                  const excluded = sampleMembers.filter((member) => member.decision === "exclude").length;
                  const active = selectedAnalysisSample?.id === sample.id;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => {
                        setSelectedAnalysisSampleId(sample.id);
                        setSampleActionError("");
                        setSampleActionMessage("");
                      }}
                      className={`w-full rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] p-4 text-left transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300/70 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-semibold ${active ? "text-white" : "text-slate-900"}`}>{sample.name}</p>
                          <p className={`mt-1 text-[11px] uppercase tracking-wide ${active ? "text-slate-300" : "text-slate-400"}`}>
                            {sample.sample_type.replaceAll("_", " ")}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>
                          n={included}
                        </span>
                      </div>
                      <div className={`mt-3 flex gap-3 text-[11px] ${active ? "text-slate-300" : "text-slate-500"}`}>
                        <span>{included} included</span>
                        <span>{review} review</span>
                        <span>{excluded} excluded</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
            {!selectedAnalysisSample ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl bg-slate-50 p-6 text-center">
                <div>
                  <p className="font-semibold text-slate-900">Create or select an analysis sample</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Saved samples turn the visual review process into a reproducible researcher-controlled participant set.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{selectedAnalysisSample.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Updated {new Date(selectedAnalysisSample.updated_at).toLocaleString()} · current live recruitment is not silently added after sample creation.
                    </p>
                  </div>
                  {notYetInSampleCount > 0 ? (
                    <button
                      type="button"
                      disabled={sampleSaving}
                      onClick={() => void addCurrentLiveParticipantsToSample()}
                      className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 disabled:opacity-50"
                    >
                      Add {notYetInSampleCount} newer participant{notYetInSampleCount === 1 ? "" : "s"}
                    </button>
                  ) : (
                    <Status type="success">Current recruitment represented</Status>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-cyan-200 bg-cyan-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">Included</p>
                    <p className="mt-1 text-2xl font-semibold text-cyan-950">{includedSampleCount}</p>
                  </div>
                  <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-[#d8d1f6] bg-[#f8f6ff] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">Review</p>
                    <p className="mt-1 text-2xl font-semibold text-violet-950">{reviewSampleCount}</p>
                  </div>
                  <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-rose-200 bg-rose-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Excluded</p>
                    <p className="mt-1 text-2xl font-semibold text-rose-950">{excludedSampleCount}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                  <div className="max-h-[470px] space-y-2 overflow-auto rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 p-3">
                    {liveParticipants.map((participant) => {
                      const member = selectedSampleMemberMap.get(participant.id);
                      const preview = reviewRows.find((row) => row.participant.id === participant.id);
                      const active = sampleParticipantId === participant.id;
                      const decision = member?.decision || "not_added";
                      return (
                        <button
                          key={participant.id}
                          type="button"
                          onClick={() => setSampleParticipantId(participant.id)}
                          className={`w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] px-3 py-3 text-left transition ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300/70 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className={`text-sm font-semibold ${active ? "text-white" : "text-slate-900"}`}>{participant.public_id}</p>
                              <p className={`mt-1 text-[11px] ${active ? "text-slate-300" : "text-slate-400"}`}>
                                System preview: {preview?.stage || "—"}
                              </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              active
                                ? "bg-white/10 text-white"
                                : decision === "include"
                                  ? "bg-cyan-50 text-cyan-700"
                                  : decision === "exclude"
                                    ? "bg-rose-50 text-rose-700"
                                    : decision === "review"
                                      ? "bg-violet-50 text-violet-700"
                                      : "bg-slate-100 text-slate-500"
                            }`}>
                              {decision.replaceAll("_", " ")}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                    {!sampleParticipantId ? (
                      <p className="text-sm text-slate-500">Select a participant to edit their sample decision.</p>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {liveParticipants.find((participant) => participant.id === sampleParticipantId)?.public_id || "Participant"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Sample decisions are independent from the automatic quality-preview labels. You remain in control.
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            ["include", "Include"],
                            ["review", "Review"],
                            ["exclude", "Exclude"],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setSampleDecision(value as "include" | "review" | "exclude")}
                              className={`rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] px-3 py-2.5 text-xs font-semibold ${
                                sampleDecision === value
                                  ? value === "include"
                                    ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                                    : value === "review"
                                      ? "border-violet-500 bg-violet-50 text-violet-800"
                                      : "border-rose-500 bg-rose-50 text-rose-800"
                                  : "border-slate-300/70 bg-white text-slate-500"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        <label className="block">
                          <span className="text-xs font-semibold text-slate-600">
                            Reason {sampleDecision === "include" ? "(optional)" : "(required)"}
                          </span>
                          <select
                            value={sampleReason}
                            onChange={(event) => setSampleReason(event.target.value)}
                            className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                          >
                            <option value="">Select a reason</option>
                            <option value="Missing required data">Missing required data</option>
                            <option value="Technical failure">Technical failure</option>
                            <option value="High omission rate">High omission rate</option>
                            <option value="Timing or visibility issue">Timing or visibility issue</option>
                            <option value="Protocol deviation">Protocol deviation</option>
                            <option value="Participant withdrawal or request">Participant withdrawal or request</option>
                            <option value="Researcher review decision">Researcher review decision</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs font-semibold text-slate-600">Researcher note</span>
                          <textarea
                            value={sampleNotes}
                            onChange={(event) => setSampleNotes(event.target.value)}
                            rows={4}
                            className="mt-2 w-full resize-y rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                            placeholder="Optional explanation, audit note or protocol reference..."
                          />
                        </label>

                        <button
                          type="button"
                          disabled={sampleSaving}
                          onClick={() => void saveSampleParticipantDecision()}
                          className="w-full rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)] disabled:opacity-50"
                        >
                          {sampleSaving ? "Saving..." : "Save participant decision"}
                        </button>

                        <p className="text-[11px] leading-5 text-slate-400">
                          Excluding a participant here only affects this saved analysis sample. Their raw questionnaire, cognitive, demographic, ambulatory and session data remain stored and exportable from the full dataset.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title="Latest questionnaire responses"
        description="Most recent stored item-level responses, including TEST records when present."
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading responses...</p>
        ) : recentResponses.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No questionnaire responses yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete a TEST participant flow or recruit participants to see
              responses here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">Participant</th>
                  <th className="pb-3 font-medium">Phase</th>
                  <th className="pb-3 font-medium">Questionnaire</th>
                  <th className="pb-3 font-medium">Item</th>
                  <th className="pb-3 font-medium">Response</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentResponses.map((response) => {
                  const participant = participantMap.get(
                    response.participant_id
                  );
                  const measure = researchMeasureForId(
                    bundle,
                    response.study_measure_id
                  );
                  const questionnaire = researchQuestionnaireForMeasure(
                    bundle,
                    measure || undefined
                  );
                  const item = researchItemForResponse(bundle, response);

                  return (
                    <tr key={response.id}>
                      <td className="py-4 pr-4 text-xs text-slate-500">
                        {new Date(response.answered_at).toLocaleString()}
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {participant?.public_id || "Unknown"}
                          </span>
                          {participant?.is_test && (
                            <Status type="warning">TEST</Status>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-slate-500">
                        {measure?.measurement_point || "—"}
                      </td>
                      <td className="py-4 pr-4 text-slate-500">
                        {questionnaire?.acronym ||
                          questionnaire?.name ||
                          "Unknown"}
                      </td>
                      <td className="max-w-[280px] py-4 pr-4 text-slate-500">
                        {item?.item_key ||
                          (item ? `Item ${item.position}` : "Unknown item")}
                      </td>
                      <td className="max-w-[300px] py-4 text-slate-700">
                        {researchShortValue(
                          response.text_value ??
                            response.numeric_value ??
                            response.response
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeScreen("explorer")}
            className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.04)]"
          >
            Open Data Explorer
          </button>

          <button
            type="button"
            onClick={() => changeScreen("exports")}
            className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(15,23,42,0.16)]"
          >
            Export study data
          </button>
        </div>
      </Panel>
    </div>
  );
}

function ResearchParticipantUploadActions({
  responseId,
  fileName,
  mimeType,
  sizeBytes,
}: {
  responseId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: unknown;
}) {
  const [opening, setOpening] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    url: string;
    name: string;
    mimeType: string;
  } | null>(null);

  async function requestFile(disposition: "view" | "download") {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your researcher session has expired. Please sign in again.");
    }

    const response = await fetch("/api/media/ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        action: "researcher_participant_read",
        responseId,
        disposition,
      }),
    });

    const result = (await response.json()) as {
      ok?: boolean;
      error?: string;
      signedUrl?: string;
      name?: string;
      mimeType?: string;
    };

    if (!response.ok || !result.ok || !result.signedUrl) {
      throw new Error(result.error || "Could not open this participant upload.");
    }

    return {
      url: result.signedUrl,
      name: result.name || fileName || "Participant upload",
      mimeType: result.mimeType || mimeType || "",
    };
  }

  async function openPreview() {
    if (opening) return;
    setOpening(true);
    setError("");

    try {
      const file = await requestFile("view");
      const canPreviewInline =
        file.mimeType.startsWith("image/") ||
        file.mimeType.startsWith("audio/") ||
        file.mimeType.startsWith("video/") ||
        file.mimeType === "application/pdf";

      if (canPreviewInline) {
        setPreview(file);
      } else {
        window.open(file.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not open this file.");
    } finally {
      setOpening(false);
    }
  }

  async function downloadFile() {
    if (downloading) return;
    setDownloading(true);
    setError("");

    try {
      const file = await requestFile("download");
      const anchor = document.createElement("a");
      anchor.href = file.url;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not download this file.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="min-w-[220px]">
        <p className="max-w-[260px] truncate text-xs font-medium text-slate-800" title={fileName}>
          {fileName || "Participant upload"}
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {mimeType || "Unknown type"} · {researchFormatBytes(sizeBytes)}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void openPreview()}
            disabled={opening || downloading}
            className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-cyan-300 hover:text-cyan-800 disabled:opacity-50"
          >
            {opening ? "Opening..." : "Preview"}
          </button>
          <button
            type="button"
            onClick={() => void downloadFile()}
            disabled={opening || downloading}
            className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {downloading ? "Preparing..." : "Download"}
          </button>
        </div>
        {error && (
          <p className="mt-2 max-w-[280px] whitespace-normal text-[11px] leading-4 text-red-700">
            {error}
          </p>
        )}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950">{preview.name}</p>
                <p className="mt-1 text-xs text-slate-400">{preview.mimeType || "Participant upload"}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-1.5 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            {preview.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.name}
                className="mx-auto max-h-[75vh] max-w-full rounded-xl object-contain"
              />
            ) : preview.mimeType.startsWith("audio/") ? (
              <audio controls src={preview.url} className="w-full" />
            ) : preview.mimeType.startsWith("video/") ? (
              <video controls src={preview.url} className="max-h-[75vh] w-full rounded-xl bg-black" />
            ) : preview.mimeType === "application/pdf" ? (
              <iframe
                src={preview.url}
                title={preview.name}
                className="h-[75vh] w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200"
              />
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   DATA EXPLORER
   ========================================================= */

function DataExplorer() {
  const {
    studies,
    selectedStudyId,
    setSelectedStudyId,
    selectedStudy,
    bundle,
    loading,
    error,
  } = useResearchDataWorkspace();

  const [datasetType, setDatasetType] =
    useState<ResearchDatasetType>("participant_summary");
  const [search, setSearch] = useState("");
  const [includeTestData, setIncludeTestData] = useState(false);
  const [showDirectIdentifiers, setShowDirectIdentifiers] =
    useState(false);
  const [showVariableDictionary, setShowVariableDictionary] = useState(false);
  const [copyTableStatus, setCopyTableStatus] = useState("");

  const rows = researchBuildRows(
    bundle,
    datasetType,
    "pseudonymous",
    includeTestData,
    showDirectIdentifiers
  );

  const searchQuery = search.trim().toLowerCase();

  const filteredRows = searchQuery
    ? rows.filter((row) =>
        Object.values(row).some((value) =>
          researchValueText(value).toLowerCase().includes(searchQuery)
        )
      )
    : rows;

  const displayedRows = filteredRows.slice(0, 250);
  const columns = Array.from(
    new Set(displayedRows.flatMap((row) => Object.keys(row)))
  );
  const allFilteredColumns = Array.from(
    new Set(filteredRows.flatMap((row) => Object.keys(row)))
  );
  const displayColumns =
    datasetType === "participant_uploads"
      ? [...columns, "__file_actions"]
      : columns;

  const codebook = researchBuildCodebook(
    bundle,
    datasetType,
    showDirectIdentifiers
  );

  function researchClipboardCell(value: unknown) {
    return researchValueText(value)
      .replace(/\t/g, " ")
      .replace(/\r?\n/g, " ")
      .trim();
  }

  async function copyEntireFilteredTable() {
    if (filteredRows.length === 0 || allFilteredColumns.length === 0) return;

    const text = [
      allFilteredColumns.join("\t"),
      ...filteredRows.map((row) =>
        allFilteredColumns
          .map((column) => researchClipboardCell(row[column]))
          .join("\t")
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyTableStatus(
        `Copied all ${filteredRows.length} row${filteredRows.length === 1 ? "" : "s"}`
      );
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      setCopyTableStatus(
        `Copied all ${filteredRows.length} row${filteredRows.length === 1 ? "" : "s"}`
      );
    }

    window.setTimeout(() => setCopyTableStatus(""), 2200);
  }

  return (
    <div className="space-y-5">
      <Panel
        title="Data Explorer"
        description="Inspect real participant, demographic, questionnaire, score, consent and secure participant-upload records for one study."
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <label>
            <span className="text-sm font-medium">Study</span>
            <select
              value={selectedStudyId}
              onChange={(event) => setSelectedStudyId(event.target.value)}
              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
            >
              {studies.map((study) => (
                <option key={study.id} value={study.id}>
                  {study.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Dataset</span>
            <select
              value={datasetType}
              onChange={(event) =>
                setDatasetType(
                  event.target.value as ResearchDatasetType
                )
              }
              className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
            >
              {Object.entries(researchDatasetLabels).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search participant ID, variable, item or response..."
            className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
          />

          <label className="flex items-center gap-2 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-xs">
            <input
              type="checkbox"
              checked={includeTestData}
              onChange={(event) =>
                setIncludeTestData(event.target.checked)
              }
            />
            Include TEST data
          </label>

          <label className="flex items-center gap-2 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-3 text-xs">
            <input
              type="checkbox"
              checked={showDirectIdentifiers}
              onChange={(event) =>
                setShowDirectIdentifiers(event.target.checked)
              }
            />
            Show direct identifiers
          </label>
        </div>

        {selectedStudy && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Status type="accent">
              {researchDatasetLabels[datasetType]}
            </Status>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {filteredRows.length} row
              {filteredRows.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => setShowVariableDictionary((current) => !current)}
              className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-2.5 py-1 text-[11px] font-semibold transition ${
                showVariableDictionary
                  ? "border-cyan-300/70 bg-[#ecfbff] text-cyan-900"
                  : "border-slate-300/70 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
              aria-expanded={showVariableDictionary}
            >
              {showVariableDictionary ? "Hide variables" : `Variables · ${codebook.length}`}
            </button>
          </div>
        )}
      </Panel>

      {error && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm leading-6 text-red-700">{error}</p>
        </div>
      )}

      <Panel
        title="Dataset"
        description={
          filteredRows.length > 250
            ? `Showing the first 250 of ${filteredRows.length} matching rows. Copy table copies all ${filteredRows.length} matching rows.`
            : "The table below is generated from the selected study's stored data."
        }
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Copy uses the rows currently shown in this preview after search and filters.
          </p>
          <div className="flex items-center gap-2">
            {copyTableStatus && (
              <span className="text-xs font-medium text-cyan-700">
                {copyTableStatus}
              </span>
            )}
            <button
              type="button"
              onClick={() => void copyEntireFilteredTable()}
              disabled={loading || filteredRows.length === 0}
              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-300/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Copy table
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading study data...</p>
        ) : displayedRows.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No rows in this dataset</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Try another dataset, include TEST data, or collect participant
              responses first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-400">
                <tr>
                  {displayColumns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap pb-3 pr-5 font-medium"
                    >
                      {column === "__file_actions" ? "File access" : column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {displayColumns.map((column) => {
                      if (column === "__file_actions") {
                        return (
                          <td key={column} className="py-4 pr-5 align-top">
                            <ResearchParticipantUploadActions
                              responseId={String(row.response_id || "")}
                              fileName={String(row.file_name || "Participant upload")}
                              mimeType={String(row.mime_type || "")}
                              sizeBytes={row.size_bytes}
                            />
                          </td>
                        );
                      }

                      return (
                        <td
                          key={column}
                          className="max-w-[360px] whitespace-nowrap py-4 pr-5 text-slate-600"
                          title={researchValueText(row[column])}
                        >
                          {column === "size_bytes"
                            ? researchFormatBytes(row[column])
                            : researchShortValue(row[column], 70)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {showVariableDictionary && (
        <Panel
          title="Variable dictionary"
          description="Variables are generated from the study configuration and the exact questionnaire versions attached to the study."
        >
        {codebook.length === 0 ? (
          <p className="text-sm text-slate-500">
            No variables are available for this dataset yet.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {codebook.slice(0, 80).map((variable) => (
              <div
                key={`${variable.source}-${variable.variable}`}
                className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4"
              >
                <code className="break-all text-sm font-semibold text-cyan-800">
                  {variable.variable}
                </code>

                <p className="mt-2 text-sm">{variable.label}</p>

                <p className="mt-1 text-xs text-slate-400">
                  {variable.type} · {variable.source}
                </p>

                {variable.notes && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {variable.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {codebook.length > 80 && (
          <p className="mt-4 text-xs text-slate-400">
            Showing the first 80 variables. Download the codebook from Export
            Data for the complete dictionary.
          </p>
        )}
      </Panel>
      )}

      <ResearchCognitiveDataPanel bundle={bundle} />

      <ResearchCognitiveAnalysisPanel bundle={bundle} />

      {selectedStudy && (
        <ResearchAiAssistant
          studyId={selectedStudy.id}
          studyTitle={selectedStudy.title}
        />
      )}

      {selectedStudy?.components?.ambulatory && (
        <ResearchAmbulatoryDataPanel
          studyId={selectedStudy.id}
        />
      )}
    </div>
  );
}

/* =========================================================
   EXPORT DATA
   ========================================================= */

function ExportData() {
  const {
    studies,
    selectedStudyId,
    setSelectedStudyId,
    selectedStudy,
    bundle,
    setBundle,
    loading,
    error,
  } = useResearchDataWorkspace();

  const {
    samples: exportAnalysisSamples,
    members: exportAnalysisSampleMembers,
    loadingSamples: loadingExportSamples,
    sampleError: exportSampleError,
  } = useResearchAnalysisSamples(selectedStudyId);
  const [selectedExportSampleId, setSelectedExportSampleId] = useState("all");

  const selectedExportSample =
    exportAnalysisSamples.find((sample) => sample.id === selectedExportSampleId) ||
    null;
  const selectedExportMembers = selectedExportSample
    ? exportAnalysisSampleMembers.filter(
        (member) => member.sample_id === selectedExportSample.id
      )
    : [];
  const includedExportParticipantIds = new Set(
    selectedExportMembers
      .filter((member) => member.decision === "include")
      .map((member) => member.participant_id)
  );
  const includedExportParticipantKey = Array.from(
    includedExportParticipantIds
  )
    .sort()
    .join("|");
  const exportBundle = useMemo(
    () =>
      selectedExportSample
        ? researchFilterBundleToParticipantIds(
            bundle,
            includedExportParticipantIds
          )
        : bundle,
    [bundle, selectedExportSample?.id, includedExportParticipantKey]
  );

  const [datasetType, setDatasetType] =
    useState<ResearchDatasetType>("analysis_wide");
  const [format, setFormat] =
    useState<"csv" | "json" | "xlsx">("xlsx");
  const [workbookTitle, setWorkbookTitle] = useState("PsyLattice research export");
  const [dataSheetName, setDataSheetName] = useState("Data");
  const [includeCodebookSheet, setIncludeCodebookSheet] = useState(true);
  const [columnConfig, setColumnConfig] = useState<
    Array<{
      source: string;
      label: string;
      enabled: boolean;
    }>
  >([]);
  const [identityMode, setIdentityMode] =
    useState<ResearchIdentityMode>("pseudonymous");
  const [includeTestData, setIncludeTestData] = useState(false);
  const [includeDirectIdentifiers, setIncludeDirectIdentifiers] =
    useState(false);
  const [identifierConfirmed, setIdentifierConfirmed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [visualExportPreset, setVisualExportPreset] =
    useState<ResearchVisualExportPreset>("complete");

  useEffect(() => {
    if (!includeDirectIdentifiers) {
      setIdentifierConfirmed(false);
    }
  }, [includeDirectIdentifiers]);

  useEffect(() => {
    if (selectedExportSampleId !== "all") {
      setIncludeTestData(false);
    }
  }, [selectedExportSampleId]);

  const visualExportPresets: Array<{
    id: ResearchVisualExportPreset;
    name: string;
    eyebrow: string;
    description: string;
    mode: ResearchWorkbookMode;
    recommended?: boolean;
    sheetNames?: string[];
  }> = [
    {
      id: "complete",
      name: "Complete research archive",
      eyebrow: "Everything together",
      description:
        "Clean analysis sheets + complete raw observations + documentation. Best for archiving, handover and reproducibility.",
      mode: "complete",
      recommended: true,
    },
    {
      id: "analysis",
      name: "Thesis / analysis workbook",
      eyebrow: "Clean and practical",
      description:
        "Analysis-ready participant, questionnaire, cognitive and ambulatory summaries without the large raw observation tables.",
      mode: "clean",
    },
    {
      id: "stats",
      name: "SPSS · jamovi · JASP",
      eyebrow: "Statistics-ready",
      description:
        "A compact one-row-per-participant analysis file with quality review, variable mapping, import guide and codebook.",
      mode: "clean",
      sheetNames: [
        "README",
        "Manifest",
        "Analysis_Compatible",
        "Data_Quality",
        "Quality_Flags",
        "Questionnaire_Scores",
        "Cognitive_Summary",
        "Cognitive_Conditions",
        "Variable_Map",
        "Import_Guide",
        "Codebook",
      ],
    },
    {
      id: "raw",
      name: "Raw reproducibility archive",
      eyebrow: "Lossless observations",
      description:
        "Raw questionnaire responses, cognitive trials/timing, ambulatory records, participant sessions and consent metadata.",
      mode: "raw",
    },
  ];

  const selectedVisualExportPreset =
    visualExportPresets.find((preset) => preset.id === visualExportPreset) ||
    visualExportPresets[0];

  function filterPresetSheets(
    sheets: ResearchWorkbookSheet[],
    preset: (typeof visualExportPresets)[number]
  ) {
    if (!preset.sheetNames) return sheets;
    const allowed = new Set(preset.sheetNames);
    const filtered = sheets.filter((sheet) => allowed.has(sheet.name));

    return filtered.map((sheet) =>
      sheet.name === "Manifest"
        ? {
            ...sheet,
            rows: sheet.rows.filter((row) =>
              allowed.has(String(row.sheet ?? ""))
            ),
          }
        : sheet
    );
  }

  const workbookPreviewSheets = useMemo(
    () =>
      selectedStudy
        ? filterPresetSheets(
            researchBuildUniversalWorkbook(
              exportBundle,
              selectedStudy,
              selectedVisualExportPreset.mode,
              identityMode,
              includeTestData,
              includeDirectIdentifiers
            ),
            selectedVisualExportPreset
          )
        : [],
    [
      exportBundle,
      selectedStudy,
      visualExportPreset,
      identityMode,
      includeTestData,
      includeDirectIdentifiers,
    ]
  );

  const workbookPreviewDataRows = workbookPreviewSheets
    .filter((sheet) => sheet.kind === "clean" || sheet.kind === "raw")
    .reduce((sum, sheet) => sum + sheet.rows.length, 0);
  const workbookPreviewParticipantCount = researchFilteredParticipants(
    exportBundle,
    includeTestData
  ).length;
  const workbookPreviewCleanSheets = workbookPreviewSheets.filter(
    (sheet) => sheet.kind === "clean"
  ).length;
  const workbookPreviewRawSheets = workbookPreviewSheets.filter(
    (sheet) => sheet.kind === "raw"
  ).length;
  const workbookPreviewDocumentationSheets = workbookPreviewSheets.filter(
    (sheet) => sheet.kind === "meta" || sheet.kind === "codebook"
  ).length;

  const previewRows = researchBuildRows(
    exportBundle,
    datasetType,
    identityMode,
    includeTestData,
    includeDirectIdentifiers
  );

  const codebook = researchBuildCodebook(
    exportBundle,
    datasetType,
    includeDirectIdentifiers
  );

  const participantQuestionnaireFields =
    researchParticipantSummaryQuestionnaireFields(exportBundle);
  const analysisQuestionnaireFields =
    researchAnalysisQuestionnaireFields(exportBundle);

  const questionnaireLabelMap = new Map(
    [...participantQuestionnaireFields, ...analysisQuestionnaireFields].map(
      (field) => [field.source, field.label]
    )
  );

  const questionnaireFieldsForExport: Array<
    ResearchParticipantSummaryQuestionnaireField |
    ResearchAnalysisQuestionnaireField
  > =
    datasetType === "analysis_wide"
      ? analysisQuestionnaireFields
      : participantQuestionnaireFields;

  const questionnaireFieldSourceSet = new Set(
    questionnaireFieldsForExport.map(
      (field) => field.source
    )
  );

  const questionnaireGroupsForExport = Array.from(
    questionnaireFieldsForExport.reduce(
      (groups, field) => {
        const current = groups.get(field.measureId);

        if (current) {
          current.fields.push(field);
        } else {
          groups.set(field.measureId, {
            measureId: field.measureId,
            label: field.groupLabel,
            fields: [field],
          });
        }

        return groups;
      },
      new Map<
        string,
        {
          measureId: string;
          label: string;
          fields: Array<
            ResearchParticipantSummaryQuestionnaireField |
            ResearchAnalysisQuestionnaireField
          >;
        }
      >()
    ).values()
  );

  const availableColumns = Array.from(
    new Set(
      previewRows.flatMap((row) =>
        Object.keys(row)
      )
    )
  );

  useEffect(() => {
    setColumnConfig((current) => {
      const currentMap = new Map(
        current.map((column) => [
          column.source,
          column,
        ])
      );

      return availableColumns.map((source) => {
        const existing = currentMap.get(source);

        return (
          existing || {
            source,
            label:
              datasetType === "participant_summary" ||
              datasetType === "analysis_wide"
                ? questionnaireLabelMap.get(
                    source
                  ) || source
                : source,
            enabled: true,
          }
        );
      });
    });
  }, [
    selectedStudyId,
    datasetType,
    availableColumns.join("|"),
  ]);

  const selectedColumns =
    columnConfig.filter(
      (column) => column.enabled
    );

  const shapedRows = previewRows.map((row) => {
    const shaped: ResearchTableRow = {};

    for (const column of selectedColumns) {
      shaped[column.label || column.source] =
        row[column.source];
    }

    return shaped;
  });

  function updateColumn(
    source: string,
    patch: Partial<{
      label: string;
      enabled: boolean;
    }>
  ) {
    setColumnConfig((current) =>
      current.map((column) =>
        column.source === source
          ? {
              ...column,
              ...patch,
            }
          : column
      )
    );
  }

  function updateQuestionnaireGroup(
    measureId: string,
    enabled: boolean
  ) {
    const sources = new Set(
      questionnaireFieldsForExport
        .filter(
          (field) =>
            field.measureId === measureId
        )
        .map((field) => field.source)
    );

    setColumnConfig((current) =>
      current.map((column) =>
        sources.has(column.source)
          ? {
              ...column,
              enabled,
            }
          : column
      )
    );
  }

  function moveColumn(
    source: string,
    direction: -1 | 1
  ) {
    setColumnConfig((current) => {
      const index = current.findIndex(
        (column) =>
          column.source === source
      );

      const target = index + direction;

      if (
        index < 0 ||
        target < 0 ||
        target >= current.length
      ) {
        return current;
      }

      const next = [...current];

      [next[index], next[target]] = [
        next[target],
        next[index],
      ];

      return next;
    });
  }

  async function downloadXlsx(
    rows: ResearchTableRow[]
  ) {
    if (!selectedStudy) {
      return;
    }

    const codebookRows = codebook.map(
      (variable) => ({
        Variable: variable.variable,
        Label: variable.label,
        Type: variable.type,
        Source: variable.source,
        Questionnaire: variable.questionnaire || "",
        Phase: variable.phase || "",
        Item_Key: variable.item_key || "",
        Item_Position: variable.item_position ?? "",
        Response_Type: variable.response_type || "",
        Component: variable.component || "",
        Value_Labels: variable.value_labels || "",
        Required: variable.required ?? "",
        Reverse_Scored: variable.reverse_scored ?? "",
        Storage: variable.storage || "",
        Notes: variable.notes,
      })
    );

    const response = await fetch(
      "/api/research/export-xlsx",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          workbookTitle:
            workbookTitle.trim() ||
            selectedStudy.title,
          filename: `${researchFilename(
            selectedStudy.title
          )}-${researchSafeVariable(
            datasetType
          )}.xlsx`,
          sheets: [
            {
              name:
                dataSheetName.trim() ||
                "Data",
              rows,
            },
            ...(includeCodebookSheet
              ? [
                  {
                    name: "Codebook",
                    rows: codebookRows,
                  },
                ]
              : []),
          ],
        }),
      }
    );

    if (!response.ok) {
      const payload =
        await response
          .json()
          .catch(() => ({}));

      throw new Error(
        payload?.error ||
          "XLSX export could not be generated."
      );
    }

    const blob = await response.blob();
    const url =
      URL.createObjectURL(blob);
    const link =
      document.createElement("a");

    link.href = url;
    link.download = `${researchFilename(
      selectedStudy.title
    )}-${researchSafeVariable(
      datasetType
    )}.xlsx`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  }

  async function downloadUniversalWorkbook(
    mode: ResearchWorkbookMode,
    preset: (typeof visualExportPresets)[number] = selectedVisualExportPreset
  ) {
    if (!selectedStudy || exporting) return;

    setExporting(true);
    setExportError("");
    setExportMessage("");

    if (includeDirectIdentifiers && !identifierConfirmed) {
      setExportError(
        "Confirm that you are authorised to export directly identifying participant fields."
      );
      setExporting(false);
      return;
    }

    const sheets = filterPresetSheets(
      researchBuildUniversalWorkbook(
        exportBundle,
        selectedStudy,
        mode,
        identityMode,
        includeTestData,
        includeDirectIdentifiers
      ),
      preset
    );
    const dataRowCount = sheets
      .filter((sheet) => sheet.kind === "clean" || sheet.kind === "raw")
      .reduce((sum, sheet) => sum + sheet.rows.length, 0);

    const timestamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");
    const filename = `${researchFilename(selectedStudy.title)}-${preset.id}-research-workbook-${timestamp}.xlsx`;

    try {
      const response = await fetch("/api/research/export-xlsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workbookTitle: `${selectedStudy.title} — PsyLattice ${preset.name}`,
          filename,
          sheets: sheets.map((sheet) => ({
            name: sheet.name,
            kind: sheet.kind,
            description: sheet.description,
            rows: sheet.rows,
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          payload?.error || "The universal Excel workbook could not be generated."
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      const savedLog = await logExport(dataRowCount, {
        datasetType: `universal_workbook_${mode}`,
        exportFormat: "xlsx",
        metadata: {
          workbook_mode: mode,
          export_preset: preset.id,
          export_preset_name: preset.name,
          worksheet_count: sheets.length,
          included_sheets: sheets.map((sheet) => sheet.name),
          analysis_sample_id: selectedExportSample?.id || null,
          analysis_sample_name: selectedExportSample?.name || "All live participants",
          analysis_sample_included_count: selectedExportSample
            ? includedExportParticipantIds.size
            : null,
        },
      });

      if (savedLog) {
        setBundle((previous) => ({
          ...previous,
          exportLogs: [
            savedLog,
            ...previous.exportLogs.filter((entry) => entry.id !== savedLog.id),
          ].slice(0, 25),
        }));
      }

      setExportMessage(
        `${preset.name} exported with ${sheets.length} worksheets and ${dataRowCount.toLocaleString()} data rows.`
      );
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "The universal Excel workbook could not be generated."
      );
    } finally {
      setExporting(false);
    }
  }

  async function logExport(
    rowCount: number,
    override?: {
      datasetType?: string;
      exportFormat?: "csv" | "json" | "xlsx";
      metadata?: Record<string, unknown>;
    }
  ) {
    if (!selectedStudyId) return null;

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data, error: logError } = await supabase
      .from("research_export_logs")
      .insert({
        study_id: selectedStudyId,
        owner_user_id: user.id,
        dataset_type: override?.datasetType || datasetType,
        export_format: override?.exportFormat || format,
        identity_mode: identityMode,
        include_test_data: includeTestData,
        include_direct_identifiers: includeDirectIdentifiers,
        row_count: rowCount,
        metadata: {
          study_title: selectedStudy?.title || "",
          codebook_variables: codebook.length,
          generated_client_side: true,
          analysis_sample_id: selectedExportSample?.id || null,
          analysis_sample_name: selectedExportSample?.name || "All live participants",
          ...(override?.metadata || {}),
        },
      })
      .select(
        "id, dataset_type, export_format, identity_mode, include_test_data, include_direct_identifiers, row_count, metadata, created_at"
      )
      .single();

    if (logError) {
      console.error("Could not save export log:", logError);
      return null;
    }

    return data as ResearchDataExportLog;
  }

  async function generateExport() {
    if (!selectedStudy || exporting) return;

    setExporting(true);
    setExportError("");
    setExportMessage("");

    if (includeDirectIdentifiers && !identifierConfirmed) {
      setExportError(
        "Confirm that you are authorised to export directly identifying participant fields."
      );
      setExporting(false);
      return;
    }

    const rows = shapedRows;

    if (rows.length === 0) {
      setExportError(
        "There are no rows to export with the current dataset and filters."
      );
      setExporting(false);
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    const baseName = `${researchFilename(
      selectedStudy.title
    )}-${researchSafeVariable(datasetType)}-${timestamp}`;

    try {
      if (format === "csv") {
        researchDownloadText(
          `${baseName}.csv`,
          researchRowsToCsv(rows),
          "text/csv;charset=utf-8"
        );
      } else if (format === "json") {
        researchDownloadText(
          `${baseName}.json`,
          JSON.stringify(
            {
              metadata: {
                platform: "PsyLattice",
                study_id: selectedStudy.id,
                study_title: selectedStudy.title,
                dataset: datasetType,
                dataset_label:
                  researchDatasetLabels[
                    datasetType
                  ],
                identity_mode:
                  identityMode,
                include_test_data:
                  includeTestData,
                include_direct_identifiers:
                  includeDirectIdentifiers,
                analysis_sample_id: selectedExportSample?.id || null,
                analysis_sample_name: selectedExportSample?.name || "All live participants",
                columns:
                  selectedColumns,
                generated_at:
                  new Date().toISOString(),
              },
              codebook,
              data: rows,
            },
            null,
            2
          ),
          "application/json;charset=utf-8"
        );
      } else {
        await downloadXlsx(rows);
      }
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "The export could not be generated."
      );
      setExporting(false);
      return;
    }

    const savedLog = await logExport(rows.length);

    if (savedLog) {
      setBundle((previous) => ({
        ...previous,
        exportLogs: [
          savedLog,
          ...previous.exportLogs.filter(
            (entry) => entry.id !== savedLog.id
          ),
        ].slice(0, 25),
      }));
    }

    setExportMessage(
      `${rows.length} row${rows.length === 1 ? "" : "s"} exported successfully.`
    );
    setExporting(false);
  }

  function downloadCodebook() {
    if (!selectedStudy) return;

    const rows = codebook.map((variable) => ({
      variable: variable.variable,
      label: variable.label,
      type: variable.type,
      source: variable.source,
      notes: variable.notes,
    }));

    if (rows.length === 0) {
      setExportError("There is no codebook to download for this dataset yet.");
      return;
    }

    researchDownloadText(
      `${researchFilename(
        selectedStudy.title
      )}-${researchSafeVariable(datasetType)}-codebook.csv`,
      researchRowsToCsv(rows),
      "text/csv;charset=utf-8"
    );
  }

  function repeatExportSettings(log: ResearchDataExportLog) {
    if (
      Object.prototype.hasOwnProperty.call(
        researchDatasetLabels,
        log.dataset_type
      )
    ) {
      setDatasetType(log.dataset_type as ResearchDatasetType);
    }

    setFormat(log.export_format);
    setIdentityMode(log.identity_mode);
    setIncludeTestData(log.include_test_data);
    setIncludeDirectIdentifiers(log.include_direct_identifiers);
    setIdentifierConfirmed(false);
    setExportMessage("");
    setExportError("");
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm leading-6 text-red-700">{error}</p>
        </div>
      )}

      {exportError && (
        <div className="border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm leading-6 text-red-700">{exportError}</p>
        </div>
      )}

      {exportMessage && (
        <div className="border-l-2 border-cyan-400 bg-transparent py-1 pl-3 pr-1">
          <p className="text-sm leading-6 text-cyan-800">
            {exportMessage}
          </p>
        </div>
      )}

      <Panel
        title="Export population"
        description="Choose whether this export uses the full current study dataset or one of your saved researcher-controlled analysis samples."
      >
        {exportSampleError && (
          <div className="mb-4 border-l-2 border-rose-400 bg-transparent py-1 pl-3 pr-1 text-sm text-slate-600">
            {exportSampleError}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
          <div>
            <label className="block">
              <span className="text-sm font-medium text-slate-800">Participants to export</span>
              <select
                value={selectedExportSampleId}
                onChange={(event) => setSelectedExportSampleId(event.target.value)}
                className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
              >
                <option value="all">All eligible study participants</option>
                {exportAnalysisSamples.map((sample) => {
                  const memberRows = exportAnalysisSampleMembers.filter(
                    (member) => member.sample_id === sample.id
                  );
                  const included = memberRows.filter(
                    (member) => member.decision === "include"
                  ).length;
                  return (
                    <option key={sample.id} value={sample.id}>
                      {sample.name} · {included} included
                    </option>
                  );
                })}
              </select>
            </label>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {selectedExportSample
                ? `Only participants explicitly marked Include in “${selectedExportSample.name}” will be exported. Review/excluded participants remain stored in PsyLattice and are not deleted.`
                : "Exports use the normal full study population/filter settings. Saved analysis samples remain available as optional reproducible subsets."}
            </p>
          </div>

          <div className={`rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] p-4 ${selectedExportSample ? "border-cyan-200 bg-cyan-50/60" : "border-slate-200 bg-slate-50"}`}>
            {loadingExportSamples ? (
              <p className="text-sm text-slate-500">Loading saved samples...</p>
            ) : selectedExportSample ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedExportSample.name}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{selectedExportSample.sample_type.replaceAll("_", " ")}</p>
                  </div>
                  <Status type="accent">Saved sample</Status>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white px-3 py-3">
                    <p className="text-lg font-semibold text-cyan-700">
                      {selectedExportMembers.filter((member) => member.decision === "include").length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Included</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3">
                    <p className="text-lg font-semibold text-violet-700">
                      {selectedExportMembers.filter((member) => member.decision === "review").length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Review</p>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3">
                    <p className="text-lg font-semibold text-rose-700">
                      {selectedExportMembers.filter((member) => member.decision === "exclude").length}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Excluded</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-900">Full study export</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Choose a saved analysis sample above when you want the Excel/CSV/JSON file to contain only a formal participant subset.
                </p>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title="Visual Export Center"
        description="Choose the purpose of the export, preview the exact workbook before download, then export with a clear record of sample, privacy settings, sheets and row counts."
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {visualExportPresets.map((preset) => {
            const active = preset.id === visualExportPreset;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setVisualExportPreset(preset.id)}
                className={`relative rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] p-5 text-left transition ${
                  active
                    ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                    : "border-slate-300/70 bg-white hover:border-slate-400"
                }`}
              >
                {preset.recommended && (
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                      active
                        ? "bg-white text-slate-950"
                        : "bg-cyan-100 text-cyan-900"
                    }`}
                  >
                    Recommended
                  </span>
                )}
                <p
                  className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                    active ? "text-cyan-300" : "text-slate-400"
                  }`}
                >
                  {preset.eyebrow}
                </p>
                <p
                  className={`mt-2 pr-16 text-sm font-semibold ${
                    active ? "text-white" : "text-slate-950"
                  }`}
                >
                  {preset.name}
                </p>
                <p
                  className={`mt-2 text-xs leading-5 ${
                    active ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">What will be exported?</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This summary reflects the current controls and selected saved sample.
                  </p>
                </div>
                <Status type="accent">Live preview</Status>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  [
                    "Study",
                    selectedStudy?.title || "No study selected",
                  ],
                  [
                    "Population",
                    selectedExportSample
                      ? selectedExportSample.name
                      : includeTestData
                        ? "All eligible + TEST participants"
                        : "All eligible live participants",
                  ],
                  [
                    "Participants",
                    workbookPreviewParticipantCount.toLocaleString(),
                  ],
                  [
                    "Identity",
                    identityMode === "anonymous"
                      ? "Anonymous export IDs"
                      : "PsyLattice pseudonymous IDs",
                  ],
                  [
                    "Direct identifiers",
                    includeDirectIdentifiers ? "Included" : "Excluded",
                  ],
                  [
                    "TEST data",
                    includeTestData ? "Included" : "Excluded",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-2.5 last:border-0 last:pb-0"
                  >
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="max-w-[65%] text-right text-xs font-semibold text-slate-900">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-4">
                <p className="text-2xl font-semibold text-slate-950">{workbookPreviewSheets.length}</p>
                <p className="mt-1 text-xs text-slate-500">Worksheets</p>
              </div>
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-4">
                <p className="text-2xl font-semibold text-slate-950">{workbookPreviewDataRows.toLocaleString()}</p>
                <p className="mt-1 text-xs text-slate-500">Data rows</p>
              </div>
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-200 bg-cyan-50/60 p-4">
                <p className="text-2xl font-semibold text-cyan-800">{workbookPreviewCleanSheets}</p>
                <p className="mt-1 text-xs text-cyan-700">Clean sheets</p>
              </div>
              <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-[#d8d1f6] bg-[#f8f6ff]/60 p-4">
                <p className="text-2xl font-semibold text-violet-800">{workbookPreviewRawSheets}</p>
                <p className="mt-1 text-xs text-violet-700">Raw sheets</p>
              </div>
            </div>

            <button
              type="button"
              disabled={exporting || !selectedStudy || workbookPreviewParticipantCount === 0}
              onClick={() =>
                void downloadUniversalWorkbook(
                  selectedVisualExportPreset.mode,
                  selectedVisualExportPreset
                )
              }
              className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-left text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {exporting ? "Preparing workbook..." : `Download ${selectedVisualExportPreset.name}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    {workbookPreviewParticipantCount.toLocaleString()} participant{workbookPreviewParticipantCount === 1 ? "" : "s"} · {workbookPreviewSheets.length} sheets · {workbookPreviewDataRows.toLocaleString()} data rows
                  </p>
                </div>
                <span className="text-xl">↓</span>
              </div>
            </button>

            {includeDirectIdentifiers && !identifierConfirmed && (
              <div className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-[#d8d1f6] bg-[#f8f6ff] px-4 py-3 text-xs leading-5 text-violet-800">
                Direct identifiers are selected. Confirm authorisation in the privacy controls below before downloading.
              </div>
            )}
          </div>

          <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Workbook preview</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  These are the actual sheets that will be sent to the Excel generator. Empty sheets remain visible when their structure is meaningful.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-700">{workbookPreviewCleanSheets} clean</span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">{workbookPreviewRawSheets} raw</span>
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">{workbookPreviewDocumentationSheets} docs</span>
              </div>
            </div>

            <div className="mt-4 max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {workbookPreviewSheets.map((sheet, index) => {
                const kindClass =
                  sheet.kind === "raw"
                    ? "border-[#d8d1f6] bg-[#f8f6ff]/55"
                    : sheet.kind === "clean"
                      ? "border-cyan-200 bg-cyan-50/55"
                      : "border-[#d8d1f6] bg-[#f8f6ff]/50";
                const kindLabel =
                  sheet.kind === "raw"
                    ? "RAW"
                    : sheet.kind === "clean"
                      ? "CLEAN"
                      : "DOC";
                return (
                  <div
                    key={`${sheet.name}-${index}`}
                    className={`rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] px-4 py-3 ${kindClass}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">{sheet.name}</span>
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-bold tracking-wide text-slate-500">{kindLabel}</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500">{sheet.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-950">{sheet.rows.length.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">rows</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Privacy & identity controls</p>
              <p className="mt-1 text-xs text-slate-500">These settings update the workbook preview immediately.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIdentityMode("pseudonymous")}
                className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-1.5 text-xs font-semibold ${identityMode === "pseudonymous" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300/70 bg-white text-slate-600"}`}
              >
                Pseudonymous IDs
              </button>
              <button
                type="button"
                onClick={() => setIdentityMode("anonymous")}
                className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-1.5 text-xs font-semibold ${identityMode === "anonymous" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300/70 bg-white text-slate-600"}`}
              >
                Anonymous IDs
              </button>
              <button
                type="button"
                disabled={Boolean(selectedExportSample)}
                onClick={() => setIncludeTestData((current) => !current)}
                className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-1.5 text-xs font-semibold ${includeTestData ? "border-violet-300 bg-violet-100 text-violet-900" : "border-slate-300/70 bg-white text-slate-600"} disabled:opacity-40`}
              >
                {includeTestData ? "TEST included" : "TEST excluded"}
              </button>
              <button
                type="button"
                onClick={() => setIncludeDirectIdentifiers((current) => !current)}
                className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-1.5 text-xs font-semibold ${includeDirectIdentifiers ? "border-rose-300 bg-rose-100 text-rose-900" : "border-slate-300/70 bg-white text-slate-600"}`}
              >
                {includeDirectIdentifiers ? "Direct IDs included" : "Direct IDs excluded"}
              </button>
            </div>
          </div>

          {includeDirectIdentifiers && (
            <label className="mt-4 flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-rose-200 bg-white px-4 py-3">
              <input
                type="checkbox"
                checked={identifierConfirmed}
                onChange={(event) => setIdentifierConfirmed(event.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs leading-5 text-slate-600">
                I confirm that I am authorised to export directly identifying participant fields and understand that this file requires appropriate secure handling.
              </span>
            </label>
          )}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel
          title="Custom single-dataset export"
          description="Fine-tune one dataset when you do not need the complete study workbook."
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Study</span>
              <select
                value={selectedStudyId}
                onChange={(event) =>
                  setSelectedStudyId(event.target.value)
                }
                className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
              >
                {studies.map((study) => (
                  <option key={study.id} value={study.id}>
                    {study.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Dataset</span>
              <select
                value={datasetType}
                onChange={(event) =>
                  setDatasetType(
                    event.target.value as ResearchDatasetType
                  )
                }
                className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
              >
                {Object.entries(researchDatasetLabels).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">
                Participant identity
              </span>
              <select
                value={identityMode}
                onChange={(event) =>
                  setIdentityMode(
                    event.target.value as ResearchIdentityMode
                  )
                }
                className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-4 py-3 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
              >
                <option value="pseudonymous">
                  PsyLattice pseudonymous participant IDs
                </option>
                <option value="anonymous">
                  Export-scoped anonymous IDs
                </option>
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Anonymous mode replaces PsyLattice participant IDs with
                temporary ANON-0001 style identifiers while preserving
                within-file participant grouping.
              </p>
            </label>

            <div className="grid gap-3">
              <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={includeTestData}
                  onChange={(event) =>
                    setIncludeTestData(event.target.checked)
                  }
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">Include TEST data</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Off by default so test participation is excluded from
                    analysis exports.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-[#cfc6f6] bg-[#f7f5ff] p-4">
                <input
                  type="checkbox"
                  checked={includeDirectIdentifiers}
                  onChange={(event) =>
                    setIncludeDirectIdentifiers(event.target.checked)
                  }
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-violet-950">
                    Include demographic fields marked as direct identifiers
                  </p>
                  <p className="mt-1 text-xs leading-5 text-violet-800">
                    Off by default. Free-text questionnaire answers may still
                    contain participant-entered identifying information and
                    cannot be automatically de-identified reliably.
                  </p>
                </div>
              </label>

              {includeDirectIdentifiers && (
                <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-red-200 bg-red-50 p-4">
                  <input
                    type="checkbox"
                    checked={identifierConfirmed}
                    onChange={(event) =>
                      setIdentifierConfirmed(event.target.checked)
                    }
                    className="mt-1"
                  />
                  <span className="text-sm leading-6 text-red-800">
                    I confirm that I am authorised under the study protocol and
                    data-management plan to export directly identifying fields.
                  </span>
                </label>
              )}
            </div>

            <div>
              <p className="text-sm font-medium">File format</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["xlsx", "XLSX"],
                  ["csv", "CSV"],
                  ["json", "JSON + codebook"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormat(value as "csv" | "json" | "xlsx")
                    }
                    className={`rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] px-3 py-2 text-xs font-medium ${
                      format === value
                        ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/40 p-4">
              <p className="text-sm font-semibold text-cyan-950">
                Table designer
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                The Dataset selector above decides what each row represents.
                Here you decide which fields become columns, their order and
                the column titles used in the exported table.
              </p>

              {format === "xlsx" && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label>
                    <span className="text-xs font-medium text-slate-500">
                      Workbook title
                    </span>
                    <input
                      value={workbookTitle}
                      onChange={(event) =>
                        setWorkbookTitle(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                    />
                  </label>

                  <label>
                    <span className="text-xs font-medium text-slate-500">
                      Data sheet title
                    </span>
                    <input
                      value={dataSheetName}
                      onChange={(event) =>
                        setDataSheetName(
                          event.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white px-3 py-2.5 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
                    />
                  </label>

                  <label className="flex items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-3 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={includeCodebookSheet}
                      onChange={(event) =>
                        setIncludeCodebookSheet(
                          event.target.checked
                        )
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Add Codebook worksheet
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Adds variable labels, types, sources and notes as a
                        second XLSX sheet.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {datasetType === "analysis_wide" ? (
                  <>
                    {columnConfig
                      .filter(
                        (column) =>
                          !questionnaireFieldSourceSet.has(
                            column.source
                          )
                      )
                      .map((column, index, visibleColumns) => (
                        <div
                          key={column.source}
                          className="grid gap-2 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-3 md:grid-cols-[34px_1fr_1fr_auto] md:items-center"
                        >
                          <input
                            type="checkbox"
                            checked={column.enabled}
                            onChange={(event) =>
                              updateColumn(
                                column.source,
                                {
                                  enabled:
                                    event.target.checked,
                                }
                              )
                            }
                          />

                          <code className="break-all text-xs text-slate-500">
                            {column.source}
                          </code>

                          <input
                            value={column.label}
                            disabled={!column.enabled}
                            onChange={(event) =>
                              updateColumn(
                                column.source,
                                {
                                  label:
                                    event.target.value,
                                }
                              )
                            }
                            className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-2 text-xs disabled:bg-slate-50"
                          />

                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() =>
                                moveColumn(
                                  column.source,
                                  -1
                                )
                              }
                              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              disabled={
                                index ===
                                visibleColumns.length - 1
                              }
                              onClick={() =>
                                moveColumn(
                                  column.source,
                                  1
                                )
                              }
                              className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                      ))}

                    {questionnaireGroupsForExport.length > 0 && (
                      <div className="pt-2">
                        <div className="mb-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Questionnaires
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Select one checkbox per questionnaire. In the
                            exported file, that questionnaire expands into one
                            column per item response.
                          </p>
                        </div>

                        <div className="space-y-2">
                          {questionnaireGroupsForExport.map(
                            (group) => {
                              const groupSources = new Set(
                                group.fields.map(
                                  (field) => field.source
                                )
                              );

                              const groupColumns =
                                columnConfig.filter(
                                  (column) =>
                                    groupSources.has(
                                      column.source
                                    )
                                );

                              const enabled =
                                groupColumns.length > 0 &&
                                groupColumns.every(
                                  (column) =>
                                    column.enabled
                                );

                              return (
                                <label
                                  key={group.measureId}
                                  className={`flex cursor-pointer items-start gap-3 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] p-4 ${
                                    enabled
                                      ? "border-cyan-200 bg-cyan-50/50"
                                      : "border-slate-300/70 bg-white"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={enabled}
                                    onChange={(event) =>
                                      updateQuestionnaireGroup(
                                        group.measureId,
                                        event.target.checked
                                      )
                                    }
                                    className="mt-1"
                                  />

                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">
                                      {group.label}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {group.fields.length} item
                                      {group.fields.length === 1
                                        ? ""
                                        : "s"}
                                      {" → "}
                                      {group.fields.length} response column
                                      {group.fields.length === 1
                                        ? ""
                                        : "s"}{" "}
                                      in the exported file
                                    </p>
                                  </div>
                                </label>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  columnConfig.map((column, index) => (
                    <div
                      key={column.source}
                      className="grid gap-2 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-300/70 bg-white p-3 md:grid-cols-[34px_1fr_1fr_auto] md:items-center"
                    >
                      <input
                        type="checkbox"
                        checked={column.enabled}
                        onChange={(event) =>
                          updateColumn(
                            column.source,
                            {
                              enabled:
                                event.target.checked,
                            }
                          )
                        }
                      />

                      <code className="break-all text-xs text-slate-500">
                        {column.source}
                      </code>

                      <input
                        value={column.label}
                        disabled={!column.enabled}
                        onChange={(event) =>
                          updateColumn(
                            column.source,
                            {
                              label:
                                event.target.value,
                            }
                          )
                        }
                        className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-3 py-2 text-xs disabled:bg-slate-50"
                      />

                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() =>
                            moveColumn(
                              column.source,
                              -1
                            )
                          }
                          className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={
                            index ===
                            columnConfig.length - 1
                          }
                          onClick={() =>
                            moveColumn(
                              column.source,
                              1
                            )
                          }
                          className="rounded-lg border shadow-[0_3px_10px_rgba(15,23,42,0.05)] border-slate-200 px-2 py-1 text-xs disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {datasetType === "analysis_wide"
                  ? `${questionnaireGroupsForExport.filter((group) => {
                      const sources = new Set(
                        group.fields.map(
                          (field) => field.source
                        )
                      );

                      const columns =
                        columnConfig.filter(
                          (column) =>
                            sources.has(
                              column.source
                            )
                        );

                      return (
                        columns.length > 0 &&
                        columns.every(
                          (column) =>
                            column.enabled
                        )
                      );
                    }).length} of ${questionnaireGroupsForExport.length} questionnaires selected · ${selectedColumns.length} exported columns`
                  : `${selectedColumns.length} of ${availableColumns.length} columns selected.`}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Current export</p>
              <p className="mt-1 font-medium">
                {researchDatasetLabels[datasetType]}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {loading
                  ? "Calculating rows..."
                  : `${shapedRows.length} row${
                      shapedRows.length === 1 ? "" : "s"
                    } · ${codebook.length} codebook variable${
                      codebook.length === 1 ? "" : "s"
                    }`}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void generateExport()}
                disabled={exporting || loading || !selectedStudy}
                className="flex-1 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {exporting
                  ? "Generating..."
                  : `Download ${format.toUpperCase()}`}
              </button>

              <button
                type="button"
                onClick={downloadCodebook}
                disabled={loading || !selectedStudy}
                className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-5 py-3 text-sm font-semibold disabled:opacity-40"
              >
                Download codebook CSV
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="What the exports contain">
          <div className="space-y-5">
            {[
              [
                "Analysis dataset — one row per participant",
                "Every selected questionnaire becomes analysis-ready scalar columns. Multi-select, ranking, Q-sort, constant-sum, best/worst, pairwise and matrix responses are expanded rather than buried inside one JSON cell.",
              ],
              [
                "Lossless questionnaire data",
                "One row per answered item preserves the original stored response plus display, numeric, text, score and identifier helpers, so complex custom responses are never discarded.",
              ],
              [
                "Demographic data",
                "Direct identifier fields are excluded by default.",
              ],
              [
                "Analysis codebook",
                "Generated from the exact study configuration with item keys, response types, value labels, complex-response components, required/reverse-scored flags and source metadata.",
              ],
              [
                "Ambulatory / EMA datasets",
                "Use lossless item-level responses, detailed check-in records, an analysis-wide dataset with one row per check-in, or participant-day compliance summaries. Complex EMA responses are expanded where possible while the original stored response is retained in long format.",
              ],
              [
                "XLSX table designer",
                "Choose the row unit through Dataset, then select, rename and reorder the exported columns. XLSX can include a separate codebook worksheet.",
              ],
              [
                "TEST separation",
                "TEST participants are excluded unless you explicitly include them.",
              ],
            ].map(([name, description]) => (
              <div key={name} className="flex gap-3">
                <span className="mt-1 text-cyan-700">
                  <CheckIcon />
                </span>

                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border shadow-[0_8px_24px_rgba(15,23,42,0.065),0_2px_6px_rgba(15,23,42,0.035)] border-cyan-100 bg-cyan-50/60 p-4">
            <p className="text-sm font-medium text-cyan-950">
              Current export architecture
            </p>
            <p className="mt-2 text-xs leading-5 text-cyan-900/70">
              Files are generated in the researcher's browser from data their
              authenticated account is authorised to read. Large studies will
              later benefit from server-side queued exports.
            </p>
          </div>
        </Panel>
      </div>

      <Panel
        title="Export history"
        description="A metadata log of exports generated from this study. PsyLattice does not retain a copy of the downloaded file in this stage."
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading export history...</p>
        ) : bundle.exportLogs.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No exports yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Generate your first CSV or JSON export and its settings will be
              recorded here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bundle.exportLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {researchDatasetLabels[
                        log.dataset_type as ResearchDatasetType
                      ] || log.dataset_type}
                    </p>
                    <Status type="accent">
                      {log.export_format.toUpperCase()}
                    </Status>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {new Date(log.created_at).toLocaleString()} ·{" "}
                    {log.row_count} row
                    {log.row_count === 1 ? "" : "s"} ·{" "}
                    {log.identity_mode}
                    {log.include_test_data ? " · TEST included" : ""}
                    {log.include_direct_identifiers
                      ? " · identifiers included"
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => repeatExportSettings(log)}
                  className="rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Repeat settings
                </button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* =========================================================
   ETHICS
   ========================================================= */

function EthicsConsent() {
  return (
    <div className="space-y-5">
      <Panel title="Ethics & study documentation">
        <div className="divide-y divide-slate-100">
          {[
            ["Ethics approval", "Approved protocol · valid until Mar 2027"],
            ["Participant information sheet", "Version 1.4"],
            ["Consent form", "Version 2.0"],
            ["Data management plan", "Updated 01 Aug 2026"],
          ].map(([name, detail]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status type="success">Current</Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Consent configuration">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Questionnaire responses",
              "Required for study participation",
              "Required",
            ],
            [
              "Ambulatory assessments",
              "Required for study protocol",
              "Required",
            ],
            [
              "Wearable sleep & activity",
              "Additional optional data source",
              "Optional",
            ],
            [
              "Future research reuse",
              "Separate consent required",
              "Optional",
            ],
          ].map(([name, description, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <Status type={status === "Required" ? "accent" : "neutral"}>
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   TEAM
   ========================================================= */

function TeamPermissions() {
  return (
    <div className="space-y-5">
      <Panel title="Research team">
        <div className="divide-y divide-slate-100">
          {[
            ["Priyangshu Das", "Study owner", "Full access"],
            ["Dr. R. Sen", "Supervisor", "Review + export"],
            ["A. Kumar", "Research assistant", "Recruitment only"],
          ].map(([name, role, permission]) => (
            <div
              key={name}
              className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_180px_150px] sm:items-center"
            >
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-slate-500">{role}</p>
              <Status>{permission}</Status>
            </div>
          ))}
        </div>

        <button className="mt-5 rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2.5 text-sm font-semibold shadow-[0_2px_6px_rgba(15,23,42,0.04)]">
          + Invite collaborator
        </button>
      </Panel>

      <Panel title="Permission model">
        <div className="space-y-5">
          {[
            [
              "Participant recruitment information",
              "Owner + explicitly approved research staff",
              "Restricted",
            ],
            [
              "Pseudonymous research dataset",
              "Approved project team",
              "Study scoped",
            ],
            [
              "Data export",
              "Owner / authorised analyst",
              "Controlled",
            ],
            [
              "Protocol editing after launch",
              "Requires a versioned study change",
              "Versioned",
            ],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex justify-between gap-5 rounded-xl border shadow-[0_5px_18px_rgba(15,23,42,0.06),0_1px_4px_rgba(15,23,42,0.035)] border-slate-200 p-4"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {detail}
                </p>
              </div>

              <span className="text-xs font-medium text-slate-500">
                {status}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   MAIN RESEARCH WORKSPACE
   ========================================================= */

export default function ResearcherWorkspace() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [editingStudyId, setEditingStudyId] = useState("");
  const [
    openCustomQuestionnaireBuilder,
    setOpenCustomQuestionnaireBuilder,
  ] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(
      "psylattice-research-sidebar-collapsed"
    );

    if (saved === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "psylattice-research-sidebar-collapsed",
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  function editStudy(studyId: string) {
    setEditingStudyId(studyId);
    setScreen("builder");
  }

  const currentNavigation = navigation.find((item) => item.id === screen)!;

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return <Dashboard changeScreen={setScreen} />;

      case "studies":
        return (
          <Studies
            changeScreen={setScreen}
            editStudy={editStudy}
          />
        );

      case "builder":
        return (
          <StudyBuilder
            key={editingStudyId || "new-study"}
            changeScreen={setScreen}
            initialStudyId={editingStudyId}
            onStudyIdChange={setEditingStudyId}
          />
        );

      case "library":
        return (
          <QuestionnaireLibrary
            changeScreen={setScreen}
            openCustomBuilderOnMount={
              openCustomQuestionnaireBuilder
            }
            onCustomBuilderOpened={() =>
              setOpenCustomQuestionnaireBuilder(false)
            }
          />
        );

      case "cognitive":
        return <CognitiveLab />;

      case "ambulatory":
        return (
          <AmbulatoryBuilder
            changeScreen={setScreen}
            preferredStudyId={editingStudyId}
            onStudyIdChange={setEditingStudyId}
          />
        );

      case "followup":
        return (
          <FollowupManager
            preferredStudyId={editingStudyId}
            onStudyIdChange={setEditingStudyId}
            onBack={() => setScreen("builder")}
            onBuildQuestionnaire={() => {
              setOpenCustomQuestionnaireBuilder(true);
              setScreen("library");
            }}
          />
        );

      case "participants":
        return <Participants />;

      case "links":
        return <ParticipantLinks />;

      case "data":
        return <DataDashboard changeScreen={setScreen} />;

      case "explorer":
        return <DataExplorer />;

      case "exports":
        return <ExportData />;

      case "ethics":
        return <EthicsConsent />;

      case "team":
        return <TeamPermissions />;

      default:
        return <Dashboard changeScreen={setScreen} />;
    }
  }

  const descriptions: Record<Screen, string> = {
    dashboard:
      "Manage your studies, recruitment, ambulatory protocols and research data.",
    studies:
      "Create, organise and monitor your active and completed research projects.",
    builder:
      "Build a complete study workflow from protocol design to participant deployment.",
    library:
      "Search the research catalogue, review administration and scoring, open manuals and official resources, and verify questionnaire usage rights.",
    cognitive:
      "Create reusable cognitive task definitions, start from PsyLattice templates, and prepare versioned tasks for experiments and longitudinal research.",
    ambulatory:
      "Design repeated real-world EMA and ESM assessment protocols.",
    followup:
      "Build longitudinal follow-up waves and control participant email invitations and reminders.",
    participants:
      "Monitor enrolment, study progress and protocol compliance.",
    links:
      "Create participant-specific recruitment channels and study links.",
    data:
      "Monitor incoming responses, completeness and data-quality signals.",
    explorer:
      "Inspect participant observations and study variables before analysis.",
    exports:
      "Prepare clean research datasets for statistical analysis.",
    ethics:
      "Manage research approval, participant information and consent versions.",
    team:
      "Control who can access, edit and export information within your studies.",
  };

  const groups: ("Research" | "Data" | "Governance")[] = [
    "Research",
    "Data",
    "Governance",
  ];

  return (
    <main className="min-h-screen bg-[#f5f8f8] text-slate-950">
      {/* Header */}

      <header className="sticky top-0 z-50 border-b border-slate-300/65 bg-white/92 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 lg:px-7">
          <div className="flex items-center gap-3">
           <div>
  <PsyLatticeLogo size={38} />

  <p className="mt-1 pl-[50px] text-xs text-slate-400">
    Research workspace
  </p>
</div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Status type="accent">Researcher</Status>

            <AccountSwitcher
              initials="PD"
              currentWorkspace="researcher"
            />

            <Link
              href="/signin"
              className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-[0_2px_6px_rgba(15,23,42,0.045)] transition hover:-translate-y-px hover:shadow-[0_5px_14px_rgba(15,23,42,0.07)]"
            >
              Sign out
            </Link>
          </div>

          <select
            value={screen}
            onChange={(event) => setScreen(event.target.value as Screen)}
            className="max-w-[200px] rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-4 py-2 text-sm shadow-[0_2px_6px_rgba(15,23,42,0.04)] lg:hidden"
          >
            {navigation.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="min-h-[calc(100vh-80px)]">
        {/* Sidebar */}

        <aside
          className={`fixed bottom-0 left-0 top-20 z-40 hidden overflow-y-auto border-r border-slate-200/80 bg-[#fbfdfd] p-3 shadow-[10px_0_34px_rgba(15,23,42,0.05)] transition-[width] duration-200 lg:block ${
            sidebarCollapsed ? "w-[76px]" : "w-[245px]"
          }`}
        >
          <div
            className={`mb-4 flex ${
              sidebarCollapsed ? "justify-center" : "justify-end"
            }`}
          >
            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed((current) => !current)
              }
              aria-label={
                sidebarCollapsed
                  ? "Expand research sidebar"
                  : "Collapse research sidebar"
              }
              title={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white text-lg font-semibold text-slate-500 shadow-[0_2px_6px_rgba(15,23,42,0.04)] transition hover:-translate-y-px hover:text-slate-950 hover:shadow-[0_5px_14px_rgba(15,23,42,0.07)]"
            >
              {sidebarCollapsed ? "›" : "‹"}
            </button>
          </div>

          {groups.map((group, groupIndex) => (
            <div
              key={group}
              className={`mb-6 ${
                sidebarCollapsed && groupIndex > 0
                  ? "border-t border-slate-100 pt-4"
                  : ""
              }`}
            >
              {!sidebarCollapsed && (
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                  {group}
                </p>
              )}

              <nav className="space-y-1">
                {navigation
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = item.id === screen;
                    const NavIcon = sidebarIcons[item.id];

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setScreen(item.id)}
                        title={
                          sidebarCollapsed
                            ? item.label
                            : undefined
                        }
                        aria-label={item.label}
                        className={`relative flex w-full items-center rounded-full py-2.5 text-sm transition-all ${
                          sidebarCollapsed
                            ? "justify-center px-2"
                            : "gap-3 px-3 text-left"
                        } ${
                          active
                            ? "border border-cyan-200/70 bg-white font-semibold text-cyan-900 shadow-[0_6px_16px_rgba(8,145,178,0.16),0_14px_30px_rgba(15,23,42,0.07)]"
                            : "border border-transparent text-slate-500 hover:border-slate-200/70 hover:bg-white hover:text-slate-950 hover:shadow-[0_3px_10px_rgba(15,23,42,0.035)]"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            sidebarCollapsed && active ? "bg-cyan-100" : ""
                          }`}
                        >
                          <NavIcon
                            className={`h-[17px] w-[17px] ${
                              active ? "text-cyan-700" : "text-slate-400"
                            }`}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </span>

                        {!sidebarCollapsed && (
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="min-w-0 truncate">{item.label}</span>
                            {item.id === "cognitive" && (
                              <span className="ml-auto inline-flex shrink-0 items-center overflow-hidden rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-cyan-200 bg-cyan-50 text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-800">
                                <span className="px-1.5 py-0.5">New</span>
                                <span className="h-3 w-px bg-cyan-200" aria-hidden="true" />
                                <span className="px-1.5 py-0.5">Beta</span>
                              </span>
                            )}
                          </div>
                        )}

                        {sidebarCollapsed && item.id === "cognitive" && (
                          <span
                            className="absolute right-1 top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-white bg-cyan-600 px-0.5 text-[7px] font-bold uppercase leading-none text-white shadow-sm"
                            aria-hidden="true"
                          >
                            β
                          </span>
                        )}
                      </button>
                    );
                  })}
              </nav>
            </div>
          ))}

          {sidebarCollapsed ? (
            <div
              title="Research workspace"
              className="mx-auto mt-8 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xs font-semibold text-cyan-200"
            >
              R
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
              <p className="text-xs font-medium text-cyan-200">
                Research workspace
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Saved studies, participant records and recruitment links shown
                here are loaded from your PsyLattice research database.
              </p>
            </div>
          )}
        </aside>

        {/* Main content */}

        <section
          className={`min-w-0 p-5 transition-[margin] duration-200 sm:p-6 lg:p-8 ${
            sidebarCollapsed
              ? "lg:ml-[76px]"
              : "lg:ml-[245px]"
          }`}
        >
          <div className="mx-auto max-w-[1450px]">
            <div className="mb-7 flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/75 px-5 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.05),0_24px_58px_rgba(15,23,42,0.075)] backdrop-blur sm:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <Status type="accent">Researcher workspace</Status>

                <span className="rounded-full border shadow-[0_5px_16px_rgba(15,23,42,0.075),0_1px_3px_rgba(15,23,42,0.04)] border-slate-300/70 bg-white px-3 py-1 text-[11px] font-medium text-slate-400 shadow-[0_2px_5px_rgba(15,23,42,0.03)]">
                  Live workspace data
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
                  {screen === "dashboard"
                    ? "Research overview"
                    : currentNavigation.label}
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {descriptions[screen]}
                </p>
              </div>
            </div>

            {renderScreen()}
          </div>
        </section>
      </div>
    </main>
  );
}