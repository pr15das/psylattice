"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  CircleDot,
  Code2,
  Copy,
  FileUp,
  Image as ImageIcon,
  Keyboard,
  Layers3,
  ListChecks,
  Loader2,
  Monitor,
  MousePointerClick,
  Plus,
  Save,
  Settings2,
  Shuffle,
  Smartphone,
  Sparkles,
  Square,
  Tablet,
  Timer,
  Trash2,
  Type,
  Video,
  Volume2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import CognitiveRunner from "./CognitiveRunner";
import {
  CORSI_STANDARD_LAYOUT,
  corsiSettingsFromTaskConfig,
} from "@/lib/research/corsi";
import {
  CARD_SORT_REFERENCE_CARDS,
  cardSortSettingsFromTaskConfig,
} from "@/lib/research/cardSorting";

type CognitiveTask = {
  id: string;
  title: string;
  description: string;
  domain: string;
  source_template_id: string | null;
  template_key: string | null;
};

type CognitiveVersion = {
  id: string;
  task_id: string;
  version_number: number;
  version_label: string;
  status: "draft" | "published" | "locked" | "archived";
  participant_instructions: string;
  task_config: Record<string, unknown>;
  randomization_config: Record<string, unknown>;
  scoring_config: Record<string, unknown>;
  timing_config: Record<string, unknown>;
  output_config: Record<string, unknown>;
  device_config: Record<string, unknown>;
};

type ComponentType =
  | "fixation"
  | "text"
  | "image"
  | "audio"
  | "video"
  | "shape"
  | "response"
  | "iti"
  | "html";

type BlockType = "instructions" | "practice" | "experimental" | "break" | "end" | "custom";

type BuilderComponent = {
  local_id: string;
  component_key: string;
  component_type: ComponentType;
  position: number;
  config: Record<string, unknown>;
};

type BuilderTrial = {
  local_id: string;
  position: number;
  condition_label: string;
  variables: Record<string, string>;
  weight: number;
  enabled: boolean;
};

type BuilderBlock = {
  local_id: string;
  block_key: string;
  name: string;
  block_type: BlockType;
  position: number;
  repeat_count: number;
  continue_rule: Record<string, unknown>;
  config: Record<string, unknown>;
  components: BuilderComponent[];
  trials: BuilderTrial[];
};

type EditorTab = "paradigm" | "timeline" | "trials" | "randomization" | "scoring";

type Notice = { type: "success" | "error"; text: string } | null;

const DOMAINS = [
  ["general", "General"],
  ["attention", "Attention"],
  ["inhibitory_control", "Inhibitory control"],
  ["working_memory", "Working memory"],
  ["memory", "Memory"],
  ["perception", "Perception"],
  ["decision_making", "Decision making"],
  ["social_affective", "Social / affective"],
] as const;

const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: "instructions", label: "Instructions" },
  { value: "practice", label: "Practice" },
  { value: "experimental", label: "Experimental" },
  { value: "break", label: "Break" },
  { value: "end", label: "End" },
  { value: "custom", label: "Custom" },
];

const COMPONENTS: { type: ComponentType; label: string; icon: typeof Type }[] = [
  { type: "fixation", label: "Fixation", icon: CircleDot },
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "audio", label: "Audio", icon: Volume2 },
  { type: "video", label: "Video", icon: Video },
  { type: "shape", label: "Shape", icon: Square },
  { type: "response", label: "Response", icon: Keyboard },
  { type: "iti", label: "ITI", icon: Timer },
  { type: "html", label: "HTML", icon: Code2 },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeResponseKey(value: unknown) {
  const raw = String(value ?? "");
  if (raw === " ") return "space";
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "spacebar") return "space";
  return trimmed;
}

function uniqueResponseKeys(values: unknown[]) {
  return Array.from(new Set(values.map(normalizeResponseKey).filter(Boolean)));
}

function trialResponseKeys(block: BuilderBlock, variable: string) {
  const requested = variable.trim();
  if (!requested) return [];
  const values: string[] = [];
  for (const trial of block.trials) {
    const key = Object.keys(trial.variables || {}).find((candidate) => candidate.toLowerCase() === requested.toLowerCase());
    if (!key) continue;
    const normalized = normalizeResponseKey(trial.variables[key]);
    if (normalized) values.push(normalized);
  }
  return uniqueResponseKeys(values);
}

function normalizeComponentConfigForSave(component: BuilderComponent, block: BuilderBlock) {
  const config = { ...(component.config || {}) };
  if (component.component_type !== "response") return config;

  const correctVariable = String(config.correct_variable || "").trim();
  if (correctVariable) {
    const automatic = trialResponseKeys(block, correctVariable);
    const additional = Array.isArray(config.additional_responses) ? config.additional_responses : [];
    config.allowed_responses = uniqueResponseKeys([...automatic, ...additional]);
  } else {
    const manual = Array.isArray(config.allowed_responses) ? config.allowed_responses : [];
    const fixed = Object.prototype.hasOwnProperty.call(config, "correct_value") ? String(config.correct_value ?? "") : "";
    config.allowed_responses = uniqueResponseKeys([...manual, ...(fixed.trim() ? [fixed] : [])]);
  }

  return config;
}

function defaultComponentConfig(type: ComponentType): Record<string, unknown> {
  switch (type) {
    case "fixation":
      return { symbol: "+", duration_ms: 500 };
    case "text":
      return { content: "STIMULUS", content_variable: "stimulus", font_size_px: 48, duration_ms: 1500, end_on_response: true };
    case "image":
      return { asset_url: "", asset_variable: "image", duration_ms: 1500, end_on_response: true };
    case "audio":
      return { asset_url: "", asset_variable: "audio", duration_ms: 0 };
    case "video":
      return { asset_url: "", asset_variable: "video", duration_ms: 0 };
    case "shape":
      return { shape: "circle", color: "#0f172a", size_px: 70, duration_ms: 1500, end_on_response: true };
    case "response":
      return { input: "keyboard", allowed_responses: ["space"], correct_variable: "correct", deadline_ms: 1500, rt_anchor: "stimulus", end_trial_on_response: true };
    case "iti":
      return { min_ms: 500, max_ms: 1000, distribution: "uniform" };
    case "html":
      return { html: "<p>Custom content</p>", duration_ms: 0 };
  }
}

function componentSummary(component: BuilderComponent) {
  const config = component.config || {};
  const ms = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? `${Math.round(parsed)} ms` : null;
  };

  switch (component.component_type) {
    case "fixation":
      return [String(config.symbol || "+"), ms(config.duration_ms)].filter(Boolean).join(" · ");
    case "text": {
      const variable = String(config.content_variable || "").trim();
      const content = variable ? `{{${variable}}}` : String(config.content || "Text");
      return [content, ms(config.duration_ms)].filter(Boolean).join(" · ");
    }
    case "image":
    case "audio":
    case "video": {
      const variable = String(config.asset_variable || "").trim();
      return [variable ? `{{${variable}}}` : "Fixed asset", ms(config.duration_ms)].filter(Boolean).join(" · ");
    }
    case "shape":
      return [String(config.shape || "shape"), ms(config.duration_ms)].filter(Boolean).join(" · ");
    case "response": {
      const input = String(config.input || "keyboard");
      const keys = Array.isArray(config.allowed_responses) ? config.allowed_responses.map(String) : [];
      return [input.charAt(0).toUpperCase() + input.slice(1), keys.length ? keys.join(" / ").toUpperCase() : "no keys", ms(config.deadline_ms)].filter(Boolean).join(" · ");
    }
    case "iti": {
      const min = ms(config.min_ms);
      const max = ms(config.max_ms);
      return min && max ? `${min.replace(" ms", "")}–${max}` : min || max || "Inter-trial interval";
    }
    case "html":
      return ms(config.duration_ms) || "Custom HTML";
  }
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold text-slate-600">{children}</span>;
}

function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`mt-1.5 w-full rounded-full border border-slate-300/80 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none transition focus:border-cyan-300 focus:shadow-[0_5px_18px_rgba(8,145,178,0.10)] ${props.className || ""}`}
    />
  );
}

function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`mt-1.5 w-full rounded-full border border-slate-300/80 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none transition focus:border-cyan-300 focus:shadow-[0_5px_18px_rgba(8,145,178,0.10)] ${props.className || ""}`}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-white px-3.5 py-3 text-left shadow-[0_4px_14px_rgba(15,23,42,0.045)] transition hover:border-cyan-200">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-cyan-600" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}


const STOP_SIGNAL_DEFAULTS = {
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

function isStopSignalTaskConfig(config: Record<string, unknown> | null | undefined) {
  if (!config) return false;
  return (
    String(config.runtime || "").toLowerCase() === "stop_signal" ||
    String(config.template_key || "").toLowerCase() === "stop_signal"
  );
}



function isCardSortTaskConfig(
  config: Record<string, unknown> | null | undefined
) {
  if (!config) return false;
  return (
    String(config.runtime || "").toLowerCase() === "card_sorting" ||
    String(config.template_key || "").toLowerCase() === "card_sorting"
  );
}

function CardSortMiniCard({
  card,
  selected = false,
}: {
  card: { id: number; color: string; shape: string; count: number };
  selected?: boolean;
}) {
  const glyph =
    card.shape === "triangle"
      ? "▲"
      : card.shape === "square"
        ? "■"
        : card.shape === "diamond"
          ? "◆"
          : "●";

  return (
    <div
      className={`flex aspect-[4/3] min-h-[76px] items-center justify-center rounded-[18px] border bg-white p-2 shadow-[0_8px_18px_rgba(15,23,42,0.08)] ${
        selected
          ? "border-cyan-300 ring-4 ring-cyan-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex max-w-[92%] flex-wrap items-center justify-center gap-1.5">
        {Array.from({ length: card.count }).map((_, index) => (
          <span
            key={index}
            className="text-[22px] leading-none sm:text-[26px]"
            style={{ color: card.color }}
          >
            {glyph}
          </span>
        ))}
      </div>
    </div>
  );
}

function CardSortSettingsPanel({
  taskConfig,
  onChange,
}: {
  taskConfig: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const settings = cardSortSettingsFromTaskConfig(taskConfig);
  const categoryRules = Array.from(
    { length: settings.categories_to_complete },
    (_, index) => {
      const rules = ["color", "shape", "number"] as const;
      const start = rules.indexOf(settings.starting_rule);
      return rules[(start + index) % rules.length];
    }
  );

  const sampleTarget = {
    id: 99,
    color: CARD_SORT_REFERENCE_CARDS[0].color,
    shape: CARD_SORT_REFERENCE_CARDS[2].shape,
    count: CARD_SORT_REFERENCE_CARDS[1].count,
  };

  return (
    <div className="mt-5 max-w-5xl space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_.92fr]">
        <section className="rounded-[24px] border border-cyan-200/80 bg-white p-5 shadow-[0_7px_24px_rgba(8,145,178,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">
                Dedicated stateful paradigm
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Adaptive Card Sorting
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Participants infer a hidden sorting rule from Correct / Incorrect
                feedback. After enough consecutive correct responses, PsyLattice
                changes the rule without announcing it and tracks flexible versus
                perseverative responding.
              </p>
            </div>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-900">
              WCST-style research task
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Categories
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {settings.categories_to_complete}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Shift criterion
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {settings.correct_to_shift} correct
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Max trials
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {settings.max_trials}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                Starting rule
              </p>
              <p className="mt-1 text-lg font-semibold capitalize text-slate-950">
                {settings.starting_rule}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-slate-200 bg-[#fbfdfd] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Hidden rule sequence
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {categoryRules.map((rule, index) => (
                <div key={`${rule}-${index}`} className="flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold capitalize text-slate-700 shadow-[0_3px_10px_rgba(15,23,42,0.04)]">
                    {index + 1}. {rule}
                  </span>
                  {index < categoryRules.length - 1 && (
                    <span className="text-slate-300">→</span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-4 text-slate-400">
              Participants never see this sequence. Rules cycle through Color →
              Shape → Number from the configured starting rule.
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-[#f8fbfc] p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Stimulus preview
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Original PsyLattice card set
          </h4>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">
            The target card is sorted onto one of four reference cards. Color,
            shape and number each point to a different reference card, removing
            proprietary ambiguity-scoring rules.
          </p>

          <div className="mt-4">
            <p className="mb-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Example target
            </p>
            <div className="mx-auto max-w-[150px]">
              <CardSortMiniCard card={sampleTarget} selected />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {CARD_SORT_REFERENCE_CARDS.map((card) => (
              <CardSortMiniCard key={card.id} card={card} />
            ))}
          </div>
          <p className="mt-3 text-center text-[9px] text-slate-400">
            Reference cards remain visible across trials.
          </p>
        </section>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Rule discovery
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Category shifts and stopping rules
          </h4>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <FieldLabel>Starting rule</FieldLabel>
            <select
              value={settings.starting_rule}
              onChange={(event) => onChange("starting_rule", event.target.value)}
              className="mt-1.5 w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
            >
              <option value="color">Color</option>
              <option value="shape">Shape</option>
              <option value="number">Number</option>
            </select>
          </label>

          <label>
            <FieldLabel>Categories to complete</FieldLabel>
            <TextField
              type="number"
              min="1"
              max="12"
              value={settings.categories_to_complete}
              onChange={(event) =>
                onChange(
                  "categories_to_complete",
                  Math.max(
                    1,
                    Math.min(12, Math.round(safeNumber(event.target.value, 6)))
                  )
                )
              }
            />
          </label>

          <label>
            <FieldLabel>Correct responses to shift rule</FieldLabel>
            <TextField
              type="number"
              min="3"
              max="20"
              value={settings.correct_to_shift}
              onChange={(event) =>
                onChange(
                  "correct_to_shift",
                  Math.max(
                    3,
                    Math.min(20, Math.round(safeNumber(event.target.value, 10)))
                  )
                )
              }
            />
          </label>

          <label>
            <FieldLabel>Maximum trials</FieldLabel>
            <TextField
              type="number"
              min="20"
              max="300"
              value={settings.max_trials}
              onChange={(event) =>
                onChange(
                  "max_trials",
                  Math.max(
                    20,
                    Math.min(300, Math.round(safeNumber(event.target.value, 128)))
                  )
                )
              }
            />
          </label>

          <label>
            <FieldLabel>Failure-to-maintain streak</FieldLabel>
            <TextField
              type="number"
              min="2"
              max={Math.max(2, settings.correct_to_shift - 1)}
              value={settings.failure_to_maintain_streak}
              onChange={(event) =>
                onChange(
                  "failure_to_maintain_streak",
                  Math.max(
                    2,
                    Math.min(
                      Math.max(2, settings.correct_to_shift - 1),
                      Math.round(safeNumber(event.target.value, 5))
                    )
                  )
                )
              }
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] leading-5 text-slate-600">
          <strong className="text-slate-900">Transparent scoring:</strong>{" "}
          after a rule shift, an incorrect choice that matches the immediately
          previous rule is counted as a PsyLattice perseverative error. Other
          errors are nonperseverative. This intentionally does not reproduce the
          proprietary official WCST ambiguity/perseveration algorithm.
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Feedback & timing
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Participant interaction
          </h4>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label>
            <FieldLabel>Feedback duration</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="100"
                step="50"
                value={settings.feedback_ms}
                onChange={(event) =>
                  onChange(
                    "feedback_ms",
                    Math.max(100, safeNumber(event.target.value, 500))
                  )
                }
                className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
              />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Inter-trial interval</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="50"
                value={settings.iti_ms}
                onChange={(event) =>
                  onChange("iti_ms", Math.max(0, safeNumber(event.target.value, 250)))
                }
                className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
              />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Response timeout</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="2000"
                step="500"
                value={settings.response_timeout_ms}
                onChange={(event) =>
                  onChange(
                    "response_timeout_ms",
                    Math.max(2000, safeNumber(event.target.value, 15000))
                  )
                }
                className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
              />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-[#fbfdfd] p-5">
        <p className="text-xs font-semibold text-slate-900">
          Research / licensing boundary
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          This template is an original PsyLattice card-sorting paradigm inspired
          by WCST-style rule discovery and set shifting. It does not reproduce
          the official WCST card deck, standardized administration, normative
          scores or proprietary Heaton scoring rules. Do not describe PsyLattice
          output as an official WCST score.
        </p>
      </section>
    </div>
  );
}

function isCorsiTaskConfig(config: Record<string, unknown> | null | undefined) {
  if (!config) return false;
  return (
    String(config.runtime || "").toLowerCase() === "corsi" ||
    String(config.template_key || "").toLowerCase() === "corsi"
  );
}

function CorsiSettingsPanel({
  taskConfig,
  onChange,
}: {
  taskConfig: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const settings = corsiSettingsFromTaskConfig(taskConfig);
  const modes =
    settings.mode === "both"
      ? ["Forward", "Backward"]
      : [settings.mode === "backward" ? "Backward" : "Forward"];
  const maxExperimental =
    (settings.max_span - settings.start_span + 1) *
    settings.trials_per_span *
    modes.length;

  return (
    <div className="mt-5 max-w-5xl space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_.9fr]">
        <section className="rounded-[24px] border border-cyan-200/80 bg-white p-5 shadow-[0_7px_24px_rgba(8,145,178,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">
                Dedicated spatial paradigm
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Corsi Block-Tapping
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Blocks illuminate one at a time. After the sequence ends, the
                participant reproduces it by clicking or tapping the same blocks.
                PsyLattice adapts the sequence length and scores the exact spatial
                order automatically.
              </p>
            </div>
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-900">
              Spatial runtime
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Mode</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{modes.join(" + ")}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Start span</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{settings.start_span}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Max span</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{settings.max_span}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Max experimental trials</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">≤ {maxExperimental}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-[#f8fbfc] p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Board preview
              </p>
              <h4 className="mt-1 text-base font-semibold text-slate-950">9-block digital layout</h4>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-500">
              Touch + mouse
            </span>
          </div>

          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-inner">
            {CORSI_STANDARD_LAYOUT.map((block, index) => (
              <div
                key={block.id}
                className={`absolute flex h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[18%] border text-[10px] font-semibold shadow-[0_7px_15px_rgba(15,23,42,0.10)] ${
                  index === 4
                    ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
                style={{ left: `${block.x}%`, top: `${block.y}%` }}
              >
                {block.id}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-slate-400">
            Block numbers are shown only in this researcher preview. Participants
            see unnumbered blocks. A draggable custom-layout editor can be added
            later without changing the Corsi runtime or stored sequence format.
          </p>
        </section>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Span progression
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Adaptive sequence length
          </h4>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            The default advances after at least one correct sequence out of two
            at a span, and stops that mode when the criterion is missed.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label>
            <FieldLabel>Response mode</FieldLabel>
            <select
              value={settings.mode}
              onChange={(event) => onChange("mode", event.target.value)}
              className="mt-1.5 w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
            >
              <option value="forward">Forward only</option>
              <option value="backward">Backward only</option>
              <option value="both">Forward + backward</option>
            </select>
          </label>

          <label>
            <FieldLabel>Starting span</FieldLabel>
            <TextField
              type="number"
              min="2"
              max="9"
              value={settings.start_span}
              onChange={(event) =>
                onChange(
                  "start_span",
                  Math.max(2, Math.min(9, Math.round(safeNumber(event.target.value, 2))))
                )
              }
            />
          </label>

          <label>
            <FieldLabel>Maximum span</FieldLabel>
            <TextField
              type="number"
              min={settings.start_span}
              max="9"
              value={settings.max_span}
              onChange={(event) =>
                onChange(
                  "max_span",
                  Math.max(
                    settings.start_span,
                    Math.min(9, Math.round(safeNumber(event.target.value, 9)))
                  )
                )
              }
            />
          </label>

          <label>
            <FieldLabel>Trials per span</FieldLabel>
            <TextField
              type="number"
              min="1"
              max="6"
              value={settings.trials_per_span}
              onChange={(event) =>
                onChange(
                  "trials_per_span",
                  Math.max(1, Math.min(6, Math.round(safeNumber(event.target.value, 2))))
                )
              }
            />
          </label>

          <label>
            <FieldLabel>Correct trials required to advance</FieldLabel>
            <TextField
              type="number"
              min="1"
              max={settings.trials_per_span}
              value={settings.pass_required}
              onChange={(event) =>
                onChange(
                  "pass_required",
                  Math.max(
                    1,
                    Math.min(
                      settings.trials_per_span,
                      Math.round(safeNumber(event.target.value, 1))
                    )
                  )
                )
              }
            />
          </label>

          <label>
            <FieldLabel>Practice trials per mode</FieldLabel>
            <TextField
              type="number"
              min="0"
              max="10"
              value={settings.practice_trials}
              onChange={(event) =>
                onChange(
                  "practice_trials",
                  Math.max(0, Math.min(10, Math.round(safeNumber(event.target.value, 3))))
                )
              }
            />
          </label>

          <label>
            <FieldLabel>Practice span</FieldLabel>
            <TextField
              type="number"
              min="2"
              max={settings.max_span}
              value={settings.practice_span}
              onChange={(event) =>
                onChange(
                  "practice_span",
                  Math.max(
                    2,
                    Math.min(
                      settings.max_span,
                      Math.round(safeNumber(event.target.value, 3))
                    )
                  )
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Presentation & response timing
          </p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">
            Sequence timing
          </h4>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <FieldLabel>Block highlight</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="100"
                step="50"
                value={settings.highlight_ms}
                onChange={(event) =>
                  onChange("highlight_ms", Math.max(100, safeNumber(event.target.value, 500)))
                }
                className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
              />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Inter-onset interval</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="150"
                step="50"
                value={settings.inter_onset_ms}
                onChange={(event) =>
                  onChange("inter_onset_ms", Math.max(150, safeNumber(event.target.value, 1000)))
                }
                className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
              />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Board settling time</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="50"
                value={settings.pre_sequence_ms}
                onChange={(event) =>
                  onChange("pre_sequence_ms", Math.max(0, safeNumber(event.target.value, 650)))
                }
                className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
              />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Response timeout</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="2000"
                step="500"
                value={settings.response_timeout_ms}
                onChange={(event) =>
                  onChange(
                    "response_timeout_ms",
                    Math.max(2000, safeNumber(event.target.value, 12000))
                  )
                }
                className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
              />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onChange("practice_feedback", !settings.practice_feedback)}
            className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
              settings.practice_feedback
                ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {settings.practice_feedback ? "✓" : "○"} Practice feedback
          </button>
          <span className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-medium text-slate-500">
            Experimental trials: no correctness feedback
          </span>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-[#fbfdfd] p-5">
        <p className="text-xs font-semibold text-slate-900">Deterministic scoring</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          PsyLattice stores the presented and recalled block sequences exactly.
          Span is the longest sequence length reproduced correctly. Product score
          is calculated as span × total correct sequences for that mode. Forward
          and backward modes remain separate when both are enabled.
        </p>
        <p className="mt-2 text-[10px] leading-4 text-slate-400">
          No normative or diagnostic cutoffs are attached to this template.
          Researchers should report the exact digital layout and configured
          administration parameters.
        </p>
      </section>
    </div>
  );
}

function StopSignalSettingsPanel({
  taskConfig,
  onChange,
}: {
  taskConfig: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const raw =
    typeof taskConfig.stop_signal === "object" && taskConfig.stop_signal !== null
      ? (taskConfig.stop_signal as Record<string, unknown>)
      : {};

  const value = (key: keyof typeof STOP_SIGNAL_DEFAULTS) =>
    raw[key] ?? STOP_SIGNAL_DEFAULTS[key];

  const experimentalTrials = Math.max(20, safeNumber(value("experimental_trials"), 200));
  const stopProbability = Math.min(0.5, Math.max(0.05, safeNumber(value("stop_probability"), 0.25)));
  const expectedStopTrials = Math.round(experimentalTrials * stopProbability);

  return (
    <div className="mt-5 max-w-4xl space-y-5">
      <div className="rounded-[24px] border border-cyan-200/80 bg-white p-5 shadow-[0_7px_24px_rgba(8,145,178,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-700">
              Dedicated paradigm
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">Stop-Signal Task</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              PsyLattice generates Go and Stop trials from the Go mappings in the Trial Table,
              presents the stop signal after an adaptive SSD, and updates the staircase after
              every Stop trial. The Trial Table defines the Go stimulus and correct response;
              the dedicated engine controls Stop-trial assignment and SSD tracking.
            </p>
          </div>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-900">
            Adaptive runtime
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Stop trials</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{Math.round(stopProbability * 100)}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Initial SSD</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{safeNumber(value("initial_ssd_ms"), 250)} ms</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">SSD step</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{safeNumber(value("staircase_step_ms"), 50)} ms</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Experimental Stop trials</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">≈ {expectedStopTrials}</p>
          </div>
        </div>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Adaptive stopping</p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">Stop-signal staircase</h4>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label>
            <FieldLabel>Stop-trial probability</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="5"
                max="50"
                step="1"
                value={Math.round(stopProbability * 100)}
                onChange={(event) => onChange("stop_probability", Math.min(0.5, Math.max(0.05, safeNumber(event.target.value, 25) / 100)))}
                className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300"
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
          </label>

          <label>
            <FieldLabel>Initial SSD</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input type="number" min="0" step="10" value={safeNumber(value("initial_ssd_ms"), 250)} onChange={(event) => onChange("initial_ssd_ms", safeNumber(event.target.value, 250))} className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Staircase step</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input type="number" min="1" step="1" value={safeNumber(value("staircase_step_ms"), 50)} onChange={(event) => onChange("staircase_step_ms", Math.max(1, safeNumber(event.target.value, 50)))} className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Minimum SSD</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input type="number" min="0" step="10" value={safeNumber(value("min_ssd_ms"), 50)} onChange={(event) => onChange("min_ssd_ms", Math.max(0, safeNumber(event.target.value, 50)))} className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Maximum SSD</FieldLabel>
            <div className="mt-1.5 flex items-center gap-2">
              <input type="number" min="50" step="10" value={safeNumber(value("max_ssd_ms"), 900)} onChange={(event) => onChange("max_ssd_ms", Math.max(50, safeNumber(event.target.value, 900)))} className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" />
              <span className="text-xs text-slate-400">ms</span>
            </div>
          </label>

          <label>
            <FieldLabel>Maximum consecutive Stop trials</FieldLabel>
            <TextField
              type="number"
              min="1"
              value={safeNumber(value("max_consecutive_stops"), 2)}
              onChange={(event) => onChange("max_consecutive_stops", Math.max(1, Math.round(safeNumber(event.target.value, 2))))}
            />
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] leading-5 text-slate-600">
          <strong className="text-slate-900">Tracking rule:</strong> successful Stop → SSD increases;
          failed Stop → SSD decreases. The default 50 ms step and 25% Stop-trial probability follow
          common Stop-Signal recommendations and are editable for the research protocol.
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Task length & timing</p>
          <h4 className="mt-1 text-base font-semibold text-slate-950">Participant experience</h4>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label><FieldLabel>Practice trials</FieldLabel><TextField type="number" min="4" value={safeNumber(value("practice_trials"), 16)} onChange={(event) => onChange("practice_trials", Math.max(4, Math.round(safeNumber(event.target.value, 16))))} /></label>
          <label><FieldLabel>Experimental trials</FieldLabel><TextField type="number" min="20" value={experimentalTrials} onChange={(event) => onChange("experimental_trials", Math.max(20, Math.round(safeNumber(event.target.value, 200))))} /></label>
          <label><FieldLabel>Go response deadline (ms)</FieldLabel><TextField type="number" min="250" value={safeNumber(value("go_deadline_ms"), 1000)} onChange={(event) => onChange("go_deadline_ms", Math.max(250, safeNumber(event.target.value, 1000)))} /></label>
          <label><FieldLabel>Fixation (ms)</FieldLabel><TextField type="number" min="0" value={safeNumber(value("fixation_ms"), 500)} onChange={(event) => onChange("fixation_ms", Math.max(0, safeNumber(event.target.value, 500)))} /></label>
          <label><FieldLabel>ITI (ms)</FieldLabel><TextField type="number" min="0" value={safeNumber(value("iti_ms"), 700)} onChange={(event) => onChange("iti_ms", Math.max(0, safeNumber(event.target.value, 700)))} /></label>
          <label><FieldLabel>Stop signal duration (ms)</FieldLabel><TextField type="number" min="16" value={safeNumber(value("stop_signal_duration_ms"), 250)} onChange={(event) => onChange("stop_signal_duration_ms", Math.max(16, safeNumber(event.target.value, 250)))} /></label>
          <label><FieldLabel>Stop signal text</FieldLabel><TextField value={String(value("stop_signal_text") || "STOP")} onChange={(event) => onChange("stop_signal_text", event.target.value.slice(0, 12))} /></label>
          <label><FieldLabel>Stop signal colour</FieldLabel><TextField type="color" value={String(value("stop_signal_color") || "#ef4444")} onChange={(event) => onChange("stop_signal_color", event.target.value)} /></label>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-[#fbfdfd] p-5">
        <p className="text-xs font-semibold text-slate-900">Deterministic SSRT output</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          PsyLattice calculates SSRT with the integration method and replaces Go omissions with
          the configured maximum Go response time. Practice trials are excluded from the SSRT
          estimate. Raw SSD values, Stop success/failure, premature responses and staircase changes
          are retained trial by trial.
        </p>
        {expectedStopTrials < 50 && (
          <div className="pl-inline-warning mt-4 text-xs">
            This configuration yields about {expectedStopTrials} experimental Stop trials. For a
            stronger SSRT estimate, consider at least 50 Stop trials when your protocol permits.
          </div>
        )}
        {safeNumber(value("max_ssd_ms"), 900) >= safeNumber(value("go_deadline_ms"), 1000) && (
          <div className="pl-inline-warning mt-3 text-xs">
            Maximum SSD should stay below the Go response deadline so the Stop signal has time to appear before the trial ends. The runtime will clamp impossible SSD values, but it is better to correct the saved configuration here.
          </div>
        )}
      </section>
    </div>
  );
}

export default function CognitiveTaskBuilder({
  taskId,
  onBack,
  onSaved,
}: {
  taskId: string;
  onBack: () => void;
  onSaved?: () => void;
}) {
  const [task, setTask] = useState<CognitiveTask | null>(null);
  const [version, setVersion] = useState<CognitiveVersion | null>(null);
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [selectedComponentId, setSelectedComponentId] = useState("");
  const [editorTab, setEditorTab] = useState<EditorTab>("timeline");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [dirty, setDirty] = useState(false);
  const [newVariable, setNewVariable] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [componentMenuOpen, setComponentMenuOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    const supabase = createClient();

    const { data: taskData, error: taskError } = await supabase
      .from("cognitive_tasks")
      .select("id,title,description,domain,source_template_id,template_key")
      .eq("id", taskId)
      .single();

    if (taskError || !taskData) {
      setNotice({ type: "error", text: taskError?.message || "Cognitive task could not be loaded." });
      setLoading(false);
      return;
    }

    const { data: versionRows, error: versionError } = await supabase
      .from("cognitive_task_versions")
      .select("id,task_id,version_number,version_label,status,participant_instructions,task_config,randomization_config,scoring_config,timing_config,output_config,device_config")
      .eq("task_id", taskId)
      .order("version_number", { ascending: false })
      .limit(1);

    const versionData = versionRows?.[0] as CognitiveVersion | undefined;
    if (versionError || !versionData) {
      setNotice({ type: "error", text: versionError?.message || "Task version could not be loaded." });
      setLoading(false);
      return;
    }

    const { data: blockRows, error: blockError } = await supabase
      .from("cognitive_task_blocks")
      .select("id,block_key,name,block_type,position,repeat_count,continue_rule,config")
      .eq("version_id", versionData.id)
      .order("position", { ascending: true });

    if (blockError) {
      setNotice({ type: "error", text: blockError.message });
      setLoading(false);
      return;
    }

    const blockIds = (blockRows || []).map((row) => row.id);
    let componentRows: any[] = [];
    let trialRows: any[] = [];

    if (blockIds.length > 0) {
      const [componentResult, trialResult] = await Promise.all([
        supabase
          .from("cognitive_task_components")
          .select("id,block_id,component_key,component_type,position,config")
          .in("block_id", blockIds)
          .order("position", { ascending: true }),
        supabase
          .from("cognitive_task_trial_rows")
          .select("id,block_id,position,condition_label,variables,weight,enabled")
          .in("block_id", blockIds)
          .order("position", { ascending: true }),
      ]);
      if (componentResult.error || trialResult.error) {
        setNotice({ type: "error", text: componentResult.error?.message || trialResult.error?.message || "Task structure could not be loaded." });
        setLoading(false);
        return;
      }
      componentRows = componentResult.data || [];
      trialRows = trialResult.data || [];
    }

    const nextBlocks: BuilderBlock[] = (blockRows || []).map((row) => ({
      local_id: row.id,
      block_key: row.block_key,
      name: row.name,
      block_type: row.block_type as BlockType,
      position: row.position,
      repeat_count: row.repeat_count,
      continue_rule: (row.continue_rule || {}) as Record<string, unknown>,
      config: (row.config || {}) as Record<string, unknown>,
      components: componentRows
        .filter((component) => component.block_id === row.id)
        .map((component) => ({
          local_id: component.id,
          component_key: component.component_key,
          component_type: component.component_type as ComponentType,
          position: component.position,
          config: (component.config || {}) as Record<string, unknown>,
        })),
      trials: trialRows
        .filter((trial) => trial.block_id === row.id)
        .map((trial) => ({
          local_id: trial.id,
          position: trial.position,
          condition_label: trial.condition_label || "",
          variables: Object.fromEntries(Object.entries(trial.variables || {}).map(([key, value]) => [key, String(value ?? "")])),
          weight: Number(trial.weight ?? 1),
          enabled: trial.enabled !== false,
        })),
    }));

    setTask(taskData as CognitiveTask);
    setVersion(versionData);
    setBlocks(nextBlocks);
    setSelectedBlockId((current) => current && nextBlocks.some((block) => block.local_id === current) ? current : nextBlocks[0]?.local_id || "");
    setSelectedComponentId("");
    setEditorTab(
      isStopSignalTaskConfig(versionData.task_config) ||
        isCorsiTaskConfig(versionData.task_config) ||
        isCardSortTaskConfig(versionData.task_config)
        ? "paradigm"
        : "timeline"
    );
    setDirty(false);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedBlock = blocks.find((block) => block.local_id === selectedBlockId) || null;
  const selectedComponent = selectedBlock?.components.find((component) => component.local_id === selectedComponentId) || null;
  const stopSignalTask = !!version && isStopSignalTaskConfig(version.task_config);
  const corsiTask = !!version && isCorsiTaskConfig(version.task_config);
  const cardSortTask = !!version && isCardSortTaskConfig(version.task_config);
  const dedicatedLockedTask = corsiTask || cardSortTask;

  function updateCardSortSetting(key: string, value: unknown) {
    if (!version) return;
    const current =
      typeof version.task_config.card_sorting === "object" &&
      version.task_config.card_sorting !== null
        ? (version.task_config.card_sorting as Record<string, unknown>)
        : {};
    const defaults = cardSortSettingsFromTaskConfig(version.task_config);
    updateVersion("task_config", {
      ...version.task_config,
      template_key: "card_sorting",
      runtime: "card_sorting",
      card_sorting: {
        ...defaults,
        ...current,
        [key]: value,
      },
    });
  }

  function updateCorsiSetting(key: string, value: unknown) {
    if (!version) return;
    const current =
      typeof version.task_config.corsi === "object" && version.task_config.corsi !== null
        ? (version.task_config.corsi as Record<string, unknown>)
        : {};
    const defaults = corsiSettingsFromTaskConfig(version.task_config);
    updateVersion("task_config", {
      ...version.task_config,
      template_key: "corsi",
      runtime: "corsi",
      corsi: {
        ...defaults,
        ...current,
        [key]: value,
      },
    });
  }

  function updateStopSignalSetting(key: string, value: unknown) {
    if (!version) return;
    const current =
      typeof version.task_config.stop_signal === "object" && version.task_config.stop_signal !== null
        ? (version.task_config.stop_signal as Record<string, unknown>)
        : {};
    updateVersion("task_config", {
      ...version.task_config,
      template_key: "stop_signal",
      runtime: "stop_signal",
      stop_signal: {
        ...STOP_SIGNAL_DEFAULTS,
        ...current,
        [key]: value,
      },
    });
  }

  const trialVariables = useMemo(() => {
    if (!selectedBlock) return [];
    const names = new Set<string>();
    selectedBlock.trials.forEach((trial) => Object.keys(trial.variables).forEach((key) => names.add(key)));
    selectedBlock.components.forEach((component) => {
      ["content_variable", "color_variable", "asset_variable", "correct_variable"].forEach((key) => {
        const value = component.config[key];
        if (typeof value === "string" && value.trim()) names.add(value.trim());
      });
    });
    return Array.from(names);
  }, [selectedBlock]);

  function markDirty() {
    setDirty(true);
    setNotice(null);
  }

  function updateTask(patch: Partial<CognitiveTask>) {
    setTask((current) => current ? { ...current, ...patch } : current);
    markDirty();
  }

  function updateVersion<K extends keyof CognitiveVersion>(key: K, value: CognitiveVersion[K]) {
    setVersion((current) => current ? { ...current, [key]: value } : current);
    markDirty();
  }

  function updateBlock(blockId: string, patch: Partial<BuilderBlock>) {
    setBlocks((current) => current.map((block) => block.local_id === blockId ? { ...block, ...patch } : block));
    markDirty();
  }

  function addBlock(type: BlockType = "experimental") {
    const position = blocks.length + 1;
    const next: BuilderBlock = {
      local_id: uid("block"),
      block_key: `${type}_${position}`,
      name: BLOCK_TYPES.find((item) => item.value === type)?.label || `Block ${position}`,
      block_type: type,
      position,
      repeat_count: 1,
      continue_rule: type === "practice" ? { min_accuracy: 0.8, on_fail: "repeat", max_attempts: 3 } : {},
      config: {},
      components: [],
      trials: [],
    };
    setBlocks((current) => [...current, next]);
    setSelectedBlockId(next.local_id);
    setSelectedComponentId("");
    setEditorTab("timeline");
    markDirty();
  }

  function duplicateBlock(block: BuilderBlock) {
    const position = blocks.length + 1;
    const next: BuilderBlock = {
      ...block,
      local_id: uid("block"),
      block_key: `${block.block_key}_copy_${position}`,
      name: `${block.name} copy`,
      position,
      components: block.components.map((component, index) => ({ ...component, local_id: uid("component"), component_key: `${component.component_key}_copy_${index + 1}` })),
      trials: block.trials.map((trial, index) => ({ ...trial, local_id: uid("trial"), position: index + 1, variables: { ...trial.variables } })),
    };
    setBlocks((current) => [...current, next]);
    setSelectedBlockId(next.local_id);
    setSelectedComponentId("");
    markDirty();
  }

  function removeBlock(blockId: string) {
    if (!window.confirm("Delete this block from the draft?")) return;
    const next = blocks.filter((block) => block.local_id !== blockId).map((block, index) => ({ ...block, position: index + 1 }));
    setBlocks(next);
    setSelectedBlockId(next[0]?.local_id || "");
    setSelectedComponentId("");
    markDirty();
  }

  function moveBlock(blockId: string, direction: -1 | 1) {
    const index = blocks.findIndex((block) => block.local_id === blockId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next.map((block, position) => ({ ...block, position: position + 1 })));
    markDirty();
  }

  function addComponent(type: ComponentType) {
    if (!selectedBlock) return;
    const next: BuilderComponent = {
      local_id: uid("component"),
      component_key: `${type}_${selectedBlock.components.length + 1}`,
      component_type: type,
      position: selectedBlock.components.length + 1,
      config: defaultComponentConfig(type),
    };
    updateBlock(selectedBlock.local_id, { components: [...selectedBlock.components, next] });
    setSelectedComponentId(next.local_id);
  }

  function addCommonTrial() {
    if (!selectedBlock) return;
    const existingKeys = new Set(selectedBlock.components.map((component) => component.component_key));
    const uniqueKey = (base: string) => {
      if (!existingKeys.has(base)) {
        existingKeys.add(base);
        return base;
      }
      let index = 2;
      while (existingKeys.has(`${base}_${index}`)) index += 1;
      const key = `${base}_${index}`;
      existingKeys.add(key);
      return key;
    };
    const fixationKey = uniqueKey("fixation");
    const stimulusKey = uniqueKey("stimulus");
    const responseKey = uniqueKey("response");
    const itiKey = uniqueKey("iti");
    const responseConfig = { ...defaultComponentConfig("response"), rt_anchor: stimulusKey };
    const starter: BuilderComponent[] = [
      { local_id: uid("component"), component_key: fixationKey, component_type: "fixation", position: 1, config: defaultComponentConfig("fixation") },
      { local_id: uid("component"), component_key: stimulusKey, component_type: "text", position: 2, config: defaultComponentConfig("text") },
      { local_id: uid("component"), component_key: responseKey, component_type: "response", position: 3, config: responseConfig },
      { local_id: uid("component"), component_key: itiKey, component_type: "iti", position: 4, config: defaultComponentConfig("iti") },
    ];
    const base = selectedBlock.components.length;
    const next = [...selectedBlock.components, ...starter.map((component, index) => ({ ...component, position: base + index + 1 }))];
    updateBlock(selectedBlock.local_id, { components: next });
    setSelectedComponentId(starter[2].local_id);
    setComponentMenuOpen(false);
  }

  function updateComponent(componentId: string, patch: Partial<BuilderComponent>) {
    if (!selectedBlock) return;
    updateBlock(selectedBlock.local_id, {
      components: selectedBlock.components.map((component) => component.local_id === componentId ? { ...component, ...patch } : component),
    });
  }

  function updateComponentConfig(key: string, value: unknown) {
    if (!selectedComponent) return;
    updateComponent(selectedComponent.local_id, { config: { ...selectedComponent.config, [key]: value } });
  }

  function removeComponent(componentId: string) {
    if (!selectedBlock) return;
    const next = selectedBlock.components.filter((component) => component.local_id !== componentId).map((component, index) => ({ ...component, position: index + 1 }));
    updateBlock(selectedBlock.local_id, { components: next });
    setSelectedComponentId("");
  }

  function moveComponent(componentId: string, direction: -1 | 1) {
    if (!selectedBlock) return;
    const index = selectedBlock.components.findIndex((component) => component.local_id === componentId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= selectedBlock.components.length) return;
    const next = [...selectedBlock.components];
    [next[index], next[target]] = [next[target], next[index]];
    updateBlock(selectedBlock.local_id, { components: next.map((component, position) => ({ ...component, position: position + 1 })) });
  }

  function addTrial() {
    if (!selectedBlock) return;
    const variables = Object.fromEntries((trialVariables.length ? trialVariables : ["stimulus", "correct"]).map((key) => [key, ""]));
    const next: BuilderTrial = { local_id: uid("trial"), position: selectedBlock.trials.length + 1, condition_label: "", variables, weight: 1, enabled: true };
    updateBlock(selectedBlock.local_id, { trials: [...selectedBlock.trials, next] });
  }

  function updateTrial(trialId: string, patch: Partial<BuilderTrial>) {
    if (!selectedBlock) return;
    updateBlock(selectedBlock.local_id, { trials: selectedBlock.trials.map((trial) => trial.local_id === trialId ? { ...trial, ...patch } : trial) });
  }

  function removeTrial(trialId: string) {
    if (!selectedBlock) return;
    const next = selectedBlock.trials.filter((trial) => trial.local_id !== trialId).map((trial, index) => ({ ...trial, position: index + 1 }));
    updateBlock(selectedBlock.local_id, { trials: next });
  }

  function addTrialVariable() {
    const variable = newVariable.trim().replace(/\s+/g, "_").toLowerCase();
    if (!selectedBlock || !variable || trialVariables.includes(variable)) return;
    updateBlock(selectedBlock.local_id, { trials: selectedBlock.trials.map((trial) => ({ ...trial, variables: { ...trial.variables, [variable]: "" } })) });
    setNewVariable("");
  }

  function removeTrialVariable(variable: string) {
    if (!selectedBlock) return;
    updateBlock(selectedBlock.local_id, {
      trials: selectedBlock.trials.map((trial) => {
        const nextVariables = { ...trial.variables };
        delete nextVariables[variable];
        return { ...trial, variables: nextVariables };
      }),
    });
  }

  async function importCsv(file: File) {
    if (!selectedBlock) return;
    const rows = parseCsv(await file.text());
    if (rows.length < 2) {
      setNotice({ type: "error", text: "CSV needs a header row and at least one data row." });
      return;
    }
    const headers = rows[0].map((value) => value.trim());
    const nextTrials: BuilderTrial[] = rows.slice(1).map((cells, index) => {
      const record = Object.fromEntries(headers.map((header, column) => [header, cells[column] ?? ""]));
      const variables: Record<string, string> = {};
      headers.forEach((header) => {
        if (!["condition", "condition_label", "weight", "enabled"].includes(header)) variables[header] = record[header] || "";
      });
      return {
        local_id: uid("trial"),
        position: index + 1,
        condition_label: record.condition_label || record.condition || "",
        variables,
        weight: safeNumber(record.weight, 1),
        enabled: String(record.enabled || "true").toLowerCase() !== "false",
      };
    });
    updateBlock(selectedBlock.local_id, { trials: nextTrials });
    setNotice({ type: "success", text: `${nextTrials.length} trial rows imported from CSV.` });
  }

  async function save() {
    if (!task || !version) return;
    if (version.status !== "draft") {
      setNotice({ type: "error", text: "This version is locked. Create a new draft version before editing." });
      return;
    }
    if (!task.title.trim()) {
      setNotice({ type: "error", text: "Task title is required." });
      return;
    }
    const duplicateKeys = blocks.map((block) => block.block_key.trim()).filter((key, index, all) => key && all.indexOf(key) !== index);
    if (duplicateKeys.length) {
      setNotice({ type: "error", text: `Block keys must be unique. Duplicate: ${duplicateKeys[0]}` });
      return;
    }

    setSaving(true);
    setNotice(null);
    const supabase = createClient();
    const payload = {
      task: { title: task.title.trim(), description: task.description, domain: task.domain },
      version: {
        participant_instructions: version.participant_instructions,
        task_config: version.task_config || {},
        randomization_config: version.randomization_config || {},
        scoring_config: version.scoring_config || {},
        timing_config: version.timing_config || {},
        output_config: version.output_config || {},
        device_config: version.device_config || {},
      },
      blocks: blocks.map((block, blockIndex) => ({
        block_key: block.block_key.trim() || `block_${blockIndex + 1}`,
        name: block.name.trim() || `Block ${blockIndex + 1}`,
        block_type: block.block_type,
        position: blockIndex + 1,
        repeat_count: Math.max(1, block.repeat_count),
        continue_rule: block.continue_rule || {},
        config: block.config || {},
        components: block.components.map((component, componentIndex) => ({
          component_key: component.component_key.trim() || `component_${componentIndex + 1}`,
          component_type: component.component_type,
          position: componentIndex + 1,
          config: normalizeComponentConfigForSave(component, block),
        })),
        trials: block.trials.map((trial, trialIndex) => ({
          position: trialIndex + 1,
          condition_label: trial.condition_label,
          variables: trial.variables,
          weight: Math.max(0, trial.weight),
          enabled: trial.enabled,
        })),
      })),
    };

    const { error } = await supabase.rpc("psylattice_save_cognitive_builder", {
      p_task_id: task.id,
      p_version_id: version.id,
      p_payload: payload,
    });

    if (error) {
      setNotice({ type: "error", text: error.message });
      setSaving(false);
      return;
    }

    setSaving(false);
    setDirty(false);
    setNotice({ type: "success", text: "Cognitive task draft saved." });
    onSaved?.();
    await load();
  }

  function back() {
    if (dirty && !window.confirm("Leave the Task Builder without saving your latest changes?")) return;
    onBack();
  }

  if (loading) {
    return (
      <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-slate-300/70 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading Task Builder…</div>
      </div>
    );
  }

  if (!task || !version) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_16px_40px_rgba(15,23,42,0.08)]">
        {notice?.text || "This cognitive task could not be opened."}
      </div>
    );
  }

  const locked = version.status !== "draft";

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-slate-300/75 bg-white shadow-[0_3px_8px_rgba(15,23,42,0.05),0_18px_44px_rgba(15,23,42,0.085),0_34px_80px_rgba(8,145,178,0.04)]">
        <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-start gap-4">
            <button type="button" onClick={back} className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300/80 bg-white text-slate-500 shadow-[0_5px_16px_rgba(15,23,42,0.06)] transition hover:-translate-y-px hover:border-cyan-200 hover:text-slate-950" aria-label="Back to Cognitive Lab">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Cognitive Task Builder</span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold shadow-[0_4px_12px_rgba(15,23,42,0.045)] ${locked ? "border-slate-200 bg-white text-slate-600" : "border-cyan-200 bg-cyan-50 text-cyan-900"}`}>{version.version_label} · {version.status}</span>
                {dirty && <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.045)]">Unsaved changes</span>}
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{task.title}</h2>
              <p className="mt-1 text-xs text-slate-500">Build the task definition here, save it, then run an isolated browser Preview with reaction-time capture and timing diagnostics.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={saving || dirty || blocks.length === 0}
              title={dirty ? "Save the draft before previewing it" : blocks.length === 0 ? "Add at least one block first" : "Run browser preview"}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2.5 text-xs font-semibold text-cyan-900 shadow-[0_5px_16px_rgba(8,145,178,0.10)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <Monitor className="h-4 w-4" />
              {dirty ? "Save to preview" : "Preview task"}
            </button>
            <button type="button" onClick={() => void save()} disabled={saving || locked} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(15,23,42,0.16),0_12px_26px_rgba(15,23,42,0.13)] transition hover:-translate-y-px disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </button>
          </div>
        </div>

        {notice && (
          <div className={`flex items-start gap-3 border-b border-slate-100 px-5 py-3 text-xs ${notice.type === "success" ? "text-cyan-900" : "text-rose-700"}`}>
            <span className={`mt-0.5 h-3.5 w-1 rounded-full ${notice.type === "success" ? "bg-cyan-500" : "bg-rose-500"}`} aria-hidden="true" />
            <span className="leading-5">{notice.text}</span>
          </div>
        )}

        <div className="grid min-h-[720px] lg:grid-cols-[245px_minmax(0,1fr)_310px]">
          {/* Structure */}
          <aside className="border-b border-slate-200 bg-[#fbfdfd] p-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Structure</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{cardSortTask ? "Card sorting flow" : corsiTask ? "Corsi flow" : "Blocks"}</p>
              </div>
              {!dedicatedLockedTask && <div className="relative">
                <button
                  type="button"
                  onClick={() => setBlockMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-cyan-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Add block <ChevronDown className="h-3 w-3" />
                </button>
                {blockMenuOpen && (
                  <div className="absolute right-0 top-11 z-40 w-48 rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                    {BLOCK_TYPES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => { setBlockMenuOpen(false); addBlock(item.value); }}
                        className="w-full rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-900"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>}
            </div>

            {cardSortTask && (
              <div className="mt-3 rounded-2xl border border-cyan-100 bg-white p-3 text-[10px] leading-4 text-slate-500 shadow-[0_3px_10px_rgba(15,23,42,0.035)]">
                Hidden-rule card sorting → complete. The stateful structure is fixed so rule shifts and scoring remain reproducible; customise the protocol in <strong className="text-slate-700">Card sorting setup</strong>.
              </div>
            )}

            {corsiTask && (
              <div className="mt-3 rounded-2xl border border-cyan-100 bg-white p-3 text-[10px] leading-4 text-slate-500 shadow-[0_3px_10px_rgba(15,23,42,0.035)]">
                Practice → adaptive span → complete. This sequence is fixed so the dedicated spatial runtime stays reproducible; customise the protocol in <strong className="text-slate-700">Corsi setup</strong>.
              </div>
            )}

            <div className="mt-4 space-y-2">
              {blocks.map((block, index) => {
                const active = block.local_id === selectedBlockId;
                return (
                  <button key={block.local_id} type="button" onClick={() => { setSelectedBlockId(block.local_id); setSelectedComponentId(""); }} className={`w-full rounded-2xl border p-3 text-left transition ${active ? "border-cyan-300 bg-white shadow-[0_6px_18px_rgba(8,145,178,0.13)]" : "border-slate-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.035)] hover:border-cyan-200 hover:shadow-[0_5px_16px_rgba(15,23,42,0.06)]"}`}>
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${active ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-500"}`}>{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900">{block.name}</p>
                        <p className="mt-1 text-[10px] capitalize text-slate-400">{cardSortTask
                          ? block.block_type === "experimental"
                            ? "Stateful hidden-rule sorting"
                            : "Completion screen"
                          : corsiTask
                            ? block.block_type === "practice"
                              ? "Dedicated spatial practice"
                              : block.block_type === "experimental"
                                ? "Adaptive spatial span"
                                : "Completion screen"
                            : `${block.block_type.replace("_", " ")} · ${block.components.length} steps · ${block.trials.length} rows`}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {blocks.length === 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
                <Layers3 className="mx-auto h-5 w-5 text-slate-400" />
                <p className="mt-2 text-xs font-semibold text-slate-700">No blocks yet</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">Add Instructions, Practice or Experimental blocks.</p>
              </div>
            )}

            {selectedBlock && !dedicatedLockedTask && (
              <div className="mt-4 grid grid-cols-4 gap-1.5">
                <button type="button" onClick={() => moveBlock(selectedBlock.local_id, -1)} className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500" title="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => moveBlock(selectedBlock.local_id, 1)} className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500" title="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => duplicateBlock(selectedBlock)} className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500" title="Duplicate block"><Copy className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => removeBlock(selectedBlock.local_id)} className="flex h-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500" title="Delete block"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </aside>

          {/* Main editor */}
          <section className="min-w-0 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap gap-2 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_5px_16px_rgba(15,23,42,0.05)]">
              {(cardSortTask
                ? [
                    ["paradigm", "Card sorting setup", Shuffle] as const,
                    ["scoring", "Scoring & devices", BarChart3] as const,
                  ]
                : corsiTask
                  ? [
                      ["paradigm", "Corsi setup", Square] as const,
                      ["scoring", "Scoring & devices", BarChart3] as const,
                    ]
                  : [
                      ...(stopSignalTask
                        ? [["paradigm", "Stop-Signal setup", CircleDot] as const]
                        : []),
                      ["timeline", "Trial timeline", Layers3] as const,
                      ["trials", "Trial table", ListChecks] as const,
                      ["randomization", "Randomisation", Shuffle] as const,
                      ["scoring", "Scoring & devices", BarChart3] as const,
                    ]
              ).map(([id, label, Icon]) => (
                <button key={id as string} type="button" onClick={() => setEditorTab(id as EditorTab)} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${editorTab === id ? "border border-cyan-200 bg-white text-cyan-950 shadow-[0_5px_16px_rgba(8,145,178,0.12)]" : "border border-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900 hover:shadow-[0_4px_12px_rgba(15,23,42,0.045)]"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label as string}
                </button>
              ))}
            </div>

            {!selectedBlock ? (
              <div className="mt-5 flex min-h-[480px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50/50 text-center">
                <div className="max-w-sm px-6"><Layers3 className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-800">Add or select a block</p><p className="mt-1 text-xs leading-5 text-slate-500">Blocks define the participant journey. Trial-level stimuli and responses live inside Practice and Experimental blocks.</p></div>
              </div>
            ) : editorTab === "paradigm" && cardSortTask ? (
              <CardSortSettingsPanel
                taskConfig={version.task_config}
                onChange={updateCardSortSetting}
              />
            ) : editorTab === "paradigm" && corsiTask ? (
              <CorsiSettingsPanel taskConfig={version.task_config} onChange={updateCorsiSetting} />
            ) : editorTab === "paradigm" && stopSignalTask ? (
              <StopSignalSettingsPanel taskConfig={version.task_config} onChange={updateStopSignalSetting} />
            ) : editorTab === "timeline" ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">{selectedBlock.name}</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Trial timeline</h3><p className="mt-1 text-xs text-slate-500">Components run in order for each trial row in this block.</p></div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={addCommonTrial}
                      className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-cyan-900 shadow-[0_5px_16px_rgba(8,145,178,0.10)] transition hover:-translate-y-px"
                      title="Adds Fixation → Stimulus → Response → ITI"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Quick trial
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setComponentMenuOpen((open) => !open)}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(15,23,42,0.16),0_12px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-px"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add step <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      {componentMenuOpen && (
                        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                          <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Choose a timeline step</p>
                          <div className="grid grid-cols-2 gap-1">
                            {COMPONENTS.map((item) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.type}
                                  type="button"
                                  onClick={() => { setComponentMenuOpen(false); addComponent(item.type); }}
                                  className="flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-[11px] font-medium text-slate-700 hover:bg-cyan-50 hover:text-cyan-900"
                                >
                                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100"><Icon className="h-3.5 w-3.5" /></span>
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  {selectedBlock.components.map((component, index) => {
                    const item = COMPONENTS.find((candidate) => candidate.type === component.component_type);
                    const Icon = item?.icon || Settings2;
                    const active = component.local_id === selectedComponentId;
                    return (
                      <button key={component.local_id} type="button" onClick={() => setSelectedComponentId(component.local_id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${active ? "border-cyan-300 bg-white shadow-[0_6px_18px_rgba(8,145,178,0.13)]" : "border-slate-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.035)] hover:border-cyan-200 hover:shadow-[0_5px_16px_rgba(15,23,42,0.06)]"}`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="h-4 w-4" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-slate-900">{item?.label || component.component_type}</p><span className="text-[9px] font-medium text-slate-400">Step {index + 1}</span></div>
                          <p className="mt-1 truncate text-[10px] text-slate-500">{componentSummary(component)}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <span onClick={(event) => { event.stopPropagation(); moveComponent(component.local_id, -1); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700" title="Move up"><ArrowUp className="h-3 w-3" /></span>
                          <span onClick={(event) => { event.stopPropagation(); moveComponent(component.local_id, 1); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700" title="Move down"><ArrowDown className="h-3 w-3" /></span>
                          <span onClick={(event) => { event.stopPropagation(); removeComponent(component.local_id); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-400 hover:bg-red-100" title="Remove step"><X className="h-3 w-3" /></span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedBlock.components.length === 0 && (
                  <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Sparkles className="mx-auto h-5 w-5 text-cyan-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-800">Start with a complete trial</p>
                    <p className="mt-1 text-xs text-slate-500">PsyLattice can add the common Fixation → Stimulus → Response → ITI structure for you.</p>
                    <button type="button" onClick={addCommonTrial} className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white">Add standard trial</button>
                  </div>
                )}
              </div>
            ) : editorTab === "trials" ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">{selectedBlock.name}</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Trial table</h3><p className="mt-1 text-xs text-slate-500">Variables can be referenced by timeline components such as <span className="font-mono">stimulus</span> or <span className="font-mono">correct</span>.</p></div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600"><FileUp className="h-3.5 w-3.5" />Import CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); event.currentTarget.value = ""; }} /></label>
                    <button type="button" onClick={addTrial} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5" />Add row</button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <label className="min-w-[220px] flex-1"><FieldLabel>Add variable column</FieldLabel><TextField value={newVariable} onChange={(event) => setNewVariable(event.target.value)} placeholder="e.g. word, colour, correct" /></label>
                  <button type="button" onClick={addTrialVariable} className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700">Add variable</button>
                  <div className="flex flex-wrap gap-1.5">
                    {trialVariables.map((variable) => <span key={variable} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">{variable}<button type="button" onClick={() => removeTrialVariable(variable)} className="text-slate-300 hover:text-red-500"><X className="h-3 w-3" /></button></span>)}
                  </div>
                </div>

                {selectedBlock.trials.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><ListChecks className="mx-auto h-5 w-5 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-800">No trial rows</p><p className="mt-1 text-xs text-slate-500">Add rows manually or import a CSV. Instruction/break blocks may legitimately have no rows.</p></div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-500"><tr><th className="px-3 py-3">#</th><th className="min-w-32 px-3 py-3">Condition</th>{trialVariables.map((variable) => <th key={variable} className="min-w-32 px-3 py-3 font-mono normal-case tracking-normal">{variable}</th>)}<th className="w-24 px-3 py-3">Weight</th><th className="w-20 px-3 py-3">Use</th><th className="w-12 px-3 py-3" /></tr></thead>
                      <tbody>
                        {selectedBlock.trials.map((trial, index) => (
                          <tr key={trial.local_id} className="border-t border-slate-100 bg-white">
                            <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                            <td className="px-2 py-2"><input value={trial.condition_label} onChange={(event) => updateTrial(trial.local_id, { condition_label: event.target.value })} className="w-full rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-cyan-300" /></td>
                            {trialVariables.map((variable) => <td key={variable} className="px-2 py-2"><input value={trial.variables[variable] || ""} onChange={(event) => updateTrial(trial.local_id, { variables: { ...trial.variables, [variable]: event.target.value } })} className="w-full rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-cyan-300" /></td>)}
                            <td className="px-2 py-2"><input type="number" min="0" step="0.1" value={trial.weight} onChange={(event) => updateTrial(trial.local_id, { weight: safeNumber(event.target.value, 1) })} className="w-20 rounded-lg border border-slate-200 px-2 py-2 outline-none focus:border-cyan-300" /></td>
                            <td className="px-3 py-2"><input type="checkbox" checked={trial.enabled} onChange={(event) => updateTrial(trial.local_id, { enabled: event.target.checked })} className="h-4 w-4 accent-cyan-700" /></td>
                            <td className="px-2 py-2"><button type="button" onClick={() => removeTrial(trial.local_id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : editorTab === "randomization" ? (
              <div className="mt-5 max-w-3xl space-y-4">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Task-level controls</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Randomisation</h3><p className="mt-1 text-xs text-slate-500">These settings are saved with the task and are now executed by the Phase 1D browser Preview runner.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label><FieldLabel>Trial order</FieldLabel><SelectField value={String(version.randomization_config.trial_order || "random")} onChange={(event) => updateVersion("randomization_config", { ...version.randomization_config, trial_order: event.target.value })}><option value="sequential">Sequential</option><option value="random">Random</option><option value="pseudorandom">Pseudorandom</option></SelectField></label>
                  <label><FieldLabel>Sampling</FieldLabel><SelectField value={String(version.randomization_config.sampling || "without_replacement")} onChange={(event) => updateVersion("randomization_config", { ...version.randomization_config, sampling: event.target.value })}><option value="without_replacement">Without replacement</option><option value="with_replacement">With replacement</option></SelectField></label>
                  <label><FieldLabel>Max same condition consecutively</FieldLabel><TextField type="number" min="1" value={safeNumber(version.randomization_config.max_same_condition_consecutive, 3)} onChange={(event) => updateVersion("randomization_config", { ...version.randomization_config, max_same_condition_consecutive: safeNumber(event.target.value, 3) })} /></label>
                  <label><FieldLabel>Seed mode</FieldLabel><SelectField value={String(version.randomization_config.seed_mode || "automatic")} onChange={(event) => updateVersion("randomization_config", { ...version.randomization_config, seed_mode: event.target.value })}><option value="automatic">Automatic per participant</option><option value="fixed">Fixed reproducible seed</option></SelectField></label>
                </div>
                <Toggle checked={version.randomization_config.balance_conditions === true} onChange={(value) => updateVersion("randomization_config", { ...version.randomization_config, balance_conditions: value })} label="Balance condition counts where possible" />
                <Toggle checked={version.randomization_config.balance_responses === true} onChange={(value) => updateVersion("randomization_config", { ...version.randomization_config, balance_responses: value })} label="Balance response mappings where possible" />
                {version.randomization_config.seed_mode === "fixed" && <label className="block"><FieldLabel>Fixed seed</FieldLabel><TextField value={String(version.randomization_config.seed || "psylattice-1")} onChange={(event) => updateVersion("randomization_config", { ...version.randomization_config, seed: event.target.value })} /></label>}
              </div>
            ) : (
              <div className="mt-5 max-w-3xl space-y-5">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Outputs & compatibility</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Scoring, timing and devices</h3><p className="mt-1 text-xs text-slate-500">Define what Preview retains, the timing diagnostics it collects, and which participant devices the protocol permits.</p></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label><FieldLabel>Metric keys</FieldLabel><TextField value={Array.isArray(version.scoring_config.metrics) ? version.scoring_config.metrics.join(", ") : ""} onChange={(event) => updateVersion("scoring_config", { ...version.scoring_config, metrics: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} placeholder="accuracy, mean_rt, interference" /></label>
                  <label><FieldLabel>Precision target</FieldLabel><SelectField value={String(version.timing_config.precision_target || "millisecond")} onChange={(event) => updateVersion("timing_config", { ...version.timing_config, precision_target: event.target.value })}><option value="millisecond">Millisecond</option><option value="frame">Frame-aware (future)</option></SelectField></label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2"><Toggle checked={version.output_config.raw_trials !== false} onChange={(value) => updateVersion("output_config", { ...version.output_config, raw_trials: value })} label="Retain raw trial-level results" /><Toggle checked={version.output_config.summary !== false} onChange={(value) => updateVersion("output_config", { ...version.output_config, summary: value })} label="Calculate summary outputs" /><Toggle checked={version.timing_config.diagnostics_required !== false} onChange={(value) => updateVersion("timing_config", { ...version.timing_config, diagnostics_required: value })} label="Collect timing diagnostics" /></div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-800">Allowed participant devices</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><Toggle checked={version.device_config.desktop !== false} onChange={(value) => updateVersion("device_config", { ...version.device_config, desktop: value, laptop: value })} label="Desktop / laptop" /><Toggle checked={version.device_config.tablet !== false} onChange={(value) => updateVersion("device_config", { ...version.device_config, tablet: value })} label="Tablet" /><Toggle checked={version.device_config.phone !== false} onChange={(value) => updateVersion("device_config", { ...version.device_config, phone: value })} label="Phone" /></div></div>
              </div>
            )}
          </section>

          {/* Settings */}
          <aside className="border-t border-slate-200 bg-[#fbfdfd] p-4 lg:border-l lg:border-t-0">
            <div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-cyan-700" /><p className="text-xs font-semibold text-slate-900">Settings</p></div>

            <div className="mt-4 space-y-4">
              {selectedComponent ? (
                <ComponentSettings
                  component={selectedComponent}
                  block={selectedBlock}
                  onKey={(value) => updateComponent(selectedComponent.local_id, { component_key: value })}
                  onConfig={updateComponentConfig}
                  onRemove={() => removeComponent(selectedComponent.local_id)}
                />
              ) : selectedBlock ? (
                <>
                  <label className="block"><FieldLabel>Block name</FieldLabel><TextField value={selectedBlock.name} onChange={(event) => updateBlock(selectedBlock.local_id, { name: event.target.value })} /></label>
                  <label className="block"><FieldLabel>Block key</FieldLabel><TextField value={selectedBlock.block_key} onChange={(event) => updateBlock(selectedBlock.local_id, { block_key: event.target.value.replace(/\s+/g, "_").toLowerCase() })} /></label>
                  <label className="block"><FieldLabel>Block type</FieldLabel><SelectField value={selectedBlock.block_type} onChange={(event) => updateBlock(selectedBlock.local_id, { block_type: event.target.value as BlockType })}>{BLOCK_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</SelectField></label>
                  <label className="block"><FieldLabel>Repeat count</FieldLabel><TextField type="number" min="1" value={selectedBlock.repeat_count} onChange={(event) => updateBlock(selectedBlock.local_id, { repeat_count: Math.max(1, safeNumber(event.target.value, 1)) })} /></label>
                  {selectedBlock.block_type === "instructions" && <label className="block"><FieldLabel>Instruction screen text</FieldLabel><textarea value={String(selectedBlock.config.screen_text || "")} onChange={(event) => updateBlock(selectedBlock.local_id, { config: { ...selectedBlock.config, screen_text: event.target.value } })} rows={6} className="mt-1.5 w-full resize-none rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" /></label>}
                  {selectedBlock.block_type === "practice" && <PracticeSettings block={selectedBlock} onChange={(continue_rule) => updateBlock(selectedBlock.local_id, { continue_rule })} />}
                </>
              ) : (
                <>
                  <label className="block"><FieldLabel>Task title</FieldLabel><TextField value={task.title} onChange={(event) => updateTask({ title: event.target.value })} /></label>
                  <label className="block"><FieldLabel>Domain</FieldLabel><SelectField value={task.domain} onChange={(event) => updateTask({ domain: event.target.value })}>{DOMAINS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
                  <label className="block"><FieldLabel>Description</FieldLabel><textarea value={task.description} onChange={(event) => updateTask({ description: event.target.value })} rows={5} className="mt-1.5 w-full resize-none rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" /></label>
                </>
              )}

              <div className="border-t border-slate-200 pt-4">
                <button type="button" onClick={() => { setSelectedComponentId(""); setSelectedBlockId(""); }} className="w-full rounded-full border border-slate-300/80 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-cyan-200">Task-level settings</button>
              </div>

              <label className="block"><FieldLabel>Participant instructions</FieldLabel><textarea value={version.participant_instructions || ""} onChange={(event) => updateVersion("participant_instructions", event.target.value)} rows={5} className="mt-1.5 w-full resize-none rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" /></label>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3"><div className="flex items-start gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" /><p className="text-[11px] leading-5 text-cyan-900">Phase 1D keeps Preview execution the saved definition with high-resolution browser timing and stores timing diagnostics separately from future Pilot and Study sessions. Browser timing is measured, not assumed to equal dedicated laboratory hardware.</p></div></div>
            </div>
          </aside>
        </div>
      </section>

      {previewOpen && (
        <CognitiveRunner
          taskId={task.id}
          versionId={version.id}
          onClose={() => {
            setPreviewOpen(false);
            void load();
            onSaved?.();
          }}
        />
      )}
    </div>
  );
}

function PracticeSettings({ block, onChange }: { block: BuilderBlock; onChange: (value: Record<string, unknown>) => void }) {
  const rule = block.continue_rule || {};
  return (
    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/55 p-3 shadow-[0_5px_16px_rgba(8,145,178,0.07)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-cyan-900">Practice criteria</p>
      <div className="mt-3 space-y-3">
        <label className="block"><FieldLabel>Minimum accuracy</FieldLabel><TextField type="number" min="0" max="1" step="0.05" value={safeNumber(rule.min_accuracy, 0.8)} onChange={(event) => onChange({ ...rule, min_accuracy: Math.min(1, Math.max(0, safeNumber(event.target.value, 0.8))) })} /></label>
        <label className="block"><FieldLabel>If criterion is not met</FieldLabel><SelectField value={String(rule.on_fail || "repeat")} onChange={(event) => onChange({ ...rule, on_fail: event.target.value })}><option value="repeat">Repeat practice</option><option value="continue">Continue anyway</option><option value="show_instructions">Show instructions again</option></SelectField></label>
        <label className="block"><FieldLabel>Maximum attempts</FieldLabel><TextField type="number" min="1" value={safeNumber(rule.max_attempts, 3)} onChange={(event) => onChange({ ...rule, max_attempts: Math.max(1, safeNumber(event.target.value, 3)) })} /></label>
      </div>
    </div>
  );
}

function ComponentSettings({
  component,
  block,
  onKey,
  onConfig,
  onRemove,
}: {
  component: BuilderComponent;
  block: BuilderBlock | null;
  onKey: (value: string) => void;
  onConfig: (key: string, value: unknown) => void;
  onRemove: () => void;
}) {
  const config = component.config;
  const type = component.component_type;
  const item = COMPONENTS.find((candidate) => candidate.type === type);
  const Icon = item?.icon || Settings2;

  return (
    <>
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-700 text-white"><Icon className="h-4 w-4" /></span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Configure step</p>
              <p className="mt-0.5 text-sm font-semibold text-cyan-950">{item?.label || type}</p>
            </div>
          </div>
          <button type="button" onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500" title="Remove this step"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {type === "response" ? (
        <ResponseSettings component={component} block={block} onConfig={onConfig} />
      ) : (
        <>
          <label className="block"><FieldLabel>Step name</FieldLabel><TextField value={component.component_key} onChange={(event) => onKey(event.target.value.replace(/\s+/g, "_").toLowerCase())} /></label>
          {type === "fixation" && <><label className="block"><FieldLabel>Fixation symbol</FieldLabel><TextField value={String(config.symbol || "+")} onChange={(event) => onConfig("symbol", event.target.value)} /></label><Duration config={config} onConfig={onConfig} /></>}
          {type === "text" && <><label className="block"><FieldLabel>Text shown if no trial variable is used</FieldLabel><TextField value={String(config.content || "")} onChange={(event) => onConfig("content", event.target.value)} /></label><label className="block"><FieldLabel>Read text from trial column</FieldLabel><TextField value={String(config.content_variable || "stimulus")} onChange={(event) => onConfig("content_variable", event.target.value)} placeholder="stimulus" /></label><label className="block"><FieldLabel>Read colour from trial column</FieldLabel><TextField value={String(config.color_variable || "")} onChange={(event) => onConfig("color_variable", event.target.value)} placeholder="optional" /></label><label className="block"><FieldLabel>Font size (px)</FieldLabel><TextField type="number" min="8" value={safeNumber(config.font_size_px, 48)} onChange={(event) => onConfig("font_size_px", safeNumber(event.target.value, 48))} /></label><Duration config={config} onConfig={onConfig} /><Toggle checked={config.end_on_response === true} onChange={(value) => onConfig("end_on_response", value)} label="Hide stimulus when a response arrives" /></>}
          {(type === "image" || type === "audio" || type === "video") && <><label className="block"><FieldLabel>Read asset from trial column</FieldLabel><TextField value={String(config.asset_variable || type)} onChange={(event) => onConfig("asset_variable", event.target.value)} /></label><label className="block"><FieldLabel>Fallback asset URL</FieldLabel><TextField value={String(config.asset_url || "")} onChange={(event) => onConfig("asset_url", event.target.value)} placeholder="https://…" /></label><Duration config={config} onConfig={onConfig} /></>}
          {type === "shape" && <><label className="block"><FieldLabel>Shape</FieldLabel><SelectField value={String(config.shape || "circle")} onChange={(event) => onConfig("shape", event.target.value)}><option value="circle">Circle</option><option value="square">Square</option><option value="rectangle">Rectangle</option></SelectField></label><label className="block"><FieldLabel>Colour</FieldLabel><TextField value={String(config.color || "#0f172a")} onChange={(event) => onConfig("color", event.target.value)} /></label><label className="block"><FieldLabel>Size (px)</FieldLabel><TextField type="number" min="1" value={safeNumber(config.size_px, 70)} onChange={(event) => onConfig("size_px", safeNumber(event.target.value, 70))} /></label><Duration config={config} onConfig={onConfig} /></>}
          {type === "iti" && <><label className="block"><FieldLabel>Shortest interval (ms)</FieldLabel><TextField type="number" min="0" value={safeNumber(config.min_ms, 500)} onChange={(event) => onConfig("min_ms", safeNumber(event.target.value, 500))} /></label><label className="block"><FieldLabel>Longest interval (ms)</FieldLabel><TextField type="number" min="0" value={safeNumber(config.max_ms, 1000)} onChange={(event) => onConfig("max_ms", safeNumber(event.target.value, 1000))} /></label><label className="block"><FieldLabel>Timing</FieldLabel><SelectField value={String(config.distribution || "uniform")} onChange={(event) => onConfig("distribution", event.target.value)}><option value="uniform">Random between min and max</option><option value="fixed">Fixed interval</option></SelectField></label></>}
          {type === "html" && <label className="block"><FieldLabel>HTML content</FieldLabel><textarea value={String(config.html || "")} onChange={(event) => onConfig("html", event.target.value)} rows={8} className="mt-1.5 w-full resize-none rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 font-mono text-xs shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" /></label>}
        </>
      )}
    </>
  );
}

function ResponseSettings({
  component,
  block,
  onConfig,
}: {
  component: BuilderComponent;
  block: BuilderBlock | null;
  onConfig: (key: string, value: unknown) => void;
}) {
  const config = component.config;
  const [newResponse, setNewResponse] = useState("");
  const [newAdditionalResponse, setNewAdditionalResponse] = useState("");
  const manualResponses = Array.isArray(config.allowed_responses) ? uniqueResponseKeys(config.allowed_responses) : [];
  const additionalResponses = Array.isArray(config.additional_responses) ? uniqueResponseKeys(config.additional_responses) : [];
  const variables = Array.from(new Set((block?.trials || []).flatMap((trial) => Object.keys(trial.variables || {}))));
  const anchorOptions = (block?.components || []).filter((candidate) => candidate.local_id !== component.local_id && ["text", "image", "audio", "video", "shape", "fixation"].includes(candidate.component_type));
  const correctVariable = String(config.correct_variable || "");
  const answerMode = correctVariable ? "variable" : "fixed";
  const input = String(config.input || "keyboard");

  const automaticResponses = useMemo(() => {
    if (!block || !correctVariable) return [];
    return trialResponseKeys(block, correctVariable);
  }, [block, correctVariable]);

  const hasNoResponseRows = useMemo(() => {
    if (!block || !correctVariable) return false;
    return block.trials.some((trial) => {
      const key = Object.keys(trial.variables || {}).find((candidate) => candidate.toLowerCase() === correctVariable.toLowerCase());
      return !!key && String(trial.variables[key] ?? "").trim() === "";
    });
  }, [block, correctVariable]);

  function addManualResponse(value = newResponse) {
    const next = normalizeResponseKey(value);
    if (!next || manualResponses.includes(next)) return;
    onConfig("allowed_responses", [...manualResponses, next]);
    setNewResponse("");
  }

  function removeManualResponse(value: string) {
    onConfig("allowed_responses", manualResponses.filter((response) => response !== value));
  }

  function addAdditionalResponse(value = newAdditionalResponse) {
    const next = normalizeResponseKey(value);
    if (!next || automaticResponses.includes(next) || additionalResponses.includes(next)) return;
    onConfig("additional_responses", [...additionalResponses, next]);
    setNewAdditionalResponse("");
  }

  function removeAdditionalResponse(value: string) {
    onConfig("additional_responses", additionalResponses.filter((response) => response !== value));
  }

  function chooseTrialTableMode() {
    const preferred = variables.includes("correct") ? "correct" : (variables[0] || "correct");
    onConfig("correct_variable", preferred);
    onConfig("correct_value", "");
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>How does the participant respond?</FieldLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            ["keyboard", "Keyboard"],
            ["touch", "On-screen buttons"],
            ["mouse", "Mouse / click"],
            ["none", "No response input"],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => onConfig("input", value)} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${input === value ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200"}`}>{label}</button>
          ))}
        </div>
      </div>

      {input !== "none" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <FieldLabel>How should PsyLattice know the correct answer?</FieldLabel>
          <p className="mt-1 text-[10px] leading-4 text-slate-400">For most cognitive tasks, choose Trial table. Each trial row can then define its own correct response.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={chooseTrialTableMode} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${answerMode === "variable" ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-600"}`}>Trial table</button>
            <button type="button" onClick={() => { onConfig("correct_variable", ""); if (!Object.prototype.hasOwnProperty.call(config, "correct_value")) onConfig("correct_value", manualResponses[0] || ""); }} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${answerMode === "fixed" ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-600"}`}>Same every trial</button>
          </div>

          {answerMode === "variable" ? (
            <div className="mt-3">
              <label className="block">
                <FieldLabel>Column containing the correct response</FieldLabel>
                <SelectField value={correctVariable || "correct"} onChange={(event) => onConfig("correct_variable", event.target.value)}>
                  {variables.length === 0 ? <option value="correct">correct</option> : variables.map((variable) => <option key={variable} value={variable}>{variable}</option>)}
                </SelectField>
              </label>
              <div className="mt-3 rounded-xl border border-cyan-200/80 bg-cyan-50/60 p-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-cyan-900"><Check className="h-3.5 w-3.5" /> Response keys update automatically</div>
                <p className="mt-1 text-[10px] leading-4 text-cyan-800">PsyLattice reads the unique responses in <strong>{correctVariable || "correct"}</strong>. Change the Trial Table and the accepted keys change with it when you save.</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {automaticResponses.map((response) => <span key={response} className="rounded-lg border border-cyan-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-cyan-950">{response === "space" ? "SPACE" : response.toUpperCase()}</span>)}
                  {hasNoResponseRows && <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-cyan-900">NO RESPONSE</span>}
                  {automaticResponses.length === 0 && !hasNoResponseRows && <span className="text-[10px] text-cyan-800">Add values to this Trial Table column.</span>}
                </div>
                {hasNoResponseRows && <p className="mt-2 text-[10px] leading-4 text-slate-600">A blank cell in the correct-response column means the participant should withhold their response for that trial.</p>}
              </div>

              <details className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <summary className="cursor-pointer text-[10px] font-semibold text-slate-500">Advanced: accept an additional key</summary>
                <p className="mt-2 text-[10px] leading-4 text-slate-400">Usually unnecessary. Use this only if a valid response key is never the correct answer in any Trial Table row.</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {additionalResponses.map((response) => (
                    <span key={response} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700">
                      {response === "space" ? "SPACE" : response.toUpperCase()}
                      <button type="button" onClick={() => removeAdditionalResponse(response)} className="text-slate-300 hover:text-red-500"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input value={newAdditionalResponse} onChange={(event) => setNewAdditionalResponse(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addAdditionalResponse(); } }} placeholder="e.g. k" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-cyan-400" />
                  <button type="button" onClick={() => addAdditionalResponse()} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Add</button>
                </div>
              </details>
            </div>
          ) : (
            <div className="mt-3">
              <FieldLabel>{input === "keyboard" ? "Response keys" : "Response choices"}</FieldLabel>
              <p className="mt-1 text-[10px] leading-4 text-slate-400">Add the responses participants are allowed to make.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {manualResponses.map((response) => (
                  <span key={response} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700">
                    {response === "space" ? "SPACE" : response.toUpperCase()}
                    <button type="button" onClick={() => removeManualResponse(response)} className="text-slate-300 hover:text-red-500"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {manualResponses.length === 0 && <span className="text-[10px] text-slate-400">No response keys added yet.</span>}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={newResponse} onChange={(event) => setNewResponse(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addManualResponse(); } }} placeholder={input === "keyboard" ? "e.g. f, j, space" : "e.g. left"} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-cyan-400" />
                <button type="button" onClick={() => addManualResponse()} className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Add</button>
              </div>
              {input === "keyboard" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[["space", "Space"], ["f", "F"], ["j", "J"], ["arrowleft", "←"], ["arrowright", "→"]].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => addManualResponse(value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-500 hover:border-cyan-200 hover:text-cyan-800">+ {label}</button>
                  ))}
                </div>
              )}
              <label className="mt-3 block">
                <FieldLabel>Correct response</FieldLabel>
                <SelectField value={String(config.correct_value ?? "")} onChange={(event) => onConfig("correct_value", event.target.value)}>
                  <option value="">No response / withhold is correct</option>
                  {manualResponses.map((response) => <option key={response} value={response}>{response === "space" ? "Space" : response.toUpperCase()}</option>)}
                </SelectField>
              </label>
            </div>
          )}
        </div>
      )}

      <label className="block">
        <FieldLabel>Start reaction time from</FieldLabel>
        <SelectField value={String(config.rt_anchor || anchorOptions[0]?.component_key || "stimulus")} onChange={(event) => onConfig("rt_anchor", event.target.value)}>
          {anchorOptions.length === 0 ? <option value="stimulus">Stimulus onset</option> : anchorOptions.map((candidate) => <option key={candidate.local_id} value={candidate.component_key}>{COMPONENTS.find((item) => item.type === candidate.component_type)?.label || candidate.component_type} · {candidate.component_key}</option>)}
        </SelectField>
      </label>

      <label className="block"><FieldLabel>Maximum response time</FieldLabel><div className="mt-1.5 flex items-center gap-2"><input type="number" min="0" value={safeNumber(config.deadline_ms, 1500)} onChange={(event) => onConfig("deadline_ms", safeNumber(event.target.value, 1500))} className="w-full rounded-[18px] border border-slate-300/80 bg-white px-3 py-2.5 text-sm shadow-[0_4px_14px_rgba(15,23,42,0.05)] outline-none focus:border-cyan-300" /><span className="text-xs font-medium text-slate-400">ms</span></div></label>
      <Toggle checked={config.end_trial_on_response === true} onChange={(value) => onConfig("end_trial_on_response", value)} label="Move on immediately after a valid response" />
      <details className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <summary className="cursor-pointer text-[10px] font-semibold text-slate-500">Advanced: internal response-step name</summary>
        <div className="mt-2"><TextField value={component.component_key} readOnly /></div>
      </details>
    </div>
  );
}

function Duration({ config, onConfig }: { config: Record<string, unknown>; onConfig: (key: string, value: unknown) => void }) {
  return <label className="block"><FieldLabel>Duration (ms)</FieldLabel><TextField type="number" min="0" value={safeNumber(config.duration_ms, 500)} onChange={(event) => onConfig("duration_ms", safeNumber(event.target.value, 500))} /></label>;
}
