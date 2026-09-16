import { billingAdmin } from "@/lib/billing/server";

export type PsyLatticeAccountAccess = {
  status: "active" | "suspended" | "banned" | "deleting";
  suspendedUntil: string | null;
  publicMessage: string | null;
};

export class PsyLatticeAccountRestrictedError extends Error {
  status = 403;
  access: PsyLatticeAccountAccess;

  constructor(access: PsyLatticeAccountAccess) {
    super("This PsyLattice account is restricted.");
    this.name = "PsyLatticeAccountRestrictedError";
    this.access = access;
  }
}

export async function accountAccessForUser(userId: string): Promise<PsyLatticeAccountAccess> {
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("psylattice_account_access")
    .select("status, suspended_until, public_message")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  if (!data) return { status: "active", suspendedUntil: null, publicMessage: null };

  if (
    data.status === "suspended" &&
    data.suspended_until &&
    new Date(data.suspended_until).getTime() <= Date.now()
  ) {
    return { status: "active", suspendedUntil: data.suspended_until, publicMessage: data.public_message };
  }

  return {
    status: data.status,
    suspendedUntil: data.suspended_until,
    publicMessage: data.public_message,
  };
}

/**
 * IMPORTANT: call this immediately after authenticating a user in any
 * server route that then uses the Supabase service-role client on that
 * user's behalf. Service role bypasses RLS, so those routes need this gate.
 */
export async function assertAccountAllowed(userId: string) {
  const access = await accountAccessForUser(userId);
  if (access.status !== "active") throw new PsyLatticeAccountRestrictedError(access);
  return access;
}
