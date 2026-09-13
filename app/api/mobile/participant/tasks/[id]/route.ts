import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
  mobileError,
  mobileRpcResponse,
} from "@/lib/mobile/participantApi";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  const { id } = await params;
  if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
  const { data, error } = await auth.supabase.rpc(
    "psylattice_mobile_participant_task",
    { p_task_id: id }
  );
  return mobileRpcResponse(data, error);
}
