import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../../supabase/migrations/20260912090000_mobile_participant_core.sql",
  import.meta.url
);

test("mobile participant migration keeps direct handoff access behind RLS", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(
    sql,
    /mobile_participant_web_handoffs ENABLE ROW LEVEL SECURITY/i
  );
  assert.match(
    sql,
    /REVOKE ALL ON TABLE public\.mobile_participant_web_handoffs FROM anon, authenticated/i
  );
  assert.match(sql, /token_hash bytea NOT NULL UNIQUE/i);
  assert.doesNotMatch(sql, /RAISE\s+(NOTICE|LOG|INFO)/i);
});

test("participant reads and writes bind resources to the authenticated account", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.ok((sql.match(/auth_user_id = v_user_id/g) || []).length >= 7);
  assert.match(
    sql,
    /study_participants_mobile_account_study_unique[\s\S]*auth_user_id, study_id, is_test/i
  );
  assert.match(
    sql,
    /participant\.auth_user_id = v_user_id[\s\S]*v_existing\.study_measure_id = p_task_id/i
  );
});

test("link validity, capacity, consent, and task availability remain server checks", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /v_link\.status <> 'active'/i);
  assert.match(sql, /now\(\) > v_link\.ends_at/i);
  assert.match(sql, /v_count >= v_link\.max_participants/i);
  assert.match(sql, /CONSENT_VERSION_CHANGED/i);
  assert.match(sql, /v_measure\.measurement_point <> v_session\.phase/i);
  assert.match(sql, /v_version\.scoring_method = 'none'/i);
});

test("join and completion have durable uniqueness constraints", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /study_participants_mobile_enrollment_key_unique/i);
  assert.match(sql, /study_measure_sessions_mobile_idempotency_unique/i);
  assert.match(sql, /WHEN unique_violation THEN/i);
});
