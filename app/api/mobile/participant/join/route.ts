import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
  mobileError,
  mobileRpcResponse,
  readJsonObject,
} from "@/lib/mobile/participantApi";
import { consumeMobileRateLimit } from "@/lib/mobile/rateLimit";

export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  if (!consumeMobileRateLimit("join", auth.userId)) {
    return mobileError("RATE_LIMITED", 429, "Too many attempts. Try again shortly.");
  }

  const body = await readJsonObject(request);
  if (isResponse(body)) return body;
  if (
    Object.keys(body).some(
      (key) =>
        ![
          "kind",
          "value",
          "participantCode",
          "consentVersionId",
          "consentResponses",
          "idempotencyKey",
        ].includes(key)
    ) ||
    (body.kind !== "token" && body.kind !== "code") ||
    typeof body.value !== "string" ||
    !isUuid(body.idempotencyKey) ||
    (body.participantCode != null && typeof body.participantCode !== "string") ||
    (body.consentVersionId != null && !isUuid(body.consentVersionId)) ||
    (body.consentResponses != null &&
      (typeof body.consentResponses !== "object" ||
        Array.isArray(body.consentResponses)))
  ) {
    return mobileError("VALIDATION_FAILED", 400);
  }

  const { data, error } = await auth.supabase.rpc("psylattice_mobile_join", {
    p_kind: body.kind,
    p_value: body.value,
    p_participant_code:
      typeof body.participantCode === "string" ? body.participantCode : null,
    p_consent_version_id:
      typeof body.consentVersionId === "string" ? body.consentVersionId : null,
    p_consent_responses:
      body.consentResponses && typeof body.consentResponses === "object"
        ? body.consentResponses
        : {},
    p_idempotency_key: body.idempotencyKey,
  });
  return mobileRpcResponse(data, error);
}
