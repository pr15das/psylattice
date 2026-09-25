import type {
  StudyHealthCheck,
  StudyHealthSnapshot,
} from "@/lib/research/health/types";

type ThesisSampleClaim = {
  documentId: string;
  documentTitle: string;
  value: number;
  snippet: string;
};

function normalizedSnippet(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}

function extractExplicitAnalysisSampleClaims(
  snapshot: StudyHealthSnapshot,
): ThesisSampleClaim[] {
  const claims: ThesisSampleClaim[] = [];

  for (const document of snapshot.writingDocuments) {
    const text = String(document.content_text || "");
    if (!text.trim()) continue;

    const patterns = [
      /\b(?:final\s+sample|analytic\s+sample|analysis\s+sample|sample\s+analys(?:ed|zed)|participants?\s+analys(?:ed|zed)|cases?\s+analys(?:ed|zed)|included\s+in\s+(?:the\s+)?analysis)\b.{0,90}?\b(?:N|n)?\s*=?\s*(\d{1,6})\b/gi,
      /\b(?:N|n)\s*=\s*(\d{1,6})\b/gi,
    ];

    const seen = new Set<string>();

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(text)) !== null) {
        const value = Number(match[1]);
        if (!Number.isFinite(value) || value <= 0) continue;

        const start = Math.max(0, match.index - 80);
        const end = Math.min(text.length, match.index + match[0].length + 80);
        const snippet = normalizedSnippet(text.slice(start, end));

        // A bare N = ... is only considered an analysis-sample claim when the
        // nearby sentence contains analysis/sample/participant language. This
        // avoids treating every subgroup n as the overall analysed sample.
        if (
          /^\b(?:N|n)\s*=/i.test(match[0]) &&
          !/(analy[sz]|analytic|final sample|sample size|participants?|cases?|observations?|complete cases?)/i.test(
            snippet,
          )
        ) {
          continue;
        }

        const key = `${document.id}:${value}:${snippet}`;
        if (seen.has(key)) continue;
        seen.add(key);

        claims.push({
          documentId: document.id,
          documentTitle: document.title || "Untitled Thesis document",
          value,
          snippet,
        });
      }
    }
  }

  return claims;
}

function finalAnalysisSampleSize(
  record: StudyHealthSnapshot["analysisRecords"][number],
) {
  return (
    record.complete_across_setup_rows ??
    record.after_filters_rows ??
    record.working_rows ??
    record.source_rows ??
    null
  );
}

export function buildReportingChecks(
  snapshot: StudyHealthSnapshot,
): StudyHealthCheck[] {
  const studyId = snapshot.study.id;

  if (!snapshot.sourceState.writing.ok) {
    return [
      {
        id: "reporting.cross_module_sources",
        section: "reporting",
        label: "Cross-module reporting audit",
        status: "unavailable",
        severity: "info",
        origin: "deterministic",
        detail:
          snapshot.sourceState.writing.reason ||
          "Study-linked Thesis Builder text could not be read.",
        scoreEligible: false,
        evidence: [
          {
            source: "research_writing_documents",
            summary:
              "Writing source unavailable; no reporting comparison was attempted.",
          },
        ],
        action: {
          target: "writing",
          label: "Open Thesis Builder",
          studyId,
        },
      },
    ];
  }

  if (!snapshot.sourceState.analysis.ok) {
    return [
      {
        id: "reporting.cross_module_sources",
        section: "reporting",
        label: "Cross-module reporting audit",
        status: "unavailable",
        severity: "info",
        origin: "deterministic",
        detail:
          snapshot.sourceState.analysis.reason ||
          "Study-linked Analysis Lab records could not be read.",
        scoreEligible: false,
        evidence: [
          {
            source: "research_analysis_records",
            summary:
              "Analysis source unavailable; no reporting comparison was attempted.",
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

  const textDocuments = snapshot.writingDocuments.filter(
    (document) => String(document.content_text || "").trim().length > 0,
  );

  if (textDocuments.length === 0) {
    return [
      {
        id: "reporting.cross_module_sources",
        section: "reporting",
        label: "Cross-module reporting audit",
        status: "in_progress",
        severity: "info",
        origin: "deterministic",
        detail:
          "No study-linked Thesis Builder text is available yet, so PsyLattice has nothing to compare with saved analyses.",
        scoreEligible: false,
        evidence: [
          {
            source: "research_writing_documents",
            summary: "0 linked documents with non-empty saved text detected.",
          },
        ],
        action: {
          target: "writing",
          label: "Open Thesis Builder",
          studyId,
        },
      },
    ];
  }

  if (snapshot.analysisRecords.length === 0) {
    return [
      {
        id: "reporting.cross_module_sources",
        section: "reporting",
        label: "Cross-module reporting audit",
        status: "in_progress",
        severity: "info",
        origin: "deterministic",
        detail:
          "Thesis text is available, but no study-linked Analysis Lab record has been saved yet. PsyLattice therefore does not infer whether statistical reporting is complete.",
        scoreEligible: false,
        evidence: [
          {
            source: "research_writing_documents",
            recordIds: textDocuments.map((document) => document.id),
            summary: `${textDocuments.length} linked Thesis document${
              textDocuments.length === 1 ? "" : "s"
            } contain saved text.`,
          },
          {
            source: "research_analysis_records",
            summary: "0 persisted analysis records detected.",
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

  const checks: StudyHealthCheck[] = [
    {
      id: "reporting.cross_module_sources",
      section: "reporting",
      label: "Cross-module reporting audit ready",
      status: "complete",
      severity: "info",
      origin: "deterministic",
      detail: `${textDocuments.length} linked Thesis document${
        textDocuments.length === 1 ? "" : "s"
      } with text and ${snapshot.analysisRecords.length} persisted Analysis Lab record${
        snapshot.analysisRecords.length === 1 ? "" : "s"
      } are available for evidence-backed comparison.`,
      scoreEligible: false,
      evidence: [
        {
          source: "research_writing_documents",
          recordIds: textDocuments.map((document) => document.id),
          summary: `${textDocuments.length} linked documents contain saved text.`,
        },
        {
          source: "research_analysis_records",
          recordIds: snapshot.analysisRecords.map((record) => record.id),
          summary: `${snapshot.analysisRecords.length} study-linked analysis records are persisted.`,
        },
      ],
      action: null,
    },
  ];

  const recordSampleSizes = snapshot.analysisRecords
    .map((record) => ({
      record,
      value: finalAnalysisSampleSize(record),
    }))
    .filter(
      (
        row,
      ): row is {
        record: StudyHealthSnapshot["analysisRecords"][number];
        value: number;
      } => row.value !== null && Number.isFinite(row.value) && row.value > 0,
    );

  const distinctAnalysisNs = Array.from(
    new Set(recordSampleSizes.map((row) => row.value)),
  ).sort((a, b) => a - b);

  const thesisClaims = extractExplicitAnalysisSampleClaims(snapshot);

  if (distinctAnalysisNs.length === 0) {
    checks.push({
      id: "reporting.analysis_sample_consistency",
      section: "reporting",
      label: "Analysed sample-size consistency",
      status: "unavailable",
      severity: "info",
      origin: "deterministic",
      detail:
        "Saved analyses do not yet expose a usable analysis-sample count, so PsyLattice did not compare Thesis sample-size statements.",
      scoreEligible: false,
      evidence: [
        {
          source: "research_analysis_records",
          summary:
            "No positive final sample-size value could be derived from saved analysis provenance.",
        },
      ],
      action: {
        target: "analysis",
        label: "Review saved analyses",
        studyId,
      },
    });
    return checks;
  }

  if (distinctAnalysisNs.length > 1) {
    checks.push({
      id: "reporting.analysis_sample_consistency",
      section: "reporting",
      label: "Analysed sample-size consistency",
      status: "in_progress",
      severity: "info",
      origin: "deterministic",
      detail:
        "Saved analyses use more than one analysis sample size. PsyLattice is preserving those differences and will not collapse them into a single expected N.",
      scoreEligible: false,
      evidence: recordSampleSizes.slice(0, 10).map(({ record, value }) => ({
        source: "research_analysis_records",
        recordIds: [record.id],
        summary: `${record.analysis_label}: analysis sample ${value}.`,
      })),
      action: {
        target: "analysis",
        label: "Review analysis samples",
        studyId,
      },
    });
    return checks;
  }

  const expectedN = distinctAnalysisNs[0];

  if (thesisClaims.length === 0) {
    checks.push({
      id: "reporting.analysis_sample_consistency",
      section: "reporting",
      label: "Analysed sample-size consistency",
      status: "in_progress",
      severity: "info",
      origin: "deterministic",
      detail: `Saved analyses currently point to an analysis sample of ${expectedN}, but PsyLattice did not find a sufficiently explicit analysed-sample statement in the linked Thesis text. No mismatch is inferred.`,
      scoreEligible: false,
      evidence: [
        {
          source: "research_analysis_records",
          summary: `Single current analysis-sample value detected: ${expectedN}.`,
        },
        {
          source: "research_writing_documents",
          recordIds: textDocuments.map((document) => document.id),
          summary:
            "No conservative analysed-sample statement was extracted from linked Thesis text.",
        },
      ],
      action: {
        target: "writing",
        label: "Review Thesis Results",
        studyId,
      },
    });
    return checks;
  }

  const matchingClaims = thesisClaims.filter((claim) => claim.value === expectedN);
  const nonMatchingClaims = thesisClaims.filter(
    (claim) => claim.value !== expectedN,
  );

  if (matchingClaims.length > 0) {
    checks.push({
      id: "reporting.analysis_sample_consistency",
      section: "reporting",
      label: "Analysed sample-size consistency",
      status: "complete",
      severity: "info",
      origin: "deterministic",
      detail: `A linked Thesis sample-size statement matches the current persisted analysis sample of ${expectedN}. Other sample-size statements are not automatically treated as errors because they may describe subgroups or earlier stages.`,
      scoreEligible: true,
      evidence: [
        {
          source: "research_analysis_records",
          recordIds: recordSampleSizes.map(({ record }) => record.id),
          summary: `Single persisted analysis-sample value: ${expectedN}.`,
        },
        ...matchingClaims.slice(0, 4).map((claim) => ({
          source: "research_writing_documents",
          recordIds: [claim.documentId],
          summary: `${claim.documentTitle}: “…${claim.snippet}…”`,
        })),
      ],
      action: null,
    });
    return checks;
  }

  if (nonMatchingClaims.length > 0) {
    checks.push({
      id: "reporting.analysis_sample_consistency",
      section: "reporting",
      label: "Potential analysed sample-size mismatch",
      status: "attention",
      severity: "medium",
      origin: "deterministic",
      detail: `Persisted analyses currently indicate an analysis sample of ${expectedN}, while the explicit analysed-sample statement${
        nonMatchingClaims.length === 1 ? "" : "s"
      } detected in linked Thesis text use${
        nonMatchingClaims.length === 1 ? "s" : ""
      } different value${
        nonMatchingClaims.length === 1 ? "" : "s"
      }. PsyLattice is flagging this for review rather than declaring it incorrect.`,
      scoreEligible: true,
      evidence: [
        {
          source: "research_analysis_records",
          recordIds: recordSampleSizes.map(({ record }) => record.id),
          summary: `Single persisted analysis-sample value: ${expectedN}.`,
        },
        ...nonMatchingClaims.slice(0, 6).map((claim) => ({
          source: "research_writing_documents",
          recordIds: [claim.documentId],
          summary: `${claim.documentTitle}: “…${claim.snippet}…”`,
        })),
      ],
      action: {
        target: "writing",
        label: "Review Thesis Results",
        studyId,
      },
    });
  }

  return checks;
}
