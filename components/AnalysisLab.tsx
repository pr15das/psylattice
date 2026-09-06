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
  Download,
  History,
  FileSpreadsheet,
  Filter,
  Gauge,
  Layers3,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AnalysisAiAssistant, {
  type AnalysisAiContext,
  type AnalysisAiPreparationStep,
  type AnalysisAiSetupProposal,
  type AnalysisAiWorkflowProposal,
} from "@/components/AnalysisAiAssistant";

import {
  analysisLevelLabel,
  applyAnalysisFilters,
  applyAnalysisVariableOperations,
  computeCorrelationMatrix,
  computeCategoricalAssociation,
  computeFrequencyTable,
  computeGeneralLinearModelAnova,
  computeIndependentTTest,
  computeNumericDescriptives,
  computeOneWayAnova,
  computePairedTTest,
  computeRepeatedMeasuresAnova,
  computeLinearRegression,
  computeMediationAnalysis,
  computePowerAnalysis,
  computeModerationAnalysis,
  computeLinearMixedModel,
  computeGeneralizedMixedModel,
  computeBinaryLogisticRegression,
  computeMultinomialLogisticRegression,
  computeOrdinalLogisticRegression,
  computeCountRegression,
  computeReliability,
  computeExploratoryFactorAnalysis,
  computeVisualizationScatter,
  computeVisualizationDistribution,
  computeVisualizationMeans,
  computeVisualizationInteraction,
  computeCognitiveTaskAnalysis,
  getCognitiveTaskOptions,
  computeMannWhitneyU,
  computeWilcoxonSignedRank,
  computeKruskalWallis,
  computeFriedmanTest,
  computeDistributionDiagnostics,
  computeVarianceHomogeneity,
  computeAnalysisMissingnessProfile,
  computeAnalysisMissingnessPatterns,
  computeAnalysisPairwiseAvailability,
  computeAnalysisSampleAudit,
  computeAnalysisDataFingerprint,
  getVariableLevels,
  inferAnalysisVariables,
  isDescriptiveSelectable,
  isMissingValue,
  parseCsvDataset,
  prepareAnalysisDataset,
  type AnalysisCodebookVariable,
  type AnalysisRow,
  type AnalysisVariable,
  type CorrelationMethod,
  type IndependentTTestEstimator,
  type NumericDescriptives,
  type OneWayAnovaEstimator,
  type DistributionDiagnosticsResult,
  type VarianceTestCenter,
  type MixedModelEstimator,
  type MixedModelCentering,
  type GeneralizedMixedFamily,
  type GeneralizedMixedModelResult,
  type MediationAnalysisResult,
  type ModerationAnalysisResult,
  type PowerAnalysisMode,
  type PowerAnalysisTest,
  type PowerAnalysisTails,
  type PowerAnalysisResult,
  type MultinomialLogisticResult,
  type OrdinalLogisticResult,
  type CountRegressionFamily,
  type CountRegressionResult,
  type AnalysisFilterOperator,
  type AnalysisFilterRule,
  type AnalysisNumericTransform,
  type AnalysisNumericTransformKind,
  type AnalysisComputedVariable,
  type AnalysisComputedOperation,
  type AnalysisRecodeDefinition,
  type AnalysisRepeatedOperation,
  type AnalysisRepeatedOperationKind,
  type FactorExtractionMethod,
  type FactorRotationMethod,
  type VisualizationScatterResult,
  type VisualizationDistributionResult,
  type VisualizationMeansResult,
  type VisualizationInteractionResult,
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

type ActiveAnalysis = "descriptives" | "visualizations" | "cognitive" | "diagnostics" | "correlations" | "ttests" | "nonparametric" | "categorical" | "anova" | "regression" | "process" | "mixed" | "logistic" | "count" | "reliability" | "factor" | "power";
type ProcessMode = "mediation" | "moderation";
type LogisticMode = "binary" | "multinomial" | "ordinal";
type MixedOutcomeFamily = "gaussian" | GeneralizedMixedFamily;
type TTestMode = "independent" | "paired";
type AnovaMode = "between" | "factorial" | "ancova" | "repeated";
type NonParametricMode = "mannwhitney" | "wilcoxon" | "kruskal" | "friedman";
type DiagnosticsMode = "distribution" | "homogeneity";
type VisualizationMode = "scatter" | "box" | "violin" | "means" | "interaction";
type PrepareDataTab = "native" | "sample" | "derive" | "repeated" | "missing";

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

type AnalysisNavCategory = "explore" | "compare" | "model" | "scales" | "design";

type AnalysisCatalogueItem = {
  id: ActiveAnalysis;
  title: string;
  description: string;
  available: boolean;
  category: AnalysisNavCategory;
  badge?: string;
};

type AnalysisNavCategoryDefinition = {
  id: AnalysisNavCategory;
  label: string;
  description: string;
};

const analysisNavCategories: AnalysisNavCategoryDefinition[] = [
  { id: "explore", label: "Explore", description: "Understand the data" },
  { id: "compare", label: "Compare", description: "Group and condition differences" },
  { id: "model", label: "Model", description: "Regression and advanced models" },
  { id: "scales", label: "Scales", description: "Psychometrics" },
  { id: "design", label: "Design", description: "Planning" },
];

const analysisCatalogue: AnalysisCatalogueItem[] = [
  {
    id: "descriptives",
    title: "Descriptives",
    description: "Summaries, distributions and frequencies",
    available: true,
    category: "explore",
  },
  {
    id: "diagnostics",
    title: "Diagnostics",
    description: "Normality, outliers and variance checks",
    available: true,
    category: "explore",
  },
  {
    id: "visualizations",
    title: "Visualizations",
    description: "Scatter, distributions, means and interaction plots",
    available: true,
    category: "explore",
  },
  {
    id: "correlations",
    title: "Correlations",
    description: "Pearson and Spearman associations",
    available: true,
    category: "explore",
  },
  {
    id: "categorical",
    title: "Categorical",
    description: "Contingency tables, χ², Fisher and effect sizes",
    available: true,
    category: "explore",
  },
  {
    id: "ttests",
    title: "T-tests",
    description: "Independent and paired comparisons",
    available: true,
    category: "compare",
  },
  {
    id: "nonparametric",
    title: "Non-parametric",
    description: "Rank-based group and repeated tests",
    available: true,
    category: "compare",
  },
  {
    id: "anova",
    title: "ANOVA",
    description: "One-way, factorial, ANCOVA and repeated measures",
    available: true,
    category: "compare",
  },
  {
    id: "regression",
    title: "Regression",
    description: "Multiple linear models and diagnostics",
    available: true,
    category: "model",
  },
  {
    id: "process",
    title: "Mediation & moderation",
    description: "Indirect effects, interactions and simple slopes",
    available: true,
    category: "model",
  },
  {
    id: "mixed",
    title: "Mixed models",
    description: "Linear, binary and count outcomes nested within participants or clusters",
    available: true,
    category: "model",
    badge: "Core",
  },
  {
    id: "logistic",
    title: "Categorical regression",
    description: "Binary, multinomial and ordinal logistic models",
    available: true,
    category: "model",
  },
  {
    id: "count",
    title: "Count models",
    description: "Poisson and negative-binomial event/count regression",
    available: true,
    category: "model",
  },
  {
    id: "reliability",
    title: "Reliability",
    description: "Cronbach’s α, item-rest and scale diagnostics",
    available: true,
    category: "scales",
    badge: "Scale",
  },
  {
    id: "factor",
    title: "Factor analysis",
    description: "EFA, KMO, Bartlett and rotated factor loadings",
    available: true,
    category: "scales",
  },
  {
    id: "power",
    title: "Power & sample size",
    description: "A priori planning, achieved power and effect-size utilities",
    available: true,
    category: "design",
  },
];

function analysisCategoryFor(id: ActiveAnalysis): AnalysisNavCategory {
  return analysisCatalogue.find((item) => item.id === id)?.category ?? "explore";
}

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

function workbenchId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function suggestedDerivedName(source: string, suffix: string) {
  const base = String(source || "variable").replace(/[^A-Za-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  return `${base || "variable"}_${suffix}`;
}

function analysisAiSafeOutputVariable(value: string) {
  const trimmed = String(value || "").trim();
  return /^[A-Za-z_][A-Za-z0-9_]{0,79}$/.test(trimmed) ? trimmed : "";
}

function analysisAiSetupVariableReferences(setup: Record<string, unknown>) {
  const scalarKeys = [
    "outcome", "group", "factor", "row", "column", "x", "y", "trace",
    "predictor", "mediator", "moderator", "cluster", "exposure", "pairedA", "pairedB", "randomSlope",
  ];
  const arrayKeys = ["predictors", "factors", "covariates", "repeated", "selectedVariables", "reverseItems"];
  const refs: string[] = [];
  scalarKeys.forEach((key) => {
    const value = setup[key];
    if (typeof value === "string" && value) refs.push(value);
  });
  arrayKeys.forEach((key) => {
    const value = setup[key];
    if (Array.isArray(value)) value.forEach((item) => { if (typeof item === "string" && item) refs.push(item); });
  });
  return Array.from(new Set(refs));
}

function formatPercent(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatCognitiveMetric(value: number | null, unit?: string) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (unit === "percent" || unit === "rate") return formatPercent(value);
  if (unit === "ms") return `${formatNumber(value, 1)} ms`;
  if (unit === "count") return formatNumber(value, 0);
  return formatNumber(value, 3);
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

function analysisAiSensitiveVariable(name: string, label: string, level: string) {
  if (level === "id" || level === "text") return true;
  const key = `${name} ${label}`.toLowerCase();
  return /(email|e-mail|phone|mobile|address|street|postal|postcode|zip|full[_ ]?name|first[_ ]?name|last[_ ]?name|surname|participant[_ ]?id|public[_ ]?id|user[_ ]?id|owner[_ ]?id|subject[_ ]?id|contact)/.test(key);
}

function analysisAiPrimitive(value: unknown): string | number | boolean | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, 120);
  return undefined;
}


type FormattedTableSpec = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  note?: string;
};

type SavedAnalysisRecord = {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  analysis: ActiveAnalysis;
  analysisLabel: string;
  title: string;
  source: {
    mode: "study" | "csv";
    studyTitle: string;
    studyId: string;
    datasetLabel: string;
    datasetKey: string;
    csvName: string;
    includeTestData: boolean;
    identityModeLabel: string;
    preparedView: boolean;
    preparationFamily: string;
  };
  fingerprint: string;
  sample: {
    sourceRows: number;
    workingRows: number;
    afterFiltersRows: number;
    explicitlyExcludedRows: number;
    completeAcrossSetupRows: number;
    incompleteAcrossSetupRows: number;
  };
  variables: Array<{ name: string; label: string; level: string }>;
  preparation: {
    filters: AnalysisFilterRule[];
    transforms: AnalysisNumericTransform[];
    computed: AnalysisComputedVariable[];
    recodes: AnalysisRecodeDefinition[];
    repeated: AnalysisRepeatedOperation[];
  };
  setup: Record<string, unknown>;
  primaryTable: FormattedTableSpec;
  supplementaryTables: FormattedTableSpec[];
};

const ANALYSIS_RECORDS_STORAGE_KEY = "psylattice.analysisLab.records.v1";
const ANALYSIS_RECORD_LIMIT = 30;

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

async function writeFormattedTablesToClipboard(tables: FormattedTableSpec[]) {
  if (tables.length === 0) return;
  const plain = tables.map(tablePlainText).join("\n\n");
  const html = `<div data-psylattice-analysis-record="true">${tables.map(tableHtml).join("<div style=\"height:8pt;\"></div>")}</div>`;

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

function downloadJsonFile(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}


function copySvgComputedStyles(source: Element, target: Element) {
  const style = window.getComputedStyle(source);
  const properties = [
    "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin",
    "opacity", "font-family", "font-size", "font-weight", "font-style", "text-anchor", "color",
  ];
  const targetElement = target as SVGElement;
  properties.forEach((property) => {
    const value = style.getPropertyValue(property);
    if (value) targetElement.style.setProperty(property, value);
  });
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  sourceChildren.forEach((child, index) => {
    if (targetChildren[index]) copySvgComputedStyles(child, targetChildren[index]);
  });
}

async function svgToPngDataUrl(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  copySvgComputedStyles(svg, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const viewBox = svg.viewBox?.baseVal;
  const width = Math.max(480, Math.round(viewBox?.width || svg.getBoundingClientRect().width || 760));
  const height = Math.max(240, Math.round(viewBox?.height || svg.getBoundingClientRect().height || 440));
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const background = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", "100%");
  background.setAttribute("height", "100%");
  background.setAttribute("fill", "#ffffff");
  clone.insertBefore(background, clone.firstChild);

  const serialized = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = () => reject(new Error("The figure could not be rendered."));
      node.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.scale(scale, scale);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png", 1);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function figureHtml(title: string, caption: string, dataUrl: string) {
  const cleanTitle = title.replace(/^Figure\s*[·:\-–—]\s*/i, "").trim();
  return `
<div data-psylattice-analysis-figure="true" style="font-family:'Times New Roman',Times,serif;color:#111827;max-width:100%;margin:0.35em 0 1em 0;break-inside:avoid;">
  <div style="font-size:10pt;line-height:1.25;font-weight:700;margin:0 0 2pt 0;">Figure</div>
  <div style="font-size:10pt;line-height:1.3;font-style:italic;margin:0 0 7pt 0;">${escapeHtml(cleanTitle)}</div>
  <img src="${dataUrl}" alt="${escapeHtml(cleanTitle)}" data-psylattice-analysis-figure-image="true" style="display:block;width:100%;height:auto;max-width:100%;margin:0 auto;border:0;" />
  ${caption ? `<div style="font-size:9pt;line-height:1.35;color:#374151;margin-top:6pt;"><span style="font-style:italic;">Note.</span> ${escapeHtml(caption)}</div>` : ""}
</div><p><br></p>`.trim();
}

async function writeFigureToClipboard(svg: SVGSVGElement, title: string, caption: string) {
  const dataUrl = await svgToPngDataUrl(svg);
  const html = figureHtml(title, caption, dataUrl);
  const plain = `${title}${caption ? `\nNote. ${caption}` : ""}`;

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
    // Safari and older browsers may reject rich clipboard writes. Use selection fallback.
  }

  const holder = document.createElement("div");
  holder.contentEditable = "true";
  holder.style.position = "fixed";
  holder.style.left = "-10000px";
  holder.style.top = "0";
  holder.innerHTML = html;
  document.body.appendChild(holder);
  const range = document.createRange();
  range.selectNodeContents(holder);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  document.execCommand("copy");
  selection?.removeAllRanges();
  holder.remove();
}

function CopyableFigureSurface({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: any;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <div ref={containerRef} className="group/figure relative">
      <div className="absolute right-3 top-3 z-20 opacity-0 transition group-hover/figure:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={async () => {
            const svg = containerRef.current?.querySelector<SVGSVGElement>("svg");
            if (!svg) return;
            await writeFigureToClipboard(svg, title, caption);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1700);
          }}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600 shadow-sm backdrop-blur hover:border-cyan-200 hover:text-cyan-800"
          title="Copy a publication-ready figure for Thesis Builder"
        >
          <Copy className="h-3 w-3" />{copied ? "Copied" : "Copy figure"}
        </button>
      </div>
      {children}
    </div>
  );
}


function PowerCurvePlot({ result }: { result: PowerAnalysisResult }) {
  const width = 560;
  const height = 240;
  const left = 42;
  const right = 18;
  const top = 18;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const points = result.curve;
  const minN = points.length ? Math.min(...points.map((point) => point.sampleSize)) : 0;
  const maxN = points.length ? Math.max(...points.map((point) => point.sampleSize)) : 1;
  const x = (n: number) => left + ((n - minN) / Math.max(1, maxN - minN)) * plotWidth;
  const y = (power: number) => top + (1 - Math.max(0, Math.min(1, power))) * plotHeight;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.sampleSize).toFixed(2)} ${y(point.power).toFixed(2)}`).join(" ");
  const target = result.targetPower ?? 0.8;
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="px-1 pb-2"><p className="text-[10px] font-semibold text-slate-800">Power curve</p><p className="mt-0.5 text-[8px] text-slate-400">Expected power across nearby sample sizes</p></div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Power curve">
        <rect x={left} y={top} width={plotWidth} height={plotHeight} fill="white" />
        {[0.2, 0.4, 0.6, 0.8, 1].map((tick) => <g key={tick}><line x1={left} x2={left + plotWidth} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" strokeWidth="1" /><text x={left - 8} y={y(tick) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{tick.toFixed(1)}</text></g>)}
        {result.mode === "apriori" ? <line x1={left} x2={left + plotWidth} y1={y(target)} y2={y(target)} stroke="#06b6d4" strokeWidth="1.4" strokeDasharray="5 4" /> : null}
        <path d={path} fill="none" stroke="#0f172a" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point) => <circle key={point.sampleSize} cx={x(point.sampleSize)} cy={y(point.power)} r={point.sampleSize === result.sampleSize ? 4 : 2} fill={point.sampleSize === result.sampleSize ? "#06b6d4" : "#334155"} />)}
        <line x1={left} x2={left} y1={top} y2={top + plotHeight} stroke="#cbd5e1" />
        <line x1={left} x2={left + plotWidth} y1={top + plotHeight} y2={top + plotHeight} stroke="#cbd5e1" />
        <text x={left} y={height - 8} fontSize="8" fill="#94a3b8">{minN}</text><text x={left + plotWidth} y={height - 8} textAnchor="end" fontSize="8" fill="#94a3b8">{maxN}</text>
        <text x={left + plotWidth / 2} y={height - 4} textAnchor="middle" fontSize="8" fill="#64748b">Total sample size</text>
      </svg>
    </div>
  );
}

function HistogramPlot({ result }: { result: DistributionDiagnosticsResult }) {
  const bins = result.histogram;
  const maximum = Math.max(1, ...bins.map((bin) => bin.count));
  const width = 520;
  const height = 210;
  const left = 28;
  const right = 14;
  const top = 14;
  const bottom = 30;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const barWidth = bins.length ? plotWidth / bins.length : plotWidth;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <div>
          <p className="text-[10px] font-semibold text-slate-800">Histogram</p>
          <p className="mt-0.5 text-[8px] text-slate-400">Observed distribution · N = {result.n}</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Histogram of ${result.label}`}>
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        {bins.map((bin, index) => {
          const barHeight = (bin.count / maximum) * plotHeight;
          const x = left + index * barWidth + 1;
          const y = top + plotHeight - barHeight;
          return (
            <rect
              key={`${bin.start}-${index}`}
              x={x}
              y={y}
              width={Math.max(1, barWidth - 2)}
              height={barHeight}
              rx="2"
              className="fill-cyan-600/75"
            />
          );
        })}
        {bins.length > 0 && (
          <>
            <text x={left} y={height - 8} className="fill-slate-400 text-[9px]">{formatNumber(bins[0].start, 2)}</text>
            <text x={left + plotWidth} y={height - 8} textAnchor="end" className="fill-slate-400 text-[9px]">{formatNumber(bins[bins.length - 1].end, 2)}</text>
          </>
        )}
      </svg>
    </div>
  );
}

function QQPlot({ result }: { result: DistributionDiagnosticsResult }) {
  const points = result.qq;
  const width = 520;
  const height = 210;
  const left = 34;
  const right = 14;
  const top = 14;
  const bottom = 30;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const expectedValues = points.map((point) => point.expected);
  const observedValues = points.map((point) => point.observed);
  const xMin = expectedValues.length ? Math.min(...expectedValues) : -2;
  const xMax = expectedValues.length ? Math.max(...expectedValues) : 2;
  const yMin = observedValues.length ? Math.min(...observedValues) : 0;
  const yMax = observedValues.length ? Math.max(...observedValues) : 1;
  const xRange = Math.max(1e-9, xMax - xMin);
  const yRange = Math.max(1e-9, yMax - yMin);
  const mapX = (value: number) => left + ((value - xMin) / xRange) * plotWidth;
  const mapY = (value: number) => top + plotHeight - ((value - yMin) / yRange) * plotHeight;
  const lineY1 = result.mean !== null && result.sd !== null ? result.mean + result.sd * xMin : yMin;
  const lineY2 = result.mean !== null && result.sd !== null ? result.mean + result.sd * xMax : yMax;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="flex items-center justify-between gap-3 px-1 pb-2">
        <div>
          <p className="text-[10px] font-semibold text-slate-800">Normal Q–Q plot</p>
          <p className="mt-0.5 text-[8px] text-slate-400">Observed quantiles against theoretical normal quantiles</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Normal Q-Q plot of ${result.label}`}>
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        {result.mean !== null && result.sd !== null && result.sd > 0 && (
          <line x1={mapX(xMin)} y1={mapY(lineY1)} x2={mapX(xMax)} y2={mapY(lineY2)} className="stroke-violet-400" strokeWidth="1.5" strokeDasharray="5 4" />
        )}
        {points.map((point, index) => (
          <circle key={index} cx={mapX(point.expected)} cy={mapY(point.observed)} r="2.4" className="fill-cyan-700/80" />
        ))}
        <text x={left + plotWidth / 2} y={height - 7} textAnchor="middle" className="fill-slate-400 text-[9px]">Theoretical quantiles</text>
      </svg>
    </div>
  );
}


function RegressionResidualPlot({ result }: { result: ReturnType<typeof computeLinearRegression> }) {
  const points = result.diagnostics.points.filter(
    (point) => Number.isFinite(point.fitted) && Number.isFinite(point.residual)
  );
  const width = 520;
  const height = 220;
  const left = 38;
  const right = 14;
  const top = 16;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xs = points.map((point) => point.fitted);
  const ys = points.map((point) => point.residual);
  const xMin = xs.length ? Math.min(...xs) : 0;
  const xMax = xs.length ? Math.max(...xs) : 1;
  const yAbs = ys.length ? Math.max(...ys.map((value) => Math.abs(value))) : 1;
  const xRange = Math.max(1e-9, xMax - xMin);
  const yRange = Math.max(1e-9, yAbs * 2);
  const mapX = (value: number) => left + ((value - xMin) / xRange) * plotWidth;
  const mapY = (value: number) => top + plotHeight - ((value + yAbs) / yRange) * plotHeight;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="px-1 pb-2">
        <p className="text-[10px] font-semibold text-slate-800">Residuals vs fitted</p>
        <p className="mt-0.5 text-[8px] text-slate-400">Look for random scatter around zero rather than curvature or a funnel shape.</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Regression residuals versus fitted values">
        <line x1={left} y1={mapY(0)} x2={left + plotWidth} y2={mapY(0)} className="stroke-slate-300" strokeWidth="1" strokeDasharray="5 4" />
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        {points.map((point) => (
          <circle
            key={point.index}
            cx={mapX(point.fitted)}
            cy={mapY(point.residual)}
            r="2.5"
            className={Math.abs(point.standardizedResidual ?? 0) > 3 ? "fill-violet-600/80" : "fill-cyan-700/70"}
          />
        ))}
        <text x={left + plotWidth / 2} y={height - 7} textAnchor="middle" className="fill-slate-400 text-[9px]">Fitted value</text>
      </svg>
    </div>
  );
}

function RegressionQQPlot({ result }: { result: ReturnType<typeof computeLinearRegression> }) {
  const points = result.diagnostics.qq;
  const width = 520;
  const height = 220;
  const left = 38;
  const right = 14;
  const top = 16;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const expected = points.map((point) => point.expected);
  const observed = points.map((point) => point.observed);
  const xMin = expected.length ? Math.min(...expected) : -2;
  const xMax = expected.length ? Math.max(...expected) : 2;
  const yMin = observed.length ? Math.min(...observed) : -1;
  const yMax = observed.length ? Math.max(...observed) : 1;
  const xRange = Math.max(1e-9, xMax - xMin);
  const yRange = Math.max(1e-9, yMax - yMin);
  const mapX = (value: number) => left + ((value - xMin) / xRange) * plotWidth;
  const mapY = (value: number) => top + plotHeight - ((value - yMin) / yRange) * plotHeight;
  const mean = result.diagnostics.residualMean ?? 0;
  const sd = result.diagnostics.residualSd ?? 1;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="px-1 pb-2">
        <p className="text-[10px] font-semibold text-slate-800">Residual Q–Q plot</p>
        <p className="mt-0.5 text-[8px] text-slate-400">Residual quantiles against a theoretical normal distribution.</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Regression residual normal Q-Q plot">
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        {sd > 0 && (
          <line x1={mapX(xMin)} y1={mapY(mean + sd * xMin)} x2={mapX(xMax)} y2={mapY(mean + sd * xMax)} className="stroke-violet-400" strokeWidth="1.5" strokeDasharray="5 4" />
        )}
        {points.map((point, index) => (
          <circle key={index} cx={mapX(point.expected)} cy={mapY(point.observed)} r="2.4" className="fill-cyan-700/80" />
        ))}
        <text x={left + plotWidth / 2} y={height - 7} textAnchor="middle" className="fill-slate-400 text-[9px]">Theoretical quantiles</text>
      </svg>
    </div>
  );
}

function RegressionInfluencePlot({ result }: { result: ReturnType<typeof computeLinearRegression> }) {
  const points = result.diagnostics.points.filter(
    (point) => point.standardizedResidual !== null && Number.isFinite(point.standardizedResidual) && Number.isFinite(point.leverage)
  );
  const width = 520;
  const height = 220;
  const left = 38;
  const right = 14;
  const top = 16;
  const bottom = 32;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const xMax = Math.max(0.01, ...points.map((point) => point.leverage)) * 1.08;
  const yAbs = Math.max(3.2, ...points.map((point) => Math.abs(point.standardizedResidual ?? 0))) * 1.05;
  const mapX = (value: number) => left + (value / xMax) * plotWidth;
  const mapY = (value: number) => top + plotHeight - ((value + yAbs) / (2 * yAbs)) * plotHeight;
  const leverageThreshold = result.n > 0 ? (2 * (result.predictorCount + 1)) / result.n : 0;
  const cookThreshold = result.n > 0 ? 4 / result.n : Number.POSITIVE_INFINITY;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="px-1 pb-2">
        <p className="text-[10px] font-semibold text-slate-800">Influence map</p>
        <p className="mt-0.5 text-[8px] text-slate-400">Leverage × standardized residual; larger points have greater Cook's distance.</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Regression leverage and influence plot">
        <line x1={left} y1={mapY(0)} x2={left + plotWidth} y2={mapY(0)} className="stroke-slate-300" strokeWidth="1" strokeDasharray="5 4" />
        {leverageThreshold > 0 && leverageThreshold < xMax && <line x1={mapX(leverageThreshold)} y1={top} x2={mapX(leverageThreshold)} y2={top + plotHeight} className="stroke-violet-300" strokeWidth="1" strokeDasharray="4 4" />}
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        {points.map((point) => {
          const influential = (point.cookDistance ?? 0) > cookThreshold;
          const radius = 2.2 + Math.min(5.5, Math.sqrt(Math.max(0, (point.cookDistance ?? 0) / Math.max(cookThreshold, 1e-9))));
          return <circle key={point.index} cx={mapX(point.leverage)} cy={mapY(point.standardizedResidual ?? 0)} r={radius} className={influential ? "fill-violet-600/70" : "fill-cyan-700/55"} />;
        })}
        <text x={left + plotWidth / 2} y={height - 7} textAnchor="middle" className="fill-slate-400 text-[9px]">Leverage</text>
      </svg>
    </div>
  );
}


function FactorScreePlot({ result }: { result: ReturnType<typeof computeExploratoryFactorAnalysis> }) {
  const values = result.eigenvalues.slice(0, Math.min(12, result.eigenvalues.length));
  const width = 520;
  const height = 230;
  const left = 40;
  const right = 16;
  const top = 16;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const yMax = Math.max(1.2, ...values.map((value) => Math.max(0, value))) * 1.08;
  const x = (index: number) =>
    values.length <= 1 ? left + plotWidth / 2 : left + (index / (values.length - 1)) * plotWidth;
  const y = (value: number) => top + plotHeight - (Math.max(0, value) / yMax) * plotHeight;
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3 px-1 pb-2">
        <div>
          <p className="text-[10px] font-semibold text-slate-800">Scree plot</p>
          <p className="mt-0.5 text-[8px] text-slate-400">Correlation-matrix eigenvalues · Kaiser line shown at 1.</p>
        </div>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">
          Kaiser cue: {result.recommendedFactorCount}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Factor analysis scree plot">
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} className="stroke-slate-300" strokeWidth="1" />
        {1 < yMax && (
          <line x1={left} y1={y(1)} x2={left + plotWidth} y2={y(1)} className="stroke-violet-300" strokeWidth="1" strokeDasharray="5 4" />
        )}
        {values.length > 1 && <polyline points={points} fill="none" className="stroke-cyan-700" strokeWidth="2" />}
        {values.map((value, index) => (
          <g key={index}>
            <circle cx={x(index)} cy={y(value)} r="3.4" className={index < result.factorCount ? "fill-cyan-700" : "fill-slate-400"} />
            <text x={x(index)} y={height - 11} textAnchor="middle" className="fill-slate-400 text-[8px]">{index + 1}</text>
          </g>
        ))}
        <text x={left + plotWidth / 2} y={height - 1} textAnchor="middle" className="fill-slate-400 text-[8px]">Component / factor number</text>
      </svg>
    </div>
  );
}


const visualizationPalette = [
  "#0e7490",
  "#7c3aed",
  "#0f766e",
  "#c2410c",
  "#4338ca",
  "#be123c",
  "#4d7c0f",
  "#0369a1",
];

function visualizationShortLabel(value: string, maximum = 18) {
  const text = String(value || "");
  return text.length <= maximum ? text : `${text.slice(0, Math.max(4, maximum - 1))}…`;
}

function visualizationExtent(values: Array<number | null>, fallback: [number, number] = [0, 1]) {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finite.length === 0) return fallback;
  let minimum = Math.min(...finite);
  let maximum = Math.max(...finite);
  if (minimum === maximum) {
    const padding = Math.max(1, Math.abs(minimum) * 0.1);
    minimum -= padding;
    maximum += padding;
  } else {
    const padding = (maximum - minimum) * 0.08;
    minimum -= padding;
    maximum += padding;
  }
  return [minimum, maximum] as [number, number];
}

function VisualizationScatterPlot({ result, showTrend }: { result: VisualizationScatterResult; showTrend: boolean }) {
  const width = 760;
  const height = 430;
  const left = 58;
  const right = 24;
  const top = result.groups.length > 1 ? 54 : 30;
  const bottom = 52;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const [xMin, xMax] = visualizationExtent(result.points.map((point) => point.x));
  const [yMin, yMax] = visualizationExtent(result.points.map((point) => point.y));
  const mapX = (value: number) => left + ((value - xMin) / Math.max(1e-12, xMax - xMin)) * plotWidth;
  const mapY = (value: number) => top + plotHeight - ((value - yMin) / Math.max(1e-12, yMax - yMin)) * plotHeight;
  const groupColour = new Map(result.groups.map((group, index) => [group, visualizationPalette[index % visualizationPalette.length]]));
  const pointStep = Math.max(1, Math.ceil(result.points.length / 1400));
  const displayPoints = result.points.filter((_, index) => index % pointStep === 0);
  const xTicks = Array.from({ length: 5 }, (_, index) => xMin + ((xMax - xMin) * index) / 4);
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);
  const trends = result.groupVariable ? result.groupTrends : [result.overallTrend];

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div>
          <p className="text-[12px] font-semibold text-slate-900">Scatterplot</p>
          <p className="mt-1 text-[9px] leading-4 text-slate-400">{result.yLabel} by {result.xLabel}{result.groupLabel ? ` · grouped by ${result.groupLabel}` : ""}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-slate-600">N = {result.n}</span>
          {result.overallTrend.r !== null ? <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">r = {formatNumber(result.overallTrend.r, 3)}</span> : null}
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <svg data-analysis-visualization="true" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${result.yLabel} by ${result.xLabel} scatterplot`}>
          {yTicks.map((tick) => <g key={`y-${tick}`}><line x1={left} y1={mapY(tick)} x2={left + plotWidth} y2={mapY(tick)} stroke="#e2e8f0" strokeWidth="1" /><text x={left - 9} y={mapY(tick) + 3} textAnchor="end" fill="#94a3b8" fontSize="9">{formatNumber(tick, 2)}</text></g>)}
          {xTicks.map((tick) => <g key={`x-${tick}`}><line x1={mapX(tick)} y1={top} x2={mapX(tick)} y2={top + plotHeight} stroke="#f1f5f9" strokeWidth="1" /><text x={mapX(tick)} y={top + plotHeight + 18} textAnchor="middle" fill="#94a3b8" fontSize="9">{formatNumber(tick, 2)}</text></g>)}
          <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
          <line x1={left} y1={top} x2={left} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
          {showTrend ? trends.map((trend) => {
            if (trend.slope === null || trend.intercept === null) return null;
            const colour = result.groupVariable ? groupColour.get(trend.group) || visualizationPalette[0] : "#475569";
            const yStart = trend.intercept + trend.slope * xMin;
            const yEnd = trend.intercept + trend.slope * xMax;
            return <line key={`trend-${trend.group}`} x1={mapX(xMin)} y1={mapY(yStart)} x2={mapX(xMax)} y2={mapY(yEnd)} stroke={colour} strokeWidth="2" strokeDasharray={result.groupVariable ? undefined : "6 4"} opacity="0.78" />;
          }) : null}
          {displayPoints.map((point, index) => <circle key={`${point.index}-${index}`} cx={mapX(point.x)} cy={mapY(point.y)} r="3" fill={groupColour.get(point.group) || visualizationPalette[0]} fillOpacity="0.66" stroke="#ffffff" strokeWidth="0.7" />)}
          <text x={left + plotWidth / 2} y={height - 8} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600">{result.xLabel}</text>
          <text transform={`translate(14 ${top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600">{result.yLabel}</text>
          {result.groups.length > 1 ? result.groups.slice(0, 8).map((group, index) => {
            const itemWidth = Math.max(72, Math.min(130, width / Math.max(1, Math.min(4, result.groups.length))));
            const row = Math.floor(index / 4);
            const column = index % 4;
            const x = left + column * itemWidth;
            const y = 18 + row * 16;
            return <g key={`legend-${group}`}><circle cx={x} cy={y} r="4" fill={groupColour.get(group) || visualizationPalette[0]} /><text x={x + 8} y={y + 3} fill="#64748b" fontSize="8.5">{visualizationShortLabel(group, 16)}</text></g>;
          }) : null}
        </svg>
        {pointStep > 1 ? <p className="mt-1 text-[8px] text-slate-400">Plot display is deterministically thinned to approximately 1,400 points for rendering; calculations use all {result.n.toLocaleString()} complete observations.</p> : null}
      </div>
    </div>
  );
}

function VisualizationBoxPlot({ result }: { result: VisualizationDistributionResult }) {
  const width = 760;
  const height = 420;
  const left = 58;
  const right = 22;
  const top = 28;
  const bottom = 62;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const allValues = result.groups.flatMap((group) => [group.minimum, group.maximum, ...group.outliers]);
  const [yMin, yMax] = visualizationExtent(allValues);
  const mapY = (value: number) => top + plotHeight - ((value - yMin) / Math.max(1e-12, yMax - yMin)) * plotHeight;
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);
  const slotWidth = plotWidth / Math.max(1, result.groups.length);
  const boxWidth = Math.min(46, Math.max(18, slotWidth * 0.42));

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Box plot</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Median, interquartile range, Tukey whiskers and outliers for {result.outcomeLabel}{result.groupLabel ? ` by ${result.groupLabel}` : ""}.</p></div>
      <div className="p-3 sm:p-4"><svg data-analysis-visualization="true" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${result.outcomeLabel} box plot`}>
        {yTicks.map((tick) => <g key={tick}><line x1={left} y1={mapY(tick)} x2={left + plotWidth} y2={mapY(tick)} stroke="#e2e8f0" strokeWidth="1" /><text x={left - 9} y={mapY(tick) + 3} textAnchor="end" fill="#94a3b8" fontSize="9">{formatNumber(tick, 2)}</text></g>)}
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
        {result.groups.map((group, index) => {
          if (group.q1 === null || group.q3 === null || group.median === null || group.whiskerLow === null || group.whiskerHigh === null) return null;
          const cx = left + slotWidth * (index + 0.5);
          const colour = visualizationPalette[index % visualizationPalette.length];
          return <g key={group.group}>
            <line x1={cx} y1={mapY(group.whiskerHigh)} x2={cx} y2={mapY(group.q3)} stroke={colour} strokeWidth="1.5" />
            <line x1={cx} y1={mapY(group.q1)} x2={cx} y2={mapY(group.whiskerLow)} stroke={colour} strokeWidth="1.5" />
            <line x1={cx - boxWidth * 0.28} y1={mapY(group.whiskerHigh)} x2={cx + boxWidth * 0.28} y2={mapY(group.whiskerHigh)} stroke={colour} strokeWidth="1.5" />
            <line x1={cx - boxWidth * 0.28} y1={mapY(group.whiskerLow)} x2={cx + boxWidth * 0.28} y2={mapY(group.whiskerLow)} stroke={colour} strokeWidth="1.5" />
            <rect x={cx - boxWidth / 2} y={mapY(group.q3)} width={boxWidth} height={Math.max(1, mapY(group.q1) - mapY(group.q3))} fill={colour} fillOpacity="0.13" stroke={colour} strokeWidth="1.5" rx="3" />
            <line x1={cx - boxWidth / 2} y1={mapY(group.median)} x2={cx + boxWidth / 2} y2={mapY(group.median)} stroke={colour} strokeWidth="2.2" />
            {group.mean !== null ? <path d={`M ${cx} ${mapY(group.mean) - 4} L ${cx + 4} ${mapY(group.mean)} L ${cx} ${mapY(group.mean) + 4} L ${cx - 4} ${mapY(group.mean)} Z`} fill="#ffffff" stroke={colour} strokeWidth="1.3" /> : null}
            {group.outliers.slice(0, 80).map((value, outlierIndex) => <circle key={`${group.group}-${outlierIndex}`} cx={cx + ((outlierIndex % 5) - 2) * 1.7} cy={mapY(value)} r="2.2" fill={colour} fillOpacity="0.58" />)}
            <text x={cx} y={top + plotHeight + 18} textAnchor="middle" fill="#64748b" fontSize="8.5">{visualizationShortLabel(group.group, Math.max(9, Math.floor(20 - result.groups.length / 2)))}</text>
            <text x={cx} y={top + plotHeight + 31} textAnchor="middle" fill="#94a3b8" fontSize="7.5">n={group.n}</text>
          </g>;
        })}
        <text transform={`translate(14 ${top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600">{result.outcomeLabel}</text>
      </svg></div>
    </div>
  );
}

function VisualizationViolinPlot({ result }: { result: VisualizationDistributionResult }) {
  const width = 760;
  const height = 420;
  const left = 58;
  const right = 22;
  const top = 28;
  const bottom = 62;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const allValues = result.groups.flatMap((group) => [group.minimum, group.maximum]);
  const [yMin, yMax] = visualizationExtent(allValues);
  const mapY = (value: number) => top + plotHeight - ((value - yMin) / Math.max(1e-12, yMax - yMin)) * plotHeight;
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);
  const slotWidth = plotWidth / Math.max(1, result.groups.length);
  const maxHalfWidth = Math.min(52, Math.max(18, slotWidth * 0.38));
  const globalMaxDensity = Math.max(1e-12, ...result.groups.flatMap((group) => group.density.map((point) => point.density)));

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Violin distribution</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Kernel-density shape with median and interquartile range. Width represents relative density on a common scale.</p></div>
      <div className="p-3 sm:p-4"><svg data-analysis-visualization="true" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${result.outcomeLabel} violin plot`}>
        {yTicks.map((tick) => <g key={tick}><line x1={left} y1={mapY(tick)} x2={left + plotWidth} y2={mapY(tick)} stroke="#e2e8f0" strokeWidth="1" /><text x={left - 9} y={mapY(tick) + 3} textAnchor="end" fill="#94a3b8" fontSize="9">{formatNumber(tick, 2)}</text></g>)}
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
        {result.groups.map((group, index) => {
          const cx = left + slotWidth * (index + 0.5);
          const colour = visualizationPalette[index % visualizationPalette.length];
          const leftPoints = group.density.map((point) => `${cx - (point.density / globalMaxDensity) * maxHalfWidth},${mapY(point.value)}`);
          const rightPoints = [...group.density].reverse().map((point) => `${cx + (point.density / globalMaxDensity) * maxHalfWidth},${mapY(point.value)}`);
          const polygon = [...leftPoints, ...rightPoints].join(" ");
          return <g key={group.group}>
            {polygon ? <polygon points={polygon} fill={colour} fillOpacity="0.14" stroke={colour} strokeWidth="1.4" /> : null}
            {group.q1 !== null && group.q3 !== null ? <line x1={cx} y1={mapY(group.q1)} x2={cx} y2={mapY(group.q3)} stroke={colour} strokeWidth="5" strokeLinecap="round" opacity="0.65" /> : null}
            {group.median !== null ? <circle cx={cx} cy={mapY(group.median)} r="3.6" fill="#ffffff" stroke={colour} strokeWidth="2" /> : null}
            <text x={cx} y={top + plotHeight + 18} textAnchor="middle" fill="#64748b" fontSize="8.5">{visualizationShortLabel(group.group, Math.max(9, Math.floor(20 - result.groups.length / 2)))}</text>
            <text x={cx} y={top + plotHeight + 31} textAnchor="middle" fill="#94a3b8" fontSize="7.5">n={group.n}</text>
          </g>;
        })}
        <text transform={`translate(14 ${top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600">{result.outcomeLabel}</text>
      </svg></div>
    </div>
  );
}

function VisualizationMeansPlot({ result, showCI }: { result: VisualizationMeansResult; showCI: boolean }) {
  const width = 760;
  const height = 410;
  const left = 58;
  const right = 22;
  const top = 30;
  const bottom = 66;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const allY = result.points.flatMap((point) => showCI ? [point.ci95Low, point.ci95High, point.mean] : [point.mean]);
  const [yMin, yMax] = visualizationExtent(allY);
  const mapY = (value: number) => top + plotHeight - ((value - yMin) / Math.max(1e-12, yMax - yMin)) * plotHeight;
  const slotWidth = plotWidth / Math.max(1, result.points.length);
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Grouped means</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Mean {result.outcomeLabel} by {result.groupLabel}{showCI ? " with 95% t confidence intervals" : ""}.</p></div>
      <div className="p-3 sm:p-4"><svg data-analysis-visualization="true" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${result.outcomeLabel} grouped means plot`}>
        {yTicks.map((tick) => <g key={tick}><line x1={left} y1={mapY(tick)} x2={left + plotWidth} y2={mapY(tick)} stroke="#e2e8f0" strokeWidth="1" /><text x={left - 9} y={mapY(tick) + 3} textAnchor="end" fill="#94a3b8" fontSize="9">{formatNumber(tick, 2)}</text></g>)}
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
        {result.points.map((point, index) => {
          if (point.mean === null) return null;
          const cx = left + slotWidth * (index + 0.5);
          const colour = visualizationPalette[index % visualizationPalette.length];
          return <g key={point.group}>
            {showCI && point.ci95Low !== null && point.ci95High !== null ? <><line x1={cx} y1={mapY(point.ci95Low)} x2={cx} y2={mapY(point.ci95High)} stroke={colour} strokeWidth="2" /><line x1={cx - 6} y1={mapY(point.ci95Low)} x2={cx + 6} y2={mapY(point.ci95Low)} stroke={colour} strokeWidth="2" /><line x1={cx - 6} y1={mapY(point.ci95High)} x2={cx + 6} y2={mapY(point.ci95High)} stroke={colour} strokeWidth="2" /></> : null}
            <circle cx={cx} cy={mapY(point.mean)} r="5" fill={colour} stroke="#ffffff" strokeWidth="1.5" />
            <text x={cx} y={mapY(point.mean) - 10} textAnchor="middle" fill="#475569" fontSize="8.5" fontWeight="600">{formatNumber(point.mean, 2)}</text>
            <text x={cx} y={top + plotHeight + 19} textAnchor="middle" fill="#64748b" fontSize="8.5">{visualizationShortLabel(point.group, Math.max(9, Math.floor(20 - result.points.length / 2)))}</text>
            <text x={cx} y={top + plotHeight + 32} textAnchor="middle" fill="#94a3b8" fontSize="7.5">n={point.n}</text>
          </g>;
        })}
        <text transform={`translate(14 ${top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600">{result.outcomeLabel}</text>
      </svg></div>
    </div>
  );
}

function VisualizationInteractionPlot({ result, showCI }: { result: VisualizationInteractionResult; showCI: boolean }) {
  const width = 760;
  const height = 440;
  const left = 58;
  const right = 22;
  const top = 58;
  const bottom = 66;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const allY = result.cells.flatMap((cell) => showCI ? [cell.ci95Low, cell.ci95High, cell.mean] : [cell.mean]);
  const [yMin, yMax] = visualizationExtent(allY);
  const mapY = (value: number) => top + plotHeight - ((value - yMin) / Math.max(1e-12, yMax - yMin)) * plotHeight;
  const xAt = (index: number) => result.xLevels.length <= 1 ? left + plotWidth / 2 : left + (index / (result.xLevels.length - 1)) * plotWidth;
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4);

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Interaction plot</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Mean {result.outcomeLabel} across {result.xFactorLabel}, traced by {result.traceFactorLabel}.</p></div>
      <div className="p-3 sm:p-4"><svg data-analysis-visualization="true" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${result.outcomeLabel} interaction plot`}>
        {yTicks.map((tick) => <g key={tick}><line x1={left} y1={mapY(tick)} x2={left + plotWidth} y2={mapY(tick)} stroke="#e2e8f0" strokeWidth="1" /><text x={left - 9} y={mapY(tick) + 3} textAnchor="end" fill="#94a3b8" fontSize="9">{formatNumber(tick, 2)}</text></g>)}
        <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
        <line x1={left} y1={top} x2={left} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
        {result.traceLevels.map((trace, traceIndex) => {
          const colour = visualizationPalette[traceIndex % visualizationPalette.length];
          const points = result.xLevels.map((xLevel, xIndex) => ({ xIndex, cell: result.cells.find((cell) => cell.xLevel === xLevel && cell.traceLevel === trace) })).filter((item) => item.cell?.mean !== null && item.cell?.mean !== undefined);
          const polyline = points.map((item) => `${xAt(item.xIndex)},${mapY(item.cell!.mean as number)}`).join(" ");
          return <g key={trace}>
            {polyline ? <polyline points={polyline} fill="none" stroke={colour} strokeWidth="2.2" /> : null}
            {points.map((item) => {
              const cell = item.cell!;
              const cx = xAt(item.xIndex);
              const cy = mapY(cell.mean as number);
              return <g key={`${trace}-${item.xIndex}`}>
                {showCI && cell.ci95Low !== null && cell.ci95High !== null ? <><line x1={cx} y1={mapY(cell.ci95Low)} x2={cx} y2={mapY(cell.ci95High)} stroke={colour} strokeWidth="1.4" opacity="0.8" /><line x1={cx - 4} y1={mapY(cell.ci95Low)} x2={cx + 4} y2={mapY(cell.ci95Low)} stroke={colour} strokeWidth="1.4" /><line x1={cx - 4} y1={mapY(cell.ci95High)} x2={cx + 4} y2={mapY(cell.ci95High)} stroke={colour} strokeWidth="1.4" /></> : null}
                <circle cx={cx} cy={cy} r="4.5" fill={colour} stroke="#ffffff" strokeWidth="1.3" />
              </g>;
            })}
          </g>;
        })}
        {result.xLevels.map((level, index) => <text key={level} x={xAt(index)} y={top + plotHeight + 20} textAnchor="middle" fill="#64748b" fontSize="8.5">{visualizationShortLabel(level, 18)}</text>)}
        {result.traceLevels.slice(0, 8).map((trace, index) => {
          const itemWidth = Math.max(82, Math.min(145, width / Math.max(1, Math.min(4, result.traceLevels.length))));
          const row = Math.floor(index / 4);
          const column = index % 4;
          const x = left + column * itemWidth;
          const y = 18 + row * 16;
          return <g key={`legend-${trace}`}><line x1={x} y1={y} x2={x + 14} y2={y} stroke={visualizationPalette[index % visualizationPalette.length]} strokeWidth="2.2" /><circle cx={x + 7} cy={y} r="3.3" fill={visualizationPalette[index % visualizationPalette.length]} /><text x={x + 20} y={y + 3} fill="#64748b" fontSize="8.5">{visualizationShortLabel(trace, 16)}</text></g>;
        })}
        <text x={left + plotWidth / 2} y={height - 8} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600">{result.xFactorLabel}</text>
        <text transform={`translate(14 ${top + plotHeight / 2}) rotate(-90)`} textAnchor="middle" fill="#475569" fontSize="10" fontWeight="600">{result.outcomeLabel}</text>
      </svg></div>
    </div>
  );
}

function EstimatedMarginalMeansPlots({ result }: { result: ReturnType<typeof computeGeneralLinearModelAnova> }) {
  if (!result || result.issue || result.marginalMeans.length === 0) return null;
  const factorGroups = result.factors.map((factor) => ({
    factor,
    points: result.marginalMeans.filter((mean) => mean.factor === factor.name && mean.adjustedMean !== null),
  })).filter((group) => group.points.length > 0);
  if (factorGroups.length === 0) return null;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {factorGroups.map(({ factor, points }) => {
        const width = 520;
        const height = 280;
        const left = 50;
        const right = 16;
        const top = 22;
        const bottom = 56;
        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;
        const [yMin, yMax] = visualizationExtent(points.flatMap((point) => [point.ci95Low, point.ci95High, point.adjustedMean]));
        const mapY = (value: number) => top + plotHeight - ((value - yMin) / Math.max(1e-12, yMax - yMin)) * plotHeight;
        const slot = plotWidth / Math.max(1, points.length);
        const yTicks = Array.from({ length: 4 }, (_, index) => yMin + ((yMax - yMin) * index) / 3);
        return <CopyableFigureSurface key={factor.name} title={`Figure · Estimated marginal means — ${factor.label}`} caption={`Adjusted marginal means for ${factor.label} with 95% confidence intervals.`}><div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
          <div className="px-1 pb-2"><p className="text-[10px] font-semibold text-slate-800">Estimated marginal means · {factor.label}</p><p className="mt-0.5 text-[8px] leading-4 text-slate-400">Adjusted means with 95% confidence intervals.</p></div>
          <svg data-analysis-visualization="true" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${factor.label} estimated marginal means`}>
            {yTicks.map((tick) => <g key={tick}><line x1={left} y1={mapY(tick)} x2={left + plotWidth} y2={mapY(tick)} stroke="#e2e8f0" strokeWidth="1" /><text x={left - 8} y={mapY(tick) + 3} textAnchor="end" fill="#94a3b8" fontSize="8">{formatNumber(tick, 2)}</text></g>)}
            <line x1={left} y1={top + plotHeight} x2={left + plotWidth} y2={top + plotHeight} stroke="#94a3b8" strokeWidth="1" />
            {points.map((point, index) => {
              const cx = left + slot * (index + 0.5);
              const colour = visualizationPalette[index % visualizationPalette.length];
              return <g key={point.level}>
                {point.ci95Low !== null && point.ci95High !== null ? <><line x1={cx} y1={mapY(point.ci95Low)} x2={cx} y2={mapY(point.ci95High)} stroke={colour} strokeWidth="1.7" /><line x1={cx - 5} y1={mapY(point.ci95Low)} x2={cx + 5} y2={mapY(point.ci95Low)} stroke={colour} strokeWidth="1.7" /><line x1={cx - 5} y1={mapY(point.ci95High)} x2={cx + 5} y2={mapY(point.ci95High)} stroke={colour} strokeWidth="1.7" /></> : null}
                <circle cx={cx} cy={mapY(point.adjustedMean as number)} r="4.5" fill={colour} stroke="#fff" strokeWidth="1.3" />
                <text x={cx} y={top + plotHeight + 17} textAnchor="middle" fill="#64748b" fontSize="8">{visualizationShortLabel(point.level, 16)}</text>
              </g>;
            })}
          </svg>
        </div></CopyableFigureSurface>;
      })}
    </div>
  );
}


function MissingnessBarPlot({ profile }: { profile: ReturnType<typeof computeAnalysisMissingnessProfile> }) {
  const items = profile.variables.filter((item) => item.missing > 0).slice(0, 12);
  const width = 720;
  const rowHeight = 30;
  const left = 210;
  const right = 46;
  const top = 24;
  const bottom = 28;
  const height = Math.max(180, top + bottom + Math.max(1, items.length) * rowHeight);
  const plotWidth = width - left - right;
  const maximum = Math.max(1, ...items.map((item) => item.missingPercent));

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="border-b border-slate-100 px-4 py-3.5 pr-28">
        <p className="text-[10px] font-semibold text-slate-800">Missingness by variable</p>
        <p className="mt-0.5 text-[8px] leading-4 text-slate-400">Highest missing percentages in the current filtered analysis view.</p>
      </div>
      {items.length > 0 ? (
        <div className="p-3 sm:p-4">
          <svg data-analysis-visualization="true" viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Missingness percentage by variable">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
              const x = left + plotWidth * fraction;
              return <g key={fraction}><line x1={x} y1={top - 4} x2={x} y2={height - bottom + 2} stroke="#e2e8f0" strokeWidth="1" /><text x={x} y={height - 7} textAnchor="middle" fill="#94a3b8" fontSize="8">{formatNumber(maximum * fraction, 1)}%</text></g>;
            })}
            {items.map((item, index) => {
              const y = top + index * rowHeight + 5;
              const barWidth = (item.missingPercent / maximum) * plotWidth;
              return <g key={item.variable}>
                <text x={left - 10} y={y + 11} textAnchor="end" fill="#475569" fontSize="8.5" fontWeight="600">{visualizationShortLabel(item.label, 30)}</text>
                <rect x={left} y={y} width={Math.max(1, barWidth)} height="15" rx="5" fill="#0891b2" opacity="0.78" />
                <text x={Math.min(left + plotWidth - 2, left + barWidth + 7)} y={y + 11} fill="#334155" fontSize="8.5" fontWeight="600">{formatNumber(item.missingPercent, 1)}%</text>
              </g>;
            })}
          </svg>
        </div>
      ) : <div className="px-4 py-10 text-center text-[9px] text-slate-400">No missing values are present in the current view.</div>}
    </div>
  );
}

function PairwiseAvailabilityHeatmap({ result }: { result: ReturnType<typeof computeAnalysisPairwiseAvailability> }) {
  const variables = result.variables;
  const size = 42;
  const left = 170;
  const top = 126;
  const right = 32;
  const bottom = 34;
  const width = Math.max(520, left + right + variables.length * size);
  const height = Math.max(330, top + bottom + variables.length * size);
  const cellMap = new Map(result.cells.map((cell) => [`${cell.rowVariable}|||${cell.columnVariable}`, cell]));

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
      <div className="border-b border-slate-100 px-4 py-3.5 pr-28">
        <p className="text-[10px] font-semibold text-slate-800">Pairwise available N</p>
        <p className="mt-0.5 text-[8px] leading-4 text-slate-400">Rows with non-missing values for each variable pair. Darker cells retain more of the current sample.</p>
      </div>
      {variables.length > 0 ? <div className="overflow-x-auto p-3 sm:p-4"><svg data-analysis-visualization="true" viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[520px] w-full" role="img" aria-label="Pairwise available sample size heatmap">
        {variables.map((variable, columnIndex) => {
          const x = left + columnIndex * size + size / 2;
          return <text key={`col-${variable.name}`} transform={`translate(${x - 4} ${top - 10}) rotate(-52)`} textAnchor="start" fill="#64748b" fontSize="8">{visualizationShortLabel(variable.label, 22)}</text>;
        })}
        {variables.map((rowVariable, rowIndex) => <g key={`row-${rowVariable.name}`}>
          <text x={left - 10} y={top + rowIndex * size + size / 2 + 3} textAnchor="end" fill="#64748b" fontSize="8">{visualizationShortLabel(rowVariable.label, 25)}</text>
          {variables.map((columnVariable, columnIndex) => {
            const cell = cellMap.get(`${rowVariable.name}|||${columnVariable.name}`);
            const percent = cell?.percent ?? 0;
            const opacity = 0.12 + (percent / 100) * 0.78;
            const x = left + columnIndex * size;
            const y = top + rowIndex * size;
            return <g key={`${rowVariable.name}-${columnVariable.name}`}>
              <rect x={x + 1} y={y + 1} width={size - 2} height={size - 2} rx="7" fill="#0891b2" opacity={opacity} />
              <text x={x + size / 2} y={y + size / 2 + 3} textAnchor="middle" fill={percent >= 65 ? "#ffffff" : "#334155"} fontSize="8.5" fontWeight="700">{cell?.n ?? 0}</text>
            </g>;
          })}
        </g>)}
      </svg></div> : <div className="px-4 py-10 text-center text-[9px] text-slate-400">Select variables in an analysis setup to inspect pairwise availability.</div>}
    </div>
  );
}

function diagnosticFlag(result: DistributionDiagnosticsResult) {
  if (result.issue) return { label: "Unavailable", tone: "border-slate-200 bg-slate-50 text-slate-500" };
  const strongShape = Math.abs(result.skewness ?? 0) > 1 || Math.abs(result.kurtosisExcess ?? 0) > 2;
  if ((result.jarqueBeraPValue ?? 1) < 0.05 && strongShape) {
    return { label: "Review distribution", tone: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  if (result.extremeOutlierCount > 0 || result.zOutlierCount > 0) {
    return { label: "Review outliers", tone: "border-violet-200 bg-violet-50 text-violet-700" };
  }
  return { label: "No strong flag", tone: "border-cyan-200 bg-cyan-50 text-cyan-800" };
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
  const [analysisCategoryTab, setAnalysisCategoryTab] = useState<AnalysisNavCategory>("explore");
  const [correlationMethod, setCorrelationMethod] = useState<CorrelationMethod>("pearson");
  const [tTestMode, setTTestMode] = useState<TTestMode>("independent");
  const [tTestEstimator, setTTestEstimator] = useState<IndependentTTestEstimator>("welch");
  const [tOutcomeVariable, setTOutcomeVariable] = useState("");
  const [tGroupVariable, setTGroupVariable] = useState("");
  const [tGroupA, setTGroupA] = useState("");
  const [tGroupB, setTGroupB] = useState("");
  const [pairedVariableA, setPairedVariableA] = useState("");
  const [pairedVariableB, setPairedVariableB] = useState("");
  const [nonParametricMode, setNonParametricMode] = useState<NonParametricMode>("mannwhitney");
  const [npOutcomeVariable, setNpOutcomeVariable] = useState("");
  const [npGroupVariable, setNpGroupVariable] = useState("");
  const [npGroupA, setNpGroupA] = useState("");
  const [npGroupB, setNpGroupB] = useState("");
  const [npPairedVariableA, setNpPairedVariableA] = useState("");
  const [npPairedVariableB, setNpPairedVariableB] = useState("");
  const [npRepeatedVariables, setNpRepeatedVariables] = useState<string[]>([]);
  const [categoricalRowVariable, setCategoricalRowVariable] = useState("");
  const [categoricalColumnVariable, setCategoricalColumnVariable] = useState("");
  const [anovaMode, setAnovaMode] = useState<AnovaMode>("between");
  const [anovaEstimator, setAnovaEstimator] = useState<OneWayAnovaEstimator>("standard");
  const [anovaOutcomeVariable, setAnovaOutcomeVariable] = useState("");
  const [anovaFactorVariable, setAnovaFactorVariable] = useState("");
  const [anovaRepeatedVariables, setAnovaRepeatedVariables] = useState<string[]>([]);
  const [anovaFactors, setAnovaFactors] = useState<string[]>([]);
  const [anovaCovariates, setAnovaCovariates] = useState<string[]>([]);
  const [anovaIncludeInteractions, setAnovaIncludeInteractions] = useState(true);
  const [regressionOutcomeVariable, setRegressionOutcomeVariable] = useState("");
  const [regressionPredictors, setRegressionPredictors] = useState<string[]>([]);
  const [processMode, setProcessMode] = useState<ProcessMode>("mediation");
  const [processOutcomeVariable, setProcessOutcomeVariable] = useState("");
  const [processPredictorVariable, setProcessPredictorVariable] = useState("");
  const [processMediatorVariable, setProcessMediatorVariable] = useState("");
  const [processModeratorVariable, setProcessModeratorVariable] = useState("");
  const [processCovariates, setProcessCovariates] = useState<string[]>([]);
  const [processBootstrapSamples, setProcessBootstrapSamples] = useState(2000);
  const [processCenterPredictors, setProcessCenterPredictors] = useState(true);
  const [mixedOutcomeVariable, setMixedOutcomeVariable] = useState("");
  const [mixedGroupVariable, setMixedGroupVariable] = useState("");
  const [mixedPredictors, setMixedPredictors] = useState<string[]>([]);
  const [mixedEstimator, setMixedEstimator] = useState<MixedModelEstimator>("reml");
  const [mixedCentering, setMixedCentering] = useState<MixedModelCentering>("none");
  const [mixedRandomSlopeVariable, setMixedRandomSlopeVariable] = useState("");
  const [mixedFamily, setMixedFamily] = useState<MixedOutcomeFamily>("gaussian");
  const [mixedPositiveClass, setMixedPositiveClass] = useState("");
  const [mixedExposureVariable, setMixedExposureVariable] = useState("");
  const [logisticMode, setLogisticMode] = useState<LogisticMode>("binary");
  const [logisticOutcomeVariable, setLogisticOutcomeVariable] = useState("");
  const [logisticPositiveClass, setLogisticPositiveClass] = useState("");
  const [logisticReferenceClass, setLogisticReferenceClass] = useState("");
  const [logisticOrdinalOrder, setLogisticOrdinalOrder] = useState<string[]>([]);
  const [logisticPredictors, setLogisticPredictors] = useState<string[]>([]);
  const [logisticThreshold, setLogisticThreshold] = useState(0.5);
  const [countOutcomeVariable, setCountOutcomeVariable] = useState("");
  const [countPredictors, setCountPredictors] = useState<string[]>([]);
  const [countFamily, setCountFamily] = useState<CountRegressionFamily>("poisson");
  const [countExposureVariable, setCountExposureVariable] = useState("");
  const [cognitiveTask, setCognitiveTask] = useState("");
  const [cognitiveReferenceCondition, setCognitiveReferenceCondition] = useState("");
  const [cognitiveRtMin, setCognitiveRtMin] = useState(150);
  const [cognitiveRtMax, setCognitiveRtMax] = useState(3000);
  const [cognitiveCorrectRtOnly, setCognitiveCorrectRtOnly] = useState(true);
  const [cognitiveMinTrials, setCognitiveMinTrials] = useState(20);
  const [cognitiveMinAccuracy, setCognitiveMinAccuracy] = useState(0.6);
  const [cognitiveMaxOmissionRate, setCognitiveMaxOmissionRate] = useState(0.1);
  const [cognitiveMaxRtExclusionRate, setCognitiveMaxRtExclusionRate] = useState(0.2);
  const [reliabilityReverseItems, setReliabilityReverseItems] = useState<string[]>([]);
  const [factorExtraction, setFactorExtraction] = useState<FactorExtractionMethod>("principal_axis");
  const [factorRotation, setFactorRotation] = useState<FactorRotationMethod>("promax");
  const [factorCount, setFactorCount] = useState(2);
  const [factorLoadingCutoff, setFactorLoadingCutoff] = useState(0.3);
  const [factorSortLoadings, setFactorSortLoadings] = useState(true);
  const [powerTest, setPowerTest] = useState<PowerAnalysisTest>("independent_t");
  const [powerMode, setPowerMode] = useState<PowerAnalysisMode>("apriori");
  const [powerEffectSize, setPowerEffectSize] = useState(0.5);
  const [powerAlpha, setPowerAlpha] = useState(0.05);
  const [powerTarget, setPowerTarget] = useState(0.8);
  const [powerSampleSize, setPowerSampleSize] = useState(100);
  const [powerTails, setPowerTails] = useState<PowerAnalysisTails>("two");
  const [powerGroups, setPowerGroups] = useState(3);
  const [powerLossRate, setPowerLossRate] = useState(0.1);
  const [diagnosticsMode, setDiagnosticsMode] = useState<DiagnosticsMode>("distribution");
  const [diagnosticsOutcomeVariable, setDiagnosticsOutcomeVariable] = useState("");
  const [diagnosticsFactorVariable, setDiagnosticsFactorVariable] = useState("");
  const [varianceTestCenter, setVarianceTestCenter] = useState<VarianceTestCenter>("median");
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>("scatter");
  const [visualizationXVariable, setVisualizationXVariable] = useState("");
  const [visualizationYVariable, setVisualizationYVariable] = useState("");
  const [visualizationOutcomeVariable, setVisualizationOutcomeVariable] = useState("");
  const [visualizationGroupVariable, setVisualizationGroupVariable] = useState("");
  const [visualizationTraceVariable, setVisualizationTraceVariable] = useState("");
  const [visualizationShowTrend, setVisualizationShowTrend] = useState(true);
  const [visualizationShowCI, setVisualizationShowCI] = useState(true);
  const [showCorrelationN, setShowCorrelationN] = useState(true);
  const [showCorrelationP, setShowCorrelationP] = useState(true);
  const [sourceMode, setSourceMode] = useState<"study" | "csv">("study");
  const [csvRows, setCsvRows] = useState<AnalysisRow[]>([]);
  const [csvName, setCsvName] = useState("");
  const [csvError, setCsvError] = useState("");
  const [prepareDataOpen, setPrepareDataOpen] = useState(false);
  const [prepareDataTab, setPrepareDataTab] = useState<PrepareDataTab>("native");
  const [usePreparedData, setUsePreparedData] = useState(false);
  const [analysisFilters, setAnalysisFilters] = useState<AnalysisFilterRule[]>([]);
  const [filterVariable, setFilterVariable] = useState("");
  const [filterOperator, setFilterOperator] = useState<AnalysisFilterOperator>("equals");
  const [filterValue, setFilterValue] = useState("");
  const [numericTransforms, setNumericTransforms] = useState<AnalysisNumericTransform[]>([]);
  const [transformSource, setTransformSource] = useState("");
  const [transformKind, setTransformKind] = useState<AnalysisNumericTransformKind>("zscore");
  const [transformOutput, setTransformOutput] = useState("");
  const [computedVariables, setComputedVariables] = useState<AnalysisComputedVariable[]>([]);
  const [computedLeft, setComputedLeft] = useState("");
  const [computedRight, setComputedRight] = useState("");
  const [computedOperation, setComputedOperation] = useState<AnalysisComputedOperation>("difference");
  const [computedOutput, setComputedOutput] = useState("");
  const [recodeDefinitions, setRecodeDefinitions] = useState<AnalysisRecodeDefinition[]>([]);
  const [recodeSource, setRecodeSource] = useState("");
  const [recodeOutput, setRecodeOutput] = useState("");
  const [recodeMappingsText, setRecodeMappingsText] = useState("");
  const [repeatedOperations, setRepeatedOperations] = useState<AnalysisRepeatedOperation[]>([]);
  const [repeatedKind, setRepeatedKind] = useState<AnalysisRepeatedOperationKind>("observation_index");
  const [repeatedClusterVariable, setRepeatedClusterVariable] = useState("");
  const [repeatedTimeVariable, setRepeatedTimeVariable] = useState("");
  const [repeatedSourceVariable, setRepeatedSourceVariable] = useState("");
  const [repeatedOutput, setRepeatedOutput] = useState("");
  const [variableSearch, setVariableSearch] = useState("");
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [options, setOptions] = useState(defaultOptions);
  const [showFrequencies, setShowFrequencies] = useState(true);
  const [copyStatus, setCopyStatus] = useState("");
  const [statisticsOpen, setStatisticsOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [analysisSidebarCollapsed, setAnalysisSidebarCollapsed] = useState(false);
  const [variablesSidebarCollapsed, setVariablesSidebarCollapsed] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [analysisRecords, setAnalysisRecords] = useState<SavedAnalysisRecord[]>([]);
  const [recordsHydrated, setRecordsHydrated] = useState(false);
  const [pendingAiWorkflowAfterView, setPendingAiWorkflowAfterView] = useState<AnalysisAiWorkflowProposal | null>(null);
  const [pendingAiSetupAfterPreparation, setPendingAiSetupAfterPreparation] = useState<AnalysisAiSetupProposal | null>(null);
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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ANALYSIS_RECORDS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setAnalysisRecords(parsed.filter((record) => record && record.schemaVersion === 1).slice(0, ANALYSIS_RECORD_LIMIT));
        }
      }
    } catch {
      // A damaged or unavailable browser store should never block analysis.
    } finally {
      setRecordsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!recordsHydrated) return;
    try {
      window.localStorage.setItem(ANALYSIS_RECORDS_STORAGE_KEY, JSON.stringify(analysisRecords.slice(0, ANALYSIS_RECORD_LIMIT)));
    } catch {
      // Records remain available for the current session if browser storage is unavailable.
    }
  }, [analysisRecords, recordsHydrated]);

  const sourceRows = sourceMode === "csv" ? csvRows : rows;
  const sourceCodebook = sourceMode === "csv" ? [] : codebook;
  const sourceDatasetKey = sourceMode === "csv" ? "external_csv" : selectedDatasetValue || datasetKey;
  const preparation = useMemo(
    () =>
      prepareAnalysisDataset(sourceRows, sourceCodebook, {
        datasetKey: sourceDatasetKey,
        cognitive: {
          minRtMs: cognitiveRtMin,
          maxRtMs: cognitiveRtMax,
          correctRtOnly: cognitiveCorrectRtOnly,
          minScorableTrials: cognitiveMinTrials,
          minAccuracy: cognitiveMinAccuracy,
          maxOmissionRate: cognitiveMaxOmissionRate,
          maxRtExclusionRate: cognitiveMaxRtExclusionRate,
        },
      }),
    [
      sourceRows,
      sourceCodebook,
      sourceDatasetKey,
      cognitiveRtMin,
      cognitiveRtMax,
      cognitiveCorrectRtOnly,
      cognitiveMinTrials,
      cognitiveMinAccuracy,
      cognitiveMaxOmissionRate,
      cognitiveMaxRtExclusionRate,
    ]
  );
  const preparedViewActive = usePreparedData && preparation.canPrepare;
  const baseAnalysisRows = preparedViewActive ? preparation.rows : sourceRows;
  const baseAnalysisCodebook = preparedViewActive ? preparation.codebook : sourceCodebook;
  const variableOperationResult = useMemo(
    () => applyAnalysisVariableOperations(baseAnalysisRows, baseAnalysisCodebook, {
      transforms: numericTransforms,
      computed: computedVariables,
      recodes: recodeDefinitions,
      repeated: repeatedOperations,
    }),
    [baseAnalysisRows, baseAnalysisCodebook, numericTransforms, computedVariables, recodeDefinitions, repeatedOperations]
  );
  const workbenchVariables = useMemo(
    () => inferAnalysisVariables(variableOperationResult.rows, variableOperationResult.codebook),
    [variableOperationResult.rows, variableOperationResult.codebook]
  );
  const filterResult = useMemo(
    () => applyAnalysisFilters(variableOperationResult.rows, analysisFilters),
    [variableOperationResult.rows, analysisFilters]
  );
  const activeRows = filterResult.rows;
  const activeCodebook = variableOperationResult.codebook;
  const sourceLabel = sourceMode === "csv"
    ? csvName || "Uploaded CSV"
    : preparedViewActive
      ? `${datasetLabel} · Prepared participant view`
      : datasetLabel;
  const activeFullscreenDatasetOption =
    datasetOptions.find((option) => option.value === selectedDatasetValue) || null;

  useEffect(() => {
    if (!preparation.canPrepare && usePreparedData) {
      setUsePreparedData(false);
    }
  }, [preparation.canPrepare, usePreparedData]);

  useEffect(() => {
    if (sourceMode !== "study") {
      setUsePreparedData(false);
      return;
    }
    setUsePreparedData(preparation.canPrepare);
  }, [sourceMode, selectedDatasetValue, datasetKey, preparation.family, preparation.canPrepare]);

  const workbenchDatasetIdentity = `${sourceMode}|${sourceDatasetKey}|${preparedViewActive ? "prepared" : "raw"}`;

  useEffect(() => {
    const nextCategory = analysisCategoryFor(activeAnalysis);
    if (nextCategory !== analysisCategoryTab) {
      setAnalysisCategoryTab(nextCategory);
    }
  }, [activeAnalysis]);


  useEffect(() => {
    setAnalysisFilters([]);
    setNumericTransforms([]);
    setComputedVariables([]);
    setRecodeDefinitions([]);
    setRepeatedOperations([]);
    setFilterValue("");
    setTransformOutput("");
    setComputedOutput("");
    setRecodeOutput("");
    setRecodeMappingsText("");
    setRepeatedOutput("");
  }, [workbenchDatasetIdentity]);

  const variables = useMemo(
    () => inferAnalysisVariables(activeRows, activeCodebook),
    [activeRows, activeCodebook]
  );
  const analysisAiRawVariablePreview = useMemo(
    () => inferAnalysisVariables(sourceRows, sourceCodebook),
    [sourceRows, sourceCodebook]
  );
  const analysisAiPreparedVariablePreview = useMemo(
    () => preparation.canPrepare ? inferAnalysisVariables(preparation.rows, preparation.codebook) : [],
    [preparation.canPrepare, preparation.rows, preparation.codebook]
  );

  const visibleAnalysisCatalogue = useMemo(
    () => analysisCatalogue.filter((analysis) => analysis.category === analysisCategoryTab),
    [analysisCategoryTab]
  );

  const numericWorkbenchVariables = useMemo(
    () => workbenchVariables.filter((variable) => variable.level === "continuous" || variable.level === "ordinal"),
    [workbenchVariables]
  );
  const recodeWorkbenchVariables = useMemo(
    () => workbenchVariables.filter((variable) => variable.level !== "id" && variable.level !== "datetime"),
    [workbenchVariables]
  );
  const repeatedClusterVariables = useMemo(
    () => workbenchVariables.filter((variable) => variable.level === "id" || variable.level === "nominal" || variable.level === "ordinal" || variable.level === "boolean"),
    [workbenchVariables]
  );
  const repeatedTimeVariables = useMemo(
    () => workbenchVariables.filter((variable) => variable.level === "datetime" || variable.level === "continuous" || variable.level === "ordinal"),
    [workbenchVariables]
  );
  const repeatedSourceVariables = numericWorkbenchVariables;
  const repeatedNeedsTime = repeatedKind === "observation_index" || repeatedKind === "elapsed_time" || repeatedKind === "lag1" || repeatedKind === "change_from_previous";
  const repeatedNeedsSource = repeatedKind === "cluster_mean" || repeatedKind === "within_cluster_center" || repeatedKind === "lag1" || repeatedKind === "change_from_previous";
  const missingnessProfile = useMemo(
    () => computeAnalysisMissingnessProfile(activeRows, activeCodebook),
    [activeRows, activeCodebook]
  );

  const currentAnalysisVariables = useMemo(() => {
    let names: string[] = [];
    if (activeAnalysis === "descriptives" || activeAnalysis === "correlations" || activeAnalysis === "reliability" || activeAnalysis === "factor") names = selectedVariables;
    else if (activeAnalysis === "visualizations") {
      names = visualizationMode === "scatter"
        ? [visualizationXVariable, visualizationYVariable, visualizationGroupVariable]
        : visualizationMode === "interaction"
          ? [visualizationOutcomeVariable, visualizationGroupVariable, visualizationTraceVariable]
          : [visualizationOutcomeVariable, visualizationGroupVariable];
    }
    else if (activeAnalysis === "diagnostics") names = diagnosticsMode === "distribution" ? selectedVariables : [diagnosticsOutcomeVariable, diagnosticsFactorVariable];
    else if (activeAnalysis === "ttests") names = tTestMode === "paired" ? [pairedVariableA, pairedVariableB] : [tOutcomeVariable, tGroupVariable];
    else if (activeAnalysis === "nonparametric") {
      if (nonParametricMode === "wilcoxon") names = [npPairedVariableA, npPairedVariableB];
      else if (nonParametricMode === "friedman") names = npRepeatedVariables;
      else names = [npOutcomeVariable, npGroupVariable];
    }
    else if (activeAnalysis === "categorical") names = [categoricalRowVariable, categoricalColumnVariable];
    else if (activeAnalysis === "anova") {
      if (anovaMode === "repeated") names = anovaRepeatedVariables;
      else if (anovaMode === "factorial") names = [anovaOutcomeVariable, ...anovaFactors];
      else if (anovaMode === "ancova") names = [anovaOutcomeVariable, ...anovaFactors, ...anovaCovariates];
      else names = [anovaOutcomeVariable, anovaFactorVariable];
    }
    else if (activeAnalysis === "regression") names = [regressionOutcomeVariable, ...regressionPredictors];
    else if (activeAnalysis === "process") names = [processOutcomeVariable, processPredictorVariable, processMode === "mediation" ? processMediatorVariable : processModeratorVariable, ...processCovariates];
    else if (activeAnalysis === "mixed") names = [mixedOutcomeVariable, mixedGroupVariable, mixedExposureVariable, ...mixedPredictors];
    else if (activeAnalysis === "logistic") names = [logisticOutcomeVariable, ...logisticPredictors];
    else if (activeAnalysis === "count") names = [countOutcomeVariable, countExposureVariable, ...countPredictors];
    return Array.from(new Set(names.filter(Boolean)));
  }, [
    activeAnalysis, selectedVariables, visualizationMode, visualizationXVariable, visualizationYVariable, visualizationOutcomeVariable, visualizationGroupVariable, visualizationTraceVariable, diagnosticsMode, diagnosticsOutcomeVariable, diagnosticsFactorVariable,
    tTestMode, pairedVariableA, pairedVariableB, tOutcomeVariable, tGroupVariable, nonParametricMode,
    npPairedVariableA, npPairedVariableB, npRepeatedVariables, npOutcomeVariable, npGroupVariable,
    categoricalRowVariable, categoricalColumnVariable, anovaMode, anovaRepeatedVariables, anovaOutcomeVariable,
    anovaFactors, anovaCovariates, anovaFactorVariable, regressionOutcomeVariable, regressionPredictors,
    processMode, processOutcomeVariable, processPredictorVariable, processMediatorVariable, processModeratorVariable, processCovariates,
    mixedOutcomeVariable, mixedGroupVariable, mixedExposureVariable, mixedPredictors, logisticOutcomeVariable, logisticPredictors,
    countOutcomeVariable, countExposureVariable, countPredictors,
  ]);
  const currentSetupCompleteRows = useMemo(
    () => currentAnalysisVariables.length === 0
      ? activeRows.length
      : activeRows.filter((row) => currentAnalysisVariables.every((name) => !isMissingValue(row[name]))).length,
    [activeRows, currentAnalysisVariables]
  );
  const missingnessFocusVariables = useMemo(() => {
    if (currentAnalysisVariables.length > 0) return currentAnalysisVariables.slice(0, 12);
    return missingnessProfile.variables.slice(0, 10).map((item) => item.variable);
  }, [currentAnalysisVariables, missingnessProfile.variables]);
  const missingnessPatterns = useMemo(
    () => computeAnalysisMissingnessPatterns(activeRows, activeCodebook, missingnessFocusVariables, 12),
    [activeRows, activeCodebook, missingnessFocusVariables]
  );
  const pairwiseAvailability = useMemo(
    () => computeAnalysisPairwiseAvailability(activeRows, activeCodebook, missingnessFocusVariables),
    [activeRows, activeCodebook, missingnessFocusVariables]
  );
  const sampleAudit = useMemo(
    () => computeAnalysisSampleAudit({
      sourceRows: sourceRows.length,
      workingRows: variableOperationResult.rows,
      filteredRows: activeRows,
      codebook: activeCodebook,
      requiredVariables: currentAnalysisVariables,
    }),
    [sourceRows.length, variableOperationResult.rows, activeRows, activeCodebook, currentAnalysisVariables]
  );
  const analysisFingerprint = useMemo(
    () => computeAnalysisDataFingerprint(activeRows, currentAnalysisVariables),
    [activeRows, currentAnalysisVariables]
  );
  const analysisWorkingFingerprint = useMemo(
    () => computeAnalysisDataFingerprint(activeRows),
    [activeRows]
  );

  useEffect(() => {
    if (!pendingAiWorkflowAfterView) return;
    const viewStep = pendingAiWorkflowAfterView.preparation_steps.find((step) => step.kind === "working_view");
    const targetView = viewStep && viewStep.kind === "working_view" ? viewStep.view : (preparedViewActive ? "prepared" : "raw");
    if ((targetView === "prepared") !== preparedViewActive) return;

    const result = applyApprovedAnalysisAiPreparation(pendingAiWorkflowAfterView);
    setPendingAiWorkflowAfterView(null);
    setCopyStatus(result.message);
    window.setTimeout(() => setCopyStatus(""), 3000);
  }, [pendingAiWorkflowAfterView, preparedViewActive, workbenchDatasetIdentity]);

  useEffect(() => {
    if (!pendingAiSetupAfterPreparation) return;
    const availableNames = new Set(variables.map((variable) => variable.name));
    const required = analysisAiSetupVariableReferences(pendingAiSetupAfterPreparation.setup || {});
    if (required.some((name) => !availableNames.has(name))) return;
    if (pendingAiSetupAfterPreparation.requires_raw_rows && preparedViewActive) return;

    const result = applyAnalysisAiSetupProposal(pendingAiSetupAfterPreparation);
    setPendingAiSetupAfterPreparation(null);
    setCopyStatus(result.ok ? "AI workflow applied · analysis ready" : result.message);
    window.setTimeout(() => setCopyStatus(""), 3200);
  }, [pendingAiSetupAfterPreparation, variables, preparedViewActive, activeRows]);

  useEffect(() => {
    const workbenchNames = new Set(workbenchVariables.map((variable) => variable.name));
    setAnalysisFilters((current) => {
      const next = current.filter((rule) => workbenchNames.has(rule.variable));
      return next.length === current.length ? current : next;
    });
    if (!workbenchNames.has(filterVariable)) {
      setFilterVariable(workbenchVariables[0]?.name || "");
    }
    if (!numericWorkbenchVariables.some((variable) => variable.name === transformSource)) {
      setTransformSource(numericWorkbenchVariables[0]?.name || "");
    }
    if (!numericWorkbenchVariables.some((variable) => variable.name === computedLeft)) {
      setComputedLeft(numericWorkbenchVariables[0]?.name || "");
    }
    if (!numericWorkbenchVariables.some((variable) => variable.name === computedRight) || computedRight === computedLeft) {
      setComputedRight(numericWorkbenchVariables.find((variable) => variable.name !== computedLeft)?.name || "");
    }
    if (!recodeWorkbenchVariables.some((variable) => variable.name === recodeSource)) {
      setRecodeSource(recodeWorkbenchVariables[0]?.name || "");
    }
  }, [workbenchVariables, numericWorkbenchVariables, recodeWorkbenchVariables, filterVariable, transformSource, computedLeft, computedRight, recodeSource]);

  useEffect(() => {
    if (!repeatedClusterVariables.some((variable) => variable.name === repeatedClusterVariable)) {
      setRepeatedClusterVariable(repeatedClusterVariables[0]?.name || "");
    }
    if (!repeatedTimeVariables.some((variable) => variable.name === repeatedTimeVariable)) {
      setRepeatedTimeVariable(repeatedTimeVariables[0]?.name || "");
    }
    if (!repeatedSourceVariables.some((variable) => variable.name === repeatedSourceVariable)) {
      setRepeatedSourceVariable(repeatedSourceVariables[0]?.name || "");
    }
  }, [repeatedClusterVariables, repeatedTimeVariables, repeatedSourceVariables, repeatedClusterVariable, repeatedTimeVariable, repeatedSourceVariable]);

  const selectableVariables = useMemo(
    () =>
      variables.filter((variable) =>
        activeAnalysis === "correlations" || activeAnalysis === "regression" || activeAnalysis === "reliability" || activeAnalysis === "factor"
          ? variable.level === "continuous" || variable.level === "ordinal"
          : activeAnalysis === "visualizations" || activeAnalysis === "ttests" || activeAnalysis === "nonparametric" || activeAnalysis === "categorical" || activeAnalysis === "anova" || activeAnalysis === "diagnostics" || activeAnalysis === "process" || activeAnalysis === "mixed" || activeAnalysis === "logistic" || activeAnalysis === "count"
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
    if (activeAnalysis === "cognitive" || activeAnalysis === "visualizations" || activeAnalysis === "ttests" || activeAnalysis === "nonparametric" || activeAnalysis === "categorical" || activeAnalysis === "anova" || activeAnalysis === "regression" || activeAnalysis === "process" || activeAnalysis === "mixed" || activeAnalysis === "logistic" || activeAnalysis === "count" || selectedVariables.length > 0 || selectableVariables.length === 0) return;

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

  const nonParametricNumericCandidates = tTestNumericCandidates;
  const nonParametricGroupCandidates = useMemo(
    () =>
      variables.filter(
        (variable) =>
          !["id", "datetime", "text"].includes(variable.level) &&
          variable.distinctCount >= 2 &&
          variable.distinctCount <= 30
      ),
    [variables]
  );

  useEffect(() => {
    if (nonParametricNumericCandidates.length === 0) {
      if (npOutcomeVariable) setNpOutcomeVariable("");
      if (npPairedVariableA) setNpPairedVariableA("");
      if (npPairedVariableB) setNpPairedVariableB("");
      if (npRepeatedVariables.length > 0) setNpRepeatedVariables([]);
      return;
    }

    const numericNames = new Set(nonParametricNumericCandidates.map((variable) => variable.name));
    const outcome = numericNames.has(npOutcomeVariable)
      ? npOutcomeVariable
      : nonParametricNumericCandidates[0]?.name || "";
    if (outcome !== npOutcomeVariable) setNpOutcomeVariable(outcome);

    const pairA = numericNames.has(npPairedVariableA)
      ? npPairedVariableA
      : nonParametricNumericCandidates[0]?.name || "";
    if (pairA !== npPairedVariableA) setNpPairedVariableA(pairA);

    const pairB = numericNames.has(npPairedVariableB) && npPairedVariableB !== pairA
      ? npPairedVariableB
      : nonParametricNumericCandidates.find((variable) => variable.name !== pairA)?.name || "";
    if (pairB !== npPairedVariableB) setNpPairedVariableB(pairB);

    setNpRepeatedVariables((current) => {
      const valid = current.filter((name) => numericNames.has(name));
      if (valid.length >= 3) return valid;
      return nonParametricNumericCandidates
        .slice(0, Math.min(3, nonParametricNumericCandidates.length))
        .map((variable) => variable.name);
    });
  }, [
    datasetKey,
    sourceMode,
    nonParametricNumericCandidates,
    npOutcomeVariable,
    npPairedVariableA,
    npPairedVariableB,
    npRepeatedVariables.length,
  ]);

  useEffect(() => {
    if (nonParametricGroupCandidates.length === 0) {
      if (npGroupVariable) setNpGroupVariable("");
      return;
    }
    const names = new Set(nonParametricGroupCandidates.map((variable) => variable.name));
    if (!names.has(npGroupVariable) || npGroupVariable === npOutcomeVariable) {
      const preferred =
        nonParametricGroupCandidates.find((variable) => variable.name !== npOutcomeVariable) ||
        nonParametricGroupCandidates[0];
      setNpGroupVariable(preferred?.name || "");
    }
  }, [datasetKey, sourceMode, nonParametricGroupCandidates, npGroupVariable, npOutcomeVariable]);

  const npOutcomeMeta = variables.find((variable) => variable.name === npOutcomeVariable) || null;
  const npGroupMeta = variables.find((variable) => variable.name === npGroupVariable) || null;
  const npPairedMetaA = variables.find((variable) => variable.name === npPairedVariableA) || null;
  const npPairedMetaB = variables.find((variable) => variable.name === npPairedVariableB) || null;
  const npRepeatedMeta = npRepeatedVariables
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));

  const npGroupLevels = useMemo(
    () => (npGroupVariable ? getVariableLevels(activeRows, npGroupVariable, 80) : []),
    [activeRows, npGroupVariable]
  );

  useEffect(() => {
    if (npGroupLevels.length < 2) {
      if (npGroupA) setNpGroupA("");
      if (npGroupB) setNpGroupB("");
      return;
    }
    const values = new Set(npGroupLevels.map((level) => level.value));
    const nextA = values.has(npGroupA) ? npGroupA : npGroupLevels[0].value;
    const nextB = values.has(npGroupB) && npGroupB !== nextA
      ? npGroupB
      : npGroupLevels.find((level) => level.value !== nextA)?.value || "";
    if (nextA !== npGroupA) setNpGroupA(nextA);
    if (nextB !== npGroupB) setNpGroupB(nextB);
  }, [npGroupLevels, npGroupA, npGroupB]);

  const mannWhitneyResult = useMemo(
    () =>
      npOutcomeMeta && npGroupMeta && npGroupA && npGroupB && npGroupA !== npGroupB
        ? computeMannWhitneyU(activeRows, npOutcomeMeta, npGroupMeta, npGroupA, npGroupB)
        : null,
    [activeRows, npOutcomeMeta, npGroupMeta, npGroupA, npGroupB]
  );

  const wilcoxonResult = useMemo(
    () =>
      npPairedMetaA && npPairedMetaB && npPairedMetaA.name !== npPairedMetaB.name
        ? computeWilcoxonSignedRank(activeRows, npPairedMetaA, npPairedMetaB)
        : null,
    [activeRows, npPairedMetaA, npPairedMetaB]
  );

  const kruskalWallisResult = useMemo(
    () =>
      npOutcomeMeta && npGroupMeta && npOutcomeMeta.name !== npGroupMeta.name
        ? computeKruskalWallis(activeRows, npOutcomeMeta, npGroupMeta)
        : null,
    [activeRows, npOutcomeMeta, npGroupMeta]
  );

  const friedmanResult = useMemo(
    () => (npRepeatedMeta.length >= 3 ? computeFriedmanTest(activeRows, npRepeatedMeta) : null),
    [activeRows, npRepeatedMeta]
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
      if (anovaFactors.length > 0) setAnovaFactors([]);
      return;
    }

    const factorNames = new Set(anovaFactorCandidates.map((variable) => variable.name));
    if (!factorNames.has(anovaFactorVariable) || anovaFactorVariable === anovaOutcomeVariable) {
      const preferred =
        anovaFactorCandidates.find((variable) => variable.name !== anovaOutcomeVariable) ||
        anovaFactorCandidates[0];
      setAnovaFactorVariable(preferred?.name || "");
    }

    setAnovaFactors((current) => {
      const valid = current.filter(
        (name) => factorNames.has(name) && name !== anovaOutcomeVariable
      );
      const desired = anovaMode === "factorial" ? 2 : anovaMode === "ancova" ? 1 : valid.length;
      if (anovaMode !== "factorial" && anovaMode !== "ancova") return valid;
      if (valid.length >= desired) return valid.slice(0, 4);
      const additions = anovaFactorCandidates
        .filter(
          (variable) =>
            variable.name !== anovaOutcomeVariable && !valid.includes(variable.name)
        )
        .slice(0, Math.max(0, desired - valid.length))
        .map((variable) => variable.name);
      return [...valid, ...additions].slice(0, 4);
    });
  }, [datasetKey, sourceMode, anovaFactorCandidates, anovaFactorVariable, anovaOutcomeVariable, anovaMode, anovaFactors.length]);

  useEffect(() => {
    const numericNames = new Set(anovaNumericCandidates.map((variable) => variable.name));
    setAnovaCovariates((current) => {
      const valid = current.filter(
        (name) =>
          numericNames.has(name) &&
          name !== anovaOutcomeVariable &&
          !anovaFactors.includes(name)
      );
      if (anovaMode !== "ancova") return valid;
      if (valid.length > 0) return valid.slice(0, 8);
      const preferred = anovaNumericCandidates.find(
        (variable) =>
          variable.name !== anovaOutcomeVariable && !anovaFactors.includes(variable.name)
      );
      return preferred ? [preferred.name] : [];
    });
  }, [datasetKey, sourceMode, anovaNumericCandidates, anovaOutcomeVariable, anovaFactors, anovaMode]);

  const anovaOutcomeMeta = variables.find((variable) => variable.name === anovaOutcomeVariable) || null;
  const anovaFactorMeta = variables.find((variable) => variable.name === anovaFactorVariable) || null;
  const anovaFactorMetas = anovaFactors
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));
  const anovaCovariateMetas = anovaCovariates
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));
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

  const oneWayVarianceDiagnostics = useMemo(
    () =>
      anovaOutcomeMeta && anovaFactorMeta && anovaOutcomeMeta.name !== anovaFactorMeta.name
        ? computeVarianceHomogeneity(activeRows, anovaOutcomeMeta, anovaFactorMeta, "median")
        : null,
    [activeRows, anovaOutcomeMeta, anovaFactorMeta]
  );

  const generalLinearAnovaResult = useMemo(
    () =>
      (anovaMode === "factorial" || anovaMode === "ancova") && anovaOutcomeMeta
        ? computeGeneralLinearModelAnova(
            activeRows,
            anovaOutcomeMeta,
            anovaFactorMetas,
            anovaMode === "ancova" ? anovaCovariateMetas : [],
            {
              mode: anovaMode,
              includeInteractions: anovaIncludeInteractions,
            }
          )
        : null,
    [
      activeRows,
      anovaMode,
      anovaOutcomeMeta,
      anovaFactorMetas,
      anovaCovariateMetas,
      anovaIncludeInteractions,
    ]
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

  const processCandidates = tTestNumericCandidates;

  useEffect(() => {
    if (processCandidates.length < 3) {
      if (processOutcomeVariable) setProcessOutcomeVariable("");
      if (processPredictorVariable) setProcessPredictorVariable("");
      if (processMediatorVariable) setProcessMediatorVariable("");
      if (processModeratorVariable) setProcessModeratorVariable("");
      if (processCovariates.length > 0) setProcessCovariates([]);
      return;
    }

    const names = new Set(processCandidates.map((variable) => variable.name));
    const nextOutcome = names.has(processOutcomeVariable)
      ? processOutcomeVariable
      : processCandidates[0]?.name || "";
    const nextPredictor = names.has(processPredictorVariable) && processPredictorVariable !== nextOutcome
      ? processPredictorVariable
      : processCandidates.find((variable) => variable.name !== nextOutcome)?.name || "";
    const third = processCandidates.find((variable) => variable.name !== nextOutcome && variable.name !== nextPredictor)?.name || "";
    const nextMediator = names.has(processMediatorVariable) && ![nextOutcome, nextPredictor].includes(processMediatorVariable)
      ? processMediatorVariable
      : third;
    const nextModerator = names.has(processModeratorVariable) && ![nextOutcome, nextPredictor].includes(processModeratorVariable)
      ? processModeratorVariable
      : third;

    if (nextOutcome !== processOutcomeVariable) setProcessOutcomeVariable(nextOutcome);
    if (nextPredictor !== processPredictorVariable) setProcessPredictorVariable(nextPredictor);
    if (nextMediator !== processMediatorVariable) setProcessMediatorVariable(nextMediator);
    if (nextModerator !== processModeratorVariable) setProcessModeratorVariable(nextModerator);

    const reserved = new Set([nextOutcome, nextPredictor, processMode === "mediation" ? nextMediator : nextModerator]);
    setProcessCovariates((current) => current.filter((name) => names.has(name) && !reserved.has(name)));
  }, [
    datasetKey,
    sourceMode,
    processCandidates,
    processOutcomeVariable,
    processPredictorVariable,
    processMediatorVariable,
    processModeratorVariable,
    processCovariates.length,
    processMode,
  ]);

  const processOutcomeMeta = variables.find((variable) => variable.name === processOutcomeVariable) || null;
  const processPredictorMeta = variables.find((variable) => variable.name === processPredictorVariable) || null;
  const processMediatorMeta = variables.find((variable) => variable.name === processMediatorVariable) || null;
  const processModeratorMeta = variables.find((variable) => variable.name === processModeratorVariable) || null;
  const processCovariateMeta = useMemo(
    () => processCovariates
      .map((name) => variables.find((variable) => variable.name === name))
      .filter((variable): variable is AnalysisVariable => Boolean(variable)),
    [processCovariates, variables]
  );

  const mediationResult: MediationAnalysisResult | null = useMemo(
    () =>
      processMode === "mediation" && processOutcomeMeta && processPredictorMeta && processMediatorMeta
        ? computeMediationAnalysis(
            activeRows,
            processPredictorMeta,
            processMediatorMeta,
            processOutcomeMeta,
            processCovariateMeta,
            { bootstrapSamples: processBootstrapSamples }
          )
        : null,
    [
      activeRows,
      processMode,
      processOutcomeMeta,
      processPredictorMeta,
      processMediatorMeta,
      processCovariateMeta,
      processBootstrapSamples,
    ]
  );

  const moderationResult: ModerationAnalysisResult | null = useMemo(
    () =>
      processMode === "moderation" && processOutcomeMeta && processPredictorMeta && processModeratorMeta
        ? computeModerationAnalysis(
            activeRows,
            processPredictorMeta,
            processModeratorMeta,
            processOutcomeMeta,
            processCovariateMeta,
            { centerPredictors: processCenterPredictors }
          )
        : null,
    [
      activeRows,
      processMode,
      processOutcomeMeta,
      processPredictorMeta,
      processModeratorMeta,
      processCovariateMeta,
      processCenterPredictors,
    ]
  );

  const visualizationNumericCandidates = tTestNumericCandidates;
  const visualizationFactorCandidates = useMemo(
    () =>
      variables.filter(
        (variable) =>
          !["id", "datetime", "text"].includes(variable.level) &&
          variable.distinctCount >= 2 &&
          variable.distinctCount <= 16
      ),
    [variables]
  );

  useEffect(() => {
    const numericNames = new Set(visualizationNumericCandidates.map((variable) => variable.name));
    const factorNames = new Set(visualizationFactorCandidates.map((variable) => variable.name));

    const nextX = numericNames.has(visualizationXVariable)
      ? visualizationXVariable
      : visualizationNumericCandidates[0]?.name || "";
    const nextY = numericNames.has(visualizationYVariable) && visualizationYVariable !== nextX
      ? visualizationYVariable
      : visualizationNumericCandidates.find((variable) => variable.name !== nextX)?.name || "";
    const nextOutcome = numericNames.has(visualizationOutcomeVariable)
      ? visualizationOutcomeVariable
      : visualizationNumericCandidates[0]?.name || "";

    if (nextX !== visualizationXVariable) setVisualizationXVariable(nextX);
    if (nextY !== visualizationYVariable) setVisualizationYVariable(nextY);
    if (nextOutcome !== visualizationOutcomeVariable) setVisualizationOutcomeVariable(nextOutcome);

    if (visualizationGroupVariable && !factorNames.has(visualizationGroupVariable)) {
      setVisualizationGroupVariable("");
    }
    if (visualizationTraceVariable && (!factorNames.has(visualizationTraceVariable) || visualizationTraceVariable === visualizationGroupVariable)) {
      setVisualizationTraceVariable("");
    }

    if ((visualizationMode === "means" || visualizationMode === "interaction") && !visualizationGroupVariable) {
      const preferred = visualizationFactorCandidates.find((variable) => variable.name !== nextOutcome);
      if (preferred) setVisualizationGroupVariable(preferred.name);
    }
    if (visualizationMode === "interaction" && !visualizationTraceVariable) {
      const preferred = visualizationFactorCandidates.find(
        (variable) => variable.name !== visualizationGroupVariable && variable.name !== nextOutcome
      );
      if (preferred) setVisualizationTraceVariable(preferred.name);
    }
  }, [
    datasetKey,
    sourceMode,
    visualizationMode,
    visualizationNumericCandidates,
    visualizationFactorCandidates,
    visualizationXVariable,
    visualizationYVariable,
    visualizationOutcomeVariable,
    visualizationGroupVariable,
    visualizationTraceVariable,
  ]);

  const visualizationXMeta = variables.find((variable) => variable.name === visualizationXVariable) || null;
  const visualizationYMeta = variables.find((variable) => variable.name === visualizationYVariable) || null;
  const visualizationOutcomeMeta = variables.find((variable) => variable.name === visualizationOutcomeVariable) || null;
  const visualizationGroupMeta = variables.find((variable) => variable.name === visualizationGroupVariable) || null;
  const visualizationTraceMeta = variables.find((variable) => variable.name === visualizationTraceVariable) || null;

  const visualizationScatterResult = useMemo(
    () => computeVisualizationScatter(activeRows, visualizationXMeta, visualizationYMeta, visualizationGroupMeta),
    [activeRows, visualizationXMeta, visualizationYMeta, visualizationGroupMeta]
  );
  const visualizationDistributionResult = useMemo(
    () => computeVisualizationDistribution(activeRows, visualizationOutcomeMeta, visualizationGroupMeta),
    [activeRows, visualizationOutcomeMeta, visualizationGroupMeta]
  );
  const visualizationMeansResult = useMemo(
    () => computeVisualizationMeans(activeRows, visualizationOutcomeMeta, visualizationGroupMeta),
    [activeRows, visualizationOutcomeMeta, visualizationGroupMeta]
  );
  const visualizationInteractionResult = useMemo(
    () => computeVisualizationInteraction(activeRows, visualizationOutcomeMeta, visualizationGroupMeta, visualizationTraceMeta),
    [activeRows, visualizationOutcomeMeta, visualizationGroupMeta, visualizationTraceMeta]
  );

  const categoricalCandidates = useMemo(
    () =>
      variables.filter((variable) => {
        if (["id", "datetime", "text"].includes(variable.level)) return false;
        return variable.distinctCount >= 2 && variable.distinctCount <= 30;
      }),
    [variables]
  );

  useEffect(() => {
    const names = new Set(categoricalCandidates.map((variable) => variable.name));
    const nextRow = names.has(categoricalRowVariable)
      ? categoricalRowVariable
      : categoricalCandidates[0]?.name || "";
    const nextColumn = names.has(categoricalColumnVariable) && categoricalColumnVariable !== nextRow
      ? categoricalColumnVariable
      : categoricalCandidates.find((variable) => variable.name !== nextRow)?.name || "";
    if (nextRow !== categoricalRowVariable) setCategoricalRowVariable(nextRow);
    if (nextColumn !== categoricalColumnVariable) setCategoricalColumnVariable(nextColumn);
  }, [datasetKey, sourceMode, categoricalCandidates, categoricalRowVariable, categoricalColumnVariable]);

  const categoricalRowMeta =
    variables.find((variable) => variable.name === categoricalRowVariable) || null;
  const categoricalColumnMeta =
    variables.find((variable) => variable.name === categoricalColumnVariable) || null;

  const categoricalAssociationResult = useMemo(
    () =>
      categoricalRowMeta && categoricalColumnMeta && categoricalRowMeta.name !== categoricalColumnMeta.name
        ? computeCategoricalAssociation(activeRows, categoricalRowMeta, categoricalColumnMeta)
        : null,
    [activeRows, categoricalRowMeta, categoricalColumnMeta]
  );

  const mixedOutcomeCandidates = useMemo(() => {
    if (mixedFamily === "gaussian") return tTestNumericCandidates;
    if (mixedFamily === "binomial") {
      return variables.filter((variable) =>
        !["id", "datetime", "text"].includes(variable.level) &&
        getVariableLevels(activeRows, variable.name, 4).length === 2
      );
    }
    return tTestNumericCandidates;
  }, [mixedFamily, tTestNumericCandidates, variables, activeRows]);

  const mixedGroupCandidates = useMemo(
    () =>
      [...variables]
        .filter(
          (variable) =>
            variable.level !== "datetime" &&
            variable.distinctCount >= 2 &&
            variable.distinctCount < variable.validCount
        )
        .sort((left, right) => {
          const score = (variable: AnalysisVariable) => {
            const text = `${variable.name} ${variable.label}`.toLowerCase();
            if (/participant|subject|person|user|respondent/.test(text)) return 0;
            if (variable.level === "id") return 1;
            if (/session|cluster|school|site|class|family/.test(text)) return 2;
            return 3;
          };
          return score(left) - score(right) || left.distinctCount - right.distinctCount;
        }),
    [variables]
  );

  const mixedPredictorCandidates = useMemo(
    () =>
      variables.filter(
        (variable) => !["id", "datetime", "text"].includes(variable.level)
      ),
    [variables]
  );

  useEffect(() => {
    if (mixedOutcomeCandidates.length === 0) {
      if (mixedOutcomeVariable) setMixedOutcomeVariable("");
      if (mixedPredictors.length > 0) setMixedPredictors([]);
      return;
    }

    const outcomeNames = new Set(mixedOutcomeCandidates.map((variable) => variable.name));
    const nextOutcome = outcomeNames.has(mixedOutcomeVariable)
      ? mixedOutcomeVariable
      : mixedOutcomeCandidates[0]?.name || "";
    if (nextOutcome !== mixedOutcomeVariable) setMixedOutcomeVariable(nextOutcome);

    const groupNames = new Set(mixedGroupCandidates.map((variable) => variable.name));
    const nextGroup = groupNames.has(mixedGroupVariable) && mixedGroupVariable !== nextOutcome
      ? mixedGroupVariable
      : mixedGroupCandidates.find((variable) => variable.name !== nextOutcome)?.name || "";
    if (nextGroup !== mixedGroupVariable) setMixedGroupVariable(nextGroup);

    const predictorNames = new Set(mixedPredictorCandidates.map((variable) => variable.name));
    setMixedPredictors((current) => {
      const valid = current.filter(
        (name) => predictorNames.has(name) && name !== nextOutcome && name !== nextGroup
      );
      if (valid.length > 0) return valid;
      return mixedPredictorCandidates
        .filter((variable) => variable.name !== nextOutcome && variable.name !== nextGroup)
        .slice(0, Math.min(2, Math.max(0, mixedPredictorCandidates.length - 1)))
        .map((variable) => variable.name);
    });
  }, [
    datasetKey,
    sourceMode,
    mixedFamily,
    mixedOutcomeCandidates,
    mixedGroupCandidates,
    mixedPredictorCandidates,
    mixedOutcomeVariable,
    mixedGroupVariable,
    mixedPredictors.length,
  ]);

  const mixedOutcomeMeta =
    variables.find((variable) => variable.name === mixedOutcomeVariable) || null;
  const mixedGroupMeta =
    variables.find((variable) => variable.name === mixedGroupVariable) || null;
  const mixedPredictorMeta = mixedPredictors
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));
  const mixedRandomSlopeMeta =
    mixedPredictorMeta.find(
      (variable) =>
        variable.name === mixedRandomSlopeVariable &&
        (variable.level === "continuous" || variable.level === "ordinal")
    ) || null;
  const mixedRandomSlopeCandidates = mixedPredictorMeta.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );

  useEffect(() => {
    if (mixedRandomSlopeVariable && !mixedRandomSlopeCandidates.some((variable) => variable.name === mixedRandomSlopeVariable)) {
      setMixedRandomSlopeVariable("");
    }
  }, [mixedRandomSlopeVariable, mixedRandomSlopeCandidates]);

  const mixedOutcomeLevels = useMemo(
    () => mixedOutcomeMeta ? getVariableLevels(activeRows, mixedOutcomeMeta.name, 20).map((level) => level.value) : [],
    [activeRows, mixedOutcomeMeta]
  );

  useEffect(() => {
    if (mixedFamily !== "binomial") {
      if (mixedPositiveClass) setMixedPositiveClass("");
      return;
    }
    const next = mixedOutcomeLevels.includes(mixedPositiveClass)
      ? mixedPositiveClass
      : mixedOutcomeLevels[1] || mixedOutcomeLevels[0] || "";
    if (next !== mixedPositiveClass) setMixedPositiveClass(next);
  }, [mixedFamily, mixedOutcomeLevels, mixedPositiveClass]);

  const mixedExposureCandidates = useMemo(
    () => tTestNumericCandidates.filter((variable) => variable.name !== mixedOutcomeVariable && variable.name !== mixedGroupVariable),
    [tTestNumericCandidates, mixedOutcomeVariable, mixedGroupVariable]
  );
  const mixedExposureMeta = variables.find((variable) => variable.name === mixedExposureVariable) || null;

  useEffect(() => {
    if (mixedFamily !== "poisson") {
      if (mixedExposureVariable) setMixedExposureVariable("");
      return;
    }
    if (mixedExposureVariable && !mixedExposureCandidates.some((variable) => variable.name === mixedExposureVariable)) {
      setMixedExposureVariable("");
    }
  }, [mixedFamily, mixedExposureVariable, mixedExposureCandidates]);

  const linearMixedModelResult = useMemo(
    () =>
      mixedFamily === "gaussian" && mixedOutcomeMeta && mixedGroupMeta && mixedPredictorMeta.length > 0
        ? computeLinearMixedModel(
            activeRows,
            mixedOutcomeMeta,
            mixedGroupMeta,
            mixedPredictorMeta,
            {
              estimator: mixedEstimator,
              centering: mixedCentering,
              randomSlope: mixedRandomSlopeMeta,
            }
          )
        : null,
    [
      mixedFamily,
      activeRows,
      mixedOutcomeMeta,
      mixedGroupMeta,
      mixedPredictorMeta,
      mixedEstimator,
      mixedCentering,
      mixedRandomSlopeMeta,
    ]
  );

  const generalizedMixedModelResult: GeneralizedMixedModelResult | null = useMemo(
    () =>
      mixedFamily !== "gaussian" && mixedOutcomeMeta && mixedGroupMeta && mixedPredictorMeta.length > 0
        ? computeGeneralizedMixedModel(
            activeRows,
            mixedOutcomeMeta,
            mixedGroupMeta,
            mixedPredictorMeta,
            {
              family: mixedFamily,
              positiveClass: mixedFamily === "binomial" ? mixedPositiveClass || null : null,
              exposure: mixedFamily === "poisson" ? mixedExposureMeta : null,
            }
          )
        : null,
    [
      mixedFamily,
      activeRows,
      mixedOutcomeMeta,
      mixedGroupMeta,
      mixedPredictorMeta,
      mixedPositiveClass,
      mixedExposureMeta,
    ]
  );

  const logisticOutcomeCandidates = useMemo(
    () =>
      variables.filter((variable) => {
        if (["id", "datetime", "text"].includes(variable.level)) return false;
        const levelCount = getVariableLevels(activeRows, variable.name, 50).length;
        if (logisticMode === "binary") return levelCount === 2;
        if (logisticMode === "multinomial") return levelCount >= 3 && levelCount <= 8;
        return levelCount >= 3 && levelCount <= 10;
      }),
    [variables, activeRows, logisticMode]
  );

  const logisticPredictorCandidates = useMemo(
    () =>
      variables.filter(
        (variable) => !["id", "datetime", "text"].includes(variable.level)
      ),
    [variables]
  );

  useEffect(() => {
    if (logisticOutcomeCandidates.length === 0) {
      if (logisticOutcomeVariable) setLogisticOutcomeVariable("");
      if (logisticPositiveClass) setLogisticPositiveClass("");
      if (logisticReferenceClass) setLogisticReferenceClass("");
      if (logisticOrdinalOrder.length > 0) setLogisticOrdinalOrder([]);
      if (logisticPredictors.length > 0) setLogisticPredictors([]);
      return;
    }

    const outcomeNames = new Set(logisticOutcomeCandidates.map((variable) => variable.name));
    const nextOutcome = outcomeNames.has(logisticOutcomeVariable)
      ? logisticOutcomeVariable
      : logisticOutcomeCandidates[0]?.name || "";
    if (nextOutcome !== logisticOutcomeVariable) setLogisticOutcomeVariable(nextOutcome);

    const outcomeMeta = logisticOutcomeCandidates.find((variable) => variable.name === nextOutcome) || null;
    const levels = outcomeMeta ? getVariableLevels(activeRows, outcomeMeta.name, 50) : [];
    const levelValues = levels.map((level) => level.value);

    if (logisticMode === "binary") {
      const nextPositive = levelValues.includes(logisticPositiveClass)
        ? logisticPositiveClass
        : levelValues[levelValues.length - 1] || "";
      if (nextPositive !== logisticPositiveClass) setLogisticPositiveClass(nextPositive);
    }

    if (logisticMode === "multinomial") {
      const nextReference = levelValues.includes(logisticReferenceClass)
        ? logisticReferenceClass
        : levelValues[levelValues.length - 1] || "";
      if (nextReference !== logisticReferenceClass) setLogisticReferenceClass(nextReference);
    }

    if (logisticMode === "ordinal") {
      const currentValid = logisticOrdinalOrder.length === levelValues.length &&
        logisticOrdinalOrder.every((value) => levelValues.includes(value));
      if (!currentValid) {
        const numeric = levelValues.map((value) => ({ value, number: Number(value) }));
        const ordered = numeric.every((item) => Number.isFinite(item.number))
          ? numeric.sort((a, b) => a.number - b.number).map((item) => item.value)
          : levelValues.slice().sort((a, b) => a.localeCompare(b));
        setLogisticOrdinalOrder(ordered);
      }
    }

    const predictorNames = new Set(logisticPredictorCandidates.map((variable) => variable.name));
    setLogisticPredictors((current) => {
      const valid = current.filter((name) => predictorNames.has(name) && name !== nextOutcome);
      if (valid.length > 0) return valid;
      return logisticPredictorCandidates
        .filter((variable) => variable.name !== nextOutcome)
        .slice(0, Math.min(2, Math.max(0, logisticPredictorCandidates.length - 1)))
        .map((variable) => variable.name);
    });
  }, [
    datasetKey,
    sourceMode,
    activeRows,
    logisticMode,
    logisticOutcomeCandidates,
    logisticPredictorCandidates,
    logisticOutcomeVariable,
    logisticPositiveClass,
    logisticReferenceClass,
    logisticOrdinalOrder,
    logisticPredictors.length,
  ]);

  const logisticOutcomeMeta =
    variables.find((variable) => variable.name === logisticOutcomeVariable) || null;
  const logisticOutcomeLevels = logisticOutcomeMeta
    ? getVariableLevels(activeRows, logisticOutcomeMeta.name, 50)
    : [];
  const logisticPredictorMeta = logisticPredictors
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));

  const binaryLogisticResult = useMemo(
    () =>
      logisticMode === "binary" && logisticOutcomeMeta && logisticPredictorMeta.length > 0
        ? computeBinaryLogisticRegression(
            activeRows,
            logisticOutcomeMeta,
            logisticPredictorMeta,
            logisticPositiveClass,
            logisticThreshold
          )
        : null,
    [
      activeRows,
      logisticMode,
      logisticOutcomeMeta,
      logisticPredictorMeta,
      logisticPositiveClass,
      logisticThreshold,
    ]
  );

  const multinomialLogisticResult: MultinomialLogisticResult | null = useMemo(
    () =>
      logisticMode === "multinomial" && logisticOutcomeMeta && logisticPredictorMeta.length > 0
        ? computeMultinomialLogisticRegression(
            activeRows,
            logisticOutcomeMeta,
            logisticPredictorMeta,
            logisticReferenceClass
          )
        : null,
    [activeRows, logisticMode, logisticOutcomeMeta, logisticPredictorMeta, logisticReferenceClass]
  );

  const ordinalLogisticResult: OrdinalLogisticResult | null = useMemo(
    () =>
      logisticMode === "ordinal" && logisticOutcomeMeta && logisticPredictorMeta.length > 0
        ? computeOrdinalLogisticRegression(
            activeRows,
            logisticOutcomeMeta,
            logisticPredictorMeta,
            logisticOrdinalOrder
          )
        : null,
    [activeRows, logisticMode, logisticOutcomeMeta, logisticPredictorMeta, logisticOrdinalOrder]
  );

  const categoricalRegressionResult = logisticMode === "binary"
    ? binaryLogisticResult
    : logisticMode === "multinomial"
      ? multinomialLogisticResult
      : ordinalLogisticResult;

  const countOutcomeCandidates = useMemo(
    () =>
      variables.filter((variable) => {
        if (!(variable.level === "continuous" || variable.level === "ordinal")) return false;
        const values = activeRows
          .map((row) => {
            const value = row[variable.name];
            const numeric = typeof value === "number" ? value : Number(value);
            return Number.isFinite(numeric) ? numeric : null;
          })
          .filter((value): value is number => value !== null);
        if (values.length < 3) return false;
        if (!values.every((value) => value >= 0 && Math.abs(value - Math.round(value)) <= 1e-8)) return false;
        return new Set(values).size >= 2;
      }),
    [variables, activeRows]
  );

  const countPredictorCandidates = useMemo(
    () => variables.filter((variable) => !["id", "datetime", "text"].includes(variable.level)),
    [variables]
  );

  const countExposureCandidates = useMemo(
    () =>
      variables.filter((variable) => {
        if (!(variable.level === "continuous" || variable.level === "ordinal")) return false;
        const values = activeRows
          .map((row) => {
            const value = row[variable.name];
            const numeric = typeof value === "number" ? value : Number(value);
            return Number.isFinite(numeric) ? numeric : null;
          })
          .filter((value): value is number => value !== null);
        return values.length > 0 && values.every((value) => value > 0);
      }),
    [variables, activeRows]
  );

  useEffect(() => {
    if (countOutcomeCandidates.length === 0) {
      if (countOutcomeVariable) setCountOutcomeVariable("");
      if (countPredictors.length > 0) setCountPredictors([]);
      if (countExposureVariable) setCountExposureVariable("");
      return;
    }
    const outcomeNames = new Set(countOutcomeCandidates.map((variable) => variable.name));
    const nextOutcome = outcomeNames.has(countOutcomeVariable)
      ? countOutcomeVariable
      : countOutcomeCandidates[0]?.name || "";
    if (nextOutcome !== countOutcomeVariable) setCountOutcomeVariable(nextOutcome);

    const predictorNames = new Set(countPredictorCandidates.map((variable) => variable.name));
    setCountPredictors((current) => {
      const valid = current.filter((name) => predictorNames.has(name) && name !== nextOutcome && name !== countExposureVariable);
      if (valid.length > 0) return valid;
      return countPredictorCandidates
        .filter((variable) => variable.name !== nextOutcome && variable.name !== countExposureVariable)
        .slice(0, Math.min(2, Math.max(0, countPredictorCandidates.length - 1)))
        .map((variable) => variable.name);
    });

    if (countExposureVariable && !countExposureCandidates.some((variable) => variable.name === countExposureVariable && variable.name !== nextOutcome)) {
      setCountExposureVariable("");
    }
  }, [
    datasetKey,
    sourceMode,
    activeRows,
    countOutcomeCandidates,
    countPredictorCandidates,
    countExposureCandidates,
    countOutcomeVariable,
    countExposureVariable,
    countPredictors.length,
  ]);

  const countOutcomeMeta = variables.find((variable) => variable.name === countOutcomeVariable) || null;
  const countPredictorMeta = countPredictors
    .map((name) => variables.find((variable) => variable.name === name))
    .filter((variable): variable is AnalysisVariable => Boolean(variable));
  const countExposureMeta = variables.find((variable) => variable.name === countExposureVariable) || null;

  const countRegressionResult: CountRegressionResult | null = useMemo(
    () =>
      countOutcomeMeta && countPredictorMeta.length > 0
        ? computeCountRegression(activeRows, countOutcomeMeta, countPredictorMeta, {
            family: countFamily,
            exposure: countExposureMeta,
          })
        : null,
    [activeRows, countOutcomeMeta, countPredictorMeta, countFamily, countExposureMeta]
  );

  const cognitiveTaskOptions = useMemo(
    () => getCognitiveTaskOptions(sourceRows),
    [sourceRows]
  );

  useEffect(() => {
    if (cognitiveTaskOptions.length === 0) {
      if (cognitiveTask) setCognitiveTask("");
      return;
    }
    if (!cognitiveTaskOptions.some((option) => option.value === cognitiveTask)) {
      setCognitiveTask(cognitiveTaskOptions[0].value);
    }
  }, [datasetKey, sourceMode, cognitiveTaskOptions, cognitiveTask]);

  const cognitiveResult = useMemo(
    () =>
      computeCognitiveTaskAnalysis(sourceRows, {
        task: cognitiveTask,
        minRtMs: cognitiveRtMin,
        maxRtMs: cognitiveRtMax,
        correctRtOnly: cognitiveCorrectRtOnly,
        minScorableTrials: cognitiveMinTrials,
        minAccuracy: cognitiveMinAccuracy,
        maxOmissionRate: cognitiveMaxOmissionRate,
        maxRtExclusionRate: cognitiveMaxRtExclusionRate,
        referenceCondition: cognitiveReferenceCondition,
      }),
    [
      sourceRows,
      cognitiveTask,
      cognitiveRtMin,
      cognitiveRtMax,
      cognitiveCorrectRtOnly,
      cognitiveMinTrials,
      cognitiveMinAccuracy,
      cognitiveMaxOmissionRate,
      cognitiveMaxRtExclusionRate,
      cognitiveReferenceCondition,
    ]
  );

  useEffect(() => {
    if (cognitiveResult.referenceCondition && cognitiveResult.referenceCondition !== cognitiveReferenceCondition) {
      setCognitiveReferenceCondition(cognitiveResult.referenceCondition);
    } else if (!cognitiveResult.referenceCondition && cognitiveReferenceCondition) {
      setCognitiveReferenceCondition("");
    }
  }, [cognitiveResult.referenceCondition, cognitiveReferenceCondition]);

  const cognitiveTrialDatasetOption = datasetOptions.find((option) => option.value === "cognitive_trials") || null;
  const cognitiveSummaryDatasetOption = datasetOptions.find((option) => option.value === "cognitive_participant_summary") || null;

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

  const factorCandidates = useMemo(
    () =>
      variables.filter(
        (variable) => variable.level === "continuous" || variable.level === "ordinal"
      ),
    [variables]
  );

  const factorVariables = selectedMeta.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );

  const factorVariableKey = factorVariables.map((variable) => variable.name).join("|");

  useEffect(() => {
    const maximum = Math.max(1, factorVariables.length - 1);
    setFactorCount((current) => Math.min(Math.max(1, current), maximum));
  }, [factorVariableKey, factorVariables.length]);

  const factorResult = useMemo(
    () =>
      computeExploratoryFactorAnalysis(activeRows, factorVariables, {
        factorCount,
        extraction: factorExtraction,
        rotation: factorRotation,
      }),
    [activeRows, factorVariables, factorCount, factorExtraction, factorRotation]
  );

  const powerResult: PowerAnalysisResult = useMemo(
    () => computePowerAnalysis({
      test: powerTest,
      mode: powerMode,
      effectSize: powerEffectSize,
      alpha: powerAlpha,
      targetPower: powerTarget,
      sampleSize: powerSampleSize,
      tails: powerTails,
      groups: powerGroups,
    }),
    [powerTest, powerMode, powerEffectSize, powerAlpha, powerTarget, powerSampleSize, powerTails, powerGroups]
  );

  const diagnosticsNumericCandidates = tTestNumericCandidates;
  const diagnosticsFactorCandidates = useMemo(
    () =>
      variables.filter(
        (variable) =>
          !["id", "datetime", "text"].includes(variable.level) &&
          variable.distinctCount >= 2 &&
          variable.distinctCount <= 30
      ),
    [variables]
  );

  const diagnosticsVariables = selectedMeta.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );

  useEffect(() => {
    if (diagnosticsNumericCandidates.length === 0) {
      if (diagnosticsOutcomeVariable) setDiagnosticsOutcomeVariable("");
      return;
    }
    const names = new Set(diagnosticsNumericCandidates.map((variable) => variable.name));
    if (!names.has(diagnosticsOutcomeVariable)) {
      setDiagnosticsOutcomeVariable(diagnosticsNumericCandidates[0]?.name || "");
    }
  }, [datasetKey, sourceMode, diagnosticsNumericCandidates, diagnosticsOutcomeVariable]);

  useEffect(() => {
    if (diagnosticsFactorCandidates.length === 0) {
      if (diagnosticsFactorVariable) setDiagnosticsFactorVariable("");
      return;
    }
    const names = new Set(diagnosticsFactorCandidates.map((variable) => variable.name));
    if (!names.has(diagnosticsFactorVariable) || diagnosticsFactorVariable === diagnosticsOutcomeVariable) {
      const preferred =
        diagnosticsFactorCandidates.find((variable) => variable.name !== diagnosticsOutcomeVariable) ||
        diagnosticsFactorCandidates[0];
      setDiagnosticsFactorVariable(preferred?.name || "");
    }
  }, [datasetKey, sourceMode, diagnosticsFactorCandidates, diagnosticsFactorVariable, diagnosticsOutcomeVariable]);

  const diagnosticsOutcomeMeta =
    variables.find((variable) => variable.name === diagnosticsOutcomeVariable) || null;
  const diagnosticsFactorMeta =
    variables.find((variable) => variable.name === diagnosticsFactorVariable) || null;

  const distributionDiagnostics = useMemo(
    () => diagnosticsVariables.map((variable) => computeDistributionDiagnostics(activeRows, variable)),
    [activeRows, diagnosticsVariables]
  );

  const varianceHomogeneityResult = useMemo(
    () =>
      diagnosticsOutcomeMeta &&
      diagnosticsFactorMeta &&
      diagnosticsOutcomeMeta.name !== diagnosticsFactorMeta.name
        ? computeVarianceHomogeneity(
            activeRows,
            diagnosticsOutcomeMeta,
            diagnosticsFactorMeta,
            varianceTestCenter
          )
        : null,
    [
      activeRows,
      diagnosticsOutcomeMeta,
      diagnosticsFactorMeta,
      varianceTestCenter,
    ]
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

    if (anovaMode === "factorial" || anovaMode === "ancova") {
      const result = generalLinearAnovaResult;
      if (!result || result.issue || result.effects.length === 0 || result.dfResidual === null) return null;
      return {
        title: anovaMode === "ancova" ? "Table · ANCOVA" : "Table · Factorial ANOVA",
        subtitle: `${result.outcomeLabel} · ${result.factors.map((factor) => factor.label).join(" × ")}${result.covariates.length > 0 ? ` · adjusted for ${result.covariates.map((covariate) => covariate.label).join(", ")}` : ""}`,
        headers: ["Effect", "SS", "df", "MS", "F", "p", "ηp²"],
        rows: [
          ...result.effects.map((effect) => [
            effect.label,
            formatNumber(effect.ss, 3),
            formatNumber(effect.df1, 0),
            formatNumber(effect.ms, 3),
            formatNumber(effect.f, 3),
            formatPValue(effect.pValue),
            formatNumber(effect.partialEtaSquared, 3),
          ]),
          [
            "Residual",
            formatNumber(result.ssResidual, 3),
            formatNumber(result.dfResidual, 0),
            result.dfResidual > 0 && result.ssResidual !== null ? formatNumber(result.ssResidual / result.dfResidual, 3) : "—",
            "—",
            "—",
            "—",
          ],
        ],
        note: `${anovaMode === "ancova" ? "ANCOVA" : "Factorial ANOVA"} fitted as a general linear model with sum-to-zero factor coding and Type III-style partial F tests. ${result.includeInteractions ? "All two-way interactions among selected factors are included." : "Factor interactions are not included."}${result.covariates.length > 0 ? " Covariates are mean-centred." : ""}`,
      };
    }

    const result = repeatedMeasuresAnovaResult;
    if (!result || result.f === null || result.df1 === null || result.df2 === null) return null;
    const sphericity = result.sphericity;
    return {
      title: "Table · Repeated-measures ANOVA",
      subtitle: anovaRepeatedMeta.map((variable) => variable.label).join(" · "),
      headers: ["Correction", "ε", "df₁", "df₂", "F", "p", "ηp²", "ηG²"],
      rows: [
        [
          "Sphericity assumed",
          "1.000",
          formatNumber(result.df1, 2),
          formatNumber(result.df2, 2),
          formatNumber(result.f, 3),
          formatPValue(result.pValue),
          formatNumber(result.partialEtaSquared, 3),
          formatNumber(result.generalizedEtaSquared, 3),
        ],
        [
          "Greenhouse–Geisser",
          formatNumber(sphericity.greenhouseGeisserEpsilon, 3),
          formatNumber(sphericity.greenhouseGeisserDf1, 2),
          formatNumber(sphericity.greenhouseGeisserDf2, 2),
          formatNumber(result.f, 3),
          formatPValue(sphericity.greenhouseGeisserPValue),
          formatNumber(result.partialEtaSquared, 3),
          formatNumber(result.generalizedEtaSquared, 3),
        ],
        [
          "Huynh–Feldt",
          formatNumber(sphericity.huynhFeldtEpsilon, 3),
          formatNumber(sphericity.huynhFeldtDf1, 2),
          formatNumber(sphericity.huynhFeldtDf2, 2),
          formatNumber(result.f, 3),
          formatPValue(sphericity.huynhFeldtPValue),
          formatNumber(result.partialEtaSquared, 3),
          formatNumber(result.generalizedEtaSquared, 3),
        ],
      ],
      note: `Complete-case one-factor repeated-measures ANOVA. Mauchly's test: W = ${formatNumber(sphericity.mauchlyW, 3)}, χ²(${formatNumber(sphericity.mauchlyDf, 0)}) = ${formatNumber(sphericity.mauchlyChiSquare, 3)}, p = ${formatPValue(sphericity.mauchlyPValue)}. Greenhouse–Geisser and Huynh–Feldt rows retain the same F statistic and adjust the degrees of freedom used for inference. Pairwise follow-ups use paired t-tests with Holm adjustment.`,
    };
  }

  function anovaMarginalMeansTableSpec(): FormattedTableSpec | null {
    if (anovaMode !== "factorial" && anovaMode !== "ancova") return null;
    const result = generalLinearAnovaResult;
    if (!result || result.issue || result.marginalMeans.length === 0) return null;
    return {
      title: "Table · Estimated marginal means",
      subtitle: result.outcomeLabel,
      headers: ["Factor", "Level", "Observed N", "Raw mean", "Adjusted mean", "SE", "95% CI"],
      rows: result.marginalMeans.map((mean) => [
        mean.factorLabel,
        mean.level,
        String(mean.observedN),
        formatNumber(mean.rawMean, 3),
        formatNumber(mean.adjustedMean, 3),
        formatNumber(mean.se, 3),
        `${formatNumber(mean.ci95Low, 3)}, ${formatNumber(mean.ci95High, 3)}`,
      ]),
      note: `Estimated marginal means average equally across the levels of the other selected factors.${result.covariates.length > 0 ? " Covariates are held at their sample means." : ""}`,
    };
  }

  function anovaSphericityTableSpec(): FormattedTableSpec | null {
    const result = repeatedMeasuresAnovaResult;
    if (!result || anovaMode !== "repeated") return null;
    const sphericity = result.sphericity;
    if (!sphericity.applicable && result.conditionCount !== 2) return null;
    return {
      title: "Table · Sphericity diagnostics",
      subtitle: anovaRepeatedMeta.map((variable) => variable.label).join(" · "),
      headers: ["Diagnostic", "Value", "df", "p"],
      rows: [
        ["Mauchly's W", formatNumber(sphericity.mauchlyW, 3), formatNumber(sphericity.mauchlyDf, 0), formatPValue(sphericity.mauchlyPValue)],
        ["Greenhouse–Geisser ε", formatNumber(sphericity.greenhouseGeisserEpsilon, 3), "—", "—"],
        ["Huynh–Feldt ε", formatNumber(sphericity.huynhFeldtEpsilon, 3), "—", "—"],
        ["Lower-bound ε", formatNumber(sphericity.lowerBoundEpsilon, 3), "—", "—"],
      ],
      note: result.conditionCount === 2
        ? "With two repeated conditions, sphericity is necessarily satisfied and ε = 1."
        : "Mauchly's test evaluates sphericity. A small p-value indicates evidence against sphericity; epsilon corrections reduce the inferential degrees of freedom without changing F.",
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

    if (anovaMode !== "repeated") return null;

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

  function nonParametricTableSpec(): FormattedTableSpec | null {
    if (nonParametricMode === "mannwhitney") {
      const result = mannWhitneyResult;
      if (!result || result.issue || result.u === null) return null;
      return {
        title: "Table · Mann–Whitney U test",
        subtitle: `${result.outcomeLabel} by ${result.groupVariableLabel}`,
        headers: ["Comparison", "n₁", "n₂", "Median₁", "Median₂", "Mean rank₁", "Mean rank₂", "U", "z", "p", "Rank-biserial r"],
        rows: [[
          `${result.groupA} vs ${result.groupB}`,
          String(result.nA),
          String(result.nB),
          formatNumber(result.medianA, 3),
          formatNumber(result.medianB, 3),
          formatNumber(result.meanRankA, 2),
          formatNumber(result.meanRankB, 2),
          formatNumber(result.u, 2),
          formatNumber(result.z, 3),
          formatPValue(result.pValue),
          formatNumber(result.rankBiserial, 3),
        ]],
        note: `Two-sided Mann–Whitney U test using average ranks for ties and a continuity-corrected asymptotic normal approximation. Rank-biserial sign follows ${result.groupA} relative to ${result.groupB}.`,
      };
    }

    if (nonParametricMode === "wilcoxon") {
      const result = wilcoxonResult;
      if (!result || result.issue || result.w === null) return null;
      return {
        title: "Table · Wilcoxon signed-rank test",
        subtitle: `${result.variableALabel} paired with ${result.variableBLabel}`,
        headers: ["Pair", "Complete pairs", "Non-zero pairs", "Median difference", "W", "z", "p", "Rank-biserial r"],
        rows: [[
          `${result.variableALabel} − ${result.variableBLabel}`,
          String(result.completePairs),
          String(result.nonZeroPairs),
          formatNumber(result.medianDifference, 3),
          formatNumber(result.w, 2),
          formatNumber(result.z, 3),
          formatPValue(result.pValue),
          formatNumber(result.rankBiserial, 3),
        ]],
        note: `Two-sided Wilcoxon signed-rank test. Zero differences are excluded from the ranked test (${result.zeroDifferences} zero difference${result.zeroDifferences === 1 ? "" : "s"}); p uses a continuity-corrected asymptotic normal approximation.`,
      };
    }

    if (nonParametricMode === "kruskal") {
      const result = kruskalWallisResult;
      if (!result || result.issue || result.h === null || result.df === null) return null;
      return {
        title: "Table · Kruskal–Wallis test",
        subtitle: `${result.outcomeLabel} by ${result.factorLabel}`,
        headers: ["Test", "N", "Groups", "H", "df", "p", "ε²"],
        rows: [[
          "Kruskal–Wallis",
          String(result.totalN),
          String(result.groups.length),
          formatNumber(result.h, 3),
          formatNumber(result.df, 0),
          formatPValue(result.pValue),
          formatNumber(result.epsilonSquared, 3),
        ]],
        note: "Rank-based omnibus comparison with tie correction. ε² is reported as an omnibus effect size. Pairwise follow-ups use Dunn z tests with Holm family-wise adjustment.",
      };
    }

    const result = friedmanResult;
    if (!result || result.issue || result.chiSquare === null || result.df === null) return null;
    return {
      title: "Table · Friedman test",
      subtitle: result.conditions.map((condition) => condition.label).join(" · "),
      headers: ["N", "Conditions", "χ²", "df", "p", "Kendall's W"],
      rows: [[
        String(result.completeCases),
        String(result.conditionCount),
        formatNumber(result.chiSquare, 3),
        formatNumber(result.df, 0),
        formatPValue(result.pValue),
        formatNumber(result.kendallW, 3),
      ]],
      note: "Friedman rank test using participants with complete data across every selected repeated condition. Ties are corrected. Pairwise follow-ups use Wilcoxon signed-rank tests with Holm adjustment.",
    };
  }

  function nonParametricPairwiseTableSpec(): FormattedTableSpec | null {
    if (nonParametricMode === "kruskal") {
      const result = kruskalWallisResult;
      if (!result || result.pairwise.length === 0) return null;
      return {
        title: "Table · Kruskal–Wallis pairwise comparisons",
        subtitle: `${result.outcomeLabel} by ${result.factorLabel}`,
        headers: ["Comparison", "Mean-rank difference", "z", "p", "Holm p"],
        rows: result.pairwise.map((comparison) => [
          `${comparison.groupA} − ${comparison.groupB}`,
          formatNumber(comparison.meanRankDifference, 3),
          formatNumber(comparison.z, 3),
          formatPValue(comparison.pValue),
          formatPValue(comparison.pAdjusted),
        ]),
        note: "Dunn pairwise comparisons with tie-corrected rank variance and Holm step-down adjustment across all reported pairs.",
      };
    }

    if (nonParametricMode === "friedman") {
      const result = friedmanResult;
      if (!result || result.pairwise.length === 0) return null;
      return {
        title: "Table · Friedman pairwise comparisons",
        subtitle: "Selected repeated conditions",
        headers: ["Comparison", "Non-zero pairs", "W", "z", "p", "Holm p", "Rank-biserial r"],
        rows: result.pairwise.map((comparison) => [
          `${comparison.variableALabel} − ${comparison.variableBLabel}`,
          String(comparison.n),
          formatNumber(comparison.w, 2),
          formatNumber(comparison.z, 3),
          formatPValue(comparison.pValue),
          formatPValue(comparison.pAdjusted),
          formatNumber(comparison.rankBiserial, 3),
        ]),
        note: "Pairwise Wilcoxon signed-rank follow-ups on the Friedman complete-case sample with Holm family-wise adjustment.",
      };
    }

    return null;
  }

  function cognitiveTableSpec(): FormattedTableSpec | null {
    const result = cognitiveResult;
    if (result.issue) return null;

    if (result.dataLevel === "trial" && result.conditions.length > 0) {
      return {
        title: `Table · Cognitive condition summary — ${result.task}`,
        subtitle: `${result.paradigm === "generic" ? "Generic cognitive recipe" : result.paradigm.replaceAll("_", " ")} · ${result.participantCount} participant${result.participantCount === 1 ? "" : "s"}`,
        headers: ["Condition", "Trials", "Accuracy", "Mean RT", "Median RT", "Omission %", "RT excluded %"],
        rows: result.conditions.map((condition) => [
          condition.condition,
          String(condition.trials),
          formatPercent(condition.accuracy),
          condition.meanRtMs === null ? "—" : `${formatNumber(condition.meanRtMs, 1)} ms`,
          condition.medianRtMs === null ? "—" : `${formatNumber(condition.medianRtMs, 1)} ms`,
          formatPercent(condition.omissionRate),
          formatPercent(condition.rtExclusionRate),
        ]),
        note: `RT summaries use ${cognitiveCorrectRtOnly ? "correct trials only" : "all trials with an RT"} and retain RTs from ${formatNumber(cognitiveRtMin, 0)}–${formatNumber(cognitiveRtMax, 0)} ms. Screening settings flag participants only; PsyLattice does not automatically exclude them.`,
      };
    }

    if (result.taskMetrics.length > 0) {
      return {
        title: `Table · Cognitive task summary — ${result.task}`,
        subtitle: `${result.paradigm === "generic" ? "Generic cognitive recipe" : result.paradigm.replaceAll("_", " ")} · ${result.participantCount} participant${result.participantCount === 1 ? "" : "s"}`,
        headers: ["Metric", "Value"],
        rows: result.taskMetrics.map((metric) => [
          metric.label,
          formatCognitiveMetric(metric.value, metric.unit),
        ]),
        note: result.dataLevel === "participant_summary"
          ? "Participant-summary metrics are aggregated across the selected PsyLattice task records. Task-specific scores remain the values produced by the task scoring pipeline."
          : "Task-aware metrics are derived from the standardized PsyLattice cognitive trial schema and task-specific runtime fields when available.",
      };
    }

    return {
      title: `Table · Cognitive overview — ${result.task}`,
      subtitle: `${result.participantCount} participant${result.participantCount === 1 ? "" : "s"}`,
      headers: ["Participants", "Trials / records", "Accuracy", "Median RT", "Omission %", "Flagged participants"],
      rows: [[
        String(result.participantCount),
        String(result.trialCount || result.rowCount),
        formatPercent(result.accuracy),
        result.medianRtMs === null ? "—" : `${formatNumber(result.medianRtMs, 1)} ms`,
        formatPercent(result.omissionRate),
        String(result.flaggedParticipantCount),
      ]],
      note: "PsyLattice-native cognitive overview. Screening flags support review and do not automatically remove participants.",
    };
  }

  function cognitiveEffectsTableSpec(): FormattedTableSpec | null {
    const result = cognitiveResult;
    if (result.issue || result.conditionEffects.length === 0) return null;
    return {
      title: `Table · Cognitive condition effects — ${result.task}`,
      subtitle: `Reference condition: ${result.referenceCondition || "—"}`,
      headers: ["Comparison", "RT pairs", "Δ RT (ms)", "t", "Holm p", "dz", "Accuracy pairs", "Δ accuracy", "t", "Holm p", "dz"],
      rows: result.conditionEffects.map((effect) => [
        `${effect.condition} − ${effect.referenceCondition}`,
        String(effect.participantPairsRt),
        formatNumber(effect.meanRtDifferenceMs, 1),
        formatNumber(effect.rtT, 3),
        formatPValue(effect.rtPAdjusted),
        formatNumber(effect.rtCohenDz, 3),
        String(effect.participantPairsAccuracy),
        formatPercent(effect.meanAccuracyDifference),
        formatNumber(effect.accuracyT, 3),
        formatPValue(effect.accuracyPAdjusted),
        formatNumber(effect.accuracyCohenDz, 3),
      ]),
      note: "Condition effects are participant-level paired differences versus the selected reference condition. RT effects use each participant's retained mean RT; accuracy effects use participant condition accuracy. Reported p-values use Holm adjustment separately across RT and accuracy comparisons.",
    };
  }

  function cognitiveScreeningTableSpec(): FormattedTableSpec | null {
    const result = cognitiveResult;
    if (result.issue || result.participants.length === 0) return null;
    return {
      title: `Table · Cognitive participant screening — ${result.task}`,
      subtitle: `${result.flaggedParticipantCount} flagged of ${result.participantCount}`,
      headers: ["Participant", "Trials", "Accuracy", "Median RT", "Omission %", "RT excluded %", "Flags"],
      rows: result.participants.map((participant) => [
        participant.participant,
        String(participant.trials),
        formatPercent(participant.accuracy),
        participant.medianRtMs === null ? "—" : `${formatNumber(participant.medianRtMs, 1)} ms`,
        formatPercent(participant.omissionRate),
        formatPercent(participant.rtExclusionRate),
        participant.flags.length ? participant.flags.join("; ") : "—",
      ]),
      note: `Flags use the current review thresholds: ≥ ${cognitiveMinTrials} scorable trials, accuracy ≥ ${formatPercent(cognitiveMinAccuracy)}, omissions ≤ ${formatPercent(cognitiveMaxOmissionRate)}, and RT exclusions ≤ ${formatPercent(cognitiveMaxRtExclusionRate)}. Existing task quality flags are also surfaced. No participant is automatically excluded.`,
    };
  }

  function cognitiveTaskMetricsTableSpec(): FormattedTableSpec | null {
    const result = cognitiveResult;
    if (result.issue || result.taskMetrics.length === 0) return null;
    return {
      title: `Table · Task-specific cognitive metrics — ${result.task}`,
      subtitle: result.paradigm.replaceAll("_", " ") || "generic",
      headers: ["Metric", "Value", "Notes"],
      rows: result.taskMetrics.map((metric) => [
        metric.label,
        formatCognitiveMetric(metric.value, metric.unit),
        metric.note || "—",
      ]),
      note: "Task-specific metrics use PsyLattice task scoring fields when available and standardized trial/event fields for reusable generic summaries.",
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


  function factorLoadingsTableSpec(): FormattedTableSpec | null {
    const result = factorResult;
    if (!result || result.issue || result.items.length < 3) return null;
    const orderedItems = factorSortLoadings
      ? [...result.items].sort((left, right) => {
          const factorDelta = (left.strongestFactor ?? 999) - (right.strongestFactor ?? 999);
          if (factorDelta !== 0) return factorDelta;
          return Math.abs(right.strongestLoading ?? 0) - Math.abs(left.strongestLoading ?? 0);
        })
      : result.items;
    return {
      title: "Table · Exploratory factor loadings",
      subtitle: `${result.extraction === "principal_axis" ? "Principal-axis factoring" : "Principal components"} · ${result.rotation === "promax" ? "Promax" : result.rotation === "varimax" ? "Varimax" : "Unrotated"} · N = ${result.n}`,
      headers: ["Item", ...Array.from({ length: result.factorCount }, (_, index) => `Factor ${index + 1}`), "h²", "u²", "MSA"],
      rows: orderedItems.map((item) => [
        item.label,
        ...item.loadings.map((loading) => Math.abs(loading) < factorLoadingCutoff ? "" : formatNumber(loading, 3)),
        formatNumber(item.communality, 3),
        formatNumber(item.uniqueness, 3),
        formatNumber(item.msa, 3),
      ]),
      note: `Loadings with |λ| < ${factorLoadingCutoff.toFixed(2)} are suppressed for readability. h² = communality; u² = uniqueness; MSA = item-level Kaiser–Meyer–Olkin sampling adequacy. Factor signs are arbitrary and may reverse without changing the solution.`,
    };
  }

  function factorAdequacyTableSpec(): FormattedTableSpec | null {
    const result = factorResult;
    if (!result || result.issue) return null;
    return {
      title: "Table · Factorability diagnostics",
      subtitle: `${result.itemCount} items · N = ${result.n}`,
      headers: ["KMO", "Bartlett χ²", "df", "p", "Determinant", "Kaiser cue", "Extracted factors"],
      rows: [[
        formatNumber(result.kmoOverall, 3),
        formatNumber(result.bartlettChiSquare, 3),
        formatNumber(result.bartlettDf, 0),
        formatPValue(result.bartlettPValue),
        formatNumber(result.determinant, 5),
        String(result.recommendedFactorCount),
        String(result.factorCount),
      ]],
      note: "KMO and Bartlett's test are factorability diagnostics, not automatic approval rules. The Kaiser eigenvalue>1 count is displayed only as a retention cue and should be considered alongside the scree plot and substantive interpretability.",
    };
  }

  function processMainTableSpec(): FormattedTableSpec | null {
    if (processMode === "mediation") {
      const result = mediationResult;
      if (!result || result.issue) return null;
      return {
        title: "Table · Mediation analysis",
        subtitle: `${result.predictorLabel} → ${result.mediatorLabel} → ${result.outcomeLabel} · N = ${result.n}`,
        headers: ["Effect / path", "B", "SE", "t", "p", "95% CI"],
        rows: [
          [result.pathA.label, formatNumber(result.pathA.b, 3), formatNumber(result.pathA.se, 3), formatNumber(result.pathA.t, 3), formatPValue(result.pathA.pValue), `${formatNumber(result.pathA.ci95Low, 3)}, ${formatNumber(result.pathA.ci95High, 3)}`],
          [result.pathB.label, formatNumber(result.pathB.b, 3), formatNumber(result.pathB.se, 3), formatNumber(result.pathB.t, 3), formatPValue(result.pathB.pValue), `${formatNumber(result.pathB.ci95Low, 3)}, ${formatNumber(result.pathB.ci95High, 3)}`],
          [result.totalEffect.label, formatNumber(result.totalEffect.b, 3), formatNumber(result.totalEffect.se, 3), formatNumber(result.totalEffect.t, 3), formatPValue(result.totalEffect.pValue), `${formatNumber(result.totalEffect.ci95Low, 3)}, ${formatNumber(result.totalEffect.ci95High, 3)}`],
          [result.directEffect.label, formatNumber(result.directEffect.b, 3), formatNumber(result.directEffect.se, 3), formatNumber(result.directEffect.t, 3), formatPValue(result.directEffect.pValue), `${formatNumber(result.directEffect.ci95Low, 3)}, ${formatNumber(result.directEffect.ci95High, 3)}`],
          ["Indirect effect · a × b", formatNumber(result.indirectEffect, 3), "Bootstrap", "—", "—", `${formatNumber(result.bootstrapCi95Low, 3)}, ${formatNumber(result.bootstrapCi95High, 3)}`],
        ],
        note: `Indirect-effect CI uses ${result.bootstrapSamplesUsed.toLocaleString()} valid deterministic percentile-bootstrap resamples (${result.bootstrapSamplesRequested.toLocaleString()} requested). Covariates, when selected, are included in all component regressions. Statistical mediation does not by itself establish causality.`,
      };
    }

    const result = moderationResult;
    if (!result || result.issue) return null;
    return {
      title: "Table · Moderation analysis",
      subtitle: `${result.outcomeLabel} · ${result.predictorLabel} × ${result.moderatorLabel} · N = ${result.n}`,
      headers: ["Effect", "B", "SE", "t", "p", "95% CI"],
      rows: [result.predictorEffect, result.moderatorEffect, result.interactionEffect].map((effect) => [
        effect.label, formatNumber(effect.b, 3), formatNumber(effect.se, 3), formatNumber(effect.t, 3), formatPValue(effect.pValue), `${formatNumber(effect.ci95Low, 3)}, ${formatNumber(effect.ci95High, 3)}`
      ]),
      note: `R² = ${formatNumber(result.rSquared, 3)}; ΔR² for X × W = ${formatNumber(result.rSquaredChange, 3)}. ${result.centerPredictors ? "X and W were mean-centered before forming the interaction." : "Raw X and W values were used to form the interaction."} Covariates, when selected, enter the model additively.`,
    };
  }

  function processSimpleSlopesTableSpec(): FormattedTableSpec | null {
    const result = moderationResult;
    if (!result || result.issue || processMode !== "moderation") return null;
    return {
      title: "Table · Moderation simple slopes",
      subtitle: `${result.predictorLabel} predicting ${result.outcomeLabel} across ${result.moderatorLabel}`,
      headers: ["Moderator point", "Moderator value", "B", "SE", "t", "p", "95% CI"],
      rows: result.simpleSlopes.map((slope) => [
        slope.moderatorPoint === "low" ? "Mean − 1 SD" : slope.moderatorPoint === "high" ? "Mean + 1 SD" : "Mean",
        formatNumber(slope.moderatorValue, 3),
        formatNumber(slope.b, 3),
        formatNumber(slope.se, 3),
        formatNumber(slope.t, 3),
        formatPValue(slope.pValue),
        `${formatNumber(slope.ci95Low, 3)}, ${formatNumber(slope.ci95High, 3)}`,
      ]),
      note: "Simple slopes are conditional effects of X at the moderator mean and ±1 SD. They are probing estimates for the fitted interaction model.",
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


  function regressionDiagnosticsTableSpec(): FormattedTableSpec | null {
    const result = linearRegressionResult;
    if (!result || result.issue) return null;
    const diagnostics = result.diagnostics;
    return {
      title: "Table · Regression diagnostics",
      subtitle: `${result.outcomeLabel} · N = ${result.n}`,
      headers: ["Diagnostic", "Statistic", "p / threshold", "Flag"],
      rows: [
        [
          "Residual normality (Jarque–Bera)",
          formatNumber(diagnostics.residualJarqueBera, 3),
          formatPValue(diagnostics.residualJarqueBeraPValue),
          (diagnostics.residualJarqueBeraPValue ?? 1) < 0.05 ? "Review" : "No strong flag",
        ],
        [
          "Heteroscedasticity (Breusch–Pagan / Koenker LM)",
          formatNumber(diagnostics.breuschPaganLm, 3),
          formatPValue(diagnostics.breuschPaganPValue),
          (diagnostics.breuschPaganPValue ?? 1) < 0.05 ? "Review" : "No strong flag",
        ],
        ["Durbin–Watson", formatNumber(diagnostics.durbinWatson, 3), "≈ 2 expected", diagnostics.durbinWatson !== null && (diagnostics.durbinWatson < 1.5 || diagnostics.durbinWatson > 2.5) ? "Review" : "No strong flag"],
        ["Max |standardized residual|", formatNumber(diagnostics.maxAbsoluteStandardizedResidual, 3), "|3| screen", diagnostics.highResidualCount > 0 ? `${diagnostics.highResidualCount} flagged` : "No strong flag"],
        ["Cook's distance", formatNumber(diagnostics.maxCookDistance, 3), `4/N = ${formatNumber(result.n ? 4 / result.n : null, 3)}`, diagnostics.influentialCount > 0 ? `${diagnostics.influentialCount} flagged` : "No strong flag"],
      ],
      note: "Diagnostics are screening tools rather than automatic model-rejection rules. Review residual-vs-fitted, Q–Q and influence plots alongside the statistics.",
    };
  }

  function categoricalContingencyTableSpec(): FormattedTableSpec | null {
    const result = categoricalAssociationResult;
    if (!result || result.issue || result.cells.length === 0) return null;
    const cellMap = new Map(result.cells.map((cell) => [`${cell.rowLevel}\u0000${cell.columnLevel}`, cell]));
    return {
      title: "Table · Contingency table",
      subtitle: `${result.rowVariableLabel} × ${result.columnVariableLabel} · N = ${result.totalN}`,
      headers: [result.rowVariableLabel, ...result.columnLevels, "Total"],
      rows: result.rowLevels.map((rowLevel, rowIndex) => [
        rowLevel,
        ...result.columnLevels.map((columnLevel) => {
          const cell = cellMap.get(`${rowLevel}\u0000${columnLevel}`);
          return cell ? `${cell.observed} (${formatPercent(cell.rowPercent)})` : "0 (0.0%)";
        }),
        String(result.rowTotals[rowIndex]),
      ]),
      note: `Cells show observed count (row %). Missing paired observations = ${result.missingN}. Pearson χ²(${formatNumber(result.df, 0)}) = ${formatNumber(result.chiSquare, 3)}, p ${formatPValue(result.pValue)}, Cramér's V = ${formatNumber(result.cramerV, 3)}.`,
    };
  }

  function categoricalTestsTableSpec(): FormattedTableSpec | null {
    const result = categoricalAssociationResult;
    if (!result || result.issue || result.chiSquare === null) return null;
    const rows: string[][] = [[
      "Pearson χ²",
      formatNumber(result.chiSquare, 3),
      formatNumber(result.df, 0),
      formatPValue(result.pValue),
      result.phi !== null ? `Phi = ${formatNumber(result.phi, 3)}` : `Cramér's V = ${formatNumber(result.cramerV, 3)}`,
    ]];
    if (result.fisherExactPValue !== null) {
      rows.push([
        "Fisher's exact (two-sided)",
        "—",
        "—",
        formatPValue(result.fisherExactPValue),
        result.oddsRatio !== null
          ? `OR = ${formatNumber(result.oddsRatio, 3)} [${formatNumber(result.oddsRatioCi95Low, 3)}, ${formatNumber(result.oddsRatioCi95High, 3)}]`
          : "—",
      ]);
    }
    return {
      title: "Table · Categorical association tests",
      subtitle: `${result.rowVariableLabel} × ${result.columnVariableLabel} · N = ${result.totalN}`,
      headers: ["Test", "Statistic", "df", "p", "Effect size"],
      rows,
      note: `Minimum expected count = ${formatNumber(result.minExpectedCount, 2)}; ${result.expectedBelowFiveCount} of ${result.cells.length} cells (${formatPercent(result.expectedBelowFivePercent)}) have expected counts below 5. Fisher's exact is reported for 2×2 tables. The odds ratio is oriented as (${result.rowLevels[0]} / ${result.rowLevels[1]}) across (${result.columnLevels[0]} / ${result.columnLevels[1]}); a 0.5 continuity correction is used when any cell is zero.`,
    };
  }

  function categoricalCellDiagnosticsTableSpec(): FormattedTableSpec | null {
    const result = categoricalAssociationResult;
    if (!result || result.issue || result.cells.length === 0) return null;
    return {
      title: "Table · Contingency cell diagnostics",
      subtitle: `${result.rowVariableLabel} × ${result.columnVariableLabel}`,
      headers: ["Row", "Column", "Observed", "Expected", "Row %", "Column %", "Adjusted residual"],
      rows: result.cells.map((cell) => [
        cell.rowLevel,
        cell.columnLevel,
        String(cell.observed),
        formatNumber(cell.expected, 2),
        formatPercent(cell.rowPercent),
        formatPercent(cell.columnPercent),
        formatNumber(cell.adjustedResidual, 2),
      ]),
      note: "Adjusted standardized residuals around |1.96| or larger can help locate cells contributing strongly to an association, but they should be interpreted cautiously when many cells are inspected.",
    };
  }

  function mixedCoefficientTableSpec(): FormattedTableSpec | null {
    const result = linearMixedModelResult;
    if (!result || result.issue || result.coefficients.length === 0) return null;
    const randomLabel = result.randomSlopeLabel
      ? `${result.groupLabel} random intercept + ${result.randomSlopeLabel} slope`
      : `${result.groupLabel} random intercept`;
    return {
      title: "Table · Linear mixed-effects model coefficients",
      subtitle: `${result.outcomeLabel} · ${randomLabel} · N = ${result.n}`,
      headers: ["Fixed effect", "B", "SE", "z", "p", "95% CI"],
      rows: result.coefficients.map((coefficient) => [
        coefficient.label,
        formatNumber(coefficient.b, 3),
        formatNumber(coefficient.se, 3),
        formatNumber(coefficient.z, 3),
        formatPValue(coefficient.pValue),
        `${formatNumber(coefficient.ci95Low, 3)}, ${formatNumber(coefficient.ci95High, 3)}`,
      ]),
      note: `${result.estimator.toUpperCase()} linear mixed model with ${result.randomSlopeLabel ? `a correlated random intercept and ${result.randomSlopeLabel} slope` : "a random intercept"}. Clusters = ${result.groupCount}; ICC = ${formatNumber(result.icc, 3)}. Fixed-effect p-values use large-sample Wald z tests.`,
    };
  }

  function mixedModelTableSpec(): FormattedTableSpec | null {
    const result = linearMixedModelResult;
    if (!result || result.issue) return null;
    const headers = [
      "N",
      "Clusters",
      "Estimator",
      "Random-intercept variance",
      ...(result.randomSlopeLabel ? ["Random-slope variance", "Intercept–slope correlation"] : []),
      "Residual variance",
      "ICC",
      "Marginal R²",
      "Conditional R²",
      "Log likelihood",
      "AIC",
      "BIC",
    ];
    const row = [
      String(result.n),
      String(result.groupCount),
      result.estimator.toUpperCase(),
      formatNumber(result.randomInterceptVariance, 3),
      ...(result.randomSlopeLabel
        ? [
            formatNumber(result.randomSlopeVariance, 3),
            formatNumber(result.randomInterceptSlopeCorrelation, 3),
          ]
        : []),
      formatNumber(result.residualVariance, 3),
      formatNumber(result.icc, 3),
      formatNumber(result.marginalR2, 3),
      formatNumber(result.conditionalR2, 3),
      formatNumber(result.logLikelihood, 2),
      formatNumber(result.aic, 2),
      formatNumber(result.bic, 2),
    ];
    return {
      title: "Table · Mixed model fit and variance components",
      subtitle: `${result.outcomeLabel} · grouped by ${result.groupLabel}`,
      headers,
      rows: [row],
      note: result.estimator === "reml"
        ? "REML estimates are shown. AIC/BIC are intentionally omitted for REML in this interface; switch to ML for formal information-criterion comparison. Marginal R² summarizes fixed effects; conditional R² includes the fitted random-effects structure."
        : "Maximum-likelihood estimates. Marginal R² summarizes fixed effects; conditional R² includes the fitted random-effects structure. AIC/BIC can be used when comparing models fit to the same outcome and observations.",
    };
  }

  function generalizedMixedCoefficientTableSpec(): FormattedTableSpec | null {
    const result = generalizedMixedModelResult;
    if (!result || result.issue || result.coefficients.length === 0) return null;
    const ratioLabel = result.family === "binomial" ? "Odds ratio" : "IRR";
    return {
      title: `Table · ${result.family === "binomial" ? "Binary" : "Poisson"} generalized mixed-model coefficients`,
      subtitle: `${result.outcomeLabel} · random intercept for ${result.groupLabel} · N = ${result.n}`,
      headers: ["Fixed effect", "B", "SE", "z", "p", ratioLabel, `95% CI for ${ratioLabel}`],
      rows: result.coefficients.map((coefficient) => [
        coefficient.label,
        formatNumber(coefficient.b, 3),
        formatNumber(coefficient.se, 3),
        formatNumber(coefficient.z, 3),
        formatPValue(coefficient.pValue),
        formatNumber(coefficient.effectRatio, 3),
        `${formatNumber(coefficient.ci95Low, 3)}, ${formatNumber(coefficient.ci95High, 3)}`,
      ]),
      note: `${result.family === "binomial" ? `Event category = ${result.positiveClass}. Odds ratios` : "Incidence-rate ratios"} are exponentiated fixed effects. Random intercept SD = ${formatNumber(result.randomInterceptSd, 3)} across ${result.groupCount} clusters. V1 uses ${result.quadraturePoints}-point Gauss–Hermite quadrature.`,
    };
  }

  function generalizedMixedModelTableSpec(): FormattedTableSpec | null {
    const result = generalizedMixedModelResult;
    if (!result || result.issue) return null;
    return {
      title: `Table · ${result.family === "binomial" ? "Binary" : "Poisson"} generalized mixed-model fit`,
      subtitle: `${result.outcomeLabel} · random intercept for ${result.groupLabel}`,
      headers: ["N", "Clusters", "LR χ²", "df", "p", "Random-intercept variance", "Log likelihood", "AIC", "BIC", ...(result.family === "binomial" ? ["Latent ICC"] : [])],
      rows: [[
        String(result.n),
        String(result.groupCount),
        formatNumber(result.likelihoodRatioChiSquare, 3),
        formatNumber(result.dfModel, 0),
        formatPValue(result.pValue),
        formatNumber(result.randomInterceptVariance, 3),
        formatNumber(result.logLikelihood, 2),
        formatNumber(result.aic, 2),
        formatNumber(result.bic, 2),
        ...(result.family === "binomial" ? [formatNumber(result.latentIcc, 3)] : []),
      ]],
      note: `${result.family === "binomial" ? "Logit-link" : "Log-link"} random-intercept generalized mixed model estimated with ${result.quadraturePoints}-point Gauss–Hermite quadrature.${result.exposureLabel ? ` Exposure = ${result.exposureLabel}.` : ""}`,
    };
  }

  function mixedStructureComparisonTableSpec(): FormattedTableSpec | null {
    const result = linearMixedModelResult;
    const comparison = result?.structureComparison;
    if (!result || result.issue || !comparison) return null;
    return {
      title: "Table · Mixed-model random structure comparison",
      subtitle: `${result.outcomeLabel} · grouped by ${result.groupLabel}`,
      headers: ["Structure", "Log likelihood", "AIC", "BIC", "LR χ²", "df", "p"],
      rows: [
        [
          comparison.baselineLabel,
          formatNumber(comparison.baselineLogLikelihood, 2),
          formatNumber(comparison.baselineAic, 2),
          formatNumber(comparison.baselineBic, 2),
          "—",
          "—",
          "—",
        ],
        [
          comparison.candidateLabel,
          formatNumber(comparison.candidateLogLikelihood, 2),
          formatNumber(comparison.candidateAic, 2),
          formatNumber(comparison.candidateBic, 2),
          formatNumber(comparison.likelihoodRatio, 3),
          formatNumber(comparison.df, 0),
          formatPValue(comparison.pValue),
        ],
      ],
      note: comparison.note || "Compare random structures using ML and substantive reasoning.",
    };
  }

  function logisticCoefficientTableSpec(): FormattedTableSpec | null {
    if (logisticMode === "binary") {
      const result = binaryLogisticResult;
      if (!result || result.issue || result.coefficients.length === 0) return null;
      return {
        title: "Table · Binary logistic regression coefficients",
        subtitle: `${result.outcomeLabel} · event = ${result.positiveClass} · N = ${result.n}`,
        headers: ["Predictor", "B", "SE", "z", "p", "Odds ratio", "95% CI for OR"],
        rows: result.coefficients.map((coefficient) => [
          coefficient.label,
          formatNumber(coefficient.b, 3),
          formatNumber(coefficient.se, 3),
          formatNumber(coefficient.z, 3),
          formatPValue(coefficient.pValue),
          formatNumber(coefficient.oddsRatio, 3),
          `${formatNumber(coefficient.ci95Low, 3)}, ${formatNumber(coefficient.ci95High, 3)}`,
        ]),
        note: `Binary logistic regression models the probability of ${result.outcomeLabel} = ${result.positiveClass}. Categorical predictors use indicator coding with the reference category shown in the coefficient label. Odds ratios are exp(B); confidence intervals use Wald standard errors.`,
      };
    }

    if (logisticMode === "multinomial") {
      const result = multinomialLogisticResult;
      if (!result || result.issue || result.coefficients.length === 0) return null;
      return {
        title: "Table · Multinomial logistic regression coefficients",
        subtitle: `${result.outcomeLabel} · reference = ${result.referenceClass} · N = ${result.n}`,
        headers: ["Outcome comparison", "Predictor", "B", "SE", "z", "p", "Odds ratio", "95% CI for OR"],
        rows: result.coefficients.map((coefficient) => [
          `${coefficient.outcomeClass} vs ${coefficient.referenceClass}`,
          coefficient.label,
          formatNumber(coefficient.b, 3),
          formatNumber(coefficient.se, 3),
          formatNumber(coefficient.z, 3),
          formatPValue(coefficient.pValue),
          formatNumber(coefficient.oddsRatio, 3),
          `${formatNumber(coefficient.ci95Low, 3)}, ${formatNumber(coefficient.ci95High, 3)}`,
        ]),
        note: `Multinomial logistic regression treats ${result.referenceClass} as the outcome reference category. Each odds ratio compares the listed outcome category with ${result.referenceClass}, holding other predictors constant.`,
      };
    }

    const result = ordinalLogisticResult;
    if (!result || result.issue || result.coefficients.length === 0) return null;
    return {
      title: "Table · Ordinal logistic regression coefficients",
      subtitle: `${result.outcomeLabel} · proportional odds · N = ${result.n}`,
      headers: ["Predictor", "B", "SE", "z", "p", "Common odds ratio", "95% CI for OR"],
      rows: result.coefficients.map((coefficient) => [
        coefficient.label,
        formatNumber(coefficient.b, 3),
        formatNumber(coefficient.se, 3),
        formatNumber(coefficient.z, 3),
        formatPValue(coefficient.pValue),
        formatNumber(coefficient.oddsRatio, 3),
        `${formatNumber(coefficient.ci95Low, 3)}, ${formatNumber(coefficient.ci95High, 3)}`,
      ]),
      note: `Outcome order: ${result.orderedLevels.join(" < ")}. Positive B values and odds ratios above 1 indicate higher odds of being in a higher ordered category. The proportional-odds model assumes a common predictor slope across cumulative splits.`,
    };
  }

  function logisticModelTableSpec(): FormattedTableSpec | null {
    if (logisticMode === "binary") {
      const result = binaryLogisticResult;
      if (!result || result.issue || result.logLikelihood === null) return null;
      return {
        title: "Table · Binary logistic regression model fit",
        subtitle: `${result.outcomeLabel} · event = ${result.positiveClass}`,
        headers: ["N", "Events", "LR χ²", "df", "p", "McFadden R²", "Nagelkerke R²", "AIC", "BIC"],
        rows: [[String(result.n), String(result.positiveN), formatNumber(result.likelihoodRatioChiSquare, 3), formatNumber(result.dfModel, 0), formatPValue(result.pValue), formatNumber(result.mcfaddenR2, 3), formatNumber(result.nagelkerkeR2, 3), formatNumber(result.aic, 2), formatNumber(result.bic, 2)]],
        note: "The likelihood-ratio test compares the fitted model with an intercept-only model. McFadden and Nagelkerke values are pseudo-R² measures and should not be interpreted as ordinary least-squares R².",
      };
    }
    if (logisticMode === "multinomial") {
      const result = multinomialLogisticResult;
      if (!result || result.issue || result.logLikelihood === null) return null;
      return {
        title: "Table · Multinomial logistic regression model fit",
        subtitle: `${result.outcomeLabel} · reference = ${result.referenceClass}`,
        headers: ["N", "Outcome levels", "LR χ²", "df", "p", "McFadden R²", "AIC", "BIC"],
        rows: [[String(result.n), String(result.classes.length), formatNumber(result.likelihoodRatioChiSquare, 3), formatNumber(result.dfModel, 0), formatPValue(result.pValue), formatNumber(result.mcfaddenR2, 3), formatNumber(result.aic, 2), formatNumber(result.bic, 2)]],
        note: "The likelihood-ratio test compares the fitted multinomial model with a class-prevalence-only model. McFadden R² is a pseudo-R² and is not directly comparable with ordinary least-squares R².",
      };
    }
    const result = ordinalLogisticResult;
    if (!result || result.issue || result.logLikelihood === null) return null;
    return {
      title: "Table · Ordinal logistic regression model fit",
      subtitle: `${result.outcomeLabel} · proportional odds`,
      headers: ["N", "Ordered levels", "LR χ²", "df", "p", "McFadden R²", "AIC", "BIC"],
      rows: [[String(result.n), String(result.orderedLevels.length), formatNumber(result.likelihoodRatioChiSquare, 3), formatNumber(result.dfModel, 0), formatPValue(result.pValue), formatNumber(result.mcfaddenR2, 3), formatNumber(result.aic, 2), formatNumber(result.bic, 2)]],
      note: `Outcome order: ${result.orderedLevels.join(" < ")}. The likelihood-ratio test compares the fitted proportional-odds model with a thresholds-only model.`,
    };
  }

  function ordinalThresholdsTableSpec(): FormattedTableSpec | null {
    const result = ordinalLogisticResult;
    if (logisticMode !== "ordinal" || !result || result.issue || result.thresholds.length === 0) return null;
    return {
      title: "Table · Ordinal logistic thresholds",
      subtitle: result.outcomeLabel,
      headers: ["Cumulative split", "Threshold"],
      rows: result.thresholds.map((threshold) => [`${threshold.lowerLevel} | ${threshold.upperLevel}`, formatNumber(threshold.estimate, 3)]),
      note: "Thresholds locate the cumulative category boundaries on the model's latent logit scale; they are not predictor effects.",
    };
  }

  function countCoefficientTableSpec(): FormattedTableSpec | null {
    const result = countRegressionResult;
    if (!result || result.issue || result.coefficients.length === 0) return null;
    return {
      title: `Table · ${result.family === "poisson" ? "Poisson" : "Negative-binomial"} regression coefficients`,
      subtitle: `${result.outcomeLabel}${result.exposureLabel ? ` · exposure = ${result.exposureLabel}` : ""} · N = ${result.n}`,
      headers: ["Predictor", "B", "SE", "z", "p", "IRR", "95% CI for IRR"],
      rows: result.coefficients.map((coefficient) => [
        coefficient.label,
        formatNumber(coefficient.b, 3),
        formatNumber(coefficient.se, 3),
        formatNumber(coefficient.z, 3),
        formatPValue(coefficient.pValue),
        formatNumber(coefficient.incidenceRateRatio, 3),
        `${formatNumber(coefficient.ci95Low, 3)}, ${formatNumber(coefficient.ci95High, 3)}`,
      ]),
      note: `${result.family === "poisson" ? "Poisson" : "Negative-binomial NB2"} regression with a log link. Exponentiated coefficients are incidence-rate ratios (IRR).${result.exposureLabel ? ` log(${result.exposureLabel}) is included as an offset, so IRRs describe event rates conditional on exposure.` : ""} Categorical predictors use indicator coding with the reference level shown in the coefficient label.`,
    };
  }

  function countModelTableSpec(): FormattedTableSpec | null {
    const result = countRegressionResult;
    if (!result || result.issue) return null;
    return {
      title: `Table · ${result.family === "poisson" ? "Poisson" : "Negative-binomial"} model fit`,
      subtitle: result.outcomeLabel,
      headers: ["N", "LR χ²", "df", "p", "Deviance", "AIC", "BIC", "Pearson dispersion", ...(result.family === "negative_binomial" ? ["α"] : [])],
      rows: [[
        String(result.n),
        formatNumber(result.likelihoodRatioChiSquare, 3),
        formatNumber(result.dfModel, 0),
        formatPValue(result.pValue),
        formatNumber(result.deviance, 2),
        formatNumber(result.aic, 2),
        formatNumber(result.bic, 2),
        formatNumber(result.pearsonDispersion, 3),
        ...(result.family === "negative_binomial" ? [formatNumber(result.dispersionAlpha, 4)] : []),
      ]],
      note: `The likelihood-ratio test compares the fitted model with an intercept-only model. Pearson dispersion summarizes residual variance relative to the selected count-family variance function. Observed zero rate = ${formatPercent(result.observedZeroRate)}; model-expected zero rate = ${formatPercent(result.expectedZeroRate)}.`,
    };
  }

  function logisticClassificationTableSpec(): FormattedTableSpec | null {
    if (logisticMode === "binary") {
      const result = binaryLogisticResult;
      if (!result || result.issue) return null;
      const classification = result.classification;
      return {
        title: "Table · Binary logistic classification summary",
        subtitle: `Threshold = ${formatNumber(classification.threshold, 2)} · event = ${result.positiveClass}`,
        headers: ["Accuracy", "Sensitivity", "Specificity", "Precision", "F1", "AUC", "Brier score", "TP", "TN", "FP", "FN"],
        rows: [[formatPercent(classification.accuracy), formatPercent(classification.sensitivity), formatPercent(classification.specificity), formatPercent(classification.precision), formatNumber(classification.f1, 3), formatNumber(classification.auc, 3), formatNumber(classification.brierScore, 3), String(classification.truePositive), String(classification.trueNegative), String(classification.falsePositive), String(classification.falseNegative)]],
        note: "Classification metrics use the selected probability threshold. AUC is threshold-independent and is calculated from the rank ordering of fitted probabilities. Classification performance should be evaluated on held-out data for predictive claims.",
      };
    }
    if (logisticMode === "multinomial") {
      const result = multinomialLogisticResult;
      if (!result || result.issue) return null;
      const matrix = result.classification.confusionMatrix;
      return {
        title: "Table · Multinomial classification confusion matrix",
        subtitle: `${result.outcomeLabel} · accuracy = ${formatPercent(result.classification.accuracy)}`,
        headers: ["Observed / predicted", ...result.classes],
        rows: result.classes.map((level, row) => [level, ...result.classes.map((_, column) => String(matrix[row]?.[column] ?? 0))]),
        note: `Macro recall = ${formatNumber(result.classification.macroRecall, 3)}; mean log loss = ${formatNumber(result.classification.logLoss, 3)}. Classification summaries describe the analysed sample and do not replace held-out validation for predictive claims.`,
      };
    }
    const result = ordinalLogisticResult;
    if (!result || result.issue) return null;
    const matrix = result.classification.confusionMatrix;
    return {
      title: "Table · Ordinal logistic classification confusion matrix",
      subtitle: `${result.outcomeLabel} · exact accuracy = ${formatPercent(result.classification.accuracy)}`,
      headers: ["Observed / predicted", ...result.orderedLevels],
      rows: result.orderedLevels.map((level, row) => [level, ...result.orderedLevels.map((_, column) => String(matrix[row]?.[column] ?? 0))]),
      note: `Adjacent-category accuracy = ${formatPercent(result.classification.adjacentAccuracy)}; mean absolute category error = ${formatNumber(result.classification.meanAbsoluteCategoryError, 3)}; log loss = ${formatNumber(result.classification.logLoss, 3)}.`,
    };
  }

  function visualizationTableSpec(): FormattedTableSpec | null {
    if (visualizationMode === "scatter") {
      const result = visualizationScatterResult;
      if (result.issue || result.n < 2) return null;
      const trends = result.groupVariable ? result.groupTrends : [result.overallTrend];
      return {
        title: "Table · Scatterplot summary",
        subtitle: `${result.yLabel} by ${result.xLabel}${result.groupLabel ? ` · ${result.groupLabel}` : ""}`,
        headers: [result.groupLabel ? "Group" : "Sample", "N", "Slope", "Intercept", "r"],
        rows: trends.map((trend) => [trend.group, String(trend.n), formatNumber(trend.slope, 4), formatNumber(trend.intercept, 4), formatNumber(trend.r, 3)]),
        note: "Trend lines are ordinary least-squares straight lines. The plot display may thin very large point clouds for rendering, but summary calculations use all complete observations.",
      };
    }

    if (visualizationMode === "box" || visualizationMode === "violin") {
      const result = visualizationDistributionResult;
      if (result.issue || result.groups.length === 0) return null;
      return {
        title: `Table · ${visualizationMode === "box" ? "Box-plot" : "Distribution-plot"} summary`,
        subtitle: `${result.outcomeLabel}${result.groupLabel ? ` by ${result.groupLabel}` : ""}`,
        headers: [result.groupLabel ? "Group" : "Sample", "N", "Mean", "SD", "Median", "Q1", "Q3", "Whisker low", "Whisker high", "Outliers"],
        rows: result.groups.map((group) => [group.group, String(group.n), formatNumber(group.mean, 3), formatNumber(group.sd, 3), formatNumber(group.median, 3), formatNumber(group.q1, 3), formatNumber(group.q3, 3), formatNumber(group.whiskerLow, 3), formatNumber(group.whiskerHigh, 3), String(group.outliers.length)]),
        note: "Box-plot whiskers use Tukey 1.5×IQR fences. Violin density is a descriptive kernel-density estimate and does not alter the underlying observations.",
      };
    }

    if (visualizationMode === "means") {
      const result = visualizationMeansResult;
      if (result.issue || result.points.length === 0) return null;
      return {
        title: "Table · Grouped means",
        subtitle: `${result.outcomeLabel} by ${result.groupLabel}`,
        headers: [result.groupLabel, "N", "Mean", "SD", "SE", "95% CI low", "95% CI high"],
        rows: result.points.map((point) => [point.group, String(point.n), formatNumber(point.mean, 3), formatNumber(point.sd, 3), formatNumber(point.se, 3), formatNumber(point.ci95Low, 3), formatNumber(point.ci95High, 3)]),
        note: "Confidence intervals are two-sided 95% Student t intervals for each observed group mean.",
      };
    }

    const result = visualizationInteractionResult;
    if (result.issue || result.cells.length === 0) return null;
    return {
      title: "Table · Interaction plot summary",
      subtitle: `${result.outcomeLabel} · ${result.xFactorLabel} × ${result.traceFactorLabel}`,
      headers: [result.xFactorLabel, result.traceFactorLabel, "N", "Mean", "SD", "SE", "95% CI low", "95% CI high"],
      rows: result.cells.map((cell) => [cell.xLevel, cell.traceLevel, String(cell.n), formatNumber(cell.mean, 3), formatNumber(cell.sd, 3), formatNumber(cell.se, 3), formatNumber(cell.ci95Low, 3), formatNumber(cell.ci95High, 3)]),
      note: "The interaction plot is descriptive: lines connect observed cell means and should not be treated as a formal interaction test. Use factorial ANOVA/ANCOVA or a suitable regression/mixed model for inference.",
    };
  }

  function diagnosticsTableSpec(): FormattedTableSpec | null {
    if (diagnosticsMode === "homogeneity") {
      const result = varianceHomogeneityResult;
      if (!result || result.issue || result.f === null) return null;
      return {
        title: `Table · ${result.center === "median" ? "Brown–Forsythe" : "Levene"} variance test`,
        subtitle: sourceLabel,
        headers: ["Outcome", "Factor", "F", "df1", "df2", "p", "N", "Groups"],
        rows: [[
          result.outcomeLabel,
          result.factorLabel,
          formatNumber(result.f, 3),
          formatNumber(result.df1, 0),
          formatNumber(result.df2, 0),
          formatPValue(result.pValue),
          String(result.totalN),
          String(result.groupCount),
        ]],
        note:
          result.center === "median"
            ? "Brown–Forsythe variance-homogeneity test using absolute deviations from each group median. A small p-value indicates evidence of unequal group variances."
            : "Classical Levene variance-homogeneity test using absolute deviations from each group mean. A small p-value indicates evidence of unequal group variances.",
      };
    }

    if (distributionDiagnostics.length === 0) return null;
    return {
      title: "Table · Distribution diagnostics",
      subtitle: sourceLabel,
      headers: ["Variable", "N", "JB", "p", "Skewness", "Excess kurtosis", "IQR outliers", "Extreme outliers"],
      rows: distributionDiagnostics.map((result) => [
        result.label,
        String(result.n),
        formatNumber(result.jarqueBera, 3),
        formatPValue(result.jarqueBeraPValue),
        formatNumber(result.skewness, 3),
        formatNumber(result.kurtosisExcess, 3),
        String(result.iqrOutlierCount),
        String(result.extremeOutlierCount),
      ]),
      note: "Jarque–Bera is an omnibus normality diagnostic based on skewness and kurtosis and is reported for N ≥ 8. Outliers use Tukey 1.5×IQR fences; extreme outliers use 3×IQR fences. Q–Q plots and histograms should be reviewed alongside test statistics.",
    };
  }

  function sampleAuditTableSpec(): FormattedTableSpec {
    return {
      title: "Table · Analysis sample audit",
      subtitle: sourceLabel,
      headers: ["Stage", "Rows", "Change"],
      rows: [
        ["Source dataset", String(sampleAudit.sourceRows), "—"],
        ["Current working view", String(sampleAudit.workingRows), sampleAudit.sourceRows === sampleAudit.workingRows ? "0" : String(sampleAudit.workingRows - sampleAudit.sourceRows)],
        ["After explicit filters", String(sampleAudit.afterFiltersRows), sampleAudit.explicitlyExcludedRows ? `−${sampleAudit.explicitlyExcludedRows}` : "0"],
        ["Complete across current setup", String(sampleAudit.completeAcrossSetupRows), sampleAudit.incompleteAcrossSetupRows ? `−${sampleAudit.incompleteAcrossSetupRows}` : "0"],
      ],
      note: currentAnalysisVariables.length > 0
        ? `Current setup variables: ${sampleAudit.requiredVariables.map((item) => item.label).join(", ")}. “Complete across current setup” is a reproducibility preview; analyses using pairwise or variable-wise missing-data handling may report a different N.`
        : "No analysis variables are currently selected. Analysis-specific sample sizes remain reported by each statistical procedure.",
    };
  }

  function missingnessVariableTableSpec(): FormattedTableSpec {
    return {
      title: "Table · Missing-data profile",
      subtitle: sourceLabel,
      headers: ["Variable", "Valid", "Missing", "Missing %"],
      rows: missingnessProfile.variables.map((item) => [
        item.label,
        String(item.valid),
        String(item.missing),
        `${formatNumber(item.missingPercent, 1)}%`,
      ]),
      note: `Current filtered analysis view, N = ${missingnessProfile.totalRows}. Missingness is descriptive and does not by itself identify the missing-data mechanism.`,
    };
  }

  function missingnessPatternsTableSpec(): FormattedTableSpec {
    return {
      title: "Table · Missing-data patterns",
      subtitle: sourceLabel,
      headers: ["Pattern", "N", "%", "Observed", "Missing", "Missing variables"],
      rows: missingnessPatterns.patterns.map((pattern, index) => [
        `Pattern ${index + 1}`,
        String(pattern.count),
        `${formatNumber(pattern.percent, 1)}%`,
        String(pattern.observedCount),
        String(pattern.missingCount),
        pattern.missingLabels.length ? pattern.missingLabels.join(", ") : "None",
      ]),
      note: `${missingnessPatterns.variables.length} variables are included in the pattern audit. 1 = observed and 0 = missing internally. ${missingnessPatterns.otherPatternCount > 0 ? `${missingnessPatterns.otherPatternCount} less-common patterns (${missingnessPatterns.otherRowCount} rows) are not shown.` : "All observed patterns are shown."}`,
    };
  }

  function pairwiseAvailabilityTableSpec(): FormattedTableSpec | null {
    if (pairwiseAvailability.variables.length === 0) return null;
    const cellMap = new Map(pairwiseAvailability.cells.map((cell) => [`${cell.rowVariable}|||${cell.columnVariable}`, cell]));
    return {
      title: "Table · Pairwise available sample size",
      subtitle: sourceLabel,
      headers: ["Variable", ...pairwiseAvailability.variables.map((variable) => variable.label)],
      rows: pairwiseAvailability.variables.map((rowVariable) => [
        rowVariable.label,
        ...pairwiseAvailability.variables.map((columnVariable) => String(cellMap.get(`${rowVariable.name}|||${columnVariable.name}`)?.n ?? 0)),
      ]),
      note: `Each cell is the number of rows with non-missing values on both variables in the current filtered analysis view (N = ${pairwiseAvailability.totalRows}).`,
    };
  }

  async function copyTableSpec(spec: FormattedTableSpec | null, status = "Formatted table copied") {
    if (!spec) return;
    await writeFormattedTableToClipboard(spec);
    setCopyStatus(status);
    window.setTimeout(() => setCopyStatus(""), 1900);
  }

  function powerTableSpec(): FormattedTableSpec | null {
    if (powerResult.issue || powerResult.sampleSize === null || powerResult.achievedPower === null) return null;
    const testLabel = powerResult.test === "independent_t"
      ? "Independent-samples t test"
      : powerResult.test === "paired_t"
        ? "Paired / one-sample t test"
        : powerResult.test === "correlation"
          ? "Correlation"
          : "One-way ANOVA";
    return {
      title: "Table · Power and sample-size analysis",
      subtitle: testLabel,
      headers: ["Setting", "Value"],
      rows: [
        ["Analysis", powerResult.mode === "apriori" ? "A priori sample-size planning" : "Achieved power"],
        ["Effect size", `${powerResult.test === "correlation" ? "r" : powerResult.test === "one_way_anova" ? "Cohen f" : "Cohen d"} = ${formatNumber(powerResult.effectSize, 3)}`],
        ["Alpha", formatNumber(powerResult.alpha, 3)],
        ...(powerResult.tails ? [["Tails", powerResult.tails === "two" ? "Two-sided" : "One-sided"]] : []),
        ...(powerResult.groups ? [["Groups", String(powerResult.groups)]] : []),
        ...(powerResult.targetPower !== null ? [["Target power", formatNumber(powerResult.targetPower, 3)]] : []),
        ["Total sample size", String(powerResult.sampleSize)],
        ...(powerResult.sampleSizePerGroup !== null ? [["Approx. per group", String(powerResult.sampleSizePerGroup)]] : []),
        ...(powerResult.mode === "apriori" && powerLossRate > 0 ? [["Recruitment target after expected loss", String(Math.ceil(powerResult.sampleSize / Math.max(0.01, 1 - powerLossRate)))]] : []),
        ["Estimated power", formatNumber(powerResult.achievedPower, 3)],
        ["Planning method", powerResult.methodLabel],
      ],
      note: powerResult.test === "one_way_anova"
        ? "One-way ANOVA power uses a noncentral-F calculation under a fixed-effects omnibus model. Sample allocation is assumed approximately balanced across groups."
        : "T-test and correlation planning use a large-sample normal approximation. These utilities are intended for study planning and sensitivity checks; design effects, attrition, clustering and multiple-testing plans may require additional inflation.",
    };
  }

  function activePrimaryTableSpec(): FormattedTableSpec | null {
    return activeAnalysis === "cognitive"
      ? cognitiveTableSpec()
      : activeAnalysis === "visualizations"
        ? visualizationTableSpec()
      : activeAnalysis === "diagnostics"
        ? diagnosticsTableSpec()
      : activeAnalysis === "correlations"
        ? correlationTableSpec()
      : activeAnalysis === "ttests"
        ? tTestTableSpec()
        : activeAnalysis === "nonparametric"
          ? nonParametricTableSpec()
        : activeAnalysis === "categorical"
          ? categoricalContingencyTableSpec()
        : activeAnalysis === "anova"
          ? anovaTableSpec()
          : activeAnalysis === "regression"
            ? regressionCoefficientTableSpec()
            : activeAnalysis === "process"
              ? processMainTableSpec()
            : activeAnalysis === "mixed"
              ? mixedFamily === "gaussian" ? mixedCoefficientTableSpec() : generalizedMixedCoefficientTableSpec()
            : activeAnalysis === "logistic"
              ? logisticCoefficientTableSpec()
            : activeAnalysis === "count"
              ? countCoefficientTableSpec()
              : activeAnalysis === "reliability"
              ? reliabilityTableSpec()
              : activeAnalysis === "factor"
                ? factorLoadingsTableSpec()
                : activeAnalysis === "power"
                  ? powerTableSpec()
                  : descriptiveTableSpec();
  }

  function activeAnalysisLabel() {
    if (activeAnalysis === "visualizations") return `Visualizations · ${visualizationMode}`;
    if (activeAnalysis === "diagnostics") return `Diagnostics · ${diagnosticsMode}`;
    if (activeAnalysis === "correlations") return `Correlations · ${correlationMethod}`;
    if (activeAnalysis === "ttests") return `T-tests · ${tTestMode}`;
    if (activeAnalysis === "nonparametric") return `Non-parametric · ${nonParametricMode}`;
    if (activeAnalysis === "categorical") return "Categorical association";
    if (activeAnalysis === "anova") return `ANOVA · ${anovaMode}`;
    if (activeAnalysis === "regression") return "Linear regression";
    if (activeAnalysis === "process") return processMode === "mediation" ? "Mediation" : "Moderation";
    if (activeAnalysis === "mixed") return `Mixed models · ${mixedFamily}`;
    if (activeAnalysis === "logistic") return `Categorical regression · ${logisticMode}`;
    if (activeAnalysis === "count") return `Count regression · ${countFamily}`;
    if (activeAnalysis === "reliability") return "Reliability";
    if (activeAnalysis === "factor") return "Exploratory factor analysis";
    if (activeAnalysis === "power") return `Power & sample size · ${powerMode}`;
    if (activeAnalysis === "cognitive") return "Cognitive analysis";
    return "Descriptives";
  }

  function activeSupplementaryTableSpecs(): FormattedTableSpec[] {
    const specs: Array<FormattedTableSpec | null> = [];

    if (activeAnalysis === "cognitive") {
      specs.push(cognitiveEffectsTableSpec(), cognitiveTaskMetricsTableSpec(), cognitiveScreeningTableSpec());
    } else if (activeAnalysis === "nonparametric") {
      specs.push(nonParametricPairwiseTableSpec());
    } else if (activeAnalysis === "categorical") {
      specs.push(categoricalTestsTableSpec(), categoricalCellDiagnosticsTableSpec());
    } else if (activeAnalysis === "anova") {
      specs.push(anovaMarginalMeansTableSpec(), anovaSphericityTableSpec(), anovaPairwiseTableSpec());
      if (anovaMode === "between" && oneWayVarianceDiagnostics && !oneWayVarianceDiagnostics.issue && oneWayVarianceDiagnostics.f !== null) {
        specs.push({
          title: "Table · One-way ANOVA variance diagnostic",
          subtitle: sourceLabel,
          headers: ["Diagnostic", "F", "df₁", "df₂", "p", "N", "Groups", "Estimator"],
          rows: [[
            "Brown–Forsythe",
            formatNumber(oneWayVarianceDiagnostics.f, 3),
            formatNumber(oneWayVarianceDiagnostics.df1, 0),
            formatNumber(oneWayVarianceDiagnostics.df2, 0),
            formatPValue(oneWayVarianceDiagnostics.pValue),
            String(oneWayVarianceDiagnostics.totalN),
            String(oneWayVarianceDiagnostics.groupCount),
            anovaEstimator === "welch" ? "Welch" : "Standard",
          ]],
          note: "Brown–Forsythe is an embedded variance-homogeneity screen. It is retained with the saved analysis record so the estimator decision can be audited later.",
        });
      }
    } else if (activeAnalysis === "regression") {
      specs.push(regressionModelTableSpec(), regressionDiagnosticsTableSpec());
    } else if (activeAnalysis === "process") {
      specs.push(processSimpleSlopesTableSpec());
    } else if (activeAnalysis === "mixed") {
      specs.push(mixedFamily === "gaussian" ? mixedModelTableSpec() : generalizedMixedModelTableSpec());
      if (mixedFamily === "gaussian") specs.push(mixedStructureComparisonTableSpec());
    } else if (activeAnalysis === "logistic") {
      specs.push(logisticModelTableSpec(), logisticClassificationTableSpec());
      if (logisticMode === "ordinal") specs.push(ordinalThresholdsTableSpec());
    } else if (activeAnalysis === "count") {
      specs.push(countModelTableSpec());
    } else if (activeAnalysis === "reliability") {
      specs.push(reliabilitySummaryTableSpec());
    } else if (activeAnalysis === "factor") {
      specs.push(factorAdequacyTableSpec());
    }

    return specs.filter((spec): spec is FormattedTableSpec => Boolean(spec));
  }

  function activeSetupSnapshot(): Record<string, unknown> {
    const common = { selectedVariables: [...selectedVariables] };
    if (activeAnalysis === "descriptives") return { ...common, options: { ...options }, showFrequencies };
    if (activeAnalysis === "visualizations") return { mode: visualizationMode, x: visualizationXVariable, y: visualizationYVariable, outcome: visualizationOutcomeVariable, group: visualizationGroupVariable, trace: visualizationTraceVariable, showTrend: visualizationShowTrend, showCI: visualizationShowCI };
    if (activeAnalysis === "diagnostics") return { ...common, mode: diagnosticsMode, outcome: diagnosticsOutcomeVariable, factor: diagnosticsFactorVariable, varianceCenter: varianceTestCenter };
    if (activeAnalysis === "correlations") return { ...common, method: correlationMethod, showN: showCorrelationN, showP: showCorrelationP };
    if (activeAnalysis === "ttests") return { mode: tTestMode, estimator: tTestEstimator, outcome: tOutcomeVariable, group: tGroupVariable, groupA: tGroupA, groupB: tGroupB, pairedA: pairedVariableA, pairedB: pairedVariableB };
    if (activeAnalysis === "nonparametric") return { mode: nonParametricMode, outcome: npOutcomeVariable, group: npGroupVariable, groupA: npGroupA, groupB: npGroupB, pairedA: npPairedVariableA, pairedB: npPairedVariableB, repeated: [...npRepeatedVariables] };
    if (activeAnalysis === "categorical") return { row: categoricalRowVariable, column: categoricalColumnVariable };
    if (activeAnalysis === "anova") return { mode: anovaMode, estimator: anovaEstimator, outcome: anovaOutcomeVariable, factor: anovaFactorVariable, repeated: [...anovaRepeatedVariables], factors: [...anovaFactors], covariates: [...anovaCovariates], includeInteractions: anovaIncludeInteractions };
    if (activeAnalysis === "regression") return { outcome: regressionOutcomeVariable, predictors: [...regressionPredictors] };
    if (activeAnalysis === "process") return { mode: processMode, outcome: processOutcomeVariable, predictor: processPredictorVariable, mediator: processMediatorVariable, moderator: processModeratorVariable, covariates: [...processCovariates], bootstrapSamples: processBootstrapSamples, centerPredictors: processCenterPredictors };
    if (activeAnalysis === "mixed") return { family: mixedFamily, outcome: mixedOutcomeVariable, cluster: mixedGroupVariable, predictors: [...mixedPredictors], estimator: mixedEstimator, centering: mixedCentering, randomSlope: mixedRandomSlopeVariable, positiveClass: mixedPositiveClass, exposure: mixedExposureVariable };
    if (activeAnalysis === "logistic") return { mode: logisticMode, outcome: logisticOutcomeVariable, positiveClass: logisticPositiveClass, referenceClass: logisticReferenceClass, ordinalOrder: [...logisticOrdinalOrder], predictors: [...logisticPredictors], threshold: logisticThreshold };
    if (activeAnalysis === "count") return { family: countFamily, outcome: countOutcomeVariable, predictors: [...countPredictors], exposure: countExposureVariable };
    if (activeAnalysis === "reliability") return { ...common, reverseItems: [...reliabilityReverseItems] };
    if (activeAnalysis === "factor") return { ...common, extraction: factorExtraction, rotation: factorRotation, factorCount, loadingCutoff: factorLoadingCutoff, sortLoadings: factorSortLoadings };
    if (activeAnalysis === "power") return { test: powerTest, mode: powerMode, effectSize: powerEffectSize, alpha: powerAlpha, targetPower: powerTarget, sampleSize: powerSampleSize, tails: powerTails, groups: powerGroups, lossRate: powerLossRate };
    if (activeAnalysis === "cognitive") return { task: cognitiveTask, referenceCondition: cognitiveReferenceCondition, rtMin: cognitiveRtMin, rtMax: cognitiveRtMax, correctRtOnly: cognitiveCorrectRtOnly, minTrials: cognitiveMinTrials, minAccuracy: cognitiveMinAccuracy, maxOmissionRate: cognitiveMaxOmissionRate, maxRtExclusionRate: cognitiveMaxRtExclusionRate };
    return common;
  }

  function analysisRecordProvenanceTable(record: SavedAnalysisRecord): FormattedTableSpec {
    const variableLabels = record.variables.map((variable) => variable.label).join(", ") || "None recorded";
    const preparationSteps = record.preparation.filters.length + record.preparation.transforms.length + record.preparation.computed.length + record.preparation.recodes.length + record.preparation.repeated.length;
    return {
      title: "Table · Analysis record",
      subtitle: record.title,
      headers: ["Record field", "Saved value"],
      rows: [
        ["Saved", new Date(record.createdAt).toLocaleString()],
        ["Analysis", record.analysisLabel],
        ["Study", record.source.studyTitle || "Untitled / external"],
        ["Dataset", record.source.datasetLabel],
        ["Working view", record.source.preparedView ? "Prepared" : "Raw"],
        ["Data fingerprint", record.fingerprint],
        ["Source rows", String(record.sample.sourceRows)],
        ["After filters", String(record.sample.afterFiltersRows)],
        ["Complete across setup", String(record.sample.completeAcrossSetupRows)],
        ["Variables", variableLabels],
        ["Explicit filters", String(record.preparation.filters.length)],
        ["Derived / recoded / repeated operations", String(preparationSteps - record.preparation.filters.length)],
      ],
      note: `Record ID ${record.id}. The record stores the analysis configuration and formatted outputs, not raw participant data. Analysis-specific N in the saved result tables remains authoritative when the procedure uses pairwise or variable-wise missing-data handling.`,
    };
  }

  function saveCurrentAnalysisRecord() {
    const primaryTable = activePrimaryTableSpec();
    if (!primaryTable) {
      setCopyStatus("Finish the analysis before saving a record");
      window.setTimeout(() => setCopyStatus(""), 1900);
      return;
    }

    const createdAt = new Date().toISOString();
    const id = `analysis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const analysisLabel = activeAnalysisLabel();
    const record: SavedAnalysisRecord = {
      schemaVersion: 1,
      id,
      createdAt,
      analysis: activeAnalysis,
      analysisLabel,
      title: `${analysisLabel} · ${sourceLabel}`,
      source: {
        mode: sourceMode,
        studyTitle,
        studyId: selectedStudyId,
        datasetLabel: sourceLabel,
        datasetKey: sourceDatasetKey,
        csvName,
        includeTestData,
        identityModeLabel,
        preparedView: preparedViewActive,
        preparationFamily: preparation.familyLabel,
      },
      fingerprint: analysisFingerprint,
      sample: {
        sourceRows: sampleAudit.sourceRows,
        workingRows: sampleAudit.workingRows,
        afterFiltersRows: sampleAudit.afterFiltersRows,
        explicitlyExcludedRows: sampleAudit.explicitlyExcludedRows,
        completeAcrossSetupRows: sampleAudit.completeAcrossSetupRows,
        incompleteAcrossSetupRows: sampleAudit.incompleteAcrossSetupRows,
      },
      variables: currentAnalysisVariables.map((name) => {
        const variable = variables.find((item) => item.name === name);
        return { name, label: variable?.label || name, level: variable?.level || "unknown" };
      }),
      preparation: {
        filters: analysisFilters.map((item) => ({ ...item })),
        transforms: numericTransforms.map((item) => ({ ...item })),
        computed: computedVariables.map((item) => ({ ...item })),
        recodes: recodeDefinitions.map((item) => ({ ...item, mappings: item.mappings.map((mapping) => ({ ...mapping })) })),
        repeated: repeatedOperations.map((item) => ({ ...item })),
      },
      setup: activeSetupSnapshot(),
      primaryTable,
      supplementaryTables: activeSupplementaryTableSpecs(),
    };

    setAnalysisRecords((current) => [record, ...current.filter((item) => item.id !== record.id)].slice(0, ANALYSIS_RECORD_LIMIT));
    setRecordsOpen(true);
    setCopyStatus("Analysis record saved");
    window.setTimeout(() => setCopyStatus(""), 1900);
  }

  async function copyAnalysisRecord(record: SavedAnalysisRecord) {
    await writeFormattedTablesToClipboard([analysisRecordProvenanceTable(record), record.primaryTable, ...record.supplementaryTables]);
    setCopyStatus("Analysis record copied");
    window.setTimeout(() => setCopyStatus(""), 1900);
  }

  function downloadAnalysisRecord(record: SavedAnalysisRecord) {
    const safe = `${record.analysis}-${record.createdAt.slice(0, 19)}`.replace(/[^a-z0-9_-]+/gi, "-");
    downloadJsonFile(`psylattice-${safe}.json`, record);
  }

  function restoreAnalysisRecord(record: SavedAnalysisRecord) {
    const sameSource = record.source.mode === sourceMode
      && record.source.datasetKey === sourceDatasetKey
      && record.source.preparedView === preparedViewActive
      && (record.source.mode !== "study" || !record.source.studyId || record.source.studyId === selectedStudyId)
      && (record.source.mode !== "csv" || record.source.csvName === csvName);

    if (!sameSource) {
      setCopyStatus("Open the same dataset/view before loading this setup");
      window.setTimeout(() => setCopyStatus(""), 2400);
      return;
    }

    setAnalysisFilters(record.preparation.filters.map((item) => ({ ...item })));
    setNumericTransforms(record.preparation.transforms.map((item) => ({ ...item })));
    setComputedVariables(record.preparation.computed.map((item) => ({ ...item })));
    setRecodeDefinitions(record.preparation.recodes.map((item) => ({ ...item, mappings: item.mappings.map((mapping) => ({ ...mapping })) })));
    setRepeatedOperations(record.preparation.repeated.map((item) => ({ ...item })));
    setActiveAnalysis(record.analysis);

    const setup = record.setup as any;
    const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    if (record.analysis === "descriptives") { setSelectedVariables(strings(setup.selectedVariables)); if (setup.options && typeof setup.options === "object") setOptions({ ...defaultOptions, ...setup.options }); if (typeof setup.showFrequencies === "boolean") setShowFrequencies(setup.showFrequencies); }
    else if (record.analysis === "visualizations") { if (setup.mode) setVisualizationMode(setup.mode); setVisualizationXVariable(setup.x || ""); setVisualizationYVariable(setup.y || ""); setVisualizationOutcomeVariable(setup.outcome || ""); setVisualizationGroupVariable(setup.group || ""); setVisualizationTraceVariable(setup.trace || ""); if (typeof setup.showTrend === "boolean") setVisualizationShowTrend(setup.showTrend); if (typeof setup.showCI === "boolean") setVisualizationShowCI(setup.showCI); }
    else if (record.analysis === "diagnostics") { setSelectedVariables(strings(setup.selectedVariables)); if (setup.mode) setDiagnosticsMode(setup.mode); setDiagnosticsOutcomeVariable(setup.outcome || ""); setDiagnosticsFactorVariable(setup.factor || ""); if (setup.varianceCenter) setVarianceTestCenter(setup.varianceCenter); }
    else if (record.analysis === "correlations") { setSelectedVariables(strings(setup.selectedVariables)); if (setup.method) setCorrelationMethod(setup.method); if (typeof setup.showN === "boolean") setShowCorrelationN(setup.showN); if (typeof setup.showP === "boolean") setShowCorrelationP(setup.showP); }
    else if (record.analysis === "ttests") { if (setup.mode) setTTestMode(setup.mode); if (setup.estimator) setTTestEstimator(setup.estimator); setTOutcomeVariable(setup.outcome || ""); setTGroupVariable(setup.group || ""); setTGroupA(setup.groupA || ""); setTGroupB(setup.groupB || ""); setPairedVariableA(setup.pairedA || ""); setPairedVariableB(setup.pairedB || ""); }
    else if (record.analysis === "nonparametric") { if (setup.mode) setNonParametricMode(setup.mode); setNpOutcomeVariable(setup.outcome || ""); setNpGroupVariable(setup.group || ""); setNpGroupA(setup.groupA || ""); setNpGroupB(setup.groupB || ""); setNpPairedVariableA(setup.pairedA || ""); setNpPairedVariableB(setup.pairedB || ""); setNpRepeatedVariables(strings(setup.repeated)); }
    else if (record.analysis === "categorical") { setCategoricalRowVariable(setup.row || ""); setCategoricalColumnVariable(setup.column || ""); }
    else if (record.analysis === "anova") { if (setup.mode) setAnovaMode(setup.mode); if (setup.estimator) setAnovaEstimator(setup.estimator); setAnovaOutcomeVariable(setup.outcome || ""); setAnovaFactorVariable(setup.factor || ""); setAnovaRepeatedVariables(strings(setup.repeated)); setAnovaFactors(strings(setup.factors)); setAnovaCovariates(strings(setup.covariates)); if (typeof setup.includeInteractions === "boolean") setAnovaIncludeInteractions(setup.includeInteractions); }
    else if (record.analysis === "regression") { setRegressionOutcomeVariable(setup.outcome || ""); setRegressionPredictors(strings(setup.predictors)); }
    else if (record.analysis === "process") { if (setup.mode) setProcessMode(setup.mode); setProcessOutcomeVariable(setup.outcome || ""); setProcessPredictorVariable(setup.predictor || ""); setProcessMediatorVariable(setup.mediator || ""); setProcessModeratorVariable(setup.moderator || ""); setProcessCovariates(strings(setup.covariates)); if (typeof setup.bootstrapSamples === "number") setProcessBootstrapSamples(setup.bootstrapSamples); if (typeof setup.centerPredictors === "boolean") setProcessCenterPredictors(setup.centerPredictors); }
    else if (record.analysis === "mixed") { if (setup.family) setMixedFamily(setup.family); setMixedOutcomeVariable(setup.outcome || ""); setMixedGroupVariable(setup.cluster || ""); setMixedPredictors(strings(setup.predictors)); if (setup.estimator) setMixedEstimator(setup.estimator); if (setup.centering) setMixedCentering(setup.centering); setMixedRandomSlopeVariable(setup.randomSlope || ""); setMixedPositiveClass(setup.positiveClass || ""); setMixedExposureVariable(setup.exposure || ""); }
    else if (record.analysis === "logistic") { if (setup.mode) setLogisticMode(setup.mode); setLogisticOutcomeVariable(setup.outcome || ""); setLogisticPositiveClass(setup.positiveClass || ""); setLogisticReferenceClass(setup.referenceClass || ""); setLogisticOrdinalOrder(strings(setup.ordinalOrder)); setLogisticPredictors(strings(setup.predictors)); if (typeof setup.threshold === "number") setLogisticThreshold(setup.threshold); }
    else if (record.analysis === "count") { if (setup.family) setCountFamily(setup.family); setCountOutcomeVariable(setup.outcome || ""); setCountPredictors(strings(setup.predictors)); setCountExposureVariable(setup.exposure || ""); }
    else if (record.analysis === "reliability") { setSelectedVariables(strings(setup.selectedVariables)); setReliabilityReverseItems(strings(setup.reverseItems)); }
    else if (record.analysis === "factor") { setSelectedVariables(strings(setup.selectedVariables)); if (setup.extraction) setFactorExtraction(setup.extraction); if (setup.rotation) setFactorRotation(setup.rotation); if (typeof setup.factorCount === "number") setFactorCount(setup.factorCount); if (typeof setup.loadingCutoff === "number") setFactorLoadingCutoff(setup.loadingCutoff); if (typeof setup.sortLoadings === "boolean") setFactorSortLoadings(setup.sortLoadings); }
    else if (record.analysis === "power") { if (setup.test) setPowerTest(setup.test); if (setup.mode) setPowerMode(setup.mode); if (typeof setup.effectSize === "number") setPowerEffectSize(setup.effectSize); if (typeof setup.alpha === "number") setPowerAlpha(setup.alpha); if (typeof setup.targetPower === "number") setPowerTarget(setup.targetPower); if (typeof setup.sampleSize === "number") setPowerSampleSize(setup.sampleSize); if (setup.tails) setPowerTails(setup.tails); if (typeof setup.groups === "number") setPowerGroups(setup.groups); if (typeof setup.lossRate === "number") setPowerLossRate(setup.lossRate); }
    else if (record.analysis === "cognitive") { setCognitiveTask(setup.task || ""); setCognitiveReferenceCondition(setup.referenceCondition || ""); if (typeof setup.rtMin === "number") setCognitiveRtMin(setup.rtMin); if (typeof setup.rtMax === "number") setCognitiveRtMax(setup.rtMax); if (typeof setup.correctRtOnly === "boolean") setCognitiveCorrectRtOnly(setup.correctRtOnly); if (typeof setup.minTrials === "number") setCognitiveMinTrials(setup.minTrials); if (typeof setup.minAccuracy === "number") setCognitiveMinAccuracy(setup.minAccuracy); if (typeof setup.maxOmissionRate === "number") setCognitiveMaxOmissionRate(setup.maxOmissionRate); if (typeof setup.maxRtExclusionRate === "number") setCognitiveMaxRtExclusionRate(setup.maxRtExclusionRate); }

    setRecordsOpen(false);
    setCopyStatus(record.fingerprint === analysisFingerprint ? "Saved setup loaded" : "Saved setup loaded · data fingerprint changed");
    window.setTimeout(() => setCopyStatus(""), 2400);
  }

  function applyApprovedAnalysisAiPreparation(proposal: AnalysisAiWorkflowProposal) {
    const knownLevels = new Map<string, string>(workbenchVariables.map((variable) => [variable.name, variable.level]));
    const existingNames = new Set(workbenchVariables.map((variable) => variable.name));

    const newFilters: AnalysisFilterRule[] = [];
    const newTransforms: AnalysisNumericTransform[] = [];
    const newComputed: AnalysisComputedVariable[] = [];
    const newRecodes: AnalysisRecodeDefinition[] = [];
    const newRepeated: AnalysisRepeatedOperation[] = [];
    let preferredTab: PrepareDataTab = "native";

    const numeric = (name: string) => ["continuous", "ordinal"].includes(knownLevels.get(name) || "");
    const exists = (name: string) => existingNames.has(name);
    const addOutput = (name: string, level: string) => { existingNames.add(name); knownLevels.set(name, level); };

    for (const step of proposal.preparation_steps) {
      if (step.kind === "working_view") continue;

      if (step.kind === "filter") {
        if (!exists(step.variable)) return { ok: false, message: `Preparation stopped: ${step.variable} is no longer available.` };
        const allowedOperators: AnalysisFilterOperator[] = ["equals", "not_equals", "contains", "not_contains", "gt", "gte", "lt", "lte", "is_missing", "not_missing"];
        if (!allowedOperators.includes(step.operator as AnalysisFilterOperator)) return { ok: false, message: "Preparation stopped: an unsupported filter was proposed." };
        newFilters.push({ id: workbenchId("ai_filter"), variable: step.variable, operator: step.operator as AnalysisFilterOperator, value: step.value, enabled: true });
        preferredTab = "sample";
        continue;
      }

      if (step.kind === "numeric_transform") {
        const output = analysisAiSafeOutputVariable(step.output_variable);
        const allowedKinds: AnalysisNumericTransformKind[] = ["zscore", "center", "ln", "log10", "sqrt", "absolute"];
        if (!numeric(step.source_variable) || !output || exists(output) || !allowedKinds.includes(step.transform as AnalysisNumericTransformKind)) {
          return { ok: false, message: "Preparation stopped: a proposed numeric transformation no longer matches the current variables." };
        }
        newTransforms.push({ id: workbenchId("ai_transform"), sourceVariable: step.source_variable, outputVariable: output, label: output.replaceAll("_", " "), kind: step.transform as AnalysisNumericTransformKind });
        addOutput(output, "continuous");
        preferredTab = "derive";
        continue;
      }

      if (step.kind === "computed_variable") {
        const output = analysisAiSafeOutputVariable(step.output_variable);
        const allowedOperations: AnalysisComputedOperation[] = ["difference", "sum", "mean", "ratio", "product"];
        if (!numeric(step.left_variable) || !numeric(step.right_variable) || step.left_variable === step.right_variable || !output || exists(output) || !allowedOperations.includes(step.operation as AnalysisComputedOperation)) {
          return { ok: false, message: "Preparation stopped: a proposed computed variable no longer matches the current variables." };
        }
        newComputed.push({ id: workbenchId("ai_computed"), leftVariable: step.left_variable, rightVariable: step.right_variable, outputVariable: output, label: output.replaceAll("_", " "), operation: step.operation as AnalysisComputedOperation });
        addOutput(output, "continuous");
        preferredTab = "derive";
        continue;
      }

      if (step.kind === "recode") {
        const output = analysisAiSafeOutputVariable(step.output_variable);
        const sourceLevel = knownLevels.get(step.source_variable) || "";
        const mappings = step.mappings.slice(0, 30).filter((mapping) => String(mapping.from).trim() && String(mapping.to).trim()).map((mapping) => ({ from: String(mapping.from), to: String(mapping.to) }));
        if (!exists(step.source_variable) || ["id", "datetime", "text"].includes(sourceLevel) || !output || exists(output) || mappings.length === 0) {
          return { ok: false, message: "Preparation stopped: a proposed recode is not safe for the current variable structure." };
        }
        newRecodes.push({ id: workbenchId("ai_recode"), sourceVariable: step.source_variable, outputVariable: output, label: output.replaceAll("_", " "), mappings, keepUnmapped: step.keep_unmapped !== false });
        addOutput(output, "nominal");
        preferredTab = "derive";
        continue;
      }

      if (step.kind === "repeated_variable") {
        const output = analysisAiSafeOutputVariable(step.output_variable);
        const allowedKinds: AnalysisRepeatedOperationKind[] = ["observation_index", "elapsed_time", "cluster_mean", "within_cluster_center", "lag1", "change_from_previous"];
        const kind = step.operation as AnalysisRepeatedOperationKind;
        const needsTime = ["observation_index", "elapsed_time", "lag1", "change_from_previous"].includes(kind);
        const needsSource = ["cluster_mean", "within_cluster_center", "lag1", "change_from_previous"].includes(kind);
        if (!exists(step.cluster_variable) || !output || exists(output) || !allowedKinds.includes(kind)) {
          return { ok: false, message: "Preparation stopped: a proposed repeated-data variable no longer matches the current dataset." };
        }
        if (needsTime && (!step.time_variable || !exists(step.time_variable))) return { ok: false, message: "Preparation stopped: the proposed repeated-data step needs an available time/order variable." };
        if (needsSource && (!step.source_variable || !numeric(step.source_variable))) return { ok: false, message: "Preparation stopped: the proposed repeated-data step needs an available numeric source variable." };
        newRepeated.push({
          id: workbenchId("ai_repeated"),
          clusterVariable: step.cluster_variable,
          timeVariable: needsTime ? step.time_variable : undefined,
          sourceVariable: needsSource ? step.source_variable : undefined,
          outputVariable: output,
          label: output.replaceAll("_", " "),
          kind,
        });
        addOutput(output, "continuous");
        preferredTab = "repeated";
      }
    }

    if (newTransforms.length) setNumericTransforms((current) => [...current, ...newTransforms]);
    if (newComputed.length) setComputedVariables((current) => [...current, ...newComputed]);
    if (newRecodes.length) setRecodeDefinitions((current) => [...current, ...newRecodes]);
    if (newRepeated.length) setRepeatedOperations((current) => [...current, ...newRepeated]);
    if (newFilters.length) setAnalysisFilters((current) => [...current, ...newFilters]);

    if (proposal.preparation_steps.some((step) => step.kind !== "working_view")) {
      setPrepareDataOpen(true);
      setPrepareDataTab(preferredTab);
    }
    if (proposal.analysis_setup) setPendingAiSetupAfterPreparation(proposal.analysis_setup);

    return {
      ok: true,
      message: proposal.analysis_setup
        ? "Approved preparation applied · Analysis Lab will configure the suggested analysis when the variables are ready"
        : "Approved preparation applied to the Analysis Lab working view",
    };
  }

  function applyAnalysisAiWorkflowProposal(proposal: AnalysisAiWorkflowProposal) {
    if (!proposal.can_apply) return { ok: false, message: "This workflow still needs a manual decision before PsyLattice can apply it." };
    if (proposal.source_data_fingerprint && proposal.source_data_fingerprint !== analysisWorkingFingerprint) {
      return { ok: false, message: "The Analysis Lab data changed after this workflow was suggested. Ask Analysis AI to refresh it." };
    }

    const viewSteps = proposal.preparation_steps.filter((step): step is Extract<AnalysisAiPreparationStep, { kind: "working_view" }> => step.kind === "working_view");
    if (viewSteps.length > 1 || (viewSteps.length === 1 && proposal.preparation_steps[0]?.kind !== "working_view")) {
      return { ok: false, message: "This workflow contains an invalid working-view sequence. Ask Analysis AI to rebuild it." };
    }

    const targetView = viewSteps[0]?.view || (preparedViewActive ? "prepared" : "raw");
    if (targetView === "prepared" && !preparation.canPrepare) {
      return { ok: false, message: "This dataset does not currently expose a native prepared view." };
    }

    if ((targetView === "prepared") !== preparedViewActive) {
      setPendingAiWorkflowAfterView(proposal);
      setPrepareDataOpen(true);
      setPrepareDataTab("native");
      setUsePreparedData(targetView === "prepared");
      return { ok: true, message: `Switching to ${targetView === "prepared" ? "Prepared" : "Raw"} view · approved preparation will continue automatically` };
    }

    return applyApprovedAnalysisAiPreparation(proposal);
  }

  function applyAnalysisAiSetupProposal(proposal: AnalysisAiSetupProposal) {
    if (!proposal.can_apply) {
      return { ok: false, message: "This recommendation needs a manual prerequisite before it can be applied." };
    }

    const analysisId = proposal.analysis_id as ActiveAnalysis;
    const availableAnalysisIds = new Set(
      analysisCatalogue.filter((item) => item.available).map((item) => item.id)
    );
    if (!availableAnalysisIds.has(analysisId)) {
      return { ok: false, message: "That Analysis AI recommendation is not available in the current Analysis Lab." };
    }
    if (proposal.requires_raw_rows && preparedViewActive) {
      return { ok: false, message: "Switch Prepare data to Raw first, then apply this repeated-data setup." };
    }

    const setup = proposal.setup || {};
    const variableNames = new Set(variables.map((variable) => variable.name));
    const strings = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
    const validVariables = (value: unknown) => strings(value).filter((name) => variableNames.has(name));
    const variable = (value: unknown) =>
      typeof value === "string" && (!value || variableNames.has(value)) ? value : "";

    const variableScalarKeys = [
      "outcome", "group", "factor", "row", "column", "x", "y", "trace",
      "predictor", "mediator", "moderator", "cluster", "exposure", "pairedA", "pairedB", "randomSlope",
    ];
    const invalidScalar = variableScalarKeys.some((key) => {
      const value = setup[key];
      return typeof value === "string" && value.length > 0 && !variableNames.has(value);
    });
    const variableArrayKeys = ["predictors", "factors", "covariates", "repeated", "selectedVariables", "reverseItems"];
    const invalidArray = variableArrayKeys.some((key) => {
      const value = setup[key];
      return Array.isArray(value) && value.some((item) => typeof item !== "string" || !variableNames.has(item));
    });
    if (invalidScalar || invalidArray) {
      return { ok: false, message: "The dataset changed after this recommendation. Ask Analysis AI to refresh the setup." };
    }

    setActiveAnalysis(analysisId);

    if (analysisId === "descriptives") {
      setSelectedVariables(validVariables(setup.selectedVariables));
      if (setup.options && typeof setup.options === "object" && !Array.isArray(setup.options)) {
        setOptions({ ...defaultOptions, ...(setup.options as Partial<typeof defaultOptions>) });
      }
      if (typeof setup.showFrequencies === "boolean") setShowFrequencies(setup.showFrequencies);
    } else if (analysisId === "visualizations") {
      if (["scatter", "box", "violin", "means", "interaction"].includes(String(setup.mode))) setVisualizationMode(setup.mode as VisualizationMode);
      setVisualizationXVariable(variable(setup.x));
      setVisualizationYVariable(variable(setup.y));
      setVisualizationOutcomeVariable(variable(setup.outcome));
      setVisualizationGroupVariable(variable(setup.group));
      setVisualizationTraceVariable(variable(setup.trace));
      if (typeof setup.showTrend === "boolean") setVisualizationShowTrend(setup.showTrend);
      if (typeof setup.showCI === "boolean") setVisualizationShowCI(setup.showCI);
    } else if (analysisId === "diagnostics") {
      setSelectedVariables(validVariables(setup.selectedVariables));
      if (["distribution", "homogeneity"].includes(String(setup.mode))) setDiagnosticsMode(setup.mode as DiagnosticsMode);
      setDiagnosticsOutcomeVariable(variable(setup.outcome));
      setDiagnosticsFactorVariable(variable(setup.factor));
      if (["mean", "median"].includes(String(setup.varianceCenter))) setVarianceTestCenter(setup.varianceCenter as VarianceTestCenter);
    } else if (analysisId === "correlations") {
      setSelectedVariables(validVariables(setup.selectedVariables));
      if (["pearson", "spearman"].includes(String(setup.method))) setCorrelationMethod(setup.method as CorrelationMethod);
      if (typeof setup.showN === "boolean") setShowCorrelationN(setup.showN);
      if (typeof setup.showP === "boolean") setShowCorrelationP(setup.showP);
    } else if (analysisId === "ttests") {
      if (["independent", "paired"].includes(String(setup.mode))) setTTestMode(setup.mode as TTestMode);
      if (["welch", "student"].includes(String(setup.estimator))) setTTestEstimator(setup.estimator as IndependentTTestEstimator);
      setTOutcomeVariable(variable(setup.outcome));
      setTGroupVariable(variable(setup.group));
      setPairedVariableA(variable(setup.pairedA));
      setPairedVariableB(variable(setup.pairedB));
      const groupName = variable(setup.group);
      const levels = groupName ? getVariableLevels(activeRows, groupName, 80).map((level) => level.value) : [];
      setTGroupA(typeof setup.groupA === "string" && levels.includes(setup.groupA) ? setup.groupA : "");
      setTGroupB(typeof setup.groupB === "string" && levels.includes(setup.groupB) ? setup.groupB : "");
    } else if (analysisId === "nonparametric") {
      if (["mannwhitney", "wilcoxon", "kruskal", "friedman"].includes(String(setup.mode))) setNonParametricMode(setup.mode as NonParametricMode);
      setNpOutcomeVariable(variable(setup.outcome));
      setNpGroupVariable(variable(setup.group));
      setNpPairedVariableA(variable(setup.pairedA));
      setNpPairedVariableB(variable(setup.pairedB));
      setNpRepeatedVariables(validVariables(setup.repeated));
      const groupName = variable(setup.group);
      const levels = groupName ? getVariableLevels(activeRows, groupName, 80).map((level) => level.value) : [];
      setNpGroupA(typeof setup.groupA === "string" && levels.includes(setup.groupA) ? setup.groupA : "");
      setNpGroupB(typeof setup.groupB === "string" && levels.includes(setup.groupB) ? setup.groupB : "");
    } else if (analysisId === "categorical") {
      setCategoricalRowVariable(variable(setup.row));
      setCategoricalColumnVariable(variable(setup.column));
    } else if (analysisId === "anova") {
      if (["between", "factorial", "ancova", "repeated"].includes(String(setup.mode))) setAnovaMode(setup.mode as AnovaMode);
      if (["standard", "welch"].includes(String(setup.estimator))) setAnovaEstimator(setup.estimator as OneWayAnovaEstimator);
      setAnovaOutcomeVariable(variable(setup.outcome));
      setAnovaFactorVariable(variable(setup.factor));
      setAnovaRepeatedVariables(validVariables(setup.repeated));
      setAnovaFactors(validVariables(setup.factors));
      setAnovaCovariates(validVariables(setup.covariates));
      if (typeof setup.includeInteractions === "boolean") setAnovaIncludeInteractions(setup.includeInteractions);
    } else if (analysisId === "regression") {
      setRegressionOutcomeVariable(variable(setup.outcome));
      setRegressionPredictors(validVariables(setup.predictors));
    } else if (analysisId === "process") {
      if (["mediation", "moderation"].includes(String(setup.mode))) setProcessMode(setup.mode as ProcessMode);
      setProcessOutcomeVariable(variable(setup.outcome));
      setProcessPredictorVariable(variable(setup.predictor));
      setProcessMediatorVariable(variable(setup.mediator));
      setProcessModeratorVariable(variable(setup.moderator));
      setProcessCovariates(validVariables(setup.covariates));
      if ([1000, 2000, 5000].includes(Number(setup.bootstrapSamples))) setProcessBootstrapSamples(Number(setup.bootstrapSamples));
      if (typeof setup.centerPredictors === "boolean") setProcessCenterPredictors(setup.centerPredictors);
    } else if (analysisId === "mixed") {
      if (["gaussian", "binomial", "poisson"].includes(String(setup.family))) setMixedFamily(setup.family as MixedOutcomeFamily);
      setMixedOutcomeVariable(variable(setup.outcome));
      setMixedGroupVariable(variable(setup.cluster));
      setMixedPredictors(validVariables(setup.predictors));
      if (["reml", "ml"].includes(String(setup.estimator))) setMixedEstimator(setup.estimator as MixedModelEstimator);
      if (["none", "grand", "cluster"].includes(String(setup.centering))) setMixedCentering(setup.centering as MixedModelCentering);
      setMixedRandomSlopeVariable(variable(setup.randomSlope));
      setMixedExposureVariable(variable(setup.exposure));
      const outcomeName = variable(setup.outcome);
      const levels = outcomeName ? getVariableLevels(activeRows, outcomeName, 80).map((level) => level.value) : [];
      setMixedPositiveClass(typeof setup.positiveClass === "string" && levels.includes(setup.positiveClass) ? setup.positiveClass : "");
    } else if (analysisId === "logistic") {
      if (["binary", "multinomial", "ordinal"].includes(String(setup.mode))) setLogisticMode(setup.mode as LogisticMode);
      const outcomeName = variable(setup.outcome);
      setLogisticOutcomeVariable(outcomeName);
      setLogisticPredictors(validVariables(setup.predictors));
      const levels = outcomeName ? getVariableLevels(activeRows, outcomeName, 80).map((level) => level.value) : [];
      setLogisticPositiveClass(typeof setup.positiveClass === "string" && levels.includes(setup.positiveClass) ? setup.positiveClass : "");
      setLogisticReferenceClass(typeof setup.referenceClass === "string" && levels.includes(setup.referenceClass) ? setup.referenceClass : "");
      const order = strings(setup.ordinalOrder);
      setLogisticOrdinalOrder(order.length > 0 && order.every((level) => levels.includes(level)) ? order : []);
      if (typeof setup.threshold === "number" && setup.threshold > 0 && setup.threshold < 1) setLogisticThreshold(setup.threshold);
    } else if (analysisId === "count") {
      if (["poisson", "negative_binomial"].includes(String(setup.family))) setCountFamily(setup.family as CountRegressionFamily);
      setCountOutcomeVariable(variable(setup.outcome));
      setCountPredictors(validVariables(setup.predictors));
      setCountExposureVariable(variable(setup.exposure));
    } else if (analysisId === "reliability") {
      setSelectedVariables(validVariables(setup.selectedVariables));
      setReliabilityReverseItems(validVariables(setup.reverseItems));
    } else if (analysisId === "factor") {
      setSelectedVariables(validVariables(setup.selectedVariables));
      if (["principal_axis", "principal_components"].includes(String(setup.extraction))) setFactorExtraction(setup.extraction as FactorExtractionMethod);
      if (["promax", "varimax", "none"].includes(String(setup.rotation))) setFactorRotation(setup.rotation as FactorRotationMethod);
      if (typeof setup.factorCount === "number") setFactorCount(Math.max(1, Math.round(setup.factorCount)));
      if (typeof setup.loadingCutoff === "number") setFactorLoadingCutoff(Math.max(0, Math.min(0.95, setup.loadingCutoff)));
      if (typeof setup.sortLoadings === "boolean") setFactorSortLoadings(setup.sortLoadings);
    } else if (analysisId === "power") {
      if (["independent_t", "paired_t", "correlation", "one_way_anova"].includes(String(setup.test))) setPowerTest(setup.test as PowerAnalysisTest);
      if (["apriori", "achieved"].includes(String(setup.mode))) setPowerMode(setup.mode as PowerAnalysisMode);
      if (typeof setup.effectSize === "number") setPowerEffectSize(setup.effectSize);
      if (typeof setup.alpha === "number") setPowerAlpha(setup.alpha);
      if (typeof setup.targetPower === "number") setPowerTarget(setup.targetPower);
      if (typeof setup.sampleSize === "number") setPowerSampleSize(Math.max(2, Math.round(setup.sampleSize)));
      if (["one", "two"].includes(String(setup.tails))) setPowerTails(setup.tails as PowerAnalysisTails);
      if (typeof setup.groups === "number") setPowerGroups(Math.max(2, Math.round(setup.groups)));
      if (typeof setup.lossRate === "number") setPowerLossRate(Math.max(0, Math.min(0.95, setup.lossRate)));
    }

    setCopyStatus(`${proposal.title} applied · review the controls`);
    window.setTimeout(() => setCopyStatus(""), 2600);
    return { ok: true, message: `${proposal.title} applied. Review the visible controls before interpreting the deterministic result.` };
  }

  async function copyActiveResults() {
    await copyTableSpec(activePrimaryTableSpec());
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

  const analysisAiPrimaryResult = activePrimaryTableSpec();
  const analysisAiSupplementaryResults = activeSupplementaryTableSpecs();
  const analysisAiContextVariables = variables
    .filter((variable) => variable.level === "id" || !analysisAiSensitiveVariable(variable.name, variable.label, variable.level))
    .slice(0, 320);
  const analysisAiRawContextVariables = analysisAiRawVariablePreview
    .filter((variable) => variable.level === "id" || !analysisAiSensitiveVariable(variable.name, variable.label, variable.level))
    .slice(0, 320);
  const analysisAiPreparedContextVariables = analysisAiPreparedVariablePreview
    .filter((variable) => variable.level === "id" || !analysisAiSensitiveVariable(variable.name, variable.label, variable.level))
    .slice(0, 320);
  const analysisAiRowVariables = analysisAiContextVariables
    .filter((variable) => variable.level !== "text" && variable.level !== "id" && !analysisAiSensitiveVariable(variable.name, variable.label, variable.level))
    .slice(0, 36);
  const analysisAiVariableMetadata = (variable: AnalysisVariable, rowsForLevels: AnalysisRow[]) => ({
    name: variable.name,
    label: variable.label,
    source: variable.source,
    level: variable.level,
    validCount: variable.validCount,
    missingCount: variable.missingCount,
    distinctCount: variable.distinctCount,
    isIdentifier: variable.level === "id",
    levels: variable.level !== "id" && ["nominal", "boolean", "ordinal"].includes(variable.level) && variable.distinctCount <= 20
      ? getVariableLevels(rowsForLevels, variable.name, 20).map((level) => level.value)
      : undefined,
  });
  const analysisAiWorkingRows = activeRows.slice(0, 250).map((row, index) => {
    const next: Record<string, string | number | boolean | null> = { analysis_row: index + 1 };
    analysisAiRowVariables.forEach((variable) => {
      const value = analysisAiPrimitive(row[variable.name]);
      if (value !== undefined) next[variable.name] = value;
    });
    return next;
  });
  const analysisAiSafeFilters = analysisFilters.map((rule) => {
    const variable = variables.find((item) => item.name === rule.variable);
    const sensitive = variable
      ? analysisAiSensitiveVariable(variable.name, variable.label, variable.level)
      : true;
    return sensitive ? { ...rule, value: "[hidden]" } : { ...rule };
  });
  const analysisAiContext: AnalysisAiContext = {
    schema_version: "psylattice_analysis_ai_v3",
    source_policy: {
      numerical_source: "PsyLattice deterministic Analysis Lab",
      ai_role: "guidance, explanation, analysis selection, approval-gated preparation workflows and setup proposals",
      direct_identifiers_included: false,
      free_text_rows_included: false,
      row_level_access_default: "off",
      thesis_builder_access_default: "off",
      ai_may_recompute_statistics: false,
    },
    study: { id: selectedStudyId || undefined, title: studyTitle || undefined },
    dataset: {
      source_mode: sourceMode,
      dataset_key: sourceDatasetKey,
      dataset_label: sourceLabel,
      include_test_data: includeTestData,
      identity_mode: identityModeLabel,
      working_view: preparedViewActive ? "prepared" : "raw",
      preparation_family: preparation.familyLabel,
      source_rows: sourceRows.length,
      current_rows: activeRows.length,
    },
    sample: {
      source_rows: sampleAudit.sourceRows,
      working_rows: sampleAudit.workingRows,
      after_filters_rows: sampleAudit.afterFiltersRows,
      explicitly_excluded_rows: sampleAudit.explicitlyExcludedRows,
      complete_across_current_setup: sampleAudit.completeAcrossSetupRows,
      incomplete_across_current_setup: sampleAudit.incompleteAcrossSetupRows,
      current_data_fingerprint: analysisWorkingFingerprint,
      current_analysis_fingerprint: analysisFingerprint,
    },
    preparation: {
      native_prepared_view_available: preparation.canPrepare,
      native_prepared_view_active: preparedViewActive,
      native_family: preparation.familyLabel,
      filters: analysisAiSafeFilters,
      numeric_transforms: numericTransforms,
      computed_variables: computedVariables,
      recodes: recodeDefinitions.map((definition) => ({
        ...definition,
        mappings: analysisAiSensitiveVariable(
          definition.sourceVariable,
          variables.find((item) => item.name === definition.sourceVariable)?.label || definition.sourceVariable,
          variables.find((item) => item.name === definition.sourceVariable)?.level || "text"
        )
          ? []
          : definition.mappings,
      })),
      repeated_operations: repeatedOperations,
      missingness_focus_variables: missingnessFocusVariables,
      raw_variables: analysisAiRawContextVariables.map((variable) => analysisAiVariableMetadata(variable, sourceRows)),
      prepared_variables: analysisAiPreparedContextVariables.map((variable) => analysisAiVariableMetadata(variable, preparation.rows)),
    },
    variables: analysisAiContextVariables.map((variable) => analysisAiVariableMetadata(variable, activeRows)),
    current_analysis: {
      id: activeAnalysis,
      label: activeAnalysisLabel(),
      setup: activeSetupSnapshot(),
      selected_variables: [...currentAnalysisVariables],
      data_fingerprint: analysisFingerprint,
      primary_result: analysisAiPrimaryResult,
      supplementary_results: analysisAiSupplementaryResults,
    },
    saved_analysis_records: analysisRecords.slice(0, 10).map((record) => ({
      id: record.id,
      created_at: record.createdAt,
      analysis: record.analysis,
      analysis_label: record.analysisLabel,
      dataset_label: record.source.datasetLabel,
      data_fingerprint: record.fingerprint,
      sample: record.sample,
      variables: record.variables,
      setup: record.setup,
      primary_result: record.primaryTable,
    })),
    capability_registry: [
      { id: "prepare_data", label: "Prepare data", modes: ["Native preparation", "Sample", "Derive", "Repeated", "Missing data"], note: "Non-destructive filters, recodes, transformations, computed variables, longitudinal derivations and missingness/sample audit." },
      { id: "descriptives", label: "Descriptives", modes: ["Numeric summaries", "Frequencies"] },
      { id: "diagnostics", label: "Diagnostics", modes: ["Distribution", "Variance homogeneity"], controls: ["Histogram", "Q-Q plot", "Jarque-Bera", "Outliers", "Brown-Forsythe", "Levene"] },
      { id: "visualizations", label: "Visualizations", modes: ["Scatter", "Box", "Violin", "Grouped means", "Interaction"] },
      { id: "correlations", label: "Correlations", modes: ["Pearson", "Spearman"] },
      { id: "ttests", label: "T-tests", modes: ["Independent", "Paired"], controls: ["Welch", "Student", "95% CI", "Effect sizes"] },
      { id: "nonparametric", label: "Non-parametric", modes: ["Mann-Whitney U", "Wilcoxon signed-rank", "Kruskal-Wallis", "Friedman"] },
      { id: "categorical", label: "Categorical", modes: ["Contingency table", "Pearson chi-square", "Fisher exact 2x2"], controls: ["Cramer's V", "Phi", "Adjusted standardized residuals", "Odds ratio 2x2"] },
      { id: "anova", label: "ANOVA", modes: ["One-way", "Factorial", "ANCOVA", "Repeated measures"], controls: ["Standard", "Welch", "Type III-style tests", "Interactions", "Estimated marginal means", "Mauchly", "Greenhouse-Geisser", "Huynh-Feldt", "Post-hoc"] },
      { id: "regression", label: "Regression", modes: ["Multiple linear regression"], controls: ["Standardized beta", "VIF", "Tolerance", "Residual diagnostics", "Breusch-Pagan/Koenker", "Influence"] },
      { id: "process", label: "Mediation & moderation", modes: ["Mediation", "Moderation"], controls: ["Bootstrap indirect effect", "Interaction", "Simple slopes", "Delta R-squared"] },
      { id: "mixed", label: "Mixed models", modes: ["Continuous", "Binary", "Count"], controls: ["Random intercept", "Linear random slope", "ML", "REML", "Grand-mean centering", "Cluster-mean centering", "Exposure for count"] },
      { id: "logistic", label: "Categorical regression", modes: ["Binary logistic", "Multinomial logistic", "Ordinal logistic"] },
      { id: "count", label: "Count models", modes: ["Poisson", "Negative binomial"], controls: ["Exposure offset", "IRR", "Dispersion diagnostics"] },
      { id: "reliability", label: "Reliability", modes: ["Cronbach alpha"], controls: ["Standardized alpha", "Item-rest correlation", "Alpha if deleted", "Explicit reverse scoring"] },
      { id: "factor", label: "Factor analysis", modes: ["Exploratory factor analysis"], controls: ["Principal-axis", "Principal-components", "Promax", "Varimax", "KMO", "Bartlett", "Scree plot"] },
      { id: "power", label: "Power & sample size", modes: ["A priori", "Achieved power"], controls: ["Independent t", "Paired/one-sample t", "Correlation", "One-way ANOVA", "Attrition inflation"] },
    ],
    apply_setup_schema: {
      behavior: "A setup proposal configures only visible Analysis Lab analysis controls after explicit researcher approval. It does not change stored data, preparation operations, dataset selection, or Thesis Builder content.",
      analyses: {
        descriptives: { keys: ["selectedVariables", "showFrequencies", "options"] },
        diagnostics: { keys: ["mode", "selectedVariables", "outcome", "factor", "varianceCenter"], values: { mode: ["distribution", "homogeneity"], varianceCenter: ["mean", "median"] } },
        visualizations: { keys: ["mode", "x", "y", "outcome", "group", "trace", "showTrend", "showCI"], values: { mode: ["scatter", "box", "violin", "means", "interaction"] } },
        correlations: { keys: ["selectedVariables", "method", "showN", "showP"], values: { method: ["pearson", "spearman"] } },
        ttests: { keys: ["mode", "estimator", "outcome", "group", "groupA", "groupB", "pairedA", "pairedB"], values: { mode: ["independent", "paired"], estimator: ["welch", "student"] } },
        nonparametric: { keys: ["mode", "outcome", "group", "groupA", "groupB", "pairedA", "pairedB", "repeated"], values: { mode: ["mannwhitney", "wilcoxon", "kruskal", "friedman"] } },
        categorical: { keys: ["row", "column"] },
        anova: { keys: ["mode", "estimator", "outcome", "factor", "repeated", "factors", "covariates", "includeInteractions"], values: { mode: ["between", "factorial", "ancova", "repeated"], estimator: ["standard", "welch"] } },
        regression: { keys: ["outcome", "predictors"] },
        process: { keys: ["mode", "outcome", "predictor", "mediator", "moderator", "covariates", "bootstrapSamples", "centerPredictors"], values: { mode: ["mediation", "moderation"], bootstrapSamples: [1000, 2000, 5000] } },
        mixed: { keys: ["family", "outcome", "cluster", "predictors", "estimator", "centering", "randomSlope", "positiveClass", "exposure"], values: { family: ["gaussian", "binomial", "poisson"], estimator: ["reml", "ml"], centering: ["none", "grand", "cluster"] } },
        logistic: { keys: ["mode", "outcome", "positiveClass", "referenceClass", "ordinalOrder", "predictors", "threshold"], values: { mode: ["binary", "multinomial", "ordinal"] } },
        count: { keys: ["family", "outcome", "predictors", "exposure"], values: { family: ["poisson", "negative_binomial"] } },
        reliability: { keys: ["selectedVariables", "reverseItems"] },
        factor: { keys: ["selectedVariables", "extraction", "rotation", "factorCount", "loadingCutoff", "sortLoadings"], values: { extraction: ["principal_axis", "principal_components"], rotation: ["promax", "varimax", "none"] } },
        power: { keys: ["test", "mode", "effectSize", "alpha", "targetPower", "sampleSize", "tails", "groups", "lossRate"], values: { test: ["independent_t", "paired_t", "correlation", "one_way_anova"], mode: ["apriori", "achieved"], tails: ["one", "two"] } },
      },
    },
    apply_preparation_schema: {
      behavior: "After explicit researcher approval, Analysis AI may apply only these non-destructive Analysis Lab preparation actions. Stored study responses are never edited. Filters change only the current analysis sample and are not automatic participant exclusions.",
      actions: {
        working_view: { keys: ["view"], values: { view: ["raw", "prepared"] }, note: "If used, this must be the first workflow step. Prepared is available only when native_prepared_view_available is true." },
        filter: { keys: ["variable", "operator", "value"], values: { operator: ["equals", "not_equals", "contains", "not_contains", "gt", "gte", "lt", "lte", "is_missing", "not_missing"] }, note: "Analysis-view filter only. Never deletion or automatic exclusion." },
        numeric_transform: { keys: ["source_variable", "output_variable", "transform"], values: { transform: ["zscore", "center", "ln", "log10", "sqrt", "absolute"] } },
        computed_variable: { keys: ["left_variable", "right_variable", "output_variable", "operation"], values: { operation: ["difference", "sum", "mean", "ratio", "product"] } },
        recode: { keys: ["source_variable", "output_variable", "mappings", "keep_unmapped"], note: "Mappings must be grounded in known levels, metadata, explicit user instructions, or permitted thesis text. Never guessed." },
        repeated_variable: { keys: ["cluster_variable", "time_variable", "source_variable", "output_variable", "operation"], values: { operation: ["observation_index", "elapsed_time", "cluster_mean", "within_cluster_center", "lag1", "change_from_previous"] } },
      },
    },
  };

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

      <div className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-2.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPrepareDataOpen((current) => !current)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition ${prepareDataOpen ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-500 hover:border-cyan-200 hover:text-cyan-700"}`}
              title={prepareDataOpen ? "Close data preparation" : "Open data preparation"}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => setPrepareDataOpen((current) => !current)} className="text-[10px] font-semibold text-slate-800">
                  Prepare data
                </button>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[.07em] text-slate-500">
                  {preparation.familyLabel}
                </span>
                {preparation.alreadyAnalysisReady ? (
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[.07em] text-emerald-700">Analysis-ready</span>
                ) : preparation.canPrepare ? (
                  <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[.07em] text-cyan-700">{preparation.derivedVariables.length} derived</span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[8px] text-slate-400">
                {preparation.alreadyAnalysisReady
                  ? "Already one row per participant — no conversion needed."
                  : preparation.canPrepare
                    ? `${preparation.sourceLevel} → ${preparation.targetLevel}`
                    : "Analyze the current rows as supplied."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {preparation.canPrepare ? (
              <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setUsePreparedData(false)}
                  className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${!preparedViewActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                >
                  Raw · {sourceRows.length.toLocaleString()}
                </button>
                <button
                  type="button"
                  onClick={() => setUsePreparedData(true)}
                  className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${preparedViewActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-500"}`}
                >
                  Prepared · {preparation.rows.length.toLocaleString()}
                </button>
              </div>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8px] font-semibold text-slate-500">
                {preparation.alreadyAnalysisReady ? "Participant view" : "Raw view"}
              </span>
            )}
            <button
              type="button"
              onClick={() => setPrepareDataOpen((current) => !current)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={prepareDataOpen ? "Collapse prepare data" : "Expand prepare data"}
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${prepareDataOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {prepareDataOpen ? (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 p-1">
              {([
                ["native", "Native preparation"],
                ["sample", `Sample · ${activeRows.length.toLocaleString()}`],
                ["derive", `Derived · ${variableOperationResult.createdVariables.length}`],
                ["repeated", `Repeated · ${repeatedOperations.length}`],
                ["missing", "Missing data"],
              ] as Array<[PrepareDataTab, string]>).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPrepareDataTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-[8px] font-semibold transition ${prepareDataTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {label}
                </button>
              ))}
              {(analysisFilters.length > 0 || variableOperationResult.createdVariables.length > 0) ? (
                <span className="ml-auto rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[.07em] text-cyan-700">
                  Non-destructive view
                </span>
              ) : null}
            </div>

            {prepareDataTab === "native" ? (
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/65 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Detected structure</p>
                      <p className="mt-1 text-[12px] font-semibold text-slate-900">{preparation.familyLabel}</p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-500">{preparation.sourceLevel} → {preparation.targetLevel}</p>
                    </div>
                    {preparation.canPrepare ? (
                      <span className="rounded-full border border-cyan-100 bg-white px-2.5 py-1 text-[8px] font-semibold text-cyan-700">One Lab · two data views</span>
                    ) : null}
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {preparation.notes.map((note) => (
                      <div key={note} className="flex gap-2 text-[8px] leading-4 text-slate-500">
                        <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-cyan-500" />
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>

                  {preparation.family === "cognitive" ? (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Cognitive preparation</p>
                        <span className="text-[8px] font-semibold text-cyan-700">Derived RT metrics only</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <label className="block"><span className="text-[8px] text-slate-400">Min RT ms</span><input type="number" min={0} value={cognitiveRtMin} onChange={(event) => setCognitiveRtMin(Math.max(0, Number(event.target.value) || 0))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] font-semibold text-slate-700" /></label>
                        <label className="block"><span className="text-[8px] text-slate-400">Max RT ms</span><input type="number" min={cognitiveRtMin} value={cognitiveRtMax} onChange={(event) => setCognitiveRtMax(Math.max(cognitiveRtMin, Number(event.target.value) || cognitiveRtMin))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] font-semibold text-slate-700" /></label>
                        <label className="block"><span className="text-[8px] text-slate-400">Min trials</span><input type="number" min={0} value={cognitiveMinTrials} onChange={(event) => setCognitiveMinTrials(Math.max(0, Number(event.target.value) || 0))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] font-semibold text-slate-700" /></label>
                        <label className="block"><span className="text-[8px] text-slate-400">Min accuracy %</span><input type="number" min={0} max={100} value={Math.round(cognitiveMinAccuracy * 100)} onChange={(event) => setCognitiveMinAccuracy(Math.min(1, Math.max(0, (Number(event.target.value) || 0) / 100)))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] font-semibold text-slate-700" /></label>
                      </div>
                      <label className="mt-2 flex items-center gap-2 text-[8px] text-slate-600"><input type="checkbox" checked={cognitiveCorrectRtOnly} onChange={(event) => setCognitiveCorrectRtOnly(event.target.checked)} /><span>Use correct trials only for generic RT summaries</span></label>
                      <p className="mt-2 text-[8px] leading-4 text-slate-400">Participants are flagged, never silently excluded.</p>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Variables available to every analysis</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-900">
                        {preparation.derivedVariables.length > 0
                          ? `${preparation.derivedVariables.length} native prepared variables`
                          : preparation.alreadyAnalysisReady
                            ? "Existing analysis-ready variables"
                            : "No automatic native derivation needed"}
                      </p>
                    </div>
                    {preparation.canPrepare ? <button type="button" onClick={() => setUsePreparedData(true)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[8px] font-semibold text-slate-700 shadow-sm">Use prepared view</button> : null}
                  </div>

                  {preparation.derivedVariables.length > 0 ? (
                    <div className="mt-3 max-h-40 overflow-y-auto pr-1">
                      <div className="flex flex-wrap gap-1.5">
                        {preparation.derivedVariables.slice(0, 40).map((variable) => (
                          <span key={variable.name} title={`${variable.label}\n${variable.note}`} className="max-w-full truncate rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8px] font-semibold text-slate-600">{variable.label}</span>
                        ))}
                      </div>
                      {preparation.derivedVariables.length > 40 ? <p className="mt-2 text-[8px] text-slate-400">+ {preparation.derivedVariables.length - 40} more variables available in Variables.</p> : null}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3 text-[8px] leading-4 text-slate-500">
                      {preparation.issue || (preparation.alreadyAnalysisReady ? "This dataset is already structured for participant-level analysis." : "The statistical tools use the supplied rows directly.")}
                    </div>
                  )}

                  <div className="mt-3 border-t border-slate-100 pt-3 text-[8px] leading-4 text-slate-400">Native preparation changes the analysis view only. The stored study data remains untouched.</div>
                </div>
              </div>
            ) : null}

            {prepareDataTab === "sample" ? (
              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/65 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Analysis sample</p>
                      <p className="mt-1 text-[12px] font-semibold text-slate-900">Transparent row flow</p>
                    </div>
                    <Filter className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {[
                      ["Source dataset", sourceRows.length],
                      [preparedViewActive ? "Native prepared view" : "Current raw view", baseAnalysisRows.length],
                      ["After explicit filters", activeRows.length],
                      ["Complete across current setup", currentSetupCompleteRows],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <span className="text-[8px] font-medium text-slate-500">{label}</span>
                        <span className="text-[10px] font-semibold text-slate-900">{Number(value).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {filterResult.excludedCount > 0 ? <p className="mt-3 text-[8px] font-semibold text-violet-700">{filterResult.excludedCount.toLocaleString()} rows are excluded by explicit Analysis Lab filters.</p> : <p className="mt-3 text-[8px] text-slate-400">No explicit row exclusions are currently applied.</p>}
                  <p className="mt-2 text-[8px] leading-4 text-slate-400">“Complete across current setup” is a preview across the variables currently selected. Tests using pairwise or variable-wise missing-data handling may report a different N in their result table.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Keep rows where</p>
                      <p className="mt-1 text-[10px] text-slate-500">Rules are combined with AND and affect the analysis view only.</p>
                    </div>
                    {analysisFilters.length > 0 ? <button type="button" onClick={() => setAnalysisFilters([])} className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[8px] font-semibold text-slate-500 hover:text-slate-800"><RotateCcw className="h-3 w-3" />Reset</button> : null}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1.1fr)_minmax(120px,.8fr)_minmax(0,.9fr)_auto]">
                    <select value={filterVariable} onChange={(event) => setFilterVariable(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] text-slate-700">
                      {workbenchVariables.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                    </select>
                    <select value={filterOperator} onChange={(event) => setFilterOperator(event.target.value as AnalysisFilterOperator)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] text-slate-700">
                      <option value="equals">equals</option><option value="not_equals">does not equal</option><option value="contains">contains</option><option value="not_contains">does not contain</option><option value="gt">&gt;</option><option value="gte">≥</option><option value="lt">&lt;</option><option value="lte">≤</option><option value="is_missing">is missing</option><option value="not_missing">is not missing</option>
                    </select>
                    <input disabled={filterOperator === "is_missing" || filterOperator === "not_missing"} value={filterValue} onChange={(event) => setFilterValue(event.target.value)} placeholder="Value" className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] text-slate-700 disabled:bg-slate-50 disabled:text-slate-300" />
                    <button type="button" disabled={!filterVariable || (!(filterOperator === "is_missing" || filterOperator === "not_missing") && !filterValue.trim())} onClick={() => { setAnalysisFilters((current) => [...current, { id: workbenchId("filter"), variable: filterVariable, operator: filterOperator, value: filterValue, enabled: true }]); setFilterValue(""); }} className="flex items-center justify-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-30"><Plus className="h-3 w-3" />Add</button>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {analysisFilters.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-[8px] text-slate-400">No filters. Every row in the current data view is eligible for analysis.</div> : analysisFilters.map((rule) => {
                      const variable = workbenchVariables.find((item) => item.name === rule.variable);
                      const matched = filterResult.ruleMatches.find((item) => item.id === rule.id)?.matched;
                      return <div key={rule.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
                        <input type="checkbox" checked={rule.enabled !== false} onChange={(event) => setAnalysisFilters((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: event.target.checked } : item))} />
                        <span className="min-w-0 flex-1 text-[8px] font-semibold text-slate-700">{variable?.label || rule.variable} · {rule.operator.replaceAll("_", " ")}{rule.operator === "is_missing" || rule.operator === "not_missing" ? "" : ` · ${rule.value || ""}`}</span>
                        {matched !== undefined ? <span className="text-[7px] font-semibold text-slate-400">{matched.toLocaleString()} match alone</span> : null}
                        <button type="button" onClick={() => setAnalysisFilters((current) => current.filter((item) => item.id !== rule.id))} className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-300 hover:bg-white hover:text-slate-700"><X className="h-3 w-3" /></button>
                      </div>;
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {prepareDataTab === "derive" ? (
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <div><p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Transform numeric variable</p><p className="mt-1 text-[9px] text-slate-500">Create a new variable; the source is never overwritten.</p></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <select value={transformSource} onChange={(event) => { setTransformSource(event.target.value); if (!transformOutput) setTransformOutput(suggestedDerivedName(event.target.value, transformKind)); }} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700">{numericWorkbenchVariables.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}</select>
                      <select value={transformKind} onChange={(event) => { const value = event.target.value as AnalysisNumericTransformKind; setTransformKind(value); setTransformOutput(suggestedDerivedName(transformSource, value)); }} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700"><option value="zscore">Z-score</option><option value="center">Grand-mean center</option><option value="ln">Natural log</option><option value="log10">Log10</option><option value="sqrt">Square root</option><option value="absolute">Absolute value</option></select>
                      <input value={transformOutput} onChange={(event) => setTransformOutput(event.target.value)} placeholder={suggestedDerivedName(transformSource, transformKind)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700" />
                      <button type="button" disabled={!transformSource} onClick={() => { const output = transformOutput.trim() || suggestedDerivedName(transformSource, transformKind); setNumericTransforms((current) => [...current, { id: workbenchId("transform"), sourceVariable: transformSource, outputVariable: output, label: output.replaceAll("_", " "), kind: transformKind }]); setTransformOutput(""); }} className="rounded-lg bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-30">Add transformed variable</button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <div><p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Compute from two variables</p><p className="mt-1 text-[9px] text-slate-500">Useful for change scores, differences, averages and ratios.</p></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <select value={computedLeft} onChange={(event) => setComputedLeft(event.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700">{numericWorkbenchVariables.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}</select>
                      <select value={computedOperation} onChange={(event) => setComputedOperation(event.target.value as AnalysisComputedOperation)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700"><option value="difference">A − B</option><option value="sum">A + B</option><option value="mean">Mean(A, B)</option><option value="ratio">A ÷ B</option><option value="product">A × B</option></select>
                      <select value={computedRight} onChange={(event) => setComputedRight(event.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700">{numericWorkbenchVariables.filter((variable) => variable.name !== computedLeft).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}</select>
                      <input value={computedOutput} onChange={(event) => setComputedOutput(event.target.value)} placeholder="e.g. mood_change" className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700" />
                    </div>
                    <button type="button" disabled={!computedLeft || !computedRight || computedLeft === computedRight} onClick={() => { const output = computedOutput.trim() || suggestedDerivedName(computedLeft, `${computedOperation}_${computedRight}`); setComputedVariables((current) => [...current, { id: workbenchId("computed"), leftVariable: computedLeft, rightVariable: computedRight, outputVariable: output, label: output.replaceAll("_", " "), operation: computedOperation }]); setComputedOutput(""); }} className="mt-2 w-full rounded-lg bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-30">Add computed variable</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <div><p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Recode categories</p><p className="mt-1 text-[9px] text-slate-500">Create a new categorical variable. Unmapped values are retained.</p></div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <select value={recodeSource} onChange={(event) => setRecodeSource(event.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700">{recodeWorkbenchVariables.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}</select>
                      <input value={recodeOutput} onChange={(event) => setRecodeOutput(event.target.value)} placeholder={suggestedDerivedName(recodeSource, "recoded")} className="rounded-lg border border-slate-200 px-2.5 py-2 text-[9px] text-slate-700" />
                    </div>
                    <textarea value={recodeMappingsText} onChange={(event) => setRecodeMappingsText(event.target.value)} rows={4} placeholder={'1 = Control\n2 = Treatment\n3 = Treatment'} className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-2.5 py-2 font-mono text-[8px] leading-4 text-slate-700" />
                    <button type="button" disabled={!recodeSource || !recodeMappingsText.trim()} onClick={() => { const mappings = recodeMappingsText.split(/\r?\n/).map((line) => { const match = line.match(/^\s*(.*?)\s*(?:=>|=)\s*(.*?)\s*$/); return match ? { from: match[1], to: match[2] } : null; }).filter((item): item is { from: string; to: string } => Boolean(item && item.from !== "")); if (mappings.length === 0) return; const output = recodeOutput.trim() || suggestedDerivedName(recodeSource, "recoded"); setRecodeDefinitions((current) => [...current, { id: workbenchId("recode"), sourceVariable: recodeSource, outputVariable: output, label: output.replaceAll("_", " "), mappings, keepUnmapped: true }]); setRecodeOutput(""); setRecodeMappingsText(""); }} className="mt-2 w-full rounded-lg bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-30">Add recoded variable</button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/65 p-3.5">
                    <div className="flex items-center justify-between gap-2"><div><p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Analysis-view variables</p><p className="mt-1 text-[10px] font-semibold text-slate-900">{variableOperationResult.createdVariables.length} created</p></div>{variableOperationResult.createdVariables.length > 0 ? <button type="button" onClick={() => { setNumericTransforms([]); setComputedVariables([]); setRecodeDefinitions([]); setRepeatedOperations([]); }} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-slate-500"><RotateCcw className="h-3 w-3" />Reset</button> : null}</div>
                    <div className="mt-3 flex flex-wrap gap-1.5">{variableOperationResult.createdVariables.length > 0 ? variableOperationResult.createdVariables.map((name) => <span key={name} className="rounded-full border border-cyan-100 bg-white px-2.5 py-1 text-[8px] font-semibold text-cyan-800">{name}</span>) : <span className="text-[8px] text-slate-400">No custom variables have been created.</span>}</div>
                    {variableOperationResult.issues.length > 0 ? <div className="mt-3 space-y-1">{variableOperationResult.issues.map((issue) => <p key={issue} className="text-[8px] leading-4 text-violet-700">{issue}</p>)}</div> : null}
                    <p className="mt-3 border-t border-slate-200 pt-3 text-[8px] leading-4 text-slate-400">Derived variables exist only in the current Analysis Lab view. Raw PsyLattice data is never overwritten.</p>
                  </div>
                </div>
              </div>
            ) : null}

            {prepareDataTab === "repeated" ? (
              <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Repeated / longitudinal preparation</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-900">Create time-aware variables without changing the source data</p>
                      <p className="mt-1 text-[8px] leading-4 text-slate-500">Useful for ESM, ambulatory observations, sessions and trial-level data before mixed models or other analyses.</p>
                    </div>
                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[.07em] text-cyan-700">Non-destructive</span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="block"><span className="text-[8px] font-semibold text-slate-500">Participant / cluster</span><select value={repeatedClusterVariable} onChange={(event) => setRepeatedClusterVariable(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] text-slate-700"><option value="">Select cluster</option>{repeatedClusterVariables.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}</select></label>
                    <label className="block"><span className="text-[8px] font-semibold text-slate-500">Operation</span><select value={repeatedKind} onChange={(event) => setRepeatedKind(event.target.value as AnalysisRepeatedOperationKind)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] text-slate-700"><option value="observation_index">Observation index</option><option value="elapsed_time">Elapsed time</option><option value="cluster_mean">Person / cluster mean</option><option value="within_cluster_center">Within-person centered</option><option value="lag1">Lag 1 · previous observation</option><option value="change_from_previous">Change from previous</option></select></label>
                    {repeatedNeedsTime ? <label className="block"><span className="text-[8px] font-semibold text-slate-500">Time / order variable</span><select value={repeatedTimeVariable} onChange={(event) => setRepeatedTimeVariable(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] text-slate-700"><option value="">Select time/order</option>{repeatedTimeVariables.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}</select></label> : null}
                    {repeatedNeedsSource ? <label className="block"><span className="text-[8px] font-semibold text-slate-500">Numeric source</span><select value={repeatedSourceVariable} onChange={(event) => setRepeatedSourceVariable(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] text-slate-700"><option value="">Select source</option>{repeatedSourceVariables.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}</select></label> : null}
                    <label className="block sm:col-span-2"><span className="text-[8px] font-semibold text-slate-500">New variable name</span><input value={repeatedOutput} onChange={(event) => setRepeatedOutput(event.target.value)} placeholder={suggestedDerivedName(repeatedNeedsSource ? repeatedSourceVariable : repeatedTimeVariable || repeatedClusterVariable, repeatedKind)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[9px] text-slate-700" /></label>
                  </div>

                  <button type="button" disabled={!repeatedClusterVariable || (repeatedNeedsTime && !repeatedTimeVariable) || (repeatedNeedsSource && !repeatedSourceVariable)} onClick={() => { const source = repeatedNeedsSource ? repeatedSourceVariable : repeatedTimeVariable || repeatedClusterVariable; const output = repeatedOutput.trim() || suggestedDerivedName(source, repeatedKind); setRepeatedOperations((current) => [...current, { id: workbenchId("repeated"), clusterVariable: repeatedClusterVariable, timeVariable: repeatedNeedsTime ? repeatedTimeVariable : undefined, sourceVariable: repeatedNeedsSource ? repeatedSourceVariable : undefined, outputVariable: output, label: output.replaceAll("_", " "), kind: repeatedKind }]); setRepeatedOutput(""); }} className="mt-3 w-full rounded-lg bg-slate-950 px-3 py-2 text-[8px] font-semibold text-white disabled:opacity-30"><Plus className="mr-1 inline h-3 w-3" />Create repeated-data variable</button>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {[
                      ["Person mean", "Separates between-person differences from momentary variation."],
                      ["Within-person centered", "Expresses each observation relative to that participant's own mean."],
                      ["Lag / change", "Creates previous-observation or change scores after sorting within participant."],
                    ].map(([title, note]) => <div key={title} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"><p className="text-[8px] font-semibold text-slate-700">{title}</p><p className="mt-1 text-[7px] leading-3.5 text-slate-400">{note}</p></div>)}
                  </div>
                  <p className="mt-3 text-[8px] leading-4 text-slate-400">Datetime elapsed-time variables are expressed in hours. Numeric time/order variables retain their original units. Lag and change operations sort observations separately within each participant/cluster.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/65 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div><p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Repeated-data recipe</p><p className="mt-1 text-[10px] font-semibold text-slate-900">{repeatedOperations.length} operation{repeatedOperations.length === 1 ? "" : "s"}</p></div>
                    {repeatedOperations.length > 0 ? <button type="button" onClick={() => setRepeatedOperations([])} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-slate-500"><RotateCcw className="h-3 w-3" />Reset</button> : null}
                  </div>
                  <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                    {repeatedOperations.length > 0 ? repeatedOperations.map((operation) => {
                      const labels: Record<AnalysisRepeatedOperationKind, string> = { observation_index: "Observation index", elapsed_time: "Elapsed time", cluster_mean: "Person / cluster mean", within_cluster_center: "Within-person centered", lag1: "Lag 1", change_from_previous: "Change from previous" };
                      return <div key={operation.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[9px] font-semibold text-slate-800">{operation.outputVariable}</p><p className="mt-1 text-[8px] text-slate-500">{labels[operation.kind]}</p></div><button type="button" onClick={() => setRepeatedOperations((current) => current.filter((item) => item.id !== operation.id))} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500"><X className="h-3 w-3" /></button></div><p className="mt-2 text-[7px] leading-3.5 text-slate-400">Cluster: {operation.clusterVariable}{operation.timeVariable ? ` · Order: ${operation.timeVariable}` : ""}{operation.sourceVariable ? ` · Source: ${operation.sourceVariable}` : ""}</p></div>;
                    }) : <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center"><p className="text-[9px] font-semibold text-slate-500">No repeated-data variables yet</p><p className="mt-1 text-[8px] leading-4 text-slate-400">Create only the variables your hypothesis or model actually needs.</p></div>}
                  </div>
                  <div className="mt-3 border-t border-slate-200 pt-3"><p className="text-[8px] font-semibold text-slate-700">Designed for the unified Analysis Lab</p><p className="mt-1 text-[8px] leading-4 text-slate-400">Once created, these variables appear in the normal Variables panel and can be used in Descriptives, plots, regression, mixed models and other compatible analyses.</p></div>
                </div>
              </div>
            ) : null}

            {prepareDataTab === "missing" ? (
              <div className="mt-3 space-y-3">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,.76fr)_minmax(0,1.24fr)]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/65 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Analysis sample audit</p>
                        <p className="mt-1 text-[9px] leading-4 text-slate-500">A transparent record of how the current analysis sample is formed.</p>
                      </div>
                      <button type="button" onClick={() => void copyTableSpec(sampleAuditTableSpec(), "Sample audit copied")} className="flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-800"><Copy className="h-3 w-3" />Copy</button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ["Source", sampleAudit.sourceRows],
                        ["Working view", sampleAudit.workingRows],
                        ["After filters", sampleAudit.afterFiltersRows],
                        ["Complete setup", sampleAudit.completeAcrossSetupRows],
                      ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-slate-200 bg-white px-2.5 py-2"><p className="text-[7px] font-semibold uppercase tracking-[.06em] text-slate-400">{label}</p><p className="mt-1 text-[12px] font-semibold text-slate-900">{Number(value).toLocaleString()}</p></div>)}
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"><span className="text-[8px] text-slate-500">Explicitly excluded by filters</span><span className="text-[9px] font-semibold text-slate-800">{sampleAudit.explicitlyExcludedRows.toLocaleString()}</span></div>
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"><span className="text-[8px] text-slate-500">Incomplete across current setup</span><span className="text-[9px] font-semibold text-slate-800">{sampleAudit.incompleteAcrossSetupRows.toLocaleString()}</span></div>
                    </div>
                    {sampleAudit.requiredVariables.length > 0 ? <div className="mt-3 rounded-xl border border-cyan-100 bg-white p-3"><p className="text-[8px] font-semibold text-cyan-900">Current setup variables</p><p className="mt-1 text-[8px] leading-4 text-slate-500">{sampleAudit.requiredVariables.map((item) => item.label).join(" · ")}</p></div> : <p className="mt-3 text-[8px] leading-4 text-slate-400">Select variables in an analysis to make the complete-case preview specific to that setup.</p>}
                    <p className="mt-3 text-[8px] leading-4 text-slate-400">This is a reproducibility preview. Pairwise correlations, descriptives and other procedures may legitimately use a different N and continue to report their own actual sample size.</p>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3.5 py-3">
                      <div><p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Variable missingness</p><p className="mt-1 text-[8px] text-slate-400">Current view after explicit filters.</p></div>
                      <button type="button" onClick={() => void copyTableSpec(missingnessVariableTableSpec(), "Missingness table copied")} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-800"><Copy className="h-3 w-3" />Copy table</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full border-collapse text-left">
                        <thead className="sticky top-0 bg-slate-50"><tr><th className="px-3 py-2 text-[7px] font-semibold uppercase tracking-[.06em] text-slate-400">Variable</th><th className="px-3 py-2 text-right text-[7px] font-semibold uppercase tracking-[.06em] text-slate-400">Valid</th><th className="px-3 py-2 text-right text-[7px] font-semibold uppercase tracking-[.06em] text-slate-400">Missing</th><th className="px-3 py-2 text-right text-[7px] font-semibold uppercase tracking-[.06em] text-slate-400">Missing %</th></tr></thead>
                        <tbody>{missingnessProfile.variables.slice(0, 40).map((item) => <tr key={item.variable} className="border-t border-slate-100"><td className="max-w-[260px] truncate px-3 py-2 text-[8px] font-medium text-slate-700" title={item.variable}>{item.label}</td><td className="px-3 py-2 text-right text-[8px] text-slate-500">{item.valid.toLocaleString()}</td><td className="px-3 py-2 text-right text-[8px] text-slate-500">{item.missing.toLocaleString()}</td><td className="px-3 py-2 text-right text-[8px] font-semibold text-slate-700">{item.missingPercent.toFixed(1)}%</td></tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  <CopyableFigureSurface title="Figure · Missingness by variable" caption={`Missing percentage by variable in the current filtered Analysis Lab view (N = ${missingnessProfile.totalRows}).`}>
                    <MissingnessBarPlot profile={missingnessProfile} />
                  </CopyableFigureSurface>
                  <CopyableFigureSurface title="Figure · Pairwise available sample size" caption={`Pairwise non-missing sample sizes for ${pairwiseAvailability.variables.length} variables in the current filtered view (N = ${pairwiseAvailability.totalRows}).`}>
                    <PairwiseAvailabilityHeatmap result={pairwiseAvailability} />
                  </CopyableFigureSurface>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3.5 py-3">
                      <div><p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Missing-data patterns</p><p className="mt-1 text-[8px] leading-4 text-slate-400">Most common observed/missing combinations across the current setup variables.</p></div>
                      <button type="button" onClick={() => void copyTableSpec(missingnessPatternsTableSpec(), "Missingness patterns copied")} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-800"><Copy className="h-3 w-3" />Copy patterns</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full border-collapse text-left">
                        <thead className="sticky top-0 bg-slate-50"><tr>{["Pattern", "N", "%", "Missing", "Missing variables"].map((header) => <th key={header} className="px-3 py-2 text-[7px] font-semibold uppercase tracking-[.06em] text-slate-400">{header}</th>)}</tr></thead>
                        <tbody>{missingnessPatterns.patterns.map((pattern, index) => <tr key={pattern.signature} className="border-t border-slate-100"><td className="px-3 py-2 text-[8px] font-semibold text-slate-700">{index + 1}</td><td className="px-3 py-2 text-[8px] text-slate-500">{pattern.count.toLocaleString()}</td><td className="px-3 py-2 text-[8px] text-slate-500">{formatNumber(pattern.percent, 1)}%</td><td className="px-3 py-2 text-[8px] font-semibold text-slate-700">{pattern.missingCount}</td><td className="max-w-[320px] px-3 py-2 text-[8px] leading-4 text-slate-500">{pattern.missingLabels.length ? pattern.missingLabels.join(", ") : "None · complete"}</td></tr>)}</tbody>
                      </table>
                    </div>
                    {missingnessPatterns.otherPatternCount > 0 ? <div className="border-t border-slate-100 px-3.5 py-2.5 text-[8px] text-slate-400">{missingnessPatterns.otherPatternCount} additional less-common patterns represent {missingnessPatterns.otherRowCount.toLocaleString()} rows.</div> : null}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3.5 py-3">
                      <div><p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-400">Pairwise N matrix</p><p className="mt-1 text-[8px] leading-4 text-slate-400">Useful before correlation and multivariable modelling when missingness differs across variables.</p></div>
                      <button type="button" disabled={pairwiseAvailability.variables.length === 0} onClick={() => void copyTableSpec(pairwiseAvailabilityTableSpec(), "Pairwise N matrix copied")} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-800 disabled:opacity-30"><Copy className="h-3 w-3" />Copy matrix</button>
                    </div>
                    <div className="overflow-x-auto p-3.5">
                      {pairwiseAvailability.variables.length > 0 ? <table className="min-w-max border-collapse text-center"><thead><tr><th className="px-2 py-2 text-left text-[7px] font-semibold uppercase tracking-[.06em] text-slate-400">Variable</th>{pairwiseAvailability.variables.map((variable) => <th key={variable.name} className="max-w-[90px] px-2 py-2 text-[7px] font-semibold text-slate-400" title={variable.label}>{visualizationShortLabel(variable.label, 10)}</th>)}</tr></thead><tbody>{pairwiseAvailability.variables.map((rowVariable) => <tr key={rowVariable.name} className="border-t border-slate-100"><td className="max-w-[180px] px-2 py-2 text-left text-[8px] font-medium text-slate-700">{visualizationShortLabel(rowVariable.label, 24)}</td>{pairwiseAvailability.variables.map((columnVariable) => { const cell = pairwiseAvailability.cells.find((item) => item.rowVariable === rowVariable.name && item.columnVariable === columnVariable.name); return <td key={columnVariable.name} className="px-2 py-2 text-[8px] text-slate-500">{cell?.n ?? 0}</td>; })}</tr>)}</tbody></table> : <p className="py-8 text-center text-[8px] text-slate-400">No variables available.</p>}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/45 px-3.5 py-3 text-[8px] leading-4 text-cyan-950/75">PsyLattice reports missingness and sample flow transparently but does not automatically label data MCAR/MAR/MNAR or impute values. Those decisions depend on study design and modelling assumptions. Analysis-specific N remains authoritative in each result.</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className={`grid ${workspaceGridClass} ${
          isFullscreen ? "min-h-0 flex-1 overflow-hidden" : "min-h-[690px]"
        }`}
      >
        <aside
          className={`border-b border-slate-200 bg-[#f8fafb] xl:border-b-0 xl:border-r ${
            analysisSidebarCollapsed ? "p-2" : "p-4"
          } ${isFullscreen ? "min-h-0 overflow-y-auto" : "xl:max-h-[calc(100vh-160px)] xl:overflow-y-auto xl:overscroll-contain"}`}
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

              <div className="mt-4 w-full overflow-hidden rounded-[22px] border border-slate-200 bg-[linear-gradient(145deg,#f7fcfd_0%,#ffffff_60%,#f8fafc_100%)] p-2 shadow-[0_8px_24px_rgba(15,23,42,.06)] ring-1 ring-cyan-100/50">
                <div className="grid w-full grid-cols-3 gap-1">
                  {analysisNavCategories.slice(0, 3).map((category) => {
                    const selected = analysisCategoryTab === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setAnalysisCategoryTab(category.id)}
                        className={`min-w-0 w-full whitespace-nowrap rounded-[13px] border px-1 py-2.5 text-center text-[9px] font-semibold leading-none transition-all duration-200 2xl:text-[10px] ${
                          selected
                            ? "border-cyan-300 bg-white text-slate-950 shadow-[0_5px_14px_rgba(15,23,42,.10)] ring-1 ring-cyan-200/70"
                            : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white/80 hover:text-slate-800"
                        }`}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mx-auto mt-1 grid w-[68%] min-w-0 grid-cols-2 gap-1">
                  {analysisNavCategories.slice(3).map((category) => {
                    const selected = analysisCategoryTab === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setAnalysisCategoryTab(category.id)}
                        className={`min-w-0 w-full whitespace-nowrap rounded-[13px] border px-1 py-2.5 text-center text-[9px] font-semibold leading-none transition-all duration-200 2xl:text-[10px] ${
                          selected
                            ? "border-cyan-300 bg-white text-slate-950 shadow-[0_5px_14px_rgba(15,23,42,.10)] ring-1 ring-cyan-200/70"
                            : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white/80 hover:text-slate-800"
                        }`}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                {visibleAnalysisCatalogue.map((analysis) => {
                  const selected = analysis.id === activeAnalysis;
                  return (
                    <button
                      key={analysis.id}
                      type="button"
                      disabled={!analysis.available}
                      onClick={() => {
                        setActiveAnalysis(analysis.id);
                        if (analysis.id === "mixed" && sourceMode === "study" && preparation.canPrepare) {
                          setUsePreparedData(false);
                        }
                      }}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        selected
                          ? "border-slate-900 bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,.14)]"
                          : analysis.available
                            ? "border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/40"
                            : "cursor-default border-transparent bg-transparent text-slate-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[12px] font-semibold">{analysis.title}</p>
                          <p className={`mt-1 text-[9px] leading-4 ${selected ? "text-slate-300" : "text-slate-500"}`}>
                            {analysis.description}
                          </p>
                        </div>
                        {analysis.available ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            {analysis.badge ? (
                              <span className={`rounded-full px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[.06em] ${selected ? "bg-white/10 text-cyan-100" : "border border-cyan-100 bg-cyan-50 text-cyan-700"}`}>
                                {analysis.badge}
                              </span>
                            ) : null}
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5" />
                          </div>
                        ) : null}
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
                  Statistics are computed locally from the selected dataset. AI explains verified results; it does not calculate them.
                </p>
              </div>
            </>
          )}
        </aside>

        <aside
          className={`border-b border-slate-200 bg-white xl:border-b-0 xl:border-r ${
            variablesSidebarCollapsed ? "p-2" : "p-4"
          } ${isFullscreen ? "min-h-0 overflow-y-auto" : "xl:max-h-[calc(100vh-160px)] xl:overflow-y-auto xl:overscroll-contain"}`}
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
              {activeAnalysis === "cognitive" ? (
                <div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Cognitive setup</p>
                      <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[.08em] text-cyan-700">PsyLattice native</span>
                    </div>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Task-aware analysis built on the common cognitive trial / event contract.</p>
                  </div>

                  {sourceMode === "study" && cognitiveResult.dataLevel === "unknown" && (cognitiveTrialDatasetOption || cognitiveSummaryDatasetOption) ? (
                    <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                      <p className="text-[9px] font-semibold text-cyan-900">Choose a cognitive dataset</p>
                      <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">The current dataset is not cognitive trial / summary data. Switch without leaving Analysis Lab.</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cognitiveTrialDatasetOption ? (
                          <button type="button" onClick={() => onDatasetChange?.(cognitiveTrialDatasetOption.value)} className="rounded-full border border-cyan-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-cyan-800">Use cognitive trials</button>
                        ) : null}
                        {cognitiveSummaryDatasetOption ? (
                          <button type="button" onClick={() => onDatasetChange?.(cognitiveSummaryDatasetOption.value)} className="rounded-full border border-cyan-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-cyan-800">Use participant summaries</button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Task</span>
                      <select value={cognitiveTask} onChange={(event) => setCognitiveTask(event.target.value)} disabled={cognitiveTaskOptions.length === 0} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700 disabled:opacity-50">
                        {cognitiveTaskOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label} · {option.participantCount} participant{option.participantCount === 1 ? "" : "s"}</option>
                        ))}
                      </select>
                    </label>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-semibold text-slate-600">{cognitiveResult.dataLevel === "trial" ? "Trial level" : cognitiveResult.dataLevel === "participant_summary" ? "Participant summary" : "Schema not detected"}</span>
                        {cognitiveResult.paradigm && cognitiveResult.paradigm !== "generic" ? <span className="rounded-full border border-violet-100 bg-violet-50 px-2 py-1 text-[8px] font-semibold text-violet-700">{cognitiveResult.paradigm.replaceAll("_", " ")}</span> : null}
                      </div>
                      <p className="mt-2 text-[8px] leading-4 text-slate-400">The generic recipe uses participant, task, condition, response, correctness and RT fields. Known task recipes add task-specific metrics without changing the Analysis Lab core.</p>
                    </div>

                    {cognitiveResult.dataLevel === "trial" ? (
                      <>
                        <div className="border-t border-slate-100 pt-4">
                          <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">RT cleaning</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <label className="block"><span className="text-[8px] text-slate-400">Minimum ms</span><input type="number" min={0} value={cognitiveRtMin} onChange={(event) => setCognitiveRtMin(Math.max(0, Number(event.target.value) || 0))} className="mt-1 w-full border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700" /></label>
                            <label className="block"><span className="text-[8px] text-slate-400">Maximum ms</span><input type="number" min={cognitiveRtMin} value={cognitiveRtMax} onChange={(event) => setCognitiveRtMax(Math.max(cognitiveRtMin, Number(event.target.value) || cognitiveRtMin))} className="mt-1 w-full border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700" /></label>
                          </div>
                          <label className="mt-2 flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-[9px] text-slate-600"><input type="checkbox" checked={cognitiveCorrectRtOnly} onChange={(event) => setCognitiveCorrectRtOnly(event.target.checked)} className="mt-0.5" /><span><strong className="font-semibold text-slate-800">Correct trials only</strong><br /><span className="text-[8px] leading-4 text-slate-400">Use correct trials for generic RT summaries. Task-specific metrics keep their own scoring rules.</span></span></label>
                        </div>

                        {cognitiveResult.conditions.length > 1 ? (
                          <label className="block border-t border-slate-100 pt-4">
                            <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reference condition</span>
                            <select value={cognitiveReferenceCondition} onChange={(event) => setCognitiveReferenceCondition(event.target.value)} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                              {cognitiveResult.conditions.map((condition) => <option key={condition.condition} value={condition.condition}>{condition.condition}</option>)}
                            </select>
                            <p className="mt-1 text-[8px] leading-4 text-slate-400">Condition effects are computed within participant as condition − reference, with Holm-adjusted paired comparisons.</p>
                          </label>
                        ) : null}
                      </>
                    ) : null}

                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Participant review flags</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <label className="block"><span className="text-[8px] text-slate-400">Min scorable trials</span><input type="number" min={0} value={cognitiveMinTrials} onChange={(event) => setCognitiveMinTrials(Math.max(0, Number(event.target.value) || 0))} className="mt-1 w-full border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700" /></label>
                        <label className="block"><span className="text-[8px] text-slate-400">Min accuracy %</span><input type="number" min={0} max={100} value={Math.round(cognitiveMinAccuracy * 100)} onChange={(event) => setCognitiveMinAccuracy(Math.min(1, Math.max(0, (Number(event.target.value) || 0) / 100)))} className="mt-1 w-full border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700" /></label>
                        <label className="block"><span className="text-[8px] text-slate-400">Max omissions %</span><input type="number" min={0} max={100} value={Math.round(cognitiveMaxOmissionRate * 100)} onChange={(event) => setCognitiveMaxOmissionRate(Math.min(1, Math.max(0, (Number(event.target.value) || 0) / 100)))} className="mt-1 w-full border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700" /></label>
                        <label className="block"><span className="text-[8px] text-slate-400">Max RT excluded %</span><input type="number" min={0} max={100} value={Math.round(cognitiveMaxRtExclusionRate * 100)} onChange={(event) => setCognitiveMaxRtExclusionRate(Math.min(1, Math.max(0, (Number(event.target.value) || 0) / 100)))} className="mt-1 w-full border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-700" /></label>
                      </div>
                      <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50/60 p-2.5 text-[8px] leading-4 text-amber-800">Flags are review cues only. PsyLattice never excludes a participant automatically.</div>
                    </div>
                  </div>
                </div>
              ) : activeAnalysis === "power" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Power & sample size</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Plan a study from an expected effect or estimate achieved power for a proposed/observed sample.</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    <button type="button" onClick={() => setPowerMode("apriori")} className={`rounded-xl px-3 py-2.5 text-[9px] font-semibold ${powerMode === "apriori" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400"}`}>A priori</button>
                    <button type="button" onClick={() => setPowerMode("achieved")} className={`rounded-xl px-3 py-2.5 text-[9px] font-semibold ${powerMode === "achieved" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400"}`}>Achieved power</button>
                  </div>

                  <div className="mt-4">
                    <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Test family</span>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        ["independent_t", "Independent t", "Cohen d"],
                        ["paired_t", "Paired t", "Cohen dz"],
                        ["correlation", "Correlation", "Expected r"],
                        ["one_way_anova", "One-way ANOVA", "Cohen f"],
                      ].map(([value, label, detail]) => (
                        <button key={value} type="button" onClick={() => setPowerTest(value as PowerAnalysisTest)} className={`rounded-xl border px-3 py-2.5 text-left ${powerTest === value ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                          <span className="block text-[9px] font-semibold text-slate-800">{label}</span><span className="mt-0.5 block text-[8px] text-slate-400">{detail}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">{powerTest === "correlation" ? "Expected r" : powerTest === "one_way_anova" ? "Cohen f" : powerTest === "paired_t" ? "Cohen dz" : "Cohen d"}</span>
                      <input type="number" step="0.01" min="0.001" max={powerTest === "correlation" ? 0.999 : undefined} value={powerEffectSize} onChange={(event) => setPowerEffectSize(Number(event.target.value))} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700" />
                    </label>
                    <label className="block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Alpha</span>
                      <input type="number" step="0.001" min="0.001" max="0.499" value={powerAlpha} onChange={(event) => setPowerAlpha(Number(event.target.value))} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700" />
                    </label>
                  </div>

                  {powerTest !== "one_way_anova" ? (
                    <div className="mt-4">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Alternative</span>
                      <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <button type="button" onClick={() => setPowerTails("two")} className={`rounded-lg px-2.5 py-2 text-[9px] font-semibold ${powerTails === "two" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}>Two-sided</button>
                        <button type="button" onClick={() => setPowerTails("one")} className={`rounded-lg px-2.5 py-2 text-[9px] font-semibold ${powerTails === "one" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}>One-sided</button>
                      </div>
                    </div>
                  ) : (
                    <label className="mt-4 block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Number of groups</span>
                      <input type="number" min="2" max="20" step="1" value={powerGroups} onChange={(event) => setPowerGroups(Math.max(2, Number(event.target.value)))} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700" />
                    </label>
                  )}

                  {powerMode === "apriori" ? (
                    <label className="mt-4 block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Target power</span>
                      <input type="number" step="0.01" min="0.51" max="0.999" value={powerTarget} onChange={(event) => setPowerTarget(Number(event.target.value))} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700" />
                    </label>
                  ) : (
                    <label className="mt-4 block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Total sample size</span>
                      <input type="number" step="1" min="2" value={powerSampleSize} onChange={(event) => setPowerSampleSize(Math.max(2, Number(event.target.value)))} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700" />
                    </label>
                  )}

                  {powerMode === "apriori" ? (
                    <label className="mt-4 block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Expected attrition / exclusion</span>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input type="number" step="1" min="0" max="80" value={Math.round(powerLossRate * 100)} onChange={(event) => setPowerLossRate(Math.max(0, Math.min(0.8, Number(event.target.value) / 100)))} className="w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700" />
                        <span className="text-[10px] font-semibold text-slate-400">%</span>
                      </div>
                    </label>
                  ) : null}

                  <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                    <p className="text-[9px] font-semibold text-cyan-900">Planning utility, not a design decision</p>
                    <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">Inflate the final recruitment target separately for expected attrition, exclusions, clustering, repeated follow-ups or other design losses. Effect-size assumptions should come from theory, prior evidence or a justified smallest effect of interest.</p>
                  </div>
                </div>
              ) : activeAnalysis === "diagnostics" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Diagnostics setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Screen distributions, outliers and variance assumptions before interpreting inferential tests.</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setDiagnosticsMode("distribution")}
                      className={`rounded-lg px-2.5 py-2 text-[9px] font-semibold ${diagnosticsMode === "distribution" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                    >
                      Distribution
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiagnosticsMode("homogeneity")}
                      className={`rounded-lg px-2.5 py-2 text-[9px] font-semibold ${diagnosticsMode === "homogeneity" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                    >
                      Variance
                    </button>
                  </div>

                  {diagnosticsMode === "distribution" ? (
                    <>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Variables</span>
                        <span className="text-[8px] font-semibold text-cyan-700">{diagnosticsVariables.length} selected · up to 6 recommended</span>
                      </div>
                      <div className="relative mt-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          value={variableSearch}
                          onChange={(event) => setVariableSearch(event.target.value)}
                          placeholder="Find numeric variable..."
                          className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none"
                        />
                      </div>
                      <div className="mt-2 max-h-[360px] space-y-1 overflow-y-auto pr-1">
                        {diagnosticsNumericCandidates
                          .filter((variable) => {
                            const query = variableSearch.trim().toLowerCase();
                            return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                          })
                          .map((variable) => {
                            const checked = selectedVariables.includes(variable.name);
                            const blocked = !checked && diagnosticsVariables.length >= 6;
                            return (
                              <button
                                key={variable.name}
                                type="button"
                                disabled={blocked}
                                onClick={() => toggleVariable(variable.name)}
                                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-cyan-300 bg-cyan-50/70" : blocked ? "cursor-not-allowed border-transparent bg-white opacity-40" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}
                              >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}>
                                  <Check className="h-3 w-3" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span>
                                  <span className="block truncate font-mono text-[8px] text-slate-400">{variable.name}</span>
                                </span>
                                <VariableTypePill variable={variable} />
                              </button>
                            );
                          })}
                      </div>
                      <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
                        <p className="text-[9px] font-semibold text-cyan-800">Visual + statistical screening</p>
                        <p className="mt-1 text-[8px] leading-4 text-slate-500">PsyLattice combines Q–Q plots, histograms, skewness/kurtosis, Jarque–Bera and Tukey outlier fences. No single diagnostic is treated as an automatic pass/fail rule.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="mt-4 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Outcome</span>
                        <select
                          value={diagnosticsOutcomeVariable}
                          onChange={(event) => setDiagnosticsOutcomeVariable(event.target.value)}
                          className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]"
                        >
                          {diagnosticsNumericCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Grouping factor</span>
                        <select
                          value={diagnosticsFactorVariable}
                          onChange={(event) => setDiagnosticsFactorVariable(event.target.value)}
                          className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]"
                        >
                          {diagnosticsFactorCandidates.filter((variable) => variable.name !== diagnosticsOutcomeVariable).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <div className="mt-4">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Variance test</span>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setVarianceTestCenter("median")}
                            className={`rounded-xl border px-3 py-2.5 text-left ${varianceTestCenter === "median" ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white"}`}
                          >
                            <span className="block text-[9px] font-semibold text-slate-800">Brown–Forsythe</span>
                            <span className="mt-0.5 block text-[8px] text-slate-400">Median centred · recommended</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setVarianceTestCenter("mean")}
                            className={`rounded-xl border px-3 py-2.5 text-left ${varianceTestCenter === "mean" ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white"}`}
                          >
                            <span className="block text-[9px] font-semibold text-slate-800">Levene</span>
                            <span className="mt-0.5 block text-[8px] text-slate-400">Mean centred · classical</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : activeAnalysis === "visualizations" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Visualization setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Build publication-friendly exploratory plots from the current Analysis Lab sample without changing the data.</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    {[
                      ["scatter", "Scatter"],
                      ["box", "Box"],
                      ["violin", "Violin"],
                      ["means", "Means"],
                      ["interaction", "Interaction"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setVisualizationMode(value as VisualizationMode)}
                        className={`rounded-lg px-2 py-2 text-[8px] font-semibold ${visualizationMode === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {visualizationMode === "scatter" ? (
                    <>
                      <label className="mt-4 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">X axis</span>
                        <select value={visualizationXVariable} onChange={(event) => setVisualizationXVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          {visualizationNumericCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Y axis</span>
                        <select value={visualizationYVariable} onChange={(event) => setVisualizationYVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          {visualizationNumericCandidates.filter((variable) => variable.name !== visualizationXVariable).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Group / colour</span>
                        <select value={visualizationGroupVariable} onChange={(event) => setVisualizationGroupVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          <option value="">No grouping</option>
                          {visualizationFactorCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-600">
                        <input type="checkbox" checked={visualizationShowTrend} onChange={(event) => setVisualizationShowTrend(event.target.checked)} className="rounded border-slate-300" />
                        Show linear trend line{visualizationGroupVariable ? "s by group" : ""}
                      </label>
                    </>
                  ) : visualizationMode === "box" || visualizationMode === "violin" ? (
                    <>
                      <label className="mt-4 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Outcome</span>
                        <select value={visualizationOutcomeVariable} onChange={(event) => setVisualizationOutcomeVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          {visualizationNumericCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Split by</span>
                        <select value={visualizationGroupVariable} onChange={(event) => setVisualizationGroupVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          <option value="">All observations</option>
                          {visualizationFactorCandidates.filter((variable) => variable.name !== visualizationOutcomeVariable).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
                        <p className="text-[9px] font-semibold text-cyan-800">{visualizationMode === "box" ? "Tukey box plot" : "Kernel-density violin"}</p>
                        <p className="mt-1 text-[8px] leading-4 text-slate-500">{visualizationMode === "box" ? "Shows median, IQR, 1.5×IQR whiskers, outliers and the group mean." : "Shows the distribution shape on a common density scale, with the median and interquartile range overlaid."}</p>
                      </div>
                    </>
                  ) : visualizationMode === "means" ? (
                    <>
                      <label className="mt-4 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Outcome</span>
                        <select value={visualizationOutcomeVariable} onChange={(event) => setVisualizationOutcomeVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          {visualizationNumericCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Grouping factor</span>
                        <select value={visualizationGroupVariable} onChange={(event) => setVisualizationGroupVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          {visualizationFactorCandidates.filter((variable) => variable.name !== visualizationOutcomeVariable).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-600">
                        <input type="checkbox" checked={visualizationShowCI} onChange={(event) => setVisualizationShowCI(event.target.checked)} className="rounded border-slate-300" />
                        Show 95% confidence intervals
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="mt-4 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Outcome</span>
                        <select value={visualizationOutcomeVariable} onChange={(event) => setVisualizationOutcomeVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          {visualizationNumericCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">X-axis factor</span>
                        <select value={visualizationGroupVariable} onChange={(event) => setVisualizationGroupVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          {visualizationFactorCandidates.filter((variable) => variable.name !== visualizationTraceVariable).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Trace / line factor</span>
                        <select value={visualizationTraceVariable} onChange={(event) => setVisualizationTraceVariable(event.target.value)} className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]">
                          {visualizationFactorCandidates.filter((variable) => variable.name !== visualizationGroupVariable).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-600">
                        <input type="checkbox" checked={visualizationShowCI} onChange={(event) => setVisualizationShowCI(event.target.checked)} className="rounded border-slate-300" />
                        Show cell-mean 95% confidence intervals
                      </label>
                      <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-3 text-[8px] leading-4 text-violet-800">The interaction plot is descriptive. Use factorial ANOVA/ANCOVA, regression, or mixed models for the formal interaction test.</div>
                    </>
                  )}
                </div>
              ) : activeAnalysis === "categorical" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Categorical setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Cross-tabulate two categorical variables and test whether their observed distributions are associated.</p>
                  </div>

                  <label className="mt-4 block">
                    <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Rows</span>
                    <select
                      value={categoricalRowVariable}
                      onChange={(event) => {
                        const value = event.target.value;
                        setCategoricalRowVariable(value);
                        if (categoricalColumnVariable === value) {
                          setCategoricalColumnVariable(categoricalCandidates.find((variable) => variable.name !== value)?.name || "");
                        }
                      }}
                      className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]"
                    >
                      {categoricalCandidates.length === 0 && <option value="">No categorical variables available</option>}
                      {categoricalCandidates.map((variable) => (
                        <option key={variable.name} value={variable.name}>{variable.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-3 block">
                    <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Columns</span>
                    <select
                      value={categoricalColumnVariable}
                      onChange={(event) => setCategoricalColumnVariable(event.target.value)}
                      className="mt-2 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px]"
                    >
                      {categoricalCandidates.filter((variable) => variable.name !== categoricalRowVariable).length === 0 && <option value="">Choose another variable</option>}
                      {categoricalCandidates.filter((variable) => variable.name !== categoricalRowVariable).map((variable) => (
                        <option key={variable.name} value={variable.name}>{variable.label}</option>
                      ))}
                    </select>
                  </label>

                  <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                    <p className="text-[9px] font-semibold text-cyan-900">Automatic categorical diagnostics</p>
                    <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">PsyLattice reports Pearson χ², expected counts, adjusted standardized residuals and Cramér's V. For 2×2 tables it also reports Fisher's exact test, Phi and an odds ratio with a 95% confidence interval.</p>
                  </div>

                  {categoricalAssociationResult && !categoricalAssociationResult.issue ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-slate-600">{categoricalAssociationResult.rowLevels.length} × {categoricalAssociationResult.columnLevels.length}</span>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-slate-600">N = {categoricalAssociationResult.totalN}</span>
                      <span className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold ${categoricalAssociationResult.assumptionFlag === "ok" ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-violet-200 bg-violet-50 text-violet-700"}`}>{categoricalAssociationResult.assumptionFlag === "ok" ? "Expected counts look adequate" : "Review sparse cells"}</span>
                    </div>
                  ) : null}

                  <p className="mt-4 text-[8px] leading-4 text-slate-400">Variables with 2–30 observed levels are offered here, including numeric-coded categories. Missing pairs are excluded only from this association.</p>
                </div>
              ) : activeAnalysis === "reliability" ? (
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
              ) : activeAnalysis === "factor" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Factor analysis setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Explore latent questionnaire/item structure using factorability diagnostics, extraction and rotation.</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Items</span>
                    <span className="text-[8px] font-semibold text-cyan-700">{factorVariables.length} selected</span>
                  </div>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={variableSearch}
                      onChange={(event) => setVariableSearch(event.target.value)}
                      placeholder="Find questionnaire/item variable..."
                      className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none"
                    />
                  </div>
                  <div className="mt-2 max-h-[260px] space-y-1 overflow-y-auto pr-1">
                    {factorCandidates
                      .filter((variable) => {
                        const query = variableSearch.trim().toLowerCase();
                        return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                      })
                      .map((variable) => {
                        const checked = selectedVariables.includes(variable.name);
                        return (
                          <button
                            key={variable.name}
                            type="button"
                            onClick={() => toggleVariable(variable.name)}
                            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-cyan-300 bg-cyan-50/70" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}
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

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Factors</span>
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, factorVariables.length - 1)}
                          value={factorCount}
                          onChange={(event) => setFactorCount(Math.max(1, Math.min(Math.max(1, factorVariables.length - 1), Number(event.target.value) || 1)))}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Suppress |loading| below</span>
                        <select
                          value={factorLoadingCutoff}
                          onChange={(event) => setFactorLoadingCutoff(Number(event.target.value))}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {[0, 0.2, 0.3, 0.4, 0.5].map((value) => <option key={value} value={value}>{value.toFixed(2)}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Extraction</span>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setFactorExtraction("principal_axis")} className={`rounded-xl border px-3 py-2.5 text-left ${factorExtraction === "principal_axis" ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white"}`}>
                          <span className="block text-[9px] font-semibold text-slate-800">Principal axis</span>
                          <span className="mt-0.5 block text-[8px] text-slate-400">Common-factor extraction</span>
                        </button>
                        <button type="button" onClick={() => setFactorExtraction("principal_components")} className={`rounded-xl border px-3 py-2.5 text-left ${factorExtraction === "principal_components" ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white"}`}>
                          <span className="block text-[9px] font-semibold text-slate-800">Components</span>
                          <span className="mt-0.5 block text-[8px] text-slate-400">PCA-style extraction</span>
                        </button>
                      </div>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Rotation</span>
                      <select value={factorRotation} onChange={(event) => setFactorRotation(event.target.value as FactorRotationMethod)} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                        <option value="promax">Promax · correlated factors</option>
                        <option value="varimax">Varimax · orthogonal factors</option>
                        <option value="none">No rotation</option>
                      </select>
                    </label>

                    <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-600">
                      <input type="checkbox" checked={factorSortLoadings} onChange={(event) => setFactorSortLoadings(event.target.checked)} className="rounded border-slate-300" />
                      Sort items by strongest factor loading
                    </label>
                  </div>

                  <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                    <p className="text-[9px] font-semibold text-cyan-900">Factorability first</p>
                    <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">PsyLattice reports KMO, item MSA, Bartlett's test and a scree plot before the rotated loading matrix. The eigenvalue&gt;1 count is shown only as a retention cue—not an automatic factor-count decision.</p>
                    {!factorResult.issue && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-cyan-200 bg-white px-2 py-1 text-[8px] font-semibold text-cyan-800">KMO {formatNumber(factorResult.kmoOverall, 3)}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-semibold text-slate-600">Kaiser cue {factorResult.recommendedFactorCount}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-semibold text-slate-600">N {factorResult.n}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeAnalysis === "process" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Mediation & moderation setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Probe indirect effects or X × moderator interactions using the current Analysis Lab sample.</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    <button type="button" onClick={() => setProcessMode("mediation")} className={`rounded-xl px-3 py-2.5 text-[9px] font-semibold ${processMode === "mediation" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400"}`}>Mediation</button>
                    <button type="button" onClick={() => setProcessMode("moderation")} className={`rounded-xl px-3 py-2.5 text-[9px] font-semibold ${processMode === "moderation" ? "bg-white text-slate-950 shadow-sm" : "text-slate-400"}`}>Moderation</button>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Outcome · Y</span>
                      <select value={processOutcomeVariable} onChange={(event) => { const value = event.target.value; setProcessOutcomeVariable(value); setProcessCovariates((current) => current.filter((name) => name !== value)); }} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                        {processCandidates.length === 0 && <option value="">No numeric variables available</option>}
                        {processCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Predictor · X</span>
                      <select value={processPredictorVariable} onChange={(event) => { const value = event.target.value; setProcessPredictorVariable(value); setProcessCovariates((current) => current.filter((name) => name !== value)); }} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                        {processCandidates.filter((variable) => variable.name !== processOutcomeVariable).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                      </select>
                    </label>

                    {processMode === "mediation" ? (
                      <label className="block">
                        <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Mediator · M</span>
                        <select value={processMediatorVariable} onChange={(event) => { const value = event.target.value; setProcessMediatorVariable(value); setProcessCovariates((current) => current.filter((name) => name !== value)); }} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                          {processCandidates.filter((variable) => ![processOutcomeVariable, processPredictorVariable].includes(variable.name)).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                    ) : (
                      <label className="block">
                        <span className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Moderator · W</span>
                        <select value={processModeratorVariable} onChange={(event) => { const value = event.target.value; setProcessModeratorVariable(value); setProcessCovariates((current) => current.filter((name) => name !== value)); }} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                          {processCandidates.filter((variable) => ![processOutcomeVariable, processPredictorVariable].includes(variable.name)).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Covariates</span>
                      <span className="text-[8px] font-semibold text-cyan-700">{processCovariates.length} selected</span>
                    </div>
                    <p className="mt-1 text-[8px] leading-4 text-slate-400">Optional numeric covariates enter every path/model consistently.</p>
                    <div className="mt-2 max-h-[220px] space-y-1 overflow-y-auto pr-1">
                      {processCandidates
                        .filter((variable) => ![processOutcomeVariable, processPredictorVariable, processMode === "mediation" ? processMediatorVariable : processModeratorVariable].includes(variable.name))
                        .map((variable) => {
                          const checked = processCovariates.includes(variable.name);
                          return (
                            <button key={variable.name} type="button" onClick={() => setProcessCovariates((current) => current.includes(variable.name) ? current.filter((name) => name !== variable.name) : [...current, variable.name])} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-cyan-300 bg-cyan-50/70" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}>
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check className="h-3 w-3" /></span>
                              <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span><span className="block truncate font-mono text-[8px] text-slate-400">{variable.name}</span></span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {processMode === "mediation" ? (
                    <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="text-[9px] font-semibold text-cyan-900">Bootstrap indirect effect</p><p className="mt-1 text-[8px] leading-4 text-cyan-800/75">Percentile 95% CI with a deterministic seed so the same data/configuration reproduces the same resamples.</p></div>
                        <select value={processBootstrapSamples} onChange={(event) => setProcessBootstrapSamples(Number(event.target.value))} className="shrink-0 border border-cyan-200 bg-white px-2 py-2 text-[9px] font-semibold text-cyan-900">
                          <option value={1000}>1,000</option><option value={2000}>2,000</option><option value={5000}>5,000</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <label className="mt-5 flex cursor-pointer items-start gap-2 rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                      <input type="checkbox" checked={processCenterPredictors} onChange={(event) => setProcessCenterPredictors(event.target.checked)} className="mt-0.5 rounded border-slate-300" />
                      <span><span className="block text-[9px] font-semibold text-cyan-900">Mean-center X and moderator</span><span className="mt-1 block text-[8px] leading-4 text-cyan-800/75">Recommended for interpretation. Simple slopes are reported at moderator mean −1 SD, mean, and mean +1 SD.</span></span>
                    </label>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Interpretation guardrail</p>
                    <p className="mt-1 text-[8px] leading-4 text-slate-400">These regression models estimate statistical indirect/interaction effects. PsyLattice should not label mediation as causal unless the study design and assumptions support a causal interpretation.</p>
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
              ) : activeAnalysis === "mixed" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Mixed model setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Model repeated observations nested within participants, sessions, sites or another clustering unit.</p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    <div className="grid grid-cols-3 gap-1">
                      {([[
                        "gaussian", "Continuous"
                      ], [
                        "binomial", "Binary"
                      ], [
                        "poisson", "Count"
                      ]] as Array<[MixedOutcomeFamily, string]>).map(([family, label]) => (
                        <button
                          key={family}
                          type="button"
                          onClick={() => {
                            setMixedFamily(family);
                            setMixedOutcomeVariable("");
                            setMixedPositiveClass("");
                            setMixedExposureVariable("");
                            if (family !== "gaussian") setMixedRandomSlopeVariable("");
                          }}
                          className={`rounded-xl px-2 py-2.5 text-[9px] font-semibold ${mixedFamily === family ? "bg-slate-950 text-white shadow-sm" : "text-slate-500"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {preparedViewActive ? (
                    <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/55 p-3">
                      <p className="text-[9px] font-semibold text-violet-900">Repeated rows recommended</p>
                      <p className="mt-1 text-[8px] leading-4 text-violet-800/75">Mixed models need multiple observations within a cluster. The prepared participant view usually has one row per participant.</p>
                      <button type="button" onClick={() => setUsePreparedData(false)} className="mt-2 rounded-full border border-violet-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-violet-800">Use raw repeated rows</button>
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Outcome</span>
                      <select
                        value={mixedOutcomeVariable}
                        onChange={(event) => {
                          const value = event.target.value;
                          setMixedOutcomeVariable(value);
                          setMixedPredictors((current) => current.filter((name) => name !== value));
                          if (mixedGroupVariable === value) setMixedGroupVariable("");
                        }}
                        className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                      >
                        {mixedOutcomeCandidates.length === 0 && <option value="">No compatible outcomes available</option>}
                        {mixedOutcomeCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Cluster / participant ID</span>
                      <select
                        value={mixedGroupVariable}
                        onChange={(event) => {
                          const value = event.target.value;
                          setMixedGroupVariable(value);
                          setMixedPredictors((current) => current.filter((name) => name !== value));
                        }}
                        className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                      >
                        {mixedGroupCandidates.filter((variable) => variable.name !== mixedOutcomeVariable).length === 0 && <option value="">No repeated grouping variable detected</option>}
                        {mixedGroupCandidates.filter((variable) => variable.name !== mixedOutcomeVariable).map((variable) => (
                          <option key={variable.name} value={variable.name}>{variable.label} · {variable.distinctCount} groups</option>
                        ))}
                      </select>
                      <span className="mt-1.5 block text-[8px] leading-4 text-slate-400">Choose the unit within which observations repeat—typically participant for ESM/ambulatory data.</span>
                    </label>

                    {mixedFamily === "binomial" ? (
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Event / positive class</span>
                        <select value={mixedPositiveClass} onChange={(event) => setMixedPositiveClass(event.target.value)} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                          {mixedOutcomeLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                        </select>
                        <span className="mt-1.5 block text-[8px] leading-4 text-slate-400">Coefficients are reported as odds ratios for this event category.</span>
                      </label>
                    ) : null}

                    {mixedFamily === "poisson" ? (
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Exposure / time at risk · optional</span>
                        <select value={mixedExposureVariable} onChange={(event) => setMixedExposureVariable(event.target.value)} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                          <option value="">None · model counts</option>
                          {mixedExposureCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                        <span className="mt-1.5 block text-[8px] leading-4 text-slate-400">When selected, PsyLattice models rates using log(exposure) as an offset.</span>
                      </label>
                    ) : null}

                    {mixedFamily === "gaussian" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Estimator</span>
                        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                          {(["reml", "ml"] as MixedModelEstimator[]).map((value) => (
                            <button key={value} type="button" onClick={() => setMixedEstimator(value)} className={`rounded-lg px-2 py-2 text-[8px] font-semibold uppercase ${mixedEstimator === value ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}>{value}</button>
                          ))}
                        </div>
                      </div>
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Numeric centering</span>
                        <select value={mixedCentering} onChange={(event) => setMixedCentering(event.target.value as MixedModelCentering)} className="mt-2 w-full border border-slate-200 bg-white px-2.5 py-2 text-[9px] font-semibold text-slate-700">
                          <option value="none">None</option>
                          <option value="grand">Grand mean</option>
                          <option value="cluster">Cluster mean</option>
                        </select>
                      </label>
                    </div>
                    ) : (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                        <p className="text-[9px] font-semibold text-cyan-900">Generalized mixed model</p>
                        <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">Uses a logit link for binary outcomes or a log link for counts, with a participant/cluster random intercept estimated by 15-point Gauss–Hermite quadrature.</p>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Fixed effects</span>
                        <span className="text-[8px] font-semibold text-cyan-700">{mixedPredictors.length} selected</span>
                      </div>
                      <div className="relative mt-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input value={variableSearch} onChange={(event) => setVariableSearch(event.target.value)} placeholder="Find predictor..." className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none" />
                      </div>
                      <div className="mt-2 max-h-[300px] space-y-1 overflow-y-auto pr-1">
                        {mixedPredictorCandidates
                          .filter((variable) => variable.name !== mixedOutcomeVariable && variable.name !== mixedGroupVariable)
                          .filter((variable) => {
                            const query = variableSearch.trim().toLowerCase();
                            return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                          })
                          .map((variable) => {
                            const checked = mixedPredictors.includes(variable.name);
                            return (
                              <button key={variable.name} type="button" onClick={() => setMixedPredictors((current) => current.includes(variable.name) ? current.filter((name) => name !== variable.name) : [...current, variable.name])} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-cyan-300 bg-cyan-50/70" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}>
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check className="h-3 w-3" /></span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span><span className="mt-0.5 flex items-center gap-1.5"><span className="truncate font-mono text-[8px] text-slate-400">{variable.name}</span><VariableTypePill variable={variable} /></span></span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {mixedFamily === "gaussian" ? (
                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[9px] font-semibold text-cyan-900">Random-effects structure</p>
                          <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">A random intercept is always included. Add one correlated numeric random slope when participants or clusters may differ in change over time or another repeated predictor.</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-cyan-200 bg-white px-2 py-1 text-[8px] font-semibold text-cyan-800">{mixedEstimator.toUpperCase()}</span>
                      </div>
                      <label className="mt-3 block">
                        <span className="text-[8px] font-semibold uppercase tracking-[.08em] text-cyan-800/70">Random slope / time</span>
                        <select
                          value={mixedRandomSlopeVariable}
                          onChange={(event) => setMixedRandomSlopeVariable(event.target.value)}
                          className="mt-1.5 w-full border border-cyan-200 bg-white px-2.5 py-2 text-[9px] font-semibold text-slate-700"
                        >
                          <option value="">None · random intercept only</option>
                          {mixedRandomSlopeCandidates.map((variable) => (
                            <option key={variable.name} value={variable.name}>{variable.label}</option>
                          ))}
                        </select>
                        <span className="mt-1.5 block text-[8px] leading-4 text-cyan-800/65">The slope variable must also be included as a numeric fixed effect. For longitudinal ESM data this is often study day, time, session, or another repeated numeric measure.</span>
                      </label>
                    </div>
                    ) : (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                        <p className="text-[9px] font-semibold text-cyan-900">Random effects · V1</p>
                        <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">A random intercept is included for {mixedGroupMeta?.label || "the selected cluster"}. Generalized random slopes and crossed random effects remain intentionally unavailable until they are implemented with a reliable likelihood method.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reported automatically</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(mixedFamily === "gaussian"
                        ? ["Fixed effects + 95% CI", "Random intercept + optional slope", "Intercept–slope covariance", "ICC", "Marginal + conditional R²", "ML structure comparison"]
                        : ["Fixed effects + 95% CI", mixedFamily === "binomial" ? "Odds ratios" : "Incidence-rate ratios", "Random-intercept variance", "Likelihood-ratio test", "AIC + BIC", "Cluster summary"]
                      ).map((label) => <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">{label}</span>)}
                    </div>
                  </div>
                </div>
              ) : activeAnalysis === "logistic" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Categorical regression setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Choose the model that matches a binary, unordered multi-category, or ordered multi-category outcome.</p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    <div className="grid grid-cols-3 gap-1">
                      {([[
                        "binary",
                        "Binary",
                      ], [
                        "multinomial",
                        "Multinomial",
                      ], [
                        "ordinal",
                        "Ordinal",
                      ]] as Array<[LogisticMode, string]>).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setLogisticMode(mode);
                            setLogisticOutcomeVariable("");
                          }}
                          className={`rounded-xl px-2 py-2.5 text-[9px] font-semibold ${logisticMode === mode ? "bg-slate-950 text-white shadow-sm" : "text-slate-500"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                        {logisticMode === "binary" ? "Binary outcome" : logisticMode === "multinomial" ? "Unordered categorical outcome" : "Ordered categorical outcome"}
                      </span>
                      <select
                        value={logisticOutcomeVariable}
                        onChange={(event) => {
                          const value = event.target.value;
                          setLogisticOutcomeVariable(value);
                          setLogisticPredictors((current) => current.filter((name) => name !== value));
                        }}
                        className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                      >
                        {logisticOutcomeCandidates.length === 0 && (
                          <option value="">
                            {logisticMode === "binary" ? "No two-level outcomes available" : logisticMode === "multinomial" ? "No 3–8 level outcomes available" : "No 3–10 level outcomes available"}
                          </option>
                        )}
                        {logisticOutcomeCandidates.map((variable) => (
                          <option key={variable.name} value={variable.name}>{variable.label}</option>
                        ))}
                      </select>
                    </label>

                    {logisticMode === "binary" && logisticOutcomeLevels.length === 2 && (
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Event / positive class</span>
                        <select
                          value={logisticPositiveClass}
                          onChange={(event) => setLogisticPositiveClass(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {logisticOutcomeLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                        </select>
                        <span className="mt-1.5 block text-[8px] leading-4 text-slate-400">Odds ratios describe increased or decreased odds of this selected event.</span>
                      </label>
                    )}

                    {logisticMode === "multinomial" && logisticOutcomeLevels.length >= 3 && (
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reference outcome category</span>
                        <select
                          value={logisticReferenceClass}
                          onChange={(event) => setLogisticReferenceClass(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {logisticOutcomeLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
                        </select>
                        <span className="mt-1.5 block text-[8px] leading-4 text-slate-400">Each coefficient compares one outcome category with this reference category.</span>
                      </label>
                    )}

                    {logisticMode === "ordinal" && logisticOrdinalOrder.length >= 3 && (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/45 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-semibold text-cyan-950">Outcome order · low → high</p>
                            <p className="mt-1 text-[8px] leading-4 text-cyan-900/65">Confirm the substantive order before fitting the proportional-odds model.</p>
                          </div>
                          <span className="rounded-full border border-cyan-200 bg-white px-2 py-1 text-[8px] font-semibold text-cyan-800">{logisticOrdinalOrder.length} levels</span>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          {logisticOrdinalOrder.map((level, index) => (
                            <div key={level} className="flex items-center gap-2 rounded-xl border border-cyan-100 bg-white px-2.5 py-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-[8px] font-semibold text-cyan-800">{index + 1}</span>
                              <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-slate-700">{level}</span>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => setLogisticOrdinalOrder((current) => {
                                  if (index === 0) return current;
                                  const next = current.slice();
                                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                  return next;
                                })}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-[9px] text-slate-500 disabled:opacity-30"
                              >↑</button>
                              <button
                                type="button"
                                disabled={index === logisticOrdinalOrder.length - 1}
                                onClick={() => setLogisticOrdinalOrder((current) => {
                                  if (index >= current.length - 1) return current;
                                  const next = current.slice();
                                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                                  return next;
                                })}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-[9px] text-slate-500 disabled:opacity-30"
                              >↓</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Predictors</span>
                        <span className="text-[8px] font-semibold text-cyan-700">{logisticPredictors.length} selected</span>
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
                        {logisticPredictorCandidates
                          .filter((variable) => variable.name !== logisticOutcomeVariable)
                          .filter((variable) => {
                            const query = variableSearch.trim().toLowerCase();
                            return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                          })
                          .map((variable) => {
                            const checked = logisticPredictors.includes(variable.name);
                            return (
                              <button
                                key={variable.name}
                                type="button"
                                onClick={() => setLogisticPredictors((current) => current.includes(variable.name) ? current.filter((name) => name !== variable.name) : [...current, variable.name])}
                                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-cyan-300 bg-cyan-50/70" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}
                              >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check className="h-3 w-3" /></span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span>
                                  <span className="mt-0.5 flex items-center gap-1.5"><span className="truncate font-mono text-[8px] text-slate-400">{variable.name}</span><VariableTypePill variable={variable} /></span>
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    {logisticMode === "binary" && (
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Classification threshold</span>
                          <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[8px] font-semibold text-slate-600">{logisticThreshold.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0.1" max="0.9" step="0.05" value={logisticThreshold} onChange={(event) => setLogisticThreshold(Number(event.target.value))} className="mt-3 w-full accent-cyan-600" />
                        <p className="mt-1 text-[8px] leading-4 text-slate-400">This changes the confusion matrix and classification metrics only; coefficient estimation is unchanged.</p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                      <p className="text-[9px] font-semibold text-cyan-900">
                        {logisticMode === "binary" ? "Maximum-likelihood binary logistic model" : logisticMode === "multinomial" ? "Maximum-likelihood multinomial logit model" : "Proportional-odds cumulative logit model"}
                      </p>
                      <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">
                        Numeric predictors enter directly. Nominal and boolean predictors are indicator-coded automatically, with the reference category shown in each coefficient label.
                        {logisticMode === "ordinal" ? " Positive coefficients indicate higher odds of being in a higher ordered outcome category." : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reported automatically</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(logisticMode === "binary"
                        ? ["Odds ratios + 95% CI", "LR model test", "Pseudo-R²", "AIC + BIC", "AUC", "Classification"]
                        : logisticMode === "multinomial"
                          ? ["Class-specific OR + 95% CI", "LR model test", "Pseudo-R²", "AIC + BIC", "Confusion matrix", "Macro recall"]
                          : ["Common OR + 95% CI", "Thresholds", "LR model test", "Pseudo-R²", "AIC + BIC", "Ordinal classification"]
                      ).map((label) => <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">{label}</span>)}
                    </div>
                  </div>
                </div>
              ) : activeAnalysis === "count" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Count-model setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Model non-negative event/count outcomes with Poisson or negative-binomial regression.</p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    <div className="grid grid-cols-2 gap-1">
                      {([[
                        "poisson",
                        "Poisson",
                      ], [
                        "negative_binomial",
                        "Negative binomial",
                      ]] as Array<[CountRegressionFamily, string]>).map(([family, label]) => (
                        <button key={family} type="button" onClick={() => setCountFamily(family)} className={`rounded-xl px-2 py-2.5 text-[9px] font-semibold ${countFamily === family ? "bg-slate-950 text-white shadow-sm" : "text-slate-500"}`}>{label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Count outcome</span>
                      <select
                        value={countOutcomeVariable}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCountOutcomeVariable(value);
                          setCountPredictors((current) => current.filter((name) => name !== value));
                          if (countExposureVariable === value) setCountExposureVariable("");
                        }}
                        className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                      >
                        {countOutcomeCandidates.length === 0 && <option value="">No non-negative integer outcome detected</option>}
                        {countOutcomeCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                      </select>
                      <span className="mt-1.5 block text-[8px] leading-4 text-slate-400">Examples: errors, omissions, event counts, check-ins, episodes or responses completed.</span>
                    </label>

                    <label className="block">
                      <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Exposure / time at risk · optional</span>
                      <select
                        value={countExposureVariable}
                        onChange={(event) => {
                          const value = event.target.value;
                          setCountExposureVariable(value);
                          if (value) setCountPredictors((current) => current.filter((name) => name !== value));
                        }}
                        className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                      >
                        <option value="">None · model counts directly</option>
                        {countExposureCandidates.filter((variable) => variable.name !== countOutcomeVariable).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                      </select>
                      <span className="mt-1.5 block text-[8px] leading-4 text-slate-400">When selected, PsyLattice uses log(exposure) as an offset so the model estimates event rates rather than raw counts.</span>
                    </label>

                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Predictors</span>
                        <span className="text-[8px] font-semibold text-cyan-700">{countPredictors.length} selected</span>
                      </div>
                      <div className="relative mt-2">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input value={variableSearch} onChange={(event) => setVariableSearch(event.target.value)} placeholder="Find predictor..." className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none" />
                      </div>
                      <div className="mt-2 max-h-[300px] space-y-1 overflow-y-auto pr-1">
                        {countPredictorCandidates
                          .filter((variable) => variable.name !== countOutcomeVariable && variable.name !== countExposureVariable)
                          .filter((variable) => {
                            const query = variableSearch.trim().toLowerCase();
                            return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                          })
                          .map((variable) => {
                            const checked = countPredictors.includes(variable.name);
                            return (
                              <button key={variable.name} type="button" onClick={() => setCountPredictors((current) => current.includes(variable.name) ? current.filter((name) => name !== variable.name) : [...current, variable.name])} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-cyan-300 bg-cyan-50/70" : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"}`}>
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check className="h-3 w-3" /></span>
                                <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span><span className="mt-0.5 flex items-center gap-1.5"><span className="truncate font-mono text-[8px] text-slate-400">{variable.name}</span><VariableTypePill variable={variable} /></span></span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                      <p className="text-[9px] font-semibold text-cyan-900">Log-link generalized model</p>
                      <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">Numeric predictors enter directly; categorical predictors are indicator-coded. Reported exponentiated coefficients are incidence-rate ratios (IRR). {countFamily === "negative_binomial" ? "Negative binomial adds a dispersion parameter when count variance exceeds the Poisson mean assumption." : "Poisson assumes the conditional variance is approximately equal to the conditional mean."}</p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reported automatically</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["IRR + 95% CI", "LR model test", "AIC + BIC", "Deviance", "Pearson dispersion", "Zero-count check"].map((label) => <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">{label}</span>)}
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
                      One-way, factorial, covariate-adjusted and repeated-measures models in one workspace.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        ["between", "One-way"],
                        ["factorial", "Factorial"],
                        ["ancova", "ANCOVA"],
                        ["repeated", "Repeated"],
                      ] as Array<[AnovaMode, string]>).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setAnovaMode(mode)}
                          className={`rounded-xl px-2 py-2.5 text-[9px] font-semibold ${
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
                          Standard ANOVA pools within-group variance. Welch is more robust when group variances or sample sizes differ.
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
                  ) : anovaMode === "factorial" || anovaMode === "ancova" ? (
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

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Factors</span>
                          <span className="text-[8px] font-semibold text-cyan-700">{anovaFactors.length} selected</span>
                        </div>
                        <p className="mt-1 text-[8px] leading-4 text-slate-400">
                          {anovaMode === "factorial" ? "Choose at least two factors." : "Choose one or more categorical factors."} Up to four factors are included in V1.
                        </p>
                        <div className="mt-2 max-h-[220px] space-y-1 overflow-y-auto pr-1">
                          {anovaFactorCandidates
                            .filter((variable) => variable.name !== anovaOutcomeVariable)
                            .map((variable) => {
                              const checked = anovaFactors.includes(variable.name);
                              const disabled = !checked && anovaFactors.length >= 4;
                              return (
                                <button
                                  key={variable.name}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => setAnovaFactors((current) =>
                                    current.includes(variable.name)
                                      ? current.filter((name) => name !== variable.name)
                                      : [...current, variable.name].slice(0, 4)
                                  )}
                                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-40 ${
                                    checked ? "border-cyan-200 bg-cyan-50/70" : "border-slate-100 bg-white hover:border-slate-200"
                                  }`}
                                >
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check className="h-3 w-3" /></span>
                                  <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span><span className="block text-[8px] text-slate-400">{variable.distinctCount} observed levels</span></span>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      {anovaMode === "ancova" && (
                        <div className="border-t border-slate-100 pt-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Covariates</span>
                            <span className="text-[8px] font-semibold text-violet-700">{anovaCovariates.length} selected</span>
                          </div>
                          <p className="mt-1 text-[8px] leading-4 text-slate-400">Numeric covariates are mean-centred before model fitting.</p>
                          <div className="mt-2 max-h-[190px] space-y-1 overflow-y-auto pr-1">
                            {anovaNumericCandidates
                              .filter((variable) => variable.name !== anovaOutcomeVariable && !anovaFactors.includes(variable.name))
                              .map((variable) => {
                                const checked = anovaCovariates.includes(variable.name);
                                return (
                                  <button
                                    key={variable.name}
                                    type="button"
                                    onClick={() => setAnovaCovariates((current) => current.includes(variable.name) ? current.filter((name) => name !== variable.name) : [...current, variable.name].slice(0, 8))}
                                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-violet-200 bg-violet-50/65" : "border-slate-100 bg-white hover:border-slate-200"}`}
                                  >
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check className="h-3 w-3" /></span>
                                    <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span><span className="block truncate font-mono text-[8px] text-slate-400">{variable.name}</span></span>
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <input
                          type="checkbox"
                          checked={anovaIncludeInteractions}
                          onChange={(event) => setAnovaIncludeInteractions(event.target.checked)}
                          className="mt-0.5 h-4 w-4 accent-cyan-600"
                        />
                        <span><span className="block text-[9px] font-semibold text-slate-800">Include two-way factor interactions</span><span className="mt-0.5 block text-[8px] leading-4 text-slate-400">Main effects stay in the model. V1 adds every pairwise interaction among selected factors.</span></span>
                      </label>

                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                        <p className="text-[9px] font-semibold text-cyan-900">General linear model · Type III-style partial tests</p>
                        <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">Factors use sum-to-zero coding. Each effect is tested while retaining the other model terms. Marginal means average equally across the other factor levels; covariates are held at their sample means.</p>
                      </div>
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
                                  onClick={() => setAnovaRepeatedVariables((current) => current.includes(variable.name) ? current.filter((name) => name !== variable.name) : [...current, variable.name])}
                                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-cyan-200 bg-cyan-50/70" : "border-slate-100 bg-white hover:border-slate-200"}`}
                                >
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check className="h-3 w-3" /></span>
                                  <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span><span className="block truncate font-mono text-[8px] text-slate-400">{variable.name}</span></span>
                                </button>
                              );
                            })}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-violet-50/55 p-3">
                        <p className="text-[9px] font-semibold text-violet-800">Complete-case repeated measures</p>
                        <p className="mt-1 text-[8px] leading-4 text-violet-700/75">Each selected variable is one within-participant condition. Mauchly, Greenhouse–Geisser and Huynh–Feldt diagnostics are reported automatically when applicable.</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reported automatically</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(anovaMode === "factorial" || anovaMode === "ancova"
                        ? ["Partial F tests", "ηp²", "Model fit", "Marginal means"]
                        : ["Omnibus F", "Effect size", "Descriptives", "Holm post-hoc"]
                      ).map((label) => (
                        <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeAnalysis === "nonparametric" ? (
                <div>
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.01em] text-slate-900">Non-parametric setup</p>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">Rank-based alternatives for independent groups and repeated observations.</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50/70 p-1">
                    {([
                      ["mannwhitney", "Mann–Whitney"],
                      ["wilcoxon", "Wilcoxon"],
                      ["kruskal", "Kruskal–Wallis"],
                      ["friedman", "Friedman"],
                    ] as Array<[NonParametricMode, string]>).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setNonParametricMode(mode)}
                        className={`rounded-xl px-2.5 py-2.5 text-[9px] font-semibold ${
                          nonParametricMode === mode ? "bg-slate-950 text-white shadow-sm" : "text-slate-500"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {(nonParametricMode === "mannwhitney" || nonParametricMode === "kruskal") ? (
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Outcome variable</span>
                        <select
                          value={npOutcomeVariable}
                          onChange={(event) => setNpOutcomeVariable(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {nonParametricNumericCandidates.length === 0 && <option value="">No numeric / ordinal variables available</option>}
                          {nonParametricNumericCandidates.map((variable) => (
                            <option key={variable.name} value={variable.name}>{variable.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Grouping variable</span>
                        <select
                          value={npGroupVariable}
                          onChange={(event) => setNpGroupVariable(event.target.value)}
                          className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                        >
                          {nonParametricGroupCandidates.length === 0 && <option value="">No grouping variables available</option>}
                          {nonParametricGroupCandidates
                            .filter((variable) => variable.name !== npOutcomeVariable)
                            .map((variable) => (
                              <option key={variable.name} value={variable.name}>{variable.label} · {variable.distinctCount} levels</option>
                            ))}
                        </select>
                      </label>

                      {nonParametricMode === "mannwhitney" && (
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Group 1</span>
                            <select
                              value={npGroupA}
                              onChange={(event) => {
                                const value = event.target.value;
                                setNpGroupA(value);
                                if (value === npGroupB) setNpGroupB(npGroupLevels.find((level) => level.value !== value)?.value || "");
                              }}
                              className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-700"
                            >
                              {npGroupLevels.map((level) => <option key={level.value} value={level.value}>{level.label} · n={level.count}</option>)}
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Group 2</span>
                            <select
                              value={npGroupB}
                              onChange={(event) => setNpGroupB(event.target.value)}
                              className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-700"
                            >
                              {npGroupLevels.filter((level) => level.value !== npGroupA).map((level) => <option key={level.value} value={level.value}>{level.label} · n={level.count}</option>)}
                            </select>
                          </label>
                        </div>
                      )}

                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3">
                        <p className="text-[9px] font-semibold text-cyan-900">{nonParametricMode === "mannwhitney" ? "Two independent groups" : "Two or more independent groups"}</p>
                        <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">
                          {nonParametricMode === "mannwhitney"
                            ? "Uses pooled average ranks, tie correction and a continuity-corrected two-sided normal approximation."
                            : "Uses a tie-corrected Kruskal–Wallis omnibus test followed by Dunn pairwise comparisons with Holm adjustment."}
                        </p>
                      </div>
                    </div>
                  ) : nonParametricMode === "wilcoxon" ? (
                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Paired variable A</span>
                        <select value={npPairedVariableA} onChange={(event) => setNpPairedVariableA(event.target.value)} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                          {nonParametricNumericCandidates.map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Paired variable B</span>
                        <select value={npPairedVariableB} onChange={(event) => setNpPairedVariableB(event.target.value)} className="mt-1.5 w-full border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700">
                          {nonParametricNumericCandidates.filter((variable) => variable.name !== npPairedVariableA).map((variable) => <option key={variable.name} value={variable.name}>{variable.label}</option>)}
                        </select>
                      </label>
                      <div className="rounded-2xl border border-violet-100 bg-violet-50/55 p-3">
                        <p className="text-[9px] font-semibold text-violet-800">Paired rank comparison</p>
                        <p className="mt-1 text-[8px] leading-4 text-violet-700/75">Ranks non-zero absolute within-participant differences. Zero differences are reported separately and excluded from W.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Repeated conditions</span>
                          <span className="text-[8px] font-semibold text-cyan-700">{npRepeatedVariables.length} selected</span>
                        </div>
                        <div className="relative mt-2">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                          <input value={variableSearch} onChange={(event) => setVariableSearch(event.target.value)} placeholder="Find repeated variable..." className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none" />
                        </div>
                        <div className="mt-2 max-h-[300px] space-y-1 overflow-y-auto pr-1">
                          {nonParametricNumericCandidates
                            .filter((variable) => {
                              const query = variableSearch.trim().toLowerCase();
                              return !query || variable.label.toLowerCase().includes(query) || variable.name.toLowerCase().includes(query);
                            })
                            .map((variable) => {
                              const checked = npRepeatedVariables.includes(variable.name);
                              return (
                                <button
                                  key={variable.name}
                                  type="button"
                                  onClick={() => setNpRepeatedVariables((current) => current.includes(variable.name) ? current.filter((name) => name !== variable.name) : [...current, variable.name])}
                                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left ${checked ? "border-cyan-200 bg-cyan-50/70" : "border-slate-100 bg-white hover:border-slate-200"}`}
                                >
                                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-transparent"}`}><Check className="h-3 w-3" /></span>
                                  <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-slate-700">{variable.label}</span><span className="block truncate font-mono text-[8px] text-slate-400">{variable.name}</span></span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-violet-100 bg-violet-50/55 p-3">
                        <p className="text-[9px] font-semibold text-violet-800">Complete-case Friedman test</p>
                        <p className="mt-1 text-[8px] leading-4 text-violet-700/75">Select at least three repeated conditions. PsyLattice ranks conditions within each participant, corrects ties, reports Kendall's W, and runs Holm-adjusted Wilcoxon follow-ups.</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">Reported automatically</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Rank statistic", "Two-sided p", "Effect size", "Tie handling", "Holm follow-ups"].map((label) => <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-500">{label}</span>)}
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
                {activeAnalysis === "cognitive"
                  ? "Cognitive analysis"
                  : activeAnalysis === "visualizations"
                  ? "Data visualizations"
                  : activeAnalysis === "diagnostics"
                  ? "Assumptions & diagnostics"
                  : activeAnalysis === "correlations"
                  ? "Correlation analysis"
                  : activeAnalysis === "ttests"
                    ? "T-test analysis"
                    : activeAnalysis === "nonparametric"
                      ? "Non-parametric analysis"
                    : activeAnalysis === "categorical"
                      ? "Categorical association"
                    : activeAnalysis === "anova"
                      ? "ANOVA analysis"
                      : activeAnalysis === "regression"
                        ? "Regression analysis"
                        : activeAnalysis === "process"
                          ? processMode === "mediation" ? "Mediation analysis" : "Moderation analysis"
                        : activeAnalysis === "mixed"
                          ? "Mixed-effects analysis"
                        : activeAnalysis === "logistic"
                          ? logisticMode === "binary" ? "Binary logistic regression" : logisticMode === "multinomial" ? "Multinomial logistic regression" : "Ordinal logistic regression"
                        : activeAnalysis === "count"
                          ? "Count regression"
                          : activeAnalysis === "reliability"
                          ? "Reliability analysis"
                          : activeAnalysis === "factor"
                            ? "Exploratory factor analysis"
                            : activeAnalysis === "power"
                              ? "Power & sample size"
                              : "Descriptive analysis"}
              </h3>
              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                {activeAnalysis === "cognitive"
                  ? cognitiveResult.issue
                    ? "Use PsyLattice cognitive trial or participant-summary data to activate task-aware scoring, RT cleaning, condition effects and participant review."
                    : `${cognitiveResult.task} · ${cognitiveResult.dataLevel === "trial" ? "trial-level task recipe" : "participant-summary task recipe"} · ${cognitiveResult.paradigm === "generic" ? "standardized cognitive schema" : cognitiveResult.paradigm.replaceAll("_", " ")}.`
                  : activeAnalysis === "visualizations"
                  ? visualizationMode === "scatter"
                    ? "Scatterplot with optional grouping and descriptive least-squares trend lines."
                    : visualizationMode === "box"
                      ? "Tukey box plots for continuous outcomes, optionally split across groups."
                      : visualizationMode === "violin"
                        ? "Kernel-density violin distributions with medians and interquartile ranges."
                        : visualizationMode === "means"
                          ? "Observed group means with optional 95% confidence intervals."
                          : "Observed cell means across two factors for descriptive interaction screening."
                  : activeAnalysis === "diagnostics"
                  ? diagnosticsMode === "distribution"
                    ? "Distribution shape, Q–Q plots, histograms and outlier screening for selected variables."
                    : `${varianceTestCenter === "median" ? "Brown–Forsythe" : "Levene"} test of variance homogeneity across observed groups.`
                  : activeAnalysis === "correlations"
                  ? `${correlationMethod === "pearson" ? "Pearson" : "Spearman"} matrix with pairwise valid observations.`
                  : activeAnalysis === "ttests"
                    ? tTestMode === "independent"
                      ? `${tTestEstimator === "welch" ? "Welch" : "Student"} independent-samples comparison with confidence intervals and effect sizes.`
                      : "Paired-samples comparison with pairwise-complete observations and Cohen's dz."
                    : activeAnalysis === "nonparametric"
                      ? nonParametricMode === "mannwhitney"
                        ? "Mann–Whitney rank comparison for two independent groups."
                        : nonParametricMode === "wilcoxon"
                          ? "Wilcoxon signed-rank comparison for paired observations."
                          : nonParametricMode === "kruskal"
                            ? "Kruskal–Wallis omnibus rank test with Dunn–Holm follow-ups."
                            : "Friedman repeated-ranks test with Kendall's W and Wilcoxon–Holm follow-ups."
                    : activeAnalysis === "categorical"
                      ? categoricalAssociationResult && !categoricalAssociationResult.issue
                        ? `Contingency analysis for ${categoricalAssociationResult.rowVariableLabel} × ${categoricalAssociationResult.columnVariableLabel}, with expected-count diagnostics and effect size.`
                        : "Contingency tables, χ², Fisher's exact testing and categorical effect sizes."
                    : activeAnalysis === "anova"
                      ? anovaMode === "between"
                        ? `${anovaEstimator === "welch" ? "Welch" : "Standard"} one-way ANOVA with effect sizes and Holm-adjusted pairwise comparisons.`
                        : anovaMode === "factorial"
                          ? "Factorial general linear model with main effects, two-way interactions, Type III-style partial F tests and estimated marginal means."
                          : anovaMode === "ancova"
                            ? "Covariate-adjusted general linear model with mean-centred covariates, factor interactions and estimated marginal means."
                            : "One-factor repeated-measures ANOVA with sphericity corrections, effect sizes and Holm-adjusted paired follow-ups."
                      : activeAnalysis === "regression"
                        ? "Ordinary least-squares multiple regression with standardized coefficients, collinearity checks and residual diagnostics."
                        : activeAnalysis === "process"
                          ? processMode === "mediation"
                            ? "Regression-based mediation with total, direct and indirect effects plus a deterministic bootstrap confidence interval."
                            : "Regression-based moderation with an X × W interaction, ΔR² and conditional simple slopes at the moderator mean and ±1 SD."
                        : activeAnalysis === "mixed"
                          ? mixedFamily === "gaussian"
                            ? `${mixedEstimator.toUpperCase()} linear mixed model for repeated observations nested within ${mixedGroupMeta?.label || "the selected cluster"}.`
                            : mixedFamily === "binomial"
                              ? `Random-intercept binary generalized mixed model for repeated ${mixedPositiveClass || "event"} outcomes nested within ${mixedGroupMeta?.label || "the selected cluster"}.`
                              : `Random-intercept Poisson generalized mixed model for repeated counts nested within ${mixedGroupMeta?.label || "the selected cluster"}${mixedExposureMeta ? `, using ${mixedExposureMeta.label} as exposure` : ""}.`
                        : activeAnalysis === "logistic"
                          ? logisticMode === "binary"
                            ? `Maximum-likelihood binary logistic regression for ${binaryLogisticResult?.positiveClass || "the selected event"}, with odds ratios and classification metrics.`
                            : logisticMode === "multinomial"
                              ? `Multinomial logit model comparing each outcome category with ${multinomialLogisticResult?.referenceClass || "the selected reference"}, with class-specific odds ratios and classification summaries.`
                              : `Proportional-odds ordinal logistic regression across ${ordinalLogisticResult?.orderedLevels.length || logisticOrdinalOrder.length || "the selected"} ordered outcome levels, with common odds ratios and category thresholds.`
                        : activeAnalysis === "count"
                          ? `${countFamily === "poisson" ? "Poisson" : "Negative-binomial"} log-link regression for non-negative counts${countExposureMeta ? ` with ${countExposureMeta.label} as exposure` : ""}, reporting incidence-rate ratios and dispersion diagnostics.`
                          : activeAnalysis === "reliability"
                          ? "Internal-consistency analysis with Cronbach's α, standardized α, corrected item-rest correlations and deletion diagnostics."
                          : activeAnalysis === "factor"
                            ? `${factorExtraction === "principal_axis" ? "Principal-axis factoring" : "Principal-components extraction"} with ${factorRotation === "promax" ? "Promax" : factorRotation === "varimax" ? "Varimax" : "no"} rotation, KMO/Bartlett diagnostics and a scree plot.`
                            : activeAnalysis === "power"
                              ? `${powerMode === "apriori" ? "A priori sample-size planning" : "Achieved-power estimation"} for ${powerTest === "independent_t" ? "an independent-samples t test" : powerTest === "paired_t" ? "a paired/one-sample t test" : powerTest === "correlation" ? "a correlation" : "a one-way ANOVA"}.`
                              : "Output updates immediately when variables or statistics change."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {copyStatus && (
                <span className="text-[10px] font-semibold text-cyan-700">
                  {copyStatus}
                </span>
              )}
              <button
                type="button"
                onClick={saveCurrentAnalysisRecord}
                disabled={!activePrimaryTableSpec()}
                title="Save a reproducible snapshot of this analysis setup and its current formatted outputs"
                className="flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-[9px] font-semibold text-cyan-900 shadow-[0_4px_14px_rgba(8,145,178,.06)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" />
                Save record
              </button>
              <button
                type="button"
                onClick={() => setRecordsOpen((current) => !current)}
                title="Open saved analysis records"
                className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[9px] font-semibold shadow-[0_4px_14px_rgba(15,23,42,.04)] ${recordsOpen ? "border-slate-300 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600"}`}
              >
                <History className="h-3.5 w-3.5" />
                Records
                {analysisRecords.length > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[7px] ${recordsOpen ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>{analysisRecords.length}</span>}
              </button>
              <button
                type="button"
                onClick={() => void copyActiveResults()}
                disabled={
                  activeAnalysis === "cognitive"
                    ? Boolean(cognitiveResult.issue)
                    : activeAnalysis === "visualizations"
                    ? visualizationMode === "scatter"
                      ? Boolean(visualizationScatterResult.issue)
                      : visualizationMode === "box" || visualizationMode === "violin"
                        ? Boolean(visualizationDistributionResult.issue)
                        : visualizationMode === "means"
                          ? Boolean(visualizationMeansResult.issue)
                          : Boolean(visualizationInteractionResult.issue)
                    : activeAnalysis === "diagnostics"
                    ? diagnosticsMode === "distribution"
                      ? distributionDiagnostics.length === 0
                      : !varianceHomogeneityResult || Boolean(varianceHomogeneityResult.issue) || varianceHomogeneityResult.f === null
                    : activeAnalysis === "correlations"
                    ? correlationVariables.length < 2
                    : activeAnalysis === "ttests"
                      ? tTestMode === "independent"
                        ? !independentTTestResult || independentTTestResult.t === null
                        : !pairedTTestResult || pairedTTestResult.t === null
                      : activeAnalysis === "nonparametric"
                        ? nonParametricMode === "mannwhitney"
                          ? !mannWhitneyResult || Boolean(mannWhitneyResult.issue) || mannWhitneyResult.u === null
                          : nonParametricMode === "wilcoxon"
                            ? !wilcoxonResult || Boolean(wilcoxonResult.issue) || wilcoxonResult.w === null
                            : nonParametricMode === "kruskal"
                              ? !kruskalWallisResult || Boolean(kruskalWallisResult.issue) || kruskalWallisResult.h === null
                              : !friedmanResult || Boolean(friedmanResult.issue) || friedmanResult.chiSquare === null
                      : activeAnalysis === "categorical"
                        ? !categoricalAssociationResult || Boolean(categoricalAssociationResult.issue) || categoricalAssociationResult.chiSquare === null
                      : activeAnalysis === "anova"
                        ? anovaMode === "between"
                          ? !oneWayAnovaResult || oneWayAnovaResult.f === null
                          : anovaMode === "factorial" || anovaMode === "ancova"
                            ? !generalLinearAnovaResult || Boolean(generalLinearAnovaResult.issue) || generalLinearAnovaResult.effects.length === 0
                            : !repeatedMeasuresAnovaResult || repeatedMeasuresAnovaResult.f === null
                        : activeAnalysis === "regression"
                          ? !linearRegressionResult || Boolean(linearRegressionResult.issue) || linearRegressionResult.coefficients.length === 0
                          : activeAnalysis === "process"
                            ? processMode === "mediation"
                              ? !mediationResult || Boolean(mediationResult.issue) || mediationResult.indirectEffect === null
                              : !moderationResult || Boolean(moderationResult.issue) || moderationResult.interactionEffect.b === null
                          : activeAnalysis === "mixed"
                            ? mixedFamily === "gaussian"
                              ? !linearMixedModelResult || Boolean(linearMixedModelResult.issue) || linearMixedModelResult.coefficients.length === 0
                              : !generalizedMixedModelResult || Boolean(generalizedMixedModelResult.issue) || generalizedMixedModelResult.coefficients.length === 0
                          : activeAnalysis === "logistic"
                            ? !categoricalRegressionResult || Boolean(categoricalRegressionResult.issue) || categoricalRegressionResult.coefficients.length === 0
                          : activeAnalysis === "count"
                            ? !countRegressionResult || Boolean(countRegressionResult.issue) || countRegressionResult.coefficients.length === 0
                            : activeAnalysis === "reliability"
                            ? Boolean(reliabilityResult.issue) || reliabilityResult.alpha === null || reliabilityResult.items.length < 2
                            : activeAnalysis === "factor"
                              ? Boolean(factorResult.issue) || factorResult.items.length < 3
                              : activeAnalysis === "power"
                                ? Boolean(powerResult.issue) || powerResult.sampleSize === null || powerResult.achievedPower === null
                                : numericResults.length === 0
                }
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,.055)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy formatted table
              </button>
            </div>
          </div>

          {recordsOpen && (
            <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,.06)]">
              <div className="flex flex-col gap-2 border-b border-slate-100 bg-[linear-gradient(110deg,#ffffff_0%,#f7fcfd_52%,#faf8ff_100%)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-cyan-700" />
                    <p className="text-[11px] font-semibold text-slate-900">Analysis records</p>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[.07em] text-slate-500">Local browser</span>
                  </div>
                  <p className="mt-1 max-w-2xl text-[8px] leading-4 text-slate-500">Each record freezes the current analysis setup, working-data provenance, sample flow and formatted outputs without storing raw participant rows. Use it as an audit trail now and as structured context for the future Analysis AI.</p>
                </div>
                <button type="button" onClick={() => setRecordsOpen(false)} className="self-start rounded-full border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
              </div>

              {analysisRecords.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Save className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-[10px] font-semibold text-slate-700">No saved analysis records yet</p>
                  <p className="mx-auto mt-1 max-w-lg text-[8px] leading-4 text-slate-400">Finish an analysis and choose <span className="font-semibold text-slate-600">Save record</span>. PsyLattice will retain the setup and result tables in this browser.</p>
                </div>
              ) : (
                <div className="max-h-[360px] space-y-2 overflow-y-auto p-3 sm:p-4">
                  {analysisRecords.map((record) => {
                    const sameDataset = record.source.mode === sourceMode
                      && record.source.datasetKey === sourceDatasetKey
                      && record.source.preparedView === preparedViewActive
                      && (record.source.mode !== "study" || !record.source.studyId || record.source.studyId === selectedStudyId)
                      && (record.source.mode !== "csv" || record.source.csvName === csvName);
                    const sameFingerprint = sameDataset && record.fingerprint === analysisFingerprint;
                    return (
                      <div key={record.id} className="rounded-[18px] border border-slate-200 bg-slate-50/45 px-3.5 py-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="truncate text-[10px] font-semibold text-slate-900">{record.analysisLabel}</p>
                              <span className={`rounded-full border px-2 py-0.5 text-[7px] font-semibold ${sameFingerprint ? "border-emerald-100 bg-emerald-50 text-emerald-700" : sameDataset ? "border-amber-100 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-400"}`}>{sameFingerprint ? "Same data" : sameDataset ? "Data changed" : "Other dataset"}</span>
                            </div>
                            <p className="mt-1 truncate text-[8px] text-slate-500">{record.source.studyTitle ? `${record.source.studyTitle} · ` : ""}{record.source.datasetLabel}</p>
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[7.5px] text-slate-400">
                              <span>{new Date(record.createdAt).toLocaleString()}</span>
                              <span>N after filters {record.sample.afterFiltersRows.toLocaleString()}</span>
                              <span>Complete {record.sample.completeAcrossSetupRows.toLocaleString()}</span>
                              <span>{record.variables.length} setup variable{record.variables.length === 1 ? "" : "s"}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            <button type="button" onClick={() => void copyAnalysisRecord(record)} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy report</button>
                            <button type="button" onClick={() => downloadAnalysisRecord(record)} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600"><Download className="h-3 w-3" />JSON</button>
                            <button type="button" onClick={() => restoreAnalysisRecord(record)} disabled={!sameDataset} className="flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[8px] font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-35"><RotateCcw className="h-3 w-3" />Load setup</button>
                            <button type="button" onClick={() => setAnalysisRecords((current) => current.filter((item) => item.id !== record.id))} title="Delete record" className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 hover:border-rose-200 hover:text-rose-600"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-white px-2 py-1 text-[7px] font-semibold text-slate-500">{record.source.preparedView ? "Prepared view" : "Raw view"}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-[7px] font-semibold text-slate-500">{record.preparation.filters.length} filters</span>
                          <span className="rounded-full bg-white px-2 py-1 text-[7px] font-semibold text-slate-500">{record.preparation.transforms.length + record.preparation.computed.length + record.preparation.recodes.length + record.preparation.repeated.length} data operations</span>
                          <span className="max-w-full truncate rounded-full bg-white px-2 py-1 font-mono text-[7px] text-slate-400">{record.fingerprint}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeRows.length === 0 && activeAnalysis !== "power" ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                No data to analyse yet
              </p>
              <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-500">
                Choose another PsyLattice dataset, include TEST data while validating, or upload a CSV.
              </p>
            </div>
          ) : activeAnalysis === "power" && powerResult.issue ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <Gauge className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Review the power-analysis setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">{powerResult.issue}</p>
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
          ) : activeAnalysis === "nonparametric" &&
            (nonParametricMode === "mannwhitney"
              ? !mannWhitneyResult || Boolean(mannWhitneyResult.issue)
              : nonParametricMode === "wilcoxon"
                ? !wilcoxonResult || Boolean(wilcoxonResult.issue)
                : nonParametricMode === "kruskal"
                  ? !kruskalWallisResult || Boolean(kruskalWallisResult.issue)
                  : !friedmanResult || Boolean(friedmanResult.issue)) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the non-parametric setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {nonParametricMode === "mannwhitney"
                  ? mannWhitneyResult?.issue || "Choose a numeric or ordinal outcome, a grouping variable, and two observed groups."
                  : nonParametricMode === "wilcoxon"
                    ? wilcoxonResult?.issue || "Choose two different numeric or ordinal variables measured on the same participants."
                    : nonParametricMode === "kruskal"
                      ? kruskalWallisResult?.issue || "Choose a numeric or ordinal outcome and a factor with at least two observed groups."
                      : friedmanResult?.issue || "Select at least three repeated-condition variables with complete participant observations."}
              </p>
            </div>
          ) : activeAnalysis === "anova" &&
            (anovaMode === "between"
              ? !oneWayAnovaResult || oneWayAnovaResult.groups.length < 2
              : anovaMode === "factorial" || anovaMode === "ancova"
                ? !generalLinearAnovaResult || Boolean(generalLinearAnovaResult.issue)
                : !repeatedMeasuresAnovaResult || anovaRepeatedVariables.length < 2) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the ANOVA setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {anovaMode === "between"
                  ? "Choose a numeric outcome and a factor with at least two observed groups."
                  : anovaMode === "factorial"
                    ? generalLinearAnovaResult?.issue || "Choose a numeric outcome and at least two factors."
                    : anovaMode === "ancova"
                      ? generalLinearAnovaResult?.issue || "Choose a numeric outcome, at least one factor, and at least one numeric covariate."
                      : "Select at least two numeric variables representing repeated conditions for the same participants."}
              </p>
            </div>
          ) : activeAnalysis === "anova" &&
            (anovaMode === "between"
              ? oneWayAnovaResult?.f === null
              : anovaMode === "factorial" || anovaMode === "ancova"
                ? generalLinearAnovaResult?.f === null
                : repeatedMeasuresAnovaResult?.f === null) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-violet-200 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-violet-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Not enough usable variance or observations</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {anovaMode === "between"
                  ? anovaEstimator === "welch"
                    ? "Welch ANOVA requires at least two observations with non-zero variance in every included group. Try Standard ANOVA or inspect the selected groups."
                    : "The one-way ANOVA needs residual degrees of freedom and within-group information. Inspect the selected factor and outcome."
                  : anovaMode === "factorial" || anovaMode === "ancova"
                    ? "The selected general linear model needs residual degrees of freedom and an estimable design matrix. Reduce empty cells, redundant factors, interactions, or covariates if necessary."
                    : "Repeated-measures ANOVA needs at least two complete participants across all selected conditions and measurable within-subject error variance."}
              </p>
            </div>
          ) : activeAnalysis === "categorical" && (!categoricalAssociationResult || categoricalAssociationResult.issue) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the categorical setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {categoricalAssociationResult?.issue || "Choose two different categorical variables with at least two observed levels each."}
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
          ) : activeAnalysis === "factor" && (factorVariables.length < 3 || factorResult.issue) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <Layers3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the factor-analysis setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {factorVariables.length < 3
                  ? "Select at least three numeric questionnaire/item variables."
                  : factorResult.issue}
              </p>
            </div>
          ) : activeAnalysis === "process" && (processMode === "mediation" ? (!mediationResult || mediationResult.issue) : (!moderationResult || moderationResult.issue)) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the {processMode === "mediation" ? "mediation" : "moderation"} setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {processMode === "mediation"
                  ? mediationResult?.issue || "Choose different numeric X, mediator, and outcome variables."
                  : moderationResult?.issue || "Choose different numeric X, moderator, and outcome variables."}
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
          ) : activeAnalysis === "mixed" && (
            mixedFamily === "gaussian"
              ? (!linearMixedModelResult || Boolean(linearMixedModelResult.issue))
              : (!generalizedMixedModelResult || Boolean(generalizedMixedModelResult.issue))
          ) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <Layers3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the mixed-model setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {mixedFamily === "gaussian"
                  ? linearMixedModelResult?.issue || "Choose a numeric outcome, a repeated clustering variable such as participant, and at least one fixed-effect predictor."
                  : generalizedMixedModelResult?.issue || (mixedFamily === "binomial" ? "Choose a binary repeated outcome, event category, cluster variable and at least one fixed effect." : "Choose a non-negative integer repeated count outcome, cluster variable and at least one fixed effect.")}
              </p>
              {preparedViewActive ? <button type="button" onClick={() => setUsePreparedData(false)} className="mt-4 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-[9px] font-semibold text-cyan-800">Use raw repeated rows</button> : null}
            </div>
          ) : activeAnalysis === "logistic" && (!categoricalRegressionResult || categoricalRegressionResult.issue) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the logistic-regression setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {categoricalRegressionResult?.issue || (logisticMode === "binary" ? "Choose a binary outcome, select the event category, and add at least one predictor." : logisticMode === "multinomial" ? "Choose an unordered outcome with 3–8 categories, select a reference category, and add at least one predictor." : "Choose an ordered outcome with 3–10 categories, confirm the low-to-high order, and add at least one predictor.")}
              </p>
            </div>
          ) : activeAnalysis === "count" && (!countRegressionResult || countRegressionResult.issue) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the count-regression setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {countRegressionResult?.issue || "Choose a non-negative integer count outcome and add at least one predictor."}
              </p>
            </div>
          ) : activeAnalysis === "cognitive" && cognitiveResult.issue ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-cyan-200 bg-white p-10 text-center">
              <Database className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Choose PsyLattice cognitive data</p>
              <p className="mx-auto mt-1 max-w-xl text-[10px] leading-5 text-slate-500">{cognitiveResult.issue}</p>
              {sourceMode === "study" && (cognitiveTrialDatasetOption || cognitiveSummaryDatasetOption) ? (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {cognitiveTrialDatasetOption ? <button type="button" onClick={() => onDatasetChange?.(cognitiveTrialDatasetOption.value)} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-[9px] font-semibold text-cyan-800">Use cognitive trials</button> : null}
                  {cognitiveSummaryDatasetOption ? <button type="button" onClick={() => onDatasetChange?.(cognitiveSummaryDatasetOption.value)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[9px] font-semibold text-slate-700">Use participant summaries</button> : null}
                </div>
              ) : null}
            </div>
          ) : activeAnalysis === "diagnostics" && diagnosticsMode === "distribution" && distributionDiagnostics.length === 0 ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Select variables to diagnose</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">Choose one or more continuous or ordinal variables. PsyLattice will generate distribution diagnostics, Q–Q plots, histograms and outlier screens.</p>
            </div>
          ) : activeAnalysis === "diagnostics" && diagnosticsMode === "homogeneity" && (!varianceHomogeneityResult || varianceHomogeneityResult.issue) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the variance setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">{varianceHomogeneityResult?.issue || "Choose a numeric outcome and a grouping factor with at least two observed groups."}</p>
            </div>
          ) : activeAnalysis === "visualizations" && (
            visualizationMode === "scatter"
              ? Boolean(visualizationScatterResult.issue)
              : visualizationMode === "box" || visualizationMode === "violin"
                ? Boolean(visualizationDistributionResult.issue)
                : visualizationMode === "means"
                  ? Boolean(visualizationMeansResult.issue)
                  : Boolean(visualizationInteractionResult.issue)
          ) ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">Finish the visualization setup</p>
              <p className="mx-auto mt-1 max-w-lg text-[10px] leading-5 text-slate-500">
                {visualizationMode === "scatter"
                  ? visualizationScatterResult.issue
                  : visualizationMode === "box" || visualizationMode === "violin"
                    ? visualizationDistributionResult.issue
                    : visualizationMode === "means"
                      ? visualizationMeansResult.issue
                      : visualizationInteractionResult.issue}
              </p>
            </div>
          ) : activeAnalysis !== "cognitive" && activeAnalysis !== "visualizations" && activeAnalysis !== "ttests" && activeAnalysis !== "nonparametric" && activeAnalysis !== "anova" && activeAnalysis !== "regression" && activeAnalysis !== "mixed" && activeAnalysis !== "logistic" && activeAnalysis !== "reliability" && activeAnalysis !== "factor" && activeAnalysis !== "diagnostics" && selectedVariables.length === 0 ? (
            <div className="mt-6 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Build your analysis
              </p>
              <p className="mx-auto mt-1 max-w-md text-[10px] leading-5 text-slate-500">
                Select one or more usable variables from the setup panel. Results will appear here instantly.
              </p>
            </div>
          ) : activeAnalysis === "cognitive" ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Participants", cognitiveResult.participantCount.toLocaleString(), cognitiveResult.dataLevel === "trial" ? `${cognitiveResult.trialCount.toLocaleString()} trials` : `${cognitiveResult.rowCount.toLocaleString()} summary records`],
                  ["Accuracy", formatPercent(cognitiveResult.accuracy), `${cognitiveResult.scorableTrials.toLocaleString()} scorable`],
                  ["Median RT", cognitiveResult.medianRtMs === null ? "—" : `${formatNumber(cognitiveResult.medianRtMs, 1)} ms`, cognitiveResult.dataLevel === "trial" ? `${cognitiveResult.rtRetained.toLocaleString()} retained RTs` : "Participant summaries"],
                  ["Review flags", cognitiveResult.flaggedParticipantCount.toLocaleString(), cognitiveResult.participantCount ? `${formatPercent(cognitiveResult.flaggedParticipantCount / cognitiveResult.participantCount)} of participants` : "No participants"],
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">PsyLattice cognitive recipe</p>
                      <span className="rounded-full border border-cyan-100 bg-white px-2 py-0.5 text-[7px] font-semibold uppercase tracking-[.08em] text-cyan-700">Extensible schema</span>
                    </div>
                    <p className="mt-1 truncate text-[13px] font-semibold text-slate-900">{cognitiveResult.task}</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-500">{cognitiveResult.paradigm === "generic" ? "Generic task recipe" : cognitiveResult.paradigm.replaceAll("_", " ")} · {cognitiveResult.dataLevel === "trial" ? "trial/event data" : "participant summary data"}. New Cognitive Lab tasks can use the same common fields and add a recipe only for task-specific metrics.</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      cognitiveResult.schema.participantField ? "Participant" : null,
                      cognitiveResult.schema.conditionField ? "Condition" : null,
                      cognitiveResult.schema.correctField ? "Correctness" : null,
                      cognitiveResult.schema.reactionTimeField ? "RT" : null,
                    ].filter(Boolean).map((label) => <span key={label as string} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-slate-500">{label}</span>)}
                  </div>
                </div>
              </div>

              {cognitiveResult.taskMetrics.length > 0 ? (
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                  <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div><p className="text-[12px] font-semibold text-slate-900">Task-specific metrics</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Known task recipes surface scoring metrics without replacing the generic cognitive schema.</p></div>
                    <button type="button" onClick={() => void copyTableSpec(cognitiveTaskMetricsTableSpec(), "Task metrics copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy task metrics</button>
                  </div>
                  <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-3">
                    {cognitiveResult.taskMetrics.map((metric) => (
                      <div key={metric.key} className="border-b border-slate-100 p-4 sm:border-r last:border-b-0">
                        <p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{metric.label}</p>
                        <p className="mt-1.5 text-[17px] font-semibold text-slate-900">{formatCognitiveMetric(metric.value, metric.unit)}</p>
                        {metric.note ? <p className="mt-1 text-[8px] leading-4 text-slate-400">{metric.note}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {cognitiveResult.dataLevel === "trial" && cognitiveResult.conditions.length > 0 ? (
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                  <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div><p className="text-[12px] font-semibold text-slate-900">Condition summary</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Accuracy and cleaned RT summaries from the common condition field.</p></div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8px] font-semibold text-slate-500">Reference: {cognitiveResult.referenceCondition || "—"}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left text-[10px]">
                      <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Condition", "Trials", "Scorable", "Accuracy", "Mean RT", "Median RT", "Omissions", "RT excluded"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {cognitiveResult.conditions.map((condition) => (
                          <tr key={condition.condition}>
                            <td className="px-4 py-3.5 font-semibold text-slate-800">{condition.condition}{condition.condition === cognitiveResult.referenceCondition ? <span className="ml-2 rounded-full bg-cyan-50 px-1.5 py-0.5 text-[7px] font-semibold text-cyan-700">Reference</span> : null}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{condition.trials}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{condition.scorableTrials}</td>
                            <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPercent(condition.accuracy)}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{condition.meanRtMs === null ? "—" : `${formatNumber(condition.meanRtMs, 1)} ms`}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{condition.medianRtMs === null ? "—" : `${formatNumber(condition.medianRtMs, 1)} ms`}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{condition.omissions} · {formatPercent(condition.omissionRate)}</td>
                            <td className="px-4 py-3.5 tabular-nums text-slate-600">{condition.rtExcluded} · {formatPercent(condition.rtExclusionRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {cognitiveResult.conditionEffects.length > 0 ? (
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                  <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div><p className="text-[12px] font-semibold text-slate-900">Within-participant condition effects</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Useful for interference, congruency and other repeated condition contrasts.</p></div>
                    <button type="button" onClick={() => void copyTableSpec(cognitiveEffectsTableSpec(), "Condition effects copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy effects</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left text-[10px]">
                      <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Comparison", "RT pairs", "Δ RT", "t", "Holm p", "dz", "Accuracy pairs", "Δ accuracy", "Holm p"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {cognitiveResult.conditionEffects.map((effect) => (
                          <tr key={effect.condition}>
                            <td className="px-4 py-3.5 font-semibold text-slate-800">{effect.condition} − {effect.referenceCondition}</td>
                            <td className="px-4 py-3.5 text-slate-600">{effect.participantPairsRt}</td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900">{effect.meanRtDifferenceMs === null ? "—" : `${formatNumber(effect.meanRtDifferenceMs, 1)} ms`}</td>
                            <td className="px-4 py-3.5 text-slate-600">{formatNumber(effect.rtT, 3)}</td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(effect.rtPAdjusted)}</td>
                            <td className="px-4 py-3.5 text-slate-600">{formatNumber(effect.rtCohenDz, 3)}</td>
                            <td className="px-4 py-3.5 text-slate-600">{effect.participantPairsAccuracy}</td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900">{formatPercent(effect.meanAccuracyDifference)}</td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(effect.accuracyPAdjusted)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="border-t border-slate-100 px-4 py-3 text-[8px] leading-4 text-slate-400">Effects are participant-level paired comparisons versus the selected reference condition. Holm correction is applied separately to RT and accuracy families.</p>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div><p className="text-[12px] font-semibold text-slate-900">Participant review</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Potential data-quality issues are surfaced for review, never silently excluded.</p></div>
                  <div className="flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold ${cognitiveResult.flaggedParticipantCount ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>{cognitiveResult.flaggedParticipantCount} flagged</span><button type="button" onClick={() => void copyTableSpec(cognitiveScreeningTableSpec(), "Screening table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy screening</button></div>
                </div>
                <div className="max-h-[430px] overflow-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="sticky top-0 border-b border-slate-100 bg-slate-50/95 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Participant", "Trials", "Accuracy", "Median RT", "Omissions", "RT excluded", "Review flags"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {cognitiveResult.participants.slice(0, 100).map((participant) => (
                        <tr key={participant.participant}>
                          <td className="max-w-[220px] px-4 py-3.5 font-semibold text-slate-800">{participant.participant}</td>
                          <td className="px-4 py-3.5 text-slate-600">{participant.trials}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">{formatPercent(participant.accuracy)}</td>
                          <td className="px-4 py-3.5 text-slate-600">{participant.medianRtMs === null ? "—" : `${formatNumber(participant.medianRtMs, 1)} ms`}</td>
                          <td className="px-4 py-3.5 text-slate-600">{participant.omissions} · {formatPercent(participant.omissionRate)}</td>
                          <td className="px-4 py-3.5 text-slate-600">{participant.rtExcluded} · {formatPercent(participant.rtExclusionRate)}</td>
                          <td className="max-w-[360px] px-4 py-3.5">{participant.flags.length ? <div className="flex flex-wrap gap-1">{participant.flags.map((flag) => <span key={flag} className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[7px] font-semibold text-amber-700">{flag}</span>)}</div> : <span className="text-slate-300">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {cognitiveResult.participants.length > 100 ? <p className="border-t border-slate-100 px-4 py-3 text-[8px] text-slate-400">Showing the first 100 participants in the live canvas for performance. Copy screening exports all {cognitiveResult.participants.length.toLocaleString()} rows.</p> : null}
              </div>

              {cognitiveResult.platformQualityFlags.length > 0 ? (
                <div className="rounded-[22px] border border-violet-100 bg-violet-50/35 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[.1em] text-violet-700">Task-generated quality flags</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{cognitiveResult.platformQualityFlags.map((entry) => <span key={entry.flag} className="rounded-full border border-violet-100 bg-white px-2.5 py-1 text-[8px] font-semibold text-violet-700">{entry.flag} · {entry.count}</span>)}</div>
                </div>
              ) : null}

              <p className="px-1 text-[8px] leading-4 text-slate-400">Cognitive Analysis V1 prioritizes PsyLattice-native data but does not replace the general statistical tools. Descriptives, diagnostics, correlations, tests, ANOVA/ANCOVA, regression, logistic regression and reliability remain available for downstream analysis of cognitive outcomes and cross-module datasets.</p>
            </div>
          ) : activeAnalysis === "diagnostics" ? (
            <div className="mt-6 space-y-5">
              {diagnosticsMode === "distribution" ? (
                <>
                  <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.04)]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Screening guidance</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-900">Use plots and statistics together</p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[8px] font-semibold text-slate-500">{distributionDiagnostics.length} variable{distributionDiagnostics.length === 1 ? "" : "s"}</span>
                    </div>
                    <p className="mt-2 max-w-4xl text-[9px] leading-4 text-slate-500">A significant normality test alone is not an automatic reason to abandon a parametric analysis. Sample size, Q–Q shape, outliers, skewness/kurtosis and the robustness of the intended model should be considered together.</p>
                  </div>

                  {distributionDiagnostics.map((result) => {
                    const flag = diagnosticFlag(result);
                    return (
                      <div key={result.variable} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_14px_34px_rgba(15,23,42,.05)]">
                        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-900">{result.label}</p>
                            <p className="mt-0.5 truncate font-mono text-[8px] text-slate-400">{result.variable}</p>
                          </div>
                          <span className={`w-fit rounded-full border px-2.5 py-1 text-[8px] font-semibold ${flag.tone}`}>{flag.label}</span>
                        </div>

                        {result.issue ? (
                          <div className="p-5 text-[10px] text-slate-500">{result.issue}</div>
                        ) : (
                          <div className="space-y-4 p-4 sm:p-5">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
                              {[
                                ["N", String(result.n), `${result.missing} missing`],
                                ["JB p", formatPValue(result.jarqueBeraPValue), `JB = ${formatNumber(result.jarqueBera, 3)}`],
                                ["Skewness", formatNumber(result.skewness, 3), Math.abs(result.skewness ?? 0) > 1 ? "Large shape deviation" : "Distribution shape"],
                                ["Excess kurtosis", formatNumber(result.kurtosisExcess, 3), Math.abs(result.kurtosisExcess ?? 0) > 2 ? "Large tail deviation" : "Tail / peak shape"],
                                ["IQR outliers", String(result.iqrOutlierCount), "Outside 1.5×IQR fences"],
                                ["Extreme", String(result.extremeOutlierCount), `${result.zOutlierCount} with |z| > 3`],
                              ].map(([label, value, detail]) => (
                                <div key={label} className="rounded-[18px] border border-slate-200 bg-[#fbfcfd] p-3.5">
                                  <p className="text-[8px] font-semibold uppercase tracking-[.09em] text-slate-400">{label}</p>
                                  <p className="mt-1.5 text-[18px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                                  <p className="mt-1 text-[8px] leading-4 text-slate-400">{detail}</p>
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-4 2xl:grid-cols-2">
                              <CopyableFigureSurface title={`Figure · Histogram — ${result.label}`} caption={`Observed distribution for ${result.label}; N = ${result.n}.`}><HistogramPlot result={result} /></CopyableFigureSurface>
                              <CopyableFigureSurface title={`Figure · Normal Q–Q plot — ${result.label}`} caption={`Observed quantiles for ${result.label} against theoretical normal quantiles.`}><QQPlot result={result} /></CopyableFigureSurface>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[8px] text-slate-400">
                              <span>Q1 {formatNumber(result.q1, 3)}</span>
                              <span>Q3 {formatNumber(result.q3, 3)}</span>
                              <span>IQR {formatNumber(result.iqr, 3)}</span>
                              <span>Fences {formatNumber(result.lowerFence, 3)} to {formatNumber(result.upperFence, 3)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : varianceHomogeneityResult ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      [varianceHomogeneityResult.center === "median" ? "Brown–Forsythe F" : "Levene F", formatNumber(varianceHomogeneityResult.f, 3), `${varianceHomogeneityResult.groupCount} groups`],
                      ["df", `${formatNumber(varianceHomogeneityResult.df1, 0)}, ${formatNumber(varianceHomogeneityResult.df2, 0)}`, `N = ${varianceHomogeneityResult.totalN}`],
                      ["p", formatPValue(varianceHomogeneityResult.pValue), (varianceHomogeneityResult.pValue ?? 1) < 0.05 ? "Evidence of unequal variances" : "No strong variance flag"],
                      ["Centre", varianceHomogeneityResult.center === "median" ? "Median" : "Mean", varianceHomogeneityResult.center === "median" ? "Robust Brown–Forsythe" : "Classical Levene"],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                        <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                        <p className="mt-1 text-[9px] text-slate-400">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className={`rounded-[20px] border p-4 ${(varianceHomogeneityResult.pValue ?? 1) < 0.05 ? "border-violet-200 bg-violet-50/60" : "border-cyan-100 bg-cyan-50/50"}`}>
                    <p className="text-[9px] font-semibold text-slate-800">{(varianceHomogeneityResult.pValue ?? 1) < 0.05 ? "Variance assumption needs review" : "No strong variance-homogeneity flag"}</p>
                    <p className="mt-1 text-[8px] leading-4 text-slate-500">A small p-value indicates that absolute deviations differ across groups. Consider Welch procedures or robust/non-parametric alternatives when the design and sample sizes make unequal variances consequential.</p>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                      <p className="text-[12px] font-semibold text-slate-900">Group variance diagnostics</p>
                      <p className="mt-1 text-[9px] text-slate-400">{varianceHomogeneityResult.outcomeLabel} grouped by {varianceHomogeneityResult.factorLabel}.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-left text-[10px]">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                          <tr>{["Group", "N", varianceHomogeneityResult.center === "median" ? "Median" : "Mean", "Mean absolute deviation"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {varianceHomogeneityResult.groups.map((group) => (
                            <tr key={group.value}>
                              <td className="px-4 py-3.5 font-semibold text-slate-800">{group.label}</td>
                              <td className="px-4 py-3.5 text-slate-600">{group.n}</td>
                              <td className="px-4 py-3.5 text-slate-600">{formatNumber(group.center, 3)}</td>
                              <td className="px-4 py-3.5 text-slate-600">{formatNumber(group.meanAbsoluteDeviation, 3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          ) : activeAnalysis === "nonparametric" ? (
            <div className="mt-6 space-y-5">
              {nonParametricMode === "mannwhitney" && mannWhitneyResult && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Mann–Whitney U", formatNumber(mannWhitneyResult.u, 2), `${mannWhitneyResult.groupA} vs ${mannWhitneyResult.groupB}`],
                      ["z", formatNumber(mannWhitneyResult.z, 3), "Continuity corrected"],
                      ["p", formatPValue(mannWhitneyResult.pValue), "Two-sided"],
                      ["Rank-biserial r", formatNumber(mannWhitneyResult.rankBiserial, 3), "Directional effect"],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                        <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                        <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Group ranks</p><p className="mt-1 text-[9px] text-slate-400">Medians and pooled mean ranks for the two selected groups.</p></div>
                    <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Group", "N", "Median", "Mean rank"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
                      <tr><td className="px-4 py-3.5 font-semibold text-slate-800">{mannWhitneyResult.groupA}</td><td className="px-4 py-3.5 text-slate-600">{mannWhitneyResult.nA}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(mannWhitneyResult.medianA, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(mannWhitneyResult.meanRankA, 2)}</td></tr>
                      <tr><td className="px-4 py-3.5 font-semibold text-slate-800">{mannWhitneyResult.groupB}</td><td className="px-4 py-3.5 text-slate-600">{mannWhitneyResult.nB}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(mannWhitneyResult.medianB, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(mannWhitneyResult.meanRankB, 2)}</td></tr>
                    </tbody></table></div>
                  </div>
                  <p className="px-1 text-[8px] leading-4 text-slate-400">Average ranks are used for ties. The two-sided p-value uses a tie-adjusted, continuity-corrected asymptotic normal approximation.</p>
                </>
              )}

              {nonParametricMode === "wilcoxon" && wilcoxonResult && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Complete pairs", String(wilcoxonResult.completePairs), `${wilcoxonResult.nonZeroPairs} ranked`],
                      ["W", formatNumber(wilcoxonResult.w, 2), `W+ ${formatNumber(wilcoxonResult.wPlus, 2)} · W− ${formatNumber(wilcoxonResult.wMinus, 2)}`],
                      ["p", formatPValue(wilcoxonResult.pValue), `z = ${formatNumber(wilcoxonResult.z, 3)}`],
                      ["Rank-biserial r", formatNumber(wilcoxonResult.rankBiserial, 3), `${wilcoxonResult.zeroDifferences} zero differences`],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p><p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p></div>
                    ))}
                  </div>
                  <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Paired difference</p>
                    <p className="mt-1 text-[13px] font-semibold text-slate-900">{wilcoxonResult.variableALabel} − {wilcoxonResult.variableBLabel}</p>
                    <p className="mt-1 text-[9px] text-slate-500">Median difference = {formatNumber(wilcoxonResult.medianDifference, 3)} · non-zero N = {wilcoxonResult.nonZeroPairs}</p>
                  </div>
                  <p className="px-1 text-[8px] leading-4 text-slate-400">Zero differences are excluded from the signed-rank statistic. Tied absolute differences receive average ranks.</p>
                </>
              )}

              {nonParametricMode === "kruskal" && kruskalWallisResult && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Kruskal–Wallis H", formatNumber(kruskalWallisResult.h, 3), `${kruskalWallisResult.groups.length} groups`],
                      ["df", formatNumber(kruskalWallisResult.df, 0), `N = ${kruskalWallisResult.totalN}`],
                      ["p", formatPValue(kruskalWallisResult.pValue), "Chi-square approximation"],
                      ["ε²", formatNumber(kruskalWallisResult.epsilonSquared, 3), "Omnibus effect size"],
                    ].map(([label, value, detail]) => <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p><p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p></div>)}
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Group rank summaries</p><p className="mt-1 text-[9px] text-slate-400">Observed sample size, median and mean rank by factor level.</p></div>
                    <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Group", "N", "Median", "Mean rank"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{kruskalWallisResult.groups.map((group) => <tr key={group.value}><td className="px-4 py-3.5 font-semibold text-slate-800">{group.label}</td><td className="px-4 py-3.5 text-slate-600">{group.n}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(group.median, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(group.meanRank, 2)}</td></tr>)}</tbody></table></div>
                  </div>

                  {kruskalWallisResult.pairwise.length > 0 && (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Dunn pairwise comparisons</p><p className="mt-1 text-[9px] text-slate-400">Tie-corrected z tests with Holm-adjusted p-values.</p></div><button type="button" onClick={() => void copyTableSpec(nonParametricPairwiseTableSpec(), "Post-hoc table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy post-hoc</button></div>
                      <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Comparison", "Δ mean rank", "z", "p", "Holm p"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{kruskalWallisResult.pairwise.map((comparison) => <tr key={`${comparison.groupA}-${comparison.groupB}`}><td className="px-4 py-3.5 font-semibold text-slate-800">{comparison.groupA} − {comparison.groupB}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.meanRankDifference, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.z, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatPValue(comparison.pValue)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(comparison.pAdjusted)}</td></tr>)}</tbody></table></div>
                    </div>
                  )}
                </>
              )}

              {nonParametricMode === "friedman" && friedmanResult && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Friedman χ²", formatNumber(friedmanResult.chiSquare, 3), `${friedmanResult.conditionCount} conditions`],
                      ["df", formatNumber(friedmanResult.df, 0), `N = ${friedmanResult.completeCases}`],
                      ["p", formatPValue(friedmanResult.pValue), "Chi-square approximation"],
                      ["Kendall's W", formatNumber(friedmanResult.kendallW, 3), "Concordance effect size"],
                    ].map(([label, value, detail]) => <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p><p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p></div>)}
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Condition ranks</p><p className="mt-1 text-[9px] text-slate-400">Complete-case medians and within-participant mean ranks.</p></div>
                    <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Condition", "N", "Median", "Mean rank"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{friedmanResult.conditions.map((condition) => <tr key={condition.variable}><td className="max-w-[360px] px-4 py-3.5 font-semibold text-slate-800">{condition.label}</td><td className="px-4 py-3.5 text-slate-600">{condition.n}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(condition.median, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(condition.meanRank, 2)}</td></tr>)}</tbody></table></div>
                  </div>

                  {friedmanResult.pairwise.length > 0 && (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Wilcoxon pairwise follow-ups</p><p className="mt-1 text-[9px] text-slate-400">Signed-rank comparisons with Holm-adjusted p-values.</p></div><button type="button" onClick={() => void copyTableSpec(nonParametricPairwiseTableSpec(), "Post-hoc table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy post-hoc</button></div>
                      <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Comparison", "N", "W", "z", "p", "Holm p", "r rb"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{friedmanResult.pairwise.map((comparison) => <tr key={`${comparison.variableA}-${comparison.variableB}`}><td className="max-w-[380px] px-4 py-3.5 font-semibold text-slate-800">{comparison.variableALabel} − {comparison.variableBLabel}</td><td className="px-4 py-3.5 text-slate-600">{comparison.n}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.w, 2)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.z, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatPValue(comparison.pValue)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(comparison.pAdjusted)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.rankBiserial, 3)}</td></tr>)}</tbody></table></div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : activeAnalysis === "visualizations" ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {(visualizationMode === "scatter"
                  ? [
                      ["Complete observations", visualizationScatterResult.n.toLocaleString(), `${Math.max(0, activeRows.length - visualizationScatterResult.n).toLocaleString()} rows excluded`],
                      ["Overall r", formatNumber(visualizationScatterResult.overallTrend.r, 3), visualizationShowTrend ? "Trend line shown" : "Trend line hidden"],
                      ["X", visualizationScatterResult.xLabel, visualizationScatterResult.xVariable],
                      ["Y", visualizationScatterResult.yLabel, visualizationScatterResult.yVariable],
                    ]
                  : visualizationMode === "box" || visualizationMode === "violin"
                    ? [
                        ["Observations", visualizationDistributionResult.totalN.toLocaleString(), `${visualizationDistributionResult.groups.length} plotted group${visualizationDistributionResult.groups.length === 1 ? "" : "s"}`],
                        ["Outcome", visualizationDistributionResult.outcomeLabel, visualizationDistributionResult.outcomeVariable],
                        ["Split", visualizationDistributionResult.groupLabel || "None", visualizationDistributionResult.groupVariable || "All observations"],
                        ["Plot", visualizationMode === "box" ? "Box plot" : "Violin", visualizationMode === "box" ? "Tukey 1.5×IQR" : "Kernel density"],
                      ]
                    : visualizationMode === "means"
                      ? [
                          ["Observations", visualizationMeansResult.totalN.toLocaleString(), `${visualizationMeansResult.points.length} groups`],
                          ["Outcome", visualizationMeansResult.outcomeLabel, visualizationMeansResult.outcomeVariable],
                          ["Factor", visualizationMeansResult.groupLabel, visualizationMeansResult.groupVariable],
                          ["Intervals", visualizationShowCI ? "95% CI" : "Hidden", "Student t mean intervals"],
                        ]
                      : [
                          ["Observations", visualizationInteractionResult.totalN.toLocaleString(), `${visualizationInteractionResult.cells.length} cells`],
                          ["Outcome", visualizationInteractionResult.outcomeLabel, visualizationInteractionResult.outcomeVariable],
                          ["X factor", visualizationInteractionResult.xFactorLabel, `${visualizationInteractionResult.xLevels.length} levels`],
                          ["Trace factor", visualizationInteractionResult.traceFactorLabel, `${visualizationInteractionResult.traceLevels.length} levels`],
                        ]
                ).map(([label, value, detail]) => (
                  <div key={label} className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 truncate text-[18px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              {visualizationMode === "scatter" ? (
                <CopyableFigureSurface title={`Figure · ${visualizationScatterResult.yLabel} by ${visualizationScatterResult.xLabel}`} caption={`Scatterplot using the current Analysis Lab sample${visualizationScatterResult.groupLabel ? `, grouped by ${visualizationScatterResult.groupLabel}` : ""}.`}><VisualizationScatterPlot result={visualizationScatterResult} showTrend={visualizationShowTrend} /></CopyableFigureSurface>
              ) : visualizationMode === "box" ? (
                <CopyableFigureSurface title={`Figure · Box plot — ${visualizationDistributionResult.outcomeLabel}`} caption={`Distribution of ${visualizationDistributionResult.outcomeLabel}${visualizationDistributionResult.groupLabel ? ` by ${visualizationDistributionResult.groupLabel}` : ""}.`}><VisualizationBoxPlot result={visualizationDistributionResult} /></CopyableFigureSurface>
              ) : visualizationMode === "violin" ? (
                <CopyableFigureSurface title={`Figure · Violin plot — ${visualizationDistributionResult.outcomeLabel}`} caption={`Density and distribution of ${visualizationDistributionResult.outcomeLabel}${visualizationDistributionResult.groupLabel ? ` by ${visualizationDistributionResult.groupLabel}` : ""}.`}><VisualizationViolinPlot result={visualizationDistributionResult} /></CopyableFigureSurface>
              ) : visualizationMode === "means" ? (
                <CopyableFigureSurface title={`Figure · Group means — ${visualizationMeansResult.outcomeLabel}`} caption={`Group means for ${visualizationMeansResult.outcomeLabel}${visualizationShowCI ? " with 95% confidence intervals" : ""}.`}><VisualizationMeansPlot result={visualizationMeansResult} showCI={visualizationShowCI} /></CopyableFigureSurface>
              ) : (
                <CopyableFigureSurface title={`Figure · Interaction plot — ${visualizationInteractionResult.outcomeLabel}`} caption={`Mean ${visualizationInteractionResult.outcomeLabel} across ${visualizationInteractionResult.xFactorLabel}, traced by ${visualizationInteractionResult.traceFactorLabel}${visualizationShowCI ? ", with 95% confidence intervals" : ""}.`}><VisualizationInteractionPlot result={visualizationInteractionResult} showCI={visualizationShowCI} /></CopyableFigureSurface>
              )}

              <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
                <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-800">Plot data summary</p>
                      <p className="mt-0.5 text-[8px] leading-4 text-slate-400">Use Copy formatted table to move the numerical summary into Thesis Builder.</p>
                    </div>
                    <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">Current sample</span>
                  </div>
                  <div className="p-4 text-[9px] leading-5 text-slate-500">
                    {visualizationMode === "scatter"
                      ? `The scatterplot uses ${visualizationScatterResult.n.toLocaleString()} complete X–Y observations${visualizationScatterResult.groupLabel ? ` with complete ${visualizationScatterResult.groupLabel} values` : ""}. The reported r and trend coefficients are descriptive summaries of this plotted sample.`
                      : visualizationMode === "box" || visualizationMode === "violin"
                        ? `${visualizationDistributionResult.totalN.toLocaleString()} numeric observations contribute to the displayed distribution${visualizationDistributionResult.groupLabel ? ` across ${visualizationDistributionResult.groups.length} ${visualizationDistributionResult.groupLabel} levels` : ""}. Missing outcome/group values are omitted from the plot.`
                        : visualizationMode === "means"
                          ? `${visualizationMeansResult.totalN.toLocaleString()} complete grouped observations contribute to the means. Confidence intervals are computed independently within each observed group.`
                          : `${visualizationInteractionResult.totalN.toLocaleString()} complete outcome × factor observations contribute to the cell means. Empty combinations remain absent rather than being imputed.`}
                  </div>
                </div>

                <div className="rounded-[22px] border border-violet-100 bg-violet-50/35 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-violet-700">Interpretation boundary</p>
                  <p className="mt-2 text-[9px] leading-5 text-slate-600">Plots help inspect patterns, distributions and model-relevant structure, but they do not replace the formal statistical test. Use the matching Analysis Lab procedure for inference and report the plotted sample transparently.</p>
                  {visualizationMode === "interaction" ? <p className="mt-2 text-[8px] leading-4 text-violet-700">Non-parallel lines are a visual cue only. A factorial ANOVA/ANCOVA, regression interaction term, or mixed model should test the interaction formally.</p> : null}
                </div>
              </div>
            </div>
          ) : activeAnalysis === "categorical" && categoricalAssociationResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Observations", categoricalAssociationResult.totalN.toLocaleString(), `${categoricalAssociationResult.missingN} missing pairs`],
                  ["Pearson χ²", formatNumber(categoricalAssociationResult.chiSquare, 3), `df = ${formatNumber(categoricalAssociationResult.df, 0)}`],
                  ["p", formatPValue(categoricalAssociationResult.pValue), `Cramér's V = ${formatNumber(categoricalAssociationResult.cramerV, 3)}`],
                  ["Expected counts", formatNumber(categoricalAssociationResult.minExpectedCount, 2), `${categoricalAssociationResult.expectedBelowFiveCount} cells below 5`],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              <div className={`rounded-[22px] border p-4 shadow-[0_8px_24px_rgba(15,23,42,.04)] ${categoricalAssociationResult.assumptionFlag === "ok" ? "border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_65%)]" : "border-violet-200 bg-[linear-gradient(120deg,#faf7ff_0%,#ffffff_65%)]"}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className={`text-[8px] font-semibold uppercase tracking-[.1em] ${categoricalAssociationResult.assumptionFlag === "ok" ? "text-cyan-700" : "text-violet-700"}`}>Expected-cell review</p>
                    <p className="mt-1 text-[12px] font-semibold text-slate-900">{categoricalAssociationResult.assumptionFlag === "ok" ? "Pearson χ² expected counts look adequate" : "Sparse expected counts deserve review"}</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-500">Minimum expected count = {formatNumber(categoricalAssociationResult.minExpectedCount, 2)} · {categoricalAssociationResult.expectedBelowFiveCount} of {categoricalAssociationResult.cells.length} cells below 5 · {categoricalAssociationResult.expectedBelowOneCount} below 1.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-700">{categoricalAssociationResult.rowLevels.length} × {categoricalAssociationResult.columnLevels.length} table</span>
                    {categoricalAssociationResult.fisherExactPValue !== null ? <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-violet-800">Fisher p {formatPValue(categoricalAssociationResult.fisherExactPValue)}</span> : null}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Contingency table</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">Observed counts with row percentages. Expected counts and standardized residuals are shown underneath each cell.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void copyTableSpec(categoricalTestsTableSpec(), "Association tests copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy tests</button>
                    <button type="button" onClick={() => void copyTableSpec(categoricalCellDiagnosticsTableSpec(), "Cell diagnostics copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy cell diagnostics</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">{categoricalAssociationResult.rowVariableLabel}</th>
                        {categoricalAssociationResult.columnLevels.map((level) => <th key={level} className="px-4 py-3 text-center font-semibold">{level}</th>)}
                        <th className="px-4 py-3 text-center font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoricalAssociationResult.rowLevels.map((rowLevel, rowIndex) => (
                        <tr key={rowLevel}>
                          <td className="px-4 py-3.5 font-semibold text-slate-800">{rowLevel}</td>
                          {categoricalAssociationResult.columnLevels.map((columnLevel) => {
                            const cell = categoricalAssociationResult.cells.find((candidate) => candidate.rowLevel === rowLevel && candidate.columnLevel === columnLevel);
                            const residual = cell?.adjustedResidual ?? null;
                            const notable = residual !== null && Math.abs(residual) >= 1.96;
                            return (
                              <td key={columnLevel} className={`px-4 py-3 text-center ${notable ? "bg-violet-50/65" : ""}`}>
                                <p className="text-[12px] font-semibold tabular-nums text-slate-900">{cell?.observed ?? 0}</p>
                                <p className="mt-0.5 text-[8px] tabular-nums text-slate-400">{formatPercent(cell?.rowPercent ?? null)} row</p>
                                <p className={`mt-1 text-[8px] tabular-nums ${notable ? "font-semibold text-violet-700" : "text-slate-400"}`}>E {formatNumber(cell?.expected ?? null, 1)} · z {formatNumber(cell?.adjustedResidual ?? null, 2)}</p>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center font-semibold tabular-nums text-slate-700">{categoricalAssociationResult.rowTotals[rowIndex]}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50/55">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-slate-600">Total</td>
                        {categoricalAssociationResult.columnTotals.map((count, index) => <td key={categoricalAssociationResult.columnLevels[index]} className="px-4 py-3 text-center font-semibold tabular-nums text-slate-700">{count}</td>)}
                        <td className="px-4 py-3 text-center font-semibold tabular-nums text-slate-900">{categoricalAssociationResult.totalN}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-[12px] font-semibold text-slate-900">Association tests</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-400">Omnibus association, effect size, and exact 2×2 inference when applicable.</p>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
                  {[
                    ["χ²", formatNumber(categoricalAssociationResult.chiSquare, 3), `df ${formatNumber(categoricalAssociationResult.df, 0)}`],
                    ["Pearson p", formatPValue(categoricalAssociationResult.pValue), "Asymptotic χ² test"],
                    [categoricalAssociationResult.phi !== null ? "Phi" : "Cramér's V", formatNumber(categoricalAssociationResult.phi ?? categoricalAssociationResult.cramerV, 3), "Association effect size"],
                    ["Notable cells", String(categoricalAssociationResult.notableResidualCount), "|adjusted residual| ≥ 1.96"],
                  ].map(([label, value, detail]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p><p className="mt-1 text-[8px] text-slate-400">{detail}</p></div>)}
                </div>
                {categoricalAssociationResult.fisherExactPValue !== null ? (
                  <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-3 sm:p-5">
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/45 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-violet-500">Fisher exact p</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{formatPValue(categoricalAssociationResult.fisherExactPValue)}</p></div>
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/45 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-violet-500">Odds ratio</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{formatNumber(categoricalAssociationResult.oddsRatio, 3)}</p><p className="mt-1 text-[7px] leading-3 text-violet-500">{categoricalAssociationResult.rowLevels[0]} / {categoricalAssociationResult.rowLevels[1]} across {categoricalAssociationResult.columnLevels[0]} / {categoricalAssociationResult.columnLevels[1]}</p></div>
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/45 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-violet-500">95% CI for OR</p><p className="mt-1.5 text-[13px] font-semibold text-slate-900">{formatNumber(categoricalAssociationResult.oddsRatioCi95Low, 3)}, {formatNumber(categoricalAssociationResult.oddsRatioCi95High, 3)}</p></div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[8px] leading-4 text-slate-400">
                Pearson χ² tests overall independence. Cramér's V/Phi describe association strength. Adjusted residuals identify cells contributing strongly to the overall pattern; use them as diagnostics rather than uncorrected multiple hypothesis tests. Fisher's exact test is automatically supplied for 2×2 tables, especially useful when expected counts are sparse.
              </div>
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
          ) : activeAnalysis === "power" && !powerResult.issue && powerResult.sampleSize !== null && powerResult.achievedPower !== null ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  [powerMode === "apriori" ? "Required N" : "Total N", powerResult.sampleSize.toLocaleString(), powerResult.sampleSizePerGroup !== null ? `≈ ${powerResult.sampleSizePerGroup} per group` : powerTest === "one_way_anova" ? `${powerGroups} groups` : powerTails === "two" ? "Two-sided" : "One-sided"],
                  ["Estimated power", formatNumber(powerResult.achievedPower, 3), powerMode === "apriori" ? `Target ${formatNumber(powerTarget, 2)}` : `α = ${formatNumber(powerAlpha, 3)}`],
                  [powerTest === "correlation" ? "Expected r" : powerTest === "one_way_anova" ? "Cohen f" : powerTest === "paired_t" ? "Cohen dz" : "Cohen d", formatNumber(powerEffectSize, 3), powerResult.methodLabel],
                  [powerMode === "apriori" ? "Recruit target" : "Planning method", powerMode === "apriori" ? Math.ceil(powerResult.sampleSize / Math.max(0.01, 1 - powerLossRate)).toLocaleString() : powerResult.methodLabel, powerMode === "apriori" ? `${Math.round(powerLossRate * 100)}% expected loss` : "Sensitivity estimate"],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.3fr_.8fr]">
                <CopyableFigureSurface
                  title={`Figure · Power curve — ${powerTest === "independent_t" ? "independent-samples t test" : powerTest === "paired_t" ? "paired t test" : powerTest === "correlation" ? "correlation" : "one-way ANOVA"}`}
                  caption={`Expected power across nearby total sample sizes for effect size ${formatNumber(powerEffectSize, 3)} and α = ${formatNumber(powerAlpha, 3)}.`}
                >
                  <PowerCurvePlot result={powerResult} />
                </CopyableFigureSurface>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[10px] font-semibold text-slate-800">Planning summary</p><p className="mt-0.5 text-[8px] leading-4 text-slate-400">The exact settings behind this estimate.</p></div>
                    <button type="button" onClick={() => void copyTableSpec(powerTableSpec(), "Power table copied")} className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-800">Copy table</button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      ["Mode", powerMode === "apriori" ? "A priori" : "Achieved power"],
                      ["Alpha", formatNumber(powerAlpha, 3)],
                      ["Effect size", formatNumber(powerEffectSize, 3)],
                      ...(powerTest !== "one_way_anova" ? [["Alternative", powerTails === "two" ? "Two-sided" : "One-sided"]] : [["Groups", String(powerGroups)]]),
                      ...(powerMode === "apriori" ? [["Target power", formatNumber(powerTarget, 3)]] : []),
                      ["Estimated power", formatNumber(powerResult.achievedPower, 3)],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0"><span className="text-[8px] font-semibold uppercase tracking-[.06em] text-slate-400">{label}</span><span className="text-[10px] font-semibold text-slate-800">{value}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/45 px-4 py-3 text-[8px] leading-4 text-cyan-950/75">
                {powerTest === "one_way_anova"
                  ? "The ANOVA utility uses a noncentral-F power calculation and assumes an approximately balanced fixed-effects design. If recruitment will be strongly unbalanced, clustered or longitudinal, plan from the actual design rather than this simple omnibus approximation."
                  : "The t-test and correlation utilities use a large-sample normal approximation. They are useful for planning and sensitivity checks, but complex clustering, repeated measures, attrition and multiplicity may require additional design-specific inflation."}
              </div>
            </div>
          ) : activeAnalysis === "factor" && !factorResult.issue ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["KMO", formatNumber(factorResult.kmoOverall, 3), `${factorResult.itemCount} selected items`],
                  ["Bartlett p", formatPValue(factorResult.bartlettPValue), `χ² = ${formatNumber(factorResult.bartlettChiSquare, 2)} · df ${formatNumber(factorResult.bartlettDf, 0)}`],
                  ["Complete N", factorResult.n.toLocaleString(), `${Math.max(0, activeRows.length - factorResult.n).toLocaleString()} rows excluded`],
                  ["Factors", String(factorResult.factorCount), `Kaiser cue ${factorResult.recommendedFactorCount}`],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              {factorResult.warning ? (
                <div className="rounded-2xl border border-violet-100 bg-violet-50/55 px-4 py-3 text-[9px] leading-4 text-violet-800">
                  <span className="font-semibold">Review before interpretation. </span>{factorResult.warning}
                </div>
              ) : (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 px-4 py-3 text-[9px] leading-4 text-cyan-800">
                  No strong numerical factorability warning was triggered. Retention and interpretation still require the scree pattern, loadings and substantive theory.
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-[1.35fr_.9fr]">
                <CopyableFigureSurface title="Figure · Scree plot" caption="Eigenvalues across extracted components/factors. The scree plot should be interpreted alongside theory and other factor-retention evidence."><FactorScreePlot result={factorResult} /></CopyableFigureSurface>
                <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-800">Factorability</p>
                      <p className="mt-0.5 text-[8px] leading-4 text-slate-400">Sampling adequacy and correlation-matrix checks.</p>
                    </div>
                    <button type="button" onClick={() => void copyTableSpec(factorAdequacyTableSpec(), "Factorability table copied")} className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[8px] font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-800">Copy diagnostics</button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      ["Overall KMO", formatNumber(factorResult.kmoOverall, 3)],
                      ["Bartlett χ²", formatNumber(factorResult.bartlettChiSquare, 3)],
                      ["Bartlett df", formatNumber(factorResult.bartlettDf, 0)],
                      ["Bartlett p", formatPValue(factorResult.bartlettPValue)],
                      ["Correlation determinant", formatNumber(factorResult.determinant, 6)],
                      ["Extraction", factorResult.extraction === "principal_axis" ? "Principal axis" : "Principal components"],
                      ["Rotation", factorResult.rotation === "promax" ? "Promax" : factorResult.rotation === "varimax" ? "Varimax" : "None"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
                        <span className="text-[8px] font-semibold uppercase tracking-[.06em] text-slate-400">{label}</span>
                        <span className="text-[10px] font-semibold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">{factorRotation === "promax" ? "Pattern matrix" : factorRotation === "varimax" ? "Rotated factor loadings" : "Factor loadings"}</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">Loadings below |{factorLoadingCutoff.toFixed(2)}| are visually suppressed. Factor signs are arbitrary.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">{factorResult.factorCount} factors</span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-slate-600">{factorResult.n} complete rows</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Item</th>
                        {Array.from({ length: factorResult.factorCount }, (_, index) => <th key={index} className="px-4 py-3 text-center font-semibold">F{index + 1}</th>)}
                        <th className="px-4 py-3 text-center font-semibold">h²</th>
                        <th className="px-4 py-3 text-center font-semibold">u²</th>
                        <th className="px-4 py-3 text-center font-semibold">MSA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(factorSortLoadings
                        ? [...factorResult.items].sort((left, right) => {
                            const factorDelta = (left.strongestFactor ?? 999) - (right.strongestFactor ?? 999);
                            if (factorDelta !== 0) return factorDelta;
                            return Math.abs(right.strongestLoading ?? 0) - Math.abs(left.strongestLoading ?? 0);
                          })
                        : factorResult.items
                      ).map((item) => (
                        <tr key={item.variable}>
                          <td className="max-w-[360px] px-4 py-3.5 font-semibold text-slate-800">
                            <p className="truncate">{item.label}</p>
                            <p className="mt-0.5 truncate font-mono text-[8px] font-normal text-slate-400">{item.variable}</p>
                          </td>
                          {item.loadings.map((loading, index) => (
                            <td key={index} className={`px-4 py-3.5 text-center tabular-nums ${Math.abs(loading) >= factorLoadingCutoff ? "font-semibold text-slate-900" : "text-slate-300"}`}>
                              {Math.abs(loading) >= factorLoadingCutoff ? formatNumber(loading, 3) : "·"}
                            </td>
                          ))}
                          <td className="px-4 py-3.5 text-center tabular-nums text-slate-600">{formatNumber(item.communality, 3)}</td>
                          <td className="px-4 py-3.5 text-center tabular-nums text-slate-600">{formatNumber(item.uniqueness, 3)}</td>
                          <td className={`px-4 py-3.5 text-center tabular-nums font-semibold ${(item.msa ?? 1) < 0.5 ? "text-violet-700" : "text-slate-700"}`}>{formatNumber(item.msa, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-4 py-3.5"><p className="text-[10px] font-semibold text-slate-800">Factor extraction summary</p></div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left text-[9px]">
                      <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.06em] text-slate-400"><tr><th className="px-4 py-2.5 font-semibold">Factor</th><th className="px-4 py-2.5 text-right font-semibold">Eigenvalue</th><th className="px-4 py-2.5 text-right font-semibold">% variance</th><th className="px-4 py-2.5 text-right font-semibold">Cumulative %</th><th className="px-4 py-2.5 text-right font-semibold">Rotated SS</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">{factorResult.variance.map((row) => <tr key={row.factor}><td className="px-4 py-3 font-semibold text-slate-700">Factor {row.factor}</td><td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.eigenvalue, 3)}</td><td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatPercent(row.proportion)}</td><td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatPercent(row.cumulative)}</td><td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatNumber(row.rotatedSsLoading, 3)}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-semibold text-slate-800">Interpretation guardrails</p>
                  <div className="mt-3 space-y-2 text-[8px] leading-4 text-slate-500">
                    <p>• Factor retention should combine the scree shape, theory and item interpretability; the eigenvalue&gt;1 cue is not a decision rule.</p>
                    <p>• Promax permits correlated factors and is usually a sensible starting point for psychological constructs. Varimax constrains factor correlations to zero.</p>
                    <p>• Low communalities, weak MSA values and strong cross-loadings deserve review before naming or scoring a factor.</p>
                    <p>• This environment performs exploratory structure analysis. Confirmatory factor analysis is a separate model and is not implied by this output.</p>
                  </div>
                  {factorResult.factorCorrelations && factorResult.factorCount > 1 ? (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[8px] font-semibold uppercase tracking-[.07em] text-slate-400">Factor correlations</p>
                      <div className="mt-2 overflow-x-auto"><table className="min-w-full text-[8px]"><thead><tr><th className="px-2 py-1"></th>{Array.from({ length: factorResult.factorCount }, (_, i) => <th key={i} className="px-2 py-1 text-center font-semibold text-slate-400">F{i + 1}</th>)}</tr></thead><tbody>{factorResult.factorCorrelations.map((row, i) => <tr key={i}><th className="px-2 py-1 text-left font-semibold text-slate-400">F{i + 1}</th>{row.map((value, j) => <td key={j} className="px-2 py-1 text-center tabular-nums text-slate-600">{formatNumber(value, 2)}</td>)}</tr>)}</tbody></table></div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : activeAnalysis === "process" && processMode === "mediation" && mediationResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Complete N", mediationResult.n.toLocaleString(), `${mediationResult.covariates.length} covariate${mediationResult.covariates.length === 1 ? "" : "s"}`],
                  ["Indirect effect", formatNumber(mediationResult.indirectEffect, 3), "a × b"],
                  ["Bootstrap 95% CI", `${formatNumber(mediationResult.bootstrapCi95Low, 3)}, ${formatNumber(mediationResult.bootstrapCi95High, 3)}`, `${mediationResult.bootstrapSamplesUsed.toLocaleString()} valid resamples`],
                  ["Outcome R²", formatNumber(mediationResult.outcomeRSquared, 3), `Mediator R² = ${formatNumber(mediationResult.mediatorRSquared, 3)}`],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 text-[18px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4">
                <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Indirect-effect model</p>
                <p className="mt-1 text-[13px] font-semibold text-slate-900">{mediationResult.predictorLabel} → {mediationResult.mediatorLabel} → {mediationResult.outcomeLabel}</p>
                <p className="mt-1 text-[9px] leading-4 text-slate-500">The indirect effect is estimated as a × b. The percentile bootstrap confidence interval is reproducible for the same dataset and configuration.</p>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Paths and effects</p><p className="mt-1 text-[9px] text-slate-400">Total, direct, mediator and indirect-effect components.</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Effect / path", "B", "SE", "t", "p", "95% CI"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {[mediationResult.pathA, mediationResult.pathB, mediationResult.totalEffect, mediationResult.directEffect].map((effect) => (
                        <tr key={effect.label}><td className="px-4 py-3.5 font-semibold text-slate-800">{effect.label}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.b, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.se, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.t, 3)}</td><td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(effect.pValue)}</td><td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.ci95Low, 3)}, {formatNumber(effect.ci95High, 3)}</td></tr>
                      ))}
                      <tr className="bg-cyan-50/35"><td className="px-4 py-3.5 font-semibold text-cyan-900">Indirect effect · a × b</td><td className="px-4 py-3.5 tabular-nums font-semibold text-cyan-900">{formatNumber(mediationResult.indirectEffect, 3)}</td><td className="px-4 py-3.5 text-slate-400">Bootstrap</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="whitespace-nowrap px-4 py-3.5 tabular-nums font-semibold text-cyan-900">{formatNumber(mediationResult.bootstrapCi95Low, 3)}, {formatNumber(mediationResult.bootstrapCi95High, 3)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-[22px] border border-violet-100 bg-violet-50/45 p-4 text-[9px] leading-5 text-violet-900/75">
                Mediation is a statistical decomposition of associations. A non-zero indirect-effect interval does not by itself establish temporal or causal mediation; study design, temporal ordering and assumptions still matter.
              </div>
            </div>
          ) : activeAnalysis === "process" && processMode === "moderation" && moderationResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Complete N", moderationResult.n.toLocaleString(), `${moderationResult.covariates.length} covariate${moderationResult.covariates.length === 1 ? "" : "s"}`],
                  ["Interaction B", formatNumber(moderationResult.interactionEffect.b, 3), `p = ${formatPValue(moderationResult.interactionEffect.pValue)}`],
                  ["R²", formatNumber(moderationResult.rSquared, 3), `Adjusted ${formatNumber(moderationResult.adjustedRSquared, 3)}`],
                  ["ΔR² interaction", formatNumber(moderationResult.rSquaredChange, 3), "Full minus main-effects model"],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 text-[18px] font-semibold tracking-[-.03em] text-slate-950">{value}</p><p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4">
                <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Interaction model</p>
                <p className="mt-1 text-[13px] font-semibold text-slate-900">{moderationResult.predictorLabel} × {moderationResult.moderatorLabel} → {moderationResult.outcomeLabel}</p>
                <p className="mt-1 text-[9px] leading-4 text-slate-500">{moderationResult.centerPredictors ? "X and W were mean-centered before the product term was formed." : "The interaction uses raw X and W values."} Simple slopes probe the fitted interaction at W mean ±1 SD.</p>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Interaction coefficients</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Effect", "B", "SE", "t", "p", "95% CI"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{[moderationResult.predictorEffect, moderationResult.moderatorEffect, moderationResult.interactionEffect].map((effect) => <tr key={effect.label}><td className="px-4 py-3.5 font-semibold text-slate-800">{effect.label}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.b, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.se, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.t, 3)}</td><td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(effect.pValue)}</td><td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.ci95Low, 3)}, {formatNumber(effect.ci95High, 3)}</td></tr>)}</tbody></table></div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Simple slopes</p><p className="mt-1 text-[9px] text-slate-400">Conditional effect of X across the moderator distribution.</p></div><button type="button" onClick={() => void copyTableSpec(processSimpleSlopesTableSpec(), "Simple-slopes table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy simple slopes</button></div>
                <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Moderator", "W value", "B", "SE", "t", "p", "95% CI"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{moderationResult.simpleSlopes.map((slope) => <tr key={slope.moderatorPoint}><td className="px-4 py-3.5 font-semibold text-slate-800">{slope.moderatorPoint === "low" ? "Mean − 1 SD" : slope.moderatorPoint === "high" ? "Mean + 1 SD" : "Mean"}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(slope.moderatorValue, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(slope.b, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(slope.se, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(slope.t, 3)}</td><td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(slope.pValue)}</td><td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(slope.ci95Low, 3)}, {formatNumber(slope.ci95High, 3)}</td></tr>)}</tbody></table></div>
              </div>
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
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Model assumptions & influence</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">Residual shape, heteroscedasticity, autocorrelation and influential-observation screening.</p>
                  </div>
                  <button type="button" onClick={() => void copyTableSpec(regressionDiagnosticsTableSpec(), "Diagnostics table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy diagnostics</button>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 sm:p-5">
                  {[
                    ["Residual JB p", formatPValue(linearRegressionResult.diagnostics.residualJarqueBeraPValue), (linearRegressionResult.diagnostics.residualJarqueBeraPValue ?? 1) < 0.05 ? "Review residual shape" : "No strong shape flag"],
                    ["BP / Koenker p", formatPValue(linearRegressionResult.diagnostics.breuschPaganPValue), (linearRegressionResult.diagnostics.breuschPaganPValue ?? 1) < 0.05 ? "Review variance pattern" : "No strong variance flag"],
                    ["Durbin–Watson", formatNumber(linearRegressionResult.diagnostics.durbinWatson, 3), "Residual sequence"],
                    ["Max |std. residual|", formatNumber(linearRegressionResult.diagnostics.maxAbsoluteStandardizedResidual, 3), `${linearRegressionResult.diagnostics.highResidualCount} above |3|`],
                    ["Max Cook's D", formatNumber(linearRegressionResult.diagnostics.maxCookDistance, 3), `${linearRegressionResult.diagnostics.influentialCount} above 4/N`],
                    ["Max leverage", formatNumber(linearRegressionResult.diagnostics.maxLeverage, 3), `${linearRegressionResult.diagnostics.highLeverageCount} high-leverage rows`],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p><p className="mt-1 text-[8px] leading-4 text-slate-400">{detail}</p></div>
                  ))}
                </div>

                <div className="grid gap-4 border-t border-slate-100 p-4 xl:grid-cols-2 2xl:grid-cols-3 sm:p-5">
                  <CopyableFigureSurface title="Figure · Regression residuals versus fitted" caption="Residuals plotted against fitted values for the current linear regression model."><RegressionResidualPlot result={linearRegressionResult} /></CopyableFigureSurface>
                  <CopyableFigureSurface title="Figure · Regression residual Q–Q plot" caption="Regression residual quantiles against theoretical normal quantiles."><RegressionQQPlot result={linearRegressionResult} /></CopyableFigureSurface>
                  <CopyableFigureSurface title="Figure · Regression influence map" caption="Leverage and standardized residuals for the current model; point size reflects Cook’s distance."><RegressionInfluencePlot result={linearRegressionResult} /></CopyableFigureSurface>
                </div>

                <div className="border-t border-slate-100 px-4 py-3 text-[8px] leading-4 text-slate-400 sm:px-5">
                  Diagnostic p-values and cut-offs are review signals, not automatic pass/fail rules. Model design, sampling, substantive plausibility and the plot pattern should be considered together.
                </div>
              </div>

              <p className="px-1 text-[8px] leading-4 text-slate-400">
                Linear Regression V1 accepts continuous or ordinal numeric predictors. Use the Logistic environment for binary outcomes and categorical predictor coding.
              </p>
            </div>
          ) : activeAnalysis === "mixed" && mixedFamily === "gaussian" && linearMixedModelResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Observations", linearMixedModelResult.n.toLocaleString(), `${linearMixedModelResult.groupCount} clusters`],
                  ["ICC", formatNumber(linearMixedModelResult.icc, 3), `Random intercept SD = ${formatNumber(linearMixedModelResult.randomInterceptSd, 3)}`],
                  ["Marginal R²", formatNumber(linearMixedModelResult.marginalR2, 3), "Fixed effects"],
                  ["Conditional R²", formatNumber(linearMixedModelResult.conditionalR2, 3), linearMixedModelResult.randomSlopeLabel ? "Fixed + random intercept/slope" : "Fixed + random intercept"],
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
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">{linearMixedModelResult.randomSlopeLabel ? "Random-intercept + slope mixed model" : "Random-intercept mixed model"}</p>
                    <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{linearMixedModelResult.outcomeLabel}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-500">
                      Repeated within <span className="font-semibold text-slate-700">{linearMixedModelResult.groupLabel}</span>
                      {linearMixedModelResult.randomSlopeLabel ? <> · random slope = <span className="font-semibold text-slate-700">{linearMixedModelResult.randomSlopeLabel}</span></> : null}
                      {" · "}
                      {linearMixedModelResult.predictors.map((predictor) => predictor.label).join(" + ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-cyan-900">{linearMixedModelResult.estimator.toUpperCase()}</span>
                    <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-violet-800">{linearMixedModelResult.centering === "none" ? "No centering" : linearMixedModelResult.centering === "grand" ? "Grand-mean centred" : "Cluster-mean centred"}</span>
                  </div>
                </div>
              </div>

              {linearMixedModelResult.warning && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/65 px-4 py-3">
                  <p className="text-[9px] font-semibold text-violet-800">Model notes</p>
                  <p className="mt-1 text-[8px] leading-4 text-violet-700/80">{linearMixedModelResult.warning}</p>
                </div>
              )}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Variance components & fit</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">Random-effects variation, residual variation, clustering and model fit.</p>
                  </div>
                  <button type="button" onClick={() => void copyTableSpec(mixedModelTableSpec(), "Mixed-model summary copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy model fit</button>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 sm:p-5">
                  {[
                    ["Random intercept variance", formatNumber(linearMixedModelResult.randomInterceptVariance, 3)],
                    ...(linearMixedModelResult.randomSlopeLabel
                      ? [
                          [`${linearMixedModelResult.randomSlopeLabel} slope variance`, formatNumber(linearMixedModelResult.randomSlopeVariance, 3)],
                          ["Intercept–slope correlation", formatNumber(linearMixedModelResult.randomInterceptSlopeCorrelation, 3)],
                        ]
                      : []),
                    ["Residual variance", formatNumber(linearMixedModelResult.residualVariance, 3)],
                    ["Log likelihood", formatNumber(linearMixedModelResult.logLikelihood, 2)],
                    ["AIC", formatNumber(linearMixedModelResult.aic, 2)],
                    ["BIC", formatNumber(linearMixedModelResult.bic, 2)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>
                  ))}
                </div>
                <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-3 sm:p-5">
                  {[
                    ["Clusters", String(linearMixedModelResult.groupCount), linearMixedModelResult.groupLabel],
                    ["Observations / cluster", formatNumber(linearMixedModelResult.meanObservationsPerGroup, 1), `range ${linearMixedModelResult.minObservationsPerGroup}–${linearMixedModelResult.maxObservationsPerGroup}`],
                    ["Random structure", linearMixedModelResult.randomSlopeLabel ? "Intercept + slope" : "Intercept", linearMixedModelResult.randomSlopeLabel || "Cluster-specific intercept"],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-white p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[15px] font-semibold text-slate-900">{value}</p><p className="mt-1 text-[8px] text-slate-400">{detail}</p></div>
                  ))}
                </div>
              </div>

              {linearMixedModelResult.structureComparison ? (
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                  <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-900">Random structure comparison</p>
                      <p className="mt-1 text-[9px] leading-4 text-slate-400">Compare the random-intercept model with the selected correlated random-slope structure.</p>
                    </div>
                    <button type="button" onClick={() => void copyTableSpec(mixedStructureComparisonTableSpec(), "Random-structure comparison copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy comparison</button>
                  </div>
                  <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
                    {[
                      ["LR χ²", formatNumber(linearMixedModelResult.structureComparison.likelihoodRatio, 3), linearMixedModelResult.structureComparison.available ? `df = ${formatNumber(linearMixedModelResult.structureComparison.df, 0)}` : "Use ML"],
                      ["Comparison p", formatPValue(linearMixedModelResult.structureComparison.pValue), linearMixedModelResult.structureComparison.available ? "Approximate boundary-aware review" : "REML fit"],
                      ["ΔAIC", formatNumber(linearMixedModelResult.structureComparison.deltaAic, 2), "Slope − intercept"],
                      ["ΔBIC", formatNumber(linearMixedModelResult.structureComparison.deltaBic, 2), "Slope − intercept"],
                    ].map(([label, value, detail]) => (
                      <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p>
                        <p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p>
                        <p className="mt-1 text-[8px] text-slate-400">{detail}</p>
                      </div>
                    ))}
                  </div>
                  {linearMixedModelResult.structureComparison.note ? <p className="border-t border-slate-100 px-4 py-3 text-[8px] leading-4 text-slate-400 sm:px-5">{linearMixedModelResult.structureComparison.note}</p> : null}
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-[12px] font-semibold text-slate-900">Fixed effects</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-400">Population-average coefficients after accounting for the selected random-effects structure.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Fixed effect", "B", "SE", "z", "p", "95% CI"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {linearMixedModelResult.coefficients.map((coefficient) => (
                        <tr key={coefficient.term}>
                          <td className="max-w-[340px] px-4 py-3.5 font-semibold text-slate-800">{coefficient.label}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.b, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.se, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.z, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(coefficient.pValue)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.ci95Low, 3)}, {formatNumber(coefficient.ci95High, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[8px] leading-4 text-slate-400">
                Linear Mixed Models now supports a random intercept plus one correlated numeric random slope. This covers common participant-specific longitudinal/time effects in ESM, ambulatory and trial-level data. More complex crossed random effects and residual autocorrelation structures remain future extensions rather than being silently approximated.
              </div>
            </div>
          ) : activeAnalysis === "mixed" && mixedFamily !== "gaussian" && generalizedMixedModelResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Observations", generalizedMixedModelResult.n.toLocaleString(), `${generalizedMixedModelResult.groupCount} clusters`],
                  ["LR χ²", formatNumber(generalizedMixedModelResult.likelihoodRatioChiSquare, 3), `df = ${formatNumber(generalizedMixedModelResult.dfModel, 0)}`],
                  ["Model p", formatPValue(generalizedMixedModelResult.pValue), `AIC = ${formatNumber(generalizedMixedModelResult.aic, 2)}`],
                  ["Random intercept SD", formatNumber(generalizedMixedModelResult.randomInterceptSd, 3), generalizedMixedModelResult.family === "binomial" ? `latent ICC = ${formatNumber(generalizedMixedModelResult.latentIcc, 3)}` : "Cluster heterogeneity"],
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
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">{generalizedMixedModelResult.family === "binomial" ? "Binary generalized mixed model" : "Poisson generalized mixed model"}</p>
                    <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{generalizedMixedModelResult.outcomeLabel}</p>
                    <p className="mt-1 text-[9px] text-slate-500">Random intercept for <span className="font-semibold text-slate-700">{generalizedMixedModelResult.groupLabel}</span>{generalizedMixedModelResult.positiveClass ? <> · event = <span className="font-semibold text-slate-700">{generalizedMixedModelResult.positiveClass}</span></> : null}{generalizedMixedModelResult.exposureLabel ? <> · exposure = <span className="font-semibold text-slate-700">{generalizedMixedModelResult.exposureLabel}</span></> : null}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold ${generalizedMixedModelResult.converged ? "border-cyan-200 bg-white text-cyan-900" : "border-violet-200 bg-violet-50 text-violet-700"}`}>{generalizedMixedModelResult.converged ? `Converged · ${generalizedMixedModelResult.iterations} steps` : "Review convergence"}</span>
                    <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-violet-800">{generalizedMixedModelResult.quadraturePoints}-point quadrature</span>
                  </div>
                </div>
              </div>

              {generalizedMixedModelResult.warning ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/65 px-4 py-3">
                  <p className="text-[9px] font-semibold text-violet-800">Model notes</p>
                  <p className="mt-1 text-[8px] leading-4 text-violet-700/80">{generalizedMixedModelResult.warning}</p>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Model fit & random intercept</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">Marginal likelihood fit with repeated observations integrated over the cluster random intercept.</p>
                  </div>
                  <button type="button" onClick={() => void copyTableSpec(generalizedMixedModelTableSpec(), "Generalized mixed-model fit copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy model fit</button>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 sm:p-5">
                  {[
                    ["Random-intercept variance", formatNumber(generalizedMixedModelResult.randomInterceptVariance, 3)],
                    ["Log likelihood", formatNumber(generalizedMixedModelResult.logLikelihood, 2)],
                    ["AIC", formatNumber(generalizedMixedModelResult.aic, 2)],
                    ["BIC", formatNumber(generalizedMixedModelResult.bic, 2)],
                    ["Observed mean", formatNumber(generalizedMixedModelResult.meanObserved, 3)],
                    ["Model mean", formatNumber(generalizedMixedModelResult.meanPredicted, 3)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>
                  ))}
                </div>
                <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-3 sm:p-5">
                  {[
                    ["Clusters", String(generalizedMixedModelResult.groupCount), generalizedMixedModelResult.groupLabel],
                    ["Observations / cluster", formatNumber(generalizedMixedModelResult.meanObservationsPerGroup, 1), `range ${generalizedMixedModelResult.minObservationsPerGroup}–${generalizedMixedModelResult.maxObservationsPerGroup}`],
                    ["Link", generalizedMixedModelResult.family === "binomial" ? "Logit" : "Log", generalizedMixedModelResult.family === "binomial" ? "Odds ratios" : "Incidence-rate ratios"],
                  ].map(([label, value, detail]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-white p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[15px] font-semibold text-slate-900">{value}</p><p className="mt-1 text-[8px] text-slate-400">{detail}</p></div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-[12px] font-semibold text-slate-900">Fixed effects & {generalizedMixedModelResult.family === "binomial" ? "odds ratios" : "incidence-rate ratios"}</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-400">Population-level fixed effects while accounting for repeated observations within the selected cluster.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Fixed effect", "B", "SE", "z", "p", generalizedMixedModelResult.family === "binomial" ? "Odds ratio" : "IRR", "95% CI"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {generalizedMixedModelResult.coefficients.map((coefficient) => (
                        <tr key={coefficient.term}>
                          <td className="max-w-[360px] px-4 py-3.5 font-semibold text-slate-800">{coefficient.label}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.b, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.se, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.z, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(coefficient.pValue)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-cyan-900">{formatNumber(coefficient.effectRatio, 3)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.ci95Low, 3)}, {formatNumber(coefficient.ci95High, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[8px] leading-4 text-slate-400">
                Generalized Mixed Models V1 fits a random intercept with 15-point Gauss–Hermite quadrature. Use the continuous Mixed Models mode when the outcome is approximately continuous. Generalized random slopes, crossed random effects and zero-inflated mixed models remain future extensions rather than being silently approximated.
              </div>
            </div>
          ) : activeAnalysis === "logistic" && logisticMode === "binary" && binaryLogisticResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Observations", binaryLogisticResult.n.toLocaleString(), `${binaryLogisticResult.positiveN} events · ${binaryLogisticResult.negativeN} non-events`],
                  ["LR χ²", formatNumber(binaryLogisticResult.likelihoodRatioChiSquare, 3), `df = ${formatNumber(binaryLogisticResult.dfModel, 0)}`],
                  ["Model p", formatPValue(binaryLogisticResult.pValue), `McFadden R² = ${formatNumber(binaryLogisticResult.mcfaddenR2, 3)}`],
                  ["AUC", formatNumber(binaryLogisticResult.classification.auc, 3), `Accuracy = ${formatPercent(binaryLogisticResult.classification.accuracy)}`],
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
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Binary outcome model</p>
                    <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{binaryLogisticResult.outcomeLabel}</p>
                    <p className="mt-1 text-[9px] text-slate-500">Event = <span className="font-semibold text-slate-700">{binaryLogisticResult.positiveClass}</span> · reference outcome = {binaryLogisticResult.negativeClass}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold ${binaryLogisticResult.converged ? "border-cyan-200 bg-white text-cyan-900" : "border-violet-200 bg-violet-50 text-violet-700"}`}>{binaryLogisticResult.converged ? `Converged · ${binaryLogisticResult.iterations} iterations` : "Review convergence"}</span>
                    <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-violet-800">Nagelkerke R² = {formatNumber(binaryLogisticResult.nagelkerkeR2, 3)}</span>
                  </div>
                </div>
              </div>

              {binaryLogisticResult.warning && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/65 px-4 py-3">
                  <p className="text-[9px] font-semibold text-violet-800">Model review signal</p>
                  <p className="mt-1 text-[8px] leading-4 text-violet-700/80">{binaryLogisticResult.warning}</p>
                </div>
              )}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Model fit</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">Likelihood-ratio model test, information criteria and pseudo-R².</p>
                  </div>
                  <button type="button" onClick={() => void copyTableSpec(logisticModelTableSpec(), "Model-fit table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy model fit</button>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
                  {[
                    ["−2 log likelihood", formatNumber(binaryLogisticResult.deviance, 2)],
                    ["AIC", formatNumber(binaryLogisticResult.aic, 2)],
                    ["BIC", formatNumber(binaryLogisticResult.bic, 2)],
                    ["Nagelkerke R²", formatNumber(binaryLogisticResult.nagelkerkeR2, 3)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
                  <p className="text-[12px] font-semibold text-slate-900">Coefficients & odds ratios</p>
                  <p className="mt-1 text-[9px] leading-4 text-slate-400">Wald tests, exponentiated coefficients and 95% confidence intervals.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Predictor", "B", "SE", "z", "p", "Odds ratio", "95% CI for OR"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {binaryLogisticResult.coefficients.map((coefficient) => (
                        <tr key={coefficient.term}>
                          <td className="max-w-[360px] px-4 py-3.5 font-semibold text-slate-800">{coefficient.label}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.b, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.se, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.z, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(coefficient.pValue)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-cyan-900">{formatNumber(coefficient.oddsRatio, 3)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.ci95Low, 3)}, {formatNumber(coefficient.ci95High, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900">Classification</p>
                    <p className="mt-1 text-[9px] leading-4 text-slate-400">Threshold-dependent confusion metrics plus threshold-independent AUC.</p>
                  </div>
                  <button type="button" onClick={() => void copyTableSpec(logisticClassificationTableSpec(), "Classification table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy classification</button>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 sm:p-5">
                  {[
                    ["Accuracy", formatPercent(binaryLogisticResult.classification.accuracy)],
                    ["Sensitivity", formatPercent(binaryLogisticResult.classification.sensitivity)],
                    ["Specificity", formatPercent(binaryLogisticResult.classification.specificity)],
                    ["Precision", formatPercent(binaryLogisticResult.classification.precision)],
                    ["F1", formatNumber(binaryLogisticResult.classification.f1, 3)],
                    ["AUC", formatNumber(binaryLogisticResult.classification.auc, 3)],
                    ["Brier", formatNumber(binaryLogisticResult.classification.brierScore, 3)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-4 sm:p-5">
                  <div className="mx-auto grid max-w-xl grid-cols-[120px_1fr_1fr] overflow-hidden rounded-2xl border border-slate-200 text-center text-[9px]">
                    <div className="bg-slate-50 p-3 font-semibold text-slate-500">Observed / predicted</div>
                    <div className="bg-slate-50 p-3 font-semibold text-slate-500">{binaryLogisticResult.positiveClass}</div>
                    <div className="bg-slate-50 p-3 font-semibold text-slate-500">{binaryLogisticResult.negativeClass}</div>
                    <div className="border-t border-slate-200 bg-slate-50 p-3 font-semibold text-slate-500">{binaryLogisticResult.positiveClass}</div>
                    <div className="border-l border-t border-slate-200 p-3 font-semibold text-cyan-900">{binaryLogisticResult.classification.truePositive}</div>
                    <div className="border-l border-t border-slate-200 p-3 text-slate-700">{binaryLogisticResult.classification.falseNegative}</div>
                    <div className="border-t border-slate-200 bg-slate-50 p-3 font-semibold text-slate-500">{binaryLogisticResult.negativeClass}</div>
                    <div className="border-l border-t border-slate-200 p-3 text-slate-700">{binaryLogisticResult.classification.falsePositive}</div>
                    <div className="border-l border-t border-slate-200 p-3 font-semibold text-cyan-900">{binaryLogisticResult.classification.trueNegative}</div>
                  </div>
                  <p className="mt-3 text-center text-[8px] leading-4 text-slate-400">Current threshold = {binaryLogisticResult.classification.threshold.toFixed(2)}. Classification metrics are descriptive for the analysed sample; held-out validation is required for predictive-performance claims.</p>
                </div>
              </div>
            </div>
          ) : activeAnalysis === "logistic" && logisticMode === "multinomial" && multinomialLogisticResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Observations", multinomialLogisticResult.n.toLocaleString(), multinomialLogisticResult.classCounts.map((item) => `${item.level}: ${item.count}`).join(" · ")],
                  ["LR χ²", formatNumber(multinomialLogisticResult.likelihoodRatioChiSquare, 3), `df = ${formatNumber(multinomialLogisticResult.dfModel, 0)}`],
                  ["Model p", formatPValue(multinomialLogisticResult.pValue), `McFadden R² = ${formatNumber(multinomialLogisticResult.mcfaddenR2, 3)}`],
                  ["Accuracy", formatPercent(multinomialLogisticResult.classification.accuracy), `Macro recall = ${formatNumber(multinomialLogisticResult.classification.macroRecall, 3)}`],
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
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Multinomial outcome model</p>
                    <p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{multinomialLogisticResult.outcomeLabel}</p>
                    <p className="mt-1 text-[9px] text-slate-500">Reference outcome = <span className="font-semibold text-slate-700">{multinomialLogisticResult.referenceClass}</span> · {multinomialLogisticResult.classes.length} observed categories</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold ${multinomialLogisticResult.converged ? "border-cyan-200 bg-white text-cyan-900" : "border-violet-200 bg-violet-50 text-violet-700"}`}>{multinomialLogisticResult.converged ? `Converged · ${multinomialLogisticResult.iterations} steps` : "Review convergence"}</span>
                </div>
              </div>

              {multinomialLogisticResult.warning && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/65 px-4 py-3">
                  <p className="text-[9px] font-semibold text-violet-800">Model review signal</p>
                  <p className="mt-1 text-[8px] leading-4 text-violet-700/80">{multinomialLogisticResult.warning}</p>
                </div>
              )}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div><p className="text-[12px] font-semibold text-slate-900">Model fit</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Likelihood-ratio test, pseudo-R² and information criteria.</p></div>
                  <button type="button" onClick={() => void copyTableSpec(logisticModelTableSpec(), "Model-fit table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy model fit</button>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 sm:p-5">
                  {[
                    ["Log likelihood", formatNumber(multinomialLogisticResult.logLikelihood, 2)],
                    ["Deviance", formatNumber(multinomialLogisticResult.deviance, 2)],
                    ["McFadden R²", formatNumber(multinomialLogisticResult.mcfaddenR2, 3)],
                    ["AIC", formatNumber(multinomialLogisticResult.aic, 2)],
                    ["BIC", formatNumber(multinomialLogisticResult.bic, 2)],
                    ["Log loss", formatNumber(multinomialLogisticResult.classification.logLoss, 3)],
                  ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>)}
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Class-specific coefficients & odds ratios</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Each coefficient compares the listed outcome category with {multinomialLogisticResult.referenceClass}.</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Outcome comparison", "Predictor", "B", "SE", "z", "p", "OR", "95% CI for OR"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {multinomialLogisticResult.coefficients.map((coefficient, index) => (
                        <tr key={`${coefficient.outcomeClass}_${coefficient.term}_${index}`}>
                          <td className="px-4 py-3.5 font-semibold text-cyan-900">{coefficient.outcomeClass} vs {coefficient.referenceClass}</td>
                          <td className="max-w-[320px] px-4 py-3.5 font-semibold text-slate-800">{coefficient.label}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.b, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.se, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.z, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(coefficient.pValue)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-cyan-900">{formatNumber(coefficient.oddsRatio, 3)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.ci95Low, 3)}, {formatNumber(coefficient.ci95High, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div><p className="text-[12px] font-semibold text-slate-900">Classification</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Observed-category confusion matrix and descriptive sample classification.</p></div>
                  <button type="button" onClick={() => void copyTableSpec(logisticClassificationTableSpec(), "Classification table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy classification</button>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
                  {[["Accuracy", formatPercent(multinomialLogisticResult.classification.accuracy)], ["Macro recall", formatNumber(multinomialLogisticResult.classification.macroRecall, 3)], ["Log loss", formatNumber(multinomialLogisticResult.classification.logLoss, 3)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>)}
                </div>
                <div className="overflow-x-auto border-t border-slate-100 p-4 sm:p-5">
                  <table className="mx-auto min-w-max border-collapse text-center text-[9px]">
                    <thead><tr><th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-500">Observed / predicted</th>{multinomialLogisticResult.classes.map((level) => <th key={level} className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-500">{level}</th>)}</tr></thead>
                    <tbody>{multinomialLogisticResult.classes.map((level, row) => <tr key={level}><th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-500">{level}</th>{multinomialLogisticResult.classes.map((predicted, column) => <td key={predicted} className={`border border-slate-200 px-3 py-2 ${row === column ? "font-semibold text-cyan-900" : "text-slate-600"}`}>{multinomialLogisticResult.classification.confusionMatrix[row]?.[column] ?? 0}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeAnalysis === "logistic" && logisticMode === "ordinal" && ordinalLogisticResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Observations", ordinalLogisticResult.n.toLocaleString(), ordinalLogisticResult.classCounts.map((item) => `${item.level}: ${item.count}`).join(" · ")],
                  ["LR χ²", formatNumber(ordinalLogisticResult.likelihoodRatioChiSquare, 3), `df = ${formatNumber(ordinalLogisticResult.dfModel, 0)}`],
                  ["Model p", formatPValue(ordinalLogisticResult.pValue), `McFadden R² = ${formatNumber(ordinalLogisticResult.mcfaddenR2, 3)}`],
                  ["Exact accuracy", formatPercent(ordinalLogisticResult.classification.accuracy), `Within 1 category = ${formatPercent(ordinalLogisticResult.classification.adjacentAccuracy)}`],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p><p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p></div>
                ))}
              </div>

              <div className="rounded-[22px] border border-cyan-100 bg-[linear-gradient(120deg,#effcff_0%,#ffffff_58%,#faf7ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,.045)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">Proportional-odds model</p><p className="mt-1 truncate text-[12px] font-semibold text-slate-900">{ordinalLogisticResult.outcomeLabel}</p><p className="mt-1 text-[9px] text-slate-500">{ordinalLogisticResult.orderedLevels.join(" < ")}</p></div>
                  <span className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold ${ordinalLogisticResult.converged ? "border-cyan-200 bg-white text-cyan-900" : "border-violet-200 bg-violet-50 text-violet-700"}`}>{ordinalLogisticResult.converged ? `Converged · ${ordinalLogisticResult.iterations} steps` : "Review convergence"}</span>
                </div>
              </div>

              {ordinalLogisticResult.warning && <div className="rounded-2xl border border-violet-200 bg-violet-50/65 px-4 py-3"><p className="text-[9px] font-semibold text-violet-800">Model notes</p><p className="mt-1 text-[8px] leading-4 text-violet-700/80">{ordinalLogisticResult.warning}</p></div>}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Model fit</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Likelihood-ratio test, pseudo-R² and information criteria.</p></div><button type="button" onClick={() => void copyTableSpec(logisticModelTableSpec(), "Model-fit table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy model fit</button></div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 sm:p-5">{[["Log likelihood", formatNumber(ordinalLogisticResult.logLikelihood, 2)], ["Deviance", formatNumber(ordinalLogisticResult.deviance, 2)], ["McFadden R²", formatNumber(ordinalLogisticResult.mcfaddenR2, 3)], ["AIC", formatNumber(ordinalLogisticResult.aic, 2)], ["BIC", formatNumber(ordinalLogisticResult.bic, 2)], ["Mean category error", formatNumber(ordinalLogisticResult.classification.meanAbsoluteCategoryError, 3)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>)}</div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Common predictor effects</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Positive coefficients indicate higher odds of being in a higher outcome category.</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Predictor", "B", "SE", "z", "p", "Common OR", "95% CI for OR"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{ordinalLogisticResult.coefficients.map((coefficient) => <tr key={coefficient.term}><td className="max-w-[360px] px-4 py-3.5 font-semibold text-slate-800">{coefficient.label}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.b, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.se, 3)}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.z, 3)}</td><td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(coefficient.pValue)}</td><td className="px-4 py-3.5 tabular-nums font-semibold text-cyan-900">{formatNumber(coefficient.oddsRatio, 3)}</td><td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.ci95Low, 3)}, {formatNumber(coefficient.ci95High, 3)}</td></tr>)}</tbody></table></div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Outcome thresholds</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Estimated cumulative category boundaries on the logit scale.</p></div><button type="button" onClick={() => void copyTableSpec(ordinalThresholdsTableSpec(), "Threshold table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy thresholds</button></div>
                <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr><th className="px-4 py-3 font-semibold">Cumulative split</th><th className="px-4 py-3 font-semibold">Threshold</th></tr></thead><tbody className="divide-y divide-slate-100">{ordinalLogisticResult.thresholds.map((threshold) => <tr key={`${threshold.lowerLevel}_${threshold.upperLevel}`}><td className="px-4 py-3.5 font-semibold text-slate-800">{threshold.lowerLevel} | {threshold.upperLevel}</td><td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(threshold.estimate, 3)}</td></tr>)}</tbody></table></div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Ordinal classification</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Exact and adjacent-category agreement plus the observed/predicted category matrix.</p></div><button type="button" onClick={() => void copyTableSpec(logisticClassificationTableSpec(), "Classification table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy classification</button></div>
                <div className="grid gap-3 p-4 sm:grid-cols-4 sm:p-5">{[["Exact accuracy", formatPercent(ordinalLogisticResult.classification.accuracy)], ["Within one category", formatPercent(ordinalLogisticResult.classification.adjacentAccuracy)], ["Mean category error", formatNumber(ordinalLogisticResult.classification.meanAbsoluteCategoryError, 3)], ["Log loss", formatNumber(ordinalLogisticResult.classification.logLoss, 3)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>)}</div>
                <div className="overflow-x-auto border-t border-slate-100 p-4 sm:p-5"><table className="mx-auto min-w-max border-collapse text-center text-[9px]"><thead><tr><th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-500">Observed / predicted</th>{ordinalLogisticResult.orderedLevels.map((level) => <th key={level} className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-500">{level}</th>)}</tr></thead><tbody>{ordinalLogisticResult.orderedLevels.map((level, row) => <tr key={level}><th className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-500">{level}</th>{ordinalLogisticResult.orderedLevels.map((predicted, column) => <td key={predicted} className={`border border-slate-200 px-3 py-2 ${row === column ? "font-semibold text-cyan-900" : "text-slate-600"}`}>{ordinalLogisticResult.classification.confusionMatrix[row]?.[column] ?? 0}</td>)}</tr>)}</tbody></table></div>
              </div>
            </div>
          ) : activeAnalysis === "count" && countRegressionResult ? (
            <div className="mt-6 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {[
                  ["Observations", countRegressionResult.n.toLocaleString(), countRegressionResult.exposureLabel ? `Rate model · exposure ${countRegressionResult.exposureLabel}` : "Count model"],
                  ["LR χ²", formatNumber(countRegressionResult.likelihoodRatioChiSquare, 3), `df = ${formatNumber(countRegressionResult.dfModel, 0)}`],
                  ["Model p", formatPValue(countRegressionResult.pValue), `Deviance = ${formatNumber(countRegressionResult.deviance, 2)}`],
                  ["Dispersion", formatNumber(countRegressionResult.pearsonDispersion, 3), countRegressionResult.family === "negative_binomial" ? `α = ${formatNumber(countRegressionResult.dispersionAlpha, 4)}` : "Pearson / df"],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_2px_4px_rgba(15,23,42,.025),0_9px_22px_rgba(15,23,42,.045)]">
                    <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-slate-400">{label}</p>
                    <p className="mt-2 text-[20px] font-semibold tracking-[-.03em] text-slate-950">{value}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-cyan-100 bg-cyan-50/55 px-4 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold text-cyan-950">{countRegressionResult.family === "poisson" ? "Poisson" : "Negative-binomial NB2"} count model</p>
                    <p className="mt-1 text-[8px] leading-4 text-cyan-900/70">Mean observed = {formatNumber(countRegressionResult.meanObserved, 2)} · mean fitted = {formatNumber(countRegressionResult.meanFitted, 2)} · observed zeros = {formatPercent(countRegressionResult.observedZeroRate)} · expected zeros = {formatPercent(countRegressionResult.expectedZeroRate)}.</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-[9px] font-semibold ${countRegressionResult.converged ? "border-cyan-200 bg-white text-cyan-900" : "border-violet-200 bg-violet-50 text-violet-700"}`}>{countRegressionResult.converged ? `Converged · ${countRegressionResult.iterations} steps` : "Review convergence"}</span>
                </div>
              </div>

              {countRegressionResult.warning && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/65 px-4 py-3">
                  <p className="text-[9px] font-semibold text-violet-800">Model review signal</p>
                  <p className="mt-1 text-[8px] leading-4 text-violet-700/80">{countRegressionResult.warning}</p>
                </div>
              )}

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div><p className="text-[12px] font-semibold text-slate-900">Model fit</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Likelihood-ratio test, information criteria, residual dispersion and zero-count fit.</p></div>
                  <button type="button" onClick={() => void copyTableSpec(countModelTableSpec(), "Count-model fit copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy model fit</button>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 sm:p-5">
                  {[
                    ["Deviance", formatNumber(countRegressionResult.deviance, 2)],
                    ["AIC", formatNumber(countRegressionResult.aic, 2)],
                    ["BIC", formatNumber(countRegressionResult.bic, 2)],
                    ["Pearson dispersion", formatNumber(countRegressionResult.pearsonDispersion, 3)],
                    ["Observed zero %", formatPercent(countRegressionResult.observedZeroRate)],
                    ["Expected zero %", formatPercent(countRegressionResult.expectedZeroRate)],
                  ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p></div>)}
                </div>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><p className="text-[12px] font-semibold text-slate-900">Coefficients & incidence-rate ratios</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Wald tests, exponentiated coefficients and 95% confidence intervals.</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max text-left text-[10px]">
                    <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Predictor", "B", "SE", "z", "p", "IRR", "95% CI for IRR"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {countRegressionResult.coefficients.map((coefficient) => (
                        <tr key={coefficient.term}>
                          <td className="max-w-[360px] px-4 py-3.5 font-semibold text-slate-800">{coefficient.label}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.b, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.se, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.z, 3)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(coefficient.pValue)}</td>
                          <td className="px-4 py-3.5 tabular-nums font-semibold text-cyan-900">{formatNumber(coefficient.incidenceRateRatio, 3)}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(coefficient.ci95Low, 3)}, {formatNumber(coefficient.ci95High, 3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[8px] leading-4 text-slate-400">
                {countRegressionResult.family === "poisson"
                  ? "Poisson regression is appropriate for non-negative integer counts when the conditional variance is reasonably close to the conditional mean. If residual dispersion is clearly above 1, compare the negative-binomial family rather than relying on Poisson standard errors."
                  : "Negative-binomial NB2 allows the conditional variance to exceed the mean through an estimated dispersion parameter. PsyLattice reports the fitted dispersion and zero-count discrepancy so researchers can review whether the family is plausible."}
              </div>
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


                  {oneWayVarianceDiagnostics && !oneWayVarianceDiagnostics.issue && (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div>
                          <p className="text-[12px] font-semibold text-slate-900">Variance assumption</p>
                          <p className="mt-1 text-[9px] leading-4 text-slate-400">Brown–Forsythe screening is embedded directly into the one-way model.</p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold ${(oneWayVarianceDiagnostics.pValue ?? 1) < 0.05 ? "border-violet-200 bg-violet-50 text-violet-700" : "border-cyan-200 bg-cyan-50 text-cyan-800"}`}>
                          {(oneWayVarianceDiagnostics.pValue ?? 1) < 0.05 ? "Review unequal variances" : "No strong variance flag"}
                        </span>
                      </div>
                      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
                        {[
                          ["Brown–Forsythe F", formatNumber(oneWayVarianceDiagnostics.f, 3), `${oneWayVarianceDiagnostics.groupCount} groups`],
                          ["df", `${formatNumber(oneWayVarianceDiagnostics.df1, 0)}, ${formatNumber(oneWayVarianceDiagnostics.df2, 0)}`, `N = ${oneWayVarianceDiagnostics.totalN}`],
                          ["p", formatPValue(oneWayVarianceDiagnostics.pValue), (oneWayVarianceDiagnostics.pValue ?? 1) < 0.05 ? "Variance heterogeneity signal" : "No strong heterogeneity signal"],
                          ["Estimator", oneWayAnovaResult.estimator === "welch" ? "Welch" : "Standard", oneWayAnovaResult.estimator === "welch" ? "Already robust to unequal variances" : "Consider Welch if heterogeneity matters"],
                        ].map(([label, value, detail]) => (
                          <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"><p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">{label}</p><p className="mt-1.5 text-[16px] font-semibold text-slate-900">{value}</p><p className="mt-1 text-[8px] leading-4 text-slate-400">{detail}</p></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {oneWayAnovaResult.pairwise.length > 0 && (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Pairwise comparisons</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Holm-adjusted follow-ups across every observed group pair.</p></div><button type="button" onClick={() => void copyTableSpec(anovaPairwiseTableSpec(), "Post-hoc table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy post-hoc</button></div>
                      <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Comparison", "ΔM", "t", "df", "p", "Holm p", "d"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{oneWayAnovaResult.pairwise.map((comparison) => <tr key={`${comparison.groupA}-${comparison.groupB}`}><td className="px-4 py-3.5 font-semibold text-slate-800">{comparison.groupA} − {comparison.groupB}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.meanDifference, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.t, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.df, 2)}</td><td className="px-4 py-3.5 text-slate-600">{formatPValue(comparison.pValue)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(comparison.pAdjusted)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.cohenD, 3)}</td></tr>)}</tbody></table></div>
                    </div>
                  )}

                  <p className="px-1 text-[8px] leading-4 text-slate-400">{oneWayAnovaResult.estimator === "welch" ? "Welch ANOVA is designed for unequal variances. Conventional η² and ω² are shown as descriptive effect-size decompositions." : "Standard one-way ANOVA assumes independent observations and homogeneous within-group variance."}</p>
                </>
              ) : (anovaMode === "factorial" || anovaMode === "ancova") && generalLinearAnovaResult ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["Model", anovaMode === "ancova" ? "ANCOVA" : "Factorial", `${generalLinearAnovaResult.factors.length} factor${generalLinearAnovaResult.factors.length === 1 ? "" : "s"}${generalLinearAnovaResult.covariates.length > 0 ? ` · ${generalLinearAnovaResult.covariates.length} covariate${generalLinearAnovaResult.covariates.length === 1 ? "" : "s"}` : ""}`],
                      ["Complete cases", generalLinearAnovaResult.n.toLocaleString(), `${generalLinearAnovaResult.coefficientCount} coefficients`],
                      ["Model F", formatNumber(generalLinearAnovaResult.f, 3), `df = ${formatNumber(generalLinearAnovaResult.dfModel, 0)}, ${formatNumber(generalLinearAnovaResult.dfResidual, 0)}`],
                      ["Model fit", `R² ${formatNumber(generalLinearAnovaResult.rSquared, 3)}`, `Adj. R² ${formatNumber(generalLinearAnovaResult.adjustedRSquared, 3)} · p ${formatPValue(generalLinearAnovaResult.pValue)}`],
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
                        <p className="text-[8px] font-semibold uppercase tracking-[.1em] text-cyan-700">General linear model</p>
                        <p className="mt-1 text-[12px] font-semibold text-slate-900">{generalLinearAnovaResult.outcomeLabel}</p>
                        <p className="mt-1 text-[9px] leading-4 text-slate-500">
                          {generalLinearAnovaResult.factors.map((factor) => factor.label).join(" × ")}
                          {generalLinearAnovaResult.covariates.length > 0 ? ` · adjusted for ${generalLinearAnovaResult.covariates.map((covariate) => covariate.label).join(", ")}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-cyan-900">Type III-style</span>
                        <span className="rounded-full border border-violet-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-violet-800">{generalLinearAnovaResult.includeInteractions ? "2-way interactions" : "Main effects only"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div>
                        <p className="text-[12px] font-semibold text-slate-900">Effects</p>
                        <p className="mt-1 text-[9px] leading-4 text-slate-400">Partial F tests for each effect while retaining all other selected model terms.</p>
                      </div>
                      <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">ηp² included</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max text-left text-[10px]">
                        <thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Effect", "Type", "SS", "df", "MS", "F", "p", "ηp²"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {generalLinearAnovaResult.effects.map((effect) => (
                            <tr key={effect.term}>
                              <td className="max-w-[320px] px-4 py-3.5 font-semibold text-slate-800">{effect.label}</td>
                              <td className="px-4 py-3.5 text-slate-500">{effect.kind === "interaction" ? "Interaction" : effect.kind === "covariate" ? "Covariate" : "Factor"}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.ss, 3)}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.df1, 0)}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.ms, 3)}</td>
                              <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatNumber(effect.f, 3)}</td>
                              <td className="px-4 py-3.5 tabular-nums font-semibold text-slate-900">{formatPValue(effect.pValue)}</td>
                              <td className="px-4 py-3.5 tabular-nums text-slate-600">{formatNumber(effect.partialEtaSquared, 3)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td className="px-4 py-3.5 font-semibold text-slate-800">Residual</td><td className="px-4 py-3.5 text-slate-400">Error</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(generalLinearAnovaResult.ssResidual, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(generalLinearAnovaResult.dfResidual, 0)}</td><td className="px-4 py-3.5 text-slate-600">{generalLinearAnovaResult.dfResidual && generalLinearAnovaResult.ssResidual !== null ? formatNumber(generalLinearAnovaResult.ssResidual / generalLinearAnovaResult.dfResidual, 3) : "—"}</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td><td className="px-4 py-3.5 text-slate-400">—</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {generalLinearAnovaResult.marginalMeans.length > 0 && (
                    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div><p className="text-[12px] font-semibold text-slate-900">Estimated marginal means</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Balanced across other factor levels{generalLinearAnovaResult.covariates.length > 0 ? "; covariates held at their sample means" : ""}.</p></div>
                        <button type="button" onClick={() => void copyTableSpec(anovaMarginalMeansTableSpec(), "Marginal means copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy marginal means</button>
                      </div>
                      <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Factor", "Level", "Observed N", "Raw mean", "Adjusted mean", "SE", "95% CI"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{generalLinearAnovaResult.marginalMeans.map((mean) => <tr key={`${mean.factor}-${mean.level}`}><td className="px-4 py-3.5 font-semibold text-slate-800">{mean.factorLabel}</td><td className="px-4 py-3.5 text-slate-600">{mean.level}</td><td className="px-4 py-3.5 text-slate-600">{mean.observedN}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(mean.rawMean, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatNumber(mean.adjustedMean, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(mean.se, 3)}</td><td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatNumber(mean.ci95Low, 3)}, {formatNumber(mean.ci95High, 3)}</td></tr>)}</tbody></table></div>
                    </div>
                  )}

                  {generalLinearAnovaResult.marginalMeans.length > 0 ? <EstimatedMarginalMeansPlots result={generalLinearAnovaResult} /> : null}

                  <p className="px-1 text-[8px] leading-4 text-slate-400">Factor coding uses sum-to-zero contrasts. Effect rows are partial tests from the full model. Empty cells or redundant terms can make a factorial design singular; PsyLattice reports that condition instead of returning unstable estimates.</p>
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

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div>
                        <p className="text-[12px] font-semibold text-slate-900">Sphericity</p>
                        <p className="mt-1 text-[9px] leading-4 text-slate-400">Mauchly's test plus Greenhouse–Geisser and Huynh–Feldt epsilon estimates.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[8px] font-semibold ${repeatedMeasuresAnovaResult.sphericity.sphericityMet === false ? "border-violet-200 bg-violet-50 text-violet-800" : "border-cyan-200 bg-cyan-50 text-cyan-800"}`}>
                          {repeatedMeasuresAnovaResult.conditionCount === 2
                            ? "Automatically satisfied"
                            : repeatedMeasuresAnovaResult.sphericity.sphericityMet === false
                              ? "Review correction"
                              : repeatedMeasuresAnovaResult.sphericity.sphericityMet === true
                                ? "No strong violation"
                                : "Review estimate"}
                        </span>
                        <button type="button" onClick={() => void copyTableSpec(anovaSphericityTableSpec(), "Sphericity table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy sphericity</button>
                      </div>
                    </div>
                    {repeatedMeasuresAnovaResult.sphericity.issue ? (
                      <p className="px-5 py-4 text-[10px] leading-5 text-slate-500">{repeatedMeasuresAnovaResult.sphericity.issue}</p>
                    ) : (
                      <>
                        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
                          {[
                            ["Mauchly W", formatNumber(repeatedMeasuresAnovaResult.sphericity.mauchlyW, 3), repeatedMeasuresAnovaResult.conditionCount === 2 ? "Sphericity guaranteed" : `p = ${formatPValue(repeatedMeasuresAnovaResult.sphericity.mauchlyPValue)}`],
                            ["GG ε", formatNumber(repeatedMeasuresAnovaResult.sphericity.greenhouseGeisserEpsilon, 3), `Lower bound ${formatNumber(repeatedMeasuresAnovaResult.sphericity.lowerBoundEpsilon, 3)}`],
                            ["HF ε", formatNumber(repeatedMeasuresAnovaResult.sphericity.huynhFeldtEpsilon, 3), "Less conservative correction"],
                            ["Guidance", repeatedMeasuresAnovaResult.sphericity.recommendedCorrection === "greenhouse-geisser" ? "Use GG" : repeatedMeasuresAnovaResult.sphericity.recommendedCorrection === "huynh-feldt" ? "Use HF" : "Uncorrected", repeatedMeasuresAnovaResult.sphericity.sphericityMet === false ? "Sphericity evidence detected" : "Correction not required by Mauchly"],
                          ].map(([label, value, detail]) => <div key={label} className="rounded-[18px] border border-slate-100 bg-slate-50/60 p-3"><p className="text-[8px] font-semibold uppercase tracking-[.09em] text-slate-400">{label}</p><p className="mt-1.5 text-[15px] font-semibold text-slate-900">{value}</p><p className="mt-1 text-[8px] leading-4 text-slate-400">{detail}</p></div>)}
                        </div>
                        {repeatedMeasuresAnovaResult.conditionCount > 2 && <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Test", "W", "χ²", "df", "p"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody><tr><td className="px-4 py-3.5 font-semibold text-slate-800">Mauchly</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.mauchlyW, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.mauchlyChiSquare, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.mauchlyDf, 0)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(repeatedMeasuresAnovaResult.sphericity.mauchlyPValue)}</td></tr></tbody></table></div>}
                      </>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]">
                    <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div><p className="text-[12px] font-semibold text-slate-900">Repeated-measures ANOVA</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Uncorrected and epsilon-corrected inference shown together.</p></div>
                      <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-1 text-[8px] font-semibold text-violet-700">ηp² + ηG²</span>
                    </div>
                    <div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Correction", "ε", "df₁", "df₂", "F", "p", "ηp²", "ηG²"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">
                      <tr><td className="px-4 py-3.5 font-semibold text-slate-800">Sphericity assumed</td><td className="px-4 py-3.5 text-slate-600">1.000</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.df1, 2)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.df2, 2)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatNumber(repeatedMeasuresAnovaResult.f, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(repeatedMeasuresAnovaResult.pValue)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.partialEtaSquared, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.generalizedEtaSquared, 3)}</td></tr>
                      <tr className={repeatedMeasuresAnovaResult.sphericity.recommendedCorrection === "greenhouse-geisser" ? "bg-violet-50/45" : ""}><td className="px-4 py-3.5 font-semibold text-slate-800">Greenhouse–Geisser</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.greenhouseGeisserEpsilon, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.greenhouseGeisserDf1, 2)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.greenhouseGeisserDf2, 2)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.f, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(repeatedMeasuresAnovaResult.sphericity.greenhouseGeisserPValue)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.partialEtaSquared, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.generalizedEtaSquared, 3)}</td></tr>
                      <tr className={repeatedMeasuresAnovaResult.sphericity.recommendedCorrection === "huynh-feldt" ? "bg-violet-50/45" : ""}><td className="px-4 py-3.5 font-semibold text-slate-800">Huynh–Feldt</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.huynhFeldtEpsilon, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.huynhFeldtDf1, 2)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.sphericity.huynhFeldtDf2, 2)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.f, 3)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(repeatedMeasuresAnovaResult.sphericity.huynhFeldtPValue)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.partialEtaSquared, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(repeatedMeasuresAnovaResult.generalizedEtaSquared, 3)}</td></tr>
                    </tbody></table></div>
                  </div>

                  {repeatedMeasuresAnovaResult.pairwise.length > 0 && <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_5px_rgba(15,23,42,.025),0_12px_30px_rgba(15,23,42,.05)]"><div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-[12px] font-semibold text-slate-900">Pairwise comparisons</p><p className="mt-1 text-[9px] leading-4 text-slate-400">Paired follow-ups with Holm-adjusted p-values.</p></div><button type="button" onClick={() => void copyTableSpec(anovaPairwiseTableSpec(), "Post-hoc table copied")} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-semibold text-slate-600"><Copy className="h-3 w-3" />Copy post-hoc</button></div><div className="overflow-x-auto"><table className="w-full min-w-max text-left text-[10px]"><thead className="border-b border-slate-100 bg-slate-50/75 text-[8px] uppercase tracking-[.07em] text-slate-400"><tr>{["Comparison", "N", "ΔM", "t", "df", "p", "Holm p", "dz"].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{repeatedMeasuresAnovaResult.pairwise.map((comparison) => <tr key={`${comparison.variableA}-${comparison.variableB}`}><td className="px-4 py-3.5 font-semibold text-slate-800">{comparison.variableALabel} − {comparison.variableBLabel}</td><td className="px-4 py-3.5 text-slate-600">{comparison.n}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.meanDifference, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.t, 3)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.df, 0)}</td><td className="px-4 py-3.5 text-slate-600">{formatPValue(comparison.pValue)}</td><td className="px-4 py-3.5 font-semibold text-slate-900">{formatPValue(comparison.pAdjusted)}</td><td className="px-4 py-3.5 text-slate-600">{formatNumber(comparison.cohenDz, 3)}</td></tr>)}</tbody></table></div></div>}

                  <p className="px-1 text-[8px] leading-4 text-slate-400">Mauchly's test is an inferential diagnostic rather than a mechanical pass/fail gate. PsyLattice reports the uncorrected, Greenhouse–Geisser and Huynh–Feldt rows together so the researcher can document the chosen correction transparently.</p>
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

      <AnalysisAiAssistant
        studyId={selectedStudyId}
        studyTitle={studyTitle}
        datasetLabel={sourceLabel}
        context={analysisAiContext}
        workingRows={analysisAiWorkingRows}
        workingRowsTotal={activeRows.length}
        onApplySetup={applyAnalysisAiSetupProposal}
        onApplyWorkflow={applyAnalysisAiWorkflowProposal}
      />
    </div>
  );
}
