import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayClient } from "@/lib/razorpay/server";
import { RAZORPAY_PRODUCTS } from "@/lib/razorpay/products";

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const body = await request.json() as { product_code?: unknown };
    const code = body.product_code;
    if (code !== "pro_monthly" && code !== "pro_annual") return NextResponse.json({ error: "Invalid product." }, { status: 400 });
    const product = RAZORPAY_PRODUCTS[code];
    if (!product.plan_id || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) throw new Error("Billing is not configured.");
    const subscription = await getRazorpayClient().subscriptions.create({ plan_id: product.plan_id, total_count: code === "pro_monthly" ? 12 : 1, customer_notify: 1, notes: { user_id: user.id, product_code: code } });
    return NextResponse.json({ subscription_id: subscription.id, key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, product_code: code, display_name: product.name, amount: product.amount, currency: product.currency }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to prepare subscription checkout right now." }, { status: 500 });
  }
}
