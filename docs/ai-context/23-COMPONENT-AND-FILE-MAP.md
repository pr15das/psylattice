# 23 — Component and File Map (Known Current/Recent)

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
