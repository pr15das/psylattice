import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayClient, getRazorpayKeySecret } from "@/lib/razorpay/server";
import { RAZORPAY_PRODUCTS } from "@/lib/razorpay/products";

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const code = body.product_code;
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const subscriptionId = typeof body.razorpay_subscription_id === "string" ? body.razorpay_subscription_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
    if ((code !== "pro_monthly" && code !== "pro_annual") || !paymentId || !subscriptionId || !signature) return NextResponse.json({ error: "Payment details are incomplete." }, { status: 400 });
    const product = RAZORPAY_PRODUCTS[code];
    const subscription = await getRazorpayClient().subscriptions.fetch(subscriptionId);
    if (subscription.plan_id !== product.plan_id || subscription.notes?.user_id !== user.id || subscription.notes?.product_code !== code) return NextResponse.json({ error: "Subscription verification failed." }, { status: 400 });
    const expected = createHmac("sha256", getRazorpayKeySecret()).update(`${paymentId}|${subscriptionId}`).digest("hex");
    if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return NextResponse.json({ error: "Subscription verification failed." }, { status: 400 });
    return NextResponse.json({ verified: true, product_code: code }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to verify the subscription right now." }, { status: 500 });
  }
}
