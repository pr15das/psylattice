import type { ResearchAiProvider } from "@/lib/billing/ai";

export type SemanticAuditType =
  | "thesis_citation_coverage"
  | "thesis_writing_quality"
  | "research_logic";

export type ThesisAuditParagraph = {
  documentId: string;
  documentTitle: string;
  paragraphIndex: number;
  lineStart: number;
  lineEnd: number;
  text: string;
};

export type ReferenceAuditItem = {
  id: string;
  title: string;
  authorsText: string;
  publishedYear: number | null;
  containerTitle: string | null;
  doi: string | null;
  abstract: string | null;
  keywords: string[];
  linkedToStudy: boolean;
  extractedText: string | null;
  extractedTextAvailable: boolean;
};

export type ThesisCitationAuditContext = {
  studyId: string;
  studyTitle: string;
  paragraphs: ThesisAuditParagraph[];
  documentCount: number;
  auditedChars: number;
  truncated: boolean;
  referenceLibrary: {
    permitted: boolean;
    totalLibraryItems: number;
    suppliedItems: ReferenceAuditItem[];
    linkedItems: number;
    extractedTextItems: number;
  };
};

export type ThesisWritingAuditContext = {
  studyId: string;
  studyTitle: string;
  studyDesign: string | null;
  paragraphs: ThesisAuditParagraph[];
  documentCount: number;
  auditedChars: number;
  truncated: boolean;
};

export type ResearchLogicAnalysisRecord = {
  id: string;
  analysisType: string;
  analysisLabel: string;
  title: string;
  datasetLabel: string | null;
  dataFingerprintPresent: boolean;
  sourceRows: number | null;
  workingRows: number | null;
  afterFiltersRows: number | null;
  completeAcrossSetupRows: number | null;
  incompleteAcrossSetupRows: number | null;
  finalAnalysisRows: number | null;
  analysisCreatedAt: string;
  setupJson: string | null;
  primaryTableJson: string | null;
  supplementaryTablesJson: string | null;
};

export type ResearchLogicAuditContext = {
  studyId: string;
  studyTitle: string;
  study: {
    design: string | null;
    status: string;
    targetSampleSize: number | null;
    participantDescriptionPresent: boolean;
    enabledComponents: string[];
    studyConfigKeys: string[];
  };
  participants: {
    live: number;
    completed: number;
    baselineComplete: number;
    withdrawn: number;
    test: number;
  };
  paragraphs: ThesisAuditParagraph[];
  documentCount: number;
  auditedChars: number;
  truncated: boolean;
  analyses: ResearchLogicAnalysisRecord[];
  analysisContextChars: number;
};

export type ResearchLogicCategory =
  | "causal_design_alignment"
  | "results_analysis_consistency"
  | "discussion_results_consistency"
  | "analysis_reporting_coverage"
  | "thesis_hypothesis_analysis_coverage"
  | "methodological_alignment"
  | "interpretation_strength";

export type ResearchLogicModelFinding = {
  documentId: string | null;
  paragraphIndex: number | null;
  quote: string | null;
  category: ResearchLogicCategory;
  reason: string;
  suggestedAction: string;
  confidence: number;
  analysisRecordIds: string[];
  targetScreen: "writing" | "analysis" | "builder";
};

export type ThesisCitationModelFinding = {
  documentId: string;
  paragraphIndex: number;
  quote: string;
  reason: string;
  confidence: number;
  claimType:
    | "empirical"
    | "methodological"
    | "theoretical"
    | "definition"
    | "historical"
    | "other";
  candidateReferenceIds?: string[];
  referenceMatchReason?: string | null;
};

export type ThesisWritingQualityCategory =
  | "clarity"
  | "precision"
  | "academic_tone"
  | "concision"
  | "cohesion"
  | "redundancy"
  | "vagueness"
  | "argument_flow"
  | "terminology_consistency"
  | "overstatement"
  | "causal_strength"
  | "sentence_structure";

export type ThesisWritingModelFinding = {
  documentId: string;
  paragraphIndex: number;
  quote: string;
  category: ThesisWritingQualityCategory;
  reason: string;
  suggestedImprovement: string;
  confidence: number;
};

export type ValidatedSemanticFinding = {
  findingKey: string;
  category: string;
  severity: "low" | "medium";
  confidence: number;
  title: string;
  detail: string;
  reason: string;
  suggestedAction: string;
  documentId: string | null;
  paragraphIndex: number | null;
  quoteText: string | null;
  sourceExcerpt: string | null;
  targetScreen: "writing" | "analysis" | "builder";
  metadata: Record<string, unknown>;
};

export type SemanticAuditExecution = {
  provider: ResearchAiProvider;
  providerModel: string;
  inputTokens: number | null;
  outputTokens: number | null;
  rawText: string;
};
