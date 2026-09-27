import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReviewStatus = "open" | "resolved" | "dismissed";
type ReviewPriority = "normal" | "important" | "urgent";

const REVIEW_CATEGORIES = new Set([
  "general",
  "study_design",
  "recruitment",
  "participants",
  "data",
  "analysis",
  "writing",
  "study_health",
  "ethics",
]);

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

function validPriority(value: unknown): value is ReviewPriority {
  return value === "normal" || value === "important" || value === "urgent";
}

function validStatus(value: unknown): value is ReviewStatus {
  return value === "open" || value === "resolved" || value === "dismissed";
}

async function authenticated() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user: error ? null : user };
}

async function accessContext(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  studyId: string,
) {
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
        permissions?: Record<string, boolean>;
        error?: string;
      }
    | null;

  return access;
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await authenticated();
    if (!user) return reply({ ok: false, error: "Please sign in again." }, 401);

    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const access = await accessContext(supabase, studyId);
    if (!access?.ok || !access.allowed) {
      return reply(
        { ok: false, error: access?.error || "You do not have access to this study." },
        403,
      );
    }

    const { data, error } = await supabase
      .from("study_collaboration_reviews")
      .select(
        "id,study_id,author_user_id,author_email,author_role,title,body,category,priority,status,source_screen,source_ref,source_label,resolved_by,resolved_at,created_at,updated_at",
      )
      .eq("study_id", studyId)
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) throw error;

    const reviews = data || [];
    const openCount = reviews.filter((item) => item.status === "open").length;

    return reply({
      ok: true,
      access: {
        accessType: access.access_type || null,
        role: access.role || null,
        studyTitle: access.study_title || "Untitled study",
        isOwner: access.access_type === "owner",
      },
      summary: {
        total: reviews.length,
        open: openCount,
        resolved: reviews.filter((item) => item.status === "resolved").length,
        dismissed: reviews.filter((item) => item.status === "dismissed").length,
      },
      reviews,
    });
  } catch (error) {
    console.error("Collaboration reviews GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load collaboration reviews right now." },
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
    const studyId = String(body?.studyId || body?.study_id || "").trim();

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const access = await accessContext(supabase, studyId);
    if (!access?.ok || !access.allowed) {
      return reply(
        { ok: false, error: access?.error || "You do not have access to this study." },
        403,
      );
    }

    if (operation === "create") {
      const title = cleanText(body?.title, 160);
      const reviewBody = cleanText(body?.body, 6000);
      const category = REVIEW_CATEGORIES.has(String(body?.category || ""))
        ? String(body.category)
        : "general";
      const priority: ReviewPriority = validPriority(body?.priority)
        ? body.priority
        : "normal";
      const sourceScreen = cleanText(body?.sourceScreen || body?.source_screen, 80);
      const sourceRef = cleanText(body?.sourceRef || body?.source_ref, 200);
      const sourceLabel = cleanText(body?.sourceLabel || body?.source_label, 240);

      if (title.length < 3) {
        return reply(
          { ok: false, error: "Give the review card a short title." },
          400,
        );
      }

      if (reviewBody.length < 3) {
        return reply(
          { ok: false, error: "Add a short review note before creating the card." },
          400,
        );
      }

      const role =
        access.access_type === "owner"
          ? "owner"
          : cleanText(access.role || "collaborator", 40);

      const { data, error } = await supabase
        .from("study_collaboration_reviews")
        .insert({
          study_id: studyId,
          author_user_id: user.id,
          author_email: user.email || "PsyLattice collaborator",
          author_role: role,
          title,
          body: reviewBody,
          category,
          priority,
          status: "open",
          source_screen: sourceScreen || null,
          source_ref: sourceRef || null,
          source_label: sourceLabel || null,
        })
        .select(
          "id,study_id,author_user_id,author_email,author_role,title,body,category,priority,status,source_screen,source_ref,source_label,resolved_by,resolved_at,created_at,updated_at",
        )
        .single();

      if (error) throw error;
      return reply({ ok: true, review: data });
    }

    if (operation === "set_status") {
      if (access.access_type !== "owner") {
        return reply(
          { ok: false, error: "Only the study owner can change review status." },
          403,
        );
      }

      const reviewId = String(body?.reviewId || body?.review_id || "").trim();
      const status: ReviewStatus = validStatus(body?.status)
        ? body.status
        : "open";

      if (!validUuid(reviewId)) {
        return reply({ ok: false, error: "A valid reviewId is required." }, 400);
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("study_collaboration_reviews")
        .update({
          status,
          resolved_by: status === "open" ? null : user.id,
          resolved_at: status === "open" ? null : now,
        })
        .eq("id", reviewId)
        .eq("study_id", studyId)
        .select(
          "id,study_id,author_user_id,author_email,author_role,title,body,category,priority,status,source_screen,source_ref,source_label,resolved_by,resolved_at,created_at,updated_at",
        )
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return reply({ ok: false, error: "That review card could not be found." }, 404);
      }

      return reply({ ok: true, review: data });
    }

    return reply({ ok: false, error: "Unsupported review operation." }, 400);
  } catch (error) {
    console.error("Collaboration reviews POST failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not update collaboration reviews right now." },
      500,
    );
  }
}
