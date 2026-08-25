export type CognitiveAnalysisParticipant = {
  id: string;
  is_test?: boolean;
  status?: string;
  public_id?: string;
};

export type CognitiveAnalysisAttachment = {
  id: string;
  position: number;
  title: string;
  short_title?: string | null;
  version_label?: string;
  domain?: string;
};

export type CognitiveAnalysisSession = {
  id: string;
  study_cognitive_task_id: string | null;
  participant_id: string | null;
  session_mode: string;
  status: string;
  timing_quality?: Record<string, unknown> | null;
  created_at: string;
};

export type CognitiveAnalysisTrial = {
  id: string;
  session_id: string;
  condition_label: string | null;
  correct: boolean | null;
  reaction_time_ms: number | null;
  response_payload?: Record<string, unknown> | null;
};

export type CognitiveConditionParticipantMetric = {
  participantId: string;
  condition: string;
  trials: number;
  scorableTrials: number;
  correctTrials: number;
  accuracy: number | null;
  rtCount: number;
  meanRt: number | null;
  medianRt: number | null;
  omissions: number;
};

export type CognitiveConditionSummary = {
  condition: string;
  participants: number;
  trials: number;
  scorableTrials: number;
  meanAccuracy: number | null;
  accuracyCi95: [number, number] | null;
  meanRt: number | null;
  rtCi95: [number, number] | null;
  medianParticipantRt: number | null;
  omissions: number;
};

export type PairedComparison = {
  n: number;
  conditionA: string;
  conditionB: string;
  meanA: number | null;
  meanB: number | null;
  difference: number | null;
  ci95: [number, number] | null;
  t: number | null;
  df: number | null;
  pTwoSided: number | null;
  cohenDz: number | null;
};

export type CognitiveQualityFlag = {
  participantId: string;
  sessionId: string;
  severity: "review" | "warning";
  code:
    | "incomplete_session"
    | "high_omissions"
    | "very_fast_responses"
    | "unstable_refresh"
    | "visibility_interruptions"
    | "asset_failure"
    | "no_scorable_trials";
  label: string;
  detail: string;
};

export type CognitiveAttachmentAnalysis = {
  attachmentId: string;
  participantCount: number;
  completedParticipantCount: number;
  conditionLabels: string[];
  participantMetrics: CognitiveConditionParticipantMetric[];
  conditionSummaries: CognitiveConditionSummary[];
  qualityFlags: CognitiveQualityFlag[];
};

function finite(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

export function mean(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function sampleSd(values: number[]) {
  if (values.length < 2) return null;
  const average = mean(values);
  if (average === null) return null;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// Lanczos log-gamma implementation for stable Student-t probabilities.
function logGamma(z: number): number {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  let x = 0.9999999999998099;
  let shifted = z - 1;
  for (let index = 0; index < coefficients.length; index += 1) {
    x += coefficients[index] / (shifted + index + 1);
  }
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaContinuedFraction(a: number, b: number, x: number) {
  const maxIterations = 200;
  const epsilon = 3e-14;
  const tiny = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
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

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
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

  const bt = Math.exp(
    logGamma(a + b) -
      logGamma(a) -
      logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a;
  }
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
}

function studentTCdf(t: number, df: number) {
  if (!Number.isFinite(t)) return t < 0 ? 0 : 1;
  if (!(df > 0)) return Number.NaN;
  if (t === 0) return 0.5;
  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(x, df / 2, 0.5);
  return t > 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

export function studentTTwoSidedP(t: number, df: number) {
  if (!(df > 0)) return null;
  if (!Number.isFinite(t)) return 0;
  const p = 2 * (1 - studentTCdf(Math.abs(t), df));
  return Math.max(0, Math.min(1, p));
}

function studentTCritical95(df: number) {
  if (!(df > 0)) return null;
  let low = 0;
  let high = 50;
  for (let index = 0; index < 100; index += 1) {
    const middle = (low + high) / 2;
    const cdf = studentTCdf(middle, df);
    if (cdf < 0.975) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export function meanCi95(values: number[]): [number, number] | null {
  if (!values.length) return null;
  const average = mean(values);
  if (average === null) return null;
  if (values.length === 1) return null;
  const sd = sampleSd(values);
  const critical = studentTCritical95(values.length - 1);
  if (sd === null || critical === null) return null;
  const margin = critical * (sd / Math.sqrt(values.length));
  return [average - margin, average + margin];
}

export function pairedComparison(
  conditionA: string,
  conditionB: string,
  pairs: Array<{ a: number; b: number }>
): PairedComparison {
  const filtered = pairs.filter(
    (pair) => Number.isFinite(pair.a) && Number.isFinite(pair.b)
  );
  const a = filtered.map((pair) => pair.a);
  const b = filtered.map((pair) => pair.b);
  const differences = filtered.map((pair) => pair.b - pair.a);
  const n = differences.length;
  const meanA = mean(a);
  const meanB = mean(b);
  const difference = mean(differences);

  if (n < 2 || difference === null) {
    return {
      n,
      conditionA,
      conditionB,
      meanA,
      meanB,
      difference,
      ci95: null,
      t: null,
      df: n > 0 ? n - 1 : null,
      pTwoSided: null,
      cohenDz: null,
    };
  }

  const sdDifference = sampleSd(differences);
  const df = n - 1;
  const critical = studentTCritical95(df);

  if (sdDifference === null || critical === null) {
    return {
      n,
      conditionA,
      conditionB,
      meanA,
      meanB,
      difference,
      ci95: null,
      t: null,
      df,
      pTwoSided: null,
      cohenDz: null,
    };
  }

  if (sdDifference === 0) {
    return {
      n,
      conditionA,
      conditionB,
      meanA,
      meanB,
      difference,
      ci95: [difference, difference],
      t: difference === 0 ? 0 : difference > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
      df,
      pTwoSided: difference === 0 ? 1 : 0,
      cohenDz: difference === 0 ? 0 : null,
    };
  }

  const standardError = sdDifference / Math.sqrt(n);
  const t = difference / standardError;
  return {
    n,
    conditionA,
    conditionB,
    meanA,
    meanB,
    difference,
    ci95: [difference - critical * standardError, difference + critical * standardError],
    t,
    df,
    pTwoSided: studentTTwoSidedP(t, df),
    cohenDz: difference / sdDifference,
  };
}

function latestStudySessionForParticipant(
  participantId: string,
  attachmentId: string,
  sessions: CognitiveAnalysisSession[]
) {
  return (
    [...sessions]
      .filter(
        (session) =>
          session.participant_id === participantId &&
          session.study_cognitive_task_id === attachmentId &&
          session.session_mode === "study"
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0] || null
  );
}

function isOmission(trial: CognitiveAnalysisTrial) {
  const response = trial.response_payload?.response;
  return response === null || response === undefined || response === "";
}

export function buildCognitiveAttachmentAnalysis(args: {
  attachment: CognitiveAnalysisAttachment;
  participants: CognitiveAnalysisParticipant[];
  sessions: CognitiveAnalysisSession[];
  trials: CognitiveAnalysisTrial[];
  includeTestData?: boolean;
}): CognitiveAttachmentAnalysis {
  const { attachment, sessions, trials } = args;
  const participants = args.participants.filter(
    (participant) =>
      participant.status !== "withdrawn" &&
      (args.includeTestData || !participant.is_test)
  );
  const participantMetrics: CognitiveConditionParticipantMetric[] = [];
  const qualityFlags: CognitiveQualityFlag[] = [];
  const conditionOrder: string[] = [];
  let completedParticipantCount = 0;

  for (const participant of participants) {
    const session = latestStudySessionForParticipant(
      participant.id,
      attachment.id,
      sessions
    );
    if (!session) continue;

    const participantTrials = trials.filter((trial) => trial.session_id === session.id);
    if (session.status === "completed") completedParticipantCount += 1;
    else {
      qualityFlags.push({
        participantId: participant.id,
        sessionId: session.id,
        severity: "review",
        code: "incomplete_session",
        label: "Incomplete cognitive session",
        detail: "This participant started the task but the latest study session is not marked completed.",
      });
    }

    const labels = Array.from(
      new Set(participantTrials.map((trial) => trial.condition_label || "Unlabelled"))
    );
    for (const label of labels) {
      if (!conditionOrder.includes(label)) conditionOrder.push(label);
      const rows = participantTrials.filter(
        (trial) => (trial.condition_label || "Unlabelled") === label
      );
      const scorable = rows.filter((trial) => trial.correct !== null);
      const correct = scorable.filter((trial) => trial.correct === true).length;
      const rts = rows
        .map((trial) => finite(trial.reaction_time_ms))
        .filter((value): value is number => value !== null);
      const omissions = rows.filter(isOmission).length;
      participantMetrics.push({
        participantId: participant.id,
        condition: label,
        trials: rows.length,
        scorableTrials: scorable.length,
        correctTrials: correct,
        accuracy: scorable.length ? correct / scorable.length : null,
        rtCount: rts.length,
        meanRt: mean(rts),
        medianRt: median(rts),
        omissions,
      });
    }

    const totalTrials = participantTrials.length;
    const totalOmissions = participantTrials.filter(isOmission).length;
    const scorableTrials = participantTrials.filter((trial) => trial.correct !== null);
    const allRts = participantTrials
      .map((trial) => finite(trial.reaction_time_ms))
      .filter((value): value is number => value !== null);
    const participantMedianRt = median(allRts);

    if (totalTrials > 0 && totalOmissions / totalTrials >= 0.2) {
      qualityFlags.push({
        participantId: participant.id,
        sessionId: session.id,
        severity: "review",
        code: "high_omissions",
        label: "High omission rate",
        detail: `${Math.round((totalOmissions / totalTrials) * 100)}% of recorded trials had no response. Review before any exclusion decision.`,
      });
    }

    if (allRts.length >= 5 && participantMedianRt !== null && participantMedianRt < 150) {
      qualityFlags.push({
        participantId: participant.id,
        sessionId: session.id,
        severity: "review",
        code: "very_fast_responses",
        label: "Very fast median RT",
        detail: `Median RT was ${Math.round(participantMedianRt)} ms. This is a review flag, not an automatic exclusion rule.`,
      });
    }

    if (totalTrials > 0 && scorableTrials.length === 0) {
      qualityFlags.push({
        participantId: participant.id,
        sessionId: session.id,
        severity: "warning",
        code: "no_scorable_trials",
        label: "No scorable trials",
        detail: "The session contains trials but none has a resolved correct/incorrect value.",
      });
    }

    const timing = session.timing_quality || {};
    const refreshStability = finite(timing.refresh_stability);
    if (refreshStability !== null && refreshStability < 0.9) {
      qualityFlags.push({
        participantId: participant.id,
        sessionId: session.id,
        severity: "review",
        code: "unstable_refresh",
        label: "Unstable display calibration",
        detail: `Refresh-frame consistency was ${Math.round(refreshStability * 100)}%. Review browser/display timing diagnostics.`,
      });
    }

    const visibilityInterruptions = finite(timing.visibility_interruptions) || 0;
    if (visibilityInterruptions > 0) {
      qualityFlags.push({
        participantId: participant.id,
        sessionId: session.id,
        severity: "review",
        code: "visibility_interruptions",
        label: "Page visibility interruption",
        detail: `${visibilityInterruptions} visibility interruption${visibilityInterruptions === 1 ? "" : "s"} occurred during the task.`,
      });
    }

    const assetsFailed = finite(timing.assets_failed) || 0;
    if (assetsFailed > 0) {
      qualityFlags.push({
        participantId: participant.id,
        sessionId: session.id,
        severity: "warning",
        code: "asset_failure",
        label: "Stimulus asset load failure",
        detail: `${assetsFailed} task asset${assetsFailed === 1 ? "" : "s"} failed to preload for this session.`,
      });
    }
  }

  const conditionSummaries: CognitiveConditionSummary[] = conditionOrder.map(
    (condition) => {
      const rows = participantMetrics.filter((metric) => metric.condition === condition);
      const accuracies = rows
        .map((metric) => metric.accuracy)
        .filter((value): value is number => value !== null);
      const meanRts = rows
        .map((metric) => metric.meanRt)
        .filter((value): value is number => value !== null);
      return {
        condition,
        participants: rows.length,
        trials: rows.reduce((sum, row) => sum + row.trials, 0),
        scorableTrials: rows.reduce((sum, row) => sum + row.scorableTrials, 0),
        meanAccuracy: mean(accuracies),
        accuracyCi95: meanCi95(accuracies),
        meanRt: mean(meanRts),
        rtCi95: meanCi95(meanRts),
        medianParticipantRt: median(meanRts),
        omissions: rows.reduce((sum, row) => sum + row.omissions, 0),
      };
    }
  );

  return {
    attachmentId: attachment.id,
    participantCount: participants.length,
    completedParticipantCount,
    conditionLabels: conditionOrder,
    participantMetrics,
    conditionSummaries,
    qualityFlags,
  };
}

export function compareConditions(
  analysis: CognitiveAttachmentAnalysis,
  conditionA: string,
  conditionB: string
) {
  const byParticipant = new Map<
    string,
    { a?: CognitiveConditionParticipantMetric; b?: CognitiveConditionParticipantMetric }
  >();

  for (const metric of analysis.participantMetrics) {
    if (metric.condition !== conditionA && metric.condition !== conditionB) continue;
    const current = byParticipant.get(metric.participantId) || {};
    if (metric.condition === conditionA) current.a = metric;
    if (metric.condition === conditionB) current.b = metric;
    byParticipant.set(metric.participantId, current);
  }

  const rtPairs: Array<{ a: number; b: number }> = [];
  const accuracyPairs: Array<{ a: number; b: number }> = [];

  for (const pair of byParticipant.values()) {
    if (pair.a?.meanRt !== null && pair.a?.meanRt !== undefined && pair.b?.meanRt !== null && pair.b?.meanRt !== undefined) {
      rtPairs.push({ a: pair.a.meanRt, b: pair.b.meanRt });
    }
    if (pair.a?.accuracy !== null && pair.a?.accuracy !== undefined && pair.b?.accuracy !== null && pair.b?.accuracy !== undefined) {
      accuracyPairs.push({ a: pair.a.accuracy, b: pair.b.accuracy });
    }
  }

  return {
    rt: pairedComparison(conditionA, conditionB, rtPairs),
    accuracy: pairedComparison(conditionA, conditionB, accuracyPairs),
  };
}
