import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ResearchLogicAnalysisRecord,
  ResearchLogicAuditContext,
  ThesisAuditParagraph,
} from "@/lib/research/health/ai/types";
import { buildThesisWritingAuditContext } from "@/lib/research/health/ai/writingScanner";

const MAX_ANALYSIS_RECORDS = 24;
const MAX_SETUP_JSON_CHARS = 5_500;
const MAX_PRIMARY_TABLE_JSON_CHARS = 8_500;
const MAX_SUPPLEMENTARY_JSON_CHARS = 8_500;

type StudyRow = {
  id: string;
  title: string;
  design: string | null;
  status: string;
  target_sample_size: number | null;
  participant_description: string | null;
  components: Record<string, unknown> | null;
  study_config: Record<string, unknown> | null;
};

type WritingDocument = {
  id: string;
  title: string;
  content_text: string | null;
};

type AnalysisRow = {
  id: string;
  analysis_type: string;
  analysis_label: string;
  title: string;
  dataset_label: string | null;
  data_fingerprint: string | null;
  source_rows: number | null;
  working_rows: number | null;
  after_filters_rows: number | null;
  complete_across_setup_rows: number | null;
  incomplete_across_setup_rows: number | null;
  analysis_created_at: string;
  record_json: Record<string, unknown> | null;
};

function plainObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function clippedJson(value: unknown, maxChars: number) {
  if (value === null || value === undefined) return null;
  try {
    const json = JSON.stringify(value);
    if (!json || json === "{}" || json === "[]") return null;
    return json.slice(0, maxChars);
  } catch {
    return null;
  }
}

function finalRows(record: AnalysisRow) {
  return (
    record.complete_across_setup_rows ??
    record.after_filters_rows ??
    record.working_rows ??
    record.source_rows ??
    null
  );
}

function enabledComponents(components: Record<string, unknown> | null) {
  return Object.entries(components || {})
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .slice(0, 40);
}

function studyConfigKeys(studyConfig: Record<string, unknown> | null) {
  return Object.keys(studyConfig || {}).slice(0, 60);
}

function sanitizeAnalysis(record: AnalysisRow): ResearchLogicAnalysisRecord {
  const json = plainObject(record.record_json);
  const setup = json ? json.setup : null;
  const primaryTable = json ? json.primaryTable : null;
  const supplementaryTables = json ? json.supplementaryTables : null;

  return {
    id: record.id,
    analysisType: record.analysis_type || "unknown",
    analysisLabel: record.analysis_label || "Analysis",
    title: record.title || "Saved analysis",
    datasetLabel: record.dataset_label,
    dataFingerprintPresent: Boolean(record.data_fingerprint),
    sourceRows: record.source_rows,
    workingRows: record.working_rows,
    afterFiltersRows: record.after_filters_rows,
    completeAcrossSetupRows: record.complete_across_setup_rows,
    incompleteAcrossSetupRows: record.incomplete_across_setup_rows,
    finalAnalysisRows: finalRows(record),
    analysisCreatedAt: record.analysis_created_at,
    setupJson: clippedJson(setup, MAX_SETUP_JSON_CHARS),
    primaryTableJson: clippedJson(primaryTable, MAX_PRIMARY_TABLE_JSON_CHARS),
    supplementaryTablesJson: clippedJson(
      supplementaryTables,
      MAX_SUPPLEMENTARY_JSON_CHARS,
    ),
  };
}

export async function buildResearchLogicAuditContext(args: {
  supabase: SupabaseClient;
  userId: string;
  study: StudyRow;
  documents: WritingDocument[];
}): Promise<ResearchLogicAuditContext> {
  const writing = buildThesisWritingAuditContext({
    studyId: args.study.id,
    studyTitle: args.study.title || "Untitled study",
    studyDesign: args.study.design,
    documents: args.documents,
  });

  const [analysisResult, participantResult] = await Promise.all([
    args.supabase
      .from("research_analysis_records")
      .select(
        "id,analysis_type,analysis_label,title,dataset_label,data_fingerprint,source_rows,working_rows,after_filters_rows,complete_across_setup_rows,incomplete_across_setup_rows,analysis_created_at,record_json",
      )
      .eq("owner_user_id", args.userId)
      .eq("study_id", args.study.id)
      .order("analysis_created_at", { ascending: false })
      .limit(MAX_ANALYSIS_RECORDS),

    args.supabase
      .from("study_participants")
      .select("id,is_test,status")
      .eq("owner_user_id", args.userId)
      .eq("study_id", args.study.id),
  ]);

  if (analysisResult.error) throw analysisResult.error;
  if (participantResult.error) throw participantResult.error;

  const analyses = ((analysisResult.data || []) as AnalysisRow[]).map(
    sanitizeAnalysis,
  );

  const participants = (participantResult.data || []) as Array<{
    id: string;
    is_test: boolean;
    status: string;
  }>;

  const liveRows = participants.filter(
    (row) => row.is_test === false && row.status !== "withdrawn",
  );

  const analysisContextChars = analyses.reduce(
    (sum, record) =>
      sum +
      (record.setupJson?.length || 0) +
      (record.primaryTableJson?.length || 0) +
      (record.supplementaryTablesJson?.length || 0) +
      record.analysisLabel.length +
      record.title.length,
    0,
  );

  return {
    studyId: args.study.id,
    studyTitle: args.study.title || "Untitled study",
    study: {
      design: args.study.design,
      status: args.study.status,
      targetSampleSize: args.study.target_sample_size,
      participantDescriptionPresent: Boolean(
        String(args.study.participant_description || "").trim(),
      ),
      enabledComponents: enabledComponents(args.study.components),
      studyConfigKeys: studyConfigKeys(args.study.study_config),
    },
    participants: {
      live: liveRows.length,
      completed: liveRows.filter((row) => row.status === "completed").length,
      baselineComplete: liveRows.filter(
        (row) => row.status === "baseline_complete",
      ).length,
      withdrawn: participants.filter(
        (row) => row.is_test === false && row.status === "withdrawn",
      ).length,
      test: participants.filter((row) => row.is_test === true).length,
    },
    paragraphs: writing.paragraphs as ThesisAuditParagraph[],
    documentCount: writing.documentCount,
    auditedChars: writing.auditedChars,
    truncated: writing.truncated,
    analyses,
    analysisContextChars,
  };
}
