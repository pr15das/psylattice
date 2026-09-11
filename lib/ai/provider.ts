import "server-only";

import OpenAI from "openai";
import type { ResearchAiProvider } from "@/lib/billing/ai";

export type PsyLatticeAiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PsyLatticeAiProviderResponse = {
  text: string;
  provider: ResearchAiProvider;
  providerModel: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

function finiteToken(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : null;
}

async function callOpenAi(args: {
  model: string;
  instructions: string;
  input: PsyLatticeAiMessage[];
  maxOutputTokens: number;
}): Promise<PsyLatticeAiProviderResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const openai = new OpenAI({ apiKey });
  const response = await openai.responses.create({
    model: args.model,
    instructions: args.instructions,
    input: args.input,
    max_output_tokens: args.maxOutputTokens,
    store: false,
  });

  return {
    text: response.output_text?.trim() || "",
    provider: "openai",
    providerModel: args.model,
    inputTokens: finiteToken(response.usage?.input_tokens),
    outputTokens: finiteToken(response.usage?.output_tokens),
  };
}

function mergeGeminiTurns(messages: PsyLatticeAiMessage[]) {
  const merged: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  for (const message of messages) {
    const role: "user" | "model" = message.role === "assistant" ? "model" : "user";
    const content = message.content.trim();
    if (!content) continue;

    const previous = merged[merged.length - 1];
    if (previous?.role === role) {
      previous.parts[0].text += `\n\n${content}`;
    } else {
      merged.push({ role, parts: [{ text: content }] });
    }
  }

  return merged;
}

async function callGemini(args: {
  model: string;
  instructions: string;
  input: PsyLatticeAiMessage[];
  maxOutputTokens: number;
}): Promise<PsyLatticeAiProviderResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const model = args.model.trim() || "gemini-3.5-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: args.instructions }],
      },
      contents: mergeGeminiTurns(args.input),
      generationConfig: {
        maxOutputTokens: args.maxOutputTokens,
        temperature: 0.35,
      },
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const error = payload.error as Record<string, unknown> | undefined;
    const message = typeof error?.message === "string" ? error.message : "Gemini request failed.";
    throw new Error(message);
  }

  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  const first = (candidates[0] || {}) as Record<string, unknown>;
  const content = (first.content || {}) as Record<string, unknown>;
  const parts = Array.isArray(content.parts) ? content.parts : [];
  const text = parts
    .map((part) => {
      if (!part || typeof part !== "object") return "";
      const value = (part as Record<string, unknown>).text;
      return typeof value === "string" ? value : "";
    })
    .join("")
    .trim();

  const usage = (payload.usageMetadata || {}) as Record<string, unknown>;

  return {
    text,
    provider: "gemini",
    providerModel: model,
    inputTokens: finiteToken(usage.promptTokenCount),
    outputTokens: finiteToken(usage.candidatesTokenCount),
  };
}

export async function generatePsyLatticeAiResponse(args: {
  provider: ResearchAiProvider;
  providerModel: string;
  instructions: string;
  input: PsyLatticeAiMessage[];
  maxOutputTokens: number;
}) {
  if (args.provider === "gemini") {
    return callGemini({
      model: args.providerModel,
      instructions: args.instructions,
      input: args.input,
      maxOutputTokens: args.maxOutputTokens,
    });
  }

  return callOpenAi({
    model: args.providerModel,
    instructions: args.instructions,
    input: args.input,
    maxOutputTokens: args.maxOutputTokens,
  });
}
