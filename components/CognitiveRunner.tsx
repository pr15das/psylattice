"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Expand,
  Gauge,
  Keyboard,
  Loader2,
  Monitor,
  Play,
  RotateCcw,
  TimerReset,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  buildStopSignalSummary,
  isStopSignalRuntime,
  nextStopSignalSsd,
  planStopSignalTrials,
  stopSignalSettingsFromTaskConfig,
  type StopSignalSettings,
} from "@/lib/research/stopSignal";
import {
  CORSI_STANDARD_LAYOUT,
  buildCorsiSummary,
  corsiErrorPositions,
  corsiModes,
  corsiSettingsFromTaskConfig,
  expectedCorsiSequence,
  generateCorsiSequence,
  isCorsiRuntime,
  type CorsiSettings,
} from "@/lib/research/corsi";
import {
  CARD_SORT_REFERENCE_CARDS,
  buildCardSortSummary,
  cardSortRuleSequence,
  cardSortSettingsFromTaskConfig,
  correctReferenceForRule,
  generateCardSortTarget,
  inferredRuleFromChoice,
  isCardSortRuntime,
  nextCardSortRule,
  type CardSortCard,
  type CardSortRule,
  type CardSortSettings,
  type CardSortTarget,
} from "@/lib/research/cardSorting";

type TaskRow = {
  id: string;
  title: string;
  description: string;
};

type VersionRow = {
  id: string;
  task_id: string;
  version_label: string;
  status: string;
  runtime_engine: string;
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

type RunnerComponent = {
  id: string;
  component_key: string;
  component_type: ComponentType;
  position: number;
  config: Record<string, unknown>;
};

type RunnerTrial = {
  id: string;
  position: number;
  condition_label: string;
  variables: Record<string, string>;
  weight: number;
  enabled: boolean;
};

type RunnerBlock = {
  id: string;
  block_key: string;
  name: string;
  block_type: "instructions" | "practice" | "experimental" | "break" | "end" | "custom";
  position: number;
  repeat_count: number;
  continue_rule: Record<string, unknown>;
  config: Record<string, unknown>;
  components: RunnerComponent[];
  trials: RunnerTrial[];
};

type Preflight = {
  refresh_hz: number | null;
  frame_interval_ms: number | null;
  refresh_samples: number;
  refresh_stability: number | null;
  refresh_jitter_ms: number | null;
  assets_total: number;
  assets_loaded: number;
  assets_failed: string[];
  timing_api: boolean;
  animation_frame: boolean;
  visibility_ok: boolean;
  device_class: "desktop" | "tablet" | "phone";
};

type ComponentTiming = {
  key: string;
  type: string;
  requested_ms: number | null;
  requested_frames: number | null;
  target_frame_ms: number | null;
  timing_mode: "frame" | "timer";
  frame_interval_ms: number | null;
  actual_frames: number | null;
  actual_ms: number;
  started_at_ms: number;
  ended_at_ms: number;
};

type PreviewTrialResult = {
  block_key: string;
  block_type: string;
  block_attempt: number;
  block_repeat: number;
  trial_index: number;
  source_trial_id: string;
  source_trial_position: number;
  condition_label: string;
  variables: Record<string, string>;
  response: string | null;
  correct_response: string | null;
  correct: boolean | null;
  reaction_time_ms: number | null;
  response_timestamp_ms: number | null;
  anchor_timestamp_ms: number | null;
  component_timings: ComponentTiming[];
  runtime_data?: Record<string, unknown>;
};

type RunnerPhase = "preflight" | "running" | "complete" | "error";

type DisplayState =
  | { kind: "blank" }
  | { kind: "message"; title: string; text: string; actionLabel?: string }
  | { kind: "fixation"; symbol: string }
  | { kind: "text"; text: string; color: string; fontSize: number; fontWeight: number; fontFamily: string }
  | { kind: "image"; url: string }
  | { kind: "audio"; url: string }
  | { kind: "video"; url: string }
  | { kind: "shape"; shape: string; color: string; size: number }
  | { kind: "html"; html: string }
  | {
      kind: "corsi";
      blocks: Array<{ id: number; x: number; y: number }>;
      activeBlockId: number | null;
      interactive: boolean;
      prompt: string;
      responseCount: number;
      responseTarget: number;
      mode: "forward" | "backward";
    }
  | {
      kind: "card_sort";
      target: CardSortTarget;
      references: CardSortCard[];
      interactive: boolean;
      selectedReferenceId: number | null;
      feedback: "correct" | "incorrect" | null;
      trialNumber: number;
      maxTrials: number;
      categoriesCompleted: number;
    };

function numeric(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeKey(key: string) {
  const lowered = key.toLowerCase();
  if (key === " ") return "space";
  if (lowered === "spacebar") return "space";
  return lowered;
}

function normalizedUniqueKeys(values: unknown[]) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeKey(String(value ?? "").trim()))
        .filter(Boolean)
    )
  );
}

type CorrectResponseSpec = {
  hasCriterion: boolean;
  expected: string | null;
  noResponseIsCorrect: boolean;
  source: string | null;
};

function findTrialVariable(variables: Record<string, string>, requestedKey: string) {
  const key = requestedKey.trim();
  if (!key) return null;
  const exact = Object.keys(variables).find((candidate) => candidate === key);
  const matched = exact || Object.keys(variables).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
  if (!matched) return null;
  return { key: matched, value: variables[matched] ?? "" };
}

function resolveCorrectResponse(config: Record<string, unknown>, variables: Record<string, string>): CorrectResponseSpec {
  const configuredVariable = text(config.correct_variable, "").trim();
  const fallbackVariables = ["correct", "correct_response", "correct_key", "response_key", "answer_key"];
  const candidateVariables = configuredVariable
    ? [configuredVariable, ...fallbackVariables.filter((key) => key.toLowerCase() !== configuredVariable.toLowerCase())]
    : fallbackVariables;

  // Presence matters here. In Go/No-Go and N-back, a present but blank correct
  // cell intentionally means that withholding a response is the correct action.
  for (const variable of candidateVariables) {
    const found = findTrialVariable(variables, variable);
    if (!found) continue;
    const value = found.value.trim();
    return {
      hasCriterion: true,
      expected: value ? normalizeKey(value) : null,
      noResponseIsCorrect: !value,
      source: found.key,
    };
  }

  if (Object.prototype.hasOwnProperty.call(config, "correct_value")) {
    const configuredCorrect = text(config.correct_value, "").trim();
    return {
      hasCriterion: true,
      expected: configuredCorrect ? normalizeKey(configuredCorrect) : null,
      noResponseIsCorrect: !configuredCorrect,
      source: "fixed",
    };
  }

  return { hasCriterion: false, expected: null, noResponseIsCorrect: false, source: null };
}

function resolveVariable(variables: Record<string, string>, key: unknown, fallback = "") {
  const variable = text(key).trim();
  if (!variable) return fallback;
  return variables[variable] ?? fallback;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, Math.max(0, ms)));
}

function nextAnimationFrame() {
  return new Promise<number>((resolve) => window.requestAnimationFrame(resolve));
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

function round(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function seedHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seedText: string) {
  let state = seedHash(seedText) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random = Math.random) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function expandedTrials(trials: RunnerTrial[]) {
  const output: RunnerTrial[] = [];
  for (const trial of trials.filter((item) => item.enabled !== false && item.weight > 0)) {
    const copies = Math.max(1, Math.round(trial.weight));
    for (let copy = 0; copy < copies; copy += 1) output.push(trial);
  }
  return output;
}

function pseudoShuffle(trials: RunnerTrial[], maxSame: number, random: () => number) {
  if (maxSame < 1 || trials.length < 3) return shuffle(trials, random);
  let best = shuffle(trials, random);
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const candidate = shuffle(trials, random);
    let run = 1;
    let valid = true;
    for (let index = 1; index < candidate.length; index += 1) {
      if ((candidate[index].condition_label || "") === (candidate[index - 1].condition_label || "")) {
        run += 1;
        if (run > maxSame) {
          valid = false;
          break;
        }
      } else {
        run = 1;
      }
    }
    best = candidate;
    if (valid) return candidate;
  }
  return best;
}

function orderedTrials(block: RunnerBlock, config: Record<string, unknown>, runSeed: string) {
  const pool = expandedTrials(block.trials);
  const mode = text(config.trial_order, "random");
  const seedMode = text(config.seed_mode, "automatic");
  const seed = seedMode === "fixed" ? text(config.seed, "psylattice-1") : runSeed;
  const random = seededRandom(`${seed}:${block.block_key}`);
  if (mode === "sequential") return pool;
  if (mode === "pseudorandom") {
    return pseudoShuffle(pool, Math.max(1, numeric(config.max_same_condition_consecutive, 3)), random);
  }
  return shuffle(pool, random);
}

function collectAssetUrls(blocks: RunnerBlock[]) {
  const urls = new Set<string>();
  for (const block of blocks) {
    for (const component of block.components) {
      if (!["image", "audio", "video"].includes(component.component_type)) continue;
      const direct = text(component.config.asset_url).trim();
      if (direct) urls.add(direct);
      const variable = text(component.config.asset_variable).trim();
      if (variable) {
        for (const trial of block.trials) {
          const candidate = trial.variables[variable]?.trim();
          if (candidate) urls.add(candidate);
        }
      }
    }
  }
  return Array.from(urls);
}

async function preloadAsset(url: string) {
  return new Promise<void>((resolve, reject) => {
    const lower = url.toLowerCase();
    const timeout = window.setTimeout(() => reject(new Error("Asset preload timeout")), 12000);
    const finish = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    const fail = () => {
      window.clearTimeout(timeout);
      reject(new Error("Asset failed to preload"));
    };
    if (/\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(lower)) {
      const image = new Image();
      image.onload = finish;
      image.onerror = fail;
      image.src = url;
      return;
    }
    const media = document.createElement(/\.(mp4|webm|mov)(\?|#|$)/i.test(lower) ? "video" : "audio");
    media.preload = "auto";
    media.oncanplaythrough = finish;
    media.onerror = fail;
    media.src = url;
    media.load();
  });
}

async function estimateRefreshRate(sampleCount = 90) {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    return { refresh_hz: null, frame_interval_ms: null, refresh_samples: 0, refresh_stability: null, refresh_jitter_ms: null };
  }

  // Give the browser a couple of frames to settle before measuring. This is
  // especially useful immediately after entering fullscreen.
  await nextAnimationFrame();
  await nextAnimationFrame();

  const stamps: number[] = [];
  await new Promise<void>((resolve) => {
    const step = (stamp: number) => {
      stamps.push(stamp);
      if (stamps.length >= Math.max(30, sampleCount)) resolve();
      else window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  });

  const intervals = stamps
    .slice(1)
    .map((stamp, index) => stamp - stamps[index])
    .filter((value) => value > 1 && value < 50);

  const med = median(intervals);
  if (!med) {
    return { refresh_hz: null, frame_interval_ms: null, refresh_samples: intervals.length, refresh_stability: null, refresh_jitter_ms: null };
  }

  const deviations = intervals.map((value) => Math.abs(value - med));
  const jitter = median(deviations);
  const stableCount = intervals.filter((value) => Math.abs(value - med) <= Math.max(0.75, med * 0.12)).length;
  const stability = intervals.length ? stableCount / intervals.length : null;

  return {
    refresh_hz: round(1000 / med, 1),
    frame_interval_ms: round(med, 3),
    refresh_samples: intervals.length,
    refresh_stability: stability === null ? null : round(stability, 3),
    refresh_jitter_ms: round(jitter, 3),
  };
}

function deviceClass(): Preflight["device_class"] {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "desktop";

  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  const touchPoints = navigator.maxTouchPoints || 0;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  const coarsePointer =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  // Do not infer "tablet" from screen height alone. Smaller MacBook displays,
  // browser zoom and scaled desktop displays can all have a short side < 1024.
  const isiPad =
    ua.includes("ipad") ||
    (platform === "macintel" && touchPoints > 1);

  const isAndroid = ua.includes("android");
  const isAndroidPhone = isAndroid && ua.includes("mobile");
  const isOtherPhone =
    /iphone|ipod|windows phone|blackberry|bb10|opera mini/.test(ua);

  if (
    isAndroidPhone ||
    isOtherPhone ||
    (coarsePointer && touchPoints > 0 && shortSide < 600)
  ) {
    return "phone";
  }

  const isTablet =
    isiPad ||
    (isAndroid && !ua.includes("mobile")) ||
    /tablet|kindle|silk|playbook/.test(ua) ||
    (coarsePointer && touchPoints > 1 && shortSide >= 600 && shortSide < 1024);

  if (isTablet) return "tablet";

  // Conventional desktop/laptop browsers stay desktop regardless of physical
  // screen height. This includes Safari on smaller MacBook displays.
  return "desktop";
}

function buildSummary(results: PreviewTrialResult[]) {
  const scorable = results.filter((result) => result.correct !== null);
  const correctCount = scorable.filter((result) => result.correct === true).length;
  const rtValues = results
    .map((result) => result.reaction_time_ms)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const byCondition: Record<string, { trials: number; accuracy: number | null; mean_rt_ms: number | null }> = {};
  const conditions = Array.from(new Set(results.map((result) => result.condition_label || "unlabelled")));
  for (const condition of conditions) {
    const rows = results.filter((result) => (result.condition_label || "unlabelled") === condition);
    const scored = rows.filter((row) => row.correct !== null);
    const rts = rows.map((row) => row.reaction_time_ms).filter((value): value is number => value !== null);
    byCondition[condition] = {
      trials: rows.length,
      accuracy: scored.length ? round(scored.filter((row) => row.correct).length / scored.length, 4) : null,
      mean_rt_ms: round(mean(rts), 2),
    };
  }
  return {
    trials: results.length,
    response_observations: results.filter((result) => result.response !== null).length,
    scorable_trials: scorable.length,
    unscorable_trials: results.length - scorable.length,
    correct_trials: correctCount,
    accuracy: scorable.length ? round(correctCount / scorable.length, 4) : null,
    mean_rt_ms: round(mean(rtValues), 2),
    median_rt_ms: round(median(rtValues), 2),
    rt_observations: rtValues.length,
    conditions: byCondition,
  };
}

function BrowserBadge({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${ok ? "border-cyan-200 bg-cyan-50 text-cyan-900 shadow-[0_8px_20px_rgba(8,145,178,0.08)]" : "border-violet-200 bg-violet-50 text-violet-900 shadow-[0_8px_20px_rgba(124,58,237,0.08)]"}`}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {children}
    </div>
  );
}

export default function CognitiveRunner_PHASE_1C_BROWSER_PREVIEW({
  taskId,
  versionId,
  onClose,
}: {
  taskId: string;
  versionId: string;
  onClose: () => void;
}) {
  const [task, setTask] = useState<TaskRow | null>(null);
  const [version, setVersion] = useState<VersionRow | null>(null);
  const [blocks, setBlocks] = useState<RunnerBlock[]>([]);
  const [phase, setPhase] = useState<RunnerPhase>("preflight");
  const [loading, setLoading] = useState(true);
  const [preflight, setPreflight] = useState<Preflight>({
    refresh_hz: null,
    frame_interval_ms: null,
    refresh_samples: 0,
    refresh_stability: null,
    refresh_jitter_ms: null,
    assets_total: 0,
    assets_loaded: 0,
    assets_failed: [],
    timing_api: typeof performance !== "undefined" && typeof performance.now === "function",
    animation_frame: typeof window !== "undefined" && typeof window.requestAnimationFrame === "function",
    visibility_ok: typeof document === "undefined" ? true : !document.hidden,
    device_class: deviceClass(),
  });
  const [display, setDisplay] = useState<DisplayState>({ kind: "blank" });
  const [responseOptions, setResponseOptions] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, block: "" });
  const [results, setResults] = useState<PreviewTrialResult[]>([]);
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [savingResults, setSavingResults] = useState(false);
  const [visibilityInterruptions, setVisibilityInterruptions] = useState(0);
  const [refreshMode, setRefreshMode] = useState<"auto" | "override">("auto");
  const [refreshOverrideHz, setRefreshOverrideHz] = useState(60);
  const [calibratingRefresh, setCalibratingRefresh] = useState(false);
  const cancelledRef = useRef(false);
  const responseHandlerRef = useRef<((value: string, eventTime: number) => void) | null>(null);
  const continueRef = useRef<(() => void) | null>(null);
  const corsiTapHandlerRef = useRef<((blockId: number, eventTime: number) => void) | null>(null);
  const corsiResponseResolveRef = useRef<(() => void) | null>(null);
  const cardSortChoiceHandlerRef = useRef<((referenceId: number, eventTime: number) => void) | null>(null);
  const cardSortResponseResolveRef = useRef<(() => void) | null>(null);

  const loadDefinition = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const [taskResult, versionResult, blockResult] = await Promise.all([
      supabase.from("cognitive_tasks").select("id,title,description").eq("id", taskId).single(),
      supabase
        .from("cognitive_task_versions")
        .select("id,task_id,version_label,status,runtime_engine,participant_instructions,task_config,randomization_config,scoring_config,timing_config,output_config,device_config")
        .eq("id", versionId)
        .eq("task_id", taskId)
        .single(),
      supabase
        .from("cognitive_task_blocks")
        .select("id,block_key,name,block_type,position,repeat_count,continue_rule,config")
        .eq("version_id", versionId)
        .order("position", { ascending: true }),
    ]);

    if (taskResult.error || versionResult.error || blockResult.error || !taskResult.data || !versionResult.data) {
      setError(taskResult.error?.message || versionResult.error?.message || blockResult.error?.message || "Preview definition could not be loaded.");
      setPhase("error");
      setLoading(false);
      return;
    }

    const blockRows = blockResult.data || [];
    const blockIds = blockRows.map((row) => row.id);
    let componentRows: any[] = [];
    let trialRows: any[] = [];
    if (blockIds.length) {
      const [componentsResult, trialsResult] = await Promise.all([
        supabase.from("cognitive_task_components").select("id,block_id,component_key,component_type,position,config").in("block_id", blockIds).order("position", { ascending: true }),
        supabase.from("cognitive_task_trial_rows").select("id,block_id,position,condition_label,variables,weight,enabled").in("block_id", blockIds).order("position", { ascending: true }),
      ]);
      if (componentsResult.error || trialsResult.error) {
        setError(componentsResult.error?.message || trialsResult.error?.message || "Preview structure could not be loaded.");
        setPhase("error");
        setLoading(false);
        return;
      }
      componentRows = componentsResult.data || [];
      trialRows = trialsResult.data || [];
    }

    const nextBlocks: RunnerBlock[] = blockRows.map((row) => ({
      id: row.id,
      block_key: row.block_key,
      name: row.name,
      block_type: row.block_type,
      position: row.position,
      repeat_count: Math.max(1, Number(row.repeat_count || 1)),
      continue_rule: (row.continue_rule || {}) as Record<string, unknown>,
      config: (row.config || {}) as Record<string, unknown>,
      components: componentRows
        .filter((component) => component.block_id === row.id)
        .map((component) => ({
          id: component.id,
          component_key: component.component_key,
          component_type: component.component_type as ComponentType,
          position: component.position,
          config: (component.config || {}) as Record<string, unknown>,
        })),
      trials: trialRows
        .filter((trial) => trial.block_id === row.id)
        .map((trial) => ({
          id: trial.id,
          position: trial.position,
          condition_label: trial.condition_label || "",
          variables: Object.fromEntries(Object.entries(trial.variables || {}).map(([key, value]) => [key, String(value ?? "")])),
          weight: Number(trial.weight ?? 1),
          enabled: trial.enabled !== false,
        })),
    }));

    setTask(taskResult.data as TaskRow);
    setVersion(versionResult.data as VersionRow);
    setBlocks(nextBlocks);

    const assetUrls = collectAssetUrls(nextBlocks);
    setPreflight((current) => ({ ...current, assets_total: assetUrls.length, assets_loaded: 0, assets_failed: [] }));
    let loaded = 0;
    const failed: string[] = [];
    await Promise.all(
      assetUrls.map(async (url) => {
        try {
          await preloadAsset(url);
          loaded += 1;
          setPreflight((current) => ({ ...current, assets_loaded: loaded }));
        } catch {
          failed.push(url);
        }
      })
    );
    const refresh = await estimateRefreshRate();
    setPreflight((current) => ({
      ...current,
      ...refresh,
      assets_loaded: loaded,
      assets_failed: failed,
      visibility_ok: !document.hidden,
      device_class: deviceClass(),
    }));
    setLoading(false);
  }, [taskId, versionId]);

  useEffect(() => {
    void loadDefinition();
  }, [loadDefinition]);

  useEffect(() => {
    const onVisibility = () => {
      setPreflight((current) => ({ ...current, visibility_ok: !document.hidden }));
      if (phase === "running" && document.hidden) setVisibilityInterruptions((current) => current + 1);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (phase !== "running") return;
      if (event.key === "Escape") return;
      const normalized = normalizeKey(event.key);
      responseHandlerRef.current?.(normalized, performance.now());
      if (normalized === "enter" || normalized === "space") continueRef.current?.();
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [phase]);

  const effectiveRefreshHz = useMemo(() => {
    if (refreshMode === "override" && Number.isFinite(refreshOverrideHz) && refreshOverrideHz > 0) return refreshOverrideHz;
    return preflight.refresh_hz;
  }, [preflight.refresh_hz, refreshMode, refreshOverrideHz]);

  const effectiveFrameIntervalMs = useMemo(() => {
    if (effectiveRefreshHz && effectiveRefreshHz > 0) return 1000 / effectiveRefreshHz;
    return preflight.frame_interval_ms;
  }, [effectiveRefreshHz, preflight.frame_interval_ms]);

  const refreshStable = preflight.refresh_stability === null ? null : preflight.refresh_stability >= 0.9;

  const calibrateRefresh = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    setCalibratingRefresh(true);
    try {
      const refresh = await estimateRefreshRate();
      setPreflight((current) => ({ ...current, ...refresh, visibility_ok: !document.hidden }));
    } finally {
      setCalibratingRefresh(false);
    }
  }, []);

  const deviceAllowed = useMemo(() => {
    if (!version) return true;
    const config = version.device_config || {};
    if (preflight.device_class === "phone") return config.phone !== false;
    if (preflight.device_class === "tablet") return config.tablet !== false;

    // The browser runner groups laptops and desktop computers into one class.
    // Allow that class when either desktop OR laptop support is enabled.
    return config.desktop !== false || config.laptop !== false;
  }, [preflight.device_class, version]);

  const stopSignalRuntime = !!version && isStopSignalRuntime(version.runtime_engine, version.task_config);
  const stopSignalSettings = useMemo(
    () => stopSignalSettingsFromTaskConfig(version?.task_config),
    [version?.task_config]
  );
  const corsiRuntime = !!version && isCorsiRuntime(version.runtime_engine, version.task_config);
  const corsiSettings = useMemo(
    () => corsiSettingsFromTaskConfig(version?.task_config),
    [version?.task_config]
  );
  const cardSortRuntime =
    !!version && isCardSortRuntime(version.runtime_engine, version.task_config);
  const cardSortSettings = useMemo(
    () => cardSortSettingsFromTaskConfig(version?.task_config),
    [version?.task_config]
  );

  const canStart = !loading && !!task && !!version && blocks.length > 0 && preflight.timing_api && preflight.animation_frame && deviceAllowed;

  async function requestFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      await calibrateRefresh();
    } catch {
      // Fullscreen is optional; browser/user policy may reject it.
    }
  }

  function waitForContinue() {
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        continueRef.current = null;
        resolve();
      };
      continueRef.current = finish;
    });
  }

  async function showMessage(title: string, message: string, actionLabel = "Continue") {
    setResponseOptions([]);
    setDisplay({ kind: "message", title, text: message, actionLabel });
    await waitForContinue();
    setDisplay({ kind: "blank" });
  }

  async function runTimedDisplay(
    state: DisplayState,
    requestedMs: number,
    key: string,
    type: string,
    earlyPromise?: Promise<void>,
    onVisualOnset?: (timestamp: number) => void
  ) {
    setDisplay(state);
    const frameStamp = await nextAnimationFrame();
    const start = Number.isFinite(frameStamp) ? frameStamp : performance.now();
    onVisualOnset?.(start);

    // Visual presentation is quantized to whole display frames whenever a
    // usable refresh calibration is available. Audio/video and response
    // deadlines keep their own timer-based logic elsewhere in the runner.
    const interval = effectiveFrameIntervalMs && effectiveFrameIntervalMs > 0 ? effectiveFrameIntervalMs : null;
    const requestedFrames = interval ? Math.max(1, Math.round(requestedMs / interval)) : null;
    const targetFrameMs = interval && requestedFrames ? requestedFrames * interval : null;
    let actualFrames: number | null = null;

    if (requestedFrames && interval) {
      let earlyDone = false;
      if (earlyPromise) void earlyPromise.then(() => { earlyDone = true; });

      actualFrames = 0;
      while (actualFrames < requestedFrames && !earlyDone) {
        await nextAnimationFrame();
        actualFrames += 1;
      }
    } else if (earlyPromise) {
      await Promise.race([sleep(requestedMs), earlyPromise]);
    } else {
      await sleep(requestedMs);
    }

    const end = performance.now();
    return {
      key,
      type,
      requested_ms: requestedMs,
      requested_frames: requestedFrames,
      target_frame_ms: targetFrameMs,
      timing_mode: requestedFrames ? "frame" : "timer",
      frame_interval_ms: interval,
      actual_frames: actualFrames,
      actual_ms: end - start,
      started_at_ms: start,
      ended_at_ms: end,
    } satisfies ComponentTiming;
  }

  function responseController(config: Record<string, unknown>, variables: Record<string, string>) {
    let anchor: number | null = null;
    let response: string | null = null;
    let responseTime: number | null = null;
    let resolved = false;
    let resolveResponse: (() => void) | null = null;
    const responseArrived = new Promise<void>((resolve) => {
      resolveResponse = resolve;
    });

    // Trial-table correct keys are accepted automatically for that trial, so an
    // outdated allowed_responses list cannot silently discard a valid answer.
    const correctSpec = resolveCorrectResponse(config, variables);
    const expected = correctSpec.expected;
    const configuredAllowed = Array.isArray(config.allowed_responses)
      ? normalizedUniqueKeys(config.allowed_responses)
      : [];
    const allowed = normalizedUniqueKeys([...configuredAllowed, ...(expected ? [expected] : [])]);
    const input = text(config.input, "keyboard");
    setResponseOptions(input === "touch" || input === "mouse" ? allowed : []);

    const receive = (value: string, eventTime: number) => {
      const normalized = normalizeKey(value);
      if (resolved || response !== null) return;
      if (allowed.length && !allowed.includes(normalized)) return;
      response = normalized;
      responseTime = eventTime;
      if (config.end_trial_on_response === true) {
        resolved = true;
        resolveResponse?.();
      }
    };

    return {
      allowed,
      input,
      expected,
      correctSpec,
      responseArrived,
      receive,
      startAnchor(time: number) {
        if (anchor === null) anchor = time;
        responseHandlerRef.current = receive;
      },
      stop() {
        responseHandlerRef.current = null;
        setResponseOptions([]);
      },
      finishWait() {
        if (!resolved) {
          resolved = true;
          resolveResponse?.();
        }
      },
      result() {
        const rt = anchor !== null && responseTime !== null ? responseTime - anchor : null;
        let correct: boolean | null = null;
        if (input !== "none" && correctSpec.hasCriterion) {
          correct = correctSpec.noResponseIsCorrect ? response === null : response === expected;
        }
        return {
          response,
          expected: expected || null,
          correct,
          reactionTime: rt !== null && rt >= 0 ? rt : null,
          responseTime,
          anchor,
        };
      },
    };
  }

  async function runTrial(block: RunnerBlock, trial: RunnerTrial, globalIndex: number, blockAttempt: number, blockRepeat: number) {
    const components = [...block.components].sort((a, b) => a.position - b.position);
    const responseComponent = components.find((component) => component.component_type === "response") || null;
    const responseConfig = responseComponent?.config || { input: "none", allowed_responses: [] };
    const controller = responseController(responseConfig, trial.variables);
    const anchorKey = text(responseConfig.rt_anchor, "stimulus").trim().toLowerCase();
    const deadline = Math.max(0, numeric(responseConfig.deadline_ms, 1500));
    const timings: ComponentTiming[] = [];
    let anchorStartedAt: number | null = null;
    const defaultStimulus = components.find((component) =>
      ["text", "image", "shape", "audio", "video", "html"].includes(component.component_type)
    );

    const shouldStartAnchor = (component: RunnerComponent) => {
      if (anchorStartedAt !== null) return false;
      const componentKey = component.component_key.trim().toLowerCase();
      const componentType = component.component_type.toLowerCase();
      if (componentKey === anchorKey || componentType === anchorKey) return true;
      if (["stimulus", "stimulus_onset", "stimulus onset"].includes(anchorKey)) {
        return defaultStimulus?.id === component.id;
      }
      return false;
    };

    for (const component of components) {
      if (cancelledRef.current) throw new Error("Preview cancelled");
      const config = component.config || {};

      if (component.component_type === "response") {
        if (anchorStartedAt === null) {
          anchorStartedAt = performance.now();
          controller.startAnchor(anchorStartedAt);
        }
        setDisplay({ kind: "blank" });
        await nextAnimationFrame();
        const elapsed = performance.now() - anchorStartedAt;
        const remaining = Math.max(0, deadline - elapsed);
        const start = performance.now();
        if (responseConfig.end_trial_on_response === true) {
          await Promise.race([sleep(remaining), controller.responseArrived]);
        } else {
          await sleep(remaining);
        }
        const end = performance.now();
        timings.push({
          key: component.component_key,
          type: component.component_type,
          requested_ms: remaining,
          requested_frames: null,
          target_frame_ms: null,
          timing_mode: "timer",
          frame_interval_ms: null,
          actual_frames: null,
          actual_ms: end - start,
          started_at_ms: start,
          ended_at_ms: end,
        });
        controller.finishWait();
        continue;
      }

      if (component.component_type === "fixation") {
        timings.push(await runTimedDisplay(
          { kind: "fixation", symbol: text(config.symbol, "+") },
          Math.max(0, numeric(config.duration_ms, 500)),
          component.component_key,
          component.component_type,
          config.end_on_response === true && responseConfig.end_trial_on_response === true ? controller.responseArrived : undefined,
          shouldStartAnchor(component)
            ? (timestamp) => { anchorStartedAt = timestamp; controller.startAnchor(timestamp); }
            : undefined
        ));
      } else if (component.component_type === "text") {
        const content = resolveVariable(trial.variables, config.content_variable, text(config.content, "STIMULUS"));
        const color = resolveVariable(trial.variables, config.color_variable, text(config.color, "#0f172a"));
        timings.push(await runTimedDisplay(
          {
            kind: "text",
            text: content,
            color: color || "#0f172a",
            fontSize: Math.max(8, numeric(config.font_size_px, 48)),
            fontWeight: Math.max(100, numeric(config.font_weight, 600)),
            fontFamily: text(config.font_family, "inherit"),
          },
          Math.max(0, numeric(config.duration_ms, 1500)),
          component.component_key,
          component.component_type,
          config.end_on_response === true && responseConfig.end_trial_on_response === true ? controller.responseArrived : undefined,
          shouldStartAnchor(component)
            ? (timestamp) => { anchorStartedAt = timestamp; controller.startAnchor(timestamp); }
            : undefined
        ));
      } else if (component.component_type === "shape") {
        timings.push(await runTimedDisplay(
          {
            kind: "shape",
            shape: text(config.shape, "circle"),
            color: text(config.color, "#0f172a"),
            size: Math.max(1, numeric(config.size_px, 70)),
          },
          Math.max(0, numeric(config.duration_ms, 1500)),
          component.component_key,
          component.component_type,
          config.end_on_response === true && responseConfig.end_trial_on_response === true ? controller.responseArrived : undefined,
          shouldStartAnchor(component)
            ? (timestamp) => { anchorStartedAt = timestamp; controller.startAnchor(timestamp); }
            : undefined
        ));
      } else if (component.component_type === "image") {
        const url = resolveVariable(trial.variables, config.asset_variable, text(config.asset_url));
        timings.push(await runTimedDisplay(
          { kind: "image", url },
          Math.max(0, numeric(config.duration_ms, 1500)),
          component.component_key,
          component.component_type,
          config.end_on_response === true && responseConfig.end_trial_on_response === true ? controller.responseArrived : undefined,
          shouldStartAnchor(component)
            ? (timestamp) => { anchorStartedAt = timestamp; controller.startAnchor(timestamp); }
            : undefined
        ));
      } else if (component.component_type === "audio") {
        const url = resolveVariable(trial.variables, config.asset_variable, text(config.asset_url));
        const duration = Math.max(0, numeric(config.duration_ms, 0));
        setDisplay({ kind: "audio", url });
        const start = performance.now();
        if (shouldStartAnchor(component)) {
          anchorStartedAt = start;
          controller.startAnchor(start);
        }
        if (duration > 0) await sleep(duration);
        else await sleep(50);
        const end = performance.now();
        timings.push({ key: component.component_key, type: component.component_type, requested_ms: duration || null, requested_frames: null, target_frame_ms: null, timing_mode: "timer", frame_interval_ms: null, actual_frames: null, actual_ms: end - start, started_at_ms: start, ended_at_ms: end });
      } else if (component.component_type === "video") {
        const url = resolveVariable(trial.variables, config.asset_variable, text(config.asset_url));
        timings.push(await runTimedDisplay(
          { kind: "video", url },
          Math.max(50, numeric(config.duration_ms, 1000)),
          component.component_key,
          component.component_type,
          undefined,
          shouldStartAnchor(component)
            ? (timestamp) => { anchorStartedAt = timestamp; controller.startAnchor(timestamp); }
            : undefined
        ));
      } else if (component.component_type === "html") {
        timings.push(await runTimedDisplay(
          { kind: "html", html: text(config.html, "") },
          Math.max(0, numeric(config.duration_ms, 500)),
          component.component_key,
          component.component_type,
          undefined,
          shouldStartAnchor(component)
            ? (timestamp) => { anchorStartedAt = timestamp; controller.startAnchor(timestamp); }
            : undefined
        ));
      } else if (component.component_type === "iti") {
        controller.stop();
        const minimum = Math.max(0, numeric(config.min_ms, 500));
        const maximum = Math.max(minimum, numeric(config.max_ms, minimum));
        const duration = text(config.distribution, "uniform") === "fixed"
          ? minimum
          : minimum + Math.random() * (maximum - minimum);
        timings.push(await runTimedDisplay({ kind: "blank" }, duration, component.component_key, component.component_type));
      }
    }

    controller.stop();
    const response = controller.result();
    setDisplay({ kind: "blank" });
    return {
      block_key: block.block_key,
      block_type: block.block_type,
      block_attempt: blockAttempt,
      block_repeat: blockRepeat,
      trial_index: globalIndex,
      source_trial_id: trial.id,
      source_trial_position: trial.position,
      condition_label: trial.condition_label,
      variables: trial.variables,
      response: response.response,
      correct_response: response.expected,
      correct: response.correct,
      reaction_time_ms: response.reactionTime,
      response_timestamp_ms: response.responseTime,
      anchor_timestamp_ms: response.anchor,
      component_timings: timings,
    } satisfies PreviewTrialResult;
  }


  async function runStopSignalTrial(
    block: RunnerBlock,
    planned: { source: RunnerTrial; trial_type: "go" | "stop"; sequence_index: number },
    globalIndex: number,
    blockAttempt: number,
    blockRepeat: number,
    state: { currentSsdMs: number },
    settings: StopSignalSettings
  ) {
    const trial = planned.source;
    const components = [...block.components].sort((a, b) => a.position - b.position);
    const textComponent = components.find((component) => component.component_type === "text") || null;
    const responseComponent = components.find((component) => component.component_type === "response") || null;

    const goStimulus =
      trial.variables.stimulus ||
      trial.variables.go_stimulus ||
      trial.variables.target ||
      "←";

    const responseConfig = {
      ...(responseComponent?.config || {}),
      input: text(responseComponent?.config?.input, "keyboard"),
      correct_variable: text(responseComponent?.config?.correct_variable, "correct"),
      deadline_ms: settings.go_deadline_ms,
      end_trial_on_response: planned.trial_type === "go",
      rt_anchor: "go_stimulus",
    };

    const controller = responseController(responseConfig, trial.variables);
    const timings: ComponentTiming[] = [];

    if (settings.fixation_ms > 0) {
      timings.push(
        await runTimedDisplay(
          { kind: "fixation", symbol: "+" },
          settings.fixation_ms,
          "sst_fixation",
          "fixation"
        )
      );
    }

    const goDisplay: DisplayState = {
      kind: "text",
      text: goStimulus,
      color: text(textComponent?.config?.color, "#0f172a") || "#0f172a",
      fontSize: Math.max(24, numeric(textComponent?.config?.font_size_px, 72)),
      fontWeight: Math.max(100, numeric(textComponent?.config?.font_weight, 700)),
      fontFamily: text(textComponent?.config?.font_family, "inherit"),
    };

    setDisplay(goDisplay);
    await nextAnimationFrame();
    const goOnset = performance.now();
    controller.startAnchor(goOnset);

    const requestedSsd =
      planned.trial_type === "stop"
        ? Math.min(state.currentSsdMs, Math.max(0, settings.go_deadline_ms - 16))
        : null;

    let actualStopOnset: number | null = null;

    if (planned.trial_type === "go") {
      const start = goOnset;
      await Promise.race([sleep(settings.go_deadline_ms), controller.responseArrived]);
      controller.finishWait();
      const end = performance.now();
      timings.push({
        key: "go_stimulus",
        type: "text",
        requested_ms: settings.go_deadline_ms,
        requested_frames: null,
        target_frame_ms: null,
        timing_mode: "timer",
        frame_interval_ms: effectiveFrameIntervalMs,
        actual_frames: null,
        actual_ms: end - start,
        started_at_ms: start,
        ended_at_ms: end,
      });
    } else {
      const ssd = requestedSsd || 0;
      if (ssd > 0) await sleep(ssd);

      setDisplay({
        kind: "text",
        text: settings.stop_signal_text,
        color: settings.stop_signal_color,
        fontSize: Math.max(32, numeric(textComponent?.config?.font_size_px, 72)),
        fontWeight: 800,
        fontFamily: text(textComponent?.config?.font_family, "inherit"),
      });
      await nextAnimationFrame();
      actualStopOnset = performance.now();

      const elapsedAtStop = actualStopOnset - goOnset;
      const remainingAfterStop = Math.max(0, settings.go_deadline_ms - elapsedAtStop);
      const signalDuration = Math.min(settings.stop_signal_duration_ms, remainingAfterStop);

      if (signalDuration > 0) {
        const signalStart = actualStopOnset;
        await sleep(signalDuration);
        const signalEnd = performance.now();
        timings.push({
          key: "stop_signal",
          type: "stop_signal",
          requested_ms: signalDuration,
          requested_frames: null,
          target_frame_ms: null,
          timing_mode: "timer",
          frame_interval_ms: effectiveFrameIntervalMs,
          actual_frames: null,
          actual_ms: signalEnd - signalStart,
          started_at_ms: signalStart,
          ended_at_ms: signalEnd,
        });
      }

      const elapsedAfterSignal = performance.now() - goOnset;
      const remaining = Math.max(0, settings.go_deadline_ms - elapsedAfterSignal);
      if (remaining > 0) {
        setDisplay(goDisplay);
        await sleep(remaining);
      }

      controller.finishWait();
      timings.push({
        key: "go_window",
        type: "stop_signal_trial",
        requested_ms: settings.go_deadline_ms,
        requested_frames: null,
        target_frame_ms: null,
        timing_mode: "timer",
        frame_interval_ms: effectiveFrameIntervalMs,
        actual_frames: null,
        actual_ms: performance.now() - goOnset,
        started_at_ms: goOnset,
        ended_at_ms: performance.now(),
      });
    }

    controller.stop();
    const response = controller.result();
    const goCorrect = response.response !== null && response.expected !== null
      ? response.response === response.expected
      : false;

    const stopSuccess = planned.trial_type === "stop" ? response.response === null : null;
    const responseBeforeStopSignal =
      planned.trial_type === "stop" &&
      response.responseTime !== null &&
      actualStopOnset !== null
        ? response.responseTime < actualStopOnset
        : planned.trial_type === "stop" && response.responseTime !== null
          ? true
          : null;

    const actualSsd =
      planned.trial_type === "stop" && actualStopOnset !== null
        ? Math.max(0, actualStopOnset - goOnset)
        : null;

    const ssdAfter =
      planned.trial_type === "stop" && stopSuccess !== null
        ? nextStopSignalSsd(requestedSsd || state.currentSsdMs, stopSuccess, settings)
        : null;

    if (ssdAfter !== null) state.currentSsdMs = ssdAfter;

    if (settings.iti_ms > 0) {
      timings.push(
        await runTimedDisplay(
          { kind: "blank" },
          settings.iti_ms,
          "sst_iti",
          "iti"
        )
      );
    } else {
      setDisplay({ kind: "blank" });
    }

    return {
      block_key: block.block_key,
      block_type: block.block_type,
      block_attempt: blockAttempt,
      block_repeat: blockRepeat,
      trial_index: globalIndex,
      source_trial_id: trial.id,
      source_trial_position: trial.position,
      condition_label: planned.trial_type,
      variables: {
        ...trial.variables,
        sst_trial_type: planned.trial_type,
        sst_sequence_index: String(planned.sequence_index),
      },
      response: response.response,
      correct_response: planned.trial_type === "stop" ? null : response.expected,
      correct: planned.trial_type === "stop" ? stopSuccess : goCorrect,
      reaction_time_ms: response.reactionTime,
      response_timestamp_ms: response.responseTime,
      anchor_timestamp_ms: response.anchor,
      component_timings: timings,
      runtime_data: {
        paradigm: "stop_signal",
        trial_type: planned.trial_type,
        requested_ssd_ms: requestedSsd,
        actual_ssd_ms: actualSsd,
        ssd_after_trial_ms: ssdAfter,
        stop_signal_presented: planned.trial_type === "stop",
        stop_success: stopSuccess,
        response_before_stop_signal: responseBeforeStopSignal,
        go_correct: goCorrect,
        go_correct_response: response.expected,
        go_stimulus: goStimulus,
      },
    } satisfies PreviewTrialResult;
  }


  async function runCorsiTrial(
    block: RunnerBlock,
    mode: "forward" | "backward",
    span: number,
    spanTrialIndex: number,
    globalIndex: number,
    blockRepeat: number,
    settings: CorsiSettings,
    seed: string,
    practice: boolean
  ): Promise<PreviewTrialResult> {
    setResponseOptions([]);

    const sequence = generateCorsiSequence(span, seed);
    const expected = expectedCorsiSequence(sequence, mode);
    const timings: ComponentTiming[] = [];
    const board = CORSI_STANDARD_LAYOUT;

    const boardState = (
      activeBlockId: number | null,
      interactive: boolean,
      prompt: string,
      responseCount = 0
    ): DisplayState => ({
      kind: "corsi",
      blocks: board,
      activeBlockId,
      interactive,
      prompt,
      responseCount,
      responseTarget: span,
      mode,
    });

    if (settings.pre_sequence_ms > 0) {
      timings.push(
        await runTimedDisplay(
          boardState(null, false, "Watch the sequence"),
          settings.pre_sequence_ms,
          "corsi_board_ready",
          "corsi_board"
        )
      );
    } else {
      setDisplay(boardState(null, false, "Watch the sequence"));
      await nextAnimationFrame();
    }

    const gapMs = Math.max(0, settings.inter_onset_ms - settings.highlight_ms);

    for (let sequenceIndex = 0; sequenceIndex < sequence.length; sequenceIndex += 1) {
      if (cancelledRef.current) throw new Error("Preview cancelled");
      const blockId = sequence[sequenceIndex];

      timings.push(
        await runTimedDisplay(
          boardState(blockId, false, "Watch the sequence"),
          settings.highlight_ms,
          `corsi_highlight_${sequenceIndex + 1}`,
          "corsi_highlight"
        )
      );

      if (gapMs > 0 && sequenceIndex < sequence.length - 1) {
        timings.push(
          await runTimedDisplay(
            boardState(null, false, "Watch the sequence"),
            gapMs,
            `corsi_gap_${sequenceIndex + 1}`,
            "corsi_gap"
          )
        );
      }
    }

    setDisplay(
      boardState(
        null,
        true,
        mode === "backward"
          ? "Tap the blocks in reverse order"
          : "Tap the blocks in the same order"
      )
    );
    await nextAnimationFrame();

    const responseStartedAt = performance.now();
    const responseSequence: number[] = [];
    const tapLatencies: number[] = [];
    let timedOut = false;
    let resolved = false;
    let timeoutId: number | null = null;

    await new Promise<void>((resolve) => {
      const finish = (timeout = false) => {
        if (resolved) return;
        resolved = true;
        timedOut = timeout;
        corsiTapHandlerRef.current = null;
        corsiResponseResolveRef.current = null;
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        resolve();
      };

      corsiResponseResolveRef.current = () => finish(false);

      corsiTapHandlerRef.current = (blockId, eventTime) => {
        if (resolved || cancelledRef.current) return;
        responseSequence.push(blockId);
        tapLatencies.push(Math.max(0, eventTime - responseStartedAt));

        setDisplay(
          boardState(
            blockId,
            true,
            mode === "backward"
              ? "Tap the blocks in reverse order"
              : "Tap the blocks in the same order",
            responseSequence.length
          )
        );

        if (settings.tap_feedback_ms > 0) {
          window.setTimeout(() => {
            setDisplay((current) =>
              current.kind === "corsi" && current.interactive
                ? { ...current, activeBlockId: null }
                : current
            );
          }, settings.tap_feedback_ms);
        }

        if (responseSequence.length >= span) finish(false);
      };

      timeoutId = window.setTimeout(
        () => finish(true),
        settings.response_timeout_ms
      );
    });

    if (cancelledRef.current) throw new Error("Preview cancelled");

    const responseEndedAt = performance.now();
    timings.push({
      key: "corsi_response",
      type: "corsi_spatial_response",
      requested_ms: settings.response_timeout_ms,
      requested_frames: null,
      target_frame_ms: null,
      timing_mode: "timer",
      frame_interval_ms: null,
      actual_frames: null,
      actual_ms: responseEndedAt - responseStartedAt,
      started_at_ms: responseStartedAt,
      ended_at_ms: responseEndedAt,
    });

    const errorPositions = corsiErrorPositions(expected, responseSequence);
    const correct =
      responseSequence.length === expected.length &&
      errorPositions.length === 0;

    if (practice && settings.practice_feedback) {
      timings.push(
        await runTimedDisplay(
          {
            kind: "text",
            text: correct ? "Correct" : "Try the next sequence",
            color: correct ? "#0e7490" : "#64748b",
            fontSize: 30,
            fontWeight: 700,
            fontFamily: "inherit",
          },
          650,
          "corsi_practice_feedback",
          "feedback"
        )
      );
    } else {
      setDisplay({ kind: "blank" });
    }

    const firstTapLatency = tapLatencies[0] ?? null;
    const completionLatency =
      responseSequence.length > 0
        ? tapLatencies[tapLatencies.length - 1] ?? null
        : null;

    return {
      block_key: block.block_key,
      block_type: block.block_type,
      block_attempt: 1,
      block_repeat: blockRepeat,
      trial_index: globalIndex,
      source_trial_id: `corsi:${mode}:${practice ? "practice" : "experimental"}:${span}:${spanTrialIndex}`,
      source_trial_position: spanTrialIndex,
      condition_label: `${mode}_span_${span}`,
      variables: {
        corsi_mode: mode,
        span_length: String(span),
        span_trial_index: String(spanTrialIndex),
        practice: practice ? "true" : "false",
        presented_sequence: JSON.stringify(sequence),
      },
      response: responseSequence.join("-"),
      correct_response: expected.join("-"),
      correct,
      reaction_time_ms: firstTapLatency,
      response_timestamp_ms:
        completionLatency === null ? null : responseStartedAt + completionLatency,
      anchor_timestamp_ms: responseStartedAt,
      component_timings: timings,
      runtime_data: {
        paradigm: "corsi",
        mode,
        practice,
        span_length: span,
        span_trial_index: spanTrialIndex,
        presented_sequence: sequence,
        expected_sequence: expected,
        response_sequence: responseSequence,
        correct,
        error_positions: errorPositions,
        first_tap_latency_ms: firstTapLatency,
        completion_latency_ms: completionLatency,
        tap_latencies_ms: tapLatencies,
        timed_out: timedOut,
        block_positions: board,
      },
    };
  }

  async function runCorsiBlock(
    block: RunnerBlock,
    runSeed: string,
    startingGlobalIndex: number,
    blockRepeat: number,
    settings: CorsiSettings
  ) {
    const blockResults: PreviewTrialResult[] = [];
    let localIndex = 0;
    const modes = corsiModes(settings);

    if (block.block_type === "practice") {
      for (const mode of modes) {
        if (modes.length > 1) {
          await showMessage(
            `${mode === "forward" ? "Forward" : "Backward"} Corsi practice`,
            mode === "forward"
              ? "Watch the blocks, then tap them in the same order."
              : "Watch the blocks, then tap them in reverse order.",
            "Begin practice"
          );
        }

        for (let trialIndex = 1; trialIndex <= settings.practice_trials; trialIndex += 1) {
          localIndex += 1;
          setProgress((current) => ({
            current: startingGlobalIndex + localIndex,
            total: Math.max(current.total, startingGlobalIndex + localIndex),
            block: `${block.name} · ${mode}`,
          }));

          const result = await runCorsiTrial(
            block,
            mode,
            settings.practice_span,
            trialIndex,
            startingGlobalIndex + localIndex,
            blockRepeat,
            settings,
            `${runSeed}:${block.block_key}:${blockRepeat}:${mode}:practice:${trialIndex}`,
            true
          );
          blockResults.push(result);
        }
      }

      return blockResults;
    }

    if (block.block_type === "experimental") {
      for (const mode of modes) {
        await showMessage(
          mode === "forward" ? "Forward Corsi" : "Backward Corsi",
          mode === "forward"
            ? "The scored task begins now. Reproduce each sequence in the same order."
            : "The scored backward task begins now. Reproduce each sequence in reverse order.",
          "Begin"
        );

        let span = settings.start_span;
        while (span <= settings.max_span) {
          let correctAtSpan = 0;

          for (
            let trialIndex = 1;
            trialIndex <= settings.trials_per_span;
            trialIndex += 1
          ) {
            localIndex += 1;
            setProgress((current) => ({
              current: startingGlobalIndex + localIndex,
              total: Math.max(current.total, startingGlobalIndex + localIndex),
              block: `${mode === "forward" ? "Forward" : "Backward"} Corsi · span ${span}`,
            }));

            const result = await runCorsiTrial(
              block,
              mode,
              span,
              trialIndex,
              startingGlobalIndex + localIndex,
              blockRepeat,
              settings,
              `${runSeed}:${block.block_key}:${blockRepeat}:${mode}:${span}:${trialIndex}`,
              false
            );
            blockResults.push(result);
            if (result.correct === true) correctAtSpan += 1;
          }

          if (correctAtSpan >= settings.pass_required) {
            span += 1;
          } else {
            break;
          }
        }
      }
    }

    return blockResults;
  }


  async function runCardSortTrial(
    block: RunnerBlock,
    trialNumber: number,
    categoryIndex: number,
    activeRule: CardSortRule,
    previousRule: CardSortRule | null,
    correctStreakBefore: number,
    categoriesCompleted: number,
    settings: CardSortSettings,
    seed: string
  ): Promise<PreviewTrialResult> {
    setResponseOptions([]);

    const target = generateCardSortTarget(seed);
    const correctReferenceId = correctReferenceForRule(target, activeRule);
    let chosenReferenceId: number | null = null;
    let responseTime: number | null = null;
    let timedOut = false;
    let resolved = false;
    let timeoutId: number | null = null;

    const responseStartedAt = performance.now();

    setDisplay({
      kind: "card_sort",
      target,
      references: CARD_SORT_REFERENCE_CARDS,
      interactive: true,
      selectedReferenceId: null,
      feedback: null,
      trialNumber,
      maxTrials: settings.max_trials,
      categoriesCompleted,
    });
    await nextAnimationFrame();

    await new Promise<void>((resolve) => {
      const finish = (timeout = false) => {
        if (resolved) return;
        resolved = true;
        timedOut = timeout;
        cardSortChoiceHandlerRef.current = null;
        cardSortResponseResolveRef.current = null;
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        resolve();
      };

      cardSortResponseResolveRef.current = () => finish(false);

      cardSortChoiceHandlerRef.current = (referenceId, eventTime) => {
        if (resolved || cancelledRef.current) return;
        chosenReferenceId = referenceId;
        responseTime = eventTime;
        finish(false);
      };

      timeoutId = window.setTimeout(
        () => finish(true),
        settings.response_timeout_ms
      );
    });

    if (cancelledRef.current) throw new Error("Preview cancelled");

    const responseEndedAt = performance.now();
    const inferredChoiceRule = inferredRuleFromChoice(
      target,
      chosenReferenceId
    );
    const correct = chosenReferenceId === correctReferenceId;
    const perseverativeError =
      !correct &&
      previousRule !== null &&
      inferredChoiceRule === previousRule;
    const nonperseverativeError = !correct && !perseverativeError;
    const failureToMaintainSet =
      !correct &&
      correctStreakBefore >= settings.failure_to_maintain_streak &&
      correctStreakBefore < settings.correct_to_shift;

    const correctStreakAfter = correct ? correctStreakBefore + 1 : 0;
    const categoryCompleted =
      correct && correctStreakAfter >= settings.correct_to_shift;
    const nextRuleAfterTrial =
      categoryCompleted &&
      categoriesCompleted + 1 < settings.categories_to_complete
        ? nextCardSortRule(activeRule)
        : null;
    const responseLatency =
      responseTime === null ? null : Math.max(0, responseTime - responseStartedAt);

    setDisplay({
      kind: "card_sort",
      target,
      references: CARD_SORT_REFERENCE_CARDS,
      interactive: false,
      selectedReferenceId: chosenReferenceId,
      feedback: correct ? "correct" : "incorrect",
      trialNumber,
      maxTrials: settings.max_trials,
      categoriesCompleted: categoriesCompleted + (categoryCompleted ? 1 : 0),
    });

    const timings: ComponentTiming[] = [
      {
        key: "card_sort_response",
        type: "card_sort_choice",
        requested_ms: settings.response_timeout_ms,
        requested_frames: null,
        target_frame_ms: null,
        timing_mode: "timer",
        frame_interval_ms: null,
        actual_frames: null,
        actual_ms: responseEndedAt - responseStartedAt,
        started_at_ms: responseStartedAt,
        ended_at_ms: responseEndedAt,
      },
    ];

    if (settings.feedback_ms > 0) {
      const feedbackStart = performance.now();
      await sleep(settings.feedback_ms);
      const feedbackEnd = performance.now();
      timings.push({
        key: "card_sort_feedback",
        type: "feedback",
        requested_ms: settings.feedback_ms,
        requested_frames: null,
        target_frame_ms: null,
        timing_mode: "timer",
        frame_interval_ms: null,
        actual_frames: null,
        actual_ms: feedbackEnd - feedbackStart,
        started_at_ms: feedbackStart,
        ended_at_ms: feedbackEnd,
      });
    }

    if (settings.iti_ms > 0) {
      timings.push(
        await runTimedDisplay(
          { kind: "blank" },
          settings.iti_ms,
          "card_sort_iti",
          "iti"
        )
      );
    } else {
      setDisplay({ kind: "blank" });
    }

    return {
      block_key: block.block_key,
      block_type: block.block_type,
      block_attempt: 1,
      block_repeat: 1,
      trial_index: trialNumber,
      source_trial_id: `card-sort:${trialNumber}`,
      source_trial_position: trialNumber,
      condition_label: `category_${categoryIndex}_${activeRule}`,
      variables: {
        card_sort_rule: activeRule,
        category_index: String(categoryIndex),
        target_color: target.color_name,
        target_shape: target.shape,
        target_count: String(target.count),
        correct_reference_id: String(correctReferenceId),
      },
      response:
        chosenReferenceId === null ? null : String(chosenReferenceId),
      correct_response: String(correctReferenceId),
      correct,
      reaction_time_ms: responseLatency,
      response_timestamp_ms: responseTime,
      anchor_timestamp_ms: responseStartedAt,
      component_timings: timings,
      runtime_data: {
        paradigm: "card_sorting",
        scoring_system: "psylattice_transparent_v1",
        trial_number: trialNumber,
        category_index: categoryIndex,
        active_rule: activeRule,
        previous_rule: previousRule,
        target_card: target,
        chosen_reference_id: chosenReferenceId,
        correct_reference_id: correctReferenceId,
        inferred_choice_rule: inferredChoiceRule,
        correct,
        perseverative_error: perseverativeError,
        nonperseverative_error: nonperseverativeError,
        failure_to_maintain_set: failureToMaintainSet,
        correct_streak_before: correctStreakBefore,
        correct_streak_after: categoryCompleted ? 0 : correctStreakAfter,
        category_completed_after_trial: categoryCompleted,
        next_rule_after_trial: categoryCompleted ? nextRuleAfterTrial : null,
        response_latency_ms: responseLatency,
        timed_out: timedOut,
        reference_cards: CARD_SORT_REFERENCE_CARDS,
      },
    };
  }

  async function runCardSortBlock(
    block: RunnerBlock,
    runSeed: string,
    startingGlobalIndex: number,
    settings: CardSortSettings
  ) {
    const blockResults: PreviewTrialResult[] = [];
    const rules = cardSortRuleSequence(
      settings.starting_rule,
      settings.categories_to_complete
    );

    let categoryIndex = 1;
    let activeRule = rules[0];
    let previousRule: CardSortRule | null = null;
    let correctStreak = 0;
    let categoriesCompleted = 0;
    let localIndex = 0;

    await showMessage(
      "Card sorting",
      "Match each target card to one of the four reference cards. The correct way to match may change during the task. Use Correct / Incorrect feedback to work out the current rule.",
      "Begin"
    );

    while (
      localIndex < settings.max_trials &&
      categoriesCompleted < settings.categories_to_complete
    ) {
      localIndex += 1;
      const globalIndex = startingGlobalIndex + localIndex;

      setProgress({
        current: globalIndex,
        total: Math.max(
          settings.max_trials,
          startingGlobalIndex + settings.max_trials
        ),
        block: `Card sorting · category ${categoryIndex}`,
      });

      const result = await runCardSortTrial(
        block,
        globalIndex,
        categoryIndex,
        activeRule,
        previousRule,
        correctStreak,
        categoriesCompleted,
        settings,
        `${runSeed}:${block.block_key}:${globalIndex}:${categoryIndex}:${activeRule}`
      );
      blockResults.push(result);

      const runtime = result.runtime_data as Record<string, unknown>;
      const categoryCompleted =
        runtime.category_completed_after_trial === true;

      if (categoryCompleted) {
        categoriesCompleted += 1;
        previousRule = activeRule;
        correctStreak = 0;

        if (categoriesCompleted < settings.categories_to_complete) {
          categoryIndex += 1;
          activeRule =
            rules[categoryIndex - 1] ||
            nextCardSortRule(activeRule);
        }
      } else {
        correctStreak = Number(runtime.correct_streak_after || 0);
      }
    }

    return blockResults;
  }

  async function createSession() {
    const supabase = createClient();
    const device = {
      user_agent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: { width: window.screen.width, height: window.screen.height, pixel_ratio: window.devicePixelRatio },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      device_class: preflight.device_class,
      detected_refresh_hz: preflight.refresh_hz,
      detected_frame_interval_ms: preflight.frame_interval_ms,
      refresh_stability: preflight.refresh_stability,
      refresh_jitter_ms: preflight.refresh_jitter_ms,
      refresh_mode: refreshMode,
      refresh_override_hz: refreshMode === "override" ? refreshOverrideHz : null,
      refresh_hz: effectiveRefreshHz,
      frame_interval_ms: effectiveFrameIntervalMs,
    };
    const { data, error: rpcError } = await supabase.rpc("psylattice_start_cognitive_preview", {
      p_task_id: taskId,
      p_version_id: versionId,
      p_device_info: device,
    });
    if (rpcError) throw new Error(rpcError.message);
    const id = typeof data === "object" && data ? String((data as any).session_id || "") : "";
    if (!id) throw new Error("Preview session could not be created.");
    setSessionId(id);
    return { id, device };
  }

  async function completeSession(id: string, trialResults: PreviewTrialResult[], finalSummary: Record<string, any>, device: Record<string, any>) {
    setSavingResults(true);
    const allTimings = trialResults.flatMap((result) => result.component_timings);
    const drifts = allTimings
      .filter((timing) => timing.requested_ms !== null)
      .map((timing) => timing.actual_ms - (timing.requested_ms || 0));
    const timingQuality = {
      engine: cardSortRuntime ? "psylattice_card_sorting_preview_v1" : corsiRuntime ? "psylattice_corsi_preview_v1" : stopSignalRuntime ? "psylattice_stop_signal_preview_v1" : "psylattice_browser_preview_v2_frame_calibrated",
      clock: "performance.now",
      detected_refresh_hz: preflight.refresh_hz,
      detected_frame_interval_ms: preflight.frame_interval_ms,
      refresh_samples: preflight.refresh_samples,
      refresh_stability: preflight.refresh_stability,
      refresh_jitter_ms: preflight.refresh_jitter_ms,
      refresh_mode: refreshMode,
      refresh_override_hz: refreshMode === "override" ? refreshOverrideHz : null,
      refresh_hz: effectiveRefreshHz,
      frame_interval_ms: effectiveFrameIntervalMs ? round(effectiveFrameIntervalMs, 3) : null,
      frame_timed_components: allTimings.filter((timing) => timing.timing_mode === "frame").length,
      visibility_interruptions: visibilityInterruptions,
      assets_total: preflight.assets_total,
      assets_failed: preflight.assets_failed.length,
      mean_duration_error_ms: round(mean(drifts), 3),
      median_duration_error_ms: round(median(drifts), 3),
      component_timing_observations: drifts.length,
      note: "Browser timing diagnostics describe this preview environment; they do not guarantee laboratory hardware timing precision.",
    };
    const payload = trialResults.map((result) => ({
      block_key: result.block_key,
      trial_index: result.trial_index,
      condition_label: result.condition_label,
      stimulus_payload: {
        variables: result.variables,
        source_trial_id: result.source_trial_id,
        source_trial_position: result.source_trial_position,
        block_type: result.block_type,
        block_attempt: result.block_attempt,
        block_repeat: result.block_repeat,
        runtime_data: result.runtime_data || null,
      },
      response_payload: {
        response: result.response,
        correct_response: result.correct_response,
      },
      correct: result.correct,
      reaction_time_ms: result.reaction_time_ms,
      timing: {
        anchor_timestamp_ms: result.anchor_timestamp_ms,
        response_timestamp_ms: result.response_timestamp_ms,
        components: result.component_timings,
      },
    }));
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("psylattice_complete_cognitive_preview", {
      p_session_id: id,
      p_results: payload,
      p_timing_quality: timingQuality,
      p_summary_scores: finalSummary,
      p_device_info: device,
    });
    setSavingResults(false);
    if (rpcError) throw new Error(rpcError.message);
    return timingQuality;
  }

  async function startPreview() {
    if (!task || !version || !canStart) return;
    cancelledRef.current = false;
    setError("");
    setResults([]);
    setSummary(null);
    setVisibilityInterruptions(0);
    setPhase("running");

    try {
      const { id, device } = await createSession();
      if (version.participant_instructions.trim()) {
        await showMessage("Instructions", version.participant_instructions, "Start");
      }

      const runSeed = `${id}:${Date.now()}`;
      const totalPlanned = blocks.reduce((sum, block) => {
        if (!["practice", "experimental", "custom"].includes(block.block_type)) return sum;
        if (cardSortRuntime && block.block_type === "experimental") {
          return sum + cardSortSettings.max_trials * Math.max(1, block.repeat_count);
        }
        if (corsiRuntime && block.block_type === "practice") {
          return (
            sum +
            corsiSettings.practice_trials *
              corsiModes(corsiSettings).length *
              Math.max(1, block.repeat_count)
          );
        }
        if (corsiRuntime && block.block_type === "experimental") {
          return (
            sum +
            (corsiSettings.max_span - corsiSettings.start_span + 1) *
              corsiSettings.trials_per_span *
              corsiModes(corsiSettings).length *
              Math.max(1, block.repeat_count)
          );
        }
        if (stopSignalRuntime && block.block_type === "practice") {
          return sum + stopSignalSettings.practice_trials * Math.max(1, block.repeat_count);
        }
        if (stopSignalRuntime && block.block_type === "experimental") {
          return sum + stopSignalSettings.experimental_trials * Math.max(1, block.repeat_count);
        }
        return sum + expandedTrials(block.trials).length * Math.max(1, block.repeat_count);
      }, 0);
      setProgress({ current: 0, total: totalPlanned, block: "" });

      const collected: PreviewTrialResult[] = [];
      let globalIndex = 0;
      const stopSignalState = { currentSsdMs: stopSignalSettings.initial_ssd_ms };

      for (const block of [...blocks].sort((a, b) => a.position - b.position)) {
        if (cancelledRef.current) throw new Error("Preview cancelled");
        const screenText = text(block.config.screen_text, "").trim();
        if (["instructions", "break", "end"].includes(block.block_type) && block.trials.length === 0) {
          const defaultText = block.block_type === "break" ? "Take a short break. Continue when you are ready." : block.block_type === "end" ? "This task is complete." : "Continue when you are ready.";
          await showMessage(block.name, screenText || defaultText, block.block_type === "end" ? "Finish" : "Continue");
          continue;
        }

        for (let repeat = 1; repeat <= Math.max(1, block.repeat_count); repeat += 1) {
          if (cardSortRuntime && block.block_type === "experimental") {
            const cardSortResults = await runCardSortBlock(
              block,
              `${runSeed}:${repeat}`,
              globalIndex,
              cardSortSettings
            );
            collected.push(...cardSortResults);
            globalIndex += cardSortResults.length;
            continue;
          }

          if (
            corsiRuntime &&
            (block.block_type === "practice" || block.block_type === "experimental")
          ) {
            const corsiBlockResults = await runCorsiBlock(
              block,
              runSeed,
              globalIndex,
              repeat,
              corsiSettings
            );
            collected.push(...corsiBlockResults);
            globalIndex += corsiBlockResults.length;
            continue;
          }

          let attempt = 1;
          const maxAttempts = block.block_type === "practice" ? Math.max(1, numeric(block.continue_rule.max_attempts, 3)) : 1;
          let practiceDone = false;

          while (!practiceDone && attempt <= maxAttempts) {
            const dedicatedStopBlock =
              stopSignalRuntime &&
              (block.block_type === "practice" || block.block_type === "experimental");

            if (dedicatedStopBlock && block.trials.filter((trial) => trial.enabled !== false).length === 0) {
              throw new Error("Stop-Signal requires at least one enabled Go mapping in the Trial Table.");
            }

            if (dedicatedStopBlock) {
              // Practice and experimental tracking start from the configured initial SSD.
              // This avoids an accidental practice history silently changing the main task.
              if (attempt === 1 && repeat === 1) {
                stopSignalState.currentSsdMs = stopSignalSettings.initial_ssd_ms;
              }
            }

            const trials = dedicatedStopBlock
              ? planStopSignalTrials(
                  block.trials.filter((trial) => trial.enabled !== false),
                  block.block_type === "practice"
                    ? stopSignalSettings.practice_trials
                    : stopSignalSettings.experimental_trials,
                  stopSignalSettings.stop_probability,
                  stopSignalSettings.max_consecutive_stops,
                  `${runSeed}:${block.block_key}:${repeat}:${attempt}`
                )
              : orderedTrials(block, version.randomization_config || {}, `${runSeed}:${repeat}:${attempt}`);

            const attemptResults: PreviewTrialResult[] = [];
            setProgress((current) => ({ ...current, block: block.name }));

            for (const planned of trials) {
              globalIndex += 1;
              setProgress((current) => ({ current: globalIndex, total: Math.max(current.total, globalIndex), block: block.name }));
              const result = dedicatedStopBlock
                ? await runStopSignalTrial(
                    block,
                    planned as { source: RunnerTrial; trial_type: "go" | "stop"; sequence_index: number },
                    globalIndex,
                    attempt,
                    repeat,
                    stopSignalState,
                    stopSignalSettings
                  )
                : await runTrial(block, planned as RunnerTrial, globalIndex, attempt, repeat);
              collected.push(result);
              attemptResults.push(result);
            }

            if (block.block_type !== "practice") {
              practiceDone = true;
              break;
            }

            const scored = attemptResults.filter((result) => result.correct !== null);
            const accuracy = scored.length ? scored.filter((result) => result.correct).length / scored.length : 1;
            const minimum = Math.min(1, Math.max(0, numeric(block.continue_rule.min_accuracy, 0.8)));
            if (accuracy >= minimum) {
              await showMessage("Practice complete", `Accuracy: ${Math.round(accuracy * 100)}%.`, "Continue");
              practiceDone = true;
            } else if (attempt >= maxAttempts || text(block.continue_rule.on_fail, "repeat") === "continue") {
              await showMessage("Practice complete", `Accuracy: ${Math.round(accuracy * 100)}%. The configured practice limit has been reached.`, "Continue");
              practiceDone = true;
            } else {
              const onFail = text(block.continue_rule.on_fail, "repeat");
              await showMessage(
                onFail === "show_instructions" ? "Review the instructions" : "Practice again",
                `Accuracy was ${Math.round(accuracy * 100)}%. The criterion is ${Math.round(minimum * 100)}%.`,
                "Try again"
              );
              attempt += 1;
            }
          }
        }
      }

      setResults(collected);
      const genericSummary = buildSummary(collected);
      const stopSummary = stopSignalRuntime
        ? buildStopSignalSummary(collected, stopSignalSettings)
        : null;
      const corsiSummary = corsiRuntime
        ? buildCorsiSummary(collected, corsiSettings)
        : null;
      const cardSortSummary = cardSortRuntime
        ? buildCardSortSummary(collected, cardSortSettings)
        : null;
      const finalSummary = cardSortSummary
        ? {
            ...genericSummary,
            paradigm: "card_sorting",
            categories_completed: cardSortSummary.categories_completed,
            card_sorting: cardSortSummary,
          }
        : corsiSummary
          ? {
              ...genericSummary,
              paradigm: "corsi",
              corsi_span: corsiSummary.maximum_span,
              corsi: corsiSummary,
            }
          : stopSummary
          ? {
              ...genericSummary,
              paradigm: "stop_signal",
              ssrt_ms: stopSummary.ssrt_integration_ms,
              stop_signal: stopSummary,
            }
          : genericSummary;
      setSummary(finalSummary);
      await completeSession(id, collected, finalSummary, device);
      setPhase("complete");
      setDisplay({ kind: "blank" });
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Preview could not be completed.";
      if (message !== "Preview cancelled") setError(message);
      setPhase(message === "Preview cancelled" ? "preflight" : "error");
      setDisplay({ kind: "blank" });
    } finally {
      responseHandlerRef.current = null;
      continueRef.current = null;
      corsiTapHandlerRef.current = null;
      corsiResponseResolveRef.current = null;
      cardSortChoiceHandlerRef.current = null;
      cardSortResponseResolveRef.current = null;
      setResponseOptions([]);
    }
  }

  async function exitPreview() {
    cancelledRef.current = true;
    responseHandlerRef.current = null;
    corsiTapHandlerRef.current = null;
    corsiResponseResolveRef.current?.();
    corsiResponseResolveRef.current = null;
    cardSortChoiceHandlerRef.current = null;
    cardSortResponseResolveRef.current?.();
    cardSortResponseResolveRef.current = null;
    continueRef.current?.();
    continueRef.current = null;
    if (sessionId && phase === "running") {
      const supabase = createClient();
      await supabase.rpc("psylattice_abandon_cognitive_preview", { p_session_id: sessionId });
    }
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* optional */ }
    }
    onClose();
  }

  const progressPercent = progress.total > 0 ? Math.min(100, (progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[30px] border border-slate-700/60 bg-white shadow-2xl sm:min-h-[calc(100vh-40px)]">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => void exitPreview()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="Exit preview">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Browser Preview · Phase 1C</span>
                {version && <span className="text-[10px] font-semibold text-slate-400">{version.version_label}</span>}
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{task?.title || "Cognitive task"}</p>
            </div>
          </div>
          {phase === "running" && (
            <div className="hidden min-w-[240px] sm:block">
              <div className="flex justify-between text-[10px] font-semibold text-slate-400"><span>{progress.block}</span><span>{progress.current}/{progress.total || "—"}</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600 transition-all" style={{ width: `${progressPercent}%` }} /></div>
            </div>
          )}
          <button type="button" onClick={() => void exitPreview()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" aria-label="Close preview">
            <X className="h-4 w-4" />
          </button>
        </header>

        {phase === "preflight" && (
          <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="grid gap-7 lg:grid-cols-[1fr_.8fr] lg:items-start">
              <section>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200"><Gauge className="h-3.5 w-3.5" /> Timing preflight</span>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Preview the exact saved task definition.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">PsyLattice will execute the saved blocks and trial rows in your browser, record responses with <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">performance.now()</code>, and store this run separately as Preview data.</p>
                <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/80 p-4 text-xs leading-5 text-violet-950 shadow-[0_12px_28px_rgba(124,58,237,0.08)]"><strong>Timing note:</strong> browser measurements can be high resolution, but operating-system scheduling, display hardware, browser load and input devices still affect observed timing. Preview diagnostics should be inspected before using a task in research.</div>
              </section>

              <section className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Environment</p>
                {loading ? (
                  <div className="mt-5 flex items-center gap-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading task and preloading assets…</div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    <BrowserBadge ok={preflight.timing_api}>High-resolution timing API</BrowserBadge>
                    <BrowserBadge ok={preflight.animation_frame}>Animation-frame API</BrowserBadge>
                    <BrowserBadge ok={preflight.visibility_ok}>{preflight.visibility_ok ? "Tab is visible" : "Return to this tab before starting"}</BrowserBadge>
                    <BrowserBadge ok={deviceAllowed}>{preflight.device_class} · {deviceAllowed ? "allowed by task" : "blocked by task settings"}</BrowserBadge>
                    <BrowserBadge ok={preflight.assets_failed.length === 0}>{preflight.assets_loaded}/{preflight.assets_total} media assets preloaded{preflight.assets_failed.length ? ` · ${preflight.assets_failed.length} failed` : ""}</BrowserBadge>
                    {refreshStable !== null && (
                      <BrowserBadge ok={refreshStable}>{refreshStable ? `Refresh sampling stable · ${Math.round((preflight.refresh_stability || 0) * 100)}% consistent frames` : "Refresh timing varied during calibration · consider fullscreen or recalibrate"}</BrowserBadge>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Display calibration</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">PsyLattice detects this display automatically and converts visual durations to whole frames.</p>
                        </div>
                        <button type="button" onClick={() => void calibrateRefresh()} disabled={calibratingRefresh} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 disabled:opacity-50"><RotateCcw className={`h-3 w-3 ${calibratingRefresh ? "animate-spin" : ""}`} />{calibratingRefresh ? "Calibrating…" : "Recalibrate"}</button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Detected</p><p className="mt-1 text-lg font-semibold text-slate-900">{preflight.refresh_hz ? `${preflight.refresh_hz} Hz` : "—"}</p><p className="mt-0.5 text-[9px] text-slate-400">{preflight.frame_interval_ms ? `${preflight.frame_interval_ms} ms / frame` : "Detection unavailable"}</p></div>
                        <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Used for timing</p><p className="mt-1 text-lg font-semibold text-slate-900">{effectiveRefreshHz ? `${round(effectiveRefreshHz, 1)} Hz` : "Timer fallback"}</p><p className="mt-0.5 text-[9px] text-slate-400">{effectiveFrameIntervalMs ? `${round(effectiveFrameIntervalMs, 3)} ms / frame` : "No frame calibration"}</p></div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setRefreshMode("auto")} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${refreshMode === "auto" ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-600"}`}>Automatic</button>
                        <button type="button" onClick={() => setRefreshMode("override")} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${refreshMode === "override" ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-600"}`}>Manual override</button>
                      </div>

                      {refreshMode === "override" && (
                        <label className="mt-3 block">
                          <span className="text-[10px] font-semibold text-slate-500">Display refresh rate</span>
                          <select value={String(refreshOverrideHz)} onChange={(event) => setRefreshOverrideHz(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-400">
                            {[30, 50, 60, 75, 90, 100, 120, 144, 165, 180, 240].map((hz) => <option key={hz} value={hz}>{hz} Hz</option>)}
                          </select>
                          <p className="mt-1.5 text-[9px] leading-4 text-violet-700">Use override only when you know the display refresh rate and automatic detection is incorrect or unstable.</p>
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-700 shadow-[0_10px_26px_rgba(225,29,72,0.08)]">{error}</div>}

            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => void requestFullscreen()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.10)]"><Expand className="h-4 w-4" /> Enter fullscreen</button>
              <button type="button" onClick={() => void startPreview()} disabled={!canStart || !preflight.visibility_ok} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-4 w-4" /> Start preview</button>
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="relative flex min-h-[calc(100vh-105px)] items-center justify-center overflow-hidden bg-[#f7f8f8] px-5 py-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-slate-200" />
            <div className="w-full max-w-5xl text-center">
              {display.kind === "message" && (
                <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_22px_55px_rgba(15,23,42,0.11)] sm:p-9">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{display.title}</h2>
                  <p className="mx-auto mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{display.text}</p>
                  <button type="button" onClick={() => continueRef.current?.()} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-xs font-semibold text-white">{display.actionLabel || "Continue"}</button>
                </div>
              )}
              {display.kind === "fixation" && <div className="text-6xl font-medium text-slate-900">{display.symbol}</div>}
              {display.kind === "text" && <div style={{ color: display.color, fontSize: display.fontSize, fontWeight: display.fontWeight, fontFamily: display.fontFamily }} className="select-none leading-none">{display.text}</div>}
              {display.kind === "shape" && (
                <div className="mx-auto" style={{ width: display.shape === "rectangle" ? display.size * 1.5 : display.size, height: display.size, backgroundColor: display.color, borderRadius: display.shape === "circle" ? "9999px" : display.shape === "square" ? "10px" : "10px" }} />
              )}
              {display.kind === "image" && display.url && <img src={display.url} alt="Cognitive stimulus" className="mx-auto max-h-[60vh] max-w-[80vw] object-contain" draggable={false} />}
              {display.kind === "audio" && display.url && <audio src={display.url} autoPlay className="mx-auto" />}
              {display.kind === "video" && display.url && <video src={display.url} autoPlay muted={false} className="mx-auto max-h-[60vh] max-w-[80vw]" />}
              {display.kind === "html" && <div className="mx-auto max-w-3xl text-left text-slate-900" dangerouslySetInnerHTML={{ __html: display.html }} />}

              {display.kind === "corsi" && (
                <div className="mx-auto w-full max-w-3xl">
                  <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                      {display.mode === "forward" ? "Forward Corsi" : "Backward Corsi"}
                    </span>
                    {display.interactive && (
                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-800">
                        {display.responseCount}/{display.responseTarget} taps
                      </span>
                    )}
                  </div>
                  <p className="mb-5 text-sm font-semibold text-slate-600">{display.prompt}</p>
                  <div className="relative mx-auto aspect-[4/3] w-full max-w-[680px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_42px_rgba(15,23,42,0.08)]">
                    {display.blocks.map((block) => {
                      const active = display.activeBlockId === block.id;
                      return (
                        <button
                          key={block.id}
                          type="button"
                          aria-label={display.interactive ? `Corsi block ${block.id}` : "Corsi sequence block"}
                          disabled={!display.interactive}
                          onPointerDown={(event) => {
                            if (!display.interactive) return;
                            event.preventDefault();
                            corsiTapHandlerRef.current?.(block.id, performance.now());
                          }}
                          className={`absolute h-[15%] w-[15%] -translate-x-1/2 -translate-y-1/2 select-none rounded-[20%] border transition-[background-color,border-color,box-shadow,transform] duration-100 ${
                            active
                              ? "scale-[1.04] border-cyan-400 bg-cyan-500 shadow-[0_0_0_6px_rgba(6,182,212,0.12),0_12px_26px_rgba(8,145,178,0.25)]"
                              : display.interactive
                                ? "border-slate-300 bg-white shadow-[0_9px_22px_rgba(15,23,42,0.12)] hover:border-cyan-300 hover:shadow-[0_11px_26px_rgba(8,145,178,0.14)]"
                                : "border-slate-300 bg-slate-50 shadow-[0_8px_18px_rgba(15,23,42,0.09)]"
                          }`}
                          style={{ left: `${block.x}%`, top: `${block.y}%` }}
                        >
                          <span className="sr-only">{block.id}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-[10px] text-slate-400">
                    {display.interactive ? "Tap or click the blocks to reproduce the sequence." : "Keep your eyes on the board."}
                  </p>
                </div>
              )}


              {display.kind === "card_sort" && (
                <div className="mx-auto w-full max-w-5xl">
                  <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm">
                      Trial {display.trialNumber}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-700">
                    Choose the reference card that matches the target.
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    The matching rule is hidden and may change. Use the feedback.
                  </p>

                  <div className="mx-auto mt-5 max-w-[190px]">
                    <div className="flex aspect-[4/3] items-center justify-center rounded-[24px] border border-cyan-300 bg-white p-4 shadow-[0_0_0_6px_rgba(6,182,212,0.08),0_14px_34px_rgba(15,23,42,0.11)]">
                      <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
                        {Array.from({ length: display.target.count }).map((_, index) => {
                          const glyph =
                            display.target.shape === "triangle"
                              ? "▲"
                              : display.target.shape === "square"
                                ? "■"
                                : display.target.shape === "diamond"
                                  ? "◆"
                                  : "●";
                          return (
                            <span
                              key={index}
                              className="text-[34px] leading-none"
                              style={{ color: display.target.color }}
                            >
                              {glyph}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <p className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                      Target
                    </p>
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {display.references.map((card) => {
                      const selected = display.selectedReferenceId === card.id;
                      const glyph =
                        card.shape === "triangle"
                          ? "▲"
                          : card.shape === "square"
                            ? "■"
                            : card.shape === "diamond"
                              ? "◆"
                              : "●";

                      return (
                        <button
                          key={card.id}
                          type="button"
                          disabled={!display.interactive}
                          onPointerDown={(event) => {
                            if (!display.interactive) return;
                            event.preventDefault();
                            cardSortChoiceHandlerRef.current?.(
                              card.id,
                              performance.now()
                            );
                          }}
                          className={`relative flex aspect-[4/3] items-center justify-center rounded-[24px] border bg-white p-3 transition ${
                            selected
                              ? display.feedback === "correct"
                                ? "border-cyan-400 shadow-[0_0_0_6px_rgba(6,182,212,0.10),0_14px_30px_rgba(8,145,178,0.18)]"
                                : "border-slate-500 shadow-[0_0_0_6px_rgba(100,116,139,0.10),0_14px_30px_rgba(15,23,42,0.14)]"
                              : display.interactive
                                ? "border-slate-300 shadow-[0_9px_22px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 hover:border-cyan-300"
                                : "border-slate-200 shadow-[0_7px_18px_rgba(15,23,42,0.07)]"
                          }`}
                        >
                          <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
                            {Array.from({ length: card.count }).map((_, index) => (
                              <span
                                key={index}
                                className="text-[28px] leading-none sm:text-[32px]"
                                style={{ color: card.color }}
                              >
                                {glyph}
                              </span>
                            ))}
                          </div>
                          <span className="sr-only">Reference card {card.id}</span>
                        </button>
                      );
                    })}
                  </div>

                  {display.feedback && (
                    <div className="mt-6 text-center">
                      <span
                        className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold shadow-sm ${
                          display.feedback === "correct"
                            ? "border-cyan-200 bg-cyan-50 text-cyan-900"
                            : "border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        {display.feedback === "correct" ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {responseOptions.length > 0 && display.kind !== "message" && display.kind !== "corsi" && display.kind !== "card_sort" && (
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  {responseOptions.map((option) => (
                    <button key={option} type="button" onPointerDown={() => responseHandlerRef.current?.(option, performance.now())} className="min-w-20 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_9px_22px_rgba(15,23,42,0.10)] transition hover:-translate-y-0.5">{option === "space" ? "Space" : option}</button>
                  ))}
                </div>
              )}

              {responseOptions.length === 0 && display.kind !== "message" && display.kind !== "corsi" && display.kind !== "card_sort" && (
                <div className="fixed bottom-7 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-medium text-slate-400 shadow-sm backdrop-blur"><Keyboard className="mr-1.5 inline h-3 w-3" /> Use the configured response keys</div>
              )}
            </div>
          </div>
        )}

        {phase === "complete" && summary && (
          <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-900 shadow-[0_8px_18px_rgba(8,145,178,0.08)]">Preview saved</span><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Preview complete.</h2><p className="mt-2 text-sm text-slate-500">These results are stored as Preview data and are separate from future Pilot and Study sessions.</p></div>
              {savingResults && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Saving diagnostics…</div>}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [String(summary.trials ?? 0), "Trials", TimerReset],
                [summary.accuracy === null ? "—" : `${Math.round(Number(summary.accuracy) * 100)}%`, "Accuracy", Check],
                [summary.mean_rt_ms === null ? "—" : `${summary.mean_rt_ms} ms`, "Mean RT", Gauge],
                [effectiveRefreshHz ? `${round(effectiveRefreshHz, 1)} Hz` : "—", "Timing refresh", Monitor],
              ].map(([value, label, Icon]) => (
                <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"><Icon className="h-4 w-4 text-cyan-700" /><p className="mt-4 text-2xl font-semibold text-slate-950">{String(value)}</p><p className="mt-1 text-[11px] text-slate-400">{String(label)}</p></div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900">Response diagnostics</p>
                  <p className="mt-1 text-[11px] text-slate-500">Captured responses: {summary.response_observations ?? 0}/{summary.trials ?? 0} · Scorable trials: {summary.scorable_trials ?? 0}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${(summary.response_observations ?? 0) > 0 ? "border border-cyan-200 bg-cyan-50 text-cyan-900 shadow-[0_6px_16px_rgba(8,145,178,0.07)]" : "border border-violet-200 bg-violet-50 text-violet-900 shadow-[0_6px_16px_rgba(124,58,237,0.07)]"}`}>{(summary.response_observations ?? 0) > 0 ? "Keys captured" : "No keys captured"}</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Trials are scored only when PsyLattice can resolve a correct response. Trial Table columns named correct, correct_response, correct_key, response_key or answer_key are recognized automatically.</p>
            </div>

            {summary.card_sorting && (
              <div className="mt-3 rounded-[24px] border border-cyan-200/80 bg-white p-5 shadow-[0_10px_28px_rgba(8,145,178,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
                      Card sorting analysis
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">
                      Set shifting and perseveration
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      PsyLattice transparent scoring — not the proprietary official WCST scoring system.
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-900">
                    Deterministic
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    [summary.card_sorting.categories_completed, "Categories"],
                    [summary.card_sorting.perseverative_errors, "Perseverative errors"],
                    [summary.card_sorting.nonperseverative_errors, "Other errors"],
                    [summary.card_sorting.failures_to_maintain_set, "Failure to maintain set"],
                    [
                      summary.card_sorting.trials_to_first_category ?? "—",
                      "Trials to first category",
                    ],
                  ].map(([value, label]) => (
                    <div
                      key={String(label)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-lg font-semibold text-slate-950">
                        {String(value)}
                      </p>
                      <p className="mt-1 text-[9px] text-slate-400">
                        {String(label)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-left text-[10px]">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Category</th>
                        <th className="px-3 py-2 font-semibold">Rule</th>
                        <th className="px-3 py-2 font-semibold">Trials</th>
                        <th className="px-3 py-2 font-semibold">Errors</th>
                        <th className="px-3 py-2 font-semibold">Perseverative</th>
                        <th className="px-3 py-2 font-semibold">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.card_sorting.category_summaries.map((category: any) => (
                        <tr
                          key={category.category_index}
                          className="border-t border-slate-100 text-slate-700"
                        >
                          <td className="px-3 py-2">{category.category_index}</td>
                          <td className="px-3 py-2 capitalize">{category.rule}</td>
                          <td className="px-3 py-2">{category.trials}</td>
                          <td className="px-3 py-2">{category.errors}</td>
                          <td className="px-3 py-2">{category.perseverative_errors}</td>
                          <td className="px-3 py-2">{category.completed ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {Array.isArray(summary.card_sorting.quality_flags) &&
                  summary.card_sorting.quality_flags.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {summary.card_sorting.quality_flags.map((flag: any) => (
                        <div
                          key={flag.code}
                          className="pl-inline-warning text-[11px] leading-5"
                        >
                          {flag.message}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {summary.corsi && (
              <div className="mt-3 rounded-[24px] border border-cyan-200/80 bg-white p-5 shadow-[0_10px_28px_rgba(8,145,178,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
                      Corsi analysis
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">
                      Visuospatial span summary
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Span is the longest correctly reproduced sequence. Product score = span × total correct sequences for that mode.
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-900">
                    Deterministic
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    [summary.corsi.forward?.span ?? "—", "Forward span"],
                    [summary.corsi.backward?.span ?? "—", "Backward span"],
                    [summary.corsi.forward?.product_score ?? "—", "Forward product"],
                    [summary.corsi.backward?.product_score ?? "—", "Backward product"],
                    [
                      summary.corsi.overall_sequence_accuracy === null
                        ? "—"
                        : `${Math.round(summary.corsi.overall_sequence_accuracy * 100)}%`,
                      "Sequence accuracy",
                    ],
                  ].map(([value, label]) => (
                    <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-lg font-semibold text-slate-950">{String(value)}</p>
                      <p className="mt-1 text-[9px] text-slate-400">{String(label)}</p>
                    </div>
                  ))}
                </div>

                {Array.isArray(summary.corsi.quality_flags) && summary.corsi.quality_flags.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {summary.corsi.quality_flags.map((flag: any) => (
                      <div key={flag.code} className="pl-inline-warning text-[11px] leading-5">
                        {flag.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {summary.stop_signal && (
              <div className="mt-3 rounded-[24px] border border-cyan-200/80 bg-white p-5 shadow-[0_10px_28px_rgba(8,145,178,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Stop-Signal analysis</p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">Adaptive inhibition summary</h3>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      SSRT uses the integration method with Go-omission replacement. Practice trials are excluded.
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-[10px] font-semibold text-cyan-900">
                    Deterministic
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    [summary.stop_signal.ssrt_integration_ms === null ? "—" : `${summary.stop_signal.ssrt_integration_ms} ms`, "SSRT"],
                    [summary.stop_signal.mean_ssd_ms === null ? "—" : `${summary.stop_signal.mean_ssd_ms} ms`, "Mean SSD"],
                    [summary.stop_signal.stop_success_rate === null ? "—" : `${Math.round(summary.stop_signal.stop_success_rate * 100)}%`, "Stop success"],
                    [summary.stop_signal.mean_go_rt_ms === null ? "—" : `${summary.stop_signal.mean_go_rt_ms} ms`, "Mean Go RT"],
                    [`${summary.stop_signal.stop_trials}`, "Stop trials"],
                  ].map(([value, label]) => (
                    <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-lg font-semibold text-slate-950">{String(value)}</p>
                      <p className="mt-1 text-[9px] text-slate-400">{String(label)}</p>
                    </div>
                  ))}
                </div>
                {Array.isArray(summary.stop_signal.quality_flags) && summary.stop_signal.quality_flags.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {summary.stop_signal.quality_flags.map((flag: any) => (
                      <div key={flag.code} className="pl-inline-warning text-[11px] leading-5">
                        {flag.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">Timing diagnostics</p><p className="mt-1 text-[11px] text-slate-500">{refreshMode === "auto" ? "Automatic calibration" : "Manual refresh override"} · {effectiveRefreshHz ? `${round(effectiveRefreshHz, 1)} Hz` : "timer fallback"} · Visibility interruptions: {visibilityInterruptions}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${visibilityInterruptions === 0 && refreshStable !== false ? "border border-cyan-200 bg-cyan-50 text-cyan-900 shadow-[0_6px_16px_rgba(8,145,178,0.07)]" : "border border-violet-200 bg-violet-50 text-violet-900 shadow-[0_6px_16px_rgba(124,58,237,0.07)]"}`}>{visibilityInterruptions === 0 && refreshStable !== false ? "Timing conditions clean" : "Review timing"}</span></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] text-slate-400">Detected display</p><p className="mt-1 text-sm font-semibold text-slate-800">{preflight.refresh_hz ? `${preflight.refresh_hz} Hz` : "—"}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] text-slate-400">Refresh stability</p><p className="mt-1 text-sm font-semibold text-slate-800">{preflight.refresh_stability === null ? "—" : `${Math.round(preflight.refresh_stability * 100)}%`}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] text-slate-400">Frame-timed components</p><p className="mt-1 text-sm font-semibold text-slate-800">{results.flatMap((result) => result.component_timings).filter((timing) => timing.timing_mode === "frame").length}</p></div>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Visual durations are scheduled in whole display frames when calibration is available. PsyLattice also stores requested milliseconds, target frames, observed duration and display diagnostics. Browser and hardware factors can still introduce timing variability.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => { setPhase("preflight"); setSessionId(""); setResults([]); setSummary(null); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.10)]"><RotateCcw className="h-4 w-4" /> Run another preview</button>
              <button type="button" onClick={() => void exitPreview()} className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-semibold text-white">Back to Task Builder</button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="mx-auto max-w-3xl px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><AlertTriangle className="h-5 w-5" /></div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">Preview stopped</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{error || "The preview could not continue."}</p>
            <div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => { setPhase("preflight"); setError(""); }} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700">Return to preflight</button><button type="button" onClick={() => void exitPreview()} className="rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white">Close</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
