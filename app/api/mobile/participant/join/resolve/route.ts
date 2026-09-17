import {
  authenticateMobileRequest,
  isResponse,
  mobileError,
  mobileRpcResponse,
  readJsonObject,
} from "@/lib/mobile/participantApi";
import { consumeMobileRateLimit } from "@/lib/mobile/rateLimit";

export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  if (!consumeMobileRateLimit("resolveJoin", auth.userId)) {
    return mobileError("RATE_LIMITED", 429, "Too many attempts. Try again shortly.");
  }

  const body = await readJsonObject(request);
  if (isResponse(body)) return body;
  const kind = body.kind;
  const value = body.value;
  if (
    Object.keys(body).some((key) => !["kind", "value"].includes(key)) ||
    (kind !== "token" && kind !== "code") ||
    typeof value !== "string"
  ) {
    return mobileError("VALIDATION_FAILED", 400);
  }

  const { data, error } = await auth.supabase.rpc(
    "psylattice_mobile_resolve_join",
    { p_kind: kind, p_value: value }
  );
  return mobileRpcResponse(data, error);
}
