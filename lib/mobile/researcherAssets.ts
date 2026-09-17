import {
  isResponse,
  isUuid,
  mobileData,
  mobileError,
  readJsonObject,
  type MobileAuthContext,
} from "./participantApi";

export type ResearcherRateScope = "researcherReads" | "researcherMutations";
type Read = (
  request: Request,
  allowedParams: string[],
  query: (auth: MobileAuthContext, params: URLSearchParams) => Promise<Response>,
  scope?: ResearcherRateScope
) => Promise<Response>;
type Paginate = (params: URLSearchParams) => { page: number; limit: number; offset: number } | null;
type StudyContext = { params: Promise<{ id: string }> };
type LibraryVersion = {
  id: string;
  questionnaire_id: string;
  version_label: string;
  questionnaire: { name: string; updated_at: string };
};
type Measure = {
  id: string;
  questionnaire_id: string;
  questionnaire_version_id: string;
  measurement_point: string;
  position: number;
  required: boolean;
};
type AttachedMeasure = Measure & {
  nameSnapshot: string | null;
  versionLabelSnapshot: string | null;
  questionnaire: { name: string } | null;
  version: { questionnaire_id: string; version_label: string } | null;
};
type AppendStudy = {
  id: string;
  baselineEnabled: boolean | null;
  demographicsEnabled: boolean | null;
  demographicsPosition: string | null;
};

const MEASURE_COLUMNS = "id, questionnaire_id, questionnaire_version_id, measurement_point, position, required";
const ATTACHED_COLUMNS = `${MEASURE_COLUMNS},
  nameSnapshot:config->>questionnaire_name_snapshot,
  versionLabelSnapshot:config->>version_label_snapshot,
  questionnaire:questionnaires!inner(name),
  version:questionnaire_versions!inner(questionnaire_id, version_label)`;

function accessFilter(userId: string) {
  // Existing RLS exposes active system questionnaires (no owner) and one's own.
  // Other researchers' questionnaires are outside this mobile projection.
  return `owner_user_id.eq.${userId},owner_user_id.is.null`;
}

function attachmentDto(measure: Measure, title: string, versionLabel: string) {
  return {
    studyMeasureId: measure.id,
    type: "questionnaire",
    questionnaireId: measure.questionnaire_id,
    questionnaireVersionId: measure.questionnaire_version_id,
    title,
    versionLabel,
    measurementPoint: measure.measurement_point,
    position: measure.position,
    required: measure.required,
  };
}

function ownedStudy(auth: MobileAuthContext, id: string, columns = "id") {
  return auth.supabase
    .from("research_studies")
    .select(columns)
    .eq("owner_user_id", auth.userId)
    .eq("id", id)
    .limit(1)
    .maybeSingle();
}

export function researcherAssetHandlers(read: Read, paginate: Paginate) {
  return {
    async assets(request: Request) {
      return read(request, ["page", "limit"], async ({ supabase, userId }, params) => {
        const window = paginate(params);
        if (!window) return mobileError("VALIDATION_FAILED", 400);
        const { page, limit, offset } = window;
        const { data, error } = await supabase
          .from("questionnaire_versions")
          .select("id, questionnaire_id, version_label, questionnaire:questionnaires!inner(name, updated_at)")
          .eq("is_current", true)
          .eq("questionnaire.researcher_available", true)
          .eq("questionnaire.status", "active")
          .or(accessFilter(userId), { referencedTable: "questionnaire" })
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + limit)
          .overrideTypes<LibraryVersion[], { merge: false }>();
        if (error || data === null) return mobileError("SERVER_ERROR");
        return mobileData({
          items: data.slice(0, limit).map((version) => ({
            type: "questionnaire",
            questionnaireId: version.questionnaire_id,
            questionnaireVersionId: version.id,
            title: version.questionnaire.name,
            versionLabel: version.version_label,
            updatedAt: version.questionnaire.updated_at,
          })),
          page,
          limit,
          hasMore: data.length > limit,
        });
      });
    },

    async studyAssets(request: Request, { params }: StudyContext) {
      return read(request, ["page", "limit"], async (auth, queryParams) => {
        const { id } = await params;
        if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
        const window = paginate(queryParams);
        if (!window) return mobileError("VALIDATION_FAILED", 400);
        const study = await ownedStudy(auth, id);
        if (study.error) return mobileError("SERVER_ERROR");
        if (!study.data) return mobileError("FORBIDDEN");
        const { page, limit, offset } = window;
        const { data, error } = await auth.supabase
          .from("study_measures")
          .select(ATTACHED_COLUMNS)
          .eq("owner_user_id", auth.userId)
          .eq("study_id", id)
          .or(accessFilter(auth.userId), { referencedTable: "questionnaire" })
          .order("position", { ascending: true })
          .order("id", { ascending: true })
          .range(offset, offset + limit)
          .overrideTypes<AttachedMeasure[], { merge: false }>();
        if (error || data === null) return mobileError("SERVER_ERROR");
        return mobileData({
          items: data.slice(0, limit).flatMap((measure) => {
            // study_measures is questionnaire-backed; omit malformed/unavailable
            // joins and mismatched legacy pins instead of relabelling other assets.
            if (
              !isUuid(measure.questionnaire_id) ||
              !isUuid(measure.questionnaire_version_id) ||
              !measure.questionnaire ||
              !measure.version ||
              measure.version.questionnaire_id !== measure.questionnaire_id
            ) return [];
            return [attachmentDto(
              measure,
              measure.nameSnapshot ?? measure.questionnaire.name,
              measure.versionLabelSnapshot ?? measure.version.version_label
            )];
          }),
          page,
          limit,
          hasMore: data.length > limit,
        });
      });
    },

    async attachStudyAsset(request: Request, { params }: StudyContext) {
      return read(request, [], async (auth) => {
        const { id } = await params;
        if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
        const body = await readJsonObject(request);
        if (isResponse(body)) return body;
        if (
          Object.keys(body).length !== 3 ||
          Object.keys(body).some((key) => !["type", "questionnaire_id", "questionnaire_version_id"].includes(key)) ||
          body.type !== "questionnaire" ||
          !isUuid(body.questionnaire_id) ||
          !isUuid(body.questionnaire_version_id)
        ) return mobileError("VALIDATION_FAILED", 400);

        const study = await ownedStudy(auth, id,
          "id, baselineEnabled:components->baseline, demographicsEnabled:components->demographics, demographicsPosition:study_config->>demographics_position"
        ).overrideTypes<AppendStudy, { merge: false }>();
        if (study.error) return mobileError("SERVER_ERROR");
        if (!study.data) return mobileError("FORBIDDEN");
        // Match the builder defaults for legacy studies; explicit false disables baseline.
        if (study.data.baselineEnabled === false) return mobileError("STUDY_UNAVAILABLE");

        const questionnaire = await auth.supabase
          .from("questionnaires")
          .select("id, name, acronym, source_type")
          .eq("id", body.questionnaire_id)
          .eq("researcher_available", true)
          .eq("status", "active")
          .or(accessFilter(auth.userId))
          .limit(1)
          .maybeSingle()
          .overrideTypes<{ id: string; name: string; acronym: string | null; source_type: string }, { merge: false }>();
        if (questionnaire.error) return mobileError("SERVER_ERROR");
        if (!questionnaire.data) return mobileError("FORBIDDEN");
        const version = await auth.supabase
          .from("questionnaire_versions")
          .select("id, questionnaire_id, version_label")
          .eq("id", body.questionnaire_version_id)
          .eq("questionnaire_id", body.questionnaire_id)
          .eq("is_current", true)
          .limit(1)
          .maybeSingle()
          .overrideTypes<{ id: string; questionnaire_id: string; version_label: string }, { merge: false }>();
        if (version.error) return mobileError("SERVER_ERROR");
        if (!version.data) return mobileError("VALIDATION_FAILED", 400);

        // Preserve cross-type flow positions: append after existing baseline
        // questionnaires, cognitive entries, and the enabled demographics unit.
        // Only positions are read from cognitive attachments; none are written.
        const [measures, cognitive] = await Promise.all([
          auth.supabase.from("study_measures").select("position")
            .eq("owner_user_id", auth.userId).eq("study_id", id)
            .eq("measurement_point", "baseline")
            .order("position", { ascending: false }).limit(1).maybeSingle(),
          auth.supabase.from("study_cognitive_tasks").select("position")
            .eq("owner_user_id", auth.userId).eq("study_id", id)
            .order("position", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (measures.error || cognitive.error) return mobileError("SERVER_ERROR");
        const demographicsPosition = study.data.demographicsEnabled === false
          ? 0 : Number(study.data.demographicsPosition ?? 1);
        const lastPosition = Math.max(measures.data?.position ?? 0, cognitive.data?.position ?? 0, demographicsPosition);
        if (!Number.isInteger(lastPosition) || lastPosition < 0 || lastPosition >= 2_147_483_647) {
          return mobileError("SERVER_ERROR");
        }
        const { data, error } = await auth.supabase
          .from("study_measures")
          .insert({
            study_id: id,
            owner_user_id: auth.userId,
            questionnaire_id: body.questionnaire_id,
            questionnaire_version_id: body.questionnaire_version_id,
            measurement_point: "baseline",
            position: lastPosition + 1,
            required: true,
            config: {
              source_type: questionnaire.data.source_type,
              questionnaire_name_snapshot: questionnaire.data.name,
              questionnaire_acronym_snapshot: questionnaire.data.acronym,
              version_label_snapshot: version.data.version_label,
            },
          })
          .select(MEASURE_COLUMNS)
          .single()
          .overrideTypes<Measure, { merge: false }>();
        if (error) return mobileError(error.code === "23505" ? "CONFLICT" : "SERVER_ERROR", error.code === "23505" ? 409 : 503);
        if (!data) return mobileError("SERVER_ERROR");
        return mobileData(attachmentDto(data, questionnaire.data.name, version.data.version_label), 201);
      }, "researcherMutations");
    },
  };
}
