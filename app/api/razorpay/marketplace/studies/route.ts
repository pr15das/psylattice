import { NextResponse } from "next/server";
import { authenticatedBillingUser, billingAdmin } from "@/lib/razorpay/marketplaceServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Please sign in again." }, { status: 401 });
    }

    const admin = billingAdmin();
    const { data, error } = await admin
      .from("research_studies")
      .select("id, title, status, updated_at")
      .eq("owner_user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        studies: (data || []).map((study: any) => ({
          id: study.id,
          title: study.title || "Untitled research study",
          status: study.status || "draft",
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Could not load billing study choices:", error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not load your studies for checkout." },
      { status: 500 },
    );
  }
}
