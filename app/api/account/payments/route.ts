import { NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
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

    const admin = billingAdmin();
    const { data, error } = await admin
      .from("psylattice_billing_transactions")
      .select(
        "id, source, description, status, amount_paise, currency, razorpay_order_id, razorpay_subscription_id, razorpay_invoice_id, razorpay_payment_id, paid_at, created_at",
      )
      .eq("user_id", user.id)
      .eq("status", "paid")
      .order("paid_at", { ascending: false, nullsFirst: false })
      .limit(200);

    if (error) throw error;

    const payments = (data || []).map((row) => ({
      id: row.id,
      label: row.description || "PsyLattice payment",
      checkoutKind: row.source,
      status: row.status,
      amountPaise: Number(row.amount_paise || 0),
      currency: row.currency || "INR",
      transactionId:
        row.razorpay_payment_id ||
        row.razorpay_invoice_id ||
        row.razorpay_order_id ||
        row.razorpay_subscription_id ||
        null,
      razorpayPaymentId: row.razorpay_payment_id || null,
      razorpayInvoiceId: row.razorpay_invoice_id || null,
      razorpayOrderId: row.razorpay_order_id || null,
      razorpaySubscriptionId: row.razorpay_subscription_id || null,
      providerState: row.status || null,
      paidAt: row.paid_at || null,
      createdAt: row.created_at,
    }));

    return NextResponse.json(
      {
        ok: true,
        stats: {
          successfulPayments: payments.length,
          totalPaidPaise: payments.reduce(
            (sum, payment) => sum + payment.amountPaise,
            0,
          ),
          lastPaymentAt:
            payments[0]?.paidAt || payments[0]?.createdAt || null,
        },
        payments,
        note:
          "Payment history uses the PsyLattice transaction ledger and includes recurring Razorpay invoices after reconciliation.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Account payment history failed:", error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not load your payment history." },
      { status: 500 },
    );
  }
}
