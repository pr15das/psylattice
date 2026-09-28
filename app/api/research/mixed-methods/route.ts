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
  study_id?: string;
  study_title?: string;
  owner_user_id?: string;
  permissions?: Record<string, boolean>;
  error?: string;
};

type ParticipantRow = {
  id: string;
  public_id: string | null;
  participant_code: string | null;
  is_test: boolean;
  status: string;
  enrolled_at: string | null;
  completed_at: string | null;
};

type QualitativeCaseRow = {
  id: string;
  participant_id: string | null;
  case_key: string;
  name: string;
  classification: string;
  attributes: Record<string, unknown> | null;
  notes: string | null;
  status: string;
};

type QualitativeSourceRow = {
  id: string;
  case_id: string;
  title: string;
  source_type: string;
};

type QualitativeCodeRow = {
  id: string;
  parent_code_id: string | null;
  name: string;
  color: string;
  status: string;
};

type QualitativeCodingRow = {
  id: string;
  case_id: string;
  source_id: string;
  code_id: string;
  excerpt: string;
  start_offset: number;
  end_offset: number;
  method: string;
  coder_identity_id: string | null;
  created_at: string;
};

type QualitativeThemeRow = {
  id: string;
  parent_theme_id: string | null;
  name: string;
  description: string | null;
  color: string;
  status: string;
  position: number;
};

type QualitativeThemeCodeRow = {
  id: string;
  theme_id: string;
  code_id: string;
};

type QualitativeFrameworkRow = {
  id: string;
  case_id: string;
  theme_id: string | null;
  code_id: string | null;
  summary: string;
  evidence_coding_ids: string[];
  updated_at: string;
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

function text(value: unknown, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function safeJsonSize(value: unknown, max = 200_000) {
  try {
    return JSON.stringify(value).length <= max;
  } catch {
    return false;
  }
}

async function sessionAccess(studyId: string) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      access: null as AccessContext | null,
      ownerUserId: "",
      error: "AUTH" as const,
    };
  }

  const { data, error } = await supabase.rpc("psylattice_study_access_context", {
    p_study_id: studyId,
  });

  if (error) throw error;

  const access = data as AccessContext | null;
  if (!access?.ok || !access.allowed) {
    return {
      supabase,
      user,
      access,
      ownerUserId: "",
      error: "STUDY" as const,
    };
  }

  const mixedAllowed =
    access.access_type === "owner" ||
    (access.permissions?.analysis === true &&
      access.permissions?.qualitative_lab === true);

  if (!mixedAllowed) {
    return {
      supabase,
      user,
      access,
      ownerUserId: "",
      error: "PERMISSION" as const,
    };
  }

  const ownerUserId =
    text(access.owner_user_id, 80) ||
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

function accessFailure(
  session: Awaited<ReturnType<typeof sessionAccess>>,
) {
  if (session.error === "AUTH") {
    return reply({ ok: false, error: "Please sign in again." }, 401);
  }
  if (session.error === "PERMISSION") {
    return reply(
      {
        ok: false,
        error:
          "Mixed Methods requires access to both Analysis Lab and Qualitative Lab for this study.",
      },
      403,
    );
  }
  if (session.error === "OWNER") {
    return reply(
      { ok: false, error: "PsyLattice could not resolve the study owner." },
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
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }

    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";
    const includeTest =
      request.nextUrl.searchParams.get("include_test") === "true";

    if (!studyId) {
      const { data, error } = await supabase
        .from("research_studies")
        .select("id,title,status,components,updated_at")
        .eq("owner_user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return reply({
        ok: true,
        studies: data || [],
      });
    }

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }

    const session = await sessionAccess(studyId);
    const failure = accessFailure(session);
    if (failure) return failure;

    const admin = researchAdmin();

    const [
      studyResult,
      participantResult,
      caseResult,
      sourceResult,
      codeResult,
      codingResult,
      themeResult,
      themeCodeResult,
      frameworkResult,
      displayResult,
      findingResult,
    ] = await Promise.all([
      admin
        .from("research_studies")
        .select("id,title,status,components,design,updated_at")
        .eq("id", studyId)
        .eq("owner_user_id", session.ownerUserId)
        .maybeSingle(),
      admin
        .from("study_participants")
        .select(
          "id,public_id,participant_code,is_test,status,enrolled_at,completed_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId)
        .order("enrolled_at", { ascending: true }),
      admin
        .from("qualitative_cases")
        .select(
          "id,participant_id,case_key,name,classification,attributes,notes,status",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId)
        .eq("status", "active"),
      admin
        .from("qualitative_sources")
        .select("id,case_id,title,source_type")
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId),
      admin
        .from("qualitative_codes")
        .select("id,parent_code_id,name,color,status")
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId)
        .eq("status", "active"),
      admin
        .from("qualitative_codings")
        .select(
          "id,case_id,source_id,code_id,excerpt,start_offset,end_offset,method,coder_identity_id,created_at",
        )
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId),
      admin
        .from("qualitative_themes")
        .select("id,parent_theme_id,name,description,color,status,position")
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId)
        .eq("status", "active")
        .order("position", { ascending: true }),
      admin
        .from("qualitative_theme_codes")
        .select("id,theme_id,code_id")
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId),
      admin
        .from("qualitative_framework_summaries")
        .select("id,case_id,theme_id,code_id,summary,evidence_coding_ids,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId),
      admin
        .from("mixed_method_joint_displays")
        .select("id,name,description,row_mode,config,created_by_user_id,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId)
        .order("updated_at", { ascending: false }),
      admin
        .from("mixed_method_integrated_findings")
        .select("id,title,quant_variable,qualitative_theme_id,integration_type,quantitative_finding,qualitative_finding,integrated_interpretation,evidence_snapshot,status,created_by_user_id,created_at,updated_at")
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId)
        .order("updated_at", { ascending: false }),
    ]);

    const failed = [
      studyResult,
      participantResult,
      caseResult,
      sourceResult,
      codeResult,
      codingResult,
      themeResult,
      themeCodeResult,
      frameworkResult,
      displayResult,
      findingResult,
    ].find((result) => result.error);

    if (failed?.error) throw failed.error;

    if (!studyResult.data) {
      return reply({ ok: false, error: "This study is no longer available." }, 404);
    }

    const participants = ((participantResult.data || []) as ParticipantRow[]).filter(
      (participant) =>
        participant.status !== "withdrawn" &&
        (includeTest || !participant.is_test),
    );

    const cases = (caseResult.data || []) as QualitativeCaseRow[];
    const sources = (sourceResult.data || []) as QualitativeSourceRow[];
    const codes = (codeResult.data || []) as QualitativeCodeRow[];
    const codings = (codingResult.data || []) as QualitativeCodingRow[];
    const themes = (themeResult.data || []) as QualitativeThemeRow[];
    const themeCodes = (themeCodeResult.data || []) as QualitativeThemeCodeRow[];
    const frameworks = (frameworkResult.data || []) as QualitativeFrameworkRow[];

    const sourceById = new Map(sources.map((source) => [source.id, source]));
    const codeById = new Map(codes.map((code) => [code.id, code]));
    const caseByParticipantId = new Map(
      cases
        .filter((item) => item.participant_id)
        .map((item) => [item.participant_id as string, item]),
    );

    const codeIdsByThemeId = new Map<string, Set<string>>();
    for (const theme of themes) {
      codeIdsByThemeId.set(theme.id, new Set());
    }
    for (const mapping of themeCodes) {
      if (!codeIdsByThemeId.has(mapping.theme_id)) {
        codeIdsByThemeId.set(mapping.theme_id, new Set());
      }
      codeIdsByThemeId.get(mapping.theme_id)!.add(mapping.code_id);
    }

    const participantBridge = participants.map((participant) => {
      const caseItem = caseByParticipantId.get(participant.id) || null;
      const caseCodings = caseItem
        ? codings.filter((coding) => coding.case_id === caseItem.id)
        : [];

      const themeStats = themes.map((theme) => {
        const codeIds = codeIdsByThemeId.get(theme.id) || new Set<string>();
        const refs = caseCodings.filter((coding) => codeIds.has(coding.code_id));
        const uniqueSources = new Set(refs.map((ref) => ref.source_id));
        const uniqueCodes = new Set(refs.map((ref) => ref.code_id));
        const framework =
          frameworks.find(
            (item) =>
              item.case_id === caseItem?.id && item.theme_id === theme.id,
          ) || null;

        return {
          themeId: theme.id,
          themeName: theme.name,
          color: theme.color,
          present: refs.length > 0,
          referenceCount: refs.length,
          sourceCount: uniqueSources.size,
          codeCount: uniqueCodes.size,
          frameworkSummary: framework?.summary || "",
          evidence: refs.slice(0, 12).map((ref) => ({
            codingId: ref.id,
            excerpt: ref.excerpt,
            sourceId: ref.source_id,
            sourceTitle: sourceById.get(ref.source_id)?.title || "Source",
            codeId: ref.code_id,
            codeName: codeById.get(ref.code_id)?.name || "Code",
            codeColor: codeById.get(ref.code_id)?.color || "#06b6d4",
            method: ref.method,
          })),
        };
      });

      const codeStats = codes
        .map((code) => {
          const refs = caseCodings.filter((coding) => coding.code_id === code.id);
          return {
            codeId: code.id,
            codeName: code.name,
            color: code.color,
            referenceCount: refs.length,
          };
        })
        .filter((item) => item.referenceCount > 0)
        .sort((a, b) => b.referenceCount - a.referenceCount);

      return {
        participantId: participant.id,
        participantPublicId:
          participant.public_id ||
          participant.participant_code ||
          participant.id.slice(0, 8),
        participantCode: participant.participant_code || null,
        participantStatus: participant.status,
        enrolledAt: participant.enrolled_at,
        completedAt: participant.completed_at,
        qualitativeCase: caseItem
          ? {
              id: caseItem.id,
              caseKey: caseItem.case_key,
              name: caseItem.name,
              classification: caseItem.classification,
              attributes: caseItem.attributes || {},
              notes: caseItem.notes || "",
            }
          : null,
        qualitativeSourceCount: caseItem
          ? sources.filter((source) => source.case_id === caseItem.id).length
          : 0,
        qualitativeReferenceCount: caseCodings.length,
        themeStats,
        codeStats,
      };
    });

    const linkedParticipantCount = participantBridge.filter(
      (item) => item.qualitativeCase,
    ).length;
    const codedParticipantCount = participantBridge.filter(
      (item) => item.qualitativeReferenceCount > 0,
    ).length;

    return reply({
      ok: true,
      study: studyResult.data,
      access: {
        accessType: session.access?.access_type || "owner",
        role: session.access?.role || null,
      },
      participantBridge,
      themes,
      codes,
      savedDisplays: displayResult.data || [],
      integratedFindings: findingResult.data || [],
      readiness: {
        participants: participants.length,
        qualitativeCases: cases.length,
        linkedParticipants: linkedParticipantCount,
        codedParticipants: codedParticipantCount,
        themes: themes.length,
        codings: codings.length,
        standaloneQualitativeCases: cases.filter((item) => !item.participant_id)
          .length,
      },
    });
  } catch (error) {
    console.error("Mixed Methods GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load Mixed Methods right now." },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const studyId = text(body?.studyId, 80);
    const operation = text(body?.operation, 80);

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid studyId is required." }, 400);
    }

    const session = await sessionAccess(studyId);
    const failure = accessFailure(session);
    if (failure) return failure;

    const admin = researchAdmin();
    const canWrite =
      session.access?.access_type === "owner" ||
      session.access?.permissions?.edit === true;

    if (!canWrite) {
      return reply(
        { ok: false, error: "You have read-only access to this mixed-methods study." },
        403,
      );
    }

    if (operation === "save_display") {
      const name = text(body?.name, 180);
      const description = text(body?.description, 800);
      const config = body?.config;

      if (!name) {
        return reply({ ok: false, error: "Give this joint display a name." }, 400);
      }
      if (!config || typeof config !== "object" || Array.isArray(config)) {
        return reply({ ok: false, error: "Joint-display configuration is missing." }, 400);
      }
      if (!safeJsonSize(config)) {
        return reply({ ok: false, error: "This joint display configuration is too large." }, 413);
      }

      const { data: existing, error: existingError } = await admin
        .from("mixed_method_joint_displays")
        .select("id")
        .eq("owner_user_id", session.ownerUserId)
        .eq("study_id", studyId)
        .ilike("name", name)
        .maybeSingle();

      if (existingError) throw existingError;

      const row = {
        owner_user_id: session.ownerUserId,
        study_id: studyId,
        created_by_user_id: session.user!.id,
        name,
        description: description || null,
        row_mode: "participant",
        config,
      };

      if (existing) {
        const { data, error } = await admin
          .from("mixed_method_joint_displays")
          .update(row)
          .eq("id", existing.id)
          .eq("owner_user_id", session.ownerUserId)
          .eq("study_id", studyId)
          .select("*")
          .single();

        if (error) throw error;
        return reply({ ok: true, display: data, updated: true });
      }

      const { data, error } = await admin
        .from("mixed_method_joint_displays")
        .insert(row)
        .select("*")
        .single();

      if (error?.code === "23505") {
        return reply({ ok: false, error: "A joint display with that name already exists." }, 409);
      }
      if (error) throw error;

      return reply({ ok: true, display: data, updated: false });
    }

    if (operation === "delete_display") {
      const displayId = text(body?.displayId, 80);
      if (!validUuid(displayId)) {
        return reply({ ok: false, error: "A valid joint display is required." }, 400);
      }

      const { error } = await admin
        .from("mixed_method_joint_displays")
        .delete()
        .eq("id", displayId)
        .eq("owner_user_id", session.ownerUserId)
        .eq("study_id", studyId);

      if (error) throw error;
      return reply({ ok: true });
    }

    if (operation === "save_finding") {
      const findingId = text(body?.findingId, 80);
      const title = text(body?.title, 220);
      const quantVariable = text(body?.quantVariable, 220);
      const qualitativeThemeId = text(body?.qualitativeThemeId, 80);
      const integrationType = text(body?.integrationType, 40);
      const quantitativeFinding = text(body?.quantitativeFinding, 4000);
      const qualitativeFinding = text(body?.qualitativeFinding, 4000);
      const integratedInterpretation = text(body?.integratedInterpretation, 6000);
      const status = body?.status === "final" ? "final" : "draft";
      const evidenceSnapshot = body?.evidenceSnapshot ?? {};

      const allowedTypes = new Set([
        "convergent",
        "complementary",
        "divergent",
        "expansion",
        "negative_case",
        "unclear",
      ]);

      if (!title) {
        return reply({ ok: false, error: "Give this integrated finding a title." }, 400);
      }
      if (!allowedTypes.has(integrationType)) {
        return reply({ ok: false, error: "Choose a valid integration interpretation." }, 400);
      }
      if (qualitativeThemeId && !validUuid(qualitativeThemeId)) {
        return reply({ ok: false, error: "The selected qualitative theme is invalid." }, 400);
      }
      if (!safeJsonSize(evidenceSnapshot, 120_000)) {
        return reply({ ok: false, error: "The finding evidence snapshot is too large." }, 413);
      }

      const row = {
        owner_user_id: session.ownerUserId,
        study_id: studyId,
        created_by_user_id: session.user!.id,
        title,
        quant_variable: quantVariable || null,
        qualitative_theme_id: qualitativeThemeId || null,
        integration_type: integrationType,
        quantitative_finding: quantitativeFinding,
        qualitative_finding: qualitativeFinding,
        integrated_interpretation: integratedInterpretation,
        evidence_snapshot: evidenceSnapshot,
        status,
      };

      if (findingId) {
        if (!validUuid(findingId)) {
          return reply({ ok: false, error: "The integrated finding identifier is invalid." }, 400);
        }

        const { data, error } = await admin
          .from("mixed_method_integrated_findings")
          .update(row)
          .eq("id", findingId)
          .eq("study_id", studyId)
          .eq("owner_user_id", session.ownerUserId)
          .select("*")
          .single();

        if (error) throw error;
        return reply({ ok: true, finding: data, updated: true });
      }

      const { data, error } = await admin
        .from("mixed_method_integrated_findings")
        .insert(row)
        .select("*")
        .single();

      if (error) throw error;
      return reply({ ok: true, finding: data, updated: false });
    }

    if (operation === "delete_finding") {
      const findingId = text(body?.findingId, 80);
      if (!validUuid(findingId)) {
        return reply({ ok: false, error: "A valid integrated finding is required." }, 400);
      }

      const { error } = await admin
        .from("mixed_method_integrated_findings")
        .delete()
        .eq("id", findingId)
        .eq("study_id", studyId)
        .eq("owner_user_id", session.ownerUserId);

      if (error) throw error;
      return reply({ ok: true });
    }

    return reply({ ok: false, error: "Unsupported Mixed Methods operation." }, 400);
  } catch (error) {
    console.error("Mixed Methods POST failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not update Mixed Methods right now." },
      500,
    );
  }
}
