import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdmin();
    const { userId } = await context.params;
    const admin = billingAdmin();

    const [accountResult, studiesResult, passesResult, paymentsResult, grantsResult] = await Promise.all([
      admin
        .from("psylattice_admin_account_directory")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      admin
        .from("research_studies")
        .select("id, title, status, target_sample_size, created_at, updated_at")
        .eq("owner_user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(100),
      admin
        .from("research_study_entitlements")
        .select("study_id, study_pass_active, participant_bonus, created_at, updated_at")
        .eq("user_id", userId),
      admin
        .from("research_billing_purchases")
        .select("id, checkout_kind, status, amount_paise, currency, cart, razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, provider_state, paid_at, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("psylattice_admin_entitlement_grants")
        .select("id, grant_type, study_id, quantity, starts_at, ends_at, status, reason, granted_by, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (accountResult.error) throw accountResult.error;
    if (!accountResult.data) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    if (studiesResult.error) throw studiesResult.error;
    if (passesResult.error) throw passesResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    if (grantsResult.error) throw grantsResult.error;

    return NextResponse.json(
      {
        ok: true,
        account: accountResult.data,
        studies: studiesResult.data || [],
        studyEntitlements: passesResult.data || [],
        payments: paymentsResult.data || [],
        adminGrants: grantsResult.data || [],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin user detail failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
