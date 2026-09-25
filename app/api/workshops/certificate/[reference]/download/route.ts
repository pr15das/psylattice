import { NextResponse } from "next/server";
import {
  buildWorkshopCertificatePdf,
  loadPublicWorkshopCertificate,
} from "@/lib/workshops/certificate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ reference: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { reference } = await context.params;
    const certificate = await loadPublicWorkshopCertificate(reference);

    if (!certificate) {
      return NextResponse.json(
        { ok: false, error: "This workshop certificate has not been issued." },
        { status: 404 },
      );
    }

    const pdf = await buildWorkshopCertificatePdf(certificate);
    const filename = `PsyLattice-Workshop-Certificate-${certificate.workshop_reference}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Workshop certificate PDF generation failed:", error);
    return NextResponse.json(
      { ok: false, error: "PsyLattice could not generate this certificate right now." },
      { status: 500 },
    );
  }
}
