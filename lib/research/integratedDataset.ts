export type IntegratedRow = Record<string, unknown>;

export type IntegratedDatasetGrain =
  | "participant"
  | "participant_day"
  | "checkin"
  | "cognitive_session";

export type IntegratedMatchMethod =
  | "exact"
  | "time_window"
  | "derived_date"
  | "participant"
  | "unmatched";

export type IntegratedDatasetSources = {
  participantRows: IntegratedRow[];
  ambulatoryRows: IntegratedRow[];
  participantDayRows: IntegratedRow[];
  cognitiveRows: IntegratedRow[];
};

export type IntegratedDatasetBuildOptions = {
  grain: IntegratedDatasetGrain;
  timeWindowMinutes?: number;
  preventCognitiveReuse?: boolean;
  allowDerivedDateMatching?: boolean;
};

export type IntegratedSourceDetection = {
  participantRows: number;
  ambulatoryRows: number;
  participantDayRows: number;
  cognitiveRows: number;
  availableSourceCount: number;
  canBuild: boolean;
  recommendedGrain: IntegratedDatasetGrain;
  availableGrains: IntegratedDatasetGrain[];
};

export type IntegratedDatasetDiagnostics = {
  participantCount: number;
  rowCount: number;
  variableCount: number;
  repeatedObservations: boolean;
  meanRowsPerParticipant: number;
  maxRowsPerParticipant: number;
  exactMatches: number;
  timeWindowMatches: number;
  derivedDateMatches: number;
  unmatchedPrimaryRows: number;
  matchedCognitiveSessions: number;
  unmatchedCognitiveSessions: number;
  warnings: string[];
};

export type IntegratedDatasetPreview = {
  grain: IntegratedDatasetGrain;
  rows: IntegratedRow[];
  columns: string[];
  detection: IntegratedSourceDetection;
  diagnostics: IntegratedDatasetDiagnostics;
  recommendedGroupVariable: string | null;
};

const DEFAULT_TIME_WINDOW_MINUTES = 30;

const PARTICIPANT_BASE_FIELDS = new Set([
  "participant",
  "participant_code",
  "is_test",
  "status",
  "enrolled_at",
  "completed_at",
]);

const AMBULATORY_METADATA_FIELDS = new Set([
  "participant",
  "is_test",
  "checkin_id",
  "prompt_instance_id",
  "local_date",
  "schedule_key",
  "checkin",
  "trigger_type",
  "trigger_source",
  "occurrence",
  "scheduled_for",
  "expires_at",
  "opened_at",
  "started_at",
  "completed_at",
  "response_latency_minutes",
  "prompt_status",
]);

const COGNITIVE_METADATA_FIELDS = new Set([
  "participant",
  "is_test",
  "administration_position",
  "cognitive_task",
  "version",
  "required",
  "session_status",
  "cognitive_session_id",
  "participant_session_id",
  "started_at",
  "completed_at",
  "condition_summary_json",
  "timing_quality_json",
  "device_info_json",
]);

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

function valueAsString(value: unknown): string {
  if (!hasValue(value)) return "";
  return String(value);
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function safeVariable(value: unknown): string {
  const safe = valueAsString(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return safe || "value";
}

function participantOf(row: IntegratedRow): string {
  return valueAsString(row.participant);
}

function dateOfTimestamp(value: unknown): string | null {
  if (!hasValue(value)) return null;
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) return null;

  // Deliberately UTC-based. This is only used for explicitly labelled
  // derived-date matching and must not be treated as a participant-local date.
  return date.toISOString().slice(0, 10);
}

function timestampMs(
  row: IntegratedRow,
  preferredFields: string[]
): number | null {
  for (const field of preferredFields) {
    if (!hasValue(row[field])) continue;
    const value = new Date(String(row[field])).getTime();
    if (Number.isFinite(value)) return value;
  }

  return null;
}

function copyParticipantLevelFields(
  target: IntegratedRow,
  person: IntegratedRow | undefined
) {
  if (!person) return;

  for (const [key, value] of Object.entries(person)) {
    if (key === "participant") continue;

    if (!(key in target)) {
      target[key] = value;
      continue;
    }

    if (
      hasValue(value) &&
      target[key] !== value &&
      !PARTICIPANT_BASE_FIELDS.has(key)
    ) {
      target[`person_${key}`] = value;
    }
  }
}

function copyPrefixedFields(
  target: IntegratedRow,
  source: IntegratedRow,
  prefix: string,
  omitted: Set<string>
) {
  for (const [key, value] of Object.entries(source)) {
    if (omitted.has(key)) continue;
    target[`${prefix}${key}`] = value;
  }
}

function collectColumns(rows: IntegratedRow[]): string[] {
  return Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
}

function rowsByParticipant(rows: IntegratedRow[]) {
  const map = new Map<string, IntegratedRow[]>();

  for (const row of rows) {
    const participant = participantOf(row);
    if (!participant) continue;
    const current = map.get(participant) || [];
    current.push(row);
    map.set(participant, current);
  }

  return map;
}

function participantRowMap(rows: IntegratedRow[]) {
  const map = new Map<string, IntegratedRow>();
  for (const row of rows) {
    const participant = participantOf(row);
    if (participant && !map.has(participant)) {
      map.set(participant, row);
    }
  }
  return map;
}

function aggregateNumericFields(
  rows: IntegratedRow[],
  prefix: string,
  omitted: Set<string>
): IntegratedRow {
  const values = new Map<string, number[]>();

  for (const row of rows) {
    for (const [key, raw] of Object.entries(row)) {
      if (omitted.has(key)) continue;
      const numeric = finiteNumber(raw);
      if (numeric === null) continue;
      const current = values.get(key) || [];
      current.push(numeric);
      values.set(key, current);
    }
  }

  const result: IntegratedRow = {};
  for (const [key, numbers] of values.entries()) {
    if (numbers.length === 0) continue;
    result[`${prefix}${key}`] =
      numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  return result;
}

function aggregateAmbulatoryRows(rows: IntegratedRow[]): IntegratedRow {
  if (rows.length === 0) return {};

  return {
    ema_checkins: rows.length,
    ...aggregateNumericFields(
      rows,
      "ema_mean_",
      AMBULATORY_METADATA_FIELDS
    ),
  };
}

function aggregateCognitiveRows(rows: IntegratedRow[]): IntegratedRow {
  if (rows.length === 0) return {};

  const result: IntegratedRow = {
    cognitive_sessions: rows.length,
  };

  const taskGroups = new Map<string, IntegratedRow[]>();

  for (const row of rows) {
    const task = safeVariable(row.cognitive_task || "task");
    const current = taskGroups.get(task) || [];
    current.push(row);
    taskGroups.set(task, current);
  }

  result.cognitive_tasks_observed = taskGroups.size;

  for (const [task, taskRows] of taskGroups.entries()) {
    Object.assign(
      result,
      aggregateNumericFields(
        taskRows,
        `cog_${task}_`,
        COGNITIVE_METADATA_FIELDS
      )
    );
  }

  return result;
}

function explicitCognitiveMatch(
  ambulatory: IntegratedRow,
  cognitive: IntegratedRow
): boolean {
  const ambulatoryCheckinId = valueAsString(ambulatory.checkin_id);
  const cognitiveCheckinId = valueAsString(cognitive.checkin_id);

  if (
    ambulatoryCheckinId &&
    cognitiveCheckinId &&
    ambulatoryCheckinId === cognitiveCheckinId
  ) {
    return true;
  }

  const ambulatoryPromptId = valueAsString(ambulatory.prompt_instance_id);
  const cognitivePromptId = valueAsString(cognitive.prompt_instance_id);

  return Boolean(
    ambulatoryPromptId &&
      cognitivePromptId &&
      ambulatoryPromptId === cognitivePromptId
  );
}

type NearestMatch = {
  row: IntegratedRow;
  index: number;
  differenceMinutes: number;
  method: "exact" | "time_window";
};

function findCognitiveForAmbulatory(
  ambulatory: IntegratedRow,
  cognitiveRows: IntegratedRow[],
  timeWindowMinutes: number,
  usedIndices?: Set<number>
): NearestMatch | null {
  const participant = participantOf(ambulatory);
  if (!participant) return null;

  for (let index = 0; index < cognitiveRows.length; index += 1) {
    if (usedIndices?.has(index)) continue;
    const cognitive = cognitiveRows[index];
    if (participantOf(cognitive) !== participant) continue;

    if (explicitCognitiveMatch(ambulatory, cognitive)) {
      return {
        row: cognitive,
        index,
        differenceMinutes: 0,
        method: "exact",
      };
    }
  }

  const ambulatoryTime = timestampMs(ambulatory, [
    "completed_at",
    "started_at",
    "scheduled_for",
    "opened_at",
  ]);

  if (ambulatoryTime === null) return null;

  let best: NearestMatch | null = null;

  cognitiveRows.forEach((cognitive, index) => {
    if (usedIndices?.has(index)) return;
    if (participantOf(cognitive) !== participant) return;

    const cognitiveTime = timestampMs(cognitive, [
      "started_at",
      "completed_at",
      "created_at",
    ]);
    if (cognitiveTime === null) return;

    const differenceMinutes =
      Math.abs(cognitiveTime - ambulatoryTime) / 60000;

    if (differenceMinutes > timeWindowMinutes) return;

    if (!best || differenceMinutes < best.differenceMinutes) {
      best = {
        row: cognitive,
        index,
        differenceMinutes,
        method: "time_window",
      };
    }
  });

  return best;
}

function findAmbulatoryForCognitive(
  cognitive: IntegratedRow,
  ambulatoryRows: IntegratedRow[],
  timeWindowMinutes: number,
  usedIndices?: Set<number>
): NearestMatch | null {
  const participant = participantOf(cognitive);
  if (!participant) return null;

  for (let index = 0; index < ambulatoryRows.length; index += 1) {
    if (usedIndices?.has(index)) continue;
    const ambulatory = ambulatoryRows[index];
    if (participantOf(ambulatory) !== participant) continue;

    if (explicitCognitiveMatch(ambulatory, cognitive)) {
      return {
        row: ambulatory,
        index,
        differenceMinutes: 0,
        method: "exact",
      };
    }
  }

  const cognitiveTime = timestampMs(cognitive, [
    "started_at",
    "completed_at",
    "created_at",
  ]);

  if (cognitiveTime === null) return null;

  let best: NearestMatch | null = null;

  ambulatoryRows.forEach((ambulatory, index) => {
    if (usedIndices?.has(index)) return;
    if (participantOf(ambulatory) !== participant) return;

    const ambulatoryTime = timestampMs(ambulatory, [
      "completed_at",
      "started_at",
      "scheduled_for",
      "opened_at",
    ]);
    if (ambulatoryTime === null) return;

    const differenceMinutes =
      Math.abs(cognitiveTime - ambulatoryTime) / 60000;

    if (differenceMinutes > timeWindowMinutes) return;

    if (!best || differenceMinutes < best.differenceMinutes) {
      best = {
        row: ambulatory,
        index,
        differenceMinutes,
        method: "time_window",
      };
    }
  });

  return best;
}

function dayKey(participant: string, date: string) {
  return `${participant}\u0000${date}`;
}

function splitDayKey(key: string) {
  const [participant, date] = key.split("\u0000");
  return { participant, date };
}

function buildParticipantRows(
  sources: IntegratedDatasetSources
): IntegratedRow[] {
  const participants = new Set<string>();

  for (const collection of [
    sources.participantRows,
    sources.ambulatoryRows,
    sources.participantDayRows,
    sources.cognitiveRows,
  ]) {
    collection.forEach((row) => {
      const participant = participantOf(row);
      if (participant) participants.add(participant);
    });
  }

  const personMap = participantRowMap(sources.participantRows);
  const ambulatoryMap = rowsByParticipant(sources.ambulatoryRows);
  const cognitiveMap = rowsByParticipant(sources.cognitiveRows);

  return Array.from(participants).map((participant) => {
    const row: IntegratedRow = {
      participant,
      integration_grain: "participant",
    };

    copyParticipantLevelFields(row, personMap.get(participant));
    Object.assign(
      row,
      aggregateAmbulatoryRows(ambulatoryMap.get(participant) || [])
    );
    Object.assign(
      row,
      aggregateCognitiveRows(cognitiveMap.get(participant) || [])
    );

    return row;
  });
}

function buildParticipantDayRows(
  sources: IntegratedDatasetSources,
  allowDerivedDateMatching: boolean
): IntegratedRow[] {
  const personMap = participantRowMap(sources.participantRows);
  const baseDayRows = new Map<string, IntegratedRow>();
  const ambulatoryByDay = new Map<string, IntegratedRow[]>();
  const cognitiveByDay = new Map<string, IntegratedRow[]>();
  const allKeys = new Set<string>();

  for (const row of sources.participantDayRows) {
    const participant = participantOf(row);
    const date = valueAsString(row.local_date);
    if (!participant || !date) continue;

    const key = dayKey(participant, date);
    baseDayRows.set(key, row);
    allKeys.add(key);
  }

  for (const row of sources.ambulatoryRows) {
    const participant = participantOf(row);
    const date = valueAsString(row.local_date);
    if (!participant || !date) continue;

    const key = dayKey(participant, date);
    const current = ambulatoryByDay.get(key) || [];
    current.push(row);
    ambulatoryByDay.set(key, current);
    allKeys.add(key);
  }

  if (allowDerivedDateMatching) {
    for (const row of sources.cognitiveRows) {
      const participant = participantOf(row);
      const date =
        dateOfTimestamp(row.started_at) ||
        dateOfTimestamp(row.completed_at);

      if (!participant || !date) continue;

      const key = dayKey(participant, date);
      const current = cognitiveByDay.get(key) || [];
      current.push(row);
      cognitiveByDay.set(key, current);
      allKeys.add(key);
    }
  }

  return Array.from(allKeys)
    .sort()
    .map((key) => {
      const { participant, date } = splitDayKey(key);
      const base = baseDayRows.get(key);
      const ambulatory = ambulatoryByDay.get(key) || [];
      const cognitive = cognitiveByDay.get(key) || [];

      const row: IntegratedRow = {
        ...(base || {}),
        participant,
        local_date: date,
        integration_grain: "participant_day",
      };

      copyParticipantLevelFields(row, personMap.get(participant));

      if (ambulatory.length > 0) {
        Object.assign(row, aggregateAmbulatoryRows(ambulatory));
      }

      if (cognitive.length > 0) {
        Object.assign(row, aggregateCognitiveRows(cognitive));
        row.integration_cognitive_match = "derived_date";
        row.integration_cognitive_date_basis =
          "UTC date derived from cognitive session timestamp";
      } else if (sources.cognitiveRows.length > 0) {
        row.integration_cognitive_match = allowDerivedDateMatching
          ? "unmatched"
          : "not_evaluated";
      }

      return row;
    });
}

function buildCheckinRows(
  sources: IntegratedDatasetSources,
  timeWindowMinutes: number,
  preventCognitiveReuse: boolean
): IntegratedRow[] {
  const personMap = participantRowMap(sources.participantRows);
  const usedCognitive = new Set<number>();

  return sources.ambulatoryRows.map((ambulatory) => {
    const participant = participantOf(ambulatory);
    const row: IntegratedRow = {
      ...ambulatory,
      integration_grain: "checkin",
    };

    copyParticipantLevelFields(row, personMap.get(participant));

    const match = findCognitiveForAmbulatory(
      ambulatory,
      sources.cognitiveRows,
      timeWindowMinutes,
      preventCognitiveReuse ? usedCognitive : undefined
    );

    if (!match) {
      row.integration_cognitive_match = "unmatched";
      row.integration_cognitive_time_difference_minutes = "";
      return row;
    }

    if (preventCognitiveReuse) {
      usedCognitive.add(match.index);
    }

    copyPrefixedFields(
      row,
      match.row,
      "cognitive_",
      new Set(["participant", "is_test"])
    );

    row.integration_cognitive_match = match.method;
    row.integration_cognitive_time_difference_minutes =
      Math.round(match.differenceMinutes * 10) / 10;

    return row;
  });
}

function buildCognitiveSessionRows(
  sources: IntegratedDatasetSources,
  timeWindowMinutes: number,
  preventCognitiveReuse: boolean
): IntegratedRow[] {
  const personMap = participantRowMap(sources.participantRows);
  const usedAmbulatory = new Set<number>();

  return sources.cognitiveRows.map((cognitive) => {
    const participant = participantOf(cognitive);
    const row: IntegratedRow = {
      ...cognitive,
      integration_grain: "cognitive_session",
    };

    copyParticipantLevelFields(row, personMap.get(participant));

    const match = findAmbulatoryForCognitive(
      cognitive,
      sources.ambulatoryRows,
      timeWindowMinutes,
      preventCognitiveReuse ? usedAmbulatory : undefined
    );

    if (!match) {
      row.integration_ema_match = "unmatched";
      row.integration_ema_time_difference_minutes = "";
      return row;
    }

    if (preventCognitiveReuse) {
      usedAmbulatory.add(match.index);
    }

    copyPrefixedFields(
      row,
      match.row,
      "ema_",
      new Set(["participant", "is_test"])
    );

    row.integration_ema_match = match.method;
    row.integration_ema_time_difference_minutes =
      Math.round(match.differenceMinutes * 10) / 10;

    return row;
  });
}

export function detectIntegratedDatasetSources(
  sources: IntegratedDatasetSources
): IntegratedSourceDetection {
  const participantRows = sources.participantRows.length;
  const ambulatoryRows = sources.ambulatoryRows.length;
  const participantDayRows = sources.participantDayRows.length;
  const cognitiveRows = sources.cognitiveRows.length;

  const availableSourceCount = [
    participantRows > 0,
    ambulatoryRows > 0,
    cognitiveRows > 0,
  ].filter(Boolean).length;

  const availableGrains: IntegratedDatasetGrain[] = [];

  if (participantRows > 0 || ambulatoryRows > 0 || cognitiveRows > 0) {
    availableGrains.push("participant");
  }

  if (ambulatoryRows > 0 || participantDayRows > 0) {
    availableGrains.push("participant_day", "checkin");
  }

  if (cognitiveRows > 0) {
    availableGrains.push("cognitive_session");
  }

  let recommendedGrain: IntegratedDatasetGrain = "participant";

  if (ambulatoryRows > 0 && cognitiveRows > 0) {
    recommendedGrain = "checkin";
  } else if (ambulatoryRows > 0 || participantDayRows > 0) {
    recommendedGrain = "participant_day";
  } else if (cognitiveRows > 0) {
    recommendedGrain = "cognitive_session";
  }

  return {
    participantRows,
    ambulatoryRows,
    participantDayRows,
    cognitiveRows,
    availableSourceCount,
    canBuild: availableSourceCount >= 2,
    recommendedGrain,
    availableGrains: Array.from(new Set(availableGrains)),
  };
}

function buildDiagnostics(
  rows: IntegratedRow[],
  sources: IntegratedDatasetSources,
  grain: IntegratedDatasetGrain,
  allowDerivedDateMatching: boolean
): IntegratedDatasetDiagnostics {
  const participants = rows
    .map(participantOf)
    .filter(Boolean);

  const uniqueParticipants = new Set(participants);
  const rowsPerParticipant = new Map<string, number>();

  for (const participant of participants) {
    rowsPerParticipant.set(
      participant,
      (rowsPerParticipant.get(participant) || 0) + 1
    );
  }

  const counts = Array.from(rowsPerParticipant.values());
  const meanRowsPerParticipant =
    counts.length > 0
      ? counts.reduce((sum, value) => sum + value, 0) / counts.length
      : 0;
  const maxRowsPerParticipant =
    counts.length > 0 ? Math.max(...counts) : 0;

  let exactMatches = 0;
  let timeWindowMatches = 0;
  let derivedDateMatches = 0;
  let unmatchedPrimaryRows = 0;
  const matchedCognitiveIds = new Set<string>();

  for (const row of rows) {
    const method = valueAsString(
      row.integration_cognitive_match || row.integration_ema_match
    ) as IntegratedMatchMethod;

    if (method === "exact") exactMatches += 1;
    else if (method === "time_window") timeWindowMatches += 1;
    else if (method === "derived_date") derivedDateMatches += 1;
    else if (method === "unmatched") unmatchedPrimaryRows += 1;

    const cognitiveId =
      valueAsString(row.cognitive_cognitive_session_id) ||
      (grain === "cognitive_session"
        ? valueAsString(row.cognitive_session_id)
        : "");

    if (cognitiveId && method !== "unmatched") {
      matchedCognitiveIds.add(cognitiveId);
    }
  }

  const warnings: string[] = [];

  if (grain !== "participant" && rows.length > uniqueParticipants.size) {
    warnings.push(
      "Repeated observations detected: multiple rows belong to the same participant. Analyses that assume independent rows may be inappropriate."
    );
  }

  if (
    grain === "participant_day" &&
    sources.cognitiveRows.length > 0 &&
    !allowDerivedDateMatching
  ) {
    warnings.push(
      "Cognitive sessions were not attached to participant-day rows because the current cognitive dataset does not expose a participant-local date. Enable derived-date matching only after reviewing its timezone limitation."
    );
  }

  if (grain === "participant_day" && allowDerivedDateMatching) {
    warnings.push(
      "Participant-day cognitive matching uses the UTC calendar date derived from cognitive session timestamps. This is a transparent derived match, not an exact participant-local date link."
    );
  }

  if (timeWindowMatches > 0) {
    warnings.push(
      "Some cognitive/EMA links were created by nearest-time matching. Review the time differences before treating those rows as protocol-linked observations."
    );
  }

  const columns = collectColumns(rows);

  return {
    participantCount: uniqueParticipants.size,
    rowCount: rows.length,
    variableCount: columns.length,
    repeatedObservations: rows.length > uniqueParticipants.size,
    meanRowsPerParticipant:
      Math.round(meanRowsPerParticipant * 100) / 100,
    maxRowsPerParticipant,
    exactMatches,
    timeWindowMatches,
    derivedDateMatches,
    unmatchedPrimaryRows,
    matchedCognitiveSessions: matchedCognitiveIds.size,
    unmatchedCognitiveSessions: Math.max(
      sources.cognitiveRows.length - matchedCognitiveIds.size,
      0
    ),
    warnings,
  };
}

export function buildIntegratedDatasetPreview(
  sources: IntegratedDatasetSources,
  options: IntegratedDatasetBuildOptions
): IntegratedDatasetPreview {
  const detection = detectIntegratedDatasetSources(sources);
  const timeWindowMinutes = Math.max(
    1,
    Math.min(
      Number(options.timeWindowMinutes) || DEFAULT_TIME_WINDOW_MINUTES,
      24 * 60
    )
  );
  const preventCognitiveReuse =
    options.preventCognitiveReuse !== false;
  const allowDerivedDateMatching =
    options.allowDerivedDateMatching === true;

  let rows: IntegratedRow[];

  switch (options.grain) {
    case "participant":
      rows = buildParticipantRows(sources);
      break;

    case "participant_day":
      rows = buildParticipantDayRows(
        sources,
        allowDerivedDateMatching
      );
      break;

    case "checkin":
      rows = buildCheckinRows(
        sources,
        timeWindowMinutes,
        preventCognitiveReuse
      );
      break;

    case "cognitive_session":
      rows = buildCognitiveSessionRows(
        sources,
        timeWindowMinutes,
        preventCognitiveReuse
      );
      break;

    default:
      rows = [];
  }

  const columns = collectColumns(rows);
  const diagnostics = buildDiagnostics(
    rows,
    sources,
    options.grain,
    allowDerivedDateMatching
  );

  return {
    grain: options.grain,
    rows,
    columns,
    detection,
    diagnostics,
    recommendedGroupVariable: diagnostics.repeatedObservations
      ? "participant"
      : null,
  };
}

export function integratedGrainLabel(
  grain: IntegratedDatasetGrain
): string {
  switch (grain) {
    case "participant":
      return "Participant";
    case "participant_day":
      return "Participant × day";
    case "checkin":
      return "Participant × check-in";
    case "cognitive_session":
      return "Participant × cognitive session";
  }
}
