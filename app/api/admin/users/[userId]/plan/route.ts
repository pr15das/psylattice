import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin, writeAdminAudit } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ManualPlan = "free" | "pro-monthly" | "pro-annual";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { userId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const plan = String(body.plan || "") as ManualPlan;
    const reason = String(body.reason || "").trim();
    const durationDays = Math.max(1, Math.min(3650, Math.floor(Number(body.durationDays || (plan === "pro-annual" ? 365 : 30)))));

    if (!["free", "pro-monthly", "pro-annual"].includes(plan)) {
      return NextResponse.json({ ok: false, error: "Choose a supported plan." }, { status: 400 });
    }
    if (reason.length < 4) {
      return NextResponse.json({ ok: false, error: "Add a short reason for this admin change." }, { status: 400 });
    }

    const admin = billingAdmin();
    const { data: targetUser, error: targetUserError } = await admin.auth.admin.getUserById(userId);
    if (targetUserError || !targetUser.user) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }

    const { data: existing, error: existingError } = await admin
      .from("research_billing_accounts")
      .select("user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end, billing_access_until, last_successful_charge_at, last_payment_failure_at, last_provider_event, last_provider_event_at, billing_issue_code, ai_bonus_units, email_bonus, media_bonus_bytes")
      .eq("user_id", userId)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing?.razorpay_subscription_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "This user has a Razorpay subscription. Manage or cancel the paid subscription before applying a manual plan override.",
        },
        { status: 409 },
      );
    }

    const now = new Date();
    const end = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const next =
      plan === "free"
        ? {
            user_id: userId,
            plan_tier: "free",
            plan_status: "active",
            razorpay_subscription_id: null,
            current_period_start: null,
            current_period_end: null,
            billing_access_until: null,
            billing_issue_code: null,
            last_provider_event: "admin.complimentary_plan_removed",
            last_provider_event_at: now.toISOString(),
          }
        : {
            user_id: userId,
            plan_tier: plan,
            // Existing entitlement logic treats completed+future period end as current.
            // This keeps complimentary access separate from a Razorpay "active" subscription.
            plan_status: "completed",
            razorpay_subscription_id: null,
            current_period_start: now.toISOString(),
            current_period_end: end.toISOString(),
            billing_access_until: end.toISOString(),
            billing_issue_code: null,
            last_provider_event: "admin.complimentary_plan_granted",
            last_provider_event_at: now.toISOString(),
          };

    const { error: upsertError } = await admin
      .from("research_billing_accounts")
      .upsert(next, { onConflict: "user_id" });
    if (upsertError) throw upsertError;

    if (plan === "free") {
      await admin
        .from("psylattice_admin_entitlement_grants")
        .update({ status: "revoked", revoked_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("user_id", userId)
        .in("grant_type", ["pro-monthly", "pro-annual"])
        .eq("status", "active");
    } else {
      await admin
        .from("psylattice_admin_entitlement_grants")
        .update({ status: "revoked", revoked_at: now.toISOString(), updated_at: now.toISOString() })
        .eq("user_id", userId)
        .in("grant_type", ["pro-monthly", "pro-annual"])
        .eq("status", "active");

      const { error: grantError } = await admin.from("psylattice_admin_entitlement_grants").insert({
        user_id: userId,
        grant_type: plan,
        starts_at: now.toISOString(),
        ends_at: end.toISOString(),
        status: "active",
        reason,
        granted_by: actor.userId,
        metadata: { source: "admin_console", complimentary: true },
      });
      if (grantError) throw grantError;
    }

    await writeAdminAudit({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: plan === "free" ? "set_plan_free" : "grant_complimentary_plan",
      targetUserId: userId,
      targetResourceType: "billing_account",
      targetResourceId: userId,
      beforeState: existing || null,
      afterState: next,
      reason,
    });

    return NextResponse.json({ ok: true, plan, endsAt: plan === "free" ? null : end.toISOString() });
  } catch (error) {
    console.error("Admin plan change failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
