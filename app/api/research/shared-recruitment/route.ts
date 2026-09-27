import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getResearcherEntitlements } from "@/lib/billing/server";
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
  study_status?: string;
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

async function sessionFor(studyId: string) {
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

function canRecruit(access: AccessContext | null) {
  return Boolean(
    access?.ok &&
      access.allowed &&
      (access.access_type === "owner" ||
        access.permissions?.recruitment === true),
  );
}

async function logRecruitmentActivity(
  studyId: string,
  actorUserId: string,
  action: string,
  metadata: Record<string, unknown>,
) {
  const admin = researchAdmin();
  const { error } = await admin.from("study_collaboration_activity").insert({
    study_id: studyId,
    actor_user_id: actorUserId,
    action,
    metadata,
  });
  if (error) throw error;
}

const linkSelect =
  "id,study_id,owner_user_id,name,token,access_mode,max_participants,starts_at,ends_at,allow_multiple_submissions,is_test_link,status,created_at,updated_at";

export async function GET(request: NextRequest) {
  try {
    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() || "";

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const session = await sessionFor(studyId);
    if (!session.user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (!canRecruit(session.access)) {
      return reply(
        {
          ok: false,
          error: "The study owner has not granted you Recruitment access.",
        },
        403,
      );
    }

    const ownerUserId = String(session.access?.owner_user_id || "").trim();
    const admin = researchAdmin();

    const { data: links, error: linkError } = await admin
      .from("study_links")
      .select(linkSelect)
      .eq("study_id", studyId)
      .eq("owner_user_id", ownerUserId)
      .order("created_at", { ascending: false });

    if (linkError) throw linkError;

    const linkIds = (links || []).map((link) => link.id);
    const { data: participants, error: participantError } =
      linkIds.length > 0
        ? await admin
            .from("study_participants")
            .select("id,study_link_id,is_test,status")
            .eq("study_id", studyId)
            .in("study_link_id", linkIds)
        : { data: [], error: null };

    if (participantError) throw participantError;

    const entitlements = await getResearcherEntitlements(ownerUserId, studyId);

    const decorated = (links || []).map((link) => {
      const linked = (participants || []).filter(
        (participant) => participant.study_link_id === link.id,
      );
      return {
        ...link,
        participant_count: linked.filter(
          (participant) => participant.status !== "withdrawn",
        ).length,
      };
    });

    return reply({
      ok: true,
      access: {
        role: session.access?.role || null,
        canEdit:
          session.access?.access_type === "owner" ||
          session.access?.permissions?.can_edit === true,
        canCloseRecruitment:
          session.access?.access_type === "owner" ||
          session.access?.permissions?.can_close_recruitment === true,
      },
      study: {
        title: session.access?.study_title || "Shared study",
        status: session.access?.study_status || null,
      },
      ownerEntitlements: {
        planName: entitlements.planName,
        activeStudies: entitlements.studies.activeCount,
        remainingActiveSlots: entitlements.studies.remainingActiveSlots,
        participantLimit:
          entitlements.participants.effectiveLimitForSelectedStudy,
        currentParticipants:
          entitlements.participants.currentForSelectedStudy,
        remainingParticipants:
          entitlements.participants.remainingForSelectedStudy,
      },
      links: decorated,
    });
  } catch (error) {
    console.error("Shared Recruitment GET failed:", error);
    return reply(
      {
        ok: false,
        error: "PsyLattice could not load recruitment links right now.",
      },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const studyId = String(body?.studyId || "").trim();

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const session = await sessionFor(studyId);
    if (!session.user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }
    if (!canRecruit(session.access)) {
      return reply(
        {
          ok: false,
          error: "The study owner has not granted you Recruitment access.",
        },
        403,
      );
    }
    if (
      session.access?.access_type !== "owner" &&
      session.access?.permissions?.can_edit !== true
    ) {
      return reply(
        { ok: false, error: "Your Recruitment access is read-only." },
        403,
      );
    }

    const ownerUserId = String(session.access?.owner_user_id || "").trim();
    const admin = researchAdmin();
    const operation = String(body?.operation || "");

    if (operation === "close_link") {
      const canClose =
        session.access?.access_type === "owner" ||
        session.access?.permissions?.can_close_recruitment === true;
      if (!canClose) {
        return reply(
          { ok: false, error: "Close-recruitment permission is required." },
          403,
        );
      }

      const linkId = String(body?.linkId || "").trim();
      const reason = boundedText(body?.reason, 500);
      if (!validUuid(linkId)) {
        return reply({ ok: false, error: "A valid linkId is required." }, 400);
      }
      if (reason.length < 3) {
        return reply(
          { ok: false, error: "Add a short reason for closing this link." },
          400,
        );
      }

      const { data: existing, error: existingError } = await admin
        .from("study_links")
        .select(linkSelect)
        .eq("id", linkId)
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing) {
        return reply({ ok: false, error: "That participant link was not found." }, 404);
      }
      if (existing.status === "closed") {
        return reply({ ok: true, link: existing });
      }

      const { data, error } = await admin
        .from("study_links")
        .update({ status: "closed" })
        .eq("id", linkId)
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .select(linkSelect)
        .single();

      if (error) throw error;

      await logRecruitmentActivity(
        studyId,
        session.user.id,
        "shared_recruitment_link_closed",
        {
          link_id: data.id,
          link_name: data.name,
          reason,
          actor_role: session.access?.role || null,
        },
      );

      return reply({ ok: true, link: data });
    }

    if (operation === "set_status") {
      const linkId = String(body?.linkId || "").trim();
      const status = String(body?.status || "");

      if (!validUuid(linkId) || !["active", "paused"].includes(status)) {
        return reply(
          { ok: false, error: "Invalid recruitment link update." },
          400,
        );
      }

      const { data: existing, error: existingError } = await admin
        .from("study_links")
        .select(linkSelect)
        .eq("id", linkId)
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing) {
        return reply({ ok: false, error: "That participant link was not found." }, 404);
      }
      if (existing.status === "closed") {
        return reply(
          { ok: false, error: "A closed link cannot be resumed." },
          409,
        );
      }

      const { data, error } = await admin
        .from("study_links")
        .update({ status })
        .eq("id", linkId)
        .eq("study_id", studyId)
        .eq("owner_user_id", ownerUserId)
        .select(linkSelect)
        .single();

      if (error) throw error;

      await logRecruitmentActivity(
        studyId,
        session.user.id,
        "shared_recruitment_link_status_changed",
        {
          link_id: data.id,
          link_name: data.name,
          from_status: existing.status,
          to_status: status,
          actor_role: session.access?.role || null,
        },
      );

      return reply({ ok: true, link: data });
    }

    if (operation !== "create_link") {
      return reply(
        { ok: false, error: "Unsupported Recruitment operation." },
        400,
      );
    }

    const name = boundedText(body?.name, 160) || "Participant link";
    const isTest = body?.isTest === true;
    const requestedLimit = Math.max(
      1,
      Math.min(1_000_000, Math.round(Number(body?.participantLimit) || 1)),
    );

    const entitlements = await getResearcherEntitlements(ownerUserId, studyId);
    const effectiveLimit =
      entitlements.participants.effectiveLimitForSelectedStudy;

    if (!isTest && requestedLimit > effectiveLimit) {
      return reply(
        {
          ok: false,
          error: `This study currently supports ${effectiveLimit} participants. The study owner must purchase additional participant capacity before creating a larger live link.`,
        },
        403,
      );
    }

    const { data: study, error: studyError } = await admin
      .from("research_studies")
      .select("id,status")
      .eq("id", studyId)
      .eq("owner_user_id", ownerUserId)
      .single();

    if (studyError) throw studyError;

    if (!isTest && study.status !== "active") {
      if (entitlements.studies.remainingActiveSlots <= 0) {
        return reply(
          {
            ok: false,
            error:
              "The study owner has no simultaneous-study slot available. The owner must change plan/study status before a live participant link can activate this study.",
          },
          403,
        );
      }

      const { error: activateError } = await admin
        .from("research_studies")
        .update({ status: "active" })
        .eq("id", studyId)
        .eq("owner_user_id", ownerUserId);

      if (activateError) throw activateError;
    }

    const { data: inserted, error: insertError } = await admin
      .from("study_links")
      .insert({
        study_id: studyId,
        owner_user_id: ownerUserId,
        name,
        access_mode: "open",
        max_participants: isTest ? null : requestedLimit,
        allow_multiple_submissions: false,
        is_test_link: isTest,
        status: "active",
      })
      .select(linkSelect)
      .single();

    if (insertError) throw insertError;

    await logRecruitmentActivity(
      studyId,
      session.user.id,
      "shared_recruitment_link_created",
      {
        link_id: inserted.id,
        link_name: inserted.name,
        is_test_link: inserted.is_test_link,
        max_participants: inserted.max_participants,
        actor_role: session.access?.role || null,
      },
    );

    return reply({
      ok: true,
      link: { ...inserted, participant_count: 0 },
    });
  } catch (error) {
    console.error("Shared Recruitment POST failed:", error);
    return reply(
      {
        ok: false,
        error: "PsyLattice could not update recruitment right now.",
      },
      500,
    );
  }
}
