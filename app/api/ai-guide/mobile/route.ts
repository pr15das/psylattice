import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type GuideRole = "user" | "assistant";
type GuideMessage = {
  role: GuideRole;
  content: string;
};

const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 24000;

const GUIDE_INSTRUCTIONS = `
You are the PsyLattice AI Guide inside the Self workspace of a psychological assessment and monitoring platform.

Your role is supportive, educational, reflective, and navigational. Help users:
- describe and organise what they have been noticing;
- identify broad psychological areas they may want to reflect on or assess;
- think about whether repeated daily monitoring could help them observe patterns;
- understand psychological concepts in clear, accessible language;
- organise information they may choose to discuss with a qualified professional.

Boundaries:
- Do not diagnose psychiatric or medical disorders.
- Do not tell the user that they have a disorder based on symptoms, scores, or chat content.
- Do not prescribe medication or treatment, select treatment for the user, or present PsyLattice as a replacement for professional care.
- Do not turn descriptive self-report patterns into causal conclusions, crisis predictions, or clinical determinations.
- Do not claim that a questionnaire, score, or AI conversation establishes a diagnosis.
- Direct questionnaire recommendations are not yet connected to PsyLattice's approved catalogue. You may suggest an area or construct to explore, but do not invent a PsyLattice questionnaire or claim a specific measure is available unless the user already named it.
- If a user describes an immediate danger or emergency, clearly encourage them to seek immediate local emergency or qualified human support. Do not present yourself as an emergency service.

Be calm, clear, concise, and useful. Ask focused follow-up questions when that would genuinely help. Avoid unnecessary disclaimers in every response, but preserve the boundaries above whenever relevant.
`.trim();

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

async function authenticatedAndroidUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("PsyLattice authentication is not configured.");
  }

  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) return null;

  const authClient = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

function parseMessages(value: unknown): GuideMessage[] {
  if (!Array.isArray(value)) {
    throw new Error("A messages array is required.");
  }

  const parsed: GuideMessage[] = [];
  let totalChars = 0;

  for (const raw of value.slice(-MAX_MESSAGES)) {
    if (!raw || typeof raw !== "object") continue;

    const row = raw as Record<string, unknown>;
    const role = row.role;
    const content =
      typeof row.content === "string" ? row.content.trim() : "";

    if (role !== "user" && role !== "assistant") continue;
    if (!content) continue;

    const clipped = content.slice(0, MAX_MESSAGE_CHARS);
    totalChars += clipped.length;

    if (totalChars > MAX_TOTAL_CHARS) {
      throw new Error("This AI Guide conversation is too long. Start a new chat and try again.");
    }

    parsed.push({ role, content: clipped });
  }

  if (!parsed.some((message) => message.role === "user")) {
    throw new Error("Enter a message for the AI Guide.");
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedAndroidUser(request);

    if (!user) {
      return jsonError(
        "Your PsyLattice session has expired. Please sign in again.",
        401
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return jsonError("The PsyLattice AI Guide is not configured.", 503);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const messages = parseMessages(body.messages);

    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: process.env.PSYLATTICE_AI_GUIDE_MODEL || "gpt-5.6",
      instructions: GUIDE_INSTRUCTIONS,
      input: messages,
      max_output_tokens: 900,
      store: false,
    });

    const reply = response.output_text?.trim();
    if (!reply) {
      return jsonError("The AI Guide returned an empty response.", 502);
    }

    return NextResponse.json(
      { ok: true, reply },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("PsyLattice mobile AI Guide request failed:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "The AI Guide could not respond. Please try again.",
      500
    );
  }
}
