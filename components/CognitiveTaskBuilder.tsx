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

type EditorTab = "timeline" | "trials" | "randomization" | "scoring";

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
      className={`mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-cyan-400 ${props.className || ""}`}
    />
  );
}

function SelectField(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-cyan-400 ${props.className || ""}`}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-cyan-600" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
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
    setDirty(false);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedBlock = blocks.find((block) => block.local_id === selectedBlockId) || null;
  const selectedComponent = selectedBlock?.components.find((component) => component.local_id === selectedComponentId) || null;

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
      <div className="flex min-h-[520px] items-center justify-center rounded-[28px] border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading Task Builder…</div>
      </div>
    );
  }

  if (!task || !version) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {notice?.text || "This cognitive task could not be opened."}
      </div>
    );
  }

  const locked = version.status !== "draft";

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-start gap-4">
            <button type="button" onClick={back} className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950" aria-label="Back to Cognitive Lab">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Cognitive Task Builder · Phase 1D Beta</span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${locked ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{version.version_label} · {version.status}</span>
                {dirty && <span className="text-[10px] font-semibold text-amber-700">Unsaved changes</span>}
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
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <Monitor className="h-4 w-4" />
              {dirty ? "Save to preview" : "Preview task"}
            </button>
            <button type="button" onClick={() => void save()} disabled={saving || locked} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </button>
          </div>
        </div>

        {notice && (
          <div className={`border-b px-5 py-3 text-xs ${notice.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-red-100 bg-red-50 text-red-700"}`}>
            {notice.text}
          </div>
        )}

        <div className="grid min-h-[720px] lg:grid-cols-[245px_minmax(0,1fr)_310px]">
          {/* Structure */}
          <aside className="border-b border-slate-200 bg-slate-50/70 p-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Structure</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Blocks</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBlockMenuOpen((open) => !open)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-cyan-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Add block <ChevronDown className="h-3 w-3" />
                </button>
                {blockMenuOpen && (
                  <div className="absolute right-0 top-11 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
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
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {blocks.map((block, index) => {
                const active = block.local_id === selectedBlockId;
                return (
                  <button key={block.local_id} type="button" onClick={() => { setSelectedBlockId(block.local_id); setSelectedComponentId(""); }} className={`w-full rounded-2xl border p-3 text-left transition ${active ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white hover:border-cyan-200"}`}>
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${active ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-500"}`}>{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900">{block.name}</p>
                        <p className="mt-1 text-[10px] capitalize text-slate-400">{block.block_type.replace("_", " ")} · {block.components.length} steps · {block.trials.length} rows</p>
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

            {selectedBlock && (
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
            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
              {[
                ["timeline", "Trial timeline", Layers3],
                ["trials", "Trial table", ListChecks],
                ["randomization", "Randomisation", Shuffle],
                ["scoring", "Scoring & devices", BarChart3],
              ].map(([id, label, Icon]) => (
                <button key={id as string} type="button" onClick={() => setEditorTab(id as EditorTab)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${editorTab === id ? "bg-white text-cyan-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-900"}`}>
                  <Icon className="h-3.5 w-3.5" /> {label as string}
                </button>
              ))}
            </div>

            {!selectedBlock ? (
              <div className="mt-5 flex min-h-[480px] items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-slate-50/50 text-center">
                <div className="max-w-sm px-6"><Layers3 className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-800">Add or select a block</p><p className="mt-1 text-xs leading-5 text-slate-500">Blocks define the participant journey. Trial-level stimuli and responses live inside Practice and Experimental blocks.</p></div>
              </div>
            ) : editorTab === "timeline" ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">{selectedBlock.name}</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Trial timeline</h3><p className="mt-1 text-xs text-slate-500">Components run in order for each trial row in this block.</p></div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={addCommonTrial}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-100"
                      title="Adds Fixation → Stimulus → Response → ITI"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Quick trial
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setComponentMenuOpen((open) => !open)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white"
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
                      <button key={component.local_id} type="button" onClick={() => setSelectedComponentId(component.local_id)} className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${active ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white hover:border-cyan-200"}`}>
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
          <aside className="border-t border-slate-200 bg-slate-50/70 p-4 lg:border-l lg:border-t-0">
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
                  {selectedBlock.block_type === "instructions" && <label className="block"><FieldLabel>Instruction screen text</FieldLabel><textarea value={String(selectedBlock.config.screen_text || "")} onChange={(event) => updateBlock(selectedBlock.local_id, { config: { ...selectedBlock.config, screen_text: event.target.value } })} rows={6} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400" /></label>}
                  {selectedBlock.block_type === "practice" && <PracticeSettings block={selectedBlock} onChange={(continue_rule) => updateBlock(selectedBlock.local_id, { continue_rule })} />}
                </>
              ) : (
                <>
                  <label className="block"><FieldLabel>Task title</FieldLabel><TextField value={task.title} onChange={(event) => updateTask({ title: event.target.value })} /></label>
                  <label className="block"><FieldLabel>Domain</FieldLabel><SelectField value={task.domain} onChange={(event) => updateTask({ domain: event.target.value })}>{DOMAINS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
                  <label className="block"><FieldLabel>Description</FieldLabel><textarea value={task.description} onChange={(event) => updateTask({ description: event.target.value })} rows={5} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400" /></label>
                </>
              )}

              <div className="border-t border-slate-200 pt-4">
                <button type="button" onClick={() => { setSelectedComponentId(""); setSelectedBlockId(""); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600">Task-level settings</button>
              </div>

              <label className="block"><FieldLabel>Participant instructions</FieldLabel><textarea value={version.participant_instructions || ""} onChange={(event) => updateVersion("participant_instructions", event.target.value)} rows={5} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400" /></label>

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
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-amber-800">Practice criteria</p>
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
          {type === "html" && <label className="block"><FieldLabel>HTML content</FieldLabel><textarea value={String(config.html || "")} onChange={(event) => onConfig("html", event.target.value)} rows={8} className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs outline-none focus:border-cyan-400" /></label>}
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
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-800"><Check className="h-3.5 w-3.5" /> Response keys update automatically</div>
                <p className="mt-1 text-[10px] leading-4 text-emerald-700">PsyLattice reads the unique responses in <strong>{correctVariable || "correct"}</strong>. Change the Trial Table and the accepted keys change with it when you save.</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {automaticResponses.map((response) => <span key={response} className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-emerald-900">{response === "space" ? "SPACE" : response.toUpperCase()}</span>)}
                  {hasNoResponseRows && <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-800">NO RESPONSE</span>}
                  {automaticResponses.length === 0 && !hasNoResponseRows && <span className="text-[10px] text-emerald-700">Add values to this Trial Table column.</span>}
                </div>
                {hasNoResponseRows && <p className="mt-2 text-[10px] leading-4 text-amber-700">A blank cell in the correct-response column means the participant should withhold their response for that trial.</p>}
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

      <label className="block"><FieldLabel>Maximum response time</FieldLabel><div className="mt-1.5 flex items-center gap-2"><input type="number" min="0" value={safeNumber(config.deadline_ms, 1500)} onChange={(event) => onConfig("deadline_ms", safeNumber(event.target.value, 1500))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-400" /><span className="text-xs font-medium text-slate-400">ms</span></div></label>
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
