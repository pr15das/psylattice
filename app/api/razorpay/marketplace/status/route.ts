import { NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  getResearcherEntitlements,
} from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Backwards-compatible marketplace status endpoint.
 * New product code should prefer /api/billing/me.
 */
export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    const entitlements = await getResearcherEntitlements(user.id);

    return NextResponse.json(
      {
        ok: true,
        planTier: entitlements.plan,
        hasStudyPass: entitlements.hasAnyStudyPass,
        subscriptionStatus: entitlements.planStatus,
        renewalAt: entitlements.subscription.currentPeriodEnd,
        entitlements,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Could not load marketplace billing status:", error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not load your billing status." },
      { status: 500 },
    );
  }
}
