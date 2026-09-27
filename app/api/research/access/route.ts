import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }

    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";

    if (studyId) {
      if (!validUuid(studyId)) {
        return reply({ ok: false, error: "A valid study_id is required." }, 400);
      }

      const { data, error } = await supabase.rpc(
        "psylattice_study_access_context",
        { p_study_id: studyId },
      );

      if (error) throw error;

      const access = data as
        | {
            ok?: boolean;
            allowed?: boolean;
            access_type?: "owner" | "collaborator";
            role?: string;
            study_id?: string;
            study_title?: string;
            owner_user_id?: string;
            study_status?: string;
            permissions?: Record<string, boolean>;
            error?: string;
          }
        | null;

      if (!access?.ok) {
        return reply(
          { ok: false, error: access?.error || "Study access could not be resolved." },
          404,
        );
      }

      return reply({ ok: true, access });
    }

    const { data, error } = await supabase.rpc("psylattice_my_study_access");
    if (error) throw error;

    return reply({
      ok: true,
      studies: Array.isArray(data) ? data : [],
    });
  } catch (error) {
    console.error("Research access GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not resolve research access right now." },
      500,
    );
  }
}
