import "server-only";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import {
  RESEARCH_PLAN_DEFINITIONS,
  type AiModelAccess,
  type ResearchPlanTier,
} from "@/lib/billing/plans";

export type ResearchAiModelKey =
  | "auto"
  | "openai-gpt"
  | "claude"
  | "gemini-pro"
  | "gemini-flash"
  | "gemini-flash-economy";

export type ResearchAiSurface =
  | "research-assistant"
  | "writing-assistant"
  | "writing-restructure"
  | "analysis-assistant";

export type PublicAiBudgetSnapshot = {
  remainingPercent: number;
  exhausted: boolean;
};

type InternalAiBudgetSnapshot = PublicAiBudgetSnapshot & {
  effectivePlan: ResearchPlanTier;
};

export type PublicAiModelOption = {
  key: ResearchAiModelKey;
  name: string;
  description: string;
  impact: "Lowest" | "Low" | "Medium" | "High";
  allowed: boolean;
  available: boolean;
  badge?: string;
};

export class AiAccessError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AiAccessError";
    this.code = code;
    this.status = status;
  }
}

function aiAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("AI billing database environment variables are incomplete.");
  }

  return createSupabaseAdmin(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function planFromUnknown(value: unknown): ResearchPlanTier {
  if (
    value === "study-pass" ||
    value === "pro-monthly" ||
    value === "pro-annual"
  ) {
    return value;
  }
  return "free";
}

function clampPercent(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeRpcMessage(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const record = error as Record<string, unknown>;
  return [record.message, record.details, record.hint]
    .filter((part): part is string => typeof part === "string")
    .join(" ");
}

function mapAiRpcError(error: unknown): never {
  const message = normalizeRpcMessage(error);

  if (message.includes("PL_AI_BUDGET_EXHAUSTED")) {
    throw new AiAccessError(
      "AI_ALLOWANCE_EXHAUSTED",
      "Your AI allowance is exhausted. Add an AI Boost or upgrade your plan to continue.",
      402,
    );
  }

  if (message.includes("PL_AI_RATE_LIMIT")) {
    throw new AiAccessError(
      "AI_RATE_LIMITED",
      "Too many AI requests were sent in a short period. Please wait a moment and try again.",
      429,
    );
  }

  if (message.includes("PL_AI_STUDY_FORBIDDEN")) {
    throw new AiAccessError(
      "AI_STUDY_FORBIDDEN",
      "This study is not available to your researcher account.",
      403,
    );
  }

  if (message.includes("PL_AI_INVALID_CHARGE")) {
    throw new AiAccessError(
      "AI_REQUEST_INVALID",
      "PsyLattice could not calculate the AI request budget safely.",
      500,
    );
  }

  throw error instanceof Error
    ? error
    : new Error(message || "PsyLattice AI billing could not be updated.");
}

export async function getInternalAiBudgetSnapshot(
  userId: string,
): Promise<InternalAiBudgetSnapshot> {
  const admin = aiAdmin();
  const { data, error } = await admin.rpc("psylattice_ai_budget_snapshot", {
    p_user_id: userId,
  });

  if (error) mapAiRpcError(error);

  const row = (data || {}) as Record<string, unknown>;
  return {
    effectivePlan: planFromUnknown(row.effectivePlan),
    remainingPercent: clampPercent(row.remainingPercent),
    exhausted: row.exhausted === true,
  };
}

export async function getPublicAiBudgetSnapshot(
  userId: string,
): Promise<PublicAiBudgetSnapshot> {
  const snapshot = await getInternalAiBudgetSnapshot(userId);
  return {
    remainingPercent: snapshot.remainingPercent,
    exhausted: snapshot.exhausted,
  };
}

function allowedModelKeys(access: AiModelAccess): Set<ResearchAiModelKey> {
  // Free researchers keep the simple PsyLattice Auto experience. Auto is
  // deliberately pinned to Gemini Flash Economy for Free accounts.
  if (access === "auto-only") return new Set(["auto"]);

  // Study Pass gets a useful but still curated selector.
  if (access === "selected") {
    return new Set(["auto", "openai-gpt", "gemini-flash-economy"]);
  }

  return new Set([
    "auto",
    "openai-gpt",
    "claude",
    "gemini-pro",
    "gemini-flash",
    "gemini-flash-economy",
  ]);
}

function providerAvailable(key: ResearchAiModelKey, access: AiModelAccess) {
  if (key === "auto") {
    // Free Auto must never silently fall through to OpenAI or a higher-cost model.
    return access === "auto-only"
      ? Boolean(process.env.GEMINI_API_KEY)
      : Boolean(process.env.OPENAI_API_KEY);
  }

  if (key === "openai-gpt") return Boolean(process.env.OPENAI_API_KEY);
  if (key === "gemini-flash-economy") return Boolean(process.env.GEMINI_API_KEY);

  // Claude, Gemini Pro and regular Gemini Flash are intentionally deferred.
  return false;
}

function modelCatalog(access: AiModelAccess): PublicAiModelOption[] {
  const allowed = allowedModelKeys(access);
  const catalogue: Array<Omit<PublicAiModelOption, "allowed" | "available">> = [
    {
      key: "auto",
      name: "PsyLattice Auto",
      description:
        access === "auto-only"
          ? "Free PsyLattice Auto is pinned to Google Gemini 3.5 Flash-Lite Free Tier. It never falls back to OpenAI."
          : "PsyLattice default routing for your paid plan. Paid Auto may use the configured OpenAI route.",
      impact: access === "auto-only" ? "Lowest" : "Low",
      badge: "Recommended",
    },
    {
      key: "openai-gpt",
      name: "OpenAI GPT",
      description: "A selectable OpenAI model path for paid research accounts.",
      impact: "High",
    },
    {
      key: "claude",
      name: "Claude",
      description: "Provider integration coming later.",
      impact: "Medium",
    },
    {
      key: "gemini-pro",
      name: "Gemini Pro",
      description: "Provider integration coming later.",
      impact: "Medium",
    },
    {
      key: "gemini-flash",
      name: "Gemini Flash",
      description: "Provider integration coming later.",
      impact: "Low",
    },
    {
      key: "gemini-flash-economy",
      name: "Gemini Flash Economy",
      description: "Google Gemini 3.5 Flash-Lite Free Tier. Used underneath Free Auto and directly selectable on paid plans for the slowest budget usage.",
      impact: "Lowest",
      badge: "Efficient",
    },
  ];

  return catalogue.map((model) => ({
    ...model,
    allowed: allowed.has(model.key),
    available: allowed.has(model.key) && providerAvailable(model.key, access),
  }));
}

export async function getResearchAiModelState(userId: string) {
  const budget = await getInternalAiBudgetSnapshot(userId);
  const access = RESEARCH_PLAN_DEFINITIONS[budget.effectivePlan].aiModelAccess;
  const admin = aiAdmin();

  const { data, error } = await admin
    .from("research_ai_preferences")
    .select("selected_model")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const requested = String(data?.selected_model || "auto") as ResearchAiModelKey;
  const options = modelCatalog(access);
  const selectedOption = options.find((model) => model.key === requested);
  const selectedModel =
    selectedOption?.allowed && selectedOption.available ? requested : "auto";

  return {
    modelAccess: access,
    selectedModel,
    models: options,
    remainingPercent: budget.remainingPercent,
    exhausted: budget.exhausted,
  };
}

export async function setResearchAiModelPreference(
  userId: string,
  requestedModel: string,
) {
  const state = await getResearchAiModelState(userId);
  const option = state.models.find((model) => model.key === requestedModel);

  if (!option) {
    throw new AiAccessError("AI_MODEL_INVALID", "That AI model is not available.", 400);
  }

  if (!option.allowed) {
    throw new AiAccessError(
      "AI_MODEL_UPGRADE_REQUIRED",
      "Your current plan does not include this AI model. Upgrade your plan to unlock it.",
      403,
    );
  }

  if (!option.available) {
    throw new AiAccessError(
      "AI_MODEL_NOT_READY",
      "This AI provider is not connected to PsyLattice yet.",
      409,
    );
  }

  const admin = aiAdmin();
  const { error } = await admin.from("research_ai_preferences").upsert(
    {
      user_id: userId,
      selected_model: option.key,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
  return getResearchAiModelState(userId);
}

function messageCharacterCount(messages: Array<{ content: string }>) {
  return messages.reduce((total, message) => total + message.content.length, 0);
}

export function estimateResearchAiUnits(args: {
  surface: ResearchAiSurface;
  contextChars?: number;
  messages?: Array<{ content: string }>;
}) {
  const contextChars = Math.max(0, Number(args.contextChars || 0));
  const messageChars = messageCharacterCount(args.messages || []);
  const totalChars = contextChars + messageChars;

  let base = 2;
  let divisor = 100_000;
  let maximum = 8;

  if (args.surface === "writing-restructure") {
    base = 5;
    divisor = 40_000;
    maximum = 10;
  } else if (args.surface === "writing-assistant") {
    base = 2;
    divisor = 60_000;
    maximum = 7;
  } else if (args.surface === "analysis-assistant") {
    base = 3;
    divisor = 120_000;
    maximum = 10;
  } else if (args.surface === "research-assistant") {
    base = 2;
    divisor = 120_000;
    maximum = 8;
  }

  const contextWeight = totalChars > 0 ? Math.ceil(totalChars / divisor) : 0;
  return Math.max(1, Math.min(maximum, base + contextWeight));
}

export type ResearchAiProvider = "openai" | "gemini";

function modelChargeMultiplier(args: {
  modelKey: ResearchAiModelKey;
  provider: ResearchAiProvider;
}) {
  // Hidden commercial weights, not customer-visible token counts.
  // Gemini Free/Economy is deliberately extremely light: with the Free base
  // pool below, ordinary calls cost ~0.1% and the largest normal calls ~0.2%.
  if (args.provider === "gemini") return 0.15;

  // Paid OpenAI choices intentionally consume the same visible allowance much
  // faster, reflecting their higher infrastructure cost.
  if (args.modelKey === "openai-gpt") return 12;
  return 6;
}

export type PreparedAiRequest = {
  usageId: string;
  modelKey: ResearchAiModelKey;
  provider: ResearchAiProvider;
  providerModel: string;
  remainingPercent: number;
};

export async function prepareResearchAiRequest(args: {
  userId: string;
  surface: ResearchAiSurface;
  studyId?: string | null;
  routeDefaultModel: string;
  contextChars?: number;
  messages?: Array<{ content: string }>;
  metadata?: Record<string, unknown>;
}): Promise<PreparedAiRequest> {
  const modelState = await getResearchAiModelState(args.userId);
  if (modelState.exhausted) {
    throw new AiAccessError(
      "AI_ALLOWANCE_EXHAUSTED",
      "Your AI allowance is exhausted. Add an AI Boost or upgrade your plan to continue.",
      402,
    );
  }

  const modelKey = modelState.selectedModel;

  // Free accounts cannot use a higher-cost Auto route. Their Auto traffic is
  // pinned to Gemini Flash Economy. Paid Auto keeps the existing OpenAI route.
  const freeAuto =
    modelKey === "auto" && modelState.modelAccess === "auto-only";
  const provider: ResearchAiProvider =
    freeAuto || modelKey === "gemini-flash-economy" ? "gemini" : "openai";

  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    throw new AiAccessError(
      "AI_PROVIDER_NOT_CONFIGURED",
      "PsyLattice AI is temporarily unavailable because the Gemini provider is not configured.",
      503,
    );
  }

  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    throw new AiAccessError(
      "AI_PROVIDER_NOT_CONFIGURED",
      "PsyLattice AI is temporarily unavailable because the OpenAI provider is not configured.",
      503,
    );
  }

  const providerModel =
    provider === "gemini"
      ? process.env.PSYLATTICE_GEMINI_ECONOMY_MODEL || "gemini-3.5-flash-lite"
      : modelKey === "openai-gpt"
        ? process.env.PSYLATTICE_OPENAI_PREMIUM_MODEL || args.routeDefaultModel
        : args.routeDefaultModel;

  const rawUnits = estimateResearchAiUnits({
    surface: args.surface,
    contextChars: args.contextChars,
    messages: args.messages,
  });
  const units = Math.max(
    1,
    Math.min(
      50,
      Math.ceil(
        rawUnits *
          modelChargeMultiplier({
            modelKey,
            provider,
          }),
      ),
    ),
  );

  const admin = aiAdmin();
  const { data, error } = await admin.rpc("psylattice_consume_ai_units", {
    p_user_id: args.userId,
    p_units: units,
    p_surface: args.surface,
    p_study_id: args.studyId || null,
    p_model_key: modelKey,
    p_metadata: {
      requestClass: args.surface,
      provider,
      providerModel,
      contextSizeBand:
        (args.contextChars || 0) < 25_000
          ? "small"
          : (args.contextChars || 0) < 120_000
            ? "medium"
            : "large",
      ...(args.metadata || {}),
    },
  });

  if (error) mapAiRpcError(error);

  const row = (data || {}) as Record<string, unknown>;
  const usageId = typeof row.usageId === "string" ? row.usageId : "";
  if (!usageId) {
    throw new Error("PsyLattice could not reserve the AI request budget.");
  }

  return {
    usageId,
    modelKey,
    provider,
    providerModel,
    remainingPercent: clampPercent(row.remainingPercent),
  };
}

export async function completeResearchAiRequest(
  userId: string,
  usageId: string,
  usage?: {
    inputTokens?: number | null;
    outputTokens?: number | null;
    metadata?: Record<string, unknown>;
  },
) {
  const admin = aiAdmin();
  const { error } = await admin.rpc("psylattice_complete_ai_usage", {
    p_user_id: userId,
    p_usage_id: usageId,
    p_input_tokens:
      usage?.inputTokens == null ? null : Math.max(0, Math.round(usage.inputTokens)),
    p_output_tokens:
      usage?.outputTokens == null ? null : Math.max(0, Math.round(usage.outputTokens)),
    p_metadata: usage?.metadata || {},
  });

  if (error) throw error;
}

export async function refundResearchAiRequest(
  userId: string,
  usageId: string,
  reason: string,
) {
  const admin = aiAdmin();
  const { error } = await admin.rpc("psylattice_refund_ai_usage", {
    p_user_id: userId,
    p_usage_id: usageId,
    p_reason: reason.slice(0, 180),
  });

  if (error) {
    // Do not replace the original provider error with a refund bookkeeping error.
    console.error("Could not refund PsyLattice AI budget reservation:", error);
  }
}

export function aiErrorStatus(error: unknown) {
  return error instanceof AiAccessError ? error.status : null;
}

export function aiErrorCode(error: unknown) {
  return error instanceof AiAccessError ? error.code : null;
}

export function providerTokenUsage(response: unknown) {
  if (!response || typeof response !== "object") {
    return { inputTokens: null, outputTokens: null };
  }

  const usage = (response as Record<string, unknown>).usage;
  if (!usage || typeof usage !== "object") {
    return { inputTokens: null, outputTokens: null };
  }

  const row = usage as Record<string, unknown>;
  const input = Number(row.input_tokens);
  const output = Number(row.output_tokens);

  return {
    inputTokens: Number.isFinite(input) ? input : null,
    outputTokens: Number.isFinite(output) ? output : null,
  };
}
