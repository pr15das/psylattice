# 04 — Research Workspace

## Purpose

The Research workspace is the center of PsyLattice’s research platform. It connects reusable instruments/tasks, protocol assembly, participant administration, multimodal data, analysis, AI interpretation, and export.

## Main navigation/surfaces

Current/established Research areas include:

- Dashboard
- Studies
- Study Builder
- Questionnaire Library
- Cognitive Lab
- Thesis Builder
- Ambulatory Assessment
- Follow-up Manager
- Participants
- Participant Links
- Data Dashboard
- Data Explorer
- Export Data

Additional research capabilities are embedded inside these surfaces rather than always appearing as standalone nav items, including:

- Study Analysis
- Study Associations
- quality review
- Visual Export Center
- saved analysis samples
- Research AI Assistant
- cognitive-task-specific dashboards
- battery reporting

## Study lifecycle

A typical lifecycle should be:

1. Create/select questionnaires and cognitive tasks.
2. Configure demographics, consent, ambulatory/follow-up components.
3. Assemble the participant flow.
4. Preview/pilot individual cognitive tasks and/or entire batteries.
5. Publish/launch participant links.
6. Monitor participation.
7. Review quality/data completeness.
8. Analyse and export.

## Studies vs reusable assets

Study Builder should not own the canonical definition of a reusable cognitive task or questionnaire.

It stores/pins the versions and study-specific administration metadata.

This makes it possible for the same task to be reused across studies while preserving reproducibility.

## TEST data

Research/Data surfaces often have an explicit **Include TEST data** option.

Keep test/pilot data isolated from production analysis by default. Do not silently include test runs in research summaries or exports.

## Participant identifiers

Research exports support pseudonymous modes and, where deliberately requested, direct identifiers with confirmation.

Default toward pseudonymous handling. Direct identifiers should require an explicit researcher choice/confirmation.

## Ambulatory research

The Research page contains real ambulatory research summaries based on participant records, with metrics such as:

- participants;
- scheduled prompts;
- completed/missed prompts;
- scheduled compliance percent;
- completed check-ins;
- event check-ins;
- median response latency;
- configurable recent-day windows.

An RPC observed in the current Research page is `psylattice_research_ambulatory_summary`.

## Large Research page

The Research workspace currently concentrates a lot of logic in `app/researcher/page.tsx`.

When modifying it:

- use the current repository file;
- patch only the required sections;
- do not replace it from a historical phase ZIP;
- run a full build after substantial changes;
- watch for TypeScript cascades caused by a missing imported helper.

A previous missing/unresolved `batteryReporting` helper made hundreds of callback parameters appear as implicit `any`. The correct fix was restoring the typed dependency, not adding `any` everywhere.
