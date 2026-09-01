# 25 — How to Keep This AI Context Accurate

This handoff pack should become a lightweight living architecture/product record rather than a one-time export from one ChatGPT conversation.

## Update `16-CURRENT-STATE-ROADMAP.md` when

- a major feature reaches production;
- a deferred feature is restarted;
- a runtime/deployment changes;
- a feature is renamed;
- a product invariant changes.

## Update `17-KNOWN-BUGS-AND-REGRESSIONS.md` when

- a regression teaches a reusable engineering lesson;
- a brittle interaction requires a specific implementation pattern;
- a migration/security issue could plausibly recur.

Include symptom, cause, correct fix pattern, and what not to do.

## Update `21-DATABASE-SURFACE-MAP.md` when

- a new core table/RPC is created;
- table ownership/permission design changes;
- an old table is intentionally retired.

Do not put secret values in the map.

## Update `23-COMPONENT-AND-FILE-MAP.md` when

- a giant component is split into modules;
- route ownership moves;
- AI/export/cognitive logic changes home.

## Decision logging

For meaningful product decisions, append a short dated entry to `15-DECISION-LOG.md`:

- decision;
- reason;
- feature affected;
- rejected alternative if important.

This is especially useful for decisions such as “manual Save, not autosave” that future engineers might otherwise reverse because autosave seems conventional.

## AI onboarding check

When a new ChatGPT/Codex session starts, ask it to summarize the context before coding. If its summary misses critical invariants, correct the context pack rather than relying on one-off prompt corrections forever.

## Code remains source of truth

If this documentation becomes stale, update it. Do not force current code to match stale documentation blindly.
