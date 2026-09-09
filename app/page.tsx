"use client";

import {
  Fragment,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Database,
  FileDown,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Lock,
  MessageSquare,
  MonitorSmartphone,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type Workspace = "self" | "researcher" | "clinician";

type TourSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  note?: string;
};

type TourConfig = {
  workspace: Workspace;
  label: string;
  shortLabel: string;
  destination: string;
  slides: TourSlide[];
};

const tourConfigs: Record<Workspace, TourConfig> = {
  self: {
    workspace: "self",
    label: "PsyLattice Self",
    shortLabel: "Self",
    destination: "/self",
    slides: [
      {
        id: "dashboard",
        eyebrow: "Your overview",
        title: "Dashboard",
        description:
          "Your personal overview brings together your clinician connection, assessments, monitoring activity and what needs your attention today.",
        note:
          "Connecting with a clinician does not automatically give them access to everything in Self.",
      },
      {
        id: "ai",
        eyebrow: "Explore",
        title: "AI Guide",
        description:
          "Explore psychological concepts, think about what you may want to assess and reflect on patterns you have noticed.",
        note:
          "AI conversations stay outside clinician-sharing permissions.",
      },
      {
        id: "assessments",
        eyebrow: "Measure",
        title: "Self-Assessments",
        description:
          "Browse supported measures, complete structured self-assessments and revisit previous results.",
      },
      {
        id: "monitoring",
        eyebrow: "Observe",
        title: "Daily Monitoring",
        description:
          "Capture experiences repeatedly using scheduled, event-based or participant-initiated check-ins.",
      },
      {
        id: "regulation",
        eyebrow: "Act",
        title: "Self-Regulation",
        description:
          "Create small, trackable routines and follow completion across time.",
      },
      {
        id: "progress",
        eyebrow: "Understand",
        title: "Progress",
        description:
          "See how assessments, monitoring and other tracked information change over time.",
      },
      {
        id: "wearables",
        eyebrow: "Optional context",
        title: "Wearables",
        description:
          "Add optional behavioural or physiological context when wearable integrations are available.",
      },
      {
        id: "appointments",
        eyebrow: "Connected care",
        title: "Appointments",
        description:
          "See appointments with your current clinician and send appointment requests through PsyLattice.",
      },
      {
        id: "messages",
        eyebrow: "Connected care",
        title: "Messages",
        description:
          "Use PsyLattice for private, non-emergency communication with your current clinician.",
      },
      {
        id: "privacy",
        eyebrow: "You stay in control",
        title: "Privacy & Sharing",
        description:
          "Choose exactly which categories of Self information your current clinician can access.",
        note:
          "You can change permissions or disconnect your clinician at any time.",
      },
    ],
  },
  researcher: {
    workspace: "researcher",
    label: "PsyLattice Research",
    shortLabel: "Research",
    destination: "/researcher",
    slides: [
      { id: "dashboard", eyebrow: "Research overview", title: "Dashboard", description: "Start with a live overview of your research workspace, then move through the dashboard feature groups one by one." },
      { id: "studies", eyebrow: "Research home", title: "Studies", description: "Browse every study in your workspace, filter by status, reopen drafts and track participant capacity from one place." },
      { id: "study-builder", eyebrow: "Design your protocol", title: "Study Builder", description: "Choose exactly what belongs in your study — consent, demographics, questionnaires, cognitive tasks, ambulatory assessments, follow-ups, wearables and more." },
      { id: "questionnaires", eyebrow: "Research measures", title: "Questionnaire Library", description: "Find research measures, inspect administration and licensing information, or build your own questionnaire with configurable item types, scoring and publication controls." },
      { id: "cognitive-lab", eyebrow: "Experimental psychology", title: "Cognitive Lab", description: "Start with real cognitive paradigms and customise the protocol, timing, trials and outputs for your own experiment.", note: "Cognitive tasks can be embedded directly inside PsyLattice studies alongside questionnaires and longitudinal assessments." },
      { id: "thesis-builder", eyebrow: "Research writing", title: "Thesis Builder", description: "Organise research documents, write in a full academic editor and bring analysis output into your manuscript without leaving PsyLattice.", note: "Writing AI assists with explanation, structure and revision while your documents remain researcher-owned." },
      { id: "ambulatory", eyebrow: "EMA / ESM", title: "Ambulatory Assessment", description: "Build repeated real-world assessments using scheduled check-ins, response windows, reminders, ratings and conditional follow-up blocks." },
      { id: "participants", eyebrow: "Recruit & monitor", title: "Participants", description: "Track enrolled participants, consent, study status and completion across questionnaires, cognitive tasks and repeated assessments." },
      { id: "participant-links", eyebrow: "Deploy your study", title: "Participant Links", description: "Create secure participant-facing study links while keeping participants completely outside the Researcher workspace." },
      { id: "data-dashboard", eyebrow: "Monitor collection", title: "Data Dashboard", description: "Watch live participant activity, completed questionnaires, cognitive-task runs and transparent data-quality checks." },
      { id: "data-explorer", eyebrow: "Inspect your dataset", title: "Data Explorer", description: "Inspect participant-level records, questionnaire responses and cognitive-task summaries before formal analysis." },
      { id: "analysis-lab", eyebrow: "Deterministic statistics", title: "Analysis Lab", description: "Explore, compare and model your data using deterministic statistical workflows, including power analysis, effect sizes and model diagnostics.", note: "PsyLattice computes the statistics. Analysis AI explains verified results rather than inventing the calculations." },
      { id: "export", eyebrow: "Reproducible research", title: "Export Data", description: "Preview exactly what will leave PsyLattice and generate analysis-ready, statistics-compatible or lossless archival workbooks." },
      { id: "plans-billing", eyebrow: "Research capacity", title: "Plans & Billing", description: "Manage study capacity, participant allowances, AI credits, model access, media storage and optional research add-ons." },
      { id: "research-ai", eyebrow: "AI across PsyLattice", title: "AI Model Switcher", description: "Use PsyLattice Auto or choose another available model without leaving the research workflow you are currently working in.", note: "Model availability follows your plan and AI allowance." },
    ],
  },
  clinician: {
    workspace: "clinician",
    label: "PsyLattice Clinical",
    shortLabel: "Clinical",
    destination: "/clinician",
    slides: [
      {
        id: "clients",
        eyebrow: "Clinical home",
        title: "Clients",
        description:
          "Your Clinical workspace centres on connected clients and each active clinician-client relationship.",
      },
      {
        id: "client-overview",
        eyebrow: "Connected client",
        title: "Client Overview",
        description:
          "Open a client to work with authorised assessment, monitoring, progress and clinical information.",
      },
      {
        id: "assessments",
        eyebrow: "Measure",
        title: "Assessments",
        description:
          "Assign measures and review assessment information available within the active client relationship.",
      },
      {
        id: "monitoring",
        eyebrow: "Observe",
        title: "Monitoring",
        description:
          "Propose real-world monitoring protocols and review information the client has chosen to share.",
      },
      {
        id: "progress",
        eyebrow: "Longitudinal view",
        title: "Progress",
        description:
          "Review authorised information across time rather than relying on isolated appointments or single scores.",
      },
      {
        id: "care-pathway",
        eyebrow: "Plan",
        title: "Care Pathway",
        description:
          "Organise goals, actions, reviews and the evolving structure of professional work.",
      },
      {
        id: "notes",
        eyebrow: "Professional workspace",
        title: "Professional Notes",
        description:
          "Keep clinician-authored notes organised in private folders and professional records.",
      },
      {
        id: "appointments",
        eyebrow: "Practice workflow",
        title: "Appointments",
        description:
          "Schedule appointments, review client requests and keep client-visible information separate from private notes.",
      },
      {
        id: "messages",
        eyebrow: "Communication",
        title: "Secure Messages",
        description:
          "Use PsyLattice for private, non-emergency communication with currently connected clients.",
      },
      {
        id: "receptionist",
        eyebrow: "Optional administration",
        title: "Receptionist Access",
        description:
          "Give a receptionist appointment-management access without exposing confidential clinical areas.",
      },
    ],
  },
};

type TourCapability = {
  title: string;
  description: string;
};

type TourFeatureDetails = {
  capabilities: TourCapability[];
  takeaway?: string;
};

const researchTourDetails: Record<string, TourFeatureDetails> = {
  dashboard: {
    capabilities: [
      { title: "See the whole research workspace", description: "The dashboard brings study activity, recruitment, status signals and common actions into one starting view." },
    ],
    takeaway: "The dashboard is the orientation layer for the Research workspace — it tells you what is happening before you open a specific study or dataset.",
  },
  studies: {
    capabilities: [
      { title: "Manage the full study lifecycle", description: "Keep drafts, active studies, completed projects and archived work organised in one research home." },
      { title: "See recruitment at a glance", description: "Participant counts and study status stay visible without opening every project individually." },
      { title: "Return to work instantly", description: "Filter, search and reopen any saved study exactly where you left it." },
    ],
    takeaway: "Studies is the starting point for every research project you create in PsyLattice.",
  },
  "study-builder": {
    capabilities: [
      { title: "Build a modular protocol", description: "Combine consent, demographics, questionnaires, cognitive tasks, EMA, follow-ups, wearables and uploads." },
      { title: "Let the workflow adapt", description: "PsyLattice changes the remaining setup steps automatically based on the components you include." },
      { title: "Keep design decisions explicit", description: "Study safeguards make important consent, identifier and protocol choices visible while you build." },
    ],
    takeaway: "The Study Builder turns a research idea into a deployable participant flow.",
  },
  questionnaires: {
    capabilities: [
      { title: "Use measures responsibly", description: "Search the catalogue, inspect research details and check the recorded licence or usage status before deployment." },
      { title: "Build original instruments", description: "Create questionnaires from configurable item types, blocks, media, branching and randomisation controls." },
      { title: "Keep ownership explicit", description: "Choose whether an original instrument stays private, is published freely, or requires permission, with rights confirmation before saving." },
    ],
    takeaway: "Questionnaire Library combines measure discovery, usage-rights visibility and a flexible original-instrument builder in one research workflow.",
  },
  "cognitive-lab": {
    capabilities: [
      { title: "Start from real paradigms", description: "Use study-ready templates for reaction time, inhibition, vigilance, working memory and related constructs." },
      { title: "Customise the experiment", description: "Edit task timing, trial structure, stimuli, responses and protocol details instead of starting from zero." },
      { title: "Collect analysis-ready outputs", description: "Each task exposes meaningful performance measures such as accuracy, reaction time, errors and omissions." },
    ],
    takeaway: "Cognitive Lab brings experimental psychology directly into the same study workflow as questionnaires and longitudinal data.",
  },
  "thesis-builder": {
    capabilities: [
      { title: "Keep research writing organised", description: "Store manuscripts, folders and supporting documents inside a dedicated researcher-owned workspace." },
      { title: "Write with academic controls", description: "Use a full editor with formatting, margins, fonts, imports, exports and structured research documents." },
      { title: "Bring results into the manuscript", description: "Move tables and interpretations from your research workflow into the thesis without rebuilding them manually." },
    ],
    takeaway: "Writing AI can assist with structure and explanation when document access is permitted, while the researcher stays in control.",
  },
  ambulatory: {
    capabilities: [
      { title: "Measure people in daily life", description: "Create time-contingent, event-contingent and participant-initiated assessments outside the lab." },
      { title: "Control when responses happen", description: "Set schedules, response windows, reminders and repeated check-ins across days or weeks." },
      { title: "Build adaptive questions", description: "Use ratings, yes/no items and conditional follow-up blocks to make protocols responsive to participant answers." },
    ],
    takeaway: "Ambulatory Assessment is built for EMA, ESM and other repeated-measures designs where within-person change matters.",
  },
  participants: {
    capabilities: [
      { title: "Monitor enrolment", description: "See who has joined the study and whether each participant is active, completed or still pending." },
      { title: "Track completion", description: "Follow consent, questionnaires, cognitive tasks and other study components participant by participant." },
      { title: "Keep research identities separate", description: "Work with participant IDs and study records without exposing participants to the Researcher workspace." },
    ],
    takeaway: "Participants gives you the operational view of how your sample is progressing through the study.",
  },
  "participant-links": {
    capabilities: [
      { title: "Create secure recruitment routes", description: "Generate token-based participant links for saved PsyLattice studies." },
      { title: "Separate test and live collection", description: "Keep testing records distinguishable from actual research participation before launch." },
      { title: "Control deployment", description: "Open, pause or reactivate recruitment links while keeping the researcher environment private." },
    ],
    takeaway: "Participant Links is where a finished protocol becomes something participants can actually enter.",
  },
  "data-dashboard": {
    capabilities: [
      { title: "Watch collection as it happens", description: "See live participant counts, responses, completed questionnaires and cognitive-task runs." },
      { title: "Check completeness early", description: "Spot missing required measures, demographics or consent before analysis begins." },
      { title: "Keep quality checks transparent", description: "TEST records and direct-identifier fields are surfaced explicitly rather than silently mixed into the main metrics." },
    ],
    takeaway: "The Data Dashboard is your study-health view before you move into inspection and statistics.",
  },
  "data-explorer": {
    capabilities: [
      { title: "Inspect the actual stored dataset", description: "Browse participant, demographic, questionnaire, consent and task records directly." },
      { title: "Choose the right data view", description: "Switch datasets, search variables and decide whether TEST data or direct identifiers should be visible." },
      { title: "Review task performance", description: "See cognitive summaries such as completion, accuracy, mean RT, median RT and omissions alongside participant data." },
    ],
    takeaway: "Data Explorer lets you understand what was collected before committing to an analysis or export.",
  },
  "analysis-lab": {
    capabilities: [
      { title: "Run deterministic statistics", description: "PsyLattice performs the calculations from the selected dataset rather than asking an AI model to invent numerical results." },
      { title: "Move from exploration to modelling", description: "Use dedicated Explore, Compare, Model, Scales and Design workflows for different research questions." },
      { title: "Plan and interpret responsibly", description: "Power, effect sizes, assumptions, diagnostics and saved results stay connected to the analysis context." },
    ],
    takeaway: "Analysis AI explains verified output and helps you reason about it; the statistical engine remains deterministic.",
  },
  export: {
    capabilities: [
      { title: "Export for the job you are doing", description: "Choose a complete archive, thesis workbook, statistics-ready file or lossless raw-data package." },
      { title: "Preview before download", description: "See the sample, privacy settings, sheet structure and row counts before a workbook is generated." },
      { title: "Preserve reproducibility", description: "Clean analysis sheets can sit alongside raw observations, manifests and documentation in the same export." },
    ],
    takeaway: "Export Data makes the structure and privacy consequences of an export visible before the file leaves PsyLattice.",
  },
  "plans-billing": {
    capabilities: [
      { title: "Match capacity to the project", description: "Compare participant allowances and study limits across free, per-study, monthly and annual options." },
      { title: "Understand AI access", description: "See how AI credits and model choice change with the selected plan." },
      { title: "Add capacity when needed", description: "Participant expansion, media storage, notification emails and AI add-ons can extend a plan without redesigning the study." },
    ],
    takeaway: "Plans & Billing keeps research capacity, AI allowance and optional add-ons visible in one place.",
  },
  "research-ai": {
    capabilities: [
      { title: "Use one assistant across the workflow", description: "AI support stays available while you design studies, analyse results and write research documents." },
      { title: "Choose how the work is routed", description: "PsyLattice Auto can select an available model, while eligible plans expose direct model choices." },
      { title: "Keep AI separate from computation", description: "AI can guide and explain, while deterministic PsyLattice tools remain responsible for statistical calculations and stored research structure." },
    ],
    takeaway: "The model switcher changes the AI layer without changing the underlying study, data or analysis workflow.",
  },
};


type DashboardTourStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const dashboardTourSteps: DashboardTourStep[] = [
  {
    id: "overview-metrics",
    eyebrow: "Workspace pulse",
    title: "Your research at a glance",
    description: "Start with the four summary cards. They show the current state of your workspace before you open any individual study.",
    calloutTitle: "Workspace summary",
    calloutBody: "Active studies, live participants, completed participants and TEST records are separated into clear headline metrics.",
    targetId: "dashboard-overview-metrics",
  },
  {
    id: "recent-studies",
    eyebrow: "Recent work",
    title: "Jump back into your studies",
    description: "The dashboard keeps your most recently updated studies visible so you can return to active work without searching the full Studies page.",
    calloutTitle: "Your studies",
    calloutBody: "Recent projects show design type, live-participant counts and current study status in one compact list.",
    targetId: "dashboard-recent-studies",
  },
  {
    id: "workspace-status",
    eyebrow: "Workspace health",
    title: "Spot research status signals",
    description: "The status panel surfaces operational signals that may need attention before recruitment or analysis moves forward.",
    calloutTitle: "Research workspace status",
    calloutBody: "See draft studies, studies without live recruitment and TEST participants without opening each project individually.",
    targetId: "dashboard-workspace-status",
  },
  {
    id: "quick-actions",
    eyebrow: "Common workflows",
    title: "Move directly to the next task",
    description: "After the overview, the dashboard gives you direct entry points into the research actions you are most likely to perform next.",
    calloutTitle: "Quick actions",
    calloutBody: "Create a study, find a questionnaire, generate a participant link or open the participant manager in one click.",
    targetId: "dashboard-quick-actions",
  },
  {
    id: "latest-study",
    eyebrow: "Recruitment snapshot",
    title: "Monitor the latest study",
    description: "The lower dashboard turns the most recently updated study into a lightweight recruitment snapshot with direct navigation back into the project.",
    calloutTitle: "Latest study",
    calloutBody: "See recruitment target, live links and live participants together, then jump straight back into the study when action is needed.",
    targetId: "dashboard-latest-study",
  },
];


type StudiesTourStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const studiesTourSteps: StudiesTourStep[] = [
  {
    id: "study-library",
    eyebrow: "Study library",
    title: "Browse and manage every study",
    description:
      "Use status filters, search and the study rows to quickly find drafts, active studies, completed work and archived projects.",
    calloutTitle: "Studies, filters & status controls",
    calloutBody:
      "Filter by lifecycle stage, search by study name, inspect participant counts, and see each study's current status before opening it.",
    targetId: "studies-library",
  },
  {
    id: "study-management",
    eyebrow: "Study controls",
    title: "Edit, pause or retire a study safely",
    description:
      "Open a study to review its configuration, participant counts and deployment controls. Draft studies are easiest to change; once live recruitment has started, protocol-changing edits should be restricted to protect data consistency.",
    calloutTitle: "Editing & lifecycle safeguards",
    calloutBody:
      "Edit the study while it is still safe to change. Use status controls to pause or stop new participation, open participant records or recruitment links, and delete only when the study can be safely removed.",
    targetId: "studies-management",
  },
];


type StudyBuilderTourStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const studyBuilderTourSteps: StudyBuilderTourStep[] = [
  {
    id: "builder-overview",
    eyebrow: "Step 1 · Overview",
    title: "Define the study before adding procedures",
    description:
      "Start with the study title, participant-facing description, design type and target sample. These basics become the frame that the rest of the builder follows.",
    calloutTitle: "Study overview",
    calloutBody:
      "Name the study, describe what participants will experience, choose the design and set the planned sample before moving into the protocol itself.",
    targetId: "study-builder-overview",
  },
  {
    id: "builder-components",
    eyebrow: "Step 2 · Components",
    title: "Choose what belongs in the protocol",
    description:
      "Turn study components on or off before configuring them. The builder adapts the remaining workflow to the elements you actually need.",
    calloutTitle: "Component-based workflow",
    calloutBody:
      "Consent, demographics and baseline measures can sit alongside cognitive tasks, EMA/ESM, follow-ups, wearables, passive context and participant uploads.",
    targetId: "study-builder-components",
  },
  {
    id: "builder-flow",
    eyebrow: "Step 3 · Study flow",
    title: "Control the participant journey",
    description:
      "Arrange the order in which participants encounter the study. Consent stays first, while questionnaires and cognitive tasks can be positioned or repeated as the protocol requires.",
    calloutTitle: "Participant study flow",
    calloutBody:
      "Build the exact sequence participants experience. Consent is locked before research data collection, while later study elements can be added, removed and reordered.",
    targetId: "study-builder-flow",
  },
  {
    id: "builder-consent",
    eyebrow: "Step 4 · Consent",
    title: "Configure the consent route",
    description:
      "Choose whether consent is built in PsyLattice, obtained externally or not collected digitally, then add participant information and the consent or comprehension items required by your approved protocol.",
    calloutTitle: "Consent configuration",
    calloutBody:
      "Select the consent method, provide participant information, add as many consent questions as needed and mark the items participants must complete before proceeding.",
    targetId: "study-builder-consent",
  },
  {
    id: "builder-demographics",
    eyebrow: "Step 5 · Demographics",
    title: "Build only the demographic fields you need",
    description:
      "Quick-add common demographics or create custom questions. Each field can define its response type, guidance, required status and whether it is directly identifying.",
    calloutTitle: "Flexible demographic fields",
    calloutBody:
      "Add standard or custom variables, choose the response format and explicitly flag required or directly identifying information so privacy handling stays visible.",
    targetId: "study-builder-demographics",
  },
  {
    id: "builder-baseline",
    eyebrow: "Step 6 · Baseline measures",
    title: "Attach questionnaires from the library",
    description:
      "Search the PsyLattice Questionnaire Library or questionnaires you created yourself, review the available measure information and add the required instruments to this study.",
    calloutTitle: "Pinned baseline measures",
    calloutBody:
      "Browse validated or custom questionnaires and add them directly to the protocol. PsyLattice pins the selected version so later library edits do not silently change the deployed study.",
    targetId: "study-builder-baseline",
  },
  {
    id: "builder-recruitment",
    eyebrow: "Step 7 · Recruitment",
    title: "Save the exact protocol before recruitment",
    description:
      "The study needs a saved draft and study ID before TEST or live participant routes can be created from Participant Links.",
    calloutTitle: "Recruitment starts from a saved draft",
    calloutBody:
      "Save the protocol first. Participant Links then creates TEST or live recruitment routes tied to that exact study configuration rather than an unsaved working state.",
    targetId: "study-builder-recruitment",
  },
  {
    id: "builder-review",
    eyebrow: "Step 8 · Review",
    title: "Review the complete protocol before deployment",
    description:
      "The final step summarises the selected components and reproducibility safeguards so you can save the study draft and test the full participant experience before live recruitment.",
    calloutTitle: "Final builder review",
    calloutBody:
      "Confirm the selected components, pinned questionnaire and cognitive-task versions, consent and optional longitudinal elements, then use a TEST participant link before going live.",
    targetId: "study-builder-review",
  },
];



type QuestionnaireTourStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const questionnaireTourSteps: QuestionnaireTourStep[] = [
  {
    id: "questionnaire-library-overview",
    eyebrow: "Catalogue overview",
    title: "Start with the research measure catalogue",
    description:
      "The library separates catalogue size, public-domain status, research-only measures and questionnaires you own, then lets you search and filter before opening any instrument.",
    calloutTitle: "Search, filter & understand availability",
    calloutBody:
      "Use the summary cards, search field, category selector and licence-status filter to narrow the catalogue before deciding whether a measure fits your study.",
    targetId: "questionnaire-library-overview",
  },
  {
    id: "questionnaire-measures",
    eyebrow: "Measure cards",
    title: "Review the measure before you use it",
    description:
      "Each catalogue card exposes the construct, item count, estimated time, language count and current rights status, with direct access to research details and the recorded licence source.",
    calloutTitle: "Research details & licence source",
    calloutBody:
      "Public-domain, research-only and terms-apply labels stay visible next to the measure. Open the research details and original licence source before deployment.",
    targetId: "questionnaire-library-measures",
  },
  {
    id: "questionnaire-create",
    eyebrow: "Original instruments",
    title: "Create a questionnaire when the catalogue is not enough",
    description:
      "At the bottom of the catalogue you can start an original instrument. PsyLattice also keeps the licensing safeguard visible so finding a measure online is never treated as automatic permission to reproduce it.",
    calloutTitle: "Build original content responsibly",
    calloutBody:
      "Create your own questionnaire when needed, but verify third-party permissions separately. PsyLattice records the source and usage status; it does not grant external rights.",
    targetId: "questionnaire-library-create",
  },
  {
    id: "questionnaire-builder-overview",
    eyebrow: "Builder · Instrument overview",
    title: "Define the instrument and its research metadata",
    description:
      "Name the questionnaire, add its acronym, category, description, constructs, languages, target population and recall period. The builder summary updates alongside the instrument.",
    calloutTitle: "Instrument identity & metadata",
    calloutBody:
      "Describe what the measure is, who it is for and how it should be recalled. The same builder supports many response formats without redesigning the database.",
    targetId: "questionnaire-builder-overview",
  },
  {
    id: "questionnaire-administration",
    eyebrow: "Builder · Administration & ownership",
    title: "Separate participant instructions from researcher guidance",
    description:
      "Provide instructions for participants and researchers, then decide whether the finished instrument remains private, is published for free use, or is discoverable but permission-controlled.",
    calloutTitle: "Administration, publication & ownership",
    calloutBody:
      "Keep participant-facing and researcher-facing guidance separate. Publication controls determine who can discover or use the questionnaire after you save it.",
    targetId: "questionnaire-builder-administration",
  },
  {
    id: "questionnaire-structure",
    eyebrow: "Builder · Structure",
    title: "Build the questionnaire in blocks and items",
    description:
      "Create pages or blocks, then add configurable item types. Each item has its own key, response type, statement, help text, subscale membership, required state and reverse-scoring flag.",
    calloutTitle: "Blocks, items & item-level configuration",
    calloutBody:
      "The participant experience is built block by block. Each question stores its own response, validation, scoring and display configuration instead of relying on one fixed questionnaire format.",
    targetId: "questionnaire-builder-structure",
  },
  {
    id: "questionnaire-response-logic",
    eyebrow: "Builder · Responses & logic",
    title: "Control options, media and branching at item level",
    description:
      "For scale items, define participant labels, numeric scores and optional weights. You can randomise option order, attach media and add display logic based on earlier answers.",
    calloutTitle: "Responses, media & branching",
    calloutBody:
      "Labels and scoring values are stored separately, media can be attached privately, and conditional display logic lets later items respond to earlier answers.",
    targetId: "questionnaire-builder-response-logic",
  },
  {
    id: "questionnaire-scoring",
    eyebrow: "Builder · Scoring & save",
    title: "Record the scoring plan and confirm your rights before saving",
    description:
      "Choose the scoring method, missing-data rule and questionnaire-level randomisation behaviour, add analysis notes, confirm that you created or can reproduce the content, then save or publish according to the selected ownership mode.",
    calloutTitle: "Scoring, rights confirmation & save",
    calloutBody:
      "PsyLattice stores your scoring plan without implying psychometric validity. Rights confirmation is explicit before the instrument can be saved or published.",
    targetId: "questionnaire-builder-scoring",
  },
];


type CognitiveTourStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const cognitiveTourSteps: CognitiveTourStep[] = [
  {
    id: "cognitive-overview",
    eyebrow: "Cognitive Lab overview",
    title: "Understand how cognitive tasks fit into the research workflow",
    description:
      "Cognitive Lab creates reusable task definitions and versioned research assets. Study Builder decides when they run, Participant Runner executes them and Research Data keeps the resulting trial-level output aligned with the study.",
    calloutTitle: "Reusable tasks, not isolated experiments",
    calloutBody:
      "Build a task once, test and version it here, then reuse the frozen version across studies, batteries and longitudinal protocols without rebuilding the paradigm each time.",
    targetId: "cognitive-overview",
  },
  {
    id: "cognitive-learn",
    eyebrow: "Learn",
    title: "Learn the task architecture visually before building",
    description:
      "The Learn area explains the path from template to task builder, preview, pilot and study deployment with visual guides and complete examples rather than sending researchers to separate documentation.",
    calloutTitle: "Built-in experimental psychology guidance",
    calloutBody:
      "Use short visual guides to understand task families, trial structure, participant responses and previewing before you begin configuring a paradigm.",
    targetId: "cognitive-learn",
  },
  {
    id: "cognitive-templates",
    eyebrow: "Task Templates",
    title: "Start from established cognitive paradigms",
    description:
      "Browse study-ready starter templates by domain, inspect typical outputs and device support, then clone the paradigm into your personal Cognitive Task Library for customisation.",
    calloutTitle: "A real paradigm is your starting point",
    calloutBody:
      "Search by task, construct or output, filter by cognitive domain and compare duration, complexity, expected outputs and supported devices before choosing a template.",
    targetId: "cognitive-templates",
  },
  {
    id: "cognitive-details",
    eyebrow: "Template details",
    title: "Inspect what a task actually measures before cloning it",
    description:
      "The task-detail panel explains the construct, typical trial flow, outputs, device guidance, research use cases and the parameters that can be customised.",
    calloutTitle: "Understand the paradigm before editing it",
    calloutBody:
      "For a Corsi task, review forward and backward span, the nine-block sequence flow, expected outputs, device considerations and editable span/timing parameters before adding it to your library.",
    targetId: "cognitive-details",
  },
  {
    id: "cognitive-my-tasks",
    eyebrow: "My Cognitive Tasks",
    title: "Keep working drafts separate from study-ready versions",
    description:
      "Your personal task library stores reusable drafts, source information and version history. A working draft can be previewed and piloted before an exact version is frozen for use in studies.",
    calloutTitle: "Versioning protects reproducibility",
    calloutBody:
      "Edit the working draft freely, then mark a tested version ready for studies. Published versions remain frozen so later edits cannot silently alter a deployed protocol.",
    targetId: "cognitive-my-tasks",
  },
  {
    id: "cognitive-corsi-builder",
    eyebrow: "Dedicated paradigm builder",
    title: "Configure a Corsi task with spatial controls built for the paradigm",
    description:
      "Dedicated tasks expose the controls researchers actually need: practice, adaptive span progression, forward/backward mode, sequence limits, trial criteria and a live board preview.",
    calloutTitle: "Paradigm-specific controls stay reproducible",
    calloutBody:
      "The fixed Corsi flow preserves the spatial runtime while letting you configure span progression, practice criteria and participant instructions without rebuilding the task from generic blocks.",
    targetId: "cognitive-corsi-builder",
  },
  {
    id: "cognitive-preview-preflight",
    eyebrow: "Browser Preview",
    title: "Check timing and the participant environment before running a task",
    description:
      "Preview executes the exact saved task definition in the browser and records timing diagnostics separately from research data. A preflight verifies display timing, visibility, allowed devices and media readiness.",
    calloutTitle: "Preview timing before collecting research data",
    calloutBody:
      "Inspect the browser environment, refresh-rate sampling and display calibration before starting. High-resolution browser timing is useful, but hardware and operating-system conditions still matter.",
    targetId: "cognitive-preview-preflight",
  },
  {
    id: "cognitive-preview-run",
    eyebrow: "Participant runtime",
    title: "Experience the task exactly as a participant will",
    description:
      "Run the saved protocol yourself in the isolated Preview runner. For Corsi, the participant sees the unnumbered spatial board, sequence illumination and response prompt exactly as configured.",
    calloutTitle: "Test the real participant experience",
    calloutBody:
      "Preview is not just a static mockup. It runs the actual task, captures responses and lets you verify visual layout, sequence behaviour and usability before piloting or deployment.",
    targetId: "cognitive-preview-run",
  },
  {
    id: "cognitive-stroop-timeline",
    eyebrow: "Visual Task Builder",
    title: "Build generic experimental tasks from ordered timeline steps",
    description:
      "The visual Task Builder represents a task as blocks, trial rows and ordered components. A Stroop task can contain instructions, practice and experimental blocks while keeping each part independently configurable.",
    calloutTitle: "Blocks define the experiment structure",
    calloutBody:
      "Use Instructions, Practice and Experimental blocks to organise the protocol. Within each block, the Trial timeline determines the exact sequence of events participants experience.",
    targetId: "cognitive-stroop-timeline",
  },
  {
    id: "cognitive-stroop-add-step",
    eyebrow: "Timeline components",
    title: "Compose a trial from the components your experiment needs",
    description:
      "Add fixation, text, images, audio, video, shapes, participant responses, inter-trial intervals or HTML components directly to the trial timeline.",
    calloutTitle: "A trial is built from explicit steps",
    calloutBody:
      "Instead of hiding timing inside code, PsyLattice makes each event visible. Use a standard trial or add individual components such as Fixation, Stimulus, Response and ITI yourself.",
    targetId: "cognitive-stroop-add-step",
  },
  {
    id: "cognitive-stroop-table",
    eyebrow: "Trial table",
    title: "Separate experimental conditions from the timeline",
    description:
      "The trial table stores condition variables such as word, colour and correct response. Timeline components can reference those variables, so one task structure can execute many experimental rows.",
    calloutTitle: "Conditions live in a reusable trial table",
    calloutBody:
      "Add variables, import CSV rows, set weights and choose which rows are used. This separates the experimental design matrix from the visual sequence that presents each trial.",
    targetId: "cognitive-stroop-table",
  },
  {
    id: "cognitive-stroop-random",
    eyebrow: "Randomisation",
    title: "Control trial order and sampling explicitly",
    description:
      "Choose trial order, sampling method, maximum repeated conditions, participant-level seed behaviour and optional balancing rules for conditions and response mappings.",
    calloutTitle: "Randomisation is part of the saved protocol",
    calloutBody:
      "The rules used to randomise trials are stored with the task rather than improvised at run time, making the experimental procedure easier to inspect and reproduce.",
    targetId: "cognitive-stroop-random",
  },
  {
    id: "cognitive-stroop-score",
    eyebrow: "Scoring & devices",
    title: "Define what the task records and where it is allowed to run",
    description:
      "Specify metric keys, timing precision, raw-trial retention, summary outputs, timing diagnostics and allowed participant devices before the task becomes study-ready.",
    calloutTitle: "Outputs and compatibility are explicit",
    calloutBody:
      "Keep raw trial-level data when needed, calculate summary metrics, collect timing diagnostics and restrict device classes so the deployed task matches the requirements of your experimental design.",
    targetId: "cognitive-stroop-score",
  },
];


type ThesisTourStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const thesisTourSteps: ThesisTourStep[] = [
  {
    id: "thesis-files",
    eyebrow: "Research files",
    title: "Organise every thesis and paper inside a private writing workspace",
    description:
      "Use nested folders, document search and researcher-owned files to keep theses, manuscripts and supporting drafts organised without mixing them into the participant-facing research workflow.",
    calloutTitle: "Your research writing stays organised",
    calloutBody:
      "Create folders inside folders, search documents and keep multiple papers in one workspace. Documents are researcher-owned, and Writing AI does not automatically read them.",
    targetId: "thesis-files",
  },
  {
    id: "thesis-editor",
    eyebrow: "Academic editor",
    title: "Write in a full paged editor and bring research output directly into the manuscript",
    description:
      "The editor includes import/export, margins, fonts, spacing, paragraph controls, links, tables and a paged document view. Analysis tables can live directly inside the paper instead of being rebuilt elsewhere.",
    calloutTitle: "A real academic editor, not a notes box",
    calloutBody:
      "Write and format the manuscript while keeping tables and research output visible in the same document. Import and export stay available from the editor toolbar.",
    targetId: "thesis-editor",
  },
  {
    id: "thesis-presets",
    eyebrow: "Format presets",
    title: "Switch between Freeform and complete academic or institution-specific formats",
    description:
      "Choose Freeform when you want full manual control, or apply a preset such as APA 7 Student, APA 7 Professional, MLA 9, Chicago/Turabian, IEEE or a custom institution-specific format.",
    calloutTitle: "Freeform or one-click academic formatting",
    calloutBody:
      "The format menu can snap page setup, typography, spacing and structural expectations to a selected style. Custom / institution-specific presets let a university or department format be represented too.",
    targetId: "thesis-presets",
  },
  {
    id: "thesis-format-guide",
    eyebrow: "Preset structure",
    title: "See exactly what the selected preset changes before you restructure the paper",
    description:
      "A format guide explains page rules and the expected document structure. For APA 7 Professional, for example, the guide can show title page, abstract, keywords, introduction, method, results, discussion, references and tables/figures.",
    calloutTitle: "The preset defines the formatting frame",
    calloutBody:
      "Selecting a preset applies its page-level rules and exposes the expected structure. Institution-specific presets can carry local thesis requirements, while Freeform leaves the document unconstrained.",
    targetId: "thesis-format-guide",
  },
  {
    id: "thesis-writing-ai",
    eyebrow: "Writing AI",
    title: "Use Writing AI to restructure the current paper into the selected format",
    description:
      "Writing AI starts with document access off. When you deliberately enable access to the current paper, you can ask it to reorganise headings, sections and wording around the selected APA, MLA, IEEE or institution-specific structure while you remain in control of the final document.",
    calloutTitle: "AI restructures only when you permit document access",
    calloutBody:
      "Choose the target preset first, turn on ‘Allow AI to read current paper’, then ask Writing AI to restructure the thesis to that preset or your institution’s template. The preset controls formatting; AI helps reorganise the content and section structure for you to review.",
    targetId: "thesis-writing-ai",
  },
  {
    id: "thesis-fullscreen",
    eyebrow: "Focus mode",
    title: "Expand into a full-screen writing environment when you need uninterrupted editing",
    description:
      "Full-screen view removes the surrounding Research workspace navigation and keeps the document title, formatting toolbar, page canvas, zoom controls and Writing AI available in a distraction-reduced editor.",
    calloutTitle: "Turn Thesis Builder into a focused writing desk",
    calloutBody:
      "Use the expand control to hide the surrounding workspace and devote the display to the manuscript. The Files button takes you back to document organisation without losing your writing state.",
    targetId: "thesis-fullscreen",
  },
  {
    id: "thesis-results",
    eyebrow: "Research-to-writing workflow",
    title: "Keep statistical tables and research results inside the same writing workflow",
    description:
      "PsyLattice can place analysis-ready tables and structured research output into the thesis editor, so the document can be formatted, interpreted and revised without recreating results manually in another application.",
    calloutTitle: "Move from analysis to manuscript without rebuilding the result",
    calloutBody:
      "Tables from the research workflow remain editable document content. Combine them with your narrative, apply the selected format and use Writing AI for explanation or restructuring when current-paper access is enabled.",
    targetId: "thesis-results",
  },
];



type AmbulatoryTourStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const ambulatoryTourSteps: AmbulatoryTourStep[] = [
  {
    id: "ambulatory-protocol",
    eyebrow: "Protocol setup",
    title: "Define the repeated-measures study before adding prompts",
    description:
      "Choose the PsyLattice study, protocol duration and protocol name, then decide whether study email reminders or participant feedback summaries belong in the design.",
    calloutTitle: "Ambulatory protocol settings",
    calloutBody:
      "The protocol is attached to a saved research study. Duration, reminder behaviour and feedback options are visible before any sampling schedule is configured.",
    targetId: "ambulatory-protocol",
  },
  {
    id: "ambulatory-triggers",
    eyebrow: "Sampling strategy",
    title: "Choose how each real-world assessment is triggered",
    description:
      "PsyLattice supports fixed-time, random-window, interval-contingent, event-contingent, participant-initiated and Sensor / Health Connect event triggers inside the same ambulatory builder.",
    calloutTitle: "Multiple EMA / ESM trigger modes",
    calloutBody:
      "Select the sampling logic that matches the research question instead of forcing every ambulatory study into a fixed schedule.",
    targetId: "ambulatory-trigger-types",
  },
  {
    id: "ambulatory-time",
    eyebrow: "Time-contingent EMA",
    title: "Schedule check-ins with response windows and reminders",
    description:
      "For a fixed-time assessment, define the check-in time, how long the response remains available and the email reminder participants receive when the prompt opens.",
    calloutTitle: "Scheduled real-world check-ins",
    calloutBody:
      "A morning assessment can open at 09:00, remain available for a defined response window and send a study reminder without changing the actual questionnaire content.",
    targetId: "ambulatory-time-checkin",
  },
  {
    id: "ambulatory-items",
    eyebrow: "Assessment content",
    title: "Build the prompt participants answer in the moment",
    description:
      "Add ratings, Yes / No questions and other response blocks, mark required items and attach conditional follow-up blocks that only appear when a response rule is met.",
    calloutTitle: "Nested and conditional assessment blocks",
    calloutBody:
      "Configure a stress slider from 0 to 10, label the scale clearly, then branch into additional questions only when the participant's answer requires them.",
    targetId: "ambulatory-response-blocks",
  },
  {
    id: "ambulatory-android",
    eyebrow: "Android companion",
    title: "Use the real Android companion with Health Connect",
    description:
      "The Android companion can participate in ambulatory collection by reading only the Health Connect data the participant explicitly permits on their Android device. The first supported streams shown here are heart rate, steps, sleep duration and exercise-session events.",
    calloutTitle: "Real Android + Health Connect support",
    calloutBody:
      "Participants grant each Health Connect permission on-device. The Android companion can evaluate permitted sensor context and notify PsyLattice when the configured research rule is satisfied.",
    targetId: "ambulatory-android-support",
  },
  {
    id: "ambulatory-sensor-rule",
    eyebrow: "Sensor-contingent sampling",
    title: "Turn permitted mobile context into a controlled research trigger",
    description:
      "Choose the Health Connect data type and condition, then constrain the rule with active hours, prompt limits and cooldowns. You can also store only the trigger event rather than unnecessary sensor detail.",
    calloutTitle: "Sensor rules include anti-overprompt safeguards",
    calloutBody:
      "Set the active window, maximum prompts per day and cooldown period so a sensor-contingent study remains bounded and reproducible rather than continuously interrupting participants.",
    targetId: "ambulatory-sensor-rule",
  },
  {
    id: "ambulatory-notification",
    eyebrow: "Participant delivery",
    title: "The companion turns a matched rule into an actual PsyLattice prompt",
    description:
      "When the Android companion confirms the configured sensor rule, PsyLattice records the sensor event and opens the ambulatory assessment. The companion shows the configured notification so the participant can complete the check-in.",
    calloutTitle: "From Health Connect event to participant check-in",
    calloutBody:
      "The research rule, notification title and message are defined in the protocol. The app is the participant-side delivery layer; it does not independently invent when or why an assessment should appear.",
    targetId: "ambulatory-trigger-action",
  },
];


type AnalysisTourStep = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const analysisTourSteps: AnalysisTourStep[] = [
  {
    id: "analysis-environment",
    eyebrow: "Integrated analysis environment",
    title: "Turn collected research data into reproducible statistical output",
    description:
      "Analysis Lab keeps the selected study, analysis-ready dataset, variable set, statistical workflow, results, saved records and AI explanation layer together in one research environment.",
    calloutTitle: "A complete analysis workspace",
    calloutBody:
      "Move from descriptives and diagnostics to correlations, comparisons, models, scales and study-design utilities without exporting the dataset first. PsyLattice performs the numerical calculations deterministically; Analysis AI explains the verified output.",
    targetId: "analysis-environment",
  },
  {
    id: "analysis-fullscreen",
    eyebrow: "Focused analysis mode",
    title: "Expand Analysis Lab into a full-screen statistical workspace",
    description:
      "Full screen removes the surrounding Research workspace chrome and gives the analysis canvas the entire display while preserving the selected study, dataset, variables and statistical context.",
    calloutTitle: "Full-screen analysis canvas",
    calloutBody:
      "Use full screen when the analysis itself becomes the task. The same deterministic engine, variable controls, result records and Analysis AI remain available, but the canvas gains room for large matrices, models, diagnostics and formatted output.",
    targetId: "analysis-fullscreen",
  },
];

type CollectionTourStep = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  calloutTitle: string;
  calloutBody: string;
  targetId: string;
};

const participantsTourSteps: CollectionTourStep[] = [
  {
    id: "participants-controls",
    eyebrow: "Participant operations",
    title: "Choose the study, search the sample and filter participant state",
    description: "Participant management stays scoped to one study. Search pseudonymous participant IDs and filter active or completed records without opening individual participant pages.",
    calloutTitle: "Study-scoped participant controls",
    calloutBody: "Select the study first, then search or filter the sample. This keeps participant operations tied to the correct protocol and makes active versus completed records immediately visible.",
    targetId: "participants-controls",
  },
  {
    id: "participants-table",
    eyebrow: "Participant progress",
    title: "Read consent and completion participant by participant",
    description: "Each row combines the pseudonymous participant ID, lifecycle status, recorded consent, questionnaire completion, cognitive-task completion and enrolment date.",
    calloutTitle: "Monitor the sample without exposing identity",
    calloutBody: "The participant table is an operational study view: status, consent and completion across study components stay visible alongside PsyLattice participant IDs.",
    targetId: "participants-table",
  },
];

const participantLinksTourSteps: CollectionTourStep[] = [
  {
    id: "participant-links-create",
    eyebrow: "Recruitment deployment",
    title: "Turn a saved study into a secure participant route",
    description: "Select the saved study and generate a token-based participant link. Participants enter the protocol through that route and never enter the Researcher workspace.",
    calloutTitle: "Create a participant-facing route",
    calloutBody: "Participant Links deploys a saved protocol through a long tokenised URL. Keep TEST and live routes separate so setup checks never become mixed with real research participation.",
    targetId: "participant-links-create",
  },
  {
    id: "participant-links-manage",
    eyebrow: "Deployment control",
    title: "Copy, open, pause or reactivate recruitment links",
    description: "Each route exposes its live status and participant count while giving the researcher explicit control over whether new participants can enter.",
    calloutTitle: "Control recruitment after launch",
    calloutBody: "Copy or open a route when recruiting, pause it when participation should stop, and reactivate it only when appropriate. Live collection should remain tied to a stable protocol version.",
    targetId: "participant-links-manage",
  },
];

const dataDashboardTourSteps: CollectionTourStep[] = [
  {
    id: "data-dashboard-metrics",
    eyebrow: "Collection health",
    title: "See incoming research data at a glance",
    description: "Headline cards separate live participants, item responses, questionnaire completions, cognitive-task runs and configured direct-identifier fields.",
    calloutTitle: "Live collection summary",
    calloutBody: "Use these cards as the first health check for a running study. TEST records remain separate from live collection, and direct-identifier fields are surfaced explicitly.",
    targetId: "data-dashboard-metrics",
  },
  {
    id: "data-dashboard-quality",
    eyebrow: "Completeness & quality",
    title: "Catch missing study components before formal analysis",
    description: "Completeness and transparent rule-based checks surface missing baseline measures, demographics, consent, TEST records and direct-identifier configuration.",
    calloutTitle: "Transparent quality checks",
    calloutBody: "These are visible review signals, not hidden automatic exclusions. Check what is missing while collection is still active, then make the analysis decision yourself.",
    targetId: "data-dashboard-quality",
  },
];

const dataExplorerTourSteps: CollectionTourStep[] = [
  {
    id: "data-explorer-controls",
    eyebrow: "Dataset inspection",
    title: "Choose exactly which stored dataset you want to inspect",
    description: "Select the study and dataset, search participants or variables, and explicitly decide whether TEST data or direct identifiers should be visible.",
    calloutTitle: "Control the inspection frame",
    calloutBody: "Data Explorer starts with the data view, not a statistical test. TEST-data and direct-identifier switches make potentially sensitive or non-live records explicit before inspection.",
    targetId: "data-explorer-controls",
  },
  {
    id: "data-explorer-table",
    eyebrow: "Stored records",
    title: "Inspect the participant-level table before analysing it",
    description: "The selected study produces a participant-level view of enrolment, completion, consent and component-level study fields.",
    calloutTitle: "See what was actually stored",
    calloutBody: "Inspect rows and variables directly before choosing an analysis. Search and filters control the visible preview, and Copy table follows the rows currently shown.",
    targetId: "data-explorer-table",
  },
  {
    id: "data-explorer-cognitive",
    eyebrow: "Cognitive outputs",
    title: "Review cognitive-task performance beside the participant dataset",
    description: "Cognitive administrations expose completion, accuracy, reaction-time summaries and omissions derived from stored task trials.",
    calloutTitle: "Cognitive results stay connected to the study",
    calloutBody: "Accuracy, mean RT, median RT, completion and omissions can be inspected alongside the study dataset before you move into Analysis Lab or export the data.",
    targetId: "data-explorer-cognitive",
  },
];

const exportTourSteps: CollectionTourStep[] = [
  {
    id: "export-modes",
    eyebrow: "Export purpose",
    title: "Choose the export that matches the research job",
    description: "Use a complete archive, thesis/analysis workbook, statistics-ready dataset or lossless raw archive instead of forcing every project into one generic spreadsheet.",
    calloutTitle: "Four export purposes, one source study",
    calloutBody: "Choose the structure based on what happens next: reproducibility archive, practical thesis work, SPSS/jamovi/JASP analysis, or preservation of raw observations.",
    targetId: "export-modes",
  },
  {
    id: "export-summary",
    eyebrow: "Privacy preview",
    title: "Know exactly what leaves PsyLattice before downloading",
    description: "Preview the study, population, participant count, identity mode, direct-identifier handling, TEST-data handling and worksheet counts before generation.",
    calloutTitle: "Preview sample and privacy choices",
    calloutBody: "Verify pseudonymous IDs, identifier exclusions and the selected live sample before the file leaves PsyLattice instead of discovering those choices after download.",
    targetId: "export-summary",
  },
  {
    id: "export-workbook",
    eyebrow: "Workbook structure",
    title: "Inspect the exact clean, raw and documentation sheets",
    description: "The workbook preview exposes sheet names, clean/raw/documentation groups and row counts before the Excel file is generated.",
    calloutTitle: "Reproducibility is visible before export",
    calloutBody: "Clean analysis sheets can sit beside raw observations, manifests and README documentation. The declared structure is visible before the download is created.",
    targetId: "export-workbook",
  },
];

const navIcons: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard className="h-3.5 w-3.5" />,
  ai: <Sparkles className="h-3.5 w-3.5" />,
  assessments: <ClipboardList className="h-3.5 w-3.5" />,
  monitoring: <Activity className="h-3.5 w-3.5" />,
  regulation: <HeartPulse className="h-3.5 w-3.5" />,
  progress: <BarChart3 className="h-3.5 w-3.5" />,
  wearables: <MonitorSmartphone className="h-3.5 w-3.5" />,
  appointments: <CalendarDays className="h-3.5 w-3.5" />,
  messages: <MessageSquare className="h-3.5 w-3.5" />,
  privacy: <ShieldCheck className="h-3.5 w-3.5" />,
  studies: <BookOpen className="h-3.5 w-3.5" />,
  "study-builder": <Workflow className="h-3.5 w-3.5" />,
  questionnaires: <ClipboardList className="h-3.5 w-3.5" />,
  "custom-questionnaires": <WandSparkles className="h-3.5 w-3.5" />,
  "cognitive-lab": <Activity className="h-3.5 w-3.5" />,
  ambulatory: <BellRing className="h-3.5 w-3.5" />,
  "wearable-data": <MonitorSmartphone className="h-3.5 w-3.5" />,
  participants: <Users className="h-3.5 w-3.5" />,
  followups: <BellRing className="h-3.5 w-3.5" />,
  data: <Database className="h-3.5 w-3.5" />,
  "analysis-lab": <BarChart3 className="h-3.5 w-3.5" />,
  "thesis-builder": <FileText className="h-3.5 w-3.5" />,
  "research-ai": <Sparkles className="h-3.5 w-3.5" />,
  export: <FileDown className="h-3.5 w-3.5" />,
  clients: <Users className="h-3.5 w-3.5" />,
  "client-overview": <LayoutDashboard className="h-3.5 w-3.5" />,
  "care-pathway": <Workflow className="h-3.5 w-3.5" />,
  notes: <FileText className="h-3.5 w-3.5" />,
  receptionist: <Settings2 className="h-3.5 w-3.5" />,
};

function normaliseWorkspace(value: string | null): Workspace | null {
  if (value === "self" || value === "researcher" || value === "clinician") {
    return value;
  }
  return null;
}

function TourCard({
  children,
  className = "",
  highlight = false,
}: {
  children?: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white ${
        highlight
          ? "border-cyan-300 shadow-[0_0_0_3px_rgba(8,145,178,0.08),0_14px_35px_rgba(15,23,42,0.08)]"
          : "border-slate-200 shadow-sm"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// Older Self/Clinical demo branches still reference DemoCard.
// Keep it as an alias to the current card implementation so those routes do not crash.
const DemoCard = TourCard;

function MiniStat({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">{value}</p>
      {helper && <p className="mt-1 text-[10px] text-slate-400">{helper}</p>}
    </div>
  );
}

function ScreenTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-800">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      </div>
      {action && (
        <button
          type="button"
          className="rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function SelfDemo({ slideId }: { slideId: string }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sharing, setSharing] = useState({ assessments: true, monitoring: false, progress: true });

  if (slideId === "dashboard") {
    return (
      <div>
        <ScreenTitle eyebrow="Personal workspace" title="Good afternoon, Priya" />
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Today" value="2 check-ins" helper="1 completed" />
          <MiniStat label="Assessments" value="3" helper="last updated 4d ago" />
          <MiniStat label="Clinician" value="Connected" helper="Dr. Mehta" />
        </div>
        <div className="mt-3 grid grid-cols-[1.15fr_.85fr] gap-3">
          <DemoCard className="p-4" highlight>
            <p className="text-xs font-semibold text-slate-900">Today</p>
            <div className="mt-3 space-y-2">
              {[
                ["Mood check-in", "08:00", true],
                ["Evening reflection", "20:00", false],
              ].map(([label, time, done]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-[11px] font-medium text-slate-800">{String(label)}</p>
                    <p className="text-[9px] text-slate-400">{String(time)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${done ? "bg-cyan-50 text-cyan-800" : "bg-cyan-50 text-cyan-700"}`}>
                    {done ? "Done" : "Due later"}
                  </span>
                </div>
              ))}
            </div>
          </DemoCard>
          <DemoCard className="p-4">
            <p className="text-xs font-semibold text-slate-900">Your clinician</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-cyan-50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-cyan-800 shadow-sm">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-800">Dr. A. Mehta</p>
                <p className="text-[9px] text-slate-500">Connected clinician</p>
              </div>
            </div>
          </DemoCard>
        </div>
      </div>
    );
  }

  if (slideId === "ai") {
    return (
      <div>
        <ScreenTitle eyebrow="AI Guide" title="Explore a pattern" />
        <DemoCard className="overflow-hidden" highlight>
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[10px] font-medium text-slate-500">Private reflection space</p>
          </div>
          <div className="space-y-3 p-4">
            <div className="max-w-[78%] rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2.5 text-[11px] leading-5 text-slate-700">
              What would you like to understand better today?
            </div>
            <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-md bg-cyan-700 px-3 py-2.5 text-[11px] leading-5 text-white">
              I keep getting tense before group presentations.
            </div>
            <div className="max-w-[84%] rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2.5 text-[11px] leading-5 text-slate-700">
              We can unpack what happens before, during and after those moments, then decide what may be worth monitoring.
            </div>
          </div>
          <div className="border-t border-slate-200 p-3">
            <div className="flex gap-2">
              <input className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] outline-none" placeholder="Ask Luna something..." />
              <button className="rounded-xl bg-slate-950 px-3 text-[10px] font-semibold text-white">Send</button>
            </div>
          </div>
        </DemoCard>
      </div>
    );
  }

  if (slideId === "assessments") {
    return (
      <div>
        <ScreenTitle eyebrow="Self-assessments" title="Choose a measure" action="Browse library" />
        <div className="grid grid-cols-2 gap-3">
          {["Perceived Stress Scale", "General Self-Efficacy Scale", "WHO-5 Well-Being", "Sleep Quality Check"].map((name, index) => (
            <DemoCard key={name} className="p-4" highlight={index === 0}>
              <p className="text-xs font-semibold text-slate-900">{name}</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">Short structured assessment for personal reflection.</p>
              <button className="mt-3 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600">Start</button>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "monitoring") {
    return (
      <div>
        <ScreenTitle eyebrow="Daily monitoring" title="This week" action="New check-in" />
        <DemoCard className="p-4" highlight>
          <div className="flex h-36 items-end gap-2">
            {[46, 70, 54, 82, 65, 76, 61].map((height, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="mx-auto w-full max-w-8 rounded-t-lg bg-cyan-200" style={{ height: `${height}px` }} />
                <span className="mt-2 block text-[8px] text-slate-400">{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Check-ins" value="11" />
            <MiniStat label="Completed" value="91%" />
            <MiniStat label="Next" value="20:00" />
          </div>
        </DemoCard>
      </div>
    );
  }

  if (slideId === "regulation") {
    return (
      <div>
        <ScreenTitle eyebrow="Self-regulation" title="Current routines" action="Add routine" />
        <div className="space-y-3">
          {[
            ["2-minute grounding", "5 of 7 days", 72],
            ["Evening wind-down", "4 of 7 days", 58],
            ["Presentation rehearsal", "2 of 3 sessions", 66],
          ].map(([title, meta, value], index) => (
            <DemoCard key={String(title)} className="p-4" highlight={index === 0}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{String(title)}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{String(meta)}</p>
                </div>
                <span className="text-[10px] font-semibold text-cyan-700">{String(value)}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-cyan-600" style={{ width: `${Number(value)}%` }} />
              </div>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "progress") {
    return (
      <div>
        <ScreenTitle eyebrow="Progress" title="Your trends" />
        <DemoCard className="p-4" highlight>
          <div className="flex items-end gap-2 rounded-xl bg-slate-50 p-4">
            {[48, 52, 49, 61, 65, 72, 76, 82].map((height, index) => (
              <div key={index} className="flex-1 rounded-t-md bg-cyan-300" style={{ height: `${height}px` }} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Well-being" value="+12%" />
            <MiniStat label="Routine" value="76%" />
            <MiniStat label="Check-ins" value="23" />
          </div>
        </DemoCard>
      </div>
    );
  }

  if (slideId === "wearables") {
    return (
      <div>
        <ScreenTitle eyebrow="Wearables" title="Connected sources" />
        <div className="grid grid-cols-2 gap-3">
          {["Apple Health", "Fitbit", "Garmin", "Google Health Connect"].map((name, index) => (
            <DemoCard key={name} className="p-4" highlight={index === 0}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{index === 0 ? "Connected" : "Not connected"}</p>
                </div>
                <div className={`h-5 w-9 rounded-full p-0.5 ${index === 0 ? "bg-cyan-600" : "bg-slate-200"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${index === 0 ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </div>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "appointments") {
    return (
      <div>
        <ScreenTitle eyebrow="Appointments" title="August 2026" action="Request appointment" />
        <div className="grid grid-cols-[1.2fr_.8fr] gap-3">
          <DemoCard className="p-4" highlight>
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-slate-400">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
              {Array.from({ length: 28 }).map((_, index) => (
                <button key={index} className={`rounded-lg py-2 text-[9px] ${index === 16 ? "bg-cyan-600 font-semibold text-white" : "bg-slate-50 text-slate-600"}`}>
                  {index + 1}
                </button>
              ))}
            </div>
          </DemoCard>
          <DemoCard className="p-4">
            <p className="text-xs font-semibold text-slate-900">Monday, 17 August</p>
            <div className="mt-3 rounded-xl bg-cyan-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">Therapy / session</p>
              <p className="mt-1 text-[9px] text-slate-500">10:00–10:50 AM</p>
              <span className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[8px] font-semibold text-cyan-700">Scheduled</span>
            </div>
          </DemoCard>
        </div>
      </div>
    );
  }

  if (slideId === "messages") {
    return (
      <div>
        <ScreenTitle eyebrow="Messages" title="Dr. A. Mehta" />
        <DemoCard className="overflow-hidden" highlight>
          <div className="space-y-3 p-4">
            <div className="max-w-[70%] rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2.5 text-[10px] leading-4 text-slate-700">
              How did the presentation go yesterday?
            </div>
            <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-md bg-cyan-700 px-3 py-2.5 text-[10px] leading-4 text-white">
              Better than expected. I used the grounding routine before it started.
            </div>
          </div>
          <div className="flex gap-2 border-t border-slate-200 p-3">
            <input value={message} onChange={(event) => setMessage(event.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] outline-none" placeholder={sent ? "Message sent" : "Write a message..."} />
            <button onClick={() => { setSent(true); setMessage(""); }} className="rounded-xl bg-slate-950 px-3 text-[10px] font-semibold text-white">Send</button>
          </div>
        </DemoCard>
      </div>
    );
  }

  return (
    <div>
      <ScreenTitle eyebrow="Privacy & Sharing" title="What your clinician can see" />
      <DemoCard className="p-4" highlight>
        <div className="space-y-2.5">
          {([
            ["assessments", "Assessments"],
            ["monitoring", "Daily monitoring"],
            ["progress", "Progress"],
          ] as const).map(([key, label]) => {
            const enabled = sharing[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSharing((current) => ({ ...current, [key]: !current[key] }))}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-left"
              >
                <div>
                  <p className="text-[11px] font-semibold text-slate-800">{label}</p>
                  <p className="mt-0.5 text-[9px] text-slate-400">Separate permission</p>
                </div>
                <div className={`h-5 w-9 rounded-full p-0.5 ${enabled ? "bg-cyan-600" : "bg-slate-200"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            );
          })}
        </div>
      </DemoCard>
    </div>
  );
}


function ResearchPill({ children, active = false, dark = false, className = "" }: { children?: ReactNode; active?: boolean; dark?: boolean; className?: string }) {
  return <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[7px] font-semibold shadow-sm ${dark ? "border-slate-950 bg-slate-950 text-white" : active ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-500"} ${className}`}>{children}</span>;
}
function ResearchInput({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <div className={`min-h-[32px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8px] text-slate-700 shadow-[0_3px_9px_rgba(15,23,42,0.05)] ${className}`}>{children}</div>;
}
function ResearchSection({ children, className = "", id }: { children?: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)] ${className}`}>{children}</section>;
}
function ResearchMetric({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return <ResearchSection className="p-4"><p className="text-[7px] font-semibold uppercase tracking-[0.15em] text-slate-400"><span className="mr-1 text-cyan-500">●</span>{label}</p><p className="mt-2 text-[19px] font-semibold tracking-tight text-slate-950">{value}</p>{helper && <p className="mt-1 text-[7px] leading-3 text-slate-400">{helper}</p>}</ResearchSection>;
}

function TourInfoCloud({
  title,
  body,
  side = "right",
}: {
  title: string;
  body: string;
  side?: "left" | "right" | "top" | "bottom";
}) {
  const connector = side === "left"
    ? "right-[-42px] top-1/2 h-px w-10"
    : side === "top"
      ? "bottom-[-36px] left-1/2 h-9 w-px"
      : side === "bottom"
        ? "top-[-36px] left-1/2 h-9 w-px"
        : "left-[-42px] top-1/2 h-px w-10";
  const dot = side === "left"
    ? "-right-[47px] top-[calc(50%-4px)]"
    : side === "top"
      ? "-bottom-[42px] left-[calc(50%-4px)]"
      : side === "bottom"
        ? "-top-[42px] left-[calc(50%-4px)]"
        : "-left-[47px] top-[calc(50%-4px)]";

  return (
    <div className="psylattice-card-in pointer-events-none relative w-[285px] rounded-[18px] border border-cyan-300/55 bg-[#1f3b4d]/[0.98] px-4 py-4 text-white shadow-[0_18px_46px_rgba(15,23,42,.26),0_0_0_3px_rgba(255,255,255,.76)] backdrop-blur-xl">
      <span className={`absolute bg-cyan-300 ${connector}`} />
      <span className={`absolute h-2.5 w-2.5 rounded-full border-2 border-[#1f3b4d] bg-cyan-300 shadow-[0_0_0_2px_rgba(255,255,255,.82)] ${dot}`} />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200">
            Feature highlight
          </p>
          <p className="mt-1.5 text-[12px] font-semibold leading-[16px] text-white">
            {title}
          </p>
          <p className="mt-1.5 text-[9.5px] leading-[15px] text-slate-200">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}


function StudyBuilderSidePanels() {
  const components = [
    ["Consent", true],
    ["Participant demographics", true],
    ["Baseline / questionnaires", true],
    ["Cognitive tasks", false],
    ["Ambulatory / EMA / ESM", false],
    ["Follow-up assessments", false],
    ["Wearables", false],
    ["Passive / device context", false],
    ["Participant uploads", false],
  ] as const;

  return (
    <div className="space-y-3">
      <ResearchSection>
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="text-[10px] font-semibold text-slate-900">Study components</p>
        </div>
        <div className="space-y-3 p-4">
          {components.map(([label, included]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-[8px] font-medium text-slate-700">{label}</span>
              <ResearchPill active={included}>{included ? "Included" : "Off"}</ResearchPill>
            </div>
          ))}
        </div>
      </ResearchSection>

      <ResearchSection>
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-[10px] font-semibold text-slate-900">Builder safeguards</p>
        </div>
        <div className="space-y-3 p-4 text-[7px] leading-4 text-slate-500">
          <p>
            Consent content must match the approved ethics protocol; PsyLattice does not decide whether a consent waiver or optional component is ethically sufficient.
          </p>
          <p>
            Demographic fields can include direct identifiers, but collect names, email addresses or similarly identifying data only when the approved protocol and data-management plan require them.
          </p>
          <p>
            Ambulatory scheduling is optional and should only be enabled when it belongs to the research design.
          </p>
          <p>
            Published questionnaire, consent and cognitive-task versions are pinned for historical reproducibility; later library edits do not silently alter an existing study. Study flow order is saved separately from the content of each element.
          </p>
        </div>
      </ResearchSection>
    </div>
  );
}

function StudyBuilderStepNav({ active }: { active: number }) {
  const steps = [
    "1. Overview",
    "2. Study components",
    "3. Study flow",
    "4. Consent",
    "5. Demographics",
    "6. Baseline measures",
    "7. Recruitment",
    "8. Review",
  ];

  return (
    <ResearchSection>
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-[11px] font-semibold text-slate-900">Study creation</p>
        <p className="mt-1 text-[7px] text-slate-500">
          The workflow changes automatically according to the components you select.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 px-5 py-4">
        {steps.map((label, index) => (
          <ResearchPill key={label} active={index === active}>
            {label}
          </ResearchPill>
        ))}
      </div>
    </ResearchSection>
  );
}

function StudyBuilderFooter({ step, continueDisabled = false }: { step: number; continueDisabled?: boolean }) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
      <div className="flex gap-2">
        <button
          className={`rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[8px] font-semibold shadow-sm ${step === 0 ? "text-slate-300" : "text-slate-700"}`}
        >
          Back
        </button>
        <button
          className={`rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[8px] font-semibold shadow-sm ${continueDisabled ? "text-slate-300" : "text-slate-800"}`}
        >
          Continue
        </button>
      </div>
      <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-[8px] font-semibold text-white shadow-sm">
        Save draft
      </button>
    </div>
  );
}

function CognitiveLabTourDemo({ step }: { step: number }) {
  const focusClass = (index: number) =>
    step === index
      ? "relative z-10 rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)] transition-all duration-300"
      : "relative transition-all duration-300";

  const labTabs = ["Overview", "Learn", "Task Templates", "My Cognitive Tasks", "Batteries", "Pilot Sessions"];
  const topHero = (
    <ResearchSection className="p-5">
      <div className="flex items-start justify-between gap-6">
        <div className="max-w-[620px]">
          <div className="flex flex-wrap items-center gap-2">
            <ResearchPill active>Cognitive Lab · 2M</ResearchPill>
            <ResearchPill>Tasks + Batteries + Preview + Study execution</ResearchPill>
          </div>
          <h2 className="mt-3 max-w-[560px] text-[21px] font-semibold leading-[1.05] tracking-[-0.03em] text-slate-950">
            Build reusable cognitive tasks and batteries, then place them inside complete PsyLattice studies.
          </h2>
          <p className="mt-3 max-w-[650px] text-[8px] leading-4 text-slate-500">
            Cognitive Lab owns reusable task definitions, version history and cognitive batteries. Study Builder owns when and where they run in the participant flow. Participant Runner executes them, and Research Data owns the resulting trial-level dataset.
          </p>
        </div>
        <div className="grid w-[330px] grid-cols-3 gap-3">
          {[["19","Starter templates"],["22","My tasks"],[step === 0 ? "5" : "3","Active pilot links"]].map(([value,label], index)=>(
            <ResearchSection key={label} className="min-h-[126px] p-4">
              <p className="text-[8px] font-semibold text-cyan-700">{index===0 ? "▥" : index===1 ? "♙" : "↗"}</p>
              <p className="mt-3 text-[17px] font-semibold text-slate-950">{value}</p>
              <p className="mt-1 text-[7px] text-slate-400">{label}</p>
            </ResearchSection>
          ))}
        </div>
      </div>
    </ResearchSection>
  );

  const tabBar = (active: string) => (
    <ResearchSection className="px-2 py-1.5">
      <div className="flex items-center gap-1">
        {labTabs.map((tab) => (
          <span key={tab} className={`rounded-full px-3 py-2 text-[7.5px] font-semibold ${tab === active ? "border border-cyan-300 bg-cyan-50 text-cyan-900 shadow-sm" : "text-slate-500"}`}>
            {tab === "Overview" ? "◌" : tab === "Learn" ? "▣" : tab === "Task Templates" ? "⌁" : tab === "My Cognitive Tasks" ? "♙" : tab === "Batteries" ? "⬢" : "⌁"} &nbsp;{tab}
          </span>
        ))}
      </div>
    </ResearchSection>
  );

  if (step === 0) {
    return (
      <div className="space-y-4 pb-6">
        <ResearchSection className="p-5">
          <div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div>
          <h2 className="mt-3 text-[18px] font-semibold tracking-tight text-slate-950">Cognitive Lab</h2>
          <p className="mt-1 max-w-[680px] text-[8px] text-slate-500">Create reusable cognitive task definitions, start from PsyLattice templates, and prepare versioned tasks for experiments and longitudinal research.</p>
        </ResearchSection>
        <div id="cognitive-overview" className={focusClass(0)}>
          {topHero}
          <div className="mt-3">{tabBar("Overview")}</div>
          <div className="mt-3 grid grid-cols-[1.15fr_.85fr] gap-3">
            <ResearchSection className="p-4">
              <p className="text-[7px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Workflow foundation</p>
              <p className="mt-1 text-[9px] font-semibold text-slate-800">One task, reusable across many studies.</p>
              <div className="mt-3 flex gap-2"><ResearchPill active>▣ Learn how it works</ResearchPill><ResearchPill dark>Browse templates →</ResearchPill></div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[["01","Cognitive Lab","Create or clone a reusable task definition."],["02","Version","Freeze the exact task configuration used in research."],["03","Study Builder","Choose when the task is administered."],["04","Research Data","Keep trial-level results aligned with the study."]].map(([n,t,b])=>(
                  <div key={n} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-[7px] font-semibold text-cyan-700">{n}</p><p className="mt-2 text-[7.5px] font-semibold text-slate-800">{t}</p><p className="mt-1 text-[6.2px] leading-3 text-slate-400">{b}</p></div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-3"><p className="text-[7px] font-semibold text-slate-700">✣ What Cognitive Lab does now</p><p className="mt-1 text-[6.5px] leading-3 text-slate-500">The task templates, personal Cognitive Task Library, visual Task Builder, calibrated Preview runner and Pilot Sessions work together. Publish a tested version when it is ready to be selected inside Study Builder.</p></div>
            </ResearchSection>
            <ResearchSection className="p-4">
              <p className="text-[7px] font-semibold uppercase tracking-[0.16em] text-slate-400">Quick start</p>
              <p className="mt-1 text-[9px] font-semibold text-slate-800">Start from a task family or create your own.</p>
              <div className="mt-3 space-y-2">
                {["Adaptive Card Sorting Task (WCST-style)","AX Continuous Performance Task","Balloon Analogue Risk Task (BART)"].map((name,i)=><div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"><div><p className="text-[7px] font-semibold text-slate-700">◌ &nbsp;{name}</p><p className="mt-0.5 text-[6px] text-slate-400">{i===0?"Set shifting":i===1?"Context processing":"Decision Making"}</p></div><span className="text-slate-300">→</span></div>)}
              </div>
              <button className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-2 text-[7px] font-semibold text-slate-600">＋ Create blank cognitive task</button>
            </ResearchSection>
          </div>
          <div className="absolute right-5 top-[220px] z-30"><TourInfoCloud title={cognitiveTourSteps[0].calloutTitle} body={cognitiveTourSteps[0].calloutBody} side="right" /></div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-3 pb-6">
        {tabBar("Learn")}
        <div id="cognitive-learn" className={focusClass(1)}>
          <ResearchSection className="overflow-hidden">
            <div className="grid grid-cols-[270px_1fr]">
              <div className="border-r border-slate-200 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700">▣</div>
                <p className="mt-3 text-[7px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Cognitive Lab guides</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-900">Learn by seeing how the task works.</p>
                <p className="mt-2 text-[7px] leading-3.5 text-slate-500">Short visual explanations, illustrated configurations and complete task examples — built directly into PsyLattice.</p>
                <div className="mt-3 flex flex-wrap gap-1"><ResearchPill active>No screenshots</ResearchPill><ResearchPill active>Visual examples</ResearchPill><ResearchPill active>Research workflow</ResearchPill></div>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3">
                {[["How Cognitive Lab works","See the complete path from template to research data.","2 min"],["Understand the Task Builder","Blocks, trials, steps and the trial table — visually.","3 min"],["Set up participant responses","Keys, buttons, correct answers and reaction time.","3 min"],["Example: build a Stroop task","A complete example you can copy and adapt.","5 min"],["Preview and pilot your task","Test timing and usability before study deployment.","2 min"]].map(([t,b,time],i)=><div key={t} className={`rounded-xl border p-3 ${i===0?"border-cyan-300 bg-cyan-50/30":"border-slate-200 bg-white"}`}><div className="flex justify-between"><span className="text-cyan-700">◌</span><span className="text-[6px] text-slate-400">{time}</span></div><p className="mt-3 text-[7px] font-semibold text-slate-800">{t}</p><p className="mt-1 text-[6.2px] leading-3 text-slate-400">{b}</p></div>)}
              </div>
            </div>
          </ResearchSection>
          <ResearchSection className="mt-3 p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><div><p className="text-[6.5px] font-semibold uppercase tracking-[0.13em] text-slate-400">Currently viewing</p><p className="text-[7px] font-semibold text-slate-700">How Cognitive Lab works</p></div><ResearchPill>♙ Cognitive Lab manual · Phase 1</ResearchPill></div>
            <p className="mt-4 text-[7px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Visual guide · Start here</p>
            <p className="mt-1 text-[13px] font-semibold text-slate-900">Cognitive Lab in one picture</p>
            <p className="mt-2 text-[7px] leading-3.5 text-slate-500">You do not build a whole study here. Cognitive Lab creates reusable task definitions. You test them here, then later place a locked version inside a PsyLattice study.</p>
            <div className="mt-3 grid grid-cols-5 gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              {[['1','Template','Pick a task family'],['2','Build','Edit the exact task'],['3','Preview','Run it yourself'],['4','Pilot','Test with others'],['5','Study','Deploy the locked version']].map(([n,t,b])=><div key={n} className="rounded-lg bg-white p-3 shadow-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-50 text-[6px] font-bold text-cyan-700">{n}</span><p className="mt-3 text-[7px] font-semibold text-slate-700">{t}</p><p className="mt-1 text-[6px] text-slate-400">{b}</p></div>)}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">{[["Choose a task family","Start from Stroop, Flanker, Go/No-Go, N-back, reaction time or a blank task."],["Build the exact trial","Arrange fixation, stimulus, participant response and the pause before the next trial."],["Test before deployment","Preview it yourself, then create a pilot link. The final study should use a version you have already checked."]].map(([t,b],i)=><div key={t} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[7px] font-semibold text-slate-800">{i+1} &nbsp;{t}</p><p className="mt-1 text-[6.2px] leading-3 text-slate-400">{b}</p></div>)}</div>
          </ResearchSection>
          <div className="absolute right-5 top-[110px] z-30"><TourInfoCloud title={cognitiveTourSteps[1].calloutTitle} body={cognitiveTourSteps[1].calloutBody} side="right" /></div>
        </div>
      </div>
    );
  }

  const taskCards = [
    ["Simple Reaction Time","RESPONSE SPEED","Basic response latency to a single predictable target.",["Mean reaction time","Median reaction time","Omissions"],"3–5 min","Simple","Attention","Ready to customise"],
    ["Choice Reaction Time","CHOICE SPEED","Response selection speed when different stimuli require different responses.",["Correct RT","Accuracy","Choice errors"],"4–6 min","Simple","Attention","Ready to customise"],
    ["Psychomotor Vigilance Task","VIGILANCE","Sustained vigilance through responses to an unpredictable visual target.",["Median RT","Mean RT","Lapses","False starts"],"4–8 min","Simple","Attention","Ready to customise"],
    ["Go / No-Go Task","RESPONSE INHIBITION","Response execution to frequent Go stimuli and withholding to infrequent No-Go stimuli.",["Go RT","Go accuracy","Commission errors","Omission errors"],"5–8 min","Simple","Inhibitory Control","Ready to customise"],
    ["Stop-Signal Task","ACTION CANCELLATION","The latency of action cancellation after a stop signal, alongside Go performance and adaptive stop-signal delay.",["SSRT","Mean SSD","Stop success","Go RT"],"7–10 min","Intermediate","Inhibitory Control","Runner ready"],
    ["Sustained Attention to Response Task","SUSTAINED ATTENTION","Sustained attention and failures to withhold a habitual response to a rare target.",["Commission errors","Omission errors","Go RT","RT variability"],"5–8 min","Simple","Attention","Ready to customise"],
    ["Corsi Block-Tapping Task","VISUOSPATIAL SPAN","Visuospatial short-term memory span in Forward mode and spatial sequence manipulation/working-memory performance when Backward mode is enabled.",["Forward span","Backward span","Product score","Sequence accuracy"],"3–8 min","Intermediate","Working Memory","Runner ready"],
    ["Adaptive Card Sorting Task (WCST-style)","SET SHIFTING","Rule discovery, feedback-based set shifting and persistence with a previously reinforced sorting rule after an unannounced rule change.",["Categories completed","Perseverative errors","Nonperseverative errors","Failure to maintain set"],"8–20 min","Advanced","General","Runner ready"],
    ["Balloon Analogue Risk Task (BART)","DECISION MAKING","Behavioral risk taking under uncertainty through repeated pump-versus-collect decisions.",["Adjusted mean pumps","Mean pumps across balloons","Explosion rate","Exploded balloons"],"6–15 min","Intermediate","Decision Making","Runner ready"],
  ] as const;

  const TaskLibrary = ({ withDrawer = false }: { withDrawer?: boolean }) => (
    <div className="relative min-h-[820px] space-y-3">
      <ResearchSection className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div><div className="flex items-center gap-2"><p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Cognitive Task Library</p><ResearchPill>19 templates</ResearchPill></div><p className="mt-2 text-[10px] font-semibold text-slate-900">Start from a real paradigm, then make the protocol yours.</p><p className="mt-1 max-w-[660px] text-[7px] leading-3 text-slate-500">Every Ready to customise task below contains an actual starter timeline and trial table that can be cloned into your Task Builder. Use Details to understand the paradigm before editing it.</p></div>
          <div className="mt-7 flex gap-2"><ResearchInput className="w-[210px] text-slate-400">⌕ Search task, construct or output</ResearchInput><ResearchInput className="w-[100px]">All domains ⌄</ResearchInput></div>
        </div>
        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3"><span className="mr-1 text-[6.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">Quick filters</span>{["All","Attention","Control & inhibition","Working memory","Perception"].map((f,i)=><ResearchPill key={f} active={i===0}>{f}</ResearchPill>)}</div>
      </ResearchSection>
      <div className="grid grid-cols-3 gap-3">
        {taskCards.map(([name,construct,description,outputs,duration,level,domain,status], index)=><ResearchSection key={name} className="p-3"><div className="flex justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">◌</div><ResearchPill active>{status}</ResearchPill></div><p className="mt-3 text-[6.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">{construct}</p><p className="mt-1 text-[8px] font-semibold text-slate-900">{name}</p><p className="mt-1 min-h-[30px] text-[6.2px] leading-3 text-slate-500">{description}</p><div className="mt-2 flex flex-wrap gap-1"><ResearchPill>{duration}</ResearchPill><ResearchPill>{level}</ResearchPill><ResearchPill>{domain}</ResearchPill></div><div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">Typical outputs</p><div className="mt-1 flex flex-wrap gap-1">{outputs.map((o)=><span key={o} className="rounded-full bg-white px-2 py-1 text-[5.6px] font-semibold text-slate-500">{o}</span>)}</div></div><div className="mt-2 flex flex-wrap gap-1">{["Desktop","Laptop",...(index<4||index===6?["Tablet","Phone"]:[])].map(d=><span key={d} className="rounded-full border border-slate-200 px-1.5 py-0.5 text-[5.5px] text-slate-400">▣ {d}</span>)}</div><div className="mt-2 grid grid-cols-[1fr_90px] gap-2"><span className="rounded-full border border-slate-200 py-1.5 text-center text-[6px] font-semibold text-slate-600">Details</span><span className="rounded-full bg-slate-950 py-1.5 text-center text-[6px] font-semibold text-white">＋ Use template</span></div></ResearchSection>)}
      </div>
      {withDrawer && <><div className="absolute inset-0 z-20 rounded-[18px] bg-slate-900/25 backdrop-blur-[1px]"/><div className="absolute right-[-12px] top-[-12px] z-30 h-[780px] w-[360px] overflow-hidden rounded-l-[22px] border border-slate-200 bg-[#f6fafb] shadow-[-18px_0_48px_rgba(15,23,42,.18)]"><div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3"><div><p className="text-[6.5px] font-semibold uppercase tracking-[0.14em] text-cyan-700">▱ Visuospatial span</p><p className="text-[8px] font-semibold text-slate-700">Task details</p></div><span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400">×</span></div><div className="space-y-3 overflow-auto p-4"><ResearchSection className="p-3"><div className="flex gap-1"><ResearchPill active>Runner ready</ResearchPill><ResearchPill>3–8 min</ResearchPill><ResearchPill>Intermediate</ResearchPill></div><p className="mt-3 text-[10px] font-semibold">Corsi Block-Tapping Task</p><p className="mt-2 text-[6.7px] leading-3.5 text-slate-500">A digital spatial-span task in which blocks illuminate sequentially and participants reproduce the spatial sequence by clicking or tapping the blocks.</p><div className="mt-3 border-t border-slate-100 pt-3"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">What it measures</p><p className="mt-2 text-[6.5px] leading-3 text-slate-600">Visuospatial short-term memory span in Forward mode and spatial sequence manipulation/working-memory performance when Backward mode is enabled.</p></div></ResearchSection><ResearchSection className="p-3"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">Typical trial flow</p><div className="mt-2 flex flex-wrap items-center gap-1">{["9-block board","Blocks illuminate sequentially","Recall prompt","Tap/click sequence","Adaptive span progression"].map((x,i)=><span key={x} className="flex items-center gap-1"><ResearchPill active>{x}</ResearchPill>{i<4&&<span className="text-slate-300">→</span>}</span>)}</div><p className="mt-2 text-[6px] leading-3 text-slate-500">3 practice sequences + adaptive Forward span from 2 to 9; Backward or combined administration can be enabled in Corsi setup.</p></ResearchSection><div className="grid grid-cols-2 gap-2"><ResearchSection className="p-3"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">Typical outputs</p>{["Forward span","Backward span","Product score","Sequence accuracy","First-tap latency"].map(x=><p key={x} className="mt-2 text-[6px] font-semibold text-slate-600">{x}</p>)}</ResearchSection><ResearchSection className="p-3"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">Device guidance</p><p className="mt-2 text-[6px] leading-3 text-slate-500">Touch tablet or desktop/laptop. Phone is technically supported, but researchers should keep display/device conditions consistent when spatial geometry matters.</p><div className="mt-2 flex flex-wrap gap-1">{["Desktop","Laptop","Tablet","Phone"].map(x=><ResearchPill key={x}>{x}</ResearchPill>)}</div></ResearchSection></div><ResearchSection className="p-3"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">What you can customise</p><div className="mt-2 flex flex-wrap gap-1">{["Forward / backward / both","Starting span","Maximum span","Trials per span","Pass criterion","Practice trials","Highlight duration","Inter-onset interval"].map(x=><ResearchPill key={x}>{x}</ResearchPill>)}</div></ResearchSection></div><div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3"><button className="w-full rounded-full bg-slate-950 py-2.5 text-[7px] font-semibold text-white">＋ Add to My Cognitive Tasks</button></div></div></>}
    </div>
  );

  if (step === 2 || step === 3) {
    return <div id={step===2?"cognitive-templates":"cognitive-details"} className={focusClass(step)}><TaskLibrary withDrawer={step===3}/><div className={`absolute z-40 ${step===2?"right-5 top-[160px]":"left-5 top-[165px]"}`}><TourInfoCloud title={cognitiveTourSteps[step].calloutTitle} body={cognitiveTourSteps[step].calloutBody} side={step===2?"right":"left"}/></div></div>;
  }

  if (step === 4) {
    const tasks = ["Stroop Task","Corsi Block-Tapping Task","Mental Rotation Task","Mental Rotation Task","Balloon Analogue Risk Task (BART)","Corsi Block-Tapping Task","Adaptive Card Sorting Task (WCST-style)","Corsi Block-Tapping Task"];
    return <div className="space-y-3 pb-6"><div>{topHero}</div><div>{tabBar("My Cognitive Tasks")}</div><div id="cognitive-my-tasks" className={focusClass(4)}><div className="grid grid-cols-[1.1fr_.9fr] gap-3"><ResearchSection className="p-4"><div className="flex items-center justify-between"><div><p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-cyan-700">My cognitive tasks</p><p className="mt-1 text-[9px] font-semibold text-slate-800">Your personal library of reusable cognitive tasks.</p></div><ResearchPill dark>＋ Create task</ResearchPill></div><div className="mt-3 space-y-2">{tasks.map((name,i)=><div key={`${name}-${i}`} className={`rounded-xl border px-3 py-2.5 ${i===7?"border-cyan-300 bg-cyan-50/30":"border-slate-200 bg-white"}`}><div className="flex items-center justify-between"><div><p className="text-[7px] font-semibold text-slate-800">{name} <span className="ml-1 rounded-full bg-slate-100 px-2 py-1 text-[5.5px] text-slate-500">Draft v1</span></p><p className="mt-1 text-[6px] text-slate-400">{name.includes('Corsi')?'Working Memory':name.includes('Stroop')?'Inhibitory Control':name.includes('Mental')?'Perception':'General'} · Updated {i<2?'05 Sep 2026':i<4?'31 Aug 2026':'30 Aug 2026'}</p></div><ResearchPill>Draft only</ResearchPill></div></div>)}</div></ResearchSection><ResearchSection className="p-4"><p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-slate-400">Selected task</p><p className="mt-2 text-[9px] font-semibold text-slate-800">Corsi Block-Tapping Task</p><p className="mt-1 text-[6.5px] leading-3 text-slate-500">A digital spatial-span task in which blocks illuminate sequentially and participants reproduce the spatial sequence by clicking or tapping the blocks.</p><div className="mt-4 grid grid-cols-3 gap-2">{[["Working version","Draft v1","Draft"],["Study-ready version","Not published yet","Study Builder uses only frozen published versions"],["Source","PsyLattice","template"]].map(([l,v,h])=><div key={l} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">{l}</p><p className="mt-2 text-[7px] font-semibold text-slate-800">{v}</p><p className="mt-1 text-[5.7px] leading-3 text-slate-400">{h}</p></div>)}</div><div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-3"><p className="text-[7px] font-semibold text-slate-700">Personal Cognitive Task Library</p><p className="mt-1 text-[6px] leading-3 text-slate-500">Preview and pilot your working draft. When it is ready, publish that exact version for studies. Published versions stay frozen so later edits cannot silently change an existing protocol.</p></div><div className="mt-3 grid grid-cols-2 gap-2"><ResearchPill className="py-2">Open Task Builder →</ResearchPill><span className="rounded-lg bg-slate-950 px-3 py-2 text-center text-[6.5px] font-semibold text-white">✓ Mark ready for studies</span></div></ResearchSection></div><div className="absolute right-5 top-20 z-30"><TourInfoCloud title={cognitiveTourSteps[4].calloutTitle} body={cognitiveTourSteps[4].calloutBody} side="right"/></div></div></div>;
  }

  const BuilderShell = ({ mode }: { mode: "corsi" | "stroop-timeline" | "stroop-add" | "stroop-table" | "stroop-random" | "stroop-score" }) => {
    const corsi = mode === "corsi";
    const table = mode === "stroop-table";
    const random = mode === "stroop-random";
    const score = mode === "stroop-score";
    const addMenu = mode === "stroop-add";
    const title = corsi ? "Corsi Block-Tapping Task" : "Stroop Task";
    return <ResearchSection className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400">←</span><div><div className="flex items-center gap-2"><ResearchPill active>Cognitive Task Builder</ResearchPill><ResearchPill active>Draft v1 · draft</ResearchPill></div><p className="mt-1 text-[14px] font-semibold text-slate-900">{title}</p><p className="mt-1 text-[6.5px] text-slate-400">Build the task definition here, save it, then run an isolated browser Preview with reaction-time capture and timing diagnostics.</p></div></div><div className="flex gap-2"><ResearchPill active>▣ Preview task</ResearchPill><ResearchPill dark>▣ Save draft</ResearchPill></div></div>
      <div className="grid grid-cols-[180px_1fr_225px]">
        <aside className="border-r border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><div><p className="text-[6px] font-semibold uppercase tracking-[0.14em] text-slate-400">Structure</p><p className="mt-1 text-[8px] font-semibold text-slate-700">{corsi?'Corsi flow':'Blocks'}</p></div>{!corsi&&<ResearchPill>＋ Add block⌄</ResearchPill>}</div>{corsi?<><div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/40 p-3 text-[6px] leading-3 text-slate-500">Practice → adaptive span → complete. This sequence is fixed so the dedicated spatial runtime stays reproducible; customise the protocol in Corsi setup.</div><div className="mt-3 space-y-2">{[["01","Corsi practice","Dedicated Spatial Practice"],["02","Adaptive Corsi span","Adaptive Spatial Span"],["03","Complete","Completion Screen"]].map(([n,t,b],i)=><div key={n} className={`rounded-xl border p-3 ${i===0?'border-cyan-300 bg-cyan-50/30':'border-slate-200 bg-white'}`}><div className="flex gap-2"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[6px] font-bold ${i===0?'bg-cyan-700 text-white':'bg-slate-100 text-slate-500'}`}>{n}</span><div><p className="text-[7px] font-semibold text-slate-700">{t}</p><p className="mt-1 text-[5.7px] text-slate-400">{b}</p></div></div></div>)}</div></>:<><div className="mt-3 space-y-2">{[["01","Instructions","Instructions · 0 Steps · 0 Rows"],["02","Practice","Practice · 4 Steps · 4 Rows"],["03","Experimental","Experimental · 4 Steps · 8 Rows"]].map(([n,t,b],i)=><div key={n} className={`rounded-xl border p-3 ${(table||random||score) ? i===1?'border-cyan-300 bg-cyan-50/30':'border-slate-200 bg-white' : i===0?'border-cyan-300 bg-cyan-50/30':'border-slate-200 bg-white'}`}><div className="flex gap-2"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[6px] font-bold ${((table||random||score)&&i===1)||(!(table||random||score)&&i===0)?'bg-cyan-700 text-white':'bg-slate-100 text-slate-500'}`}>{n}</span><div><p className="text-[7px] font-semibold text-slate-700">{t}</p><p className="mt-1 text-[5.7px] text-slate-400">{b}</p></div></div></div>)}</div><div className="mt-2 flex gap-1">{['↑','↓','▣','🗑'].map(x=><ResearchPill key={x}>{x}</ResearchPill>)}</div></>}</aside>
        <main className="min-w-0 bg-white p-4">{corsi?<><div className="flex rounded-xl border border-slate-200 p-1"><ResearchPill active>▣ Corsi setup</ResearchPill><ResearchPill>⌁ Scoring & devices</ResearchPill></div><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-[16px] border border-cyan-300 bg-cyan-50/20 p-4"><p className="text-[6.5px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Dedicated spatial paradigm</p><p className="mt-1 text-[12px] font-semibold text-slate-900">Corsi Block-Tapping</p><p className="mt-2 text-[6.5px] leading-3 text-slate-500">Blocks illuminate one at a time. After the sequence ends, the participant reproduces it by clicking or tapping the same blocks. PsyLattice adapts the sequence length and scores the exact spatial order automatically.</p><ResearchPill active className="mt-3">Spatial runtime</ResearchPill><div className="mt-3 grid grid-cols-4 gap-2">{[["Mode","Forward"],["Start span","2"],["Max span","9"],["Max experimental trials","≤ 16"]].map(([l,v])=><div key={l} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[5.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">{l}</p><p className="mt-2 text-[9px] font-semibold text-slate-900">{v}</p></div>)}</div></div><div className="rounded-[16px] border border-slate-200 bg-slate-50/60 p-4"><div className="flex justify-between"><div><p className="text-[6.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">Board preview</p><p className="mt-1 text-[9px] font-semibold text-slate-800">9-block digital layout</p></div><ResearchPill>Touch + mouse</ResearchPill></div><div className="relative mt-3 h-[190px] rounded-xl border border-slate-200 bg-white">{[[15,12],[50,5],[76,15],[27,37],[62,32],[84,47],[10,72],[48,72],[73,80]].map(([x,y],i)=><span key={i} className={`absolute flex h-8 w-10 items-center justify-center rounded-lg border bg-white text-[6px] shadow-sm ${i===4?'border-cyan-300 bg-cyan-50 text-cyan-700':'border-slate-200 text-slate-400'}`} style={{left:`${x}%`,top:`${y}%`}}>{i+1}</span>)}</div><p className="mt-2 text-[5.7px] leading-3 text-slate-400">Block numbers are shown only in this researcher preview. Participants see unnumbered blocks.</p></div></div><ResearchSection className="mt-3 p-4"><p className="text-[6.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">Span progression</p><p className="mt-1 text-[9px] font-semibold text-slate-800">Adaptive sequence length</p><p className="mt-1 text-[6px] text-slate-400">The default advances after at least one correct sequence out of two at a span, and stops that mode when the criterion is missed.</p><div className="mt-3 grid grid-cols-3 gap-3">{[["Response mode","Forward only"],["Starting span","2"],["Maximum span","9"],["Trials per span","2"],["Correct trials required to advance","1"],["Practice trials per mode","3"]].map(([l,v])=><div key={l}><p className="mb-1 text-[5.7px] text-slate-400">{l}</p><ResearchInput>{v}</ResearchInput></div>)}</div></ResearchSection></>:<>{/* Stroop generic builder */}<div className="flex rounded-xl border border-slate-200 p-1">{['Trial timeline','Trial table','Randomisation','Scoring & devices'].map(tab=><span key={tab} className={`rounded-full px-3 py-2 text-[7px] font-semibold ${(table&&tab==='Trial table')||(random&&tab==='Randomisation')||(score&&tab==='Scoring & devices')||(!table&&!random&&!score&&tab==='Trial timeline')?'border border-cyan-300 bg-cyan-50 text-cyan-900':'text-slate-500'}`}>{tab}</span>)}</div>{table?<><p className="mt-4 text-[6.5px] font-semibold uppercase tracking-[0.13em] text-cyan-700">Practice</p><div className="flex items-center justify-between"><div><p className="mt-1 text-[12px] font-semibold">Trial table</p><p className="mt-1 text-[6px] text-slate-400">Variables can be referenced by timeline components such as stimulus or correct.</p></div><div className="flex gap-2"><ResearchPill>▧ Import CSV</ResearchPill><ResearchPill dark>＋ Add row</ResearchPill></div></div><div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 p-3"><ResearchInput className="flex-1 text-slate-400">e.g. word, colour, correct</ResearchInput><ResearchPill>Add variable</ResearchPill>{['word','colour','correct'].map(x=><ResearchPill key={x}>{x} ×</ResearchPill>)}</div><div className="mt-3 overflow-hidden rounded-xl border border-slate-200"><div className="grid grid-cols-[28px_1fr_1fr_1fr_1fr_60px_40px] bg-slate-50 px-2 py-2 text-[5.5px] font-semibold uppercase text-slate-400"><span>#</span><span>Condition</span><span>word</span><span>colour</span><span>correct</span><span>Weight</span><span>Use</span></div>{[['congruent','RED','red','r'],['congruent','GREEN','green','g'],['incongruent','RED','green','g'],['incongruent','GREEN','red','r']].map((r,i)=><div key={i} className="grid grid-cols-[28px_1fr_1fr_1fr_1fr_60px_40px] items-center gap-1 border-t border-slate-100 px-2 py-2"><span className="text-[6px] text-slate-400">{i+1}</span>{r.map(x=><ResearchInput key={x} className="min-h-[28px] py-1.5">{x}</ResearchInput>)}<ResearchInput className="min-h-[28px] py-1.5">1</ResearchInput><span className="text-center text-cyan-700">☑</span></div>)}</div></>:random?<><p className="mt-4 text-[6.5px] font-semibold uppercase tracking-[0.13em] text-cyan-700">Task-level controls</p><p className="mt-1 text-[12px] font-semibold">Randomisation</p><p className="mt-1 text-[6px] text-slate-400">These settings are saved with the task and executed by the browser Preview runner.</p><div className="mt-4 grid grid-cols-2 gap-3">{[["Trial order","Random"],["Sampling","Without replacement"],["Max same condition consecutively","3"],["Seed mode","Automatic per participant"]].map(([l,v])=><div key={l}><p className="mb-1 text-[5.8px] font-medium text-slate-500">{l}</p><ResearchInput>{v} &nbsp;⌄</ResearchInput></div>)}</div><div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><span className="text-[6.5px] text-slate-600">Balance condition counts where possible</span><span className="h-5 w-9 rounded-full bg-cyan-600 p-1"><span className="block ml-auto h-3 w-3 rounded-full bg-white"/></span></div><div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><span className="text-[6.5px] text-slate-600">Balance response mappings where possible</span><span className="h-5 w-9 rounded-full bg-slate-200 p-1"><span className="block h-3 w-3 rounded-full bg-white"/></span></div></>:score?<><p className="mt-4 text-[6.5px] font-semibold uppercase tracking-[0.13em] text-cyan-700">Outputs & compatibility</p><p className="mt-1 text-[12px] font-semibold">Scoring, timing and devices</p><p className="mt-1 text-[6px] text-slate-400">Define what Preview retains, the timing diagnostics it collects, and which participant devices the protocol permits.</p><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="mb-1 text-[5.8px] text-slate-500">Metric keys</p><ResearchInput>congruent_rt, incongruent_rt, accuracy, interference</ResearchInput></div><div><p className="mb-1 text-[5.8px] text-slate-500">Precision target</p><ResearchInput>Millisecond &nbsp;⌄</ResearchInput></div></div><div className="mt-3 grid grid-cols-2 gap-2">{['Retain raw trial-level results','Calculate summary outputs','Collect timing diagnostics'].map(x=><div key={x} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><span className="text-[6.5px] text-slate-600">{x}</span><span className="h-5 w-9 rounded-full bg-cyan-600 p-1"><span className="block ml-auto h-3 w-3 rounded-full bg-white"/></span></div>)}</div><div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"><p className="text-[7px] font-semibold text-slate-700">Allowed participant devices</p><div className="mt-2 grid grid-cols-3 gap-2">{['Desktop / laptop','Tablet','Phone'].map(x=><div key={x} className="flex items-center justify-between rounded-xl bg-white px-3 py-2"><span className="text-[6px] text-slate-600">{x}</span><span className="h-5 w-9 rounded-full bg-cyan-600 p-1"><span className="block ml-auto h-3 w-3 rounded-full bg-white"/></span></div>)}</div></div></>:<><div className="mt-4 flex items-center justify-between"><div><p className="text-[6.5px] font-semibold uppercase tracking-[0.13em] text-cyan-700">Instructions</p><p className="mt-1 text-[12px] font-semibold">Trial timeline</p><p className="mt-1 text-[6px] text-slate-400">Components run in order for each trial row in this block.</p></div><div className="flex gap-2"><ResearchPill active>✣ Quick trial</ResearchPill><ResearchPill dark>＋ Add step⌄</ResearchPill></div></div><div className="relative mt-3 flex h-[150px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/40"><div className="text-center"><p className="text-cyan-600">✣</p><p className="mt-2 text-[8px] font-semibold text-slate-700">Start with a complete trial</p><p className="mt-1 text-[6px] text-slate-400">PsyLattice can add the common Fixation → Stimulus → Response → ITI structure for you.</p><ResearchPill dark className="mt-3">Add standard trial</ResearchPill></div>{addMenu&&<div className="absolute right-0 top-[-8px] w-[235px] rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_42px_rgba(15,23,42,.18)]"><p className="text-[6px] font-semibold uppercase tracking-[0.14em] text-slate-400">Choose a timeline step</p><div className="mt-2 grid grid-cols-2 gap-1">{['Fixation','Text','Image','Audio','Video','Shape','Response','ITI','HTML'].map(x=><span key={x} className="rounded-lg bg-slate-50 px-2 py-2 text-[6px] text-slate-600">◌ &nbsp;{x}</span>)}</div></div>}</div></>}</>}</main>
        <aside className="border-l border-slate-200 bg-[#f8fafb] p-3"><p className="text-[7px] font-semibold text-slate-700">☷ Settings</p>{[['Block name',corsi?'Corsi practice':(table||random||score)?'Practice':'Instructions'],['Block key',corsi?'practice':(table||random||score)?'practice':'instructions'],['Block type',corsi?'Practice':(table||random||score)?'Practice':'Instructions'],['Repeat count','1']].map(([l,v])=><div key={l} className="mt-3"><p className="mb-1 text-[5.8px] text-slate-500">{l}</p><ResearchInput>{v}{l==='Block type'?' ⌄':''}</ResearchInput></div>)}<div className="mt-3 rounded-xl border border-cyan-300 bg-cyan-50/40 p-3"><p className="text-[6px] font-semibold uppercase tracking-[0.13em] text-cyan-800">Practice criteria</p>{[['Minimum accuracy','0.8'],['If criterion is not met','Repeat practice'],['Maximum attempts','3']].map(([l,v])=><div key={l} className="mt-3"><p className="mb-1 text-[5.5px] text-slate-500">{l}</p><ResearchInput>{v}</ResearchInput></div>)}</div><ResearchInput className="mt-3 text-center font-semibold">Task-level settings</ResearchInput><p className="mt-3 text-[5.8px] font-medium text-slate-500">Participant instructions</p><div className="mt-1 min-h-[90px] rounded-xl border border-slate-200 bg-white p-3 text-[6.2px] leading-3 text-slate-600">{corsi?'Watch the blocks carefully as they illuminate one at a time. When the sequence is finished, reproduce it by clicking or tapping the blocks.':'Respond to the configured colour dimension while ignoring the word meaning.'}</div></aside>
      </div>
    </ResearchSection>;
  };

  if (step === 5) return <div id="cognitive-corsi-builder" className={focusClass(5)}><BuilderShell mode="corsi"/><div className="absolute right-[245px] top-[110px] z-30"><TourInfoCloud title={cognitiveTourSteps[5].calloutTitle} body={cognitiveTourSteps[5].calloutBody} side="right"/></div></div>;

  if (step === 6 || step === 7) {
    const running = step === 7;
    return <div id={running?"cognitive-preview-run":"cognitive-preview-preflight"} className={focusClass(step)}><div className="relative min-h-[700px] overflow-hidden rounded-[20px] bg-slate-900/65 p-5"><ResearchSection className="mx-auto min-h-[650px] max-w-[1120px] overflow-hidden"><div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400">←</span><div><div className="flex items-center gap-2"><ResearchPill active>Browser Preview · Cognitive 2J Fix2</ResearchPill><span className="text-[6px] text-slate-400">Draft v1</span></div><p className="mt-1 text-[7px] font-semibold text-slate-700">Corsi Block-Tapping Task</p></div></div>{running?<div className="w-[190px]"><div className="flex justify-between text-[6px] text-slate-400"><span>Corsi practice · forward</span><span>1/19</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-full w-[6%] rounded-full bg-cyan-500"/></div></div>:<span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400">×</span>}</div>{!running?<div className="grid grid-cols-[1.2fr_.8fr] gap-6 p-10"><div><ResearchPill dark>◔ Timing preflight</ResearchPill><h3 className="mt-4 max-w-[480px] text-[26px] font-semibold leading-[1.05] tracking-[-0.03em] text-slate-950">Preview the exact saved task definition.</h3><p className="mt-4 max-w-[500px] text-[8px] leading-4 text-slate-500">PsyLattice will execute the saved blocks and trial rows in your browser, record responses with performance.now(), and store this run separately as Preview data.</p><div className="mt-6 rounded-xl border border-violet-200 bg-violet-50/50 p-4 text-[6.5px] leading-3.5 text-violet-700"><strong>Timing note:</strong> browser measurements can be high resolution, but operating-system scheduling, display hardware, browser load and input devices still affect observed timing. Preview diagnostics should be inspected before using a task in research.</div><div className="mt-[210px] flex gap-2"><ResearchPill>⛶ Enter fullscreen</ResearchPill><ResearchPill dark>▷ Start preview</ResearchPill></div></div><ResearchSection className="p-4"><p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-slate-400">Environment</p><div className="mt-3 space-y-2">{['High-resolution timing API','Animation-frame API','Tab is visible','desktop · allowed by task','0/0 media assets preloaded','Refresh sampling stable · 100% consistent frames'].map(x=><div key={x} className="rounded-lg border border-cyan-200 bg-cyan-50/40 px-3 py-2 text-[6.5px] text-slate-600">✓ &nbsp;{x}</div>)}</div><div className="mt-3 rounded-xl border border-slate-200 p-3"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">Display calibration</p><p className="mt-2 text-[6px] leading-3 text-slate-500">PsyLattice detects this display automatically and converts visual durations to whole frames.</p><ResearchPill className="mt-2">↻ Recalibrate</ResearchPill><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg bg-slate-50 p-3"><p className="text-[5.5px] text-slate-400">Detected</p><p className="mt-1 text-[11px] font-semibold">58.8 Hz</p><p className="text-[5.5px] text-slate-400">17 ms / frame</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-[5.5px] text-slate-400">Used for timing</p><p className="mt-1 text-[11px] font-semibold">58.8 Hz</p><p className="text-[5.5px] text-slate-400">17.007 ms / frame</p></div></div><div className="mt-2 grid grid-cols-2 gap-2"><ResearchPill active>Automatic</ResearchPill><ResearchPill>Manual override</ResearchPill></div></div></ResearchSection></div>:<div className="flex min-h-[575px] flex-col items-center justify-center p-10"><div className="flex gap-2"><ResearchPill>Forward Corsi</ResearchPill><ResearchPill active>0/3 taps</ResearchPill></div><p className="mt-3 text-[8px] font-semibold text-slate-600">Tap the blocks in the same order</p><div className="relative mt-4 h-[330px] w-[520px] rounded-[22px] border border-slate-200 bg-white shadow-sm">{[[11,14],[41,7],[73,18],[25,41],[58,38],[82,55],[7,75],[40,76],[70,87]].map(([x,y],i)=><span key={i} className={`absolute h-14 w-[76px] rounded-[14px] border shadow-sm ${i===7?'border-cyan-400 bg-cyan-400/80 shadow-cyan-300/40':'border-slate-200 bg-white'}`} style={{left:`${x}%`,top:`${y}%`}} />)}</div><p className="mt-4 text-[6px] text-slate-400">Tap or click the blocks to reproduce the sequence.</p></div>}</ResearchSection></div><div className="absolute right-5 bottom-5 z-30"><TourInfoCloud title={cognitiveTourSteps[step].calloutTitle} body={cognitiveTourSteps[step].calloutBody} side="right"/></div></div>;
  }

  const modeForStep: Record<number, "stroop-timeline" | "stroop-add" | "stroop-table" | "stroop-random" | "stroop-score"> = {8:"stroop-timeline",9:"stroop-add",10:"stroop-table",11:"stroop-random",12:"stroop-score"};
  return <div id={cognitiveTourSteps[step].targetId} className={focusClass(step)}><BuilderShell mode={modeForStep[step]}/><div className={`absolute z-30 ${step===9?'left-[470px] top-[120px]':'right-[245px] top-[110px]'}`}><TourInfoCloud title={cognitiveTourSteps[step].calloutTitle} body={cognitiveTourSteps[step].calloutBody} side={step===9?'top':'right'}/></div></div>;
}



function ThesisBuilderTourDemo({ step }: { step: number }) {
  const current = thesisTourSteps[Math.max(0, Math.min(thesisTourSteps.length - 1, step))];
  const focusClass = (targetStep: number) =>
    step === targetStep
      ? "relative z-10 rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)] transition-all duration-300"
      : "relative transition-all duration-300";

  const docs = [
    ["thesis work", "this is a test Lorem ipsum dolor sit amet, consectetur…", "Free form", "5 Sep 2026 at 1:57 AM"],
    ["Untitled paper", "Empty document", "Free form", "5 Sep 2026 at 1:53 AM"],
  ];

  const presetOpen = step === 2;
  const formatGuideOpen = step === 3;
  const aiOpen = step === 4;
  const fullScreen = step === 5;
  const resultsFocus = step === 6;

  const EditorToolbar = ({ compact = false }: { compact?: boolean }) => (
    <>
      <div className={`flex items-center gap-1.5 border-b border-slate-200 bg-white ${compact ? "px-3 py-2" : "px-3 py-2"}`}>
        <span className="rounded-lg border border-slate-200 px-2 py-1.5 text-[6.5px] text-slate-500">⇧ Import</span>
        <span className="rounded-lg border border-slate-200 px-2 py-1.5 text-[6.5px] text-slate-500">⇩ Export</span>
        <span id="thesis-presets" className={`relative rounded-lg border px-3 py-1.5 text-[6.5px] font-semibold ${presetOpen || formatGuideOpen ? "border-cyan-300 bg-cyan-50 text-slate-800" : "border-cyan-300 bg-cyan-50 text-slate-700"}`}>
          ✣ {formatGuideOpen ? "APA 7 · Professional paper" : "Free form · Design it yourself"}⌄
          {presetOpen && (
            <div className="absolute left-0 top-[34px] z-50 w-[250px] rounded-xl bg-slate-700 p-2 text-left text-white shadow-[0_18px_45px_rgba(15,23,42,.28)]">
              {[
                "Free form · Design it yourself",
                "APA 7 · Student paper",
                "✓ APA 7 · Professional paper",
                "MLA 9 · Research paper",
                "Chicago / Turabian · Academic paper",
                "IEEE · Conference manuscript",
                "Custom / institution-specific",
              ].map((item) => (
                <div key={item} className="rounded-lg px-3 py-2 text-[7px] font-semibold hover:bg-white/10">{item}</div>
              ))}
            </div>
          )}
        </span>
        <span className="rounded-lg border border-slate-200 px-2 py-1.5 text-[6.5px] text-slate-500">▱ Margins</span>
        <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-[6.5px] text-slate-500">Times New Roman⌄</span>
        <span className="rounded-lg border border-slate-200 px-2 py-1.5 text-[6.5px] text-slate-500">12 pt⌄</span>
        <span className="rounded-lg border border-slate-200 px-2 py-1.5 text-[6.5px] text-slate-500">Normal⌄</span>
        <span className="rounded-lg border border-slate-200 px-2 py-1.5 text-[6.5px] text-slate-500">B</span>
        <span className="rounded-lg border border-slate-200 px-2 py-1.5 text-[6.5px] text-slate-500 italic">I</span>
      </div>
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-3 py-2">
        {["U", "S", "T", "●", "✎", "≡", "☰", "☷", "•", "1.", "≪", "≫", "2.0⌄", "🔗", "Unlink", "▦", "▧", "⌘", "¶", "↶", "↷", "Clear"].map((tool, index) => (
          <span key={`${tool}-${index}`} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[6px] text-slate-500">{tool}</span>
        ))}
      </div>
    </>
  );

  const Paper = ({ showResults = true }: { showResults?: boolean }) => (
    <div className="mx-auto min-h-[610px] max-w-[690px] bg-white px-10 py-8 font-serif text-[8.5px] leading-[1.2] text-black shadow-sm">
      <p>
        Curabitur pretium tiddlywinks tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida.
      </p>
      <p className="mt-5">
        Donec euismod enim et nisi imperdiet elementum. Suspendisse potenti. Vivamus ac urna. Vivamus at eros. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae.
      </p>
      {showResults && (
        <div id="thesis-results" className={resultsFocus ? "mt-4 rounded-lg ring-2 ring-cyan-300 ring-offset-2" : "mt-4"}>
          <p className="italic">Table</p>
          <p className="mt-1 italic">Descriptive statistics</p>
          <p className="mt-1 text-[7px]">Analysis dataset — one row per participant</p>
          <table className="mt-2 w-full border-collapse text-[7px]">
            <thead>
              <tr className="border-y border-black">
                {["Variable", "N", "Missing", "Mean", "Median", "SD", "Min", "Max", "Q1", "Q3"].map((h) => <th key={h} className="px-1 py-1 text-left font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr><td className="px-1 py-1">baseline · General Self-Efficacy Scale · Total</td><td>2</td><td>0</td><td>25</td><td>25</td><td>2.8284</td><td>23</td><td>27</td><td>24</td><td>26</td></tr>
              <tr><td className="px-1 py-1">Stroop Task — accuracy</td><td>1</td><td>1</td><td>0.9375</td><td>0.9375</td><td>—</td><td>0.9375</td><td>0.9375</td><td>0.9375</td><td>0.9375</td></tr>
              <tr className="border-b border-black"><td className="px-1 py-1">Stroop Task — mean RT (ms)</td><td>1</td><td>1</td><td>657.125</td><td>657.125</td><td>—</td><td>657.125</td><td>657.125</td><td>657.125</td><td>657.125</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-[6.5px] italic">Note. Sample standard deviation and variance use n − 1. Mean confidence intervals use the Student t distribution.</p>
        </div>
      )}
      <p className="mt-5">
        Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.
      </p>
    </div>
  );

  const WritingAIPanel = () => (
    <div id="thesis-writing-ai" className="absolute bottom-4 right-4 z-40 w-[320px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.25)]">
      <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300"/><div><p className="text-[8px] font-semibold">PsyLattice Writing AI</p><p className="text-[6px] text-slate-400">Document access off</p></div></div>
        <span className="text-slate-400">↗ &nbsp; ×</span>
      </div>
      <div className="border-b border-cyan-100 bg-cyan-50/60 px-4 py-3 text-[6.5px] leading-3 text-cyan-900">
        <strong>Realtime review: Off.</strong> Document access is off, so questions are sent without the paper.
      </div>
      <div className="p-4">
        <div className="rounded-xl bg-slate-50 p-3 text-[6.5px] leading-3 text-slate-500">
          Ask for help with clarity, academic tone, section organisation, argument structure, wording, or how to improve a paragraph. Turn on <strong>Use current paper</strong> only when you want the assistant to read it.
        </div>
        <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/40 p-3">
          <p className="text-[6.5px] font-semibold text-cyan-900">To restructure the thesis</p>
          <p className="mt-1 text-[6px] leading-3 text-slate-500">1. Select APA / MLA / IEEE / institution preset → 2. Allow current-paper access → 3. Ask AI to restructure to that format → 4. Review the proposed section changes.</p>
        </div>
      </div>
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"><span className="text-[6.5px] text-slate-600">Allow AI to read current paper</span><ResearchPill>Off</ResearchPill></div>
        <div className="mt-2 flex gap-2"><ResearchInput className="flex-1 text-slate-400">Ask the Writing AI…</ResearchInput><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-400 text-white">➤</span></div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div id="thesis-fullscreen" className={focusClass(5)}>
        <div className="relative min-h-[690px] overflow-hidden rounded-[20px] bg-[#e6ecee]">
          <div className="border-b border-cyan-200 bg-cyan-50/70 px-4 py-2 text-[6.5px] font-semibold text-cyan-800">APA 7 Professional page formatting applied.</div>
          <div className="flex h-11 items-center gap-2 border-b border-slate-200 bg-white px-3">
            <ResearchPill>› Files</ResearchPill>
            <div className="flex-1 rounded-xl border border-slate-100 bg-white px-3 py-2 text-[8px] font-semibold text-slate-700">thesis work</div>
            <ResearchPill>new new folder⌄</ResearchPill><ResearchPill>☆ Pin</ResearchPill><ResearchPill>↶</ResearchPill><ResearchPill active>↗</ResearchPill><ResearchPill dark>▣ Saved</ResearchPill><ResearchPill>⌫</ResearchPill>
          </div>
          <EditorToolbar compact />
          <div className="relative h-[560px] overflow-hidden bg-[#e6ecee] px-10 py-5"><Paper /><div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-[7px] font-semibold text-white">− &nbsp;&nbsp; 110% &nbsp;&nbsp; +</div></div>
          <div className="absolute right-6 top-[100px] z-40"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[690px] space-y-3 pb-6">
      <ResearchSection className="p-5">
        <div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div>
        <h2 className="mt-3 text-[18px] font-semibold tracking-tight text-slate-950">Thesis Builder</h2>
        <p className="mt-1 max-w-[620px] text-[8px] leading-4 text-slate-500">Build and organise thesis and paper drafts in nested visual folders, write in a paged academic editor, apply format presets, and use consent-gated AI writing support.</p>
      </ResearchSection>

      <div className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
        {formatGuideOpen && <div className="pointer-events-none absolute inset-0 z-30 bg-slate-700/25" />}
        <div className="grid min-h-[590px] grid-cols-[170px_190px_1fr]">
          <aside id="thesis-files" className={`${focusClass(0)} border-r border-slate-200 bg-[#fbfdfe] p-3`}>
            <div className="flex items-start justify-between"><div><p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Research files</p><p className="mt-1 text-[6.5px] text-slate-400">Folders can contain folders.</p></div><div className="flex gap-1"><ResearchPill>▣</ResearchPill><ResearchPill>‹</ResearchPill></div></div>
            <div className="mt-4 space-y-2 text-[7px] text-slate-600">
              <div className="flex justify-between"><span>▰ All documents</span><span>6</span></div><div className="flex justify-between"><span>□ Unfiled</span><span>1</span></div><div className="flex justify-between"><span>⌄ 📁 thesis name</span><span>0</span></div><div className="rounded-lg bg-cyan-50 px-3 py-2">&nbsp;&nbsp;└ 📁 new new folder <span className="float-right">2</span></div><div className="flex justify-between"><span>⌄ 📁 now file</span><span>1</span></div><div className="px-3">└ 📁 now now <span className="float-right">2</span></div>
            </div>
            <div className="mt-7 rounded-xl border border-cyan-200 bg-cyan-50/60 p-3"><p className="text-[7px] font-semibold text-cyan-900">Private research workspace</p><p className="mt-1 text-[6px] leading-3 text-slate-500">Documents are researcher-owned. The AI assistant does not automatically read them.</p></div>
          </aside>

          <aside className="border-r border-slate-200 bg-[#f8fafb] p-2.5">
            <div className="flex gap-2"><ResearchInput className="flex-1 text-slate-400">⌕ Search documents…</ResearchInput><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-[8px] text-white">＋</span></div>
            <div className="mt-3 space-y-2">{docs.map(([title,body,template,date],i)=><div key={title} className={`rounded-xl border p-3 shadow-sm ${i===0?"border-cyan-300 bg-cyan-50/60":"border-slate-200 bg-white"}`}><p className="text-[7.5px] font-semibold text-slate-700">▧ {title}</p><p className="mt-1 text-[6px] leading-3 text-slate-400">{body}</p><ResearchPill className="mt-2">{template}</ResearchPill><p className="mt-2 text-[6px] text-slate-400">{date}</p></div>)}</div>
          </aside>

          <section id="thesis-editor" className={`${focusClass(1)} min-w-0 bg-[#f4f7f8]`}>
            <div className="flex h-11 items-center gap-2 border-b border-slate-200 bg-white px-3"><div className="flex-1 rounded-lg border border-slate-100 px-3 py-2 text-[8px] font-semibold text-slate-700">thesis work</div><ResearchPill>new new folder⌄</ResearchPill><ResearchPill>☆ Pin</ResearchPill><ResearchPill>↶</ResearchPill><ResearchPill>▣</ResearchPill><ResearchPill>↗</ResearchPill><ResearchPill dark>▣ Saved</ResearchPill><ResearchPill>⌫</ResearchPill></div>
            <EditorToolbar />
            <div className="relative h-[450px] overflow-hidden bg-[#e6ecee] px-7 py-3"><Paper /><span className="absolute bottom-3 right-3 rounded-full bg-slate-950 px-3 py-2 text-[7px] font-semibold text-white shadow-lg">✣ Writing AI</span></div>
          </section>
        </div>

        {step === 0 && <div className="absolute left-[180px] top-[90px] z-40"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="left"/></div>}
        {step === 1 && <div className="absolute right-5 top-[300px] z-40"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}
        {step === 2 && <div className="absolute right-5 top-[105px] z-50"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}
        {step === 6 && <div className="absolute right-5 bottom-5 z-40"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}

        {formatGuideOpen && (
          <div id="thesis-format-guide" className="absolute right-0 top-0 z-40 h-full w-[345px] bg-white p-4 shadow-[-16px_0_40px_rgba(15,23,42,.14)]">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-[8px] font-semibold text-slate-800">Formatting</p><div className="mt-3 space-y-2 text-[6.5px] leading-3 text-slate-600"><p>• 1-inch margins and double spacing are used throughout.</p><p>• Use a consistent legible APA-permitted font; this preset uses 12-point Times New Roman.</p><p>• Left-align body text and use a 0.5-inch first-line paragraph indent.</p><p>• Professional manuscripts normally include a title page, abstract where appropriate, page numbers, and may require a running head.</p></div></div>
            <div className="mt-3 rounded-xl border border-slate-200 p-4"><p className="text-[8px] font-semibold text-slate-800">Typical structure</p><div className="mt-3 grid grid-cols-[20px_1fr] gap-y-2 text-[6.5px] text-slate-600">{["Title page","Abstract","Keywords","Introduction","Method","Results","Discussion","References","Tables / figures as required"].map((x,i)=><Fragment key={x}><span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[5.5px]">{i+1}</span><span>{x}</span></Fragment>)}</div></div>
            <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-4"><p className="text-[8px] font-semibold text-cyan-900">PsyLattice preset boundary</p><p className="mt-2 text-[6.5px] leading-3 text-slate-500">Formatting presets are a drafting aid. A journal, university, department, supervisor or conference can impose additional or different requirements.</p><p className="mt-2 text-[6.5px] font-semibold text-cyan-800">Custom / institution-specific presets can represent those local rules.</p></div>
            <div className="absolute bottom-5 left-[-305px]"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="left"/></div>
          </div>
        )}

        {aiOpen && <><WritingAIPanel/><div className="absolute right-[340px] top-[255px] z-50"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="left"/></div></>}
      </div>
    </div>
  );
}


function AmbulatoryTourDemo({ step }: { step: number }) {
  const current = ambulatoryTourSteps[Math.max(0, Math.min(ambulatoryTourSteps.length - 1, step))];
  const focusClass = (targetStep: number) =>
    step === targetStep
      ? "relative z-10 rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)] transition-all duration-300"
      : "relative transition-all duration-300";

  const triggerMenuOpen = step === 1;
  const sensorMode = step >= 4;

  return (
    <div className="min-h-[1120px] space-y-4 pb-8">
      <ResearchSection id="ambulatory-protocol" className={`${focusClass(0)} p-5`}>
        <div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div>
        <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-slate-950">Ambulatory Assessment</h2>
        <p className="mt-1 text-[8px] text-slate-500">Design repeated real-world EMA and ESM assessment protocols.</p>
        <div className="mt-4 flex items-center justify-between"><ResearchPill>← Back to Study Builder</ResearchPill><span className="text-[6.5px] text-slate-500">Editing ambulatory protocol for <strong>Untitled research study</strong></span></div>
        <div className="mt-4 rounded-[16px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3"><p className="text-[9px] font-semibold text-slate-900">Ambulatory Assessment</p><p className="mt-1 text-[6.5px] text-slate-500">The Research workspace uses the same nested, conditional ambulatory engine as Clinical.</p></div>
          <div className="p-4">
            <div className="grid grid-cols-[1fr_170px] gap-3"><div><p className="mb-1 text-[6px] text-slate-400">Study</p><ResearchInput>Untitled research study⌄</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Duration (days)</p><ResearchInput>14</ResearchInput></div></div>
            <p className="mb-1 mt-3 text-[6px] text-slate-400">Protocol name</p><ResearchInput>Ambulatory protocol</ResearchInput>
            <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-slate-200 p-3"><p className="text-[7px] font-semibold text-slate-700">☑ Enable study email reminders</p><p className="mt-1 text-[6px] leading-3 text-slate-400">Time-contingent schedules can create reminder emails after the participant supplies an email address and explicitly enables reminders.</p></div><div className="rounded-xl border border-slate-200 p-3"><p className="text-[7px] font-semibold text-slate-700">□ Allow participant feedback summaries</p><p className="mt-1 text-[6px] leading-3 text-slate-400">Off by default. Study participants normally see adherence and progress, not psychological score feedback.</p></div></div>
          </div>
        </div>
        {step === 0 && <div className="absolute right-5 top-[160px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}
      </ResearchSection>

      <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 px-4 py-3"><p className="text-[8px] font-semibold text-cyan-900">Unified PsyLattice Ambulatory Builder</p><p className="mt-1 text-[6.5px] leading-3 text-slate-500">The same protocol engine is used for Research and Clinical workspaces. It supports time-, participant-, event- and Health Connect sensor-contingent sampling while keeping Research records pseudonymous and Clinical records client-controlled.</p></div>

      <ResearchSection id="ambulatory-trigger-types" className={`${focusClass(1)} border-l-[3px] ${sensorMode ? "border-l-slate-950 bg-cyan-50/20" : "border-l-cyan-500"} p-4`}>
        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ResearchPill dark={sensorMode} active={!sensorMode}>{sensorMode ? "● SENSOR CONTINGENT" : "● TIME CONTINGENT"}</ResearchPill><span className="text-[6px] text-slate-400">{sensorMode ? "Sensor · Health Connect" : "Fixed · 09:00"}</span></div><button className="rounded-lg border border-rose-200 px-3 py-2 text-[7px] font-semibold text-rose-500">Remove check-in</button></div>
        <div className="mt-4 grid grid-cols-[1fr_200px] gap-3"><div><p className="mb-1 text-[6px] text-slate-400">Check-in / event title</p><ResearchInput>Morning</ResearchInput></div><div className="relative"><p className="mb-1 text-[6px] text-slate-400">Trigger</p><ResearchInput>{sensorMode ? "Sensor / Health Connect event" : "Fixed time"} ⌄</ResearchInput>{triggerMenuOpen && <div className="absolute right-0 top-[48px] z-40 w-[220px] rounded-xl bg-slate-700 p-1.5 text-white shadow-[0_18px_45px_rgba(15,23,42,.30)]">{["✓ Fixed time","Random within window","Interval contingent","Event contingent","Participant/client initiated","Sensor / Health Connect event"].map((x)=><div key={x} className={`rounded-md px-3 py-2 text-[7px] ${x.startsWith('✓')?'bg-blue-500':'hover:bg-white/10'}`}>{x}</div>)}</div>}</div></div>
        {step === 1 && <div className="absolute left-[260px] top-[105px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="left"/></div>}
      </ResearchSection>

      {!sensorMode && (
        <>
          <ResearchSection id="ambulatory-time-checkin" className={`${focusClass(2)} border-l-[3px] border-l-cyan-500 p-4`}>
            <div className="grid grid-cols-2 gap-3"><div><p className="mb-1 text-[6px] text-slate-400">Check-in time</p><ResearchInput>09:00 AM</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Response window (minutes)</p><ResearchInput>60</ResearchInput></div></div>
            <div className="mt-3 rounded-xl border border-slate-200 p-3"><p className="text-[7px] font-semibold text-slate-700">☑ Send an email reminder</p><p className="mt-1 text-[6px] leading-3 text-slate-400">PsyLattice emails this reminder when the time-contingent check-in becomes available. Event-contingent check-ins are not emailed on a clock schedule.</p><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="mb-1 text-[6px] text-slate-400">Email subject</p><ResearchInput>Morning check-in</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Email message</p><ResearchInput>Your PsyLattice check-in is ready.</ResearchInput></div></div></div>
            {step === 2 && <div className="absolute right-5 top-[55px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}
          </ResearchSection>

          <div id="ambulatory-response-blocks" className={focusClass(3)}>
            <ResearchSection className="border-l-[3px] border-l-cyan-500 p-4">
              <div className="flex items-center justify-between"><div className="flex gap-2"><ResearchPill active>SLIDER / RATING</ResearchPill><ResearchPill>Slider / rating⌄</ResearchPill><span className="text-[6px] text-slate-400">Block 1</span></div><button className="rounded-lg border border-rose-200 px-3 py-2 text-[7px] text-rose-500">Remove</button></div>
              <p className="mt-4 text-[6px] text-slate-400">Prompt / title</p><ResearchInput className="mt-1">How stressed do you feel right now?</ResearchInput>
              <div className="mt-3 grid grid-cols-5 gap-2">{[["Minimum","0"],["Maximum","10"],["Step","1"],["Low label","Not at all"],["High label","Extremely"]].map(([l,v])=><div key={l}><p className="mb-1 text-[6px] text-slate-400">{l}</p><ResearchInput>{v}</ResearchInput></div>)}</div>
              <p className="mt-3 text-[6.5px] text-slate-500">☑ Required when shown</p>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-cyan-300 bg-cyan-50/20 p-3"><div><p className="text-[7px] font-semibold text-slate-700">Conditional follow-up blocks</p><p className="mt-1 text-[6px] text-slate-400">Add a complete new block inside this response. It appears only when the response rule you choose is met.</p></div><ResearchPill active>+ Add conditional block</ResearchPill></div>
            </ResearchSection>
            <ResearchSection className="mt-3 border-l-[3px] border-l-slate-950 p-4"><div className="flex items-center justify-between"><div className="flex gap-2"><ResearchPill dark>YES / NO</ResearchPill><ResearchPill>Yes / No⌄</ResearchPill><span className="text-[6px] text-slate-400">Block 2</span></div><button className="rounded-lg border border-rose-200 px-3 py-2 text-[7px] text-rose-500">Remove</button></div><p className="mt-4 text-[6px] text-slate-400">Prompt / title</p><ResearchInput className="mt-1">Did anything important happen since the previous check-in?</ResearchInput></ResearchSection>
            {step === 3 && <div className="absolute right-5 top-[145px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}
          </div>
        </>
      )}

      {sensorMode && (
        <>
          <div id="ambulatory-android-support" className={focusClass(4)}>
            <ResearchSection className="border-l-[3px] border-l-slate-950 bg-cyan-50/25 p-4">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4"><p className="text-[9px] font-semibold text-slate-800">Health Connect sensor trigger</p><p className="mt-2 text-[6.5px] leading-3.5 text-slate-500">The Android companion evaluates permitted Health Connect data on the participant&apos;s device. PsyLattice records a sensor event and opens this ambulatory assessment only when the configured rule matches.</p><div className="mt-3 rounded-xl bg-white p-3"><p className="text-[7px] font-semibold text-slate-700">Android phase 1</p><p className="mt-1 text-[6px] leading-3 text-slate-500">Supported first: heart rate, steps, sleep duration and exercise-session events from Health Connect. The participant grants each Health Connect permission on their Android device.</p></div></div>
            </ResearchSection>
            {step === 4 && <div className="absolute right-5 top-[70px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}
          </div>

          <div id="ambulatory-sensor-rule" className={focusClass(5)}>
            <ResearchSection className="border-l-[3px] border-l-slate-950 bg-cyan-50/25 p-4">
              <div className="grid grid-cols-3 gap-3"><div><p className="mb-1 text-[6px] text-slate-400">Data</p><ResearchInput>Heart rate⌄</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Condition</p><ResearchInput>At least⌄</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Threshold</p><ResearchInput>0</ResearchInput></div></div>
              <div className="mt-3 grid grid-cols-4 gap-3"><div><p className="mb-1 text-[6px] text-slate-400">Active from</p><ResearchInput>08:00 AM</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Active until</p><ResearchInput>10:00 AM</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Maximum prompts / day</p><ResearchInput>3</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Cooldown (minutes)</p><ResearchInput>90</ResearchInput></div></div>
              <div className="mt-3 grid grid-cols-2 gap-3"><div><p className="mb-1 text-[6px] text-slate-400">Store sensor data</p><ResearchInput>Trigger event only⌄</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">What the participant sees about the trigger</p><ResearchInput>Neutral — do not reveal sensor reason⌄</ResearchInput></div></div>
            </ResearchSection>
            {step === 5 && <div className="absolute left-[220px] top-[125px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="left"/></div>}
          </div>

          <div id="ambulatory-trigger-action" className={focusClass(6)}>
            <ResearchSection className="border-l-[3px] border-l-slate-950 bg-cyan-50/25 p-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-semibold text-slate-800">Trigger action</p><p className="mt-1 text-[6.5px] leading-3 text-slate-500">When the Android companion confirms the sensor rule, it creates a PsyLattice prompt and shows this assessment notification.</p><div className="mt-3 grid grid-cols-2 gap-3"><div><p className="mb-1 text-[6px] text-slate-400">Notification title</p><ResearchInput>Morning check-in</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Notification message</p><ResearchInput>Your PsyLattice check-in is ready.</ResearchInput></div></div></div>
              <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-4"><p className="text-[8px] font-semibold text-cyan-900">What the Android companion actually does</p><div className="mt-2 grid grid-cols-4 gap-2">{[["1","Permission","Participant grants Health Connect access on Android."],["2","Evaluate","Companion evaluates the configured permitted-data rule."],["3","Trigger","A matching event creates the PsyLattice ambulatory prompt."],["4","Respond","Participant opens the notification and completes the assessment."]].map(([n,t,b])=><div key={n} className="rounded-xl border border-white bg-white p-3"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[6px] font-semibold text-white">{n}</span><p className="mt-2 text-[7px] font-semibold text-slate-700">{t}</p><p className="mt-1 text-[5.8px] leading-3 text-slate-400">{b}</p></div>)}</div></div>
            </ResearchSection>
            {step === 6 && <div className="absolute right-5 top-[80px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}
          </div>
        </>
      )}
    </div>
  );
}


function AnalysisLabTourDemo({ step }: { step: number }) {
  const current = analysisTourSteps[Math.max(0, Math.min(analysisTourSteps.length - 1, step))];
  const fullScreen = step === 1;

  if (fullScreen) {
    return (
      <div id="analysis-fullscreen" className="relative min-h-[720px] overflow-hidden rounded-[22px] bg-[#f8fafb] text-slate-900 ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4]">
        <div className="flex h-11 items-center gap-2 border-b border-slate-200 bg-white px-3">
          <div className="flex min-w-[150px] items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-cyan-700">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[9px] font-semibold text-slate-900">Analysis Lab</p>
                <span className="rounded-full border border-cyan-200 px-1.5 py-0.5 text-[5.5px] font-semibold uppercase tracking-[0.08em] text-cyan-700">
                  Deterministic
                </span>
              </div>
              <p className="text-[6.5px] text-slate-400">research analysis- data</p>
            </div>
          </div>

          <ResearchInput className="flex-1">research analysis- data⌄</ResearchInput>
          <ResearchInput className="flex-[1.55]">
            Recommended · Analysis dataset — one row per participant⌄
          </ResearchInput>
          <ResearchPill active>☑ TEST data</ResearchPill>
          <ResearchPill dark>◉ Data</ResearchPill>
          <ResearchPill>CSV</ResearchPill>
          <ResearchPill>Exit</ResearchPill>
        </div>

        <div className="flex h-8 items-center gap-2 border-b border-slate-200 bg-white px-4">
          <ResearchPill active>Participant level</ResearchPill>
          <ResearchPill>Recommended</ResearchPill>
          <span className="text-[6px] text-slate-500">
            Questionnaires, demographics and cognitive summaries together in one row per participant.
          </span>
          <span className="ml-auto text-[5.5px] text-slate-400">
            Pseudonymous · direct identifiers hidden · 2 rows · 21 vars · 5 usable · 88% complete
          </span>
        </div>

        <div className="flex h-10 items-center border-b border-slate-200 bg-white px-4">
          <div className="min-w-[250px]">
            <p className="text-[8px] font-semibold text-slate-800">Prepare data</p>
            <p className="mt-0.5 text-[5.8px] text-slate-400">Already one row per participant — no conversion needed.</p>
          </div>
          <div className="mx-auto flex rounded-xl bg-[#102033] p-1 text-[7px] font-semibold text-white shadow-sm">
            {["Explore", "Compare", "Model", "Scales", "Design"].map((tab) => (
              <span key={tab} className={`rounded-lg px-4 py-1.5 ${tab === "Explore" ? "bg-white text-slate-900 ring-2 ring-cyan-300" : "text-slate-300"}`}>
                {tab}
              </span>
            ))}
          </div>
          <span className="min-w-[150px] text-right text-[6px] text-slate-500">Participant view⌄</span>
        </div>

        <div className="grid min-h-[610px] grid-cols-[165px_290px_1fr]">
          <aside className="border-r border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-slate-400">Explore analyses</p>
              <ResearchPill>5</ResearchPill>
            </div>
            <p className="mt-1 text-[6.5px] text-slate-500">Choose a statistical workflow.</p>

            <div className="mt-3 space-y-2">
              {[
                ["Descriptives", "Summaries, distributions and frequencies", false],
                ["Diagnostics", "Normality, outliers and variance checks", false],
                ["Visualisations", "Scatter, distributions, means and interaction plots", false],
                ["Correlations", "Pearson and Spearman associations", true],
                ["Categorical", "Contingency tables, χ², Fisher and effect sizes", false],
              ].map(([title, helper, selected]) => (
                <div key={String(title)} className={`rounded-xl border p-3 ${selected ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-[7.5px] font-semibold">{String(title)}</p>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                  <p className={`mt-1 text-[6px] leading-3 ${selected ? "text-slate-300" : "text-slate-400"}`}>{String(helper)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3">
              <p className="text-[7.5px] font-semibold text-slate-800">✣ Analysis V1</p>
              <p className="mt-1 text-[6px] leading-3 text-slate-500">
                Statistics are computed locally from the selected dataset. AI explains verified results; it does not calculate them.
              </p>
            </div>
          </aside>

          <aside className="border-r border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-semibold text-slate-800">Variables</p>
                <p className="mt-1 text-[6px] text-slate-400">Add variables to the analysis set.</p>
              </div>
              <ResearchPill>Clear</ResearchPill>
            </div>
            <ResearchInput className="mt-3 text-slate-400">⌕ Search variables...</ResearchInput>

            <div className="mt-4 space-y-2 opacity-55">
              {["Export participant identifier", "Test participation flag", "Participant study status"].map((name, index) => (
                <div key={name} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[7px] font-semibold text-slate-600">{name}</p>
                  <ResearchPill className="mt-2">{index === 1 ? "Binary" : index === 2 ? "Nominal" : "Text"}</ResearchPill>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[7px] font-semibold text-slate-700">Analysis variables</p>
              <p className="mt-1 text-[6px] text-slate-400">3 selected</p>
              <div className="mt-2 space-y-2">
                {[
                  "baseline · General Self-Efficacy Scale · Total",
                  "Stroop Task — accuracy",
                  "Stroop Task — mean RT (ms)",
                ].map((name) => (
                  <div key={name} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[6px] text-white">#</span>
                      <p className="text-[6.5px] font-semibold leading-3 text-slate-700">{name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[7px] font-semibold text-slate-700">Statistics</p>
              <p className="mt-1 text-[6px] text-slate-400">Choose what appears in the output table.</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ResearchPill active>Pearson</ResearchPill>
                <ResearchPill>Spearman</ResearchPill>
              </div>
              <p className="mt-3 text-[6px] text-slate-500">☑ Show two-sided p-values</p>
              <p className="mt-2 text-[6px] text-slate-500">☑ Show pairwise valid N</p>
            </div>
          </aside>

          <main className="bg-[#f8fafb] p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[6.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">Results</p>
                  <ResearchPill>Live</ResearchPill>
                </div>
                <h3 className="mt-2 text-[16px] font-semibold text-slate-950">Correlation analysis</h3>
                <p className="mt-1 text-[6.5px] text-slate-500">Pearson matrix with pairwise valid observations.</p>
              </div>
              <div className="flex gap-2">
                <ResearchPill active>Save record</ResearchPill>
                <ResearchPill>Records</ResearchPill>
                <ResearchPill>Copy formatted table</ResearchPill>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              <ResearchMetric label="Method" value="Pearson" helper="Current estimator" />
              <ResearchMetric label="Variables" value="3" helper="Numeric / ordinal" />
              <ResearchMetric label="Pairs" value="3" helper="Unique associations" />
              <ResearchMetric label="Strongest |r|" value="—" helper="No valid pair" />
            </div>

            <ResearchSection className="mt-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-[8px] font-semibold text-slate-800">Correlation matrix</p>
                  <p className="mt-1 text-[5.8px] text-slate-400">Pairwise-complete observations · Pearson product-moment correlation.</p>
                </div>
                <ResearchPill active>3 variables</ResearchPill>
              </div>
              <div className="grid grid-cols-[1.25fr_.9fr_.9fr_.9fr] text-[6px]">
                <div className="bg-slate-50 p-3 font-semibold uppercase text-slate-400">Variable</div>
                <div className="bg-slate-50 p-3 text-slate-400">General Self-Efficacy</div>
                <div className="bg-slate-50 p-3 text-slate-400">Stroop accuracy</div>
                <div className="bg-slate-50 p-3 text-slate-400">Stroop mean RT</div>
                {[
                  ["General Self-Efficacy Scale · Total", "1", "—", "—"],
                  ["Stroop Task — accuracy", "—", "1", "—"],
                  ["Stroop Task — mean RT (ms)", "—", "—", "1"],
                ].flatMap((row, rowIndex) =>
                  row.map((cell, cellIndex) => (
                    <div key={`${rowIndex}-${cellIndex}`} className={`border-t border-slate-100 p-3 ${cellIndex === 0 ? "font-semibold text-slate-700" : "text-slate-500"}`}>
                      {cell}
                      {cellIndex > 0 && cell !== "1" && <p className="mt-1 text-[5px] text-slate-300">p=— · N=1</p>}
                    </div>
                  ))
                )}
              </div>
            </ResearchSection>
          </main>
        </div>

        <button className="absolute bottom-4 right-4 rounded-full bg-slate-950 px-4 py-2 text-[7px] font-semibold text-white shadow-lg">
          ✣ Analysis AI
        </button>
        <div className="absolute right-5 top-[120px] z-40">
          <TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right" />
        </div>
      </div>
    );
  }

  return (
    <div id="analysis-environment" className="relative min-h-[960px] space-y-4 pb-8">
      <ResearchSection className="overflow-hidden bg-[linear-gradient(110deg,#ffffff_0%,#f8fdfe_63%,#f6efff_100%)] p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-[690px]">
            <div className="flex items-center gap-2">
              <ResearchPill active>Analysis Lab · V1</ResearchPill>
              <ResearchPill>Statistics calculated deterministically</ResearchPill>
            </div>
            <h2 className="mt-4 text-[25px] font-semibold tracking-[-0.035em] text-slate-950">
              Turn collected data into research-ready results.
            </h2>
            <p className="mt-3 text-[8px] leading-4 text-slate-500">
              Choose a PsyLattice study and analysis frame, select variables, and build reproducible statistical outputs without leaving the Research workspace.
            </p>
          </div>
          <div className="grid w-[330px] grid-cols-3 gap-2">
            <ResearchMetric label="Rows" value="2" helper="Current frame" />
            <ResearchMetric label="Participants" value="2" helper="Live + TEST" />
            <ResearchMetric label="Variables" value="20" helper="7 numeric hints" />
          </div>
        </div>
      </ResearchSection>

      <ResearchSection className="p-4">
        <div className="grid grid-cols-[.85fr_1.25fr_auto] items-end gap-3">
          <div>
            <p className="mb-1 text-[6px] font-semibold uppercase tracking-[0.1em] text-slate-400">Study</p>
            <ResearchInput>research analysis- data⌄</ResearchInput>
          </div>
          <div>
            <p className="mb-1 text-[6px] font-semibold uppercase tracking-[0.1em] text-slate-400">Analysis dataset</p>
            <ResearchInput>Recommended · Analysis dataset — one row per participant⌄</ResearchInput>
          </div>
          <ResearchPill active className="px-4 py-2">☑ Include TEST data</ResearchPill>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
          <ResearchPill active>Participant level</ResearchPill>
          <ResearchPill>Recommended starting frame</ResearchPill>
          <span className="text-[6px] text-slate-500">Questionnaires, demographics and cognitive summaries together in one row per participant.</span>
          <span className="ml-auto text-right text-[5.5px] font-semibold text-slate-500">
            Identity mode<br />Pseudonymous · direct identifiers hidden
          </span>
        </div>
      </ResearchSection>

      <div className="flex justify-end">
        <ResearchPill active className="px-4 py-2">✣ PsyLattice Auto⌄</ResearchPill>
      </div>

      <ResearchSection className="relative overflow-hidden ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-[linear-gradient(90deg,#ffffff,#f6fdff,#faf5ff)] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-cyan-700">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-semibold text-slate-800">Analysis canvas</p>
                <ResearchPill active>Deterministic</ResearchPill>
              </div>
              <p className="mt-0.5 text-[5.8px] text-slate-400">research analysis- data · Analysis dataset — one row per participant</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ResearchPill dark>◉ PsyLattice data</ResearchPill>
            <ResearchPill>External CSV</ResearchPill>
            <ResearchPill>Analyses ‹</ResearchPill>
            <ResearchPill>Variables ‹</ResearchPill>
            <ResearchPill active>⛶ Full screen</ResearchPill>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 border-b border-slate-100 bg-white p-3">
          <ResearchMetric label="Rows" value="2" />
          <ResearchMetric label="Variables" value="21" />
          <ResearchMetric label="Usable" value="18" />
          <ResearchMetric label="Completeness" value="88%" />
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-2">
          <div>
            <p className="text-[7px] font-semibold text-slate-800">Prepare data</p>
            <p className="text-[5.5px] text-slate-400">Already one row per participant — no conversion needed.</p>
          </div>
          <div className="flex rounded-xl bg-[#102033] p-1 text-[6.5px] font-semibold text-white">
            {["Explore", "Compare", "Model", "Scales", "Design"].map((tab) => (
              <span key={tab} className={`rounded-lg px-4 py-1.5 ${tab === "Explore" ? "bg-white text-slate-900 ring-2 ring-cyan-300" : "text-slate-300"}`}>{tab}</span>
            ))}
          </div>
          <ResearchPill>Participant view⌄</ResearchPill>
        </div>

        <div className="grid min-h-[430px] grid-cols-[160px_280px_1fr]">
          <aside className="border-r border-slate-200 bg-white p-3">
            <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-slate-400">Explore analyses</p>
            <p className="mt-1 text-[6px] text-slate-500">Choose a statistical workflow.</p>
            <div className="mt-3 rounded-xl bg-slate-950 p-3 text-white">
              <p className="text-[7.5px] font-semibold">Descriptives</p>
              <p className="mt-1 text-[6px] leading-3 text-slate-300">Summaries, distributions and frequencies</p>
            </div>
            <div className="mt-2 space-y-2">
              {["Diagnostics", "Visualisations", "Correlations", "Categorical"].map((name) => (
                <div key={name} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[7px] font-semibold text-slate-700">{name}</p>
                </div>
              ))}
            </div>
          </aside>

          <aside className="border-r border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold text-slate-800">Variables</p>
              <ResearchPill>Clear</ResearchPill>
            </div>
            <p className="mt-1 text-[6px] text-slate-400">Add variables to the analysis set.</p>
            <ResearchInput className="mt-3 text-slate-400">⌕ Search variables...</ResearchInput>
            <div className="mt-3 space-y-2">
              {[
                "Export participant identifier",
                "Test participation flag",
                "Participant study status",
                "General Self-Efficacy Scale · Total",
                "Stroop Task — accuracy",
              ].map((name, index) => (
                <div key={name} className={`rounded-xl border p-3 ${index < 3 ? "border-slate-100 opacity-45" : "border-cyan-100 bg-cyan-50/20"}`}>
                  <p className="text-[6.5px] font-semibold text-slate-700">{name}</p>
                </div>
              ))}
            </div>
          </aside>

          <main className="bg-[#f8fafb] p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">Results</p>
                  <ResearchPill>Live</ResearchPill>
                </div>
                <h3 className="mt-2 text-[15px] font-semibold text-slate-950">Descriptive analysis</h3>
                <p className="mt-1 text-[6px] text-slate-500">Output updates immediately when variables or statistics change.</p>
              </div>
              <div className="flex gap-2">
                <ResearchPill active>Save record</ResearchPill>
                <ResearchPill>Records</ResearchPill>
                <ResearchPill>Copy formatted table</ResearchPill>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <ResearchMetric label="Rows analysed" value="2" helper="Current analysis frame" />
              <ResearchMetric label="Variables" value="3" helper="Selected for output" />
              <ResearchMetric label="Numeric" value="3" helper="Scale / ordinal" />
              <ResearchMetric label="Categorical" value="0" helper="Frequency-ready" />
            </div>
            <ResearchSection className="mt-4 p-4">
              <p className="text-[8px] font-semibold text-slate-800">Descriptive statistics</p>
              <div className="mt-3 grid grid-cols-6 border-y border-slate-200 py-2 text-[5.8px] font-semibold text-slate-500">
                {["Variable", "N", "Mean", "Median", "SD", "Missing"].map((x) => <span key={x}>{x}</span>)}
              </div>
              <div className="grid grid-cols-6 py-3 text-[6px] text-slate-600">
                <span>General Self-Efficacy</span><span>2</span><span>25</span><span>25</span><span>2.83</span><span>0</span>
              </div>
            </ResearchSection>
          </main>
        </div>

        <button className="absolute bottom-4 right-4 rounded-full bg-slate-950 px-4 py-2 text-[7px] font-semibold text-white shadow-lg">
          ✣ Analysis AI
        </button>
      </ResearchSection>

      <div className="absolute right-5 top-[390px] z-40">
        <TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right" />
      </div>
    </div>
  );
}

function ResearchDemo({ slideId, dashboardStep = 0, studiesStep = 0, studyBuilderStep = 0, questionnaireStep = 0, cognitiveStep = 0, thesisStep = 0, ambulatoryStep = 0, participantsStep = 0, participantLinksStep = 0, dataDashboardStep = 0, dataExplorerStep = 0, analysisStep = 0, exportStep = 0 }: { slideId: string; dashboardStep?: number; studiesStep?: number; studyBuilderStep?: number; questionnaireStep?: number; cognitiveStep?: number; thesisStep?: number; ambulatoryStep?: number; participantsStep?: number; participantLinksStep?: number; dataDashboardStep?: number; dataExplorerStep?: number; analysisStep?: number; exportStep?: number }) {
  const [query, setQuery] = useState("");
  const [selectedStep, setSelectedStep] = useState("Measures");
  const [selectedTask, setSelectedTask] = useState("Simple Reaction Time");
  const [selectedAnalysis, setSelectedAnalysis] = useState("Descriptives");
  const [selectedThesisSection, setSelectedThesisSection] = useState("thesis work");


  // High-fidelity Research screens based on the live PsyLattice UI.
  if (slideId === "dashboard") {
    const focusClass = (step: number) =>
      dashboardStep === step
        ? "relative z-10 rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)] transition-all duration-300"
        : "relative transition-all duration-300";

    const studies = [
      ["Untitled research study", "Cross-sectional survey · 0 live participants", "Draft"],
      ["Untitled research study", "Cross-sectional survey · 0 live participants", "Draft"],
      ["test study- 2", "Cross-sectional survey · 1 live participant", "Active"],
      ["new study", "Cross-sectional survey · 4 live participants", "Active"],
      ["research analysis- data", "Cross-sectional survey · 2 live participants", "Active"],
    ];

    return (
      <div className="min-h-[980px] space-y-4 pb-6">
        <ResearchSection className="p-5">
          <div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div>
          <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-slate-950">Research overview</h2>
          <p className="mt-1 text-[8px] text-slate-500">Manage your studies, recruitment, ambulatory protocols and research data.</p>
        </ResearchSection>

        <div id="dashboard-overview-metrics" className={focusClass(0)}>
          <div className="grid grid-cols-4 gap-3">
            <ResearchMetric label="Active studies" value="3" helper="6 active live recruitment links" />
            <ResearchMetric label="Live participants" value="7" helper="Excludes test participants and withdrawals" />
            <ResearchMetric label="Completed" value="6" helper="86% of live participants" />
            <ResearchMetric label="Test participants" value="1" helper="Kept separate from live research" />
          </div>
          {dashboardStep === 0 && <div className="absolute right-3 top-[calc(100%+10px)] z-30"><TourInfoCloud title={dashboardTourSteps[0].calloutTitle} body={dashboardTourSteps[0].calloutBody} side="bottom" /></div>}
        </div>

        <div className="grid grid-cols-[1.25fr_.9fr] gap-3 pt-1">
          <div id="dashboard-recent-studies" className={focusClass(1)}>
            <ResearchSection className="overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-4"><p className="text-[10px] font-semibold text-slate-900">Your studies</p><p className="mt-1 text-[6.5px] text-slate-400">Your most recently updated studies from Supabase.</p></div>
              <div className="px-4">
                {studies.map(([name, helper, status], index) => <div key={`${name}-${index}`} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"><div><p className="text-[8.5px] font-semibold text-slate-800">{name}</p><p className="mt-1 text-[6.5px] text-slate-400">{helper}</p><p className="mt-1 text-[6px] text-slate-400">Demographics · Baseline</p></div><ResearchPill active={status === "Active"}>{status}</ResearchPill></div>)}
                <button className="pb-3 text-[7px] font-semibold text-slate-800">View all studies &nbsp; →</button>
              </div>
            </ResearchSection>
            {dashboardStep === 1 && <div className="absolute right-4 top-16 z-30"><TourInfoCloud title={dashboardTourSteps[1].calloutTitle} body={dashboardTourSteps[1].calloutBody} side="right" /></div>}
          </div>

          <div id="dashboard-workspace-status" className={focusClass(2)}>
            <ResearchSection className="h-full min-h-[330px]">
              <div className="border-b border-slate-100 px-4 py-4"><p className="text-[10px] font-semibold text-slate-900">Research workspace status</p></div>
              <div className="space-y-5 p-4">
                {[["Draft studies","Saved studies that have not been activated.","3",true],["Studies without live recruitment","Active or review-ready studies without an active live link.","0",false],["Test participants","Test records remain identifiable and separate from live data.","1",false]].map(([title,helper,value,purple]) => <div key={String(title)} className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-semibold text-slate-700">{String(title)}</p><p className="mt-1 text-[6px] leading-3 text-slate-400">{String(helper)}</p></div><span className={`rounded-full border px-2.5 py-1 text-[7px] font-bold shadow-sm ${purple ? "border-violet-200 bg-violet-50 text-violet-700" : "border-cyan-200 bg-cyan-50 text-cyan-700"}`}>{String(value)}</span></div>)}
              </div>
            </ResearchSection>
            {dashboardStep === 2 && <div className="absolute left-4 top-16 z-30"><TourInfoCloud title={dashboardTourSteps[2].calloutTitle} body={dashboardTourSteps[2].calloutBody} side="left" /></div>}
          </div>
        </div>

        <div id="dashboard-quick-actions" className={focusClass(3)}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-4 py-4"><p className="text-[10px] font-semibold text-slate-900">Quick actions</p><p className="mt-1 text-[6.5px] text-slate-400">Continue your most common research workflows.</p></div>
            <div className="grid grid-cols-4 gap-3 p-4">
              {[["Create study","Build a new survey or longitudinal protocol."],["Find questionnaire","Browse approved and licensed measures."],["Create participant link","Create a TEST or live recruitment link."],["View participants","Inspect real participant and test records."]].map(([title,helper]) => <div key={title} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><p className="text-[8.5px] font-semibold text-slate-800">{title}</p><p className="mt-2 text-[6.5px] leading-3 text-slate-500">{helper}</p></div>)}
            </div>
          </ResearchSection>
          {dashboardStep === 3 && <div className="absolute right-4 top-12 z-30"><TourInfoCloud title={dashboardTourSteps[3].calloutTitle} body={dashboardTourSteps[3].calloutBody} side="right" /></div>}
        </div>

        <div id="dashboard-latest-study" className={focusClass(4)}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-4 py-4"><p className="text-[10px] font-semibold text-slate-900">Latest study</p><p className="mt-1 text-[6.5px] text-slate-400">A live summary of your most recently updated study.</p></div>
            <div className="grid grid-cols-[.9fr_1.1fr] gap-5 p-4">
              <div><div className="flex items-center gap-2"><ResearchPill>Draft</ResearchPill><span className="text-[6px] text-slate-400">Updated 2/9/2026</span></div><p className="mt-3 text-[13px] font-semibold text-slate-900">Untitled research study</p><p className="mt-2 text-[7px] text-slate-500">Cross-sectional survey</p><p className="mt-2 text-[6px] text-slate-400">Demographics · Baseline</p><button className="mt-4 text-[7px] font-semibold text-cyan-800">Open studies &nbsp; →</button></div>
              <div><p className="text-[6.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">Recruitment</p><p className="mt-1 text-[20px] font-semibold text-slate-950">0 / 100</p><p className="mt-1 text-[6.5px] text-slate-400">0% of recruitment target</p><div className="mt-3 flex items-center justify-between text-[6px] text-slate-400"><span>Participant target</span><span>0 / 100</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100" /><div className="mt-4 grid grid-cols-2 gap-3"><ResearchMetric label="Live links" value="0" helper="Active recruitment" /><ResearchMetric label="Participants" value="0" helper="Live, non-withdrawn" /></div></div>
            </div>
          </ResearchSection>
          {dashboardStep === 4 && <div className="absolute right-4 top-20 z-30"><TourInfoCloud title={dashboardTourSteps[4].calloutTitle} body={dashboardTourSteps[4].calloutBody} side="right" /></div>}
        </div>
      </div>
    );
  }

  if (slideId === "studies") {
    const focusClass = (step: number) =>
      studiesStep === step
        ? "relative z-10 rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)] transition-all duration-300"
        : "relative transition-all duration-300";

    const studies = [
      ["Untitled research study", "Cross-sectional survey", "0 / 100", "Draft", "2/9/2026"],
      ["Untitled research study", "Cross-sectional survey", "0 / 100", "Draft", "30/8/2026"],
      ["test study- 2", "Cross-sectional survey", "1 / 100", "Active", "29/8/2026"],
      ["new study", "Cross-sectional survey", "4 / 100", "Active", "26/8/2026"],
      ["research analysis- data", "Cross-sectional survey", "2 / 100", "Active", "25/8/2026"],
      ["cognitive task study", "Cross-sectional survey", "0 / 100", "Draft", "25/8/2026"],
    ];

    return (
      <div className="min-h-[1080px] space-y-4 pb-8">
        <ResearchSection className="p-5">
          <div className="flex gap-2">
            <ResearchPill active>Researcher workspace</ResearchPill>
            <ResearchPill>Live workspace data</ResearchPill>
          </div>
          <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-slate-950">Studies</h2>
          <p className="mt-1 text-[8px] text-slate-500">
            Create, organise and monitor your active and completed research projects.
          </p>
        </ResearchSection>

        <div id="studies-library" className={focusClass(0)}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["All", "Draft", "Review", "Active", "Completed", "Archived"].map((label, index) => (
                <ResearchPill key={label} active={index === 0}>{label}</ResearchPill>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ResearchInput className="w-[190px] text-slate-400">Search your studies...</ResearchInput>
              <button className="rounded-full bg-slate-950 px-4 py-2.5 text-[8px] font-semibold text-white shadow-[0_8px_18px_rgba(15,23,42,.16)]">
                + New study
              </button>
            </div>
          </div>

          <ResearchSection className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Your studies</p>
              <p className="mt-1 text-[7px] text-slate-400">
                Saved directly from your PsyLattice Study Builder.
              </p>
            </div>

            {studies.map(([name, type, participants, status, updated], index) => (
              <div
                key={`${name}-${index}`}
                className={`grid grid-cols-[1fr_110px_125px_55px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 ${index === 0 ? "bg-cyan-50/30" : ""}`}
              >
                <div>
                  <p className="text-[10px] font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-[8px] font-medium text-slate-500">{type}</p>
                  <p className="mt-1 text-[7px] text-slate-400">
                    Consent · Demographics · Baseline questionnaires
                  </p>
                </div>
                <div>
                  <p className="text-[7px] text-slate-400">Participants</p>
                  <p className="mt-1 text-[9px] font-semibold text-slate-800">{participants}</p>
                  <p className="text-[6.5px] text-slate-400">{index === 5 ? "1 test" : "0 test"}</p>
                </div>
                <div>
                  <ResearchInput className="py-1.5">{status} ⌄</ResearchInput>
                  <p className="mt-1 text-[6.5px] text-slate-400">Updated {updated}</p>
                </div>
                <button className="text-[8px] font-semibold text-cyan-800">
                  {index === 0 ? "Opened" : "Open"}
                </button>
              </div>
            ))}
          </ResearchSection>

          {studiesStep === 0 && (
            <div className="absolute right-5 top-[84px] z-30">
              <TourInfoCloud
                title={studiesTourSteps[0].calloutTitle}
                body={studiesTourSteps[0].calloutBody}
                side="right"
              />
            </div>
          )}
        </div>

        <div id="studies-management" className={focusClass(1)}>
          <ResearchSection className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Untitled research study</p>
              <p className="mt-1 text-[7px] text-slate-400">Study overview from your saved configuration.</p>
            </div>

            <div className="grid grid-cols-[1.05fr_.85fr] gap-5 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <ResearchPill>Draft</ResearchPill>
                  <span className="text-[6.5px] text-slate-400">Created 2/9/2026</span>
                </div>
                <p className="mt-4 text-[9px] font-semibold text-slate-800">Cross-sectional survey</p>
                <p className="mt-2 text-[8px] text-slate-500">
                  No participant-facing description has been saved yet.
                </p>

                <p className="mt-5 text-[7px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Components
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ResearchPill>Consent</ResearchPill>
                  <ResearchPill>Demographics</ResearchPill>
                  <ResearchPill>Baseline questionnaires</ResearchPill>
                </div>

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/65 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div>
                      <p className="text-[8px] font-semibold text-amber-900">Protect a live protocol</p>
                      <p className="mt-1 text-[7px] leading-3.5 text-amber-800/80">
                        Draft studies are the safest to edit. Once a live participant link is active or data collection has started, structural changes should be restricted so participants are not exposed to different versions of the same protocol.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <ResearchMetric label="Live participants" value="0" helper="Target 100" />
                <ResearchMetric label="Questionnaires" value="0" helper="Baseline + follow-up selections" />
                <ResearchMetric label="Live links" value="0" helper="0 test links" />
              </div>
            </div>

            <div className="mx-5 border-t border-slate-100 py-4">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/55 px-3.5 py-3">
                <div>
                  <p className="text-[8px] font-semibold text-slate-700">Study status</p>
                  <p className="mt-1 max-w-[690px] text-[6.5px] leading-3.5 text-slate-500">
                    Active studies accept live participants. Paused, completed and archived studies stop new live participation while preserving the study record.
                  </p>
                </div>
                <ResearchInput className="w-[150px] py-1.5">Draft ⌄</ResearchInput>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-full bg-cyan-800 px-4 py-2.5 text-[8px] font-semibold text-white">
                    Edit study
                  </button>
                  <button className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[8px] font-semibold text-slate-700 shadow-sm">
                    View participants
                  </button>
                  <button className="rounded-full bg-slate-950 px-4 py-2.5 text-[8px] font-semibold text-white">
                    Participant links
                  </button>
                </div>
                <button className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-[8px] font-semibold text-rose-500">
                  Delete study
                </button>
              </div>
            </div>
          </ResearchSection>

          {studiesStep === 1 && (
            <div className="absolute right-7 bottom-16 z-30">
              <TourInfoCloud
                title={studiesTourSteps[1].calloutTitle}
                body={studiesTourSteps[1].calloutBody}
                side="right"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (slideId === "study-builder") {
    const step = Math.max(0, Math.min(studyBuilderTourSteps.length - 1, studyBuilderStep));
    const tourStep = studyBuilderTourSteps[step];
    const focusClass =
      "relative z-10 rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)] transition-all duration-300";

    const callout = (
      <div className="absolute -right-[302px] top-12 z-40">
        <TourInfoCloud
          title={tourStep.calloutTitle}
          body={tourStep.calloutBody}
          side="right"
        />
      </div>
    );

    let mainContent: ReactNode;

    if (step === 0) {
      mainContent = (
        <div id="study-builder-overview" className={focusClass}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Overview</p>
              <p className="mt-1 text-[7px] text-slate-500">Study Builder · Step 1 of 8</p>
            </div>
            <div className="p-5">
              <p className="mb-1 text-[7px] font-medium text-slate-600">Study title</p>
              <ResearchInput>Untitled research study</ResearchInput>

              <p className="mb-1 mt-4 text-[7px] font-medium text-slate-600">Participant-facing description</p>
              <div className="min-h-[88px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-[8px] text-slate-400 shadow-[0_3px_9px_rgba(15,23,42,0.05)]">
                Explain what participants will be asked to do.
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-[7px] font-medium text-slate-600">Study design</p>
                  <ResearchInput>Cross-sectional survey &nbsp;⌄</ResearchInput>
                </div>
                <div>
                  <p className="mb-1 text-[7px] font-medium text-slate-600">Target sample size</p>
                  <ResearchInput>100</ResearchInput>
                </div>
              </div>

              <StudyBuilderFooter step={0} />
            </div>
          </ResearchSection>
          {callout}
        </div>
      );
    } else if (step === 1) {
      const comps = [
        ["Consent", "PsyLattice consent, external consent, or documented alternative.", true],
        ["Participant demographics", "Preset or custom demographic fields, including optional open-response fields.", true],
        ["Baseline / questionnaires", "One or more library or custom research instruments.", true],
        ["Cognitive tasks", "Reusable tasks from your personal Cognitive Task Library, pinned to a frozen study-ready version.", false],
        ["Ambulatory / EMA / ESM", "Repeated real-world assessments. Completely optional.", false],
        ["Follow-up assessments", "Post-study or later follow-up measurement points.", false],
        ["Wearables", "Optional device-derived data with appropriate consent.", false],
        ["Passive / device context", "Future context or sensing integrations where approved.", false],
        ["Participant uploads", "Files, images, audio or other participant-provided material.", false],
      ] as const;

      mainContent = (
        <div id="study-builder-components" className={focusClass}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Study components</p>
              <p className="mt-1 text-[7px] text-slate-500">Study Builder · Step 2 of 8</p>
            </div>
            <div className="p-5">
              <p className="mb-4 text-[8px] leading-4 text-slate-500">
                Select the kinds of elements that belong to this protocol. You can add multiple questionnaires and cognitive tasks, then arrange their participant order in Study flow.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {comps.map(([title, description, included]) => (
                  <div
                    key={title}
                    className={`rounded-[15px] border p-4 ${included ? "border-cyan-300 bg-cyan-50/25" : "border-slate-200 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[10px] font-semibold text-slate-900">{title}</p>
                      <ResearchPill active={included}>{included ? "Included" : "Not included"}</ResearchPill>
                    </div>
                    <p className="mt-2 text-[7px] leading-4 text-slate-500">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </ResearchSection>
          {callout}
        </div>
      );
    } else if (step === 2) {
      mainContent = (
        <div id="study-builder-flow" className={focusClass}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Study flow</p>
              <p className="mt-1 text-[7px] text-slate-500">Study Builder · Step 3 of 8</p>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/55 p-4">
                <p className="text-[9px] font-semibold text-slate-800">Participant study flow</p>
                <p className="mt-2 text-[7px] leading-4 text-slate-500">
                  Reposition questionnaires, demographics and cognitive tasks into the exact order participants should encounter them. The same questionnaire or cognitive task may be added more than once when your design requires repeated administration.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-semibold text-slate-800">1. Consent</p>
                    <p className="mt-1 text-[6.5px] text-slate-400">Locked before research data collection.</p>
                  </div>
                  <ResearchPill active>Locked first</ResearchPill>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[8px] font-bold text-white">2</span>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-800">Participant demographics</p>
                    <p className="mt-1 text-[6.5px] text-slate-400">3 configured fields</p>
                  </div>
                  <ResearchPill>Demographics</ResearchPill>
                </div>
                <div className="flex items-center gap-2">
                  <ResearchPill>↑</ResearchPill>
                  <ResearchPill>↓</ResearchPill>
                  <button className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-[7px] font-semibold text-rose-500">
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[8px] font-semibold text-slate-700 shadow-sm">
                  + Add questionnaire
                </button>
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[8px] font-semibold text-slate-700 shadow-sm">
                  + Add cognitive task
                </button>
              </div>

              <StudyBuilderFooter step={2} />
            </div>
          </ResearchSection>
          {callout}
        </div>
      );
    } else if (step === 3) {
      mainContent = (
        <div id="study-builder-consent" className={focusClass}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Consent</p>
              <p className="mt-1 text-[7px] text-slate-500">Study Builder · Step 4 of 8</p>
            </div>
            <div className="p-5">
              <p className="mb-2 text-[7px] font-medium text-slate-600">Consent method</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Build in PsyLattice", true],
                  ["Consent obtained externally", false],
                  ["No digital consent in PsyLattice", false],
                ].map(([label, active]) => (
                  <button
                    key={String(label)}
                    className={`min-h-[58px] rounded-xl border px-3 py-3 text-left text-[8px] font-semibold ${active ? "border-cyan-500 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-700 shadow-sm"}`}
                  >
                    {String(label)}
                  </button>
                ))}
              </div>

              <p className="mb-1 mt-4 text-[7px] font-medium text-slate-600">Participant information</p>
              <div className="min-h-[92px] rounded-xl border border-slate-200 bg-white px-3 py-3 text-[8px] leading-4 text-slate-400 shadow-sm">
                Paste or write the approved participant information shown before consent items.
              </div>

              <div className="mt-4">
                <p className="text-[7px] font-medium text-slate-600">Consent questions</p>
                <p className="mt-1 text-[6.5px] text-slate-400">
                  Add as many required or optional consent/comprehension items as the approved protocol needs.
                </p>
                <button className="mt-2 rounded-full bg-slate-950 px-4 py-2 text-[7px] font-semibold text-white">
                  + Add consent question
                </button>
              </div>

              {[
                ["Consent item 1", "I confirm that I have read the participant information.", "Acknowledgment checkbox"],
                ["Consent item 2", "I voluntarily agree to participate in this study.", "Yes / No"],
              ].map(([title, prompt, response]) => (
                <div key={title} className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[8px] font-semibold text-slate-800">{title}</p>
                    <div className="flex gap-1">
                      <ResearchPill>↑</ResearchPill>
                      <ResearchPill>↓</ResearchPill>
                      <button className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-[6.5px] font-semibold text-rose-500">Remove</button>
                    </div>
                  </div>
                  <div className="mt-3 min-h-[54px] rounded-xl border border-slate-200 px-3 py-3 text-[7.5px] text-slate-700">
                    {prompt}
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_1fr] gap-3">
                    <div>
                      <p className="mb-1 text-[6.5px] text-slate-400">Response type</p>
                      <ResearchInput>{response} &nbsp;⌄</ResearchInput>
                    </div>
                    <div className="flex items-end">
                      <div className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[7px] text-slate-600">
                        ☑ &nbsp; Required to proceed
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <StudyBuilderFooter step={3} />
            </div>
          </ResearchSection>
          {callout}
        </div>
      );
    } else if (step === 4) {
      mainContent = (
        <div id="study-builder-demographics" className={focusClass}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Demographics</p>
              <p className="mt-1 text-[7px] text-slate-500">Study Builder · Step 5 of 8</p>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/55 p-4">
                <p className="text-[8px] font-semibold text-slate-800">Participant demographics</p>
                <p className="mt-2 text-[7px] leading-4 text-slate-500">
                  Add standard demographic fields or create your own questions. Every field is optional unless you mark it required. Prefer pseudonymous data where possible; directly identifying fields such as a full name should only be collected when the approved protocol genuinely requires them.
                </p>
              </div>

              <p className="mt-4 text-[7px] font-medium text-slate-600">Quick-add common fields</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Name", "Initials", "Age", "Gender", "Highest educational qualification",
                  "Occupation", "Employment status", "Student status", "Country of residence",
                  "Nationality", "Primary language", "Relationship / marital status",
                ].map((item) => (
                  <ResearchPill key={item}>+ {item}</ResearchPill>
                ))}
              </div>
              <button className="mt-2 rounded-full bg-slate-950 px-4 py-2 text-[7px] font-semibold text-white">
                + Custom question
              </button>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-semibold text-slate-800">Demographic field 1</p>
                  <div className="flex gap-1">
                    <ResearchPill>↑</ResearchPill>
                    <ResearchPill>↓</ResearchPill>
                    <button className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-[6.5px] font-semibold text-rose-500">Remove</button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[6.5px] text-slate-400">Question / field label</p>
                    <ResearchInput>Age</ResearchInput>
                  </div>
                  <div>
                    <p className="mb-1 text-[6.5px] text-slate-400">Response type</p>
                    <ResearchInput>Number &nbsp;⌄</ResearchInput>
                  </div>
                </div>

                <p className="mb-1 mt-3 text-[6.5px] text-slate-400">Participant guidance / description</p>
                <div className="min-h-[54px] rounded-xl border border-slate-200 px-3 py-3 text-[7.5px] text-slate-700">
                  Age in completed years.
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[6.5px] text-slate-400">Minimum value</p>
                    <ResearchInput> </ResearchInput>
                  </div>
                  <div>
                    <p className="mb-1 text-[6.5px] text-slate-400">Maximum value</p>
                    <ResearchInput> </ResearchInput>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[7px] font-semibold text-slate-700">□ &nbsp; Required</p>
                    <p className="mt-1 text-[6.5px] leading-3 text-slate-500">Participant must answer before continuing.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-[7px] font-semibold text-slate-700">□ &nbsp; Directly identifying field</p>
                    <p className="mt-1 text-[6.5px] leading-3 text-slate-500">Mark names, email addresses, or similar direct identifiers so they can be treated separately in exports and privacy controls.</p>
                  </div>
                </div>
              </div>

              <StudyBuilderFooter step={4} />
            </div>
          </ResearchSection>
          {callout}
        </div>
      );
    } else if (step === 5) {
      const measures = [
        {
          title: "50-item IPIP representation of Goldberg's Big-Five factor markers (IPIP Big-Five 50)",
          meta: "Personality · 50 items · ~8 min",
          description: "A 50-item public-domain IPIP inventory measuring Extraversion, Agreeableness, Conscientiousness, Emotional Stability, and Openness.",
          version: "Current version: Official 50-item sample",
        },
        {
          title: "Depression Anxiety Stress Scales – 21 (DASS-21)",
          meta: "Depression, Anxiety & Stress · 21 items · ~5 min",
          description: "The 21-item short version of the DASS, with seven items each for Depression, Anxiety and Stress.",
          version: "Current version: DASS-21",
        },
        {
          title: "General Self-Efficacy Scale (GSE)",
          meta: "Self-efficacy · 10 items · ~4 min",
          description: "A 10-item self-report measure of general perceived self-efficacy.",
          version: "Current version: GSE",
        },
      ];

      mainContent = (
        <div id="study-builder-baseline" className={focusClass}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Baseline measures</p>
              <p className="mt-1 text-[7px] text-slate-500">Study Builder · Step 6 of 8</p>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/55 p-4">
                <p className="text-[8px] font-semibold text-slate-800">Select questionnaires for this study</p>
                <p className="mt-2 text-[7px] leading-4 text-slate-500">
                  Choose directly from the PsyLattice Questionnaire Library or from questionnaires you created yourself. PsyLattice pins the current questionnaire version to this study so later edits do not silently change a deployed protocol.
                </p>
              </div>

              <div className="mt-4 border-b border-slate-100 pb-4">
                <p className="text-[7px] font-medium text-slate-600">Selected measures</p>
                <p className="mt-1 text-[6.5px] text-slate-400">No questionnaires selected yet.</p>
              </div>

              <p className="mt-4 text-[7px] font-medium text-slate-600">Browse available questionnaires</p>
              <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                <ResearchInput className="text-slate-400">Search name, acronym, construct or category...</ResearchInput>
                <span className="text-[6.5px] text-slate-400">5 available</span>
              </div>

              <div className="mt-3 space-y-2">
                {measures.map((measure) => (
                  <div key={measure.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[8px] font-semibold leading-3 text-slate-800">{measure.title}</p>
                        <ResearchPill className="mt-2">Library</ResearchPill>
                        <p className="mt-2 text-[6.5px] text-slate-400">{measure.meta}</p>
                        <p className="mt-1 text-[6.5px] leading-3 text-slate-500">{measure.description}</p>
                        <p className="mt-1 text-[6px] text-slate-400">{measure.version}</p>
                      </div>
                      <button className="mt-8 shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-[7px] font-semibold text-white">
                        + Add to study
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ResearchSection>
          {callout}
        </div>
      );
    } else if (step === 6) {
      mainContent = (
        <div id="study-builder-recruitment" className={focusClass}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Recruitment</p>
              <p className="mt-1 text-[7px] text-slate-500">Study Builder · Step 7 of 8</p>
            </div>
            <div className="p-5">
              <p className="text-[8px] leading-4 text-slate-500">
                Save the study draft first, then use Participant Links to create TEST or live recruitment routes for this exact protocol.
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[7px] font-medium text-slate-600">Study draft ID</p>
                <div className="mt-2 rounded-lg bg-slate-50 px-3 py-3 font-mono text-[7px] text-slate-700">
                  Save this draft to create a study ID
                </div>
              </div>

              <StudyBuilderFooter step={6} />
            </div>
          </ResearchSection>
          {callout}
        </div>
      );
    } else {
      mainContent = (
        <div id="study-builder-review" className={focusClass}>
          <ResearchSection>
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-900">Review</p>
              <p className="mt-1 text-[7px] text-slate-500">Study Builder · Step 8 of 8</p>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-4">
                <p className="text-[9px] font-semibold text-slate-800">Builder review</p>
                <p className="mt-2 text-[7px] leading-4 text-slate-500">
                  This draft records the selected study components, configurable demographics, pinned questionnaire versions, pinned cognitive-task versions, consent, and any optional ambulatory protocol. Use a TEST participant link before live recruitment and verify the full participant experience against the approved protocol.
                </p>
              </div>

              <button className="mt-4 rounded-full bg-slate-950 px-4 py-2.5 text-[8px] font-semibold text-white">
                Save study draft
              </button>

              <StudyBuilderFooter step={7} continueDisabled />
            </div>
          </ResearchSection>
          {callout}
        </div>
      );
    }

    return (
      <div className="min-h-[980px] space-y-4 pb-6">
        <ResearchSection className="p-5">
          <div className="flex gap-2">
            <ResearchPill active>Researcher workspace</ResearchPill>
            <ResearchPill>Live workspace data</ResearchPill>
          </div>
          <h2 className="mt-3 text-[19px] font-semibold tracking-tight text-slate-950">Study Builder</h2>
          <p className="mt-1 text-[8px] text-slate-500">
            Build a complete study workflow from protocol design to participant deployment.
          </p>
        </ResearchSection>

        <StudyBuilderStepNav active={step} />

        <div className="grid grid-cols-[1.45fr_.85fr] gap-3">
          {mainContent}
          <StudyBuilderSidePanels />
        </div>
      </div>
    );
  }

  if (slideId === "ambulatory") {
    return <AmbulatoryTourDemo step={ambulatoryStep} />;
  }

  if (slideId === "participants") {
    const rows = [["PL-2A464D39","active","Yes","1","0","25 Aug 2026"],["PL-E5324117","completed","Yes","1","1","25 Aug 2026"],["PL-AC102933","active","Yes","0","0","28 Aug 2026"],["PL-FA183002","invited","—","0","0","1 Sep 2026"]];
    const current = participantsTourSteps[Math.min(participantsStep, participantsTourSteps.length - 1)];
    const focus = "relative rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)]";
    return <div className="min-h-[860px] space-y-3 pb-6">
      <ResearchSection className="p-5"><div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div><h2 className="mt-3 text-[18px] font-semibold">Participants</h2><p className="mt-1 text-[8px] text-slate-500">Monitor enrolment, consent and completion across your study.</p></ResearchSection>
      <div id="participants-controls" className={participantsStep===0?focus:"relative"}><ResearchSection className="p-4"><div className="grid grid-cols-[1fr_150px_180px] gap-2"><ResearchInput>research analysis- data ⌄</ResearchInput><ResearchInput className="text-slate-400">Search participant...</ResearchInput><div className="flex justify-end gap-2"><ResearchPill active>Active</ResearchPill><ResearchPill>Completed</ResearchPill></div></div></ResearchSection>{participantsStep===0&&<div className="absolute right-5 top-[64px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="top"/></div>}</div>
      <div id="participants-table" className={participantsStep===1?focus:"relative"}><ResearchSection className="overflow-hidden"><div className="grid grid-cols-[1.2fr_.75fr_.6fr_.8fr_.8fr_1fr] bg-slate-50 px-4 py-3 text-[6.5px] font-semibold uppercase tracking-[0.12em] text-slate-400"><span>Participant</span><span>Status</span><span>Consented</span><span>Questionnaires</span><span>Cognitive tasks</span><span>Enrolled</span></div>{rows.map(r=><div key={r[0]} className="grid grid-cols-[1.2fr_.75fr_.6fr_.8fr_.8fr_1fr] border-t border-slate-100 px-4 py-4 text-[7.5px] text-slate-600"><span className="font-semibold text-slate-800">{r[0]}</span><span><ResearchPill active={r[1]==="active"}>{r[1]}</ResearchPill></span><span>{r[2]}</span><span>{r[3]}</span><span>{r[4]}</span><span>{r[5]}</span></div>)}</ResearchSection>{participantsStep===1&&<div className="absolute right-5 top-16 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div>
    </div>;
  }

  if (slideId === "participant-links") {
    const current = participantLinksTourSteps[Math.min(participantLinksStep, participantLinksTourSteps.length - 1)];
    const focus = "relative rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)]";
    return <div className="min-h-[980px] space-y-3 pb-6">
      <ResearchSection className="p-5"><div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div><h2 className="mt-3 text-[18px] font-semibold">Participant Links</h2><p className="mt-1 text-[8px] text-slate-500">Create participant-specific recruitment channels and study links.</p></ResearchSection>
      <div id="participant-links-create" className={participantLinksStep===0?focus:"relative"}><ResearchSection><div className="border-b border-slate-100 px-4 py-4"><p className="text-[10px] font-semibold">Participant links</p><p className="mt-1 text-[7px] text-slate-500">Create secure token-based participant routes for saved PsyLattice studies.</p></div><div className="p-4"><p className="mb-1 text-[7px] font-medium">Study</p><div className="grid grid-cols-[1fr_150px] gap-3"><ResearchInput>research analysis- data ⌄</ResearchInput><button className="rounded-full bg-slate-950 px-4 text-[7px] font-semibold text-white">+ Create participant link</button></div><div className="mt-2 flex gap-2"><ResearchPill active>Study active</ResearchPill><span className="text-[6.5px] text-slate-400">Target sample: 100</span></div></div></ResearchSection>{participantLinksStep===0&&<div className="absolute right-5 top-20 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div>
      <div id="participant-links-manage" className={participantLinksStep===1?focus:"relative"}><ResearchSection><div className="border-b border-slate-100 px-4 py-4"><p className="text-[10px] font-semibold">Recruitment links</p><p className="mt-1 text-[7px] text-slate-500">Each link uses a long random token. Participants never enter the Researcher workspace.</p></div>{[["active","Pause","2b7c7ef07f1db4df8204c8e49df13abab890aab787866961"],["paused","Activate","a397d5c7ca0e2d4046bfb59b19a16713373bb220bbd87621"]].map(([status,action,token])=><div key={token} className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 last:border-0"><div className="min-w-0"><div className="flex gap-2"><p className="text-[9px] font-semibold">Main study link</p><ResearchPill active>LIVE</ResearchPill><ResearchPill active={status==="active"}>{status}</ResearchPill></div><div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[6px] text-slate-500">https://psylattice.com/study/{token}</div><div className="mt-2 flex gap-4 text-[6px] text-slate-400"><span>Access: Open link</span><span>Participants: 1 / 100</span><span>Created 25/8/2026</span></div></div><div className="flex gap-2"><ResearchPill>Copy link</ResearchPill><ResearchPill>Open</ResearchPill><ResearchPill>{action}</ResearchPill></div></div>)}</ResearchSection>{participantLinksStep===1&&<div className="absolute right-5 top-28 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div>
      <div className="grid grid-cols-2 gap-3"><ResearchSection className="p-4"><p className="text-[9px] font-semibold">Participant flow</p><div className="mt-3 rounded-xl border border-slate-200 px-3 py-3 text-[7px]"><ResearchPill active>1</ResearchPill><span className="ml-2 font-medium">Study landing page</span></div></ResearchSection><ResearchSection className="p-4"><p className="text-[9px] font-semibold">Deployment safeguards</p><p className="mt-3 text-[7px] leading-4 text-slate-500">TEST links create records marked TEST. Live links require explicit deployment confirmation and should remain tied to a stable study protocol.</p></ResearchSection></div>
    </div>;
  }

  if (slideId === "data-dashboard") {
    const current = dataDashboardTourSteps[Math.min(dataDashboardStep, dataDashboardTourSteps.length - 1)];
    const focus = "relative rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)]";
    return <div className="min-h-[900px] space-y-3 pb-6">
      <ResearchSection className="p-5"><div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div><h2 className="mt-3 text-[18px] font-semibold">Data Dashboard</h2><p className="mt-1 text-[8px] text-slate-500">Monitor incoming responses, completeness and data-quality signals.</p></ResearchSection>
      <div className="flex items-end justify-between"><div className="w-[230px]"><p className="mb-1 text-[7px] font-medium">Study</p><ResearchInput>Untitled research study ⌄</ResearchInput></div><ResearchPill>draft</ResearchPill></div>
      <div id="data-dashboard-metrics" className={dataDashboardStep===0?focus:"relative"}><div className="grid grid-cols-5 gap-3"><ResearchMetric label="Live participants" value="0" helper="0 test records excluded"/><ResearchMetric label="Item responses" value="0" helper="Stored live questionnaire responses"/><ResearchMetric label="Questionnaires completed" value="0" helper="Completed live measure sessions"/><ResearchMetric label="Cognitive task runs" value="0" helper="Completed live study administrations"/><ResearchMetric label="Direct identifier fields" value="0" helper="Excluded from exports by default"/></div>{dataDashboardStep===0&&<div className="absolute right-4 top-[92px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="top"/></div>}</div>
      <div id="data-dashboard-quality" className={dataDashboardStep===1?focus:"relative"}><div className="grid grid-cols-2 gap-3"><ResearchSection><div className="border-b border-slate-100 px-4 py-4"><p className="text-[9px] font-semibold">Data completeness</p><p className="mt-1 text-[6.5px] text-slate-400">Calculated from required study components and live participants.</p></div><div className="p-4"><div className="rounded-xl bg-slate-50 p-4"><p className="text-[8px] font-semibold">No live participant data yet</p><p className="mt-2 text-[7px] text-slate-400">TEST participants are deliberately excluded from the main completeness metrics.</p></div></div></ResearchSection><ResearchSection><div className="border-b border-slate-100 px-4 py-4"><p className="text-[9px] font-semibold">Data-quality checks</p><p className="mt-1 text-[6.5px] text-slate-400">Rule-based checks from the data currently stored in this study.</p></div><div className="space-y-3 p-4">{["Missing required baseline measures","Missing required demographic fields","Missing recorded consent","TEST participants","Direct identifier fields configured"].map(x=><div key={x} className="flex items-center justify-between"><span className="text-[7px] font-medium text-slate-600">{x}</span><ResearchPill active>0</ResearchPill></div>)}</div></ResearchSection></div>{dataDashboardStep===1&&<div className="absolute right-5 top-20 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div>
    </div>;
  }

  if (slideId === "data-explorer") {
    const current = dataExplorerTourSteps[Math.min(dataExplorerStep, dataExplorerTourSteps.length - 1)];
    const focus = "relative rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)]";
    return <div className="min-h-[1160px] space-y-3 pb-6">
      <div id="data-explorer-controls" className={dataExplorerStep===0?focus:"relative"}><ResearchSection><div className="border-b border-slate-100 px-4 py-4"><p className="text-[10px] font-semibold">Data Explorer</p><p className="mt-1 text-[7px] text-slate-500">Inspect real participant, demographic, questionnaire, score, consent and secure participant-upload records for one study.</p></div><div className="p-4"><div className="grid grid-cols-2 gap-3"><div><p className="mb-1 text-[6.5px] text-slate-500">Study</p><ResearchInput>research analysis- data ⌄</ResearchInput></div><div><p className="mb-1 text-[6.5px] text-slate-500">Dataset</p><ResearchInput>Participant summary ⌄</ResearchInput></div></div><div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2"><ResearchInput className="text-slate-400">Search participant ID, variable, item or response...</ResearchInput><ResearchPill>□ Include TEST data</ResearchPill><ResearchPill>□ Show direct identifiers</ResearchPill></div><div className="mt-3 flex gap-2"><ResearchPill active>Participant summary</ResearchPill><ResearchPill>2 rows</ResearchPill><ResearchPill>Variables · 16</ResearchPill></div></div></ResearchSection>{dataExplorerStep===0&&<div className="absolute right-5 top-24 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div>
      <div id="data-explorer-table" className={dataExplorerStep===1?focus:"relative"}><ResearchSection className="overflow-hidden"><div className="border-b border-slate-100 px-4 py-4"><p className="text-[9px] font-semibold">Dataset</p><p className="mt-1 text-[6.5px] text-slate-400">The table below is generated from the selected study's stored data.</p></div><div className="overflow-hidden p-4"><div className="mb-3 flex justify-between"><span className="text-[6px] text-slate-400">Copy uses the rows currently shown in this preview after search and filters.</span><ResearchPill>Copy table</ResearchPill></div><table className="w-full table-fixed text-left text-[6px]"><thead className="bg-slate-50 text-slate-400"><tr>{["participant","is_test","status","enrolled_at","completed_at","consented","session_count","completed_questionnaires","completed_cognitive_tasks"].map(h=><th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead><tbody className="text-slate-600"><tr><td className="px-2 py-3 font-semibold">PL-2A464D39</td><td>false</td><td>active</td><td>2026-08-25T11:40...</td><td>—</td><td>true</td><td>1</td><td>1</td><td>0</td></tr><tr className="border-t border-slate-100"><td className="px-2 py-3 font-semibold">PL-E5324117</td><td>false</td><td>completed</td><td>2026-08-25T11:26...</td><td>2026-08-25T11:27...</td><td>true</td><td>1</td><td>1</td><td>1</td></tr></tbody></table></div></ResearchSection>{dataExplorerStep===1&&<div className="absolute right-5 top-20 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div>
      <div id="data-explorer-cognitive" className={dataExplorerStep===2?focus:"relative"}><ResearchSection><div className="border-b border-slate-100 px-4 py-4"><p className="text-[9px] font-semibold">Cognitive task results</p><p className="mt-1 text-[6.5px] text-slate-400">Study-level descriptive performance calculated from stored participant trial data.</p></div><div className="p-4"><div className="flex items-start justify-between"><div><p className="text-[6.5px] font-semibold uppercase tracking-[0.13em] text-cyan-700">Administration 3</p><p className="mt-1 text-[11px] font-semibold">Stroop Task</p><p className="mt-1 text-[6px] text-slate-400">Version 1 · inhibitory control · Required</p></div><ResearchPill active>1 completed</ResearchPill></div><div className="mt-3 grid grid-cols-5 gap-2"><ResearchMetric label="Completion" value="1/2" helper="Live participants"/><ResearchMetric label="Accuracy" value="93.8%" helper="16 scorable trials"/><ResearchMetric label="Mean RT" value="657.1 ms" helper="16 RT observations"/><ResearchMetric label="Median RT" value="592.5 ms" helper="Across stored trials"/><ResearchMetric label="Omissions" value="0" helper="16 recorded trials"/></div></div></ResearchSection>{dataExplorerStep===2&&<div className="absolute right-5 top-20 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div>
    </div>;
  }

  if (slideId === "export") {
    const current = exportTourSteps[Math.min(exportStep, exportTourSteps.length - 1)];
    const sheets=[["README","DOC","19",false],["Manifest","DOC","39",false],["Participants","CLEAN","0",true],["Analysis_Wide","CLEAN","0",true],["Analysis_Compatible","CLEAN","0",true],["Data_Quality","CLEAN","0",true],["Quality_Flags","CLEAN","0",true],["Demographics","CLEAN","0",true]] as const;
    const focus = "relative rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)]";
    return <div className="min-h-[1180px] pb-6"><ResearchSection className="overflow-visible"><div className="border-b border-slate-100 px-5 py-4"><p className="text-[10px] font-semibold">Visual Export Center</p><p className="mt-1 max-w-[780px] text-[7px] leading-3.5 text-slate-500">Choose the purpose of the export, preview the exact workbook before download, then export with a clear record of sample, privacy settings, sheets and row counts.</p></div><div className="p-4">
      <div id="export-modes" className={exportStep===0?focus:"relative"}><div className="grid grid-cols-4 gap-3">{[["Everything together","Complete research archive","Clean analysis sheets + complete raw observations + documentation."],["Clean and practical","Thesis / analysis workbook","Analysis-ready participant, questionnaire, cognitive and ambulatory summaries."],["Statistics-ready","SPSS · jamovi · JASP","A compact one-row-per-participant analysis file with safe variable names."],["Lossless observations","Raw reproducibility archive","Raw questionnaire responses, cognitive trials/timing and ambulatory records."]].map(([label,title,desc],i)=><div key={title} className={`rounded-[14px] border p-4 ${i===0?"border-slate-950 bg-slate-950 text-white":"border-slate-200"}`}><p className={`text-[6.5px] font-semibold uppercase tracking-[0.13em] ${i===0?"text-cyan-300":"text-slate-400"}`}>{label}{i===0&&<span className="ml-2 rounded-full bg-white px-2 py-1 text-[5px] text-slate-900">RECOMMENDED</span>}</p><p className="mt-2 text-[9px] font-semibold">{title}</p><p className={`mt-2 text-[6.5px] leading-3.5 ${i===0?"text-slate-300":"text-slate-500"}`}>{desc}</p></div>)}</div>{exportStep===0&&<div className="absolute right-5 top-[120px] z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="top"/></div>}</div>
      <div className="mt-3 grid grid-cols-[.78fr_1.22fr] gap-3"><div className="space-y-3"><div id="export-summary" className={exportStep===1?focus:"relative"}><ResearchSection className="p-4"><div className="flex justify-between"><div><p className="text-[8px] font-semibold">What will be exported?</p><p className="mt-1 text-[6px] text-slate-400">This summary reflects the current controls and selected saved sample.</p></div><ResearchPill active>Live preview</ResearchPill></div><div className="mt-4 space-y-3">{[["Study","Untitled research study"],["Population","All eligible live participants"],["Participants","0"],["Identity","PsyLattice pseudonymous IDs"],["Direct identifiers","Excluded"],["TEST data","Excluded"]].map(([l,v])=><div key={l} className="flex justify-between border-b border-slate-100 pb-2 last:border-0"><span className="text-[6.5px] text-slate-400">{l}</span><span className="text-[6.5px] font-semibold text-slate-700">{v}</span></div>)}</div></ResearchSection>{exportStep===1&&<div className="absolute left-[calc(100%+18px)] top-10 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div><div className="grid grid-cols-2 gap-2"><ResearchMetric label="Worksheets" value="41"/><ResearchMetric label="Data rows" value="0"/><ResearchMetric label="Clean sheets" value="20"/><ResearchMetric label="Raw sheets" value="16"/></div><button className="flex w-full items-center justify-between rounded-xl bg-slate-800 px-4 py-3 text-left text-white opacity-70"><span><span className="block text-[7px] font-semibold">Download Complete research archive</span><span className="mt-1 block text-[6px] text-slate-300">0 participants · 41 sheets · 0 data rows</span></span><span>↓</span></button></div>
      <div id="export-workbook" className={exportStep===2?focus:"relative"}><ResearchSection className="p-4"><p className="text-[8px] font-semibold">Workbook preview</p><p className="mt-1 text-[6px] text-slate-400">These are the actual sheets that will be sent to the Excel generator.</p><div className="mt-3 flex gap-2"><ResearchPill active>20 clean</ResearchPill><ResearchPill>16 raw</ResearchPill><ResearchPill>5 docs</ResearchPill></div><div className="mt-3 space-y-2">{sheets.map(([sheet,type,rows,cyan])=><div key={sheet} className={`flex items-start justify-between rounded-xl border px-3 py-3 ${cyan?"border-cyan-300 bg-cyan-50/30":"border-violet-200 bg-violet-50/20"}`}><div><p className="text-[7.5px] font-semibold">{sheet}<span className="ml-2 text-[5.5px] text-slate-400">{type}</span></p><p className="mt-1 text-[5.8px] text-slate-400">{sheet==="README"?"Workbook interpretation, privacy and data-structure notes.":sheet==="Analysis_Wide"?"Primary analysis-ready sheet: one row per participant.":"Workbook sheet preview."}</p></div><div className="text-right"><p className="text-[8px] font-semibold">{rows}</p><p className="text-[5px] text-slate-400">rows</p></div></div>)}</div></ResearchSection>{exportStep===2&&<div className="absolute right-5 top-28 z-30"><TourInfoCloud title={current.calloutTitle} body={current.calloutBody} side="right"/></div>}</div></div>
      </div></ResearchSection></div>;
  }

  if (slideId === "plans-billing") {
    const plans=[{name:"FREE",price:"₹0",items:["✓ One study","✓ Basic participant capacity","✓ Small AI allowance","✓ PsyLattice Auto","✓ No custom media"]},{name:"STUDY PASS",price:"₹499 per study",items:["✓ One serious study","✓ 500 participants","✓ 200 AI credits","✓ Some model choice","✓ No custom media"]},{name:"PRO MONTHLY",price:"₹749 / month",popular:true,items:["✓ Multiple studies","✓ 700 participants","✓ 300 AI credits","✓ Full AI model switcher","✓ Custom media","✓ 2 GB media"]},{name:"PRO ANNUAL",price:"₹7,499 / year",items:["✓ Everything in Pro","✓ 700 participants","✓ 300 AI credits","✓ Full AI model switcher","✓ 5 GB media","✓ Approximately 17% cheaper than monthly"]}];
    return <div className="space-y-3"><ResearchSection className="p-5"><div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div><h2 className="mt-3 text-[18px] font-semibold">Plans & Billing</h2><p className="mt-1 text-[8px] text-slate-500">Review plans, AI allowance and presentation-only capacity options.</p></ResearchSection><ResearchSection className="p-4"><p className="text-[7px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Plans & usage</p><div className="mt-3 flex gap-2"><div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2"><span className="text-[7px] font-semibold">AI budget</span><div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[62%] rounded-full bg-cyan-500"/></div><span className="text-[6.5px] text-slate-500">38% left</span></div><ResearchPill active>✣ PsyLattice Auto ⌄</ResearchPill></div></ResearchSection><div><h3 className="text-[13px] font-semibold">Plans & pricing</h3><p className="mt-1 text-[7px] text-slate-400">Choose the research capacity that fits your next study.</p></div><div className="grid grid-cols-4 gap-3">{plans.map(p=><ResearchSection key={p.name} className={`relative p-4 ${p.popular?"border-cyan-300 bg-cyan-50/20":""}`}>{p.popular&&<span className="absolute right-3 top-3 rounded-full bg-cyan-100 px-2 py-1 text-[5px] font-semibold text-cyan-700">POPULAR</span>}<p className="text-[7px] font-semibold">{p.name}</p><p className="mt-3 text-[15px] font-semibold">{p.price}</p><div className="mt-4 min-h-[112px] space-y-2">{p.items.map(x=><p key={x} className="text-[6.5px] text-slate-600">{x}</p>)}</div><button className="mt-4 w-full rounded-lg border border-slate-200 bg-white py-2 text-[7px] font-semibold">View options</button></ResearchSection>)}</div><div className="rounded-xl border border-cyan-200 bg-cyan-50/40 px-4 py-3"><p className="text-[7px] font-semibold">Custom media uploads</p><p className="mt-1 text-[6.5px] text-slate-500">Available only on Pro Monthly and Pro Annual for Questionnaire Builder, Ambulatory Assessments, Cognitive Lab and Thesis Builder.</p></div><ResearchSection className="p-4"><div className="flex gap-2"><ResearchPill dark>AI Add-ons</ResearchPill><ResearchPill>Participant Expansion</ResearchPill><ResearchPill>Media Storage</ResearchPill><ResearchPill>Notification Emails</ResearchPill><ResearchPill>Plans & Pricing</ResearchPill></div><div className="mt-3 grid grid-cols-3 gap-2">{["Starter Boost","Research Boost","Power Boost"].map(x=><div key={x} className="rounded-xl bg-slate-50 p-3"><p className="text-[7px] font-semibold">{x}</p><p className="mt-1 text-[6px] text-slate-400">Presentation option · Coming soon</p></div>)}</div></ResearchSection></div>;
  }

  if (slideId === "studies") {
    return (
      <div>
        <ScreenTitle eyebrow="Research workspace" title="Studies" action="New study" />
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Active" value="4" />
          <MiniStat label="Participants" value="128" />
          <MiniStat label="Due today" value="7" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {["Sleep & Attention", "Social Cognition Pilot", "EMA Mood Study", "Hazard Awareness"].map((name, index) => (
            <DemoCard key={name} className="p-4" highlight={index === 0}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-[9px] text-slate-400">Updated {index + 1}h ago</p>
                </div>
                <span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-semibold text-cyan-800">Active</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-cyan-600" style={{ width: `${74 - index * 9}%` }} />
              </div>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "study-builder") {
    const steps = ["Study info", "Consent", "Measures", "Follow-ups", "Launch"];
    return (
      <div>
        <ScreenTitle eyebrow="Study Builder" title="Sleep & Attention" action="Save draft" />
        <div className="grid grid-cols-[.72fr_1.28fr] gap-3">
          <DemoCard className="p-3">
            <div className="space-y-1.5">
              {steps.map((step, index) => (
                <button
                  key={step}
                  onClick={() => setSelectedStep(step)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold ${selectedStep === step ? "bg-cyan-50 text-cyan-800" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <span>{index + 1}. {step}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </DemoCard>
          <DemoCard className="p-4" highlight>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800">{selectedStep}</p>
            <h4 className="mt-1 text-sm font-semibold text-slate-900">Configure {selectedStep.toLowerCase()}</h4>
            <div className="mt-4 space-y-2">
              {selectedStep === "Measures" ? (
                ["Perceived Stress Scale", "Custom Image Choice", "Corsi Block · Cognitive Lab"].map((name) => (
                  <div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                    <span className="text-[10px] font-medium text-slate-700">{name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] text-slate-500">Required</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="h-9 rounded-xl border border-slate-200 bg-slate-50" />
                  <div className="h-20 rounded-xl border border-slate-200 bg-slate-50" />
                  <button className="rounded-lg bg-slate-950 px-3 py-2 text-[9px] font-semibold text-white">Continue</button>
                </>
              )}
            </div>
          </DemoCard>
        </div>
      </div>
    );
  }

  if (slideId === "questionnaires" || slideId === "custom-questionnaires") {
    const focusClass = (step: number) =>
      questionnaireStep === step
        ? "relative z-10 rounded-[20px] ring-2 ring-cyan-300/90 ring-offset-2 ring-offset-[#edf3f4] shadow-[0_14px_35px_rgba(8,145,178,.14)] transition-all duration-300"
        : "relative transition-all duration-300";

    const catalogueMeasures = [
      {
        title: "50-item IPIP representation of Goldberg's Big-Five factor markers (IPIP Big-Five 50)",
        category: "Personality",
        rights: ["Public domain"],
        description: "A 50-item public-domain IPIP inventory measuring Extraversion, Agreeableness, Conscientiousness, Emotional Stability, and Intellect/Imagination.",
        tags: ["Extraversion", "Agreeableness", "Conscientiousness", "Emotional Stability"],
        items: "50",
        time: "~8 min",
        languages: "1",
      },
      {
        title: "Depression Anxiety Stress Scales – 21 (DASS-21)",
        category: "Depression, Anxiety & Stress",
        rights: ["Public domain", "Research only"],
        description: "The 21-item short version of the DASS, with seven items each for Depression, Anxiety and Stress.",
        tags: ["Depression", "Anxiety", "Stress"],
        items: "21",
        time: "~5 min",
        languages: "1",
      },
      {
        title: "General Self-Efficacy Scale (GSE)",
        category: "Self-efficacy",
        rights: ["Public domain"],
        description: "A 10-item self-report measure of general perceived self-efficacy: confidence in one's ability to cope with difficult demands and challenging situations.",
        tags: ["General self-efficacy", "Coping confidence"],
        items: "10",
        time: "~4 min",
        languages: "1",
      },
      {
        title: "Patient Health Questionnaire-9 (PHQ-9)",
        category: "Depressive symptoms",
        rights: ["Use permitted / terms apply"],
        description: "A 9-item self-report questionnaire assessing the frequency of depressive symptoms over the previous two weeks.",
        tags: ["Depressive symptoms"],
        items: "9",
        time: "~3 min",
        languages: "1",
      },
      {
        title: "Rosenberg Self-Esteem Scale (RSES)",
        category: "Self-concept",
        rights: ["Public domain"],
        description: "A 10-item self-report measure of global self-esteem, reflecting an overall positive or negative evaluation of the self.",
        tags: ["Self-esteem", "Self-concept"],
        items: "10",
        time: "~3 min",
        languages: "1",
      },
    ];

    if (questionnaireStep <= 2) {
      return (
        <div className="min-h-[1120px] space-y-4 pb-8">
          <div id="questionnaire-library-overview" className={focusClass(0)}>
            <ResearchSection className="p-5">
              <div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div>
              <h2 className="mt-3 text-[18px] font-semibold tracking-tight text-slate-950">Questionnaire Library</h2>
              <p className="mt-1 max-w-[760px] text-[8px] leading-4 text-slate-500">Search the research catalogue, review administration and scoring, open manuals and official resources, and verify questionnaire usage rights.</p>
            </ResearchSection>

            <div className="mt-4 grid grid-cols-4 gap-3">
              <ResearchMetric label="Research measures" value="5" helper="Available in the researcher catalogue" />
              <ResearchMetric label="Public domain" value="4" helper="Rights recorded as public domain" />
              <ResearchMetric label="Research-only" value="1" helper="Not exposed in the Self workspace" />
              <ResearchMetric label="Your questionnaires" value="0" helper="Owned by your PsyLattice account" />
            </div>

            <ResearchSection className="mt-4 overflow-hidden">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[10px] font-semibold text-slate-900">Questionnaire library</p>
                <p className="mt-1 text-[7px] leading-3.5 text-slate-500">Discover measures, review administration and scoring, inspect item content, open manuals and official resources, and verify usage rights before deployment.</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-[1fr_135px_145px] gap-2">
                  <ResearchInput className="text-slate-400">Search name, acronym, construct, category or description...</ResearchInput>
                  <ResearchInput>All categories &nbsp;⌄</ResearchInput>
                  <ResearchInput>All licence statuses &nbsp;⌄</ResearchInput>
                </div>
                <p className="mt-3 text-[6.5px] font-medium text-slate-400">5 of 5 measures shown</p>
              </div>
            </ResearchSection>

            {questionnaireStep === 0 && (
              <div className="absolute right-4 top-[calc(100%+12px)] z-30">
                <TourInfoCloud title={questionnaireTourSteps[0].calloutTitle} body={questionnaireTourSteps[0].calloutBody} side="bottom" />
              </div>
            )}
          </div>

          <div id="questionnaire-library-measures" className={focusClass(1)}>
            <div className="grid grid-cols-2 gap-3">
              {catalogueMeasures.map((measure, index) => (
                <ResearchSection key={measure.title} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {measure.rights.map((right) => <ResearchPill key={right} active>{right}</ResearchPill>)}
                    </div>
                    <span className="text-[6.5px] font-medium text-slate-400">{measure.category}</span>
                  </div>
                  <p className="mt-4 text-[9px] font-semibold leading-3.5 text-slate-950">{measure.title}</p>
                  <p className="mt-2 text-[7px] leading-3.5 text-slate-500">{measure.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{measure.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-50 px-2 py-1 text-[6px] font-medium text-slate-500">{tag}</span>)}</div>
                  <div className="mt-4 grid grid-cols-3 border-y border-slate-100 py-3">
                    {[['Items',measure.items],['Time',measure.time],['Languages',measure.languages]].map(([label,value]) => <div key={label}><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-1 text-[8px] font-semibold text-slate-800">{value}</p></div>)}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-full bg-slate-950 px-3 py-2 text-[7px] font-semibold text-white">View research details</button>
                    <button className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[7px] font-semibold text-slate-600 shadow-sm">Licence source ↗</button>
                  </div>
                </ResearchSection>
              ))}
            </div>
            {questionnaireStep === 1 && (
              <div className="absolute right-4 top-20 z-30">
                <TourInfoCloud title={questionnaireTourSteps[1].calloutTitle} body={questionnaireTourSteps[1].calloutBody} side="right" />
              </div>
            )}
          </div>

          <div id="questionnaire-library-create" className={focusClass(2)}>
            <ResearchSection>
              <div className="flex items-center justify-between gap-4 px-4 py-5">
                <div>
                  <p className="text-[9px] font-semibold text-slate-900">Create custom questionnaire</p>
                  <p className="mt-3 max-w-[700px] text-[7px] leading-4 text-slate-500">Build an original measure for your research. Build blocks with their questions inside them, configure scoring and branching, then choose whether the questionnaire stays private or is published to the PsyLattice research catalogue.</p>
                </div>
                <button className="shrink-0 rounded-full bg-slate-950 px-4 py-2.5 text-[7px] font-semibold text-white">+ Create questionnaire</button>
              </div>
            </ResearchSection>
            <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-3">
              <p className="text-[7px] font-semibold text-violet-800">Questionnaire licensing safeguard</p>
              <p className="mt-1 text-[6.5px] leading-3.5 text-violet-700">Finding a questionnaire online does not automatically grant rights to reproduce, digitally administer, modify, score or redistribute it. PsyLattice records the source and current usage status, but researchers should verify the applicable terms for their study, jurisdiction and mode of use before launch.</p>
            </div>
            {questionnaireStep === 2 && (
              <div className="absolute right-4 top-6 z-30">
                <TourInfoCloud title={questionnaireTourSteps[2].calloutTitle} body={questionnaireTourSteps[2].calloutBody} side="right" />
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[1650px] space-y-4 pb-8">
        <ResearchSection className="p-5">
          <div className="flex gap-2"><ResearchPill active>Researcher workspace</ResearchPill><ResearchPill>Live workspace data</ResearchPill></div>
          <h2 className="mt-3 text-[18px] font-semibold tracking-tight text-slate-950">Questionnaire Library</h2>
          <p className="mt-1 max-w-[760px] text-[8px] leading-4 text-slate-500">Search the research catalogue, review administration and scoring, open manuals and official resources, and verify questionnaire usage rights.</p>
        </ResearchSection>

        <p className="px-1 text-[7px] font-semibold text-slate-500">← Back to questionnaire library</p>

        <div id="questionnaire-builder-overview" className={focusClass(3)}>
          <ResearchSection className="p-5">
            <div className="flex flex-wrap gap-2"><ResearchPill active>Universal research builder</ResearchPill><ResearchPill>Research workspace only</ResearchPill><ResearchPill>50 configured item types</ResearchPill></div>
            <h3 className="mt-4 text-[16px] font-semibold tracking-tight text-slate-950">Create research instrument</h3>
            <p className="mt-2 text-[7px] leading-4 text-slate-500">Mix ratings, choices, Thurstone items, matrices, ranking, text, numbers, media, uploads and information blocks in the same instrument. Every item stores its own response, validation, scoring, display-logic and randomisation configuration.</p>
          </ResearchSection>

          <div className="mt-3 grid grid-cols-[1.25fr_.85fr] gap-3">
            <ResearchSection>
              <div className="border-b border-slate-100 px-4 py-4"><p className="text-[9px] font-semibold text-slate-900">Instrument overview</p><p className="mt-1 text-[6.5px] text-slate-400">Metadata shown to researchers in the library.</p></div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <div><p className="mb-1 text-[6.5px] text-slate-500">Name</p><ResearchInput>e.g. Academic Coping Questionnaire</ResearchInput></div>
                <div><p className="mb-1 text-[6.5px] text-slate-500">Acronym</p><ResearchInput>ACQ</ResearchInput></div>
                <div><p className="mb-1 text-[6.5px] text-slate-500">Category</p><ResearchInput>Custom</ResearchInput></div>
                <div><p className="mb-1 text-[6.5px] text-slate-500">Estimated time (minutes)</p><ResearchInput>5</ResearchInput></div>
                <div className="col-span-2"><p className="mb-1 text-[6.5px] text-slate-500">Description</p><div className="h-16 rounded-xl border border-slate-200 bg-white shadow-sm" /></div>
                <div><p className="mb-1 text-[6.5px] text-slate-500">Constructs — comma separated</p><ResearchInput>Stress, coping</ResearchInput></div>
                <div><p className="mb-1 text-[6.5px] text-slate-500">Languages — comma separated</p><ResearchInput>English</ResearchInput></div>
                <div><p className="mb-1 text-[6.5px] text-slate-500">Target population</p><ResearchInput /></div>
                <div><p className="mb-1 text-[6.5px] text-slate-500">Recall period</p><ResearchInput>Past 7 days / Right now / General</ResearchInput></div>
              </div>
            </ResearchSection>

            <div className="space-y-3">
              <ResearchSection>
                <div className="border-b border-slate-100 px-4 py-3"><p className="text-[9px] font-semibold text-slate-900">Builder summary</p></div>
                <div className="grid grid-cols-2 gap-2 p-4">
                  <ResearchMetric label="Items/content" value="1" helper="1 block(s)" />
                  <ResearchMetric label="Response types" value="1" helper="Mixed formats supported" />
                  <div className="col-span-2 rounded-xl bg-slate-50 p-3"><p className="text-[6px] font-semibold uppercase tracking-[0.12em] text-slate-400">Subscales</p><p className="mt-1 text-[7px] text-slate-600">No subscales assigned</p></div>
                  <div className="col-span-2 rounded-xl border border-cyan-200 bg-cyan-50/40 p-3"><p className="text-[7px] font-semibold text-cyan-900">Extensible by design</p><p className="mt-1 text-[6.5px] leading-3.5 text-slate-500">The custom item type and JSONB configuration mean new research formats can be added later without redesigning the core database.</p></div>
                </div>
              </ResearchSection>
              <ResearchSection className="p-4"><p className="text-[8px] font-semibold text-slate-800">Included capabilities</p><div className="mt-3 space-y-1.5 text-[6.5px] text-slate-500">{["Item-specific response formats","Blocks/pages and page breaks","Branching / display logic","Piping via {{item_key}}","Option and block randomisation","Subscales and reverse scoring","Weighted / Thurstone scoring metadata","Missing-data rules","Matrices, ranking, Q-sort and allocation","Text, numeric, date/time and uploads","Media/stimulus metadata","Custom/future item configuration"].map(x=><p key={x}>✓ &nbsp;{x}</p>)}</div></ResearchSection>
            </div>
          </div>
          {questionnaireStep === 3 && <div className="absolute right-4 top-24 z-30"><TourInfoCloud title={questionnaireTourSteps[3].calloutTitle} body={questionnaireTourSteps[3].calloutBody} side="right" /></div>}
        </div>

        <div id="questionnaire-builder-administration" className={focusClass(4)}>
          <div className="grid grid-cols-[1.25fr_.85fr] gap-3">
            <ResearchSection>
              <div className="border-b border-slate-100 px-4 py-4"><p className="text-[9px] font-semibold text-slate-900">Administration</p><p className="mt-1 text-[6.5px] text-slate-400">Participant and researcher-facing instructions.</p></div>
              <div className="space-y-3 p-4">
                <div><p className="mb-1 text-[6.5px] text-slate-500">Participant instructions</p><div className="h-20 rounded-xl border border-slate-200 bg-white shadow-sm" /></div>
                <div><p className="mb-1 text-[6.5px] text-slate-500">Researcher instructions</p><div className="h-20 rounded-xl border border-slate-200 bg-white shadow-sm" /></div>
              </div>
            </ResearchSection>
            <div className="space-y-3">
              <ResearchSection>
                <div className="border-b border-slate-100 px-4 py-3"><p className="text-[9px] font-semibold text-slate-900">Publication & ownership</p><p className="mt-1 text-[6px] text-slate-400">Keep the questionnaire private, publish it freely, or let other researchers request permission to use it.</p></div>
                <div className="space-y-2 p-4">
                  {[['Private · my library only','Only you can see and use the questionnaire. You can publish it later.',true],['Publish · free to use','All PsyLattice researchers can discover and use the questionnaire in their studies.',false],['Publish · permission required','Researchers can discover the questionnaire and publisher, but must request access before using its content.',false]].map(([title,body,selected])=><div key={String(title)} className={`rounded-xl border p-3 ${selected?'border-cyan-300 bg-cyan-50/40':'border-slate-200 bg-white'}`}><p className="text-[7px] font-semibold text-slate-700">{selected?'◉':'○'} &nbsp;{String(title)}</p><p className="mt-1 text-[6px] leading-3 text-slate-500">{String(body)}</p></div>)}
                </div>
              </ResearchSection>
            </div>
          </div>
          {questionnaireStep === 4 && <div className="absolute right-4 top-16 z-30"><TourInfoCloud title={questionnaireTourSteps[4].calloutTitle} body={questionnaireTourSteps[4].calloutBody} side="right" /></div>}
        </div>

        <div id="questionnaire-builder-structure" className={focusClass(5)}>
          <div className="grid grid-cols-[1.25fr_.85fr] gap-3">
            <ResearchSection>
              <div className="border-b border-slate-100 px-4 py-4"><p className="text-[9px] font-semibold text-slate-900">Questionnaire structure</p><p className="mt-1 text-[6.5px] text-slate-400">Build the questionnaire the way participants experience it: blocks contain their own questions and content.</p></div>
              <div className="p-4">
                <div className="rounded-[16px] border-l-[3px] border-slate-950 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2"><ResearchPill dark>BLOCK 1</ResearchPill><span className="text-[6px] text-slate-400">1 item</span></div><span className="text-[6.5px] text-rose-300">Remove block</span></div>
                  <ResearchInput className="mt-3">Main questionnaire</ResearchInput>
                  <div className="mt-2 h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[6.5px] text-slate-400">Optional instructions shown before the questions in this block</div>
                  <ResearchInput className="mt-2">▸ Block settings</ResearchInput>

                  <div className="mt-3 rounded-[14px] border border-cyan-300 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-[7px] font-bold text-cyan-800">1</span><div><p className="text-[7.5px] font-semibold text-slate-800">q1 &nbsp; <span className="rounded-full bg-cyan-50 px-2 py-1 text-[6px] text-cyan-800">Likert / agreement scale</span></p><p className="mt-1 text-[6px] text-slate-400">Ratings</p></div></div><div className="flex gap-1"><ResearchPill>↑</ResearchPill><ResearchPill>↓</ResearchPill><ResearchPill>Duplicate</ResearchPill><ResearchPill>Remove</ResearchPill></div></div>
                    <div className="mt-3 grid grid-cols-[115px_1fr] gap-2"><div><p className="mb-1 text-[6px] text-slate-400">Item key</p><ResearchInput>q1</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Response / content type</p><ResearchInput>Likert / agreement scale &nbsp;⌄</ResearchInput></div></div>
                    <p className="mt-3 text-[6px] text-slate-400">Question / statement</p><div className="mt-1 h-14 rounded-xl border border-slate-200 bg-white" />
                    <p className="mt-3 text-[6px] text-slate-400">Help text / secondary instructions</p><ResearchInput className="mt-1" />
                    <div className="mt-3 grid grid-cols-3 gap-2"><ResearchInput>Subscale</ResearchInput><ResearchInput>☑ Required</ResearchInput><ResearchInput>□ Reversed scored</ResearchInput></div>
                  </div>
                </div>
              </div>
            </ResearchSection>
            <div className="space-y-3">
              <ResearchSection className="p-4"><p className="text-[8px] font-semibold text-slate-800">Rights confirmation</p><div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3"><p className="text-[6.5px] leading-3.5 text-violet-700">□ &nbsp; I confirm that I created this instrument content, or I have the permission/licence required to reproduce and digitally administer it.</p></div><p className="mt-2 text-[6px] leading-3 text-slate-400">PsyLattice records this confirmation but does not independently verify third-party rights.</p></ResearchSection>
              <ResearchSection className="p-4"><p className="text-[8px] font-semibold text-slate-800">Save instrument</p><button className="mt-4 w-full rounded-full bg-slate-950 py-2.5 text-[7px] font-semibold text-white">Save privately</button><button className="mt-2 w-full rounded-full border border-slate-200 py-2 text-[7px] font-semibold text-slate-600">Cancel</button></ResearchSection>
            </div>
          </div>
          {questionnaireStep === 5 && <div className="absolute right-4 top-24 z-30"><TourInfoCloud title={questionnaireTourSteps[5].calloutTitle} body={questionnaireTourSteps[5].calloutBody} side="right" /></div>}
        </div>

        <div id="questionnaire-builder-response-logic" className={focusClass(6)}>
          <ResearchSection className="max-w-[760px] p-4">
            <p className="text-[8px] font-semibold text-slate-800">Response options</p>
            <p className="mt-1 text-[6px] text-slate-400">Participant label, numeric code/score and optional weight are stored separately.</p>
            <div className="mt-3 space-y-2">
              {[['Strongly disagree','1'],['Disagree','2'],['Neither agree nor disagree','3'],['Agree','4'],['Strongly agree','5']].map(([label,value])=><div key={label} className="grid grid-cols-[1fr_55px_55px_25px] gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><ResearchInput>{label}</ResearchInput><ResearchInput>{value}</ResearchInput><ResearchInput>1</ResearchInput><button className="rounded-lg border border-rose-200 text-[7px] text-rose-400">×</button></div>)}
            </div>
            <p className="mt-2 text-[6.5px] text-slate-500">□ Randomize option order</p>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3"><p className="text-[7px] font-medium text-slate-700">Attach image / audio / video (optional)</p><p className="mt-1 text-[6px] text-slate-400">Stored privately. Participants receive only a temporary signed viewing URL.</p><button className="mt-2 rounded-lg bg-slate-950 px-3 py-2 text-[6.5px] font-semibold text-white">Upload media</button><ResearchInput className="mt-2">Or paste an https:// media URL</ResearchInput></div>
            <div className="mt-3 rounded-xl border border-cyan-300 bg-cyan-50/20 p-3"><p className="text-[7px] font-semibold text-slate-700">Display logic / branching</p><p className="mt-1 text-[6px] leading-3 text-slate-500">Show this item only when earlier answers meet the conditions below. Choose the source question and response — no item-key typing is required.</p><ResearchPill className="mt-2">+ Condition</ResearchPill><div className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-[6px] text-slate-400">Add an earlier answerable question before using branching here.</div></div>
          </ResearchSection>
          {questionnaireStep === 6 && <div className="absolute right-[150px] top-20 z-30"><TourInfoCloud title={questionnaireTourSteps[6].calloutTitle} body={questionnaireTourSteps[6].calloutBody} side="right" /></div>}
        </div>

        <div id="questionnaire-builder-scoring" className={focusClass(7)}>
          <div className="grid grid-cols-[1.25fr_.85fr] gap-3">
            <ResearchSection>
              <div className="border-b border-slate-100 px-4 py-4"><p className="text-[9px] font-semibold text-slate-900">Scoring, missing data & randomisation</p><p className="mt-1 text-[6.5px] text-slate-400">Store the scoring plan without implying that a new measure has been validated.</p></div>
              <div className="p-4"><div className="grid grid-cols-2 gap-2"><div><p className="mb-1 text-[6px] text-slate-400">Scoring method</p><ResearchInput>No automatic score &nbsp;⌄</ResearchInput></div><div><p className="mb-1 text-[6px] text-slate-400">Missing-data rule</p><ResearchInput>Do not score if required items are missing &nbsp;⌄</ResearchInput></div></div><ResearchInput className="mt-3">□ Allow questionnaire-level item randomisation (block settings can override/structure this).</ResearchInput><p className="mt-3 text-[6px] text-slate-400">Scoring / analysis notes</p><div className="mt-1 h-20 rounded-xl border border-slate-200 bg-white" /><p className="mt-2 text-[6px] leading-3 text-slate-400">PsyLattice stores researcher-defined scoring. It does not infer psychometric validity, norms, diagnostic meaning or calibrated IRT/Rasch parameters.</p></div>
            </ResearchSection>
            <div className="space-y-3">
              <ResearchSection className="p-4"><p className="text-[8px] font-semibold text-slate-800">Rights confirmation</p><div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3"><p className="text-[6.5px] leading-3.5 text-violet-700">□ &nbsp; I confirm that I created this instrument content, or I have the permission/licence required to reproduce and digitally administer it.</p></div></ResearchSection>
              <ResearchSection className="p-4"><p className="text-[8px] font-semibold text-slate-800">Save instrument</p><button className="mt-4 w-full rounded-full bg-slate-950 py-2.5 text-[7px] font-semibold text-white">Save privately</button><button className="mt-2 w-full rounded-full border border-slate-200 py-2 text-[7px] font-semibold text-slate-600">Cancel</button></ResearchSection>
            </div>
          </div>
          {questionnaireStep === 7 && <div className="absolute right-4 top-14 z-30"><TourInfoCloud title={questionnaireTourSteps[7].calloutTitle} body={questionnaireTourSteps[7].calloutBody} side="right" /></div>}
        </div>
      </div>
    );
  }

  if (slideId === "cognitive-lab") {
    return <CognitiveLabTourDemo step={cognitiveStep} />;
  }

  if (slideId === "ambulatory") {
    return (
      <div>
        <ScreenTitle eyebrow="Ambulatory Builder" title="Daily emotion protocol" action="Add check-in" />
        <div className="grid grid-cols-[1fr_.9fr] gap-3">
          <DemoCard className="p-4" highlight>
            <p className="text-xs font-semibold text-slate-900">Schedule</p>
            <div className="mt-3 space-y-2">
              {["09:00 Morning", "14:00 Afternoon", "20:00 Evening"].map((time) => (
                <div key={time} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                  <span className="text-[10px] font-medium text-slate-700">{time}</span>
                  <span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-semibold text-cyan-700">Fixed time</span>
                </div>
              ))}
            </div>
          </DemoCard>
          <DemoCard className="p-4">
            <p className="text-xs font-semibold text-slate-900">Protocol</p>
            <div className="mt-3 space-y-2">
              {["Mood rating", "Stress slider", "Context question"].map((item, index) => (
                <div key={item} className="rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] text-slate-600">{index + 1}. {item}</div>
              ))}
            </div>
          </DemoCard>
        </div>
      </div>
    );
  }

  if (slideId === "wearable-data") {
    return (
      <div>
        <ScreenTitle eyebrow="Wearables & Mobile Data" title="Add passive context to a study" action="Connect source" />
        <div className="grid grid-cols-[1.05fr_.95fr] gap-3">
          <DemoCard className="p-4" highlight>
            <p className="text-xs font-semibold text-slate-900">Longitudinal streams</p>
            <div className="mt-3 space-y-2">
              {[
                ["Sleep", "duration · timing · daily summary"],
                ["Activity", "steps · exercise · movement"],
                ["Heart-rate context", "supported summary variables"],
                ["EMA / ESM", "active participant check-ins"],
              ].map(([name, helper], index) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-700">{name}</p>
                    <p className="mt-0.5 text-[8px] text-slate-400">{helper}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${index < 3 ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{index < 3 ? "Passive" : "Active"}</span>
                </div>
              ))}
            </div>
          </DemoCard>

          <DemoCard className="p-4">
            <p className="text-xs font-semibold text-slate-900">Example research timeline</p>
            <p className="mt-1 text-[9px] leading-4 text-slate-500">Sleep → morning Corsi → daily stress → evening mood</p>
            <div className="mt-4 space-y-3">
              {[
                ["Night", "Wearable sleep summary"],
                ["08:30", "Corsi Block task"],
                ["14:00", "Stress EMA"],
                ["20:00", "Mood check-in"],
              ].map(([time, event], index) => (
                <div key={time} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`h-3 w-3 rounded-full ${index === 1 ? "bg-cyan-600" : "bg-slate-300"}`} />
                    {index < 3 && <span className="h-7 w-px bg-slate-200" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-[9px] font-semibold text-slate-700">{time}</p>
                    <p className="text-[8px] text-slate-500">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </DemoCard>
        </div>
      </div>
    );
  }

  if (slideId === "participants") {
    return (
      <div>
        <ScreenTitle eyebrow="Participants" title="Study participants" action="Create participant link" />
        <DemoCard className="overflow-hidden" highlight>
          <div className="grid grid-cols-5 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span>ID</span><span>Status</span><span>Baseline</span><span>Follow-up</span><span>Last activity</span>
          </div>
          {[
            ["PL-1042", "Active", "Complete", "Due", "2h ago"],
            ["PL-1043", "Active", "Complete", "Complete", "1d ago"],
            ["PL-1044", "Invited", "Pending", "—", "3d ago"],
          ].map((row) => (
            <div key={row[0]} className="grid grid-cols-5 border-t border-slate-200 px-4 py-3 text-[9px] text-slate-600">
              {row.map((cell) => <span key={cell}>{cell}</span>)}
            </div>
          ))}
        </DemoCard>
      </div>
    );
  }

  if (slideId === "followups") {
    return (
      <div>
        <ScreenTitle eyebrow="Follow-Up Manager" title="Longitudinal waves" action="Add wave" />
        <div className="space-y-3">
          {[
            ["Baseline", "Complete", "128 participants"],
            ["Day 7", "Sending", "93 invited"],
            ["Day 30", "Scheduled", "Starts 18 Sep"],
          ].map(([name, status, helper], index) => (
            <DemoCard key={name} className="p-4" highlight={index === 1}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-[9px] text-slate-400">{helper}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${status === "Complete" ? "bg-cyan-50 text-cyan-800" : status === "Sending" ? "bg-cyan-50 text-cyan-700" : "bg-slate-100 text-slate-600"}`}>{status}</span>
              </div>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "data") {
    return (
      <div>
        <ScreenTitle eyebrow="Data Explorer" title="Research Data" />
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Responses" value="1,842" />
          <MiniStat label="Files" value="26" />
          <MiniStat label="Complete" value="91%" />
        </div>
        <DemoCard className="mt-3 overflow-hidden" highlight>
          <div className="grid grid-cols-4 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span>Participant</span><span>Questionnaire</span><span>Answered</span><span>Status</span>
          </div>
          {[
            ["PL-1042", "PSS-10", "10/10", "Complete"],
            ["PL-1042", "Image Choice", "1/1", "Complete"],
            ["PL-1043", "PSS-10", "8/10", "In progress"],
          ].map((row) => (
            <div key={row.join("-")} className="grid grid-cols-4 border-t border-slate-200 px-4 py-3 text-[9px] text-slate-600">
              {row.map((cell) => <span key={cell}>{cell}</span>)}
            </div>
          ))}
        </DemoCard>
      </div>
    );
  }

  if (slideId === "analysis-lab") {
    return <AnalysisLabTourDemo step={analysisStep} />;
  }

  if (slideId === "thesis-builder") {
    return <ThesisBuilderTourDemo step={thesisStep} />;
  }

  if (slideId === "research-ai") {
    return (
      <div>
        <ScreenTitle eyebrow="Research dashboard" title="AI stays available across the workspace" />
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Active studies" value="4" helper="research workspace" />
          <MiniStat label="AI budget" value="38% left" helper="visible in the top bar" />
          <MiniStat label="Current mode" value="PsyLattice Auto" helper="switch models from the header" />
        </div>
        <div className="mt-3 grid grid-cols-[1.15fr_.85fr] gap-3">
          <DemoCard className="p-4" highlight>
            <p className="text-xs font-semibold text-slate-900">Current research context</p>
            <p className="mt-1 text-[9px] leading-4 text-slate-500">AI help can stay grounded in the part of PsyLattice you are actually using instead of starting from a blank chat.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["Study design", "Cognitive tasks", "Analysis output", "Thesis writing"].map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[8px] font-semibold text-slate-600">✓ {item}</div>
              ))}
            </div>
          </DemoCard>
          <DemoCard className="p-4">
            <p className="text-xs font-semibold text-slate-900">Why the switcher matters</p>
            <p className="mt-2 text-[9px] leading-4 text-slate-500">Use Auto when you want PsyLattice to choose the most appropriate connected model, or select a model yourself when you have a preference.</p>
            <p className="mt-3 text-[8px] font-semibold text-cyan-800">The highlighted control is in the real top navigation above.</p>
          </DemoCard>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ScreenTitle eyebrow="Export & Reproducibility" title="Build an analysis-ready file" action="Generate export" />
      <div className="grid grid-cols-[.9fr_1.1fr] gap-3">
        <DemoCard className="p-4" highlight>
          <p className="text-xs font-semibold text-slate-900">Dataset</p>
          <div className="mt-3 space-y-2">
            {["Analysis wide", "Questionnaire responses", "Participant summary", "Ambulatory responses"].map((item, index) => (
              <label key={item} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] text-slate-600">
                <input type="radio" name="dataset-demo" defaultChecked={index === 0} />
                {item}
              </label>
            ))}
          </div>
        </DemoCard>
        <DemoCard className="p-4">
          <p className="text-xs font-semibold text-slate-900">Export preview</p>
          <div className="mt-3 rounded-xl bg-slate-950 p-3 font-mono text-[8px] leading-4 text-cyan-100">
            participant_id, phase, PSS_1, PSS_2, image_choice<br />
            PL-1042, baseline, 2, 3, option_a<br />
            PL-1043, baseline, 4, 2, option_b
          </div>
          <button className="mt-3 flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-[9px] font-semibold text-white">
            <FileDown className="h-3 w-3" /> XLSX
          </button>
        </DemoCard>
      </div>
    </div>
  );
}

function ClinicalDemo({ slideId }: { slideId: string }) {
  const [note, setNote] = useState("");

  if (slideId === "clients") {
    return (
      <div>
        <ScreenTitle eyebrow="Clinical workspace" title="Clients" action="Invite client" />
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Connected" value="18" />
          <MiniStat label="Needs review" value="4" />
          <MiniStat label="Today" value="6 appts" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {["Aarav S.", "Maya R.", "Nisha K.", "Rohan D."].map((name, index) => (
            <DemoCard key={name} className="p-4" highlight={index === 0}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-800"><Users className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-[9px] text-slate-400">Connected · updated today</p>
                </div>
              </div>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "client-overview") {
    return (
      <div>
        <ScreenTitle eyebrow="Client overview" title="Aarav S." />
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Assessments" value="4" />
          <MiniStat label="Monitoring" value="Active" />
          <MiniStat label="Next appt" value="Fri 10:00" />
        </div>
        <div className="mt-3 grid grid-cols-[1.2fr_.8fr] gap-3">
          <DemoCard className="p-4" highlight>
            <p className="text-xs font-semibold text-slate-900">Recent shared activity</p>
            <div className="mt-3 space-y-2">
              {["Mood check-in completed", "PSS-10 shared", "Progress permission updated"].map((item) => (
                <div key={item} className="rounded-xl bg-slate-50 px-3 py-2.5 text-[10px] text-slate-600">{item}</div>
              ))}
            </div>
          </DemoCard>
          <DemoCard className="p-4">
            <p className="text-xs font-semibold text-slate-900">Access</p>
            <div className="mt-3 space-y-2 text-[9px] text-slate-500">
              <p>✓ Assessments</p><p>✓ Monitoring</p><p>✓ Progress</p><p className="text-slate-300">– AI Guide</p>
            </div>
          </DemoCard>
        </div>
      </div>
    );
  }

  if (slideId === "assessments") {
    return (
      <div>
        <ScreenTitle eyebrow="Assessments" title="Aarav S." action="Assign measure" />
        <div className="space-y-3">
          {["Perceived Stress Scale", "WHO-5 Well-Being", "General Self-Efficacy Scale"].map((name, index) => (
            <DemoCard key={name} className="p-4" highlight={index === 0}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-[9px] text-slate-400">Completed {index + 1} week ago</p>
                </div>
                <button className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">Review</button>
              </div>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "monitoring") {
    return (
      <div>
        <ScreenTitle eyebrow="Monitoring" title="Shared daily data" action="Propose protocol" />
        <DemoCard className="p-4" highlight>
          <div className="flex h-36 items-end gap-2 rounded-xl bg-slate-50 p-4">
            {[42, 68, 55, 80, 61, 73, 66].map((height, index) => <div key={index} className="flex-1 rounded-t-md bg-cyan-300" style={{ height: `${height}px` }} />)}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Check-ins" value="19" />
            <MiniStat label="Completion" value="95%" />
            <MiniStat label="Stress avg" value="4.1" />
          </div>
        </DemoCard>
      </div>
    );
  }

  if (slideId === "progress") {
    return (
      <div>
        <ScreenTitle eyebrow="Progress" title="Longitudinal view" />
        <div className="grid grid-cols-2 gap-3">
          <DemoCard className="p-4" highlight>
            <p className="text-xs font-semibold text-slate-900">Well-being</p>
            <div className="mt-4 flex h-28 items-end gap-2">{[48, 50, 57, 61, 66, 71].map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-cyan-200" style={{ height: `${h}px` }} />)}</div>
          </DemoCard>
          <DemoCard className="p-4">
            <p className="text-xs font-semibold text-slate-900">Stress</p>
            <div className="mt-4 flex h-28 items-end gap-2">{[82, 75, 70, 64, 58, 52].map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-cyan-200" style={{ height: `${h}px` }} />)}</div>
          </DemoCard>
        </div>
      </div>
    );
  }

  if (slideId === "care-pathway") {
    return (
      <div>
        <ScreenTitle eyebrow="Care Pathway" title="Current plan" action="Add step" />
        <div className="space-y-3">
          {["Stabilise sleep routine", "Practice pre-presentation grounding", "Review monitoring data", "Reassess after 4 weeks"].map((item, index) => (
            <DemoCard key={item} className="p-4" highlight={index === 1}>
              <div className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold ${index < 2 ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</div>
                <p className="text-[10px] font-medium text-slate-700">{item}</p>
              </div>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "notes") {
    return (
      <div>
        <ScreenTitle eyebrow="Professional Notes" title="Session note" action="Save note" />
        <DemoCard className="p-4" highlight>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="h-44 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] leading-5 text-slate-700 outline-none" placeholder="Write a private professional note..." />
          <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-400"><Lock className="h-3 w-3" /> Private clinician-authored record</div>
        </DemoCard>
      </div>
    );
  }

  if (slideId === "appointments") {
    return (
      <div>
        <ScreenTitle eyebrow="Appointments" title="Today" action="New appointment" />
        <div className="space-y-2">
          {["09:00 Aarav S.", "10:30 Maya R.", "13:00 Nisha K.", "16:00 Rohan D."].map((item, index) => (
            <DemoCard key={item} className="flex items-center justify-between p-4" highlight={index === 1}>
              <span className="text-[10px] font-semibold text-slate-700">{item}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500">50 min</span>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "messages") {
    return (
      <div>
        <ScreenTitle eyebrow="Secure Messages" title="Aarav S." />
        <DemoCard className="p-4" highlight>
          <div className="space-y-3">
            <div className="max-w-[72%] rounded-2xl rounded-tl-md bg-slate-100 px-3 py-2.5 text-[10px] text-slate-700">I completed the evening monitoring yesterday.</div>
            <div className="ml-auto max-w-[72%] rounded-2xl rounded-tr-md bg-cyan-700 px-3 py-2.5 text-[10px] text-white">Thanks. We can review the pattern during Friday's session.</div>
          </div>
          <div className="mt-4 flex gap-2 border-t border-slate-200 pt-3">
            <input className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] outline-none" placeholder="Write a message..." />
            <button className="rounded-xl bg-slate-950 px-3 text-[10px] font-semibold text-white">Send</button>
          </div>
        </DemoCard>
      </div>
    );
  }

  return (
    <div>
      <ScreenTitle eyebrow="Receptionist Access" title="Appointment-only permissions" />
      <DemoCard className="p-4" highlight>
        <div className="space-y-2">
          {[
            ["View appointment calendar", true],
            ["Create / reschedule appointments", true],
            ["View assessments", false],
            ["View professional notes", false],
            ["View client monitoring", false],
          ].map(([label, allowed]) => (
            <div key={String(label)} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
              <span className="text-[10px] font-medium text-slate-700">{String(label)}</span>
              <span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${allowed ? "bg-cyan-50 text-cyan-800" : "bg-slate-100 text-slate-400"}`}>{allowed ? "Allowed" : "Blocked"}</span>
            </div>
          ))}
        </div>
      </DemoCard>
    </div>
  );
}

function MockWorkspace({
  workspace,
  config,
  activeSlideId,
  dashboardStep = 0,
  studiesStep = 0,
  studyBuilderStep = 0,
  questionnaireStep = 0,
  cognitiveStep = 0,
  thesisStep = 0,
  ambulatoryStep = 0,
  participantsStep = 0,
  participantLinksStep = 0,
  dataDashboardStep = 0,
  dataExplorerStep = 0,
  analysisStep = 0,
  exportStep = 0,
  onNavigate,
}: {
  workspace: Workspace;
  config: TourConfig;
  activeSlideId: string;
  dashboardStep?: number;
  studiesStep?: number;
  studyBuilderStep?: number;
  questionnaireStep?: number;
  cognitiveStep?: number;
  thesisStep?: number;
  ambulatoryStep?: number;
  participantsStep?: number;
  participantLinksStep?: number;
  dataDashboardStep?: number;
  dataExplorerStep?: number;
  analysisStep?: number;
  exportStep?: number;
  onNavigate: (slideId: string) => void;
}) {
  const [modelChoice, setModelChoice] = useState("PsyLattice Auto");

  if (workspace === "researcher") {
    if (activeSlideId === "thesis-builder" && thesisStep === 5) {
      return (
        <div className="h-full min-h-[520px] overflow-auto rounded-[24px] border border-slate-200/90 bg-[#f7fafb] text-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.09)]">
          <ResearchDemo slideId={activeSlideId} dashboardStep={dashboardStep} studiesStep={studiesStep} studyBuilderStep={studyBuilderStep} questionnaireStep={questionnaireStep} cognitiveStep={cognitiveStep} thesisStep={thesisStep} ambulatoryStep={ambulatoryStep} participantsStep={participantsStep} participantLinksStep={participantLinksStep} dataDashboardStep={dataDashboardStep} dataExplorerStep={dataExplorerStep} analysisStep={analysisStep} exportStep={exportStep} />
        </div>
      );
    }

    if (activeSlideId === "analysis-lab" && analysisStep === 1) {
      return (
        <div className="h-full min-h-[520px] overflow-auto rounded-[24px] border border-slate-200/90 bg-[#f7fafb] text-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.09),0_2px_10px_rgba(8,145,178,0.045)]">
          <ResearchDemo slideId={activeSlideId} dashboardStep={dashboardStep} studiesStep={studiesStep} studyBuilderStep={studyBuilderStep} questionnaireStep={questionnaireStep} cognitiveStep={cognitiveStep} thesisStep={thesisStep} ambulatoryStep={ambulatoryStep} participantsStep={participantsStep} participantLinksStep={participantLinksStep} dataDashboardStep={dataDashboardStep} dataExplorerStep={dataExplorerStep} analysisStep={analysisStep} exportStep={exportStep} />
        </div>
      );
    }

    const researchNav = [
      ["Dashboard", "dashboard"],
      ["Studies", "studies"],
      ["Study Builder", "study-builder"],
      ["Questionnaire Library", "questionnaires"],
      ["Cognitive Lab", "cognitive-lab"],
      ["Thesis Builder", "thesis-builder"],
      ["Ambulatory Assessment", "ambulatory"],
      ["Follow-up Manager", "followups"],
      ["Participants", "participants"],
      ["Participant Links", "participant-links"],
    ] as const;

    const dataNav = [
      ["Data Dashboard", "data-dashboard"],
      ["Data Explorer", "data-explorer"],
      ["Analysis Lab", "analysis-lab"],
      ["Export Data", "export"],
    ] as const;

    const governanceNav = [
      ["Ethics & Consent", "studies"],
      ["Team & Permissions", "studies"],
      ["Plans & Billing", "plans-billing"],
    ] as const;

    const activeLabelBySlide: Record<string, string> = {
      dashboard: "Dashboard",
      studies: "Studies",
      "study-builder": "Study Builder",
      questionnaires: "Questionnaire Library",
      "custom-questionnaires": "Questionnaire Library",
      "cognitive-lab": "Cognitive Lab",
      ambulatory: "Ambulatory Assessment",
      "wearable-data": "Ambulatory Assessment",
      participants: "Participants",
      "participant-links": "Participant Links",
      followups: "Follow-up Manager",
      "data-dashboard": "Data Dashboard",
      "data-explorer": "Data Explorer",
      "thesis-builder": "Thesis Builder",
      export: "Export Data",
      "plans-billing": "Plans & Billing",
    };

    const activeLabel = activeLabelBySlide[activeSlideId] ?? "";
    const edgeToEdge = activeSlideId === "thesis-builder";

    const iconForLabel = (label: string) => {
      if (label === "Dashboard") return <LayoutDashboard className="h-3.5 w-3.5" />;
      if (label === "Studies") return <BookOpen className="h-3.5 w-3.5" />;
      if (label === "Study Builder") return <Workflow className="h-3.5 w-3.5" />;
      if (label === "Questionnaire Library") return <BookOpen className="h-3.5 w-3.5" />;
      if (label === "Cognitive Lab") return <Activity className="h-3.5 w-3.5" />;
      if (label === "Thesis Builder") return <FileText className="h-3.5 w-3.5" />;
      if (label === "Ambulatory Assessment") return <Activity className="h-3.5 w-3.5" />;
      if (label === "Follow-up Manager") return <CalendarDays className="h-3.5 w-3.5" />;
      if (label === "Participants") return <Users className="h-3.5 w-3.5" />;
      if (label === "Participant Links") return <Workflow className="h-3.5 w-3.5" />;
      if (label === "Data Dashboard") return <BarChart3 className="h-3.5 w-3.5" />;
      if (label === "Data Explorer") return <Database className="h-3.5 w-3.5" />;
      if (label === "Export Data") return <FileDown className="h-3.5 w-3.5" />;
      if (label === "Ethics & Consent") return <ShieldCheck className="h-3.5 w-3.5" />;
      if (label === "Team & Permissions") return <Users className="h-3.5 w-3.5" />;
      if (label === "Plans & Billing") return <Settings2 className="h-3.5 w-3.5" />;
      return <BarChart3 className="h-3.5 w-3.5" />;
    };

    const navButton = (label: string, slideId: string) => {
      const active = activeLabel === label;
      const showBadge = label === "Cognitive Lab" || label === "Analysis Lab";
      return (
        <button
          key={`${label}-${slideId}`}
          type="button"
          onClick={() => onNavigate(slideId)}
          className={`flex w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-[9px] transition ${active ? "border-cyan-200 bg-white font-semibold text-cyan-900 shadow-[0_7px_18px_rgba(8,145,178,0.15),0_14px_28px_rgba(15,23,42,0.05)]" : "border-transparent font-medium text-slate-500 hover:bg-white hover:text-slate-800"}`}
        >
          <span className={active ? "text-cyan-700" : "text-slate-400"}>{iconForLabel(label)}</span>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {showBadge && (
            <span className="flex shrink-0 items-center gap-1">
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[5.5px] font-semibold uppercase tracking-[0.08em] text-cyan-700">New</span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-1.5 py-0.5 text-[5.5px] font-semibold uppercase tracking-[0.08em] text-cyan-700">Beta</span>
            </span>
          )}
        </button>
      );
    };

    return (
      <div className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-[#edf3f4] text-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.09),0_2px_10px_rgba(8,145,178,0.045)]">
        <header className="relative z-20 mx-2 mt-2 flex h-[60px] shrink-0 items-center justify-between rounded-[24px] border border-slate-200/80 bg-white px-5 shadow-[0_7px_20px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <PsyLatticeLogo size={34} />
            <div>
              <p className="text-[12px] font-semibold tracking-tight text-slate-900">PsyLattice</p>
              <p className="mt-0.5 text-[7px] text-slate-400">Research workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="text-[7px] font-semibold text-slate-700">AI budget</span>
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[62%] rounded-full bg-cyan-500" />
              </div>
              <span className="text-[7px] font-semibold text-slate-500">38% left</span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("research-ai")}
              className={`flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-[8px] font-semibold shadow-sm transition ${activeSlideId === "research-ai" ? "border-cyan-300 text-cyan-900 ring-2 ring-cyan-100" : "border-cyan-200 text-slate-700 hover:border-cyan-300"}`}
            >
              <Sparkles className="h-3 w-3 text-cyan-600" />
              {modelChoice}
              <span className="text-slate-400">⌄</span>
            </button>

            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-2 text-[7px] font-semibold text-cyan-800">Researcher</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[8px] font-semibold text-slate-600">PD</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[7px] font-semibold text-slate-600 shadow-sm">Sign out</span>
          </div>

          {activeSlideId === "research-ai" && (
            <div className="absolute right-[195px] top-[50px] z-40 w-[250px] rounded-[18px] border border-cyan-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
              <div className="px-2 py-1">
                <p className="text-[7px] font-semibold uppercase tracking-[0.12em] text-cyan-700">AI model switcher</p>
                <p className="mt-1 text-[6.5px] leading-3 text-slate-400">Choose a model without leaving the current research workspace.</p>
              </div>
              {[
                ["PsyLattice Auto", "Recommended · routes automatically"],
                ["PsyLattice AI", "Research-guided default"],
                ["OpenAI GPT", "General reasoning & writing"],
                ["Claude", "Long-form reading & drafting"],
                ["Gemini", "Alternative connected model"],
              ].map(([name, helper]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setModelChoice(name)}
                  className={`mt-1 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left ${modelChoice === name ? "border-cyan-200 bg-cyan-50" : "border-transparent hover:bg-slate-50"}`}
                >
                  <div>
                    <p className="text-[7.5px] font-semibold text-slate-700">{name}</p>
                    <p className="mt-0.5 text-[6px] text-slate-400">{helper}</p>
                  </div>
                  {modelChoice === name && <Check className="h-3 w-3 text-cyan-700" />}
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="flex min-h-0 flex-1 gap-3 p-2 pt-3">
          <aside className="w-[185px] shrink-0 overflow-y-auto rounded-[24px] border border-slate-200/80 bg-white px-3 py-4 shadow-[0_7px_20px_rgba(15,23,42,0.05)]">
            <div className="flex justify-end">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] text-slate-500 shadow-sm">‹</span>
            </div>

            <p className="mt-3 px-2 text-[7px] font-semibold uppercase tracking-[0.16em] text-slate-400">Research</p>
            <div className="mt-2 space-y-1">
              {researchNav.map(([label, slideId]) => navButton(label, slideId))}
            </div>

            <p className="mt-5 px-2 text-[7px] font-semibold uppercase tracking-[0.16em] text-slate-400">Data</p>
            <div className="mt-2 space-y-1">
              {dataNav.map(([label, slideId]) => navButton(label, slideId))}
            </div>

            <p className="mt-5 px-2 text-[7px] font-semibold uppercase tracking-[0.16em] text-slate-400">Governance</p>
            <div className="mt-2 space-y-1">
              {governanceNav.map(([label, slideId]) => navButton(label, slideId))}
            </div>

            <div className="mt-5 rounded-[17px] border border-cyan-200 bg-cyan-50/50 p-3">
              <p className="text-[7px] font-semibold text-cyan-900">Research workspace</p>
              <p className="mt-1 text-[6.5px] leading-3.5 text-slate-500">Saved studies, participant records and recruitment links shown here are loaded from your PsyLattice research database.</p>
            </div>
          </aside>

          <main
            data-tour-scroll={activeSlideId === "dashboard" || activeSlideId === "studies" || activeSlideId === "study-builder" || activeSlideId === "questionnaires" || activeSlideId === "cognitive-lab" || activeSlideId === "thesis-builder" || activeSlideId === "ambulatory" || activeSlideId === "participants" || activeSlideId === "participant-links" || activeSlideId === "data-dashboard" || activeSlideId === "data-explorer" || activeSlideId === "analysis-lab" || activeSlideId === "export" ? "true" : undefined}
            className={`min-w-0 flex-1 overflow-auto scroll-smooth ${edgeToEdge ? "p-0" : "p-3"}`}
          >
            <ResearchDemo slideId={activeSlideId} dashboardStep={dashboardStep} studiesStep={studiesStep} studyBuilderStep={studyBuilderStep} questionnaireStep={questionnaireStep} cognitiveStep={cognitiveStep} thesisStep={thesisStep} ambulatoryStep={ambulatoryStep} participantsStep={participantsStep} participantLinksStep={participantLinksStep} dataDashboardStep={dataDashboardStep} dataExplorerStep={dataExplorerStep} analysisStep={analysisStep} exportStep={exportStep} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[520px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-[#f6fafb] text-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.09),0_2px_10px_rgba(8,145,178,0.045)]">
      <aside className="w-[190px] shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white/96 p-3">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <PsyLatticeLogo size={26} />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-slate-800">PsyLattice</p>
            <p className="truncate text-[8px] text-slate-400">{config.shortLabel} workspace</p>
          </div>
        </div>

        <p className="mb-2 px-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
        <div className="space-y-1 pb-2">
          {config.slides.map((slide) => {
            const active = slide.id === activeSlideId;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => onNavigate(slide.id)}
                className={`flex w-full items-center gap-2 rounded-full border px-2.5 py-2 text-left text-[9px] font-medium transition-all ${active ? "border-cyan-200/80 bg-white font-semibold text-cyan-900 shadow-[0_5px_14px_rgba(8,145,178,0.14),0_10px_22px_rgba(15,23,42,0.05)]" : "border-transparent text-slate-500 hover:border-slate-200/80 hover:bg-white hover:text-slate-800 hover:shadow-[0_3px_10px_rgba(15,23,42,0.04)]"}`}
              >
                <span className={active ? "text-cyan-700" : "text-slate-400"}>{navIcons[slide.id] ?? <ChevronRight className="h-3.5 w-3.5" />}</span>
                <span className="truncate">{slide.title}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-[18px] border border-cyan-200/80 bg-cyan-50/70 p-3 text-slate-700 shadow-[0_7px_18px_rgba(8,145,178,0.07)]">
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-900">Guided tour</p>
          <p className="mt-1 text-[8px] leading-4 text-slate-500">Feature preview with sample workspace content.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex h-12 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4">
          <div>
            <p className="text-[9px] font-semibold text-slate-700">{config.label}</p>
            <p className="text-[8px] text-slate-400">Interactive onboarding preview</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">Tour</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600">PD</div>
          </div>
        </div>

        <div className="h-[calc(100%-48px)] overflow-auto p-4">
          {workspace === "self" && <SelfDemo slideId={activeSlideId} />}
          {workspace === "clinician" && <ClinicalDemo slideId={activeSlideId} />}
        </div>
      </div>
    </div>
  );
}

function WorkspaceTour() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const workspace = useMemo(
    () => normaliseWorkspace(searchParams.get("workspace")),
    [searchParams]
  );

  const replay = searchParams.get("replay") === "1";
  const config = workspace ? tourConfigs[workspace] : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dashboardFeatureIndex, setDashboardFeatureIndex] = useState(0);
  const [studiesFeatureIndex, setStudiesFeatureIndex] = useState(0);
  const [studyBuilderFeatureIndex, setStudyBuilderFeatureIndex] = useState(0);
  const [questionnaireFeatureIndex, setQuestionnaireFeatureIndex] = useState(0);
  const [cognitiveFeatureIndex, setCognitiveFeatureIndex] = useState(0);
  const [thesisFeatureIndex, setThesisFeatureIndex] = useState(0);
  const [ambulatoryFeatureIndex, setAmbulatoryFeatureIndex] = useState(0);
  const [participantsFeatureIndex, setParticipantsFeatureIndex] = useState(0);
  const [participantLinksFeatureIndex, setParticipantLinksFeatureIndex] = useState(0);
  const [dataDashboardFeatureIndex, setDataDashboardFeatureIndex] = useState(0);
  const [dataExplorerFeatureIndex, setDataExplorerFeatureIndex] = useState(0);
  const [analysisFeatureIndex, setAnalysisFeatureIndex] = useState(0);
  const [exportFeatureIndex, setExportFeatureIndex] = useState(0);
  const [error, setError] = useState("");
  const [focusOpen, setFocusOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTour() {
      if (!workspace || !config) {
        router.replace("/workspace");
        return;
      }

      const destination = config.destination;
      const slideCount = config.slides.length;
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        router.replace(`/signin?workspace=${workspace}`);
        return;
      }

      const { data: onboarding, error: onboardingError } = await supabase
        .from("workspace_onboarding")
        .select("current_step, completed_at")
        .eq("user_id", user.id)
        .eq("workspace", workspace)
        .maybeSingle();

      if (cancelled) return;

      if (onboardingError) {
        console.error("Could not load workspace tour:", onboardingError);
        setError("We could not restore your previous position.");
      }

      if (onboarding?.completed_at && !replay) {
        router.replace(destination);
        return;
      }

      if (!replay && typeof onboarding?.current_step === "number") {
        setCurrentIndex(
          Math.max(0, Math.min(slideCount - 1, onboarding.current_step - 1))
        );
      }

      setLoading(false);
    }

    void loadTour();

    return () => {
      cancelled = true;
    };
  }, [workspace, config, replay, router]);

  useEffect(() => {
    if (!focusOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFocusOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusOpen]);

  useEffect(() => {
    const currentSlide = config?.slides[currentIndex];

    if (workspace !== "researcher") {
      setDashboardFeatureIndex(0);
      setStudiesFeatureIndex(0);
      setStudyBuilderFeatureIndex(0);
      setQuestionnaireFeatureIndex(0);
      setCognitiveFeatureIndex(0);
      setThesisFeatureIndex(0);
      setAmbulatoryFeatureIndex(0);
      setParticipantsFeatureIndex(0);
      setParticipantLinksFeatureIndex(0);
      setDataDashboardFeatureIndex(0);
      setDataExplorerFeatureIndex(0);
      setAnalysisFeatureIndex(0);
      setExportFeatureIndex(0);
      return;
    }

    if (currentSlide?.id !== "dashboard") setDashboardFeatureIndex(0);
    if (currentSlide?.id !== "studies") setStudiesFeatureIndex(0);
    if (currentSlide?.id !== "study-builder") setStudyBuilderFeatureIndex(0);
    if (currentSlide?.id !== "questionnaires") setQuestionnaireFeatureIndex(0);
    if (currentSlide?.id !== "cognitive-lab") setCognitiveFeatureIndex(0);
    if (currentSlide?.id !== "thesis-builder") setThesisFeatureIndex(0);
    if (currentSlide?.id !== "ambulatory") setAmbulatoryFeatureIndex(0);
    if (currentSlide?.id !== "participants") setParticipantsFeatureIndex(0);
    if (currentSlide?.id !== "participant-links") setParticipantLinksFeatureIndex(0);
    if (currentSlide?.id !== "data-dashboard") setDataDashboardFeatureIndex(0);
    if (currentSlide?.id !== "data-explorer") setDataExplorerFeatureIndex(0);
    if (currentSlide?.id !== "analysis-lab") setAnalysisFeatureIndex(0);
    if (currentSlide?.id !== "export") setExportFeatureIndex(0);

    const isDashboard = currentSlide?.id === "dashboard";
    const isStudies = currentSlide?.id === "studies";
    const isStudyBuilder = currentSlide?.id === "study-builder";
    const isQuestionnaires = currentSlide?.id === "questionnaires";
    const isCognitive = currentSlide?.id === "cognitive-lab";
    const isThesis = currentSlide?.id === "thesis-builder";
    const isAmbulatory = currentSlide?.id === "ambulatory";
    const isParticipants = currentSlide?.id === "participants";
    const isParticipantLinks = currentSlide?.id === "participant-links";
    const isDataDashboard = currentSlide?.id === "data-dashboard";
    const isDataExplorer = currentSlide?.id === "data-explorer";
    const isAnalysis = currentSlide?.id === "analysis-lab";
    const isExport = currentSlide?.id === "export";
    if (!isDashboard && !isStudies && !isStudyBuilder && !isQuestionnaires && !isCognitive && !isThesis && !isAmbulatory && !isParticipants && !isParticipantLinks && !isDataDashboard && !isDataExplorer && !isAnalysis && !isExport) return;

    const timer = window.setTimeout(() => {
      const steps = isDashboard
        ? dashboardTourSteps
        : isStudies
          ? studiesTourSteps
          : isStudyBuilder
            ? studyBuilderTourSteps
            : isQuestionnaires
              ? questionnaireTourSteps
              : isCognitive
                ? cognitiveTourSteps
                : isThesis
                  ? thesisTourSteps
                  : isAmbulatory
                    ? ambulatoryTourSteps
                    : isParticipants
                      ? participantsTourSteps
                      : isParticipantLinks
                        ? participantLinksTourSteps
                        : isDataDashboard
                          ? dataDashboardTourSteps
                          : isDataExplorer
                            ? dataExplorerTourSteps
                            : isAnalysis
                              ? analysisTourSteps
                              : exportTourSteps;
      const featureIndex = isDashboard
        ? dashboardFeatureIndex
        : isStudies
          ? studiesFeatureIndex
          : isStudyBuilder
            ? studyBuilderFeatureIndex
            : isQuestionnaires
              ? questionnaireFeatureIndex
              : isCognitive
                ? cognitiveFeatureIndex
                : isThesis
                  ? thesisFeatureIndex
                  : isAmbulatory
                    ? ambulatoryFeatureIndex
                    : isParticipants
                      ? participantsFeatureIndex
                      : isParticipantLinks
                        ? participantLinksFeatureIndex
                        : isDataDashboard
                          ? dataDashboardFeatureIndex
                          : isDataExplorer
                            ? dataExplorerFeatureIndex
                            : isAnalysis
                              ? analysisFeatureIndex
                              : exportFeatureIndex;
      const targetId = steps[featureIndex]?.targetId;
      if (!targetId) return;

      document.querySelectorAll<HTMLElement>('[data-tour-scroll="true"]').forEach((scrollContainer) => {
        if (
          (isDashboard && featureIndex <= 2) ||
          (isStudies && featureIndex === 0) ||
          isStudyBuilder ||
          (isQuestionnaires && (featureIndex === 0 || featureIndex === 3)) ||
          isCognitive ||
          isThesis ||
          (isAmbulatory && featureIndex <= 1) ||
          (isParticipants && featureIndex === 0) ||
          (isParticipantLinks && featureIndex === 0) ||
          (isDataDashboard && featureIndex === 0) ||
          (isDataExplorer && featureIndex === 0) ||
          (isAnalysis && featureIndex === 0) ||
          (isExport && featureIndex === 0)
        ) {
          scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        const target = scrollContainer.querySelector<HTMLElement>(`#${targetId}`);
        if (!target) return;
        const containerRect = scrollContainer.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const nextTop = scrollContainer.scrollTop + targetRect.top - containerRect.top - 28;
        scrollContainer.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
      });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [
    workspace,
    config,
    currentIndex,
    dashboardFeatureIndex,
    studiesFeatureIndex,
    studyBuilderFeatureIndex,
    questionnaireFeatureIndex,
    cognitiveFeatureIndex,
    thesisFeatureIndex,
    ambulatoryFeatureIndex,
    participantsFeatureIndex,
    participantLinksFeatureIndex,
    dataDashboardFeatureIndex,
    dataExplorerFeatureIndex,
    analysisFeatureIndex,
    exportFeatureIndex,
    focusOpen,
  ]);

  async function savePosition(index: number) {
    if (!workspace || !config || saving) return;

    setSaving(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace(`/signin?workspace=${workspace}`);
      return;
    }

    const { error: saveError } = await supabase
      .from("workspace_onboarding")
      .upsert(
        {
          user_id: user.id,
          workspace,
          current_step: index + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,workspace" }
      );

    if (saveError) {
      console.error("Could not save tour position:", saveError);
      setError("Your position could not be saved.");
      setSaving(false);
      return;
    }

    setCurrentIndex(index);
    setSaving(false);
  }

  function navigateBySlideId(slideId: string) {
    if (!config) return;
    const index = config.slides.findIndex((slide) => slide.id === slideId);
    if (slideId === "dashboard") setDashboardFeatureIndex(0);
    if (slideId === "studies") setStudiesFeatureIndex(0);
    if (slideId === "study-builder") setStudyBuilderFeatureIndex(0);
    if (slideId === "questionnaires") setQuestionnaireFeatureIndex(0);
    if (slideId === "cognitive-lab") setCognitiveFeatureIndex(0);
    if (slideId === "thesis-builder") setThesisFeatureIndex(0);
    if (slideId === "ambulatory") setAmbulatoryFeatureIndex(0);
    if (slideId === "participants") setParticipantsFeatureIndex(0);
    if (slideId === "participant-links") setParticipantLinksFeatureIndex(0);
    if (slideId === "data-dashboard") setDataDashboardFeatureIndex(0);
    if (slideId === "data-explorer") setDataExplorerFeatureIndex(0);
    if (slideId === "analysis-lab") setAnalysisFeatureIndex(0);
    if (slideId === "export") setExportFeatureIndex(0);
    if (index >= 0 && index !== currentIndex) void savePosition(index);
  }

  function handleGuideBack() {
    const active = config?.slides[currentIndex];

    if (workspace === "researcher" && active?.id === "dashboard" && dashboardFeatureIndex > 0) {
      setDashboardFeatureIndex((value) => Math.max(0, value - 1));
      return;
    }

    if (workspace === "researcher" && active?.id === "studies" && studiesFeatureIndex > 0) {
      setStudiesFeatureIndex((value) => Math.max(0, value - 1));
      return;
    }

    if (workspace === "researcher" && active?.id === "study-builder" && studyBuilderFeatureIndex > 0) {
      setStudyBuilderFeatureIndex((value) => Math.max(0, value - 1));
      return;
    }

    if (workspace === "researcher" && active?.id === "questionnaires" && questionnaireFeatureIndex > 0) {
      setQuestionnaireFeatureIndex((value) => Math.max(0, value - 1));
      return;
    }

    if (workspace === "researcher" && active?.id === "cognitive-lab" && cognitiveFeatureIndex > 0) {
      setCognitiveFeatureIndex((value) => Math.max(0, value - 1));
      return;
    }

    if (workspace === "researcher" && active?.id === "thesis-builder" && thesisFeatureIndex > 0) {
      setThesisFeatureIndex((value) => Math.max(0, value - 1));
      return;
    }

    if (workspace === "researcher" && active?.id === "ambulatory" && ambulatoryFeatureIndex > 0) {
      setAmbulatoryFeatureIndex((value) => Math.max(0, value - 1));
      return;
    }

    if (workspace === "researcher" && active?.id === "participants" && participantsFeatureIndex > 0) { setParticipantsFeatureIndex((value) => Math.max(0, value - 1)); return; }
    if (workspace === "researcher" && active?.id === "participant-links" && participantLinksFeatureIndex > 0) { setParticipantLinksFeatureIndex((value) => Math.max(0, value - 1)); return; }
    if (workspace === "researcher" && active?.id === "data-dashboard" && dataDashboardFeatureIndex > 0) { setDataDashboardFeatureIndex((value) => Math.max(0, value - 1)); return; }
    if (workspace === "researcher" && active?.id === "data-explorer" && dataExplorerFeatureIndex > 0) { setDataExplorerFeatureIndex((value) => Math.max(0, value - 1)); return; }

    if (workspace === "researcher" && active?.id === "analysis-lab" && analysisFeatureIndex > 0) {
      setAnalysisFeatureIndex((value) => Math.max(0, value - 1));
      return;
    }

    if (workspace === "researcher" && active?.id === "export" && exportFeatureIndex > 0) { setExportFeatureIndex((value) => Math.max(0, value - 1)); return; }

    if (currentIndex > 0) {
      const previousSlide = config?.slides[currentIndex - 1];
      if (workspace === "researcher" && previousSlide?.id === "dashboard") {
        setDashboardFeatureIndex(dashboardTourSteps.length - 1);
      }
      if (workspace === "researcher" && previousSlide?.id === "studies") {
        setStudiesFeatureIndex(studiesTourSteps.length - 1);
      }
      if (workspace === "researcher" && previousSlide?.id === "study-builder") {
        setStudyBuilderFeatureIndex(studyBuilderTourSteps.length - 1);
      }
      if (workspace === "researcher" && previousSlide?.id === "questionnaires") {
        setQuestionnaireFeatureIndex(questionnaireTourSteps.length - 1);
      }
      if (workspace === "researcher" && previousSlide?.id === "cognitive-lab") {
        setCognitiveFeatureIndex(cognitiveTourSteps.length - 1);
      }
      if (workspace === "researcher" && previousSlide?.id === "thesis-builder") {
        setThesisFeatureIndex(thesisTourSteps.length - 1);
      }
      if (workspace === "researcher" && previousSlide?.id === "ambulatory") {
        setAmbulatoryFeatureIndex(ambulatoryTourSteps.length - 1);
      }
      if (workspace === "researcher" && previousSlide?.id === "participants") setParticipantsFeatureIndex(participantsTourSteps.length - 1);
      if (workspace === "researcher" && previousSlide?.id === "participant-links") setParticipantLinksFeatureIndex(participantLinksTourSteps.length - 1);
      if (workspace === "researcher" && previousSlide?.id === "data-dashboard") setDataDashboardFeatureIndex(dataDashboardTourSteps.length - 1);
      if (workspace === "researcher" && previousSlide?.id === "data-explorer") setDataExplorerFeatureIndex(dataExplorerTourSteps.length - 1);
      if (workspace === "researcher" && previousSlide?.id === "analysis-lab") {
        setAnalysisFeatureIndex(analysisTourSteps.length - 1);
      }
      if (workspace === "researcher" && previousSlide?.id === "export") setExportFeatureIndex(exportTourSteps.length - 1);
      void savePosition(currentIndex - 1);
    }
  }

  function handleGuideNext() {
    const active = config?.slides[currentIndex];

    if (
      workspace === "researcher" &&
      active?.id === "dashboard" &&
      dashboardFeatureIndex < dashboardTourSteps.length - 1
    ) {
      setDashboardFeatureIndex((value) =>
        Math.min(dashboardTourSteps.length - 1, value + 1)
      );
      return;
    }

    if (
      workspace === "researcher" &&
      active?.id === "studies" &&
      studiesFeatureIndex < studiesTourSteps.length - 1
    ) {
      setStudiesFeatureIndex((value) =>
        Math.min(studiesTourSteps.length - 1, value + 1)
      );
      return;
    }

    if (
      workspace === "researcher" &&
      active?.id === "study-builder" &&
      studyBuilderFeatureIndex < studyBuilderTourSteps.length - 1
    ) {
      setStudyBuilderFeatureIndex((value) =>
        Math.min(studyBuilderTourSteps.length - 1, value + 1)
      );
      return;
    }

    if (
      workspace === "researcher" &&
      active?.id === "questionnaires" &&
      questionnaireFeatureIndex < questionnaireTourSteps.length - 1
    ) {
      setQuestionnaireFeatureIndex((value) =>
        Math.min(questionnaireTourSteps.length - 1, value + 1)
      );
      return;
    }

    if (
      workspace === "researcher" &&
      active?.id === "cognitive-lab" &&
      cognitiveFeatureIndex < cognitiveTourSteps.length - 1
    ) {
      setCognitiveFeatureIndex((value) =>
        Math.min(cognitiveTourSteps.length - 1, value + 1)
      );
      return;
    }

    if (
      workspace === "researcher" &&
      active?.id === "thesis-builder" &&
      thesisFeatureIndex < thesisTourSteps.length - 1
    ) {
      setThesisFeatureIndex((value) =>
        Math.min(thesisTourSteps.length - 1, value + 1)
      );
      return;
    }

    if (
      workspace === "researcher" &&
      active?.id === "ambulatory" &&
      ambulatoryFeatureIndex < ambulatoryTourSteps.length - 1
    ) {
      setAmbulatoryFeatureIndex((value) =>
        Math.min(ambulatoryTourSteps.length - 1, value + 1)
      );
      return;
    }

    if (workspace === "researcher" && active?.id === "participants" && participantsFeatureIndex < participantsTourSteps.length - 1) { setParticipantsFeatureIndex((value) => Math.min(participantsTourSteps.length - 1, value + 1)); return; }
    if (workspace === "researcher" && active?.id === "participant-links" && participantLinksFeatureIndex < participantLinksTourSteps.length - 1) { setParticipantLinksFeatureIndex((value) => Math.min(participantLinksTourSteps.length - 1, value + 1)); return; }
    if (workspace === "researcher" && active?.id === "data-dashboard" && dataDashboardFeatureIndex < dataDashboardTourSteps.length - 1) { setDataDashboardFeatureIndex((value) => Math.min(dataDashboardTourSteps.length - 1, value + 1)); return; }
    if (workspace === "researcher" && active?.id === "data-explorer" && dataExplorerFeatureIndex < dataExplorerTourSteps.length - 1) { setDataExplorerFeatureIndex((value) => Math.min(dataExplorerTourSteps.length - 1, value + 1)); return; }

    if (
      workspace === "researcher" &&
      active?.id === "analysis-lab" &&
      analysisFeatureIndex < analysisTourSteps.length - 1
    ) {
      setAnalysisFeatureIndex((value) =>
        Math.min(analysisTourSteps.length - 1, value + 1)
      );
      return;
    }

    if (workspace === "researcher" && active?.id === "export" && exportFeatureIndex < exportTourSteps.length - 1) { setExportFeatureIndex((value) => Math.min(exportTourSteps.length - 1, value + 1)); return; }

    if (config && currentIndex < config.slides.length - 1) {
      void savePosition(currentIndex + 1);
    }
  }

  async function completeTour() {
    if (!workspace || !config || saving) return;

    setSaving(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace(`/signin?workspace=${workspace}`);
      return;
    }

    const now = new Date().toISOString();
    const { error: saveError } = await supabase
      .from("workspace_onboarding")
      .upsert(
        {
          user_id: user.id,
          workspace,
          current_step: config.slides.length,
          completed_at: now,
          updated_at: now,
        },
        { onConflict: "user_id,workspace" }
      );

    if (saveError) {
      console.error("Could not complete tour:", saveError);
      setError("The tour could not be completed.");
      setSaving(false);
      return;
    }

    router.replace(config.destination);
    router.refresh();
  }

  if (!workspace || !config || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f8]">
        <PsyLatticeLogo />
      </main>
    );
  }

  const slide = config.slides[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === config.slides.length - 1;
  const progress = ((currentIndex + 1) / config.slides.length) * 100;
  const featureDetails = workspace === "researcher" ? researchTourDetails[slide.id] : undefined;
  const dashboardGuideStep = workspace === "researcher" && slide.id === "dashboard"
    ? dashboardTourSteps[dashboardFeatureIndex]
    : null;
  const studiesGuideStep = workspace === "researcher" && slide.id === "studies"
    ? studiesTourSteps[studiesFeatureIndex]
    : null;
  const studyBuilderGuideStep = workspace === "researcher" && slide.id === "study-builder"
    ? studyBuilderTourSteps[studyBuilderFeatureIndex]
    : null;
  const questionnaireGuideStep = workspace === "researcher" && slide.id === "questionnaires"
    ? questionnaireTourSteps[questionnaireFeatureIndex]
    : null;
  const cognitiveGuideStep = workspace === "researcher" && slide.id === "cognitive-lab"
    ? cognitiveTourSteps[cognitiveFeatureIndex]
    : null;
  const thesisGuideStep = workspace === "researcher" && slide.id === "thesis-builder"
    ? thesisTourSteps[thesisFeatureIndex]
    : null;
  const ambulatoryGuideStep = workspace === "researcher" && slide.id === "ambulatory"
    ? ambulatoryTourSteps[ambulatoryFeatureIndex]
    : null;
  const participantsGuideStep = workspace === "researcher" && slide.id === "participants" ? participantsTourSteps[participantsFeatureIndex] : null;
  const participantLinksGuideStep = workspace === "researcher" && slide.id === "participant-links" ? participantLinksTourSteps[participantLinksFeatureIndex] : null;
  const dataDashboardGuideStep = workspace === "researcher" && slide.id === "data-dashboard" ? dataDashboardTourSteps[dataDashboardFeatureIndex] : null;
  const dataExplorerGuideStep = workspace === "researcher" && slide.id === "data-explorer" ? dataExplorerTourSteps[dataExplorerFeatureIndex] : null;
  const analysisGuideStep = workspace === "researcher" && slide.id === "analysis-lab"
    ? analysisTourSteps[analysisFeatureIndex]
    : null;
  const exportGuideStep = workspace === "researcher" && slide.id === "export" ? exportTourSteps[exportFeatureIndex] : null;
  const internalGuideStep = dashboardGuideStep ?? studiesGuideStep ?? studyBuilderGuideStep ?? questionnaireGuideStep ?? cognitiveGuideStep ?? thesisGuideStep ?? ambulatoryGuideStep ?? participantsGuideStep ?? participantLinksGuideStep ?? dataDashboardGuideStep ?? dataExplorerGuideStep ?? analysisGuideStep ?? exportGuideStep;
  const guideEyebrow = internalGuideStep?.eyebrow ?? slide.eyebrow;
  const guideTakeaway = dashboardGuideStep
    ? `Dashboard feature ${dashboardFeatureIndex + 1} of ${dashboardTourSteps.length}`
    : studiesGuideStep
      ? `Studies feature ${studiesFeatureIndex + 1} of ${studiesTourSteps.length}`
      : studyBuilderGuideStep
        ? `Study Builder step ${studyBuilderFeatureIndex + 1} of ${studyBuilderTourSteps.length}`
        : questionnaireGuideStep
          ? `Questionnaire Library feature ${questionnaireFeatureIndex + 1} of ${questionnaireTourSteps.length}`
          : cognitiveGuideStep
            ? `Cognitive Lab feature ${cognitiveFeatureIndex + 1} of ${cognitiveTourSteps.length}`
            : thesisGuideStep
              ? `Thesis Builder feature ${thesisFeatureIndex + 1} of ${thesisTourSteps.length}`
              : ambulatoryGuideStep
                ? `Ambulatory Assessment feature ${ambulatoryFeatureIndex + 1} of ${ambulatoryTourSteps.length}`
                : participantsGuideStep
                  ? `Participants feature ${participantsFeatureIndex + 1} of ${participantsTourSteps.length}`
                  : participantLinksGuideStep
                    ? `Participant Links feature ${participantLinksFeatureIndex + 1} of ${participantLinksTourSteps.length}`
                    : dataDashboardGuideStep
                      ? `Data Dashboard feature ${dataDashboardFeatureIndex + 1} of ${dataDashboardTourSteps.length}`
                      : dataExplorerGuideStep
                        ? `Data Explorer feature ${dataExplorerFeatureIndex + 1} of ${dataExplorerTourSteps.length}`
                        : analysisGuideStep
                          ? `Analysis Lab feature ${analysisFeatureIndex + 1} of ${analysisTourSteps.length}`
                          : exportGuideStep
                            ? `Export Data feature ${exportFeatureIndex + 1} of ${exportTourSteps.length}`
                            : featureDetails?.takeaway ?? slide.note;
  const guideIsFirst =
    isFirst &&
    (!dashboardGuideStep || dashboardFeatureIndex === 0) &&
    (!studiesGuideStep || studiesFeatureIndex === 0) &&
    (!studyBuilderGuideStep || studyBuilderFeatureIndex === 0) &&
    (!questionnaireGuideStep || questionnaireFeatureIndex === 0) &&
    (!cognitiveGuideStep || cognitiveFeatureIndex === 0) &&
    (!thesisGuideStep || thesisFeatureIndex === 0) &&
    (!ambulatoryGuideStep || ambulatoryFeatureIndex === 0) &&
    (!participantsGuideStep || participantsFeatureIndex === 0) &&
    (!participantLinksGuideStep || participantLinksFeatureIndex === 0) &&
    (!dataDashboardGuideStep || dataDashboardFeatureIndex === 0) &&
    (!dataExplorerGuideStep || dataExplorerFeatureIndex === 0) &&
    (!analysisGuideStep || analysisFeatureIndex === 0) &&
    (!exportGuideStep || exportFeatureIndex === 0);

  const nextButtonLabel =
    dashboardGuideStep && dashboardFeatureIndex < dashboardTourSteps.length - 1
      ? "Next feature →"
      : studiesGuideStep && studiesFeatureIndex < studiesTourSteps.length - 1
        ? "Next feature →"
        : studyBuilderGuideStep && studyBuilderFeatureIndex < studyBuilderTourSteps.length - 1
          ? "Next feature →"
          : questionnaireGuideStep && questionnaireFeatureIndex < questionnaireTourSteps.length - 1
            ? "Next feature →"
            : cognitiveGuideStep && cognitiveFeatureIndex < cognitiveTourSteps.length - 1
              ? "Next feature →"
              : thesisGuideStep && thesisFeatureIndex < thesisTourSteps.length - 1
                ? "Next feature →"
                : ambulatoryGuideStep && ambulatoryFeatureIndex < ambulatoryTourSteps.length - 1
                  ? "Next feature →"
                  : participantsGuideStep && participantsFeatureIndex < participantsTourSteps.length - 1
                    ? "Next feature →"
                    : participantLinksGuideStep && participantLinksFeatureIndex < participantLinksTourSteps.length - 1
                      ? "Next feature →"
                      : dataDashboardGuideStep && dataDashboardFeatureIndex < dataDashboardTourSteps.length - 1
                        ? "Next feature →"
                        : dataExplorerGuideStep && dataExplorerFeatureIndex < dataExplorerTourSteps.length - 1
                          ? "Next feature →"
                          : analysisGuideStep && analysisFeatureIndex < analysisTourSteps.length - 1
                            ? "Next feature →"
                            : exportGuideStep && exportFeatureIndex < exportTourSteps.length - 1
                              ? "Next feature →"
          : isLast
          ? `Finish tour →`
          : "Next environment →";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.13),_transparent_30%),linear-gradient(135deg,#e8f2f4_0%,#f7fafb_48%,#eaf1f3_100%)] text-slate-950">
      <style>{`
        @keyframes psylatticeTourIn {
          from { opacity: 0; transform: translateY(8px) scale(.997); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes psylatticeCardIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes psylatticeGuidePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,.18); }
          50% { box-shadow: 0 0 0 9px rgba(34,211,238,0); }
        }
        .psylattice-tour-in { animation: psylatticeTourIn 240ms ease-out both; }
        .psylattice-card-in { animation: psylatticeCardIn 280ms 50ms ease-out both; }
        .psylattice-guide-pulse { animation: psylatticeGuidePulse 2.4s ease-in-out infinite; }
      `}</style>

      {/* Distinct onboarding atmosphere — deliberately different from the real product shell. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-120px] top-[28%] h-96 w-96 rounded-full bg-sky-300/15 blur-3xl" />
        <div className="absolute bottom-[-180px] left-[30%] h-[420px] w-[420px] rounded-full bg-teal-200/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(8,145,178,.22) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      {/* ONBOARDING CONTROL BAR — intentionally unlike the normal PsyLattice navbar. */}
      <header className="sticky top-0 z-50 border-b border-cyan-400/20 bg-[#172737]/95 text-white shadow-[0_12px_34px_rgba(23,39,55,.18)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-[1560px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden rounded-2xl bg-white px-3 py-2 shadow-lg sm:block">
              <PsyLatticeLogo />
            </div>

            <div className="flex min-w-0 items-center gap-3">
              <span className="psylattice-guide-pulse flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/10 text-cyan-200">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                    PsyLattice product tour
                  </span>
                  <span className="hidden text-[11px] font-medium text-slate-400 md:inline">
                    Guided researcher onboarding
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
                  {config.label} · {slide.title}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden min-w-[210px] lg:block">
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold">
                <span className="text-slate-300">Onboarding progress</span>
                <span className="text-cyan-200">{currentIndex + 1} of {config.slides.length}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-[width] duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {!replay && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void completeTour()}
                className="rounded-full border border-white/20 bg-white/[0.045] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/35 hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                Skip tour
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push("/workspace")}
              className="rounded-full border border-cyan-200/35 bg-cyan-200/10 px-3.5 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-200/15"
            >
              Exit tour
            </button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1560px] px-3 pb-7 pt-5 sm:px-6 lg:px-9 lg:pt-7">
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span className="mt-1 h-4 w-0.5 rounded-full bg-rose-400" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div
          key={slide.id}
          className="psylattice-tour-in relative rounded-[34px] border-2 border-cyan-300/70 bg-white/55 p-[7px] shadow-[0_4px_12px_rgba(15,23,42,0.06),0_26px_70px_rgba(8,145,178,0.16),0_0_0_5px_rgba(255,255,255,.72)] backdrop-blur-sm"
        >
          {/* Product-tour rail lives outside the replica so it never covers PsyLattice UI. */}
          <div className="pointer-events-none absolute -left-[26px] top-[132px] z-30 hidden xl:flex">
            <div className="relative flex h-[188px] w-[34px] items-center justify-center rounded-full border border-cyan-300/35 bg-[#1b3042] shadow-[0_12px_30px_rgba(23,39,55,0.16),0_0_0_4px_rgba(255,255,255,.74)]">
              <span
                className="whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.20em] text-cyan-200"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Product onboarding
              </span>
              <span className="absolute -right-[9px] top-1/2 h-px w-[9px] -translate-y-1/2 bg-cyan-300/55" />
            </div>
          </div>

          <div className="overflow-hidden rounded-[29px] border border-slate-200/90 bg-white shadow-[0_3px_8px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.10)]">
            {/* Dedicated tour strip: visually separates onboarding from the product replica without overlapping it. */}
            <div className="flex h-9 items-center justify-between border-b border-cyan-300/20 bg-[#20394b] px-4 text-white sm:px-5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                  <Sparkles className="h-2.5 w-2.5" />
                </span>
                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-200">
                  Onboarding preview
                </span>
                <span className="hidden text-[8px] font-medium text-slate-400 md:inline">
                  {slide.title}
                </span>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[8px] font-semibold text-slate-300">
                Step {currentIndex + 1} of {config.slides.length}
              </span>
            </div>

            {/* Browser-like preview chrome. */}
            <div className="flex items-center justify-between border-b border-slate-200/90 bg-[#f9fbfc] px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full border border-cyan-300 bg-cyan-300" />
                </div>
                <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-slate-300/80 bg-white/90 px-4 py-1.5 text-[10px] font-medium text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:flex sm:w-[360px]">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span className="truncate">psylattice.com</span>
                  <span className="ml-auto rounded-full bg-cyan-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-cyan-700">
                    Demo
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden text-[10px] font-medium text-slate-400 md:inline">
                  Feature walkthrough
                </span>
                <button
                  type="button"
                  onClick={() => setFocusOpen(true)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-cyan-200 hover:text-slate-900"
                >
                  Expand preview
                </button>
              </div>
            </div>

            <div className="relative h-[clamp(545px,67dvh,760px)] overflow-hidden bg-[#eef5f6] p-3 sm:p-4">
              <MockWorkspace
                workspace={workspace}
                config={config}
                activeSlideId={slide.id}
                dashboardStep={dashboardFeatureIndex}
                studiesStep={studiesFeatureIndex}
                studyBuilderStep={studyBuilderFeatureIndex}
                questionnaireStep={questionnaireFeatureIndex}
                cognitiveStep={cognitiveFeatureIndex}
                thesisStep={thesisFeatureIndex}
                ambulatoryStep={ambulatoryFeatureIndex}
                participantsStep={participantsFeatureIndex}
                participantLinksStep={participantLinksFeatureIndex}
                dataDashboardStep={dataDashboardFeatureIndex}
                dataExplorerStep={dataExplorerFeatureIndex}
                analysisStep={analysisFeatureIndex}
                exportStep={exportFeatureIndex}
                onNavigate={navigateBySlideId}
              />

            </div>
          </div>
        </div>

        {/* Persistent tour navigation. Internal feature steps happen before the journey advances. */}
        <div className="mt-5 flex flex-col items-center gap-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Your onboarding journey
          </p>

          <div className="flex w-full max-w-[980px] items-center justify-center gap-3">
            <button
              type="button"
              disabled={saving || guideIsFirst}
              onClick={handleGuideBack}
              className="shrink-0 rounded-full border border-slate-300 bg-white/90 px-4 py-2.5 text-[10px] font-bold text-slate-600 shadow-[0_6px_18px_rgba(15,23,42,.07)] backdrop-blur transition hover:-translate-y-px hover:border-cyan-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Previous
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-white/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl">
              {config.slides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  title={item.title}
                  disabled={saving}
                  onClick={() => {
                    if (item.id === "dashboard") setDashboardFeatureIndex(0);
                    if (item.id === "studies") setStudiesFeatureIndex(0);
                    if (item.id === "study-builder") setStudyBuilderFeatureIndex(0);
                    if (item.id === "questionnaires") setQuestionnaireFeatureIndex(0);
                    if (item.id === "cognitive-lab") setCognitiveFeatureIndex(0);
                    if (item.id === "thesis-builder") setThesisFeatureIndex(0);
                    if (item.id === "ambulatory") setAmbulatoryFeatureIndex(0);
                    if (item.id === "participants") setParticipantsFeatureIndex(0);
                    if (item.id === "participant-links") setParticipantLinksFeatureIndex(0);
                    if (item.id === "data-dashboard") setDataDashboardFeatureIndex(0);
                    if (item.id === "data-explorer") setDataExplorerFeatureIndex(0);
                    if (item.id === "analysis-lab") setAnalysisFeatureIndex(0);
                    if (item.id === "export") setExportFeatureIndex(0);
                    void savePosition(index);
                  }}
                  className={`group flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-all ${
                    index === currentIndex
                      ? "bg-[#17384d] text-white shadow-md"
                      : index < currentIndex
                        ? "bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                        : "text-slate-400 hover:bg-white hover:text-slate-700"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                      index === currentIndex
                        ? "bg-cyan-300 text-slate-950"
                        : index < currentIndex
                          ? "bg-cyan-100 text-cyan-800"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={`hidden whitespace-nowrap text-[10px] font-semibold ${index === currentIndex ? "sm:inline" : "xl:group-hover:inline"}`}>
                    {item.title}
                  </span>
                </button>
              ))}
            </div>

            {isLast ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void completeTour()}
                className="shrink-0 rounded-full bg-[#17384d] px-4 py-2.5 text-[10px] font-bold text-white shadow-[0_8px_18px_rgba(23,56,77,.14)] transition hover:-translate-y-px hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Opening..." : "Finish tour →"}
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleGuideNext}
                className="shrink-0 rounded-full bg-[#17384d] px-4 py-2.5 text-[10px] font-bold text-white shadow-[0_8px_18px_rgba(23,56,77,.14)] transition hover:-translate-y-px hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : nextButtonLabel}
              </button>
            )}
          </div>

          {internalGuideStep && (
            <p className="text-[9px] font-semibold text-cyan-800">
              {guideEyebrow} · {guideTakeaway}
            </p>
          )}
        </div>
      </section>

      {focusOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#172737]/72 p-3 backdrop-blur-md sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setFocusOpen(false)}
        >
          <div
            className="flex h-[94dvh] w-full max-w-[1740px] flex-col overflow-hidden rounded-[30px] border border-cyan-300/30 bg-white shadow-[0_30px_100px_rgba(0,0,0,.38)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#1b3042] px-4 py-3 text-white sm:px-5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200">
                    Product tour focus
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{slide.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-medium text-slate-300 md:inline">
                  Guided feature preview
                </span>
                <button
                  type="button"
                  onClick={() => setFocusOpen(false)}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                >
                  Close ✕
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 bg-[#eef5f6] p-4 sm:p-6">
              <MockWorkspace
                workspace={workspace}
                config={config}
                activeSlideId={slide.id}
                dashboardStep={dashboardFeatureIndex}
                studiesStep={studiesFeatureIndex}
                studyBuilderStep={studyBuilderFeatureIndex}
                questionnaireStep={questionnaireFeatureIndex}
                cognitiveStep={cognitiveFeatureIndex}
                thesisStep={thesisFeatureIndex}
                ambulatoryStep={ambulatoryFeatureIndex}
                participantsStep={participantsFeatureIndex}
                participantLinksStep={participantLinksFeatureIndex}
                dataDashboardStep={dataDashboardFeatureIndex}
                dataExplorerStep={dataExplorerFeatureIndex}
                analysisStep={analysisFeatureIndex}
                exportStep={exportFeatureIndex}
                onNavigate={(slideId) => {
                  navigateBySlideId(slideId);
                  setFocusOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f6f8f8]">
          <PsyLatticeLogo />
        </main>
      }
    >
      <WorkspaceTour />
    </Suspense>
  );
}
