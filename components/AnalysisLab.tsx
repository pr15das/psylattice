"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Copy,
  Database,
  FileSpreadsheet,
  Gauge,
  Layers3,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import {
  analysisLevelLabel,
  computeCorrelationMatrix,
  computeFrequencyTable,
  computeIndependentTTest,
  computeNumericDescriptives,
  computeOneWayAnova,
  computePairedTTest,
  computeRepeatedMeasuresAnova,
  computeLinearRegression,
  computeReliability,
  getVariableLevels,
  inferAnalysisVariables,
  isDescriptiveSelectable,
  parseCsvDataset,
  type AnalysisCodebookVariable,
  type AnalysisRow,
  type AnalysisVariable,
  type CorrelationMethod,
  type IndependentTTestEstimator,
  type NumericDescriptives,
  type OneWayAnovaEstimator,
} from "@/lib/research/analysisLab";

type AnalysisLabStudyOption = {
  value: string;
  label: string;
};

type AnalysisLabDatasetOption = {
  value: string;
  label: string;
  eyebrow?: string;
  description?: string;
  recommended?: boolean;
};

type AnalysisLabProps = {
  rows: AnalysisRow[];
  codebook?: AnalysisCodebookVariable[];
  datasetLabel: string;
  studyTitle?: string;
  datasetKey?: string;
  studyOptions?: AnalysisLabStudyOption[];
  selectedStudyId?: string;
  onStudyChange?: (value: string) => void;
  datasetOptions?: AnalysisLabDatasetOption[];
  selectedDatasetValue?: string;
  onDatasetChange?: (value: string) => void;
  includeTestData?: boolean;
  onIncludeTestDataChange?: (value: boolean) => void;
  identityModeLabel?: string;
};

type DescriptiveOptionKey =
  | "n"
  | "missing"
  | "mean"
  | "median"
  | "sd"
  | "variance"
  | "min"
  | "max"
  | "quartiles"
  | "ci95"
  | "skewness"
  | "kurtosis";

type ActiveAnalysis = "descriptives" | "correlations" | "ttests" | "anova" | "regression" | "reliability";
type TTestMode = "independent" | "paired";
type AnovaMode = "between" | "repeated";

const defaultOptions: Record<DescriptiveOptionKey, boolean> = {
  n: true,
  missing: true,
  mean: true,
  median: true,
  sd: true,
  variance: false,
  min: true,
  max: true,
  quartiles: true,
  ci95: false,
  skewness: false,
  kurtosis: false,
};

const analysisCatalogue = [
  {
    id: "descriptives",
    title: "Descriptives",
    description: "Summaries, distributions and frequencies",
    available: true,
  },
  {
    id: "correlations",
    title: "Correlations",
    description: "Pearson and Spearman associations",
    available: true,
  },
  {
    id: "ttests",
    title: "T-tests",
    description: "Independent and paired comparisons",
    available: true,
  },
  {
    id: "anova",
    title: "ANOVA",
    description: "One-way, Welch and repeated measures",
    available: true,
  },
  {
    id: "regression",
    title: "Regression",
    description: "Multiple linear models and diagnostics",
    available: true,
  },
  {
    id: "reliability",
    title: "Reliability",
    description: "Cronbach’s α, item-rest and scale diagnostics",
    available: true,
  },
];

function formatNumber(value: number | null, digits = 3) {
  if (value === null || !Number.isFinite(value)) return "—";

  if (
    Math.abs(value) >= 10000 ||
    (Math.abs(value) > 0 && Math.abs(value) < 0.001)
  ) {
    return value.toExponential(2);
  }

  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

function variableTone(variable: AnalysisVariable) {
  switch (variable.level) {
    case "continuous":
      return "border-cyan-200/80 bg-cyan-50 text-cyan-800";
    case "ordinal":
      return "border-violet-200/80 bg-violet-50 text-violet-700";
    case "nominal":
    case "boolean":
      return "border-indigo-200/80 bg-indigo-50 text-indigo-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-500";
  }
}

function VariableTypePill({ variable }: { variable: AnalysisVariable }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-[0.02em] ${variableTone(
        variable
      )}`}
    >
      {analysisLevelLabel(variable.level)}
    </span>
  );
}

function escapeTsv(value: string) {
  return value.replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

function formatPValue(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value < 0.001) return "< .001";
  return value.toFixed(3).replace(/^0/, "");
}

function correlationStrengthLabel(value: number | null) {
  if (value === null) return "Unavailable";
  const absolute = Math.abs(value);
  if (absolute >= 0.7) return "Strong";
  if (absolute >= 0.4) return "Moderate";
  if (absolute >= 0.2) return "Small";
  return "Very small";
}

function metadataSaysReverseScored(value: unknown) {
  if (value === true) return true;
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "reverse", "reversed", "reverse_scored"].includes(normalized);
}


type FormattedTableSpec = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  note?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function tablePlainText(table: FormattedTableSpec) {
  const lines = [
    table.title,
    ...(table.subtitle ? [table.subtitle] : []),
    table.headers.map(escapeTsv).join("\t"),
    ...table.rows.map((row) => row.map(escapeTsv).join("\t")),
  ];
  if (table.note) lines.push(`Note. ${table.note}`);
  return lines.join("\n");
}

function tableHtml(table: FormattedTableSpec) {
  const cleanTitle = table.title.replace(/^Table\s*[·:\-–—]\s*/i, "").trim();
  const columnCount = Math.max(1, table.headers.length);
  const firstColumnWidth = columnCount <= 2 ? 42 : columnCount === 3 ? 34 : 28;
  const remainingWidth = columnCount > 1 ? (100 - firstColumnWidth) / (columnCount - 1) : 100;

  const colgroup =
    columnCount === 1
      ? `<col style="width:100%;">`
      : `<col style="width:${firstColumnWidth}%;">${Array.from(
          { length: columnCount - 1 },
          () => `<col style="width:${remainingWidth}%;">`
        ).join("")}`;

  const headerStyle =
    "border:0;border-top:1.5px solid #111827;border-bottom:1px solid #111827;padding:5pt 6pt;text-align:left;vertical-align:bottom;font-size:9.5pt;line-height:1.25;font-weight:600;color:#111827;background:transparent;overflow-wrap:anywhere;";
  const bodyStyle =
    "border:0;padding:4.5pt 6pt;text-align:left;vertical-align:top;font-size:9.5pt;line-height:1.3;color:#111827;background:transparent;overflow-wrap:anywhere;";

  return `
<div data-psylattice-analysis-table="true" style="font-family:'Times New Roman',Times,serif;color:#111827;max-width:100%;margin:0.2em 0 0.9em 0;">
  <div style="font-size:10pt;line-height:1.25;font-weight:700;margin:0 0 2pt 0;">Table</div>
  <div style="font-size:10pt;line-height:1.3;font-style:italic;margin:0 0 7pt 0;">${escapeHtml(cleanTitle)}</div>
  ${
    table.subtitle
      ? `<div style="font-size:9pt;line-height:1.3;margin:-3pt 0 7pt 0;color:#475569;">${escapeHtml(table.subtitle)}</div>`
      : ""
  }
  <table data-psylattice-analysis-output="true" style="border:0;border-collapse:collapse;border-spacing:0;width:100%;max-width:100%;margin:0;table-layout:fixed;background:transparent;">
    <colgroup>${colgroup}</colgroup>
    <thead>
      <tr>${table.headers
        .map((header, index) => `<th style="${headerStyle}${index > 0 ? "text-align:center;" : ""}">${escapeHtml(header)}</th>`)
        .join("")}</tr>
    </thead>
    <tbody>${table.rows
      .map((row, rowIndex) => {
        const isLast = rowIndex === table.rows.length - 1;
        return `<tr>${row
          .map(
            (cell, index) =>
              `<td style="${bodyStyle}${index === 0 ? "font-weight:400;" : "text-align:center;font-variant-numeric:tabular-nums;"}${
                isLast ? "border-bottom:1.5px solid #111827;" : ""
              }">${escapeHtml(cell)}</td>`
          )
          .join("")}</tr>`;
      })
      .join("")}</tbody>
  </table>
  ${
    table.note
      ? `<div style="font-size:9pt;line-height:1.35;color:#374151;margin-top:6pt;"><span style="font-style:italic;">Note.</span> ${escapeHtml(
          table.note
        )}</div>`
      : ""
  }
</div>`.trim();
}

async function writeFormattedTableToClipboard(table: FormattedTableSpec) {
  const plain = tablePlainText(table);
  const html = tableHtml(table);

  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return;
    }
  } catch {
    // Fall through to plain-text clipboard fallback.
  }

  try {
    await navigator.clipboard.writeText(plain);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = plain;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function SelectedVariableChip({
  variable,
  onRemove,
}: {
  variable: AnalysisVariable;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-[0_2px_4px_rgba(15,23,42,.03),0_8px_18px_rgba(15,23,42,.05)]">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-semibold text-white">
        {variable.level === "continuous" || variable.level === "ordinal"
          ? "#"
          : "A"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-slate-800">
          {variable.label}
        </p>
        <p className="truncate font-mono text-[9px] text-slate-400">
          {variable.name}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600"
        aria-label={`Remove ${variable.label}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function AnalysisLab({
  rows,
  codebook = [],
  datasetLabel,
  studyTitle = "",
  datasetKey = "",
  studyOptions = [],
  selectedStudyId = "",
  onStudyChange,
  datasetOptions = [],
  selectedDatasetValue = "",
  onDatasetChange,
  includeTestData = false,
  onIncludeTestDataChange,
  identityModeLabel = "Pseudonymous · direct identifiers hidden",
}: AnalysisLabProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<ActiveAnalysis>("descriptives");
  const [correlationMethod, setCorrelationMethod] = useState<CorrelationMethod>("pearson");
  const [tTestMode, setTTestMode] = useState<TTestMode>("independent");
  const [tTestEstimator, setTTestEstimator] = useState<IndependentTTestEstimator>("welch");
  const [tOutcomeVariable, setTOutcomeVariable] = useState("");
  const [tGroupVariable, setTGroupVariable] = useState("");
  const [tGroupA, setTGroupA] = useState("");
  const [tGroupB, setTGroupB] = useState("");
  const [pairedVariableA, setPairedVariableA] = useState("");
  const [pairedVariableB, setPairedVariableB] = useState("");
  const [anovaMode, setAnovaMode] = useState<AnovaMode>("between");
  const [anovaEstimator, setAnovaEstimator] = useState<OneWayAnovaEstimator>("standard");
  const [anovaOutcomeVariable, setAnovaOutcomeVariable] = useState("");
  const [anovaFactorVariable, setAnovaFactorVariable] = useState("");
  const [anovaRepeatedVariables, setAnovaRepeatedVariables] = useState<string[]>([]);
  const [regressionOutcomeVariable, setRegressionOutcomeVariable] = useState("");
  const [regressionPredictors, setRegressionPredictors] = useState<string[]>([]);
  const [reliabilityReverseItems, setReliabilityReverseItems] = useState<string[]>([]);
  const [showCorrelationN, setShowCorrelationN] = useState(true);
  const [showCorrelationP, setShowCorrelationP] = useState(true);
  const [sourceMode, setSourceMode] = useState<"study" | "csv">("study");
  const [csvRows, setCsvRows] = useState<AnalysisRow[]>([]);
  const [csvName, setCsvName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [variableSearch, setVariableSearch] = useState("");
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [options, setOptions] = useState(defaultOptions);
  const [showFrequencies, setShowFrequencies] = useState(true);
  const [copyStatus, setCopyStatus] = useState("");
  const [statisticsOpen, setStatisticsOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [analysisSidebarCollapsed, setAnalysisSidebarCollapsed] = useState(false);
  const [variablesSidebarCollapsed, setVariablesSidebarCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const activeRows = sourceMode === "csv" ? csvRows : rows;
  const activeCodebook = sourceMode === "csv" ? [] : codebook;
  const sourceLabel = sourceMode === "csv" ? csvName || "Uploaded CSV" : datasetLabel;
  const activeFullscreenDatasetOption =
    datasetOptions.find((option) => option.value === selectedDatasetValue) || null;

  const variables = useMemo(
    () => inferAnalysisVariables(activeRows, activeCodebook),
    [activeRows, activeCodebook]
  );

  const selectableVariables = useMemo(
    () =>
      variables.filter((variable) =>
        activeAnalysis === "correlations" || activeAnalysis === "regression" || activeAnalysis === "reliability"
          ? variable.level === "continuous" || variable.level === "ordinal"
          : activeAnalysis === "ttests" || activeAnalysis === "anova"
            ? variable.level === "continuous" ||
              variable.level === "ordinal" ||
              variable.level === "nominal" ||
              variable.level === "boolean"
            : isDescriptiveSelectable(variable)
      ),
    [variables, activeAnalysis]
  );

  const selectableVariableKey = selectableVariables
    .map((variable) => variable.name)
    .join("|");

  useEffect(() => {
    setSelectedVariables((current) => {
      const next = current.filter((name) =>
        selectableVariables.some((variable) => variable.name === name)
      );

      return next.length === current.length &&
        next.every((name, index) => name === current[index])
        ? current
        : next;
    });
  }, [datasetKey, sourceMode, activeAnalysis, selectableVariableKey, selectableVariables]);

  useEffect(() => {
    if (activeAnalysis === "ttests" || activeAnalysis === "anova" || activeAnalysis === "regression" || selectedVariables.length > 0 || selectableVariables.length === 0) return;

    const preferred = selectableVariables
      .filter((variable) => variable.level === "continuous")
      .slice(0, 3)
      .map((variable) => variable.name);

    setSelectedVariables(
      preferred.length
        ? preferred
        : selectableVariables.slice(0, 3).map((variable) => variable.name)
    );
  }, [activeAnalysis, selectableVariables, selectedVariables.length]);

  const selectedMeta = selectedVariables
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));

  const numericVariables = selectedMeta.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );

  const categoricalVariables = selectedMeta.filter(
    (variable) =>
      variable.level === "nominal" ||
      variable.level === "boolean" ||
      variable.level === "ordinal"
  );

  const numericResults = useMemo(
    () =>
      numericVariables.map((variable) =>
        computeNumericDescriptives(activeRows, variable)
      ),
    [activeRows, numericVariables]
  );

  const frequencyResults = useMemo(
    () =>
      categoricalVariables.map((variable) =>
        computeFrequencyTable(activeRows, variable)
      ),
    [activeRows, categoricalVariables]
  );

  const correlationVariables = selectedMeta.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );

  const correlationMatrix = useMemo(
    () => computeCorrelationMatrix(activeRows, correlationVariables, correlationMethod),
    [activeRows, correlationVariables, correlationMethod]
  );

  const strongestCorrelation = useMemo(() => {
    const candidates = correlationMatrix.cells.filter(
      (cell) => cell.x !== cell.y && cell.r !== null
    );
    return candidates.sort((a, b) => Math.abs(b.r || 0) - Math.abs(a.r || 0))[0] || null;
  }, [correlationMatrix]);

  const correlationCellMap = useMemo(
    () =>
      new Map(
        correlationMatrix.cells.map((cell) => [`${cell.x}::${cell.y}`, cell] as const)
      ),
    [correlationMatrix]
  );

  const tTestNumericCandidates = useMemo(
    () =>
      variables.filter(
        (variable) => variable.level === "continuous" || variable.level === "ordinal"
      ),
    [variables]
  );

  const tTestGroupCandidates = useMemo(
    () =>
      variables.filter(
        (variable) =>
          !["id", "datetime", "text"].includes(variable.level) &&
          variable.distinctCount >= 2 &&
          variable.distinctCount <= 12
      ),
    [variables]
  );

  useEffect(() => {
    if (tTestNumericCandidates.length === 0) {
      if (tOutcomeVariable) setTOutcomeVariable("");
      if (pairedVariableA) setPairedVariableA("");
      if (pairedVariableB) setPairedVariableB("");
      return;
    }

    const numericNames = new Set(tTestNumericCandidates.map((variable) => variable.name));
    if (!numericNames.has(tOutcomeVariable)) {
      setTOutcomeVariable(tTestNumericCandidates[0]?.name || "");
    }
    if (!numericNames.has(pairedVariableA)) {
      setPairedVariableA(tTestNumericCandidates[0]?.name || "");
    }
    if (!numericNames.has(pairedVariableB) || pairedVariableB === pairedVariableA) {
      setPairedVariableB(
        tTestNumericCandidates.find((variable) => variable.name !== pairedVariableA)?.name || ""
      );
    }
  }, [
    datasetKey,
    sourceMode,
    tTestNumericCandidates,
    tOutcomeVariable,
    pairedVariableA,
    pairedVariableB,
  ]);

  useEffect(() => {
    if (tTestGroupCandidates.length === 0) {
      if (tGroupVariable) setTGroupVariable("");
      return;
    }

    const groupNames = new Set(tTestGroupCandidates.map((variable) => variable.name));
    if (!groupNames.has(tGroupVariable)) {
      const preferred =
        tTestGroupCandidates.find((variable) => variable.name !== tOutcomeVariable) ||
        tTestGroupCandidates[0];
      setTGroupVariable(preferred?.name || "");
    }
  }, [datasetKey, sourceMode, tTestGroupCandidates, tGroupVariable, tOutcomeVariable]);

  const tOutcomeMeta = variables.find((variable) => variable.name === tOutcomeVariable) || null;
  const tGroupMeta = variables.find((variable) => variable.name === tGroupVariable) || null;
  const pairedMetaA = variables.find((variable) => variable.name === pairedVariableA) || null;
  const pairedMetaB = variables.find((variable) => variable.name === pairedVariableB) || null;

  const tGroupLevels = useMemo(
    () => (tGroupVariable ? getVariableLevels(activeRows, tGroupVariable, 50) : []),
    [activeRows, tGroupVariable]
  );

  useEffect(() => {
    if (tGroupLevels.length < 2) {
      if (tGroupA) setTGroupA("");
      if (tGroupB) setTGroupB("");
      return;
    }

    const levelValues = new Set(tGroupLevels.map((level) => level.value));
    const nextA = levelValues.has(tGroupA) ? tGroupA : tGroupLevels[0].value;
    const nextB =
      levelValues.has(tGroupB) && tGroupB !== nextA
        ? tGroupB
        : tGroupLevels.find((level) => level.value !== nextA)?.value || "";

    if (nextA !== tGroupA) setTGroupA(nextA);
    if (nextB !== tGroupB) setTGroupB(nextB);
  }, [tGroupLevels, tGroupA, tGroupB]);

  const independentTTestResult = useMemo(
    () =>
      tOutcomeMeta && tGroupMeta && tGroupA && tGroupB && tGroupA !== tGroupB
        ? computeIndependentTTest(
            activeRows,
            tOutcomeMeta,
            tGroupMeta,
            tGroupA,
            tGroupB,
            tTestEstimator
          )
        : null,
    [
      activeRows,
      tOutcomeMeta,
      tGroupMeta,
      tGroupA,
      tGroupB,
      tTestEstimator,
    ]
  );

  const pairedTTestResult = useMemo(
    () =>
      pairedMetaA && pairedMetaB && pairedMetaA.name !== pairedMetaB.name
        ? computePairedTTest(activeRows, pairedMetaA, pairedMetaB)
        : null,
    [activeRows, pairedMetaA, pairedMetaB]
  );

  const anovaNumericCandidates = tTestNumericCandidates;

  const anovaFactorCandidates = useMemo(
    () =>
      variables.filter(
        (variable) =>
          !["id", "datetime", "text"].includes(variable.level) &&
          variable.distinctCount >= 2 &&
          variable.distinctCount <= 20
      ),
    [variables]
  );

  useEffect(() => {
    if (anovaNumericCandidates.length === 0) {
      if (anovaOutcomeVariable) setAnovaOutcomeVariable("");
      if (anovaRepeatedVariables.length > 0) setAnovaRepeatedVariables([]);
      return;
    }

    const numericNames = new Set(anovaNumericCandidates.map((variable) => variable.name));
    if (!numericNames.has(anovaOutcomeVariable)) {
      setAnovaOutcomeVariable(anovaNumericCandidates[0]?.name || "");
    }

    setAnovaRepeatedVariables((current) => {
      const valid = current.filter((name) => numericNames.has(name));
      if (valid.length >= 2) return valid;
      return anovaNumericCandidates.slice(0, Math.min(3, anovaNumericCandidates.length)).map((variable) => variable.name);
    });
  }, [datasetKey, sourceMode, anovaNumericCandidates, anovaOutcomeVariable, anovaRepeatedVariables.length]);

  useEffect(() => {
    if (anovaFactorCandidates.length === 0) {
      if (anovaFactorVariable) setAnovaFactorVariable("");
      return;
    }

    const factorNames = new Set(anovaFactorCandidates.map((variable) => variable.name));
    if (!factorNames.has(anovaFactorVariable) || anovaFactorVariable === anovaOutcomeVariable) {
      const preferred =
        anovaFactorCandidates.find((variable) => variable.name !== anovaOutcomeVariable) ||
        anovaFactorCandidates[0];
      setAnovaFactorVariable(preferred?.name || "");
    }
  }, [datasetKey, sourceMode, anovaFactorCandidates, anovaFactorVariable, anovaOutcomeVariable]);

  const anovaOutcomeMeta = variables.find((variable) => variable.name === anovaOutcomeVariable) || null;
  const anovaFactorMeta = variables.find((variable) => variable.name === anovaFactorVariable) || null;
  const anovaRepeatedMeta = anovaRepeatedVariables
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));

  const oneWayAnovaResult = useMemo(
    () =>
      anovaOutcomeMeta && anovaFactorMeta && anovaOutcomeMeta.name !== anovaFactorMeta.name
        ? computeOneWayAnova(activeRows, anovaOutcomeMeta, anovaFactorMeta, anovaEstimator)
        : null,
    [activeRows, anovaOutcomeMeta, anovaFactorMeta, anovaEstimator]
  );

  const repeatedMeasuresAnovaResult = useMemo(
    () =>
      anovaRepeatedMeta.length >= 2
        ? computeRepeatedMeasuresAnova(activeRows, anovaRepeatedMeta)
        : null,
    [activeRows, anovaRepeatedMeta]
  );

  const regressionCandidates = tTestNumericCandidates;

  useEffect(() => {
    if (regressionCandidates.length === 0) {
      if (regressionOutcomeVariable) setRegressionOutcomeVariable("");
      if (regressionPredictors.length > 0) setRegressionPredictors([]);
      return;
    }

    const names = new Set(regressionCandidates.map((variable) => variable.name));
    const nextOutcome = names.has(regressionOutcomeVariable)
      ? regressionOutcomeVariable
      : regressionCandidates[0]?.name || "";
    if (nextOutcome !== regressionOutcomeVariable) setRegressionOutcomeVariable(nextOutcome);

    setRegressionPredictors((current) => {
      const valid = current.filter((name) => names.has(name) && name !== nextOutcome);
      if (valid.length > 0) return valid;
      return regressionCandidates
        .filter((variable) => variable.name !== nextOutcome)
        .slice(0, Math.min(2, Math.max(0, regressionCandidates.length - 1)))
        .map((variable) => variable.name);
    });
  }, [
    datasetKey,
    sourceMode,
    regressionCandidates,
    regressionOutcomeVariable,
    regressionPredictors.length,
  ]);

  const regressionOutcomeMeta =
    variables.find((variable) => variable.name === regressionOutcomeVariable) || null;
  const regressionPredictorMeta = regressionPredictors
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));

  const linearRegressionResult = useMemo(
    () =>
      regressionOutcomeMeta && regressionPredictorMeta.length > 0
        ? computeLinearRegression(activeRows, regressionOutcomeMeta, regressionPredictorMeta)
        : null,
    [activeRows, regressionOutcomeMeta, regressionPredictorMeta]
  );

  const reliabilityCandidates = useMemo(
    () =>
      variables.filter(
        (variable) => variable.level === "continuous" || variable.level === "ordinal"
      ),
    [variables]
  );

  const reliabilityVariables = selectedMeta.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );

  const reliabilityMetadataReverseNames = useMemo(
    () =>
      new Set(
        activeCodebook
          .filter((entry) => metadataSaysReverseScored(entry.reverse_scored))
          .map((entry) => entry.variable)
      ),
    [activeCodebook]
  );

  const reliabilityVariableKey = reliabilityVariables.map((variable) => variable.name).join("|");

  useEffect(() => {
    const selected = new Set(reliabilityVariableKey ? reliabilityVariableKey.split("|") : []);
    setReliabilityReverseItems((current) => {
      const next = current.filter((name) => selected.has(name));
      return next.length === current.length && next.every((name, index) => name === current[index])
        ? current
        : next;
    });
  }, [datasetKey, sourceMode, reliabilityVariableKey]);

  const reliabilityResult = useMemo(
    () => computeReliability(activeRows, reliabilityVariables, reliabilityReverseItems),
    [activeRows, reliabilityVariables, reliabilityReverseItems]
  );

  const searchQuery = variableSearch.trim().toLowerCase();
  const visibleVariables = variables.filter((variable) => {
    if (!searchQuery) return true;

    return (
      variable.name.toLowerCase().includes(searchQuery) ||
      variable.label.toLowerCase().includes(searchQuery) ||
      variable.source.toLowerCase().includes(searchQuery) ||
      variable.level.toLowerCase().includes(searchQuery)
    );
  });

  const availableCount = selectableVariables.length;
  const missingCellCount = useMemo(
    () => variables.reduce((sum, variable) => sum + variable.missingCount, 0),
    [variables]
  );
  const totalCellCount = Math.max(activeRows.length * variables.length, 1);
  const completeness = Math.max(
    0,
    Math.min(100, Math.round(((totalCellCount - missingCellCount) / totalCellCount) * 100))
  );

  function toggleVariable(name: string) {
    const variable = variables.find((entry) => entry.name === name);
    if (!variable || !isDescriptiveSelectable(variable)) return;

    setSelectedVariables((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  async function readCsv(file: File) {
    setCsvError("");

    try {
      const text = await file.text();
      const parsed = parseCsvDataset(text);

      if (parsed.length === 0) {
        throw new Error(
          "This CSV needs a header row and at least one data row before it can be analysed."
        );
      }

      setCsvRows(parsed);
      setCsvName(file.name);
      setSourceMode("csv");
      setSelectedVariables([]);
    } catch (error) {
      setCsvRows([]);
      setCsvName("");
      setCsvError(
        error instanceof Error ? error.message : "The CSV could not be read."
      );
    }
  }

  function descriptiveTableSpec(): FormattedTableSpec | null {
    if (numericResults.length === 0) return null;

    const cellValue = (result: NumericDescriptives, key: string) => {
      if (key === "variable") return result.label;
      const value = result[key as keyof NumericDescriptives];
      return typeof value === "number" ? formatNumber(value, 4) : "—";
    };

    return {
      title: "Table · Descriptive statistics",
      subtitle: sourceLabel,
      headers: tableHeaders.map((header) => header.label),
      rows: numericResults.map((result) =>
        tableHeaders.map((header) => cellValue(result, header.key))
      ),
      note:
        "Sample standard deviation and variance use n − 1. Mean confidence intervals use the Student t distribution.",
    };
  }

  function correlationTableSpec(): FormattedTableSpec | null {
    if (correlationVariables.length < 2) return null;

    const rows = correlationMatrix.variables.map((rowVariable) => [
      rowVariable.label,
      ...correlationMatrix.variables.map((columnVariable) => {
        const cell = correlationCellMap.get(`${rowVariable.name}::${columnVariable.name}`);
        if (!cell || cell.r === null) return "—";
        const parts = [formatNumber(cell.r, 3)];
        if (showCorrelationP && rowVariable.name !== columnVariable.name) {
          parts.push(`p ${formatPValue(cell.pValue)}`);
        }
        if (showCorrelationN) parts.push(`N = ${cell.n}`);
        return parts.join(" · ");
      }),
    ]);

    return {
      title: `Table · ${correlationMethod === "pearson" ? "Pearson" : "Spearman"} correlations`,
      subtitle: sourceLabel,
      headers: ["Variable", ...correlationMatrix.variables.map((variable) => variable.label)],
      rows,
      note:
        correlationMethod === "pearson"
          ? "Pairwise-complete observations. Two-sided p-values are based on the t distribution."
          : "Pairwise-complete observations. Spearman coefficients use average ranks for ties; p-values use the conventional t approximation.",
    };
  }

  function tTestTableSpec(): FormattedTableSpec | null {
    if (tTestMode === "independent") {
      const result = independentTTestResult;
      if (!result) return null;
      return {
        title: "Table · Independent-samples t-test",
        subtitle: `${result.outcomeLabel} by ${result.groupVariableLabel}`,
        headers: [
          "Comparison",
          "n₁",
          "n₂",
          "Mean₁",
          "Mean₂",
          "Mean difference",
          "SE difference",
          "t",
          "df",
          "p",
          "95% CI",
          "Cohen's d",
          "Hedges' g",
        ],
        rows: [[
          `${result.groupA} − ${result.groupB}`,
          String(result.nA),
          String(result.nB),
          formatNumber(result.meanA, 3),
          formatNumber(result.meanB, 3),
          formatNumber(result.meanDifference, 3),
          formatNumber(result.seDifference, 3),
          formatNumber(result.t, 3),
          formatNumber(result.df, 2),
          formatPValue(result.pValue),
          `${formatNumber(result.ci95Low, 3)}, ${formatNumber(result.ci95High, 3)}`,
          formatNumber(result.cohenD, 3),
          formatNumber(result.hedgesG, 3),
        ]],
        note: `${result.estimator === "welch" ? "Welch's" : "Student's"} independent-samples t-test. Mean difference and effect-size signs follow ${result.groupA} − ${result.groupB}.`,
      };
    }

    const result = pairedTTestResult;
    if (!result) return null;
    return {
      title: "Table · Paired-samples t-test",
      subtitle: `${result.variableALabel} paired with ${result.variableBLabel}`,
      headers: [
        "Pair",
        "N",
        "Mean A",
        "Mean B",
        "Mean difference",
        "SD difference",
        "SE difference",
        "t",
        "df",
        "p",
        "95% CI",
        "Cohen's dz",
      ],
      rows: [[
        `${result.variableALabel} − ${result.variableBLabel}`,
        String(result.n),
        formatNumber(result.meanA, 3),
        formatNumber(result.meanB, 3),
        formatNumber(result.meanDifference, 3),
        formatNumber(result.sdDifference, 3),
        formatNumber(result.seDifference, 3),
        formatNumber(result.t, 3),
        formatNumber(result.df, 0),
        formatPValue(result.pValue),
        `${formatNumber(result.ci95Low, 3)}, ${formatNumber(result.ci95High, 3)}`,
        formatNumber(result.cohenDz, 3),
      ]],
      note: `Pairwise-complete observations. Mean difference and Cohen's dz follow ${result.variableALabel} − ${result.variableBLabel}.`,
    };
  }

  function anovaTableSpec(): FormattedTableSpec | null {
    if (anovaMode === "between") {
      const result = oneWayAnovaResult;
      if (!result || result.f === null || result.df1 === null || result.df2 === null) return null;

      if (result.estimator === "welch") {
        return {
          title: "Table · Welch one-way ANOVA",
          subtitle: `${result.outcomeLabel} by ${result.factorLabel}`,
          headers: ["Test", "F", "df₁", "df₂", "p", "η²", "ω²"],
          rows: [[
            "Welch",
            formatNumber(result.f, 3),
            formatNumber(result.df1, 0),
            formatNumber(result.df2, 2),
            formatPValue(result.pValue),
            formatNumber(result.etaSquared, 3),
            formatNumber(result.omegaSquared, 3),
          ]],
          note: "Welch's omnibus test is robust to unequal group variances. η² and ω² are reported from the conventional between/within sums-of-squares decomposition. Pairwise follow-ups use Welch t-tests with Holm adjustment.",
        };
      }

      const msBetween = result.ssBetween !== null ? result.ssBetween / result.df1 : null;
      const msWithin = result.ssWithin !== null ? result.ssWithin / result.df2 : null;
      return {
        title: "Table · One-way ANOVA",
        subtitle: `${result.outcomeLabel} by ${result.factorLabel}`,
        headers: ["Source", "SS", "df", "MS", "F", "p", "η²", "ω²"],
        rows: [
          ["Between groups", formatNumber(result.ssBetween, 3), formatNumber(result.df1, 0), formatNumber(msBetween, 3), formatNumber(result.f, 3), formatPValue(result.pValue), formatNumber(result.etaSquared, 3), formatNumber(result.omegaSquared, 3)],
          ["Within groups", formatNumber(result.ssWithin, 3), formatNumber(result.df2, 0), formatNumber(msWithin, 3), "—", "—", "—", "—"],
          ["Total", formatNumber(result.ssTotal, 3), formatNumber(result.totalN - 1, 0), "—", "—", "—", "—", "—"],
        ],
        note: "Classical one-way ANOVA. Pairwise follow-ups use pooled-variance t-tests with Holm adjustment for multiple comparisons.",
      };
    }

    const result = repeatedMeasuresAnovaResult;
    if (!result || result.f === null || result.df1 === null || result.df2 === null) return null;
    const msCondition = result.ssCondition !== null ? result.ssCondition / result.df1 : null;
    const msError = result.ssError !== null ? result.ssError / result.df2 : null;
    const subjectDf = result.completeCases > 0 ? result.completeCases - 1 : null;
    const msSubjects = result.ssSubjects !== null && subjectDf && subjectDf > 0 ? result.ssSubjects / subjectDf : null;
    return {
      title: "Table · Repeated-measures ANOVA",
      subtitle: anovaRepeatedMeta.map((variable) => variable.label).join(" · "),
      headers: ["Source", "SS", "df", "MS", "F", "p", "ηp²", "ηG²"],
      rows: [
        ["Condition", formatNumber(result.ssCondition, 3), formatNumber(result.df1, 0), formatNumber(msCondition, 3), formatNumber(result.f, 3), formatPValue(result.pValue), formatNumber(result.partialEtaSquared, 3), formatNumber(result.generalizedEtaSquared, 3)],
        ["Error", formatNumber(result.ssError, 3), formatNumber(result.df2, 0), formatNumber(msError, 3), "—", "—", "—", "—"],
        ["Subjects", formatNumber(result.ssSubjects, 3), formatNumber(subjectDf, 0), formatNumber(msSubjects, 3), "—", "—", "—", "—"],
      ],
      note: "One-factor repeated-measures ANOVA using complete cases across all selected conditions. The V1 omnibus test assumes sphericity. Pairwise follow-ups use paired t-tests with Holm adjustment.",
    };
  }

  function anovaPairwiseTableSpec(): FormattedTableSpec | null {
    if (anovaMode === "between") {
      const result = oneWayAnovaResult;
      if (!result || result.pairwise.length === 0) return null;
      return {
        title: "Table · ANOVA pairwise comparisons",
        subtitle: `${result.outcomeLabel} by ${result.factorLabel}`,
        headers: ["Comparison", "n₁", "n₂", "Mean difference", "t", "df", "p", "Holm p", "Cohen's d"],
        rows: result.pairwise.map((comparison) => [
          `${comparison.groupA} − ${comparison.groupB}`,
          String(comparison.nA),
          String(comparison.nB),
          formatNumber(comparison.meanDifference, 3),
          formatNumber(comparison.t, 3),
          formatNumber(comparison.df, 2),
          formatPValue(comparison.pValue),
          formatPValue(comparison.pAdjusted),
          formatNumber(comparison.cohenD, 3),
        ]),
        note: `${result.estimator === "welch" ? "Welch" : "Pooled-variance"} pairwise t-tests with Holm step-down adjustment across all reported pairwise comparisons.`,
      };
    }

    const result = repeatedMeasuresAnovaResult;
    if (!result || result.pairwise.length === 0) return null;
    return {
      title: "Table · Repeated-measures pairwise comparisons",
      subtitle: "Selected within-participant conditions",
      headers: ["Comparison", "N", "Mean difference", "t", "df", "p", "Holm p", "Cohen's dz"],
      rows: result.pairwise.map((comparison) => [
        `${comparison.variableALabel} − ${comparison.variableBLabel}`,
        String(comparison.n),
        formatNumber(comparison.meanDifference, 3),
        formatNumber(comparison.t, 3),
        formatNumber(comparison.df, 0),
        formatPValue(comparison.pValue),
        formatPValue(comparison.pAdjusted),
        formatNumber(comparison.cohenDz, 3),
      ]),
      note: "Paired t-tests computed on the same complete-case participants used by the repeated-measures omnibus test. Holm adjustment controls the family-wise error rate across reported comparisons.",
    };
  }

  function reliabilityTableSpec(): FormattedTableSpec | null {
    const result = reliabilityResult;
    if (!result || result.issue || result.alpha === null || result.items.length < 2) return null;
    return {
      title: "Table · Reliability item statistics",
      subtitle: `${result.itemCount} items · N = ${result.completeCases}`,
      headers: ["Item", "Direction", "Mean", "SD", "Item-rest r", "α if deleted"],
      rows: result.items.map((item) => [
        item.label,
        item.reversed ? "Reversed" : "Original",
        formatNumber(item.mean, 3),
        formatNumber(item.sd, 3),
        formatNumber(item.itemRestCorrelation, 3),
        formatNumber(item.alphaIfDeleted, 3),
      ]),
      note: `Cronbach's α = ${formatNumber(result.alpha, 3)}; standardized α = ${formatNumber(result.standardizedAlpha, 3)}. Item-rest correlations are corrected correlations between each item and the sum of the remaining items. Reliability uses listwise-complete observations across all selected items.`,
    };
  }

  function reliabilitySummaryTableSpec(): FormattedTableSpec | null {
    const result = reliabilityResult;
    if (!result || result.issue || result.alpha === null) return null;
    return {
      title: "Table · Scale reliability summary",
      subtitle: `${result.itemCount} items · ${result.completeCases} complete cases`,
      headers: ["Cronbach's α", "Standardized α", "Mean inter-item r", "Mean total score", "SD total score", "Complete %"],
      rows: [[
        formatNumber(result.alpha, 3),
        formatNumber(result.standardizedAlpha, 3),
        formatNumber(result.meanInterItemCorrelation, 3),
        formatNumber(result.scaleMean, 3),
        formatNumber(result.scaleSd, 3),
        `${formatNumber(result.completePercent, 1)}%`,
      ]],
      note: "Cronbach's α is based on raw item variances. Standardized α is based on the average inter-item Pearson correlation. Reverse transformations shown in the item table are applied only when explicitly enabled in Analysis Lab.",
    };
  }

  function regressionCoefficientTableSpec(): FormattedTableSpec | null {
    const result = linearRegressionResult;
    if (!result || result.issue || result.coefficients.length === 0) return null;
    return {
      title: "Table · Multiple linear regression coefficients",
      subtitle: `${result.outcomeLabel} · N = ${result.n}`,
      headers: ["Predictor", "B", "SE", "β", "t", "p", "95% CI", "Tolerance", "VIF"],
      rows: result.coefficients.map((coefficient) => [
        coefficient.label,
        formatNumber(coefficient.b, 3),
        formatNumber(coefficient.se, 3),
        coefficient.isIntercept ? "—" : formatNumber(coefficient.beta, 3),
        formatNumber(coefficient.t, 3),
        formatPValue(coefficient.pValue),
        `${formatNumber(coefficient.ci95Low, 3)}, ${formatNumber(coefficient.ci95High, 3)}`,
        coefficient.isIntercept ? "—" : formatNumber(coefficient.tolerance, 3),
        coefficient.isIntercept ? "—" : formatNumber(coefficient.vif, 3),
      ]),
      note: `Outcome: ${result.outcomeLabel}. Ordinary least squares with an intercept and listwise-complete observations. β denotes standardized coefficients; tolerance and VIF describe predictor collinearity.`,
    };
  }

  function regressionModelTableSpec(): FormattedTableSpec | null {
    const result = linearRegressionResult;
    if (!result || result.issue || result.f === null || result.dfModel === null || result.dfResidual === null) return null;
    return {
      title: "Table · Linear regression model fit",
      subtitle: result.outcomeLabel,
      headers: ["N", "Predictors", "R²", "Adjusted R²", "F", "df₁", "df₂", "p", "RMSE"],
      rows: [[
        String(result.n),
        String(result.predictorCount),
        formatNumber(result.rSquared, 3),
        formatNumber(result.adjustedRSquared, 3),
        formatNumber(result.f, 3),
        formatNumber(result.dfModel, 0),
        formatNumber(result.dfResidual, 0),
        formatPValue(result.pValue),
        formatNumber(result.rmse, 3),
      ]],
      note: "Ordinary least-squares model fit using listwise-complete observations across the outcome and all selected predictors.",
    };
  }

  async function copyTableSpec(spec: FormattedTableSpec | null, status = "Formatted table copied") {
    if (!spec) return;
    await writeFormattedTableToClipboard(spec);
    setCopyStatus(status);
    window.setTimeout(() => setCopyStatus(""), 1900);
  }

  async function copyActiveResults() {
    const spec =
      activeAnalysis === "correlations"
        ? correlationTableSpec()
        : activeAnalysis === "ttests"
          ? tTestTableSpec()
          : activeAnalysis === "anova"
            ? anovaTableSpec()
            : activeAnalysis === "regression"
              ? regressionCoefficientTableSpec()
              : activeAnalysis === "reliability"
                ? reliabilityTableSpec()
                : descriptiveTableSpec();
    await copyTableSpec(spec);
  }

  async function copyFrequencyTable(table: ReturnType<typeof computeFrequencyTable>) {
    await copyTableSpec(
      {
        title: `Table · Frequencies — ${table.label}`,
        subtitle: sourceLabel,
        headers: ["Value", "Count", "Valid %", "Total %"],
        rows: table.rows.map((row) => [
          row.value,
          String(row.count),
          `${formatNumber(row.validPercent, 1)}%`,
          `${formatNumber(row.totalPercent, 1)}%`,
        ]),
        note: `Valid N = ${table.validN}; missing = ${table.missingN}.`,
      },
      "Frequency table copied"
    );
  }

  const optionEntries: Array<[DescriptiveOptionKey, string]> = [
    ["n", "N"],
    ["missing", "Missing"],
    ["mean", "Mean"],
    ["median", "Median"],
    ["sd", "Standard deviation"],
    ["variance", "Variance"],
    ["min", "Minimum"],
    ["max", "Maximum"],
    ["quartiles", "Quartiles"],
    ["ci95", "95% CI for mean"],
    ["skewness", "Skewness"],
    ["kurtosis", "Excess kurtosis"],
  ];

  const tableHeaders: Array<{ key: string; label: string }> = [
    { key: "variable", label: "Variable" },
    ...(options.n ? [{ key: "n", label: "N" }] : []),
    ...(options.missing ? [{ key: "missing", label: "Missing" }] : []),
    ...(options.mean ? [{ key: "mean", label: "Mean" }] : []),
    ...(options.median ? [{ key: "median", label: "Median" }] : []),
    ...(options.sd ? [{ key: "sd", label: "SD" }] : []),
    ...(options.variance ? [{ key: "variance", label: "Variance" }] : []),
    ...(options.min ? [{ key: "min", label: "Min" }] : []),
    ...(options.max ? [{ key: "max", label: "Max" }] : []),
    ...(options.quartiles
      ? [
          { key: "q1", label: "Q1" },
          { key: "q3", label: "Q3" },
        ]
      : []),
    ...(options.ci95
      ? [
          { key: "ci95Low", label: "95% CI low" },
          { key: "ci95High", label: "95% CI high" },
        ]
      : []),
    ...(options.skewness ? [{ key: "skewness", label: "Skewness" }] : []),
    ...(options.kurtosis
      ? [{ key: "kurtosisExcess", label: "Excess kurtosis" }]
      : []),
  ];

  const workspaceGridClass = analysisSidebarCollapsed
    ? variablesSidebarCollapsed
      ? "xl:grid-cols-[54px_54px_minmax(0,1fr)]"
      : "xl:grid-cols-[54px_360px_minmax(0,1fr)]"
    : variablesSidebarCollapsed
      ? "xl:grid-cols-[220px_54px_minmax(0,1fr)]"
      : "xl:grid-cols-[220px_360px_minmax(0,1fr)]";

  return (
    <div
      className={`overflow-hidden border border-slate-300/70 bg-white transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-[200] flex h-screen flex-col rounded-none border-0 shadow-none"
          : "rounded-[30px] shadow-[0_2px_5px_rgba(15,23,42,.035),0_18px_46px_rgba(15,23,42,.075),0_46px_100px_rgba(15,23,42,.055)]"
      }`}
    >
      {isFullscreen ? (
        <div className="shrink-0 border-b border-slate-200/80 bg-[linear-gradient(110deg,#ffffff_0%,#f7fcfd_55%,#faf8ff_100%)] px-3 py-2.5 sm:px-4">
          <div className="grid gap-2 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200/80 bg-white text-cyan-800 shadow-[0_3px_12px_rgba(8,145,178,.08)]">
                <Gauge className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[12px] font-semibold tracking-[-0.01em] text-slate-950">
                    Analysis Lab
                  </p>
                  <span className="rounded-full border border-cyan-200/80 bg-white px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[.08em] text-cyan-800">
                    Deterministic
                  </span>
                </div>
                <p className="mt-0.5 max-w-[200px] truncate text-[8px] text-slate-400">
                  {studyTitle || "Research workspace"}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              {sourceMode === "study" ? (
                <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(150px,.75fr)_minmax(260px,1.3fr)_auto] md:items-center">
                  <div className="relative min-w-0">
                    <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[7px] font-semibold uppercase tracking-[.08em] text-slate-400">
                      Study
                    </span>
                    <select
                      aria-label="Study"
                      value={selectedStudyId}
                      onChange={(event) => onStudyChange?.(event.target.value)}
                      disabled={!onStudyChange || studyOptions.length === 0}
                      className="h-9 w-full min-w-0 border border-slate-200 bg-white pl-[50px] pr-8 text-[9px] font-semibold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,.04)] disabled:opacity-50"
                    >
                      {studyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative min-w-0">
                    <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[7px] font-semibold uppercase tracking-[.08em] text-slate-400">
                      Dataset
                    </span>
                    <select
                      aria-label="Analysis dataset"
                      value={selectedDatasetValue}
                      onChange={(event) => onDatasetChange?.(event.target.value)}
                      disabled={!onDatasetChange || datasetOptions.length === 0}
                      className="h-9 w-full min-w-0 border border-slate-200 bg-white pl-[62px] pr-8 text-[9px] font-semibold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,.04)] disabled:opacity-50"
                    >
                      {datasetOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.recommended ? "Recommended · " : ""}
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 text-[8px] font-semibold text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,.04)]">
                    <input
                      type="checkbox"
                      checked={includeTestData}
                      onChange={(event) => onIncludeTestDataChange?.(event.target.checked)}
                      disabled={!onIncludeTestDataChange}
                    />
                    TEST data
                  </label>
                </div>
              ) : (
                <div className="flex h-9 min-w-0 items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-3 shadow-[0_2px_8px_rgba(15,23,42,.04)]">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate text-[9px] font-semibold text-slate-700">
                      {csvName || "External CSV"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 text-[8px] font-semibold text-cyan-800"
                  >
                    Replace
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-1.5">
              <div className="flex items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-[0_2px_8px_rgba(15,23,42,.04)]">
                <button
                  type="button"
                  onClick={() => setSourceMode("study")}
                  title="Use PsyLattice data"
                  className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[8px] font-semibold ${
                    sourceMode === "study" ? "bg-slate-950 text-white" : "text-slate-400"
                  }`}
                >
                  <Database className="h-3 w-3" />
                  Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (csvRows.length > 0) setSourceMode("csv");
                    else fileInputRef.current?.click();
                  }}
                  title="Use an external CSV"
                  className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[8px] font-semibold ${
                    sourceMode === "csv" ? "bg-slate-950 text-white" : "text-slate-400"
                  }`}
                >
                  <Upload className="h-3 w-3" />
                  CSV
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAnalysisSidebarCollapsed((current) => !current)}
                title={analysisSidebarCollapsed ? "Expand analyses panel" : "Retract analyses panel"}
                className={`hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,.04)] xl:flex ${
                  analysisSidebarCollapsed ? "text-slate-400" : "text-slate-700"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setVariablesSidebarCollapsed((current) => !current)}
                title={variablesSidebarCollapsed ? "Expand variables panel" : "Retract variables panel"}
                className={`hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,.04)] xl:flex ${
                  variablesSidebarCollapsed ? "text-slate-400" : "text-slate-700"
                }`}
              >
                <Layers3 className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                title="Exit full screen (Esc)"
                className="flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[8px] font-semibold text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,.04)]"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Exit
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readCsv(file);
                  event.currentTarget.value = "";
                }}
              />
            </div>
          </div>

          <div className="mt-2 flex min-h-[28px] items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-1.5 backdrop-blur">
            <div className="flex min-w-0 items-center gap-2">
              {sourceMode === "study" && activeFullscreenDatasetOption?.eyebrow && (
                <span className="shrink-0 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[7px] font-semibold text-cyan-800">
                  {activeFullscreenDatasetOption.eyebrow}
                </span>
              )}
              {sourceMode === "study" && activeFullscreenDatasetOption?.recommended && (
                <span className="hidden shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[7px] font-semibold text-violet-700 sm:inline">
                  Recommended
                </span>
              )}
              <p className="truncate text-[8px] text-slate-500">
                {sourceMode === "study"
                  ? activeFullscreenDatasetOption?.description || sourceLabel
                  : sourceLabel}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-[7.5px] font-semibold text-slate-500">
              <span className="hidden lg:inline">{identityModeLabel}</span>
              <span className="h-3 w-px bg-slate-200" />
              <span>{activeRows.length.toLocaleString()} rows</span>
              <span className="h-3 w-px bg-slate-200" />
              <span>{variables.length.toLocaleString()} vars</span>
              <span className="hidden sm:inline">· {availableCount.toLocaleString()} usable</span>
              <span className="hidden sm:inline">· {completeness}% complete</span>
            </div>
          </div>

          {csvError && (
            <p className="mt-2 border-l-2 border-rose-400 pl-3 text-[9px] leading-4 text-rose-700">
              {csvError}
            </p>
          )}
        </div>
      ) : (
        <div className="shrink-0 border-b border-slate-200/80 bg-[linear-gradient(110deg,#ffffff_0%,#f5fcfe_48%,#f9f7ff_100%)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/80 bg-white text-cyan-800 shadow-[0_5px_18px_rgba(8,145,178,.10)]">
                <Gauge className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold tracking-[-0.01em] text-slate-950">
                    Analysis canvas
                  </p>
                  <span className="rounded-full border border-cyan-200/80 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.09em] text-cyan-800">
                    Deterministic
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px] text-slate-500">
                  {studyTitle ? `${studyTitle} · ` : ""}
                  {sourceLabel}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-[0_4px_14px_rgba(15,23,42,.05)]">
                <button
                  type="button"
                  onClick={() => setSourceMode("study")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                    sourceMode === "study" ? "bg-slate-950 text-white" : "text-slate-500"
                  }`}
                >
                  <Database className="h-3 w-3" />
                  PsyLattice data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (csvRows.length > 0) setSourceMode("csv");
                    else fileInputRef.current?.click();
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                    sourceMode === "csv" ? "bg-slate-950 text-white" : "text-slate-500"
                  }`}
                >
                  <Upload className="h-3 w-3" />
                  External CSV
                </button>
              </div>

              {sourceMode === "csv" && csvRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm"
                >
                  Replace file
                </button>
              )}

              <div className="hidden items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-[0_4px_14px_rgba(15,23,42,.05)] xl:flex">
                <button
                  type="button"
                  onClick={() => setAnalysisSidebarCollapsed((current) => !current)}
                  title={analysisSidebarCollapsed ? "Expand analyses panel" : "Retract analyses panel"}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-semibold ${
                    analysisSidebarCollapsed ? "text-slate-400" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <BarChart3 className="h-3 w-3" />
                  Analyses
                  {analysisSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => setVariablesSidebarCollapsed((current) => !current)}
                  title={variablesSidebarCollapsed ? "Expand variables panel" : "Retract variables panel"}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-semibold ${
                    variablesSidebarCollapsed ? "text-slate-400" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Layers3 className="h-3 w-3" />
                  Variables
                  {variablesSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                title="Open Analysis Lab full screen"
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,.05)]"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Full screen
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readCsv(file);
                  event.currentTarget.value = "";
                }}
              />
            </div>
          </div>

          {csvError && (
            <p className="mt-3 border-l-2 border-rose-400 pl-3 text-xs leading-5 text-rose-700">
              {csvError}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Rows", activeRows.length.toLocaleString()],
              ["Variables", variables.length.toLocaleString()],
              ["Usable", availableCount.toLocaleString()],
              ["Completeness", `${completeness}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/80 bg-white/78 px-3 py-2.5 shadow-[0_2px_4px_rgba(15,23,42,.025),0_8px_18px_rgba(15,23,42,.04)] backdrop-blur"
              >
                <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className={`grid ${workspaceGridClass} ${
          isFullscreen ? "min-h-0 flex-1 overflow-hidden" : "min-h-[690px]"
        }`}
      >
        <aside
          className={`border-b border-slate-200 bg-[#f8fafb] xl:border-b-0 xl:border-r ${
            analysisSidebarCollapsed ? "p-2" : "p-4"
          } ${isFullscreen ? "min-h-0 overflow-y-auto" : ""}`}
        >
          <div className="mb-2 hidden items-center justify-center xl:flex">
            <button
              type="button"
              onClick={() => setAnalysisSidebarCollapsed((current) => !current)}
              title={analysisSidebarCollapsed ? "Expand analyses" : "Retract analyses"}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-800"
            >
              {analysisSidebarCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {analysisSidebarCollapsed ? (
            <div className="hidden flex-col items-center gap-3 py-2 xl:flex">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-semibold uppercase tracking-[.14em] text-slate-400">
                Analyses
              </span>
            </div>
          ) : (
            <>
          <div className="px-1">
            <p className="text-[9px] font-semibold uppercase tracking-[.13em] text-slate-400">
              Analyses
            </p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Choose a statistical workflow.
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            {analysisCatalogue.map((analysis) => {
              const selected = analysis.id === activeAnalysis;
              return (
              <button
                key={analysis.id}
                type="button"
                disabled={!analysis.available}
                onClick={() => {
                  if (
                    analysis.id === "descriptives" ||
                    analysis.id === "correlations" ||
                    analysis.id === "ttests" ||
                    analysis.id === "anova" ||
                    analysis.id === "regression" ||
                    analysis.id === "reliability"
                  ) {
                    setActiveAnalysis(analysis.id);
                  }
                }}
                className={`w-full rounded-2xl border p-3 text-left ${
                  selected
                    ? "border-slate-900 bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,.14)]"
                    : analysis.available
                      ? "border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/40"
                      : "cursor-default border-transparent bg-transparent text-slate-400 hover:translate-y-0"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-semibold">{analysis.title}</p>
                    <p
                      className={`mt-1 text-[9px] leading-4 ${
                        selected ? "text-slate-300" : analysis.available ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      {analysis.description}
                    </p>
                  </div>
                  {analysis.available ? (
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[.06em] text-slate-500">
                      Next
                    </span>
                  )}
                </div>
              </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-100 bg-[linear-gradient(145deg,#effcff,#ffffff)] p-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-cyan-700" />
              <p className="text-[10px] font-semibold text-slate-800">Analysis V1</p>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-slate-500">
              Statistics are computed locally from the selected dataset. AI can later explain verified results, but it does not calculate them.
            </p>
          </div>
            </>
          )}
        </aside>

        <aside
          className={`border-b border-slate-200 bg-white xl:border-b-0 xl:border-r ${
            variablesSidebarCollapsed ? "p-2" : "p-4"
          } ${isFullscreen ? "min-h-0 overflow-y-auto" : ""}`}
        >
          <div className="mb-2 hidden items-center justify-center xl:flex">
            <button
              type="button"
              onClick={() => setVariablesSidebarCollapsed((current) => !current)}
              title={variablesSidebarCollapsed ? "Expand variables" : "Retract variables"}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-slate-800"
            >
              {variablesSidebarCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {variablesSidebarCollapsed ? (
            <div className="hidden flex-col items-center gap-3 py-2 xl:flex">
              <Layers3 className="h-4 w-4 text-slate-400" />
              <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-semibold uppercase tracking-[.14em] text-slate-400">
                Variables
              </span>
            </div>
          ) : (
            <>
              {activeAnalysis === "reliability" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Reliability setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Select the numeric items that belong to one scale or subscale.</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Scale items</span>
                    <span className="text-[8px] font-semibold text-cyan-700">{reliabilityVariables.length} selected</span>
                  </div>

                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={variableSearch}
                      onChange={(event) => setVariableSearch(event.target.value)}
                      placeholder="Find scale item..."
                      className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none"
                    />
                  </div>

                  <div className="mt-2 max-h-[300px] space-y-1 overflow-y-auto pr-1">
                    {reliabilityCandidates
                      .filter((variable) => {
                        const query = variableSearch.trim().toLowerCase();
                        return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                      })
                      .map((variable) => {
                        const checked = selectedVariables.includes(variable.name);
                        const metadataReverse = reliabilityMetadataReverseNames.has(variable.name);
                        return (
                          <button
                            key={variable.name}
                            type="button"
                            onClick={() => toggleVariable(variable.name)}
                            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${
                              checked
                                ? "border-cyan-300 bg-cyan-50/70"
                                : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}>
                              <Check className="h-3 w-3" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span>
                              <span className="block truncate font-mono text-[8px] text-slate-400">{variable.name}</span>
                            </span>
                            {metadataReverse && (
                              <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[.05em] text-violet-700">Reverse key</span>
                            )}
                          </button>
                        );
                      })}
                  </div>

                  {reliabilityVariables.length > 0 && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Scoring direction</span>
                        <span className="text-[8px] text-slate-400">Optional</span>
                      </div>
                      <p className="mt-1 text-[8px] leading-4 text-slate-400">Only toggle an item when the values in this dataset still need to be reversed. PsyLattice uses that item's observed numeric minimum and maximum for the transformation.</p>
                      <div className="mt-2 space-y-1.5">
                        {reliabilityVariables.map((variable) => {
                          const reversed = reliabilityReverseItems.includes(variable.name);
                          const metadataReverse = reliabilityMetadataReverseNames.has(variable.name);
                          return (
                            <label key={variable.name} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 ${reversed ? "border-violet-200 bg-violet-50/65" : "border-slate-200 bg-white"}`}>
                              <input
                                type="checkbox"
                                checked={reversed}
                                onChange={(event) =>
                                  setReliabilityReverseItems((current) =>
                                    event.target.checked
                                      ? Array.from(new Set([...current, variable.name]))
                                      : current.filter((name) => name !== variable.name)
                                  )
                                }
                                className="rounded border-slate-300"
                              />
                              <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-slate-700">{variable.label}</span>
                              {metadataReverse && <span className="shrink-0 text-[7px] font-semibold text-violet-700">metadata ↺</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                    <p className="text-[9px] font-semibold text-cyan-900">Listwise-complete reliability</p>
                    <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">Cronbach's α, standardized α, corrected item-rest correlations and α if deleted update immediately. Questionnaire reverse-key metadata is shown as a cue but does not silently transform stored values.</p>
                  </div>
                </div>
              ) : activeAnalysis === "regression" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                      Regression setup
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">
                      Model a numeric outcome from one or more numeric predictors.
                    </p>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Outcome variable</span>
                      <select
                        value={regressionOutcomeVariable}
                        onChange={(event) => {
                          const value = event.target.value;
                          setRegressionOutcomeVariable(value);
                          setRegressionPredictors((current) => current.filter((name) => name !== value));
                        }}
                        className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                      >
                        {regressionCandidates.length === 0 && <option value="">No numeric variables available</option>}
                        {regressionCandidates.map((variable) => (
                          <option key={variable.name} value={variable.name}>{variable.label}</option>
                        ))}
                      </select>
                    </label>

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Predictors</span>
                        <span className="text-[8px] font-semibold text-cyan-700">{regressionPredictors.length} selected</span>
                      </div>
                      <div className="relative mt-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          value={variableSearch}
                          onChange={(event) => setVariableSearch(event.target.value)}
                          placeholder="Find predictor..."
                          className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none"
                        />
                      </div>
                      <div className="mt-2 max-h-[300px] space-y-1 overflow-y-auto pr-1">
                        {regressionCandidates
                          .filter((variable) => variable.name !== regressionOutcomeVariable)
                          .filter((variable) => {
                            const query = variableSearch.trim().toLowerCase();
                            return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                          })
                          .map((variable) => {
                            const checked = regressionPredictors.includes(variable.name);
                            return (
                              <button
                                key={variable.name}
                                type="button"
                                onClick={() =>
                                  setRegressionPredictors((current) =>
                                    current.includes(variable.name)
                                      ? current.filter((name) => name !== variable.name)
                                      : [...current, variable.name]
                                  )
                                }
                                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${
                                  checked
                                    ? "border-cyan-300 bg-cyan-50/70"
                                    : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}>
                                  <Check className="h-3 w-3" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span>
                                  <span className="block truncate font-mono text-[8px] text-slate-400">{variable.name}</span>
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {regressionPredictorMeta.length > 0 && (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                        <p className="text-[9px] font-semibold text-cyan-900">OLS · intercept included</p>
                        <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">
                          The model uses listwise-complete rows across the outcome and every selected predictor. Standardized β, 95% confidence intervals, tolerance and VIF are calculated automatically.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reported automatically</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["R² + adjusted R²", "Model F", "β + 95% CI", "VIF", "Residual diagnostics"].map((label) => (
                        <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeAnalysis === "anova" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                      ANOVA setup
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">
                      Compare groups or repeated conditions with deterministic omnibus and post-hoc tests.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        ["between", "One-way"],
                        ["repeated", "Repeated"],
                      ] as Array<[AnovaMode, string]>).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setAnovaMode(mode)}
                          className={`rounded-xl px-3 py-2.5 text-[10px] font-semibold ${
                            anovaMode === mode
                              ? "bg-slate-950 text-white shadow-sm"
                              : "text-slate-500"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {anovaMode === "between" ? (
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Outcome variable</span>
                        <select
                          value={anovaOutcomeVariable}
                          onChange={(event) => setAnovaOutcomeVariable(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {anovaNumericCandidates.length === 0 && <option value="">No numeric variables available</option>}
                          {anovaNumericCandidates.map((variable) => (
                            <option key={variable.name} value={variable.name}>{variable.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Factor / grouping variable</span>
                        <select
                          value={anovaFactorVariable}
                          onChange={(event) => setAnovaFactorVariable(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {anovaFactorCandidates.length === 0 && <option value="">No factors available</option>}
                          {anovaFactorCandidates
                            .filter((variable) => variable.name !== anovaOutcomeVariable)
                            .map((variable) => (
                              <option key={variable.name} value={variable.name}>
                                {variable.label} · {variable.distinctCount} levels
                              </option>
                            ))}
                        </select>
                      </label>

                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Omnibus estimator</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {([
                            ["standard", "Standard"],
                            ["welch", "Welch"],
                          ] as Array<[OneWayAnovaEstimator, string]>).map(([estimator, label]) => (
                            <button
                              key={estimator}
                              type="button"
                              onClick={() => setAnovaEstimator(estimator)}
                              className={`rounded-xl border px-3 py-2.5 text-[9px] font-semibold ${
                                anovaEstimator === estimator
                                  ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                                  : "border-slate-200 bg-white text-slate-500"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-[8px] leading-4 text-slate-400">
                          Standard ANOVA uses the pooled within-group variance. Welch is more robust when group variances or sample sizes differ.
                        </p>
                      </div>

                      {oneWayAnovaResult && (
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                          <p className="text-[9px] font-semibold text-cyan-900">{oneWayAnovaResult.groups.length} groups · N = {oneWayAnovaResult.totalN}</p>
                          <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">
                            All non-missing factor levels enter the omnibus test. Pairwise follow-ups are Holm-adjusted automatically.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Repeated conditions</span>
                          <span className="text-[8px] font-semibold text-cyan-700">{anovaRepeatedVariables.length} selected</span>
                        </div>
                        <div className="relative mt-2">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input
                            value={variableSearch}
                            onChange={(event) => setVariableSearch(event.target.value)}
                            placeholder="Find repeated variable..."
                            className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none"
                          />
                        </div>
                        <div className="mt-2 max-h-[300px] space-y-1 overflow-y-auto pr-1">
                          {anovaNumericCandidates
                            .filter((variable) => {
                              const query = variableSearch.trim().toLowerCase();
                              return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                            })
                            .map((variable) => {
                              const checked = anovaRepeatedVariables.includes(variable.name);
                              return (
                                <button
                                  key={variable.name}
                                  type="button"
                                  onClick={() =>
                                    setAnovaRepeatedVariables((current) =>
                                      current.includes(variable.name)
                                        ? current.filter((name) => name !== variable.name)
                                        : [...current, variable.name]
                                    )
                                  }
                                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${
                                    checked
                                      ? "border-cyan-200 bg-cyan-50/70"
                                      : "border-slate-100 bg-white hover:border-slate-200"
                                  }`}
                                >
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}>
                                    <Check className="h-3 w-3" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span>
                                    <span className="block truncate font-mono text-[8px] text-slate-400">{variable.name}</span>
                                  </span>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-violet-50/55 p-3">
                        <p className="text-[9px] font-semibold text-violet-800">Complete-case repeated measures</p>
                        <p className="mt-1 text-[8px] leading-4 text-violet-700/75">
                          Each selected variable is treated as one within-participant condition. The omnibus V1 test uses participants with valid values in every selected condition and assumes sphericity.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reported automatically</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Omnibus F", "Effect size", "Descriptives", "Holm post-hoc"].map((label) => (
                        <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeAnalysis === "ttests" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                      T-test setup
                    </p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">
                      Assign variables to comparison roles. Results update immediately.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        ["independent", "Independent"],
                        ["paired", "Paired"],
                      ] as Array<[TTestMode, string]>).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTTestMode(mode)}
                          className={`rounded-xl px-3 py-2.5 text-[10px] font-semibold ${
                            tTestMode === mode
                              ? "bg-slate-950 text-white shadow-sm"
                              : "text-slate-500"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {tTestMode === "independent" ? (
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                          Outcome variable
                        </span>
                        <select
                          value={tOutcomeVariable}
                          onChange={(event) => setTOutcomeVariable(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {tTestNumericCandidates.length === 0 && (
                            <option value="">No numeric variables available</option>
                          )}
                          {tTestNumericCandidates.map((variable) => (
                            <option key={variable.name} value={variable.name}>
                              {variable.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                          Grouping variable
                        </span>
                        <select
                          value={tGroupVariable}
                          onChange={(event) => setTGroupVariable(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {tTestGroupCandidates.length === 0 && (
                            <option value="">No grouping variables available</option>
                          )}
                          {tTestGroupCandidates.map((variable) => (
                            <option key={variable.name} value={variable.name}>
                              {variable.label} · {variable.distinctCount} levels
                            </option>
                          ))}
                        </select>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                            Group 1
                          </span>
                          <select
                            value={tGroupA}
                            onChange={(event) => {
                              const value = event.target.value;
                              setTGroupA(value);
                              if (value === tGroupB) {
                                setTGroupB(
                                  tGroupLevels.find((level) => level.value !== value)?.value || ""
                                );
                              }
                            }}
                            className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                          >
                            {tGroupLevels.map((level) => (
                              <option key={level.value} value={level.value}>
                                {level.label} · n={level.count}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                            Group 2
                          </span>
                          <select
                            value={tGroupB}
                            onChange={(event) => setTGroupB(event.target.value)}
                            className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                          >
                            {tGroupLevels
                              .filter((level) => level.value !== tGroupA)
                              .map((level) => (
                                <option key={level.value} value={level.value}>
                                  {level.label} · n={level.count}
                                </option>
                              ))}
                          </select>
                        </label>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                          Variance estimator
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {([
                            ["welch", "Welch"],
                            ["student", "Student"],
                          ] as Array<[IndependentTTestEstimator, string]>).map(([estimator, label]) => (
                            <button
                              key={estimator}
                              type="button"
                              onClick={() => setTTestEstimator(estimator)}
                              className={`rounded-xl border px-3 py-2.5 text-[9px] font-semibold ${
                                tTestEstimator === estimator
                                  ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                                  : "border-slate-200 bg-white text-slate-500"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-[8px] leading-4 text-slate-400">
                          Welch is recommended by default because it does not require equal group variances. Student uses a pooled variance estimate.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                          Variable A
                        </span>
                        <select
                          value={pairedVariableA}
                          onChange={(event) => {
                            const value = event.target.value;
                            setPairedVariableA(value);
                            if (value === pairedVariableB) {
                              setPairedVariableB(
                                tTestNumericCandidates.find((variable) => variable.name !== value)?.name || ""
                              );
                            }
                          }}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {tTestNumericCandidates.map((variable) => (
                            <option key={variable.name} value={variable.name}>
                              {variable.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                          Variable B
                        </span>
                        <select
                          value={pairedVariableB}
                          onChange={(event) => setPairedVariableB(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {tTestNumericCandidates
                            .filter((variable) => variable.name !== pairedVariableA)
                            .map((variable) => (
                              <option key={variable.name} value={variable.name}>
                                {variable.label}
                              </option>
                            ))}
                        </select>
                      </label>

                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                        <p className="text-[9px] font-semibold text-cyan-900">Paired observations</p>
                        <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">
                          Only rows with valid values for both variables enter the paired test. The reported difference is A − B.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                      Reported automatically
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Two-sided p", "95% CI", "Effect size", "Group descriptives"].map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">
                Variables
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Add variables to the analysis set.
              </p>
            </div>
            {selectedVariables.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedVariables([])}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-500"
              >
                Clear
              </button>
            )}
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={variableSearch}
              onChange={(event) => setVariableSearch(event.target.value)}
              placeholder="Search variables..."
              className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[11px] outline-none"
            />
          </div>

          <div className="mt-3 max-h-[270px] space-y-1 overflow-y-auto pr-1">
            {visibleVariables.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-[10px] text-slate-400">
                No variables match this search.
              </div>
            ) : (
              visibleVariables.map((variable) => {
                const selected = selectedVariables.includes(variable.name);
                const selectable = selectableVariables.some((entry) => entry.name === variable.name);

                return (
                  <button
                    key={variable.name}
                    type="button"
                    disabled={!selectable}
                    onClick={() => toggleVariable(variable.name)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left ${
                      selected
                        ? "border-cyan-300/80 bg-cyan-50/70"
                        : selectable
                          ? "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                          : "cursor-not-allowed border-transparent bg-white opacity-40 hover:translate-y-0"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ${
                          selected
                            ? "bg-cyan-800 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {variable.level === "continuous" || variable.level === "ordinal"
                          ? "#"
                          : "A"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[11px] font-semibold text-slate-800">
                            {variable.label}
                          </p>
                          {selected && (
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-800" />
                          )}
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[8px] text-slate-400">
                          {variable.name}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <VariableTypePill variable={variable} />
                          <span className="text-[8px] text-slate-400">
                            {variable.validCount} valid
                          </span>
                          {variable.missingCount > 0 && (
                            <span className="text-[8px] text-slate-400">
                              · {variable.missingCount} missing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-800">
                  Analysis variables
                </p>
                <p className="mt-0.5 text-[9px] text-slate-400">
                  {selectedVariables.length} selected
                </p>
              </div>
              <Layers3 className="h-4 w-4 text-slate-300" />
            </div>

            <div className="mt-3 max-h-[190px] space-y-2 overflow-y-auto pr-1">
              {selectedMeta.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
                  <CircleDot className="mx-auto h-4 w-4 text-slate-300" />
                  <p className="mt-2 text-[9px] leading-4 text-slate-400">
                    Select variables above to populate the analysis.
                  </p>
                </div>
              ) : (
                selectedMeta.map((variable) => (
                  <SelectedVariableChip
                    key={variable.name}
                    variable={variable}
                    onRemove={() => toggleVariable(variable.name)}
                  />
                ))
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setStatisticsOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl px-1 py-1 text-left hover:translate-y-0"
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-800">Statistics</p>
                <p className="mt-0.5 text-[9px] text-slate-400">
                  Choose what appears in the output table.
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition ${
                  statisticsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {statisticsOpen && activeAnalysis === "descriptives" && (
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
                {optionEntries.map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-2 text-[9px] leading-4 text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={options[key]}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))
                      }
                      className="mt-0.5 rounded border-slate-300"
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}

            {statisticsOpen && activeAnalysis === "correlations" && (
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Method</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["pearson", "spearman"] as CorrelationMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setCorrelationMethod(method)}
                        className={`rounded-xl border px-3 py-2 text-[9px] font-semibold capitalize ${
                          correlationMethod === method
                            ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[9px] leading-4 text-slate-600">
                  <input
                    type="checkbox"
                    checked={showCorrelationP}
                    onChange={(event) => setShowCorrelationP(event.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  Show two-sided p-values
                </label>

                <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[9px] leading-4 text-slate-600">
                  <input
                    type="checkbox"
                    checked={showCorrelationN}
                    onChange={(event) => setShowCorrelationN(event.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  Show pairwise valid N
                </label>

                <p className="text-[8px] leading-4 text-slate-400">
                  Missing values are handled pairwise. Spearman uses average ranks for ties.
                </p>
              </div>
            )}

            {activeAnalysis === "descriptives" && (
              <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[9px] leading-4 text-slate-600">
                <input
                  type="checkbox"
                  checked={showFrequencies}
                  onChange={(event) => setShowFrequencies(event.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                Frequency tables for categorical and ordinal variables
              </label>
            )}
          </div>
                </>
              )}
            </>
          )}
        </aside>

        <section
          className={`min-w-0 bg-[#fbfcfd] p-4 sm:p-5 lg:p-6 ${
            isFullscreen ? "min-h-0 overflow-y-auto" : ""
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[9px] font-semibold uppercase tracking-[.13em] text-slate-400">
                  Results
                </p>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[8px] font-semibold text-slate-500">
                  Live
                </span>
              </div>
              <h3 className="mt-1.5 text-[22px] font-semibold tracking-[-0.035em] text-slate-950">
                {activeAnalysis === "correlations"
                  ? "Correlation analysis"
                  : activeAnalysis === "ttests"
                    ? "T-test analysis"
                    : activeAnalysis === "anova"
                      ? "ANOVA analysis"
                      : activeAnalysis === "regression"
                        ? "Regression analysis"
                        : activeAnalysis === "reliability"
                          ? "Reliability analysis"
                          : "Descriptive analysis"}
              </h3>
              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                {activeAnalysis === "correlations"
                  ? `${correlationMethod === "pearson" ? "Pearson" : "Spearman"} matrix with pairwise valid observations.`
                  : activeAnalysis === "ttests"
                    ? tTestMode === "independent"
                      ? `${tTestEstimator === "welch" ? "Welch" : "Student"} independent-samples comparison with confidence intervals and effect sizes.`
                      : "Paired-samples comparison with pairwise-complete observations and Cohen's dz."
                    : activeAnalysis === "anova"
                      ? anovaMode === "between"
                        ? `${anovaEstimator === "welch" ? "Welch" : "Standard"} one-way ANOVA with effect sizes and Holm-adjusted pairwise comparisons.`
                        : "One-factor repeated-measures ANOVA with complete cases, effect sizes and Holm-adjusted paired follow-ups."
                      : activeAnalysis === "regression"
                        ? "Ordinary least-squares multiple regression with standardized coefficients, collinearity checks and residual diagnostics."
                        : activeAnalysis === "reliability"
                          ? "Internal-consistency analysis with Cronbach's α, standardized α, corrected item-rest correlations and deletion diagnostics."
                          : "Output updates immediately when variables or statistics change."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {copyStatus && (
                <span className="text-[10px] font-semibold text-cyan-700">
                  {copyStatus}
                </span>
              )}
              <button
                type="button"
                onClick={() => void copyActiveResults()}
                disabled={
                  activeAnalysis === "correlations"
                    ? correlationVariables.length < 2
                    : activeAnalysis === "ttests"
                      ? tTestMode === "independent"
                        ? !independentTTestResult || independentTTestResult.t === null
                        : !pairedTTestResult || pairedTTestResult.t === null
                      : activeAnalysis === "anova"
                        ? anovaMode === "between"
                          ? !oneWayAnovaResult || oneWayAnovaResult.f === null
                          : !repeatedMeasuresAnovaResult || repeatedMeasuresAnovaResult.f === null
                        : activeAnalysis === "regression"
                          ? !linearRegressionResult || Boolean(linearRegressionResult.issue) || linearRegressionResult.coefficients.length === 0
                          : activeAnalysis === "reliability"
                            ? Boolean(reliabilityResult.issue) || reliabilityResult.alpha === null || reliabilityResult.items.length < 2
                            : numericResults.length === 0
                }
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,.055)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy formatted table
              </button>
            </div>
          </div>

          {activeRows.length === 0 ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                No data to analyse yet
              </p>
              <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-500">
                Choose another PsyLattice dataset, include TEST data while validating, or upload a CSV.
              </p>
            </div>
          ) : activeAnalysis === "correlations" && correlationVariables.length < 2 ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Select at least two numeric variables
              </p>
              <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-500">
                Correlations use continuous or ordinal variables. Select two or more variables from the setup panel.
              </p>
            </div>
          ) : activeAnalysis === "ttests" &&
            (tTestMode === "independent"
              ? !independentTTestResult
              : !pairedTTestResult) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Finish the T-test setup
              </p>
              <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-500">
                Choose the outcome and two groups for an independent test, or choose two numeric variables for a paired test.
              </p>
            </div>
          ) : activeAnalysis === "ttests" &&
            (tTestMode === "independent"
              ? independentTTestResult?.t === null
              : pairedTTestResult?.t === null) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-violet-200 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-violet-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Not enough variation or complete observations
              </p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                A t-test needs at least two usable observations per independent group, or at least two complete pairs, with non-zero variability in the relevant standard error.
              </p>
            </div>
          ) : activeAnalysis === "anova" &&
            (anovaMode === "between"
              ? !oneWayAnovaResult || oneWayAnovaResult.groups.length < 2
              : !repeatedMeasuresAnovaResult || anovaRepeatedVariables.length < 2) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the ANOVA setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {anovaMode === "between"
                  ? "Choose a numeric outcome and a factor with at least two observed groups."
                  : "Select at least two numeric variables representing repeated conditions for the same participants."}
              </p>
            </div>
          ) : activeAnalysis === "anova" &&
            (anovaMode === "between"
              ? oneWayAnovaResult?.f === null
              : repeatedMeasuresAnovaResult?.f === null) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-violet-200 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-violet-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Not enough usable variance or observations</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {anovaMode === "between"
                  ? anovaEstimator === "welch"
                    ? "Welch ANOVA requires at least two observations with non-zero variance in every included group. Try Standard ANOVA or inspect the selected groups."
                    : "The one-way ANOVA needs residual degrees of freedom and within-group information. Inspect the selected factor and outcome."
                  : "Repeated-measures ANOVA needs at least two complete participants across all selected conditions and measurable within-subject error variance."}
              </p>
            </div>
          ) : activeAnalysis === "reliability" && (reliabilityVariables.length < 2 || reliabilityResult.issue) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the reliability setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {reliabilityVariables.length < 2
                  ? "Select at least two numeric items from the same scale or subscale."
                  : reliabilityResult.issue}
              </p>
            </div>
          ) : activeAnalysis === "regression" && (!linearRegressionResult || linearRegressionResult.issue) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the regression setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {linearRegressionResult?.issue || "Choose a numeric outcome and at least one different numeric predictor."}
              </p>
            </div>
          ) : activeAnalysis !== "ttests" && activeAnalysis !== "anova" && activeAnalysis !== "regression" && activeAnalysis !== "reliability" && selectedVariables.length === 0 ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Build your analysis
              </p>
              <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-500">
                Select one or more usable variables from the setup panel. Results will appear here instantly.
              </p>
            </div>
          ) : activeAnalysis === "reliability" && reliabilityResult.alpha !== null ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Cronbach's α", formatNumber(reliabilityResult.alpha, 3), `${reliabilityResult.itemCount} items`],
                  ["Standardized α", formatNumber(reliabilityResult.standardizedAlpha, 3), `Mean r = ${formatNumber(reliabilityResult.meanInterItemCorrelation, 3)}`],
                  ["Complete cases", reliabilityResult.completeCases.toLocaleString(), `${formatNumber(reliabilityResult.completePercent, 1)}% of rows`],
                  ["Scale SD", formatNumber(reliabilityResult.scaleSd, 3), `Mean total = ${formatNumber(reliabilityResult.scaleMean, 3)}`],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Scale consistency</p>
                    <p className="mt-1 text-[12px] font-semibold text-slate-900">{reliabilityResult.itemCount} selected items · N = {reliabilityResult.completeCases}</p>
                    <p className="mt-1 text-[9px] text-slate-500">{reliabilityResult.reversedItems.length > 0 ? `${reliabilityResult.reversedItems.length} reverse transformation${reliabilityResult.reversedItems.length === 1 ? "" : "s"} applied` : "No reverse transformations applied"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-cyan-900">α = {formatNumber(reliabilityResult.alpha, 3)}</span>
                    <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-violet-800">αstd = {formatNumber(reliabilityResult.standardizedAlpha, 3)}</span>
                    <button
                      type="button"
                      onClick={() => void copyTableSpec(reliabilitySummaryTableSpec(), "Reliability summary copied")}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600 shadow-sm hover:border-cyan-200 hover:text-cyan-800"
                    >
                      Copy scale summary
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-[12px] font-semibold text-slate-900">Item diagnostics</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-400">Corrected item-rest correlations and the scale α after deleting each item.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                      <tr>{["Item", "Direction", "Mean", "SD", "Item-rest r", "α if deleted"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reliabilityResult.items.map((item) => (
                        <tr key={item.variable}>
                          <td className="max-w-[360px] px-4 py-3.5 font-semibold text-slate-800">
                            <p className="truncate">{item.label}</p>
                            <p className="mt-0.5 truncate font-mono text-[8px] font-normal text-slate-400">{item.variable}</p>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {item.reversed ? (
                              <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[8px] font-semibold text-violet-700">Reversed {formatNumber(item.reverseMin, 2)}–{formatNumber(item.reverseMax, 2)}</span>
                            ) : (
                              <span className="text-slate-400">Original</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(item.mean, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(item.sd, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatNumber(item.itemRestCorrelation, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(item.alphaIfDeleted, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Mean inter-item r", formatNumber(reliabilityResult.meanInterItemCorrelation, 3)],
                  ["Mean total score", formatNumber(reliabilityResult.scaleMean, 3)],
                  ["SD total score", formatNumber(reliabilityResult.scaleSd, 3)],
                  ["Rows excluded", String(Math.max(0, reliabilityResult.totalRows - reliabilityResult.completeCases))],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p>
                    <p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              <p className="px-1 text-[8px] leading-4 text-slate-400">Reliability V1 uses complete rows across the selected items. Reverse-key metadata is surfaced as a cue; values are transformed only when the researcher explicitly enables Reverse in this analysis.</p>
            </div>
          ) : activeAnalysis === "regression" && linearRegressionResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Observations", linearRegressionResult.n.toLocaleString(), `${linearRegressionResult.predictorCount} predictor${linearRegressionResult.predictorCount === 1 ? "" : "s"}`],
                  ["R²", formatNumber(linearRegressionResult.rSquared, 3), `Adjusted ${formatNumber(linearRegressionResult.adjustedRSquared, 3)}`],
                  ["F", formatNumber(linearRegressionResult.f, 3), `df = ${formatNumber(linearRegressionResult.dfModel, 0)}, ${formatNumber(linearRegressionResult.dfResidual, 0)}`],
                  ["p", formatPValue(linearRegressionResult.pValue), `RMSE = ${formatNumber(linearRegressionResult.rmse, 3)}`],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Outcome model</p>
                    <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{linearRegressionResult.outcomeLabel}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-500">
                      {linearRegressionResult.predictors.map((predictor) => predictor.label).join(" + ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-cyan-900">R² = {formatNumber(linearRegressionResult.rSquared, 3)}</span>
                    <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-violet-800">Adj. R² = {formatNumber(linearRegressionResult.adjustedRSquared, 3)}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Model fit</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">OLS omnibus model test and explained variance.</p>
                  </div>
                  <button type="button" onClick={() => void copyTableSpec(regressionModelTableSpec(), "Model-fit table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy model fit</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Source", "SS", "df", "MS", "F", "p"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="px-4 py-3.5 font-semibold text-slate-800">Regression</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(linearRegressionResult.ssRegression, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(linearRegressionResult.dfModel, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(linearRegressionResult.ssRegression !== null && linearRegressionResult.dfModel ? linearRegressionResult.ssRegression / linearRegressionResult.dfModel : null, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatNumber(linearRegressionResult.f, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(linearRegressionResult.pValue)}</td></tr>
                      <tr><td className="px-4 py-3.5 font-semibold text-slate-800">Residual</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(linearRegressionResult.ssResidual, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(linearRegressionResult.dfResidual, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(linearRegressionResult.rmse !== null ? linearRegressionResult.rmse ** 2 : null, 3)}</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-[12px] font-semibold text-slate-900">Coefficients</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-400">Unstandardized B, standardized β, confidence intervals and multicollinearity diagnostics.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Predictor", "B", "SE", "β", "t", "p", "95% CI", "Tolerance", "VIF"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {linearRegressionResult.coefficients.map((coefficient) => (
                        <tr key={coefficient.term}>
                          <td className="max-w-[300px] px-4 py-3.5 font-semibold text-slate-800">{coefficient.label}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.b, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.se, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{coefficient.isIntercept ? "—" : formatNumber(coefficient.beta, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.t, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(coefficient.pValue)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.ci95Low, 3)}, {formatNumber(coefficient.ci95High, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{coefficient.isIntercept ? "—" : formatNumber(coefficient.tolerance, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{coefficient.isIntercept ? "—" : formatNumber(coefficient.vif, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-[12px] font-semibold text-slate-900">Residual diagnostics</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-400">Compact influence and residual checks for model review.</p>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 2xl:grid-cols-4 sm:p-5">
                  {[
                    ["RMSE", formatNumber(linearRegressionResult.diagnostics.rmse, 3), "Residual scale"],
                    ["Durbin–Watson", formatNumber(linearRegressionResult.diagnostics.durbinWatson, 3), "Residual sequence"],
                    ["Max |std. residual|", formatNumber(linearRegressionResult.diagnostics.maxAbsoluteStandardizedResidual, 3), `${linearRegressionResult.diagnostics.highResidualCount} above |3|`],
                    ["Max Cook's D", formatNumber(linearRegressionResult.diagnostics.maxCookDistance, 3), `${linearRegressionResult.diagnostics.highLeverageCount} high-leverage rows`],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p><p className="mt-1 text-[8px] text-slate-400">{detail}</p></div>
                  ))}
                </div>
              </div>

              <p className="px-1 text-[8px] leading-4 text-slate-400">
                Linear Regression V1 accepts continuous or ordinal numeric predictors. Categorical dummy coding and logistic regression are intentionally deferred to later model families.
              </p>
            </div>
          ) : activeAnalysis === "anova" ? (
            <div className="mt-6 space-y-5">
              {anovaMode === "between" && oneWayAnovaResult ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Model", oneWayAnovaResult.estimator === "welch" ? "Welch" : "One-way", oneWayAnovaResult.estimator === "welch" ? "Unequal variances" : "Classical ANOVA"],
                      ["Observations", oneWayAnovaResult.totalN.toLocaleString(), `${oneWayAnovaResult.groups.length} groups`],
                      ["F", formatNumber(oneWayAnovaResult.f, 3), `df = ${formatNumber(oneWayAnovaResult.df1, 0)}, ${formatNumber(oneWayAnovaResult.df2, 2)}`],
                      ["p", formatPValue(oneWayAnovaResult.pValue), `η² = ${formatNumber(oneWayAnovaResult.etaSquared, 3)}`],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                        <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                        <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Between-group model</p>
                        <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{oneWayAnovaResult.outcomeLabel} by {oneWayAnovaResult.factorLabel}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-cyan-900">η² = {formatNumber(oneWayAnovaResult.etaSquared, 3)}</span>
                        <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-violet-800">ω² = {formatNumber(oneWayAnovaResult.omegaSquared, 3)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                      <p className="text-[12px] font-semibold text-slate-900">Group descriptives</p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-400">Observed factor levels entering the omnibus model.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-left text-[10px]">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr><th className="px-4 py-3 font-semibold">Group</th><th className="px-4 py-3 font-semibold">N</th><th className="px-4 py-3 font-semibold">Mean</th><th className="px-4 py-3 font-semibold">SD</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {oneWayAnovaResult.groups.map((group) => (
                            <tr key={group.value}><td className="px-4 py-3.5 font-semibold text-slate-800">{group.label}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{group.n}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(group.mean, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(group.sd, 3)}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div><p className="text-[12px] font-semibold text-slate-900">Omnibus ANOVA</p><p className="mt-1 text-[9px] leading-4 text-slate-400">{oneWayAnovaResult.estimator === "welch" ? "Welch's heteroscedastic one-way test." : "Classical between-groups one-way ANOVA."}</p></div>
                      <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">Effect sizes included</span>
                    </div>
                    <div className="overflow-x-auto">
                      {oneWayAnovaResult.estimator === "welch" ? (
                        <table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["F", "df₁", "df₂", "p", "η²", "ω²"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody><tr><td className="px-4 py-3.5 font-semibold text-slate-900">{formatNumber(oneWayAnovaResult.f, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.df1, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.df2, 2)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(oneWayAnovaResult.pValue)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.etaSquared, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.omegaSquared, 3)}</td></tr></tbody></table>
                      ) : (
                        <table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Source", "SS", "df", "MS", "F", "p", "η²", "ω²"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
                          <tr><td className="px-4 py-3.5 font-semibold text-slate-800">Between groups</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.ssBetween, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.df1, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.ssBetween !== null && oneWayAnovaResult.df1 ? oneWayAnovaResult.ssBetween / oneWayAnovaResult.df1 : null, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatNumber(oneWayAnovaResult.f, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(oneWayAnovaResult.pValue)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.etaSquared, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.omegaSquared, 3)}</td></tr>
                          <tr><td className="px-4 py-3.5 font-semibold text-slate-800">Within groups</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.ssWithin, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.df2, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(oneWayAnovaResult.ssWithin !== null && oneWayAnovaResult.df2 ? oneWayAnovaResult.ssWithin / oneWayAnovaResult.df2 : null, 3)}</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td></tr>
                        </tbody></table>
                      )}
                    </div>
                  </div>

                  {oneWayAnovaResult.pairwise.length > 0 && (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Pairwise comparisons</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Holm-adjusted follow-ups across every observed group pair.</p></div><button type="button" onClick={() => void copyTableSpec(anovaPairwiseTableSpec(), "Post-hoc table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy post-hoc</button></div>
                      <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Comparison", "ΔM", "t", "df", "p", "Holm p", "d"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{oneWayAnovaResult.pairwise.map((comparison) => <tr key={`${comparison.groupA}-${comparison.groupB}`}><td className="px-4 py-3.5 font-semibold text-slate-800">{comparison.groupA} − {comparison.groupB}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.meanDifference, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.t, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.df, 2)}</td><td className="px-4 py-3.5 text-slate-600">{formatPValue(comparison.pValue)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(comparison.pAdjusted)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.cohenD, 3)}</td></tr>)}</tbody></table></div>
                    </div>
                  )}

                  <p className="px-1 text-[8px] leading-4 text-slate-400">{oneWayAnovaResult.estimator === "welch" ? "Welch ANOVA is designed for unequal variances. Conventional η² and ω² are shown as descriptive effect-size decompositions." : "Standard one-way ANOVA assumes independent observations and homogeneous within-group variance."}</p>
                </>
              ) : repeatedMeasuresAnovaResult ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Model", "Repeated", `${repeatedMeasuresAnovaResult.conditionCount} conditions`],
                      ["Complete cases", repeatedMeasuresAnovaResult.completeCases.toLocaleString(), "Valid in every condition"],
                      ["F", formatNumber(repeatedMeasuresAnovaResult.f, 3), `df = ${formatNumber(repeatedMeasuresAnovaResult.df1, 0)}, ${formatNumber(repeatedMeasuresAnovaResult.df2, 0)}`],
                      ["p", formatPValue(repeatedMeasuresAnovaResult.pValue), `ηp² = ${formatNumber(repeatedMeasuresAnovaResult.partialEtaSquared, 3)}`],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p><p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p></div>
                    ))}
                  </div>

                  <div className="rounded-[22px] border border-violet-100 bg-[linear-gradient(120deg,#faf7ff_0%,#ffffff_58%,#effcff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-violet-700">Within-participant model</p><p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{repeatedMeasuresAnovaResult.conditions.map((condition) => condition.label).join(" · ")}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-violet-800">ηp² = {formatNumber(repeatedMeasuresAnovaResult.partialEtaSquared, 3)}</span><span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-cyan-900">ηG² = {formatNumber(repeatedMeasuresAnovaResult.generalizedEtaSquared, 3)}</span></div></div></div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]"><div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Condition descriptives</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Means and SDs among the same complete-case participants.</p></div><div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr><th className="px-4 py-3 font-semibold">Condition</th><th className="px-4 py-3 font-semibold">N</th><th className="px-4 py-3 font-semibold">Mean</th><th className="px-4 py-3 font-semibold">SD</th></tr></thead><tbody className="divide-y divide-slate-100">{repeatedMeasuresAnovaResult.conditions.map((condition) => <tr key={condition.variable}><td className="px-4 py-3.5 font-semibold text-slate-800">{condition.label}</td><td className="px-4 py-3.5 text-slate-600">{condition.n}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(condition.mean, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(condition.sd, 3)}</td></tr>)}</tbody></table></div></div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]"><div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Repeated-measures ANOVA</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Sphericity-assumed V1 omnibus model.</p></div><span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[8px] font-semibold text-violet-700">ηp² + ηG²</span></div><div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Source", "SS", "df", "MS", "F", "p", "ηp²", "ηG²"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100"><tr><td className="px-4 py-3.5 font-semibold text-slate-800">Condition</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.ssCondition, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.df1, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.ssCondition !== null && repeatedMeasuresAnovaResult.df1 ? repeatedMeasuresAnovaResult.ssCondition / repeatedMeasuresAnovaResult.df1 : null, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatNumber(repeatedMeasuresAnovaResult.f, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(repeatedMeasuresAnovaResult.pValue)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.partialEtaSquared, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.generalizedEtaSquared, 3)}</td></tr><tr><td className="px-4 py-3.5 font-semibold text-slate-800">Error</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.ssError, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.df2, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.ssError !== null && repeatedMeasuresAnovaResult.df2 ? repeatedMeasuresAnovaResult.ssError / repeatedMeasuresAnovaResult.df2 : null, 3)}</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td></tr></tbody></table></div></div>

                  {repeatedMeasuresAnovaResult.pairwise.length > 0 && <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]"><div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Pairwise comparisons</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Paired follow-ups with Holm-adjusted p-values.</p></div><button type="button" onClick={() => void copyTableSpec(anovaPairwiseTableSpec(), "Post-hoc table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy post-hoc</button></div><div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Comparison", "N", "ΔM", "t", "df", "p", "Holm p", "dz"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{repeatedMeasuresAnovaResult.pairwise.map((comparison) => <tr key={`${comparison.variableA}-${comparison.variableB}`}><td className="px-4 py-3.5 font-semibold text-slate-800">{comparison.variableALabel} − {comparison.variableBLabel}</td><td className="px-4 py-3.5 text-slate-600">{comparison.n}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.meanDifference, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.t, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.df, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatPValue(comparison.pValue)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(comparison.pAdjusted)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.cohenDz, 3)}</td></tr>)}</tbody></table></div></div>}

                  <p className="px-1 text-[8px] leading-4 text-slate-400">The current repeated-measures V1 uses the uncorrected sphericity-assumed F test. Mauchly's test and Greenhouse–Geisser / Huynh–Feldt corrections are deliberately reserved for the next refinement.</p>
                </>
              ) : null}
            </div>
          ) : activeAnalysis === "correlations" ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Method", correlationMethod === "pearson" ? "Pearson" : "Spearman", "Current estimator"],
                  ["Variables", correlationVariables.length.toLocaleString(), "Numeric / ordinal"],
                  ["Pairs", ((correlationVariables.length * (correlationVariables.length - 1)) / 2).toLocaleString(), "Unique associations"],
                  [
                    "Strongest |r|",
                    strongestCorrelation?.r === null || !strongestCorrelation ? "—" : formatNumber(Math.abs(strongestCorrelation.r), 3),
                    strongestCorrelation ? correlationStrengthLabel(strongestCorrelation.r) : "No valid pair",
                  ],
                ].map(([label, value, detail]) => (
                  <div
                    key={label}
                    className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]"
                  >
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              {strongestCorrelation && strongestCorrelation.r !== null && (
                <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_55%,#faf7ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Strongest observed association</p>
                      <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">
                        {strongestCorrelation.xLabel} ↔ {strongestCorrelation.yLabel}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-cyan-900">
                        r = {formatNumber(strongestCorrelation.r, 3)}
                      </span>
                      {showCorrelationP && (
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600">
                          p {formatPValue(strongestCorrelation.pValue)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Correlation matrix</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">
                      Pairwise-complete observations · {correlationMethod === "pearson" ? "Pearson product-moment correlation" : "Spearman rank correlation"}.
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">
                    {correlationVariables.length} variables
                  </span>
                </div>

                <div className="max-w-full overflow-x-auto">
                  <table className="w-full min-w-max border-separate border-spacing-0 text-left text-[10px]">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 text-[8px] uppercase tracking-[.06em] text-slate-400 backdrop-blur">
                      <tr>
                        <th className="sticky left-0 z-20 min-w-[180px] border-b border-r border-slate-100 bg-slate-50/95 px-4 py-3 font-semibold">Variable</th>
                        {correlationMatrix.variables.map((variable) => (
                          <th key={variable.name} className="min-w-[132px] border-b border-slate-100 px-3 py-3 font-semibold">
                            <span className="block max-w-[150px] truncate normal-case tracking-normal" title={variable.label}>{variable.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlationMatrix.variables.map((rowVariable) => (
                        <tr key={rowVariable.name}>
                          <td className="sticky left-0 z-10 max-w-[220px] border-b border-r border-slate-100 bg-white px-4 py-3.5">
                            <p className="truncate text-[10px] font-semibold text-slate-800" title={rowVariable.label}>{rowVariable.label}</p>
                            <p className="mt-0.5 truncate font-mono text-[8px] text-slate-400">{rowVariable.name}</p>
                          </td>
                          {correlationMatrix.variables.map((columnVariable) => {
                            const cell = correlationCellMap.get(`${rowVariable.name}::${columnVariable.name}`);
                            const absolute = Math.abs(cell?.r || 0);
                            const diagonal = rowVariable.name === columnVariable.name;
                            const alpha = diagonal ? 0.055 : Math.min(0.18, 0.025 + absolute * 0.15);
                            return (
                              <td
                                key={columnVariable.name}
                                className="border-b border-slate-100 px-3 py-3 align-top"
                                style={{ backgroundColor: diagonal ? "rgba(15,23,42,.035)" : `rgba(8,145,178,${alpha})` }}
                              >
                                <p className={`text-[11px] font-semibold tabular-nums ${diagonal ? "text-slate-500" : "text-slate-900"}`}>
                                  {cell?.r === null || cell?.r === undefined ? "—" : formatNumber(cell.r, 3)}
                                </p>
                                {!diagonal && showCorrelationP && (
                                  <p className="mt-1 text-[8px] tabular-nums text-slate-500">p {formatPValue(cell?.pValue ?? null)}</p>
                                )}
                                {showCorrelationN && (
                                  <p className="mt-0.5 text-[8px] tabular-nums text-slate-400">N = {cell?.n ?? 0}</p>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="px-1 text-[8px] leading-4 text-slate-400">
                Two-sided p-values use the t distribution for Pearson correlations. Spearman p-values use the conventional t approximation to the rank correlation.
              </p>
            </div>
          ) : activeAnalysis === "ttests" ? (
            <div className="mt-6 space-y-5">
              {tTestMode === "independent" && independentTTestResult ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Test", independentTTestResult.estimator === "welch" ? "Welch" : "Student", "Independent samples"],
                      ["Observations", `${independentTTestResult.nA} + ${independentTTestResult.nB}`, `${independentTTestResult.groupA} + ${independentTTestResult.groupB}`],
                      ["t", formatNumber(independentTTestResult.t, 3), `df = ${formatNumber(independentTTestResult.df, 2)}`],
                      ["p", formatPValue(independentTTestResult.pValue), "Two-sided"],
                    ].map(([label, value, detail]) => (
                      <div
                        key={label}
                        className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]"
                      >
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                        <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                        <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Comparison</p>
                        <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">
                          {independentTTestResult.outcomeLabel} · {independentTTestResult.groupA} vs {independentTTestResult.groupB}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-cyan-900">
                          ΔM = {formatNumber(independentTTestResult.meanDifference, 3)}
                        </span>
                        <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-violet-800">
                          d = {formatNumber(independentTTestResult.cohenD, 3)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                      <p className="text-[12px] font-semibold text-slate-900">Group descriptives</p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-400">Valid observations used by the selected two-group comparison.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-left text-[10px]">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Group</th>
                            <th className="px-4 py-3 font-semibold">N</th>
                            <th className="px-4 py-3 font-semibold">Mean</th>
                            <th className="px-4 py-3 font-semibold">SD</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            [independentTTestResult.groupA, independentTTestResult.nA, independentTTestResult.meanA, independentTTestResult.sdA],
                            [independentTTestResult.groupB, independentTTestResult.nB, independentTTestResult.meanB, independentTTestResult.sdB],
                          ].map(([group, n, mean, sd]) => (
                            <tr key={String(group)}>
                              <td className="px-4 py-3.5 font-semibold text-slate-800">{String(group)}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{String(n)}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(mean as number | null, 3)}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(sd as number | null, 3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div>
                        <p className="text-[12px] font-semibold text-slate-900">Independent-samples t-test</p>
                        <p className="mt-1 text-[9px] leading-4 text-slate-400">
                          {independentTTestResult.estimator === "welch" ? "Welch unequal-variance estimator" : "Student pooled-variance estimator"} · two-sided test.
                        </p>
                      </div>
                      <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">95% CI + effect sizes</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-left text-[10px]">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                          <tr>
                            {["Mean difference", "SE", "t", "df", "p", "95% CI low", "95% CI high", "Cohen's d", "Hedges' g"].map((header) => (
                              <th key={header} className="px-4 py-3 font-semibold">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-3.5 tabular-nums text-slate-700">{formatNumber(independentTTestResult.meanDifference, 3)}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(independentTTestResult.seDifference, 3)}</td>
                            <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatNumber(independentTTestResult.t, 3)}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(independentTTestResult.df, 2)}</td>
                            <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(independentTTestResult.pValue)}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(independentTTestResult.ci95Low, 3)}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(independentTTestResult.ci95High, 3)}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(independentTTestResult.cohenD, 3)}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(independentTTestResult.hedgesG, 3)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="px-1 text-[8px] leading-4 text-slate-400">
                    Difference and effect-size signs follow {independentTTestResult.groupA} − {independentTTestResult.groupB}. Cohen's d and Hedges' g use the pooled group standard deviation; Hedges' g applies a small-sample correction.
                  </p>
                </>
              ) : pairedTTestResult ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Test", "Paired", "Repeated observations"],
                      ["Complete pairs", pairedTTestResult.n.toLocaleString(), "Pairwise valid"],
                      ["t", formatNumber(pairedTTestResult.t, 3), `df = ${formatNumber(pairedTTestResult.df, 0)}`],
                      ["p", formatPValue(pairedTTestResult.pValue), "Two-sided"],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                        <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                        <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[22px] border border-violet-100 bg-[linear-gradient(120deg,#faf7ff_0%,#ffffff_58%,#effcff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-violet-700">Paired comparison</p>
                        <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{pairedTTestResult.variableALabel} − {pairedTTestResult.variableBLabel}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-violet-800">ΔM = {formatNumber(pairedTTestResult.meanDifference, 3)}</span>
                        <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-cyan-900">dz = {formatNumber(pairedTTestResult.cohenDz, 3)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                      <p className="text-[12px] font-semibold text-slate-900">Paired descriptives</p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-400">Means and standard deviations among complete pairs only.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-left text-[10px]">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                          <tr><th className="px-4 py-3 font-semibold">Variable</th><th className="px-4 py-3 font-semibold">N</th><th className="px-4 py-3 font-semibold">Mean</th><th className="px-4 py-3 font-semibold">SD</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[
                            [pairedTTestResult.variableALabel, pairedTTestResult.meanA, pairedTTestResult.sdA],
                            [pairedTTestResult.variableBLabel, pairedTTestResult.meanB, pairedTTestResult.sdB],
                          ].map(([label, mean, sd]) => (
                            <tr key={String(label)}>
                              <td className="px-4 py-3.5 font-semibold text-slate-800">{String(label)}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{pairedTTestResult.n}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(mean as number | null, 3)}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(sd as number | null, 3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div><p className="text-[12px] font-semibold text-slate-900">Paired-samples t-test</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Difference scores are computed row-wise as A − B.</p></div>
                      <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[8px] font-semibold text-violet-700">95% CI + Cohen's dz</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-left text-[10px]">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                          <tr>{["N", "Mean difference", "SD difference", "SE", "t", "df", "p", "95% CI low", "95% CI high", "Cohen's dz"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
                        </thead>
                        <tbody><tr>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{pairedTTestResult.n}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-700">{formatNumber(pairedTTestResult.meanDifference, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(pairedTTestResult.sdDifference, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(pairedTTestResult.seDifference, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatNumber(pairedTTestResult.t, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(pairedTTestResult.df, 0)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(pairedTTestResult.pValue)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(pairedTTestResult.ci95Low, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(pairedTTestResult.ci95High, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(pairedTTestResult.cohenDz, 3)}</td>
                        </tr></tbody>
                      </table>
                    </div>
                  </div>

                  <p className="px-1 text-[8px] leading-4 text-slate-400">The 95% confidence interval is based on the Student t distribution with N − 1 degrees of freedom. Cohen's dz uses the standard deviation of the pairwise difference scores.</p>
                </>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Rows analysed", activeRows.length.toLocaleString(), "Current analysis frame"],
                  ["Variables", selectedVariables.length.toLocaleString(), "Selected for output"],
                  ["Numeric", numericVariables.length.toLocaleString(), "Scale / ordinal"],
                  ["Categorical", categoricalVariables.length.toLocaleString(), "Frequency-ready"],
                ].map(([label, value, detail]) => (
                  <div
                    key={label}
                    className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]"
                  >
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-[22px] font-semibold tracking-[-.03em] text-slate-950">
                      {value}
                    </p>
                    <p className="mt-1 text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              {numericResults.length > 0 && (
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                  <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-900">
                        Descriptive statistics
                      </p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-400">
                        Sample standard deviation and variance use n − 1. Mean confidence intervals use the Student t distribution.
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">
                      {numericResults.length} variable{numericResults.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="max-w-full overflow-x-auto">
                    <table className="w-full min-w-max text-left text-[10px]">
                      <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/95 text-[8px] uppercase tracking-[.07em] text-slate-400 backdrop-blur">
                        <tr>
                          {tableHeaders.map((header) => (
                            <th key={header.key} className="px-4 py-3 font-semibold">
                              {header.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {numericResults.map((result) => (
                          <tr key={result.variable}>
                            {tableHeaders.map((header) => {
                              if (header.key === "variable") {
                                return (
                                  <td key={header.key} className="px-4 py-3.5">
                                    <p className="max-w-[250px] truncate text-[10px] font-semibold text-slate-800">
                                      {result.label}
                                    </p>
                                    <p className="mt-0.5 max-w-[250px] truncate font-mono text-[8px] text-slate-400">
                                      {result.variable}
                                    </p>
                                  </td>
                                );
                              }

                              const value = result[
                                header.key as keyof NumericDescriptives
                              ];

                              return (
                                <td
                                  key={header.key}
                                  className="px-4 py-3.5 tabular-nums text-slate-600"
                                >
                                  {typeof value === "number" ? formatNumber(value) : "—"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {showFrequencies &&
                frequencyResults.map((table) => (
                  <div
                    key={table.variable}
                    className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]"
                  >
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div>
                        <p className="text-[12px] font-semibold text-slate-900">
                          Frequencies · {table.label}
                        </p>
                        <p className="mt-1 font-mono text-[8px] text-slate-400">
                          {table.variable}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[8px] text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          Valid {table.validN}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          Missing {table.missingN}
                        </span>
                        <button
                          type="button"
                          onClick={() => void copyFrequencyTable(table)}
                          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 shadow-sm"
                          title="Copy as a formatted table for Thesis Builder, Word or Google Docs"
                        >
                          <Copy className="h-3 w-3" />
                          Copy formatted
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-left text-[10px]">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Value</th>
                            <th className="px-4 py-3 font-semibold">Count</th>
                            <th className="px-4 py-3 font-semibold">Valid %</th>
                            <th className="px-4 py-3 font-semibold">Total %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {table.rows.slice(0, 100).map((row) => (
                            <tr key={row.value}>
                              <td className="max-w-[380px] truncate px-4 py-3 font-medium text-slate-700">
                                {row.value}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-slate-600">
                                {row.count}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-slate-600">
                                {formatNumber(row.validPercent, 1)}%
                              </td>
                              <td className="px-4 py-3 tabular-nums text-slate-600">
                                {formatNumber(row.totalPercent, 1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
