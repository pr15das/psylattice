import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { razorpayRequest } from "@/lib/razorpay/marketplaceServer";
import {
  adminErrorResponse,
  requireAdmin,
  requireSuperAdmin,
  writeAdminAudit,
} from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RazorpaySubscription = {
  id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  ended_at?: number | null;
  total_count?: number | null;
  paid_count?: number | null;
  remaining_count?: number | null;
  has_scheduled_changes?: boolean | null;
};

type RazorpayInvoice = {
  id: string;
  subscription_id?: string | null;
  order_id?: string | null;
  payment_id?: string | null;
  status?: string | null;
  amount?: number | null;
  amount_paid?: number | null;
  gross_amount?: number | null;
  currency?: string | null;
  paid_at?: number | null;
  created_at?: number | null;
  billing_start?: number | null;
  billing_end?: number | null;
};

type RazorpayInvoiceCollection = {
  count?: number;
  items?: RazorpayInvoice[];
};

function epochToIso(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function safeReason(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 1000) : "";
}

function planRenewalLabel(planTier: unknown) {
  return planTier === "pro-annual"
    ? "PsyLattice Pro Annual renewal"
    : "PsyLattice Pro Monthly renewal";
}

function laterIso(a: string | null | undefined, b: string | null | undefined) {
  if (!a) return b || null;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

async function accountForUser(userId: string) {
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("research_billing_accounts")
    .select(
      "user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end, billing_access_until, last_successful_charge_at, last_payment_failure_at, last_provider_event, last_provider_event_at, billing_issue_code, cancel_at_period_end, subscription_cancelled_at, provider_last_synced_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function reconcileInvoices(
  userId: string,
  planTier: string,
  subscriptionId: string,
  invoices: RazorpayInvoice[],
) {
  const admin = billingAdmin();
  let inserted = 0;
  let updated = 0;
  let latestPaidAt: string | null = null;
  let latestPaidThrough: string | null = null;

  for (const invoice of invoices) {
    if (invoice.status !== "paid" || !invoice.payment_id) continue;

    const paidAt =
      epochToIso(invoice.paid_at) ||
      epochToIso(invoice.created_at) ||
      new Date().toISOString();
    const paidThrough = epochToIso(invoice.billing_end);

    latestPaidAt = laterIso(latestPaidAt, paidAt);
    latestPaidThrough = laterIso(latestPaidThrough, paidThrough);

    const { data: existing, error: existingError } = await admin
      .from("psylattice_billing_transactions")
      .select("id, source, description")
      .eq("razorpay_payment_id", invoice.payment_id)
      .maybeSingle();
    if (existingError) throw existingError;

    const amountPaise = Math.max(
      0,
      Number(
        invoice.amount_paid ??
          invoice.gross_amount ??
          invoice.amount ??
          0,
      ),
    );

    const patch = {
      user_id: userId,
      razorpay_subscription_id: subscriptionId,
      razorpay_invoice_id: invoice.id,
      razorpay_payment_id: invoice.payment_id,
      razorpay_order_id: invoice.order_id || null,
      status: "paid",
      amount_paise: amountPaise,
      currency: invoice.currency || "INR",
      paid_at: paidAt,
      provider_created_at: epochToIso(invoice.created_at),
      updated_at: new Date().toISOString(),
      metadata: {
        billing_start: epochToIso(invoice.billing_start),
        billing_end: paidThrough,
        source: "manual_admin_reconciliation",
      },
    };

    if (existing) {
      const { error } = await admin
        .from("psylattice_billing_transactions")
        .update(patch)
        .eq("id", existing.id);
      if (error) throw error;
      updated += 1;
    } else {
      const { error } = await admin
        .from("psylattice_billing_transactions")
        .insert({
          ...patch,
          source: "subscription_invoice",
          description: planRenewalLabel(planTier),
        });
      if (error) throw error;
      inserted += 1;
    }
  }

  return { inserted, updated, latestPaidAt, latestPaidThrough };
}

async function providerSnapshot(userId: string) {
  const local = await accountForUser(userId);
  const subscriptionId = local?.razorpay_subscription_id || null;

  if (!subscriptionId) {
    return {
      local,
      provider: null,
      invoices: [],
      reconciled: {
        inserted: 0,
        updated: 0,
        latestPaidAt: null,
        latestPaidThrough: null,
      },
    };
  }

  const provider = await razorpayRequest<RazorpaySubscription>(
    `/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "GET" },
  );

  const invoiceCollection = await razorpayRequest<RazorpayInvoiceCollection>(
    `/invoices?subscription_id=${encodeURIComponent(subscriptionId)}`,
    { method: "GET" },
  );
  const invoices = Array.isArray(invoiceCollection.items)
    ? invoiceCollection.items
    : [];

  const reconciled = await reconcileInvoices(
    userId,
    String(local?.plan_tier || "pro-monthly"),
    subscriptionId,
    invoices,
  );

  const currentStart = epochToIso(provider.current_start);
  const currentEnd = epochToIso(provider.current_end);
  const providerStatus = provider.status || local?.plan_status || "active";
  const now = new Date().toISOString();

  // Only an explicit billing_end on a PAID invoice can extend
  // billing_access_until during manual reconciliation. If Razorpay omits that
  // boundary, preserve the existing paid-access date rather than guessing from
  // the provider's current period, which may already be a failed renewal cycle.
  const paidThrough = reconciled.latestPaidThrough;

  const nextAccessUntil = laterIso(
    local?.billing_access_until || null,
    paidThrough,
  );

  const terminalBoundary =
    providerStatus === "cancelled"
      ? epochToIso(provider.ended_at) || now
      : providerStatus === "completed"
        ? currentEnd
        : null;

  const finalAccessUntil =
    terminalBoundary &&
    nextAccessUntil &&
    new Date(terminalBoundary).getTime() < new Date(nextAccessUntil).getTime()
      ? terminalBoundary
      : terminalBoundary || nextAccessUntil;

  const admin = billingAdmin();
  const { error: updateError } = await admin
    .from("research_billing_accounts")
    .update({
      plan_status: providerStatus,
      current_period_start: currentStart,
      current_period_end: currentEnd,
      billing_access_until: finalAccessUntil,
      last_successful_charge_at:
        reconciled.latestPaidAt ||
        local?.last_successful_charge_at ||
        null,
      last_provider_event: "admin.subscription.sync",
      last_provider_event_at: now,
      provider_last_synced_at: now,
      ...(providerStatus === "active"
        ? { billing_issue_code: null }
        : {}),
      ...(providerStatus === "cancelled"
        ? {
            cancel_at_period_end: false,
            subscription_cancelled_at:
              epochToIso(provider.ended_at) || now,
          }
        : {}),
      updated_at: now,
    })
    .eq("user_id", userId);
  if (updateError) throw updateError;

  const { error: purchaseUpdateError } = await admin
    .from("research_billing_purchases")
    .update({
      provider_state: providerStatus,
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("razorpay_subscription_id", subscriptionId);
  if (purchaseUpdateError) throw purchaseUpdateError;

  return {
    local: await accountForUser(userId),
    provider,
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      status: invoice.status || null,
      paymentId: invoice.payment_id || null,
      orderId: invoice.order_id || null,
      amountPaise: Math.max(
        0,
        Number(
          invoice.amount_paid ??
            invoice.gross_amount ??
            invoice.amount ??
            0,
        ),
      ),
      currency: invoice.currency || "INR",
      paidAt: epochToIso(invoice.paid_at),
      billingStart: epochToIso(invoice.billing_start),
      billingEnd: epochToIso(invoice.billing_end),
    })),
    reconciled,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdmin();
    const { userId } = await context.params;
    const admin = billingAdmin();

    const [local, transactionResult] = await Promise.all([
      accountForUser(userId),
      admin
        .from("psylattice_billing_transactions")
        .select(
          "id, source, description, status, amount_paise, currency, razorpay_subscription_id, razorpay_invoice_id, razorpay_payment_id, paid_at, created_at",
        )
        .eq("user_id", userId)
        .order("paid_at", { ascending: false, nullsFirst: false })
        .limit(50),
    ]);

    if (transactionResult.error) throw transactionResult.error;

    return NextResponse.json(
      {
        ok: true,
        local,
        transactions: transactionResult.data || [],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin subscription snapshot failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json(
      { ok: false, error: safe.message },
      { status: safe.status },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await requireAdmin();
    const { userId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "");
    const reason = safeReason(body.reason);

    if (!["sync", "cancel_cycle_end", "cancel_now"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Choose a supported subscription action." },
        { status: 400 },
      );
    }

    if (action !== "sync" && reason.length < 4) {
      return NextResponse.json(
        {
          ok: false,
          error: "Add a short cancellation reason for the audit log.",
        },
        { status: 400 },
      );
    }

    if (action === "cancel_now") {
      await requireSuperAdmin();
    }

    const before = await accountForUser(userId);
    if (!before?.razorpay_subscription_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "This account has no Razorpay subscription to manage.",
        },
        { status: 409 },
      );
    }

    if (action === "sync") {
      const snapshot = await providerSnapshot(userId);

      await writeAdminAudit({
        actorUserId: session.userId,
        actorRole: session.role,
        action: "sync_razorpay_subscription",
        targetUserId: userId,
        targetResourceType: "subscription",
        targetResourceId: before.razorpay_subscription_id,
        beforeState: before,
        afterState: snapshot.local,
        reason: "Manual support reconciliation with Razorpay.",
      });

      return NextResponse.json(
        { ok: true, action, ...snapshot },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const cancelAtCycleEnd = action === "cancel_cycle_end";
    const provider = await razorpayRequest<RazorpaySubscription>(
      `/subscriptions/${encodeURIComponent(
        before.razorpay_subscription_id,
      )}/cancel`,
      {
        method: "POST",
        body: { cancel_at_cycle_end: cancelAtCycleEnd },
      },
    );

    const admin = billingAdmin();
    const now = new Date().toISOString();
    const providerCurrentEnd = epochToIso(provider.current_end);

    const { error: updateError } = await admin
      .from("research_billing_accounts")
      .update({
        plan_status: cancelAtCycleEnd
          ? provider.status || before.plan_status
          : "cancelled",
        cancel_at_period_end: cancelAtCycleEnd,
        current_period_start:
          epochToIso(provider.current_start) || before.current_period_start,
        current_period_end: cancelAtCycleEnd
          ? providerCurrentEnd || before.current_period_end
          : now,
        billing_access_until: cancelAtCycleEnd
          ? before.billing_access_until ||
            providerCurrentEnd ||
            before.current_period_end
          : now,
        subscription_cancelled_at: cancelAtCycleEnd ? null : now,
        last_provider_event: cancelAtCycleEnd
          ? "admin.subscription.cancel_cycle_end"
          : "admin.subscription.cancel_now",
        last_provider_event_at: now,
        provider_last_synced_at: now,
        updated_at: now,
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    const after = await accountForUser(userId);

    await writeAdminAudit({
      actorUserId: session.userId,
      actorRole: session.role,
      action: cancelAtCycleEnd
        ? "cancel_subscription_at_cycle_end"
        : "cancel_subscription_immediately",
      targetUserId: userId,
      targetResourceType: "subscription",
      targetResourceId: before.razorpay_subscription_id,
      beforeState: before,
      afterState: after,
      reason,
    });

    return NextResponse.json(
      {
        ok: true,
        action,
        local: after,
        provider: {
          id: provider.id,
          status: provider.status,
          currentStart: epochToIso(provider.current_start),
          currentEnd: epochToIso(provider.current_end),
        },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin subscription action failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json(
      { ok: false, error: safe.message },
      { status: safe.status },
    );
  }
}
