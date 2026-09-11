import { NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
  getResearcherEntitlements,
} from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await authenticatedBillingUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    // Use the same entitlement resolver as the rest of PsyLattice.
    // This keeps the top-right plan badge aligned with the sidebar,
    // including complimentary/admin-granted Pro access.
    const [entitlements, passResult] = await Promise.all([
      getResearcherEntitlements(user.id),
      billingAdmin()
        .from("research_study_entitlements")
        .select("study_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("study_pass_active", true),
    ]);

    if (passResult.error) throw passResult.error;

    const studyPassCount = Math.max(0, Number(passResult.count || 0));

    return NextResponse.json(
      {
        ok: true,
        plan: entitlements.plan,
        planName: entitlements.planName,
        studyPassCount,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Could not load PsyLattice plan badge status:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "PsyLattice could not load your current plan right now.",
      },
      { status: 500 },
    );
  }
}
