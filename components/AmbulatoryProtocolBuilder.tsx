"use client";

import { type ReactNode } from "react";

export type AmbulatoryBlockType =
  | "slider"
  | "single_choice"
  | "multiple_choice"
  | "yes_no"
  | "number"
  | "short_text"
  | "long_text"
  | "instruction"
  | "activity"
  | "questionnaire"
  | "time_duration"
  | "mood";

export type AmbulatoryTriggerType =
  | "fixed_time"
  | "random_window"
  | "interval"
  | "event_contingent"
  | "participant_initiated";

export type AmbulatoryCondition = {
  sourceKey: string;
  operator: string;
  value: string;
};

export type AmbulatoryVisibility = {
  mode: "always" | "conditional";
  logic: "AND" | "OR";
  conditions: AmbulatoryCondition[];
};

export type AmbulatoryConditionalTrigger = {
  operator:
    | "gt"
    | "lt"
    | "equals"
    | "between"
    | "contains_any"
    | "contains_all";
  value?: string;
  value2?: string;
  values?: string[];
};

export type AmbulatoryConditionalChild = {
  trigger: AmbulatoryConditionalTrigger;
  item: AmbulatoryItemDraft;
};

export type AmbulatoryItemDraft = {
  item_id?: string;
  key: string;
  type: AmbulatoryBlockType;
  prompt: string;
  required: boolean;
  config: Record<string, any>;
  visibility: AmbulatoryVisibility;
  conditionalChildren?: AmbulatoryConditionalChild[];
};

export type AmbulatoryScheduleDraft = {
  schedule_id?: string;
  key: string;
  label: string;

  // Older PsyLattice clinical protocols already use start_time/end_time.
  // Keeping these fields means the V3 builder remains backward-compatible.
  start_time: string;
  end_time: string;

  trigger_type?: AmbulatoryTriggerType;
  fixed_time?: string;
  interval_minutes?: number;
  response_window_minutes?: number;

  event_title?: string;
  event_description?: string;
  maximum_per_day?: number;
  minimum_interval_minutes?: number;

  notification_enabled?: boolean;
  notification_title?: string;
  notification_body?: string;

  items: AmbulatoryItemDraft[];
};

export type AmbulatoryQuestionnaireOption = {
  questionnaire_id: string;
  questionnaire_name: string;
  questionnaire_acronym: string | null;
  questionnaire_slug?: string;
  questionnaire_category?: string;
  item_count?: number;
  estimated_minutes?: number | null;
  source_type?: string | null;
  is_owned_by_user?: boolean;
};

export function ambulatoryDraftKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

export function ambulatoryCanHaveConditionalChildren(
  type: AmbulatoryBlockType
) {
  return (
    type === "slider" ||
    type === "single_choice" ||
    type === "multiple_choice" ||
    type === "yes_no" ||
    type === "number"
  );
}

export function newAmbulatoryItem(
  type: AmbulatoryBlockType,
  index: number
): AmbulatoryItemDraft {
  const defaults: Record<
    AmbulatoryBlockType,
    {
      prompt: string;
      config: Record<string, any>;
    }
  > = {
    slider: {
      prompt: "How would you rate this right now?",
      config: {
        min: 0,
        max: 10,
        step: 1,
        minLabel: "Not at all",
        maxLabel: "Extremely",
      },
    },
    single_choice: {
      prompt: "Choose the option that fits best.",
      config: {
        options: ["Option 1", "Option 2", "Option 3"],
      },
    },
    multiple_choice: {
      prompt: "Select all that apply.",
      config: {
        options: ["Option 1", "Option 2", "Option 3"],
      },
    },
    yes_no: {
      prompt: "Is this true right now?",
      config: {},
    },
    number: {
      prompt: "Enter a number.",
      config: {
        min: 0,
        max: 100,
        step: 1,
      },
    },
    short_text: {
      prompt: "Write a short response.",
      config: {},
    },
    long_text: {
      prompt: "Tell us more.",
      config: {},
    },
    instruction: {
      prompt: "Read this before continuing.",
      config: {
        text: "",
      },
    },
    activity: {
      prompt: "Complete this activity.",
      config: {
        instructions:
          "Follow the activity instructions, then mark it complete.",
        durationMinutes: 2,
      },
    },
    questionnaire: {
      prompt: "Complete this questionnaire.",
      config: {
        questionnaire_id: "",
        questionnaire_name: "",
        questionnaire_acronym: "",
      },
    },
    time_duration: {
      prompt: "How long?",
      config: {
        unit: "minutes",
        min: 0,
        max: 1440,
      },
    },
    mood: {
      prompt: "Which mood best describes how you feel?",
      config: {
        options: [
          "Calm",
          "Happy",
          "Sad",
          "Anxious",
          "Irritated",
          "Tired",
        ],
      },
    },
  };

  return {
    key: ambulatoryDraftKey(`item-${index + 1}`),
    type,
    prompt: defaults[type].prompt,
    required: type !== "instruction",
    config: defaults[type].config,
    visibility: {
      mode: "always",
      logic: "AND",
      conditions: [],
    },
    conditionalChildren: [],
  };
}

export function defaultAmbulatoryProtocol(): AmbulatoryScheduleDraft[] {
  const eventYesNo = newAmbulatoryItem("yes_no", 1);

  eventYesNo.prompt =
    "Did anything important happen since the previous check-in?";

  eventYesNo.conditionalChildren = [
    {
      trigger: {
        operator: "equals",
        value: "Yes",
      },
      item: {
        ...newAmbulatoryItem("long_text", 2),
        prompt: "What happened?",
        required: false,
      },
    },
  ];

  return [
    {
      key: ambulatoryDraftKey("morning"),
      label: "Morning",
      trigger_type: "fixed_time",
      start_time: "08:00",
      end_time: "10:00",
      fixed_time: "09:00",
      response_window_minutes: 60,
      notification_enabled: true,
      notification_title: "Morning check-in",
      notification_body: "Your PsyLattice check-in is ready.",
      items: [
        {
          ...newAmbulatoryItem("slider", 0),
          prompt: "How stressed do you feel right now?",
          config: {
            min: 0,
            max: 10,
            step: 1,
            minLabel: "Not at all",
            maxLabel: "Extremely",
          },
        },
        eventYesNo,
      ],
    },
    {
      key: ambulatoryDraftKey("afternoon"),
      label: "Afternoon",
      trigger_type: "random_window",
      start_time: "14:00",
      end_time: "17:00",
      fixed_time: "15:30",
      response_window_minutes: 45,
      notification_enabled: true,
      notification_title: "Afternoon check-in",
      notification_body: "A PsyLattice check-in is available now.",
      items: [
        {
          ...newAmbulatoryItem("single_choice", 0),
          prompt: "What are you doing right now?",
          config: {
            options: [
              "Studying",
              "Working",
              "Resting",
              "Eating",
              "Exercising",
              "Socialising",
              "Travelling",
              "Other",
            ],
          },
        },
        {
          ...newAmbulatoryItem("slider", 1),
          prompt: "How stressed do you feel right now?",
        },
      ],
    },
    {
      key: ambulatoryDraftKey("event"),
      label: "Report a significant event",
      trigger_type: "event_contingent",
      start_time: "00:00",
      end_time: "23:59",
      fixed_time: "12:00",
      response_window_minutes: 120,
      event_title: "Significant event",
      event_description:
        "Use this whenever the defined event occurs.",
      maximum_per_day: 8,
      minimum_interval_minutes: 10,
      notification_enabled: false,
      items: [
        {
          ...newAmbulatoryItem("slider", 0),
          prompt: "How intense was the event?",
          config: {
            min: 0,
            max: 10,
            step: 1,
            minLabel: "Very low",
            maxLabel: "Very high",
          },
        },
        {
          ...newAmbulatoryItem("long_text", 1),
          prompt: "Briefly describe what happened.",
          required: false,
        },
      ],
    },
  ];
}


// Backward-compatible alias for any older PsyLattice page that still
// references the previous helper name.
export const defaultMonitoringProtocol =
  defaultAmbulatoryProtocol;

function defaultAmbulatoryTrigger(
  parent: AmbulatoryItemDraft
): AmbulatoryConditionalTrigger {
  if (parent.type === "slider" || parent.type === "number") {
    const min = Number(parent.config.min ?? 0);
    const max = Number(parent.config.max ?? 10);
    const midpoint =
      Number.isFinite(min) && Number.isFinite(max)
        ? Math.round(((min + max) / 2) * 100) / 100
        : 5;

    return {
      operator: "gt",
      value: String(midpoint),
    };
  }

  if (parent.type === "single_choice") {
    return {
      operator: "equals",
      value: (parent.config.options || [])[0] || "",
    };
  }

  if (parent.type === "multiple_choice") {
    const first = (parent.config.options || [])[0] || "";

    return {
      operator: "contains_any",
      values: first ? [first] : [],
    };
  }

  return {
    operator: "equals",
    value: "Yes",
  };
}

function normaliseAmbulatoryTriggerForParent(
  parent: AmbulatoryItemDraft,
  trigger: AmbulatoryConditionalTrigger
): AmbulatoryConditionalTrigger {
  if (parent.type === "slider" || parent.type === "number") {
    const operator = ["gt", "lt", "equals", "between"].includes(
      trigger.operator
    )
      ? trigger.operator
      : "gt";

    return {
      operator: operator as "gt" | "lt" | "equals" | "between",
      value: trigger.value ?? String(parent.config.min ?? 0),
      value2:
        operator === "between"
          ? trigger.value2 ?? String(parent.config.max ?? 10)
          : undefined,
    };
  }

  if (parent.type === "single_choice") {
    const options = (parent.config.options || []) as string[];

    return {
      operator: "equals",
      value: options.includes(trigger.value || "")
        ? trigger.value
        : options[0] || "",
    };
  }

  if (parent.type === "multiple_choice") {
    const options = (parent.config.options || []) as string[];

    const selected = (trigger.values || []).filter((value) =>
      options.includes(value)
    );

    return {
      operator:
        trigger.operator === "contains_all"
          ? "contains_all"
          : "contains_any",
      values:
        selected.length > 0
          ? selected
          : options[0]
            ? [options[0]]
            : [],
    };
  }

  return {
    operator: "equals",
    value: trigger.value === "No" ? "No" : "Yes",
  };
}

function ambulatoryTriggerToVisibility(
  parent: AmbulatoryItemDraft,
  trigger: AmbulatoryConditionalTrigger
): AmbulatoryVisibility {
  const safe = normaliseAmbulatoryTriggerForParent(parent, trigger);

  if (parent.type === "slider" || parent.type === "number") {
    if (safe.operator === "between") {
      return {
        mode: "conditional",
        logic: "AND",
        conditions: [
          {
            sourceKey: parent.key,
            operator: "gte",
            value: String(safe.value ?? ""),
          },
          {
            sourceKey: parent.key,
            operator: "lte",
            value: String(safe.value2 ?? safe.value ?? ""),
          },
        ],
      };
    }

    return {
      mode: "conditional",
      logic: "AND",
      conditions: [
        {
          sourceKey: parent.key,
          operator: safe.operator,
          value: String(safe.value ?? ""),
        },
      ],
    };
  }

  if (parent.type === "multiple_choice") {
    const values = safe.values || [];

    return {
      mode: "conditional",
      logic:
        safe.operator === "contains_all"
          ? "AND"
          : "OR",
      conditions: values.map((value) => ({
        sourceKey: parent.key,
        operator: "contains",
        value,
      })),
    };
  }

  return {
    mode: "conditional",
    logic: "AND",
    conditions: [
      {
        sourceKey: parent.key,
        operator: "equals",
        value: String(safe.value ?? ""),
      },
    ],
  };
}

function ambulatoryVisibilityToTrigger(
  parent: AmbulatoryItemDraft,
  visibility: AmbulatoryVisibility
): AmbulatoryConditionalTrigger {
  if (parent.type === "slider" || parent.type === "number") {
    const lower = visibility.conditions.find(
      (condition) => condition.operator === "gte"
    );
    const upper = visibility.conditions.find(
      (condition) => condition.operator === "lte"
    );

    if (lower && upper) {
      return {
        operator: "between",
        value: lower.value,
        value2: upper.value,
      };
    }

    const first = visibility.conditions[0];

    return normaliseAmbulatoryTriggerForParent(parent, {
      operator: (
        first?.operator === "gt" ||
        first?.operator === "lt" ||
        first?.operator === "equals"
          ? first.operator
          : "equals"
      ) as "gt" | "lt" | "equals",
      value: first?.value || "",
    });
  }

  if (parent.type === "multiple_choice") {
    return normaliseAmbulatoryTriggerForParent(parent, {
      operator:
        visibility.logic === "AND"
          ? "contains_all"
          : "contains_any",
      values: visibility.conditions
        .filter(
          (condition) => condition.operator === "contains"
        )
        .map((condition) => condition.value),
    });
  }

  return normaliseAmbulatoryTriggerForParent(parent, {
    operator: "equals",
    value:
      visibility.conditions[0]?.value ||
      (parent.type === "yes_no" ? "Yes" : ""),
  });
}

function flattenAmbulatoryItems(
  items: AmbulatoryItemDraft[]
) {
  const flat: AmbulatoryItemDraft[] = [];

  function visit(
    item: AmbulatoryItemDraft,
    visibility: AmbulatoryVisibility
  ) {
    const {
      conditionalChildren: _children,
      ...itemWithoutChildren
    } = item;

    flat.push({
      ...itemWithoutChildren,
      visibility,
    });

    for (const child of item.conditionalChildren || []) {
      visit(
        child.item,
        ambulatoryTriggerToVisibility(
          item,
          child.trigger
        )
      );
    }
  }

  for (const item of items) {
    visit(item, {
      mode: "always",
      logic: "AND",
      conditions: [],
    });
  }

  return flat;
}

export function serializeAmbulatoryProtocol(
  protocol: AmbulatoryScheduleDraft[]
): AmbulatoryScheduleDraft[] {
  return protocol.map((schedule) => ({
    ...schedule,
    trigger_type:
      schedule.trigger_type || "fixed_time",
    fixed_time:
      schedule.fixed_time ||
      schedule.start_time ||
      "09:00",
    response_window_minutes:
      schedule.response_window_minutes ?? 60,
    maximum_per_day:
      schedule.maximum_per_day ?? 8,
    minimum_interval_minutes:
      schedule.minimum_interval_minutes ?? 0,
    notification_enabled:
      schedule.notification_enabled ??
      (schedule.trigger_type !== "event_contingent" &&
        schedule.trigger_type !== "participant_initiated"),
    items: flattenAmbulatoryItems(schedule.items),
  }));
}

function nestAmbulatoryItems(
  flatItems: AmbulatoryItemDraft[]
) {
  const roots: AmbulatoryItemDraft[] = [];
  const byKey = new Map<string, AmbulatoryItemDraft>();

  for (const raw of flatItems || []) {
    const item: AmbulatoryItemDraft = {
      ...raw,
      visibility:
        raw.visibility || {
          mode: "always",
          logic: "AND",
          conditions: [],
        },
      conditionalChildren: [],
    };

    byKey.set(item.key, item);

    const conditions = item.visibility?.conditions || [];
    const sourceKeys = Array.from(
      new Set(
        conditions
          .map((condition) => condition.sourceKey)
          .filter(Boolean)
      )
    );

    const parent =
      item.visibility?.mode === "conditional" &&
      sourceKeys.length === 1
        ? byKey.get(sourceKeys[0])
        : null;

    if (
      parent &&
      ambulatoryCanHaveConditionalChildren(parent.type)
    ) {
      parent.conditionalChildren = [
        ...(parent.conditionalChildren || []),
        {
          trigger: ambulatoryVisibilityToTrigger(
            parent,
            item.visibility
          ),
          item,
        },
      ];
    } else {
      roots.push(item);
    }
  }

  return roots;
}

export function nestAmbulatoryProtocol(
  protocol: AmbulatoryScheduleDraft[]
): AmbulatoryScheduleDraft[] {
  return (protocol || []).map((schedule) => ({
    ...schedule,
    trigger_type:
      schedule.trigger_type || "fixed_time",
    fixed_time:
      schedule.fixed_time ||
      schedule.start_time ||
      "09:00",
    response_window_minutes:
      schedule.response_window_minutes ?? 60,
    items: nestAmbulatoryItems(schedule.items || []),
  }));
}

export function ambulatoryConditionMatches(
  condition: AmbulatoryCondition,
  sourceType: AmbulatoryBlockType,
  response: any
) {
  const answered = ambulatoryResponseAnswered(response);

  if (condition.operator === "answered") {
    return answered;
  }

  if (condition.operator === "not_answered") {
    return !answered;
  }

  if (!answered) {
    return false;
  }

  const target = condition.value;

  if (
    sourceType === "slider" ||
    sourceType === "number" ||
    sourceType === "time_duration"
  ) {
    const left = Number(response);
    const right = Number(target);

    if (
      Number.isNaN(left) ||
      Number.isNaN(right)
    ) {
      return false;
    }

    if (condition.operator === "gt") return left > right;
    if (condition.operator === "gte") return left >= right;
    if (condition.operator === "lt") return left < right;
    if (condition.operator === "lte") return left <= right;
    if (condition.operator === "not_equals") {
      return left !== right;
    }

    return left === right;
  }

  if (sourceType === "multiple_choice") {
    const values = Array.isArray(response)
      ? response.map(String)
      : [];

    if (condition.operator === "not_contains") {
      return !values.includes(target);
    }

    return values.includes(target);
  }

  if (condition.operator === "contains_text") {
    return String(response)
      .toLowerCase()
      .includes(target.toLowerCase());
  }

  if (condition.operator === "not_equals") {
    return String(response) !== target;
  }

  return String(response) === target;
}

export function ambulatoryResponseAnswered(value: any) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "completed" in value
  ) {
    return Boolean(value.completed);
  }

  return true;
}

export function ambulatoryVisibleItems(
  items: AmbulatoryItemDraft[],
  responses: Record<string, any>
) {
  const byKey = new Map(
    items.map((item) => [item.key, item])
  );

  return items.filter((item) => {
    if (item.visibility?.mode !== "conditional") {
      return true;
    }

    const conditions =
      item.visibility.conditions || [];

    if (conditions.length === 0) {
      return true;
    }

    const results = conditions.map((condition) => {
      const source = byKey.get(condition.sourceKey);

      if (!source) {
        return false;
      }

      return ambulatoryConditionMatches(
        condition,
        source.type,
        responses[condition.sourceKey]
      );
    });

    return item.visibility.logic === "OR"
      ? results.some(Boolean)
      : results.every(Boolean);
  });
}

export function cleanHiddenAmbulatoryResponses(
  items: AmbulatoryItemDraft[],
  incoming: Record<string, any>
) {
  let next = {
    ...incoming,
  };

  for (
    let pass = 0;
    pass < items.length + 1;
    pass += 1
  ) {
    const visible = new Set(
      ambulatoryVisibleItems(
        items,
        next
      ).map((item) => item.key)
    );

    let changed = false;

    for (const key of Object.keys(next)) {
      if (!visible.has(key)) {
        delete next[key];
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }

  return next;
}

function countTreeItems(
  items: AmbulatoryItemDraft[]
): number {
  return items.reduce(
    (total, item) =>
      total +
      1 +
      countTreeItems(
        (item.conditionalChildren || []).map(
          (child) => child.item
        )
      ),
    0
  );
}

function mapTreeItem(
  items: AmbulatoryItemDraft[],
  targetKey: string,
  updater: (
    item: AmbulatoryItemDraft
  ) => AmbulatoryItemDraft
): AmbulatoryItemDraft[] {
  return items.map((item) => {
    if (item.key === targetKey) {
      return updater(item);
    }

    return {
      ...item,
      conditionalChildren: (
        item.conditionalChildren || []
      ).map((child) => ({
        ...child,
        item: mapTreeItem(
          [child.item],
          targetKey,
          updater
        )[0],
      })),
    };
  });
}

function findTreeItem(
  items: AmbulatoryItemDraft[],
  targetKey: string
): AmbulatoryItemDraft | null {
  for (const item of items) {
    if (item.key === targetKey) {
      return item;
    }

    const nested = findTreeItem(
      (item.conditionalChildren || []).map(
        (child) => child.item
      ),
      targetKey
    );

    if (nested) {
      return nested;
    }
  }

  return null;
}

export function validateAmbulatoryProtocol(
  protocol: AmbulatoryScheduleDraft[]
) {
  if (!protocol.length || protocol.length > 20) {
    return "Choose between 1 and 20 check-ins/events.";
  }

  function validateItems(
    items: AmbulatoryItemDraft[]
  ): string {
    for (const item of items) {
      if (!item.prompt.trim()) {
        return "Every block needs a prompt or title.";
      }

      if (
        item.type === "questionnaire" &&
        !item.config.questionnaire_id
      ) {
        return "Choose a questionnaire for every questionnaire block.";
      }

      if (
        (item.conditionalChildren || []).length > 0 &&
        !ambulatoryCanHaveConditionalChildren(item.type)
      ) {
        return `"${item.prompt}" cannot contain conditional blocks.`;
      }

      for (const child of item.conditionalChildren || []) {
        const trigger =
          normaliseAmbulatoryTriggerForParent(
            item,
            child.trigger
          );

        if (
          item.type === "slider" ||
          item.type === "number"
        ) {
          const first = Number(trigger.value);

          if (!Number.isFinite(first)) {
            return `Choose a valid conditional value under "${item.prompt}".`;
          }

          if (trigger.operator === "between") {
            const second = Number(trigger.value2);

            if (
              !Number.isFinite(second) ||
              first > second
            ) {
              return `Choose a valid conditional range under "${item.prompt}".`;
            }
          }
        }

        if (item.type === "single_choice") {
          const options = (item.config.options ||
            []) as string[];

          if (
            !trigger.value ||
            !options.includes(trigger.value)
          ) {
            return `Choose which response opens the conditional block under "${item.prompt}".`;
          }
        }

        if (item.type === "multiple_choice") {
          const options = (item.config.options ||
            []) as string[];
          const values = trigger.values || [];

          if (
            values.length === 0 ||
            values.some(
              (value) => !options.includes(value)
            )
          ) {
            return `Choose the linked multiple-choice response(s) under "${item.prompt}".`;
          }
        }

        const nestedError = validateItems([
          child.item,
        ]);

        if (nestedError) {
          return nestedError;
        }
      }
    }

    return "";
  }

  for (const schedule of protocol) {
    if (!schedule.label.trim()) {
      return "Every check-in/event needs a name.";
    }

    const trigger =
      schedule.trigger_type || "fixed_time";

    if (
      trigger === "fixed_time" &&
      !schedule.fixed_time
    ) {
      return `${schedule.label} needs a fixed time.`;
    }

    if (
      (trigger === "random_window" ||
        trigger === "interval") &&
      (!schedule.start_time ||
        !schedule.end_time ||
        schedule.start_time >= schedule.end_time)
    ) {
      return `Check the sampling window for ${schedule.label}.`;
    }

    if (
      (trigger === "event_contingent" ||
        trigger === "participant_initiated") &&
      !(schedule.event_title || schedule.label).trim()
    ) {
      return `${schedule.label} needs an event/button title.`;
    }

    if (!schedule.items.length) {
      return `${schedule.label} needs at least one block.`;
    }

    if (countTreeItems(schedule.items) > 80) {
      return `${schedule.label} can contain up to 80 total blocks, including nested conditional blocks.`;
    }

    const itemError = validateItems(
      schedule.items
    );

    if (itemError) {
      return itemError;
    }
  }

  return "";
}

function triggerLabel(
  schedule: AmbulatoryScheduleDraft
) {
  const trigger =
    schedule.trigger_type || "fixed_time";

  if (trigger === "fixed_time") {
    return `Fixed · ${
      schedule.fixed_time ||
      schedule.start_time ||
      "—"
    }`;
  }

  if (trigger === "random_window") {
    return `Random · ${schedule.start_time}–${schedule.end_time}`;
  }

  if (trigger === "interval") {
    return `Interval · every ${
      schedule.interval_minutes || 60
    } min within ${schedule.start_time}–${schedule.end_time}`;
  }

  return `Event · ${
    schedule.event_title ||
    schedule.label
  }`;
}

export function AmbulatoryProtocolBuilder({
  protocol,
  onChange,
  questionnaires,
  context = "research",
}: {
  protocol: AmbulatoryScheduleDraft[];
  onChange: (
    protocol: AmbulatoryScheduleDraft[]
  ) => void;
  questionnaires: AmbulatoryQuestionnaireOption[];
  context?: "research" | "clinical" | "self";
}) {
  const blockTypes: Array<
    [AmbulatoryBlockType, string]
  > = [
    ["slider", "Slider / rating"],
    ["single_choice", "Single choice"],
    ["multiple_choice", "Multiple choice"],
    ["yes_no", "Yes / No"],
    ["number", "Number"],
    ["short_text", "Short text"],
    ["long_text", "Long text"],
    ["mood", "Mood / emotion"],
    ["time_duration", "Time / duration"],
    ["activity", "Activity"],
    [
      "questionnaire",
      "Questionnaire library",
    ],
    [
      "instruction",
      "Instruction / information",
    ],
  ];

  function updateSchedule(
    index: number,
    patch: Partial<AmbulatoryScheduleDraft>
  ) {
    onChange(
      protocol.map((schedule, i) =>
        i === index
          ? {
              ...schedule,
              ...patch,
            }
          : schedule
      )
    );
  }

  function addSchedule(
    trigger_type: AmbulatoryTriggerType =
      "fixed_time"
  ) {
    if (protocol.length >= 20) {
      return;
    }

    const number = protocol.length + 1;

    onChange([
      ...protocol,
      {
        key: ambulatoryDraftKey(
          `checkin-${number}`
        ),
        label:
          trigger_type ===
            "event_contingent" ||
          trigger_type ===
            "participant_initiated"
            ? `Event ${number}`
            : `Check-in ${number}`,
        trigger_type,
        start_time: "12:00",
        end_time: "14:00",
        fixed_time: "13:00",
        interval_minutes: 60,
        response_window_minutes: 45,
        event_title: `Event ${number}`,
        event_description: "",
        maximum_per_day: 8,
        minimum_interval_minutes: 10,
        notification_enabled:
          trigger_type !==
            "event_contingent" &&
          trigger_type !==
            "participant_initiated",
        notification_title:
          "PsyLattice check-in",
        notification_body:
          "Your check-in is ready.",
        items: [
          newAmbulatoryItem("slider", 0),
        ],
      },
    ]);
  }

  function removeSchedule(index: number) {
    if (protocol.length <= 1) {
      return;
    }

    onChange(
      protocol.filter(
        (_, i) => i !== index
      )
    );
  }

  function updateItemByKey(
    scheduleIndex: number,
    itemKey: string,
    patch:
      | Partial<AmbulatoryItemDraft>
      | ((
          item: AmbulatoryItemDraft
        ) => AmbulatoryItemDraft)
  ) {
    const schedule =
      protocol[scheduleIndex];

    const items = mapTreeItem(
      schedule.items,
      itemKey,
      (item) =>
        typeof patch === "function"
          ? patch(item)
          : {
              ...item,
              ...patch,
            }
    );

    updateSchedule(scheduleIndex, {
      items,
    });
  }

  function updateItemConfig(
    scheduleIndex: number,
    itemKey: string,
    nextConfig: Record<string, any>
  ) {
    updateItemByKey(
      scheduleIndex,
      itemKey,
      (item) => {
        const updated = {
          ...item,
          config: nextConfig,
        };

        if (
          !ambulatoryCanHaveConditionalChildren(
            updated.type
          )
        ) {
          return updated;
        }

        return {
          ...updated,
          conditionalChildren: (
            updated.conditionalChildren || []
          ).map((child) => ({
            ...child,
            trigger:
              normaliseAmbulatoryTriggerForParent(
                updated,
                child.trigger
              ),
          })),
        };
      }
    );
  }

  function changeItemType(
    scheduleIndex: number,
    itemKey: string,
    type: AmbulatoryBlockType
  ) {
    const schedule =
      protocol[scheduleIndex];

    const current = findTreeItem(
      schedule.items,
      itemKey
    );

    if (!current) {
      return;
    }

    if (
      (current.conditionalChildren || [])
        .length > 0 &&
      !ambulatoryCanHaveConditionalChildren(
        type
      )
    ) {
      const confirmed = window.confirm(
        "This block contains nested conditional blocks. Changing it to this response type will remove those conditional blocks. Continue?"
      );

      if (!confirmed) {
        return;
      }
    }

    const fresh = newAmbulatoryItem(
      type,
      countTreeItems(schedule.items)
    );

    updateItemByKey(
      scheduleIndex,
      itemKey,
      (item) => ({
        ...item,
        type,
        prompt: fresh.prompt,
        config: fresh.config,
        required: fresh.required,
        conditionalChildren:
          ambulatoryCanHaveConditionalChildren(type)
            ? item.conditionalChildren || []
            : [],
      })
    );
  }

  function addRootItem(
    scheduleIndex: number,
    type: AmbulatoryBlockType
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (
      countTreeItems(schedule.items) >= 80
    ) {
      return;
    }

    updateSchedule(scheduleIndex, {
      items: [
        ...schedule.items,
        newAmbulatoryItem(
          type,
          countTreeItems(schedule.items)
        ),
      ],
    });
  }

  function addConditionalChild(
    scheduleIndex: number,
    parentKey: string
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (
      countTreeItems(schedule.items) >= 80
    ) {
      return;
    }

    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => {
        if (
          !ambulatoryCanHaveConditionalChildren(
            parent.type
          )
        ) {
          return parent;
        }

        return {
          ...parent,
          conditionalChildren: [
            ...(parent.conditionalChildren ||
              []),
            {
              trigger:
                defaultAmbulatoryTrigger(parent),
              item: newAmbulatoryItem(
                "short_text",
                countTreeItems(
                  schedule.items
                )
              ),
            },
          ],
        };
      }
    );
  }

  function removeRootItem(
    scheduleIndex: number,
    itemIndex: number
  ) {
    const schedule =
      protocol[scheduleIndex];

    if (schedule.items.length <= 1) {
      return;
    }

    updateSchedule(scheduleIndex, {
      items: schedule.items.filter(
        (_, index) =>
          index !== itemIndex
      ),
    });
  }

  function removeConditionalChild(
    scheduleIndex: number,
    parentKey: string,
    childKey: string
  ) {
    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => ({
        ...parent,
        conditionalChildren: (
          parent.conditionalChildren || []
        ).filter(
          (child) =>
            child.item.key !== childKey
        ),
      })
    );
  }

  function updateChildTrigger(
    scheduleIndex: number,
    parentKey: string,
    childKey: string,
    trigger: AmbulatoryConditionalTrigger
  ) {
    updateItemByKey(
      scheduleIndex,
      parentKey,
      (parent) => ({
        ...parent,
        conditionalChildren: (
          parent.conditionalChildren || []
        ).map((child) =>
          child.item.key === childKey
            ? {
                ...child,
                trigger:
                  normaliseAmbulatoryTriggerForParent(
                    parent,
                    trigger
                  ),
              }
            : child
        ),
      })
    );
  }

  function renderConditionalTrigger(
    scheduleIndex: number,
    parent: AmbulatoryItemDraft,
    child: AmbulatoryConditionalChild
  ) {
    const trigger =
      normaliseAmbulatoryTriggerForParent(
        parent,
        child.trigger
      );

    if (
      parent.type === "slider" ||
      parent.type === "number"
    ) {
      return (
        <div className="grid gap-3 lg:grid-cols-[210px_1fr] lg:items-end">
          <label>
            <span className="text-xs font-medium text-cyan-950">
              Show this nested block when
            </span>

            <select
              value={trigger.operator}
              onChange={(event) =>
                updateChildTrigger(
                  scheduleIndex,
                  parent.key,
                  child.item.key,
                  {
                    ...trigger,
                    operator:
                      event.target
                        .value as
                        | "gt"
                        | "lt"
                        | "equals"
                        | "between",
                  }
                )
              }
              className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="gt">
                Response is above
              </option>
              <option value="lt">
                Response is below
              </option>
              <option value="equals">
                Response equals
              </option>
              <option value="between">
                Response is within a range
              </option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="text-xs font-medium text-cyan-950">
                {trigger.operator ===
                "between"
                  ? "From"
                  : "Value"}
              </span>

              <input
                type="number"
                min={parent.config.min}
                max={parent.config.max}
                step={
                  parent.config.step ?? 1
                }
                value={
                  trigger.value ?? ""
                }
                onChange={(event) =>
                  updateChildTrigger(
                    scheduleIndex,
                    parent.key,
                    child.item.key,
                    {
                      ...trigger,
                      value:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            {trigger.operator ===
              "between" && (
              <label>
                <span className="text-xs font-medium text-cyan-950">
                  To
                </span>

                <input
                  type="number"
                  min={
                    parent.config.min
                  }
                  max={
                    parent.config.max
                  }
                  step={
                    parent.config.step ??
                    1
                  }
                  value={
                    trigger.value2 ?? ""
                  }
                  onChange={(
                    event
                  ) =>
                    updateChildTrigger(
                      scheduleIndex,
                      parent.key,
                      child.item.key,
                      {
                        ...trigger,
                        value2:
                          event.target
                            .value,
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            )}
          </div>
        </div>
      );
    }

    if (
      parent.type ===
      "single_choice"
    ) {
      const options =
        (parent.config.options ||
          []) as string[];

      return (
        <label className="block">
          <span className="text-xs font-medium text-cyan-950">
            Show this nested block when the participant chooses
          </span>

          <select
            value={trigger.value || ""}
            onChange={(event) =>
              updateChildTrigger(
                scheduleIndex,
                parent.key,
                child.item.key,
                {
                  operator: "equals",
                  value:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">
              Choose linked response…
            </option>

            {options.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (parent.type === "yes_no") {
      return (
        <label className="block">
          <span className="text-xs font-medium text-cyan-950">
            Show this nested block when the participant chooses
          </span>

          <select
            value={
              trigger.value || "Yes"
            }
            onChange={(event) =>
              updateChildTrigger(
                scheduleIndex,
                parent.key,
                child.item.key,
                {
                  operator: "equals",
                  value:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="Yes">
              Yes
            </option>
            <option value="No">
              No
            </option>
          </select>
        </label>
      );
    }

    if (
      parent.type ===
      "multiple_choice"
    ) {
      const options =
        (parent.config.options ||
          []) as string[];
      const selected =
        trigger.values || [];

      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-cyan-950">
                Show this nested block when the participant selects
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Choose one or more linked responses.
              </p>
            </div>

            <select
              value={
                trigger.operator
              }
              onChange={(event) =>
                updateChildTrigger(
                  scheduleIndex,
                  parent.key,
                  child.item.key,
                  {
                    ...trigger,
                    operator:
                      event.target
                        .value as
                        | "contains_any"
                        | "contains_all",
                  }
                )
              }
              className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              <option value="contains_any">
                Any selected response
              </option>
              <option value="contains_all">
                All selected responses
              </option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {options.map(
              (option) => {
                const checked =
                  selected.includes(
                    option
                  );

                return (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                      checked
                        ? "border-cyan-300 bg-cyan-100 text-cyan-950"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(
                        event
                      ) => {
                        const values =
                          event.target
                            .checked
                            ? [
                                ...selected,
                                option,
                              ]
                            : selected.filter(
                                (
                                  value
                                ) =>
                                  value !==
                                  option
                              );

                        updateChildTrigger(
                          scheduleIndex,
                          parent.key,
                          child.item.key,
                          {
                            ...trigger,
                            values,
                          }
                        );
                      }}
                    />

                    {option}
                  </label>
                );
              }
            )}
          </div>
        </div>
      );
    }

    return null;
  }

  function renderItem(
    scheduleIndex: number,
    item: AmbulatoryItemDraft,
    displayPath: string,
    siblingIndex: number,
    siblingCount: number,
    parent: AmbulatoryItemDraft | null,
    childEdge: AmbulatoryConditionalChild | null
  ): ReactNode {
    const nested = parent !== null;

    return (
      <div
        key={item.key}
        className={`rounded-2xl border p-4 ${
          nested
            ? "border-cyan-200 bg-white"
            : "border-slate-200 bg-slate-50/40"
        }`}
      >
        {parent && childEdge && (
          <div className="mb-4 rounded-xl border border-cyan-100 bg-cyan-50/70 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800">
              Conditional block
            </p>

            <p className="mt-1 text-xs text-slate-600">
              This entire block appears only from the response to{" "}
              <span className="font-semibold text-slate-800">
                {parent.prompt}
              </span>
              .
            </p>

            <div className="mt-3">
              {renderConditionalTrigger(
                scheduleIndex,
                parent,
                childEdge
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={item.type}
              onChange={(event) =>
                changeItemType(
                  scheduleIndex,
                  item.key,
                  event.target
                    .value as AmbulatoryBlockType
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
            >
              {blockTypes.map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <span className="text-xs text-slate-400">
              {nested
                ? `Conditional ${displayPath}`
                : `Block ${displayPath}`}
            </span>
          </div>

          <button
            type="button"
            disabled={
              !parent &&
              protocol[
                scheduleIndex
              ].items.length <= 1
            }
            onClick={() => {
              if (parent) {
                removeConditionalChild(
                  scheduleIndex,
                  parent.key,
                  item.key
                );
              } else {
                removeRootItem(
                  scheduleIndex,
                  siblingIndex
                );
              }
            }}
            className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-30"
          >
            Remove
          </button>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-slate-500">
            Prompt / title
          </span>

          <input
            value={item.prompt}
            onChange={(event) =>
              updateItemByKey(
                scheduleIndex,
                item.key,
                {
                  prompt:
                    event.target.value,
                }
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-700"
          />
        </label>

        {(item.type ===
          "single_choice" ||
          item.type ===
            "multiple_choice" ||
          item.type === "mood") && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">
              Options (one per line)
            </span>

            <textarea
              value={(
                item.config.options || []
              ).join("\n")}
              onChange={(event) =>
                updateItemConfig(
                  scheduleIndex,
                  item.key,
                  {
                    ...item.config,
                    options:
                      event.target.value
                        .split("\n")
                        .map((value) =>
                          value.trim()
                        )
                        .filter(Boolean),
                  }
                )
              }
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-cyan-700"
            />
          </label>
        )}

        {item.type === "slider" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["min", "Minimum"],
              ["max", "Maximum"],
              ["step", "Step"],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="text-xs font-medium text-slate-500">
                  {label}
                </span>

                <input
                  type="number"
                  value={
                    item.config[key] ??
                    ""
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        [key]: Number(
                          event.target.value
                        ),
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              </label>
            ))}

            <label>
              <span className="text-xs font-medium text-slate-500">
                Low label
              </span>

              <input
                value={
                  item.config
                    .minLabel || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      minLabel:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                High label
              </span>

              <input
                value={
                  item.config
                    .maxLabel || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      maxLabel:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        )}

        {(item.type === "number" ||
          item.type ===
            "time_duration") && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label>
              <span className="text-xs font-medium text-slate-500">
                Minimum
              </span>

              <input
                type="number"
                value={
                  item.config.min ?? ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      min: Number(
                        event.target.value
                      ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                Maximum
              </span>

              <input
                type="number"
                value={
                  item.config.max ?? ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      max: Number(
                        event.target.value
                      ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                {item.type ===
                "time_duration"
                  ? "Unit"
                  : "Step"}
              </span>

              {item.type ===
              "time_duration" ? (
                <select
                  value={
                    item.config.unit ||
                    "minutes"
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        unit:
                          event.target
                            .value,
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="minutes">
                    Minutes
                  </option>
                  <option value="hours">
                    Hours
                  </option>
                  <option value="seconds">
                    Seconds
                  </option>
                </select>
              ) : (
                <input
                  type="number"
                  value={
                    item.config.step ?? 1
                  }
                  onChange={(event) =>
                    updateItemConfig(
                      scheduleIndex,
                      item.key,
                      {
                        ...item.config,
                        step: Number(
                          event.target.value
                        ),
                      }
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
              )}
            </label>
          </div>
        )}

        {item.type === "activity" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
            <label>
              <span className="text-xs font-medium text-slate-500">
                Activity instructions
              </span>

              <textarea
                value={
                  item.config
                    .instructions || ""
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      instructions:
                        event.target.value,
                    }
                  )
                }
                className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
              />
            </label>

            <label>
              <span className="text-xs font-medium text-slate-500">
                Minutes
              </span>

              <input
                type="number"
                min="1"
                value={
                  item.config
                    .durationMinutes ?? 2
                }
                onChange={(event) =>
                  updateItemConfig(
                    scheduleIndex,
                    item.key,
                    {
                      ...item.config,
                      durationMinutes:
                        Number(
                          event.target.value
                        ),
                    }
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
              />
            </label>
          </div>
        )}

        {item.type === "instruction" && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">
              Instruction text
            </span>

            <textarea
              value={
                item.config.text || ""
              }
              onChange={(event) =>
                updateItemConfig(
                  scheduleIndex,
                  item.key,
                  {
                    ...item.config,
                    text:
                      event.target.value,
                  }
                )
              }
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
            />
          </label>
        )}

        {item.type ===
          "questionnaire" && (
          <label className="mt-4 block">
            <span className="text-xs font-medium text-slate-500">
              Questionnaire
            </span>

            <select
              value={
                item.config
                  .questionnaire_id || ""
              }
              onChange={(event) => {
                const selected =
                  questionnaires.find(
                    (questionnaire) =>
                      questionnaire.questionnaire_id ===
                      event.target.value
                  );

                updateItemConfig(
                  scheduleIndex,
                  item.key,
                  {
                    ...item.config,
                    questionnaire_id:
                      event.target.value,
                    questionnaire_name:
                      selected?.questionnaire_name ||
                      "",
                    questionnaire_acronym:
                      selected?.questionnaire_acronym ||
                      "",
                    questionnaire_source:
                      selected?.source_type ||
                      "",
                  }
                );
              }}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">
                Choose questionnaire…
              </option>

              {questionnaires.map(
                (questionnaire) => (
                  <option
                    key={
                      questionnaire.questionnaire_id
                    }
                    value={
                      questionnaire.questionnaire_id
                    }
                  >
                    {questionnaire.is_owned_by_user
                      ? "My questionnaire · "
                      : ""}
                    {questionnaire.questionnaire_acronym
                      ? `${questionnaire.questionnaire_acronym} — ${questionnaire.questionnaire_name}`
                      : questionnaire.questionnaire_name}
                  </option>
                )
              )}
            </select>

            {item.config.questionnaire_id && (
              <p className="mt-2 text-xs text-slate-500">
                This references the saved questionnaire and does not copy/edit its standardized items inside the ambulatory builder.
              </p>
            )}
          </label>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-200 pt-4">
          {item.type !==
            "instruction" && (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={item.required}
                onChange={(event) =>
                  updateItemByKey(
                    scheduleIndex,
                    item.key,
                    {
                      required:
                        event.target
                          .checked,
                    }
                  )
                }
              />

              Required when shown
            </label>
          )}
        </div>

        {ambulatoryCanHaveConditionalChildren(
          item.type
        ) && (
          <div className="mt-5 rounded-xl border border-dashed border-cyan-200 bg-cyan-50/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-cyan-950">
                  Conditional follow-up blocks
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add a complete new block inside this response. It appears only when the response rule you choose is met.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  countTreeItems(
                    protocol[
                      scheduleIndex
                    ].items
                  ) >= 80
                }
                onClick={() =>
                  addConditionalChild(
                    scheduleIndex,
                    item.key
                  )
                }
                className="rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-xs font-semibold text-cyan-900 transition hover:bg-cyan-50 disabled:opacity-40"
              >
                + Add conditional block
              </button>
            </div>
          </div>
        )}

        {(item.conditionalChildren || [])
          .length > 0 && (
          <div className="mt-5 border-l-2 border-cyan-200 pl-4">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-800">
                Nested under {item.prompt}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Every nested block is a complete question/activity and can itself contain further conditional blocks.
              </p>
            </div>

            <div className="space-y-4">
              {(
                item.conditionalChildren ||
                []
              ).map(
                (child, childIndex) =>
                  renderItem(
                    scheduleIndex,
                    child.item,
                    `${displayPath}.${
                      childIndex + 1
                    }`,
                    childIndex,
                    (
                      item.conditionalChildren ||
                      []
                    ).length,
                    item,
                    child
                  )
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
        <p className="text-sm font-semibold text-cyan-950">
          Unified PsyLattice Ambulatory Builder
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-600">
          The same protocol engine is used for Research and Clinical workspaces. Research protocols remain study/pseudonymous records; Clinical protocols remain client-controlled records.
        </p>
      </div>

      {protocol.map(
        (schedule, scheduleIndex) => {
          const trigger =
            schedule.trigger_type ||
            "fixed_time";

          const eventLike =
            trigger ===
              "event_contingent" ||
            trigger ===
              "participant_initiated";

          return (
            <section
              key={schedule.key}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                      {eventLike
                        ? "Event contingent"
                        : "Time contingent"}
                    </span>

                    <span className="text-xs text-slate-400">
                      {triggerLabel(
                        schedule
                      )}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_240px]">
                    <label>
                      <span className="text-xs font-medium text-slate-500">
                        Check-in / event title
                      </span>

                      <input
                        value={
                          schedule.label
                        }
                        onChange={(event) =>
                          updateSchedule(
                            scheduleIndex,
                            {
                              label:
                                event.target
                                  .value,
                            }
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      />
                    </label>

                    <label>
                      <span className="text-xs font-medium text-slate-500">
                        Trigger
                      </span>

                      <select
                        value={trigger}
                        onChange={(event) => {
                          const next =
                            event.target
                              .value as AmbulatoryTriggerType;

                          updateSchedule(
                            scheduleIndex,
                            {
                              trigger_type:
                                next,
                              notification_enabled:
                                next !==
                                  "event_contingent" &&
                                next !==
                                  "participant_initiated",
                            }
                          );
                        }}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                      >
                        <option value="fixed_time">
                          Fixed time
                        </option>
                        <option value="random_window">
                          Random within window
                        </option>
                        <option value="interval">
                          Interval contingent
                        </option>
                        <option value="event_contingent">
                          Event contingent
                        </option>
                        <option value="participant_initiated">
                          Participant/client initiated
                        </option>
                      </select>
                    </label>
                  </div>

                  {trigger ===
                    "fixed_time" && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Check-in time
                        </span>
                        <input
                          type="time"
                          value={
                            schedule.fixed_time ||
                            schedule.start_time
                          }
                          onChange={(event) =>
                            updateSchedule(
                              scheduleIndex,
                              {
                                fixed_time:
                                  event.target
                                    .value,
                                start_time:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Response window (minutes)
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={
                            schedule.response_window_minutes ??
                            60
                          }
                          onChange={(event) =>
                            updateSchedule(
                              scheduleIndex,
                              {
                                response_window_minutes:
                                  Number(
                                    event.target
                                      .value
                                  ),
                              }
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </label>
                    </div>
                  )}

                  {(trigger ===
                    "random_window" ||
                    trigger ===
                      "interval") && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Window starts
                        </span>
                        <input
                          type="time"
                          value={
                            schedule.start_time
                          }
                          onChange={(event) =>
                            updateSchedule(
                              scheduleIndex,
                              {
                                start_time:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Window ends
                        </span>
                        <input
                          type="time"
                          value={
                            schedule.end_time
                          }
                          onChange={(event) =>
                            updateSchedule(
                              scheduleIndex,
                              {
                                end_time:
                                  event.target
                                    .value,
                              }
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </label>

                      {trigger ===
                        "interval" && (
                        <label>
                          <span className="text-xs font-medium text-slate-500">
                            Every (minutes)
                          </span>
                          <input
                            type="number"
                            min="5"
                            value={
                              schedule.interval_minutes ??
                              60
                            }
                            onChange={(
                              event
                            ) =>
                              updateSchedule(
                                scheduleIndex,
                                {
                                  interval_minutes:
                                    Number(
                                      event
                                        .target
                                        .value
                                    ),
                                }
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                          />
                        </label>
                      )}

                      <label>
                        <span className="text-xs font-medium text-slate-500">
                          Response window (minutes)
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={
                            schedule.response_window_minutes ??
                            45
                          }
                          onChange={(event) =>
                            updateSchedule(
                              scheduleIndex,
                              {
                                response_window_minutes:
                                  Number(
                                    event.target
                                      .value
                                  ),
                              }
                            )
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        />
                      </label>
                    </div>
                  )}

                  {eventLike && (
                    <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <label>
                          <span className="text-xs font-medium text-slate-500">
                            Button / event name
                          </span>
                          <input
                            value={
                              schedule.event_title ||
                              schedule.label
                            }
                            onChange={(event) =>
                              updateSchedule(
                                scheduleIndex,
                                {
                                  event_title:
                                    event.target
                                      .value,
                                }
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
                          />
                        </label>

                        <label>
                          <span className="text-xs font-medium text-slate-500">
                            Maximum reports / day
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={
                              schedule.maximum_per_day ??
                              8
                            }
                            onChange={(event) =>
                              updateSchedule(
                                scheduleIndex,
                                {
                                  maximum_per_day:
                                    Number(
                                      event.target
                                        .value
                                    ),
                                }
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
                          />
                        </label>

                        <label>
                          <span className="text-xs font-medium text-slate-500">
                            Minimum minutes between reports
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={
                              schedule.minimum_interval_minutes ??
                              10
                            }
                            onChange={(event) =>
                              updateSchedule(
                                scheduleIndex,
                                {
                                  minimum_interval_minutes:
                                    Number(
                                      event.target
                                        .value
                                    ),
                                }
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-cyan-200 bg-white px-3 py-2.5 text-sm"
                          />
                        </label>

                        <label className="md:col-span-2">
                          <span className="text-xs font-medium text-slate-500">
                            Participant/client explanation
                          </span>
                          <textarea
                            value={
                              schedule.event_description ||
                              ""
                            }
                            onChange={(event) =>
                              updateSchedule(
                                scheduleIndex,
                                {
                                  event_description:
                                    event.target
                                      .value,
                                }
                              )
                            }
                            placeholder="For example: Tap this whenever you experience a panic episode."
                            className="mt-2 min-h-20 w-full rounded-xl border border-cyan-200 bg-white p-3 text-sm"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {!eventLike && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={
                            schedule.notification_enabled ??
                            true
                          }
                          onChange={(event) =>
                            updateSchedule(
                              scheduleIndex,
                              {
                                notification_enabled:
                                  event.target
                                    .checked,
                              }
                            )
                          }
                          className="mt-1"
                        />

                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Send an email reminder
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            PsyLattice emails this reminder when the time-contingent check-in becomes available. Event-contingent check-ins are not emailed on a clock schedule.
                          </p>
                        </div>
                      </label>

                      {schedule.notification_enabled && (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <label>
                            <span className="text-xs font-medium text-slate-500">
                              Email subject
                            </span>
                            <input
                              value={
                                schedule.notification_title ||
                                `${schedule.label} check-in`
                              }
                              onChange={(event) =>
                                updateSchedule(
                                  scheduleIndex,
                                  {
                                    notification_title:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                            />
                          </label>

                          <label>
                            <span className="text-xs font-medium text-slate-500">
                              Email message
                            </span>
                            <input
                              value={
                                schedule.notification_body ||
                                "Your PsyLattice check-in is ready."
                              }
                              onChange={(event) =>
                                updateSchedule(
                                  scheduleIndex,
                                  {
                                    notification_body:
                                      event.target
                                        .value,
                                  }
                                )
                              }
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    protocol.length <= 1
                  }
                  onClick={() =>
                    removeSchedule(
                      scheduleIndex
                    )
                  }
                  className="rounded-xl border border-red-200 bg-white px-3 py-2.5 text-xs font-semibold text-red-700 disabled:opacity-30"
                >
                  Remove check-in
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {schedule.items.map(
                  (item, itemIndex) =>
                    renderItem(
                      scheduleIndex,
                      item,
                      String(
                        itemIndex + 1
                      ),
                      itemIndex,
                      schedule.items
                        .length,
                      null,
                      null
                    )
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <span className="text-xs font-medium text-slate-500">
                  Add block:
                </span>

                {blockTypes.map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={
                        countTreeItems(
                          schedule.items
                        ) >= 80
                      }
                      onClick={() =>
                        addRootItem(
                          scheduleIndex,
                          value
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 disabled:opacity-40"
                    >
                      + {label}
                    </button>
                  )
                )}
              </div>
            </section>
          );
        }
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            addSchedule("fixed_time")
          }
          className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-900"
        >
          + Time-contingent check-in
        </button>

        <button
          type="button"
          onClick={() =>
            addSchedule(
              "event_contingent"
            )
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
        >
          + Event-contingent check-in
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Context
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {context === "research"
            ? "Research protocols are deployed to pseudonymous study participants through study links."
            : context === "clinical"
              ? "Clinical protocols are suggestions to a connected client; the client may review/customise them before activation."
              : "Self protocols belong to the user and can be customised directly."}
        </p>
      </div>
    </div>
  );
}
