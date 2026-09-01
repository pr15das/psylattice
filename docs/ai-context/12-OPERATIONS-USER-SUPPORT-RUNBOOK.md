# 12 — Operations and User Support Runbook

This document is for the new engineer whose role includes server maintenance and helping users.

## First principle: distinguish product bug, permissions bug, data bug, and user-state bug

Before changing production data, determine which layer failed.

Common layers:

1. browser/client state;
2. Next.js route/component;
3. Next.js API route;
4. FastAPI service (where still used);
5. Supabase Auth;
6. Supabase RLS/grants;
7. database schema/RPC;
8. Vercel/Render deployment/env;
9. email provider;
10. mobile/Health Connect environment.

## User support workflow

### 1. Reproduce safely

Prefer:

- local development;
- dedicated test account;
- TEST study;
- cognitive pilot link;
- staging/preview deployment if available.

Avoid experimenting on a real participant’s record.

### 2. Capture exact context

Record:

- workspace;
- route;
- user role;
- study/document/task ID if non-sensitive and appropriate;
- browser/device;
- local vs production;
- visible error;
- network/API error;
- first server/build error;
- time of incident.

### 3. Check authorization separately from data existence

A `permission denied for table ...` error can mean missing grants, not necessarily RLS.

An empty list can mean:

- no rows;
- RLS filtered rows;
- wrong owner/role;
- stale foreign key/version ID;
- API query mismatch.

Do not remove RLS to diagnose.

### 4. Check migrations

For a feature introduced through a package, verify the relevant migration actually ran in the target Supabase project.

Examples:

- Cognitive Battery tables;
- Battery assignment migration;
- Thesis Builder writing tables;
- Thesis Builder Free Form constraint migration;
- Cognitive task templates.

Migration history and current schema are more reliable than assuming a local SQL file was executed.

### 5. Preserve user data

Before any manual data repair:

- take/verify backup where appropriate;
- query affected rows;
- understand foreign keys/RLS;
- use a narrowly scoped transaction;
- log what changed and why;
- never change research responses to satisfy a UI expectation.

## Common diagnostic patterns

### Huge VS Code Problems count

Hundreds of errors often come from one unresolved import/type.

Example: missing/unresolved `batteryReporting.ts` caused `report`, `state`, `group`, `row`, `itemId`, etc. to all become implicit `any` downstream.

Fix the first compiler/module error.

### Next.js module-not-found

Confirm:

- actual file path/case;
- alias configuration (`@/...`);
- file exists in current branch;
- dependency installed;
- no old generated `page.tsx` imported a helper that was never copied.

### Supabase `permission denied`

Check:

- table grants to `authenticated`/`anon` as intended;
- RLS enabled;
- policies;
- current role;
- PostgREST schema reload.

### Participant cognitive task behaves as generic/empty

Check dedicated runtime detection and task/version/block metadata. Mental Rotation previously fell into a generic practice path and reported 100% with zero trials.

### Research dashboard missing task-specific panel

Verify:

- live Study saved the expected `summary_scores.<task>` object;
- TEST data toggle state;
- study administration/task version identification;
- current Research page includes the latest task integration;
- raw session is completed.

## Auth/account support

Do not ask for passwords.

For sign-in issues, inspect:

- Supabase Auth user existence/status;
- email/identity provider state;
- role/profile relationship;
- account/workspace access rules;
- password reset/confirmation route behavior;
- email-delivery logs if available.

Email verification was intentionally removed from the onboarding/account flow at one point. Verify current auth policy before telling a user they must verify email.

## Email/follow-up support

Native push is deferred; email-based follow-up delivery is important.

When a follow-up is missed:

- verify schedule/protocol;
- verify recipient/user mapping;
- verify email provider/log;
- verify app recorded send/failure;
- do not assume a mobile push should have fired.

## Cognitive task support

Always preserve:

- task/version identity;
- participant session;
- raw trial data;
- timing diagnostics;
- deterministic summary.

Do not “correct” a cognitive score manually unless a verified scoring bug is being repaired through a documented migration/recompute procedure.

## Thesis Builder support

Important expected behaviors:

- no autosave;
- explicit Save;
- unsaved-change warning;
- Free form default for new/imported docs;
- per-side interactive margins;
- selection preserved for color/highlight/font-size controls;
- AI paper access requires explicit toggle permission;
- nested folders are owner-scoped;
- full-screen/focus mode must not alter saved content.

## Incident severity suggestion

### P0

- data exposure/cross-user access;
- authentication bypass;
- destructive research/clinical data corruption;
- secrets exposed;
- production completely unavailable.

### P1

- widespread login failure;
- study participant flow broken;
- data collection not saving;
- export corrupt/missing raw data;
- clinical messaging/appointments broadly unusable.

### P2

- one feature unavailable with workaround;
- editor control regression;
- analysis view bug where raw data remains safe.

### P3

- cosmetic/UX issue;
- copy inconsistency;
- minor layout regression.

## After an incident

Document:

- what users experienced;
- root cause;
- scope;
- whether data integrity/privacy was affected;
- fix;
- test added;
- migration/data repair if any;
- context doc/runbook update to prevent recurrence.
