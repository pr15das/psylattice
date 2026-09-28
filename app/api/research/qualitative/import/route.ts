import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 2_000_000;

type MammothMessage = {
  type: string;
  message: string;
};

type MammothRawTextResult = {
  value: string;
  messages: MammothMessage[];
};

type MammothApi = {
  extractRawText(input: { buffer: Buffer }): Promise<MammothRawTextResult>;
};

// Mammoth is a CommonJS `export =` package. With Next.js/TypeScript's
// ESM bundler resolution, its runtime default import is valid but its
// declaration can be inferred as the module namespace. Narrow it once here
// so `extractRawText` is correctly typed without weakening the rest of the route.
const mammothApi = mammoth as unknown as MammothApi;

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

function cleanName(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 240);
}

function extension(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

async function parseFile(file: File) {
  const ext = extension(file.name);
  const mime = file.type.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (ext === "txt" || ext === "md" || mime.startsWith("text/")) {
    return {
      sourceType: "document",
      text: buffer.toString("utf8"),
      metadata: { parser: "utf8-text" },
    };
  }

  if (
    ext === "docx" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammothApi.extractRawText({ buffer });
    return {
      sourceType: "document",
      text: result.value,
      metadata: {
        parser: "mammoth",
        messages: result.messages.map((message: MammothMessage) => ({
          type: message.type,
          message: message.message,
        })),
      },
    };
  }

  if (ext === "pdf" || mime === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: true });
    const merged = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
    return {
      sourceType: "document",
      text: merged,
      metadata: { parser: "unpdf", total_pages: result.totalPages },
    };
  }

  throw new Error("Unsupported file type. Use PDF, DOCX, TXT or Markdown.");
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

    const form = await request.formData();
    const studyId = String(form.get("studyId") || "").trim();
    const caseId = String(form.get("caseId") || "").trim();
    const participantId = String(form.get("participantId") || "").trim();
    const standaloneName = cleanName(String(form.get("standaloneName") || ""));
    const titleOverride = cleanName(String(form.get("title") || ""));
    const file = form.get("file");

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study is required." }, 400);
    }
    if (caseId && !validUuid(caseId)) {
      return reply({ ok: false, error: "The selected qualitative case is invalid." }, 400);
    }
    if (participantId && !validUuid(participantId)) {
      return reply({ ok: false, error: "The selected participant is invalid." }, 400);
    }
    if (!caseId && !participantId && !standaloneName) {
      return reply(
        {
          ok: false,
          error: "Choose an existing case, a study participant, or a new standalone case.",
        },
        400,
      );
    }
    if (!(file instanceof File)) {
      return reply({ ok: false, error: "Choose a PDF, DOCX, TXT or Markdown file." }, 400);
    }
    if (file.size <= 0) {
      return reply({ ok: false, error: "The selected file is empty." }, 400);
    }
    if (file.size > MAX_FILE_BYTES) {
      return reply({ ok: false, error: "Qualitative imports are limited to 20 MiB per file." }, 413);
    }

    const admin = researchAdmin();

    const { data: study, error: studyError } = await admin
      .from("research_studies")
      .select("id,components")
      .eq("id", studyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (studyError) throw studyError;
    if (!study) {
      return reply({ ok: false, error: "This study is not available." }, 404);
    }

    const components =
      study.components && typeof study.components === "object"
        ? (study.components as Record<string, unknown>)
        : {};
    if (components.qualitative !== true) {
      return reply(
        { ok: false, error: "Enable Qualitative data in Study Builder before importing sources." },
        409,
      );
    }

    const parsed = await parseFile(file);

    let qualitativeCase: { id: string; name?: string } | null = null;

    if (caseId) {
      const { data, error: caseError } = await admin
        .from("qualitative_cases")
        .select("id,name")
        .eq("id", caseId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (caseError) throw caseError;
      if (!data) {
        return reply({ ok: false, error: "That qualitative case could not be found." }, 404);
      }
      qualitativeCase = data;
    } else if (participantId) {
      const { data: participant, error: participantError } = await admin
        .from("study_participants")
        .select("id,public_id,status,is_test")
        .eq("id", participantId)
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (participantError) throw participantError;
      if (!participant) {
        return reply(
          { ok: false, error: "That participant does not belong to this study." },
          404,
        );
      }

      const { data: existingCase, error: existingCaseError } = await admin
        .from("qualitative_cases")
        .select("id,name")
        .eq("study_id", studyId)
        .eq("owner_user_id", user.id)
        .eq("participant_id", participantId)
        .maybeSingle();
      if (existingCaseError) throw existingCaseError;

      if (existingCase) {
        qualitativeCase = existingCase;
      } else {
        const { data: createdCase, error: createCaseError } = await admin
          .from("qualitative_cases")
          .insert({
            owner_user_id: user.id,
            study_id: studyId,
            participant_id: participant.id,
            case_key: participant.public_id,
            name: `Participant ${participant.public_id}`,
            classification: "Participant",
            attributes: {},
          })
          .select("id,name")
          .single();
        if (createCaseError) throw createCaseError;
        qualitativeCase = createdCase;
      }
    } else {
      const { data: createdCase, error: createCaseError } = await admin
        .from("qualitative_cases")
        .insert({
          owner_user_id: user.id,
          study_id: studyId,
          participant_id: null,
          case_key: `CASE-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`,
          name: standaloneName,
          classification: "Case",
          attributes: {},
        })
        .select("id,name")
        .single();
      if (createCaseError) throw createCaseError;
      qualitativeCase = createdCase;
    }

    if (!qualitativeCase) {
      return reply({ ok: false, error: "The qualitative case could not be prepared." }, 500);
    }
    const extracted = String(parsed.text || "").slice(0, MAX_EXTRACTED_CHARS);
    if (!extracted.trim()) {
      return reply(
        {
          ok: false,
          error:
            "No extractable text was found. Scanned/image-only PDFs will need OCR in a later import flow.",
        },
        422,
      );
    }

    const fallbackTitle = cleanName(file.name.replace(/\.[^.]+$/, "")) || "Imported source";
    const title = titleOverride || fallbackTitle;

    const { data: source, error: sourceError } = await admin
      .from("qualitative_sources")
      .insert({
        owner_user_id: user.id,
        study_id: studyId,
        case_id: qualitativeCase.id,
        source_type: parsed.sourceType,
        title,
        content_text: extracted,
        original_filename: cleanName(file.name),
        mime_type: file.type || null,
        storage_path: null,
        metadata: {
          ...parsed.metadata,
          imported_at: new Date().toISOString(),
          original_size_bytes: file.size,
          truncated: parsed.text.length > MAX_EXTRACTED_CHARS,
        },
      })
      .select("*")
      .single();

    if (sourceError) throw sourceError;

    return reply({
      ok: true,
      case: qualitativeCase,
      source,
      extractedCharacters: extracted.length,
      truncated: parsed.text.length > MAX_EXTRACTED_CHARS,
    });
  } catch (error) {
    console.error("Qualitative document import failed:", error);
    const message = error instanceof Error ? error.message : "The file could not be imported.";
    if (message.startsWith("Unsupported file type")) {
      return reply({ ok: false, error: message }, 415);
    }
    return reply({ ok: false, error: "PsyLattice could not import that qualitative document." }, 500);
  }
}
