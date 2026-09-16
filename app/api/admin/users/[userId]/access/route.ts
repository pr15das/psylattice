import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import {
  adminErrorResponse,
  requireAdmin,
  writeAdminAudit,
} from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Action = "suspend" | "ban" | "restore" | "delete";

type AccessRow = {
  user_id: string;
  status: "active" | "suspended" | "banned" | "deleting";
  suspended_until: string | null;
  public_message: string | null;
  actioned_by: string | null;
  actioned_at: string;
  updated_at: string;
};

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function effectiveAccess(row: AccessRow | null) {
  if (!row) return { status: "active", suspended_until: null, public_message: null };
  if (
    row.status === "suspended" &&
    row.suspended_until &&
    new Date(row.suspended_until).getTime() <= Date.now()
  ) {
    return { ...row, status: "active" as const };
  }
  return row;
}

async function accessForUser(userId: string) {
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("psylattice_account_access")
    .select("user_id, status, suspended_until, public_message, actioned_by, actioned_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data || null) as AccessRow | null;
}

async function assertTargetCanBeModerated(
  actor: { userId: string; role: "admin" | "super_admin" },
  targetUserId: string,
) {
  if (actor.userId === targetUserId) {
    throw Object.assign(new Error("You cannot restrict or delete your own Admin account."), { status: 403 });
  }

  const admin = billingAdmin();
  const { data: targetMember, error } = await admin
    .from("psylattice_admin_members")
    .select("role")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (error) throw error;

  if (targetMember?.role === "super_admin") {
    throw Object.assign(new Error("Super Admin accounts are protected from moderation actions."), { status: 403 });
  }

  if (actor.role !== "super_admin" && targetMember) {
    throw Object.assign(new Error("Only a Super Admin can moderate another Admin account."), { status: 403 });
  }

  return targetMember?.role || null;
}

async function removeOwnedStorageObjects(userId: string) {
  const admin = billingAdmin();
  const { data, error } = await admin.rpc(
    "psylattice_admin_storage_objects_for_user",
    { p_user_id: userId },
  );
  if (error) throw error;

  const grouped = new Map<string, string[]>();
  for (const row of data || []) {
    const bucket = String(row.bucket_id || "");
    const name = String(row.object_name || "");
    if (!bucket || !name) continue;
    grouped.set(bucket, [...(grouped.get(bucket) || []), name]);
  }

  let removed = 0;
  for (const [bucket, names] of grouped.entries()) {
    for (let index = 0; index < names.length; index += 100) {
      const chunk = names.slice(index, index + 100);
      const { data: deleted, error: deleteError } = await admin.storage.from(bucket).remove(chunk);
      if (deleteError) throw deleteError;
      removed += deleted?.length ?? chunk.length;
    }
  }

  return removed;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdmin();
    const { userId } = await context.params;
    return NextResponse.json(
      { ok: true, access: effectiveAccess(await accessForUser(userId)) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const actor = await requireAdmin();
    const { userId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "") as Action;
    const reason = cleanText(body.reason, 1000);
    const publicMessage = cleanText(body.publicMessage, 1000) || null;

    if (!(["suspend", "ban", "restore", "delete"] as Action[]).includes(action)) {
      return NextResponse.json({ ok: false, error: "Choose a supported account action." }, { status: 400 });
    }
    if (reason.length < 4) {
      return NextResponse.json({ ok: false, error: "Add a short internal reason for the audit log." }, { status: 400 });
    }

    const admin = billingAdmin();
    const { data: targetResult, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError || !targetResult?.user) {
      return NextResponse.json({ ok: false, error: "That PsyLattice account does not exist." }, { status: 404 });
    }

    const targetAdminRole = await assertTargetCanBeModerated(actor, userId);
    const before = await accessForUser(userId);
    const targetSnapshot = {
      userId,
      email: targetResult.user.email || null,
      adminRole: targetAdminRole,
      access: effectiveAccess(before),
    };

    if (action === "restore") {
      const { error } = await admin
        .from("psylattice_account_access")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;

      await writeAdminAudit({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "restore_user_account",
        targetUserId: userId,
        targetResourceType: "account_access",
        targetResourceId: userId,
        beforeState: targetSnapshot,
        afterState: { status: "active" },
        reason,
      });

      return NextResponse.json(
        { ok: true, action, access: { status: "active", suspended_until: null, public_message: null } },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (action === "suspend") {
      const durationHours = Number(body.durationHours);
      if (!Number.isFinite(durationHours) || durationHours < 1 || durationHours > 24 * 365 * 5) {
        return NextResponse.json({ ok: false, error: "Choose a suspension between 1 hour and 5 years." }, { status: 400 });
      }

      const now = new Date();
      const suspendedUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();
      const next = {
        user_id: userId,
        status: "suspended",
        suspended_until: suspendedUntil,
        public_message: publicMessage,
        actioned_by: actor.userId,
        actioned_at: now.toISOString(),
        updated_at: now.toISOString(),
      };
      const { data, error } = await admin
        .from("psylattice_account_access")
        .upsert(next, { onConflict: "user_id" })
        .select("user_id, status, suspended_until, public_message, actioned_by, actioned_at, updated_at")
        .single();
      if (error) throw error;

      await writeAdminAudit({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "suspend_user_account",
        targetUserId: userId,
        targetResourceType: "account_access",
        targetResourceId: userId,
        beforeState: targetSnapshot,
        afterState: data,
        reason,
      });

      return NextResponse.json({ ok: true, action, access: data });
    }

    if (action === "ban") {
      const now = new Date().toISOString();
      const next = {
        user_id: userId,
        status: "banned",
        suspended_until: null,
        public_message: publicMessage,
        actioned_by: actor.userId,
        actioned_at: now,
        updated_at: now,
      };
      const { data, error } = await admin
        .from("psylattice_account_access")
        .upsert(next, { onConflict: "user_id" })
        .select("user_id, status, suspended_until, public_message, actioned_by, actioned_at, updated_at")
        .single();
      if (error) throw error;

      await writeAdminAudit({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "ban_user_account",
        targetUserId: userId,
        targetResourceType: "account_access",
        targetResourceId: userId,
        beforeState: targetSnapshot,
        afterState: data,
        reason,
      });

      return NextResponse.json({ ok: true, action, access: data });
    }

    // Permanent deletion: block the account first, then clean owned Storage,
    // then delete the Supabase Auth user. The audit record survives the Auth row.
    const deletingAt = new Date().toISOString();
    const { error: gateError } = await admin
      .from("psylattice_account_access")
      .upsert(
        {
          user_id: userId,
          status: "deleting",
          suspended_until: null,
          public_message: "This PsyLattice account is being permanently removed.",
          actioned_by: actor.userId,
          actioned_at: deletingAt,
          updated_at: deletingAt,
        },
        { onConflict: "user_id" },
      );
    if (gateError) throw gateError;

    let storageObjectsRemoved = 0;
    try {
      storageObjectsRemoved = await removeOwnedStorageObjects(userId);
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);
      if (deleteError) throw deleteError;
    } catch (deleteFailure) {
      await writeAdminAudit({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: "delete_user_account_failed",
        targetUserId: userId,
        targetResourceType: "account",
        targetResourceId: userId,
        beforeState: targetSnapshot,
        afterState: { status: "deleting", storageObjectsRemoved },
        reason: `${reason} | Delete failed: ${deleteFailure instanceof Error ? deleteFailure.message : "Unknown error"}`.slice(0, 1000),
      });
      throw Object.assign(
        new Error("Deletion did not complete. The account remains blocked in 'deleting' state; review the audit log before retrying or restoring it."),
        { status: 409 },
      );
    }

    await writeAdminAudit({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "delete_user_account",
      targetUserId: userId,
      targetResourceType: "account",
      targetResourceId: userId,
      beforeState: targetSnapshot,
      afterState: { deleted: true, storageObjectsRemoved },
      reason,
    });

    return NextResponse.json(
      { ok: true, action, deleted: true, storageObjectsRemoved },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin account moderation failed:", error);
    const explicitStatus = Number((error as { status?: unknown } | null)?.status);
    if (error instanceof Error && Number.isInteger(explicitStatus) && explicitStatus >= 400 && explicitStatus <= 599) {
      return NextResponse.json({ ok: false, error: error.message }, { status: explicitStatus });
    }
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
