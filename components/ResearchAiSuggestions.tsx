"use client";

import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  FileText,
  Gauge,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SuggestionStatus =
  | "complete"
  | "attention"
  | "in_progress"
  | "not_applicable"
  | "unavailable";

type SuggestionSeverity = "info" | "low" | "medium" | "high";

type HealthAction = {
  target: string;
  label: string;
  studyId?: string;
};

type HealthCheck = {
  id: string;
  section: string;
  label: string;
  status: SuggestionStatus;
  severity: SuggestionSeverity;
  origin: "deterministic" | "semantic_ai";
  detail: string;
  action?: HealthAction | null;
};

type HealthSection = {
  id: string;
  label: string;
  checks: HealthCheck[];
  counts?: {
    complete?: number;
    attention?: number;
    inProgress?: number;
    unavailable?: number;
  };
};

type HealthNextAction = {
  checkId: string;
  section: string;
  label: string;
  detail: string;
  status: SuggestionStatus;
  severity: SuggestionSeverity;
  action: HealthAction;
};

type StudyHealthReport = {
  generatedAt?: string;
  study: {
    id: string;
    title: string;
    status?: string;
    design?: string | null;
  };
  readiness: {
    completed: number;
    applicable: number;
    attention: number;
    inProgress: number;
    unavailable: number;
    percent: number | null;
  };
  sections: HealthSection[];
  nextActions: HealthNextAction[];
  capabilities?: {
    semanticAiAudits?: {
      enabled?: boolean;
      available?: boolean;
      activeFindings?: number;
      latestRunAt?: string | null;
    };
  };
};

type PlanAction = {
  type?: string;
  target?: string;
  label?: string;
} | null;

type ResearchPlanLike = {
  title?: string;
  summary?: string;
  manual_completed_task_ids?: string[];
  stages?: Array<{
    id?: string;
    title?: string;
    tasks?: Array<{
      id?: string;
      title?: string;
      detail?: string;
      completion?: "auto" | "manual";
      action?: PlanAction;
    }>;
  }>;
};

type Props = {
  studyId: string;
  studyTitle?: string;
  researchPlan?: ResearchPlanLike | null;
  navigationEnabled: boolean;
  onNavigate: (target: string) => void;
  onOpenResearchPlan: () => void;
};

function readinessTone(percent: number | null) {
  if (percent === null) {
    return {
      text: "text-slate-700",
      border: "border-slate-200",
      fill: "bg-slate-300",
      chip: "border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  if (percent >= 80) {
    return {
      text: "text-emerald-700",
      border: "border-emerald-200",
      fill: "bg-emerald-500",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (percent >= 60) {
    return {
      text: "text-amber-700",
      border: "border-amber-200",
      fill: "bg-amber-500",
      chip: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    text: "text-rose-700",
    border: "border-rose-200",
    fill: "bg-rose-500",
    chip: "border-rose-200 bg-rose-50 text-rose-700",
  };
}

function findingTone(
  status: SuggestionStatus,
  severity: SuggestionSeverity,
) {
  if (status === "attention" || severity === "high") {
    return {
      dot: "bg-rose-500",
      text: "text-rose-700",
      chip: "border-rose-200 bg-rose-50 text-rose-700",
      border: "border-rose-200/80",
    };
  }

  if (status === "in_progress" || severity === "medium") {
    return {
      dot: "bg-amber-500",
      text: "text-amber-700",
      chip: "border-amber-200 bg-amber-50 text-amber-700",
      border: "border-amber-200/80",
    };
  }

  if (status === "complete") {
    return {
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
      border: "border-emerald-200/80",
    };
  }

  return {
    dot: "bg-slate-400",
    text: "text-slate-600",
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    border: "border-slate-200",
  };
}

function statusLabel(status: SuggestionStatus) {
  if (status === "attention") return "Needs attention";
  if (status === "in_progress") return "In progress";
  if (status === "complete") return "Complete";
  if (status === "unavailable") return "Unavailable";
  return "Not applicable";
}

function trimDetail(value: string, max = 165) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export default function ResearchAiSuggestions({
  studyId,
  studyTitle = "",
  researchPlan = null,
  navigationEnabled,
  onNavigate,
  onOpenResearchPlan,
}: Props) {
  const [report, setReport] = useState<StudyHealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadSuggestions(mode: "load" | "refresh" = "load") {
    if (!studyId) {
      setReport(null);
      setError("");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const response = await fetch(
        `/api/research/study-health?study_id=${encodeURIComponent(studyId)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok || !payload?.report) {
        throw new Error(
          payload?.error || "PsyLattice could not load study suggestions.",
        );
      }

      setReport(payload.report as StudyHealthReport);
    } catch (failure) {
      setReport(null);
      setError(
        failure instanceof Error
          ? failure.message
          : "PsyLattice could not load study suggestions.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadSuggestions("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const aiFindings = useMemo(() => {
    if (!report) return [];

    return report.sections
      .flatMap((section) => section.checks || [])
      .filter(
        (check) =>
          check.origin === "semantic_ai" &&
          (check.status === "attention" || check.status === "in_progress"),
      )
      .slice(0, 4);
  }, [report]);

  const primaryAction = report?.nextActions?.[0] || null;

  const otherHealthActions = useMemo(() => {
    if (!report) return [];
    return report.nextActions
      .slice(1)
      .filter(
        (item) =>
          !primaryAction || item.checkId !== primaryAction.checkId,
      )
      .slice(0, 4);
  }, [primaryAction, report]);

  const pendingManualPlanTasks = useMemo(() => {
    if (!researchPlan?.stages?.length) return [];

    const completed = new Set(
      researchPlan.manual_completed_task_ids || [],
    );

    return researchPlan.stages
      .flatMap((stage) =>
        (stage.tasks || []).map((task) => ({
          ...task,
          stageTitle: stage.title || "Research plan",
        })),
      )
      .filter(
        (task) =>
          task.completion === "manual" &&
          Boolean(task.id) &&
          !completed.has(task.id || ""),
      )
      .slice(0, 3);
  }, [researchPlan]);

  function navigate(target?: string) {
    if (!target || !navigationEnabled) return;
    onNavigate(target);
  }

  function openStudyHealth() {
    if (!navigationEnabled) return;

    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(
          "psylattice.study-health.focus.v1",
          JSON.stringify({
            studyId,
            requestedAt: Date.now(),
          }),
        );
      } catch {
        // Navigation still works if session storage is unavailable.
      }
    }

    onNavigate("studies");

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        document
          .getElementById("study-health")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 550);
    }
  }

  if (!studyId) {
    return (
      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-900">
              Select a study environment
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Suggestions are study-specific. Choose an AI environment above
              and PsyLattice will read the saved Study Health state for that
              environment&apos;s study.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
          <div>
            <p className="text-[12px] font-semibold text-slate-800">
              Building suggestions
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Reading the current Study Health state for{" "}
              {studyTitle || "this study"}.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !report) {
    return (
      <section className="rounded-[22px] border border-rose-200 bg-rose-50/50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-rose-800">
              Suggestions are temporarily unavailable
            </p>
            <p className="mt-1 text-[10px] leading-4.5 text-rose-700/80">
              {error}
            </p>
            <button
              type="button"
              onClick={() => void loadSuggestions("refresh")}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[10px] font-semibold text-rose-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  const readiness = readinessTone(report.readiness.percent);
  const aiFindingCount =
    report.capabilities?.semanticAiAudits?.activeFindings ??
    aiFindings.length;

  return (
    <div className="space-y-3.5">
      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,.055)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-cyan-700" />
              <p className="text-[11px] font-semibold uppercase tracking-[.09em] text-slate-500">
                Study Health
              </p>
            </div>
            <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">
              {report.study.title || studyTitle || "Active study"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSuggestions("refresh")}
            disabled={refreshing}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-50"
            title="Refresh suggestions"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[125px_minmax(0,1fr)]">
          <div
            className={`rounded-2xl border ${readiness.border} bg-slate-50/60 p-3.5`}
          >
            <div
              className={`text-[28px] font-semibold leading-none tracking-[-.045em] ${readiness.text}`}
            >
              {report.readiness.percent ?? "—"}
              {report.readiness.percent !== null ? (
                <span className="ml-0.5 text-[12px]">%</span>
              ) : null}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${readiness.fill}`}
                style={{
                  width: `${report.readiness.percent ?? 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[9px] leading-4 text-slate-500">
              {report.readiness.completed} of{" "}
              {report.readiness.applicable} scored checks complete
            </p>
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-1.5">
                {report.readiness.attention > 0 ? (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[9px] font-semibold text-rose-700">
                    {report.readiness.attention} need attention
                  </span>
                ) : null}
                {report.readiness.inProgress > 0 ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-semibold text-amber-700">
                    {report.readiness.inProgress} in progress
                  </span>
                ) : null}
                {aiFindingCount > 0 ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-semibold text-slate-600">
                    {aiFindingCount} AI review finding
                    {aiFindingCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-[10px] leading-4.5 text-slate-500">
                Suggestions are derived from the saved Study Health report for
                the active environment. Opening this tab does not run another
                AI request.
              </p>
            </div>

            <button
              type="button"
              disabled={!navigationEnabled}
              onClick={openStudyHealth}
              className="inline-flex self-start items-center gap-1.5 text-[10px] font-semibold text-cyan-800 transition hover:text-cyan-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Open full Study Health
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </section>

      {primaryAction ? (
        <section
          className={`rounded-[22px] border ${
            findingTone(primaryAction.status, primaryAction.severity).border
          } bg-white p-4 shadow-[0_6px_20px_rgba(15,23,42,.045)]`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-3.5 w-3.5 ${
                findingTone(
                  primaryAction.status,
                  primaryAction.severity,
                ).text
              }`}
            />
            <p className="text-[9px] font-semibold uppercase tracking-[.1em] text-slate-400">
              Recommended next step
            </p>
          </div>

          <p className="mt-2.5 text-[14px] font-semibold tracking-[-.01em] text-slate-900">
            {primaryAction.label}
          </p>
          <p className="mt-1.5 text-[10px] leading-4.5 text-slate-500">
            {trimDetail(primaryAction.detail, 230)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${
                findingTone(
                  primaryAction.status,
                  primaryAction.severity,
                ).chip
              }`}
            >
              {statusLabel(primaryAction.status)}
            </span>

            <button
              type="button"
              disabled={!navigationEnabled}
              onClick={() => navigate(primaryAction.action.target)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {primaryAction.action.label}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-[22px] border border-emerald-200 bg-emerald-50/55 p-4">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="text-[12px] font-semibold text-emerald-900">
                No priority Study Health action right now
              </p>
              <p className="mt-1 text-[10px] leading-4.5 text-emerald-800/75">
                PsyLattice did not find a current deterministic action that
                needs to be promoted as the next step.
              </p>
            </div>
          </div>
        </section>
      )}

      {(otherHealthActions.length > 0 ||
        aiFindings.length > 0 ||
        pendingManualPlanTasks.length > 0) ? (
        <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,.04)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-slate-500" />
              <p className="text-[11px] font-semibold text-slate-900">
                Other suggestions
              </p>
            </div>
            <span className="text-[9px] text-slate-400">
              real saved state
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {otherHealthActions.map((item) => {
              const tone = findingTone(item.status, item.severity);

              return (
                <button
                  key={`health-${item.checkId}`}
                  type="button"
                  disabled={!navigationEnabled}
                  onClick={() => navigate(item.action.target)}
                  className="group flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/55 px-3 py-2.5 text-left transition hover:border-slate-200 hover:bg-white disabled:cursor-not-allowed"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.dot}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold text-slate-800">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[9px] leading-4 text-slate-500">
                      {trimDetail(item.detail)}
                    </span>
                  </span>
                  <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                </button>
              );
            })}

            {aiFindings.map((finding) => (
              <button
                key={`ai-${finding.id}`}
                type="button"
                disabled={!navigationEnabled || !finding.action?.target}
                onClick={() => navigate(finding.action?.target)}
                className="group flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/55 px-3 py-2.5 text-left transition hover:border-slate-200 hover:bg-white disabled:cursor-not-allowed"
              >
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-slate-800">
                    {finding.label}
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-4 text-slate-500">
                    {trimDetail(finding.detail)}
                  </span>
                </span>
                <span className="mt-0.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[.06em] text-slate-500">
                  AI review
                </span>
              </button>
            ))}

            {pendingManualPlanTasks.map((task) => (
              <button
                key={`plan-${task.id}`}
                type="button"
                onClick={() =>
                  task.action?.target && navigationEnabled
                    ? navigate(task.action.target)
                    : onOpenResearchPlan()
                }
                className="group flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/55 px-3 py-2.5 text-left transition hover:border-slate-200 hover:bg-white"
              >
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-slate-800">
                    {task.title || "Research plan task"}
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-4 text-slate-500">
                    {task.stageTitle}
                    {task.detail
                      ? ` · ${trimDetail(task.detail, 130)}`
                      : ""}
                  </span>
                </span>
                <span className="mt-0.5 rounded-full border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[.06em] text-cyan-700">
                  Plan
                </span>
              </button>
            ))}
          </div>

          {researchPlan ? (
            <button
              type="button"
              onClick={onOpenResearchPlan}
              className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-semibold text-slate-500 transition hover:text-slate-800"
            >
              <FileText className="h-3 w-3" />
              Open Research Plan
            </button>
          ) : null}
        </section>
      ) : null}

      {!navigationEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[9px] leading-4 text-amber-800">
          Navigation actions are disabled in Permissions. Suggestions remain
          visible, but PsyLattice will not move between modules until that
          permission is enabled.
        </div>
      ) : null}
    </div>
  );
}
