# 20 — New Engineer Onboarding Checklist

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
