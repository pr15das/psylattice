import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { researchAdmin } from "@/lib/research/serverAccess";

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

function cleanText(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function sanitizeCollaborativeHtml(input: string) {
  let html = String(input || "").slice(0, 2_000_000);

  // Drop active / document-level content completely.
  html = html.replace(
    /<(script|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  html = html.replace(
    /<(script|iframe|object|embed|form|input|button|textarea|select|meta|link|base|svg|math)\b[^>]*\/?>/gi,
    "",
  );

  // Remove inline handlers and dangerous URL-bearing attributes.
  html = html.replace(/\s+on[a-z0-9_-]+\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\s+on[a-z0-9_-]+\s*=\s*'[^']*'/gi, "");
  html = html.replace(/\s+on[a-z0-9_-]+\s*=\s*[^\s>]+/gi, "");
  html = html.replace(/\s+srcdoc\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\s+srcdoc\s*=\s*'[^']*'/gi, "");

  html = html.replace(
    /\s+(href|src|xlink:href)\s*=\s*"(\s*(?:javascript:|data:text\/html)[^"]*)"/gi,
    "",
  );
  html = html.replace(
    /\s+(href|src|xlink:href)\s*=\s*'(\s*(?:javascript:|data:text\/html)[^']*)'/gi,
    "",
  );

  return html;
}

type AccessContext = {
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

async function resolveAccess(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  studyId: string,
) {
  const { data, error } = await supabase.rpc(
    "psylattice_study_access_context",
    { p_study_id: studyId },
  );
  if (error) throw error;
  return data as AccessContext | null;
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

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }

    const access = await resolveAccess(supabase, studyId);

    if (!access?.ok || !access.allowed) {
      return reply(
        { ok: false, error: access?.error || "You do not have access to this study." },
        403,
      );
    }

    const canUseThesis =
      access.access_type === "owner" || access.permissions?.thesis === true;

    if (!canUseThesis) {
      return reply(
        { ok: false, error: "The study owner has not granted you Thesis Builder access." },
        403,
      );
    }

    const ownerUserId = String(access.owner_user_id || "").trim();
    if (!validUuid(ownerUserId)) {
      return reply({ ok: false, error: "The study owner could not be resolved." }, 500);
    }

    const admin = researchAdmin();

    const { data: documents, error: documentError } = await admin
      .from("research_writing_documents")
      .select(
        "id,owner_user_id,study_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at",
      )
      .eq("owner_user_id", ownerUserId)
      .eq("study_id", studyId)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(100);

    if (documentError) throw documentError;

    return reply({
      ok: true,
      access: {
        accessType: access.access_type || null,
        role: access.role || null,
        canEdit:
          access.access_type === "owner" ||
          access.permissions?.can_edit === true,
        canComment:
          access.access_type === "owner" ||
          access.permissions?.can_comment === true,
        canReview:
          access.access_type === "owner" ||
          access.permissions?.can_review === true,
        studyTitle: access.study_title || "Untitled study",
      },
      documents: documents || [],
    });
  } catch (error) {
    console.error("Shared Thesis GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load shared Thesis documents right now." },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const operation = String(body?.operation || "").trim();
    const studyId = String(body?.studyId || body?.study_id || "").trim();

    if (operation !== "save_document") {
      return reply({ ok: false, error: "Unsupported Thesis operation." }, 400);
    }

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const access = await resolveAccess(supabase, studyId);

    if (!access?.ok || !access.allowed) {
      return reply(
        { ok: false, error: access?.error || "You do not have access to this study." },
        403,
      );
    }

    if (access.access_type !== "collaborator") {
      return reply(
        { ok: false, error: "Use the normal Thesis Builder to edit your own study." },
        400,
      );
    }

    if (access.permissions?.thesis !== true) {
      return reply(
        { ok: false, error: "The study owner has not granted Thesis Builder access." },
        403,
      );
    }

    if (access.permissions?.can_edit !== true) {
      return reply(
        { ok: false, error: "Your collaboration role is currently read-only." },
        403,
      );
    }

    const documentId = String(body?.documentId || body?.document_id || "").trim();
    if (!validUuid(documentId)) {
      return reply({ ok: false, error: "A valid documentId is required." }, 400);
    }

    const expectedUpdatedAt = cleanText(
      body?.expectedUpdatedAt || body?.expected_updated_at,
      80,
    );
    const title = cleanText(body?.title, 240);
    const contentText = String(body?.contentText || body?.content_text || "")
      .replace(/\u0000/g, "")
      .slice(0, 1_000_000);
    const contentHtml = sanitizeCollaborativeHtml(
      String(body?.contentHtml || body?.content_html || ""),
    );

    if (!title) {
      return reply({ ok: false, error: "The document title cannot be empty." }, 400);
    }

    const ownerUserId = String(access.owner_user_id || "").trim();
    if (!validUuid(ownerUserId)) {
      return reply({ ok: false, error: "The study owner could not be resolved." }, 500);
    }

    const admin = researchAdmin();

    const { data: current, error: currentError } = await admin
      .from("research_writing_documents")
      .select(
        "id,owner_user_id,study_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at",
      )
      .eq("id", documentId)
      .eq("study_id", studyId)
      .eq("owner_user_id", ownerUserId)
      .maybeSingle();

    if (currentError) throw currentError;
    if (!current) {
      return reply(
        { ok: false, error: "That Thesis document is no longer available in this study." },
        404,
      );
    }

    // Optimistic concurrency: never silently overwrite an owner's or another
    // collaborator's newer edit.
    if (
      expectedUpdatedAt &&
      String(current.updated_at || "") !== expectedUpdatedAt
    ) {
      return reply(
        {
          ok: false,
          code: "DOCUMENT_CHANGED",
          error:
            "This document changed after you opened it. Reload the latest version before saving so nobody's work is overwritten.",
        },
        409,
      );
    }

    const { data: updated, error: updateError } = await admin
      .from("research_writing_documents")
      .update({
        title,
        content_html: contentHtml,
        content_text: contentText,
      })
      .eq("id", documentId)
      .eq("study_id", studyId)
      .eq("owner_user_id", ownerUserId)
      .select(
        "id,owner_user_id,study_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at",
      )
      .single();

    if (updateError) throw updateError;

    const { error: auditError } = await admin
      .from("study_collaboration_document_edits")
      .insert({
        study_id: studyId,
        document_id: documentId,
        editor_user_id: user.id,
        editor_email: user.email || "PsyLattice collaborator",
        editor_role: String(access.role || "collaborator").slice(0, 80),
        document_title: String(current.title || "Untitled paper").slice(0, 240),
        previous_content_html: current.content_html || "",
        previous_content_text: current.content_text || "",
        previous_updated_at: current.updated_at || null,
        saved_updated_at: updated.updated_at || null,
      });

    if (auditError) {
      // The document is already safely saved. Log audit failure without hiding
      // a successful user edit.
      console.error("Shared Thesis edit audit failed:", auditError);
    }

    return reply({
      ok: true,
      document: updated,
      savedBy: {
        userId: user.id,
        email: user.email || "",
        role: access.role || "collaborator",
      },
    });
  } catch (error) {
    console.error("Shared Thesis POST failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not save this shared Thesis document right now." },
      500,
    );
  }
}
