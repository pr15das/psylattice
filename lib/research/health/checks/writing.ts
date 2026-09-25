import type {
  StudyHealthCheck,
  StudyHealthSnapshot,
} from "@/lib/research/health/types";

export function buildWritingChecks(
  snapshot: StudyHealthSnapshot,
): StudyHealthCheck[] {
  const studyId = snapshot.study.id;
  const checks: StudyHealthCheck[] = [];

  if (!snapshot.sourceState.writing.ok) {
    checks.push({
      id: "writing.linked_documents",
      section: "writing",
      label: "Thesis Builder documents linked",
      status: "unavailable",
      severity: "info",
      origin: "deterministic",
      detail:
        snapshot.sourceState.writing.reason ||
        "Study-linked Thesis Builder documents could not be read.",
      scoreEligible: false,
      evidence: [
        {
          source: "research_writing_documents",
          summary: "Source unavailable; no writing inference made.",
        },
      ],
      action: { target: "writing", label: "Open Thesis Builder", studyId },
    });
  } else {
    const documents = snapshot.writingDocuments;
    const withText = documents.filter(
      (row) => String(row.content_text || "").trim().length > 0,
    );

    checks.push({
      id: "writing.linked_documents",
      section: "writing",
      label: "Thesis Builder documents linked",
      status: documents.length > 0 ? "complete" : "in_progress",
      severity: "info",
      origin: "deterministic",
      detail:
        documents.length > 0
          ? `${documents.length} Thesis Builder document${documents.length === 1 ? "" : "s"} linked to this study.`
          : "No Thesis Builder document is linked to this study yet. This is shown as workflow progress, not as a research-quality failure.",
      scoreEligible: false,
      evidence: [
        {
          source: "research_writing_documents",
          recordIds: documents.map((row) => row.id),
          summary: `${documents.length} study-linked writing document${documents.length === 1 ? "" : "s"} detected.`,
        },
      ],
      action:
        documents.length > 0
          ? { target: "writing", label: "Open linked Thesis documents", studyId }
          : { target: "writing", label: "Open Thesis Builder", studyId },
    });

    if (documents.length > 0) {
      checks.push({
        id: "writing.document_content",
        section: "writing",
        label: "Linked writing contains text",
        status: withText.length > 0 ? "complete" : "attention",
        severity: withText.length > 0 ? "info" : "low",
        origin: "deterministic",
        detail:
          withText.length > 0
            ? `${withText.length} linked document${withText.length === 1 ? "" : "s"} contain saved text that future evidence-backed audits can inspect.`
            : "Linked Thesis Builder documents exist, but no saved text was detected in them.",
        scoreEligible: false,
        evidence: [
          {
            source: "research_writing_documents",
            recordIds: documents.map((row) => row.id),
            field: "content_text",
            summary: `${withText.length} of ${documents.length} linked documents contain non-empty text.`,
          },
        ],
        action: { target: "writing", label: "Open Thesis Builder", studyId },
      });
    }
  }

  if (!snapshot.sourceState.references.ok) {
    checks.push({
      id: "writing.linked_references",
      section: "writing",
      label: "References linked to study",
      status: "unavailable",
      severity: "info",
      origin: "deterministic",
      detail:
        snapshot.sourceState.references.reason ||
        "Study-linked references could not be read.",
      scoreEligible: false,
      evidence: [
        {
          source: "reference_study_links",
          summary: "Source unavailable; no reference-link inference made.",
        },
      ],
      action: { target: "references", label: "Open Reference Manager", studyId },
    });
  } else {
    checks.push({
      id: "writing.linked_references",
      section: "writing",
      label: "References linked to study",
      status: snapshot.referenceLinks.length > 0 ? "complete" : "in_progress",
      severity: "info",
      origin: "deterministic",
      detail:
        snapshot.referenceLinks.length > 0
          ? `${snapshot.referenceLinks.length} reference${snapshot.referenceLinks.length === 1 ? "" : "s"} linked to this study.`
          : "No references are linked to this study yet. PsyLattice does not infer that citations are missing from this fact alone.",
      scoreEligible: false,
      evidence: [
        {
          source: "reference_study_links",
          recordIds: snapshot.referenceLinks.map((row) => row.reference_id),
          summary: `${snapshot.referenceLinks.length} study-reference link${snapshot.referenceLinks.length === 1 ? "" : "s"} detected.`,
        },
      ],
      action: {
        target: "references",
        label: "Open Reference Manager",
        studyId,
      },
    });
  }

  return checks;
}
