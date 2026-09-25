import type {
  StudyHealthCheck,
  StudyHealthSnapshot,
} from "@/lib/research/health/types";

const completedStatuses = new Set(["completed"]);
const baselineCompleteStatuses = new Set(["baseline_complete"]);

export function buildRecruitmentChecks(
  snapshot: StudyHealthSnapshot,
): StudyHealthCheck[] {
  const studyId = snapshot.study.id;
  const checks: StudyHealthCheck[] = [];
  const studyIsActive = snapshot.study.status === "active";

  if (!snapshot.sourceState.links.ok) {
    checks.push({
      id: "recruitment.live_link",
      section: "recruitment",
      label: "Live recruitment link",
      status: "unavailable",
      severity: "info",
      origin: "deterministic",
      detail:
        snapshot.sourceState.links.reason ||
        "Recruitment links could not be read, so no judgement was produced.",
      scoreEligible: false,
      evidence: [
        {
          source: "study_links",
          summary: "Source unavailable; no recruitment-link inference made.",
        },
      ],
      action: { target: "links", label: "Open Participant Links", studyId },
    });
  } else if (!studyIsActive) {
    checks.push({
      id: "recruitment.live_link",
      section: "recruitment",
      label: "Live recruitment link",
      status: "not_applicable",
      severity: "info",
      origin: "deterministic",
      detail:
        "The study is not currently active, so a live recruitment link is not required by this check.",
      scoreEligible: false,
      evidence: [
        {
          source: "research_studies",
          field: "status",
          recordIds: [studyId],
          summary: `Current study status: ${snapshot.study.status || "unknown"}.`,
        },
      ],
      action: null,
    });
  } else {
    const activeLiveLinks = snapshot.links.filter(
      (row) => row.is_test_link === false && row.status === "active",
    );

    checks.push({
      id: "recruitment.live_link",
      section: "recruitment",
      label: "Live recruitment link",
      status: activeLiveLinks.length > 0 ? "complete" : "attention",
      severity: activeLiveLinks.length > 0 ? "info" : "high",
      origin: "deterministic",
      detail:
        activeLiveLinks.length > 0
          ? `${activeLiveLinks.length} active live recruitment link${activeLiveLinks.length === 1 ? "" : "s"} detected.`
          : "The study is active, but no active live recruitment link was detected.",
      scoreEligible: true,
      evidence: [
        {
          source: "study_links",
          recordIds: activeLiveLinks.map((row) => row.id),
          summary:
            activeLiveLinks.length > 0
              ? "At least one non-test active link exists."
              : "No non-test active link exists.",
        },
      ],
      action:
        activeLiveLinks.length > 0
          ? null
          : { target: "links", label: "Create or activate a participant link", studyId },
    });
  }

  if (!snapshot.sourceState.participants.ok) {
    checks.push({
      id: "recruitment.target_progress",
      section: "recruitment",
      label: "Recruitment progress",
      status: "unavailable",
      severity: "info",
      origin: "deterministic",
      detail:
        snapshot.sourceState.participants.reason ||
        "Participant records could not be read.",
      scoreEligible: false,
      evidence: [
        {
          source: "study_participants",
          summary: "Source unavailable; recruitment progress was not inferred.",
        },
      ],
      action: { target: "participants", label: "Open Participants", studyId },
    });
    return checks;
  }

  const liveParticipants = snapshot.participants.filter(
    (row) => row.is_test === false && row.status !== "withdrawn",
  );
  const target = Number(snapshot.study.target_sample_size || 0);

  if (!studyIsActive && liveParticipants.length === 0) {
    checks.push({
      id: "recruitment.target_progress",
      section: "recruitment",
      label: "Recruitment progress",
      status: "not_applicable",
      severity: "info",
      origin: "deterministic",
      detail:
        "No live recruitment is underway. Test participants are excluded from this metric.",
      scoreEligible: false,
      evidence: [
        {
          source: "study_participants",
          summary: "No non-test, non-withdrawn participant records detected.",
        },
      ],
      action: null,
    });
  } else if (!(Number.isFinite(target) && target > 0)) {
    checks.push({
      id: "recruitment.target_progress",
      section: "recruitment",
      label: "Recruitment progress",
      status: "unavailable",
      severity: "info",
      origin: "deterministic",
      detail:
        "Recruitment progress cannot be evaluated against a target until a positive target sample size is saved.",
      scoreEligible: false,
      evidence: [
        {
          source: "research_studies",
          field: "target_sample_size",
          recordIds: [studyId],
          summary: "No valid positive target sample size is available.",
        },
      ],
      action: { target: "builder", label: "Set target sample size", studyId },
    });
  } else {
    const reached = liveParticipants.length >= target;
    checks.push({
      id: "recruitment.target_progress",
      section: "recruitment",
      label: "Recruitment progress",
      status: reached ? "complete" : "in_progress",
      severity: "info",
      origin: "deterministic",
      detail: reached
        ? `${liveParticipants.length} eligible live participant records meet or exceed the target of ${target}.`
        : `${liveParticipants.length} of ${target} target participant records are currently enrolled. This is progress, not a research-quality judgement.`,
      scoreEligible: false,
      evidence: [
        {
          source: "study_participants",
          recordIds: liveParticipants.map((row) => row.id),
          summary: `${liveParticipants.length} non-test, non-withdrawn participant records detected.`,
        },
        {
          source: "research_studies",
          field: "target_sample_size",
          recordIds: [studyId],
          summary: `Saved target sample size: ${target}.`,
        },
      ],
      action: reached
        ? null
        : { target: "participants", label: "Review participants", studyId },
    });
  }

  const completed = liveParticipants.filter((row) =>
    completedStatuses.has(row.status),
  ).length;
  const baselineComplete = liveParticipants.filter((row) =>
    baselineCompleteStatuses.has(row.status),
  ).length;

  if (liveParticipants.length > 0) {
    checks.push({
      id: "recruitment.completion_state",
      section: "recruitment",
      label: "Participant completion state",
      status:
        completed + baselineComplete > 0 ? "complete" : "in_progress",
      severity: "info",
      origin: "deterministic",
      detail:
        completed + baselineComplete > 0
          ? `${completed} completed and ${baselineComplete} baseline-complete live participant records detected.`
          : "Live participant records exist, but none are yet marked completed or baseline-complete.",
      scoreEligible: false,
      evidence: [
        {
          source: "study_participants",
          summary:
            "Completion state is derived only from saved participant status values.",
        },
      ],
      action: {
        target: "participants",
        label: "Review participant status",
        studyId,
      },
    });
  }

  return checks;
}
