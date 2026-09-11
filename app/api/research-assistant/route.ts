import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  AiAccessError,
  completeResearchAiRequest,
  prepareResearchAiRequest,
  refundResearchAiRequest,
} from "@/lib/billing/ai";
import { generatePsyLatticeAiResponse } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";

const MAX_MESSAGES = 14;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TOTAL_MESSAGE_CHARS = 28_000;
const MAX_CONTEXT_CHARS = 500_000;

type ResearchMessage = {
  role: "user" | "assistant";
  content: string;
};

const RESEARCH_ASSISTANT_INSTRUCTIONS = `
You are the PsyLattice Research Assistant. You help researchers understand a specific PsyLattice study using an authoritative structured study context supplied by PsyLattice.

NON-NEGOTIABLE NUMERICAL RULES
- Treat the supplied STUDY CONTEXT as the only source for numerical results.
- Never invent, estimate, recompute, reverse-engineer, or infer a missing statistic from participant rows.
- You may explain an explicitly supplied statistic, confidence interval, p-value, effect size, condition difference, count, percentage, or quality flag.
- If a requested correlation, regression, ANOVA, mixed model, trial-level generalized model, questionnaire-cognitive association, p-value, confidence interval, effect size, exclusion, or other analysis is not explicitly present, say that it has not been computed yet.
- Do not use participant-level rows to calculate new statistics yourself. They are supplied only for qualitative inspection and pseudonymous participant-specific review.
- Distinguish descriptive patterns from inferential results. Never call a result statistically significant unless an explicit inferential result with a p-value is present.
- Never claim a hypothesis is supported solely from descriptive differences. If an explicit inferential result directly tests the stated hypothesis, explain what it does and does not support.

RESEARCH INTERPRETATION RULES
- Preserve repeated administrations as distinct study elements. Do not merge two placements of the same questionnaire or cognitive task unless the context explicitly does so.
- Quality flags are review prompts, not automatic exclusions. Never tell the researcher PsyLattice excluded a participant unless the context explicitly says so.
- Be cautious about causality. Do not infer causation from cross-sectional, observational, or otherwise non-causal designs.
- Mention sample size and missing/incomplete data when they materially affect interpretation.
- If TEST data are included, clearly distinguish that from live study data.
- If a questionnaire score summary is descriptive-only, do not manufacture a normative/clinical interpretation unless an explicit validated interpretation is supplied in context.
- Do not diagnose participants or make clinical decisions from research data.

PRIVACY AND DATA HANDLING
- Direct identifiers are intentionally excluded. Refer to participant IDs only when necessary for data-quality review.
- Do not ask for names, emails, phone numbers, addresses, or other direct identifiers.

STYLE
- Be concise, research-literate, and clear for students and early-career researchers.
- When useful, structure the answer as: What the data show / What that means / What you cannot conclude yet / Recommended next analysis.
- For thesis-style wording, explicitly label proposed text as a draft and keep claims within the supplied evidence.
`;

function jsonError(error: string, status = 400) {
  return NextResponse.json(
    { ok: false, error },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function parseMessages(value: unknown): ResearchMessage[] {
  if (!Array.isArray(value)) {
    throw new Error("A messages array is required.");
  }

  const parsed: ResearchMessage[] = [];
  let total = 0;

  for (const raw of value.slice(-MAX_MESSAGES)) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const role = row.role;
    const content = typeof row.content === "string" ? row.content.trim() : "";
    if (role !== "user" && role !== "assistant") continue;
    if (!content) continue;
    const clipped = content.slice(0, MAX_MESSAGE_CHARS);
    total += clipped.length;
    if (total > MAX_TOTAL_MESSAGE_CHARS) {
      throw new Error("This Research Assistant conversation is too long. Start a new chat and try again.");
    }
    parsed.push({ role, content: clipped });
  }

  if (!parsed.some((message) => message.role === "user")) {
    throw new Error("Enter a research question first.");
  }

  return parsed;
}

function parseContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("A structured study context is required.");
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_CONTEXT_CHARS) {
    throw new Error("This study context is too large for one AI request. Turn off participant-level summaries and try again.");
  }
  return { context: value as Record<string, unknown>, serialized };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError("Your PsyLattice session has expired. Please sign in again.", 401);
    }

    const body = (await request.json()) as Record<string, unknown>;
    const studyId = typeof body.study_id === "string" ? body.study_id.trim() : "";
    if (!studyId) {
      return jsonError("A study is required.");
    }

    const { data: study, error: studyError } = await supabase
      .from("research_studies")
      .select("id,title,owner_user_id")
      .eq("id", studyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (studyError || !study) {
      return jsonError("This study is not available to your researcher account.", 404);
    }

    const messages = parseMessages(body.messages);
    const { context, serialized } = parseContext(body.context);
    const contextStudy = context.study;
    if (
      !contextStudy ||
      typeof contextStudy !== "object" ||
      Array.isArray(contextStudy) ||
      String((contextStudy as Record<string, unknown>).id || "") !== studyId
    ) {
      return jsonError("The supplied study context does not match the selected study.");
    }

    const routeDefaultModel =
      process.env.PSYLATTICE_RESEARCH_AI_MODEL ||
      process.env.PSYLATTICE_AI_GUIDE_MODEL ||
      "gpt-5.6";

    const reservation = await prepareResearchAiRequest({
      userId: user.id,
      surface: "research-assistant",
      studyId,
      routeDefaultModel,
      contextChars: serialized.length,
      messages,
      metadata: { studyContext: true },
    });

    let response;
    try {
      response = await generatePsyLatticeAiResponse({
        provider: reservation.provider,
        providerModel: reservation.providerModel,
        instructions: RESEARCH_ASSISTANT_INSTRUCTIONS,
        input: [
          {
            role: "user",
            content: `AUTHORITATIVE PSYLATTICE STUDY CONTEXT\nStudy: ${study.title}\n\n${serialized}\n\nEND STUDY CONTEXT`,
          },
          ...messages,
        ],
        maxOutputTokens: 1_500,
      });
    } catch (providerError) {
      await refundResearchAiRequest(
        user.id,
        reservation.usageId,
        "research_assistant_provider_failure",
      );
      throw providerError;
    }

    const reply = response.text.trim();
    if (!reply) {
      await refundResearchAiRequest(
        user.id,
        reservation.usageId,
        "research_assistant_empty_response",
      );
      return jsonError("The Research Assistant returned an empty response.", 502);
    }

    try {
      await completeResearchAiRequest(user.id, reservation.usageId, {
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        metadata: {
          outcome: "success",
          provider: response.provider,
          providerModel: response.providerModel,
        },
      });
    } catch (ledgerError) {
      console.error("Could not finalize Research Assistant AI usage:", ledgerError);
    }

    return NextResponse.json(
      { ok: true, reply, aiRemainingPercent: reservation.remainingPercent },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof AiAccessError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("PsyLattice Research Assistant request failed:", error);
    return jsonError(
      "The Research Assistant could not respond. Please try again.",
      500,
    );
  }
}
