import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) return nextResolve(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
  try { return nextResolve(specifier, context); }
  catch (error) {
    if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    throw error;
  }
} });
const { researcherHandlers, mobileResearcherHandlers } = await import("../../lib/mobile/researcherApi.ts");
const { MOBILE_RATE_LIMITS, consumeMobileRateLimit } = await import("../../lib/mobile/rateLimit.ts");
const { GET: libraryRoute } = await import("../../app/api/mobile/researcher/assets/route.ts");
const { GET: attachedRoute, POST: attachRoute } = await import("../../app/api/mobile/researcher/studies/[id]/assets/route.ts");
const uuid = (prefix, index) => `${prefix}000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const owner = uuid("51", 1), foreign = uuid("51", 2), studyId = uuid("54", 1), foreignStudyId = uuid("54", 2);
const secret = "synthetic-private-content-marker";
const forbiddenFields = { definition: secret, participant_instructions: secret, scoring_config: secret, responses: secret, answers: secret, email: secret, fcm_token: secret, jwt: secret };
const serverFailure = { error: { code: "SERVER_ERROR", message: "PsyLattice could not complete this request." } };
const payload = { type: "questionnaire", questionnaire_id: uuid("52", 1), questionnaire_version_id: uuid("53", 1) };
let accountSequence = 0;
function questionnaire(index = 1, overrides = {}) {
  return { id: uuid("52", index), owner_user_id: owner, name: `Synthetic questionnaire ${index}`, acronym: null, source_type: "researcher_created", researcher_available: true, status: "active", updated_at: "2026-09-13T00:00:00Z", ...forbiddenFields, ...overrides };
}
function version(index = 1, overrides = {}) {
  return { id: uuid("53", index), questionnaire_id: uuid("52", 1), version_label: `Version ${index}`, is_current: true, created_at: "2026-09-01T00:00:00Z", ...forbiddenFields, ...overrides };
}
function measure(index = 1, overrides = {}) {
  return { id: uuid("56", index), owner_user_id: owner, study_id: studyId, questionnaire_id: payload.questionnaire_id, questionnaire_version_id: payload.questionnaire_version_id, measurement_point: "baseline", position: index, required: true, config: {}, ...forbiddenFields, ...overrides };
}
function study(overrides = {}) {
  return { id: studyId, owner_user_id: owner, components: { baseline: true, demographics: false }, study_config: {}, ...overrides };
}
function filtered(rows, params, prefix = "") {
  return rows.filter((row) => [...params.entries()].every(([key, value]) => {
    if (!key.startsWith(prefix)) return true;
    const column = key.slice(prefix.length);
    if (column === "or") {
      const userId = /owner_user_id\.eq\.([^,)]+)/.exec(value)?.[1];
      return row.owner_user_id === userId || row.owner_user_id === null;
    }
    if (!Object.hasOwn(row, column)) return true;
    if (value.startsWith("eq.")) return String(row[column]) === value.slice(3);
    if (value === "is.null") return row[column] === null;
    return true;
  }));
}
function harness(options = {}) {
  const userId = options.userId ?? uuid("59", ++accountSequence);
  const source = {
    research_studies: options.studies ?? [study(), study({ id: foreignStudyId, owner_user_id: foreign })],
    questionnaires: options.questionnaires ?? [questionnaire(), questionnaire(2, { owner_user_id: foreign }), questionnaire(3, { owner_user_id: null, source_type: "system" })],
    questionnaire_versions: options.versions ?? [version(), version(2, { questionnaire_id: uuid("52", 2) }), version(3, { questionnaire_id: uuid("52", 3) })],
    study_measures: options.measures ?? [], study_cognitive_tasks: options.cognitive ?? [],
  };
  const tables = JSON.parse(JSON.stringify(source));
  for (const rows of Object.values(tables)) for (const row of rows) if (row.owner_user_id === owner) row.owner_user_id = userId;
  const calls = [];
  let inserted = 0;
  const supabase = createClient("https://unit-test.invalid", "unit-public-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input)), params = url.searchParams, table = url.pathname.split("/").at(-1);
      const call = { url, table, method: init.method, body: init.body ? JSON.parse(init.body) : null };
      calls.push(call);
      if (options.throwInsert && init.method === "POST") throw new Error(secret);
      if (calls.length === options.failAt) return Response.json({ code: options.errorCode ?? "XX000", message: secret, details: secret }, { status: 400 });
      if (init.method === "POST") {
        assert.equal(table, "study_measures");
        assert.equal(call.body.owner_user_id, userId);
        const row = { id: uuid("56", 1000 + ++inserted), ...call.body };
        tables.study_measures.push(row);
        return Response.json(row, { status: 201 });
      }
      assert.equal(init.method, "GET");
      let rows = filtered(tables[table], params);
      const select = params.get("select");
      if (table === "questionnaire_versions" && select.includes("questionnaire:questionnaires!inner")) {
        rows = rows.map((row) => ({ ...row, questionnaire: filtered(tables.questionnaires, params, "questionnaire.").find((q) => q.id === row.questionnaire_id) })).filter((row) => row.questionnaire);
      } else if (table === "study_measures" && select !== "position") {
        rows = rows.map((row) => ({ ...row,
          nameSnapshot: row.config?.questionnaire_name_snapshot ?? null,
          versionLabelSnapshot: row.config?.version_label_snapshot ?? null,
          questionnaire: filtered(tables.questionnaires, params, "questionnaire.").find((q) => q.id === row.questionnaire_id),
          version: tables.questionnaire_versions.find((v) => v.id === row.questionnaire_version_id),
        }));
      } else if (table === "research_studies") {
        rows = rows.map((row) => ({ id: row.id, baselineEnabled: row.components?.baseline ?? null, demographicsEnabled: row.components?.demographics ?? null, demographicsPosition: row.study_config?.demographics_position ?? null }));
      }
      const order = params.get("order");
      if (order) rows.sort((a, b) => {
        for (const part of order.split(",")) {
          const [column, direction] = part.split(".");
          const difference = column === "position" ? a[column] - b[column] : String(a[column]).localeCompare(String(b[column]));
          if (difference) return direction === "desc" ? -difference : difference;
        }
        return 0;
      });
      const offset = Number(params.get("offset") || 0), limit = Number(params.get("limit"));
      assert.ok(Number.isInteger(limit) && limit >= 1 && limit <= 51, "all reads must be bounded");
      return Response.json(rows.slice(offset, offset + limit));
    } },
  });
  return { calls, tables, userId, handlers: researcherHandlers(async () => ({ userId, supabase })) };
}
function makeRequest(kind, { body = payload, raw, search = "", id = studyId, authenticated = true } = {}) {
  const path = kind === "assets" ? "assets" : `studies/${id}/assets`;
  return new Request(`https://example.invalid/api/mobile/researcher/${path}${search}`, {
    method: kind === "attachStudyAsset" ? "POST" : "GET",
    headers: authenticated ? { authorization: "Bearer unit-test-token", "content-type": "application/json" } : {},
    ...(kind === "attachStudyAsset" ? { body: raw ?? JSON.stringify(body) } : {}),
  });
}
function invoke(setup, kind, options = {}) {
  return setup.handlers[kind](makeRequest(kind, options), { params: Promise.resolve({ id: options.id ?? studyId }) });
}
function assertOwner(call, userId, field, id) {
  assert.equal(call.url.searchParams.get("owner_user_id"), `eq.${userId}`);
  if (field) assert.equal(call.url.searchParams.get(field), `eq.${id}`);
}
function assertAccess(call, userId, prefix = "") {
  assert.equal(call.url.searchParams.get(`${prefix}or`), `(owner_user_id.eq.${userId},owner_user_id.is.null)`);
}
function assertPrivacy(body, calls) {
  assert.equal(JSON.stringify(body).includes(secret), false);
  for (const call of calls) assert.doesNotMatch(call.url.searchParams.get("select") ?? "", /\*|definition|participant_instructions|researcher_instructions|scoring_config|responses|answers|email|fcm_token|jwt/);
}
function writes(setup) { return setup.calls.filter((call) => call.method !== "GET"); }
async function assertFailure(response, status = 503, expected = serverFailure) {
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), expected);
}

test("all three actual asset routes authenticate before DB, body parsing, or study params", async (t) => {
  assert.equal(libraryRoute, mobileResearcherHandlers.assets);
  assert.equal(attachedRoute, mobileResearcherHandlers.studyAssets);
  assert.equal(attachRoute, mobileResearcherHandlers.attachStudyAsset);
  let contacts = 0, resolved = 0, parsed = 0;
  t.mock.method(globalThis, "fetch", async () => { contacts++; throw new Error("must not contact DB"); });
  for (const [kind, route] of [["assets", libraryRoute], ["studyAssets", attachedRoute], ["attachStudyAsset", attachRoute]]) {
    const request = makeRequest(kind, { authenticated: false, raw: "invalid JSON" });
    t.mock.method(request, "json", async () => { parsed++; throw new Error("must authenticate first"); });
    const response = await route(request, { params: { then() { resolved++; throw new Error("must authenticate first"); } } });
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, "UNAUTHORIZED");
  }
  assert.equal(contacts + resolved + parsed, 0);
});

test("library returns only owned or system, active, researcher-available current questionnaire versions", async () => {
  const setup = harness({ questionnaires: [questionnaire(), questionnaire(2, { owner_user_id: foreign }), questionnaire(3, { owner_user_id: null, source_type: "system" }), questionnaire(4, { status: "archived" }), questionnaire(5, { researcher_available: false }), questionnaire(6)],
    versions: [version(), version(2, { questionnaire_id: uuid("52", 2) }), version(3, { questionnaire_id: uuid("52", 3) }), version(4, { questionnaire_id: uuid("52", 4) }), version(5, { questionnaire_id: uuid("52", 5) }), version(6, { questionnaire_id: uuid("52", 6), is_current: false })] });
  const response = await invoke(setup, "assets"), body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.data.items.map((item) => item.questionnaireId), [uuid("52", 3), uuid("52", 1)]);
  const params = setup.calls[0].url.searchParams;
  assert.equal(params.get("is_current"), "eq.true");
  assert.equal(params.get("questionnaire.status"), "eq.active");
  assert.equal(params.get("questionnaire.researcher_available"), "eq.true");
  assertAccess(setup.calls[0], setup.userId, "questionnaire.");
  assert.equal(params.get("order"), "created_at.desc,id.desc");
  assert.equal(setup.calls.length, 1);
  assertPrivacy(body, setup.calls);
});

test("library DTO uses a string version label, exact version ID and real questionnaire update timestamp", async () => {
  const setup = harness({ questionnaires: [questionnaire()], versions: [version(7, { version_label: "Validated English edition" })] });
  const response = await invoke(setup, "assets"), body = await response.json();
  assert.deepEqual(body.data.items, [{ type: "questionnaire", questionnaireId: payload.questionnaire_id, questionnaireVersionId: uuid("53", 7), title: "Synthetic questionnaire 1", versionLabel: "Validated English edition", updatedAt: "2026-09-13T00:00:00Z" }]);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assertPrivacy(body, setup.calls);
});

test("library defaults and capped limits use stable bounded lookahead pagination", async () => {
  const versions = Array.from({ length: 101 }, (_, index) => version(index + 1));
  const setup = harness({ versions });
  const { data } = await (await invoke(setup, "assets")).json();
  assert.equal(data.page, 1); assert.equal(data.limit, 20); assert.equal(data.items.length, 20); assert.equal(data.hasMore, true);
  assert.equal(setup.calls[0].url.searchParams.get("limit"), "21");
  const capped = await (await invoke(setup, "assets", { search: "?page=2&limit=500" })).json();
  assert.equal(capped.data.limit, 50); assert.equal(capped.data.items.length, 50); assert.equal(capped.data.hasMore, true);
  assert.equal(capped.data.items[0].questionnaireVersionId, uuid("53", 51));
  assert.equal(setup.calls[1].url.searchParams.get("offset"), "50");
  assert.equal(setup.calls[1].url.searchParams.get("limit"), "51");
});

for (const kind of ["assets", "studyAssets"]) test(`${kind} rejects malformed, duplicate and overflowing pagination before DB`, async () => {
  for (const search of ["?page=0", "?page=-1", "?page=1.5", "?page=abc", "?page=1e2", "?limit=", "?limit=0", "?limit=-1", "?limit=1.2", "?limit=abc", "?limit=9007199254740992", "?page=1&page=2", "?limit=1&limit=2", "?page=2147483647"]) {
    const setup = harness();
    const response = await invoke(setup, kind, { search });
    assert.equal(response.status, 400); assert.equal((await response.json()).error.code, "VALIDATION_FAILED"); assert.equal(setup.calls.length, 0);
  }
});

test("all asset routes reject client ownership and unsupported query selectors before DB", async () => {
  for (const kind of ["assets", "studyAssets", "attachStudyAsset"]) for (const key of ["owner_user_id", "researcher_id", "user_id", "includeTest", "type"]) {
    const setup = harness();
    assert.equal((await invoke(setup, kind, { search: `?${key}=${foreign}` })).status, 400);
    assert.equal(setup.calls.length, 0);
  }
});

test("study asset GET and POST validate the study UUID before DB", async () => {
  for (const kind of ["studyAssets", "attachStudyAsset"]) for (const id of ["bad-id", "", "54000000-0000-4000-8000-000000000001 OR true"]) {
    const setup = harness();
    assert.equal((await invoke(setup, kind, { id })).status, 400); assert.equal(setup.calls.length, 0);
  }
});

test("attached assets check ownership first and keep exact old pinned versions with stored metadata", async () => {
  const setup = harness({ versions: [version(1, { is_current: false }), version(9)], measures: [measure(1, { required: false, measurement_point: "followup", config: { questionnaire_name_snapshot: "Pinned study title", version_label_snapshot: "Pinned edition" } })] });
  const response = await invoke(setup, "studyAssets"), body = await response.json();
  assert.deepEqual(body.data.items, [{ studyMeasureId: uuid("56", 1), type: "questionnaire", questionnaireId: payload.questionnaire_id, questionnaireVersionId: payload.questionnaire_version_id, title: "Pinned study title", versionLabel: "Pinned edition", measurementPoint: "followup", position: 1, required: false }]);
  assert.deepEqual(setup.calls.map((call) => call.table), ["research_studies", "study_measures"]);
  assertOwner(setup.calls[0], setup.userId, "id", studyId); assertOwner(setup.calls[1], setup.userId, "study_id", studyId);
  assertAccess(setup.calls[1], setup.userId, "questionnaire.");
  assert.equal(setup.calls[1].url.searchParams.get("order"), "position.asc,id.asc");
  assert.equal(setup.calls[1].url.searchParams.has("version.is_current"), false);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assertPrivacy(body, setup.calls);
});

test("unsupported/malformed measure rows and mismatched version relationships are omitted safely", async () => {
  const setup = harness({ measures: [measure(1), measure(2, { questionnaire_version_id: uuid("53", 2) }), measure(3, { questionnaire_id: null, questionnaire_version_id: null }), measure(4, { questionnaire_id: uuid("52", 2), questionnaire_version_id: uuid("53", 2) }), measure(5, { questionnaire_version_id: uuid("53", 99) })] });
  const body = await (await invoke(setup, "studyAssets")).json();
  assert.equal(body.data.items.length, 1); assert.equal(body.data.items[0].questionnaireVersionId, payload.questionnaire_version_id);
  assertPrivacy(body, setup.calls);
});

test("missing/cross-owner studies block attached reads and writes before questionnaire or measure work", async () => {
  for (const kind of ["studyAssets", "attachStudyAsset"]) for (const id of [foreignStudyId, uuid("54", 99)]) {
    const setup = harness(); const response = await invoke(setup, kind, { id });
    assert.equal(response.status, 403); assert.equal((await response.json()).error.code, "FORBIDDEN");
    assert.equal(setup.calls.length, 1); assert.equal(setup.calls[0].table, "research_studies"); assert.equal(writes(setup).length, 0);
  }
});

test("attached pagination defaults/caps and query counts remain bounded independently of attachment count", async () => {
  for (const size of [0, 1, 20, 51]) {
    const setup = harness({ measures: Array.from({ length: size }, (_, index) => measure(index + 1)) });
    const { data } = await (await invoke(setup, "studyAssets", { search: "?limit=500" })).json();
    assert.equal(data.page, 1); assert.equal(data.limit, 50); assert.equal(data.items.length, Math.min(size, 50)); assert.equal(data.hasMore, size > 50); assert.equal(setup.calls.length, 2);
  }
  const setup = harness({ measures: Array.from({ length: 21 }, (_, index) => measure(index + 1)) });
  const { data } = await (await invoke(setup, "studyAssets")).json();
  assert.equal(data.limit, 20); assert.equal(data.items.length, 20); assert.equal(data.hasMore, true);
  assert.equal(setup.calls[1].url.searchParams.get("limit"), "21");
  const terminal = await (await invoke(setup, "studyAssets", { search: "?page=3" })).json();
  assert.deepEqual(terminal.data, { items: [], page: 3, limit: 20, hasMore: false });
});

test("POST rejects malformed/non-object JSON and incomplete bodies before DB", async () => {
  for (const raw of ["invalid JSON", "null", "[]", "1", "{}", '{"type":"questionnaire"}']) {
    const setup = harness(); assert.equal((await invoke(setup, "attachStudyAsset", { raw })).status, 400); assert.equal(setup.calls.length, 0);
  }
});

test("POST rejects unexpected fields, arbitrary ownership, non-questionnaire types and invalid asset UUIDs", async () => {
  const invalid = [
    ...["owner_user_id", "study_id", "study_measure_id", "position", "measurement_point", "required", "config", "definition"].map((key) => ({ ...payload, [key]: foreign })),
    { ...payload, type: "cognitive" }, { ...payload, questionnaire_id: "invalid" }, { ...payload, questionnaire_version_id: "invalid" },
  ];
  for (const body of invalid) {
    const setup = harness(); const response = await invoke(setup, "attachStudyAsset", { body });
    assert.equal(response.status, 400); assert.equal(setup.calls.length, 0);
  }
});

test("POST rejects inaccessible, archived or unavailable questionnaires before version lookup/insertion", async () => {
  for (const q of [questionnaire(1, { owner_user_id: foreign }), questionnaire(1, { status: "archived" }), questionnaire(1, { researcher_available: false })]) {
    const setup = harness({ questionnaires: [q] }); const response = await invoke(setup, "attachStudyAsset");
    assert.equal(response.status, 403); assert.equal((await response.json()).error.code, "FORBIDDEN");
    assert.equal(setup.calls.length, 2); assert.equal(writes(setup).length, 0); assertAccess(setup.calls[1], setup.userId);
  }
});

test("POST requires the selected version to belong to the exact questionnaire and be current", async () => {
  for (const v of [version(1, { questionnaire_id: uuid("52", 2) }), version(1, { is_current: false })]) {
    const setup = harness({ versions: [v] }); const response = await invoke(setup, "attachStudyAsset");
    assert.equal(response.status, 400); assert.equal((await response.json()).error.code, "VALIDATION_FAILED");
    assert.equal(setup.calls.length, 3); assert.equal(writes(setup).length, 0);
    const params = setup.calls[2].url.searchParams;
    assert.equal(params.get("id"), `eq.${payload.questionnaire_version_id}`);
    assert.equal(params.get("questionnaire_id"), `eq.${payload.questionnaire_id}`); assert.equal(params.get("is_current"), "eq.true");
  }
});

test("POST persists the exact chosen version, derives ownership from auth, and never switches an existing pin or modifies definitions", async () => {
  const setup = harness({ versions: [version(1, { is_current: false }), version(9)], measures: [measure(1)] });
  const definitionsBefore = JSON.stringify([setup.tables.questionnaires, setup.tables.questionnaire_versions]);
  const body = { ...payload, questionnaire_version_id: uuid("53", 9) };
  const response = await invoke(setup, "attachStudyAsset", { body }), result = await response.json();
  assert.equal(response.status, 201); assert.equal(result.data.questionnaireVersionId, body.questionnaire_version_id);
  assert.equal(result.data.type, "questionnaire"); assert.equal(result.data.measurementPoint, "baseline"); assert.equal(result.data.required, true); assert.equal(result.data.position, 2);
  assert.equal(setup.tables.study_measures[0].questionnaire_version_id, payload.questionnaire_version_id);
  assert.equal(setup.tables.study_measures[1].questionnaire_version_id, body.questionnaire_version_id);
  assert.equal(writes(setup).length, 1); const insertion = writes(setup)[0];
  assert.equal(insertion.body.owner_user_id, setup.userId); assert.equal(insertion.body.study_id, studyId);
  assert.equal(insertion.body.questionnaire_version_id, body.questionnaire_version_id);
  assert.deepEqual(insertion.body.config, { source_type: "researcher_created", questionnaire_name_snapshot: "Synthetic questionnaire 1", questionnaire_acronym_snapshot: null, version_label_snapshot: "Version 9" });
  assert.equal(JSON.stringify([setup.tables.questionnaires, setup.tables.questionnaire_versions]), definitionsBefore);
  assert.equal(setup.calls.length, 6); assertPrivacy(result, setup.calls);
});

test("POST permits accessible active system questionnaires while study measure ownership stays with the session user", async () => {
  const setup = harness(); const body = { ...payload, questionnaire_id: uuid("52", 3), questionnaire_version_id: uuid("53", 3) };
  const response = await invoke(setup, "attachStudyAsset", { body });
  assert.equal(response.status, 201); assert.equal((await response.json()).data.questionnaireVersionId, body.questionnaire_version_id);
  assert.equal(writes(setup)[0].body.owner_user_id, setup.userId);
});

test("repeated questionnaire/version administrations create distinct measures, matching web behavior", async () => {
  const setup = harness();
  const first = await (await invoke(setup, "attachStudyAsset")).json(); const second = await (await invoke(setup, "attachStudyAsset")).json();
  assert.notEqual(first.data.studyMeasureId, second.data.studyMeasureId);
  assert.equal(first.data.questionnaireVersionId, second.data.questionnaireVersionId);
  assert.deepEqual(setup.tables.study_measures.map((row) => row.position), [1, 2]);
  assert.equal(writes(setup).length, 2);
  const schema = readFileSync(new URL("../../supabase/migrations/20260814012000_existing_remote_baseline.sql", import.meta.url), "utf8");
  assert.doesNotMatch(schema.match(/CREATE TABLE IF NOT EXISTS "public"\."study_measures" \([\s\S]*?\n\);/)[0], /UNIQUE/);
});

test("POST appends after the full existing flow while reading only scoped cognitive positions", async () => {
  const setup = harness({ studies: [study({ components: { baseline: true, demographics: true }, study_config: { demographics_position: 9 } })], measures: [measure(3), measure(100, { measurement_point: "followup" })],
    cognitive: [{ study_id: studyId, owner_user_id: owner, position: 7 }, { study_id: foreignStudyId, owner_user_id: owner, position: 99 }, { study_id: studyId, owner_user_id: foreign, position: 99 }] });
  const response = await invoke(setup, "attachStudyAsset"); assert.equal(response.status, 201); assert.equal((await response.json()).data.position, 10);
  const cognitive = setup.calls.find((call) => call.table === "study_cognitive_tasks");
  assertOwner(cognitive, setup.userId, "study_id", studyId); assert.equal(cognitive.url.searchParams.get("select"), "position"); assert.equal(cognitive.url.searchParams.get("limit"), "1");
  assert.equal(writes(setup).every((call) => call.table === "study_measures"), true);
});

test("POST rejects disabled baseline components and invalid/overflowing flow positions without writes", async () => {
  const disabled = harness({ studies: [study({ components: { baseline: false } })] });
  const response = await invoke(disabled, "attachStudyAsset"); assert.equal(response.status, 409); assert.equal((await response.json()).error.code, "STUDY_UNAVAILABLE"); assert.equal(disabled.calls.length, 1);
  for (const demographics_position of ["invalid", "2147483647"]) {
    const setup = harness({ studies: [study({ components: { baseline: true, demographics: true }, study_config: { demographics_position } })] });
    await assertFailure(await invoke(setup, "attachStudyAsset")); assert.equal(writes(setup).length, 0);
  }
});

test("GET database failures return generic errors without contents or responses", async () => {
  for (const [kind, positions] of [["assets", [1]], ["studyAssets", [1, 2]]]) for (const failAt of positions) {
    const setup = harness({ failAt }); await assertFailure(await invoke(setup, kind)); assert.equal(writes(setup).length, 0);
  }
});

test("POST database errors at every validation, ordering, and insert stage remain generic", async () => {
  for (const failAt of [1, 2, 3, 4, 5, 6]) {
    const setup = harness({ failAt }); await assertFailure(await invoke(setup, "attachStudyAsset")); assert.equal(setup.tables.study_measures.length, 0);
  }
});

test("database uniqueness conflicts use a stable safe 409 without inventing questionnaire deduplication", async () => {
  const setup = harness({ failAt: 6, errorCode: "23505" });
  await assertFailure(await invoke(setup, "attachStudyAsset"), 409, { error: { code: "CONFLICT", message: "PsyLattice could not complete this request." } });
  assert.equal(setup.tables.study_measures.length, 0);
});

test("uncertain POST transport failure is generic and is not automatically retried", async () => {
  const setup = harness({ throwInsert: true }); await assertFailure(await invoke(setup, "attachStudyAsset")); assert.equal(writes(setup).length, 1); assert.equal(setup.tables.study_measures.length, 0);
});

test("GET routes share researcher reads, POST has a separate session-user mutation bucket", async () => {
  const readLimited = harness();
  for (let index = 0; index < MOBILE_RATE_LIMITS.researcherReads.limit; index++) consumeMobileRateLimit("researcherReads", readLimited.userId);
  for (const kind of ["assets", "studyAssets"]) assert.equal((await invoke(readLimited, kind)).status, 429);
  assert.equal(readLimited.calls.length, 0); assert.equal((await invoke(readLimited, "attachStudyAsset")).status, 201);
  const writeLimited = harness();
  for (let index = 0; index < MOBILE_RATE_LIMITS.researcherMutations.limit; index++) consumeMobileRateLimit("researcherMutations", writeLimited.userId);
  assert.equal((await invoke(writeLimited, "attachStudyAsset")).status, 429); assert.equal(writeLimited.calls.length, 0);
  assert.equal((await invoke(writeLimited, "assets")).status, 200);
  assert.equal((await invoke(harness(), "attachStudyAsset")).status, 201);
});

test("asset handlers preserve safe authentication and deferred-parameter error handling", async () => {
  const handlers = researcherHandlers(async () => { throw new Error(secret); });
  for (const kind of ["assets", "studyAssets", "attachStudyAsset"]) await assertFailure(await handlers[kind](makeRequest(kind), { params: Promise.resolve({ id: studyId }) }));
  for (const kind of ["studyAssets", "attachStudyAsset"]) {
    const setup = harness(); const context = { params: { then(resolve, reject) { reject(new Error(secret)); } } };
    await assertFailure(await setup.handlers[kind](makeRequest(kind), context)); assert.equal(setup.calls.length, 0);
  }
});

test("legacy missing component flags follow the builder's enabled baseline/demographics defaults", async () => {
  const setup = harness({ studies: [study({ components: {}, study_config: {} })] });
  const response = await invoke(setup, "attachStudyAsset");
  assert.equal(response.status, 201);
  assert.equal((await response.json()).data.position, 2);
  assert.equal(setup.tables.study_measures.length, 1);
});
