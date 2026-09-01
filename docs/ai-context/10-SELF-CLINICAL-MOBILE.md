# 10 — Self, Clinical, Android, Wearables, Notifications

## Self workspace

The Self side has been developed around personal psychological support/monitoring rather than research administration.

Known major surfaces/features include:

- dashboard;
- AI guide/assistant (Luna/AI Guide naming has appeared during development);
- self-assessments;
- monitoring/check-ins;
- self-regulation tools;
- progress;
- appointments;
- messages;
- privacy/permissions.

Self-facing AI should remain supportive/non-diagnostic and should not make autonomous clinical treatment decisions.

A historical UX behavior: dashboard greeting uses local device time (morning before 12, afternoon 12–16:59, evening 17+).

## Clinical workspace

Clinical work has included:

- clients;
- appointments;
- messaging;
- assessment/monitoring access;
- clinical notes;
- Professional Notes;
- care pathways;
- access/permission management.

The Professional Notes collapsible navigator influenced Thesis Builder’s document-navigation UX.

Clinical data should be treated as highly sensitive. Support engineers should not inspect records merely because they technically can.

## Workspace/role access

An earlier explicit product constraint was a strict self/researcher/clinician sign-in/workspace split, with users not shown workspaces they are not authorized to access.

The repository later acquired account/workspace-switcher components, so **VERIFY CURRENT** role UX. Preserve the security principle even if the visual navigation has evolved: authorization should determine access, not client-side hiding alone.

## Android app

Android development advanced substantially in August 2026.

The product direction expanded from a participant companion to a broader PsyLattice app with Researcher, Participant, Clinician, and Self experiences.

Known mobile design decisions/features include:

- PsyLattice branding/theme aligned to web;
- bottom navigation refinements;
- dedicated AI Guide route;
- Research workspace features;
- participant pairing/deep links;
- clinician Messages/Appointments navigation;
- PsyLattice app icon;
- APK distribution via website/Drive rather than initial Play Store dependency.

## Wearables / Health Connect

Android wearable ingestion is based on **Health Connect**.

Permissions/planned data include:

- heart rate;
- steps;
- sleep;
- exercise;
- background reads where permitted.

Design principle: the wearable/device should connect through Health Connect rather than requiring one proprietary tracker integration for every device.

Raw wearable data storage economics were considered; summarized data was accepted as a practical direction for some ongoing use cases, while research requirements still need enough detail for the intended analyses.

## Push notifications

Native push notifications were intentionally deferred.

Current/near-term follow-up delivery is email-based.

Longer-term plan: one unified notification system across Self, Clinical, appointments, studies, messages, follow-ups, and devices.

Do not assume push tokens/services are currently production-critical.

## iOS/watchOS

Apple/iOS/Apple Watch support is planned but behind Android/Health Connect in implementation maturity.

Do not represent Apple wearable support as complete unless current code/deployment verifies it.
