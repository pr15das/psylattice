import {
  isMissingValue,
  type AnalysisRow,
  type AnalysisVariable,
} from "@/lib/research/analysisLab";

export type AnalysisGuardrailSeverity = "block" | "review" | "info";
export type AnalysisGuardrailAction =
  | "setup_mixed"
  | "open_missingness"
  | "open_variables"
  | "open_diagnostics";

export type AnalysisGuardrail = {
  id: string;
  severity: AnalysisGuardrailSeverity;
  category: "structure" | "sample" | "missingness" | "sparsity" | "model" | "diagnostics";
  title: string;
  detail: string;
  action?: AnalysisGuardrailAction;
  actionLabel?: string;
};

export type AnalysisGuardrailDatasetStructure = {
  repeatedObservations: boolean;
  clusterVariable: string | null;
  clusterLabel?: string | null;
  clusterCount?: number;
  meanObservationsPerCluster?: number;
  maxObservationsPerCluster?: number;
};

export type AnalysisGuardrailResultSnapshot = {
  issue?: string | null;
  warning?: string | null;
  converged?: boolean | null;
  groupCount?: number | null;
  minObservationsPerGroup?: number | null;
  maxObservationsPerGroup?: number | null;
  meanObservationsPerGroup?: number | null;
  maxVif?: number | null;
  heteroscedasticP?: number | null;
  influentialCount?: number | null;
  categoricalAssumptionFlag?: "ok" | "review" | "sparse" | null;
};

export type AnalysisGuardrailContext = {
  rows: AnalysisRow[];
  variables: AnalysisVariable[];
  selectedVariables: string[];
  completeRows: number;
  activeAnalysis: string;
  analysisSubtype?: string;
  datasetStructure?: AnalysisGuardrailDatasetStructure;
  outcomeVariable?: string;
  groupVariable?: string;
  clusterVariable?: string;
  predictorVariables?: string[];
  mixedFamily?: "gaussian" | "binomial" | "poisson";
  result?: AnalysisGuardrailResultSnapshot | null;
};

function valueKey(value: unknown) {
  if (isMissingValue(value)) return null;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function levelCounts(rows: AnalysisRow[], variable: string) {
  const counts = new Map<string, number>();
  if (!variable) return counts;
  for (const row of rows) {
    const key = valueKey(row[variable]);
    if (key === null) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function variableMap(variables: AnalysisVariable[]) {
  return new Map(variables.map((variable) => [variable.name, variable]));
}

function isNumericLevel(level: AnalysisVariable["level"] | undefined) {
  return level === "continuous" || level === "ordinal";
}

function isIndependentRowAnalysis(activeAnalysis: string, subtype?: string) {
  if (activeAnalysis === "mixed") return false;
  if (activeAnalysis === "ttests" && subtype === "paired") return false;
  if (activeAnalysis === "nonparametric" && (subtype === "wilcoxon" || subtype === "friedman")) return false;
  if (activeAnalysis === "anova" && subtype === "repeated") return false;
  return new Set([
    "correlations",
    "ttests",
    "categorical",
    "anova",
    "regression",
    "process",
    "logistic",
    "count",
  ]).has(activeAnalysis);
}

function severityRank(value: AnalysisGuardrailSeverity) {
  return value === "block" ? 0 : value === "review" ? 1 : 2;
}

export function computeAnalysisGuardrails(context: AnalysisGuardrailContext): AnalysisGuardrail[] {
  const issues: AnalysisGuardrail[] = [];
  const add = (item: AnalysisGuardrail) => {
    if (!issues.some((existing) => existing.id === item.id)) issues.push(item);
  };
  const byName = variableMap(context.variables);
  const selected = Array.from(new Set(context.selectedVariables.filter(Boolean)));

  if (context.rows.length === 0) {
    add({
      id: "no_rows",
      severity: "block",
      category: "sample",
      title: "No analysable rows are available",
      detail: "Load or select a dataset with observations before interpreting an analysis.",
    });
    return issues;
  }

  for (const name of selected) {
    const variable = byName.get(name);
    if (!variable) continue;
    if (variable.validCount === 0) {
      add({
        id: `empty_${name}`,
        severity: "block",
        category: "sample",
        title: `${variable.label} has no usable values`,
        detail: "Choose a different variable or review the source / missing-value coding.",
        action: "open_variables",
        actionLabel: "Review variable",
      });
      continue;
    }
    if (variable.distinctCount <= 1 && variable.level !== "id") {
      add({
        id: `constant_${name}`,
        severity: "block",
        category: "model",
        title: `${variable.label} has no variation`,
        detail: "A constant variable cannot estimate an association, group difference or model effect.",
        action: "open_variables",
        actionLabel: "Review variable",
      });
    }

    const missingPercent = variable.rowCount > 0 ? (variable.missingCount / variable.rowCount) * 100 : 0;
    if (missingPercent >= 40) {
      add({
        id: `missing_high_${name}`,
        severity: "review",
        category: "missingness",
        title: `${variable.label} is ${missingPercent.toFixed(0)}% missing`,
        detail: "The analysis sample may differ substantially from the full dataset. Review missingness before interpreting the model.",
        action: "open_missingness",
        actionLabel: "Review missingness",
      });
    }
  }

  if (selected.length > 0 && context.completeRows < context.rows.length) {
    const completePercent = (context.completeRows / context.rows.length) * 100;
    if (completePercent < 60) {
      add({
        id: "complete_case_major_loss",
        severity: "review",
        category: "missingness",
        title: `Only ${completePercent.toFixed(0)}% of rows are complete for this setup`,
        detail: `${context.completeRows.toLocaleString()} of ${context.rows.length.toLocaleString()} rows contain all currently required variables. Check whether complete-case analysis changes the target sample.` ,
        action: "open_missingness",
        actionLabel: "Review missingness",
      });
    } else if (completePercent < 80) {
      add({
        id: "complete_case_moderate_loss",
        severity: "info",
        category: "missingness",
        title: `${(100 - completePercent).toFixed(0)}% of rows are incomplete for this setup`,
        detail: "PsyLattice will use fewer observations when the analysis requires complete values across the selected variables.",
        action: "open_missingness",
        actionLabel: "Inspect sample",
      });
    }
  }

  if (context.datasetStructure?.repeatedObservations && isIndependentRowAnalysis(context.activeAnalysis, context.analysisSubtype)) {
    add({
      id: "repeated_rows_independence",
      severity: "review",
      category: "structure",
      title: "Repeated observations are being treated as independent rows",
      detail: "The current dataset contains multiple observations per participant / cluster. An ordinary independent-row analysis can underestimate uncertainty when within-cluster dependence is ignored.",
      action: "setup_mixed",
      actionLabel: "Set up mixed model",
    });
  }

  const groupName = context.groupVariable || "";
  if (groupName) {
    const variable = byName.get(groupName);
    const counts = Array.from(levelCounts(context.rows, groupName).values());
    if (counts.length < 2 && variable?.level !== "id") {
      add({
        id: "group_one_level",
        severity: "block",
        category: "sparsity",
        title: `${variable?.label || groupName} has fewer than two observed groups`,
        detail: "A group comparison needs at least two observed categories after filtering and missing-value handling.",
        action: "open_variables",
        actionLabel: "Review groups",
      });
    } else if (counts.length >= 2 && Math.min(...counts) < 5) {
      add({
        id: "group_sparse_level",
        severity: "review",
        category: "sparsity",
        title: "At least one comparison group is very small",
        detail: `The smallest observed group contains ${Math.min(...counts)} row${Math.min(...counts) === 1 ? "" : "s"}. Estimates and assumption checks can be unstable in sparse groups.`,
        action: "open_variables",
        actionLabel: "Review groups",
      });
    }
  }

  if (context.activeAnalysis === "mixed") {
    const clusterName = context.clusterVariable || context.datasetStructure?.clusterVariable || "";
    if (!context.clusterVariable) {
      add({
        id: "mixed_missing_cluster",
        severity: "block",
        category: "structure",
        title: "Choose the participant / cluster variable",
        detail: "A mixed model needs the variable that identifies which repeated observations belong to the same participant or cluster.",
        action: "setup_mixed",
        actionLabel: "Use detected cluster",
      });
    } else {
      const clusterCounts = Array.from(levelCounts(context.rows, context.clusterVariable).values());
      if (clusterCounts.length < 2) {
        add({
          id: "mixed_too_few_clusters",
          severity: "block",
          category: "structure",
          title: "The mixed model has fewer than two observed clusters",
          detail: "A random-effects model cannot estimate between-cluster variation from a single participant / cluster.",
        });
      } else {
        if (clusterCounts.every((count) => count <= 1)) {
          add({
            id: "mixed_no_repeats",
            severity: "block",
            category: "structure",
            title: "The selected cluster variable has one row per cluster",
            detail: "Use repeated / raw observations for a mixed model, or use an ordinary participant-level model when each cluster appears only once.",
          });
        }
        if (clusterCounts.length < 5) {
          add({
            id: "mixed_very_few_clusters",
            severity: "review",
            category: "sample",
            title: `Only ${clusterCounts.length} clusters are available`,
            detail: "Random-effect variance and uncertainty can be highly unstable with very few clusters. Treat inference cautiously and consider whether the model is identifiable for the research question.",
          });
        } else if (clusterCounts.length < 10) {
          add({
            id: "mixed_few_clusters",
            severity: "info",
            category: "sample",
            title: `The mixed model uses ${clusterCounts.length} clusters`,
            detail: "This is a relatively small cluster count. Review convergence, variance estimates and sensitivity before making strong inferential claims.",
          });
        }
        const singletonClusters = clusterCounts.filter((count) => count === 1).length;
        if (singletonClusters > 0 && singletonClusters / clusterCounts.length >= 0.25) {
          add({
            id: "mixed_many_singletons",
            severity: "review",
            category: "structure",
            title: "Many clusters contribute only one complete observation",
            detail: `${singletonClusters} of ${clusterCounts.length} clusters are singletons in the current data view. They provide little information about within-cluster change.` ,
          });
        }
      }
    }

    const outcome = context.outcomeVariable ? byName.get(context.outcomeVariable) : undefined;
    if (context.outcomeVariable && outcome) {
      if (context.mixedFamily === "gaussian" && !isNumericLevel(outcome.level)) {
        add({
          id: "mixed_gaussian_outcome_type",
          severity: "block",
          category: "model",
          title: "Continuous mixed models need a numeric outcome",
          detail: `${outcome.label} is currently classified as ${outcome.level}. Change its measurement level only if that coding is scientifically correct, or choose Binary / Count when appropriate.`,
          action: "open_variables",
          actionLabel: "Review outcome type",
        });
      }
      if (context.mixedFamily === "binomial") {
        const counts = Array.from(levelCounts(context.rows, context.outcomeVariable).values());
        if (counts.length !== 2) {
          add({
            id: "mixed_binary_levels",
            severity: "block",
            category: "model",
            title: "Binary mixed models need exactly two observed outcome levels",
            detail: `${outcome.label} currently has ${counts.length} observed non-missing level${counts.length === 1 ? "" : "s"} in the current data view.`,
            action: "open_variables",
            actionLabel: "Review outcome",
          });
        } else if (Math.min(...counts) < 10) {
          add({
            id: "mixed_binary_rare_event",
            severity: "review",
            category: "sparsity",
            title: "The binary outcome has a sparse event category",
            detail: `The smaller outcome category contains ${Math.min(...counts)} observation${Math.min(...counts) === 1 ? "" : "s"}. Logistic mixed-model estimates can become unstable or show separation when events are rare.`,
          });
        }
      }
      if (context.mixedFamily === "poisson") {
        let invalid = 0;
        for (const row of context.rows) {
          const value = row[context.outcomeVariable];
          if (isMissingValue(value)) continue;
          const numeric = typeof value === "number" ? value : Number(value);
          if (!Number.isFinite(numeric) || numeric < 0 || Math.abs(numeric - Math.round(numeric)) > 1e-9) invalid += 1;
        }
        if (invalid > 0) {
          add({
            id: "mixed_poisson_invalid_counts",
            severity: "block",
            category: "model",
            title: "Poisson mixed models require non-negative integer counts",
            detail: `${invalid} non-missing outcome value${invalid === 1 ? " is" : "s are"} not valid count data in the current view.`,
            action: "open_variables",
            actionLabel: "Review outcome",
          });
        }
      }
    }

    for (const predictorName of context.predictorVariables || []) {
      const predictor = byName.get(predictorName);
      if (!predictor || !["nominal", "boolean", "ordinal"].includes(predictor.level) || predictor.distinctCount > 20) continue;
      const counts = Array.from(levelCounts(context.rows, predictorName).values());
      if (counts.length > 1 && Math.min(...counts) < 5) {
        add({
          id: `mixed_sparse_predictor_${predictorName}`,
          severity: "review",
          category: "sparsity",
          title: `${predictor.label} contains a sparse level`,
          detail: `The smallest observed category contains ${Math.min(...counts)} row${Math.min(...counts) === 1 ? "" : "s"}. Sparse fixed-effect levels can produce unstable coefficients, especially in interactions.`,
          action: "open_variables",
          actionLabel: "Review levels",
        });
      }
    }
  }

  const result = context.result;
  if (result?.issue) {
    add({
      id: "engine_issue",
      severity: "block",
      category: "model",
      title: "The deterministic engine reported a model issue",
      detail: result.issue,
    });
  }
  if (result?.converged === false) {
    add({
      id: "not_converged",
      severity: "block",
      category: "model",
      title: "Do not interpret this model as converged",
      detail: "The numerical optimizer did not reach the required convergence criterion. Simplify or revise the specification and inspect sparse / redundant predictors before interpretation.",
    });
  }
  if (result?.warning) {
    add({
      id: "engine_warning",
      severity: "review",
      category: "model",
      title: "The deterministic engine raised a review flag",
      detail: result.warning,
    });
  }

  if (result?.maxVif !== null && result?.maxVif !== undefined) {
    if (result.maxVif >= 10) {
      add({
        id: "vif_high",
        severity: "review",
        category: "diagnostics",
        title: `High predictor collinearity detected (max VIF ${result.maxVif.toFixed(1)})`,
        detail: "Large VIF values can make individual regression coefficients unstable. Review redundant predictors and the scientific role of each term.",
        action: "open_diagnostics",
        actionLabel: "Review diagnostics",
      });
    } else if (result.maxVif >= 5) {
      add({
        id: "vif_moderate",
        severity: "info",
        category: "diagnostics",
        title: `Predictor collinearity deserves review (max VIF ${result.maxVif.toFixed(1)})`,
        detail: "The model may still be usable, but coefficient uncertainty and interpretation should be checked carefully.",
        action: "open_diagnostics",
        actionLabel: "Review diagnostics",
      });
    }
  }

  if (result?.heteroscedasticP !== null && result?.heteroscedasticP !== undefined && result.heteroscedasticP < 0.05) {
    add({
      id: "heteroscedasticity",
      severity: "review",
      category: "diagnostics",
      title: "Residual variance may not be constant",
      detail: "The current regression heteroscedasticity screen is below p = .05. Review residual plots and consider whether a robust or alternative specification is needed before interpretation.",
      action: "open_diagnostics",
      actionLabel: "Review diagnostics",
    });
  }

  if ((result?.influentialCount || 0) > 0) {
    add({
      id: "influential_rows",
      severity: "info",
      category: "diagnostics",
      title: `${result?.influentialCount} potentially influential row${result?.influentialCount === 1 ? "" : "s"} detected`,
      detail: "Inspect influence diagnostics and verify whether conclusions depend strongly on a small number of observations. Do not automatically delete flagged rows.",
      action: "open_diagnostics",
      actionLabel: "Review diagnostics",
    });
  }

  if (result?.categoricalAssumptionFlag === "sparse") {
    add({
      id: "categorical_sparse",
      severity: "review",
      category: "sparsity",
      title: "The contingency table is too sparse for a routine chi-square interpretation",
      detail: "Expected cell counts are sparse. Prefer the exact result when available for a 2×2 table, combine categories only when scientifically justified, or reconsider the analysis.",
    });
  } else if (result?.categoricalAssumptionFlag === "review") {
    add({
      id: "categorical_expected_counts",
      severity: "info",
      category: "sparsity",
      title: "Some expected cell counts are small",
      detail: "Review the expected-count diagnostics before relying on the Pearson chi-square approximation.",
    });
  }

  return issues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}
