import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_RECORD_JSON_CHARS = 1_500_000;

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

async function currentUserAndOwnedStudy(studyId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, user: null, study: null, error: "AUTH" as const };
  }

  const { data: study, error: studyError } = await supabase
    .from("research_studies")
    .select("id")
    .eq("id", studyId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (studyError) throw studyError;

  return {
    supabase,
    user,
    study,
    error: study ? null : ("STUDY" as const),
  };
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

    const session = await currentUserAndOwnedStudy(studyId);
    if (session.error === "AUTH") {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (session.error === "STUDY") {
      return reply(
        { ok: false, error: "This study is not available to your account." },
        404,
      );
    }

    const { data, error } = await session.supabase
      .from("research_analysis_records")
      .select("client_record_id,record_json,analysis_created_at,updated_at")
      .eq("study_id", studyId)
      .eq("owner_user_id", session.user!.id)
      .order("analysis_created_at", { ascending: false })
      .limit(60);

    if (error) throw error;

    return reply({
      ok: true,
      studyId,
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
      return reply({ ok: false, error: "A valid analysis record is required." }, 400);
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

    const session = await currentUserAndOwnedStudy(studyId);
    if (session.error === "AUTH") {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (session.error === "STUDY") {
      return reply(
        { ok: false, error: "This study is not available to your account." },
        404,
      );
    }

    const row = {
      owner_user_id: session.user!.id,
      study_id: studyId,
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

    const { data, error } = await session.supabase
      .from("research_analysis_records")
      .upsert(row, {
        onConflict: "owner_user_id,client_record_id",
      })
      .select("id,client_record_id,updated_at")
      .single();

    if (error) throw error;

    return reply({ ok: true, persisted: data });
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

    const session = await currentUserAndOwnedStudy(studyId);
    if (session.error === "AUTH") {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (session.error === "STUDY") {
      return reply(
        { ok: false, error: "This study is not available to your account." },
        404,
      );
    }

    const { error } = await session.supabase
      .from("research_analysis_records")
      .delete()
      .eq("study_id", studyId)
      .eq("owner_user_id", session.user!.id)
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
