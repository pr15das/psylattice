import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
  mobileError,
  mobileRpcResponse,
  readJsonObject,
} from "@/lib/mobile/participantApi";
import { consumeMobileRateLimit } from "@/lib/mobile/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(request);
  if (isResponse(auth)) return auth;
  if (!consumeMobileRateLimit("participantMutations", auth.userId)) {
    return mobileError("RATE_LIMITED", 429);
  }
  const body = await readJsonObject(request);
  if (isResponse(body)) return body;
  if (
    Object.keys(body).some(
      (key) => !["idempotencyKey", "answers", "notificationId"].includes(key)
    ) ||
    !isUuid(body.idempotencyKey) ||
    (body.notificationId !== undefined && !isUuid(body.notificationId)) ||
    !body.answers ||
    typeof body.answers !== "object" ||
    Array.isArray(body.answers)
  ) {
    return mobileError("VALIDATION_FAILED", 400);
  }

  const { id } = await params;
  if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
  const { data, error } = await auth.supabase.rpc(
    body.notificationId === undefined ? "psylattice_mobile_complete_task" : "psylattice_mobile_complete_notified_task",
    {
      p_task_id: id,
      p_answers: body.answers,
      p_idempotency_key: body.idempotencyKey,
      ...(body.notificationId === undefined ? {} : { p_notification_id: body.notificationId }),
    }
  );
  return mobileRpcResponse(data, error);
}
