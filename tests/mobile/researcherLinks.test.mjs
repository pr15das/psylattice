import { registerHooks } from "node:module";
import assert from "node:assert/strict";
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
const routes = await import("../../app/api/mobile/researcher/studies/[id]/links/route.ts");
const owner = "51000000-0000-4000-8000-000000000001";
const otherOwner = "51000000-0000-4000-8000-000000000002";
const studyId = "52000000-0000-4000-8000-000000000001";
const foreignStudyId = "52000000-0000-4000-8000-000000000002";
const otherOwnedStudyId = "52000000-0000-4000-8000-000000000003";
const missingStudyId = "52000000-0000-4000-8000-000000000004";
const publicFailure = { error: { code: "SERVER_ERROR", message: "PsyLattice could not complete this request." } };
const publicDenied = { error: { code: "FORBIDDEN", message: "You do not have access to this participant resource." } };
const linkColumns = "id,name,token,is_test_link,status,access_mode,max_participants,starts_at,ends_at,allow_multiple_submissions,created_at";
const dtoKeys = ["id", "name", "token", "canonicalPath", "isTestLink", "status", "accessMode", "participantLimit", "startsAt", "endsAt", "allowMultipleSubmissions", "createdAt"].sort();
const sensitiveFields = {
  participant_code: "synthetic-private-marker", answers: "synthetic-private-marker",
  auth_user_id: "synthetic-private-marker", email: "synthetic-private-marker",
  fcm_token: "synthetic-private-marker", installation_id: "synthetic-private-marker",
  jwt: "synthetic-private-marker", session_token: "synthetic-private-marker",
  consent_body: "synthetic-private-marker", recruitment_config: "synthetic-private-marker",
};

function study(id = studyId, ownerId = owner) { return { id, owner_user_id: ownerId }; }
function link(index, overrides = {}) {
  return {
    id: `53000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    owner_user_id: owner, study_id: studyId, name: "Synthetic link",
    token: index.toString(16).padStart(48, "0"), is_test_link: true, status: "active",
    access_mode: "open", max_participants: null, starts_at: null, ends_at: null,
    allow_multiple_submissions: false, created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z", ...sensitiveFields, ...overrides,
  };
}
function context(id = studyId) { return { params: Promise.resolve({ id }) }; }
function request(search = "", id = studyId, origin = "https://example.invalid") {
  return new Request(`${origin}/api/mobile/researcher/studies/${id}/links${search}`, {
    headers: { authorization: "Bearer unit-test-token" },
  });
}
function filtered(rows, params) {
  return rows.filter((row) => [...params.entries()].every(([column, filter]) => {
    if (!Object.hasOwn(row, column)) return true;
    return !filter.startsWith("eq.") || String(row[column]) === filter.slice(3);
  }));
}
function harness({
  studies = [study(), study(foreignStudyId, otherOwner), study(otherOwnedStudyId)],
  links = [], userId = owner, failTable, nullTable,
} = {}) {
  const calls = [];
  const supabase = createClient("https://unit-test.invalid", "unit-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(String(input));
        const table = url.pathname.split("/").at(-1);
        calls.push({ url, table, method: init.method });
        assert.equal(init.method, "GET", "link reads must not mutate recruitment state");
        assert.ok(["research_studies", "study_links"].includes(table), "no participant/device query");
        if (table === failTable) {
          return Response.json({ code: "XX000", message: "synthetic private SQL diagnostic", details: "synthetic private detail" }, { status: 400 });
        }
        if (table === nullTable) return Response.json(null);
        const params = url.searchParams;
        const rows = filtered(table === "research_studies" ? studies : links, params);
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
        assert.ok(Number.isInteger(limit) && limit >= 1 && limit <= 51, "bounded query including lookahead");
        return Response.json(rows.slice(offset, offset + limit));
      },
    },
  });
  return { calls, handlers: researcherHandlers(async () => ({ userId, supabase })) };
}
function assertScope(call, column, id = studyId, userId = owner) {
  assert.equal(call.url.searchParams.get("owner_user_id"), `eq.${userId}`);
  assert.equal(call.url.searchParams.get(column), `eq.${id}`);
}
function assertNoStore(response) {
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
}

// Import the actual route: framework-derived unsupported-method handling stays intact.
test("the Step 4A-4 route exports GET only", () => {
  assert.deepEqual(Object.keys(routes), ["GET"]);
  assert.equal(routes.GET, mobileResearcherHandlers.links);
});

test("actual route authenticates before query validation, DB, or resolving study params", async (t) => {
  let fetches = 0;
  let resolvedParams = 0;
  t.mock.method(globalThis, "fetch", async () => { fetches++; throw new Error("must not contact DB"); });
  const deferred = { params: { then() { resolvedParams++; throw new Error("must authenticate first"); } } };
  for (const authorization of [undefined, "Basic synthetic", "Bearer"]) {
    const headers = authorization ? { authorization } : {};
    const response = await routes.GET(new Request("https://example.invalid?owner_user_id=bad&page=bad", { headers }), deferred);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
    assertNoStore(response);
  }
  assert.equal(fetches, 0);
  assert.equal(resolvedParams, 0);
});

test("shared authentication denial is returned before database work", async () => {
  const handlers = researcherHandlers(async () => Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }));
  const response = await handlers.links(request(), { params: Promise.resolve({ id: "bad" }) });
  assert.equal(response.status, 401);
});

test("invalid study UUIDs fail before any DB query", async () => {
  for (const id of [undefined, "", "invalid", `${studyId} OR 1=1`, "52000000-0000-0000-0000-000000000001"]) {
    const { handlers, calls } = harness();
    const response = await handlers.links(request(), { params: Promise.resolve({ id }) });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
    assert.equal(calls.length, 0);
  }
});

test("unknown ownership selectors and duplicated parameters fail before DB", async () => {
  for (const search of ["?owner_user_id=someone", "?researcher_id=someone", "?userId=someone", "?study_id=someone", "?is_test_link=true", "?page=1&page=2", "?limit=1&limit=2"]) {
    const { handlers, calls } = harness();
    const response = await handlers.links(request(search), context());
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
    assert.equal(calls.length, 0);
  }
});

test("invalid pagination and overflowing lookahead ranges fail before DB", async () => {
  for (const search of ["?page=0", "?page=-1", "?page=1.5", "?page=01", "?page=", "?limit=0", "?limit=nope", "?limit=1.5", "?limit=9007199254740992", "?page=9007199254740991", "?page=2147483648&limit=1"]) {
    const { handlers, calls } = harness();
    const response = await handlers.links(request(search), context());
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
    assert.equal(calls.length, 0);
  }
});

test("foreign and missing studies are indistinguishable and never fetch tokens", async () => {
  for (const id of [foreignStudyId, missingStudyId]) {
    const { handlers, calls } = harness({ links: [link(1, { study_id: id })] });
    const response = await handlers.links(request("", id), context(id));
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), publicDenied);
    assertNoStore(response);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].table, "research_studies");
    assertScope(calls[0], "id", id);
    assert.equal(calls[0].url.searchParams.get("select"), "id");
  }
});

test("both study and link queries use only the authenticated owner", async () => {
  const { handlers, calls } = harness({ userId: otherOwner, links: [link(1, { study_id: foreignStudyId, owner_user_id: otherOwner })] });
  const response = await handlers.links(request("", foreignStudyId), context(foreignStudyId));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.items.length, 1);
  assert.equal(calls.length, 2);
  assertScope(calls[0], "id", foreignStudyId, otherOwner);
  assertScope(calls[1], "study_id", foreignStudyId, otherOwner);
});

test("foreign-owner child links and links in another study cannot leak tokens", async () => {
  const owned = link(1);
  const { handlers, calls } = harness({ links: [
    owned, link(2, { owner_user_id: otherOwner }),
    link(3, { study_id: otherOwnedStudyId }),
    link(4, { study_id: foreignStudyId, owner_user_id: otherOwner }),
  ] });
  const response = await handlers.links(request(), context());
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.deepEqual(data.items.map((item) => item.token), [owned.token]);
  assertScope(calls[0], "id");
  assertScope(calls[1], "study_id");
});

test("compact DTO preserves actual join settings and strips unrelated private fields", async () => {
  const row = link(1, {
    is_test_link: false, status: "paused", access_mode: "participant_code", max_participants: 27,
    starts_at: "2026-09-20T00:00:00Z", ends_at: "2026-10-01T00:00:00Z", allow_multiple_submissions: true,
  });
  const { handlers, calls } = harness({ links: [row] });
  const response = await handlers.links(request(), context());
  assert.equal(response.status, 200);
  assertNoStore(response);
  const body = await response.json();
  assert.deepEqual(body, { data: { items: [{
    id: row.id, name: row.name, token: row.token, canonicalPath: `/study/${row.token}`,
    isTestLink: false, status: "paused", accessMode: "participant_code", participantLimit: 27,
    startsAt: row.starts_at, endsAt: row.ends_at, allowMultipleSubmissions: true, createdAt: row.created_at,
  }], page: 1, limit: 20, hasMore: false } });
  assert.deepEqual(Object.keys(body.data.items[0]).sort(), dtoKeys);
  assert.equal(JSON.stringify(body).includes("synthetic-private-marker"), false);
  const select = calls[1].url.searchParams.get("select");
  assert.equal(select, linkColumns);
  assert.doesNotMatch(select, /\*|owner_user_id|participant_code|email|answers|fcm_token|installation_id|auth_user_id|jwt|session_token|consent/);
  assert.equal(calls.length, 2);
});

test("TEST and LIVE flags come solely from is_test_link, despite misleading names or status", async () => {
  const rows = [
    link(1, { name: "LIVE recruitment", is_test_link: true, status: "closed" }),
    link(2, { name: "TEST preview", is_test_link: false, status: "active" }),
    link(3, { name: "LIVE recruitment", is_test_link: true, status: "active" }),
    link(4, { name: "TEST preview", is_test_link: false, status: "paused" }),
  ];
  const { handlers } = harness({ links: rows });
  const response = await handlers.links(request(), context());
  const { data } = await response.json();
  for (const row of rows) assert.equal(data.items.find((item) => item.id === row.id).isTestLink, row.is_test_link);
  assert.equal(data.items.filter((item) => item.isTestLink === true).length, 2);
  assert.equal(data.items.filter((item) => item.isTestLink === false).length, 2);
});

test("multiple links per type and all old active/paused/closed links remain in the list", async () => {
  const rows = [link(1), link(2), link(3, { is_test_link: false }), link(4, { is_test_link: false }), link(5, { status: "paused" }), link(6, { status: "closed" })];
  const { handlers, calls } = harness({ links: rows });
  const response = await handlers.links(request(), context());
  const { data } = await response.json();
  assert.equal(data.items.length, 6);
  assert.deepEqual(data.items.filter((item) => item.status === "active").map((item) => item.id), rows.slice(0, 4).reverse().map((row) => row.id));
  assert.equal(calls[1].url.searchParams.has("status"), false);
  assert.equal(calls[1].url.searchParams.has("is_test_link"), false);
  assert.ok(calls.every((call) => call.method === "GET"));
});

test("nullable limits and window timestamps remain null without invented enabled/expiry fields", async () => {
  const { handlers } = harness({ links: [link(1), link(2, { is_test_link: false })] });
  const response = await handlers.links(request(), context());
  const { data } = await response.json();
  for (const item of data.items) {
    assert.equal(item.participantLimit, null);
    assert.equal(item.startsAt, null);
    assert.equal(item.endsAt, null);
    assert.equal(Object.hasOwn(item, "enabled"), false);
    assert.equal(Object.hasOwn(item, "expiresAt"), false);
  }
});

test("canonical paths are independent of Preview or request origins for both link kinds", async () => {
  const rows = [link(1), link(2, { is_test_link: false })];
  const { handlers } = harness({ links: rows });
  const response = await handlers.links(request("", studyId, "https://synthetic-preview.vercel.app"), context());
  const { data } = await response.json();
  for (const item of data.items) {
    assert.equal(item.canonicalPath, `/study/${item.token}`);
    assert.equal(Object.hasOwn(item, "url"), false);
    assert.doesNotMatch(item.canonicalPath, /https?:|vercel|example/);
  }
});

test("canonical path encodes a token as one path segment while preserving its value", async () => {
  const token = "synthetic/path?query#fragment";
  const { handlers } = harness({ links: [link(1, { token })] });
  const response = await handlers.links(request(), context());
  const item = (await response.json()).data.items[0];
  assert.equal(item.token, token);
  assert.equal(item.canonicalPath, `/study/${encodeURIComponent(token)}`);
});

test("stable created_at/id descending order and lookahead preserve page boundaries", async () => {
  const rows = [link(1), link(4), link(2), link(3, { created_at: "2026-09-02T00:00:00Z" })];
  const { handlers, calls } = harness({ links: rows });
  const first = await handlers.links(request("?limit=2"), context());
  const second = await handlers.links(request("?page=2&limit=2"), context());
  const a = (await first.json()).data;
  const b = (await second.json()).data;
  assert.deepEqual(a.items.map((item) => item.id), [rows[3].id, rows[1].id]);
  assert.deepEqual(b.items.map((item) => item.id), [rows[2].id, rows[0].id]);
  assert.equal(a.hasMore, true);
  assert.equal(b.hasMore, false);
  assert.equal(a.page, 1);
  assert.equal(b.page, 2);
  for (const call of [calls[1], calls[3]]) {
    assert.equal(call.url.searchParams.get("order"), "created_at.desc,id.desc");
    assert.equal(call.url.searchParams.get("limit"), "3");
  }
  assert.equal(calls[3].url.searchParams.get("offset"), "2");
});

test("default and clamped pagination fetch at most one bounded lookahead row", async () => {
  const rows = Array.from({ length: 52 }, (_, index) => link(index + 1));
  for (const [search, limit] of [["", 20], ["?limit=500", 50]]) {
    const { handlers, calls } = harness({ links: rows });
    const response = await handlers.links(request(search), context());
    const { data } = await response.json();
    assert.equal(data.limit, limit);
    assert.equal(data.items.length, limit);
    assert.equal(data.hasMore, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url.searchParams.get("limit"), String(limit + 1));
    assert.equal(calls[1].url.searchParams.has("count"), false);
  }
});

test("owned empty studies and pages beyond the list return empty data", async () => {
  for (const [links, search] of [[[], ""], [[link(1)], "?page=2"]]) {
    const { handlers, calls } = harness({ links });
    const response = await handlers.links(request(search), context());
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, { items: [], page: search ? 2 : 1, limit: 20, hasMore: false });
    assert.equal(calls.length, 2);
  }
});

test("DB failures in either query hide raw diagnostics and partial token data", async () => {
  for (const failTable of ["research_studies", "study_links"]) {
    const { handlers, calls } = harness({ links: [link(1)], failTable });
    const response = await handlers.links(request(), context());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), publicFailure);
    assertNoStore(response);
    assert.equal(calls.length, failTable === "research_studies" ? 1 : 2);
  }
});

test("unexpected null link data is a safe server error", async () => {
  const { handlers } = harness({ nullTable: "study_links" });
  const response = await handlers.links(request(), context());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), publicFailure);
});

test("unexpected authentication or params failures use safe public errors", async () => {
  const throwingAuth = researcherHandlers(async () => { throw new Error("synthetic private auth diagnostic"); });
  const authResponse = await throwingAuth.links(request(), context());
  assert.equal(authResponse.status, 503);
  assert.deepEqual(await authResponse.json(), publicFailure);
  const { handlers, calls } = harness();
  const response = await handlers.links(request(), { params: { then() { throw new Error("synthetic private params diagnostic"); } } });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), publicFailure);
  assert.equal(calls.length, 0);
});

test("GET shares the existing read bucket by authenticated user, before DB", async () => {
  const blockedOwner = "51000000-0000-4000-8000-000000000099";
  assert.equal(MOBILE_RATE_LIMITS.researcherReads.limit, 300);
  assert.equal(MOBILE_RATE_LIMITS.researcherReads.windowMs, 10 * 60 * 1000);
  for (let index = 0; index < MOBILE_RATE_LIMITS.researcherReads.limit; index++) {
    assert.equal(consumeMobileRateLimit("researcherReads", blockedOwner), true);
  }
  const { handlers, calls } = harness({ userId: blockedOwner });
  const response = await handlers.links(request(), context());
  assert.equal(response.status, 429);
  assert.equal((await response.json()).error.code, "RATE_LIMITED");
  assertNoStore(response);
  assert.equal(calls.length, 0);
  assert.equal(consumeMobileRateLimit("researcherMutations", blockedOwner), true);
  const independent = harness();
  assert.equal((await independent.handlers.links(request(), context())).status, 200);
});
