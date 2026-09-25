import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type MobileRpcResult = {
  ok?: boolean;
  code?: string;
  error?: string;
  [key: string]: unknown;
};

const SAFE_MESSAGES: Record<string, string> = {
  INVALID_LINK: "This study link is not valid.",
  INVALID_CODE: "This participant code is not valid.",
  AMBIGUOUS_CODE: "This participant code cannot be resolved safely.",
  LINK_PAUSED: "This study link is not currently active.",
  LINK_NOT_OPEN: "This study has not opened yet.",
  LINK_EXPIRED: "This study link has closed.",
  STUDY_UNAVAILABLE: "This study is not currently available.",
  CAPACITY_REACHED: "This study has reached its participant limit.",
  CONSENT_REQUIRED: "Review and complete the current study consent.",
  CONSENT_VERSION_CHANGED: "The consent information changed. Review it again before joining.",
  CONSENT_EXTERNAL_REQUIRED: "This study uses an external consent process.",
  VALIDATION_FAILED: "Check the information provided and try again.",
  ENROLLMENT_UNAVAILABLE: "The study could not be joined right now.",
  TASK_NOT_FOUND: "This task is not available.",
  TASK_NOT_AVAILABLE: "This task is not currently available.",
  TASK_ALREADY_COMPLETED: "This task has already been completed.",
  TASK_REQUIRES_WEB: "This task must be completed in PsyLattice's secure web runner.",
  RULE_UNAUTHORIZED: "This study activity is no longer available.",
  RATE_LIMITED: "Too many requests. Try again shortly.",
  UNAUTHORIZED: "You do not have access to this participant resource.",
  FORBIDDEN: "You do not have access to this participant resource.",
};

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };

export type MobileAuthContext = {
  supabase: SupabaseClient;
  userId: string;
};

export async function authenticateMobileRequest(
  request: Request
): Promise<MobileAuthContext | Response> {
  const authorization = request.headers.get("authorization") || "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!match || !url || !key) {
    return mobileError("UNAUTHORIZED", 401);
  }

  const accessToken = match[1];
  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return mobileError("UNAUTHORIZED", 401);
  }

  return { supabase, userId: data.user.id };
}

export function mobileError(
  code: string,
  status = statusForCode(code),
  message = SAFE_MESSAGES[code] || "PsyLattice could not complete this request."
) {
  return Response.json(
    { error: { code, message } },
    { status, headers: NO_STORE_HEADERS }
  );
}

export function mobileData(data: unknown, status = 200) {
  return Response.json({ data }, { status, headers: NO_STORE_HEADERS });
}

export function mobileRpcResponse(
  data: unknown,
  error: { code?: string } | null
) {
  if (error) {
    return mobileError(error.code === "42501" ? "UNAUTHORIZED" : "SERVER_ERROR");
  }

  const result = data as MobileRpcResult | null;
  if (!result?.ok) {
    return mobileError(
      typeof result?.code === "string" ? result.code : "SERVER_ERROR"
    );
  }

  return mobileData(result);
}

export async function readJsonObject(
  request: Request
): Promise<Record<string, unknown> | Response> {
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return mobileError("VALIDATION_FAILED", 400);
    }
    return value as Record<string, unknown>;
  } catch {
    return mobileError("VALIDATION_FAILED", 400);
  }
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function statusForCode(code: string) {
  if (code === "UNAUTHORIZED") return 401;
  if (code === "RATE_LIMITED") return 429;
  if (code === "FORBIDDEN" || code === "RULE_UNAUTHORIZED") return 403;
  if (["TASK_NOT_FOUND", "INVALID_LINK", "INVALID_CODE"].includes(code)) return 404;
  if (
    [
      "LINK_PAUSED",
      "LINK_NOT_OPEN",
      "LINK_EXPIRED",
      "STUDY_UNAVAILABLE",
      "CAPACITY_REACHED",
      "CONSENT_REQUIRED",
      "CONSENT_VERSION_CHANGED",
      "CONSENT_EXTERNAL_REQUIRED",
      "TASK_NOT_AVAILABLE",
      "TASK_ALREADY_COMPLETED",
      "TASK_REQUIRES_WEB",
    ].includes(code)
  ) {
    return 409;
  }
  if (code === "VALIDATION_FAILED" || code === "AMBIGUOUS_CODE") return 400;
  if (code === "CONFLICT") return 409;
  return 503;
}
