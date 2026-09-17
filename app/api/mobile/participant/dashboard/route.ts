import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
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
  const query = new URL(request.url).searchParams;
  if (
    [...query.keys()].some((key) => key !== "studyId") ||
    query.getAll("studyId").length !== 1
  ) return mobileError("VALIDATION_FAILED", 400);
  const studyId = query.get("studyId");
  if (!isUuid(studyId)) return mobileError("VALIDATION_FAILED", 400);
  const { data, error } = await auth.supabase.rpc(
    "psylattice_mobile_participant_dashboard",
    { p_study_id: studyId }
  );
  return mobileRpcResponse(data, error);
}
