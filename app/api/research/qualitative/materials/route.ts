import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getResearcherEntitlements } from "@/lib/billing/server";
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

const MATERIAL_WORD_LIMITS = {
  free: 5_000,
  "study-pass": 15_000,
  "pro-monthly": 30_000,
  "pro-annual": 30_000,
} as const;

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

function countWords(value: string) {
  return (
    value
      .toLocaleLowerCase()
      .match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []
  ).length;
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

function materialPolicy(entitlements: Awaited<ReturnType<typeof getResearcherEntitlements>>) {
  const wordLimit = MATERIAL_WORD_LIMITS[entitlements.plan] ?? MATERIAL_WORD_LIMITS.free;
  const planLabel = entitlements.hasPro
    ? "Pro"
    : entitlements.selectedStudyHasPass
      ? "Study Pass"
      : "Free";

  return {
    plan: entitlements.plan,
    planLabel,
    wordLimit,
  };
}

function overLimitMessage(planLabel: string, wordCount: number, wordLimit: number) {
  const overBy = Math.max(0, wordCount - wordLimit);
  return `This material exceeds your ${planLabel} plan limit by ${overBy.toLocaleString()} word${overBy === 1 ? "" : "s"}. ${planLabel} allows up to ${wordLimit.toLocaleString()} words per material.`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedUser();
    if (!user) return reply({ ok: false, error: "Please sign in again." }, 401);

    const body = await request.json().catch(() => null);
    const operation = text(body?.operation, 40);
    const studyId = text(body?.studyId, 80);

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const admin = researchAdmin();
    const { data: study, error: studyError } = await admin
      .from("research_studies")
      .select("id,components")
      .eq("id", studyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (studyError) throw studyError;
    if (!study) return reply({ ok: false, error: "This study is not available." }, 404);

    const components =
      study.components && typeof study.components === "object"
        ? (study.components as Record<string, unknown>)
        : {};
    if (components.qualitative !== true) {
      return reply(
        {
          ok: false,
          error: "Enable Qualitative data in Study Builder before adding qualitative materials.",
        },
        409,
      );
    }

    const entitlements = await getResearcherEntitlements(user.id, studyId);
    const policy = materialPolicy(entitlements);

    if (operation !== "create_material" && operation !== "update_material") {
      return reply({ ok: false, error: "Unsupported material operation." }, 400);
    }

    const sourceType = text(body?.sourceType, 40) || "transcript";
    const title = text(body?.title, 240) || "Untitled text material";
    const content = String(body?.content ?? "");

    if (!SOURCE_TYPES.has(sourceType)) {
      return reply({ ok: false, error: "Unsupported qualitative material type." }, 400);
    }
    if (!content.trim()) {
      return reply({ ok: false, error: "Paste text into the material before saving it." }, 400);
    }
    if (content.length > 2_000_000) {
      return reply({ ok: false, error: "This text material is too large to save safely." }, 413);
    }

    const wordCount = countWords(content);
    if (wordCount > policy.wordLimit) {
      return reply(
        {
          ok: false,
          error: overLimitMessage(policy.planLabel, wordCount, policy.wordLimit),
          materialPolicy: policy,
          wordCount,
        },
        413,
      );
    }

    if (operation === "create_material") {
      const caseId = text(body?.caseId, 80);
      if (!validUuid(caseId)) {
        return reply({ ok: false, error: "A valid caseId is required." }, 400);
      }

      const { data: qualitativeCase, error: caseError } = await admin
        .from("qualitative_cases")
        .select("id")
        .eq("id", caseId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (caseError) throw caseError;
      if (!qualitativeCase) {
        return reply({ ok: false, error: "The selected case could not be found." }, 404);
      }

      const { data: source, error: sourceError } = await admin
        .from("qualitative_sources")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          case_id: caseId,
          source_type: sourceType,
          title,
          content_text: content,
          language: null,
          metadata: {
            input_mode: "text_paste",
            word_count: wordCount,
          },
        })
        .select("*")
        .single();

      if (sourceError) throw sourceError;

      const { error: auditError } = await admin.from("qualitative_audit_log").insert({
        owner_user_id: user.id,
        study_id: studyId,
        actor_user_id: user.id,
        action_type: "create_material",
        entity_type: "source",
        entity_id: source.id,
        summary: `Created text material “${title}”.`,
        details: {
          case_id: caseId,
          source_type: sourceType,
          word_count: wordCount,
          input_mode: "text_paste",
        },
      });
      if (auditError) throw auditError;

      return reply({ ok: true, source, materialPolicy: policy, wordCount });
    }

    const sourceId = text(body?.sourceId, 80);
    if (!validUuid(sourceId)) {
      return reply({ ok: false, error: "A valid sourceId is required." }, 400);
    }

    const { data: existing, error: existingError } = await admin
      .from("qualitative_sources")
      .select("id,case_id,metadata")
      .eq("id", sourceId)
      .eq("study_id", studyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
      return reply({ ok: false, error: "The selected material could not be found." }, 404);
    }

    const existingMetadata =
      existing.metadata && typeof existing.metadata === "object"
        ? (existing.metadata as Record<string, unknown>)
        : {};

    const { data: source, error: updateError } = await admin
      .from("qualitative_sources")
      .update({
        title,
        source_type: sourceType,
        content_text: content,
        metadata: {
          ...existingMetadata,
          input_mode: "text_paste",
          word_count: wordCount,
        },
      })
      .eq("id", sourceId)
      .eq("study_id", studyId)
      .eq("owner_user_id", user.id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    const { error: auditError } = await admin.from("qualitative_audit_log").insert({
      owner_user_id: user.id,
      study_id: studyId,
      actor_user_id: user.id,
      action_type: "update_material",
      entity_type: "source",
      entity_id: source.id,
      summary: `Updated text material “${title}”.`,
      details: {
        case_id: existing.case_id,
        source_type: sourceType,
        word_count: wordCount,
        input_mode: "text_paste",
      },
    });
    if (auditError) throw auditError;

    return reply({ ok: true, source, materialPolicy: policy, wordCount });
  } catch (error) {
    console.error("Qualitative material operation failed:", error);
    return reply(
      {
        ok: false,
        error: "The qualitative text material could not be saved right now.",
      },
      500,
    );
  }
}
