import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
  getResearcherEntitlements,
} from "@/lib/billing/server";

export const dynamic = "force-dynamic";

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function environmentLimit(entitlements: {
  hasPro: boolean;
  hasAnyStudyPass: boolean;
}) {
  if (entitlements.hasPro) return 3;
  if (entitlements.hasAnyStudyPass) return 1;
  return 0;
}

async function loadPayload(userId: string) {
  const admin = billingAdmin();
  const entitlements = await getResearcherEntitlements(userId);
  const limit = environmentLimit(entitlements);

  const [environmentResult, studiesResult, passesResult] = await Promise.all([
    admin
      .from("research_ai_environments")
      .select("id,study_id,name,created_at,updated_at")
      .eq("owner_user_id", userId)
      .order("updated_at", { ascending: false }),
    admin
      .from("research_studies")
      .select("id,title,status,updated_at")
      .eq("owner_user_id", userId)
      .order("updated_at", { ascending: false }),
    admin
      .from("research_study_entitlements")
      .select("study_id,study_pass_active")
      .eq("user_id", userId)
      .eq("study_pass_active", true),
  ]);

  if (environmentResult.error) throw environmentResult.error;
  if (studiesResult.error) throw studiesResult.error;
  if (passesResult.error) throw passesResult.error;

  const studies = studiesResult.data || [];
  const studyById = new Map(studies.map((study) => [String(study.id), study]));
  const passStudyIds = new Set(
    (passesResult.data || []).map((row) => String(row.study_id)),
  );

  const environments = (environmentResult.data || []).map((environment) => {
    const study = studyById.get(String(environment.study_id));
    return {
      ...environment,
      study_title: study?.title || environment.name,
      study_status: study?.status || "unknown",
    };
  });

  const environmentStudyIds = new Set(
    environments.map((environment) => String(environment.study_id)),
  );

  const eligibleStudies = studies.map((study) => {
    const studyId = String(study.id);
    const eligible = entitlements.hasPro || passStudyIds.has(studyId);

    return {
      id: studyId,
      title: String(study.title || "Untitled study"),
      status: String(study.status || "draft"),
      eligible,
      already_has_environment: environmentStudyIds.has(studyId),
      covered_by_study_pass: passStudyIds.has(studyId),
    };
  });

  return {
    environments,
    eligibleStudies,
    capacity: {
      limit,
      used: environments.length,
      remaining: Math.max(0, limit - environments.length),
      plan: entitlements.plan,
      planName: entitlements.planName,
      hasPro: entitlements.hasPro,
      hasAnyStudyPass: entitlements.hasAnyStudyPass,
    },
  };
}

export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return jsonError("Your PsyLattice session has expired. Please sign in again.", 401);
    }

    const payload = await loadPayload(user.id);

    return NextResponse.json(
      { ok: true, ...payload },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not load AI environments:", error);
    return jsonError("PsyLattice could not load your AI environments.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return jsonError("Your PsyLattice session has expired. Please sign in again.", 401);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const studyId =
      typeof body.study_id === "string" ? body.study_id.trim() : "";

    if (!studyId) {
      return jsonError("Choose a study for this AI environment.");
    }

    const admin = billingAdmin();

    const { data: study, error: studyError } = await admin
      .from("research_studies")
      .select("id,title,status")
      .eq("id", studyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (studyError || !study) {
      return jsonError("This study is not available to your researcher account.", 404);
    }

    const studyEntitlements = await getResearcherEntitlements(user.id, studyId);
    const generalEntitlements = await getResearcherEntitlements(user.id);
    const limit = environmentLimit(generalEntitlements);

    if (!studyEntitlements.hasPro && !studyEntitlements.selectedStudyHasPass) {
      return jsonError(
        "A persistent AI environment requires Pro or an active Study Pass for this study.",
        403,
      );
    }

    const { data: existing, error: existingError } = await admin
      .from("research_ai_environments")
      .select("id,study_id,name,created_at,updated_at")
      .eq("owner_user_id", user.id)
      .eq("study_id", studyId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      const payload = await loadPayload(user.id);
      return NextResponse.json(
        {
          ok: true,
          environment: {
            ...existing,
            study_title: study.title,
            study_status: study.status,
          },
          ...payload,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const { count, error: countError } = await admin
      .from("research_ai_environments")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", user.id);

    if (countError) throw countError;

    if (Number(count || 0) >= limit) {
      return jsonError(
        limit === 1
          ? "Your current plan supports one study-specific AI environment."
          : `Your current plan supports up to ${limit} study-specific AI environments.`,
        409,
      );
    }

    const { data: environment, error: insertError } = await admin
      .from("research_ai_environments")
      .insert({
        owner_user_id: user.id,
        study_id: studyId,
        name: String(study.title || "Research study").slice(0, 160),
      })
      .select("id,study_id,name,created_at,updated_at")
      .single();

    if (insertError) throw insertError;

    const payload = await loadPayload(user.id);

    return NextResponse.json(
      {
        ok: true,
        environment: {
          ...environment,
          study_title: study.title,
          study_status: study.status,
        },
        ...payload,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not create AI environment:", error);
    return jsonError(
      error instanceof Error
        ? error.message
        : "PsyLattice could not create this AI environment.",
      500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return jsonError("Your PsyLattice session has expired. Please sign in again.", 401);
    }

    const environmentId =
      request.nextUrl.searchParams.get("environment_id")?.trim() || "";

    if (!environmentId) {
      return jsonError("An AI environment is required.");
    }

    const admin = billingAdmin();

    const { error } = await admin
      .from("research_ai_environments")
      .delete()
      .eq("id", environmentId)
      .eq("owner_user_id", user.id);

    if (error) throw error;

    const payload = await loadPayload(user.id);

    return NextResponse.json(
      { ok: true, ...payload },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not delete AI environment:", error);
    return jsonError("PsyLattice could not delete this AI environment.", 500);
  }
}
