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

    const [
      accountResult,
      billingAccountResult,
      studiesResult,
      passesResult,
      purchasesResult,
      transactionsResult,
      grantsResult,
      notesResult,
    ] = await Promise.all([
      admin
        .from("psylattice_admin_account_directory")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      admin
        .from("research_billing_accounts")
        .select(
          "user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end, billing_access_until, last_successful_charge_at, last_payment_failure_at, last_provider_event, last_provider_event_at, billing_issue_code, ai_bonus_units, email_bonus, media_bonus_bytes, cancel_at_period_end, subscription_cancelled_at, provider_last_synced_at",
        )
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
        .from("psylattice_billing_transactions")
        .select("id, source, description, status, amount_paise, currency, razorpay_order_id, razorpay_subscription_id, razorpay_invoice_id, razorpay_payment_id, paid_at, created_at")
        .eq("user_id", userId)
        .order("paid_at", { ascending: false, nullsFirst: false })
        .limit(100),
      admin
        .from("psylattice_admin_entitlement_grants")
        .select("id, grant_type, study_id, quantity, starts_at, ends_at, status, reason, granted_by, metadata, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      admin
        .from("psylattice_admin_support_notes")
        .select("id, user_id, category, note, created_by, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (accountResult.error) throw accountResult.error;
    if (!accountResult.data) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    if (billingAccountResult.error) throw billingAccountResult.error;
    if (studiesResult.error) throw studiesResult.error;
    if (passesResult.error) throw passesResult.error;
    if (purchasesResult.error) throw purchasesResult.error;
    if (transactionsResult.error) throw transactionsResult.error;
    if (grantsResult.error) throw grantsResult.error;
    if (notesResult.error) throw notesResult.error;

    const creatorIds = Array.from(new Set((notesResult.data || []).map((row) => row.created_by).filter(Boolean)));
    const { data: creators, error: creatorError } = creatorIds.length
      ? await admin
          .from("psylattice_admin_account_directory")
          .select("user_id, full_name, email")
          .in("user_id", creatorIds)
      : { data: [], error: null };
    if (creatorError) throw creatorError;
    const creatorMap = new Map((creators || []).map((row) => [row.user_id, row]));

    return NextResponse.json(
      {
        ok: true,
        account: accountResult.data,
        billingAccount: billingAccountResult.data || null,
        studies: studiesResult.data || [],
        studyEntitlements: passesResult.data || [],
        payments: purchasesResult.data || [],
        billingTransactions: transactionsResult.data || [],
        adminGrants: grantsResult.data || [],
        supportNotes: (notesResult.data || []).map((row) => ({
          ...row,
          creator: row.created_by ? creatorMap.get(row.created_by) || null : null,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin user detail failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
