import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayClient } from "@/lib/razorpay/server";
import { RAZORPAY_PRODUCTS } from "@/lib/razorpay/products";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return errorResponse("Please sign in before starting checkout.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    if (body.product_code !== "study_pass") return errorResponse("That product is not available.");

    const product = RAZORPAY_PRODUCTS.study_pass;
    const order = await getRazorpayClient().orders.create({
      amount: product.amount,
      currency: product.currency,
      receipt: `pl-${user.id.slice(0, 8)}-${Date.now()}`,
      notes: { user_id: user.id, product_code: product.code },
    });

    return NextResponse.json({ ok: true, order_id: order.id, amount: product.amount, currency: product.currency, key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, product_name: product.name }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse("Unable to prepare Razorpay checkout right now.", 500);
  }
}
