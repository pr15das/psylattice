import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccessContext = {
  ok?: boolean;
  allowed?: boolean;
  access_type?: "owner" | "collaborator";
  role?: string;
  study_title?: string;
  permissions?: Record<string, boolean>;
  error?: string;
};

function reply(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function boundedText(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

async function resolveExportAccess(studyId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, access: null as AccessContext | null };
  }

  const { data, error } = await supabase.rpc(
    "psylattice_study_access_context",
    { p_study_id: studyId },
  );
  if (error) throw error;

  return { user, access: data as AccessContext | null };
}

function canExport(access: AccessContext | null) {
  return Boolean(
    access?.ok &&
      access.allowed &&
      (access.access_type === "owner" || access.permissions?.exports === true),
  );
}

export async function GET(request: NextRequest) {
  try {
    const studyId = request.nextUrl.searchParams.get("study_id")?.trim() || "";

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const session = await resolveExportAccess(studyId);
    if (!session.user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (!canExport(session.access)) {
      return reply(
        { ok: false, error: "The study owner has not granted you Export access." },
        403,
      );
    }

    const admin = researchAdmin();
    const { data, error } = await admin
      .from("study_collaboration_activity")
      .select("id,action,metadata,created_at")
      .eq("study_id", studyId)
      .eq("actor_user_id", session.user.id)
      .eq("action", "shared_export_generated")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) throw error;

    return reply({
      ok: true,
      exports: data || [],
    });
  } catch (error) {
    console.error("Shared export history GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load shared export history." },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studyId = boundedText(body?.studyId, 80);

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const session = await resolveExportAccess(studyId);
    if (!session.user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (!canExport(session.access)) {
      return reply(
        { ok: false, error: "The study owner has not granted you Export access." },
        403,
      );
    }

    const format = boundedText(body?.format, 16).toLowerCase();
    if (!['xlsx', 'csv'].includes(format)) {
      return reply({ ok: false, error: "Unsupported export format." }, 400);
    }

    const datasets = Array.isArray(body?.datasets)
      ? body.datasets
          .map((value: unknown) => boundedText(value, 80))
          .filter(Boolean)
          .slice(0, 16)
      : [];

    if (datasets.length === 0) {
      return reply({ ok: false, error: "At least one exported dataset is required." }, 400);
    }

    const rowCounts =
      body?.rowCounts && typeof body.rowCounts === "object" && !Array.isArray(body.rowCounts)
        ? body.rowCounts
        : {};

    const admin = researchAdmin();
    const { error } = await admin.from("study_collaboration_activity").insert({
      study_id: studyId,
      actor_user_id: session.user.id,
      action: "shared_export_generated",
      metadata: {
        role: session.access?.role || null,
        format,
        datasets,
        row_counts: rowCounts,
        include_test_data: body?.includeTestData === true,
        include_codebook: body?.includeCodebook === true,
        filename: boundedText(body?.filename, 220) || null,
        direct_identifiers_included: false,
        identity_mode: "pseudonymous",
      },
    });

    if (error) throw error;

    return reply({ ok: true });
  } catch (error) {
    console.error("Shared export log POST failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not record this shared export." },
      500,
    );
  }
}
