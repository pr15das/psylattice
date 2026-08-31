"use client";

export type BartSettings = {
  balloons: number;
  max_pumps: number;
  explosion_min_pump: number;
  explosion_max_pump: number;
  reward_per_pump: number;
  start_bank: number;
  pump_animation_ms: number;
  outcome_ms: number;
  iti_ms: number;
  response_timeout_ms: number;
};

export type BartDecisionRuntimeData = {
  paradigm: "bart";
  scoring_system: "psylattice_bart_v1";
  balloon_index: number;
  decision_index: number;
  decision: "pump" | "cash_out" | "timeout";
  pumps_before_decision: number;
  pumps_after_decision: number;
  explosion_point: number;
  exploded_after_decision: boolean;
  cashed_out_after_decision: boolean;
  temporary_reward_before: number;
  temporary_reward_after: number;
  bank_before: number;
  bank_after: number;
  decision_latency_ms: number | null;
  timed_out: boolean;
};

export type BartResultLike = {
  block_type: string;
  reaction_time_ms: number | null;
  runtime_data?: Record<string, unknown> | BartDecisionRuntimeData;
};

export type BartBalloonSummary = {
  balloon_index: number;
  explosion_point: number;
  pumps: number;
  exploded: boolean;
  cashed_out: boolean;
  reward_bank_delta: number;
  decision_count: number;
};

export type BartSummary = {
  paradigm: "bart";
  scoring_system: "psylattice_bart_v1";
  total_balloons: number;
  completed_balloons: number;
  exploded_balloons: number;
  cashed_out_balloons: number;
  explosion_rate: number | null;
  mean_pumps_all_balloons: number | null;
  adjusted_mean_pumps: number | null;
  median_pumps_nonexploded: number | null;
  total_pumps: number;
  final_bank: number;
  mean_decision_latency_ms: number | null;
  timed_out_decisions: number;
  balloon_summaries: BartBalloonSummary[];
  quality_flags: Array<{
    code: string;
    level: "info" | "caution";
    message: string;
  }>;
};

const DEFAULTS: BartSettings = {
  balloons: 30,
  max_pumps: 64,
  explosion_min_pump: 1,
  explosion_max_pump: 64,
  reward_per_pump: 0.05,
  start_bank: 0,
  pump_animation_ms: 120,
  outcome_ms: 700,
  iti_ms: 450,
  response_timeout_ms: 20000,
};

function finite(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

export function bartSeededRandom(seedText: string) {
  let state = hashSeed(seedText) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bartSettingsFromTaskConfig(
  taskConfig: Record<string, unknown> | null | undefined
): BartSettings {
  const source =
    taskConfig && typeof taskConfig.bart === "object" && taskConfig.bart !== null
      ? (taskConfig.bart as Record<string, unknown>)
      : {};

  const maxPumps = clamp(
    Math.round(finite(source.max_pumps, DEFAULTS.max_pumps)),
    8,
    128
  );
  const explosionMin = clamp(
    Math.round(finite(source.explosion_min_pump, DEFAULTS.explosion_min_pump)),
    1,
    Math.max(1, maxPumps - 1)
  );
  const explosionMax = clamp(
    Math.round(finite(source.explosion_max_pump, DEFAULTS.explosion_max_pump)),
    Math.min(maxPumps, explosionMin + 1),
    maxPumps
  );

  return {
    balloons: clamp(Math.round(finite(source.balloons, DEFAULTS.balloons)), 5, 100),
    max_pumps: maxPumps,
    explosion_min_pump: explosionMin,
    explosion_max_pump: explosionMax,
    reward_per_pump: clamp(finite(source.reward_per_pump, DEFAULTS.reward_per_pump), 0.01, 1000),
    start_bank: clamp(finite(source.start_bank, DEFAULTS.start_bank), 0, 1000000),
    pump_animation_ms: clamp(finite(source.pump_animation_ms, DEFAULTS.pump_animation_ms), 0, 1000),
    outcome_ms: clamp(finite(source.outcome_ms, DEFAULTS.outcome_ms), 100, 4000),
    iti_ms: clamp(finite(source.iti_ms, DEFAULTS.iti_ms), 0, 4000),
    response_timeout_ms: clamp(finite(source.response_timeout_ms, DEFAULTS.response_timeout_ms), 2000, 120000),
  };
}

export function isBartRuntime(
  runtimeEngine: unknown,
  taskConfig?: Record<string, unknown> | null
) {
  const engine = typeof runtimeEngine === "string" ? runtimeEngine.toLowerCase() : "";
  const runtime = taskConfig && typeof taskConfig.runtime === "string" ? String(taskConfig.runtime).toLowerCase() : "";
  const template = taskConfig && typeof taskConfig.template_key === "string" ? String(taskConfig.template_key).toLowerCase() : "";
  return engine === "psylattice_bart_v1" || engine === "bart" || runtime === "bart" || template === "bart";
}

export function bartExplosionPoint(seed: string, settings: BartSettings) {
  const random = bartSeededRandom(seed)();
  const range = settings.explosion_max_pump - settings.explosion_min_pump + 1;
  return settings.explosion_min_pump + Math.floor(random * Math.max(1, range));
}

export function bartTemporaryReward(pumps: number, rewardPerPump: number) {
  return roundMoney(Math.max(0, pumps) * rewardPerPump);
}

export function buildBartSummary(
  results: BartResultLike[],
  settings: BartSettings
): BartSummary {
  const decisions = results
    .filter((result) => result.block_type === "experimental")
    .map((result) => result.runtime_data as BartDecisionRuntimeData | undefined)
    .filter((row): row is BartDecisionRuntimeData => row?.paradigm === "bart");

  const byBalloon = new Map<number, BartDecisionRuntimeData[]>();
  for (const row of decisions) {
    const list = byBalloon.get(row.balloon_index) || [];
    list.push(row);
    byBalloon.set(row.balloon_index, list);
  }

  const balloonSummaries: BartBalloonSummary[] = Array.from(byBalloon.entries())
    .sort(([a], [b]) => a - b)
    .map(([balloonIndex, rows]) => {
      const last = rows[rows.length - 1];
      const first = rows[0];
      const exploded = rows.some((row) => row.exploded_after_decision);
      const cashedOut = rows.some((row) => row.cashed_out_after_decision);
      return {
        balloon_index: balloonIndex,
        explosion_point: first.explosion_point,
        pumps: Math.max(...rows.map((row) => row.pumps_after_decision), 0),
        exploded,
        cashed_out: cashedOut,
        reward_bank_delta: roundMoney(last.bank_after - first.bank_before),
        decision_count: rows.length,
      };
    });

  const completed = balloonSummaries.filter((row) => row.exploded || row.cashed_out);
  const nonExploded = completed.filter((row) => row.cashed_out && !row.exploded);
  const explodedCount = completed.filter((row) => row.exploded).length;
  const cashedOutCount = nonExploded.length;
  const allPumps = completed.map((row) => row.pumps);
  const adjustedPumps = nonExploded.map((row) => row.pumps);
  const latencies = decisions
    .map((row) => row.decision_latency_ms)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const timedOut = decisions.filter((row) => row.timed_out).length;
  const finalBank = decisions.length ? decisions[decisions.length - 1].bank_after : settings.start_bank;

  const flags: BartSummary["quality_flags"] = [];
  if (completed.length < settings.balloons) {
    flags.push({ code: "incomplete_bart", level: "caution", message: `Only ${completed.length} of ${settings.balloons} balloons were completed.` });
  }
  if (timedOut > 0) {
    flags.push({ code: "bart_timeouts", level: timedOut >= 3 ? "caution" : "info", message: `${timedOut} BART decision${timedOut === 1 ? "" : "s"} reached the response timeout.` });
  }
  if (completed.length >= 5 && explodedCount === completed.length) {
    flags.push({ code: "all_balloons_exploded", level: "caution", message: "Every completed balloon exploded; adjusted mean pumps cannot be estimated from successful cash-outs." });
  }
  if (completed.length >= 5 && completed.every((row) => row.pumps <= 1)) {
    flags.push({ code: "minimal_pumping", level: "caution", message: "All completed balloons had at most one pump; review whether the participant engaged with the risk/reward task." });
  }

  return {
    paradigm: "bart",
    scoring_system: "psylattice_bart_v1",
    total_balloons: settings.balloons,
    completed_balloons: completed.length,
    exploded_balloons: explodedCount,
    cashed_out_balloons: cashedOutCount,
    explosion_rate: completed.length ? round(explodedCount / completed.length) : null,
    mean_pumps_all_balloons: round(mean(allPumps)),
    adjusted_mean_pumps: round(mean(adjustedPumps)),
    median_pumps_nonexploded: round(median(adjustedPumps)),
    total_pumps: allPumps.reduce((sum, value) => sum + value, 0),
    final_bank: roundMoney(finalBank),
    mean_decision_latency_ms: round(mean(latencies), 2),
    timed_out_decisions: timedOut,
    balloon_summaries: balloonSummaries,
    quality_flags: flags,
  };
}
