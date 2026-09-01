# PsyLattice Master Context — Single-File AI Ingestion Version

**Snapshot date:** 2026-09-01

This file is designed for an AI assistant that can only ingest one context document. The modular files in `docs/ai-context` contain more detail; current Git remains the ultimate source of truth.

## Mission

PsyLattice is an integrated psychology platform spanning Research, Self, and Clinical workflows. The central Research proposition is **Build → Save → Reuse → Assemble → Collect → Connect → Analyse → Interpret → Export**. It should remove technical barriers for psychology students, thesis makers, early-career researchers, and psychologists without reducing scientific capability.

## Non-negotiable product principles

- One capable interface; no Beginner/Advanced split.
- Minimal, premium, psychologist-friendly UX; preserve logo/color language; avoid generic red/green AI-dashboard cards.
- Reusable tasks/questionnaires/batteries are versioned; studies pin exact versions.
- Study Builder supports cross-type ordering.
- Complete raw data is preserved alongside clean analysis sheets.
- Quality flags are review prompts, not automatic exclusion.
- AI interprets stored deterministic scores rather than replacing scoring code.
- Participant Study runtime should not reveal research-only performance summaries by default.
- RLS + grants + server-side secrets are mandatory.
- Current Git wins over historical phase packages.

## Architecture

Known stack: Next.js + TypeScript + Tailwind/shadcn-like components on Vercel; Supabase Postgres/Auth/Storage/RLS; server-side OpenAI routes. A FastAPI backend on Render was part of the established architecture in late August 2026, but the current code also contains many Next.js API routes; verify current endpoint ownership before changing backend architecture.

Node target is Node 24 LTS through nvm; `.nvmrc` should contain `24`. Use `npm ci`, `npm run dev`, and `npm run build`. Do not casually `npm audit fix --force`.

## Research workspace

Major surfaces: Dashboard, Studies, Study Builder, Questionnaire Library, Cognitive Lab, Thesis Builder, Ambulatory Assessment, Follow-up Manager, Participants, Participant Links, Data Dashboard, Data Explorer, Export Data. Research analysis includes Study Associations, quality review, task-specific dashboards, battery reporting, Research AI, Analysis_Wide/Analysis_Compatible, codebooks, and Visual Export Center.

Study Builder must preserve true participant sequence across questionnaires, cognitive tasks, demographics, and future EMA/other elements. Consent can be locked first. The same task/questionnaire may be repeated. Cognitive tasks require a published/Ready-for-studies version.

Questionnaire Library should include usage instructions, manuals, official/download links, scoring/licensing notes where permitted.

Ambulatory/EMA supports editable schedules/check-in times, time/event-contingent workflows, durations, and research compliance summaries. Follow-up delivery currently relies on email; native push is deferred.

## Cognitive Lab

Generic browser tasks cover classic RT/attention/working-memory paradigms. Dedicated engines exist for Stop-Signal, Corsi, PsyLattice Card Sorting, BART, and Mental Rotation.

Card Sorting is an original WCST-style paradigm, not the official/proprietary WCST. No proprietary deck/order/Heaton scoring/norms. Preserve transparent PsyLattice definitions.

BART (`psylattice_bart_v1`) uses seeded hidden explosion points, Pump/Collect decisions, persistent bank, and deterministic summaries including adjusted mean pumps (mean pumps on successfully cashed-out non-exploded balloons), explosion rate, final bank, latency, timeouts, raw decisions, and quality flags. Do not silently exclude data. A prior TS bug from async variable narrowing was fixed by returning a typed Promise result rather than mutating a union variable in a callback.

Mental Rotation (`psylattice_mental_rotation_v1`) uses original PsyLattice-generated asymmetric/chiral block-object SVG stimuli, Same/Mirrored judgments, angular disparities, seeded balanced trials, stored accuracy/RT/angle summaries and rotation slope in ms/degree. It is not a commercial standardized item set. A previous routing bug made zero-trial generic practice instantly report 100%; dedicated runtime detection must remain robust.

Research AI uses stored task summaries as authoritative and must not recompute metrics or invent normative cutoffs.

## Cognitive Batteries

Battery Builder creates reusable versioned batteries that pin exact task versions, allow reordering, required/optional tasks, transitions, breaks, estimated duration, fixed/randomized/Latin-square/Balanced-Latin-square order, intro/progress settings, and immutable published versions.

Battery execution remains an orchestration layer. Child tasks still create ordinary cognitive sessions/trials. Study Builder offers **Add as Battery** (one logical flow unit) and **Expand into Study Flow** (individual tasks can be interleaved). `cognitive_battery_assignments` stores reproducible participant-specific order; reload/resume must not reshuffle.

Battery reporting adds completion/order/duration/task-matrix metadata and Excel sheets such as Battery_Summary, Battery_Task_Matrix, Battery_Order_Review, Battery_Assignments_RAW. Do not interpret descriptive order patterns as causal effects automatically.

## Data/export

Export is a strategic priority. Preserve complete raw records while offering clean researcher-friendly Excel. Expected sources include questionnaires, cognitive raw trials and summaries, demographics, consent, ambulatory/EMA, follow-ups, timing/quality, batteries, and future wearables.

Common outputs: Analysis_Wide, Analysis_Compatible, Variable_Map, Codebook, Import_Guide, complete archive, thesis/analysis workbook, SPSS/jamovi/JASP-friendly workbook. Pseudonymous identity is preferred; direct identifiers require deliberate confirmation.

Study Associations should remain one reusable engine consuming numeric Analysis_Wide variables rather than task-specific duplicate correlation systems.

## Thesis Builder

Research sidebar name is **Thesis Builder**. It has nested owner-scoped folders/documents/revisions, collapsible and sticky file panes, focus mode, independent full-screen mode, paged paper stack, zoom, sticky editor controls, import/export inside the toolbar, Word-like formatting, tables, images, academic formats, manual Save, revisions, and Writing AI.

Database tables: `research_writing_folders`, `research_writing_documents`, `research_writing_revisions`. Free Form support was added later to the format constraint.

**Manual Save only.** Autosave was explicitly removed. Unsaved navigation/reload warns; reopening shows last saved version.

**Free form · Design it yourself** is the default for new/imported documents and starts with zero top/right/bottom/left margins, 1.0 spacing, zero first-line indent. Margins are independently adjustable in every mode and repaginate live. Academic presets can set recommended defaults but users can override them.

Preset list: Free Form, APA 7 Student, APA 7 Professional, MLA 9, Chicago/Turabian, IEEE, Custom/institution-specific. Format guide explains rules. AI restructuring must not invent missing facts/results/references.

Import supports DOCX/HTML/Markdown/TXT; export supports PDF/DOCX and A4/Letter. Packages include mammoth, html2pdf.js, html-docx-js-typescript.

Tables support insert/edit/add/delete rows/cols/header/width/drag resize/delete.

Images support upload/downscale/select/resize/drag/delete and wrap modes Inline, Square, Tight, Through, Top & bottom, Behind text, In front of text. Flow wraps relocate in document flow; Behind/In front can be freely positioned.

Writing AI is opened from a sticky button. Document access toggle is Off by default. Turning On asks permission once; after approval AI can read the paper for subsequent messages in that session until turned Off or the editor is reloaded/left. Visible access indicator required. Realtime continuous review remains future work.

Critical editor focus fixes: Text color, highlight, and font size use selection-safe popovers with saved/restored browser Range. Do not revert to raw native controls that collapse the selected text.

The Research Files navigator background must remain soft grey through its entire visible height.

## Self/Clinical/Mobile

Self includes dashboard, AI-guided support/navigation, assessments, monitoring, regulation/progress, appointments, messages, privacy. Clinical includes clients, appointments, messages, professional notes, care pathways/access. AI remains non-diagnostic.

Android development is advanced relative to iOS. Health Connect is the wearable bridge for heart rate/steps/sleep/exercise/background reads where permitted. Native push is deferred; follow-ups are email-based. Collaboration/Team & Permissions is also deferred until web collaboration is ready. iOS/watchOS is planned, not assumed complete.

## Security/support

RLS is a core control. RLS does not replace GRANT. The battery permission bug is the canonical example. Never disable RLS to fix a support issue. Use least privilege, test accounts, TEST studies, and sanitized logs. Never request passwords or copy sensitive clinical/participant records into AI chats. Pseudonymous research exports are the safe default.

Huge TypeScript Problems counts may be cascades from one missing typed helper/import. Fix the first real compiler error rather than adding `any` everywhere.

## Deferred/non-goals

- Research collaboration/team permissions: deferred.
- Native push: deferred.
- iOS/watchOS: planned.
- Beginner/Advanced modes: rejected.
- Official WCST clone: not the current product.
- AI cognitive scoring: not the architecture.
- automatic participant exclusion: not default.
- Thesis Builder autosave: removed.
- silent paper access / realtime review: not allowed/current.
- massive advanced statistics before export quality: not preferred.

## Current roadmap

Stabilize Research/Thesis Builder and operational reliability; map deployment/API ownership; improve tests/monitoring/support; later resume new cognitive paradigms. Probabilistic Reversal Learning was the next proposed dedicated task after the completed Battery cycle.

## Final AI rule

Before modifying PsyLattice, inspect current code. Historical phase ZIPs are context only. Explain what could regress, patch minimally, preserve data/scientific integrity, and build/test the real path.
