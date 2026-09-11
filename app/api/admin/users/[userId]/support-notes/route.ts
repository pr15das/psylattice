import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin, writeAdminAudit } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CATEGORIES = new Set(["support", "billing", "university", "abuse", "other"]);

async function decoratedNotes(userId: string) {
  const admin = billingAdmin();
  const { data: notes, error } = await admin
    .from("psylattice_admin_support_notes")
    .select("id, user_id, category, note, created_by, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const creatorIds = Array.from(new Set((notes || []).map((row) => row.created_by).filter(Boolean)));
  const { data: creators, error: creatorError } = creatorIds.length
    ? await admin
        .from("psylattice_admin_account_directory")
        .select("user_id, full_name, email")
        .in("user_id", creatorIds)
    : { data: [], error: null };
  if (creatorError) throw creatorError;
  const creatorMap = new Map((creators || []).map((row) => [row.user_id, row]));

  return (notes || []).map((row) => ({
    ...row,
    creator: row.created_by ? creatorMap.get(row.created_by) || null : null,
  }));
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdmin();
    const { userId } = await context.params;
    return NextResponse.json(
      { ok: true, notes: await decoratedNotes(userId) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin support notes load failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
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
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 5000) : "";
    const category = CATEGORIES.has(String(body.category || "")) ? String(body.category) : "support";

    if (!note) {
      return NextResponse.json({ ok: false, error: "Write a support note first." }, { status: 400 });
    }

    const admin = billingAdmin();
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError || !target?.user) {
      return NextResponse.json({ ok: false, error: "That PsyLattice account does not exist." }, { status: 404 });
    }

    const { data: created, error } = await admin
      .from("psylattice_admin_support_notes")
      .insert({
        user_id: userId,
        category,
        note,
        created_by: session.userId,
      })
      .select("id, user_id, category, note, created_by, created_at, updated_at")
      .single();
    if (error) throw error;

    await writeAdminAudit({
      actorUserId: session.userId,
      actorRole: session.role,
      action: "add_internal_support_note",
      targetUserId: userId,
      targetResourceType: "support_note",
      targetResourceId: created.id,
      afterState: { category },
      reason: "Internal PsyLattice support note added.",
    });

    return NextResponse.json(
      { ok: true, note: created, notes: await decoratedNotes(userId) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin support note create failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
