import { NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
  getResearcherEntitlements,
} from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) return jsonError("Please sign in again.", 401);

    const admin = billingAdmin();
    const [accountEntitlements, studiesResult, passResult] = await Promise.all([
      getResearcherEntitlements(user.id),
      admin
        .from("research_studies")
        .select("id,title,status,updated_at")
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("research_study_entitlements")
        .select("study_id")
        .eq("user_id", user.id)
        .eq("study_pass_active", true),
    ]);

    if (studiesResult.error) throw studiesResult.error;
    if (passResult.error) throw passResult.error;

    const passStudyIds = new Set(
      (passResult.data || []).map((row) => String(row.study_id)),
    );

    const studies = (studiesResult.data || []).map((study) => {
      const coveredByStudyPass = passStudyIds.has(String(study.id));

      // Pro can scope work to any owned study.
      // A non-Pro account with Study Pass is intentionally restricted to the
      // exact study/studies that the active Study Pass covers.
      // Free keeps its normal owned-study scope.
      const eligible = accountEntitlements.hasPro
        ? true
        : accountEntitlements.hasAnyStudyPass
          ? coveredByStudyPass
          : true;

      return {
        id: String(study.id),
        title: String(study.title || "Untitled study"),
        status: String(study.status || "draft"),
        updated_at: study.updated_at ? String(study.updated_at) : null,
        eligible,
        coveredByStudyPass,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        account: {
          plan: accountEntitlements.plan,
          planName: accountEntitlements.planName,
          hasPro: accountEntitlements.hasPro,
          hasAnyStudyPass: accountEntitlements.hasAnyStudyPass,
          mediaUploadsAllowed:
            accountEntitlements.media.uploadsAllowed === true,
          maxSimultaneousStudies:
            accountEntitlements.studies.maxSimultaneous,
        },
        studies,
        eligibleStudies: studies.filter((study) => study.eligible),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Could not load researcher study scope:", error);
    return jsonError("PsyLattice could not load your study scope right now.", 500);
  }
}
