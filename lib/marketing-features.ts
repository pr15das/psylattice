export type MarketingFeatureStatus = "Available";

export type MarketingFeature = {
  slug: string;
  number: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  description: string;
  outcome: string;
  icon:
    | "flask"
    | "brain"
    | "activity"
    | "watch"
    | "chart"
    | "file"
    | "phone";
  visual:
    | "study-builder"
    | "cognitive"
    | "ambulatory"
    | "wearables"
    | "analysis"
    | "thesis"
    | "participant";
  status: MarketingFeatureStatus;
  capabilities: string[];
  steps: Array<{ title: string; description: string }>;
  connectsTo: string[];
};

export const marketingFeatures: MarketingFeature[] = [
  {
    slug: "study-builder",
    number: "01",
    eyebrow: "Study design",
    title: "Study Builder",
    shortTitle: "Study Builder",
    description:
      "Turn a research question into a structured study with consent, demographics, questionnaires, cognitive tasks, ambulatory protocols and participant flow in one workspace.",
    outcome: "Design the protocol once, then keep every downstream research step connected to it.",
    icon: "flask",
    visual: "study-builder",
    status: "Available",
    capabilities: [
      "Consent and demographic configuration",
      "Questionnaire Library and custom measures",
      "Cognitive-task attachments",
      "Ambulatory and follow-up protocols",
      "TEST and LIVE participant-link workflow",
      "Researcher-facing study status and monitoring",
    ],
    steps: [
      {
        title: "Define",
        description: "Create the study, research context, consent and participant-facing structure.",
      },
      {
        title: "Assemble",
        description: "Add questionnaires, cognitive tasks, EMA / ESM and follow-up components.",
      },
      {
        title: "Test",
        description: "Use TEST participants to inspect the experience before exposing live research data.",
      },
      {
        title: "Launch",
        description: "Create a LIVE participant link and keep recruitment, data and analysis attached to the same study.",
      },
    ],
    connectsTo: ["cognitive-lab", "ambulatory", "participant-companion", "analysis-lab"],
  },
  {
    slug: "cognitive-lab",
    number: "02",
    eyebrow: "Experimental psychology",
    title: "Cognitive Lab",
    shortTitle: "Cognitive Lab",
    description:
      "Build and deploy reaction-time and cognitive tasks without maintaining a separate experiment stack. Keep trial-level performance connected to the rest of the study.",
    outcome: "Questionnaires, cognition and real-world measurement can belong to the same research protocol.",
    icon: "brain",
    visual: "cognitive",
    status: "Available",
    capabilities: [
      "Template-based cognitive tasks",
      "Configurable trial structure",
      "Reaction-time and accuracy outcomes",
      "Practice and test blocks",
      "Task attachment to PsyLattice studies",
      "Analysis-ready cognitive variables",
    ],
    steps: [
      {
        title: "Choose a paradigm",
        description: "Start from a supported task pattern or configure a task around your hypothesis.",
      },
      {
        title: "Configure trials",
        description: "Set timing, stimuli, response behavior, practice and experimental blocks.",
      },
      {
        title: "Deploy",
        description: "Attach the task to a study and let participants complete it in the same research flow.",
      },
      {
        title: "Analyse",
        description: "Move reaction time, accuracy and derived variables directly into Analysis Lab.",
      },
    ],
    connectsTo: ["study-builder", "analysis-lab", "participant-companion", "thesis-builder"],
  },
  {
    slug: "ambulatory",
    number: "03",
    eyebrow: "Real-world research",
    title: "EMA / ESM & ambulatory assessment",
    shortTitle: "EMA / ESM",
    description:
      "Schedule repeated prompts and longitudinal check-ins so psychological measurement follows daily life instead of relying only on retrospective snapshots.",
    outcome: "Capture change across moments, days and contexts while keeping every response tied to the study timeline.",
    icon: "activity",
    visual: "ambulatory",
    status: "Available",
    capabilities: [
      "Time-contingent prompting",
      "Event-contingent workflows",
      "Repeated daily assessment windows",
      "Longitudinal follow-up",
      "Participant reminders and completion tracking",
      "Study-linked ambulatory data",
    ],
    steps: [
      {
        title: "Define windows",
        description: "Choose when participants should receive prompts or complete repeated measurements.",
      },
      {
        title: "Attach content",
        description: "Connect questionnaires, brief ratings, cognitive tasks or follow-up items.",
      },
      {
        title: "Notify",
        description: "Use the participant experience to surface the right task at the right scheduled moment.",
      },
      {
        title: "Track change",
        description: "Review repeated measures across participants and bring them into longitudinal analysis.",
      },
    ],
    connectsTo: ["participant-companion", "wearables", "analysis-lab", "study-builder"],
  },
  {
    slug: "wearables",
    number: "04",
    eyebrow: "Context-aware measurement",
    title: "Wearables & sensor-contingent research",
    shortTitle: "Wearables + sensors",
    description:
      "Bring supported Android health and wearable context into research workflows and configure sensor-contingent rules for participant prompts where device capabilities permit.",
    outcome: "Move beyond clock-only sampling and study what is happening around the moment a participant is prompted.",
    icon: "watch",
    visual: "wearables",
    status: "Available",
    capabilities: [
      "Android Health Connect integration",
      "Supported sleep, steps, exercise and physiological context",
      "Wear OS Health Services pathway",
      "Threshold, duration and freshness rules",
      "Cooldowns and maximum-trigger safeguards",
      "Permission-aware participant controls",
    ],
    steps: [
      {
        title: "Connect",
        description: "The participant grants the relevant Android health or wearable permissions.",
      },
      {
        title: "Evaluate context",
        description: "Supported device data is checked against the study's configured rule and freshness requirements.",
      },
      {
        title: "Trigger",
        description: "When a valid condition is met, PsyLattice can surface the assigned participant task.",
      },
      {
        title: "Record provenance",
        description: "Keep the trigger source and research response connected for later analysis.",
      },
    ],
    connectsTo: ["ambulatory", "participant-companion", "analysis-lab", "study-builder"],
  },
  {
    slug: "analysis-lab",
    number: "05",
    eyebrow: "Statistics",
    title: "Analysis Lab",
    shortTitle: "Analysis Lab",
    description:
      "Move from collected research data to descriptives, inference, models and publication-ready outputs without leaving the study environment.",
    outcome: "The analysis workspace knows the structure of the PsyLattice study that produced the data.",
    icon: "chart",
    visual: "analysis",
    status: "Available",
    capabilities: [
      "Descriptives and distributions",
      "Correlations and regression",
      "Effect sizes",
      "ANOVA / general linear workflows",
      "Generalized and mixed-model workflows",
      "AI-assisted interpretation and teaching",
    ],
    steps: [
      {
        title: "Select data",
        description: "Open study-linked variables and inspect distributions, missingness and structure.",
      },
      {
        title: "Choose an analysis",
        description: "Run the test or model that matches the research design.",
      },
      {
        title: "Inspect outputs",
        description: "Review tables, graphs, diagnostics and effect estimates in the same workspace.",
      },
      {
        title: "Continue writing",
        description: "Carry the result into Thesis Builder while preserving the context of the analysis.",
      },
    ],
    connectsTo: ["thesis-builder", "cognitive-lab", "ambulatory", "study-builder"],
  },
  {
    slug: "thesis-builder",
    number: "06",
    eyebrow: "Research writing + AI",
    title: "Thesis Builder & contextual AI",
    shortTitle: "Thesis Builder + AI",
    description:
      "Write the thesis or research report in a workspace where AI can be granted explicit access to the study context, analysis outputs and document when the researcher chooses.",
    outcome: "Less copy-pasting between disconnected tools; more assistance that understands what you are actually working on.",
    icon: "file",
    visual: "thesis",
    status: "Available",
    capabilities: [
      "Structured research-writing workspace",
      "Permission-controlled document access",
      "Study-aware AI assistance",
      "Analysis-to-writing workflow",
      "Formatting-oriented writing support",
      "Model switcher with plan-aware access",
    ],
    steps: [
      {
        title: "Write",
        description: "Keep the thesis or report inside the same research environment.",
      },
      {
        title: "Grant context deliberately",
        description: "Choose whether AI may read the active document and relevant PsyLattice context.",
      },
      {
        title: "Ask in plain language",
        description: "Get help with structure, interpretation, explanation and research workflow without rebuilding context in every prompt.",
      },
      {
        title: "Stay in control",
        description: "The researcher reviews, edits and decides what enters the final document.",
      },
    ],
    connectsTo: ["analysis-lab", "study-builder", "cognitive-lab", "ambulatory"],
  },
  {
    slug: "participant-companion",
    number: "07",
    eyebrow: "Mobile participation",
    title: "Participant Companion",
    shortTitle: "Participant app",
    description:
      "A lightweight mobile dashboard for study participation, push notifications, task deep-links, ambulatory schedules and permission-based wearable context.",
    outcome: "Participants get one clear place to see what is due, what is complete and what needs attention.",
    icon: "phone",
    visual: "participant",
    status: "Available",
    capabilities: [
      "Join by participant link or pairing flow",
      "Today / upcoming / completed study tasks",
      "Push notifications with task deep-links",
      "Questionnaire and cognitive-task launch",
      "EMA / ESM schedule visibility",
      "Health Connect and Wear OS research context",
    ],
    steps: [
      {
        title: "Join",
        description: "Pair the app with a PsyLattice study through the participant flow.",
      },
      {
        title: "See today's work",
        description: "The dashboard prioritizes tasks, schedules and study progress.",
      },
      {
        title: "Respond from notifications",
        description: "Push notifications can deep-link participants into the exact assigned task.",
      },
      {
        title: "Sync securely",
        description: "Completed research activity is returned to the connected PsyLattice study.",
      },
    ],
    connectsTo: ["ambulatory", "wearables", "cognitive-lab", "study-builder"],
  },
];

export function getMarketingFeature(slug: string) {
  return marketingFeatures.find((feature) => feature.slug === slug) ?? null;
}
