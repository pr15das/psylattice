"use client";

export type CorsiMode = "forward" | "backward" | "both";

export type CorsiBlockPosition = {
  id: number;
  x: number;
  y: number;
};

export type CorsiSettings = {
  mode: CorsiMode;
  start_span: number;
  max_span: number;
  trials_per_span: number;
  pass_required: number;
  practice_trials: number;
  practice_span: number;
  highlight_ms: number;
  inter_onset_ms: number;
  pre_sequence_ms: number;
  response_timeout_ms: number;
  tap_feedback_ms: number;
  practice_feedback: boolean;
};

export type CorsiRuntimeData = {
  paradigm: "corsi";
  mode: "forward" | "backward";
  practice: boolean;
  span_length: number;
  span_trial_index: number;
  presented_sequence: number[];
  expected_sequence: number[];
  response_sequence: number[];
  correct: boolean;
  error_positions: number[];
  first_tap_latency_ms: number | null;
  completion_latency_ms: number | null;
  tap_latencies_ms: number[];
  timed_out: boolean;
  block_positions: CorsiBlockPosition[];
};

export type CorsiResultLike = {
  block_type: string;
  reaction_time_ms: number | null;
  correct: boolean | null;
  runtime_data?: Record<string, unknown> | CorsiRuntimeData;
};

export type CorsiModeSummary = {
  mode: "forward" | "backward";
  span: number | null;
  total_correct_sequences: number;
  total_sequences_attempted: number;
  sequence_accuracy: number | null;
  product_score: number | null;
  mean_first_tap_latency_ms: number | null;
  mean_completion_latency_ms: number | null;
  timed_out_trials: number;
};

export type CorsiSummary = {
  paradigm: "corsi";
  scoring_note: string;
  forward: CorsiModeSummary | null;
  backward: CorsiModeSummary | null;
  maximum_span: number | null;
  total_correct_sequences: number;
  total_sequences_attempted: number;
  overall_sequence_accuracy: number | null;
  quality_flags: Array<{
    code: string;
    level: "info" | "caution";
    message: string;
  }>;
};

export const CORSI_STANDARD_LAYOUT: CorsiBlockPosition[] = [
  { id: 1, x: 18, y: 19 },
  { id: 2, x: 48, y: 14 },
  { id: 3, x: 78, y: 23 },
  { id: 4, x: 31, y: 42 },
  { id: 5, x: 64, y: 39 },
  { id: 6, x: 86, y: 54 },
  { id: 7, x: 14, y: 72 },
  { id: 8, x: 47, y: 73 },
  { id: 9, x: 74, y: 82 },
];

const DEFAULTS: CorsiSettings = {
  mode: "forward",
  start_span: 2,
  max_span: 9,
  trials_per_span: 2,
  pass_required: 1,
  practice_trials: 3,
  practice_span: 3,
  highlight_ms: 500,
  inter_onset_ms: 1000,
  pre_sequence_ms: 650,
  response_timeout_ms: 12000,
  tap_feedback_ms: 140,
  practice_feedback: true,
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

function seedHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function corsiSeededRandom(seedText: string) {
  let state = seedHash(seedText) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function corsiSettingsFromTaskConfig(
  taskConfig: Record<string, unknown> | null | undefined
): CorsiSettings {
  const source =
    taskConfig &&
    typeof taskConfig.corsi === "object" &&
    taskConfig.corsi !== null
      ? (taskConfig.corsi as Record<string, unknown>)
      : {};

  const modeRaw = String(source.mode || DEFAULTS.mode).toLowerCase();
  const mode: CorsiMode =
    modeRaw === "backward" || modeRaw === "both" ? modeRaw : "forward";

  const startSpan = clamp(
    Math.round(finite(source.start_span, DEFAULTS.start_span)),
    2,
    CORSI_STANDARD_LAYOUT.length
  );
  const maxSpan = clamp(
    Math.round(finite(source.max_span, DEFAULTS.max_span)),
    startSpan,
    CORSI_STANDARD_LAYOUT.length
  );
  const trialsPerSpan = clamp(
    Math.round(finite(source.trials_per_span, DEFAULTS.trials_per_span)),
    1,
    6
  );
  const passRequired = clamp(
    Math.round(finite(source.pass_required, DEFAULTS.pass_required)),
    1,
    trialsPerSpan
  );

  return {
    mode,
    start_span: startSpan,
    max_span: maxSpan,
    trials_per_span: trialsPerSpan,
    pass_required: passRequired,
    practice_trials: clamp(
      Math.round(finite(source.practice_trials, DEFAULTS.practice_trials)),
      0,
      10
    ),
    practice_span: clamp(
      Math.round(finite(source.practice_span, DEFAULTS.practice_span)),
      2,
      maxSpan
    ),
    highlight_ms: clamp(
      finite(source.highlight_ms, DEFAULTS.highlight_ms),
      100,
      2000
    ),
    inter_onset_ms: clamp(
      finite(source.inter_onset_ms, DEFAULTS.inter_onset_ms),
      150,
      3000
    ),
    pre_sequence_ms: clamp(
      finite(source.pre_sequence_ms, DEFAULTS.pre_sequence_ms),
      0,
      3000
    ),
    response_timeout_ms: clamp(
      finite(source.response_timeout_ms, DEFAULTS.response_timeout_ms),
      2000,
      60000
    ),
    tap_feedback_ms: clamp(
      finite(source.tap_feedback_ms, DEFAULTS.tap_feedback_ms),
      0,
      1000
    ),
    practice_feedback: source.practice_feedback !== false,
  };
}

export function isCorsiRuntime(
  runtimeEngine: unknown,
  taskConfig?: Record<string, unknown> | null
) {
  const engine =
    typeof runtimeEngine === "string" ? runtimeEngine.toLowerCase() : "";
  const runtime =
    taskConfig && typeof taskConfig.runtime === "string"
      ? String(taskConfig.runtime).toLowerCase()
      : "";
  const template =
    taskConfig && typeof taskConfig.template_key === "string"
      ? String(taskConfig.template_key).toLowerCase()
      : "";

  return (
    engine === "psylattice_corsi_v1" ||
    engine === "corsi" ||
    runtime === "corsi" ||
    template === "corsi"
  );
}

export function corsiModes(settings: CorsiSettings): Array<"forward" | "backward"> {
  if (settings.mode === "both") return ["forward", "backward"];
  return [settings.mode];
}

export function generateCorsiSequence(span: number, seed: string) {
  const count = clamp(Math.round(span), 2, CORSI_STANDARD_LAYOUT.length);
  const random = corsiSeededRandom(seed);
  const pool = CORSI_STANDARD_LAYOUT.map((block) => block.id);

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }

  return pool.slice(0, count);
}

export function expectedCorsiSequence(
  presented: number[],
  mode: "forward" | "backward"
) {
  return mode === "backward" ? [...presented].reverse() : [...presented];
}

export function corsiErrorPositions(expected: number[], response: number[]) {
  const length = Math.max(expected.length, response.length);
  const positions: number[] = [];
  for (let index = 0; index < length; index += 1) {
    if (expected[index] !== response[index]) positions.push(index + 1);
  }
  return positions;
}

function runtimeData(result: CorsiResultLike): CorsiRuntimeData | null {
  const raw = result.runtime_data;
  if (!raw || typeof raw !== "object") return null;
  if ((raw as Record<string, unknown>).paradigm !== "corsi") return null;
  return raw as CorsiRuntimeData;
}

function modeSummary(
  results: CorsiResultLike[],
  mode: "forward" | "backward",
  settings: CorsiSettings
): CorsiModeSummary | null {
  const rows = results
    .map((result) => ({ result, data: runtimeData(result) }))
    .filter(
      (
        item
      ): item is { result: CorsiResultLike; data: CorsiRuntimeData } =>
        item.data !== null &&
        item.data.mode === mode &&
        item.data.practice === false
    );

  if (!rows.length) return null;

  const correctRows = rows.filter((item) => item.data.correct);
  const spanCounts = new Map<number, number>();
  rows.forEach((item) => {
    const spanLength = item.data.span_length;
    const current = spanCounts.get(spanLength) || 0;
    if (item.data.correct) spanCounts.set(spanLength, current + 1);
    else if (!spanCounts.has(spanLength)) spanCounts.set(spanLength, current);
  });
  const passedSpans = Array.from(spanCounts.entries())
    .filter(([, correctCount]) => correctCount >= settings.pass_required)
    .map(([spanLength]) => spanLength);
  const span = passedSpans.length ? Math.max(...passedSpans) : null;

  const firstTapLatencies = rows
    .map((item) => item.data.first_tap_latency_ms)
    .filter(
      (value): value is number =>
        value !== null && Number.isFinite(value) && value >= 0
    );
  const completionLatencies = rows
    .map((item) => item.data.completion_latency_ms)
    .filter(
      (value): value is number =>
        value !== null && Number.isFinite(value) && value >= 0
    );

  const totalCorrect = correctRows.length;

  return {
    mode,
    span,
    total_correct_sequences: totalCorrect,
    total_sequences_attempted: rows.length,
    sequence_accuracy: round(totalCorrect / rows.length, 4),
    product_score: span === null ? null : span * totalCorrect,
    mean_first_tap_latency_ms: round(mean(firstTapLatencies), 2),
    mean_completion_latency_ms: round(mean(completionLatencies), 2),
    timed_out_trials: rows.filter((item) => item.data.timed_out).length,
  };
}

export function buildCorsiSummary(
  allResults: CorsiResultLike[],
  settings: CorsiSettings
): CorsiSummary {
  const forward = modeSummary(allResults, "forward", settings);
  const backward = modeSummary(allResults, "backward", settings);
  const summaries = [forward, backward].filter(
    (value): value is CorsiModeSummary => value !== null
  );

  const totalCorrect = summaries.reduce(
    (sum, summary) => sum + summary.total_correct_sequences,
    0
  );
  const totalAttempted = summaries.reduce(
    (sum, summary) => sum + summary.total_sequences_attempted,
    0
  );
  const spans = summaries
    .map((summary) => summary.span)
    .filter((value): value is number => value !== null);

  const qualityFlags: CorsiSummary["quality_flags"] = [];

  if (settings.trials_per_span < 2) {
    qualityFlags.push({
      code: "single_trial_per_span",
      level: "info",
      message:
        "This configuration uses one sequence per span. Span will be more sensitive to a single trial than the default two-trial progression.",
    });
  }

  if (settings.pass_required >= settings.trials_per_span && settings.trials_per_span > 1) {
    qualityFlags.push({
      code: "strict_span_progression",
      level: "info",
      message:
        `Participants must pass all ${settings.trials_per_span} sequences at a span to advance. This is stricter than the default one-correct-of-two progression.`,
    });
  }

  const timeouts = summaries.reduce(
    (sum, summary) => sum + summary.timed_out_trials,
    0
  );
  if (timeouts > 0) {
    qualityFlags.push({
      code: "response_timeouts",
      level: "caution",
      message:
        `${timeouts} experimental Corsi trial${timeouts === 1 ? "" : "s"} reached the response timeout. Review those raw sequences before interpretation.`,
    });
  }

  if (!summaries.length) {
    qualityFlags.push({
      code: "no_experimental_sequences",
      level: "caution",
      message:
        "No completed experimental Corsi sequences were available for scoring.",
    });
  }

  return {
    paradigm: "corsi",
    scoring_note:
      "Span is the longest sequence length reproduced correctly. Product score = span × total correct sequences for that mode. PsyLattice does not attach normative or diagnostic cutoffs.",
    forward,
    backward,
    maximum_span: spans.length ? Math.max(...spans) : null,
    total_correct_sequences: totalCorrect,
    total_sequences_attempted: totalAttempted,
    overall_sequence_accuracy:
      totalAttempted > 0 ? round(totalCorrect / totalAttempted, 4) : null,
    quality_flags: qualityFlags,
  };
}
