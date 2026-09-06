import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiRateLimitResponse, consumeAiRateLimit } from "@/lib/ai/rateLimit";

const openai = new OpenAI();

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: Request) {
  try {
    // -------------------------------------------------
    // 1. Confirm that the user is signed into PsyLattice
    // -------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be signed in to use the AI Guide.",
        },
        {
          status: 401,
        }
      );
    }

    if (!consumeAiRateLimit("guide", user.id)) {
      return aiRateLimitResponse();
    }

    // -------------------------------------------------
    // 2. Read conversation sent from the website
    // -------------------------------------------------

    const body = await request.json();

    const incomingMessages: ChatMessage[] =
      Array.isArray(body.messages)
        ? body.messages
        : [];

    if (incomingMessages.length === 0) {
      return NextResponse.json(
        {
          error: "Please enter a message.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // 3. Clean and limit conversation history
    // -------------------------------------------------

    const messages = incomingMessages
      .filter(
        (item) =>
          item &&
          (item.role === "user" ||
            item.role === "assistant") &&
          typeof item.content === "string"
      )
      .slice(-12)
      .map((item) => ({
        role: item.role,
        content: item.content.trim().slice(0, 4000),
      }))
      .filter((item) => item.content.length > 0);

    if (messages.length === 0) {
      return NextResponse.json(
        {
          error: "Please enter a message.",
        },
        {
          status: 400,
        }
      );
    }

    // -------------------------------------------------
    // 4. Send conversation to GPT-5.6 Luna
    // -------------------------------------------------

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      reasoning: {
        effort: "low",
      },

      max_output_tokens: 500,

      instructions: `
You are the PsyLattice AI Guide.

PsyLattice is a psychological measurement and self-understanding platform.

Your role is to provide concise, supportive, careful, and educational guidance.

YOU MAY:

- help users describe and reflect on what they have been experiencing;
- explain psychological concepts in accessible language;
- help users identify areas they may want to assess;
- explain what different categories of psychological assessment measure;
- suggest that repeated daily monitoring may be useful when experiences vary across situations or time;
- help users prepare information or questions they may choose to discuss with a qualified professional;
- help users understand and navigate PsyLattice.

ASSESSMENT GUIDANCE:

When appropriate, you may suggest an AREA that the user could explore, such as:

- stress;
- mood;
- anxiety experiences;
- sleep;
- wellbeing;
- emotion regulation;
- loneliness or social connection;
- attention;
- daily experiences.

Do not claim that a specific questionnaire is available in PsyLattice unless that questionnaire has been supplied to you as part of the PsyLattice assessment catalogue.

Do not invent assessment names, scoring rules, cutoffs, validation claims, or research findings.

IMPORTANT CLINICAL BOUNDARIES:

- Do not diagnose the user.
- Do not claim that the user has a psychiatric or psychological disorder.
- Do not provide definitive clinical conclusions.
- Do not prescribe medication.
- Do not tell users to begin, discontinue, increase, decrease, or change medication.
- Do not present yourself as a psychologist, psychiatrist, physician, therapist, or other healthcare professional.
- Do not tell the user that PsyLattice replaces professional assessment or treatment.
- Do not infer a diagnosis from a questionnaire score.
- Do not unnecessarily medicalize normal emotional experiences.
- Distinguish observations and possibilities from conclusions.
- If there is not enough information, say so instead of guessing.

SAFETY:

If the user describes immediate danger, intent to harm themselves, intent to harm another person, or another urgent safety situation, prioritize immediate real-world support. Make clear that PsyLattice is not an emergency service.

STYLE:

- Be warm but professional.
- Be conversational.
- Use plain language.
- Ask useful follow-up questions when necessary.
- Keep ordinary answers relatively concise.
- Avoid overwhelming the user with long lists.
- Do not repeatedly give disclaimers unless they are relevant.
      `,

      input: messages,
    });

    return NextResponse.json({
      reply:
        response.output_text ||
        "I couldn't generate a response. Please try again.",
    });
  } catch {
    console.error("PsyLattice AI Guide request failed.");

    return NextResponse.json(
      {
        error:
          "The AI Guide is temporarily unavailable. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
