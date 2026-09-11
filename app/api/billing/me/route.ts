import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedBillingUser,
  getResearcherEntitlements,
} from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    const studyId = request.nextUrl.searchParams.get("studyId")?.trim() || null;
    const entitlements = await getResearcherEntitlements(user.id, studyId);

    return NextResponse.json(
      {
        ok: true,
        entitlements,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Could not load PsyLattice entitlements:", error);

    const message = error instanceof Error ? error.message : "";
    const notOwned = message.includes("does not belong to this researcher account");

    return NextResponse.json(
      {
        ok: false,
        error: notOwned
          ? "The selected research study is unavailable."
          : "PsyLattice could not load your account access right now.",
      },
      { status: notOwned ? 404 : 500 },
    );
  }
}
