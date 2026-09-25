import type {
  StudyHealthCheck,
  StudyHealthSnapshot,
} from "@/lib/research/health/types";

function objectValue(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function hasSavedPrimaryTable(recordJson: Record<string, unknown>) {
  const table = objectValue(recordJson.primaryTable);
  if (!table) return false;

  const headers = Array.isArray(table.headers) ? table.headers : [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  return headers.length > 0 && rows.length > 0;
}

function hasReproducibilityMetadata(
  record: StudyHealthSnapshot["analysisRecords"][number],
) {
  const recordJson = objectValue(record.record_json);
  const setup = recordJson ? objectValue(recordJson.setup) : null;

  return Boolean(
    record.client_record_id &&
      record.analysis_type &&
      record.dataset_key &&
      record.data_fingerprint &&
      record.source_rows !== null &&
      record.after_filters_rows !== null &&
      setup,
  );
}

export function buildAnalysisChecks(
  snapshot: StudyHealthSnapshot,
): StudyHealthCheck[] {
  const studyId = snapshot.study.id;

  if (!snapshot.sourceState.analysis.ok) {
    return [
      {
        id: "analysis.persisted_records",
        section: "analysis",
        label: "Saved Analysis Lab records",
        status: "unavailable",
        severity: "info",
        origin: "deterministic",
        detail:
          snapshot.sourceState.analysis.reason ||
          "Study-linked analysis records could not be read.",
        scoreEligible: false,
        evidence: [
          {
            source: "research_analysis_records",
            summary:
              "Source unavailable; PsyLattice produced no analysis-health judgement.",
          },
        ],
        action: {
          target: "analysis",
          label: "Open Analysis Lab",
          studyId,
        },
      },
    ];
  }

  const records = snapshot.analysisRecords;

  if (records.length === 0) {
    return [
      {
        id: "analysis.persisted_records",
        section: "analysis",
        label: "Saved Analysis Lab records",
        status: "in_progress",
        severity: "info",
        origin: "deterministic",
        detail:
          "No study-linked Analysis Lab record has been saved yet. PsyLattice does not treat this as a research error because the study may not have reached the analysis stage.",
        scoreEligible: false,
        evidence: [
          {
            source: "research_analysis_records",
            summary: "0 study-linked analysis records detected.",
          },
        ],
        action: {
          target: "analysis",
          label: "Open Analysis Lab",
          studyId,
        },
      },
    ];
  }

  const recordIds = records.map((record) => record.id);
  const reproducible = records.filter(hasReproducibilityMetadata);
  const withPrimaryTable = records.filter((record) =>
    hasSavedPrimaryTable(record.record_json),
  );

  const reducedSampleRecords = records.filter(
    (record) =>
      record.source_rows !== null &&
      record.after_filters_rows !== null &&
      record.after_filters_rows < record.source_rows,
  );

  const analysisTypes = new Set(
    records.map((record) => record.analysis_type).filter(Boolean),
  );

  const checks: StudyHealthCheck[] = [
    {
      id: "analysis.persisted_records",
      section: "analysis",
      label: "Saved Analysis Lab records",
      status: "complete",
      severity: "info",
      origin: "deterministic",
      detail: `${records.length} study-linked analysis record${
        records.length === 1 ? "" : "s"
      } are persisted across ${analysisTypes.size} analysis type${
        analysisTypes.size === 1 ? "" : "s"
      }.`,
      scoreEligible: false,
      evidence: [
        {
          source: "research_analysis_records",
          recordIds,
          summary: `${records.length} persisted study-linked analysis snapshot${
            records.length === 1 ? "" : "s"
          } detected.`,
        },
      ],
      action: {
        target: "analysis",
        label: "Open Analysis Lab",
        studyId,
      },
    },
    {
      id: "analysis.reproducibility_metadata",
      section: "analysis",
      label: "Analysis provenance is reproducible",
      status: reproducible.length === records.length ? "complete" : "attention",
      severity: reproducible.length === records.length ? "info" : "medium",
      origin: "deterministic",
      detail:
        reproducible.length === records.length
          ? "Every persisted analysis record includes dataset identity, a data fingerprint, sample audit counts and the saved analysis setup."
          : `${records.length - reproducible.length} saved analysis record${
              records.length - reproducible.length === 1 ? "" : "s"
            } are missing one or more provenance fields required for reliable cross-module auditing.`,
      scoreEligible: true,
      evidence: [
        {
          source: "research_analysis_records",
          recordIds,
          summary: `${reproducible.length} of ${records.length} records contain the required reproducibility metadata.`,
        },
      ],
      action:
        reproducible.length === records.length
          ? null
          : {
              target: "analysis",
              label: "Review saved analyses",
              studyId,
            },
    },
    {
      id: "analysis.saved_result_tables",
      section: "analysis",
      label: "Saved analysis outputs are available",
      status: withPrimaryTable.length === records.length ? "complete" : "attention",
      severity: withPrimaryTable.length === records.length ? "info" : "medium",
      origin: "deterministic",
      detail:
        withPrimaryTable.length === records.length
          ? "Every persisted analysis record contains a formatted primary result table that future reporting audits can compare with Thesis Builder."
          : `${records.length - withPrimaryTable.length} persisted record${
              records.length - withPrimaryTable.length === 1 ? "" : "s"
            } do not contain a populated primary result table.`,
      scoreEligible: true,
      evidence: [
        {
          source: "research_analysis_records.record_json.primaryTable",
          recordIds,
          summary: `${withPrimaryTable.length} of ${records.length} records contain a populated primary result table.`,
        },
      ],
      action:
        withPrimaryTable.length === records.length
          ? null
          : {
              target: "analysis",
              label: "Review saved results",
              studyId,
            },
    },
  ];

  if (reducedSampleRecords.length > 0) {
    checks.push({
      id: "analysis.sample_reduction",
      section: "analysis",
      label: "Analysis sample differs from source data",
      status: "in_progress",
      severity: "info",
      origin: "deterministic",
      detail: `${reducedSampleRecords.length} saved analysis record${
        reducedSampleRecords.length === 1 ? "" : "s"
      } use fewer rows after filtering/preparation than were present in the source dataset. This is not labelled an error; PsyLattice records it so later reporting audits can verify that analysed N is described accurately.`,
      scoreEligible: false,
      evidence: reducedSampleRecords.slice(0, 8).map((record) => ({
        source: "research_analysis_records",
        recordIds: [record.id],
        summary: `${record.analysis_label}: ${record.source_rows ?? "?"} source rows → ${record.after_filters_rows ?? "?"} after filters/preparation.`,
      })),
      action: {
        target: "analysis",
        label: "Review analysis samples",
        studyId,
      },
    });
  }

  return checks;
}
