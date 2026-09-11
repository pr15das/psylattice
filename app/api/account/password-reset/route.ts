import { NextResponse } from "next/server";
import { authenticatedBillingUser } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await authenticatedBillingUser();
    if (!user?.email) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    const supabase = await createClient();
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.PSYLATTICE_APP_URL ||
      "http://localhost:3000";

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${baseUrl.replace(/\/$/, "")}/reset-password`,
    });

    if (error) throw error;

    return NextResponse.json(
      { ok: true, message: "Password reset link sent to your verified email." },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Account password reset failed:", error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not send the password reset email." },
      { status: 500 },
    );
  }
}
