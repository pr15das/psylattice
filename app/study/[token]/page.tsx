"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import {
  ambulatoryVisibleItems,
  cleanHiddenAmbulatoryResponses,
  type AmbulatoryItemDraft,
  type AmbulatoryScheduleDraft,
} from "@/components/AmbulatoryProtocolBuilder";

type JsonObject = Record<string, unknown>;

type ResponseOption = {
  label: string;
  value: number | string;
  weight?: number;
  media_url?: string | null;
  media_mime_type?: string | null;
};

type PublicConsentItem = {
  id: string;
  position: number;
  prompt: string;
  response_type: string;
  required: boolean;
  response_config: JsonObject;
  validation_config: JsonObject;
};

type PublicConsent = {
  id: string;
  version_label: string;
  consent_method: "psylattice" | "external" | "none";
  participant_information: string | null;
  external_consent_note: string | null;
  items: PublicConsentItem[];
};

type PublicBlock = {
  id: string;
  block_key: string;
  position: number;
  title: string | null;
  instructions: string | null;
  randomize_items: boolean;
  page_break_after: boolean;
  display_logic: JsonObject;
};

type PublicItem = {
  id: string;
  block_id: string | null;
  item_key: string | null;
  position: number;
  prompt: string;
  help_text: string | null;
  subscale: string | null;
  reverse_scored: boolean;
  response_type: string;
  response_options: ResponseOption[];
  required: boolean;
  response_config: JsonObject;
  validation_config: JsonObject;
  scoring_config: JsonObject;
  display_logic: {
    mode?: "all" | "any";
    rules?: Array<{
      source_key?: string;
      operator?: string;
      value?: string;
    }>;
  };
  randomization_config: JsonObject;
  media_config: {
    url?: string | null;
    mime_type?: string | null;
  };
  is_content_only: boolean;
};

type PublicMeasure = {
  study_measure_id: string;
  measurement_point: "baseline" | "followup";
  position: number;
  required: boolean;
  config: JsonObject;
  questionnaire: {
    id: string;
    slug: string;
    name: string;
    acronym: string | null;
    category: string;
    description: string;
    item_count: number;
    estimated_minutes: number | null;
    administration_mode: string | null;
    recall_period: string | null;
  };
  version: {
    id: string;
    version_label: string;
    participant_instructions: string;
    response_scale_description: string | null;
    score_multiplier: number;
    scoring_method: string;
    scoring_config: JsonObject;
    missing_data_config: JsonObject;
    randomization_config: JsonObject;
    display_config: JsonObject;
  };
  blocks: PublicBlock[];
  items: PublicItem[];
};

type PublicDemographicQuestion = {
  id: string;
  position: number;
  field_key: string;
  label: string;
  description: string | null;
  question_type:
    | "short_text"
    | "long_text"
    | "number"
    | "single_choice"
    | "multiple_choice"
    | "dropdown"
    | "yes_no"
    | "date"
    | "email";
  required: boolean;
  direct_identifier: boolean;
  response_config: {
    options?: string[];
    placeholder?: string | null;
  };
  validation_config: {
    min_value?: number | null;
    max_value?: number | null;
  };
};

type PublicStudyPayload = {
  ok: boolean;
  error?: string;
  study?: {
    id: string;
    title: string;
    participant_description: string | null;
    design: string | null;
    components: Record<string, boolean>;
  };
  link?: {
    id: string;
    name: string;
    access_mode: "open" | "participant_code";
    max_participants: number | null;
    allow_multiple_submissions: boolean;
    is_test_link: boolean;
  };
  consent?: PublicConsent | null;
  demographics?: PublicDemographicQuestion[];
  measures?: PublicMeasure[];
};

type PublicAmbulatoryConfig = {
  ok: boolean;
  enabled: boolean;
  reason?: string;
  protocol_id?: string;
  name?: string;
  duration_days?: number;
  participant_feedback_enabled?: boolean;
  notifications_enabled?: boolean;
  protocol?: AmbulatoryScheduleDraft[];
};

type AmbulatoryPrompt = {
  prompt_id: string;
  schedule_key: string;
  schedule_label: string;
  trigger_type: string;
  local_date: string;
  occurrence_index: number;
  scheduled_for: string | null;
  expires_at: string | null;
  status:
    | "pending"
    | "opened"
    | "completed"
    | "missed"
    | "cancelled";
};

type AmbulatoryDashboardPayload = {
  ok: boolean;
  error?: string;
  study_id?: string;
  study_title?: string;
  public_id?: string;
  protocol_id?: string;
  protocol_name?: string;
  duration_days?: number;
  day_number?: number;
  study_complete_available?: boolean;
  participant_feedback_enabled?: boolean;
  notifications_enabled?: boolean;
  prompts?: AmbulatoryPrompt[];
  event_schedules?: AmbulatoryScheduleDraft[];
  completed_scheduled?: number;
  expected_scheduled?: number;
  event_checkins_completed?: number;
};

type ActiveAmbulatoryCheckin = {
  checkin_id: string;
  schedule: AmbulatoryScheduleDraft;
  prompt_id?: string | null;
};

type AmbulatoryQuestionnairePayload = {
  ok: boolean;
  error?: string;
  questionnaire?: {
    id: string;
    name: string;
    acronym: string | null;
    description: string | null;
  };
  version?: {
    id: string;
    version_label: string;
    participant_instructions: string | null;
    response_scale_description: string | null;
  };
  items?: Array<{
    id: string;
    item_key: string | null;
    position: number;
    prompt: string;
    help_text: string | null;
    subscale: string | null;
    response_type: string;
    required: boolean;
    response_options: ResponseOption[];
    response_config: JsonObject;
  }>;
};

type AnswerValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, string | number | boolean | string[]>
  | null;

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <PsyLatticeLogo />
          <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-900">
            Research participant
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        {children}
      </div>
    </main>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        )}
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-700">
      {text}
    </div>
  );
}

function optionValue(option: ResponseOption) {
  return option.value;
}

function displayValue(value: AnswerValue | undefined) {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function logicExpectedValue(sourceItem: PublicItem, expected: string) {
  const exactValue = sourceItem.response_options.find(
    (option) => String(option.value) === String(expected)
  );

  if (exactValue) return String(exactValue.value);

  const byLabel = sourceItem.response_options.find(
    (option) =>
      option.label.trim().toLowerCase() === expected.trim().toLowerCase()
  );

  return byLabel ? String(byLabel.value) : expected;
}

function compareLogicValue(
  actual: AnswerValue | undefined,
  operator: string,
  expected: string,
  sourceItem: PublicItem
) {
  if (operator === "answered") {
    return responseHasValue(actual);
  }

  if (operator === "not_answered") {
    return !responseHasValue(actual);
  }

  const expectedValue = logicExpectedValue(sourceItem, expected);
  const actualText = displayValue(actual);

  if (operator === "equals") {
    return actualText.trim().toLowerCase() === expectedValue.trim().toLowerCase();
  }

  if (operator === "not_equals") {
    return actualText.trim().toLowerCase() !== expectedValue.trim().toLowerCase();
  }

  if (operator === "contains" || operator === "not_contains") {
    const contains = Array.isArray(actual)
      ? actual.map(String).some(
          (entry) =>
            entry.trim().toLowerCase() === expectedValue.trim().toLowerCase()
        )
      : actualText.toLowerCase().includes(expectedValue.toLowerCase());

    return operator === "contains" ? contains : !contains;
  }

  const actualNumber = Number(actualText);
  const expectedNumber = Number(expectedValue);
  const numericComparison =
    Number.isFinite(actualNumber) && Number.isFinite(expectedNumber);

  const compare = numericComparison
    ? actualNumber - expectedNumber
    : actualText.localeCompare(expectedValue);

  if (operator === "greater_than") return compare > 0;
  if (operator === "greater_than_or_equal") return compare >= 0;
  if (operator === "less_than") return compare < 0;
  if (operator === "less_than_or_equal") return compare <= 0;

  // Unknown legacy operators should fail closed rather than accidentally
  // displaying a branch that the researcher did not intend to show.
  return false;
}

function itemIsVisible(
  item: PublicItem,
  answers: Record<string, AnswerValue>,
  items: PublicItem[],
  resolving: Set<string> = new Set()
) {
  const rules = item.display_logic?.rules || [];

  if (rules.length === 0) return true;
  if (resolving.has(item.id)) return false;

  const itemIndex = items.findIndex((candidate) => candidate.id === item.id);
  const nextResolving = new Set(resolving);
  nextResolving.add(item.id);

  const results = rules.map((rule) => {
    const sourceItem = items.find(
      (candidate) => candidate.item_key === rule.source_key
    );

    if (!sourceItem) return false;

    const sourceIndex = items.findIndex(
      (candidate) => candidate.id === sourceItem.id
    );

    // Branches may only depend on earlier questions. This also prevents
    // circular dependencies in legacy/badly edited questionnaire JSON.
    if (sourceIndex < 0 || itemIndex < 0 || sourceIndex >= itemIndex) {
      return false;
    }

    // A downstream question cannot become visible from a stale answer to a
    // source question that is itself currently hidden by another branch.
    if (!itemIsVisible(sourceItem, answers, items, nextResolving)) {
      return false;
    }

    return compareLogicValue(
      answers[sourceItem.id],
      rule.operator || "equals",
      String(rule.value ?? ""),
      sourceItem
    );
  });

  return item.display_logic?.mode === "any"
    ? results.some(Boolean)
    : results.every(Boolean);
}

function cleanHiddenMeasureAnswers(
  measure: PublicMeasure,
  answers: Record<string, AnswerValue>
) {
  const next = { ...answers };

  // Repeat because hiding one answered question can in turn hide a later
  // question that depended on it.
  for (let pass = 0; pass < measure.items.length; pass += 1) {
    let changed = false;

    for (const item of measure.items) {
      if (!(item.id in next)) continue;
      if (itemIsVisible(item, next, measure.items)) continue;

      delete next[item.id];
      changed = true;
    }

    if (!changed) break;
  }

  return next;
}

function pipeText(
  text: string,
  answers: Record<string, AnswerValue>,
  items: PublicItem[]
) {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const source = items.find((item) => item.item_key === key.trim());
    if (!source) return "";
    return displayValue(answers[source.id]);
  });
}

function deterministicSeed(text: string) {
  let seed = 0;

  for (let index = 0; index < text.length; index += 1) {
    seed = (seed * 31 + text.charCodeAt(index)) >>> 0;
  }

  return seed;
}

function deterministicRank(seedText: string, itemId: string) {
  const seed = deterministicSeed(`${seedText}:${itemId}`);
  return ((seed ^ 2654435761) >>> 0) / 4294967296;
}

function pipedItemKeys(item: PublicItem) {
  const keys = new Set<string>();
  const text = `${item.prompt || ""} ${item.help_text || ""}`;

  for (const match of text.matchAll(/\{\{([^}]+)\}\}/g)) {
    const key = String(match[1] || "").trim();
    if (key) keys.add(key);
  }

  return keys;
}

function itemDependencyKeys(item: PublicItem) {
  const keys = pipedItemKeys(item);

  for (const rule of item.display_logic?.rules || []) {
    const key = String(rule.source_key || "").trim();
    if (key) keys.add(key);
  }

  return keys;
}

function dependencySafeShuffle(
  items: PublicItem[],
  seedText: string
) {
  if (items.length < 2) return items;

  const idsInScope = new Set(items.map((item) => item.id));
  const itemByKey = new Map(
    items
      .filter((item) => Boolean(item.item_key))
      .map((item) => [String(item.item_key), item] as const)
  );
  const dependencies = new Map<string, Set<string>>();

  for (const item of items) {
    const dependencyIds = new Set<string>();

    for (const key of itemDependencyKeys(item)) {
      const source = itemByKey.get(key);
      if (source && idsInScope.has(source.id) && source.id !== item.id) {
        dependencyIds.add(source.id);
      }
    }

    dependencies.set(item.id, dependencyIds);
  }

  const remaining = new Map(items.map((item) => [item.id, item] as const));
  const ordered: PublicItem[] = [];
  const emitted = new Set<string>();

  while (remaining.size > 0) {
    const available = Array.from(remaining.values())
      .filter((item) =>
        Array.from(dependencies.get(item.id) || []).every((dependencyId) =>
          emitted.has(dependencyId)
        )
      )
      .sort((a, b) => {
        const rankDifference =
          deterministicRank(seedText, a.id) -
          deterministicRank(seedText, b.id);

        if (rankDifference !== 0) return rankDifference;
        return a.position - b.position;
      });

    // Bad legacy data can contain a dependency cycle. Fail safely by keeping
    // the remaining authored order rather than producing an unstable order.
    if (available.length === 0) {
      ordered.push(
        ...Array.from(remaining.values()).sort(
          (a, b) => a.position - b.position
        )
      );
      break;
    }

    const next = available[0];
    ordered.push(next);
    emitted.add(next.id);
    remaining.delete(next.id);
  }

  return ordered;
}

function randomizeQuestionSegments(
  items: PublicItem[],
  seedText: string
) {
  const output: PublicItem[] = [];
  let segment: PublicItem[] = [];
  let segmentIndex = 0;

  const flushSegment = () => {
    if (segment.length === 0) return;
    output.push(
      ...dependencySafeShuffle(
        segment,
        `${seedText}:segment-${segmentIndex}`
      )
    );
    segment = [];
    segmentIndex += 1;
  };

  for (const item of items) {
    // Instructions/headings/media are structural anchors. Keeping them fixed
    // prevents randomisation from separating guidance from its questions.
    if (item.is_content_only) {
      flushSegment();
      output.push(item);
    } else {
      segment.push(item);
    }
  }

  flushSegment();
  return output;
}

function deterministicMeasureItems(
  measure: PublicMeasure,
  sessionToken: string
) {
  const authoredItems = [...measure.items].sort(
    (a, b) => a.position - b.position
  );
  const questionnaireRandomization = Boolean(
    (measure.version.randomization_config as {
      randomize_all_items?: boolean;
    })?.randomize_all_items
  );

  if (measure.blocks.length === 0) {
    return questionnaireRandomization
      ? randomizeQuestionSegments(
          authoredItems,
          `${sessionToken}:${measure.study_measure_id}:questionnaire`
        )
      : authoredItems;
  }

  const orderedBlocks = [...measure.blocks].sort(
    (a, b) => a.position - b.position
  );
  const usedItemIds = new Set<string>();
  const ordered: PublicItem[] = [];

  for (const block of orderedBlocks) {
    const blockItems = authoredItems.filter(
      (item) => item.block_id === block.id
    );

    blockItems.forEach((item) => usedItemIds.add(item.id));

    const shouldRandomize =
      questionnaireRandomization || Boolean(block.randomize_items);

    ordered.push(
      ...(shouldRandomize
        ? randomizeQuestionSegments(
            blockItems,
            `${sessionToken}:${measure.study_measure_id}:block:${block.id}`
          )
        : blockItems)
    );
  }

  // Standardised/legacy questionnaires can have items without explicit blocks.
  // Preserve them, and honour questionnaire-level randomisation when enabled.
  const unblockedItems = authoredItems.filter(
    (item) => !usedItemIds.has(item.id)
  );

  ordered.push(
    ...(questionnaireRandomization
      ? randomizeQuestionSegments(
          unblockedItems,
          `${sessionToken}:${measure.study_measure_id}:unblocked`
        )
      : unblockedItems)
  );

  return ordered;
}

function isStandaloneMediaContent(item: PublicItem) {
  return (
    item.is_content_only &&
    ["image_content", "audio_content", "video_content"].includes(
      item.response_type
    )
  );
}

function measureItemPages(
  measure: PublicMeasure,
  orderedItems: PublicItem[]
) {
  if (orderedItems.length === 0) {
    return [[]] as PublicItem[][];
  }

  const blockById = new Map(
    measure.blocks.map((block) => [block.id, block])
  );
  const pages: PublicItem[][] = [];
  let currentPage: PublicItem[] = [];

  const flushCurrentPage = () => {
    if (currentPage.length === 0) return;
    pages.push(currentPage);
    currentPage = [];
  };

  orderedItems.forEach((item, index) => {
    // Standalone image/audio/video content is an authored participant step,
    // not merely decoration. Give it its own page so it cannot be collapsed
    // into an adjacent question block or effectively skipped by pagination.
    // Media attached to a normal question is NOT content-only and therefore
    // remains on the same page as that question.
    if (isStandaloneMediaContent(item)) {
      flushCurrentPage();
      pages.push([item]);
      return;
    }

    currentPage.push(item);

    const block = item.block_id
      ? blockById.get(item.block_id) || null
      : null;
    const nextItem = orderedItems[index + 1];
    const nextBlockId = nextItem?.block_id || null;
    const leavingBlock = Boolean(
      block && block.id !== nextBlockId
    );

    if (leavingBlock && block?.page_break_after) {
      flushCurrentPage();
    }
  });

  flushCurrentPage();

  return pages.length > 0 ? pages : ([[]] as PublicItem[][]);
}

function deterministicOptions(
  item: PublicItem,
  sessionToken: string
) {
  const options = [...(item.response_options || [])];
  const shouldRandomize = Boolean(
    (item.randomization_config as { randomize_options?: boolean })
      ?.randomize_options
  );

  if (!shouldRandomize || options.length < 2) return options;

  const seed = deterministicSeed(`${sessionToken}:${item.id}`);

  return options
    .map((option, index) => ({
      option,
      sort:
        ((seed ^ ((index + 1) * 2654435761)) >>> 0) / 4294967296,
    }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.option);
}

function responseHasValue(value: AnswerValue | undefined) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function scalarNumericValue(value: AnswerValue | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? 1 : 0;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function rawScoreForItem(
  item: PublicItem,
  value: AnswerValue | undefined
) {
  const scalar = scalarNumericValue(value);

  if (scalar !== null) {
    const numericOptions = item.response_options
      .map((option) => Number(option.value))
      .filter((entry) => Number.isFinite(entry));

    if (item.response_type === "thurstone") {
      const weight = Number(
        (item.scoring_config as { thurstone_weight?: number })
          ?.thurstone_weight
      );

      return scalar > 0 && Number.isFinite(weight) ? weight : 0;
    }

    if (item.reverse_scored && numericOptions.length > 0) {
      const minimum = Math.min(...numericOptions);
      const maximum = Math.max(...numericOptions);
      return minimum + maximum - scalar;
    }

    return scalar;
  }

  if (Array.isArray(value)) {
    const values = value
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry));

    if (values.length > 0) {
      return values.reduce((sum, entry) => sum + entry, 0);
    }
  }

  return null;
}

function median(values: number[]) {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function optionWeightForValue(
  item: PublicItem,
  value: string | number | boolean
) {
  const option = (item.response_options || []).find(
    (candidate) => String(candidate.value) === String(value)
  );
  const parsed = Number(option?.weight ?? 1);
  return Number.isFinite(parsed) ? parsed : 1;
}

function weightedScoreForItem(
  item: PublicItem,
  value: AnswerValue | undefined
) {
  if (Array.isArray(value)) {
    let found = false;
    let total = 0;

    for (const entry of value) {
      const numeric = Number(entry);
      if (!Number.isFinite(numeric)) continue;

      found = true;
      total += numeric * optionWeightForValue(item, entry);
    }

    return found ? total : null;
  }

  const raw = rawScoreForItem(item, value);
  if (raw === null) return null;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return raw * optionWeightForValue(item, value);
  }

  return raw;
}

function possibleMaximumForItem(item: PublicItem) {
  if (item.response_type === "thurstone") {
    const weight = Number(
      (item.scoring_config as { thurstone_weight?: number })
        ?.thurstone_weight
    );
    return Number.isFinite(weight) ? Math.max(0, weight) : null;
  }

  const numericOptions = (item.response_options || [])
    .map((option) => Number(option.value))
    .filter((value) => Number.isFinite(value));

  if (numericOptions.length > 0) {
    if (["multiple_choice", "checklist"].includes(item.response_type)) {
      const positive = numericOptions.filter((value) => value > 0);
      return positive.length > 0
        ? positive.reduce((sum, value) => sum + value, 0)
        : Math.max(...numericOptions);
    }

    return Math.max(...numericOptions);
  }

  const configuredMax = Number(
    (item.response_config as { max?: number | string | null })?.max
  );

  return Number.isFinite(configuredMax) ? configuredMax : null;
}

function responseIsEndorsed(value: AnswerValue | undefined) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;

  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric > 0;

    const normalised = value.trim().toLowerCase();
    return ["yes", "true", "endorsed", "selected"].includes(normalised);
  }

  if (Array.isArray(value)) return value.length > 0;
  return false;
}

type ScoredMeasureItem = {
  item: PublicItem;
  score: number;
  weightedScore: number;
  maximum: number | null;
  endorsement: number;
  imputed: boolean;
};

type PreparedScoringData = {
  entries: ScoredMeasureItem[];
  eligibleItems: PublicItem[];
  missingMethod: string;
  prorationFactor: number;
};

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function itemCanProduceNumericScore(item: PublicItem) {
  if (item.is_content_only) return false;
  if (item.response_type === "thurstone") return true;

  const numericOptions = (item.response_options || [])
    .map((option) => Number(option.value))
    .filter((value) => Number.isFinite(value));

  if (numericOptions.length > 0) return true;

  return [
    "numeric_rating",
    "slider",
    "visual_analogue",
    "star_rating",
    "semantic_differential",
    "integer",
    "decimal",
    "percentage",
    "duration",
  ].includes(item.response_type);
}

function scoredEntryForAnswer(
  item: PublicItem,
  value: AnswerValue | undefined
): ScoredMeasureItem | null {
  if (!responseHasValue(value)) return null;

  const score = rawScoreForItem(item, value);
  if (score === null || !Number.isFinite(score)) return null;

  const weighted = weightedScoreForItem(item, value);

  return {
    item,
    score,
    weightedScore:
      weighted !== null && Number.isFinite(weighted) ? weighted : score,
    maximum: possibleMaximumForItem(item),
    endorsement: responseIsEndorsed(value) ? 1 : 0,
    imputed: false,
  };
}

function prepareScoringData(
  measure: PublicMeasure,
  answers: Record<string, AnswerValue>
): PreparedScoringData | null {
  const eligibleItems = measure.items.filter(
    (item) =>
      !item.is_content_only &&
      itemCanProduceNumericScore(item) &&
      itemIsVisible(item, answers, measure.items)
  );

  if (eligibleItems.length === 0) {
    return {
      entries: [],
      eligibleItems: [],
      missingMethod: "available_items",
      prorationFactor: 1,
    };
  }

  const answeredEntries = eligibleItems
    .map((item) => scoredEntryForAnswer(item, answers[item.id]))
    .filter((entry): entry is ScoredMeasureItem => entry !== null);

  const answeredIds = new Set(answeredEntries.map((entry) => entry.item.id));
  const missingItems = eligibleItems.filter((item) => !answeredIds.has(item.id));

  const missingMethod = String(
    (measure.version.missing_data_config as { method?: string })?.method ||
      "complete_case"
  );

  // A custom missing-data rule is documentation, not executable code. If there
  // is no missing data, normal scoring remains safe; otherwise suppress scores.
  if (missingMethod === "custom" && missingItems.length > 0) {
    return null;
  }

  // This option is intentionally literal to the builder label: optional items
  // may be absent, but a visible required scorable item blocks automatic score.
  if (
    missingMethod === "complete_case" &&
    missingItems.some((item) => item.required)
  ) {
    return null;
  }

  const missingFraction = missingItems.length / eligibleItems.length;

  if (missingMethod === "allow_10_percent" && missingFraction > 0.1 + 1e-9) {
    return null;
  }

  if (missingMethod === "allow_20_percent" && missingFraction > 0.2 + 1e-9) {
    return null;
  }

  if (missingMethod === "prorate_80_percent") {
    const completionFraction = answeredEntries.length / eligibleItems.length;
    if (completionFraction < 0.8 - 1e-9 || answeredEntries.length === 0) {
      return null;
    }

    return {
      entries: answeredEntries,
      eligibleItems,
      missingMethod,
      prorationFactor: eligibleItems.length / answeredEntries.length,
    };
  }

  if (missingMethod === "subscale_mean_imputation" && missingItems.length > 0) {
    if (answeredEntries.length === 0) return null;

    const imputedEntries: ScoredMeasureItem[] = [];

    for (const item of missingItems) {
      const subscale = item.subscale?.trim() || "";
      const pool = subscale
        ? answeredEntries.filter(
            (entry) => entry.item.subscale?.trim() === subscale
          )
        : answeredEntries;

      // A subscale mean cannot be inferred when that entire subscale is absent.
      // Returning no automatic score is safer than silently borrowing another
      // subscale's distribution.
      if (pool.length === 0) return null;

      const meanScore = average(pool.map((entry) => entry.score));
      const meanWeighted = average(
        pool.map((entry) => entry.weightedScore)
      );
      const meanEndorsement = average(
        pool.map((entry) => entry.endorsement)
      );

      if (
        meanScore === null ||
        meanWeighted === null ||
        meanEndorsement === null
      ) {
        return null;
      }

      imputedEntries.push({
        item,
        score: meanScore,
        weightedScore: meanWeighted,
        maximum: possibleMaximumForItem(item),
        endorsement: meanEndorsement,
        imputed: true,
      });
    }

    return {
      entries: [...answeredEntries, ...imputedEntries],
      eligibleItems,
      missingMethod,
      prorationFactor: 1,
    };
  }

  return {
    entries: answeredEntries,
    eligibleItems,
    missingMethod,
    prorationFactor: 1,
  };
}

function calculateRawScores(
  measure: PublicMeasure,
  answers: Record<string, AnswerValue>
) {
  const method = String(measure.version.scoring_method || "sum");

  // Researcher-entered formulas and calibrated IRT/Rasch models are stored as
  // metadata only. Never eval arbitrary researcher text in a participant browser.
  if (
    method === "none" ||
    method === "custom_formula" ||
    method === "irt_rasch"
  ) {
    return {};
  }

  const prepared = prepareScoringData(measure, answers);
  if (!prepared || prepared.entries.length === 0) return {};

  const { entries, eligibleItems, missingMethod, prorationFactor } = prepared;

  const multiplierRaw = Number(measure.version.score_multiplier ?? 1);
  const multiplier = Number.isFinite(multiplierRaw) ? multiplierRaw : 1;
  const result: Record<string, number> = {};

  const write = (key: string, value: number | null) => {
    if (value === null || !Number.isFinite(value)) return;
    result[key] = Number((value * multiplier).toFixed(4));
  };

  const totalScores = entries.map((entry) => entry.score);
  const weightedScores = entries.map((entry) => entry.weightedScore);
  const subscaleNames = Array.from(
    new Set(
      eligibleItems
        .map((item) => item.subscale?.trim() || "")
        .filter(Boolean)
    )
  );

  const entriesForSubscale = (name: string) =>
    entries.filter((entry) => entry.item.subscale?.trim() === name);

  const subscaleProrationFactor = (name: string) => {
    if (missingMethod !== "prorate_80_percent") return 1;

    const eligibleCount = eligibleItems.filter(
      (item) => item.subscale?.trim() === name
    ).length;
    const answeredCount = entriesForSubscale(name).length;

    if (eligibleCount === 0 || answeredCount === 0) return null;
    return eligibleCount / answeredCount;
  };

  if (method === "mean") {
    write("Total", average(totalScores));
    return result;
  }

  if (method === "median") {
    write("Total", median(totalScores));
    return result;
  }

  if (method === "count_endorsed") {
    write(
      "Total",
      entries.reduce((sum, entry) => sum + entry.endorsement, 0) *
        prorationFactor
    );
    return result;
  }

  if (method === "percentage") {
    const scorable = entries.filter(
      (entry) => entry.maximum !== null && Number(entry.maximum) > 0
    );
    const maximum = scorable.reduce(
      (sum, entry) => sum + Number(entry.maximum),
      0
    );
    const achieved = scorable.reduce(
      (sum, entry) => sum + entry.score,
      0
    );

    write("Total", maximum > 0 ? (achieved / maximum) * 100 : null);
    return result;
  }

  if (method === "weighted_sum") {
    write(
      "Total",
      weightedScores.reduce((sum, value) => sum + value, 0) *
        prorationFactor
    );
    return result;
  }

  if (method === "weighted_mean") {
    write("Total", average(weightedScores));
    return result;
  }

  if (method === "thurstone_median") {
    // Missing-value imputation cannot establish that an unobserved statement was
    // endorsed, so only actual endorsed responses enter a Thurstone median.
    const endorsedValues = entries
      .filter(
        (entry) =>
          entry.item.response_type === "thurstone" &&
          !entry.imputed &&
          entry.endorsement > 0
      )
      .map((entry) => entry.score);

    write("Total", median(endorsedValues));
    return result;
  }

  if (method === "subscale_sum" || method === "subscale_mean") {
    if (subscaleNames.length === 0) {
      const value =
        method === "subscale_mean"
          ? average(totalScores)
          : totalScores.reduce((sum, score) => sum + score, 0) *
            prorationFactor;
      write("Total", value);
      return result;
    }

    for (const name of subscaleNames) {
      const group = entriesForSubscale(name).map((entry) => entry.score);
      if (group.length === 0) continue;

      const factor = subscaleProrationFactor(name);
      if (factor === null) continue;

      const value =
        method === "subscale_mean"
          ? average(group)
          : group.reduce((sum, score) => sum + score, 0) * factor;
      write(name, value);
    }

    return result;
  }

  if (method === "total_and_subscales") {
    write(
      "Total",
      totalScores.reduce((sum, value) => sum + value, 0) *
        prorationFactor
    );

    for (const name of subscaleNames) {
      const group = entriesForSubscale(name);
      if (group.length === 0) continue;

      const factor = subscaleProrationFactor(name);
      if (factor === null) continue;

      write(
        name,
        group.reduce((sum, entry) => sum + entry.score, 0) * factor
      );
    }

    return result;
  }

  // Default and explicit `sum`: always emit a true overall Total.
  write(
    "Total",
    totalScores.reduce((sum, value) => sum + value, 0) *
      prorationFactor
  );
  return result;
}

function makeResponseRows(
  measure: PublicMeasure,
  answers: Record<string, AnswerValue>
) {
  return measure.items
    .filter(
      (item) =>
        !item.is_content_only &&
        itemIsVisible(item, answers, measure.items) &&
        responseHasValue(answers[item.id])
    )
    .map((item) => {
      const value = answers[item.id];
      const numeric = scalarNumericValue(value);
      const score = rawScoreForItem(item, value);

      return {
        item_id: item.id,
        response: value,
        numeric_value: numeric,
        text_value:
          typeof value === "string" ? value : null,
        score_value: score,
      };
    });
}

function privateStorageRef(value: unknown) {
  return typeof value === "string" && value.startsWith("storage://");
}

function inferredMediaKind(
  mimeType: string | null | undefined,
  responseType: string,
  url: string
) {
  const mime = String(mimeType || "").toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (mime.startsWith("image/") || responseType === "image_content" || /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/.test(lowerUrl)) return "image";
  if (mime.startsWith("audio/") || responseType === "audio_content" || /\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/.test(lowerUrl)) return "audio";
  if (mime.startsWith("video/") || responseType === "video_content" || /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/.test(lowerUrl)) return "video";
  return "link";
}

function StimulusMedia({
  item,
  storageRef,
  mimeType,
  sessionToken,
  studyToken,
  compact = false,
}: {
  item: PublicItem;
  storageRef: string;
  mimeType?: string | null;
  sessionToken: string;
  studyToken: string;
  compact?: boolean;
}) {
  const [resolvedUrl, setResolvedUrl] = useState(
    privateStorageRef(storageRef) ? "" : storageRef
  );
  const [loadingMedia, setLoadingMedia] = useState(privateStorageRef(storageRef));
  const [mediaError, setMediaError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function resolvePrivateMedia() {
      if (!privateStorageRef(storageRef)) {
        setResolvedUrl(storageRef);
        setLoadingMedia(false);
        setMediaError("");
        return;
      }

      setLoadingMedia(true);
      setMediaError("");

      try {
        const response = await fetch("/api/media/ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "participant_read",
            sessionToken,
            studyToken,
            itemId: item.id,
            storageRef,
          }),
        });

        const result = (await response.json()) as {
          ok?: boolean;
          error?: string;
          signedUrl?: string;
        };

        if (!response.ok || !result.ok || !result.signedUrl) {
          throw new Error(result.error || "Could not load questionnaire media.");
        }

        if (!cancelled) setResolvedUrl(result.signedUrl);
      } catch (error) {
        if (!cancelled) {
          setMediaError(error instanceof Error ? error.message : "Could not load questionnaire media.");
        }
      } finally {
        if (!cancelled) setLoadingMedia(false);
      }
    }

    void resolvePrivateMedia();
    return () => {
      cancelled = true;
    };
  }, [item.id, sessionToken, studyToken, storageRef]);

  if (loadingMedia) {
    return (
      <div className={`rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 ${compact ? "p-3" : "p-4"}`}>
        Loading media...
      </div>
    );
  }

  if (mediaError || !resolvedUrl) {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800 ${compact ? "p-3" : "p-4"}`}>
        {mediaError || "Media is unavailable."}
      </div>
    );
  }

  const kind = inferredMediaKind(mimeType, item.response_type, resolvedUrl);

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedUrl}
        alt=""
        className={compact
          ? "max-h-44 w-full rounded-xl border border-slate-200 object-contain"
          : "max-h-[520px] w-full rounded-2xl border border-slate-200 object-contain"}
      />
    );
  }

  if (kind === "audio") {
    return <audio controls preload="metadata" className="w-full" src={resolvedUrl} />;
  }

  if (kind === "video") {
    return (
      <video
        controls
        preload="metadata"
        className={compact
          ? "max-h-52 w-full rounded-xl border border-slate-200"
          : "max-h-[620px] w-full rounded-2xl border border-slate-200"}
        src={resolvedUrl}
      />
    );
  }

  return (
    <a
      href={resolvedUrl}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-cyan-800 underline"
    >
      Open attached media
    </a>
  );
}

function QuestionInput({
  item,
  answer,
  onChange,
  sessionToken,
  studyToken,
  studyMeasureId,
}: {
  item: PublicItem;
  answer: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  sessionToken: string;
  studyToken: string;
  studyMeasureId?: string;
}) {
  const mediaUrl = typeof item.media_config?.url === "string" ? item.media_config.url : "";

  return (
    <>
      {!item.is_content_only && mediaUrl && (
        <div className="mb-4">
          <StimulusMedia
            item={item}
            storageRef={mediaUrl}
            mimeType={item.media_config?.mime_type}
            sessionToken={sessionToken}
            studyToken={studyToken}
          />
        </div>
      )}
      <QuestionInputBody
        item={item}
        answer={answer}
        onChange={onChange}
        sessionToken={sessionToken}
        studyToken={studyToken}
        studyMeasureId={studyMeasureId}
      />
    </>
  );
}

function QuestionInputBody({
  item,
  answer,
  onChange,
  sessionToken,
  studyToken,
  studyMeasureId,
}: {
  item: PublicItem;
  answer: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  sessionToken: string;
  studyToken: string;
  studyMeasureId?: string;
}) {
  const type = item.response_type;
  const options = deterministicOptions(item, sessionToken);
  const config = item.response_config || {};
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [localUploadPreview, setLocalUploadPreview] = useState("");

  async function uploadParticipantResponse(file: File) {
    if (!studyMeasureId) {
      setUploadError("File responses are not available in this questionnaire context yet.");
      return;
    }

    setUploadingFile(true);
    setUploadError("");

    try {
      const ticketResponse = await fetch("/api/media/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "participant_upload",
          studyToken,
          sessionToken,
          studyMeasureId,
          itemId: item.id,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      });

      const ticket = (await ticketResponse.json()) as {
        ok?: boolean;
        error?: string;
        bucket?: string;
        path?: string;
        token?: string;
        storage_ref?: string;
      };

      if (!ticketResponse.ok || !ticket.ok || !ticket.bucket || !ticket.path || !ticket.token || !ticket.storage_ref) {
        throw new Error(ticket.error || "Could not prepare the file upload.");
      }

      const supabase = createClient();
      const { error } = await supabase.storage
        .from(ticket.bucket)
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type || undefined,
          cacheControl: "3600",
        });

      if (error) throw error;

      if (localUploadPreview) URL.revokeObjectURL(localUploadPreview);
      const shouldPreview = file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/");
      setLocalUploadPreview(shouldPreview ? URL.createObjectURL(file) : "");

      onChange({
        storage_ref: ticket.storage_ref,
        bucket: ticket.bucket,
        path: ticket.path,
        name: file.name,
        mime_type: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Participant file upload failed:", error);
      setUploadError(error instanceof Error ? error.message : "File upload failed.");
    } finally {
      setUploadingFile(false);
    }
  }

  if (item.is_content_only) {
    const mediaUrl =
      typeof item.media_config?.url === "string"
        ? item.media_config.url
        : "";

    if (type === "divider") {
      return <hr className="border-slate-200" />;
    }

    if (type === "heading") {
      return <h3 className="text-xl font-semibold">{item.prompt}</h3>;
    }

    if (type === "image_content" && mediaUrl) {
      return (
        <div>
          <p className="mb-4 text-sm leading-6 text-slate-600">{item.prompt}</p>
          <StimulusMedia item={item} storageRef={mediaUrl} mimeType={item.media_config?.mime_type || "image/*"} sessionToken={sessionToken} studyToken={studyToken} />
        </div>
      );
    }

    if (type === "audio_content" && mediaUrl) {
      return (
        <div>
          <p className="mb-4 text-sm leading-6 text-slate-600">{item.prompt}</p>
          <StimulusMedia item={item} storageRef={mediaUrl} mimeType={item.media_config?.mime_type || "audio/*"} sessionToken={sessionToken} studyToken={studyToken} />
        </div>
      );
    }

    if (type === "video_content" && mediaUrl) {
      return (
        <div>
          <p className="mb-4 text-sm leading-6 text-slate-600">{item.prompt}</p>
          <StimulusMedia item={item} storageRef={mediaUrl} mimeType={item.media_config?.mime_type || "video/*"} sessionToken={sessionToken} studyToken={studyToken} />
        </div>
      );
    }

    return (
      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
        {item.prompt}
      </p>
    );
  }

  if (
    [
      "likert",
      "frequency",
      "intensity",
      "yes_no",
      "true_false",
      "single_choice",
      "thurstone",
      "guttman",
      "forced_choice",
      "image_choice",
    ].includes(type)
  ) {
    return (
      <div className="grid gap-2">
        {options.map((option, index) => {
          const selected = String(answer) === String(optionValue(option));

          return (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => onChange(optionValue(option))}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                selected
                  ? "border-cyan-700 bg-cyan-50 text-cyan-950"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {type === "image_choice" && option.media_url && (
                <div className="mb-3">
                  <StimulusMedia
                    item={item}
                    storageRef={option.media_url}
                    mimeType={option.media_mime_type || "image/*"}
                    sessionToken={sessionToken}
                    studyToken={studyToken}
                    compact
                  />
                </div>
              )}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "dropdown") {
    return (
      <select
        value={answer === undefined || answer === null ? "" : String(answer)}
        onChange={(event) => {
          const option = options.find(
            (candidate) => String(candidate.value) === event.target.value
          );
          onChange(option ? option.value : event.target.value);
        }}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
      >
        <option value="">Choose an option...</option>
        {options.map((option, index) => (
          <option key={`${item.id}-${index}`} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (["multiple_choice", "checklist"].includes(type)) {
    const selected = Array.isArray(answer) ? answer.map(String) : [];

    return (
      <div className="grid gap-2">
        {options.map((option, index) => {
          const value = String(option.value);
          const checked = selected.includes(value);

          return (
            <label
              key={`${item.id}-${index}`}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  const next = checked
                    ? selected.filter((entry) => entry !== value)
                    : [...selected, value];
                  onChange(next);
                }}
                className="mt-0.5"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (
    [
      "numeric_rating",
      "slider",
      "visual_analogue",
      "star_rating",
      "semantic_differential",
    ].includes(type)
  ) {
    const min = Number(config.min ?? options[0]?.value ?? 0);
    const max = Number(
      config.max ?? options[options.length - 1]?.value ?? 10
    );
    const step = Number(config.step ?? 1);
    const current =
      typeof answer === "number" ? answer : min;

    return (
      <div>
        <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            {String(config.left_anchor || min)}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            {current}
          </span>
          <span className="text-right">
            {String(config.right_anchor || max)}
          </span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={(event) => onChange(Number(event.target.value))}
          className="mt-4 w-full"
        />
      </div>
    );
  }

  if (
    ["integer", "decimal", "percentage", "duration"].includes(type)
  ) {
    const min =
      config.min === null || config.min === undefined
        ? undefined
        : Number(config.min);
    const max =
      config.max === null || config.max === undefined
        ? undefined
        : Number(config.max);

    return (
      <input
        type="number"
        min={min}
        max={max}
        step={type === "integer" ? 1 : Number(config.step ?? 0.1)}
        value={typeof answer === "number" ? answer : ""}
        onChange={(event) =>
          onChange(
            event.target.value === ""
              ? null
              : Number(event.target.value)
          )
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    );
  }

  if (type === "short_text") {
    return (
      <input
        type="text"
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        maxLength={
          typeof config.max_characters === "number"
            ? config.max_characters
            : undefined
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    );
  }

  if (type === "long_text") {
    return (
      <textarea
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        maxLength={
          typeof config.max_characters === "number"
            ? config.max_characters
            : undefined
        }
        className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    );
  }

  if (["email", "phone", "location"].includes(type)) {
    return (
      <input
        type={type === "email" ? "email" : "text"}
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    );
  }

  if (["date", "time", "datetime"].includes(type)) {
    return (
      <input
        type={type === "datetime" ? "datetime-local" : type}
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
    );
  }

  if (type === "ranking" || type === "q_sort") {
    const current =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as Record<string, string | number | boolean | string[]>)
        : {};

    return (
      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={`${item.id}-${index}`}
            className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_130px] sm:items-center"
          >
            <span className="text-sm">{option.label}</span>
            <select
              value={String(current[String(option.value)] ?? "")}
              onChange={(event) =>
                onChange({
                  ...current,
                  [String(option.value)]: event.target.value,
                })
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              <option value="">Rank...</option>
              {options.map((_, rank) => (
                <option key={rank + 1} value={rank + 1}>
                  {rank + 1}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  if (type === "pairwise") {
    const current =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as Record<string, string | number | boolean | string[]>)
        : {};

    const pairs: Array<[ResponseOption, ResponseOption, string]> = [];

    for (let a = 0; a < options.length; a += 1) {
      for (let b = a + 1; b < options.length; b += 1) {
        pairs.push([options[a], options[b], `${a}-${b}`]);
      }
    }

    return (
      <div className="space-y-3">
        {pairs.map(([left, right, key]) => (
          <div
            key={key}
            className="rounded-xl border border-slate-200 p-4"
          >
            <p className="mb-3 text-xs font-medium text-slate-500">
              Which do you prefer?
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              {[left, right].map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...current,
                      [key]: String(option.value),
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    current[key] === String(option.value)
                      ? "border-cyan-700 bg-cyan-50"
                      : "border-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "best_worst") {
    const current =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as Record<string, string | number | boolean | string[]>)
        : {};

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {["best", "worst"].map((field) => (
          <label key={field}>
            <span className="text-xs font-medium text-slate-500">
              {field === "best" ? "Most / best" : "Least / worst"}
            </span>
            <select
              value={String(current[field] ?? "")}
              onChange={(event) =>
                onChange({
                  ...current,
                  [field]: event.target.value,
                })
              }
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
            >
              <option value="">Choose...</option>
              {options.map((option, index) => (
                <option key={index} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  if (type === "constant_sum") {
    const target = Number(config.constant_sum_target ?? 100);
    const current =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as Record<string, string | number | boolean | string[]>)
        : {};

    const total = options.reduce(
      (sum, option) =>
        sum + Number(current[String(option.value)] || 0),
      0
    );

    return (
      <div>
        <div className="space-y-2">
          {options.map((option, index) => (
            <label
              key={index}
              className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_140px] sm:items-center"
            >
              <span className="text-sm">{option.label}</span>
              <input
                type="number"
                min={0}
                value={String(current[String(option.value)] ?? "")}
                onChange={(event) =>
                  onChange({
                    ...current,
                    [String(option.value)]:
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value),
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>

        <p
          className={`mt-3 text-xs ${
            total === target ? "text-emerald-700" : "text-slate-500"
          }`}
        >
          Total: {total} / {target}
        </p>
      </div>
    );
  }

  if (
    [
      "likert_matrix",
      "single_choice_matrix",
      "semantic_matrix",
      "multiple_choice_matrix",
    ].includes(type)
  ) {
    const rows = Array.isArray(config.matrix_rows)
      ? config.matrix_rows.map(String)
      : [];
    const current =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as Record<string, string | number | boolean | string[]>)
        : {};

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-3 pr-3 font-medium">Statement</th>
              {options.map((option, index) => (
                <th
                  key={index}
                  className="px-2 pb-3 text-center text-xs font-medium text-slate-500"
                >
                  {option.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const rowValue = current[row];

              return (
                <tr key={row}>
                  <td className="py-4 pr-3">{row}</td>

                  {options.map((option, index) => {
                    const value = String(option.value);

                    if (type === "multiple_choice_matrix") {
                      const selected = Array.isArray(rowValue)
                        ? rowValue.map(String)
                        : [];

                      return (
                        <td key={index} className="px-2 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selected.includes(value)}
                            onChange={() =>
                              onChange({
                                ...current,
                                [row]: selected.includes(value)
                                  ? selected.filter(
                                      (entry) => entry !== value
                                    )
                                  : [...selected, value],
                              })
                            }
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={index} className="px-2 py-4 text-center">
                        <input
                          type="radio"
                          name={`${item.id}-${row}`}
                          checked={String(rowValue ?? "") === value}
                          onChange={() =>
                            onChange({
                              ...current,
                              [row]: value,
                            })
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  if (
    ["file_upload", "image_upload", "audio_response", "video_response"].includes(
      type
    )
  ) {
    const accept =
      type === "image_upload"
        ? "image/*"
        : type === "audio_response"
          ? "audio/*"
          : type === "video_response"
            ? "video/*"
            : ".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.rtf,image/*,audio/*,video/*";

    const metadata =
      answer && typeof answer === "object" && !Array.isArray(answer)
        ? (answer as Record<string, string | number | boolean | string[]>)
        : null;
    const fileName = typeof metadata?.name === "string" ? metadata.name : "";
    const mime = typeof metadata?.mime_type === "string" ? metadata.mime_type : "";

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold ${uploadingFile ? "bg-slate-300 text-slate-600" : "bg-slate-950 text-white hover:bg-slate-800"}`}>
            {uploadingFile ? "Uploading..." : fileName ? "Replace file" : type === "audio_response" ? "Choose / record audio" : type === "video_response" ? "Choose / record video" : "Choose file"}
            <input
              type="file"
              accept={accept}
              disabled={uploadingFile}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadParticipantResponse(file);
                event.currentTarget.value = "";
              }}
            />
          </label>

          {fileName && (
            <>
              <span className="max-w-full truncate text-xs text-emerald-700">✓ {fileName}</span>
              <button
                type="button"
                onClick={() => {
                  if (localUploadPreview) URL.revokeObjectURL(localUploadPreview);
                  setLocalUploadPreview("");
                  onChange(null);
                }}
                className="text-xs font-semibold text-red-700"
              >
                Remove
              </button>
            </>
          )}
        </div>

        {uploadError && (
          <p className="mt-3 text-xs leading-5 text-red-700">{uploadError}</p>
        )}

        {localUploadPreview && mime.startsWith("image/") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={localUploadPreview} alt="" className="mt-4 max-h-72 rounded-xl border border-slate-200 object-contain" />
        )}
        {localUploadPreview && mime.startsWith("audio/") && (
          <audio controls src={localUploadPreview} className="mt-4 w-full" />
        )}
        {localUploadPreview && mime.startsWith("video/") && (
          <video controls src={localUploadPreview} className="mt-4 max-h-80 w-full rounded-xl border border-slate-200" />
        )}

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Files are uploaded to private study storage. The saved questionnaire response contains only private file metadata/path, not a public URL.
        </p>
      </div>
    );
  }

  return (
    <textarea
      value={typeof answer === "string" ? answer : ""}
      onChange={(event) => onChange(event.target.value)}
      rows={4}
      placeholder="Enter your response..."
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
    />
  );
}

function DemographicInput({
  question,
  answer,
  onChange,
}: {
  question: PublicDemographicQuestion;
  answer: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  const options = Array.isArray(question.response_config?.options)
    ? question.response_config.options
    : [];
  const placeholder = String(question.response_config?.placeholder || "");

  if (question.question_type === "short_text") {
    return (
      <input
        type="text"
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
      />
    );
  }

  if (question.question_type === "email") {
    return (
      <input
        type="email"
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || "name@example.com"}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
      />
    );
  }

  if (question.question_type === "long_text") {
    return (
      <textarea
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
      />
    );
  }

  if (question.question_type === "number") {
    return (
      <input
        type="number"
        min={
          question.validation_config?.min_value === null ||
          question.validation_config?.min_value === undefined
            ? undefined
            : Number(question.validation_config.min_value)
        }
        max={
          question.validation_config?.max_value === null ||
          question.validation_config?.max_value === undefined
            ? undefined
            : Number(question.validation_config.max_value)
        }
        value={typeof answer === "number" ? answer : ""}
        onChange={(event) =>
          onChange(
            event.target.value === "" ? null : Number(event.target.value)
          )
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
      />
    );
  }

  if (question.question_type === "date") {
    return (
      <input
        type="date"
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
      />
    );
  }

  if (question.question_type === "yes_no") {
    return (
      <div className="flex flex-wrap gap-2">
        {["Yes", "No"].map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => onChange(choice)}
            className={`rounded-xl border px-4 py-2.5 text-sm ${
              answer === choice
                ? "border-cyan-700 bg-cyan-50 text-cyan-950"
                : "border-slate-200 bg-white"
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    );
  }

  if (question.question_type === "dropdown") {
    return (
      <select
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-700"
      >
        <option value="">Choose an option...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (question.question_type === "multiple_choice") {
    const selected = Array.isArray(answer) ? answer.map(String) : [];

    return (
      <div className="grid gap-2">
        {options.map((option) => {
          const checked = selected.includes(option);

          return (
            <label
              key={option}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? selected.filter((entry) => entry !== option)
                      : [...selected, option]
                  )
                }
                className="mt-0.5"
              />
              <span className="text-sm">{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-xl border px-4 py-3 text-left text-sm ${
            answer === option
              ? "border-cyan-700 bg-cyan-50 text-cyan-950"
              : "border-slate-200 bg-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function ParticipantStudyPage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token || "");

  const [payload, setPayload] = useState<PublicStudyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [participantCode, setParticipantCode] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [publicId, setPublicId] = useState("");
  const [starting, setStarting] = useState(false);

  const [consentAnswers, setConsentAnswers] = useState<
    Record<string, AnswerValue>
  >({});
  const [savingConsent, setSavingConsent] = useState(false);

  const [demographicAnswers, setDemographicAnswers] = useState<
    Record<string, AnswerValue>
  >({});
  const [demographicsSaved, setDemographicsSaved] =
    useState(false);
  const [savingDemographics, setSavingDemographics] = useState(false);

  const [completedMeasureIds, setCompletedMeasureIds] = useState<string[]>([]);
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(0);
  const [currentMeasurePage, setCurrentMeasurePage] = useState(0);
  const [measureAnswers, setMeasureAnswers] = useState<
    Record<string, AnswerValue>
  >({});
  const [savingMeasure, setSavingMeasure] = useState(false);

  const [phase, setPhase] = useState<
    | "landing"
    | "consent"
    | "demographics"
    | "measures"
    | "study_dashboard"
    | "ambulatory_checkin"
    | "followup_contact"
    | "complete"
  >("landing");

  const [followupConfigured, setFollowupConfigured] = useState(false);
  const [followupContactEnabled, setFollowupContactEnabled] =
    useState(false);
  const [followupContactEmail, setFollowupContactEmail] = useState("");
  const [followupContactConsent, setFollowupContactConsent] =
    useState(false);
  const [savingFollowupContact, setSavingFollowupContact] =
    useState(false);
  const [followupContactStatus, setFollowupContactStatus] =
    useState("");

  const [ambulatoryConfig, setAmbulatoryConfig] =
    useState<PublicAmbulatoryConfig | null>(null);
  const [ambulatoryDashboard, setAmbulatoryDashboard] =
    useState<AmbulatoryDashboardPayload | null>(null);
  const [loadingAmbulatoryDashboard, setLoadingAmbulatoryDashboard] =
    useState(false);
  const [ambulatoryMessage, setAmbulatoryMessage] = useState("");
  const [activeAmbulatoryCheckin, setActiveAmbulatoryCheckin] =
    useState<ActiveAmbulatoryCheckin | null>(null);
  const [ambulatoryResponses, setAmbulatoryResponses] = useState<
    Record<string, any>
  >({});
  const [savingAmbulatory, setSavingAmbulatory] = useState(false);
  const [emailReminderAddress, setEmailReminderAddress] = useState("");
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(false);
  const [emailReminderStatus, setEmailReminderStatus] = useState("");
  const [savingEmailReminder, setSavingEmailReminder] = useState(false);
  const [ambulatoryQuestionnaires, setAmbulatoryQuestionnaires] =
    useState<Record<string, AmbulatoryQuestionnairePayload>>({});

  const baselineMeasures = (payload?.measures || [])
    .filter((measure) => measure.measurement_point === "baseline")
    .sort((a, b) => a.position - b.position);

  const currentMeasure = baselineMeasures[currentMeasureIndex] || null;

  const demographicQuestions = [...(payload?.demographics || [])].sort(
    (a, b) => a.position - b.position
  );

  const demographicsIncluded =
    Boolean(payload?.study?.components?.demographics) &&
    demographicQuestions.length > 0;

  useEffect(() => {
    async function loadStudy() {
      if (!token) return;

      setLoading(true);
      setPageError("");

      const supabase = createClient();

      const { data, error } = await supabase.rpc(
        "psylattice_public_study",
        { p_token: token }
      );

      if (error) {
        console.error("Could not load public study:", error);
        setPageError("This study could not be loaded.");
        setLoading(false);
        return;
      }

      const studyPayload = data as PublicStudyPayload;

      if (!studyPayload?.ok) {
        setPageError(
          studyPayload?.error || "This study link is not available."
        );
        setLoading(false);
        return;
      }

      setPayload(studyPayload);

      const {
        data: ambulatoryData,
        error: ambulatoryError,
      } = await supabase.rpc(
        "psylattice_public_study_ambulatory",
        {
          p_token: token,
        }
      );

      if (ambulatoryError) {
        console.error(
          "Could not load public ambulatory configuration:",
          ambulatoryError
        );
        setAmbulatoryConfig({
          ok: false,
          enabled: false,
        });
      } else {
        setAmbulatoryConfig(
          (ambulatoryData ||
            {
              ok: true,
              enabled: false,
            }) as PublicAmbulatoryConfig
        );
      }

      const {
        data: followupSettings,
        error: followupSettingsError,
      } = await supabase.rpc(
        "psylattice_public_followup_settings",
        {
          p_token: token,
        }
      );

      const hasFollowupContact =
        !followupSettingsError &&
        Boolean(
          followupSettings?.ok &&
            followupSettings?.followup_enabled
        );

      setFollowupContactEnabled(
        hasFollowupContact
      );

      const storedSession =
        typeof window !== "undefined"
          ? window.localStorage.getItem(`psylattice-study-${token}`)
          : null;

      if (storedSession) {
        const { data: resumeData, error: resumeError } =
          await supabase.rpc("psylattice_resume_participation", {
            p_token: token,
            p_session_token: storedSession,
          });

        if (!resumeError && resumeData?.ok) {
          const resumedCompletedIds =
            Array.isArray(resumeData.completed_measure_ids)
              ? resumeData.completed_measure_ids.map(String)
              : [];

          const resumedBaselineIds =
            (studyPayload.measures || [])
              .filter(
                (measure) =>
                  measure.measurement_point === "baseline"
              )
              .map(
                (measure) =>
                  String(measure.study_measure_id)
              );

          const resumedBaselineComplete =
            resumedBaselineIds.length > 0 &&
            resumedBaselineIds.every((id) =>
              resumedCompletedIds.includes(id)
            );

          // TEST links are commonly reused while a questionnaire is being
          // edited. Once the prior TEST baseline is complete, silently
          // resuming that browser session makes the runner skip every
          // already-completed study_measure_id — even when the questionnaire
          // content has since changed. A completed TEST run therefore starts
          // fresh on the next load instead of being silently resumed.
          if (
            studyPayload.link?.is_test_link &&
            (resumeData.session_status === "completed" ||
              resumedBaselineComplete)
          ) {
            window.localStorage.removeItem(
              `psylattice-study-${token}`
            );
            setSessionToken("");
            setPublicId("");
            setCompletedMeasureIds([]);
            setCurrentMeasureIndex(0);
            setCurrentMeasurePage(0);
            setMeasureAnswers({});
            setConsentAnswers({});
            setDemographicAnswers({});
            setDemographicsSaved(false);
            setPhase("landing");
            setLoading(false);
            return;
          }

          setSessionToken(storedSession);
          setPublicId(String(resumeData.public_id || ""));
          setCompletedMeasureIds(resumedCompletedIds);

          if (resumeData.session_status === "completed") {
            if (hasFollowupContact) {
              const {
                data: contactData,
                error: contactError,
              } = await supabase.rpc(
                "psylattice_followup_contact_status",
                {
                  p_session_token:
                    storedSession,
                }
              );

              if (
                !contactError &&
                contactData?.ok &&
                !contactData?.recorded
              ) {
                setFollowupConfigured(true);
                setPhase(
                  "followup_contact"
                );
                setLoading(false);
                return;
              }

              if (
                !contactError &&
                contactData?.ok
              ) {
                setFollowupContactEmail(
                  String(
                    contactData.email || ""
                  )
                );
                setFollowupContactConsent(
                  Boolean(
                    contactData.consented
                  )
                );
              }
            }

            setPhase("complete");
            setLoading(false);
            return;
          }

          const hasAmbulatory =
            Boolean(
              (ambulatoryData as PublicAmbulatoryConfig | null)
                ?.enabled
            );

          if (
            hasAmbulatory &&
            resumeData.participant_status ===
              "baseline_complete"
          ) {
            setPhase("study_dashboard");
            setLoading(false);
            return;
          }

          const consentRequired =
            studyPayload.consent?.consent_method === "psylattice";

          const demographicsRequired =
            Boolean(studyPayload.study?.components?.demographics) &&
            Array.isArray(studyPayload.demographics) &&
            studyPayload.demographics.length > 0;

          setDemographicsSaved(
            Boolean(resumeData.demographics_saved)
          );

          if (consentRequired && !resumeData.consent_saved) {
            setPhase("consent");
          } else if (
            demographicsRequired &&
            !resumeData.demographics_saved
          ) {
            setPhase("demographics");
          } else {
            const completedIds =
              Array.isArray(
                resumeData.completed_measure_ids
              )
                ? resumeData.completed_measure_ids.map(
                    String
                  )
                : [];

            const baselineIds =
              (studyPayload.measures || [])
                .filter(
                  (measure) =>
                    measure.measurement_point ===
                    "baseline"
                )
                .map(
                  (measure) =>
                    measure.study_measure_id
                );

            const baselineComplete =
              baselineIds.every((id) =>
                completedIds.includes(id)
              );

            if (
              hasAmbulatory &&
              baselineComplete
            ) {
              const { error: enterError } =
                await supabase.rpc(
                  "psylattice_enter_ambulatory_study",
                  {
                    p_session_token:
                      storedSession,
                  }
                );

              if (!enterError) {
                setPhase(
                  "study_dashboard"
                );
              } else {
                setPhase("measures");
              }
            } else {
              setPhase("measures");
            }
          }
        } else {
          window.localStorage.removeItem(`psylattice-study-${token}`);
        }
      }

      setLoading(false);
    }

    void loadStudy();
  }, [token]);

  useEffect(() => {
    if (phase !== "measures") return;

    const firstIncomplete = baselineMeasures.findIndex(
      (measure) => !completedMeasureIds.includes(measure.study_measure_id)
    );

    if (firstIncomplete >= 0) {
      setCurrentMeasureIndex(firstIncomplete);
      setCurrentMeasurePage(0);
      setMeasureAnswers({});
    }
  }, [phase, completedMeasureIds.length]);


  useEffect(() => {
    if (phase !== "study_dashboard") {
      return;
    }

    void loadAmbulatoryDashboard();

    function refreshOnFocus() {
      void loadAmbulatoryDashboard(false);
    }

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadAmbulatoryDashboard(false);
      }
    }

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshOnFocus
      );
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
    };
  }, [phase, sessionToken]);

  function timezoneOffsetMinutes() {
    return new Date().getTimezoneOffset();
  }

  function timezoneName() {
    try {
      return (
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone || ""
      );
    } catch {
      return "";
    }
  }

  async function enterAmbulatoryStudy() {
    if (!sessionToken) {
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_enter_ambulatory_study",
      {
        p_session_token: sessionToken,
      }
    );

    if (error || !data?.ok) {
      console.error(
        "Could not enter ambulatory phase:",
        error
      );
      setPageError(
        error?.message ||
          "The ambulatory part of this study could not be started."
      );
      return;
    }

    setPhase("study_dashboard");
  }

  async function loadAmbulatoryDashboard(
    showLoading = true
  ) {
    if (!sessionToken || !token) {
      return;
    }

    if (showLoading) {
      setLoadingAmbulatoryDashboard(true);
    }

    setAmbulatoryMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_ambulatory_dashboard",
      {
        p_token: token,
        p_session_token: sessionToken,
        p_timezone_offset_minutes:
          timezoneOffsetMinutes(),
        p_timezone_name: timezoneName(),
      }
    );

    if (error || !data?.ok) {
      console.error(
        "Could not load ambulatory study dashboard:",
        error
      );
      setPageError(
        error?.message ||
          data?.error ||
          "Your study dashboard could not be loaded."
      );
      setLoadingAmbulatoryDashboard(false);
      return;
    }

    setAmbulatoryDashboard(
      data as AmbulatoryDashboardPayload
    );

    await loadParticipantEmailReminderPreference();

    // Queue scheduled email reminders when the participant has
    // explicitly supplied an email address and enabled reminders.
    await supabase.rpc(
      "psylattice_queue_participant_ambulatory_notifications",
      {
        p_session_token: sessionToken,
        p_token: token,
      }
    );

    setLoadingAmbulatoryDashboard(false);
  }

  async function loadParticipantEmailReminderPreference() {
    if (!sessionToken) {
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_participant_email_reminder_preference",
      {
        p_session_token: sessionToken,
      }
    );

    if (error || !data?.ok) {
      return;
    }

    setEmailReminderAddress(
      String(data.email || "")
    );
    setEmailRemindersEnabled(
      Boolean(data.enabled)
    );
  }

  async function saveParticipantEmailReminderPreference(
    enabled: boolean
  ) {
    if (
      !sessionToken ||
      savingEmailReminder
    ) {
      return;
    }

    if (
      enabled &&
      !emailReminderAddress.trim()
    ) {
      setEmailReminderStatus(
        "Enter an email address first."
      );
      return;
    }

    setSavingEmailReminder(true);
    setEmailReminderStatus("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_set_participant_email_reminders",
      {
        p_session_token: sessionToken,
        p_email:
          emailReminderAddress.trim(),
        p_enabled: enabled,
      }
    );

    if (error || !data?.ok) {
      setEmailReminderStatus(
        error?.message ||
          data?.error ||
          "Email reminder settings could not be saved."
      );
      setSavingEmailReminder(false);
      return;
    }

    setEmailReminderAddress(
      String(data.email || "")
    );
    setEmailRemindersEnabled(
      Boolean(data.enabled)
    );

    if (enabled) {
      await supabase.rpc(
        "psylattice_queue_participant_ambulatory_notifications",
        {
          p_session_token: sessionToken,
          p_token: token,
        }
      );
    }

    setEmailReminderStatus(
      enabled
        ? "Email reminders are enabled."
        : "Email reminders are off."
    );

    setSavingEmailReminder(false);
  }

  async function startAmbulatoryCheckin(
    scheduleKey: string,
    promptId?: string | null
  ) {
    if (!sessionToken) {
      return;
    }

    setPageError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_start_research_ambulatory_checkin",
      {
        p_token: token,
        p_session_token: sessionToken,
        p_schedule_key: scheduleKey,
        p_prompt_id: promptId || null,
        p_timezone_offset_minutes:
          timezoneOffsetMinutes(),
      }
    );

    if (error || !data?.ok) {
      console.error(
        "Could not start ambulatory check-in:",
        error
      );
      setPageError(
        error?.message ||
          data?.error ||
          "This check-in could not be opened."
      );
      return;
    }

    setActiveAmbulatoryCheckin({
      checkin_id: String(data.checkin_id),
      schedule:
        data.schedule as AmbulatoryScheduleDraft,
      prompt_id: promptId || null,
    });
    setAmbulatoryResponses({});
    setPhase("ambulatory_checkin");
  }

  function updateAmbulatoryResponse(
    item: AmbulatoryItemDraft,
    value: any
  ) {
    if (!activeAmbulatoryCheckin) {
      return;
    }

    const flattened =
      activeAmbulatoryCheckin.schedule.items;

    const next =
      cleanHiddenAmbulatoryResponses(
        flattened,
        {
          ...ambulatoryResponses,
          [item.key]: value,
        }
      );

    setAmbulatoryResponses(next);
  }

  async function loadAmbulatoryQuestionnaire(
    questionnaireId: string
  ) {
    if (
      ambulatoryQuestionnaires[
        questionnaireId
      ] ||
      !sessionToken
    ) {
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_public_ambulatory_questionnaire",
      {
        p_token: token,
        p_session_token: sessionToken,
        p_questionnaire_id:
          questionnaireId,
      }
    );

    if (error || !data?.ok) {
      setPageError(
        error?.message ||
          data?.error ||
          "The questionnaire could not be loaded."
      );
      return;
    }

    setAmbulatoryQuestionnaires(
      (current) => ({
        ...current,
        [questionnaireId]:
          data as AmbulatoryQuestionnairePayload,
      })
    );
  }

  async function submitAmbulatoryCheckin() {
    if (
      !activeAmbulatoryCheckin ||
      savingAmbulatory
    ) {
      return;
    }

    const visibleItems =
      ambulatoryVisibleItems(
        activeAmbulatoryCheckin.schedule.items,
        ambulatoryResponses
      );

    for (const item of visibleItems) {
      if (
        !item.required ||
        item.type === "instruction"
      ) {
        continue;
      }

      const answer =
        ambulatoryResponses[item.key];

      const answered =
        answer !== null &&
        answer !== undefined &&
        answer !== "" &&
        (!Array.isArray(answer) ||
          answer.length > 0);

      if (!answered) {
        setPageError(
          `Please complete: ${item.prompt}`
        );
        return;
      }
    }

    setSavingAmbulatory(true);
    setPageError("");

    const responses =
      visibleItems
        .filter(
          (item) =>
            item.type !== "instruction" &&
            Object.prototype.hasOwnProperty.call(
              ambulatoryResponses,
              item.key
            )
        )
        .map((item) => ({
          item_key: item.key,
          item_type: item.type,
          prompt: item.prompt,
          response:
            ambulatoryResponses[item.key],
        }));

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_submit_research_ambulatory_checkin",
      {
        p_token: token,
        p_session_token: sessionToken,
        p_checkin_id:
          activeAmbulatoryCheckin.checkin_id,
        p_responses: responses,
      }
    );

    if (error || !data?.ok) {
      console.error(
        "Could not submit ambulatory check-in:",
        error
      );
      setPageError(
        error?.message ||
          data?.error ||
          "The check-in could not be saved."
      );
      setSavingAmbulatory(false);
      return;
    }

    setSavingAmbulatory(false);
    setActiveAmbulatoryCheckin(null);
    setAmbulatoryResponses({});
    setAmbulatoryMessage(
      "Check-in saved."
    );
    setPhase("study_dashboard");
  }

  async function completeAmbulatoryStudy() {
    if (!sessionToken) {
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_complete_ambulatory_participation",
      {
        p_session_token: sessionToken,
      }
    );

    if (error || !data?.ok) {
      setPageError(
        error?.message ||
          data?.error ||
          "The study could not be completed yet."
      );
      return;
    }

    const hasFollowup =
      Boolean(
        data.followup_configured
      ) || followupContactEnabled;

    setFollowupConfigured(
      hasFollowup
    );

    if (hasFollowup) {
      setPhase(
        "followup_contact"
      );
    } else {
      setPhase("complete");
    }
  }

  async function saveFollowupContactChoice() {
    if (!sessionToken || savingFollowupContact) {
      return;
    }

    if (!followupContactEmail.trim()) {
      setFollowupContactStatus(
        "Enter the email address where you want to receive your follow-up study invitation."
      );
      return;
    }

    if (!followupContactConsent) {
      setFollowupContactStatus(
        "Please confirm consent to follow-up email contact before continuing."
      );
      return;
    }

    setSavingFollowupContact(true);
    setFollowupContactStatus("");
    setPageError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_save_followup_contact",
      {
        p_session_token: sessionToken,
        p_email: followupContactEmail.trim(),
        p_consented: true,
      }
    );

    if (error || !data?.ok) {
      setFollowupContactStatus(
        error?.message ||
          data?.error ||
          "Your follow-up email could not be saved."
      );
      setSavingFollowupContact(false);
      return;
    }

    setFollowupContactConsent(true);
    setFollowupContactEmail(
      String(data.email || "")
    );
    setFollowupContactStatus(
      "Follow-up email saved."
    );
    setSavingFollowupContact(false);
    setPhase("complete");
  }

  async function startParticipation() {
    if (!payload?.link || starting) return;

    if (
      payload.link.access_mode === "participant_code" &&
      !participantCode.trim()
    ) {
      setPageError("Enter the participant code provided by the research team.");
      return;
    }

    setStarting(true);
    setPageError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_start_participation",
      {
        p_token: token,
        p_participant_code:
          payload.link.access_mode === "participant_code"
            ? participantCode.trim()
            : null,
      }
    );

    if (error || !data?.ok) {
      console.error("Could not start participation:", error);
      setPageError(
        error?.message ||
          "Participation could not be started with this link."
      );
      setStarting(false);
      return;
    }

    const newSessionToken = String(data.session_token);

    // A new participation session must always begin with clean client-side
    // questionnaire progress. This is especially important for reusable TEST
    // links after a previous completed run.
    setCompletedMeasureIds([]);
    setCurrentMeasureIndex(0);
    setCurrentMeasurePage(0);
    setMeasureAnswers({});
    setConsentAnswers({});
    setDemographicAnswers({});
    setDemographicsSaved(false);

    setSessionToken(newSessionToken);
    setPublicId(String(data.public_id || ""));

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `psylattice-study-${token}`,
        newSessionToken
      );
    }

    if (payload.consent?.consent_method === "psylattice") {
      setPhase("consent");
    } else if (demographicsIncluded) {
      setPhase("demographics");
    } else {
      setPhase("measures");
    }

    setStarting(false);
  }

  function validateConsent() {
    const consent = payload?.consent;

    if (!consent || consent.consent_method !== "psylattice") {
      return "";
    }

    for (const item of consent.items) {
      const answer = consentAnswers[item.id];

      if (item.required && !responseHasValue(answer)) {
        return "Please complete every required consent item.";
      }

      if (item.required && item.response_type === "checkbox" && answer !== true) {
        return "Please acknowledge every required consent statement to continue.";
      }

      if (
        item.required &&
        item.response_type === "yes_no" &&
        String(answer).toLowerCase() !== "yes"
      ) {
        return "You must agree to every required consent statement to participate.";
      }

      if (item.response_type === "comprehension") {
        const mustBeCorrect = Boolean(
          (item.validation_config as { must_be_correct?: boolean })
            ?.must_be_correct
        );
        const correctOption = String(
          (item.response_config as { correct_option?: string | null })
            ?.correct_option || ""
        );

        if (
          mustBeCorrect &&
          correctOption &&
          String(answer || "") !== correctOption
        ) {
          return "Please review the study information and answer the comprehension question correctly.";
        }
      }
    }

    return "";
  }

  async function saveConsent() {
    if (!sessionToken || savingConsent) return;

    const validation = validateConsent();

    if (validation) {
      setPageError(validation);
      return;
    }

    setSavingConsent(true);
    setPageError("");

    const supabase = createClient();

    const consentVersionId =
      payload?.consent?.id || "";

    if (!consentVersionId) {
      setPageError(
        "The consent version could not be identified. Please reload the study."
      );
      setSavingConsent(false);
      return;
    }

    const { data, error } = await supabase.rpc(
      "psylattice_save_consent",
      {
        p_session_token: sessionToken,
        p_responses: consentAnswers,
        p_consent_version_id:
          consentVersionId,
      }
    );

    if (error || !data?.ok) {
      console.error(
        "Could not save consent:",
        error,
        data
      );
      setPageError(
        error?.message ||
          (typeof data?.error === "string"
            ? data.error
            : "") ||
          "Your consent responses could not be saved."
      );
      setSavingConsent(false);
      return;
    }

    setPhase(demographicsIncluded ? "demographics" : "measures");
    setSavingConsent(false);
  }

  function validateDemographics() {
    for (const question of demographicQuestions) {
      const answer = demographicAnswers[question.id];

      if (question.required && !responseHasValue(answer)) {
        return `Please complete the required field: ${question.label}.`;
      }

      if (
        question.question_type === "number" &&
        typeof answer === "number"
      ) {
        const minimum = question.validation_config?.min_value;
        const maximum = question.validation_config?.max_value;

        if (minimum !== null && minimum !== undefined && answer < minimum) {
          return `${question.label} must be at least ${minimum}.`;
        }

        if (maximum !== null && maximum !== undefined && answer > maximum) {
          return `${question.label} must be no more than ${maximum}.`;
        }
      }
    }

    return "";
  }

  async function saveDemographics() {
    if (!sessionToken || savingDemographics) return;

    const validation = validateDemographics();

    if (validation) {
      setPageError(validation);
      return;
    }

    setSavingDemographics(true);
    setPageError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_save_demographics",
      {
        p_session_token: sessionToken,
        p_responses: demographicAnswers,
      }
    );

    if (error || !data?.ok) {
      console.error("Could not save demographics:", error, data);
      setPageError(
        (typeof data?.error === "string" && data.error) ||
          error?.message ||
          "Your demographic responses could not be saved."
      );
      setSavingDemographics(false);
      return;
    }

    setDemographicsSaved(true);
    setPhase("measures");
    setSavingDemographics(false);
  }

  function validateMeasure(
    measure: PublicMeasure,
    answers: Record<string, AnswerValue>,
    itemsToValidate: PublicItem[] = measure.items
  ) {
    const itemIdsToValidate = new Set(
      itemsToValidate.map((item) => item.id)
    );

    for (const item of measure.items) {
      if (!itemIdsToValidate.has(item.id)) {
        continue;
      }
      if (
        item.is_content_only ||
        !itemIsVisible(item, answers, measure.items)
      ) {
        continue;
      }

      if (item.required && !responseHasValue(answers[item.id])) {
        return "Please answer every required question before continuing.";
      }

      if (["multiple_choice", "checklist"].includes(item.response_type)) {
        const selected = Array.isArray(answers[item.id])
          ? (answers[item.id] as Array<string | number>)
          : [];

        const min = Number(item.response_config?.min_selections || 0);
        const max = Number(item.response_config?.max_selections || 0);

        if (min > 0 && selected.length < min) {
          return `Please select at least ${min} option${min === 1 ? "" : "s"} for the highlighted question.`;
        }

        if (max > 0 && selected.length > max) {
          return `Please select no more than ${max} option${max === 1 ? "" : "s"} for the highlighted question.`;
        }
      }

      if (item.response_type === "constant_sum") {
        const value = answers[item.id];
        const target = Number(item.response_config?.constant_sum_target || 100);

        if (value && typeof value === "object" && !Array.isArray(value)) {
          const total = Object.values(value).reduce<number>(
            (sum, entry) => sum + Number(entry || 0),
            0
          );

          if (total !== target) {
            return `One allocation question must total exactly ${target}.`;
          }
        }
      }
    }

    return "";
  }

  function continueCurrentMeasurePage(
    pageItems: PublicItem[],
    activePageIndex: number,
    pageCount: number
  ) {
    if (!currentMeasure) return;

    const cleanAnswers = cleanHiddenMeasureAnswers(
      currentMeasure,
      measureAnswers
    );
    const validation = validateMeasure(
      currentMeasure,
      cleanAnswers,
      pageItems
    );

    if (validation) {
      setMeasureAnswers(cleanAnswers);
      setPageError(validation);
      return;
    }

    setMeasureAnswers(cleanAnswers);
    setPageError("");

    if (activePageIndex < pageCount - 1) {
      setCurrentMeasurePage(activePageIndex + 1);

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      return;
    }

    void saveCurrentMeasure();
  }

  function returnToPreviousMeasurePage(activePageIndex: number) {
    setPageError("");
    setCurrentMeasurePage(Math.max(0, activePageIndex - 1));

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function saveCurrentMeasure() {
    if (!currentMeasure || !sessionToken || savingMeasure) return;

    const cleanAnswers = cleanHiddenMeasureAnswers(
      currentMeasure,
      measureAnswers
    );
    const validation = validateMeasure(currentMeasure, cleanAnswers);

    if (validation) {
      setMeasureAnswers(cleanAnswers);
      setPageError(validation);
      return;
    }

    setSavingMeasure(true);
    setPageError("");
    setMeasureAnswers(cleanAnswers);

    const responses = makeResponseRows(currentMeasure, cleanAnswers);
    const scores = calculateRawScores(currentMeasure, cleanAnswers);

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_save_measure",
      {
        p_session_token: sessionToken,
        p_study_measure_id: currentMeasure.study_measure_id,
        p_answers: responses,
        p_scores: scores,
      }
    );

    if (error || !data?.ok) {
      const databaseMessage =
        typeof data?.error === "string" ? data.error : "";

      const databaseStage =
        typeof data?.stage === "string" ? data.stage : "";

      const databaseCode =
        typeof data?.code === "string" ? data.code : "";

      const supabaseMessage = error?.message || "";
      const supabaseDetails = error?.details || "";
      const supabaseHint = error?.hint || "";
      const supabaseCode = error?.code || "";

      const parts = [
        databaseMessage || supabaseMessage,
        databaseStage ? `Stage: ${databaseStage}` : "",
        databaseCode || supabaseCode
          ? `Code: ${databaseCode || supabaseCode}`
          : "",
        supabaseDetails,
        supabaseHint,
      ].filter(Boolean);

      setPageError(
        parts.join(" · ") ||
          "This questionnaire could not be saved."
      );

      setSavingMeasure(false);
      return;
    }

    const nextCompleted = Array.from(
      new Set([...completedMeasureIds, currentMeasure.study_measure_id])
    );

    setCompletedMeasureIds(nextCompleted);
    setMeasureAnswers({});

    const nextIndex = baselineMeasures.findIndex(
      (measure, index) =>
        index > currentMeasureIndex &&
        !nextCompleted.includes(measure.study_measure_id)
    );

    if (nextIndex >= 0) {
      setCurrentMeasureIndex(nextIndex);
      setCurrentMeasurePage(0);
      setSavingMeasure(false);
      return;
    }

    if (ambulatoryConfig?.enabled) {
      await enterAmbulatoryStudy();
    } else {
      await completeParticipation();
    }

    setSavingMeasure(false);
  }

  async function completeParticipation() {
    if (!sessionToken) return;

    if (
      demographicsIncluded &&
      !demographicsSaved
    ) {
      setPageError(
        "Please complete the demographic questions before finishing the study."
      );
      setPhase("demographics");
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_complete_participation",
      { p_session_token: sessionToken }
    );

    if (error || !data?.ok) {
      const completionMessage =
        error?.message ||
        (typeof data?.error === "string"
          ? data.error
          : "") ||
        "Your study session could not be completed.";

      console.error(
        "Could not complete participation:",
        error,
        data
      );

      if (
        completionMessage
          .toLowerCase()
          .includes("demographic")
      ) {
        setDemographicsSaved(false);
        setPageError(
          "Please complete the demographic questions before finishing the study."
        );
        setPhase("demographics");
        return;
      }

      setPageError(completionMessage);
      return;
    }

    const hasFollowup =
      Boolean(
        data.followup_configured
      ) || followupContactEnabled;

    setFollowupConfigured(
      hasFollowup
    );

    if (hasFollowup) {
      setPhase(
        "followup_contact"
      );
    } else {
      setPhase("complete");
    }
  }

  if (loading) {
    return (
      <Shell>
        <Card title="Loading study">
          <p className="text-sm text-slate-500">
            Preparing the participant experience...
          </p>
        </Card>
      </Shell>
    );
  }

  if (pageError && !payload) {
    return (
      <Shell>
        <ErrorBox text={pageError} />
      </Shell>
    );
  }

  if (!payload?.ok || !payload.study || !payload.link) {
    return (
      <Shell>
        <ErrorBox text={pageError || "This study link is unavailable."} />
      </Shell>
    );
  }

  if (phase === "landing") {
    return (
      <Shell>
        <div className="space-y-5">
          {payload.link.is_test_link && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="font-medium text-amber-950">Test participation</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Responses submitted through this link are marked as TEST data
                and should not be treated as study observations. After a TEST
                baseline is completed, reopening this link starts a fresh test
                run so edited questionnaires are not skipped as already complete.
              </p>
            </div>
          )}

          {pageError && <ErrorBox text={pageError} />}

          <Card
            title={payload.study.title}
            description={payload.study.design || undefined}
          >
            <div className="space-y-6">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {payload.study.participant_description ||
                  "The research team has invited you to take part in this PsyLattice study."}
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Questionnaires</p>
                  <p className="mt-1 font-semibold">
                    {baselineMeasures.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Consent</p>
                  <p className="mt-1 font-semibold">
                    {payload.consent?.consent_method === "psylattice"
                      ? "In PsyLattice"
                      : payload.consent?.consent_method === "external"
                        ? "Recorded externally"
                        : "Study configured"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Demographics</p>
                  <p className="mt-1 font-semibold">
                    {demographicQuestions.length > 0
                      ? `${demographicQuestions.length} field${
                          demographicQuestions.length === 1 ? "" : "s"
                        }`
                      : "Not included"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">Data identity</p>
                  <p className="mt-1 font-semibold">Pseudonymous ID</p>
                </div>
              </div>

              {payload.link.access_mode === "participant_code" && (
                <label className="block">
                  <span className="text-sm font-medium">Participant code</span>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Enter the pseudonymous code supplied by the research team.
                  </p>
                  <input
                    value={participantCode}
                    onChange={(event) => setParticipantCode(event.target.value)}
                    placeholder="e.g. P043"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                  />
                </label>
              )}

              <button
                type="button"
                onClick={() => void startParticipation()}
                disabled={starting}
                className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
              >
                {starting ? "Starting..." : "Begin study"}
              </button>
            </div>
          </Card>

          <p className="text-center text-xs leading-5 text-slate-400">
            PsyLattice provides the study interface on behalf of the research
            team. Questions about participation, withdrawal, or the research
            protocol should be directed to the study team using the information
            they provided to you.
          </p>
        </div>
      </Shell>
    );
  }

  if (phase === "consent" && payload.consent) {
    const consent = payload.consent;

    return (
      <Shell>
        <div className="space-y-5">
          {pageError && <ErrorBox text={pageError} />}

          <Card
            title="Participant information & consent"
            description={consent.version_label}
          >
            {consent.participant_information && (
              <div className="mb-7 rounded-2xl bg-slate-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {consent.participant_information}
                </p>
              </div>
            )}

            <div className="space-y-5">
              {consent.items.map((item) => {
                const options = Array.isArray(
                  (item.response_config as { options?: unknown[] }).options
                )
                  ? (
                      item.response_config as {
                        options: unknown[];
                      }
                    ).options.map(String)
                  : [];

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium leading-6">
                        {item.prompt}
                      </p>
                      {item.required && (
                        <span className="shrink-0 text-[11px] font-medium text-cyan-800">
                          Required
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      {item.response_type === "checkbox" && (
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={consentAnswers[item.id] === true}
                            onChange={(event) => {
                              setPageError("");
                              setConsentAnswers((previous) => ({
                                ...previous,
                                [item.id]: event.target.checked,
                              }));
                            }}
                            className="mt-1"
                          />
                          <span className="text-sm text-slate-600">
                            I acknowledge this statement.
                          </span>
                        </label>
                      )}

                      {item.response_type === "yes_no" && (
                        <div className="flex gap-2">
                          {["Yes", "No"].map((choice) => (
                            <button
                              key={choice}
                              type="button"
                              onClick={() => {
                                setPageError("");
                                setConsentAnswers((previous) => ({
                                  ...previous,
                                  [item.id]: choice,
                                }));
                              }}
                              className={`rounded-xl border px-4 py-2.5 text-sm ${
                                consentAnswers[item.id] === choice
                                  ? "border-cyan-700 bg-cyan-50"
                                  : "border-slate-200"
                              }`}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      )}

                      {["initials", "typed_name"].includes(
                        item.response_type
                      ) && (
                        <input
                          value={
                            typeof consentAnswers[item.id] === "string"
                              ? String(consentAnswers[item.id])
                              : ""
                          }
                          onChange={(event) =>
                            setConsentAnswers((previous) => ({
                              ...previous,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder={
                            item.response_type === "initials"
                              ? "Your initials"
                              : "Type your name"
                          }
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        />
                      )}

                      {item.response_type === "date" && (
                        <input
                          type="date"
                          value={
                            typeof consentAnswers[item.id] === "string"
                              ? String(consentAnswers[item.id])
                              : ""
                          }
                          onChange={(event) =>
                            setConsentAnswers((previous) => ({
                              ...previous,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        />
                      )}

                      {["single_choice", "comprehension"].includes(
                        item.response_type
                      ) && (
                        <div className="grid gap-2">
                          {options.map((choice) => (
                            <button
                              key={choice}
                              type="button"
                              onClick={() =>
                                setConsentAnswers((previous) => ({
                                  ...previous,
                                  [item.id]: choice,
                                }))
                              }
                              className={`rounded-xl border px-4 py-3 text-left text-sm ${
                                consentAnswers[item.id] === choice
                                  ? "border-cyan-700 bg-cyan-50"
                                  : "border-slate-200"
                              }`}
                            >
                              {choice}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => void saveConsent()}
                disabled={savingConsent}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingConsent ? "Saving consent..." : "Agree and continue"}
              </button>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  if (phase === "demographics") {
    return (
      <Shell>
        <div className="space-y-5">
          {payload.link.is_test_link && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800">
              TEST participation · Participant ID {publicId}
            </div>
          )}

          {pageError && <ErrorBox text={pageError} />}

          <Card
            title="About you"
            description="Please complete the demographic questions configured by the research team. Fields marked Required must be completed to continue."
          >
            <div className="space-y-5">
              {demographicQuestions.map((question) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium leading-6">
                        {question.label}
                      </p>

                      {question.description && (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {question.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {question.required && (
                        <span className="text-[11px] font-medium text-cyan-800">
                          Required
                        </span>
                      )}
                      {question.direct_identifier && (
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">
                          Identifying data
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <DemographicInput
                      question={question}
                      answer={demographicAnswers[question.id]}
                      onChange={(value) =>
                        setDemographicAnswers((previous) => ({
                          ...previous,
                          [question.id]: value,
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <p className="max-w-2xl text-xs leading-5 text-slate-400">
                The research team decides which demographic information is
                collected. Directly identifying fields are labelled when the
                study configuration marks them as such.
              </p>

              <button
                type="button"
                onClick={() => void saveDemographics()}
                disabled={savingDemographics}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingDemographics ? "Saving..." : "Save & continue"}
              </button>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  if (phase === "study_dashboard") {
    const prompts =
      ambulatoryDashboard?.prompts || [];
    const events =
      ambulatoryDashboard?.event_schedules ||
      [];
    const expected =
      ambulatoryDashboard?.expected_scheduled ||
      0;
    const completed =
      ambulatoryDashboard?.completed_scheduled ||
      0;
    const compliance =
      expected > 0
        ? Math.min(
            100,
            Math.round(
              (completed / expected) * 100
            )
          )
        : 0;

    const now = Date.now();

    function promptState(
      prompt: AmbulatoryPrompt
    ) {
      if (
        prompt.status === "completed"
      ) {
        return "Completed";
      }

      if (
        prompt.status === "missed"
      ) {
        return "Missed";
      }

      const scheduled =
        prompt.scheduled_for
          ? new Date(
              prompt.scheduled_for
            ).getTime()
          : 0;
      const expires =
        prompt.expires_at
          ? new Date(
              prompt.expires_at
            ).getTime()
          : Number.POSITIVE_INFINITY;

      if (
        scheduled &&
        now < scheduled
      ) {
        return "Later";
      }

      if (now <= expires) {
        return "Due";
      }

      return "Missed";
    }

    return (
      <Shell>
        <div className="space-y-5">
          {payload.link.is_test_link && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800">
              TEST longitudinal study · Participant ID {publicId}
            </div>
          )}

          {pageError && (
            <ErrorBox text={pageError} />
          )}

          {ambulatoryMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
              {ambulatoryMessage}
            </div>
          )}

          <Card
            title={
              ambulatoryDashboard?.study_title ||
              payload.study.title
            }
            description={`Study dashboard · Participant ${publicId}`}
          >
            {loadingAmbulatoryDashboard ? (
              <p className="text-sm text-slate-500">
                Loading today's study tasks...
              </p>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">
                      Study day
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {ambulatoryDashboard?.day_number ||
                        1}
                      {" / "}
                      {ambulatoryDashboard?.duration_days ||
                        ambulatoryConfig?.duration_days ||
                        14}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">
                      Scheduled prompts completed
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {completed} / {expected}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">
                      Event reports
                    </p>
                    <p className="mt-2 text-2xl font-semibold">
                      {ambulatoryDashboard?.event_checkins_completed ||
                        0}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold">
                      Study progress
                    </p>
                    <span className="text-xs text-slate-500">
                      {compliance}% scheduled-prompt compliance
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-cyan-700"
                      style={{
                        width: `${compliance}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    PsyLattice shows participation/adherence here by default,
                    not psychological score feedback, so the dashboard does not
                    inadvertently influence later study responses.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card
            title="Today's scheduled check-ins"
            description="Scheduled prompts become available during their configured response window."
          >
            {prompts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No scheduled prompts are configured for today.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {prompts.map((prompt) => {
                  const state =
                    promptState(prompt);
                  const canOpen =
                    state === "Due";

                  return (
                    <div
                      key={prompt.prompt_id}
                      className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-medium">
                          {prompt.schedule_label}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {prompt.scheduled_for
                            ? new Date(
                                prompt.scheduled_for
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "Scheduled"}
                          {prompt.expires_at
                            ? ` · available until ${new Date(
                                prompt.expires_at
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            state ===
                            "Completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : state ===
                                  "Due"
                                ? "bg-cyan-50 text-cyan-800"
                                : state ===
                                    "Missed"
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {state}
                        </span>

                        {canOpen && (
                          <button
                            type="button"
                            onClick={() =>
                              void startAmbulatoryCheckin(
                                prompt.schedule_key,
                                prompt.prompt_id
                              )
                            }
                            className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {events.length > 0 && (
            <Card
              title="Event check-ins"
              description="Use these whenever the defined event occurs. They are not tied to a clock time."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {events.map((schedule) => (
                  <button
                    key={schedule.key}
                    type="button"
                    onClick={() =>
                      void startAmbulatoryCheckin(
                        schedule.key
                      )
                    }
                    className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-5 text-left transition hover:bg-cyan-50"
                  >
                    <p className="font-semibold text-cyan-950">
                      +{" "}
                      {schedule.event_title ||
                        schedule.label}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {schedule.event_description ||
                        "Complete this check-in whenever the event occurs."}
                    </p>

                    <p className="mt-3 text-[11px] text-slate-400">
                      Up to{" "}
                      {schedule.maximum_per_day ||
                        8}{" "}
                      reports/day
                      {schedule.minimum_interval_minutes
                        ? ` · at least ${schedule.minimum_interval_minutes} minutes apart`
                        : ""}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {ambulatoryDashboard?.notifications_enabled && (
            <Card
              title="Email reminders"
              description="Optional contact information for scheduled study reminders."
            >
              <div className="space-y-4">
                <div>
                  <p className="font-medium">
                    Receive study check-in reminders by email
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Your reminder email is stored separately from your study
                    response data. It is used for reminder delivery and is not
                    included in the ordinary research-response export.
                  </p>
                </div>

                <label className="block">
                  <span className="text-xs font-medium text-slate-500">
                    Reminder email
                  </span>
                  <input
                    type="email"
                    value={emailReminderAddress}
                    onChange={(event) =>
                      setEmailReminderAddress(
                        event.target.value
                      )
                    }
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <input
                    type="checkbox"
                    checked={emailRemindersEnabled}
                    onChange={(event) =>
                      void saveParticipantEmailReminderPreference(
                        event.target.checked
                      )
                    }
                    disabled={savingEmailReminder}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      Send scheduled check-in reminders to this email
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      You can turn reminders off at any time. Event-contingent
                      check-ins remain available in the Study Dashboard and do
                      not create clock-based reminder emails.
                    </p>
                  </div>
                </label>

                {emailRemindersEnabled && (
                  <button
                    type="button"
                    disabled={savingEmailReminder}
                    onClick={() =>
                      void saveParticipantEmailReminderPreference(
                        true
                      )
                    }
                    className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900 disabled:opacity-50"
                  >
                    {savingEmailReminder
                      ? "Saving..."
                      : "Save reminder email"}
                  </button>
                )}

                {emailReminderStatus && (
                  <p className="text-xs font-medium text-cyan-800">
                    {emailReminderStatus}
                  </p>
                )}
              </div>
            </Card>
          )}

          {ambulatoryDashboard?.study_complete_available && (
            <Card title="Study period complete">
              <p className="text-sm leading-6 text-slate-500">
                You have reached the end of the configured ambulatory period.
                Submit the longitudinal study when you are ready.
              </p>

              <button
                type="button"
                onClick={() =>
                  void completeAmbulatoryStudy()
                }
                className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Complete study
              </button>
            </Card>
          )}
        </div>
      </Shell>
    );
  }

  if (
    phase === "ambulatory_checkin" &&
    activeAmbulatoryCheckin
  ) {
    const schedule =
      activeAmbulatoryCheckin.schedule;

    const visibleItems =
      ambulatoryVisibleItems(
        schedule.items,
        ambulatoryResponses
      );

    return (
      <Shell>
        <div className="space-y-5">
          {pageError && (
            <ErrorBox text={pageError} />
          )}

          <Card
            title={
              schedule.event_title ||
              schedule.label
            }
            description={
              schedule.event_description ||
              "Complete the questions that apply right now."
            }
          >
            <div className="space-y-6">
              {visibleItems.map(
                (item, index) => {
                  const value =
                    ambulatoryResponses[
                      item.key
                    ];
                  const options =
                    (item.config
                      .options ||
                      []) as string[];

                  return (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium leading-6">
                            {item.prompt}
                          </p>
                          {item.required &&
                            item.type !==
                              "instruction" && (
                              <p className="mt-1 text-[11px] font-medium text-cyan-800">
                                Required
                              </p>
                            )}
                        </div>

                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-400">
                          {item.type.replaceAll(
                            "_",
                            " "
                          )}
                        </span>
                      </div>

                      {item.type ===
                        "instruction" && (
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {item.config
                            .text ||
                            item.prompt}
                        </p>
                      )}

                      {item.type ===
                        "slider" && (
                        <div className="mt-5">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>
                              {item.config
                                .minLabel ||
                                item.config.min}
                            </span>
                            <span className="font-semibold text-slate-700">
                              {value ??
                                item.config
                                  .min ??
                                0}
                            </span>
                            <span>
                              {item.config
                                .maxLabel ||
                                item.config.max}
                            </span>
                          </div>

                          <input
                            type="range"
                            min={
                              item.config.min ??
                              0
                            }
                            max={
                              item.config.max ??
                              10
                            }
                            step={
                              item.config.step ??
                              1
                            }
                            value={
                              value ??
                              item.config.min ??
                              0
                            }
                            onChange={(
                              event
                            ) =>
                              updateAmbulatoryResponse(
                                item,
                                Number(
                                  event
                                    .target
                                    .value
                                )
                              )
                            }
                            className="mt-3 w-full"
                          />
                        </div>
                      )}

                      {(item.type ===
                        "single_choice" ||
                        item.type ===
                          "mood") && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {options.map(
                            (option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() =>
                                  updateAmbulatoryResponse(
                                    item,
                                    option
                                  )
                                }
                                className={`rounded-xl border px-4 py-3 text-left text-sm ${
                                  value ===
                                  option
                                    ? "border-cyan-700 bg-cyan-50 text-cyan-950"
                                    : "border-slate-200 bg-white"
                                }`}
                              >
                                {option}
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {item.type ===
                        "yes_no" && (
                        <div className="mt-4 flex gap-2">
                          {["Yes", "No"].map(
                            (option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() =>
                                  updateAmbulatoryResponse(
                                    item,
                                    option
                                  )
                                }
                                className={`rounded-xl border px-5 py-3 text-sm font-semibold ${
                                  value ===
                                  option
                                    ? "border-cyan-700 bg-cyan-50 text-cyan-950"
                                    : "border-slate-200"
                                }`}
                              >
                                {option}
                              </button>
                            )
                          )}
                        </div>
                      )}

                      {item.type ===
                        "multiple_choice" && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {options.map(
                            (option) => {
                              const selected =
                                Array.isArray(
                                  value
                                ) &&
                                value.includes(
                                  option
                                );

                              return (
                                <button
                                  key={
                                    option
                                  }
                                  type="button"
                                  onClick={() => {
                                    const current =
                                      Array.isArray(
                                        value
                                      )
                                        ? value
                                        : [];

                                    updateAmbulatoryResponse(
                                      item,
                                      selected
                                        ? current.filter(
                                            (
                                              entry: string
                                            ) =>
                                              entry !==
                                              option
                                          )
                                        : [
                                            ...current,
                                            option,
                                          ]
                                    );
                                  }}
                                  className={`rounded-xl border px-4 py-3 text-left text-sm ${
                                    selected
                                      ? "border-cyan-700 bg-cyan-50"
                                      : "border-slate-200"
                                  }`}
                                >
                                  {selected
                                    ? "✓ "
                                    : ""}
                                  {option}
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}

                      {(item.type ===
                        "number" ||
                        item.type ===
                          "time_duration") && (
                        <div className="mt-4 flex items-center gap-3">
                          <input
                            type="number"
                            min={
                              item.config.min
                            }
                            max={
                              item.config.max
                            }
                            step={
                              item.config.step ||
                              1
                            }
                            value={value ?? ""}
                            onChange={(
                              event
                            ) =>
                              updateAmbulatoryResponse(
                                item,
                                event.target
                                  .value === ""
                                  ? ""
                                  : Number(
                                      event
                                        .target
                                        .value
                                    )
                              )
                            }
                            className="w-48 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          />

                          {item.type ===
                            "time_duration" && (
                            <span className="text-sm text-slate-500">
                              {item.config
                                .unit ||
                                "minutes"}
                            </span>
                          )}
                        </div>
                      )}

                      {item.type ===
                        "short_text" && (
                        <input
                          value={value ?? ""}
                          onChange={(
                            event
                          ) =>
                            updateAmbulatoryResponse(
                              item,
                              event.target
                                .value
                            )
                          }
                          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                        />
                      )}

                      {item.type ===
                        "long_text" && (
                        <textarea
                          value={value ?? ""}
                          onChange={(
                            event
                          ) =>
                            updateAmbulatoryResponse(
                              item,
                              event.target
                                .value
                            )
                          }
                          className="mt-4 min-h-28 w-full rounded-xl border border-slate-200 p-4 text-sm"
                        />
                      )}

                      {item.type ===
                        "activity" && (
                        <div className="mt-4 rounded-xl bg-slate-50 p-4">
                          <p className="text-sm leading-6 text-slate-600">
                            {
                              item.config
                                .instructions
                            }
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            Suggested duration:{" "}
                            {item.config
                              .durationMinutes ||
                              2}{" "}
                            minutes
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              updateAmbulatoryResponse(
                                item,
                                !value
                              )
                            }
                            className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                              value
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-950 text-white"
                            }`}
                          >
                            {value
                              ? "✓ Completed"
                              : "Mark activity complete"}
                          </button>
                        </div>
                      )}

                      {item.type ===
                        "questionnaire" &&
                        (() => {
                          const qid =
                            String(
                              item.config
                                .questionnaire_id ||
                                ""
                            );

                          const detail =
                            qid
                              ? ambulatoryQuestionnaires[
                                  qid
                                ]
                              : null;

                          const stored =
                            value &&
                            typeof value ===
                              "object"
                              ? value
                              : {
                                  questionnaire_id:
                                    qid,
                                  answers: {},
                                  completed:
                                    false,
                                };

                          if (!qid) {
                            return (
                              <p className="mt-4 text-sm text-red-700">
                                Questionnaire is not configured.
                              </p>
                            );
                          }

                          if (!detail) {
                            return (
                              <button
                                type="button"
                                onClick={() =>
                                  void loadAmbulatoryQuestionnaire(
                                    qid
                                  )
                                }
                                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                              >
                                Open questionnaire
                              </button>
                            );
                          }

                          const qItems =
                            detail.items ||
                            [];

                          return (
                            <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/40 p-4">
                              <p className="font-semibold text-cyan-950">
                                {detail
                                  .questionnaire
                                  ?.name ||
                                  item.config
                                    .questionnaire_name}
                              </p>

                              {detail.version
                                ?.participant_instructions && (
                                <p className="mt-2 text-xs leading-5 text-slate-600">
                                  {
                                    detail
                                      .version
                                      .participant_instructions
                                  }
                                </p>
                              )}

                              <div className="mt-4 space-y-4">
                                {qItems.map(
                                  (
                                    qItem
                                  ) => {
                                    const normalized: PublicItem =
                                      {
                                        id:
                                          qItem.id,
                                        block_id:
                                          null,
                                        item_key:
                                          qItem.item_key,
                                        position:
                                          qItem.position,
                                        prompt:
                                          qItem.prompt,
                                        help_text:
                                          qItem.help_text,
                                        subscale:
                                          qItem.subscale,
                                        reverse_scored:
                                          false,
                                        response_type:
                                          qItem.response_type,
                                        response_options:
                                          qItem.response_options ||
                                          [],
                                        required:
                                          qItem.required,
                                        response_config:
                                          qItem.response_config ||
                                          {},
                                        validation_config:
                                          {},
                                        scoring_config:
                                          {},
                                        display_logic:
                                          {},
                                        randomization_config:
                                          {},
                                        media_config:
                                          {},
                                        is_content_only:
                                          false,
                                      };

                                    return (
                                      <div
                                        key={
                                          qItem.id
                                        }
                                        className="rounded-xl border border-cyan-100 bg-white p-4"
                                      >
                                        <p className="text-sm font-medium">
                                          {
                                            qItem.prompt
                                          }
                                        </p>

                                        <div className="mt-3">
                                          <QuestionInput
                                            item={
                                              normalized
                                            }
                                            answer={
                                              stored
                                                .answers?.[
                                                qItem
                                                  .id
                                              ]
                                            }
                                            onChange={(
                                              next
                                            ) => {
                                              const answers =
                                                {
                                                  ...(stored.answers ||
                                                    {}),
                                                  [qItem.id]:
                                                    next,
                                                };

                                              const requiredItems =
                                                qItems.filter(
                                                  (
                                                    candidate
                                                  ) =>
                                                    candidate.required
                                                );

                                              const complete =
                                                requiredItems.every(
                                                  (
                                                    candidate
                                                  ) => {
                                                    const candidateValue =
                                                      answers[
                                                        candidate
                                                          .id
                                                      ];

                                                    return (
                                                      candidateValue !==
                                                        undefined &&
                                                      candidateValue !==
                                                        null &&
                                                      candidateValue !==
                                                        "" &&
                                                      (!Array.isArray(
                                                        candidateValue
                                                      ) ||
                                                        candidateValue.length >
                                                          0)
                                                    );
                                                  }
                                                );

                                              updateAmbulatoryResponse(
                                                item,
                                                {
                                                  questionnaire_id:
                                                    qid,
                                                  questionnaire_name:
                                                    detail
                                                      .questionnaire
                                                      ?.name ||
                                                    item
                                                      .config
                                                      .questionnaire_name,
                                                  answers,
                                                  completed:
                                                    complete,
                                                }
                                              );
                                            }}
                                            sessionToken={sessionToken}
                                            studyToken={token}
                                          />
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>

                              {stored.completed && (
                                <p className="mt-4 text-sm font-semibold text-emerald-700">
                                  ✓ Questionnaire complete
                                </p>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={savingAmbulatory}
                onClick={() => {
                  setActiveAmbulatoryCheckin(
                    null
                  );
                  setAmbulatoryResponses(
                    {}
                  );
                  setPageError("");
                  setPhase(
                    "study_dashboard"
                  );
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
              >
                Back to dashboard
              </button>

              <button
                type="button"
                disabled={savingAmbulatory}
                onClick={() =>
                  void submitAmbulatoryCheckin()
                }
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingAmbulatory
                  ? "Saving..."
                  : "Submit check-in"}
              </button>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  if (phase === "followup_contact") {
    return (
      <Shell>
        <div className="space-y-5">
          {pageError && (
            <ErrorBox text={pageError} />
          )}

          <Card
            title="Follow-up contact"
            description="This study includes one or more later follow-up phases."
          >
            <div className="space-y-5">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-medium text-cyan-950">
                  Your current study responses are already saved.
                </p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                  To take part in the follow-up phase, enter an email address
                  and consent to follow-up contact. This is the address
                  PsyLattice will use to send your secure follow-up study
                  invitation and later reminders. The email address is stored
                  separately from the ordinary research-response data.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Follow-up email address
                </span>
                <input
                  type="email"
                  value={
                    followupContactEmail
                  }
                  onChange={(event) =>
                    setFollowupContactEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={
                    followupContactConsent
                  }
                  onChange={(event) =>
                    setFollowupContactConsent(
                      event.target.checked
                    )
                  }
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    I consent to being contacted by email for follow-up phases
                    of this study.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This consent is specifically for later follow-up study
                    invitations and reminders. It is separate from ambulatory
                    check-in reminder preferences.
                  </p>
                </div>
              </label>

              {followupContactStatus && (
                <p className="text-sm text-slate-600">
                  {followupContactStatus}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <p className="max-w-xl text-xs leading-5 text-slate-400">
                  PsyLattice will send the follow-up invitation to the email
                  address entered above.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void saveFollowupContactChoice()
                  }
                  disabled={
                    savingFollowupContact ||
                    !followupContactConsent ||
                    !followupContactEmail.trim()
                  }
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingFollowupContact
                    ? "Saving..."
                    : "Save email & continue"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  if (phase === "measures") {
    if (!currentMeasure) {
      return (
        <Shell>
          <Card
            title={
              ambulatoryConfig?.enabled
                ? "Baseline questionnaires complete"
                : "Questionnaires complete"
            }
          >
            <button
              type="button"
              onClick={() =>
                ambulatoryConfig?.enabled
                  ? void enterAmbulatoryStudy()
                  : void completeParticipation()
              }
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              {ambulatoryConfig?.enabled
                ? "Open study dashboard"
                : "Complete study"}
            </button>
          </Card>
        </Shell>
      );
    }

    const orderedItems = deterministicMeasureItems(
      currentMeasure,
      sessionToken
    );
    const authoredPages = measureItemPages(
      currentMeasure,
      orderedItems
    );
    const visiblePages = authoredPages
      .map((pageItems) =>
        pageItems.filter((item) =>
          itemIsVisible(
            item,
            measureAnswers,
            currentMeasure.items
          )
        )
      )
      .filter((pageItems) => pageItems.length > 0);
    const renderedPages =
      visiblePages.length > 0
        ? visiblePages
        : ([[]] as PublicItem[][]);
    const activePageIndex = Math.min(
      currentMeasurePage,
      renderedPages.length - 1
    );
    const visibleItems = renderedPages[activePageIndex] || [];
    const hasMultiplePages = renderedPages.length > 1;
    const isFinalQuestionnairePage =
      activePageIndex === renderedPages.length - 1;
    const isStandaloneMediaPage =
      visibleItems.length === 1 &&
      isStandaloneMediaContent(visibleItems[0]);

    return (
      <Shell>
        <div className="space-y-5">
          {payload.link.is_test_link && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-800">
              TEST participation · Participant ID {publicId}
            </div>
          )}

          {pageError && <ErrorBox text={pageError} />}

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
              <span>
                Questionnaire {currentMeasureIndex + 1} of{" "}
                {baselineMeasures.length}
              </span>
              <span>
                {hasMultiplePages
                  ? `Page ${activePageIndex + 1} of ${renderedPages.length} · `
                  : ""}
                {completedMeasureIds.length} completed
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-cyan-700"
                style={{
                  width: `${
                    baselineMeasures.length > 0
                      ? Math.round(
                          (completedMeasureIds.length /
                            baselineMeasures.length) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <Card
            title={`${currentMeasure.questionnaire.name}${
              currentMeasure.questionnaire.acronym
                ? ` (${currentMeasure.questionnaire.acronym})`
                : ""
            }`}
            description={
              currentMeasure.version.participant_instructions ||
              currentMeasure.questionnaire.description
            }
          >
            {currentMeasure.version.response_scale_description && (
              <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Response guidance
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {currentMeasure.version.response_scale_description}
                </p>
              </div>
            )}

            {hasMultiplePages && (
              <div className="mb-6 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                <div className="flex items-center justify-between gap-4 text-xs font-medium text-cyan-900">
                  <span>Questionnaire page {activePageIndex + 1}</span>
                  <span>{renderedPages.length} pages</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cyan-100">
                  <div
                    className="h-full rounded-full bg-cyan-700"
                    style={{
                      width: `${Math.round(
                        ((activePageIndex + 1) / renderedPages.length) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-8">
              {visibleItems.map((item, index) => {
                const block = currentMeasure.blocks.find(
                  (candidate) => candidate.id === item.block_id
                );
                const previousVisibleItem = visibleItems[index - 1];
                const previousBlockId = previousVisibleItem?.block_id;
                const showBlockHeader =
                  block && block.id !== previousBlockId;

                return (
                  <div key={item.id}>
                    {showBlockHeader && (
                      <div className="mb-5 rounded-2xl bg-slate-50 p-4">
                        {block.title && (
                          <h2 className="font-semibold">{block.title}</h2>
                        )}
                        {block.instructions && (
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                            {block.instructions}
                          </p>
                        )}
                      </div>
                    )}

                    <div
                      className={
                        item.is_content_only
                          ? ""
                          : "rounded-2xl border border-slate-200 p-5"
                      }
                    >
                      {!item.is_content_only && (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <p className="font-medium leading-6">
                              {pipeText(
                                item.prompt,
                                measureAnswers,
                                currentMeasure.items
                              )}
                            </p>
                            {item.required && (
                              <span className="shrink-0 text-[11px] font-medium text-cyan-800">
                                Required
                              </span>
                            )}
                          </div>

                          {item.help_text && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {pipeText(
                                item.help_text,
                                measureAnswers,
                                currentMeasure.items
                              )}
                            </p>
                          )}
                        </>
                      )}

                      <div className={item.is_content_only ? "" : "mt-4"}>
                        <QuestionInput
                          item={{
                            ...item,
                            prompt: pipeText(
                              item.prompt,
                              measureAnswers,
                              currentMeasure.items
                            ),
                          }}
                          answer={measureAnswers[item.id]}
                          onChange={(value) =>
                            setMeasureAnswers((previous) =>
                              cleanHiddenMeasureAnswers(currentMeasure, {
                                ...previous,
                                [item.id]: value,
                              })
                            )
                          }
                          sessionToken={sessionToken}
                          studyToken={token}
                          studyMeasureId={currentMeasure.study_measure_id}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <p className="max-w-xl text-xs leading-5 text-slate-400">
                {hasMultiplePages
                  ? "Your answers stay on this device while you move between questionnaire pages and are submitted after the final page."
                  : "Your responses are submitted when you continue to the next questionnaire."}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {activePageIndex > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      returnToPreviousMeasurePage(activePageIndex)
                    }
                    disabled={savingMeasure}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
                  >
                    Previous page
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    continueCurrentMeasurePage(
                      visibleItems,
                      activePageIndex,
                      renderedPages.length
                    )
                  }
                  disabled={savingMeasure}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingMeasure
                    ? "Saving..."
                    : !isFinalQuestionnairePage
                      ? isStandaloneMediaPage
                        ? "Continue"
                        : "Next page"
                      : currentMeasureIndex === baselineMeasures.length - 1
                        ? "Submit questionnaires"
                        : "Save & continue"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card
        title="Thank you"
        description={
          payload.link.is_test_link
            ? "Your test participation has been recorded separately from live research data."
            : "Your study responses have been submitted."
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-emerald-50 p-5">
            <p className="font-medium text-emerald-900">
              {ambulatoryConfig?.enabled
                ? "Longitudinal study complete"
                : "Baseline session complete"}
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-800">
              Your pseudonymous participant ID is{" "}
              <span className="font-semibold">{publicId}</span>.
            </p>
          </div>

          {followupConfigured && (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
              <p className="font-medium text-cyan-950">
                This study includes later follow-up phases
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                If you consented to follow-up email contact, PsyLattice can
                send you a new secure link when the research team opens a
                later follow-up wave. Each wave may contain different
                questionnaires.
              </p>
            </div>
          )}

          <p className="text-sm leading-6 text-slate-500">
            You may now close this page. Keep any study contact information
            supplied by the research team if you have questions about your
            participation or withdrawal rights.
          </p>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <p className="font-medium text-cyan-950">
              Interested in PsyLattice beyond this study?
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-900/75">
              Explore PsyLattice — an AI-assisted, multi-dimensional platform
              for psychological assessment, reflection, monitoring, support,
              and research tools.
            </p>

            <Link
              href="/"
              className="mt-4 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Explore PsyLattice
            </Link>
          </div>
        </div>
      </Card>
    </Shell>
  );
}
