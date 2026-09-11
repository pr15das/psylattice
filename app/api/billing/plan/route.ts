import { NextResponse } from "next/server";
import {
  accountHasCurrentPro,
  authenticatedBillingUser,
  billingAdmin,
  ensureBillingAccount,
  type BillingAccountRow,
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

    await ensureBillingAccount(user.id);
    const admin = billingAdmin();

    const [accountResult, passResult] = await Promise.all([
      admin
        .from("research_billing_accounts")
        .select(
          "user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end, ai_bonus_units, email_bonus, media_bonus_bytes",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("research_study_entitlements")
        .select("study_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("study_pass_active", true),
    ]);

    if (accountResult.error) throw accountResult.error;
    if (passResult.error) throw passResult.error;

    const account = (accountResult.data || null) as BillingAccountRow | null;
    const studyPassCount = Math.max(0, Number(passResult.count || 0));
    const hasPro = accountHasCurrentPro(account);
    const plan = hasPro
      ? account!.plan_tier
      : studyPassCount > 0
        ? "study-pass"
        : "free";

    const planName =
      plan === "pro-monthly"
        ? "Pro Monthly"
        : plan === "pro-annual"
          ? "Pro Annual"
          : plan === "study-pass"
            ? "Study Pass"
            : "Free";

    return NextResponse.json(
      { ok: true, plan, planName, studyPassCount },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Could not load PsyLattice plan badge status:", error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not load your current plan right now." },
      { status: 500 },
    );
  }
}
