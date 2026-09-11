import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GEMINI_MODEL =
  process.env.PSYLATTICE_GEMINI_ECONOMY_MODEL?.trim() ||
  "gemini-2.5-flash-lite";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "GEMINI_API_KEY is missing from the server environment.",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        GEMINI_MODEL,
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Reply with exactly this sentence: PsyLattice Gemini connection is working.",
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 40,
          },
        }),
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini test failed:", data);
      return NextResponse.json(
        {
          ok: false,
          model: GEMINI_MODEL,
          error:
            data?.error?.message ||
            `Gemini returned HTTP ${response.status}.`,
        },
        { status: response.status },
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part?.text || "")
        .join("")
        .trim() || "";

    return NextResponse.json({
      ok: true,
      provider: "google-gemini",
      model: GEMINI_MODEL,
      response: text,
      usage: {
        promptTokens: data?.usageMetadata?.promptTokenCount ?? null,
        outputTokens: data?.usageMetadata?.candidatesTokenCount ?? null,
        totalTokens: data?.usageMetadata?.totalTokenCount ?? null,
      },
    });
  } catch (error) {
    console.error("Gemini test route failed:", error);

    return NextResponse.json(
      {
        ok: false,
        model: GEMINI_MODEL,
        error:
          error instanceof Error
            ? error.message
            : "PsyLattice could not reach the Gemini API.",
      },
      { status: 500 },
    );
  }
}
