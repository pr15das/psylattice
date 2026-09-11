import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const admin = billingAdmin();
    const limit = Math.min(250, Math.max(20, Number(request.nextUrl.searchParams.get("limit") || 100)));

    const { data, error } = await admin
      .from("psylattice_billing_transactions")
      .select(
        "id, user_id, source, description, status, amount_paise, currency, razorpay_order_id, razorpay_subscription_id, razorpay_invoice_id, razorpay_payment_id, paid_at, created_at",
      )
      .order("paid_at", { ascending: false, nullsFirst: false })
      .limit(limit);
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
      {
        ok: true,
        payments: (data || []).map((row) => ({
          ...row,
          user: row.user_id ? userMap.get(row.user_id) || null : null,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin payment list failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
