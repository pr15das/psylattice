# 16 — Current State and Roadmap Snapshot

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
