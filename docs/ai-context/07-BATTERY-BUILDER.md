# 07 — Cognitive Battery Builder, Execution, and Reporting

## Why batteries exist

Once Cognitive Lab had enough meaningful tasks, reusable batteries became more valuable than simply adding more paradigms.

A battery is a reusable, versioned package of cognitive tasks, for example:

**Executive Function Battery**

- Stroop
- Stop-Signal
- Corsi
- Card Sorting
- Mental Rotation

The battery owns orchestration, not task scoring.

## Battery Builder (2L)

Core behaviors:

- create reusable batteries;
- add only tasks that are Ready for studies/published;
- pin exact cognitive task versions;
- reorder tasks;
- use a task more than once;
- mark tasks required/optional;
- configure participant-facing transitions;
- configure breaks such as 30 sec / 1 min / 2 min / 5 min;
- estimate duration;
- fixed/randomized/counterbalanced order;
- Latin Square / Balanced Latin Square strategies;
- participant introduction;
- Task X of Y progress;
- save editable draft;
- mark battery Ready for studies;
- freeze/publish immutable battery versions;
- create a new editable version later without altering the published one.

Database concepts include:

- `cognitive_batteries`
- `cognitive_battery_versions`
- `cognitive_battery_items`

A real migration bug occurred because table RLS policies existed but authenticated table grants were missing. A permissions fix added grants. The later 2M migration reapplied the grants idempotently.

## Battery execution (2M)

Principle:

**Battery = orchestration layer.**

Each child task still creates normal `cognitive_task_sessions` and `cognitive_trial_results`. Do not create a parallel score/raw-trial silo for battery execution.

### Whole-battery Preview

From Cognitive Lab, a researcher can preview the battery end to end:

- participant intro;
- Task X of Y progress;
- transition screens;
- actual existing task Preview runtime;
- configured breaks;
- one battery-complete screen.

Preview uses the configured listed order. Participant-specific randomization/counterbalancing only has scientific meaning in a real Study session and is assigned there.

### Study Builder modes

#### Add as Battery

The group remains indivisible in Study Flow. Study attachments retain battery metadata such as:

- group key;
- battery ID/version;
- battery title/version label;
- battery item ID/position;
- order mode;
- counterbalance strategy;
- participant intro;
- transition/break config;
- estimated duration.

#### Expand into Study Flow

Creates ordinary study cognitive items and records provenance metadata (`expanded_from_battery` style metadata). Researchers can interleave other study elements afterward.

### Participant assignment

The 2M migration adds `cognitive_battery_assignments`.

One row represents one participant-session assignment for one preserved battery in one study.

Stored metadata includes:

- participant session;
- study;
- battery group key;
- battery/version identity;
- order mode;
- counterbalance strategy;
- assigned counterbalance row;
- ordered stable battery item IDs.

Participants do not receive broad direct write permission; assignment is created through the public Study flow/security-definer path.

Randomized order is deterministic/reproducible for the participant/session and stored. Reload/resume must not reshuffle.

Latin-square assignment rotates rows. Balanced Latin Square uses a Williams-style ordering, with the additional reversed cycle for odd-sized batteries. Assignment is round-robin with locking to avoid concurrent participants consuming the same next row.

## Battery reporting (2N)

Battery reporting adds orchestration metadata to Research/Data without duplicating child task scores.

Research surfaces include:

- assigned participant count;
- completed battery count;
- completion rate;
- median battery duration;
- participant-specific assigned order;
- fixed/randomized/counterbalanced order review;
- task-completion matrix;
- battery start/end timestamps;
- descriptive order-pattern diagnostics.

Data Explorer/export datasets include concepts such as:

- Cognitive battery summaries — participant level;
- Cognitive battery task completion matrix;
- Cognitive battery assignments — raw order data;
- Cognitive battery order diagnostics — descriptive.

Excel complete exports add sheets such as:

- `Battery_Summary`
- `Battery_Task_Matrix`
- `Battery_Order_Review`
- `Battery_Assignments_RAW`

## Interpretation caution

Differences between performance in task positions/order patterns are descriptive unless a proper inferential design supports causal/statistical claims.

Research AI was explicitly instructed not to overclaim order effects.
