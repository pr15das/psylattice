import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateMobileRequest,
  isUuid,
  mobileError,
  readJsonObject,
} from "../../lib/mobile/participantApi.ts";
import {
  MOBILE_RATE_LIMITS,
  consumeMobileRateLimit,
} from "../../lib/mobile/rateLimit.ts";

test("unauthenticated mobile requests fail without contacting Supabase", async () => {
  const result = await authenticateMobileRequest(
    new Request("https://psylattice.com/api/mobile/participant/studies")
  );

  assert.ok(result instanceof Response);
  assert.equal(result.status, 401);
  assert.deepEqual(await result.json(), {
    error: {
      code: "UNAUTHORIZED",
      message: "You do not have access to this participant resource.",
    },
  });
});

test("participant ownership failures use forbidden without raw details", async () => {
  const response = mobileError("FORBIDDEN");

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.deepEqual(await response.json(), {
    error: {
      code: "FORBIDDEN",
      message: "You do not have access to this participant resource.",
    },
  });
});

test("malformed JSON bodies are rejected with a stable validation contract", async () => {
  const response = await readJsonObject(
    new Request("https://psylattice.com/api/mobile/participant/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "[1,2,3]",
    })
  );

  assert.ok(response instanceof Response);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
});

test("database identifiers must use a valid UUID shape before RPC calls", () => {
  assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isUuid("participant-controlled-value"), false);
  assert.equal(isUuid(null), false);
});

test("join attempts are rate limited by authenticated account, not raw token", () => {
  const userId = `test-user-${Date.now()}`;
  for (let index = 0; index < MOBILE_RATE_LIMITS.join.limit; index += 1) {
    assert.equal(consumeMobileRateLimit("join", userId), true);
  }
  assert.equal(consumeMobileRateLimit("join", userId), false);
});
