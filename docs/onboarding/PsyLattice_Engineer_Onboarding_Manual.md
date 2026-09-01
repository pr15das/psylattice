# PsyLattice Engineering & Operations Onboarding Manual

**From API keys and production access to product vision, research architecture, design language, support operations, GitHub workflow, and ChatGPT/Codex context transfer**

**Version:** 1.0  
**Snapshot:** 1 September 2026  
**Classification:** Internal engineering document

---

## Contents
1. How to use this manual
2. Accounts, access, and ownership
3. API keys, environment variables, and secret handling
4. GitHub, Git, branches, and code ownership
5. Local development environment
6. Vercel deployment and production operations
7. Supabase: database, Auth, Storage, RLS, and RPC operations
8. User maintenance and support procedures
9. Email, notifications, scheduled jobs, and Resend
10. OpenAI integration and AI product boundaries
11. Product vision and differentiation
12. Current technical architecture and codebase boundaries
13. PsyLattice design language and UX rules
14. Research workspace map
15. Study Builder, questionnaires, ambulatory assessment, and follow-ups
16. Cognitive Lab and task engines
17. Cognitive Battery Builder and execution
18. Research data, analysis, export, and Research AI
19. Thesis Builder - current functional specification
20. Self, Clinical, Android, and wearables
21. Security, privacy, RLS, and data integrity
22. Operations and user-support runbook
23. Development, testing, deployment, and release workflow
24. Deferred features and explicit non-goals
25. Decision history - why the system is this way
26. Current state and roadmap
27. Known bugs, regressions, and traps
28. Known uncertainties - verify before changing
29. Database surface map
30. Naming and product copy style
31. Component and file map
32. Migration history reference
33. Transferring PsyLattice context to ChatGPT/Codex
34. Incident response and production support
35. New engineer first-week checklist
36. Keeping this manual and AI context alive
37. Appendix - quick reference and non-negotiables

---

# 1. How to use this manual

**Document status:** Internal engineering manual / living document  
**Snapshot:** 1 September 2026  
**Primary audience:** PsyLattice engineers responsible for application development, production reliability, user support, data integrity, deployments, and platform operations.

> **This manual contains locations and names of credentials, never credential values.** Do not paste `.env.local`, service-role/secret keys, API keys, participant records, clinical records, or user documents into GitHub issues, ChatGPT, Slack, email, screenshots, or support tickets.

PsyLattice has evolved very quickly. Historical phase ZIPs and generated replacement files exist, but **the checked-out Git repository is always the implementation source of truth**. This manual explains the accumulated product and engineering context so a new engineer can understand *why* the system looks the way it does before changing it.

The engineer should also receive the separate **PsyLattice AI + Engineering Handoff Pack**. That pack is designed to give ChatGPT/Codex the same project context. This manual is the human operational companion to it.

---

# 2. Accounts, access, and ownership

The first onboarding objective is to give the engineer enough access to maintain PsyLattice without making them an owner of every service. Use least privilege and enable two-factor authentication everywhere possible.

## Owner preparation before the engineer starts

The project owner should prepare or verify the following before sharing any secret:

1. **GitHub repository access.** Add the engineer with the minimum repository role that allows the work expected. For an engineer actively pushing code, `Write` access is normally sufficient; `Maintain` or `Admin` should be reserved for people who truly need repository/security/destructive settings.
2. **Vercel project access.** The engineer needs deployment/log access. Grant environment-variable editing only if part of the server-maintenance role.
3. **Supabase project access.** The engineer needs enough access to inspect Auth, Database, SQL Editor, Logs, Storage, Functions/RPCs, and API settings. Billing/organization ownership is not required for routine engineering.
4. **OpenAI API project access or a dedicated service credential.** Prefer a project-scoped service account/key or secret-manager delivery rather than sharing a founder/personal key.
5. **Resend access** if the engineer will maintain email notifications/follow-ups.
6. **Render access** only if the FastAPI/Render backend is still active after current verification.
7. **Support mailbox access** if the engineer is expected to answer or investigate user tickets. Never use a shared plaintext password; use proper delegated/team access where available.
8. **Domain/DNS access** only if the engineer is responsible for domains, email authentication, or emergency DNS recovery.
9. **Android repository/project access** if the engineer will maintain the native app or Health Connect integration.
10. A **password manager / secret-sharing channel** for any secret that must exist locally. Do not send secrets in chat.

## Access principle

A PsyLattice engineer should be able to:

- clone and build the project;
- open a Preview deployment;
- read production logs;
- inspect Supabase rows and policies relevant to a ticket;
- run reviewed migrations;
- rotate service credentials when authorized;
- diagnose email/AI/media failures;
- support users without ever asking for their password.

They should **not** automatically receive:

- billing-owner permissions;
- domain registrar ownership;
- unrestricted organization-admin permissions;
- the ability to delete production databases or repositories without additional approval;
- personal founder credentials.

## First-day access verification

The engineer should verify all of these before making a feature change:

```bash
# source code
git remote -v
git branch --show-current
git status

# runtime
nvm use
node -v
npm -v

# install/build
npm ci
npm run build
npm run dev
```

Then verify browser access to:

- GitHub repository and pull requests;
- Vercel Deployments and Logs;
- Supabase project Dashboard;
- current production PsyLattice domain;
- TEST participant flow;
- OpenAI/Resend/Render dashboards only if their role requires them.

---

# 3. API keys, environment variables, and secret handling

PsyLattice uses environment variables in several places. **Variable names may be committed; values must not be.** The current application has historically supported both newer Supabase publishable keys and older anon/service-role naming, so inspect current code before renaming anything.

## Where local web variables live

The web app uses:

```text
<repo-root>/.env.local
```

This file must be ignored by Git. If it is ever accidentally committed or uploaded to a ticket/chat, treat every secret inside it as compromised and rotate it.

## Where production/preview variables live

In Vercel:

```text
Project -> Settings -> Environment Variables
```

Environment variables are scoped to Production, Preview, and/or Development. An environment change requires a new deployment before the running app sees it.

## Current/known web environment-variable inventory

| Variable | Classification | Used for | Where to obtain / manage | Rules |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public config | Browser/server Supabase project URL | Supabase Project Connect / API settings; Vercel; `.env.local` | Safe to be public; still treat configuration changes carefully. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public key | Preferred browser/mobile Supabase key | Supabase Settings -> API Keys / Connect | Designed for public clients; security still depends on Auth + RLS. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy public key | Backward-compatible public client key | Supabase legacy API keys | Current code may use as fallback. Do not remove until repository search confirms unused. |
| `NEXT_PUBLIC_SUPABASE_KEY` | Legacy/fallback public key name | Backward compatibility in some routes | Vercel / `.env.local` | Verify current callers before cleanup. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret / elevated** | Server admin operations, storage/media/admin routes, scheduled jobs | Supabase legacy service-role key | Bypasses RLS. Server only. Never browser/mobile/ChatGPT. |
| `OPENAI_API_KEY` | **Secret** | AI Guide, Research Assistant, Writing AI and mobile-safe AI endpoints | OpenAI API project key/service account | Server only. Full key is only shown when created; rotate if exposed. |
| `PSYLATTICE_AI_GUIDE_MODEL` | Config | Optional AI Guide model override | Vercel / `.env.local` | Not a secret. Verify model availability before changing. |
| `PSYLATTICE_RESEARCH_AI_MODEL` | Config | Research Assistant model override | Vercel / `.env.local` | Falls back to AI Guide model in existing implementation. |
| `PSYLATTICE_WRITING_AI_MODEL` | Config | Thesis Builder Writing AI model override | Vercel / `.env.local` | Current Writing route falls back Research -> AI Guide -> default. |
| `RESEND_API_KEY` | **Secret** | Email notification/follow-up delivery | Resend API Keys | Server/cron only. Rotate if leaked. |
| `PSYLATTICE_EMAIL_FROM` | Config | Verified sender/from address used by email route | Resend verified sender/domain configuration | Must match a sender/domain Resend accepts. |
| `CRON_SECRET` | **Secret** | Protect scheduled/cron delivery endpoint(s) | Generated/stored in Vercel secret config | Treat like an API credential; do not put in query logs/screenshots. |
| `NEXT_PUBLIC_APP_URL` | Public config | Canonical application origin in links | Vercel / `.env.local` | Usually production/preview origin. |
| `PSYLATTICE_APP_URL` | Server config | Fallback canonical app origin | Vercel / `.env.local` | Used when a public-prefixed URL is not configured. |
| `VERCEL_OIDC_TOKEN` | Platform/system | Vercel-managed integration token seen historically | Vercel system/integration | **VERIFY CURRENT.** Do not copy or manually manage unless a current integration explicitly requires it. |

### Supabase key modernization note

Supabase now recommends `sb_publishable_...` for public clients and `sb_secret_...` for secure backend components; legacy `anon`/`service_role` keys remain supported during migration. PsyLattice code still contains explicit `SUPABASE_SERVICE_ROLE_KEY` and legacy fallbacks in some routes. **Do not rename or disable legacy keys until the code and all deployed environments have been deliberately migrated and tested.**

## Where to find each credential

### Supabase

Use the project Dashboard's **Connect** dialog or **Settings -> API Keys**. The publishable key is intended for browser/mobile. Secret/service-role keys are elevated and must stay in secure server components.

### OpenAI

Use the OpenAI API Platform project that owns PsyLattice API usage. Prefer a **project-scoped service account or project API key** for production. The secret is shown when created and cannot be safely recovered later; if lost, create/rotate rather than hunting through logs.

### Resend

Use the PsyLattice Resend project/team API-key page. Verify the sending domain/address is authenticated. Email failures often come from a valid API key paired with an unverified or mismatched `PSYLATTICE_EMAIL_FROM`.

### Vercel

Production values belong in the PsyLattice project's Environment Variables. Do not use a local `.env.local` as the source of truth for production. After changing a variable, redeploy.

## Android credential location

Android uses only public Supabase client configuration. Current Gradle code reads values from:

```text
android/PsyLatticeCompanion/local.properties
```

Known properties:

```properties
PSYLATTICE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
PSYLATTICE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY
# legacy fallback supported in some builds:
PSYLATTICE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Gradle exposes these as BuildConfig public client fields. **Never put `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, or `CRON_SECRET` into the Android project.** Compiled mobile apps are public environments.

## Safe `.env.local` template

The pack delivered with this manual contains `ENVIRONMENT_VARIABLES.example`. Copy the names only, then populate values through the team secret-sharing process.

## Secret rotation procedure

If a secret is exposed:

1. Record which secret and where it was exposed; do not repeat the value in the incident record.
2. Create/rotate the credential at the provider.
3. Update Vercel Production/Preview as appropriate.
4. Update authorized developer local environments through the secret manager.
5. Redeploy.
6. Test the exact affected feature.
7. Revoke/delete the old credential.
8. Search Git history/tickets/chat for accidental copies and remediate where possible.
9. Add a short sanitized incident note to engineering records.

---

# 4. GitHub, Git, branches, and code ownership

## Repository source of truth

The exact current remote is whatever the checked-out repository reports:

```bash
git remote -v
```

Recent development used the `main` branch as the production branch. **Current Git wins over every historical phase ZIP, generated replacement file, or old onboarding document.**

## Recommended engineer workflow

```bash
git switch main
git pull --ff-only

git switch -c engineer/<short-ticket-name>
# make a small, scoped change

npm run build
git status
git diff

git add <specific-files>
git commit -m "Describe the change"
git push -u origin engineer/<short-ticket-name>
```

Open a pull request, review the diff, then merge to `main` when approved. If the team still occasionally pushes directly to `main`, treat that as an owner-approved exception, not the default onboarding workflow.

## Git permissions

For an engineer who actively writes code, GitHub's `Write` role is generally the least-privilege starting point. Use `Maintain`/`Admin` only if they must manage repository/security/destructive settings. Require 2FA where possible.

## Files that should never be committed

At minimum:

- `.env.local` and secret variants;
- Android `local.properties`;
- `node_modules/`;
- `.next/` build output;
- private exports containing participant/clinical data;
- service-account JSON files/keys;
- screenshots that reveal secrets or participant data.

Verify `.gitignore` before the engineer's first push.

## Large-file / phase-package rule

PsyLattice was developed through many staged replacement packages. A file named `...PHASE...`, `FIX1`, `2K`, `1L`, etc. is **historical context**, not automatically the current file.

Before touching high-risk files such as:

- `app/researcher/page.tsx`;
- `app/study/[token]/page.tsx`;
- `components/CognitiveRunner.tsx`;
- `components/CognitiveStudyRunner.tsx`;
- `components/ResearchWritingWorkspace.tsx`;

always compare against current Git and port only the intended change.

Useful commands:

```bash
git log --oneline --decorate -20
git diff main...HEAD -- app/researcher/page.tsx
git blame <file>
git status --short
```

Do not "fix" a complicated current file by copying an older full-file package over it.

## SQL and code must travel together

If a frontend/API change requires a migration, commit the migration with the code. Prefer migrations that are idempotent/backward-compatible enough for a short old/new deployment overlap.

## Preview before production

A branch push should be tested in a Vercel Preview deployment when available. The minimum flow is:

1. local `npm run build`;
2. local functional test;
3. push branch;
4. Preview smoke test;
5. review diff/PR;
6. merge to main;
7. production smoke test.

---

# 5. Local development environment

PsyLattice now targets **Node 24 LTS** locally. The repository should have:

```text
.nvmrc
24
```

## New-machine setup

```bash
# install nvm if the machine does not have it
# then from repo root:
nvm install 24
nvm use 24
nvm alias default 24

node -v
npm -v

npm ci
npm run dev
```

Open localhost and perform a basic smoke test. Before merging any change:

```bash
npm run build
```

Do not casually run:

```bash
npm audit fix --force
```

A forced dependency rewrite can introduce breaking upgrades unrelated to the ticket.

## When VS Code shows hundreds of TypeScript Problems

PsyLattice has large typed files where one missing import/helper can produce hundreds of downstream implicit-`any` diagnostics. Find the **first real compiler/module error** instead of adding `any` everywhere.

Useful sequence:

```bash
npm run build
```

Then fix the first meaningful error. Restart VS Code TypeScript Server after dependency/module repairs.

## Recommended local browsers/test contexts

Maintain at least:

- a normal signed-in researcher window;
- an incognito/private window for TEST participant links;
- a mobile/responsive viewport check;
- Safari testing for Thesis Builder/editor selection behaviors if developing on macOS.

---

# 6. Vercel deployment and production operations

The web app is deployed through **Vercel**. Recent development uses `main` as the production branch.

## What the engineer should know in Vercel

- **Deployments:** build status, commit, branch, production/preview URL.
- **Logs:** API-route/runtime failures, cron errors, server exceptions.
- **Environment Variables:** Production/Preview/Development scope.
- **Domains:** production domain mapping; change only if explicitly responsible.
- **Project settings:** Node runtime/version, build command, install command, root directory.

## Environment-variable changes

Changing an environment variable does not alter an already-running deployment. Save the value and redeploy. Test the feature that uses it.

## Deployment failure triage

1. Read the **first build error**, not the final generic Vercel failure banner.
2. Reproduce locally with `npm run build` on Node 24.
3. Confirm the deployment has all required environment variables.
4. Check whether a migration was applied before code started calling the new schema/RPC.
5. Confirm dependency lockfile and Node version.
6. If a server route fails only in production, inspect runtime logs and request path/status.

## Production smoke test after merge

At minimum:

- sign in and open Researcher;
- open the feature changed by the release;
- create/use a TEST object rather than live participant data when possible;
- if database code changed, confirm expected row creation/update;
- if AI/email changed, send one safe test request;
- inspect logs for unexpected new errors.

---

# 7. Supabase: database, Auth, Storage, RLS, and RPC operations

Supabase is a core PsyLattice platform dependency: Postgres, Auth, Storage, RLS, and many RPCs/functions live there.

## Golden security rule

**RLS and PostgreSQL grants solve different problems.** A table can have perfect RLS policies and still return `permission denied for table ...` if the role lacks a GRANT. The Cognitive Battery Builder permission bug is the canonical regression: policies existed, authenticated table grants did not.

Never disable RLS as a support shortcut.

## Database change workflow

1. Inspect current schema and existing migrations.
2. Write a named SQL migration.
3. Add constraints/foreign keys/indexes.
4. Enable/retain RLS.
5. Create the smallest required policies.
6. Add required `GRANT` statements.
7. Test as the intended role.
8. Test a user who should be denied.
9. If public participant behavior is involved, use token/session-scoped RPCs rather than broad anonymous table access.
10. Commit the SQL with the dependent code.

## SQL Editor safety

For high-risk production changes:

- run a `SELECT` first using exactly the intended filter;
- use transactions where possible;
- never run an unscoped `UPDATE`/`DELETE` while troubleshooting;
- capture row counts and IDs, not raw sensitive content, in the incident note;
- make a backup/recovery plan before destructive schema work.

## Auth / account model

PsyLattice uses one Supabase Auth identity for Self, Researcher, and Clinician workspaces. Workspace choice is navigation, not a mutually exclusive account role. The legacy `profiles.role` may exist for compatibility; do not reintroduce routing based on a single old role.

The product was changed so signup should not require a separate email-verification step in the current configuration. **VERIFY CURRENT Supabase Auth settings before changing onboarding.**

## Storage

Known current/recent buckets/routes include:

- `questionnaire-media` for researcher/questionnaire media;
- `study-uploads` for participant/study upload content.

Next.js media-ticket routes use the public Supabase key for public RPC access and elevated server credentials for protected storage/admin operations. Never hand a service-role credential to the browser.

## Public research RPC pattern

Historical/current known public RPC concepts include:

- `psylattice_public_study`;
- `psylattice_start_participation`;
- `psylattice_resume_participation`;
- consent/demographic/measure save RPCs;
- participant completion;
- later cognitive/battery/ambulatory functions.

Inspect current `pg_proc`/migration definitions before modifying them. Public functions are security boundaries: constrain `search_path`, validate tokens/session ownership, validate IDs belong to the active study, and return only needed data.

## Key rotation warning

A service-role/secret key bypasses RLS. If it is leaked, rotate it immediately and redeploy every server component that depended on it.

---

# 8. User maintenance and support procedures

The new engineer is expected to help maintain users. Support work must be reproducible and privacy-preserving.

## Never ask a user for

- their password;
- their Supabase session token;
- an API key;
- a participant-session token;
- a full export containing unrelated participants;
- clinical/research text that is not necessary for the ticket.

## Login/account issue workflow

1. Ask for the minimum account identifier needed to locate the account (normally the email used to sign in).
2. In Supabase Auth, confirm the account exists and is not disabled/deleted.
3. Inspect the matching `profiles` row and expected workspace metadata.
4. Confirm production environment variables point at the intended Supabase project.
5. Reproduce with a safe test account when possible.
6. For password problems, use the normal reset-password flow rather than reading/changing a password manually.
7. If a profile row is missing/corrupt, repair through an approved migration/function or carefully reviewed operation; do not create arbitrary cross-user ownership rows.
8. Record only sanitized troubleshooting details.

## "Permission denied" workflow

1. Identify the table/RPC from the error.
2. Determine the caller role: `anon`, `authenticated`, or server elevated client.
3. Check table GRANTs.
4. Check RLS is enabled and the intended policy exists.
5. Check the row's ownership/study relationship.
6. Check that the migration was applied to the correct Supabase project.
7. Do **not** grant broad anon access as a shortcut.

## Research participant support

Research participants are not ordinary PsyLattice authenticated users in the public study flow. Support should work from:

- study link token/link record;
- pseudonymous participant ID;
- participant session state;
- TEST/LIVE status.

Never change a participant's research responses just to make a UI appear complete. If data repair is necessary, document the reason and preserve an audit trail.

## Thesis Builder/user document support

Researcher Thesis Builder documents are owner-scoped. Do not read or copy user manuscript text unless the support task truly requires it and the user has provided/authorized it. AI paper access is intentionally permission-gated in product behavior.

---

# 9. Email, notifications, scheduled jobs, and Resend

PsyLattice currently relies heavily on **email** for cross-device follow-up/notification delivery because native push was deliberately deferred.

Known server route requirements include:

```text
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
PSYLATTICE_EMAIL_FROM
CRON_SECRET
NEXT_PUBLIC_APP_URL or PSYLATTICE_APP_URL
```

The email worker/route reads pending email notifications from a queue such as `psylattice_notification_queue`, resolves the recipient, sends through Resend, and records success/failure state.

## Email failure checklist

1. Is `RESEND_API_KEY` configured in the deployment environment?
2. Is `PSYLATTICE_EMAIL_FROM` a verified sender/domain?
3. Is the route authorized with the correct cron secret?
4. Is the notification queue row `pending`, not expired/cancelled?
5. Does the target user/participant resolve to an email address?
6. Does the Vercel/cron execution log show a provider error?
7. Is the application URL correct in generated links?
8. Has the environment change been redeployed?

## Cron protection

Scheduled routes must not become open public admin endpoints. Keep a server secret and verify it before processing queued notifications.

## Native push boundary

Do not tell users Android/iOS push is a complete cross-device delivery guarantee. Android has in-app/foreground/background mechanisms and WorkManager behavior, but product strategy still treats email as the dependable follow-up channel while unified native push remains deferred.

---

# 10. OpenAI integration and AI product boundaries

PsyLattice AI features use **server-side OpenAI API calls**. The browser/mobile client must never contain `OPENAI_API_KEY`.

Known AI surfaces include:

- Self **AI Guide**;
- Research **Research Assistant**;
- Thesis Builder **Writing AI**;
- Android/mobile-safe AI endpoint that accepts a Supabase bearer token and calls OpenAI server-side.

## Model configuration

Known optional variables:

```text
PSYLATTICE_AI_GUIDE_MODEL
PSYLATTICE_RESEARCH_AI_MODEL
PSYLATTICE_WRITING_AI_MODEL
```

The Writing Assistant implementation falls back Writing -> Research -> AI Guide -> an internal default. Verify current route code/model availability before changing.

## Data boundaries

### Research AI

The architecture is:

```text
Raw observations -> deterministic PsyLattice analysis -> structured verified context -> AI explanation
```

The AI does not become the scoring/statistics engine. Stored cognitive-task summaries and deterministic analysis are authoritative.

### Thesis Builder Writing AI

The Writing AI route authenticates the researcher, verifies the document belongs to them, and uses `store: false`. It does not autonomously fetch the document body from the database. The browser sends paper text when the researcher has turned **Allow AI to read current paper** ON.

Current product behavior:

- document access starts Off;
- turning it On asks permission once;
- while On, subsequent questions can include the current paper;
- turning it Off stops sending the paper;
- leaving/reloading the editor resets the permission state;
- continuous realtime review is not currently enabled.

### Self AI

AI remains supportive/educational/navigational, not diagnostic/prescriptive. Do not present model output as clinical judgment.

## OpenAI credential ownership

For team operations, use a project-scoped API key/service account rather than a personal key where possible. Limit permissions/budgets at the OpenAI project level. If a key is lost, create a new one; do not search logs for the full secret.

## AI support checklist

If AI returns a configuration error:

1. Check `OPENAI_API_KEY` in Vercel for the relevant environment.
2. Check model override variables for a typo/unavailable model.
3. Confirm the server route can authenticate the user/study/document.
4. Check Vercel runtime logs.
5. Confirm the route isn't receiving an oversized context/document.
6. Never "fix" an AI error by moving the API key client-side.

---

# 11. Product vision and differentiation

## Why PsyLattice exists

PsyLattice is meant to reduce the technical overhead that prevents psychology students, early-career researchers, clinicians, and research teams from using modern data collection and analysis workflows.

The product should feel like a coherent psychology workspace, not a box of unrelated tools.

A strong Research journey is:

1. Choose or build validated/reusable components.
2. Assemble the participant protocol in Study Builder.
3. Preview/pilot before collecting real data.
4. Collect questionnaire, cognitive, ambulatory, wearable, follow-up, and other study data.
5. Inspect participant progress and data quality.
6. Analyse clean participant-level variables while preserving raw data.
7. Connect variables through existing analysis tools such as Study Associations.
8. Let AI interpret the stored deterministic outputs within the study context.
9. Export complete, reproducible research workbooks/raw files.

## Differentiation

Competitor research during development showed overlapping strengths across PsychoPy/Pavlovia, Gorilla, Labvanced, and m-Path.

The chosen direction is **not** to win by cloning every competitor feature. PsyLattice should win by making the entire psychologist workflow coherent and approachable.

Four strategic moat areas:

1. **Unified Study Builder** across questionnaires, cognitive tasks, demographics, EMA/ambulatory, wearables, and future data sources.
2. **Psychological-data awareness** rather than generic CSV handling.
3. **Very approachable UX** for students and early-career researchers without stripping out real capability.
4. **Context-aware analysis + AI** as a final layer over deterministic data, not gimmicky AI study generation.

## Target users

Research UX decisions have repeatedly prioritized:

- young researchers;
- MSc/PhD students;
- thesis makers;
- new graduates;
- early-career psychologists;
- researchers who do not want to code experimental tasks or clean complex multi-source datasets manually.

The platform can grow into larger labs, but new complexity should not destroy this accessibility.

## Product behavior principles

### One capable interface, not Beginner vs Advanced

A Beginner/Advanced split was explicitly rejected. Instead:

- progressively disclose complexity;
- use plain language;
- show sensible defaults;
- provide visual explanations;
- preserve full configuration capability where scientifically necessary.

### Documentation should teach visually

For cognitive tasks and complex research features:

- use custom diagrams/illustrations;
- explain participant flow visually;
- explain what the task measures;
- explain how settings change the experiment;
- avoid dumping full application screenshots into documentation whenever possible.

### Premium onboarding

Onboarding should be concise, visual, interactive, and motivating. Long copy and large screenshots of whole pages were considered clunky and were explicitly targeted for redesign.

## Pricing/product decisions

Known product decisions:

- first study free;
- payment starts from the second study onward;
- monthly/annual subscriptions planned;
- pricing should be meaningfully below major specialist competitors;
- payment gateway can be integrated later;
- mobile app may redirect to the website for payment.

Treat pricing as product configuration that may change. Verify current pricing pages before support or billing changes.

## Product integrity

Do not add a feature merely because a competitor has it. Before adding something, ask:

- Does it improve the Build→Export chain?
- Does PsyLattice understand the output?
- Does it fit the user’s research workflow?
- Can it be implemented with scientific and privacy integrity?
- Will it remain understandable?

A smaller integrated system is preferable to a huge collection of disconnected widgets.

---

# 12. Current technical architecture and codebase boundaries

## Current known web stack

The established web architecture is:

- **Next.js 16.x App Router + TypeScript** application. Verify the exact installed version in `package.json`/lockfile and follow the repository root `AGENTS.md` requirement to read the matching docs under `node_modules/next/dist/docs/` before using version-sensitive APIs.
- Tailwind-based component styling, with shadcn/ui-style conventions in parts of the product.
- **Vercel** deployment for the web application.
- **Supabase** for PostgreSQL, Auth, Storage, Row Level Security, RPCs/functions, and much of the application data model.
- Server-side OpenAI integration through API routes and/or backend services.
- A **FastAPI** service on Render was part of the backend architecture in the late-August 2026 handoff, running Python 3.11 and previously referenced at `https://psylattice-api.onrender.com`.

### Important: backend ownership is mixed / must be verified

The modern repository also contains Next.js API routes such as research export, research assistant, writing assistant, media, messages, auth callbacks, and other server surfaces.

Therefore:

**Do not assume all backend logic lives in FastAPI, and do not assume FastAPI is obsolete. Inspect current route usage, environment variables, frontend callers, Render, and Vercel before migrating/removing anything.**

## Runtime

On 2026-09-01 the local project runtime was upgraded from Node 20.12.2 to **Node 24 LTS** using nvm.

The repository should contain:

```text
.nvmrc -> 24
```

Typical setup:

```bash
nvm use
npm ci
npm run dev
npm run build
```

The Node upgrade was motivated by dependency engine requirements from recent Supabase/OpenAI/eslint packages and produced a noticeable local responsiveness improvement.

## Repository

Recent local Git output showed a remote under `github.com/pr15das/psylattice.git` on branch `main`.

Older project handoff material referred to a repository named `PsyLattice-Research-Platform` with root folder `psylattice`.

**VERIFY CURRENT:** treat `git remote -v` as authoritative and update this doc if the canonical repository name has changed.

## Frontend route/workspace pattern

Major route families observed/developed include:

- `/researcher`
- `/self`
- `/clinician`
- `/study/[token]`
- auth/sign-in/reset/onboarding routes
- `/api/...` server routes

The project historically aimed for role/workspace separation so unauthorized workspace options are not casually exposed.

## Supabase conventions

### RLS is a core architectural control

Owner-based rows generally use `owner_user_id = auth.uid()` or study/role-specific policies.

When adding tables:

1. create schema/constraints/indexes;
2. enable RLS;
3. create explicit policies;
4. add explicit PostgreSQL grants to the intended role;
5. test using the application’s normal authenticated/public path;
6. reload PostgREST schema when necessary.

A real Battery Builder regression demonstrated that correct RLS without `GRANT` still produces `permission denied for table ...`.

### Security-definer RPCs

Participant/public workflows may use security-definer RPCs when participants should not receive direct write access to sensitive orchestration tables. Battery assignment is an example.

Audit these functions carefully:

- fixed/search_path discipline;
- validate authentication or token/session ownership;
- validate input IDs belong to the intended study/researcher;
- avoid broad service-role bypasses in client code.

## Versioned research definitions

The cognitive system includes entities analogous to:

- `cognitive_tasks`
- `cognitive_task_versions`
- `cognitive_task_blocks`
- `cognitive_task_references`
- `cognitive_task_sessions`
- `cognitive_trial_results`
- cognitive pilot links/sessions

Published versions are intended to be immutable/pinned.

The battery system adds versioned batteries and participant-specific assignment records. See `07-BATTERY-BUILDER.md`.

The Thesis Builder uses owner-scoped research writing tables. See `09-THESIS-BUILDER.md` and `21-DATABASE-SURFACE-MAP.md`.

## Mobile architecture

Android development is separate from the Next.js web application and has used native Android/Kotlin/Compose-style code.

Health Connect is the Android wearable bridge. Native push has intentionally been deferred.

## Large-file warning

`app/researcher/page.tsx` became a very large, feature-dense file during rapid development. It contains Study Builder, Research Data, export, analysis, battery integration, and workspace UI logic.

A future refactor into domain modules is desirable, but do not perform a “cleanup rewrite” casually. The file has accumulated many later features, and old phase files are not safe replacements.

Refactor incrementally with tests/snapshots and preserve behavior.

---

# 13. PsyLattice design language and UX rules

## Overall feel

PsyLattice should feel:

- minimal;
- modern;
- high-end;
- calm;
- research/clinical professional;
- visually coherent across workspaces;
- approachable to non-programmers.

Preserve the PsyLattice logo and established color identity.

## Visual language

The Research UI has evolved toward:

- clean white primary surfaces;
- soft slate/grey page backgrounds;
- restrained cyan/teal accenting;
- occasional violet accent where useful;
- rounded cards and controls;
- subtle shadows rather than heavy borders;
- generous spacing;
- strong typographic hierarchy;
- compact, professional status feedback.

Examples from the current Research styling intentionally remap older generic status palettes:

- green/emerald success surfaces → soft cyan/teal family;
- amber/orange warning surfaces → restrained violet family;
- blue/sky info surfaces → cyan family;
- red/rose remains reserved for true destructive/error contexts and is visually softened.

A teal used repeatedly in the Research UI is around `#0e7490`; violet action/warning remapping has used around `#7c3aed`.

These are not a complete token system. Prefer the current code/design tokens over hardcoding new one-off colors.

## Avoid generic “AI dashboard” patterns

A repeated product preference is to avoid UI that looks auto-generated:

- giant red/green alert cards;
- excessive gradients;
- arbitrary glassmorphism everywhere;
- icon-filled cards without hierarchy;
- every action in a colored pill;
- redundant explanatory copy.

Feedback should be subtle and product-like. Inline status rows, restrained banners, small badges, and contextual messaging are preferred.

## One capable interface

Do not create separate Beginner/Advanced modes.

Instead:

- expose simple defaults;
- keep common actions obvious;
- use expandable panels/drawers/popovers for advanced controls;
- provide visual guides/manuals;
- preserve scientific controls without making the page intimidating.

## Navigation

Research sidebar labels should be clear domain terms, not internal phase names.

Current important Research navigation includes **Thesis Builder** (not “Writing Workspace”).

## Collapsible work areas

Professional Notes inspired the collapsible-navigator pattern used in Thesis Builder.

When a user is actively writing/working:

- side navigators should be collapsible;
- controls should remain accessible;
- focus/full-screen modes should reclaim space rather than simply hiding labels;
- sticky controls should prevent long documents from forcing constant scroll-to-top behavior.

## Documentation visuals

For Cognitive Lab and researcher education:

- prefer custom illustrations of task mechanisms and UI concepts;
- avoid embedding screenshots of entire application pages as the main teaching mechanism;
- explain what a participant sees and what a researcher configures.

## Accessibility/interaction

Current Research styling includes reduced-motion handling.

Interactive controls should:

- have clear hover/focus states;
- preserve keyboard behavior where possible;
- avoid menus that disappear when the pointer crosses a gap;
- avoid stealing selection/focus from contenteditable editors;
- support smaller screens when scientifically appropriate, but do not force tasks onto phones when visual validity suffers (e.g. Mental Rotation phone support is disabled by default).

## Copy style

Use concise, professional language. Avoid overly technical labels when a psychology term is clearer.

Examples:

Good: `Ready for studies`, `Participant study flow`, `Include TEST data`, `Adjusted mean pumps`, `Rotation slope (ms/degree)`.

Less desirable: internal phase labels, database jargon, or long implementation descriptions in primary UI.

---

# 14. Research workspace map

## Purpose

The Research workspace is the center of PsyLattice’s research platform. It connects reusable instruments/tasks, protocol assembly, participant administration, multimodal data, analysis, AI interpretation, and export.

## Main navigation/surfaces

Current/established Research areas include:

- Dashboard
- Studies
- Study Builder
- Questionnaire Library
- Cognitive Lab
- Thesis Builder
- Ambulatory Assessment
- Follow-up Manager
- Participants
- Participant Links
- Data Dashboard
- Data Explorer
- Export Data

Additional research capabilities are embedded inside these surfaces rather than always appearing as standalone nav items, including:

- Study Analysis
- Study Associations
- quality review
- Visual Export Center
- saved analysis samples
- Research AI Assistant
- cognitive-task-specific dashboards
- battery reporting

## Study lifecycle

A typical lifecycle should be:

1. Create/select questionnaires and cognitive tasks.
2. Configure demographics, consent, ambulatory/follow-up components.
3. Assemble the participant flow.
4. Preview/pilot individual cognitive tasks and/or entire batteries.
5. Publish/launch participant links.
6. Monitor participation.
7. Review quality/data completeness.
8. Analyse and export.

## Studies vs reusable assets

Study Builder should not own the canonical definition of a reusable cognitive task or questionnaire.

It stores/pins the versions and study-specific administration metadata.

This makes it possible for the same task to be reused across studies while preserving reproducibility.

## TEST data

Research/Data surfaces often have an explicit **Include TEST data** option.

Keep test/pilot data isolated from production analysis by default. Do not silently include test runs in research summaries or exports.

## Participant identifiers

Research exports support pseudonymous modes and, where deliberately requested, direct identifiers with confirmation.

Default toward pseudonymous handling. Direct identifiers should require an explicit researcher choice/confirmation.

## Ambulatory research

The Research page contains real ambulatory research summaries based on participant records, with metrics such as:

- participants;
- scheduled prompts;
- completed/missed prompts;
- scheduled compliance percent;
- completed check-ins;
- event check-ins;
- median response latency;
- configurable recent-day windows.

An RPC observed in the current Research page is `psylattice_research_ambulatory_summary`.

## Large Research page

The Research workspace currently concentrates a lot of logic in `app/researcher/page.tsx`.

When modifying it:

- use the current repository file;
- patch only the required sections;
- do not replace it from a historical phase ZIP;
- run a full build after substantial changes;
- watch for TypeScript cascades caused by a missing imported helper.

A previous missing/unresolved `batteryReporting` helper made hundreds of callback parameters appear as implicit `any`. The correct fix was restoring the typed dependency, not adding `any` everywhere.

---

# 15. Study Builder, questionnaires, ambulatory assessment, and follow-ups

## Core Study Builder principle: true cross-type ordering

Researchers must be able to reposition study elements in the actual participant flow across types.

Supported intended patterns include:

`questionnaire → cognitive task → questionnaire → demographics → cognitive task`

and, as the product grows:

`consent → demographics → questionnaire → battery/task → EMA → follow-up`.

Do not rebuild the Study Builder as separate immutable “questionnaire section” and “cognitive section” timelines.

## Consent

PsyLattice-controlled consent, when enabled, should remain before research data collection. In the participant flow UI it has been treated as a locked first element.

Consent metadata should be included in complete exports where appropriate.

## Repeated instruments

The same questionnaire or cognitive task may be added more than once if the research design requires repeated administration.

Do not globally deduplicate by task/questionnaire ID in Study Flow.

## Published task requirement

Study Builder should only add a cognitive task as study-ready when it has a published/tested version. Existing UI messaging uses language such as:

`Open Cognitive Lab and mark a tested version Ready for studies first.`

Study attachments pin the published version ID.

## Questionnaire Library

Questionnaire entries should include, where licensing permits:

- clear instructions for use;
- measure description/domain;
- scoring information;
- manual access;
- official source/download link;
- licensing/copyright caveats;
- version information.

Do not scrape/rehost copyrighted questionnaires merely because the text is available online. The platform should distinguish public-domain/permitted instruments from restricted materials.

## Ambulatory/ESM

Researchers need to configure:

- number of prompts/check-ins per day;
- editable prompt times;
- time-contingent schedules;
- event-contingent check-ins;
- duration;
- enabled/disabled protocol state;
- question content;
- longitudinal participant delivery.

The product should keep the design approachable while allowing researchers to edit timings directly.

## Follow-ups

Native mobile push was deferred. Follow-up delivery is currently email-based. Do not build assumptions that a push channel always exists.

A unified notification layer is planned later across studies, Self, Clinical, appointments, messaging, and mobile.

## Cognitive batteries inside Study Builder

Published batteries can be added in two modes:

### Add as Battery

- preserves the battery as one logical Study Flow unit;
- child task attachments remain ordinary pinned cognitive task attachments;
- immutable battery metadata is stored with the study attachments;
- questionnaires/demographics should not be moved between preserved battery children;
- participant task order can be fixed/randomized/counterbalanced depending on battery configuration.

### Expand into Study Flow

- converts the battery to ordinary individual cognitive study elements;
- preserves provenance metadata about the source battery;
- allows interleaving questionnaires, demographics, etc. between former battery tasks.

This distinction is important and should remain explicit.

---

# 16. Cognitive Lab and task engines

## Cognitive Lab mission

Cognitive Lab aims to let psychologists build/use browser-based cognitive experiments with much less technical overhead than coding-heavy tools, while preserving scientific configuration, timing diagnostics, raw trial data, and reproducibility.

The product should be simpler than PsychoPy-like workflows without pretending experimental design is trivial.

## UI model

Cognitive Lab includes concepts such as:

- Overview/Learn
- Task Templates
- My Cognitive Tasks
- Batteries
- Pilot Sessions
- task builder
- browser Preview
- published/versioned tasks

Avoid a Beginner/Advanced split. Use task-specific setup panels for paradigms that require them.

## Generic task family

The library has included browser-runner tasks around:

- simple reaction time;
- Go/No-Go;
- Flanker;
- Stroop;
- N-back;
- PVT;
- SART;
- Posner/spatial cueing;
- Visual Search;
- Sternberg memory;
- AX-CPT;
- Task Switching;
- Lexical Decision;
- and other reusable classic structures.

The exact current template catalogue should be read from Supabase/current code rather than hardcoded from this document.

## Dedicated task engines

Several paradigms required task-specific runtime/scoring rather than being forced into a generic trial-table abstraction.

### Stop-Signal

Dedicated runtime built before Corsi/Card Sorting/BART/Mental Rotation. Preserve its task-specific SSRT/scoring workflow and timing diagnostics. Do not replace with a generic Go/No-Go approximation.

### Corsi Block Tapping

Dedicated sequential spatial-memory runtime with task-specific span/sequence outcomes and Research/Data integration.

### PsyLattice Card Sorting

Important naming/scientific boundary:

- This is an **original PsyLattice WCST-style card sorting paradigm**.
- It is **not** the official/proprietary standardized Wisconsin Card Sorting Test.
- Do not reproduce proprietary decks/order/ambiguity rules/Heaton scoring/norms.
- PsyLattice uses transparent scoring definitions.
- A key perseverative error definition used in the PsyLattice implementation is an incorrect response after a rule change that matches the immediately previous rule.
- Research UI/AI/export should explicitly avoid calling the scores official WCST scores.

### BART

Runtime engine: `psylattice_bart_v1`.

Typical default protocol from the implemented template:

- 30 balloons;
- maximum 64 pumps;
- seeded hidden explosion threshold in configured range;
- reward per safe pump 0.05;
- starting bank 0;
- Pump / Collect decisions;
- participant never sees the explosion point.

Decision-level runtime data retains:

- balloon/decision indices;
- decision type;
- pumps before/after;
- hidden explosion point;
- explosion/cash-out state;
- temporary reward before/after;
- bank before/after;
- latency;
- timeout;
- normal timing diagnostics.

Key stored summary metrics include:

- total/completed balloons;
- exploded balloons;
- cashed-out balloons;
- explosion rate;
- mean pumps;
- **adjusted mean pumps**;
- median pumps on non-exploded collected balloons;
- total pumps;
- final bank;
- mean decision latency;
- timed-out decisions;
- balloon summaries;
- quality flags.

**Adjusted mean pumps** is defined as the mean number of pumps on successfully cashed-out, non-exploded balloons.

No silent participant/trial exclusion.

A previous TypeScript runtime bug came from mutating a union decision variable inside an async Promise callback, causing TS2367 narrowing errors. The robust fix was for the Promise to return a typed observed response and derive the decision after `await`.

### Mental Rotation

Runtime/scoring system: `psylattice_mental_rotation_v1`.

It is an image-based task using original PsyLattice-generated asymmetric/chiral block-object stimuli, not a commercial Vandenberg & Kuse item set.

Current system/template characteristics include:

- Practice + Experimental + Complete dedicated blocks;
- default 8 practice trials;
- default 60 experimental trials;
- angular disparities such as 0°, 45°, 90°, 135°, 180°;
- Same vs Mirrored judgments;
- seeded balanced trial generation;
- original SVG/polycube-like generator;
- desktop/laptop recommended, tablet supported, phone disabled by default.

Stored outputs include:

- overall accuracy;
- Same accuracy;
- Mirrored accuracy;
- mean/median correct RT;
- accuracy/RT by angle;
- rotation slope in ms/degree;
- raw shape ID/cell definitions;
- relation/mirror state;
- angular disparity;
- response/correctness/latency/timeouts;
- quality flags.

The rotation slope is deterministic and stored. Research AI should interpret the stored value rather than recomputing it from raw trials.

A critical runtime regression once caused Mental Rotation to fall into a generic zero-trial practice block and immediately show `Practice complete — 100%` with `0/—`. Dedicated runtime detection was hardened to prevent this fallback. Do not reintroduce single-marker routing that allows a dedicated empty block to be treated as a generic task.

## Preview vs live Study behavior

Preview is for researcher verification and may show task summaries.

Live participant Study runtime should not show research-performance summaries unless the protocol explicitly requires participant feedback. This boundary was intentionally preserved for Card Sorting, BART, Mental Rotation, and other research tasks.

## Pilot links

Cognitive pilot links have been designed around immutable definition snapshots so later task edits do not silently alter an already-shared pilot.

Keep that reproducibility principle.

## Next candidate cognitive expansion

After the dedicated backlog and Battery Builder were completed, **Probabilistic Reversal Learning** was identified as a strong next new paradigm because it adds probabilistic learning/reversal, perseveration, win-stay/lose-shift, learning curves, and computational-model-ready trial histories.

It was not pursued immediately because Battery Builder and then Thesis Builder became higher priorities.

---

# 17. Cognitive Battery Builder and execution

## Why batteries exist

Once Cognitive Lab had enough meaningful tasks, reusable batteries became more valuable than simply adding more paradigms.

A battery is a reusable, versioned package of cognitive tasks, for example:

**Executive Function Battery**

- Stroop
- Stop-Signal
- Corsi
- Card Sorting
- Mental Rotation

The battery owns orchestration, not task scoring.

## Battery Builder (2L)

Core behaviors:

- create reusable batteries;
- add only tasks that are Ready for studies/published;
- pin exact cognitive task versions;
- reorder tasks;
- use a task more than once;
- mark tasks required/optional;
- configure participant-facing transitions;
- configure breaks such as 30 sec / 1 min / 2 min / 5 min;
- estimate duration;
- fixed/randomized/counterbalanced order;
- Latin Square / Balanced Latin Square strategies;
- participant introduction;
- Task X of Y progress;
- save editable draft;
- mark battery Ready for studies;
- freeze/publish immutable battery versions;
- create a new editable version later without altering the published one.

Database concepts include:

- `cognitive_batteries`
- `cognitive_battery_versions`
- `cognitive_battery_items`

A real migration bug occurred because table RLS policies existed but authenticated table grants were missing. A permissions fix added grants. The later 2M migration reapplied the grants idempotently.

## Battery execution (2M)

Principle:

**Battery = orchestration layer.**

Each child task still creates normal `cognitive_task_sessions` and `cognitive_trial_results`. Do not create a parallel score/raw-trial silo for battery execution.

### Whole-battery Preview

From Cognitive Lab, a researcher can preview the battery end to end:

- participant intro;
- Task X of Y progress;
- transition screens;
- actual existing task Preview runtime;
- configured breaks;
- one battery-complete screen.

Preview uses the configured listed order. Participant-specific randomization/counterbalancing only has scientific meaning in a real Study session and is assigned there.

### Study Builder modes

#### Add as Battery

The group remains indivisible in Study Flow. Study attachments retain battery metadata such as:

- group key;
- battery ID/version;
- battery title/version label;
- battery item ID/position;
- order mode;
- counterbalance strategy;
- participant intro;
- transition/break config;
- estimated duration.

#### Expand into Study Flow

Creates ordinary study cognitive items and records provenance metadata (`expanded_from_battery` style metadata). Researchers can interleave other study elements afterward.

### Participant assignment

The 2M migration adds `cognitive_battery_assignments`.

One row represents one participant-session assignment for one preserved battery in one study.

Stored metadata includes:

- participant session;
- study;
- battery group key;
- battery/version identity;
- order mode;
- counterbalance strategy;
- assigned counterbalance row;
- ordered stable battery item IDs.

Participants do not receive broad direct write permission; assignment is created through the public Study flow/security-definer path.

Randomized order is deterministic/reproducible for the participant/session and stored. Reload/resume must not reshuffle.

Latin-square assignment rotates rows. Balanced Latin Square uses a Williams-style ordering, with the additional reversed cycle for odd-sized batteries. Assignment is round-robin with locking to avoid concurrent participants consuming the same next row.

## Battery reporting (2N)

Battery reporting adds orchestration metadata to Research/Data without duplicating child task scores.

Research surfaces include:

- assigned participant count;
- completed battery count;
- completion rate;
- median battery duration;
- participant-specific assigned order;
- fixed/randomized/counterbalanced order review;
- task-completion matrix;
- battery start/end timestamps;
- descriptive order-pattern diagnostics.

Data Explorer/export datasets include concepts such as:

- Cognitive battery summaries — participant level;
- Cognitive battery task completion matrix;
- Cognitive battery assignments — raw order data;
- Cognitive battery order diagnostics — descriptive.

Excel complete exports add sheets such as:

- `Battery_Summary`
- `Battery_Task_Matrix`
- `Battery_Order_Review`
- `Battery_Assignments_RAW`

## Interpretation caution

Differences between performance in task positions/order patterns are descriptive unless a proper inferential design supports causal/statistical claims.

Research AI was explicitly instructed not to overclaim order effects.

---

# 18. Research data, analysis, export, and Research AI

## Export is a priority

A major product decision is to prioritize a powerful, trustworthy export system before endlessly expanding advanced statistics.

PsyLattice must support both:

1. clean, researcher-friendly, analysis-ready outputs; and
2. complete lossless raw data.

Never optimize the clean workbook by discarding data needed for reproducibility.

## Data sources expected in complete research export

As applicable:

- participants/session metadata;
- questionnaires and items;
- cognitive task session summaries;
- cognitive raw trials/decisions;
- demographics;
- consent metadata;
- ambulatory/EMA check-ins;
- scheduled prompt/compliance data;
- event-contingent records;
- follow-ups;
- timing diagnostics;
- quality flags;
- battery assignment/order metadata;
- future wearable/sensor data;
- future research modules.

## Core analysis/export concepts

Established/current surfaces include:

- Data Dashboard
- Data Explorer
- Visual Export Center
- saved analysis samples
- Study Associations
- quality review
- `Analysis_Wide`
- `Analysis_Compatible`
- `Variable_Map`
- `Codebook`
- import guidance
- complete/clean/raw/statistics-friendly XLSX presets

The current visual export presets have included concepts such as:

- **Complete research archive** — clean analysis + complete raw observations + documentation;
- **Thesis / analysis workbook** — practical participant-level and summary data without huge raw tables;
- **SPSS · jamovi · JASP** — compact one-row-per-participant analysis file with mappings/codebook/import guide.

Exports have supported XLSX plus other formats such as CSV/JSON in parts of the Research UI.

## Identity handling

Pseudonymous export should be the default research-friendly mode.

Direct identifiers, if available, should require an explicit opt-in/confirmation.

## Study Associations

There should be one reusable association engine, not a new correlation engine per cognitive task.

Numeric variables added to `Analysis_Wide` automatically become candidates for researcher-selected associations (e.g. Pearson/Spearman) where appropriate.

Examples that motivated the design:

- BART adjusted pumps ↔ questionnaire risk/impulsivity score;
- BART ↔ Stop-Signal SSRT;
- BART ↔ Card Sorting perseveration;
- BART ↔ Corsi span;
- Mental Rotation slope ↔ Corsi span;
- Mental Rotation accuracy ↔ questionnaire score.

## BART Research integration

Dedicated BART data surfaces include:

- participant-level summaries;
- raw pump/collect decisions;
- balloon-position risk profile;
- deterministic quality flags;
- `BART_Summary`;
- `BART_Decisions_RAW`;
- stable Analysis_Wide variables such as adjusted mean pumps, explosion rate, final bank, latency, timeouts.

Because BART is stateful/repeated risk/reward behavior, the generic two-condition RT comparison UI is not appropriate and was suppressed for BART.

## Mental Rotation Research integration

Dedicated Mental Rotation data surfaces include:

- participant summary;
- angle-by-angle accuracy/RT;
- stored rotation slope;
- recent trial review;
- raw image-comparison trial data;
- `MentalRotation_Summary`;
- `MentalRotation_Trials_RAW`;
- Analysis_Wide variables for accuracy, RT, slope, timeouts.

## Quality review philosophy

Quality flags can identify:

- incomplete administrations;
- timeouts;
- implausible/very fast responding;
- extreme failure patterns;
- insufficient data for a metric;
- paradigm-specific review conditions.

But:

**No automatic exclusion by default.**

The researcher decides exclusion according to their preregistration/protocol/analysis plan.

## AI Research Assistant

AI should receive structured study context and stored results.

For task-specific deterministic summaries:

- stored values are authoritative;
- AI may explain them;
- AI may compare/interpret them in study context;
- AI should not silently recompute them from raw rows;
- AI should not invent norms/cutoffs;
- AI should state limitations and distinguish descriptive from inferential claims.

This is especially explicit for Card Sorting, BART, and Mental Rotation.

## Future analysis direction

Add statistical capability where it meaningfully helps psychologists, but do not turn PsyLattice into an opaque auto-statistics engine that hides raw data, assumptions, or scoring definitions.

---

# 19. Thesis Builder - current functional specification

## Name and placement

The Research navigation item is **Thesis Builder**.

It was initially prototyped as “Writing Workspace” and later renamed. Do not revert the visible product name.

## Purpose

Thesis Builder is intended as a professional research-paper workspace inside PsyLattice, borrowing the clean collapsible-navigation feel of Clinical Professional Notes but with much richer document editing.

It combines:

- visual research filing;
- Word-like editing;
- academic format guidance/restructuring;
- import/export;
- tables/images;
- AI writing assistance with explicit document access control.

## Database model

Core tables created in Research Writing 1A:

### `research_writing_folders`

Owner-scoped hierarchical folders:

- `owner_user_id`
- `parent_folder_id`
- `name`
- `position`
- timestamps

Folder validation prevents self/descendant cycles and cross-owner parenting.

### `research_writing_documents`

Owner-scoped documents:

- `folder_id`
- title;
- document type;
- format style;
- `content_html`;
- `content_text`;
- `editor_settings` JSONB;
- pinned state;
- timestamps.

Format style support was later expanded to include `freeform` through the 1H migration.

### `research_writing_revisions`

Owner/document-scoped snapshots containing title/content/format/settings and revision reason.

RLS is enabled and authenticated grants are explicit.

## Visual filing system

Requirements implemented/evolved:

- folders within folders, recursively;
- create/rename/delete/move/select folders;
- visual tree with expand/collapse;
- documents may be unfiled;
- deleting a folder should not necessarily destroy contained papers; product behavior was designed so papers can become Unfiled rather than vanish;
- document search;
- pinned documents;
- the folder navigator is collapsible;
- when open, the navigator should remain sticky while the paper scrolls;
- the Research Files column uses a continuous soft-grey background through its full visible height, including empty space below content.

## Focus mode

Collapsing Files is a paper focus mode:

- large Thesis Builder introductory header is hidden;
- editor reclaims horizontal space;
- `› Files` restores the navigator;
- bottom zoom control appears;
- typical zoom range is 60%–160% in 10% increments;
- entering focus mode uses at least about 110% unless the user already chose a larger value.

## Full-screen mode

Full screen is separate from Files collapse.

It should:

- take Thesis Builder over the full browser viewport;
- hide/cover the normal Research page chrome/side navigation;
- preserve the internal Files panel option;
- preserve sticky editor controls, AI, zoom, tables, images, import/export, pagination;
- support `Esc` to exit;
- allow full screen + Files open or full screen + Files collapsed.

## Paged editor

The editor should look/behave like a document, not an infinitely elongating contenteditable sheet.

Implemented intent:

- visible page cards;
- page gaps;
- labels such as Page 1 of N;
- A4/Letter dimensions;
- page stack remains visible while scrolling;
- pagination responds to font/spacing/page/margins/content;
- block-aware pagination is acceptable, though extremely large unbreakable blocks may require future line-level refinement.

## Sticky editing controls

The document title/actions and main Word-style formatting toolbar should remain sticky while pages scroll.

Import/Export used to be a separate sticky bar. That was intentionally removed; **Import** and **Export** now belong inside the main sticky toolbar to save vertical space.

## Manual Save only — no autosave

This was an explicit correction.

Current desired behavior:

- editing changes local editor state;
- database document is updated only when the user presses **Save**;
- reopening/reloading without saving should restore the last saved state;
- warn when navigating away/reloading/switching papers with unsaved edits;
- Save control visibly indicates dirty/saved state.

**Do not reintroduce an autosave timer.**

## Free form mode

**Free form · Design it yourself** is the default for new documents and imports.

Free form must not silently inherit academic layout assumptions.

Current intended defaults:

- 0 in top/right/bottom/left margins;
- 1.0 line spacing;
- 0 first-line indent;
- researcher manually controls layout.

Academic presets may set recommended defaults, but users can still override layout controls afterward.

## Academic format presets

Current preset list:

- Free form · Design it yourself
- APA 7 · Student paper
- APA 7 · Professional paper
- MLA 9 · Research paper
- Chicago / Turabian · Academic paper
- IEEE · Conference manuscript
- Custom / institution-specific

Applying an academic format can adjust typography/layout and may offer restructuring of existing content into a typical paper section structure.

The restructuring assistant must not invent missing methods, results, statistics, references, or facts. Use placeholders when information is absent.

A recovery revision should be saved before destructive/structural AI transformations.

## Format Guide drawer

A side guide explains the selected style:

- layout;
- common section order;
- margins;
- fonts/sizing;
- spacing;
- paragraph rules;
- cautions;
- official/reference links where available.

The UI should remind researchers that journal/university/department/supervisor/conference-specific instructions override a generic preset.

## Interactive margins

Margins are first-class editor settings in **all** modes.

The toolbar has a Margins control with independent:

- Top
- Right
- Bottom
- Left

Current intended range is roughly 0–3.5 inches per side, with slider and exact numeric control.

Quick options include concepts such as:

- All 0"
- All 0.5"
- All 0.75"
- All 1"
- Reset to preset

While editing margins, a dashed cyan writable-area guide may be shown on the paper.

Changing margins must repaginate live and must also flow through PDF/Word export settings.

## Formatting toolbar

Word-like controls include:

- format preset;
- margins;
- font family;
- font size;
- paragraph/heading style;
- bold;
- italic;
- underline;
- strike-through;
- text color;
- highlight;
- alignment/justify;
- bullets/numbering;
- indent/outdent;
- line spacing;
- links/unlink;
- tables;
- paragraph/control actions;
- undo/redo;
- clear formatting;
- Import;
- Export;
- image controls.

### Critical selection/focus bug fixes

Raw native controls caused selected text to collapse when the toolbar stole focus.

Already fixed:

- Text color palette;
- Highlight palette;
- Font size.

The fix pattern is:

1. save the active browser `Range` while the selection is inside the editor;
2. do not let toolbar mouse-down collapse the selection;
3. keep custom popovers open during interaction;
4. restore the exact saved Range before applying the command;
5. for native custom-color UI, preserve Range and suppress destructive blur/repagination until the command is applied.

**Do not replace these with raw `<input type="color">` or a native `<select>` that steals focus.**

## Import existing work

Import lives in the main toolbar.

Supported implemented formats:

- DOCX (via `mammoth`);
- HTML;
- Markdown;
- TXT.

Import workflow allows choosing:

- local file;
- resulting title;
- destination folder.

Imported content becomes an editable Thesis Builder document, not merely an attachment.

Imported documents default to Free form so PsyLattice does not unexpectedly reformat existing work.

## Export

Export lives in the main toolbar.

Implemented options include:

- PDF;
- Microsoft Word `.docx`;
- US Letter;
- A4;
- option to apply export paper size to the live editor.

Packages installed for these features include:

- `mammoth`
- `html2pdf.js`
- `html-docx-js-typescript`

Export should preserve the current document styling/settings as faithfully as practical, including actual per-side margins, tables, images, text alignment, fonts/spacing, and page size.

## Tables

The table tool supports:

- choose rows/columns before insertion;
- editable cells;
- add/delete rows;
- add/delete columns;
- first-row header toggle;
- table width;
- interactive resize handle;
- delete table;
- select a table by clicking inside it.

## Images

Image editing has repeatedly been refined. Current intent:

- upload image;
- sensible downscaling of huge source images before embedding;
- click/select image;
- resize by slider and drag handle;
- left/center/right positioning where relevant;
- drag image to reposition;
- delete image from selected-image controls;
- preserve selected wrap mode.

Wrap modes include:

- In line with text;
- Square;
- Tight;
- Through;
- Top & bottom;
- Behind text;
- In front of text.

Drag behavior differs by wrap type:

- flow-like modes (Inline/Square/Tight/Through/Top & bottom): dragging relocates the image to the nearest text/document-flow position while preserving wrapping;
- Behind/In front: image can be freely positioned on the paper, including onto another visible page.

## Writing AI

A sticky **Writing AI** button opens a chat-like assistant and can be minimized.

### Document access consent

Current desired behavior:

- toggle defaults Off;
- when user turns **Allow AI to read current paper** On, ask permission once;
- after approval, all subsequent AI questions in that editor session may include the current document;
- turning Off immediately stops sending paper content;
- reload/leave resets permission;
- persistent visible indicator when paper access is On;
- visible notification when access is enabled/disabled.

This replaced an earlier one-request-at-a-time confirmation model.

### Realtime review

Realtime continuous document watching/warnings is **not yet enabled**. It is a future feature and should have its own explicit permission model.

### Server route

Writing AI uses its own server route (`app/api/writing-assistant/route.ts` in the implemented phase) and was configured with `store: false` in the OpenAI request path.

## Visual regression already fixed

The left Research Files background once stopped halfway down the workspace, leaving a white lower half. Current behavior requires the whole navigator column to remain the same soft grey through the visible height.

---

# 20. Self, Clinical, Android, and wearables

## Self workspace

The Self side has been developed around personal psychological support/monitoring rather than research administration.

Known major surfaces/features include:

- dashboard;
- AI guide/assistant (Luna/AI Guide naming has appeared during development);
- self-assessments;
- monitoring/check-ins;
- self-regulation tools;
- progress;
- appointments;
- messages;
- privacy/permissions.

Self-facing AI should remain supportive/non-diagnostic and should not make autonomous clinical treatment decisions.

A historical UX behavior: dashboard greeting uses local device time (morning before 12, afternoon 12–16:59, evening 17+).

## Clinical workspace

Clinical work has included:

- clients;
- appointments;
- messaging;
- assessment/monitoring access;
- clinical notes;
- Professional Notes;
- care pathways;
- access/permission management.

The Professional Notes collapsible navigator influenced Thesis Builder’s document-navigation UX.

Clinical data should be treated as highly sensitive. Support engineers should not inspect records merely because they technically can.

## Workspace/role access

An earlier explicit product constraint was a strict self/researcher/clinician sign-in/workspace split, with users not shown workspaces they are not authorized to access.

The repository later acquired account/workspace-switcher components, so **VERIFY CURRENT** role UX. Preserve the security principle even if the visual navigation has evolved: authorization should determine access, not client-side hiding alone.

## Android app

Android development advanced substantially in August 2026.

The product direction expanded from a participant companion to a broader PsyLattice app with Researcher, Participant, Clinician, and Self experiences.

Known mobile design decisions/features include:

- PsyLattice branding/theme aligned to web;
- bottom navigation refinements;
- dedicated AI Guide route;
- Research workspace features;
- participant pairing/deep links;
- clinician Messages/Appointments navigation;
- PsyLattice app icon;
- APK distribution via website/Drive rather than initial Play Store dependency.

## Wearables / Health Connect

Android wearable ingestion is based on **Health Connect**.

Permissions/planned data include:

- heart rate;
- steps;
- sleep;
- exercise;
- background reads where permitted.

Design principle: the wearable/device should connect through Health Connect rather than requiring one proprietary tracker integration for every device.

Raw wearable data storage economics were considered; summarized data was accepted as a practical direction for some ongoing use cases, while research requirements still need enough detail for the intended analyses.

## Push notifications

Native push notifications were intentionally deferred.

Current/near-term follow-up delivery is email-based.

Longer-term plan: one unified notification system across Self, Clinical, appointments, studies, messages, follow-ups, and devices.

Do not assume push tokens/services are currently production-critical.

## iOS/watchOS

Apple/iOS/Apple Watch support is planned but behind Android/Health Connect in implementation maturity.

Do not represent Apple wearable support as complete unless current code/deployment verifies it.

---

# 21. Security, privacy, RLS, and data integrity

## Security posture

PsyLattice spans research, self-monitoring, and clinical workflows. Treat user records as sensitive by default.

Security is not a UI feature; it must be enforced server/database-side.

## Supabase RLS

Strict RLS is part of the core architecture.

General pattern:

- authenticated researcher-owned rows use `owner_user_id = auth.uid()`;
- participant/public routes use constrained token/session/RPC logic;
- clinical access should be derived from explicit relationships/permissions;
- system templates can have null/system ownership but must not allow arbitrary mutation.

Never disable RLS as a production “fix.”

## Grants + RLS

Both are required.

Checklist for a new table:

```text
CREATE TABLE
INDEXES / CONSTRAINTS
ENABLE RLS
CREATE POLICIES
GRANT SELECT/INSERT/UPDATE/DELETE as needed
TEST AS APP ROLE
```

The Cognitive Battery Builder permission bug is the canonical reminder: owner RLS policies were correct, but the authenticated role lacked table privileges, causing `permission denied for table cognitive_batteries`.

## Security-definer functions

Use only when a public/participant workflow genuinely requires controlled privileged operations.

Functions should:

- use a safe search_path;
- validate `auth.uid()` or participant/session token context;
- verify IDs belong to the current study/user;
- avoid user-controlled dynamic SQL;
- return the minimum necessary data.

## Secrets

Never place in client code, Git, or AI context:

- Supabase service-role key;
- OpenAI key;
- Vercel/Render deploy token;
- database password;
- JWT signing secret;
- OAuth secret;
- SMTP/API mail secret;
- password reset tokens;
- production webhook secrets.

Public Supabase anon keys may be client-visible by design, but service-role keys are never client-visible.

## AI document/data privacy

### Thesis Builder

Writing AI may read the current paper only after explicit user permission via the editor toggle.

Turning access on is a conscious event and should be visibly indicated. Turning it off must stop paper transmission.

Do not silently send a paper merely because the AI panel is open.

### Research AI

Research AI should receive the study/data needed for the requested analysis, not indiscriminately all direct identifiers.

### Clinical/Self

Minimize sensitive context. Do not log full clinical notes or private self-assessment content in debug logs unless absolutely necessary and explicitly controlled.

## Direct identifiers in export

Pseudonymous export is the safe default.

Direct identifiers should require explicit researcher confirmation and should not be included in broad analysis exports accidentally.

## Production support

The support engineer must use least privilege.

Never:

- ask a user to send a password;
- view a user’s private notes/paper/clinical data simply to prove access;
- edit a participant’s research response to resolve a UI issue;
- share screenshots containing participant identities in public tickets;
- copy production records into ChatGPT without sanitization.

When reproducing bugs, use test accounts/test studies whenever possible.

## Regulatory/compliance direction

Earlier architecture planning emphasized EU hosting/security review before using real health/clinical data at scale. Treat privacy/compliance as an ongoing product requirement rather than assuming the current implementation alone satisfies every jurisdiction.

Do not make unsupported compliance claims such as “HIPAA compliant” or “GDPR compliant” without formal review/evidence.

---

# 22. Operations and user-support runbook

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

---

# 23. Development, testing, deployment, and release workflow

## Local runtime

PsyLattice was upgraded to **Node 24 LTS** on 2026-09-01.

Recommended:

```bash
nvm use
node -v
npm -v
npm ci
npm run dev
```

`.nvmrc` should contain:

```text
24
```

Before deployment:

```bash
npm run build
```

## Why Node 24 matters

Before the upgrade the local machine was on Node 20.12.2 and npm showed `EBADENGINE` warnings for modern Supabase/OpenAI/eslint dependencies requiring newer runtimes.

Do not downgrade Node casually.

## Dependency installation

Use `npm ci` for a clean lockfile-respecting install in reproducible environments.

Do not delete `package-lock.json` without a deliberate dependency update plan.

Avoid:

```bash
npm audit fix --force
```

as a reflex. It may introduce breaking upgrades. Inspect advisories and update intentionally.

## Thesis Builder document dependencies

The import/export work introduced packages including:

- `mammoth`
- `html2pdf.js`
- `html-docx-js-typescript`

There is/was a local TypeScript declaration helper for these import/export dependencies. Confirm current package/type configuration before removing it.

## Git discipline

Typical branch in recent development: `main`.

Recommended change flow for the new engineer:

1. pull latest;
2. `nvm use`;
3. `npm ci` when lockfile changed or environment is fresh;
4. create a branch for nontrivial work;
5. patch current files;
6. run local tests;
7. run `npm run build`;
8. review migration/security impact;
9. commit with a meaningful message;
10. PR/review or approved push process;
11. verify Vercel/Render logs after deploy.

## Vercel

The web app is deployed on Vercel.

Ensure the production/preview runtime uses a compatible Node version (Node 24 target) so local and deployed behavior are not unnecessarily different.

Do not expose secrets as `NEXT_PUBLIC_*` unless they are genuinely intended to be public.

## Render/FastAPI

A FastAPI backend on Render was part of the established architecture.

Before operations:

- verify current Render service name/URL;
- verify which frontend/API routes still call it;
- verify Python/runtime/dependencies;
- verify health checks/logs;
- do not delete the service because Next.js now has some API routes.

## Database migration discipline

Migrations should be:

- idempotent where feasible;
- explicit about prerequisites;
- safe for existing researcher-owned rows;
- tested in development/staging;
- accompanied by grants/RLS;
- reviewed for destructive statements.

System-template migrations often use fixed IDs and `ON CONFLICT` metadata refresh while preserving immutable published versions.

## Test routes/modes

Use:

- Cognitive Preview;
- cognitive pilot links;
- TEST Study participant links;
- `Include TEST data` in Research Data;
- local dummy/test users.

Do not verify a new task only by checking that the Builder renders; test participant runtime and stored data.

## TypeScript diagnostics

A syntax-only transpile is not enough for TypeScript semantics.

Past examples:

- BART code was syntactically valid but had TS2367 narrowing errors;
- missing helper imports produced hundreds of downstream implicit-any problems.

Use the real project type/build pipeline before calling a phase complete.

---

# 24. Deferred features and explicit non-goals

## Research collaboration / Team & Permissions

**Deferred.**

Reason: the collaborator workflow on the website was not functional enough. The Android Research workspace was intentionally kept without the planned team-permissions phase/migration.

Do not add/re-run the old planned collaborator/team migration until the web collaboration product is explicitly restarted and designed end to end.

## Native push notifications

**Deferred.**

Current follow-up delivery is email-based.

Longer-term vision is a unified cross-device notification system for:

- studies/follow-ups;
- Self;
- Clinical;
- appointments;
- messages;
- other future workflows.

Do not create fragmented push systems per feature unless the notification architecture is intentionally restarted.

## iOS / Apple Watch

Planned, not the current primary wearable platform. Do not claim feature parity with Android/Health Connect unless verified in current code.

## Beginner vs Advanced mode

Explicitly rejected for Cognitive Lab and similar research tooling.

## Official WCST implementation

Not a goal. PsyLattice Card Sorting must remain clearly an original WCST-style paradigm unless the company later obtains rights and deliberately builds a licensed standardized product.

## Automatic AI scoring of cognitive tasks

Not a goal. AI should not replace deterministic scoring.

## Automatic exclusion from quality flags

Not a default behavior. Quality review remains researcher-controlled.

## Silent AI access to papers

Not acceptable. Thesis Builder document access is permission-gated.

## Thesis Builder autosave

Explicitly removed. Do not re-add without a new product decision.

## Realtime AI paper review

Planned concept, not yet enabled. It should require its own transparent permission model and visible warnings/suggestions.

## Huge advanced-statistics suite before export maturity

Not the preferred priority. Keep exports, clean/raw data, codebooks, and reproducibility strong first.

## Payment gateway

Planned later. Pricing logic/product copy can exist before the final gateway. Mobile may redirect to web.

## Play Store dependency

Initial Android distribution did not need to wait for Play Store; APK/web distribution was acceptable during development.

---

# 25. Decision history - why the system is this way

This is not every commit. It records product/architecture decisions whose rationale matters.

## Early August 2026 — platform structure

- One PsyLattice product with Self, Research, Clinical workspaces.
- Supabase Auth/Postgres/RLS/Storage central to the data layer.
- Web frontend on Vercel.
- Server-side AI.
- Role/workspace boundaries important.
- Research should support questionnaire library, Study Builder, ambulatory/EMA, participant workflows, exports/codebooks.
- AI should not diagnose/treat autonomously.

## August 2026 — Research Study Builder

- Cross-type ordering became a hard requirement: researchers can reorder questionnaire/cognitive/demographic elements in actual participant sequence.
- Questionnaire library must include usage instructions/manual/official links where licensing permits.
- First study free; paid use from later studies.
- Export quality prioritized over prematurely adding advanced statistics.

## August 2026 — Android/mobile

- Android device used for development/testing.
- Health Connect selected for wearable integration.
- App scope expanded across Research/Participant/Clinical/Self.
- Native push deferred; email follow-ups retained.
- Collaboration/team permissions deferred because web workflow not ready.

## Late August 2026 — Cognitive Lab

Progression of dedicated paradigms:

- Stop-Signal;
- Corsi runtime + Data/Analysis;
- PsyLattice Card Sorting runtime + Data/Analysis;
- BART runtime + Data/Analysis;
- Mental Rotation runtime + Data/Analysis.

Important direction: dedicated tasks use task-specific engines/scoring instead of being forced into a generic RT builder.

## BART

- deterministic seeded explosion schedule;
- adjusted mean pumps defined transparently;
- participant live Study does not display research performance summary;
- BART data plugged into existing Study Associations rather than creating a new analysis engine.

## Mental Rotation

- original PsyLattice-generated stimuli rather than copyrighted commercial item sheets;
- dedicated image runtime;
- stored deterministic RT-by-angle slope;
- generic-practice routing bug fixed after Preview incorrectly completed with zero trials.

## Cognitive Batteries

- reusable Battery Builder became a higher priority than immediately adding another cognitive task;
- battery versions pin task versions;
- Add as Battery vs Expand into Study Flow distinction;
- fixed/randomized/Latin-square/Balanced-Latin-square order;
- participant-specific assignments persist;
- battery remains orchestration only;
- battery reporting adds order/completion metadata but child task results remain authoritative.

## 2026-09-01 — Thesis Builder

Writing Workspace introduced and quickly evolved into **Thesis Builder**.

Sequence of major refinements:

- visual nested folders + rich editor + format guides + permission-gated Writing AI;
- collapsible navigator and paged paper canvas;
- session-level AI read permission instead of permission on every message;
- focus mode with zoom and sticky controls;
- import/export, table editor, image editing;
- sticky file panes and draggable/deletable images;
- Import/Export moved into main toolbar;
- true full-screen mode;
- Free form added as default;
- Node runtime modernization begun/completed;
- autosave removed; explicit Save restored as authority;
- per-side interactive margins added;
- text color/highlight selection bugs fixed with preserved ranges;
- Research Files background extended full height;
- font-size selection bug fixed with same preserved-range pattern.

## 2026-09-01 — Node runtime

- nvm installed;
- project moved to Node 24 LTS;
- `.nvmrc` created with `24`;
- clean `npm ci`/build workflow established.

## Next engineering context

A new engineer is being onboarded primarily to help maintain servers and users while also contributing to the codebase. This handoff pack exists so their AI assistant understands the project’s accumulated decisions instead of rebuilding assumptions from scratch.

---

# 26. Current state and roadmap

**Snapshot date: 2026-09-01**

This file should be updated more frequently than the historical documents.

## Current web/runtime baseline

- Node 24 LTS via nvm.
- `.nvmrc` expected to contain `24`.
- Next.js/TypeScript Research app running locally and deployed via Vercel architecture.
- Supabase remains central database/auth/RLS layer.
- Verify current FastAPI/Render usage before backend changes.

## Research workspace

Major workflow is substantially built:

- Studies/Study Builder;
- questionnaire library;
- Cognitive Lab;
- cognitive batteries;
- ambulatory assessment;
- follow-up manager;
- participants/links;
- Data Dashboard/Data Explorer/Export;
- Study Associations;
- quality review;
- Research AI;
- Thesis Builder.

## Cognitive Lab

Dedicated task runtime + research integration completed through:

- Stop-Signal;
- Corsi;
- PsyLattice Card Sorting;
- BART;
- Mental Rotation.

Cognitive Battery cycle completed:

- 2L Battery Builder;
- 2M Battery execution/Study Builder integration;
- 2N Battery reporting/export/research integration.

Candidate next new paradigm after stabilization: **Probabilistic Reversal Learning**.

## Thesis Builder

Latest development sequence reached **1L** in the ChatGPT-assisted phase naming.

Current expected features include all 1A–1L changes:

- nested visual folders;
- folder navigator full-height grey surface;
- collapsible Files/focus mode;
- full-screen mode;
- sticky file panes and editor toolbar;
- paged document canvas;
- zoom;
- Free form default;
- independent interactive margins;
- academic presets/guides;
- manual Save only;
- unsaved warning;
- revisions/recovery snapshots;
- DOCX/HTML/Markdown/TXT import;
- PDF/DOCX export;
- A4/Letter;
- tables;
- image upload/resize/drag/wrap/delete;
- Writing AI with session toggle permission;
- selection-safe color/highlight controls;
- selection-safe font-size popover.

### Current Thesis Builder non-negotiables

- No autosave.
- Free form should not inherit academic margins.
- New/imported documents default to Free form.
- User can override margins even under academic preset.
- Selected text must survive toolbar color/highlight/font-size interaction.
- AI cannot silently read a paper.
- Import/Export belong in the main toolbar, not a separate top bar.

## Mobile

Android/Health Connect work is meaningful and should be preserved. Native push/collaboration remain deferred.

## Near-term engineering priorities

For the new maintenance engineer:

1. learn production deployment/auth/RLS/support flows;
2. verify Node 24 in local and Vercel environments;
3. map active Next.js API routes vs active FastAPI endpoints;
4. document production environment variables without exposing values;
5. establish safe support/incident procedures;
6. add/strengthen automated checks for critical data and participant paths;
7. reduce large-file regression risk through incremental tests/refactors;
8. keep context pack updated.

For product development:

- stabilize Thesis Builder across Safari/Chrome and export/import edge cases;
- continue improving reliability of the unified Research flow;
- later resume new cognitive paradigms (Probabilistic Reversal Learning was the next proposed dedicated engine);
- later revisit collaboration when web design is ready;
- later build unified notifications/native push;
- later continue iOS/watchOS.

---

# 27. Known bugs, regressions, and traps

This file is especially important for AI agents. Many bugs came from replacing a current file with an older phase snapshot or from relying on browser focus behavior that looked harmless.

## 1. BART TypeScript decision narrowing

### Symptom

TS2367 errors on comparisons such as:

```ts
if (decision === "pump")
else if (decision === "cash_out")
```

### Cause

A union variable initialized as `"timeout"` was mutated inside an async Promise callback. TypeScript control-flow analysis did not treat that mutation as reliable after `await`.

### Correct pattern

Return a typed observed response from the Promise, await it, then derive the decision from the returned value.

### Do not

Cast everything to `any` or force the union with unsafe assertions.

## 2. Mental Rotation instantly completed practice

### Symptom

Preview showed `0/—` and immediately `Practice complete — Accuracy: 100%` before any trial.

### Cause

Mental Rotation fell through to the generic practice runner. The dedicated block intentionally had no generic trial-table rows, so generic code saw zero trials and treated the empty denominator as perfect accuracy.

### Fix principles

- robust dedicated-runtime detection using task/version/block identity;
- block dispatch refuses to send dedicated Mental Rotation blocks to generic runner;
- zero generic practice trials must never become 100% success.

## 3. Cognitive Battery `permission denied`

### Symptom

`permission denied for table cognitive_batteries`.

### Cause

RLS policies existed, but PostgreSQL grants to `authenticated` were missing.

### Fix

Explicit grants for battery tables; later migration reapplies them idempotently.

## 4. Massive TypeScript “Problems” cascade in Research page

### Symptom

Hundreds of implicit-any red underlines on callbacks like `report`, `state`, `group`, `row`, `itemId`.

### Cause

Typed helper dependency (`batteryReporting.ts`) missing/unresolved after a page replacement.

### Fix

Restore correct helper/import. Do not annotate every downstream callback with `any`.

## 5. Thesis Builder file navigator only grey halfway

### Symptom

Research Files column background ended after the folder/private card, leaving white empty space below.

### Fix

The full navigator column/sticky region must own the grey background/min-height, not only its content wrapper.

## 6. Thesis Builder autosave contradicted desired workflow

### Symptom

Document persisted while typing even though explicit Save behavior was desired.

### Final decision

No autosave. User explicitly presses Save. Unsaved navigation/reload warns. Last saved version is authoritative on reopen.

## 7. Free form still had academic margins

### Symptom

Free form showed inherited/default page padding despite being intended as unconstrained layout.

### Fix

Free form defaults to zero per-side margins; margin settings are explicit and persisted. Existing older Free-form docs should not silently retain a hidden global one-inch margin.

## 8. Text color/highlight selection disappeared

### Symptom

Color palette flashed/disappeared; clicking it removed selected text range.

### Cause

Raw native `<input type="color">` stole focus from the contenteditable editor; Safari made native popover behavior especially brittle.

### Fix

Selection-safe custom popovers with saved/restored browser Range; custom native color path also preserves Range and avoids destructive blur/pagination.

## 9. Font-size selector destroyed text selection

### Symptom

Selecting text and opening font-size dropdown lost selection.

### Cause

Native `<select>` stole focus.

### Fix

Selection-safe PsyLattice popover using the same saved Range system as color/highlight.

## 10. Thesis Builder separate Import/Export bar consumed space

### Decision

Import and Export belong inside the main sticky editor toolbar, not a separate top action bar.

## 11. Focus mode did not make the paper meaningfully larger

### Fix

Focus mode hides the large Thesis Builder intro card, collapses Files, reclaims width, and exposes zoom controls.

## 12. Image editor missing deletion/movement behavior

### Fix

Selected image controls include Delete image. Drag semantics depend on text-wrap mode; floating modes support free positioning, flow modes relocate through document flow.

## 13. Old phase file rollback risk

### Pattern

A phase ZIP often contains only files necessary for that phase, based on the then-current stack. Reusing it later can remove newer data/export/AI/battery/task work.

### Rule

Always patch from current Git. Historical packages are reference material only.

---

# 28. Known uncertainties - verify before changing

This file prevents the handoff pack from becoming an excuse to guess.

## Repository canonical name

Recent Git terminal output showed a remote under:

`github.com/pr15das/psylattice.git`

An older handoff called the repository `PsyLattice-Research-Platform`.

**Action:** run `git remote -v` and update this doc.

## FastAPI vs Next.js API ownership

A late-August architecture handoff describes FastAPI on Render, while the modern codebase contains multiple Next.js API routes.

**Action:** inventory frontend callers and deployment logs. Do not remove either backend path until ownership is mapped.

## Current Next.js/package versions

The current repository root `AGENTS.md` is generated by the installed Next.js 16-era runtime and explicitly warns that APIs/conventions may differ from training data. Verify the exact installed version in `package.json`/lockfile and use `node_modules/next/dist/docs/` for version-specific guidance.

**Action:** read `package.json` and lockfile for the exact current versions.

## Production Node runtime

Local runtime is Node 24 and `.nvmrc` was added.

**Action:** verify Vercel project runtime setting/build logs also use Node 24-compatible environment.

## Email provider/notification service

Email follow-ups are current product behavior, but this context pack does not contain the provider credentials/config.

**Action:** map the provider, sender domains, templates, retries, logs, and secrets through deployment configuration.

## Auth verification policy

Email verification was removed during development to simplify account creation. Current production auth settings may have evolved.

**Action:** inspect Supabase Auth settings and current sign-up code before support instructions.

## Current database migrations

This pack references historical phase migration names. The production schema may include subsequent consolidated migrations.

**Action:** inspect Supabase migration history/schema rather than rerunning phase SQL blindly.

## Mobile release status

APK/web distribution was used during development; Play Store/iOS status may change.

**Action:** verify current release channels before answering users.

## Pricing

Product decisions exist, but actual live pricing may change.

**Action:** use the production pricing page/config as source of truth for support.

## Compliance status

Privacy/security were design priorities. This pack does not prove formal regulatory certification.

**Action:** do not claim certifications/compliance without company/legal documentation.

---

# 29. Database surface map

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

---

# 30. Naming and product copy style

## Product/workspace names

Use:

- PsyLattice
- Research
- Self
- Clinical
- Cognitive Lab
- Study Builder
- Questionnaire Library
- Ambulatory Assessment
- Follow-up Manager
- Thesis Builder
- Data Dashboard
- Data Explorer
- Export Data
- Writing AI / Research AI Assistant where appropriate

Do not rename Thesis Builder back to Writing Workspace.

## Task names / scientific boundaries

Use:

- Stop-Signal Task
- Corsi Block Tapping
- PsyLattice Card Sorting
- Balloon Analogue Risk Task (BART)
- Mental Rotation Task

For Card Sorting, do not label outputs as official WCST/Heaton scoring.

For Mental Rotation, do not imply the stimuli are commercial standardized item sheets.

## User-facing status language

Preferred examples:

- Ready for studies
- Draft
- Published version
- Include TEST data
- Participant study flow
- Saved / Unsaved changes
- Allow AI to read current paper
- Free form · Design it yourself

Avoid internal phase labels such as “2J FIX2” in production UI. Phase labels are development history, not product language.

## Error/feedback tone

Be concise and actionable.

Avoid patronizing or alarmist language.

Use destructive red only when genuinely destructive/error-critical. Routine validation can be neutral/cyan/slate.

## Research-scoring language

Prefer transparent descriptive metric labels:

- Adjusted mean pumps
- Explosion rate
- Rotation slope (ms/degree)
- Mean correct RT
- Perseverative errors (with PsyLattice definition documented)

Do not present undocumented derived scores with impressive-sounding names.

---

# 31. Component and file map

This map helps a new engineer know where to look first. It is not exhaustive; use repository search for exact current ownership.

## Research root

### `app/researcher/page.tsx`

Historically/currently a very large Research workspace file containing or orchestrating substantial logic for:

- Research navigation/workspace surfaces;
- Study Builder;
- participant flow;
- cognitive task catalogue attachments;
- battery integration;
- Research Data/Data Explorer;
- export configuration;
- task-specific data panels;
- battery reporting;
- analysis and quality surfaces.

Treat this as high-regression-risk. Patch current Git; do not replace from old phase files.

## Research AI / Associations

### `components/ResearchAiAssistant.tsx`

Research-context AI layer. Has been extended progressively for Card Sorting, BART, Mental Rotation, Battery reporting, etc.

### `components/ResearchStudyAssociations.tsx`

Existing association/correlation UI/engine surface. New numeric task variables should generally plug into the current Analysis_Wide/association path rather than spawning a separate correlation feature.

## Cognitive Lab

### `components/CognitiveLab.tsx`

Cognitive catalogue/workspace shell. Contains task/battery readiness surfaces and library navigation.

### `components/CognitiveTaskBuilder.tsx`

Task definition/configuration UI. Dedicated paradigms have task-specific setup rather than only generic blocks.

### `components/CognitiveRunner.tsx`

Researcher Preview runner. Contains generic and dedicated runtimes. High regression risk because later dedicated tasks are layered into the same file.

### `components/CognitiveStudyRunner.tsx`

Live participant Study cognitive runner. Preserve difference between researcher Preview and participant output/feedback.

### `components/CognitivePilotRunner.tsx`

Pilot execution path for cognitive task definition snapshots.

### `components/CognitiveLearningHub.tsx`

Cognitive learning/docs experience. Product direction favors visual custom illustrations instead of screenshot-heavy manuals.

## Dedicated cognitive engines

Known engine files include:

- `lib/research/stopSignal.ts`
- `lib/research/corsi.ts`
- `lib/research/cardSorting.ts`
- `lib/research/bart.ts`
- `lib/research/mentalRotation.ts`

Do not move scoring logic into AI components.

## Cognitive batteries

### `components/CognitiveBatteryBuilder.tsx`

Reusable versioned battery editor.

### `components/CognitiveBatteryPreview.tsx`

Runs existing task Preview sessions sequentially for a whole-battery preview.

### `components/StudyBatteryPicker.tsx`

Study Builder picker for published battery versions and Add as Battery / Expand into flow actions.

### `lib/research/batteryReporting.ts`

Typed reporting engine used by the Research page. Missing this helper previously caused hundreds of downstream TypeScript diagnostics.

## Thesis Builder

### `components/ResearchWritingWorkspace.tsx`

Current Thesis Builder implementation. Phase-history label reached 1L during the 2026-09-01 session.

Contains:

- folders/documents;
- editor state;
- manual Save/dirty warnings;
- paged layout;
- focus/full-screen;
- margins;
- academic presets;
- import/export;
- tables/images;
- AI panel;
- selection-preserving toolbar controls.

High regression risk. Preserve the 1A→1L cumulative behavior described in `09-THESIS-BUILDER.md`.

### `app/api/writing-assistant/route.ts`

Server-side Writing AI endpoint. Document context is included only when the client’s permission state says to send it. The implemented route uses non-storage-oriented OpenAI behavior (`store: false` in the phase implementation).

### `types/thesis-builder-import-export.d.ts`

Type declarations introduced for client-side import/export packages. Verify if still necessary before removing.

## Research export

### `app/api/research/export-xlsx/route.ts`

Universal XLSX export route observed in the Research architecture. Multiple cognitive phases intentionally left this route unchanged and plugged new datasets/sheets into the existing system.

## Research operational components observed in recent repository UI

- `components/AmbulatoryProtocolBuilder.tsx`
- `components/FollowupManager.tsx`
- `components/StudyBatteryPicker.tsx`
- `components/UnifiedNotificationsCenter.tsx`

Do not assume UnifiedNotificationsCenter means native mobile push is complete; the product decision remains that native push was deferred.

## Clinical components observed

Recent component inventory included concepts such as:

- `ClinicalNotesWorkspace.tsx`
- `CarePathwayWorkspace.tsx`
- `ClientAppointmentsWorkspace.tsx`
- receptionist appointment/access components;
- messaging workspace components.

Professional Notes/Clinical Notes is an important visual precedent for Thesis Builder’s collapsible navigator.

## API route families observed

Under `app/api` recent local repository UI showed route groups including:

- media;
- messages;
- research/export-xlsx;
- research-assistant;
- writing-assistant;
- cron;
- auth-related routes elsewhere in `app`.

Inventory exact current route handlers before moving backend functionality.

---

# 32. Migration history reference

This is a development-history index, not a command to rerun every SQL file.

**Never rerun a historical migration in production merely because it appears here. Check migration history/schema first.**

## Cognitive sequence

Historical phase naming used during rapid development:

- Cognitive Phase 1A/1B/1C — foundational Cognitive Lab / visual builder / browser Preview;
- Phase 1D — pilot links/sessions with immutable definition snapshots;
- 2C — Stop-Signal data/runtime phase;
- 2D/2E — Corsi runtime then data/analysis;
- 2F/2G — PsyLattice Card Sorting runtime then data/analysis;
- 2H/2I — BART runtime then data/analysis;
- 2J/2K — Mental Rotation runtime then data/analysis;
- 2L — Battery Builder;
- Battery permission FIX1 — explicit authenticated grants;
- 2M — Battery execution, Study Builder integration, participant assignments;
- 2N — Battery data/reporting/export/AI integration (no SQL in that phase).

Known migration names from generated packages include examples such as:

- `psylattice-cognitive-library-2h-bart.sql`
- `psylattice-cognitive-library-2j-mental-rotation.sql`
- `psylattice-cognitive-2l-battery-builder.sql`
- `psylattice-cognitive-2l-battery-permissions-FIX1.sql`
- `psylattice-cognitive-2m-battery-execution.sql`
- `psylattice-cognitive-phase1d-pilot-sessions.sql`

## Thesis Builder sequence

- Research Writing 1A — folder/document/revision database + initial rich editor + Writing AI.
- 1B — collapsible Files, paged canvas, session AI permission.
- 1C — real focus mode, zoom, sticky toolbar.
- 1D — import/export, tables, pictures; new npm packages.
- 1E — sticky file panes, image drag/delete.
- 1F — Import/Export moved into main toolbar.
- 1G — true full-screen editor.
- 1H — Free form default support + DB constraint/default migration.
- 1I — autosave removed, manual Save, per-side margins, dirty warnings.
- 1J — selection-safe text color/highlight.
- 1K — full-height grey Research Files background.
- 1L — selection-safe font-size popover.

Known writing migrations:

- `psylattice-research-writing-1a.sql`
- `psylattice-thesis-builder-1h-freeform.sql`

Later 1I–1L changes were primarily component behavior and did not require new SQL in the generated phases.

## Why phase history matters

The phase number is useful to understand cumulative intent, but production code does not magically “know” phase numbers. The current repository may include subsequent edits after a generated package.

Never implement a new phase by replacing current files with the last ZIP you remember. Start from current Git and port the delta.

---

# 33. Transferring PsyLattice context to ChatGPT/Codex

PsyLattice context should not live only in one engineer's ChatGPT history. The repository should carry an AI-readable context layer.

## Files to keep in the repository

Recommended root/layout:

```text
AGENTS.md
docs/ai-context/00-START-HERE.md
docs/ai-context/01-PRODUCT-VISION.md
...
docs/ai-context/25-CONTEXT-MAINTENANCE.md
```

The previously generated **PsyLattice AI + Engineering Handoff Pack** contains these files and a single-file `MASTER_CONTEXT.md`.

## What the new engineer should do in ChatGPT/Codex

### When ChatGPT/Codex can access the repository

Give it this instruction before coding:

> You are joining the PsyLattice engineering project. Before changing code, read `AGENTS.md`, then `docs/ai-context/00-START-HERE.md`, then the context document(s) relevant to the requested subsystem. Treat current Git as the source of truth. Historical phase packages are context only. Summarize the current architecture, regression risks, data/security boundaries, and files you plan to touch before implementing anything.

Then ask it to inspect the current repository files, not to reconstruct them from memory.

### When ChatGPT cannot access the repository

Upload:

1. `MASTER_CONTEXT.md`;
2. `AGENTS.md`;
3. the current files involved in the task;
4. the specific relevant `docs/ai-context/*.md` file if more detail is needed.

Do **not** upload `.env.local`, production exports, service keys, user manuscripts, participant/clinical records, or database dumps containing real user data.

## Context precedence order

ChatGPT/Codex should follow this order:

1. **Current checked-out Git code**;
2. current database schema/migrations/deployment configuration;
3. `AGENTS.md`;
4. `docs/ai-context/*`;
5. this Engineer Onboarding Manual;
6. historical phase ZIPs/old generated files;
7. conversational memory.

If two sources disagree, verify rather than guessing.

## ChatGPT task template for safe engineering

Use prompts such as:

> Read the PsyLattice context files for this subsystem and inspect the current code. I want to change [feature]. First tell me: (1) which current files own it, (2) what later functionality could regress, (3) whether a database migration is required, (4) what security/data-science invariants must be preserved. Then make the smallest patch and give me an exact test plan.

## How to keep AI context current

After a merge that changes architecture, data contracts, scoring definitions, major UX, secrets/operations, or a deferred decision:

1. update the relevant `docs/ai-context` file;
2. update `16-CURRENT-STATE-ROADMAP.md` when state changed;
3. update `17-KNOWN-BUGS-AND-REGRESSIONS.md` for a meaningful fixed/known trap;
4. update `21-DATABASE-SURFACE-MAP.md` for schema additions;
5. update `23-COMPONENT-AND-FILE-MAP.md` for ownership moves;
6. update this manual if onboarding/operations changed.

Context documentation should be part of definition-of-done, not a one-time handoff artifact.

---

# 34. Incident response and production support

## Severity model

- **P0 / Critical:** suspected data breach, exposed server secret, destructive database event, widespread production outage, corrupted research data.
- **P1 / High:** login failure for many users, public study unable to save, email worker broadly failing, production deployment broken.
- **P2 / Medium:** one user's feature fails, one study configuration issue, export/report issue with workaround.
- **P3 / Low:** cosmetic bug, confusing copy, non-blocking UX defect.

## Incident record

For every P0/P1 and meaningful P2, record:

- timestamp/timezone;
- affected environment;
- sanitized user/study/pseudonymous IDs;
- visible error/status code;
- deployment commit;
- root cause;
- corrective action;
- data affected/not affected;
- follow-up prevention item.

Never include passwords, API keys, full participant responses, clinical notes, or manuscript content unless absolutely required and approved.

## Useful production checks

### Build/deployment

- Vercel latest Production deployment commit;
- Vercel build/runtime logs;
- Node version/build settings;
- environment variable presence/scope.

### Supabase

- Auth user status;
- RLS policy/grant;
- row ownership;
- RPC function and migration version;
- storage object/bucket permissions;
- recent logs/error messages.

### Research

- TEST vs LIVE;
- study status and pinned versions;
- participant session state;
- cognitive session/trial existence;
- battery assignment stored order;
- export includes/excludes TEST/direct identifiers as expected.

### Thesis Builder

- current document owner;
- manual Save status;
- format/editor settings;
- revision history;
- no expectation of autosave;
- AI paper-read toggle state is client/session permission, not database-wide permanent consent.

## Closing a support ticket

Before declaring fixed:

1. reproduce or explain root cause;
2. verify with the user's actual safe workflow or a matching test account;
3. state whether any data changed;
4. state whether they need to retry/reload/re-save;
5. add regression coverage/documentation if the bug can recur.

---

# 35. New engineer first-week checklist

## Day 1: Access and local environment

- [ ] Git repository access.
- [ ] Confirm canonical remote with `git remote -v`.
- [ ] Read `AGENTS.md` and `00-START-HERE.md`.
- [ ] Install/use nvm.
- [ ] `nvm use` resolves to Node 24.
- [ ] `npm ci` completes.
- [ ] `npm run dev` works.
- [ ] `npm run build` works.
- [ ] Supabase project access with appropriate non-service-role personal/admin access.
- [ ] Vercel access.
- [ ] Render access if FastAPI is still active.
- [ ] Email provider/log access appropriate to role.
- [ ] Android/mobile release/log access if part of role.

## Day 1: Never request these through chat

- [ ] service-role key;
- [ ] database password;
- [ ] OpenAI key;
- [ ] production user password;
- [ ] private clinical notes;
- [ ] identifiable participant exports.

## Day 2: Architecture mapping

- [ ] Map active Next.js API routes.
- [ ] Map active FastAPI endpoints/callers.
- [ ] Map Supabase Auth/profile/role tables.
- [ ] Map study/participant core tables.
- [ ] Map cognitive tables and task session/trial storage.
- [ ] Map battery tables/assignment RPC.
- [ ] Map research writing tables.
- [ ] Map email/follow-up jobs.
- [ ] Map production environment-variable names without recording secret values.

## Day 2: Product walkthrough

Create/use a test researcher and walk through:

- [ ] create/open study;
- [ ] add questionnaire;
- [ ] add cognitive task;
- [ ] reorder cross-type flow;
- [ ] add preserved battery;
- [ ] expand battery into flow;
- [ ] launch TEST participant;
- [ ] complete a cognitive task;
- [ ] inspect Data Dashboard/Data Explorer;
- [ ] inspect export presets;
- [ ] inspect Study Associations;
- [ ] open Thesis Builder;
- [ ] create nested folders;
- [ ] edit/save/reload paper;
- [ ] test manual Save/unsaved warning;
- [ ] test AI paper access toggle;
- [ ] test import/export;
- [ ] test table/image tools.

## Day 3: Support drills

- [ ] Diagnose a fake RLS/grant error without disabling RLS.
- [ ] Diagnose a fake missing-module TypeScript cascade.
- [ ] Find Vercel build logs.
- [ ] Find Render logs if relevant.
- [ ] Find Supabase Auth user state.
- [ ] Find email send/failure logs.
- [ ] Practice querying a test study without direct identifiers.

## Week 1: Reliability improvements

Recommended first contributions:

- document deployment/environment ownership;
- add health/status checks where missing;
- add tests around critical participant-save paths;
- add smoke tests around cognitive dedicated-runtime routing;
- add tests for battery assignment persistence;
- add editor regression tests for manual Save and text-selection toolbar behavior;
- identify safe modularization opportunities in `app/researcher/page.tsx` without rewriting it wholesale.

## Suggested first week

### Day 1 - Access and build

- GitHub/Vercel/Supabase access complete;
- Node 24/npm verified;
- `.env.local` created securely;
- `npm ci`, `npm run build`, `npm run dev` pass;
- production and preview deployment understood;
- AI context pack loaded into ChatGPT/Codex.

### Day 2 - Research flow

- create a TEST researcher study;
- add questionnaire + cognitive task;
- create TEST participant link;
- complete participant flow in private browser;
- inspect Participants/Data Explorer/Export.

### Day 3 - Database and security

- tour Auth, RLS, grants, Storage, RPCs;
- inspect one owner-scoped table and one public security-definer flow;
- rehearse `permission denied` diagnosis without changing policies;
- understand service-role blast radius.

### Day 4 - Operational systems

- inspect Vercel logs;
- inspect Resend/email queue path;
- run safe AI endpoint test;
- review Support/Incident template;
- verify Android project builds only if mobile is in scope.

### Day 5 - First small PR

Choose a low-risk bug/documentation improvement, use a branch, preview, review, merge, production smoke test, and update context docs if relevant.

---

# 36. Keeping this manual and AI context alive

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

---

# 37. Appendix - quick reference and non-negotiables

## Commands cheat sheet

```bash
# runtime
nvm use
node -v
npm -v

# clean deterministic install
npm ci

# local web
npm run dev

# production build
npm run build

# git status/context
git status
git remote -v
git branch --show-current
git log --oneline --decorate -20

# update safely
git switch main
git pull --ff-only

# search env usage (run from repo root)
grep -R "process.env" app lib components --line-number

# search dangerous legacy role routing
grep -R "profiles.role\|selected_role\|workspace_role\|last_workspace" app components lib --line-number
```

## High-risk files at a glance

| File | Why high risk |
|---|---|
| `app/researcher/page.tsx` | Large Research workspace; Study Builder, data, exports, analysis, batteries and navigation accumulated here. |
| `app/study/[token]/page.tsx` | Public participant trust boundary and resume/execution sequencing. |
| `components/CognitiveRunner.tsx` | Preview generic + dedicated cognitive runtimes layered over time. |
| `components/CognitiveStudyRunner.tsx` | Live cognitive runtime; participant-facing behavior and persistence. |
| `components/ResearchWritingWorkspace.tsx` | Thesis Builder 1A-1L cumulative editor behavior; selection/pagination/save/privacy regressions are easy to reintroduce. |
| `components/ResearchAiAssistant.tsx` | Study-context AI contract, deterministic-score boundaries, battery/task context. |
| `lib/research/batteryReporting.ts` | Typed battery reporting; missing/broken types can create hundreds of cascade errors. |

## Non-negotiable regression reminders

- no Beginner/Advanced mode split;
- no official/proprietary WCST clone or Heaton scoring claims;
- no AI recomputation of authoritative cognitive scores;
- no automatic participant exclusion from quality flags;
- no Thesis Builder autosave;
- no silent AI paper access;
- no raw native font-size/color controls that destroy text selection;
- no service-role key in client/mobile;
- no broad anon table grants for public participant convenience;
- no research collaboration/team-permissions revival until product owner explicitly resumes it;
- no claim that native push is complete;
- no old phase file overwrite of current Git.

## External platform reference points

Platform UIs change. When in doubt, use official provider documentation and the current dashboard rather than screenshots from this manual.

- OpenAI API Platform: project members, service accounts, API keys, usage/budgets.
- Supabase Dashboard: Connect / Settings -> API Keys; Auth; Database; Storage; Logs.
- Vercel Project: Settings -> Environment Variables; Deployments; Logs; Domains.
- GitHub: repository roles, collaborator/team access, pull requests, branch protections.

## Manual supersession

This document supersedes the older August 2026 `PsyLattice_Engineering_Onboarding_Manual.docx` for current onboarding. Keep the old file only as historical architecture evidence.

---