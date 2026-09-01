# 21 — Database Surface Map (Known / Partial)

This is a context map, not a substitute for inspecting the current Supabase schema.

## Cognitive task system

Known entities include:

- `cognitive_tasks`
- `cognitive_task_versions`
- `cognitive_task_blocks`
- `cognitive_task_references`
- `cognitive_task_sessions`
- `cognitive_trial_results`
- `cognitive_pilot_links`
- pilot session/result structures introduced with pilot work

### Versioning principle

- system templates can be refreshed;
- immutable published versions should not be silently modified;
- pilot links may hold immutable definition snapshots;
- studies pin exact versions.

## Cognitive battery system

Known tables:

- `cognitive_batteries`
- `cognitive_battery_versions`
- `cognitive_battery_items`
- `cognitive_battery_assignments`

Important permission history:

- authenticated grants were initially omitted for the first three tables and later fixed;
- 2M migration reapplies required grants;
- participant battery assignment should go through the controlled Study RPC/security-definer path, not broad participant table write access.

## Research writing / Thesis Builder

### `research_writing_folders`

Key fields:

- `id`
- `owner_user_id`
- `parent_folder_id`
- `name`
- `position`
- created/updated timestamps

Owner-parent validation prevents cross-user folder parenting and cycles.

### `research_writing_documents`

Key fields:

- `id`
- `owner_user_id`
- `folder_id`
- `title`
- `document_type`
- `format_style`
- `content_html`
- `content_text`
- `editor_settings` JSONB
- `pinned`
- timestamps

Initial format constraint contained APA/MLA/Chicago/IEEE/Custom. A later 1H migration expands it for `freeform` and makes Free Form the intended new-document mode.

### `research_writing_revisions`

Key fields:

- `document_id`
- `owner_user_id`
- revision reason;
- title/content snapshots;
- format style;
- editor settings;
- timestamp.

Policies:

- owner-scoped select/insert/delete as designed;
- documents/folders owner-scoped all operations;
- explicit authenticated grants exist.

## Study Builder / battery metadata

Battery membership for a preserved Study Battery is carried with study cognitive attachments in `schedule_config`-style JSON metadata, including battery identity/group/order/transition/break information.

Do not remove this metadata just because the battery UI can be reconstructed from the source battery. It is part of reproducible study execution.

## Ambulatory

Research page calls an RPC named:

`psylattice_research_ambulatory_summary`

There are protocol data structures with duration, enabled state, protocol/schedule rows, and participant prompt/check-in records.

Inspect current schema for exact v3 table/RPC names before support queries.

## General schema rules

- foreign keys should express ownership/version relationships;
- RLS should be enabled for user-sensitive tables;
- authenticated/anon grants must match the policy design;
- system templates should not grant researcher mutation of canonical system rows;
- public participant routes should use constrained RPCs/tokens, not broad anon access.
