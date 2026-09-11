import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin, writeAdminAudit } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { userId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const studyId = String(body.studyId || "").trim();
    const active = body.active !== false;
    const reason = String(body.reason || "").trim();

    if (!studyId) return NextResponse.json({ ok: false, error: "Choose a study." }, { status: 400 });
    if (reason.length < 4) return NextResponse.json({ ok: false, error: "Add a short reason for this admin change." }, { status: 400 });

    const admin = billingAdmin();
    const { data: study, error: studyError } = await admin
      .from("research_studies")
      .select("id, title, owner_user_id")
      .eq("id", studyId)
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (studyError) throw studyError;
    if (!study) return NextResponse.json({ ok: false, error: "That study does not belong to this user." }, { status: 404 });

    const { data: before, error: beforeError } = await admin
      .from("research_study_entitlements")
      .select("user_id, study_id, study_pass_active, participant_bonus")
      .eq("user_id", userId)
      .eq("study_id", studyId)
      .maybeSingle();
    if (beforeError) throw beforeError;

    const { error: upsertError } = await admin
      .from("research_study_entitlements")
      .upsert(
        {
          user_id: userId,
          study_id: studyId,
          study_pass_active: active,
          participant_bonus: Number(before?.participant_bonus || 0),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,study_id" },
      );
    if (upsertError) throw upsertError;

    if (active) {
      const { error: grantError } = await admin.from("psylattice_admin_entitlement_grants").insert({
        user_id: userId,
        grant_type: "study-pass",
        study_id: studyId,
        status: "active",
        reason,
        granted_by: actor.userId,
        metadata: { study_title: study.title, source: "admin_console", complimentary: true },
      });
      if (grantError) throw grantError;
    } else {
      await admin
        .from("psylattice_admin_entitlement_grants")
        .update({ status: "revoked", revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("study_id", studyId)
        .eq("grant_type", "study-pass")
        .eq("status", "active");
    }

    await writeAdminAudit({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: active ? "grant_study_pass" : "revoke_study_pass",
      targetUserId: userId,
      targetResourceType: "study",
      targetResourceId: studyId,
      beforeState: before || null,
      afterState: { study_pass_active: active },
      reason,
    });

    return NextResponse.json({ ok: true, studyId, active });
  } catch (error) {
    console.error("Admin Study Pass change failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
