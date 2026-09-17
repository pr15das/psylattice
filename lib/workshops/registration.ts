export const WORKSHOP_SLUG = "foundations-modern-psychological-research-2026";
export const WORKSHOP_TITLE = "Foundations of Modern Psychological Research with PsyLattice";

export type WorkshopRegistrationStatus =
  | "pending_payment"
  | "paid"
  | "completed"
  | "cancelled"
  | "refunded";

export type WorkshopRegistrationRecord = {
  id: string;
  status: WorkshopRegistrationStatus;
  quoted_amount_paise: number;
  currency: string;
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
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  workshop_reference: string | null;
  payment_verified_at: string | null;
  whatsapp_access_granted_at: string | null;
  completed_at: string | null;
  certificate_issued_at: string | null;
};

export type WorkshopPrivateAccess = {
  whatsapp_invite_url: string | null;
};

export type WorkshopRegistrationContext = {
  workshop: {
    id: string;
    slug: string;
    title: string;
    cohort_label: string;
    possible_start_date: string | null;
    registration_closes_at: string;
  };
  pricing: {
    id: string;
    label: string;
    amount_paise: number;
    starts_at: string;
    ends_at: string;
  } | null;
  registration: WorkshopRegistrationRecord | null;
  private_access?: WorkshopPrivateAccess | null;
};

export function formatWorkshopAmount(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountPaise / 100);
}

export function safeInternalNextPath(
  value: string | null | undefined,
  fallback = "/workspace",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
