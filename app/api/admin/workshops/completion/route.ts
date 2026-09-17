import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import {
  adminErrorResponse,
  requireAdmin,
  writeAdminAudit,
} from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const registrationId = String(body.registrationId || "").trim();
    const completed = body.completed === true;

    if (!registrationId || !UUID_PATTERN.test(registrationId)) {
      return NextResponse.json(
        { ok: false, error: "A valid workshop registration is required." },
        { status: 400 },
      );
    }

    const admin = billingAdmin();

    const { data: before, error: beforeError } = await admin
      .from("psylattice_workshop_registrations")
      .select(
        "id, user_id, workshop_id, status, full_name, workshop_reference, razorpay_payment_id, completed_at, completed_by, certificate_issued_at",
      )
      .eq("id", registrationId)
      .maybeSingle();

    if (beforeError) throw beforeError;

    if (!before) {
      return NextResponse.json(
        { ok: false, error: "Workshop registration was not found." },
        { status: 404 },
      );
    }

    if (completed && before.status !== "paid" && before.status !== "completed") {
      return NextResponse.json(
        {
          ok: false,
          error: "Only a verified paid registration can be marked complete.",
        },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();

    const changes = completed
      ? {
          status: "completed",
          completed_at: before.completed_at || now,
          completed_by: session.userId,
          certificate_issued_at: before.certificate_issued_at || now,
          updated_at: now,
        }
      : {
          status: before.razorpay_payment_id ? "paid" : "pending_payment",
          completed_at: null,
          completed_by: null,
          certificate_issued_at: null,
          updated_at: now,
        };

    const { data: after, error: updateError } = await admin
      .from("psylattice_workshop_registrations")
      .update(changes)
      .eq("id", registrationId)
      .select(
        "id, user_id, workshop_id, status, full_name, workshop_reference, razorpay_payment_id, completed_at, completed_by, certificate_issued_at, updated_at",
      )
      .single();

    if (updateError) throw updateError;

    await writeAdminAudit({
      actorUserId: session.userId,
      actorRole: session.role,
      action: completed
        ? "workshop.mark_completed"
        : "workshop.reopen_completion",
      targetUserId: String(before.user_id),
      targetResourceType: "workshop_registration",
      targetResourceId: String(before.id),
      beforeState: before,
      afterState: after,
      reason: completed
        ? "Admin confirmed complete workshop attendance and issued the certificate."
        : "Admin removed workshop completion and certificate issuance.",
    });

    return NextResponse.json(
      { ok: true, registration: after },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin workshop completion action failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json(
      { ok: false, error: safe.message },
      { status: safe.status },
    );
  }
}
