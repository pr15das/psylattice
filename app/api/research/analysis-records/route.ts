import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_RECORD_JSON_CHARS = 1_500_000;

type AccessContext = {
  ok?: boolean;
  allowed?: boolean;
  access_type?: "owner" | "collaborator";
  role?: string;
  study_id?: string;
  study_title?: string;
  owner_user_id?: string;
  permissions?: Record<string, boolean>;
  error?: string;
};

function reply(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function finiteNonNegative(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

function boundedText(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

async function currentAnalysisAccess(studyId: string) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      access: null,
      ownerUserId: "",
      error: "AUTH" as const,
    };
  }

  const { data: rawAccess, error: accessError } = await supabase.rpc(
    "psylattice_study_access_context",
    { p_study_id: studyId },
  );

  if (accessError) throw accessError;

  const access = rawAccess as AccessContext | null;

  if (!access?.ok || !access.allowed) {
    return {
      supabase,
      user,
      access,
      ownerUserId: "",
      error: "STUDY" as const,
    };
  }

  const hasAnalysisAccess =
    access.access_type === "owner" ||
    access.permissions?.analysis === true;

  if (!hasAnalysisAccess) {
    return {
      supabase,
      user,
      access,
      ownerUserId: "",
      error: "PERMISSION" as const,
    };
  }

  const ownerUserId =
    boundedText(access.owner_user_id, 80) ||
    (access.access_type === "owner" ? user.id : "");

  if (!validUuid(ownerUserId)) {
    return {
      supabase,
      user,
      access,
      ownerUserId: "",
      error: "OWNER" as const,
    };
  }

  return {
    supabase,
    user,
    access,
    ownerUserId,
    error: null,
  };
}

function accessErrorResponse(
  session: Awaited<ReturnType<typeof currentAnalysisAccess>>,
) {
  if (session.error === "AUTH") {
    return reply({ ok: false, error: "Please sign in again." }, 401);
  }

  if (session.error === "PERMISSION") {
    return reply(
      {
        ok: false,
        error: "The study owner has not granted you Analysis Lab access.",
      },
      403,
    );
  }

  if (session.error === "OWNER") {
    return reply(
      {
        ok: false,
        error: "PsyLattice could not resolve the owner of this shared study.",
      },
      500,
    );
  }

  if (session.error === "STUDY") {
    return reply(
      { ok: false, error: "This study is not available to your account." },
      404,
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const session = await currentAnalysisAccess(studyId);
    const accessFailure = accessErrorResponse(session);
    if (accessFailure) return accessFailure;

    const admin = researchAdmin();

    const { data, error } = await admin
      .from("research_analysis_records")
      .select(
        "client_record_id,record_json,analysis_created_at,updated_at,created_by_user_id,created_by_role,created_by_access_type",
      )
      .eq("study_id", studyId)
      .eq("owner_user_id", session.ownerUserId)
      .order("analysis_created_at", { ascending: false })
      .limit(60);

    if (error) throw error;

    return reply({
      ok: true,
      studyId,
      accessType: session.access?.access_type || null,
      role: session.access?.role || null,
      records: (data || []).map((row) => row.record_json),
    });
  } catch (error) {
    console.error("Could not load persisted analysis records:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load saved analysis records." },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const studyId = boundedText(body?.studyId, 80);
    const record = body?.record;

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return reply(
        { ok: false, error: "A valid analysis record is required." },
        400,
      );
    }

    const serialized = JSON.stringify(record);

    if (serialized.length > MAX_RECORD_JSON_CHARS) {
      return reply(
        { ok: false, error: "This analysis record is too large to sync." },
        413,
      );
    }

    if (Number(record.schemaVersion) !== 1) {
      return reply(
        { ok: false, error: "Unsupported analysis record schema." },
        400,
      );
    }

    const clientRecordId = boundedText(record.id, 180);
    const sourceStudyId = boundedText(record?.source?.studyId, 80);
    const sourceMode = boundedText(record?.source?.mode, 30);

    if (
      !clientRecordId ||
      sourceMode !== "study" ||
      sourceStudyId !== studyId
    ) {
      return reply(
        {
          ok: false,
          error:
            "Only study-data analysis records can be persisted to a study.",
        },
        400,
      );
    }

    const analysisCreatedAt = new Date(String(record.createdAt || ""));

    if (!Number.isFinite(analysisCreatedAt.getTime())) {
      return reply(
        { ok: false, error: "The analysis record timestamp is invalid." },
        400,
      );
    }

    const session = await currentAnalysisAccess(studyId);
    const accessFailure = accessErrorResponse(session);
    if (accessFailure) return accessFailure;

    const admin = researchAdmin();

    /*
      Analysis records are derived collaboration artifacts, not edits to raw
      study data. Anyone whom the owner has explicitly granted Analysis Lab
      module access may save them. They remain study-owned and are attributed
      to the collaborator who created/updated them.
    */
    const row = {
      owner_user_id: session.ownerUserId,
      study_id: studyId,
      created_by_user_id: session.user!.id,
      created_by_role: boundedText(session.access?.role, 80) || null,
      created_by_access_type:
        boundedText(session.access?.access_type, 30) || null,

      client_record_id: clientRecordId,
      schema_version: 1,
      analysis_type: boundedText(record.analysis, 80) || "unknown",
      analysis_label: boundedText(record.analysisLabel, 180) || "Analysis",
      title: boundedText(record.title, 400) || "Saved analysis",
      dataset_key: boundedText(record?.source?.datasetKey, 180) || null,
      dataset_label: boundedText(record?.source?.datasetLabel, 300) || null,
      data_fingerprint: boundedText(record.fingerprint, 300) || null,
      source_rows: finiteNonNegative(record?.sample?.sourceRows),
      working_rows: finiteNonNegative(record?.sample?.workingRows),
      after_filters_rows: finiteNonNegative(record?.sample?.afterFiltersRows),
      explicitly_excluded_rows: finiteNonNegative(
        record?.sample?.explicitlyExcludedRows,
      ),
      complete_across_setup_rows: finiteNonNegative(
        record?.sample?.completeAcrossSetupRows,
      ),
      incomplete_across_setup_rows: finiteNonNegative(
        record?.sample?.incompleteAcrossSetupRows,
      ),
      record_json: record,
      analysis_created_at: analysisCreatedAt.toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("research_analysis_records")
      .upsert(row, {
        onConflict: "owner_user_id,client_record_id",
      })
      .select(
        "id,client_record_id,updated_at,created_by_user_id,created_by_role,created_by_access_type",
      )
      .single();

    if (error) throw error;

    return reply({
      ok: true,
      persisted: data,
      sharedStudy: session.access?.access_type === "collaborator",
    });
  } catch (error) {
    console.error("Could not persist analysis record:", error);
    return reply(
      { ok: false, error: "PsyLattice could not sync this analysis record." },
      500,
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";

    const clientRecordId =
      request.nextUrl.searchParams.get("client_record_id")?.trim() ||
      request.nextUrl.searchParams.get("recordId")?.trim() ||
      "";

    if (!validUuid(studyId) || !clientRecordId) {
      return reply(
        {
          ok: false,
          error: "A valid study_id and client_record_id are required.",
        },
        400,
      );
    }

    const session = await currentAnalysisAccess(studyId);
    const accessFailure = accessErrorResponse(session);
    if (accessFailure) return accessFailure;

    const admin = researchAdmin();

    /*
      The Analysis Lab module permission controls study-linked analysis
      artifacts. Deleting an analysis record never deletes participant data,
      questionnaire data, cognitive data, or the study itself.
    */
    const { error } = await admin
      .from("research_analysis_records")
      .delete()
      .eq("study_id", studyId)
      .eq("owner_user_id", session.ownerUserId)
      .eq("client_record_id", clientRecordId);

    if (error) throw error;

    return reply({ ok: true });
  } catch (error) {
    console.error("Could not delete persisted analysis record:", error);
    return reply(
      { ok: false, error: "PsyLattice could not delete this analysis record." },
      500,
    );
  }
}
