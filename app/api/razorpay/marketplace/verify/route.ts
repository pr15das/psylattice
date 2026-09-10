import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
  getRazorpayCredentials,
  loadBillingSnapshot,
  providerUnixToIso,
  razorpayRequest,
  verifyHexHmac,
} from "@/lib/razorpay/marketplaceServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PurchaseRow = {
  id: string;
  user_id: string;
  checkout_kind: "order" | "subscription";
  status: string;
  amount_paise: number;
  currency: string;
  cart: Array<{ productId: string; quantity: number }>;
  study_id: string | null;
  razorpay_order_id: string | null;
  razorpay_subscription_id: string | null;
  razorpay_payment_id: string | null;
};

type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  order_id?: string | null;
};

type RazorpaySubscription = {
  id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
};

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

async function applyPurchase(purchaseId: string) {
  const admin = billingAdmin();
  const { error } = await admin.rpc("psylattice_apply_marketplace_purchase", {
    p_purchase_id: purchaseId,
  });
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) return jsonError("Please sign in again.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const purchaseId = typeof body.purchaseId === "string" ? body.purchaseId.trim() : "";
    const paymentId =
      typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
    const suppliedSignature =
      typeof body.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";

    if (!purchaseId || !paymentId || !suppliedSignature) {
      return jsonError("The payment verification response is incomplete.");
    }

    const admin = billingAdmin();
    const { data, error } = await admin
      .from("research_billing_purchases")
      .select(
        "id, user_id, checkout_kind, status, amount_paise, currency, cart, study_id, razorpay_order_id, razorpay_subscription_id, razorpay_payment_id",
      )
      .eq("id", purchaseId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return jsonError("This checkout session could not be found.", 404);

    const purchase = data as PurchaseRow;

    if (purchase.status === "paid") {
      const snapshot = await loadBillingSnapshot(user.id);
      return NextResponse.json({
        ok: true,
        paid: true,
        planTier: snapshot.effectivePlan,
      });
    }

    const { keySecret } = getRazorpayCredentials();
    let signatureValid = false;

    if (purchase.checkout_kind === "order") {
      if (!purchase.razorpay_order_id) throw new Error("Purchase order id is missing.");

      const returnedOrderId =
        typeof body.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
      if (returnedOrderId && returnedOrderId !== purchase.razorpay_order_id) {
        return jsonError("The Razorpay order does not match this checkout.", 400);
      }

      signatureValid = verifyHexHmac(
        `${purchase.razorpay_order_id}|${paymentId}`,
        suppliedSignature,
        keySecret,
      );
    } else {
      if (!purchase.razorpay_subscription_id) throw new Error("Purchase subscription id is missing.");

      const returnedSubscriptionId =
        typeof body.razorpay_subscription_id === "string"
          ? body.razorpay_subscription_id.trim()
          : "";
      if (returnedSubscriptionId !== purchase.razorpay_subscription_id) {
        return jsonError("The Razorpay subscription does not match this checkout.", 400);
      }

      signatureValid = verifyHexHmac(
        `${paymentId}|${purchase.razorpay_subscription_id}`,
        suppliedSignature,
        keySecret,
      );
    }

    if (!signatureValid) {
      return jsonError("Payment signature verification failed.", 400);
    }

    let payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);

    if (payment.currency !== "INR" || Number(payment.amount) !== Number(purchase.amount_paise)) {
      return jsonError("The captured payment amount does not match this checkout.", 400);
    }

    if (
      purchase.checkout_kind === "order" &&
      purchase.razorpay_order_id &&
      payment.order_id !== purchase.razorpay_order_id
    ) {
      return jsonError("The captured payment is not attached to this order.", 400);
    }

    // If account-level auto-capture is off, capture a verified one-time order here.
    if (purchase.checkout_kind === "order" && payment.status === "authorized") {
      payment = await razorpayRequest<RazorpayPayment>(
        `/payments/${encodeURIComponent(paymentId)}/capture`,
        {
          method: "POST",
          body: { amount: purchase.amount_paise, currency: "INR" },
        },
      );
    }

    if (payment.status !== "captured") {
      await admin
        .from("research_billing_purchases")
        .update({
          razorpay_payment_id: paymentId,
          signature_verified: true,
          provider_state: payment.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase.id)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          ok: true,
          paid: false,
          processing: true,
          message: "Payment was verified and is waiting for capture. Your purchase will activate automatically when Razorpay confirms it.",
        },
        { status: 202 },
      );
    }

    let providerState = payment.status;
    let periodStart: string | null = null;
    let periodEnd: string | null = null;

    if (purchase.checkout_kind === "subscription" && purchase.razorpay_subscription_id) {
      const subscription = await razorpayRequest<RazorpaySubscription>(
        `/subscriptions/${encodeURIComponent(purchase.razorpay_subscription_id)}`,
      );
      if (subscription.id !== purchase.razorpay_subscription_id) {
        return jsonError("The provider subscription could not be verified.", 400);
      }
      providerState = subscription.status;
      periodStart = providerUnixToIso(subscription.current_start);
      periodEnd = providerUnixToIso(subscription.current_end);
    }

    const { error: markError } = await admin
      .from("research_billing_purchases")
      .update({
        status: "paid",
        razorpay_payment_id: paymentId,
        signature_verified: true,
        provider_state: providerState,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchase.id)
      .eq("user_id", user.id);

    if (markError) throw markError;

    await applyPurchase(purchase.id);

    if (purchase.checkout_kind === "subscription" && purchase.razorpay_subscription_id) {
      await admin
        .from("research_billing_accounts")
        .update({
          plan_status: providerState,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("razorpay_subscription_id", purchase.razorpay_subscription_id);
    }

    const snapshot = await loadBillingSnapshot(user.id);

    return NextResponse.json(
      {
        ok: true,
        paid: true,
        planTier: snapshot.effectivePlan,
        message: "Payment verified. Your PsyLattice purchase is active.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Marketplace payment verification failed:", error);
    return jsonError("PsyLattice could not verify this payment right now.", 500);
  }
}
