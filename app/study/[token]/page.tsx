"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

type JsonObject = Record<string, unknown>;

type ResponseOption = {
  label: string;
  value: number | string;
  weight?: number;
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

function compareLogicValue(
  actual: AnswerValue | undefined,
  operator: string,
  expected: string
) {
  const actualText = displayValue(actual);
  const actualNumber = Number(actualText);
  const expectedNumber = Number(expected);

  if (operator === "answered") {
    return actual !== undefined && actual !== null && actualText !== "";
  }

  if (operator === "not_answered") {
    return actual === undefined || actual === null || actualText === "";
  }

  if (operator === "equals") {
    return actualText.toLowerCase() === expected.toLowerCase();
  }

  if (operator === "not_equals") {
    return actualText.toLowerCase() !== expected.toLowerCase();
  }

  if (operator === "greater_than") {
    return Number.isFinite(actualNumber) &&
      Number.isFinite(expectedNumber) &&
      actualNumber > expectedNumber;
  }

  if (operator === "less_than") {
    return Number.isFinite(actualNumber) &&
      Number.isFinite(expectedNumber) &&
      actualNumber < expectedNumber;
  }

  if (operator === "contains") {
    if (Array.isArray(actual)) {
      return actual.map(String).some((entry) =>
        entry.toLowerCase().includes(expected.toLowerCase())
      );
    }

    return actualText.toLowerCase().includes(expected.toLowerCase());
  }

  if (operator === "not_contains") {
    if (Array.isArray(actual)) {
      return !actual.map(String).some((entry) =>
        entry.toLowerCase().includes(expected.toLowerCase())
      );
    }

    return !actualText.toLowerCase().includes(expected.toLowerCase());
  }

  return true;
}

function itemIsVisible(
  item: PublicItem,
  answers: Record<string, AnswerValue>,
  items: PublicItem[]
) {
  const rules = item.display_logic?.rules || [];

  if (rules.length === 0) return true;

  const results = rules.map((rule) => {
    const sourceItem = items.find(
      (candidate) => candidate.item_key === rule.source_key
    );

    if (!sourceItem) return false;

    return compareLogicValue(
      answers[sourceItem.id],
      rule.operator || "equals",
      rule.value || ""
    );
  });

  return item.display_logic?.mode === "any"
    ? results.some(Boolean)
    : results.every(Boolean);
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

  let seed = 0;
  const seedText = `${sessionToken}:${item.id}`;

  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }

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

function calculateRawScores(
  measure: PublicMeasure,
  answers: Record<string, AnswerValue>
) {
  const scores: Record<string, number> = {};

  for (const item of measure.items) {
    if (item.is_content_only || !itemIsVisible(item, answers, measure.items)) {
      continue;
    }

    const score = rawScoreForItem(item, answers[item.id]);

    if (score === null) continue;

    const key = item.subscale?.trim() || "Total";
    scores[key] = (scores[key] || 0) + score;
  }

  const multiplier = Number(measure.version.score_multiplier || 1);

  for (const key of Object.keys(scores)) {
    scores[key] = Number((scores[key] * multiplier).toFixed(4));
  }

  return scores;
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

function QuestionInput({
  item,
  answer,
  onChange,
  sessionToken,
}: {
  item: PublicItem;
  answer: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  sessionToken: string;
}) {
  const type = item.response_type;
  const options = deterministicOptions(item, sessionToken);
  const config = item.response_config || {};

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt=""
            className="max-h-[520px] rounded-2xl border border-slate-200 object-contain"
          />
        </div>
      );
    }

    if (type === "audio_content" && mediaUrl) {
      return (
        <div>
          <p className="mb-4 text-sm leading-6 text-slate-600">{item.prompt}</p>
          <audio controls className="w-full" src={mediaUrl} />
        </div>
      );
    }

    if (type === "video_content" && mediaUrl) {
      return (
        <div>
          <p className="mb-4 text-sm leading-6 text-slate-600">{item.prompt}</p>
          <video
            controls
            className="w-full rounded-2xl border border-slate-200"
            src={mediaUrl}
          />
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
              {option.label}
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
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-950">
          Participant file storage is not enabled yet.
        </p>
        <p className="mt-2 text-xs leading-5 text-amber-800">
          This item type is defined by the Universal Builder, but secure
          participant file upload requires the dedicated Study Uploads storage
          stage. Do not deploy a live study with this item marked required yet.
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
  const [savingDemographics, setSavingDemographics] = useState(false);

  const [completedMeasureIds, setCompletedMeasureIds] = useState<string[]>([]);
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(0);
  const [measureAnswers, setMeasureAnswers] = useState<
    Record<string, AnswerValue>
  >({});
  const [savingMeasure, setSavingMeasure] = useState(false);

  const [phase, setPhase] = useState<
    "landing" | "consent" | "demographics" | "measures" | "complete"
  >("landing");

  const [followupConfigured, setFollowupConfigured] = useState(false);

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
          setSessionToken(storedSession);
          setPublicId(String(resumeData.public_id || ""));
          setCompletedMeasureIds(
            Array.isArray(resumeData.completed_measure_ids)
              ? resumeData.completed_measure_ids.map(String)
              : []
          );

          if (resumeData.session_status === "completed") {
            setPhase("complete");
            setLoading(false);
            return;
          }

          const consentRequired =
            studyPayload.consent?.consent_method === "psylattice";

          const demographicsRequired =
            Boolean(studyPayload.study?.components?.demographics) &&
            Array.isArray(studyPayload.demographics) &&
            studyPayload.demographics.length > 0;

          if (consentRequired && !resumeData.consent_saved) {
            setPhase("consent");
          } else if (
            demographicsRequired &&
            !resumeData.demographics_saved
          ) {
            setPhase("demographics");
          } else {
            setPhase("measures");
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
      setMeasureAnswers({});
    }
  }, [phase, completedMeasureIds.length]);

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

    const { data, error } = await supabase.rpc(
      "psylattice_save_consent",
      {
        p_session_token: sessionToken,
        p_responses: consentAnswers,
      }
    );

    if (error || !data?.ok) {
      console.error("Could not save consent:", error);
      setPageError(
        error?.message || "Your consent responses could not be saved."
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

    setPhase("measures");
    setSavingDemographics(false);
  }

  function validateMeasure(measure: PublicMeasure) {
    for (const item of measure.items) {
      if (
        item.is_content_only ||
        !itemIsVisible(item, measureAnswers, measure.items)
      ) {
        continue;
      }

      if (item.required && !responseHasValue(measureAnswers[item.id])) {
        return "Please answer every required question before continuing.";
      }

      if (["multiple_choice", "checklist"].includes(item.response_type)) {
        const selected = Array.isArray(measureAnswers[item.id])
          ? (measureAnswers[item.id] as Array<string | number>)
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
        const value = measureAnswers[item.id];
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

  async function saveCurrentMeasure() {
    if (!currentMeasure || !sessionToken || savingMeasure) return;

    const validation = validateMeasure(currentMeasure);

    if (validation) {
      setPageError(validation);
      return;
    }

    setSavingMeasure(true);
    setPageError("");

    const responses = makeResponseRows(currentMeasure, measureAnswers);
    const scores = calculateRawScores(currentMeasure, measureAnswers);

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
      setSavingMeasure(false);
      return;
    }

    await completeParticipation();
    setSavingMeasure(false);
  }

  async function completeParticipation() {
    if (!sessionToken) return;

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_complete_participation",
      { p_session_token: sessionToken }
    );

    if (error || !data?.ok) {
      console.error("Could not complete participation:", error);
      setPageError(
        error?.message || "Your study session could not be completed."
      );
      return;
    }

    setFollowupConfigured(Boolean(data.followup_configured));
    setPhase("complete");
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
                and should not be treated as study observations.
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
                            onChange={(event) =>
                              setConsentAnswers((previous) => ({
                                ...previous,
                                [item.id]: event.target.checked,
                              }))
                            }
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
                              onClick={() =>
                                setConsentAnswers((previous) => ({
                                  ...previous,
                                  [item.id]: choice,
                                }))
                              }
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

  if (phase === "measures") {
    if (!currentMeasure) {
      return (
        <Shell>
          <Card title="Questionnaires complete">
            <button
              type="button"
              onClick={() => void completeParticipation()}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Complete study
            </button>
          </Card>
        </Shell>
      );
    }

    const visibleItems = currentMeasure.items.filter((item) =>
      itemIsVisible(item, measureAnswers, currentMeasure.items)
    );

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
                            setMeasureAnswers((previous) => ({
                              ...previous,
                              [item.id]: value,
                            }))
                          }
                          sessionToken={sessionToken}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <p className="text-xs leading-5 text-slate-400">
                Your responses are saved when you continue to the next
                questionnaire.
              </p>

              <button
                type="button"
                onClick={() => void saveCurrentMeasure()}
                disabled={savingMeasure}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingMeasure
                  ? "Saving..."
                  : currentMeasureIndex === baselineMeasures.length - 1
                    ? "Submit questionnaires"
                    : "Save & continue"}
              </button>
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
              Baseline session complete
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-800">
              Your pseudonymous participant ID is{" "}
              <span className="font-semibold">{publicId}</span>.
            </p>
          </div>

          {followupConfigured && (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
              <p className="font-medium text-cyan-950">
                This study includes a follow-up assessment
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                Your baseline responses are complete. The research team will
                provide the timing or access method for the follow-up according
                to the study protocol.
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
