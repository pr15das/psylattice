import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getResearcherEntitlements } from "@/lib/billing/server";
import { buildStudyHealthReport } from "@/lib/research/health/engine";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

type StudyAccessContext = {
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
};

export async function GET(request: NextRequest) {
  try {
    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";

    if (!studyId || !validUuid(studyId)) {
      return jsonError("A valid study_id is required.", 400);
    }

    const sessionSupabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await sessionSupabase.auth.getUser();

    if (userError || !user) {
      return jsonError("Please sign in again.", 401);
    }

    const { data: rawAccess, error: accessError } = await sessionSupabase.rpc(
      "psylattice_study_access_context",
      { p_study_id: studyId },
    );

    if (accessError) throw accessError;

    const access = rawAccess as StudyAccessContext | null;

    if (!access?.ok || !access.allowed) {
      return jsonError(
        access?.error || "This study is not available to your researcher account.",
        403,
      );
    }

    const isOwner = access.access_type === "owner";
    const canUseStudyHealth =
      isOwner || access.permissions?.study_health === true;

    if (!canUseStudyHealth) {
      return jsonError(
        "The study owner has not granted you Study Health access.",
        403,
      );
    }

    const ownerUserId = String(access.owner_user_id || "").trim();
    if (!validUuid(ownerUserId)) {
      return jsonError("The study owner could not be resolved.", 500);
    }

    // Study-specific entitlements always belong to the owner of the study,
    // even when a collaborator is viewing the study. This means a shared study
    // never consumes the collaborator's simultaneous-study slots or study add-ons.
    const ownerEntitlements = await getResearcherEntitlements(
      ownerUserId,
      studyId,
    );

    if (
      !ownerEntitlements.hasPro &&
      ownerEntitlements.hasAnyStudyPass &&
      !ownerEntitlements.selectedStudyHasPass
    ) {
      return jsonError(
        "Study Health is not available for this study under the owner's current Study Pass.",
        403,
      );
    }

    // Collaborators are intentionally NOT granted direct table-level access to
    // participant/research rows. After the permission check above, the server
    // reads the owner's study through the service client and only returns the
    // existing aggregated Study Health report.
    const admin = researchAdmin();
    const report = await buildStudyHealthReport(
      admin,
      ownerUserId,
      studyId,
    );

    return NextResponse.json(
      {
        ok: true,
        access: {
          accessType: access.access_type || null,
          role: access.role || null,
          isOwner,
        },
        report,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Could not build Study Health report:", error);
    return jsonError(
      "PsyLattice could not build Study Health for this study right now.",
      500,
    );
  }
}
