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
        eyebrow: "Your overview",
        title: "Dashboard",
        description:
          "Your personal overview brings together your current clinician connection, assessments, monitoring activity and the things that need your attention today.",
        note:
          "Connecting with a clinician does not automatically give them access to everything in Self.",
        imagePath:
          "/onboarding/self/dashboard.png",

        callouts: [
          {
            number: 1,
            title: "Clinician connection",
            description:
              "See and manage your current clinician.",
          },
          {
            number: 2,
            title: "Today",
            description:
              "See monitoring and activities relevant today.",
          },
          {
            number: 3,
            title: "Your overview",
            description:
              "Follow your personal PsyLattice activity in one place.",
          },
        ],
      },

      {
        id: "ai",
        eyebrow: "Explore",
        title: "AI Guide",
        description:
          "Explore psychological concepts, think about what you may want to assess and reflect on patterns you have noticed.",
        note:
          "Luna conversations are private and are not included in clinician-sharing permissions.",
        imagePath:
          "/onboarding/self/ai-guide.png",
      },

      {
        id: "assessments",
        eyebrow: "Measure",
        title: "Self-Assessments",
        description:
          "Browse psychological measures, complete structured self-assessments and revisit previous results.",
        note:
          "Questionnaire results are for reflection and are not a diagnosis on their own.",
        imagePath:
          "/onboarding/self/assessments.png",
      },

      {
        id: "monitoring",
        eyebrow: "Observe",
        title: "Daily Monitoring",
        description:
          "Capture experiences repeatedly across everyday life using scheduled, event-based or participant-initiated check-ins.",
        imagePath:
          "/onboarding/self/monitoring.png",
      },

      {
        id: "regulation",
        eyebrow: "Act",
        title: "Self-Regulation",
        description:
          "Create small, trackable routines and follow your completion across time.",
        imagePath:
          "/onboarding/self/self-regulation.png",
      },

      {
        id: "progress",
        eyebrow: "Understand",
        title: "Progress",
        description:
          "See how assessments, monitoring and other tracked information change over time.",
        imagePath:
          "/onboarding/self/progress.png",
      },

      {
        id: "wearables",
        eyebrow: "Optional context",
        title: "Wearables",
        description:
          "Add optional behavioural or physiological context when wearable integrations are available.",
        note:
          "Wearable sharing with a clinician remains a separate permission you control.",
        imagePath:
          "/onboarding/self/wearables.png",
      },

      {
        id: "appointments",
        eyebrow: "Connected care",
        title: "Appointments",
        description:
          "See appointments with your current clinician and send appointment requests through PsyLattice.",
        imagePath:
          "/onboarding/self/appointments.png",
      },

      {
        id: "messages",
        eyebrow: "Connected care",
        title: "Messages",
        description:
          "Use PsyLattice for private, non-emergency communication with your current clinician.",
        imagePath:
          "/onboarding/self/messages.png",
      },

      {
        id: "privacy",
        eyebrow: "You stay in control",
        title: "Privacy & Sharing",
        description:
          "Choose exactly which categories of your Self information your current clinician can access.",
        note:
          "You can change permissions or disconnect your clinician at any time.",
        imagePath:
          "/onboarding/self/privacy-sharing.png",

        callouts: [
          {
            number: 1,
            title: "Separate permissions",
            description:
              "Control assessments, monitoring, progress, wearables and regulation separately.",
          },
          {
            number: 2,
            title: "Luna stays private",
            description:
              "AI conversation history is not part of these permissions.",
          },
        ],
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
          "Create, organise and manage your PsyLattice research projects from one workspace.",
        imagePath:
          "/onboarding/research/studies.png",
      },

      {
        id: "study-builder",
        eyebrow: "Design",
        title: "Study Builder",
        description:
          "Build participant flows, study information, consent and the measures required for your project.",
        imagePath:
          "/onboarding/research/study-builder.png",
      },

      {
        id: "questionnaires",
        eyebrow: "Measures",
        title: "Questionnaire Library",
        description:
          "Organise psychological measures for use across studies and research workflows.",
        note:
          "Only use questionnaire content and scoring you are authorised to use.",
        imagePath:
          "/onboarding/research/questionnaires.png",
      },

      {
        id: "custom-questionnaires",
        eyebrow: "Create",
        title: "Custom Questionnaires",
        description:
          "Build study-specific questions and response formats for your research.",
        imagePath:
          "/onboarding/research/custom-questionnaires.png",
      },

      {
        id: "ambulatory",
        eyebrow: "EMA / ESM",
        title: "Ambulatory Builder",
        description:
          "Build repeated real-world assessment protocols with schedules, random prompts, events and branching logic.",
        imagePath:
          "/onboarding/research/ambulatory-builder.png",

        callouts: [
          {
            number: 1,
            title: "Schedules",
            description:
              "Define when assessments become available.",
          },
          {
            number: 2,
            title: "Measures",
            description:
              "Combine individual questions and questionnaires.",
          },
          {
            number: 3,
            title: "Conditional logic",
            description:
              "Show relevant follow-ups based on previous responses.",
          },
        ],
      },

      {
        id: "participants",
        eyebrow: "Collect",
        title: "Participants",
        description:
          "Follow study participation while keeping participant research workflows separate from Self.",
        imagePath:
          "/onboarding/research/participants.png",
      },

      {
        id: "followups",
        eyebrow: "Longitudinal research",
        title: "Follow-Ups",
        description:
          "Invite the same participant back securely across follow-up waves.",
        imagePath:
          "/onboarding/research/follow-ups.png",
      },

      {
        id: "data",
        eyebrow: "Monitor",
        title: "Research Data",
        description:
          "Review collected study information and completion activity before export.",
        imagePath:
          "/onboarding/research/data.png",
      },

      {
        id: "export",
        eyebrow: "Analyse",
        title: "Export",
        description:
          "Export structured XLSX datasets organised by participant, wave, questionnaire and item.",
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
          "Your Clinical workspace centres on connected clients and each active clinician-client relationship.",
        note:
          "A client connection alone does not automatically expose all of their Self information.",
        imagePath:
          "/onboarding/clinical/clients.png",
      },

      {
        id: "client-overview",
        eyebrow: "Connected client",
        title: "Client Overview",
        description:
          "Open a client to work with authorised assessment, monitoring, progress and clinical information.",
        imagePath:
          "/onboarding/clinical/client-overview.png",
      },

      {
        id: "assessments",
        eyebrow: "Measure",
        title: "Assessments",
        description:
          "Assign measures and review assessment information available within the active client relationship.",
        imagePath:
          "/onboarding/clinical/assessments.png",
      },

      {
        id: "monitoring",
        eyebrow: "Observe",
        title: "Monitoring",
        description:
          "Propose real-world monitoring protocols and review monitoring information the client has chosen to share.",
        imagePath:
          "/onboarding/clinical/monitoring.png",
      },

      {
        id: "progress",
        eyebrow: "Longitudinal view",
        title: "Progress",
        description:
          "Review authorised information across time rather than relying on isolated appointments or individual scores.",
        imagePath:
          "/onboarding/clinical/progress.png",
      },

      {
        id: "care-pathway",
        eyebrow: "Plan",
        title: "Care Pathway",
        description:
          "Organise goals, actions, reviews and the evolving structure of professional work.",
        imagePath:
          "/onboarding/clinical/care-pathway.png",
      },

      {
        id: "notes",
        eyebrow: "Professional workspace",
        title: "Professional Notes",
        description:
          "Keep clinician-authored notes organised in private folders and professional records.",
        note:
          "Professional notes are separate from client-controlled Self information.",
        imagePath:
          "/onboarding/clinical/professional-notes.png",
      },

      {
        id: "appointments",
        eyebrow: "Practice workflow",
        title: "Appointments",
        description:
          "Schedule appointments, review client requests and keep client-visible information separate from private notes.",
        imagePath:
          "/onboarding/clinical/appointments.png",
      },

      {
        id: "messages",
        eyebrow: "Communication",
        title: "Secure Messages",
        description:
          "Use PsyLattice for private, non-emergency communication with currently connected clients.",
        imagePath:
          "/onboarding/clinical/messages.png",
      },

      {
        id: "receptionist",
        eyebrow: "Optional administration",
        title: "Receptionist Access",
        description:
          "Give a receptionist appointment-management access without exposing assessments, progress, notes or other confidential clinical areas.",
        note:
          "Receptionist access can be paused, replaced or removed by the clinician.",
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

  const [expandedImage, setExpandedImage] =
    useState(false);

  const [imageLoadFailed, setImageLoadFailed] =
    useState(false);

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

      const destination =
        config.destination;
      const slideCount =
        config.slides.length;

      const supabase =
        createClient();

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (cancelled) return;

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

      if (cancelled) return;

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
        onboarding
          ?.completed_at &&
        !replay
      ) {
        router.replace(
          destination
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
              slideCount - 1,
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

  useEffect(() => {
    setImageLoadFailed(false);
    setExpandedImage(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!expandedImage) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpandedImage(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedImage]);

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
            updated_at: now,
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
      <main className="flex min-h-screen items-center justify-center bg-[#f6fafb]">
        <PsyLatticeLogo />
      </main>
    );
  }

  const slide =
    config.slides[currentIndex];

  const isFirst =
    currentIndex === 0;

  const isLast =
    currentIndex ===
    config.slides.length - 1;

  const progress =
    ((currentIndex + 1) /
      config.slides.length) *
    100;

  return (
    <main className="min-h-screen bg-[#f6fafb] text-slate-950">
      <style>{`
        @keyframes psylatticeTourIn {
          from { opacity: 0; transform: translateY(10px) scale(.995); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes psylatticeCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .psylattice-tour-in {
          animation: psylatticeTourIn 260ms ease-out both;
        }
        .psylattice-card-in {
          animation: psylatticeCardIn 300ms 70ms ease-out both;
        }
      `}</style>

      {/* HEADER — deliberately matches the existing PsyLattice app */}
      <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 rounded-full border border-slate-200/90 bg-white/95 px-5 shadow-[0_10px_30px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <PsyLatticeLogo />

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-semibold text-slate-700">
                {config.label}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Quick tour · {currentIndex + 1} of {config.slides.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!replay && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void completeTour()}
                className="rounded-full px-3.5 py-2 text-xs font-semibold text-slate-500 transition hover:bg-violet-50 hover:text-violet-800 disabled:opacity-40"
              >
                Skip tour
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push("/workspace")}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-[0_5px_16px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-900"
            >
              Workspaces
            </button>
          </div>
        </div>

        <div className="mx-auto mt-2 h-[3px] max-w-[1460px] overflow-hidden rounded-full bg-slate-100 shadow-inner">
          <div
            className="h-full bg-cyan-700 transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-9 lg:py-7">
        {error && (
          <div className="mb-4 flex items-start gap-3 px-1 py-1 text-sm text-violet-800">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
            {error}
          </div>
        )}

        {/* LARGE SCREENSHOT STAGE */}
        <div
          key={slide.id}
          className="psylattice-tour-in relative overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.12),0_5px_18px_rgba(8,145,178,0.05)]"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
              </div>

              <div className="hidden min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-1.5 text-[10px] text-slate-400 sm:block sm:w-72">
                psylattice.com
              </div>
            </div>

            {!imageLoadFailed && (
              <button
                type="button"
                onClick={() => setExpandedImage(true)}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-900"
              >
                View larger
              </button>
            )}
          </div>

          <div className="relative flex min-h-[430px] items-center justify-center bg-[#eef2f3] p-3 sm:min-h-[520px] sm:p-5 lg:h-[calc(100dvh-190px)] lg:min-h-[560px] lg:max-h-[820px]">
            {!imageLoadFailed ? (
              <button
                type="button"
                onClick={() => setExpandedImage(true)}
                className="flex h-full w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-[24px] border border-slate-200 bg-white text-left shadow-[0_14px_34px_rgba(15,23,42,0.09)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)]"
                aria-label={`Open ${slide.title} screenshot larger`}
              >
                <img
                  src={slide.imagePath}
                  alt={`${slide.title} screen in PsyLattice`}
                  onError={() => setImageLoadFailed(true)}
                  className="h-full max-h-full w-full object-contain object-center"
                />
              </button>
            ) : (
              <div className="mx-auto max-w-lg rounded-[28px] border border-dashed border-violet-300 bg-[#fcfaff] px-7 py-9 text-center shadow-[0_14px_34px_rgba(109,40,217,0.08)]">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-lg text-cyan-800">
                  ◫
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-800">
                  Add this screenshot
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Save the image in your public folder at:
                </p>
                <code className="mt-3 inline-block max-w-full overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-[11px] text-cyan-200">
                  {slide.imagePath}
                </code>
              </div>
            )}

            {/* FLOATING EXPLANATION CARD */}
            <article className="psylattice-card-in absolute bottom-5 left-5 right-5 rounded-[28px] border border-cyan-200/70 bg-white/95 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18),0_5px_18px_rgba(8,145,178,0.10)] backdrop-blur sm:left-auto sm:w-[390px] lg:bottom-7 lg:right-7 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-800">
                    {slide.eyebrow}
                  </p>
                  <h1 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-2xl">
                    {slide.title}
                  </h1>
                </div>

                <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50/80 px-2.5 py-1 text-[10px] font-semibold text-violet-700 shadow-[0_4px_12px_rgba(109,40,217,0.07)]">
                  {currentIndex + 1}/{config.slides.length}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {slide.description}
              </p>

              {slide.callouts && slide.callouts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {slide.callouts.map((callout) => (
                    <span
                      key={callout.number}
                      title={callout.description}
                      className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-[0_5px_14px_rgba(8,145,178,0.08)]"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-800 text-[9px] text-white">
                        {callout.number}
                      </span>
                      {callout.title}
                    </span>
                  ))}
                </div>
              )}

              {slide.note && (
                <p className="mt-4 border-l-2 border-cyan-200 pl-3 text-[11px] leading-5 text-slate-500">
                  {slide.note}
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={saving || isFirst}
                  onClick={() => void savePosition(currentIndex - 1)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-[0_5px_14px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  ← Back
                </button>

                {!isLast ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void savePosition(currentIndex + 1)}
                    className="rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_9px_22px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-cyan-950 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Next →"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void completeTour()}
                    className="rounded-full bg-cyan-800 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(8,145,178,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-900 disabled:opacity-50"
                  >
                    {saving
                      ? "Opening..."
                      : `Enter ${config.shortLabel} →`}
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>

        {/* TINY NAVIGATION — discoverable without making the page busy */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {config.slides.map((item, index) => (
            <button
              key={item.id}
              type="button"
              title={item.title}
              disabled={saving}
              onClick={() => void savePosition(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-7 bg-cyan-700"
                  : index < currentIndex
                    ? "w-2 bg-cyan-300"
                    : "w-2 bg-slate-300"
              }`}
            />
          ))}
        </div>
      </section>

      {/* FULL-SCREEN SCREENSHOT VIEWER */}
      {expandedImage && !imageLoadFailed && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${slide.title} screenshot`}
          onClick={() => setExpandedImage(false)}
        >
          <div
            className="relative flex max-h-[94dvh] w-full max-w-[1700px] flex-col overflow-hidden rounded-[30px] border border-white/30 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-800">
                  {slide.eyebrow}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {slide.title}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setExpandedImage(false)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[#eef2f3] p-3 sm:p-5">
              <img
                src={slide.imagePath}
                alt={`${slide.title} screen in PsyLattice`}
                className="mx-auto h-auto max-h-[calc(94dvh-82px)] max-w-full rounded-xl border border-slate-200 bg-white object-contain shadow-sm"
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
        <main className="flex min-h-screen items-center justify-center bg-[#f6fafb]">
          <PsyLatticeLogo />
        </main>
      }
    >
      <WorkspaceTour />
    </Suspense>
  );
}