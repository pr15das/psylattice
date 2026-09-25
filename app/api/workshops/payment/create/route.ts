import { NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
  getRazorpayCredentials,
  razorpayRequest,
} from "@/lib/razorpay/marketplaceServer";
import { WORKSHOP_SLUG } from "@/lib/workshops/registration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: NO_STORE_HEADERS },
  );
}

export async function POST() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) return jsonError("Sign in again before continuing to payment.", 401);

    const admin = billingAdmin();
    const nowIso = new Date().toISOString();

    const { data: workshop, error: workshopError } = await admin
      .from("psylattice_workshops")
      .select("id, slug, title, is_published")
      .eq("slug", WORKSHOP_SLUG)
      .eq("is_published", true)
      .maybeSingle();

    if (workshopError) throw workshopError;
    if (!workshop) return jsonError("Workshop registration is not available.", 404);

    const { data: registrationData, error: registrationError } = await admin
      .from("psylattice_workshop_registrations")
      .select("id, user_id, status, full_name, contact_email, contact_number, quoted_amount_paise, currency, workshop_reference, razorpay_payment_id")
      .eq("workshop_id", workshop.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (registrationError) throw registrationError;
    if (!registrationData) {
      return jsonError("Save your workshop registration details before paying.", 409);
    }

    const registration = registrationData as unknown as {
      id: string;
      user_id: string;
      status: string;
      full_name: string;
      contact_email: string;
      contact_number: string;
      quoted_amount_paise: number;
      currency: string;
      workshop_reference: string | null;
      razorpay_payment_id: string | null;
    };

    if (registration.status === "paid" || registration.status === "completed") {
      return NextResponse.json(
        {
          ok: true,
          alreadyPaid: true,
          workshopReference: registration.workshop_reference,
          paymentId: registration.razorpay_payment_id,
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    if (registration.status === "refunded") {
      return jsonError("This workshop registration was refunded. Contact PsyLattice before attempting another payment.", 409);
    }

    const { data: pricingData, error: pricingError } = await admin
      .from("psylattice_workshop_pricing_windows")
      .select("id, label, amount_paise, starts_at, ends_at")
      .eq("workshop_id", workshop.id)
      .lte("starts_at", nowIso)
      .gt("ends_at", nowIso)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pricingError) throw pricingError;
    if (!pricingData) return jsonError("Workshop registration is currently closed.", 409);

    const pricing = pricingData as unknown as {
      id: string;
      label: string;
      amount_paise: number;
      starts_at: string;
      ends_at: string;
    };

    const { keyId } = getRazorpayCredentials();
    const receipt = `psy_ws_${registration.id.replace(/-/g, "").slice(0, 26)}`;

    const order = await razorpayRequest<RazorpayOrder>("/orders", {
      method: "POST",
      body: {
        amount: pricing.amount_paise,
        currency: "INR",
        receipt,
        partial_payment: false,
        notes: {
          psylattice_kind: "workshop_registration",
          psylattice_workshop_registration_id: registration.id,
          psylattice_workshop_id: workshop.id,
          psylattice_user_id: user.id,
          psylattice_workshop_slug: WORKSHOP_SLUG,
        },
      },
    });

    if (!order?.id || Number(order.amount) !== Number(pricing.amount_paise)) {
      throw new Error("Razorpay returned an invalid workshop order.");
    }

    const { error: updateError } = await admin
      .from("psylattice_workshop_registrations")
      .update({
        pricing_window_id: pricing.id,
        quoted_amount_paise: pricing.amount_paise,
        currency: "INR",
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registration.id)
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json(
      {
        ok: true,
        alreadyPaid: false,
        registrationId: registration.id,
        keyId,
        orderId: order.id,
        amountPaise: pricing.amount_paise,
        currency: "INR",
        description: workshop.title,
        pricingLabel: pricing.label,
        prefill: {
          name: registration.full_name,
          email: registration.contact_email || user.email || "",
          contact: registration.contact_number,
        },
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("Workshop Razorpay order creation failed:", error);
    return jsonError(
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "PsyLattice could not prepare workshop payment right now.",
      500,
    );
  }
}
