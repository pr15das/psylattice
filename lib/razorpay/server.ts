import Razorpay from "razorpay";

/**
 * Server-only Razorpay client factory. Keep this module out of client imports;
 * the key secret must remain available only to server-side operations.
 */
export function getRazorpayClient() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = getRazorpayKeySecret();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay is not configured for server-side operations.");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function getRazorpayKeySecret() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("Razorpay is not configured for server-side operations.");
  return keySecret;
}
