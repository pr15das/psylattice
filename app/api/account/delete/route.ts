import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  authenticatedBillingUser,
  billingAdmin,
} from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ArchiveResult = {
  accountReferenceHash?: string;
  subscriptionId?: string | null;
  purchaseCount?: number;
  totalPaidPaise?: number;
};

type RazorpaySubscription = {
  id?: string;
  status?: string;
};

function jsonError(error: string, status = 400, code?: string) {
  return NextResponse.json(
    { ok: false, error, ...(code ? { code } : {}) },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

function supabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    ""
  ).trim();
}

async function verifyPassword(email: string, password: string, expectedUserId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const key = supabasePublicKey();

  if (!url || !key) {
    throw new Error("PsyLattice authentication configuration is incomplete.");
  }

  const verifier = createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await verifier.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || data.user.id !== expectedUserId) {
    return false;
  }

  await verifier.auth.signOut();
  return true;
}

function razorpayCredentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";

  if (!keyId || !keySecret) {
    throw new Error("Razorpay server credentials are incomplete.");
  }

  return { keyId, keySecret };
}

async function razorpaySubscriptionRequest(
  subscriptionId: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>,
) {
  const { keyId, keySecret } = razorpayCredentials();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}${
      method === "POST" ? "/cancel" : ""
    }`,
    {
      method,
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    },
  );

  const data = (await response.json().catch(() => ({}))) as RazorpaySubscription & {
    error?: {
      description?: string;
      reason?: string;
    };
  };

  if (!response.ok) {
    const message =
      data.error?.description ||
      data.error?.reason ||
      `Razorpay returned HTTP ${response.status}.`;
    throw new Error(message);
  }

  return data;
}

async function cancelSubscriptionIfNeeded(subscriptionId: string | null) {
  if (!subscriptionId) {
    return { cancelled: false, hadSubscription: false };
  }

  const current = await razorpaySubscriptionRequest(subscriptionId, "GET");
  const status = String(current.status || "").toLowerCase();

  if (["cancelled", "completed", "expired"].includes(status)) {
    return { cancelled: status === "cancelled", hadSubscription: true };
  }

  await razorpaySubscriptionRequest(subscriptionId, "POST", {
    cancel_at_cycle_end: false,
  });

  return { cancelled: true, hadSubscription: true };
}

async function listAllFiles(
  admin: ReturnType<typeof billingAdmin>,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const files: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;
    const rows = data || [];
    if (rows.length === 0) break;

    for (const row of rows) {
      const child = prefix ? `${prefix}/${row.name}` : row.name;
      const isFolder = !row.id && !row.metadata;

      if (isFolder) {
        files.push(...(await listAllFiles(admin, bucket, child)));
      } else {
        files.push(child);
      }
    }

    if (rows.length < 1000) break;
    offset += rows.length;
  }

  return files;
}

async function removeStoragePrefix(
  admin: ReturnType<typeof billingAdmin>,
  bucket: string,
  prefix: string,
) {
  const files = await listAllFiles(admin, bucket, prefix);
  for (let start = 0; start < files.length; start += 100) {
    const chunk = files.slice(start, start + 100);
    if (chunk.length === 0) continue;
    const { error } = await admin.storage.from(bucket).remove(chunk);
    if (error) throw error;
  }
  return files.length;
}

export async function POST(request: NextRequest) {
  let auditId: string | null = null;
  let archivedHash = "";
  let subscriptionCancelled = false;

  try {
    const user = await authenticatedBillingUser();
    if (!user?.id || !user.email) {
      return jsonError("Please sign in again before deleting your account.", 401);
    }

    const body = (await request.json().catch(() => ({}))) as {
      password?: unknown;
      confirmation?: unknown;
    };

    const password =
      typeof body.password === "string" ? body.password : "";
    const confirmation =
      typeof body.confirmation === "string" ? body.confirmation.trim() : "";

    if (confirmation !== "DELETE") {
      return jsonError('Type "DELETE" exactly to confirm permanent account deletion.');
    }

    if (password.length < 1) {
      return jsonError("Enter your current PsyLattice password to continue.");
    }

    const passwordValid = await verifyPassword(user.email, password, user.id);
    if (!passwordValid) {
      return jsonError("The password you entered is not correct.", 401, "REAUTH_FAILED");
    }

    const admin = billingAdmin();

    const { data: archiveData, error: archiveError } = await admin.rpc(
      "psylattice_archive_account_billing",
      { p_user_id: user.id },
    );

    if (archiveError) throw archiveError;

    const archive = (archiveData || {}) as ArchiveResult;
    archivedHash = String(archive.accountReferenceHash || "");
    const subscriptionId =
      typeof archive.subscriptionId === "string" && archive.subscriptionId.trim()
        ? archive.subscriptionId.trim()
        : null;

    if (!archivedHash) {
      throw new Error("PsyLattice could not prepare the billing archive.");
    }

    const { data: auditRow, error: auditError } = await admin
      .from("psylattice_account_deletion_audit")
      .insert({
        account_reference_hash: archivedHash,
        razorpay_subscription_id: subscriptionId,
        purchase_count: Math.max(0, Number(archive.purchaseCount || 0)),
        total_paid_paise: Math.max(0, Number(archive.totalPaidPaise || 0)),
        outcome: "started",
      })
      .select("id")
      .single();

    if (auditError || !auditRow?.id) {
      throw auditError || new Error("PsyLattice could not create the deletion audit record.");
    }
    auditId = auditRow.id;

    const subscriptionResult = await cancelSubscriptionIfNeeded(subscriptionId);
    subscriptionCancelled = subscriptionResult.cancelled;

    if (subscriptionResult.hadSubscription) {
      await admin
        .from("psylattice_account_deletion_audit")
        .update({ subscription_cancelled: subscriptionCancelled })
        .eq("id", auditId);
    }

    // Remove private Storage objects owned by the researcher before removing
    // the auth user. Questionnaire media is namespaced by researcher ID.
    await removeStoragePrefix(
      admin,
      "questionnaire-media",
      `researchers/${user.id}`,
    );

    // Participant-upload objects are namespaced by study ID. Gather the user's
    // studies while the ownership rows still exist.
    const { data: studies, error: studyError } = await admin
      .from("research_studies")
      .select("id")
      .eq("owner_user_id", user.id);

    if (studyError) throw studyError;

    for (const study of studies || []) {
      if (study?.id) {
        await removeStoragePrefix(admin, "study-uploads", String(study.id));
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    await admin
      .from("psylattice_account_deletion_audit")
      .update({
        outcome: "completed",
        subscription_cancelled: subscriptionCancelled,
        completed_at: new Date().toISOString(),
        error_code: null,
      })
      .eq("id", auditId);

    return NextResponse.json(
      {
        ok: true,
        subscriptionCancelled,
        message: "Your PsyLattice account has been permanently deleted.",
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("PsyLattice account deletion failed:", error);

    if (auditId) {
      try {
        const admin = billingAdmin();
        await admin
          .from("psylattice_account_deletion_audit")
          .update({
            outcome: "failed",
            subscription_cancelled: subscriptionCancelled,
            completed_at: new Date().toISOString(),
            error_code: "ACCOUNT_DELETE_FAILED",
          })
          .eq("id", auditId);
      } catch {
        // Preserve the original error response.
      }
    }

    return jsonError(
      subscriptionCancelled
        ? "Your subscription was cancelled, but PsyLattice could not finish deleting the account. Please contact support before creating another subscription."
        : "PsyLattice could not safely finish deleting your account. No new subscription cancellation was completed.",
      500,
      "ACCOUNT_DELETE_FAILED",
    );
  }
}
