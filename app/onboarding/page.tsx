"use client";

// PSYLATTICE ONBOARDING V6 — real Clinical Notes + Messages demo replicas

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
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
  Filter,
  Plus,
  RefreshCw,
  Eye,
  MoreHorizontal,
  UserPlus,
  Send,
  ChevronDown,
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

function ScreenTitle({
  eyebrow,
  title,
  action,
  onAction,
  secondary,
  onSecondary,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
  secondary?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-800">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
      </div>
      <div className="flex items-center gap-2">
        {secondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            {secondary}
          </button>
        )}
        {action && (
          <button
            type="button"
            onClick={onAction}
            className="rounded-xl bg-slate-950 px-3.5 py-2 text-[10px] font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            {action}
          </button>
        )}
      </div>
    </div>
  );
}

function DemoNotice({ text }: { text: string }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl border border-cyan-100 bg-cyan-50 px-3 py-2.5 text-[10px] text-cyan-900">
      <span>{text}</span>
      <span className="rounded-full bg-white px-2 py-1 text-[8px] font-semibold text-cyan-700 shadow-sm">Demo only</span>
    </div>
  );
}

function DemoToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`h-5 w-9 rounded-full p-0.5 transition ${enabled ? "bg-cyan-600" : "bg-slate-200"}`}
      aria-pressed={enabled}
    >
      <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function SelfDemo({ slideId }: { slideId: string }) {
  const [notice, setNotice] = useState("");
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { side: "ai", text: "What would you like to understand better today?" },
    { side: "user", text: "I keep getting tense before group presentations." },
    { side: "ai", text: "We can unpack what happens before, during and after those moments, then decide what may be worth monitoring." },
  ]);
  const [assessmentStarted, setAssessmentStarted] = useState<string | null>(null);
  const [checkins, setCheckins] = useState({ morning: true, evening: false });
  const [routines, setRoutines] = useState({ grounding: true, winddown: false, rehearsal: true });
  const [progressRange, setProgressRange] = useState<"7d" | "30d" | "90d">("30d");
  const [wearables, setWearables] = useState({ apple: true, fitbit: false, garmin: false, health: false });
  const [selectedDay, setSelectedDay] = useState(17);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { side: "clinician", text: "How did the presentation go yesterday?" },
    { side: "self", text: "Better than expected. I used the grounding routine before it started." },
  ]);
  const [sharing, setSharing] = useState({ assessments: true, monitoring: false, progress: true, wearables: false, regulation: true });

  function sendAi() {
    const text = aiInput.trim();
    if (!text) return;
    setAiMessages((current) => [...current, { side: "user", text }, { side: "ai", text: "That makes sense. In a real Luna conversation, we would explore that pattern with you here." }]);
    setAiInput("");
  }

  if (slideId === "dashboard") {
    return (
      <div>
        <ScreenTitle eyebrow="Personal workspace" title="Good afternoon, Priya" action="Start check-in" onAction={() => { setCheckins((c) => ({ ...c, evening: true })); setNotice("Evening reflection marked complete in the demo."); }} secondary="Refresh" onSecondary={() => setNotice("Dashboard refreshed with dummy data.")} />
        {notice && <DemoNotice text={notice} />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MiniStat label="Today" value={`${Number(checkins.morning) + Number(checkins.evening)} / 2`} helper="scheduled check-ins" />
          <MiniStat label="Assessments" value="3" helper="last updated 4d ago" />
          <MiniStat label="Clinician" value="Connected" helper="Dr. Mehta" />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.18fr_.82fr]">
          <DemoCard className="p-4" highlight>
            <div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Today</p><span className="text-[9px] text-slate-400">Wednesday · 19 Aug</span></div>
            <div className="mt-3 space-y-2">
              {[{key:"morning",label:"Mood check-in",time:"08:00"},{key:"evening",label:"Evening reflection",time:"20:00"}].map((item) => {
                const done = checkins[item.key as keyof typeof checkins];
                return <button key={item.key} type="button" onClick={() => setCheckins((c) => ({...c,[item.key]:!done}))} className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-left transition hover:bg-slate-100">
                  <div><p className="text-[11px] font-medium text-slate-800">{item.label}</p><p className="text-[9px] text-slate-400">{item.time}</p></div>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${done ? "bg-emerald-50 text-emerald-700" : "bg-cyan-50 text-cyan-700"}`}>{done ? "Done" : "Open"}</span>
                </button>;
              })}
            </div>
          </DemoCard>
          <div className="space-y-3">
            <DemoCard className="p-4">
              <p className="text-xs font-semibold text-slate-900">Your clinician</p>
              <button type="button" onClick={() => setNotice("Clinician profile opened in demo mode.")} className="mt-3 flex w-full items-center gap-3 rounded-xl bg-cyan-50 p-3 text-left transition hover:bg-cyan-100/70">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-cyan-800 shadow-sm"><Stethoscope className="h-4 w-4" /></div>
                <div><p className="text-[11px] font-semibold text-slate-800">Dr. A. Mehta</p><p className="text-[9px] text-slate-500">Connected clinician</p></div>
              </button>
            </DemoCard>
            <DemoCard className="p-4"><p className="text-xs font-semibold text-slate-900">Quick actions</p><div className="mt-3 grid grid-cols-2 gap-2">{["Assessment","Message","Progress","Privacy"].map((x)=><button key={x} onClick={()=>setNotice(`${x} opened in demo mode.`)} className="rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-semibold text-slate-600 hover:bg-slate-50">{x}</button>)}</div></DemoCard>
          </div>
        </div>
      </div>
    );
  }

  if (slideId === "ai") {
    return <div><ScreenTitle eyebrow="AI Guide" title="Luna" secondary="New conversation" onSecondary={()=>{setAiMessages([{side:"ai",text:"What would you like to understand better today?"}]);setNotice("Started a fresh demo conversation.");}} />{notice&&<DemoNotice text={notice}/>}<DemoCard className="overflow-hidden" highlight>
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[10px] font-medium text-slate-500">Private reflection space · not shared with clinicians</p></div>
      <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">{aiMessages.map((m,i)=><div key={i} className={`${m.side==="user"?"ml-auto rounded-tr-md bg-cyan-700 text-white":"rounded-tl-md bg-slate-100 text-slate-700"} max-w-[82%] rounded-2xl px-3 py-2.5 text-[11px] leading-5`}>{m.text}</div>)}</div>
      <div className="border-t border-slate-200 p-3"><div className="flex gap-2"><input value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendAi()}} className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] outline-none focus:border-cyan-400" placeholder="Ask Luna something..."/><button onClick={sendAi} className="rounded-xl bg-slate-950 px-4 text-[10px] font-semibold text-white">Send</button></div></div>
    </DemoCard></div>;
  }

  if (slideId === "assessments") {
    const measures=["Perceived Stress Scale","General Self-Efficacy Scale","WHO-5 Well-Being","Sleep Quality Check"];
    return <div><ScreenTitle eyebrow="Self-assessments" title="Assessment library" action="Browse all" onAction={()=>setNotice("Assessment library opened in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<div className="grid gap-3 sm:grid-cols-2">{measures.map((name,index)=><DemoCard key={name} className="p-4" highlight={assessmentStarted===name||index===0}><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Short structured assessment for personal reflection.</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500">{[10,10,5,8][index]} items</span></div><button onClick={()=>{setAssessmentStarted(name);setNotice(`${name} started in demo mode.`)}} className="mt-3 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600 hover:bg-slate-50">{assessmentStarted===name?"Continue":"Start"}</button></DemoCard>)}</div></div>;
  }

  if (slideId === "monitoring") {
    return <div><ScreenTitle eyebrow="Daily monitoring" title="This week" action="New check-in" onAction={()=>{setCheckins(c=>({...c,evening:!c.evening}));setNotice("Opened a demo check-in.")}} secondary="Customise" onSecondary={()=>setNotice("Monitoring schedule editor opened in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<DemoCard className="p-4" highlight><div className="flex h-40 items-end gap-2">{[46,70,54,82,65,76,61].map((height,index)=><button key={index} onClick={()=>setNotice(`${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index]}: ${height/10} average mood in the demo.`)} className="group flex flex-1 flex-col items-center justify-end"><div className="w-full max-w-8 rounded-t-lg bg-cyan-200 transition group-hover:bg-cyan-300" style={{height:`${height}px`}}/><span className="mt-2 text-[8px] text-slate-400">{["M","T","W","T","F","S","S"][index]}</span></button>)}</div><div className="mt-3 grid grid-cols-3 gap-2"><MiniStat label="Check-ins" value="11"/><MiniStat label="Completed" value="91%"/><MiniStat label="Next" value="20:00"/></div></DemoCard></div>;
  }

  if (slideId === "regulation") {
    const list=[{key:"grounding",title:"2-minute grounding",meta:"5 of 7 days"},{key:"winddown",title:"Evening wind-down",meta:"4 of 7 days"},{key:"rehearsal",title:"Presentation rehearsal",meta:"2 of 3 sessions"}] as const;
    return <div><ScreenTitle eyebrow="Self-regulation" title="Current routines" action="Add routine" onAction={()=>setNotice("Routine builder opened in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<div className="space-y-3">{list.map((item,index)=>{const done=routines[item.key];return <DemoCard key={item.key} className="p-4" highlight={index===0}><div className="flex items-center justify-between gap-3"><button onClick={()=>setRoutines(c=>({...c,[item.key]:!done}))} className="flex items-center gap-3 text-left"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${done?"bg-emerald-100 text-emerald-700":"bg-slate-100 text-slate-400"}`}>{done?<Check className="h-3.5 w-3.5"/>:index+1}</span><div><p className="text-xs font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-[10px] text-slate-500">{item.meta}</p></div></button><DemoToggle enabled={done} onToggle={()=>setRoutines(c=>({...c,[item.key]:!done}))}/></div></DemoCard>})}</div></div>;
  }

  if (slideId === "progress") {
    const heights=progressRange==="7d"?[58,64,61,70,73,79,82]:progressRange==="30d"?[48,52,49,61,65,72,76,82]:[41,45,52,55,63,69,77,84];
    return <div><ScreenTitle eyebrow="Progress" title="Your trends"/><div className="mb-3 flex gap-2">{(["7d","30d","90d"] as const).map(r=><button key={r} onClick={()=>setProgressRange(r)} className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold ${progressRange===r?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{r}</button>)}</div><DemoCard className="p-4" highlight><div className="flex h-36 items-end gap-2 rounded-xl bg-slate-50 p-4">{heights.map((h,i)=><div key={i} className="flex-1 rounded-t-md bg-cyan-300" style={{height:`${h}px`}}/>)}</div><div className="mt-3 grid grid-cols-3 gap-2"><MiniStat label="Well-being" value="+12%"/><MiniStat label="Routine" value="76%"/><MiniStat label="Check-ins" value="23"/></div></DemoCard></div>;
  }

  if (slideId === "wearables") {
    const devices=[['apple','Apple Health'],['fitbit','Fitbit'],['garmin','Garmin'],['health','Google Health Connect']] as const;
    return <div><ScreenTitle eyebrow="Wearables" title="Connected sources"/><div className="grid gap-3 sm:grid-cols-2">{devices.map(([key,name],index)=>{const enabled=wearables[key];return <DemoCard key={key} className="p-4" highlight={index===0}><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[10px] text-slate-500">{enabled?"Connected · syncing":"Not connected"}</p></div><DemoToggle enabled={enabled} onToggle={()=>setWearables(c=>({...c,[key]:!enabled}))}/></div></DemoCard>})}</div></div>;
  }

  if (slideId === "appointments") {
    return <div><ScreenTitle eyebrow="Appointments" title="August 2026" action="Request appointment" onAction={()=>setNotice(`Demo request prepared for ${selectedDay} August.`)}/>{notice&&<DemoNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]"><DemoCard className="p-4" highlight><div className="grid grid-cols-7 gap-1 text-center text-[9px] text-slate-400">{["M","T","W","T","F","S","S"].map((day,index)=><span key={`${day}-${index}`}>{day}</span>)}{Array.from({length:31}).map((_,index)=><button key={index} onClick={()=>setSelectedDay(index+1)} className={`rounded-lg py-2 text-[9px] transition ${selectedDay===index+1?"bg-cyan-600 font-semibold text-white":"bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{index+1}</button>)}</div></DemoCard><DemoCard className="p-4"><p className="text-xs font-semibold text-slate-900">{selectedDay} August</p><div className="mt-3 rounded-xl bg-cyan-50 p-3"><p className="text-[11px] font-semibold text-slate-800">Available request</p><p className="mt-1 text-[9px] text-slate-500">10:00–10:50 AM</p><button onClick={()=>setNotice(`10:00 slot selected for ${selectedDay} August.`)} className="mt-3 rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-semibold text-cyan-700 shadow-sm">Choose</button></div></DemoCard></div></div>;
  }

  if (slideId === "messages") {
    function send(){const text=message.trim();if(!text)return;setMessages(c=>[...c,{side:"self",text}]);setMessage("");}
    return <div><ScreenTitle eyebrow="Messages" title="Dr. A. Mehta"/><DemoCard className="overflow-hidden" highlight><div className="max-h-[360px] space-y-3 overflow-y-auto p-4">{messages.map((m,i)=><div key={i} className={`${m.side==="self"?"ml-auto rounded-tr-md bg-cyan-700 text-white":"rounded-tl-md bg-slate-100 text-slate-700"} max-w-[72%] rounded-2xl px-3 py-2.5 text-[10px] leading-4`}>{m.text}</div>)}</div><div className="flex gap-2 border-t border-slate-200 p-3"><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send()}} className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] outline-none focus:border-cyan-400" placeholder="Write a message..."/><button onClick={send} className="rounded-xl bg-slate-950 px-3 text-[10px] font-semibold text-white"><Send className="h-3.5 w-3.5"/></button></div></DemoCard></div>;
  }

  const perms=[['assessments','Assessments'],['monitoring','Daily monitoring'],['progress','Progress'],['wearables','Wearables'],['regulation','Self-regulation']] as const;
  return <div><ScreenTitle eyebrow="Privacy & Sharing" title="What your clinician can see" secondary="Reset" onSecondary={()=>setSharing({assessments:true,monitoring:false,progress:true,wearables:false,regulation:true})}/><DemoCard className="p-4" highlight><div className="space-y-2.5">{perms.map(([key,label])=>{const enabled=sharing[key];return <div key={key} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><button onClick={()=>setSharing(c=>({...c,[key]:!enabled}))} className="text-left"><p className="text-[11px] font-semibold text-slate-800">{label}</p><p className="mt-0.5 text-[9px] text-slate-400">Separate permission · {enabled?"shared":"private"}</p></button><DemoToggle enabled={enabled} onToggle={()=>setSharing(c=>({...c,[key]:!enabled}))}/></div>})}</div></DemoCard></div>;
}

function ResearchDemo({ slideId }: { slideId: string }) {
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [selectedStep, setSelectedStep] = useState("Measures");
  const [studyFilter, setStudyFilter] = useState<"All" | "Active" | "Draft">("All");
  const [selectedStudy, setSelectedStudy] = useState("Sleep & Attention");
  const [builderMeasures, setBuilderMeasures] = useState({ pss: true, image: true, rt: false });
  const [builderTitle, setBuilderTitle] = useState("Sleep & Attention");
  const [questionnaireCategory, setQuestionnaireCategory] = useState("All");
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState("General Self-Efficacy Scale");
  const [customItem, setCustomItem] = useState("Image choice");
  const [customOption, setCustomOption] = useState("A");
  const [scheduleEnabled, setScheduleEnabled] = useState({ morning: true, afternoon: true, evening: true });
  const [selectedParticipant, setSelectedParticipant] = useState("PL-1042");
  const [followupActive, setFollowupActive] = useState({ baseline: true, day7: true, day30: false });
  const [dataTab, setDataTab] = useState<"Overview" | "Responses" | "Uploads">("Overview");
  const [exportDataset, setExportDataset] = useState("Analysis wide");
  const [exportFormat, setExportFormat] = useState("XLSX");
  const [includeCodebook, setIncludeCodebook] = useState(true);

  const studies=[
    {name:"Sleep & Attention",status:"Active",people:42,progress:74},
    {name:"Social Cognition Pilot",status:"Active",people:31,progress:65},
    {name:"EMA Mood Study",status:"Draft",people:0,progress:46},
    {name:"Hazard Awareness",status:"Active",people:55,progress:82},
  ].filter(s=>studyFilter==="All"||s.status===studyFilter);

  if (slideId === "studies") {
    return <div><ScreenTitle eyebrow="Research workspace" title="Studies" action="New study" onAction={()=>setNotice("A new draft study was created in demo mode.")} secondary="Refresh" onSecondary={()=>setNotice("Study list refreshed with dummy data.")}/>{notice&&<DemoNotice text={notice}/>}<div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><MiniStat label="Active studies" value="4" helper="2 collecting today"/><MiniStat label="Participants" value="128" helper="across live studies"/><MiniStat label="Due today" value="7" helper="follow-ups + EMA"/></div><div className="my-3 flex flex-wrap gap-2">{(["All","Active","Draft"] as const).map(f=><button key={f} onClick={()=>setStudyFilter(f)} className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold ${studyFilter===f?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{f}</button>)}</div><div className="grid gap-3 sm:grid-cols-2">{studies.map((study,index)=><button key={study.name} onClick={()=>setSelectedStudy(study.name)} className="text-left"><DemoCard className="p-4" highlight={selectedStudy===study.name}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{study.name}</p><p className="mt-1 text-[9px] text-slate-400">{study.people} participants · updated {index+1}h ago</p></div><span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${study.status==="Active"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{study.status}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-600" style={{width:`${study.progress}%`}}/></div></DemoCard></button>)}</div></div>;
  }

  if (slideId === "study-builder") {
    const steps=["Study info","Consent","Measures","Ambulatory","Follow-ups","Launch"];
    const measureRows=[['pss','Perceived Stress Scale'],['image','Custom Image Choice'],['rt','Reaction-time task']] as const;
    return <div><ScreenTitle eyebrow="Study Builder" title={builderTitle} action="Save draft" onAction={()=>setNotice("Draft saved locally in demo mode.")} secondary="Preview participant flow" onSecondary={()=>setNotice("Participant preview opened in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[.7fr_1.3fr]"><DemoCard className="p-3"><div className="space-y-1.5">{steps.map((step,index)=><button key={step} onClick={()=>setSelectedStep(step)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold ${selectedStep===step?"bg-cyan-50 text-cyan-800":"text-slate-600 hover:bg-slate-50"}`}><span>{index+1}. {step}</span><ChevronRight className="h-3 w-3"/></button>)}</div></DemoCard><DemoCard className="p-4" highlight><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-800">{selectedStep}</p><h4 className="mt-1 text-sm font-semibold text-slate-900">Configure {selectedStep.toLowerCase()}</h4>{selectedStep==="Study info"?<div className="mt-4 space-y-3"><label className="block text-[9px] font-semibold text-slate-500">Study title<input value={builderTitle} onChange={e=>setBuilderTitle(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] outline-none focus:border-cyan-400"/></label><label className="block text-[9px] font-semibold text-slate-500">Short description<textarea className="mt-1 h-24 w-full resize-none rounded-xl border border-slate-200 p-3 text-[10px] outline-none" defaultValue="Study attention, sleep and daily cognitive performance."/></label></div>:selectedStep==="Measures"?<div className="mt-4 space-y-2">{measureRows.map(([key,name])=>{const enabled=builderMeasures[key];return <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-medium text-slate-700">{name}</p><p className="mt-0.5 text-[8px] text-slate-400">Baseline measure</p></div><DemoToggle enabled={enabled} onToggle={()=>setBuilderMeasures(c=>({...c,[key]:!enabled}))}/></div>})}<button onClick={()=>setNotice("Measure picker opened in demo mode.")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-2.5 text-[9px] font-semibold text-slate-500"><Plus className="h-3 w-3"/> Add measure</button></div>:<div className="mt-4 space-y-3"><div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[10px] text-slate-600">Interactive {selectedStep.toLowerCase()} settings would appear here. Try the controls below.</div><div className="flex gap-2"><button onClick={()=>setNotice(`${selectedStep} settings updated.`)} className="rounded-lg bg-slate-950 px-3 py-2 text-[9px] font-semibold text-white">Configure</button><button onClick={()=>setNotice(`${selectedStep} preview opened.`)} className="rounded-lg border border-slate-200 px-3 py-2 text-[9px] font-semibold text-slate-600">Preview</button></div></div>}</DemoCard></div></div>;
  }

  if (slideId === "questionnaires") {
    const qs=[{name:"General Self-Efficacy Scale",cat:"Self-efficacy",items:10},{name:"WHO-5 Well-Being",cat:"Well-being",items:5},{name:"Perceived Stress Scale",cat:"Stress",items:10},{name:"UCLA Loneliness Scale",cat:"Social",items:20}].filter(item=>(questionnaireCategory==="All"||item.cat===questionnaireCategory)&&item.name.toLowerCase().includes(query.toLowerCase()));
    return <div><ScreenTitle eyebrow="Questionnaire Library" title="Measures" action="New custom questionnaire" onAction={()=>setNotice("Custom questionnaire builder opened in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<div className="mb-3 flex flex-wrap gap-2"><div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><Search className="h-3.5 w-3.5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="flex-1 text-[10px] outline-none" placeholder="Search questionnaires..."/></div>{["All","Self-efficacy","Well-being","Stress","Social"].map(c=><button key={c} onClick={()=>setQuestionnaireCategory(c)} className={`rounded-xl px-3 py-2 text-[9px] font-semibold ${questionnaireCategory===c?"bg-cyan-50 text-cyan-800":"border border-slate-200 bg-white text-slate-500"}`}>{c}</button>)}</div><div className="grid gap-3 sm:grid-cols-2">{qs.map((q,index)=><DemoCard key={q.name} className="p-4" highlight={selectedQuestionnaire===q.name||index===0}><button onClick={()=>setSelectedQuestionnaire(q.name)} className="w-full text-left"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{q.name}</p><p className="mt-1 text-[9px] text-slate-500">{q.cat} · {q.items} items · resources available</p></div><MoreHorizontal className="h-4 w-4 text-slate-300"/></div></button><div className="mt-3 flex gap-2"><button onClick={()=>{setSelectedQuestionnaire(q.name);setNotice(`${q.name} detail opened.`)}} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] font-semibold text-slate-600">Open</button><button onClick={()=>setNotice(`${q.name} added to Sleep & Attention.`)} className="rounded-lg bg-cyan-700 px-2 py-1.5 text-[8px] font-semibold text-white">Use in study</button></div></DemoCard>)}</div></div>;
  }

  if (slideId === "custom-questionnaires") {
    const types=["Intro text","Single choice","Multiple choice","Image choice","Slider","Free text","Matrix"];
    return <div><ScreenTitle eyebrow="Custom Questionnaire" title="Image preference task" action="Preview" onAction={()=>setNotice("Participant preview opened in demo mode.")} secondary="Save" onSecondary={()=>setNotice("Custom questionnaire saved in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<DemoCard className="p-4" highlight><div className="grid gap-3 lg:grid-cols-[.72fr_1.28fr]"><div><p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Items</p><div className="space-y-2">{types.map(item=><button key={item} onClick={()=>setCustomItem(item)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[10px] font-medium ${customItem===item?"border-cyan-300 bg-cyan-50 text-cyan-800":"border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}><span>{item}</span><ChevronRight className="h-3 w-3"/></button>)}</div></div><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[.12em] text-cyan-800">Live preview</p><p className="mt-1 text-[11px] font-semibold text-slate-800">{customItem}</p></div><span className="rounded-full bg-white px-2 py-1 text-[8px] text-slate-500">Required</span></div>{customItem==="Image choice"?<><p className="mt-4 text-[10px] font-semibold text-slate-800">Which image do you prefer?</p><div className="mt-3 grid grid-cols-2 gap-2">{['A','B'].map(opt=><button key={opt} onClick={()=>setCustomOption(opt)} className={`rounded-xl border bg-white p-3 text-left ${customOption===opt?"border-cyan-400 ring-2 ring-cyan-100":"border-slate-200"}`}><div className={`h-24 rounded-lg ${opt==='A'?"bg-gradient-to-br from-cyan-100 to-slate-100":"bg-gradient-to-br from-amber-100 to-slate-100"}`}/><p className="mt-2 text-[9px] font-medium text-slate-600">Option {opt}</p></button>)}</div></>:<div className="mt-4 space-y-3"><input className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px]" defaultValue="Edit the item prompt here..."/><div className="h-24 rounded-xl border border-dashed border-slate-300 bg-white"/></div>}</div></div></DemoCard></div>;
  }

  if (slideId === "ambulatory") {
    const rows=[['morning','09:00','Morning'],['afternoon','14:00','Afternoon'],['evening','20:00','Evening']] as const;
    return <div><ScreenTitle eyebrow="Ambulatory Assessment" title="Daily emotion protocol" action="Add check-in" onAction={()=>setNotice("A new schedule editor opened in demo mode.")} secondary="Preview day" onSecondary={()=>setNotice("Participant day preview opened.")}/>{notice&&<DemoNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[1.05fr_.95fr]"><DemoCard className="p-4" highlight><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Schedules</p><span className="text-[9px] text-slate-400">3 configured</span></div><div className="mt-3 space-y-2">{rows.map(([key,time,label])=>{const enabled=scheduleEnabled[key];return <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">{time} · {label}</p><p className="mt-0.5 text-[8px] text-slate-400">Fixed time · email reminder</p></div><DemoToggle enabled={enabled} onToggle={()=>setScheduleEnabled(c=>({...c,[key]:!enabled}))}/></div>})}</div></DemoCard><DemoCard className="p-4"><p className="text-xs font-semibold text-slate-900">Questionnaire flow</p><div className="mt-3 space-y-2">{["Mood rating","Stress slider","Current context","If stress ≥ 7 → follow-up"].map((item,index)=><button key={item} onClick={()=>setNotice(`${item} selected in the demo protocol.`)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-[10px] text-slate-600 hover:bg-slate-50"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-50 text-[8px] font-semibold text-cyan-700">{index+1}</span>{item}</button>)}</div></DemoCard></div></div>;
  }

  if (slideId === "participants") {
    const rows=[["PL-1042","Active","Complete","Due","2h ago"],["PL-1043","Active","Complete","Complete","1d ago"],["PL-1044","Invited","Pending","—","3d ago"],["PL-1045","Active","Complete","Due","5h ago"]];
    const selected=rows.find(r=>r[0]===selectedParticipant)!;
    return <div><ScreenTitle eyebrow="Participants" title="Study participants" action="Create participant link" onAction={()=>setNotice("A TEST participant link was generated in demo mode.")} secondary="Refresh" onSecondary={()=>setNotice("Participant table refreshed.")}/>{notice&&<DemoNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[1.35fr_.65fr]"><DemoCard className="overflow-hidden" highlight><div className="grid grid-cols-5 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400"><span>ID</span><span>Status</span><span>Baseline</span><span>Follow-up</span><span>Last activity</span></div>{rows.map(row=><button key={row[0]} onClick={()=>setSelectedParticipant(row[0])} className={`grid w-full grid-cols-5 border-t border-slate-200 px-4 py-3 text-left text-[9px] ${selectedParticipant===row[0]?"bg-cyan-50 text-cyan-900":"text-slate-600 hover:bg-slate-50"}`}>{row.map((cell, cellIndex)=><span key={`${row[0]}-${cellIndex}-${cell}`}>{cell}</span>)}</button>)}</DemoCard><DemoCard className="p-4"><p className="text-xs font-semibold text-slate-900">{selected[0]}</p><p className="mt-1 text-[9px] text-slate-400">Participant detail</p><div className="mt-3 space-y-2"><MiniStat label="Status" value={selected[1]}/><button onClick={()=>setNotice("Participant response summary opened.")} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-semibold text-slate-600">View responses</button><button onClick={()=>setNotice("Uploaded file preview opened in demo mode.")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[9px] font-semibold text-slate-600"><Eye className="h-3 w-3"/> View uploaded file</button></div></DemoCard></div></div>;
  }

  if (slideId === "followups") {
    const waves=[['baseline','Baseline','Complete','128 participants'],['day7','Day 7','Sending','93 invited'],['day30','Day 30','Scheduled','Starts 18 Sep']] as const;
    return <div><ScreenTitle eyebrow="Follow-up Manager" title="Longitudinal waves" action="Add wave" onAction={()=>setNotice("Follow-up wave editor opened in demo mode.")} secondary="Send due invitations" onSecondary={()=>setNotice("Due invitations queued in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<div className="space-y-3">{waves.map(([key,name,status,helper],index)=>{const active=followupActive[key];return <DemoCard key={key} className="p-4" highlight={index===1}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[9px] text-slate-400">{helper}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500">{status}</span><DemoToggle enabled={active} onToggle={()=>setFollowupActive(c=>({...c,[key]:!active}))}/><button onClick={()=>setNotice(`${name} settings opened.`)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] font-semibold text-slate-600">Manage</button></div></div></DemoCard>})}</div></div>;
  }

  if (slideId === "data") {
    return <div><ScreenTitle eyebrow="Research Data" title="Sleep & Attention" action="Refresh data" onAction={()=>setNotice("Data bundle refreshed in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<div className="mb-3 flex gap-2">{(["Overview","Responses","Uploads"] as const).map(tab=><button key={tab} onClick={()=>setDataTab(tab)} className={`rounded-xl px-3 py-2 text-[9px] font-semibold ${dataTab===tab?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{tab}</button>)}</div>{dataTab==="Overview"?<div className="grid gap-3 sm:grid-cols-3"><MiniStat label="Participants" value="128" helper="112 completed baseline"/><MiniStat label="Responses" value="1,842" helper="questionnaire items"/><MiniStat label="Uploads" value="37" helper="participant files"/></div>:dataTab==="Uploads"?<DemoCard className="overflow-hidden" highlight><div className="grid grid-cols-4 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold text-slate-400"><span>Participant</span><span>File</span><span>Type</span><span>Action</span></div>{[["PL-1042","drawing.png","PNG"],["PL-1043","voice-note.m4a","Audio"],["PL-1045","task-photo.jpg","JPG"]].map(r=><div key={r[1]} className="grid grid-cols-4 border-t border-slate-200 px-4 py-3 text-[9px] text-slate-600"><span>{r[0]}</span><span>{r[1]}</span><span>{r[2]}</span><button onClick={()=>setNotice(`${r[1]} opened in demo preview.`)} className="text-left font-semibold text-cyan-700">View</button></div>)}</DemoCard>:<DemoCard className="overflow-hidden" highlight><div className="grid grid-cols-4 bg-slate-50 px-4 py-2.5 text-[8px] font-semibold text-slate-400"><span>Participant</span><span>Measure</span><span>Phase</span><span>Complete</span></div>{[["PL-1042","PSS-10","Baseline","Yes"],["PL-1043","WHO-5","Day 7","Yes"],["PL-1044","Image task","Baseline","Pending"]].map(r=><button key={r.join('-')} onClick={()=>setNotice(`${r[0]} ${r[1]} response opened.`)} className="grid w-full grid-cols-4 border-t border-slate-200 px-4 py-3 text-left text-[9px] text-slate-600 hover:bg-slate-50">{r.map((c, cellIndex)=><span key={`${r[0]}-${cellIndex}-${c}`}>{c}</span>)}</button>)}</DemoCard>}</div>;
  }

  return <div><ScreenTitle eyebrow="Export Data" title="Prepare analysis dataset" action="Export now" onAction={()=>setNotice(`${exportFormat} export prepared for ${exportDataset}.`)} secondary="Reset" onSecondary={()=>{setExportDataset("Analysis wide");setExportFormat("XLSX");setIncludeCodebook(true)}}/>{notice&&<DemoNotice text={notice}/>}<div className="grid gap-3 lg:grid-cols-[.9fr_1.1fr]"><DemoCard className="p-4" highlight><p className="text-xs font-semibold text-slate-900">Dataset</p><div className="mt-3 space-y-2">{["Analysis wide","Participant summary","Questionnaire responses","Ambulatory responses"].map(x=><button key={x} onClick={()=>setExportDataset(x)} className={`w-full rounded-xl border px-3 py-2.5 text-left text-[10px] font-medium ${exportDataset===x?"border-cyan-300 bg-cyan-50 text-cyan-800":"border-slate-200 text-slate-600"}`}>{x}</button>)}</div><p className="mt-4 text-xs font-semibold text-slate-900">Format</p><div className="mt-2 flex gap-2">{["XLSX","CSV","JSON"].map(x=><button key={x} onClick={()=>setExportFormat(x)} className={`rounded-lg px-3 py-2 text-[9px] font-semibold ${exportFormat===x?"bg-slate-950 text-white":"border border-slate-200 text-slate-500"}`}>{x}</button>)}</div><div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><div><p className="text-[10px] font-semibold text-slate-700">Include codebook</p><p className="text-[8px] text-slate-400">Recommended for analysis handoff</p></div><DemoToggle enabled={includeCodebook} onToggle={()=>setIncludeCodebook(v=>!v)}/></div></DemoCard><DemoCard className="p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">Export preview</p><span className="rounded-full bg-cyan-50 px-2 py-1 text-[8px] font-semibold text-cyan-700">{exportFormat}</span></div><div className="mt-3 rounded-xl bg-slate-950 p-3 font-mono text-[8px] leading-4 text-cyan-100">participant_id, phase, PSS_1, PSS_2, image_choice<br/>PL-1042, baseline, 2, 3, option_a<br/>PL-1043, baseline, 4, 2, option_b</div><button onClick={()=>setNotice(`${exportFormat} demo download prepared.`)} className="mt-3 flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-[9px] font-semibold text-white"><FileDown className="h-3 w-3"/> Export {exportFormat}</button></DemoCard></div></div>;
}

function ClinicalDemo({ slideId }: { slideId: string }) {
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState("Aarav S.");
  const [assigned, setAssigned] = useState<string[]>(["Perceived Stress Scale"]);
  const [monitorRange, setMonitorRange] = useState<"7d" | "30d">("7d");
  const [progressMetric, setProgressMetric] = useState<"Well-being" | "Stress">("Well-being");
  const [pathwayDone, setPathwayDone] = useState([true, true, false, false]);

  // Professional Notes demo state — mirrors ClinicalNotesWorkspace locally.
  const clinicalEditorRef = useRef<HTMLDivElement | null>(null);
  const [clinicalFolders, setClinicalFolders] = useState([
    { id: "sessions", name: "Sessions" },
    { id: "formulation", name: "Formulation" },
    { id: "reviews", name: "Reviews" },
  ]);
  const [clinicalNotes, setClinicalNotes] = useState([
    {
      id: "note-1",
      title: "Presentation anxiety · follow-up",
      content:
        "<p>Client reported improved confidence after using the grounding routine before the presentation.</p><p>Reviewed anticipatory thoughts and agreed to repeat the routine before the next high-pressure task.</p>",
      text:
        "Client reported improved confidence after using the grounding routine before the presentation. Reviewed anticipatory thoughts and agreed to repeat the routine before the next high-pressure task.",
      folderId: "sessions",
      type: "session",
      pinned: true,
      updated: "Today, 14:20",
      session: "2026-08-19T10:30",
    },
    {
      id: "note-2",
      title: "Working formulation",
      content:
        "<p>Current formulation emphasises performance-related threat appraisal, avoidance and post-event rumination.</p>",
      text:
        "Current formulation emphasises performance-related threat appraisal, avoidance and post-event rumination.",
      folderId: "formulation",
      type: "formulation",
      pinned: false,
      updated: "18 Aug",
      session: "2026-08-18T16:00",
    },
    {
      id: "note-3",
      title: "Four-week review",
      content:
        "<p>Monitoring adherence remains high. Sleep regularity has improved and self-rated stress has reduced across the last two weeks.</p>",
      text:
        "Monitoring adherence remains high. Sleep regularity has improved and self-rated stress has reduced across the last two weeks.",
      folderId: "reviews",
      type: "review",
      pinned: false,
      updated: "14 Aug",
      session: "2026-08-14T09:00",
    },
    {
      id: "note-4",
      title: "Initial session",
      content:
        "<p>Established goals for monitoring and discussed privacy boundaries inside PsyLattice.</p>",
      text:
        "Established goals for monitoring and discussed privacy boundaries inside PsyLattice.",
      folderId: null,
      type: "session",
      pinned: false,
      updated: "04 Aug",
      session: "2026-08-04T11:00",
    },
  ].map((note) => ({ ...note, folderId: note.folderId ?? null })));
  const [clinicalSelectedFolder, setClinicalSelectedFolder] = useState("all");
  const [clinicalSelectedNoteId, setClinicalSelectedNoteId] = useState("note-1");
  const [clinicalNoteSearch, setClinicalNoteSearch] = useState("");
  const [clinicalNewFolderName, setClinicalNewFolderName] = useState("");
  const [clinicalNoteTitle, setClinicalNoteTitle] = useState("Presentation anxiety · follow-up");
  const [clinicalNoteFolderId, setClinicalNoteFolderId] = useState<string | null>("sessions");
  const [clinicalNoteType, setClinicalNoteType] = useState("session");
  const [clinicalSessionAt, setClinicalSessionAt] = useState("2026-08-19T10:30");
  const [clinicalPinned, setClinicalPinned] = useState(true);
  const [clinicalEditorHtml, setClinicalEditorHtml] = useState(
    "<p>Client reported improved confidence after using the grounding routine before the presentation.</p><p>Reviewed anticipatory thoughts and agreed to repeat the routine before the next high-pressure task.</p>"
  );
  const [clinicalNoteDirty, setClinicalNoteDirty] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState("10:30 Maya R.");

  // Secure Messages demo state — mirrors PsyLatticeMessagesWorkspace locally.
  const [messageThreadPanelOpen, setMessageThreadPanelOpen] = useState(true);
  const [messageEmailAlerts, setMessageEmailAlerts] = useState(true);
  const [selectedMessageThreadId, setSelectedMessageThreadId] = useState("aarav");
  const [messageDraft, setMessageDraft] = useState("");
  const [messageThreads, setMessageThreads] = useState([
    {
      id: "aarav",
      peer: "Aarav S.",
      unread: 2,
      last: "I completed the evening monitoring yesterday.",
      time: "14:12",
    },
    {
      id: "maya",
      peer: "Maya R.",
      unread: 0,
      last: "Thank you, Friday works for me.",
      time: "11:03",
    },
    {
      id: "nisha",
      peer: "Nisha K.",
      unread: 1,
      last: "Could we review the questionnaire next session?",
      time: "Yesterday",
    },
  ]);
  const [threadMessages, setThreadMessages] = useState<Record<string, Array<{
    id: string;
    body: string;
    isMine: boolean;
    time: string;
    read?: boolean;
  }>>>({
    aarav: [
      { id: "a1", body: "Hi, I wanted to let you know that I used the grounding routine before the presentation.", isMine: false, time: "10:24" },
      { id: "a2", body: "That sounds useful. How did it feel compared with the previous presentation?", isMine: true, time: "10:31", read: true },
      { id: "a3", body: "Much better. I was still nervous, but I did not avoid it.", isMine: false, time: "10:36" },
      { id: "a4", body: "I completed the evening monitoring yesterday.", isMine: false, time: "14:12" },
    ],
    maya: [
      { id: "m1", body: "Would Friday at 10:30 still work for our appointment?", isMine: true, time: "09:48", read: true },
      { id: "m2", body: "Thank you, Friday works for me.", isMine: false, time: "11:03" },
    ],
    nisha: [
      { id: "n1", body: "Could we review the questionnaire next session?", isMine: false, time: "Yesterday" },
    ],
  });

  const [reception, setReception] = useState({ calendar:true, reschedule:true, assessments:false, notes:false, monitoring:false });

  const clients=["Aarav S.","Maya R.","Nisha K.","Rohan D."].filter(n=>n.toLowerCase().includes(query.toLowerCase()));

  const filteredClinicalNotes = clinicalNotes.filter((note) => {
    const inFolder =
      clinicalSelectedFolder === "all" ||
      (clinicalSelectedFolder === "unfiled" && !note.folderId) ||
      note.folderId === clinicalSelectedFolder;
    const q = clinicalNoteSearch.trim().toLowerCase();
    return (
      inFolder &&
      (!q ||
        note.title.toLowerCase().includes(q) ||
        note.text.toLowerCase().includes(q))
    );
  });

  function openClinicalNote(noteId: string) {
    const next = clinicalNotes.find((note) => note.id === noteId);
    if (!next) return;
    setClinicalSelectedNoteId(next.id);
    setClinicalNoteTitle(next.title);
    setClinicalNoteFolderId(next.folderId);
    setClinicalNoteType(next.type);
    setClinicalSessionAt(next.session);
    setClinicalPinned(next.pinned);
    setClinicalEditorHtml(next.content);
    setClinicalNoteDirty(false);
  }

  function createClinicalNote() {
    const id = `note-${Date.now()}`;
    const note = {
      id,
      title: "Untitled note",
      content: "",
      text: "",
      folderId:
        clinicalSelectedFolder !== "all" &&
        clinicalSelectedFolder !== "unfiled"
          ? clinicalSelectedFolder
          : null,
      type: "session",
      pinned: false,
      updated: "Just now",
      session: "2026-08-19T15:00",
    };
    setClinicalNotes((current) => [note, ...current]);
    setClinicalSelectedNoteId(id);
    setClinicalNoteTitle(note.title);
    setClinicalNoteFolderId(note.folderId);
    setClinicalNoteType(note.type);
    setClinicalSessionAt(note.session);
    setClinicalPinned(false);
    setClinicalEditorHtml("");
    setClinicalNoteDirty(true);
  }

  function saveClinicalNote() {
    const textValue =
      clinicalEditorRef.current?.innerText?.trim() ||
      clinicalEditorHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const htmlValue =
      clinicalEditorRef.current?.innerHTML ?? clinicalEditorHtml;

    setClinicalNotes((current) =>
      current.map((item) =>
        item.id === clinicalSelectedNoteId
          ? {
              ...item,
              title: clinicalNoteTitle || "Untitled note",
              content: htmlValue,
              text: textValue,
              folderId: clinicalNoteFolderId,
              type: clinicalNoteType,
              session: clinicalSessionAt,
              pinned: clinicalPinned,
              updated: "Just now",
            }
          : item
      )
    );
    setClinicalEditorHtml(htmlValue);
    setClinicalNoteDirty(false);
    setNotice("Professional note saved in demo mode.");
  }

  function deleteClinicalNote() {
    const remaining = clinicalNotes.filter(
      (item) => item.id !== clinicalSelectedNoteId
    );
    setClinicalNotes(remaining);
    if (remaining[0]) {
      openClinicalNote(remaining[0].id);
    }
    setNotice("Professional note deleted in demo mode.");
  }

  function createClinicalFolder() {
    const name = clinicalNewFolderName.trim();
    if (!name) return;
    const id = `folder-${Date.now()}`;
    setClinicalFolders((current) => [...current, { id, name }]);
    setClinicalSelectedFolder(id);
    setClinicalNewFolderName("");
  }

  function clinicalExec(command: string, value?: string) {
    clinicalEditorRef.current?.focus();
    try {
      document.execCommand(command, false, value);
      setClinicalNoteDirty(true);
    } catch {
      setNotice(`${command} formatting previewed in demo mode.`);
    }
  }

  function messageInitials(name: string) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function sendClinicalMessage() {
    const body = messageDraft.trim();
    if (!body) return;
    const id = `msg-${Date.now()}`;
    setThreadMessages((current) => ({
      ...current,
      [selectedMessageThreadId]: [
        ...(current[selectedMessageThreadId] || []),
        { id, body, isMine: true, time: "Now", read: false },
      ],
    }));
    setMessageThreads((current) =>
      current.map((thread) =>
        thread.id === selectedMessageThreadId
          ? { ...thread, last: body, time: "Now", unread: 0 }
          : thread
      )
    );
    setMessageDraft("");
  }


  if (slideId === "clients") {
    return <div><ScreenTitle eyebrow="Clinical workspace" title="Clients" action="Invite client" onAction={()=>setNotice("Client invitation form opened in demo mode.")} secondary="Refresh" onSecondary={()=>setNotice("Client list refreshed.")}/>{notice&&<DemoNotice text={notice}/>}<div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><MiniStat label="Connected" value="18"/><MiniStat label="Needs review" value="4"/><MiniStat label="Today" value="6 appts"/></div><div className="my-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><Search className="h-3.5 w-3.5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="flex-1 text-[10px] outline-none" placeholder="Search clients..."/><Filter className="h-3.5 w-3.5 text-slate-400"/></div><div className="grid gap-3 sm:grid-cols-2">{clients.map((name,index)=><button key={name} onClick={()=>setSelectedClient(name)} className="text-left"><DemoCard className="p-4" highlight={selectedClient===name}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-800"><Users className="h-4 w-4"/></div><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[9px] text-slate-400">Connected · updated {index+1}h ago</p></div></div><ChevronRight className="h-4 w-4 text-slate-300"/></div></DemoCard></button>)}</div></div>;
  }

  if (slideId === "client-overview") {
    return <div><ScreenTitle eyebrow="Client overview" title={selectedClient} action="Message" onAction={()=>setNotice("Secure message composer opened in demo mode.")} secondary="Appointment" onSecondary={()=>setNotice("Appointment request opened.")}/>{notice&&<DemoNotice text={notice}/>}<div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><MiniStat label="Assessments" value="4"/><MiniStat label="Monitoring" value="Active"/><MiniStat label="Next appt" value="Fri 10:00"/></div><div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_.8fr]"><DemoCard className="p-4" highlight><p className="text-xs font-semibold text-slate-900">Recent shared activity</p><div className="mt-3 space-y-2">{["Mood check-in completed","PSS-10 shared","Progress permission updated"].map(item=><button key={item} onClick={()=>setNotice(`${item} detail opened.`)} className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left text-[10px] text-slate-600 hover:bg-slate-100">{item}</button>)}</div></DemoCard><DemoCard className="p-4"><p className="text-xs font-semibold text-slate-900">Client permissions</p><div className="mt-3 space-y-2 text-[9px] text-slate-500"><p>✓ Assessments</p><p>✓ Monitoring</p><p>✓ Progress</p><p className="text-slate-300">– AI Guide</p></div><button onClick={()=>setNotice("Permission detail opened in demo mode.")} className="mt-3 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">View permissions</button></DemoCard></div></div>;
  }

  if (slideId === "assessments") {
    const measures=["Perceived Stress Scale","WHO-5 Well-Being","General Self-Efficacy Scale","Sleep Quality Check"];
    return <div><ScreenTitle eyebrow="Assessments" title={selectedClient} action="Assign measure" onAction={()=>setNotice("Measure picker opened in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<div className="space-y-3">{measures.map((name,index)=>{const isAssigned=assigned.includes(name);return <DemoCard key={name} className="p-4" highlight={index===0}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-900">{name}</p><p className="mt-1 text-[9px] text-slate-400">{isAssigned?"Assigned · completed 1 week ago":"Available to assign"}</p></div><div className="flex gap-2"><button onClick={()=>setNotice(`${name} result opened.`)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[8px] font-semibold text-slate-600">Review</button><button onClick={()=>setAssigned(c=>isAssigned?c.filter(x=>x!==name):[...c,name])} className={`rounded-lg px-2.5 py-1.5 text-[8px] font-semibold ${isAssigned?"bg-emerald-50 text-emerald-700":"bg-slate-950 text-white"}`}>{isAssigned?"Assigned":"Assign"}</button></div></div></DemoCard>})}</div></div>;
  }

  if (slideId === "monitoring") {
    const values=monitorRange==="7d"?[42,68,55,80,61,73,66]:[35,48,52,60,55,72,64,70,78,68,72,75];
    return <div><ScreenTitle eyebrow="Monitoring" title="Shared daily data" action="Propose protocol" onAction={()=>setNotice("Protocol proposal builder opened in demo mode.")} secondary="Request sharing" onSecondary={()=>setNotice("Sharing request opened.")}/>{notice&&<DemoNotice text={notice}/>}<div className="mb-3 flex gap-2">{(["7d","30d"] as const).map(r=><button key={r} onClick={()=>setMonitorRange(r)} className={`rounded-lg px-3 py-1.5 text-[9px] font-semibold ${monitorRange===r?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{r}</button>)}</div><DemoCard className="p-4" highlight><div className="flex h-40 items-end gap-2 rounded-xl bg-slate-50 p-4">{values.map((height,index)=><button key={index} onClick={()=>setNotice(`Check-in ${index+1}: stress ${(height/15).toFixed(1)} in demo data.`)} className="flex-1 rounded-t-md bg-cyan-300 transition hover:bg-cyan-400" style={{height:`${height}px`}}/>)}</div><div className="mt-3 grid grid-cols-3 gap-2"><MiniStat label="Check-ins" value="19"/><MiniStat label="Completion" value="95%"/><MiniStat label="Stress avg" value="4.1"/></div></DemoCard></div>;
  }

  if (slideId === "progress") {
    const isWell=progressMetric==="Well-being"; const vals=isWell?[48,50,57,61,66,71]:[82,75,70,64,58,52];
    return <div><ScreenTitle eyebrow="Progress" title="Longitudinal view"/><div className="mb-3 flex gap-2">{(["Well-being","Stress"] as const).map(x=><button key={x} onClick={()=>setProgressMetric(x)} className={`rounded-xl px-3 py-2 text-[9px] font-semibold ${progressMetric===x?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-500"}`}>{x}</button>)}</div><DemoCard className="p-4" highlight><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-900">{progressMetric}</p><span className={`text-[10px] font-semibold ${isWell?"text-emerald-700":"text-cyan-700"}`}>{isWell?"Improving":"Decreasing"}</span></div><div className="mt-4 flex h-36 items-end gap-2 rounded-xl bg-slate-50 p-4">{vals.map((h,i)=><div key={i} className={`flex-1 rounded-t-md ${isWell?"bg-emerald-200":"bg-cyan-200"}`} style={{height:`${h}px`}}/>)}</div></DemoCard></div>;
  }

  if (slideId === "care-pathway") {
    const items=["Stabilise sleep routine","Practice pre-presentation grounding","Review monitoring data","Reassess after 4 weeks"];
    return <div><ScreenTitle eyebrow="Care Pathway" title="Current plan" action="Add step" onAction={()=>setNotice("Care-pathway step editor opened.")}/>{notice&&<DemoNotice text={notice}/>}<div className="space-y-3">{items.map((item,index)=>{const done=pathwayDone[index];return <DemoCard key={item} className="p-4" highlight={index===1}><button onClick={()=>setPathwayDone(c=>c.map((x,i)=>i===index?!x:x))} className="flex w-full items-center gap-3 text-left"><div className={`flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold ${done?"bg-cyan-700 text-white":"bg-slate-100 text-slate-500"}`}>{done?<Check className="h-3.5 w-3.5"/>:index+1}</div><div className="flex-1"><p className="text-[10px] font-medium text-slate-700">{item}</p><p className="mt-0.5 text-[8px] text-slate-400">{done?"Completed":"Planned"}</p></div></button></DemoCard>})}</div></div>;
  }

  if (slideId === "notes") {
    const selectedNote =
      clinicalNotes.find((item) => item.id === clinicalSelectedNoteId) || null;
    const editorWordCount =
      (clinicalEditorRef.current?.innerText || clinicalEditorHtml.replace(/<[^>]*>/g, " "))
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

    return (
      <div className="space-y-5">
        {notice && <DemoNotice text={notice} />}

        <DemoCard className="overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-950">
              {selectedClient} · Professional Notes
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Private clinician-authored documentation for the selected client.
              Organise notes into folders and edit them with the rich-text workspace below.
            </p>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Client
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {selectedClient}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Record type
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                Private professional notes
              </p>
            </div>

            <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">
                Sharing
              </p>
              <p className="mt-2 text-sm font-semibold text-cyan-950">
                Not shared with client
              </p>
            </div>
          </div>
        </DemoCard>

        <div className="grid min-h-[720px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:grid-cols-[230px_300px_minmax(0,1fr)]">
          {/* FOLDERS */}
          <aside className="border-b border-slate-200 bg-slate-50/70 p-4 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Folders</p>
                <p className="mt-1 text-[11px] text-slate-400">{selectedClient}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  document.getElementById("demo-clinical-note-folder")?.focus()
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600"
                title="New folder"
              >
                +
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <button
                type="button"
                onClick={() => setClinicalSelectedFolder("all")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${
                  clinicalSelectedFolder === "all"
                    ? "bg-cyan-50 font-semibold text-cyan-950"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <span>All notes</span>
                <span className="text-xs text-slate-400">{clinicalNotes.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setClinicalSelectedFolder("unfiled")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${
                  clinicalSelectedFolder === "unfiled"
                    ? "bg-cyan-50 font-semibold text-cyan-950"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                <span>Unfiled</span>
                <span className="text-xs text-slate-400">
                  {clinicalNotes.filter((note) => !note.folderId).length}
                </span>
              </button>

              {clinicalFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={`group flex items-center rounded-xl ${
                    clinicalSelectedFolder === folder.id
                      ? "bg-cyan-50"
                      : "hover:bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setClinicalSelectedFolder(folder.id)}
                    className={`min-w-0 flex-1 px-3 py-2.5 text-left text-sm ${
                      clinicalSelectedFolder === folder.id
                        ? "font-semibold text-cyan-950"
                        : "text-slate-600"
                    }`}
                  >
                    <span className="block truncate">{folder.name}</span>
                  </button>
                  <span className="mr-3 text-[10px] text-slate-400">
                    {clinicalNotes.filter((note) => note.folderId === folder.id).length}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <input
                id="demo-clinical-note-folder"
                value={clinicalNewFolderName}
                onChange={(event) => setClinicalNewFolderName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") createClinicalFolder();
                }}
                placeholder="New folder name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-cyan-700"
              />

              <button
                type="button"
                disabled={!clinicalNewFolderName.trim()}
                onClick={createClinicalFolder}
                className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Create folder
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
              <p className="text-[11px] font-semibold text-cyan-950">
                Private clinician record
              </p>
              <p className="mt-1 text-[10px] leading-4 text-cyan-900/70">
                Professional Notes are clinician-authored and are not exposed through the client sharing controls.
              </p>
            </div>
          </aside>

          {/* NOTE LIST */}
          <section className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-2">
              <input
                value={clinicalNoteSearch}
                onChange={(event) => setClinicalNoteSearch(event.target.value)}
                placeholder="Search notes..."
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-cyan-700"
              />

              <button
                type="button"
                onClick={createClinicalNote}
                className="shrink-0 rounded-xl bg-cyan-800 px-3 py-2.5 text-xs font-semibold text-white"
              >
                + Note
              </button>
            </div>

            <div className="mt-4 max-h-[650px] space-y-2 overflow-y-auto pr-1">
              {filteredClinicalNotes.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No notes here yet
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Create a note or choose another folder.
                  </p>
                </div>
              ) : (
                filteredClinicalNotes.map((noteItem) => {
                  const folder = clinicalFolders.find(
                    (candidate) => candidate.id === noteItem.folderId
                  );

                  return (
                    <button
                      key={noteItem.id}
                      type="button"
                      onClick={() => openClinicalNote(noteItem.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        noteItem.id === clinicalSelectedNoteId
                          ? "border-cyan-300 bg-cyan-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                          {noteItem.title}
                        </p>
                        {noteItem.pinned && (
                          <span title="Pinned" className="text-xs text-amber-500">
                            ★
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                        {noteItem.text || "Empty note"}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">
                          {noteItem.type === "session"
                            ? "Session note"
                            : noteItem.type === "formulation"
                              ? "Formulation"
                              : "Review"}
                        </span>
                        {folder && (
                          <span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-medium text-cyan-700">
                            {folder.name}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-[9px] text-slate-400">
                        Updated {noteItem.updated}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* EDITOR */}
          <main className="min-w-0">
            {!selectedNote ? (
              <div className="flex min-h-[720px] items-center justify-center p-8">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-lg font-semibold text-cyan-800">
                    N
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-900">
                    Start a professional note
                  </p>
                  <button
                    type="button"
                    onClick={createClinicalNote}
                    className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Create first note
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[720px] flex-col">
                <div className="border-b border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <input
                        value={clinicalNoteTitle}
                        onChange={(event) => {
                          setClinicalNoteTitle(event.target.value);
                          setClinicalNoteDirty(true);
                        }}
                        placeholder="Note title"
                        className="w-full border-0 bg-transparent text-xl font-semibold text-slate-950 outline-none"
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <select
                          value={clinicalNoteFolderId || ""}
                          onChange={(event) => {
                            setClinicalNoteFolderId(event.target.value || null);
                            setClinicalNoteDirty(true);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600"
                        >
                          <option value="">Unfiled</option>
                          {clinicalFolders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={clinicalNoteType}
                          onChange={(event) => {
                            setClinicalNoteType(event.target.value);
                            setClinicalNoteDirty(true);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600"
                        >
                          <option value="session">Session note</option>
                          <option value="formulation">Formulation</option>
                          <option value="review">Review</option>
                        </select>

                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                          Session
                          <input
                            type="datetime-local"
                            value={clinicalSessionAt}
                            onChange={(event) => {
                              setClinicalSessionAt(event.target.value);
                              setClinicalNoteDirty(true);
                            }}
                            className="bg-transparent outline-none"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setClinicalPinned((current) => !current);
                          setClinicalNoteDirty(true);
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                          clinicalPinned
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 text-slate-500"
                        }`}
                      >
                        {clinicalPinned ? "★ Pinned" : "☆ Pin"}
                      </button>

                      <button
                        type="button"
                        onClick={saveClinicalNote}
                        disabled={!clinicalNoteDirty}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {clinicalNoteDirty ? "Save" : "Saved"}
                      </button>

                      <button
                        type="button"
                        onClick={deleteClinicalNote}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                    <span>{clinicalSessionAt.replace("T", " ")}</span>
                    <span>•</span>
                    <span>{editorWordCount} words</span>
                    <span>•</span>
                    <span>{clinicalNoteDirty ? "Unsaved changes" : "Saved"}</span>
                  </div>
                </div>

                {/* RICH TOOLBAR */}
                <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      defaultValue="Arial"
                      onChange={(event) => clinicalExec("fontName", event.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    >
                      {["Arial", "Georgia", "Times New Roman", "Verdana"].map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>

                    <select
                      defaultValue="3"
                      onChange={(event) => clinicalExec("fontSize", event.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    >
                      <option value="2">Small</option>
                      <option value="3">Normal</option>
                      <option value="4">Large</option>
                    </select>

                    <select
                      defaultValue="p"
                      onChange={(event) => clinicalExec("formatBlock", event.target.value)}
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    >
                      <option value="p">Normal</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                      <option value="blockquote">Quote</option>
                    </select>

                    <span className="mx-1 h-6 w-px bg-slate-200" />

                    {[
                      ["B", "bold", "font-black"],
                      ["I", "italic", "italic"],
                      ["U", "underline", "underline"],
                      ["S", "strikeThrough", "line-through"],
                    ].map(([label, command, style]) => (
                      <button
                        key={command}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          clinicalExec(command);
                        }}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 ${style}`}
                      >
                        {label}
                      </button>
                    ))}

                    <span className="mx-1 h-6 w-px bg-slate-200" />

                    {[
                      ["≡", "justifyLeft"],
                      ["≣", "justifyCenter"],
                      ["≡", "justifyRight"],
                      ["• List", "insertUnorderedList"],
                      ["1. List", "insertOrderedList"],
                      ["←", "outdent"],
                      ["→", "indent"],
                    ].map(([label, command], index) => (
                      <button
                        key={`${command}-${index}`}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          clinicalExec(command);
                        }}
                        className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setNotice("Link tool opened in demo mode.")}
                      className="flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Link
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 bg-slate-50/40 p-4 sm:p-6">
                  <div
                    key={clinicalSelectedNoteId}
                    ref={clinicalEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(event) => {
                      setClinicalEditorHtml(event.currentTarget.innerHTML);
                      setClinicalNoteDirty(true);
                    }}
                    dangerouslySetInnerHTML={{ __html: clinicalEditorHtml }}
                    data-placeholder="Start writing your professional note..."
                    className="mx-auto min-h-[560px] max-w-[900px] rounded-2xl border border-slate-200 bg-white px-8 py-9 text-[15px] leading-7 text-slate-800 shadow-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  if (slideId === "appointments") {
    const appts=["09:00 Aarav S.","10:30 Maya R.","13:00 Nisha K.","16:00 Rohan D."];
    return <div><ScreenTitle eyebrow="Appointments" title="Today" action="New appointment" onAction={()=>setNotice("New appointment form opened in demo mode.")} secondary="Calendar" onSecondary={()=>setNotice("Calendar view opened.")}/>{notice&&<DemoNotice text={notice}/>}<div className="space-y-2">{appts.map((item,index)=><button key={item} onClick={()=>setSelectedAppointment(item)} className="block w-full text-left"><DemoCard className="flex items-center justify-between p-4" highlight={selectedAppointment===item}><div><span className="text-[10px] font-semibold text-slate-700">{item}</span><p className="mt-1 text-[8px] text-slate-400">50 minute session · Milan time</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-semibold text-slate-500">Confirmed</span><ChevronRight className="h-3.5 w-3.5 text-slate-300"/></div></DemoCard></button>)}</div></div>;
  }

  if (slideId === "messages") {
    const selectedThread =
      messageThreads.find((thread) => thread.id === selectedMessageThreadId) ||
      messageThreads[0];
    const activeMessages = threadMessages[selectedThread?.id] || [];
    const unreadTotal = messageThreads.reduce(
      (sum, thread) => sum + thread.unread,
      0
    );

    return (
      <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="bg-gradient-to-r from-cyan-50/70 via-white to-white px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-800">
              Connected care
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Client conversations
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              View all active client conversations in one secure inbox. Select a
              client inside the messaging workspace instead of changing the
              Clinical client-context selector.
            </p>
          </div>
        </section>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-cyan-50/80 via-white to-slate-50/60 px-5 py-4">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-sm">
                  ✦
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-950">
                      Secure Messages
                    </h2>
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                      Live
                    </span>
                    {unreadTotal > 0 && (
                      <span className="rounded-full bg-cyan-800 px-2.5 py-1 text-[10px] font-semibold text-white">
                        {unreadTotal} unread
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your secure client inbox for non-urgent clinical communication.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMessageThreadPanelOpen((current) => !current)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {messageThreadPanelOpen ? "⇤ Focus conversation" : "☰ Clients"}
                </button>

                <button
                  type="button"
                  onClick={() => setMessageEmailAlerts((current) => !current)}
                  className={`rounded-xl border px-3 py-2 text-[10px] font-semibold transition ${
                    messageEmailAlerts
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {messageEmailAlerts ? "✉ Email alerts on" : "✉ Email alerts off"}
                </button>

                <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-800">
                  Not for urgent or emergency support
                </div>
              </div>
            </div>
          </div>

          <div
            className={`grid min-h-[680px] ${
              messageThreadPanelOpen
                ? "lg:grid-cols-[290px_minmax(0,1fr)]"
                : "grid-cols-1"
            }`}
          >
            {messageThreadPanelOpen && (
              <aside className="border-b border-slate-100 bg-slate-50/55 lg:border-b-0 lg:border-r">
                <div className="border-b border-slate-100 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Client conversations
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose a connected client to open their secure conversation.
                  </p>
                </div>

                <div className="max-h-[590px] space-y-2 overflow-y-auto p-3">
                  {messageThreads.map((thread) => {
                    const selected = thread.id === selectedMessageThreadId;
                    return (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => {
                          setSelectedMessageThreadId(thread.id);
                          setMessageThreads((current) =>
                            current.map((item) =>
                              item.id === thread.id
                                ? { ...item, unread: 0 }
                                : item
                            )
                          );
                        }}
                        className={`w-full rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-cyan-200 bg-cyan-50 shadow-sm"
                            : "border-transparent bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                            {messageInitials(thread.peer)}
                            {thread.unread > 0 && (
                              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-cyan-700 px-1 text-[9px] font-semibold text-white">
                                {thread.unread}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {thread.peer}
                              </p>
                              <span className="shrink-0 text-[9px] text-slate-400">
                                {thread.time}
                              </span>
                            </div>
                            <p
                              className={`mt-1 truncate text-[11px] ${
                                thread.unread > 0
                                  ? "font-semibold text-slate-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {thread.last}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            <section className="flex min-w-0 flex-col bg-white">
              {selectedThread && (
                <>
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-sm font-semibold text-cyan-900">
                        {messageInitials(selectedThread.peer)}
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {selectedThread.peer}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Connected through PsyLattice · New messages appear automatically
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-[10px] leading-4 text-cyan-900">
                      Messaging does not change your assessment or monitoring sharing permissions.
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto bg-[linear-gradient(to_bottom,#ffffff,#fbfdfe)] px-4 py-5 sm:px-6">
                      <div className="mx-auto max-w-3xl space-y-2">
                        <div className="my-5 flex items-center gap-3">
                          <div className="h-px flex-1 bg-slate-100" />
                          <span className="rounded-full border border-slate-100 bg-white px-3 py-1 text-[10px] font-medium text-slate-400">
                            Today
                          </span>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>

                        {activeMessages.map((messageItem, index) => {
                          const previous = activeMessages[index - 1];
                          const previousSameSender =
                            previous && previous.isMine === messageItem.isMine;

                          return (
                            <div
                              key={messageItem.id}
                              className={`flex ${
                                messageItem.isMine ? "justify-end" : "justify-start"
                              } ${previousSameSender ? "mt-1" : "mt-3"}`}
                            >
                              <div
                                className={`max-w-[86%] sm:max-w-[72%] ${
                                  messageItem.isMine ? "items-end" : "items-start"
                                } flex flex-col`}
                              >
                                <div
                                  className={`whitespace-pre-wrap break-words px-4 py-3 text-sm leading-6 ${
                                    messageItem.isMine
                                      ? "rounded-[20px] rounded-br-md bg-slate-950 text-white shadow-sm"
                                      : "rounded-[20px] rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.4)]"
                                  }`}
                                >
                                  {messageItem.body}
                                </div>

                                <div className="mt-1 flex items-center gap-1.5 px-1 text-[9px] text-slate-400">
                                  <span>{messageItem.time}</span>
                                  {messageItem.isMine && (
                                    <>
                                      <span>·</span>
                                      <span>{messageItem.read ? "Read" : "Sent"}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 bg-white p-4 sm:p-5">
                      <div className="mx-auto max-w-3xl">
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50/60 p-2 transition focus-within:border-cyan-300 focus-within:bg-white focus-within:shadow-[0_14px_34px_-24px_rgba(8,145,178,0.35)]">
                          <textarea
                            value={messageDraft}
                            onChange={(event) =>
                              setMessageDraft(event.target.value.slice(0, 4000))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                sendClinicalMessage();
                              }
                            }}
                            rows={2}
                            placeholder={`Message ${selectedThread.peer}…`}
                            className="max-h-36 min-h-[58px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                          />

                          <div className="flex flex-col justify-between gap-2 border-t border-slate-200/70 px-2 pt-2 sm:flex-row sm:items-center">
                            <span className="text-[10px] text-slate-400">
                              Enter to send · Shift + Enter for a new line
                            </span>

                            <button
                              type="button"
                              disabled={!messageDraft.trim()}
                              onClick={sendClinicalMessage}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Send message <span aria-hidden="true">↗</span>
                            </button>
                          </div>
                        </div>

                        <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                          Keep urgent or emergency concerns outside this asynchronous messaging channel and use the appropriate local emergency or crisis service.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  }

  const perms=[['calendar','View appointment calendar'],['reschedule','Create / reschedule appointments'],['assessments','View assessments'],['notes','View professional notes'],['monitoring','View client monitoring']] as const;
  return <div><ScreenTitle eyebrow="Receptionist Access" title="Appointment-only permissions" action="Save permissions" onAction={()=>setNotice("Receptionist permissions saved in demo mode.")}/>{notice&&<DemoNotice text={notice}/>}<DemoCard className="p-4" highlight><div className="space-y-2">{perms.map(([key,label])=>{const enabled=reception[key];return <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3"><div><p className="text-[10px] font-medium text-slate-700">{label}</p><p className="mt-0.5 text-[8px] text-slate-400">{enabled?"Allowed":"Blocked"}</p></div><DemoToggle enabled={enabled} onToggle={()=>setReception(c=>({...c,[key]:!enabled}))}/></div>})}</div></DemoCard></div>;
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const groups = workspace === "researcher"
    ? [
        { label: "Research", ids: ["studies", "study-builder", "questionnaires", "custom-questionnaires", "ambulatory", "followups", "participants"] },
        { label: "Data", ids: ["data", "export"] },
      ]
    : workspace === "self"
      ? [
          { label: "Personal", ids: ["dashboard", "ai", "assessments", "monitoring", "regulation", "progress"] },
          { label: "Connected", ids: ["wearables", "appointments", "messages", "privacy"] },
        ]
      : [
          { label: "Clinical", ids: ["clients", "client-overview", "assessments", "monitoring", "progress", "care-pathway"] },
          { label: "Practice", ids: ["notes", "appointments", "messages", "receptionist"] },
        ];

  return (
    <div className="flex h-full min-h-[720px] overflow-hidden rounded-xl border border-slate-200 bg-[#f6f8f8] text-slate-950 shadow-sm">
      {sidebarOpen && (
        <aside className="w-[220px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4">
            <div className="min-w-0">
              <PsyLatticeLogo size={34} />
              <p className="mt-1 pl-[46px] text-[9px] font-medium text-slate-400">
                {config.shortLabel} workspace
              </p>
            </div>
          </div>

          <div className="p-3">
            {groups.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="mb-2 px-2 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>
                <div className="space-y-1">
                  {group.ids.map((id) => {
                    const slide = config.slides.find((item) => item.id === id);
                    if (!slide) return null;
                    const active = slide.id === activeSlideId;
                    return <button key={slide.id} type="button" onClick={() => onNavigate(slide.id)} className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-[9px] font-medium transition ${active ? "bg-cyan-50 text-cyan-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><span className={active ? "text-cyan-700" : "text-slate-400"}>{navIcons[slide.id] ?? <ChevronRight className="h-3.5 w-3.5" />}</span><span className="truncate">{slide.title}</span></button>;
                  })}
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3">
              <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-800">Interactive demo</p>
              <p className="mt-1 text-[8px] leading-4 text-cyan-900/70">Dummy data only. Explore freely — nothing here changes your real account.</p>
            </div>
          </div>
        </aside>
      )}

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Toggle sidebar"><LayoutDashboard className="h-3.5 w-3.5" /></button>
            <div><p className="text-[10px] font-semibold text-slate-800">{config.label}</p><p className="text-[8px] text-slate-400">Interactive onboarding preview</p></div>
          </div>
          <div className="relative flex items-center gap-2">
            <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-800">Demo</span>
            <button onClick={() => setWorkspaceMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 hover:bg-slate-50"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-600">PD</div><ChevronDown className="h-3 w-3 text-slate-400" /></button>
            {workspaceMenuOpen && <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><p className="px-2 py-1 text-[8px] font-semibold uppercase tracking-[.12em] text-slate-400">Demo account</p>{["Workspace selector","Profile","Notifications"].map(x=><button key={x} onClick={()=>setWorkspaceMenuOpen(false)} className="block w-full rounded-lg px-2 py-2 text-left text-[9px] text-slate-600 hover:bg-slate-50">{x}</button>)}</div>}
          </div>
        </div>

        <div className="h-[calc(100%-56px)] overflow-y-auto overscroll-contain p-4 pb-36 sm:p-5 sm:pb-40 lg:p-6 lg:pb-44">
          <div className="mx-auto max-w-[1050px]">
            {workspace === "self" && <SelfDemo slideId={activeSlideId} />}
            {workspace === "researcher" && <ResearchDemo slideId={activeSlideId} />}
            {workspace === "clinician" && <ClinicalDemo slideId={activeSlideId} />}
          </div>
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

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
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
              <button type="button" disabled={saving} onClick={() => void completeTour()} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40">
                Skip tour
              </button>
            )}
            <button type="button" onClick={() => router.push("/workspace")} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
              Workspaces
            </button>
          </div>
        </div>
        <div className="h-[3px] bg-slate-100">
          <div className="h-full bg-cyan-700 transition-[width] duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 lg:px-9 lg:py-7">
        {error && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
        )}

        <div key={slide.id} className="psylattice-tour-in relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between border-b border-slate-300 bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-3 shadow-[inset_0_-1px_0_rgba(148,163,184,0.16)] sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full border border-red-500/20 bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full border border-amber-500/20 bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full border border-emerald-600/20 bg-emerald-400" />
              </div>
              <div className="hidden min-w-0 rounded-lg border border-slate-300/80 bg-white/85 px-4 py-1.5 text-[10px] font-medium text-slate-500 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] sm:block sm:w-72">
                psylattice.com
              </div>
            </div>

            <button type="button" onClick={() => setFocusOpen(true)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50">
              Focus
            </button>
          </div>

          <div className="relative isolate h-[clamp(720px,82dvh,980px)] overflow-hidden bg-[#eef2f3] p-3 sm:p-5">
            <MockWorkspace workspace={workspace} config={config} activeSlideId={slide.id} onNavigate={navigateBySlideId} />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#eef2f3] via-[#eef2f3]/60 to-transparent" />

            {/* Floating guide card restored: this was the preferred interaction. */}
            <article className="psylattice-card-in absolute bottom-5 left-5 right-5 z-[80] rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-[0_22px_70px_rgba(2,6,23,0.38)] ring-1 ring-white/[0.04] sm:left-auto sm:w-[390px] lg:bottom-7 lg:right-7 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">{slide.eyebrow}</p>
                  <h1 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl">{slide.title}</h1>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[10px] font-semibold text-slate-300">{currentIndex + 1}/{config.slides.length}</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">{slide.description}</p>

              <div className="mt-4 rounded-xl border border-cyan-700/40 bg-cyan-950/40 px-3 py-2.5 text-[10px] leading-5 text-cyan-100">
                Try the demo: use the mini workspace sidebar or interact with the highlighted controls.
              </div>

              {slide.note && <p className="mt-4 border-l-2 border-cyan-500/70 pl-3 text-[11px] leading-5 text-slate-400">{slide.note}</p>}

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <button type="button" disabled={saving || isFirst} onClick={() => void savePosition(currentIndex - 1)} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-25">
                  ← Back
                </button>

                {!isLast ? (
                  <button type="button" disabled={saving} onClick={() => void savePosition(currentIndex + 1)} className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-50">
                    {saving ? "Saving..." : "Next →"}
                  </button>
                ) : (
                  <button type="button" disabled={saving} onClick={() => void completeTour()} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50">
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
          <div className="flex h-[95dvh] w-full max-w-[1800px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-800">Interactive demo</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{slide.title}</p>
              </div>
              <button type="button" onClick={() => setFocusOpen(false)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Close ✕</button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-[#eef2f3] p-3 sm:p-5">
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
