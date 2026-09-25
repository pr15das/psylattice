import { NextRequest, NextResponse } from "next/server";
import { billingAdmin } from "@/lib/billing/server";
import { adminErrorResponse, requireAdmin } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PLANS = new Set(["free", "study-pass", "pro-monthly", "pro-annual"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeSearch(value: string) {
  // PostgREST `.or()` uses commas/parentheses as syntax. Strip those control
  // characters rather than letting an Admin search string alter the filter.
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ").slice(0, 160);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const admin = billingAdmin();

    const page = Math.max(1, Math.floor(Number(request.nextUrl.searchParams.get("page") || 1)));
    const pageSize = Math.min(
      100,
      Math.max(10, Math.floor(Number(request.nextUrl.searchParams.get("pageSize") || 50))),
    );
    const rawSearch = String(request.nextUrl.searchParams.get("q") || "");
    const search = safeSearch(rawSearch);
    const plan = String(request.nextUrl.searchParams.get("plan") || "all");

    let query = admin
      .from("psylattice_admin_account_directory")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (plan !== "all") {
      if (!PLANS.has(plan)) {
        return NextResponse.json(
          { ok: false, error: "Choose a supported plan filter." },
          { status: 400 },
        );
      }
      query = query.eq("effective_plan", plan);
    }

    if (search) {
      const pattern = `%${search}%`;
      const filters = [
        `email.ilike.${pattern}`,
        `full_name.ilike.${pattern}`,
        `institution_name.ilike.${pattern}`,
      ];
      if (UUID_PATTERN.test(search)) filters.push(`user_id.eq.${search}`);
      query = query.or(filters.join(","));
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        users: data || [],
        total: count || 0,
        page,
        pageSize,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Admin user list failed:", error);
    const safe = adminErrorResponse(error);
    return NextResponse.json({ ok: false, error: safe.message }, { status: safe.status });
  }
}
