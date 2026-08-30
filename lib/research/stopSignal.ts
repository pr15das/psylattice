export type StopSignalSettings = {
  stop_probability: number;
  initial_ssd_ms: number;
  staircase_step_ms: number;
  min_ssd_ms: number;
  max_ssd_ms: number;
  practice_trials: number;
  experimental_trials: number;
  go_deadline_ms: number;
  fixation_ms: number;
  iti_ms: number;
  stop_signal_duration_ms: number;
  max_consecutive_stops: number;
  stop_signal_text: string;
  stop_signal_color: string;
};

export type StopSignalRuntimeData = {
  paradigm: "stop_signal";
  trial_type: "go" | "stop";
  requested_ssd_ms: number | null;
  actual_ssd_ms: number | null;
  ssd_after_trial_ms: number | null;
  stop_signal_presented: boolean;
  stop_success: boolean | null;
  response_before_stop_signal: boolean | null;
  go_correct: boolean | null;
  go_correct_response: string | null;
  go_stimulus: string;
};

export type StopSignalResultLike = {
  block_type: string;
  reaction_time_ms: number | null;
  response: string | null;
  correct: boolean | null;
  runtime_data?: Record<string, unknown> | StopSignalRuntimeData;
};

export type StopSignalSummary = {
  paradigm: "stop_signal";
  method: "integration_with_go_omission_replacement";
  go_trials: number;
  stop_trials: number;
  stop_successes: number;
  stop_failures: number;
  stop_success_rate: number | null;
  p_respond_signal: number | null;
  go_responses: number;
  go_omissions: number;
  go_omission_rate: number | null;
  go_choice_errors: number;
  go_accuracy: number | null;
  mean_go_rt_ms: number | null;
  median_go_rt_ms: number | null;
  mean_failed_stop_rt_ms: number | null;
  mean_ssd_ms: number | null;
  ssrt_integration_ms: number | null;
  ssrt_nth_go_rt_ms: number | null;
  ssrt_nth_index: number | null;
  experimental_stop_trials: number;
  quality_flags: Array<{
    code: string;
    level: "info" | "caution";
    message: string;
  }>;
};

const DEFAULTS: StopSignalSettings = {
  stop_probability: 0.25,
  initial_ssd_ms: 250,
  staircase_step_ms: 50,
  min_ssd_ms: 50,
  max_ssd_ms: 900,
  practice_trials: 16,
  experimental_trials: 200,
  go_deadline_ms: 1000,
  fixation_ms: 500,
  iti_ms: 700,
  stop_signal_duration_ms: 250,
  max_consecutive_stops: 2,
  stop_signal_text: "STOP",
  stop_signal_color: "#ef4444",
};

function finite(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function seedHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function stopSignalSeededRandom(seedText: string) {
  let state = seedHash(seedText) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export function stopSignalSettingsFromTaskConfig(taskConfig: Record<string, unknown> | null | undefined): StopSignalSettings {
  const source =
    taskConfig &&
    typeof taskConfig.stop_signal === "object" &&
    taskConfig.stop_signal !== null
      ? (taskConfig.stop_signal as Record<string, unknown>)
      : {};

  const goDeadline = Math.max(250, finite(source.go_deadline_ms, DEFAULTS.go_deadline_ms));
  const minSsd = Math.max(0, finite(source.min_ssd_ms, DEFAULTS.min_ssd_ms));
  const configuredMaxSsd = Math.max(minSsd, finite(source.max_ssd_ms, DEFAULTS.max_ssd_ms));
  const maxSsd = Math.max(minSsd, Math.min(configuredMaxSsd, Math.max(minSsd, goDeadline - 16)));

  return {
    stop_probability: clamp(finite(source.stop_probability, DEFAULTS.stop_probability), 0.05, 0.5),
    initial_ssd_ms: clamp(finite(source.initial_ssd_ms, DEFAULTS.initial_ssd_ms), minSsd, maxSsd),
    staircase_step_ms: Math.max(1, finite(source.staircase_step_ms, DEFAULTS.staircase_step_ms)),
    min_ssd_ms: minSsd,
    max_ssd_ms: maxSsd,
    practice_trials: Math.max(4, Math.round(finite(source.practice_trials, DEFAULTS.practice_trials))),
    experimental_trials: Math.max(20, Math.round(finite(source.experimental_trials, DEFAULTS.experimental_trials))),
    go_deadline_ms: goDeadline,
    fixation_ms: Math.max(0, finite(source.fixation_ms, DEFAULTS.fixation_ms)),
    iti_ms: Math.max(0, finite(source.iti_ms, DEFAULTS.iti_ms)),
    stop_signal_duration_ms: Math.max(16, finite(source.stop_signal_duration_ms, DEFAULTS.stop_signal_duration_ms)),
    max_consecutive_stops: Math.max(1, Math.round(finite(source.max_consecutive_stops, DEFAULTS.max_consecutive_stops))),
    stop_signal_text:
      typeof source.stop_signal_text === "string" && source.stop_signal_text.trim()
        ? source.stop_signal_text.trim().slice(0, 12)
        : DEFAULTS.stop_signal_text,
    stop_signal_color:
      typeof source.stop_signal_color === "string" && source.stop_signal_color.trim()
        ? source.stop_signal_color.trim()
        : DEFAULTS.stop_signal_color,
  };
}

export function isStopSignalRuntime(runtimeEngine: unknown, taskConfig?: Record<string, unknown> | null) {
  const engine = typeof runtimeEngine === "string" ? runtimeEngine.toLowerCase() : "";
  const runtime =
    taskConfig && typeof taskConfig.runtime === "string"
      ? String(taskConfig.runtime).toLowerCase()
      : "";
  const template =
    taskConfig && typeof taskConfig.template_key === "string"
      ? String(taskConfig.template_key).toLowerCase()
      : "";

  return (
    engine === "psylattice_stop_signal_v1" ||
    engine === "stop_signal" ||
    runtime === "stop_signal" ||
    template === "stop_signal"
  );
}

export function nextStopSignalSsd(currentSsd: number, stopSuccess: boolean, settings: StopSignalSettings) {
  const next = stopSuccess
    ? currentSsd + settings.staircase_step_ms
    : currentSsd - settings.staircase_step_ms;
  return clamp(next, settings.min_ssd_ms, settings.max_ssd_ms);
}

export type StopSignalPlanItem<T> = {
  source: T;
  trial_type: "go" | "stop";
  sequence_index: number;
};

export function planStopSignalTrials<T>(
  baseTrials: T[],
  totalTrials: number,
  stopProbability: number,
  maxConsecutiveStops: number,
  seed: string
): StopSignalPlanItem<T>[] {
  if (!baseTrials.length || totalTrials < 1) return [];

  const random = stopSignalSeededRandom(seed);
  const total = Math.max(1, Math.round(totalTrials));
  const stopCount = Math.min(total - 1, Math.max(1, Math.round(total * clamp(stopProbability, 0.05, 0.5))));
  const goCount = total - stopCount;

  const labels: Array<"go" | "stop"> = [
    ...Array.from({ length: goCount }, () => "go" as const),
    ...Array.from({ length: stopCount }, () => "stop" as const),
  ];

  let trialTypes = shuffle(labels, random);

  // Try to respect the stop-run constraint without changing the requested stop count.
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const candidate = shuffle(labels, random);
    let consecutiveStops = 0;
    let valid = true;
    for (const kind of candidate) {
      consecutiveStops = kind === "stop" ? consecutiveStops + 1 : 0;
      if (consecutiveStops > Math.max(1, maxConsecutiveStops)) {
        valid = false;
        break;
      }
    }
    trialTypes = candidate;
    if (valid) break;
  }

  // Cycle through shuffled go mappings so left/right (or other researcher-defined
  // go choices) remain approximately balanced across the generated sequence.
  const sourcePool = shuffle(baseTrials, random);
  let sourceIndex = 0;

  return trialTypes.map((trialType, sequenceIndex) => {
    if (sourceIndex > 0 && sourceIndex % sourcePool.length === 0) {
      sourcePool.splice(0, sourcePool.length, ...shuffle(sourcePool, random));
    }
    const source = sourcePool[sourceIndex % sourcePool.length];
    sourceIndex += 1;
    return { source, trial_type: trialType, sequence_index: sequenceIndex + 1 };
  });
}

function runtimeData(result: StopSignalResultLike): StopSignalRuntimeData | null {
  const data = result.runtime_data;
  if (!data || typeof data !== "object") return null;
  if ((data as Record<string, unknown>).paradigm !== "stop_signal") return null;
  return data as StopSignalRuntimeData;
}

export function buildStopSignalSummary(
  allResults: StopSignalResultLike[],
  settings: StopSignalSettings
): StopSignalSummary {
  // SSRT is estimated from the experimental block only; practice is retained in
  // raw data but deliberately excluded from the inferential task summary.
  const results = allResults.filter((result) => result.block_type !== "practice");
  const goRows = results.filter((result) => runtimeData(result)?.trial_type === "go");
  const stopRows = results.filter((result) => runtimeData(result)?.trial_type === "stop");

  const goResponses = goRows.filter((row) => row.response !== null);
  const goOmissions = goRows.filter((row) => row.response === null);
  const goChoiceErrors = goRows.filter((row) => {
    const data = runtimeData(row);
    return row.response !== null && data?.go_correct === false;
  });

  const goRts = goResponses
    .map((row) => row.reaction_time_ms)
    .filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);

  const failedStopRows = stopRows.filter((row) => runtimeData(row)?.stop_success === false);
  const failedStopRts = failedStopRows
    .map((row) => row.reaction_time_ms)
    .filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);

  const stopSuccesses = stopRows.filter((row) => runtimeData(row)?.stop_success === true).length;
  const stopFailures = stopRows.length - stopSuccesses;
  const pRespondSignal = stopRows.length ? stopFailures / stopRows.length : null;

  const ssds = stopRows
    .map((row) => runtimeData(row)?.actual_ssd_ms ?? runtimeData(row)?.requested_ssd_ms ?? null)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const meanSsd = mean(ssds);

  let ssrt: number | null = null;
  let nthRt: number | null = null;
  let nthIndex: number | null = null;

  // Consensus recommendation: refrain from estimating individual SSRT when
  // p(respond|signal) is substantially outside .25-.75.
  const inhibitionFunctionUsable =
    pRespondSignal !== null &&
    pRespondSignal >= 0.25 &&
    pRespondSignal <= 0.75 &&
    goRows.length > 0 &&
    meanSsd !== null;

  if (inhibitionFunctionUsable) {
    const integrationDistribution = goRows
      .map((row) => {
        const rt = row.reaction_time_ms;
        return rt !== null && Number.isFinite(rt) && rt >= 0
          ? rt
          : settings.go_deadline_ms;
      })
      .sort((a, b) => a - b);

    const rawIndex = Math.ceil(integrationDistribution.length * (pRespondSignal as number));
    const oneBasedIndex = Math.min(integrationDistribution.length, Math.max(1, rawIndex));
    nthIndex = oneBasedIndex;
    nthRt = integrationDistribution[oneBasedIndex - 1] ?? null;

    if (nthRt !== null) {
      ssrt = nthRt - (meanSsd as number);
      if (!Number.isFinite(ssrt) || ssrt < 0) ssrt = null;
    }
  }

  const qualityFlags: StopSignalSummary["quality_flags"] = [];

  if (stopRows.length < 50) {
    qualityFlags.push({
      code: "few_stop_trials",
      level: "caution",
      message:
        "Fewer than 50 experimental stop trials were collected. SSRT may be less reliable; the consensus guide recommends sufficient stop trials and commonly uses at least 50 under favourable conditions.",
    });
  }

  if (pRespondSignal !== null && (pRespondSignal < 0.25 || pRespondSignal > 0.75)) {
    qualityFlags.push({
      code: "inhibition_probability_outside_recommended_range",
      level: "caution",
      message:
        "p(respond|signal) is outside 0.25–0.75, so PsyLattice does not report an individual SSRT estimate for this run.",
    });
  } else if (pRespondSignal !== null && Math.abs(pRespondSignal - 0.5) > 0.1) {
    qualityFlags.push({
      code: "tracking_not_near_half",
      level: "info",
      message:
        "Stop responding probability is not close to 0.50. Review staircase convergence and participant slowing.",
    });
  }

  if (goOmissions.length > 0) {
    qualityFlags.push({
      code: "go_omissions_present",
      level: "info",
      message:
        `${goOmissions.length} go omission${goOmissions.length === 1 ? "" : "s"} occurred. PsyLattice replaced omissions with the configured maximum go RT for the integration-method SSRT calculation.`,
    });
  }

  const meanGo = mean(goRts);
  const meanFailedStop = mean(failedStopRts);
  if (meanGo !== null && meanFailedStop !== null && meanFailedStop >= meanGo) {
    qualityFlags.push({
      code: "failed_stop_rt_not_faster_than_go",
      level: "caution",
      message:
        "Mean failed-stop RT is not faster than mean go RT. Review race-model assumptions and data quality before interpreting SSRT.",
    });
  }

  return {
    paradigm: "stop_signal",
    method: "integration_with_go_omission_replacement",
    go_trials: goRows.length,
    stop_trials: stopRows.length,
    stop_successes: stopSuccesses,
    stop_failures: stopFailures,
    stop_success_rate: stopRows.length ? round(stopSuccesses / stopRows.length, 4) : null,
    p_respond_signal: pRespondSignal === null ? null : round(pRespondSignal, 4),
    go_responses: goResponses.length,
    go_omissions: goOmissions.length,
    go_omission_rate: goRows.length ? round(goOmissions.length / goRows.length, 4) : null,
    go_choice_errors: goChoiceErrors.length,
    go_accuracy: goRows.length ? round(goRows.filter((row) => runtimeData(row)?.go_correct === true).length / goRows.length, 4) : null,
    mean_go_rt_ms: round(meanGo, 2),
    median_go_rt_ms: round(median(goRts), 2),
    mean_failed_stop_rt_ms: round(meanFailedStop, 2),
    mean_ssd_ms: round(meanSsd, 2),
    ssrt_integration_ms: round(ssrt, 2),
    ssrt_nth_go_rt_ms: round(nthRt, 2),
    ssrt_nth_index: nthIndex,
    experimental_stop_trials: stopRows.length,
    quality_flags: qualityFlags,
  };
}
