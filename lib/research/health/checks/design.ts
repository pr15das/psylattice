import type {
  StudyHealthCheck,
  StudyHealthSnapshot,
  StudyHealthSourceKey,
} from "@/lib/research/health/types";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function enabled(snapshot: StudyHealthSnapshot, key: string) {
  return snapshot.study.components?.[key] === true;
}

function unavailable(
  snapshot: StudyHealthSnapshot,
  source: StudyHealthSourceKey,
  id: string,
  label: string,
  target: StudyHealthCheck["action"],
): StudyHealthCheck {
  return {
    id,
    section: "design",
    label,
    status: "unavailable",
    severity: "info",
    origin: "deterministic",
    detail:
      snapshot.sourceState[source].reason ||
      "This source is temporarily unavailable, so PsyLattice did not infer a result.",
    scoreEligible: false,
    evidence: [
      {
        source,
        summary: "Source read failed; no health judgement was produced.",
      },
    ],
    action: target,
  };
}

export function buildDesignChecks(
  snapshot: StudyHealthSnapshot,
): StudyHealthCheck[] {
  const checks: StudyHealthCheck[] = [];
  const studyId = snapshot.study.id;

  const studyTitle = text(snapshot.study.title);
  const titleIsPlaceholder =
    !studyTitle ||
    /^untitled(?: research)? study$/i.test(studyTitle) ||
    /^new study$/i.test(studyTitle);

  checks.push({
    id: "design.study_title",
    section: "design",
    label: "Study title defined",
    status: titleIsPlaceholder ? "attention" : "complete",
    severity: titleIsPlaceholder ? "medium" : "info",
    origin: "deterministic",
    detail: titleIsPlaceholder
      ? "The study still uses an empty or placeholder title."
      : `Study title: ${studyTitle}`,
    scoreEligible: true,
    evidence: [
      {
        source: "research_studies",
        field: "title",
        recordIds: [studyId],
        summary: titleIsPlaceholder
          ? "No meaningful saved title detected."
          : "A non-placeholder study title is saved.",
      },
    ],
    action: titleIsPlaceholder
      ? { target: "builder", label: "Open Study Builder", studyId }
      : null,
  });

  const description = text(snapshot.study.participant_description);
  checks.push({
    id: "design.participant_description",
    section: "design",
    label: "Participant description defined",
    status: description ? "complete" : "attention",
    severity: description ? "info" : "medium",
    origin: "deterministic",
    detail: description
      ? "A participant-facing study description is saved."
      : "No participant-facing study description is saved.",
    scoreEligible: true,
    evidence: [
      {
        source: "research_studies",
        field: "participant_description",
        recordIds: [studyId],
        summary: description
          ? "Participant description is present."
          : "Participant description is empty.",
      },
    ],
    action: description
      ? null
      : { target: "builder", label: "Add participant description", studyId },
  });

  const design = text(snapshot.study.design);
  checks.push({
    id: "design.study_design",
    section: "design",
    label: "Study design specified",
    status: design ? "complete" : "attention",
    severity: design ? "info" : "medium",
    origin: "deterministic",
    detail: design
      ? `Saved design: ${design}`
      : "The study design has not been specified.",
    scoreEligible: true,
    evidence: [
      {
        source: "research_studies",
        field: "design",
        recordIds: [studyId],
        summary: design ? "Study design is saved." : "Study design is empty.",
      },
    ],
    action: design
      ? null
      : { target: "builder", label: "Set study design", studyId },
  });

  const targetSample = Number(snapshot.study.target_sample_size || 0);
  const targetIsValid = Number.isFinite(targetSample) && targetSample > 0;
  checks.push({
    id: "design.target_sample",
    section: "design",
    label: "Target sample size configured",
    status: targetIsValid ? "complete" : "attention",
    severity: targetIsValid ? "info" : "medium",
    origin: "deterministic",
    detail: targetIsValid
      ? `Target sample size: ${targetSample}`
      : "No positive target sample size is configured.",
    scoreEligible: true,
    evidence: [
      {
        source: "research_studies",
        field: "target_sample_size",
        recordIds: [studyId],
        summary: targetIsValid
          ? "A positive recruitment target is saved."
          : "No valid positive recruitment target is saved.",
      },
    ],
    action: targetIsValid
      ? null
      : { target: "builder", label: "Set target sample size", studyId },
  });

  if (!enabled(snapshot, "consent")) {
    checks.push({
      id: "design.consent",
      section: "design",
      label: "Consent configuration",
      status: "not_applicable",
      severity: "info",
      origin: "deterministic",
      detail:
        "The Consent component is not enabled. PsyLattice does not infer whether consent is ethically required for this project.",
      scoreEligible: false,
      evidence: [
        {
          source: "research_studies",
          field: "components.consent",
          recordIds: [studyId],
          summary: "Consent component is disabled.",
        },
      ],
      action: null,
    });
  } else if (!snapshot.sourceState.consent.ok) {
    checks.push(
      unavailable(
        snapshot,
        "consent",
        "design.consent",
        "Consent configuration",
        { target: "ethics", label: "Open Ethics & Consent", studyId },
      ),
    );
  } else {
    const currentConsent = snapshot.consentVersions[0] || null;
    const method = text(currentConsent?.consent_method).toLowerCase();
    const participantInfo = text(currentConsent?.participant_information);
    const externalNote = text(currentConsent?.external_consent_note);
    const configured =
      Boolean(currentConsent) &&
      (method === "psylattice"
        ? Boolean(participantInfo)
        : method === "external"
          ? Boolean(externalNote)
          : Boolean(participantInfo || externalNote));

    checks.push({
      id: "design.consent",
      section: "design",
      label: "Consent configuration",
      status: configured ? "complete" : "attention",
      severity: configured ? "info" : "high",
      origin: "deterministic",
      detail: configured
        ? `Current consent configuration is present${method ? ` (${method})` : ""}.`
        : "Consent is enabled, but a complete current consent configuration was not detected.",
      scoreEligible: true,
      evidence: [
        {
          source: "study_consent_versions",
          recordIds: currentConsent ? [currentConsent.id] : [],
          summary: configured
            ? "Current consent version contains the expected configuration."
            : "No complete current consent configuration was detected.",
        },
      ],
      action: configured
        ? null
        : { target: "ethics", label: "Review consent", studyId },
    });
  }

  const componentChecks: Array<{
    component: string;
    source: StudyHealthSourceKey;
    id: string;
    label: string;
    count: () => number;
    sourceName: string;
    target: NonNullable<StudyHealthCheck["action"]>;
  }> = [
    {
      component: "demographics",
      source: "demographics",
      id: "design.demographics",
      label: "Demographic questions configured",
      count: () => snapshot.demographicQuestions.length,
      sourceName: "study_demographic_questions",
      target: { target: "builder", label: "Review demographics", studyId },
    },
    {
      component: "baseline",
      source: "measures",
      id: "design.baseline_measures",
      label: "Baseline measures configured",
      count: () =>
        snapshot.measures.filter(
          (row) => String(row.measurement_point) === "baseline",
        ).length,
      sourceName: "study_measures",
      target: { target: "builder", label: "Review baseline measures", studyId },
    },
    {
      component: "cognitive",
      source: "cognitive",
      id: "design.cognitive_tasks",
      label: "Cognitive tasks attached",
      count: () => snapshot.cognitiveTaskIds.length,
      sourceName: "study_cognitive_tasks",
      target: { target: "builder", label: "Review cognitive tasks", studyId },
    },
    {
      component: "ambulatory",
      source: "ambulatory",
      id: "design.ambulatory_protocol",
      label: "Ambulatory protocol configured",
      count: () =>
        snapshot.ambulatoryProtocols.filter((row) => row.is_enabled === true)
          .length,
      sourceName: "study_ambulatory_protocols",
      target: {
        target: "ambulatory",
        label: "Review Ambulatory Assessment",
        studyId,
      },
    },
  ];

  for (const definition of componentChecks) {
    if (!enabled(snapshot, definition.component)) {
      checks.push({
        id: definition.id,
        section: "design",
        label: definition.label,
        status: "not_applicable",
        severity: "info",
        origin: "deterministic",
        detail: `The ${definition.component} component is not enabled for this study.`,
        scoreEligible: false,
        evidence: [
          {
            source: "research_studies",
            field: `components.${definition.component}`,
            recordIds: [studyId],
            summary: `${definition.component} component is disabled.`,
          },
        ],
        action: null,
      });
      continue;
    }

    if (!snapshot.sourceState[definition.source].ok) {
      checks.push(
        unavailable(
          snapshot,
          definition.source,
          definition.id,
          definition.label,
          definition.target,
        ),
      );
      continue;
    }

    const count = definition.count();
    checks.push({
      id: definition.id,
      section: "design",
      label: definition.label,
      status: count > 0 ? "complete" : "attention",
      severity: count > 0 ? "info" : "high",
      origin: "deterministic",
      detail:
        count > 0
          ? `${count} configured item${count === 1 ? "" : "s"} detected.`
          : `The component is enabled, but no configured item was detected.`,
      scoreEligible: true,
      evidence: [
        {
          source: definition.sourceName,
          summary:
            count > 0
              ? `${count} linked/configured record${count === 1 ? "" : "s"} detected.`
              : "No linked/configured records detected.",
        },
      ],
      action: count > 0 ? null : definition.target,
    });
  }

  return checks;
}
