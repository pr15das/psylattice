import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiRateLimitResponse, consumeAiRateLimit } from "@/lib/ai/rateLimit";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 16;
const MAX_MESSAGE_CHARS = 5_000;
const MAX_TOTAL_MESSAGE_CHARS = 35_000;
const MAX_DOCUMENT_CHARS = 120_000;

type WritingMessage = {
  role: "user" | "assistant";
  content: string;
};

const FORMAT_LABELS: Record<string, string> = {
  apa7_student: "APA 7 student paper",
  apa7_professional: "APA 7 professional paper",
  mla9: "MLA 9 research paper",
  chicago_turabian: "Chicago/Turabian academic paper",
  ieee_conference: "IEEE conference manuscript",
  custom: "custom or institution-specific format",
};

const WRITING_ASSISTANT_INSTRUCTIONS = `
You are the PsyLattice Writing Assistant for researchers and students drafting academic work.

CORE ROLE
- Help with academic writing, clarity, organization, argument structure, transitions, scholarly tone, concise wording, and paper planning.
- Treat text supplied by the user as their draft. Preserve their meaning unless they explicitly ask for substantive rewriting.
- Never invent research findings, participant data, quotations, citations, references, DOIs, page numbers, institutional requirements, or sources.
- If the user asks for factual claims or references that are not in the supplied draft or chat, clearly say verification or source lookup is needed.
- Do not imply that a generic style preset overrides instructions from a journal, university, supervisor, department, conference, or assignment.

DOCUMENT PRIVACY BOUNDARY
- You only receive document text when PsyLattice explicitly includes it in the current request after user permission.
- Never claim you can see the document when no document text is included.
- Do not ask for direct identifiers or sensitive participant information.

ACADEMIC INTEGRITY
- Assist the user's authorship rather than impersonating independent scholarly work.
- When drafting substantial prose, label it as proposed or draft wording when useful.
- Do not fabricate evidence to make an argument stronger.

STYLE
- Be concise, concrete, and helpful to early-career researchers.
- Prefer actionable edits and explain why a change improves the paper when the user asks for critique.
`;

const RESTRUCTURE_INSTRUCTIONS = `
You restructure an existing academic draft into a clearer paper organization while preserving the author's actual content.

NON-NEGOTIABLE RULES
- Do not invent or add findings, sample details, statistics, methods, citations, references, quotations, theories, facts, or claims that are not already present.
- Do not make up missing sections. If content needed for a conventional section is absent, insert a short bracketed placeholder such as [Add Method details here] rather than inventing content.
- Preserve all meaningful existing content unless it is an obvious duplicate.
- Do not convert tentative claims into definitive claims.
- Keep citations/references exactly as supplied unless only moving them to a more appropriate section.
- Output only safe HTML suitable for a rich-text editor. No markdown fences, commentary, or explanation.
- Allowed semantic elements: h1, h2, h3, p, strong, em, u, blockquote, ul, ol, li, table, thead, tbody, tr, th, td, hr, a, br.
`;

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

function parseMessages(value: unknown): WritingMessage[] {
  if (!Array.isArray(value)) return [];
  const parsed: WritingMessage[] = [];
  let total = 0;
  for (const raw of value.slice(-MAX_MESSAGES)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const role = row.role;
    const content = typeof row.content === "string" ? row.content.trim() : "";
    if ((role !== "user" && role !== "assistant") || !content) continue;
    const clipped = content.slice(0, MAX_MESSAGE_CHARS);
    total += clipped.length;
    if (total > MAX_TOTAL_MESSAGE_CHARS) throw new Error("This Writing Assistant chat is too long. Start a new chat and try again.");
    parsed.push({ role, content: clipped });
  }
  return parsed;
}

function parseDocumentText(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  if (value.length > MAX_DOCUMENT_CHARS) {
    throw new Error("This document is too long to send to the Writing Assistant in one request. Work with a shorter section for now.");
  }
  return value.trim();
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return jsonError("Your PsyLattice session has expired. Please sign in again.", 401);

    if (!consumeAiRateLimit("writing", user.id)) {
      return aiRateLimitResponse();
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return jsonError("The PsyLattice Writing Assistant is not configured.", 503);

    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action === "restructure" ? "restructure" : "chat";
    const documentId = typeof body.document_id === "string" ? body.document_id.trim() : "";
    if (!documentId) return jsonError("A writing document is required.");

    const { data: ownedDocument, error: documentError } = await supabase
      .from("research_writing_documents")
      .select("id,title,owner_user_id")
      .eq("id", documentId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (documentError || !ownedDocument) return jsonError("This writing document is not available to your researcher account.", 404);

    const formatStyle = typeof body.format_style === "string" && FORMAT_LABELS[body.format_style] ? body.format_style : "custom";
    const formatLabel = FORMAT_LABELS[formatStyle];
    const documentTitle = typeof body.document_title === "string" ? body.document_title.trim().slice(0, 300) : ownedDocument.title;
    const documentText = parseDocumentText(body.document_text);

    const openai = new OpenAI({ apiKey });
    const model = process.env.PSYLATTICE_WRITING_AI_MODEL || process.env.PSYLATTICE_RESEARCH_AI_MODEL || process.env.PSYLATTICE_AI_GUIDE_MODEL || "gpt-5.6";

    if (action === "restructure") {
      if (!documentText) return jsonError("Document access is required to restructure the paper.");
      const response = await openai.responses.create({
        model,
        instructions: RESTRUCTURE_INSTRUCTIONS,
        input: [
          {
            role: "user",
            content: `TARGET FORMAT: ${formatLabel}\nDOCUMENT TITLE: ${documentTitle}\n\nCURRENT AUTHOR DRAFT\n${documentText}\n\nEND AUTHOR DRAFT\n\nRestructure this draft into a clear ${formatLabel} paper organization. Preserve the author's content and use bracketed placeholders where expected sections lack content.`,
          },
        ],
        max_output_tokens: 5_000,
        store: false,
      });
      const html = response.output_text?.trim();
      if (!html) return jsonError("The Writing Assistant returned an empty restructure response.", 502);
      return NextResponse.json({ ok: true, html }, { headers: { "Cache-Control": "no-store" } });
    }

    const messages = parseMessages(body.messages);
    if (!messages.some((message) => message.role === "user")) return jsonError("Enter a writing question first.");

    const contextMessage = documentText
      ? `The user explicitly allowed PsyLattice to include the current document for THIS REQUEST ONLY.\nDOCUMENT TITLE: ${documentTitle}\nCURRENT FORMAT: ${formatLabel}\n\nDOCUMENT TEXT\n${documentText}\nEND DOCUMENT TEXT`
      : `No document text was provided for this request. Do not claim you can see or review the user's paper. The current selected format label is ${formatLabel}.`;

    const response = await openai.responses.create({
      model,
      instructions: WRITING_ASSISTANT_INSTRUCTIONS,
      input: [
        { role: "user", content: contextMessage },
        ...messages,
      ],
      max_output_tokens: 1_800,
      store: false,
    });

    const reply = response.output_text?.trim();
    if (!reply) return jsonError("The Writing Assistant returned an empty response.", 502);
    return NextResponse.json({ ok: true, reply }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("PsyLattice Writing Assistant request failed.");
    return jsonError("Unable to process the Writing Assistant request right now.", 500);
  }
}
