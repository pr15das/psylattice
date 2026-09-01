# 24 — Migration / Phase History Reference

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
