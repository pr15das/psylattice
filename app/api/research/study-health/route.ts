import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  authenticatedBillingUser,
  getResearcherEntitlements,
} from "@/lib/billing/server";
import { buildStudyHealthReport } from "@/lib/research/health/engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) return jsonError("Please sign in again.", 401);

    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";

    if (!studyId || !validUuid(studyId)) {
      return jsonError("A valid study_id is required.", 400);
    }

    // Study Health reads research content through the signed-in researcher's
    // normal authenticated Supabase session. This deliberately keeps all
    // existing RLS/owner policies in force instead of granting the service
    // role broad read access across research tables.
    const supabase = await createServerSupabase();

    const { data: ownedStudy, error: studyError } = await supabase
      .from("research_studies")
      .select("id")
      .eq("id", studyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (studyError) throw studyError;
    if (!ownedStudy) {
      return jsonError(
        "This study is not available to your researcher account.",
        404,
      );
    }

    // Billing entitlement verification remains server-side. It may use the
    // billing service client internally, but research-content reads below do
    // not.
    const entitlements = await getResearcherEntitlements(user.id, studyId);

    // Keep the same study-scope rule used by the rest of the research
    // environment: Pro may use any owned study; a non-Pro account that owns
    // Study Pass access is restricted to the exact study covered by that pass.
    if (
      !entitlements.hasPro &&
      entitlements.hasAnyStudyPass &&
      !entitlements.selectedStudyHasPass
    ) {
      return jsonError(
        "Study Health is not available for this study under the current Study Pass.",
        403,
      );
    }

    const report = await buildStudyHealthReport(
      supabase,
      user.id,
      studyId,
    );

    return NextResponse.json(
      {
        ok: true,
        report,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Could not build Study Health report:", error);
    return jsonError(
      "PsyLattice could not build Study Health for this study right now.",
      500,
    );
  }
}
