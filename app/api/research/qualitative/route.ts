import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SOURCE_TYPES = new Set([
  "interview",
  "transcript",
  "focus_group",
  "diary",
  "field_note",
  "document",
  "other",
]);

function reply(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function text(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function rawText(value: unknown, max: number) {
  return String(value ?? "").slice(0, max);
}

function fieldKey(value: unknown) {
  return text(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

async function authenticatedUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

async function ownedQualitativeStudy(
  admin: ReturnType<typeof researchAdmin>,
  ownerUserId: string,
  studyId: string,
) {
  const { data, error } = await admin
    .from("research_studies")
    .select(
      "id,title,status,components,participant_description,design,updated_at",
    )
    .eq("id", studyId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const components =
    data.components && typeof data.components === "object"
      ? (data.components as Record<string, unknown>)
      : {};

  return {
    ...data,
    qualitativeEnabled: components.qualitative === true,
  };
}

async function participantForStudy(
  admin: ReturnType<typeof researchAdmin>,
  ownerUserId: string,
  studyId: string,
  participantId: string,
) {
  const { data, error } = await admin
    .from("study_participants")
    .select("id,public_id,status,is_test,enrolled_at,completed_at")
    .eq("id", participantId)
    .eq("study_id", studyId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function caseForStudy(
  admin: ReturnType<typeof researchAdmin>,
  ownerUserId: string,
  studyId: string,
  caseId: string,
) {
  const { data, error } = await admin
    .from("qualitative_cases")
    .select("*")
    .eq("id", caseId)
    .eq("study_id", studyId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function ensureDefaultClassification(
  admin: ReturnType<typeof researchAdmin>,
  ownerUserId: string,
  studyId: string,
) {
  const { data, error } = await admin
    .from("qualitative_case_classifications")
    .select("name")
    .eq("owner_user_id", ownerUserId)
    .eq("study_id", studyId);

  if (error) throw error;
  const existing = new Set((data || []).map((row) => String(row.name).toLowerCase()));
  const inserts = [
    { name: "Case", description: "Default standalone qualitative case classification.", position: 0 },
    { name: "Participant", description: "Qualitative case linked to a PsyLattice study participant.", position: 1 },
  ]
    .filter((item) => !existing.has(item.name.toLowerCase()))
    .map((item) => ({
      owner_user_id: ownerUserId,
      study_id: studyId,
      ...item,
    }));

  if (inserts.length === 0) return;
  const { error: insertError } = await admin
    .from("qualitative_case_classifications")
    .insert(inserts);

  if (insertError && insertError.code !== "23505") throw insertError;
}

async function ensureOwnerCoderIdentity(
  admin: ReturnType<typeof researchAdmin>,
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  },
  studyId: string,
) {
  const { data: existing, error: existingError } = await admin
    .from("qualitative_coder_identities")
    .select("id,label,linked_user_id,identity_type,status")
    .eq("study_id", studyId)
    .eq("owner_user_id", user.id)
    .eq("identity_type", "owner")
    .eq("status", "active")
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    const { error: backfillError } = await admin
      .from("qualitative_codings")
      .update({ coder_identity_id: existing.id })
      .eq("study_id", studyId)
      .eq("owner_user_id", user.id)
      .is("coder_identity_id", null);

    if (backfillError) throw backfillError;
    return existing;
  }

  const metaName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const label = metaName || user.email || "Study owner";

  const { data, error } = await admin
    .from("qualitative_coder_identities")
    .insert({
      owner_user_id: user.id,
      study_id: studyId,
      linked_user_id: user.id,
      label,
      email: user.email || null,
      identity_type: "owner",
      status: "active",
    })
    .select("id,label,linked_user_id,identity_type,status")
    .single();

  if (error) throw error;

  const { error: backfillError } = await admin
    .from("qualitative_codings")
    .update({ coder_identity_id: data.id })
    .eq("study_id", studyId)
    .eq("owner_user_id", user.id)
    .is("coder_identity_id", null);

  if (backfillError) throw backfillError;
  return data;
}

async function writeQualitativeAudit(
  admin: ReturnType<typeof researchAdmin>,
  ownerUserId: string,
  studyId: string,
  actorUserId: string,
  actionType: string,
  entityType: string,
  entityId: string | null,
  summary: string,
  details: Record<string, unknown> = {},
) {
  const { error } = await admin.from("qualitative_audit_log").insert({
    owner_user_id: ownerUserId,
    study_id: studyId,
    actor_user_id: actorUserId,
    action_type: actionType,
    entity_type: entityType,
    entity_id: entityId,
    summary: text(summary, 500),
    details,
  });

  if (error) throw error;
}

const QUALITATIVE_ENTITY_TABLES: Record<string, string> = {
  case: "qualitative_cases",
  source: "qualitative_sources",
  code: "qualitative_codes",
  theme: "qualitative_themes",
  memo: "qualitative_memos",
  coding: "qualitative_codings",
  annotation: "qualitative_annotations",
};

async function qualitativeEntityExists(
  admin: ReturnType<typeof researchAdmin>,
  ownerUserId: string,
  studyId: string,
  entityType: string,
  entityId: string,
) {
  const table = QUALITATIVE_ENTITY_TABLES[entityType];
  if (!table || !validUuid(entityId)) return false;

  const { data, error } = await admin
    .from(table)
    .select("id")
    .eq("id", entityId)
    .eq("study_id", studyId)
    .eq("owner_user_id", ownerUserId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}


export async function GET(request: NextRequest) {
  try {
    const user = await authenticatedUser();
    if (!user) return reply({ ok: false, error: "Please sign in again." }, 401);

    const admin = researchAdmin();
    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() || "";

    if (!studyId) {
      const { data, error } = await admin
        .from("research_studies")
        .select("id,title,status,components,updated_at")
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const studies = (data || []).filter((study) => {
        const components =
          study.components && typeof study.components === "object"
            ? (study.components as Record<string, unknown>)
            : {};
        return components.qualitative === true;
      });

      return reply({ ok: true, studies });
    }

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const study = await ownedQualitativeStudy(admin, user.id, studyId);
    if (!study) {
      return reply({ ok: false, error: "This study is not available." }, 404);
    }
    if (!study.qualitativeEnabled) {
      return reply(
        {
          ok: false,
          error:
            "Enable Qualitative data in Study Builder before opening this study in Qualitative Lab.",
        },
        409,
      );
    }

    await ensureDefaultClassification(admin, user.id, studyId);
    const ownerCoderIdentity = await ensureOwnerCoderIdentity(admin, user, studyId);

    const [
      participantResult,
      caseResult,
      sourceResult,
      codeResult,
      archivedCodeResult,
      codingResult,
      classificationResult,
      attributeResult,
      memoResult,
      annotationResult,
      savedQueryResult,
      suggestionResult,
      coderIdentityResult,
      coderAssignmentResult,
      reconciliationResult,
      collaboratorResult,
      themeResult,
      themeCodeResult,
      frameworkResult,
      mergeHistoryResult,
      setResult,
      setItemResult,
      relationshipResult,
      auditResult,
    ] = await Promise.all([
      admin
        .from("study_participants")
        .select("id,public_id,status,is_test,enrolled_at,completed_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("enrolled_at", { ascending: false }),
      admin
        .from("qualitative_cases")
        .select(
          "id,study_id,participant_id,case_key,name,classification,attributes,notes,status,created_at,updated_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("qualitative_sources")
        .select(
          "id,study_id,case_id,source_type,title,content_text,original_filename,mime_type,storage_path,language,metadata,created_at,updated_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("qualitative_codes")
        .select(
          "id,study_id,parent_code_id,name,description,color,position,status,created_at,updated_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_codes")
        .select(
          "id,study_id,parent_code_id,name,description,color,position,status,created_at,updated_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "archived")
        .order("updated_at", { ascending: false }),
      admin
        .from("qualitative_codings")
        .select(
          "id,study_id,case_id,source_id,code_id,coder_user_id,coder_identity_id,method,start_offset,end_offset,excerpt,note,created_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_case_classifications")
        .select("id,name,description,position,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_attribute_definitions")
        .select("id,classification_id,field_key,name,data_type,options,required,position,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_memos")
        .select("id,case_id,source_id,code_id,memo_type,title,content,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("qualitative_annotations")
        .select("id,case_id,source_id,author_user_id,start_offset,end_offset,excerpt,content,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_saved_queries")
        .select("id,name,query_type,config,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("qualitative_coding_suggestions")
        .select("id,case_id,source_id,suggested_code_id,suggested_code_name,suggested_color,start_offset,end_offset,excerpt,rationale,confidence,model,status,accepted_coding_id,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_coder_identities")
        .select("id,linked_user_id,label,email,identity_type,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_coder_assignments")
        .select("id,source_id,coder_identity_id,blind_coding,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_reconciliations")
        .select("id,source_id,case_id,code_id,coder_a_identity_id,coder_b_identity_id,unit_key,start_offset,end_offset,excerpt,coder_a_present,coder_b_present,final_present,resolved_by_user_id,rationale,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("study_collaborators")
        .select("user_id,email,display_name,role,status")
        .eq("study_id", studyId)
        .eq("status", "active")
        .order("accepted_at", { ascending: true }),
      admin
        .from("qualitative_themes")
        .select("id,parent_theme_id,name,description,color,position,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_theme_codes")
        .select("id,theme_id,code_id,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_framework_summaries")
        .select("id,case_id,theme_id,code_id,summary,evidence_coding_ids,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("qualitative_code_merge_history")
        .select("id,source_code_id,target_code_id,source_name,target_name,moved_coding_count,merged_by_user_id,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("qualitative_sets")
        .select("id,name,description,color,status,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .order("updated_at", { ascending: false }),
      admin
        .from("qualitative_set_items")
        .select("id,set_id,item_type,item_id,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("qualitative_relationships")
        .select("id,from_type,from_id,to_type,to_id,relationship_type,custom_label,note,created_by_user_id,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("qualitative_audit_log")
        .select("id,actor_user_id,action_type,entity_type,entity_id,summary,details,created_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const failed = [
      participantResult,
      caseResult,
      sourceResult,
      codeResult,
      archivedCodeResult,
      codingResult,
      classificationResult,
      attributeResult,
      memoResult,
      annotationResult,
      savedQueryResult,
      suggestionResult,
      coderIdentityResult,
      coderAssignmentResult,
      reconciliationResult,
      collaboratorResult,
      themeResult,
      themeCodeResult,
      frameworkResult,
      mergeHistoryResult,
      setResult,
      setItemResult,
      relationshipResult,
      auditResult,
    ].find((result) => result.error);

    if (failed?.error) throw failed.error;

    return reply({
      ok: true,
      study,
      participants: participantResult.data || [],
      cases: caseResult.data || [],
      sources: sourceResult.data || [],
      codes: codeResult.data || [],
      archivedCodes: archivedCodeResult.data || [],
      codings: codingResult.data || [],
      classifications: classificationResult.data || [],
      attributeDefinitions: attributeResult.data || [],
      memos: memoResult.data || [],
      annotations: annotationResult.data || [],
      savedQueries: savedQueryResult.data || [],
      codingSuggestions: suggestionResult.data || [],
      coderIdentities: coderIdentityResult.data || [ownerCoderIdentity],
      coderAssignments: coderAssignmentResult.data || [],
      reconciliations: reconciliationResult.data || [],
      collaborators: collaboratorResult.data || [],
      themes: themeResult.data || [],
      themeCodes: themeCodeResult.data || [],
      frameworkSummaries: frameworkResult.data || [],
      codeMergeHistory: mergeHistoryResult.data || [],
      sets: setResult.data || [],
      setItems: setItemResult.data || [],
      relationships: relationshipResult.data || [],
      auditLog: auditResult.data || [],
    });
  } catch (error) {
    console.error("Qualitative research GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load Qualitative Lab right now." },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedUser();
    if (!user) return reply({ ok: false, error: "Please sign in again." }, 401);

    const body = await request.json().catch(() => ({}));
    const studyId = text(body?.studyId, 80);
    const operation = text(body?.operation, 80);

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const admin = researchAdmin();
    const study = await ownedQualitativeStudy(admin, user.id, studyId);

    if (!study) {
      return reply({ ok: false, error: "This study is not available." }, 404);
    }
    if (!study.qualitativeEnabled) {
      return reply(
        {
          ok: false,
          error:
            "Enable Qualitative data in Study Builder before adding qualitative material.",
        },
        409,
      );
    }

    await ensureDefaultClassification(admin, user.id, studyId);

    if (operation === "create_case") {
      const participantId = text(body?.participantId, 80);
      let participant:
        | {
            id: string;
            public_id: string;
            status: string;
            is_test: boolean;
          }
        | null = null;

      if (participantId) {
        if (!validUuid(participantId)) {
          return reply(
            { ok: false, error: "The selected participant is invalid." },
            400,
          );
        }

        participant = await participantForStudy(
          admin,
          user.id,
          studyId,
          participantId,
        );

        if (!participant) {
          return reply(
            { ok: false, error: "That participant does not belong to this study." },
            404,
          );
        }

        const { data: existing, error: existingError } = await admin
          .from("qualitative_cases")
          .select("*")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("participant_id", participantId)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) {
          return reply({ ok: true, case: existing, existing: true });
        }
      }

      const requestedName = text(body?.name, 200);
      const caseName =
        requestedName ||
        (participant ? `Participant ${participant.public_id}` : "Qualitative case");
      const caseKey =
        participant?.public_id ||
        `CASE-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;

      const { data, error } = await admin
        .from("qualitative_cases")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          participant_id: participant?.id || null,
          case_key: caseKey,
          name: caseName,
          classification: participant ? "Participant" : "Case",
          attributes: {},
        })
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, case: data });
    }

    if (operation === "sync_participant_cases") {
      const includeTest = body?.includeTest === true;

      let participantQuery = admin
        .from("study_participants")
        .select("id,public_id,status,is_test")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .neq("status", "withdrawn");

      if (!includeTest) participantQuery = participantQuery.eq("is_test", false);

      const [
        { data: participants, error: participantError },
        { data: existingCases, error: caseError },
      ] = await Promise.all([
        participantQuery,
        admin
          .from("qualitative_cases")
          .select("participant_id,case_key")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id),
      ]);

      if (participantError) throw participantError;
      if (caseError) throw caseError;

      const linkedIds = new Set(
        (existingCases || [])
          .map((row) => row.participant_id)
          .filter((value): value is string => Boolean(value)),
      );
      const existingKeys = new Set(
        (existingCases || []).map((row) => String(row.case_key)),
      );

      const inserts = (participants || [])
        .filter(
          (participant) =>
            !linkedIds.has(participant.id) &&
            !existingKeys.has(String(participant.public_id)),
        )
        .map((participant) => ({
          owner_user_id: user.id,
          study_id: studyId,
          participant_id: participant.id,
          case_key: participant.public_id,
          name: `Participant ${participant.public_id}`,
          classification: "Participant",
          attributes: {},
        }));

      if (inserts.length === 0) {
        return reply({ ok: true, created: 0 });
      }

      const { error } = await admin.from("qualitative_cases").insert(inserts);
      if (error) throw error;

      return reply({ ok: true, created: inserts.length });
    }

    if (operation === "link_case") {
      const caseId = text(body?.caseId, 80);
      const participantId = text(body?.participantId, 80);

      if (!validUuid(caseId)) {
        return reply({ ok: false, error: "A valid caseId is required." }, 400);
      }

      const qualitativeCase = await caseForStudy(
        admin,
        user.id,
        studyId,
        caseId,
      );
      if (!qualitativeCase) {
        return reply({ ok: false, error: "That case could not be found." }, 404);
      }

      let participant = null;
      if (participantId) {
        if (!validUuid(participantId)) {
          return reply(
            { ok: false, error: "The selected participant is invalid." },
            400,
          );
        }

        participant = await participantForStudy(
          admin,
          user.id,
          studyId,
          participantId,
        );
        if (!participant) {
          return reply(
            { ok: false, error: "That participant does not belong to this study." },
            404,
          );
        }

        const { data: conflicting, error: conflictError } = await admin
          .from("qualitative_cases")
          .select("id")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("participant_id", participantId)
          .neq("id", caseId)
          .maybeSingle();

        if (conflictError) throw conflictError;
        if (conflicting) {
          return reply(
            {
              ok: false,
              error:
                "That participant is already linked to another qualitative case.",
            },
            409,
          );
        }
      }

      const { data, error } = await admin
        .from("qualitative_cases")
        .update({
          participant_id: participant?.id || null,
          classification: participant ? "Participant" : qualitativeCase.classification,
        })
        .eq("id", caseId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, case: data });
    }

    if (operation === "create_source") {
      const caseId = text(body?.caseId, 80);
      const sourceType = text(body?.sourceType, 40) || "transcript";
      const title = text(body?.title, 240) || "Untitled qualitative source";
      const content = rawText(body?.content, 2_000_000);

      if (!validUuid(caseId)) {
        return reply({ ok: false, error: "A valid caseId is required." }, 400);
      }
      if (!SOURCE_TYPES.has(sourceType)) {
        return reply({ ok: false, error: "Unsupported qualitative source type." }, 400);
      }

      const qualitativeCase = await caseForStudy(
        admin,
        user.id,
        studyId,
        caseId,
      );
      if (!qualitativeCase) {
        return reply({ ok: false, error: "That qualitative case could not be found." }, 404);
      }

      const { data, error } = await admin
        .from("qualitative_sources")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          case_id: caseId,
          source_type: sourceType,
          title,
          content_text: content,
          language: text(body?.language, 80) || null,
          metadata: {},
        })
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, source: data });
    }

    if (operation === "update_source") {
      const sourceId = text(body?.sourceId, 80);
      const sourceType = text(body?.sourceType, 40) || "transcript";
      const title = text(body?.title, 240) || "Untitled qualitative source";
      const content = rawText(body?.content, 2_000_000);

      if (!validUuid(sourceId)) {
        return reply({ ok: false, error: "A valid sourceId is required." }, 400);
      }
      if (!SOURCE_TYPES.has(sourceType)) {
        return reply({ ok: false, error: "Unsupported qualitative source type." }, 400);
      }

      const { data, error } = await admin
        .from("qualitative_sources")
        .update({
          title,
          source_type: sourceType,
          content_text: content,
          language: text(body?.language, 80) || null,
        })
        .eq("id", sourceId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, source: data });
    }

    if (operation === "create_classification") {
      const name = text(body?.name, 120);
      const description = text(body?.description, 800);
      if (!name) {
        return reply({ ok: false, error: "Classification name is required." }, 400);
      }

      const { count, error: countError } = await admin
        .from("qualitative_case_classifications")
        .select("id", { count: "exact", head: true })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);
      if (countError) throw countError;

      const { data, error } = await admin
        .from("qualitative_case_classifications")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          name,
          description: description || null,
          position: count || 0,
        })
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply({ ok: false, error: "That classification already exists." }, 409);
      }
      if (error) throw error;
      return reply({ ok: true, classification: data });
    }

    if (operation === "create_attribute_definition") {
      const classificationId = text(body?.classificationId, 80);
      const name = text(body?.name, 120);
      const dataType = text(body?.dataType, 30) || "text";
      const allowedTypes = new Set(["text", "number", "boolean", "date", "select"]);
      const key = fieldKey(body?.fieldKey || name);
      const rawOptions = Array.isArray(body?.options) ? body.options : [];
      const options = rawOptions
        .map((value: unknown) => text(value, 120))
        .filter(Boolean)
        .slice(0, 100);

      if (!validUuid(classificationId) || !name || !key || !allowedTypes.has(dataType)) {
        return reply({ ok: false, error: "A valid classification, attribute name and type are required." }, 400);
      }

      const { data: classification, error: classificationError } = await admin
        .from("qualitative_case_classifications")
        .select("id")
        .eq("id", classificationId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (classificationError) throw classificationError;
      if (!classification) {
        return reply({ ok: false, error: "That case classification could not be found." }, 404);
      }

      const { count, error: countError } = await admin
        .from("qualitative_attribute_definitions")
        .select("id", { count: "exact", head: true })
        .eq("classification_id", classificationId);
      if (countError) throw countError;

      const { data, error } = await admin
        .from("qualitative_attribute_definitions")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          classification_id: classificationId,
          field_key: key,
          name,
          data_type: dataType,
          options,
          required: body?.required === true,
          position: count || 0,
        })
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply({ ok: false, error: "That attribute already exists for this classification." }, 409);
      }
      if (error) throw error;
      return reply({ ok: true, attributeDefinition: data });
    }

    if (operation === "update_case_profile") {
      const caseId = text(body?.caseId, 80);
      const classificationId = text(body?.classificationId, 80);
      if (!validUuid(caseId) || !validUuid(classificationId)) {
        return reply({ ok: false, error: "A case and classification are required." }, 400);
      }

      const qualitativeCase = await caseForStudy(admin, user.id, studyId, caseId);
      if (!qualitativeCase) {
        return reply({ ok: false, error: "That qualitative case could not be found." }, 404);
      }

      const { data: classification, error: classificationError } = await admin
        .from("qualitative_case_classifications")
        .select("id,name")
        .eq("id", classificationId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (classificationError) throw classificationError;
      if (!classification) {
        return reply({ ok: false, error: "That classification could not be found." }, 404);
      }

      const { data: definitions, error: definitionError } = await admin
        .from("qualitative_attribute_definitions")
        .select("field_key,data_type,options,required")
        .eq("classification_id", classificationId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);
      if (definitionError) throw definitionError;

      const incoming = body?.attributes && typeof body.attributes === "object" && !Array.isArray(body.attributes)
        ? (body.attributes as Record<string, unknown>)
        : {};
      const attributes: Record<string, string | number | boolean | null> = {};

      for (const definition of definitions || []) {
        const value = incoming[definition.field_key];
        if (value === undefined || value === null || value === "") {
          if (definition.required) {
            return reply({ ok: false, error: `Required case attribute ${definition.field_key} is missing.` }, 400);
          }
          attributes[definition.field_key] = null;
          continue;
        }

        if (definition.data_type === "number") {
          const number = Number(value);
          if (!Number.isFinite(number)) {
            return reply({ ok: false, error: `${definition.field_key} must be a number.` }, 400);
          }
          attributes[definition.field_key] = number;
        } else if (definition.data_type === "boolean") {
          attributes[definition.field_key] = value === true || value === "true";
        } else if (definition.data_type === "date") {
          const date = text(value, 32);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return reply({ ok: false, error: `${definition.field_key} must use YYYY-MM-DD.` }, 400);
          }
          attributes[definition.field_key] = date;
        } else if (definition.data_type === "select") {
          const selected = text(value, 120);
          const allowed = Array.isArray(definition.options)
            ? definition.options.map((option: unknown) => String(option))
            : [];
          if (!allowed.includes(selected)) {
            return reply({ ok: false, error: `${definition.field_key} has an unsupported option.` }, 400);
          }
          attributes[definition.field_key] = selected;
        } else {
          attributes[definition.field_key] = text(value, 1000);
        }
      }

      const { data, error } = await admin
        .from("qualitative_cases")
        .update({
          classification: classification.name,
          attributes,
          notes: text(body?.notes, 10000) || null,
        })
        .eq("id", caseId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return reply({ ok: true, case: data });
    }

    if (operation === "create_memo") {
      const title = text(body?.title, 240);
      const content = rawText(body?.content, 100000);
      const memoType = text(body?.memoType, 40) || "analytic";
      const allowedMemoTypes = new Set(["analytic", "methodological", "reflexive", "case", "source", "code", "other"]);
      const caseId = text(body?.caseId, 80);
      const sourceId = text(body?.sourceId, 80);
      const codeId = text(body?.codeId, 80);

      if (!title || !allowedMemoTypes.has(memoType)) {
        return reply({ ok: false, error: "Memo title and type are required." }, 400);
      }
      for (const id of [caseId, sourceId, codeId].filter(Boolean)) {
        if (!validUuid(id)) return reply({ ok: false, error: "Memo link is invalid." }, 400);
      }

      const { data, error } = await admin
        .from("qualitative_memos")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          case_id: caseId || null,
          source_id: sourceId || null,
          code_id: codeId || null,
          memo_type: memoType,
          title,
          content,
        })
        .select("*")
        .single();
      if (error) throw error;
      return reply({ ok: true, memo: data });
    }

    if (operation === "update_memo") {
      const memoId = text(body?.memoId, 80);
      if (!validUuid(memoId)) {
        return reply({ ok: false, error: "A valid memoId is required." }, 400);
      }
      const { data, error } = await admin
        .from("qualitative_memos")
        .update({
          title: text(body?.title, 240) || "Untitled memo",
          content: rawText(body?.content, 100000),
        })
        .eq("id", memoId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return reply({ ok: true, memo: data });
    }

    if (operation === "delete_memo") {
      const memoId = text(body?.memoId, 80);
      if (!validUuid(memoId)) {
        return reply({ ok: false, error: "A valid memoId is required." }, 400);
      }
      const { error } = await admin
        .from("qualitative_memos")
        .delete()
        .eq("id", memoId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);
      if (error) throw error;
      return reply({ ok: true });
    }

    if (operation === "create_annotation") {
      const sourceId = text(body?.sourceId, 80);
      const content = text(body?.content, 4000);
      const startOffset = Number(body?.startOffset);
      const endOffset = Number(body?.endOffset);

      if (!validUuid(sourceId) || !content || !Number.isInteger(startOffset) || !Number.isInteger(endOffset) || startOffset < 0 || endOffset <= startOffset) {
        return reply({ ok: false, error: "Select text and enter an annotation." }, 400);
      }

      const { data: source, error: sourceError } = await admin
        .from("qualitative_sources")
        .select("id,case_id,content_text")
        .eq("id", sourceId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (sourceError) throw sourceError;
      if (!source) return reply({ ok: false, error: "The source could not be found." }, 404);

      const sourceText = String(source.content_text || "");
      if (endOffset > sourceText.length) {
        return reply({ ok: false, error: "The selected text no longer matches the saved source." }, 409);
      }
      const excerpt = sourceText.slice(startOffset, endOffset);

      const { data, error } = await admin
        .from("qualitative_annotations")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          case_id: source.case_id,
          source_id: sourceId,
          author_user_id: user.id,
          start_offset: startOffset,
          end_offset: endOffset,
          excerpt,
          content,
        })
        .select("*")
        .single();
      if (error) throw error;
      return reply({ ok: true, annotation: data });
    }

    if (operation === "delete_annotation") {
      const annotationId = text(body?.annotationId, 80);
      if (!validUuid(annotationId)) {
        return reply({ ok: false, error: "A valid annotationId is required." }, 400);
      }
      const { error } = await admin
        .from("qualitative_annotations")
        .delete()
        .eq("id", annotationId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);
      if (error) throw error;
      return reply({ ok: true });
    }

    if (operation === "save_analysis_query") {
      const name = text(body?.name, 180);
      const queryType = text(body?.queryType, 80);
      const allowed = new Set([
        "word_frequency",
        "coding_query",
        "matrix",
        "cooccurrence",
      ]);

      if (!name) {
        return reply({ ok: false, error: "A name is required for the saved analysis." }, 400);
      }
      if (!allowed.has(queryType)) {
        return reply({ ok: false, error: "Unsupported qualitative analysis type." }, 400);
      }

      const config =
        body?.config && typeof body.config === "object" && !Array.isArray(body.config)
          ? body.config
          : {};

      const { data: existing, error: existingError } = await admin
        .from("qualitative_saved_queries")
        .select("id")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .ilike("name", name)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const { data, error } = await admin
          .from("qualitative_saved_queries")
          .update({
            query_type: queryType,
            config,
          })
          .eq("id", existing.id)
          .eq("owner_user_id", user.id)
          .eq("study_id", studyId)
          .select("id,name,query_type,config,created_at,updated_at")
          .single();

        if (error) throw error;
        return reply({ ok: true, savedQuery: data, updated: true });
      }

      const { data, error } = await admin
        .from("qualitative_saved_queries")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          name,
          query_type: queryType,
          config,
        })
        .select("id,name,query_type,config,created_at,updated_at")
        .single();

      if (error) throw error;
      return reply({ ok: true, savedQuery: data, updated: false });
    }

    if (operation === "delete_analysis_query") {
      const savedQueryId = text(body?.savedQueryId, 80);
      if (!validUuid(savedQueryId)) {
        return reply({ ok: false, error: "A valid saved analysis is required." }, 400);
      }

      const { error } = await admin
        .from("qualitative_saved_queries")
        .delete()
        .eq("id", savedQueryId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);

      if (error) throw error;
      return reply({ ok: true });
    }

    if (operation === "create_coder_identity") {
      const linkedUserId = text(body?.linkedUserId, 80);
      const label = text(body?.label, 180);
      const email = text(body?.email, 240);

      let identityType: "external" | "collaborator" = "external";
      let resolvedLabel = label;
      let resolvedEmail = email || null;
      let resolvedLinkedUserId: string | null = null;

      if (linkedUserId) {
        if (!validUuid(linkedUserId)) {
          return reply({ ok: false, error: "The selected collaborator is invalid." }, 400);
        }

        const { data: collaborator, error: collaboratorError } = await admin
          .from("study_collaborators")
          .select("user_id,email,display_name,status")
          .eq("study_id", studyId)
          .eq("user_id", linkedUserId)
          .eq("status", "active")
          .maybeSingle();

        if (collaboratorError) throw collaboratorError;
        if (!collaborator) {
          return reply(
            { ok: false, error: "That person is not an active collaborator on this study." },
            404,
          );
        }

        identityType = "collaborator";
        resolvedLabel =
          text(collaborator.display_name, 180) ||
          text(collaborator.email, 240) ||
          "Study collaborator";
        resolvedEmail = text(collaborator.email, 240) || null;
        resolvedLinkedUserId = collaborator.user_id;

        const { data: existing, error: existingError } = await admin
          .from("qualitative_coder_identities")
          .select("*")
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("linked_user_id", linkedUserId)
          .eq("status", "active")
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing) {
          return reply({ ok: true, coderIdentity: existing, existing: true });
        }
      } else if (!resolvedLabel) {
        return reply({ ok: false, error: "Coder name is required." }, 400);
      }

      const { data, error } = await admin
        .from("qualitative_coder_identities")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          linked_user_id: resolvedLinkedUserId,
          label: resolvedLabel,
          email: resolvedEmail,
          identity_type: identityType,
          status: "active",
        })
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, coderIdentity: data, existing: false });
    }

    if (operation === "update_coder_assignment") {
      const sourceId = text(body?.sourceId, 80);
      const coderIdentityId = text(body?.coderIdentityId, 80);
      const blindCoding = body?.blindCoding === true;
      const status = body?.status === "completed" ? "completed" : "assigned";

      if (!validUuid(sourceId) || !validUuid(coderIdentityId)) {
        return reply(
          { ok: false, error: "A qualitative source and coder are required." },
          400,
        );
      }

      const [
        { data: source, error: sourceError },
        { data: coder, error: coderError },
      ] = await Promise.all([
        admin
          .from("qualitative_sources")
          .select("id")
          .eq("id", sourceId)
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .maybeSingle(),
        admin
          .from("qualitative_coder_identities")
          .select("id")
          .eq("id", coderIdentityId)
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      if (sourceError) throw sourceError;
      if (coderError) throw coderError;
      if (!source || !coder) {
        return reply(
          { ok: false, error: "The source or coder is no longer available." },
          404,
        );
      }

      const { data, error } = await admin
        .from("qualitative_coder_assignments")
        .upsert(
          {
            owner_user_id: user.id,
            study_id: studyId,
            source_id: sourceId,
            coder_identity_id: coderIdentityId,
            blind_coding: blindCoding,
            status,
          },
          { onConflict: "source_id,coder_identity_id" },
        )
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, assignment: data });
    }

    if (operation === "delete_coder_assignment") {
      const assignmentId = text(body?.assignmentId, 80);
      if (!validUuid(assignmentId)) {
        return reply({ ok: false, error: "A valid coder assignment is required." }, 400);
      }

      const { error } = await admin
        .from("qualitative_coder_assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);

      if (error) throw error;
      return reply({ ok: true });
    }

    if (operation === "resolve_reconciliation") {
      const sourceId = text(body?.sourceId, 80);
      const caseId = text(body?.caseId, 80);
      const codeId = text(body?.codeId, 80);
      const coderAIdentityId = text(body?.coderAIdentityId, 80);
      const coderBIdentityId = text(body?.coderBIdentityId, 80);
      const unitKey = text(body?.unitKey, 220);
      const startOffset = Number(body?.startOffset);
      const endOffset = Number(body?.endOffset);
      const excerpt = rawText(body?.excerpt, 20_000);
      const rationale = text(body?.rationale, 2000);
      const coderAPresent = body?.coderAPresent === true;
      const coderBPresent = body?.coderBPresent === true;
      const finalPresent = body?.finalPresent === true;

      if (
        !validUuid(sourceId) ||
        !validUuid(caseId) ||
        !validUuid(codeId) ||
        !validUuid(coderAIdentityId) ||
        !validUuid(coderBIdentityId) ||
        !unitKey ||
        !Number.isInteger(startOffset) ||
        !Number.isInteger(endOffset) ||
        startOffset < 0 ||
        endOffset <= startOffset
      ) {
        return reply(
          { ok: false, error: "The reconciliation evidence is incomplete." },
          400,
        );
      }

      const { data, error } = await admin
        .from("qualitative_reconciliations")
        .upsert(
          {
            owner_user_id: user.id,
            study_id: studyId,
            source_id: sourceId,
            case_id: caseId,
            code_id: codeId,
            coder_a_identity_id: coderAIdentityId,
            coder_b_identity_id: coderBIdentityId,
            unit_key: unitKey,
            start_offset: startOffset,
            end_offset: endOffset,
            excerpt,
            coder_a_present: coderAPresent,
            coder_b_present: coderBPresent,
            final_present: finalPresent,
            resolved_by_user_id: user.id,
            rationale: rationale || null,
          },
          {
            onConflict:
              "study_id,source_id,code_id,coder_a_identity_id,coder_b_identity_id,unit_key",
          },
        )
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, reconciliation: data });
    }

    if (operation === "update_code") {
      const codeId = text(body?.codeId, 80);
      const name = text(body?.name, 160);
      const description = text(body?.description, 1000);
      const parentCodeId = text(body?.parentCodeId, 80);
      const requestedColor = text(body?.color, 20);
      const color = /^#[0-9a-f]{6}$/i.test(requestedColor)
        ? requestedColor
        : "#06b6d4";

      if (!validUuid(codeId) || !name) {
        return reply({ ok: false, error: "A valid code and code name are required." }, 400);
      }
      if (parentCodeId && !validUuid(parentCodeId)) {
        return reply({ ok: false, error: "The selected parent code is invalid." }, 400);
      }
      if (parentCodeId === codeId) {
        return reply({ ok: false, error: "A code cannot be its own parent." }, 400);
      }

      if (parentCodeId) {
        const { data: parent, error: parentError } = await admin
          .from("qualitative_codes")
          .select("id,parent_code_id")
          .eq("id", parentCodeId)
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (parentError) throw parentError;
        if (!parent) {
          return reply({ ok: false, error: "The selected parent code is not available." }, 404);
        }
        if (parent.parent_code_id === codeId) {
          return reply({ ok: false, error: "That change would create a circular code hierarchy." }, 409);
        }
      }

      const { data, error } = await admin
        .from("qualitative_codes")
        .update({
          name,
          description: description || null,
          color,
          parent_code_id: parentCodeId || null,
        })
        .eq("id", codeId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply({ ok: false, error: "A code with that name already exists." }, 409);
      }
      if (error) throw error;

      return reply({ ok: true, code: data });
    }

    if (operation === "archive_code") {
      const codeId = text(body?.codeId, 80);
      if (!validUuid(codeId)) {
        return reply({ ok: false, error: "A valid code is required." }, 400);
      }

      const { error: childError } = await admin
        .from("qualitative_codes")
        .update({ parent_code_id: null })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("parent_code_id", codeId)
        .eq("status", "active");
      if (childError) throw childError;

      const { data, error } = await admin
        .from("qualitative_codes")
        .update({ status: "archived" })
        .eq("id", codeId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .select("id")
        .single();

      if (error) throw error;
      return reply({ ok: true, archivedCodeId: data.id });
    }

    if (operation === "merge_codes") {
      const sourceCodeId = text(body?.sourceCodeId, 80);
      const targetCodeId = text(body?.targetCodeId, 80);

      if (
        !validUuid(sourceCodeId) ||
        !validUuid(targetCodeId) ||
        sourceCodeId === targetCodeId
      ) {
        return reply({ ok: false, error: "Choose two different valid codes to merge." }, 400);
      }

      const { data: mergeCodes, error: mergeCodesError } = await admin
        .from("qualitative_codes")
        .select("id,name,parent_code_id,status")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .in("id", [sourceCodeId, targetCodeId]);

      if (mergeCodesError) throw mergeCodesError;
      const source = (mergeCodes || []).find((item) => item.id === sourceCodeId);
      const target = (mergeCodes || []).find((item) => item.id === targetCodeId);
      if (!source || !target || source.status !== "active" || target.status !== "active") {
        return reply({ ok: false, error: "Both codes must still be active." }, 404);
      }

      const { count: movedCodingCount, error: countError } = await admin
        .from("qualitative_codings")
        .select("id", { count: "exact", head: true })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("code_id", sourceCodeId);
      if (countError) throw countError;

      const { error: codingMoveError } = await admin
        .from("qualitative_codings")
        .update({ code_id: targetCodeId })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("code_id", sourceCodeId);
      if (codingMoveError) throw codingMoveError;

      const { error: childMoveError } = await admin
        .from("qualitative_codes")
        .update({ parent_code_id: targetCodeId })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("parent_code_id", sourceCodeId)
        .neq("id", targetCodeId);
      if (childMoveError) throw childMoveError;

      const { data: sourceMappings, error: mappingReadError } = await admin
        .from("qualitative_theme_codes")
        .select("theme_id")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("code_id", sourceCodeId);
      if (mappingReadError) throw mappingReadError;

      if ((sourceMappings || []).length > 0) {
        const { error: mappingUpsertError } = await admin
          .from("qualitative_theme_codes")
          .upsert(
            (sourceMappings || []).map((mapping) => ({
              owner_user_id: user.id,
              study_id: studyId,
              theme_id: mapping.theme_id,
              code_id: targetCodeId,
            })),
            { onConflict: "theme_id,code_id", ignoreDuplicates: true },
          );
        if (mappingUpsertError) throw mappingUpsertError;
      }

      const { error: mappingDeleteError } = await admin
        .from("qualitative_theme_codes")
        .delete()
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("code_id", sourceCodeId);
      if (mappingDeleteError) throw mappingDeleteError;

      const { error: suggestionError } = await admin
        .from("qualitative_coding_suggestions")
        .update({ suggested_code_id: targetCodeId })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("suggested_code_id", sourceCodeId);
      if (suggestionError) throw suggestionError;

      const { error: archiveError } = await admin
        .from("qualitative_codes")
        .update({ status: "archived", parent_code_id: null })
        .eq("id", sourceCodeId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);
      if (archiveError) throw archiveError;

      const { error: historyError } = await admin
        .from("qualitative_code_merge_history")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          source_code_id: sourceCodeId,
          target_code_id: targetCodeId,
          source_name: source.name,
          target_name: target.name,
          moved_coding_count: movedCodingCount || 0,
          merged_by_user_id: user.id,
        });
      if (historyError) throw historyError;

      return reply({
        ok: true,
        sourceCodeId,
        targetCodeId,
        movedCodingCount: movedCodingCount || 0,
      });
    }

    if (operation === "split_code") {
      const sourceCodeId = text(body?.sourceCodeId, 80);
      const codingIds = Array.isArray(body?.codingIds)
        ? body.codingIds.map((value: unknown) => text(value, 80)).filter(validUuid)
        : [];
      const name = text(body?.name, 160);
      const description = text(body?.description, 1000);
      const requestedColor = text(body?.color, 20);
      const color = /^#[0-9a-f]{6}$/i.test(requestedColor)
        ? requestedColor
        : "#8b5cf6";

      if (!validUuid(sourceCodeId) || !name || codingIds.length === 0) {
        return reply(
          { ok: false, error: "Choose a source code, name the new code, and select references to move." },
          400,
        );
      }

      const { data: source, error: sourceError } = await admin
        .from("qualitative_codes")
        .select("id,parent_code_id")
        .eq("id", sourceCodeId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (sourceError) throw sourceError;
      if (!source) {
        return reply({ ok: false, error: "The source code is no longer active." }, 404);
      }

      const { data: references, error: referenceError } = await admin
        .from("qualitative_codings")
        .select("id")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("code_id", sourceCodeId)
        .in("id", codingIds);
      if (referenceError) throw referenceError;

      if ((references || []).length !== codingIds.length) {
        return reply(
          { ok: false, error: "One or more selected references no longer belong to that code." },
          409,
        );
      }

      const { count, error: countError } = await admin
        .from("qualitative_codes")
        .select("id", { count: "exact", head: true })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active");
      if (countError) throw countError;

      const { data: newCode, error: createError } = await admin
        .from("qualitative_codes")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          parent_code_id: source.parent_code_id,
          name,
          description: description || null,
          color,
          position: count || 0,
          status: "active",
        })
        .select("*")
        .single();

      if (createError?.code === "23505") {
        return reply({ ok: false, error: "A code with that name already exists." }, 409);
      }
      if (createError) throw createError;

      const { error: moveError } = await admin
        .from("qualitative_codings")
        .update({ code_id: newCode.id })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("code_id", sourceCodeId)
        .in("id", codingIds);
      if (moveError) throw moveError;

      return reply({ ok: true, code: newCode, moved: codingIds.length });
    }

    if (operation === "create_theme") {
      const name = text(body?.name, 180);
      const description = text(body?.description, 1500);
      const parentThemeId = text(body?.parentThemeId, 80);
      const requestedColor = text(body?.color, 20);
      const color = /^#[0-9a-f]{6}$/i.test(requestedColor)
        ? requestedColor
        : "#8b5cf6";

      if (!name) {
        return reply({ ok: false, error: "Theme name is required." }, 400);
      }
      if (parentThemeId && !validUuid(parentThemeId)) {
        return reply({ ok: false, error: "The selected parent theme is invalid." }, 400);
      }

      const { count, error: countError } = await admin
        .from("qualitative_themes")
        .select("id", { count: "exact", head: true })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active");
      if (countError) throw countError;

      const { data, error } = await admin
        .from("qualitative_themes")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          parent_theme_id: parentThemeId || null,
          name,
          description: description || null,
          color,
          position: count || 0,
        })
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply({ ok: false, error: "A theme with that name already exists." }, 409);
      }
      if (error) throw error;

      return reply({ ok: true, theme: data });
    }

    if (operation === "update_theme") {
      const themeId = text(body?.themeId, 80);
      const name = text(body?.name, 180);
      const description = text(body?.description, 1500);
      const parentThemeId = text(body?.parentThemeId, 80);
      const requestedColor = text(body?.color, 20);
      const color = /^#[0-9a-f]{6}$/i.test(requestedColor)
        ? requestedColor
        : "#8b5cf6";

      if (!validUuid(themeId) || !name) {
        return reply({ ok: false, error: "A valid theme and theme name are required." }, 400);
      }
      if (parentThemeId && !validUuid(parentThemeId)) {
        return reply({ ok: false, error: "The selected parent theme is invalid." }, 400);
      }
      if (parentThemeId === themeId) {
        return reply({ ok: false, error: "A theme cannot be its own parent." }, 400);
      }

      const { data, error } = await admin
        .from("qualitative_themes")
        .update({
          name,
          description: description || null,
          color,
          parent_theme_id: parentThemeId || null,
        })
        .eq("id", themeId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply({ ok: false, error: "A theme with that name already exists." }, 409);
      }
      if (error) throw error;
      return reply({ ok: true, theme: data });
    }

    if (operation === "archive_theme") {
      const themeId = text(body?.themeId, 80);
      if (!validUuid(themeId)) {
        return reply({ ok: false, error: "A valid theme is required." }, 400);
      }

      const { error: childError } = await admin
        .from("qualitative_themes")
        .update({ parent_theme_id: null })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("parent_theme_id", themeId)
        .eq("status", "active");
      if (childError) throw childError;

      const { error } = await admin
        .from("qualitative_themes")
        .update({ status: "archived", parent_theme_id: null })
        .eq("id", themeId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);
      if (error) throw error;

      return reply({ ok: true });
    }

    if (operation === "set_theme_code") {
      const themeId = text(body?.themeId, 80);
      const codeId = text(body?.codeId, 80);
      const enabled = body?.enabled !== false;

      if (!validUuid(themeId) || !validUuid(codeId)) {
        return reply({ ok: false, error: "A valid theme and code are required." }, 400);
      }

      if (enabled) {
        const { data, error } = await admin
          .from("qualitative_theme_codes")
          .upsert(
            {
              owner_user_id: user.id,
              study_id: studyId,
              theme_id: themeId,
              code_id: codeId,
            },
            { onConflict: "theme_id,code_id" },
          )
          .select("*")
          .single();
        if (error) throw error;
        return reply({ ok: true, mapping: data });
      }

      const { error } = await admin
        .from("qualitative_theme_codes")
        .delete()
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("theme_id", themeId)
        .eq("code_id", codeId);
      if (error) throw error;
      return reply({ ok: true });
    }

    if (operation === "save_framework_summary") {
      const caseId = text(body?.caseId, 80);
      const themeId = text(body?.themeId, 80);
      const codeId = text(body?.codeId, 80);
      const summary = rawText(body?.summary, 20_000);
      const evidenceCodingIds = Array.isArray(body?.evidenceCodingIds)
        ? body.evidenceCodingIds
            .map((value: unknown) => text(value, 80))
            .filter(validUuid)
            .slice(0, 500)
        : [];

      if (!validUuid(caseId)) {
        return reply({ ok: false, error: "A valid case is required." }, 400);
      }
      if (
        (themeId && codeId) ||
        (!themeId && !codeId) ||
        (themeId && !validUuid(themeId)) ||
        (codeId && !validUuid(codeId))
      ) {
        return reply(
          { ok: false, error: "Choose exactly one theme or code for the framework cell." },
          400,
        );
      }

      let existingQuery = admin
        .from("qualitative_framework_summaries")
        .select("id")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("case_id", caseId);

      existingQuery = themeId
        ? existingQuery.eq("theme_id", themeId)
        : existingQuery.eq("code_id", codeId);

      const { data: existing, error: existingError } = await existingQuery.maybeSingle();
      if (existingError) throw existingError;

      if (!summary.trim()) {
        if (existing) {
          const { error } = await admin
            .from("qualitative_framework_summaries")
            .delete()
            .eq("id", existing.id)
            .eq("owner_user_id", user.id)
            .eq("study_id", studyId);
          if (error) throw error;
        }
        return reply({ ok: true, deleted: Boolean(existing) });
      }

      if (existing) {
        const { data, error } = await admin
          .from("qualitative_framework_summaries")
          .update({
            summary,
            evidence_coding_ids: evidenceCodingIds,
          })
          .eq("id", existing.id)
          .eq("owner_user_id", user.id)
          .eq("study_id", studyId)
          .select("*")
          .single();
        if (error) throw error;
        return reply({ ok: true, frameworkSummary: data });
      }

      const { data, error } = await admin
        .from("qualitative_framework_summaries")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          case_id: caseId,
          theme_id: themeId || null,
          code_id: codeId || null,
          summary,
          evidence_coding_ids: evidenceCodingIds,
        })
        .select("*")
        .single();
      if (error) throw error;

      return reply({ ok: true, frameworkSummary: data });
    }

    if (operation === "create_set") {
      const name = text(body?.name, 180);
      const description = text(body?.description, 1500);
      const requestedColor = text(body?.color, 20);
      const color = /^#[0-9a-f]{6}$/i.test(requestedColor)
        ? requestedColor
        : "#06b6d4";

      if (!name) {
        return reply({ ok: false, error: "Set name is required." }, 400);
      }

      const { data, error } = await admin
        .from("qualitative_sets")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          name,
          description: description || null,
          color,
          status: "active",
        })
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply({ ok: false, error: "A set with that name already exists." }, 409);
      }
      if (error) throw error;

      await writeQualitativeAudit(
        admin,
        user.id,
        studyId,
        user.id,
        "set_created",
        "set",
        data.id,
        `Created set “${data.name}”.`,
        { name: data.name },
      );

      return reply({ ok: true, set: data });
    }

    if (operation === "update_set") {
      const setId = text(body?.setId, 80);
      const name = text(body?.name, 180);
      const description = text(body?.description, 1500);
      const requestedColor = text(body?.color, 20);
      const color = /^#[0-9a-f]{6}$/i.test(requestedColor)
        ? requestedColor
        : "#06b6d4";

      if (!validUuid(setId) || !name) {
        return reply({ ok: false, error: "A valid set and set name are required." }, 400);
      }

      const { data, error } = await admin
        .from("qualitative_sets")
        .update({ name, description: description || null, color })
        .eq("id", setId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply({ ok: false, error: "A set with that name already exists." }, 409);
      }
      if (error) throw error;

      await writeQualitativeAudit(
        admin,
        user.id,
        studyId,
        user.id,
        "set_updated",
        "set",
        data.id,
        `Updated set “${data.name}”.`,
        { name: data.name },
      );

      return reply({ ok: true, set: data });
    }

    if (operation === "archive_set") {
      const setId = text(body?.setId, 80);
      if (!validUuid(setId)) {
        return reply({ ok: false, error: "A valid set is required." }, 400);
      }

      const { data, error } = await admin
        .from("qualitative_sets")
        .update({ status: "archived" })
        .eq("id", setId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .select("id,name")
        .single();
      if (error) throw error;

      await writeQualitativeAudit(
        admin,
        user.id,
        studyId,
        user.id,
        "set_archived",
        "set",
        data.id,
        `Archived set “${data.name}”.`,
        { name: data.name },
      );

      return reply({ ok: true });
    }

    if (operation === "toggle_set_item") {
      const setId = text(body?.setId, 80);
      const itemType = text(body?.itemType, 40);
      const itemId = text(body?.itemId, 80);
      const enabled = body?.enabled !== false;

      if (
        !validUuid(setId) ||
        !validUuid(itemId) ||
        (itemType !== "case" && itemType !== "source")
      ) {
        return reply({ ok: false, error: "A valid set item is required." }, 400);
      }

      const { data: setRow, error: setError } = await admin
        .from("qualitative_sets")
        .select("id,name")
        .eq("id", setId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (setError) throw setError;
      if (!setRow) {
        return reply({ ok: false, error: "That set is no longer available." }, 404);
      }

      const table = itemType === "case" ? "qualitative_cases" : "qualitative_sources";
      const { data: itemRow, error: itemError } = await admin
        .from(table)
        .select("id")
        .eq("id", itemId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (itemError) throw itemError;
      if (!itemRow) {
        return reply({ ok: false, error: "That qualitative item is not part of this study." }, 404);
      }

      if (enabled) {
        const { data, error } = await admin
          .from("qualitative_set_items")
          .upsert(
            {
              owner_user_id: user.id,
              study_id: studyId,
              set_id: setId,
              item_type: itemType,
              item_id: itemId,
            },
            { onConflict: "set_id,item_type,item_id" },
          )
          .select("*")
          .single();
        if (error) throw error;

        await writeQualitativeAudit(
          admin,
          user.id,
          studyId,
          user.id,
          "set_item_added",
          itemType,
          itemId,
          `Added a ${itemType} to set “${setRow.name}”.`,
          { setId, setName: setRow.name, itemType },
        );
        return reply({ ok: true, setItem: data });
      }

      const { error } = await admin
        .from("qualitative_set_items")
        .delete()
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("set_id", setId)
        .eq("item_type", itemType)
        .eq("item_id", itemId);
      if (error) throw error;

      await writeQualitativeAudit(
        admin,
        user.id,
        studyId,
        user.id,
        "set_item_removed",
        itemType,
        itemId,
        `Removed a ${itemType} from set “${setRow.name}”.`,
        { setId, setName: setRow.name, itemType },
      );
      return reply({ ok: true });
    }

    if (operation === "create_relationship") {
      const fromType = text(body?.fromType, 40);
      const fromId = text(body?.fromId, 80);
      const toType = text(body?.toType, 40);
      const toId = text(body?.toId, 80);
      const relationshipType = text(body?.relationshipType, 60) || "relates_to";
      const customLabel = text(body?.customLabel, 160);
      const note = text(body?.note, 2000);
      const allowedTypes = new Set(Object.keys(QUALITATIVE_ENTITY_TABLES));
      const allowedRelationships = new Set([
        "relates_to",
        "supports",
        "contradicts",
        "precedes",
        "explains",
        "causes",
        "custom",
      ]);

      if (
        !allowedTypes.has(fromType) ||
        !allowedTypes.has(toType) ||
        !validUuid(fromId) ||
        !validUuid(toId) ||
        (fromType === toType && fromId === toId) ||
        !allowedRelationships.has(relationshipType)
      ) {
        return reply({ ok: false, error: "The relationship endpoints are invalid." }, 400);
      }
      if (relationshipType === "custom" && !customLabel) {
        return reply({ ok: false, error: "Give the custom relationship a label." }, 400);
      }

      const [fromExists, toExists] = await Promise.all([
        qualitativeEntityExists(admin, user.id, studyId, fromType, fromId),
        qualitativeEntityExists(admin, user.id, studyId, toType, toId),
      ]);
      if (!fromExists || !toExists) {
        return reply({ ok: false, error: "One or both relationship items are no longer available." }, 404);
      }

      const { data, error } = await admin
        .from("qualitative_relationships")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          from_type: fromType,
          from_id: fromId,
          to_type: toType,
          to_id: toId,
          relationship_type: relationshipType,
          custom_label: relationshipType === "custom" ? customLabel : null,
          note: note || null,
          created_by_user_id: user.id,
        })
        .select("*")
        .single();
      if (error) throw error;

      await writeQualitativeAudit(
        admin,
        user.id,
        studyId,
        user.id,
        "relationship_created",
        "relationship",
        data.id,
        "Created a qualitative relationship.",
        {
          fromType,
          fromId,
          toType,
          toId,
          relationshipType,
          customLabel: customLabel || null,
        },
      );

      return reply({ ok: true, relationship: data });
    }

    if (operation === "delete_relationship") {
      const relationshipId = text(body?.relationshipId, 80);
      if (!validUuid(relationshipId)) {
        return reply({ ok: false, error: "A valid relationship is required." }, 400);
      }

      const { data, error } = await admin
        .from("qualitative_relationships")
        .delete()
        .eq("id", relationshipId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .select("id,from_type,from_id,to_type,to_id,relationship_type,custom_label")
        .single();
      if (error) throw error;

      await writeQualitativeAudit(
        admin,
        user.id,
        studyId,
        user.id,
        "relationship_deleted",
        "relationship",
        data.id,
        "Deleted a qualitative relationship.",
        data,
      );

      return reply({ ok: true });
    }

    if (operation === "create_code") {
      const name = text(body?.name, 160);
      const description = text(body?.description, 1000);
      const requestedColor = text(body?.color, 20);
      const parentCodeId = text(body?.parentCodeId, 80);
      const color = /^#[0-9a-f]{6}$/i.test(requestedColor)
        ? requestedColor
        : "#06b6d4";

      if (!name) {
        return reply({ ok: false, error: "Code name is required." }, 400);
      }

      if (parentCodeId) {
        if (!validUuid(parentCodeId)) {
          return reply({ ok: false, error: "The parent code is invalid." }, 400);
        }
        const { data: parent, error: parentError } = await admin
          .from("qualitative_codes")
          .select("id")
          .eq("id", parentCodeId)
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        if (parentError) throw parentError;
        if (!parent) {
          return reply({ ok: false, error: "The parent code could not be found." }, 404);
        }
      }

      const { count, error: countError } = await admin
        .from("qualitative_codes")
        .select("id", { count: "exact", head: true })
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("status", "active");

      if (countError) throw countError;

      const { data, error } = await admin
        .from("qualitative_codes")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          parent_code_id: parentCodeId || null,
          name,
          description: description || null,
          color,
          position: count || 0,
        })
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply(
          { ok: false, error: "A code with that name already exists." },
          409,
        );
      }
      if (error) throw error;

      return reply({ ok: true, code: data });
    }

    if (operation === "create_coding") {
      const sourceId = text(body?.sourceId, 80);
      const codeId = text(body?.codeId, 80);
      const coderIdentityId = text(body?.coderIdentityId, 80);
      const startOffset = Number(body?.startOffset);
      const endOffset = Number(body?.endOffset);

      if (!validUuid(sourceId) || !validUuid(codeId)) {
        return reply(
          { ok: false, error: "A source and code are required." },
          400,
        );
      }
      if (
        !Number.isInteger(startOffset) ||
        !Number.isInteger(endOffset) ||
        startOffset < 0 ||
        endOffset <= startOffset
      ) {
        return reply({ ok: false, error: "Select text before coding it." }, 400);
      }

      const [
        { data: source, error: sourceError },
        { data: code, error: codeError },
      ] = await Promise.all([
        admin
          .from("qualitative_sources")
          .select("id,case_id,content_text")
          .eq("id", sourceId)
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .maybeSingle(),
        admin
          .from("qualitative_codes")
          .select("id")
          .eq("id", codeId)
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      if (sourceError) throw sourceError;
      if (codeError) throw codeError;
      if (!source || !code) {
        return reply(
          { ok: false, error: "The selected source or code no longer exists." },
          404,
        );
      }

      const content = String(source.content_text || "");
      if (endOffset > content.length) {
        return reply(
          { ok: false, error: "The selected text no longer matches the saved source." },
          409,
        );
      }

      const excerpt = content.slice(startOffset, endOffset);
      if (!excerpt.trim()) {
        return reply({ ok: false, error: "Select meaningful text before coding." }, 400);
      }

      let resolvedCoderIdentityId = coderIdentityId;
      if (!resolvedCoderIdentityId) {
        const ownerIdentity = await ensureOwnerCoderIdentity(admin, user, studyId);
        resolvedCoderIdentityId = ownerIdentity.id;
      } else {
        if (!validUuid(resolvedCoderIdentityId)) {
          return reply({ ok: false, error: "The selected coder is invalid." }, 400);
        }

        const { data: coderIdentity, error: coderIdentityError } = await admin
          .from("qualitative_coder_identities")
          .select("id")
          .eq("id", resolvedCoderIdentityId)
          .eq("study_id", studyId)
          .eq("owner_user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (coderIdentityError) throw coderIdentityError;
        if (!coderIdentity) {
          return reply({ ok: false, error: "The selected coder is no longer available." }, 404);
        }
      }

      const { data, error } = await admin
        .from("qualitative_codings")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          case_id: source.case_id,
          source_id: sourceId,
          code_id: codeId,
          coder_user_id: user.id,
          coder_identity_id: resolvedCoderIdentityId,
          method: "manual",
          start_offset: startOffset,
          end_offset: endOffset,
          excerpt,
        })
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, coding: data });
    }

    if (operation === "delete_coding") {
      const codingId = text(body?.codingId, 80);
      if (!validUuid(codingId)) {
        return reply({ ok: false, error: "A valid codingId is required." }, 400);
      }

      const { error } = await admin
        .from("qualitative_codings")
        .delete()
        .eq("id", codingId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id);

      if (error) throw error;
      return reply({ ok: true });
    }

    return reply({ ok: false, error: "Unsupported qualitative operation." }, 400);
  } catch (error) {
    console.error("Qualitative research POST failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not update Qualitative Lab right now." },
      500,
    );
  }
}
