import {
  authenticateMobileRequest,
  isResponse,
  mobileRpcResponse,
} from "@/lib/mobile/participantApi";

export async function GET(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  const { data, error } = await auth.supabase.rpc(
    "psylattice_mobile_participant_studies"
  );
  return mobileRpcResponse(data, error);
}
