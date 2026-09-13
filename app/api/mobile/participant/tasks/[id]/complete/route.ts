import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
  mobileError,
  mobileRpcResponse,
  readJsonObject,
} from "@/lib/mobile/participantApi";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  const body = await readJsonObject(request);
  if (isResponse(body)) return body;
  if (
    !isUuid(body.idempotencyKey) ||
    !body.answers ||
    typeof body.answers !== "object" ||
    Array.isArray(body.answers)
  ) {
    return mobileError("VALIDATION_FAILED", 400);
  }

  const { id } = await params;
  if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
  const { data, error } = await auth.supabase.rpc(
    "psylattice_mobile_complete_task",
    {
      p_task_id: id,
      p_answers: body.answers,
      p_idempotency_key: body.idempotencyKey,
    }
  );
  return mobileRpcResponse(data, error);
}
