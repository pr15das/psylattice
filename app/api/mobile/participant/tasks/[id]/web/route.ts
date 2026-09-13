import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
  mobileData,
  mobileError,
} from "@/lib/mobile/participantApi";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  const { id } = await params;
  if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
  const { data, error } = await auth.supabase.rpc(
    "psylattice_mobile_create_web_handoff",
    { p_task_id: id }
  );
  const result = data as {
    ok?: boolean;
    code?: string;
    handoff_token?: string;
  } | null;
  if (error) {
    return mobileError(error.code === "42501" ? "FORBIDDEN" : "SERVER_ERROR");
  }
  if (!result?.ok || !result.handoff_token) {
    return mobileError(result?.code || "TASK_NOT_AVAILABLE");
  }

  const url = new URL("/mobile/participant/handoff", request.url);
  url.hash = `token=${encodeURIComponent(result.handoff_token)}`;
  return mobileData({ ok: true, url: url.toString() });
}
