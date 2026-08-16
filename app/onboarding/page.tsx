"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import { createClient } from "@/lib/supabase/client";

type Workspace =
  | "self"
  | "researcher"
  | "clinician";

type TourSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  details?: string[];
  note?: string;
  imagePath: string;

  callouts?: Array<{
    number: number;
    title: string;
    description: string;
  }>;
};

type TourConfig = {
  workspace: Workspace;
  label: string;
  shortLabel: string;
  destination: string;
  slides: TourSlide[];
};

const tourConfigs: Record<
  Workspace,
  TourConfig
> = {
  self: {
    workspace: "self",
    label: "PsyLattice Self",
    shortLabel: "Self",
    destination: "/self",

    slides: [
      {
        id: "dashboard",
        eyebrow: "Your personal overview",
        title: "Dashboard",
        description:
          "The Dashboard is the starting point of your Self workspace. It brings together your current clinician connection, today's monitoring activity, recent assessments and the information that is most relevant to you right now.",
        details: [
          "See whether you are currently connected to a clinician and open appointments, messages or sharing controls directly from the connection card.",
          "See today's monitoring schedule, completed check-ins and any activities still waiting for you.",
          "Review recent assessment activity and follow the parts of PsyLattice you are currently using without moving between several different screens.",
          "Use the Dashboard as a quick overview rather than a replacement for the more detailed Assessment, Monitoring and Progress areas.",
        ],
        note:
          "Your Dashboard belongs to your Self workspace. Connecting with a clinician does not automatically give them access to everything shown here.",
        imagePath:
          "/onboarding/self/dashboard.png",
      },

      {
        id: "ai",
        eyebrow: "Explore and reflect",
        title: "AI Guide",
        description:
          "The AI Guide gives you a private place to explore psychological topics, describe what you have been noticing and think about which PsyLattice tools may be useful next.",
        details: [
          "Ask questions about psychological concepts in everyday language.",
          "Describe experiences or patterns you have noticed and explore possible areas for structured self-assessment.",
          "Use the conversation to navigate PsyLattice without having to know which questionnaire or feature you need beforehand.",
          "Treat AI guidance as supportive information rather than clinical diagnosis or treatment advice.",
        ],
        note:
          "Luna conversations remain private and are not included in clinician-sharing permissions.",
        imagePath:
          "/onboarding/self/ai-guide.png",
      },

      {
        id: "assessments",
        eyebrow: "Structured measurement",
        title: "Self-Assessments",
        description:
          "Self-Assessments let you complete structured psychological measures and keep your results organised over time instead of treating every questionnaire as an isolated score.",
        details: [
          "Browse available assessments and open measures that are relevant to what you want to explore.",
          "Complete questionnaires directly inside PsyLattice and keep previous results linked to your account.",
          "Return to earlier assessments so you can compare results across different points in time.",
          "Use assessment results together with monitoring and progress information for a broader picture of change.",
        ],
        note:
          "Questionnaire results are intended for structured reflection and do not constitute a diagnosis on their own.",
        imagePath:
          "/onboarding/self/assessments.png",
      },

      {
        id: "monitoring",
        eyebrow: "Real-world observation",
        title: "Daily Monitoring",
        description:
          "Daily Monitoring helps you capture what is happening between individual assessment sessions. Short repeated check-ins can reveal patterns that a single questionnaire may miss.",
        details: [
          "Complete scheduled check-ins during the day when a monitoring plan is active.",
          "Use repeated responses to observe changes across different times, situations and routines.",
          "See which check-ins are complete, what remains today and how your monitoring plan is progressing.",
          "Monitoring can be used independently or alongside work you are doing with a connected clinician.",
        ],
        imagePath:
          "/onboarding/self/monitoring.png",
      },

      {
        id: "regulation",
        eyebrow: "Turn insight into action",
        title: "Self-Regulation",
        description:
          "Self-Regulation is where reflection becomes something practical. You can organise small activities or routines and follow whether they are actually happening over time.",
        details: [
          "Create simple regulation activities that are realistic enough to repeat in everyday life.",
          "Track completion rather than relying on memory alone.",
          "Review which routines are becoming consistent and which may need to be adjusted.",
          "Use regulation tools alongside your assessment and monitoring information without turning them into diagnostic recommendations.",
        ],
        imagePath:
          "/onboarding/self/self-regulation.png",
      },

      {
        id: "progress",
        eyebrow: "Longitudinal understanding",
        title: "Progress",
        description:
          "Progress brings information together across time so you can look beyond a single result. It is designed to help you understand direction, consistency and change.",
        details: [
          "Review how your information has changed across repeated assessments or monitoring periods.",
          "Look for broader trends rather than over-interpreting one unusually good or difficult day.",
          "Use the longitudinal view to prepare for reflection or discussion with a clinician.",
          "Progress becomes more useful as more structured information is collected over time.",
        ],
        imagePath:
          "/onboarding/self/progress.png",
      },

      {
        id: "wearables",
        eyebrow: "Optional additional context",
        title: "Wearables",
        description:
          "Wearables can add behavioural or physiological context to your psychological information when supported integrations are available.",
        details: [
          "Bring selected wearable information into the same workspace as assessments and monitoring.",
          "Use measures such as sleep or activity as contextual information rather than psychological conclusions.",
          "Compare wearable context with your own self-reported experiences across time.",
          "Keep wearable sharing separate from other clinician-sharing permissions.",
        ],
        note:
          "Wearable information is optional, and sharing it with a clinician remains a separate permission that you control.",
        imagePath:
          "/onboarding/self/wearables.png",
      },

      {
        id: "appointments",
        eyebrow: "Connected care",
        title: "Appointments",
        description:
          "Appointments gives you a clear client-side view of your schedule with your current clinician and provides a structured way to request new appointment times.",
        details: [
          "See upcoming appointments that your clinician has made visible to you.",
          "Review the date, time, format and relevant appointment information in one place.",
          "Send an appointment request instead of relying on disconnected scheduling messages.",
          "Follow the status of requests as your clinician accepts, adjusts or declines them.",
        ],
        imagePath:
          "/onboarding/self/appointments.png",
      },

      {
        id: "messages",
        eyebrow: "Private communication",
        title: "Messages",
        description:
          "Messages provides a dedicated communication thread between you and your current PsyLattice clinician, keeping ordinary clinical communication inside the same connected workspace.",
        details: [
          "Send and receive messages with your currently connected clinician.",
          "Keep appointment or follow-up communication separate from unrelated personal messaging apps.",
          "See message history within the active clinician-client relationship.",
          "If the clinician connection ends, messaging access through that connection ends as well.",
        ],
        note:
          "PsyLattice messaging is for ordinary non-emergency communication and should not be relied upon for urgent or emergency situations.",
        imagePath:
          "/onboarding/self/messages.png",
      },

      {
        id: "privacy",
        eyebrow: "You remain in control",
        title: "Privacy & Sharing",
        description:
          "Privacy & Sharing is where you decide what your connected clinician can access. PsyLattice treats different categories of your Self information separately rather than using one all-or-nothing permission.",
        details: [
          "Control assessment, monitoring, progress, wearable and self-regulation sharing separately.",
          "Change your permissions later if you decide you want to share more or less.",
          "See which clinician connection the permissions belong to.",
          "Disconnect your clinician when you want the active relationship and its sharing access to end.",
        ],
        note:
          "Your Luna AI conversation history is not part of clinician-sharing permissions.",
        imagePath:
          "/onboarding/self/privacy-sharing.png",
      },
    ],
  },

  researcher: {
    workspace: "researcher",
    label: "PsyLattice Research",
    shortLabel: "Research",
    destination: "/researcher",

    slides: [
      {
        id: "studies",
        eyebrow: "Research home",
        title: "Studies",
        description:
          "Studies is the central workspace for organising PsyLattice research projects. Each study can contain its own measures, participant flow, ambulatory protocols, follow-ups and exports.",
        details: [
          "Create and organise multiple research projects from the same researcher account.",
          "See the status of each study and move from preparation into live data collection when appropriate.",
          "Open a study to manage its design, participants and collected information.",
          "Keep study workflows separate while using the same PsyLattice Research account.",
        ],
        imagePath:
          "/onboarding/research/studies.png",
      },

      {
        id: "study-builder",
        eyebrow: "Design the participant journey",
        title: "Study Builder",
        description:
          "The Study Builder lets you assemble the structure that participants will experience, from study information and consent through questionnaires and other measurement components.",
        details: [
          "Organise the order of participant-facing study components.",
          "Add questionnaires and study-specific content to the study flow.",
          "Preview and test the participant experience before launch.",
          "Prepare the study without paying for participant data collection until you are ready to launch.",
        ],
        imagePath:
          "/onboarding/research/study-builder.png",
      },

      {
        id: "questionnaires",
        eyebrow: "Reusable measures",
        title: "Questionnaire Library",
        description:
          "The Questionnaire Library gives you a central place to organise measures that can later be used across different PsyLattice studies.",
        details: [
          "Browse and organise available questionnaire definitions.",
          "Reuse appropriate measures across several studies without rebuilding the surrounding study workflow.",
          "Keep questionnaire structure separate from individual participant responses.",
          "Combine questionnaire measures with custom questions when a study requires both.",
        ],
        note:
          "Researchers remain responsible for ensuring they are authorised to use questionnaire content, scoring and associated intellectual property.",
        imagePath:
          "/onboarding/research/questionnaires.png",
      },

      {
        id: "custom-questionnaires",
        eyebrow: "Study-specific measurement",
        title: "Custom Questionnaires",
        description:
          "Custom Questionnaires let you create your own study-specific items when an existing psychological measure does not cover what your project needs.",
        details: [
          "Create questions using supported response formats.",
          "Build research-specific measures without changing your reusable questionnaire library.",
          "Organise questions so exported data remains interpretable later.",
          "Use custom items alongside standardised measures within the same study.",
        ],
        imagePath:
          "/onboarding/research/custom-questionnaires.png",
      },

      {
        id: "ambulatory",
        eyebrow: "EMA / ESM",
        title: "Ambulatory Builder",
        description:
          "The Ambulatory Builder is designed for repeated real-world measurement. It lets you define what participants answer, when assessments become available and how later questions respond to earlier answers.",
        details: [
          "Create fixed-time, random, interval, event-contingent and participant-initiated schedules.",
          "Combine individual questions and questionnaires in repeated assessments.",
          "Use conditional logic so follow-up items only appear when relevant.",
          "Build protocols for longitudinal and ecological momentary assessment designs rather than relying only on one-off surveys.",
        ],
        imagePath:
          "/onboarding/research/ambulatory-builder.png",
      },

      {
        id: "participants",
        eyebrow: "Collect and follow",
        title: "Participants",
        description:
          "The Participants area helps you follow study participation without mixing research identities with the participant's personal PsyLattice Self activity.",
        details: [
          "Monitor which participants have entered the study and how far they have progressed.",
          "Work with pseudonymous study identifiers instead of treating the research workspace as a client record.",
          "Review completion information relevant to the study.",
          "Keep participant research data within the Research workflow.",
        ],
        imagePath:
          "/onboarding/research/participants.png",
      },

      {
        id: "followups",
        eyebrow: "Longitudinal research",
        title: "Follow-Ups",
        description:
          "Follow-Ups let you invite the same participant back for later waves while preserving the relationship between participant identity, study wave and collected data.",
        details: [
          "Create later follow-up waves for longitudinal designs.",
          "Invite participants back using secure follow-up links.",
          "Maintain the same participant identifier across repeated study waves.",
          "Keep wave information explicit so exported longitudinal datasets remain interpretable.",
        ],
        imagePath:
          "/onboarding/research/follow-ups.png",
      },

      {
        id: "data",
        eyebrow: "Monitor collection",
        title: "Research Data",
        description:
          "Research Data gives you a working view of what the study is collecting so you can monitor activity before preparing a final analysis dataset.",
        details: [
          "Review response and participation information while the study is running.",
          "Check whether expected study components are producing data.",
          "Follow completion patterns before export.",
          "Use this operational view separately from the final analysis-ready dataset.",
        ],
        imagePath:
          "/onboarding/research/data.png",
      },

      {
        id: "export",
        eyebrow: "Prepare for analysis",
        title: "Export",
        description:
          "Export converts PsyLattice study data into structured datasets designed for downstream analysis rather than forcing researchers to manually reconstruct participant, wave and item relationships.",
        details: [
          "Export XLSX datasets for further statistical or analytical work.",
          "Preserve participant and wave structure in longitudinal studies.",
          "Keep questionnaire and item-level naming organised.",
          "Use configurable export layouts when different downstream workflows require different table structures.",
        ],
        imagePath:
          "/onboarding/research/export.png",
      },
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
          "Clients is the starting point of the Clinical workspace. It shows the people currently connected to you through active PsyLattice clinician-client relationships.",
        details: [
          "Open a connected client and move into their professional workspace.",
          "See active clinical connections without turning the client's entire Self account into a clinician-owned record.",
          "Use each client connection as the boundary for assessments, monitoring, progress, appointments and messages.",
          "Client-controlled sharing permissions continue to determine which Self information is available to you.",
        ],
        note:
          "A clinician-client connection does not automatically expose every category of the client's Self information.",
        imagePath:
          "/onboarding/clinical/clients.png",
      },

      {
        id: "client-overview",
        eyebrow: "Connected client",
        title: "Client Overview",
        description:
          "The Client Overview brings together the professional workflow for one connected client, helping you move between assessment, monitoring, progress and care activities without losing context.",
        details: [
          "Keep the current client visible while moving through their clinical tools.",
          "Review the areas of information the client has authorised you to access.",
          "Move quickly into assessment, monitoring, appointments and other client-specific workflows.",
          "Maintain separation between client-authorised Self information and clinician-authored professional information.",
        ],
        imagePath:
          "/onboarding/clinical/client-overview.png",
      },

      {
        id: "assessments",
        eyebrow: "Structured measurement",
        title: "Assessments",
        description:
          "Assessments allows you to work with structured psychological measures inside the active clinician-client relationship.",
        details: [
          "Assign appropriate assessments to a connected client.",
          "Review assessment information that is available through the client's active permissions.",
          "Follow assessment history across time rather than relying on one isolated score.",
          "Use PsyLattice to organise measurement while keeping interpretation and diagnosis with the professional.",
        ],
        imagePath:
          "/onboarding/clinical/assessments.png",
      },

      {
        id: "monitoring",
        eyebrow: "Between-session observation",
        title: "Monitoring",
        description:
          "Monitoring supports repeated real-world measurement between appointments, giving the clinician a longitudinal view when the client has chosen to share that information.",
        details: [
          "Propose or organise monitoring protocols for a connected client.",
          "Review repeated self-report information across everyday situations.",
          "Use monitoring alongside assessments and clinical conversations rather than as an automated diagnostic system.",
          "Access depends on the active connection and the client's monitoring-sharing permission.",
        ],
        imagePath:
          "/onboarding/clinical/monitoring.png",
      },

      {
        id: "progress",
        eyebrow: "Longitudinal context",
        title: "Progress",
        description:
          "Progress helps organise authorised information across time, making it easier to see broader patterns instead of relying only on isolated appointments or individual questionnaire results.",
        details: [
          "Review longitudinal changes in available assessment and monitoring information.",
          "Use repeated information to support professional discussion and interpretation.",
          "Look at direction and pattern rather than treating each data point independently.",
          "Keep the professional interpretation separate from the raw measurement itself.",
        ],
        imagePath:
          "/onboarding/clinical/progress.png",
      },

      {
        id: "care-pathway",
        eyebrow: "Plan and review",
        title: "Care Pathway",
        description:
          "Care Pathway gives you a structured professional space for organising goals, actions and reviews across the course of work with a client.",
        details: [
          "Create goals and break them into practical actions.",
          "Review progress on goals without losing the history of earlier work.",
          "Reorder care elements as priorities change.",
          "Use the pathway alongside assessments and monitoring rather than replacing clinical judgement.",
        ],
        imagePath:
          "/onboarding/clinical/care-pathway.png",
      },

      {
        id: "notes",
        eyebrow: "Private professional workspace",
        title: "Professional Notes",
        description:
          "Professional Notes provides a clinician-authored area for organising private professional records separately from the client's own Self workspace.",
        details: [
          "Create and organise notes using folders.",
          "Keep professional documentation separate from client-controlled Self content.",
          "Use the editor for ongoing professional record keeping.",
          "Maintain clear separation between what the clinician writes and what the client chooses to share.",
        ],
        note:
          "Professional Notes are not part of the client's Self workspace and are treated as clinician-side professional information.",
        imagePath:
          "/onboarding/clinical/professional-notes.png",
      },

      {
        id: "appointments",
        eyebrow: "Clinical scheduling",
        title: "Appointments",
        description:
          "Appointments combines clinician scheduling with client requests, client-visible appointment details and private professional information.",
        details: [
          "Create and edit appointments for connected clients.",
          "Review appointment requests sent by clients and accept, adjust or decline them.",
          "Keep client-visible information separate from private clinician notes.",
          "Use calendar and agenda views to manage upcoming clinical activity.",
        ],
        imagePath:
          "/onboarding/clinical/appointments.png",
      },

      {
        id: "messages",
        eyebrow: "Secure communication",
        title: "Secure Messages",
        description:
          "Secure Messages provides a dedicated thread for ordinary communication between you and currently connected PsyLattice clients.",
        details: [
          "Message connected clients within the active clinician-client relationship.",
          "See unread activity and message status from the Clinical workspace.",
          "Keep routine clinical communication separate from unrelated messaging channels.",
          "Messaging access ends when the underlying clinician-client connection is no longer active.",
        ],
        note:
          "PsyLattice messaging is intended for non-emergency communication.",
        imagePath:
          "/onboarding/clinical/messages.png",
      },

      {
        id: "receptionist",
        eyebrow: "Optional administration",
        title: "Receptionist Access",
        description:
          "Receptionist Access lets you delegate appointment administration without handing over access to the rest of the Clinical workspace.",
        details: [
          "Create a dedicated appointment-management link for a receptionist.",
          "Allow appointment creation and management without exposing assessments, monitoring, progress, messages or professional notes.",
          "Pause or resume receptionist access when needed.",
          "Rotate or remove the link when administrative access should end.",
        ],
        note:
          "Receptionist access is intentionally limited to appointment administration.",
        imagePath:
          "/onboarding/clinical/receptionist.png",
      },
    ],
  },
};

function normaliseWorkspace(
  value: string | null
): Workspace | null {
  if (
    value === "self" ||
    value === "researcher" ||
    value === "clinician"
  ) {
    return value;
  }

  return null;
}

function WorkspaceTour() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const workspace = useMemo(
    () =>
      normaliseWorkspace(
        searchParams.get(
          "workspace"
        )
      ),
    [searchParams]
  );

  const replay =
    searchParams.get("replay") ===
    "1";

  const config =
    workspace
      ? tourConfigs[workspace]
      : null;

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [error, setError] =
    useState("");

  const [
    failedImages,
    setFailedImages,
  ] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    let cancelled = false;

    async function loadTour() {
      if (
        !workspace ||
        !config
      ) {
        router.replace(
          "/workspace"
        );

        return;
      }

      const supabase =
        createClient();

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (
        userError ||
        !user
      ) {
        router.replace(
          `/signin?workspace=${workspace}`
        );

        return;
      }

      const {
        data: onboarding,
        error:
          onboardingError,
      } = await supabase
        .from(
          "workspace_onboarding"
        )
        .select(
          "current_step, completed_at"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "workspace",
          workspace
        )
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (
        onboardingError
      ) {
        console.error(
          "Could not load workspace tour:",
          onboardingError
        );

        setError(
          "We could not restore your previous position."
        );
      }

      if (
        onboarding?.completed_at &&
        !replay
      ) {
        router.replace(
          config.destination
        );

        return;
      }

      if (
        !replay &&
        typeof onboarding
          ?.current_step ===
          "number"
      ) {
        setCurrentIndex(
          Math.max(
            0,
            Math.min(
              config.slides
                .length - 1,
              onboarding
                .current_step - 1
            )
          )
        );
      }

      setLoading(false);
    }

    void loadTour();

    return () => {
      cancelled = true;
    };
  }, [
    workspace,
    config,
    replay,
    router,
  ]);

  async function savePosition(
    index: number
  ) {
    if (
      !workspace ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const supabase =
      createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setSaving(false);

      router.replace(
        `/signin?workspace=${workspace}`
      );

      return;
    }

    const { error } =
      await supabase
        .from(
          "workspace_onboarding"
        )
        .upsert(
          {
            user_id:
              user.id,

            workspace,

            current_step:
              index + 1,

            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id,workspace",
          }
        );

    if (error) {
      console.error(
        "Could not save tour position:",
        error
      );

      setError(
        "Your position could not be saved."
      );

      setSaving(false);

      return;
    }

    setCurrentIndex(index);
    setSaving(false);
  }

  async function completeTour() {
    if (
      !workspace ||
      !config ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const supabase =
      createClient();

    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      setSaving(false);

      router.replace(
        `/signin?workspace=${workspace}`
      );

      return;
    }

    const now =
      new Date().toISOString();

    const { error } =
      await supabase
        .from(
          "workspace_onboarding"
        )
        .upsert(
          {
            user_id:
              user.id,

            workspace,

            current_step:
              config.slides.length,

            completed_at:
              now,

            updated_at:
              now,
          },
          {
            onConflict:
              "user_id,workspace",
          }
        );

    if (error) {
      console.error(
        "Could not complete tour:",
        error
      );

      setError(
        "The tour could not be completed."
      );

      setSaving(false);

      return;
    }

    router.replace(
      config.destination
    );

    router.refresh();
  }

  if (
    !workspace ||
    !config ||
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#e8eeee]">
        <PsyLatticeLogo />
      </main>
    );
  }

  const slide =
    config.slides[
      currentIndex
    ];

  const isFirst =
    currentIndex === 0;

  const isLast =
    currentIndex ===
    config.slides.length - 1;

  const progress =
    ((currentIndex + 1) /
      config.slides.length) *
    100;

  const imageFailed =
    failedImages[
      slide.imagePath
    ] === true;

  return (
    <main className="min-h-screen bg-[#e8eeee] text-slate-950 lg:h-[100dvh] lg:overflow-hidden">
      {/* HEADER */}
      <header className="h-14 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between px-5 lg:px-7">
          <PsyLatticeLogo />

          <div className="flex items-center gap-2">
            {!replay && (
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void completeTour()
                }
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Skip tour
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/workspace"
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Workspaces
            </button>
          </div>
        </div>
      </header>

      {/* TOP PROGRESS */}
      <div className="h-[3px] bg-slate-200">
        <div
          className="h-full bg-cyan-700 transition-all duration-300"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      {/* PAGE */}
      <div className="mx-auto flex max-w-[1500px] flex-col px-4 py-3 sm:px-5 lg:h-[calc(100dvh-59px)] lg:px-7 lg:py-4">
        {/* TITLE ROW */}
        <div className="mb-3 flex shrink-0 items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-cyan-900">
                {config.label}
              </p>

              <span className="text-slate-400">
                ·
              </span>

              <p className="text-xs font-semibold text-slate-500">
                {currentIndex + 1}{" "}
                of{" "}
                {config.slides.length}
              </p>
            </div>

            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-950">
              {slide.title}
            </h1>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-3 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* TOUR CARD */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_20px_55px_-28px_rgba(15,23,42,0.38)]">
          {/* MAIN CONTENT */}
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(360px,.78fr)]">
            {/* SCREENSHOT SIDE */}
            <div className="min-h-[360px] border-b border-slate-300 bg-slate-100 p-3 lg:min-h-0 lg:border-b-0 lg:border-r">
              <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                {/* BROWSER BAR */}
                <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3">
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="h-2 w-2 rounded-full bg-slate-300" />

                  <div className="ml-2 flex-1 rounded bg-white px-2 py-0.5 text-[9px] text-slate-400">
                    psylattice.com
                  </div>
                </div>

                {/* SCREENSHOT */}
                <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-100">
                  {!imageFailed ? (
                    <img
                      key={
                        slide.imagePath
                      }
                      src={
                        slide.imagePath
                      }
                      alt={`${slide.title} screenshot`}
                      className="h-full w-full object-contain object-center"
                      onError={() => {
                        setFailedImages(
                          (
                            previous
                          ) => ({
                            ...previous,
                            [slide.imagePath]:
                              true,
                          })
                        );
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50/40">
                      <div className="px-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-800">
                          ◫
                        </div>

                        <p className="mt-3 text-xs font-semibold text-slate-700">
                          Screenshot
                          coming soon
                        </p>

                        <code className="mt-2 inline-block rounded-md bg-slate-950 px-2.5 py-1.5 text-[9px] text-cyan-200">
                          {
                            slide.imagePath
                          }
                        </code>
                      </div>
                    </div>
                  )}

                  {/* CALLOUT MARKERS - only slides that explicitly have them */}
                  {!imageFailed &&
                    slide.callouts?.map(
                      (
                        callout,
                        index
                      ) => {
                        const positions =
                          [
                            "left-[15%] top-[20%]",
                            "left-[52%] top-[43%]",
                            "right-[14%] bottom-[20%]",
                          ];

                        return (
                          <div
                            key={
                              callout.number
                            }
                            className={`absolute ${
                              positions[
                                index %
                                  positions.length
                              ]
                            } flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-cyan-800 text-[10px] font-bold text-white shadow-lg`}
                          >
                            {
                              callout.number
                            }
                          </div>
                        );
                      }
                    )}
                </div>
              </div>
            </div>

            {/* DARK EXPLANATION SIDE */}
            <aside className="min-h-0 overflow-y-auto bg-slate-800 p-5 text-white lg:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                {slide.eyebrow}
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[28px]">
                {slide.title}
              </h2>

              <p className="mt-4 text-[14px] font-medium leading-6 text-slate-200">
                {
                  slide.description
                }
              </p>

              {/* WHAT YOU CAN DO */}
              {slide.details &&
                slide.details.length >
                  0 && (
                  <div className="mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      What you can do here
                    </p>

                    <div className="mt-3 space-y-3">
                      {slide.details.map(
                        (
                          detail,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="flex items-start gap-3"
                          >
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />

                            <p className="text-[12px] leading-[1.55] text-slate-300">
                              {
                                detail
                              }
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* OPTIONAL CALLOUT TEXT */}
              {slide.callouts &&
                slide.callouts
                  .length > 0 && (
                  <div className="mt-6 border-t border-slate-800 pt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Key areas
                    </p>

                    <div className="mt-3 space-y-3">
                      {slide.callouts.map(
                        (
                          callout
                        ) => (
                          <div
                            key={
                              callout.number
                            }
                            className="flex gap-3"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-700 text-[10px] font-bold text-white">
                              {
                                callout.number
                              }
                            </span>

                            <div>
                              <p className="text-xs font-semibold text-white">
                                {
                                  callout.title
                                }
                              </p>

                              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                                {
                                  callout.description
                                }
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* NOTE */}
              {slide.note && (
                <div className="mt-6 rounded-xl border border-cyan-800/70 bg-cyan-950/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                    Important
                  </p>

                  <p className="mt-2 text-[11px] font-medium leading-5 text-cyan-50">
                    {slide.note}
                  </p>
                </div>
              )}
            </aside>
          </div>

          {/* BOTTOM CONTROLS */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* PREVIOUS */}
              <button
                type="button"
                disabled={
                  saving ||
                  isFirst
                }
                onClick={() =>
                  void savePosition(
                    currentIndex -
                      1
                  )
                }
                className="min-w-[100px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>

              {/* DOT NAVIGATION */}
              <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
                {config.slides.map(
                  (
                    item,
                    index
                  ) => (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      title={
                        item.title
                      }
                      aria-label={`Open ${item.title}`}
                      disabled={
                        saving
                      }
                      onClick={() =>
                        void savePosition(
                          index
                        )
                      }
                      className={`h-2 rounded-full transition-all ${
                        index ===
                        currentIndex
                          ? "w-6 bg-cyan-700"
                          : index <
                              currentIndex
                            ? "w-2 bg-cyan-300"
                            : "w-2 bg-slate-300"
                      }`}
                    />
                  )
                )}
              </div>

              {/* NEXT / ENTER */}
              {!isLast ? (
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    void savePosition(
                      currentIndex +
                        1
                    )
                  }
                  className="min-w-[100px] rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Next →"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    void completeTour()
                  }
                  className="whitespace-nowrap rounded-lg bg-cyan-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-50"
                >
                  {saving
                    ? "Opening..."
                    : `Enter ${config.shortLabel} Workspace →`}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#e8eeee]">
          <PsyLatticeLogo />
        </main>
      }
    >
      <WorkspaceTour />
    </Suspense>
  );
}