# 15 — Condensed Decision Log / Historical Timeline

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
