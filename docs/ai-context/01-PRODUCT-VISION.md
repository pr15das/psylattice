# 01 — Product Vision, Differentiation, and Product Discipline

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
