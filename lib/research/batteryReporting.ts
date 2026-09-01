export type BatteryAttachmentLike = {
  id: string;
  position: number;
  required: boolean;
  title: string;
  version_label?: string | null;
  schedule_config?: Record<string, unknown> | null;
};

export type BatteryAssignmentLike = {
  id: string;
  participant_session_id: string;
  study_id: string;
  battery_group_key: string;
  battery_id: string | null;
  battery_version_id: string | null;
  order_mode: string;
  counterbalance_strategy: string;
  assignment_index: number;
  assigned_item_ids: string[];
  created_at: string;
};

export type BatteryCognitiveSessionLike = {
  id: string;
  study_cognitive_task_id: string | null;
  participant_id: string | null;
  participant_session_id: string | null;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
};

export type BatteryParticipantSessionLike = {
  id: string;
  participant_id: string;
  status?: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export type BatteryParticipantLike = {
  id: string;
  public_id?: string;
  is_test?: boolean;
  status?: string;
};

export type BatteryItemMeta = {
  attachmentId: string;
  studyPosition: number;
  taskTitle: string;
  taskVersionLabel: string;
  required: boolean;
  itemId: string;
  itemPosition: number;
  transitionText: string;
  breakAfterSeconds: number;
};

export type BatteryGroupMeta = {
  groupKey: string;
  batteryId: string;
  batteryVersionId: string;
  batteryTitle: string;
  batteryVersionLabel: string;
  orderMode: "fixed" | "randomized" | "counterbalanced";
  counterbalanceStrategy: "latin_square" | "balanced_latin_square";
  firstStudyPosition: number;
  items: BatteryItemMeta[];
};

export type BatteryParticipantReport = {
  participantId: string;
  participantSessionId: string;
  batteryGroupKey: string;
  batteryId: string;
  batteryVersionId: string;
  batteryTitle: string;
  batteryVersionLabel: string;
  orderMode: string;
  counterbalanceStrategy: string;
  assignmentIndex: number;
  assignedItemIds: string[];
  assignedTaskTitles: string[];
  requiredTasks: number;
  completedRequiredTasks: number;
  totalTasks: number;
  completedTasks: number;
  started: boolean;
  completed: boolean;
  completionRate: number;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  taskStates: Array<{
    itemId: string;
    attachmentId: string;
    taskTitle: string;
    required: boolean;
    assignedPosition: number;
    configuredPosition: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    durationSeconds: number | null;
  }>;
};

export type BatteryGroupSummary = {
  batteryGroupKey: string;
  batteryTitle: string;
  batteryVersionLabel: string;
  orderMode: string;
  counterbalanceStrategy: string;
  taskCount: number;
  requiredTaskCount: number;
  assignedParticipants: number;
  startedParticipants: number;
  completedParticipants: number;
  completionRate: number | null;
  medianDurationSeconds: number | null;
};

export type BatteryOrderDiagnostic = {
  batteryGroupKey: string;
  batteryTitle: string;
  taskTitle: string;
  taskAttachmentId: string;
  orderMode: string;
  slotSummaries: Array<{
    assignedPosition: number;
    assignedN: number;
    completedN: number;
    completionRate: number;
    medianDurationSeconds: number | null;
  }>;
  maxCompletionRateDifference: number | null;
  maxMedianDurationRatio: number | null;
  reviewRecommended: boolean;
  reviewReason: string;
  inferentialTestRun: false;
};

export type BatteryReportingResult = {
  groups: BatteryGroupMeta[];
  participantReports: BatteryParticipantReport[];
  groupSummaries: BatteryGroupSummary[];
  orderDiagnostics: BatteryOrderDiagnostic[];
};

function objectValue(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const next = String(value).trim();
  return next || fallback;
}

function integer(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? Math.trunc(next) : fallback;
}

function timestamp(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function elapsedSeconds(start: string | null, end: string | null) {
  const startMs = timestamp(start);
  const endMs = timestamp(end);
  if (startMs === null || endMs === null || endMs < startMs) return null;
  return Math.round(((endMs - startMs) / 1000) * 10) / 10;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function batteryMetaFromAttachment(
  attachment: BatteryAttachmentLike
): { group: Omit<BatteryGroupMeta, "items" | "firstStudyPosition">; item: BatteryItemMeta } | null {
  const schedule = objectValue(attachment.schedule_config);
  const battery = objectValue(schedule?.battery);
  if (!battery) return null;

  const groupKey = text(battery.group_key);
  const itemId = text(battery.item_id);
  if (!groupKey || !itemId) return null;

  const rawOrderMode = text(battery.order_mode, "fixed");
  const orderMode: BatteryGroupMeta["orderMode"] =
    rawOrderMode === "randomized" || rawOrderMode === "counterbalanced"
      ? rawOrderMode
      : "fixed";
  const rawStrategy = text(battery.counterbalance_strategy, "latin_square");
  const counterbalanceStrategy: BatteryGroupMeta["counterbalanceStrategy"] =
    rawStrategy === "balanced_latin_square"
      ? "balanced_latin_square"
      : "latin_square";

  return {
    group: {
      groupKey,
      batteryId: text(battery.battery_id),
      batteryVersionId: text(battery.battery_version_id),
      batteryTitle: text(battery.battery_title, "Cognitive battery"),
      batteryVersionLabel: text(battery.battery_version_label, "Published version"),
      orderMode,
      counterbalanceStrategy,
    },
    item: {
      attachmentId: attachment.id,
      studyPosition: attachment.position,
      taskTitle: attachment.title,
      taskVersionLabel: text(attachment.version_label, "Published version"),
      required: attachment.required,
      itemId,
      itemPosition: Math.max(1, integer(battery.item_position, attachment.position || 1)),
      transitionText: text(battery.transition_text),
      breakAfterSeconds: Math.max(0, integer(battery.break_after_seconds, 0)),
    },
  };
}

export function buildBatteryGroups(
  attachments: BatteryAttachmentLike[]
): BatteryGroupMeta[] {
  const byKey = new Map<string, BatteryGroupMeta>();

  for (const attachment of attachments) {
    const parsed = batteryMetaFromAttachment(attachment);
    if (!parsed) continue;
    const current = byKey.get(parsed.group.groupKey);
    if (!current) {
      byKey.set(parsed.group.groupKey, {
        ...parsed.group,
        firstStudyPosition: attachment.position,
        items: [parsed.item],
      });
      continue;
    }
    current.firstStudyPosition = Math.min(current.firstStudyPosition, attachment.position);
    current.items.push(parsed.item);
  }

  return Array.from(byKey.values())
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => a.itemPosition - b.itemPosition),
    }))
    .sort((a, b) => a.firstStudyPosition - b.firstStudyPosition);
}

function preferredTaskSession(
  sessions: BatteryCognitiveSessionLike[]
): BatteryCognitiveSessionLike | null {
  if (!sessions.length) return null;
  return [...sessions].sort((a, b) => {
    const completedDiff = Number(b.status === "completed") - Number(a.status === "completed");
    if (completedDiff !== 0) return completedDiff;
    const bTime = timestamp(b.completed_at || b.started_at || b.created_at) || 0;
    const aTime = timestamp(a.completed_at || a.started_at || a.created_at) || 0;
    return bTime - aTime;
  })[0];
}

export function buildBatteryReporting(args: {
  participants: BatteryParticipantLike[];
  participantSessions: BatteryParticipantSessionLike[];
  attachments: BatteryAttachmentLike[];
  cognitiveSessions: BatteryCognitiveSessionLike[];
  assignments: BatteryAssignmentLike[];
  includeTestData: boolean;
}): BatteryReportingResult {
  const participants = args.participants.filter(
    (participant) =>
      participant.status !== "withdrawn" &&
      (args.includeTestData || !participant.is_test)
  );
  const participantIds = new Set(participants.map((participant) => participant.id));
  const sessionById = new Map(
    args.participantSessions
      .filter((session) => participantIds.has(session.participant_id))
      .map((session) => [session.id, session])
  );
  const groups = buildBatteryGroups(args.attachments);
  const groupByKey = new Map(groups.map((group) => [group.groupKey, group]));
  const participantReports: BatteryParticipantReport[] = [];

  for (const assignment of args.assignments) {
    const participantSession = sessionById.get(assignment.participant_session_id);
    if (!participantSession) continue;
    const group = groupByKey.get(assignment.battery_group_key);
    if (!group) continue;

    const participantId = participantSession.participant_id;
    const itemById = new Map(group.items.map((item) => [item.itemId, item]));
    const assignedItems = assignment.assigned_item_ids
      .map((itemId) => itemById.get(itemId))
      .filter((item): item is BatteryItemMeta => Boolean(item));
    const fallbackItems = group.items;
    const orderedItems = assignedItems.length === group.items.length ? assignedItems : fallbackItems;

    const taskStates = orderedItems.map((item, index) => {
      const taskSession = preferredTaskSession(
        args.cognitiveSessions.filter(
          (session) =>
            session.participant_id === participantId &&
            session.participant_session_id === assignment.participant_session_id &&
            session.study_cognitive_task_id === item.attachmentId
        )
      );
      const startedAt = taskSession?.started_at || taskSession?.created_at || null;
      const completedAt = taskSession?.completed_at || null;
      return {
        itemId: item.itemId,
        attachmentId: item.attachmentId,
        taskTitle: item.taskTitle,
        required: item.required,
        assignedPosition: index + 1,
        configuredPosition: item.itemPosition,
        status: taskSession?.status || "not_started",
        startedAt,
        completedAt,
        durationSeconds: elapsedSeconds(startedAt, completedAt),
      };
    });

    const requiredStates = taskStates.filter((state) => state.required);
    const completedRequiredTasks = requiredStates.filter((state) => state.status === "completed").length;
    const completedTasks = taskStates.filter((state) => state.status === "completed").length;
    const startTimes = taskStates
      .map((state) => state.startedAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => (timestamp(a) || 0) - (timestamp(b) || 0));
    const completionTimes = requiredStates
      .map((state) => state.completedAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => (timestamp(a) || 0) - (timestamp(b) || 0));
    const requiredTasks = requiredStates.length;
    const completed = requiredTasks === 0
      ? completedTasks === taskStates.length && taskStates.length > 0
      : completedRequiredTasks === requiredTasks;
    const startedAt = startTimes[0] || null;
    const completedAt = completed
      ? completionTimes[completionTimes.length - 1] ||
        taskStates.map((state) => state.completedAt).filter((value): value is string => Boolean(value)).sort((a,b)=>(timestamp(a)||0)-(timestamp(b)||0)).slice(-1)[0] ||
        null
      : null;

    participantReports.push({
      participantId,
      participantSessionId: assignment.participant_session_id,
      batteryGroupKey: group.groupKey,
      batteryId: assignment.battery_id || group.batteryId,
      batteryVersionId: assignment.battery_version_id || group.batteryVersionId,
      batteryTitle: group.batteryTitle,
      batteryVersionLabel: group.batteryVersionLabel,
      orderMode: assignment.order_mode || group.orderMode,
      counterbalanceStrategy: assignment.counterbalance_strategy || group.counterbalanceStrategy,
      assignmentIndex: assignment.assignment_index,
      assignedItemIds: orderedItems.map((item) => item.itemId),
      assignedTaskTitles: orderedItems.map((item) => item.taskTitle),
      requiredTasks,
      completedRequiredTasks,
      totalTasks: taskStates.length,
      completedTasks,
      started: Boolean(startedAt),
      completed,
      completionRate: requiredTasks > 0
        ? completedRequiredTasks / requiredTasks
        : taskStates.length > 0
          ? completedTasks / taskStates.length
          : 0,
      startedAt,
      completedAt,
      durationSeconds: elapsedSeconds(startedAt, completedAt),
      taskStates,
    });
  }

  const groupSummaries: BatteryGroupSummary[] = groups.map((group) => {
    const rows = participantReports.filter((row) => row.batteryGroupKey === group.groupKey);
    const durations = rows
      .map((row) => row.durationSeconds)
      .filter((value): value is number => value !== null);
    const completedParticipants = rows.filter((row) => row.completed).length;
    return {
      batteryGroupKey: group.groupKey,
      batteryTitle: group.batteryTitle,
      batteryVersionLabel: group.batteryVersionLabel,
      orderMode: group.orderMode,
      counterbalanceStrategy: group.counterbalanceStrategy,
      taskCount: group.items.length,
      requiredTaskCount: group.items.filter((item) => item.required).length,
      assignedParticipants: rows.length,
      startedParticipants: rows.filter((row) => row.started).length,
      completedParticipants,
      completionRate: rows.length ? completedParticipants / rows.length : null,
      medianDurationSeconds: median(durations),
    };
  });

  const orderDiagnostics: BatteryOrderDiagnostic[] = [];
  for (const group of groups.filter((candidate) => candidate.orderMode !== "fixed")) {
    const reports = participantReports.filter((row) => row.batteryGroupKey === group.groupKey);
    for (const item of group.items) {
      const states = reports
        .map((report) => report.taskStates.find((state) => state.attachmentId === item.attachmentId))
        .filter((state): state is BatteryParticipantReport["taskStates"][number] => Boolean(state));
      const positions = Array.from(new Set(states.map((state) => state.assignedPosition))).sort((a, b) => a - b);
      const slotSummaries = positions.map((assignedPosition) => {
        const slot = states.filter((state) => state.assignedPosition === assignedPosition);
        const completed = slot.filter((state) => state.status === "completed");
        const durations = completed
          .map((state) => state.durationSeconds)
          .filter((value): value is number => value !== null);
        return {
          assignedPosition,
          assignedN: slot.length,
          completedN: completed.length,
          completionRate: slot.length ? completed.length / slot.length : 0,
          medianDurationSeconds: median(durations),
        };
      });

      const usableCompletionSlots = slotSummaries.filter((slot) => slot.assignedN >= 5);
      const completionRates = usableCompletionSlots.map((slot) => slot.completionRate);
      const maxCompletionRateDifference = completionRates.length >= 2
        ? Math.max(...completionRates) - Math.min(...completionRates)
        : null;
      const durationMedians = slotSummaries
        .filter((slot) => slot.completedN >= 5 && slot.medianDurationSeconds !== null && slot.medianDurationSeconds > 0)
        .map((slot) => slot.medianDurationSeconds as number);
      const maxMedianDurationRatio = durationMedians.length >= 2
        ? Math.max(...durationMedians) / Math.min(...durationMedians)
        : null;
      const reasons: string[] = [];
      if (maxCompletionRateDifference !== null && maxCompletionRateDifference >= 0.2) {
        reasons.push(`completion rate differs by ${Math.round(maxCompletionRateDifference * 100)} percentage points across assigned slots`);
      }
      if (maxMedianDurationRatio !== null && maxMedianDurationRatio >= 1.5) {
        reasons.push(`median task duration differs by ${maxMedianDurationRatio.toFixed(2)}× across assigned slots`);
      }

      orderDiagnostics.push({
        batteryGroupKey: group.groupKey,
        batteryTitle: group.batteryTitle,
        taskTitle: item.taskTitle,
        taskAttachmentId: item.attachmentId,
        orderMode: group.orderMode,
        slotSummaries,
        maxCompletionRateDifference,
        maxMedianDurationRatio,
        reviewRecommended: reasons.length > 0,
        reviewReason: reasons.length
          ? `Descriptive order-pattern review: ${reasons.join("; ")}. This is not an inferential order-effect test.`
          : "No large descriptive slot difference was detected with the current minimum cell-size rule. This is not evidence that order effects are absent.",
        inferentialTestRun: false,
      });
    }
  }

  return { groups, participantReports, groupSummaries, orderDiagnostics };
}
