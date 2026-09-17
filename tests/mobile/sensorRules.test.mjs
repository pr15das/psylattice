import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error.code === "ERR_MODULE_NOT_FOUND" &&
        specifier.startsWith(".") &&
        !/\.[a-z]+$/.test(specifier)
      ) return nextResolve(`${specifier}.ts`, context);
      throw error;
    }
  },
});

const { sensorHandlers } = await import("../../lib/mobile/sensorApi.ts");
const { GET: rulesRoute } = await import(
  "../../app/api/mobile/participant/sensor-rules/route.ts"
);
const { POST: eventsRoute } = await import(
  "../../app/api/mobile/participant/sensor-trigger-events/route.ts"
);

const userId = "10000000-0000-4000-8000-000000000001";
const studyId = "20000000-0000-4000-8000-000000000001";
const ruleId = "30000000-0000-4000-8000-000000000001";
const installationId = "40000000-0000-4000-8000-000000000001";

function harness(result = { data: { ok: true }, error: null }) {
  const calls = [];
  const handlers = sensorHandlers(async () => ({
    userId: `${userId}-${Date.now()}-${Math.random()}`,
    supabase: {
      rpc: async (name, args) => {
        calls.push({ name, args });
        return result;
      },
    },
  }));
  return { calls, handlers };
}

function eventRequest(body) {
  return new Request(
    "https://psylattice.com/api/mobile/participant/sensor-trigger-events",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

test("actual sensor routes reject unauthenticated requests before RPC work", async () => {
  const rules = await rulesRoute(
    new Request("https://psylattice.com/api/mobile/participant/sensor-rules"),
  );
  const event = await eventsRoute(eventRequest({}));
  assert.equal(rules.status, 401);
  assert.equal(event.status, 401);
});

test("sensor rule reads accept only an optional study UUID and forward no owner", async () => {
  const { calls, handlers } = harness({
    data: { ok: true, rules: [], server_time: "2026-09-17T00:00:00Z" },
    error: null,
  });
  const response = await handlers.rules(
    new Request(
      `https://psylattice.com/api/mobile/participant/sensor-rules?study_id=${studyId}`,
    ),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [{
    name: "psylattice_mobile_participant_sensor_rules",
    args: { p_study_id: studyId },
  }]);
  assert.equal(JSON.stringify(calls).includes("owner"), false);

  for (const search of [
    "?owner_user_id=attacker",
    `?study_id=${studyId}&study_id=${studyId}`,
    "?study_id=not-a-uuid",
  ]) {
    const rejected = await handlers.rules(
      new Request(`https://psylattice.com/api/mobile/participant/sensor-rules${search}`),
    );
    assert.equal(rejected.status, 400);
  }
  assert.equal(calls.length, 1);
});

test("sensor event writes forward only idempotent metadata and reject raw health fields", async () => {
  const { calls, handlers } = harness({
    data: { ok: true, idempotent: false },
    error: null,
  });
  const body = {
    event_id: "sensor-12345678",
    rule_id: ruleId,
    rule_version: 3,
    installation_id: installationId,
    triggered_at: "2026-09-17T10:00:00.000Z",
  };
  const response = await handlers.submit(eventRequest(body));
  assert.equal(response.status, 200);
  assert.deepEqual(calls, [{
    name: "psylattice_mobile_submit_sensor_trigger_event",
    args: {
      p_event_id: body.event_id,
      p_rule_id: ruleId,
      p_rule_version: 3,
      p_installation_id: installationId,
      p_triggered_at: body.triggered_at,
    },
  }]);

  for (const invalid of [
    { ...body, heart_rate: 120 },
    { ...body, steps: 5000 },
    { ...body, owner_user_id: userId },
    { ...body, rule_version: 0 },
    { ...body, triggered_at: "2026-09-17T10:00:00" },
  ]) {
    const rejected = await handlers.submit(eventRequest(invalid));
    assert.equal(rejected.status, 400);
  }
  assert.equal(calls.length, 1);
});

test("sensor ownership failures retain the stable safe authorization contract", async () => {
  const { handlers } = harness({
    data: { ok: false, code: "RULE_UNAUTHORIZED" },
    error: null,
  });
  const response = await handlers.submit(eventRequest({
    event_id: "sensor-12345678",
    rule_id: ruleId,
    rule_version: 1,
    installation_id: installationId,
    triggered_at: "2026-09-17T10:00:00Z",
  }));
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: {
      code: "RULE_UNAUTHORIZED",
      message: "This study activity is no longer available.",
    },
  });
});

test("sensor migration enforces enrollment, installation, rule, and idempotency boundaries", async () => {
  const sql = await readFile(
    new URL(
      "../../supabase/migrations/20260914090000_mobile_sensor_rules.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(sql, /mobile_sensor_rules ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /mobile_sensor_trigger_events ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /REVOKE ALL ON public\.mobile_sensor_rules FROM anon, authenticated/i);
  assert.match(sql, /REVOKE ALL ON public\.mobile_sensor_trigger_events FROM anon, authenticated/i);
  assert.match(sql, /installation_id = p_installation_id AND auth_user_id = v_user AND active/i);
  assert.match(sql, /auth_user_id = v_user AND status <> 'withdrawn'/i);
  assert.match(sql, /v_rule\.enabled[\s\S]*v_rule\.version <> p_rule_version/i);
  assert.match(sql, /m\.id = v_rule\.target_measure_id AND m\.study_id = v_rule\.study_id/i);
  assert.match(sql, /ON CONFLICT \(event_id\) DO NOTHING/i);
  assert.match(sql, /e\.auth_user_id = v_user[\s\S]*e\.installation_id = p_installation_id/i);
  assert.match(sql, /GRANT SELECT, INSERT, UPDATE, DELETE ON public\.mobile_sensor_rules TO service_role/i);
  assert.match(sql, /SET search_path = ''/i);

  const eventTable = sql.match(
    /CREATE TABLE public\.mobile_sensor_trigger_events \([\s\S]*?\n\);/i,
  )?.[0] ?? "";
  assert.doesNotMatch(
    eventTable,
    /raw_value|observed_value|health_value|heart_rate_value|step_count|\bbpm\b/i,
  );
});

test("participant migration is executable SQL rather than a pasted code span", async () => {
  const sql = await readFile(
    new URL(
      "../../supabase/migrations/20260912090000_mobile_participant_core.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.equal(sql.startsWith("-- Authenticated mobile participation"), true);
  assert.equal(sql.trimEnd().endsWith("`"), false);
});
