"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";


type Screen =
  | "dashboard"
  | "ai"
  | "assessments"
  | "monitoring"
  | "regulation"
  | "progress"
  | "wearables"
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

function Dashboard({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  type DashboardPlan = {
    id: string;
    name: string;
    duration_days: number;
    prompts_per_day: number;
    start_date: string;
    status: string;
  };

  type DashboardSchedule = {
    id: string;
    label: string;
    start_time: string;
    end_time: string;
    sort_order: number;
  };

  type DashboardEntry = {
    id: string;
    schedule_id: string;
    stress: number;
    activity: string | null;
    note: string | null;
    created_at: string;
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
  const [monitoringPlan, setMonitoringPlan] = useState<DashboardPlan | null>(
    null
  );
  const [monitoringSchedules, setMonitoringSchedules] = useState<
    DashboardSchedule[]
  >([]);
  const [todayEntries, setTodayEntries] = useState<DashboardEntry[]>([]);

  const [loadingRegulation, setLoadingRegulation] = useState(true);
  const [regulationError, setRegulationError] = useState("");
  const [regulationPlan, setRegulationPlan] =
    useState<DashboardRegulationPlan | null>(null);
  const [regulationActivities, setRegulationActivities] = useState<
    DashboardRegulationActivity[]
  >([]);
  const [todayRegulationCompletions, setTodayRegulationCompletions] = useState<
    DashboardRegulationCompletion[]
  >([]);

  function getLocalDateString() {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  useEffect(() => {
    async function loadDashboardMonitoring() {
      setLoadingMonitoring(true);
      setMonitoringError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMonitoringError("Your monitoring data could not be loaded.");
        setLoadingMonitoring(false);
        return;
      }

      const { data: planData, error: planError } = await supabase
        .from("monitoring_plans")
        .select(
          "id, name, duration_days, prompts_per_day, start_date, status"
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) {
        console.error("Could not load dashboard monitoring plan:", planError);
        setMonitoringError("Your monitoring data could not be loaded.");
        setLoadingMonitoring(false);
        return;
      }

      if (!planData) {
        setMonitoringPlan(null);
        setMonitoringSchedules([]);
        setTodayEntries([]);
        setLoadingMonitoring(false);
        return;
      }

      const typedPlan = planData as DashboardPlan;
      setMonitoringPlan(typedPlan);

      const [scheduleResult, entryResult] = await Promise.all([
        supabase
          .from("monitoring_schedules")
          .select("id, label, start_time, end_time, sort_order")
          .eq("plan_id", typedPlan.id)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("monitoring_entries")
          .select("id, schedule_id, stress, activity, note, created_at")
          .eq("plan_id", typedPlan.id)
          .eq("user_id", user.id)
          .eq("entry_date", getLocalDateString())
          .order("created_at", { ascending: true }),
      ]);

      if (scheduleResult.error) {
        console.error(
          "Could not load dashboard schedules:",
          scheduleResult.error
        );
        setMonitoringError("Your monitoring schedule could not be loaded.");
        setLoadingMonitoring(false);
        return;
      }

      if (entryResult.error) {
        console.error(
          "Could not load dashboard entries:",
          entryResult.error
        );
        setMonitoringError("Today's check-ins could not be loaded.");
        setLoadingMonitoring(false);
        return;
      }

      setMonitoringSchedules(
        (scheduleResult.data || []) as DashboardSchedule[]
      );
      setTodayEntries((entryResult.data || []) as DashboardEntry[]);
      setLoadingMonitoring(false);
    }

    void loadDashboardMonitoring();
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
        setRegulationError("Your self-regulation data could not be loaded.");
        setLoadingRegulation(false);
        return;
      }

      const { data: planData, error: planError } = await supabase
        .from("regulation_plans")
        .select("id, name, duration_days, start_date, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) {
        console.error("Could not load dashboard regulation plan:", planError);
        setRegulationError("Your self-regulation data could not be loaded.");
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

      const typedPlan = planData as DashboardRegulationPlan;
      setRegulationPlan(typedPlan);

      const [activityResult, completionResult] = await Promise.all([
        supabase
          .from("regulation_activities")
          .select("id, name, target_per_day, sort_order")
          .eq("plan_id", typedPlan.id)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("regulation_completions")
          .select("id, activity_id, occurrence, completed_at")
          .eq("plan_id", typedPlan.id)
          .eq("user_id", user.id)
          .eq("completion_date", getLocalDateString())
          .order("completed_at", { ascending: true }),
      ]);

      if (activityResult.error) {
        console.error(
          "Could not load dashboard regulation activities:",
          activityResult.error
        );
        setRegulationError("Your self-regulation activities could not be loaded.");
        setLoadingRegulation(false);
        return;
      }

      if (completionResult.error) {
        console.error(
          "Could not load dashboard regulation completions:",
          completionResult.error
        );
        setRegulationError("Today's self-regulation progress could not be loaded.");
        setLoadingRegulation(false);
        return;
      }

      setRegulationActivities(
        (activityResult.data || []) as DashboardRegulationActivity[]
      );
      setTodayRegulationCompletions(
        (completionResult.data || []) as DashboardRegulationCompletion[]
      );
      setLoadingRegulation(false);
    }

    void loadDashboardRegulation();
  }, []);

  const completedToday = todayEntries.length;
  const totalToday = monitoringSchedules.length;
  const remainingToday = Math.max(totalToday - completedToday, 0);

  const averageStress =
    completedToday > 0
      ? (
          todayEntries.reduce((sum, entry) => sum + entry.stress, 0) /
          completedToday
        ).toFixed(1)
      : null;

  const completionPercentage =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const planDay = (() => {
    if (!monitoringPlan?.start_date) {
      return null;
    }

    const start = new Date(`${monitoringPlan.start_date}T00:00:00`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const difference = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(1, difference + 1);
  })();

  function entryForSchedule(scheduleId: string) {
    return todayEntries.find((entry) => entry.schedule_id === scheduleId);
  }

  function formatEntryTime(createdAt: string) {
    return new Date(createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const stressValues = todayEntries.map((entry) => entry.stress);
  const lowestStress = stressValues.length > 0 ? Math.min(...stressValues) : null;
  const highestStress =
    stressValues.length > 0 ? Math.max(...stressValues) : null;

  const regulationPlanDay = (() => {
    if (!regulationPlan?.start_date) {
      return null;
    }

    const start = new Date(`${regulationPlan.start_date}T00:00:00`);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const difference = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(1, difference + 1);
  })();

  const regulationTargetToday = regulationActivities.reduce(
    (sum, activity) => sum + activity.target_per_day,
    0
  );
  const regulationCompletedToday = todayRegulationCompletions.length;
  const regulationCompletionPercentage =
    regulationTargetToday > 0
      ? Math.min(
          100,
          Math.round(
            (regulationCompletedToday / regulationTargetToday) * 100
          )
        )
      : 0;

  return (
    <div className="space-y-5">
      {monitoringError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{monitoringError}</p>
        </div>
      )}

      {regulationError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{regulationError}</p>
        </div>
      )}

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
                ? remainingToday === 0 && totalToday > 0
                  ? "All scheduled check-ins completed"
                  : `${remainingToday} remaining today`
                : "Create a monitoring plan"
          }
        />

        <StatCard
          label="Current stress"
          value={
            loadingMonitoring
              ? "..."
              : averageStress
                ? `${averageStress} / 10`
                : "No data"
          }
          detail="Average of today's check-ins"
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
              ? `${monitoringPlan.duration_days}-day plan · ${monitoringPlan.prompts_per_day}/day`
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
          detail={monitoringPlan ? monitoringPlan.name : "Monitoring not started"}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title="Today"
          description="Your scheduled monitoring check-ins for today."
        >
          {loadingMonitoring ? (
            <p className="text-sm text-slate-500">Loading today's schedule...</p>
          ) : monitoringPlan && monitoringSchedules.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {monitoringSchedules.map((schedule) => {
                const completedEntry = entryForSchedule(schedule.id);

                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Icon>{completedEntry ? "✓" : "○"}</Icon>

                      <div>
                        <p className="font-medium">{schedule.label}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {completedEntry
                            ? `Completed at ${formatEntryTime(completedEntry.created_at)}`
                            : `${schedule.start_time.slice(0, 5)}–${schedule.end_time.slice(0, 5)}`}
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
                        onClick={() => changeScreen("monitoring")}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                      >
                        Check in
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="font-medium">No active monitoring plan</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create a Daily Monitoring plan to schedule check-ins and see
                your real monitoring data here.
              </p>
              <button
                type="button"
                onClick={() => changeScreen("monitoring")}
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Set up monitoring
              </button>
            </div>
          )}
        </Panel>

        <DashboardAssessmentSummary changeScreen={changeScreen} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Ask PsyLattice AI">
          <div className="flex gap-4">
            <Icon dark>AI</Icon>

            <div>
              <p className="font-medium">Not sure what to assess?</p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Describe what you have been experiencing. The AI Guide can help
                you explore an appropriate self-assessment or monitoring
                approach.
              </p>

              <button
                type="button"
                onClick={() => changeScreen("ai")}
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open AI Guide
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Your self-regulation plan">
          {loadingRegulation ? (
            <p className="text-sm text-slate-500">Loading your plan...</p>
          ) : regulationPlan ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{regulationPlan.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {regulationPlanDay
                      ? `Day ${Math.min(
                          regulationPlanDay,
                          regulationPlan.duration_days
                        )} of ${regulationPlan.duration_days}`
                      : `${regulationPlan.duration_days}-day plan`}
                  </p>
                </div>

                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                  {regulationCompletedToday} / {regulationTargetToday} today
                </span>
              </div>

              <div className="mt-5">
                <ProgressBar
                  label="Today's completion"
                  value={regulationCompletionPercentage}
                  text={`${regulationCompletionPercentage}%`}
                />
              </div>

              <button
                type="button"
                onClick={() => changeScreen("regulation")}
                className="mt-5 flex items-center gap-2 text-sm font-semibold"
              >
                Open plan
                <ArrowIcon />
              </button>
            </>
          ) : (
            <>
              <p className="font-medium">No active self-regulation plan</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Create a personal plan with activities and daily targets.
              </p>

              <button
                type="button"
                onClick={() => changeScreen("regulation")}
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
          <p className="text-sm text-slate-500">Loading today's data...</p>
        ) : todayEntries.length >= 2 && lowestStress !== null && highestStress !== null ? (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <div className="flex items-start gap-4">
              <Icon>↗</Icon>

              <div>
                <p className="font-medium">Today's monitoring summary</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Across {todayEntries.length} completed check-ins today, your
                  stress ratings ranged from {lowestStress}/10 to {highestStress}/10,
                  with an average of {averageStress}/10. This is a descriptive
                  summary of your entries, not evidence of cause or a clinical
                  conclusion.
                </p>

                <button
                  type="button"
                  onClick={() => changeScreen("monitoring")}
                  className="mt-4 text-sm font-semibold text-cyan-900"
                >
                  Review today's check-ins
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">Not enough monitoring data yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete at least two check-ins today and PsyLattice will show a
              simple descriptive summary here.
            </p>
          </div>
        )}
      </Panel>
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

  const [view, setView] = useState<
    "library" | "details" | "runner" | "safety" | "result"
  >("library");

  const [phq9Item9Response, setPhq9Item9Response] =
    useState<number | null>(null);

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

  async function startAssessment(questionnaire: Questionnaire) {
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

    let version = selectedVersion;

    if (!version || version.questionnaire_id !== questionnaire.id) {
      const { data: versionData, error: versionError } = await supabase
        .from("questionnaire_versions")
        .select(
          "id, questionnaire_id, version_label, participant_instructions, researcher_instructions, response_scale_description, scoring_summary, score_multiplier"
        )
        .eq("questionnaire_id", questionnaire.id)
        .eq("is_current", true)
        .limit(1)
        .maybeSingle();

      if (versionError || !versionData) {
        setRunnerError("This questionnaire version could not be loaded.");
        setRunnerLoading(false);
        return;
      }

      version = versionData as QuestionnaireVersion;
      setSelectedVersion(version);
    }

    const { data: itemData, error: itemError } = await supabase
      .from("questionnaire_items")
      .select(
        "id, position, prompt, subscale, reverse_scored, response_type, response_options, required"
      )
      .eq("version_id", version.id)
      .order("position", { ascending: true });

    if (itemError || !itemData || itemData.length === 0) {
      console.error("Could not load questionnaire items:", itemError);
      setRunnerError("The questionnaire items could not be loaded.");
      setRunnerLoading(false);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase
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
      console.error("Could not create assessment session:", sessionError);
      setRunnerError("The assessment could not be started.");
      setRunnerLoading(false);
      return;
    }

    setSelectedQuestionnaire(questionnaire);
    setItems((itemData || []) as QuestionnaireItem[]);
    setAnswers({});
    setCurrentItemIndex(0);
    setSessionId(sessionData.id);
    setView("runner");
    setRunnerLoading(false);
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

function Monitoring() {
  type MonitoringPlan = {
    id: string;
    name: string;
    construct: string;
    duration_days: number;
    prompts_per_day: number;
    start_date: string;
    status: string;
  };

  type MonitoringSchedule = {
    id: string;
    label: string;
    start_time: string;
    end_time: string;
    sort_order: number;
  };

  type MonitoringEntry = {
    id: string;
    schedule_id: string;
    entry_date: string;
    stress: number;
    activity: string | null;
    note: string | null;
    created_at: string;
  };

  type ScheduleDraft = {
    id?: string;
    label: string;
    start_time: string;
    end_time: string;
  };

  const defaultSchedules: ScheduleDraft[] = [
    {
      label: "Morning",
      start_time: "08:00",
      end_time: "10:00",
    },
    {
      label: "Afternoon",
      start_time: "15:00",
      end_time: "17:00",
    },
    {
      label: "Evening",
      start_time: "20:00",
      end_time: "22:00",
    },
  ];

  const [stress, setStress] = useState(6);
  const [activity, setActivity] = useState("Studying");
  const [note, setNote] = useState("");

  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryError, setEntryError] = useState("");
  const [entrySuccess, setEntrySuccess] = useState("");
  const [todayEntries, setTodayEntries] = useState<MonitoringEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const [plan, setPlan] = useState<MonitoringPlan | null>(null);
  const [schedules, setSchedules] = useState<MonitoringSchedule[]>([]);
  const [scheduleDrafts, setScheduleDrafts] =
    useState<ScheduleDraft[]>(defaultSchedules);

  const [loadingPlan, setLoadingPlan] = useState(true);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const [planSuccess, setPlanSuccess] = useState("");
  const [planName, setPlanName] = useState("Stress Monitoring");
  const [durationDays, setDurationDays] = useState(7);

  function updateSchedule(
    index: number,
    field: "label" | "start_time" | "end_time",
    value: string
  ) {
    setScheduleDrafts((previous) =>
      previous.map((schedule, scheduleIndex) =>
        scheduleIndex === index
          ? {
              ...schedule,
              [field]: value,
            }
          : schedule
      )
    );
  }

  function addSchedule() {
    if (scheduleDrafts.length >= 12) {
      return;
    }

    setScheduleDrafts((previous) => [
      ...previous,
      {
        label: `Check-in ${previous.length + 1}`,
        start_time: "12:00",
        end_time: "13:00",
      },
    ]);
  }

  function removeSchedule(index: number) {
    if (scheduleDrafts.length <= 1) {
      return;
    }

    setScheduleDrafts((previous) =>
      previous.filter((_, scheduleIndex) => scheduleIndex !== index)
    );
  }

  function changePromptCount(requestedCount: number) {
    const count = Math.max(1, Math.min(12, requestedCount));

    setScheduleDrafts((previous) => {
      if (count === previous.length) {
        return previous;
      }

      if (count < previous.length) {
        return previous.slice(0, count);
      }

      const newSchedules = [...previous];

      while (newSchedules.length < count) {
        const number = newSchedules.length + 1;

        newSchedules.push({
          label: `Check-in ${number}`,
          start_time: "12:00",
          end_time: "13:00",
        });
      }

      return newSchedules;
    });
  }

  function getLocalDateString() {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  async function loadTodayEntries(planId: string) {
    setLoadingEntries(true);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setEntryError("Today's check-ins could not be loaded.");
      setLoadingEntries(false);
      return;
    }

    const { data, error } = await supabase
      .from("monitoring_entries")
      .select(
        "id, schedule_id, entry_date, stress, activity, note, created_at"
      )
      .eq("user_id", user.id)
      .eq("plan_id", planId)
      .eq("entry_date", getLocalDateString())
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Could not load today's monitoring entries:",
        error.message
      );
      setEntryError("Today's check-ins could not be loaded.");
      setLoadingEntries(false);
      return;
    }

    setTodayEntries((data || []) as MonitoringEntry[]);
    setLoadingEntries(false);
  }

  async function loadMonitoringPlan() {
    setLoadingPlan(true);
    setPlanError("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setPlanError("Your monitoring plan could not be loaded.");
      setLoadingPlan(false);
      return;
    }

    const { data: existingPlan, error: planLoadError } = await supabase
      .from("monitoring_plans")
      .select(
        "id, name, construct, duration_days, prompts_per_day, start_date, status"
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (planLoadError) {
      console.error(
        "Could not load monitoring plan:",
        planLoadError.message
      );
      setPlanError("Your monitoring plan could not be loaded.");
      setLoadingPlan(false);
      return;
    }

    if (!existingPlan) {
      setPlan(null);
      setSchedules([]);
      setTodayEntries([]);
      setScheduleDrafts(defaultSchedules);
      setSelectedScheduleId("");
      setShowPlanEditor(true);
      setLoadingPlan(false);
      return;
    }

    setPlan(existingPlan as MonitoringPlan);
    setPlanName(existingPlan.name);
    setDurationDays(existingPlan.duration_days);

    const { data: existingSchedules, error: scheduleLoadError } = await supabase
      .from("monitoring_schedules")
      .select("id, label, start_time, end_time, sort_order")
      .eq("plan_id", existingPlan.id)
      .eq("is_active", true)
      .order("sort_order", {
        ascending: true,
      });

    if (scheduleLoadError) {
      console.error(
        "Could not load monitoring schedules:",
        scheduleLoadError.message
      );
      setPlanError("Your monitoring schedule could not be loaded.");
      setLoadingPlan(false);
      return;
    }

    const loadedSchedules = (existingSchedules || []) as MonitoringSchedule[];

    setSchedules(loadedSchedules);

    setSelectedScheduleId((current) => {
      const currentStillExists = loadedSchedules.some(
        (schedule) => schedule.id === current
      );

      if (currentStillExists) {
        return current;
      }

      return loadedSchedules[0]?.id || "";
    });

    setScheduleDrafts(
      loadedSchedules.map((schedule) => ({
        id: schedule.id,
        label: schedule.label,
        start_time: schedule.start_time.slice(0, 5),
        end_time: schedule.end_time.slice(0, 5),
      }))
    );

    await loadTodayEntries(existingPlan.id);

    setLoadingPlan(false);
  }

  useEffect(() => {
    void loadMonitoringPlan();
    // This initial load should run once when the Monitoring screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveMonitoringPlan() {
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
        throw new Error(
          "You must be signed in to save a monitoring plan."
        );
      }

      if (!planName.trim()) {
        throw new Error("Please enter a name for your monitoring plan.");
      }

      if (durationDays < 1 || durationDays > 365) {
        throw new Error("Duration must be between 1 and 365 days.");
      }

      if (scheduleDrafts.length < 1 || scheduleDrafts.length > 12) {
        throw new Error("Choose between 1 and 12 daily check-ins.");
      }

      for (const schedule of scheduleDrafts) {
        if (!schedule.label.trim()) {
          throw new Error("Every check-in needs a name.");
        }

        if (!schedule.start_time || !schedule.end_time) {
          throw new Error(
            "Every check-in needs a start and end time."
          );
        }

        if (schedule.start_time >= schedule.end_time) {
          throw new Error(
            `"${schedule.label}" must end after it starts.`
          );
        }
      }

      if (plan) {
        const { error: updateError } = await supabase
          .from("monitoring_plans")
          .update({
            name: planName.trim(),
            construct: "Stress",
            duration_days: durationDays,
            prompts_per_day: scheduleDrafts.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", plan.id)
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }

        const retainedScheduleIds = scheduleDrafts
          .map((schedule) => schedule.id)
          .filter((id): id is string => Boolean(id));

        const schedulesToDisable = schedules
          .filter(
            (schedule) => !retainedScheduleIds.includes(schedule.id)
          )
          .map((schedule) => schedule.id);

        if (schedulesToDisable.length > 0) {
          const { error: disableError } = await supabase
            .from("monitoring_schedules")
            .update({
              is_active: false,
            })
            .in("id", schedulesToDisable)
            .eq("user_id", user.id);

          if (disableError) {
            throw disableError;
          }
        }

        for (let index = 0; index < scheduleDrafts.length; index += 1) {
          const schedule = scheduleDrafts[index];

          if (schedule.id) {
            const { error: scheduleUpdateError } = await supabase
              .from("monitoring_schedules")
              .update({
                label: schedule.label.trim(),
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                sort_order: index + 1,
                is_active: true,
              })
              .eq("id", schedule.id)
              .eq("user_id", user.id);

            if (scheduleUpdateError) {
              throw scheduleUpdateError;
            }
          } else {
            const { error: scheduleCreateError } = await supabase
              .from("monitoring_schedules")
              .insert({
                user_id: user.id,
                plan_id: plan.id,
                label: schedule.label.trim(),
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                sort_order: index + 1,
                is_active: true,
              });

            if (scheduleCreateError) {
              throw scheduleCreateError;
            }
          }
        }

        setPlanSuccess("Monitoring plan updated.");
      } else {
        const { data: createdPlan, error: createPlanError } = await supabase
          .from("monitoring_plans")
          .insert({
            user_id: user.id,
            name: planName.trim(),
            construct: "Stress",
            duration_days: durationDays,
            prompts_per_day: scheduleDrafts.length,
            status: "active",
          })
          .select("id")
          .single();

        if (createPlanError) {
          throw createPlanError;
        }

        const { error: scheduleError } = await supabase
          .from("monitoring_schedules")
          .insert(
            scheduleDrafts.map((schedule, index) => ({
              user_id: user.id,
              plan_id: createdPlan.id,
              label: schedule.label.trim(),
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              sort_order: index + 1,
              is_active: true,
            }))
          );

        if (scheduleError) {
          throw scheduleError;
        }

        setPlanSuccess("Monitoring plan started.");
      }

      setShowPlanEditor(false);
      await loadMonitoringPlan();
    } catch (error) {
      console.error("Saving monitoring plan failed:", error);

      setPlanError(
        error instanceof Error
          ? error.message
          : "The monitoring plan could not be saved."
      );
    } finally {
      setSavingPlan(false);
    }
  }

  async function saveCheckIn() {
    if (savingEntry || !plan || !selectedScheduleId) {
      return;
    }

    setSavingEntry(true);
    setEntryError("");
    setEntrySuccess("");

    const supabase = createClient();

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be signed in to save a check-in.");
      }

      const { error: saveError } = await supabase
        .from("monitoring_entries")
        .upsert(
          {
            user_id: user.id,
            plan_id: plan.id,
            schedule_id: selectedScheduleId,
            entry_date: getLocalDateString(),
            stress,
            activity,
            note: note.trim() || null,
          },
          {
            onConflict: "user_id,schedule_id,entry_date",
          }
        );

      if (saveError) {
        throw saveError;
      }

      const selectedSchedule = schedules.find(
        (schedule) => schedule.id === selectedScheduleId
      );

      setEntrySuccess(
        `${selectedSchedule?.label || "Check-in"} saved successfully.`
      );
      setNote("");

      await loadTodayEntries(plan.id);
    } catch (error) {
      console.error("Saving check-in failed:", error);

      setEntryError(
        error instanceof Error
          ? error.message
          : "Your check-in could not be saved."
      );
    } finally {
      setSavingEntry(false);
    }
  }

  const activeScheduleIds = new Set(
    schedules.map((schedule) => schedule.id)
  );

  const activeTodayEntries = todayEntries.filter((entry) =>
    activeScheduleIds.has(entry.schedule_id)
  );

  const completedToday = activeTodayEntries.length;
  const totalToday = schedules.length;

  const completionPercentage =
    totalToday > 0
      ? Math.round((completedToday / totalToday) * 100)
      : 0;

  const averageStress =
    activeTodayEntries.length > 0
      ? (
          activeTodayEntries.reduce(
            (total, entry) => total + entry.stress,
            0
          ) / activeTodayEntries.length
        ).toFixed(1)
      : null;

  function scheduleCompleted(scheduleId: string) {
    return activeTodayEntries.some(
      (entry) => entry.schedule_id === scheduleId
    );
  }

  if (loadingPlan) {
    return (
      <Panel title="Daily Monitoring">
        <p className="text-sm text-slate-500">
          Loading your monitoring plan...
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      {/* PLAN EDITOR */}

      {showPlanEditor && (
        <Panel
          title={
            plan ? "Manage monitoring plan" : "Create monitoring plan"
          }
          description="Choose how you want PsyLattice to structure your daily check-ins."
        >
          <div className="space-y-7">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Plan name
              </span>

              <input
                type="text"
                value={planName}
                onChange={(event) => setPlanName(event.target.value)}
                maxLength={100}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Duration
              </span>

              <div className="mt-2 flex max-w-xs items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(event) =>
                    setDurationDays(Number(event.target.value))
                  }
                  className="w-28 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />

                <span className="text-sm text-slate-500">days</span>
              </div>
            </label>

            <div>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Daily check-ins
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Choose how many times you want to check in each day.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={scheduleDrafts.length}
                    onChange={(event) =>
                      changePromptCount(Number(event.target.value))
                    }
                    className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-semibold outline-none focus:border-cyan-700"
                  />

                  <span className="text-sm text-slate-500">/ day</span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {scheduleDrafts.map((schedule, index) => (
                  <div
                    key={schedule.id || `new-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1fr_180px_24px_180px_auto] lg:items-end">
                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Check-in name
                        </span>

                        <input
                          type="text"
                          value={schedule.label}
                          onChange={(event) =>
                            updateSchedule(
                              index,
                              "label",
                              event.target.value
                            )
                          }
                          maxLength={50}
                          placeholder={`Check-in ${index + 1}`}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          From
                        </span>

                        <input
                          type="time"
                          step="60"
                          value={schedule.start_time}
                          onChange={(event) =>
                            updateSchedule(
                              index,
                              "start_time",
                              event.target.value
                            )
                          }
                          className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                        />
                      </label>

                      <div className="hidden pb-3 text-center text-slate-300 lg:block">
                        →
                      </div>

                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Until
                        </span>

                        <input
                          type="time"
                          step="60"
                          value={schedule.end_time}
                          onChange={(event) =>
                            updateSchedule(
                              index,
                              "end_time",
                              event.target.value
                            )
                          }
                          className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => removeSchedule(index)}
                        disabled={scheduleDrafts.length <= 1}
                        title="Remove check-in"
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
                onClick={addSchedule}
                disabled={scheduleDrafts.length >= 12}
                className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add check-in
              </button>

              <p className="mt-2 text-xs text-slate-400">
                Maximum 12 check-ins per day.
              </p>
            </div>

            {planError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{planError}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void saveMonitoringPlan()}
                disabled={savingPlan}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPlan
                  ? "Saving..."
                  : plan
                    ? "Save changes"
                    : "Start monitoring"}
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

      {/* ACTIVE MONITORING PLAN */}

      {plan && !showPlanEditor && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Active monitoring
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
              Manage monitoring
            </button>
          </div>

          {planSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm text-emerald-700">{planSuccess}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Today's check-ins"
              value={
                loadingEntries
                  ? "..."
                  : `${completedToday} / ${totalToday}`
              }
              detail="Completed today"
            />

            <StatCard
              label="Current stress"
              value={
                loadingEntries
                  ? "..."
                  : averageStress
                    ? `${averageStress} / 10`
                    : "No data"
              }
              detail="Average today"
            />

            <StatCard
              label="Completion"
              value={
                loadingEntries ? "..." : `${completionPercentage}%`
              }
              detail="Today's schedule"
            />

            <StatCard
              label="Protocol"
              value={`${plan.duration_days} days`}
              detail={`${plan.prompts_per_day} check-ins / day`}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel
              title="Momentary check-in"
              description="Usually takes less than one minute."
            >
              <div className="mb-7">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    Which check-in are you completing?
                  </span>

                  <select
                    value={selectedScheduleId}
                    onChange={(event) => {
                      setSelectedScheduleId(event.target.value);
                      setEntrySuccess("");
                      setEntryError("");
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
                  >
                    {schedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.label} ·{" "}
                        {schedule.start_time.slice(0, 5)}–
                        {schedule.end_time.slice(0, 5)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">
                    How stressed do you feel right now?
                  </p>

                  <span className="rounded-lg bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800">
                    {stress} / 10
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="10"
                  value={stress}
                  onChange={(event) =>
                    setStress(Number(event.target.value))
                  }
                  className="mt-5 w-full accent-cyan-800"
                />
              </div>

              <div className="mt-7">
                <p className="font-medium">What are you doing right now?</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Studying",
                    "Resting",
                    "Socialising",
                    "Commuting",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setActivity(item)}
                      className={`rounded-full border px-3 py-2 text-xs font-medium ${
                        activity === item
                          ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-7 block">
                <span className="font-medium">Optional note</span>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={2000}
                  placeholder="Anything important about this moment?"
                  className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-cyan-700"
                />
              </label>

              <button
                type="button"
                onClick={() => void saveCheckIn()}
                disabled={savingEntry || !selectedScheduleId}
                className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingEntry ? "Saving..." : "Save check-in"}
              </button>

              {entrySuccess && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-emerald-700">
                    {entrySuccess}
                  </p>
                </div>
              )}

              {entryError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{entryError}</p>
                </div>
              )}
            </Panel>

            <Panel title="Your monitoring schedule">
              {schedules.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {schedules.map((schedule) => {
                    const isDone = scheduleCompleted(schedule.id);

                    return (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{schedule.label}</p>

                            {isDone && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Done
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {isDone
                              ? "Completed today"
                              : "Not completed yet"}
                          </p>
                        </div>

                        <span className="text-xs font-medium text-slate-400">
                          {schedule.start_time.slice(0, 5)}–
                          {schedule.end_time.slice(0, 5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No active check-in windows.
                </p>
              )}

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-500">
                  Your completion status is calculated from the check-ins
                  stored in your PsyLattice account. Automated notifications
                  will be added later.
                </p>
              </div>
            </Panel>
          </div>
        </>
      )}
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
  type ProgressMonitoringPlan = {
    id: string;
    name: string;
    duration_days: number;
    prompts_per_day: number;
    start_date: string;
    status: string;
  };

  type ProgressMonitoringEntry = {
    id: string;
    entry_date: string;
    stress: number;
    created_at: string;
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

  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [progressError, setProgressError] = useState("");

  const [monitoringPlan, setMonitoringPlan] =
    useState<ProgressMonitoringPlan | null>(null);
  const [monitoringEntries, setMonitoringEntries] = useState<
    ProgressMonitoringEntry[]
  >([]);

  const [regulationPlan, setRegulationPlan] =
    useState<ProgressRegulationPlan | null>(null);
  const [regulationActivities, setRegulationActivities] = useState<
    ProgressRegulationActivity[]
  >([]);
  const [regulationCompletions, setRegulationCompletions] = useState<
    ProgressRegulationCompletion[]
  >([]);

  function toLocalDateString(date: Date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function parseLocalDate(dateString: string) {
    return new Date(`${dateString}T00:00:00`);
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

    return Array.from({ length: days }, (_, index) => {
      const daysAgo = days - 1 - index;
      return toLocalDateString(addDays(localToday, -daysAgo));
    });
  }

  function formatHistoryDate(dateString: string) {
    return parseLocalDate(dateString).toLocaleDateString([], {
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
    const end = addDays(start, durationDays - 1);

    return date >= start && date <= end;
  }

  useEffect(() => {
    async function loadProgress() {
      setLoading(true);
      setProgressError("");

      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setProgressError("Your progress data could not be loaded.");
        setLoading(false);
        return;
      }

      const dates = buildDateRange(rangeDays);
      const rangeStart = dates[0];
      const rangeEnd = dates[dates.length - 1];

      const [monitoringPlanResult, regulationPlanResult] = await Promise.all([
        supabase
          .from("monitoring_plans")
          .select(
            "id, name, duration_days, prompts_per_day, start_date, status"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("regulation_plans")
          .select("id, name, duration_days, start_date, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (monitoringPlanResult.error) {
        console.error(
          "Could not load progress monitoring plan:",
          monitoringPlanResult.error
        );
        setProgressError("Your monitoring progress could not be loaded.");
        setLoading(false);
        return;
      }

      if (regulationPlanResult.error) {
        console.error(
          "Could not load progress regulation plan:",
          regulationPlanResult.error
        );
        setProgressError("Your self-regulation progress could not be loaded.");
        setLoading(false);
        return;
      }

      const typedMonitoringPlan = monitoringPlanResult.data
        ? (monitoringPlanResult.data as ProgressMonitoringPlan)
        : null;

      const typedRegulationPlan = regulationPlanResult.data
        ? (regulationPlanResult.data as ProgressRegulationPlan)
        : null;

      setMonitoringPlan(typedMonitoringPlan);
      setRegulationPlan(typedRegulationPlan);

      const monitoringPromise = typedMonitoringPlan
        ? supabase
            .from("monitoring_entries")
            .select("id, entry_date, stress, created_at")
            .eq("user_id", user.id)
            .eq("plan_id", typedMonitoringPlan.id)
            .gte("entry_date", rangeStart)
            .lte("entry_date", rangeEnd)
            .order("entry_date", { ascending: true })
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [], error: null });

      const regulationActivitiesPromise = typedRegulationPlan
        ? supabase
            .from("regulation_activities")
            .select("id, target_per_day")
            .eq("user_id", user.id)
            .eq("plan_id", typedRegulationPlan.id)
            .eq("is_active", true)
        : Promise.resolve({ data: [], error: null });

      const regulationCompletionsPromise = typedRegulationPlan
        ? supabase
            .from("regulation_completions")
            .select(
              "id, activity_id, completion_date, occurrence, completed_at"
            )
            .eq("user_id", user.id)
            .eq("plan_id", typedRegulationPlan.id)
            .gte("completion_date", rangeStart)
            .lte("completion_date", rangeEnd)
            .order("completion_date", { ascending: true })
            .order("completed_at", { ascending: true })
        : Promise.resolve({ data: [], error: null });

      const [
        monitoringEntriesResult,
        regulationActivitiesResult,
        regulationCompletionsResult,
      ] = await Promise.all([
        monitoringPromise,
        regulationActivitiesPromise,
        regulationCompletionsPromise,
      ]);

      if (monitoringEntriesResult.error) {
        console.error(
          "Could not load monitoring progress entries:",
          monitoringEntriesResult.error
        );
        setProgressError("Your monitoring history could not be loaded.");
        setLoading(false);
        return;
      }

      if (regulationActivitiesResult.error) {
        console.error(
          "Could not load regulation progress activities:",
          regulationActivitiesResult.error
        );
        setProgressError("Your self-regulation activities could not be loaded.");
        setLoading(false);
        return;
      }

      if (regulationCompletionsResult.error) {
        console.error(
          "Could not load regulation progress completions:",
          regulationCompletionsResult.error
        );
        setProgressError("Your self-regulation history could not be loaded.");
        setLoading(false);
        return;
      }

      setMonitoringEntries(
        (monitoringEntriesResult.data || []) as ProgressMonitoringEntry[]
      );

      setRegulationActivities(
        (regulationActivitiesResult.data || []) as ProgressRegulationActivity[]
      );

      setRegulationCompletions(
        (regulationCompletionsResult.data ||
          []) as ProgressRegulationCompletion[]
      );

      setLoading(false);
    }

    void loadProgress();
    // Data is reloaded when the selected history range changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const selectedDates = buildDateRange(rangeDays);

  const monitoringRelevantDates = monitoringPlan
    ? selectedDates.filter((date) =>
        dateFallsWithinPlan(
          date,
          monitoringPlan.start_date,
          monitoringPlan.duration_days
        )
      )
    : [];

  const monitoringExpected =
    monitoringRelevantDates.length * (monitoringPlan?.prompts_per_day || 0);

  const monitoringCompleted = monitoringEntries.length;

  const monitoringConsistency =
    monitoringExpected > 0
      ? Math.min(
          100,
          Math.round((monitoringCompleted / monitoringExpected) * 100)
        )
      : 0;

  const averageStress =
    monitoringEntries.length > 0
      ? (
          monitoringEntries.reduce((sum, entry) => sum + entry.stress, 0) /
          monitoringEntries.length
        ).toFixed(1)
      : null;

  const stressProgressValue = averageStress
    ? Math.min(100, Math.round(Number(averageStress) * 10))
    : 0;

  const regulationTargetPerDay = regulationActivities.reduce(
    (sum, activity) => sum + activity.target_per_day,
    0
  );

  const regulationRelevantDates = regulationPlan
    ? selectedDates.filter((date) =>
        dateFallsWithinPlan(
          date,
          regulationPlan.start_date,
          regulationPlan.duration_days
        )
      )
    : [];

  const regulationExpected =
    regulationRelevantDates.length * regulationTargetPerDay;

  const regulationCompleted = regulationCompletions.length;

  const regulationConsistency =
    regulationExpected > 0
      ? Math.min(
          100,
          Math.round((regulationCompleted / regulationExpected) * 100)
        )
      : 0;

  const monitoringPlanDay = (() => {
    if (!monitoringPlan) {
      return null;
    }

    const start = parseLocalDate(monitoringPlan.start_date);
    const todayString = toLocalDateString(new Date());
    const today = parseLocalDate(todayString);

    const difference = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
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

    const start = parseLocalDate(regulationPlan.start_date);
    const todayString = toLocalDateString(new Date());
    const today = parseLocalDate(todayString);

    const difference = Math.floor(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.min(
      regulationPlan.duration_days,
      Math.max(1, difference + 1)
    );
  })();

  const monitoringHistory = [...selectedDates]
    .reverse()
    .map((date) => {
      const entries = monitoringEntries.filter(
        (entry) => entry.entry_date === date
      );

      const expected =
        monitoringPlan &&
        dateFallsWithinPlan(
          date,
          monitoringPlan.start_date,
          monitoringPlan.duration_days
        )
          ? monitoringPlan.prompts_per_day
          : 0;

      const dayAverage =
        entries.length > 0
          ? (
              entries.reduce((sum, entry) => sum + entry.stress, 0) /
              entries.length
            ).toFixed(1)
          : null;

      return {
        date,
        completed: entries.length,
        expected,
        average: dayAverage,
      };
    })
    .filter((day) => day.expected > 0 || day.completed > 0);

  const regulationHistory = [...selectedDates]
    .reverse()
    .map((date) => {
      const completions = regulationCompletions.filter(
        (completion) => completion.completion_date === date
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
    .filter((day) => day.expected > 0 || day.completed > 0);

  const monitoringDaysWithData = monitoringHistory.filter(
    (day) => day.average !== null
  );

  const highestStressDay =
    monitoringDaysWithData.length > 0
      ? monitoringDaysWithData.reduce((highest, day) =>
          Number(day.average) > Number(highest.average) ? day : highest
        )
      : null;

  const lowestStressDay =
    monitoringDaysWithData.length > 0
      ? monitoringDaysWithData.reduce((lowest, day) =>
          Number(day.average) < Number(lowest.average) ? day : lowest
        )
      : null;

  return (
    <div className="space-y-5">
      {/* RANGE */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
            Real progress
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Calculated from your saved Daily Monitoring and Self-Regulation
            records.
          </p>
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          {([7, 14, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                rangeDays === days
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {progressError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{progressError}</p>
        </div>
      )}

      {/* SUMMARY */}

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
          label="Average stress"
          value={
            loading
              ? "..."
              : averageStress
                ? `${averageStress} / 10`
                : "No data"
          }
          detail="Across saved check-ins"
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
              ? `${monitoringPlan.prompts_per_day} check-ins / day`
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

      {/* PLAN PROGRESS */}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Monitoring progress"
          description={
            monitoringPlan
              ? monitoringPlan.name
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
                value={monitoringConsistency}
                text={`${monitoringCompleted} / ${monitoringExpected}`}
              />

              <ProgressBar
                label="Average stress"
                value={stressProgressValue}
                text={averageStress ? `${averageStress} / 10` : "No data"}
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
                    {monitoringPlan.prompts_per_day} / day
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              Create a Daily Monitoring plan and complete check-ins to see
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
                value={regulationConsistency}
                text={`${regulationCompleted} / ${regulationExpected}`}
              />

              <ProgressBar
                label="Plan timeline"
                value={
                  regulationPlanDay
                    ? Math.min(
                        100,
                        Math.round(
                          (regulationPlanDay / regulationPlan.duration_days) *
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
                      Across your active self-regulation activities.
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
              Create a Self-Regulation plan and complete activities to see
              regulation progress here.
            </p>
          )}
        </Panel>
      </div>

      {/* HISTORY */}

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Monitoring history"
          description={`Daily check-in completion and average stress for the last ${rangeDays} days.`}
        >
          {loading ? (
            <p className="text-sm text-slate-500">Loading history...</p>
          ) : monitoringHistory.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {monitoringHistory.map((day) => {
                const percentage =
                  day.expected > 0
                    ? Math.min(
                        100,
                        Math.round((day.completed / day.expected) * 100)
                      )
                    : 0;

                return (
                  <div
                    key={day.date}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[90px_1fr_auto] sm:items-center"
                  >
                    <p className="text-sm font-medium">
                      {formatHistoryDate(day.date)}
                    </p>

                    <div>
                      <p className="text-sm text-slate-600">
                        {day.completed} / {day.expected} check-ins
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-cyan-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      {day.average
                        ? `Avg ${day.average} / 10`
                        : "No stress data"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              No monitoring records are available in this range yet.
            </p>
          )}
        </Panel>

        <Panel
          title="Self-regulation history"
          description={`Daily activity completion for the last ${rangeDays} days.`}
        >
          {loading ? (
            <p className="text-sm text-slate-500">Loading history...</p>
          ) : regulationHistory.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {regulationHistory.map((day) => {
                const percentage =
                  day.expected > 0
                    ? Math.min(
                        100,
                        Math.round((day.completed / day.expected) * 100)
                      )
                    : 0;

                return (
                  <div
                    key={day.date}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[90px_1fr_auto] sm:items-center"
                  >
                    <p className="text-sm font-medium">
                      {formatHistoryDate(day.date)}
                    </p>

                    <div>
                      <p className="text-sm text-slate-600">
                        {day.completed} / {day.expected} activities
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-cyan-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              No self-regulation records are available in this range yet.
            </p>
          )}
        </Panel>
      </div>

      {/* DESCRIPTIVE SUMMARY */}

      <Panel title="Patterns to inspect">
        {!loading &&
        highestStressDay &&
        lowestStressDay &&
        monitoringDaysWithData.length >= 2 ? (
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <div className="flex items-start gap-4">
              <Icon>↗</Icon>

              <div>
                <p className="font-medium">Descriptive monitoring summary</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Within this {rangeDays}-day view, the highest daily average
                  stress recorded was {highestStressDay.average}/10 on{" "}
                  {formatHistoryDate(highestStressDay.date)}, while the lowest
                  was {lowestStressDay.average}/10 on{" "}
                  {formatHistoryDate(lowestStressDay.date)}. These values
                  describe your saved check-ins only and do not establish cause
                  or provide a clinical conclusion.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="font-medium">More data is needed</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete monitoring check-ins on at least two different days to
              see a simple descriptive comparison here.
            </p>
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Progress summaries are based on the records stored in your PsyLattice
          account. They are intended for personal reflection and do not provide
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

function Notifications() {
  return (
    <div className="space-y-5">
      <Panel title="Your reminder rhythm">
        <div className="divide-y divide-slate-100">
          {[
            ["Morning check-in", "One prompt between 08:00–10:00"],
            ["Afternoon check-in", "One prompt between 15:00–17:00"],
            ["Evening reflection", "20:30"],
            ["Self-regulation reminder", "After a long study period"],
          ].map(([title, description]) => (
            <div
              key={title}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <div className="relative h-6 w-11 rounded-full bg-cyan-700">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Quiet hours">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Start</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>22:30</option>
              <option>23:00</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">End</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>08:00</option>
              <option>07:30</option>
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-2xl bg-cyan-50 p-4">
          <p className="font-medium text-cyan-950">Useful, not intrusive.</p>

          <p className="mt-2 text-sm leading-6 text-cyan-900/70">
            You remain in control of reminder timing, frequency and quiet
            hours.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   PRIVACY
   ========================================================= */

function Privacy() {
  return (
    <div className="space-y-5">
      <Panel title="Your privacy">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Self-assessment data",
              "Private to your personal account",
              "Private",
            ],
            [
              "AI Guide conversations",
              "Used only within your personal workflow",
              "Private",
            ],
            [
              "Wearable signals",
              "Sleep, activity and resting heart rate",
              "3 signals",
            ],
            [
              "Therapist sharing",
              "No automatic sharing",
              "You control it",
            ],
          ].map(([title, description, status]) => (
            <div
              key={title}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {status}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Therapist sharing">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <p className="font-medium">
            Nothing is automatically sent to a therapist.
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            You choose which assessments, progress summaries, ambulatory
            trends or wearable summaries appear in a therapist summary.
          </p>

          <button
            type="button"
            className="mt-5 rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-900"
          >
            Prepare therapist summary
          </button>
        </div>
      </Panel>

      <Panel title="Data controls">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 p-4 text-left"
          >
            <p className="text-sm font-medium">Download my data</p>
            <p className="mt-1 text-xs text-slate-400">
              Request a portable copy of your PsyLattice information.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-slate-200 p-4 text-left"
          >
            <p className="text-sm font-medium">Consent centre</p>
            <p className="mt-1 text-xs text-slate-400">
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
  const [fullName, setFullName] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "PL";

  const activeNavigation = navigation.find(
    (item) => item.id === screen,
  )!;

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return <Dashboard changeScreen={setScreen} />;

      case "ai":
        return <AIGuide changeScreen={setScreen} />;

      case "assessments":
        return <Assessments />;

      case "monitoring":
        return <Monitoring />;

      case "regulation":
        return <Regulation />;

      case "progress":
        return <Progress />;

      case "wearables":
        return <Wearables />;

      case "notifications":
        return <Notifications />;

      case "privacy":
        return <Privacy />;

      default:
        return <Dashboard changeScreen={setScreen} />;
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

      case "notifications":
        return "Control how and when PsyLattice reminds you to check in.";

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

          {/* Desktop account controls */}

          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800">
              For myself
            </span>

            <div
              title={fullName || "PsyLattice user"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
            >
              {initials}
            </div>

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
            className="max-w-[190px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm lg:hidden"
          >
            {navigation.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
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
    {navigation.slice(0, 8).map((item) => {
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
            className={`flex shrink-0 items-center justify-center ${
              sidebarCollapsed
                ? "h-8 w-8 rounded-lg text-[11px] font-semibold"
                : ""
            } ${
              sidebarCollapsed && active
                ? "bg-cyan-100 text-cyan-900"
                : ""
            }`}
          >
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

    {item.id === "ai" && (
      <span className="rounded-full border border-yellow-500 bg-yellow-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-yellow-500">
        New
      </span>
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
          The account itself is now authenticated.
          Assessment and monitoring information
          shown here is still demo data.
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
                    ? `Good afternoon, ${firstName}.`
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