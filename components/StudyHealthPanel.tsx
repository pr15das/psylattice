"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  FileText,
  FlaskConical,
  Gauge,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  StudyHealthCheck,
  StudyHealthReport,
  StudyHealthScreenTarget,
  StudyHealthSection,
  StudyHealthStatus,
} from "@/lib/research/health/types";

type Props = {
  studyId: string;
  onNavigate: (target: StudyHealthScreenTarget) => void;
};

function statusLabel(status: StudyHealthStatus) {
  if (status === "complete") return "Complete";
  if (status === "attention") return "Needs attention";
  if (status === "in_progress") return "In progress";
  if (status === "not_applicable") return "Not applicable";
  return "Unavailable";
}

function statusClasses(status: StudyHealthStatus) {
  if (status === "complete") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }
  if (status === "attention") {
    return "border-rose-300 bg-rose-50 text-rose-800";
  }
  if (status === "in_progress") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  if (status === "not_applicable") {
    return "border-slate-200 bg-slate-50 text-slate-500";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function severityClasses(severity: StudyHealthCheck["severity"]) {
  if (severity === "high") {
    return "border-rose-300 bg-rose-50 text-rose-800";
  }
  if (severity === "medium") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  if (severity === "low") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  return "border-cyan-200 bg-cyan-50 text-cyan-700";
}

function severityLabel(severity: StudyHealthCheck["severity"]) {
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  if (severity === "low") return "Low";
  return "Info";
}

function StatusIcon({ status }: { status: StudyHealthStatus }) {
  if (status === "complete") {
    return <Check className="h-3.5 w-3.5" />;
  }
  if (status === "attention") {
    return <AlertTriangle className="h-3.5 w-3.5" />;
  }
  if (status === "in_progress") {
    return <Clock3 className="h-3.5 w-3.5" />;
  }
  return <CircleDot className="h-3.5 w-3.5" />;
}

function healthTone(percent: number | null) {
  if (percent === null) {
    return {
      ring: "border-slate-200",
      text: "text-slate-600",
      bar: "bg-slate-300",
    };
  }
  if (percent >= 80) {
    return {
      ring: "border-emerald-200",
      text: "text-emerald-700",
      bar: "bg-emerald-500",
    };
  }
  if (percent >= 60) {
    return {
      ring: "border-cyan-200",
      text: "text-cyan-700",
      bar: "bg-cyan-600",
    };
  }
  return {
    ring: "border-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-500",
  };
}

function SectionCheck({
  check,
  onNavigate,
}: {
  check: StudyHealthCheck;
  onNavigate: (target: StudyHealthScreenTarget) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_5px_16px_rgba(15,23,42,.045)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClasses(
                check.status,
              )}`}
            >
              <StatusIcon status={check.status} />
              {statusLabel(check.status)}
            </span>

            {check.origin === "semantic_ai" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                <Sparkles className="h-3 w-3" />
                AI audit
              </span>
            ) : null}

            {check.severity !== "info" ? (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${severityClasses(
                  check.severity,
                )}`}
              >
                {severityLabel(check.severity)}
              </span>
            ) : null}
          </div>

          <p className="mt-2.5 text-[13px] font-semibold text-slate-900">
            {check.label}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-slate-500">
            {check.detail}
          </p>

          {check.evidence.length > 0 ? (
            <details className="mt-2.5">
              <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[.08em] text-slate-400 transition hover:text-slate-600">
                Evidence
              </summary>
              <div className="mt-2 space-y-1.5 border-l-2 border-slate-100 pl-3">
                {check.evidence.map((item, index) => (
                  <p
                    key={`${check.id}-evidence-${index}`}
                    className="text-[11px] leading-4.5 text-slate-500"
                  >
                    <span className="font-semibold text-slate-600">
                      {item.source}
                    </span>
                    {" · "}
                    {item.summary}
                  </p>
                ))}
              </div>
            </details>
          ) : null}
        </div>

        {check.action ? (
          <button
            type="button"
            onClick={() => onNavigate(check.action!.target)}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
          >
            {check.action.label}
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function HealthSection({
  section,
  onNavigate,
  defaultOpen,
  forceOpenToken = 0,
}: {
  section: StudyHealthSection;
  onNavigate: (target: StudyHealthScreenTarget) => void;
  defaultOpen: boolean;
  forceOpenToken?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpenToken > 0) setOpen(true);
  }, [forceOpenToken]);

  if (section.state === "not_enabled") {
    return (
      <div
        id={`study-health-section-${section.id}`}
        className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3.5"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-700">
              {section.label}
            </p>
            <p className="mt-1 text-[11px] leading-4.5 text-slate-500">
              {section.note ||
                "This audit layer is not enabled yet, so PsyLattice is not making a judgement here."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`study-health-section-${section.id}`}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/45"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-white/70"
      >
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-slate-800">
            {section.label}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium">
            <span className="text-emerald-700">
              {section.counts.complete} complete
            </span>
            {section.counts.attention ? (
              <span className="text-rose-700">
                {section.counts.attention} need attention
              </span>
            ) : null}
            {section.counts.inProgress ? (
              <span className="text-amber-700">
                {section.counts.inProgress} in progress
              </span>
            ) : null}
            {section.counts.unavailable ? (
              <span className="text-rose-600">
                {section.counts.unavailable} unavailable
              </span>
            ) : null}
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="space-y-2.5 border-t border-slate-200/70 p-3">
          {section.checks.length > 0 ? (
            section.checks.map((check) => (
              <SectionCheck
                key={check.id}
                check={check}
                onNavigate={onNavigate}
              />
            ))
          ) : (
            <p className="px-1 py-2 text-[11px] text-slate-400">
              No checks are currently produced for this section.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function StudyHealthPanel({ studyId, onNavigate }: Props) {
  const [report, setReport] = useState<StudyHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditNotice, setAuditNotice] = useState<{
    message: string;
    kind: "success" | "error";
    findingCount: number;
    targetSection: "writing" | "reporting";
  } | null>(null);
  const [drawerRequest, setDrawerRequest] = useState<{
    sectionId: "writing" | "reporting";
    token: number;
  } | null>(null);
  const [auditMode, setAuditMode] = useState<
    "thesis_citation_coverage" | "thesis_writing_quality" | "research_logic"
  >("thesis_citation_coverage");
  const [includeReferenceLibrary, setIncludeReferenceLibrary] = useState(false);

  async function loadHealth(mode: "load" | "refresh" = "load") {
    if (!studyId) return;

    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/research/study-health?study_id=${encodeURIComponent(studyId)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok || !payload?.report) {
        throw new Error(payload?.error || "Study Health could not be loaded.");
      }

      setReport(payload.report as StudyHealthReport);
    } catch (failure) {
      setReport(null);
      setError(
        failure instanceof Error
          ? failure.message
          : "Study Health could not be loaded.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function runSemanticAudit() {
    if (!studyId || auditRunning) return;

    setAuditRunning(true);
    setAuditNotice(null);

    try {
      const response = await fetch("/api/research/study-health/semantic-audit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyId,
          auditType: auditMode,
          includeReferenceLibrary:
            auditMode === "thesis_citation_coverage" && includeReferenceLibrary,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.error || "The AI research review could not be completed.",
        );
      }

      const provider =
        payload?.provider && payload?.providerModel
          ? ` · ${payload.provider} / ${payload.providerModel}`
          : "";

      setAuditNotice({
        message: `${payload.message || "AI research review completed."}${provider}`,
        kind: "success",
        findingCount: Number(payload?.findingCount || 0),
        targetSection:
          auditMode === "research_logic" ? "reporting" : "writing",
      });
      await loadHealth("refresh");
    } catch (failure) {
      setAuditNotice({
        message:
          failure instanceof Error
            ? failure.message
            : "The AI research review could not be completed.",
        kind: "error",
        findingCount: 0,
        targetSection:
          auditMode === "research_logic" ? "reporting" : "writing",
      });
    } finally {
      setAuditRunning(false);
    }
  }

  function openRecommendationDrawer(sectionId: "writing" | "reporting") {
    const token = Date.now();
    setDrawerRequest({ sectionId, token });

    window.setTimeout(() => {
      document
        .getElementById(`study-health-section-${sectionId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  useEffect(() => {
    void loadHealth("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const sourceCoverage = useMemo(() => {
    if (!report) return { readable: 0, total: 0, unavailable: 0 };
    const rows = Object.values(report.sourceState);
    const readable = rows.filter((row) => row.ok).length;
    return {
      readable,
      total: rows.length,
      unavailable: rows.length - readable,
    };
  }, [report]);

  if (loading) {
    return (
      <section className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fbfdff,#f8fbff)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-100 bg-white text-cyan-700 shadow-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-slate-900">
              Building Study Health
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Reading the saved state of this study.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !report) {
    return (
      <section className="rounded-[24px] border border-rose-200 bg-rose-50/45 p-5">
        <p className="text-[13px] font-semibold text-rose-800">
          Study Health could not be loaded
        </p>
        <p className="mt-1.5 text-[11px] leading-5 text-rose-700/80">
          {error || "No health report was returned."}
        </p>
        <button
          type="button"
          onClick={() => void loadHealth("refresh")}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[11px] font-semibold text-rose-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </section>
    );
  }

  const tone = healthTone(report.readiness.percent);
  const percent = report.readiness.percent;
  const actionable = report.nextActions.slice(0, 3);
  const activeSections = report.sections.filter(
    (section) => section.state === "active",
  );
  const futureSections = report.sections.filter(
    (section) => section.state === "not_enabled",
  );

  return (
    <section
      id="study-health"
      className="overflow-hidden rounded-[26px] border border-slate-200/90 bg-[linear-gradient(145deg,rgba(255,255,255,.99),rgba(248,251,255,.98))] shadow-[0_10px_36px_rgba(15,23,42,.065)]"
    >
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-800">
              <Gauge className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-semibold tracking-[-.01em] text-slate-950">
                  Study Health
                </h3>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                  Deterministic
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">
                Research-readiness checks derived from the saved state of this
                study. PsyLattice does not use AI to calculate this score.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => void loadHealth("refresh")}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:border-cyan-200 hover:text-cyan-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">

        <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">
          <div
            className={`rounded-[22px] border border-slate-800 bg-[linear-gradient(145deg,#172033,#0f172a)] p-4 text-white shadow-[0_10px_28px_rgba(15,23,42,.18)]`}
          >
            <p className="text-[9px] font-semibold uppercase tracking-[.11em] text-slate-300">
              Research readiness
            </p>
            <div className="mt-3 flex items-end gap-1">
              <span
                className="text-[38px] font-semibold leading-none tracking-[-.05em] text-white"
              >
                {percent === null ? "—" : percent}
              </span>
              {percent !== null ? (
                <span className="mb-1 text-[15px] font-semibold text-slate-300">
                  %
                </span>
              ) : null}
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-full rounded-full ${
                  percent === null
                    ? "bg-slate-400"
                    : percent >= 80
                      ? "bg-emerald-400"
                      : percent >= 60
                        ? "bg-amber-400"
                        : "bg-rose-400"
                }`}
                style={{ width: `${percent ?? 0}%` }}
              />
            </div>

            <p className="mt-3 text-[11px] leading-4.5 text-slate-300">
              {report.readiness.completed} of {report.readiness.applicable}{" "}
              scored checks complete.
            </p>

            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="text-[10px] font-semibold text-slate-200">
                Source coverage
              </p>
              <p className="mt-1 text-[10px] leading-4 text-slate-300">
                {sourceCoverage.readable}/{sourceCoverage.total} PsyLattice
                sources readable
                {sourceCoverage.unavailable > 0
                  ? ` · ${sourceCoverage.unavailable} unavailable`
                  : " · full current coverage"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-300 bg-[linear-gradient(145deg,#eef2f7,#e6ebf2)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.075)]">
              <FlaskConical className="h-4 w-4 text-cyan-700" />
              <p className="mt-3 text-[20px] font-semibold tracking-[-.03em] text-slate-900">
                {report.metrics.protocol.baselineMeasures}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Baseline measures
              </p>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-[linear-gradient(145deg,#eef2f7,#e6ebf2)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.075)]">
              <CircleDot className="h-4 w-4 text-cyan-700" />
              <p className="mt-3 text-[20px] font-semibold tracking-[-.03em] text-slate-900">
                {report.metrics.recruitment.liveParticipants}
                {report.metrics.recruitment.targetSampleSize
                  ? ` / ${report.metrics.recruitment.targetSampleSize}`
                  : ""}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Live participants
              </p>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-[linear-gradient(145deg,#eef2f7,#e6ebf2)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.075)]">
              <FileText className="h-4 w-4 text-cyan-700" />
              <p className="mt-3 text-[20px] font-semibold tracking-[-.03em] text-slate-900">
                {report.metrics.writing.linkedDocuments}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Linked Thesis files
              </p>
            </div>

            <div className="rounded-2xl border border-slate-300 bg-[linear-gradient(145deg,#eef2f7,#e6ebf2)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.075)]">
              <ShieldCheck className="h-4 w-4 text-cyan-700" />
              <p className="mt-3 text-[20px] font-semibold tracking-[-.03em] text-slate-900">
                {report.metrics.writing.linkedReferences}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Linked references
              </p>
            </div>
          </div>
        </div>

        {actionable.length > 0 ? (
          <section
            data-psylattice-health-hierarchy="v4"
            className="mt-5 overflow-hidden rounded-[26px] border border-slate-800 bg-[linear-gradient(145deg,#152033,#0f172a)] shadow-[0_12px_34px_rgba(15,23,42,.16)]"
          >
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-cyan-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-[.12em]">
                    Recommended next step
                  </span>
                </div>

                <p className="mt-3 text-[18px] font-semibold tracking-[-.02em] text-white sm:text-[20px]">
                  {actionable[0].label}
                </p>
                <p className="mt-2 max-w-2xl text-[12px] leading-5 text-slate-300">
                  {actionable[0].detail}
                </p>

                <button
                  type="button"
                  onClick={() => onNavigate(actionable[0].action.target)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11px] font-semibold text-slate-900 shadow-sm transition hover:bg-cyan-50"
                >
                  {actionable[0].action.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="border-t border-white/10 bg-white/[.045] p-4 sm:p-5 lg:border-l lg:border-t-0">
                <p className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">
                  After that
                </p>

                <div className="mt-3 space-y-2">
                  {actionable.slice(1, 4).map((item) => (
                    <button
                      key={item.checkId}
                      type="button"
                      onClick={() => onNavigate(item.action.target)}
                      className="group flex w-full items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.055] p-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[.09]"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-white">
                          {item.label}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">
                          {item.detail}
                        </p>
                      </div>
                      <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
                    </button>
                  ))}

                  {actionable.length <= 1 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[.04] px-3 py-4 text-[10px] leading-4 text-slate-400">
                      No additional high-priority actions are currently queued.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section
          data-psylattice-semantic-audit-panel="v5"
          className="mt-5 overflow-hidden rounded-[26px] border border-slate-300 bg-white shadow-[0_12px_34px_rgba(15,23,42,.09)]"
        >
          <div className="flex flex-col gap-4 bg-[linear-gradient(135deg,#111827,#1e293b)] px-5 py-5 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-violet-200 shadow-inner">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-violet-300">
                    AI Research Review
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.08em] text-slate-300">
                    Separate from readiness score
                  </span>
                </div>
                <h4 className="mt-2 text-[17px] font-semibold tracking-[-.02em] text-white sm:text-[19px]">
                  Semantic review of your linked research writing
                </h4>
                <p className="mt-1.5 max-w-3xl text-[11px] leading-5 text-slate-300 sm:text-[12px]">
                  Use AI as a deeper research-quality layer alongside deterministic Study Health. Citation integrity, academic writing quality, and cross-module research-logic review are active now.
                </p>
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/10 bg-white/[.06] px-3.5 py-2.5 text-[10px] leading-4 text-slate-300">
              <span className="font-semibold text-white">
                {report.capabilities.semanticAiAudits.activeFindings}
              </span>{" "}
              active AI finding{report.capabilities.semanticAiAudits.activeFindings === 1 ? "" : "s"}
              <span className="mx-2 text-slate-600">•</span>
              {report.capabilities.semanticAiAudits.latestRunAt
                ? "Latest audit available"
                : "Not run yet"}
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                  Current review · {auditMode === "thesis_citation_coverage"
                    ? "Citation integrity"
                    : auditMode === "thesis_writing_quality"
                      ? "Writing quality"
                      : "Research logic"}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                  Thesis files: {report.metrics.writing.linkedDocuments}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                  Linked references: {report.metrics.writing.linkedReferences}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-500">
                  Reference context: {auditMode !== "thesis_citation_coverage"
                    ? "not required"
                    : report.capabilities.semanticAiAudits.referenceLibraryPermitted
                      ? `${report.capabilities.semanticAiAudits.referenceItemsSupplied} supplied`
                      : "not used"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setAuditMode("thesis_citation_coverage")}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    auditMode === "thesis_citation_coverage"
                      ? "border-violet-300 bg-violet-50 shadow-[0_6px_18px_rgba(124,58,237,.08)]"
                      : "border-slate-200 bg-slate-50/70 hover:border-violet-200"
                  }`}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-[.08em] ${
                    auditMode === "thesis_citation_coverage"
                      ? "text-violet-700"
                      : "text-slate-400"
                  }`}>
                    Citation integrity
                  </p>
                  <p className="mt-1.5 text-[11px] leading-4.5 text-slate-700">
                    Finds likely external claims without an obvious nearby citation and points to the exact saved-text location.
                  </p>
                  <span className="mt-2 inline-flex text-[10px] font-semibold text-violet-700">
                    {auditMode === "thesis_citation_coverage" ? "Selected" : "Select review"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuditMode("thesis_writing_quality")}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    auditMode === "thesis_writing_quality"
                      ? "border-cyan-300 bg-cyan-50 shadow-[0_6px_18px_rgba(8,145,178,.08)]"
                      : "border-slate-200 bg-slate-50/70 hover:border-cyan-200"
                  }`}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-[.08em] ${
                    auditMode === "thesis_writing_quality"
                      ? "text-cyan-800"
                      : "text-slate-400"
                  }`}>
                    Writing quality
                  </p>
                  <p className="mt-1.5 text-[11px] leading-4.5 text-slate-700">
                    Reviews clarity, precision, academic tone, cohesion, redundancy, vague wording and possible overstatement.
                  </p>
                  <span className="mt-2 inline-flex text-[10px] font-semibold text-cyan-800">
                    {auditMode === "thesis_writing_quality" ? "Selected" : "Select review"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuditMode("research_logic")}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    auditMode === "research_logic"
                      ? "border-amber-300 bg-amber-50 shadow-[0_6px_18px_rgba(217,119,6,.08)]"
                      : "border-slate-200 bg-slate-50/70 hover:border-amber-200"
                  }`}
                >
                  <p className={`text-[10px] font-semibold uppercase tracking-[.08em] ${
                    auditMode === "research_logic"
                      ? "text-amber-800"
                      : "text-slate-400"
                  }`}>
                    Research logic
                  </p>
                  <p className="mt-1.5 text-[11px] leading-4.5 text-slate-700">
                    Compares saved study design, persisted Analysis Lab records and Thesis passages for cross-module inconsistencies, reporting gaps and interpretation strength.
                  </p>
                  <span className="mt-2 inline-flex text-[10px] font-semibold text-amber-800">
                    {auditMode === "research_logic" ? "Selected" : "Select review"}
                  </span>
                </button>
              </div>
            </div>

            <div
              data-psylattice-reference-aware-audit="v5"
              className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 lg:border-l lg:border-t-0"
            >
              {auditMode === "thesis_citation_coverage" ? (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-left shadow-sm transition hover:border-violet-200">
                  <input
                    type="checkbox"
                    checked={includeReferenceLibrary}
                    onChange={(event) =>
                      setIncludeReferenceLibrary(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-[10px] leading-4.5 text-slate-600">
                    <strong className="block text-[11px] text-slate-900">
                      Allow Reference Manager context
                    </strong>
                    Permit this citation review to inspect saved reference metadata, abstracts and available extracted PDF text. Candidate references remain suggestions to review, not proof that they support a claim.
                  </span>
                </label>
              ) : auditMode === "thesis_writing_quality" ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 px-3.5 py-3 text-[10px] leading-4.5 text-slate-600">
                  <strong className="block text-[11px] text-slate-900">
                    Academic writing review
                  </strong>
                  This review uses study-linked Thesis text plus the saved study-design label. It does not need Reference Manager access and will not rewrite the document automatically.
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-3.5 py-3 text-[10px] leading-4.5 text-slate-600">
                  <strong className="block text-[11px] text-slate-900">
                    Cross-module evidence review
                  </strong>
                  Uses saved study design, aggregate participant counts, persisted Analysis Lab records and linked Thesis text. It receives no direct participant identifiers. Formal hypothesis mapping remains conservative because PsyLattice does not yet supply a structured hypothesis registry here.
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-amber-200 bg-white px-2 py-0.5">
                      Analyses: {report.metrics.analysis.savedRecords}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-white px-2 py-0.5">
                      Thesis files: {report.metrics.writing.linkedDocuments}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-white px-2 py-0.5">
                      Design: {report.study.design || "not set"}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                data-psylattice-semantic-audit="v5"
                disabled={
                  auditRunning ||
                  (auditMode !== "research_logic" &&
                    report.metrics.writing.documentsWithText === 0) ||
                  (auditMode === "research_logic" &&
                    report.metrics.writing.documentsWithText === 0 &&
                    report.metrics.analysis.savedRecords === 0)
                }
                onClick={() => void runSemanticAudit()}
                title={
                  auditMode === "research_logic" &&
                  report.metrics.writing.documentsWithText === 0 &&
                  report.metrics.analysis.savedRecords === 0
                    ? "Add linked Thesis text or save an Analysis Lab record before running cross-module research-logic review."
                    : auditMode !== "research_logic" &&
                        report.metrics.writing.documentsWithText === 0
                      ? "Link a Thesis Builder document with saved text before running AI Research Review."
                      : auditMode === "thesis_citation_coverage"
                        ? "Run citation integrity review. This uses your account-wide AI allowance and does not change the deterministic readiness score."
                        : auditMode === "thesis_writing_quality"
                          ? "Run academic writing-quality review. This uses your account-wide AI allowance and does not change the deterministic readiness score."
                          : "Run cross-module research-logic review. This uses your account-wide AI allowance and does not change the deterministic readiness score."
                }
                className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[11px] font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
                  auditMode === "thesis_citation_coverage"
                    ? "bg-violet-600 hover:bg-violet-700"
                    : auditMode === "thesis_writing_quality"
                      ? "bg-cyan-700 hover:bg-cyan-800"
                      : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                <Sparkles
                  className={`h-4 w-4 ${auditRunning ? "animate-pulse" : ""}`}
                />
                {auditRunning
                  ? auditMode === "thesis_citation_coverage"
                    ? "Running citation review…"
                    : auditMode === "thesis_writing_quality"
                      ? "Reviewing writing quality…"
                      : "Reviewing research logic…"
                  : auditMode === "thesis_citation_coverage"
                    ? "Run citation integrity review"
                    : auditMode === "thesis_writing_quality"
                      ? "Run writing quality review"
                      : "Run research logic review"}
              </button>

              <p className="mt-2 text-center text-[10px] leading-4 text-slate-500">
                {auditMode === "research_logic"
                  ? report.metrics.writing.documentsWithText === 0 &&
                    report.metrics.analysis.savedRecords === 0
                    ? "Add linked Thesis text or a persisted analysis record first."
                    : "Returns evidence-backed cross-module review prompts; it does not alter the deterministic readiness score."
                  : report.metrics.writing.documentsWithText === 0
                    ? "Add saved Thesis text first."
                    : auditMode === "thesis_writing_quality"
                      ? "Returns passage-level revision guidance with exact saved-text locations."
                      : includeReferenceLibrary
                        ? "Reference Manager access applies only to this explicit citation-review request."
                        : "Runs citation review without Reference Manager context."}
              </p>
            </div>
          </div>
        </section>

        {auditNotice ? (
          <div
            className={`mt-3 rounded-2xl border px-4 py-3.5 shadow-sm ${
              auditNotice.kind === "success"
                ? "border-emerald-200 bg-emerald-50/80"
                : "border-rose-200 bg-rose-50/80"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-2.5">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                    auditNotice.kind === "success"
                      ? "border-emerald-200 bg-white text-emerald-700"
                      : "border-rose-200 bg-white text-rose-700"
                  }`}
                >
                  {auditNotice.kind === "success" ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-[11px] font-semibold ${
                        auditNotice.kind === "success"
                          ? "text-emerald-900"
                          : "text-rose-900"
                      }`}
                    >
                      {auditNotice.kind === "success"
                        ? "AI Research Review complete"
                        : "AI Research Review needs attention"}
                    </p>

                    {auditNotice.kind === "success" &&
                    auditNotice.findingCount > 0 ? (
                      <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-800">
                        {auditNotice.findingCount} recommendation{
                          auditNotice.findingCount === 1 ? "" : "s"
                        }
                      </span>
                    ) : null}
                  </div>

                  <p
                    className={`mt-1 text-[11px] leading-5 ${
                      auditNotice.kind === "success"
                        ? "text-emerald-800"
                        : "text-rose-800"
                    }`}
                  >
                    {auditNotice.message}
                  </p>
                </div>
              </div>

              {auditNotice.kind === "success" &&
              auditNotice.findingCount > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    openRecommendationDrawer(auditNotice.targetSection)
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-[10px] font-semibold text-white transition hover:bg-slate-800"
                >
                  Open recommendations
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-5 space-y-2.5">
          {activeSections.map((section, index) => (
            <HealthSection
              key={section.id}
              section={section}
              onNavigate={onNavigate}
              defaultOpen={
                index === 0 ||
                section.counts.attention > 0 ||
                section.counts.unavailable > 0
              }
              forceOpenToken={
                drawerRequest?.sectionId === section.id
                  ? drawerRequest.token
                  : 0
              }
            />
          ))}
        </div>

        {futureSections.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.11em] text-slate-400">
              Audit layers not yet enabled
            </p>
            <div className="grid gap-2.5 lg:grid-cols-2">
              {futureSections.map((section) => (
                <HealthSection
                  key={section.id}
                  section={section}
                  onNavigate={onNavigate}
                  defaultOpen={false}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-[10px] leading-4 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Generated{" "}
            {new Date(report.generatedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <span>
            Deterministic readiness stays separate from evidence-backed AI review findings
          </span>
        </div>
      </div>
    </section>
  );
}
