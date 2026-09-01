# 05 — Study Builder, Questionnaires, Participant Flow, EMA/Follow-ups

## Core Study Builder principle: true cross-type ordering

Researchers must be able to reposition study elements in the actual participant flow across types.

Supported intended patterns include:

`questionnaire → cognitive task → questionnaire → demographics → cognitive task`

and, as the product grows:

`consent → demographics → questionnaire → battery/task → EMA → follow-up`.

Do not rebuild the Study Builder as separate immutable “questionnaire section” and “cognitive section” timelines.

## Consent

PsyLattice-controlled consent, when enabled, should remain before research data collection. In the participant flow UI it has been treated as a locked first element.

Consent metadata should be included in complete exports where appropriate.

## Repeated instruments

The same questionnaire or cognitive task may be added more than once if the research design requires repeated administration.

Do not globally deduplicate by task/questionnaire ID in Study Flow.

## Published task requirement

Study Builder should only add a cognitive task as study-ready when it has a published/tested version. Existing UI messaging uses language such as:

`Open Cognitive Lab and mark a tested version Ready for studies first.`

Study attachments pin the published version ID.

## Questionnaire Library

Questionnaire entries should include, where licensing permits:

- clear instructions for use;
- measure description/domain;
- scoring information;
- manual access;
- official source/download link;
- licensing/copyright caveats;
- version information.

Do not scrape/rehost copyrighted questionnaires merely because the text is available online. The platform should distinguish public-domain/permitted instruments from restricted materials.

## Ambulatory/ESM

Researchers need to configure:

- number of prompts/check-ins per day;
- editable prompt times;
- time-contingent schedules;
- event-contingent check-ins;
- duration;
- enabled/disabled protocol state;
- question content;
- longitudinal participant delivery.

The product should keep the design approachable while allowing researchers to edit timings directly.

## Follow-ups

Native mobile push was deferred. Follow-up delivery is currently email-based. Do not build assumptions that a push channel always exists.

A unified notification layer is planned later across studies, Self, Clinical, appointments, messaging, and mobile.

## Cognitive batteries inside Study Builder

Published batteries can be added in two modes:

### Add as Battery

- preserves the battery as one logical Study Flow unit;
- child task attachments remain ordinary pinned cognitive task attachments;
- immutable battery metadata is stored with the study attachments;
- questionnaires/demographics should not be moved between preserved battery children;
- participant task order can be fixed/randomized/counterbalanced depending on battery configuration.

### Expand into Study Flow

- converts the battery to ordinary individual cognitive study elements;
- preserves provenance metadata about the source battery;
- allows interleaving questionnaires, demographics, etc. between former battery tasks.

This distinction is important and should remain explicit.
