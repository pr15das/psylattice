import "server-only";

import { authenticatedBillingUser, billingAdmin } from "@/lib/billing/server";

export type PsyLatticeAdminRole = "admin" | "super_admin";

export type PsyLatticeAdminSession = {
  userId: string;
  email: string;
  role: PsyLatticeAdminRole;
};

export async function getAdminSession(): Promise<PsyLatticeAdminSession | null> {
  const user = await authenticatedBillingUser();
  if (!user) return null;

  const admin = billingAdmin();
  const { data, error } = await admin
    .from("psylattice_admin_members")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data || (data.role !== "admin" && data.role !== "super_admin")) return null;

  return {
    userId: user.id,
    email: user.email || "",
    role: data.role as PsyLatticeAdminRole,
  };
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    const error = new Error("PsyLattice admin access is required.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAdmin();
  if (session.role !== "super_admin") {
    const error = new Error("PsyLattice super-admin access is required.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
  return session;
}

export async function writeAdminAudit(input: {
  actorUserId: string;
  actorRole: PsyLatticeAdminRole;
  action: string;
  targetUserId?: string | null;
  targetResourceType?: string | null;
  targetResourceId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  reason?: string | null;
}) {
  const admin = billingAdmin();
  const { error } = await admin.from("psylattice_admin_audit_log").insert({
    actor_user_id: input.actorUserId,
    actor_role: input.actorRole,
    action: input.action,
    target_user_id: input.targetUserId || null,
    target_resource_type: input.targetResourceType || null,
    target_resource_id: input.targetResourceId || null,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
    reason: input.reason?.trim() || null,
  });
  if (error) throw error;
}

export function adminErrorResponse(error: unknown) {
  const status =
    typeof error === "object" && error && "status" in error
      ? Number((error as { status?: number }).status || 500)
      : 500;
  return {
    status,
    message:
      status === 403
        ? "You do not have permission to use this PsyLattice admin action."
        : "PsyLattice could not complete that admin action.",
  };
}
