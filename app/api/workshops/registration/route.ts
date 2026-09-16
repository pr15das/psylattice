import { NextRequest, NextResponse } from "next/server";
import { authenticatedBillingUser, billingAdmin } from "@/lib/billing/server";
import {
  WORKSHOP_SLUG,
  type WorkshopRegistrationRecord,
} from "@/lib/workshops/registration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  "workshop_reference",
  "payment_verified_at",
  "completed_at",
  "certificate_issued_at",
].join(",");

function requiredText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") throw new Error(`${label} is required.`);
  const text = value.trim();
  if (!text) throw new Error(`${label} is required.`);
  if (text.length > maxLength) throw new Error(`${label} is too long.`);
  return text;
}

function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function validEmail(value: unknown) {
  const email = requiredText(value, "Email ID", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  return email;
}

function validPhone(value: unknown) {
  const phone = requiredText(value, "Contact number", 32);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    throw new Error("Enter a valid contact number.");
  }
  return phone;
}

function validAge(value: unknown) {
  const age = Number(value);
  if (!Number.isInteger(age) || age < 13 || age > 120) {
    throw new Error("Enter a valid age between 13 and 120.");
  }
  return age;
}

async function assertAccountCanRegister(userId: string) {
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("psylattice_account_access")
    .select("status, suspended_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  if (data.status === "banned" || data.status === "deleting") {
    const restriction = new Error("This PsyLattice account cannot register for workshops.");
    (restriction as Error & { status?: number }).status = 403;
    throw restriction;
  }

  if (data.status === "suspended") {
    const until = data.suspended_until ? new Date(data.suspended_until).getTime() : Number.POSITIVE_INFINITY;
    if (until > Date.now()) {
      const restriction = new Error("This PsyLattice account cannot register for workshops while suspended.");
      (restriction as Error & { status?: number }).status = 403;
      throw restriction;
    }
  }
}

async function loadWorkshopContext(userId: string) {
  const admin = billingAdmin();
  const nowIso = new Date().toISOString();

  const { data: workshop, error: workshopError } = await admin
    .from("psylattice_workshops")
    .select("id, slug, title, cohort_label, possible_start_date, registration_opens_at, registration_closes_at, is_published")
    .eq("slug", WORKSHOP_SLUG)
    .eq("is_published", true)
    .maybeSingle();

  if (workshopError) throw workshopError;
  if (!workshop) {
    const error = new Error("Workshop registration is not available yet.");
    (error as Error & { status?: number }).status = 404;
    throw error;
  }

  const { data: pricing, error: pricingError } = await admin
    .from("psylattice_workshop_pricing_windows")
    .select("id, label, amount_paise, starts_at, ends_at")
    .eq("workshop_id", workshop.id)
    .lte("starts_at", nowIso)
    .gt("ends_at", nowIso)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pricingError) throw pricingError;

  const { data: registration, error: registrationError } = await admin
    .from("psylattice_workshop_registrations")
    .select(REGISTRATION_SELECT)
    .eq("workshop_id", workshop.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (registrationError) throw registrationError;

  return {
    workshop,
    pricing,
    registration: (registration || null) as WorkshopRegistrationRecord | null,
  };
}

function jsonError(error: unknown) {
  const status =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status?: number }).status || 500)
      : error instanceof Error && /required|valid|too long/i.test(error.message)
        ? 400
        : 500;

  const safeMessage =
    status >= 500
      ? "PsyLattice could not load workshop registration right now."
      : error instanceof Error
        ? error.message
        : "PsyLattice could not complete workshop registration.";

  return NextResponse.json(
    { ok: false, error: safeMessage },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in to register for the workshop." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    await assertAccountCanRegister(user.id);
    const context = await loadWorkshopContext(user.id);

    return NextResponse.json(
      {
        ok: true,
        account: {
          email: user.email || "",
          full_name:
            typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : "",
        },
        workshop: {
          id: context.workshop.id,
          slug: context.workshop.slug,
          title: context.workshop.title,
          cohort_label: context.workshop.cohort_label,
          possible_start_date: context.workshop.possible_start_date,
          registration_closes_at: context.workshop.registration_closes_at,
        },
        pricing: context.pricing,
        registration: context.registration,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Workshop registration context failed:", error);
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in to register for the workshop." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    await assertAccountCanRegister(user.id);
    const context = await loadWorkshopContext(user.id);

    if (context.registration?.status === "paid" || context.registration?.status === "completed") {
      return NextResponse.json(
        {
          ok: true,
          already_registered: true,
          registration: context.registration,
          pricing: context.pricing,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (context.registration?.status === "refunded") {
      return NextResponse.json(
        { ok: false, error: "This workshop registration was refunded. Contact PsyLattice if you want to register again." },
        { status: 409, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (!context.pricing) {
      return NextResponse.json(
        { ok: false, error: "Workshop registration is currently closed." },
        { status: 409, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const profile = {
      full_name: requiredText(body.full_name, "Full name", 120),
      age: validAge(body.age),
      contact_email: validEmail(body.contact_email),
      contact_number: validPhone(body.contact_number),
      current_city: requiredText(body.current_city, "Current city / town", 120),
      state_region: requiredText(body.state_region, "State / region", 120),
      country: requiredText(body.country, "Country", 120),
      institution_name: requiredText(body.institution_name, "Current institution / organization", 180),
      educational_qualification: requiredText(body.educational_qualification, "Educational qualification", 180),
      current_programme_course: requiredText(body.current_programme_course, "Current programme / course", 180),
      year_semester: optionalText(body.year_semester, 120),
    };

    const admin = billingAdmin();
    const registrationPatch = {
      workshop_id: context.workshop.id,
      user_id: user.id,
      pricing_window_id: context.pricing.id,
      quoted_amount_paise: context.pricing.amount_paise,
      currency: "INR",
      status: "pending_payment",
      ...profile,
    };

    let registration: WorkshopRegistrationRecord | null = null;

    if (context.registration) {
      const { data, error } = await admin
        .from("psylattice_workshop_registrations")
        .update(registrationPatch)
        .eq("id", context.registration.id)
        .eq("user_id", user.id)
        .select(REGISTRATION_SELECT)
        .single();

      if (error) throw error;
      registration = data as WorkshopRegistrationRecord;
    } else {
      const { data, error } = await admin
        .from("psylattice_workshop_registrations")
        .insert(registrationPatch)
        .select(REGISTRATION_SELECT)
        .single();

      if (error) throw error;
      registration = data as WorkshopRegistrationRecord;
    }

    return NextResponse.json(
      {
        ok: true,
        registration,
        pricing: context.pricing,
        message: "Registration details saved. Payment verification is required before your place is confirmed.",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Workshop registration save failed:", error);
    return jsonError(error);
  }
}
