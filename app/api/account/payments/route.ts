import { NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
} from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function purchaseLabel(cart: unknown) {
  if (!Array.isArray(cart) || cart.length === 0) return "PsyLattice purchase";
  const names = cart
    .map((line) => {
      if (!line || typeof line !== "object") return null;
      const row = line as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      const quantity = Math.max(1, Number(row.quantity || 1));
      return name ? (quantity > 1 ? `${name} ×${quantity}` : name) : null;
    })
    .filter((value): value is string => Boolean(value));

  if (names.length === 0) return "PsyLattice purchase";
  if (names.length <= 2) return names.join(" + ");
  return `${names[0]} + ${names.length - 1} more`;
}

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
      .from("research_billing_purchases")
      .select(
        "id, checkout_kind, status, amount_paise, currency, cart, razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, provider_state, paid_at, created_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const payments = (data || []).map((row) => ({
      id: row.id,
      label: purchaseLabel(row.cart),
      checkoutKind: row.checkout_kind,
      status: row.status,
      amountPaise: Number(row.amount_paise || 0),
      currency: row.currency || "INR",
      transactionId:
        row.razorpay_payment_id ||
        row.razorpay_order_id ||
        row.razorpay_subscription_id ||
        null,
      razorpayPaymentId: row.razorpay_payment_id || null,
      razorpayOrderId: row.razorpay_order_id || null,
      razorpaySubscriptionId: row.razorpay_subscription_id || null,
      providerState: row.provider_state || null,
      paidAt: row.paid_at || null,
      createdAt: row.created_at,
    }));

    const successful = payments.filter((payment) => payment.status === "paid");

    return NextResponse.json(
      {
        ok: true,
        stats: {
          successfulPayments: successful.length,
          totalPaidPaise: successful.reduce(
            (sum, payment) => sum + payment.amountPaise,
            0,
          ),
          lastPaymentAt:
            successful[0]?.paidAt || successful[0]?.createdAt || null,
        },
        payments,
        note:
          "This history reflects PsyLattice payment records stored by the current checkout system. Recurring-renewal ledger expansion will be added with subscription lifecycle handling.",
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
