import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function transactionLookupFilter(rawQuery: string) {
  const query = rawQuery.trim();

  if (!query) return null;

  // Razorpay IDs use letters, numbers, underscores and hyphens. Keeping the
  // lookup alphabet narrow also prevents PostgREST filter syntax from being
  // introduced through the query string.
  if (!/^[A-Za-z0-9_-]{3,160}$/.test(query)) {
    throw new Error("Enter a valid Razorpay transaction, invoice, order or subscription ID.");
  }

  const filters = [
    `razorpay_payment_id.eq.${query}`,
    `razorpay_invoice_id.eq.${query}`,
    `razorpay_order_id.eq.${query}`,
    `razorpay_subscription_id.eq.${query}`,
  ];

  if (UUID_PATTERN.test(query)) {
    filters.push(`id.eq.${query}`);
  }

  return filters.join(",");
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const admin = billingAdmin();

    const limit = Math.min(
      250,
      Math.max(20, Number(request.nextUrl.searchParams.get("limit") || 100)),
    );
    const rawQuery = String(request.nextUrl.searchParams.get("q") || "").trim();
    const lookupFilter = transactionLookupFilter(rawQuery);

    let paymentQuery = admin
      .from("psylattice_billing_transactions")
      .select(
        "id, user_id, source, description, status, amount_paise, currency, razorpay_order_id, razorpay_subscription_id, razorpay_invoice_id, razorpay_payment_id, paid_at, created_at",
      )
      .order("paid_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (lookupFilter) {
      paymentQuery = paymentQuery.or(lookupFilter);
    }

    const { data, error } = await paymentQuery;
    if (error) throw error;

    const userIds = Array.from(
      new Set((data || []).map((row) => row.user_id).filter(Boolean)),
    );

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
        query: rawQuery || null,
        payments: (data || []).map((row) => ({
          ...row,
          user: row.user_id ? userMap.get(row.user_id) || null : null,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin payment list failed:", error);

    if (
      error instanceof Error &&
      error.message.startsWith("Enter a valid Razorpay")
    ) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }

    const safe = adminErrorResponse(error);
    return NextResponse.json(
      { ok: false, error: safe.message },
      { status: safe.status },
    );
  }
}
