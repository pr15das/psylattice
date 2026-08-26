"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CircleHelp,
  FlaskConical,
  Keyboard,
  Layers3,
  Lightbulb,
  Link2,
  MousePointerClick,
  Play,
  Rows3,
  Sparkles,
  Target,
  TimerReset,
  type LucideIcon,
} from "lucide-react";

type GuideKey = "start" | "builder" | "responses" | "stroop" | "pilots";

type Guide = {
  id: GuideKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  minutes: string;
};

const guides: Guide[] = [
  {
    id: "start",
    title: "How Cognitive Lab works",
    subtitle: "See the complete path from template to research data.",
    icon: BrainCircuit,
    minutes: "2 min",
  },
  {
    id: "builder",
    title: "Understand the Task Builder",
    subtitle: "Blocks, trials, steps and the trial table — visually.",
    icon: Layers3,
    minutes: "3 min",
  },
  {
    id: "responses",
    title: "Set up participant responses",
    subtitle: "Keys, buttons, correct answers and reaction time.",
    icon: Keyboard,
    minutes: "3 min",
  },
  {
    id: "stroop",
    title: "Example: build a Stroop task",
    subtitle: "A complete example you can copy and adapt.",
    icon: Target,
    minutes: "5 min",
  },
  {
    id: "pilots",
    title: "Preview and pilot your task",
    subtitle: "Test timing and usability before study deployment.",
    icon: Play,
    minutes: "2 min",
  },
];

function MiniBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-cyan-200 bg-white px-2.5 py-1 shadow-[0_4px_12px_rgba(8,145,178,0.07)] text-[10px] font-semibold text-cyan-800">
      {children}
    </span>
  );
}

function GuideHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function VisualCard({
  number,
  title,
  text,
  children,
}: {
  number: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-300/70 bg-white shadow-[0_2px_6px_rgba(15,23,42,0.04),0_14px_34px_rgba(15,23,42,0.075)]">
      {children && (
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-cyan-50/50 p-4 sm:p-5">
          {children}
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-semibold text-white">
            {number}
          </span>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">{text}</p>
      </div>
    </article>
  );
}

function WorkflowIllustration() {
  const steps = [
    ["1", "Template", "Pick a task family"],
    ["2", "Build", "Edit the exact task"],
    ["3", "Preview", "Run it yourself"],
    ["4", "Pilot", "Test with others"],
    ["5", "Study", "Deploy the locked version"],
  ];

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-slate-300/70 bg-white p-5 text-slate-950 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_14px_34px_rgba(15,23,42,0.075)] sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative grid gap-3 md:grid-cols-5">
        {steps.map(([number, label, copy], index) => (
          <div key={label} className="relative">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/10 text-xs font-semibold text-cyan-200">
                {number}
              </span>
              <p className="mt-4 text-sm font-semibold">{label}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">{copy}</p>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-cyan-700 md:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BuilderIllustration() {
  return (
    <div className="rounded-[24px] border border-slate-300/70 bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,0.055)] sm:p-4">
      <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Task Builder</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-900">Emotional Stroop</p>
          </div>
          <div className="rounded-full bg-slate-950 px-3 py-1.5 text-[9px] font-semibold text-white">Save</div>
        </div>
        <div className="grid min-h-[260px] md:grid-cols-[.75fr_1.4fr_.9fr]">
          <div className="border-r border-slate-100 bg-slate-50 p-3">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">Blocks</p>
            {["Instructions", "Practice", "Main block", "End"].map((item, index) => (
              <div
                key={item}
                className={`mt-2 rounded-xl border p-2.5 ${
                  index === 2 ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-[9px] font-semibold text-slate-800">{item}</p>
                {index > 0 && index < 3 && <p className="mt-1 text-[8px] text-slate-400">Trials repeat here</p>}
              </div>
            ))}
          </div>

          <div className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">Trial timeline</p>
              <div className="rounded-lg border border-slate-200 px-2 py-1 text-[8px] font-semibold text-slate-600">+ Add step</div>
            </div>
            <div className="mt-3 space-y-2">
              {[
                ["Fixation", "+", "500 ms"],
                ["Text stimulus", "RED", "until response"],
                ["Response", "R  G  B  Y", "1500 ms"],
                ["ITI", "…", "500–1000 ms"],
              ].map(([name, visual, timing], index) => (
                <div key={name} className="relative flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[9px] font-semibold text-white">
                    {visual}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold text-slate-800">{name}</p>
                    <p className="mt-0.5 text-[8px] text-slate-400">{timing}</p>
                  </div>
                  <span className="text-[8px] font-semibold text-slate-300">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-l border-slate-100 bg-slate-50 p-3">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">Settings</p>
            <div className="mt-3 rounded-xl border border-cyan-200 bg-white p-3">
              <p className="text-[9px] font-semibold text-slate-800">Response</p>
              <p className="mt-2 text-[8px] text-slate-400">Input method</p>
              <div className="mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[8px] font-semibold text-slate-700">Keyboard</div>
              <p className="mt-3 text-[8px] text-slate-400">Keys</p>
              <div className="mt-1 flex gap-1">
                {["R", "G", "B", "Y"].map((key) => (
                  <span key={key} className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[8px] font-semibold text-slate-700">
                    {key}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResponseIllustration() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-[24px] border border-slate-300/70 bg-white p-5 text-slate-950 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_14px_34px_rgba(15,23,42,0.075)]">
        <div className="flex items-center justify-between">
          <MiniBadge>Participant sees</MiniBadge>
          <TimerReset className="h-4 w-4 text-cyan-700" />
        </div>
        <div className="mt-8 flex min-h-28 items-center justify-center">
          <span className="text-5xl font-black tracking-tight text-red-400">GREEN</span>
        </div>
        <p className="mt-5 text-center text-[11px] text-slate-400">Respond to the ink colour, not the word.</p>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,0.055)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Response mapping</p>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            ["R", "Red"],
            ["G", "Green"],
            ["B", "Blue"],
            ["Y", "Yellow"],
          ].map(([key, label]) => (
            <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-semibold text-slate-900 shadow-sm">
                {key}
              </div>
              <p className="mt-2 text-[9px] font-semibold text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-cyan-900">Correct answer = R</p>
            <p className="mt-0.5 text-[9px] text-cyan-700">The trial table provides the correct key for this trial.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialTableIllustration() {
  const rows = [
    ["RED", "red", "congruent", "R"],
    ["GREEN", "green", "congruent", "G"],
    ["RED", "green", "incongruent", "G"],
    ["GREEN", "red", "incongruent", "R"],
  ];

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-300/70 bg-white shadow-[0_5px_18px_rgba(15,23,42,0.055)]">
      <div className="grid grid-cols-4 bg-slate-950 px-3 py-2.5 text-[9px] font-semibold text-white">
        <span>word</span>
        <span>colour</span>
        <span>condition</span>
        <span>correct</span>
      </div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 border-t border-slate-100 px-3 py-2.5 text-[9px] text-slate-600">
          {row.map((cell, index) => (
            <span key={`${cell}-${index}`} className={index === 3 ? "font-semibold text-cyan-700" : ""}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function PilotIllustration() {
  const cards = [
    ["Preview", "You run the task", "Check the task logic and experience"],
    ["Pilot link", "Share with testers", "Collect real timing and usability checks"],
    ["Review", "Inspect sessions", "Fix problems before final study use"],
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map(([title, subtitle, copy], index) => (
        <div key={title} className="relative rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.055)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            {index === 0 ? <Play className="h-4 w-4" /> : index === 1 ? <Link2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-[10px] font-semibold text-cyan-700">{subtitle}</p>
          <p className="mt-2 text-[10px] leading-5 text-slate-500">{copy}</p>
          {index < cards.length - 1 && (
            <ArrowRight className="absolute -right-2 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-slate-300 md:block" />
          )}
        </div>
      ))}
    </div>
  );
}

function StartGuide({ onOpen }: { onOpen: (guide: GuideKey) => void }) {
  return (
    <div className="space-y-6">
      <GuideHeader
        eyebrow="Visual guide · Start here"
        title="Cognitive Lab in one picture"
        description="You do not build a whole study here. Cognitive Lab creates reusable task definitions. You test them here, then later place a locked version inside a PsyLattice study."
      />
      <WorkflowIllustration />

      <div className="grid gap-4 lg:grid-cols-3">
        <VisualCard
          number="1"
          title="Choose a task family"
          text="Start from Stroop, Flanker, Go/No-Go, N-back, reaction time, or a blank task. The template gives you a structure to edit rather than starting from nothing."
        >
          <div className="grid grid-cols-3 gap-2">
            {[Target, BrainCircuit, TimerReset].map((Icon, index) => (
              <div key={index} className="flex h-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-cyan-700">
                <Icon className="h-5 w-5" />
              </div>
            ))}
          </div>
        </VisualCard>

        <VisualCard
          number="2"
          title="Build the exact trial"
          text="Arrange what happens inside a trial: fixation, stimulus, participant response and the pause before the next trial."
        >
          <div className="flex items-center justify-between gap-2">
            {["+", "RED", "R/G/B/Y", "…"].map((item, index) => (
              <div key={item} className="flex flex-1 items-center gap-2">
                <div className="flex h-14 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white text-[10px] font-semibold text-slate-800">
                  {item}
                </div>
                {index < 3 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />}
              </div>
            ))}
          </div>
        </VisualCard>

        <VisualCard
          number="3"
          title="Test before deployment"
          text="Preview it yourself, then create a pilot link. The final study should use a version you have already checked."
        >
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Play className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800">
              <Link2 className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800">
              <Check className="h-5 w-5" />
            </div>
          </div>
        </VisualCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onOpen("builder")}
          className="group flex items-center justify-between rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.055)] text-left transition hover:-translate-y-px hover:border-cyan-200 hover:bg-white hover:shadow-[0_6px_18px_rgba(8,145,178,0.08)]"
        >
          <div>
            <p className="text-xs font-semibold text-slate-950">Next: understand the builder</p>
            <p className="mt-1 text-[11px] text-slate-500">See blocks, trials, steps and the trial table visually.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-cyan-600" />
        </button>
        <button
          type="button"
          onClick={() => onOpen("stroop")}
          className="group flex items-center justify-between rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.055)] text-left transition hover:-translate-y-px hover:border-cyan-200 hover:bg-white hover:shadow-[0_6px_18px_rgba(8,145,178,0.08)]"
        >
          <div>
            <p className="text-xs font-semibold text-slate-950">See a complete example</p>
            <p className="mt-1 text-[11px] text-slate-500">Build a basic Stroop task from start to finish.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-cyan-600" />
        </button>
      </div>
    </div>
  );
}

function BuilderGuide({ onOpen }: { onOpen: (guide: GuideKey) => void }) {
  return (
    <div className="space-y-6">
      <GuideHeader
        eyebrow="Visual guide · Task Builder"
        title="Think in four layers"
        description="The Task Builder becomes much easier once you know which layer you are editing."
      />
      <BuilderIllustration />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {([
          ["1", "Task", "The reusable cognitive task as a whole.", BrainCircuit],
          ["2", "Block", "A section such as practice or the main experiment.", Layers3],
          ["3", "Trial", "One repeated unit inside an experimental block.", Rows3],
          ["4", "Step", "What happens during the trial: stimulus, response, ITI, etc.", MousePointerClick],
        ] as Array<[string, string, string, LucideIcon]>).map(([number, title, copy, IconComponent]) => {
          return (
            <div key={title} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.055)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-cyan-700">{number}</span>
                <IconComponent className="h-4 w-4 text-slate-300" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-950">{title}</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{copy}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,0.055)]">
          <div className="flex items-center gap-2">
            <Rows3 className="h-4 w-4 text-cyan-700" />
            <h3 className="text-sm font-semibold text-slate-950">The trial table changes each repeated trial</h3>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            The timeline says what happens. The trial table says what values are used on each repetition.
          </p>
          <div className="mt-4">
            <TrialTableIllustration />
          </div>
        </div>

        <div className="rounded-[24px] border border-cyan-200/80 bg-cyan-50/55 shadow-[0_6px_18px_rgba(8,145,178,0.07)] p-5">
          <Lightbulb className="h-5 w-5 text-cyan-700" />
          <p className="mt-4 text-sm font-semibold text-cyan-950">A useful mental model</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-white/80 p-3">
              <p className="text-[10px] font-semibold text-cyan-900">Timeline</p>
              <p className="mt-1 text-[11px] text-cyan-800/70">“Show a word, then wait for a key press.”</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3">
              <p className="text-[10px] font-semibold text-cyan-900">Trial table</p>
              <p className="mt-1 text-[11px] text-cyan-800/70">“This time the word is RED, the ink is green, and G is correct.”</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpen("responses")}
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-cyan-800"
          >
            Next: configure responses <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ResponsesGuide({ onOpen }: { onOpen: (guide: GuideKey) => void }) {
  return (
    <div className="space-y-6">
      <GuideHeader
        eyebrow="Visual guide · Responses"
        title="Four decisions define a response"
        description="For most tasks, you only need to decide how the person responds, which responses are allowed, where the correct answer comes from, and when reaction time starts."
      />
      <ResponseIllustration />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {([
          [Keyboard, "Input method", "Keyboard, on-screen buttons, mouse/click, or no response."],
          [MousePointerClick, "Allowed responses", "The exact keys or choices the participant may use."],
          [Check, "Correct answer", "Usually read from a trial-table column such as correct."],
          [TimerReset, "RT starts from", "Usually the stimulus onset that the participant reacts to."],
        ] as Array<[LucideIcon, string, string]>).map(([IconComponent, title, copy]) => {
          return (
            <div key={title} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.055)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                <IconComponent className="h-4 w-4" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-950">{title}</p>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{copy}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,0.055)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Example configuration</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            ["Respond with", "Keyboard"],
            ["Keys", "R · G · B · Y"],
            ["Correct answer", "Trial column: correct"],
            ["RT starts", "Text stimulus"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
              <p className="mt-2 text-[11px] font-semibold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-[11px] text-cyan-800">
          <Check className="h-4 w-4 shrink-0" />
          For the example trial above, green ink means the correct key is G even when the word itself says RED.
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen("stroop")}
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(15,23,42,0.16),0_12px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-px"
      >
        See the complete Stroop example <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function StroopGuide({ onOpen }: { onOpen: (guide: GuideKey) => void }) {
  return (
    <div className="space-y-6">
      <GuideHeader
        eyebrow="Task playbook · Stroop"
        title="Build a basic colour-word Stroop"
        description="This example shows one clear implementation pattern. You can change timings, stimuli, blocks and responses to match your approved protocol."
      />

      <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[26px] border border-slate-300/70 bg-white p-6 text-slate-950 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_14px_34px_rgba(15,23,42,0.075)]">
          <div className="flex items-center justify-between">
            <MiniBadge>What the participant does</MiniBadge>
            <Target className="h-5 w-5 text-cyan-700" />
          </div>
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Congruent</p>
              <p className="mt-3 text-4xl font-black text-red-400">RED</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Incongruent</p>
              <p className="mt-3 text-4xl font-black text-green-400">RED</p>
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">Respond to the ink colour as quickly and accurately as possible.</p>
        </div>

        <div className="rounded-[26px] border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_5px_18px_rgba(15,23,42,0.055)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Recommended structure for this example</p>
          <div className="mt-5 space-y-3">
            {[
              ["01", "Instructions", "Explain the colour-response mapping."],
              ["02", "Practice", "Use a short practice block with feedback."],
              ["03", "Main block", "Present congruent and incongruent trials."],
              ["04", "End", "Thank the participant / continue the study."],
            ].map(([number, title, copy]) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[10px] font-semibold text-cyan-700 shadow-sm">{number}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <VisualCard number="1" title="Create the trial timeline" text="This example presents a fixation, then the colour word, waits for the response, and inserts a short ITI before the next trial.">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              ["+", "Fixation", "500 ms"],
              ["RED", "Stimulus", "max 1500 ms"],
              ["R/G/B/Y", "Response", "ends trial"],
              ["…", "ITI", "500–1000 ms"],
            ].map(([visual, title, timing], index) => (
              <div key={title} className="flex min-w-[120px] flex-1 items-center gap-2">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-center">
                  <p className="text-sm font-semibold text-slate-900">{visual}</p>
                  <p className="mt-2 text-[9px] font-semibold text-slate-600">{title}</p>
                  <p className="mt-1 text-[8px] text-slate-400">{timing}</p>
                </div>
                {index < 3 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />}
              </div>
            ))}
          </div>
        </VisualCard>

        <VisualCard number="2" title="Fill the trial table" text="Each row becomes a trial. The variables can be inserted into the stimulus using placeholders such as {{word}} and {{colour}}.">
          <TrialTableIllustration />
        </VisualCard>

        <VisualCard number="3" title="Map the response keys" text="For this example, R means red, G green, B blue and Y yellow. PsyLattice compares the pressed key against the correct column for that trial.">
          <div className="grid grid-cols-4 gap-2">
            {[
              ["R", "red"],
              ["G", "green"],
              ["B", "blue"],
              ["Y", "yellow"],
            ].map(([key, colour]) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-semibold text-white">{key}</div>
                <p className="mt-2 text-[9px] font-semibold text-slate-500">{colour}</p>
              </div>
            ))}
          </div>
        </VisualCard>

        <VisualCard number="4" title="Preview, then pilot" text="Check that the right colours, response keys and timing behave as expected. Then share a pilot link before using the task in a final study.">
          <PilotIllustration />
        </VisualCard>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.055)] p-5">
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Use the task name as a template label, not a validity guarantee</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              If you change timings, stimuli, response mappings or scoring, you are creating a particular implementation. Your thesis or study protocol should document the exact version and justify the design you use.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen("pilots")}
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_4px_10px_rgba(15,23,42,0.16),0_12px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-px"
      >
        Next: preview and pilot <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PilotsGuide() {
  return (
    <div className="space-y-6">
      <GuideHeader
        eyebrow="Visual guide · Preview & pilot"
        title="Test the task before it reaches a study"
        description="Preview is for your own checks. Pilot Sessions are for testing the task with other people while keeping those runs separate from final study participation."
      />
      <PilotIllustration />

      <div className="grid gap-4 lg:grid-cols-3">
        <VisualCard number="1" title="Preview yourself" text="Confirm the task starts, stimuli appear correctly, responses work and the result summary is sensible.">
          <div className="flex min-h-28 items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 text-white">
            <Play className="h-8 w-8 text-cyan-700" />
          </div>
        </VisualCard>
        <VisualCard number="2" title="Create a pilot link" text="Share the public link with testers. Pilot runs remain separate from study data.">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-[9px] text-slate-500">psylattice.com/cognitive/pilot/••••••••</div>
            <div className="mt-2 flex gap-2">
              <div className="flex-1 rounded-lg bg-slate-950 px-2 py-1.5 text-center text-[8px] font-semibold text-white">Copy link</div>
              <div className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-[8px] font-semibold text-slate-600">Test</div>
            </div>
          </div>
        </VisualCard>
        <VisualCard number="3" title="Review before deployment" text="Use pilot completion and timing checks to decide whether you need to adjust the task before locking it for a study.">
          <div className="grid grid-cols-3 gap-2">
            {["Runs", "RT", "Quality"].map((label, index) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                <p className="text-base font-semibold text-slate-900">{index === 0 ? "8" : index === 1 ? "612" : "✓"}</p>
                <p className="mt-1 text-[8px] font-semibold text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </VisualCard>
      </div>

      <div className="rounded-[24px] border border-cyan-200/80 bg-cyan-50/55 shadow-[0_6px_18px_rgba(8,145,178,0.07)] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
          <div>
            <p className="text-sm font-semibold text-cyan-950">From task design to study deployment</p>
            <p className="mt-2 text-xs leading-5 text-cyan-900/70">
              Once a task has been previewed and piloted, mark that exact version Ready for studies. It then appears in Study Builder, where you can add it more than once and position each administration in Study flow. Participant runs use the pinned version, so later edits do not silently change an active protocol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CognitiveLearningHub() {
  const [guide, setGuide] = useState<GuideKey>("start");
  const activeGuide = guides.find((item) => item.id === guide) || guides[0];
  const ActiveGuideIcon = activeGuide.icon;

  function renderGuide() {
    switch (guide) {
      case "builder":
        return <BuilderGuide onOpen={setGuide} />;
      case "responses":
        return <ResponsesGuide onOpen={setGuide} />;
      case "stroop":
        return <StroopGuide onOpen={setGuide} />;
      case "pilots":
        return <PilotsGuide />;
      case "start":
      default:
        return <StartGuide onOpen={setGuide} />;
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-[.72fr_1.28fr]">
          <div className="border-b border-slate-200 bg-white p-6 text-slate-950 lg:border-b-0 lg:border-r sm:p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-800 shadow-[0_5px_16px_rgba(8,145,178,0.08)]">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-700">Cognitive Lab guides</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Learn by seeing how the task works.</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
              Short visual explanations, illustrated configurations and complete task examples — built directly into PsyLattice.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <MiniBadge>No screenshots</MiniBadge>
              <MiniBadge>Visual examples</MiniBadge>
              <MiniBadge>Research workflow</MiniBadge>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
            {guides.map((item) => {
              const Icon = item.icon;
              const active = item.id === guide;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGuide(item.id)}
                  className={`group rounded-[20px] border p-4 text-left transition ${
                    active
                      ? "border-cyan-200 bg-white shadow-[0_6px_18px_rgba(8,145,178,0.10)]"
                      : "border-slate-200 bg-white hover:-translate-y-px hover:border-cyan-200 hover:bg-white hover:shadow-[0_6px_18px_rgba(8,145,178,0.08)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${active ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-600"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400">{item.minutes}</span>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1.5 text-[10px] leading-5 text-slate-500">{item.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="rounded-[28px] border border-slate-200 bg-[#fbfcfc] p-4 sm:p-6 lg:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm">
              <ActiveGuideIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Currently viewing</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">{activeGuide.title}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500">
            <FlaskConical className="h-3.5 w-3.5 text-cyan-600" />
            Cognitive Lab manual · Phase 1
          </div>
        </div>

        {renderGuide()}
      </div>
    </div>
  );
}
