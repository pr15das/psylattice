# 08 — Research Data, Analysis, Export, Quality Review, and AI

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
