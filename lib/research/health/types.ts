export type StudyHealthStatus =
  | "complete"
  | "attention"
  | "in_progress"
  | "not_applicable"
  | "unavailable";

export type StudyHealthSeverity = "info" | "low" | "medium" | "high";
export type StudyHealthOrigin = "deterministic" | "semantic_ai";

export type StudyHealthSectionId =
  | "design"
  | "recruitment"
  | "data"
  | "analysis"
  | "writing"
  | "reporting";

export type StudyHealthScreenTarget =
  | "studies"
  | "builder"
  | "library"
  | "cognitive"
  | "references"
  | "writing"
  | "ambulatory"
  | "followup"
  | "participants"
  | "links"
  | "data"
  | "explorer"
  | "analysis"
  | "exports"
  | "ethics"
  | "team";

export type StudyHealthAction = {
  target: StudyHealthScreenTarget;
  label: string;
  studyId?: string;
};

export type StudyHealthEvidence = {
  source: string;
  summary: string;
  recordIds?: string[];
  field?: string;
};

export type StudyHealthCheck = {
  id: string;
  section: StudyHealthSectionId;
  label: string;
  status: StudyHealthStatus;
  severity: StudyHealthSeverity;
  origin: StudyHealthOrigin;
  detail: string;
  scoreEligible: boolean;
  evidence: StudyHealthEvidence[];
  action?: StudyHealthAction | null;
};

export type StudyHealthSection = {
  id: StudyHealthSectionId;
  label: string;
  state: "active" | "not_enabled";
  note?: string;
  checks: StudyHealthCheck[];
  counts: {
    complete: number;
    attention: number;
    inProgress: number;
    notApplicable: number;
    unavailable: number;
  };
};

export type StudyHealthSourceKey =
  | "participants"
  | "links"
  | "measures"
  | "cognitive"
  | "consent"
  | "demographics"
  | "ambulatory"
  | "analysis"
  | "writing"
  | "references";

export type StudyHealthSourceState = Record<
  StudyHealthSourceKey,
  { ok: boolean; reason?: string }
>;

export type StudyHealthStudy = {
  id: string;
  owner_user_id: string;
  title: string;
  participant_description: string | null;
  design: string | null;
  target_sample_size: number | null;
  status: string;
  components: Record<string, unknown> | null;
  study_config: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StudyHealthParticipant = {
  id: string;
  is_test: boolean;
  status: string;
  completed_at: string | null;
};

export type StudyHealthLink = {
  id: string;
  is_test_link: boolean;
  status: string;
  max_participants: number | null;
  starts_at: string | null;
  ends_at: string | null;
};

export type StudyHealthMeasure = {
  id: string;
  measurement_point: string;
  required: boolean;
  followup_wave_id: string | null;
};

export type StudyHealthConsent = {
  id: string;
  consent_method: string | null;
  participant_information: string | null;
  external_consent_note: string | null;
  is_current: boolean;
  updated_at: string | null;
};

export type StudyHealthDemographicQuestion = {
  id: string;
  required: boolean;
  direct_identifier: boolean;
};

export type StudyHealthAmbulatoryProtocol = {
  id: string;
  name: string | null;
  duration_days: number | null;
  is_enabled: boolean;
};

export type StudyHealthWritingDocument = {
  id: string;
  title: string;
  content_text: string | null;
  updated_at: string | null;
};

export type StudyHealthReferenceLink = {
  reference_id: string;
};

export type StudyHealthAnalysisRecord = {
  id: string;
  client_record_id: string;
  analysis_type: string;
  analysis_label: string;
  title: string;
  dataset_key: string | null;
  dataset_label: string | null;
  data_fingerprint: string | null;
  source_rows: number | null;
  working_rows: number | null;
  after_filters_rows: number | null;
  explicitly_excluded_rows: number | null;
  complete_across_setup_rows: number | null;
  incomplete_across_setup_rows: number | null;
  record_json: Record<string, unknown>;
  analysis_created_at: string;
  updated_at: string;
};

export type StudyHealthSnapshot = {
  study: StudyHealthStudy;
  sourceState: StudyHealthSourceState;
  participants: StudyHealthParticipant[];
  links: StudyHealthLink[];
  measures: StudyHealthMeasure[];
  cognitiveTaskIds: string[];
  consentVersions: StudyHealthConsent[];
  demographicQuestions: StudyHealthDemographicQuestion[];
  ambulatoryProtocols: StudyHealthAmbulatoryProtocol[];
  analysisRecords: StudyHealthAnalysisRecord[];
  writingDocuments: StudyHealthWritingDocument[];
  referenceLinks: StudyHealthReferenceLink[];
};

export type StudyHealthMetrics = {
  protocol: {
    baselineMeasures: number;
    followupMeasures: number;
    cognitiveTasks: number;
    demographicQuestions: number;
    enabledAmbulatoryProtocols: number;
  };
  recruitment: {
    liveParticipants: number;
    testParticipants: number;
    completedLiveParticipants: number;
    baselineCompleteParticipants: number;
    withdrawnLiveParticipants: number;
    activeLiveLinks: number;
    activeTestLinks: number;
    targetSampleSize: number | null;
    targetProgressPercent: number | null;
  };
  analysis: {
    savedRecords: number;
    analysisTypes: number;
    uniqueFingerprints: number;
    latestRecordAt: string | null;
  };
  writing: {
    linkedDocuments: number;
    documentsWithText: number;
    totalTextCharacters: number;
    linkedReferences: number;
  };
};

export type StudyHealthReport = {
  schemaVersion: 1;
  generatedAt: string;
  study: {
    id: string;
    title: string;
    status: string;
    design: string | null;
    targetSampleSize: number | null;
  };
  readiness: {
    completed: number;
    applicable: number;
    attention: number;
    inProgress: number;
    unavailable: number;
    percent: number | null;
    label: "Research readiness";
  };
  sections: StudyHealthSection[];
  metrics: StudyHealthMetrics;
  nextActions: Array<{
    checkId: string;
    section: StudyHealthSectionId;
    label: string;
    detail: string;
    status: StudyHealthStatus;
    severity: StudyHealthSeverity;
    action: StudyHealthAction;
  }>;
  sourceState: StudyHealthSourceState;
  capabilities: {
    deterministicEngine: {
      status: "active";
      producesAiJudgements: false;
    };
    thesisText: {
      available: boolean;
      note: string;
    };
    linkedReferences: {
      available: boolean;
      note: string;
    };
    serverPersistedAnalysisResults: {
      available: boolean;
      recordCount: number;
      note: string;
    };
    semanticAiAudits: {
      enabled: boolean;
      available: boolean;
      findingsProduced: boolean;
      activeFindings: number;
      latestRunAt: string | null;
      latestProvider: string | null;
      latestProviderModel: string | null;
      candidateParagraphs: number;
      auditedChars: number;
      truncated: boolean;
      referenceLibraryPermitted: boolean;
      referenceItemsSupplied: number;
      note: string;
    };
  };
};
