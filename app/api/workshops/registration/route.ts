import { NextResponse, type NextRequest } from "next/server";
import { authenticatedBillingUser, billingAdmin } from "@/lib/billing/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  WORKSHOP_SLUG,
  type WorkshopPrivateAccess,
  type WorkshopRegistrationContext,
  type WorkshopRegistrationRecord,
} from "@/lib/workshops/registration";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

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

type ApiError = Error & { status?: number };

type RegistrationInput = {
  full_name: string;
  age: number;
  contact_email: string;
  contact_number: string;
  current_city: string;
  state_region: string;
  country: string;
  institution_name: string;
  educational_qualification: string;
  current_programme_course: string;
  year_semester: string | null;
};

function fail(message: string, status: number): never {
  const error = new Error(message) as ApiError;
  error.status = status;
  throw error;
}

function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") return fail(`${label} is required.`, 400);
  const text = value.trim();
  if (!text) return fail(`${label} is required.`, 400);
  if (text.length > maxLength) return fail(`${label} is too long.`, 400);
  return text;
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

function validEmail(value: unknown): string {
  const email = requiredText(value, "Email ID", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Enter a valid email address.", 400);
  }
  return email;
}

function validPhone(value: unknown): string {
  const phone = requiredText(value, "Contact number", 32);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return fail("Enter a valid contact number.", 400);
  }
  return phone;
}

function validAge(value: unknown): number {
  const age = Number(value);
  if (!Number.isInteger(age) || age < 13 || age > 120) {
    return fail("Enter a valid age between 13 and 120.", 400);
  }
  return age;
}

function validateRegistrationInput(body: Record<string, unknown>): RegistrationInput {
  return {
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
}

function privateAccessFor(
  registration: WorkshopRegistrationRecord | null,
): WorkshopPrivateAccess | null {
  if (!registration || !["paid", "completed"].includes(registration.status)) return null;

  const invite = process.env.WORKSHOP_WHATSAPP_INVITE_URL?.trim() || "";
  if (!invite) return { whatsapp_invite_url: null };

  try {
    const parsed = new URL(invite);
    return {
      whatsapp_invite_url: parsed.protocol === "https:" ? parsed.toString() : null,
    };
  } catch {
    return { whatsapp_invite_url: null };
  }
}

async function assertAccountCanRegister(userId: string) {
  // Use the signed-in server client here rather than the service-role client.
  // The account-access table intentionally allows a user to read their own row,
  // and this keeps the registration landing flow independent of admin credentials.
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("psylattice_account_access")
    .select("status, suspended_until")
    .eq("user_id", userId)
    .maybeSingle();

  // Older/local databases can briefly be out of sync while workshop migrations
  // are being applied. A missing moderation row/table must not turn the public
  // registration page into a generic 500; the database RLS gate remains the
  // authoritative workspace restriction layer.
  if (error) {
    const code = String((error as { code?: string }).code || "");
    if (code === "42P01" || code === "PGRST205" || code === "PGRST204") return;
    throw error;
  }
  if (!data) return;

  if (data.status === "banned" || data.status === "deleting") {
    fail("This PsyLattice account cannot register for workshops.", 403);
  }

  if (data.status === "suspended") {
    const suspensionEnds = data.suspended_until
      ? new Date(data.suspended_until).getTime()
      : Number.POSITIVE_INFINITY;
    if (suspensionEnds > Date.now()) {
      fail("This PsyLattice account cannot register for workshops while suspended.", 403);
    }
  }
}

async function loadWorkshopContext(userId: string): Promise<WorkshopRegistrationContext> {
  // GET/context reads use the authenticated server client. All payment and
  // registration mutations still use the service role below/server-side only.
  const admin = await createServerSupabase();
  const nowIso = new Date().toISOString();

  const { data: workshop, error: workshopError } = await admin
    .from("psylattice_workshops")
    .select("id, slug, title, cohort_label, possible_start_date, registration_opens_at, registration_closes_at, is_published")
    .eq("slug", WORKSHOP_SLUG)
    .eq("is_published", true)
    .maybeSingle();

  if (workshopError) throw workshopError;
  if (!workshop) fail("Workshop registration is not available yet.", 404);

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

  const registrationRecord = (registration || null) as unknown as WorkshopRegistrationRecord | null;

  return {
    workshop: {
      id: workshop.id,
      slug: workshop.slug,
      title: workshop.title,
      cohort_label: workshop.cohort_label,
      possible_start_date: workshop.possible_start_date,
      registration_closes_at: workshop.registration_closes_at,
    },
    pricing: pricing
      ? {
          id: pricing.id,
          label: pricing.label,
          amount_paise: pricing.amount_paise,
          starts_at: pricing.starts_at,
          ends_at: pricing.ends_at,
        }
      : null,
    registration: registrationRecord,
    private_access: privateAccessFor(registrationRecord),
  };
}

function jsonError(error: unknown) {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    Number.isFinite(Number((error as ApiError).status))
      ? Number((error as ApiError).status)
      : 500;

  const safeMessage =
    status >= 500
      ? "PsyLattice could not complete workshop registration right now."
      : error instanceof Error
        ? error.message
        : "PsyLattice could not complete workshop registration.";

  if (status >= 500) {
    const detail =
      error && typeof error === "object"
        ? {
            name: "name" in error ? String((error as { name?: unknown }).name || "") : "",
            message: "message" in error ? String((error as { message?: unknown }).message || "") : "",
            code: "code" in error ? String((error as { code?: unknown }).code || "") : "",
            details: "details" in error ? String((error as { details?: unknown }).details || "") : "",
            hint: "hint" in error ? String((error as { hint?: unknown }).hint || "") : "",
          }
        : error;
    console.error("Workshop registration API failed:", detail);
  }

  return NextResponse.json(
    { ok: false, error: safeMessage },
    { status, headers: NO_STORE_HEADERS },
  );
}

export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in to register for the workshop." },
        { status: 401, headers: NO_STORE_HEADERS },
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
              ? user.user_metadata.full_name.trim()
              : "",
        },
        ...context,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Sign in to register for the workshop." },
        { status: 401, headers: NO_STORE_HEADERS },
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
          private_access: context.private_access || null,
          message: "Your workshop registration is already confirmed.",
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    if (context.registration?.status === "refunded") {
      fail("This workshop registration was refunded. Contact PsyLattice if you want to register again.", 409);
    }

    if (!context.pricing) fail("Workshop registration is currently closed.", 409);

    const body = (await request.json()) as Record<string, unknown>;
    const profile = validateRegistrationInput(body);
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

    let registration: WorkshopRegistrationRecord;

    if (context.registration) {
      const { data, error } = await admin
        .from("psylattice_workshop_registrations")
        .update(registrationPatch)
        .eq("id", context.registration.id)
        .eq("user_id", user.id)
        .select(REGISTRATION_SELECT)
        .single();

      if (error) throw error;
      registration = data as unknown as WorkshopRegistrationRecord;
    } else {
      const { data, error } = await admin
        .from("psylattice_workshop_registrations")
        .insert(registrationPatch)
        .select(REGISTRATION_SELECT)
        .single();

      if (error) throw error;
      registration = data as unknown as WorkshopRegistrationRecord;
    }

    return NextResponse.json(
      {
        ok: true,
        registration,
        pricing: context.pricing,
        private_access: null,
        message: "Registration details saved. Your place is confirmed only after verified payment.",
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return jsonError(error);
  }
}
