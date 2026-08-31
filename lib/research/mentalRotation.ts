"use client";

export type MentalRotationSettings = {
  practice_trials: number;
  experimental_trials: number;
  rotation_angles_deg: number[];
  mirrored_probability: number;
  fixation_ms: number;
  response_timeout_ms: number;
  practice_feedback_ms: number;
  iti_ms: number;
  stimulus_size_px: number;
  same_key: string;
  mirrored_key: string;
};

export type MentalRotationTrialPlan = {
  shape_id: string;
  rotation_angle_deg: number;
  mirrored: boolean;
  correct_response: "same" | "mirrored";
};

export type MentalRotationRuntimeData = {
  paradigm: "mental_rotation";
  scoring_system: "psylattice_mental_rotation_v1";
  shape_id: string;
  shape_cells: Array<[number, number]>;
  rotation_angle_deg: number;
  angular_disparity_deg: number;
  mirrored: boolean;
  correct_response: "same" | "mirrored";
  response: "same" | "mirrored" | "timeout";
  correct: boolean;
  response_latency_ms: number | null;
  timed_out: boolean;
};

export type MentalRotationResultLike = {
  block_type: string;
  reaction_time_ms: number | null;
  runtime_data?: Record<string, unknown> | MentalRotationRuntimeData;
};

export type MentalRotationSummary = {
  paradigm: "mental_rotation";
  scoring_system: "psylattice_mental_rotation_v1";
  experimental_trials: number;
  completed_trials: number;
  correct_trials: number;
  accuracy: number | null;
  same_accuracy: number | null;
  mirrored_accuracy: number | null;
  mean_correct_rt_ms: number | null;
  median_correct_rt_ms: number | null;
  rotation_slope_ms_per_degree: number | null;
  timeout_trials: number;
  angle_summaries: Array<{
    angle_deg: number;
    trials: number;
    correct: number;
    accuracy: number | null;
    mean_correct_rt_ms: number | null;
  }>;
  quality_flags: Array<{
    code: string;
    level: "info" | "caution";
    message: string;
  }>;
};

export const MENTAL_ROTATION_SHAPES: Array<{
  id: string;
  cells: Array<[number, number]>;
}> = [
  { id: "mr_shape_a", cells: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,1]] },
  { id: "mr_shape_b", cells: [[0,0],[0,1],[0,2],[0,3],[1,0],[1,2]] },
  { id: "mr_shape_c", cells: [[0,0],[0,1],[0,2],[0,3],[1,0],[2,0]] },
  { id: "mr_shape_d", cells: [[0,0],[0,1],[0,2],[0,3],[1,1],[2,1]] },
  { id: "mr_shape_e", cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[2,1]] },
  { id: "mr_shape_f", cells: [[0,0],[0,1],[0,2],[1,0],[1,2],[1,3]] },
];

const DEFAULTS: MentalRotationSettings = {
  practice_trials: 6,
  experimental_trials: 40,
  rotation_angles_deg: [0, 45, 90, 135, 180],
  mirrored_probability: 0.5,
  fixation_ms: 500,
  response_timeout_ms: 10000,
  practice_feedback_ms: 550,
  iti_ms: 500,
  stimulus_size_px: 230,
  same_key: "f",
  mirrored_key: "j",
};

function finite(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number | null, digits = 4) {
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
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mentalRotationSeededRandom(seedText: string) {
  let state = hashSeed(seedText) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeKey(value: unknown, fallback: string) {
  const key = String(value ?? fallback).trim().toLowerCase();
  return key || fallback;
}

function normalizedAngles(value: unknown) {
  const source = Array.isArray(value) ? value : DEFAULTS.rotation_angles_deg;
  const angles = Array.from(new Set(source.map((item) => Math.round(finite(item, 0))).filter((item) => item >= 0 && item <= 180))).sort((a, b) => a - b);
  return angles.length >= 2 ? angles : DEFAULTS.rotation_angles_deg;
}

export function mentalRotationSettingsFromTaskConfig(
  taskConfig: Record<string, unknown> | null | undefined
): MentalRotationSettings {
  const source =
    taskConfig && typeof taskConfig.mental_rotation === "object" && taskConfig.mental_rotation !== null
      ? (taskConfig.mental_rotation as Record<string, unknown>)
      : {};

  const sameKey = normalizeKey(source.same_key, DEFAULTS.same_key);
  const mirroredKeyCandidate = normalizeKey(source.mirrored_key, DEFAULTS.mirrored_key);
  const mirroredKey = mirroredKeyCandidate === sameKey ? (sameKey === "j" ? "f" : "j") : mirroredKeyCandidate;

  return {
    practice_trials: clamp(Math.round(finite(source.practice_trials, DEFAULTS.practice_trials)), 0, 30),
    experimental_trials: clamp(Math.round(finite(source.experimental_trials, DEFAULTS.experimental_trials)), 10, 300),
    // Accept both the current 2J names and the earlier draft names so already-cloned
    // Mental Rotation tasks remain runnable after this fix.
    rotation_angles_deg: normalizedAngles(source.rotation_angles_deg ?? source.angles_deg),
    mirrored_probability: clamp(
      finite(source.mirrored_probability ?? (source.same_probability !== undefined ? 1 - finite(source.same_probability, 0.5) : undefined), DEFAULTS.mirrored_probability),
      0.1,
      0.9
    ),
    fixation_ms: clamp(finite(source.fixation_ms, DEFAULTS.fixation_ms), 0, 5000),
    response_timeout_ms: clamp(finite(source.response_timeout_ms, DEFAULTS.response_timeout_ms), 1500, 120000),
    practice_feedback_ms: clamp(finite(source.practice_feedback_ms, DEFAULTS.practice_feedback_ms), 0, 4000),
    iti_ms: clamp(finite(source.iti_ms, DEFAULTS.iti_ms), 0, 5000),
    stimulus_size_px: clamp(
      Math.round(finite(source.stimulus_size_px ?? source.object_size_px, DEFAULTS.stimulus_size_px)),
      120,
      420
    ),
    same_key: normalizeKey(source.same_key, DEFAULTS.same_key),
    mirrored_key: (() => {
      const resolvedSame = normalizeKey(source.same_key, DEFAULTS.same_key);
      const candidate = normalizeKey(source.mirrored_key ?? source.mirror_key, DEFAULTS.mirrored_key);
      return candidate === resolvedSame ? (resolvedSame === "j" ? "f" : "j") : candidate;
    })(),
  };
}

export function isMentalRotationRuntime(
  runtimeEngine: unknown,
  taskConfig?: Record<string, unknown> | null
) {
  const engine = typeof runtimeEngine === "string" ? runtimeEngine.toLowerCase() : "";
  const runtime = taskConfig && typeof taskConfig.runtime === "string" ? String(taskConfig.runtime).toLowerCase() : "";
  const template = taskConfig && typeof taskConfig.template_key === "string" ? String(taskConfig.template_key).toLowerCase() : "";
  const hasDedicatedConfig = Boolean(
    taskConfig &&
    typeof taskConfig.mental_rotation === "object" &&
    taskConfig.mental_rotation !== null
  );
  return (
    engine === "psylattice_mental_rotation_v1" ||
    engine === "mental_rotation" ||
    runtime === "mental_rotation" ||
    template === "mental_rotation" ||
    hasDedicatedConfig
  );
}

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function planMentalRotationTrials(
  count: number,
  settings: MentalRotationSettings,
  seed: string
): MentalRotationTrialPlan[] {
  const total = Math.max(1, Math.round(count));
  const random = mentalRotationSeededRandom(seed);
  const conditions: Array<{ angle: number; mirrored: boolean }> = [];
  settings.rotation_angles_deg.forEach((angle) => {
    conditions.push({ angle, mirrored: false }, { angle, mirrored: true });
  });
  const shuffledConditions = shuffle(conditions, random);
  const shapeOrder = shuffle(MENTAL_ROTATION_SHAPES, random);
  const plans: MentalRotationTrialPlan[] = [];

  for (let index = 0; index < total; index += 1) {
    const base = shuffledConditions[index % shuffledConditions.length];
    let mirrored = base.mirrored;
    if (settings.mirrored_probability !== 0.5) mirrored = random() < settings.mirrored_probability;
    const shape = shapeOrder[index % shapeOrder.length] || MENTAL_ROTATION_SHAPES[0];
    plans.push({
      shape_id: shape.id,
      rotation_angle_deg: base.angle,
      mirrored,
      correct_response: mirrored ? "mirrored" : "same",
    });
    if ((index + 1) % shuffledConditions.length === 0) {
      shuffledConditions.splice(0, shuffledConditions.length, ...shuffle(conditions, random));
    }
  }
  return plans;
}

export function mentalRotationShape(shapeId: string) {
  return MENTAL_ROTATION_SHAPES.find((shape) => shape.id === shapeId) || MENTAL_ROTATION_SHAPES[0];
}

export function mentalRotationSvgDataUrl(
  shapeId: string,
  rotationDeg: number,
  mirrored: boolean
) {
  const shape = mentalRotationShape(shapeId);
  const cell = 28;
  const padding = 18;
  const xs = shape.cells.map(([x]) => x);
  const ys = shape.cells.map(([, y]) => y);
  const width = (Math.max(...xs) - Math.min(...xs) + 1) * cell;
  const height = (Math.max(...ys) - Math.min(...ys) + 1) * cell;
  const canvas = Math.ceil(Math.sqrt(width * width + height * height) + padding * 2);
  const cx = canvas / 2;
  const cy = canvas / 2;
  const ox = cx - width / 2;
  const oy = cy - height / 2;
  const rects = shape.cells.map(([x, y]) => `<rect x="${ox + x * cell}" y="${oy + y * cell}" width="${cell - 2}" height="${cell - 2}" rx="5" fill="#0f172a"/>`).join("");
  const scaleX = mirrored ? -1 : 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas}" height="${canvas}" viewBox="0 0 ${canvas} ${canvas}"><rect width="100%" height="100%" rx="24" fill="#ffffff"/><g transform="translate(${cx} ${cy}) rotate(${rotationDeg}) scale(${scaleX} 1) translate(${-cx} ${-cy})">${rects}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function slope(points: Array<{ x: number; y: number }>) {
  if (points.length < 3) return null;
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (denominator <= 0) return null;
  return points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / denominator;
}

export function buildMentalRotationSummary(
  results: MentalRotationResultLike[],
  settings: MentalRotationSettings
): MentalRotationSummary {
  const rows = results
    .filter((result) => result.block_type === "experimental")
    .map((result) => result.runtime_data as MentalRotationRuntimeData | undefined)
    .filter((row): row is MentalRotationRuntimeData => row?.paradigm === "mental_rotation");

  const correctRows = rows.filter((row) => row.correct && typeof row.response_latency_ms === "number" && Number.isFinite(row.response_latency_ms));
  const sameRows = rows.filter((row) => !row.mirrored);
  const mirroredRows = rows.filter((row) => row.mirrored);
  const accuracyOf = (subset: MentalRotationRuntimeData[]) => subset.length ? subset.filter((row) => row.correct).length / subset.length : null;
  const correctRts = correctRows.map((row) => row.response_latency_ms as number);

  const angleSummaries = settings.rotation_angles_deg.map((angle) => {
    const subset = rows.filter((row) => row.angular_disparity_deg === angle);
    const correctSubset = subset.filter((row) => row.correct && typeof row.response_latency_ms === "number");
    return {
      angle_deg: angle,
      trials: subset.length,
      correct: subset.filter((row) => row.correct).length,
      accuracy: round(accuracyOf(subset)),
      mean_correct_rt_ms: round(mean(correctSubset.map((row) => row.response_latency_ms as number)), 2),
    };
  });

  const slopePoints = angleSummaries
    .filter((row) => row.mean_correct_rt_ms !== null && row.trials >= 2)
    .map((row) => ({ x: row.angle_deg, y: row.mean_correct_rt_ms as number }));
  const timeoutTrials = rows.filter((row) => row.timed_out).length;
  const accuracy = accuracyOf(rows);
  const flags: MentalRotationSummary["quality_flags"] = [];

  if (rows.length < settings.experimental_trials) {
    flags.push({ code: "incomplete_mental_rotation", level: "caution", message: `Only ${rows.length} of ${settings.experimental_trials} planned experimental trials were recorded.` });
  }
  if (timeoutTrials > 0) {
    flags.push({ code: "mental_rotation_timeouts", level: timeoutTrials >= Math.max(3, Math.ceil(rows.length * 0.1)) ? "caution" : "info", message: `${timeoutTrials} mental-rotation trial${timeoutTrials === 1 ? "" : "s"} reached the response timeout.` });
  }
  if (accuracy !== null && rows.length >= 10 && accuracy < 0.6) {
    flags.push({ code: "mental_rotation_low_accuracy", level: "caution", message: `Overall accuracy was ${Math.round(accuracy * 100)}%; review task understanding and response mapping before interpreting RT slopes.` });
  }
  if (correctRts.length >= 8 && median(correctRts)! < 250) {
    flags.push({ code: "mental_rotation_fast_responses", level: "caution", message: "Median correct response latency was below 250 ms; review whether responses reflect genuine spatial comparison." });
  }

  return {
    paradigm: "mental_rotation",
    scoring_system: "psylattice_mental_rotation_v1",
    experimental_trials: settings.experimental_trials,
    completed_trials: rows.length,
    correct_trials: rows.filter((row) => row.correct).length,
    accuracy: round(accuracy),
    same_accuracy: round(accuracyOf(sameRows)),
    mirrored_accuracy: round(accuracyOf(mirroredRows)),
    mean_correct_rt_ms: round(mean(correctRts), 2),
    median_correct_rt_ms: round(median(correctRts), 2),
    rotation_slope_ms_per_degree: round(slope(slopePoints), 4),
    timeout_trials: timeoutTrials,
    angle_summaries: angleSummaries,
    quality_flags: flags,
  };
}
