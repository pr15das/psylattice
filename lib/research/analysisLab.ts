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


export type CategoricalAssociationCell = {
  rowLevel: string;
  columnLevel: string;
  observed: number;
  expected: number | null;
  rowPercent: number | null;
  columnPercent: number | null;
  totalPercent: number | null;
  pearsonResidual: number | null;
  adjustedResidual: number | null;
};

export type CategoricalAssociationResult = {
  rowVariable: string;
  rowVariableLabel: string;
  columnVariable: string;
  columnVariableLabel: string;
  rowLevels: string[];
  columnLevels: string[];
  rowTotals: number[];
  columnTotals: number[];
  totalN: number;
  missingN: number;
  cells: CategoricalAssociationCell[];
  chiSquare: number | null;
  df: number | null;
  pValue: number | null;
  cramerV: number | null;
  phi: number | null;
  fisherExactPValue: number | null;
  oddsRatio: number | null;
  oddsRatioCi95Low: number | null;
  oddsRatioCi95High: number | null;
  minExpectedCount: number | null;
  expectedBelowFiveCount: number;
  expectedBelowFivePercent: number | null;
  expectedBelowOneCount: number;
  assumptionFlag: "ok" | "review" | "sparse";
  notableResidualCount: number;
  issue: string | null;
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

export type RepeatedMeasuresSphericityResult = {
  applicable: boolean;
  mauchlyW: number | null;
  mauchlyChiSquare: number | null;
  mauchlyDf: number | null;
  mauchlyPValue: number | null;
  sphericityMet: boolean | null;
  lowerBoundEpsilon: number | null;
  greenhouseGeisserEpsilon: number | null;
  huynhFeldtEpsilon: number | null;
  greenhouseGeisserDf1: number | null;
  greenhouseGeisserDf2: number | null;
  greenhouseGeisserPValue: number | null;
  huynhFeldtDf1: number | null;
  huynhFeldtDf2: number | null;
  huynhFeldtPValue: number | null;
  recommendedCorrection: "none" | "greenhouse-geisser" | "huynh-feldt" | null;
  issue: string | null;
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
  sphericity: RepeatedMeasuresSphericityResult;
  pairwise: RepeatedMeasuresPairwiseComparison[];
};

export type GeneralLinearModelMode = "factorial" | "ancova";

export type GeneralLinearModelEffect = {
  term: string;
  label: string;
  kind: "factor" | "covariate" | "interaction";
  ss: number | null;
  df1: number | null;
  df2: number | null;
  ms: number | null;
  f: number | null;
  pValue: number | null;
  partialEtaSquared: number | null;
};

export type EstimatedMarginalMean = {
  factor: string;
  factorLabel: string;
  level: string;
  observedN: number;
  rawMean: number | null;
  adjustedMean: number | null;
  se: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type GeneralLinearModelAnovaResult = {
  mode: GeneralLinearModelMode;
  outcome: string;
  outcomeLabel: string;
  factors: Array<{ name: string; label: string; levels: string[] }>;
  covariates: Array<{ name: string; label: string; mean: number }>;
  includeInteractions: boolean;
  interactionOrder: 2;
  n: number;
  coefficientCount: number;
  dfModel: number | null;
  dfResidual: number | null;
  ssModel: number | null;
  ssResidual: number | null;
  ssTotal: number | null;
  rSquared: number | null;
  adjustedRSquared: number | null;
  f: number | null;
  pValue: number | null;
  effects: GeneralLinearModelEffect[];
  marginalMeans: EstimatedMarginalMean[];
  issue: string | null;
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

export type RegressionDiagnosticPoint = {
  index: number;
  fitted: number;
  residual: number;
  standardizedResidual: number | null;
  leverage: number;
  cookDistance: number | null;
};

export type LinearRegressionDiagnostics = {
  residualMean: number | null;
  residualSd: number | null;
  rmse: number | null;
  durbinWatson: number | null;
  breuschPaganLm: number | null;
  breuschPaganDf: number | null;
  breuschPaganPValue: number | null;
  residualSkewness: number | null;
  residualKurtosisExcess: number | null;
  residualJarqueBera: number | null;
  residualJarqueBeraPValue: number | null;
  maxAbsoluteStandardizedResidual: number | null;
  maxCookDistance: number | null;
  maxLeverage: number | null;
  highResidualCount: number;
  highLeverageCount: number;
  influentialCount: number;
  points: RegressionDiagnosticPoint[];
  qq: QQPoint[];
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


export type MixedModelEstimator = "reml" | "ml";
export type MixedModelCentering = "none" | "grand" | "cluster";
export type MixedModelRandomStructure = "intercept" | "intercept_slope";

export type MixedModelCoefficient = {
  term: string;
  label: string;
  predictor: string | null;
  predictorLabel: string | null;
  kind: "intercept" | "numeric" | "categorical";
  level: string | null;
  referenceLevel: string | null;
  b: number | null;
  se: number | null;
  z: number | null;
  pValue: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type MixedModelStructureComparison = {
  available: boolean;
  baselineLabel: string;
  candidateLabel: string;
  baselineLogLikelihood: number | null;
  candidateLogLikelihood: number | null;
  baselineAic: number | null;
  candidateAic: number | null;
  baselineBic: number | null;
  candidateBic: number | null;
  likelihoodRatio: number | null;
  df: number | null;
  pValue: number | null;
  deltaAic: number | null;
  deltaBic: number | null;
  note: string | null;
};

export type LinearMixedModelResult = {
  estimator: MixedModelEstimator;
  centering: MixedModelCentering;
  randomStructure: MixedModelRandomStructure;
  randomSlope: string | null;
  randomSlopeLabel: string | null;
  outcome: string;
  outcomeLabel: string;
  group: string;
  groupLabel: string;
  predictors: Array<{
    name: string;
    label: string;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
  }>;
  n: number;
  groupCount: number;
  minObservationsPerGroup: number;
  maxObservationsPerGroup: number;
  meanObservationsPerGroup: number | null;
  fixedEffectCount: number;
  converged: boolean;
  iterations: number;
  logLikelihood: number | null;
  aic: number | null;
  bic: number | null;
  randomInterceptVariance: number | null;
  randomInterceptSd: number | null;
  randomSlopeVariance: number | null;
  randomSlopeSd: number | null;
  randomInterceptSlopeCovariance: number | null;
  randomInterceptSlopeCorrelation: number | null;
  residualVariance: number | null;
  residualSd: number | null;
  icc: number | null;
  marginalR2: number | null;
  conditionalR2: number | null;
  coefficients: MixedModelCoefficient[];
  structureComparison: MixedModelStructureComparison | null;
  warning: string | null;
  issue: string | null;
};


export type GeneralizedMixedFamily = "binomial" | "poisson";

export type GeneralizedMixedCoefficient = {
  term: string;
  label: string;
  predictor: string | null;
  predictorLabel: string | null;
  kind: "intercept" | "numeric" | "categorical";
  level: string | null;
  referenceLevel: string | null;
  b: number | null;
  se: number | null;
  z: number | null;
  pValue: number | null;
  effectRatio: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type GeneralizedMixedModelResult = {
  family: GeneralizedMixedFamily;
  outcome: string;
  outcomeLabel: string;
  group: string;
  groupLabel: string;
  positiveClass: string | null;
  exposure: string | null;
  exposureLabel: string | null;
  predictors: Array<{
    name: string;
    label: string;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
  }>;
  n: number;
  groupCount: number;
  minObservationsPerGroup: number;
  maxObservationsPerGroup: number;
  meanObservationsPerGroup: number | null;
  converged: boolean;
  iterations: number;
  quadraturePoints: number;
  logLikelihood: number | null;
  nullLogLikelihood: number | null;
  likelihoodRatioChiSquare: number | null;
  dfModel: number | null;
  pValue: number | null;
  aic: number | null;
  bic: number | null;
  randomInterceptVariance: number | null;
  randomInterceptSd: number | null;
  latentIcc: number | null;
  meanObserved: number | null;
  meanPredicted: number | null;
  coefficients: GeneralizedMixedCoefficient[];
  warning: string | null;
  issue: string | null;
};

export type BinaryLogisticCoefficient = {
  term: string;
  label: string;
  predictor: string | null;
  predictorLabel: string | null;
  kind: "intercept" | "numeric" | "categorical";
  level: string | null;
  referenceLevel: string | null;
  b: number | null;
  se: number | null;
  z: number | null;
  pValue: number | null;
  oddsRatio: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type BinaryLogisticClassification = {
  threshold: number;
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  accuracy: number | null;
  sensitivity: number | null;
  specificity: number | null;
  precision: number | null;
  negativePredictiveValue: number | null;
  f1: number | null;
  auc: number | null;
  brierScore: number | null;
};

export type BinaryLogisticResult = {
  outcome: string;
  outcomeLabel: string;
  positiveClass: string;
  negativeClass: string;
  predictors: Array<{
    name: string;
    label: string;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
  }>;
  n: number;
  positiveN: number;
  negativeN: number;
  predictorCount: number;
  coefficientCount: number;
  converged: boolean;
  iterations: number;
  logLikelihood: number | null;
  nullLogLikelihood: number | null;
  likelihoodRatioChiSquare: number | null;
  dfModel: number | null;
  pValue: number | null;
  deviance: number | null;
  aic: number | null;
  bic: number | null;
  mcfaddenR2: number | null;
  nagelkerkeR2: number | null;
  coefficients: BinaryLogisticCoefficient[];
  classification: BinaryLogisticClassification;
  warning: string | null;
  issue: string | null;
};



export type MultinomialLogisticCoefficient = {
  outcomeClass: string;
  referenceClass: string;
  term: string;
  label: string;
  predictor: string | null;
  predictorLabel: string | null;
  kind: "intercept" | "numeric" | "categorical";
  level: string | null;
  referenceLevel: string | null;
  b: number | null;
  se: number | null;
  z: number | null;
  pValue: number | null;
  oddsRatio: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type MultinomialClassification = {
  accuracy: number | null;
  macroRecall: number | null;
  logLoss: number | null;
  classes: string[];
  confusionMatrix: number[][];
};

export type MultinomialLogisticResult = {
  outcome: string;
  outcomeLabel: string;
  classes: string[];
  referenceClass: string;
  predictors: Array<{
    name: string;
    label: string;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
  }>;
  n: number;
  classCounts: Array<{ level: string; count: number }>;
  predictorCount: number;
  coefficientCount: number;
  converged: boolean;
  iterations: number;
  logLikelihood: number | null;
  nullLogLikelihood: number | null;
  likelihoodRatioChiSquare: number | null;
  dfModel: number | null;
  pValue: number | null;
  deviance: number | null;
  aic: number | null;
  bic: number | null;
  mcfaddenR2: number | null;
  coefficients: MultinomialLogisticCoefficient[];
  classification: MultinomialClassification;
  warning: string | null;
  issue: string | null;
};

export type OrdinalLogisticCoefficient = {
  term: string;
  label: string;
  predictor: string;
  predictorLabel: string;
  kind: "numeric" | "categorical";
  level: string | null;
  referenceLevel: string | null;
  b: number | null;
  se: number | null;
  z: number | null;
  pValue: number | null;
  oddsRatio: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type OrdinalLogisticThreshold = {
  lowerLevel: string;
  upperLevel: string;
  estimate: number | null;
};

export type OrdinalClassification = {
  accuracy: number | null;
  adjacentAccuracy: number | null;
  meanAbsoluteCategoryError: number | null;
  logLoss: number | null;
  classes: string[];
  confusionMatrix: number[][];
};

export type OrdinalLogisticResult = {
  outcome: string;
  outcomeLabel: string;
  orderedLevels: string[];
  predictors: Array<{
    name: string;
    label: string;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
  }>;
  n: number;
  classCounts: Array<{ level: string; count: number }>;
  predictorCount: number;
  coefficientCount: number;
  converged: boolean;
  iterations: number;
  logLikelihood: number | null;
  nullLogLikelihood: number | null;
  likelihoodRatioChiSquare: number | null;
  dfModel: number | null;
  pValue: number | null;
  deviance: number | null;
  aic: number | null;
  bic: number | null;
  mcfaddenR2: number | null;
  coefficients: OrdinalLogisticCoefficient[];
  thresholds: OrdinalLogisticThreshold[];
  classification: OrdinalClassification;
  warning: string | null;
  issue: string | null;
};

export type CountRegressionFamily = "poisson" | "negative_binomial";

export type CountRegressionCoefficient = {
  term: string;
  label: string;
  predictor: string | null;
  predictorLabel: string | null;
  kind: "intercept" | "numeric" | "categorical";
  level: string | null;
  referenceLevel: string | null;
  b: number | null;
  se: number | null;
  z: number | null;
  pValue: number | null;
  incidenceRateRatio: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type CountRegressionResult = {
  family: CountRegressionFamily;
  outcome: string;
  outcomeLabel: string;
  exposure: string | null;
  exposureLabel: string | null;
  predictors: Array<{
    name: string;
    label: string;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
  }>;
  n: number;
  excludedNonCount: number;
  predictorCount: number;
  coefficientCount: number;
  converged: boolean;
  iterations: number;
  logLikelihood: number | null;
  nullLogLikelihood: number | null;
  likelihoodRatioChiSquare: number | null;
  dfModel: number | null;
  pValue: number | null;
  deviance: number | null;
  aic: number | null;
  bic: number | null;
  pearsonDispersion: number | null;
  dispersionAlpha: number | null;
  meanObserved: number | null;
  meanFitted: number | null;
  observedZeroRate: number | null;
  expectedZeroRate: number | null;
  coefficients: CountRegressionCoefficient[];
  warning: string | null;
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


export type FactorExtractionMethod = "principal_axis" | "principal_components";
export type FactorRotationMethod = "none" | "varimax" | "promax";

export type ExploratoryFactorItemResult = {
  variable: string;
  label: string;
  communality: number | null;
  uniqueness: number | null;
  msa: number | null;
  loadings: number[];
  strongestFactor: number | null;
  strongestLoading: number | null;
};

export type ExploratoryFactorVarianceRow = {
  factor: number;
  eigenvalue: number | null;
  proportion: number | null;
  cumulative: number | null;
  rotatedSsLoading: number | null;
};

export type ExploratoryFactorAnalysisResult = {
  itemCount: number;
  n: number;
  factorCount: number;
  extraction: FactorExtractionMethod;
  rotation: FactorRotationMethod;
  kmoOverall: number | null;
  bartlettChiSquare: number | null;
  bartlettDf: number | null;
  bartlettPValue: number | null;
  determinant: number | null;
  eigenvalues: number[];
  recommendedFactorCount: number;
  variance: ExploratoryFactorVarianceRow[];
  items: ExploratoryFactorItemResult[];
  factorCorrelations: number[][] | null;
  iterations: number;
  converged: boolean;
  warning: string | null;
  issue: string | null;
};

export type NonParametricGroupSummary = {
  value: string;
  label: string;
  n: number;
  median: number | null;
  meanRank: number | null;
};

export type MannWhitneyResult = {
  outcome: string;
  outcomeLabel: string;
  groupVariable: string;
  groupVariableLabel: string;
  groupA: string;
  groupB: string;
  nA: number;
  nB: number;
  medianA: number | null;
  medianB: number | null;
  meanRankA: number | null;
  meanRankB: number | null;
  uA: number | null;
  uB: number | null;
  u: number | null;
  z: number | null;
  pValue: number | null;
  rankBiserial: number | null;
  issue: string | null;
};

export type WilcoxonSignedRankResult = {
  variableA: string;
  variableALabel: string;
  variableB: string;
  variableBLabel: string;
  completePairs: number;
  nonZeroPairs: number;
  zeroDifferences: number;
  medianDifference: number | null;
  wPlus: number | null;
  wMinus: number | null;
  w: number | null;
  z: number | null;
  pValue: number | null;
  rankBiserial: number | null;
  issue: string | null;
};

export type KruskalWallisPairwise = {
  groupA: string;
  groupB: string;
  meanRankDifference: number | null;
  z: number | null;
  pValue: number | null;
  pAdjusted: number | null;
};

export type KruskalWallisResult = {
  outcome: string;
  outcomeLabel: string;
  factor: string;
  factorLabel: string;
  groups: NonParametricGroupSummary[];
  totalN: number;
  h: number | null;
  df: number | null;
  pValue: number | null;
  epsilonSquared: number | null;
  tieCorrection: number | null;
  pairwise: KruskalWallisPairwise[];
  issue: string | null;
};

export type FriedmanConditionSummary = {
  variable: string;
  label: string;
  n: number;
  median: number | null;
  meanRank: number | null;
};

export type FriedmanPairwise = {
  variableA: string;
  variableALabel: string;
  variableB: string;
  variableBLabel: string;
  n: number;
  w: number | null;
  z: number | null;
  pValue: number | null;
  pAdjusted: number | null;
  rankBiserial: number | null;
};

export type FriedmanResult = {
  conditions: FriedmanConditionSummary[];
  completeCases: number;
  conditionCount: number;
  chiSquare: number | null;
  df: number | null;
  pValue: number | null;
  kendallW: number | null;
  tieCorrection: number | null;
  pairwise: FriedmanPairwise[];
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

function tieGroupSizes(values: number[]) {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return Array.from(counts.values()).filter((count) => count > 1);
}

function errorFunction(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
  return sign * y;
}

function normalCdf(value: number) {
  return 0.5 * (1 + errorFunction(value / Math.SQRT2));
}

function twoSidedNormalPValue(z: number | null) {
  if (z === null || !Number.isFinite(z)) return null;
  return Math.max(0, Math.min(1, 2 * (1 - normalCdf(Math.abs(z)))));
}

function regularizedGammaP(a: number, x: number) {
  if (!(a > 0) || x < 0 || !Number.isFinite(a) || !Number.isFinite(x)) return Number.NaN;
  if (x === 0) return 0;
  const epsilon = 1e-14;
  const maxIterations = 300;

  if (x < a + 1) {
    let ap = a;
    let sum = 1 / a;
    let delta = sum;
    for (let n = 1; n <= maxIterations; n += 1) {
      ap += 1;
      delta *= x / ap;
      sum += delta;
      if (Math.abs(delta) < Math.abs(sum) * epsilon) break;
    }
    return Math.max(0, Math.min(1, sum * Math.exp(-x + a * Math.log(x) - logGamma(a))));
  }

  const tiny = 1e-300;
  let b = x + 1 - a;
  let c = 1 / tiny;
  let d = 1 / Math.max(Math.abs(b), tiny);
  let h = d;
  for (let i = 1; i <= maxIterations; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  const q = Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
  return Math.max(0, Math.min(1, 1 - q));
}

function chiSquareSurvivalProbability(value: number | null, degreesOfFreedom: number | null) {
  if (value === null || degreesOfFreedom === null || value < 0 || degreesOfFreedom <= 0) return null;
  if (!Number.isFinite(value)) return value === Number.POSITIVE_INFINITY ? 0 : null;
  const p = 1 - regularizedGammaP(degreesOfFreedom / 2, value / 2);
  return Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : null;
}

function logCombination(n: number, k: number) {
  if (!Number.isFinite(n) || !Number.isFinite(k) || k < 0 || n < 0 || k > n) return Number.NEGATIVE_INFINITY;
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

function hypergeometricProbability(a: number, row1: number, column1: number, total: number) {
  const column2 = total - column1;
  const b = row1 - a;
  if (a < 0 || b < 0 || a > column1 || b > column2) return 0;
  const logP = logCombination(column1, a) + logCombination(column2, b) - logCombination(total, row1);
  const value = Math.exp(logP);
  return Number.isFinite(value) ? value : 0;
}

function fisherExactTwoSided(a: number, b: number, c: number, d: number) {
  const row1 = a + b;
  const row2 = c + d;
  const column1 = a + c;
  const column2 = b + d;
  const total = row1 + row2;
  if (total <= 0) return null;

  const minA = Math.max(0, row1 - column2);
  const maxA = Math.min(row1, column1);
  const observedP = hypergeometricProbability(a, row1, column1, total);
  let p = 0;
  const tolerance = 1e-12;
  for (let candidate = minA; candidate <= maxA; candidate += 1) {
    const candidateP = hypergeometricProbability(candidate, row1, column1, total);
    if (candidateP <= observedP + tolerance) p += candidateP;
  }
  return Math.max(0, Math.min(1, p));
}

function twoByTwoOddsRatioWithCi(a: number, b: number, c: number, d: number) {
  let aa = a;
  let bb = b;
  let cc = c;
  let dd = d;
  const hasZero = aa === 0 || bb === 0 || cc === 0 || dd === 0;
  if (hasZero) {
    aa += 0.5;
    bb += 0.5;
    cc += 0.5;
    dd += 0.5;
  }
  if (bb <= 0 || cc <= 0 || aa <= 0 || dd <= 0) {
    return { oddsRatio: null, ci95Low: null, ci95High: null };
  }
  const oddsRatio = (aa * dd) / (bb * cc);
  const seLog = Math.sqrt(1 / aa + 1 / bb + 1 / cc + 1 / dd);
  const logOr = Math.log(oddsRatio);
  return {
    oddsRatio,
    ci95Low: Math.exp(logOr - 1.959963984540054 * seLog),
    ci95High: Math.exp(logOr + 1.959963984540054 * seLog),
  };
}

export function computeCategoricalAssociation(
  rows: AnalysisRow[],
  rowVariable: AnalysisVariable,
  columnVariable: AnalysisVariable
): CategoricalAssociationResult {
  const validPairs: Array<{ rowLevel: string; columnLevel: string }> = [];
  let missingN = 0;

  for (const row of rows) {
    const rawRow = row[rowVariable.name];
    const rawColumn = row[columnVariable.name];
    if (isMissingValue(rawRow) || isMissingValue(rawColumn)) {
      missingN += 1;
      continue;
    }
    validPairs.push({ rowLevel: asStableText(rawRow), columnLevel: asStableText(rawColumn) });
  }

  const rowLevels = Array.from(new Set(validPairs.map((pair) => pair.rowLevel))).sort((a, b) => a.localeCompare(b));
  const columnLevels = Array.from(new Set(validPairs.map((pair) => pair.columnLevel))).sort((a, b) => a.localeCompare(b));
  const totalN = validPairs.length;

  const empty = (issue: string): CategoricalAssociationResult => ({
    rowVariable: rowVariable.name,
    rowVariableLabel: rowVariable.label,
    columnVariable: columnVariable.name,
    columnVariableLabel: columnVariable.label,
    rowLevels,
    columnLevels,
    rowTotals: rowLevels.map(() => 0),
    columnTotals: columnLevels.map(() => 0),
    totalN,
    missingN,
    cells: [],
    chiSquare: null,
    df: null,
    pValue: null,
    cramerV: null,
    phi: null,
    fisherExactPValue: null,
    oddsRatio: null,
    oddsRatioCi95Low: null,
    oddsRatioCi95High: null,
    minExpectedCount: null,
    expectedBelowFiveCount: 0,
    expectedBelowFivePercent: null,
    expectedBelowOneCount: 0,
    assumptionFlag: "sparse",
    notableResidualCount: 0,
    issue,
  });

  if (rowLevels.length < 2 || columnLevels.length < 2) {
    return empty("Both categorical variables need at least two observed levels.");
  }
  if (totalN === 0) return empty("There are no complete categorical pairs to analyse.");

  const rowIndex = new Map(rowLevels.map((level, index) => [level, index]));
  const columnIndex = new Map(columnLevels.map((level, index) => [level, index]));
  const observed = rowLevels.map(() => columnLevels.map(() => 0));

  for (const pair of validPairs) {
    const r = rowIndex.get(pair.rowLevel);
    const c = columnIndex.get(pair.columnLevel);
    if (r !== undefined && c !== undefined) observed[r][c] += 1;
  }

  const rowTotals = observed.map((row) => row.reduce((sum, value) => sum + value, 0));
  const columnTotals = columnLevels.map((_, c) => observed.reduce((sum, row) => sum + row[c], 0));

  let chiSquare = 0;
  let expectedBelowFiveCount = 0;
  let expectedBelowOneCount = 0;
  let minExpectedCount = Number.POSITIVE_INFINITY;
  let notableResidualCount = 0;
  const cells: CategoricalAssociationCell[] = [];

  for (let r = 0; r < rowLevels.length; r += 1) {
    for (let c = 0; c < columnLevels.length; c += 1) {
      const count = observed[r][c];
      const expected = (rowTotals[r] * columnTotals[c]) / totalN;
      minExpectedCount = Math.min(minExpectedCount, expected);
      if (expected < 5) expectedBelowFiveCount += 1;
      if (expected < 1) expectedBelowOneCount += 1;
      const pearsonResidual = expected > 0 ? (count - expected) / Math.sqrt(expected) : null;
      const rowProp = rowTotals[r] / totalN;
      const columnProp = columnTotals[c] / totalN;
      const adjustedDenominator = expected * (1 - rowProp) * (1 - columnProp);
      const adjustedResidual = adjustedDenominator > 0
        ? (count - expected) / Math.sqrt(adjustedDenominator)
        : null;
      if (adjustedResidual !== null && Math.abs(adjustedResidual) >= 1.96) notableResidualCount += 1;
      if (expected > 0) chiSquare += ((count - expected) ** 2) / expected;
      cells.push({
        rowLevel: rowLevels[r],
        columnLevel: columnLevels[c],
        observed: count,
        expected,
        rowPercent: rowTotals[r] > 0 ? count / rowTotals[r] : null,
        columnPercent: columnTotals[c] > 0 ? count / columnTotals[c] : null,
        totalPercent: totalN > 0 ? count / totalN : null,
        pearsonResidual,
        adjustedResidual,
      });
    }
  }

  const df = (rowLevels.length - 1) * (columnLevels.length - 1);
  const pValue = chiSquareSurvivalProbability(chiSquare, df);
  const minDimension = Math.min(rowLevels.length - 1, columnLevels.length - 1);
  const cramerV = totalN > 0 && minDimension > 0
    ? Math.sqrt(chiSquare / (totalN * minDimension))
    : null;
  const isTwoByTwo = rowLevels.length === 2 && columnLevels.length === 2;
  const phi = isTwoByTwo && totalN > 0 ? Math.sqrt(chiSquare / totalN) : null;

  let fisherExactPValue: number | null = null;
  let oddsRatio: number | null = null;
  let oddsRatioCi95Low: number | null = null;
  let oddsRatioCi95High: number | null = null;
  if (isTwoByTwo) {
    const a = observed[0][0];
    const b = observed[0][1];
    const c = observed[1][0];
    const d = observed[1][1];
    fisherExactPValue = fisherExactTwoSided(a, b, c, d);
    const odds = twoByTwoOddsRatioWithCi(a, b, c, d);
    oddsRatio = odds.oddsRatio;
    oddsRatioCi95Low = odds.ci95Low;
    oddsRatioCi95High = odds.ci95High;
  }

  const cellCount = rowLevels.length * columnLevels.length;
  const expectedBelowFivePercent = cellCount > 0 ? expectedBelowFiveCount / cellCount : null;
  const assumptionFlag: "ok" | "review" | "sparse" =
    expectedBelowOneCount > 0
      ? "sparse"
      : expectedBelowFivePercent !== null && expectedBelowFivePercent > 0.2
        ? "review"
        : "ok";

  return {
    rowVariable: rowVariable.name,
    rowVariableLabel: rowVariable.label,
    columnVariable: columnVariable.name,
    columnVariableLabel: columnVariable.label,
    rowLevels,
    columnLevels,
    rowTotals,
    columnTotals,
    totalN,
    missingN,
    cells,
    chiSquare,
    df,
    pValue,
    cramerV,
    phi,
    fisherExactPValue,
    oddsRatio,
    oddsRatioCi95Low,
    oddsRatioCi95High,
    minExpectedCount: Number.isFinite(minExpectedCount) ? minExpectedCount : null,
    expectedBelowFiveCount,
    expectedBelowFivePercent,
    expectedBelowOneCount,
    assumptionFlag,
    notableResidualCount,
    issue: null,
  };
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

function sampleCovarianceMatrix(matrix: number[][]) {
  if (matrix.length < 2 || matrix[0]?.length === 0) return null;
  const n = matrix.length;
  const k = matrix[0].length;
  const means = Array.from({ length: k }, (_, column) =>
    matrix.reduce((sum, row) => sum + row[column], 0) / n
  );
  return Array.from({ length: k }, (_, left) =>
    Array.from({ length: k }, (_, right) =>
      matrix.reduce(
        (sum, row) => sum + (row[left] - means[left]) * (row[right] - means[right]),
        0
      ) / (n - 1)
    )
  );
}

function helmertContrastMatrix(conditionCount: number) {
  const rows: number[][] = [];
  for (let r = 0; r < conditionCount - 1; r += 1) {
    const denominator = Math.sqrt((r + 1) * (r + 2));
    rows.push(
      Array.from({ length: conditionCount }, (_, column) => {
        if (column <= r) return 1 / denominator;
        if (column === r + 1) return -(r + 1) / denominator;
        return 0;
      })
    );
  }
  return rows;
}

function multiplyMatrices(left: number[][], right: number[][]) {
  if (left.length === 0 || right.length === 0) return [] as number[][];
  const inner = right.length;
  if (left.some((row) => row.length !== inner)) return [] as number[][];
  const columns = right[0].length;
  if (right.some((row) => row.length !== columns)) return [] as number[][];
  return left.map((row) =>
    Array.from({ length: columns }, (_, column) =>
      row.reduce((sum, value, index) => sum + value * right[index][column], 0)
    )
  );
}

function matrixDeterminant(matrix: number[][]) {
  const n = matrix.length;
  if (n === 0 || matrix.some((row) => row.length !== n)) return null;
  const work = matrix.map((row) => [...row]);
  const scale = Math.max(1, ...work.flat().map((value) => Math.abs(value)));
  const tolerance = Number.EPSILON * scale * n * 64;
  let sign = 1;
  let determinant = 1;

  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) {
      if (Math.abs(work[row][column]) > Math.abs(work[pivot][column])) pivot = row;
    }
    if (Math.abs(work[pivot][column]) <= tolerance) return 0;
    if (pivot !== column) {
      [work[pivot], work[column]] = [work[column], work[pivot]];
      sign *= -1;
    }
    const pivotValue = work[column][column];
    determinant *= pivotValue;
    for (let row = column + 1; row < n; row += 1) {
      const factor = work[row][column] / pivotValue;
      for (let col = column + 1; col < n; col += 1) {
        work[row][col] -= factor * work[column][col];
      }
    }
  }
  const result = sign * determinant;
  return Number.isFinite(result) ? result : null;
}

function computeRepeatedMeasuresSphericity(
  matrix: number[][],
  fValue: number | null,
  uncorrectedDf1: number | null,
  uncorrectedDf2: number | null
): RepeatedMeasuresSphericityResult {
  const n = matrix.length;
  const k = matrix[0]?.length ?? 0;
  const m = k - 1;
  const base: RepeatedMeasuresSphericityResult = {
    applicable: k >= 3,
    mauchlyW: k === 2 ? 1 : null,
    mauchlyChiSquare: k === 2 ? 0 : null,
    mauchlyDf: k === 2 ? 1 : null,
    mauchlyPValue: k === 2 ? 1 : null,
    sphericityMet: k === 2 ? true : null,
    lowerBoundEpsilon: k >= 2 ? 1 / Math.max(1, m) : null,
    greenhouseGeisserEpsilon: k === 2 ? 1 : null,
    huynhFeldtEpsilon: k === 2 ? 1 : null,
    greenhouseGeisserDf1: k === 2 ? uncorrectedDf1 : null,
    greenhouseGeisserDf2: k === 2 ? uncorrectedDf2 : null,
    greenhouseGeisserPValue: k === 2 && fValue !== null && uncorrectedDf1 !== null && uncorrectedDf2 !== null
      ? fSurvivalProbability(fValue, uncorrectedDf1, uncorrectedDf2)
      : null,
    huynhFeldtDf1: k === 2 ? uncorrectedDf1 : null,
    huynhFeldtDf2: k === 2 ? uncorrectedDf2 : null,
    huynhFeldtPValue: k === 2 && fValue !== null && uncorrectedDf1 !== null && uncorrectedDf2 !== null
      ? fSurvivalProbability(fValue, uncorrectedDf1, uncorrectedDf2)
      : null,
    recommendedCorrection: k === 2 ? "none" : null,
    issue: null,
  };

  if (k < 2) return { ...base, issue: "Select at least two repeated conditions." };
  if (k === 2) return base;
  if (n < 3) return { ...base, issue: "At least three complete participants are required to estimate sphericity." };

  const covariance = sampleCovarianceMatrix(matrix);
  if (!covariance) return { ...base, issue: "The repeated-measures covariance matrix could not be estimated." };
  const contrast = helmertContrastMatrix(k);
  const contrastCovariance = multiplyMatrices(
    multiplyMatrices(contrast, covariance),
    transposeMatrix(contrast)
  );
  if (contrastCovariance.length !== m) {
    return { ...base, issue: "The sphericity contrast covariance matrix could not be constructed." };
  }

  const trace = contrastCovariance.reduce((sum, row, index) => sum + row[index], 0);
  const traceSquaredMatrix = contrastCovariance.reduce(
    (sum, row) => sum + row.reduce((rowSum, value) => rowSum + value * value, 0),
    0
  );
  const determinant = matrixDeterminant(contrastCovariance);
  const lowerBound = 1 / m;

  if (!(trace > 0) || !(traceSquaredMatrix > 0) || determinant === null) {
    return { ...base, lowerBoundEpsilon: lowerBound, issue: "Sphericity is undefined because the within-participant covariance is degenerate." };
  }

  const rawGg = (trace * trace) / (m * traceSquaredMatrix);
  const gg = Math.max(lowerBound, Math.min(1, rawGg));
  const hfDenominator = m * (n - 1 - m * gg);
  const rawHf = hfDenominator > 0 ? (n * m * gg - 2) / hfDenominator : 1;
  const hf = Math.max(lowerBound, Math.min(1, rawHf));

  const meanEigenvalue = trace / m;
  let w: number | null = null;
  if (meanEigenvalue > 0) {
    const rawW = determinant <= 0 ? 0 : determinant / Math.pow(meanEigenvalue, m);
    w = Math.max(0, Math.min(1, rawW));
  }

  const mauchlyDf = (k * (k - 1)) / 2 - 1;
  let mauchlyChiSquare: number | null = null;
  let mauchlyPValue: number | null = null;
  if (w !== null) {
    if (w === 0) {
      mauchlyChiSquare = Number.POSITIVE_INFINITY;
      mauchlyPValue = 0;
    } else {
      const correction = (2 * m * m + k + 1) / (6 * m * (n - 1));
      mauchlyChiSquare = (correction - 1) * (n - 1) * Math.log(w);
      mauchlyPValue = chiSquareSurvivalProbability(mauchlyChiSquare, mauchlyDf);
    }
  }

  const ggDf1 = uncorrectedDf1 === null ? null : uncorrectedDf1 * gg;
  const ggDf2 = uncorrectedDf2 === null ? null : uncorrectedDf2 * gg;
  const hfDf1 = uncorrectedDf1 === null ? null : uncorrectedDf1 * hf;
  const hfDf2 = uncorrectedDf2 === null ? null : uncorrectedDf2 * hf;
  const ggP = fValue !== null && ggDf1 !== null && ggDf2 !== null
    ? fSurvivalProbability(fValue, ggDf1, ggDf2)
    : null;
  const hfP = fValue !== null && hfDf1 !== null && hfDf2 !== null
    ? fSurvivalProbability(fValue, hfDf1, hfDf2)
    : null;
  const sphericityMet = mauchlyPValue === null ? null : mauchlyPValue >= 0.05;
  const recommendedCorrection = sphericityMet === true
    ? "none"
    : sphericityMet === false
      ? (gg < 0.75 ? "greenhouse-geisser" : "huynh-feldt")
      : null;

  return {
    applicable: true,
    mauchlyW: w,
    mauchlyChiSquare,
    mauchlyDf,
    mauchlyPValue,
    sphericityMet,
    lowerBoundEpsilon: lowerBound,
    greenhouseGeisserEpsilon: gg,
    huynhFeldtEpsilon: hf,
    greenhouseGeisserDf1: ggDf1,
    greenhouseGeisserDf2: ggDf2,
    greenhouseGeisserPValue: ggP,
    huynhFeldtDf1: hfDf1,
    huynhFeldtDf2: hfDf2,
    huynhFeldtPValue: hfP,
    recommendedCorrection,
    issue: null,
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

  const sphericity = computeRepeatedMeasuresSphericity(matrix, f, df1, df2);

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
    sphericity,
    pairwise,
  };
}



type GlmFactorEncoding = {
  variable: AnalysisVariable;
  levels: string[];
  reference: string;
  columns: string[];
};

type GlmTermDefinition = {
  term: string;
  label: string;
  kind: "factor" | "covariate" | "interaction";
  columns: string[];
  build: (factorValues: Record<string, string>, covariateValues: Record<string, number>) => number[];
};

type GlmCompleteRow = {
  y: number;
  factorValues: Record<string, string>;
  covariateValues: Record<string, number>;
};

function factorCode(level: string, encoding: GlmFactorEncoding) {
  return encoding.columns.map((columnLevel) => {
    if (level === columnLevel) return 1;
    if (level === encoding.reference) return -1;
    return 0;
  });
}

function cartesianProduct(values: string[][]) {
  if (values.length === 0) return [[]] as string[][];
  return values.reduce<string[][]>(
    (accumulator, current) =>
      accumulator.flatMap((prefix) => current.map((value) => [...prefix, value])),
    [[]]
  );
}

function fitGlmDesign(design: number[][], y: number[]) {
  if (design.length === 0 || design.length !== y.length) return null;
  const p = design[0]?.length ?? 0;
  const n = design.length;
  if (p === 0 || n <= p || design.some((row) => row.length !== p)) return null;

  const designT = transposeMatrix(design);
  const xtx = multiplyMatrices(designT, design);
  const xtxInverse = invertMatrix(xtx);
  if (!xtxInverse) return null;

  const xty = designT.map((row) =>
    row.reduce((sum, value, index) => sum + value * y[index], 0)
  );
  const beta = multiplyMatrixVector(xtxInverse, xty);
  const fitted = design.map((row) =>
    row.reduce((sum, value, index) => sum + value * beta[index], 0)
  );
  const residuals = y.map((value, index) => value - fitted[index]);
  const sse = residuals.reduce((sum, value) => sum + value * value, 0);

  return {
    beta,
    fitted,
    residuals,
    sse,
    xtxInverse,
    p,
    n,
    dfResidual: n - p,
  };
}

export function computeGeneralLinearModelAnova(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  factors: AnalysisVariable[],
  covariates: AnalysisVariable[] = [],
  options: {
    mode?: GeneralLinearModelMode;
    includeInteractions?: boolean;
  } = {}
): GeneralLinearModelAnovaResult {
  const mode: GeneralLinearModelMode =
    options.mode ?? (covariates.length > 0 ? "ancova" : "factorial");
  const includeInteractions = options.includeInteractions ?? true;

  const uniqueFactors = factors
    .filter(
      (variable, index, list) =>
        !["id", "datetime", "text"].includes(variable.level) &&
        variable.name !== outcome.name &&
        list.findIndex((candidate) => candidate.name === variable.name) === index
    )
    .slice(0, 4);

  const uniqueCovariates = covariates
    .filter(
      (variable, index, list) =>
        (variable.level === "continuous" || variable.level === "ordinal") &&
        variable.name !== outcome.name &&
        !uniqueFactors.some((factor) => factor.name === variable.name) &&
        list.findIndex((candidate) => candidate.name === variable.name) === index
    )
    .slice(0, 8);

  const base = {
    mode,
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    factors: [] as Array<{ name: string; label: string; levels: string[] }>,
    covariates: [] as Array<{ name: string; label: string; mean: number }>,
    includeInteractions,
    interactionOrder: 2 as const,
  };

  if (uniqueFactors.length === 0) {
    return {
      ...base,
      n: 0,
      coefficientCount: 0,
      dfModel: null,
      dfResidual: null,
      ssModel: null,
      ssResidual: null,
      ssTotal: null,
      rSquared: null,
      adjustedRSquared: null,
      f: null,
      pValue: null,
      effects: [],
      marginalMeans: [],
      issue: mode === "ancova"
        ? "Select at least one categorical factor for ANCOVA."
        : "Select at least two categorical factors for factorial ANOVA.",
    };
  }

  if (mode === "factorial" && uniqueFactors.length < 2) {
    return {
      ...base,
      n: 0,
      coefficientCount: 0,
      dfModel: null,
      dfResidual: null,
      ssModel: null,
      ssResidual: null,
      ssTotal: null,
      rSquared: null,
      adjustedRSquared: null,
      f: null,
      pValue: null,
      effects: [],
      marginalMeans: [],
      issue: "Factorial ANOVA requires at least two factors.",
    };
  }

  if (mode === "ancova" && uniqueCovariates.length === 0) {
    return {
      ...base,
      n: 0,
      coefficientCount: 0,
      dfModel: null,
      dfResidual: null,
      ssModel: null,
      ssResidual: null,
      ssTotal: null,
      rSquared: null,
      adjustedRSquared: null,
      f: null,
      pValue: null,
      effects: [],
      marginalMeans: [],
      issue: "ANCOVA requires at least one continuous or ordinal covariate.",
    };
  }

  const prelimRows = rows
    .map((row) => {
      const y = toFiniteNumber(row[outcome.name]);
      if (y === null) return null;

      const factorValues: Record<string, string> = {};
      for (const factor of uniqueFactors) {
        if (isMissingValue(row[factor.name])) return null;
        factorValues[factor.name] = asStableText(row[factor.name]);
      }

      const covariateValues: Record<string, number> = {};
      for (const covariate of uniqueCovariates) {
        const value = toFiniteNumber(row[covariate.name]);
        if (value === null) return null;
        covariateValues[covariate.name] = value;
      }

      return { y, factorValues, covariateValues };
    })
    .filter((entry): entry is GlmCompleteRow => entry !== null);

  const factorEncodings: GlmFactorEncoding[] = uniqueFactors.map((factor) => {
    const levels = Array.from(
      new Set(prelimRows.map((entry) => entry.factorValues[factor.name]))
    ).sort((a, b) => a.localeCompare(b));
    return {
      variable: factor,
      levels,
      reference: levels[levels.length - 1] ?? "",
      columns: levels.slice(0, -1),
    };
  });

  const invalidFactor = factorEncodings.find((encoding) => encoding.levels.length < 2);
  if (invalidFactor) {
    return {
      ...base,
      factors: factorEncodings.map((encoding) => ({
        name: encoding.variable.name,
        label: encoding.variable.label,
        levels: encoding.levels,
      })),
      n: prelimRows.length,
      coefficientCount: 0,
      dfModel: null,
      dfResidual: null,
      ssModel: null,
      ssResidual: null,
      ssTotal: null,
      rSquared: null,
      adjustedRSquared: null,
      f: null,
      pValue: null,
      effects: [],
      marginalMeans: [],
      issue: `${invalidFactor.variable.label} has fewer than two observed levels among complete cases.`,
    };
  }

  const covariateMeans: Record<string, number> = {};
  for (const covariate of uniqueCovariates) {
    const values = prelimRows.map((entry) => entry.covariateValues[covariate.name]);
    covariateMeans[covariate.name] = meanOf(values) ?? 0;
  }

  const completeRows: GlmCompleteRow[] = prelimRows.map((entry) => ({
    y: entry.y,
    factorValues: entry.factorValues,
    covariateValues: Object.fromEntries(
      uniqueCovariates.map((covariate) => [
        covariate.name,
        entry.covariateValues[covariate.name] - covariateMeans[covariate.name],
      ])
    ),
  }));

  const terms: GlmTermDefinition[] = [];

  for (const encoding of factorEncodings) {
    terms.push({
      term: encoding.variable.name,
      label: encoding.variable.label,
      kind: "factor",
      columns: encoding.columns.map((level) => `${encoding.variable.name}[${level}]`),
      build: (factorValues) => factorCode(factorValues[encoding.variable.name], encoding),
    });
  }

  for (const covariate of uniqueCovariates) {
    terms.push({
      term: covariate.name,
      label: covariate.label,
      kind: "covariate",
      columns: [covariate.name],
      build: (_factorValues, covariateValues) => [covariateValues[covariate.name] ?? 0],
    });
  }

  if (includeInteractions && factorEncodings.length >= 2) {
    for (let i = 0; i < factorEncodings.length; i += 1) {
      for (let j = i + 1; j < factorEncodings.length; j += 1) {
        const left = factorEncodings[i];
        const right = factorEncodings[j];
        const columns = left.columns.flatMap((leftLevel) =>
          right.columns.map(
            (rightLevel) =>
              `${left.variable.name}[${leftLevel}]:${right.variable.name}[${rightLevel}]`
          )
        );
        terms.push({
          term: `${left.variable.name}:${right.variable.name}`,
          label: `${left.variable.label} × ${right.variable.label}`,
          kind: "interaction",
          columns,
          build: (factorValues) => {
            const leftCodes = factorCode(factorValues[left.variable.name], left);
            const rightCodes = factorCode(factorValues[right.variable.name], right);
            return leftCodes.flatMap((leftValue) =>
              rightCodes.map((rightValue) => leftValue * rightValue)
            );
          },
        });
      }
    }
  }

  const termColumnRanges = new Map<string, number[]>();
  let currentColumn = 1;
  for (const term of terms) {
    const indices = Array.from({ length: term.columns.length }, (_, offset) => currentColumn + offset);
    termColumnRanges.set(term.term, indices);
    currentColumn += term.columns.length;
  }

  function designVector(
    factorValues: Record<string, string>,
    covariateValues: Record<string, number>
  ) {
    return [
      1,
      ...terms.flatMap((term) => term.build(factorValues, covariateValues)),
    ];
  }

  const design = completeRows.map((entry) =>
    designVector(entry.factorValues, entry.covariateValues)
  );
  const y = completeRows.map((entry) => entry.y);
  const fullFit = fitGlmDesign(design, y);
  const n = completeRows.length;
  const coefficientCount = design[0]?.length ?? 0;

  const factorMetadata = factorEncodings.map((encoding) => ({
    name: encoding.variable.name,
    label: encoding.variable.label,
    levels: encoding.levels,
  }));
  const covariateMetadata = uniqueCovariates.map((covariate) => ({
    name: covariate.name,
    label: covariate.label,
    mean: covariateMeans[covariate.name],
  }));

  if (!fullFit) {
    return {
      ...base,
      factors: factorMetadata,
      covariates: covariateMetadata,
      n,
      coefficientCount,
      dfModel: coefficientCount > 0 ? coefficientCount - 1 : null,
      dfResidual: coefficientCount > 0 ? n - coefficientCount : null,
      ssModel: null,
      ssResidual: null,
      ssTotal: null,
      rSquared: null,
      adjustedRSquared: null,
      f: null,
      pValue: null,
      effects: [],
      marginalMeans: [],
      issue:
        n <= coefficientCount
          ? `The model needs more complete observations than estimated coefficients. Complete N = ${n}; coefficients = ${coefficientCount}.`
          : "The factorial design matrix is singular. This usually means an empty cell, a redundant factor, or perfect collinearity among selected terms.",
    };
  }

  const yMean = meanOf(y) ?? 0;
  const ssTotal = y.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  const ssResidual = fullFit.sse;
  const ssModel = Math.max(0, ssTotal - ssResidual);
  const dfModel = fullFit.p - 1;
  const dfResidual = fullFit.dfResidual;
  const mse = dfResidual > 0 ? ssResidual / dfResidual : null;
  const rSquared = ssTotal > 0 ? Math.max(0, Math.min(1, 1 - ssResidual / ssTotal)) : 0;
  const adjustedRSquared =
    dfResidual > 0
      ? 1 - (1 - rSquared) * ((n - 1) / dfResidual)
      : null;
  const modelF =
    mse !== null && mse > 0 && dfModel > 0
      ? (ssModel / dfModel) / mse
      : ssModel > 0 && mse === 0
        ? Number.POSITIVE_INFINITY
        : 0;
  const modelP =
    modelF === Number.POSITIVE_INFINITY
      ? 0
      : fSurvivalProbability(modelF, dfModel, dfResidual);

  const effects: GeneralLinearModelEffect[] = terms.map((term) => {
    const dropIndices = new Set(termColumnRanges.get(term.term) ?? []);
    const reducedDesign = design.map((row) =>
      row.filter((_value, index) => !dropIndices.has(index))
    );
    const reducedFit = fitGlmDesign(reducedDesign, y);
    const df1 = dropIndices.size;
    const ss =
      reducedFit && df1 > 0
        ? Math.max(0, reducedFit.sse - ssResidual)
        : null;
    const ms = ss !== null && df1 > 0 ? ss / df1 : null;
    const f =
      ms !== null && mse !== null && mse > 0
        ? ms / mse
        : ms !== null && ms > 0 && mse === 0
          ? Number.POSITIVE_INFINITY
          : ms === 0 && mse === 0
            ? 0
            : null;
    const pValue =
      f === Number.POSITIVE_INFINITY
        ? 0
        : f === null
          ? null
          : fSurvivalProbability(f, df1, dfResidual);
    const partialEtaSquared =
      ss !== null && ss + ssResidual > 0 ? ss / (ss + ssResidual) : null;

    return {
      term: term.term,
      label: term.label,
      kind: term.kind,
      ss,
      df1,
      df2: dfResidual,
      ms,
      f,
      pValue,
      partialEtaSquared,
    };
  });

  const tCritical = studentTCritical(0.975, dfResidual);
  const marginalMeans: EstimatedMarginalMean[] = [];

  for (const target of factorEncodings) {
    const otherFactors = factorEncodings.filter(
      (encoding) => encoding.variable.name !== target.variable.name
    );
    const combinations = cartesianProduct(otherFactors.map((encoding) => encoding.levels));

    for (const level of target.levels) {
      const syntheticVectors = (combinations.length > 0 ? combinations : [[]]).map((combination) => {
        const factorValues: Record<string, string> = {
          [target.variable.name]: level,
        };
        otherFactors.forEach((encoding, index) => {
          factorValues[encoding.variable.name] = combination[index];
        });

        const centeredCovariates = Object.fromEntries(
          uniqueCovariates.map((covariate) => [covariate.name, 0])
        );
        return designVector(factorValues, centeredCovariates);
      });

      const averageVector = Array.from({ length: fullFit.p }, (_, index) =>
        syntheticVectors.reduce((sum, vector) => sum + vector[index], 0) /
        syntheticVectors.length
      );
      const adjustedMean = averageVector.reduce(
        (sum, value, index) => sum + value * fullFit.beta[index],
        0
      );

      let se: number | null = null;
      if (mse !== null && mse >= 0) {
        const transformed = multiplyMatrixVector(fullFit.xtxInverse, averageVector);
        const varianceMultiplier = averageVector.reduce(
          (sum, value, index) => sum + value * transformed[index],
          0
        );
        if (varianceMultiplier >= -1e-10) {
          se = Math.sqrt(Math.max(0, mse * Math.max(0, varianceMultiplier)));
        }
      }

      const observed = completeRows.filter(
        (entry) => entry.factorValues[target.variable.name] === level
      );
      const rawMean = meanOf(observed.map((entry) => entry.y));

      marginalMeans.push({
        factor: target.variable.name,
        factorLabel: target.variable.label,
        level,
        observedN: observed.length,
        rawMean,
        adjustedMean,
        se,
        ci95Low:
          se !== null && tCritical !== null ? adjustedMean - tCritical * se : null,
        ci95High:
          se !== null && tCritical !== null ? adjustedMean + tCritical * se : null,
      });
    }
  }

  return {
    ...base,
    factors: factorMetadata,
    covariates: covariateMetadata,
    n,
    coefficientCount,
    dfModel,
    dfResidual,
    ssModel,
    ssResidual,
    ssTotal,
    rSquared,
    adjustedRSquared,
    f: modelF,
    pValue: modelP,
    effects,
    marginalMeans,
    issue: null,
  };
}


function transposeMatrix(matrix: number[][]) {
  if (matrix.length === 0) return [] as number[][];
  return Array.from({ length: matrix[0].length }, (_, column) =>
    matrix.map((row) => row[column])
  );
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
    breuschPaganLm: null,
    breuschPaganDf: null,
    breuschPaganPValue: null,
    residualSkewness: null,
    residualKurtosisExcess: null,
    residualJarqueBera: null,
    residualJarqueBeraPValue: null,
    maxAbsoluteStandardizedResidual: null,
    maxCookDistance: null,
    maxLeverage: null,
    highResidualCount: 0,
    highLeverageCount: 0,
    influentialCount: 0,
    points: [],
    qq: [],
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
  const influenceThreshold = 4 / n;

  // Breusch–Pagan / Koenker LM screening: regress squared residuals on the
  // original design matrix and use LM = N × auxiliary R². This is a
  // deterministic heteroscedasticity screen; the visual residual plot should
  // still be reviewed alongside the p-value.
  const squaredResiduals = residuals.map((value) => value * value);
  const auxiliaryMean = meanOf(squaredResiduals);
  let breuschPaganLm: number | null = null;
  let breuschPaganPValue: number | null = null;
  if (auxiliaryMean !== null && k > 0) {
    const auxXty = designT.map((row) =>
      row.reduce((sum, value, index) => sum + value * squaredResiduals[index], 0)
    );
    const auxEstimates = multiplyMatrixVector(xtxInverse, auxXty);
    const auxFitted = design.map((row) =>
      row.reduce((sum, value, index) => sum + value * auxEstimates[index], 0)
    );
    const auxSsTotal = squaredResiduals.reduce(
      (sum, value) => sum + (value - auxiliaryMean) ** 2,
      0
    );
    const auxSsResidual = squaredResiduals.reduce(
      (sum, value, index) => sum + (value - auxFitted[index]) ** 2,
      0
    );
    const auxR2 = auxSsTotal > 0
      ? Math.max(0, Math.min(1, 1 - auxSsResidual / auxSsTotal))
      : 0;
    breuschPaganLm = n * auxR2;
    breuschPaganPValue = chiSquareSurvivalProbability(breuschPaganLm, k);
  }

  const residualMoments = momentSkewnessAndKurtosis(residuals);
  const residualJarqueBera =
    n >= 8 && residualMoments.skewness !== null && residualMoments.kurtosisExcess !== null
      ? (n / 6) * (residualMoments.skewness ** 2 + (residualMoments.kurtosisExcess ** 2) / 4)
      : null;
  const residualJarqueBeraPValue =
    residualJarqueBera === null ? null : chiSquareSurvivalProbability(residualJarqueBera, 2);

  const plotLimit = 700;
  const plotStep = Math.max(1, Math.ceil(n / plotLimit));
  const diagnosticPoints: RegressionDiagnosticPoint[] = [];
  for (let index = 0; index < n; index += plotStep) {
    diagnosticPoints.push({
      index: index + 1,
      fitted: fitted[index],
      residual: residuals[index],
      standardizedResidual: standardizedResiduals[index],
      leverage: leverages[index],
      cookDistance: cooks[index],
    });
  }
  if (diagnosticPoints.length > 0 && diagnosticPoints[diagnosticPoints.length - 1].index !== n) {
    const index = n - 1;
    diagnosticPoints.push({
      index: n,
      fitted: fitted[index],
      residual: residuals[index],
      standardizedResidual: standardizedResiduals[index],
      leverage: leverages[index],
      cookDistance: cooks[index],
    });
  }

  const diagnostics: LinearRegressionDiagnostics = {
    residualMean: meanOf(residuals),
    residualSd: standardDeviation(residuals),
    rmse,
    durbinWatson,
    breuschPaganLm,
    breuschPaganDf: k,
    breuschPaganPValue,
    residualSkewness: residualMoments.skewness,
    residualKurtosisExcess: residualMoments.kurtosisExcess,
    residualJarqueBera,
    residualJarqueBeraPValue,
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
    influentialCount: cooks.filter(
      (value) => value !== null && Number.isFinite(value) && value > influenceThreshold
    ).length,
    points: diagnosticPoints,
    qq: buildQQ(residuals),
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


function mixedLogDeterminantPositiveDefinite(matrix: number[][]) {
  const n = matrix.length;
  if (n === 0 || matrix.some((row) => row.length !== n)) return null;
  const lower = Array.from({ length: n }, () => Array(n).fill(0) as number[]);
  let logDeterminant = 0;

  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let value = matrix[i][j];
      for (let k = 0; k < j; k += 1) value -= lower[i][k] * lower[j][k];
      if (i === j) {
        if (!(value > 1e-12) || !Number.isFinite(value)) return null;
        lower[i][j] = Math.sqrt(value);
        logDeterminant += 2 * Math.log(lower[i][j]);
      } else {
        lower[i][j] = value / lower[j][j];
      }
    }
  }

  return Number.isFinite(logDeterminant) ? logDeterminant : null;
}

export function computeLinearMixedModel(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  group: AnalysisVariable,
  predictors: AnalysisVariable[],
  options: {
    estimator?: MixedModelEstimator;
    centering?: MixedModelCentering;
    randomSlope?: AnalysisVariable | null;
  } = {}
): LinearMixedModelResult {
  const estimator: MixedModelEstimator = options.estimator ?? "reml";
  const centering: MixedModelCentering = options.centering ?? "none";
  const requestedRandomSlope = options.randomSlope ?? null;
  const uniquePredictors = predictors
    .filter(
      (variable, index, list) =>
        variable.name !== outcome.name &&
        variable.name !== group.name &&
        !["id", "datetime", "text"].includes(variable.level) &&
        list.findIndex((candidate) => candidate.name === variable.name) === index
    )
    .slice(0, 16);

  const validRandomSlope =
    requestedRandomSlope &&
    uniquePredictors.some((variable) => variable.name === requestedRandomSlope.name) &&
    (requestedRandomSlope.level === "continuous" || requestedRandomSlope.level === "ordinal")
      ? requestedRandomSlope
      : null;
  const randomStructure: MixedModelRandomStructure = validRandomSlope ? "intercept_slope" : "intercept";

  const base = {
    estimator,
    centering,
    randomStructure,
    randomSlope: validRandomSlope?.name ?? null,
    randomSlopeLabel: validRandomSlope?.label ?? null,
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    group: group.name,
    groupLabel: group.label,
    predictors: [] as LinearMixedModelResult["predictors"],
  };

  const blank = (issue: string): LinearMixedModelResult => ({
    ...base,
    n: 0,
    groupCount: 0,
    minObservationsPerGroup: 0,
    maxObservationsPerGroup: 0,
    meanObservationsPerGroup: null,
    fixedEffectCount: 0,
    converged: false,
    iterations: 0,
    logLikelihood: null,
    aic: null,
    bic: null,
    randomInterceptVariance: null,
    randomInterceptSd: null,
    randomSlopeVariance: null,
    randomSlopeSd: null,
    randomInterceptSlopeCovariance: null,
    randomInterceptSlopeCorrelation: null,
    residualVariance: null,
    residualSd: null,
    icc: null,
    marginalR2: null,
    conditionalR2: null,
    coefficients: [],
    structureComparison: null,
    warning: null,
    issue,
  });

  if (outcome.name === group.name) return blank("The outcome and clustering variable must be different.");
  if (uniquePredictors.length < 1) return blank("Select at least one fixed-effect predictor.");
  if (requestedRandomSlope && !validRandomSlope) {
    return blank("The random slope must be a selected numeric fixed-effect predictor.");
  }

  type MixedPredictorEncoding = {
    variable: AnalysisVariable;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
    columns: Array<{ term: string; label: string; level: string | null }>;
  };

  type MixedPreliminaryRow = {
    y: number;
    groupValue: string;
    predictorValues: Record<string, number | string>;
  };

  const preliminaryRows: MixedPreliminaryRow[] = [];
  for (const row of rows) {
    const y = toFiniteNumber(row[outcome.name]);
    if (y === null || isMissingValue(row[group.name])) continue;
    const groupValue = asStableText(row[group.name]);
    if (!groupValue) continue;

    const predictorValues: Record<string, number | string> = {};
    let complete = true;
    for (const variable of uniquePredictors) {
      if (variable.level === "continuous" || variable.level === "ordinal") {
        const value = toFiniteNumber(row[variable.name]);
        if (value === null) {
          complete = false;
          break;
        }
        predictorValues[variable.name] = value;
      } else {
        if (isMissingValue(row[variable.name])) {
          complete = false;
          break;
        }
        predictorValues[variable.name] = asStableText(row[variable.name]);
      }
    }
    if (complete) preliminaryRows.push({ y, groupValue, predictorValues });
  }

  const encodings: MixedPredictorEncoding[] = uniquePredictors.map((variable) => {
    const numeric = variable.level === "continuous" || variable.level === "ordinal";
    if (numeric) {
      return {
        variable,
        kind: "numeric" as const,
        levels: [],
        referenceLevel: null,
        columns: [{ term: variable.name, label: variable.label, level: null }],
      };
    }
    const levels = Array.from(
      new Set(preliminaryRows.map((row) => String(row.predictorValues[variable.name])))
    ).sort((a, b) => a.localeCompare(b));
    const referenceLevel = levels[0] ?? null;
    return {
      variable,
      kind: "categorical" as const,
      levels,
      referenceLevel,
      columns: levels.slice(1).map((level) => ({
        term: `${variable.name}[${level}]`,
        label: `${variable.label}: ${level} vs ${referenceLevel}`,
        level,
      })),
    };
  });

  const predictorMetadata = encodings.map((encoding) => ({
    name: encoding.variable.name,
    label: encoding.variable.label,
    kind: encoding.kind,
    levels: encoding.levels,
    referenceLevel: encoding.referenceLevel,
  }));

  const emptyResult = (issue: string): LinearMixedModelResult => ({
    ...blank(issue),
    predictors: predictorMetadata,
    n: preliminaryRows.length,
    groupCount: new Set(preliminaryRows.map((row) => row.groupValue)).size,
  });

  const invalidCategorical = encodings.find(
    (encoding) => encoding.kind === "categorical" && encoding.levels.length < 2
  );
  if (invalidCategorical) {
    return emptyResult(`${invalidCategorical.variable.label} has fewer than two observed levels among complete rows.`);
  }

  const groupCounts = new Map<string, number>();
  preliminaryRows.forEach((row) => groupCounts.set(row.groupValue, (groupCounts.get(row.groupValue) || 0) + 1));
  const observedGroupCounts = Array.from(groupCounts.values());
  const groupCount = observedGroupCounts.length;
  const n = preliminaryRows.length;
  const minObservationsPerGroup = observedGroupCounts.length ? Math.min(...observedGroupCounts) : 0;
  const maxObservationsPerGroup = observedGroupCounts.length ? Math.max(...observedGroupCounts) : 0;
  const meanObservationsPerGroup = groupCount > 0 ? n / groupCount : null;

  const fail = (issue: string, fixedEffectCount = 0, iterations = 0): LinearMixedModelResult => ({
    ...emptyResult(issue),
    groupCount,
    minObservationsPerGroup,
    maxObservationsPerGroup,
    meanObservationsPerGroup,
    fixedEffectCount,
    iterations,
  });

  if (groupCount < 2) return fail("A mixed model needs at least two observed clusters/groups.");
  if (maxObservationsPerGroup < 2) {
    return fail("The selected clustering variable has only one observation per group. Use a repeated/raw dataset rather than a participant-level prepared dataset.");
  }

  const numericEncodings = encodings.filter((encoding) => encoding.kind === "numeric");
  const grandMeans = new Map<string, number>();
  const clusterMeans = new Map<string, Map<string, number>>();
  for (const encoding of numericEncodings) {
    const values = preliminaryRows.map((row) => Number(row.predictorValues[encoding.variable.name]));
    grandMeans.set(encoding.variable.name, meanOf(values) ?? 0);
    const byGroup = new Map<string, number[]>();
    for (const row of preliminaryRows) {
      const list = byGroup.get(row.groupValue) || [];
      list.push(Number(row.predictorValues[encoding.variable.name]));
      byGroup.set(row.groupValue, list);
    }
    const means = new Map<string, number>();
    byGroup.forEach((valuesForGroup, key) => means.set(key, meanOf(valuesForGroup) ?? 0));
    clusterMeans.set(encoding.variable.name, means);
  }

  const coefficientMetadata: Array<Omit<MixedModelCoefficient, "b" | "se" | "z" | "pValue" | "ci95Low" | "ci95High">> = [{
    term: "(Intercept)",
    label: "Intercept",
    predictor: null,
    predictorLabel: null,
    kind: "intercept",
    level: null,
    referenceLevel: null,
  }];

  for (const encoding of encodings) {
    if (encoding.kind === "numeric") {
      coefficientMetadata.push({
        term: encoding.variable.name,
        label: encoding.variable.label,
        predictor: encoding.variable.name,
        predictorLabel: encoding.variable.label,
        kind: "numeric",
        level: null,
        referenceLevel: null,
      });
    } else {
      for (const column of encoding.columns) {
        coefficientMetadata.push({
          term: column.term,
          label: column.label,
          predictor: encoding.variable.name,
          predictorLabel: encoding.variable.label,
          kind: "categorical",
          level: column.level,
          referenceLevel: encoding.referenceLevel,
        });
      }
    }
  }

  const centeredNumericValue = (row: MixedPreliminaryRow, variableName: string) => {
    let value = Number(row.predictorValues[variableName]);
    if (centering === "grand") value -= grandMeans.get(variableName) ?? 0;
    else if (centering === "cluster") value -= clusterMeans.get(variableName)?.get(row.groupValue) ?? 0;
    return value;
  };

  const design: number[][] = [];
  const y: number[] = [];
  const groupValues: string[] = [];
  const rawRandomSlopeValues: number[] = [];

  for (const row of preliminaryRows) {
    const x: number[] = [1];
    for (const encoding of encodings) {
      if (encoding.kind === "numeric") {
        x.push(centeredNumericValue(row, encoding.variable.name));
      } else {
        const value = String(row.predictorValues[encoding.variable.name]);
        for (const column of encoding.columns) x.push(value === column.level ? 1 : 0);
      }
    }
    design.push(x);
    y.push(row.y);
    groupValues.push(row.groupValue);
    if (validRandomSlope) rawRandomSlopeValues.push(centeredNumericValue(row, validRandomSlope.name));
  }

  const p = design[0]?.length ?? 0;
  if (p < 2 || n <= p) {
    return fail(`The mixed model needs more complete observations than fixed-effect coefficients. Complete N = ${n}; fixed coefficients = ${p}.`, p);
  }

  let randomSlopeScale = 1;
  if (validRandomSlope) {
    const slopeVariance = sampleVariance(rawRandomSlopeValues);
    randomSlopeScale = slopeVariance && slopeVariance > 1e-12 ? Math.sqrt(slopeVariance) : 1;
    if (!(randomSlopeScale > 0) || !Number.isFinite(randomSlopeScale)) randomSlopeScale = 1;
    if (new Set(rawRandomSlopeValues.map((value) => value.toPrecision(12))).size < 2) {
      return fail(`${validRandomSlope.label} has no usable variation for a random slope.`, p);
    }
  }

  const groupIndices = new Map<string, number[]>();
  groupValues.forEach((value, index) => {
    const list = groupIndices.get(value) || [];
    list.push(index);
    groupIndices.set(value, list);
  });

  type VarianceFit = {
    psi: number[][];
    objective: number;
    beta: number[];
    xtAinvXInverse: number[][];
    rss: number;
    sigma2: number;
    logDetA: number;
    logDetX: number;
  };

  let objectiveEvaluations = 0;

  const evaluatePsi = (psi: number[][], useSlope: boolean): VarianceFit | null => {
    objectiveEvaluations += 1;
    const q = useSlope ? 2 : 1;
    if (psi.length !== q || psi.some((row) => row.length !== q)) return null;
    if (psi.some((row) => row.some((value) => !Number.isFinite(value)))) return null;

    const xtAinvX = Array.from({ length: p }, () => Array(p).fill(0) as number[]);
    const xtAinvY = Array(p).fill(0) as number[];
    let yAinvY = 0;
    let logDetA = 0;

    for (const indices of groupIndices.values()) {
      const ztZ = Array.from({ length: q }, () => Array(q).fill(0) as number[]);
      const ztX = Array.from({ length: q }, () => Array(p).fill(0) as number[]);
      const ztY = Array(q).fill(0) as number[];

      for (const index of indices) {
        const xi = design[index];
        const yi = y[index];
        const zi = useSlope ? [1, rawRandomSlopeValues[index] / randomSlopeScale] : [1];
        yAinvY += yi * yi;
        for (let a = 0; a < p; a += 1) {
          xtAinvY[a] += xi[a] * yi;
          for (let b = 0; b < p; b += 1) xtAinvX[a][b] += xi[a] * xi[b];
        }
        for (let a = 0; a < q; a += 1) {
          ztY[a] += zi[a] * yi;
          for (let b = 0; b < q; b += 1) ztZ[a][b] += zi[a] * zi[b];
          for (let b = 0; b < p; b += 1) ztX[a][b] += zi[a] * xi[b];
        }
      }

      const nearlyZeroPsi = psi.every((row) => row.every((value) => Math.abs(value) <= 1e-14));
      if (!nearlyZeroPsi) {
        const psiInverse = invertMatrix(psi);
        if (!psiInverse) return null;
        const kMatrix = psiInverse.map((row, a) =>
          row.map((value, b) => value + ztZ[a][b])
        );
        const kInverse = invertMatrix(kMatrix);
        if (!kInverse) return null;

        const kInvZtY = multiplyMatrixVector(kInverse, ztY);
        yAinvY -= ztY.reduce((sum, value, index) => sum + value * kInvZtY[index], 0);

        const kInvZtX = multiplyMatrices(kInverse, ztX);
        for (let a = 0; a < p; a += 1) {
          let correctionY = 0;
          for (let r = 0; r < q; r += 1) correctionY += ztX[r][a] * kInvZtY[r];
          xtAinvY[a] -= correctionY;
          for (let b = 0; b < p; b += 1) {
            let correction = 0;
            for (let r = 0; r < q; r += 1) correction += ztX[r][a] * kInvZtX[r][b];
            xtAinvX[a][b] -= correction;
          }
        }

        const psiZ = multiplyMatrices(psi, ztZ);
        const determinantMatrix = Array.from({ length: q }, (_, a) =>
          Array.from({ length: q }, (_, b) => (a === b ? 1 : 0) + psiZ[a][b])
        );
        if (q === 1) {
          const determinant = determinantMatrix[0][0];
          if (!(determinant > 0)) return null;
          logDetA += Math.log(determinant);
        } else {
          const determinant =
            determinantMatrix[0][0] * determinantMatrix[1][1] -
            determinantMatrix[0][1] * determinantMatrix[1][0];
          if (!(determinant > 0) || !Number.isFinite(determinant)) return null;
          logDetA += Math.log(determinant);
        }
      }
    }

    const inverse = invertMatrix(xtAinvX);
    if (!inverse) return null;
    const beta = multiplyMatrixVector(inverse, xtAinvY);
    const betaXty = beta.reduce((sum, value, index) => sum + value * xtAinvY[index], 0);
    let rss = yAinvY - betaXty;
    if (rss < 0 && rss > -1e-8) rss = 0;
    const denominatorDf = estimator === "reml" ? n - p : n;
    if (!(rss > 0) || denominatorDf <= 0) return null;
    const sigma2 = rss / denominatorDf;
    const logDetX = mixedLogDeterminantPositiveDefinite(xtAinvX);
    if (logDetX === null) return null;
    const objective = denominatorDf * Math.log(sigma2) + logDetA + (estimator === "reml" ? logDetX : 0);
    if (!Number.isFinite(objective)) return null;

    return {
      psi,
      objective,
      beta,
      xtAinvXInverse: inverse,
      rss,
      sigma2,
      logDetA,
      logDetX,
    };
  };

  const optimizeRandomIntercept = () => {
    const grid: Array<{ theta: number | null; fit: VarianceFit }> = [];
    const zeroFit = evaluatePsi([[0]], false);
    if (zeroFit) grid.push({ theta: null, fit: zeroFit });
    const gridCount = 56;
    const thetaMinimum = -12;
    const thetaMaximum = 12;
    for (let index = 0; index <= gridCount; index += 1) {
      const theta = thetaMinimum + ((thetaMaximum - thetaMinimum) * index) / gridCount;
      const fit = evaluatePsi([[Math.exp(theta)]], false);
      if (fit) grid.push({ theta, fit });
    }
    if (grid.length === 0) return null;

    let bestIndex = 0;
    for (let index = 1; index < grid.length; index += 1) {
      if (grid[index].fit.objective < grid[bestIndex].fit.objective) bestIndex = index;
    }
    let bestFit = grid[bestIndex].fit;

    if (grid[bestIndex].theta !== null && bestIndex > 0 && bestIndex < grid.length - 1) {
      const leftTheta = grid[bestIndex - 1].theta;
      const rightTheta = grid[bestIndex + 1].theta;
      if (leftTheta !== null && rightTheta !== null) {
        let a = leftTheta;
        let b = rightTheta;
        const phi = (1 + Math.sqrt(5)) / 2;
        let c = b - (b - a) / phi;
        let d = a + (b - a) / phi;
        let fc = evaluatePsi([[Math.exp(c)]], false);
        let fd = evaluatePsi([[Math.exp(d)]], false);
        for (let iteration = 0; iteration < 48; iteration += 1) {
          const cObjective = fc?.objective ?? Number.POSITIVE_INFINITY;
          const dObjective = fd?.objective ?? Number.POSITIVE_INFINITY;
          if (cObjective < dObjective) {
            b = d;
            d = c;
            fd = fc;
            c = b - (b - a) / phi;
            fc = evaluatePsi([[Math.exp(c)]], false);
          } else {
            a = c;
            c = d;
            fc = fd;
            d = a + (b - a) / phi;
            fd = evaluatePsi([[Math.exp(d)]], false);
          }
          if (Math.abs(b - a) < 1e-6) break;
        }
        const candidates = [bestFit, fc, fd].filter((fit): fit is VarianceFit => Boolean(fit));
        bestFit = candidates.reduce((best, fit) => fit.objective < best.objective ? fit : best, bestFit);
      }
    }
    return bestFit;
  };

  const interceptFit = optimizeRandomIntercept();
  if (!interceptFit) {
    return fail("The random-intercept model could not be estimated. Check for constant, redundant, or perfectly collinear predictors.", p, objectiveEvaluations);
  }

  const psiFromParameters = (parameters: number[]) => {
    const a = Math.max(-9, Math.min(9, parameters[0]));
    const b = Math.max(-20, Math.min(20, parameters[1]));
    const c = Math.max(-9, Math.min(9, parameters[2]));
    const l00 = Math.exp(a);
    const l10 = b;
    const l11 = Math.exp(c);
    return [
      [l00 * l00, l00 * l10],
      [l00 * l10, l10 * l10 + l11 * l11],
    ];
  };

  const optimizeRandomSlope = () => {
    const interceptRatio = Math.max(1e-6, interceptFit.psi[0][0]);
    const starts = [
      [0.5 * Math.log(interceptRatio), 0, 0.5 * Math.log(0.05)],
      [0.5 * Math.log(interceptRatio), 0, 0.5 * Math.log(0.25)],
      [0.5 * Math.log(interceptRatio), 0, 0.5 * Math.log(1)],
    ];

    let globalBest: { params: number[]; fit: VarianceFit } | null = null;

    for (const start of starts) {
      let params = [...start];
      let bestFit = evaluatePsi(psiFromParameters(params), true);
      if (!bestFit) continue;
      let steps = [0.8, 0.45, 0.8];

      for (let iteration = 0; iteration < 56; iteration += 1) {
        let improved = false;
        for (let axis = 0; axis < params.length; axis += 1) {
          const candidates: Array<{ params: number[]; fit: VarianceFit }> = [];
          for (const direction of [-1, 1]) {
            const candidate = [...params];
            candidate[axis] += direction * steps[axis];
            const fit = evaluatePsi(psiFromParameters(candidate), true);
            if (fit) candidates.push({ params: candidate, fit });
          }
          const better = candidates
            .filter((candidate) => candidate.fit.objective + 1e-10 < bestFit!.objective)
            .sort((left, right) => left.fit.objective - right.fit.objective)[0];
          if (better) {
            params = better.params;
            bestFit = better.fit;
            improved = true;
          }
        }
        if (!improved) steps = steps.map((value) => value * 0.55);
        if (Math.max(...steps) < 1e-4) break;
      }

      if (!globalBest || bestFit.objective < globalBest.fit.objective) {
        globalBest = { params, fit: bestFit };
      }
    }

    return globalBest?.fit ?? null;
  };

  const bestFit = validRandomSlope ? optimizeRandomSlope() : interceptFit;
  if (!bestFit) {
    return fail("The random-slope model could not be estimated. Try a simpler random-intercept structure or review the selected slope variable.", p, objectiveEvaluations);
  }

  const residualVariance = bestFit.sigma2;
  const residualSd = Math.sqrt(Math.max(0, residualVariance));

  const psi = bestFit.psi;
  const randomInterceptVariance = Math.max(0, psi[0][0] * residualVariance);
  const randomInterceptSd = Math.sqrt(randomInterceptVariance);
  let randomSlopeVariance: number | null = null;
  let randomSlopeSd: number | null = null;
  let randomInterceptSlopeCovariance: number | null = null;
  let randomInterceptSlopeCorrelation: number | null = null;

  if (validRandomSlope && psi.length === 2) {
    randomSlopeVariance = Math.max(0, psi[1][1] * residualVariance / (randomSlopeScale * randomSlopeScale));
    randomSlopeSd = Math.sqrt(randomSlopeVariance);
    randomInterceptSlopeCovariance = psi[0][1] * residualVariance / randomSlopeScale;
    const denominator = randomInterceptSd * randomSlopeSd;
    randomInterceptSlopeCorrelation =
      denominator > 0
        ? Math.max(-1, Math.min(1, randomInterceptSlopeCovariance / denominator))
        : null;
  }

  const varianceTotalForIcc = randomInterceptVariance + residualVariance;
  const icc = varianceTotalForIcc > 0 ? randomInterceptVariance / varianceTotalForIcc : null;
  const denominatorDf = estimator === "reml" ? n - p : n;
  const logLikelihood = -0.5 * (
    denominatorDf * (Math.log(2 * Math.PI) + Math.log(residualVariance) + 1) +
    bestFit.logDetA +
    (estimator === "reml" ? bestFit.logDetX : 0)
  );
  const randomParameterCount = validRandomSlope ? 4 : 2;
  const parameterCount = p + randomParameterCount;
  const aic = estimator === "ml" ? -2 * logLikelihood + 2 * parameterCount : null;
  const bic = estimator === "ml" ? -2 * logLikelihood + Math.log(n) * parameterCount : null;
  const normalCritical = 1.959963984540054;

  const coefficients: MixedModelCoefficient[] = bestFit.beta.map((estimate, index) => {
    const variance = residualVariance * bestFit.xtAinvXInverse[index][index];
    const se = variance >= 0 && Number.isFinite(variance) ? Math.sqrt(Math.max(0, variance)) : null;
    const z = se === null
      ? null
      : se === 0
        ? estimate === 0 ? 0 : Math.sign(estimate) * Number.POSITIVE_INFINITY
        : estimate / se;
    const pValue = z === null
      ? null
      : Number.isFinite(z)
        ? twoSidedNormalPValue(z)
        : 0;
    const metadata = coefficientMetadata[index];
    return {
      ...metadata,
      b: estimate,
      se,
      z,
      pValue,
      ci95Low: se === null ? null : estimate - normalCritical * se,
      ci95High: se === null ? null : estimate + normalCritical * se,
    };
  });

  const fixedFitted = design.map((row) =>
    row.reduce((sum, value, index) => sum + value * bestFit.beta[index], 0)
  );
  const fixedVariance = sampleVariance(fixedFitted) ?? 0;
  const meanRandomVariance = validRandomSlope && psi.length === 2
    ? (() => {
        const contributions = rawRandomSlopeValues.map((rawValue) => {
          const slope = rawValue / randomSlopeScale;
          return residualVariance * (
            psi[0][0] +
            2 * slope * psi[0][1] +
            slope * slope * psi[1][1]
          );
        });
        return meanOf(contributions) ?? randomInterceptVariance;
      })()
    : randomInterceptVariance;
  const modelVarianceTotal = fixedVariance + meanRandomVariance + residualVariance;
  const marginalR2 = modelVarianceTotal > 0 ? fixedVariance / modelVarianceTotal : null;
  const conditionalR2 = modelVarianceTotal > 0
    ? (fixedVariance + meanRandomVariance) / modelVarianceTotal
    : null;

  let structureComparison: MixedModelStructureComparison | null = null;
  if (validRandomSlope) {
    const interceptResidualVariance = interceptFit.sigma2;
    const interceptDenominatorDf = estimator === "reml" ? n - p : n;
    const interceptLogLikelihood = -0.5 * (
      interceptDenominatorDf * (Math.log(2 * Math.PI) + Math.log(interceptResidualVariance) + 1) +
      interceptFit.logDetA +
      (estimator === "reml" ? interceptFit.logDetX : 0)
    );
    const baselineAic = estimator === "ml" ? -2 * interceptLogLikelihood + 2 * (p + 2) : null;
    const baselineBic = estimator === "ml" ? -2 * interceptLogLikelihood + Math.log(n) * (p + 2) : null;
    const likelihoodRatio = Math.max(0, 2 * (logLikelihood - interceptLogLikelihood));
    const comparisonDf = 2;

    structureComparison = {
      available: estimator === "ml",
      baselineLabel: "Random intercept",
      candidateLabel: `Random intercept + ${validRandomSlope.label} slope`,
      baselineLogLikelihood: interceptLogLikelihood,
      candidateLogLikelihood: logLikelihood,
      baselineAic,
      candidateAic: aic,
      baselineBic,
      candidateBic: bic,
      likelihoodRatio: estimator === "ml" ? likelihoodRatio : null,
      df: estimator === "ml" ? comparisonDf : null,
      pValue: estimator === "ml" ? chiSquareSurvivalProbability(likelihoodRatio, comparisonDf) : null,
      deltaAic: baselineAic !== null && aic !== null ? aic - baselineAic : null,
      deltaBic: baselineBic !== null && bic !== null ? bic - baselineBic : null,
      note: estimator === "ml"
        ? "The likelihood-ratio comparison is an approximate χ² test with 2 added covariance parameters. Random-effect variance tests sit on parameter boundaries, so use AIC/BIC and substantive reasoning alongside the p-value."
        : "Switch to ML to compare the random-intercept and random-slope structures with AIC/BIC and an approximate likelihood-ratio test.",
    };
  }

  const warnings: string[] = [];
  if (randomInterceptVariance <= Math.max(1e-12, residualVariance * 1e-6)) {
    warnings.push("The random-intercept variance is estimated near zero. The selected clustering structure may add little beyond an ordinary linear model for this dataset.");
  }
  if (validRandomSlope && randomSlopeVariance !== null && randomSlopeVariance <= Math.max(1e-12, residualVariance * 1e-6)) {
    warnings.push(`The random-slope variance for ${validRandomSlope.label} is estimated near zero; a simpler random-intercept structure may be adequate.`);
  }
  if (validRandomSlope && randomInterceptSlopeCorrelation !== null && Math.abs(randomInterceptSlopeCorrelation) > 0.95) {
    warnings.push("The estimated intercept–slope correlation is very close to ±1, which can indicate an over-complex or weakly identified random-effects structure.");
  }
  if (minObservationsPerGroup === 1) {
    warnings.push("Some clusters contain only one complete observation; they contribute to fixed effects but provide limited information about within-cluster variation.");
  }
  if (validRandomSlope) {
    const groupsWithSlopeVariation = Array.from(groupIndices.values()).filter((indices) => {
      const values = indices.map((index) => rawRandomSlopeValues[index]);
      return values.length >= 2 && Math.max(...values) - Math.min(...values) > 1e-10;
    }).length;
    if (groupsWithSlopeVariation < Math.max(2, Math.ceil(groupCount * 0.5))) {
      warnings.push(`Only ${groupsWithSlopeVariation} of ${groupCount} clusters show within-cluster variation in ${validRandomSlope.label}; random-slope estimation may be weak.`);
    }
  }
  if (centering === "cluster") {
    warnings.push("Numeric predictors are cluster-mean centred, so their coefficients represent within-cluster associations. Include separately prepared cluster means when you also need between-cluster effects.");
  }
  if (estimator === "reml") {
    warnings.push("REML is preferred for variance estimation. Use ML when comparing models that differ in fixed effects or when you want AIC/BIC in this interface.");
  }

  return {
    ...base,
    predictors: predictorMetadata,
    n,
    groupCount,
    minObservationsPerGroup,
    maxObservationsPerGroup,
    meanObservationsPerGroup,
    fixedEffectCount: p,
    converged: true,
    iterations: objectiveEvaluations,
    logLikelihood,
    aic,
    bic,
    randomInterceptVariance,
    randomInterceptSd,
    randomSlopeVariance,
    randomSlopeSd,
    randomInterceptSlopeCovariance,
    randomInterceptSlopeCorrelation,
    residualVariance,
    residualSd,
    icc,
    marginalR2,
    conditionalR2,
    coefficients,
    structureComparison,
    warning: warnings.length ? warnings.join(" ") : null,
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


function logisticSigmoid(value: number) {
  if (value >= 0) {
    const expNegative = Math.exp(-Math.min(value, 700));
    return 1 / (1 + expNegative);
  }
  const expValue = Math.exp(Math.max(value, -700));
  return expValue / (1 + expValue);
}

function safeProbability(value: number) {
  return Math.min(1 - 1e-12, Math.max(1e-12, value));
}

function safeExp(value: number | null) {
  if (value === null || !Number.isFinite(value)) return null;
  if (value > 700) return Number.POSITIVE_INFINITY;
  if (value < -700) return 0;
  return Math.exp(value);
}

function binaryAuc(outcomes: number[], probabilities: number[]) {
  if (outcomes.length !== probabilities.length || outcomes.length === 0) return null;
  const positiveN = outcomes.filter((value) => value === 1).length;
  const negativeN = outcomes.length - positiveN;
  if (positiveN === 0 || negativeN === 0) return null;

  const ordered = probabilities
    .map((probability, index) => ({ probability, outcome: outcomes[index] }))
    .sort((a, b) => a.probability - b.probability);

  let rank = 1;
  let positiveRankSum = 0;
  let index = 0;
  while (index < ordered.length) {
    let end = index + 1;
    while (end < ordered.length && Math.abs(ordered[end].probability - ordered[index].probability) <= 1e-12) {
      end += 1;
    }
    const count = end - index;
    const averageRank = (rank + (rank + count - 1)) / 2;
    for (let cursor = index; cursor < end; cursor += 1) {
      if (ordered[cursor].outcome === 1) positiveRankSum += averageRank;
    }
    rank += count;
    index = end;
  }

  return (positiveRankSum - (positiveN * (positiveN + 1)) / 2) / (positiveN * negativeN);
}

export function computeBinaryLogisticRegression(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  predictors: AnalysisVariable[],
  positiveClass?: string,
  threshold = 0.5
): BinaryLogisticResult {
  const uniquePredictors = predictors
    .filter(
      (variable, index, list) =>
        variable.name !== outcome.name &&
        !["id", "datetime", "text"].includes(variable.level) &&
        list.findIndex((candidate) => candidate.name === variable.name) === index
    )
    .slice(0, 16);

  const outcomeLevels = Array.from(
    new Set(
      rows
        .filter((row) => !isMissingValue(row[outcome.name]))
        .map((row) => asStableText(row[outcome.name]))
    )
  ).sort((a, b) => a.localeCompare(b));

  const selectedPositiveClass =
    positiveClass && outcomeLevels.includes(positiveClass)
      ? positiveClass
      : outcomeLevels[outcomeLevels.length - 1] ?? "";
  const selectedNegativeClass = outcomeLevels.find((level) => level !== selectedPositiveClass) ?? "";
  const classificationThreshold = Math.min(0.99, Math.max(0.01, threshold));

  const emptyClassification: BinaryLogisticClassification = {
    threshold: classificationThreshold,
    truePositive: 0,
    trueNegative: 0,
    falsePositive: 0,
    falseNegative: 0,
    accuracy: null,
    sensitivity: null,
    specificity: null,
    precision: null,
    negativePredictiveValue: null,
    f1: null,
    auc: null,
    brierScore: null,
  };

  const base = {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    positiveClass: selectedPositiveClass,
    negativeClass: selectedNegativeClass,
    predictors: [] as BinaryLogisticResult["predictors"],
  };

  if (outcomeLevels.length !== 2) {
    return {
      ...base,
      n: 0,
      positiveN: 0,
      negativeN: 0,
      predictorCount: uniquePredictors.length,
      coefficientCount: 0,
      converged: false,
      iterations: 0,
      logLikelihood: null,
      nullLogLikelihood: null,
      likelihoodRatioChiSquare: null,
      dfModel: null,
      pValue: null,
      deviance: null,
      aic: null,
      bic: null,
      mcfaddenR2: null,
      nagelkerkeR2: null,
      coefficients: [],
      classification: emptyClassification,
      warning: null,
      issue: `Binary logistic regression requires exactly two observed outcome levels. ${outcome.label} currently has ${outcomeLevels.length}.`,
    };
  }

  if (uniquePredictors.length < 1) {
    return {
      ...base,
      n: 0,
      positiveN: 0,
      negativeN: 0,
      predictorCount: 0,
      coefficientCount: 0,
      converged: false,
      iterations: 0,
      logLikelihood: null,
      nullLogLikelihood: null,
      likelihoodRatioChiSquare: null,
      dfModel: null,
      pValue: null,
      deviance: null,
      aic: null,
      bic: null,
      mcfaddenR2: null,
      nagelkerkeR2: null,
      coefficients: [],
      classification: emptyClassification,
      warning: null,
      issue: "Select at least one predictor.",
    };
  }

  type PredictorEncoding = {
    variable: AnalysisVariable;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
    columns: Array<{ term: string; label: string; level: string | null }>;
  };

  const preliminaryRows = rows.filter((row) => {
    if (isMissingValue(row[outcome.name])) return false;
    const outcomeValue = asStableText(row[outcome.name]);
    if (!outcomeLevels.includes(outcomeValue)) return false;
    return uniquePredictors.every((variable) =>
      variable.level === "continuous" || variable.level === "ordinal"
        ? toFiniteNumber(row[variable.name]) !== null
        : !isMissingValue(row[variable.name])
    );
  });

  const encodings: PredictorEncoding[] = uniquePredictors.map((variable) => {
    const numeric = variable.level === "continuous" || variable.level === "ordinal";
    if (numeric) {
      return {
        variable,
        kind: "numeric" as const,
        levels: [],
        referenceLevel: null,
        columns: [{ term: variable.name, label: variable.label, level: null }],
      };
    }

    const levels = Array.from(
      new Set(preliminaryRows.map((row) => asStableText(row[variable.name])))
    ).sort((a, b) => a.localeCompare(b));
    const referenceLevel = levels[0] ?? null;
    return {
      variable,
      kind: "categorical" as const,
      levels,
      referenceLevel,
      columns: levels.slice(1).map((level) => ({
        term: `${variable.name}[${level}]`,
        label: `${variable.label}: ${level} vs ${referenceLevel}`,
        level,
      })),
    };
  });

  const invalidCategorical = encodings.find(
    (encoding) => encoding.kind === "categorical" && encoding.levels.length < 2
  );
  if (invalidCategorical) {
    return {
      ...base,
      predictors: encodings.map((encoding) => ({
        name: encoding.variable.name,
        label: encoding.variable.label,
        kind: encoding.kind,
        levels: encoding.levels,
        referenceLevel: encoding.referenceLevel,
      })),
      n: preliminaryRows.length,
      positiveN: 0,
      negativeN: 0,
      predictorCount: uniquePredictors.length,
      coefficientCount: 0,
      converged: false,
      iterations: 0,
      logLikelihood: null,
      nullLogLikelihood: null,
      likelihoodRatioChiSquare: null,
      dfModel: null,
      pValue: null,
      deviance: null,
      aic: null,
      bic: null,
      mcfaddenR2: null,
      nagelkerkeR2: null,
      coefficients: [],
      classification: emptyClassification,
      warning: null,
      issue: `${invalidCategorical.variable.label} has fewer than two observed levels among complete cases.`,
    };
  }

  const complete: Array<{ y: number; x: number[] }> = [];
  for (const row of preliminaryRows) {
    const outcomeValue = asStableText(row[outcome.name]);
    const y = outcomeValue === selectedPositiveClass ? 1 : 0;
    const x: number[] = [1];
    let usable = true;

    for (const encoding of encodings) {
      if (encoding.kind === "numeric") {
        const value = toFiniteNumber(row[encoding.variable.name]);
        if (value === null) {
          usable = false;
          break;
        }
        x.push(value);
      } else {
        const value = asStableText(row[encoding.variable.name]);
        for (const column of encoding.columns) x.push(value === column.level ? 1 : 0);
      }
    }

    if (usable) complete.push({ y, x });
  }

  const n = complete.length;
  const y = complete.map((entry) => entry.y);
  const design = complete.map((entry) => entry.x);
  const coefficientCount = design[0]?.length ?? 0;
  const dfModel = Math.max(0, coefficientCount - 1);
  const positiveN = y.reduce((sum, value) => sum + value, 0);
  const negativeN = n - positiveN;
  const predictorMetadata = encodings.map((encoding) => ({
    name: encoding.variable.name,
    label: encoding.variable.label,
    kind: encoding.kind,
    levels: encoding.levels,
    referenceLevel: encoding.referenceLevel,
  }));

  const resultBase = {
    ...base,
    predictors: predictorMetadata,
    n,
    positiveN,
    negativeN,
    predictorCount: uniquePredictors.length,
    coefficientCount,
  };

  if (positiveN === 0 || negativeN === 0) {
    return {
      ...resultBase,
      converged: false,
      iterations: 0,
      logLikelihood: null,
      nullLogLikelihood: null,
      likelihoodRatioChiSquare: null,
      dfModel,
      pValue: null,
      deviance: null,
      aic: null,
      bic: null,
      mcfaddenR2: null,
      nagelkerkeR2: null,
      coefficients: [],
      classification: emptyClassification,
      warning: null,
      issue: "Both outcome classes must be present among listwise-complete observations.",
    };
  }

  if (coefficientCount < 2 || n <= coefficientCount) {
    return {
      ...resultBase,
      converged: false,
      iterations: 0,
      logLikelihood: null,
      nullLogLikelihood: null,
      likelihoodRatioChiSquare: null,
      dfModel,
      pValue: null,
      deviance: null,
      aic: null,
      bic: null,
      mcfaddenR2: null,
      nagelkerkeR2: null,
      coefficients: [],
      classification: emptyClassification,
      warning: null,
      issue: `The model needs more complete observations than estimated coefficients. Complete N = ${n}; coefficients = ${coefficientCount}.`,
    };
  }

  let beta = Array(coefficientCount).fill(0) as number[];
  const prevalence = positiveN / n;
  beta[0] = Math.log(prevalence / (1 - prevalence));
  const maxIterations = 100;
  let converged = false;
  let iterations = 0;
  let informationInverse: number[][] | null = null;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    iterations = iteration;
    const probabilities = design.map((row) =>
      safeProbability(logisticSigmoid(row.reduce((sum, value, index) => sum + value * beta[index], 0)))
    );
    const gradient = Array(coefficientCount).fill(0) as number[];
    const information = Array.from({ length: coefficientCount }, () =>
      Array(coefficientCount).fill(0) as number[]
    );

    for (let i = 0; i < n; i += 1) {
      const residual = y[i] - probabilities[i];
      const weight = Math.max(1e-10, probabilities[i] * (1 - probabilities[i]));
      for (let j = 0; j < coefficientCount; j += 1) {
        gradient[j] += design[i][j] * residual;
        for (let k = 0; k < coefficientCount; k += 1) {
          information[j][k] += design[i][j] * weight * design[i][k];
        }
      }
    }

    const inverse = invertMatrix(information);
    if (!inverse) {
      informationInverse = null;
      break;
    }
    informationInverse = inverse;
    const step = multiplyMatrixVector(inverse, gradient);
    const maximumStep = Math.max(...step.map((value) => Math.abs(value)));
    beta = beta.map((value, index) => value + step[index]);

    if (!beta.every(Number.isFinite) || beta.some((value) => Math.abs(value) > 1e6)) break;
    if (maximumStep < 1e-8) {
      converged = true;
      break;
    }
  }

  const probabilities = design.map((row) =>
    safeProbability(logisticSigmoid(row.reduce((sum, value, index) => sum + value * beta[index], 0)))
  );
  const logLikelihood = y.reduce(
    (sum, value, index) =>
      sum + value * Math.log(probabilities[index]) + (1 - value) * Math.log(1 - probabilities[index]),
    0
  );
  const nullProbability = safeProbability(prevalence);
  const nullLogLikelihood = y.reduce(
    (sum, value) => sum + value * Math.log(nullProbability) + (1 - value) * Math.log(1 - nullProbability),
    0
  );
  const likelihoodRatioChiSquare = Math.max(0, 2 * (logLikelihood - nullLogLikelihood));
  const modelPValue = dfModel > 0 ? chiSquareSurvivalProbability(likelihoodRatioChiSquare, dfModel) : null;
  const deviance = -2 * logLikelihood;
  const aic = 2 * coefficientCount - 2 * logLikelihood;
  const bic = Math.log(n) * coefficientCount - 2 * logLikelihood;
  const mcfaddenR2 = nullLogLikelihood !== 0 ? 1 - logLikelihood / nullLogLikelihood : null;
  const coxSnell = 1 - Math.exp((2 / n) * (nullLogLikelihood - logLikelihood));
  const maxCoxSnell = 1 - Math.exp((2 / n) * nullLogLikelihood);
  const nagelkerkeR2 = maxCoxSnell > 0 ? coxSnell / maxCoxSnell : null;

  // Recompute the observed information at the final estimates so coefficient
  // standard errors correspond to the reported model rather than the previous
  // Newton step.
  const finalInformation = Array.from({ length: coefficientCount }, () =>
    Array(coefficientCount).fill(0) as number[]
  );
  for (let i = 0; i < n; i += 1) {
    const weight = Math.max(1e-10, probabilities[i] * (1 - probabilities[i]));
    for (let j = 0; j < coefficientCount; j += 1) {
      for (let k = 0; k < coefficientCount; k += 1) {
        finalInformation[j][k] += design[i][j] * weight * design[i][k];
      }
    }
  }
  informationInverse = invertMatrix(finalInformation) ?? informationInverse;

  const columnMetadata: Array<{
    term: string;
    label: string;
    predictor: string | null;
    predictorLabel: string | null;
    kind: BinaryLogisticCoefficient["kind"];
    level: string | null;
    referenceLevel: string | null;
  }> = [
    {
      term: "(Intercept)",
      label: "Intercept",
      predictor: null,
      predictorLabel: null,
      kind: "intercept",
      level: null,
      referenceLevel: null,
    },
  ];
  for (const encoding of encodings) {
    for (const column of encoding.columns) {
      columnMetadata.push({
        term: column.term,
        label: column.label,
        predictor: encoding.variable.name,
        predictorLabel: encoding.variable.label,
        kind: encoding.kind,
        level: column.level,
        referenceLevel: encoding.referenceLevel,
      });
    }
  }

  const zCritical = 1.959963984540054;
  const coefficients: BinaryLogisticCoefficient[] = beta.map((estimate, index) => {
    const variance = informationInverse?.[index]?.[index];
    const se = variance !== undefined && Number.isFinite(variance) && variance >= 0
      ? Math.sqrt(Math.max(0, variance))
      : null;
    const z = se === null
      ? null
      : se === 0
        ? estimate === 0 ? 0 : Math.sign(estimate) * Number.POSITIVE_INFINITY
        : estimate / se;
    const pValue = z === null
      ? null
      : Number.isFinite(z)
        ? 2 * (1 - normalCdf(Math.abs(z)))
        : 0;
    const ciLowB = se === null ? null : estimate - zCritical * se;
    const ciHighB = se === null ? null : estimate + zCritical * se;
    const metadata = columnMetadata[index];
    return {
      ...metadata,
      b: estimate,
      se,
      z,
      pValue,
      oddsRatio: safeExp(estimate),
      ci95Low: safeExp(ciLowB),
      ci95High: safeExp(ciHighB),
    };
  });

  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  for (let i = 0; i < n; i += 1) {
    const predicted = probabilities[i] >= classificationThreshold ? 1 : 0;
    if (predicted === 1 && y[i] === 1) truePositive += 1;
    else if (predicted === 0 && y[i] === 0) trueNegative += 1;
    else if (predicted === 1 && y[i] === 0) falsePositive += 1;
    else falseNegative += 1;
  }
  const accuracy = n > 0 ? (truePositive + trueNegative) / n : null;
  const sensitivity = positiveN > 0 ? truePositive / positiveN : null;
  const specificity = negativeN > 0 ? trueNegative / negativeN : null;
  const precision = truePositive + falsePositive > 0 ? truePositive / (truePositive + falsePositive) : null;
  const negativePredictiveValue = trueNegative + falseNegative > 0 ? trueNegative / (trueNegative + falseNegative) : null;
  const f1 = precision !== null && sensitivity !== null && precision + sensitivity > 0
    ? (2 * precision * sensitivity) / (precision + sensitivity)
    : null;
  const brierScore = probabilities.reduce(
    (sum, probability, index) => sum + (probability - y[index]) ** 2,
    0
  ) / n;
  const auc = binaryAuc(y, probabilities);

  const classification: BinaryLogisticClassification = {
    threshold: classificationThreshold,
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
    accuracy,
    sensitivity,
    specificity,
    precision,
    negativePredictiveValue,
    f1,
    auc,
    brierScore,
  };

  const maximumAbsoluteCoefficient = beta.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
  const warning = !converged
    ? "The maximum-likelihood iteration did not fully converge. Review separation, sparse categories, and predictor redundancy before interpreting coefficients."
    : maximumAbsoluteCoefficient > 20
      ? "Very large coefficient estimates suggest possible complete or quasi-complete separation. Review sparse categories and consider a penalized model before substantive interpretation."
      : positiveN < 10 || negativeN < 10
        ? "One outcome class has fewer than 10 complete observations. Estimates and Wald confidence intervals may be unstable."
        : null;

  return {
    ...resultBase,
    converged,
    iterations,
    logLikelihood,
    nullLogLikelihood,
    likelihoodRatioChiSquare,
    dfModel,
    pValue: modelPValue,
    deviance,
    aic,
    bic,
    mcfaddenR2,
    nagelkerkeR2,
    coefficients,
    classification,
    warning,
    issue: informationInverse ? null : "The logistic information matrix is singular. Remove redundant predictors or sparse categorical levels and try again.",
  };
}



type BfgsResult = {
  parameters: number[];
  inverseHessian: number[][];
  value: number;
  converged: boolean;
  iterations: number;
};

function vectorDot(left: number[], right: number[]) {
  return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
}

function identityMatrix(size: number): number[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0) as number)
  );
}

function bfgsMinimize(
  evaluate: (parameters: number[]) => { value: number; gradient: number[] },
  initial: number[],
  maxIterations = 140,
  tolerance = 1e-7
): BfgsResult {
  let parameters = initial.slice();
  let current = evaluate(parameters);
  let inverseHessian = identityMatrix(initial.length);
  let converged = false;
  let iterations = 0;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    iterations = iteration;
    const gradientNorm = Math.max(...current.gradient.map((value) => Math.abs(value)), 0);
    if (gradientNorm < tolerance) {
      converged = true;
      break;
    }

    let direction = multiplyMatrixVector(inverseHessian, current.gradient).map((value) => -value);
    let directionalDerivative = vectorDot(current.gradient, direction);
    if (!Number.isFinite(directionalDerivative) || directionalDerivative >= -1e-12) {
      direction = current.gradient.map((value) => -value);
      directionalDerivative = -vectorDot(current.gradient, current.gradient);
      inverseHessian = identityMatrix(initial.length);
    }

    let stepSize = 1;
    let nextParameters = parameters.slice();
    let next = current;
    let accepted = false;
    for (let lineSearch = 0; lineSearch < 28; lineSearch += 1) {
      nextParameters = parameters.map((value, index) => value + stepSize * direction[index]);
      next = evaluate(nextParameters);
      if (
        Number.isFinite(next.value) &&
        next.gradient.every(Number.isFinite) &&
        next.value <= current.value + 1e-4 * stepSize * directionalDerivative
      ) {
        accepted = true;
        break;
      }
      stepSize *= 0.5;
    }

    if (!accepted || stepSize < 1e-10) break;

    const sVector = nextParameters.map((value, index) => value - parameters[index]);
    const yVector = next.gradient.map((value, index) => value - current.gradient[index]);
    const ys = vectorDot(yVector, sVector);

    if (Number.isFinite(ys) && ys > 1e-12) {
      const hy = multiplyMatrixVector(inverseHessian, yVector);
      const yHy = vectorDot(yVector, hy);
      const coefficient = (ys + yHy) / (ys * ys);
      inverseHessian = inverseHessian.map((row, i) =>
        row.map((value, j) =>
          value +
          coefficient * sVector[i] * sVector[j] -
          (hy[i] * sVector[j] + sVector[i] * hy[j]) / ys
        )
      );
    } else {
      inverseHessian = identityMatrix(initial.length);
    }

    parameters = nextParameters;
    current = next;
    if (Math.max(...sVector.map((value) => Math.abs(value)), 0) < tolerance) {
      converged = true;
      break;
    }
  }

  return {
    parameters,
    inverseHessian,
    value: current.value,
    converged,
    iterations,
  };
}

type GeneralCategoricalPredictorEncoding = {
  variable: AnalysisVariable;
  kind: "numeric" | "categorical";
  levels: string[];
  referenceLevel: string | null;
  columns: Array<{ term: string; label: string; level: string | null }>;
};

function buildGeneralCategoricalEncodings(
  rows: AnalysisRow[],
  predictors: AnalysisVariable[]
): GeneralCategoricalPredictorEncoding[] {
  return predictors.map((variable) => {
    const numeric = variable.level === "continuous" || variable.level === "ordinal";
    if (numeric) {
      return {
        variable,
        kind: "numeric" as const,
        levels: [],
        referenceLevel: null,
        columns: [{ term: variable.name, label: variable.label, level: null }],
      };
    }
    const levels = Array.from(
      new Set(rows.map((row) => asStableText(row[variable.name])))
    ).sort((a, b) => a.localeCompare(b));
    const referenceLevel = levels[0] ?? null;
    return {
      variable,
      kind: "categorical" as const,
      levels,
      referenceLevel,
      columns: levels.slice(1).map((level) => ({
        term: `${variable.name}[${level}]`,
        label: `${variable.label}: ${level} vs ${referenceLevel ?? "reference"}`,
        level,
      })),
    };
  });
}

function generalCategoricalDesignRow(
  row: AnalysisRow,
  encodings: GeneralCategoricalPredictorEncoding[],
  includeIntercept = true
) {
  const vector = includeIntercept ? [1] : [] as number[];
  for (const encoding of encodings) {
    if (encoding.kind === "numeric") {
      const value = toFiniteNumber(row[encoding.variable.name]);
      if (value === null) return null;
      vector.push(value);
    } else {
      const value = asStableText(row[encoding.variable.name]);
      for (const column of encoding.columns) vector.push(value === column.level ? 1 : 0);
    }
  }
  return vector;
}

export function computeMultinomialLogisticRegression(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  predictors: AnalysisVariable[],
  referenceClass?: string
): MultinomialLogisticResult {
  const uniquePredictors = predictors
    .filter(
      (variable, index, list) =>
        variable.name !== outcome.name &&
        !["id", "datetime", "text"].includes(variable.level) &&
        list.findIndex((candidate) => candidate.name === variable.name) === index
    )
    .slice(0, 12);

  const observedLevels = Array.from(
    new Set(rows.filter((row) => !isMissingValue(row[outcome.name])).map((row) => asStableText(row[outcome.name])))
  ).sort((a, b) => a.localeCompare(b));
  const selectedReference = referenceClass && observedLevels.includes(referenceClass)
    ? referenceClass
    : observedLevels[observedLevels.length - 1] ?? "";
  const classes = [...observedLevels.filter((level) => level !== selectedReference), selectedReference].filter(Boolean);
  const emptyClassification: MultinomialClassification = {
    accuracy: null,
    macroRecall: null,
    logLoss: null,
    classes,
    confusionMatrix: classes.map(() => classes.map(() => 0)),
  };
  const base = {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    classes,
    referenceClass: selectedReference,
    predictors: [] as MultinomialLogisticResult["predictors"],
  };

  if (observedLevels.length < 3) {
    return {
      ...base, n: 0, classCounts: [], predictorCount: uniquePredictors.length, coefficientCount: 0,
      converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: null, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], classification: emptyClassification, warning: null,
      issue: `Multinomial logistic regression requires at least three observed outcome levels. ${outcome.label} currently has ${observedLevels.length}.`,
    };
  }
  if (observedLevels.length > 8) {
    return {
      ...base, n: 0, classCounts: [], predictorCount: uniquePredictors.length, coefficientCount: 0,
      converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: null, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], classification: emptyClassification, warning: null,
      issue: "Multinomial V1 supports up to eight observed outcome categories. Recode very high-cardinality outcomes before fitting this model.",
    };
  }
  if (uniquePredictors.length < 1) {
    return {
      ...base, n: 0, classCounts: [], predictorCount: 0, coefficientCount: 0,
      converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: null, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], classification: emptyClassification, warning: null,
      issue: "Select at least one predictor.",
    };
  }

  const preliminaryRows = rows.filter((row) => {
    if (isMissingValue(row[outcome.name])) return false;
    return uniquePredictors.every((variable) =>
      variable.level === "continuous" || variable.level === "ordinal"
        ? toFiniteNumber(row[variable.name]) !== null
        : !isMissingValue(row[variable.name])
    );
  });
  const encodings = buildGeneralCategoricalEncodings(preliminaryRows, uniquePredictors);
  const invalidCategorical = encodings.find((encoding) => encoding.kind === "categorical" && encoding.levels.length < 2);
  const predictorMetadata = encodings.map((encoding) => ({
    name: encoding.variable.name,
    label: encoding.variable.label,
    kind: encoding.kind,
    levels: encoding.levels,
    referenceLevel: encoding.referenceLevel,
  }));
  if (invalidCategorical) {
    return {
      ...base, predictors: predictorMetadata, n: preliminaryRows.length, classCounts: [], predictorCount: uniquePredictors.length,
      coefficientCount: 0, converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: null, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], classification: emptyClassification, warning: null,
      issue: `${invalidCategorical.variable.label} has fewer than two observed levels among complete cases.`,
    };
  }

  const classIndex = new Map(classes.map((level, index) => [level, index]));
  const design: number[][] = [];
  const y: number[] = [];
  for (const row of preliminaryRows) {
    const vector = generalCategoricalDesignRow(row, encodings, true);
    const index = classIndex.get(asStableText(row[outcome.name]));
    if (!vector || index === undefined) continue;
    design.push(vector);
    y.push(index);
  }
  const n = design.length;
  const p = design[0]?.length ?? 0;
  const nonReferenceCount = classes.length - 1;
  const parameterCount = nonReferenceCount * p;
  const dfModel = nonReferenceCount * Math.max(0, p - 1);
  const classCounts = classes.map((level, index) => ({ level, count: y.filter((value) => value === index).length }));
  const resultBase = {
    ...base,
    predictors: predictorMetadata,
    n,
    classCounts,
    predictorCount: uniquePredictors.length,
    coefficientCount: parameterCount,
  };

  if (classCounts.some((item) => item.count === 0)) {
    return {
      ...resultBase, converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], classification: emptyClassification, warning: null,
      issue: "Every outcome category must be represented among listwise-complete observations.",
    };
  }
  if (parameterCount > 80) {
    return {
      ...resultBase, converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], classification: emptyClassification, warning: null,
      issue: `This specification expands to ${parameterCount} coefficients. Reduce predictors or sparse categorical levels; Multinomial V1 is capped at 80 coefficients for stable in-browser estimation.`,
    };
  }
  if (n <= parameterCount) {
    return {
      ...resultBase, converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], classification: emptyClassification, warning: null,
      issue: `The model needs more complete observations than estimated coefficients. Complete N = ${n}; coefficients = ${parameterCount}.`,
    };
  }

  const initial = Array(parameterCount).fill(0) as number[];
  const referenceCount = Math.max(1, classCounts[classCounts.length - 1]?.count ?? 1);
  for (let classPosition = 0; classPosition < nonReferenceCount; classPosition += 1) {
    initial[classPosition * p] = Math.log(Math.max(1, classCounts[classPosition].count) / referenceCount);
  }

  const evaluate = (parameters: number[]) => {
    let value = 0;
    const gradient = Array(parameterCount).fill(0) as number[];
    for (let i = 0; i < n; i += 1) {
      const scores = Array(classes.length).fill(0) as number[];
      for (let c = 0; c < nonReferenceCount; c += 1) {
        const offset = c * p;
        scores[c] = design[i].reduce((sum, x, j) => sum + x * parameters[offset + j], 0);
      }
      scores[classes.length - 1] = 0;
      const maximum = Math.max(...scores);
      const exponentials = scores.map((score) => Math.exp(Math.max(-700, Math.min(700, score - maximum))));
      const denominator = exponentials.reduce((sum, item) => sum + item, 0);
      const probabilities = exponentials.map((item) => item / denominator);
      value -= Math.log(safeProbability(probabilities[y[i]]));
      for (let c = 0; c < nonReferenceCount; c += 1) {
        const residual = probabilities[c] - (y[i] === c ? 1 : 0);
        const offset = c * p;
        for (let j = 0; j < p; j += 1) gradient[offset + j] += residual * design[i][j];
      }
    }
    return { value, gradient };
  };

  const fit = bfgsMinimize(evaluate, initial, 180, 1e-7);
  const logLikelihood = -fit.value;
  const nullLogLikelihood = classCounts.reduce((sum, item) => {
    const probability = safeProbability(item.count / n);
    return sum + item.count * Math.log(probability);
  }, 0);
  const likelihoodRatioChiSquare = Math.max(0, 2 * (logLikelihood - nullLogLikelihood));
  const modelPValue = dfModel > 0 ? chiSquareSurvivalProbability(likelihoodRatioChiSquare, dfModel) : null;
  const deviance = -2 * logLikelihood;
  const aic = 2 * parameterCount - 2 * logLikelihood;
  const bic = Math.log(n) * parameterCount - 2 * logLikelihood;
  const mcfaddenR2 = nullLogLikelihood !== 0 ? 1 - logLikelihood / nullLogLikelihood : null;

  const columnMetadata: Array<{
    term: string; label: string; predictor: string | null; predictorLabel: string | null;
    kind: MultinomialLogisticCoefficient["kind"]; level: string | null; referenceLevel: string | null;
  }> = [{ term: "(Intercept)", label: "Intercept", predictor: null, predictorLabel: null, kind: "intercept", level: null, referenceLevel: null }];
  for (const encoding of encodings) {
    for (const column of encoding.columns) {
      columnMetadata.push({
        term: column.term,
        label: column.label,
        predictor: encoding.variable.name,
        predictorLabel: encoding.variable.label,
        kind: encoding.kind,
        level: column.level,
        referenceLevel: encoding.referenceLevel,
      });
    }
  }
  const zCritical = 1.959963984540054;
  const coefficients: MultinomialLogisticCoefficient[] = [];
  for (let c = 0; c < nonReferenceCount; c += 1) {
    for (let j = 0; j < p; j += 1) {
      const index = c * p + j;
      const estimate = fit.parameters[index];
      const variance = fit.inverseHessian[index]?.[index];
      const se = variance !== undefined && Number.isFinite(variance) && variance >= 0 ? Math.sqrt(Math.max(0, variance)) : null;
      const z = se === null ? null : se === 0 ? (estimate === 0 ? 0 : Math.sign(estimate) * Number.POSITIVE_INFINITY) : estimate / se;
      const pValue = z === null ? null : Number.isFinite(z) ? 2 * (1 - normalCdf(Math.abs(z))) : 0;
      const ciLowB = se === null ? null : estimate - zCritical * se;
      const ciHighB = se === null ? null : estimate + zCritical * se;
      coefficients.push({
        outcomeClass: classes[c],
        referenceClass: selectedReference,
        ...columnMetadata[j],
        b: estimate,
        se,
        z,
        pValue,
        oddsRatio: safeExp(estimate),
        ci95Low: safeExp(ciLowB),
        ci95High: safeExp(ciHighB),
      });
    }
  }

  const confusionMatrix = classes.map(() => classes.map(() => 0));
  let correct = 0;
  let logLoss = 0;
  for (let i = 0; i < n; i += 1) {
    const scores = Array(classes.length).fill(0) as number[];
    for (let c = 0; c < nonReferenceCount; c += 1) {
      const offset = c * p;
      scores[c] = design[i].reduce((sum, x, j) => sum + x * fit.parameters[offset + j], 0);
    }
    const maximum = Math.max(...scores);
    const exponentials = scores.map((score) => Math.exp(Math.max(-700, Math.min(700, score - maximum))));
    const denominator = exponentials.reduce((sum, item) => sum + item, 0);
    const probabilities = exponentials.map((item) => item / denominator);
    let predicted = 0;
    for (let c = 1; c < probabilities.length; c += 1) if (probabilities[c] > probabilities[predicted]) predicted = c;
    confusionMatrix[y[i]][predicted] += 1;
    if (predicted === y[i]) correct += 1;
    logLoss -= Math.log(safeProbability(probabilities[y[i]]));
  }
  const recalls = classCounts.map((item, index) => item.count > 0 ? confusionMatrix[index][index] / item.count : null).filter((value): value is number => value !== null);
  const classification: MultinomialClassification = {
    accuracy: n > 0 ? correct / n : null,
    macroRecall: recalls.length ? recalls.reduce((sum, value) => sum + value, 0) / recalls.length : null,
    logLoss: n > 0 ? logLoss / n : null,
    classes,
    confusionMatrix,
  };

  const maximumAbsoluteCoefficient = fit.parameters.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
  const sparseClass = classCounts.find((item) => item.count < 10);
  const warning = !fit.converged
    ? "The multinomial maximum-likelihood optimizer did not fully converge. Review sparse categories, separation and predictor redundancy before interpreting coefficients."
    : maximumAbsoluteCoefficient > 20
      ? "Very large coefficient estimates suggest possible separation or sparse category combinations. Review the outcome and predictor levels before substantive interpretation."
      : sparseClass
        ? `${sparseClass.level} has fewer than 10 complete observations. Class-specific odds ratios and Wald intervals may be unstable.`
        : null;

  return {
    ...resultBase,
    converged: fit.converged,
    iterations: fit.iterations,
    logLikelihood,
    nullLogLikelihood,
    likelihoodRatioChiSquare,
    dfModel,
    pValue: modelPValue,
    deviance,
    aic,
    bic,
    mcfaddenR2,
    coefficients,
    classification,
    warning,
    issue: null,
  };
}

function defaultOrdinalOrder(levels: string[]) {
  const numeric = levels.map((value) => ({ value, numeric: Number(value) }));
  if (numeric.every((item) => Number.isFinite(item.numeric))) {
    return numeric.sort((a, b) => a.numeric - b.numeric).map((item) => item.value);
  }
  return levels.slice().sort((a, b) => a.localeCompare(b));
}

export function computeOrdinalLogisticRegression(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  predictors: AnalysisVariable[],
  orderedLevels?: string[]
): OrdinalLogisticResult {
  const uniquePredictors = predictors
    .filter(
      (variable, index, list) =>
        variable.name !== outcome.name &&
        !["id", "datetime", "text"].includes(variable.level) &&
        list.findIndex((candidate) => candidate.name === variable.name) === index
    )
    .slice(0, 12);
  const observedLevels = Array.from(
    new Set(rows.filter((row) => !isMissingValue(row[outcome.name])).map((row) => asStableText(row[outcome.name])))
  );
  const provided = (orderedLevels ?? []).filter((level, index, list) => observedLevels.includes(level) && list.indexOf(level) === index);
  const levels = provided.length === observedLevels.length ? provided : defaultOrdinalOrder(observedLevels);
  const emptyClassification: OrdinalClassification = {
    accuracy: null,
    adjacentAccuracy: null,
    meanAbsoluteCategoryError: null,
    logLoss: null,
    classes: levels,
    confusionMatrix: levels.map(() => levels.map(() => 0)),
  };
  const base = {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    orderedLevels: levels,
    predictors: [] as OrdinalLogisticResult["predictors"],
  };
  if (levels.length < 3) {
    return {
      ...base, n: 0, classCounts: [], predictorCount: uniquePredictors.length, coefficientCount: 0,
      converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: null, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], thresholds: [], classification: emptyClassification, warning: null,
      issue: `Ordinal logistic regression requires at least three ordered outcome levels. ${outcome.label} currently has ${levels.length}.`,
    };
  }
  if (levels.length > 10) {
    return {
      ...base, n: 0, classCounts: [], predictorCount: uniquePredictors.length, coefficientCount: 0,
      converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: null, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], thresholds: [], classification: emptyClassification, warning: null,
      issue: "Ordinal V1 supports up to ten ordered categories. Recode very high-cardinality outcomes before fitting a proportional-odds model.",
    };
  }
  if (uniquePredictors.length < 1) {
    return {
      ...base, n: 0, classCounts: [], predictorCount: 0, coefficientCount: 0,
      converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: null, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], thresholds: [], classification: emptyClassification, warning: null,
      issue: "Select at least one predictor.",
    };
  }

  const preliminaryRows = rows.filter((row) => {
    if (isMissingValue(row[outcome.name])) return false;
    const value = asStableText(row[outcome.name]);
    if (!levels.includes(value)) return false;
    return uniquePredictors.every((variable) =>
      variable.level === "continuous" || variable.level === "ordinal"
        ? toFiniteNumber(row[variable.name]) !== null
        : !isMissingValue(row[variable.name])
    );
  });
  const encodings = buildGeneralCategoricalEncodings(preliminaryRows, uniquePredictors);
  const invalidCategorical = encodings.find((encoding) => encoding.kind === "categorical" && encoding.levels.length < 2);
  const predictorMetadata = encodings.map((encoding) => ({
    name: encoding.variable.name,
    label: encoding.variable.label,
    kind: encoding.kind,
    levels: encoding.levels,
    referenceLevel: encoding.referenceLevel,
  }));
  if (invalidCategorical) {
    return {
      ...base, predictors: predictorMetadata, n: preliminaryRows.length, classCounts: [], predictorCount: uniquePredictors.length,
      coefficientCount: 0, converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: null, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], thresholds: [], classification: emptyClassification, warning: null,
      issue: `${invalidCategorical.variable.label} has fewer than two observed levels among complete cases.`,
    };
  }

  const levelIndex = new Map(levels.map((level, index) => [level, index]));
  const design: number[][] = [];
  const y: number[] = [];
  for (const row of preliminaryRows) {
    const vector = generalCategoricalDesignRow(row, encodings, false);
    const index = levelIndex.get(asStableText(row[outcome.name]));
    if (!vector || index === undefined) continue;
    design.push(vector);
    y.push(index);
  }
  const n = design.length;
  const p = design[0]?.length ?? 0;
  const thresholdCount = levels.length - 1;
  const parameterCount = thresholdCount + p;
  const classCounts = levels.map((level, index) => ({ level, count: y.filter((value) => value === index).length }));
  const resultBase = {
    ...base,
    predictors: predictorMetadata,
    n,
    classCounts,
    predictorCount: uniquePredictors.length,
    coefficientCount: p,
  };
  if (classCounts.some((item) => item.count === 0)) {
    return {
      ...resultBase, converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: p, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], thresholds: [], classification: emptyClassification, warning: null,
      issue: "Every ordered outcome category must be represented among listwise-complete observations.",
    };
  }
  if (parameterCount > 50 || n <= parameterCount) {
    return {
      ...resultBase, converged: false, iterations: 0, logLikelihood: null, nullLogLikelihood: null,
      likelihoodRatioChiSquare: null, dfModel: p, pValue: null, deviance: null, aic: null, bic: null,
      mcfaddenR2: null, coefficients: [], thresholds: [], classification: emptyClassification, warning: null,
      issue: parameterCount > 50
        ? `This specification expands to ${parameterCount} parameters. Reduce predictors or categorical levels; Ordinal V1 is capped at 50 parameters for stable in-browser estimation.`
        : `The model needs more complete observations than estimated parameters. Complete N = ${n}; parameters = ${parameterCount}.`,
    };
  }

  const cumulativeCounts: number[] = [];
  let running = 0;
  for (let j = 0; j < thresholdCount; j += 1) {
    running += classCounts[j].count;
    cumulativeCounts.push(running);
  }
  const initialThresholds = cumulativeCounts.map((count) => {
    const probability = safeProbability(count / n);
    return Math.log(probability / (1 - probability));
  });
  for (let j = 1; j < initialThresholds.length; j += 1) {
    if (initialThresholds[j] <= initialThresholds[j - 1] + 0.05) initialThresholds[j] = initialThresholds[j - 1] + 0.05;
  }
  const initial = Array(parameterCount).fill(0) as number[];
  initial[0] = initialThresholds[0];
  for (let j = 1; j < thresholdCount; j += 1) {
    initial[j] = Math.log(Math.max(1e-4, initialThresholds[j] - initialThresholds[j - 1]));
  }

  const unpack = (parameters: number[]) => {
    const thresholds = Array(thresholdCount).fill(0) as number[];
    thresholds[0] = parameters[0];
    for (let j = 1; j < thresholdCount; j += 1) thresholds[j] = thresholds[j - 1] + Math.exp(Math.max(-20, Math.min(20, parameters[j])));
    return { thresholds, beta: parameters.slice(thresholdCount) };
  };

  const evaluate = (parameters: number[]) => {
    const { thresholds, beta } = unpack(parameters);
    let value = 0;
    const gTheta = Array(thresholdCount).fill(0) as number[];
    const gBeta = Array(p).fill(0) as number[];
    for (let i = 0; i < n; i += 1) {
      const eta = design[i].reduce((sum, x, j) => sum + x * beta[j], 0);
      const category = y[i];
      const upper = category < thresholdCount ? safeProbability(logisticSigmoid(thresholds[category] - eta)) : 1;
      const lower = category > 0 ? safeProbability(logisticSigmoid(thresholds[category - 1] - eta)) : 0;
      const probability = Math.max(1e-12, upper - lower);
      value -= Math.log(probability);
      const fUpper = category < thresholdCount ? upper * (1 - upper) : 0;
      const fLower = category > 0 ? lower * (1 - lower) : 0;
      const betaMultiplier = (fUpper - fLower) / probability;
      for (let j = 0; j < p; j += 1) gBeta[j] += betaMultiplier * design[i][j];
      if (category < thresholdCount) gTheta[category] -= fUpper / probability;
      if (category > 0) gTheta[category - 1] += fLower / probability;
    }
    const gradient = Array(parameterCount).fill(0) as number[];
    gradient[0] = gTheta.reduce((sum, item) => sum + item, 0);
    for (let r = 1; r < thresholdCount; r += 1) {
      const tail = gTheta.slice(r).reduce((sum, item) => sum + item, 0);
      gradient[r] = Math.exp(Math.max(-20, Math.min(20, parameters[r]))) * tail;
    }
    for (let j = 0; j < p; j += 1) gradient[thresholdCount + j] = gBeta[j];
    return { value, gradient };
  };

  const fit = bfgsMinimize(evaluate, initial, 180, 1e-7);
  const unpacked = unpack(fit.parameters);
  const logLikelihood = -fit.value;
  const nullLogLikelihood = classCounts.reduce((sum, item) => {
    const probability = safeProbability(item.count / n);
    return sum + item.count * Math.log(probability);
  }, 0);
  const likelihoodRatioChiSquare = Math.max(0, 2 * (logLikelihood - nullLogLikelihood));
  const modelPValue = p > 0 ? chiSquareSurvivalProbability(likelihoodRatioChiSquare, p) : null;
  const deviance = -2 * logLikelihood;
  const aic = 2 * parameterCount - 2 * logLikelihood;
  const bic = Math.log(n) * parameterCount - 2 * logLikelihood;
  const mcfaddenR2 = nullLogLikelihood !== 0 ? 1 - logLikelihood / nullLogLikelihood : null;

  const columnMetadata: Array<{
    term: string; label: string; predictor: string; predictorLabel: string;
    kind: OrdinalLogisticCoefficient["kind"]; level: string | null; referenceLevel: string | null;
  }> = [];
  for (const encoding of encodings) {
    for (const column of encoding.columns) {
      columnMetadata.push({
        term: column.term,
        label: column.label,
        predictor: encoding.variable.name,
        predictorLabel: encoding.variable.label,
        kind: encoding.kind,
        level: column.level,
        referenceLevel: encoding.referenceLevel,
      });
    }
  }
  const zCritical = 1.959963984540054;
  const coefficients: OrdinalLogisticCoefficient[] = unpacked.beta.map((estimate, j) => {
    const parameterIndex = thresholdCount + j;
    const variance = fit.inverseHessian[parameterIndex]?.[parameterIndex];
    const se = variance !== undefined && Number.isFinite(variance) && variance >= 0 ? Math.sqrt(Math.max(0, variance)) : null;
    const z = se === null ? null : se === 0 ? (estimate === 0 ? 0 : Math.sign(estimate) * Number.POSITIVE_INFINITY) : estimate / se;
    const pValue = z === null ? null : Number.isFinite(z) ? 2 * (1 - normalCdf(Math.abs(z))) : 0;
    const ciLowB = se === null ? null : estimate - zCritical * se;
    const ciHighB = se === null ? null : estimate + zCritical * se;
    return {
      ...columnMetadata[j],
      b: estimate,
      se,
      z,
      pValue,
      oddsRatio: safeExp(estimate),
      ci95Low: safeExp(ciLowB),
      ci95High: safeExp(ciHighB),
    };
  });
  const thresholds: OrdinalLogisticThreshold[] = unpacked.thresholds.map((estimate, index) => ({
    lowerLevel: levels[index],
    upperLevel: levels[index + 1],
    estimate,
  }));

  const confusionMatrix = levels.map(() => levels.map(() => 0));
  let correct = 0;
  let adjacent = 0;
  let absoluteError = 0;
  let logLoss = 0;
  for (let i = 0; i < n; i += 1) {
    const eta = design[i].reduce((sum, x, j) => sum + x * unpacked.beta[j], 0);
    const cumulative = unpacked.thresholds.map((threshold) => safeProbability(logisticSigmoid(threshold - eta)));
    const probabilities = levels.map((_, category) => {
      const upper = category < thresholdCount ? cumulative[category] : 1;
      const lower = category > 0 ? cumulative[category - 1] : 0;
      return Math.max(0, upper - lower);
    });
    const total = probabilities.reduce((sum, item) => sum + item, 0) || 1;
    const normalized = probabilities.map((item) => item / total);
    let predicted = 0;
    for (let c = 1; c < normalized.length; c += 1) if (normalized[c] > normalized[predicted]) predicted = c;
    confusionMatrix[y[i]][predicted] += 1;
    if (predicted === y[i]) correct += 1;
    if (Math.abs(predicted - y[i]) <= 1) adjacent += 1;
    absoluteError += Math.abs(predicted - y[i]);
    logLoss -= Math.log(safeProbability(normalized[y[i]]));
  }
  const classification: OrdinalClassification = {
    accuracy: n > 0 ? correct / n : null,
    adjacentAccuracy: n > 0 ? adjacent / n : null,
    meanAbsoluteCategoryError: n > 0 ? absoluteError / n : null,
    logLoss: n > 0 ? logLoss / n : null,
    classes: levels,
    confusionMatrix,
  };

  const maximumAbsoluteCoefficient = unpacked.beta.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
  const sparseClass = classCounts.find((item) => item.count < 10);
  const warnings: string[] = [];
  if (!fit.converged) warnings.push("The ordinal maximum-likelihood optimizer did not fully converge. Review sparse categories and predictor redundancy before interpreting coefficients.");
  if (maximumAbsoluteCoefficient > 20) warnings.push("Very large coefficients suggest sparse category combinations or quasi-separation.");
  if (sparseClass) warnings.push(`${sparseClass.level} has fewer than 10 complete observations; Wald intervals may be unstable.`);
  warnings.push("The proportional-odds model assumes each predictor has the same slope across all cumulative outcome splits. Ordinal V1 reports this assumption explicitly but does not yet run a formal parallel-lines test.");

  return {
    ...resultBase,
    converged: fit.converged,
    iterations: fit.iterations,
    logLikelihood,
    nullLogLikelihood,
    likelihoodRatioChiSquare,
    dfModel: p,
    pValue: modelPValue,
    deviance,
    aic,
    bic,
    mcfaddenR2,
    coefficients,
    thresholds,
    classification,
    warning: warnings.join(" "),
    issue: null,
  };
}

function countRegressionLogLikelihood(
  family: CountRegressionFamily,
  y: number[],
  mu: number[],
  alpha: number
) {
  let total = 0;
  for (let i = 0; i < y.length; i += 1) {
    const observed = y[i];
    const fitted = Math.max(1e-12, mu[i]);
    if (family === "poisson" || alpha <= 1e-10) {
      total += observed * Math.log(fitted) - fitted - logGamma(observed + 1);
      continue;
    }
    const size = 1 / alpha;
    total +=
      logGamma(observed + size) -
      logGamma(size) -
      logGamma(observed + 1) +
      size * (Math.log(size) - Math.log(size + fitted)) +
      observed * (Math.log(fitted) - Math.log(size + fitted));
  }
  return Number.isFinite(total) ? total : null;
}

function countRegressionDeviance(
  family: CountRegressionFamily,
  y: number[],
  mu: number[],
  alpha: number
) {
  let total = 0;
  for (let i = 0; i < y.length; i += 1) {
    const observed = y[i];
    const fitted = Math.max(1e-12, mu[i]);
    if (family === "poisson" || alpha <= 1e-10) {
      total += observed === 0
        ? 2 * fitted
        : 2 * (observed * Math.log(observed / fitted) - (observed - fitted));
      continue;
    }
    const size = 1 / alpha;
    const first = observed === 0 ? 0 : observed * Math.log(observed / fitted);
    const second = (observed + size) * Math.log((observed + size) / (fitted + size));
    total += 2 * (first - second);
  }
  return Number.isFinite(total) ? Math.max(0, total) : null;
}

type CountIrlsFit = {
  beta: number[];
  covariance: number[][] | null;
  mu: number[];
  alpha: number;
  converged: boolean;
  iterations: number;
};

function fitCountRegressionIrls(
  design: number[][],
  y: number[],
  offset: number[],
  family: CountRegressionFamily,
  initialAlpha?: number
): CountIrlsFit | null {
  const n = design.length;
  const p = design[0]?.length ?? 0;
  if (n === 0 || p === 0 || y.length !== n || offset.length !== n) return null;

  const meanExposureAdjusted = (() => {
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i += 1) {
      numerator += y[i];
      denominator += Math.exp(Math.max(-25, Math.min(25, offset[i])));
    }
    return denominator > 0 ? Math.max(1e-8, numerator / denominator) : Math.max(1e-8, meanOf(y) ?? 1);
  })();

  let beta = Array(p).fill(0) as number[];
  beta[0] = Math.log(meanExposureAdjusted);
  let alpha = family === "negative_binomial" ? Math.max(1e-8, initialAlpha ?? 0.1) : 0;
  let covariance: number[][] | null = null;
  let mu = Array(n).fill(meanExposureAdjusted) as number[];
  let converged = false;
  let iterations = 0;

  const maxOuter = family === "negative_binomial" ? 10 : 1;
  for (let outer = 0; outer < maxOuter; outer += 1) {
    for (let iteration = 0; iteration < 80; iteration += 1) {
      iterations += 1;
      const eta = design.map((row, index) => {
        const linear = row.reduce((sum, value, column) => sum + value * beta[column], 0) + offset[index];
        return Math.max(-25, Math.min(25, linear));
      });
      mu = eta.map((value) => Math.max(1e-10, Math.exp(value)));

      const xtwx = Array.from({ length: p }, () => Array(p).fill(0) as number[]);
      const xtwz = Array(p).fill(0) as number[];

      for (let i = 0; i < n; i += 1) {
        const varianceInflation = family === "negative_binomial" ? 1 + alpha * mu[i] : 1;
        const weight = Math.max(1e-10, mu[i] / varianceInflation);
        const working = eta[i] + (y[i] - mu[i]) / mu[i] - offset[i];
        for (let j = 0; j < p; j += 1) {
          xtwz[j] += design[i][j] * weight * working;
          for (let k = 0; k < p; k += 1) {
            xtwx[j][k] += design[i][j] * weight * design[i][k];
          }
        }
      }

      const inverse = invertMatrix(xtwx);
      if (!inverse) return null;
      const nextBeta = multiplyMatrixVector(inverse, xtwz);
      const delta = Math.max(...nextBeta.map((value, index) => Math.abs(value - beta[index])));
      beta = nextBeta;
      covariance = inverse;
      if (delta < 1e-8) {
        converged = true;
        break;
      }
    }

    if (family !== "negative_binomial") break;

    const numerator = y.reduce((sum, observed, index) => {
      const fitted = mu[index];
      return sum + ((observed - fitted) ** 2 - fitted);
    }, 0);
    const denominator = mu.reduce((sum, fitted) => sum + fitted ** 2, 0);
    const momentAlpha = denominator > 0 ? Math.max(1e-8, Math.min(100, numerator / denominator)) : alpha;
    const nextAlpha = Math.max(1e-8, 0.5 * alpha + 0.5 * momentAlpha);
    if (Math.abs(nextAlpha - alpha) < 1e-7 * Math.max(1, alpha)) {
      alpha = nextAlpha;
      break;
    }
    alpha = nextAlpha;
  }

  const finalEta = design.map((row, index) => {
    const linear = row.reduce((sum, value, column) => sum + value * beta[column], 0) + offset[index];
    return Math.max(-25, Math.min(25, linear));
  });
  mu = finalEta.map((value) => Math.max(1e-10, Math.exp(value)));

  const information = Array.from({ length: p }, () => Array(p).fill(0) as number[]);
  for (let i = 0; i < n; i += 1) {
    const varianceInflation = family === "negative_binomial" ? 1 + alpha * mu[i] : 1;
    const weight = Math.max(1e-10, mu[i] / varianceInflation);
    for (let j = 0; j < p; j += 1) {
      for (let k = 0; k < p; k += 1) {
        information[j][k] += design[i][j] * weight * design[i][k];
      }
    }
  }
  covariance = invertMatrix(information) ?? covariance;

  return { beta, covariance, mu, alpha, converged, iterations };
}


const glmmHermiteNodes = [
  -4.499990707309392, -3.6699503734044527, -2.967166927905603,
  -2.325732486173858, -1.7199925751864888, -1.1361155852109206,
  -0.5650695832555758, 0, 0.5650695832555758, 1.1361155852109206,
  1.7199925751864888, 2.325732486173858, 2.967166927905603,
  3.6699503734044527, 4.499990707309392,
];

const glmmHermiteWeights = [
  1.522475804253521e-9, 1.0591155477110625e-6, 0.00010000444123249982,
  0.002778068842912775, 0.0307800338725461, 0.15848891579593571,
  0.4120286874988987, 0.5641003087264174, 0.4120286874988987,
  0.15848891579593571, 0.0307800338725461, 0.002778068842912775,
  0.00010000444123249982, 1.0591155477110625e-6, 1.522475804253521e-9,
];

function glmmLogSumExp(values: number[]) {
  if (values.length === 0) return Number.NEGATIVE_INFINITY;
  const maximum = Math.max(...values);
  if (!Number.isFinite(maximum)) return maximum;
  return maximum + Math.log(values.reduce((sum, value) => sum + Math.exp(value - maximum), 0));
}

function glmmSoftplus(value: number) {
  if (value > 35) return value;
  if (value < -35) return Math.exp(value);
  return Math.log1p(Math.exp(value));
}

function glmmDot(left: number[], right: number[]) {
  let total = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) total += left[index] * right[index];
  return total;
}

function glmmIdentity(size: number): number[][] {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => row === column ? 1 : 0));
}

function glmmOuter(left: number[], right: number[]) {
  return left.map((value) => right.map((other) => value * other));
}

function glmmMatVec(matrix: number[][], vector: number[]) {
  return matrix.map((row) => glmmDot(row, vector));
}

function glmmAddMatrix(left: number[][], right: number[][], leftScale = 1, rightScale = 1) {
  return left.map((row, i) => row.map((value, j) => leftScale * value + rightScale * (right[i]?.[j] ?? 0)));
}

function glmmBfgs(
  objective: (parameters: number[]) => number,
  start: number[],
  maxIterations = 55
) {
  const gradient = (parameters: number[]) => parameters.map((value, index) => {
    const step = 1e-5 * (1 + Math.abs(value));
    const plus = [...parameters];
    const minus = [...parameters];
    plus[index] += step;
    minus[index] -= step;
    return (objective(plus) - objective(minus)) / (2 * step);
  });

  let parameters = [...start];
  let value = objective(parameters);
  let grad = gradient(parameters);
  let inverseHessian = glmmIdentity(parameters.length);
  let converged = false;
  let iterations = 0;

  for (iterations = 0; iterations < maxIterations; iterations += 1) {
    const gradNorm = Math.sqrt(glmmDot(grad, grad));
    if (gradNorm < 1e-5) { converged = true; break; }

    let direction = glmmMatVec(inverseHessian, grad).map((entry) => -entry);
    if (glmmDot(direction, grad) >= -1e-12) direction = grad.map((entry) => -entry);

    let stepSize = 1;
    const slope = glmmDot(grad, direction);
    let candidate = parameters;
    let candidateValue = value;
    while (stepSize >= 1e-6) {
      candidate = parameters.map((entry, index) => entry + stepSize * direction[index]);
      const logSigmaIndex = candidate.length - 1;
      candidate[logSigmaIndex] = Math.max(-6, Math.min(3, candidate[logSigmaIndex]));
      candidateValue = objective(candidate);
      if (Number.isFinite(candidateValue) && candidateValue <= value + 1e-4 * stepSize * slope) break;
      stepSize *= 0.5;
    }
    if (stepSize < 1e-6 || !Number.isFinite(candidateValue)) break;

    const nextGrad = gradient(candidate);
    const s = candidate.map((entry, index) => entry - parameters[index]);
    const y = nextGrad.map((entry, index) => entry - grad[index]);
    const sy = glmmDot(s, y);

    if (sy > 1e-10) {
      const rho = 1 / sy;
      const identity = glmmIdentity(parameters.length);
      const syOuter = glmmOuter(s, y);
      const ysOuter = glmmOuter(y, s);
      const ssOuter = glmmOuter(s, s);
      const left = glmmAddMatrix(identity, syOuter, 1, -rho);
      const right = glmmAddMatrix(identity, ysOuter, 1, -rho);
      const temp = multiplyMatrices(left, inverseHessian);
      inverseHessian = glmmAddMatrix(multiplyMatrices(temp, right), ssOuter, 1, rho);
    }

    const improvement = Math.abs(value - candidateValue);
    parameters = candidate;
    value = candidateValue;
    grad = nextGrad;
    if (improvement < 1e-8 * (1 + Math.abs(value)) && Math.sqrt(glmmDot(grad, grad)) < 5e-4) {
      converged = true;
      iterations += 1;
      break;
    }
  }

  return { parameters, value, inverseHessian, converged, iterations };
}

export function computeGeneralizedMixedModel(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  group: AnalysisVariable,
  predictors: AnalysisVariable[],
  options?: {
    family?: GeneralizedMixedFamily;
    positiveClass?: string | null;
    exposure?: AnalysisVariable | null;
  }
): GeneralizedMixedModelResult {
  const family = options?.family ?? "binomial";
  const exposure = family === "poisson" ? options?.exposure ?? null : null;
  const uniquePredictors = predictors
    .filter((variable, index, list) =>
      variable.name !== outcome.name &&
      variable.name !== group.name &&
      variable.name !== exposure?.name &&
      !["id", "datetime", "text"].includes(variable.level) &&
      list.findIndex((candidate) => candidate.name === variable.name) === index
    )
    .slice(0, 10);

  const base = {
    family,
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    group: group.name,
    groupLabel: group.label,
    positiveClass: family === "binomial" ? options?.positiveClass ?? null : null,
    exposure: exposure?.name ?? null,
    exposureLabel: exposure?.label ?? null,
    predictors: [] as GeneralizedMixedModelResult["predictors"],
  };

  const fail = (issue: string): GeneralizedMixedModelResult => ({
    ...base,
    n: 0, groupCount: 0, minObservationsPerGroup: 0, maxObservationsPerGroup: 0,
    meanObservationsPerGroup: null, converged: false, iterations: 0,
    quadraturePoints: glmmHermiteNodes.length, logLikelihood: null, nullLogLikelihood: null,
    likelihoodRatioChiSquare: null, dfModel: null, pValue: null, aic: null, bic: null,
    randomInterceptVariance: null, randomInterceptSd: null, latentIcc: null,
    meanObserved: null, meanPredicted: null, coefficients: [], warning: null, issue,
  });

  if (uniquePredictors.length < 1) return fail("Select at least one fixed-effect predictor.");

  type Encoding = {
    variable: AnalysisVariable;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
    columns: Array<{ term: string; label: string; level: string | null }>;
  };

  const candidateRows = rows.filter((row) => {
    if (isMissingValue(row[group.name])) return false;
    if (family === "binomial") {
      if (isMissingValue(row[outcome.name])) return false;
    } else {
      const count = toFiniteNumber(row[outcome.name]);
      if (count === null || count < 0 || Math.abs(count - Math.round(count)) > 1e-8) return false;
      if (exposure) {
        const exposureValue = toFiniteNumber(row[exposure.name]);
        if (exposureValue === null || exposureValue <= 0) return false;
      }
    }
    return uniquePredictors.every((variable) =>
      variable.level === "continuous" || variable.level === "ordinal"
        ? toFiniteNumber(row[variable.name]) !== null
        : !isMissingValue(row[variable.name])
    );
  });

  const outcomeLevels = family === "binomial"
    ? Array.from(new Set(candidateRows.map((row) => asStableText(row[outcome.name])))).sort((a, b) => a.localeCompare(b))
    : [];
  if (family === "binomial" && outcomeLevels.length !== 2) {
    return fail(`Binary generalized mixed models require exactly two observed outcome levels. ${outcome.label} currently has ${outcomeLevels.length}.`);
  }
  const positiveClass = family === "binomial"
    ? (options?.positiveClass && outcomeLevels.includes(options.positiveClass) ? options.positiveClass : outcomeLevels[1])
    : null;
  base.positiveClass = positiveClass;

  const encodings: Encoding[] = uniquePredictors.map((variable) => {
    const numeric = variable.level === "continuous" || variable.level === "ordinal";
    if (numeric) return {
      variable, kind: "numeric" as const, levels: [], referenceLevel: null,
      columns: [{ term: variable.name, label: variable.label, level: null }],
    };
    const levels = Array.from(new Set(candidateRows.map((row) => asStableText(row[variable.name])))).sort((a, b) => a.localeCompare(b));
    const referenceLevel = levels[0] ?? null;
    return {
      variable, kind: "categorical" as const, levels, referenceLevel,
      columns: levels.slice(1).map((level) => ({
        term: `${variable.name}[${level}]`,
        label: `${variable.label}: ${level} vs ${referenceLevel ?? "reference"}`,
        level,
      })),
    };
  });
  base.predictors = encodings.map((encoding) => ({
    name: encoding.variable.name,
    label: encoding.variable.label,
    kind: encoding.kind,
    levels: encoding.levels,
    referenceLevel: encoding.referenceLevel,
  }));

  type Obs = { x: number[]; y: number; offset: number };
  const clusterMap = new Map<string, Obs[]>();
  for (const row of candidateRows) {
    const vector = [1];
    let valid = true;
    for (const encoding of encodings) {
      if (encoding.kind === "numeric") {
        const value = toFiniteNumber(row[encoding.variable.name]);
        if (value === null) { valid = false; break; }
        vector.push(value);
      } else {
        const value = asStableText(row[encoding.variable.name]);
        for (const column of encoding.columns) vector.push(value === column.level ? 1 : 0);
      }
    }
    if (!valid) continue;
    const y = family === "binomial"
      ? (asStableText(row[outcome.name]) === positiveClass ? 1 : 0)
      : Math.round(toFiniteNumber(row[outcome.name]) ?? 0);
    const exposureValue = exposure ? toFiniteNumber(row[exposure.name]) : 1;
    if (exposure && (exposureValue === null || exposureValue <= 0)) continue;
    const key = asStableText(row[group.name]);
    const bucket = clusterMap.get(key) ?? [];
    bucket.push({ x: vector, y, offset: exposure ? Math.log(exposureValue as number) : 0 });
    clusterMap.set(key, bucket);
  }

  const clusters = Array.from(clusterMap.values()).filter((cluster) => cluster.length > 0);
  const n = clusters.reduce((sum, cluster) => sum + cluster.length, 0);
  const groupCount = clusters.length;
  const coefficientCount = clusters[0]?.[0]?.x.length ?? 0;
  if (n <= coefficientCount + 2 || groupCount < 3) {
    const result = fail("The generalized mixed model needs more complete observations and at least three clusters.");
    result.n = n; result.groupCount = groupCount;
    return result;
  }

  const clusterSizes = clusters.map((cluster) => cluster.length);
  const meanObserved = clusters.reduce((sum, cluster) => sum + cluster.reduce((inner, obs) => inner + obs.y, 0), 0) / n;
  const sqrt2 = Math.sqrt(2);
  const logSqrtPi = 0.5 * Math.log(Math.PI);

  const negativeLogLikelihood = (parameters: number[]) => {
    const beta = parameters.slice(0, coefficientCount);
    const sigma = Math.exp(parameters[coefficientCount]);
    if (!Number.isFinite(sigma) || sigma <= 0) return 1e100;
    let total = 0;
    for (const cluster of clusters) {
      const nodeLogs = glmmHermiteNodes.map((node, nodeIndex) => {
        const randomIntercept = sqrt2 * sigma * node;
        let conditional = 0;
        for (const obs of cluster) {
          const eta = glmmDot(obs.x, beta) + obs.offset + randomIntercept;
          if (family === "binomial") {
            conditional += obs.y * eta - glmmSoftplus(eta);
          } else {
            const mu = Math.exp(Math.max(-30, Math.min(30, eta)));
            conditional += obs.y * eta - mu - logGamma(obs.y + 1);
          }
        }
        return Math.log(glmmHermiteWeights[nodeIndex]) + conditional;
      });
      const clusterLogLikelihood = glmmLogSumExp(nodeLogs) - logSqrtPi;
      if (!Number.isFinite(clusterLogLikelihood)) return 1e100;
      total += clusterLogLikelihood;
    }
    return -total;
  };

  const startingBeta = Array(coefficientCount).fill(0) as number[];
  if (family === "binomial") {
    const proportion = Math.min(0.999, Math.max(0.001, meanObserved));
    startingBeta[0] = Math.log(proportion / (1 - proportion));
  } else {
    const averageOffset = clusters.reduce((sum, cluster) => sum + cluster.reduce((inner, obs) => inner + obs.offset, 0), 0) / n;
    startingBeta[0] = Math.log(Math.max(1e-5, meanObserved)) - averageOffset;
  }

  const fitted = glmmBfgs(negativeLogLikelihood, [...startingBeta, Math.log(0.5)]);
  if (!Number.isFinite(fitted.value)) {
    const result = fail("The generalized mixed model could not be estimated. Review sparse outcome levels, redundant predictors, and cluster structure.");
    result.n = n; result.groupCount = groupCount;
    return result;
  }

  const beta = fitted.parameters.slice(0, coefficientCount);
  const sigma = Math.exp(fitted.parameters[coefficientCount]);
  const randomVariance = sigma * sigma;
  const logLikelihood = -fitted.value;

  const nullObjective = (parameters: number[]) => {
    const intercept = parameters[0];
    const nullSigma = Math.exp(parameters[1]);
    let total = 0;
    for (const cluster of clusters) {
      const nodeLogs = glmmHermiteNodes.map((node, nodeIndex) => {
        const randomIntercept = sqrt2 * nullSigma * node;
        let conditional = 0;
        for (const obs of cluster) {
          const eta = intercept + obs.offset + randomIntercept;
          if (family === "binomial") conditional += obs.y * eta - glmmSoftplus(eta);
          else {
            const mu = Math.exp(Math.max(-30, Math.min(30, eta)));
            conditional += obs.y * eta - mu - logGamma(obs.y + 1);
          }
        }
        return Math.log(glmmHermiteWeights[nodeIndex]) + conditional;
      });
      total += glmmLogSumExp(nodeLogs) - logSqrtPi;
    }
    return -total;
  };
  const nullFit = glmmBfgs(nullObjective, [startingBeta[0], Math.log(0.5)], 40);
  const nullLogLikelihood = Number.isFinite(nullFit.value) ? -nullFit.value : null;
  const dfModel = Math.max(0, coefficientCount - 1);
  const likelihoodRatioChiSquare = nullLogLikelihood === null ? null : Math.max(0, 2 * (logLikelihood - nullLogLikelihood));
  const modelPValue = likelihoodRatioChiSquare === null ? null : chiSquareSurvivalProbability(likelihoodRatioChiSquare, dfModel);
  const parameterCount = coefficientCount + 1;
  const aic = 2 * parameterCount - 2 * logLikelihood;
  const bic = Math.log(n) * parameterCount - 2 * logLikelihood;

  const columnMetadata: Array<Omit<GeneralizedMixedCoefficient, "b" | "se" | "z" | "pValue" | "effectRatio" | "ci95Low" | "ci95High">> = [{
    term: "(Intercept)", label: "Intercept", predictor: null, predictorLabel: null,
    kind: "intercept", level: null, referenceLevel: null,
  }];
  for (const encoding of encodings) {
    for (const column of encoding.columns) columnMetadata.push({
      term: column.term,
      label: column.label,
      predictor: encoding.variable.name,
      predictorLabel: encoding.variable.label,
      kind: encoding.kind,
      level: column.level,
      referenceLevel: encoding.referenceLevel,
    });
  }

  const covarianceApprox = fitted.inverseHessian;
  const zCritical = 1.959963984540054;
  const coefficients = beta.map((estimate, index) => {
    const variance = covarianceApprox[index]?.[index];
    const se = variance !== undefined && Number.isFinite(variance) && variance > 0 ? Math.sqrt(variance) : null;
    const z = se === null ? null : estimate / se;
    const pValue = z === null ? null : 2 * (1 - normalCdf(Math.abs(z)));
    const low = se === null ? null : estimate - zCritical * se;
    const high = se === null ? null : estimate + zCritical * se;
    return {
      ...columnMetadata[index], b: estimate, se, z, pValue,
      effectRatio: safeExp(estimate), ci95Low: safeExp(low), ci95High: safeExp(high),
    };
  });

  let meanPredicted = 0;
  for (const cluster of clusters) {
    for (const obs of cluster) {
      const fixedEta = glmmDot(obs.x, beta) + obs.offset;
      if (family === "binomial") {
        const probabilities = glmmHermiteNodes.map((node) => logisticSigmoid(fixedEta + sqrt2 * sigma * node));
        meanPredicted += probabilities.reduce((sum, probability, index) => sum + glmmHermiteWeights[index] * probability, 0) / Math.sqrt(Math.PI);
      } else {
        meanPredicted += Math.exp(Math.max(-30, Math.min(30, fixedEta + randomVariance / 2)));
      }
    }
  }
  meanPredicted /= n;

  const latentIcc = family === "binomial" ? randomVariance / (randomVariance + Math.PI * Math.PI / 3) : null;
  const warnings: string[] = [];
  if (!fitted.converged) warnings.push("The numerical optimizer did not meet the strict convergence tolerance; review the model specification before interpretation.");
  if (sigma < 0.03) warnings.push("The random-intercept SD is near zero, so the repeated-data model is approaching an ordinary generalized linear model.");
  if (groupCount < 10) warnings.push("The model has fewer than 10 clusters; random-effect and Wald uncertainty estimates can be unstable with very small cluster counts.");
  if (Math.min(...clusterSizes) === 1) warnings.push("At least one cluster contributes only one usable observation.");
  warnings.push("Generalized mixed-model V1 uses 15-point Gauss–Hermite quadrature with a random intercept. Random slopes and crossed random effects are intentionally not approximated here.");

  return {
    ...base,
    n, groupCount,
    minObservationsPerGroup: Math.min(...clusterSizes),
    maxObservationsPerGroup: Math.max(...clusterSizes),
    meanObservationsPerGroup: meanOf(clusterSizes),
    converged: fitted.converged,
    iterations: fitted.iterations,
    quadraturePoints: glmmHermiteNodes.length,
    logLikelihood, nullLogLikelihood, likelihoodRatioChiSquare, dfModel, pValue: modelPValue,
    aic, bic,
    randomInterceptVariance: randomVariance,
    randomInterceptSd: sigma,
    latentIcc,
    meanObserved,
    meanPredicted,
    coefficients,
    warning: warnings.join(" "),
    issue: null,
  };
}

export function computeCountRegression(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  predictors: AnalysisVariable[],
  options?: {
    family?: CountRegressionFamily;
    exposure?: AnalysisVariable | null;
  }
): CountRegressionResult {
  const family = options?.family ?? "poisson";
  const exposure = options?.exposure ?? null;
  const uniquePredictors = predictors
    .filter(
      (variable, index, list) =>
        variable.name !== outcome.name &&
        variable.name !== exposure?.name &&
        !["id", "datetime", "text"].includes(variable.level) &&
        list.findIndex((candidate) => candidate.name === variable.name) === index
    )
    .slice(0, 16);

  const base = {
    family,
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    exposure: exposure?.name ?? null,
    exposureLabel: exposure?.label ?? null,
    predictors: [] as CountRegressionResult["predictors"],
  };

  if (uniquePredictors.length < 1) {
    return {
      ...base,
      n: 0,
      excludedNonCount: 0,
      predictorCount: 0,
      coefficientCount: 0,
      converged: false,
      iterations: 0,
      logLikelihood: null,
      nullLogLikelihood: null,
      likelihoodRatioChiSquare: null,
      dfModel: null,
      pValue: null,
      deviance: null,
      aic: null,
      bic: null,
      pearsonDispersion: null,
      dispersionAlpha: null,
      meanObserved: null,
      meanFitted: null,
      observedZeroRate: null,
      expectedZeroRate: null,
      coefficients: [],
      warning: null,
      issue: "Select at least one predictor.",
    };
  }

  type Encoding = {
    variable: AnalysisVariable;
    kind: "numeric" | "categorical";
    levels: string[];
    referenceLevel: string | null;
    columns: Array<{ term: string; label: string; level: string | null }>;
  };

  let excludedNonCount = 0;
  const preliminary = rows.filter((row) => {
    const rawOutcome = toFiniteNumber(row[outcome.name]);
    if (rawOutcome === null) return false;
    const validCount = rawOutcome >= 0 && Math.abs(rawOutcome - Math.round(rawOutcome)) <= 1e-8;
    if (!validCount) {
      excludedNonCount += 1;
      return false;
    }
    if (exposure) {
      const exposureValue = toFiniteNumber(row[exposure.name]);
      if (exposureValue === null || exposureValue <= 0) return false;
    }
    return uniquePredictors.every((variable) =>
      variable.level === "continuous" || variable.level === "ordinal"
        ? toFiniteNumber(row[variable.name]) !== null
        : !isMissingValue(row[variable.name])
    );
  });

  const encodings: Encoding[] = uniquePredictors.map((variable) => {
    const numeric = variable.level === "continuous" || variable.level === "ordinal";
    if (numeric) {
      return {
        variable,
        kind: "numeric" as const,
        levels: [],
        referenceLevel: null,
        columns: [{ term: variable.name, label: variable.label, level: null }],
      };
    }
    const levels = Array.from(new Set(preliminary.map((row) => asStableText(row[variable.name])))).sort((a, b) => a.localeCompare(b));
    const referenceLevel = levels[0] ?? null;
    return {
      variable,
      kind: "categorical" as const,
      levels,
      referenceLevel,
      columns: levels.slice(1).map((level) => ({
        term: `${variable.name}[${level}]`,
        label: `${variable.label}: ${level} vs ${referenceLevel ?? "reference"}`,
        level,
      })),
    };
  });

  const predictorMetadata = encodings.map((encoding) => ({
    name: encoding.variable.name,
    label: encoding.variable.label,
    kind: encoding.kind,
    levels: encoding.levels,
    referenceLevel: encoding.referenceLevel,
  }));

  const design: number[][] = [];
  const y: number[] = [];
  const offset: number[] = [];
  for (const row of preliminary) {
    const outcomeValue = toFiniteNumber(row[outcome.name]);
    if (outcomeValue === null) continue;
    const vector = [1];
    let valid = true;
    for (const encoding of encodings) {
      if (encoding.kind === "numeric") {
        const value = toFiniteNumber(row[encoding.variable.name]);
        if (value === null) { valid = false; break; }
        vector.push(value);
      } else {
        const value = asStableText(row[encoding.variable.name]);
        for (const column of encoding.columns) vector.push(value === column.level ? 1 : 0);
      }
    }
    if (!valid) continue;
    const exposureValue = exposure ? toFiniteNumber(row[exposure.name]) : 1;
    if (exposureValue === null || exposureValue <= 0) continue;
    design.push(vector);
    y.push(Math.round(outcomeValue));
    offset.push(exposure ? Math.log(exposureValue) : 0);
  }

  const n = y.length;
  const coefficientCount = design[0]?.length ?? 0;
  const dfModel = Math.max(0, coefficientCount - 1);
  if (n <= coefficientCount || coefficientCount < 2) {
    return {
      ...base,
      predictors: predictorMetadata,
      n,
      excludedNonCount,
      predictorCount: uniquePredictors.length,
      coefficientCount,
      converged: false,
      iterations: 0,
      logLikelihood: null,
      nullLogLikelihood: null,
      likelihoodRatioChiSquare: null,
      dfModel,
      pValue: null,
      deviance: null,
      aic: null,
      bic: null,
      pearsonDispersion: null,
      dispersionAlpha: null,
      meanObserved: n > 0 ? meanOf(y) : null,
      meanFitted: null,
      observedZeroRate: n > 0 ? y.filter((value) => value === 0).length / n : null,
      expectedZeroRate: null,
      coefficients: [],
      warning: null,
      issue: "The count model needs more complete observations than estimated coefficients.",
    };
  }

  const fit = fitCountRegressionIrls(design, y, offset, family);
  if (!fit) {
    return {
      ...base,
      predictors: predictorMetadata,
      n,
      excludedNonCount,
      predictorCount: uniquePredictors.length,
      coefficientCount,
      converged: false,
      iterations: 0,
      logLikelihood: null,
      nullLogLikelihood: null,
      likelihoodRatioChiSquare: null,
      dfModel,
      pValue: null,
      deviance: null,
      aic: null,
      bic: null,
      pearsonDispersion: null,
      dispersionAlpha: null,
      meanObserved: meanOf(y),
      meanFitted: null,
      observedZeroRate: y.filter((value) => value === 0).length / n,
      expectedZeroRate: null,
      coefficients: [],
      warning: null,
      issue: "The model matrix is singular or could not be estimated. Remove redundant predictors or empty categorical levels.",
    };
  }

  const nullDesign = y.map(() => [1]);
  const nullFit = fitCountRegressionIrls(nullDesign, y, offset, family, fit.alpha);
  const logLikelihood = countRegressionLogLikelihood(family, y, fit.mu, fit.alpha);
  const nullLogLikelihood = nullFit ? countRegressionLogLikelihood(family, y, nullFit.mu, nullFit.alpha) : null;
  const likelihoodRatioChiSquare = logLikelihood !== null && nullLogLikelihood !== null
    ? Math.max(0, 2 * (logLikelihood - nullLogLikelihood))
    : null;
  const modelPValue = likelihoodRatioChiSquare !== null && dfModel > 0
    ? chiSquareSurvivalProbability(likelihoodRatioChiSquare, dfModel)
    : null;
  const deviance = countRegressionDeviance(family, y, fit.mu, fit.alpha);
  const parameterCount = coefficientCount + (family === "negative_binomial" ? 1 : 0);
  const aic = logLikelihood === null ? null : 2 * parameterCount - 2 * logLikelihood;
  const bic = logLikelihood === null ? null : Math.log(n) * parameterCount - 2 * logLikelihood;
  const dfResidual = n - coefficientCount;
  const pearson = y.reduce((sum, observed, index) => {
    const fitted = fit.mu[index];
    const variance = family === "negative_binomial"
      ? fitted + fit.alpha * fitted * fitted
      : fitted;
    return sum + ((observed - fitted) ** 2) / Math.max(1e-12, variance);
  }, 0);
  const pearsonDispersion = dfResidual > 0 ? pearson / dfResidual : null;

  const columnMetadata: Array<{
    term: string;
    label: string;
    predictor: string | null;
    predictorLabel: string | null;
    kind: CountRegressionCoefficient["kind"];
    level: string | null;
    referenceLevel: string | null;
  }> = [{
    term: "(Intercept)",
    label: "Intercept",
    predictor: null,
    predictorLabel: null,
    kind: "intercept",
    level: null,
    referenceLevel: null,
  }];
  for (const encoding of encodings) {
    for (const column of encoding.columns) {
      columnMetadata.push({
        term: column.term,
        label: column.label,
        predictor: encoding.variable.name,
        predictorLabel: encoding.variable.label,
        kind: encoding.kind,
        level: column.level,
        referenceLevel: encoding.referenceLevel,
      });
    }
  }

  const zCritical = 1.959963984540054;
  const coefficients: CountRegressionCoefficient[] = fit.beta.map((estimate, index) => {
    const variance = fit.covariance?.[index]?.[index];
    const se = variance !== undefined && Number.isFinite(variance) && variance >= 0 ? Math.sqrt(Math.max(0, variance)) : null;
    const z = se === null ? null : se === 0 ? (estimate === 0 ? 0 : Math.sign(estimate) * Number.POSITIVE_INFINITY) : estimate / se;
    const pValue = z === null ? null : Number.isFinite(z) ? 2 * (1 - normalCdf(Math.abs(z))) : 0;
    const low = se === null ? null : estimate - zCritical * se;
    const high = se === null ? null : estimate + zCritical * se;
    return {
      ...columnMetadata[index],
      b: estimate,
      se,
      z,
      pValue,
      incidenceRateRatio: safeExp(estimate),
      ci95Low: safeExp(low),
      ci95High: safeExp(high),
    };
  });

  const meanObserved = meanOf(y);
  const meanFitted = meanOf(fit.mu);
  const observedZeroRate = y.filter((value) => value === 0).length / n;
  const expectedZeroRate = fit.mu.reduce((sum, fitted) => {
    if (family === "negative_binomial" && fit.alpha > 1e-10) {
      const size = 1 / fit.alpha;
      return sum + (size / (size + fitted)) ** size;
    }
    return sum + Math.exp(-fitted);
  }, 0) / n;

  const warnings: string[] = [];
  if (!fit.converged) warnings.push("The IRLS solver did not meet the strict convergence tolerance; review the model specification.");
  if (excludedNonCount > 0) warnings.push(`${excludedNonCount} row${excludedNonCount === 1 ? "" : "s"} with negative or non-integer outcome values were excluded because count regression requires non-negative integer counts.`);
  if (family === "poisson" && pearsonDispersion !== null && pearsonDispersion > 1.5) {
    warnings.push(`Pearson dispersion is ${pearsonDispersion.toFixed(2)}, suggesting overdispersion relative to a Poisson model. Compare the negative-binomial family and inspect the data-generating process.`);
  }
  if (family === "poisson" && pearsonDispersion !== null && pearsonDispersion < 0.6) {
    warnings.push(`Pearson dispersion is ${pearsonDispersion.toFixed(2)}, suggesting underdispersion relative to the Poisson variance assumption.`);
  }
  if (family === "negative_binomial" && fit.alpha < 1e-5) {
    warnings.push("The estimated negative-binomial dispersion parameter is near zero, so the fitted variance is close to Poisson.");
  }
  if (observedZeroRate - expectedZeroRate > 0.12) {
    warnings.push("The observed zero-count rate is notably higher than the fitted model expects. Consider whether structural zeros or another data-generating process are plausible.");
  }

  return {
    ...base,
    predictors: predictorMetadata,
    n,
    excludedNonCount,
    predictorCount: uniquePredictors.length,
    coefficientCount,
    converged: fit.converged,
    iterations: fit.iterations,
    logLikelihood,
    nullLogLikelihood,
    likelihoodRatioChiSquare,
    dfModel,
    pValue: modelPValue,
    deviance,
    aic,
    bic,
    pearsonDispersion,
    dispersionAlpha: family === "negative_binomial" ? fit.alpha : null,
    meanObserved,
    meanFitted,
    observedZeroRate,
    expectedZeroRate,
    coefficients,
    warning: warnings.length > 0 ? warnings.join(" ") : null,
    issue: null,
  };
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
        if (!range || range.min === null || range.max === null) {
          complete = false;
          break;
        }
        values.push(range.min + range.max - raw);
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


function factorClamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function factorIdentity(size: number): number[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, column) => (row === column ? 1 : 0))
  );
}

function factorJacobiEigenDecomposition(matrix: number[][]) {
  const n = matrix.length;
  if (n === 0 || matrix.some((row) => row.length !== n)) {
    return { values: [] as number[], vectors: [] as number[][], converged: false };
  }

  const a = matrix.map((row) => [...row]);
  const vectors = factorIdentity(n);
  const maxIterations = Math.max(80, n * n * 80);
  let converged = false;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let p = 0;
    let q = 1;
    let largest = 0;

    for (let row = 0; row < n; row += 1) {
      for (let column = row + 1; column < n; column += 1) {
        const magnitude = Math.abs(a[row][column]);
        if (magnitude > largest) {
          largest = magnitude;
          p = row;
          q = column;
        }
      }
    }

    if (largest < 1e-11) {
      converged = true;
      break;
    }

    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    const angle = 0.5 * Math.atan2(2 * apq, aqq - app);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);

    for (let index = 0; index < n; index += 1) {
      if (index === p || index === q) continue;
      const aip = a[index][p];
      const aiq = a[index][q];
      const nextP = cosine * aip - sine * aiq;
      const nextQ = sine * aip + cosine * aiq;
      a[index][p] = nextP;
      a[p][index] = nextP;
      a[index][q] = nextQ;
      a[q][index] = nextQ;
    }

    a[p][p] = cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
    a[q][q] = sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
    a[p][q] = 0;
    a[q][p] = 0;

    for (let row = 0; row < n; row += 1) {
      const vip = vectors[row][p];
      const viq = vectors[row][q];
      vectors[row][p] = cosine * vip - sine * viq;
      vectors[row][q] = sine * vip + cosine * viq;
    }
  }

  const order = Array.from({ length: n }, (_, index) => index).sort(
    (left, right) => a[right][right] - a[left][left]
  );

  return {
    values: order.map((index) => a[index][index]),
    vectors: Array.from({ length: n }, (_, row) => order.map((index) => vectors[row][index])),
    converged,
  };
}

function factorCorrelationMatrix(matrix: number[][]) {
  const itemCount = matrix[0]?.length ?? 0;
  const result = factorIdentity(itemCount);

  for (let left = 0; left < itemCount; left += 1) {
    const x = matrix.map((row) => row[left]);
    for (let right = left + 1; right < itemCount; right += 1) {
      const y = matrix.map((row) => row[right]);
      const correlation = pearsonCoefficient(x, y);
      if (correlation === null || !Number.isFinite(correlation)) return null;
      result[left][right] = correlation;
      result[right][left] = correlation;
    }
  }

  return result;
}

function factorKmo(correlation: number[][]) {
  const inverse = invertMatrix(correlation);
  const itemCount = correlation.length;
  if (!inverse || itemCount < 2) {
    return { overall: null as number | null, perItem: Array(itemCount).fill(null) as Array<number | null> };
  }

  const r2ByItem = Array(itemCount).fill(0);
  const p2ByItem = Array(itemCount).fill(0);
  let totalR2 = 0;
  let totalP2 = 0;

  for (let left = 0; left < itemCount; left += 1) {
    for (let right = left + 1; right < itemCount; right += 1) {
      const r2 = correlation[left][right] ** 2;
      const denominator = Math.sqrt(Math.abs(inverse[left][left] * inverse[right][right]));
      if (!(denominator > 0)) continue;
      const partial = -inverse[left][right] / denominator;
      const p2 = partial ** 2;

      totalR2 += r2;
      totalP2 += p2;
      r2ByItem[left] += r2;
      r2ByItem[right] += r2;
      p2ByItem[left] += p2;
      p2ByItem[right] += p2;
    }
  }

  const overallDenominator = totalR2 + totalP2;
  const overall = overallDenominator > 0 ? totalR2 / overallDenominator : null;
  const perItem = r2ByItem.map((r2, index) => {
    const denominator = r2 + p2ByItem[index];
    return denominator > 0 ? r2 / denominator : null;
  });

  return { overall, perItem };
}

function factorRotateVarimax(loadings: number[][]) {
  const itemCount = loadings.length;
  const factorCount = loadings[0]?.length ?? 0;
  if (itemCount === 0 || factorCount <= 1) return loadings.map((row) => [...row]);

  const communalities = loadings.map((row) =>
    Math.sqrt(Math.max(1e-12, row.reduce((sum, value) => sum + value * value, 0)))
  );
  const rotated = loadings.map((row, index) => row.map((value) => value / communalities[index]));

  for (let sweep = 0; sweep < 80; sweep += 1) {
    let maximumAngle = 0;

    for (let left = 0; left < factorCount - 1; left += 1) {
      for (let right = left + 1; right < factorCount; right += 1) {
        let sumU = 0;
        let sumV = 0;
        let sumU2MinusV2 = 0;
        let sum2UV = 0;

        for (let row = 0; row < itemCount; row += 1) {
          const x = rotated[row][left];
          const y = rotated[row][right];
          const u = x * x - y * y;
          const v = 2 * x * y;
          sumU += u;
          sumV += v;
          sumU2MinusV2 += u * u - v * v;
          sum2UV += 2 * u * v;
        }

        const numerator = sum2UV - (2 * sumU * sumV) / itemCount;
        const denominator = sumU2MinusV2 - (sumU * sumU - sumV * sumV) / itemCount;
        const angle = 0.25 * Math.atan2(numerator, denominator);
        maximumAngle = Math.max(maximumAngle, Math.abs(angle));

        if (Math.abs(angle) < 1e-12) continue;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);

        for (let row = 0; row < itemCount; row += 1) {
          const x = rotated[row][left];
          const y = rotated[row][right];
          rotated[row][left] = cosine * x + sine * y;
          rotated[row][right] = -sine * x + cosine * y;
        }
      }
    }

    if (maximumAngle < 1e-7) break;
  }

  return rotated.map((row, index) => row.map((value) => value * communalities[index]));
}

function factorRotatePromax(loadings: number[][], power = 4) {
  const orthogonal = factorRotateVarimax(loadings);
  const itemCount = orthogonal.length;
  const factorCount = orthogonal[0]?.length ?? 0;

  if (itemCount === 0 || factorCount <= 1) {
    return { pattern: orthogonal, phi: null as number[][] | null };
  }

  const target = orthogonal.map((row) =>
    row.map((value) => Math.sign(value) * Math.abs(value) ** power)
  );
  const transposed = transposeMatrix(orthogonal);
  const cross = multiplyMatrices(transposed, orthogonal);
  const inverseCross = invertMatrix(cross);
  if (!inverseCross) {
    return { pattern: orthogonal, phi: null as number[][] | null };
  }

  const coefficients = multiplyMatrices(
    multiplyMatrices(inverseCross, transposed),
    target
  );
  if (coefficients.length !== factorCount) {
    return { pattern: orthogonal, phi: null as number[][] | null };
  }

  for (let column = 0; column < factorCount; column += 1) {
    const norm = Math.sqrt(
      coefficients.reduce((sum, row) => sum + (row[column] ?? 0) ** 2, 0)
    );
    if (norm > 0) {
      for (let row = 0; row < factorCount; row += 1) {
        coefficients[row][column] /= norm;
      }
    }
  }

  const pattern = multiplyMatrices(orthogonal, coefficients);
  const coefficientCross = multiplyMatrices(transposeMatrix(coefficients), coefficients);
  const phiRaw = invertMatrix(coefficientCross);
  if (!phiRaw) return { pattern, phi: null as number[][] | null };

  const phi = phiRaw.map((row, i) =>
    row.map((value, j) => {
      const denominator = Math.sqrt(Math.abs(phiRaw[i][i] * phiRaw[j][j]));
      return denominator > 0 ? factorClamp(value / denominator, -1, 1) : 0;
    })
  );

  return { pattern, phi };
}

function factorStrongestLoading(loadings: number[]) {
  if (loadings.length === 0) return { factor: null as number | null, loading: null as number | null };
  let strongestFactor = 0;
  let strongestLoading = loadings[0];
  for (let index = 1; index < loadings.length; index += 1) {
    if (Math.abs(loadings[index]) > Math.abs(strongestLoading)) {
      strongestFactor = index;
      strongestLoading = loadings[index];
    }
  }
  return { factor: strongestFactor + 1, loading: strongestLoading };
}

export function computeExploratoryFactorAnalysis(
  rows: AnalysisRow[],
  variables: AnalysisVariable[],
  options: {
    factorCount?: number;
    extraction?: FactorExtractionMethod;
    rotation?: FactorRotationMethod;
  } = {}
): ExploratoryFactorAnalysisResult {
  const numericVariables = variables.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );
  const extraction = options.extraction ?? "principal_axis";
  const rotation = options.rotation ?? "promax";
  const requestedFactorCount = Math.max(1, Math.floor(options.factorCount ?? 1));

  const base: ExploratoryFactorAnalysisResult = {
    itemCount: numericVariables.length,
    n: 0,
    factorCount: requestedFactorCount,
    extraction,
    rotation,
    kmoOverall: null,
    bartlettChiSquare: null,
    bartlettDf: null,
    bartlettPValue: null,
    determinant: null,
    eigenvalues: [],
    recommendedFactorCount: 1,
    variance: [],
    items: numericVariables.map((variable) => ({
      variable: variable.name,
      label: variable.label,
      communality: null,
      uniqueness: null,
      msa: null,
      loadings: [],
      strongestFactor: null,
      strongestLoading: null,
    })),
    factorCorrelations: null,
    iterations: 0,
    converged: false,
    warning: null,
    issue: null,
  };

  if (numericVariables.length < 3) {
    return { ...base, issue: "Select at least three numeric items for exploratory factor analysis." };
  }

  const matrix: number[][] = [];
  for (const row of rows) {
    const values = numericVariables.map((variable) => toFiniteNumber(row[variable.name]));
    if (values.every((value): value is number => value !== null)) matrix.push(values);
  }

  const itemCount = numericVariables.length;
  const n = matrix.length;
  const maximumFactors = Math.max(1, itemCount - 1);
  const factorCount = Math.min(requestedFactorCount, maximumFactors);

  if (n < Math.max(5, itemCount + 1)) {
    return {
      ...base,
      n,
      factorCount,
      issue: `Factor analysis needs more complete rows than selected items. Complete N = ${n}; items = ${itemCount}.`,
    };
  }

  const correlation = factorCorrelationMatrix(matrix);
  if (!correlation) {
    return { ...base, n, factorCount, issue: "The item correlation matrix could not be estimated. Check constant or non-numeric items." };
  }

  const eigen = factorJacobiEigenDecomposition(correlation);
  if (!eigen.values.length) {
    return { ...base, n, factorCount, issue: "The item correlation matrix could not be decomposed." };
  }

  const eigenvalues = eigen.values.map((value) => (Math.abs(value) < 1e-12 ? 0 : value));
  const recommendedFactorCount = Math.max(
    1,
    Math.min(
      maximumFactors,
      eigenvalues.filter((value) => value > 1 + 1e-8).length || 1
    )
  );

  const determinant = matrixDeterminant(correlation);
  const bartlettDf = (itemCount * (itemCount - 1)) / 2;
  const bartlettChiSquare =
    determinant !== null && determinant > 0
      ? -(n - 1 - (2 * itemCount + 5) / 6) * Math.log(determinant)
      : null;
  const bartlettPValue =
    bartlettChiSquare !== null && bartlettChiSquare >= 0
      ? chiSquareSurvivalProbability(bartlettChiSquare, bartlettDf)
      : null;

  const kmo = factorKmo(correlation);

  let unrotatedLoadings: number[][] = [];
  let communalities = Array(itemCount).fill(0);
  let iterations = 1;
  let converged = true;
  let extractionEigenvalues = eigenvalues;

  if (extraction === "principal_components") {
    unrotatedLoadings = Array.from({ length: itemCount }, (_, row) =>
      Array.from({ length: factorCount }, (_, factor) => {
        const eigenvalue = Math.max(0, eigen.values[factor] ?? 0);
        return (eigen.vectors[row]?.[factor] ?? 0) * Math.sqrt(eigenvalue);
      })
    );
    communalities = unrotatedLoadings.map((row) =>
      factorClamp(row.reduce((sum, value) => sum + value * value, 0), 0, 1)
    );
  } else {
    const inverseCorrelation = invertMatrix(correlation);
    let currentCommunalities = Array.from({ length: itemCount }, (_, index) => {
      if (inverseCorrelation && inverseCorrelation[index]?.[index] > 1e-12) {
        return factorClamp(1 - 1 / inverseCorrelation[index][index], 0.05, 0.99);
      }
      const largestSquaredCorrelation = correlation[index].reduce(
        (maximum, value, other) =>
          other === index ? maximum : Math.max(maximum, value * value),
        0
      );
      return factorClamp(largestSquaredCorrelation, 0.05, 0.95);
    });

    converged = false;
    for (iterations = 1; iterations <= 100; iterations += 1) {
      const reduced = correlation.map((row, rowIndex) =>
        row.map((value, columnIndex) =>
          rowIndex === columnIndex ? currentCommunalities[rowIndex] : value
        )
      );
      const reducedEigen = factorJacobiEigenDecomposition(reduced);
      extractionEigenvalues = reducedEigen.values;
      if (!reducedEigen.values.length) break;

      unrotatedLoadings = Array.from({ length: itemCount }, (_, row) =>
        Array.from({ length: factorCount }, (_, factor) => {
          const eigenvalue = Math.max(0, reducedEigen.values[factor] ?? 0);
          return (reducedEigen.vectors[row]?.[factor] ?? 0) * Math.sqrt(eigenvalue);
        })
      );

      const nextCommunalities = unrotatedLoadings.map((row) =>
        factorClamp(row.reduce((sum, value) => sum + value * value, 0), 0.001, 0.999)
      );
      const change = Math.max(
        ...nextCommunalities.map((value, index) => Math.abs(value - currentCommunalities[index]))
      );
      currentCommunalities = nextCommunalities;
      if (change < 1e-6) {
        converged = true;
        break;
      }
    }

    communalities = currentCommunalities;
  }

  if (unrotatedLoadings.length !== itemCount || unrotatedLoadings.some((row) => row.length !== factorCount)) {
    return {
      ...base,
      n,
      factorCount,
      eigenvalues,
      recommendedFactorCount,
      kmoOverall: kmo.overall,
      bartlettChiSquare,
      bartlettDf,
      bartlettPValue,
      determinant,
      issue: "The requested factor solution could not be extracted. Try fewer factors or remove redundant items.",
    };
  }

  let rotatedLoadings = unrotatedLoadings.map((row) => [...row]);
  let factorCorrelations: number[][] | null = null;

  if (rotation === "varimax") {
    rotatedLoadings = factorRotateVarimax(unrotatedLoadings);
  } else if (rotation === "promax") {
    const rotated = factorRotatePromax(unrotatedLoadings);
    rotatedLoadings = rotated.pattern;
    factorCorrelations = rotated.phi;
  }

  const items: ExploratoryFactorItemResult[] = numericVariables.map((variable, index) => {
    const loadings = rotatedLoadings[index] ?? [];
    const strongest = factorStrongestLoading(loadings);
    return {
      variable: variable.name,
      label: variable.label,
      communality: communalities[index] ?? null,
      uniqueness:
        communalities[index] === undefined ? null : factorClamp(1 - communalities[index], 0, 1),
      msa: kmo.perItem[index] ?? null,
      loadings,
      strongestFactor: strongest.factor,
      strongestLoading: strongest.loading,
    };
  });

  let cumulative = 0;
  const variance: ExploratoryFactorVarianceRow[] = Array.from({ length: factorCount }, (_, factor) => {
    const eigenvalue = Math.max(0, extractionEigenvalues[factor] ?? 0);
    const proportion = eigenvalue / itemCount;
    cumulative += proportion;
    const rotatedSsLoading = rotatedLoadings.reduce(
      (sum, row) => sum + (row[factor] ?? 0) ** 2,
      0
    );
    return {
      factor: factor + 1,
      eigenvalue,
      proportion,
      cumulative,
      rotatedSsLoading,
    };
  });

  const weakMsa = items.filter((item) => item.msa !== null && item.msa < 0.5).length;
  const lowKmo = kmo.overall !== null && kmo.overall < 0.6;
  const lowN = n < itemCount * 5;
  const warnings: string[] = [];
  if (!converged && extraction === "principal_axis") warnings.push("Principal-axis communalities did not fully converge.");
  if (weakMsa > 0) warnings.push(`${weakMsa} item${weakMsa === 1 ? " has" : "s have"} MSA below .50.`);
  if (lowKmo) warnings.push("Overall KMO is below .60; the factor solution may be weak.");
  if (lowN) warnings.push("There are fewer than five complete observations per selected item; review stability before interpreting the solution.");
  if (determinant !== null && determinant < 1e-8) warnings.push("The correlation matrix is close to singular; inspect redundant or highly correlated items.");

  return {
    itemCount,
    n,
    factorCount,
    extraction,
    rotation,
    kmoOverall: kmo.overall,
    bartlettChiSquare,
    bartlettDf,
    bartlettPValue,
    determinant,
    eigenvalues,
    recommendedFactorCount,
    variance,
    items,
    factorCorrelations,
    iterations,
    converged,
    warning: warnings.length ? warnings.join(" ") : null,
    issue: null,
  };
}

export function computeMannWhitneyU(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  groupVariable: AnalysisVariable,
  groupA: string,
  groupB: string
): MannWhitneyResult {
  const valuesA: number[] = [];
  const valuesB: number[] = [];

  for (const row of rows) {
    if (isMissingValue(row[groupVariable.name])) continue;
    const group = asStableText(row[groupVariable.name]);
    if (group !== groupA && group !== groupB) continue;
    const value = toFiniteNumber(row[outcome.name]);
    if (value === null) continue;
    if (group === groupA) valuesA.push(value);
    else valuesB.push(value);
  }

  const base: MannWhitneyResult = {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    groupVariable: groupVariable.name,
    groupVariableLabel: groupVariable.label,
    groupA,
    groupB,
    nA: valuesA.length,
    nB: valuesB.length,
    medianA: quantile(valuesA, 0.5),
    medianB: quantile(valuesB, 0.5),
    meanRankA: null,
    meanRankB: null,
    uA: null,
    uB: null,
    u: null,
    z: null,
    pValue: null,
    rankBiserial: null,
    issue: null,
  };

  if (valuesA.length === 0 || valuesB.length === 0) {
    return { ...base, issue: "Both selected groups need at least one valid outcome value." };
  }

  const combined = [...valuesA, ...valuesB];
  const ranks = averageRanks(combined);
  const rankSumA = ranks.slice(0, valuesA.length).reduce((sum, rank) => sum + rank, 0);
  const rankSumB = ranks.slice(valuesA.length).reduce((sum, rank) => sum + rank, 0);
  const nA = valuesA.length;
  const nB = valuesB.length;
  const totalN = nA + nB;
  const uA = rankSumA - (nA * (nA + 1)) / 2;
  const uB = rankSumB - (nB * (nB + 1)) / 2;
  const u = Math.min(uA, uB);
  const tieSum = tieGroupSizes(combined).reduce((sum, t) => sum + t ** 3 - t, 0);
  const variance = totalN > 1
    ? (nA * nB / 12) * ((totalN + 1) - tieSum / (totalN * (totalN - 1)))
    : 0;
  const meanU = (nA * nB) / 2;
  const difference = uA - meanU;
  const continuity = difference === 0 ? 0 : 0.5 * Math.sign(difference);
  const z = variance > 0 ? (difference - continuity) / Math.sqrt(variance) : 0;
  const pValue = variance > 0 ? twoSidedNormalPValue(z) : 1;
  const rankBiserial = nA * nB > 0 ? (2 * uA) / (nA * nB) - 1 : null;

  return {
    ...base,
    meanRankA: rankSumA / nA,
    meanRankB: rankSumB / nB,
    uA,
    uB,
    u,
    z,
    pValue,
    rankBiserial,
  };
}

export function computeWilcoxonSignedRank(
  rows: AnalysisRow[],
  variableA: AnalysisVariable,
  variableB: AnalysisVariable
): WilcoxonSignedRankResult {
  const differences: number[] = [];
  for (const row of rows) {
    const a = toFiniteNumber(row[variableA.name]);
    const b = toFiniteNumber(row[variableB.name]);
    if (a === null || b === null) continue;
    differences.push(a - b);
  }

  const nonZero = differences.filter((difference) => difference !== 0);
  const base: WilcoxonSignedRankResult = {
    variableA: variableA.name,
    variableALabel: variableA.label,
    variableB: variableB.name,
    variableBLabel: variableB.label,
    completePairs: differences.length,
    nonZeroPairs: nonZero.length,
    zeroDifferences: differences.length - nonZero.length,
    medianDifference: quantile(differences, 0.5),
    wPlus: null,
    wMinus: null,
    w: null,
    z: null,
    pValue: null,
    rankBiserial: null,
    issue: null,
  };

  if (differences.length === 0) {
    return { ...base, issue: "No complete paired observations are available for the selected variables." };
  }

  if (nonZero.length === 0) {
    return { ...base, wPlus: 0, wMinus: 0, w: 0, z: 0, pValue: 1, rankBiserial: 0 };
  }

  const absolute = nonZero.map((difference) => Math.abs(difference));
  const ranks = averageRanks(absolute);
  let wPlus = 0;
  let wMinus = 0;
  nonZero.forEach((difference, index) => {
    if (difference > 0) wPlus += ranks[index];
    else wMinus += ranks[index];
  });
  const totalRank = wPlus + wMinus;
  const meanW = totalRank / 2;
  const variance = ranks.reduce((sum, rank) => sum + rank * rank, 0) / 4;
  const differenceFromMean = wPlus - meanW;
  const continuity = differenceFromMean === 0 ? 0 : 0.5 * Math.sign(differenceFromMean);
  const z = variance > 0 ? (differenceFromMean - continuity) / Math.sqrt(variance) : 0;
  const pValue = variance > 0 ? twoSidedNormalPValue(z) : 1;
  const rankBiserial = totalRank > 0 ? (wPlus - wMinus) / totalRank : 0;

  return {
    ...base,
    wPlus,
    wMinus,
    w: Math.min(wPlus, wMinus),
    z,
    pValue,
    rankBiserial,
  };
}

export function computeKruskalWallis(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  factor: AnalysisVariable
): KruskalWallisResult {
  const entries: Array<{ group: string; value: number }> = [];
  for (const row of rows) {
    if (isMissingValue(row[factor.name])) continue;
    const value = toFiniteNumber(row[outcome.name]);
    if (value === null) continue;
    entries.push({ group: asStableText(row[factor.name]), value });
  }

  const grouped = new Map<string, number[]>();
  for (const entry of entries) {
    if (!grouped.has(entry.group)) grouped.set(entry.group, []);
    grouped.get(entry.group)!.push(entry.value);
  }
  const groupNames = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));
  const totalN = entries.length;
  const base: KruskalWallisResult = {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    factor: factor.name,
    factorLabel: factor.label,
    groups: [],
    totalN,
    h: null,
    df: groupNames.length >= 2 ? groupNames.length - 1 : null,
    pValue: null,
    epsilonSquared: null,
    tieCorrection: null,
    pairwise: [],
    issue: null,
  };

  if (groupNames.length < 2 || totalN < 2) {
    return { ...base, issue: "Kruskal–Wallis needs at least two non-empty groups." };
  }

  const values = entries.map((entry) => entry.value);
  const ranks = averageRanks(values);
  const rankSums = new Map<string, number>();
  const counts = new Map<string, number>();
  entries.forEach((entry, index) => {
    rankSums.set(entry.group, (rankSums.get(entry.group) || 0) + ranks[index]);
    counts.set(entry.group, (counts.get(entry.group) || 0) + 1);
  });
  const tieSum = tieGroupSizes(values).reduce((sum, t) => sum + t ** 3 - t, 0);
  const tieCorrection = totalN > 1 ? 1 - tieSum / (totalN ** 3 - totalN) : 1;
  const rawH = (12 / (totalN * (totalN + 1))) * groupNames.reduce((sum, group) => {
    const rankSum = rankSums.get(group) || 0;
    const n = counts.get(group) || 0;
    return n > 0 ? sum + (rankSum * rankSum) / n : sum;
  }, 0) - 3 * (totalN + 1);
  const h = tieCorrection > 0 ? rawH / tieCorrection : null;
  const df = groupNames.length - 1;
  const pValue = h === null ? null : chiSquareSurvivalProbability(h, df);
  const epsilonSquared = h !== null && totalN > groupNames.length
    ? Math.max(0, Math.min(1, (h - groupNames.length + 1) / (totalN - groupNames.length)))
    : null;

  const groups: NonParametricGroupSummary[] = groupNames.map((group) => {
    const groupValues = grouped.get(group) || [];
    const n = groupValues.length;
    return {
      value: group,
      label: group,
      n,
      median: quantile(groupValues, 0.5),
      meanRank: n > 0 ? (rankSums.get(group) || 0) / n : null,
    };
  });

  const varianceBase = totalN > 1
    ? (totalN * (totalN + 1)) / 12 - tieSum / (12 * (totalN - 1))
    : 0;
  const rawPairwise: KruskalWallisPairwise[] = [];
  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) {
      const a = groups[i];
      const b = groups[j];
      const difference = a.meanRank !== null && b.meanRank !== null ? a.meanRank - b.meanRank : null;
      const se = varianceBase > 0 && a.n > 0 && b.n > 0
        ? Math.sqrt(varianceBase * (1 / a.n + 1 / b.n))
        : null;
      const z = difference !== null && se && se > 0 ? difference / se : null;
      rawPairwise.push({
        groupA: a.value,
        groupB: b.value,
        meanRankDifference: difference,
        z,
        pValue: twoSidedNormalPValue(z),
        pAdjusted: null,
      });
    }
  }
  const adjusted = holmAdjustedPValues(rawPairwise.map((comparison) => comparison.pValue));
  const pairwise = rawPairwise.map((comparison, index) => ({ ...comparison, pAdjusted: adjusted[index] }));

  return {
    ...base,
    groups,
    h,
    df,
    pValue,
    epsilonSquared,
    tieCorrection,
    pairwise,
    issue: h === null ? "The rank variance is degenerate after tie correction." : null,
  };
}

export function computeFriedmanTest(
  rows: AnalysisRow[],
  variables: AnalysisVariable[]
): FriedmanResult {
  const usable = variables.filter(
    (variable) => variable.level === "continuous" || variable.level === "ordinal"
  );
  const completeRows = rows.filter((row) =>
    usable.every((variable) => toFiniteNumber(row[variable.name]) !== null)
  );
  const matrix = completeRows.map((row) =>
    usable.map((variable) => toFiniteNumber(row[variable.name]) as number)
  );
  const n = matrix.length;
  const k = usable.length;
  const base: FriedmanResult = {
    conditions: [],
    completeCases: n,
    conditionCount: k,
    chiSquare: null,
    df: k >= 2 ? k - 1 : null,
    pValue: null,
    kendallW: null,
    tieCorrection: null,
    pairwise: [],
    issue: null,
  };

  if (k < 3) return { ...base, issue: "Friedman analysis needs at least three repeated-condition variables." };
  if (n < 2) return { ...base, issue: "Friedman analysis needs at least two complete participants." };

  const rankedRows = matrix.map((row) => averageRanks(row));
  const rankSums = Array.from({ length: k }, (_, column) =>
    rankedRows.reduce((sum, row) => sum + row[column], 0)
  );
  const rawQ = (12 / (n * k * (k + 1))) * rankSums.reduce((sum, rankSum) => sum + rankSum * rankSum, 0) - 3 * n * (k + 1);
  const tieSum = matrix.reduce(
    (outer, row) => outer + tieGroupSizes(row).reduce((inner, t) => inner + t ** 3 - t, 0),
    0
  );
  const denominator = n * k * (k * k - 1);
  const tieCorrection = denominator > 0 ? 1 - tieSum / denominator : 1;
  const chiSquare = tieCorrection > 0 ? rawQ / tieCorrection : null;
  const df = k - 1;
  const pValue = chiSquare === null ? null : chiSquareSurvivalProbability(chiSquare, df);
  const kendallW = chiSquare !== null && n > 0 && k > 1
    ? Math.max(0, Math.min(1, chiSquare / (n * (k - 1))))
    : null;

  const conditions: FriedmanConditionSummary[] = usable.map((variable, column) => ({
    variable: variable.name,
    label: variable.label,
    n,
    median: quantile(matrix.map((row) => row[column]), 0.5),
    meanRank: rankSums[column] / n,
  }));

  const rawPairwise: FriedmanPairwise[] = [];
  for (let i = 0; i < usable.length; i += 1) {
    for (let j = i + 1; j < usable.length; j += 1) {
      const pair = computeWilcoxonSignedRank(completeRows, usable[i], usable[j]);
      rawPairwise.push({
        variableA: usable[i].name,
        variableALabel: usable[i].label,
        variableB: usable[j].name,
        variableBLabel: usable[j].label,
        n: pair.nonZeroPairs,
        w: pair.w,
        z: pair.z,
        pValue: pair.pValue,
        pAdjusted: null,
        rankBiserial: pair.rankBiserial,
      });
    }
  }
  const adjusted = holmAdjustedPValues(rawPairwise.map((comparison) => comparison.pValue));
  const pairwise = rawPairwise.map((comparison, index) => ({ ...comparison, pAdjusted: adjusted[index] }));

  return {
    ...base,
    conditions,
    chiSquare,
    df,
    pValue,
    kendallW,
    tieCorrection,
    pairwise,
    issue: chiSquare === null ? "The repeated-condition ranks are degenerate after tie correction." : null,
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

/* =========================================================
   ASSUMPTIONS & DIAGNOSTICS
   ========================================================= */

export type HistogramBin = {
  start: number;
  end: number;
  count: number;
};

export type QQPoint = {
  expected: number;
  observed: number;
};

export type DistributionDiagnosticsResult = {
  variable: string;
  label: string;
  n: number;
  missing: number;
  mean: number | null;
  sd: number | null;
  skewness: number | null;
  kurtosisExcess: number | null;
  jarqueBera: number | null;
  jarqueBeraPValue: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  lowerFence: number | null;
  upperFence: number | null;
  extremeLowerFence: number | null;
  extremeUpperFence: number | null;
  iqrOutlierCount: number;
  extremeOutlierCount: number;
  zOutlierCount: number;
  histogram: HistogramBin[];
  qq: QQPoint[];
  issue: string | null;
};

export type VarianceTestCenter = "median" | "mean";

export type VarianceGroupSummary = {
  value: string;
  label: string;
  n: number;
  center: number | null;
  meanAbsoluteDeviation: number | null;
};

export type VarianceHomogeneityResult = {
  outcome: string;
  outcomeLabel: string;
  factor: string;
  factorLabel: string;
  center: VarianceTestCenter;
  totalN: number;
  groupCount: number;
  f: number | null;
  df1: number | null;
  df2: number | null;
  pValue: number | null;
  groups: VarianceGroupSummary[];
  issue: string | null;
};

function inverseNormalCdf(probability: number) {
  const p = Math.max(1e-12, Math.min(1 - 1e-12, probability));
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    return (
      (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }

  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

function momentSkewnessAndKurtosis(values: number[]) {
  if (values.length < 2) return { skewness: null, kurtosisExcess: null };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const centered = values.map((value) => value - mean);
  const m2 = centered.reduce((sum, value) => sum + value ** 2, 0) / values.length;
  if (!(m2 > 0)) return { skewness: 0, kurtosisExcess: 0 };
  const m3 = centered.reduce((sum, value) => sum + value ** 3, 0) / values.length;
  const m4 = centered.reduce((sum, value) => sum + value ** 4, 0) / values.length;
  return {
    skewness: m3 / Math.pow(m2, 1.5),
    kurtosisExcess: m4 / (m2 * m2) - 3,
  };
}

function buildHistogram(values: number[]) {
  if (values.length === 0) return [] as HistogramBin[];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) return [{ start: minimum, end: maximum, count: values.length }];

  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q1 !== null && q3 !== null ? q3 - q1 : null;
  const fdWidth = iqr !== null && iqr > 0 ? (2 * iqr) / Math.cbrt(values.length) : null;
  const sturges = Math.ceil(Math.log2(values.length) + 1);
  const rawCount = fdWidth && fdWidth > 0 ? Math.ceil((maximum - minimum) / fdWidth) : sturges;
  const binCount = Math.max(5, Math.min(24, rawCount || sturges || 5));
  const width = (maximum - minimum) / binCount;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    start: minimum + index * width,
    end: index === binCount - 1 ? maximum : minimum + (index + 1) * width,
    count: 0,
  }));

  for (const value of values) {
    const index = value === maximum
      ? binCount - 1
      : Math.max(0, Math.min(binCount - 1, Math.floor((value - minimum) / width)));
    bins[index].count += 1;
  }

  return bins;
}

function buildQQ(values: number[]) {
  const ordered = sorted(values);
  if (ordered.length === 0) return [] as QQPoint[];
  const limit = 240;
  const step = Math.max(1, Math.ceil(ordered.length / limit));
  const points: QQPoint[] = [];
  for (let index = 0; index < ordered.length; index += step) {
    const p = (index + 1 - 0.375) / (ordered.length + 0.25);
    points.push({ expected: inverseNormalCdf(p), observed: ordered[index] });
  }
  if (points.length && points[points.length - 1].observed !== ordered[ordered.length - 1]) {
    const index = ordered.length - 1;
    const p = (index + 1 - 0.375) / (ordered.length + 0.25);
    points.push({ expected: inverseNormalCdf(p), observed: ordered[index] });
  }
  return points;
}

export function computeDistributionDiagnostics(
  rows: AnalysisRow[],
  variable: AnalysisVariable
): DistributionDiagnosticsResult {
  const values = rows
    .map((row) => toFiniteNumber(row[variable.name]))
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const n = values.length;
  const mean = n ? values.reduce((sum, value) => sum + value, 0) / n : null;
  const variance = sampleVariance(values);
  const sd = variance === null ? null : Math.sqrt(variance);
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q1 !== null && q3 !== null ? q3 - q1 : null;
  const lowerFence = q1 !== null && iqr !== null ? q1 - 1.5 * iqr : null;
  const upperFence = q3 !== null && iqr !== null ? q3 + 1.5 * iqr : null;
  const extremeLowerFence = q1 !== null && iqr !== null ? q1 - 3 * iqr : null;
  const extremeUpperFence = q3 !== null && iqr !== null ? q3 + 3 * iqr : null;
  const moments = momentSkewnessAndKurtosis(values);
  const jarqueBera =
    n >= 8 && moments.skewness !== null && moments.kurtosisExcess !== null
      ? (n / 6) * (moments.skewness ** 2 + (moments.kurtosisExcess ** 2) / 4)
      : null;
  const jarqueBeraPValue = jarqueBera === null ? null : chiSquareSurvivalProbability(jarqueBera, 2);

  const iqrOutlierCount = lowerFence === null || upperFence === null
    ? 0
    : values.filter((value) => value < lowerFence || value > upperFence).length;
  const extremeOutlierCount = extremeLowerFence === null || extremeUpperFence === null
    ? 0
    : values.filter((value) => value < extremeLowerFence || value > extremeUpperFence).length;
  const zOutlierCount = mean === null || sd === null || sd <= 0
    ? 0
    : values.filter((value) => Math.abs((value - mean) / sd) > 3).length;

  let issue: string | null = null;
  if (n < 3) issue = "At least three numeric observations are needed for distribution diagnostics.";
  else if (sd === null || sd <= 0) issue = "The selected variable has no measurable variance.";

  return {
    variable: variable.name,
    label: variable.label,
    n,
    missing: rows.length - n,
    mean,
    sd,
    skewness: moments.skewness,
    kurtosisExcess: moments.kurtosisExcess,
    jarqueBera,
    jarqueBeraPValue,
    q1,
    q3,
    iqr,
    lowerFence,
    upperFence,
    extremeLowerFence,
    extremeUpperFence,
    iqrOutlierCount,
    extremeOutlierCount,
    zOutlierCount,
    histogram: buildHistogram(values),
    qq: buildQQ(values),
    issue,
  };
}

export function computeVarianceHomogeneity(
  rows: AnalysisRow[],
  outcome: AnalysisVariable,
  factor: AnalysisVariable,
  center: VarianceTestCenter = "median"
): VarianceHomogeneityResult {
  const grouped = new Map<string, number[]>();
  for (const row of rows) {
    const value = toFiniteNumber(row[outcome.name]);
    const rawGroup = row[factor.name];
    if (value === null || isMissingValue(rawGroup)) continue;
    const label = asStableText(rawGroup);
    const values = grouped.get(label) || [];
    values.push(value);
    grouped.set(label, values);
  }

  const groups = Array.from(grouped.entries())
    .filter(([, values]) => values.length >= 2)
    .map(([value, values]) => {
      const groupCenter = center === "median"
        ? quantile(values, 0.5)
        : values.reduce((sum, item) => sum + item, 0) / values.length;
      const deviations = groupCenter === null ? [] : values.map((item) => Math.abs(item - groupCenter));
      return {
        value,
        label: value,
        values,
        deviations,
        center: groupCenter,
        meanAbsoluteDeviation: deviations.length
          ? deviations.reduce((sum, item) => sum + item, 0) / deviations.length
          : null,
      };
    });

  const totalN = groups.reduce((sum, group) => sum + group.values.length, 0);
  const k = groups.length;
  const df1 = k >= 2 ? k - 1 : null;
  const df2 = k >= 2 && totalN > k ? totalN - k : null;
  let f: number | null = null;
  let pValue: number | null = null;
  let issue: string | null = null;

  if (k < 2) {
    issue = "The variance test needs at least two observed factor levels with two or more usable observations each.";
  } else if (df1 === null || df2 === null || df2 <= 0) {
    issue = "There are not enough residual degrees of freedom for the variance test.";
  } else {
    const grandMeanDeviation = groups.reduce(
      (sum, group) => sum + group.deviations.reduce((inner, item) => inner + item, 0),
      0
    ) / totalN;
    const between = groups.reduce(
      (sum, group) => sum + group.deviations.length * ((group.meanAbsoluteDeviation ?? 0) - grandMeanDeviation) ** 2,
      0
    );
    const within = groups.reduce(
      (sum, group) => sum + group.deviations.reduce(
        (inner, item) => inner + (item - (group.meanAbsoluteDeviation ?? 0)) ** 2,
        0
      ),
      0
    );
    if (within <= 0) {
      issue = "Within-group absolute deviations have no measurable variance.";
    } else {
      f = (between / df1) / (within / df2);
      pValue = fSurvivalProbability(f, df1, df2);
    }
  }

  return {
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    factor: factor.name,
    factorLabel: factor.label,
    center,
    totalN,
    groupCount: k,
    f,
    df1,
    df2,
    pValue,
    groups: groups.map((group) => ({
      value: group.value,
      label: group.label,
      n: group.values.length,
      center: group.center,
      meanAbsoluteDeviation: group.meanAbsoluteDeviation,
    })),
    issue,
  };
}

// -----------------------------------------------------------------------------
// PsyLattice-native cognitive analysis
// -----------------------------------------------------------------------------

export type CognitiveDataLevel = "trial" | "participant_summary" | "unknown";

export type CognitiveDetectedSchema = {
  dataLevel: CognitiveDataLevel;
  participantField: string | null;
  sessionField: string | null;
  taskField: string | null;
  paradigmField: string | null;
  conditionField: string | null;
  trialField: string | null;
  responseField: string | null;
  correctField: string | null;
  reactionTimeField: string | null;
};

export type CognitiveTaskOption = {
  value: string;
  label: string;
  paradigm: string;
  rowCount: number;
  participantCount: number;
};

export type CognitiveScreeningOptions = {
  task?: string;
  minRtMs?: number;
  maxRtMs?: number;
  correctRtOnly?: boolean;
  minScorableTrials?: number;
  minAccuracy?: number;
  maxOmissionRate?: number;
  maxRtExclusionRate?: number;
  referenceCondition?: string;
};

export type CognitiveConditionSummary = {
  condition: string;
  trials: number;
  scorableTrials: number;
  correctTrials: number;
  accuracy: number | null;
  omissions: number;
  omissionRate: number | null;
  rtCandidates: number;
  rtRetained: number;
  rtExcluded: number;
  rtExclusionRate: number | null;
  meanRtMs: number | null;
  medianRtMs: number | null;
  sdRtMs: number | null;
};

export type CognitiveParticipantSummary = {
  participant: string;
  trials: number;
  scorableTrials: number;
  accuracy: number | null;
  omissions: number;
  omissionRate: number | null;
  rtCandidates: number;
  rtRetained: number;
  rtExcluded: number;
  rtExclusionRate: number | null;
  meanRtMs: number | null;
  medianRtMs: number | null;
  flags: string[];
};

export type CognitivePairedEffect = {
  condition: string;
  referenceCondition: string;
  participantPairsRt: number;
  meanRtDifferenceMs: number | null;
  rtT: number | null;
  rtDf: number | null;
  rtPValue: number | null;
  rtPAdjusted: number | null;
  rtCohenDz: number | null;
  participantPairsAccuracy: number;
  meanAccuracyDifference: number | null;
  accuracyT: number | null;
  accuracyDf: number | null;
  accuracyPValue: number | null;
  accuracyPAdjusted: number | null;
  accuracyCohenDz: number | null;
};

export type CognitiveTaskMetric = {
  key: string;
  label: string;
  value: number | null;
  unit?: "count" | "percent" | "ms" | "score" | "rate" | "other";
  note?: string;
};

export type CognitiveAnalysisResult = {
  schema: CognitiveDetectedSchema;
  dataLevel: CognitiveDataLevel;
  task: string;
  paradigm: string;
  rowCount: number;
  participantCount: number;
  trialCount: number;
  scorableTrials: number;
  accuracy: number | null;
  omissions: number;
  omissionRate: number | null;
  rtCandidates: number;
  rtRetained: number;
  rtExcluded: number;
  rtExclusionRate: number | null;
  meanRtMs: number | null;
  medianRtMs: number | null;
  sdRtMs: number | null;
  conditions: CognitiveConditionSummary[];
  referenceCondition: string | null;
  conditionEffects: CognitivePairedEffect[];
  participants: CognitiveParticipantSummary[];
  flaggedParticipantCount: number;
  taskMetrics: CognitiveTaskMetric[];
  platformQualityFlagCount: number;
  platformQualityFlags: Array<{ flag: string; count: number }>;
  issue: string | null;
};

const cognitiveFieldCandidates = {
  participant: ["participant", "participant_id", "participant_key", "participant_code"],
  session: ["cognitive_session_id", "session_id", "session"],
  task: ["cognitive_task", "task", "task_name", "task_title"],
  paradigm: ["paradigm", "task_type", "paradigm_key"],
  condition: ["condition", "condition_label", "trial_condition"],
  trial: ["trial_index", "trial", "trial_number"],
  response: ["response", "participant_response", "response_value"],
  correct: ["correct", "is_correct", "accuracy"],
  rt: ["reaction_time_ms", "rt_ms", "response_time_ms", "reaction_time", "rt"],
};

function cognitiveColumnSet(rows: AnalysisRow[]) {
  const columns = new Set<string>();
  const limit = Math.min(rows.length, 250);
  for (let index = 0; index < limit; index += 1) {
    Object.keys(rows[index] || {}).forEach((key) => columns.add(key));
  }
  return columns;
}

function cognitiveFindField(columns: Set<string>, candidates: string[]) {
  return candidates.find((candidate) => columns.has(candidate)) || null;
}

export function detectCognitiveSchema(rows: AnalysisRow[]): CognitiveDetectedSchema {
  const columns = cognitiveColumnSet(rows);
  const participantField = cognitiveFindField(columns, cognitiveFieldCandidates.participant);
  const sessionField = cognitiveFindField(columns, cognitiveFieldCandidates.session);
  const taskField = cognitiveFindField(columns, cognitiveFieldCandidates.task);
  const paradigmField = cognitiveFindField(columns, cognitiveFieldCandidates.paradigm);
  const conditionField = cognitiveFindField(columns, cognitiveFieldCandidates.condition);
  const trialField = cognitiveFindField(columns, cognitiveFieldCandidates.trial);
  const responseField = cognitiveFindField(columns, cognitiveFieldCandidates.response);
  const correctField = cognitiveFindField(columns, cognitiveFieldCandidates.correct);
  const reactionTimeField = cognitiveFindField(columns, cognitiveFieldCandidates.rt);

  let dataLevel: CognitiveDataLevel = "unknown";
  if (trialField || (reactionTimeField && (conditionField || responseField || correctField))) {
    dataLevel = "trial";
  } else if (
    columns.has("session_status") ||
    columns.has("trials") ||
    columns.has("completed") ||
    columns.has("mean_rt_ms") ||
    columns.has("median_rt_ms") ||
    columns.has("ssrt_ms") ||
    columns.has("corsi_forward_span") ||
    columns.has("card_sort_categories_completed") ||
    columns.has("bart_adjusted_mean_pumps") ||
    columns.has("mental_rotation_slope_ms_per_degree")
  ) {
    dataLevel = "participant_summary";
  }

  return {
    dataLevel,
    participantField,
    sessionField,
    taskField,
    paradigmField,
    conditionField,
    trialField,
    responseField,
    correctField,
    reactionTimeField,
  };
}

function cognitiveText(value: unknown) {
  if (isMissingValue(value)) return "";
  return String(value).trim();
}

function cognitiveBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  const text = cognitiveText(value).toLowerCase();
  if (["true", "yes", "y", "1", "correct", "success", "successful"].includes(text)) return true;
  if (["false", "no", "n", "0", "incorrect", "error", "fail", "failed"].includes(text)) return false;
  return null;
}

function cognitiveMean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function cognitiveMedian(values: number[]) {
  return values.length ? quantile(values, 0.5) : null;
}

function cognitiveSd(values: number[]) {
  const variance = sampleVariance(values);
  return variance === null ? null : Math.sqrt(Math.max(0, variance));
}

function cognitiveSafeRate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function cognitiveResponseForRow(row: AnalysisRow, schema: CognitiveDetectedSchema, paradigm: string) {
  const preferredFields = [
    schema.responseField,
    paradigm === "mental_rotation" ? "mental_rotation_response" : null,
    paradigm === "bart" ? "bart_decision" : null,
    paradigm === "card_sorting" ? "card_sort_chosen_reference_id" : null,
    paradigm === "corsi" ? "corsi_response_sequence_json" : null,
  ].filter((field): field is string => Boolean(field));

  for (const field of preferredFields) {
    if (!isMissingValue(row[field])) return row[field];
  }
  return null;
}

function cognitiveTimedOut(row: AnalysisRow, paradigm: string) {
  const fields = [
    paradigm === "mental_rotation" ? "mental_rotation_timed_out" : null,
    paradigm === "bart" ? "bart_timed_out" : null,
    paradigm === "card_sorting" ? "card_sort_timed_out" : null,
    paradigm === "corsi" ? "corsi_timed_out" : null,
  ].filter((field): field is string => Boolean(field));
  return fields.some((field) => cognitiveBoolean(row[field]) === true);
}

function cognitiveParticipantForRow(row: AnalysisRow, schema: CognitiveDetectedSchema, index: number) {
  const value = schema.participantField ? cognitiveText(row[schema.participantField]) : "";
  if (value) return value;
  const session = schema.sessionField ? cognitiveText(row[schema.sessionField]) : "";
  return session || `Row ${index + 1}`;
}

function cognitiveTaskForRow(row: AnalysisRow, schema: CognitiveDetectedSchema) {
  const task = schema.taskField ? cognitiveText(row[schema.taskField]) : "";
  const paradigm = schema.paradigmField ? cognitiveText(row[schema.paradigmField]) : "";
  return task || paradigm || "Cognitive task";
}

function cognitiveParadigmForRow(row: AnalysisRow, schema: CognitiveDetectedSchema) {
  const paradigm = schema.paradigmField ? cognitiveText(row[schema.paradigmField]) : "";
  if (paradigm) return paradigm;
  const keys = Object.keys(row);
  if (keys.some((key) => key.startsWith("stop_signal_") || key === "ssrt_ms")) return "stop_signal";
  if (keys.some((key) => key.startsWith("corsi_"))) return "corsi";
  if (keys.some((key) => key.startsWith("card_sort_"))) return "card_sorting";
  if (keys.some((key) => key.startsWith("bart_"))) return "bart";
  if (keys.some((key) => key.startsWith("mental_rotation_"))) return "mental_rotation";
  return "generic";
}

export function getCognitiveTaskOptions(rows: AnalysisRow[]): CognitiveTaskOption[] {
  const schema = detectCognitiveSchema(rows);
  const groups = new Map<string, { label: string; paradigmCounts: Map<string, number>; rows: number; participants: Set<string> }>();
  rows.forEach((row, index) => {
    const label = cognitiveTaskForRow(row, schema);
    const paradigm = cognitiveParadigmForRow(row, schema);
    const group = groups.get(label) || {
      label,
      paradigmCounts: new Map<string, number>(),
      rows: 0,
      participants: new Set<string>(),
    };
    group.rows += 1;
    group.participants.add(cognitiveParticipantForRow(row, schema, index));
    group.paradigmCounts.set(paradigm, (group.paradigmCounts.get(paradigm) || 0) + 1);
    groups.set(label, group);
  });

  return Array.from(groups.values())
    .map((group) => {
      const paradigm = Array.from(group.paradigmCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "generic";
      return {
        value: group.label,
        label: group.label,
        paradigm,
        rowCount: group.rows,
        participantCount: group.participants.size,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

function cognitiveParseQualityFlags(row: AnalysisRow) {
  const flags: string[] = [];
  for (const [key, raw] of Object.entries(row)) {
    if (!key.endsWith("quality_flags_json") || isMissingValue(raw)) continue;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        parsed.forEach((flag) => {
          const text = cognitiveText(flag);
          if (text) flags.push(text);
        });
      }
    } catch {
      const text = cognitiveText(raw);
      if (text && text !== "[]") flags.push(text);
    }
  }
  return flags;
}

function cognitiveSimpleSlope(xs: number[], ys: number[]) {
  if (xs.length !== ys.length || xs.length < 2) return null;
  const xMean = cognitiveMean(xs);
  const yMean = cognitiveMean(ys);
  if (xMean === null || yMean === null) return null;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < xs.length; index += 1) {
    numerator += (xs[index] - xMean) * (ys[index] - yMean);
    denominator += (xs[index] - xMean) ** 2;
  }
  return denominator > 0 ? numerator / denominator : null;
}

function cognitiveTrialTaskMetrics(rows: AnalysisRow[], paradigm: string): CognitiveTaskMetric[] {
  if (paradigm === "stop_signal") {
    const stopRows = rows.filter((row) => cognitiveBoolean(row.stop_signal_presented) === true || cognitiveText(row.stop_signal_trial_type).toLowerCase().includes("stop"));
    const stopRowSet = new Set(stopRows);
    const goRows = rows.filter((row) => !stopRowSet.has(row));
    const stopSuccessValues = stopRows.map((row) => cognitiveBoolean(row.stop_success)).filter((value): value is boolean => value !== null);
    const goCorrectValues = goRows.map((row) => cognitiveBoolean(row.go_correct ?? row.correct)).filter((value): value is boolean => value !== null);
    const ssdValues = stopRows.map((row) => toFiniteNumber(row.actual_ssd_ms ?? row.requested_ssd_ms)).filter((value): value is number => value !== null);
    const goRt = goRows.filter((row) => cognitiveBoolean(row.go_correct ?? row.correct) === true).map((row) => toFiniteNumber(row.reaction_time_ms)).filter((value): value is number => value !== null);
    const failedStopRt = stopRows.filter((row) => cognitiveBoolean(row.stop_success) === false).map((row) => toFiniteNumber(row.reaction_time_ms)).filter((value): value is number => value !== null);
    return [
      { key: "stop_trials", label: "Stop trials", value: stopRows.length, unit: "count" },
      { key: "stop_success_rate", label: "Stop success rate", value: cognitiveSafeRate(stopSuccessValues.filter(Boolean).length, stopSuccessValues.length), unit: "percent" },
      { key: "mean_ssd_ms", label: "Mean SSD", value: cognitiveMean(ssdValues), unit: "ms" },
      { key: "go_accuracy", label: "Go accuracy", value: cognitiveSafeRate(goCorrectValues.filter(Boolean).length, goCorrectValues.length), unit: "percent" },
      { key: "mean_go_rt_ms", label: "Mean correct go RT", value: cognitiveMean(goRt), unit: "ms" },
      { key: "mean_failed_stop_rt_ms", label: "Mean failed-stop RT", value: cognitiveMean(failedStopRt), unit: "ms" },
    ];
  }

  if (paradigm === "corsi") {
    const correctRows = rows.filter((row) => cognitiveBoolean(row.correct) === true);
    const spans = correctRows.map((row) => toFiniteNumber(row.corsi_span_length)).filter((value): value is number => value !== null);
    const firstTap = rows.map((row) => toFiniteNumber(row.corsi_first_tap_latency_ms)).filter((value): value is number => value !== null);
    const completion = rows.map((row) => toFiniteNumber(row.corsi_completion_latency_ms)).filter((value): value is number => value !== null);
    const timedOut = rows.filter((row) => cognitiveBoolean(row.corsi_timed_out) === true).length;
    return [
      { key: "max_correct_span", label: "Maximum correct span", value: spans.length ? Math.max(...spans) : null, unit: "score" },
      { key: "sequence_accuracy", label: "Sequence accuracy", value: cognitiveSafeRate(correctRows.length, rows.filter((row) => cognitiveBoolean(row.correct) !== null).length), unit: "percent" },
      { key: "mean_first_tap_latency_ms", label: "Mean first-tap latency", value: cognitiveMean(firstTap), unit: "ms" },
      { key: "mean_completion_latency_ms", label: "Mean completion latency", value: cognitiveMean(completion), unit: "ms" },
      { key: "timeout_rate", label: "Timeout rate", value: cognitiveSafeRate(timedOut, rows.length), unit: "percent" },
    ];
  }

  if (paradigm === "card_sorting") {
    const perseverative = rows.filter((row) => cognitiveBoolean(row.card_sort_perseverative_error) === true).length;
    const nonperseverative = rows.filter((row) => cognitiveBoolean(row.card_sort_nonperseverative_error) === true).length;
    const failures = rows.filter((row) => cognitiveBoolean(row.card_sort_failure_to_maintain_set) === true).length;
    const correct = rows.filter((row) => cognitiveBoolean(row.correct) === true).length;
    const scorable = rows.filter((row) => cognitiveBoolean(row.correct) !== null).length;
    const latencies = rows.map((row) => toFiniteNumber(row.card_sort_response_latency_ms ?? row.reaction_time_ms)).filter((value): value is number => value !== null);
    return [
      { key: "accuracy", label: "Card-sort accuracy", value: cognitiveSafeRate(correct, scorable), unit: "percent" },
      { key: "perseverative_error_rate", label: "Perseverative error rate", value: cognitiveSafeRate(perseverative, rows.length), unit: "percent" },
      { key: "perseverative_error_share", label: "Perseverative share of errors", value: cognitiveSafeRate(perseverative, perseverative + nonperseverative), unit: "percent" },
      { key: "failures_to_maintain", label: "Failures to maintain set", value: failures, unit: "count" },
      { key: "mean_latency_ms", label: "Mean response latency", value: cognitiveMean(latencies), unit: "ms" },
    ];
  }

  if (paradigm === "bart") {
    const balloonMap = new Map<string, { maxPumps: number; exploded: boolean; cashed: boolean }>();
    let pumpDecisions = 0;
    let collectDecisions = 0;
    const decisionLatencies: number[] = [];
    for (const row of rows) {
      const balloon = cognitiveText(row.bart_balloon_index) || "unknown";
      const entry = balloonMap.get(balloon) || { maxPumps: 0, exploded: false, cashed: false };
      const decision = cognitiveText(row.bart_decision).toLowerCase();
      if (decision.includes("pump")) pumpDecisions += 1;
      if (decision.includes("collect") || decision.includes("cash")) collectDecisions += 1;
      const pumps = toFiniteNumber(row.bart_pumps_after_decision ?? row.bart_pumps_before_decision);
      if (pumps !== null) entry.maxPumps = Math.max(entry.maxPumps, pumps);
      entry.exploded = entry.exploded || cognitiveBoolean(row.bart_exploded_after_decision) === true;
      entry.cashed = entry.cashed || cognitiveBoolean(row.bart_cashed_out_after_decision) === true;
      balloonMap.set(balloon, entry);
      const latency = toFiniteNumber(row.bart_decision_latency_ms ?? row.reaction_time_ms);
      if (latency !== null) decisionLatencies.push(latency);
    }
    const balloons = Array.from(balloonMap.values());
    const nonExplodedPumps = balloons.filter((balloon) => !balloon.exploded).map((balloon) => balloon.maxPumps);
    return [
      { key: "balloons", label: "Balloons", value: balloons.length, unit: "count" },
      { key: "pump_decisions", label: "Pump decisions", value: pumpDecisions, unit: "count" },
      { key: "collect_decisions", label: "Collect decisions", value: collectDecisions, unit: "count" },
      { key: "explosion_rate", label: "Explosion rate", value: cognitiveSafeRate(balloons.filter((balloon) => balloon.exploded).length, balloons.length), unit: "percent" },
      { key: "adjusted_mean_pumps", label: "Adjusted mean pumps", value: cognitiveMean(nonExplodedPumps), unit: "score" },
      { key: "mean_decision_latency_ms", label: "Mean decision latency", value: cognitiveMean(decisionLatencies), unit: "ms" },
    ];
  }

  if (paradigm === "mental_rotation") {
    const scored = rows.filter((row) => cognitiveBoolean(row.correct) !== null);
    const correctRows = rows.filter((row) => cognitiveBoolean(row.correct) === true);
    const correctRt = correctRows.map((row) => toFiniteNumber(row.mental_rotation_response_latency_ms ?? row.reaction_time_ms)).filter((value): value is number => value !== null);
    const timedOut = rows.filter((row) => cognitiveBoolean(row.mental_rotation_timed_out) === true).length;
    const sameRows = scored.filter((row) => cognitiveBoolean(row.mental_rotation_mirrored) === false);
    const mirroredRows = scored.filter((row) => cognitiveBoolean(row.mental_rotation_mirrored) === true);
    const slopeRows = correctRows.map((row) => ({
      x: toFiniteNumber(row.mental_rotation_angular_disparity_deg ?? row.mental_rotation_angle_deg),
      y: toFiniteNumber(row.mental_rotation_response_latency_ms ?? row.reaction_time_ms),
    })).filter((pair): pair is { x: number; y: number } => pair.x !== null && pair.y !== null);
    return [
      { key: "accuracy", label: "Mental-rotation accuracy", value: cognitiveSafeRate(correctRows.length, scored.length), unit: "percent" },
      { key: "same_accuracy", label: "Same-shape accuracy", value: cognitiveSafeRate(sameRows.filter((row) => cognitiveBoolean(row.correct) === true).length, sameRows.length), unit: "percent" },
      { key: "mirrored_accuracy", label: "Mirrored accuracy", value: cognitiveSafeRate(mirroredRows.filter((row) => cognitiveBoolean(row.correct) === true).length, mirroredRows.length), unit: "percent" },
      { key: "mean_correct_rt_ms", label: "Mean correct RT", value: cognitiveMean(correctRt), unit: "ms" },
      { key: "rotation_slope", label: "RT slope per degree", value: cognitiveSimpleSlope(slopeRows.map((pair) => pair.x), slopeRows.map((pair) => pair.y)), unit: "other", note: "Milliseconds per degree from correct trials." },
      { key: "timeout_rate", label: "Timeout rate", value: cognitiveSafeRate(timedOut, rows.length), unit: "percent" },
    ];
  }

  return [];
}

function cognitiveSummaryMetricDefinitions(paradigm: string) {
  const common = [
    ["accuracy", "Mean accuracy", "percent"],
    ["mean_rt_ms", "Mean RT", "ms"],
    ["median_rt_ms", "Median RT", "ms"],
    ["omissions", "Mean omissions", "count"],
  ] as const;

  const byParadigm: Record<string, ReadonlyArray<readonly [string, string, CognitiveTaskMetric["unit"]]>> = {
    stop_signal: [
      ["ssrt_ms", "Mean SSRT", "ms"],
      ["mean_ssd_ms", "Mean SSD", "ms"],
      ["stop_success_rate", "Stop success rate", "percent"],
      ["p_respond_signal", "P(respond | signal)", "percent"],
      ["mean_go_rt_ms", "Mean go RT", "ms"],
      ["mean_failed_stop_rt_ms", "Mean failed-stop RT", "ms"],
      ["go_omissions", "Mean go omissions", "count"],
      ["go_choice_errors", "Mean go choice errors", "count"],
    ],
    corsi: [
      ["corsi_forward_span", "Forward span", "score"],
      ["corsi_backward_span", "Backward span", "score"],
      ["corsi_forward_product_score", "Forward product score", "score"],
      ["corsi_backward_product_score", "Backward product score", "score"],
      ["corsi_overall_sequence_accuracy", "Overall sequence accuracy", "percent"],
      ["corsi_forward_mean_first_tap_latency_ms", "Forward first-tap latency", "ms"],
      ["corsi_backward_mean_first_tap_latency_ms", "Backward first-tap latency", "ms"],
    ],
    card_sorting: [
      ["card_sort_categories_completed", "Categories completed", "score"],
      ["card_sort_accuracy", "Card-sort accuracy", "percent"],
      ["card_sort_perseverative_error_rate", "Perseverative error rate", "percent"],
      ["card_sort_perseverative_share_of_errors", "Perseverative share of errors", "percent"],
      ["card_sort_failures_to_maintain_set", "Failures to maintain set", "count"],
      ["card_sort_trials_to_first_category", "Trials to first category", "count"],
      ["card_sort_mean_response_latency_ms", "Mean response latency", "ms"],
    ],
    bart: [
      ["bart_adjusted_mean_pumps", "Adjusted mean pumps", "score"],
      ["bart_mean_pumps_all_balloons", "Mean pumps — all balloons", "score"],
      ["bart_explosion_rate", "Explosion rate", "percent"],
      ["bart_final_bank", "Final bank", "score"],
      ["bart_mean_decision_latency_ms", "Mean decision latency", "ms"],
      ["bart_timed_out_decisions", "Timed-out decisions", "count"],
    ],
    mental_rotation: [
      ["mental_rotation_accuracy", "Mental-rotation accuracy", "percent"],
      ["mental_rotation_same_accuracy", "Same-shape accuracy", "percent"],
      ["mental_rotation_mirrored_accuracy", "Mirrored accuracy", "percent"],
      ["mental_rotation_mean_correct_rt_ms", "Mean correct RT", "ms"],
      ["mental_rotation_median_correct_rt_ms", "Median correct RT", "ms"],
      ["mental_rotation_slope_ms_per_degree", "RT slope per degree", "other"],
      ["mental_rotation_timeout_trials", "Timed-out trials", "count"],
    ],
  };
  return [...common, ...(byParadigm[paradigm] || [])];
}

function cognitiveSummaryTaskMetrics(rows: AnalysisRow[], paradigm: string): CognitiveTaskMetric[] {
  return cognitiveSummaryMetricDefinitions(paradigm)
    .map(([key, label, unit]) => {
      const values = rows.map((row) => toFiniteNumber(row[key])).filter((value): value is number => value !== null);
      return {
        key,
        label,
        value: cognitiveMean(values),
        unit,
        note: values.length ? `Mean across ${values.length} participant-level record${values.length === 1 ? "" : "s"}.` : undefined,
      } as CognitiveTaskMetric;
    })
    .filter((metric) => metric.value !== null);
}

function cognitivePairedStats(differences: number[]) {
  const n = differences.length;
  if (n < 2) {
    return { n, mean: n ? differences[0] : null, t: null, df: n > 0 ? n - 1 : null, p: null, dz: null };
  }
  const mean = cognitiveMean(differences);
  const sd = cognitiveSd(differences);
  if (mean === null || sd === null) return { n, mean, t: null, df: n - 1, p: null, dz: null };
  if (sd === 0) {
    const t = mean === 0 ? 0 : null;
    return { n, mean, t, df: n - 1, p: t === 0 ? 1 : null, dz: null };
  }
  const se = sd / Math.sqrt(n);
  const t = se > 0 ? mean / se : null;
  return {
    n,
    mean,
    t,
    df: n - 1,
    p: t === null ? null : twoSidedTPValue(t, n - 1),
    dz: mean / sd,
  };
}

export function computeCognitiveTaskAnalysis(
  rows: AnalysisRow[],
  options: CognitiveScreeningOptions = {}
): CognitiveAnalysisResult {
  const schema = detectCognitiveSchema(rows);
  const taskOptions = getCognitiveTaskOptions(rows);
  const requestedTask = cognitiveText(options.task);
  const task = requestedTask || taskOptions[0]?.value || "Cognitive task";
  const selectedRows = rows.filter((row) => cognitiveTaskForRow(row, schema) === task || taskOptions.length <= 1);
  const paradigmCounts = new Map<string, number>();
  selectedRows.forEach((row) => {
    const paradigm = cognitiveParadigmForRow(row, schema);
    paradigmCounts.set(paradigm, (paradigmCounts.get(paradigm) || 0) + 1);
  });
  const paradigm = Array.from(paradigmCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "generic";

  const minRtMs = Number.isFinite(options.minRtMs) ? Math.max(0, Number(options.minRtMs)) : 150;
  const maxRtMs = Number.isFinite(options.maxRtMs) ? Math.max(minRtMs, Number(options.maxRtMs)) : 3000;
  const correctRtOnly = options.correctRtOnly !== false;
  const minScorableTrials = Number.isFinite(options.minScorableTrials) ? Math.max(0, Number(options.minScorableTrials)) : 20;
  const minAccuracy = Number.isFinite(options.minAccuracy) ? Math.min(1, Math.max(0, Number(options.minAccuracy))) : 0.6;
  const maxOmissionRate = Number.isFinite(options.maxOmissionRate) ? Math.min(1, Math.max(0, Number(options.maxOmissionRate))) : 0.1;
  const maxRtExclusionRate = Number.isFinite(options.maxRtExclusionRate) ? Math.min(1, Math.max(0, Number(options.maxRtExclusionRate))) : 0.2;

  const participantFlags = new Map<string, Set<string>>();
  const qualityFlagCounts = new Map<string, number>();
  selectedRows.forEach((row, index) => {
    const participant = cognitiveParticipantForRow(row, schema, index);
    const participantSet = participantFlags.get(participant) || new Set<string>();
    for (const flag of cognitiveParseQualityFlags(row)) {
      participantSet.add(`Platform: ${flag}`);
      qualityFlagCounts.set(flag, (qualityFlagCounts.get(flag) || 0) + 1);
    }
    participantFlags.set(participant, participantSet);
  });

  if (schema.dataLevel === "unknown" || selectedRows.length === 0) {
    return {
      schema,
      dataLevel: schema.dataLevel,
      task,
      paradigm,
      rowCount: selectedRows.length,
      participantCount: 0,
      trialCount: 0,
      scorableTrials: 0,
      accuracy: null,
      omissions: 0,
      omissionRate: null,
      rtCandidates: 0,
      rtRetained: 0,
      rtExcluded: 0,
      rtExclusionRate: null,
      meanRtMs: null,
      medianRtMs: null,
      sdRtMs: null,
      conditions: [],
      referenceCondition: null,
      conditionEffects: [],
      participants: [],
      flaggedParticipantCount: 0,
      taskMetrics: [],
      platformQualityFlagCount: 0,
      platformQualityFlags: [],
      issue: "This dataset does not expose the PsyLattice cognitive trial or participant-summary schema. Use Cognitive trials, Cognitive participant summaries, a task-specific cognitive dataset, or a compatible CSV.",
    };
  }

  if (schema.dataLevel === "participant_summary") {
    const participantRows = selectedRows.map((row, index) => {
      const participant = cognitiveParticipantForRow(row, schema, index);
      const trials = toFiniteNumber(row.trials) ?? 0;
      const scorableTrials = toFiniteNumber(row.scorable_trials) ?? trials;
      const accuracy = toFiniteNumber(row.accuracy ?? row[`${paradigm}_accuracy`]);
      const omissions = toFiniteNumber(row.omissions) ?? 0;
      const meanRtMs = toFiniteNumber(row.mean_rt_ms);
      const medianRtMs = toFiniteNumber(row.median_rt_ms);
      const omissionRate = trials > 0 ? omissions / trials : null;
      const flags = new Set(participantFlags.get(participant) || []);
      if (scorableTrials < minScorableTrials) flags.add("Low scorable trials");
      if (accuracy !== null && accuracy < minAccuracy) flags.add("Low accuracy");
      if (omissionRate !== null && omissionRate > maxOmissionRate) flags.add("High omissions");
      return {
        participant,
        trials,
        scorableTrials,
        accuracy,
        omissions,
        omissionRate,
        rtCandidates: 0,
        rtRetained: 0,
        rtExcluded: 0,
        rtExclusionRate: null,
        meanRtMs,
        medianRtMs,
        flags: Array.from(flags),
      } as CognitiveParticipantSummary;
    });
    const totalTrials = participantRows.reduce((sum, participant) => sum + participant.trials, 0);
    const totalScorable = participantRows.reduce((sum, participant) => sum + participant.scorableTrials, 0);
    const totalOmissions = participantRows.reduce((sum, participant) => sum + participant.omissions, 0);
    const accuracyValues = participantRows.map((participant) => participant.accuracy).filter((value): value is number => value !== null);
    const meanRtValues = participantRows.map((participant) => participant.meanRtMs).filter((value): value is number => value !== null);
    const medianRtValues = participantRows.map((participant) => participant.medianRtMs).filter((value): value is number => value !== null);
    return {
      schema,
      dataLevel: schema.dataLevel,
      task,
      paradigm,
      rowCount: selectedRows.length,
      participantCount: new Set(participantRows.map((participant) => participant.participant)).size,
      trialCount: totalTrials,
      scorableTrials: totalScorable,
      accuracy: cognitiveMean(accuracyValues),
      omissions: totalOmissions,
      omissionRate: cognitiveSafeRate(totalOmissions, totalTrials),
      rtCandidates: 0,
      rtRetained: 0,
      rtExcluded: 0,
      rtExclusionRate: null,
      meanRtMs: cognitiveMean(meanRtValues),
      medianRtMs: cognitiveMean(medianRtValues),
      sdRtMs: null,
      conditions: [],
      referenceCondition: null,
      conditionEffects: [],
      participants: participantRows.sort((a, b) => b.flags.length - a.flags.length || a.participant.localeCompare(b.participant)),
      flaggedParticipantCount: participantRows.filter((participant) => participant.flags.length > 0).length,
      taskMetrics: cognitiveSummaryTaskMetrics(selectedRows, paradigm),
      platformQualityFlagCount: Array.from(qualityFlagCounts.values()).reduce((sum, count) => sum + count, 0),
      platformQualityFlags: Array.from(qualityFlagCounts.entries()).map(([flag, count]) => ({ flag, count })).sort((a, b) => b.count - a.count),
      issue: null,
    };
  }

  type TrialAccumulator = {
    trials: number;
    scorable: number;
    correct: number;
    omissions: number;
    rtCandidates: number;
    rtRetained: number;
    rtExcluded: number;
    rtValues: number[];
  };
  const createAccumulator = (): TrialAccumulator => ({
    trials: 0,
    scorable: 0,
    correct: 0,
    omissions: 0,
    rtCandidates: 0,
    rtRetained: 0,
    rtExcluded: 0,
    rtValues: [],
  });
  const overall = createAccumulator();
  const conditionMap = new Map<string, TrialAccumulator>();
  const participantMap = new Map<string, TrialAccumulator>();
  const participantConditionMap = new Map<string, Map<string, TrialAccumulator>>();

  selectedRows.forEach((row, index) => {
    const participant = cognitiveParticipantForRow(row, schema, index);
    const condition = schema.conditionField ? cognitiveText(row[schema.conditionField]) : "";
    const correct = schema.correctField ? cognitiveBoolean(row[schema.correctField]) : cognitiveBoolean(row.correct);
    const response = cognitiveResponseForRow(row, schema, paradigm);
    const timedOut = cognitiveTimedOut(row, paradigm);
    const rt = schema.reactionTimeField ? toFiniteNumber(row[schema.reactionTimeField]) : toFiniteNumber(row.reaction_time_ms);
    const omission = timedOut || (isMissingValue(response) && correct !== null);
    const rtCandidate = rt !== null && (!correctRtOnly || correct === true);
    const rtRetained = rtCandidate && rt >= minRtMs && rt <= maxRtMs;
    const rtExcluded = rtCandidate && !rtRetained;

    const accumulators = [overall];
    if (condition) {
      const conditionAccumulator = conditionMap.get(condition) || createAccumulator();
      conditionMap.set(condition, conditionAccumulator);
      accumulators.push(conditionAccumulator);
    }
    const participantAccumulator = participantMap.get(participant) || createAccumulator();
    participantMap.set(participant, participantAccumulator);
    accumulators.push(participantAccumulator);

    if (condition) {
      const perCondition = participantConditionMap.get(participant) || new Map<string, TrialAccumulator>();
      const participantCondition = perCondition.get(condition) || createAccumulator();
      perCondition.set(condition, participantCondition);
      participantConditionMap.set(participant, perCondition);
      accumulators.push(participantCondition);
    }

    for (const accumulator of accumulators) {
      accumulator.trials += 1;
      if (correct !== null) {
        accumulator.scorable += 1;
        if (correct) accumulator.correct += 1;
      }
      if (omission) accumulator.omissions += 1;
      if (rtCandidate) accumulator.rtCandidates += 1;
      if (rtRetained && rt !== null) {
        accumulator.rtRetained += 1;
        accumulator.rtValues.push(rt);
      }
      if (rtExcluded) accumulator.rtExcluded += 1;
    }
  });

  const conditions = Array.from(conditionMap.entries()).map(([condition, accumulator]) => ({
    condition,
    trials: accumulator.trials,
    scorableTrials: accumulator.scorable,
    correctTrials: accumulator.correct,
    accuracy: cognitiveSafeRate(accumulator.correct, accumulator.scorable),
    omissions: accumulator.omissions,
    omissionRate: cognitiveSafeRate(accumulator.omissions, accumulator.trials),
    rtCandidates: accumulator.rtCandidates,
    rtRetained: accumulator.rtRetained,
    rtExcluded: accumulator.rtExcluded,
    rtExclusionRate: cognitiveSafeRate(accumulator.rtExcluded, accumulator.rtCandidates),
    meanRtMs: cognitiveMean(accumulator.rtValues),
    medianRtMs: cognitiveMedian(accumulator.rtValues),
    sdRtMs: cognitiveSd(accumulator.rtValues),
  })).sort((a, b) => a.condition.localeCompare(b.condition));

  const referenceCondition = conditions.some((condition) => condition.condition === options.referenceCondition)
    ? String(options.referenceCondition)
    : conditions[0]?.condition || null;

  const rawEffects = referenceCondition
    ? conditions.filter((condition) => condition.condition !== referenceCondition).map((condition) => {
        const rtDifferences: number[] = [];
        const accuracyDifferences: number[] = [];
        for (const perCondition of participantConditionMap.values()) {
          const reference = perCondition.get(referenceCondition);
          const target = perCondition.get(condition.condition);
          if (!reference || !target) continue;
          const referenceRt = cognitiveMean(reference.rtValues);
          const targetRt = cognitiveMean(target.rtValues);
          if (referenceRt !== null && targetRt !== null) rtDifferences.push(targetRt - referenceRt);
          const referenceAccuracy = cognitiveSafeRate(reference.correct, reference.scorable);
          const targetAccuracy = cognitiveSafeRate(target.correct, target.scorable);
          if (referenceAccuracy !== null && targetAccuracy !== null) accuracyDifferences.push(targetAccuracy - referenceAccuracy);
        }
        const rt = cognitivePairedStats(rtDifferences);
        const accuracy = cognitivePairedStats(accuracyDifferences);
        return {
          condition: condition.condition,
          referenceCondition,
          participantPairsRt: rt.n,
          meanRtDifferenceMs: rt.mean,
          rtT: rt.t,
          rtDf: rt.df,
          rtPValue: rt.p,
          rtPAdjusted: null,
          rtCohenDz: rt.dz,
          participantPairsAccuracy: accuracy.n,
          meanAccuracyDifference: accuracy.mean,
          accuracyT: accuracy.t,
          accuracyDf: accuracy.df,
          accuracyPValue: accuracy.p,
          accuracyPAdjusted: null,
          accuracyCohenDz: accuracy.dz,
        } as CognitivePairedEffect;
      })
    : [];
  const rtAdjusted = holmAdjustedPValues(rawEffects.map((effect) => effect.rtPValue));
  const accuracyAdjusted = holmAdjustedPValues(rawEffects.map((effect) => effect.accuracyPValue));
  const conditionEffects = rawEffects.map((effect, index) => ({
    ...effect,
    rtPAdjusted: rtAdjusted[index] ?? null,
    accuracyPAdjusted: accuracyAdjusted[index] ?? null,
  }));

  const participants = Array.from(participantMap.entries()).map(([participant, accumulator]) => {
    const accuracy = cognitiveSafeRate(accumulator.correct, accumulator.scorable);
    const omissionRate = cognitiveSafeRate(accumulator.omissions, accumulator.trials);
    const rtExclusionRate = cognitiveSafeRate(accumulator.rtExcluded, accumulator.rtCandidates);
    const flags = new Set(participantFlags.get(participant) || []);
    if (accumulator.scorable < minScorableTrials) flags.add("Low scorable trials");
    if (accuracy !== null && accuracy < minAccuracy) flags.add("Low accuracy");
    if (omissionRate !== null && omissionRate > maxOmissionRate) flags.add("High omissions");
    if (rtExclusionRate !== null && rtExclusionRate > maxRtExclusionRate) flags.add("High RT exclusions");
    return {
      participant,
      trials: accumulator.trials,
      scorableTrials: accumulator.scorable,
      accuracy,
      omissions: accumulator.omissions,
      omissionRate,
      rtCandidates: accumulator.rtCandidates,
      rtRetained: accumulator.rtRetained,
      rtExcluded: accumulator.rtExcluded,
      rtExclusionRate,
      meanRtMs: cognitiveMean(accumulator.rtValues),
      medianRtMs: cognitiveMedian(accumulator.rtValues),
      flags: Array.from(flags),
    } as CognitiveParticipantSummary;
  }).sort((a, b) => b.flags.length - a.flags.length || a.participant.localeCompare(b.participant));

  return {
    schema,
    dataLevel: schema.dataLevel,
    task,
    paradigm,
    rowCount: selectedRows.length,
    participantCount: participants.length,
    trialCount: overall.trials,
    scorableTrials: overall.scorable,
    accuracy: cognitiveSafeRate(overall.correct, overall.scorable),
    omissions: overall.omissions,
    omissionRate: cognitiveSafeRate(overall.omissions, overall.trials),
    rtCandidates: overall.rtCandidates,
    rtRetained: overall.rtRetained,
    rtExcluded: overall.rtExcluded,
    rtExclusionRate: cognitiveSafeRate(overall.rtExcluded, overall.rtCandidates),
    meanRtMs: cognitiveMean(overall.rtValues),
    medianRtMs: cognitiveMedian(overall.rtValues),
    sdRtMs: cognitiveSd(overall.rtValues),
    conditions,
    referenceCondition,
    conditionEffects,
    participants,
    flaggedParticipantCount: participants.filter((participant) => participant.flags.length > 0).length,
    taskMetrics: cognitiveTrialTaskMetrics(selectedRows, paradigm),
    platformQualityFlagCount: Array.from(qualityFlagCounts.values()).reduce((sum, count) => sum + count, 0),
    platformQualityFlags: Array.from(qualityFlagCounts.entries()).map(([flag, count]) => ({ flag, count })).sort((a, b) => b.count - a.count),
    issue: null,
  };
}

// -----------------------------------------------------------------------------
// Unified PsyLattice data preparation / derived measures
// -----------------------------------------------------------------------------

export type AnalysisPreparationFamily =
  | "analysis_ready"
  | "cognitive"
  | "questionnaire"
  | "ambulatory"
  | "generic";

export type PreparedVariableInfo = {
  name: string;
  label: string;
  source: string;
  note: string;
};

export type AnalysisPreparationOptions = {
  datasetKey?: string;
  cognitive?: {
    minRtMs?: number;
    maxRtMs?: number;
    correctRtOnly?: boolean;
    minScorableTrials?: number;
    minAccuracy?: number;
    maxOmissionRate?: number;
    maxRtExclusionRate?: number;
  };
};

export type AnalysisPreparationResult = {
  family: AnalysisPreparationFamily;
  familyLabel: string;
  sourceLevel: string;
  targetLevel: string;
  canPrepare: boolean;
  alreadyAnalysisReady: boolean;
  rows: AnalysisRow[];
  codebook: AnalysisCodebookVariable[];
  derivedVariables: PreparedVariableInfo[];
  notes: string[];
  issue: string | null;
};

function prepText(value: unknown) {
  if (isMissingValue(value)) return "";
  return String(value).trim();
}

function prepSafeVariable(value: string) {
  const safe = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return safe || "value";
}

function prepMean(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function prepMedian(values: number[]) {
  return values.length ? quantile(values, 0.5) : null;
}

function prepSd(values: number[]) {
  const variance = sampleVariance(values);
  return variance === null ? null : Math.sqrt(Math.max(0, variance));
}

function prepColumns(rows: AnalysisRow[]) {
  const columns = new Set<string>();
  const limit = Math.min(rows.length, 500);
  for (let index = 0; index < limit; index += 1) {
    Object.keys(rows[index] || {}).forEach((key) => columns.add(key));
  }
  return columns;
}

function prepParticipantValue(row: AnalysisRow, index: number) {
  const candidates = ["participant", "participant_id", "participant_key", "participant_code"];
  for (const field of candidates) {
    const value = prepText(row[field]);
    if (value) return value;
  }
  return `Row ${index + 1}`;
}

function prepInferFamily(
  rows: AnalysisRow[],
  datasetKey: string
): AnalysisPreparationFamily {
  const key = datasetKey.toLowerCase();
  if (key === "analysis_wide") return "analysis_ready";
  if (key.startsWith("cognitive")) return "cognitive";
  if (key.startsWith("questionnaire")) return "questionnaire";
  if (key.startsWith("ambulatory")) return "ambulatory";

  const columns = prepColumns(rows);
  if (detectCognitiveSchema(rows).dataLevel !== "unknown") return "cognitive";
  if (
    columns.has("questionnaire") &&
    (columns.has("score_name") || columns.has("item_key"))
  ) {
    return "questionnaire";
  }
  if (
    columns.has("participant") &&
    (columns.has("checkin_id") ||
      columns.has("schedule_key") ||
      columns.has("local_date")) &&
    (columns.has("numeric_value") ||
      columns.has("scheduled_prompts") ||
      columns.has("response_latency_minutes"))
  ) {
    return "ambulatory";
  }
  return "generic";
}

function prepRegisterVariable(
  registry: Map<string, PreparedVariableInfo>,
  name: string,
  label: string,
  source: string,
  note: string
) {
  if (!registry.has(name)) {
    registry.set(name, { name, label, source, note });
  }
}

function prepCodebookFromRegistry(
  registry: Map<string, PreparedVariableInfo>
): AnalysisCodebookVariable[] {
  return Array.from(registry.values()).map((entry) => ({
    variable: entry.name,
    label: entry.label,
    type: "number",
    source: entry.source,
    notes: entry.note,
  }));
}

function prepareCognitiveDataset(
  rows: AnalysisRow[],
  options: AnalysisPreparationOptions
): AnalysisPreparationResult {
  const schema = detectCognitiveSchema(rows);
  const taskOptions = getCognitiveTaskOptions(rows);
  if (schema.dataLevel === "unknown" || taskOptions.length === 0) {
    return {
      family: "cognitive",
      familyLabel: "Cognitive data",
      sourceLevel: "Unrecognized cognitive structure",
      targetLevel: "Participant-level derived measures",
      canPrepare: false,
      alreadyAnalysisReady: false,
      rows: [],
      codebook: [],
      derivedVariables: [],
      notes: [
        "PsyLattice could not identify the common cognitive task/trial schema in this dataset.",
      ],
      issue:
        "The selected data does not expose enough cognitive task fields to create participant-level derived measures.",
    };
  }

  const participantRows = new Map<string, AnalysisRow>();
  const registry = new Map<string, PreparedVariableInfo>();
  const cognitiveOptions = options.cognitive || {};

  const ensureParticipant = (participant: string, sourceRow?: AnalysisRow) => {
    const existing = participantRows.get(participant);
    if (existing) return existing;
    const created: AnalysisRow = { participant };
    if (sourceRow && !isMissingValue(sourceRow.is_test)) {
      created.is_test = sourceRow.is_test;
    }
    participantRows.set(participant, created);
    return created;
  };

  for (const taskOption of taskOptions) {
    const taskRows = rows.filter((row) => {
      if (!schema.taskField && taskOptions.length === 1) return true;
      return cognitiveTaskForRow(row, schema) === taskOption.value;
    });
    const byParticipant = new Map<string, AnalysisRow[]>();
    taskRows.forEach((row, index) => {
      const participant = cognitiveParticipantForRow(row, schema, index);
      const list = byParticipant.get(participant) || [];
      list.push(row);
      byParticipant.set(participant, list);
    });

    const taskPrefix = `cog_${prepSafeVariable(taskOption.value)}`;
    const source = `Cognitive · ${taskOption.label}`;

    for (const [participant, participantTaskRows] of byParticipant) {
      const result = computeCognitiveTaskAnalysis(participantTaskRows, {
        ...cognitiveOptions,
        task: taskOption.value,
      });
      const target = ensureParticipant(participant, participantTaskRows[0]);
      const participantSummary = result.participants[0] || null;

      const baseValues: Array<[string, string, number | null, string]> = [
        ["trials", "Trials", participantSummary?.trials ?? result.trialCount, "Number of task trials represented for this participant."],
        ["scorable_trials", "Scorable trials", participantSummary?.scorableTrials ?? result.scorableTrials, "Trials with enough information to score correctness."],
        ["accuracy", "Accuracy", participantSummary?.accuracy ?? result.accuracy, "Proportion correct among scorable trials."],
        ["omissions", "Omissions", participantSummary?.omissions ?? result.omissions, "Trials without a usable response."],
        ["omission_rate", "Omission rate", participantSummary?.omissionRate ?? result.omissionRate, "Omissions divided by all represented trials."],
        ["mean_rt_ms", "Mean RT (ms)", participantSummary?.meanRtMs ?? result.meanRtMs, "Mean retained reaction time after the current preparation rules."],
        ["median_rt_ms", "Median RT (ms)", participantSummary?.medianRtMs ?? result.medianRtMs, "Median retained reaction time after the current preparation rules."],
        ["rt_exclusion_rate", "RT exclusion rate", participantSummary?.rtExclusionRate ?? result.rtExclusionRate, "Proportion of RT candidates outside the configured cleaning range."],
        ["review_flag_count", "Review flag count", participantSummary?.flags.length ?? 0, "Count of preparation/data-quality review flags; participants are never automatically excluded."],
      ];

      for (const [suffix, label, value, note] of baseValues) {
        const name = `${taskPrefix}_${suffix}`;
        target[name] = value ?? "";
        prepRegisterVariable(registry, name, `${taskOption.label} — ${label}`, source, note);
      }
      target[`${taskPrefix}_review_flags`] = participantSummary?.flags.join(" · ") || "";

      const conditionByName = new Map(
        result.conditions.map((condition) => [condition.condition, condition])
      );
      const reference = result.referenceCondition;
      for (const condition of result.conditions) {
        const conditionPrefix = `${taskPrefix}_${prepSafeVariable(condition.condition)}`;
        const accuracyName = `${conditionPrefix}_accuracy`;
        const meanRtName = `${conditionPrefix}_mean_rt_ms`;
        const medianRtName = `${conditionPrefix}_median_rt_ms`;
        target[accuracyName] = condition.accuracy ?? "";
        target[meanRtName] = condition.meanRtMs ?? "";
        target[medianRtName] = condition.medianRtMs ?? "";
        prepRegisterVariable(
          registry,
          accuracyName,
          `${taskOption.label} · ${condition.condition} — Accuracy`,
          source,
          "Condition-specific participant accuracy derived from the standardized cognitive trial schema."
        );
        prepRegisterVariable(
          registry,
          meanRtName,
          `${taskOption.label} · ${condition.condition} — Mean RT (ms)`,
          source,
          "Condition-specific participant mean retained reaction time."
        );
        prepRegisterVariable(
          registry,
          medianRtName,
          `${taskOption.label} · ${condition.condition} — Median RT (ms)`,
          source,
          "Condition-specific participant median retained reaction time."
        );

        if (reference && condition.condition !== reference) {
          const referenceSummary = conditionByName.get(reference);
          if (referenceSummary) {
            const contrastPrefix = `${conditionPrefix}_minus_${prepSafeVariable(reference)}`;
            const rtDifferenceName = `${contrastPrefix}_rt_ms`;
            const accuracyDifferenceName = `${contrastPrefix}_accuracy`;
            target[rtDifferenceName] =
              condition.meanRtMs !== null && referenceSummary.meanRtMs !== null
                ? condition.meanRtMs - referenceSummary.meanRtMs
                : "";
            target[accuracyDifferenceName] =
              condition.accuracy !== null && referenceSummary.accuracy !== null
                ? condition.accuracy - referenceSummary.accuracy
                : "";
            prepRegisterVariable(
              registry,
              rtDifferenceName,
              `${taskOption.label} · ${condition.condition} − ${reference} RT`,
              source,
              `Within-participant mean RT contrast using ${reference} as the automatically selected reference condition.`
            );
            prepRegisterVariable(
              registry,
              accuracyDifferenceName,
              `${taskOption.label} · ${condition.condition} − ${reference} accuracy`,
              source,
              `Within-participant accuracy contrast using ${reference} as the automatically selected reference condition.`
            );
          }
        }
      }

      for (const metric of result.taskMetrics) {
        const name = `${taskPrefix}_${prepSafeVariable(metric.key)}`;
        target[name] = metric.value ?? "";
        prepRegisterVariable(
          registry,
          name,
          `${taskOption.label} — ${metric.label}`,
          source,
          metric.note || "Task-specific participant metric derived from the PsyLattice cognitive task recipe."
        );
      }
    }
  }

  const preparedRows = Array.from(participantRows.values());
  const derivedVariables = Array.from(registry.values());
  return {
    family: "cognitive",
    familyLabel: "Cognitive data",
    sourceLevel:
      schema.dataLevel === "trial"
        ? "Trial / event level"
        : "Participant × task summary level",
    targetLevel: "One row per participant",
    canPrepare: preparedRows.length > 0 && derivedVariables.length > 0,
    alreadyAnalysisReady: false,
    rows: preparedRows,
    codebook: prepCodebookFromRegistry(registry),
    derivedVariables,
    notes: [
      `Detected ${taskOptions.length} cognitive task${taskOptions.length === 1 ? "" : "s"}.`,
      "RT cleaning and review flags are preparation rules only; no participant is automatically removed.",
      "Task-specific recipes extend the shared cognitive schema without creating a separate statistical environment.",
    ],
    issue: null,
  };
}

function prepareQuestionnaireDataset(
  rows: AnalysisRow[],
  datasetKey: string
): AnalysisPreparationResult {
  const participantRows = new Map<string, AnalysisRow>();
  const registry = new Map<string, PreparedVariableInfo>();
  const key = datasetKey.toLowerCase();
  const isScores = key.includes("score") || prepColumns(rows).has("score_name");
  const numericAccumulators = new Map<string, number[]>();
  const answeredByScale = new Map<string, Set<string>>();

  const ensureParticipant = (participant: string, sourceRow?: AnalysisRow) => {
    const existing = participantRows.get(participant);
    if (existing) return existing;
    const created: AnalysisRow = { participant };
    if (sourceRow && !isMissingValue(sourceRow.is_test)) created.is_test = sourceRow.is_test;
    participantRows.set(participant, created);
    return created;
  };

  rows.forEach((row, index) => {
    const participant = prepParticipantValue(row, index);
    const target = ensureParticipant(participant, row);
    const phase = prepText(row.phase) || "study";
    const questionnaire = prepText(row.acronym) || prepText(row.questionnaire) || "questionnaire";
    const questionnaireLabel = prepText(row.questionnaire) || questionnaire;
    const base = `q_${prepSafeVariable(phase)}_${prepSafeVariable(questionnaire)}`;

    if (isScores) {
      const scoreName = prepText(row.score_name) || "score";
      const name = `${base}_${prepSafeVariable(scoreName)}`;
      const numeric = toFiniteNumber(row.score_value);
      target[name] = numeric ?? (isMissingValue(row.score_value) ? "" : row.score_value);
      prepRegisterVariable(
        registry,
        name,
        `${questionnaireLabel} · ${phase} — ${scoreName}`,
        `Questionnaire · ${questionnaireLabel}`,
        "Stored questionnaire score produced by the PsyLattice participant runner; Analysis Lab does not invent a new scoring formula."
      );
      return;
    }

    const itemKey = prepText(row.item_key) || `item_${prepText(row.item_position) || index + 1}`;
    const name = `${base}_${prepSafeVariable(itemKey)}`;
    const numeric =
      toFiniteNumber(row.score_value) ??
      toFiniteNumber(row.numeric_value) ??
      toFiniteNumber(row.response);
    if (numeric !== null) {
      const accumulatorKey = `${participant}\u0000${name}`;
      const values = numericAccumulators.get(accumulatorKey) || [];
      values.push(numeric);
      numericAccumulators.set(accumulatorKey, values);
    }
    const reverse = row.reverse_scored === true || String(row.reverse_scored).toLowerCase() === "true";
    const subscale = prepText(row.subscale);
    prepRegisterVariable(
      registry,
      name,
      `${questionnaireLabel} · ${phase} — ${prepText(row.item_prompt) || itemKey}`,
      `Questionnaire · ${questionnaireLabel}`,
      `${subscale ? `Subscale: ${subscale}. ` : ""}${reverse ? "Reverse-key metadata is present. " : ""}Stored score_value is preferred when available; otherwise Analysis Lab uses the numeric response. No undocumented scale-scoring rule is applied.`
    );
    const scaleKey = `${participant}\u0000${base}`;
    const answered = answeredByScale.get(scaleKey) || new Set<string>();
    if (numeric !== null) answered.add(itemKey);
    answeredByScale.set(scaleKey, answered);
  });

  for (const [keyValue, values] of numericAccumulators) {
    const [participant, name] = keyValue.split("\u0000");
    const target = participantRows.get(participant);
    if (target) target[name] = prepMean(values) ?? "";
  }

  for (const [keyValue, answered] of answeredByScale) {
    const [participant, base] = keyValue.split("\u0000");
    const target = participantRows.get(participant);
    if (!target) continue;
    const name = `${base}_answered_items`;
    target[name] = answered.size;
    prepRegisterVariable(
      registry,
      name,
      `${base.replace(/^q_/, "").replaceAll("_", " ")} — Answered numeric items`,
      "Questionnaire preparation",
      "Count of questionnaire items with a usable numeric/scored response in the selected phase/questionnaire."
    );
  }

  const preparedRows = Array.from(participantRows.values());
  const derivedVariables = Array.from(registry.values());
  return {
    family: "questionnaire",
    familyLabel: "Questionnaire data",
    sourceLevel: isScores ? "Long-format stored scores" : "Long-format item responses",
    targetLevel: "One row per participant",
    canPrepare: preparedRows.length > 0 && derivedVariables.length > 0,
    alreadyAnalysisReady: false,
    rows: preparedRows,
    codebook: prepCodebookFromRegistry(registry),
    derivedVariables,
    notes: isScores
      ? [
          "Stored questionnaire scores are pivoted into participant-level variables for use across every Analysis Lab test.",
          "Phase and questionnaire identity are preserved in each derived variable name.",
        ]
      : [
          "Numeric/scored questionnaire items are pivoted into participant-level variables.",
          "Reverse-key metadata is preserved, but Analysis Lab does not guess undocumented total/subscale scoring rules.",
          "Use the Questionnaire scores dataset when the participant runner already produced official scale/subscale scores.",
        ],
    issue: derivedVariables.length
      ? null
      : "No numeric questionnaire scores or item responses were available to prepare.",
  };
}

function prepareAmbulatoryDataset(
  rows: AnalysisRow[],
  datasetKey: string
): AnalysisPreparationResult {
  const key = datasetKey.toLowerCase();
  const columns = prepColumns(rows);
  const participantRows = new Map<string, AnalysisRow>();
  const registry = new Map<string, PreparedVariableInfo>();

  const ensureParticipant = (participant: string, sourceRow?: AnalysisRow) => {
    const existing = participantRows.get(participant);
    if (existing) return existing;
    const created: AnalysisRow = { participant };
    if (sourceRow && !isMissingValue(sourceRow.is_test)) created.is_test = sourceRow.is_test;
    participantRows.set(participant, created);
    return created;
  };

  if (key.includes("participant_days") || columns.has("scheduled_compliance_percent")) {
    const accumulators = new Map<
      string,
      {
        days: Set<string>;
        scheduled: number;
        completed: number;
        missed: number;
        checkins: number;
        eventCheckins: number;
        dailyNumeric: number[];
      }
    >();
    rows.forEach((row, index) => {
      const participant = prepParticipantValue(row, index);
      ensureParticipant(participant, row);
      const current = accumulators.get(participant) || {
        days: new Set<string>(),
        scheduled: 0,
        completed: 0,
        missed: 0,
        checkins: 0,
        eventCheckins: 0,
        dailyNumeric: [],
      };
      const date = prepText(row.local_date);
      if (date) current.days.add(date);
      current.scheduled += toFiniteNumber(row.scheduled_prompts) ?? 0;
      current.completed += toFiniteNumber(row.scheduled_completed) ?? 0;
      current.missed += toFiniteNumber(row.scheduled_missed) ?? 0;
      current.checkins += toFiniteNumber(row.total_completed_checkins) ?? 0;
      current.eventCheckins += toFiniteNumber(row.event_checkins) ?? 0;
      const numeric = toFiniteNumber(row.mean_numeric_response);
      if (numeric !== null) current.dailyNumeric.push(numeric);
      accumulators.set(participant, current);
    });

    const definitions: Array<[string, string, string]> = [
      ["esm_days_observed", "Ambulatory — Days observed", "Number of participant-local dates represented in the participant-day dataset."],
      ["esm_scheduled_prompts", "Ambulatory — Scheduled prompts", "Total scheduled prompts represented across observed days."],
      ["esm_scheduled_completed", "Ambulatory — Scheduled prompts completed", "Total scheduled prompts marked completed."],
      ["esm_scheduled_missed", "Ambulatory — Scheduled prompts missed", "Total scheduled prompts marked missed."],
      ["esm_scheduled_compliance_percent", "Ambulatory — Scheduled compliance (%)", "Weighted scheduled compliance: completed scheduled prompts divided by all scheduled prompts."],
      ["esm_total_completed_checkins", "Ambulatory — Completed check-ins", "Total completed ambulatory check-ins across observed days."],
      ["esm_event_checkins", "Ambulatory — Event/participant-initiated check-ins", "Total completed event-contingent or participant-initiated check-ins."],
      ["esm_mean_daily_numeric_response", "Ambulatory — Mean daily numeric response", "Mean of the participant-day numeric-response summaries; not an official scale score."],
    ];
    definitions.forEach(([name, label, note]) =>
      prepRegisterVariable(registry, name, label, "Ambulatory preparation", note)
    );

    for (const [participant, current] of accumulators) {
      const target = participantRows.get(participant)!;
      target.esm_days_observed = current.days.size;
      target.esm_scheduled_prompts = current.scheduled;
      target.esm_scheduled_completed = current.completed;
      target.esm_scheduled_missed = current.missed;
      target.esm_scheduled_compliance_percent =
        current.scheduled > 0 ? (current.completed / current.scheduled) * 100 : "";
      target.esm_total_completed_checkins = current.checkins;
      target.esm_event_checkins = current.eventCheckins;
      target.esm_mean_daily_numeric_response = prepMean(current.dailyNumeric) ?? "";
    }
  } else if (key.includes("responses") || columns.has("numeric_value")) {
    type ItemAccumulator = {
      values: number[];
      label: string;
    };
    const itemValues = new Map<string, ItemAccumulator>();
    const participantMeta = new Map<
      string,
      { responses: number; checkins: Set<string>; days: Set<string> }
    >();

    rows.forEach((row, index) => {
      const participant = prepParticipantValue(row, index);
      ensureParticipant(participant, row);
      const meta = participantMeta.get(participant) || {
        responses: 0,
        checkins: new Set<string>(),
        days: new Set<string>(),
      };
      meta.responses += 1;
      const checkinId = prepText(row.checkin_id);
      const date = prepText(row.local_date);
      if (checkinId) meta.checkins.add(checkinId);
      if (date) meta.days.add(date);
      participantMeta.set(participant, meta);

      const itemKey = prepText(row.item_key) || "numeric_response";
      const numeric =
        toFiniteNumber(row.numeric_value) ?? toFiniteNumber(row.raw_response);
      if (numeric === null) return;
      const accumulatorKey = `${participant}\u0000${itemKey}`;
      const accumulator = itemValues.get(accumulatorKey) || {
        values: [],
        label: prepText(row.prompt) || itemKey,
      };
      accumulator.values.push(numeric);
      itemValues.set(accumulatorKey, accumulator);
    });

    prepRegisterVariable(registry, "esm_response_count", "Ambulatory — Response count", "Ambulatory preparation", "Number of ambulatory item-response records represented for the participant.");
    prepRegisterVariable(registry, "esm_checkin_count", "Ambulatory — Check-in count", "Ambulatory preparation", "Number of distinct ambulatory check-ins represented for the participant.");
    prepRegisterVariable(registry, "esm_active_days", "Ambulatory — Active days", "Ambulatory preparation", "Number of participant-local dates with represented ambulatory responses.");

    for (const [participant, meta] of participantMeta) {
      const target = participantRows.get(participant)!;
      target.esm_response_count = meta.responses;
      target.esm_checkin_count = meta.checkins.size;
      target.esm_active_days = meta.days.size;
    }

    for (const [keyValue, accumulator] of itemValues) {
      const [participant, itemKey] = keyValue.split("\u0000");
      const target = participantRows.get(participant);
      if (!target) continue;
      const prefix = `esm_${prepSafeVariable(itemKey)}`;
      const definitions: Array<[string, string, number | null, string]> = [
        [`${prefix}_n`, `${accumulator.label} — Observations`, accumulator.values.length, "Number of usable numeric observations for this ambulatory item."],
        [`${prefix}_mean`, `${accumulator.label} — Within-person mean`, prepMean(accumulator.values), "Participant's mean response across repeated observations for this ambulatory item."],
        [`${prefix}_median`, `${accumulator.label} — Within-person median`, prepMedian(accumulator.values), "Participant's median response across repeated observations for this ambulatory item."],
        [`${prefix}_sd`, `${accumulator.label} — Within-person SD`, prepSd(accumulator.values), "Within-person sample standard deviation across repeated observations for this ambulatory item."],
        [`${prefix}_min`, `${accumulator.label} — Minimum`, accumulator.values.length ? Math.min(...accumulator.values) : null, "Minimum repeated response for this participant and item."],
        [`${prefix}_max`, `${accumulator.label} — Maximum`, accumulator.values.length ? Math.max(...accumulator.values) : null, "Maximum repeated response for this participant and item."],
      ];
      for (const [name, label, value, note] of definitions) {
        target[name] = value ?? "";
        prepRegisterVariable(registry, name, label, "Ambulatory item summary", note);
      }
    }
  } else if (key.includes("checkins") || columns.has("response_latency_minutes")) {
    const accumulators = new Map<
      string,
      {
        checkins: number;
        days: Set<string>;
        latencies: number[];
        responseCounts: number[];
        eventCheckins: number;
      }
    >();
    rows.forEach((row, index) => {
      const participant = prepParticipantValue(row, index);
      ensureParticipant(participant, row);
      const current = accumulators.get(participant) || {
        checkins: 0,
        days: new Set<string>(),
        latencies: [],
        responseCounts: [],
        eventCheckins: 0,
      };
      current.checkins += 1;
      const date = prepText(row.local_date);
      if (date) current.days.add(date);
      const latency = toFiniteNumber(row.response_latency_minutes);
      const responseCount = toFiniteNumber(row.item_responses);
      if (latency !== null) current.latencies.push(latency);
      if (responseCount !== null) current.responseCounts.push(responseCount);
      const trigger = prepText(row.trigger_type).toLowerCase();
      if (trigger === "event_contingent" || trigger === "participant_initiated") {
        current.eventCheckins += 1;
      }
      accumulators.set(participant, current);
    });
    const definitions: Array<[string, string, string]> = [
      ["esm_checkin_count", "Ambulatory — Check-in count", "Number of represented ambulatory check-ins."],
      ["esm_active_days", "Ambulatory — Active days", "Number of participant-local dates with a represented check-in."],
      ["esm_mean_response_latency_minutes", "Ambulatory — Mean response latency (minutes)", "Mean scheduled-to-completion latency when available."],
      ["esm_mean_items_per_checkin", "Ambulatory — Mean item responses per check-in", "Mean number of stored item responses per represented check-in."],
      ["esm_event_checkins", "Ambulatory — Event/participant-initiated check-ins", "Count of event-contingent or participant-initiated check-ins."],
    ];
    definitions.forEach(([name, label, note]) =>
      prepRegisterVariable(registry, name, label, "Ambulatory preparation", note)
    );
    for (const [participant, current] of accumulators) {
      const target = participantRows.get(participant)!;
      target.esm_checkin_count = current.checkins;
      target.esm_active_days = current.days.size;
      target.esm_mean_response_latency_minutes = prepMean(current.latencies) ?? "";
      target.esm_mean_items_per_checkin = prepMean(current.responseCounts) ?? "";
      target.esm_event_checkins = current.eventCheckins;
    }
  } else {
    const housekeeping = new Set([
      "participant",
      "participant_id",
      "participant_key",
      "participant_code",
      "is_test",
      "checkin_id",
      "prompt_instance_id",
      "local_date",
      "schedule_key",
      "checkin",
      "trigger_type",
      "trigger_source",
      "scheduled_for",
      "opened_at",
      "started_at",
      "completed_at",
      "answered_at",
    ]);
    const candidateColumns = Array.from(columns).filter((column) => !housekeeping.has(column));
    const values = new Map<string, number[]>();
    const participantCounts = new Map<string, number>();
    rows.forEach((row, index) => {
      const participant = prepParticipantValue(row, index);
      ensureParticipant(participant, row);
      participantCounts.set(participant, (participantCounts.get(participant) || 0) + 1);
      for (const column of candidateColumns) {
        const numeric = toFiniteNumber(row[column]);
        if (numeric === null) continue;
        const mapKey = `${participant}\u0000${column}`;
        const accumulator = values.get(mapKey) || [];
        accumulator.push(numeric);
        values.set(mapKey, accumulator);
      }
    });
    prepRegisterVariable(registry, "esm_observation_rows", "Ambulatory — Observation rows", "Ambulatory preparation", "Number of source rows represented for this participant.");
    for (const [participant, count] of participantCounts) {
      participantRows.get(participant)!.esm_observation_rows = count;
    }
    for (const [keyValue, numericValues] of values) {
      const [participant, column] = keyValue.split("\u0000");
      const target = participantRows.get(participant);
      if (!target) continue;
      const prefix = `esm_${prepSafeVariable(column)}`;
      const meanName = `${prefix}_mean`;
      const sdName = `${prefix}_sd`;
      const nName = `${prefix}_n`;
      target[meanName] = prepMean(numericValues) ?? "";
      target[sdName] = prepSd(numericValues) ?? "";
      target[nName] = numericValues.length;
      prepRegisterVariable(registry, meanName, `${column} — Within-person mean`, "Ambulatory preparation", `Participant-level mean of ${column}.`);
      prepRegisterVariable(registry, sdName, `${column} — Within-person SD`, "Ambulatory preparation", `Within-person sample SD of ${column}.`);
      prepRegisterVariable(registry, nName, `${column} — Observations`, "Ambulatory preparation", `Number of usable ${column} observations.`);
    }
  }

  const preparedRows = Array.from(participantRows.values());
  const derivedVariables = Array.from(registry.values());
  return {
    family: "ambulatory",
    familyLabel: "Ambulatory / ESM data",
    sourceLevel: key.includes("participant_days")
      ? "Participant × day level"
      : key.includes("responses")
        ? "Repeated item-response level"
        : key.includes("checkins")
          ? "Repeated check-in level"
          : "Repeated ambulatory observations",
    targetLevel: "One row per participant",
    canPrepare: preparedRows.length > 0 && derivedVariables.length > 0,
    alreadyAnalysisReady: false,
    rows: preparedRows,
    codebook: prepCodebookFromRegistry(registry),
    derivedVariables,
    notes: [
      "Repeated ambulatory observations are summarized into participant-level variables for ordinary between-person analyses.",
      "Within-person means, variability and observation counts remain available as separate derived variables.",
      "Raw repeated rows remain one click away and should be used for the future mixed/multilevel model workflow.",
    ],
    issue: null,
  };
}

export function prepareAnalysisDataset(
  rows: AnalysisRow[],
  codebook: AnalysisCodebookVariable[] = [],
  options: AnalysisPreparationOptions = {}
): AnalysisPreparationResult {
  const datasetKey = String(options.datasetKey || "").trim();
  const family = prepInferFamily(rows, datasetKey);

  if (family === "analysis_ready") {
    return {
      family,
      familyLabel: "Analysis-ready participant data",
      sourceLevel: "One row per participant",
      targetLevel: "Already analysis-ready",
      canPrepare: false,
      alreadyAnalysisReady: true,
      rows,
      codebook,
      derivedVariables: [],
      notes: [
        "This PsyLattice dataset is already participant-level and combines study variables for general statistical analysis.",
        "Use raw long-format datasets when you specifically need trial-, item-, check-in-, or time-level analyses.",
      ],
      issue: null,
    };
  }

  if (family === "cognitive") {
    return prepareCognitiveDataset(rows, options);
  }
  if (family === "questionnaire") {
    return prepareQuestionnaireDataset(rows, datasetKey);
  }
  if (family === "ambulatory") {
    return prepareAmbulatoryDataset(rows, datasetKey);
  }

  return {
    family: "generic",
    familyLabel: datasetKey ? "General dataset" : "External / general dataset",
    sourceLevel: "Current rows",
    targetLevel: "No automatic transformation",
    canPrepare: false,
    alreadyAnalysisReady: false,
    rows,
    codebook,
    derivedVariables: [],
    notes: [
      "Analysis Lab will analyze this dataset as supplied.",
      "Automatic PsyLattice preparation activates only when a supported native questionnaire, cognitive, ambulatory, or analysis-ready schema is detected.",
    ],
    issue: null,
  };
}

// -----------------------------------------------------------------------------
// Analysis data workbench: non-destructive filters, recodes, transforms,
// computed variables, missingness inspection, and transparent sample tracking.
// -----------------------------------------------------------------------------

export type AnalysisFilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_missing"
  | "not_missing";

export type AnalysisFilterRule = {
  id: string;
  variable: string;
  operator: AnalysisFilterOperator;
  value?: string;
  enabled?: boolean;
};

export type AnalysisNumericTransformKind =
  | "zscore"
  | "center"
  | "ln"
  | "log10"
  | "sqrt"
  | "absolute";

export type AnalysisNumericTransform = {
  id: string;
  sourceVariable: string;
  outputVariable: string;
  label?: string;
  kind: AnalysisNumericTransformKind;
};

export type AnalysisComputedOperation =
  | "difference"
  | "sum"
  | "mean"
  | "ratio"
  | "product";

export type AnalysisComputedVariable = {
  id: string;
  leftVariable: string;
  rightVariable: string;
  outputVariable: string;
  label?: string;
  operation: AnalysisComputedOperation;
};

export type AnalysisRecodeMapping = {
  from: string;
  to: string;
};

export type AnalysisRecodeDefinition = {
  id: string;
  sourceVariable: string;
  outputVariable: string;
  label?: string;
  mappings: AnalysisRecodeMapping[];
  keepUnmapped?: boolean;
};

export type AnalysisRepeatedOperationKind =
  | "observation_index"
  | "elapsed_time"
  | "cluster_mean"
  | "within_cluster_center"
  | "lag1"
  | "change_from_previous";

export type AnalysisRepeatedOperation = {
  id: string;
  clusterVariable: string;
  timeVariable?: string;
  sourceVariable?: string;
  outputVariable: string;
  label?: string;
  kind: AnalysisRepeatedOperationKind;
};

export type AnalysisVariableOperationResult = {
  rows: AnalysisRow[];
  codebook: AnalysisCodebookVariable[];
  createdVariables: string[];
  issues: string[];
};

export type AnalysisFilterResult = {
  rows: AnalysisRow[];
  sourceCount: number;
  includedCount: number;
  excludedCount: number;
  ruleMatches: Array<{
    id: string;
    variable: string;
    matched: number;
  }>;
};

export type AnalysisMissingnessVariable = {
  variable: string;
  label: string;
  missing: number;
  valid: number;
  missingPercent: number;
};

export type AnalysisMissingnessProfile = {
  totalRows: number;
  completeRows: number;
  rowsWithAnyMissing: number;
  variables: AnalysisMissingnessVariable[];
};

function normalizedWorkbenchText(value: unknown) {
  return asStableText(value).trim().toLowerCase();
}

function safeWorkbenchVariableName(value: string, fallback = "derived_variable") {
  const normalized = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return normalized || fallback;
}

function numericTransformValue(kind: AnalysisNumericTransformKind, value: number, mean: number, sd: number | null) {
  if (kind === "center") return value - mean;
  if (kind === "zscore") return sd && sd > 0 ? (value - mean) / sd : null;
  if (kind === "ln") return value > 0 ? Math.log(value) : null;
  if (kind === "log10") return value > 0 ? Math.log10(value) : null;
  if (kind === "sqrt") return value >= 0 ? Math.sqrt(value) : null;
  if (kind === "absolute") return Math.abs(value);
  return null;
}

function repeatedTimeValue(value: unknown): { value: number; datetime: boolean } | null {
  const numeric = toFiniteNumber(value);
  if (numeric !== null) return { value: numeric, datetime: false };
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return { value: parsed, datetime: true };
  }
  return null;
}

function repeatedClusterKey(value: unknown) {
  if (isMissingValue(value)) return null;
  return asStableText(value);
}

export function applyAnalysisVariableOperations(
  rows: AnalysisRow[],
  codebook: AnalysisCodebookVariable[] = [],
  options: {
    transforms?: AnalysisNumericTransform[];
    computed?: AnalysisComputedVariable[];
    recodes?: AnalysisRecodeDefinition[];
    repeated?: AnalysisRepeatedOperation[];
  } = {}
): AnalysisVariableOperationResult {
  const transforms = options.transforms || [];
  const computed = options.computed || [];
  const recodes = options.recodes || [];
  const repeated = options.repeated || [];
  const issues: string[] = [];
  const createdVariables: string[] = [];
  let nextRows = rows.map((row) => ({ ...row }));
  const nextCodebook = [...codebook];
  const existingNames = new Set(Array.from(new Set(nextRows.flatMap((row) => Object.keys(row)))));

  const addCodebookEntry = (entry: AnalysisCodebookVariable) => {
    const index = nextCodebook.findIndex((item) => item.variable === entry.variable);
    if (index >= 0) nextCodebook[index] = { ...nextCodebook[index], ...entry };
    else nextCodebook.push(entry);
  };

  for (const transform of transforms) {
    if (!transform.sourceVariable) continue;
    const outputVariable = safeWorkbenchVariableName(transform.outputVariable, `${transform.sourceVariable}_${transform.kind}`);
    if (existingNames.has(outputVariable)) {
      issues.push(`Skipped ${outputVariable}: a variable with this name already exists.`);
      continue;
    }
    const numeric = nextRows
      .map((row) => toFiniteNumber(row[transform.sourceVariable]))
      .filter((value): value is number => value !== null);
    if (numeric.length === 0) {
      issues.push(`Skipped ${outputVariable}: ${transform.sourceVariable} has no numeric values.`);
      continue;
    }
    const mean = numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
    const variance = numeric.length > 1
      ? numeric.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (numeric.length - 1)
      : 0;
    const sd = variance > 0 ? Math.sqrt(variance) : null;
    nextRows = nextRows.map((row) => {
      const raw = toFiniteNumber(row[transform.sourceVariable]);
      return {
        ...row,
        [outputVariable]: raw === null ? null : numericTransformValue(transform.kind, raw, mean, sd),
      };
    });
    existingNames.add(outputVariable);
    createdVariables.push(outputVariable);
    addCodebookEntry({
      variable: outputVariable,
      label: transform.label || outputVariable.replaceAll("_", " "),
      type: "continuous",
      source: "Analysis Lab · derived",
      notes: `${transform.kind} transform of ${transform.sourceVariable}. Non-destructive analysis-view variable.`,
    });
  }

  for (const definition of computed) {
    if (!definition.leftVariable || !definition.rightVariable) continue;
    const outputVariable = safeWorkbenchVariableName(definition.outputVariable, `${definition.leftVariable}_${definition.operation}_${definition.rightVariable}`);
    if (existingNames.has(outputVariable)) {
      issues.push(`Skipped ${outputVariable}: a variable with this name already exists.`);
      continue;
    }
    nextRows = nextRows.map((row) => {
      const left = toFiniteNumber(row[definition.leftVariable]);
      const right = toFiniteNumber(row[definition.rightVariable]);
      let value: number | null = null;
      if (left !== null && right !== null) {
        if (definition.operation === "difference") value = left - right;
        else if (definition.operation === "sum") value = left + right;
        else if (definition.operation === "mean") value = (left + right) / 2;
        else if (definition.operation === "product") value = left * right;
        else if (definition.operation === "ratio") value = right === 0 ? null : left / right;
      }
      return { ...row, [outputVariable]: value };
    });
    existingNames.add(outputVariable);
    createdVariables.push(outputVariable);
    addCodebookEntry({
      variable: outputVariable,
      label: definition.label || outputVariable.replaceAll("_", " "),
      type: "continuous",
      source: "Analysis Lab · computed",
      notes: `${definition.operation} of ${definition.leftVariable} and ${definition.rightVariable}. Non-destructive analysis-view variable.`,
    });
  }

  for (const recode of recodes) {
    if (!recode.sourceVariable || recode.mappings.length === 0) continue;
    const outputVariable = safeWorkbenchVariableName(recode.outputVariable, `${recode.sourceVariable}_recoded`);
    if (existingNames.has(outputVariable)) {
      issues.push(`Skipped ${outputVariable}: a variable with this name already exists.`);
      continue;
    }
    const mapping = new Map(recode.mappings.map((item) => [normalizedWorkbenchText(item.from), item.to]));
    nextRows = nextRows.map((row) => {
      const raw = row[recode.sourceVariable];
      if (isMissingValue(raw)) return { ...row, [outputVariable]: null };
      const mapped = mapping.get(normalizedWorkbenchText(raw));
      return {
        ...row,
        [outputVariable]: mapped !== undefined ? mapped : recode.keepUnmapped === false ? null : raw,
      };
    });
    existingNames.add(outputVariable);
    createdVariables.push(outputVariable);
    addCodebookEntry({
      variable: outputVariable,
      label: recode.label || outputVariable.replaceAll("_", " "),
      type: "nominal",
      source: "Analysis Lab · recoded",
      notes: `Recoded from ${recode.sourceVariable}. Non-destructive analysis-view variable.`,
    });
  }

  for (const operation of repeated) {
    if (!operation.clusterVariable) continue;
    const fallbackSuffix = operation.kind === "observation_index"
      ? "observation_index"
      : operation.kind === "elapsed_time"
        ? "elapsed_time"
        : operation.kind === "cluster_mean"
          ? "person_mean"
          : operation.kind === "within_cluster_center"
            ? "within_person_centered"
            : operation.kind === "lag1"
              ? "lag1"
              : "change_from_previous";
    const fallbackSource = operation.sourceVariable || operation.timeVariable || operation.clusterVariable;
    const outputVariable = safeWorkbenchVariableName(operation.outputVariable, `${fallbackSource}_${fallbackSuffix}`);
    if (existingNames.has(outputVariable)) {
      issues.push(`Skipped ${outputVariable}: a variable with this name already exists.`);
      continue;
    }

    const requiresTime = operation.kind === "observation_index" || operation.kind === "elapsed_time" || operation.kind === "lag1" || operation.kind === "change_from_previous";
    const requiresSource = operation.kind === "cluster_mean" || operation.kind === "within_cluster_center" || operation.kind === "lag1" || operation.kind === "change_from_previous";
    if (requiresTime && !operation.timeVariable) {
      issues.push(`Skipped ${outputVariable}: this repeated-data operation requires a time/order variable.`);
      continue;
    }
    if (requiresSource && !operation.sourceVariable) {
      issues.push(`Skipped ${outputVariable}: this repeated-data operation requires a numeric source variable.`);
      continue;
    }

    const groups = new Map<string, number[]>();
    nextRows.forEach((row, index) => {
      const key = repeatedClusterKey(row[operation.clusterVariable]);
      if (key === null) return;
      const current = groups.get(key) || [];
      current.push(index);
      groups.set(key, current);
    });
    if (groups.size === 0) {
      issues.push(`Skipped ${outputVariable}: ${operation.clusterVariable} has no usable cluster identifiers.`);
      continue;
    }

    const output: Array<number | null> = Array(nextRows.length).fill(null);
    let datetimeTime = false;
    let usableValues = 0;

    for (const indices of groups.values()) {
      if (operation.kind === "cluster_mean" || operation.kind === "within_cluster_center") {
        const values = indices
          .map((index) => toFiniteNumber(nextRows[index][operation.sourceVariable as string]))
          .filter((value): value is number => value !== null);
        if (values.length === 0) continue;
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        for (const index of indices) {
          const raw = toFiniteNumber(nextRows[index][operation.sourceVariable as string]);
          if (operation.kind === "cluster_mean") {
            output[index] = mean;
            usableValues += 1;
          } else if (raw !== null) {
            output[index] = raw - mean;
            usableValues += 1;
          }
        }
        continue;
      }

      const ordered = indices
        .map((index) => {
          const parsed = repeatedTimeValue(nextRows[index][operation.timeVariable as string]);
          if (parsed?.datetime) datetimeTime = true;
          return parsed ? { index, time: parsed.value } : null;
        })
        .filter((entry): entry is { index: number; time: number } => entry !== null)
        .sort((a, b) => a.time - b.time || a.index - b.index);
      if (ordered.length === 0) continue;

      if (operation.kind === "observation_index") {
        ordered.forEach((entry, orderIndex) => {
          output[entry.index] = orderIndex + 1;
          usableValues += 1;
        });
        continue;
      }

      if (operation.kind === "elapsed_time") {
        const first = ordered[0].time;
        ordered.forEach((entry) => {
          const difference = entry.time - first;
          output[entry.index] = datetimeTime ? difference / 3_600_000 : difference;
          usableValues += 1;
        });
        continue;
      }

      let previousValue: number | null = null;
      ordered.forEach((entry) => {
        const currentValue = toFiniteNumber(nextRows[entry.index][operation.sourceVariable as string]);
        if (previousValue !== null) {
          if (operation.kind === "lag1") {
            output[entry.index] = previousValue;
            usableValues += 1;
          } else if (operation.kind === "change_from_previous" && currentValue !== null) {
            output[entry.index] = currentValue - previousValue;
            usableValues += 1;
          }
        }
        if (currentValue !== null) previousValue = currentValue;
      });
    }

    if (usableValues === 0) {
      issues.push(`Skipped ${outputVariable}: no usable repeated observations were available for this operation.`);
      continue;
    }

    nextRows = nextRows.map((row, index) => ({ ...row, [outputVariable]: output[index] }));
    existingNames.add(outputVariable);
    createdVariables.push(outputVariable);
    const sourceDescription = operation.sourceVariable ? ` using ${operation.sourceVariable}` : "";
    const timeDescription = operation.timeVariable ? ` ordered by ${operation.timeVariable}` : "";
    const kindDescription = operation.kind === "observation_index"
      ? "Within-cluster observation sequence"
      : operation.kind === "elapsed_time"
        ? `Within-cluster elapsed ${datetimeTime ? "hours" : "time units"}`
        : operation.kind === "cluster_mean"
          ? "Cluster/person mean"
          : operation.kind === "within_cluster_center"
            ? "Within-cluster/person-mean centered value"
            : operation.kind === "lag1"
              ? "Previous-observation lag"
              : "Change from the previous observation";
    addCodebookEntry({
      variable: outputVariable,
      label: operation.label || outputVariable.replaceAll("_", " "),
      type: "continuous",
      source: "Analysis Lab · repeated-data preparation",
      notes: `${kindDescription}${sourceDescription}${timeDescription}. Non-destructive analysis-view variable.`,
    });
  }

  return { rows: nextRows, codebook: nextCodebook, createdVariables, issues };
}

function filterRuleMatches(row: AnalysisRow, rule: AnalysisFilterRule) {
  if (rule.enabled === false || !rule.variable) return true;
  const raw = row[rule.variable];
  if (rule.operator === "is_missing") return isMissingValue(raw);
  if (rule.operator === "not_missing") return !isMissingValue(raw);
  if (isMissingValue(raw)) return false;

  const expectedText = String(rule.value ?? "").trim();
  const actualText = normalizedWorkbenchText(raw);
  const expectedNormalized = expectedText.toLowerCase();

  if (rule.operator === "equals") return actualText === expectedNormalized;
  if (rule.operator === "not_equals") return actualText !== expectedNormalized;
  if (rule.operator === "contains") return actualText.includes(expectedNormalized);
  if (rule.operator === "not_contains") return !actualText.includes(expectedNormalized);

  const actualNumber = toFiniteNumber(raw);
  const expectedNumber = toFiniteNumber(expectedText);
  if (actualNumber === null || expectedNumber === null) return false;
  if (rule.operator === "gt") return actualNumber > expectedNumber;
  if (rule.operator === "gte") return actualNumber >= expectedNumber;
  if (rule.operator === "lt") return actualNumber < expectedNumber;
  if (rule.operator === "lte") return actualNumber <= expectedNumber;
  return true;
}

export function applyAnalysisFilters(rows: AnalysisRow[], rules: AnalysisFilterRule[] = []): AnalysisFilterResult {
  const enabled = rules.filter((rule) => rule.enabled !== false && rule.variable);
  if (enabled.length === 0) {
    return { rows, sourceCount: rows.length, includedCount: rows.length, excludedCount: 0, ruleMatches: [] };
  }

  const ruleMatches = enabled.map((rule) => ({
    id: rule.id,
    variable: rule.variable,
    matched: rows.reduce((count, row) => count + (filterRuleMatches(row, rule) ? 1 : 0), 0),
  }));
  const filtered = rows.filter((row) => enabled.every((rule) => filterRuleMatches(row, rule)));
  return {
    rows: filtered,
    sourceCount: rows.length,
    includedCount: filtered.length,
    excludedCount: rows.length - filtered.length,
    ruleMatches,
  };
}

export function computeAnalysisMissingnessProfile(
  rows: AnalysisRow[],
  codebook: AnalysisCodebookVariable[] = [],
  variableNames?: string[]
): AnalysisMissingnessProfile {
  const inferred = inferAnalysisVariables(rows, codebook);
  const selected = variableNames && variableNames.length > 0
    ? inferred.filter((variable) => variableNames.includes(variable.name))
    : inferred;
  const names = selected.map((variable) => variable.name);
  let completeRows = 0;
  for (const row of rows) {
    if (names.every((name) => !isMissingValue(row[name]))) completeRows += 1;
  }
  return {
    totalRows: rows.length,
    completeRows,
    rowsWithAnyMissing: rows.length - completeRows,
    variables: selected
      .map((variable) => ({
        variable: variable.name,
        label: variable.label,
        missing: variable.missingCount,
        valid: variable.validCount,
        missingPercent: rows.length ? (variable.missingCount / rows.length) * 100 : 0,
      }))
      .sort((a, b) => b.missingPercent - a.missingPercent || a.label.localeCompare(b.label)),
  };
}

export type AnalysisMissingnessPattern = {
  signature: string;
  count: number;
  percent: number;
  observedCount: number;
  missingCount: number;
  observedVariables: string[];
  missingVariables: string[];
  observedLabels: string[];
  missingLabels: string[];
};

export type AnalysisMissingnessPatternsResult = {
  totalRows: number;
  variables: Array<{ name: string; label: string }>;
  patterns: AnalysisMissingnessPattern[];
  otherPatternCount: number;
  otherRowCount: number;
};

export type AnalysisPairwiseAvailabilityCell = {
  rowVariable: string;
  columnVariable: string;
  n: number;
  percent: number;
};

export type AnalysisPairwiseAvailabilityResult = {
  totalRows: number;
  variables: Array<{ name: string; label: string }>;
  cells: AnalysisPairwiseAvailabilityCell[];
};

export type AnalysisSampleAuditResult = {
  sourceRows: number;
  workingRows: number;
  afterFiltersRows: number;
  explicitlyExcludedRows: number;
  completeAcrossSetupRows: number;
  incompleteAcrossSetupRows: number;
  requiredVariables: Array<{ variable: string; label: string; valid: number; missing: number; missingPercent: number }>;
};

export function computeAnalysisMissingnessPatterns(
  rows: AnalysisRow[],
  codebook: AnalysisCodebookVariable[] = [],
  variableNames: string[] = [],
  maxPatterns = 12
): AnalysisMissingnessPatternsResult {
  const inferred = inferAnalysisVariables(rows, codebook);
  const requested = variableNames.length > 0
    ? variableNames.filter((name) => inferred.some((variable) => variable.name === name))
    : inferred.slice(0, 10).map((variable) => variable.name);
  const uniqueNames = Array.from(new Set(requested)).slice(0, 14);
  const variables = uniqueNames.map((name) => {
    const variable = inferred.find((item) => item.name === name);
    return { name, label: variable?.label || name };
  });
  const counts = new Map<string, number>();
  for (const row of rows) {
    const signature = variables.map((variable) => isMissingValue(row[variable.name]) ? "0" : "1").join("");
    counts.set(signature, (counts.get(signature) || 0) + 1);
  }
  const allPatterns = Array.from(counts.entries())
    .map(([signature, count]) => {
      const observedVariables: string[] = [];
      const missingVariables: string[] = [];
      const observedLabels: string[] = [];
      const missingLabels: string[] = [];
      variables.forEach((variable, index) => {
        if (signature[index] === "1") {
          observedVariables.push(variable.name);
          observedLabels.push(variable.label);
        } else {
          missingVariables.push(variable.name);
          missingLabels.push(variable.label);
        }
      });
      return {
        signature,
        count,
        percent: rows.length ? (count / rows.length) * 100 : 0,
        observedCount: observedVariables.length,
        missingCount: missingVariables.length,
        observedVariables,
        missingVariables,
        observedLabels,
        missingLabels,
      } as AnalysisMissingnessPattern;
    })
    .sort((a, b) => b.count - a.count || a.missingCount - b.missingCount || a.signature.localeCompare(b.signature));
  const limit = Math.max(1, Math.min(30, Math.floor(maxPatterns || 12)));
  const patterns = allPatterns.slice(0, limit);
  const omitted = allPatterns.slice(limit);
  return {
    totalRows: rows.length,
    variables,
    patterns,
    otherPatternCount: omitted.length,
    otherRowCount: omitted.reduce((sum, pattern) => sum + pattern.count, 0),
  };
}

export function computeAnalysisPairwiseAvailability(
  rows: AnalysisRow[],
  codebook: AnalysisCodebookVariable[] = [],
  variableNames: string[] = []
): AnalysisPairwiseAvailabilityResult {
  const inferred = inferAnalysisVariables(rows, codebook);
  const requested = variableNames.length > 0
    ? variableNames.filter((name) => inferred.some((variable) => variable.name === name))
    : inferred.slice(0, 10).map((variable) => variable.name);
  const uniqueNames = Array.from(new Set(requested)).slice(0, 12);
  const variables = uniqueNames.map((name) => {
    const variable = inferred.find((item) => item.name === name);
    return { name, label: variable?.label || name };
  });
  const cells: AnalysisPairwiseAvailabilityCell[] = [];
  for (const rowVariable of variables) {
    for (const columnVariable of variables) {
      let n = 0;
      for (const row of rows) {
        if (!isMissingValue(row[rowVariable.name]) && !isMissingValue(row[columnVariable.name])) n += 1;
      }
      cells.push({
        rowVariable: rowVariable.name,
        columnVariable: columnVariable.name,
        n,
        percent: rows.length ? (n / rows.length) * 100 : 0,
      });
    }
  }
  return { totalRows: rows.length, variables, cells };
}

export function computeAnalysisSampleAudit(options: {
  sourceRows: number;
  workingRows: AnalysisRow[];
  filteredRows: AnalysisRow[];
  codebook?: AnalysisCodebookVariable[];
  requiredVariables?: string[];
}): AnalysisSampleAuditResult {
  const requiredVariables = Array.from(new Set((options.requiredVariables || []).filter(Boolean)));
  const inferred = inferAnalysisVariables(options.filteredRows, options.codebook || []);
  const completeAcrossSetupRows = requiredVariables.length === 0
    ? options.filteredRows.length
    : options.filteredRows.reduce((count, row) => count + (requiredVariables.every((name) => !isMissingValue(row[name])) ? 1 : 0), 0);
  const required = requiredVariables.map((name) => {
    const variable = inferred.find((item) => item.name === name);
    let valid = 0;
    for (const row of options.filteredRows) if (!isMissingValue(row[name])) valid += 1;
    const missing = options.filteredRows.length - valid;
    return {
      variable: name,
      label: variable?.label || name,
      valid,
      missing,
      missingPercent: options.filteredRows.length ? (missing / options.filteredRows.length) * 100 : 0,
    };
  });
  return {
    sourceRows: Math.max(0, Math.floor(options.sourceRows || 0)),
    workingRows: options.workingRows.length,
    afterFiltersRows: options.filteredRows.length,
    explicitlyExcludedRows: Math.max(0, options.workingRows.length - options.filteredRows.length),
    completeAcrossSetupRows,
    incompleteAcrossSetupRows: Math.max(0, options.filteredRows.length - completeAcrossSetupRows),
    requiredVariables: required,
  };
}

// -----------------------------------------------------------------------------
// Analysis Lab visualization layer
// -----------------------------------------------------------------------------

export type VisualizationScatterPoint = {
  index: number;
  x: number;
  y: number;
  group: string;
};

export type VisualizationTrendLine = {
  group: string;
  n: number;
  slope: number | null;
  intercept: number | null;
  r: number | null;
};

export type VisualizationScatterResult = {
  xVariable: string;
  xLabel: string;
  yVariable: string;
  yLabel: string;
  groupVariable: string | null;
  groupLabel: string | null;
  n: number;
  points: VisualizationScatterPoint[];
  groups: string[];
  overallTrend: VisualizationTrendLine;
  groupTrends: VisualizationTrendLine[];
  issue: string | null;
};

export type VisualizationDensityPoint = {
  value: number;
  density: number;
};

export type VisualizationDistributionGroup = {
  group: string;
  n: number;
  mean: number | null;
  sd: number | null;
  median: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  whiskerLow: number | null;
  whiskerHigh: number | null;
  minimum: number | null;
  maximum: number | null;
  outliers: number[];
  density: VisualizationDensityPoint[];
};

export type VisualizationDistributionResult = {
  outcomeVariable: string;
  outcomeLabel: string;
  groupVariable: string | null;
  groupLabel: string | null;
  totalN: number;
  groups: VisualizationDistributionGroup[];
  issue: string | null;
};

export type VisualizationMeanPoint = {
  group: string;
  n: number;
  mean: number | null;
  sd: number | null;
  se: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type VisualizationMeansResult = {
  outcomeVariable: string;
  outcomeLabel: string;
  groupVariable: string;
  groupLabel: string;
  totalN: number;
  points: VisualizationMeanPoint[];
  issue: string | null;
};

export type VisualizationInteractionCell = {
  xLevel: string;
  traceLevel: string;
  n: number;
  mean: number | null;
  sd: number | null;
  se: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type VisualizationInteractionResult = {
  outcomeVariable: string;
  outcomeLabel: string;
  xFactor: string;
  xFactorLabel: string;
  traceFactor: string;
  traceFactorLabel: string;
  totalN: number;
  xLevels: string[];
  traceLevels: string[];
  cells: VisualizationInteractionCell[];
  issue: string | null;
};

function visualizationTrend(values: Array<{ x: number; y: number }>, group = "All observations"): VisualizationTrendLine {
  const n = values.length;
  if (n < 2) return { group, n, slope: null, intercept: null, r: null };
  const meanX = values.reduce((sum, point) => sum + point.x, 0) / n;
  const meanY = values.reduce((sum, point) => sum + point.y, 0) / n;
  let ssX = 0;
  let ssY = 0;
  let cross = 0;
  for (const point of values) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    ssX += dx * dx;
    ssY += dy * dy;
    cross += dx * dy;
  }
  const slope = ssX > 0 ? cross / ssX : null;
  const intercept = slope === null ? null : meanY - slope * meanX;
  const r = ssX > 0 && ssY > 0 ? Math.max(-1, Math.min(1, cross / Math.sqrt(ssX * ssY))) : null;
  return { group, n, slope, intercept, r };
}

export function computeVisualizationScatter(
  rows: AnalysisRow[],
  xVariable: AnalysisVariable | null,
  yVariable: AnalysisVariable | null,
  groupVariable?: AnalysisVariable | null
): VisualizationScatterResult {
  const base: VisualizationScatterResult = {
    xVariable: xVariable?.name || "",
    xLabel: xVariable?.label || "X",
    yVariable: yVariable?.name || "",
    yLabel: yVariable?.label || "Y",
    groupVariable: groupVariable?.name || null,
    groupLabel: groupVariable?.label || null,
    n: 0,
    points: [],
    groups: [],
    overallTrend: { group: "All observations", n: 0, slope: null, intercept: null, r: null },
    groupTrends: [],
    issue: null,
  };
  if (!xVariable || !yVariable) return { ...base, issue: "Choose numeric X and Y variables." };
  if (xVariable.name === yVariable.name) return { ...base, issue: "X and Y must be different variables." };

  const points: VisualizationScatterPoint[] = [];
  const groups: string[] = [];
  const seenGroups = new Set<string>();
  rows.forEach((row, index) => {
    const x = toFiniteNumber(row[xVariable.name]);
    const y = toFiniteNumber(row[yVariable.name]);
    if (x === null || y === null) return;
    let group = "All observations";
    if (groupVariable) {
      if (isMissingValue(row[groupVariable.name])) return;
      group = asStableText(row[groupVariable.name]);
    }
    points.push({ index, x, y, group });
    if (!seenGroups.has(group)) {
      seenGroups.add(group);
      groups.push(group);
    }
  });
  if (points.length < 2) return { ...base, n: points.length, points, groups, issue: "At least two complete X–Y observations are required." };

  const overallTrend = visualizationTrend(points.map(({ x, y }) => ({ x, y })));
  const groupTrends = groups.map((group) => visualizationTrend(points.filter((point) => point.group === group), group));
  return { ...base, n: points.length, points, groups, overallTrend, groupTrends };
}

function visualizationKde(values: number[], minimum: number, maximum: number, pointCount = 48): VisualizationDensityPoint[] {
  if (values.length < 2 || !Number.isFinite(minimum) || !Number.isFinite(maximum)) return [];
  const sd = standardDeviation(values) ?? 0;
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q1 === null || q3 === null ? 0 : q3 - q1;
  const robustScale = iqr > 0 ? iqr / 1.34 : 0;
  const scaleCandidates = [sd, robustScale].filter((value) => value > 0 && Number.isFinite(value));
  const scale = scaleCandidates.length ? Math.min(...scaleCandidates) : Math.max((maximum - minimum) / 6, 1e-6);
  let bandwidth = 0.9 * scale * Math.pow(values.length, -0.2);
  if (!Number.isFinite(bandwidth) || bandwidth <= 0) bandwidth = Math.max((maximum - minimum) / 20, 1e-6);
  const start = minimum;
  const end = maximum;
  const denominator = values.length * bandwidth * Math.sqrt(2 * Math.PI);
  return Array.from({ length: Math.max(8, pointCount) }, (_, index) => {
    const fraction = pointCount <= 1 ? 0.5 : index / (pointCount - 1);
    const value = start + fraction * (end - start || 1);
    const kernel = values.reduce((sum, observation) => {
      const z = (value - observation) / bandwidth;
      return sum + Math.exp(-0.5 * z * z);
    }, 0);
    return { value, density: denominator > 0 ? kernel / denominator : 0 };
  });
}

function visualizationDistributionGroup(group: string, values: number[], globalMin: number, globalMax: number): VisualizationDistributionGroup {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = meanOf(sorted);
  const sd = standardDeviation(sorted);
  const median = quantile(sorted, 0.5);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q1 === null || q3 === null ? null : q3 - q1;
  let whiskerLow: number | null = n ? sorted[0] : null;
  let whiskerHigh: number | null = n ? sorted[n - 1] : null;
  let outliers: number[] = [];
  if (q1 !== null && q3 !== null && iqr !== null) {
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    const inliers = sorted.filter((value) => value >= lowerFence && value <= upperFence);
    whiskerLow = inliers.length ? inliers[0] : sorted[0] ?? null;
    whiskerHigh = inliers.length ? inliers[inliers.length - 1] : sorted[n - 1] ?? null;
    outliers = sorted.filter((value) => value < lowerFence || value > upperFence);
  }
  return {
    group,
    n,
    mean,
    sd,
    median,
    q1,
    q3,
    iqr,
    whiskerLow,
    whiskerHigh,
    minimum: n ? sorted[0] : null,
    maximum: n ? sorted[n - 1] : null,
    outliers,
    density: visualizationKde(sorted, globalMin, globalMax),
  };
}

export function computeVisualizationDistribution(
  rows: AnalysisRow[],
  outcomeVariable: AnalysisVariable | null,
  groupVariable?: AnalysisVariable | null
): VisualizationDistributionResult {
  const base: VisualizationDistributionResult = {
    outcomeVariable: outcomeVariable?.name || "",
    outcomeLabel: outcomeVariable?.label || "Outcome",
    groupVariable: groupVariable?.name || null,
    groupLabel: groupVariable?.label || null,
    totalN: 0,
    groups: [],
    issue: null,
  };
  if (!outcomeVariable) return { ...base, issue: "Choose a numeric outcome variable." };
  const grouped = new Map<string, number[]>();
  const order: string[] = [];
  for (const row of rows) {
    const value = toFiniteNumber(row[outcomeVariable.name]);
    if (value === null) continue;
    let group = "All observations";
    if (groupVariable) {
      if (isMissingValue(row[groupVariable.name])) continue;
      group = asStableText(row[groupVariable.name]);
    }
    if (!grouped.has(group)) {
      grouped.set(group, []);
      order.push(group);
    }
    grouped.get(group)?.push(value);
  }
  const all = Array.from(grouped.values()).flat();
  if (all.length === 0) return { ...base, issue: "No complete numeric observations are available." };
  const globalMin = Math.min(...all);
  const globalMax = Math.max(...all);
  const groups = order.map((group) => visualizationDistributionGroup(group, grouped.get(group) || [], globalMin, globalMax));
  return { ...base, totalN: all.length, groups };
}

function visualizationMeanPoint(group: string, values: number[]): VisualizationMeanPoint {
  const n = values.length;
  const mean = meanOf(values);
  const sd = standardDeviation(values);
  const se = sd !== null && n > 0 ? sd / Math.sqrt(n) : null;
  const critical = n > 1 ? studentTCritical(0.975, n - 1) : null;
  return {
    group,
    n,
    mean,
    sd,
    se,
    ci95Low: mean !== null && se !== null && critical !== null ? mean - critical * se : null,
    ci95High: mean !== null && se !== null && critical !== null ? mean + critical * se : null,
  };
}

export function computeVisualizationMeans(
  rows: AnalysisRow[],
  outcomeVariable: AnalysisVariable | null,
  groupVariable: AnalysisVariable | null
): VisualizationMeansResult {
  const base: VisualizationMeansResult = {
    outcomeVariable: outcomeVariable?.name || "",
    outcomeLabel: outcomeVariable?.label || "Outcome",
    groupVariable: groupVariable?.name || "",
    groupLabel: groupVariable?.label || "Group",
    totalN: 0,
    points: [],
    issue: null,
  };
  if (!outcomeVariable || !groupVariable) return { ...base, issue: "Choose a numeric outcome and a grouping variable." };
  const grouped = new Map<string, number[]>();
  const order: string[] = [];
  for (const row of rows) {
    const value = toFiniteNumber(row[outcomeVariable.name]);
    if (value === null || isMissingValue(row[groupVariable.name])) continue;
    const group = asStableText(row[groupVariable.name]);
    if (!grouped.has(group)) {
      grouped.set(group, []);
      order.push(group);
    }
    grouped.get(group)?.push(value);
  }
  const points = order.map((group) => visualizationMeanPoint(group, grouped.get(group) || []));
  const totalN = points.reduce((sum, point) => sum + point.n, 0);
  if (points.length < 1 || totalN < 1) return { ...base, issue: "No complete grouped observations are available." };
  return { ...base, totalN, points };
}

export function computeVisualizationInteraction(
  rows: AnalysisRow[],
  outcomeVariable: AnalysisVariable | null,
  xFactor: AnalysisVariable | null,
  traceFactor: AnalysisVariable | null
): VisualizationInteractionResult {
  const base: VisualizationInteractionResult = {
    outcomeVariable: outcomeVariable?.name || "",
    outcomeLabel: outcomeVariable?.label || "Outcome",
    xFactor: xFactor?.name || "",
    xFactorLabel: xFactor?.label || "Factor A",
    traceFactor: traceFactor?.name || "",
    traceFactorLabel: traceFactor?.label || "Factor B",
    totalN: 0,
    xLevels: [],
    traceLevels: [],
    cells: [],
    issue: null,
  };
  if (!outcomeVariable || !xFactor || !traceFactor) return { ...base, issue: "Choose an outcome and two different factors." };
  if (xFactor.name === traceFactor.name) return { ...base, issue: "The X-axis and trace factors must be different variables." };

  const xLevels: string[] = [];
  const traceLevels: string[] = [];
  const xSeen = new Set<string>();
  const traceSeen = new Set<string>();
  const grouped = new Map<string, number[]>();
  let totalN = 0;
  for (const row of rows) {
    const value = toFiniteNumber(row[outcomeVariable.name]);
    if (value === null || isMissingValue(row[xFactor.name]) || isMissingValue(row[traceFactor.name])) continue;
    const xLevel = asStableText(row[xFactor.name]);
    const traceLevel = asStableText(row[traceFactor.name]);
    if (!xSeen.has(xLevel)) { xSeen.add(xLevel); xLevels.push(xLevel); }
    if (!traceSeen.has(traceLevel)) { traceSeen.add(traceLevel); traceLevels.push(traceLevel); }
    const key = `${xLevel}\u0000${traceLevel}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(value);
    totalN += 1;
  }
  if (xLevels.length < 2 || traceLevels.length < 2) {
    return { ...base, totalN, xLevels, traceLevels, issue: "Interaction plots need at least two observed levels in both factors." };
  }
  const cells: VisualizationInteractionCell[] = [];
  for (const traceLevel of traceLevels) {
    for (const xLevel of xLevels) {
      const point = visualizationMeanPoint("", grouped.get(`${xLevel}\u0000${traceLevel}`) || []);
      cells.push({ xLevel, traceLevel, n: point.n, mean: point.mean, sd: point.sd, se: point.se, ci95Low: point.ci95Low, ci95High: point.ci95High });
    }
  }
  return { ...base, totalN, xLevels, traceLevels, cells };
}

// -----------------------------------------------------------------------------
// Mediation & moderation (PROCESS-style regression helpers)
// -----------------------------------------------------------------------------

export type ProcessPathEstimate = {
  label: string;
  b: number | null;
  se: number | null;
  t: number | null;
  pValue: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type MediationAnalysisResult = {
  n: number;
  predictor: string;
  predictorLabel: string;
  mediator: string;
  mediatorLabel: string;
  outcome: string;
  outcomeLabel: string;
  covariates: Array<{ name: string; label: string }>;
  pathA: ProcessPathEstimate;
  pathB: ProcessPathEstimate;
  totalEffect: ProcessPathEstimate;
  directEffect: ProcessPathEstimate;
  indirectEffect: number | null;
  bootstrapCi95Low: number | null;
  bootstrapCi95High: number | null;
  bootstrapSamplesRequested: number;
  bootstrapSamplesUsed: number;
  mediatorRSquared: number | null;
  outcomeRSquared: number | null;
  issue: string | null;
};

export type ModerationSimpleSlope = {
  moderatorPoint: "low" | "mean" | "high";
  moderatorValue: number | null;
  moderatorCenteredValue: number | null;
  b: number | null;
  se: number | null;
  t: number | null;
  pValue: number | null;
  ci95Low: number | null;
  ci95High: number | null;
};

export type ModerationAnalysisResult = {
  n: number;
  predictor: string;
  predictorLabel: string;
  moderator: string;
  moderatorLabel: string;
  outcome: string;
  outcomeLabel: string;
  covariates: Array<{ name: string; label: string }>;
  centerPredictors: boolean;
  predictorMean: number | null;
  moderatorMean: number | null;
  moderatorSd: number | null;
  predictorEffect: ProcessPathEstimate;
  moderatorEffect: ProcessPathEstimate;
  interactionEffect: ProcessPathEstimate;
  rSquared: number | null;
  adjustedRSquared: number | null;
  reducedRSquared: number | null;
  rSquaredChange: number | null;
  f: number | null;
  dfModel: number | null;
  dfResidual: number | null;
  modelPValue: number | null;
  simpleSlopes: ModerationSimpleSlope[];
  issue: string | null;
};

type ProcessOlsFit = {
  coefficients: number[];
  standardErrors: Array<number | null>;
  covariance: number[][] | null;
  dfResidual: number;
  rSquared: number | null;
  adjustedRSquared: number | null;
  f: number | null;
  pValue: number | null;
  issue: string | null;
};

function processFitOls(y: number[], columns: number[][]): ProcessOlsFit {
  const n = y.length;
  const k = columns.length;
  const empty: ProcessOlsFit = {
    coefficients: [],
    standardErrors: [],
    covariance: null,
    dfResidual: n - k - 1,
    rSquared: null,
    adjustedRSquared: null,
    f: null,
    pValue: null,
    issue: null,
  };

  if (n <= k + 1) {
    return { ...empty, issue: `The model needs more complete observations than estimated coefficients. Current complete N = ${n}.` };
  }
  if (columns.some((column) => column.length !== n)) {
    return { ...empty, issue: "The regression columns do not have the same number of observations." };
  }

  const design = Array.from({ length: n }, (_, rowIndex) => [
    1,
    ...columns.map((column) => column[rowIndex]),
  ]);
  const designT = transposeMatrix(design);
  const xtx = multiplyMatrices(designT, design);
  const xtxInverse = invertMatrix(xtx);
  if (!xtxInverse) {
    return { ...empty, issue: "The model matrix is singular. Remove constant or perfectly collinear variables and try again." };
  }

  const xty = designT.map((row) => row.reduce((sum, value, index) => sum + value * y[index], 0));
  const coefficients = multiplyMatrixVector(xtxInverse, xty);
  const fitted = design.map((row) => row.reduce((sum, value, index) => sum + value * coefficients[index], 0));
  const residuals = y.map((value, index) => value - fitted[index]);
  const yMean = meanOf(y) as number;
  const ssTotal = y.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
  const ssResidual = residuals.reduce((sum, value) => sum + value * value, 0);
  const ssRegression = Math.max(0, ssTotal - ssResidual);
  const dfModel = k;
  const dfResidual = n - k - 1;
  const mse = dfResidual > 0 ? ssResidual / dfResidual : null;
  const covariance = mse === null
    ? null
    : xtxInverse.map((row) => row.map((value) => value * mse));
  const standardErrors = covariance
    ? covariance.map((row, index) => {
        const variance = row[index];
        return Number.isFinite(variance) && variance >= 0 ? Math.sqrt(Math.max(0, variance)) : null;
      })
    : coefficients.map(() => null);
  const rSquared = ssTotal > 0 ? Math.max(0, Math.min(1, 1 - ssResidual / ssTotal)) : 0;
  const adjustedRSquared = dfResidual > 0 ? 1 - (1 - rSquared) * ((n - 1) / dfResidual) : null;
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

  return {
    coefficients,
    standardErrors,
    covariance,
    dfResidual,
    rSquared,
    adjustedRSquared,
    f,
    pValue,
    issue: null,
  };
}

function processPathEstimate(label: string, fit: ProcessOlsFit, coefficientIndex: number): ProcessPathEstimate {
  const b = fit.coefficients[coefficientIndex] ?? null;
  const se = fit.standardErrors[coefficientIndex] ?? null;
  const t = b === null || se === null
    ? null
    : se === 0
      ? b === 0 ? 0 : Math.sign(b) * Number.POSITIVE_INFINITY
      : b / se;
  const pValue = t === null
    ? null
    : Number.isFinite(t)
      ? twoSidedTPValue(t, fit.dfResidual)
      : 0;
  const critical = fit.dfResidual > 0 ? studentTCritical(0.975, fit.dfResidual) : null;
  return {
    label,
    b,
    se,
    t,
    pValue,
    ci95Low: b !== null && se !== null && critical !== null ? b - critical * se : null,
    ci95High: b !== null && se !== null && critical !== null ? b + critical * se : null,
  };
}

function processHashSeed(text: string) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash || 0x9e3779b9;
}

function processSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export function computeMediationAnalysis(
  rows: AnalysisRow[],
  predictor: AnalysisVariable,
  mediator: AnalysisVariable,
  outcome: AnalysisVariable,
  covariates: AnalysisVariable[] = [],
  options: { bootstrapSamples?: number } = {}
): MediationAnalysisResult {
  const numeric = (variable: AnalysisVariable) => variable.level === "continuous" || variable.level === "ordinal";
  const usableCovariates = covariates.filter(
    (variable, index, list) =>
      numeric(variable) &&
      ![predictor.name, mediator.name, outcome.name].includes(variable.name) &&
      list.findIndex((candidate) => candidate.name === variable.name) === index
  );
  const base = {
    predictor: predictor.name,
    predictorLabel: predictor.label,
    mediator: mediator.name,
    mediatorLabel: mediator.label,
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    covariates: usableCovariates.map((variable) => ({ name: variable.name, label: variable.label })),
  };
  const emptyPath = (label: string): ProcessPathEstimate => ({ label, b: null, se: null, t: null, pValue: null, ci95Low: null, ci95High: null });
  const requestedBootstrap = Math.max(200, Math.min(5000, Math.round(options.bootstrapSamples ?? 2000)));

  if (![predictor, mediator, outcome].every(numeric)) {
    return {
      ...base,
      n: 0,
      pathA: emptyPath("a"),
      pathB: emptyPath("b"),
      totalEffect: emptyPath("c"),
      directEffect: emptyPath("c′"),
      indirectEffect: null,
      bootstrapCi95Low: null,
      bootstrapCi95High: null,
      bootstrapSamplesRequested: requestedBootstrap,
      bootstrapSamplesUsed: 0,
      mediatorRSquared: null,
      outcomeRSquared: null,
      issue: "Mediation currently requires numeric or ordinal X, mediator, and outcome variables.",
    };
  }
  if (new Set([predictor.name, mediator.name, outcome.name]).size < 3) {
    return {
      ...base,
      n: 0,
      pathA: emptyPath("a"),
      pathB: emptyPath("b"),
      totalEffect: emptyPath("c"),
      directEffect: emptyPath("c′"),
      indirectEffect: null,
      bootstrapCi95Low: null,
      bootstrapCi95High: null,
      bootstrapSamplesRequested: requestedBootstrap,
      bootstrapSamplesUsed: 0,
      mediatorRSquared: null,
      outcomeRSquared: null,
      issue: "Choose three different variables for X, mediator, and outcome.",
    };
  }

  const complete = rows.map((row) => {
    const x = toFiniteNumber(row[predictor.name]);
    const m = toFiniteNumber(row[mediator.name]);
    const y = toFiniteNumber(row[outcome.name]);
    const cov = usableCovariates.map((variable) => toFiniteNumber(row[variable.name]));
    if (x === null || m === null || y === null || cov.some((value) => value === null)) return null;
    return { x, m, y, cov: cov as number[] };
  }).filter((entry): entry is { x: number; m: number; y: number; cov: number[] } => entry !== null);

  const n = complete.length;
  const x = complete.map((entry) => entry.x);
  const m = complete.map((entry) => entry.m);
  const y = complete.map((entry) => entry.y);
  const covColumns = usableCovariates.map((_, index) => complete.map((entry) => entry.cov[index]));
  const fitA = processFitOls(m, [x, ...covColumns]);
  const fitOutcome = processFitOls(y, [x, m, ...covColumns]);
  const fitTotal = processFitOls(y, [x, ...covColumns]);

  if (fitA.issue || fitOutcome.issue || fitTotal.issue) {
    return {
      ...base,
      n,
      pathA: emptyPath("a"),
      pathB: emptyPath("b"),
      totalEffect: emptyPath("c"),
      directEffect: emptyPath("c′"),
      indirectEffect: null,
      bootstrapCi95Low: null,
      bootstrapCi95High: null,
      bootstrapSamplesRequested: requestedBootstrap,
      bootstrapSamplesUsed: 0,
      mediatorRSquared: fitA.rSquared,
      outcomeRSquared: fitOutcome.rSquared,
      issue: fitA.issue || fitOutcome.issue || fitTotal.issue,
    };
  }

  const pathA = processPathEstimate("a · X → M", fitA, 1);
  const directEffect = processPathEstimate("c′ · X → Y controlling M", fitOutcome, 1);
  const pathB = processPathEstimate("b · M → Y controlling X", fitOutcome, 2);
  const totalEffect = processPathEstimate("c · total X → Y", fitTotal, 1);
  const indirectEffect = pathA.b !== null && pathB.b !== null ? pathA.b * pathB.b : null;

  const bootstrap: number[] = [];
  if (n > usableCovariates.length + 4 && indirectEffect !== null) {
    const random = processSeededRandom(processHashSeed(`${predictor.name}|${mediator.name}|${outcome.name}|${usableCovariates.map((item) => item.name).join(",")}|${n}`));
    for (let replicate = 0; replicate < requestedBootstrap; replicate += 1) {
      const indices = Array.from({ length: n }, () => Math.floor(random() * n));
      const bx = indices.map((index) => x[index]);
      const bm = indices.map((index) => m[index]);
      const by = indices.map((index) => y[index]);
      const bcov = covColumns.map((column) => indices.map((index) => column[index]));
      const bootA = processFitOls(bm, [bx, ...bcov]);
      const bootOutcome = processFitOls(by, [bx, bm, ...bcov]);
      if (bootA.issue || bootOutcome.issue) continue;
      const a = bootA.coefficients[1];
      const b = bootOutcome.coefficients[2];
      if (Number.isFinite(a) && Number.isFinite(b)) bootstrap.push(a * b);
    }
  }

  return {
    ...base,
    n,
    pathA,
    pathB,
    totalEffect,
    directEffect,
    indirectEffect,
    bootstrapCi95Low: bootstrap.length >= Math.max(100, Math.floor(requestedBootstrap * 0.5)) ? quantile(bootstrap, 0.025) : null,
    bootstrapCi95High: bootstrap.length >= Math.max(100, Math.floor(requestedBootstrap * 0.5)) ? quantile(bootstrap, 0.975) : null,
    bootstrapSamplesRequested: requestedBootstrap,
    bootstrapSamplesUsed: bootstrap.length,
    mediatorRSquared: fitA.rSquared,
    outcomeRSquared: fitOutcome.rSquared,
    issue: null,
  };
}

export function computeModerationAnalysis(
  rows: AnalysisRow[],
  predictor: AnalysisVariable,
  moderator: AnalysisVariable,
  outcome: AnalysisVariable,
  covariates: AnalysisVariable[] = [],
  options: { centerPredictors?: boolean } = {}
): ModerationAnalysisResult {
  const numeric = (variable: AnalysisVariable) => variable.level === "continuous" || variable.level === "ordinal";
  const centerPredictors = options.centerPredictors !== false;
  const usableCovariates = covariates.filter(
    (variable, index, list) =>
      numeric(variable) &&
      ![predictor.name, moderator.name, outcome.name].includes(variable.name) &&
      list.findIndex((candidate) => candidate.name === variable.name) === index
  );
  const base = {
    predictor: predictor.name,
    predictorLabel: predictor.label,
    moderator: moderator.name,
    moderatorLabel: moderator.label,
    outcome: outcome.name,
    outcomeLabel: outcome.label,
    covariates: usableCovariates.map((variable) => ({ name: variable.name, label: variable.label })),
    centerPredictors,
  };
  const emptyPath = (label: string): ProcessPathEstimate => ({ label, b: null, se: null, t: null, pValue: null, ci95Low: null, ci95High: null });
  const emptyReturn = (issue: string, n = 0): ModerationAnalysisResult => ({
    ...base,
    n,
    predictorMean: null,
    moderatorMean: null,
    moderatorSd: null,
    predictorEffect: emptyPath("X"),
    moderatorEffect: emptyPath("W"),
    interactionEffect: emptyPath("X × W"),
    rSquared: null,
    adjustedRSquared: null,
    reducedRSquared: null,
    rSquaredChange: null,
    f: null,
    dfModel: null,
    dfResidual: null,
    modelPValue: null,
    simpleSlopes: [],
    issue,
  });

  if (![predictor, moderator, outcome].every(numeric)) {
    return emptyReturn("Moderation currently requires numeric or ordinal X, moderator, and outcome variables.");
  }
  if (new Set([predictor.name, moderator.name, outcome.name]).size < 3) {
    return emptyReturn("Choose three different variables for X, moderator, and outcome.");
  }

  const complete = rows.map((row) => {
    const x = toFiniteNumber(row[predictor.name]);
    const w = toFiniteNumber(row[moderator.name]);
    const y = toFiniteNumber(row[outcome.name]);
    const cov = usableCovariates.map((variable) => toFiniteNumber(row[variable.name]));
    if (x === null || w === null || y === null || cov.some((value) => value === null)) return null;
    return { x, w, y, cov: cov as number[] };
  }).filter((entry): entry is { x: number; w: number; y: number; cov: number[] } => entry !== null);

  const n = complete.length;
  const rawX = complete.map((entry) => entry.x);
  const rawW = complete.map((entry) => entry.w);
  const y = complete.map((entry) => entry.y);
  const xMean = meanOf(rawX);
  const wMean = meanOf(rawW);
  const wSd = standardDeviation(rawW);
  if (xMean === null || wMean === null || wSd === null || wSd <= 0) {
    return emptyReturn("The moderator must contain usable variation across complete observations.", n);
  }
  const x = rawX.map((value) => centerPredictors ? value - xMean : value);
  const w = rawW.map((value) => centerPredictors ? value - wMean : value);
  const interaction = x.map((value, index) => value * w[index]);
  const covColumns = usableCovariates.map((_, index) => complete.map((entry) => entry.cov[index]));
  const full = processFitOls(y, [x, w, interaction, ...covColumns]);
  const reduced = processFitOls(y, [x, w, ...covColumns]);
  if (full.issue || reduced.issue) return emptyReturn(full.issue || reduced.issue || "The moderation model could not be estimated.", n);

  const predictorEffect = processPathEstimate("X", full, 1);
  const moderatorEffect = processPathEstimate("W", full, 2);
  const interactionEffect = processPathEstimate("X × W", full, 3);
  const cov = full.covariance;
  const critical = full.dfResidual > 0 ? studentTCritical(0.975, full.dfResidual) : null;
  const moderatorCenteredPoints = centerPredictors ? [-wSd, 0, wSd] : [wMean - wSd, wMean, wMean + wSd];
  const moderatorRawPoints = [wMean - wSd, wMean, wMean + wSd];
  const pointNames: Array<"low" | "mean" | "high"> = ["low", "mean", "high"];
  const simpleSlopes: ModerationSimpleSlope[] = moderatorCenteredPoints.map((wPoint, index) => {
    const bX = full.coefficients[1] ?? null;
    const bInt = full.coefficients[3] ?? null;
    const slope = bX !== null && bInt !== null ? bX + bInt * wPoint : null;
    const variance = cov
      ? cov[1][1] + (wPoint ** 2) * cov[3][3] + 2 * wPoint * cov[1][3]
      : null;
    const se = variance !== null && Number.isFinite(variance) && variance >= 0 ? Math.sqrt(Math.max(0, variance)) : null;
    const t = slope !== null && se !== null
      ? se === 0 ? (slope === 0 ? 0 : Math.sign(slope) * Number.POSITIVE_INFINITY) : slope / se
      : null;
    const pValue = t === null ? null : Number.isFinite(t) ? twoSidedTPValue(t, full.dfResidual) : 0;
    return {
      moderatorPoint: pointNames[index],
      moderatorValue: moderatorRawPoints[index],
      moderatorCenteredValue: wPoint,
      b: slope,
      se,
      t,
      pValue,
      ci95Low: slope !== null && se !== null && critical !== null ? slope - critical * se : null,
      ci95High: slope !== null && se !== null && critical !== null ? slope + critical * se : null,
    };
  });

  return {
    ...base,
    n,
    predictorMean: xMean,
    moderatorMean: wMean,
    moderatorSd: wSd,
    predictorEffect,
    moderatorEffect,
    interactionEffect,
    rSquared: full.rSquared,
    adjustedRSquared: full.adjustedRSquared,
    reducedRSquared: reduced.rSquared,
    rSquaredChange: full.rSquared !== null && reduced.rSquared !== null ? Math.max(0, full.rSquared - reduced.rSquared) : null,
    f: full.f,
    dfModel: full.coefficients.length > 0 ? full.coefficients.length - 1 : null,
    dfResidual: full.dfResidual,
    modelPValue: full.pValue,
    simpleSlopes,
    issue: null,
  };
}

export type PowerAnalysisTest = "independent_t" | "paired_t" | "correlation" | "one_way_anova";
export type PowerAnalysisMode = "apriori" | "achieved";
export type PowerAnalysisTails = "two" | "one";

export type PowerCurvePoint = {
  sampleSize: number;
  power: number;
};

export type PowerAnalysisResult = {
  test: PowerAnalysisTest;
  mode: PowerAnalysisMode;
  effectSize: number;
  alpha: number;
  targetPower: number | null;
  tails: PowerAnalysisTails | null;
  groups: number | null;
  sampleSize: number | null;
  sampleSizePerGroup: number | null;
  achievedPower: number | null;
  criticalValue: number | null;
  methodLabel: string;
  curve: PowerCurvePoint[];
  issue: string | null;
};

function powerInverseNormalCdf(probability: number) {
  if (!Number.isFinite(probability) || probability <= 0 || probability >= 1) return null;
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  if (probability < plow) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (probability > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

function approximateZPower(noncentrality: number, alpha: number, tails: PowerAnalysisTails) {
  const critical = powerInverseNormalCdf(1 - alpha / (tails === "two" ? 2 : 1));
  if (critical === null || !Number.isFinite(noncentrality)) return null;
  if (tails === "one") return Math.max(0, Math.min(1, 1 - normalCdf(critical - Math.abs(noncentrality))));
  const ncp = Math.abs(noncentrality);
  const power = 1 - normalCdf(critical - ncp) + normalCdf(-critical - ncp);
  return Math.max(0, Math.min(1, power));
}

function centralFCritical(alpha: number, df1: number, df2: number) {
  if (!(alpha > 0 && alpha < 1) || df1 <= 0 || df2 <= 0) return null;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 80; i += 1) {
    const survival = fSurvivalProbability(high, df1, df2);
    if (survival === null) return null;
    if (survival <= alpha) break;
    high *= 2;
    if (high > 1e8) return null;
  }
  for (let i = 0; i < 100; i += 1) {
    const middle = (low + high) / 2;
    const survival = fSurvivalProbability(middle, df1, df2);
    if (survival === null) return null;
    if (survival > alpha) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function noncentralFCdf(value: number, df1: number, df2: number, lambda: number) {
  if (!Number.isFinite(value) || value < 0 || df1 <= 0 || df2 <= 0 || lambda < 0) return null;
  if (value === Number.POSITIVE_INFINITY) return 1;
  const x = (df1 * value) / (df1 * value + df2);
  const halfLambda = lambda / 2;
  let weight = Math.exp(-halfLambda);
  let sum = 0;
  let weightSum = 0;
  const maxTerms = 10000;
  for (let j = 0; j < maxTerms; j += 1) {
    if (j > 0) weight *= halfLambda / j;
    const beta = regularizedIncompleteBeta(x, df1 / 2 + j, df2 / 2);
    sum += weight * beta;
    weightSum += weight;
    if (j > halfLambda + 12 * Math.sqrt(halfLambda + 1) && weight < 1e-14) break;
  }
  if (weightSum <= 0) return null;
  return Math.max(0, Math.min(1, sum));
}

function oneWayAnovaPower(effectSize: number, alpha: number, totalN: number, groups: number) {
  if (!(effectSize > 0) || !(alpha > 0 && alpha < 1) || groups < 2 || totalN <= groups) return null;
  const df1 = groups - 1;
  const df2 = totalN - groups;
  const critical = centralFCritical(alpha, df1, df2);
  if (critical === null) return null;
  const lambda = effectSize * effectSize * totalN;
  const cdf = noncentralFCdf(critical, df1, df2, lambda);
  return cdf === null ? null : Math.max(0, Math.min(1, 1 - cdf));
}

function powerForTest(
  test: PowerAnalysisTest,
  effectSize: number,
  alpha: number,
  sampleSize: number,
  tails: PowerAnalysisTails,
  groups: number,
) {
  if (test === "independent_t") {
    const nPerGroup = Math.max(2, Math.floor(sampleSize / 2));
    return approximateZPower(effectSize * Math.sqrt(nPerGroup / 2), alpha, tails);
  }
  if (test === "paired_t") return approximateZPower(effectSize * Math.sqrt(sampleSize), alpha, tails);
  if (test === "correlation") {
    if (Math.abs(effectSize) >= 1 || sampleSize <= 3) return null;
    const fisher = 0.5 * Math.log((1 + Math.abs(effectSize)) / (1 - Math.abs(effectSize)));
    return approximateZPower(fisher * Math.sqrt(sampleSize - 3), alpha, tails);
  }
  return oneWayAnovaPower(effectSize, alpha, sampleSize, groups);
}

export function computePowerAnalysis(options: {
  test: PowerAnalysisTest;
  mode: PowerAnalysisMode;
  effectSize: number;
  alpha?: number;
  targetPower?: number;
  sampleSize?: number;
  tails?: PowerAnalysisTails;
  groups?: number;
}): PowerAnalysisResult {
  const test = options.test;
  const mode = options.mode;
  const effectSize = Math.abs(Number(options.effectSize));
  const alpha = Number.isFinite(options.alpha) ? Number(options.alpha) : 0.05;
  const targetPower = Number.isFinite(options.targetPower) ? Number(options.targetPower) : 0.8;
  const tails = options.tails === "one" ? "one" : "two";
  const groups = Math.max(2, Math.round(Number(options.groups) || 3));
  const empty = (issue: string): PowerAnalysisResult => ({
    test,
    mode,
    effectSize,
    alpha,
    targetPower: mode === "apriori" ? targetPower : null,
    tails: test === "one_way_anova" ? null : tails,
    groups: test === "one_way_anova" ? groups : null,
    sampleSize: null,
    sampleSizePerGroup: null,
    achievedPower: null,
    criticalValue: null,
    methodLabel: test === "one_way_anova" ? "Noncentral F" : "Normal approximation",
    curve: [],
    issue,
  });

  if (!(effectSize > 0)) return empty("Enter an effect size greater than zero.");
  if (!(alpha > 0 && alpha < 0.5)) return empty("Alpha must be greater than 0 and below 0.50.");
  if (mode === "apriori" && !(targetPower > 0.5 && targetPower < 1)) return empty("Target power must be greater than 0.50 and below 1.00.");
  if (test === "correlation" && effectSize >= 1) return empty("Correlation effect size r must be between -1 and 1.");

  let requiredN: number | null = null;
  let achievedPower: number | null = null;
  let criticalValue: number | null = null;

  if (mode === "apriori") {
    const minimum = test === "independent_t" ? 4 : test === "correlation" ? 5 : test === "one_way_anova" ? groups + 2 : 2;
    let low = minimum;
    let high = minimum;
    while (high < 100000) {
      const power = powerForTest(test, effectSize, alpha, high, tails, groups);
      if (power !== null && power >= targetPower) break;
      high = Math.min(100000, Math.max(high + 1, Math.ceil(high * 1.35)));
      if (high === 100000) break;
    }
    const highPower = powerForTest(test, effectSize, alpha, high, tails, groups);
    if (highPower === null || highPower < targetPower) return empty("The requested target power requires a sample beyond the supported planning range.");
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const power = powerForTest(test, effectSize, alpha, middle, tails, groups);
      if (power !== null && power >= targetPower) high = middle;
      else low = middle + 1;
    }
    requiredN = low;
    if (test === "independent_t" && requiredN % 2 !== 0) requiredN += 1;
    achievedPower = powerForTest(test, effectSize, alpha, requiredN, tails, groups);
  } else {
    requiredN = Math.max(test === "one_way_anova" ? groups + 2 : test === "correlation" ? 5 : test === "independent_t" ? 4 : 2, Math.round(Number(options.sampleSize) || 0));
    if (test === "independent_t" && requiredN % 2 !== 0) requiredN -= 1;
    achievedPower = powerForTest(test, effectSize, alpha, requiredN, tails, groups);
  }

  if (requiredN === null || achievedPower === null) return empty("Power could not be estimated for this configuration.");

  if (test === "one_way_anova") criticalValue = centralFCritical(alpha, groups - 1, requiredN - groups);
  else criticalValue = powerInverseNormalCdf(1 - alpha / (tails === "two" ? 2 : 1));

  const sampleSizePerGroup = test === "independent_t"
    ? Math.floor(requiredN / 2)
    : test === "one_way_anova"
      ? Math.ceil(requiredN / groups)
      : null;

  const base = requiredN;
  const curveSizes = new Set<number>();
  const curveStart = Math.max(test === "one_way_anova" ? groups + 2 : test === "correlation" ? 5 : test === "independent_t" ? 4 : 2, Math.floor(base * 0.35));
  const curveEnd = Math.max(curveStart + 12, Math.ceil(base * 1.75));
  const steps = 28;
  for (let i = 0; i <= steps; i += 1) {
    let n = Math.round(curveStart + ((curveEnd - curveStart) * i) / steps);
    if (test === "independent_t" && n % 2 !== 0) n += 1;
    curveSizes.add(n);
  }
  curveSizes.add(requiredN);
  const curve = Array.from(curveSizes)
    .sort((a, b) => a - b)
    .map((sampleSize) => ({ sampleSize, power: powerForTest(test, effectSize, alpha, sampleSize, tails, groups) ?? 0 }));

  return {
    test,
    mode,
    effectSize,
    alpha,
    targetPower: mode === "apriori" ? targetPower : null,
    tails: test === "one_way_anova" ? null : tails,
    groups: test === "one_way_anova" ? groups : null,
    sampleSize: requiredN,
    sampleSizePerGroup,
    achievedPower,
    criticalValue,
    methodLabel: test === "one_way_anova" ? "Noncentral F" : "Normal approximation",
    curve,
    issue: null,
  };
}

export function cohenFfromEtaSquared(etaSquared: number) {
  const eta = Number(etaSquared);
  if (!Number.isFinite(eta) || eta < 0 || eta >= 1) return null;
  return Math.sqrt(eta / Math.max(1e-15, 1 - eta));
}

export function etaSquaredFromCohenF(cohenF: number) {
  const f = Math.abs(Number(cohenF));
  if (!Number.isFinite(f)) return null;
  return (f * f) / (1 + f * f);
}

export function correlationFromCohenD(cohenD: number) {
  const d = Number(cohenD);
  if (!Number.isFinite(d)) return null;
  return d / Math.sqrt(d * d + 4);
}

// Lightweight reproducibility fingerprint for Analysis Lab records.
// This is intentionally non-cryptographic: it is used to detect whether the
// working data/view has changed between saved analysis records, not to verify
// file integrity or protect sensitive data.
export function computeAnalysisDataFingerprint(
  rows: AnalysisRow[],
  variableNames: string[] = []
): string {
  const keys = variableNames.length > 0
    ? Array.from(new Set(variableNames)).sort()
    : Array.from(
        rows.slice(0, Math.min(rows.length, 25)).reduce((set, row) => {
          Object.keys(row).forEach((key) => set.add(key));
          return set;
        }, new Set<string>())
      ).sort();

  const updateHash = (hash: number, value: string) => {
    let next = hash >>> 0;
    for (let i = 0; i < value.length; i += 1) {
      next ^= value.charCodeAt(i);
      next = Math.imul(next, 16777619) >>> 0;
    }
    return next >>> 0;
  };

  const valueToken = (value: unknown) => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "nonfinite";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value.length > 120 ? value.slice(0, 120) : value;
    try {
      const serialized = JSON.stringify(value);
      return serialized.length > 120 ? serialized.slice(0, 120) : serialized;
    } catch {
      return String(value).slice(0, 120);
    }
  };

  let hash = 2166136261;
  hash = updateHash(hash, `rows:${rows.length}|vars:${keys.length}|${keys.join("|")}`);

  if (rows.length > 0 && keys.length > 0) {
    const sampleCount = Math.min(19, rows.length);
    const sampledIndexes = Array.from({ length: sampleCount }, (_, index) =>
      sampleCount === 1 ? 0 : Math.round((index * (rows.length - 1)) / (sampleCount - 1))
    );

    for (const rowIndex of sampledIndexes) {
      const row = rows[rowIndex] ?? {};
      hash = updateHash(hash, `#${rowIndex}`);
      for (const key of keys) {
        hash = updateHash(hash, `${key}=${valueToken(row[key])}|`);
      }
    }
  }

  return `al1-${rows.length}-${keys.length}-${hash.toString(36)}`;
}
