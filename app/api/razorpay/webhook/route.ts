import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  billingAdmin,
  providerUnixToIso,
  verifyWebhookSignature,
} from "@/lib/razorpay/marketplaceServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Entity = Record<string, any>;

async function applyPurchase(purchaseId: string) {
  const admin = billingAdmin();
  const { error } = await admin.rpc("psylattice_apply_marketplace_purchase", {
    p_purchase_id: purchaseId,
  });
  if (error) throw error;
}

function eventEntity(payload: any, name: string): Entity | null {
  return payload?.payload?.[name]?.entity || null;
}

async function updateSubscriptionAccount(subscription: Entity, purchaseUserId?: string | null) {
  const admin = billingAdmin();
  const subscriptionId = String(subscription?.id || "");
  if (!subscriptionId) return;

  const update = {
    plan_status: String(subscription.status || "unknown"),
    current_period_start: providerUnixToIso(subscription.current_start),
    current_period_end: providerUnixToIso(subscription.current_end),
    updated_at: new Date().toISOString(),
  };

  let query = admin.from("research_billing_accounts").update(update);
  query = purchaseUserId
    ? query.eq("user_id", purchaseUserId)
    : query.eq("razorpay_subscription_id", subscriptionId);

  const { error } = await query;
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  try {
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = String(payload?.event || "unknown");
    const eventId =
      request.headers.get("x-razorpay-event-id") ||
      crypto.createHash("sha256").update(rawBody).digest("hex");
    const admin = billingAdmin();

    const { data: existing, error: existingError } = await admin
      .from("research_billing_webhook_events")
      .select("event_id, processed_at")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing?.processed_at) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    if (!existing) {
      const { error: insertError } = await admin
        .from("research_billing_webhook_events")
        .insert({ event_id: eventId, event_type: eventType });
      if (insertError) throw insertError;
    }

    try {
      if (eventType === "payment.captured") {
        const payment = eventEntity(payload, "payment");
        const orderId = String(payment?.order_id || "");

        if (orderId) {
          const { data: purchase, error: purchaseError } = await admin
            .from("research_billing_purchases")
            .select("id, user_id, amount_paise, currency, status")
            .eq("razorpay_order_id", orderId)
            .maybeSingle();
          if (purchaseError) throw purchaseError;

          if (
            purchase &&
            Number(payment?.amount) === Number(purchase.amount_paise) &&
            String(payment?.currency || "") === String(purchase.currency)
          ) {
            const { error: markError } = await admin
              .from("research_billing_purchases")
              .update({
                status: "paid",
                razorpay_payment_id: String(payment?.id || "") || null,
                provider_state: "captured",
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", purchase.id);
            if (markError) throw markError;
            await applyPurchase(purchase.id);
          }
        }
      }

      if (eventType.startsWith("subscription.")) {
        const subscription = eventEntity(payload, "subscription");
        const subscriptionId = String(subscription?.id || "");

        if (subscriptionId) {
          const { data: purchase, error: purchaseError } = await admin
            .from("research_billing_purchases")
            .select("id, user_id, status")
            .eq("razorpay_subscription_id", subscriptionId)
            .maybeSingle();
          if (purchaseError) throw purchaseError;

          if (purchase) {
            if (eventType === "subscription.activated" || eventType === "subscription.charged") {
              const payment = eventEntity(payload, "payment");
              const { error: markError } = await admin
                .from("research_billing_purchases")
                .update({
                  status: "paid",
                  razorpay_payment_id: payment?.id || undefined,
                  provider_state: String(subscription?.status || "active"),
                  paid_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", purchase.id);
              if (markError) throw markError;
              await applyPurchase(purchase.id);
            }

            await updateSubscriptionAccount(subscription!, purchase.user_id);
          } else {
            await updateSubscriptionAccount(subscription!);
          }
        }
      }

      const { error: doneError } = await admin
        .from("research_billing_webhook_events")
        .update({ processed_at: new Date().toISOString(), last_error: null })
        .eq("event_id", eventId);
      if (doneError) throw doneError;

      return NextResponse.json({ ok: true });
    } catch (processingError) {
      await admin
        .from("research_billing_webhook_events")
        .update({
          last_error: processingError instanceof Error ? processingError.message.slice(0, 500) : "Webhook processing failed.",
        })
        .eq("event_id", eventId);
      throw processingError;
    }
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
