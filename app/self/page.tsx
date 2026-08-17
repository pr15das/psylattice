"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import AccountSwitcher from "@/components/AccountSwitcher";
import ClientAppointmentsWorkspace from "@/components/ClientAppointmentsWorkspace";
import PsyLatticeMessagesWorkspace, { MessageUnreadBadge } from "@/components/PsyLatticeMessagesWorkspace";
import AppointmentNotificationBadge from "@/components/AppointmentNotificationBadge";
import UnifiedNotificationsCenter, {
  UnifiedNotificationBadge,
  UnifiedNotificationBell,
  type UnifiedNotificationTargetParams,
} from "@/components/UnifiedNotificationsCenter";
import {
  AmbulatoryProtocolBuilder,
  ambulatoryResponseAnswered,
  ambulatoryVisibleItems,
  cleanHiddenAmbulatoryResponses,
  defaultAmbulatoryProtocol,
  nestAmbulatoryProtocol,
  serializeAmbulatoryProtocol,
  validateAmbulatoryProtocol,
  type AmbulatoryItemDraft,
  type AmbulatoryScheduleDraft,
  type AmbulatoryQuestionnaireOption,
} from "@/components/AmbulatoryProtocolBuilder";


type Screen =
  | "dashboard"
  | "ai"
  | "assessments"
  | "monitoring"
  | "regulation"
  | "progress"
  | "wearables"
  | "appointments"
  | "messages"
  | "notifications"
  | "privacy";

const navigation: {
  id: Screen;
  label: string;
}[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "ai", label: "AI Guide" },
  { id: "assessments", label: "Self-Assessments" },
  { id: "monitoring", label: "Daily Monitoring" },
  { id: "regulation", label: "Self-Regulation" },
  { id: "progress", label: "Progress" },
  { id: "wearables", label: "Wearables" },
  { id: "appointments", label: "Appointments" },
  { id: "messages", label: "Messages" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & Sharing" },
];

function Icon({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
        dark
          ? "bg-slate-950 text-white"
          : "border border-cyan-100 bg-cyan-50 text-cyan-800"
      }`}
    >
      {children}
    </div>
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

      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

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
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-950">{title}</h2>

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
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
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


function DashboardAssessmentSummary({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  type LatestAssessment = {
    id: string;
    questionnaire_id: string;
    completed_at: string | null;
    scores: Record<string, number> | null;
  };

  type AssessmentQuestionnaire = {
    id: string;
    name: string;
    acronym: string | null;
  };

  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState<LatestAssessment | null>(null);
  const [questionnaire, setQuestionnaire] =
    useState<AssessmentQuestionnaire | null>(null);

  useEffect(() => {
    async function loadLatestAssessment() {
      setLoading(true);

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from("assessment_sessions")
        .select("id, questionnaire_id, completed_at, scores")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error("Could not load latest assessment:", sessionError);
        setLoading(false);
        return;
      }

      if (!sessionData) {
        setLatest(null);
        setQuestionnaire(null);
        setLoading(false);
        return;
      }

      const typedSession = sessionData as LatestAssessment;
      setLatest(typedSession);

      const { data: questionnaireData, error: questionnaireError } =
        await supabase
          .from("questionnaires")
          .select("id, name, acronym")
          .eq("id", typedSession.questionnaire_id)
          .maybeSingle();

      if (questionnaireError) {
        console.error(
          "Could not load latest assessment questionnaire:",
          questionnaireError
        );
      } else {
        setQuestionnaire(
          questionnaireData
            ? (questionnaireData as AssessmentQuestionnaire)
            : null
        );
      }

      setLoading(false);
    }

    void loadLatestAssessment();
  }, []);

  const scoreEntries = latest?.scores
    ? Object.entries(latest.scores).filter(
        ([, value]) => typeof value === "number"
      )
    : [];

  return (
    <Panel title="Self-assessments">
      {loading ? (
        <p className="text-sm text-slate-500">Loading assessment history...</p>
      ) : latest && questionnaire ? (
        <div className="rounded-2xl bg-slate-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Latest completed assessment
              </p>
              <p className="mt-2 font-medium">
                {questionnaire.acronym || questionnaire.name}
              </p>
            </div>

            {latest.completed_at && (
              <span className="text-xs text-slate-400">
                {new Date(latest.completed_at).toLocaleDateString([], {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          {scoreEntries.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {scoreEntries.slice(0, 3).map(([label, value]) => (
                <span
                  key={label}
                  className="rounded-full border border-cyan-100 bg-white px-3 py-1 text-xs font-medium text-cyan-900"
                >
                  {label}: {value}
                </span>
              ))}

              {scoreEntries.length > 3 && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-500">
                  +{scoreEntries.length - 3} more
                </span>
              )}
            </div>
          )}

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Scores are shown as questionnaire results for reflection. They are
            not a diagnosis or clinical conclusion.
          </p>

          <button
            type="button"
            onClick={() => changeScreen("assessments")}
            className="mt-5 flex items-center gap-2 text-sm font-semibold"
          >
            View assessment history
            <ArrowIcon />
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="font-medium">No completed self-assessments yet</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Browse PsyLattice's approved self-assessment catalogue and complete
            a measure when you are ready.
          </p>
          <button
            type="button"
            onClick={() => changeScreen("assessments")}
            className="mt-5 flex items-center gap-2 text-sm font-semibold"
          >
            Browse assessments
            <ArrowIcon />
          </button>
        </div>
      )}
    </Panel>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */
type ClinicianInvitation = {
  invitation_id: string;
  clinician_id: string;
  clinician_name: string;
  clinician_email: string;
  message: string | null;
  created_at: string;
};

type ActiveClinicianIdentity = {
  connection_id: string;
  clinician_id: string;
  clinician_name: string;
  clinician_email: string;
  connected_at: string;
};

function ClinicianInvitations({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const [invitations, setInvitations] =
    useState<ClinicianInvitation[]>([]);
  const [
    activeClinician,
    setActiveClinician,
  ] = useState<ActiveClinicianIdentity | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInvitations(showLoading = false) {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const supabase = createClient();

      const [
        invitationsResult,
        cliniciansResult,
      ] = await Promise.all([
        supabase.rpc(
          "psylattice_my_clinician_invitations_v2"
        ),
        supabase.rpc(
          "psylattice_my_clinicians_and_permissions_v2"
        ),
      ]);

      if (cancelled) return;

      if (invitationsResult.error) {
        console.error(
          "Could not load clinician invitations:",
          invitationsResult.error
        );

        setError(
          "Your clinician invitations could not be loaded."
        );

        setLoading(false);
        return;
      }

      if (cliniciansResult.error) {
        console.error(
          "Could not load your current clinician:",
          cliniciansResult.error
        );
      }

      const loadedInvitations =
        (invitationsResult.data ??
          []) as ClinicianInvitation[];

      const currentClinicians =
        (cliniciansResult.data ??
          []) as ActiveClinicianIdentity[];

      setInvitations(loadedInvitations);
      setActiveClinician(
        currentClinicians[0] || null
      );
      onCountChange?.(
        loadedInvitations.length
      );

      setLoading(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadInvitations(false);
      }
    }

    function refreshClinicianState() {
      void loadInvitations(false);
    }

    void loadInvitations(true);

    const interval = window.setInterval(
      () => void loadInvitations(false),
      10000
    );

    window.addEventListener(
      "focus",
      refreshClinicianState
    );
    window.addEventListener(
      "psylattice-clinician-state-changed",
      refreshClinicianState
    );
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener(
        "focus",
        refreshClinicianState
      );
      window.removeEventListener(
        "psylattice-clinician-state-changed",
        refreshClinicianState
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, []);

  async function respondToInvitation(
    invitationId: string,
    response: "accept" | "decline"
  ) {
    if (respondingId) return;

    if (
      response === "accept" &&
      activeClinician
    ) {
      setError(
        `You are already connected to ${activeClinician.clinician_name}. Disconnect your current clinician before connecting to another clinician.`
      );
      return;
    }

    setRespondingId(invitationId);
    setError("");
    setSuccessMessage("");

    const supabase = createClient();

    const functionName =
      response === "accept"
        ? "psylattice_accept_clinician_invitation"
        : "psylattice_decline_clinician_invitation";

    const { error } = await supabase.rpc(functionName, {
      p_invitation_id: invitationId,
    });

    if (error) {
      console.error(
        `Could not ${response} clinician invitation:`,
        error
      );

      const alreadyConnected =
        response === "accept" &&
        (
          error.message
            ?.toLowerCase()
            .includes(
              "already have an active clinician"
            ) ||
          error.message
            ?.toLowerCase()
            .includes(
              "one_active_clinician"
            )
        );

      setError(
        alreadyConnected
          ? "You already have an active clinician connection. Disconnect your current clinician before connecting to another clinician."
          : response === "accept"
            ? "The clinician connection could not be accepted. Please try again."
            : "The invitation could not be declined. Please try again."
      );

      setRespondingId(null);
      return;
    }

 const remainingInvitations = invitations.filter(
  (invitation) =>
    invitation.invitation_id !== invitationId
);

setInvitations(remainingInvitations);
onCountChange?.(remainingInvitations.length);

    window.dispatchEvent(
      new Event("psylattice-clinician-state-changed")
    );

    const respondedInvitation = invitations.find(
      (invitation) =>
        invitation.invitation_id === invitationId
    );

    if (
      response === "accept" &&
      respondedInvitation
    ) {
      setActiveClinician({
        connection_id: "",
        clinician_id:
          respondedInvitation.clinician_id,
        clinician_name:
          respondedInvitation.clinician_name,
        clinician_email:
          respondedInvitation.clinician_email,
        connected_at:
          new Date().toISOString(),
      });
    }

    setSuccessMessage(
      response === "accept"
        ? `Connection with ${
            respondedInvitation?.clinician_name ||
            "the clinician"
          } accepted. You remain in control of what information you share.`
        : `Invitation from ${
            respondedInvitation?.clinician_name ||
            "the clinician"
          } declined.`
    );

    setRespondingId(null);
  }

  if (loading) {
    return null;
  }

  if (
    invitations.length === 0 &&
    !error &&
    !successMessage
  ) {
    return null;
  }

  return (
    <div className="space-y-3">
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
              ✓
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Connection updated
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeClinician &&
        invitations.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-950">
              You are already connected to{" "}
              {activeClinician.clinician_name}.
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              PsyLattice allows one active clinician at a time. You can still decline other invitations, but to accept a different clinician you must first disconnect your current clinician from the Self dashboard.
            </p>
          </div>
        )}

      {invitations.map((invitation) => {
        const responding =
          respondingId === invitation.invitation_id;

        return (
          <section
            key={invitation.invitation_id}
            className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-sm"
          >
            <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-white px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
                    Clinician invitation
                  </p>

                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                    {invitation.clinician_name} would like to connect
                  </h2>

                  {invitation.clinician_email && (
                    <p className="mt-1 break-all text-xs font-medium text-slate-500">
                      Clinician account: {invitation.clinician_email}
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800">
                  Your approval required
                </span>
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                  Invitation from
                </p>

                <p className="mt-1 font-semibold text-slate-950">
                  {invitation.clinician_name}
                </p>

                {invitation.clinician_email && (
                  <p className="mt-1 break-all text-sm text-slate-600">
                    {invitation.clinician_email}
                  </p>
                )}

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This identity comes from the clinician account that
                  created this invitation.
                </p>
              </div>

              <p className="max-w-3xl text-sm leading-6 text-slate-600">
                This clinician has invited you to connect your
                PsyLattice Self account with their Clinical workspace.
                They will not receive access to your personal
                information simply because the invitation was sent.
              </p>

              {invitation.message && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-400">
                    Message from clinician
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {invitation.message}
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-800">
                  You stay in control of your data
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Accepting creates the clinician connection. We will
                  choose exactly what information can be shared in the
                  next step. Your private Luna conversations are not
                  shared with a clinician by default.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={
                    responding ||
                    Boolean(activeClinician)
                  }
                  onClick={() =>
                    void respondToInvitation(
                      invitation.invitation_id,
                      "accept"
                    )
                  }
                  title={
                    activeClinician
                      ? `Disconnect ${activeClinician.clinician_name} before accepting another clinician.`
                      : "Accept clinician connection"
                  }
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:opacity-100"
                >
                  {responding
                    ? "Updating..."
                    : activeClinician
                      ? "Already connected"
                      : "Accept connection"}
                </button>

                <button
                  type="button"
                  disabled={responding}
                  onClick={() =>
                    void respondToInvitation(
                      invitation.invitation_id,
                      "decline"
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Decline
                </button>
              </div>

              {activeClinician && (
                <p className="mt-3 text-xs font-medium leading-5 text-amber-700">
                  To connect with {invitation.clinician_name}, first disconnect {activeClinician.clinician_name} from your Self dashboard.
                </p>
              )}

              <p className="mt-4 text-xs text-slate-400">
                Invited{" "}
                {new Date(
                  invitation.created_at
                ).toLocaleDateString()}
              </p>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Dashboard({
  changeScreen,
  pendingClinicianInvitations,
}: {
  changeScreen: (screen: Screen) => void;
  pendingClinicianInvitations: number;
}) {
  type DashboardV2Item = {
    item_id?: string;
    key: string;
    type: string;
    prompt: string;
    config: Record<string, any>;
  };

  type DashboardV2Schedule = {
    schedule_id?: string;
    key: string;
    label: string;
    start_time: string;
    end_time: string;
    items: DashboardV2Item[];
  };

  type DashboardV2Plan = {
    plan_id: string;
    plan_name: string;
    duration_days: number;
    start_date: string;
    protocol: DashboardV2Schedule[];
  };

  type DashboardV2Checkin = {
    checkin_id: string;
    plan_id: string;
    schedule_id: string;
    schedule_label: string;
    entry_date: string;
    completed_at: string;
    responses: Array<{
      item_id: string;
      item_key: string;
      type: string;
      prompt: string;
      response: any;
    }>;
  };

  type DashboardRegulationPlan = {
    id: string;
    name: string;
    duration_days: number;
    start_date: string;
    status: string;
  };

  type DashboardRegulationActivity = {
    id: string;
    name: string;
    target_per_day: number;
    sort_order: number;
  };

  type DashboardRegulationCompletion = {
    id: string;
    activity_id: string;
    occurrence: number;
    completed_at: string;
  };

  const [loadingMonitoring, setLoadingMonitoring] = useState(true);
  const [monitoringError, setMonitoringError] = useState("");
  const [monitoringPlan, setMonitoringPlan] =
    useState<DashboardV2Plan | null>(null);
  const [todayCheckins, setTodayCheckins] = useState<
    DashboardV2Checkin[]
  >([]);

  const [loadingRegulation, setLoadingRegulation] = useState(true);
  const [regulationError, setRegulationError] = useState("");
  const [regulationPlan, setRegulationPlan] =
    useState<DashboardRegulationPlan | null>(null);
  const [regulationActivities, setRegulationActivities] = useState<
    DashboardRegulationActivity[]
  >([]);
  const [todayRegulationCompletions, setTodayRegulationCompletions] =
    useState<DashboardRegulationCompletion[]>([]);

  type DashboardConnectedClinician = {
    connection_id: string;
    clinician_id: string;
    clinician_name: string;
    clinician_email: string;
    connected_at: string;
    share_assessments: boolean;
    share_monitoring: boolean;
    share_progress: boolean;
    share_wearables: boolean;
    share_regulation: boolean;
  };

  const [
    dashboardClinicians,
    setDashboardClinicians,
  ] = useState<DashboardConnectedClinician[]>([]);
  const [
    loadingDashboardClinicians,
    setLoadingDashboardClinicians,
  ] = useState(true);
  const [
    dashboardClinicianError,
    setDashboardClinicianError,
  ] = useState("");

  const [
    clinicianPendingRemoval,
    setClinicianPendingRemoval,
  ] = useState<DashboardConnectedClinician | null>(
    null
  );
  const [
    removingDashboardClinician,
    setRemovingDashboardClinician,
  ] = useState(false);
  const [
    dashboardConnectionMessage,
    setDashboardConnectionMessage,
  ] = useState("");

  function getLocalDateString(date = new Date()) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function buildItemConfigMap(plan: DashboardV2Plan | null) {
    const map = new Map<
      string,
      {
        type: string;
        prompt: string;
        config: Record<string, any>;
      }
    >();

    for (const schedule of plan?.protocol || []) {
      for (const item of schedule.items || []) {
        map.set(item.key, {
          type: item.type,
          prompt: item.prompt,
          config: item.config || {},
        });
      }
    }

    return map;
  }

  function normaliseRatingToTen(
    response: any,
    config: Record<string, any>
  ) {
    const value = Number(response);

    if (!Number.isFinite(value)) {
      return null;
    }

    const min = Number(config.min);
    const max = Number(config.max);

    if (
      Number.isFinite(min) &&
      Number.isFinite(max) &&
      max > min
    ) {
      const normalised =
        ((value - min) / (max - min)) * 10;

      return Math.max(
        0,
        Math.min(10, normalised)
      );
    }

    return value >= 0 && value <= 10
      ? value
      : null;
  }

  function ratingSeries(
    checkins: DashboardV2Checkin[],
    plan: DashboardV2Plan | null
  ) {
    const itemMap = buildItemConfigMap(plan);
    const stressValues: number[] = [];
    const sliderValues: number[] = [];

    for (const checkin of checkins) {
      for (const response of checkin.responses || []) {
        const item = itemMap.get(response.item_key);

        if (!item) {
          continue;
        }

        const numeric = normaliseRatingToTen(
          response.response,
          item.config
        );

        if (numeric === null) {
          continue;
        }

        if (
          item.type === "slider" ||
          item.type === "number"
        ) {
          if (
            item.prompt
              .toLowerCase()
              .includes("stress")
          ) {
            stressValues.push(numeric);
          }
        }

        if (item.type === "slider") {
          sliderValues.push(numeric);
        }
      }
    }

    if (stressValues.length > 0) {
      return {
        kind: "stress" as const,
        values: stressValues,
      };
    }

    if (sliderValues.length > 0) {
      return {
        kind: "rating" as const,
        values: sliderValues,
      };
    }

    return {
      kind: "none" as const,
      values: [] as number[],
    };
  }

  async function loadDashboardClinicians(
    showLoading = true
  ) {
    if (showLoading) {
      setLoadingDashboardClinicians(true);
    }

    setDashboardClinicianError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_my_clinicians_and_permissions_v2"
    );

    if (error) {
      console.error(
        "Could not load connected clinicians for dashboard:",
        error
      );

      setDashboardClinicianError(
        "Your connected clinician information could not be loaded."
      );
      setDashboardClinicians([]);
      setLoadingDashboardClinicians(false);
      return;
    }

    setDashboardClinicians(
      (data ?? []) as DashboardConnectedClinician[]
    );
    setLoadingDashboardClinicians(false);
  }

  async function disconnectDashboardClinician() {
    if (
      !clinicianPendingRemoval ||
      removingDashboardClinician
    ) {
      return;
    }

    setRemovingDashboardClinician(true);
    setDashboardClinicianError("");
    setDashboardConnectionMessage("");

    const clinician = clinicianPendingRemoval;
    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_end_connection_as_client",
      {
        p_connection_id:
          clinician.connection_id,
      }
    );

    if (error) {
      console.error(
        "Could not disconnect clinician:",
        error
      );
      setDashboardClinicianError(
        "The clinician connection could not be removed. Please try again."
      );
      setRemovingDashboardClinician(false);
      return;
    }

    setDashboardClinicians([]);
    setClinicianPendingRemoval(null);
    setRemovingDashboardClinician(false);
    setDashboardConnectionMessage(
      `${clinician.clinician_name} has been disconnected. Their access through this PsyLattice connection has ended. Your Self data remains in your account.`
    );

    window.dispatchEvent(
      new Event("psylattice-clinician-state-changed")
    );

    void loadDashboardClinicians(false);
  }

  async function loadDashboardMonitoring(
    showLoading = true
  ) {
    if (showLoading) {
      setLoadingMonitoring(true);
    }

    setMonitoringError("");

    const supabase = createClient();

    const [planResult, checkinResult] =
      await Promise.all([
        supabase.rpc(
          "psylattice_my_monitoring_protocol_v2"
        ),
        supabase.rpc(
          "psylattice_my_monitoring_checkins_v2",
          {
            p_days: 2,
          }
        ),
      ]);

    if (planResult.error) {
      console.error(
        "Could not load V2 dashboard monitoring plan:",
        planResult.error
      );
      setMonitoringError(
        "Your monitoring plan could not be loaded."
      );
      setMonitoringPlan(null);
      setTodayCheckins([]);
      setLoadingMonitoring(false);
      return;
    }

    if (checkinResult.error) {
      console.error(
        "Could not load V2 dashboard check-ins:",
        checkinResult.error
      );
      setMonitoringError(
        "Your completed check-ins could not be loaded."
      );
      setTodayCheckins([]);
      setLoadingMonitoring(false);
      return;
    }

    const row =
      Array.isArray(planResult.data) &&
      planResult.data.length > 0
        ? (planResult.data[0] as DashboardV2Plan)
        : null;

    setMonitoringPlan(row);

    if (!row) {
      setTodayCheckins([]);
      setLoadingMonitoring(false);
      return;
    }

    const today = getLocalDateString();

    setTodayCheckins(
      (
        (checkinResult.data ??
          []) as DashboardV2Checkin[]
      ).filter(
        (checkin) =>
          checkin.plan_id === row.plan_id &&
          checkin.entry_date === today
      )
    );

    setLoadingMonitoring(false);
  }

  useEffect(() => {
    void loadDashboardClinicians(true);
    void loadDashboardMonitoring(true);

    function refreshMonitoring() {
      void loadDashboardClinicians(false);
      void loadDashboardMonitoring(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadDashboardMonitoring(false);
      }
    }

    window.addEventListener(
      "focus",
      refreshMonitoring
    );
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshMonitoring
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, []);

  useEffect(() => {
    async function loadDashboardRegulation() {
      setLoadingRegulation(true);
      setRegulationError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setRegulationError(
          "Your self-regulation data could not be loaded."
        );
        setLoadingRegulation(false);
        return;
      }

      const { data: planData, error: planError } =
        await supabase
          .from("regulation_plans")
          .select(
            "id, name, duration_days, start_date, status"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (planError) {
        console.error(
          "Could not load dashboard regulation plan:",
          planError
        );
        setRegulationError(
          "Your self-regulation data could not be loaded."
        );
        setLoadingRegulation(false);
        return;
      }

      if (!planData) {
        setRegulationPlan(null);
        setRegulationActivities([]);
        setTodayRegulationCompletions([]);
        setLoadingRegulation(false);
        return;
      }

      const typedPlan =
        planData as DashboardRegulationPlan;

      setRegulationPlan(typedPlan);

      const [activityResult, completionResult] =
        await Promise.all([
          supabase
            .from("regulation_activities")
            .select(
              "id, name, target_per_day, sort_order"
            )
            .eq("plan_id", typedPlan.id)
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("sort_order", {
              ascending: true,
            }),
          supabase
            .from("regulation_completions")
            .select(
              "id, activity_id, occurrence, completed_at"
            )
            .eq("plan_id", typedPlan.id)
            .eq("user_id", user.id)
            .eq(
              "completion_date",
              getLocalDateString()
            )
            .order("completed_at", {
              ascending: true,
            }),
        ]);

      if (activityResult.error) {
        console.error(
          "Could not load dashboard regulation activities:",
          activityResult.error
        );
        setRegulationError(
          "Your self-regulation activities could not be loaded."
        );
        setLoadingRegulation(false);
        return;
      }

      if (completionResult.error) {
        console.error(
          "Could not load dashboard regulation completions:",
          completionResult.error
        );
        setRegulationError(
          "Today's self-regulation progress could not be loaded."
        );
        setLoadingRegulation(false);
        return;
      }

      setRegulationActivities(
        (activityResult.data ||
          []) as DashboardRegulationActivity[]
      );
      setTodayRegulationCompletions(
        (completionResult.data ||
          []) as DashboardRegulationCompletion[]
      );
      setLoadingRegulation(false);
    }

    void loadDashboardRegulation();
  }, []);

  const monitoringSchedules =
    monitoringPlan?.protocol || [];

  const scheduledMonitoringSchedules =
    monitoringSchedules.filter(
      (schedule: any) =>
        schedule.trigger_type !== "event_contingent" &&
        schedule.trigger_type !== "participant_initiated"
    );

  const eventMonitoringSchedules =
    monitoringSchedules.filter(
      (schedule: any) =>
        schedule.trigger_type === "event_contingent" ||
        schedule.trigger_type === "participant_initiated"
    );

  const completedToday = todayCheckins.filter(
    (checkin: any) =>
      checkin.trigger_type !== "event_contingent" &&
      checkin.trigger_type !== "participant_initiated"
  ).length;
  const totalToday =
    scheduledMonitoringSchedules.length;
  const remainingToday = Math.max(
    totalToday - completedToday,
    0
  );

  const rating = ratingSeries(
    todayCheckins,
    monitoringPlan
  );

  const averageRating =
    rating.values.length > 0
      ? (
          rating.values.reduce(
            (sum, value) => sum + value,
            0
          ) / rating.values.length
        ).toFixed(1)
      : null;

  const lowestRating =
    rating.values.length > 0
      ? Math.min(...rating.values).toFixed(1)
      : null;

  const highestRating =
    rating.values.length > 0
      ? Math.max(...rating.values).toFixed(1)
      : null;

  const ratingLabel =
    rating.kind === "stress"
      ? "Current stress"
      : "Average rating";

  const ratingDetail =
    rating.kind === "stress"
      ? "Average of today's stress responses"
      : rating.kind === "rating"
        ? "Average of today's slider responses"
        : "No rating response saved yet";

  const completionPercentage =
    totalToday > 0
      ? Math.round(
          (completedToday / totalToday) * 100
        )
      : 0;

  const planDay = (() => {
    if (!monitoringPlan?.start_date) {
      return null;
    }

    const start = new Date(
      `${monitoringPlan.start_date}T00:00:00`
    );
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const difference = Math.floor(
      (today.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return Math.min(
      monitoringPlan.duration_days,
      Math.max(1, difference + 1)
    );
  })();

  function checkinForSchedule(
    scheduleId: string
  ) {
    return todayCheckins.find(
      (checkin) =>
        checkin.schedule_id === scheduleId
    );
  }

  function formatEntryTime(completedAt: string) {
    return new Date(
      completedAt
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const regulationPlanDay = (() => {
    if (!regulationPlan?.start_date) {
      return null;
    }

    const start = new Date(
      `${regulationPlan.start_date}T00:00:00`
    );
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const difference = Math.floor(
      (today.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return Math.max(1, difference + 1);
  })();

  const regulationTargetToday =
    regulationActivities.reduce(
      (sum, activity) =>
        sum + activity.target_per_day,
      0
    );
  const regulationCompletedToday =
    todayRegulationCompletions.length;
  const regulationCompletionPercentage =
    regulationTargetToday > 0
      ? Math.min(
          100,
          Math.round(
            (regulationCompletedToday /
              regulationTargetToday) *
              100
          )
        )
      : 0;

  // A Self account is designed to have one current clinician.
  // We deliberately present a single, clear connection in the UI.
  const currentClinician =
    dashboardClinicians[0] || null;

  return (
    <div className="space-y-5">
      {dashboardClinicianError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">
            {dashboardClinicianError}
          </p>
        </div>
      )}

      {monitoringError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">
            {monitoringError}
          </p>
        </div>
      )}

      {regulationError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">
            {regulationError}
          </p>
        </div>
      )}

      {dashboardConnectionMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {dashboardConnectionMessage}
        </div>
      )}

      {pendingClinicianInvitations > 0 && (
        <section className="overflow-hidden rounded-3xl border border-cyan-200 bg-cyan-50/70 shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
                New clinician request
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                You have {pendingClinicianInvitations}{" "}
                clinician invitation{pendingClinicianInvitations === 1 ? "" : "s"} waiting
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Review the request before deciding whether to connect. No Self data is shared just because an invitation was sent.
              </p>
            </div>

            <button
              type="button"
              onClick={() => changeScreen("notifications")}
              className="shrink-0 rounded-xl bg-cyan-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-700"
            >
              Review invitation{pendingClinicianInvitations === 1 ? "" : "s"}
            </button>
          </div>
        </section>
      )}

      {/* CURRENT CLINICIAN — intentionally prominent because Self has one current clinician */}
      <section className="overflow-hidden rounded-3xl border border-cyan-200 bg-white shadow-sm">
        <div className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-white px-5 py-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
                Your clinician connection
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {loadingDashboardClinicians
                  ? "Checking your clinician..."
                  : currentClinician
                    ? "You are connected to"
                    : "No clinician connected"}
              </h2>
            </div>

            {currentClinician && (
              <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                ● Connected
              </span>
            )}
          </div>
        </div>

        {loadingDashboardClinicians ? (
          <div className="p-6 text-sm text-slate-500">
            Loading your clinician connection...
          </div>
        ) : !currentClinician ? (
          <div className="p-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
              <p className="font-semibold text-slate-800">
                You are not currently connected to a clinician.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                When you accept a clinician invitation, that clinician becomes your current PsyLattice clinician and will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-800 text-base font-bold text-white shadow-sm">
                  {currentClinician.clinician_name
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) =>
                      part.charAt(0).toUpperCase()
                    )
                    .join("") || "CL"}
                </div>

                <div className="min-w-0">
                  <p className="text-xl font-semibold tracking-tight text-slate-950">
                    {currentClinician.clinician_name}
                  </p>

                  {currentClinician.clinician_email && (
                    <p className="mt-1 break-all text-sm text-slate-500">
                      {currentClinician.clinician_email}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    Connected since{" "}
                    {new Date(
                      currentClinician.connected_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    changeScreen("messages")
                  }
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  Message clinician
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeScreen("appointments")
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Appointments
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeScreen("privacy")
                  }
                  className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100/70"
                >
                  Manage sharing
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDashboardConnectionMessage("");
                    setClinicianPendingRemoval(
                      currentClinician
                    );
                  }}
                  className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Disconnect clinician
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Connection
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  Active
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Data sharing
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {[
                    currentClinician.share_assessments,
                    currentClinician.share_monitoring,
                    currentClinician.share_progress,
                    currentClinician.share_wearables,
                    currentClinician.share_regulation,
                  ].filter(Boolean).length}{" "}
                  of 5 categories enabled
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Luna conversations
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  Private
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={loadingMonitoring}
          onClick={() => {
            void loadDashboardClinicians(true);
            void loadDashboardMonitoring(true);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh dashboard
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's check-ins"
          value={
            loadingMonitoring
              ? "..."
              : monitoringPlan
                ? `${completedToday} / ${totalToday}`
                : "Not set"
          }
          detail={
            loadingMonitoring
              ? "Loading monitoring"
              : monitoringPlan
                ? remainingToday === 0 &&
                  totalToday > 0
                  ? "All scheduled check-ins completed"
                  : `${remainingToday} remaining today`
                : "Create a monitoring plan"
          }
        />

        <StatCard
          label={ratingLabel}
          value={
            loadingMonitoring
              ? "..."
              : averageRating
                ? `${averageRating} / 10`
                : "No data"
          }
          detail={ratingDetail}
        />

        <StatCard
          label="Monitoring plan"
          value={
            loadingMonitoring
              ? "..."
              : monitoringPlan
                ? planDay
                  ? `Day ${planDay}`
                  : "Active"
                : "None"
          }
          detail={
            monitoringPlan
              ? `${monitoringPlan.duration_days}-day plan · ${totalToday}/day`
              : "No active monitoring plan"
          }
        />

        <StatCard
          label="Today's completion"
          value={
            loadingMonitoring
              ? "..."
              : monitoringPlan
                ? `${completionPercentage}%`
                : "—"
          }
          detail={
            monitoringPlan
              ? monitoringPlan.plan_name
              : "Monitoring not started"
          }
        />
      </div>


      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title="Today"
          description="Your V2 monitoring check-ins for today."
        >
          {loadingMonitoring ? (
            <p className="text-sm text-slate-500">
              Loading today's schedule...
            </p>
          ) : monitoringPlan &&
            scheduledMonitoringSchedules.length > 0 ? (
            <div>
              <div className="divide-y divide-slate-100">
              {scheduledMonitoringSchedules.map(
                (schedule) => {
                  const completedEntry =
                    schedule.schedule_id
                      ? checkinForSchedule(
                          schedule.schedule_id
                        )
                      : undefined;

                  return (
                    <div
                      key={
                        schedule.schedule_id ||
                        schedule.key
                      }
                      className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Icon>
                          {completedEntry
                            ? "✓"
                            : "○"}
                        </Icon>

                        <div>
                          <p className="font-medium">
                            {schedule.label}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {completedEntry
                              ? `Completed at ${formatEntryTime(
                                  completedEntry.completed_at
                                )}`
                              : `${schedule.start_time.slice(
                                  0,
                                  5
                                )}–${schedule.end_time.slice(
                                  0,
                                  5
                                )}`}
                          </p>
                        </div>
                      </div>

                      {completedEntry ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          Done
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            changeScreen(
                              "monitoring"
                            )
                          }
                          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Check in
                        </button>
                      )}
                    </div>
                  );
                }
              )}
              </div>

              {eventMonitoringSchedules.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    changeScreen("monitoring")
                  }
                  className="mt-5 w-full rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 text-left"
                >
                  <p className="text-sm font-semibold text-cyan-950">
                    {eventMonitoringSchedules.length} event check-in
                    {eventMonitoringSchedules.length === 1 ? "" : "s"} available
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Event-contingent check-ins are available when the defined
                    event occurs and are not counted as missed daily prompts.
                  </p>
                </button>
              )}
            </div>
          ) : monitoringPlan &&
            eventMonitoringSchedules.length > 0 ? (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
              <p className="font-medium text-cyan-950">
                Event-contingent monitoring is active
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This protocol has no scheduled daily prompts. Open Daily
                Monitoring whenever a defined event occurs.
              </p>
              <button
                type="button"
                onClick={() =>
                  changeScreen("monitoring")
                }
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open event check-ins
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium">
                No active monitoring plan
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create a Daily Monitoring plan to
                schedule check-ins and see your
                monitoring data here.
              </p>
              <button
                type="button"
                onClick={() =>
                  changeScreen("monitoring")
                }
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Set up monitoring
              </button>
            </div>
          )}
        </Panel>

        <DashboardAssessmentSummary
          changeScreen={changeScreen}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Ask PsyLattice AI">
          <div className="flex gap-4">
            <Icon dark>AI</Icon>

            <div>
              <p className="font-medium">
                Not sure what to assess?
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Describe what you have been
                experiencing. The AI Guide can help
                you explore an appropriate
                self-assessment or monitoring
                approach.
              </p>

              <button
                type="button"
                onClick={() =>
                  changeScreen("ai")
                }
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open AI Guide
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Your self-regulation plan">
          {loadingRegulation ? (
            <p className="text-sm text-slate-500">
              Loading your plan...
            </p>
          ) : regulationPlan ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {regulationPlan.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {regulationPlanDay
                      ? `Day ${Math.min(
                          regulationPlanDay,
                          regulationPlan.duration_days
                        )} of ${
                          regulationPlan.duration_days
                        }`
                      : `${regulationPlan.duration_days}-day plan`}
                  </p>
                </div>

                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                  {regulationCompletedToday} /{" "}
                  {regulationTargetToday} today
                </span>
              </div>

              <div className="mt-5">
                <ProgressBar
                  label="Today's completion"
                  value={
                    regulationCompletionPercentage
                  }
                  text={`${regulationCompletionPercentage}%`}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  changeScreen("regulation")
                }
                className="mt-5 flex items-center gap-2 text-sm font-semibold"
              >
                Open plan
                <ArrowIcon />
              </button>
            </>
          ) : (
            <>
              <p className="font-medium">
                No active self-regulation plan
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Create a personal plan with
                activities and daily targets.
              </p>

              <button
                type="button"
                onClick={() =>
                  changeScreen("regulation")
                }
                className="mt-5 flex items-center gap-2 text-sm font-semibold"
              >
                Create a plan
                <ArrowIcon />
              </button>
            </>
          )}
        </Panel>
      </div>

      <Panel title="Recent monitoring pattern">
        {loadingMonitoring ? (
          <p className="text-sm text-slate-500">
            Loading today's data...
          </p>
        ) : todayCheckins.length >= 1 &&
          lowestRating !== null &&
          highestRating !== null &&
          averageRating !== null ? (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <div className="flex items-start gap-4">
              <Icon>↗</Icon>

              <div>
                <p className="font-medium">
                  Today's monitoring summary
                </p>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Across {todayCheckins.length} completed
                  check-in
                  {todayCheckins.length === 1
                    ? ""
                    : "s"}{" "}
                  today, your{" "}
                  {rating.kind === "stress"
                    ? "stress"
                    : "slider"}{" "}
                  ratings ranged from {lowestRating}/10
                  to {highestRating}/10, with an
                  average of {averageRating}/10. These
                  values are calculated from the V2
                  responses you actually submitted.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    changeScreen("monitoring")
                  }
                  className="mt-4 text-sm font-semibold text-cyan-900"
                >
                  Review today's check-ins
                </button>
              </div>
            </div>
          </div>
        ) : todayCheckins.length > 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">
              Check-in saved
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {todayCheckins.length} check-in
              {todayCheckins.length === 1 ? "" : "s"}{" "}
              completed today. There is no numeric
              slider/rating response available for a
              score summary yet, but completion is now
              reflected on the dashboard.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">
              No monitoring data yet today
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete a check-in and the dashboard will
              update from the V2 monitoring records.
            </p>
          </div>
        )}
      </Panel>
      {clinicianPendingRemoval && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-red-100 bg-red-50/60 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600">
                End clinician connection
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                Disconnect from{" "}
                {clinicianPendingRemoval.clinician_name}?
              </h3>
            </div>

            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-slate-600">
                This will end your active PsyLattice connection with this clinician immediately.
              </p>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  What happens when you disconnect
                </p>

                <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                  <p>• The clinician loses access through this active connection.</p>
                  <p>• All sharing permissions for this connection stop.</p>
                  <p>• Your Self data remains in your own PsyLattice account.</p>
                  <p>• This does not delete your personal assessment or monitoring history.</p>
                </div>
              </div>

              <p className="text-xs leading-5 text-slate-400">
                You can connect with a clinician again later by accepting a new clinician invitation.
              </p>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={removingDashboardClinician}
                  onClick={() =>
                    setClinicianPendingRemoval(null)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Keep clinician
                </button>

                <button
                  type="button"
                  disabled={removingDashboardClinician}
                  onClick={() =>
                    void disconnectDashboardClinician()
                  }
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-50"
                >
                  {removingDashboardClinician
                    ? "Disconnecting..."
                    : "Yes, disconnect clinician"}
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
   AI GUIDE
   ========================================================= */

function AIGuide({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  type GuideMessage = {
    from: "ai" | "user";
    text: string;
  };

  const initialMessage: GuideMessage = {
  from: "ai",
  text:
    "Hi. I’m the PsyLattice AI Guide. I can help you explore what you may want to assess, reflect on patterns you’ve been noticing, or understand psychological concepts. What would you like to explore?",
};

const [message, setMessage] = useState("");

const [messages, setMessages] =
  useState<GuideMessage[]>([
    initialMessage,
  ]);

const [sending, setSending] = useState(false);
const [chatError, setChatError] = useState("");

const messagesContainerRef =
  useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const container = messagesContainerRef.current;

  if (!container) {
    return;
  }

  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });

}, [messages, sending]);
  async function sendMessage() {
    const text = message.trim();

    if (!text || sending) {
      return;
    }

    const userMessage: GuideMessage = {
      from: "user",
      text,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    // Show the user's message immediately.
    setMessages(updatedMessages);

    // Clear the text box.
    setMessage("");

    // Show loading state.
    setSending(true);
    setChatError("");

    try {
      const response = await fetch(
        "/api/ai-guide",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            messages: updatedMessages.map(
              (item) => ({
                role:
                  item.from === "user"
                    ? "user"
                    : "assistant",

                content: item.text,
              })
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "The AI Guide could not respond."
        );
      }

      const aiMessage: GuideMessage = {
        from: "ai",
        text: data.reply,
      };

      setMessages((previous) => [
        ...previous,
        aiMessage,
      ]);
    } catch (error) {
      console.error(
        "AI Guide request failed:",
        error
      );

      setChatError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

function startNewChat() {
  if (sending) {
    return;
  }

  setMessages([initialMessage]);
  setMessage("");
  setChatError("");

  setTimeout(() => {
    const container =
      messagesContainerRef.current;

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, 0);
}

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      {/* MAIN CHAT */}
      <Panel
        title="PsyLattice AI Guide"
        description="A conversational guide for assessment navigation and reflection."
      >
        <div className="flex min-h-[560px] flex-col">
          {/* Messages */}
          <div className="max-h-[520px] flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((item, index) =>
              item.from === "ai" ? (
                <div
                  key={index}
                  className="flex max-w-[88%] gap-3"
                >
                  <Icon dark>AI</Icon>

                  <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {item.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  key={index}
                  className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-slate-950 px-4 py-3 text-white"
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {item.text}
                  </p>
                </div>
              )
            )}

            {/* Thinking indicator */}
            {sending && (
              <div className="flex max-w-[88%] gap-3">
                <Icon dark>AI</Icon>

                <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />

                    <span className="ml-1 text-xs text-slate-400">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {chatError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">
                  {chatError}
                </p>
              </div>
            )}
          </div>

          {/* Safety line */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-center text-[11px] leading-5 text-slate-400">
              PsyLattice AI Guide provides
              informational and navigational
              support. It does not provide
              diagnosis, treatment, or emergency
              services.
            </p>
          </div>

          {/* Message input */}
          <div className="mt-4 flex items-end gap-2">
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Tell PsyLattice what you've been noticing..."
              rows={2}
              maxLength={4000}
              disabled={sending}
              className="min-h-[52px] min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-50"
            />

            <button
              type="button"
              onClick={() =>
                void sendMessage()
              }
              disabled={
                sending || !message.trim()
              }
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            Press Enter to send · Shift + Enter
            for a new line
          </p>
        </div>
      </Panel>

      {/* RIGHT SIDEBAR */}
      <div className="space-y-5">
        <Panel title="What the AI Guide can do">
          <div className="space-y-5">
            {[
              [
                "Explore self-assessments",
                "Help identify areas you may want to assess.",
              ],
              [
                "Suggest monitoring",
                "Discuss when repeated daily check-ins may help reveal patterns.",
              ],
              [
                "Explain concepts",
                "Explain psychological ideas in clear, accessible language.",
              ],
              [
                "Prepare for therapy",
                "Help organise information you may choose to discuss with a qualified professional.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="flex gap-3"
              >
                <span className="mt-1 text-cyan-700">
                  <CheckIcon />
                </span>

                <div>
                  <p className="text-sm font-medium">
                    {title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Assessment catalogue">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
            <p className="text-sm font-medium text-cyan-950">
              Assessment recommendations are
              being developed carefully.
            </p>

            <p className="mt-2 text-xs leading-5 text-cyan-900/70">
              The AI Guide can currently help you
              identify an area to explore. Direct
              questionnaire recommendations will
              later be connected to PsyLattice's
              approved assessment catalogue.
            </p>

            <button
              type="button"
              onClick={() =>
                changeScreen("assessments")
              }
              className="mt-4 rounded-xl border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold text-cyan-900"
            >
              Browse assessments
            </button>
          </div>
        </Panel>

        <Panel title="Important boundary">
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm leading-6 text-amber-900">
              The AI Guide supports navigation,
              education, and reflection. It does
              not diagnose psychiatric disorders,
              prescribe treatment, or replace a
              qualified professional.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   ASSESSMENTS
   ========================================================= */

function Assessments() {
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
    license_status: "public_domain" | "permitted" | "restricted" | "unknown";
    license_summary: string | null;
    license_source_url: string | null;
    commercial_use_note: string | null;
    modification_note: string | null;
    redistribution_note: string | null;
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

  type AssessmentHistory = {
    id: string;
    questionnaire_id: string;
    scores: Record<string, number> | null;
    completed_at: string | null;
  };

  type AssessmentResult = {
    questionnaireName: string;
    acronym: string | null;
    scores: Record<string, number>;
  };

  type AssignedAssessment = {
    assignment_id: string;
    connection_id: string;
    clinician_id: string;
    clinician_name: string;
    questionnaire_id: string;
    questionnaire_name: string;
    questionnaire_acronym: string | null;
    questionnaire_category: string;
    due_date: string | null;
    note: string | null;
    status: "assigned" | "in_progress";
    created_at: string;
    started_at: string | null;
  };

  type BegunAssignedAssessment = {
    session_id: string;
    questionnaire_id: string;
    version_id: string;
  };

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [history, setHistory] = useState<AssessmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [selectedVersion, setSelectedVersion] =
    useState<QuestionnaireVersion | null>(null);
  const [resources, setResources] = useState<QuestionnaireResource[]>([]);
  const [references, setReferences] = useState<QuestionnaireReference[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [items, setItems] = useState<QuestionnaireItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [runnerLoading, setRunnerLoading] = useState(false);
  const [runnerError, setRunnerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const [assignedAssessments, setAssignedAssessments] = useState<
    AssignedAssessment[]
  >([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [assignmentError, setAssignmentError] = useState("");
  const [activeAssignmentId, setActiveAssignmentId] = useState<
    string | null
  >(null);

  const [view, setView] = useState<
    "library" | "details" | "runner" | "safety" | "result"
  >("library");

  const [phq9Item9Response, setPhq9Item9Response] =
    useState<number | null>(null);

  async function loadAssignedAssessments() {
    setLoadingAssignments(true);
    setAssignmentError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_my_assigned_assessments"
    );

    if (error) {
      console.error(
        "Could not load assigned assessments:",
        error
      );

      setAssignmentError(
        "Your clinician-assigned assessments could not be loaded."
      );
      setAssignedAssessments([]);
      setLoadingAssignments(false);
      return;
    }

    setAssignedAssessments(
      (data ?? []) as AssignedAssessment[]
    );
    setLoadingAssignments(false);
  }

  async function loadAssessmentHistory() {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return;
    }

    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id, questionnaire_id, scores, completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Could not load assessment history:", error);
      return;
    }

    setHistory((data || []) as AssessmentHistory[]);
  }

  useEffect(() => {
    void loadAssignedAssessments();
  }, []);

  useEffect(() => {
    async function loadCatalogue() {
      setLoading(true);
      setCatalogueError("");

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setCatalogueError("The assessment catalogue could not be loaded.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("questionnaires")
        .select(
          "id, slug, name, acronym, category, description, constructs, population, item_count, estimated_minutes, languages, administration_mode, recall_period, self_available, researcher_available, license_status, license_summary, license_source_url, commercial_use_note, modification_note, redistribution_note"
        )
        .eq("self_available", true)
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) {
        console.error("Could not load questionnaire catalogue:", error);
        setCatalogueError(
          "The questionnaire library could not be loaded. Make sure the questionnaire database setup has been run in Supabase."
        );
        setLoading(false);
        return;
      }

      setQuestionnaires((data || []) as Questionnaire[]);
      await loadAssessmentHistory();
      setLoading(false);
    }

    void loadCatalogue();
  }, []);

  async function loadQuestionnaireDetails(questionnaire: Questionnaire) {
    setDetailLoading(true);
    setCatalogueError("");
    setSelectedQuestionnaire(questionnaire);
    setResult(null);

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
      console.error("Could not load questionnaire version:", versionResult.error);
      setCatalogueError("This questionnaire's instructions could not be loaded.");
      setDetailLoading(false);
      return;
    }

    if (resourceResult.error) {
      console.error(
        "Could not load questionnaire resources:",
        resourceResult.error
      );
    }

    if (referenceResult.error) {
      console.error(
        "Could not load questionnaire references:",
        referenceResult.error
      );
    }

    setSelectedVersion(
      versionResult.data
        ? (versionResult.data as QuestionnaireVersion)
        : null
    );
    setResources((resourceResult.data || []) as QuestionnaireResource[]);
    setReferences((referenceResult.data || []) as QuestionnaireReference[]);
    setView("details");
    setDetailLoading(false);
  }

  async function startAssessment(
    questionnaire: Questionnaire,
    assignmentId: string | null = null
  ) {
    setRunnerLoading(true);
    setRunnerError("");
    setResult(null);
    setPhq9Item9Response(null);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setRunnerError("You must be signed in to start an assessment.");
      setRunnerLoading(false);
      return;
    }

    let version: QuestionnaireVersion | null = null;
    let createdSessionId = "";

    if (assignmentId) {
      const { data: beginData, error: beginError } =
        await supabase.rpc(
          "psylattice_begin_assigned_assessment",
          {
            p_assignment_id: assignmentId,
          }
        );

      if (beginError) {
        console.error(
          "Could not begin assigned assessment:",
          beginError
        );

        setRunnerError(
          "This assigned assessment could not be started."
        );
        setRunnerLoading(false);
        return;
      }

      const begun =
        Array.isArray(beginData) && beginData.length > 0
          ? (beginData[0] as BegunAssignedAssessment)
          : null;

      if (
        !begun ||
        begun.questionnaire_id !== questionnaire.id
      ) {
        setRunnerError(
          "The assigned assessment could not be verified."
        );
        setRunnerLoading(false);
        return;
      }

      createdSessionId = begun.session_id;

      const { data: versionData, error: versionError } =
        await supabase
          .from("questionnaire_versions")
          .select(
            "id, questionnaire_id, version_label, participant_instructions, researcher_instructions, response_scale_description, scoring_summary, score_multiplier"
          )
          .eq("id", begun.version_id)
          .maybeSingle();

      if (versionError || !versionData) {
        console.error(
          "Could not load assigned questionnaire version:",
          versionError
        );

        setRunnerError(
          "This questionnaire version could not be loaded."
        );
        setRunnerLoading(false);
        return;
      }

      version = versionData as QuestionnaireVersion;
      setSelectedVersion(version);
    } else {
      version = selectedVersion;

      if (
        !version ||
        version.questionnaire_id !== questionnaire.id
      ) {
        const { data: versionData, error: versionError } =
          await supabase
            .from("questionnaire_versions")
            .select(
              "id, questionnaire_id, version_label, participant_instructions, researcher_instructions, response_scale_description, scoring_summary, score_multiplier"
            )
            .eq("questionnaire_id", questionnaire.id)
            .eq("is_current", true)
            .limit(1)
            .maybeSingle();

        if (versionError || !versionData) {
          setRunnerError(
            "This questionnaire version could not be loaded."
          );
          setRunnerLoading(false);
          return;
        }

        version = versionData as QuestionnaireVersion;
        setSelectedVersion(version);
      }
    }

    if (!version) {
      setRunnerError(
        "This questionnaire version could not be loaded."
      );
      setRunnerLoading(false);
      return;
    }

    const { data: itemData, error: itemError } =
      await supabase
        .from("questionnaire_items")
        .select(
          "id, position, prompt, subscale, reverse_scored, response_type, response_options, required"
        )
        .eq("version_id", version.id)
        .order("position", { ascending: true });

    if (
      itemError ||
      !itemData ||
      itemData.length === 0
    ) {
      console.error(
        "Could not load questionnaire items:",
        itemError
      );

      setRunnerError(
        "The questionnaire items could not be loaded."
      );
      setRunnerLoading(false);
      return;
    }

    if (!assignmentId) {
      const { data: sessionData, error: sessionError } =
        await supabase
          .from("assessment_sessions")
          .insert({
            user_id: user.id,
            questionnaire_id: questionnaire.id,
            version_id: version.id,
            status: "in_progress",
          })
          .select("id")
          .single();

      if (sessionError || !sessionData) {
        console.error(
          "Could not create assessment session:",
          sessionError
        );

        setRunnerError(
          "The assessment could not be started."
        );
        setRunnerLoading(false);
        return;
      }

      createdSessionId = sessionData.id;
    }

    setSelectedQuestionnaire(questionnaire);
    setItems(
      (itemData || []) as QuestionnaireItem[]
    );
    setAnswers({});
    setCurrentItemIndex(0);
    setSessionId(createdSessionId);
    setActiveAssignmentId(assignmentId);
    setView("runner");
    setRunnerLoading(false);

    if (assignmentId) {
      void loadAssignedAssessments();
    }
  }

  function calculateScores() {
    if (!selectedVersion) {
      return {} as Record<string, number>;
    }

    const scores: Record<string, number> = {};

    for (const item of items) {
      const response = answers[item.id];

      if (typeof response !== "number" || !item.subscale) {
        continue;
      }

      const optionValues = item.response_options.map((option) => option.value);
      const minimum = optionValues.length > 0 ? Math.min(...optionValues) : 0;
      const maximum = optionValues.length > 0 ? Math.max(...optionValues) : 0;

      const scoredValue = item.reverse_scored
        ? minimum + maximum - response
        : response;

      scores[item.subscale] = (scores[item.subscale] || 0) + scoredValue;
    }

    for (const key of Object.keys(scores)) {
      scores[key] = Number(
        (scores[key] * Number(selectedVersion.score_multiplier || 1)).toFixed(2)
      );
    }

    return scores;
  }

  async function completeAssessment() {
    if (
      submitting ||
      !sessionId ||
      !selectedQuestionnaire ||
      !selectedVersion
    ) {
      return;
    }

    const missingRequired = items.some(
      (item) => item.required && typeof answers[item.id] !== "number"
    );

    if (missingRequired) {
      setRunnerError("Please answer every item before submitting.");
      return;
    }

    setSubmitting(true);
    setRunnerError("");

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setRunnerError("You must be signed in to submit an assessment.");
      setSubmitting(false);
      return;
    }

    const scoreObject = calculateScores();

    const answerRows = items
      .filter((item) => typeof answers[item.id] === "number")
      .map((item) => ({
        session_id: sessionId,
        user_id: user.id,
        item_id: item.id,
        response_value: answers[item.id],
      }));

    const { error: answerError } = await supabase
      .from("assessment_answers")
      .upsert(answerRows, {
        onConflict: "session_id,item_id",
      });

    if (answerError) {
      console.error("Could not save assessment answers:", answerError);
      setRunnerError("Your answers could not be saved.");
      setSubmitting(false);
      return;
    }

    const { error: sessionError } = await supabase
      .from("assessment_sessions")
      .update({
        status: "completed",
        scores: scoreObject,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (sessionError) {
      console.error("Could not complete assessment session:", sessionError);
      setRunnerError("The assessment could not be completed.");
      setSubmitting(false);
      return;
    }

    const completedResult: AssessmentResult = {
      questionnaireName: selectedQuestionnaire.name,
      acronym: selectedQuestionnaire.acronym,
      scores: scoreObject,
    };

    setResult(completedResult);

    const phq9Item9 =
      selectedQuestionnaire.slug === "patient-health-questionnaire-9"
        ? items.find((item) => item.position === 9)
        : undefined;

    const item9Response =
      phq9Item9 && typeof answers[phq9Item9.id] === "number"
        ? answers[phq9Item9.id]
        : null;

    setPhq9Item9Response(item9Response);

    if (
      selectedQuestionnaire.slug === "patient-health-questionnaire-9" &&
      item9Response !== null &&
      item9Response > 0
    ) {
      setView("safety");
    } else {
      setView("result");
    }

    await loadAssessmentHistory();

    if (activeAssignmentId) {
      await loadAssignedAssessments();
      setActiveAssignmentId(null);
    }

    setSubmitting(false);
  }

  function phq9SymptomRange(score: number) {
    if (score <= 4) return "minimal";
    if (score <= 9) return "mild";
    if (score <= 14) return "moderate";
    if (score <= 19) return "moderately severe";
    return "severe";
  }

  function historyQuestionnaire(questionnaireId: string) {
    return questionnaires.find((item) => item.id === questionnaireId) || null;
  }

  function resourceLabel(resource: QuestionnaireResource) {
    switch (resource.resource_type) {
      case "manual":
        return "Manual";
      case "questionnaire":
        return "Questionnaire";
      case "scoring_guide":
        return "Scoring guide";
      case "scoring_key":
        return "Scoring key";
      case "citation_guide":
        return "Citation guide";
      case "license":
        return "Licence / permission";
      case "translations":
        return "Translations";
      default:
        return "Official resource";
    }
  }

  const categories = [
    "All",
    ...Array.from(new Set(questionnaires.map((item) => item.category))),
  ];

  const filteredQuestionnaires = questionnaires.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      (item.acronym || "").toLowerCase().includes(query) ||
      item.constructs.some((construct) => construct.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  if (view === "runner" && selectedQuestionnaire && selectedVersion) {
    const currentItem = items[currentItemIndex];
    const answeredCount = Object.keys(answers).length;
    const progress =
      items.length > 0
        ? Math.round(((currentItemIndex + 1) / items.length) * 100)
        : 0;

    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setView("library");
              setRunnerError("");
            }}
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            ← Exit assessment
          </button>

          <span className="text-xs font-medium text-slate-400">
            {answeredCount} of {items.length} answered
          </span>
        </div>

        <Panel
          title={selectedQuestionnaire.acronym || selectedQuestionnaire.name}
          description={selectedVersion.participant_instructions}
        >
          {runnerLoading || !currentItem ? (
            <p className="text-sm text-slate-500">Loading assessment...</p>
          ) : (
            <div>
              <div className="mb-7">
                <div className="flex items-center justify-between gap-4 text-xs text-slate-400">
                  <span>
                    Question {currentItemIndex + 1} of {items.length}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-cyan-700 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <h2 className="text-xl font-semibold leading-8 text-slate-950">
                {currentItem.prompt}
              </h2>

              <div className="mt-6 space-y-3">
                {currentItem.response_options.map((option) => {
                  const selected = answers[currentItem.id] === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setAnswers((previous) => ({
                          ...previous,
                          [currentItem.id]: option.value,
                        }));
                        setRunnerError("");
                      }}
                      className={`w-full rounded-2xl border px-4 py-4 text-left text-sm transition ${
                        selected
                          ? "border-cyan-700 bg-cyan-50 text-cyan-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-4">
                        <span>{option.label}</span>
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                            selected
                              ? "border-cyan-700 bg-cyan-700 text-white"
                              : "border-slate-300 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {runnerError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{runnerError}</p>
                </div>
              )}

              <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentItemIndex((previous) => Math.max(0, previous - 1))
                  }
                  disabled={currentItemIndex === 0 || submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {currentItemIndex < items.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof answers[currentItem.id] !== "number") {
                        setRunnerError("Choose a response before continuing.");
                        return;
                      }

                      setCurrentItemIndex((previous) => previous + 1);
                      setRunnerError("");
                    }}
                    disabled={submitting}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void completeAssessment()}
                    disabled={submitting}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit assessment"}
                  </button>
                )}
              </div>
            </div>
          )}
        </Panel>

        <p className="text-center text-xs leading-5 text-slate-400">
          Your responses are stored in your PsyLattice account. This
          self-assessment does not provide a diagnosis.
        </p>
      </div>
    );
  }

  if (
    view === "safety" &&
    result &&
    selectedQuestionnaire?.slug === "patient-health-questionnaire-9"
  ) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Panel
          title="Before you view your result"
          description="Your response to PHQ-9 item 9 deserves additional attention."
        >
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-4">
              <Icon>!</Icon>

              <div>
                <p className="font-semibold text-amber-950">
                  One of your responses indicated thoughts about being better
                  off dead or hurting yourself in some way during the past two
                  weeks.
                </p>

                <p className="mt-3 text-sm leading-6 text-amber-900">
                  A response to this single PHQ-9 item cannot determine your
                  level of suicide risk or whether you are in immediate danger.
                  It does mean that further assessment and support are
                  appropriate.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="font-semibold text-red-950">
                If you may act on these thoughts or are in immediate danger
              </p>

              <p className="mt-2 text-sm leading-6 text-red-800">
                Contact your local emergency service or go to the nearest
                emergency department now. If possible, stay with or contact
                someone you trust rather than being alone.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-950">
                If you are not in immediate danger
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Consider contacting a qualified mental health professional or
                doctor soon and telling someone you trust what you have been
                experiencing. A clinician can ask the follow-up questions that
                this questionnaire cannot.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm leading-6 text-slate-600">
              PsyLattice is a self-assessment and reflection platform. It does
              not provide emergency or crisis services. This safety screen is
              shown whenever PHQ-9 item 9 is answered with anything other than
              “Not at all.”
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setView("result")}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Continue to my questionnaire result
            </button>

            <button
              type="button"
              onClick={() => {
                setView("library");
                setResult(null);
                setPhq9Item9Response(null);
              }}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
            >
              Return to assessments
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  if (view === "result" && result) {
    const scoreEntries = Object.entries(result.scores);

    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Panel
          title="Assessment complete"
          description={result.acronym || result.questionnaireName}
        >
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <p className="text-sm font-medium text-cyan-950">
              Your questionnaire scores
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scoreEntries.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-cyan-100 bg-white p-4"
                >
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {selectedQuestionnaire?.slug ===
          "patient-health-questionnaire-9" ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-medium">How to read this PHQ-9 result</p>

                {typeof result.scores["PHQ-9 Total"] === "number" ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your PHQ-9 total is{" "}
                    <span className="font-semibold text-slate-900">
                      {result.scores["PHQ-9 Total"]} / 27
                    </span>
                    . This falls within the commonly used{" "}
                    <span className="font-semibold text-slate-900">
                      {phq9SymptomRange(result.scores["PHQ-9 Total"])}
                    </span>{" "}
                    symptom range. The PHQ-9 is a screening and symptom-severity
                    measure; this result by itself does not establish a
                    diagnosis.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The PHQ-9 is a screening and symptom-severity measure. Its
                    score by itself does not establish a diagnosis.
                  </p>
                )}
              </div>

              {phq9Item9Response !== null && phq9Item9Response > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-medium text-amber-950">
                    Follow-up is still important
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    Because you endorsed PHQ-9 item 9, consider discussing that
                    response with a qualified mental health professional or
                    doctor. Item 9 should not be used on its own to determine
                    suicide risk.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <p className="font-medium">How to read this result</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                PsyLattice is showing the raw scale scores produced by this
                questionnaire's official scoring method. Higher or lower values
                should not be treated as diagnoses or clinical labels without
                the appropriate normative and professional context.
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setView("library");
                setResult(null);
                setPhq9Item9Response(null);
              }}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Return to assessments
            </button>

            {selectedQuestionnaire && (
              <button
                type="button"
                onClick={() => void loadQuestionnaireDetails(selectedQuestionnaire)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
              >
                View measure details
              </button>
            )}
          </div>
        </Panel>
      </div>
    );
  }

  if (view === "details" && selectedQuestionnaire) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setView("library");
            setCatalogueError("");
          }}
          className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          ← Back to assessment library
        </button>

        <Panel
          title={selectedQuestionnaire.name}
          description={selectedQuestionnaire.description}
        >
          {detailLoading ? (
            <p className="text-sm text-slate-500">Loading measure details...</p>
          ) : (
            <div className="space-y-7">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                  {selectedQuestionnaire.category}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {selectedQuestionnaire.license_status === "public_domain"
                    ? "Public domain"
                    : "Usage reviewed"}
                </span>
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  {selectedQuestionnaire.item_count} items
                </span>
                {selectedQuestionnaire.estimated_minutes && (
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                    ~{selectedQuestionnaire.estimated_minutes} min
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">Mode</p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedQuestionnaire.administration_mode || "Self-report"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">Recall period</p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedQuestionnaire.recall_period || "Not specified"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">Language</p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedQuestionnaire.languages.join(", ")}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400">Version</p>
                  <p className="mt-2 text-sm font-medium">
                    {selectedVersion?.version_label || "Current version"}
                  </p>
                </div>
              </div>

              {selectedVersion && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="font-medium">Before you begin</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedVersion.participant_instructions}
                    </p>
                    {selectedVersion.response_scale_description && (
                      <p className="mt-3 text-xs leading-5 text-slate-500">
                        {selectedVersion.response_scale_description}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="font-medium">Scoring</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedVersion.scoring_summary ||
                        "Scoring guidance is provided by the official source."}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="font-medium">Constructs</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedQuestionnaire.constructs.map((construct) => (
                    <span
                      key={construct}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                    >
                      {construct}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="font-medium">Use & licensing</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {selectedQuestionnaire.license_summary ||
                    "Usage information is being reviewed."}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Commercial use</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {selectedQuestionnaire.commercial_use_note || "Check source"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Modification</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {selectedQuestionnaire.modification_note || "Check source"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-400">Redistribution</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {selectedQuestionnaire.redistribution_note || "Check source"}
                    </p>
                  </div>
                </div>

                {selectedQuestionnaire.license_source_url && (
                  <a
                    href={selectedQuestionnaire.license_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-900"
                  >
                    Open official licence source
                    <ArrowIcon />
                  </a>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-medium">Official resources</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Manuals, questionnaire files, scoring instructions and
                      official source pages are linked where available.
                    </p>
                  </div>
                </div>

                {resources.length > 0 ? (
                  <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
                    {resources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex flex-wrap items-center justify-between gap-4 py-4"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                              {resourceLabel(resource)}
                            </span>
                            {resource.is_official && (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                Official
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm font-medium">
                            {resource.title}
                          </p>
                          {resource.access_note && (
                            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                              {resource.access_note}
                            </p>
                          )}
                        </div>

                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {resource.download_allowed ? "Open / download" : "Open resource"}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No official resources are linked yet.
                  </p>
                )}
              </div>

              {references.length > 0 && (
                <div>
                  <p className="font-medium">References & citation</p>
                  <div className="mt-3 space-y-3">
                    {references.map((reference) => (
                      <div
                        key={reference.id}
                        className="rounded-xl border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm leading-6 text-slate-600">
                          {reference.citation}
                        </p>
                        {reference.url && (
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-cyan-900"
                          >
                            View source
                            <ArrowIcon />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => void startAssessment(selectedQuestionnaire)}
                  disabled={runnerLoading}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {runnerLoading ? "Loading..." : "Start assessment"}
                </button>

                <button
                  type="button"
                  onClick={() => setView("library")}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
                >
                  Back to library
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
            Approved self-assessments
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Questionnaire library
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            PsyLattice only shows measures here that are approved for the Self
            workspace. Questionnaire rights, instructions and official sources
            are stored alongside each measure.
          </p>
        </div>
      </div>

      {catalogueError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{catalogueError}</p>
        </div>
      )}

      <Panel
        title="Assigned by your clinician"
        description="Assessments requested through an active PsyLattice clinician connection."
      >
        {assignmentError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {assignmentError}
          </div>
        )}

        {loadingAssignments ? (
          <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Loading assigned assessments...
            </p>
          </div>
        ) : assignedAssessments.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">
              No active clinician assignments
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              If a connected clinician requests an assessment,
              it will appear here. You can still use the
              questionnaire library independently below.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assignedAssessments.map((assignment) => {
              const questionnaire =
                questionnaires.find(
                  (item) =>
                    item.id ===
                    assignment.questionnaire_id
                ) || null;

              const dueText = assignment.due_date
                ? new Date(
                    `${assignment.due_date}T00:00:00`
                  ).toLocaleDateString([], {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "No due date";

              return (
                <div
                  key={assignment.assignment_id}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">
                          {assignment.questionnaire_acronym ||
                            assignment.questionnaire_name}
                        </p>

                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                          {assignment.status ===
                          "in_progress"
                            ? "In progress"
                            : "Assigned"}
                        </span>
                      </div>

                      {assignment.questionnaire_acronym && (
                        <p className="mt-1 text-xs text-slate-400">
                          {assignment.questionnaire_name}
                        </p>
                      )}

                      <p className="mt-3 text-sm text-slate-600">
                        Assigned by{" "}
                        <span className="font-medium">
                          {assignment.clinician_name}
                        </span>
                        {" · "}
                        {dueText}
                      </p>

                      {assignment.note && (
                        <div className="mt-3 rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-medium text-slate-400">
                            Message from clinician
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {assignment.note}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        runnerLoading ||
                        !questionnaire
                      }
                      onClick={() => {
                        if (questionnaire) {
                          void startAssessment(
                            questionnaire,
                            assignment.assignment_id
                          );
                        }
                      }}
                      className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {runnerLoading
                        ? "Loading..."
                        : assignment.status ===
                            "in_progress"
                          ? "Continue assessment"
                          : "Start assessment"}
                    </button>
                  </div>

                  {!questionnaire && !loading && (
                    <p className="mt-3 text-xs text-amber-700">
                      This questionnaire is not currently
                      available in your Self catalogue.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
          <p className="text-sm font-medium text-cyan-950">
            Completing an assignment does not change your
            sharing choices.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            Your clinician can see the assignment status, but
            assessment scores are only available to them when
            you have enabled Self-assessment results in
            Privacy & Sharing.
          </p>
        </div>
      </Panel>

      <Panel title="Browse assessments">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">
              Search questionnaires or constructs
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search personality, stress, wellbeing..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                  category === item
                    ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {loading ? (
        <Panel title="Questionnaire library">
          <p className="text-sm text-slate-500">Loading questionnaires...</p>
        </Panel>
      ) : filteredQuestionnaires.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredQuestionnaires.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                    {item.category}
                  </span>
                  {item.license_status === "public_domain" && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Public domain
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400">
                  {item.item_count} items
                  {item.estimated_minutes ? ` · ~${item.estimated_minutes} min` : ""}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-950">
                {item.acronym || item.name}
              </h3>
              {item.acronym && (
                <p className="mt-1 text-xs text-slate-400">{item.name}</p>
              )}

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {item.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.constructs.slice(0, 5).map((construct) => (
                  <span
                    key={construct}
                    className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-500"
                  >
                    {construct}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void startAssessment(item)}
                  disabled={runnerLoading}
                  className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start assessment
                </button>

                <button
                  type="button"
                  onClick={() => void loadQuestionnaireDetails(item)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Instructions & resources
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Panel title="Questionnaire library">
          <p className="text-sm text-slate-500">
            No questionnaires match this search yet.
          </p>
        </Panel>
      )}

      <Panel title="Completed assessments">
        {history.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {history.map((session) => {
              const questionnaire = historyQuestionnaire(session.questionnaire_id);
              const scoreEntries = session.scores
                ? Object.entries(session.scores).filter(
                    ([, value]) => typeof value === "number"
                  )
                : [];

              return (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {questionnaire?.acronym ||
                        questionnaire?.name ||
                        "Questionnaire"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {session.completed_at
                        ? new Date(session.completed_at).toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Completed"}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {scoreEntries.slice(0, 3).map(([label, value]) => (
                      <span
                        key={label}
                        className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800"
                      >
                        {label}: {value}
                      </span>
                    ))}
                    {scoreEntries.length > 3 && (
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">
                        +{scoreEntries.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">No completed assessments yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your completed questionnaires and saved scale scores will appear here.
            </p>
          </div>
        )}
      </Panel>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-medium text-amber-950">
          Questionnaire availability is intentionally curated.
        </p>
        <p className="mt-2 text-xs leading-5 text-amber-900/80">
          A measure being available elsewhere on the internet does not
          automatically mean PsyLattice can reproduce it in a public-facing
          self-assessment. Research-only measures can still be retained in the
          underlying library for the Researcher workspace when their official
          usage conditions permit that context.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   MONITORING
   ========================================================= */


type MonitoringBlockType =
  | "slider"
  | "single_choice"
  | "multiple_choice"
  | "yes_no"
  | "number"
  | "short_text"
  | "long_text"
  | "instruction"
  | "activity"
  | "questionnaire"
  | "time_duration"
  | "mood";

type MonitoringCondition = {
  sourceKey: string;
  operator: string;
  value: string;
};

type MonitoringVisibility = {
  mode: "always" | "conditional";
  logic: "AND" | "OR";
  conditions: MonitoringCondition[];
};

type MonitoringConditionalTrigger = {
  operator:
    | "gt"
    | "lt"
    | "equals"
    | "between"
    | "contains_any"
    | "contains_all";
  value?: string;
  value2?: string;
  values?: string[];
};

type MonitoringConditionalChild = {
  trigger: MonitoringConditionalTrigger;
  item: MonitoringProtocolItemDraft;
};

type MonitoringProtocolItemDraft = {
  item_id?: string;
  key: string;
  type: MonitoringBlockType;
  prompt: string;
  required: boolean;
  config: Record<string, any>;
  visibility: MonitoringVisibility;
  conditionalChildren?: MonitoringConditionalChild[];
};

type MonitoringProtocolScheduleDraft = {
  schedule_id?: string;
  key: string;
  label: string;
  start_time: string;
  end_time: string;
  items: MonitoringProtocolItemDraft[];
};

type MonitoringQuestionnaireOption = {
  questionnaire_id: string;
  questionnaire_name: string;
  questionnaire_acronym: string | null;
  questionnaire_slug: string;
  questionnaire_category: string;
  item_count: number;
  estimated_minutes: number | null;
};

function monitoringDraftKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function monitoringCanHaveConditionalChildren(
  type: MonitoringBlockType
) {
  return (
    type === "slider" ||
    type === "single_choice" ||
    type === "multiple_choice" ||
    type === "yes_no" ||
    type === "number"
  );
}

function newMonitoringItem(
  type: MonitoringBlockType,
  index: number
): MonitoringProtocolItemDraft {
  const defaults: Record<
    MonitoringBlockType,
    {
      prompt: string;
      config: Record<string, any>;
    }
  > = {
    slider: {
      prompt: "How would you rate this right now?",
      config: {
        min: 0,
        max: 10,
        step: 1,
        minLabel: "Not at all",
        maxLabel: "Extremely",
      },
    },
    single_choice: {
      prompt: "Choose the option that fits best.",
      config: {
        options: ["Option 1", "Option 2", "Option 3"],
      },
    },
    multiple_choice: {
      prompt: "Select all that apply.",
      config: {
        options: ["Option 1", "Option 2", "Option 3"],
      },
    },
    yes_no: {
      prompt: "Is this true right now?",
      config: {},
    },
    number: {
      prompt: "Enter a number.",
      config: {
        min: 0,
        max: 100,
        step: 1,
      },
    },
    short_text: {
      prompt: "Write a short response.",
      config: {},
    },
    long_text: {
      prompt: "Tell us more.",
      config: {},
    },
    instruction: {
      prompt: "Read this before continuing.",
      config: {},
    },
    activity: {
      prompt: "Complete this activity.",
      config: {
        instructions:
          "Follow the activity instructions, then mark it complete.",
        durationMinutes: 2,
      },
    },
    questionnaire: {
      prompt: "Complete this questionnaire.",
      config: {
        questionnaire_id: "",
        questionnaire_name: "",
        questionnaire_acronym: "",
      },
    },
    time_duration: {
      prompt: "How long?",
      config: {
        unit: "minutes",
        min: 0,
        max: 1440,
      },
    },
    mood: {
      prompt: "Which mood best describes how you feel?",
      config: {
        options: [
          "Calm",
          "Happy",
          "Sad",
          "Anxious",
          "Irritated",
          "Tired",
        ],
      },
    },
  };

  return {
    key: monitoringDraftKey(`item-${index + 1}`),
    type,
    prompt: defaults[type].prompt,
    required: type !== "instruction",
    config: defaults[type].config,
    visibility: {
      mode: "always",
      logic: "AND",
      conditions: [],
    },
    conditionalChildren: [],
  };
}

function defaultMonitoringTrigger(
  parent: MonitoringProtocolItemDraft
): MonitoringConditionalTrigger {
  if (
    parent.type === "slider" ||
    parent.type === "number"
  ) {
    const min = Number(parent.config.min ?? 0);
    const max = Number(parent.config.max ?? 10);
    const midpoint =
      Number.isFinite(min) && Number.isFinite(max)
        ? Math.round(((min + max) / 2) * 100) / 100
        : 5;

    return {
      operator: "gt",
      value: String(midpoint),
    };
  }

  if (parent.type === "single_choice") {
    return {
      operator: "equals",
      value:
        (parent.config.options || [])[0] || "",
    };
  }

  if (parent.type === "multiple_choice") {
    const first =
      (parent.config.options || [])[0] || "";

    return {
      operator: "contains_any",
      values: first ? [first] : [],
    };
  }

  return {
    operator: "equals",
    value: "Yes",
  };
}

function normaliseMonitoringTriggerForParent(
  parent: MonitoringProtocolItemDraft,
  trigger: MonitoringConditionalTrigger
): MonitoringConditionalTrigger {
  if (
    parent.type === "slider" ||
    parent.type === "number"
  ) {
    const operator = [
      "gt",
      "lt",
      "equals",
      "between",
    ].includes(trigger.operator)
      ? trigger.operator
      : "gt";

    return {
      operator: operator as
        | "gt"
        | "lt"
        | "equals"
        | "between",
      value:
        trigger.value ??
        String(parent.config.min ?? 0),
      value2:
        operator === "between"
          ? trigger.value2 ??
            String(parent.config.max ?? 10)
          : undefined,
    };
  }

  if (parent.type === "single_choice") {
    const options = (
      parent.config.options || []
    ) as string[];

    return {
      operator: "equals",
      value: options.includes(
        trigger.value || ""
      )
        ? trigger.value
        : options[0] || "",
    };
  }

  if (parent.type === "multiple_choice") {
    const options = (
      parent.config.options || []
    ) as string[];

    const selected = (
      trigger.values || []
    ).filter((value) =>
      options.includes(value)
    );

    return {
      operator:
        trigger.operator === "contains_all"
          ? "contains_all"
          : "contains_any",
      values:
        selected.length > 0
          ? selected
          : options[0]
            ? [options[0]]
            : [],
    };
  }

  return {
    operator: "equals",
    value:
      trigger.value === "No"
        ? "No"
        : "Yes",
  };
}

function legacyDefaultAmbulatoryProtocol(): MonitoringProtocolScheduleDraft[] {
  const afternoonYesNo =
    newMonitoringItem("yes_no", 1);

  afternoonYesNo.prompt =
    "Has anything stressful happened since your last check-in?";

  afternoonYesNo.conditionalChildren = [
    {
      trigger: {
        operator: "equals",
        value: "Yes",
      },
      item: {
        ...newMonitoringItem("short_text", 2),
        prompt: "What happened?",
        required: false,
      },
    },
  ];

  return [
    {
      key: monitoringDraftKey("morning"),
      label: "Morning",
      start_time: "08:00",
      end_time: "10:00",
      items: [
        {
          ...newMonitoringItem("slider", 0),
          prompt:
            "How stressed do you feel right now?",
          config: {
            min: 0,
            max: 10,
            step: 1,
            minLabel: "Not at all",
            maxLabel: "Extremely",
          },
        },
        {
          ...newMonitoringItem(
            "single_choice",
            1
          ),
          prompt:
            "What are you doing right now?",
          config: {
            options: [
              "Studying",
              "Working",
              "Resting",
              "Eating",
              "Exercising",
              "Socialising",
              "Travelling",
              "Other",
            ],
          },
        },
      ],
    },
    {
      key: monitoringDraftKey("afternoon"),
      label: "Afternoon",
      start_time: "15:00",
      end_time: "17:00",
      items: [
        {
          ...newMonitoringItem("slider", 0),
          prompt:
            "How stressed do you feel right now?",
          config: {
            min: 0,
            max: 10,
            step: 1,
            minLabel: "Not at all",
            maxLabel: "Extremely",
          },
        },
        afternoonYesNo,
      ],
    },
    {
      key: monitoringDraftKey("evening"),
      label: "Evening",
      start_time: "20:00",
      end_time: "22:00",
      items: [
        {
          ...newMonitoringItem("mood", 0),
          prompt:
            "Which mood best describes your evening?",
        },
        {
          ...newMonitoringItem("long_text", 1),
          prompt:
            "What stood out most about today?",
          required: false,
        },
      ],
    },
  ];
}

function monitoringTriggerToVisibility(
  parent: MonitoringProtocolItemDraft,
  trigger: MonitoringConditionalTrigger
): MonitoringVisibility {
  const safe =
    normaliseMonitoringTriggerForParent(
      parent,
      trigger
    );

  if (
    parent.type === "slider" ||
    parent.type === "number"
  ) {
    if (safe.operator === "between") {
      return {
        mode: "conditional",
        logic: "AND",
        conditions: [
          {
            sourceKey: parent.key,
            operator: "gte",
            value: String(safe.value ?? ""),
          },
          {
            sourceKey: parent.key,
            operator: "lte",
            value: String(
              safe.value2 ?? safe.value ?? ""
            ),
          },
        ],
      };
    }

    return {
      mode: "conditional",
      logic: "AND",
      conditions: [
        {
          sourceKey: parent.key,
          operator: safe.operator,
          value: String(safe.value ?? ""),
        },
      ],
    };
  }

  if (parent.type === "multiple_choice") {
    const values = safe.values || [];

    return {
      mode: "conditional",
      logic:
        safe.operator === "contains_all"
          ? "AND"
          : "OR",
      conditions: values.map((value) => ({
        sourceKey: parent.key,
        operator: "contains",
        value,
      })),
    };
  }

  return {
    mode: "conditional",
    logic: "AND",
    conditions: [
      {
        sourceKey: parent.key,
        operator: "equals",
        value: String(safe.value ?? ""),
      },
    ],
  };
}

function monitoringVisibilityToTrigger(
  parent: MonitoringProtocolItemDraft,
  visibility: MonitoringVisibility
): MonitoringConditionalTrigger {
  if (
    parent.type === "slider" ||
    parent.type === "number"
  ) {
    const lower = visibility.conditions.find(
      (condition) =>
        condition.operator === "gte"
    );
    const upper = visibility.conditions.find(
      (condition) =>
        condition.operator === "lte"
    );

    if (lower && upper) {
      return {
        operator: "between",
        value: lower.value,
        value2: upper.value,
      };
    }

    const first = visibility.conditions[0];

    return normaliseMonitoringTriggerForParent(
      parent,
      {
        operator: (
          first?.operator === "gt" ||
          first?.operator === "lt" ||
          first?.operator === "equals"
            ? first.operator
            : "equals"
        ) as "gt" | "lt" | "equals",
        value: first?.value || "",
      }
    );
  }

  if (parent.type === "multiple_choice") {
    return normaliseMonitoringTriggerForParent(
      parent,
      {
        operator:
          visibility.logic === "AND"
            ? "contains_all"
            : "contains_any",
        values: visibility.conditions
          .filter(
            (condition) =>
              condition.operator === "contains"
          )
          .map((condition) => condition.value),
      }
    );
  }

  return normaliseMonitoringTriggerForParent(
    parent,
    {
      operator: "equals",
      value:
        visibility.conditions[0]?.value ||
        (parent.type === "yes_no"
          ? "Yes"
          : ""),
    }
  );
}

function flattenMonitoringItems(
  items: MonitoringProtocolItemDraft[]
) {
  const flat: MonitoringProtocolItemDraft[] =
    [];

  function visit(
    item: MonitoringProtocolItemDraft,
    visibility: MonitoringVisibility
  ) {
    const {
      conditionalChildren: _children,
      ...itemWithoutChildren
    } = item;

    flat.push({
      ...itemWithoutChildren,
      visibility,
    });

    for (const child of
      item.conditionalChildren || []) {
      visit(
        child.item,
        monitoringTriggerToVisibility(
          item,
          child.trigger
        )
      );
    }
  }

  for (const item of items) {
    visit(item, {
      mode: "always",
      logic: "AND",
      conditions: [],
    });
  }

  return flat;
}

function serializeMonitoringProtocol(
  protocol: MonitoringProtocolScheduleDraft[]
): MonitoringProtocolScheduleDraft[] {
  return protocol.map((schedule) => ({
    ...schedule,
    items: flattenMonitoringItems(schedule.items),
  }));
}

function nestMonitoringItems(
  flatItems: MonitoringProtocolItemDraft[]
) {
  const roots: MonitoringProtocolItemDraft[] =
    [];
  const byKey = new Map<
    string,
    MonitoringProtocolItemDraft
  >();

  for (const raw of flatItems || []) {
    const item: MonitoringProtocolItemDraft = {
      ...raw,
      visibility:
        raw.visibility || {
          mode: "always",
          logic: "AND",
          conditions: [],
        },
      conditionalChildren: [],
    };

    byKey.set(item.key, item);

    const conditions =
      item.visibility?.conditions || [];
    const sourceKeys = Array.from(
      new Set(
        conditions
          .map(
            (condition) =>
              condition.sourceKey
          )
          .filter(Boolean)
      )
    );

    const parent =
      item.visibility?.mode ===
        "conditional" &&
      sourceKeys.length === 1
        ? byKey.get(sourceKeys[0])
        : null;

    if (
      parent &&
      monitoringCanHaveConditionalChildren(
        parent.type
      )
    ) {
      parent.conditionalChildren = [
        ...(parent.conditionalChildren || []),
        {
          trigger:
            monitoringVisibilityToTrigger(
              parent,
              item.visibility
            ),
          item,
        },
      ];
    } else {
      roots.push(item);
    }
  }

  return roots;
}

function nestMonitoringProtocol(
  protocol: MonitoringProtocolScheduleDraft[]
): MonitoringProtocolScheduleDraft[] {
  return (protocol || []).map((schedule) => ({
    ...schedule,
    items: nestMonitoringItems(
      schedule.items || []
    ),
  }));
}

function countMonitoringTreeItems(
  items: MonitoringProtocolItemDraft[]
): number {
  return items.reduce(
    (total, item) =>
      total +
      1 +
      countMonitoringTreeItems(
        (item.conditionalChildren || []).map(
          (child) => child.item
        )
      ),
    0
  );
}

function mapMonitoringTreeItem(
  items: MonitoringProtocolItemDraft[],
  targetKey: string,
  updater: (
    item: MonitoringProtocolItemDraft
  ) => MonitoringProtocolItemDraft
): MonitoringProtocolItemDraft[] {
  return items.map((item) => {
    if (item.key === targetKey) {
      return updater(item);
    }

    return {
      ...item,
      conditionalChildren: (
        item.conditionalChildren || []
      ).map((child) => ({
        ...child,
        item: mapMonitoringTreeItem(
          [child.item],
          targetKey,
          updater
        )[0],
      })),
    };
  });
}

function findMonitoringTreeItem(
  items: MonitoringProtocolItemDraft[],
  targetKey: string
): MonitoringProtocolItemDraft | null {
  for (const item of items) {
    if (item.key === targetKey) {
      return item;
    }

    const nested = findMonitoringTreeItem(
      (item.conditionalChildren || []).map(
        (child) => child.item
      ),
      targetKey
    );

    if (nested) {
      return nested;
    }
  }

  return null;
}

function monitoringConditionMatches(
  condition: MonitoringCondition,
  sourceType: MonitoringBlockType,
  response: any
) {
  const answered =
    monitoringResponseAnswered(response);

  if (condition.operator === "answered") {
    return answered;
  }

  if (
    condition.operator === "not_answered"
  ) {
    return !answered;
  }

  if (!answered) {
    return false;
  }

  const target = condition.value;

  if (
    sourceType === "slider" ||
    sourceType === "number" ||
    sourceType === "time_duration"
  ) {
    const left = Number(response);
    const right = Number(target);

    if (
      Number.isNaN(left) ||
      Number.isNaN(right)
    ) {
      return false;
    }

    if (condition.operator === "gt") {
      return left > right;
    }

    if (condition.operator === "gte") {
      return left >= right;
    }

    if (condition.operator === "lt") {
      return left < right;
    }

    if (condition.operator === "lte") {
      return left <= right;
    }

    if (
      condition.operator === "not_equals"
    ) {
      return left !== right;
    }

    return left === right;
  }

  if (sourceType === "multiple_choice") {
    const values = Array.isArray(response)
      ? response.map(String)
      : [];

    if (
      condition.operator ===
      "not_contains"
    ) {
      return !values.includes(target);
    }

    return values.includes(target);
  }

  if (
    condition.operator ===
    "contains_text"
  ) {
    return String(response)
      .toLowerCase()
      .includes(target.toLowerCase());
  }

  if (
    condition.operator === "not_equals"
  ) {
    return String(response) !== target;
  }

  return String(response) === target;
}

function monitoringResponseAnswered(value: any) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (
    typeof value === "object" &&
    "completed" in value
  ) {
    return Boolean(value.completed);
  }

  return true;
}

function monitoringVisibleItems(
  items: MonitoringProtocolItemDraft[],
  responses: Record<string, any>
) {
  const byKey = new Map(
    items.map((item) => [item.key, item])
  );

  return items.filter((item) => {
    if (
      item.visibility?.mode !==
      "conditional"
    ) {
      return true;
    }

    const conditions =
      item.visibility.conditions || [];

    if (conditions.length === 0) {
      return true;
    }

    const results = conditions.map(
      (condition) => {
        const source = byKey.get(
          condition.sourceKey
        );

        if (!source) {
          return false;
        }

        return monitoringConditionMatches(
          condition,
          source.type,
          responses[condition.sourceKey]
        );
      }
    );

    return item.visibility.logic === "OR"
      ? results.some(Boolean)
      : results.every(Boolean);
  });
}

function cleanHiddenMonitoringResponses(
  items: MonitoringProtocolItemDraft[],
  incoming: Record<string, any>
) {
  let next = {
    ...incoming,
  };

  for (
    let pass = 0;
    pass < items.length + 1;
    pass += 1
  ) {
    const visible = new Set(
      monitoringVisibleItems(
        items,
        next
      ).map((item) => item.key)
    );

    let changed = false;

    for (const key of Object.keys(next)) {
      if (!visible.has(key)) {
        delete next[key];
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  return next;
}

function monitoringResponseText(value: any) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.join(", ") || "—";
  }

  if (typeof value === "object") {
    if (
      value.completed &&
      value.questionnaire_name
    ) {
      return `Completed ${value.questionnaire_name}`;
    }

    if (value.completed) {
      return "Completed";
    }

    return JSON.stringify(value);
  }

  if (typeof value === "boolean") {
    return value
      ? "Completed"
      : "Not completed";
  }

  return String(value);
}

function validateMonitoringEditorProtocol(
  protocol: MonitoringProtocolScheduleDraft[]
) {
  if (
    !protocol.length ||
    protocol.length > 12
  ) {
    return "Choose between 1 and 12 daily check-ins.";
  }

  function validateItems(
    items: MonitoringProtocolItemDraft[],
    scheduleLabel: string
  ): string {
    for (const item of items) {
      if (!item.prompt.trim()) {
        return "Every block needs a prompt or title.";
      }

      if (
        item.type === "questionnaire" &&
        !item.config.questionnaire_id
      ) {
        return "Choose a questionnaire for every questionnaire block.";
      }

      if (
        (item.conditionalChildren || [])
          .length > 0 &&
        !monitoringCanHaveConditionalChildren(
          item.type
        )
      ) {
        return `"${item.prompt}" cannot contain conditional blocks.`;
      }

      for (const child of
        item.conditionalChildren || []) {
        const trigger =
          normaliseMonitoringTriggerForParent(
            item,
            child.trigger
          );

        if (
          item.type === "slider" ||
          item.type === "number"
        ) {
          const first = Number(
            trigger.value
          );

          if (!Number.isFinite(first)) {
            return `Choose a valid conditional value under "${item.prompt}".`;
          }

          if (
            trigger.operator ===
            "between"
          ) {
            const second = Number(
              trigger.value2
            );

            if (
              !Number.isFinite(second) ||
              first > second
            ) {
              return `Choose a valid conditional range under "${item.prompt}".`;
            }
          }
        }

        if (
          item.type ===
          "single_choice"
        ) {
          const options =
            (item.config.options ||
              []) as string[];

          if (
            !trigger.value ||
            !options.includes(
              trigger.value
            )
          ) {
            return `Choose which response opens the conditional block under "${item.prompt}".`;
          }
        }

        if (
          item.type ===
          "multiple_choice"
        ) {
          const options =
            (item.config.options ||
              []) as string[];
          const values =
            trigger.values || [];

          if (
            values.length === 0 ||
            values.some(
              (value) =>
                !options.includes(value)
            )
          ) {
            return `Choose the linked multiple-choice response(s) under "${item.prompt}".`;
          }
        }

        const nestedError =
          validateItems(
            [child.item],
            scheduleLabel
          );

        if (nestedError) {
          return nestedError;
        }
      }
    }

    return "";
  }

  for (const schedule of protocol) {
    if (!schedule.label.trim()) {
      return "Every check-in needs a name.";
    }

    if (
      !schedule.start_time ||
      !schedule.end_time ||
      schedule.start_time >=
        schedule.end_time
    ) {
      return `Check the time window for ${
        schedule.label || "a check-in"
      }.`;
    }

    if (!schedule.items.length) {
      return `${schedule.label} needs at least one block.`;
    }

    if (
      countMonitoringTreeItems(
        schedule.items
      ) > 50
    ) {
      return `${schedule.label} can contain up to 50 total blocks, including nested conditional blocks.`;
    }

    const itemError = validateItems(
      schedule.items,
      schedule.label
    );

    if (itemError) {
      return itemError;
    }
  }

  return "";
}

function MonitoringProtocolBuilderV2({
  protocol,
  onChange,
  questionnaires,
}: {
  protocol: MonitoringProtocolScheduleDraft[];
  onChange: (
    protocol: MonitoringProtocolScheduleDraft[]
  ) => void;
  questionnaires: MonitoringQuestionnaireOption[];
}) {
  const blockTypes: Array<
    [MonitoringBlockType, string]
  > = [
    ["slider", "Slider / rating"],
    ["single_choice", "Single choice"],
    ["multiple_choice", "Multiple choice"],
    ["yes_no", "Yes / No"],
    ["number", "Number"],
    ["short_text", "Short text"],
    ["long_text", "Long text"],
    ["mood", "Mood / emotion"],
    ["time_duration", "Time / duration"],
    ["activity", "Activity"],
    [
      "questionnaire",
      "Questionnaire library",
    ],
    [
      "instruction",
      "Instruction / information",
    ],
  ];

  function updateSchedule(
    index: number,
    patch: Partial<MonitoringProtocolScheduleDraft>
  ) {
    onChange(
      protocol.map((schedule, i) =>
        i === index
          ? {
              ...schedule,
              ...patch,
            }
          : schedule
      )
    );
  }

  function addSchedule() {
    if (protocol.length >= 12) {
      return;
    }

    onChange([
      ...protocol,
      {
        key: monitoringDraftKey(
          `checkin-${protocol.length + 1}`
        ),
        label: `Check-in ${
          protocol.length + 1
        }`,
        start_time: "12:00",
        end_time: "13:00",
        items: [
          newMonitoringItem("slider", 0),
        ],
      },
    ]);
  }

  function removeSchedule(index: number) {
    if (protocol.length <= 1) {
      return;
    }

    onChange(
      protocol.filter(
        (_, i) => i !== index
      )
    );
  }

  function updateItemByKey(
    scheduleIndex: number,
    itemKey: string,
    patch:
      | Partial<MonitoringProtocolItemDraft>
      | ((
          item: MonitoringProtocolItemDraft
        ) => MonitoringProtocolItemDraft)
  ) {
    const schedule =
      protocol[scheduleIndex];

    const items = mapMonitoringTreeItem(
      schedule.items,
      itemKey,
      (item) =>
        typeof patch === "function"
          ? patch(item)
          : {
              ...item,
              ...patch,
            }
    );

    updateSchedule(scheduleIndex, {
      items,
    });
  }

  function updateItemConfig(
    scheduleIndex: number,
    itemKey: string,
    nextConfig: Record<string, any>
  ) {
    updateItemByKey(
      scheduleIndex,
      itemKey,
      (item) => {
        const updated = {
          ...item,
          config: nextConfig,
        };

        if (
          !monitoringCanHaveConditionalChildren(
            updated.type
          )
        ) {
          return updated;
        }

        return {
          ...updated,
          conditionalChildren: (
            updated.conditionalChildren || []
          ).map((child) => ({
            ...child,
            trigger:
              normaliseMonitoringTriggerForParent(
                updated,
                child.trigger
              ),
          })),
        };
      }
    );
  }

  function changeItemType(
    scheduleIndex: number,
    itemKey: string,
    type: MonitoringBlockType
  ) {
    const schedule =
      protocol[scheduleIndex];

    const current =
      findMonitoringTreeItem(
        schedule.items,
        itemKey
      );

    if (!current) {
      return;
    }

    if (
      (current.conditionalChildren || [])
        .length > 0 &&
      !monitoringCanHaveConditionalChildren(
        type
      )
    ) {
      const confirmed = window.confirm(
        "This block contains nested conditional blocks. Changing it to this response type will remove those conditional blocks. Continue?"
      );

      if (!confirmed) {
        return;
      }
    }

    const fresh = newMonitoringItem(
      type,
      countMonitoringTreeItems(
        schedule.items
      )
    );

    updateItemByKey(
      scheduleIndex,
      itemKey,
      (item) => {
        const keepChildren =
          monitoringCanHaveConditionalChildren(
            type
          );

        const updated: MonitoringProtocolItemDraft =
          {
            ...item,
            type,
            prompt: fresh.prompt,
            config: fresh.config,
            required: fresh.required,
            conditionalChildren:
              keepChildren
                ? item.conditionalChildren ||
                  []
                : [],
          };

        if (!keepChildren) {
          return updated;
        }

        return {
          ...updated,
          conditionalChildren: (
            updated.conditionalChildren || []
          ).map((child) => ({
            ...child,
            trigger:
              normaliseMonitoringTriggerForParent(
                updated,
                defaultMonitoringTrigger(
                  updated
                )
              ),
          })),
        };
      }
    );
  }

  function addRootItem(
    scheduleIndex: number,
    type: MonitoringBlockType
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (
      countMonitoringTreeItems(
        schedule.items
      ) >= 50
    ) {
      return;
    }

    updateSchedule(scheduleIndex, {
      items: [
        ...schedule.items,
        newMonitoringItem(
          type,
          countMonitoringTreeItems(
            schedule.items
          )
        ),
      ],
    });
  }

  function addConditionalChild(
    scheduleIndex: number,
    parentKey: string
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (
      countMonitoringTreeItems(
        schedule.items
      ) >= 50
    ) {
      return;
    }

    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => {
        if (
          !monitoringCanHaveConditionalChildren(
            parent.type
          )
        ) {
          return parent;
        }

        return {
          ...parent,
          conditionalChildren: [
            ...(parent.conditionalChildren ||
              []),
            {
              trigger:
                defaultMonitoringTrigger(
                  parent
                ),
              item: newMonitoringItem(
                "short_text",
                countMonitoringTreeItems(
                  schedule.items
                )
              ),
            },
          ],
        };
      }
    );
  }

  function removeRootItem(
    scheduleIndex: number,
    itemIndex: number
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (schedule.items.length <= 1) {
      return;
    }

    updateSchedule(scheduleIndex, {
      items: schedule.items.filter(
        (_, index) =>
          index !== itemIndex
      ),
    });
  }

  function removeConditionalChild(
    scheduleIndex: number,
    parentKey: string,
    childKey: string
  ) {
    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => ({
        ...parent,
        conditionalChildren: (
          parent.conditionalChildren || []
        ).filter(
          (child) =>
            child.item.key !== childKey
        ),
      })
    );
  }

  function moveRootItem(
    scheduleIndex: number,
    itemIndex: number,
    direction: -1 | 1
  ) {
    const schedule =
      protocol[scheduleIndex];
    const target =
      itemIndex + direction;

    if (
      target < 0 ||
      target >= schedule.items.length
    ) {
      return;
    }

    const items = [
      ...schedule.items,
    ];

    [
      items[itemIndex],
      items[target],
    ] = [
      items[target],
      items[itemIndex],
    ];

    updateSchedule(scheduleIndex, {
      items,
    });
  }

  function moveConditionalChild(
    scheduleIndex: number,
    parentKey: string,
    childIndex: number,
    direction: -1 | 1
  ) {
    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => {
        const children = [
          ...(parent.conditionalChildren ||
            []),
        ];
        const target =
          childIndex + direction;

        if (
          target < 0 ||
          target >= children.length
        ) {
          return parent;
        }

        [
          children[childIndex],
          children[target],
        ] = [
          children[target],
          children[childIndex],
        ];

        return {
          ...parent,
          conditionalChildren: children,
        };
      }
    );
  }

  function updateChildTrigger(
    scheduleIndex: number,
    parentKey: string,
    childKey: string,
    trigger: MonitoringConditionalTrigger
  ) {
    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => ({
        ...parent,
        conditionalChildren: (
          parent.conditionalChildren || []
        ).map((child) =>
          child.item.key === childKey
            ? {
                ...child,
                trigger:
                  normaliseMonitoringTriggerForParent(
                    parent,
                    trigger
                  ),
              }
            : child
        ),
      })
    );
  }

  function renderConditionalTrigger(
    scheduleIndex: number,
    parent: MonitoringProtocolItemDraft,
    child: MonitoringConditionalChild
  ) {
    const trigger =
      normaliseMonitoringTriggerForParent(
        parent,
        child.trigger
      );

    if (
      parent.type === "slider" ||
      parent.type === "number"
    ) {
      return (
        <div className="grid gap-3 lg:grid-cols-[210px_1fr] lg:items-end">
          <label>
            <span className="text-xs font-medium text-cyan-950">
              Show this nested block when
            </span>

            <select
              value={trigger.operator}
              onChange={(event) =>
                updateChildTrigger(
                  scheduleIndex,
                  parent.key,
                  child.item.key,
                  {
                    ...trigger,
                    operator:
                      event.target.value as
                        | "gt"
                        | "lt"
                        | "equals"
                        | "between",
                  }
                )
              }
              className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="gt">
                Response is above
              </option>
              <option value="lt">
                Response is below
              </option>
              <option value="equals">
                Response equals
              </option>
              <option value="between">
                Response is within a range
              </option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-xs font-medium text-cyan-950">
                {trigger.operator ===
                "between"
                  ? "From"
                  : "Value"}
              </span>

              <input
                type="number"
                min={parent.config.min}
                max={parent.config.max}
                step={
                  parent.config.step ?? 1
                }
                value={trigger.value ?? ""}
                onChange={(event) =>
                  updateChildTrigger(
                    scheduleIndex,
                    parent.key,
                    child.item.key,
                    {
                      ...trigger,
                      value:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            {trigger.operator ===
              "between" && (
              <label>
                <span className="text-xs font-medium text-cyan-950">
                  To
                </span>

                <input
                  type="number"
                  min={parent.config.min}
                  max={parent.config.max}
                  step={
                    parent.config.step ?? 1
                  }
                  value={
                    trigger.value2 ?? ""
                  }
                  onChange={(event) =>
                    updateChildTrigger(
                      scheduleIndex,
                      parent.key,
                      child.item.key,
                      {
                        ...trigger,
                        value2:
                          event.target.value,
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            )}
          </div>
        </div>
      );
    }

    if (
      parent.type ===
      "single_choice"
    ) {
      const options =
        (parent.config.options ||
          []) as string[];

      return (
        <label className="block">
          <span className="text-xs font-medium text-cyan-950">
            Show this nested block when the participant chooses
          </span>

          <select
            value={trigger.value || ""}
            onChange={(event) =>
              updateChildTrigger(
                scheduleIndex,
                parent.key,
                child.item.key,
                {
                  operator: "equals",
                  value:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">
              Choose linked response…
            </option>

            {options.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (parent.type === "yes_no") {
      return (
        <label className="block">
          <span className="text-xs font-medium text-cyan-950">
            Show this nested block when the participant chooses
          </span>

          <select
            value={trigger.value || "Yes"}
            onChange={(event) =>
              updateChildTrigger(
                scheduleIndex,
                parent.key,
                child.item.key,
                {
                  operator: "equals",
                  value:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="Yes">
              Yes
            </option>
            <option value="No">
              No
            </option>
          </select>
        </label>
      );
    }

    if (
      parent.type ===
      "multiple_choice"
    ) {
      const options =
        (parent.config.options ||
          []) as string[];
      const selected =
        trigger.values || [];

      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-cyan-950">
                Show this nested block when the participant selects
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Choose one or more linked responses.
              </p>
            </div>

            <select
              value={trigger.operator}
              onChange={(event) =>
                updateChildTrigger(
                  scheduleIndex,
                  parent.key,
                  child.item.key,
                  {
                    ...trigger,
                    operator:
                      event.target.value as
                        | "contains_any"
                        | "contains_all",
                  }
                )
              }
              className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              <option value="contains_any">
                Any selected response
              </option>
              <option value="contains_all">
                All selected responses
              </option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((option) => {
              const checked =
                selected.includes(option);

              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                    checked
                      ? "border-cyan-300 bg-cyan-100 text-cyan-950"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const values =
                        event.target
                          .checked
                          ? [
                              ...selected,
                              option,
                            ]
                          : selected.filter(
                              (value) =>
                                value !==
                                option
                            );

                      updateChildTrigger(
                        scheduleIndex,
                        parent.key,
                        child.item.key,
                        {
                          ...trigger,
                          values,
                        }
                      );
                    }}
                  />

                  {option}
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  }

  function renderItem(
    scheduleIndex: number,
    item: MonitoringProtocolItemDraft,
    displayPath: string,
    siblingIndex: number,
    siblingCount: number,
    parent: MonitoringProtocolItemDraft | null,
    childEdge: MonitoringConditionalChild | null
  ): ReactNode {
    const nested =
      parent !== null;

    return (
      <div
        key={item.key}
        className={`rounded-2xl border p-4 ${
          nested
            ? "border-cyan-200 bg-white"
            : "border-slate-200 bg-slate-50/40"
        }`}
      >
        {parent && childEdge && (
          <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800">
                  Conditional block
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  This entire block appears only from the response to:
                  {" "}
                  <span className="font-semibold text-slate-800">
                    {parent.prompt}
                  </span>
                </p>
              </div>
            </div>

            {renderConditionalTrigger(
              scheduleIndex,
              parent,
              childEdge
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={item.type}
              onChange={(event) =>
                changeItemType(
                  scheduleIndex,
                  item.key,
                  event.target
                    .value as MonitoringBlockType
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              {blockTypes.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <span className="text-xs text-slate-400">
              {nested
                ? `Conditional ${displayPath}`
                : `Block ${displayPath}`}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={siblingIndex === 0}
              onClick={() => {
                if (parent) {
                  moveConditionalChild(
                    scheduleIndex,
                    parent.key,
                    siblingIndex,
                    -1
                  );
                } else {
                  moveRootItem(
                    scheduleIndex,
                    siblingIndex,
                    -1
                  );
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs disabled:opacity-30"
            >
              ↑
            </button>

            <button
              type="button"
              disabled={
                siblingIndex ===
                siblingCount - 1
              }
              onClick={() => {
                if (parent) {
                  moveConditionalChild(
                    scheduleIndex,
                    parent.key,
                    siblingIndex,
                    1
                  );
                } else {
                  moveRootItem(
                    scheduleIndex,
                    siblingIndex,
                    1
                  );
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs disabled:opacity-30"
            >
              ↓
            </button>

            <button
              type="button"
              disabled={
                !parent &&
                protocol[
                  scheduleIndex
                ].items.length <= 1
              }
              onClick={() => {
                if (parent) {
                  removeConditionalChild(
                    scheduleIndex,
                    parent.key,
                    item.key
                  );
                } else {
                  removeRootItem(
                    scheduleIndex,
                    siblingIndex
                  );
                }
              }}
              className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-30"
            >
              Remove
            </button>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-slate-500">
            Prompt / title
          </span>

          <input
            value={item.prompt}
            onChange={(event) =>
              updateItemByKey(
                scheduleIndex,
                item.key,
                {
                  prompt:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
          />
        </label>

        {(item.type ===
          "single_choice" ||
          item.type ===
            "multiple_choice" ||
          item.type === "mood") && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">
              Options (one per line)
            </span>

            <textarea
              value={(
                item.config.options || []
              ).join("\n")}
              onChange={(event) =>
                updateItemConfig(
                  scheduleIndex,
                  item.key,
                  {
                    ...item.config,
                    options:
                      event.target.value
                        .split("\n")
                        .map((value) =>
                          value.trim()
                        )
                        .filter(Boolean),
                  }
                )
              }
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-700"
            />
          </label>
        )}

        {item.type === "slider" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["min", "Minimum"],
              ["max", "Maximum"],
              ["step", "Step"],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="text-xs font-medium text-slate-500">
                  {label}
                </span>

                <input
                  type="number"
                  value={
                    item.config[key] ?? ""
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        [key]: Number(
                          event.target.value
                        ),
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            ))}

            <label>
              <span className="text-xs font-medium text-slate-500">
                Low label
              </span>

              <input
                value={
                  item.config.minLabel || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      minLabel:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                High label
              </span>

              <input
                value={
                  item.config.maxLabel || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      maxLabel:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        )}

        {(item.type === "number" ||
          item.type ===
            "time_duration") && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label>
              <span className="text-xs font-medium text-slate-500">
                Minimum
              </span>

              <input
                type="number"
                value={
                  item.config.min ?? ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      min: Number(
                        event.target.value
                      ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                Maximum
              </span>

              <input
                type="number"
                value={
                  item.config.max ?? ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      max: Number(
                        event.target.value
                      ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            {item.type ===
            "time_duration" ? (
              <label>
                <span className="text-xs font-medium text-slate-500">
                  Unit
                </span>

                <select
                  value={
                    item.config.unit ||
                    "minutes"
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        unit:
                          event.target
                            .value,
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="minutes">
                    Minutes
                  </option>
                  <option value="hours">
                    Hours
                  </option>
                  <option value="seconds">
                    Seconds
                  </option>
                </select>
              </label>
            ) : (
              <label>
                <span className="text-xs font-medium text-slate-500">
                  Step
                </span>

                <input
                  type="number"
                  value={
                    item.config.step ?? 1
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        step: Number(
                          event.target.value
                        ),
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            )}
          </div>
        )}

        {item.type === "activity" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <label>
              <span className="text-xs font-medium text-slate-500">
                Activity instructions
              </span>

              <textarea
                value={
                  item.config
                    .instructions || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      instructions:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                Minutes
              </span>

              <input
                type="number"
                min="1"
                value={
                  item.config
                    .durationMinutes ?? 2
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      durationMinutes:
                        Number(
                          event.target.value
                        ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        )}

        {item.type ===
          "questionnaire" && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">
              Questionnaire from library
            </span>

            <select
              value={
                item.config
                  .questionnaire_id || ""
              }
              onChange={(event) => {
                const selected =
                  questionnaires.find(
                    (questionnaire) =>
                      questionnaire.questionnaire_id ===
                      event.target.value
                  );

                updateItemConfig(
                  scheduleIndex,
                  item.key,
                  {
                    ...item.config,
                    questionnaire_id:
                      event.target.value,
                    questionnaire_name:
                      selected?.questionnaire_name ||
                      "",
                    questionnaire_acronym:
                      selected?.questionnaire_acronym ||
                      "",
                  }
                );
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">
                Choose questionnaire…
              </option>

              {questionnaires.map(
                (questionnaire) => (
                  <option
                    key={
                      questionnaire.questionnaire_id
                    }
                    value={
                      questionnaire.questionnaire_id
                    }
                  >
                    {questionnaire.questionnaire_acronym
                      ? `${questionnaire.questionnaire_acronym} — ${questionnaire.questionnaire_name}`
                      : questionnaire.questionnaire_name}
                  </option>
                )
              )}
            </select>
          </label>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-200 pt-4">
          {item.type !==
            "instruction" && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={item.required}
                onChange={(event) =>
                  updateItemByKey(
                    scheduleIndex,
                    item.key,
                    {
                      required:
                        event.target
                          .checked,
                    }
                  )
                }
              />

              Required when shown
            </label>
          )}
        </div>

        {monitoringCanHaveConditionalChildren(
          item.type
        ) && (
          <div className="mt-5 rounded-xl border border-dashed border-cyan-200 bg-cyan-50/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-cyan-950">
                  Conditional follow-up blocks
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add a complete new block inside this response. It will appear only when the response rule you choose is met.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  countMonitoringTreeItems(
                    protocol[
                      scheduleIndex
                    ].items
                  ) >= 50
                }
                onClick={() =>
                  addConditionalChild(
                    scheduleIndex,
                    item.key
                  )
                }
                className="rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-50 disabled:opacity-40"
              >
                + Add conditional block
              </button>
            </div>
          </div>
        )}

        {(item.conditionalChildren || [])
          .length > 0 && (
          <div className="mt-5 border-l-2 border-cyan-200 pl-4">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-800">
                Nested under {item.prompt}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Each nested block has its own response trigger and can itself contain further conditional blocks.
              </p>
            </div>

            <div className="space-y-4">
              {(
                item.conditionalChildren ||
                []
              ).map(
                (child, childIndex) =>
                  renderItem(
                    scheduleIndex,
                    child.item,
                    `${displayPath}.${
                      childIndex + 1
                    }`,
                    childIndex,
                    (
                      item.conditionalChildren ||
                      []
                    ).length,
                    item,
                    child
                  )
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {protocol.map(
        (schedule, scheduleIndex) => (
          <section
            key={schedule.key}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div className="grid flex-1 gap-3 md:grid-cols-[1fr_160px_160px]">
                <label>
                  <span className="text-xs font-medium text-slate-500">
                    Check-in name
                  </span>

                  <input
                    value={schedule.label}
                    onChange={(event) =>
                      updateSchedule(
                        scheduleIndex,
                        {
                          label:
                            event.target
                              .value,
                        }
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                  />
                </label>

                <label>
                  <span className="text-xs font-medium text-slate-500">
                    From
                  </span>

                  <input
                    type="time"
                    value={
                      schedule.start_time
                    }
                    onChange={(event) =>
                      updateSchedule(
                        scheduleIndex,
                        {
                          start_time:
                            event.target
                              .value,
                        }
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                  />
                </label>

                <label>
                  <span className="text-xs font-medium text-slate-500">
                    Until
                  </span>

                  <input
                    type="time"
                    value={schedule.end_time}
                    onChange={(event) =>
                      updateSchedule(
                        scheduleIndex,
                        {
                          end_time:
                            event.target
                              .value,
                        }
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={
                  protocol.length <= 1
                }
                onClick={() =>
                  removeSchedule(
                    scheduleIndex
                  )
                }
                className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-700 disabled:opacity-30"
              >
                Remove check-in
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {schedule.items.map(
                (item, itemIndex) =>
                  renderItem(
                    scheduleIndex,
                    item,
                    String(itemIndex + 1),
                    itemIndex,
                    schedule.items.length,
                    null,
                    null
                  )
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <span className="text-xs font-medium text-slate-500">
                Add block:
              </span>

              {blockTypes.map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={
                      countMonitoringTreeItems(
                        schedule.items
                      ) >= 50
                    }
                    onClick={() =>
                      addRootItem(
                        scheduleIndex,
                        value
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 disabled:opacity-40"
                  >
                    + {label}
                  </button>
                )
              )}
            </div>
          </section>
        )
      )}

      <button
        type="button"
        disabled={protocol.length >= 12}
        onClick={addSchedule}
        className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900 disabled:opacity-40"
      >
        + Add another daily check-in
      </button>
    </div>
  );
}

type MonitoringV2Plan = {
  plan_id: string;
  plan_name: string;
  duration_days: number;
  start_date: string;
  protocol: AmbulatoryScheduleDraft[];
};

type MonitoringV2Checkin = {
  checkin_id: string;
  plan_id: string;
  schedule_id: string;
  schedule_label: string;
  trigger_type?: string;
  occurrence_index?: number;
  trigger_source?: string;
  entry_date: string;
  completed_at: string;
  responses: Array<{ item_id: string; item_key: string; type: MonitoringBlockType; prompt: string; response: any }>;
};

type MonitoringV2Request = {
  request_id: string;
  connection_id: string;
  clinician_id: string;
  clinician_name: string;
  name: string;
  duration_days: number;
  note: string | null;
  protocol: AmbulatoryScheduleDraft[];
  created_at: string;
};

type MonitoringSharingConnection = {
  connection_id: string;
  clinician_id: string;
  clinician_name: string;
  connected_at: string;
  share_assessments: boolean;
  share_monitoring: boolean;
  share_progress: boolean;
  share_wearables: boolean;
  share_regulation: boolean;
  permissions_updated_at: string | null;
};

function Monitoring({
  changeScreen,
  onPendingRequestCountChange,
}: {
  changeScreen: (screen: Screen) => void;
  onPendingRequestCountChange?: (count: number) => void;
}) {
  const [questionnaires, setQuestionnaires] = useState<AmbulatoryQuestionnaireOption[]>([]);
  const [plan, setPlan] = useState<MonitoringV2Plan | null>(null);
  const [protocol, setProtocol] = useState<AmbulatoryScheduleDraft[]>(defaultAmbulatoryProtocol());
  const [planName, setPlanName] = useState("My monitoring protocol");
  const [durationDays, setDurationDays] = useState(7);
  const [editingProtocol, setEditingProtocol] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [requests, setRequests] = useState<MonitoringV2Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [reviewingRequest, setReviewingRequest] = useState<MonitoringV2Request | null>(null);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);

  const [sharingConnections, setSharingConnections] = useState<MonitoringSharingConnection[]>([]);
  const [updatingSharingId, setUpdatingSharingId] = useState<string | null>(null);

  const [checkins, setCheckins] = useState<MonitoringV2Checkin[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [checkinMessage, setCheckinMessage] = useState("");
  const [completedQuestionnaires, setCompletedQuestionnaires] = useState<Record<string, { session_id: string; questionnaire_name: string }>>({});
  const [emailReminderStatus, setEmailReminderStatus] = useState("");
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(false);
  const [emailReminderAddress, setEmailReminderAddress] = useState("");
  const [savingEmailReminders, setSavingEmailReminders] = useState(false);
  const [embeddedQuestionnaires, setEmbeddedQuestionnaires] =
    useState<Record<string, any>>({});
  const [loadingEmbeddedQuestionnaireId, setLoadingEmbeddedQuestionnaireId] =
    useState<string | null>(null);

  async function loadQuestionnaires() {
    const supabase = createClient();
    const { data, error: catalogueError } = await supabase.rpc("psylattice_my_monitoring_questionnaire_catalogue_v3");
    if (!catalogueError) setQuestionnaires((data ?? []) as AmbulatoryQuestionnaireOption[]);
  }

  async function loadPlan() {
    const supabase = createClient();
    const { data, error: planError } = await supabase.rpc("psylattice_my_monitoring_protocol_v2");
    if (planError) {
      setError("Your monitoring protocol could not be loaded.");
      setLoading(false);
      return;
    }
    const row = Array.isArray(data) && data.length ? (data[0] as MonitoringV2Plan) : null;
    setPlan(row);
    if (row) {
      setPlanName(row.plan_name);
      setDurationDays(row.duration_days);
      setProtocol(nestAmbulatoryProtocol(row.protocol || []));
      setSelectedScheduleId((current) => current || row.protocol?.[0]?.schedule_id || "");
      setEditingProtocol(false);
    } else {
      const fresh = defaultAmbulatoryProtocol();
      setPlanName("My monitoring protocol");
      setDurationDays(7);
      setProtocol(fresh);
      setSelectedScheduleId("");
      setEditingProtocol(true);
    }
    setLoading(false);

    if (row) {
      void syncMyMonitoringNotifications();
    }
  }

  async function loadRequests() {
    setLoadingRequests(true);
    const supabase = createClient();

    const { data, error: requestError } =
      await supabase.rpc(
        "psylattice_my_monitoring_requests_v2"
      );

    if (requestError) {
      setError(
        "Clinician monitoring requests could not be loaded."
      );
    } else {
      const loadedRequests =
        (data ?? []) as MonitoringV2Request[];

      setRequests(loadedRequests);
      onPendingRequestCountChange?.(
        loadedRequests.length
      );
    }

    setLoadingRequests(false);
  }

  async function loadSharingConnections() {
    const supabase = createClient();
    const { data, error: sharingError } = await supabase.rpc("psylattice_my_clinicians_and_permissions");
    if (!sharingError) setSharingConnections((data ?? []) as MonitoringSharingConnection[]);
  }

  async function loadCheckins() {
    const supabase = createClient();
    const { data, error: checkinError } = await supabase.rpc("psylattice_my_monitoring_checkins_v2", { p_days: 14 });
    if (!checkinError) setCheckins((data ?? []) as MonitoringV2Checkin[]);
  }

  async function loadCompletedQuestionnairesToday() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("assessment_sessions")
      .select("id, questionnaire_id, completed_at")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", start.toISOString())
      .order("completed_at", { ascending: false });
    const map: Record<string, { session_id: string; questionnaire_name: string }> = {};
    for (const session of data || []) {
      if (!map[session.questionnaire_id]) {
        const q = questionnaires.find((questionnaire) => questionnaire.questionnaire_id === session.questionnaire_id);
        map[session.questionnaire_id] = { session_id: session.id, questionnaire_name: q?.questionnaire_name || "Questionnaire" };
      }
    }
    setCompletedQuestionnaires(map);
  }

  useEffect(() => {
    void Promise.all([
      loadQuestionnaires(),
      loadPlan(),
      loadRequests(),
      loadSharingConnections(),
      loadCheckins(),
      loadEmailReminderPreference(),
    ]);
  }, []);

  useEffect(() => {
    if (questionnaires.length) void loadCompletedQuestionnairesToday();
  }, [questionnaires.length]);

  const activeSchedule = plan?.protocol.find((schedule) => schedule.schedule_id === selectedScheduleId) || plan?.protocol[0] || null;

  useEffect(() => {
    if (!activeSchedule?.schedule_id || !plan?.plan_id) return;
    setSelectedScheduleId(activeSchedule.schedule_id);
    const key = `psylattice-monitoring-draft:${plan.plan_id}:${activeSchedule.schedule_id}:${new Date().toISOString().slice(0, 10)}`;
    try {
      const saved = sessionStorage.getItem(key);
      setResponses(saved ? JSON.parse(saved) : {});
    } catch {
      setResponses({});
    }
    setCheckinMessage("");
  }, [activeSchedule?.schedule_id, plan?.plan_id]);

  useEffect(() => {
    if (!activeSchedule?.schedule_id || !plan?.plan_id) return;
    const key = `psylattice-monitoring-draft:${plan.plan_id}:${activeSchedule.schedule_id}:${new Date().toISOString().slice(0, 10)}`;
    try { sessionStorage.setItem(key, JSON.stringify(responses)); } catch {}
  }, [responses, activeSchedule?.schedule_id, plan?.plan_id]);

  async function loadEmbeddedMonitoringQuestionnaire(
    questionnaireId: string
  ) {
    if (
      !questionnaireId ||
      embeddedQuestionnaires[
        questionnaireId
      ] ||
      loadingEmbeddedQuestionnaireId
    ) {
      return;
    }

    setLoadingEmbeddedQuestionnaireId(
      questionnaireId
    );
    setCheckinMessage("");

    const supabase = createClient();

    const { data, error: questionnaireError } =
      await supabase.rpc(
        "psylattice_my_monitoring_questionnaire_v3",
        {
          p_questionnaire_id:
            questionnaireId,
        }
      );

    if (
      questionnaireError ||
      !data?.ok
    ) {
      console.error(
        "Could not load monitoring questionnaire:",
        questionnaireError
      );
      setCheckinMessage(
        questionnaireError?.message ||
          data?.error ||
          "This questionnaire could not be loaded."
      );
      setLoadingEmbeddedQuestionnaireId(
        null
      );
      return;
    }

    setEmbeddedQuestionnaires(
      (current) => ({
        ...current,
        [questionnaireId]: data,
      })
    );

    setLoadingEmbeddedQuestionnaireId(
      null
    );
  }

  function monitoringEmbeddedAnswerPresent(
    value: any
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  }

  function updateEmbeddedQuestionnaireAnswer(
    block: AmbulatoryItemDraft,
    detail: any,
    questionnaireItem: any,
    answer: any
  ) {
    const current =
      responses[block.key] &&
      typeof responses[block.key] ===
        "object"
        ? responses[block.key]
        : {
            questionnaire_id:
              block.config
                .questionnaire_id,
            questionnaire_name:
              detail?.questionnaire
                ?.name ||
              block.config
                .questionnaire_name ||
              "Questionnaire",
            answers: {},
            completed: false,
          };

    const answers = {
      ...(current.answers || {}),
      [questionnaireItem.id]:
        answer,
    };

    const requiredItems =
      (detail?.items || []).filter(
        (item: any) =>
          item.required
      );

    const completed =
      requiredItems.every(
        (item: any) =>
          monitoringEmbeddedAnswerPresent(
            answers[item.id]
          )
      );

    updateResponse(block, {
      questionnaire_id:
        block.config.questionnaire_id,
      questionnaire_name:
        detail?.questionnaire?.name ||
        block.config
          .questionnaire_name ||
        "Questionnaire",
      questionnaire_acronym:
        detail?.questionnaire?.acronym ||
        block.config
          .questionnaire_acronym ||
        "",
      version_id:
        detail?.version?.id || null,
      answers,
      completed,
    });
  }

  function renderEmbeddedMonitoringQuestionnaire(
    block: AmbulatoryItemDraft
  ): ReactNode {
    const questionnaireId =
      String(
        block.config
          .questionnaire_id || ""
      );

    if (!questionnaireId) {
      return (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            No questionnaire selected
          </p>
        </div>
      );
    }

    const externalCompletion =
      completedQuestionnaires[
        questionnaireId
      ];

    const currentValue =
      responses[block.key];

    if (
      externalCompletion &&
      !currentValue
    ) {
      return (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="font-medium text-emerald-900">
            {block.config
              .questionnaire_acronym ||
              block.config
                .questionnaire_name ||
              "Questionnaire"}
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            ✓ Completed today in Self-Assessments
          </p>
        </div>
      );
    }

    const detail =
      embeddedQuestionnaires[
        questionnaireId
      ];

    if (!detail) {
      return (
        <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
          <p className="font-medium text-cyan-950">
            {block.config
              .questionnaire_acronym ||
              block.config
                .questionnaire_name ||
              "Questionnaire"}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Complete the questionnaire directly inside this check-in. This also
            allows a private questionnaire created by your connected clinician
            in their Research workspace to be used only when it is explicitly
            part of your monitoring protocol.
          </p>

          <button
            type="button"
            disabled={
              loadingEmbeddedQuestionnaireId ===
              questionnaireId
            }
            onClick={() =>
              void loadEmbeddedMonitoringQuestionnaire(
                questionnaireId
              )
            }
            className="mt-3 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loadingEmbeddedQuestionnaireId ===
            questionnaireId
              ? "Loading..."
              : "Open questionnaire in check-in"}
          </button>
        </div>
      );
    }

    const stored =
      currentValue &&
      typeof currentValue ===
        "object"
        ? currentValue
        : {
            answers: {},
            completed: false,
          };

    const optionTypes = new Set([
      "likert",
      "frequency",
      "intensity",
      "yes_no",
      "true_false",
      "single_choice",
      "dropdown",
      "image_choice",
      "numeric_rating",
      "star_rating",
    ]);

    const multiTypes = new Set([
      "multiple_choice",
      "checklist",
    ]);

    const sliderTypes = new Set([
      "slider",
      "visual_analogue",
    ]);

    const numberTypes = new Set([
      "number",
      "numeric",
      "integer",
      "decimal",
    ]);

    return (
      <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
        <div>
          <p className="font-semibold text-cyan-950">
            {detail.questionnaire
              ?.name ||
              block.config
                .questionnaire_name ||
              "Questionnaire"}
          </p>

          {detail.version
            ?.participant_instructions && (
            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
              {
                detail.version
                  .participant_instructions
              }
            </p>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {(detail.items || []).map(
            (questionItem: any) => {
              const answer =
                stored.answers?.[
                  questionItem.id
                ];
              const options =
                Array.isArray(
                  questionItem.response_options
                )
                  ? questionItem.response_options
                  : [];

              const responseType =
                String(
                  questionItem.response_type ||
                    "single_choice"
                );

              return (
                <div
                  key={questionItem.id}
                  className="rounded-xl border border-cyan-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-6 text-slate-900">
                      {
                        questionItem.prompt
                      }
                    </p>

                    {questionItem.required && (
                      <span className="shrink-0 text-[10px] font-semibold uppercase text-cyan-700">
                        Required
                      </span>
                    )}
                  </div>

                  {questionItem.help_text && (
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {
                        questionItem.help_text
                      }
                    </p>
                  )}

                  {optionTypes.has(
                    responseType
                  ) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {options.map(
                        (
                          option: any,
                          optionIndex: number
                        ) => {
                          const optionValue =
                            option?.value ??
                            option?.label ??
                            optionIndex;

                          const optionLabel =
                            option?.label ??
                            String(
                              optionValue
                            );

                          return (
                            <button
                              key={`${questionItem.id}-${optionIndex}`}
                              type="button"
                              onClick={() =>
                                updateEmbeddedQuestionnaireAnswer(
                                  block,
                                  detail,
                                  questionItem,
                                  optionValue
                                )
                              }
                              className={`rounded-xl border px-3 py-2.5 text-left text-xs ${
                                String(
                                  answer
                                ) ===
                                String(
                                  optionValue
                                )
                                  ? "border-cyan-600 bg-cyan-50 font-semibold text-cyan-950"
                                  : "border-slate-200 text-slate-600"
                              }`}
                            >
                              {
                                optionLabel
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}

                  {multiTypes.has(
                    responseType
                  ) && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {options.map(
                        (
                          option: any,
                          optionIndex: number
                        ) => {
                          const optionValue =
                            option?.value ??
                            option?.label ??
                            optionIndex;

                          const optionLabel =
                            option?.label ??
                            String(
                              optionValue
                            );

                          const selected =
                            Array.isArray(
                              answer
                            ) &&
                            answer.some(
                              (
                                entry: any
                              ) =>
                                String(
                                  entry
                                ) ===
                                String(
                                  optionValue
                                )
                            );

                          return (
                            <button
                              key={`${questionItem.id}-${optionIndex}`}
                              type="button"
                              onClick={() => {
                                const current =
                                  Array.isArray(
                                    answer
                                  )
                                    ? answer
                                    : [];

                                const next =
                                  selected
                                    ? current.filter(
                                        (
                                          entry: any
                                        ) =>
                                          String(
                                            entry
                                          ) !==
                                          String(
                                            optionValue
                                          )
                                      )
                                    : [
                                        ...current,
                                        optionValue,
                                      ];

                                updateEmbeddedQuestionnaireAnswer(
                                  block,
                                  detail,
                                  questionItem,
                                  next
                                );
                              }}
                              className={`rounded-xl border px-3 py-2.5 text-left text-xs ${
                                selected
                                  ? "border-cyan-600 bg-cyan-50 font-semibold text-cyan-950"
                                  : "border-slate-200 text-slate-600"
                              }`}
                            >
                              {selected
                                ? "✓ "
                                : ""}
                              {
                                optionLabel
                              }
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}

                  {sliderTypes.has(
                    responseType
                  ) && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>
                          {questionItem
                            .response_config
                            ?.min_label ??
                            questionItem
                              .response_config
                              ?.min ??
                            0}
                        </span>

                        <span className="font-semibold text-slate-700">
                          {answer ??
                            questionItem
                              .response_config
                              ?.min ??
                            0}
                        </span>

                        <span>
                          {questionItem
                            .response_config
                            ?.max_label ??
                            questionItem
                              .response_config
                              ?.max ??
                            10}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={
                          questionItem
                            .response_config
                            ?.min ?? 0
                        }
                        max={
                          questionItem
                            .response_config
                            ?.max ?? 10
                        }
                        step={
                          questionItem
                            .response_config
                            ?.step ?? 1
                        }
                        value={
                          answer ??
                          questionItem
                            .response_config
                            ?.min ??
                          0
                        }
                        onChange={(
                          event
                        ) =>
                          updateEmbeddedQuestionnaireAnswer(
                            block,
                            detail,
                            questionItem,
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        className="mt-3 w-full"
                      />
                    </div>
                  )}

                  {numberTypes.has(
                    responseType
                  ) && (
                    <input
                      type="number"
                      value={answer ?? ""}
                      min={
                        questionItem
                          .response_config
                          ?.min
                      }
                      max={
                        questionItem
                          .response_config
                          ?.max
                      }
                      step={
                        questionItem
                          .response_config
                          ?.step || 1
                      }
                      onChange={(
                        event
                      ) =>
                        updateEmbeddedQuestionnaireAnswer(
                          block,
                          detail,
                          questionItem,
                          event.target
                            .value === ""
                            ? ""
                            : Number(
                                event
                                  .target
                                  .value
                              )
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  )}

                  {(responseType ===
                    "long_text" ||
                    responseType ===
                      "textarea") && (
                    <textarea
                      value={answer ?? ""}
                      onChange={(
                        event
                      ) =>
                        updateEmbeddedQuestionnaireAnswer(
                          block,
                          detail,
                          questionItem,
                          event.target
                            .value
                        )
                      }
                      className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm"
                    />
                  )}

                  {(responseType ===
                    "short_text" ||
                    responseType ===
                      "text") && (
                    <input
                      value={answer ?? ""}
                      onChange={(
                        event
                      ) =>
                        updateEmbeddedQuestionnaireAnswer(
                          block,
                          detail,
                          questionItem,
                          event.target
                            .value
                        )
                      }
                      className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    />
                  )}

                  {!optionTypes.has(
                    responseType
                  ) &&
                    !multiTypes.has(
                      responseType
                    ) &&
                    !sliderTypes.has(
                      responseType
                    ) &&
                    !numberTypes.has(
                      responseType
                    ) &&
                    responseType !==
                      "long_text" &&
                    responseType !==
                      "textarea" &&
                    responseType !==
                      "short_text" &&
                    responseType !==
                      "text" && (
                      <input
                        value={answer ?? ""}
                        onChange={(
                          event
                        ) =>
                          updateEmbeddedQuestionnaireAnswer(
                            block,
                            detail,
                            questionItem,
                            event.target
                              .value
                          )
                        }
                        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                    )}
                </div>
              );
            }
          )}
        </div>

        {stored.completed ? (
          <p className="mt-4 text-sm font-semibold text-emerald-700">
            ✓ Questionnaire complete
          </p>
        ) : (
          <p className="mt-4 text-xs text-slate-500">
            Complete every required questionnaire item before submitting the
            check-in.
          </p>
        )}
      </div>
    );
  }

  function monitoringTimezoneName() {
    try {
      return (
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone || ""
      );
    } catch {
      return "";
    }
  }

  async function syncMyMonitoringNotifications() {
    const supabase = createClient();

    const { error: syncError } =
      await supabase.rpc(
        "psylattice_sync_my_monitoring_notifications",
        {
          p_timezone_offset_minutes:
            new Date().getTimezoneOffset(),
          p_timezone_name:
            monitoringTimezoneName(),
          p_days_ahead: 14,
        }
      );

    if (syncError) {
      console.error(
        "Could not sync monitoring notifications:",
        syncError
      );
    }
  }

  async function loadEmailReminderPreference() {
    const supabase = createClient();

    const { data, error: preferenceError } =
      await supabase.rpc(
        "psylattice_my_email_reminder_preference"
      );

    if (preferenceError) {
      console.error(
        "Could not load email reminder preference:",
        preferenceError
      );
      return;
    }

    setEmailRemindersEnabled(
      Boolean(data?.enabled)
    );
    setEmailReminderAddress(
      String(data?.email || "")
    );
  }

  async function setEmailReminders(
    enabled: boolean
  ) {
    if (savingEmailReminders) {
      return;
    }

    setSavingEmailReminders(true);
    setEmailReminderStatus("");

    const supabase = createClient();

    const { data, error: preferenceError } =
      await supabase.rpc(
        "psylattice_set_my_email_reminders",
        {
          p_enabled: enabled,
        }
      );

    if (preferenceError || !data?.ok) {
      console.error(
        "Could not update email reminder preference:",
        preferenceError
      );
      setEmailReminderStatus(
        preferenceError?.message ||
          "Email reminder settings could not be saved."
      );
      setSavingEmailReminders(false);
      return;
    }

    setEmailRemindersEnabled(
      Boolean(data.enabled)
    );
    setEmailReminderAddress(
      String(data.email || "")
    );

    await syncMyMonitoringNotifications();

    setEmailReminderStatus(
      enabled
        ? "Email reminders are enabled."
        : "Email reminders are off."
    );

    setSavingEmailReminders(false);
  }

  function validateProtocolDraft() {
    if (!planName.trim()) {
      return "Enter a protocol name.";
    }

    if (
      durationDays < 1 ||
      durationDays > 365
    ) {
      return "Duration must be between 1 and 365 days.";
    }

    return validateAmbulatoryProtocol(
      protocol
    );
  }

  async function saveProtocol() {
    if (saving) return;
    const validation = validateProtocolDraft();
    if (validation) { setError(validation); return; }
    setSaving(true); setError(""); setSuccess("");
    const supabase = createClient();
    const rpc = reviewingRequest ? "psylattice_accept_monitoring_request_v2" : "psylattice_save_my_monitoring_protocol_v2";
    const serialisedProtocol =
      serializeAmbulatoryProtocol(protocol);

    const args = reviewingRequest
      ? {
          p_request_id: reviewingRequest.request_id,
          p_name: planName.trim(),
          p_duration_days: durationDays,
          p_protocol: serialisedProtocol,
        }
      : {
          p_plan_id: plan?.plan_id || null,
          p_name: planName.trim(),
          p_duration_days: durationDays,
          p_protocol: serialisedProtocol,
        };
    const { error: saveError } = await supabase.rpc(rpc, args);
    if (saveError) {
      console.error("Monitoring V2 save failed:", saveError);
      setError(saveError.message || "The monitoring protocol could not be saved.");
      setSaving(false);
      return;
    }
    setSuccess(reviewingRequest ? `Protocol from ${reviewingRequest.clinician_name} accepted with your changes.` : "Monitoring protocol saved.");
    setReviewingRequest(null);
    setEditingProtocol(false);
    setSaving(false);
    await Promise.all([loadPlan(), loadRequests(), loadCheckins()]);
    await syncMyMonitoringNotifications();
  }

  function reviewRequest(request: MonitoringV2Request) {
    setReviewingRequest(request);
    setPlanName(request.name);
    setDurationDays(request.duration_days);
    const nestedRequestProtocol =
      nestAmbulatoryProtocol(
        request.protocol || []
      );

    setProtocol(
      nestedRequestProtocol.length
        ? nestedRequestProtocol
        : defaultAmbulatoryProtocol()
    );
    setEditingProtocol(true);
    setError(""); setSuccess("");
  }

  async function declineRequest(request: MonitoringV2Request) {
    if (respondingRequestId) return;
    if (!window.confirm(`Decline the monitoring protocol from ${request.clinician_name}?`)) return;
    setRespondingRequestId(request.request_id);
    const supabase = createClient();
    const { error: declineError } = await supabase.rpc("psylattice_decline_monitoring_request_v2", { p_request_id: request.request_id });
    if (declineError) setError("The monitoring request could not be declined.");
    else setSuccess("Monitoring request declined.");
    setRespondingRequestId(null);
    await loadRequests();
  }

  async function stopProtocol() {
    if (!plan || !window.confirm("Stop this monitoring protocol? Your previous check-ins will remain in your history, but no further check-ins will be active.")) return;
    const supabase = createClient();
    const { error: stopError } = await supabase.rpc("psylattice_stop_my_monitoring_protocol", { p_plan_id: plan.plan_id });
    if (stopError) { setError("The monitoring protocol could not be stopped."); return; }
    setSuccess("Monitoring protocol stopped.");
    await loadPlan();
  }

  async function setMonitoringSharing(connection: MonitoringSharingConnection, share: boolean) {
    if (updatingSharingId) return;
    setUpdatingSharingId(connection.connection_id);
    setError("");
    const supabase = createClient();
    const { error: sharingError } = await supabase.rpc("psylattice_set_clinician_permissions", {
      p_connection_id: connection.connection_id,
      p_share_assessments: connection.share_assessments,
      p_share_monitoring: share,
      p_share_progress: connection.share_progress,
      p_share_wearables: connection.share_wearables,
      p_share_regulation: connection.share_regulation,
    });
    if (sharingError) setError("Monitoring sharing could not be updated.");
    else {
      setSharingConnections((current) => current.map((item) => item.connection_id === connection.connection_id ? { ...item, share_monitoring: share } : item));
      setSuccess(share ? `Monitoring sharing resumed with ${connection.clinician_name}.` : `Monitoring sharing stopped for ${connection.clinician_name}.`);
    }
    setUpdatingSharingId(null);
  }

  function effectiveResponsesForSchedule(schedule: AmbulatoryScheduleDraft | null) {
    if (!schedule) return responses;
    const next = { ...responses };
    for (const item of schedule.items) {
      if (item.type === "questionnaire") {
        const id = item.config.questionnaire_id;
        const completed = id ? completedQuestionnaires[id] : null;
        if (completed && !next[item.key]) {
          next[item.key] = {
            completed: true,
            questionnaire_id: id,
            questionnaire_name: completed.questionnaire_name,
            assessment_session_id: completed.session_id,
          };
        }
      }
    }
    return cleanHiddenAmbulatoryResponses(schedule.items, next);
  }

  async function submitCheckin() {
    if (!plan || !activeSchedule?.schedule_id || savingCheckin) return;
    const effective = effectiveResponsesForSchedule(activeSchedule);
    const visible = ambulatoryVisibleItems(activeSchedule.items, effective);
    const missing = visible.find((item) => item.required && item.type !== "instruction" && !ambulatoryResponseAnswered(effective[item.key]));
    if (missing) { setCheckinMessage(`Please complete: ${missing.prompt}`); return; }
    setSavingCheckin(true); setCheckinMessage("");
    const supabase = createClient();
    const payload = visible
      .filter((item) => item.type !== "instruction" && item.item_id && ambulatoryResponseAnswered(effective[item.key]))
      .map((item) => ({ item_id: item.item_id, response: effective[item.key] }));
    const { error: submitError } = await supabase.rpc("psylattice_submit_monitoring_checkin_v3", {
      p_plan_id: plan.plan_id,
      p_schedule_id: activeSchedule.schedule_id,
      p_responses: payload,
      p_occurrence_index:
        activeSchedule.trigger_type === "event_contingent" ||
        activeSchedule.trigger_type === "participant_initiated"
          ? null
          : 1,
      p_timezone_offset_minutes:
        new Date().getTimezoneOffset(),
    });
    if (submitError) {
      console.error("Check-in submit failed:", submitError);
      setCheckinMessage("This check-in could not be saved.");
    } else {
      setCheckinMessage(`${activeSchedule.label} saved.`);
      setResponses({});
      try { sessionStorage.removeItem(`psylattice-monitoring-draft:${plan.plan_id}:${activeSchedule.schedule_id}:${new Date().toISOString().slice(0, 10)}`); } catch {}
      await loadCheckins();
    }
    setSavingCheckin(false);
  }

  function updateResponse(item: AmbulatoryItemDraft, value: any) {
    if (!activeSchedule) return;
    setResponses((current) => cleanHiddenAmbulatoryResponses(activeSchedule.items, { ...current, [item.key]: value }));
    setCheckinMessage("");
  }

  const nowForMonitoringDate = new Date();
  const today = [
    nowForMonitoringDate.getFullYear(),
    String(
      nowForMonitoringDate.getMonth() + 1
    ).padStart(2, "0"),
    String(
      nowForMonitoringDate.getDate()
    ).padStart(2, "0"),
  ].join("-");

  const scheduledSchedules =
    plan?.protocol.filter(
      (schedule) =>
        schedule.trigger_type !== "event_contingent" &&
        schedule.trigger_type !== "participant_initiated"
    ) || [];

  const eventSchedules =
    plan?.protocol.filter(
      (schedule) =>
        schedule.trigger_type === "event_contingent" ||
        schedule.trigger_type === "participant_initiated"
    ) || [];

  const todayCompletedScheduleIds = new Set(
    checkins
      .filter(
        (checkin) =>
          checkin.entry_date === today &&
          checkin.trigger_type !== "event_contingent" &&
          checkin.trigger_type !== "participant_initiated"
      )
      .map(
        (checkin) =>
          checkin.schedule_id
      )
  );

  const effective = effectiveResponsesForSchedule(activeSchedule);
  const visibleItems = activeSchedule ? ambulatoryVisibleItems(activeSchedule.items, effective) : [];

  if (loading) return <Panel title="Daily Monitoring"><p className="text-sm text-slate-500">Loading Monitoring Builder V2...</p></Panel>;

  return (
    <div className="space-y-5">
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">{success}</div>}

      <Panel title="Clinician monitoring requests" description="A clinician can suggest a full protocol. You can review, edit questions, change timing, change branching logic, add or remove blocks, or decline it.">
        {loadingRequests ? <p className="text-sm text-slate-500">Loading requests...</p> : requests.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5"><p className="font-medium">No pending monitoring requests</p><p className="mt-2 text-sm text-slate-500">Any new clinician protocol will appear here for your approval.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((request) => (
              <div key={request.request_id} className="flex flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-start">
                <div><p className="font-semibold">{request.name}</p><p className="mt-1 text-sm text-slate-500">From {request.clinician_name} · {request.duration_days} days · {request.protocol.length} check-ins/day</p>{request.note && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{request.note}</p>}</div>
                <div className="flex gap-2"><button type="button" onClick={() => reviewRequest(request)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white">Review & customise</button><button type="button" disabled={respondingRequestId === request.request_id} onClick={() => void declineRequest(request)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">Decline</button></div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Monitoring sharing" description="Stopping a protocol and stopping data sharing are separate choices.">
        {sharingConnections.length === 0 ? <p className="text-sm text-slate-500">No connected clinicians.</p> : (
          <div className="divide-y divide-slate-100">
            {sharingConnections.map((connection) => (
              <div key={connection.connection_id} className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div><p className="text-sm font-medium">{connection.clinician_name}</p><p className="mt-1 text-xs text-slate-400">{connection.share_monitoring ? "Currently receiving your authorised monitoring feed." : "Monitoring data is currently private from this clinician."}</p></div>
                <button type="button" disabled={updatingSharingId === connection.connection_id} onClick={() => void setMonitoringSharing(connection, !connection.share_monitoring)} className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${connection.share_monitoring ? "border border-red-200 bg-white text-red-700" : "bg-slate-950 text-white"}`}>{updatingSharingId === connection.connection_id ? "Updating..." : connection.share_monitoring ? "Stop sharing monitoring" : "Share monitoring"}</button>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title={reviewingRequest ? "Review clinician protocol" : plan ? "Your active monitoring protocol" : "Create your monitoring protocol"} description="Build time-contingent and event-contingent check-ins. Nested conditional blocks, activities and questionnaire blocks are fully customisable.">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <label><span className="text-xs font-medium text-slate-500">Protocol name</span><input value={planName} onChange={(event) => setPlanName(event.target.value)} disabled={!editingProtocol} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50" /></label>
          <label><span className="text-xs font-medium text-slate-500">Duration (days)</span><input type="number" min="1" max="365" value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))} disabled={!editingProtocol} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-50" /></label>
          {!editingProtocol ? <button type="button" onClick={() => { setReviewingRequest(null); setEditingProtocol(true); }} className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900">Customise protocol</button> : null}
        </div>

        {editingProtocol ? (
          <div className="mt-6"><AmbulatoryProtocolBuilder
            protocol={protocol}
            onChange={setProtocol}
            questionnaires={questionnaires}
            context="self"
          /><div className="mt-6 flex flex-wrap gap-2"><button type="button" disabled={saving} onClick={() => void saveProtocol()} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : reviewingRequest ? "Accept & use customised protocol" : plan ? "Save protocol" : "Start protocol"}</button>{(plan || reviewingRequest) && <button type="button" disabled={saving} onClick={() => { setEditingProtocol(false); setReviewingRequest(null); if (plan) { setPlanName(plan.plan_name); setDurationDays(plan.duration_days); setProtocol(nestAmbulatoryProtocol(plan.protocol)); } }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">Cancel</button>}</div></div>
        ) : plan ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{plan.protocol.map((schedule) => <div key={schedule.schedule_id || schedule.key} className="rounded-xl border border-slate-200 p-4"><p className="font-medium">{schedule.label}</p><p className="mt-1 text-xs text-slate-400">
              {(schedule.trigger_type === "event_contingent" ||
                schedule.trigger_type === "participant_initiated")
                ? `Available any time · ${schedule.event_title || schedule.label}`
                : schedule.trigger_type === "fixed_time"
                  ? `Fixed at ${schedule.fixed_time || schedule.start_time}`
                  : `${schedule.start_time}–${schedule.end_time}`}
              {" · "}
              {schedule.items.length} blocks
            </p></div>)}</div>
        ) : null}

        {plan && !reviewingRequest && <div className="mt-6 border-t border-slate-100 pt-5"><button type="button" onClick={() => void stopProtocol()} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700">Stop monitoring protocol</button><p className="mt-2 text-xs text-slate-400">Stopping keeps your previous check-in history.</p></div>}
      </Panel>

      <Panel
        title="Email reminders"
        description="Receive scheduled Daily Monitoring reminders at the email address connected to your PsyLattice account."
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium text-slate-800">
              {emailRemindersEnabled
                ? "Email reminders are on"
                : "Email reminders are off"}
            </p>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              {emailReminderAddress
                ? `Scheduled check-in reminders will be sent to ${emailReminderAddress}.`
                : "PsyLattice will use the email address connected to your account."}
            </p>

            {!plan ? (
              <p className="mt-2 text-xs font-medium text-slate-500">
                You can enable email reminders now. They will be used when you
                start a monitoring protocol with scheduled check-ins.
              </p>
            ) : scheduledSchedules.length === 0 ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Your current protocol contains only event-contingent check-ins.
                Those remain available at any time and do not create scheduled
                reminder emails.
              </p>
            ) : !scheduledSchedules.some(
                (schedule) => schedule.notification_enabled !== false
              ) ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                Your scheduled check-ins do not currently have reminder emails
                enabled. In Customise protocol, turn on “Send an email reminder”
                for the check-ins you want emailed.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                Event-contingent check-ins remain available in Daily Monitoring
                and are not sent as clock-based reminder emails.
              </p>
            )}

            {emailReminderStatus && (
              <p className="mt-2 text-xs font-semibold text-cyan-800">
                {emailReminderStatus}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={savingEmailReminders}
            onClick={() =>
              void setEmailReminders(
                !emailRemindersEnabled
              )
            }
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
              emailRemindersEnabled
                ? "border border-slate-200 bg-white text-slate-700"
                : "bg-slate-950 text-white"
            }`}
          >
            {savingEmailReminders
              ? "Saving..."
              : emailRemindersEnabled
                ? "Turn off email reminders"
                : "Enable email reminders"}
          </button>
        </div>
      </Panel>

      {plan && !editingProtocol && (
        <Panel
          title="Today's monitoring"
          description="Scheduled check-ins and event-contingent reports use the same flexible runner. Hidden conditional branches are cleared automatically if an earlier answer changes."
        >
          {scheduledSchedules.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Scheduled check-ins
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {scheduledSchedules.map((schedule) => (
                  <button
                    key={schedule.schedule_id || schedule.key}
                    type="button"
                    onClick={() => {
                      setSelectedScheduleId(
                        schedule.schedule_id || ""
                      );
                      setResponses({});
                      setCheckinMessage("");
                    }}
                    className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                      activeSchedule?.schedule_id === schedule.schedule_id
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {todayCompletedScheduleIds.has(
                      schedule.schedule_id || ""
                    )
                      ? "✓ "
                      : ""}
                    {schedule.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {eventSchedules.length > 0 && (
            <div className={scheduledSchedules.length > 0 ? "mt-6" : ""}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-800">
                Event check-ins · available any time
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {eventSchedules.map((schedule) => {
                  const todayCount = checkins.filter(
                    (checkin) =>
                      checkin.entry_date === today &&
                      checkin.schedule_id === schedule.schedule_id
                  ).length;

                  return (
                    <button
                      key={schedule.schedule_id || schedule.key}
                      type="button"
                      onClick={() => {
                        setSelectedScheduleId(
                          schedule.schedule_id || ""
                        );
                        setResponses({});
                        setCheckinMessage("");
                      }}
                      className={`rounded-2xl border p-4 text-left transition ${
                        activeSchedule?.schedule_id === schedule.schedule_id
                          ? "border-cyan-400 bg-cyan-50"
                          : "border-cyan-100 bg-white hover:bg-cyan-50/50"
                      }`}
                    >
                      <p className="font-semibold text-cyan-950">
                        + {schedule.event_title || schedule.label}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {schedule.event_description ||
                          "Complete this whenever the event occurs."}
                      </p>

                      <p className="mt-2 text-[11px] text-slate-400">
                        {todayCount} report{todayCount === 1 ? "" : "s"} today
                        {" · "}
                        up to {schedule.maximum_per_day || 8}/day
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSchedule && <div className="mt-6 space-y-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{activeSchedule.label}</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-500">
                  {(activeSchedule.trigger_type || "fixed_time").replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {(activeSchedule.trigger_type === "event_contingent" ||
                  activeSchedule.trigger_type === "participant_initiated")
                  ? "Available any time"
                  : activeSchedule.trigger_type === "fixed_time"
                    ? `Fixed at ${activeSchedule.fixed_time || activeSchedule.start_time}`
                    : `${activeSchedule.start_time}–${activeSchedule.end_time}`}
                {" · "}
                {visibleItems.length} visible blocks
              </p>
            </div>
            {visibleItems.map((item) => {
              const value = effective[item.key];
              const options = (item.config.options || []) as string[];
              return <div key={item.key} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-900">{item.prompt}</p>{item.required && item.type !== "instruction" && <p className="mt-1 text-[11px] font-medium text-cyan-800">Required</p>}</div><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-400">{item.type.replaceAll("_", " ")}</span></div>

                {item.type === "instruction" && <p className="mt-4 text-sm leading-6 text-slate-600">{item.config.text || item.prompt}</p>}
                {item.type === "slider" && <div className="mt-5"><div className="flex justify-between text-xs text-slate-400"><span>{item.config.minLabel || item.config.min}</span><span className="font-semibold text-slate-700">{value ?? item.config.min ?? 0}</span><span>{item.config.maxLabel || item.config.max}</span></div><input type="range" min={item.config.min ?? 0} max={item.config.max ?? 10} step={item.config.step ?? 1} value={value ?? item.config.min ?? 0} onChange={(event) => updateResponse(item, Number(event.target.value))} className="mt-3 w-full" /></div>}
                {(item.type === "single_choice" || item.type === "mood") && <div className="mt-4 grid gap-2 sm:grid-cols-2">{options.map((option) => <button key={option} type="button" onClick={() => updateResponse(item, option)} className={`rounded-xl border px-4 py-3 text-left text-sm ${value === option ? "border-cyan-700 bg-cyan-50 text-cyan-950" : "border-slate-200"}`}>{option}</button>)}</div>}
                {item.type === "yes_no" && <div className="mt-4 flex gap-2">{["Yes", "No"].map((option) => <button key={option} type="button" onClick={() => updateResponse(item, option)} className={`rounded-xl border px-5 py-3 text-sm font-semibold ${value === option ? "border-cyan-700 bg-cyan-50 text-cyan-950" : "border-slate-200"}`}>{option}</button>)}</div>}
                {item.type === "multiple_choice" && <div className="mt-4 grid gap-2 sm:grid-cols-2">{options.map((option) => { const selected = Array.isArray(value) && value.includes(option); return <button key={option} type="button" onClick={() => { const current = Array.isArray(value) ? value : []; updateResponse(item, selected ? current.filter((entry: string) => entry !== option) : [...current, option]); }} className={`rounded-xl border px-4 py-3 text-left text-sm ${selected ? "border-cyan-700 bg-cyan-50" : "border-slate-200"}`}>{selected ? "✓ " : ""}{option}</button>; })}</div>}
                {(item.type === "number" || item.type === "time_duration") && <div className="mt-4 flex items-center gap-3"><input type="number" min={item.config.min} max={item.config.max} step={item.config.step || 1} value={value ?? ""} onChange={(event) => updateResponse(item, event.target.value === "" ? "" : Number(event.target.value))} className="w-44 rounded-xl border border-slate-200 px-4 py-3 text-sm" />{item.type === "time_duration" && <span className="text-sm text-slate-500">{item.config.unit || "minutes"}</span>}</div>}
                {item.type === "short_text" && <input value={value ?? ""} onChange={(event) => updateResponse(item, event.target.value)} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />}
                {item.type === "long_text" && <textarea value={value ?? ""} onChange={(event) => updateResponse(item, event.target.value)} className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 p-4 text-sm" />}
                {item.type === "activity" && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-sm leading-6 text-slate-600">{item.config.instructions}</p><p className="mt-2 text-xs text-slate-400">Suggested duration: {item.config.durationMinutes || 2} minutes</p><button type="button" onClick={() => updateResponse(item, !value)} className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${value ? "bg-emerald-100 text-emerald-800" : "bg-slate-950 text-white"}`}>{value ? "✓ Completed" : "Mark activity complete"}</button></div>}
                {item.type === "questionnaire" &&
                  renderEmbeddedMonitoringQuestionnaire(item)}
              </div>;
            })}
            {checkinMessage && <div className={`rounded-xl px-4 py-3 text-sm ${checkinMessage.includes("saved") ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-amber-200 bg-amber-50 text-amber-800"}`}>{checkinMessage}</div>}
            <button
              type="button"
              disabled={savingCheckin}
              onClick={() => void submitCheckin()}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingCheckin
                ? "Saving..."
                : activeSchedule.trigger_type === "event_contingent" ||
                    activeSchedule.trigger_type === "participant_initiated"
                  ? "Submit event check-in"
                  : todayCompletedScheduleIds.has(
                        activeSchedule.schedule_id || ""
                      )
                    ? "Update today's check-in"
                    : "Save check-in"}
            </button>
          </div>}
        </Panel>
      )}

      <Panel title="Recent monitoring history" description="Flexible responses are stored block-by-block. Hidden branch responses are not submitted.">
        {checkins.length === 0 ? <p className="text-sm text-slate-500">No V2 check-ins yet.</p> : <div className="divide-y divide-slate-100">{checkins.slice(0, 12).map((checkin) => <div key={checkin.checkin_id} className="py-4 first:pt-0 last:pb-0"><div className="flex justify-between gap-3"><p className="text-sm font-semibold">{checkin.schedule_label}</p><span className="text-xs text-slate-400">{new Date(checkin.completed_at).toLocaleString()}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{checkin.responses.slice(0, 6).map((response) => <div key={response.item_id} className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-slate-400">{response.prompt}</p><p className="mt-1 text-sm text-slate-700">{monitoringResponseText(response.response)}</p></div>)}</div></div>)}</div>}
      </Panel>
    </div>
  );
}


/* =========================================================
   SELF REGULATION
   ========================================================= */

function Regulation() {
  type RegulationPlan = {
    id: string;
    name: string;
    duration_days: number;
    start_date: string;
    status: string;
  };

  type RegulationActivity = {
    id: string;
    name: string;
    description: string | null;
    preferred_time: string | null;
    time_label: string;
    target_per_day: number;
    sort_order: number;
  };

  type RegulationCompletion = {
    id: string;
    activity_id: string;
    completion_date: string;
    occurrence: number;
    completed_at: string;
  };

  type ActivityDraft = {
    id?: string;
    name: string;
    description: string;
    preferred_time: string;
    time_label: string;
    target_per_day: number;
  };

  const defaultActivities: ActivityDraft[] = [
    {
      name: "2-minute breathing",
      description: "A short paced breathing practice.",
      preferred_time: "08:30",
      time_label: "Morning",
      target_per_day: 1,
    },
    {
      name: "Movement break",
      description: "Take a short break to stand, stretch, or move.",
      preferred_time: "15:00",
      time_label: "Afternoon",
      target_per_day: 1,
    },
    {
      name: "Evening reflection",
      description: "Briefly reflect on what helped you regulate today.",
      preferred_time: "21:00",
      time_label: "Evening",
      target_per_day: 1,
    },
  ];

  const [plan, setPlan] = useState<RegulationPlan | null>(null);
  const [activities, setActivities] = useState<RegulationActivity[]>([]);
  const [activityDrafts, setActivityDrafts] =
    useState<ActivityDraft[]>(defaultActivities);
  const [todayCompletions, setTodayCompletions] = useState<
    RegulationCompletion[]
  >([]);

  const [planName, setPlanName] = useState("My self-regulation plan");
  const [durationDays, setDurationDays] = useState(14);

  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingCompletions, setLoadingCompletions] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingActivityId, setSavingActivityId] = useState<string | null>(null);
  const [showPlanEditor, setShowPlanEditor] = useState(false);

  const [planError, setPlanError] = useState("");
  const [planSuccess, setPlanSuccess] = useState("");
  const [completionError, setCompletionError] = useState("");
  const [completionSuccess, setCompletionSuccess] = useState("");

  function getLocalDateString() {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function updateActivity(
    index: number,
    field:
      | "name"
      | "description"
      | "preferred_time"
      | "time_label"
      | "target_per_day",
    value: string | number
  ) {
    setActivityDrafts((previous) =>
      previous.map((activity, activityIndex) =>
        activityIndex === index
          ? {
              ...activity,
              [field]: value,
            }
          : activity
      )
    );
  }

  function addActivity() {
    if (activityDrafts.length >= 12) {
      return;
    }

    setActivityDrafts((previous) => [
      ...previous,
      {
        name: `Activity ${previous.length + 1}`,
        description: "",
        preferred_time: "",
        time_label: "Any time",
        target_per_day: 1,
      },
    ]);
  }

  function removeActivity(index: number) {
    if (activityDrafts.length <= 1) {
      return;
    }

    setActivityDrafts((previous) =>
      previous.filter((_, activityIndex) => activityIndex !== index)
    );
  }

  async function loadTodayCompletions(planId: string) {
    setLoadingCompletions(true);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoadingCompletions(false);
      return;
    }

    const { data, error } = await supabase
      .from("regulation_completions")
      .select(
        "id, activity_id, completion_date, occurrence, completed_at"
      )
      .eq("user_id", user.id)
      .eq("plan_id", planId)
      .eq("completion_date", getLocalDateString())
      .order("completed_at", { ascending: true });

    if (error) {
      console.error("Could not load today's regulation completions:", error);
      setCompletionError("Today's activity progress could not be loaded.");
      setLoadingCompletions(false);
      return;
    }

    setTodayCompletions((data || []) as RegulationCompletion[]);
    setLoadingCompletions(false);
  }

  async function loadRegulationPlan() {
    setLoadingPlan(true);
    setPlanError("");
    setCompletionError("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setPlanError("Your self-regulation plan could not be loaded.");
      setLoadingPlan(false);
      return;
    }

    const { data: existingPlan, error: planLoadError } = await supabase
      .from("regulation_plans")
      .select("id, name, duration_days, start_date, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planLoadError) {
      console.error("Could not load regulation plan:", planLoadError);
      setPlanError("Your self-regulation plan could not be loaded.");
      setLoadingPlan(false);
      return;
    }

    if (!existingPlan) {
      setPlan(null);
      setActivities([]);
      setTodayCompletions([]);
      setActivityDrafts(defaultActivities);
      setShowPlanEditor(true);
      setLoadingPlan(false);
      return;
    }

    const typedPlan = existingPlan as RegulationPlan;
    setPlan(typedPlan);
    setPlanName(typedPlan.name);
    setDurationDays(typedPlan.duration_days);

    const { data: existingActivities, error: activityLoadError } = await supabase
      .from("regulation_activities")
      .select(
        "id, name, description, preferred_time, time_label, target_per_day, sort_order"
      )
      .eq("plan_id", typedPlan.id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (activityLoadError) {
      console.error("Could not load regulation activities:", activityLoadError);
      setPlanError("Your self-regulation activities could not be loaded.");
      setLoadingPlan(false);
      return;
    }

    const loadedActivities =
      (existingActivities || []) as RegulationActivity[];

    setActivities(loadedActivities);
    setActivityDrafts(
      loadedActivities.map((activity) => ({
        id: activity.id,
        name: activity.name,
        description: activity.description || "",
        preferred_time: activity.preferred_time
          ? activity.preferred_time.slice(0, 5)
          : "",
        time_label: activity.time_label,
        target_per_day: activity.target_per_day,
      }))
    );

    await loadTodayCompletions(typedPlan.id);
    setLoadingPlan(false);
  }

  useEffect(() => {
    void loadRegulationPlan();
  }, []);

  async function saveRegulationPlan() {
    if (savingPlan) {
      return;
    }

    setSavingPlan(true);
    setPlanError("");
    setPlanSuccess("");

    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to save a self-regulation plan.");
      }

      if (!planName.trim()) {
        throw new Error("Please enter a name for your plan.");
      }

      if (durationDays < 1 || durationDays > 365) {
        throw new Error("Duration must be between 1 and 365 days.");
      }

      if (activityDrafts.length < 1 || activityDrafts.length > 12) {
        throw new Error("Choose between 1 and 12 activities.");
      }

      for (const activity of activityDrafts) {
        if (!activity.name.trim()) {
          throw new Error("Every activity needs a name.");
        }

        if (
          activity.target_per_day < 1 ||
          activity.target_per_day > 12
        ) {
          throw new Error("Each daily target must be between 1 and 12.");
        }
      }

      let planId = plan?.id;

      if (planId) {
        const { error: updateError } = await supabase
          .from("regulation_plans")
          .update({
            name: planName.trim(),
            duration_days: durationDays,
            updated_at: new Date().toISOString(),
          })
          .eq("id", planId)
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        const retainedActivityIds = activityDrafts
          .map((activity) => activity.id)
          .filter((id): id is string => Boolean(id));

        const activitiesToDisable = activities
          .filter((activity) => !retainedActivityIds.includes(activity.id))
          .map((activity) => activity.id);

        if (activitiesToDisable.length > 0) {
          const { error: disableError } = await supabase
            .from("regulation_activities")
            .update({
              is_active: false,
              updated_at: new Date().toISOString(),
            })
            .in("id", activitiesToDisable)
            .eq("user_id", user.id);

          if (disableError) {
            throw disableError;
          }
        }

        for (let index = 0; index < activityDrafts.length; index += 1) {
          const activity = activityDrafts[index];
          const payload = {
            name: activity.name.trim(),
            description: activity.description.trim() || null,
            preferred_time: activity.preferred_time || null,
            time_label: activity.time_label.trim() || "Any time",
            target_per_day: activity.target_per_day,
            sort_order: index + 1,
            is_active: true,
            updated_at: new Date().toISOString(),
          };

          if (activity.id) {
            const { error: activityUpdateError } = await supabase
              .from("regulation_activities")
              .update(payload)
              .eq("id", activity.id)
              .eq("user_id", user.id);

            if (activityUpdateError) {
              throw activityUpdateError;
            }
          } else {
            const { error: activityCreateError } = await supabase
              .from("regulation_activities")
              .insert({
                ...payload,
                user_id: user.id,
                plan_id: planId,
              });

            if (activityCreateError) {
              throw activityCreateError;
            }
          }
        }
      } else {
        const { data: createdPlan, error: createPlanError } = await supabase
          .from("regulation_plans")
          .insert({
            user_id: user.id,
            name: planName.trim(),
            duration_days: durationDays,
            status: "active",
          })
          .select("id")
          .single();

        if (createPlanError) {
          throw createPlanError;
        }

        planId = createdPlan.id;

        const { error: activityCreateError } = await supabase
          .from("regulation_activities")
          .insert(
            activityDrafts.map((activity, index) => ({
              user_id: user.id,
              plan_id: planId,
              name: activity.name.trim(),
              description: activity.description.trim() || null,
              preferred_time: activity.preferred_time || null,
              time_label: activity.time_label.trim() || "Any time",
              target_per_day: activity.target_per_day,
              sort_order: index + 1,
              is_active: true,
            }))
          );

        if (activityCreateError) {
          throw activityCreateError;
        }
      }

      setPlanSuccess(plan ? "Self-regulation plan updated." : "Self-regulation plan started.");
      setShowPlanEditor(false);
      await loadRegulationPlan();
    } catch (error) {
      console.error("Saving regulation plan failed:", error);
      setPlanError(
        error instanceof Error
          ? error.message
          : "Your self-regulation plan could not be saved."
      );
    } finally {
      setSavingPlan(false);
    }
  }

  function completionsForActivity(activityId: string) {
    return todayCompletions.filter(
      (completion) => completion.activity_id === activityId
    );
  }

  async function completeActivity(activity: RegulationActivity) {
    if (!plan || savingActivityId) {
      return;
    }

    const existing = completionsForActivity(activity.id);
    const nextOccurrence = existing.length + 1;

    if (nextOccurrence > activity.target_per_day) {
      return;
    }

    setSavingActivityId(activity.id);
    setCompletionError("");
    setCompletionSuccess("");

    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to complete an activity.");
      }

      const { error } = await supabase.from("regulation_completions").insert({
        user_id: user.id,
        plan_id: plan.id,
        activity_id: activity.id,
        completion_date: getLocalDateString(),
        occurrence: nextOccurrence,
      });

      if (error) {
        throw error;
      }

      setCompletionSuccess(`${activity.name} completed.`);
      await loadTodayCompletions(plan.id);
    } catch (error) {
      console.error("Completing regulation activity failed:", error);
      setCompletionError(
        error instanceof Error
          ? error.message
          : "The activity could not be completed."
      );
    } finally {
      setSavingActivityId(null);
    }
  }

  async function undoLatestCompletion(activity: RegulationActivity) {
    if (!plan || savingActivityId) {
      return;
    }

    const existing = completionsForActivity(activity.id);
    const latest = [...existing].sort(
      (a, b) => b.occurrence - a.occurrence
    )[0];

    if (!latest) {
      return;
    }

    setSavingActivityId(activity.id);
    setCompletionError("");
    setCompletionSuccess("");

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("regulation_completions")
        .delete()
        .eq("id", latest.id);

      if (error) {
        throw error;
      }

      await loadTodayCompletions(plan.id);
    } catch (error) {
      console.error("Undoing regulation completion failed:", error);
      setCompletionError(
        error instanceof Error
          ? error.message
          : "The completion could not be undone."
      );
    } finally {
      setSavingActivityId(null);
    }
  }

  const planDay = (() => {
    if (!plan?.start_date) {
      return null;
    }

    const start = new Date(`${plan.start_date}T00:00:00`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const difference = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(1, difference + 1);
  })();

  const totalTargetToday = activities.reduce(
    (sum, activity) => sum + activity.target_per_day,
    0
  );
  const completedToday = todayCompletions.length;
  const todayPercentage =
    totalTargetToday > 0
      ? Math.min(100, Math.round((completedToday / totalTargetToday) * 100))
      : 0;
  const durationPercentage =
    plan && planDay
      ? Math.min(100, Math.round((planDay / plan.duration_days) * 100))
      : 0;

  if (loadingPlan) {
    return (
      <Panel title="Self-Regulation">
        <p className="text-sm text-slate-500">
          Loading your self-regulation plan...
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      {showPlanEditor && (
        <Panel
          title={plan ? "Manage self-regulation plan" : "Create self-regulation plan"}
          description="Build a personal routine with activities, preferred times, and daily targets."
        >
          <div className="space-y-7">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Plan name</span>
              <input
                type="text"
                value={planName}
                onChange={(event) => setPlanName(event.target.value)}
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Duration</span>
              <div className="mt-2 flex max-w-xs items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(event) => setDurationDays(Number(event.target.value))}
                  className="w-28 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />
                <span className="text-sm text-slate-500">days</span>
              </div>
            </label>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Activities</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Add the practices you want to include. Everything below is editable.
                  </p>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                  {activityDrafts.length} activities
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {activityDrafts.map((activity, index) => (
                  <div
                    key={activity.id || `new-activity-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-2">
                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Activity name
                        </span>
                        <input
                          type="text"
                          value={activity.name}
                          onChange={(event) =>
                            updateActivity(index, "name", event.target.value)
                          }
                          maxLength={100}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Time label
                        </span>
                        <input
                          type="text"
                          value={activity.time_label}
                          onChange={(event) =>
                            updateActivity(index, "time_label", event.target.value)
                          }
                          maxLength={50}
                          placeholder="Morning, after class, any time..."
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-xs font-medium text-slate-500">
                        Description (optional)
                      </span>
                      <input
                        type="text"
                        value={activity.description}
                        onChange={(event) =>
                          updateActivity(index, "description", event.target.value)
                        }
                        maxLength={300}
                        placeholder="What do you want to do?"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                      />
                    </label>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Preferred time (optional)
                        </span>
                        <input
                          type="time"
                          step="60"
                          value={activity.preferred_time}
                          onChange={(event) =>
                            updateActivity(index, "preferred_time", event.target.value)
                          }
                          className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-700"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Times per day
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={activity.target_per_day}
                          onChange={(event) =>
                            updateActivity(
                              index,
                              "target_per_day",
                              Math.max(1, Math.min(12, Number(event.target.value)))
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        disabled={activityDrafts.length <= 1}
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addActivity}
                disabled={activityDrafts.length >= 12}
                className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add activity
              </button>
            </div>

            {planError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{planError}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void saveRegulationPlan()}
                disabled={savingPlan}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPlan
                  ? "Saving..."
                  : plan
                    ? "Save changes"
                    : "Start plan"}
              </button>

              {plan && (
                <button
                  type="button"
                  onClick={() => {
                    setPlanError("");
                    setShowPlanEditor(false);
                  }}
                  disabled={savingPlan}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </Panel>
      )}

      {plan && !showPlanEditor && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Active self-regulation plan
              </p>
              <h2 className="mt-1 text-xl font-semibold">{plan.name}</h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setPlanSuccess("");
                setPlanError("");
                setShowPlanEditor(true);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Manage plan
            </button>
          </div>

          {planSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-700">{planSuccess}</p>
            </div>
          )}

          {completionSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-700">{completionSuccess}</p>
            </div>
          )}

          {completionError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{completionError}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Plan day"
              value={
                planDay
                  ? `Day ${Math.min(planDay, plan.duration_days)}`
                  : "Active"
              }
              detail={`${plan.duration_days}-day plan`}
            />
            <StatCard
              label="Activities"
              value={`${activities.length}`}
              detail="Active activities"
            />
            <StatCard
              label="Today's completion"
              value={loadingCompletions ? "..." : `${todayPercentage}%`}
              detail={`${completedToday} of ${totalTargetToday} completed`}
            />
            <StatCard
              label="Plan timeline"
              value={`${durationPercentage}%`}
              detail="Based on days elapsed"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
            <Panel
              title="Today's activities"
              description="Complete activities as you do them. You can undo the latest completion if you tap one by mistake."
            >
              {activities.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {activities.map((activity) => {
                    const activityCompletions = completionsForActivity(activity.id);
                    const completedCount = activityCompletions.length;
                    const isDone = completedCount >= activity.target_per_day;
                    const isSaving = savingActivityId === activity.id;

                    return (
                      <div
                        key={activity.id}
                        className="py-5 first:pt-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{activity.name}</p>
                              {isDone && (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  Done
                                </span>
                              )}
                            </div>

                            {activity.description && (
                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                {activity.description}
                              </p>
                            )}

                            <p className="mt-2 text-xs text-slate-400">
                              {activity.time_label}
                              {activity.preferred_time
                                ? ` · ${activity.preferred_time.slice(0, 5)}`
                                : ""}
                              {` · ${completedCount} / ${activity.target_per_day} today`}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {completedCount > 0 && (
                              <button
                                type="button"
                                onClick={() => void undoLatestCompletion(activity)}
                                disabled={isSaving}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                              >
                                Undo
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => void completeActivity(activity)}
                              disabled={isDone || isSaving}
                              className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {isSaving
                                ? "Saving..."
                                : isDone
                                  ? "Completed"
                                  : "Complete"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <ProgressBar
                            label="Daily target"
                            value={Math.min(
                              100,
                              Math.round(
                                (completedCount / activity.target_per_day) * 100
                              )
                            )}
                            text={`${completedCount} of ${activity.target_per_day}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No active activities.</p>
              )}
            </Panel>

            <Panel title="Plan progress">
              <div className="space-y-5">
                <ProgressBar
                  label="Today's activities"
                  value={todayPercentage}
                  text={`${completedToday} of ${totalTargetToday}`}
                />
                <ProgressBar
                  label="Plan timeline"
                  value={durationPercentage}
                  text={
                    planDay
                      ? `Day ${Math.min(planDay, plan.duration_days)} of ${plan.duration_days}`
                      : `${plan.duration_days} days`
                  }
                />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-500">
                  Activity completion reflects what you record in PsyLattice. It
                  is a personal tracking aid, not a measure of treatment response
                  or a clinical outcome.
                </p>
              </div>
            </Panel>
          </div>

          <Panel title="AI-assisted adaptation">
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
              <p className="font-medium">Adjust the routine, not a diagnosis.</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                The AI Guide can later help you reflect on your routine and
                preferences, but it will not diagnose conditions or prescribe
                treatment from these completion records.
              </p>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

/* =========================================================
   PROGRESS
   ========================================================= */

function Progress() {
  type ProgressV2Item = {
    item_id?: string;
    key: string;
    type: string;
    prompt: string;
    config: Record<string, any>;
  };

  type ProgressV2Schedule = {
    schedule_id?: string;
    key: string;
    label: string;
    start_time: string;
    end_time: string;
    items: ProgressV2Item[];
  };

  type ProgressMonitoringPlan = {
    plan_id: string;
    plan_name: string;
    duration_days: number;
    start_date: string;
    protocol: ProgressV2Schedule[];
  };

  type ProgressMonitoringCheckin = {
    checkin_id: string;
    plan_id: string;
    schedule_id: string;
    schedule_label: string;
    entry_date: string;
    completed_at: string;
    responses: Array<{
      item_id: string;
      item_key: string;
      type: string;
      prompt: string;
      response: any;
    }>;
  };

  type ProgressRegulationPlan = {
    id: string;
    name: string;
    duration_days: number;
    start_date: string;
    status: string;
  };

  type ProgressRegulationActivity = {
    id: string;
    target_per_day: number;
  };

  type ProgressRegulationCompletion = {
    id: string;
    activity_id: string;
    completion_date: string;
    occurrence: number;
    completed_at: string;
  };

  const [rangeDays, setRangeDays] =
    useState<7 | 14 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] =
    useState("");

  const [monitoringPlan, setMonitoringPlan] =
    useState<ProgressMonitoringPlan | null>(
      null
    );
  const [
    monitoringCheckins,
    setMonitoringCheckins,
  ] = useState<ProgressMonitoringCheckin[]>(
    []
  );

  const [regulationPlan, setRegulationPlan] =
    useState<ProgressRegulationPlan | null>(
      null
    );
  const [
    regulationActivities,
    setRegulationActivities,
  ] = useState<ProgressRegulationActivity[]>(
    []
  );
  const [
    regulationCompletions,
    setRegulationCompletions,
  ] = useState<
    ProgressRegulationCompletion[]
  >([]);

  function toLocalDateString(date: Date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(
        2,
        "0"
      ),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function parseLocalDate(dateString: string) {
    return new Date(
      `${dateString}T00:00:00`
    );
  }

  function addDays(date: Date, amount: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function buildDateRange(days: number) {
    const today = new Date();
    const localToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return Array.from(
      {
        length: days,
      },
      (_, index) => {
        const daysAgo =
          days - 1 - index;
        return toLocalDateString(
          addDays(localToday, -daysAgo)
        );
      }
    );
  }

  function formatHistoryDate(
    dateString: string
  ) {
    return parseLocalDate(
      dateString
    ).toLocaleDateString([], {
      day: "2-digit",
      month: "short",
    });
  }

  function dateFallsWithinPlan(
    dateString: string,
    startDate: string,
    durationDays: number
  ) {
    const date = parseLocalDate(dateString);
    const start = parseLocalDate(startDate);
    const end = addDays(
      start,
      durationDays - 1
    );

    return date >= start && date <= end;
  }

  function itemConfigMap(
    plan: ProgressMonitoringPlan | null
  ) {
    const map = new Map<
      string,
      {
        type: string;
        prompt: string;
        config: Record<string, any>;
      }
    >();

    for (const schedule of
      plan?.protocol || []) {
      for (const item of
        schedule.items || []) {
        map.set(item.key, {
          type: item.type,
          prompt: item.prompt,
          config: item.config || {},
        });
      }
    }

    return map;
  }

  function normaliseToTen(
    response: any,
    config: Record<string, any>
  ) {
    const value = Number(response);

    if (!Number.isFinite(value)) {
      return null;
    }

    const min = Number(config.min);
    const max = Number(config.max);

    if (
      Number.isFinite(min) &&
      Number.isFinite(max) &&
      max > min
    ) {
      return Math.max(
        0,
        Math.min(
          10,
          ((value - min) /
            (max - min)) *
            10
        )
      );
    }

    return value >= 0 && value <= 10
      ? value
      : null;
  }

  function scoreSeries(
    checkins: ProgressMonitoringCheckin[],
    plan: ProgressMonitoringPlan | null
  ) {
    const map = itemConfigMap(plan);
    const stressValues: number[] = [];
    const sliderValues: number[] = [];

    for (const checkin of checkins) {
      for (const response of
        checkin.responses || []) {
        const item = map.get(
          response.item_key
        );

        if (!item) {
          continue;
        }

        const value = normaliseToTen(
          response.response,
          item.config
        );

        if (value === null) {
          continue;
        }

        if (
          (item.type === "slider" ||
            item.type === "number") &&
          item.prompt
            .toLowerCase()
            .includes("stress")
        ) {
          stressValues.push(value);
        }

        if (item.type === "slider") {
          sliderValues.push(value);
        }
      }
    }

    if (stressValues.length > 0) {
      return {
        kind: "stress" as const,
        values: stressValues,
      };
    }

    if (sliderValues.length > 0) {
      return {
        kind: "rating" as const,
        values: sliderValues,
      };
    }

    return {
      kind: "none" as const,
      values: [] as number[],
    };
  }

  async function loadProgress(
    showLoading = true
  ) {
    if (showLoading) {
      setLoading(true);
    }

    setProgressError("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setProgressError(
        "Your progress data could not be loaded."
      );
      setLoading(false);
      return;
    }

    const dates = buildDateRange(rangeDays);
    const rangeStart = dates[0];
    const rangeEnd =
      dates[dates.length - 1];

    const [
      monitoringPlanResult,
      monitoringCheckinsResult,
      regulationPlanResult,
    ] = await Promise.all([
      supabase.rpc(
        "psylattice_my_monitoring_protocol_v2"
      ),
      supabase.rpc(
        "psylattice_my_monitoring_checkins_v2",
        {
          p_days: rangeDays,
        }
      ),
      supabase
        .from("regulation_plans")
        .select(
          "id, name, duration_days, start_date, status"
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle(),
    ]);

    if (monitoringPlanResult.error) {
      console.error(
        "Could not load V2 progress monitoring plan:",
        monitoringPlanResult.error
      );
      setProgressError(
        "Your monitoring progress could not be loaded."
      );
      setLoading(false);
      return;
    }

    if (monitoringCheckinsResult.error) {
      console.error(
        "Could not load V2 progress check-ins:",
        monitoringCheckinsResult.error
      );
      setProgressError(
        "Your monitoring history could not be loaded."
      );
      setLoading(false);
      return;
    }

    if (regulationPlanResult.error) {
      console.error(
        "Could not load progress regulation plan:",
        regulationPlanResult.error
      );
      setProgressError(
        "Your self-regulation progress could not be loaded."
      );
      setLoading(false);
      return;
    }

    const typedMonitoringPlan =
      Array.isArray(
        monitoringPlanResult.data
      ) &&
      monitoringPlanResult.data.length > 0
        ? (monitoringPlanResult.data[0] as ProgressMonitoringPlan)
        : null;

    const typedRegulationPlan =
      regulationPlanResult.data
        ? (regulationPlanResult.data as ProgressRegulationPlan)
        : null;

    setMonitoringPlan(
      typedMonitoringPlan
    );
    setRegulationPlan(
      typedRegulationPlan
    );

    setMonitoringCheckins(
      (
        (monitoringCheckinsResult.data ??
          []) as ProgressMonitoringCheckin[]
      ).filter(
        (checkin) =>
          (!typedMonitoringPlan ||
            checkin.plan_id ===
              typedMonitoringPlan.plan_id) &&
          checkin.entry_date >= rangeStart &&
          checkin.entry_date <= rangeEnd
      )
    );

    const regulationActivitiesPromise =
      typedRegulationPlan
        ? supabase
            .from(
              "regulation_activities"
            )
            .select(
              "id, target_per_day"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "plan_id",
              typedRegulationPlan.id
            )
            .eq("is_active", true)
        : Promise.resolve({
            data: [],
            error: null,
          });

    const regulationCompletionsPromise =
      typedRegulationPlan
        ? supabase
            .from(
              "regulation_completions"
            )
            .select(
              "id, activity_id, completion_date, occurrence, completed_at"
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "plan_id",
              typedRegulationPlan.id
            )
            .gte(
              "completion_date",
              rangeStart
            )
            .lte(
              "completion_date",
              rangeEnd
            )
            .order(
              "completion_date",
              {
                ascending: true,
              }
            )
            .order("completed_at", {
              ascending: true,
            })
        : Promise.resolve({
            data: [],
            error: null,
          });

    const [
      regulationActivitiesResult,
      regulationCompletionsResult,
    ] = await Promise.all([
      regulationActivitiesPromise,
      regulationCompletionsPromise,
    ]);

    if (
      regulationActivitiesResult.error
    ) {
      console.error(
        "Could not load regulation progress activities:",
        regulationActivitiesResult.error
      );
      setProgressError(
        "Your self-regulation activities could not be loaded."
      );
      setLoading(false);
      return;
    }

    if (
      regulationCompletionsResult.error
    ) {
      console.error(
        "Could not load regulation progress completions:",
        regulationCompletionsResult.error
      );
      setProgressError(
        "Your self-regulation history could not be loaded."
      );
      setLoading(false);
      return;
    }

    setRegulationActivities(
      (regulationActivitiesResult.data ||
        []) as ProgressRegulationActivity[]
    );
    setRegulationCompletions(
      (regulationCompletionsResult.data ||
        []) as ProgressRegulationCompletion[]
    );

    setLoading(false);
  }

  useEffect(() => {
    void loadProgress(true);

    function refreshProgress() {
      void loadProgress(false);
    }

    function refreshWhenVisible() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadProgress(false);
      }
    }

    window.addEventListener(
      "focus",
      refreshProgress
    );
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshProgress
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const selectedDates =
    buildDateRange(rangeDays);

  const schedulesPerDay =
    monitoringPlan?.protocol.filter(
      (schedule: any) =>
        schedule.trigger_type !== "event_contingent" &&
        schedule.trigger_type !== "participant_initiated"
    ).length || 0;

  const eventScheduleCount =
    monitoringPlan?.protocol.filter(
      (schedule: any) =>
        schedule.trigger_type === "event_contingent" ||
        schedule.trigger_type === "participant_initiated"
    ).length || 0;

  const monitoringRelevantDates =
    monitoringPlan
      ? selectedDates.filter((date) =>
          dateFallsWithinPlan(
            date,
            monitoringPlan.start_date,
            monitoringPlan.duration_days
          )
        )
      : [];

  const monitoringExpected =
    monitoringRelevantDates.length *
    schedulesPerDay;

  const scheduledMonitoringCheckins =
    monitoringCheckins.filter(
      (checkin: any) =>
        checkin.trigger_type !== "event_contingent" &&
        checkin.trigger_type !== "participant_initiated"
    );

  const eventMonitoringCheckins =
    monitoringCheckins.filter(
      (checkin: any) =>
        checkin.trigger_type === "event_contingent" ||
        checkin.trigger_type === "participant_initiated"
    );

  const monitoringCompleted =
    scheduledMonitoringCheckins.length;

  const monitoringConsistency =
    monitoringExpected > 0
      ? Math.min(
          100,
          Math.round(
            (monitoringCompleted /
              monitoringExpected) *
              100
          )
        )
      : 0;

  const overallScore = scoreSeries(
    monitoringCheckins,
    monitoringPlan
  );

  const averageScore =
    overallScore.values.length > 0
      ? (
          overallScore.values.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          overallScore.values.length
        ).toFixed(1)
      : null;

  const scoreProgressValue =
    averageScore !== null
      ? Math.min(
          100,
          Math.round(
            Number(averageScore) * 10
          )
        )
      : 0;

  const scoreLabel =
    overallScore.kind === "stress"
      ? "Average stress"
      : "Average rating";

  const regulationTargetPerDay =
    regulationActivities.reduce(
      (sum, activity) =>
        sum + activity.target_per_day,
      0
    );

  const regulationRelevantDates =
    regulationPlan
      ? selectedDates.filter((date) =>
          dateFallsWithinPlan(
            date,
            regulationPlan.start_date,
            regulationPlan.duration_days
          )
        )
      : [];

  const regulationExpected =
    regulationRelevantDates.length *
    regulationTargetPerDay;

  const regulationCompleted =
    regulationCompletions.length;

  const regulationConsistency =
    regulationExpected > 0
      ? Math.min(
          100,
          Math.round(
            (regulationCompleted /
              regulationExpected) *
              100
          )
        )
      : 0;

  const monitoringPlanDay = (() => {
    if (!monitoringPlan) {
      return null;
    }

    const start = parseLocalDate(
      monitoringPlan.start_date
    );
    const todayString =
      toLocalDateString(new Date());
    const today =
      parseLocalDate(todayString);

    const difference = Math.floor(
      (today.getTime() -
        start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return Math.min(
      monitoringPlan.duration_days,
      Math.max(1, difference + 1)
    );
  })();

  const regulationPlanDay = (() => {
    if (!regulationPlan) {
      return null;
    }

    const start = parseLocalDate(
      regulationPlan.start_date
    );
    const todayString =
      toLocalDateString(new Date());
    const today =
      parseLocalDate(todayString);

    const difference = Math.floor(
      (today.getTime() -
        start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return Math.min(
      regulationPlan.duration_days,
      Math.max(1, difference + 1)
    );
  })();

  const monitoringHistory = [
    ...selectedDates,
  ]
    .reverse()
    .map((date) => {
      const checkins =
        monitoringCheckins.filter(
          (checkin) =>
            checkin.entry_date === date
        );

      const scheduledCheckins =
        checkins.filter(
          (checkin: any) =>
            checkin.trigger_type !== "event_contingent" &&
            checkin.trigger_type !== "participant_initiated"
        );

      const eventCheckins =
        checkins.filter(
          (checkin: any) =>
            checkin.trigger_type === "event_contingent" ||
            checkin.trigger_type === "participant_initiated"
        );

      const expected =
        monitoringPlan &&
        dateFallsWithinPlan(
          date,
          monitoringPlan.start_date,
          monitoringPlan.duration_days
        )
          ? schedulesPerDay
          : 0;

      const dailyScore = scoreSeries(
        checkins,
        monitoringPlan
      );

      const dayAverage =
        dailyScore.values.length > 0
          ? (
              dailyScore.values.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              dailyScore.values.length
            ).toFixed(1)
          : null;

      return {
        date,
        completed: scheduledCheckins.length,
        eventCompleted: eventCheckins.length,
        expected,
        average: dayAverage,
        kind: dailyScore.kind,
      };
    })
    .filter(
      (day) =>
        day.expected > 0 ||
        day.completed > 0
    );

  const regulationHistory = [
    ...selectedDates,
  ]
    .reverse()
    .map((date) => {
      const completions =
        regulationCompletions.filter(
          (completion) =>
            completion.completion_date ===
            date
        );

      const expected =
        regulationPlan &&
        dateFallsWithinPlan(
          date,
          regulationPlan.start_date,
          regulationPlan.duration_days
        )
          ? regulationTargetPerDay
          : 0;

      return {
        date,
        completed: completions.length,
        expected,
      };
    })
    .filter(
      (day) =>
        day.expected > 0 ||
        day.completed > 0
    );

  const monitoringDaysWithData =
    monitoringHistory.filter(
      (day) => day.average !== null
    );

  const highestScoreDay =
    monitoringDaysWithData.length > 0
      ? monitoringDaysWithData.reduce(
          (highest, day) =>
            Number(day.average) >
            Number(highest.average)
              ? day
              : highest
        )
      : null;

  const lowestScoreDay =
    monitoringDaysWithData.length > 0
      ? monitoringDaysWithData.reduce(
          (lowest, day) =>
            Number(day.average) <
            Number(lowest.average)
              ? day
              : lowest
        )
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
            Real progress
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Calculated from your Monitoring V2
            check-ins and Self-Regulation records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void loadProgress(true)
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh progress
          </button>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            {([7, 14, 30] as const).map(
              (days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() =>
                    setRangeDays(days)
                  }
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    rangeDays === days
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {days} days
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {progressError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">
            {progressError}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Check-ins completed"
          value={
            loading
              ? "..."
              : monitoringPlan
                ? `${monitoringCompleted} / ${monitoringExpected}`
                : "Not set"
          }
          detail={`Selected ${rangeDays}-day range`}
        />

        <StatCard
          label={scoreLabel}
          value={
            loading
              ? "..."
              : averageScore
                ? `${averageScore} / 10`
                : "No data"
          }
          detail={
            overallScore.kind === "stress"
              ? "Across saved V2 stress responses"
              : overallScore.kind === "rating"
                ? "Across saved V2 slider responses"
                : "No numeric slider response in this range"
          }
        />

        <StatCard
          label="Monitoring consistency"
          value={
            loading
              ? "..."
              : monitoringPlan
                ? `${monitoringConsistency}%`
                : "—"
          }
          detail={
            monitoringPlan
              ? `${schedulesPerDay} scheduled / day · ${eventMonitoringCheckins.length} event reports in range`
              : "No active monitoring plan"
          }
        />

        <StatCard
          label="Regulation consistency"
          value={
            loading
              ? "..."
              : regulationPlan
                ? `${regulationConsistency}%`
                : "—"
          }
          detail={
            regulationPlan
              ? `${regulationCompleted} of ${regulationExpected} activities`
              : "No active self-regulation plan"
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Monitoring progress"
          description={
            monitoringPlan
              ? monitoringPlan.plan_name
              : "Daily Monitoring has not been started."
          }
        >
          {loading ? (
            <p className="text-sm text-slate-500">
              Loading monitoring progress...
            </p>
          ) : monitoringPlan ? (
            <div className="space-y-6">
              <ProgressBar
                label="Check-in consistency"
                value={
                  monitoringConsistency
                }
                text={`${monitoringCompleted} / ${monitoringExpected}`}
              />

              <ProgressBar
                label={scoreLabel}
                value={
                  scoreProgressValue
                }
                text={
                  averageScore
                    ? `${averageScore} / 10`
                    : "No rating data"
                }
              />

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Current monitoring plan
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {monitoringPlanDay
                        ? `Day ${monitoringPlanDay} of ${monitoringPlan.duration_days}`
                        : `${monitoringPlan.duration_days}-day plan`}
                    </p>
                  </div>

                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                    {schedulesPerDay} / day
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              Create a Daily Monitoring plan
              and complete check-ins to see
              monitoring progress here.
            </p>
          )}
        </Panel>

        <Panel
          title="Self-regulation progress"
          description={
            regulationPlan
              ? regulationPlan.name
              : "Self-Regulation has not been started."
          }
        >
          {loading ? (
            <p className="text-sm text-slate-500">
              Loading self-regulation progress...
            </p>
          ) : regulationPlan ? (
            <div className="space-y-6">
              <ProgressBar
                label="Activity consistency"
                value={
                  regulationConsistency
                }
                text={`${regulationCompleted} / ${regulationExpected}`}
              />

              <ProgressBar
                label="Plan timeline"
                value={
                  regulationPlanDay
                    ? Math.min(
                        100,
                        Math.round(
                          (regulationPlanDay /
                            regulationPlan.duration_days) *
                            100
                        )
                      )
                    : 0
                }
                text={
                  regulationPlanDay
                    ? `Day ${regulationPlanDay} of ${regulationPlan.duration_days}`
                    : `${regulationPlan.duration_days} days`
                }
              />

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Daily activity target
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Across your active
                      self-regulation activities.
                    </p>
                  </div>

                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                    {regulationTargetPerDay} / day
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              Create a Self-Regulation plan
              and complete activities to see
              regulation progress here.
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Monitoring history"
          description={`Daily V2 check-in completion and available rating summaries for the last ${rangeDays} days.`}
        >
          {loading ? (
            <p className="text-sm text-slate-500">
              Loading history...
            </p>
          ) : monitoringHistory.length >
            0 ? (
            <div className="divide-y divide-slate-100">
              {monitoringHistory.map(
                (day) => {
                  const percentage =
                    day.expected > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (day.completed /
                              day.expected) *
                              100
                          )
                        )
                      : 0;

                  return (
                    <div
                      key={day.date}
                      className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[90px_1fr_auto] sm:items-center"
                    >
                      <p className="text-sm font-medium">
                        {formatHistoryDate(
                          day.date
                        )}
                      </p>

                      <div>
                        <p className="text-sm text-slate-600">
                          {day.completed} /{" "}
                          {day.expected}{" "}
                          scheduled check-ins
                          {day.eventCompleted > 0
                            ? ` · ${day.eventCompleted} event report${
                                day.eventCompleted === 1 ? "" : "s"
                              }`
                            : ""}
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-cyan-700"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span className="text-xs font-medium text-slate-500">
                        {day.average
                          ? `${
                              day.kind ===
                              "stress"
                                ? "Stress"
                                : "Avg"
                            } ${
                              day.average
                            } / 10`
                          : day.completed > 0
                            ? "Completed"
                            : "No rating data"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              No monitoring records are
              available in this range yet.
            </p>
          )}
        </Panel>

        <Panel
          title="Self-regulation history"
          description={`Daily activity completion for the last ${rangeDays} days.`}
        >
          {loading ? (
            <p className="text-sm text-slate-500">
              Loading history...
            </p>
          ) : regulationHistory.length >
            0 ? (
            <div className="divide-y divide-slate-100">
              {regulationHistory.map(
                (day) => {
                  const percentage =
                    day.expected > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (day.completed /
                              day.expected) *
                              100
                          )
                        )
                      : 0;

                  return (
                    <div
                      key={day.date}
                      className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[90px_1fr_auto] sm:items-center"
                    >
                      <p className="text-sm font-medium">
                        {formatHistoryDate(
                          day.date
                        )}
                      </p>

                      <div>
                        <p className="text-sm text-slate-600">
                          {day.completed} /{" "}
                          {day.expected}{" "}
                          activities
                        </p>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-cyan-700"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span className="text-xs font-medium text-slate-500">
                        {percentage}%
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              No self-regulation records are
              available in this range yet.
            </p>
          )}
        </Panel>
      </div>

      <Panel title="Patterns to inspect">
        {!loading &&
        highestScoreDay &&
        lowestScoreDay &&
        monitoringDaysWithData.length >=
          2 ? (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <div className="flex items-start gap-4">
              <Icon>↗</Icon>

              <div>
                <p className="font-medium">
                  Descriptive monitoring summary
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Within this {rangeDays}-day
                  view, the highest daily average{" "}
                  {overallScore.kind ===
                  "stress"
                    ? "stress "
                    : "slider rating "}
                  recorded was{" "}
                  {highestScoreDay.average}/10
                  on{" "}
                  {formatHistoryDate(
                    highestScoreDay.date
                  )}
                  , while the lowest was{" "}
                  {lowestScoreDay.average}/10
                  on{" "}
                  {formatHistoryDate(
                    lowestScoreDay.date
                  )}
                  . These values are calculated
                  from the Monitoring V2
                  responses saved in your
                  account.
                </p>
              </div>
            </div>
          </div>
        ) : monitoringCompleted > 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">
              Check-in progress is being recorded
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You have {monitoringCompleted} V2
              check-in
              {monitoringCompleted === 1
                ? ""
                : "s"}{" "}
              in this range. Complete check-ins
              on at least two days with numeric
              slider responses to see a
              descriptive rating comparison.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">
              More data is needed
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete Daily Monitoring
              check-ins and your Progress tab
              will update from the same V2
              records.
            </p>
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Progress summaries are based on the
          records stored in your PsyLattice
          account. They are intended for
          personal reflection and do not provide
          diagnosis or establish causation.
        </p>
      </Panel>
    </div>
  );
}

/* =========================================================
   WEARABLES
   ========================================================= */

function Wearables() {
  return (
    <div className="space-y-5">
      <Panel
        title="Connected wearable data"
        description="Wearable information provides additional context to your self-reports."
      >
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-500">
            You control which signals PsyLattice can use. Wearable data does
            not independently determine your psychological state.
          </p>
        </div>

        <div className="mt-5 divide-y divide-slate-100">
          {[
            ["Sleep", "Duration and timing summaries", "Connected"],
            ["Activity", "Steps and activity summaries", "Connected"],
            ["Resting heart rate", "Daily summary", "Connected"],
            ["Heart-rate variability", "Not currently shared", "Off"],
          ].map(([name, description, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  status === "Connected"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Today's signals">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Sleep" value="6h 42m" detail="Last night" />
            <StatCard label="Activity" value="6,820" detail="Steps today" />
          </div>
        </Panel>

        <Panel title="How PsyLattice uses them">
          <div className="space-y-5">
            {[
              [
                "Context",
                "Compare self-reported experiences with authorised daily signals.",
              ],
              [
                "Reflection",
                "Help you inspect recurring patterns across time.",
              ],
              [
                "Reminders",
                "Potentially time nudges around routines you explicitly enable.",
              ],
              [
                "Therapist summary",
                "Include selected summaries only when you choose.",
              ],
            ].map(([title, description]) => (
              <div key={title}>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function Notifications({
  onInvitationCountChange,
  onNavigate,
}: {
  onInvitationCountChange: (count: number) => void;
  onNavigate: (
    targetScreen: string,
    targetParams: UnifiedNotificationTargetParams
  ) => void | Promise<void>;
}) {
  return (
    <div className="space-y-5">
      {/* Invitation decisions remain explicit actions. Marking a notification
          as read never accepts or declines a clinician connection. */}
      <ClinicianInvitations
        onCountChange={onInvitationCountChange}
      />

      <UnifiedNotificationsCenter
        workspace="self"
        onNavigate={onNavigate}
      />
    </div>
  );
}

/* =========================================================
   PRIVACY
   ========================================================= */

type SharingPermissionKey =
  | "share_assessments"
  | "share_monitoring"
  | "share_progress"
  | "share_wearables"
  | "share_regulation";

type ConnectedClinicianPermission = {
  connection_id: string;
  clinician_id: string;
  clinician_name: string;
  clinician_email: string;
  connected_at: string;
  share_assessments: boolean;
  share_monitoring: boolean;
  share_progress: boolean;
  share_wearables: boolean;
  share_regulation: boolean;
  permissions_updated_at: string | null;
};

const sharingPermissionDefinitions: Array<{
  key: SharingPermissionKey;
  title: string;
  description: string;
}> = [
  {
    key: "share_assessments",
    title: "Self-assessment results",
    description:
      "Allow this clinician to access assessment results you choose to keep in PsyLattice.",
  },
  {
    key: "share_monitoring",
    title: "Daily monitoring",
    description:
      "Allow access to your daily check-ins and ambulatory monitoring entries.",
  },
  {
    key: "share_progress",
    title: "Progress & trends",
    description:
      "Allow access to longitudinal summaries and progress views derived from shared data.",
  },
  {
    key: "share_wearables",
    title: "Wearable summaries",
    description:
      "Allow access to authorised wearable summaries when wearable data is connected.",
  },
  {
    key: "share_regulation",
    title: "Self-regulation progress",
    description:
      "Allow access to progress from your self-regulation plans and completed activities.",
  },
];

function Privacy() {
  const [clinicians, setClinicians] = useState<
    ConnectedClinicianPermission[]
  >([]);
  const [loadingClinicians, setLoadingClinicians] = useState(true);
  const [sharingError, setSharingError] = useState("");
  const [savingConnectionId, setSavingConnectionId] = useState<
    string | null
  >(null);
  const [savedConnectionId, setSavedConnectionId] = useState<
    string | null
  >(null);
  const [removingConnectionId, setRemovingConnectionId] = useState<
    string | null
  >(null);
  const [connectionMessage, setConnectionMessage] = useState("");

  async function loadClinicianSharing(
    showLoading = true
  ) {
    if (showLoading) {
      setLoadingClinicians(true);
    }

    setSharingError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_my_clinicians_and_permissions_v2"
    );

    if (error) {
      console.error(
        "Could not load clinician sharing permissions:",
        error
      );

      setSharingError(
        "Your clinician sharing settings could not be loaded."
      );
      setLoadingClinicians(false);
      return;
    }

    setClinicians(
      (data ?? []) as ConnectedClinicianPermission[]
    );
    setLoadingClinicians(false);
  }

  useEffect(() => {
    void loadClinicianSharing(true);

    function refreshOnFocus() {
      void loadClinicianSharing(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadClinicianSharing(false);
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, []);

  async function updatePermission(
    clinician: ConnectedClinicianPermission,
    key: SharingPermissionKey,
    enabled: boolean
  ) {
    if (savingConnectionId) {
      return;
    }

    setSharingError("");
    setSavedConnectionId(null);
    setSavingConnectionId(clinician.connection_id);

    const previousClinician = clinician;
    const updatedClinician: ConnectedClinicianPermission = {
      ...clinician,
      [key]: enabled,
    };

    setClinicians((current) =>
      current.map((item) =>
        item.connection_id === clinician.connection_id
          ? updatedClinician
          : item
      )
    );

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_set_clinician_permissions",
      {
        p_connection_id: clinician.connection_id,
        p_share_assessments:
          updatedClinician.share_assessments,
        p_share_monitoring:
          updatedClinician.share_monitoring,
        p_share_progress:
          updatedClinician.share_progress,
        p_share_wearables:
          updatedClinician.share_wearables,
        p_share_regulation:
          updatedClinician.share_regulation,
      }
    );

    if (error) {
      console.error(
        "Could not update clinician sharing permission:",
        error
      );

      setClinicians((current) =>
        current.map((item) =>
          item.connection_id ===
          previousClinician.connection_id
            ? previousClinician
            : item
        )
      );

      setSharingError(
        "That sharing preference could not be saved. Please try again."
      );
      setSavingConnectionId(null);
      return;
    }

    const savedAt = new Date().toISOString();

    setClinicians((current) =>
      current.map((item) =>
        item.connection_id === clinician.connection_id
          ? {
              ...item,
              permissions_updated_at: savedAt,
            }
          : item
      )
    );

    setSavingConnectionId(null);
    setSavedConnectionId(clinician.connection_id);

    // Re-read the authoritative row after every change. This keeps
    // this card tied to the exact clinician connection that was edited.
    void loadClinicianSharing(false);

    window.setTimeout(() => {
      setSavedConnectionId((current) =>
        current === clinician.connection_id
          ? null
          : current
      );
    }, 2200);
  }

  async function removeClinician(
    clinician: ConnectedClinicianPermission
  ) {
    if (removingConnectionId || savingConnectionId) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${clinician.clinician_name} from your PsyLattice account?\n\nThis ends the clinician connection and immediately removes their access through PsyLattice sharing permissions. Your personal data is not deleted.`
    );

    if (!confirmed) {
      return;
    }

    setSharingError("");
    setConnectionMessage("");
    setRemovingConnectionId(clinician.connection_id);

    const supabase = createClient();

    const { error } = await supabase.rpc(
      "psylattice_end_connection_as_client",
      {
        p_connection_id: clinician.connection_id,
      }
    );

    if (error) {
      console.error(
        "Could not remove clinician connection:",
        error
      );

      setSharingError(
        "The clinician connection could not be removed. Please try again."
      );
      setRemovingConnectionId(null);
      return;
    }

    setClinicians((current) =>
      current.filter(
        (item) =>
          item.connection_id !== clinician.connection_id
      )
    );

    setRemovingConnectionId(null);
    setConnectionMessage(
      `${clinician.clinician_name} has been removed. Their PsyLattice access through this connection has ended.`
    );

    void loadClinicianSharing(false);
  }

  return (
    <div className="space-y-5">
      <Panel title="Your privacy">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Self-assessment data",
              "Private unless you explicitly share it with a connected clinician.",
              "You control it",
            ],
            [
              "Luna AI conversations",
              "Your private AI conversation history is not available to connected clinicians.",
              "Always private",
            ],
            [
              "Clinician connections",
              clinicians.length === 0
                ? "No clinicians are currently connected."
                : `${clinicians.length} active clinician ${
                    clinicians.length === 1
                      ? "connection"
                      : "connections"
                  }.`,
              clinicians.length === 0
                ? "None"
                : `${clinicians.length} connected`,
            ],
            [
              "Sharing model",
              "Accepting a connection does not automatically share your PsyLattice information.",
              "Off by default",
            ],
          ].map(([title, description, status]) => (
            <div
              key={title}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {description}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {status}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Clinician sharing"
        description="Choose exactly what each connected clinician can access. Changes are saved immediately."
      >
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            disabled={loadingClinicians}
            onClick={() => void loadClinicianSharing(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Refresh clinician connections
          </button>
        </div>

        {connectionMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {connectionMessage}
          </div>
        )}

        {sharingError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {sharingError}
          </div>
        )}

        {loadingClinicians ? (
          <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Loading clinician connections...
            </p>
          </div>
        ) : clinicians.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-800">
              C
            </div>

            <p className="mt-4 font-semibold text-slate-800">
              No connected clinicians
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              When you accept a clinician connection request,
              that clinician will appear here. Nothing is shared
              automatically when a connection is created.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {clinicians.map((clinician) => {
              const saving =
                savingConnectionId ===
                clinician.connection_id;

              const removing =
                removingConnectionId ===
                clinician.connection_id;

              const hasSharedInformation =
                clinician.share_assessments ||
                clinician.share_monitoring ||
                clinician.share_progress ||
                clinician.share_wearables ||
                clinician.share_regulation;

              const clinicianInitials =
                clinician.clinician_name
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) =>
                    part.charAt(0).toUpperCase()
                  )
                  .join("") || "CL";

              return (
                <section
                  key={clinician.connection_id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-800">
                        {clinicianInitials}
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800">
                          Connected clinician
                        </p>

                        <p className="mt-1 font-semibold text-slate-950">
                          {clinician.clinician_name}
                        </p>

                        {clinician.clinician_email && (
                          <p className="mt-1 break-all text-xs font-medium text-slate-500">
                            {clinician.clinician_email}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-slate-400">
                          Connected{" "}
                          {new Date(
                            clinician.connected_at
                          ).toLocaleDateString()}
                          {" · "}
                          Connection{" "}
                          {clinician.connection_id
                            .slice(-6)
                            .toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {saving && (
                        <span className="text-xs font-medium text-slate-400">
                          Saving...
                        </span>
                      )}

                      {savedConnectionId ===
                        clinician.connection_id && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          Saved
                        </span>
                      )}

                      {!saving &&
                        savedConnectionId !==
                          clinician.connection_id && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              hasSharedInformation
                                ? "bg-cyan-50 text-cyan-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {hasSharedInformation
                              ? "Some data shared"
                              : "Nothing shared"}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="border-b border-cyan-100 bg-cyan-50/50 px-5 py-4">
                    <p className="text-sm font-semibold text-cyan-950">
                      Sharing with {clinician.clinician_name}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Every switch below applies only to this clinician
                      {clinician.clinician_email
                        ? ` (${clinician.clinician_email})`
                        : ""}. Changing these settings does not change
                      what you share with any other connected clinician.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100 px-5">
                    {sharingPermissionDefinitions.map(
                      (permission) => {
                        const enabled =
                          clinician[permission.key];

                        return (
                          <div
                            key={permission.key}
                            className="flex items-center justify-between gap-5 py-4"
                          >
                            <div className="pr-3">
                              <p className="text-sm font-medium text-slate-800">
                                {permission.title}
                              </p>

                              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
                                {
                                  permission.description
                                }
                              </p>
                            </div>

                            <button
                              type="button"
                              role="switch"
                              aria-checked={enabled}
                              aria-label={`${permission.title} for ${clinician.clinician_name}`}
                              disabled={saving || removing}
                              onClick={() =>
                                void updatePermission(
                                  clinician,
                                  permission.key,
                                  !enabled
                                )
                              }
                              className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-wait disabled:opacity-60 ${
                                enabled
                                  ? "bg-cyan-700"
                                  : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                                  enabled
                                    ? "left-6"
                                    : "left-1"
                                }`}
                              />
                            </button>
                          </div>
                        );
                      }
                    )}

                    <div className="flex items-center justify-between gap-5 py-4">
                      <div className="pr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800">
                            Luna AI conversations
                          </p>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                            Private
                          </span>
                        </div>

                        <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
                          Conversation history is not included
                          in clinician sharing permissions.
                        </p>
                      </div>

                      <div className="flex h-7 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
                        🔒
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-xs leading-5 text-slate-500">
                          You can change sharing choices at any time.
                          Removing the clinician ends the connection and
                          disables all sharing through it.
                        </p>

                        {clinician.permissions_updated_at && (
                          <p className="mt-2 text-[11px] text-slate-400">
                            Permissions last updated{" "}
                            {new Date(
                              clinician.permissions_updated_at
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={saving || removing}
                        onClick={() =>
                          void removeClinician(clinician)
                        }
                        className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {removing
                          ? "Removing..."
                          : "Remove clinician"}
                      </button>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Privacy principle">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <p className="font-medium text-cyan-950">
            Connection and sharing are separate choices.
          </p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            A clinician can be connected to your account
            without receiving access to your personal
            PsyLattice information. You decide which
            categories are shared with each clinician
            individually.
          </p>

          <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-800">
              Luna remains private.
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              PsyLattice does not expose your private Luna
              conversation history through clinician sharing
              permissions.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Data controls">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
          >
            <p className="text-sm font-medium">
              Download my data
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Request a portable copy of your PsyLattice
              information.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-slate-200 p-4 text-left transition hover:bg-slate-50"
          >
            <p className="text-sm font-medium">
              Consent centre
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Review optional data and sharing permissions.
            </p>
          </button>
        </div>
      </Panel>
    </div>
  );
}


/* =========================================================
   MAIN SELF WORKSPACE
   ========================================================= */

export default function SelfWorkspace() {
  const router = useRouter();

const [screen, setScreen] = useState<Screen>("dashboard");

useEffect(() => {
  const requestedScreen =
    new URLSearchParams(
      window.location.search
    ).get("screen");

  if (
    requestedScreen === "messages"
  ) {
    setScreen("messages");
  }
}, []);
const [fullName, setFullName] = useState("");
const [signingOut, setSigningOut] = useState(false);
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
const [currentLocalTime, setCurrentLocalTime] = useState(
  () => new Date()
);

const [
  pendingClinicianInvitations,
  setPendingClinicianInvitations,
] = useState(0);

const [
  pendingMonitoringRequests,
  setPendingMonitoringRequests,
] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/signin");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Could not load profile:", profileError.message);

        setFullName(user.email?.split("@")[0] || "User");
        return;
      }

      setFullName(
        profile?.full_name?.trim() ||
          user.email?.split("@")[0] ||
          "User",
      );
    }

        void loadProfile();
  }, [router]);

  useEffect(() => {
    const updateClock = () => {
      setCurrentLocalTime(new Date());
    };

    updateClock();

    const timer = window.setInterval(
      updateClock,
      60_000
    );

    function refreshClockOnFocus() {
      updateClock();
    }

    function refreshClockWhenVisible() {
      if (document.visibilityState === "visible") {
        updateClock();
      }
    }

    window.addEventListener(
      "focus",
      refreshClockOnFocus
    );

    document.addEventListener(
      "visibilitychange",
      refreshClockWhenVisible
    );

    return () => {
      window.clearInterval(timer);

      window.removeEventListener(
        "focus",
        refreshClockOnFocus
      );

      document.removeEventListener(
        "visibilitychange",
        refreshClockWhenVisible
      );
    };
  }, []);

  async function loadSelfNotificationCounts() {
    const supabase = createClient();

    const [
      clinicianInvitationResult,
      monitoringRequestResult,
    ] = await Promise.all([
      supabase.rpc(
        "psylattice_my_clinician_invitations_v2"
      ),
      supabase.rpc(
        "psylattice_my_monitoring_requests_v2"
      ),
    ]);

    if (clinicianInvitationResult.error) {
      console.error(
        "Could not load clinician invitation count:",
        clinicianInvitationResult.error
      );
    } else {
      setPendingClinicianInvitations(
        Array.isArray(
          clinicianInvitationResult.data
        )
          ? clinicianInvitationResult.data.length
          : 0
      );
    }

    if (monitoringRequestResult.error) {
      console.error(
        "Could not load monitoring request count:",
        monitoringRequestResult.error
      );
    } else {
      setPendingMonitoringRequests(
        Array.isArray(
          monitoringRequestResult.data
        )
          ? monitoringRequestResult.data.length
          : 0
      );
    }
  }

  useEffect(() => {
    function refreshCounts() {
      void loadSelfNotificationCounts();
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        refreshCounts();
      }
    }

    refreshCounts();

    const interval = window.setInterval(
      refreshCounts,
      10000
    );

    window.addEventListener(
      "focus",
      refreshCounts
    );
    window.addEventListener(
      "psylattice-clinician-state-changed",
      refreshCounts
    );
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "focus",
        refreshCounts
      );
      window.removeEventListener(
        "psylattice-clinician-state-changed",
        refreshCounts
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out failed:", error.message);
      setSigningOut(false);
      return;
    }

    router.replace("/signin");
    router.refresh();
  }

  const firstName =
    fullName.trim().split(/\s+/)[0] || "there";

  const localHour =
    currentLocalTime.getHours();

  function greetingForHour(hour: number) {
    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 17) {
      return "Good afternoon";
    }

    return "Good evening";
  }

  const greeting =
    greetingForHour(localHour);

  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "PL";

  function AppointmentsScreen() {
    return (
      <div className="space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Appointments
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              View clinician-scheduled appointments, preparation messages and shared appointment links. Private clinician notes are never shown here.
            </p>
          </div>
        </section>

        <ClientAppointmentsWorkspace />
      </div>
    );
  }

  function MessagesScreen() {
    type CurrentClinician = {
      connection_id: string;
      clinician_id: string;
      clinician_name: string;
      clinician_email: string;
      connected_at: string;
      share_assessments: boolean;
      share_monitoring: boolean;
      share_progress: boolean;
      share_wearables: boolean;
      share_regulation: boolean;
    };

    const [currentClinician, setCurrentClinician] =
      useState<CurrentClinician | null>(null);
    const [loadingCurrentClinician, setLoadingCurrentClinician] =
      useState(true);
    const [currentClinicianError, setCurrentClinicianError] =
      useState("");

    useEffect(() => {
      let cancelled = false;

      async function loadCurrentClinician() {
        setLoadingCurrentClinician(true);
        setCurrentClinicianError("");

        const supabase = createClient();

        const { data, error } = await supabase.rpc(
          "psylattice_my_clinicians_and_permissions_v2"
        );

        if (cancelled) {
          return;
        }

        if (error) {
          console.error(
            "Could not load current clinician for Messages:",
            error
          );
          setCurrentClinicianError(
            "Your current clinician connection could not be loaded."
          );
          setCurrentClinician(null);
          setLoadingCurrentClinician(false);
          return;
        }

        const clinicians =
          (data ?? []) as CurrentClinician[];

        // Messages deliberately uses the exact same clinician source
        // as the Self dashboard. PsyLattice supports one current
        // clinician relationship for the Self workspace.
        setCurrentClinician(
          clinicians.length > 0
            ? clinicians[0]
            : null
        );
        setLoadingCurrentClinician(false);
      }

      void loadCurrentClinician();

      return () => {
        cancelled = true;
      };
    }, []);

    return (
      <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="bg-gradient-to-r from-cyan-50/70 via-white to-white px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-800">
              Connected care
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Messages
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Keep non-urgent communication with your current clinician in one private PsyLattice space. Your messaging channel is separate from assessment, monitoring and progress-sharing permissions.
            </p>
          </div>
        </section>

        {loadingCurrentClinician ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Loading your clinician conversation...
            </p>
          </div>
        ) : currentClinicianError ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {currentClinicianError}
          </div>
        ) : !currentClinician ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-xl text-cyan-800">
              ✉
            </div>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No clinician currently connected
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Secure messaging becomes available when you have an active PsyLattice clinician connection.
            </p>
          </div>
        ) : (
          <PsyLatticeMessagesWorkspace
            mode="client"
            fixedThread={{
              connection_id:
                currentClinician.connection_id,
              peer_id:
                currentClinician.clinician_id,
              peer_name:
                currentClinician.clinician_name,
            }}
          />
        )}
      </div>
    );
  }

  async function openNotificationTarget(
    targetScreen: string,
    targetParams: UnifiedNotificationTargetParams
  ) {
    const allowedTargets = new Set<Screen>([
      "dashboard",
      "ai",
      "assessments",
      "monitoring",
      "regulation",
      "progress",
      "wearables",
      "appointments",
      "messages",
      "notifications",
      "privacy",
    ]);

    if (
      targetScreen === "dashboard" &&
      typeof targetParams?.invitation_id === "string"
    ) {
      setScreen("notifications");
      return;
    }

    const requestedScreen = allowedTargets.has(
      targetScreen as Screen
    )
      ? (targetScreen as Screen)
      : "notifications";

    setScreen(requestedScreen);
  }

  const activeNavigation = navigation.find(
    (item) => item.id === screen,
  )!;

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return (
          <Dashboard
            changeScreen={setScreen}
            pendingClinicianInvitations={pendingClinicianInvitations}
          />
        );

      case "ai":
        return <AIGuide changeScreen={setScreen} />;

      case "assessments":
        return <Assessments />;

      case "monitoring":
        return (
          <Monitoring
            changeScreen={setScreen}
            onPendingRequestCountChange={
              setPendingMonitoringRequests
            }
          />
        );

      case "regulation":
        return <Regulation />;

      case "progress":
        return <Progress />;

      case "wearables":
        return <Wearables />;

      case "appointments":
        return <AppointmentsScreen />;

      case "messages":
        return <MessagesScreen />;
      case "notifications":
        return (
          <Notifications
            onInvitationCountChange={
              setPendingClinicianInvitations
            }
            onNavigate={openNotificationTarget}
          />
        );

      case "privacy":
        return <Privacy />;

      default:
        return (
          <Dashboard
            changeScreen={setScreen}
            pendingClinicianInvitations={pendingClinicianInvitations}
          />
        );
    }
  }

  function getDescription() {
    switch (screen) {
      case "dashboard":
        return "A clear view of your self-assessments, daily monitoring and self-regulation.";

      case "ai":
        return "Explore suitable self-checks and monitoring approaches through guided conversation.";

      case "assessments":
        return "Structured questionnaires for personal reflection and repeated self-checks.";

      case "monitoring":
        return "Short assessments delivered during everyday life.";

      case "regulation":
        return "Turn what you notice into simple, trackable actions.";

      case "progress":
        return "Review changes across assessments, check-ins and daily routines.";

      case "wearables":
        return "Optionally combine your self-reports with authorised wearable summaries.";

      case "appointments":
        return "See your upcoming clinician appointments, shared notes and appointment links.";

      case "messages":
        return "Secure, non-urgent messaging with your connected clinicians.";

      case "notifications":
        return "Review clinician requests, assessments, monitoring, appointments and secure messages in one place.";

      case "privacy":
        return "Control your data and exactly what you choose to share.";
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f6f8f8] text-slate-950">
      {/* TOP BAR */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 lg:px-7">
          {/* Logo */}

   <div>
  <PsyLatticeLogo size={38} />

  <p className="mt-0 pl-[50px] text-xs text-slate-400">
    Personal workspace
  </p>
</div>

          <div className="flex items-center gap-2 sm:gap-3">
            <UnifiedNotificationBell
              workspace="self"
              onClick={() => setScreen("notifications")}
            />

            {/* Desktop account controls */}
            <div className="hidden items-center gap-3 sm:flex">
              <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800">
                For myself
              </span>

              <AccountSwitcher
                initials={initials}
                currentWorkspace="self"
                title={fullName || "Switch workspace"}
              />

              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>

            {/* Mobile navigation */}
            <select
              value={screen}
              onChange={(event) =>
                setScreen(event.target.value as Screen)
              }
              className="max-w-[165px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm lg:hidden sm:max-w-[190px]"
            >
              {navigation.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                  {item.id === "monitoring" &&
                  pendingMonitoringRequests > 0
                    ? ` (${pendingMonitoringRequests})`
                    : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div
  className={`grid h-[calc(100vh-80px)] transition-[grid-template-columns] duration-300 ${
    sidebarCollapsed
      ? "lg:grid-cols-[80px_minmax(0,1fr)]"
      : "lg:grid-cols-[240px_minmax(0,1fr)]"
  }`}
>
        {/* SIDEBAR */}

        <aside className="hidden h-full overflow-y-auto border-r border-slate-200 bg-white lg:flex lg:flex-col">
  {/* Collapse button */}
  <div
    className={`flex border-b border-slate-100 p-3 ${
      sidebarCollapsed
        ? "justify-center"
        : "justify-end"
    }`}
  >
    <button
      type="button"
      onClick={() =>
        setSidebarCollapsed(
          (previous) => !previous
        )
      }
      title={
        sidebarCollapsed
          ? "Expand sidebar"
          : "Collapse sidebar"
      }
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className={`h-4 w-4 transition-transform duration-300 ${
          sidebarCollapsed
            ? "rotate-180"
            : ""
        }`}
        aria-hidden="true"
      >
        <path
          d="M12.5 5.5 8 10l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  </div>

  {/* Personal space */}
  {!sidebarCollapsed && (
    <p className="px-7 pb-3 pt-5 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
      Personal space
    </p>
  )}

  <nav
    className={`space-y-1 ${
      sidebarCollapsed
        ? "px-3 pt-4"
        : "px-4"
    }`}
  >
    {navigation.slice(0, 10).map((item) => {
      const active = item.id === screen;

      return (
        <button
          key={item.id}
          type="button"
          title={
            sidebarCollapsed
              ? item.label
              : undefined
          }
          onClick={() => setScreen(item.id)}
          className={`flex w-full items-center rounded-xl py-2.5 text-sm transition ${
            sidebarCollapsed
              ? "justify-center px-2"
              : "gap-3 px-3 text-left"
          } ${
            active
              ? "bg-cyan-50 font-semibold text-cyan-900"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <span
            className={`relative flex shrink-0 items-center justify-center ${
              sidebarCollapsed
                ? "h-8 w-8 rounded-lg text-[11px] font-semibold"
                : ""
            } ${
              sidebarCollapsed && active
                ? "bg-cyan-100 text-cyan-900"
                : ""
            }`}
          >
            {sidebarCollapsed &&
              item.id === "messages" && (
                <MessageUnreadBadge compact />
              )}

            {sidebarCollapsed &&
              item.id === "appointments" && (
                <AppointmentNotificationBadge
                  mode="client"
                  compact
                />
              )}

            {sidebarCollapsed &&
              item.id === "notifications" && (
                <UnifiedNotificationBadge
                  workspace="self"
                  compact
                />
              )}

            {sidebarCollapsed &&
              item.id === "monitoring" &&
              pendingMonitoringRequests > 0 && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-cyan-700" />
              )}
            {sidebarCollapsed ? (
              item.id === "dashboard" ? (
                "D"
              ) : item.id === "ai" ? (
                "AI"
              ) : item.id === "assessments" ? (
                "A"
              ) : item.id === "monitoring" ? (
                "M"
              ) : item.id === "regulation" ? (
                "R"
              ) : item.id === "progress" ? (
                "P"
              ) : item.id === "wearables" ? (
                "W"
              ) : item.id === "appointments" ? (
                "AP"
              ) : item.id === "messages" ? (
                "MS"
              ) : (
                "N"
              )
            ) : (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active
                    ? "bg-cyan-700"
                    : "bg-slate-300"
                }`}
              />
            )}
          </span>

          {!sidebarCollapsed && (
  <div className="flex items-center gap-2">
    <span>{item.label}</span>

    {item.id === "messages" && (
      <MessageUnreadBadge />
    )}

    {item.id === "appointments" && (
      <AppointmentNotificationBadge
        mode="client"
      />
    )}

    {item.id === "ai" && (
      <span className="rounded-full border border-yellow-500 bg-yellow-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-yellow-600">
        New
      </span>
    )}

    {item.id === "monitoring" &&
      pendingMonitoringRequests > 0 && (
        <span
          title={`${pendingMonitoringRequests} clinician monitoring request${
            pendingMonitoringRequests === 1 ? "" : "s"
          }`}
          className="flex min-w-5 items-center justify-center rounded-full bg-cyan-700 px-1.5 py-0.5 text-[10px] font-bold text-white"
        >
          {pendingMonitoringRequests > 9
            ? "9+"
            : pendingMonitoringRequests}
        </span>
      )}

    {item.id === "notifications" && (
      <UnifiedNotificationBadge
        workspace="self"
      />
    )}
  </div>
)}
        </button>
      );
    })}
  </nav>

  <div className="mx-4 my-5 h-px bg-slate-100" />

  {/* Account */}
  {!sidebarCollapsed && (
    <p className="px-7 pb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
      Account
    </p>
  )}

  <div
    className={
      sidebarCollapsed
        ? "px-3"
        : "px-4"
    }
  >
    <button
      type="button"
      title={
        sidebarCollapsed
          ? "Privacy & Sharing"
          : undefined
      }
      onClick={() => setScreen("privacy")}
      className={`flex w-full items-center rounded-xl py-2.5 text-sm ${
        sidebarCollapsed
          ? "justify-center px-2"
          : "gap-3 px-3 text-left"
      } ${
        screen === "privacy"
          ? "bg-cyan-50 font-semibold text-cyan-900"
          : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {sidebarCollapsed ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold">
          P
        </span>
      ) : (
        <>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              screen === "privacy"
                ? "bg-cyan-700"
                : "bg-slate-300"
            }`}
          />

          Privacy & Sharing
        </>
      )}
    </button>
  </div>

  {/* Bottom info card */}
  {!sidebarCollapsed && (
    <div className="mt-auto p-4">
      <div className="rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-medium text-cyan-200">
          PsyLattice
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          Assessment, monitoring and clinician
          connection information shown in the
          active Self workspace is loaded from
          your PsyLattice account.
        </p>
      </div>
    </div>
  )}
</aside>

        {/* CONTENT */}

        <section className="min-w-0 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[11px] font-medium text-cyan-800">
                    Personal / Self
                  </span>

                  <span className="text-xs text-slate-400">
                    Authenticated workspace
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                  {screen === "dashboard"
                    ? `${greeting}, ${firstName}.`
                    : activeNavigation.label}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {getDescription()}
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