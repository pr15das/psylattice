import { NextResponse, type NextRequest } from "next/server";
import {
  authenticatedBillingUser,
  billingAdmin,
  getRazorpayCredentials,
  razorpayRequest,
  verifyHexHmac,
} from "@/lib/razorpay/marketplaceServer";
import type { WorkshopRegistrationRecord } from "@/lib/workshops/registration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

const REGISTRATION_SELECT = [
  "id",
  "status",
  "quoted_amount_paise",
  "currency",
  "full_name",
  "age",
  "contact_email",
  "contact_number",
  "current_city",
  "state_region",
  "country",
  "institution_name",
  "educational_qualification",
  "current_programme_course",
  "year_semester",
  "razorpay_order_id",
  "razorpay_payment_id",
  "workshop_reference",
  "payment_verified_at",
  "whatsapp_access_granted_at",
  "completed_at",
  "certificate_issued_at",
].join(",");

type RazorpayPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  order_id?: string | null;
};

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: NO_STORE_HEADERS },
  );
}

function whatsappInviteUrl() {
  const raw = process.env.WORKSHOP_WHATSAPP_INVITE_URL?.trim() || "";
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) return jsonError("Sign in again before verifying payment.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const registrationId = typeof body.registrationId === "string" ? body.registrationId.trim() : "";
    const returnedOrderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
    const suppliedSignature = typeof body.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";

    if (!registrationId || !returnedOrderId || !paymentId || !suppliedSignature) {
      return jsonError("The Razorpay payment response is incomplete.");
    }

    const admin = billingAdmin();
    const { data: registrationData, error: registrationError } = await admin
      .from("psylattice_workshop_registrations")
      .select("id, user_id, status, quoted_amount_paise, currency, razorpay_order_id, razorpay_payment_id, workshop_reference")
      .eq("id", registrationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (registrationError) throw registrationError;
    if (!registrationData) return jsonError("This workshop checkout could not be found.", 404);

    const registration = registrationData as unknown as {
      id: string;
      user_id: string;
      status: string;
      quoted_amount_paise: number;
      currency: string;
      razorpay_order_id: string | null;
      razorpay_payment_id: string | null;
      workshop_reference: string | null;
    };

    if (registration.status === "paid" || registration.status === "completed") {
      const { data: fullData, error: fullError } = await admin
        .from("psylattice_workshop_registrations")
        .select(REGISTRATION_SELECT)
        .eq("id", registration.id)
        .eq("user_id", user.id)
        .single();
      if (fullError) throw fullError;

      return NextResponse.json(
        {
          ok: true,
          paid: true,
          registration: fullData as unknown as WorkshopRegistrationRecord,
          private_access: { whatsapp_invite_url: whatsappInviteUrl() },
          message: "Your workshop payment is already verified.",
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    if (!registration.razorpay_order_id || returnedOrderId !== registration.razorpay_order_id) {
      return jsonError("The Razorpay order does not match this workshop registration.");
    }

    const { keySecret } = getRazorpayCredentials();
    const signatureValid = verifyHexHmac(
      `${registration.razorpay_order_id}|${paymentId}`,
      suppliedSignature,
      keySecret,
    );

    if (!signatureValid) return jsonError("Payment signature verification failed.");

    let payment = await razorpayRequest<RazorpayPayment>(
      `/payments/${encodeURIComponent(paymentId)}`,
    );

    if (
      payment.currency !== "INR" ||
      Number(payment.amount) !== Number(registration.quoted_amount_paise) ||
      payment.order_id !== registration.razorpay_order_id
    ) {
      return jsonError("The Razorpay payment does not match this workshop checkout.");
    }

    if (payment.status === "authorized") {
      payment = await razorpayRequest<RazorpayPayment>(
        `/payments/${encodeURIComponent(paymentId)}/capture`,
        {
          method: "POST",
          body: {
            amount: registration.quoted_amount_paise,
            currency: "INR",
          },
        },
      );
    }

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          ok: true,
          paid: false,
          processing: true,
          message: "Your payment is verified but still processing. Refresh this page after Razorpay confirms capture.",
        },
        { status: 202, headers: NO_STORE_HEADERS },
      );
    }

    const paidAt = new Date().toISOString();

    const { data: updatedData, error: updateError } = await admin
      .from("psylattice_workshop_registrations")
      .update({
        status: "paid",
        razorpay_payment_id: payment.id,
        payment_verified_at: paidAt,
        whatsapp_access_granted_at: paidAt,
        updated_at: paidAt,
      })
      .eq("id", registration.id)
      .eq("user_id", user.id)
      .eq("razorpay_order_id", registration.razorpay_order_id)
      .select(REGISTRATION_SELECT)
      .single();

    if (updateError) throw updateError;

    const updated = updatedData as unknown as WorkshopRegistrationRecord;

    return NextResponse.json(
      {
        ok: true,
        paid: true,
        registration: updated,
        private_access: { whatsapp_invite_url: whatsappInviteUrl() },
        message: "Payment verified. Your workshop registration is confirmed.",
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("Workshop payment verification failed:", error);
    return jsonError(
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "PsyLattice could not verify this workshop payment right now.",
      500,
    );
  }
}
