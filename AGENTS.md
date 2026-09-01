<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PsyLattice development instructions

These instructions apply to all work in this repository. More deeply nested `AGENTS.md` files may add narrower instructions for their directories, but they must not weaken the safety, research-integrity, privacy, or data-governance requirements below.

## PsyLattice purpose

PsyLattice is a psychological research and behavioral assessment platform with three workspaces:

- **Self** — personal assessment, monitoring, reflection, self-regulation, progress, and AI-assisted guidance.
- **Research** — study configuration, questionnaires, consent, participant workflows, research data, and exports.
- **Clinical** — professional-facing assessment and client-management concepts.

These workspaces may be at different levels of maturity. Verify the current implementation and `docs/ai-context/16-CURRENT-STATE-ROADMAP.md` before describing any workspace or feature as production-ready. Never represent Clinical access as professional verification unless an authoritative verification system actually enforces that claim.

The current application uses Next.js App Router, React, strict TypeScript, Tailwind CSS, Supabase Auth/Postgres, and an OpenAI-backed API route. Much of the Self and Research data access occurs directly from client components through Supabase. The database schema, migrations, RLS policies, grants, and participant RPC definitions may not be present in this repository, so never infer or silently alter them.

## General development rules

- Preserve existing working functionality.
- Prefer narrow, targeted changes.
- Do not rewrite large files merely to implement a small feature.
- Do not refactor unrelated code while implementing a feature.
- Inspect relevant existing code before modifying it.
- Reuse existing design patterns and components where appropriate.
- Maintain strict TypeScript compatibility.
- Do not introduce packages unless necessary and explicitly justified.
- Never delete existing functionality without explicit instruction.
- Never modify Supabase database structure, migrations, RLS, RPCs, policies, grants, triggers, or production data without explicit approval.
- Never expose secrets or environment-variable values. Public/publishable keys should still not be copied into logs or reports unnecessarily.
- Never use real participant, clinical, health, or personally identifiable data in development output, fixtures, tests, logs, screenshots, examples, or documentation.
- Do not assume that a visible UI restriction is an authorization boundary. Sensitive access must also be enforced by the appropriate server or database controls.
- Do not present Research or Clinical access as professionally verified unless the authoritative verification system actually enforces that claim.
- Preserve the distinction between authenticated navigation, workspace choice, professional role, and database authorization.

## Research integrity

Research functionality must prioritise:

- reproducibility
- traceability
- transparent scoring
- accurate participant data collection
- explicit consent
- safe data handling
- researcher control over study configuration

Do not silently change research methodology, scoring logic, randomization, study protocols, questionnaire content, consent behavior, measurement points, participant inclusion/exclusion behavior, export semantics, or participant flows.

Version-sensitive research records should remain traceable to the exact questionnaire, questionnaire version, consent version, study configuration, and scoring configuration used at collection time. Do not replace versioned behavior with mutable assumptions.

If implementation and UI claims differ, report the mismatch rather than treating the claim as implemented behavior.

## Questionnaire rules

Questionnaire implementations must distinguish between:

- questionnaire metadata
- questionnaire items
- response scales
- scoring rules
- interpretation
- licensing/access restrictions
- manuals/resources
- references

Do not invent questionnaire content, item wording, scoring rules, licensing status, validation evidence, psychometric properties, cutoffs, norms, interpretations, manuals, references, or official sources.

Preserve licensing and redistribution restrictions. Finding a questionnaire publicly accessible does not establish permission to reproduce, modify, digitize, score, or redistribute it.

Where licensing permits, questionnaire entries should support clear participant and researcher instructions, manual/resource links, citations, and official/download sources. Label unavailable or unverified information honestly.

Treat scoring code as research-critical. Confirm reverse scoring, subscales, missing-data behavior, multipliers, response coding, and interpretation separately. Storing a custom scoring formula is not the same as executing or validating it.

## Participant safety

Changes affecting any of the following are high-risk:

- consent
- participant identity or direct identifiers
- PHQ-9 or other safety-sensitive questionnaires
- crisis or safety handling
- study withdrawal
- participant/session/link tokens or participant codes
- scoring and interpretation
- participant data collection or storage
- exports, anonymisation, pseudonymisation, or de-identification
- authentication, authorization, RLS, or workspace access

Do not alter these systems casually or as part of unrelated work.

Client-side checks are not sufficient enforcement for safety-critical restrictions. When a rule must not be bypassed—such as live deployment safeguards, ownership, token validity, consent requirements, or data-access restrictions—confirm that the server or database enforces it before describing the rule as secure.

Do not weaken the separation of TEST and live research data. Do not expose participant tokens, participant codes, raw responses, direct identifiers, or sensitive exports in logs or UI diagnostics.

AI behavior involving psychological guidance must remain non-diagnostic and must not prescribe treatment or medication. Safety behavior must not rely solely on prompt wording when stronger application-level enforcement is required.

## UI/UX

Preserve PsyLattice's existing visual language unless redesign is explicitly requested.

Researcher configurability is an important product principle. Avoid hard-coding study behavior where researchers should reasonably be able to configure it, while preserving safety and methodological constraints.

Clearly distinguish:

- working features
- partially implemented features
- demo functionality
- planned functionality

Do not make UI claims about functionality that does not actually exist. Do not display fictional/demo records as live data or label unverified accounts, permissions, connections, or professional credentials as verified.

When adding controls, ensure that they either perform the stated action or are clearly marked as unavailable/prototype functionality. Avoid interactive-looking no-op controls.

## Working with large files

`app/self/page.tsx` and `app/researcher/page.tsx` are very large client files. `app/study/[token]/page.tsx` is also safety- and data-sensitive.

For small feature changes:

- make the smallest safe modification possible
- identify the relevant section and its local types, state, effects, database calls, and UI before editing
- do not automatically restructure the whole page
- avoid moving unrelated components or reformatting unrelated sections
- confirm whether switching workspace screens unmounts and resets local state

Large-scale component extraction, shared-state introduction, data-layer redesign, or architectural refactoring must be treated as a separate task with its own regression plan.

## Supabase and backend boundaries

- Treat the remote Supabase database as an external system whose schema and security behavior must be verified, not guessed.
- Before changing a query or mutation, identify its tables, ownership fields, RLS expectations, RPC dependencies, and failure behavior.
- Prefer atomic server/database operations for sensitive multi-table writes. Do not introduce new delete-then-insert workflows without considering rollback and partial failure.
- Do not trust client-provided ownership, status, scores, consent state, or identifiers without server/database validation.
- Do not change public participant RPC contracts without reviewing the corresponding database functions and the full participant resume/save flow.
- Never run migrations, write administrative SQL, alter policies, or manipulate production records without explicit approval and a clearly identified environment.

## Authentication and authorization

- Inspect the active root `proxy.ts`, Supabase clients, auth callback/confirmation handlers, sign-in flow, workspace selector, and relevant RLS/RPC behavior before changing auth.
- The root proxy is an optimistic session gate, not a substitute for data authorization.
- Be alert to legacy or unused auth helpers. Do not assume an unimported role/verification implementation is active.
- Preserve safe redirect targets and session-cookie propagation.
- Signing out must actually terminate the Supabase session; navigation to `/signin` alone is not sign-out.
- Any change to workspace roles or professional verification requires an explicit, authoritative product and database model.

## State and data flow

- The application primarily uses local React state and effects; there is no established global state or query-cache layer.
- Internal workspace screens are conditionally rendered and may lose local state when switched.
- Public participant resume state uses a browser-held session token and database RPCs. Treat this as sensitive authentication material.
- Avoid introducing a second state-management pattern for a small feature.
- When adding asynchronous behavior, handle loading, empty, error, retry, and partial-failure states explicitly.

## Before making changes

Before implementation:

1. Check `git status` and preserve unrelated work.
2. Read the applicable `AGENTS.md` instructions and relevant Next.js 16 documentation in `node_modules/next/dist/docs/`.
3. Inspect the relevant files and existing behavior.
4. Identify dependencies, environment requirements, database tables/RPCs, and auth boundaries.
5. Determine whether the screen uses live, partial, demo, or planned functionality.
6. Consider regressions, failure modes, privacy, participant safety, and research reproducibility.
7. If the requested change could affect architecture, data integrity, authentication, authorization, scoring, consent, participant identity, exports, or participant safety, explain the proposed approach before implementing unless explicitly told to proceed.

Do not run a development server, production build, formatter, generator, migration, or other command that may create or rewrite files unless it is needed for the task and allowed by the user.

## After making changes

After implementation:

1. Review the complete diff and confirm that only intended files changed.
2. Run TypeScript validation.
3. Run relevant lint checks, preferably scoped first when practical.
4. Run relevant tests if available.
5. Run a production build when appropriate and permitted.
6. Fix errors introduced by the change.
7. Do not modify unrelated code solely to clear pre-existing lint failures.
8. Recheck `git status` for generated or accidental files.

Then report:

- files modified
- behavior changed
- checks performed and their results
- any remaining issues or pre-existing failures
- manual browser testing steps

The repository may contain pre-existing lint failures and currently has limited or no automated test coverage. Do not claim a clean validation result unless the commands actually pass, and distinguish new failures from the existing baseline.

## Git safety

- Check git status before editing and after validation.
- Preserve unrelated user changes.
- Do not reset, discard, overwrite, force-push, rebase, amend, or delete user work without explicit permission.
- Keep changes scoped to the requested task.
- Do not stage, commit, create branches, push, or open pull requests unless requested.
- Avoid destructive commands and confirm exact targets before any deletion explicitly requested by the user.

## PsyLattice shared project context and source of truth

These repository-level instructions are supplemented by the version-controlled engineering context under `docs/ai-context/`. For substantial work, the repository should teach both human engineers and AI coding agents how PsyLattice is intended to behave.

### Read context before substantial changes

Before an architectural, database, UX, research-scoring, participant-flow, export, AI, deployment, or production-support change, read:

- `docs/ai-context/00-START-HERE.md`
- the relevant subsystem document under `docs/ai-context/`
- `docs/ai-context/17-KNOWN-BUGS-AND-REGRESSIONS.md`

For deployment/support tasks also read:

- `docs/ai-context/11-SECURITY-PRIVACY-RLS.md`
- `docs/ai-context/12-OPERATIONS-USER-SUPPORT-RUNBOOK.md`
- `docs/ai-context/13-DEV-DEPLOYMENT-WORKFLOW.md`

For onboarding or infrastructure ownership also read:

- `docs/onboarding/PsyLattice_Engineer_Onboarding_Manual.md`
- `docs/onboarding/FIRST_DAY_ACCESS_CHECKLIST.md`

### Current Git is authoritative

The checked-out Git repository is the implementation source of truth.

Historical ChatGPT-generated phase packages, ZIP files, copied components, old migration bundles, screenshots, conversation attachments, and previous handoff files are reference material only.

Never replace a current repository file with an older generated version merely because the older file already contains a requested feature.

Instead:

1. inspect the current Git version;
2. identify the smallest required change;
3. diff any historical/reference implementation if useful;
4. port only the required behavior into the current file;
5. preserve everything added since that historical version.

This is especially important for:

- `app/researcher/page.tsx`
- `app/self/page.tsx`
- `app/study/[token]/page.tsx`
- `components/CognitiveRunner.tsx`
- `components/CognitiveStudyRunner.tsx`
- `components/CognitiveLab.tsx`
- `components/CognitiveTaskBuilder.tsx`
- `components/CognitiveBatteryBuilder.tsx`
- `components/ResearchAiAssistant.tsx`
- `components/ResearchWritingWorkspace.tsx`
- Android `MainActivity.kt` and related mobile infrastructure

### Integrated product model

PsyLattice is one connected psychology platform, not a set of unrelated features.

The Research workflow should remain conceptually consistent with:

**Build → Save → Reuse → Assemble → Collect → Connect → Analyse → Interpret → Export**

Cognitive Lab owns reusable cognitive tasks and batteries. Questionnaire Library owns reusable questionnaire definitions/versions. Study Builder owns the complete participant protocol and cross-type ordering.

Before introducing a new architecture, scoring system, export pathway, state-management pattern, notification stack, association engine, AI-calculation layer, or visual language, inspect the current implementation and context documents first.

### Preserve Study Builder flexibility

The participant flow must support cross-type ordering, for example:

`questionnaire → cognitive task → questionnaire → demographics → cognitive task → EMA`

A preserved cognitive battery is one logical Study Flow unit. An expanded battery becomes ordinary cognitive task elements and may be interleaved with questionnaires, demographics, and other study elements.

Do not reintroduce a separate Beginner/Advanced mode. Simplify one capable interface.

### Preserve cognitive task and battery integrity

Published cognitive task versions and published battery versions are immutable concepts. Studies and batteries pin exact versions. Editing a later draft must not silently alter an already-published study, pilot, or battery.

A cognitive battery is an orchestration layer. Child tasks continue to run their normal task-specific PsyLattice runtimes and store their ordinary cognitive sessions/trials. Do not create a competing second result system for battery tasks.

Already-assigned randomized/counterbalanced battery order must remain stable across reload/resume.

Stored deterministic task summaries are authoritative. Research AI may interpret stored results but should not silently recalculate BART, Mental Rotation, Card Sorting, Corsi, Stop-Signal, or other official PsyLattice task summaries from raw records when an authoritative stored summary exists.

Do not invent normative cutoffs.

PsyLattice Card Sorting is an original WCST-style paradigm and must not be represented as the official/proprietary WCST or as using proprietary scoring/norms.

PsyLattice Mental Rotation uses original generated stimuli and must not be represented as reproducing a commercial/proprietary standardized stimulus set.

### Research data and export integrity

PsyLattice should preserve complete raw observations while also providing clean researcher-friendly summaries and analysis-ready exports.

Never silently:

- drop raw observations;
- overwrite authoritative stored task scores;
- exclude participants because a quality flag exists;
- change deterministic variable naming without considering downstream analysis scripts;
- change pseudonymous/direct-identifier export defaults casually;
- alter TEST/LIVE separation.

Quality flags are review signals, not automatic exclusions unless a study explicitly defines a rule otherwise.

Study Associations should reuse the existing association engine and numeric `Analysis_Wide`/analysis-compatible variables rather than creating a new task-specific correlation system.

### Thesis Builder invariants

Thesis Builder is a substantial research-writing subsystem. Preserve these current decisions unless explicitly changed by product direction:

- **Free form** is the default for new/imported documents;
- Free form must not inherit an academic preset's margins;
- margins are independently adjustable per side;
- academic presets provide defaults/guidance but can be overridden;
- autosave is intentionally **off**;
- database persistence occurs through explicit **Save**;
- unsaved-change protections must remain;
- the paged editor/focus/full-screen/zoom behavior should remain coherent;
- Import/Export belongs in the main editor toolbar;
- image/table functionality and Word/PDF import/export should not be accidentally removed;
- selection-safe text colour, highlight, and font-size controls must preserve the selected browser `Range`;
- formatting controls that steal `contenteditable` focus should use the same selection-preservation approach rather than a fragile native control workaround.

Writing AI must never silently read the current paper. Document access is user-controlled, visibly indicated, and session-scoped. Do not weaken this consent boundary without an explicit product decision.

### AI-development and AI-product rules

When ChatGPT, Codex, or another AI coding system is used:

- give it access to the current repository rather than relying on old pasted files;
- instruct it to read this `AGENTS.md` first;
- instruct it to read `docs/ai-context/00-START-HERE.md` and relevant subsystem documents;
- let current Git override historical phase files;
- prefer surgical patches over whole-file rewrites;
- never send `.env.local`, API/service keys, passwords, participant data, clinical data, identifiable research records, private manuscripts, or production database dumps merely to provide coding context.

Product AI should remain an interpretation/support layer rather than silently becoming the deterministic scoring engine. Clinical/Self AI must remain non-diagnostic and non-prescriptive.

### Supabase RLS and PostgreSQL grants both matter

RLS policies do not replace table/function grants. When adding or changing a database surface, verify both:

- correct RLS ownership/role policies; and
- explicit privileges for the role actually used by the client/server path.

A prior Cognitive Battery permissions failure occurred because RLS was correct but authenticated table `GRANT` permissions were missing. Do not “fix” a permission error by disabling RLS.

### Secrets and mobile boundaries

Never expose service-role keys, OpenAI keys, Resend keys, cron secrets, signing secrets, admin tokens, or production credentials in client code, Android/iOS code, documentation, logs, screenshots, Git history, tickets, WhatsApp, or AI prompts.

Only public Supabase client configuration belongs in the browser/mobile app. Service-role/admin credentials remain server-side.

### UX and design language

PsyLattice should feel minimal, modern, calm, premium, and purpose-built for psychologists.

Preserve the existing logo and visual identity. Prefer clean white/slate surfaces, restrained cyan/teal accents, subtle violet where established, clear hierarchy, refined spacing, borders/shadows, and product-like feedback.

Avoid generic AI-dashboard styling, especially loud red/green success/error cards and unnecessary decorative gradients. Use red primarily for genuinely destructive/safety/error meaning.

When creating researcher documentation, prefer custom illustrations/diagrams over screenshots of the website when visual teaching is needed.

### Deferred features are not forgotten bugs

Some features were deliberately deferred. Do not revive them from an old phase package merely because code/plans exist. Current notable examples include:

- Research collaborator / Team & Permissions expansion until the web workflow is intentionally restarted;
- broad native push-notification architecture while email/unified notification work remains the current delivery path;
- iOS/watchOS work until explicitly prioritized.

Check `docs/ai-context/14-DEFERRED-AND-NON-GOALS.md` and the current roadmap before treating a deferred feature as missing implementation.

### Runtime baseline

The repository is standardized on **Node 24 LTS** through nvm and `.nvmrc`.

Typical local sequence:

```bash
nvm use
npm ci
npm run dev
# test locally
npm run build
```

Do not run `npm audit fix --force` casually on the production codebase.

### Context maintenance

When a merge materially changes PsyLattice architecture, product behavior, infrastructure, scientific scoring, data contracts, deployment, a major design decision, or a known regression, update the relevant document under `docs/ai-context/` and `docs/ai-context/16-CURRENT-STATE-ROADMAP.md` when feasible.

The repository should become the durable shared memory for the PsyLattice engineering team and its AI tools.

