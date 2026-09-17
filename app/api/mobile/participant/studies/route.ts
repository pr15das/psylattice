import {
  authenticateMobileRequest,
  isResponse,
  mobileError,
  mobileRpcResponse,
} from "@/lib/mobile/participantApi";
import { consumeMobileRateLimit } from "@/lib/mobile/rateLimit";

export async function GET(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  if (!consumeMobileRateLimit("participantReads", auth.userId)) {
    return mobileError("RATE_LIMITED", 429);
  }
  if ([...new URL(request.url).searchParams.keys()].length > 0) {
    return mobileError("VALIDATION_FAILED", 400);
  }
  const { data, error } = await auth.supabase.rpc(
    "psylattice_mobile_participant_studies"
  );
  return mobileRpcResponse(data, error);
}
