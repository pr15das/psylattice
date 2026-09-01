# 06 — Cognitive Lab and Task Runtime Architecture

## Cognitive Lab mission

Cognitive Lab aims to let psychologists build/use browser-based cognitive experiments with much less technical overhead than coding-heavy tools, while preserving scientific configuration, timing diagnostics, raw trial data, and reproducibility.

The product should be simpler than PsychoPy-like workflows without pretending experimental design is trivial.

## UI model

Cognitive Lab includes concepts such as:

- Overview/Learn
- Task Templates
- My Cognitive Tasks
- Batteries
- Pilot Sessions
- task builder
- browser Preview
- published/versioned tasks

Avoid a Beginner/Advanced split. Use task-specific setup panels for paradigms that require them.

## Generic task family

The library has included browser-runner tasks around:

- simple reaction time;
- Go/No-Go;
- Flanker;
- Stroop;
- N-back;
- PVT;
- SART;
- Posner/spatial cueing;
- Visual Search;
- Sternberg memory;
- AX-CPT;
- Task Switching;
- Lexical Decision;
- and other reusable classic structures.

The exact current template catalogue should be read from Supabase/current code rather than hardcoded from this document.

## Dedicated task engines

Several paradigms required task-specific runtime/scoring rather than being forced into a generic trial-table abstraction.

### Stop-Signal

Dedicated runtime built before Corsi/Card Sorting/BART/Mental Rotation. Preserve its task-specific SSRT/scoring workflow and timing diagnostics. Do not replace with a generic Go/No-Go approximation.

### Corsi Block Tapping

Dedicated sequential spatial-memory runtime with task-specific span/sequence outcomes and Research/Data integration.

### PsyLattice Card Sorting

Important naming/scientific boundary:

- This is an **original PsyLattice WCST-style card sorting paradigm**.
- It is **not** the official/proprietary standardized Wisconsin Card Sorting Test.
- Do not reproduce proprietary decks/order/ambiguity rules/Heaton scoring/norms.
- PsyLattice uses transparent scoring definitions.
- A key perseverative error definition used in the PsyLattice implementation is an incorrect response after a rule change that matches the immediately previous rule.
- Research UI/AI/export should explicitly avoid calling the scores official WCST scores.

### BART

Runtime engine: `psylattice_bart_v1`.

Typical default protocol from the implemented template:

- 30 balloons;
- maximum 64 pumps;
- seeded hidden explosion threshold in configured range;
- reward per safe pump 0.05;
- starting bank 0;
- Pump / Collect decisions;
- participant never sees the explosion point.

Decision-level runtime data retains:

- balloon/decision indices;
- decision type;
- pumps before/after;
- hidden explosion point;
- explosion/cash-out state;
- temporary reward before/after;
- bank before/after;
- latency;
- timeout;
- normal timing diagnostics.

Key stored summary metrics include:

- total/completed balloons;
- exploded balloons;
- cashed-out balloons;
- explosion rate;
- mean pumps;
- **adjusted mean pumps**;
- median pumps on non-exploded collected balloons;
- total pumps;
- final bank;
- mean decision latency;
- timed-out decisions;
- balloon summaries;
- quality flags.

**Adjusted mean pumps** is defined as the mean number of pumps on successfully cashed-out, non-exploded balloons.

No silent participant/trial exclusion.

A previous TypeScript runtime bug came from mutating a union decision variable inside an async Promise callback, causing TS2367 narrowing errors. The robust fix was for the Promise to return a typed observed response and derive the decision after `await`.

### Mental Rotation

Runtime/scoring system: `psylattice_mental_rotation_v1`.

It is an image-based task using original PsyLattice-generated asymmetric/chiral block-object stimuli, not a commercial Vandenberg & Kuse item set.

Current system/template characteristics include:

- Practice + Experimental + Complete dedicated blocks;
- default 8 practice trials;
- default 60 experimental trials;
- angular disparities such as 0°, 45°, 90°, 135°, 180°;
- Same vs Mirrored judgments;
- seeded balanced trial generation;
- original SVG/polycube-like generator;
- desktop/laptop recommended, tablet supported, phone disabled by default.

Stored outputs include:

- overall accuracy;
- Same accuracy;
- Mirrored accuracy;
- mean/median correct RT;
- accuracy/RT by angle;
- rotation slope in ms/degree;
- raw shape ID/cell definitions;
- relation/mirror state;
- angular disparity;
- response/correctness/latency/timeouts;
- quality flags.

The rotation slope is deterministic and stored. Research AI should interpret the stored value rather than recomputing it from raw trials.

A critical runtime regression once caused Mental Rotation to fall into a generic zero-trial practice block and immediately show `Practice complete — 100%` with `0/—`. Dedicated runtime detection was hardened to prevent this fallback. Do not reintroduce single-marker routing that allows a dedicated empty block to be treated as a generic task.

## Preview vs live Study behavior

Preview is for researcher verification and may show task summaries.

Live participant Study runtime should not show research-performance summaries unless the protocol explicitly requires participant feedback. This boundary was intentionally preserved for Card Sorting, BART, Mental Rotation, and other research tasks.

## Pilot links

Cognitive pilot links have been designed around immutable definition snapshots so later task edits do not silently alter an already-shared pilot.

Keep that reproducibility principle.

## Next candidate cognitive expansion

After the dedicated backlog and Battery Builder were completed, **Probabilistic Reversal Learning** was identified as a strong next new paradigm because it adds probabilistic learning/reversal, perseveration, win-stay/lose-shift, learning curves, and computational-model-ready trial histories.

It was not pursued immediately because Battery Builder and then Thesis Builder became higher priorities.
