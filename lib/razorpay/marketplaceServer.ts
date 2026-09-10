import "server-only";

import crypto from "node:crypto";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export type BillingPlanTier = "free" | "study-pass" | "pro-monthly" | "pro-annual";

type BillingAccountRow = {
  user_id: string;
  plan_tier: "free" | "pro-monthly" | "pro-annual";
  plan_status: string;
  razorpay_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
};

export function billingAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("Billing database environment variables are incomplete.");
  }

  return createSupabaseAdmin(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function authenticatedBillingUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export function getRazorpayCredentials() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured for server-side operations.");
  }

  return { keyId, keySecret };
}

export async function razorpayRequest<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init.method || "GET",
    headers: {
      Authorization: `Basic ${authorization}`,
      Accept: "application/json",
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const raw = await response.text();
  let payload: any = null;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }

  if (!response.ok) {
    const providerMessage =
      payload?.error?.description || payload?.error?.reason || payload?.error?.code || response.statusText;
    throw new Error(`Razorpay request failed: ${providerMessage}`);
  }

  return payload as T;
}

export function verifyHexHmac(message: string, suppliedSignature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(message).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const suppliedBuffer = Buffer.from(suppliedSignature || "", "hex");

  if (expectedBuffer.length !== suppliedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured.");
  return verifyHexHmac(rawBody, signature, webhookSecret);
}

export function accountHasCurrentPro(account: BillingAccountRow | null | undefined) {
  if (!account) return false;
  if (account.plan_tier !== "pro-monthly" && account.plan_tier !== "pro-annual") return false;

  if (["active", "authenticated", "pending"].includes(account.plan_status)) return true;

  if (
    ["cancelled", "completed"].includes(account.plan_status) &&
    account.current_period_end &&
    new Date(account.current_period_end).getTime() > Date.now()
  ) {
    return true;
  }

  return false;
}

export async function loadBillingSnapshot(userId: string) {
  const admin = billingAdmin();

  const [{ data: account, error: accountError }, { data: passRows, error: passError }] = await Promise.all([
    admin
      .from("research_billing_accounts")
      .select(
        "user_id, plan_tier, plan_status, razorpay_subscription_id, current_period_start, current_period_end",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("research_study_entitlements")
      .select("study_id")
      .eq("user_id", userId)
      .eq("study_pass_active", true)
      .limit(1),
  ]);

  if (accountError) throw accountError;
  if (passError) throw passError;

  const typedAccount = (account || null) as BillingAccountRow | null;
  const hasPro = accountHasCurrentPro(typedAccount);
  const hasStudyPass = Boolean(passRows?.length);

  const effectivePlan: BillingPlanTier = hasPro
    ? (typedAccount!.plan_tier as "pro-monthly" | "pro-annual")
    : hasStudyPass
      ? "study-pass"
      : "free";

  return {
    account: typedAccount,
    hasPro,
    hasStudyPass,
    effectivePlan,
  };
}

export async function userOwnsStudy(userId: string, studyId: string) {
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("research_studies")
    .select("id, title, status")
    .eq("id", studyId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function studyHasPass(userId: string, studyId: string) {
  const admin = billingAdmin();
  const { data, error } = await admin
    .from("research_study_entitlements")
    .select("study_pass_active")
    .eq("user_id", userId)
    .eq("study_id", studyId)
    .maybeSingle();

  if (error) throw error;
  return data?.study_pass_active === true;
}

export function providerUnixToIso(value: unknown) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}
