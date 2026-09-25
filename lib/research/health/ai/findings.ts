import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StudyHealthCheck,
  StudyHealthScreenTarget,
  StudyHealthSeverity,
} from "@/lib/research/health/types";

const ACTIVE_AUDIT_TYPES = [
  "thesis_citation_coverage",
  "thesis_writing_quality",
  "research_logic",
] as const;

type FindingRow = {
  id: string;
  run_id: string;
  audit_type: string;
  category: string;
  severity: StudyHealthSeverity;
  confidence: number | null;
  title: string;
  detail: string;
  reason: string | null;
  suggested_action: string | null;
  document_id: string | null;
  paragraph_index: number | null;
  quote_text: string | null;
  source_excerpt: string | null;
  target_screen: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type RunRow = {
  id: string;
  audit_type: string;
  provider: string | null;
  provider_model: string | null;
  finding_count: number;
  candidate_paragraph_count: number;
  audited_chars: number;
  truncated: boolean;
  completed_at: string | null;
  coverage_json: Record<string, unknown> | null;
};

function candidateReferenceEvidence(
  metadata: Record<string, unknown> | null,
) {
  const raw = metadata?.candidateReferences;
  if (!Array.isArray(raw)) return [];

  const matchReason =
    typeof metadata?.referenceMatchReason === "string"
      ? metadata.referenceMatchReason
      : "";

  return raw.slice(0, 3).flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];

    const reference = item as Record<string, unknown>;
    const title =
      typeof reference.title === "string"
        ? reference.title
        : "Saved reference";
    const authors =
      typeof reference.authorsText === "string"
        ? reference.authorsText
        : "";
    const year =
      typeof reference.publishedYear === "number"
        ? ` (${reference.publishedYear})`
        : "";
    const linked =
      reference.linkedToStudy === true
        ? "linked to this study"
        : "global Reference Manager";
    const evidenceLevel =
      reference.extractedTextAvailable === true
        ? "metadata + extracted PDF text available"
        : "metadata/abstract review";

    return [
      {
        source: "Reference Manager candidate",
        summary: `${authors ? `${authors}${year} · ` : ""}${title} · ${linked} · ${evidenceLevel}${
          matchReason ? ` · ${matchReason}` : ""
        }. Candidate source only; PsyLattice is not asserting that it supports the claim.`,
      },
    ];
  });
}

function writingSuggestionEvidence(
  metadata: Record<string, unknown> | null,
) {
  const suggestion =
    typeof metadata?.suggestedImprovement === "string"
      ? metadata.suggestedImprovement.trim()
      : "";

  if (!suggestion) return [];

  return [
    {
      source: "AI revision guidance",
      summary: suggestion,
    },
  ];
}


function researchLogicEvidence(
  metadata: Record<string, unknown> | null,
) {
  const raw = metadata?.analysisEvidence;
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, 6).flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];

    const record = item as Record<string, unknown>;
    const label =
      typeof record.analysisLabel === "string"
        ? record.analysisLabel
        : "Saved analysis";
    const type =
      typeof record.analysisType === "string"
        ? record.analysisType
        : "analysis";
    const finalN =
      typeof record.finalAnalysisRows === "number"
        ? ` · final N ${record.finalAnalysisRows}`
        : "";

    return [
      {
        source: "Analysis Lab record",
        summary: `${label} · ${type}${finalN}. Persisted analysis evidence used by the AI review.`,
      },
    ];
  });
}

function targetScreen(value: string): StudyHealthScreenTarget {
  if (value === "analysis" || value === "builder" || value === "writing") {
    return value;
  }
  return "writing";
}

export type SemanticAuditSnapshot = {
  checks: StudyHealthCheck[];
  activeFindings: number;
  latestRunAt: string | null;
  latestProvider: string | null;
  latestProviderModel: string | null;
  candidateParagraphs: number;
  auditedChars: number;
  truncated: boolean;
  referenceLibraryPermitted: boolean;
  referenceItemsSupplied: number;
  available: boolean;
  note: string;
};

export async function loadSemanticAuditSnapshot(
  supabase: SupabaseClient,
  userId: string,
  studyId: string,
): Promise<SemanticAuditSnapshot> {
  try {
    const [findingResult, runResult] = await Promise.all([
      supabase
        .from("research_health_ai_findings")
        .select(
          "id,run_id,audit_type,category,severity,confidence,title,detail,reason,suggested_action,document_id,paragraph_index,quote_text,source_excerpt,target_screen,metadata,created_at",
        )
        .eq("owner_user_id", userId)
        .eq("study_id", studyId)
        .in("audit_type", [...ACTIVE_AUDIT_TYPES])
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(80),

      supabase
        .from("research_health_audit_runs")
        .select(
          "id,audit_type,provider,provider_model,finding_count,candidate_paragraph_count,audited_chars,truncated,completed_at,coverage_json",
        )
        .eq("owner_user_id", userId)
        .eq("study_id", studyId)
        .in("audit_type", [...ACTIVE_AUDIT_TYPES])
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (findingResult.error) throw findingResult.error;
    if (runResult.error) throw runResult.error;

    const findings = (findingResult.data || []) as FindingRow[];
    const runs = (runResult.data || []) as RunRow[];
    const latestRun = runs[0] || null;
    const latestCitationRun =
      runs.find((run) => run.audit_type === "thesis_citation_coverage") || null;
    const citationCoverage = latestCitationRun?.coverage_json || {};
    const referenceLibraryPermitted =
      citationCoverage.referenceLibraryPermitted === true;
    const referenceItemsSupplied =
      typeof citationCoverage.referenceItemsSupplied === "number"
        ? citationCoverage.referenceItemsSupplied
        : 0;

    const checks: StudyHealthCheck[] = findings.map((finding) => {
      const documentTitle =
        typeof finding.metadata?.documentTitle === "string"
          ? finding.metadata.documentTitle
          : "Linked Thesis document";
      const confidenceText =
        finding.confidence === null
          ? ""
          : ` · AI confidence ${Math.round(finding.confidence * 100)}%`;
      const lineStart =
        typeof finding.metadata?.lineStart === "number"
          ? finding.metadata.lineStart
          : null;
      const lineEnd =
        typeof finding.metadata?.lineEnd === "number"
          ? finding.metadata.lineEnd
          : null;
      const lineText =
        lineStart === null
          ? ""
          : lineEnd !== null && lineEnd !== lineStart
            ? ` · lines ${lineStart}-${lineEnd}`
            : ` · line ${lineStart}`;

      const auditLabel =
        finding.audit_type === "research_logic"
          ? "AI research-logic review"
          : finding.audit_type === "thesis_writing_quality"
            ? "AI writing-quality review"
            : "AI citation review";

      return {
        id: `semantic.${finding.id}`,
        section: finding.audit_type === "research_logic" ? "reporting" : "writing",
        label: finding.title,
        status: "attention",
        severity:
          finding.severity === "high" ||
          finding.severity === "medium" ||
          finding.severity === "low"
            ? finding.severity
            : "low",
        origin: "semantic_ai",
        detail: `${finding.detail}${
          finding.reason ? ` Reason: ${finding.reason}` : ""
        }`,
        scoreEligible: false,
        evidence: [
          {
            source: auditLabel,
            summary: `Review prompt${confidenceText}. This does not change the deterministic readiness score.`,
          },
          ...(finding.document_id && finding.quote_text
            ? [
                {
                  source: "research_writing_documents",
                  recordIds: [finding.document_id],
                  summary: `${documentTitle}${lineText}${
                    finding.paragraph_index !== null
                      ? ` · paragraph ${finding.paragraph_index + 1}`
                      : ""
                  }: “${finding.quote_text}”`,
                },
              ]
            : []),
          ...writingSuggestionEvidence(finding.metadata),
          ...candidateReferenceEvidence(finding.metadata),
          ...researchLogicEvidence(finding.metadata),
        ],
        action: {
          target: targetScreen(finding.target_screen),
          label:
            finding.suggested_action ||
            (finding.audit_type === "research_logic"
              ? "Review cross-module evidence"
              : "Review in Thesis Builder"),
          studyId,
        },
      };
    });

    return {
      checks,
      activeFindings: findings.length,
      latestRunAt: latestRun?.completed_at || null,
      latestProvider: latestRun?.provider || null,
      latestProviderModel: latestRun?.provider_model || null,
      candidateParagraphs: latestRun?.candidate_paragraph_count || 0,
      auditedChars: latestRun?.audited_chars || 0,
      truncated: latestRun?.truncated === true,
      referenceLibraryPermitted,
      referenceItemsSupplied,
      available: true,
      note: latestRun
        ? `${findings.length} active AI research-review finding${
            findings.length === 1 ? "" : "s"
          } across enabled semantic audits.`
        : "No semantic research review has been run for this study yet.",
    };
  } catch (error) {
    console.error("Could not load semantic Study Health findings:", error);
    return {
      checks: [],
      activeFindings: 0,
      latestRunAt: null,
      latestProvider: null,
      latestProviderModel: null,
      candidateParagraphs: 0,
      auditedChars: 0,
      truncated: false,
      referenceLibraryPermitted: false,
      referenceItemsSupplied: 0,
      available: false,
      note:
        "Semantic audit findings could not be read. Deterministic Study Health remains available.",
    };
  }
}
