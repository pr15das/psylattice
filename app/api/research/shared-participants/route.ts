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
  owner_user_id?: string;
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

export async function GET(request: NextRequest) {
  try {
    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() || "";

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }

    const { data: rawAccess, error: accessError } = await supabase.rpc(
      "psylattice_study_access_context",
      { p_study_id: studyId },
    );
    if (accessError) throw accessError;

    const access = rawAccess as AccessContext | null;
    const allowed =
      access?.ok &&
      access.allowed &&
      (access.access_type === "owner" ||
        access.permissions?.participants === true);

    if (!allowed) {
      return reply(
        {
          ok: false,
          error: "The study owner has not granted you Participants access.",
        },
        403,
      );
    }

    const ownerUserId = String(access?.owner_user_id || "").trim();
    const admin = researchAdmin();

    const [
      participantResult,
      sessionResult,
      responseResult,
      linkResult,
      consentResult,
    ] = await Promise.all([
      admin
        .from("study_participants")
        .select(
          "id,public_id,study_link_id,status,completed_at,is_test,enrolled_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .order("enrolled_at", { ascending: false }),

      admin
        .from("participant_sessions")
        .select("id,participant_id,status,started_at,completed_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId),

      admin
        .from("research_responses")
        .select("id,participant_id")
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId),

      admin
        .from("study_links")
        .select("id,name,is_test_link,status")
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId),

      admin
        .from("participant_consents")
        .select("participant_id,consented,consented_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .order("consented_at", { ascending: false }),
    ]);

    const failed = [
      participantResult,
      sessionResult,
      responseResult,
      linkResult,
      consentResult,
    ].find((result) => result.error);

    if (failed?.error) throw failed.error;

    const links = new Map(
      (linkResult.data || []).map((link) => [link.id, link]),
    );

    const latestConsent = new Map<
      string,
      { consented: boolean; consented_at: string | null }
    >();

    for (const consent of consentResult.data || []) {
      if (!latestConsent.has(consent.participant_id)) {
        latestConsent.set(consent.participant_id, {
          consented: consent.consented === true,
          consented_at: consent.consented_at || null,
        });
      }
    }

    const participants = (participantResult.data || []).map((participant) => {
      const sessions = (sessionResult.data || []).filter(
        (session) => session.participant_id === participant.id,
      );
      const responseCount = (responseResult.data || []).filter(
        (response) => response.participant_id === participant.id,
      ).length;
      const link = participant.study_link_id
        ? links.get(participant.study_link_id)
        : null;
      const consent = latestConsent.get(participant.id);

      return {
        public_id: participant.public_id,
        status: participant.status,
        is_test: participant.is_test,
        consented_at:
          consent?.consented === true ? consent.consented_at : null,
        demographic_status: null,
        measures_status: null,
        completed_at: participant.completed_at,
        enrolled_at: participant.enrolled_at,
        link_name: link?.name || "",
        link_type: link?.is_test_link ? "TEST" : "LIVE",
        sessions: sessions.length,
        completed_sessions: sessions.filter(
          (session) => session.status === "completed",
        ).length,
        responses: responseCount,
      };
    });

    return reply({
      ok: true,
      access: {
        role: access?.role || null,
        canEdit:
          access?.access_type === "owner" ||
          access?.permissions?.can_edit === true,
        canWithdrawParticipants:
          access?.access_type === "owner" ||
          access?.permissions?.can_withdraw_participants === true,
      },
      study: {
        title: access?.study_title || "Shared study",
      },
      privacy: {
        identityMode: "pseudonymous",
        participantCodesIncluded: false,
        directDemographicsIncluded: false,
      },
      participants,
    });
  } catch (error) {
    console.error("Shared Participants GET failed:", error);
    return reply(
      {
        ok: false,
        error: "PsyLattice could not load participants right now.",
      },
      500,
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studyId = String(body?.studyId || "").trim();
    const operation = String(body?.operation || "").trim();

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }
    if (operation !== "withdraw_participant") {
      return reply({ ok: false, error: "Unsupported participant operation." }, 400);
    }

    const publicId = String(body?.publicId || "").trim().slice(0, 120);
    const reason = String(body?.reason || "").trim().slice(0, 500);
    if (!publicId) {
      return reply({ ok: false, error: "A participant identifier is required." }, 400);
    }
    if (reason.length < 3) {
      return reply({ ok: false, error: "Add a short withdrawal reason." }, 400);
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }

    const { data: rawAccess, error: accessError } = await supabase.rpc(
      "psylattice_study_access_context",
      { p_study_id: studyId },
    );
    if (accessError) throw accessError;

    const access = rawAccess as AccessContext | null;
    const canUseModule =
      access?.ok &&
      access.allowed &&
      (access.access_type === "owner" ||
        access.permissions?.participants === true);
    const canEdit =
      access?.access_type === "owner" ||
      access?.permissions?.can_edit === true;
    const canWithdraw =
      access?.access_type === "owner" ||
      access?.permissions?.can_withdraw_participants === true;

    if (!canUseModule) {
      return reply(
        { ok: false, error: "Participants access is required." },
        403,
      );
    }
    if (!canEdit || !canWithdraw) {
      return reply(
        { ok: false, error: "Participant-withdrawal permission is required." },
        403,
      );
    }

    const ownerUserId = String(access?.owner_user_id || "").trim();
    const admin = researchAdmin();

    const { data: participant, error: participantError } = await admin
      .from("study_participants")
      .select("id,public_id,status,is_test,study_link_id,enrolled_at,completed_at")
      .eq("study_id", studyId)
      .eq("owner_user_id", ownerUserId)
      .eq("public_id", publicId)
      .maybeSingle();

    if (participantError) throw participantError;
    if (!participant) {
      return reply({ ok: false, error: "That participant was not found." }, 404);
    }
    if (participant.status === "withdrawn") {
      return reply({ ok: true, participant });
    }

    const previousStatus = participant.status;

    const { data: updated, error: updateError } = await admin
      .from("study_participants")
      .update({ status: "withdrawn" })
      .eq("id", participant.id)
      .eq("study_id", studyId)
      .eq("owner_user_id", ownerUserId)
      .select("id,public_id,status,is_test,study_link_id,enrolled_at,completed_at")
      .single();

    if (updateError) throw updateError;

    const { error: sessionError } = await admin
      .from("participant_sessions")
      .update({ status: "abandoned" })
      .eq("participant_id", participant.id)
      .eq("study_id", studyId)
      .eq("owner_user_id", ownerUserId)
      .eq("status", "in_progress");

    if (sessionError) throw sessionError;

    const { error: auditError } = await admin
      .from("study_collaboration_activity")
      .insert({
        study_id: studyId,
        actor_user_id: user.id,
        action: "shared_participant_withdrawn",
        metadata: {
          participant_public_id: participant.public_id,
          previous_status: previousStatus,
          is_test: participant.is_test,
          reason,
          actor_role: access?.role || null,
        },
      });

    if (auditError) throw auditError;

    return reply({ ok: true, participant: updated });
  } catch (error) {
    console.error("Shared Participants POST failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not update this participant right now." },
      500,
    );
  }
}
