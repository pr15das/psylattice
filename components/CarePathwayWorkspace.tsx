"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type CareClient = {
  connection_id: string;
  client_id: string;
  client_name: string;
};

type CarePathway = {
  id: string;
  clinician_id: string;
  client_id: string;
  connection_id: string | null;
  name: string;
  status:
    | "draft"
    | "active"
    | "on_hold"
    | "completed"
    | "archived";
  start_date: string | null;
  review_date: string | null;
  summary: string;
  focus_areas: string[];
  created_at: string;
  updated_at: string;
};

type CareGoal = {
  id: string;
  pathway_id: string;
  clinician_id: string;
  client_id: string;
  title: string;
  description: string;
  status:
    | "not_started"
    | "in_progress"
    | "achieved"
    | "on_hold"
    | "discontinued";
  priority: "low" | "medium" | "high";
  target_date: string | null;
  progress: number;
  position: number;
  created_at: string;
  updated_at: string;
};

type CareAction = {
  id: string;
  pathway_id: string;
  goal_id: string | null;
  clinician_id: string;
  client_id: string;
  title: string;
  description: string;
  action_type:
    | "intervention"
    | "home_practice"
    | "assessment"
    | "monitoring"
    | "referral"
    | "coordination"
    | "other";
  responsible_party:
    | "clinician"
    | "client"
    | "shared"
    | "other";
  frequency: string;
  due_date: string | null;
  status:
    | "planned"
    | "in_progress"
    | "completed"
    | "on_hold"
    | "cancelled";
  position: number;
  created_at: string;
  updated_at: string;
};

type CareReview = {
  id: string;
  pathway_id: string;
  clinician_id: string;
  client_id: string;
  reviewed_at: string;
  summary: string;
  progress_notes: string;
  next_steps: string;
  created_at: string;
  updated_at: string;
};

type CareTimelineItem = {
  id: string;
  pathway_id: string;
  clinician_id: string;
  client_id: string;
  item_type: "goal" | "review";
  goal_id: string | null;
  review_id: string | null;
  position: number;
  created_at: string;
};

const pathwayStatusOptions: Array<{
  value: CarePathway["status"];
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const goalStatusOptions: Array<{
  value: CareGoal["status"];
  label: string;
}> = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "achieved", label: "Achieved" },
  { value: "on_hold", label: "On hold" },
  { value: "discontinued", label: "Discontinued" },
];

const actionTypeOptions: Array<{
  value: CareAction["action_type"];
  label: string;
}> = [
  { value: "intervention", label: "Intervention" },
  { value: "home_practice", label: "Home practice" },
  { value: "assessment", label: "Assessment" },
  { value: "monitoring", label: "Monitoring" },
  { value: "referral", label: "Referral" },
  { value: "coordination", label: "Care coordination" },
  { value: "other", label: "Other" },
];

const actionStatusOptions: Array<{
  value: CareAction["status"];
  label: string;
}> = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "cancelled", label: "Cancelled" },
];

function statusLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function dateLabel(value: string | null) {
  if (!value) return "Not set";

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function reviewDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?:
    | "slate"
    | "cyan"
    | "emerald"
    | "amber"
    | "red";
}) {
  const classes = {
    slate:
      "border-slate-200 bg-slate-50 text-slate-600",
    cyan:
      "border-cyan-200 bg-cyan-50 text-cyan-700",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700",
    red:
      "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function pathwayTone(
  status: CarePathway["status"]
) {
  if (status === "active") return "emerald";
  if (status === "completed") return "cyan";
  if (status === "on_hold") return "amber";
  return "slate";
}

function goalTone(status: CareGoal["status"]) {
  if (status === "achieved") return "emerald";
  if (status === "in_progress") return "cyan";
  if (status === "on_hold") return "amber";
  if (status === "discontinued") return "red";
  return "slate";
}

function CarePathwayVisualisation({
  pathway,
  goals,
  actions,
  reviews,
  timelineItems,
  reordering,
  onBack,
  onMoveItem,
}: {
  pathway: CarePathway;
  goals: CareGoal[];
  actions: CareAction[];
  reviews: CareReview[];
  timelineItems: CareTimelineItem[];
  reordering: boolean;
  onBack: () => void;
  onMoveItem: (
    timelineItemId: string,
    direction: -1 | 1
  ) => void;
}) {
  const orderedTimeline = [...timelineItems]
    .filter(
      (item) =>
        item.pathway_id === pathway.id
    )
    .sort(
      (a, b) =>
        a.position - b.position ||
        new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
    );

  const averageProgress =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce(
            (sum, goal) => sum + goal.progress,
            0
          ) / goals.length
        );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">
                Visual pathway
              </p>

              <Badge
                tone={
                  pathwayTone(
                    pathway.status
                  ) as
                    | "slate"
                    | "cyan"
                    | "emerald"
                    | "amber"
                }
              >
                {statusLabel(pathway.status)}
              </Badge>
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {pathway.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Timeline order follows the chronology in which goals and reviews were added. You can also rearrange that order here.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            ← Back to pathway editor
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Started
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {dateLabel(pathway.start_date)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Next review
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {dateLabel(pathway.review_date)}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
              Goals
            </p>
            <p className="mt-2 text-2xl font-semibold text-cyan-950">
              {goals.length}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Mean progress
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-950">
              {averageProgress}%
            </p>
          </div>
        </div>

        {(pathway.summary ||
          pathway.focus_areas.length > 0) && (
          <div className="border-t border-slate-100 p-5">
            {pathway.summary && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Pathway rationale
                </p>
                <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {pathway.summary}
                </p>
              </div>
            )}

            {pathway.focus_areas.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {pathway.focus_areas.map(
                  (focusArea) => (
                    <span
                      key={focusArea}
                      className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800"
                    >
                      {focusArea}
                    </span>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold text-slate-900">
              Pathway timeline
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Goals and reviews share one persistent timeline order.
            </p>
          </div>

          <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-[11px] text-cyan-800">
            Use ↑ and ↓ to reorder the pathway
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute bottom-6 left-[19px] top-6 w-px bg-slate-200 sm:left-[23px]" />

            <div className="relative space-y-5">
              <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 sm:grid-cols-[48px_minmax(0,1fr)]">
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-slate-950 text-xs font-semibold text-white shadow-sm sm:h-12 sm:w-12">
                  S
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Pathway start
                  </p>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">
                      {pathway.name}
                    </p>
                    <span className="text-xs text-slate-400">
                      {dateLabel(pathway.start_date)}
                    </span>
                  </div>
                </div>
              </div>

              {orderedTimeline.map(
                (timelineItem, index) => {
                  if (
                    timelineItem.item_type ===
                    "goal"
                  ) {
                    const goal = goals.find(
                      (candidate) =>
                        candidate.id ===
                        timelineItem.goal_id
                    );

                    if (!goal) {
                      return null;
                    }

                    const goalActions = actions
                      .filter(
                        (action) =>
                          action.goal_id ===
                          goal.id
                      )
                      .sort(
                        (a, b) =>
                          a.position -
                          b.position
                      );

                    return (
                      <div
                        key={timelineItem.id}
                        className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 sm:grid-cols-[48px_minmax(0,1fr)]"
                      >
                        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-cyan-700 text-xs font-semibold text-white shadow-sm sm:h-12 sm:w-12">
                          G
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm">
                          <div className="border-b border-cyan-50 bg-cyan-50/50 p-4">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-slate-900">
                                    {goal.title}
                                  </p>

                                  <Badge
                                    tone={
                                      goalTone(
                                        goal.status
                                      ) as
                                        | "slate"
                                        | "cyan"
                                        | "emerald"
                                        | "amber"
                                        | "red"
                                    }
                                  >
                                    {statusLabel(
                                      goal.status
                                    )}
                                  </Badge>
                                </div>

                                {goal.description && (
                                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                    {goal.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex shrink-0 items-start gap-2">
                                <div className="text-right">
                                  <p className="text-xl font-semibold text-cyan-950">
                                    {goal.progress}%
                                  </p>
                                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
                                    progress
                                  </p>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <button
                                    type="button"
                                    disabled={
                                      reordering ||
                                      index === 0
                                    }
                                    onClick={() =>
                                      onMoveItem(
                                        timelineItem.id,
                                        -1
                                      )
                                    }
                                    title="Move earlier"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 disabled:opacity-30"
                                  >
                                    ↑
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      reordering ||
                                      index ===
                                        orderedTimeline.length -
                                          1
                                    }
                                    onClick={() =>
                                      onMoveItem(
                                        timelineItem.id,
                                        1
                                      )
                                    }
                                    title="Move later"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 disabled:opacity-30"
                                  >
                                    ↓
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                              <div
                                className="h-full rounded-full bg-cyan-600 transition-[width]"
                                style={{
                                  width: `${goal.progress}%`,
                                }}
                              />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                              <span>
                                Priority:{" "}
                                {statusLabel(
                                  goal.priority
                                )}
                              </span>
                              <span>
                                Target:{" "}
                                {dateLabel(
                                  goal.target_date
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                              Linked care actions
                            </p>

                            {goalActions.length === 0 ? (
                              <p className="mt-2 text-xs text-slate-400">
                                No care actions attached to this goal yet.
                              </p>
                            ) : (
                              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                                {goalActions.map(
                                  (action) => (
                                    <div
                                      key={action.id}
                                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-slate-800">
                                          {action.title}
                                        </p>

                                        <Badge
                                          tone={
                                            action.status ===
                                            "completed"
                                              ? "emerald"
                                              : action.status ===
                                                  "in_progress"
                                                ? "cyan"
                                                : action.status ===
                                                    "on_hold"
                                                  ? "amber"
                                                  : "slate"
                                          }
                                        >
                                          {statusLabel(
                                            action.status
                                          )}
                                        </Badge>
                                      </div>

                                      <p className="mt-2 text-[10px] leading-4 text-slate-500">
                                        {statusLabel(
                                          action.action_type
                                        )}
                                        {" · "}
                                        {statusLabel(
                                          action.responsible_party
                                        )}
                                        {action.frequency
                                          ? ` · ${action.frequency}`
                                          : ""}
                                      </p>

                                      {action.due_date && (
                                        <p className="mt-1 text-[10px] text-slate-400">
                                          Due{" "}
                                          {dateLabel(
                                            action.due_date
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const review = reviews.find(
                    (candidate) =>
                      candidate.id ===
                      timelineItem.review_id
                  );

                  if (!review) {
                    return null;
                  }

                  return (
                    <div
                      key={timelineItem.id}
                      className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 sm:grid-cols-[48px_minmax(0,1fr)]"
                    >
                      <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-amber-500 text-xs font-semibold text-white shadow-sm sm:h-12 sm:w-12">
                        R
                      </div>

                      <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                Formal pathway review
                              </p>
                              <Badge tone="amber">
                                Review
                              </Badge>
                            </div>

                            <span className="mt-1 block text-xs text-slate-400">
                              {reviewDateTime(
                                review.reviewed_at
                              )}
                            </span>
                          </div>

                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              disabled={
                                reordering ||
                                index === 0
                              }
                              onClick={() =>
                                onMoveItem(
                                  timelineItem.id,
                                  -1
                                )
                              }
                              title="Move earlier"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 disabled:opacity-30"
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              disabled={
                                reordering ||
                                index ===
                                  orderedTimeline.length -
                                    1
                              }
                              onClick={() =>
                                onMoveItem(
                                  timelineItem.id,
                                  1
                                )
                              }
                              title="Move later"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </div>

                        {review.summary && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {review.summary}
                          </p>
                        )}

                        {review.progress_notes && (
                          <div className="mt-3 rounded-xl bg-white/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Progress
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                              {review.progress_notes}
                            </p>
                          </div>
                        )}

                        {review.next_steps && (
                          <div className="mt-3 rounded-xl bg-white/70 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                              Next steps
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                              {review.next_steps}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 sm:grid-cols-[48px_minmax(0,1fr)]">
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-xs font-semibold text-white shadow-sm sm:h-12 sm:w-12">
                  N
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    Next review checkpoint
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {dateLabel(pathway.review_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CarePathwayWorkspace({
  client,
}: {
  client: CareClient;
}) {
  const [pathways, setPathways] =
    useState<CarePathway[]>([]);
  const [goals, setGoals] =
    useState<CareGoal[]>([]);
  const [actions, setActions] =
    useState<CareAction[]>([]);
  const [reviews, setReviews] =
    useState<CareReview[]>([]);
  const [timelineItems, setTimelineItems] =
    useState<CareTimelineItem[]>([]);
  const [reorderingTimeline, setReorderingTimeline] =
    useState(false);

  const [selectedPathwayId, setSelectedPathwayId] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [pathwayListCollapsed, setPathwayListCollapsed] =
    useState(false);
  const [workspaceMode, setWorkspaceMode] =
    useState<"editor" | "visualise">("editor");
  const [message, setMessage] =
    useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(
      "psylattice-care-pathway-list-collapsed"
    );

    if (saved === "true") {
      setPathwayListCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "psylattice-care-pathway-list-collapsed",
      String(pathwayListCollapsed)
    );
  }, [pathwayListCollapsed]);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [name, setName] = useState("");
  const [status, setStatus] =
    useState<CarePathway["status"]>(
      "draft"
    );
  const [startDate, setStartDate] =
    useState("");
  const [reviewDate, setReviewDate] =
    useState("");
  const [summary, setSummary] =
    useState("");
  const [focusInput, setFocusInput] =
    useState("");

  const [newGoalOpen, setNewGoalOpen] =
    useState(false);
  const [newGoalTitle, setNewGoalTitle] =
    useState("");
  const [
    newGoalDescription,
    setNewGoalDescription,
  ] = useState("");
  const [newGoalPriority, setNewGoalPriority] =
    useState<CareGoal["priority"]>(
      "medium"
    );
  const [newGoalTargetDate, setNewGoalTargetDate] =
    useState("");

  const [
    newActionGoalId,
    setNewActionGoalId,
  ] = useState("");
  const [newActionTitle, setNewActionTitle] =
    useState("");
  const [newActionDescription, setNewActionDescription] =
    useState("");
  const [newActionType, setNewActionType] =
    useState<CareAction["action_type"]>(
      "intervention"
    );
  const [
    newActionParty,
    setNewActionParty,
  ] = useState<
    CareAction["responsible_party"]
  >("clinician");
  const [
    newActionFrequency,
    setNewActionFrequency,
  ] = useState("");
  const [newActionDueDate, setNewActionDueDate] =
    useState("");

  const [reviewOpen, setReviewOpen] =
    useState(false);
  const [reviewSummary, setReviewSummary] =
    useState("");
  const [
    reviewProgressNotes,
    setReviewProgressNotes,
  ] = useState("");
  const [
    reviewNextSteps,
    setReviewNextSteps,
  ] = useState("");

  const selectedPathway = useMemo(
    () =>
      pathways.find(
        (pathway) =>
          pathway.id === selectedPathwayId
      ) || null,
    [pathways, selectedPathwayId]
  );

  const pathwayGoals = useMemo(
    () =>
      goals
        .filter(
          (goal) =>
            goal.pathway_id ===
            selectedPathwayId
        )
        .sort(
          (a, b) =>
            a.position - b.position
        ),
    [goals, selectedPathwayId]
  );

  const pathwayActions = useMemo(
    () =>
      actions
        .filter(
          (action) =>
            action.pathway_id ===
            selectedPathwayId
        )
        .sort(
          (a, b) =>
            a.position - b.position
        ),
    [actions, selectedPathwayId]
  );

  const pathwayReviews = useMemo(
    () =>
      reviews
        .filter(
          (review) =>
            review.pathway_id ===
            selectedPathwayId
        )
        .sort(
          (a, b) =>
            new Date(
              b.reviewed_at
            ).getTime() -
            new Date(
              a.reviewed_at
            ).getTime()
        ),
    [reviews, selectedPathwayId]
  );

  const averageProgress =
    pathwayGoals.length === 0
      ? 0
      : Math.round(
          pathwayGoals.reduce(
            (sum, goal) =>
              sum + goal.progress,
            0
          ) / pathwayGoals.length
        );

  const activeGoalCount =
    pathwayGoals.filter(
      (goal) =>
        goal.status === "in_progress" ||
        goal.status === "not_started"
    ).length;

  function selectPathway(
    pathway: CarePathway,
    mode: "editor" | "visualise" = "editor"
  ) {
    setSelectedPathwayId(pathway.id);
    setWorkspaceMode(mode);
    setName(pathway.name);
    setStatus(pathway.status);
    setStartDate(
      pathway.start_date || ""
    );
    setReviewDate(
      pathway.review_date || ""
    );
    setSummary(pathway.summary || "");
    setFocusInput(
      (pathway.focus_areas || []).join(
        ", "
      )
    );
    setMessage("");
    setErrorMessage("");
  }

  async function loadWorkspace() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const [
      pathwayResult,
      goalResult,
      actionResult,
      reviewResult,
      timelineResult,
    ] = await Promise.all([
      supabase
        .from("clinical_care_pathways")
        .select(
          "id, clinician_id, client_id, connection_id, name, status, start_date, review_date, summary, focus_areas, created_at, updated_at"
        )
        .eq("client_id", client.client_id)
        .order("updated_at", {
          ascending: false,
        }),

      supabase
        .from("clinical_care_goals")
        .select(
          "id, pathway_id, clinician_id, client_id, title, description, status, priority, target_date, progress, position, created_at, updated_at"
        )
        .eq("client_id", client.client_id),

      supabase
        .from("clinical_care_actions")
        .select(
          "id, pathway_id, goal_id, clinician_id, client_id, title, description, action_type, responsible_party, frequency, due_date, status, position, created_at, updated_at"
        )
        .eq("client_id", client.client_id),

      supabase
        .from("clinical_care_reviews")
        .select(
          "id, pathway_id, clinician_id, client_id, reviewed_at, summary, progress_notes, next_steps, created_at, updated_at"
        )
        .eq("client_id", client.client_id),

      supabase
        .from("clinical_care_timeline_items")
        .select(
          "id, pathway_id, clinician_id, client_id, item_type, goal_id, review_id, position, created_at"
        )
        .eq("client_id", client.client_id)
        .order("position", {
          ascending: true,
        }),
    ]);

    const firstError =
      pathwayResult.error ||
      goalResult.error ||
      actionResult.error ||
      reviewResult.error ||
      timelineResult.error;

    if (firstError) {
      console.error(
        "Could not load Care Pathway:",
        firstError
      );
      setErrorMessage(
        firstError.message ||
          "The care pathway could not be loaded."
      );
      setLoading(false);
      return;
    }

    const nextPathways =
      (pathwayResult.data ||
        []) as CarePathway[];

    setPathways(nextPathways);
    setGoals(
      (goalResult.data || []) as CareGoal[]
    );
    setActions(
      (actionResult.data ||
        []) as CareAction[]
    );
    setReviews(
      (reviewResult.data ||
        []) as CareReview[]
    );
    setTimelineItems(
      (timelineResult.data ||
        []) as CareTimelineItem[]
    );

    if (nextPathways.length > 0) {
      const current =
        nextPathways.find(
          (pathway) =>
            pathway.id ===
            selectedPathwayId
        ) || nextPathways[0];

      selectPathway(current);
    } else {
      setSelectedPathwayId("");
      setName("");
      setStatus("draft");
      setStartDate("");
      setReviewDate("");
      setSummary("");
      setFocusInput("");
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadWorkspace();
  }, [
    client.client_id,
    client.connection_id,
  ]);

  async function createPathway() {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "The care pathway could not be created."
      );
      return;
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    const { data, error } = await supabase
      .from("clinical_care_pathways")
      .insert({
        clinician_id: user.id,
        client_id: client.client_id,
        connection_id:
          client.connection_id,
        name: "New care pathway",
        status: "draft",
        start_date: today,
        summary: "",
        focus_areas: [],
      })
      .select(
        "id, clinician_id, client_id, connection_id, name, status, start_date, review_date, summary, focus_areas, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The care pathway could not be created."
      );
      return;
    }

    const pathway = data as CarePathway;

    setPathways((current) => [
      pathway,
      ...current,
    ]);
    selectPathway(pathway);
  }

  async function savePathway() {
    if (!selectedPathway) return;

    setSaving(true);
    setErrorMessage("");

    const focusAreas = focusInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("clinical_care_pathways")
      .update({
        name:
          name.trim() ||
          "Care pathway",
        status,
        start_date:
          startDate || null,
        review_date:
          reviewDate || null,
        summary,
        focus_areas: focusAreas,
      })
      .eq("id", selectedPathway.id)
      .select(
        "id, clinician_id, client_id, connection_id, name, status, start_date, review_date, summary, focus_areas, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The care pathway could not be saved."
      );
      setSaving(false);
      return;
    }

    const saved = data as CarePathway;

    setPathways((current) =>
      current.map((pathway) =>
        pathway.id === saved.id
          ? saved
          : pathway
      )
    );

    selectPathway(saved);
    setMessage("Care pathway saved.");
    setSaving(false);

    window.setTimeout(
      () => setMessage(""),
      1800
    );
  }

  async function deletePathway() {
    if (!selectedPathway) return;

    const confirmed = window.confirm(
      `Permanently delete "${selectedPathway.name}" and all of its goals, actions and reviews?`
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("clinical_care_pathways")
      .delete()
      .eq("id", selectedPathway.id);

    if (error) {
      setErrorMessage(
        error.message ||
          "The care pathway could not be deleted."
      );
      return;
    }

    const remaining =
      pathways.filter(
        (pathway) =>
          pathway.id !==
          selectedPathway.id
      );

    setPathways(remaining);
    setGoals((current) =>
      current.filter(
        (goal) =>
          goal.pathway_id !==
          selectedPathway.id
      )
    );
    setActions((current) =>
      current.filter(
        (action) =>
          action.pathway_id !==
          selectedPathway.id
      )
    );
    setReviews((current) =>
      current.filter(
        (review) =>
          review.pathway_id !==
          selectedPathway.id
      )
    );
    setTimelineItems((current) =>
      current.filter(
        (item) =>
          item.pathway_id !==
          selectedPathway.id
      )
    );

    if (remaining.length > 0) {
      selectPathway(remaining[0]);
    } else {
      setSelectedPathwayId("");
    }
  }

  async function appendTimelineItem({
    pathwayId,
    itemType,
    goalId = null,
    reviewId = null,
  }: {
    pathwayId: string;
    itemType: "goal" | "review";
    goalId?: string | null;
    reviewId?: string | null;
  }) {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error(
        "Could not identify the clinician for the timeline."
      );
    }

    const {
      data: nextPosition,
      error: positionError,
    } = await supabase.rpc(
      "psylattice_next_care_timeline_position",
      {
        p_pathway_id: pathwayId,
      }
    );

    if (positionError) {
      throw positionError;
    }

    const { data, error } = await supabase
      .from("clinical_care_timeline_items")
      .insert({
        pathway_id: pathwayId,
        clinician_id: user.id,
        client_id: client.client_id,
        item_type: itemType,
        goal_id: goalId,
        review_id: reviewId,
        position:
          typeof nextPosition === "number"
            ? nextPosition
            : 0,
      })
      .select(
        "id, pathway_id, clinician_id, client_id, item_type, goal_id, review_id, position, created_at"
      )
      .single();

    if (error || !data) {
      throw (
        error ||
        new Error(
          "The timeline item could not be created."
        )
      );
    }

    setTimelineItems((current) => [
      ...current,
      data as CareTimelineItem,
    ]);
  }

  async function moveTimelineItem(
    timelineItemId: string,
    direction: -1 | 1
  ) {
    if (reorderingTimeline) {
      return;
    }

    const ordered = timelineItems
      .filter(
        (item) =>
          item.pathway_id ===
          selectedPathwayId
      )
      .sort(
        (a, b) =>
          a.position - b.position ||
          new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
      );

    const index = ordered.findIndex(
      (item) =>
        item.id === timelineItemId
    );

    const swapIndex = index + direction;

    if (
      index < 0 ||
      swapIndex < 0 ||
      swapIndex >= ordered.length
    ) {
      return;
    }

    const currentItem = ordered[index];
    const otherItem = ordered[swapIndex];

    setReorderingTimeline(true);
    setErrorMessage("");

    const supabase = createClient();

    const temporaryPosition =
      Math.max(
        ...ordered.map(
          (item) => item.position
        )
      ) + 1000;

    const firstMove = await supabase
      .from("clinical_care_timeline_items")
      .update({
        position: temporaryPosition,
      })
      .eq("id", currentItem.id);

    if (firstMove.error) {
      setErrorMessage(
        firstMove.error.message ||
          "The timeline could not be reordered."
      );
      setReorderingTimeline(false);
      return;
    }

    const secondMove = await supabase
      .from("clinical_care_timeline_items")
      .update({
        position: currentItem.position,
      })
      .eq("id", otherItem.id);

    if (secondMove.error) {
      await supabase
        .from("clinical_care_timeline_items")
        .update({
          position: currentItem.position,
        })
        .eq("id", currentItem.id);

      setErrorMessage(
        secondMove.error.message ||
          "The timeline could not be reordered."
      );
      setReorderingTimeline(false);
      return;
    }

    const thirdMove = await supabase
      .from("clinical_care_timeline_items")
      .update({
        position: otherItem.position,
      })
      .eq("id", currentItem.id);

    if (thirdMove.error) {
      setErrorMessage(
        thirdMove.error.message ||
          "The timeline could not be reordered."
      );
      await loadWorkspace();
      setReorderingTimeline(false);
      return;
    }

    setTimelineItems((current) =>
      current.map((item) => {
        if (item.id === currentItem.id) {
          return {
            ...item,
            position: otherItem.position,
          };
        }

        if (item.id === otherItem.id) {
          return {
            ...item,
            position: currentItem.position,
          };
        }

        return item;
      })
    );

    setReorderingTimeline(false);
  }

  async function createGoal() {
    if (
      !selectedPathway ||
      !newGoalTitle.trim()
    ) {
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "The goal could not be created."
      );
      return;
    }

    const { data, error } = await supabase
      .from("clinical_care_goals")
      .insert({
        pathway_id:
          selectedPathway.id,
        clinician_id: user.id,
        client_id: client.client_id,
        title: newGoalTitle.trim(),
        description:
          newGoalDescription.trim(),
        status: "not_started",
        priority: newGoalPriority,
        target_date:
          newGoalTargetDate || null,
        progress: 0,
        position:
          pathwayGoals.length,
      })
      .select(
        "id, pathway_id, clinician_id, client_id, title, description, status, priority, target_date, progress, position, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The goal could not be created."
      );
      return;
    }

    const createdGoal =
      data as CareGoal;

    setGoals((current) => [
      ...current,
      createdGoal,
    ]);

    try {
      await appendTimelineItem({
        pathwayId: selectedPathway.id,
        itemType: "goal",
        goalId: createdGoal.id,
      });
    } catch (timelineError) {
      console.error(
        "Could not append goal to care timeline:",
        timelineError
      );
      setErrorMessage(
        timelineError instanceof Error
          ? timelineError.message
          : "The goal was created, but its timeline position could not be saved."
      );
    }

    setNewGoalTitle("");
    setNewGoalDescription("");
    setNewGoalPriority("medium");
    setNewGoalTargetDate("");
    setNewGoalOpen(false);
  }

  async function updateGoal(
    goalId: string,
    patch: Partial<CareGoal>
  ) {
    const supabase = createClient();

    const allowedPatch: Record<
      string,
      unknown
    > = {};

    [
      "title",
      "description",
      "status",
      "priority",
      "target_date",
      "progress",
      "position",
    ].forEach((key) => {
      if (key in patch) {
        allowedPatch[key] =
          patch[
            key as keyof CareGoal
          ];
      }
    });

    const { data, error } = await supabase
      .from("clinical_care_goals")
      .update(allowedPatch)
      .eq("id", goalId)
      .select(
        "id, pathway_id, clinician_id, client_id, title, description, status, priority, target_date, progress, position, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The goal could not be updated."
      );
      return;
    }

    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? (data as CareGoal)
          : goal
      )
    );
  }

  async function deleteGoal(goal: CareGoal) {
    const confirmed = window.confirm(
      `Delete the goal "${goal.title}" and its linked actions?`
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("clinical_care_goals")
      .delete()
      .eq("id", goal.id);

    if (error) {
      setErrorMessage(
        error.message ||
          "The goal could not be deleted."
      );
      return;
    }

    setGoals((current) =>
      current.filter(
        (candidate) =>
          candidate.id !== goal.id
      )
    );
    setActions((current) =>
      current.filter(
        (action) =>
          action.goal_id !== goal.id
      )
    );
    setTimelineItems((current) =>
      current.filter(
        (item) =>
          item.goal_id !== goal.id
      )
    );
  }

  async function createAction() {
    if (
      !selectedPathway ||
      !newActionGoalId ||
      !newActionTitle.trim()
    ) {
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "The action could not be created."
      );
      return;
    }

    const goalActions =
      pathwayActions.filter(
        (action) =>
          action.goal_id ===
          newActionGoalId
      );

    const { data, error } = await supabase
      .from("clinical_care_actions")
      .insert({
        pathway_id:
          selectedPathway.id,
        goal_id: newActionGoalId,
        clinician_id: user.id,
        client_id: client.client_id,
        title:
          newActionTitle.trim(),
        description:
          newActionDescription.trim(),
        action_type: newActionType,
        responsible_party:
          newActionParty,
        frequency:
          newActionFrequency.trim(),
        due_date:
          newActionDueDate || null,
        status: "planned",
        position:
          goalActions.length,
      })
      .select(
        "id, pathway_id, goal_id, clinician_id, client_id, title, description, action_type, responsible_party, frequency, due_date, status, position, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The action could not be created."
      );
      return;
    }

    setActions((current) => [
      ...current,
      data as CareAction,
    ]);

    setNewActionGoalId("");
    setNewActionTitle("");
    setNewActionDescription("");
    setNewActionType("intervention");
    setNewActionParty("clinician");
    setNewActionFrequency("");
    setNewActionDueDate("");
  }

  async function updateAction(
    actionId: string,
    patch: Partial<CareAction>
  ) {
    const supabase = createClient();

    const allowedPatch: Record<
      string,
      unknown
    > = {};

    [
      "title",
      "description",
      "action_type",
      "responsible_party",
      "frequency",
      "due_date",
      "status",
      "position",
    ].forEach((key) => {
      if (key in patch) {
        allowedPatch[key] =
          patch[
            key as keyof CareAction
          ];
      }
    });

    const { data, error } = await supabase
      .from("clinical_care_actions")
      .update(allowedPatch)
      .eq("id", actionId)
      .select(
        "id, pathway_id, goal_id, clinician_id, client_id, title, description, action_type, responsible_party, frequency, due_date, status, position, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The action could not be updated."
      );
      return;
    }

    setActions((current) =>
      current.map((action) =>
        action.id === actionId
          ? (data as CareAction)
          : action
      )
    );
  }

  async function deleteAction(
    action: CareAction
  ) {
    const confirmed = window.confirm(
      `Delete "${action.title}"?`
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("clinical_care_actions")
      .delete()
      .eq("id", action.id);

    if (error) {
      setErrorMessage(
        error.message ||
          "The action could not be deleted."
      );
      return;
    }

    setActions((current) =>
      current.filter(
        (candidate) =>
          candidate.id !==
          action.id
      )
    );
  }

  async function addReview() {
    if (!selectedPathway) return;

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "The review could not be saved."
      );
      return;
    }

    const { data, error } = await supabase
      .from("clinical_care_reviews")
      .insert({
        pathway_id:
          selectedPathway.id,
        clinician_id: user.id,
        client_id: client.client_id,
        reviewed_at:
          new Date().toISOString(),
        summary: reviewSummary.trim(),
        progress_notes:
          reviewProgressNotes.trim(),
        next_steps:
          reviewNextSteps.trim(),
      })
      .select(
        "id, pathway_id, clinician_id, client_id, reviewed_at, summary, progress_notes, next_steps, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The review could not be saved."
      );
      return;
    }

    const createdReview =
      data as CareReview;

    setReviews((current) => [
      createdReview,
      ...current,
    ]);

    try {
      await appendTimelineItem({
        pathwayId: selectedPathway.id,
        itemType: "review",
        reviewId: createdReview.id,
      });
    } catch (timelineError) {
      console.error(
        "Could not append review to care timeline:",
        timelineError
      );
      setErrorMessage(
        timelineError instanceof Error
          ? timelineError.message
          : "The review was created, but its timeline position could not be saved."
      );
    }

    setReviewSummary("");
    setReviewProgressNotes("");
    setReviewNextSteps("");
    setReviewOpen(false);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <p className="text-sm text-slate-500">
          Loading care pathway...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div
        className={`grid gap-5 transition-[grid-template-columns] duration-200 ${
          pathwayListCollapsed
            ? "xl:grid-cols-[minmax(0,1fr)]"
            : "xl:grid-cols-[270px_minmax(0,1fr)]"
        }`}
      >
        {/* PATHWAY LIST */}
        {!pathwayListCollapsed && (
        <aside className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Care pathways
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {client.client_name}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void createPathway()
              }
              className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
            >
              + New
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {pathways.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No pathway yet
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Create a pathway to start organising goals and care actions.
                </p>
              </div>
            ) : (
              pathways.map((pathway) => (
                <div
                  key={pathway.id}
                  className={`rounded-2xl border p-4 transition ${
                    pathway.id ===
                    selectedPathwayId
                      ? "border-cyan-300 bg-cyan-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      selectPathway(
                        pathway,
                        "editor"
                      )
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                        {pathway.name}
                      </p>

                      <Badge
                        tone={
                          pathwayTone(
                            pathway.status
                          ) as
                            | "slate"
                            | "cyan"
                            | "emerald"
                            | "amber"
                        }
                      >
                        {statusLabel(
                          pathway.status
                        )}
                      </Badge>
                    </div>

                    <p className="mt-3 text-[10px] text-slate-400">
                      Review{" "}
                      {dateLabel(
                        pathway.review_date
                      )}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selectPathway(
                        pathway,
                        "visualise"
                      )
                    }
                    className="mt-3 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-[11px] font-semibold text-cyan-800 transition hover:bg-cyan-50"
                  >
                    Visualise pathway
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
            <p className="text-xs font-semibold text-cyan-950">
              Private clinician plan
            </p>
            <p className="mt-1 text-[10px] leading-4 text-cyan-900/70">
              V1 care pathways are clinician-authored and are not shared through client permissions.
            </p>
          </div>
        </aside>
        )}

        {/* PATHWAY CONTENT */}
        <main className="relative min-w-0">
          {pathwayListCollapsed && (
            <button
              type="button"
              onClick={() =>
                setPathwayListCollapsed(false)
              }
              title="Show care pathways"
              className="absolute -left-1 top-3 z-20 hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 shadow-sm hover:bg-slate-50 xl:block"
            >
              ☰ Pathways
            </button>
          )}

          {!selectedPathway ? (
            <div className="flex min-h-[600px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 font-semibold text-cyan-800">
                  CP
                </div>
                <p className="mt-4 text-xl font-semibold text-slate-900">
                  Build a care pathway
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Define the overall plan, break it into measurable goals, attach care actions and record formal reviews over time.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void createPathway()
                  }
                  className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Create care pathway
                </button>
              </div>
            </div>
          ) : workspaceMode ===
            "visualise" ? (
            <CarePathwayVisualisation
              pathway={selectedPathway}
              goals={pathwayGoals}
              actions={pathwayActions}
              reviews={pathwayReviews}
              timelineItems={timelineItems}
              reordering={reorderingTimeline}
              onMoveItem={(timelineItemId, direction) =>
                void moveTimelineItem(
                  timelineItemId,
                  direction
                )
              }
              onBack={() =>
                setWorkspaceMode("editor")
              }
            />
          ) : (
            <div className="space-y-5">
              {/* HEADER */}
              <section className="rounded-3xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <input
                        value={name}
                        onChange={(event) =>
                          setName(
                            event.target.value
                          )
                        }
                        className="w-full border-0 bg-transparent text-2xl font-semibold tracking-tight text-slate-950 outline-none"
                        placeholder="Care pathway name"
                      />

                      <p className="mt-1 text-sm text-slate-500">
                        {client.client_name}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPathwayListCollapsed(
                            (current) =>
                              !current
                          )
                        }
                        title={
                          pathwayListCollapsed
                            ? "Show care pathway list"
                            : "Hide care pathway list"
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        {pathwayListCollapsed
                          ? "☰ Show pathways"
                          : "⇤ Focus editor"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setWorkspaceMode(
                            "visualise"
                          )
                        }
                        className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
                      >
                        Visualise
                      </button>

                      <select
                        value={status}
                        onChange={(event) =>
                          setStatus(
                            event.target
                              .value as CarePathway["status"]
                          )
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700"
                      >
                        {pathwayStatusOptions.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          void savePathway()
                        }
                        disabled={saving}
                        className="rounded-xl bg-cyan-800 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {saving
                          ? "Saving..."
                          : "Save pathway"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void deletePathway()
                        }
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 lg:grid-cols-[1.35fr_.65fr]">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Clinical summary / rationale
                      </span>
                      <textarea
                        value={summary}
                        onChange={(event) =>
                          setSummary(
                            event.target.value
                          )
                        }
                        rows={5}
                        placeholder="Summarise the overall rationale, needs, formulation or care direction for this pathway."
                        className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-cyan-700"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Focus areas
                      </span>
                      <input
                        value={focusInput}
                        onChange={(event) =>
                          setFocusInput(
                            event.target.value
                          )
                        }
                        placeholder="e.g. anxiety, sleep, coping, social functioning"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                      />
                      <p className="mt-1 text-[10px] text-slate-400">
                        Separate focus areas with commas.
                      </p>
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <label className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Start date
                      </span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(event) =>
                          setStartDate(
                            event.target.value
                          )
                        }
                        className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                      />
                    </label>

                    <label className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Next review
                      </span>
                      <input
                        type="date"
                        value={reviewDate}
                        onChange={(event) =>
                          setReviewDate(
                            event.target.value
                          )
                        }
                        className="mt-2 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
                      />
                    </label>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Active goals
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {activeGoalCount}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
                        Mean goal progress
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-cyan-950">
                        {averageProgress}%
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* GOALS */}
              <section className="rounded-3xl border border-slate-200 bg-white">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Goals
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Translate the pathway into specific targets and update progress over time.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNewGoalOpen(
                        (current) => !current
                      )
                    }
                    className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white"
                  >
                    + Add goal
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  {newGoalOpen && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={newGoalTitle}
                          onChange={(event) =>
                            setNewGoalTitle(
                              event.target.value
                            )
                          }
                          placeholder="Goal title"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={newGoalPriority}
                            onChange={(event) =>
                              setNewGoalPriority(
                                event.target
                                  .value as CareGoal["priority"]
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs"
                          >
                            <option value="low">
                              Low priority
                            </option>
                            <option value="medium">
                              Medium priority
                            </option>
                            <option value="high">
                              High priority
                            </option>
                          </select>

                          <input
                            type="date"
                            value={
                              newGoalTargetDate
                            }
                            onChange={(event) =>
                              setNewGoalTargetDate(
                                event.target.value
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs"
                          />
                        </div>
                      </div>

                      <textarea
                        value={
                          newGoalDescription
                        }
                        onChange={(event) =>
                          setNewGoalDescription(
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder="Describe the goal, desired outcome or observable change."
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none"
                      />

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setNewGoalOpen(false)
                          }
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={
                            !newGoalTitle.trim()
                          }
                          onClick={() =>
                            void createGoal()
                          }
                          className="rounded-xl bg-cyan-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Create goal
                        </button>
                      </div>
                    </div>
                  )}

                  {pathwayGoals.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-6 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        No goals yet
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Add the first goal for this pathway.
                      </p>
                    </div>
                  ) : (
                    pathwayGoals.map((goal) => {
                      const goalActions =
                        pathwayActions.filter(
                          (action) =>
                            action.goal_id ===
                            goal.id
                        );

                      return (
                        <article
                          key={goal.id}
                          className="rounded-2xl border border-slate-200"
                        >
                          <div className="p-5">
                            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-semibold text-slate-900">
                                    {goal.title}
                                  </h4>

                                  <Badge
                                    tone={
                                      goalTone(
                                        goal.status
                                      ) as
                                        | "slate"
                                        | "cyan"
                                        | "emerald"
                                        | "amber"
                                        | "red"
                                    }
                                  >
                                    {statusLabel(
                                      goal.status
                                    )}
                                  </Badge>

                                  <Badge
                                    tone={
                                      goal.priority ===
                                      "high"
                                        ? "amber"
                                        : "slate"
                                    }
                                  >
                                    {statusLabel(
                                      goal.priority
                                    )}{" "}
                                    priority
                                  </Badge>
                                </div>

                                {goal.description && (
                                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                    {
                                      goal.description
                                    }
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  value={
                                    goal.status
                                  }
                                  onChange={(event) =>
                                    void updateGoal(
                                      goal.id,
                                      {
                                        status:
                                          event
                                            .target
                                            .value as CareGoal["status"],
                                      }
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600"
                                >
                                  {goalStatusOptions.map(
                                    (option) => (
                                      <option
                                        key={
                                          option.value
                                        }
                                        value={
                                          option.value
                                        }
                                      >
                                        {
                                          option.label
                                        }
                                      </option>
                                    )
                                  )}
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteGoal(
                                      goal
                                    )
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-[11px] font-semibold text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_170px]">
                              <div>
                                <div className="mb-2 flex items-center justify-between text-xs">
                                  <span className="font-medium text-slate-600">
                                    Progress
                                  </span>
                                  <span className="font-semibold text-cyan-800">
                                    {goal.progress}%
                                  </span>
                                </div>

                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={
                                    goal.progress
                                  }
                                  onChange={(event) =>
                                    setGoals(
                                      (current) =>
                                        current.map(
                                          (
                                            candidate
                                          ) =>
                                            candidate.id ===
                                            goal.id
                                              ? {
                                                  ...candidate,
                                                  progress:
                                                    Number(
                                                      event
                                                        .target
                                                        .value
                                                    ),
                                                }
                                              : candidate
                                        )
                                    )
                                  }
                                  onMouseUp={(event) =>
                                    void updateGoal(
                                      goal.id,
                                      {
                                        progress:
                                          Number(
                                            (
                                              event.target as HTMLInputElement
                                            ).value
                                          ),
                                      }
                                    )
                                  }
                                  onTouchEnd={(event) =>
                                    void updateGoal(
                                      goal.id,
                                      {
                                        progress:
                                          Number(
                                            (
                                              event.target as HTMLInputElement
                                            ).value
                                          ),
                                      }
                                    )
                                  }
                                  className="w-full accent-cyan-700"
                                />
                              </div>

                              <label className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2">
                                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                  Target date
                                </span>
                                <input
                                  type="date"
                                  value={
                                    goal.target_date ||
                                    ""
                                  }
                                  onChange={(event) =>
                                    void updateGoal(
                                      goal.id,
                                      {
                                        target_date:
                                          event.target
                                            .value ||
                                          null,
                                      }
                                    )
                                  }
                                  className="mt-1 w-full bg-transparent text-xs text-slate-600 outline-none"
                                />
                              </label>
                            </div>
                          </div>

                          {/* ACTIONS */}
                          <div className="border-t border-slate-100 bg-slate-50/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                                  Care actions
                                </p>
                                <p className="mt-1 text-[10px] text-slate-400">
                                  {goalActions.length} linked action
                                  {goalActions.length ===
                                  1
                                    ? ""
                                    : "s"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewActionGoalId(
                                    goal.id
                                  );
                                  setNewActionTitle(
                                    ""
                                  );
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600"
                              >
                                + Add action
                              </button>
                            </div>

                            {newActionGoalId ===
                              goal.id && (
                              <div className="mt-3 rounded-xl border border-cyan-200 bg-white p-4">
                                <div className="grid gap-2 md:grid-cols-2">
                                  <input
                                    value={
                                      newActionTitle
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setNewActionTitle(
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="Action / intervention"
                                    className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                                  />

                                  <div className="grid grid-cols-2 gap-2">
                                    <select
                                      value={
                                        newActionType
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setNewActionType(
                                          event
                                            .target
                                            .value as CareAction["action_type"]
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                                    >
                                      {actionTypeOptions.map(
                                        (
                                          option
                                        ) => (
                                          <option
                                            key={
                                              option.value
                                            }
                                            value={
                                              option.value
                                            }
                                          >
                                            {
                                              option.label
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>

                                    <select
                                      value={
                                        newActionParty
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setNewActionParty(
                                          event
                                            .target
                                            .value as CareAction["responsible_party"]
                                        )
                                      }
                                      className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                                    >
                                      <option value="clinician">
                                        Clinician
                                      </option>
                                      <option value="client">
                                        Client
                                      </option>
                                      <option value="shared">
                                        Shared
                                      </option>
                                      <option value="other">
                                        Other
                                      </option>
                                    </select>
                                  </div>
                                </div>

                                <textarea
                                  value={
                                    newActionDescription
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setNewActionDescription(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  rows={2}
                                  placeholder="Description or instructions"
                                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5"
                                />

                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                  <input
                                    value={
                                      newActionFrequency
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setNewActionFrequency(
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    placeholder="Frequency, e.g. weekly"
                                    className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                                  />

                                  <input
                                    type="date"
                                    value={
                                      newActionDueDate
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      setNewActionDueDate(
                                        event
                                          .target
                                          .value
                                      )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs"
                                  />
                                </div>

                                <div className="mt-3 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setNewActionGoalId(
                                        ""
                                      )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    disabled={
                                      !newActionTitle.trim()
                                    }
                                    onClick={() =>
                                      void createAction()
                                    }
                                    className="rounded-lg bg-cyan-800 px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-40"
                                  >
                                    Add action
                                  </button>
                                </div>
                              </div>
                            )}

                            {goalActions.length >
                              0 && (
                              <div className="mt-3 space-y-2">
                                {goalActions.map(
                                  (action) => (
                                    <div
                                      key={
                                        action.id
                                      }
                                      className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto]"
                                    >
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="text-sm font-semibold text-slate-800">
                                            {
                                              action.title
                                            }
                                          </p>

                                          <Badge tone="slate">
                                            {statusLabel(
                                              action.action_type
                                            )}
                                          </Badge>

                                          <Badge tone="cyan">
                                            {statusLabel(
                                              action.responsible_party
                                            )}
                                          </Badge>
                                        </div>

                                        {action.description && (
                                          <p className="mt-1 text-xs leading-5 text-slate-500">
                                            {
                                              action.description
                                            }
                                          </p>
                                        )}

                                        <p className="mt-2 text-[10px] text-slate-400">
                                          {action.frequency
                                            ? `${action.frequency} · `
                                            : ""}
                                          Due{" "}
                                          {dateLabel(
                                            action.due_date
                                          )}
                                        </p>
                                      </div>

                                      <div className="flex items-start gap-2">
                                        <select
                                          value={
                                            action.status
                                          }
                                          onChange={(
                                            event
                                          ) =>
                                            void updateAction(
                                              action.id,
                                              {
                                                status:
                                                  event
                                                    .target
                                                    .value as CareAction["status"],
                                              }
                                            )
                                          }
                                          className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px] text-slate-600"
                                        >
                                          {actionStatusOptions.map(
                                            (
                                              option
                                            ) => (
                                              <option
                                                key={
                                                  option.value
                                                }
                                                value={
                                                  option.value
                                                }
                                              >
                                                {
                                                  option.label
                                                }
                                              </option>
                                            )
                                          )}
                                        </select>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            void deleteAction(
                                              action
                                            )
                                          }
                                          className="rounded-lg border border-red-200 px-2.5 py-2 text-[10px] font-semibold text-red-600"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>

              {/* REVIEWS */}
              <section className="rounded-3xl border border-slate-200 bg-white">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Pathway reviews
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Record formal review points without overwriting the ongoing plan.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setReviewOpen(
                        (current) => !current
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700"
                  >
                    + Add review
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  {reviewOpen && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
                      <textarea
                        value={reviewSummary}
                        onChange={(event) =>
                          setReviewSummary(
                            event.target.value
                          )
                        }
                        rows={2}
                        placeholder="Review summary"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />

                      <textarea
                        value={
                          reviewProgressNotes
                        }
                        onChange={(event) =>
                          setReviewProgressNotes(
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder="Progress since the previous review"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />

                      <textarea
                        value={
                          reviewNextSteps
                        }
                        onChange={(event) =>
                          setReviewNextSteps(
                            event.target.value
                          )
                        }
                        rows={3}
                        placeholder="Next steps / adjustments"
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                      />

                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setReviewOpen(false)
                          }
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void addReview()
                          }
                          className="rounded-xl bg-cyan-800 px-4 py-2 text-xs font-semibold text-white"
                        >
                          Save review
                        </button>
                      </div>
                    </div>
                  )}

                  {pathwayReviews.length ===
                  0 ? (
                    <div className="rounded-2xl bg-slate-50 p-6 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        No formal reviews yet
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Add a review when the pathway is formally reassessed.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pathwayReviews.map(
                        (review) => (
                          <article
                            key={review.id}
                            className="rounded-2xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                Pathway review
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {reviewDateTime(
                                  review.reviewed_at
                                )}
                              </span>
                            </div>

                            {review.summary && (
                              <div className="mt-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                  Summary
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {
                                    review.summary
                                  }
                                </p>
                              </div>
                            )}

                            {review.progress_notes && (
                              <div className="mt-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                  Progress
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {
                                    review.progress_notes
                                  }
                                </p>
                              </div>
                            )}

                            {review.next_steps && (
                              <div className="mt-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                  Next steps
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                  {
                                    review.next_steps
                                  }
                                </p>
                              </div>
                            )}
                          </article>
                        )
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
