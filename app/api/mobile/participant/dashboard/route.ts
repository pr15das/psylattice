import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
  mobileError,
  mobileRpcResponse,
} from "@/lib/mobile/participantApi";

export async function GET(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  const studyId = new URL(request.url).searchParams.get("studyId");
  if (!isUuid(studyId)) return mobileError("VALIDATION_FAILED", 400);
  const { data, error } = await auth.supabase.rpc(
    "psylattice_mobile_participant_dashboard",
    { p_study_id: studyId }
  );
  return mobileRpcResponse(data, error);
}
