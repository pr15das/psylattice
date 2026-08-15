"use client";

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


type AnswerValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | Record<string, string | number | boolean | string[]>
  | null;

type PublicFollowupPayload = {
  ok: boolean;
  error?: string;
  study?: {
    id: string;
    title: string;
    participant_description: string | null;
  };
  wave?: {
    id: string;
    name: string;
    description: string;
    position: number;
    completion_window_days: number;
  };
  invitation?: {
    id: string;
    status: string;
    scheduled_for: string;
    expires_at: string | null;
  };
  participant?: {
    public_id: string;
  };
  measures?: PublicMeasure[];
};

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


export default function FollowupParticipantPage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token || "");

  const [payload, setPayload] =
    useState<PublicFollowupPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [sessionToken, setSessionToken] =
    useState("");
  const [phase, setPhase] = useState<
    "landing" | "questionnaire" | "complete"
  >("landing");
  const [currentMeasureIndex, setCurrentMeasureIndex] =
    useState(0);
  const [completedMeasureIds, setCompletedMeasureIds] =
    useState<string[]>([]);
  const [measureAnswers, setMeasureAnswers] = useState<
    Record<string, AnswerValue>
  >({});
  const [starting, setStarting] = useState(false);
  const [savingMeasure, setSavingMeasure] =
    useState(false);
  const [remainingWaves, setRemainingWaves] =
    useState<number | null>(null);

  const measures = payload?.measures || [];
  const currentMeasure =
    measures[currentMeasureIndex] || null;

  const storageKey = `psylattice-followup-session:${token}`;

  function firstIncompleteIndex(
    completed: string[]
  ) {
    const index = measures.findIndex(
      (measure) =>
        !completed.includes(
          measure.study_measure_id
        )
    );

    return index >= 0 ? index : 0;
  }

  async function loadFollowup() {
    setLoading(true);
    setPageError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_public_followup",
      {
        p_token: token,
      }
    );

    if (error || !data?.ok) {
      setPageError(
        error?.message ||
          data?.error ||
          "This follow-up link is unavailable."
      );
      setPayload(null);
      setLoading(false);
      return;
    }

    const nextPayload =
      data as PublicFollowupPayload;

    setPayload(nextPayload);

    if (
      nextPayload.invitation?.status ===
      "completed"
    ) {
      setPhase("complete");
      setLoading(false);
      return;
    }

    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(
            storageKey
          )
        : null;

    if (stored) {
      const { data: resumeData } =
        await supabase.rpc(
          "psylattice_resume_followup",
          {
            p_token: token,
            p_session_token: stored,
          }
        );

      if (resumeData?.ok) {
        setSessionToken(stored);

        const completed = Array.isArray(
          resumeData.completed_measure_ids
        )
          ? resumeData.completed_measure_ids.map(
              String
            )
          : [];

        setCompletedMeasureIds(completed);

        if (
          resumeData.status === "completed"
        ) {
          setPhase("complete");
        } else {
          setCurrentMeasureIndex(
            firstIncompleteIndex(completed)
          );
          setPhase("questionnaire");
        }
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!token) return;
    void loadFollowup();
  }, [token]);

  async function startFollowup() {
    if (starting) return;

    setStarting(true);
    setPageError("");

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_start_followup",
      {
        p_token: token,
      }
    );

    if (error || !data?.ok) {
      setPageError(
        error?.message ||
          data?.error ||
          "This follow-up could not be started."
      );
      setStarting(false);
      return;
    }

    if (data.already_completed) {
      setPhase("complete");
      setStarting(false);
      return;
    }

    const nextToken = String(
      data.session_token || ""
    );

    if (!nextToken) {
      setPageError(
        "PsyLattice could not create the follow-up session."
      );
      setStarting(false);
      return;
    }

    setSessionToken(nextToken);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        storageKey,
        nextToken
      );
    }

    setCompletedMeasureIds([]);
    setCurrentMeasureIndex(0);
    setMeasureAnswers({});
    setPhase("questionnaire");
    setStarting(false);
  }

  async function completeFollowup() {
    if (!sessionToken) return;

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_complete_followup",
      {
        p_token: token,
        p_session_token: sessionToken,
      }
    );

    if (error || !data?.ok) {
      setPageError(
        error?.message ||
          data?.error ||
          "The follow-up could not be submitted."
      );
      return;
    }

    setRemainingWaves(
      Number(
        data.remaining_followup_waves || 0
      )
    );

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        storageKey
      );
    }

    setPhase("complete");
  }

  async function saveCurrentMeasure() {
    if (
      !currentMeasure ||
      !sessionToken ||
      savingMeasure
    ) {
      return;
    }

    for (const item of currentMeasure.items) {
      if (
        item.is_content_only ||
        !item.required ||
        !itemIsVisible(
          item,
          measureAnswers,
          currentMeasure.items
        )
      ) {
        continue;
      }

      if (
        !responseHasValue(
          measureAnswers[item.id]
        )
      ) {
        setPageError(
          `Please complete: ${item.prompt}`
        );
        return;
      }
    }

    setSavingMeasure(true);
    setPageError("");

    const responses = makeResponseRows(
      currentMeasure,
      measureAnswers
    );

    const scores = calculateRawScores(
      currentMeasure,
      measureAnswers
    );

    const supabase = createClient();

    const { data, error } = await supabase.rpc(
      "psylattice_save_followup_measure",
      {
        p_token: token,
        p_session_token: sessionToken,
        p_study_measure_id:
          currentMeasure.study_measure_id,
        p_answers: responses,
        p_scores: scores,
      }
    );

    if (error || !data?.ok) {
      setPageError(
        error?.message ||
          data?.error ||
          "This questionnaire could not be saved."
      );
      setSavingMeasure(false);
      return;
    }

    const nextCompleted = Array.from(
      new Set([
        ...completedMeasureIds,
        currentMeasure.study_measure_id,
      ])
    );

    setCompletedMeasureIds(
      nextCompleted
    );
    setMeasureAnswers({});

    const nextIndex = measures.findIndex(
      (measure, index) =>
        index > currentMeasureIndex &&
        !nextCompleted.includes(
          measure.study_measure_id
        )
    );

    if (nextIndex >= 0) {
      setCurrentMeasureIndex(nextIndex);
      setSavingMeasure(false);
      return;
    }

    await completeFollowup();
    setSavingMeasure(false);
  }

  if (loading) {
    return (
      <Shell>
        <Card title="Loading follow-up">
          <p className="text-sm text-slate-500">
            Preparing your follow-up assessment...
          </p>
        </Card>
      </Shell>
    );
  }

  if (!payload?.ok || !payload.study || !payload.wave) {
    return (
      <Shell>
        <ErrorBox
          text={
            pageError ||
            "This follow-up link is unavailable."
          }
        />
      </Shell>
    );
  }

  if (phase === "landing") {
    return (
      <Shell>
        <div className="space-y-5">
          {pageError && (
            <ErrorBox text={pageError} />
          )}

          <Card
            title={payload.wave.name}
            description={payload.study.title}
          >
            <div className="space-y-5">
              {payload.wave.description && (
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {payload.wave.description}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Participant
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {payload.participant?.public_id ||
                      "PsyLattice participant"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Questionnaires
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {measures.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    Available until
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {payload.invitation?.expires_at
                      ? new Date(
                          payload.invitation.expires_at
                        ).toLocaleString()
                      : "Study-defined"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-medium text-cyan-950">
                  This is a follow-up phase of a study you previously completed.
                </p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                  Your responses will be linked to the same pseudonymous
                  participant record so the research team can analyse change
                  across study waves.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void startFollowup()
                }
                disabled={starting}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {starting
                  ? "Starting..."
                  : "Start follow-up"}
              </button>
            </div>
          </Card>
        </div>
      </Shell>
    );
  }

  if (
    phase === "questionnaire" &&
    currentMeasure
  ) {
    return (
      <Shell>
        <div className="space-y-5">
          {pageError && (
            <ErrorBox text={pageError} />
          )}

          <Card
            title={
              currentMeasure.questionnaire
                .name
            }
            description={`${payload.wave.name} · Questionnaire ${
              currentMeasureIndex + 1
            } of ${measures.length}`}
          >
            <div className="space-y-6">
              {currentMeasure.version
                .participant_instructions && (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  {
                    currentMeasure.version
                      .participant_instructions
                  }
                </div>
              )}

              {currentMeasure.blocks
                .sort(
                  (a, b) =>
                    a.position -
                    b.position
                )
                .map((block) => {
                  const blockItems =
                    currentMeasure.items
                      .filter(
                        (item) =>
                          item.block_id ===
                          block.id
                      )
                      .sort(
                        (a, b) =>
                          a.position -
                          b.position
                      );

                  if (
                    blockItems.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <div
                      key={block.id}
                      className="space-y-5"
                    >
                      {(block.title ||
                        block.instructions) && (
                        <div>
                          {block.title && (
                            <h2 className="text-lg font-semibold">
                              {
                                block.title
                              }
                            </h2>
                          )}
                          {block.instructions && (
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                              {
                                block.instructions
                              }
                            </p>
                          )}
                        </div>
                      )}

                      {blockItems.map(
                        (item) => {
                          if (
                            !itemIsVisible(
                              item,
                              measureAnswers,
                              currentMeasure.items
                            )
                          ) {
                            return null;
                          }

                          const prompt =
                            pipeText(
                              item.prompt,
                              measureAnswers,
                              currentMeasure.items
                            );

                          return (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-slate-200 p-5"
                            >
                              {!item.is_content_only && (
                                <div className="mb-4">
                                  <p className="font-medium leading-6">
                                    {prompt}
                                    {item.required && (
                                      <span className="ml-1 text-red-500">
                                        *
                                      </span>
                                    )}
                                  </p>
                                  {item.help_text && (
                                    <p className="mt-1 text-xs leading-5 text-slate-400">
                                      {
                                        item.help_text
                                      }
                                    </p>
                                  )}
                                </div>
                              )}

                              <QuestionInput
                                item={{
                                  ...item,
                                  prompt,
                                }}
                                answer={
                                  measureAnswers[
                                    item.id
                                  ]
                                }
                                onChange={(
                                  value
                                ) =>
                                  setMeasureAnswers(
                                    (
                                      previous
                                    ) => ({
                                      ...previous,
                                      [item.id]:
                                        value,
                                    })
                                  )
                                }
                                sessionToken={
                                  sessionToken
                                }
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  );
                })}

              {currentMeasure.items
                .filter(
                  (item) =>
                    !item.block_id
                )
                .sort(
                  (a, b) =>
                    a.position -
                    b.position
                )
                .map((item) => {
                  if (
                    !itemIsVisible(
                      item,
                      measureAnswers,
                      currentMeasure.items
                    )
                  ) {
                    return null;
                  }

                  const prompt =
                    pipeText(
                      item.prompt,
                      measureAnswers,
                      currentMeasure.items
                    );

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      {!item.is_content_only && (
                        <div className="mb-4">
                          <p className="font-medium leading-6">
                            {prompt}
                            {item.required && (
                              <span className="ml-1 text-red-500">
                                *
                              </span>
                            )}
                          </p>
                          {item.help_text && (
                            <p className="mt-1 text-xs leading-5 text-slate-400">
                              {
                                item.help_text
                              }
                            </p>
                          )}
                        </div>
                      )}

                      <QuestionInput
                        item={{
                          ...item,
                          prompt,
                        }}
                        answer={
                          measureAnswers[
                            item.id
                          ]
                        }
                        onChange={(value) =>
                          setMeasureAnswers(
                            (previous) => ({
                              ...previous,
                              [item.id]:
                                value,
                            })
                          )
                        }
                        sessionToken={
                          sessionToken
                        }
                      />
                    </div>
                  );
                })}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <p className="text-xs leading-5 text-slate-400">
                  Your answers are saved when
                  you continue.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void saveCurrentMeasure()
                  }
                  disabled={savingMeasure}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingMeasure
                    ? "Saving..."
                    : currentMeasureIndex ===
                        measures.length - 1
                      ? "Submit follow-up"
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
        title="Follow-up complete"
        description="Your responses have been submitted."
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-emerald-50 p-5">
            <p className="font-medium text-emerald-900">
              {payload.wave.name} completed
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-800">
              Your responses remain linked to
              participant{" "}
              <span className="font-semibold">
                {payload.participant
                  ?.public_id || ""}
              </span>
              .
            </p>
          </div>

          {remainingWaves !== null &&
            remainingWaves > 0 && (
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
                <p className="font-medium text-cyan-950">
                  More follow-up phases may be
                  scheduled
                </p>
                <p className="mt-2 text-sm leading-6 text-cyan-900/75">
                  The research team may contact
                  you again according to the
                  consent and follow-up schedule
                  for this study.
                </p>
              </div>
            )}

          <p className="text-sm leading-6 text-slate-500">
            You may now close this page.
          </p>
        </div>
      </Card>
    </Shell>
  );
}
