import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const { researcherHandlers, mobileResearcherHandlers } = await import("../../lib/mobile/researcherApi.ts");
const { MOBILE_RATE_LIMITS, consumeMobileRateLimit } = await import("../../lib/mobile/rateLimit.ts");
const routes = await import("../../app/api/mobile/researcher/studies/route.ts");
const owner = "61000000-0000-4000-8000-000000000001";
const otherOwner = "61000000-0000-4000-8000-000000000002";
const serverFailure = { error: { code: "SERVER_ERROR", message: "PsyLattice could not complete this request." } };
const validationFailure = { error: { code: "VALIDATION_FAILED", message: "Check the information provided and try again." } };
const secret = "synthetic-private-content-marker";
const columns = "id,title,participant_description,status,target_sample_size,created_at,updated_at";
const responseKeys = ["id", "title", "description", "status", "participantCount", "targetSampleSize", "measureCount", "hasTestLink", "hasLiveLink", "createdAt", "updatedAt"].sort();
const privateFields = {
  owner_user_id: owner, design: secret, components: { private: secret }, study_config: { private: secret },
  recruitment_config: { private: secret }, auth_user_id: secret, jwt: secret, fcm_token: secret,
  participant_code: secret, session_token: secret, answers: secret, email: secret, billing_internal: secret,
};

function request(body = { title: "Synthetic study" }, search = "") {
  return new Request(`https://example.invalid/api/mobile/researcher/studies${search}`, {
    method: "POST", body: JSON.stringify(body),
    headers: { authorization: "Bearer unit-test-token", "content-type": "application/json" },
  });
}
function rawRequest(body) {
  return new Request("https://example.invalid/api/mobile/researcher/studies", {
    method: "POST", body, headers: { authorization: "Bearer unit-test-token", "content-type": "application/json" },
  });
}
let accountSequence = 0;
function harness({ userId = `63000000-0000-4000-8000-${String(++accountSequence).padStart(12, "0")}`, errorCode, nullData = false, throwTransport = false, invalidResponse = false, rowOverrides = {} } = {}) {
  const calls = [];
  const rows = [];
  let nextId = 1;
  const supabase = createClient("https://unit-test.invalid", "unit-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const table = url.pathname.split("/").at(-1);
        const body = JSON.parse(init.body);
        calls.push({ url, table, method: init.method, body });
        assert.equal(init.method, "POST", "creation has no follow-up read or dependent write");
        assert.equal(table, "research_studies", "no participant, link, scheduler, or billing writes");
        assert.equal(init.headers.get("prefer"), "return=representation");
        if (throwTransport) throw new Error("synthetic private transport diagnostic");
        if (errorCode) return Response.json({ code: errorCode, message: secret, details: secret, hint: secret }, { status: 400 });
        if (nullData) return Response.json(null, { status: 201 });
        const row = {
          id: `62000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
          title: body.title, participant_description: body.participant_description, status: body.status,
          target_sample_size: null, created_at: "2026-09-14T00:00:00Z", updated_at: "2026-09-14T00:00:00Z",
          ...privateFields, owner_user_id: body.owner_user_id, ...rowOverrides,
        };
        rows.push(row);
        if (invalidResponse) return new Response("synthetic non-JSON response", { status: 201 });
        return Response.json(row, { status: 201 });
      },
    },
  });
  return { calls, rows, handlers: researcherHandlers(async () => ({ userId, supabase })) };
}
function assertNoStore(response) {
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
}
async function assertInvalid(body) {
  const { handlers, calls, rows } = harness();
  const response = await handlers.createStudy(request(body));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), validationFailure);
  assertNoStore(response);
  assert.equal(calls.length, 0);
  assert.equal(rows.length, 0);
}

// Actual route wiring preserves the earlier collection GET.
test("studies collection exports existing GET and the new POST", () => {
  assert.deepEqual(Object.keys(routes).sort(), ["GET", "POST"]);
  assert.equal(routes.GET, mobileResearcherHandlers.studies);
  assert.equal(routes.POST, mobileResearcherHandlers.createStudy);
});

test("actual POST authenticates before body parsing, query validation, or DB", async (t) => {
  let fetches = 0;
  let parses = 0;
  t.mock.method(globalThis, "fetch", async () => { fetches++; throw new Error("must authenticate first"); });
  for (const authorization of [undefined, "Basic synthetic", "Bearer"]) {
    const headers = authorization ? { authorization } : {};
    const req = new Request("https://example.invalid?owner_user_id=bad", { method: "POST", body: "{" , headers });
    t.mock.method(req, "json", async () => { parses++; throw new Error("must authenticate first"); });
    const response = await routes.POST(req);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
    assertNoStore(response);
  }
  assert.equal(fetches, 0);
  assert.equal(parses, 0);
});

test("authentication denial or exception never parses input or creates a study", async (t) => {
  let parses = 0;
  for (const authenticate of [
    async () => Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }),
    async () => { throw new Error(secret); },
  ]) {
    const req = request();
    t.mock.method(req, "json", async () => { parses++; throw new Error("must authenticate first"); });
    const response = await researcherHandlers(authenticate).createStudy(req);
    assert.ok([401, 503].includes(response.status));
    assert.equal(JSON.stringify(await response.json()).includes(secret), false);
  }
  assert.equal(parses, 0);
});

test("malformed JSON, primitives, arrays, null, and empty bodies are rejected", async () => {
  for (const body of ["{", "", "null", "[]", '"Synthetic study"', "42", "true"]) {
    const { handlers, calls } = harness();
    const response = await handlers.createStudy(rawRequest(body));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), validationFailure);
    assert.equal(calls.length, 0);
  }
});

test("missing and whitespace-only titles are rejected", async () => {
  for (const body of [{}, { description: "Synthetic description" }, { title: "" }, { title: " \t\r\n " }]) {
    await assertInvalid(body);
  }
});

test("title must be a string without implicit coercion", async () => {
  for (const title of [null, 123, false, [], {}, ["Synthetic title"]]) await assertInvalid({ title });
});

test("owner_user_id and researcher_id are rejected even if they match the session", async () => {
  for (const key of ["owner_user_id", "researcher_id", "user_id", "userId", "ownerId"]) {
    for (const value of [owner, otherOwner]) await assertInvalid({ title: "Synthetic study", [key]: value });
  }
});

test("status, activation, links, schedules, definitions, and arbitrary metadata are rejected", async () => {
  for (const [key, value] of [
    ["status", "draft"], ["active", true], ["activationConfirmed", true], ["is_test_link", true],
    ["token", secret], ["link", {}], ["schedule", {}], ["scheduler", {}], ["reminders", []],
    ["participants", []], ["measures", []], ["components", {}], ["study_config", {}],
    ["metadata", {}], ["design", "Other"], ["target_sample_size", 100], ["id", owner],
    ["created_at", "2026-09-01"], ["participant_description", "Synthetic description"],
  ]) await assertInvalid({ title: "Synthetic study", [key]: value });
  await assertInvalid(JSON.parse('{"title":"Synthetic study","__proto__":{"owner_user_id":"synthetic"}}'));
});

test("all query selectors are rejected before body parsing or DB", async (t) => {
  for (const search of ["?owner_user_id=bad", "?researcher_id=bad", "?page=1", "?limit=20", "?unknown=1"]) {
    const { handlers, calls } = harness();
    const req = request({ title: "Synthetic study" }, search);
    let parses = 0;
    t.mock.method(req, "json", async () => { parses++; throw new Error("invalid query precedes body parsing"); });
    const response = await handlers.createStudy(req);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), validationFailure);
    assert.equal(parses, 0);
    assert.equal(calls.length, 0);
  }
});

test("provided descriptions must be strings", async () => {
  for (const description of [null, 123, true, [], {}, ["Synthetic description"]]) {
    await assertInvalid({ title: "Synthetic study", description });
  }
});

test("description may be omitted, empty, or whitespace-only and persists as null", async () => {
  for (const body of [{ title: "Synthetic study" }, { title: "Synthetic study", description: "" }, { title: "Synthetic study", description: " \r\n\t " }]) {
    const { handlers, calls } = harness();
    const response = await handlers.createStudy(request(body));
    assert.equal(response.status, 201);
    assert.equal(calls[0].body.participant_description, null);
    assert.equal((await response.json()).data.description, null);
  }
});

test("title and description trim only edges and preserve meaningful internal whitespace", async () => {
  const { handlers, calls } = harness();
  const response = await handlers.createStudy(request({ title: " \tSynthetic  study\nvariant \r\n", description: " \nSynthetic  description\n\tsecond line \t" }));
  assert.equal(response.status, 201);
  assert.equal(calls[0].body.title, "Synthetic  study\nvariant");
  assert.equal(calls[0].body.participant_description, "Synthetic  description\n\tsecond line");
  const { data } = await response.json();
  assert.equal(data.title, calls[0].body.title);
  assert.equal(data.description, calls[0].body.participant_description);
});

test("one-character and Unicode titles meet the authoritative nonblank minimum", async () => {
  for (const title of ["S", "Synthetic \u03c8 study", "Synthetic \ud83e\udde0 study"]) {
    const { handlers, calls } = harness();
    const response = await handlers.createStudy(request({ title }));
    assert.equal(response.status, 201);
    assert.equal(calls[0].body.title, title);
  }
});

test("unbounded schema/web text fields are not given invented 200/500-character maxima", async () => {
  const title = "Synthetic title ".repeat(100);
  const description = "Synthetic description\n".repeat(1000);
  const { handlers, calls } = harness();
  const response = await handlers.createStudy(request({ title, description }));
  assert.equal(response.status, 201);
  assert.equal(calls[0].body.title, title.trim());
  assert.equal(calls[0].body.participant_description, description.trim());
});

test("valid creation is exactly one owner-bound draft-shell insert using DB defaults", async () => {
  const { handlers, calls, rows } = harness({ userId: owner });
  const response = await handlers.createStudy(request({ title: "Synthetic study", description: "Synthetic description" }));
  assert.equal(response.status, 201);
  assertNoStore(response);
  assert.equal(calls.length, 1);
  assert.equal(rows.length, 1);
  assert.deepEqual(calls[0].body, {
    owner_user_id: owner, title: "Synthetic study", participant_description: "Synthetic description", status: "draft",
  });
  assert.equal(calls[0].url.searchParams.get("select"), columns);
  assert.equal(rows[0].status, "draft");
  assert.equal(rows[0].target_sample_size, null);
});

test("study ownership changes with the verified session and is absent from the DTO", async () => {
  for (const userId of [owner, otherOwner]) {
    const { handlers, calls } = harness({ userId });
    const response = await handlers.createStudy(request());
    assert.equal(response.status, 201);
    assert.equal(calls[0].body.owner_user_id, userId);
    assert.equal(Object.hasOwn((await response.json()).data, "owner_user_id"), false);
  }
});

test("creation reuses the compact study projection without raw config, tokens, or billing data", async () => {
  const { handlers, calls, rows } = harness({ userId: owner });
  const response = await handlers.createStudy(request());
  const body = await response.json();
  assert.deepEqual(body, { data: {
    id: rows[0].id, title: "Synthetic study", description: null, status: "draft",
    participantCount: 0, targetSampleSize: null, measureCount: 0, hasTestLink: false, hasLiveLink: false,
    createdAt: "2026-09-14T00:00:00Z", updatedAt: "2026-09-14T00:00:00Z",
  } });
  assert.deepEqual(Object.keys(body.data).sort(), responseKeys);
  assert.equal(JSON.stringify(body).includes(secret), false);
  assert.equal(JSON.stringify(body).includes(owner), false);
  assert.doesNotMatch(calls[0].url.searchParams.get("select"), /\*|owner_user_id|design|components|config|token|answers|email|fcm|billing/);
});

test("timestamps and optional sample target come from the returned persisted row", async () => {
  const overrides = { created_at: "2026-09-02T10:20:30Z", updated_at: "2026-09-03T11:22:33Z", target_sample_size: 17 };
  const { handlers, calls } = harness({ rowOverrides: overrides });
  const response = await handlers.createStudy(request());
  const { data } = await response.json();
  assert.equal(data.createdAt, overrides.created_at);
  assert.equal(data.updatedAt, overrides.updated_at);
  assert.equal(data.targetSampleSize, overrides.target_sample_size);
  assert.equal(Object.hasOwn(calls[0].body, "created_at"), false);
  assert.equal(Object.hasOwn(calls[0].body, "updated_at"), false);
  assert.equal(Object.hasOwn(calls[0].body, "target_sample_size"), false);
});

test("repeated titles create distinct shells without title deduplication or activation", async () => {
  const { handlers, calls } = harness();
  const first = await handlers.createStudy(request());
  const second = await handlers.createStudy(request());
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  const a = (await first.json()).data;
  const b = (await second.json()).data;
  assert.notEqual(a.id, b.id);
  assert.equal(a.title, b.title);
  assert.equal(a.status, "draft");
  assert.equal(b.status, "draft");
  assert.equal(calls.length, 2);
});

test("DB errors remain generic and expose no SQL or billing details", async () => {
  for (const errorCode of ["XX000", "23505", "23514", "P0001"]) {
    const { handlers, calls, rows } = harness({ errorCode });
    const response = await handlers.createStudy(request());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), serverFailure);
    assertNoStore(response);
    assert.equal(calls.length, 1);
    assert.equal(rows.length, 0);
  }
});

test("database ownership/privilege denial is preserved as safe forbidden", async () => {
  const { handlers, calls, rows } = harness({ errorCode: "42501" });
  const response = await handlers.createStudy(request());
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "FORBIDDEN");
  assert.equal(rows.length, 0);
  assert.equal(calls.length, 1);
});

test("null or malformed creation responses return safe errors without compensating writes", async () => {
  for (const options of [{ nullData: true }, { invalidResponse: true }]) {
    const { handlers, calls } = harness(options);
    const response = await handlers.createStudy(request());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), serverFailure);
    assert.equal(calls.length, 1);
  }
});

test("uncertain POST transport failures are safe and never automatically retried", async () => {
  const { handlers, calls } = harness({ throwTransport: true });
  const response = await handlers.createStudy(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), serverFailure);
  assert.equal(calls.length, 1);
});

test("creation shares the existing per-user mutation quota before input parsing or DB", async (t) => {
  const blockedOwner = "61000000-0000-4000-8000-000000000099";
  assert.equal(MOBILE_RATE_LIMITS.researcherMutations.limit, 60);
  assert.equal(MOBILE_RATE_LIMITS.researcherMutations.windowMs, 10 * 60 * 1000);
  for (let index = 0; index < MOBILE_RATE_LIMITS.researcherMutations.limit; index++) {
    assert.equal(consumeMobileRateLimit("researcherMutations", blockedOwner), true);
  }
  const { handlers, calls } = harness({ userId: blockedOwner });
  const req = request();
  let parses = 0;
  t.mock.method(req, "json", async () => { parses++; throw new Error("rate limit precedes parsing"); });
  const response = await handlers.createStudy(req);
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, "RATE_LIMITED");
  assertNoStore(response);
  assert.equal(parses, 0);
  assert.equal(calls.length, 0);
  assert.equal(consumeMobileRateLimit("researcherReads", blockedOwner), true);
  assert.equal((await harness({ userId: otherOwner }).handlers.createStudy(request())).status, 201);
});
