import { NextResponse } from "next/server";
import { authenticatedBillingUser, loadBillingSnapshot } from "@/lib/razorpay/marketplaceServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
    }

    const snapshot = await loadBillingSnapshot(user.id);

    return NextResponse.json(
      {
        ok: true,
        planTier: snapshot.effectivePlan,
        hasStudyPass: snapshot.hasStudyPass,
        subscriptionStatus: snapshot.account?.plan_status || null,
        renewalAt: snapshot.account?.current_period_end || null,
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
