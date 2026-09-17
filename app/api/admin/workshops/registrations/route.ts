import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


type WorkshopRegistrationAdminRow = {
  id: string;
  workshop_id: string;
  user_id: string;
  status: string;
  full_name: string;
  contact_email: string;
  contact_number: string;
  institution_name: string;
  educational_qualification: string;
  current_programme_course: string;
  year_semester: string | null;
  current_city: string;
  state_region: string;
  country: string;
  quoted_amount_paise: number;
  currency: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_verified_at: string | null;
  workshop_reference: string | null;
  whatsapp_access_granted_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  certificate_issued_at: string | null;
  created_at: string;
  updated_at: string;
};

type WorkshopRegistrationWithWorkshop = WorkshopRegistrationAdminRow & {
  workshop: { title: string; cohort_label: string } | null;
};

const ALLOWED_STATUS = new Set([
  "all",
  "pending_payment",
  "paid",
  "completed",
  "cancelled",
  "refunded",
]);

function safeSearch(value: string) {
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ").slice(0, 160);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const admin = billingAdmin();

    const status = String(request.nextUrl.searchParams.get("status") || "all");
    if (!ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { ok: false, error: "Choose a supported workshop status filter." },
        { status: 400 },
      );
    }

    const search = safeSearch(String(request.nextUrl.searchParams.get("q") || ""));
    const limit = Math.min(300, Math.max(20, Number(request.nextUrl.searchParams.get("limit") || 200)));

    let query = admin
      .from("psylattice_workshop_registrations")
      .select(
        [
          "id",
          "workshop_id",
          "user_id",
          "status",
          "full_name",
          "contact_email",
          "contact_number",
          "institution_name",
          "educational_qualification",
          "current_programme_course",
          "year_semester",
          "current_city",
          "state_region",
          "country",
          "quoted_amount_paise",
          "currency",
          "razorpay_order_id",
          "razorpay_payment_id",
          "payment_verified_at",
          "workshop_reference",
          "whatsapp_access_granted_at",
          "completed_at",
          "completed_by",
          "certificate_issued_at",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") query = query.eq("status", status);

    if (search) {
      const pattern = `%${search}%`;
      query = query.or(
        [
          `full_name.ilike.${pattern}`,
          `contact_email.ilike.${pattern}`,
          `institution_name.ilike.${pattern}`,
          `workshop_reference.ilike.${pattern}`,
          `razorpay_payment_id.ilike.${pattern}`,
        ].join(","),
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows: WorkshopRegistrationAdminRow[] = Array.isArray(data)
      ? (data as unknown as WorkshopRegistrationAdminRow[])
      : [];
    const workshopIds = [...new Set(rows.map((row) => String(row.workshop_id || "")).filter(Boolean))];

    const workshopMap = new Map<string, { title: string; cohort_label: string }>();
    if (workshopIds.length) {
      const { data: workshops, error: workshopError } = await admin
        .from("psylattice_workshops")
        .select("id, title, cohort_label")
        .in("id", workshopIds);
      if (workshopError) throw workshopError;
      for (const workshop of workshops || []) {
        workshopMap.set(String(workshop.id), {
          title: String(workshop.title || "Workshop"),
          cohort_label: String(workshop.cohort_label || ""),
        });
      }
    }

    const registrations: WorkshopRegistrationWithWorkshop[] = rows.map((row) => ({
      ...row,
      workshop: workshopMap.get(String(row.workshop_id || "")) || null,
    }));

    const counts = registrations.reduce(
      (acc, row) => {
        const key = String(row.status || "");
        acc.total += 1;
        if (key in acc) (acc as Record<string, number>)[key] += 1;
        return acc;
      },
      { total: 0, pending_payment: 0, paid: 0, completed: 0, cancelled: 0, refunded: 0 },
    );

    return NextResponse.json(
      { ok: true, registrations, counts },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin workshop registrations failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
