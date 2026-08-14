"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

type Screen =
  | "dashboard"
  | "studies"
  | "builder"
  | "library"
  | "ambulatory"
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
  { id: "ambulatory", label: "Ambulatory Assessment", group: "Research" },
  { id: "participants", label: "Participants", group: "Research" },
  { id: "links", label: "Participant Links", group: "Research" },

  { id: "data", label: "Data Dashboard", group: "Data" },
  { id: "explorer", label: "Data Explorer", group: "Data" },
  { id: "exports", label: "Export Data", group: "Data" },

  { id: "ethics", label: "Ethics & Consent", group: "Governance" },
  { id: "team", label: "Team & Permissions", group: "Governance" },
];

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
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
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
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="p-5">{children}</div>
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
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    accent: "bg-cyan-50 text-cyan-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${classes[type]}`}
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{dashboardError}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
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
              className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
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
}: {
  changeScreen: (screen: Screen) => void;
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{studiesError}</p>
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
                className={`rounded-full border px-3 py-2 text-xs font-medium ${
                  filter === item
                    ? "border-cyan-700 bg-cyan-50 text-cyan-900"
                    : "border-slate-200 bg-white text-slate-500"
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
            className="min-w-[260px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
          />

          <button
            type="button"
            onClick={() => changeScreen("builder")}
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
              onClick={() => changeScreen("builder")}
              className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
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
                    <Status type={statusType(study.status)}>
                      {statusLabel(study.status)}
                    </Status>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Updated{" "}
                      {new Date(study.updated_at).toLocaleDateString()}
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
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
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

          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => changeScreen("participants")}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
            >
              View participants
            </button>

            <button
              type="button"
              onClick={() => changeScreen("links")}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Participant links
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* =========================================================
   STUDY BUILDER
   ========================================================= */

function StudyBuilder({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  type StudyComponents = {
    consent: boolean;
    demographics: boolean;
    baseline: boolean;
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
  };

  const makeId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const [studyId, setStudyId] = useState("");
  const [consentVersionId, setConsentVersionId] = useState("");
  const [ambulatoryProtocolId, setAmbulatoryProtocolId] = useState("");
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

  const [title, setTitle] = useState("Untitled research study");
  const [description, setDescription] = useState("");
  const [design, setDesign] = useState("Cross-sectional survey");
  const [targetSampleSize, setTargetSampleSize] = useState(100);

  const [components, setComponents] = useState<StudyComponents>({
    consent: true,
    demographics: true,
    baseline: true,
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
    ...(components.consent ? [{ key: "consent", label: "Consent" }] : []),
    ...(components.demographics
      ? [{ key: "demographics", label: "Demographics" }]
      : []),
    ...(components.baseline || components.followup
      ? [{ key: "measures", label: "Measures" }]
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
    setStudyMeasures((previous) =>
      previous.filter((measure) => {
        if (measure.measurement_point === "baseline") {
          return components.baseline;
        }

        return components.followup;
      })
    );
  }, [components.baseline, components.followup]);

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

    const alreadyAdded = studyMeasures.some(
      (measure) =>
        measure.questionnaire_version_id === questionnaire.current_version_id &&
        measure.measurement_point === measurementPoint
    );

    if (alreadyAdded) {
      setSaveMessage(
        `${questionnaire.name} is already selected for ${
          measurementPoint === "baseline" ? "baseline" : "follow-up"
        }.`
      );
      return;
    }

    setStudyMeasures((previous) => [
      ...previous,
      {
        id: makeId("measure"),
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
  }

  function removeStudyMeasure(id: string) {
    setStudyMeasures((previous) =>
      previous.filter((measure) => measure.id !== id)
    );
  }

  function moveStudyMeasure(id: string, direction: -1 | 1) {
    setStudyMeasures((previous) => {
      const index = previous.findIndex((measure) => measure.id === id);
      const target = index + direction;

      if (index < 0 || target < 0 || target >= previous.length) {
        return previous;
      }

      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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

  async function saveStudyDraft() {
    if (savingStudy) return;
    setStudyError("");
    setSaveMessage("");

    if (!title.trim()) {
      setStudyError("Enter a study title before saving.");
      return;
    }

    if (targetSampleSize < 1) {
      setStudyError("Target sample size must be at least 1.");
      return;
    }

    if (
      components.consent &&
      consentMethod === "psylattice" &&
      consentItems.some((item) => !item.prompt.trim())
    ) {
      setStudyError("Every consent question needs wording.");
      return;
    }

    if (
      components.demographics &&
      demographicQuestions.some((question) => !question.label.trim())
    ) {
      setStudyError("Every demographic question needs a label.");
      return;
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
          builder_version: "universal-v1",
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

      const { error: deleteMeasuresError } = await supabase
        .from("study_measures")
        .delete()
        .eq("study_id", savedStudyId)
        .eq("owner_user_id", user.id);

      if (deleteMeasuresError) {
        throw deleteMeasuresError;
      }

      const measuresToSave = studyMeasures.filter((measure) => {
        if (measure.measurement_point === "baseline") {
          return components.baseline;
        }

        return components.followup;
      });

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
              position: index + 1,
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

      if (components.ambulatory) {
        const protocolPayload = {
          study_id: savedStudyId,
          owner_user_id: user.id,
          name: protocolName.trim() || "Ambulatory protocol",
          duration_mode: durationMode,
          duration_days: durationMode === "relative_days" ? durationDays : null,
          start_date: durationMode === "fixed_dates" && fixedStartDate ? fixedStartDate : null,
          end_date: durationMode === "fixed_dates" && fixedEndDate ? fixedEndDate : null,
          sampling_modes: samplingModes,
          scheduling_config: {
            minimum_interval_minutes: minimumIntervalMinutes,
            weekday_mode: weekdayMode,
            dnd_start: dndStart,
            dnd_end: dndEnd,
            allow_snooze: allowSnooze,
          },
          reminder_config: {
            reminder_count: reminderCount,
            reminder_delay_minutes: reminderDelayMinutes,
          },
          timezone_config: {
            mode: timezoneMode,
          },
          event_config: {
            event_name: eventName,
            maximum_per_day: eventMaxPerDay,
          },
          is_enabled: true,
          updated_at: new Date().toISOString(),
        };

        let savedProtocolId = ambulatoryProtocolId;
        if (savedProtocolId) {
          const { error } = await supabase
            .from("study_ambulatory_protocols")
            .update(protocolPayload)
            .eq("id", savedProtocolId)
            .eq("owner_user_id", user.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("study_ambulatory_protocols")
            .insert(protocolPayload)
            .select("id")
            .single();
          if (error || !data) throw error || new Error("Ambulatory protocol could not be saved.");
          savedProtocolId = data.id;
          setAmbulatoryProtocolId(data.id);
        }

        const { error: deleteWindowError } = await supabase
          .from("study_ambulatory_windows")
          .delete()
          .eq("protocol_id", savedProtocolId)
          .eq("owner_user_id", user.id);
        if (deleteWindowError) throw deleteWindowError;

        if (ambulatoryWindows.length > 0) {
          const { error: windowError } = await supabase
            .from("study_ambulatory_windows")
            .insert(
              ambulatoryWindows.map((window, index) => ({
                protocol_id: savedProtocolId,
                study_id: savedStudyId,
                owner_user_id: user.id,
                position: index + 1,
                label: window.label.trim() || `Window ${index + 1}`,
                sampling_type: window.sampling_type,
                start_time:
                  window.sampling_type === "random_window" ||
                  window.sampling_type === "interval"
                    ? window.start_time || null
                    : null,
                end_time:
                  window.sampling_type === "random_window" ||
                  window.sampling_type === "interval"
                    ? window.end_time || null
                    : null,
                fixed_time:
                  window.sampling_type === "fixed_time"
                    ? window.fixed_time || null
                    : null,
                response_window_minutes: window.response_window_minutes,
                config: {},
              }))
            );
          if (windowError) throw windowError;
        }
      }

      setSaveMessage("Study draft saved to Supabase.");
    } catch (error) {
      console.error("Saving study draft failed:", error);
      setStudyError(
        error instanceof Error ? error.message : "The study draft could not be saved."
      );
    } finally {
      setSavingStudy(false);
    }
  }

  const componentCards: Array<{
    key: keyof StudyComponents;
    title: string;
    text: string;
  }> = [
    { key: "consent", title: "Consent", text: "PsyLattice consent, external consent, or documented alternative." },
    { key: "demographics", title: "Participant demographics", text: "Preset or custom demographic fields, including optional open-response fields." },
    { key: "baseline", title: "Baseline / questionnaires", text: "One or more library or custom research instruments." },
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
              className={`rounded-full border px-3 py-2 text-xs font-medium ${
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
          className={`rounded-2xl border px-5 py-4 ${
            studyError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
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
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Participant-facing description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Explain what participants will be asked to do."
                  className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium">Study design</span>
                  <select
                    value={design}
                    onChange={(event) => setDesign(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </label>
              </div>
            </div>
          )}

          {currentStep.key === "components" && (
            <div>
              <p className="text-sm leading-6 text-slate-500">
                Select only the components that belong to this protocol. Ambulatory assessment is not required.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {componentCards.map((component) => (
                  <button
                    key={component.key}
                    type="button"
                    onClick={() => toggleComponent(component.key)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      components[component.key]
                        ? "border-cyan-200 bg-cyan-50/60"
                        : "border-slate-200 bg-white hover:bg-slate-50"
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
                      className={`rounded-xl border p-4 text-left text-sm font-medium ${
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
                      className="mt-2 min-h-40 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
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
                        className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        + Add consent question
                      </button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {consentItems.map((item, index) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold">Consent item {index + 1}</p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => moveConsentItem(item.id, -1)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">↑</button>
                              <button type="button" onClick={() => moveConsentItem(item.id, 1)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">↓</button>
                              <button type="button" onClick={() => removeConsentItem(item.id)} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700">Remove</button>
                            </div>
                          </div>

                          <textarea
                            value={item.prompt}
                            onChange={(event) => updateConsentItem(item.id, { prompt: event.target.value })}
                            placeholder="Consent or comprehension statement"
                            className="mt-4 min-h-20 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          />

                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label>
                              <span className="text-xs font-medium text-slate-500">Response type</span>
                              <select
                                value={item.response_type}
                                onChange={(event) => updateConsentItem(item.id, { response_type: event.target.value as ConsentItemDraft["response_type"] })}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
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

                            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:self-end">
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
                                  className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                />
                              </label>

                              {item.response_type === "comprehension" && (
                                <label className="mt-3 block">
                                  <span className="text-xs font-medium text-slate-500">Correct option</span>
                                  <select
                                    value={item.correct_option}
                                    onChange={(event) => updateConsentItem(item.id, { correct_option: event.target.value })}
                                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
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
                    className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </label>
              )}
            </div>
          )}

          {currentStep.key === "demographics" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
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
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300"
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
                        className="rounded-2xl border border-slate-200 p-5"
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
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                moveDemographicQuestion(question.id, 1)
                              }
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeDemographicQuestion(question.id)
                              }
                              className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
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
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
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
                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
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
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              />
                            </label>
                          </div>
                        )}

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
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

                          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
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
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
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
                        className="rounded-2xl border border-slate-200 p-4"
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
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStudyMeasure(measure.id, 1)}
                              disabled={index === studyMeasures.length - 1}
                              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStudyMeasure(measure.id)}
                              className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-700"
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
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                    />
                  </label>

                  <div className="text-xs text-slate-400">
                    {loadingMeasureCatalogue
                      ? "Loading..."
                      : `${filteredMeasureCatalogue.length} available`}
                  </div>
                </div>

                {measureCatalogueError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                      const baselineAdded = studyMeasures.some(
                        (measure) =>
                          measure.questionnaire_version_id ===
                            questionnaire.current_version_id &&
                          measure.measurement_point === "baseline"
                      );
                      const followupAdded = studyMeasures.some(
                        (measure) =>
                          measure.questionnaire_version_id ===
                            questionnaire.current_version_id &&
                          measure.measurement_point === "followup"
                      );

                      return (
                        <div
                          key={questionnaire.id}
                          className="rounded-2xl border border-slate-200 p-5"
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
                                  disabled={
                                    !questionnaire.current_version_id ||
                                    baselineAdded
                                  }
                                  onClick={() =>
                                    addStudyMeasure(
                                      questionnaire,
                                      "baseline"
                                    )
                                  }
                                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                                    baselineAdded
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "bg-slate-950 text-white"
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  {baselineAdded
                                    ? "✓ Baseline added"
                                    : "+ Add to baseline"}
                                </button>
                              )}

                              {components.followup && (
                                <button
                                  type="button"
                                  disabled={
                                    !questionnaire.current_version_id ||
                                    followupAdded
                                  }
                                  onClick={() =>
                                    addStudyMeasure(
                                      questionnaire,
                                      "followup"
                                    )
                                  }
                                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                                    followupAdded
                                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border border-slate-200 bg-white"
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                >
                                  {followupAdded
                                    ? "✓ Follow-up added"
                                    : "+ Add to follow-up"}
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

          {currentStep.key === "ambulatory" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-medium text-cyan-950">Ambulatory is enabled for this study</p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/70">
                  Disable it from Study Components and this entire step disappears from the workflow.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Protocol name</span>
                <input value={protocolName} onChange={(event) => setProtocolName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium">Duration mode</span>
                  <select value={durationMode} onChange={(event) => setDurationMode(event.target.value as typeof durationMode)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                    <option value="relative_days">Number of days from participant start</option>
                    <option value="fixed_dates">Fixed calendar dates</option>
                    <option value="participant_defined">Participant-defined / protocol-defined end</option>
                  </select>
                </label>

                {durationMode === "relative_days" && (
                  <label>
                    <span className="text-sm font-medium">Number of days</span>
                    <input type="number" min={1} max={730} value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                  </label>
                )}
              </div>

              {durationMode === "fixed_dates" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label><span className="text-sm font-medium">Start date</span><input type="date" value={fixedStartDate} onChange={(event) => setFixedStartDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">End date</span><input type="date" value={fixedEndDate} onChange={(event) => setFixedEndDate(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Sampling modes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ["random_window", "Random-time / stratified random"],
                    ["fixed_time", "Fixed-time"],
                    ["interval", "Interval-contingent"],
                    ["event_contingent", "Event-contingent"],
                    ["participant_initiated", "Participant-initiated"],
                    ["context_triggered", "Context-triggered / future integration"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleSamplingMode(value)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium ${
                        samplingModes.includes(value)
                          ? "border-cyan-700 bg-cyan-50 text-cyan-900"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="font-medium">Prompt / event windows</p><p className="mt-1 text-sm text-slate-500">Combine fixed, random, interval and participant/event-triggered schedules.</p></div>
                  <button type="button" onClick={addAmbulatoryWindow} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">+ Add window</button>
                </div>

                <div className="mt-4 space-y-4">
                  {ambulatoryWindows.map((window) => (
                    <div key={window.id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                        <input value={window.label} onChange={(event) => updateAmbulatoryWindow(window.id, { label: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                        <select value={window.sampling_type} onChange={(event) => updateAmbulatoryWindow(window.id, { sampling_type: event.target.value as AmbulatoryWindowDraft["sampling_type"] })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                          <option value="random_window">Random within window</option>
                          <option value="fixed_time">Fixed time</option>
                          <option value="interval">Interval window</option>
                          <option value="event_contingent">Event-contingent</option>
                          <option value="participant_initiated">Participant-initiated</option>
                        </select>
                        <button type="button" onClick={() => removeAmbulatoryWindow(window.id)} className="rounded-xl border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-700">Remove</button>
                      </div>

                      {(window.sampling_type === "random_window" || window.sampling_type === "interval") && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <label><span className="text-xs text-slate-500">Start</span><input type="time" value={window.start_time} onChange={(event) => updateAmbulatoryWindow(window.id, { start_time: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                          <label><span className="text-xs text-slate-500">End</span><input type="time" value={window.end_time} onChange={(event) => updateAmbulatoryWindow(window.id, { end_time: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                          <label><span className="text-xs text-slate-500">Response window (min)</span><input type="number" min={1} value={window.response_window_minutes} onChange={(event) => updateAmbulatoryWindow(window.id, { response_window_minutes: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                        </div>
                      )}

                      {window.sampling_type === "fixed_time" && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label><span className="text-xs text-slate-500">Exact time</span><input type="time" value={window.fixed_time} onChange={(event) => updateAmbulatoryWindow(window.id, { fixed_time: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                          <label><span className="text-xs text-slate-500">Response window (min)</span><input type="number" min={1} value={window.response_window_minutes} onChange={(event) => updateAmbulatoryWindow(window.id, { response_window_minutes: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label><span className="text-xs font-medium text-slate-500">Minimum prompt interval (min)</span><input type="number" min={0} value={minimumIntervalMinutes} onChange={(event) => setMinimumIntervalMinutes(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label><span className="text-xs font-medium text-slate-500">Reminders</span><input type="number" min={0} max={10} value={reminderCount} onChange={(event) => setReminderCount(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label><span className="text-xs font-medium text-slate-500">Reminder delay (min)</span><input type="number" min={1} value={reminderDelayMinutes} onChange={(event) => setReminderDelayMinutes(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label><span className="text-xs font-medium text-slate-500">Day schedule</span><select value={weekdayMode} onChange={(event) => setWeekdayMode(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="all_days">All days</option><option value="weekdays">Weekdays only</option><option value="weekends">Weekends only</option><option value="custom">Custom by protocol</option></select></label>
                <label><span className="text-xs font-medium text-slate-500">Time-zone handling</span><select value={timezoneMode} onChange={(event) => setTimezoneMode(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="participant_local">Follow participant local time</option><option value="study_timezone">Lock to study timezone</option><option value="fixed_enrollment_timezone">Lock enrollment timezone</option></select></label>
                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:self-end"><input type="checkbox" checked={allowSnooze} onChange={(event) => setAllowSnooze(event.target.checked)} /><span className="text-sm">Allow participant snooze</span></label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="text-xs font-medium text-slate-500">Do-not-disturb starts</span><input type="time" value={dndStart} onChange={(event) => setDndStart(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                <label><span className="text-xs font-medium text-slate-500">Do-not-disturb ends</span><input type="time" value={dndEnd} onChange={(event) => setDndEnd(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              </div>

              {(samplingModes.includes("event_contingent") || samplingModes.includes("participant_initiated")) && (
                <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
                  <label><span className="text-sm font-medium">Defined event</span><input value={eventName} onChange={(event) => setEventName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                  <label><span className="text-sm font-medium">Maximum event entries / day</span><input type="number" min={1} value={eventMaxPerDay} onChange={(event) => setEventMaxPerDay(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                </div>
              )}
            </div>
          )}

          {currentStep.key === "followup" && (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium">Follow-up component enabled</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                The study model now records that follow-up measurement is part of this protocol. Scheduling and questionnaire selection for follow-ups will be connected when study events and participant links are built.
              </p>
            </div>
          )}

          {currentStep.key === "recruitment" && (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-500">
                Save the study draft first, then use Participant Links to create TEST or live recruitment routes for this exact protocol.
              </p>
              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-medium">Study draft ID</p>
                <code className="mt-2 block rounded-lg bg-slate-50 p-3 text-xs">{studyId || "Save this draft to create a study ID"}</code>
              </div>
            </div>
          )}

          {currentStep.key === "review" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <p className="font-medium text-emerald-900">Builder review</p>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  This draft records the selected study components, configurable demographics, pinned questionnaire versions, consent, and optional ambulatory protocol. Use a TEST participant link before live recruitment and verify the full participant experience against the approved protocol.
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
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                disabled={currentStepIndex === steps.length - 1}
                onClick={() => setActiveStepKey(steps[Math.min(steps.length - 1, currentStepIndex + 1)].key)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
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
              <p>Once participant deployment is connected, published questionnaire and consent versions will be immutable for historical reproducibility.</p>
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
}: {
  changeScreen: (screen: Screen) => void;
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
    scoring_method: string;
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
  };

  type BuilderLogicRule = {
    id: string;
    source_key: string;
    operator:
      | "equals"
      | "not_equals"
      | "greater_than"
      | "less_than"
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

      const { data, error } = await supabase
        .from("questionnaires")
        .select(
          "id, slug, name, acronym, category, description, constructs, population, item_count, estimated_minutes, languages, administration_mode, recall_period, self_available, researcher_available, license_status, license_summary, license_source_url, commercial_use_note, modification_note, redistribution_note, owner_user_id, source_type"
        )
        .eq("researcher_available", true)
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Could not load researcher questionnaire library:", error);
        setLibraryError(
          "The questionnaire library could not be loaded. Make sure the questionnaire database setup has been run in Supabase."
        );
        setLoading(false);
        return;
      }

      setQuestionnaires((data || []) as Questionnaire[]);
      setLoading(false);
    }

    void loadLibrary();
  }, []);

  async function openQuestionnaire(questionnaire: Questionnaire) {
    setSelectedQuestionnaire(questionnaire);
    setSelectedVersion(null);
    setItems([]);
    setResources([]);
    setReferences([]);
    setDetailLoading(true);
    setLibraryError("");
    setCopiedReferenceId("");

    const supabase = createClient();

    const [versionResult, resourceResult, referenceResult] = await Promise.all([
      supabase
        .from("questionnaire_versions")
        .select(
          "id, questionnaire_id, version_label, participant_instructions, researcher_instructions, response_scale_description, scoring_summary, score_multiplier, scoring_method"
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
      console.error("Could not load questionnaire version:", versionResult.error);
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

    if (version && questionnaire.license_status !== "restricted") {
      const { data: itemData, error: itemError } = await supabase
        .from("questionnaire_items")
        .select(
          "id, position, prompt, subscale, reverse_scored, response_type, response_options, required"
        )
        .eq("version_id", version.id)
        .order("position", { ascending: true });

      if (itemError) {
        console.error("Could not load questionnaire items:", itemError);
      } else {
        setItems((itemData || []) as QuestionnaireItem[]);
      }
    }

    if (resourceResult.error) {
      console.error("Could not load questionnaire resources:", resourceResult.error);
    }

    if (referenceResult.error) {
      console.error("Could not load questionnaire references:", referenceResult.error);
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
  const mediaItemTypes = new Set(["image_content", "audio_content", "video_content", "image_choice"]);

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

  function itemTypeLabel(type: string) {
    return itemTypeDefinitions.find((item) => item.value === type)?.label || type;
  }

  function updateBuilderItem(id: string, patch: Partial<BuilderItem>) {
    setBuilderItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
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

  function addBuilderItem(blockId?: string) {
    if (builderItems.length >= 500) return;
    setBuilderItems((previous) => [
      ...previous,
      makeDefaultItem(previous.length + 1, blockId),
    ]);
  }

  function duplicateBuilderItem(id: string) {
    setBuilderItems((previous) => {
      const source = previous.find((item) => item.id === id);
      if (!source || previous.length >= 500) return previous;
      return [
        ...previous,
        {
          ...source,
          id: makeBuilderId("item"),
          key: `${source.key || "q"}_copy_${previous.length + 1}`,
          options: source.options.map((option) => ({ ...option, id: makeBuilderId("option") })),
          logic_rules: source.logic_rules.map((rule) => ({ ...rule, id: makeBuilderId("logic") })),
        },
      ];
    });
  }

  function removeBuilderItem(id: string) {
    if (builderItems.length <= 1) return;
    setBuilderItems((previous) => previous.filter((item) => item.id !== id));
  }

  function moveBuilderItem(id: string, direction: -1 | 1) {
    setBuilderItems((previous) => {
      const index = previous.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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
          ? { ...item, options: item.options.filter((option) => option.id !== optionId) }
          : item
      )
    );
  }

  function addBuilderBlock() {
    const number = builderBlocks.length + 1;
    setBuilderBlocks((previous) => [
      ...previous,
      {
        id: makeBuilderId("block"),
        key: `block_${number}`,
        title: `Block ${number}`,
        instructions: "",
        randomize_items: false,
        page_break_after: true,
      },
    ]);
  }

  function updateBuilderBlock(id: string, patch: Partial<BuilderBlock>) {
    setBuilderBlocks((previous) =>
      previous.map((block) => (block.id === id ? { ...block, ...patch } : block))
    );
  }

  function removeBuilderBlock(id: string) {
    if (builderBlocks.length <= 1) return;
    const fallback = builderBlocks.find((block) => block.id !== id)?.id || "";
    setBuilderBlocks((previous) => previous.filter((block) => block.id !== id));
    setBuilderItems((previous) =>
      previous.map((item) => (item.block_id === id ? { ...item, block_id: fallback } : item))
    );
  }

  function addLogicRule(itemId: string) {
    setBuilderItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? {
              ...item,
              logic_rules: [
                ...item.logic_rules,
                {
                  id: makeBuilderId("logic"),
                  source_key: "",
                  operator: "equals",
                  value: "",
                },
              ],
            }
          : item
      )
    );
  }

  function updateLogicRule(itemId: string, ruleId: string, patch: Partial<BuilderLogicRule>) {
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

  function removeLogicRule(itemId: string, ruleId: string) {
    setBuilderItems((previous) =>
      previous.map((item) =>
        item.id === itemId
          ? { ...item, logic_rules: item.logic_rules.filter((rule) => rule.id !== ruleId) }
          : item
      )
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
      if (numericItemTypes.has(item.item_type) && item.numeric_min >= item.numeric_max) {
        return setBuilderError(`${item.key} needs a maximum greater than its minimum.`);
      }
      if (matrixItemTypes.has(item.item_type) && !item.matrix_rows.trim()) {
        return setBuilderError(`${item.key} needs at least one matrix row.`);
      }
    }

    if (builderScoringMethod === "custom_formula" && !builderScoringFormula.trim()) {
      return setBuilderError("Enter the custom scoring formula or algorithm notes.");
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
          redistribution_note: "Distribution rights depend on the researcher's ownership or permission for the entered content.",
          owner_user_id: user.id,
          source_type: "researcher_created",
        })
        .select("id, slug, name, acronym, category, description, constructs, population, item_count, estimated_minutes, languages, administration_mode, recall_period, self_available, researcher_available, license_status, license_summary, license_source_url, commercial_use_note, modification_note, redistribution_note, owner_user_id, source_type")
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
            media_config: { url: item.media_url.trim() || null },
            is_content_only: contentItemTypes.has(item.item_type),
          }))
        );
      if (itemError) throw itemError;

      const typedQuestionnaire = createdQuestionnaire as Questionnaire;
      setQuestionnaires((previous) => [...previous, typedQuestionnaire].sort((a, b) => a.name.localeCompare(b.name)));
      setBuilderSuccess("Universal questionnaire created and added to your research library.");
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
      questionnaire: "Questionnaire source",
      manual: "Manual / documentation",
      scoring_guide: "Scoring guide",
      scoring_key: "Scoring key",
      official_page: "Official source",
      official_source: "Official source",
      license: "Permission source",
      permission_source: "Permission source",
      translation: "Translation",
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
    (item) => item.source_type === "researcher_created"
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
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

        {builderError && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4"><p className="text-sm text-red-700">{builderError}</p></div>}
        {builderSuccess && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"><p className="text-sm text-emerald-700">{builderSuccess}</p></div>}

        <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-5">
            <Panel title="Instrument overview" description="Metadata shown to researchers in the library.">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <label><span className="text-sm font-medium">Name</span><input value={builderName} onChange={(event) => setBuilderName(event.target.value)} placeholder="e.g. Academic Coping Questionnaire" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">Acronym</span><input value={builderAcronym} onChange={(event) => setBuilderAcronym(event.target.value)} placeholder="ACQ" maxLength={20} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label><span className="text-sm font-medium">Category</span><input value={builderCategory} onChange={(event) => setBuilderCategory(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">Estimated time (minutes)</span><input type="number" min={1} max={1440} value={builderEstimatedMinutes} onChange={(event) => setBuilderEstimatedMinutes(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
                <label className="block"><span className="text-sm font-medium">Description</span><textarea value={builderDescription} onChange={(event) => setBuilderDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label><span className="text-sm font-medium">Constructs — comma separated</span><input value={builderConstructs} onChange={(event) => setBuilderConstructs(event.target.value)} placeholder="Stress, coping" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">Languages — comma separated</span><input value={builderLanguages} onChange={(event) => setBuilderLanguages(event.target.value)} placeholder="English, Italian" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label><span className="text-sm font-medium">Target population</span><input value={builderPopulation} onChange={(event) => setBuilderPopulation(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                  <label><span className="text-sm font-medium">Recall period</span><input value={builderRecallPeriod} onChange={(event) => setBuilderRecallPeriod(event.target.value)} placeholder="Past 7 days / Right now / General" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                </div>
              </div>
            </Panel>

            <Panel title="Administration" description="Participant and researcher-facing instructions.">
              <div className="space-y-5">
                <label className="block"><span className="text-sm font-medium">Participant instructions</span><textarea value={builderParticipantInstructions} onChange={(event) => setBuilderParticipantInstructions(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                <label className="block"><span className="text-sm font-medium">Researcher instructions</span><textarea value={builderResearcherInstructions} onChange={(event) => setBuilderResearcherInstructions(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
              </div>
            </Panel>

            <Panel title="Blocks & pages" description="Create sections, page breaks and block-level randomisation.">
              <div className="space-y-4">
                {builderBlocks.map((block, index) => (
                  <div key={block.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Block {index + 1}</p><button type="button" onClick={() => removeBuilderBlock(block.id)} disabled={builderBlocks.length <= 1} className="text-xs font-semibold text-red-600 disabled:opacity-30">Remove</button></div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label><span className="text-xs text-slate-500">Block key</span><input value={block.key} onChange={(event) => updateBuilderBlock(block.id, { key: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                      <label><span className="text-xs text-slate-500">Title</span><input value={block.title} onChange={(event) => updateBuilderBlock(block.id, { title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                    </div>
                    <textarea value={block.instructions} onChange={(event) => updateBuilderBlock(block.id, { instructions: event.target.value })} placeholder="Optional block instructions" className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                    <div className="mt-3 flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={block.randomize_items} onChange={(event) => updateBuilderBlock(block.id, { randomize_items: event.target.checked })} />Randomize items in this block</label><label className="flex items-center gap-2"><input type="checkbox" checked={block.page_break_after} onChange={(event) => updateBuilderBlock(block.id, { page_break_after: event.target.checked })} />Page break after block</label></div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addBuilderBlock} className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">+ Add block / page</button>
            </Panel>

            <Panel title="Items & content" description="Every item can use a different response type. Use {{item_key}} in later wording to pipe a previous response.">
              <div className="space-y-5">
                {builderItems.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold">{index + 1}</div><div><p className="text-sm font-semibold">{item.key || `Item ${index + 1}`}</p><p className="text-xs text-slate-400">{itemTypeLabel(item.item_type)}</p></div></div>
                      <div className="flex gap-2"><button type="button" onClick={() => moveBuilderItem(item.id, -1)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">↑</button><button type="button" onClick={() => moveBuilderItem(item.id, 1)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">↓</button><button type="button" onClick={() => duplicateBuilderItem(item.id)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Duplicate</button><button type="button" onClick={() => removeBuilderItem(item.id)} disabled={builderItems.length <= 1} className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 disabled:opacity-30">Remove</button></div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr_220px]">
                      <label><span className="text-xs text-slate-500">Item key</span><input value={item.key} onChange={(event) => updateBuilderItem(item.id, { key: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                      <label><span className="text-xs text-slate-500">Response / content type</span><select value={item.item_type} onChange={(event) => changeBuilderItemType(item.id, event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{Array.from(new Set(itemTypeDefinitions.map((definition) => definition.group))).map((group) => <optgroup key={group} label={group}>{itemTypeDefinitions.filter((definition) => definition.group === group).map((definition) => <option key={definition.value} value={definition.value}>{definition.label}</option>)}</optgroup>)}</select></label>
                      <label><span className="text-xs text-slate-500">Block / page</span><select value={item.block_id} onChange={(event) => updateBuilderItem(item.id, { block_id: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">{builderBlocks.map((block) => <option key={block.id} value={block.id}>{block.title || block.key}</option>)}</select></label>
                    </div>

                    <label className="mt-4 block"><span className="text-sm font-medium">{contentItemTypes.has(item.item_type) ? "Content / heading" : "Question / statement"}</span><textarea value={item.prompt} onChange={(event) => updateBuilderItem(item.id, { prompt: event.target.value })} rows={2} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
                    <label className="mt-3 block"><span className="text-xs text-slate-500">Help text / secondary instructions</span><input value={item.help_text} onChange={(event) => updateBuilderItem(item.id, { help_text: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>

                    {!contentItemTypes.has(item.item_type) && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <label><span className="text-xs text-slate-500">Subscale</span><input value={item.subscale} onChange={(event) => updateBuilderItem(item.id, { subscale: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm sm:self-end"><input type="checkbox" checked={item.required} onChange={(event) => updateBuilderItem(item.id, { required: event.target.checked })} />Required</label>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm sm:self-end"><input type="checkbox" checked={item.reverse_scored} onChange={(event) => updateBuilderItem(item.id, { reverse_scored: event.target.checked })} />Reverse scored</label>
                      </div>
                    )}

                    {optionItemTypes.has(item.item_type) && (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">Response options</p><p className="mt-1 text-xs text-slate-400">Participant label, numeric code/score and optional weight are stored separately.</p></div><button type="button" onClick={() => addBuilderOption(item.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">+ Option</button></div>
                        <div className="mt-3 space-y-2">{item.options.map((option) => <div key={option.id} className="grid gap-2 sm:grid-cols-[1fr_90px_90px_auto]"><input value={option.label} onChange={(event) => updateBuilderOption(item.id, option.id, { label: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /><input type="number" value={option.value} onChange={(event) => updateBuilderOption(item.id, option.id, { value: Number(event.target.value) })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" title="Numeric code / score" /><input type="number" step="0.01" value={option.weight} onChange={(event) => updateBuilderOption(item.id, option.id, { weight: Number(event.target.value) })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" title="Weight" /><button type="button" onClick={() => removeBuilderOption(item.id, option.id)} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-700">×</button></div>)}</div>
                        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={item.randomize_options} onChange={(event) => updateBuilderItem(item.id, { randomize_options: event.target.checked })} />Randomize option order</label>
                      </div>
                    )}

                    {numericItemTypes.has(item.item_type) && (
                      <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3"><label><span className="text-xs text-slate-500">Minimum</span><input type="number" value={item.numeric_min} onChange={(event) => updateBuilderItem(item.id, { numeric_min: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label><label><span className="text-xs text-slate-500">Maximum</span><input type="number" value={item.numeric_max} onChange={(event) => updateBuilderItem(item.id, { numeric_max: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label><label><span className="text-xs text-slate-500">Step</span><input type="number" step="0.01" value={item.numeric_step} onChange={(event) => updateBuilderItem(item.id, { numeric_step: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label><label><span className="text-xs text-slate-500">Left / low anchor</span><input value={item.left_anchor} onChange={(event) => updateBuilderItem(item.id, { left_anchor: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label><label><span className="text-xs text-slate-500">Right / high anchor</span><input value={item.right_anchor} onChange={(event) => updateBuilderItem(item.id, { right_anchor: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label></div>
                    )}

                    {(item.item_type === "multiple_choice" || item.item_type === "checklist" || item.item_type === "ranking" || item.item_type === "best_worst") && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="text-xs text-slate-500">Minimum selections</span><input type="number" min={0} value={item.min_selections} onChange={(event) => updateBuilderItem(item.id, { min_selections: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="text-xs text-slate-500">Maximum selections</span><input type="number" min={0} value={item.max_selections} onChange={(event) => updateBuilderItem(item.id, { max_selections: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div>
                    )}

                    {textItemTypes.has(item.item_type) && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="text-xs text-slate-500">Maximum words</span><input type="number" min={0} value={item.max_words} onChange={(event) => updateBuilderItem(item.id, { max_words: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label><span className="text-xs text-slate-500">Maximum characters</span><input type="number" min={0} value={item.max_characters} onChange={(event) => updateBuilderItem(item.id, { max_characters: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div>
                    )}

                    {item.item_type === "thurstone" && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Hidden Thurstone statement scale value</span><input type="number" step="0.01" value={item.thurstone_weight} onChange={(event) => updateBuilderItem(item.id, { thurstone_weight: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>}
                    {item.item_type === "constant_sum" && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Required allocation total</span><input type="number" value={item.constant_sum_target} onChange={(event) => updateBuilderItem(item.id, { constant_sum_target: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>}
                    {matrixItemTypes.has(item.item_type) && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Matrix rows — one per line</span><textarea value={item.matrix_rows} onChange={(event) => updateBuilderItem(item.id, { matrix_rows: event.target.value })} className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>}
                    {mediaItemTypes.has(item.item_type) && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Media URL / future storage reference</span><input value={item.media_url} onChange={(event) => updateBuilderItem(item.id, { media_url: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>}

                    <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">Display logic / branching</p><p className="mt-1 text-xs text-slate-400">Show this item only when previous responses meet the stored conditions.</p></div><button type="button" onClick={() => addLogicRule(item.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">+ Condition</button></div>
                      {item.logic_rules.length > 0 && <div className="mt-3"><select value={item.logic_mode} onChange={(event) => updateBuilderItem(item.id, { logic_mode: event.target.value as "all" | "any" })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option value="all">All conditions must match (AND)</option><option value="any">Any condition may match (OR)</option></select></div>}
                      <div className="mt-3 space-y-2">{item.logic_rules.map((rule) => <div key={rule.id} className="grid gap-2 md:grid-cols-[150px_180px_1fr_auto]"><input value={rule.source_key} onChange={(event) => updateLogicRule(item.id, rule.id, { source_key: event.target.value })} placeholder="Source item key" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" /><select value={rule.operator} onChange={(event) => updateLogicRule(item.id, rule.id, { operator: event.target.value as BuilderLogicRule["operator"] })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option value="equals">Equals</option><option value="not_equals">Does not equal</option><option value="greater_than">Greater than</option><option value="less_than">Less than</option><option value="contains">Contains</option><option value="not_contains">Does not contain</option><option value="answered">Answered</option><option value="not_answered">Not answered</option></select><input value={rule.value} onChange={(event) => updateLogicRule(item.id, rule.id, { value: event.target.value })} placeholder="Comparison value" className="rounded-lg border border-slate-200 px-3 py-2 text-xs" /><button type="button" onClick={() => removeLogicRule(item.id, rule.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700">×</button></div>)}</div>
                    </div>

                    {item.item_type === "custom" && <label className="mt-4 block"><span className="text-xs font-medium text-slate-500">Custom item configuration / implementation notes</span><textarea value={item.custom_config_notes} onChange={(event) => updateBuilderItem(item.id, { custom_config_notes: event.target.value })} placeholder="Describe any format not represented above. The database stores this as structured extension metadata for a future renderer/plugin." className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addBuilderItem()} disabled={builderItems.length >= 500} className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">+ Add item / content</button>
            </Panel>

            <Panel title="Scoring, missing data & randomisation" description="Store the scoring plan without implying that a new measure has been validated.">
              <div className="grid gap-4 md:grid-cols-2">
                <label><span className="text-sm font-medium">Scoring method</span><select value={builderScoringMethod} onChange={(event) => setBuilderScoringMethod(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option value="none">No automatic score</option><option value="sum">Sum</option><option value="mean">Mean / average</option><option value="median">Median</option><option value="count_endorsed">Count endorsed</option><option value="percentage">Percentage</option><option value="weighted_sum">Weighted sum</option><option value="weighted_mean">Weighted mean</option><option value="thurstone_median">Thurstone median of endorsed values</option><option value="subscale_sum">Subscale sums</option><option value="subscale_mean">Subscale means</option><option value="total_and_subscales">Total + subscales</option><option value="custom_formula">Custom formula / algorithm</option><option value="irt_rasch">IRT / Rasch parameters supplied by researcher</option></select></label>
                <label><span className="text-sm font-medium">Missing-data rule</span><select value={builderMissingRule} onChange={(event) => setBuilderMissingRule(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option value="complete_case">Do not score if required items are missing</option><option value="available_items">Use available items</option><option value="allow_10_percent">Allow up to 10% missing</option><option value="allow_20_percent">Allow up to 20% missing</option><option value="prorate_80_percent">Prorate if at least 80% completed</option><option value="subscale_mean_imputation">Subscale-mean imputation</option><option value="custom">Custom rule documented below</option></select></label>
              </div>
              {(builderScoringMethod === "custom_formula" || builderScoringMethod === "irt_rasch" || builderMissingRule === "custom") && <textarea value={builderScoringFormula} onChange={(event) => setBuilderScoringFormula(event.target.value)} placeholder="Formula, calibrated parameters, or algorithm/missing-data specification. Example: stress=(q1+q2+reverse(q3))/3" className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />}
              <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm"><input type="checkbox" checked={builderRandomizeItems} onChange={(event) => setBuilderRandomizeItems(event.target.checked)} />Allow questionnaire-level item randomisation (block settings can override/structure this).</label>
              <label className="mt-4 block"><span className="text-sm font-medium">Scoring / analysis notes</span><textarea value={builderScoringSummary} onChange={(event) => setBuilderScoringSummary(event.target.value)} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" /></label>
              <p className="mt-3 text-xs leading-5 text-slate-400">PsyLattice stores researcher-defined scoring. It does not infer psychometric validity, norms, diagnostic meaning or calibrated IRT/Rasch parameters.</p>
            </Panel>
          </div>

          <div className="space-y-5">
            <Panel title="Builder summary">
              <div className="grid grid-cols-2 gap-3"><StatCard label="Items/content" value={String(builderItems.length)} detail={`${builderBlocks.length} block(s)`} /><StatCard label="Response types" value={String(responseTypesUsed.length)} detail="Mixed formats supported" /></div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Subscales</p><p className="mt-2 text-sm font-medium text-slate-700">{subscales.length > 0 ? subscales.join(", ") : "No subscales assigned"}</p></div>
              <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5"><p className="font-medium text-cyan-950">Extensible by design</p><p className="mt-2 text-sm leading-6 text-cyan-900/75">The custom item type and JSONB configuration mean new research formats can be added later without redesigning the core database.</p></div>
            </Panel>

            <Panel title="Included capabilities">
              <div className="space-y-3 text-sm text-slate-600">{["Item-specific response formats", "Blocks/pages and page breaks", "Branching / display logic", "Piping via {{item_key}}", "Option and block randomisation", "Subscales and reverse scoring", "Weighted / Thurstone scoring metadata", "Missing-data rules", "Matrices, ranking, Q-sort and allocation", "Text, numeric, date/time and uploads", "Media/stimulus metadata", "Custom/future item configuration"].map((capability) => <div key={capability} className="flex gap-2"><span className="mt-0.5 text-emerald-700"><CheckIcon /></span><span>{capability}</span></div>)}</div>
            </Panel>

            <Panel title="Rights confirmation">
              <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5"><input type="checkbox" checked={builderRightsConfirmed} onChange={(event) => setBuilderRightsConfirmed(event.target.checked)} className="mt-1" /><span className="text-sm leading-6 text-amber-900">I confirm that I created this instrument content, or I have the permission/licence required to reproduce and digitally administer it.</span></label>
              <p className="mt-4 text-xs leading-5 text-slate-400">PsyLattice records this confirmation but does not independently verify third-party rights.</p>
            </Panel>

            <Panel title="Save instrument">
              <button type="button" onClick={() => void saveCustomQuestionnaire()} disabled={savingCustomQuestionnaire} className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{savingCustomQuestionnaire ? "Saving instrument..." : "Save to research library"}</button>
              <button type="button" onClick={() => { setBuilderOpen(false); resetCustomBuilder(); }} disabled={savingCustomQuestionnaire} className="mt-2 w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancel</button>
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  if (selectedQuestionnaire) {
    const unavailableText =
      "Not currently available in the PsyLattice catalogue.";
    const manualResources = resources.filter(
      (resource) => resource.resource_type === "manual"
    );
    const questionnaireResources = resources.filter(
      (resource) => resource.resource_type === "questionnaire"
    );
    const officialResources = resources.filter(
      (resource) =>
        resource.is_official ||
        ["official_page", "official_source"].includes(resource.resource_type)
    );
    const resourceGroups = Array.from(
      resources
        .reduce<Map<string, QuestionnaireResource[]>>((groups, resource) => {
          const existing = groups.get(resource.resource_type) || [];
          groups.set(resource.resource_type, [...existing, resource]);
          return groups;
        }, new Map())
        .entries()
    );
    const storedScoringMethod = selectedVersion?.scoring_method?.trim() || "";
    const storedScoringMethodLabel =
      storedScoringMethod === "legacy_guidance"
        ? "Guidance only (legacy catalogue)"
        : storedScoringMethod
          ? storedScoringMethod.replaceAll("_", " ")
          : unavailableText;

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
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700">{libraryError}</p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
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
                  <Status type="accent">Your custom questionnaire</Status>
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
            </div>

            <div className="flex flex-wrap gap-2">
              {questionnaireResources[0] && (
                <a
                  href={questionnaireResources[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Open questionnaire source ↗
                </a>
              )}

              <button
                type="button"
                onClick={() => changeScreen("builder")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Open Study Builder
              </button>
            </div>
          </div>
        </div>

        {detailLoading ? (
          <Panel title="Questionnaire details">
            <p className="text-sm text-slate-500">
              Loading administration, scoring and research resources...
            </p>
          </Panel>
        ) : (
          <>
            <Panel
              title="Overview"
              description="Core catalogue metadata for identifying and planning use of this instrument."
            >
              <p className="max-w-5xl text-sm leading-7 text-slate-600">
                {selectedQuestionnaire.description || unavailableText}
              </p>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Constructs
                </p>
                {selectedQuestionnaire.constructs.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedQuestionnaire.constructs.map((construct) => (
                      <Status key={construct} type="accent">
                        {construct}
                      </Status>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">{unavailableText}</p>
                )}
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Category", selectedQuestionnaire.category],
                  ["Intended population", selectedQuestionnaire.population],
                  ["Items", String(selectedQuestionnaire.item_count)],
                  [
                    "Estimated completion time",
                    selectedQuestionnaire.estimated_minutes
                      ? `Approximately ${selectedQuestionnaire.estimated_minutes} minutes`
                      : null,
                  ],
                  [
                    "Available languages",
                    selectedQuestionnaire.languages.length > 0
                      ? selectedQuestionnaire.languages.join(", ")
                      : null,
                  ],
                  ["Recall period", selectedQuestionnaire.recall_period],
                  ["Administration mode", selectedQuestionnaire.administration_mode],
                  ["Version", selectedVersion?.version_label],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <dt className="text-xs font-medium text-slate-400">{label}</dt>
                    <dd className="mt-2 text-sm font-medium leading-6 text-slate-700">
                      {value || unavailableText}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
              <Panel
                title="Administration"
                description="Participant-facing directions and researcher protocol notes for this version."
              >
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5">
                      <div className="flex items-center gap-2">
                        <Status type="accent">Participant-facing</Status>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                          Instructions
                        </p>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-cyan-950">
                        {selectedVersion?.participant_instructions || unavailableText}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                      <div className="flex items-center gap-2">
                        <Status>Researcher-facing</Status>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
                          Protocol notes
                        </p>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-indigo-950">
                        {selectedVersion?.researcher_instructions || unavailableText}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Response-scale description
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {selectedVersion?.response_scale_description || unavailableText}
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Scoring"
                description="Stored scoring guidance for the current questionnaire version."
              >
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Stored scoring-method status
                    </p>
                    <p className="mt-2 text-sm font-semibold capitalize text-slate-800">
                      {storedScoringMethodLabel}
                    </p>
                  </div>
                  {storedScoringMethod && (
                    <code className="w-fit rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500">
                      {storedScoringMethod}
                    </code>
                  )}
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                    Scoring summary
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-cyan-950">
                    {selectedVersion?.scoring_summary || unavailableText}
                  </p>
                </div>

                {selectedVersion && Number(selectedVersion.score_multiplier) !== 1 && (
                  <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
                    <span className="text-sm font-medium text-slate-600">
                      Stored score multiplier
                    </span>
                    <Status type="warning">
                      ×{Number(selectedVersion.score_multiplier)}
                    </Status>
                  </div>
                )}

                {storedScoringMethod === "legacy_guidance" && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <p className="text-sm leading-6 text-blue-900">
                      Scoring guidance is available for this instrument. Structured
                      PsyLattice scoring validation is being prepared.
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-slate-50 p-5">
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
              title="Items"
              description="Item wording and response coding stored for the current version."
            >
              {selectedQuestionnaire.license_status === "restricted" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-medium text-amber-900">
                    Item text is hidden for this restricted measure.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
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
                  {unavailableText}
                </p>
              )}
            </Panel>

            <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
              <Panel
                title="Licensing & use"
                description="Stored rights information only; verify the linked source and applicable terms before use."
              >
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
                        Licence status
                      </p>
                      <Status
                        type={licenceStatusType(selectedQuestionnaire.license_status)}
                      >
                        {licenceLabel(selectedQuestionnaire.license_status)}
                      </Status>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-amber-950">
                      {selectedQuestionnaire.license_summary || unavailableText}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Commercial use
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedQuestionnaire.commercial_use_note || unavailableText}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Modification
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedQuestionnaire.modification_note || unavailableText}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs font-medium text-slate-400">
                        Redistribution
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {selectedQuestionnaire.redistribution_note || unavailableText}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-medium text-slate-400">
                      Licence source
                    </p>
                    {selectedQuestionnaire.license_source_url ? (
                      <a
                        href={selectedQuestionnaire.license_source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        Open licence source ↗
                      </a>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {unavailableText}
                      </p>
                    )}
                  </div>
                </div>
              </Panel>

              <Panel
                title="Resources"
                description="Official sources, manuals, scoring guides, permissions, translations and supporting publications stored with this instrument."
              >
                {resources.length > 0 ? (
                  <div className="space-y-6">
                    {resourceGroups.map(([resourceType, groupedResources]) => (
                      <section key={resourceType}>
                        <div className="mb-3 flex items-center gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            {resourceTypeLabel(resourceType)}
                          </p>
                          <span className="h-px flex-1 bg-slate-100" />
                        </div>

                        <div className="space-y-3">
                          {groupedResources.map((resource) => (
                            <div
                              key={resource.id}
                              className="rounded-2xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900">
                                      {resource.title}
                                    </p>
                                    {resource.is_official && (
                                      <Status type="success">Official</Status>
                                    )}
                                  </div>

                                  <dl className="mt-3 space-y-2 text-sm">
                                    <div>
                                      <dt className="text-xs font-medium text-slate-400">
                                        Source
                                      </dt>
                                      <dd className="mt-1 text-slate-600">
                                        {resource.source_name || unavailableText}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className="text-xs font-medium text-slate-400">
                                        Access note
                                      </dt>
                                      <dd className="mt-1 leading-6 text-slate-600">
                                        {resource.access_note || unavailableText}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>

                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="shrink-0 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  {resource.download_allowed
                                    ? "Open resource / download ↗"
                                    : "Open resource ↗"}
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm leading-6 text-slate-500">
                      {unavailableText}
                    </p>
                  </div>
                )}

                {(manualResources.length === 0 ||
                  officialResources.length === 0 ||
                  questionnaireResources.length === 0) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Manual", manualResources.length],
                      ["Official source", officialResources.length],
                      ["Questionnaire source", questionnaireResources.length],
                    ]
                      .filter(([, resourceCount]) => resourceCount === 0)
                      .map(([label]) => (
                        <div
                          key={label}
                          className="rounded-xl border border-dashed border-slate-200 px-4 py-3"
                        >
                          <p className="text-xs font-medium text-slate-400">{label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {unavailableText}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </Panel>
            </div>

            <Panel
              title="References"
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
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
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
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"
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
                  {unavailableText}
                </p>
              )}
            </Panel>

          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {libraryError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
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
          label="Custom questionnaires"
          value={loading ? "..." : String(customQuestionnaireCount)}
          detail="Created in your research workspace"
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
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
          />

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Status type={licenceStatusType(item.license_status)}>
                    {licenceLabel(item.license_status)}
                  </Status>

                  {!item.self_available && <Status>Research only</Status>}
                  {item.source_type === "researcher_created" && (
                    <Status type="accent">Your questionnaire</Status>
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
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  View research details
                </button>

                {item.license_source_url && (
                  <a
                    href={item.license_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
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
              Create questionnaire metadata, participant instructions, a numeric
              response scale, item wording, subscales, reverse-scored items and
              scoring notes. Custom questionnaires remain in your researcher
              library and are not automatically exposed in the Self workspace.
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

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-medium text-amber-900">
          Questionnaire licensing safeguard
        </p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-800">
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

function AmbulatoryBuilder() {
  type WindowDraft = {
    id: string;
    label: string;
    type: "random_window" | "fixed_time" | "interval" | "event_contingent" | "participant_initiated";
    start: string;
    end: string;
    fixed: string;
    responseWindow: number;
  };

  const [durationMode, setDurationMode] = useState("relative_days");
  const [duration, setDuration] = useState(14);
  const [minimumInterval, setMinimumInterval] = useState(60);
  const [reminders, setReminders] = useState(1);
  const [reminderDelay, setReminderDelay] = useState(15);
  const [timezoneMode, setTimezoneMode] = useState("participant_local");
  const [allowSnooze, setAllowSnooze] = useState(false);
  const [modes, setModes] = useState<string[]>(["random_window"]);
  const [windows, setWindows] = useState<WindowDraft[]>([
    {
      id: "standalone-window-1",
      label: "Morning",
      type: "random_window",
      start: "08:00",
      end: "10:00",
      fixed: "09:00",
      responseWindow: 30,
    },
  ]);

  const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  function toggleMode(mode: string) {
    setModes((previous) =>
      previous.includes(mode)
        ? previous.filter((item) => item !== mode)
        : [...previous, mode]
    );
  }

  function addWindow() {
    setWindows((previous) => [
      ...previous,
      {
        id: makeId(),
        label: `Window ${previous.length + 1}`,
        type: "random_window",
        start: "12:00",
        end: "14:00",
        fixed: "13:00",
        responseWindow: 30,
      },
    ]);
  }

  function updateWindow(id: string, patch: Partial<WindowDraft>) {
    setWindows((previous) =>
      previous.map((window) =>
        window.id === id ? { ...window, ...patch } : window
      )
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
        <p className="font-medium text-cyan-950">Ambulatory Assessment is optional</p>
        <p className="mt-2 text-sm leading-6 text-cyan-900/75">
          Use this screen to design EMA/ESM schedules. In a real study, enable Ambulatory Assessment under Study Builder → Study Components; studies that do not need EMA simply skip it.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Protocol structure" description="Configure duration, sampling modes and timing constraints.">
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Protocol name</span>
              <input defaultValue="Momentary assessment protocol" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-medium">Duration mode</span>
                <select value={durationMode} onChange={(event) => setDurationMode(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <option value="relative_days">Days from participant start</option>
                  <option value="fixed_dates">Fixed calendar dates</option>
                  <option value="participant_defined">Participant/protocol-defined end</option>
                </select>
              </label>

              {durationMode === "relative_days" && (
                <label>
                  <span className="text-sm font-medium">Duration (days)</span>
                  <input type="number" min={1} max={730} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
                </label>
              )}
            </div>

            <div>
              <p className="text-sm font-medium">Sampling modes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["random_window", "Random-time / stratified random"],
                  ["fixed_time", "Fixed-time"],
                  ["interval", "Interval-contingent"],
                  ["event_contingent", "Event-contingent"],
                  ["participant_initiated", "Participant-initiated"],
                  ["context_triggered", "Context-triggered / future"],
                  ["mixed", "Mixed protocol"],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => toggleMode(value)} className={`rounded-full border px-3 py-2 text-xs font-medium ${modes.includes(value) ? "border-cyan-700 bg-cyan-50 text-cyan-900" : "border-slate-200 text-slate-500"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label><span className="text-xs font-medium text-slate-500">Minimum interval (min)</span><input type="number" min={0} value={minimumInterval} onChange={(event) => setMinimumInterval(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label><span className="text-xs font-medium text-slate-500">Reminders</span><input type="number" min={0} max={10} value={reminders} onChange={(event) => setReminders(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label><span className="text-xs font-medium text-slate-500">Reminder delay</span><input type="number" min={1} value={reminderDelay} onChange={(event) => setReminderDelay(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm lg:self-end"><input type="checkbox" checked={allowSnooze} onChange={(event) => setAllowSnooze(event.target.checked)} />Allow snooze</label>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Time-zone handling</span>
              <select value={timezoneMode} onChange={(event) => setTimezoneMode(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option value="participant_local">Follow participant local time</option>
                <option value="study_timezone">Lock to study timezone</option>
                <option value="enrollment_timezone">Lock enrollment timezone</option>
              </select>
            </label>
          </div>
        </Panel>

        <Panel title="Protocol controls">
          <div className="space-y-5">
            {[
              ["Response windows", "Each signal can expire after a configurable response period."],
              ["Do-not-disturb", "Study Builder stores quiet hours and sleep-window protection."],
              ["Weekday/weekend schedules", "Protocols can distinguish all days, weekdays, weekends or custom days."],
              ["Event limits", "Event-contingent entries can have per-day maxima and interval constraints."],
              ["Travel / timezone", "The study can follow local time or remain locked to a protocol timezone."],
              ["Prompt content", "EMA questions use the same universal item engine as ordinary questionnaires."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Prompt / event windows" description="Mix different scheduling methods in one protocol.">
        <div className="space-y-4">
          {windows.map((window, index) => (
            <div key={window.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <input value={window.label} onChange={(event) => updateWindow(window.id, { label: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                <select value={window.type} onChange={(event) => updateWindow(window.id, { type: event.target.value as WindowDraft["type"] })} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  <option value="random_window">Random within window</option>
                  <option value="fixed_time">Fixed time</option>
                  <option value="interval">Interval window</option>
                  <option value="event_contingent">Event-contingent</option>
                  <option value="participant_initiated">Participant-initiated</option>
                </select>
                <button type="button" onClick={() => setWindows((previous) => previous.filter((item) => item.id !== window.id))} className="rounded-xl border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-700">Remove</button>
              </div>

              {(window.type === "random_window" || window.type === "interval") && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label><span className="text-xs text-slate-500">Start</span><input type="time" value={window.start} onChange={(event) => updateWindow(window.id, { start: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                  <label><span className="text-xs text-slate-500">End</span><input type="time" value={window.end} onChange={(event) => updateWindow(window.id, { end: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                  <label><span className="text-xs text-slate-500">Response window (min)</span><input type="number" min={1} value={window.responseWindow} onChange={(event) => updateWindow(window.id, { responseWindow: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                </div>
              )}

              {window.type === "fixed_time" && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label><span className="text-xs text-slate-500">Exact time</span><input type="time" value={window.fixed} onChange={(event) => updateWindow(window.id, { fixed: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                  <label><span className="text-xs text-slate-500">Response window (min)</span><input type="number" min={1} value={window.responseWindow} onChange={(event) => updateWindow(window.id, { responseWindow: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label>
                </div>
              )}

              {(window.type === "event_contingent" || window.type === "participant_initiated") && (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">This window is participant/event-triggered rather than scheduled at a clock time. The saved Study Builder protocol can define event name, maximum occurrences and minimum intervals.</p>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addWindow} className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">+ Add prompt / event window</button>
      </Panel>

      <Panel title="Prompt questionnaire">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-medium">Use the universal questionnaire engine for EMA content</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Momentary assessments can contain sliders, choices, matrices, open responses, media or other universal item types. Study-level attachment of a questionnaire/protocol is the next participant-flow stage.</p>
          </div>
          <button type="button" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Configure through Study Builder</button>
        </div>
      </Panel>
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
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{participantError}</p>
        </div>
      )}

      {participantMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm text-emerald-800">{participantMessage}</p>
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
                    className="rounded-xl border border-slate-200 p-4"
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
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
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm leading-6 text-red-700">{linkError}</p>
        </div>
      )}

      {linkMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm leading-6 text-emerald-800">{linkMessage}</p>
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
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
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
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
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
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm"
                />
              </label>
            )}

            {accessMode === "open" && (
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
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
              <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <input
                  type="checkbox"
                  checked={activationConfirmed}
                  onChange={(event) =>
                    setActivationConfirmed(event.target.checked)
                  }
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-amber-950">
                    Confirm live deployment
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
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
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold"
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
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold"
                      >
                        Open
                      </button>

                      <button
                        type="button"
                        onClick={() => void toggleLinkStatus(link)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold"
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
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
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
  | "questionnaire_scores"
  | "consent"
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
  response_type: string;
  required: boolean;
  response_options: unknown;
};

type ResearchDataExportLog = {
  id: string;
  dataset_type: string;
  export_format: "csv" | "json";
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
  exportLogs: ResearchDataExportLog[];
};

type ResearchTableRow = Record<string, unknown>;

type ResearchCodebookRow = {
  variable: string;
  label: string;
  type: string;
  source: string;
  notes: string;
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
  exportLogs: [],
};

const researchDatasetLabels: Record<ResearchDatasetType, string> = {
  participant_summary: "Participant summary",
  demographics: "Demographics — long format",
  questionnaire_responses: "Questionnaire responses — long format",
  questionnaire_scores: "Questionnaire scores — long format",
  consent: "Consent records",
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
            "id, participant_id, phase, status, is_test, started_at, last_seen_at, completed_at"
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
            "id, questionnaire_id, questionnaire_version_id, measurement_point, position, required"
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
              "id, version_id, item_key, position, prompt, subscale, response_type, required, response_options"
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

      return {
        ...participantBase(participant),
        participant_code:
          identityMode === "pseudonymous" && includeDirectIdentifiers
            ? participant.participant_code || ""
            : "",
        consented: consent?.consented ?? false,
        session_count: sessions.length,
        completed_questionnaires: completedMeasures.length,
        questionnaire_item_responses: responses.length,
        demographic_responses: demographics.length,
      };
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
            phase: measure.measurement_point,
            questionnaire: questionnaire.name,
            acronym: questionnaire.acronym || "",
            item_key: item.item_key || `item_${item.position}`,
            item_position: item.position,
            item_prompt: item.prompt,
            subscale: item.subscale || "",
            response_type: item.response_type,
            response: response.response,
            numeric_value: response.numeric_value,
            text_value: response.text_value,
            score_value: response.score_value,
            answered_at: response.answered_at,
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
          phase: measure.measurement_point,
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
            phase: measure.measurement_point,
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

  // analysis_wide — one row per participant with non-identifying
  // demographics + questionnaire scores.
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

    const participantMeasureSessions = bundle.measureSessions.filter(
      (session) =>
        session.participant_id === participant.id &&
        session.status === "completed"
    );

    for (const session of participantMeasureSessions) {
      const measure = researchMeasureForId(bundle, session.study_measure_id);
      const questionnaire = researchQuestionnaireForMeasure(
        bundle,
        measure || undefined
      );

      if (!measure || !questionnaire) continue;

      const questionnaireKey = researchSafeVariable(
        questionnaire.acronym || questionnaire.name
      );

      const scores =
        session.scores && typeof session.scores === "object"
          ? Object.entries(session.scores)
          : [];

      for (const [scoreName, scoreValue] of scores) {
        const scoreKey = researchSafeVariable(scoreName || "total");
        row[
          `${researchSafeVariable(
            measure.measurement_point
          )}_${questionnaireKey}_${scoreKey}`
        ] = scoreValue;
      }
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
        variable: "questionnaire_item_responses",
        label: "Stored questionnaire item responses",
        type: "Integer",
        source: "research_responses",
        notes: "Count of item-level responses.",
      },
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
          variable: `${researchSafeVariable(
            measure.measurement_point
          )}_${researchSafeVariable(
            questionnaire.acronym || questionnaire.name
          )}_${researchSafeVariable(
            item.item_key || `item_${item.position}`
          )}`,
          label: item.prompt,
          type: item.response_type,
          source: questionnaire.name,
          notes: `${measure.measurement_point}${
            item.subscale ? ` · Subscale: ${item.subscale}` : ""
          }${item.required ? " · Required" : ""}`,
        });
      }
    }

    return rows;
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
        const variable = `${researchSafeVariable(
          measure.measurement_point
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
          notes: `${measure.measurement_point} score stored by the participant runner.`,
        });
      }
    }

    return rows;
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

  researchBuildCodebook(
    bundle,
    "questionnaire_scores",
    includeDirectIdentifiers
  ).forEach((score) => rows.push(score));

  return rows;
}

/* =========================================================
   DATA DASHBOARD
   ========================================================= */

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="min-w-[300px]">
          <span className="text-sm font-medium">Study</span>
          <select
            value={selectedStudyId}
            onChange={(event) => setSelectedStudyId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
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
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-medium text-amber-950">
                    Ambulatory component configured
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
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
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
          >
            Open Data Explorer
          </button>

          <button
            type="button"
            onClick={() => changeScreen("exports")}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Export study data
          </button>
        </div>
      </Panel>
    </div>
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

  const codebook = researchBuildCodebook(
    bundle,
    datasetType,
    showDirectIdentifiers
  );

  return (
    <div className="space-y-5">
      <Panel
        title="Data Explorer"
        description="Inspect real participant, demographic, questionnaire, score and consent records for one study."
      >
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <label>
            <span className="text-sm font-medium">Study</span>
            <select
              value={selectedStudyId}
              onChange={(event) => setSelectedStudyId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
          />

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs">
            <input
              type="checkbox"
              checked={includeTestData}
              onChange={(event) =>
                setIncludeTestData(event.target.checked)
              }
            />
            Include TEST data
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs">
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Status type="accent">
              {researchDatasetLabels[datasetType]}
            </Status>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {filteredRows.length} row
              {filteredRows.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </Panel>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm leading-6 text-red-700">{error}</p>
        </div>
      )}

      <Panel
        title="Dataset"
        description={
          filteredRows.length > 250
            ? `Showing the first 250 of ${filteredRows.length} matching rows. Use Export Data for the complete dataset.`
            : "The table below is generated from the selected study's stored data."
        }
      >
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
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap pb-3 pr-5 font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columns.map((column) => (
                      <td
                        key={column}
                        className="max-w-[360px] whitespace-nowrap py-4 pr-5 text-slate-600"
                        title={researchValueText(row[column])}
                      >
                        {researchShortValue(row[column], 70)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

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
                className="rounded-xl border border-slate-200 p-4"
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

      {selectedStudy?.components?.ambulatory && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-medium text-amber-950">
            Ambulatory data is not shown yet
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-800">
            Your study may contain an ambulatory component, but participant EMA
            delivery and response storage are a later stage. PsyLattice does
            not display fabricated ambulatory observations.
          </p>
        </div>
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

  const [datasetType, setDatasetType] =
    useState<ResearchDatasetType>("analysis_wide");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [identityMode, setIdentityMode] =
    useState<ResearchIdentityMode>("pseudonymous");
  const [includeTestData, setIncludeTestData] = useState(false);
  const [includeDirectIdentifiers, setIncludeDirectIdentifiers] =
    useState(false);
  const [identifierConfirmed, setIdentifierConfirmed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportMessage, setExportMessage] = useState("");

  useEffect(() => {
    if (!includeDirectIdentifiers) {
      setIdentifierConfirmed(false);
    }
  }, [includeDirectIdentifiers]);

  const previewRows = researchBuildRows(
    bundle,
    datasetType,
    identityMode,
    includeTestData,
    includeDirectIdentifiers
  );

  const codebook = researchBuildCodebook(
    bundle,
    datasetType,
    includeDirectIdentifiers
  );

  async function logExport(rowCount: number) {
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
        dataset_type: datasetType,
        export_format: format,
        identity_mode: identityMode,
        include_test_data: includeTestData,
        include_direct_identifiers: includeDirectIdentifiers,
        row_count: rowCount,
        metadata: {
          study_title: selectedStudy?.title || "",
          codebook_variables: codebook.length,
          generated_client_side: true,
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

    const rows = researchBuildRows(
      bundle,
      datasetType,
      identityMode,
      includeTestData,
      includeDirectIdentifiers
    );

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

    if (format === "csv") {
      researchDownloadText(
        `${baseName}.csv`,
        researchRowsToCsv(rows),
        "text/csv;charset=utf-8"
      );
    } else {
      researchDownloadText(
        `${baseName}.json`,
        JSON.stringify(
          {
            metadata: {
              platform: "PsyLattice",
              study_id: selectedStudy.id,
              study_title: selectedStudy.title,
              dataset: datasetType,
              dataset_label: researchDatasetLabels[datasetType],
              identity_mode: identityMode,
              include_test_data: includeTestData,
              include_direct_identifiers: includeDirectIdentifiers,
              generated_at: new Date().toISOString(),
            },
            codebook,
            data: rows,
          },
          null,
          2
        ),
        "application/json;charset=utf-8"
      );
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
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm leading-6 text-red-700">{error}</p>
        </div>
      )}

      {exportError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm leading-6 text-red-700">{exportError}</p>
        </div>
      )}

      {exportMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm leading-6 text-emerald-800">
            {exportMessage}
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel
          title="Create research export"
          description="Generate a real CSV or JSON file from the selected study data."
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Study</span>
              <select
                value={selectedStudyId}
                onChange={(event) =>
                  setSelectedStudyId(event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
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
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
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

              <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <input
                  type="checkbox"
                  checked={includeDirectIdentifiers}
                  onChange={(event) =>
                    setIncludeDirectIdentifiers(event.target.checked)
                  }
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-amber-950">
                    Include demographic fields marked as direct identifiers
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Off by default. Free-text questionnaire answers may still
                    contain participant-entered identifying information and
                    cannot be automatically de-identified reliably.
                  </p>
                </div>
              </label>

              {includeDirectIdentifiers && (
                <label className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
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
                  ["csv", "CSV"],
                  ["json", "JSON + codebook"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormat(value as "csv" | "json")
                    }
                    className={`rounded-full border px-3 py-2 text-xs font-medium ${
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

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Current export</p>
              <p className="mt-1 font-medium">
                {researchDatasetLabels[datasetType]}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {loading
                  ? "Calculating rows..."
                  : `${previewRows.length} row${
                      previewRows.length === 1 ? "" : "s"
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
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold disabled:opacity-40"
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
                "Analysis-wide dataset",
                "One row per participant with configured demographics and stored questionnaire scores.",
              ],
              [
                "Long-format questionnaire data",
                "One row per item response, with questionnaire, phase, item metadata and stored score value.",
              ],
              [
                "Demographic data",
                "Direct identifier fields are excluded by default.",
              ],
              [
                "Codebook",
                "Generated from the exact study demographic questions and questionnaire versions selected for the study.",
              ],
              [
                "TEST separation",
                "TEST participants are excluded unless you explicitly include them.",
              ],
            ].map(([name, description]) => (
              <div key={name} className="flex gap-3">
                <span className="mt-1 text-emerald-700">
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

          <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
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
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold"
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

        <button className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
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
              className="flex justify-between gap-5 rounded-xl border border-slate-200 p-4"
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

  const currentNavigation = navigation.find((item) => item.id === screen)!;

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return <Dashboard changeScreen={setScreen} />;

      case "studies":
        return <Studies changeScreen={setScreen} />;

      case "builder":
        return <StudyBuilder changeScreen={setScreen} />;

      case "library":
        return <QuestionnaireLibrary changeScreen={setScreen} />;

      case "ambulatory":
        return <AmbulatoryBuilder />;

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
    ambulatory:
      "Design repeated real-world EMA and ESM assessment protocols.",
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
    <main className="min-h-screen bg-[#f6f8f8] text-slate-950">
      {/* Header */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
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

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              PD
            </div>

            <Link
              href="/signin"
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Sign out
            </Link>
          </div>

          <select
            value={screen}
            onChange={(event) => setScreen(event.target.value as Screen)}
            className="max-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm lg:hidden"
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

        <aside className="fixed bottom-0 left-0 top-20 z-40 hidden w-[245px] overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
          {groups.map((group) => (
            <div key={group} className="mb-6">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                {group}
              </p>

              <nav className="space-y-1">
                {navigation
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = item.id === screen;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setScreen(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "bg-cyan-50 font-semibold text-cyan-900"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? "bg-cyan-700" : "bg-slate-300"
                          }`}
                        />

                        {item.label}
                      </button>
                    );
                  })}
              </nav>
            </div>
          ))}

          <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-medium text-cyan-200">
              Research workspace
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Saved studies, participant records and recruitment links shown
              here are loaded from your PsyLattice research database.
            </p>
          </div>
        </aside>

        {/* Main content */}

        <section className="min-w-0 p-5 sm:p-6 lg:ml-[245px] lg:p-8">
          <div className="mx-auto max-w-[1450px]">
            <div className="mb-7">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Status type="accent">Researcher workspace</Status>

                <span className="text-xs text-slate-400">
                  Live workspace data
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                {screen === "dashboard"
                  ? "Research overview"
                  : currentNavigation.label}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {descriptions[screen]}
              </p>
            </div>

            {renderScreen()}
          </div>
        </section>
      </div>
    </main>
  );
}
