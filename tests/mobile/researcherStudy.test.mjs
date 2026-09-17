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
const { GET: detailRoute } = await import("../../app/api/mobile/researcher/studies/[id]/route.ts");
const { GET: participantsRoute } = await import("../../app/api/mobile/researcher/studies/[id]/participants/route.ts");
const owner = "41000000-0000-4000-8000-000000000001";
const otherOwner = "41000000-0000-4000-8000-000000000002";
const studyId = "42000000-0000-4000-8000-000000000001";
const foreignStudyId = "42000000-0000-4000-8000-000000000002";
const missingStudyId = "42000000-0000-4000-8000-000000000003";
const publicFailure = { error: { code: "SERVER_ERROR", message: "PsyLattice could not complete this request." } };
const publicDenied = { error: { code: "FORBIDDEN", message: "You do not have access to this participant resource." } };
const sensitiveFields = {
  participant_code: "synthetic-secret-marker",
  email: "synthetic-secret-marker",
  answers: "synthetic-secret-marker",
  questionnaire_responses: "synthetic-secret-marker",
  scores: "synthetic-secret-marker",
  health_data: "synthetic-secret-marker",
  consent_body: "synthetic-secret-marker",
  fcm_token: "synthetic-secret-marker",
  installation_id: "synthetic-secret-marker",
  auth_user_id: "synthetic-secret-marker",
  jwt: "synthetic-secret-marker",
  token: "synthetic-secret-marker",
};

function study(id = studyId, ownerId = owner, overrides = {}) {
  return {
    id, owner_user_id: ownerId, title: "Synthetic study", status: "active",
    participant_description: "Synthetic participant description", target_sample_size: 120,
    created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-13T00:00:00Z",
    ...sensitiveFields, ...overrides,
  };
}

function participant(index, overrides = {}) {
  return {
    id: `43000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    public_id: `SYNTHETIC-P-${index}`, owner_user_id: owner, study_id: studyId,
    is_test: false, status: "active", enrolled_at: "2026-09-01T00:00:00Z", completed_at: null,
    ...sensitiveFields, ...overrides,
  };
}

function context(id = studyId) { return { params: Promise.resolve({ id }) }; }
function request(method, search = "", id = studyId) {
  return new Request(`https://example.invalid/api/mobile/researcher/studies/${id}${method === "participants" ? "/participants" : ""}${search}`, {
    headers: { authorization: "Bearer unit-test-token" },
  });
}

function filtered(rows, params, prefix = "") {
  return rows.filter((row) => [...params.entries()].every(([key, filter]) => {
    if (!key.startsWith(prefix)) return true;
    const column = key.slice(prefix.length);
    if (!Object.hasOwn(row, column)) return true;
    if (filter.startsWith("eq.")) return String(row[column]) === filter.slice(3);
    if (filter.startsWith("neq.")) return String(row[column]) !== filter.slice(4);
    return true;
  }));
}

function harness({ studies = [study(), study(foreignStudyId, otherOwner)], participants = [], measures = [], links = [], failTable, throwTable, userId = owner } = {}) {
  const calls = [];
  const supabase = createClient("https://unit-test.invalid", "unit-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const table = url.pathname.split("/").at(-1);
        const params = url.searchParams;
        calls.push({ url, table, method: init.method });
        if (table === throwTable) throw new Error("synthetic private transport diagnostic");
        if (table === failTable) return Response.json({ code: "XX000", message: "synthetic private SQL diagnostic", details: "synthetic private detail" }, { status: 400 });
        let rows;
        if (table === "research_studies") {
          rows = filtered(studies, params).map((record) => {
            if (params.get("select") === "id") return { id: record.id };
            const count = (children, alias) => filtered(children.filter((child) => child.study_id === record.id), params, `${alias}.`).length;
            return {
              ...record,
              participants: [{ count: count(participants, "participants") }],
              measures: [{ count: count(measures, "measures") }],
              testLinks: [{ count: count(links, "testLinks") }],
              liveLinks: [{ count: count(links, "liveLinks") }],
            };
          });
        } else {
          assert.equal(table, "study_participants");
          rows = filtered(participants, params);
        }
        const order = params.get("order");
        if (order) rows.sort((a, b) => {
          for (const part of order.split(",")) {
            const [column, direction] = part.split(".");
            const difference = String(a[column]).localeCompare(String(b[column]));
            if (difference) return direction === "desc" ? -difference : difference;
          }
          return 0;
        });
        const offset = Number(params.get("offset") || 0);
        const limit = Number(params.get("limit"));
        assert.ok(Number.isInteger(limit) && limit >= 1 && limit <= 51, "every query must have a bounded limit");
        return Response.json(rows.slice(offset, offset + limit));
      },
    },
  });
  return { calls, handlers: researcherHandlers(async () => ({ userId, supabase })) };
}

function assertScope(call, field = "id", id = studyId, userId = owner) {
  assert.equal(call.url.searchParams.get("owner_user_id"), `eq.${userId}`);
  assert.equal(call.url.searchParams.get(field), `eq.${id}`);
}

function assertAggregates(call) {
  const params = call.url.searchParams;
  for (const alias of ["participants", "measures", "testLinks", "liveLinks"]) {
    assert.equal(params.get(`${alias}.owner_user_id`), `eq.${owner}`);
  }
  assert.equal(params.get("participants.is_test"), "eq.false");
  assert.equal(params.get("participants.status"), "neq.withdrawn");
  assert.equal(params.get("testLinks.is_test_link"), "eq.true");
  assert.equal(params.get("liveLinks.is_test_link"), "eq.false");
  assert.match(params.get("select"), /participants:study_participants\(count\)/);
  assert.match(params.get("select"), /measures:study_measures\(count\)/);
}

function assertPrivacy(body, select) {
  assert.equal(JSON.stringify(body).includes("synthetic-secret-marker"), false);
  assert.doesNotMatch(select, /\*|participant_code|email|answers|questionnaire_responses|scores|health_data|consent|fcm_token|installation_id|auth_user_id|jwt|token/);
}

test("actual detail and participant routes authenticate before DB or resolving study params", async (t) => {
  assert.equal(detailRoute, mobileResearcherHandlers.studyDetail);
  assert.equal(participantsRoute, mobileResearcherHandlers.participants);
  let fetches = 0;
  let resolvedParams = 0;
  t.mock.method(globalThis, "fetch", async () => { fetches++; throw new Error("must not contact DB"); });
  const deferredContext = { params: { then() { resolvedParams++; throw new Error("must authenticate first"); } } };
  for (const route of [detailRoute, participantsRoute]) {
    const response = await route(new Request("https://example.invalid?page=bad"), deferredContext);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
  }
  assert.equal(fetches, 0);
  assert.equal(resolvedParams, 0);
});

test("both routes reject invalid UUIDs before DB", async () => {
  for (const method of ["studyDetail", "participants"]) {
    for (const id of ["invalid", "", "42000000-0000-4000-8000-000000000001 OR 1=1", undefined]) {
      const { handlers, calls } = harness();
      const response = await handlers[method](request(method), { params: Promise.resolve({ id }) });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
      assert.equal(calls.length, 0);
    }
  }
});

test("detail returns an owner-scoped compact projection with authoritative recruitment counts", async () => {
  const participants = [
    participant(1), participant(2, { status: "completed", completed_at: "2026-09-12T00:00:00Z" }),
    participant(3, { is_test: true }), participant(4, { status: "withdrawn" }),
    participant(5, { owner_user_id: otherOwner }), participant(6, { study_id: foreignStudyId }),
  ];
  const { handlers, calls } = harness({ participants,
    measures: [{ study_id: studyId, owner_user_id: owner }, { study_id: studyId, owner_user_id: otherOwner }, { study_id: foreignStudyId, owner_user_id: owner }],
    links: [{ study_id: studyId, owner_user_id: owner, is_test_link: true }, { study_id: studyId, owner_user_id: owner, is_test_link: false }],
  });
  const response = await handlers.studyDetail(request("studyDetail"), context());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body, { data: {
    id: studyId, title: "Synthetic study", status: "active", participantCount: 2,
    targetSampleSize: 120, measureCount: 1, hasTestLink: true, hasLiveLink: true,
    createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-13T00:00:00Z",
    description: "Synthetic participant description",
  } });
  assert.equal(calls.length, 1);
  assertScope(calls[0]);
  assertAggregates(calls[0]);
  assert.equal(calls[0].url.searchParams.get("limit"), "1");
  assertPrivacy(body, calls[0].url.searchParams.get("select"));
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});

test("detail preserves nullable description/sample target and zero counts", async () => {
  const { handlers } = harness({ studies: [study(studyId, owner, { participant_description: null, target_sample_size: null, status: "draft" })] });
  const { data } = await (await handlers.studyDetail(request("studyDetail"), context())).json();
  assert.equal(data.description, null);
  assert.equal(data.targetSampleSize, null);
  assert.equal(data.status, "draft");
  assert.equal(data.participantCount, 0);
  assert.equal(data.measureCount, 0);
  assert.equal(data.hasTestLink, false);
  assert.equal(data.hasLiveLink, false);
  assert.equal("participantCap" in data, false);
});

test("detail derives TEST/LIVE presence independently, excludes foreign links, and preserves paused/closed link presence", async () => {
  for (const [isTest, expected] of [[true, [true, false]], [false, [false, true]]]) {
    const { handlers, calls } = harness({ links: [
      { study_id: studyId, owner_user_id: owner, is_test_link: isTest, status: "paused" },
      { study_id: studyId, owner_user_id: otherOwner, is_test_link: !isTest, status: "active" },
      { study_id: foreignStudyId, owner_user_id: owner, is_test_link: !isTest, status: "closed" },
    ] });
    const { data } = await (await handlers.studyDetail(request("studyDetail"), context())).json();
    assert.deepEqual([data.hasTestLink, data.hasLiveLink], expected);
    assertAggregates(calls[0]);
  }
});

test("detail counts all eligible children without fetching rows or issuing per-child queries", async () => {
  const { handlers, calls } = harness({ participants: Array.from({ length: 2001 }, (_, index) => participant(index)) });
  const { data } = await (await handlers.studyDetail(request("studyDetail"), context())).json();
  assert.equal(data.participantCount, 2001);
  assert.equal(calls.length, 1);
  assertPrivacy({ data }, calls[0].url.searchParams.get("select"));
});

test("missing and cross-owner studies are indistinguishable and blocked before participant access", async () => {
  for (const method of ["studyDetail", "participants"]) {
    for (const id of [foreignStudyId, missingStudyId]) {
      const { handlers, calls } = harness({ participants: [participant(1, { study_id: foreignStudyId })] });
      const response = await handlers[method](request(method, "", id), context(id));
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), publicDenied);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].table, "research_studies");
      assertScope(calls[0], "id", id);
    }
  }
});

test("both routes reject client owner selectors, TEST switches and unknown parameters before DB", async () => {
  for (const method of ["studyDetail", "participants"]) {
    for (const key of ["owner_user_id", "researcher_id", "user_id", "auth_user_id", "ownerId", "userId", "is_test", "includeTest", "unknown"]) {
      const { handlers, calls } = harness();
      const response = await handlers[method](request(method, `?${key}=${otherOwner}`), context());
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
      assert.equal(calls.length, 0);
    }
  }
});

test("participant ownership lookup finishes before the bounded participant query", async () => {
  const { handlers, calls } = harness({ participants: Array.from({ length: 21 }, (_, index) => participant(index)) });
  const response = await handlers.participants(request("participants"), context());
  const { data } = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.page, 1);
  assert.equal(data.limit, 20);
  assert.equal(data.items.length, 20);
  assert.equal(data.hasMore, true);
  assert.deepEqual(calls.map((call) => call.table), ["research_studies", "study_participants"]);
  assertScope(calls[0]);
  assert.equal(calls[0].url.searchParams.get("select"), "id");
  assert.equal(calls[0].url.searchParams.get("limit"), "1");
  assertScope(calls[1], "study_id");
  assert.equal(calls[1].url.searchParams.get("offset"), "0");
  assert.equal(calls[1].url.searchParams.get("limit"), "21");
  assert.equal(calls[1].url.searchParams.get("order"), "enrolled_at.desc,id.desc");
  assert.equal(data.items[0].id, participant(20).id);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});

test("participant DTO uses public pseudonyms, preserves stored statuses/timestamps, excludes TEST, and retains withdrawn LIVE records", async () => {
  const completedAt = "2026-09-12T00:00:00Z";
  const { handlers, calls } = harness({ participants: [
    participant(1), participant(2, { status: "baseline_complete" }),
    participant(3, { status: "completed", completed_at: completedAt }), participant(4, { status: "withdrawn" }),
    participant(5, { is_test: true }), participant(6, { owner_user_id: otherOwner }), participant(7, { study_id: foreignStudyId }),
  ] });
  const body = await (await handlers.participants(request("participants"), context())).json();
  assert.deepEqual(body.data.items.map((item) => item.status), ["withdrawn", "completed", "baseline_complete", "active"]);
  assert.equal(body.data.items.length, 4);
  assert.equal(body.data.hasMore, false);
  assert.deepEqual(body.data.items[1], {
    id: participant(3).id, publicId: "SYNTHETIC-P-3", status: "completed",
    enrolledAt: "2026-09-01T00:00:00Z", completedAt,
  });
  assert.equal(body.data.items[0].completedAt, null);
  assert.deepEqual(Object.keys(body.data.items[0]).sort(), ["id", "publicId", "status", "enrolledAt", "completedAt"].sort());
  const params = calls[1].url.searchParams;
  assert.equal(params.get("is_test"), "eq.false");
  assert.equal(params.has("status"), false, "LIVE roster retains withdrawn records, unlike recruitment counts");
  assert.equal(params.get("select"), "id,public_id,status,enrolled_at,completed_at");
  assertPrivacy(body, params.get("select"));
});

test("participant limit caps at 50 and page offset uses the effective limit", async () => {
  const { handlers, calls } = harness({ participants: Array.from({ length: 101 }, (_, index) => participant(index)) });
  const { data } = await (await handlers.participants(request("participants", "?page=2&limit=999"), context())).json();
  assert.equal(data.page, 2);
  assert.equal(data.limit, 50);
  assert.equal(data.items.length, 50);
  assert.equal(data.items[0].id, participant(50).id);
  assert.equal(data.hasMore, true);
  assert.equal(calls[1].url.searchParams.get("offset"), "50");
  assert.equal(calls[1].url.searchParams.get("limit"), "51");
});

for (const key of ["page", "limit"]) {
  test(`participant pagination rejects malformed ${key} before ownership/participant queries`, async () => {
    for (const value of ["", "0", "-1", "1.5", "bad", "1e2", "Infinity", "9007199254740992", " 2", "+2"]) {
      const { handlers, calls } = harness();
      const response = await handlers.participants(request("participants", `?${key}=${encodeURIComponent(value)}`), context());
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
      assert.equal(calls.length, 0);
    }
  });
}

test("participants reject duplicate pagination and overflowing ranges before DB", async () => {
  for (const search of ["?page=1&page=2", "?limit=1&limit=2", "?page=2147483647", "?page=9007199254740991&limit=50"]) {
    const { handlers, calls } = harness();
    assert.equal((await handlers.participants(request("participants", search), context())).status, 400);
    assert.equal(calls.length, 0);
  }
});

test("participant list stays at two queries across empty/full pages and returns a stable terminal page", async () => {
  for (const size of [0, 1, 20, 50]) {
    const { handlers, calls } = harness({ participants: Array.from({ length: size }, (_, index) => participant(index)) });
    const { data } = await (await handlers.participants(request("participants", "?limit=50"), context())).json();
    assert.equal(data.items.length, size);
    assert.equal(data.hasMore, false);
    assert.equal(calls.length, 2);
  }
  const { handlers } = harness({ participants: [participant(1)] });
  assert.deepEqual((await (await handlers.participants(request("participants", "?page=2"), context())).json()).data, {
    items: [], page: 2, limit: 20, hasMore: false,
  });
});

test("detail and ownership-query DB failures use generic public errors and never expose participants", async () => {
  for (const method of ["studyDetail", "participants"]) {
    const { handlers, calls } = harness({ failTable: "research_studies" });
    const response = await handlers[method](request(method), context());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), publicFailure);
    assert.equal(calls.length, 1);
  }
});

test("participant DB failure after ownership returns no partial/sensitive data", async () => {
  const { handlers, calls } = harness({ failTable: "study_participants" });
  const response = await handlers.participants(request("participants"), context());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), publicFailure);
  assert.equal(calls.length, 2);
});

test("both new routes safely handle authentication and parameter-resolution failures", async () => {
  const authFailure = researcherHandlers(async () => { throw new Error("synthetic private auth diagnostic"); });
  for (const method of ["studyDetail", "participants"]) {
    assert.deepEqual(await (await authFailure[method](request(method), context())).json(), publicFailure);
    const { handlers, calls } = harness();
    const failedParams = { params: { then(resolve, reject) { reject(new Error("synthetic private param diagnostic")); } } };
    const response = await handlers[method](request(method), failedParams);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), publicFailure);
    assert.equal(calls.length, 0);
  }
});

test("new routes reuse the shared session-user rate bucket and reject before params/DB", async () => {
  const limitedOwner = "44000000-0000-4000-8000-000000000001";
  for (let index = 0; index < MOBILE_RATE_LIMITS.researcherReads.limit; index++) {
    assert.equal(consumeMobileRateLimit("researcherReads", limitedOwner), true);
  }
  const { handlers, calls } = harness({ userId: limitedOwner });
  for (const method of ["studyDetail", "participants"]) {
    const response = await handlers[method](request(method), context());
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error.code, "RATE_LIMITED");
  }
  assert.equal(calls.length, 0);
  const alternate = harness({ userId: otherOwner });
  assert.equal((await alternate.handlers.studyDetail(request("studyDetail", "", foreignStudyId), context(foreignStudyId))).status, 200);
  assertScope(alternate.calls[0], "id", foreignStudyId, otherOwner);
});
