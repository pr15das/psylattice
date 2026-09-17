import { NextResponse } from "next/server";
import { loadPublicWorkshopCertificate } from "@/lib/workshops/certificate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ reference: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { reference } = await context.params;
    const certificate = await loadPublicWorkshopCertificate(reference);

    if (!certificate) {
      return NextResponse.json(
        {
          ok: false,
          error: "No issued PsyLattice workshop certificate was found for that reference.",
        },
        { status: 404, headers: { "Cache-Control": "public, max-age=60" } },
      );
    }

    return NextResponse.json(
      { ok: true, certificate },
      { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Public workshop certificate lookup failed:", error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not verify this certificate right now." },
      { status: 500 },
    );
  }
}
