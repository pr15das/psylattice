import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayClient, getRazorpayKeySecret } from "@/lib/razorpay/server";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return errorResponse("Please sign in before verifying payment.", 401);

    const body = (await request.json()) as Record<string, unknown>;
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
    if (body.product_code !== "study_pass" || !paymentId || !orderId || !signature) return errorResponse("The payment details are incomplete.");

    const order = await getRazorpayClient().orders.fetch(orderId);
    if (order.notes?.user_id !== user.id || order.notes?.product_code !== "study_pass") return errorResponse("Payment verification failed.", 400);

    const expected = createHmac("sha256", getRazorpayKeySecret()).update(`${orderId}|${paymentId}`).digest("hex");
    const valid = expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!valid) return errorResponse("Payment verification failed.", 400);

    return NextResponse.json({ success: true, product_code: "study_pass" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return errorResponse("Unable to verify the payment right now.", 500);
  }
}
