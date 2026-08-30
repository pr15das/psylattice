"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Sparkles, ShieldCheck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  buildCognitiveAttachmentAnalysis,
  compareConditions,
  type CognitiveAttachmentAnalysis,
} from "@/lib/research/cognitiveAnalysis";

type Props = {
  studyId: string;
  studyTitle: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ParticipantRow = {
  id: string;
  public_id: string;
  is_test: boolean;
  status: string;
};

type MeasureRow = {
  id: string;
  questionnaire_id: string;
  questionnaire_version_id: string;
  measurement_point: string;
  followup_wave_id: string | null;
  position: number;
  required: boolean;
};

type MeasureSessionRow = {
  id: string;
  participant_id: string;
  study_measure_id: string;
  status: string;
  scores: Record<string, unknown> | null;
  completed_at: string | null;
};

type QuestionnaireRow = {
  id: string;
  name: string;
  acronym: string | null;
};

type CognitiveAttachment = {
  id: string;
  task_id: string;
  version_id: string;
  position: number;
  required: boolean;
  title: string;
  short_title: string | null;
  domain: string;
  version_label: string;
};

type CognitiveSession = {
  id: string;
  study_cognitive_task_id: string | null;
  participant_id: string | null;
  session_mode: string;
  status: string;
  timing_quality: Record<string, unknown> | null;
  summary_scores: Record<string, unknown> | null;
  created_at: string;
};

type CognitiveTrial = {
  id: string;
  session_id: string;
  condition_label: string | null;
  correct: boolean | null;
  reaction_time_ms: number | null;
  response_payload: Record<string, unknown> | null;
};

type ResearchAiContext = Record<string, unknown>;

type LoadedContext = {
  summary: ResearchAiContext;
  participantLevel: ResearchAiContext;
  includedParticipants: number;
  questionnaireSummaries: number;
  cognitiveTasks: number;
  qualityFlags: number;
};

const suggestedPrompts = [
  "Summarize the main findings in this study.",
  "Explain the cognitive-task results in plain research language.",
  "Which participant sessions should I review for data quality?",
  "What can I safely say in a Results section from the analyses already run?",
  "What important statistical analyses are still missing?",
];

function numeric(value: unknown) {
  const next = typeof value === "number" ? value : Number(value);
  return Number.isFinite(next) ? next : null;
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function rounded(value: number | null, digits = 3) {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}


function storedStopSignalSummary(session: CognitiveSession) {
  const raw = session.summary_scores?.stop_signal;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  return String(value.paradigm || "stop_signal") === "stop_signal" ? value : null;
}


function storedCorsiSummary(session: CognitiveSession) {
  const raw = session.summary_scores?.corsi;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  return String(value.paradigm || "corsi") === "corsi" ? value : null;
}

function storedCorsiMode(
  summary: Record<string, unknown>,
  mode: "forward" | "backward"
) {
  const raw = summary[mode];
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null;
}

function storedCardSortSummary(session: CognitiveSession) {
  const raw = session.summary_scores?.card_sorting;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  return String(value.paradigm || "card_sorting") === "card_sorting"
    ? value
    : null;
}

function compactComparison(comparison: ReturnType<typeof compareConditions>) {
  if (!comparison) return null;
  const shape = (value: typeof comparison.rt) => ({
    n: value.n,
    mean_a: rounded(value.meanA),
    mean_b: rounded(value.meanB),
    difference_b_minus_a: rounded(value.difference),
    ci95: value.ci95?.map((item) => rounded(item)) || null,
    t: rounded(value.t),
    df: value.df,
    p_two_sided: value.pTwoSided,
    cohen_dz: rounded(value.cohenDz),
  });
  return {
    condition_a: comparison.rt.conditionA,
    condition_b: comparison.rt.conditionB,
    reaction_time: shape(comparison.rt),
    accuracy: shape(comparison.accuracy),
  };
}

function buildQuestionnaireContext(args: {
  participants: ParticipantRow[];
  measures: MeasureRow[];
  sessions: MeasureSessionRow[];
  questionnaires: QuestionnaireRow[];
}) {
  const participantIds = new Set(args.participants.map((item) => item.id));
  const participantPublicId = new Map(
    args.participants.map((item) => [item.id, item.public_id])
  );
  const questionnaireById = new Map(
    args.questionnaires.map((item) => [item.id, item])
  );
  const measureById = new Map(args.measures.map((item) => [item.id, item]));

  const grouped = new Map<
    string,
    {
      measure: MeasureRow;
      questionnaire: QuestionnaireRow | undefined;
      scoreName: string;
      values: number[];
    }
  >();
  const participantRows: Array<Record<string, unknown>> = [];

  for (const session of args.sessions) {
    if (session.status !== "completed" || !participantIds.has(session.participant_id)) {
      continue;
    }
    const measure = measureById.get(session.study_measure_id);
    if (!measure) continue;
    const questionnaire = questionnaireById.get(measure.questionnaire_id);
    const entries = session.scores && typeof session.scores === "object"
      ? Object.entries(session.scores)
      : [];

    for (const [scoreName, rawScore] of entries) {
      const score = numeric(rawScore);
      if (score === null) continue;
      const key = `${measure.id}::${scoreName}`;
      const existing = grouped.get(key) || {
        measure,
        questionnaire,
        scoreName,
        values: [],
      };
      existing.values.push(score);
      grouped.set(key, existing);
      participantRows.push({
        participant: participantPublicId.get(session.participant_id) || "pseudonymous participant",
        administration_position: measure.position,
        phase: measure.measurement_point,
        questionnaire: questionnaire?.name || "Questionnaire",
        acronym: questionnaire?.acronym || "",
        score: scoreName,
        value: score,
      });
    }
  }

  const summaries = Array.from(grouped.values()).map((item) => ({
    administration_position: item.measure.position,
    phase: item.measure.measurement_point,
    questionnaire: item.questionnaire?.name || "Questionnaire",
    acronym: item.questionnaire?.acronym || "",
    score: item.scoreName,
    n: item.values.length,
    mean: rounded(average(item.values)),
    median: rounded(median(item.values)),
    minimum: item.values.length ? Math.min(...item.values) : null,
    maximum: item.values.length ? Math.max(...item.values) : null,
    inferential_test_run: false,
  }));

  return { summaries, participantRows };
}

function buildCognitiveContext(args: {
  participants: ParticipantRow[];
  attachments: CognitiveAttachment[];
  sessions: CognitiveSession[];
  trials: CognitiveTrial[];
  includeTestData: boolean;
}) {
  const participantById = new Map(
    args.participants.map((item) => [item.id, item])
  );
  const taskSummaries: Array<Record<string, unknown>> = [];
  const participantRows: Array<Record<string, unknown>> = [];
  const qualityFlags: Array<Record<string, unknown>> = [];

  for (const attachment of args.attachments) {
    const analysis: CognitiveAttachmentAnalysis = buildCognitiveAttachmentAnalysis({
      attachment,
      participants: args.participants,
      sessions: args.sessions,
      trials: args.trials,
      includeTestData: args.includeTestData,
    });

    const comparisons: Array<Record<string, unknown>> = [];
    for (let a = 0; a < analysis.conditionLabels.length; a += 1) {
      for (let b = a + 1; b < analysis.conditionLabels.length; b += 1) {
        const comparison = compactComparison(
          compareConditions(
            analysis,
            analysis.conditionLabels[a],
            analysis.conditionLabels[b]
          )
        );
        if (comparison) comparisons.push(comparison);
      }
    }

    const stopSignalSessions = args.sessions
      .filter(
        (session) =>
          session.study_cognitive_task_id === attachment.id &&
          session.participant_id &&
          participantById.has(session.participant_id) &&
          session.session_mode === "study" &&
          session.status === "completed"
      )
      .map((session) => ({
        session,
        summary: storedStopSignalSummary(session),
      }))
      .filter(
        (item): item is { session: CognitiveSession; summary: Record<string, unknown> } =>
          item.summary !== null
      );

    const stopSsrts = stopSignalSessions
      .map((item) => numeric(item.summary.ssrt_integration_ms))
      .filter((value): value is number => value !== null);
    const stopSsds = stopSignalSessions
      .map((item) => numeric(item.summary.mean_ssd_ms))
      .filter((value): value is number => value !== null);
    const stopSuccesses = stopSignalSessions
      .map((item) => numeric(item.summary.stop_success_rate))
      .filter((value): value is number => value !== null);
    const stopGoRts = stopSignalSessions
      .map((item) => numeric(item.summary.mean_go_rt_ms))
      .filter((value): value is number => value !== null);
    const stopQualityFlagCount = stopSignalSessions.reduce(
      (sum, item) =>
        sum +
        (Array.isArray(item.summary.quality_flags)
          ? item.summary.quality_flags.length
          : 0),
      0
    );

    const corsiSessions = args.sessions
      .filter(
        (session) =>
          session.study_cognitive_task_id === attachment.id &&
          session.participant_id &&
          participantById.has(session.participant_id) &&
          session.session_mode === "study" &&
          session.status === "completed"
      )
      .map((session) => ({
        session,
        summary: storedCorsiSummary(session),
      }))
      .filter(
        (item): item is {
          session: CognitiveSession;
          summary: Record<string, unknown>;
        } => item.summary !== null
      );

    const corsiForwardSpans = corsiSessions
      .map((item) => numeric(storedCorsiMode(item.summary, "forward")?.span))
      .filter((value): value is number => value !== null);
    const corsiBackwardSpans = corsiSessions
      .map((item) => numeric(storedCorsiMode(item.summary, "backward")?.span))
      .filter((value): value is number => value !== null);
    const corsiForwardProducts = corsiSessions
      .map((item) =>
        numeric(storedCorsiMode(item.summary, "forward")?.product_score)
      )
      .filter((value): value is number => value !== null);
    const corsiBackwardProducts = corsiSessions
      .map((item) =>
        numeric(storedCorsiMode(item.summary, "backward")?.product_score)
      )
      .filter((value): value is number => value !== null);
    const corsiOverallAccuracy = corsiSessions
      .map((item) => numeric(item.summary.overall_sequence_accuracy))
      .filter((value): value is number => value !== null);
    const corsiForwardFirstTap = corsiSessions
      .map((item) =>
        numeric(
          storedCorsiMode(item.summary, "forward")?.mean_first_tap_latency_ms
        )
      )
      .filter((value): value is number => value !== null);
    const corsiBackwardFirstTap = corsiSessions
      .map((item) =>
        numeric(
          storedCorsiMode(item.summary, "backward")?.mean_first_tap_latency_ms
        )
      )
      .filter((value): value is number => value !== null);
    const corsiQualityFlagCount = corsiSessions.reduce(
      (sum, item) =>
        sum +
        (Array.isArray(item.summary.quality_flags)
          ? item.summary.quality_flags.length
          : 0),
      0
    );

    const cardSortSessions = args.sessions
      .filter(
        (session) =>
          session.study_cognitive_task_id === attachment.id &&
          session.participant_id &&
          participantById.has(session.participant_id) &&
          session.session_mode === "study" &&
          session.status === "completed"
      )
      .map((session) => ({
        session,
        summary: storedCardSortSummary(session),
      }))
      .filter(
        (item): item is {
          session: CognitiveSession;
          summary: Record<string, unknown>;
        } => item.summary !== null
      );

    const cardSortCategories = cardSortSessions
      .map((item) => numeric(item.summary.categories_completed))
      .filter((value): value is number => value !== null);
    const cardSortTotalErrors = cardSortSessions
      .map((item) => numeric(item.summary.total_errors))
      .filter((value): value is number => value !== null);
    const cardSortPerseverativeErrors = cardSortSessions
      .map((item) => numeric(item.summary.perseverative_errors))
      .filter((value): value is number => value !== null);
    const cardSortPerseverativeRates = cardSortSessions
      .map((item) => numeric(item.summary.perseverative_error_rate))
      .filter((value): value is number => value !== null);
    const cardSortPerseverativeShares = cardSortSessions
      .map((item) => numeric(item.summary.perseverative_share_of_errors))
      .filter((value): value is number => value !== null);
    const cardSortNonperseverativeErrors = cardSortSessions
      .map((item) => numeric(item.summary.nonperseverative_errors))
      .filter((value): value is number => value !== null);
    const cardSortFailuresMaintain = cardSortSessions
      .map((item) => numeric(item.summary.failures_to_maintain_set))
      .filter((value): value is number => value !== null);
    const cardSortTrialsFirstCategory = cardSortSessions
      .map((item) => numeric(item.summary.trials_to_first_category))
      .filter((value): value is number => value !== null);
    const cardSortLatencies = cardSortSessions
      .map((item) => numeric(item.summary.mean_response_latency_ms))
      .filter((value): value is number => value !== null);
    const cardSortAccuracies = cardSortSessions
      .map((item) => numeric(item.summary.accuracy))
      .filter((value): value is number => value !== null);
    const cardSortQualityFlagCount = cardSortSessions.reduce(
      (sum, item) =>
        sum +
        (Array.isArray(item.summary.quality_flags)
          ? item.summary.quality_flags.length
          : 0),
      0
    );

    taskSummaries.push({
      administration_position: attachment.position,
      task: attachment.title,
      version: attachment.version_label,
      domain: attachment.domain,
      participant_count: analysis.participantCount,
      completed_participant_count: analysis.completedParticipantCount,
      condition_summaries: analysis.conditionSummaries.map((summary) => ({
        condition: summary.condition,
        participants: summary.participants,
        trials: summary.trials,
        scorable_trials: summary.scorableTrials,
        mean_accuracy: rounded(summary.meanAccuracy),
        accuracy_ci95: summary.accuracyCi95?.map((item) => rounded(item)) || null,
        mean_rt_ms: rounded(summary.meanRt),
        rt_ci95_ms: summary.rtCi95?.map((item) => rounded(item)) || null,
        median_participant_rt_ms: rounded(summary.medianParticipantRt),
        omissions: summary.omissions,
      })),
      paired_comparisons: comparisons,
      dedicated_stop_signal:
        stopSignalSessions.length > 0
          ? {
              numerical_source: "stored cognitive_task_sessions.summary_scores.stop_signal",
              method: "integration_with_go_omission_replacement",
              completed_runs: stopSignalSessions.length,
              participants_with_estimable_ssrt: stopSsrts.length,
              mean_ssrt_ms: rounded(average(stopSsrts)),
              median_ssrt_ms: rounded(median(stopSsrts)),
              mean_ssd_ms: rounded(average(stopSsds)),
              mean_stop_success_rate: rounded(average(stopSuccesses)),
              mean_go_rt_ms: rounded(average(stopGoRts)),
              stored_quality_flag_count: stopQualityFlagCount,
              note:
                "These values were computed and stored by the deterministic PsyLattice Stop-Signal runtime. The AI must not recalculate SSRT from participant rows.",
            }
          : null,
      dedicated_corsi:
        corsiSessions.length > 0
          ? {
              numerical_source:
                "stored cognitive_task_sessions.summary_scores.corsi",
              scoring:
                "Span = longest correctly reproduced sequence according to the configured progression rule. Product score = span × total correct sequences for that mode.",
              completed_runs: corsiSessions.length,
              participants_with_forward_span: corsiForwardSpans.length,
              participants_with_backward_span: corsiBackwardSpans.length,
              mean_forward_span: rounded(average(corsiForwardSpans)),
              median_forward_span: rounded(median(corsiForwardSpans)),
              mean_backward_span: rounded(average(corsiBackwardSpans)),
              median_backward_span: rounded(median(corsiBackwardSpans)),
              mean_forward_product_score: rounded(average(corsiForwardProducts)),
              mean_backward_product_score: rounded(average(corsiBackwardProducts)),
              mean_overall_sequence_accuracy: rounded(average(corsiOverallAccuracy)),
              mean_forward_first_tap_latency_ms: rounded(
                average(corsiForwardFirstTap)
              ),
              mean_backward_first_tap_latency_ms: rounded(
                average(corsiBackwardFirstTap)
              ),
              stored_quality_flag_count: corsiQualityFlagCount,
              normative_cutoff_applied: false,
              note:
                "These values were computed and stored by the deterministic PsyLattice Corsi runtime. The AI may interpret them but must not recalculate span or product scores from raw sequences.",
            }
          : null,
      dedicated_card_sorting:
        cardSortSessions.length > 0
          ? {
              numerical_source:
                "stored cognitive_task_sessions.summary_scores.card_sorting",
              scoring_system: "psylattice_transparent_v1",
              official_wcst_equivalence: false,
              completed_runs: cardSortSessions.length,
              mean_categories_completed: rounded(average(cardSortCategories)),
              median_categories_completed: rounded(median(cardSortCategories)),
              mean_total_errors: rounded(average(cardSortTotalErrors)),
              mean_perseverative_errors: rounded(
                average(cardSortPerseverativeErrors)
              ),
              mean_perseverative_error_rate: rounded(
                average(cardSortPerseverativeRates)
              ),
              mean_perseverative_share_of_errors: rounded(
                average(cardSortPerseverativeShares)
              ),
              mean_nonperseverative_errors: rounded(
                average(cardSortNonperseverativeErrors)
              ),
              mean_failures_to_maintain_set: rounded(
                average(cardSortFailuresMaintain)
              ),
              mean_trials_to_first_category: rounded(
                average(cardSortTrialsFirstCategory)
              ),
              mean_response_latency_ms: rounded(average(cardSortLatencies)),
              mean_accuracy: rounded(average(cardSortAccuracies)),
              stored_quality_flag_count: cardSortQualityFlagCount,
              scoring_definition:
                "PsyLattice perseverative error = an incorrect response matching the immediately previous hidden sorting rule after a rule shift. Other incorrect responses are nonperseverative. Failure to maintain set = an error after the configured correct-streak threshold but before category completion.",
              note:
                "This is an original PsyLattice WCST-style research paradigm. These are not official standardized WCST scores, and the AI must not map them onto proprietary WCST norms, standard scores or Heaton scoring categories.",
            }
          : null,
      quality_flag_count:
        analysis.qualityFlags.length +
        stopQualityFlagCount +
        corsiQualityFlagCount +
        cardSortQualityFlagCount,
    });

    stopSignalSessions.forEach(({ session, summary }) => {
      if (!session.participant_id) return;
      participantRows.push({
        participant:
          participantById.get(session.participant_id)?.public_id ||
          "pseudonymous participant",
        administration_position: attachment.position,
        task: attachment.title,
        paradigm: "stop_signal",
        ssrt_ms: rounded(numeric(summary.ssrt_integration_ms)),
        mean_ssd_ms: rounded(numeric(summary.mean_ssd_ms)),
        stop_success_rate: rounded(numeric(summary.stop_success_rate)),
        p_respond_signal: rounded(numeric(summary.p_respond_signal)),
        mean_go_rt_ms: rounded(numeric(summary.mean_go_rt_ms)),
        go_omissions: numeric(summary.go_omissions),
        go_choice_errors: numeric(summary.go_choice_errors),
        stored_summary_only: true,
      });

      const flags = Array.isArray(summary.quality_flags)
        ? summary.quality_flags as Array<Record<string, unknown>>
        : [];
      flags.forEach((flag) => {
        qualityFlags.push({
          participant:
            participantById.get(session.participant_id as string)?.public_id ||
            "pseudonymous participant",
          administration_position: attachment.position,
          task: attachment.title,
          severity: String(flag.level || "review"),
          code: String(flag.code || "stop_signal_review"),
          label: String(flag.code || "stop signal review").replaceAll("_", " "),
          detail: String(flag.message || "Review the Stop-Signal session."),
          researcher_action:
            "Review only; PsyLattice has not excluded this participant.",
          numerical_source:
            "cognitive_task_sessions.summary_scores.stop_signal",
        });
      });
    });

    corsiSessions.forEach(({ session, summary }) => {
      if (!session.participant_id) return;
      const forward = storedCorsiMode(summary, "forward");
      const backward = storedCorsiMode(summary, "backward");

      participantRows.push({
        participant:
          participantById.get(session.participant_id)?.public_id ||
          "pseudonymous participant",
        administration_position: attachment.position,
        task: attachment.title,
        paradigm: "corsi",
        forward_span: rounded(numeric(forward?.span)),
        backward_span: rounded(numeric(backward?.span)),
        forward_product_score: rounded(numeric(forward?.product_score)),
        backward_product_score: rounded(numeric(backward?.product_score)),
        forward_sequence_accuracy: rounded(numeric(forward?.sequence_accuracy)),
        backward_sequence_accuracy: rounded(numeric(backward?.sequence_accuracy)),
        overall_sequence_accuracy: rounded(
          numeric(summary.overall_sequence_accuracy)
        ),
        forward_mean_first_tap_latency_ms: rounded(
          numeric(forward?.mean_first_tap_latency_ms)
        ),
        backward_mean_first_tap_latency_ms: rounded(
          numeric(backward?.mean_first_tap_latency_ms)
        ),
        stored_summary_only: true,
      });

      const flags = Array.isArray(summary.quality_flags)
        ? (summary.quality_flags as Array<Record<string, unknown>>)
        : [];

      flags.forEach((flag) => {
        qualityFlags.push({
          participant:
            participantById.get(session.participant_id as string)?.public_id ||
            "pseudonymous participant",
          administration_position: attachment.position,
          task: attachment.title,
          severity: String(flag.level || "review"),
          code: String(flag.code || "corsi_review"),
          label: String(flag.code || "corsi review").replaceAll("_", " "),
          detail: String(flag.message || "Review the Corsi session."),
          researcher_action:
            "Review only; PsyLattice has not excluded this participant.",
          numerical_source:
            "cognitive_task_sessions.summary_scores.corsi",
        });
      });
    });

    cardSortSessions.forEach(({ session, summary }) => {
      if (!session.participant_id) return;

      participantRows.push({
        participant:
          participantById.get(session.participant_id)?.public_id ||
          "pseudonymous participant",
        administration_position: attachment.position,
        task: attachment.title,
        paradigm: "card_sorting",
        scoring_system: String(
          summary.scoring_system || "psylattice_transparent_v1"
        ),
        categories_completed: numeric(summary.categories_completed),
        total_trials: numeric(summary.total_trials),
        total_errors: numeric(summary.total_errors),
        accuracy: rounded(numeric(summary.accuracy)),
        perseverative_errors: numeric(summary.perseverative_errors),
        perseverative_error_rate: rounded(
          numeric(summary.perseverative_error_rate)
        ),
        perseverative_share_of_errors: rounded(
          numeric(summary.perseverative_share_of_errors)
        ),
        nonperseverative_errors: numeric(summary.nonperseverative_errors),
        failures_to_maintain_set: numeric(summary.failures_to_maintain_set),
        trials_to_first_category: numeric(summary.trials_to_first_category),
        mean_response_latency_ms: rounded(
          numeric(summary.mean_response_latency_ms)
        ),
        stored_summary_only: true,
        official_wcst_score: false,
      });

      const flags = Array.isArray(summary.quality_flags)
        ? (summary.quality_flags as Array<Record<string, unknown>>)
        : [];

      flags.forEach((flag) => {
        qualityFlags.push({
          participant:
            participantById.get(session.participant_id as string)?.public_id ||
            "pseudonymous participant",
          administration_position: attachment.position,
          task: attachment.title,
          severity: String(flag.level || "review"),
          code: String(flag.code || "card_sorting_review"),
          label: String(flag.code || "card sorting review").replaceAll("_", " "),
          detail: String(flag.message || "Review the Card Sorting session."),
          researcher_action:
            "Review only; PsyLattice has not excluded this participant.",
          numerical_source:
            "cognitive_task_sessions.summary_scores.card_sorting",
          scoring_system: "psylattice_transparent_v1",
          official_wcst_score: false,
        });
      });
    });

    analysis.participantMetrics.forEach((metric) => {
      participantRows.push({
        participant:
          participantById.get(metric.participantId)?.public_id ||
          "pseudonymous participant",
        administration_position: attachment.position,
        task: attachment.title,
        condition: metric.condition,
        trials: metric.trials,
        scorable_trials: metric.scorableTrials,
        accuracy: rounded(metric.accuracy),
        mean_rt_ms: rounded(metric.meanRt),
        median_rt_ms: rounded(metric.medianRt),
        omissions: metric.omissions,
      });
    });

    analysis.qualityFlags.forEach((flag) => {
      qualityFlags.push({
        participant:
          participantById.get(flag.participantId)?.public_id ||
          "pseudonymous participant",
        administration_position: attachment.position,
        task: attachment.title,
        severity: flag.severity,
        code: flag.code,
        label: flag.label,
        detail: flag.detail,
        researcher_action: "Review only; PsyLattice has not excluded this participant.",
      });
    });
  }

  return { taskSummaries, participantRows, qualityFlags };
}

function fitContext(context: ResearchAiContext, maxChars = 420_000) {
  const serialized = JSON.stringify(context);
  if (serialized.length <= maxChars) return context;

  const clone = structuredClone(context) as Record<string, any>;
  const participant = clone.participant_level;
  if (participant && typeof participant === "object") {
    if (Array.isArray(participant.questionnaire_scores)) {
      participant.questionnaire_scores = participant.questionnaire_scores.slice(0, 500);
    }
    if (Array.isArray(participant.cognitive_condition_metrics)) {
      participant.cognitive_condition_metrics = participant.cognitive_condition_metrics.slice(0, 1000);
    }
    participant.truncated_for_ai_context = true;
  }
  return clone;
}

async function loadStudyAiContext(
  studyId: string,
  includeTestData: boolean
): Promise<LoadedContext> {
  const supabase = createClient();

  const [
    studyResult,
    participantResult,
    measureResult,
    measureSessionResult,
    cognitiveAttachmentResult,
    ambulatoryPromptResult,
    ambulatoryCheckinResult,
    ambulatoryResponseResult,
    consentResult,
    demographicResult,
  ] = await Promise.all([
    supabase
      .from("research_studies")
      .select("id,title,status,target_sample_size,components,design,participant_description")
      .eq("id", studyId)
      .maybeSingle(),
    supabase
      .from("study_participants")
      .select("id,public_id,is_test,status")
      .eq("study_id", studyId),
    supabase
      .from("study_measures")
      .select("id,questionnaire_id,questionnaire_version_id,measurement_point,followup_wave_id,position,required")
      .eq("study_id", studyId)
      .order("position", { ascending: true }),
    supabase
      .from("study_measure_sessions")
      .select("id,participant_id,study_measure_id,status,scores,completed_at")
      .eq("study_id", studyId),
    supabase
      .from("study_cognitive_tasks")
      .select("id,task_id,version_id,position,required,cognitive_tasks(title,short_title,domain),cognitive_task_versions(version_label)")
      .eq("study_id", studyId)
      .order("position", { ascending: true }),
    supabase
      .from("study_ambulatory_prompt_instances")
      .select("id,participant_id,status")
      .eq("study_id", studyId),
    supabase
      .from("study_ambulatory_checkins")
      .select("id,participant_id,completed_at")
      .eq("study_id", studyId),
    supabase
      .from("study_ambulatory_responses")
      .select("id,participant_id")
      .eq("study_id", studyId),
    supabase
      .from("participant_consents")
      .select("id,participant_id,consented")
      .eq("study_id", studyId),
    supabase
      .from("participant_demographic_responses")
      .select("id,participant_id")
      .eq("study_id", studyId),
  ]);

  const fatal = [
    studyResult,
    participantResult,
    measureResult,
    measureSessionResult,
    cognitiveAttachmentResult,
  ].find((result) => result.error);

  if (fatal?.error || !studyResult.data) {
    throw new Error(
      fatal?.error?.message || "Study analysis context could not be loaded."
    );
  }

  const allParticipants = (participantResult.data || []) as ParticipantRow[];
  const participants = allParticipants.filter(
    (participant) =>
      participant.status !== "withdrawn" &&
      (includeTestData || !participant.is_test)
  );
  const participantIds = new Set(participants.map((item) => item.id));

  const measures = (measureResult.data || []) as MeasureRow[];
  const measureSessions = ((measureSessionResult.data || []) as MeasureSessionRow[]).filter(
    (item) => participantIds.has(item.participant_id)
  );

  const questionnaireIds = Array.from(
    new Set(measures.map((item) => item.questionnaire_id))
  );
  let questionnaires: QuestionnaireRow[] = [];
  if (questionnaireIds.length) {
    const { data, error } = await supabase
      .from("questionnaires")
      .select("id,name,acronym")
      .in("id", questionnaireIds);
    if (error) throw new Error("Questionnaire metadata could not be loaded.");
    questionnaires = (data || []) as QuestionnaireRow[];
  }

  const attachments: CognitiveAttachment[] = (cognitiveAttachmentResult.data || []).map(
    (row: any) => ({
      id: String(row.id),
      task_id: String(row.task_id),
      version_id: String(row.version_id),
      position: Number(row.position || 0),
      required: Boolean(row.required),
      title: String(row.cognitive_tasks?.title || "Cognitive task"),
      short_title: row.cognitive_tasks?.short_title || null,
      domain: String(row.cognitive_tasks?.domain || "general"),
      version_label: String(
        row.cognitive_task_versions?.version_label || "Published version"
      ),
    })
  );

  let cognitiveSessions: CognitiveSession[] = [];
  let cognitiveTrials: CognitiveTrial[] = [];
  const attachmentIds = attachments.map((item) => item.id);

  if (attachmentIds.length) {
    const { data, error } = await supabase
      .from("cognitive_task_sessions")
      .select("id,study_cognitive_task_id,participant_id,session_mode,status,timing_quality,summary_scores,created_at")
      .in("study_cognitive_task_id", attachmentIds)
      .eq("session_mode", "study");
    if (error) throw new Error("Cognitive sessions could not be loaded.");
    cognitiveSessions = (data || []) as CognitiveSession[];

    const sessionIds = cognitiveSessions.map((item) => item.id);
    if (sessionIds.length) {
      const { data: trialData, error: trialError } = await supabase
        .from("cognitive_trial_results")
        .select("id,session_id,condition_label,correct,reaction_time_ms,response_payload")
        .in("session_id", sessionIds);
      if (trialError) throw new Error("Cognitive trial data could not be loaded.");
      cognitiveTrials = (trialData || []) as CognitiveTrial[];
    }
  }

  const questionnaireContext = buildQuestionnaireContext({
    participants,
    measures,
    sessions: measureSessions,
    questionnaires,
  });
  const cognitiveContext = buildCognitiveContext({
    participants,
    attachments,
    sessions: cognitiveSessions,
    trials: cognitiveTrials,
    includeTestData,
  });

  const participantStatusCounts = participants.reduce<Record<string, number>>(
    (acc, participant) => {
      acc[participant.status] = (acc[participant.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const countForIncluded = (rows: any[] | null | undefined) =>
    (rows || []).filter((row) => participantIds.has(String(row.participant_id))).length;

  const completedCheckins = (ambulatoryCheckinResult.data || []).filter(
    (row: any) =>
      participantIds.has(String(row.participant_id)) && Boolean(row.completed_at)
  ).length;

  const summary: ResearchAiContext = {
    context_version: "psylattice_research_ai_phase_2g_card_sorting",
    generated_at: new Date().toISOString(),
    source_policy: {
      numerical_source: "PsyLattice deterministic study data and analysis engine",
      ai_role: "interpretation and explanation only",
      direct_identifiers_included: false,
      participant_level_included: false,
      include_test_data: includeTestData,
    },
    study: {
      id: studyResult.data.id,
      title: studyResult.data.title,
      status: studyResult.data.status,
      design: studyResult.data.design || null,
      participant_description: studyResult.data.participant_description || null,
      target_sample_size: studyResult.data.target_sample_size,
      components: studyResult.data.components || {},
    },
    participant_accumulation: {
      included_participants: participants.length,
      live_participants: participants.filter((item) => !item.is_test).length,
      test_participants: participants.filter((item) => item.is_test).length,
      status_counts: participantStatusCounts,
      consent_records: countForIncluded(consentResult.data as any[]),
      demographic_response_rows: countForIncluded(demographicResult.data as any[]),
      completed_questionnaire_sessions: measureSessions.filter(
        (item) => item.status === "completed"
      ).length,
      completed_cognitive_sessions: cognitiveSessions.filter(
        (item) =>
          item.status === "completed" &&
          Boolean(item.participant_id) &&
          participantIds.has(String(item.participant_id))
      ).length,
    },
    questionnaires: {
      administrations: measures.map((measure) => {
        const questionnaire = questionnaires.find(
          (item) => item.id === measure.questionnaire_id
        );
        return {
          administration_position: measure.position,
          phase: measure.measurement_point,
          questionnaire: questionnaire?.name || "Questionnaire",
          acronym: questionnaire?.acronym || "",
          required: measure.required,
        };
      }),
      verified_score_summaries: questionnaireContext.summaries,
      note:
        "Only numeric scores already stored by PsyLattice are summarized here. No new questionnaire inferential tests are calculated by the AI.",
    },
    cognitive_tasks: {
      verified_analyses: cognitiveContext.taskSummaries,
      quality_flags: cognitiveContext.qualityFlags,
      quality_policy:
        "Flags are review prompts only. PsyLattice has not automatically excluded participants or trials.",
      dedicated_paradigm_policy:
        "When dedicated_stop_signal is present, SSRT/SSD/Stop-success values come from stored deterministic session summaries. When dedicated_corsi is present, Forward/Backward span, product scores, sequence accuracy and latency summaries come from stored deterministic Corsi summaries. When dedicated_card_sorting is present, categories completed, transparent PsyLattice perseveration metrics, set-maintenance errors and latency summaries come from stored deterministic Card Sorting summaries. The assistant may explain these values but must not recompute them from raw trials or describe them as official standardized WCST scores.",
    },
    ambulatory: {
      prompt_instances: countForIncluded(ambulatoryPromptResult.data as any[]),
      completed_checkins: completedCheckins,
      response_rows: countForIncluded(ambulatoryResponseResult.data as any[]),
      inferential_analysis_run: false,
    },
    analysis_boundaries: [
      "Cognitive condition summaries, 95% confidence intervals, paired t-tests and Cohen's dz are authoritative only when explicitly present in cognitive_tasks.verified_analyses.",
      "Stop-Signal SSRT, SSD, inhibition rate and associated quality flags are authoritative only when explicitly present in a stored dedicated_stop_signal summary. Do not derive SSRT from participant-level rows.",
      "Corsi Forward/Backward span, product scores, sequence accuracy and associated quality flags are authoritative only when explicitly present in a stored dedicated_corsi summary. Do not recalculate span or product scores from raw sequence rows, and do not invent normative cutoffs.",
      "Card Sorting categories completed, perseverative/nonperseverative errors, failure-to-maintain-set and latency summaries are authoritative only when explicitly present in a stored dedicated_card_sorting summary. They use PsyLattice transparent scoring, not proprietary official WCST scoring. Do not invent official WCST norms, standard scores, percentiles, T scores or diagnostic interpretations.",
      "Questionnaire score summaries are descriptive only in this phase unless a separate inferential result is explicitly present.",
      "Questionnaire–cognitive associations, regression, mixed models and trial-level generalized models have not been run by Phase 1I.",
      "The AI must not calculate or invent missing p-values, confidence intervals, correlations, effect sizes or exclusions.",
      "Raw study exports remain available independently of the AI.",
    ],
  };

  const participantLevel: ResearchAiContext = {
    questionnaire_scores: questionnaireContext.participantRows,
    cognitive_condition_metrics: cognitiveContext.participantRows,
    data_quality_flags: cognitiveContext.qualityFlags,
    privacy_note:
      "Rows use PsyLattice pseudonymous participant IDs. Direct identifiers are not queried or included.",
  };

  return {
    summary,
    participantLevel,
    includedParticipants: participants.length,
    questionnaireSummaries: questionnaireContext.summaries.length,
    cognitiveTasks: cognitiveContext.taskSummaries.length,
    qualityFlags: cognitiveContext.qualityFlags.length,
  };
}

export default function ResearchAiAssistant({ studyId, studyTitle }: Props) {
  const [includeTestData, setIncludeTestData] = useState(false);
  const [includeParticipantLevel, setIncludeParticipantLevel] = useState(false);
  const [loaded, setLoaded] = useState<LoadedContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [contextError, setContextError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  async function refreshContext() {
    setLoadingContext(true);
    setContextError("");
    try {
      const next = await loadStudyAiContext(studyId, includeTestData);
      setLoaded(next);
    } catch (error) {
      console.error("Could not build Research AI context:", error);
      setLoaded(null);
      setContextError(
        error instanceof Error
          ? error.message
          : "The study context could not be prepared."
      );
    } finally {
      setLoadingContext(false);
    }
  }

  useEffect(() => {
    setMessages([]);
    setDraft("");
    setChatError("");
    void refreshContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId, includeTestData]);

  const effectiveContext = useMemo(() => {
    if (!loaded) return null;
    const context: ResearchAiContext = {
      ...loaded.summary,
      source_policy: {
        ...((loaded.summary.source_policy || {}) as Record<string, unknown>),
        participant_level_included: includeParticipantLevel,
      },
    };
    if (includeParticipantLevel) {
      context.participant_level = loaded.participantLevel;
    }
    return fitContext(context);
  }, [loaded, includeParticipantLevel]);

  async function send(questionOverride?: string) {
    const question = (questionOverride ?? draft).trim();
    if (!question || !effectiveContext || sending) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setChatError("");

    try {
      const response = await fetch("/api/research-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          study_id: studyId,
          messages: nextMessages,
          context: effectiveContext,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        reply?: string;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.reply) {
        throw new Error(data.error || "The Research Assistant could not respond.");
      }
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (error) {
      setChatError(
        error instanceof Error
          ? error.message
          : "The Research Assistant could not respond."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-950 to-cyan-950 px-5 py-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                PsyLattice Research AI
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                Research Assistant
              </h2>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300">
                Interprets the verified study outputs PsyLattice has already calculated. It does not replace the analysis engine or raw-data export.
              </p>
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold text-slate-300">
            {studyTitle}
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-800" />
              <div>
                <p className="text-xs font-semibold text-cyan-950">Data boundary</p>
                <p className="mt-1 text-xs leading-5 text-cyan-900/70">
                  Aggregate verified summaries are shared by default. Direct identifiers are never included. Participant-level derived summaries are pseudonymous and require the explicit toggle below.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refreshContext()}
            disabled={loadingContext}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingContext ? "animate-spin" : ""}`} />
            Refresh study context
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={includeTestData}
              onChange={(event) => setIncludeTestData(event.target.checked)}
            />
            Include TEST data
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={includeParticipantLevel}
              onChange={(event) => setIncludeParticipantLevel(event.target.checked)}
            />
            Include pseudonymous participant-level summaries
          </label>
        </div>

        {loadingContext ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
            Preparing verified study context…
          </div>
        ) : contextError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {contextError}
          </div>
        ) : loaded ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Participants", loaded.includedParticipants],
              ["Questionnaire score summaries", loaded.questionnaireSummaries],
              ["Cognitive administrations", loaded.cognitiveTasks],
              ["Quality flags", loaded.qualityFlags],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{String(value)}</p>
              </div>
            ))}
          </div>
        ) : null}

        {loaded && (
          <>
            {messages.length === 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-700">Ask about this study</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void send(prompt)}
                      disabled={sending}
                      className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "ml-auto bg-slate-950 text-white"
                        : "mr-auto border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                ))}
                {sending && (
                  <div className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
                    <BrainCircuit className="h-4 w-4 animate-pulse" />
                    Interpreting verified results…
                  </div>
                )}
              </div>
            )}

            {chatError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {chatError}
              </div>
            )}

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 4000))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={3}
                placeholder="Ask about the study results, data quality, interpretation, or what analysis is still missing…"
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-300"
              />
              <div className="flex gap-2 lg:flex-col">
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!draft.trim() || !effectiveContext || sending}
                  className="flex-1 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40 lg:flex-none"
                >
                  {sending ? "Thinking…" : "Ask"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setDraft("");
                    setChatError("");
                  }}
                  disabled={sending || messages.length === 0}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500 disabled:opacity-40"
                >
                  New chat
                </button>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              AI chat history is kept only in this page state and is not stored by this feature. Numerical conclusions must come from the PsyLattice analysis engine or an explicitly run statistical module.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
