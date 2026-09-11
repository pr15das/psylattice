import { NextRequest, NextResponse } from "next/server";
import { billingAdmin, ensureBillingAccount } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin, writeAdminAudit } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GIB = 1024 ** 3;

const PRESETS = {
  "ai-starter": {
    grantType: "ai-boost",
    label: "Starter Boost",
    field: "ai_bonus_units",
    quantity: 75,
  },
  "ai-research": {
    grantType: "ai-boost",
    label: "Research Boost",
    field: "ai_bonus_units",
    quantity: 200,
  },
  "ai-power": {
    grantType: "ai-boost",
    label: "Power Boost",
    field: "ai_bonus_units",
    quantity: 500,
  },
  "email-1000": {
    grantType: "email-capacity",
    label: "+1,000 participant emails",
    field: "email_bonus",
    quantity: 1_000,
  },
  "email-5000": {
    grantType: "email-capacity",
    label: "+5,000 participant emails",
    field: "email_bonus",
    quantity: 5_000,
  },
  "email-15000": {
    grantType: "email-capacity",
    label: "+15,000 participant emails",
    field: "email_bonus",
    quantity: 15_000,
  },
  "storage-5gb": {
    grantType: "media-storage",
    label: "+5 GB media storage",
    field: "media_bonus_bytes",
    quantity: 5 * GIB,
  },
  "storage-20gb": {
    grantType: "media-storage",
    label: "+20 GB media storage",
    field: "media_bonus_bytes",
    quantity: 20 * GIB,
  },
  "storage-50gb": {
    grantType: "media-storage",
    label: "+50 GB media storage",
    field: "media_bonus_bytes",
    quantity: 50 * GIB,
  },
} as const;

type PresetId = keyof typeof PRESETS;

function reasonText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 1000) : "";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const session = await requireAdmin();
    const { userId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const presetId = String(body.presetId || "") as PresetId;
    const preset = PRESETS[presetId];
    const reason = reasonText(body.reason);

    if (!preset) {
      return NextResponse.json({ ok: false, error: "Choose a supported resource grant." }, { status: 400 });
    }
    if (reason.length < 4) {
      return NextResponse.json({ ok: false, error: "Add a short reason for the audit log." }, { status: 400 });
    }

    const admin = billingAdmin();
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError || !target?.user) {
      return NextResponse.json({ ok: false, error: "That PsyLattice account does not exist." }, { status: 404 });
    }

    await ensureBillingAccount(userId);

    const { data: before, error: beforeError } = await admin
      .from("research_billing_accounts")
      .select("user_id, ai_bonus_units, email_bonus, media_bonus_bytes")
      .eq("user_id", userId)
      .single();
    if (beforeError) throw beforeError;

    const beforeValue = Math.max(0, Number((before as Record<string, unknown>)[preset.field] || 0));
    const afterValue = beforeValue + preset.quantity;

    const { error: updateError } = await admin
      .from("research_billing_accounts")
      .update({
        [preset.field]: afterValue,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (updateError) throw updateError;

    const { data: grant, error: grantError } = await admin
      .from("psylattice_admin_entitlement_grants")
      .insert({
        user_id: userId,
        grant_type: preset.grantType,
        quantity: preset.quantity,
        reason,
        granted_by: session.userId,
        metadata: {
          preset_id: presetId,
          label: preset.label,
          billing_field: preset.field,
        },
      })
      .select("id")
      .single();
    if (grantError) throw grantError;

    await writeAdminAudit({
      actorUserId: session.userId,
      actorRole: session.role,
      action: "grant_account_resource",
      targetUserId: userId,
      targetResourceType: preset.grantType,
      targetResourceId: grant?.id || presetId,
      beforeState: { [preset.field]: beforeValue },
      afterState: { [preset.field]: afterValue, presetId, label: preset.label },
      reason,
    });

    return NextResponse.json(
      {
        ok: true,
        presetId,
        label: preset.label,
        quantity: preset.quantity,
        field: preset.field,
        previousValue: beforeValue,
        newValue: afterValue,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin resource grant failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
