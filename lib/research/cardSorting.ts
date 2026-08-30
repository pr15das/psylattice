"use client";

export type CardSortRule = "color" | "shape" | "number";
export type CardSortShape = "circle" | "triangle" | "square" | "diamond";

export type CardSortCard = {
  id: number;
  color: string;
  color_name: string;
  shape: CardSortShape;
  count: number;
};

export type CardSortTarget = CardSortCard & {
  match_by: Record<CardSortRule, number>;
};

export type CardSortSettings = {
  starting_rule: CardSortRule;
  categories_to_complete: number;
  correct_to_shift: number;
  max_trials: number;
  failure_to_maintain_streak: number;
  feedback_ms: number;
  iti_ms: number;
  response_timeout_ms: number;
};

export type CardSortRuntimeData = {
  paradigm: "card_sorting";
  scoring_system: "psylattice_transparent_v1";
  trial_number: number;
  category_index: number;
  active_rule: CardSortRule;
  previous_rule: CardSortRule | null;
  target_card: CardSortTarget;
  chosen_reference_id: number | null;
  correct_reference_id: number;
  inferred_choice_rule: CardSortRule | "none";
  correct: boolean;
  perseverative_error: boolean;
  nonperseverative_error: boolean;
  failure_to_maintain_set: boolean;
  correct_streak_before: number;
  correct_streak_after: number;
  category_completed_after_trial: boolean;
  next_rule_after_trial: CardSortRule | null;
  response_latency_ms: number | null;
  timed_out: boolean;
  reference_cards: CardSortCard[];
};

export type CardSortResultLike = {
  block_type: string;
  reaction_time_ms: number | null;
  correct: boolean | null;
  runtime_data?: Record<string, unknown> | CardSortRuntimeData;
};

export type CardSortCategorySummary = {
  category_index: number;
  rule: CardSortRule;
  trials: number;
  correct: number;
  errors: number;
  perseverative_errors: number;
  nonperseverative_errors: number;
  completed: boolean;
};

export type CardSortSummary = {
  paradigm: "card_sorting";
  scoring_system: "psylattice_transparent_v1";
  scoring_note: string;
  total_trials: number;
  total_correct: number;
  total_errors: number;
  accuracy: number | null;
  error_rate: number | null;
  categories_completed: number;
  perseverative_errors: number;
  perseverative_error_rate: number | null;
  perseverative_share_of_errors: number | null;
  nonperseverative_errors: number;
  failures_to_maintain_set: number;
  trials_to_first_category: number | null;
  mean_response_latency_ms: number | null;
  median_response_latency_ms: number | null;
  timed_out_trials: number;
  max_trials_reached: boolean;
  category_summaries: CardSortCategorySummary[];
  quality_flags: Array<{
    code: string;
    level: "info" | "caution";
    message: string;
  }>;
};

export const CARD_SORT_REFERENCE_CARDS: CardSortCard[] = [
  { id: 1, color: "#0891b2", color_name: "cyan", shape: "circle", count: 1 },
  { id: 2, color: "#e11d48", color_name: "rose", shape: "triangle", count: 2 },
  { id: 3, color: "#d97706", color_name: "amber", shape: "square", count: 3 },
  { id: 4, color: "#7c3aed", color_name: "violet", shape: "diamond", count: 4 },
];

const DEFAULTS: CardSortSettings = {
  starting_rule: "color",
  categories_to_complete: 6,
  correct_to_shift: 10,
  max_trials: 128,
  failure_to_maintain_streak: 5,
  feedback_ms: 500,
  iti_ms: 250,
  response_timeout_ms: 15000,
};

const RULES: CardSortRule[] = ["color", "shape", "number"];

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
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function seedHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function cardSortSeededRandom(seedText: string) {
  let state = seedHash(seedText) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cardSortSettingsFromTaskConfig(
  taskConfig: Record<string, unknown> | null | undefined
): CardSortSettings {
  const source =
    taskConfig &&
    typeof taskConfig.card_sorting === "object" &&
    taskConfig.card_sorting !== null
      ? (taskConfig.card_sorting as Record<string, unknown>)
      : {};

  const ruleRaw = String(source.starting_rule || DEFAULTS.starting_rule).toLowerCase();
  const startingRule: CardSortRule =
    ruleRaw === "shape" || ruleRaw === "number" ? ruleRaw : "color";

  const correctToShift = clamp(
    Math.round(finite(source.correct_to_shift, DEFAULTS.correct_to_shift)),
    3,
    20
  );

  return {
    starting_rule: startingRule,
    categories_to_complete: clamp(
      Math.round(
        finite(source.categories_to_complete, DEFAULTS.categories_to_complete)
      ),
      1,
      12
    ),
    correct_to_shift: correctToShift,
    max_trials: clamp(
      Math.round(finite(source.max_trials, DEFAULTS.max_trials)),
      20,
      300
    ),
    failure_to_maintain_streak: clamp(
      Math.round(
        finite(
          source.failure_to_maintain_streak,
          DEFAULTS.failure_to_maintain_streak
        )
      ),
      2,
      Math.max(2, correctToShift - 1)
    ),
    feedback_ms: clamp(
      finite(source.feedback_ms, DEFAULTS.feedback_ms),
      100,
      2000
    ),
    iti_ms: clamp(finite(source.iti_ms, DEFAULTS.iti_ms), 0, 3000),
    response_timeout_ms: clamp(
      finite(source.response_timeout_ms, DEFAULTS.response_timeout_ms),
      2000,
      60000
    ),
  };
}

export function isCardSortRuntime(
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
    engine === "psylattice_card_sorting_v1" ||
    engine === "card_sorting" ||
    runtime === "card_sorting" ||
    template === "card_sorting"
  );
}

export function cardSortRuleSequence(
  startingRule: CardSortRule,
  categories: number
) {
  const startIndex = RULES.indexOf(startingRule);
  return Array.from({ length: Math.max(1, categories) }, (_, index) =>
    RULES[(startIndex + index) % RULES.length]
  );
}

export function generateCardSortTarget(seed: string): CardSortTarget {
  const random = cardSortSeededRandom(seed);
  const referenceIds = CARD_SORT_REFERENCE_CARDS.map((card) => card.id);

  for (let index = referenceIds.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [referenceIds[index], referenceIds[swap]] = [
      referenceIds[swap],
      referenceIds[index],
    ];
  }

  // Three distinct reference-card IDs are deliberately used for the three
  // matching dimensions. This removes the proprietary WCST's ambiguity scoring
  // and makes every PsyLattice response transparently classifiable.
  const colorRef = CARD_SORT_REFERENCE_CARDS.find(
    (card) => card.id === referenceIds[0]
  )!;
  const shapeRef = CARD_SORT_REFERENCE_CARDS.find(
    (card) => card.id === referenceIds[1]
  )!;
  const numberRef = CARD_SORT_REFERENCE_CARDS.find(
    (card) => card.id === referenceIds[2]
  )!;

  return {
    id: 1000 + (seedHash(seed) % 100000),
    color: colorRef.color,
    color_name: colorRef.color_name,
    shape: shapeRef.shape,
    count: numberRef.count,
    match_by: {
      color: colorRef.id,
      shape: shapeRef.id,
      number: numberRef.id,
    },
  };
}

export function correctReferenceForRule(
  target: CardSortTarget,
  rule: CardSortRule
) {
  return target.match_by[rule];
}

export function inferredRuleFromChoice(
  target: CardSortTarget,
  chosenReferenceId: number | null
): CardSortRule | "none" {
  if (chosenReferenceId === null) return "none";
  for (const rule of RULES) {
    if (target.match_by[rule] === chosenReferenceId) return rule;
  }
  return "none";
}

export function nextCardSortRule(rule: CardSortRule) {
  const index = RULES.indexOf(rule);
  return RULES[(index + 1) % RULES.length];
}

function runtimeData(result: CardSortResultLike): CardSortRuntimeData | null {
  const raw = result.runtime_data;
  if (!raw || typeof raw !== "object") return null;
  if ((raw as Record<string, unknown>).paradigm !== "card_sorting") return null;
  return raw as CardSortRuntimeData;
}

export function buildCardSortSummary(
  results: CardSortResultLike[],
  settings: CardSortSettings
): CardSortSummary {
  const rows = results
    .map((result) => ({ result, data: runtimeData(result) }))
    .filter(
      (
        item
      ): item is { result: CardSortResultLike; data: CardSortRuntimeData } =>
        item.data !== null && item.result.block_type === "experimental"
    );

  const totalTrials = rows.length;
  const totalCorrect = rows.filter((item) => item.data.correct).length;
  const totalErrors = totalTrials - totalCorrect;
  const perseverativeErrors = rows.filter(
    (item) => item.data.perseverative_error
  ).length;
  const failuresToMaintain = rows.filter(
    (item) => item.data.failure_to_maintain_set
  ).length;
  const timeouts = rows.filter((item) => item.data.timed_out).length;
  const categoriesCompleted = rows.filter(
    (item) => item.data.category_completed_after_trial
  ).length;

  const firstCategory = rows.find(
    (item) => item.data.category_completed_after_trial
  );

  const latencies = rows
    .map((item) => item.data.response_latency_ms)
    .filter(
      (value): value is number =>
        value !== null && Number.isFinite(value) && value >= 0
    );

  const categoryMap = new Map<number, CardSortCategorySummary>();
  for (const item of rows) {
    const index = item.data.category_index;
    const current = categoryMap.get(index) || {
      category_index: index,
      rule: item.data.active_rule,
      trials: 0,
      correct: 0,
      errors: 0,
      perseverative_errors: 0,
      nonperseverative_errors: 0,
      completed: false,
    };
    current.trials += 1;
    if (item.data.correct) current.correct += 1;
    else current.errors += 1;
    if (item.data.perseverative_error) current.perseverative_errors += 1;
    if (item.data.nonperseverative_error) current.nonperseverative_errors += 1;
    if (item.data.category_completed_after_trial) current.completed = true;
    categoryMap.set(index, current);
  }

  const maxTrialsReached =
    totalTrials >= settings.max_trials &&
    categoriesCompleted < settings.categories_to_complete;

  const qualityFlags: CardSortSummary["quality_flags"] = [];

  if (maxTrialsReached) {
    qualityFlags.push({
      code: "max_trials_reached",
      level: "caution",
      message:
        `The task reached the configured ${settings.max_trials}-trial limit before all ${settings.categories_to_complete} categories were completed.`,
    });
  }

  if (totalTrials > 0 && categoriesCompleted === 0) {
    qualityFlags.push({
      code: "no_category_completed",
      level: "caution",
      message:
        "No sorting category was completed. Interpret error counts cautiously and inspect the trial-level response pattern.",
    });
  }

  if (timeouts > 0) {
    qualityFlags.push({
      code: "response_timeouts",
      level: "caution",
      message:
        `${timeouts} card-sorting trial${timeouts === 1 ? "" : "s"} reached the response timeout. Timeout trials are counted as incorrect but not automatically classified as perseverative.`,
    });
  }

  if (settings.correct_to_shift !== 10) {
    qualityFlags.push({
      code: "nonstandard_shift_threshold",
      level: "info",
      message:
        `This PsyLattice task changes rule after ${settings.correct_to_shift} consecutive correct responses rather than the common 10-response category threshold. Report this parameter explicitly.`,
    });
  }

  return {
    paradigm: "card_sorting",
    scoring_system: "psylattice_transparent_v1",
    scoring_note:
      "This is an original PsyLattice WCST-style research paradigm, not the proprietary standardized WCST. A perseverative error is transparently defined here as an incorrect response matching the immediately previous sorting rule after a rule shift. Nonperseverative errors are all other incorrect responses. Failure to maintain set is an error after the configured correct-streak threshold but before category completion.",
    total_trials: totalTrials,
    total_correct: totalCorrect,
    total_errors: totalErrors,
    accuracy: totalTrials ? round(totalCorrect / totalTrials, 4) : null,
    error_rate: totalTrials ? round(totalErrors / totalTrials, 4) : null,
    categories_completed: categoriesCompleted,
    perseverative_errors: perseverativeErrors,
    perseverative_error_rate: totalTrials
      ? round(perseverativeErrors / totalTrials, 4)
      : null,
    perseverative_share_of_errors: totalErrors
      ? round(perseverativeErrors / totalErrors, 4)
      : null,
    nonperseverative_errors: Math.max(0, totalErrors - perseverativeErrors),
    failures_to_maintain_set: failuresToMaintain,
    trials_to_first_category:
      firstCategory?.data.trial_number ?? null,
    mean_response_latency_ms: round(mean(latencies), 2),
    median_response_latency_ms: round(median(latencies), 2),
    timed_out_trials: timeouts,
    max_trials_reached: maxTrialsReached,
    category_summaries: Array.from(categoryMap.values()).sort(
      (a, b) => a.category_index - b.category_index
    ),
    quality_flags: qualityFlags,
  };
}
