import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StudyRole = "supervisor" | "researcher" | "analyst" | "viewer";

const ROLE_DEFAULTS: Record<StudyRole, Record<string, boolean>> = {
  supervisor: {
    study_builder: true,
    recruitment: true,
    participants: true,
    data_explorer: true,
    analysis: true,
    thesis: true,
    study_health: true,
    exports: false,
    can_edit: false,
    can_comment: true,
    can_review: true,
    can_manage_structure: false,
    can_close_recruitment: false,
    can_withdraw_participants: false,
  },
  researcher: {
    study_builder: true,
    recruitment: true,
    participants: true,
    data_explorer: true,
    analysis: true,
    thesis: true,
    study_health: true,
    exports: false,
    can_edit: true,
    can_comment: true,
    can_review: true,
    can_manage_structure: false,
    can_close_recruitment: false,
    can_withdraw_participants: false,
  },
  analyst: {
    study_builder: false,
    recruitment: false,
    participants: false,
    data_explorer: true,
    analysis: true,
    thesis: false,
    study_health: true,
    exports: true,
    can_edit: true,
    can_comment: true,
    can_review: true,
    can_manage_structure: false,
    can_close_recruitment: false,
    can_withdraw_participants: false,
  },
  viewer: {
    study_builder: true,
    recruitment: false,
    participants: false,
    data_explorer: false,
    analysis: false,
    thesis: true,
    study_health: true,
    exports: false,
    can_edit: false,
    can_comment: false,
    can_review: false,
    can_manage_structure: false,
    can_close_recruitment: false,
    can_withdraw_participants: false,
  },
};

const PERMISSION_KEYS = new Set(
  Object.keys(ROLE_DEFAULTS.supervisor),
);

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

function validRole(value: unknown): value is StudyRole {
  return (
    value === "supervisor" ||
    value === "researcher" ||
    value === "analyst" ||
    value === "viewer"
  );
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePermissions(
  value: unknown,
  role: StudyRole,
): Record<string, boolean> {
  const base = { ...ROLE_DEFAULTS[role] };
  if (!value || typeof value !== "object" || Array.isArray(value)) return base;

  for (const [key, enabled] of Object.entries(value as Record<string, unknown>)) {
    if (!PERMISSION_KEYS.has(key)) continue;
    base[key] = enabled === true;
  }

  if (role === "viewer") {
    base.can_edit = false;
  }

  // High-risk actions are explicit owner opt-ins. They never follow a role
  // automatically and require both Edit + the matching module permission.
  if (!base.can_edit) {
    base.can_manage_structure = false;
    base.can_close_recruitment = false;
    base.can_withdraw_participants = false;
  }
  if (!base.study_builder) base.can_manage_structure = false;
  if (!base.recruitment) base.can_close_recruitment = false;
  if (!base.participants) base.can_withdraw_participants = false;

  return base;
}

async function authenticated() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

async function ownedStudy(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
  studyId: string,
) {
  const { data, error } = await supabase
    .from("research_studies")
    .select("id,title,status,updated_at")
    .eq("id", studyId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  values: {
    studyId: string;
    actorUserId: string;
    action: string;
    targetUserId?: string | null;
    targetEmail?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await supabase
    .from("study_collaboration_activity")
    .insert({
      study_id: values.studyId,
      actor_user_id: values.actorUserId,
      action: values.action,
      target_user_id: values.targetUserId || null,
      target_email: values.targetEmail || null,
      metadata: values.metadata || {},
    });

  if (error) throw error;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await authenticated();
    if (!user) return reply({ ok: false, error: "Please sign in again." }, 401);

    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";

    if (!studyId) {
      const email = normalizeEmail(user.email);

      const [studyResult, incomingResult, membershipResult] = await Promise.all([
        supabase
          .from("research_studies")
          .select("id,title,status,updated_at")
          .eq("owner_user_id", user.id)
          .order("updated_at", { ascending: false }),
        email
          ? supabase
              .from("study_collaboration_invites")
              .select(
                "id,study_id,study_title,email,role,permissions,status,expires_at,created_at",
              )
              .eq("status", "pending")
              .gt("expires_at", new Date().toISOString())
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("study_collaborators")
          .select(
            "id,study_id,email,display_name,role,permissions,status,accepted_at,updated_at",
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("updated_at", { ascending: false }),
      ]);

      if (studyResult.error) throw studyResult.error;
      if (incomingResult.error) throw incomingResult.error;
      if (membershipResult.error) throw membershipResult.error;

      const memberships = membershipResult.data || [];
      const sharedStudyIds = Array.from(
        new Set(memberships.map((membership) => membership.study_id).filter(Boolean)),
      );

      let sharedStudyMetadata: Array<{
        id: string;
        title: string;
        status: string;
        updated_at: string;
      }> = [];

      if (sharedStudyIds.length > 0) {
        const admin = researchAdmin();
        const { data, error } = await admin
          .from("research_studies")
          .select("id,title,status,updated_at")
          .in("id", sharedStudyIds);

        if (error) throw error;
        sharedStudyMetadata = data || [];
      }

      const metadataByStudyId = new Map(
        sharedStudyMetadata.map((study) => [study.id, study]),
      );

      const sharedStudies = memberships
        .map((membership) => {
          const study = metadataByStudyId.get(membership.study_id);
          if (!study) return null;

          return {
            id: study.id,
            title: study.title || "Untitled study",
            status: study.status,
            updated_at: study.updated_at,
            role: membership.role,
            permissions: membership.permissions || {},
            membership_status: membership.status,
            accepted_at: membership.accepted_at,
          };
        })
        .filter(Boolean);

      return reply({
        ok: true,
        currentUser: {
          id: user.id,
          email: user.email || "",
          displayName:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email ||
            "Researcher",
        },
        ownedStudies: studyResult.data || [],
        incomingInvites: incomingResult.data || [],
        sharedStudies,
      });
    }

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const study = await ownedStudy(supabase, user.id, studyId);
    if (!study) {
      return reply(
        { ok: false, error: "Only the study owner can manage this team." },
        403,
      );
    }

    const [membersResult, invitesResult, activityResult] = await Promise.all([
      supabase
        .from("study_collaborators")
        .select(
          "id,study_id,user_id,email,display_name,role,permissions,status,invited_by,accepted_at,created_at,updated_at",
        )
        .eq("study_id", studyId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("study_collaboration_invites")
        .select(
          "id,study_id,study_title,email,role,permissions,status,expires_at,accepted_at,created_at,updated_at",
        )
        .eq("study_id", studyId)
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("study_collaboration_activity")
        .select(
          "id,study_id,actor_user_id,action,target_user_id,target_email,metadata,created_at",
        )
        .eq("study_id", studyId)
        .order("created_at", { ascending: false })
        .limit(80),
    ]);

    if (membersResult.error) throw membersResult.error;
    if (invitesResult.error) throw invitesResult.error;
    if (activityResult.error) throw activityResult.error;

    return reply({
      ok: true,
      study,
      members: membersResult.data || [],
      invites: invitesResult.data || [],
      activity: activityResult.data || [],
    });
  } catch (error) {
    console.error("Research team GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load the study team right now." },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await authenticated();
    if (!user) return reply({ ok: false, error: "Please sign in again." }, 401);

    const body = await request.json().catch(() => ({}));
    const operation = String(body?.operation || "").trim();

    if (operation === "accept_invite") {
      const token = String(body?.token || "").trim();
      const inviteId = String(body?.inviteId || body?.invite_id || "").trim();

      let rpcResult:
        | Awaited<ReturnType<typeof supabase.rpc>>
        | undefined;

      if (token) {
        rpcResult = await supabase.rpc("psylattice_accept_study_invite", {
          p_token: token,
        });
      } else if (inviteId && validUuid(inviteId)) {
        rpcResult = await supabase.rpc("psylattice_accept_study_invite_id", {
          p_invite_id: inviteId,
        });
      } else {
        return reply(
          { ok: false, error: "A valid invitation is required." },
          400,
        );
      }

      if (rpcResult.error) throw rpcResult.error;
      const result = rpcResult.data as
        | { ok?: boolean; error?: string; study_id?: string; study_title?: string; role?: string }
        | null;

      if (!result?.ok) {
        return reply(
          { ok: false, error: result?.error || "The invitation could not be accepted." },
          400,
        );
      }

      return reply({ ok: true, result });
    }

    const studyId = String(body?.studyId || body?.study_id || "").trim();
    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const study = await ownedStudy(supabase, user.id, studyId);
    if (!study) {
      return reply(
        { ok: false, error: "Only the study owner can manage this team." },
        403,
      );
    }

    if (operation === "invite") {
      const email = normalizeEmail(body?.email);
      const role: StudyRole = validRole(body?.role) ? body.role : "viewer";
      const permissions = normalizePermissions(body?.permissions, role);

      if (!looksLikeEmail(email)) {
        return reply({ ok: false, error: "Enter a valid email address." }, 400);
      }

      if (email === normalizeEmail(user.email)) {
        return reply(
          { ok: false, error: "You are already the owner of this study." },
          400,
        );
      }

      const { data: existingMember, error: memberError } = await supabase
        .from("study_collaborators")
        .select("id,status")
        .eq("study_id", studyId)
        .eq("email", email)
        .maybeSingle();

      if (memberError) throw memberError;
      if (existingMember?.status === "active") {
        return reply(
          { ok: false, error: "That person is already an active collaborator." },
          409,
        );
      }

      const { error: revokeError } = await supabase
        .from("study_collaboration_invites")
        .update({ status: "revoked" })
        .eq("study_id", studyId)
        .eq("status", "pending")
        .ilike("email", email);

      if (revokeError) throw revokeError;

      const token = crypto.randomBytes(24).toString("base64url");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const { data: invite, error: inviteError } = await supabase
        .from("study_collaboration_invites")
        .insert({
          study_id: studyId,
          study_title: study.title || "Untitled study",
          email,
          role,
          permissions,
          token_hash: tokenHash,
          invited_by: user.id,
        })
        .select(
          "id,study_id,study_title,email,role,permissions,status,expires_at,created_at",
        )
        .single();

      if (inviteError) throw inviteError;

      await logActivity(supabase, {
        studyId,
        actorUserId: user.id,
        action: "invite_created",
        targetEmail: email,
        metadata: { role, permissions, invite_id: invite.id },
      });

      const inviteUrl = new URL("/researcher", request.nextUrl.origin);
      inviteUrl.searchParams.set("collaboration_invite", token);

      return reply({
        ok: true,
        invite,
        inviteUrl: inviteUrl.toString(),
      });
    }

    if (operation === "revoke_invite") {
      const inviteId = String(body?.inviteId || "").trim();
      if (!validUuid(inviteId)) {
        return reply({ ok: false, error: "A valid inviteId is required." }, 400);
      }

      const { data: invite, error } = await supabase
        .from("study_collaboration_invites")
        .update({ status: "revoked" })
        .eq("id", inviteId)
        .eq("study_id", studyId)
        .eq("status", "pending")
        .select("id,email,role")
        .maybeSingle();

      if (error) throw error;
      if (!invite) {
        return reply(
          { ok: false, error: "That pending invitation could not be found." },
          404,
        );
      }

      await logActivity(supabase, {
        studyId,
        actorUserId: user.id,
        action: "invite_revoked",
        targetEmail: invite.email,
        metadata: { role: invite.role, invite_id: invite.id },
      });

      return reply({ ok: true });
    }

    if (operation === "update_member") {
      const memberId = String(body?.memberId || "").trim();
      const role: StudyRole = validRole(body?.role) ? body.role : "viewer";
      const permissions = normalizePermissions(body?.permissions, role);

      if (!validUuid(memberId)) {
        return reply({ ok: false, error: "A valid memberId is required." }, 400);
      }

      const { data: member, error } = await supabase
        .from("study_collaborators")
        .update({ role, permissions })
        .eq("id", memberId)
        .eq("study_id", studyId)
        .select("id,user_id,email,role,permissions,status")
        .maybeSingle();

      if (error) throw error;
      if (!member) {
        return reply({ ok: false, error: "That collaborator could not be found." }, 404);
      }

      await logActivity(supabase, {
        studyId,
        actorUserId: user.id,
        action: "member_permissions_updated",
        targetUserId: member.user_id,
        targetEmail: member.email,
        metadata: { role, permissions },
      });

      return reply({ ok: true, member });
    }

    if (
      operation === "suspend_member" ||
      operation === "restore_member" ||
      operation === "remove_member"
    ) {
      const memberId = String(body?.memberId || "").trim();
      if (!validUuid(memberId)) {
        return reply({ ok: false, error: "A valid memberId is required." }, 400);
      }

      const nextStatus =
        operation === "suspend_member"
          ? "suspended"
          : operation === "restore_member"
            ? "active"
            : "revoked";

      const { data: member, error } = await supabase
        .from("study_collaborators")
        .update({ status: nextStatus })
        .eq("id", memberId)
        .eq("study_id", studyId)
        .select("id,user_id,email,role,permissions,status")
        .maybeSingle();

      if (error) throw error;
      if (!member) {
        return reply({ ok: false, error: "That collaborator could not be found." }, 404);
      }

      await logActivity(supabase, {
        studyId,
        actorUserId: user.id,
        action:
          operation === "suspend_member"
            ? "member_suspended"
            : operation === "restore_member"
              ? "member_restored"
              : "member_revoked",
        targetUserId: member.user_id,
        targetEmail: member.email,
        metadata: { role: member.role },
      });

      return reply({ ok: true, member });
    }

    return reply({ ok: false, error: "Unsupported team operation." }, 400);
  } catch (error) {
    console.error("Research team POST failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not update the study team right now." },
      500,
    );
  }
}
