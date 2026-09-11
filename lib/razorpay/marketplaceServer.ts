import "server-only";

import crypto from "node:crypto";
import type { ResearchPlanTier } from "@/lib/billing/plans";

export type BillingPlanTier = ResearchPlanTier;

// Keep all existing marketplace imports working while moving account/plan logic
// into the central billing entitlement layer.
export {
  accountHasCurrentPro,
  authenticatedBillingUser,
  billingAdmin,
  ensureBillingAccount,
  getResearcherEntitlements,
  loadBillingSnapshot,
  studyHasPass,
  userOwnsStudy,
} from "@/lib/billing/server";

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
      payload?.error?.description ||
      payload?.error?.reason ||
      payload?.error?.code ||
      response.statusText;
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

export function providerUnixToIso(value: unknown) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}
