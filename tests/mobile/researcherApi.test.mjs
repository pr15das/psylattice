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

const { researcherHandlers } = await import("../../lib/mobile/researcherApi.ts");
const { consumeMobileRateLimit, MOBILE_RATE_LIMITS } = await import("../../lib/mobile/rateLimit.ts");
const { GET: summaryRoute } = await import("../../app/api/mobile/researcher/summary/route.ts");
const { GET: studiesRoute } = await import("../../app/api/mobile/researcher/studies/route.ts");
const owner = "10000000-0000-4000-8000-000000000001";
const otherOwner = "10000000-0000-4000-8000-000000000002";
const rawFailure = { code: "XX000", message: "private SQL diagnostic", details: "private participant diagnostic" };
const publicFailure = { error: { code: "SERVER_ERROR", message: "PsyLattice could not complete this request." } };

function request(route, search = "") {
  return new Request(`https://example.invalid/api/mobile/researcher/${route}${search}`, {
    headers: { authorization: "Bearer unit-test-token" },
  });
}

function row(index, overrides = {}) {
  return {
    id: `20000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    title: `Synthetic study ${index}`,
    status: "draft",
    target_sample_size: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-13T00:00:00Z",
    participants: [{ count: 0 }],
    measures: [{ count: 0 }],
    testLinks: [{ count: 0 }],
    liveLinks: [{ count: 0 }],
    ...overrides,
  };
}

function harness({ rows = [], failAt, throwAt, userId = owner, counts } = {}) {
  const calls = [];
  const supabase = createClient("https://unit-test.invalid", "unit-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        calls.push({ url, method: init.method, headers: new Headers(init.headers) });
        if (calls.length >= throwAt) throw new Error("private transport diagnostic");
        if (calls.length === failAt) return Response.json(rawFailure, { status: 400 });
        if (init.method === "HEAD") {
          const count = counts ? counts(url) : 0;
          return new Response(null, { status: 200, headers: { "content-range": `*/${count}` } });
        }
        const offset = Number(url.searchParams.get("offset"));
        const limit = Number(url.searchParams.get("limit"));
        return Response.json(rows.slice(offset, offset + limit));
      },
    },
  });
  return { calls, handlers: researcherHandlers(async () => ({ supabase, userId })) };
}

function assertOwner(call, userId = owner) {
  assert.equal(call.url.searchParams.get("owner_user_id"), `eq.${userId}`);
  assert.equal(call.url.href.includes(otherOwner), false);
}

function assertParticipantScope(params, prefix = "") {
  assert.equal(params.get(`${prefix}is_test`), "eq.false");
  assert.equal(params.get(`${prefix}status`), "neq.withdrawn");
}

test("both actual GET routes reject unauthenticated requests before database work", async (t) => {
  let fetches = 0;
  t.mock.method(globalThis, "fetch", async () => { fetches++; throw new Error("must not contact database"); });
  for (const handler of [summaryRoute, studiesRoute]) {
    for (const authorization of [undefined, "Basic invalid"]) {
      const headers = authorization ? { authorization } : {};
      const response = await handler(new Request("https://example.invalid?page=invalid", { headers }));
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error.code, "UNAUTHORIZED");
    }
  }
  assert.equal(fetches, 0);
});

test("summary counts only session-owned studies and their live, non-withdrawn participants", async () => {
  const studies = [
    { id: "owned-active", owner_user_id: owner, status: "active" },
    { id: "owned-draft", owner_user_id: owner, status: "draft" },
    { id: "owned-paused", owner_user_id: owner, status: "paused" },
    { id: "foreign-active", owner_user_id: otherOwner, status: "active" },
  ];
  const participants = [
    { study_id: "owned-active", owner_user_id: owner, is_test: false, status: "active" },
    { study_id: "owned-draft", owner_user_id: owner, is_test: true, status: "active" },
    { study_id: "owned-active", owner_user_id: owner, is_test: false, status: "withdrawn" },
    { study_id: "foreign-active", owner_user_id: otherOwner, is_test: false, status: "active" },
    { study_id: "foreign-active", owner_user_id: owner, is_test: false, status: "active" },
    { study_id: "owned-active", owner_user_id: owner, is_test: false, status: "completed" },
  ];
  const { handlers, calls } = harness({ counts(url) {
    const params = url.searchParams;
    const scopedStudies = studies.filter((study) => `eq.${study.owner_user_id}` === params.get("owner_user_id"));
    if (url.pathname.endsWith("/research_studies")) {
      return scopedStudies.filter((study) => !params.has("status") || `eq.${study.status}` === params.get("status")).length;
    }
    const studyOwner = params.get("research_studies.owner_user_id");
    return participants.filter((participant) =>
      `eq.${participant.owner_user_id}` === params.get("owner_user_id") &&
      (!studyOwner || studies.some((study) => study.id === participant.study_id && `eq.${study.owner_user_id}` === studyOwner)) &&
      (!params.has("is_test") || `eq.${participant.is_test}` === params.get("is_test")) &&
      (!params.has("status") || `neq.${participant.status}` !== params.get("status"))
    ).length;
  } });
  const response = await handlers.summary(request("summary"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { data: { totalStudies: 3, activeStudies: 1, draftStudies: 1, totalParticipants: 2 } });
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(calls.length, 4);
  for (const call of calls) {
    assertOwner(call);
    assert.equal(call.method, "HEAD");
    assert.match(call.headers.get("prefer"), /count=exact/);
  }
  const participantCall = calls.find((call) => call.url.pathname.endsWith("/study_participants"));
  assert.equal(participantCall.url.searchParams.get("select"), "id,research_studies!inner()");
  assert.equal(participantCall.url.searchParams.get("research_studies.owner_user_id"), `eq.${owner}`);
  assertParticipantScope(participantCall.url.searchParams);
});

test("summary returns zero for an empty workspace", async () => {
  const { handlers } = harness();
  assert.deepEqual(await (await handlers.summary(request("summary"))).json(), {
    data: { totalStudies: 0, activeStudies: 0, draftStudies: 0, totalParticipants: 0 },
  });
});

test("both endpoints reject arbitrary ownership and unknown query parameters before DB", async () => {
  for (const route of ["summary", "studies"]) {
    for (const key of ["owner_user_id", "researcher_id", "user_id", "auth_user_id", "ownerId", "userId", "unknown"]) {
      const { handlers, calls } = harness();
      const response = await handlers[route](request(route, `?${key}=${otherOwner}`));
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
      assert.equal(calls.length, 0);
    }
  }
});

test("summary DB failures in every count return the same safe public error", async () => {
  for (const failAt of [1, 2, 3, 4]) {
    const { handlers } = harness({ failAt });
    const response = await handlers.summary(request("summary"));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), publicFailure);
  }
});

test("list defaults to page 1, limit 20, with a bounded lookahead and stable ordering", async () => {
  const { handlers, calls } = harness({ rows: Array.from({ length: 21 }, (_, index) => row(index)) });
  const response = await handlers.studies(request("studies"));
  const { data } = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.page, 1);
  assert.equal(data.limit, 20);
  assert.equal(data.items.length, 20);
  assert.equal(data.hasMore, true);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(calls.length, 1);
  assertOwner(calls[0]);
  assert.equal(calls[0].url.searchParams.get("offset"), "0");
  assert.equal(calls[0].url.searchParams.get("limit"), "21");
  assert.equal(calls[0].url.searchParams.get("order"), "updated_at.desc,id.desc");
});

test("list caps requested limits at 50 and calculates the page offset from the capped limit", async () => {
  const rows = Array.from({ length: 101 }, (_, index) => row(index));
  const { handlers, calls } = harness({ rows });
  const { data } = await (await handlers.studies(request("studies", "?page=2&limit=500"))).json();
  assert.equal(data.page, 2);
  assert.equal(data.limit, 50);
  assert.equal(data.items.length, 50);
  assert.equal(data.items[0].id, row(50).id);
  assert.equal(data.hasMore, true);
  assert.equal(calls[0].url.searchParams.get("offset"), "50");
  assert.equal(calls[0].url.searchParams.get("limit"), "51");
});

for (const key of ["page", "limit"]) {
  test(`list rejects malformed ${key} before database work`, async () => {
    for (const raw of ["", "0", "-1", "1.5", "abc", "1e2", "Infinity", "9007199254740992", " 2", "+2"]) {
      const { handlers, calls } = harness();
      const response = await handlers.studies(request("studies", `?${key}=${encodeURIComponent(raw)}`));
      assert.equal(response.status, 400, `${key}=${raw}`);
      assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
      assert.equal(calls.length, 0);
    }
  });
}

test("list rejects duplicate pagination and overflowing ranges", async () => {
  for (const search of ["?page=1&page=2", "?limit=1&limit=2", "?page=2147483647", "?page=9007199254740991&limit=50"]) {
    const { handlers, calls } = harness();
    assert.equal((await handlers.studies(request("studies", search))).status, 400);
    assert.equal(calls.length, 0);
  }
});

test("list returns a compact schema-backed DTO with separate TEST/LIVE presence and no participant secrets", async () => {
  const { handlers, calls } = harness({ rows: [
    row(1, { target_sample_size: 120, participants: [{ count: 10001 }], measures: [{ count: 2 }], testLinks: [{ count: 1 }], email: "synthetic-sensitive-marker", participant_code: "synthetic-code-marker", token: "synthetic-link-marker" }),
    row(2, { liveLinks: [{ count: 2 }] }),
    row(3, { testLinks: [{ count: 1 }], liveLinks: [{ count: 1 }], participants: [], measures: [] }),
    row(4),
  ] });
  const { data } = await (await handlers.studies(request("studies"))).json();
  assert.equal(data.hasMore, false);
  assert.deepEqual(data.items.map((item) => [item.hasTestLink, item.hasLiveLink]), [[true, false], [false, true], [true, true], [false, false]]);
  assert.equal(data.items[0].participantCount, 10001);
  assert.equal(data.items[0].targetSampleSize, 120);
  assert.equal(data.items[0].measureCount, 2);
  assert.equal(data.items[1].targetSampleSize, null);
  assert.equal(data.items[2].participantCount, 0);
  assert.deepEqual(Object.keys(data.items[0]).sort(), ["id", "title", "status", "participantCount", "targetSampleSize", "measureCount", "hasTestLink", "hasLiveLink", "createdAt", "updatedAt"].sort());
  assert.equal(JSON.stringify(data).includes("synthetic-sensitive-marker"), false);
  assert.equal(JSON.stringify(data).includes("synthetic-code-marker"), false);
  assert.equal(JSON.stringify(data).includes("synthetic-link-marker"), false);
  const params = calls[0].url.searchParams;
  for (const alias of ["participants", "measures", "testLinks", "liveLinks"]) {
    assert.equal(params.get(`${alias}.owner_user_id`), `eq.${owner}`);
  }
  assertParticipantScope(params, "participants.");
  assert.equal(params.get("testLinks.is_test_link"), "eq.true");
  assert.equal(params.get("liveLinks.is_test_link"), "eq.false");
  const select = params.get("select");
  assert.match(select, /participants:study_participants\(count\)/);
  assert.match(select, /measures:study_measures\(count\)/);
  assert.match(select, /testLinks:study_links!study_links_study_id_fkey\(count\)/);
  assert.match(select, /liveLinks:study_links!study_links_study_id_fkey\(count\)/);
  assert.doesNotMatch(select, /\*|email|public_id|participant_code|answers|scores|token|!inner/);
});

test("list uses exactly one query regardless of the number of studies and handles terminal pages", async () => {
  for (const size of [0, 1, 20, 50]) {
    const { handlers, calls } = harness({ rows: Array.from({ length: size }, (_, index) => row(index)) });
    const { data } = await (await handlers.studies(request("studies", "?limit=50"))).json();
    assert.equal(calls.length, 1);
    assert.equal(data.items.length, size);
    assert.equal(data.hasMore, false);
  }
  const { handlers } = harness({ rows: [row(1)] });
  assert.deepEqual((await (await handlers.studies(request("studies", "?page=2"))).json()).data, {
    items: [], page: 2, limit: 20, hasMore: false,
  });
});

test("list database and transport failures return stable safe public errors", async () => {
  for (const options of [{ failAt: 1 }, { throwAt: 1 }]) {
    const { handlers } = harness(options);
    const response = await handlers.studies(request("studies"));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), publicFailure);
  }
});

test("authentication exceptions return safe errors before database work", async () => {
  const handlers = researcherHandlers(async () => { throw new Error("private auth diagnostic"); });
  for (const route of ["summary", "studies"]) {
    const response = await handlers[route](request(route));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), publicFailure);
  }
});

test("researcher read rate limits share the authenticated user's bucket and block before DB", async () => {
  const limitedOwner = "30000000-0000-4000-8000-000000000001";
  for (let index = 0; index < MOBILE_RATE_LIMITS.researcherReads.limit; index++) {
    assert.equal(consumeMobileRateLimit("researcherReads", limitedOwner), true);
  }
  const { handlers, calls } = harness({ userId: limitedOwner });
  for (const route of ["summary", "studies"]) {
    const response = await handlers[route](request(route));
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error.code, "RATE_LIMITED");
  }
  assert.equal(calls.length, 0);
  const separateOwner = harness({ userId: "30000000-0000-4000-8000-000000000002" });
  assert.equal((await separateOwner.handlers.studies(request("studies"))).status, 200);
  assertOwner(separateOwner.calls[0], "30000000-0000-4000-8000-000000000002");
});
