import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { researchAdmin } from "@/lib/research/serverAccess";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_RETURNED_ROWS = 50_000;

type AccessContext = {
  ok?: boolean;
  allowed?: boolean;
  access_type?: "owner" | "collaborator";
  role?: string;
  study_id?: string;
  study_title?: string;
  owner_user_id?: string;
  permissions?: Record<string, boolean>;
  error?: string;
};

type DatasetType =
  | "analysis_wide"
  | "demographics"
  | "questionnaire_responses"
  | "questionnaire_scores"
  | "cognitive_sessions"
  | "cognitive_trials"
  | "ambulatory_checkins"
  | "ambulatory_wide";

type Row = Record<string, unknown>;
type CodebookRow = {
  variable: string;
  label: string;
  type: string;
  source: string;
  notes: string;
};

const DATASET_LABELS: Record<DatasetType, string> = {
  analysis_wide: "Analysis dataset — one row per participant",
  demographics: "Demographics — long format",
  questionnaire_responses: "Questionnaire responses — long format",
  questionnaire_scores: "Questionnaire scores — long format",
  cognitive_sessions: "Cognitive task sessions",
  cognitive_trials: "Cognitive trials — raw data",
  ambulatory_checkins: "Ambulatory check-ins",
  ambulatory_wide: "Ambulatory check-ins — analysis wide",
};

function reply(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function validDataset(value: string): value is DatasetType {
  return Object.prototype.hasOwnProperty.call(DATASET_LABELS, value);
}

function safeVariable(value: unknown) {
  const safe = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72);
  return safe || "value";
}

function jsonText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function scalarResponse(row: {
  response?: unknown;
  numeric_value?: number | null;
  text_value?: string | null;
  score_value?: number | null;
}) {
  if (row.numeric_value !== null && row.numeric_value !== undefined) return row.numeric_value;
  if (row.score_value !== null && row.score_value !== undefined) return row.score_value;
  if (row.text_value !== null && row.text_value !== undefined && row.text_value !== "") {
    return row.text_value;
  }
  if (
    row.response === null ||
    row.response === undefined ||
    typeof row.response === "object"
  ) {
    return row.response === null || row.response === undefined
      ? ""
      : jsonText(row.response);
  }
  return row.response;
}

function flattenPrimitive(
  target: Row,
  prefix: string,
  value: unknown,
  depth = 0,
) {
  if (depth > 3 || value === null || value === undefined) return;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    target[prefix] = value;
    return;
  }

  if (Array.isArray(value)) {
    target[prefix] = jsonText(value);
    return;
  }

  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const next = `${prefix}_${safeVariable(key)}`;
      if (
        nested === null ||
        nested === undefined ||
        typeof nested === "string" ||
        typeof nested === "number" ||
        typeof nested === "boolean"
      ) {
        target[next] = nested ?? "";
      } else if (depth < 2) {
        flattenPrimitive(target, next, nested, depth + 1);
      } else {
        target[next] = jsonText(nested);
      }
    }
  }
}

function inferCodebook(rows: Row[], sources: Record<string, string>): CodebookRow[] {
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));

  return columns.map((variable) => {
    const observed = rows
      .map((row) => row[variable])
      .filter((value) => value !== null && value !== undefined && value !== "")
      .slice(0, 250);

    const numeric =
      observed.length > 0 &&
      observed.every((value) => finiteNumber(value) !== null);
    const boolean =
      observed.length > 0 &&
      observed.every((value) => typeof value === "boolean");

    return {
      variable,
      label: variable
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      type: numeric ? "Numeric" : boolean ? "Boolean" : "String / categorical",
      source: sources[variable] || "PsyLattice study data",
      notes:
        variable === "participant"
          ? "Pseudonymous PsyLattice participant identifier. Direct identifiers are not exposed in Shared Workspace."
          : "Shared-workspace field generated from the owner's study data.",
    };
  });
}

function truncateRows(rows: Row[]) {
  return {
    rows: rows.slice(0, MAX_RETURNED_ROWS),
    truncated: rows.length > MAX_RETURNED_ROWS,
    totalRows: rows.length,
  };
}

export async function GET(request: NextRequest) {
  try {
    const studyId =
      request.nextUrl.searchParams.get("study_id")?.trim() ||
      request.nextUrl.searchParams.get("studyId")?.trim() ||
      "";
    const datasetRaw =
      request.nextUrl.searchParams.get("dataset")?.trim() || "analysis_wide";
    const requestedPurpose = request.nextUrl.searchParams.get("purpose")?.trim();
    const purpose =
      requestedPurpose === "analysis"
        ? "analysis"
        : requestedPurpose === "export"
          ? "export"
          : "explorer";
    const includeTestData =
      request.nextUrl.searchParams.get("include_test") === "true";

    if (!validUuid(studyId)) {
      return reply({ ok: false, error: "A valid study_id is required." }, 400);
    }
    if (!validDataset(datasetRaw)) {
      return reply({ ok: false, error: "That shared dataset is not supported." }, 400);
    }

    const sessionSupabase = await createServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await sessionSupabase.auth.getUser();

    if (userError || !user) {
      return reply({ ok: false, error: "Please sign in again." }, 401);
    }

    const { data: rawAccess, error: accessError } = await sessionSupabase.rpc(
      "psylattice_study_access_context",
      { p_study_id: studyId },
    );
    if (accessError) throw accessError;

    const access = rawAccess as AccessContext | null;
    if (!access?.ok || !access.allowed) {
      return reply(
        { ok: false, error: access?.error || "You do not have access to this study." },
        403,
      );
    }

    const requiredPermission =
      purpose === "analysis"
        ? "analysis"
        : purpose === "export"
          ? "exports"
          : "data_explorer";
    const canUse =
      access.access_type === "owner" ||
      access.permissions?.[requiredPermission] === true;

    if (!canUse) {
      return reply(
        {
          ok: false,
          error:
            purpose === "analysis"
              ? "The study owner has not granted you Analysis Lab access."
              : purpose === "export"
                ? "The study owner has not granted you Export access."
                : "The study owner has not granted you Data Explorer access.",
        },
        403,
      );
    }

    const ownerUserId = String(access.owner_user_id || "").trim();
    if (!validUuid(ownerUserId)) {
      return reply({ ok: false, error: "The study owner could not be resolved." }, 500);
    }

    const admin = researchAdmin();

    const [
      participantResult,
      demographicQuestionResult,
      demographicResponseResult,
      measureResult,
      measureSessionResult,
      responseResult,
      followupResult,
      ambulatoryCheckinResult,
      ambulatoryResponseResult,
      cognitiveAttachmentResult,
    ] = await Promise.all([
      admin
        .from("study_participants")
        .select("id,public_id,is_test,status,enrolled_at,completed_at")
        .eq("study_id", studyId)
        .order("enrolled_at", { ascending: false }),
      admin
        .from("study_demographic_questions")
        .select("id,field_key,label,question_type,direct_identifier,position")
        .eq("study_id", studyId)
        .order("position", { ascending: true }),
      admin
        .from("participant_demographic_responses")
        .select("id,participant_id,question_id,response,text_value,numeric_value,answered_at")
        .eq("study_id", studyId),
      admin
        .from("study_measures")
        .select(
          "id,questionnaire_id,questionnaire_version_id,measurement_point,followup_wave_id,position,required",
        )
        .eq("study_id", studyId)
        .order("position", { ascending: true }),
      admin
        .from("study_measure_sessions")
        .select(
          "id,participant_id,study_measure_id,questionnaire_version_id,status,scores,completed_at",
        )
        .eq("study_id", studyId),
      admin
        .from("research_responses")
        .select(
          "id,measure_session_id,participant_id,study_measure_id,questionnaire_version_id,item_id,response,numeric_value,text_value,score_value,answered_at",
        )
        .eq("study_id", studyId),
      admin
        .from("study_followup_waves")
        .select("id,name,position,status")
        .eq("study_id", studyId)
        .order("position", { ascending: true }),
      admin
        .from("study_ambulatory_checkins")
        .select(
          "id,participant_id,prompt_instance_id,schedule_key,schedule_label,trigger_type,local_date,occurrence_index,trigger_source,started_at,completed_at",
        )
        .eq("study_id", studyId),
      admin
        .from("study_ambulatory_responses")
        .select(
          "id,checkin_id,participant_id,item_key,item_type,prompt_snapshot,response,numeric_value,text_value,answered_at",
        )
        .eq("study_id", studyId),
      admin
        .from("study_cognitive_tasks")
        .select(
          "id,task_id,version_id,position,required,administration_mode",
        )
        .eq("study_id", studyId)
        .order("position", { ascending: true }),
    ]);

    const required = [
      participantResult,
      demographicQuestionResult,
      demographicResponseResult,
      measureResult,
      measureSessionResult,
      responseResult,
      followupResult,
      ambulatoryCheckinResult,
      ambulatoryResponseResult,
      cognitiveAttachmentResult,
    ];
    const failed = required.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const participants = (participantResult.data || []).filter(
      (participant) =>
        participant.status !== "withdrawn" &&
        (includeTestData || !participant.is_test),
    );
    const participantIds = new Set(participants.map((participant) => participant.id));
    const participantById = new Map(participants.map((participant) => [participant.id, participant]));

    const measures = measureResult.data || [];
    const questionnaireIds = Array.from(
      new Set(measures.map((measure) => String(measure.questionnaire_id))),
    );
    const versionIds = Array.from(
      new Set(measures.map((measure) => String(measure.questionnaire_version_id))),
    );

    const [questionnaireResult, versionResult, itemResult] = await Promise.all([
      questionnaireIds.length
        ? admin
            .from("questionnaires")
            .select("id,name,acronym,category")
            .in("id", questionnaireIds)
        : Promise.resolve({ data: [], error: null }),
      versionIds.length
        ? admin
            .from("questionnaire_versions")
            .select("id,questionnaire_id,version_label")
            .in("id", versionIds)
        : Promise.resolve({ data: [], error: null }),
      versionIds.length
        ? admin
            .from("questionnaire_items")
            .select(
              "id,version_id,item_key,position,prompt,subscale,reverse_scored,response_type,required,is_content_only",
            )
            .in("version_id", versionIds)
            .order("position", { ascending: true })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (questionnaireResult.error) throw questionnaireResult.error;
    if (versionResult.error) throw versionResult.error;
    if (itemResult.error) throw itemResult.error;

    const questionnaires = questionnaireResult.data || [];
    const items = itemResult.data || [];
    const questionnaireById = new Map(questionnaires.map((item) => [item.id, item]));
    const itemById = new Map(items.map((item) => [item.id, item]));
    const measureById = new Map(measures.map((measure) => [measure.id, measure]));
    const followupById = new Map(
      (followupResult.data || []).map((wave) => [wave.id, wave]),
    );

    const attachments = cognitiveAttachmentResult.data || [];
    const attachmentIds = attachments.map((item) => item.id);

    const [taskResult, taskVersionResult, cognitiveSessionResult] = await Promise.all([
      attachments.length
        ? admin
            .from("cognitive_tasks")
            .select("id,title,short_title,domain")
            .in(
              "id",
              Array.from(new Set(attachments.map((item) => item.task_id))),
            )
        : Promise.resolve({ data: [], error: null }),
      attachments.length
        ? admin
            .from("cognitive_task_versions")
            .select("id,version_label,version_number")
            .in(
              "id",
              Array.from(new Set(attachments.map((item) => item.version_id))),
            )
        : Promise.resolve({ data: [], error: null }),
      attachmentIds.length
        ? admin
            .from("cognitive_task_sessions")
            .select(
              "id,study_cognitive_task_id,participant_id,participant_session_id,status,summary_scores,timing_quality,device_info,started_at,completed_at,created_at",
            )
            .in("study_cognitive_task_id", attachmentIds)
            .eq("session_mode", "study")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (taskResult.error) throw taskResult.error;
    if (taskVersionResult.error) throw taskVersionResult.error;
    if (cognitiveSessionResult.error) throw cognitiveSessionResult.error;

    const tasks = taskResult.data || [];
    const taskVersions = taskVersionResult.data || [];
    const taskById = new Map(tasks.map((item) => [item.id, item]));
    const taskVersionById = new Map(taskVersions.map((item) => [item.id, item]));
    const attachmentById = new Map(attachments.map((item) => [item.id, item]));
    const cognitiveSessions = (cognitiveSessionResult.data || []).filter(
      (session) => session.participant_id && participantIds.has(session.participant_id),
    );

    let cognitiveTrials: Row[] = [];
    if (datasetRaw === "cognitive_trials") {
      const sessionIds = cognitiveSessions.map((session) => session.id);
      if (sessionIds.length) {
        const { data, error } = await admin
          .from("cognitive_trial_results")
          .select(
            "id,session_id,block_key,trial_index,condition_label,stimulus_payload,response_payload,correct,reaction_time_ms,timing,created_at",
          )
          .in("session_id", sessionIds)
          .order("trial_index", { ascending: true });
        if (error) throw error;
        cognitiveTrials = data || [];
      }
    }

    const sourceMap: Record<string, string> = {
      participant: "study_participants.public_id",
      is_test: "study_participants.is_test",
      status: "study_participants.status",
      enrolled_at: "study_participants.enrolled_at",
      completed_at: "study_participants.completed_at",
    };

    const phaseVariable = (measure: any) => {
      if (measure.measurement_point !== "followup" || !measure.followup_wave_id) {
        return safeVariable(measure.measurement_point);
      }
      const wave = followupById.get(measure.followup_wave_id);
      return wave
        ? `followup_${wave.position}_${safeVariable(wave.name)}`
        : `followup_${safeVariable(measure.followup_wave_id).slice(0, 10)}`;
    };

    let rows: Row[] = [];

    if (datasetRaw === "analysis_wide") {
      rows = participants.map((participant) => {
        const row: Row = {
          participant: participant.public_id,
          is_test: participant.is_test,
          status: participant.status,
          enrolled_at: participant.enrolled_at,
          completed_at: participant.completed_at || "",
        };

        for (const question of demographicQuestionResult.data || []) {
          if (question.direct_identifier) continue;
          const response = (demographicResponseResult.data || []).find(
            (candidate) =>
              candidate.participant_id === participant.id &&
              candidate.question_id === question.id,
          );
          const variable = `demo_${safeVariable(question.field_key)}`;
          row[variable] = response
            ? response.numeric_value ??
              response.text_value ??
              jsonText(response.response)
            : "";
          sourceMap[variable] = `Demographic · ${question.label}`;
        }

        for (const measure of measures) {
          const questionnaire = questionnaireById.get(measure.questionnaire_id);
          if (!questionnaire) continue;
          const prefix = `q_${phaseVariable(measure)}_${measure.position}_${safeVariable(
            questionnaire.acronym || questionnaire.name,
          )}`;

          const measureItems = items.filter(
            (item) =>
              item.version_id === measure.questionnaire_version_id &&
              !item.is_content_only,
          );

          for (const item of measureItems) {
            const variable = `${prefix}_${item.position}`;
            const response = (responseResult.data || []).find(
              (candidate) =>
                candidate.participant_id === participant.id &&
                candidate.study_measure_id === measure.id &&
                candidate.item_id === item.id,
            );
            row[variable] = response ? scalarResponse(response) : "";
            sourceMap[variable] = `${questionnaire.name} · ${item.prompt}`;
          }

          const completedSession = (measureSessionResult.data || []).find(
            (session) =>
              session.participant_id === participant.id &&
              session.study_measure_id === measure.id &&
              session.status === "completed",
          );

          if (
            completedSession?.scores &&
            typeof completedSession.scores === "object" &&
            !Array.isArray(completedSession.scores)
          ) {
            for (const [scoreName, scoreValue] of Object.entries(
              completedSession.scores as Record<string, unknown>,
            )) {
              const variable = `${prefix}_score_${safeVariable(scoreName)}`;
              row[variable] =
                scoreValue && typeof scoreValue === "object"
                  ? jsonText(scoreValue)
                  : scoreValue ?? "";
              sourceMap[variable] = `${questionnaire.name} · computed score ${scoreName}`;
            }
          }
        }

        for (const attachment of attachments) {
          const task = taskById.get(attachment.task_id);
          const taskPrefix = `cog_${attachment.position}_${safeVariable(
            task?.short_title || task?.title || "task",
          )}`;
          const session = cognitiveSessions.find(
            (candidate) =>
              candidate.participant_id === participant.id &&
              candidate.study_cognitive_task_id === attachment.id &&
              candidate.status === "completed",
          );
          row[`${taskPrefix}_completed`] = session ? 1 : 0;
          sourceMap[`${taskPrefix}_completed`] =
            `Cognitive task · ${task?.title || "task"} completion`;

          if (session?.summary_scores) {
            flattenPrimitive(row, taskPrefix, session.summary_scores);
          }
        }

        return row;
      });
    }

    if (datasetRaw === "demographics") {
      rows = (demographicResponseResult.data || [])
        .filter((response) => participantIds.has(response.participant_id))
        .flatMap((response) => {
          const question = (demographicQuestionResult.data || []).find(
            (candidate) => candidate.id === response.question_id,
          );
          const participant = participantById.get(response.participant_id);
          if (!question || question.direct_identifier || !participant) return [];
          return [{
            participant: participant.public_id,
            is_test: participant.is_test,
            variable: question.field_key,
            question: question.label,
            question_type: question.question_type,
            response:
              response.numeric_value ??
              response.text_value ??
              jsonText(response.response),
            answered_at: response.answered_at,
          }];
        });
    }

    if (datasetRaw === "questionnaire_responses") {
      rows = (responseResult.data || [])
        .filter((response) => participantIds.has(response.participant_id))
        .flatMap((response) => {
          const participant = participantById.get(response.participant_id);
          const measure = measureById.get(response.study_measure_id);
          const item = itemById.get(response.item_id);
          const questionnaire = measure
            ? questionnaireById.get(measure.questionnaire_id)
            : null;
          if (!participant || !measure || !item || !questionnaire) return [];
          return [{
            participant: participant.public_id,
            is_test: participant.is_test,
            phase: phaseVariable(measure),
            questionnaire: questionnaire.name,
            acronym: questionnaire.acronym || "",
            item_key: item.item_key || `item_${item.position}`,
            item_position: item.position,
            item_prompt: item.prompt,
            response_type: item.response_type,
            response: scalarResponse(response),
            numeric_value: response.numeric_value ?? "",
            score_value: response.score_value ?? "",
            answered_at: response.answered_at,
          }];
        });
    }

    if (datasetRaw === "questionnaire_scores") {
      rows = (measureSessionResult.data || [])
        .filter(
          (session) =>
            participantIds.has(session.participant_id) &&
            session.status === "completed",
        )
        .flatMap((session) => {
          const participant = participantById.get(session.participant_id);
          const measure = measureById.get(session.study_measure_id);
          const questionnaire = measure
            ? questionnaireById.get(measure.questionnaire_id)
            : null;
          if (!participant || !measure || !questionnaire) return [];
          const scores =
            session.scores &&
            typeof session.scores === "object" &&
            !Array.isArray(session.scores)
              ? Object.entries(session.scores as Record<string, unknown>)
              : [];
          return scores.map(([scoreName, scoreValue]) => ({
            participant: participant.public_id,
            is_test: participant.is_test,
            phase: phaseVariable(measure),
            questionnaire: questionnaire.name,
            acronym: questionnaire.acronym || "",
            score_name: scoreName,
            score_value:
              scoreValue && typeof scoreValue === "object"
                ? jsonText(scoreValue)
                : scoreValue ?? "",
            completed_at: session.completed_at || "",
          }));
        });
    }

    if (datasetRaw === "cognitive_sessions") {
      rows = cognitiveSessions.flatMap((session) => {
        const participant = session.participant_id
          ? participantById.get(session.participant_id)
          : null;
        const attachment = attachmentById.get(session.study_cognitive_task_id);
        if (!participant || !attachment) return [];
        const task = taskById.get(attachment.task_id);
        const version = taskVersionById.get(attachment.version_id);
        const row: Row = {
          participant: participant.public_id,
          is_test: participant.is_test,
          administration_position: attachment.position,
          cognitive_task: task?.title || "Cognitive task",
          version: version?.version_label || "",
          session_status: session.status,
          started_at: session.started_at || "",
          completed_at: session.completed_at || "",
        };
        flattenPrimitive(row, "score", session.summary_scores || {});
        flattenPrimitive(row, "timing", session.timing_quality || {});
        return [row];
      });
    }

    if (datasetRaw === "cognitive_trials") {
      const sessionById = new Map(cognitiveSessions.map((session) => [session.id, session]));
      rows = cognitiveTrials.flatMap((trial: any) => {
        const session = sessionById.get(trial.session_id);
        const participant = session?.participant_id
          ? participantById.get(session.participant_id)
          : null;
        const attachment = session
          ? attachmentById.get(session.study_cognitive_task_id)
          : null;
        const task = attachment ? taskById.get(attachment.task_id) : null;
        if (!session || !participant || !attachment) return [];
        return [{
          participant: participant.public_id,
          is_test: participant.is_test,
          cognitive_task: task?.title || "Cognitive task",
          administration_position: attachment.position,
          block_key: trial.block_key || "",
          trial_index: trial.trial_index,
          condition: trial.condition_label || "",
          correct: trial.correct ?? "",
          reaction_time_ms: trial.reaction_time_ms ?? "",
          stimulus_payload_json: jsonText(trial.stimulus_payload),
          response_payload_json: jsonText(trial.response_payload),
          timing_json: jsonText(trial.timing),
          recorded_at: trial.created_at,
        }];
      });
    }

    if (datasetRaw === "ambulatory_checkins" || datasetRaw === "ambulatory_wide") {
      rows = (ambulatoryCheckinResult.data || [])
        .filter((checkin) => participantIds.has(checkin.participant_id))
        .map((checkin) => {
          const participant = participantById.get(checkin.participant_id);
          const row: Row = {
            participant: participant?.public_id || "",
            is_test: participant?.is_test || false,
            checkin_id: checkin.id,
            local_date: checkin.local_date,
            schedule_key: checkin.schedule_key,
            checkin: checkin.schedule_label,
            trigger_type: checkin.trigger_type,
            trigger_source: checkin.trigger_source,
            occurrence: checkin.occurrence_index,
            started_at: checkin.started_at,
            completed_at: checkin.completed_at || "",
          };

          if (datasetRaw === "ambulatory_wide") {
            const responses = (ambulatoryResponseResult.data || []).filter(
              (response) => response.checkin_id === checkin.id,
            );
            for (const response of responses) {
              const variable = `ema_${safeVariable(response.item_key)}`;
              const value =
                response.numeric_value ??
                response.text_value ??
                (response.response && typeof response.response !== "object"
                  ? response.response
                  : jsonText(response.response));
              if (!(variable in row)) {
                row[variable] = value;
              } else {
                row[`${variable}_${safeVariable(response.id).slice(0, 8)}`] = value;
              }
              sourceMap[variable] = `Ambulatory item · ${response.prompt_snapshot}`;
            }
          }

          return row;
        });
    }

    const { rows: returnedRows, truncated, totalRows } = truncateRows(rows);
    const codebook = inferCodebook(returnedRows, sourceMap);

    return reply({
      ok: true,
      access: {
        role: access.role || null,
        accessType: access.access_type || null,
        purpose,
        canEdit: access.permissions?.can_edit === true,
      },
      study: {
        id: studyId,
        title: access.study_title || "Shared study",
      },
      dataset: {
        value: datasetRaw,
        label: DATASET_LABELS[datasetRaw],
        identityMode: "pseudonymous",
        directIdentifiersIncluded: false,
        includeTestData,
        rows: returnedRows,
        codebook,
        totalRows,
        truncated,
      },
      options: Object.entries(DATASET_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
    });
  } catch (error) {
    console.error("Shared data GET failed:", error);
    return reply(
      { ok: false, error: "PsyLattice could not load this shared research dataset right now." },
      500,
    );
  }
}
