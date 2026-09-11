import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { billingAdmin, ensureBillingAccount } from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RazorpaySubscription = {
  id?: string;
  plan_id?: string | null;
  status?: string | null;
  current_start?: number | null;
  current_end?: number | null;
  ended_at?: number | null;
  notes?: Record<string, unknown> | unknown[] | null;
};

type RazorpayPayment = {
  id?: string;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  order_id?: string | null;
  invoice_id?: string | null;
  created_at?: number | null;
  error_code?: string | null;
  error_description?: string | null;
};

type WebhookPayload = {
  entity?: string;
  event?: string;
  created_at?: number | null;
  payload?: {
    subscription?: { entity?: RazorpaySubscription | null } | null;
    payment?: { entity?: RazorpayPayment | null } | null;
  };
};

type BillingPurchase = {
  id: string;
  user_id: string;
  checkout_kind: "order" | "subscription";
  status: string;
  amount_paise: number;
  currency: string;
  cart: Array<Record<string, unknown>>;
  study_id: string | null;
  razorpay_order_id: string | null;
  razorpay_subscription_id: string | null;
  razorpay_payment_id: string | null;
  provider_state: string | null;
};

function isoFromEpoch(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function bodyHash(rawBody: string) {
  return createHash("sha256").update(rawBody).digest("hex");
}

function validSignature(rawBody: string, received: string, secret: string) {
  if (!received || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function verifyWebhookSignature(rawBody: string, received: string) {
  const current = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const previous = process.env.RAZORPAY_WEBHOOK_SECRET_PREVIOUS || "";

  if (validSignature(rawBody, received, current)) return true;
  if (previous && validSignature(rawBody, received, previous)) return true;
  return false;
}

function subscriptionEntity(payload: WebhookPayload) {
  return payload.payload?.subscription?.entity || null;
}

function paymentEntity(payload: WebhookPayload) {
  return payload.payload?.payment?.entity || null;
}

function userIdFromNotes(subscription: RazorpaySubscription | null) {
  const notes = subscription?.notes;
  if (!notes || Array.isArray(notes) || typeof notes !== "object") return null;
  const raw = (notes as Record<string, unknown>).psylattice_user_id;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function planTierFromPurchase(purchase: BillingPurchase | null) {
  for (const line of purchase?.cart || []) {
    const id = String(line.productId || "");
    if (id === "pro-monthly" || id === "pro-annual") return id;
  }
  return null;
}

function planTierFromProviderPlan(planId: string | null | undefined) {
  if (!planId) return null;
  if (planId === process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID) return "pro-monthly";
  if (planId === process.env.RAZORPAY_PRO_ANNUAL_PLAN_ID) return "pro-annual";
  return null;
}

function safePayloadSummary(
  eventType: string,
  subscription: RazorpaySubscription | null,
  payment: RazorpayPayment | null,
) {
  // Deliberately excludes contact, email, card, bank, VPA and provider notes.
  return {
    event: eventType,
    subscription_status: subscription?.status || null,
    plan_id: subscription?.plan_id || null,
    current_start: isoFromEpoch(subscription?.current_start),
    current_end: isoFromEpoch(subscription?.current_end),
    ended_at: isoFromEpoch(subscription?.ended_at),
    payment_status: payment?.status || null,
    payment_amount_paise: Number(payment?.amount || 0),
    payment_currency: payment?.currency || null,
    order_id: payment?.order_id || null,
    invoice_id: payment?.invoice_id || null,
    payment_error_code: payment?.error_code || null,
  };
}

async function purchaseBySubscription(subscriptionId: string | null) {
  if (!subscriptionId) return null;
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("research_billing_purchases")
    .select(
      "id, user_id, checkout_kind, status, amount_paise, currency, cart, study_id, razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, provider_state",
    )
    .eq("razorpay_subscription_id", subscriptionId)
    .maybeSingle();
  if (error) throw error;
  return (data || null) as BillingPurchase | null;
}

async function purchaseByOrder(orderId: string | null) {
  if (!orderId) return null;
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("research_billing_purchases")
    .select(
      "id, user_id, checkout_kind, status, amount_paise, currency, cart, study_id, razorpay_order_id, razorpay_subscription_id, razorpay_payment_id, provider_state",
    )
    .eq("razorpay_order_id", orderId)
    .maybeSingle();
  if (error) throw error;
  return (data || null) as BillingPurchase | null;
}

async function accountBySubscription(subscriptionId: string | null) {
  if (!subscriptionId) return null;
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("research_billing_accounts")
    .select(
      "user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end, billing_access_until, last_successful_charge_at, last_payment_failure_at, last_provider_event, last_provider_event_at, billing_issue_code",
    )
    .eq("razorpay_subscription_id", subscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function resolveSubscriptionOwner(
  subscription: RazorpaySubscription | null,
  purchase: BillingPurchase | null,
) {
  if (purchase?.user_id) return purchase.user_id;
  const account = await accountBySubscription(subscription?.id || null);
  if (account?.user_id) return account.user_id;

  const notesUserId = userIdFromNotes(subscription);
  if (!notesUserId) return null;

  const admin = billingAdmin();
  const { data, error } = await admin.auth.admin.getUserById(notesUserId);
  if (error || !data.user) return null;
  return notesUserId;
}

async function setWebhookEventContext(
  eventId: string,
  userId: string | null,
  subscription: RazorpaySubscription | null,
  payment: RazorpayPayment | null,
  providerCreatedAt: string | null,
  eventType: string,
) {
  const admin = billingAdmin();
  const { error } = await admin
    .from("research_billing_webhook_events")
    .update({
      user_id: userId,
      subscription_id: subscription?.id || null,
      payment_id: payment?.id || null,
      provider_created_at: providerCreatedAt,
      payload_summary: safePayloadSummary(eventType, subscription, payment),
      last_error: null,
    })
    .eq("event_id", eventId);
  if (error) throw error;
}

async function markEventProcessed(eventId: string) {
  const admin = billingAdmin();
  const { error } = await admin
    .from("research_billing_webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("event_id", eventId);
  if (error) throw error;
}

async function markEventFailed(eventId: string, error: unknown) {
  const admin = billingAdmin();
  await admin
    .from("research_billing_webhook_events")
    .update({
      last_error:
        error instanceof Error ? error.message.slice(0, 2000) : "Webhook processing failed.",
    })
    .eq("event_id", eventId);
}

async function applyPurchaseFromCapturedPayment(
  purchase: BillingPurchase,
  payment: RazorpayPayment,
  providerState: string,
) {
  const admin = billingAdmin();
  const paidAt = isoFromEpoch(payment.created_at) || new Date().toISOString();

  const { error: updateError } = await admin
    .from("research_billing_purchases")
    .update({
      status: "paid",
      razorpay_payment_id: payment.id || purchase.razorpay_payment_id,
      signature_verified: true,
      provider_state: providerState,
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);
  if (updateError) throw updateError;

  const { error: applyError } = await admin.rpc(
    "psylattice_apply_marketplace_purchase",
    { p_purchase_id: purchase.id },
  );
  if (applyError) throw applyError;
}

async function recordSuccessfulTransaction(args: {
  userId: string;
  eventId: string;
  eventType: string;
  purchase: BillingPurchase | null;
  payment: RazorpayPayment;
  subscription: RazorpaySubscription | null;
}) {
  const { userId, eventId, eventType, purchase, payment, subscription } = args;
  if (!payment.id || payment.status !== "captured") return;

  const admin = billingAdmin();
  const paidAt = isoFromEpoch(payment.created_at) || new Date().toISOString();

  const { data: existingByPayment, error: byPaymentError } = await admin
    .from("psylattice_billing_transactions")
    .select("id, purchase_id, source")
    .eq("razorpay_payment_id", payment.id)
    .maybeSingle();
  if (byPaymentError) throw byPaymentError;

  const initialSubscriptionCheckout =
    purchase?.checkout_kind === "subscription" &&
    (!purchase.razorpay_payment_id || purchase.razorpay_payment_id === payment.id);

  const source =
    purchase?.checkout_kind === "order" || initialSubscriptionCheckout
      ? "checkout"
      : "subscription_invoice";

  const description =
    source === "checkout"
      ? purchase?.checkout_kind === "subscription"
        ? "PsyLattice subscription checkout"
        : "PsyLattice marketplace purchase"
      : planTierFromPurchase(purchase) === "pro-annual"
        ? "PsyLattice Pro Annual renewal"
        : "PsyLattice Pro Monthly renewal";

  const patch = {
    user_id: userId,
    description,
    status: "paid",
    amount_paise: Math.max(0, Number(payment.amount || purchase?.amount_paise || 0)),
    currency: payment.currency || purchase?.currency || "INR",
    razorpay_order_id: payment.order_id || purchase?.razorpay_order_id || null,
    razorpay_subscription_id: subscription?.id || purchase?.razorpay_subscription_id || null,
    razorpay_invoice_id: payment.invoice_id || null,
    razorpay_payment_id: payment.id,
    paid_at: paidAt,
    provider_created_at: paidAt,
    metadata: {
      webhook_event_id: eventId,
      webhook_event_type: eventType,
    },
    updated_at: new Date().toISOString(),
  };

  if (existingByPayment) {
    const { error } = await admin
      .from("psylattice_billing_transactions")
      .update(patch)
      .eq("id", existingByPayment.id);
    if (error) throw error;
    return;
  }

  if (source === "checkout" && purchase) {
    const { data: existingByPurchase, error: byPurchaseError } = await admin
      .from("psylattice_billing_transactions")
      .select("id")
      .eq("purchase_id", purchase.id)
      .maybeSingle();
    if (byPurchaseError) throw byPurchaseError;

    if (existingByPurchase) {
      const { error } = await admin
        .from("psylattice_billing_transactions")
        .update(patch)
        .eq("id", existingByPurchase.id);
      if (error) throw error;
      return;
    }
  }

  const { error } = await admin.from("psylattice_billing_transactions").insert({
    ...patch,
    source,
    purchase_id: source === "checkout" && purchase ? purchase.id : null,
  });
  if (error) throw error;
}

async function updateSubscriptionBillingState(args: {
  eventType: string;
  userId: string;
  purchase: BillingPurchase | null;
  subscription: RazorpaySubscription;
  payment: RazorpayPayment | null;
  eventCreatedAt: string;
}) {
  const { eventType, userId, purchase, subscription, payment, eventCreatedAt } = args;
  const admin = billingAdmin();

  await ensureBillingAccount(userId);

  const { data: existing, error: existingError } = await admin
    .from("research_billing_accounts")
    .select(
      "user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end, billing_access_until, last_successful_charge_at, last_payment_failure_at, last_provider_event, last_provider_event_at, billing_issue_code",
    )
    .eq("user_id", userId)
    .single();
  if (existingError) throw existingError;

  const providerStatus = subscription.status || existing.plan_status || "active";
  const currentStart = isoFromEpoch(subscription.current_start);
  const currentEnd = isoFromEpoch(subscription.current_end);
  const endedAt = isoFromEpoch(subscription.ended_at);
  const staleProviderEvent =
    Boolean(existing.last_provider_event_at) &&
    new Date(eventCreatedAt).getTime() <
      new Date(String(existing.last_provider_event_at)).getTime();

  const inferredTier =
    (existing.plan_tier === "pro-monthly" || existing.plan_tier === "pro-annual"
      ? existing.plan_tier
      : null) ||
    planTierFromPurchase(purchase) ||
    planTierFromProviderPlan(subscription.plan_id);

  if (!inferredTier) {
    // Signed event, but it is not a PsyLattice Pro plan we can safely map.
    return;
  }

  // Razorpay explicitly warns that webhook delivery order is not guaranteed.
  // For a stale event, never overwrite newer provider state. The one useful
  // exception is a late successful charge: it may still prove a later paid
  // access boundary, so only extend billing_access_until when appropriate.
  if (staleProviderEvent) {
    if (
      eventType === "subscription.charged" &&
      payment?.status === "captured" &&
      currentEnd
    ) {
      const previousAccess = existing.billing_access_until as string | null;
      const shouldExtend =
        !previousAccess ||
        new Date(currentEnd).getTime() > new Date(previousAccess).getTime();

      if (shouldExtend) {
        const { error: staleChargeError } = await admin
          .from("research_billing_accounts")
          .update({
            billing_access_until: currentEnd,
            last_successful_charge_at:
              isoFromEpoch(payment.created_at) || eventCreatedAt,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        if (staleChargeError) throw staleChargeError;
      }
    }
    return;
  }

  let accessUntil = existing.billing_access_until as string | null;
  let lastSuccessfulChargeAt = existing.last_successful_charge_at as string | null;
  let lastPaymentFailureAt = existing.last_payment_failure_at as string | null;
  let billingIssueCode = existing.billing_issue_code as string | null;

  if (eventType === "subscription.charged" && payment?.status === "captured") {
    // Only a successful charge can extend access to a new paid cycle.
    if (currentEnd) accessUntil = currentEnd;
    lastSuccessfulChargeAt =
      isoFromEpoch(payment.created_at) || eventCreatedAt;
    billingIssueCode = null;
  } else if (eventType === "subscription.pending") {
    lastPaymentFailureAt = eventCreatedAt;
    billingIssueCode = payment?.error_code || "payment_pending";
  } else if (eventType === "subscription.halted") {
    lastPaymentFailureAt = eventCreatedAt;
    billingIssueCode = payment?.error_code || "subscription_halted";
  } else if (eventType === "payment.failed") {
    lastPaymentFailureAt = eventCreatedAt;
    billingIssueCode = payment?.error_code || "payment_failed";
  } else if (
    eventType === "subscription.activated" ||
    eventType === "subscription.resumed"
  ) {
    billingIssueCode = null;
  } else if (eventType === "subscription.cancelled") {
    // Razorpay emits cancelled when cancellation actually takes effect.
    // An immediate cancellation therefore ends access now; an end-of-cycle
    // cancellation ends it at the provider's ended_at/current_end.
    const cancellationBoundary = endedAt || currentEnd || eventCreatedAt;
    if (
      !accessUntil ||
      new Date(cancellationBoundary).getTime() < new Date(accessUntil).getTime()
    ) {
      accessUntil = cancellationBoundary;
    }
  } else if (eventType === "subscription.completed") {
    // Completion occurs at the natural end of the subscription. Preserve the
    // final paid cycle through current_end when supplied.
    if (currentEnd) accessUntil = currentEnd;
  } else if (eventType === "subscription.expired") {
    accessUntil = eventCreatedAt;
    billingIssueCode = "subscription_expired";
  }

  const { error: updateError } = await admin
    .from("research_billing_accounts")
    .update({
      plan_tier: inferredTier,
      plan_status: providerStatus,
      razorpay_subscription_id: subscription.id || existing.razorpay_subscription_id,
      current_period_start: currentStart,
      current_period_end: currentEnd,
      billing_access_until: accessUntil,
      last_successful_charge_at: lastSuccessfulChargeAt,
      last_payment_failure_at: lastPaymentFailureAt,
      last_provider_event: eventType,
      last_provider_event_at: eventCreatedAt,
      billing_issue_code: billingIssueCode,
      provider_last_synced_at: eventCreatedAt,
      ...(eventType === "subscription.cancelled"
        ? {
            cancel_at_period_end: false,
            subscription_cancelled_at: endedAt || eventCreatedAt,
          }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (updateError) throw updateError;

  if (subscription.id) {
    const { error: purchaseUpdateError } = await admin
      .from("research_billing_purchases")
      .update({
        provider_state: providerStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_subscription_id", subscription.id);
    if (purchaseUpdateError) throw purchaseUpdateError;
  }
}

export async function POST(request: NextRequest) {
  let eventId = "";
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Webhook secret is not configured." },
        { status: 503 },
      );
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { ok: false, error: "Invalid Razorpay webhook signature." },
        { status: 401 },
      );
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;
    const eventType = String(payload.event || "");
    if (!eventType) {
      return NextResponse.json({ ok: false, error: "Webhook event type is missing." }, { status: 400 });
    }

    eventId =
      request.headers.get("x-razorpay-event-id") ||
      `body_${bodyHash(rawBody)}`;

    const admin = billingAdmin();
    const { data: existingEvent, error: existingEventError } = await admin
      .from("research_billing_webhook_events")
      .select("event_id, processed_at")
      .eq("event_id", eventId)
      .maybeSingle();
    if (existingEventError) throw existingEventError;

    if (existingEvent?.processed_at) {
      return NextResponse.json(
        { ok: true, duplicate: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!existingEvent) {
      const { error: insertEventError } = await admin
        .from("research_billing_webhook_events")
        .insert({
          event_id: eventId,
          event_type: eventType,
        });
      if (insertEventError && insertEventError.code !== "23505") {
        throw insertEventError;
      }
    }

    const subscription = subscriptionEntity(payload);
    const payment = paymentEntity(payload);
    const eventCreatedAt =
      isoFromEpoch(payload.created_at) || new Date().toISOString();

    const subscriptionPurchase = await purchaseBySubscription(subscription?.id || null);
    const orderPurchase =
      eventType === "payment.captured"
        ? await purchaseByOrder(payment?.order_id || null)
        : null;
    const purchase = subscriptionPurchase || orderPurchase;
    const userId =
      purchase?.user_id ||
      (subscription
        ? await resolveSubscriptionOwner(subscription, subscriptionPurchase)
        : null);

    await setWebhookEventContext(
      eventId,
      userId,
      subscription,
      payment,
      eventCreatedAt,
      eventType,
    );

    if (eventType === "payment.captured" && payment?.status === "captured" && orderPurchase) {
      await applyPurchaseFromCapturedPayment(
        orderPurchase,
        payment,
        payment.status || "captured",
      );
      await recordSuccessfulTransaction({
        userId: orderPurchase.user_id,
        eventId,
        eventType,
        purchase: orderPurchase,
        payment,
        subscription: null,
      });
    }

    if (eventType.startsWith("subscription.") && subscription && userId) {
      if (
        eventType === "subscription.charged" &&
        payment?.status === "captured" &&
        subscriptionPurchase
      ) {
        const wasAlreadyPaid = subscriptionPurchase.status === "paid";

        // The marketplace purchase row represents the original checkout, not
        // every renewal. Only the first successful subscription charge should
        // write its payment id/apply the purchased cart.
        if (!wasAlreadyPaid) {
          await applyPurchaseFromCapturedPayment(
            subscriptionPurchase,
            payment,
            subscription.status || "active",
          );
        }

        await recordSuccessfulTransaction({
          userId,
          eventId,
          eventType,
          purchase: subscriptionPurchase,
          payment,
          subscription,
        });
      }

      await updateSubscriptionBillingState({
        eventType,
        userId,
        purchase: subscriptionPurchase,
        subscription,
        payment,
        eventCreatedAt,
      });
    }

    if (eventType === "payment.failed" && payment && subscription && userId) {
      await updateSubscriptionBillingState({
        eventType,
        userId,
        purchase: subscriptionPurchase,
        subscription,
        payment,
        eventCreatedAt,
      });
    }

    await markEventProcessed(eventId);

    return NextResponse.json(
      {
        ok: true,
        event: eventType,
        handled:
          eventType === "payment.captured" ||
          eventType === "payment.failed" ||
          eventType.startsWith("subscription."),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error);
    if (eventId) await markEventFailed(eventId, error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not process the Razorpay webhook." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
