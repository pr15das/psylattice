import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStudyHealthSnapshot } from "@/lib/research/health/snapshot";
import { buildDesignChecks } from "@/lib/research/health/checks/design";
import { buildRecruitmentChecks } from "@/lib/research/health/checks/recruitment";
import { buildDataChecks } from "@/lib/research/health/checks/data";
import { buildAnalysisChecks } from "@/lib/research/health/checks/analysis";
import { buildWritingChecks } from "@/lib/research/health/checks/writing";
import { buildReportingChecks } from "@/lib/research/health/checks/reporting";
import { loadSemanticAuditSnapshot } from "@/lib/research/health/ai/findings";
import type {
  StudyHealthCheck,
  StudyHealthMetrics,
  StudyHealthReport,
  StudyHealthSection,
  StudyHealthSectionId,
  StudyHealthSnapshot,
} from "@/lib/research/health/types";

const sectionDefinitions: Array<{
  id: StudyHealthSectionId;
  label: string;
  state: "active" | "not_enabled";
  note?: string;
}> = [
  { id: "design", label: "Design & protocol", state: "active" },
  { id: "recruitment", label: "Recruitment", state: "active" },
  { id: "data", label: "Data", state: "active" },
  { id: "analysis", label: "Analysis", state: "active" },
  { id: "writing", label: "Writing & references", state: "active" },
  { id: "reporting", label: "Reporting", state: "active" },
];

function sectionCounts(checks: StudyHealthCheck[]) {
  return {
    complete: checks.filter((row) => row.status === "complete").length,
    attention: checks.filter((row) => row.status === "attention").length,
    inProgress: checks.filter((row) => row.status === "in_progress").length,
    notApplicable: checks.filter((row) => row.status === "not_applicable").length,
    unavailable: checks.filter((row) => row.status === "unavailable").length,
  };
}

function buildSections(checks: StudyHealthCheck[]): StudyHealthSection[] {
  return sectionDefinitions.map((definition) => {
    const sectionChecks = checks.filter(
      (check) => check.section === definition.id,
    );

    return {
      ...definition,
      checks: sectionChecks,
      counts: sectionCounts(sectionChecks),
    };
  });
}

function buildMetrics(snapshot: StudyHealthSnapshot): StudyHealthMetrics {
  const baselineMeasures = snapshot.measures.filter(
    (row) => String(row.measurement_point) === "baseline",
  ).length;
  const followupMeasures = snapshot.measures.filter(
    (row) => String(row.measurement_point) === "followup",
  ).length;
  const enabledAmbulatoryProtocols = snapshot.ambulatoryProtocols.filter(
    (row) => row.is_enabled === true,
  ).length;

  const liveParticipants = snapshot.participants.filter(
    (row) => row.is_test === false && row.status !== "withdrawn",
  );
  const testParticipants = snapshot.participants.filter(
    (row) => row.is_test === true,
  );
  const completedLiveParticipants = liveParticipants.filter(
    (row) => row.status === "completed",
  ).length;
  const baselineCompleteParticipants = liveParticipants.filter(
    (row) => row.status === "baseline_complete",
  ).length;
  const withdrawnLiveParticipants = snapshot.participants.filter(
    (row) => row.is_test === false && row.status === "withdrawn",
  ).length;

  const activeLiveLinks = snapshot.links.filter(
    (row) => row.is_test_link === false && row.status === "active",
  ).length;
  const activeTestLinks = snapshot.links.filter(
    (row) => row.is_test_link === true && row.status === "active",
  ).length;

  const target = Number(snapshot.study.target_sample_size || 0);
  const targetSampleSize =
    Number.isFinite(target) && target > 0 ? target : null;
  const targetProgressPercent =
    targetSampleSize === null
      ? null
      : Math.round(
          Math.min(1, liveParticipants.length / targetSampleSize) * 1000,
        ) / 10;

  const documentsWithText = snapshot.writingDocuments.filter(
    (row) => String(row.content_text || "").trim().length > 0,
  ).length;
  const totalTextCharacters = snapshot.writingDocuments.reduce(
    (sum, row) => sum + String(row.content_text || "").length,
    0,
  );

  const analysisTypes = new Set(
    snapshot.analysisRecords.map((record) => record.analysis_type).filter(Boolean),
  );
  const fingerprints = new Set(
    snapshot.analysisRecords
      .map((record) => record.data_fingerprint)
      .filter((value): value is string => Boolean(value)),
  );

  return {
    protocol: {
      baselineMeasures,
      followupMeasures,
      cognitiveTasks: snapshot.cognitiveTaskIds.length,
      demographicQuestions: snapshot.demographicQuestions.length,
      enabledAmbulatoryProtocols,
    },
    recruitment: {
      liveParticipants: liveParticipants.length,
      testParticipants: testParticipants.length,
      completedLiveParticipants,
      baselineCompleteParticipants,
      withdrawnLiveParticipants,
      activeLiveLinks,
      activeTestLinks,
      targetSampleSize,
      targetProgressPercent,
    },
    analysis: {
      savedRecords: snapshot.analysisRecords.length,
      analysisTypes: analysisTypes.size,
      uniqueFingerprints: fingerprints.size,
      latestRecordAt: snapshot.analysisRecords[0]?.analysis_created_at || null,
    },
    writing: {
      linkedDocuments: snapshot.writingDocuments.length,
      documentsWithText,
      totalTextCharacters,
      linkedReferences: snapshot.referenceLinks.length,
    },
  };
}

function buildReadiness(checks: StudyHealthCheck[]) {
  const scored = checks.filter(
    (check) =>
      check.scoreEligible &&
      check.origin === "deterministic" &&
      check.status !== "not_applicable" &&
      check.status !== "unavailable",
  );

  const completed = scored.filter((check) => check.status === "complete").length;
  const attention = scored.filter((check) => check.status === "attention").length;
  const inProgress = scored.filter(
    (check) => check.status === "in_progress",
  ).length;
  const unavailable = checks.filter(
    (check) => check.status === "unavailable",
  ).length;

  return {
    completed,
    applicable: scored.length,
    attention,
    inProgress,
    unavailable,
    percent:
      scored.length > 0 ? Math.round((completed / scored.length) * 100) : null,
    label: "Research readiness" as const,
  };
}

function buildNextActions(checks: StudyHealthCheck[]) {
  const severityRank = {
    high: 0,
    medium: 1,
    low: 2,
    info: 3,
  } as const;

  return checks
    .filter(
      (check) =>
        Boolean(check.action) &&
        (check.status === "attention" || check.status === "in_progress"),
    )
    .sort((a, b) => {
      const statusRank = (value: StudyHealthCheck["status"]) =>
        value === "attention" ? 0 : 1;

      return (
        statusRank(a.status) - statusRank(b.status) ||
        severityRank[a.severity] - severityRank[b.severity]
      );
    })
    .slice(0, 6)
    .map((check) => ({
      checkId: check.id,
      section: check.section,
      label: check.label,
      detail: check.detail,
      status: check.status,
      severity: check.severity,
      action: check.action!,
    }));
}

export async function buildStudyHealthReport(
  supabase: SupabaseClient,
  userId: string,
  studyId: string,
): Promise<StudyHealthReport> {
  const snapshot = await loadStudyHealthSnapshot(supabase, userId, studyId);
  const semanticAudit = await loadSemanticAuditSnapshot(
    supabase,
    userId,
    studyId,
  );

  const checks: StudyHealthCheck[] = [
    ...buildDesignChecks(snapshot),
    ...buildRecruitmentChecks(snapshot),
    ...buildDataChecks(snapshot),
    ...buildAnalysisChecks(snapshot),
    ...buildWritingChecks(snapshot),
    ...semanticAudit.checks,
    ...buildReportingChecks(snapshot),
  ];

  const writingAvailable = snapshot.sourceState.writing.ok;
  const referencesAvailable = snapshot.sourceState.references.ok;
  const analysisAvailable = snapshot.sourceState.analysis.ok;

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    study: {
      id: snapshot.study.id,
      title: snapshot.study.title,
      status: snapshot.study.status,
      design: snapshot.study.design,
      targetSampleSize: snapshot.study.target_sample_size,
    },
    readiness: buildReadiness(checks),
    sections: buildSections(checks),
    metrics: buildMetrics(snapshot),
    nextActions: buildNextActions(checks),
    sourceState: snapshot.sourceState,
    capabilities: {
      deterministicEngine: {
        status: "active",
        producesAiJudgements: false,
      },
      thesisText: {
        available: writingAvailable,
        note: writingAvailable
          ? "Study-linked Thesis Builder text is visible to Study Health. Deterministic reporting checks and explicit user-run semantic citation review may use this text."
          : "Study-linked Thesis Builder text could not be read for this health request.",
      },
      linkedReferences: {
        available: referencesAvailable,
        note: referencesAvailable
          ? "Study-reference links are available. Link presence alone is not treated as evidence that a statement is correctly cited."
          : "Study-reference links could not be read for this health request.",
      },
      serverPersistedAnalysisResults: {
        available: analysisAvailable,
        recordCount: snapshot.analysisRecords.length,
        note: analysisAvailable
          ? `${snapshot.analysisRecords.length} study-linked Analysis Lab record${
              snapshot.analysisRecords.length === 1 ? "" : "s"
            } are available to the health engine. Statistical correctness is not inferred from record existence alone.`
          : "Study-linked Analysis Lab records could not be read for this health request.",
      },
      semanticAiAudits: {
        enabled: true,
        available: semanticAudit.available,
        findingsProduced: semanticAudit.activeFindings > 0,
        activeFindings: semanticAudit.activeFindings,
        latestRunAt: semanticAudit.latestRunAt,
        latestProvider: semanticAudit.latestProvider,
        latestProviderModel: semanticAudit.latestProviderModel,
        candidateParagraphs: semanticAudit.candidateParagraphs,
        auditedChars: semanticAudit.auditedChars,
        truncated: semanticAudit.truncated,
        referenceLibraryPermitted:
          semanticAudit.referenceLibraryPermitted,
        referenceItemsSupplied:
          semanticAudit.referenceItemsSupplied,
        note: semanticAudit.note,
      },
    },
  };
}
