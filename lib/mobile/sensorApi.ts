import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
  mobileError,
  mobileRpcResponse,
  readJsonObject,
  type MobileAuthContext,
} from "./participantApi";
import { consumeMobileRateLimit } from "./rateLimit";

type Authenticate = (request: Request) => Promise<MobileAuthContext | Response>;

export function sensorHandlers(authenticate: Authenticate = authenticateMobileRequest) {
  return {
    async rules(request: Request) {
      const auth = await authenticate(request);
      if (isResponse(auth)) return auth;
      if (!consumeMobileRateLimit("participantReads", auth.userId)) {
        return mobileError("RATE_LIMITED", 429);
      }

      const query = new URL(request.url).searchParams;
      if (
        [...query.keys()].some((key) => key !== "study_id") ||
        query.getAll("study_id").length > 1
      ) return mobileError("VALIDATION_FAILED", 400);
      const studyId = query.get("study_id");
      if (studyId !== null && !isUuid(studyId)) {
        return mobileError("VALIDATION_FAILED", 400);
      }

      try {
        const { data, error } = await auth.supabase.rpc(
          "psylattice_mobile_participant_sensor_rules",
          { p_study_id: studyId || null },
        );
        return mobileRpcResponse(data, error);
      } catch {
        return mobileError("SERVER_ERROR");
      }
    },

    async submit(request: Request) {
      const auth = await authenticate(request);
      if (isResponse(auth)) return auth;
      if (!consumeMobileRateLimit("sensorEvents", auth.userId)) {
        return mobileError("RATE_LIMITED", 429);
      }

      const body = await readJsonObject(request);
      if (isResponse(body)) return body;
      if (
        Object.keys(body).some(
          (key) =>
            ![
              "event_id",
              "rule_id",
              "rule_version",
              "installation_id",
              "triggered_at",
            ].includes(key)
        ) ||
        typeof body.event_id !== "string" ||
        body.event_id.length < 8 ||
        body.event_id.length > 256 ||
        !isUuid(body.rule_id) ||
        !Number.isInteger(body.rule_version) ||
        Number(body.rule_version) <= 0 ||
        !isUuid(body.installation_id) ||
        typeof body.triggered_at !== "string" ||
        !/(Z|[+-]\d{2}:\d{2})$/.test(body.triggered_at) ||
        Number.isNaN(Date.parse(body.triggered_at))
      ) return mobileError("VALIDATION_FAILED", 400);

      try {
        const { data, error } = await auth.supabase.rpc(
          "psylattice_mobile_submit_sensor_trigger_event",
          {
            p_event_id: body.event_id,
            p_rule_id: body.rule_id,
            p_rule_version: body.rule_version,
            p_installation_id: body.installation_id,
            p_triggered_at: body.triggered_at,
          },
        );
        return mobileRpcResponse(data, error);
      } catch {
        return mobileError("SERVER_ERROR");
      }
    },
  };
}

export const mobileSensorHandlers = sensorHandlers();
