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
    const mode = String(body.mode || "add");
    const amount = Math.floor(Number(body.amount || 0));
    const reason = String(body.reason || "").trim();

    if (!studyId) return NextResponse.json({ ok: false, error: "Choose a study." }, { status: 400 });
    if (mode !== "reset" && ![100, 200, 500].includes(amount)) {
      return NextResponse.json({ ok: false, error: "Capacity grants must be +100, +200 or +500." }, { status: 400 });
    }
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

    const current = Math.max(0, Number(before?.participant_bonus || 0));
    const nextBonus = mode === "reset" ? 0 : current + amount;

    const { error: upsertError } = await admin
      .from("research_study_entitlements")
      .upsert(
        {
          user_id: userId,
          study_id: studyId,
          study_pass_active: before?.study_pass_active === true,
          participant_bonus: nextBonus,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,study_id" },
      );
    if (upsertError) throw upsertError;

    const { error: grantError } = await admin.from("psylattice_admin_entitlement_grants").insert({
      user_id: userId,
      grant_type: "participant-capacity",
      study_id: studyId,
      quantity: mode === "reset" ? -current : amount,
      status: "active",
      reason,
      granted_by: actor.userId,
      metadata: { study_title: study.title, source: "admin_console", mode, resulting_bonus: nextBonus },
    });
    if (grantError) throw grantError;

    await writeAdminAudit({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: mode === "reset" ? "reset_participant_capacity" : "grant_participant_capacity",
      targetUserId: userId,
      targetResourceType: "study",
      targetResourceId: studyId,
      beforeState: { participant_bonus: current },
      afterState: { participant_bonus: nextBonus },
      reason,
    });

    return NextResponse.json({ ok: true, studyId, participantBonus: nextBonus });
  } catch (error) {
    console.error("Admin participant capacity change failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
