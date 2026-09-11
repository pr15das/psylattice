import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const admin = billingAdmin();
    const limit = Math.min(200, Math.max(20, Number(request.nextUrl.searchParams.get("limit") || 100)));
    const status = request.nextUrl.searchParams.get("status") || "all";

    let query = admin
      .from("research_billing_purchases")
      .select("id, user_id, checkout_kind, status, amount_paise, currency, cart, study_id, razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, provider_state, paid_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status !== "all" && ["creating", "created", "paid", "failed", "refunded"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    const userIds = Array.from(new Set((data || []).map((row) => row.user_id).filter(Boolean)));
    const { data: users, error: userError } = userIds.length
      ? await admin
          .from("psylattice_admin_account_directory")
          .select("user_id, email, full_name")
          .in("user_id", userIds)
      : { data: [], error: null };
    if (userError) throw userError;
    const userMap = new Map((users || []).map((row) => [row.user_id, row]));

    return NextResponse.json(
      { ok: true, payments: (data || []).map((row) => ({ ...row, user: userMap.get(row.user_id) || null })) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin payment list failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
