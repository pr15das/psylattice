import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getResearcherEntitlements } from "@/lib/billing/server";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccessContext = {
  ok?: boolean;
  allowed?: boolean;
  access_type?: "owner" | "collaborator";
  role?: string;
  study_id?: string;
  study_title?: string;
  owner_user_id?: string;
  study_status?: string;
  permissions?: Record<string, boolean>;
  error?: string;
};

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

function boundedText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function finiteTarget(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(1, Math.min(1_000_000, Math.round(number)));
}

async function resolveAccess(studyId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, access: null as AccessContext | null };
  }

  const { data, error } = await supabase.rpc(
    "psylattice_study_access_context",
    { p_study_id: studyId },
  );
  if (error) throw error;

  return {
    supabase,
    user,
    access: data as AccessContext | null,
  };
}

function assertBuilderAccess(access: AccessContext | null) {
  return Boolean(
    access?.ok &&
      access.allowed &&
      (access.access_type === "owner" ||
        access.permissions?.study_builder === true),
  );
}

async function logStudyActivity(
  studyId: string,
  actorUserId: string,
  action: string,
  metadata: Record<string, unknown>,
) {
  const admin = researchAdmin();
  const { error } = await admin.from("study_collaboration_activity").insert({
    study_id: studyId,
    actor_user_id: actorUserId,
    action,
    metadata,
  });
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  try {
    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const session = await resolveAccess(studyId);
    if (!session.user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (!assertBuilderAccess(session.access)) {
      return reply(
        {
          ok: false,
          error: "The study owner has not granted you Study Builder access.",
        },
        403,
      );
    }

    const ownerUserId = String(session.access?.owner_user_id || "").trim();
    if (!validUuid(ownerUserId)) {
      return reply({ ok: false, error: "The study owner could not be resolved." }, 500);
    }

    const admin = researchAdmin();

    const [
      studyResult,
      consentVersionResult,
      demographicResult,
      measureResult,
      followupResult,
      cognitiveResult,
      ambulatoryResult,
      participantCountResult,
    ] = await Promise.all([
      admin
        .from("research_studies")
        .select(
          "id,owner_user_id,title,participant_description,design,target_sample_size,status,components,study_config,created_at,updated_at",
        )
        .eq("id", studyId)
        .eq("owner_user_id", ownerUserId)
        .maybeSingle(),
      admin
        .from("study_consent_versions")
        .select(
          "id,version_label,consent_method,is_current,created_at,updated_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .order("updated_at", { ascending: false }),
      admin
        .from("study_demographic_questions")
        .select("id,direct_identifier")
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId),
      admin
        .from("study_measures")
        .select(
          "id,questionnaire_id,questionnaire_version_id,measurement_point,followup_wave_id,position,required",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .order("position", { ascending: true }),
      admin
        .from("study_followup_waves")
        .select("id,name,position,status")
        .eq("study_id", studyId)
        .order("position", { ascending: true }),
      admin
        .from("study_cognitive_tasks")
        .select(
          "id,task_id,version_id,position,required,administration_mode,schedule_config",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .order("position", { ascending: true }),
      admin
        .from("study_ambulatory_protocols")
        .select("id,name,duration_days,is_enabled,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .order("updated_at", { ascending: false }),
      admin
        .from("study_participants")
        .select("id", { count: "exact", head: true })
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId),
    ]);

    const failed = [
      studyResult,
      consentVersionResult,
      demographicResult,
      measureResult,
      followupResult,
      cognitiveResult,
      ambulatoryResult,
      participantCountResult,
    ].find((result) => result.error);

    if (failed?.error) throw failed.error;
    if (!studyResult.data) {
      return reply({ ok: false, error: "This shared study is no longer available." }, 404);
    }

    const questionnaireIds = Array.from(
      new Set((measureResult.data || []).map((row) => row.questionnaire_id)),
    );
    const { data: questionnaires, error: questionnaireError } =
      questionnaireIds.length
        ? await admin
            .from("questionnaires")
            .select("id,name,acronym,category")
            .in("id", questionnaireIds)
        : { data: [], error: null };

    if (questionnaireError) throw questionnaireError;

    const questionnaireById = new Map(
      (questionnaires || []).map((row) => [row.id, row]),
    );

    const measures = (measureResult.data || []).map((measure) => {
      const questionnaire = questionnaireById.get(measure.questionnaire_id);
      return {
        ...measure,
        questionnaire_name: questionnaire?.name || "Questionnaire",
        questionnaire_acronym: questionnaire?.acronym || null,
        questionnaire_category: questionnaire?.category || null,
      };
    });

    const entitlements = await getResearcherEntitlements(ownerUserId, studyId);

    return reply({
      ok: true,
      access: {
        role: session.access?.role || null,
        canEdit:
          session.access?.access_type === "owner" ||
          session.access?.permissions?.can_edit === true,
        canManageStructure:
          session.access?.access_type === "owner" ||
          session.access?.permissions?.can_manage_structure === true,
      },
      study: studyResult.data,
      structure: {
        consentVersions: consentVersionResult.data || [],
        demographics: {
          total: (demographicResult.data || []).length,
          directIdentifiers: (demographicResult.data || []).filter(
            (row) => row.direct_identifier,
          ).length,
        },
        measures,
        followups: followupResult.data || [],
        cognitiveTasks: cognitiveResult.data || [],
        ambulatoryProtocols: ambulatoryResult.data || [],
        structureLock: {
          participantCount: participantCountResult.count || 0,
          locked: (participantCountResult.count || 0) > 0,
        },
      },
      ownerEntitlements: {
        planName: entitlements.planName,
        hasPro: entitlements.hasPro,
        selectedStudyHasPass: entitlements.selectedStudyHasPass,
        participantLimit:
          entitlements.participants.effectiveLimitForSelectedStudy,
        currentParticipants:
          entitlements.participants.currentForSelectedStudy,
        remainingParticipants:
          entitlements.participants.remainingForSelectedStudy,
      },
    });
  } catch (error) {
    console.error("Shared Study Builder GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load this shared study right now." },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studyId = String(body?.studyId || "").trim();

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const session = await resolveAccess(studyId);
    if (!session.user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (!assertBuilderAccess(session.access)) {
      return reply(
        {
          ok: false,
          error: "The study owner has not granted you Study Builder access.",
        },
        403,
      );
    }
    if (
      session.access?.access_type !== "owner" &&
      session.access?.permissions?.can_edit !== true
    ) {
      return reply(
        { ok: false, error: "Your collaboration permission is read-only." },
        403,
      );
    }

    const operation = String(body?.operation || "");

    if (operation === "remove_measure") {
      const canManageStructure =
        session.access?.access_type === "owner" ||
        session.access?.permissions?.can_manage_structure === true;

      if (!canManageStructure) {
        return reply(
          { ok: false, error: "Structural-change permission is required." },
          403,
        );
      }

      const measureId = String(body?.measureId || "").trim();
      const reason = boundedText(body?.reason, 500);
      if (!validUuid(measureId)) {
        return reply({ ok: false, error: "A valid measureId is required." }, 400);
      }
      if (reason.length < 3) {
        return reply(
          { ok: false, error: "Add a short reason for this structural change." },
          400,
        );
      }

      const ownerUserId = String(session.access?.owner_user_id || "").trim();
      const admin = researchAdmin();

      const { count, error: countError } = await admin
        .from("study_participants")
        .select("id", { count: "exact", head: true })
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId);

      if (countError) throw countError;
      if ((count || 0) > 0) {
        return reply(
          {
            ok: false,
            error:
              "Structural removal is locked after the first participant enrolls.",
          },
          409,
        );
      }

      const { data: measure, error: measureError } = await admin
        .from("study_measures")
        .select("id,questionnaire_id,measurement_point,position,required")
        .eq("id", measureId)
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .maybeSingle();

      if (measureError) throw measureError;
      if (!measure) {
        return reply({ ok: false, error: "That study measure was not found." }, 404);
      }

      const { error: deleteError } = await admin
        .from("study_measures")
        .delete()
        .eq("id", measureId)
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId);

      if (deleteError) throw deleteError;

      await logStudyActivity(
        studyId,
        session.user.id,
        "shared_study_measure_removed",
        {
          measure_id: measure.id,
          questionnaire_id: measure.questionnaire_id,
          measurement_point: measure.measurement_point,
          position: measure.position,
          reason,
          actor_role: session.access?.role || null,
        },
      );

      return reply({ ok: true, removedMeasureId: measure.id });
    }

    if (operation !== "update_core") {
      return reply({ ok: false, error: "Unsupported Study Builder operation." }, 400);
    }

    const title = boundedText(body?.title, 240);
    const participantDescription = boundedText(body?.participantDescription, 4000);
    const design = boundedText(body?.design, 120);
    const targetSampleSize = finiteTarget(body?.targetSampleSize);

    if (!title) {
      return reply({ ok: false, error: "The study title cannot be empty." }, 400);
    }
    if (!design) {
      return reply({ ok: false, error: "A study design is required." }, 400);
    }
    if (!targetSampleSize) {
      return reply({ ok: false, error: "Enter a valid target sample size." }, 400);
    }

    const ownerUserId = String(session.access?.owner_user_id || "").trim();
    const ownerEntitlements = await getResearcherEntitlements(ownerUserId, studyId);

    if (
      targetSampleSize >
      ownerEntitlements.participants.effectiveLimitForSelectedStudy
    ) {
      return reply(
        {
          ok: false,
          error: `The owner's current participant capacity for this study is ${ownerEntitlements.participants.effectiveLimitForSelectedStudy}. The owner must purchase the required study capacity before setting a larger target.`,
        },
        403,
      );
    }

    const admin = researchAdmin();
    const { data, error } = await admin
      .from("research_studies")
      .update({
        title,
        participant_description: participantDescription || null,
        design,
        target_sample_size: targetSampleSize,
      })
      .eq("id", studyId)
      .eq("owner_user_id", ownerUserId)
      .select(
        "id,owner_user_id,title,participant_description,design,target_sample_size,status,components,study_config,created_at,updated_at",
      )
      .single();

    if (error) throw error;

    await logStudyActivity(
      studyId,
      session.user.id,
      "shared_study_core_updated",
      {
        title,
        design,
        target_sample_size: targetSampleSize,
        actor_role: session.access?.role || null,
      },
    );

    return reply({ ok: true, study: data });
  } catch (error) {
    console.error("Shared Study Builder POST failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not save this shared study right now." },
      500,
    );
  }
}
