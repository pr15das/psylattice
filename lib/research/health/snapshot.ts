import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StudyHealthAmbulatoryProtocol,
  StudyHealthAnalysisRecord,
  StudyHealthConsent,
  StudyHealthDemographicQuestion,
  StudyHealthLink,
  StudyHealthMeasure,
  StudyHealthParticipant,
  StudyHealthReferenceLink,
  StudyHealthSnapshot,
  StudyHealthSourceKey,
  StudyHealthSourceState,
  StudyHealthStudy,
  StudyHealthWritingDocument,
} from "@/lib/research/health/types";

type QueryResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

function blankSourceState(): StudyHealthSourceState {
  return {
    participants: { ok: true },
    links: { ok: true },
    measures: { ok: true },
    cognitive: { ok: true },
    consent: { ok: true },
    demographics: { ok: true },
    ambulatory: { ok: true },
    analysis: { ok: true },
    writing: { ok: true },
    references: { ok: true },
  };
}

function recordSourceFailure(
  state: StudyHealthSourceState,
  key: StudyHealthSourceKey,
  error: { message?: string } | null,
) {
  if (!error) return;

  state[key] = {
    ok: false,
    reason:
      "This PsyLattice source could not be read for the current health check.",
  };

  console.error(
    `[Study Health] ${key} source failed:`,
    error.message || "Unknown database error",
  );
}

export async function loadStudyHealthSnapshot(
  supabase: SupabaseClient,
  userId: string,
  studyId: string,
): Promise<StudyHealthSnapshot> {
  const { data: studyData, error: studyError } = await supabase
    .from("research_studies")
    .select(
      "id,owner_user_id,title,participant_description,design,target_sample_size,status,components,study_config,created_at,updated_at",
    )
    .eq("id", studyId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (studyError) throw studyError;
  if (!studyData) throw new Error("STUDY_NOT_FOUND");

  const [
    participantResult,
    linkResult,
    measureResult,
    cognitiveResult,
    consentResult,
    demographicResult,
    ambulatoryResult,
    analysisResult,
    writingResult,
    referenceResult,
  ] = (await Promise.all([
    supabase
      .from("study_participants")
      .select("id,is_test,status,completed_at")
      .eq("study_id", studyId)
      .eq("owner_user_id", userId),

    supabase
      .from("study_links")
      .select("id,is_test_link,status,max_participants,starts_at,ends_at")
      .eq("study_id", studyId)
      .eq("owner_user_id", userId),

    supabase
      .from("study_measures")
      .select("id,measurement_point,required,followup_wave_id")
      .eq("study_id", studyId)
      .eq("owner_user_id", userId),

    supabase
      .from("study_cognitive_tasks")
      .select("id")
      .eq("study_id", studyId)
      .eq("owner_user_id", userId),

    supabase
      .from("study_consent_versions")
      .select(
        "id,consent_method,participant_information,external_consent_note,is_current,updated_at",
      )
      .eq("study_id", studyId)
      .eq("owner_user_id", userId)
      .eq("is_current", true)
      .order("updated_at", { ascending: false }),

    supabase
      .from("study_demographic_questions")
      .select("id,required,direct_identifier")
      .eq("study_id", studyId)
      .eq("owner_user_id", userId),

    supabase
      .from("study_ambulatory_protocols")
      .select("id,name,duration_days,is_enabled")
      .eq("study_id", studyId)
      .eq("owner_user_id", userId),

    supabase
      .from("research_analysis_records")
      .select(
        "id,client_record_id,analysis_type,analysis_label,title,dataset_key,dataset_label,data_fingerprint,source_rows,working_rows,after_filters_rows,explicitly_excluded_rows,complete_across_setup_rows,incomplete_across_setup_rows,record_json,analysis_created_at,updated_at",
      )
      .eq("study_id", studyId)
      .eq("owner_user_id", userId)
      .order("analysis_created_at", { ascending: false })
      .limit(100),

    supabase
      .from("research_writing_documents")
      .select("id,title,content_text,updated_at")
      .eq("study_id", studyId)
      .eq("owner_user_id", userId)
      .order("updated_at", { ascending: false }),

    supabase
      .from("reference_study_links")
      .select("reference_id")
      .eq("study_id", studyId)
      .eq("owner_user_id", userId),
  ])) as [
    QueryResult<StudyHealthParticipant>,
    QueryResult<StudyHealthLink>,
    QueryResult<StudyHealthMeasure>,
    QueryResult<{ id: string }>,
    QueryResult<StudyHealthConsent>,
    QueryResult<StudyHealthDemographicQuestion>,
    QueryResult<StudyHealthAmbulatoryProtocol>,
    QueryResult<StudyHealthAnalysisRecord>,
    QueryResult<StudyHealthWritingDocument>,
    QueryResult<StudyHealthReferenceLink>,
  ];

  const sourceState = blankSourceState();

  recordSourceFailure(sourceState, "participants", participantResult.error);
  recordSourceFailure(sourceState, "links", linkResult.error);
  recordSourceFailure(sourceState, "measures", measureResult.error);
  recordSourceFailure(sourceState, "cognitive", cognitiveResult.error);
  recordSourceFailure(sourceState, "consent", consentResult.error);
  recordSourceFailure(sourceState, "demographics", demographicResult.error);
  recordSourceFailure(sourceState, "ambulatory", ambulatoryResult.error);
  recordSourceFailure(sourceState, "analysis", analysisResult.error);
  recordSourceFailure(sourceState, "writing", writingResult.error);
  recordSourceFailure(sourceState, "references", referenceResult.error);

  return {
    study: studyData as StudyHealthStudy,
    sourceState,
    participants: participantResult.error ? [] : participantResult.data || [],
    links: linkResult.error ? [] : linkResult.data || [],
    measures: measureResult.error ? [] : measureResult.data || [],
    cognitiveTaskIds: cognitiveResult.error
      ? []
      : (cognitiveResult.data || []).map((row) => String(row.id)),
    consentVersions: consentResult.error ? [] : consentResult.data || [],
    demographicQuestions: demographicResult.error
      ? []
      : demographicResult.data || [],
    ambulatoryProtocols: ambulatoryResult.error
      ? []
      : ambulatoryResult.data || [],
    analysisRecords: analysisResult.error ? [] : analysisResult.data || [],
    writingDocuments: writingResult.error ? [] : writingResult.data || [],
    referenceLinks: referenceResult.error ? [] : referenceResult.data || [],
  };
}
