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

These workspaces are at different levels of maturity. Self and Research contain live functionality. Clinical is currently a prototype/demo and must not be treated as production-ready or represented as a verified clinical system.

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
