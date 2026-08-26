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
  participant_instructions: string;
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
  actual_ms: number;
  started_at_ms: number;
  ended_at_ms: number;
};

type PilotTrialResult = {
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
  | { kind: "html"; html: string };

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

async function estimateRefreshRate() {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    return { refresh_hz: null, frame_interval_ms: null };
  }
  const stamps: number[] = [];
  await new Promise<void>((resolve) => {
    const step = (stamp: number) => {
      stamps.push(stamp);
      if (stamps.length >= 36) resolve();
      else window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  });
  const intervals = stamps.slice(1).map((stamp, index) => stamp - stamps[index]).filter((value) => value > 0 && value < 100);
  const med = median(intervals);
  return {
    refresh_hz: med ? round(1000 / med, 1) : null,
    frame_interval_ms: med ? round(med, 3) : null,
  };
}

function deviceClass(): Preflight["device_class"] {
  if (typeof window === "undefined") return "desktop";
  const width = Math.min(window.screen.width, window.screen.height);
  if (width < 600) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

function buildSummary(results: PilotTrialResult[]) {
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
    scorable_trials: scorable.length,
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
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${ok ? "border-cyan-200/80 bg-cyan-50/60 text-cyan-900 shadow-[0_4px_14px_rgba(8,145,178,0.06)]" : "border-slate-200 bg-white text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.045)]"}`}>
      {ok ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {children}
    </div>
  );
}

export default function CognitivePilotRunner({
  token,
  onClose,
}: {
  token: string;
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
  const [results, setResults] = useState<PilotTrialResult[]>([]);
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [savingResults, setSavingResults] = useState(false);
  const [visibilityInterruptions, setVisibilityInterruptions] = useState(0);
  const cancelledRef = useRef(false);
  const responseHandlerRef = useRef<((value: string, eventTime: number) => void) | null>(null);
  const continueRef = useRef<(() => void) | null>(null);

  const loadDefinition = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("psylattice_public_cognitive_pilot", {
      p_token: token,
    });

    const payload = (data || {}) as any;
    if (rpcError || payload?.ok !== true || !payload?.snapshot) {
      setError(rpcError?.message || payload?.error || "This pilot link could not be loaded.");
      setPhase("error");
      setLoading(false);
      return;
    }

    const snapshot = payload.snapshot as any;
    const taskData = snapshot.task as TaskRow | undefined;
    const versionData = snapshot.version as VersionRow | undefined;
    const blockRows = Array.isArray(snapshot.blocks) ? snapshot.blocks : [];

    if (!taskData || !versionData) {
      setError("This pilot definition is incomplete.");
      setPhase("error");
      setLoading(false);
      return;
    }

    const nextBlocks: RunnerBlock[] = blockRows.map((row: any) => ({
      id: String(row.id || row.block_key || Math.random()),
      block_key: String(row.block_key || "block"),
      name: String(row.name || "Block"),
      block_type: row.block_type,
      position: Number(row.position || 0),
      repeat_count: Math.max(1, Number(row.repeat_count || 1)),
      continue_rule: (row.continue_rule || {}) as Record<string, unknown>,
      config: (row.config || {}) as Record<string, unknown>,
      components: (Array.isArray(row.components) ? row.components : []).map((component: any) => ({
        id: String(component.id || component.component_key || Math.random()),
        component_key: String(component.component_key || "component"),
        component_type: component.component_type as ComponentType,
        position: Number(component.position || 0),
        config: (component.config || {}) as Record<string, unknown>,
      })),
      trials: (Array.isArray(row.trials) ? row.trials : []).map((trial: any) => ({
        id: String(trial.id || Math.random()),
        position: Number(trial.position || 0),
        condition_label: String(trial.condition_label || ""),
        variables: Object.fromEntries(Object.entries(trial.variables || {}).map(([key, value]) => [key, String(value ?? "")])),
        weight: Number(trial.weight ?? 1),
        enabled: trial.enabled !== false,
      })),
    }));

    setTask(taskData);
    setVersion(versionData);
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
  }, [token]);

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

  const deviceAllowed = useMemo(() => {
    if (!version) return true;
    const config = version.device_config || {};
    if (preflight.device_class === "phone") return config.phone !== false;
    if (preflight.device_class === "tablet") return config.tablet !== false;
    return config.desktop !== false && config.laptop !== false;
  }, [preflight.device_class, version]);

  const canStart = !loading && !!task && !!version && blocks.length > 0 && preflight.timing_api && preflight.animation_frame && deviceAllowed;

  async function requestFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
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
    if (earlyPromise) {
      await Promise.race([sleep(requestedMs), earlyPromise]);
    } else {
      await sleep(requestedMs);
    }
    const end = performance.now();
    return {
      key,
      type,
      requested_ms: requestedMs,
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
    const allowed = Array.isArray(config.allowed_responses) ? config.allowed_responses.map((value) => normalizeKey(String(value))) : [];
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
        const correctVariable = text(config.correct_variable, "correct");
        const configuredCorrect = text(config.correct_value, "");
        const expectedRaw = resolveVariable(variables, correctVariable, configuredCorrect);
        const expected = normalizeKey(expectedRaw.trim());
        const rt = anchor !== null && responseTime !== null ? responseTime - anchor : null;
        let correct: boolean | null = null;
        if (input !== "none") {
          correct = expected ? response === expected : response === null;
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
    const anchorKey = text(responseConfig.rt_anchor, "stimulus");
    const deadline = Math.max(0, numeric(responseConfig.deadline_ms, 1500));
    const timings: ComponentTiming[] = [];
    let anchorStartedAt: number | null = null;

    for (const component of components) {
      if (cancelledRef.current) throw new Error("Pilot cancelled");
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
          component.component_key === anchorKey && anchorStartedAt === null
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
          component.component_key === anchorKey && anchorStartedAt === null
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
          component.component_key === anchorKey && anchorStartedAt === null
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
          component.component_key === anchorKey && anchorStartedAt === null
            ? (timestamp) => { anchorStartedAt = timestamp; controller.startAnchor(timestamp); }
            : undefined
        ));
      } else if (component.component_type === "audio") {
        const url = resolveVariable(trial.variables, config.asset_variable, text(config.asset_url));
        const duration = Math.max(0, numeric(config.duration_ms, 0));
        setDisplay({ kind: "audio", url });
        const start = performance.now();
        if (duration > 0) await sleep(duration);
        else await sleep(50);
        const end = performance.now();
        timings.push({ key: component.component_key, type: component.component_type, requested_ms: duration || null, actual_ms: end - start, started_at_ms: start, ended_at_ms: end });
      } else if (component.component_type === "video") {
        const url = resolveVariable(trial.variables, config.asset_variable, text(config.asset_url));
        timings.push(await runTimedDisplay(
          { kind: "video", url },
          Math.max(50, numeric(config.duration_ms, 1000)),
          component.component_key,
          component.component_type,
          undefined,
          component.component_key === anchorKey && anchorStartedAt === null
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
          component.component_key === anchorKey && anchorStartedAt === null
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
    } satisfies PilotTrialResult;
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
      refresh_hz: preflight.refresh_hz,
    };
    const { data, error: rpcError } = await supabase.rpc("psylattice_start_cognitive_pilot", {
      p_token: token,
      p_device_info: device,
    });
    if (rpcError) throw new Error(rpcError.message);
    const id = typeof data === "object" && data ? String((data as any).session_id || "") : "";
    if (!id) throw new Error("Pilot session could not be created.");
    setSessionId(id);
    return { id, device };
  }

  async function completeSession(id: string, trialResults: PilotTrialResult[], finalSummary: Record<string, any>, device: Record<string, any>) {
    setSavingResults(true);
    const allTimings = trialResults.flatMap((result) => result.component_timings);
    const drifts = allTimings
      .filter((timing) => timing.requested_ms !== null)
      .map((timing) => timing.actual_ms - (timing.requested_ms || 0));
    const timingQuality = {
      engine: "psylattice_browser_pilot_v1",
      clock: "performance.now",
      refresh_hz: preflight.refresh_hz,
      frame_interval_ms: preflight.frame_interval_ms,
      visibility_interruptions: visibilityInterruptions,
      assets_total: preflight.assets_total,
      assets_failed: preflight.assets_failed.length,
      mean_timer_drift_ms: round(mean(drifts), 3),
      median_timer_drift_ms: round(median(drifts), 3),
      component_timing_observations: drifts.length,
      note: "Browser timing diagnostics describe this pilot environment; they do not guarantee laboratory hardware timing precision.",
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
    const { error: rpcError } = await supabase.rpc("psylattice_complete_cognitive_pilot", {
      p_token: token,
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

  async function startPilot() {
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
        return sum + expandedTrials(block.trials).length * Math.max(1, block.repeat_count);
      }, 0);
      setProgress({ current: 0, total: totalPlanned, block: "" });

      const collected: PilotTrialResult[] = [];
      let globalIndex = 0;

      for (const block of [...blocks].sort((a, b) => a.position - b.position)) {
        if (cancelledRef.current) throw new Error("Pilot cancelled");
        const screenText = text(block.config.screen_text, "").trim();
        if (["instructions", "break", "end"].includes(block.block_type) && block.trials.length === 0) {
          const defaultText = block.block_type === "break" ? "Take a short break. Continue when you are ready." : block.block_type === "end" ? "This task is complete." : "Continue when you are ready.";
          await showMessage(block.name, screenText || defaultText, block.block_type === "end" ? "Finish" : "Continue");
          continue;
        }

        for (let repeat = 1; repeat <= Math.max(1, block.repeat_count); repeat += 1) {
          let attempt = 1;
          const maxAttempts = block.block_type === "practice" ? Math.max(1, numeric(block.continue_rule.max_attempts, 3)) : 1;
          let practiceDone = false;

          while (!practiceDone && attempt <= maxAttempts) {
            const trials = orderedTrials(block, version.randomization_config || {}, `${runSeed}:${repeat}:${attempt}`);
            const attemptResults: PilotTrialResult[] = [];
            setProgress((current) => ({ ...current, block: block.name }));

            for (const trial of trials) {
              globalIndex += 1;
              setProgress((current) => ({ current: globalIndex, total: Math.max(current.total, globalIndex), block: block.name }));
              const result = await runTrial(block, trial, globalIndex, attempt, repeat);
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
      const finalSummary = buildSummary(collected);
      setSummary(finalSummary);
      await completeSession(id, collected, finalSummary, device);
      setPhase("complete");
      setDisplay({ kind: "blank" });
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Pilot could not be completed.";
      if (message !== "Pilot cancelled") setError(message);
      setPhase(message === "Pilot cancelled" ? "preflight" : "error");
      setDisplay({ kind: "blank" });
    } finally {
      responseHandlerRef.current = null;
      continueRef.current = null;
      setResponseOptions([]);
    }
  }

  async function exitPilot() {
    cancelledRef.current = true;
    responseHandlerRef.current = null;
    continueRef.current?.();
    continueRef.current = null;
    if (sessionId && phase === "running") {
      const supabase = createClient();
      await supabase.rpc("psylattice_abandon_cognitive_pilot", { p_token: token, p_session_id: sessionId });
    }
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* optional */ }
    }
    onClose();
  }

  const progressPercent = progress.total > 0 ? Math.min(100, (progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/48 p-3 backdrop-blur-md sm:p-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_26px_80px_rgba(15,23,42,0.22),0_5px_20px_rgba(8,145,178,0.08)] sm:min-h-[calc(100vh-40px)]">
        <header className="m-3 flex items-center justify-between gap-4 rounded-[22px] border border-slate-200/90 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.075),0_2px_8px_rgba(8,145,178,0.045)] sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => void exitPilot()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition hover:-translate-y-px hover:border-cyan-200 hover:text-cyan-900" aria-label="Exit pilot">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Pilot session</span>
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
          <button type="button" onClick={() => void exitPilot()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition hover:-translate-y-px hover:border-rose-200 hover:text-rose-700" aria-label="Close pilot">
            <X className="h-4 w-4" />
          </button>
        </header>

        {phase === "preflight" && (
          <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="grid gap-7 lg:grid-cols-[1fr_.8fr] lg:items-start">
              <section>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-900 shadow-[0_5px_16px_rgba(8,145,178,0.10)]"><Gauge className="h-3.5 w-3.5" /> Timing preflight</span>
                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Run this PsyLattice cognitive pilot.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">This pilot uses an immutable snapshot of the researcher’s saved task. PsyLattice will execute its blocks and trial rows in your browser, record responses with <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">performance.now()</code>, and store this run separately as Pilot data.</p>
                <div className="mt-6 rounded-[20px] border border-cyan-200/80 bg-cyan-50/55 p-4 text-xs leading-5 text-slate-700 shadow-[0_8px_22px_rgba(8,145,178,0.06)]"><strong>Timing note:</strong> browser measurements can be high resolution, but operating-system scheduling, display hardware, browser load and input devices still affect observed timing. Pilot timing diagnostics help the researcher evaluate the task before live study deployment.</div>
              </section>

              <section className="rounded-[26px] border border-slate-200/90 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.08),0_2px_8px_rgba(8,145,178,0.04)]">
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
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_5px_16px_rgba(15,23,42,0.05)]"><p className="text-[10px] text-slate-400">Estimated refresh</p><p className="mt-1 text-lg font-semibold text-slate-900">{preflight.refresh_hz ? `${preflight.refresh_hz} Hz` : "—"}</p></div>
                      <div className="rounded-[18px] border border-slate-200 bg-white p-3 shadow-[0_5px_16px_rgba(15,23,42,0.05)]"><p className="text-[10px] text-slate-400">Frame interval</p><p className="mt-1 text-lg font-semibold text-slate-900">{preflight.frame_interval_ms ? `${preflight.frame_interval_ms} ms` : "—"}</p></div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            {error && <div className="mt-5 border-l-2 border-rose-400 py-1 pl-3 text-sm text-rose-700">{error}</div>}

            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => void requestFullscreen()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.07)] transition hover:-translate-y-px hover:border-cyan-200"><Expand className="h-4 w-4" /> Enter fullscreen</button>
              <button type="button" onClick={() => void startPilot()} disabled={!canStart || !preflight.visibility_ok} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"><Play className="h-4 w-4" /> Start pilot</button>
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="relative flex min-h-[calc(100vh-105px)] items-center justify-center overflow-hidden bg-[#f7f8f8] px-5 py-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-slate-200" />
            <div className="w-full max-w-5xl text-center">
              {display.kind === "message" && (
                <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200/90 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.11),0_3px_12px_rgba(8,145,178,0.045)] sm:p-9">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{display.title}</h2>
                  <p className="mx-auto mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{display.text}</p>
                  <button type="button" onClick={() => continueRef.current?.()} className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)] transition hover:-translate-y-px">{display.actionLabel || "Continue"}</button>
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

              {responseOptions.length > 0 && display.kind !== "message" && (
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  {responseOptions.map((option) => (
                    <button key={option} type="button" onPointerDown={() => responseHandlerRef.current?.(option, performance.now())} className="min-w-20 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_7px_20px_rgba(15,23,42,0.08)] transition hover:-translate-y-px hover:border-cyan-300 hover:shadow-[0_8px_24px_rgba(8,145,178,0.10)]">{option === "space" ? "Space" : option}</button>
                  ))}
                </div>
              )}

              {responseOptions.length === 0 && display.kind !== "message" && (
                <div className="fixed bottom-7 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-medium text-slate-400 shadow-sm backdrop-blur"><Keyboard className="mr-1.5 inline h-3 w-3" /> Use the configured response keys</div>
              )}
            </div>
          </div>
        )}

        {phase === "complete" && summary && (
          <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-900 shadow-[0_5px_16px_rgba(8,145,178,0.10)]">Pilot submitted</span><h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Pilot complete.</h2><p className="mt-2 text-sm text-slate-500">Your pilot results were submitted. They are kept separate from final Study participation.</p></div>
              {savingResults && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Saving diagnostics…</div>}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [String(summary.trials ?? 0), "Trials", TimerReset],
                [summary.accuracy === null ? "—" : `${Math.round(Number(summary.accuracy) * 100)}%`, "Accuracy", Check],
                [summary.mean_rt_ms === null ? "—" : `${summary.mean_rt_ms} ms`, "Mean RT", Gauge],
                [preflight.refresh_hz ? `${preflight.refresh_hz} Hz` : "—", "Display estimate", Monitor],
              ].map(([value, label, Icon]) => (
                <div key={String(label)} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.07)]"><Icon className="h-4 w-4 text-cyan-700" /><p className="mt-4 text-2xl font-semibold text-slate-950">{String(value)}</p><p className="mt-1 text-[11px] text-slate-400">{String(label)}</p></div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
              <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-900">Timing diagnostics</p><p className="mt-1 text-[11px] text-slate-500">Visibility interruptions: {visibilityInterruptions}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${visibilityInterruptions === 0 ? "border border-cyan-200 bg-cyan-50 text-cyan-900" : "border border-slate-200 bg-white text-slate-600"}`}>{visibilityInterruptions === 0 ? "Clean pilot" : "Review timing"}</span></div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Pilot sessions help validate task logic, usability and timing conditions across real participant hardware. Browser measurements remain hardware- and environment-dependent.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => { setPhase("preflight"); setSessionId(""); setResults([]); setSummary(null); }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.07)] transition hover:-translate-y-px hover:border-cyan-200"><RotateCcw className="h-4 w-4" /> Run pilot again</button>
              <button type="button" onClick={() => void exitPilot()} className="rounded-full bg-slate-950 px-5 py-3 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)] transition hover:-translate-y-px">Exit pilot</button>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="mx-auto max-w-3xl px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-white text-rose-700 shadow-[0_7px_20px_rgba(190,24,93,0.07)]"><AlertTriangle className="h-5 w-5" /></div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">Pilot stopped</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{error || "The pilot could not continue."}</p>
            <div className="mt-6 flex justify-center gap-3"><button type="button" onClick={() => { setPhase("preflight"); setError(""); }} className="rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.07)]">Return to device check</button><button type="button" onClick={() => void exitPilot()} className="rounded-full bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)]">Close</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
