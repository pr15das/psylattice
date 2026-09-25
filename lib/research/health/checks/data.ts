import type {
  StudyHealthCheck,
  StudyHealthSnapshot,
} from "@/lib/research/health/types";

export function buildDataChecks(
  snapshot: StudyHealthSnapshot,
): StudyHealthCheck[] {
  const studyId = snapshot.study.id;

  if (!snapshot.sourceState.participants.ok) {
    return [
      {
        id: "data.participant_records",
        section: "data",
        label: "Study data records available",
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
            summary: "Source unavailable; no data-availability inference made.",
          },
        ],
        action: { target: "data", label: "Open Data Dashboard", studyId },
      },
    ];
  }

  const live = snapshot.participants.filter(
    (row) => row.is_test === false && row.status !== "withdrawn",
  );
  const test = snapshot.participants.filter((row) => row.is_test === true);

  if (live.length === 0) {
    return [
      {
        id: "data.participant_records",
        section: "data",
        label: "Study data records available",
        status:
          snapshot.study.status === "active" ? "in_progress" : "not_applicable",
        severity: "info",
        origin: "deterministic",
        detail:
          snapshot.study.status === "active"
            ? `No live participant records are available yet. ${test.length} test record${test.length === 1 ? "" : "s"} are excluded from this check.`
            : "No live participant records are available yet, so data-quality auditing is not applicable.",
        scoreEligible: false,
        evidence: [
          {
            source: "study_participants",
            summary: `${live.length} live and ${test.length} test participant records detected.`,
          },
        ],
        action:
          snapshot.study.status === "active"
            ? { target: "data", label: "Open Data Dashboard", studyId }
            : null,
      },
    ];
  }

  return [
    {
      id: "data.participant_records",
      section: "data",
      label: "Study data records available",
      status: "complete",
      severity: "info",
      origin: "deterministic",
      detail: `${live.length} live participant record${live.length === 1 ? "" : "s"} are available for downstream data checks. Test records are kept separate.`,
      scoreEligible: false,
      evidence: [
        {
          source: "study_participants",
          recordIds: live.map((row) => row.id),
          summary: `${live.length} non-test, non-withdrawn participant records detected.`,
        },
      ],
      action: { target: "data", label: "Open Data Dashboard", studyId },
    },
  ];
}
