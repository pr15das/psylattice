import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanSearch(value: string) {
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ").slice(0, 120);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const admin = billingAdmin();
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(10, Number(request.nextUrl.searchParams.get("pageSize") || 40)));
    const rawSearch = cleanSearch(request.nextUrl.searchParams.get("q") || "");
    const plan = request.nextUrl.searchParams.get("plan") || "all";

    let query = admin
      .from("psylattice_admin_account_directory")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (plan !== "all" && ["free", "study-pass", "pro-monthly", "pro-annual"].includes(plan)) {
      query = query.eq("effective_plan", plan);
    }

    if (rawSearch) {
      if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(rawSearch)) {
        query = query.eq("user_id", rawSearch);
      } else {
        const like = `*${rawSearch}*`;
        query = query.or(`email.ilike.${like},full_name.ilike.${like},institution_name.ilike.${like}`);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        users: data || [],
        page,
        pageSize,
        total: count || 0,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin users list failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
