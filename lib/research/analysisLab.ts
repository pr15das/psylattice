export type AnalysisRow = Record<string, unknown>;

export type AnalysisVariableLevel =
  | "continuous"
  | "ordinal"
  | "nominal"
  | "boolean"
  | "datetime"
  | "id"
  | "text";

export type AnalysisCodebookVariable = {
  variable: string;
  label?: string;
  type?: string;
  source?: string;
  notes?: string;
  reverse_scored?: boolean | string;
  value_labels?: string;
};

export type AnalysisVariable = {
  name: string;
  label: string;
  source: string;
  level: AnalysisVariableLevel;
  rowCount: number;
  validCount: number;
  missingCount: number;
  distinctCount: number;
  numericRatio: number;
};

export type NumericDescriptives = {
  variable: string;
  label: string;
  level: AnalysisVariableLevel;
  n: number;
  missing: number;
  missingPercent: number;
  mean: number | null;
  median: number | null;
  sd: number | null;
  variance: number | null;
  min: number | null;
  max: number | null;
  range: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  se: number | null;
  ci95Low: number | null;
  ci95High: number | null;
  skewness: number | null;
  kurtosisExcess: number | null;
};

export type FrequencyRow = {
  value: string;
  count: number;
  validPercent: number;
  totalPercent: number;
};

export type FrequencyTable = {
  variable: string;
  label: string;
  level: AnalysisVariableLevel;
  validN: number;
  missingN: number;
  rows: FrequencyRow[];
};

export type CorrelationMethod = "pearson" | "spearman";

export type CorrelationResult = {
  x: string;
  y: string;
  xLabel: string;
  yLabel: string;
  n: number;
  r: number | null;
  pValue: number | null;
};

export type CorrelationMatrix = {
  method: CorrelationMethod;
  variables: Array<{ name: string; label: string }>;
  cells: CorrelationResult[];
};

export type IndependentTTestEstimator = "welch" | "student";

export type AnalysisLevelCount = {
  value: string;
  label: string;
  count: number;
};

export type IndependentTTestResult = {
  outcome: string;
  outcomeLabel: string;
  groupVariable: string;
  groupVariableLabel: string;
  groupA: string;
  groupB: string;
  nA: number;
  nB: number;
  meanA: number | null;
  meanB: number | null;
  sdA: number | null;
  sdB: number | null;
  meanDifference: number | null;
  seDifference: number | null;
  t: number | null;
  df: number | null;
  pValue: number | null;
  ci95Low: number | null;
  ci95High: number | null;
  cohenD: number | null;
  hedgesG: number | null;
  estimator: IndependentTTestEstimator;
};

export type PairedTTestResult = {
  variableA: string;
  variableALabel: string;
  variableB: string;
  variableBLabel: string;
  n: number;
  meanA: number | null;
  meanB: number | null;
  sdA: number | null;
  sdB: number | null;
  meanDifference: number | null;
  sdDifference: number | null;
  seDifference: number | null;
  t: number | null;
  df: number | null;
  pValue: number | null;
  ci95Low: number | null;
  ci95High: number | null;
  cohenDz: number | null;
};
export type OneWayAnovaEstimator = "standard" | "welch";

export type AnovaGroupSummary = {
  value: string;
  label: string;
  n: number;
  mean: number | null;
  sd: number | null;
};

export type AnovaPairwiseComparison = {
  groupA: string;
  groupB: string;
  nA: number;
  nB: number;
  meanDifference: number | null;
  t: number | null;
  df: number | null;
  pValue: number | null;
  pAdjusted: number | null;
  cohenD: number | null;
};

export type OneWayAnovaResult = {
  outcome: string;
  outcomeLabel: string;
  factor: string;
  factorLabel: string;
  estimator: OneWayAnovaEstimator;
  groups: AnovaGroupSummary[];
  totalN: number;
  f: number | null;
  df1: number | null;
  df2: number | null;
  pValue: number | null;
  ssBetween: number | null;
  ssWithin: number | null;
  ssTotal: number | null;
  etaSquared: number | null;
  omegaSquared: number | null;
  pairwise: AnovaPairwiseComparison[];
};

export type RepeatedMeasuresConditionSummary = {
  variable: string;
  label: string;
  n: number;
  mean: number | null;
  sd: number | null;
};

export type RepeatedMeasuresPairwiseComparison = {
  variableA: string;
  variableALabel: string;
  variableB: string;
  variableBLabel: string;
  n: number;
  meanDifference: number | null;
  t: number | null;
  df: number | null;
  pValue: number | null;
  pAdjusted: number | null;
  cohenDz: number | null;
};

export type RepeatedMeasuresAnovaResult = {
  conditions: RepeatedMeasuresConditionSummary[];
  completeCases: number;
  conditionCount: number;
  f: number | null;
  df1: number | null;
  df2: number | null;
  pValue: number | null;
  ssCondition: number | null;
  ssSubjects: number | null;
  ssError: number | null;
  partialEtaSquared: number | null;
  generalizedEtaSquared: number | null;
  pairwise: RepeatedMeasuresPairwiseComparison[];
};

export type LinearRegressionCoefficient = {
  term: string;
  label: string;
  isIntercept: boolean;
  b: number | null;
  se: number | null;
  beta: number | null;
  t: number | null;
  pValue: number | null;
  ci95Low: number | null;
  ci95High: number | null;
  tolerance: number | null;
  vif: number | null;
};

export type LinearRegressionDiagnostics = {
  residualMean: number | null;
  residualSd: number | null;
  rmse: number | null;
  durbinWatson: number | null;
  maxAbsoluteStandardizedResidual: number | null;
  maxCookDistance: number | null;
  maxLeverage: number | null;
  highResidualCount: number;
  highLeverageCount: number;
};

export type LinearRegressionResult = {
  outcome: string;
  outcomeLabel: string;
  predictors: Array<{ name: string; label: string }>;
  n: number;
  predictorCount: number;
  rSquared: number | null;
  adjustedRSquared: number | null;
  f: number | null;
  dfModel: number | null;
  dfResidual: number | null;
  pValue: number | null;
  rmse: number | null;
  ssRegression: number | null;
  ssResidual: number | null;
  ssTotal: number | null;
  coefficients: LinearRegressionCoefficient[];
  diagnostics: LinearRegressionDiagnostics;
  issue: string | null;
};

export type ReliabilityItemResult = {
  variable: string;
  label: string;
  reversed: boolean;
  reverseMin: number | null;
  reverseMax: number | null;
  n: number;
  mean: number | null;
  sd: number | null;
  itemRestCorrelation: number | null;
  alphaIfDeleted: number | null;
};

export type ReliabilityResult = {
  itemCount: number;
  totalRows: number;
  completeCases: number;
  completePercent: number;
  alpha: number | null;
  standardizedAlpha: number | null;
  meanInterItemCorrelation: number | null;
  scaleMean: number | null;
  scaleSd: number | null;
  scaleVariance: number | null;
  items: ReliabilityItemResult[];
  reversedItems: string[];
  issue: string | null;
};


const ID_NAME_PATTERN =
  /(^|_)(id|uuid|token|email|phone|name|address|ip|device_id|participant_id|public_id|response_id|session_id|study_id|user_id)$/i;
const DATE_NAME_PATTERN = /(^|_)(date|datetime|timestamp|time|created_at|updated_at|started_at|completed_at|submitted_at)$/i;

export function isMissingValue(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "number" && Number.isNaN(value)) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "" || normalized === "na" || normalized === "n/a" || normalized === "null" || normalized === "undefined";
  }
  return false;
}

export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function asStableText(value: unknown) {
  if (isMissingValue(value)) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function looksLikeDate(values: unknown[]) {
  if (values.length === 0) return false;
  let dateLike = 0;
  for (const value of values) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      dateLike += 1;
      continue;
    }
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || !/[T:/-]/.test(trimmed)) continue;
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) dateLike += 1;
  }
  return dateLike / values.length >= 0.85;
}

function normalizeCodebookLevel(typeValue?: string): AnalysisVariableLevel | null {
  const type = String(typeValue || "").toLowerCase();
  if (!type) return null;

  if (/(id|identifier|email|phone|address)/.test(type)) return "id";
  if (/(date|time|timestamp)/.test(type)) return "datetime";
  if (/(boolean|binary|yes\/no|yes-no)/.test(type)) return "boolean";
  if (/(ordinal|likert|rank)/.test(type)) return "ordinal";
  if (/(nominal|categor|choice|select|radio|factor)/.test(type)) return "nominal";
  if (/(continuous|scale|numeric|number|integer|float|decimal|score|reaction|rt)/.test(type)) return "continuous";
  if (/(text|string|open)/.test(type)) return "text";
  return null;
}

export function inferAnalysisVariables(
  rows: AnalysisRow[],
  codebook: AnalysisCodebookVariable[] = []
): AnalysisVariable[] {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const codebookMap = new Map(codebook.map((entry) => [entry.variable, entry]));

  return columns.map((name) => {
    const hint = codebookMap.get(name);
    const values = rows.map((row) => row[name]);
    const nonMissing = values.filter((value) => !isMissingValue(value));
    const stableValues = nonMissing.map(asStableText);
    const distinctCount = new Set(stableValues).size;
    const numericCount = nonMissing.filter((value) => toFiniteNumber(value) !== null).length;
    const numericRatio = nonMissing.length ? numericCount / nonMissing.length : 0;
    const booleanCount = nonMissing.filter(
      (value) => typeof value === "boolean" || /^(true|false|yes|no)$/i.test(asStableText(value))
    ).length;

    let level = normalizeCodebookLevel(hint?.type);

    if (!level && ID_NAME_PATTERN.test(name)) level = "id";
    if (!level && DATE_NAME_PATTERN.test(name) && looksLikeDate(nonMissing)) level = "datetime";
    if (!level && nonMissing.length > 0 && booleanCount / nonMissing.length >= 0.95) level = "boolean";

    if (!level && numericRatio >= 0.95) {
      level = "continuous";
    }

    if (!level && looksLikeDate(nonMissing)) level = "datetime";

    if (!level) {
      const nominalThreshold = Math.min(24, Math.max(6, Math.ceil(rows.length * 0.2)));
      level = distinctCount <= nominalThreshold ? "nominal" : "text";
    }

    return {
      name,
      label: hint?.label || name.replaceAll("_", " "),
      source: hint?.source || "dataset",
      level,
      rowCount: rows.length,
      validCount: nonMissing.length,
      missingCount: rows.length - nonMissing.length,
      distinctCount,
      numericRatio,
    };
  });
}

function sorted(values: number[]) {
  return [...values].sort((a, b) => a - b);
}

function quantile(values: number[], p: number) {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];
  const s = sorted(values);
  const index = (s.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return s[lower];
  return s[lower] + (s[upper] - s[lower]) * (index - lower);
}

function sampleVariance(values: number[]) {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const ss = values.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return ss / (values.length - 1);
}

function correctedSkewness(values: number[]) {
  const n = values.length;
  if (n < 3) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const variance = sampleVariance(values);
  if (variance === null || variance <= 0) return 0;
  const sd = Math.sqrt(variance);
  const z3 = values.reduce((sum, value) => sum + ((value - mean) / sd) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * z3;
}

function correctedExcessKurtosis(values: number[]) {
  const n = values.length;
  if (n < 4) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const variance = sampleVariance(values);
  if (variance === null || variance <= 0) return 0;
  const sd = Math.sqrt(variance);
  const z4 = values.reduce((sum, value) => sum + ((value - mean) / sd) ** 4, 0);
  const first = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
  const second = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return first * z4 - second;
}

export function computeNumericDescriptives(
  rows: AnalysisRow[],
  variable: AnalysisVariable
): NumericDescriptives {
  const values = rows
    .map((row) => toFiniteNumber(row[variable.name]))
    .filter((value): value is number => value !== null);

  const n = values.length;
  const missing = rows.length - n;
  const mean = n ? values.reduce((sum, value) => sum + value, 0) / n : null;
  const median = quantile(values, 0.5);
  const variance = sampleVariance(values);
  const sd = variance === null ? null : Math.sqrt(variance);
  const min = n ? Math.min(...values) : null;
  const max = n ? Math.max(...values) : null;
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const se = sd !== null && n > 0 ? sd / Math.sqrt(n) : null;
  const critical95 = n > 1 ? studentTCritical(0.975, n - 1) : null;
  const ciRadius = se === null || critical95 === null ? null : critical95 * se;

  return {
    variable: variable.name,
    label: variable.label,
    level: variable.level,
    n,
    missing,
    missingPercent: rows.length ? (missing / rows.length) * 100 : 0,
    mean,
    median,
    sd,
    variance,
    min,
    max,
    range: min !== null && max !== null ? max - min : null,
    q1,
    q3,
    iqr: q1 !== null && q3 !== null ? q3 - q1 : null,
    se,
    ci95Low: mean !== null && ciRadius !== null ? mean - ciRadius : null,
    ci95High: mean !== null && ciRadius !== null ? mean + ciRadius : null,
    skewness: correctedSkewness(values),
    kurtosisExcess: correctedExcessKurtosis(values),
  };
}

export function computeFrequencyTable(
  rows: AnalysisRow[],
  variable: AnalysisVariable
): FrequencyTable {
  const counts = new Map<string, number>();
  let missingN = 0;

  for (const row of rows) {
    const value = row[variable.name];
    if (isMissingValue(value)) {
      missingN += 1;
      continue;
    }
    const label = asStableText(value);
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  const validN = rows.length - missingN;
  const frequencyRows = Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      count,
      validPercent: validN ? (count / validN) * 100 : 0,
      totalPercent: rows.length ? (count / rows.length) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  return {
    variable: variable.name,
    label: variable.label,
    level: variable.level,
    validN,
    missingN,
    rows: frequencyRows,
  };
}


function averageRanks(values: number[]) {
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value);

  const ranks = new Array(values.length).fill(0);
  let i = 0;
  while (i < indexed.length) {
    let j = i + 1;
    while (j < indexed.length && indexed[j].value === indexed[i].value) j += 1;
    const averageRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k += 1) ranks[indexed[k].index] = averageRank;
    i = j;
  }
  return ranks;
}

function pearsonCoefficient(x: number[], y: number[]) {
  if (x.length !== y.length || x.length < 2) return null;
  const n = x.length;
  const meanX = x.reduce((sum, value) => sum + value, 0) / n;
  const meanY = y.reduce((sum, value) => sum + value, 0) / n;

  let cross = 0;
  let ssX = 0;
  let ssY = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cross += dx * dy;
    ssX += dx * dx;
    ssY += dy * dy;
  }

  if (ssX <= 0 || ssY <= 0) return null;
  const r = cross / Math.sqrt(ssX * ssY);
  return Math.max(-1, Math.min(1, r));
}

function logGamma(z: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  let x = 0.9999999999998099;
  const adjusted = z - 1;
  for (let i = 0; i < coefficients.length; i += 1) {
    x += coefficients[i] / (adjusted + i + 1);
  }
  const t = adjusted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (adjusted + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaContinuedFraction(a: number, b: number, x: number) {
  const maxIterations = 200;
  const epsilon = 3e-14;
  const tiny = 1e-300;

  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;

    aa = -((a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }

  return h;
}

function regularizedIncompleteBeta(x: number, a: number, b: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const logBt =
    logGamma(a + b) -
    logGamma(a) -
    logGamma(b) +
    a * Math.log(x) +
    b * Math.log(1 - x);
  const bt = Math.exp(logBt);

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a;
  }

  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
}

function correlationPValue(r: number, n: number) {
  if (n < 3) return null;
  const absolute = Math.abs(r);
  if (absolute >= 1) return 0;
  const degreesOfFreedom = n - 2;
  const tSquared = (r * r * degreesOfFreedom) / Math.max(1e-15, 1 - r * r);
  const x = degreesOfFreedom / (degreesOfFreedom + tSquared);
  const p = regularizedIncompleteBeta(x, degreesOfFreedom / 2, 0.5);
  return Math.max(0, Math.min(1, p));
}

export function computeCorrelationMatrix(
  rows: AnalysisRow[],
  variables: AnalysisVariable[],
  method: CorrelationMethod = "pearson"
): CorrelationMatrix {
  const usable = variables.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );

  const cells: CorrelationResult[] = [];

  for (let i = 0; i < usable.length; i += 1) {
    for (let j = 0; j < usable.length; j += 1) {
      const xVariable = usable[i];
      const yVariable = usable[j];

      if (i === j) {
        const n = rows.reduce(
          (count, row) => count + (toFiniteNumber(row[xVariable.name]) === null ? 0 : 1),
          0
        );
        cells.push({
          x: xVariable.name,
          y: yVariable.name,
          xLabel: xVariable.label,
          yLabel: yVariable.label,
          n,
          r: n > 0 ? 1 : null,
          pValue: null,
        });
        continue;
      }

      const xValues: number[] = [];
      const yValues: number[] = [];

      for (const row of rows) {
        const xValue = toFiniteNumber(row[xVariable.name]);
        const yValue = toFiniteNumber(row[yVariable.name]);
        if (xValue === null || yValue === null) continue;
        xValues.push(xValue);
        yValues.push(yValue);
      }

      const n = xValues.length;
      const transformedX = method === "spearman" ? averageRanks(xValues) : xValues;
      const transformedY = method === "spearman" ? averageRanks(yValues) : yValues;
      const r = pearsonCoefficient(transformedX, transformedY);

      cells.push({
        x: xVariable.name,
        y: yVariable.name,
        xLabel: xVariable.label,
        yLabel: yVariable.label,
        n,
        r,
        pValue: r === null ? null : correlationPValue(r, n),
      });
    }
  }

  return {
    method,
    variables: usable.map((variable) => ({ name: variable.name, label: variable.label })),
    cells,
  };
}


function twoSidedTPValue(t: number, degreesOfFreedom: number) {
  if (!Number.isFinite(t) || !Number.isFinite(degreesOfFreedom) || degreesOfFreedom <= 0) {
    return null;
  }

  const tSquared = t * t;
  const x = degreesOfFreedom / (degreesOfFreedom + tSquared);
  const p = regularizedIncompleteBeta(x, degreesOfFreedom / 2, 0.5);
  return Math.max(0, Math.min(1, p));
}

function studentTCritical(probability: number, degreesOfFreedom: number) {
  if (
    !Number.isFinite(probability) ||
    probability <= 0.5 ||
    probability >= 1 ||
    !Number.isFinite(degreesOfFreedom) ||
    degreesOfFreedom <= 0
  ) {
    return null;
  }

  const targetTwoSidedP = 2 * (1 - probability);
  let low = 0;
  let high = 1;

  for (let i = 0; i < 60; i += 1) {
    const p = twoSidedTPValue(high, degreesOfFreedom);
    if (p !== null && p <= targetTwoSidedP) break;
    high *= 2;
    if (high > 1e6) return null;
  }

  for (let i = 0; i < 100; i += 1) {
    const mid = (low + high) / 2;
    const p = twoSidedTPValue(mid, degreesOfFreedom);
    if (p === null) return null;
    if (p > targetTwoSidedP) low = mid;
    else high = mid;
  }

  return (low + high) / 2;
}

function meanOf(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  const variance = sampleVariance(values);
  return variance === null ? null : Math.sqrt(variance);
}

export function getVariableLevels(
  rows: AnalysisRow[],
  variableName: string,
  maxLevels = 100
): AnalysisLevelCount[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const raw = row[variableName];
    if (isMissingValue(raw)) continue;
    const value = asStableText(raw);
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, maxLevels);
}

export function computeIndependentTTest(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  groupVariable: AnalysisVariable,
  groupA: string,
  groupB: string,
  estimator: IndependentTTestEstimator = "welch"
): IndependentTTestResult {
  const valuesA: number[] = [];
  const valuesB: number[] = [];

  for (const row of rows) {
    const group = isMissingValue(row[groupVariable.name])
      ? ""
      : asStableText(row[groupVariable.name]);
    if (group !== groupA && group !== groupB) continue;

    const value = toFiniteNumber(row[outcome.name]);
    if (value === null) continue;

    if (group === groupA) valuesA.push(value);
    else valuesB.push(value);
  }

  const nA = valuesA.length;
  const nB = valuesB.length;
  const meanA = meanOf(valuesA);
  const meanB = meanOf(valuesB);
  const varianceA = sampleVariance(valuesA);
  const varianceB = sampleVariance(valuesB);
  const sdA = varianceA === null ? null : Math.sqrt(varianceA);
  const sdB = varianceB === null ? null : Math.sqrt(varianceB);
  const meanDifference = meanA === null || meanB === null ? null : meanA - meanB;

  let seDifference: number | null = null;
  let df: number | null = null;

  if (nA >= 2 && nB >= 2 && varianceA !== null && varianceB !== null) {
    if (estimator === "student") {
      const pooledVariance =
        ((nA - 1) * varianceA + (nB - 1) * varianceB) / (nA + nB - 2);
      seDifference = Math.sqrt(pooledVariance * (1 / nA + 1 / nB));
      df = nA + nB - 2;
    } else {
      const termA = varianceA / nA;
      const termB = varianceB / nB;
      seDifference = Math.sqrt(termA + termB);
      const denominator =
        (termA * termA) / (nA - 1) + (termB * termB) / (nB - 1);
      df = denominator > 0 ? ((termA + termB) * (termA + termB)) / denominator : null;
    }
  }

  const t =
    meanDifference !== null && seDifference !== null && seDifference > 0
      ? meanDifference / seDifference
      : meanDifference === 0 && seDifference === 0
        ? 0
        : null;
  const pValue = t === null || df === null ? null : twoSidedTPValue(t, df);
  const critical95 = df === null ? null : studentTCritical(0.975, df);
  const ci95Low =
    meanDifference === null || seDifference === null || critical95 === null
      ? null
      : meanDifference - critical95 * seDifference;
  const ci95High =
    meanDifference === null || seDifference === null || critical95 === null
      ? null
      : meanDifference + critical95 * seDifference;

  let cohenD: number | null = null;
  let hedgesG: number | null = null;
  if (nA >= 2 && nB >= 2 && varianceA !== null && varianceB !== null) {
    const pooledVariance =
      ((nA - 1) * varianceA + (nB - 1) * varianceB) / (nA + nB - 2);
    const pooledSd = pooledVariance > 0 ? Math.sqrt(pooledVariance) : 0;
    if (pooledSd > 0 && meanDifference !== null) {
      cohenD = meanDifference / pooledSd;
      const pooledDf = nA + nB - 2;
      const correction = pooledDf > 1 ? 1 - 3 / (4 * pooledDf - 1) : 1;
      hedgesG = cohenD * correction;
    } else if (meanDifference === 0 && pooledSd === 0) {
      cohenD = 0;
      hedgesG = 0;
    }
  }

  return {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    groupVariable: groupVariable.name,
    groupVariableLabel: groupVariable.label,
    groupA,
    groupB,
    nA,
    nB,
    meanA,
    meanB,
    sdA,
    sdB,
    meanDifference,
    seDifference,
    t,
    df,
    pValue,
    ci95Low,
    ci95High,
    cohenD,
    hedgesG,
    estimator,
  };
}

export function computePairedTTest(
  rows: AnalysisRow[],
  variableA: AnalysisVariable,
  variableB: AnalysisVariable
): PairedTTestResult {
  const valuesA: number[] = [];
  const valuesB: number[] = [];
  const differences: number[] = [];

  for (const row of rows) {
    const a = toFiniteNumber(row[variableA.name]);
    const b = toFiniteNumber(row[variableB.name]);
    if (a === null || b === null) continue;
    valuesA.push(a);
    valuesB.push(b);
    differences.push(a - b);
  }

  const n = differences.length;
  const meanA = meanOf(valuesA);
  const meanB = meanOf(valuesB);
  const sdA = standardDeviation(valuesA);
  const sdB = standardDeviation(valuesB);
  const meanDifference = meanOf(differences);
  const sdDifference = standardDeviation(differences);
  const seDifference =
    sdDifference !== null && n > 0 ? sdDifference / Math.sqrt(n) : null;
  const df = n >= 2 ? n - 1 : null;
  const t =
    meanDifference !== null && seDifference !== null && seDifference > 0
      ? meanDifference / seDifference
      : meanDifference === 0 && seDifference === 0
        ? 0
        : null;
  const pValue = t === null || df === null ? null : twoSidedTPValue(t, df);
  const critical95 = df === null ? null : studentTCritical(0.975, df);
  const ci95Low =
    meanDifference === null || seDifference === null || critical95 === null
      ? null
      : meanDifference - critical95 * seDifference;
  const ci95High =
    meanDifference === null || seDifference === null || critical95 === null
      ? null
      : meanDifference + critical95 * seDifference;
  const cohenDz =
    meanDifference !== null && sdDifference !== null && sdDifference > 0
      ? meanDifference / sdDifference
      : meanDifference === 0 && sdDifference === 0
        ? 0
        : null;

  return {
    variableA: variableA.name,
    variableALabel: variableA.label,
    variableB: variableB.name,
    variableBLabel: variableB.label,
    n,
    meanA,
    meanB,
    sdA,
    sdB,
    meanDifference,
    sdDifference,
    seDifference,
    t,
    df,
    pValue,
    ci95Low,
    ci95High,
    cohenDz,
  };
}


function fSurvivalProbability(f: number, df1: number, df2: number) {
  if (f === Number.POSITIVE_INFINITY) return 0;
  if (
    !Number.isFinite(f) ||
    f < 0 ||
    !Number.isFinite(df1) ||
    df1 <= 0 ||
    !Number.isFinite(df2) ||
    df2 <= 0
  ) {
    return null;
  }

  const x = df2 / (df2 + df1 * f);
  const p = regularizedIncompleteBeta(x, df2 / 2, df1 / 2);
  return Math.max(0, Math.min(1, p));
}

function holmAdjustedPValues(values: Array<number | null>) {
  const valid = values
    .map((value, index) => ({ value, index }))
    .filter((item): item is { value: number; index: number } =>
      item.value !== null && Number.isFinite(item.value)
    )
    .sort((a, b) => a.value - b.value);

  const output = values.map(() => null as number | null);
  let running = 0;
  const m = valid.length;

  valid.forEach((item, rank) => {
    const adjusted = Math.min(1, item.value * (m - rank));
    running = Math.max(running, adjusted);
    output[item.index] = running;
  });

  return output;
}

export function computeOneWayAnova(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  factor: AnalysisVariable,
  estimator: OneWayAnovaEstimator = "standard"
): OneWayAnovaResult {
  const grouped = new Map<string, number[]>();

  for (const row of rows) {
    if (isMissingValue(row[factor.name])) continue;
    const value = toFiniteNumber(row[outcome.name]);
    if (value === null) continue;
    const group = asStableText(row[factor.name]);
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(value);
  }

  const groupEntries = Array.from(grouped.entries())
    .filter(([, values]) => values.length > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const groups: AnovaGroupSummary[] = groupEntries.map(([value, values]) => ({
    value,
    label: value,
    n: values.length,
    mean: meanOf(values),
    sd: standardDeviation(values),
  }));

  const totalN = groupEntries.reduce((sum, [, values]) => sum + values.length, 0);
  const k = groupEntries.length;
  const allValues = groupEntries.flatMap(([, values]) => values);
  const grandMean = meanOf(allValues);

  let ssBetween: number | null = null;
  let ssWithin: number | null = null;
  let ssTotal: number | null = null;
  let etaSquared: number | null = null;
  let omegaSquared: number | null = null;

  if (grandMean !== null && k >= 2 && totalN > k) {
    ssBetween = groupEntries.reduce((sum, [, values]) => {
      const mean = meanOf(values);
      return mean === null ? sum : sum + values.length * (mean - grandMean) ** 2;
    }, 0);

    ssWithin = groupEntries.reduce((sum, [, values]) => {
      const mean = meanOf(values);
      if (mean === null) return sum;
      return sum + values.reduce((inner, value) => inner + (value - mean) ** 2, 0);
    }, 0);

    ssTotal = ssBetween + ssWithin;
    etaSquared = ssTotal > 0 ? ssBetween / ssTotal : 0;

    const dfBetween = k - 1;
    const dfWithin = totalN - k;
    const msWithin = dfWithin > 0 ? ssWithin / dfWithin : null;
    omegaSquared =
      msWithin !== null && ssTotal + msWithin !== 0
        ? (ssBetween - dfBetween * msWithin) / (ssTotal + msWithin)
        : null;
  }

  let f: number | null = null;
  let df1: number | null = null;
  let df2: number | null = null;

  if (k >= 2) {
    if (estimator === "standard") {
      df1 = k - 1;
      df2 = totalN - k;
      if (
        ssBetween !== null &&
        ssWithin !== null &&
        df1 > 0 &&
        df2 > 0
      ) {
        const msBetween = ssBetween / df1;
        const msWithin = ssWithin / df2;
        if (msWithin > 0) f = msBetween / msWithin;
        else if (msBetween > 0 && msWithin === 0) f = Number.POSITIVE_INFINITY;
        else if (msBetween === 0 && msWithin === 0) f = 0;
      }
    } else {
      const welchGroups = groupEntries.map(([label, values]) => {
        const mean = meanOf(values);
        const variance = sampleVariance(values);
        return { label, values, n: values.length, mean, variance };
      });

      if (
        welchGroups.length >= 2 &&
        welchGroups.every(
          (group) =>
            group.n >= 2 &&
            group.mean !== null &&
            group.variance !== null &&
            group.variance > 0
        )
      ) {
        const weights = welchGroups.map((group) => group.n / (group.variance as number));
        const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
        const weightedMean = welchGroups.reduce(
          (sum, group, index) => sum + weights[index] * (group.mean as number),
          0
        ) / weightSum;
        const numerator = welchGroups.reduce(
          (sum, group, index) =>
            sum + weights[index] * ((group.mean as number) - weightedMean) ** 2,
          0
        ) / (k - 1);
        const correctionTerm = welchGroups.reduce((sum, group, index) => {
          const relativeWeight = 1 - weights[index] / weightSum;
          return sum + (relativeWeight * relativeWeight) / (group.n - 1);
        }, 0);
        const denominator = 1 + (2 * (k - 2) * correctionTerm) / (k * k - 1);

        f = denominator > 0 ? numerator / denominator : null;
        df1 = k - 1;
        df2 = correctionTerm > 0 ? (k * k - 1) / (3 * correctionTerm) : null;
      }
    }
  }

  const pValue = f === null || df1 === null || df2 === null
    ? null
    : fSurvivalProbability(f, df1, df2);

  const rawPairwise: AnovaPairwiseComparison[] = [];
  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) {
      const test = computeIndependentTTest(
        rows,
        outcome,
        factor,
        groups[i].value,
        groups[j].value,
        estimator === "welch" ? "welch" : "student"
      );
      rawPairwise.push({
        groupA: groups[i].value,
        groupB: groups[j].value,
        nA: test.nA,
        nB: test.nB,
        meanDifference: test.meanDifference,
        t: test.t,
        df: test.df,
        pValue: test.pValue,
        pAdjusted: null,
        cohenD: test.cohenD,
      });
    }
  }

  const adjusted = holmAdjustedPValues(rawPairwise.map((comparison) => comparison.pValue));
  const pairwise = rawPairwise.map((comparison, index) => ({
    ...comparison,
    pAdjusted: adjusted[index],
  }));

  return {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    factor: factor.name,
    factorLabel: factor.label,
    estimator,
    groups,
    totalN,
    f,
    df1,
    df2,
    pValue,
    ssBetween,
    ssWithin,
    ssTotal,
    etaSquared,
    omegaSquared,
    pairwise,
  };
}

export function computeRepeatedMeasuresAnova(
  rows: AnalysisRow[],
  variables: AnalysisVariable[]
): RepeatedMeasuresAnovaResult {
  const usableVariables = variables.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );

  const completeRows = rows.filter((row) =>
    usableVariables.every((variable) => toFiniteNumber(row[variable.name]) !== null)
  );

  const n = completeRows.length;
  const k = usableVariables.length;
  const matrix = completeRows.map((row) =>
    usableVariables.map((variable) => toFiniteNumber(row[variable.name]) as number)
  );

  const conditions: RepeatedMeasuresConditionSummary[] = usableVariables.map((variable, index) => {
    const values = matrix.map((row) => row[index]);
    return {
      variable: variable.name,
      label: variable.label,
      n,
      mean: meanOf(values),
      sd: standardDeviation(values),
    };
  });

  let f: number | null = null;
  let df1: number | null = null;
  let df2: number | null = null;
  let pValue: number | null = null;
  let ssCondition: number | null = null;
  let ssSubjects: number | null = null;
  let ssError: number | null = null;
  let partialEtaSquared: number | null = null;
  let generalizedEtaSquared: number | null = null;

  if (n >= 2 && k >= 2) {
    const allValues = matrix.flat();
    const grandMean = meanOf(allValues) as number;
    const conditionMeans = Array.from({ length: k }, (_, column) =>
      meanOf(matrix.map((row) => row[column])) as number
    );
    const subjectMeans = matrix.map((row) => meanOf(row) as number);

    const ssTotal = allValues.reduce((sum, value) => sum + (value - grandMean) ** 2, 0);
    ssCondition = n * conditionMeans.reduce((sum, mean) => sum + (mean - grandMean) ** 2, 0);
    ssSubjects = k * subjectMeans.reduce((sum, mean) => sum + (mean - grandMean) ** 2, 0);
    ssError = Math.max(0, ssTotal - ssCondition - ssSubjects);

    df1 = k - 1;
    df2 = (k - 1) * (n - 1);
    const msCondition = ssCondition / df1;
    const msError = ssError / df2;

    if (msError > 0) f = msCondition / msError;
    else if (msCondition > 0 && msError === 0) f = Number.POSITIVE_INFINITY;
    else if (msCondition === 0 && msError === 0) f = 0;

    pValue = f === null ? null : fSurvivalProbability(f, df1, df2);
    const partialDenominator = ssCondition + ssError;
    partialEtaSquared = partialDenominator > 0 ? ssCondition / partialDenominator : 0;
    const generalizedDenominator = ssCondition + ssError + ssSubjects;
    generalizedEtaSquared =
      generalizedDenominator > 0 ? ssCondition / generalizedDenominator : 0;
  }

  const rawPairwise: RepeatedMeasuresPairwiseComparison[] = [];
  for (let i = 0; i < usableVariables.length; i += 1) {
    for (let j = i + 1; j < usableVariables.length; j += 1) {
      const test = computePairedTTest(completeRows, usableVariables[i], usableVariables[j]);
      rawPairwise.push({
        variableA: usableVariables[i].name,
        variableALabel: usableVariables[i].label,
        variableB: usableVariables[j].name,
        variableBLabel: usableVariables[j].label,
        n: test.n,
        meanDifference: test.meanDifference,
        t: test.t,
        df: test.df,
        pValue: test.pValue,
        pAdjusted: null,
        cohenDz: test.cohenDz,
      });
    }
  }

  const adjusted = holmAdjustedPValues(rawPairwise.map((comparison) => comparison.pValue));
  const pairwise = rawPairwise.map((comparison, index) => ({
    ...comparison,
    pAdjusted: adjusted[index],
  }));

  return {
    conditions,
    completeCases: n,
    conditionCount: k,
    f,
    df1,
    df2,
    pValue,
    ssCondition,
    ssSubjects,
    ssError,
    partialEtaSquared,
    generalizedEtaSquared,
    pairwise,
  };
}


function transposeMatrix(matrix: number[][]) {
  if (matrix.length === 0) return [] as number[][];
  return Array.from({ length: matrix[0].length }, (_, column) =>
    matrix.map((row) => row[column])
  );
}

function multiplyMatrices(a: number[][], b: number[][]) {
  if (a.length === 0 || b.length === 0) return [] as number[][];
  const rows = a.length;
  const inner = a[0].length;
  const columns = b[0].length;
  const result = Array.from({ length: rows }, () => Array(columns).fill(0));
  for (let i = 0; i < rows; i += 1) {
    for (let k = 0; k < inner; k += 1) {
      const value = a[i][k];
      for (let j = 0; j < columns; j += 1) {
        result[i][j] += value * b[k][j];
      }
    }
  }
  return result;
}

function multiplyMatrixVector(matrix: number[][], vector: number[]) {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function invertMatrix(matrix: number[][]) {
  const n = matrix.length;
  if (n === 0 || matrix.some((row) => row.length !== n)) return null;
  const augmented = matrix.map((row, index) => [
    ...row.map((value) => Number(value)),
    ...Array.from({ length: n }, (_, column) => (column === index ? 1 : 0)),
  ]);

  const scale = Math.max(1, ...matrix.flat().map((value) => Math.abs(value)));
  const tolerance = 1e-12 * scale;

  for (let column = 0; column < n; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) {
        pivotRow = row;
      }
    }
    if (Math.abs(augmented[pivotRow][column]) <= tolerance) return null;
    if (pivotRow !== column) {
      const temporary = augmented[column];
      augmented[column] = augmented[pivotRow];
      augmented[pivotRow] = temporary;
    }

    const pivot = augmented[column][column];
    for (let j = 0; j < 2 * n; j += 1) augmented[column][j] /= pivot;

    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      if (factor === 0) continue;
      for (let j = 0; j < 2 * n; j += 1) {
        augmented[row][j] -= factor * augmented[column][j];
      }
    }
  }

  return augmented.map((row) => row.slice(n));
}

function predictorVifMatrix(columns: number[][]) {
  if (columns.length === 0) return [] as Array<number | null>;
  if (columns.length === 1) return [1];
  const n = columns[0].length;
  if (n < 2 || columns.some((column) => column.length !== n)) {
    return columns.map(() => null);
  }

  const standardized = columns.map((column) => {
    const mean = meanOf(column) as number;
    const sd = standardDeviation(column);
    if (sd === null || sd <= 0) return null;
    return column.map((value) => (value - mean) / sd);
  });
  if (standardized.some((column) => column === null)) return columns.map(() => null);

  const usable = standardized as number[][];
  const correlation = usable.map((left) =>
    usable.map((right) =>
      left.reduce((sum, value, index) => sum + value * right[index], 0) / (n - 1)
    )
  );
  const inverse = invertMatrix(correlation);
  if (!inverse) return columns.map(() => null);
  return inverse.map((row, index) => {
    const value = row[index];
    return Number.isFinite(value) && value >= 1 - 1e-8 ? Math.max(1, value) : null;
  });
}

export function computeLinearRegression(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  predictors: AnalysisVariable[]
): LinearRegressionResult {
  const usablePredictors = predictors.filter(
    (variable, index, list) =>
      (variable.level === "continuous" || variable.level === "ordinal") &&
      variable.name !== outcome.name &&
      list.findIndex((candidate) => candidate.name === variable.name) === index
  );

  const complete = rows
    .map((row) => {
      const y = toFiniteNumber(row[outcome.name]);
      const x = usablePredictors.map((variable) => toFiniteNumber(row[variable.name]));
      if (y === null || x.some((value) => value === null)) return null;
      return { y, x: x as number[] };
    })
    .filter((entry): entry is { y: number; x: number[] } => entry !== null);

  const n = complete.length;
  const k = usablePredictors.length;
  const emptyDiagnostics: LinearRegressionDiagnostics = {
    residualMean: null,
    residualSd: null,
    rmse: null,
    durbinWatson: null,
    maxAbsoluteStandardizedResidual: null,
    maxCookDistance: null,
    maxLeverage: null,
    highResidualCount: 0,
    highLeverageCount: 0,
  };

  const base = {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    predictors: usablePredictors.map((variable) => ({ name: variable.name, label: variable.label })),
    n,
    predictorCount: k,
  };

  if (k < 1) {
    return {
      ...base,
      rSquared: null,
      adjustedRSquared: null,
      f: null,
      dfModel: null,
      dfResidual: null,
      pValue: null,
      rmse: null,
      ssRegression: null,
      ssResidual: null,
      ssTotal: null,
      coefficients: [],
      diagnostics: emptyDiagnostics,
      issue: "Select at least one numeric predictor.",
    };
  }

  if (n <= k + 1) {
    return {
      ...base,
      rSquared: null,
      adjustedRSquared: null,
      f: null,
      dfModel: k,
      dfResidual: n - k - 1,
      pValue: null,
      rmse: null,
      ssRegression: null,
      ssResidual: null,
      ssTotal: null,
      coefficients: [],
      diagnostics: emptyDiagnostics,
      issue: `The model needs more complete observations than estimated coefficients. Current complete N = ${n}.`,
    };
  }

  const y = complete.map((entry) => entry.y);
  const predictorColumns = usablePredictors.map((_, index) => complete.map((entry) => entry.x[index]));
  const design = complete.map((entry) => [1, ...entry.x]);
  const designT = transposeMatrix(design);
  const xtx = multiplyMatrices(designT, design);
  const xtxInverse = invertMatrix(xtx);

  if (!xtxInverse) {
    return {
      ...base,
      rSquared: null,
      adjustedRSquared: null,
      f: null,
      dfModel: k,
      dfResidual: n - k - 1,
      pValue: null,
      rmse: null,
      ssRegression: null,
      ssResidual: null,
      ssTotal: null,
      coefficients: [],
      diagnostics: emptyDiagnostics,
      issue: "The design matrix is singular. Remove a constant or perfectly collinear predictor and try again.",
    };
  }

  const xty = designT.map((row) => row.reduce((sum, value, index) => sum + value * y[index], 0));
  const estimates = multiplyMatrixVector(xtxInverse, xty);
  const fitted = design.map((row) => row.reduce((sum, value, index) => sum + value * estimates[index], 0));
  const residuals = y.map((value, index) => value - fitted[index]);
  const yMean = meanOf(y) as number;
  const ssTotal = y.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  const ssResidual = residuals.reduce((sum, value) => sum + value * value, 0);
  const ssRegression = Math.max(0, ssTotal - ssResidual);
  const dfModel = k;
  const dfResidual = n - k - 1;
  const mse = dfResidual > 0 ? ssResidual / dfResidual : null;
  const rmse = mse === null ? null : Math.sqrt(Math.max(0, mse));
  const rSquared = ssTotal > 0 ? Math.max(0, Math.min(1, 1 - ssResidual / ssTotal)) : 0;
  const adjustedRSquared = dfResidual > 0
    ? 1 - (1 - rSquared) * ((n - 1) / dfResidual)
    : null;
  const f = mse !== null && mse > 0 && dfModel > 0
    ? (ssRegression / dfModel) / mse
    : ssRegression > 0 && mse === 0
      ? Number.POSITIVE_INFINITY
      : 0;
  const pValue = Number.isFinite(f)
    ? fSurvivalProbability(f, dfModel, dfResidual)
    : f === Number.POSITIVE_INFINITY
      ? 0
      : null;

  const tCritical = studentTCritical(0.975, dfResidual);
  const ySd = standardDeviation(y);
  const vifs = predictorVifMatrix(predictorColumns);
  const coefficientLabels = ["Intercept", ...usablePredictors.map((variable) => variable.label)];
  const coefficientTerms = ["(Intercept)", ...usablePredictors.map((variable) => variable.name)];

  const coefficients: LinearRegressionCoefficient[] = estimates.map((estimate, index) => {
    const variance = mse === null ? null : mse * xtxInverse[index][index];
    const se = variance === null || variance < 0 ? null : Math.sqrt(Math.max(0, variance));
    const t = se === null
      ? null
      : se === 0
        ? estimate === 0 ? 0 : Math.sign(estimate) * Number.POSITIVE_INFINITY
        : estimate / se;
    const coefficientP = t === null
      ? null
      : Number.isFinite(t)
        ? twoSidedTPValue(t, dfResidual)
        : 0;
    const predictorIndex = index - 1;
    const xSd = predictorIndex >= 0 ? standardDeviation(predictorColumns[predictorIndex]) : null;
    const standardized =
      predictorIndex >= 0 && xSd !== null && ySd !== null && ySd > 0
        ? estimate * (xSd / ySd)
        : null;
    const vif = predictorIndex >= 0 ? vifs[predictorIndex] ?? null : null;
    return {
      term: coefficientTerms[index],
      label: coefficientLabels[index],
      isIntercept: index === 0,
      b: estimate,
      se,
      beta: standardized,
      t,
      pValue: coefficientP,
      ci95Low: se !== null && tCritical !== null ? estimate - tCritical * se : null,
      ci95High: se !== null && tCritical !== null ? estimate + tCritical * se : null,
      tolerance: vif !== null && vif > 0 ? 1 / vif : null,
      vif,
    };
  });

  const leverages = design.map((row) => {
    const transformed = multiplyMatrixVector(xtxInverse, row);
    return row.reduce((sum, value, index) => sum + value * transformed[index], 0);
  });
  const standardizedResiduals = residuals.map((residual, index) => {
    if (mse === null || mse <= 0) return residual === 0 ? 0 : null;
    const denominator = Math.sqrt(Math.max(1e-15, mse * (1 - leverages[index])));
    return residual / denominator;
  });
  const coefficientCount = k + 1;
  const cooks = residuals.map((residual, index) => {
    if (mse === null || mse <= 0) return residual === 0 ? 0 : null;
    const leverage = Math.max(0, Math.min(0.999999999, leverages[index]));
    return (residual * residual / (coefficientCount * mse)) * (leverage / ((1 - leverage) ** 2));
  });
  const durbinNumerator = residuals.slice(1).reduce(
    (sum, residual, index) => sum + (residual - residuals[index]) ** 2,
    0
  );
  const durbinWatson = ssResidual > 0 ? durbinNumerator / ssResidual : null;
  const highLeverageThreshold = (2 * coefficientCount) / n;

  const diagnostics: LinearRegressionDiagnostics = {
    residualMean: meanOf(residuals),
    residualSd: standardDeviation(residuals),
    rmse,
    durbinWatson,
    maxAbsoluteStandardizedResidual: standardizedResiduals
      .filter((value): value is number => value !== null && Number.isFinite(value))
      .reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0),
    maxCookDistance: cooks
      .filter((value): value is number => value !== null && Number.isFinite(value))
      .reduce((maximum, value) => Math.max(maximum, value), 0),
    maxLeverage: leverages.reduce((maximum, value) => Math.max(maximum, value), 0),
    highResidualCount: standardizedResiduals.filter(
      (value) => value !== null && Number.isFinite(value) && Math.abs(value) > 3
    ).length,
    highLeverageCount: leverages.filter((value) => value > highLeverageThreshold).length,
  };

  return {
    ...base,
    rSquared,
    adjustedRSquared,
    f,
    dfModel,
    dfResidual,
    pValue,
    rmse,
    ssRegression,
    ssResidual,
    ssTotal,
    coefficients,
    diagnostics,
    issue: null,
  };
}

function cronbachAlphaFromMatrix(matrix: number[][]): number | null {
  if (matrix.length < 2 || matrix[0]?.length < 2) return null;
  const itemCount = matrix[0].length;
  const itemVariances: number[] = [];

  for (let column = 0; column < itemCount; column += 1) {
    const variance = sampleVariance(matrix.map((row) => row[column]));
    if (variance === null) return null;
    itemVariances.push(variance);
  }

  const totals = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const totalVariance = sampleVariance(totals);
  if (totalVariance === null || totalVariance <= 0) return null;

  return (itemCount / (itemCount - 1)) *
    (1 - itemVariances.reduce((sum, variance) => sum + variance, 0) / totalVariance);
}

export function computeReliability(
  rows: AnalysisRow[],
  variables: AnalysisVariable[],
  reverseItems: string[] = []
): ReliabilityResult {
  const numericVariables = variables.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );
  const reversed = new Set(reverseItems);
  const rangeMap = new Map<string, { min: number | null; max: number | null }>();

  for (const variable of numericVariables) {
    const values = rows
      .map((row) => toFiniteNumber(row[variable.name]))
      .filter((value): value is number => value !== null);
    rangeMap.set(variable.name, {
      min: values.length ? Math.min(...values) : null,
      max: values.length ? Math.max(...values) : null,
    });
  }

  const matrix: number[][] = [];
  for (const row of rows) {
    const values: number[] = [];
    let complete = true;

    for (const variable of numericVariables) {
      const raw = toFiniteNumber(row[variable.name]);
      if (raw === null) {
        complete = false;
        break;
      }

      if (reversed.has(variable.name)) {
        const range = rangeMap.get(variable.name);
        if (range?.min === null || range?.max === null) {
          complete = false;
          break;
        }
        values.push((range.min as number) + (range.max as number) - raw);
      } else {
        values.push(raw);
      }
    }

    if (complete && values.length === numericVariables.length) matrix.push(values);
  }

  const base: ReliabilityResult = {
    itemCount: numericVariables.length,
    totalRows: rows.length,
    completeCases: matrix.length,
    completePercent: rows.length ? (matrix.length / rows.length) * 100 : 0,
    alpha: null,
    standardizedAlpha: null,
    meanInterItemCorrelation: null,
    scaleMean: null,
    scaleSd: null,
    scaleVariance: null,
    items: numericVariables.map((variable) => {
      const range = rangeMap.get(variable.name);
      return {
        variable: variable.name,
        label: variable.label,
        reversed: reversed.has(variable.name),
        reverseMin: range?.min ?? null,
        reverseMax: range?.max ?? null,
        n: matrix.length,
        mean: null,
        sd: null,
        itemRestCorrelation: null,
        alphaIfDeleted: null,
      };
    }),
    reversedItems: numericVariables.filter((variable) => reversed.has(variable.name)).map((variable) => variable.name),
    issue: null,
  };

  if (numericVariables.length < 2) {
    return { ...base, issue: "Select at least two numeric scale items." };
  }
  if (matrix.length < 2) {
    return { ...base, issue: "Reliability needs at least two complete rows across all selected items." };
  }

  const alpha = cronbachAlphaFromMatrix(matrix);
  const itemCount = numericVariables.length;
  const pairCorrelations: number[] = [];
  let correlationMatrixComplete = true;

  for (let left = 0; left < itemCount; left += 1) {
    for (let right = left + 1; right < itemCount; right += 1) {
      const correlation = pearsonCoefficient(
        matrix.map((row) => row[left]),
        matrix.map((row) => row[right])
      );
      if (correlation === null) correlationMatrixComplete = false;
      else pairCorrelations.push(correlation);
    }
  }

  const meanInterItemCorrelation =
    correlationMatrixComplete && pairCorrelations.length > 0 ? meanOf(pairCorrelations) : null;
  const standardizedAlpha =
    meanInterItemCorrelation !== null &&
    Number.isFinite(meanInterItemCorrelation) &&
    1 + (itemCount - 1) * meanInterItemCorrelation !== 0
      ? (itemCount * meanInterItemCorrelation) /
        (1 + (itemCount - 1) * meanInterItemCorrelation)
      : null;

  const totalScores = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const scaleVariance = sampleVariance(totalScores);
  const scaleSd = scaleVariance === null ? null : Math.sqrt(scaleVariance);
  const scaleMean = meanOf(totalScores);

  const items: ReliabilityItemResult[] = numericVariables.map((variable, index) => {
    const itemValues = matrix.map((row) => row[index]);
    const restScores = matrix.map((row) =>
      row.reduce((sum, value, column) => (column === index ? sum : sum + value), 0)
    );
    const deletedMatrix = matrix.map((row) => row.filter((_, column) => column !== index));
    const range = rangeMap.get(variable.name);

    return {
      variable: variable.name,
      label: variable.label,
      reversed: reversed.has(variable.name),
      reverseMin: range?.min ?? null,
      reverseMax: range?.max ?? null,
      n: matrix.length,
      mean: meanOf(itemValues),
      sd: standardDeviation(itemValues),
      itemRestCorrelation: pearsonCoefficient(itemValues, restScores),
      alphaIfDeleted: itemCount > 2 ? cronbachAlphaFromMatrix(deletedMatrix) : null,
    };
  });

  return {
    ...base,
    alpha,
    standardizedAlpha,
    meanInterItemCorrelation,
    scaleMean,
    scaleSd,
    scaleVariance,
    items,
    issue: alpha === null
      ? "Cronbach's alpha could not be estimated because the selected items do not provide usable total-score variance."
      : null,
  };
}

function dedupeHeaders(headers: string[]) {
  const seen = new Map<string, number>();
  return headers.map((raw, index) => {
    const base = raw.trim() || `column_${index + 1}`;
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

function parseCsvMatrix(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

export function parseCsvDataset(text: string): AnalysisRow[] {
  const matrix = parseCsvMatrix(text.replace(/^\uFEFF/, ""));
  if (matrix.length < 2) return [];

  const headers = dedupeHeaders(matrix[0]);
  return matrix.slice(1).map((cells) => {
    const row: AnalysisRow = {};
    headers.forEach((header, index) => {
      const raw = cells[index] ?? "";
      const trimmed = raw.trim();
      const numeric = toFiniteNumber(trimmed);
      if (trimmed === "") row[header] = null;
      else if (/^(true|false)$/i.test(trimmed)) row[header] = trimmed.toLowerCase() === "true";
      else if (numeric !== null) row[header] = numeric;
      else row[header] = raw;
    });
    return row;
  });
}

export function analysisLevelLabel(level: AnalysisVariableLevel) {
  switch (level) {
    case "continuous":
      return "Continuous";
    case "ordinal":
      return "Ordinal";
    case "nominal":
      return "Nominal";
    case "boolean":
      return "Binary";
    case "datetime":
      return "Date/time";
    case "id":
      return "Identifier";
    case "text":
      return "Text";
  }
}

export function isDescriptiveSelectable(variable: AnalysisVariable) {
  return !["id", "datetime", "text"].includes(variable.level);
}
