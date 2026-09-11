import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const admin = billingAdmin();
    const limit = Math.min(200, Math.max(20, Number(request.nextUrl.searchParams.get("limit") || 100)));
    const { data, error } = await admin
      .from("psylattice_admin_audit_log")
      .select("id, actor_user_id, actor_role, action, target_user_id, target_resource_type, target_resource_id, before_state, after_state, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const ids = Array.from(
      new Set((data || []).flatMap((row) => [row.actor_user_id, row.target_user_id]).filter(Boolean)),
    );
    const { data: users, error: userError } = ids.length
      ? await admin
          .from("psylattice_admin_account_directory")
          .select("user_id, email, full_name")
          .in("user_id", ids)
      : { data: [], error: null };
    if (userError) throw userError;
    const map = new Map((users || []).map((row) => [row.user_id, row]));

    return NextResponse.json({
      ok: true,
      audit: (data || []).map((row) => ({
        ...row,
        actor: map.get(row.actor_user_id) || null,
        target: map.get(row.target_user_id) || null,
      })),
    });
  } catch (error) {
    console.error("Admin audit list failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
