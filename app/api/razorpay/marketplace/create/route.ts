import { NextRequest, NextResponse } from "next/server";
import {
  MARKETPLACE_PRODUCTS,
  isMarketplaceProductId,
  isRecurringPlan,
  type MarketplaceProductId,
} from "@/lib/razorpay/marketplace";
import {
  authenticatedBillingUser,
  billingAdmin,
  getRazorpayCredentials,
  loadBillingSnapshot,
  razorpayRequest,
  studyHasPass,
  userOwnsStudy,
} from "@/lib/razorpay/marketplaceServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_CART_QUANTITY = 20;
const MAX_TOTAL_PAISE = 10_000_000; // ₹1,00,000 safety ceiling for self-service checkout.

type ClientLine = {
  productId?: unknown;
  quantity?: unknown;
};

type CanonicalLine = {
  productId: MarketplaceProductId;
  name: string;
  category: string;
  quantity: number;
  unitAmountPaise: number;
  lineAmountPaise: number;
};

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

type RazorpaySubscription = {
  id: string;
  plan_id: string;
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

function normalizeCart(rawLines: unknown): CanonicalLine[] {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new Error("Your cart is empty.");
  }
  if (rawLines.length > 20) {
    throw new Error("This cart has too many separate items.");
  }

  const quantities = new Map<MarketplaceProductId, number>();

  for (const raw of rawLines as ClientLine[]) {
    if (!raw || typeof raw !== "object" || !isMarketplaceProductId(raw.productId)) {
      throw new Error("Your cart contains an unsupported marketplace item.");
    }

    const quantity = Number(raw.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
      throw new Error("A cart quantity is invalid.");
    }

    const product = MARKETPLACE_PRODUCTS[raw.productId];
    const normalizedQuantity = product.category === "plan" ? 1 : quantity;
    quantities.set(product.id, (quantities.get(product.id) || 0) + normalizedQuantity);
  }

  const lines = Array.from(quantities.entries()).map(([productId, quantity]) => {
    const product = MARKETPLACE_PRODUCTS[productId];
    const finalQuantity = product.category === "plan" ? 1 : Math.min(quantity, MAX_CART_QUANTITY);
    return {
      productId,
      name: product.name,
      category: product.category,
      quantity: finalQuantity,
      unitAmountPaise: product.amountPaise,
      lineAmountPaise: product.amountPaise * finalQuantity,
    } satisfies CanonicalLine;
  });

  const planLines = lines.filter((line) => line.category === "plan");
  if (planLines.length > 1) {
    throw new Error("Choose only one PsyLattice plan per checkout.");
  }

  const total = lines.reduce((sum, line) => sum + line.lineAmountPaise, 0);
  if (total <= 0 || total > MAX_TOTAL_PAISE) {
    throw new Error("This cart total is outside the supported self-service checkout range.");
  }

  return lines;
}

export async function POST(request: NextRequest) {
  let purchaseId: string | null = null;
  let failureAdmin: ReturnType<typeof billingAdmin> | null = null;

  try {
    const admin = billingAdmin();
    failureAdmin = admin;
    const user = await authenticatedBillingUser();
    if (!user) return jsonError("Please sign in again.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const lines = normalizeCart(body.items);
    const studyId = typeof body.studyId === "string" ? body.studyId.trim() : "";

    const planLine = lines.find((line) => line.category === "plan") || null;
    const selectedPlanId = planLine?.productId || null;
    const recurringPlanId =
      selectedPlanId && isRecurringPlan(selectedPlanId) ? selectedPlanId : null;
    const buyingStudyPass = selectedPlanId === "study-pass";
    const hasParticipantExpansion = lines.some((line) => line.category === "participants");
    const hasStorage = lines.some((line) => line.category === "storage");
    const hasPaidAddon = lines.some(
      (line) => line.category === "ai" || line.category === "participants" || line.category === "email",
    );

    const requiresStudy = buyingStudyPass || hasParticipantExpansion;
    let ownedStudy: { id: string; title?: string | null; status?: string | null } | null = null;

    if (requiresStudy) {
      if (!studyId) return jsonError("Choose the study this purchase should apply to.");
      ownedStudy = await userOwnsStudy(user.id, studyId);
      if (!ownedStudy) return jsonError("The selected study is not available in your workspace.", 403);
    }

    const snapshot = await loadBillingSnapshot(user.id);

    // Prevent accidental double subscriptions. Existing Pro customers should use
    // subscription management for a billing-cycle change rather than starting a second subscription.
    if (recurringPlanId && snapshot.hasPro) {
      return jsonError(
        "You already have an active Researcher Pro subscription. Manage the existing subscription before starting another billing cycle.",
        409,
      );
    }

    if (buyingStudyPass && snapshot.hasPro) {
      return jsonError("Study Pass is already included while Researcher Pro is active.", 409);
    }

    if (buyingStudyPass && studyId && (await studyHasPass(user.id, studyId))) {
      return jsonError("This study already has an active Study Pass.", 409);
    }

    const selectedIsPro = recurringPlanId === "pro-monthly" || recurringPlanId === "pro-annual";
    const selectedIsPaid = selectedIsPro || buyingStudyPass;
    const hasAnyPaidAccess = snapshot.hasPro || snapshot.hasStudyPass || selectedIsPaid;
    const hasProAccess = snapshot.hasPro || selectedIsPro;

    if (hasPaidAddon && !hasAnyPaidAccess) {
      return jsonError("Add Study Pass or Researcher Pro before purchasing these add-ons.", 409);
    }

    if (hasStorage && !hasProAccess) {
      return jsonError("Media storage expansions require Researcher Pro Monthly or Pro Annual.", 409);
    }

    if (hasParticipantExpansion && studyId && !snapshot.hasPro && !buyingStudyPass) {
      const targetHasPass = await studyHasPass(user.id, studyId);
      if (!targetHasPass) {
        return jsonError("Participant expansion requires Study Pass on that study or an active Researcher Pro subscription.", 409);
      }
    }

    const amountPaise = lines.reduce((sum, line) => sum + line.lineAmountPaise, 0);
    const checkoutKind = recurringPlanId ? "subscription" : "order";

    const { data: purchase, error: purchaseError } = await admin
      .from("research_billing_purchases")
      .insert({
        user_id: user.id,
        checkout_kind: checkoutKind,
        status: "creating",
        amount_paise: amountPaise,
        currency: "INR",
        cart: lines,
        study_id: studyId || null,
      })
      .select("id")
      .single();

    if (purchaseError || !purchase) throw purchaseError || new Error("Purchase record could not be created.");
    purchaseId = purchase.id;

    const { keyId } = getRazorpayCredentials();
    const receipt = `psy_${purchase.id.replace(/-/g, "").slice(0, 28)}`;

    if (!recurringPlanId) {
      const order = await razorpayRequest<RazorpayOrder>("/orders", {
        method: "POST",
        body: {
          amount: amountPaise,
          currency: "INR",
          receipt,
          partial_payment: false,
          notes: {
            psylattice_purchase_id: purchase.id,
            psylattice_user_id: user.id,
            ...(studyId ? { psylattice_study_id: studyId } : {}),
          },
        },
      });

      const { error: updateError } = await admin
        .from("research_billing_purchases")
        .update({
          status: "created",
          razorpay_order_id: order.id,
          provider_state: order.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchase.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return NextResponse.json(
        {
          ok: true,
          kind: "order",
          purchaseId: purchase.id,
          keyId,
          orderId: order.id,
          amountPaise,
          currency: "INR",
          description: ownedStudy
            ? `PsyLattice marketplace · ${ownedStudy.title || "research study"}`
            : "PsyLattice marketplace purchase",
          prefill: { email: user.email || "" },
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const recurringProduct = MARKETPLACE_PRODUCTS[recurringPlanId];
    const planEnvName = recurringProduct.razorpayPlanEnv!;
    const providerPlanId = process.env[planEnvName];
    if (!providerPlanId) {
      throw new Error(`${planEnvName} is not configured.`);
    }

    const addonLines = lines.filter((line) => line.productId !== recurringPlanId);
    const addons = addonLines.map((line) => ({
      item: {
        name: line.quantity > 1 ? `${line.name} × ${line.quantity}` : line.name,
        amount: line.lineAmountPaise,
        currency: "INR",
      },
    }));

    const defaultTotalCount = recurringPlanId === "pro-monthly" ? 120 : 10;
    const configuredTotalCount = Number(
      process.env[
        recurringPlanId === "pro-monthly"
          ? "RAZORPAY_PRO_MONTHLY_TOTAL_COUNT"
          : "RAZORPAY_PRO_ANNUAL_TOTAL_COUNT"
      ] || defaultTotalCount,
    );

    const subscription = await razorpayRequest<RazorpaySubscription>("/subscriptions", {
      method: "POST",
      body: {
        plan_id: providerPlanId,
        total_count:
          Number.isInteger(configuredTotalCount) && configuredTotalCount > 0
            ? configuredTotalCount
            : defaultTotalCount,
        quantity: 1,
        customer_notify: true,
        ...(addons.length ? { addons } : {}),
        notes: {
          psylattice_purchase_id: purchase.id,
          psylattice_user_id: user.id,
        },
      },
    });

    const { error: updateError } = await admin
      .from("research_billing_purchases")
      .update({
        status: "created",
        razorpay_subscription_id: subscription.id,
        provider_state: subscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchase.id)
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json(
      {
        ok: true,
        kind: "subscription",
        purchaseId: purchase.id,
        keyId,
        subscriptionId: subscription.id,
        amountPaise,
        renewalAmountPaise: recurringProduct.amountPaise,
        renewalCadence: recurringProduct.recurring,
        currency: "INR",
        description: `PsyLattice ${recurringProduct.name}`,
        prefill: { email: user.email || "" },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Marketplace checkout creation failed:", error);

    if (purchaseId && failureAdmin) {
      await failureAdmin
        .from("research_billing_purchases")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);
    }

    const message =
      error instanceof Error ? error.message : "Unknown checkout error.";

    return jsonError(
      process.env.NODE_ENV === "development"
        ? message
        : "PsyLattice could not prepare Razorpay checkout right now.",
      500,
    );
  }
}
