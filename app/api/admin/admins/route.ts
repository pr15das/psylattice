import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin, requireSuperAdmin, writeAdminAudit } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const admin = billingAdmin();
    const { data, error } = await admin
      .from("psylattice_admin_members")
      .select("user_id, role, created_by, created_at, updated_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const ids = (data || []).map((row) => row.user_id);
    const { data: directory, error: directoryError } = ids.length
      ? await admin
          .from("psylattice_admin_account_directory")
          .select("user_id, email, full_name")
          .in("user_id", ids)
      : { data: [], error: null };
    if (directoryError) throw directoryError;
    const directoryMap = new Map((directory || []).map((row) => [row.user_id, row]));
    return NextResponse.json({
      ok: true,
      admins: (data || []).map((row) => ({ ...row, account: directoryMap.get(row.user_id) || null })),
    });
  } catch (error) {
    console.error("Admin member list failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSuperAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "admin");
    const action = String(body.action || "set");
    const reason = String(body.reason || "").trim();

    if (!email) return NextResponse.json({ ok: false, error: "Enter the user's PsyLattice email." }, { status: 400 });
    if (!["admin", "super_admin"].includes(role)) return NextResponse.json({ ok: false, error: "Choose Admin or Super Admin." }, { status: 400 });
    if (reason.length < 4) return NextResponse.json({ ok: false, error: "Add a short reason for this role change." }, { status: 400 });

    const admin = billingAdmin();
    const { data: matches, error: matchError } = await admin
      .from("psylattice_admin_account_directory")
      .select("user_id, email, full_name, admin_role")
      .ilike("email", email)
      .limit(2);
    if (matchError) throw matchError;
    const target = (matches || []).find((row) => String(row.email || "").toLowerCase() === email);
    if (!target) return NextResponse.json({ ok: false, error: "No PsyLattice account exists for that email." }, { status: 404 });

    const before = target.admin_role ? { role: target.admin_role } : null;

    if (action === "remove") {
      if (target.user_id === actor.userId) {
        return NextResponse.json({ ok: false, error: "You cannot remove your own super-admin access from this screen." }, { status: 409 });
      }
      const { error } = await admin.from("psylattice_admin_members").delete().eq("user_id", target.user_id);
      if (error) throw error;
      await writeAdminAudit({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "remove_admin",
        targetUserId: target.user_id,
        beforeState: before,
        afterState: null,
        reason,
      });
      return NextResponse.json({ ok: true, removed: true });
    }

    const { error: upsertError } = await admin.from("psylattice_admin_members").upsert(
      {
        user_id: target.user_id,
        role,
        created_by: actor.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (upsertError) throw upsertError;

    await writeAdminAudit({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "set_admin_role",
      targetUserId: target.user_id,
      beforeState: before,
      afterState: { role },
      reason,
    });

    return NextResponse.json({ ok: true, userId: target.user_id, role });
  } catch (error) {
    console.error("Admin role change failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
