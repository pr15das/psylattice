import { NextRequest, NextResponse } from "next/server";
import { authenticatedBillingUser } from "@/lib/billing/server";
import {
  AiAccessError,
  getResearchAiModelState,
  setResearchAiModelPreference,
} from "@/lib/billing/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET() {
  try {
    const user = await authenticatedBillingUser();
    if (!user) return noStoreJson({ ok: false, error: "Please sign in again." }, 401);

    const state = await getResearchAiModelState(user.id);
    return noStoreJson({ ok: true, ...state });
  } catch (error) {
    console.error("Could not load PsyLattice AI model access:", error);
    return noStoreJson(
      { ok: false, error: "PsyLattice could not load your AI model access right now." },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) return noStoreJson({ ok: false, error: "Please sign in again." }, 401);

    const body = (await request.json()) as Record<string, unknown>;
    const model = typeof body.model === "string" ? body.model.trim() : "";
    if (!model) return noStoreJson({ ok: false, error: "Choose an AI model first." }, 400);

    const state = await setResearchAiModelPreference(user.id, model);
    return noStoreJson({ ok: true, ...state });
  } catch (error) {
    if (error instanceof AiAccessError) {
      return noStoreJson(
        { ok: false, error: error.message, code: error.code },
        error.status,
      );
    }

    console.error("Could not change PsyLattice AI model:", error);
    return noStoreJson(
      { ok: false, error: "PsyLattice could not change the AI model right now." },
      500,
    );
  }
}
