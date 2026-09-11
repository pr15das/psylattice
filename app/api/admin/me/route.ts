import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = await getAdminSession();
    return NextResponse.json(
      { ok: true, isAdmin: Boolean(admin), admin },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin identity check failed:", error);
    return NextResponse.json(
      { ok: false, isAdmin: false },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
