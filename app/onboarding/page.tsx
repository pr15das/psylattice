"use client";

import {
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
      {
        id: "studies",
        eyebrow: "Research home",
        title: "Studies",
        description:
          "Create, organise and manage PsyLattice research projects from one workspace.",
      },
      {
        id: "study-builder",
        eyebrow: "Design",
        title: "Study Builder",
        description:
          "Build participant flows, study information, consent and the measures required for your project.",
      },
      {
        id: "questionnaires",
        eyebrow: "Measures",
        title: "Questionnaire Library",
        description:
          "Organise psychological measures for use across studies and research workflows.",
      },
      {
        id: "custom-questionnaires",
        eyebrow: "Create",
        title: "Custom Questionnaires",
        description:
          "Build study-specific questions, response formats, branching and media-based items.",
      },
      {
        id: "ambulatory",
        eyebrow: "EMA / ESM",
        title: "Ambulatory Builder",
        description:
          "Build repeated real-world assessment protocols with schedules, random prompts, events and branching logic.",
      },
      {
        id: "participants",
        eyebrow: "Collect",
        title: "Participants",
        description:
          "Follow participation and completion while keeping participant research workflows separate from Self.",
      },
      {
        id: "followups",
        eyebrow: "Longitudinal research",
        title: "Follow-Ups",
        description:
          "Invite the same participant back securely across follow-up waves.",
      },
      {
        id: "data",
        eyebrow: "Monitor",
        title: "Research Data",
        description:
          "Review collected study information, completion activity and participant uploads before export.",
      },
      {
        id: "export",
        eyebrow: "Analyse",
        title: "Export",
        description:
          "Export structured research datasets organised by participant, wave, questionnaire and item.",
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
  ambulatory: <BellRing className="h-3.5 w-3.5" />,
  participants: <Users className="h-3.5 w-3.5" />,
  followups: <BellRing className="h-3.5 w-3.5" />,
  data: <Database className="h-3.5 w-3.5" />,
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

function DemoCard({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
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

function ResearchDemo({ slideId }: { slideId: string }) {
  const [query, setQuery] = useState("");
  const [selectedStep, setSelectedStep] = useState("Measures");

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
                ["Perceived Stress Scale", "Custom Image Choice", "Reaction-time task"].map((name) => (
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

  if (slideId === "questionnaires") {
    const items = ["General Self-Efficacy Scale", "WHO-5 Well-Being", "Perceived Stress Scale", "UCLA Loneliness Scale"]
      .filter((item) => item.toLowerCase().includes(query.toLowerCase()));
    return (
      <div>
        <ScreenTitle eyebrow="Questionnaire Library" title="Measures" action="New custom questionnaire" />
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1 text-[10px] outline-none" placeholder="Search questionnaires..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map((name, index) => (
            <DemoCard key={name} className="p-4" highlight={index === 0}>
              <p className="text-xs font-semibold text-slate-900">{name}</p>
              <p className="mt-1 text-[9px] text-slate-500">Validated measure · resources available</p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] font-semibold text-slate-600">Open</button>
                <button className="rounded-lg bg-cyan-700 px-2 py-1.5 text-[8px] font-semibold text-white">Use in study</button>
              </div>
            </DemoCard>
          ))}
        </div>
      </div>
    );
  }

  if (slideId === "custom-questionnaires") {
    return (
      <div>
        <ScreenTitle eyebrow="Custom Questionnaire" title="Image preference task" action="Preview" />
        <DemoCard className="p-4" highlight>
          <div className="grid grid-cols-[.72fr_1.28fr] gap-3">
            <div className="space-y-2">
              {["Intro text", "Image choice", "Slider", "Free text"].map((item, index) => (
                <button key={item} className={`w-full rounded-xl border px-3 py-2.5 text-left text-[10px] font-medium ${index === 1 ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-600"}`}>{item}</button>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-semibold text-slate-800">Which image do you prefer?</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-cyan-300 bg-white p-3">
                  <div className="h-20 rounded-lg bg-gradient-to-br from-cyan-100 to-slate-100" />
                  <p className="mt-2 text-[9px] font-medium text-slate-600">Option A</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="h-20 rounded-lg bg-gradient-to-br from-cyan-100 to-slate-100" />
                  <p className="mt-2 text-[9px] font-medium text-slate-600">Option B</p>
                </div>
              </div>
            </div>
          </div>
        </DemoCard>
      </div>
    );
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

  return (
    <div>
      <ScreenTitle eyebrow="Export" title="Build an analysis-ready file" action="Generate export" />
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
  onNavigate,
}: {
  workspace: Workspace;
  config: TourConfig;
  activeSlideId: string;
  onNavigate: (slideId: string) => void;
}) {
  return (
    <div className="flex h-full min-h-[520px] overflow-hidden rounded-[24px] border border-slate-200/90 bg-[#f6fafb] text-slate-950 shadow-[0_18px_48px_rgba(15,23,42,0.09),0_2px_10px_rgba(8,145,178,0.045)]">
      <aside className="w-[176px] shrink-0 border-r border-slate-200/80 bg-white/96 p-3">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <PsyLatticeLogo size={26} />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-slate-800">PsyLattice</p>
            <p className="truncate text-[8px] text-slate-400">{config.shortLabel} workspace</p>
          </div>
        </div>

        <p className="mb-2 px-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
        <div className="space-y-1">
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
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-900">Demo mode</p>
          <p className="mt-1 text-[8px] leading-4 text-slate-500">Dummy information only. Click the sidebar to explore.</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex h-12 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4">
          <div>
            <p className="text-[9px] font-semibold text-slate-700">{config.label}</p>
            <p className="text-[8px] text-slate-400">Interactive onboarding preview</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">Demo</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600">PD</div>
          </div>
        </div>

        <div className="h-[calc(100%-48px)] overflow-auto p-4">
          {workspace === "self" && <SelfDemo slideId={activeSlideId} />}
          {workspace === "researcher" && <ResearchDemo slideId={activeSlideId} />}
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
    if (index >= 0 && index !== currentIndex) void savePosition(index);
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

  return (
    <main className="min-h-screen bg-[#f6f8f8] text-slate-950">
      <style>{`
        @keyframes psylatticeTourIn {
          from { opacity: 0; transform: translateY(8px) scale(.997); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes psylatticeCardIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .psylattice-tour-in { animation: psylatticeTourIn 240ms ease-out both; }
        .psylattice-card-in { animation: psylatticeCardIn 280ms 50ms ease-out both; }
      `}</style>

      <header className="sticky top-3 z-40 mx-3 rounded-[28px] border border-slate-200/90 bg-white/95 shadow-[0_16px_38px_rgba(15,23,42,0.09),0_2px_10px_rgba(8,145,178,0.05)] backdrop-blur-xl sm:mx-4">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-7 lg:px-9">
          <div className="flex min-w-0 items-center gap-4">
            <PsyLatticeLogo />
            <div className="hidden h-6 w-px bg-slate-200 sm:block" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-xs font-semibold text-slate-700">{config.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Quick tour · {currentIndex + 1} of {config.slides.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!replay && (
              <button type="button" disabled={saving} onClick={() => void completeTour()} className="rounded-full border border-transparent px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-200 hover:bg-white hover:text-slate-800 hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)] disabled:opacity-40">
                Skip tour
              </button>
            )}
            <button type="button" onClick={() => router.push("/workspace")} className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-[0_5px_14px_rgba(15,23,42,0.06)] transition hover:-translate-y-px hover:border-cyan-200 hover:text-slate-900">
              Workspaces
            </button>
          </div>
        </div>
        <div className="h-[3px] bg-slate-100">
          <div className="h-full bg-cyan-700 transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 pb-5 pt-6 sm:px-7 lg:px-9 lg:pb-7 lg:pt-7">
        {error && (
          <div className="mb-4 flex items-start gap-3 px-1 text-sm text-slate-600">
            <span className="mt-1 h-4 w-0.5 rounded-full bg-rose-400" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div key={slide.id} className="psylattice-tour-in relative overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_3px_8px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.10),0_34px_82px_rgba(8,145,178,0.055)]">
          <div className="flex items-center justify-between border-b border-slate-200/90 bg-[#f9fbfc] px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full border border-cyan-300 bg-cyan-300" />
              </div>
              <div className="hidden min-w-0 rounded-lg border border-slate-300/80 bg-white/85 px-4 py-1.5 text-[10px] font-medium text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:block sm:w-72">
                psylattice.com
              </div>
            </div>

            <button type="button" onClick={() => setFocusOpen(true)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-cyan-200 hover:text-slate-900">
              Focus
            </button>
          </div>

          <div className="relative h-[clamp(560px,70dvh,790px)] overflow-hidden bg-[#eef5f6] p-3 sm:p-5">
            <MockWorkspace workspace={workspace} config={config} activeSlideId={slide.id} onNavigate={navigateBySlideId} />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#eef5f6] via-[#eef5f6]/60 to-transparent" />

            <article className="psylattice-card-in absolute bottom-5 left-5 right-5 rounded-[26px] border border-slate-200/90 bg-white/96 p-5 shadow-[0_4px_10px_rgba(15,23,42,0.06),0_20px_54px_rgba(15,23,42,0.16),0_30px_72px_rgba(8,145,178,0.07)] backdrop-blur-xl sm:left-auto sm:w-[390px] lg:bottom-7 lg:right-7 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-800">{slide.eyebrow}</p>
                  <h1 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-2xl">{slide.title}</h1>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{currentIndex + 1}/{config.slides.length}</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{slide.description}</p>

              <div className="mt-4 rounded-[18px] border border-cyan-200/80 bg-white px-3 py-2.5 text-[10px] leading-5 text-cyan-950 shadow-[0_5px_15px_rgba(8,145,178,0.07)]">
                Try the demo: use the mini workspace sidebar or interact with the highlighted controls.
              </div>

              {slide.note && <p className="mt-4 border-l-2 border-cyan-200 pl-3 text-[11px] leading-5 text-slate-500">{slide.note}</p>}

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <button type="button" disabled={saving || isFirst} onClick={() => void savePosition(currentIndex - 1)} className="rounded-full border border-transparent px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-slate-200 hover:bg-white hover:shadow-[0_4px_12px_rgba(15,23,42,0.05)] disabled:cursor-not-allowed disabled:opacity-25">
                  ← Back
                </button>

                {!isLast ? (
                  <button type="button" disabled={saving} onClick={() => void savePosition(currentIndex + 1)} className="rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(15,23,42,0.18),0_14px_28px_rgba(15,23,42,0.13)] transition hover:-translate-y-px hover:bg-slate-800 disabled:opacity-50">
                    {saving ? "Saving..." : "Next →"}
                  </button>
                ) : (
                  <button type="button" disabled={saving} onClick={() => void completeTour()} className="rounded-full bg-cyan-800 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(8,145,178,0.20),0_14px_30px_rgba(8,145,178,0.14)] transition hover:-translate-y-px hover:bg-cyan-900 disabled:opacity-50">
                    {saving ? "Opening..." : `Enter ${config.shortLabel} →`}
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {config.slides.map((item, index) => (
            <button key={item.id} type="button" title={item.title} disabled={saving} onClick={() => void savePosition(index)} className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-7 bg-cyan-700" : index < currentIndex ? "w-2 bg-cyan-300" : "w-2 bg-slate-300"}`} />
          ))}
        </div>
      </section>

      {focusOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" onClick={() => setFocusOpen(false)}>
          <div className="flex h-[92dvh] w-full max-w-[1700px] flex-col overflow-hidden rounded-[30px] border border-white/30 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.30)]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Interactive demo</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{slide.title}</p>
              </div>
              <button type="button" onClick={() => setFocusOpen(false)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.05)] hover:border-cyan-200 hover:text-slate-900">Close ✕</button>
            </div>
            <div className="min-h-0 flex-1 bg-[#eef5f6] p-4 sm:p-6">
              <MockWorkspace workspace={workspace} config={config} activeSlideId={slide.id} onNavigate={(slideId) => { navigateBySlideId(slideId); setFocusOpen(false); }} />
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
