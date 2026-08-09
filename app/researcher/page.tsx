"use client";

import Link from "next/link";
import { useState } from "react";

type Screen =
  | "dashboard"
  | "studies"
  | "builder"
  | "library"
  | "ambulatory"
  | "participants"
  | "links"
  | "data"
  | "explorer"
  | "exports"
  | "ethics"
  | "team";

const navigation: {
  id: Screen;
  label: string;
  group: "Research" | "Data" | "Governance";
}[] = [
  { id: "dashboard", label: "Dashboard", group: "Research" },
  { id: "studies", label: "Studies", group: "Research" },
  { id: "builder", label: "Study Builder", group: "Research" },
  { id: "library", label: "Questionnaire Library", group: "Research" },
  { id: "ambulatory", label: "Ambulatory Assessment", group: "Research" },
  { id: "participants", label: "Participants", group: "Research" },
  { id: "links", label: "Participant Links", group: "Research" },

  { id: "data", label: "Data Dashboard", group: "Data" },
  { id: "explorer", label: "Data Explorer", group: "Data" },
  { id: "exports", label: "Export Data", group: "Data" },

  { id: "ethics", label: "Ethics & Consent", group: "Governance" },
  { id: "team", label: "Team & Permissions", group: "Governance" },
];

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4 10h11M11 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4.5 10.5 8 14l7.5-8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>

        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function ProgressBar({
  label,
  value,
  text,
}: {
  label: string;
  value: number;
  text: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-4 text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-400">{text}</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-cyan-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Status({
  children,
  type = "neutral",
}: {
  children: React.ReactNode;
  type?: "neutral" | "success" | "warning" | "accent";
}) {
  const classes = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    accent: "bg-cyan-50 text-cyan-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${classes[type]}`}
    >
      {children}
    </span>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active studies"
          value="3"
          detail="1 currently recruiting"
        />

        <StatCard
          label="Participants"
          value="427"
          detail="Across active studies"
        />

        <StatCard
          label="Completed"
          value="366"
          detail="85.7% completion"
        />

        <StatCard label="Data flags" value="7" detail="Require review" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Active studies">
          <div className="divide-y divide-slate-100">
            {[
              {
                name: "Daily Stress in University Students",
                detail: "93 active · 14-day ambulatory protocol",
                status: "Live",
                type: "success" as const,
              },
              {
                name: "AI & Loneliness Study",
                detail: "221 complete · cross-sectional survey",
                status: "Recruiting",
                type: "accent" as const,
              },
              {
                name: "Sleep and Academic Wellbeing",
                detail: "52 participants · baseline + follow-up",
                status: "Active",
                type: "neutral" as const,
              },
            ].map((study) => (
              <div
                key={study.name}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{study.name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {study.detail}
                  </p>
                </div>

                <Status type={study.type}>{study.status}</Status>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => changeScreen("studies")}
            className="mt-5 flex items-center gap-2 text-sm font-semibold"
          >
            View all studies
            <ArrowIcon />
          </button>
        </Panel>

        <Panel title="Research tasks">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Data-quality review</p>
                <Status type="warning">7 flags</Status>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Daily Stress study
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Low EMA compliance</p>
                <Status>11 participants</Status>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Below 70% completion
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Questionnaire licence</p>
                <Status type="warning">31 days</Status>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                One licensed measure approaching renewal
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Quick actions"
        description="Continue your most common research workflows."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Create study",
              text: "Build a new survey or longitudinal protocol.",
              screen: "builder" as Screen,
            },
            {
              title: "Find questionnaire",
              text: "Browse approved and licensed measures.",
              screen: "library" as Screen,
            },
            {
              title: "Build EMA protocol",
              text: "Create repeated real-world assessments.",
              screen: "ambulatory" as Screen,
            },
            {
              title: "Open data",
              text: "Inspect live participant responses.",
              screen: "data" as Screen,
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => changeScreen(item.screen)}
              className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.text}
              </p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Daily Stress study">
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
              Recruitment
            </p>

            <p className="mt-2 text-3xl font-semibold">93 / 120</p>

            <p className="mt-1 text-sm text-slate-500">
              77.5% of recruitment target
            </p>

            <div className="mt-5">
              <ProgressBar
                label="Participant target"
                value={78}
                text="93 / 120"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="EMA prompts" value="2,846" detail="Responses" />
            <StatCard label="Compliance" value="81%" detail="Average" />
            <StatCard label="Baseline" value="96%" detail="Complete" />
            <StatCard label="Wearables" value="73%" detail="Opt-in coverage" />
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   STUDIES
   ========================================================= */

function Studies({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  const studies = [
    {
      name: "Daily Stress in University Students",
      design: "Ambulatory / longitudinal",
      n: "93 / 120",
      status: "Live",
      type: "success" as const,
    },
    {
      name: "AI & Loneliness Study",
      design: "Cross-sectional survey",
      n: "221 / 300",
      status: "Recruiting",
      type: "accent" as const,
    },
    {
      name: "Sleep and Academic Wellbeing",
      design: "Baseline + 30-day follow-up",
      n: "52 / 80",
      status: "Active",
      type: "neutral" as const,
    },
    {
      name: "Emotion Regulation Pilot",
      design: "Repeated measures",
      n: "0 / 25",
      status: "Draft",
      type: "warning" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Status type="accent">All</Status>
          <Status>Draft</Status>
          <Status>Recruiting</Status>
          <Status>Completed</Status>
        </div>

        <button
          type="button"
          onClick={() => changeScreen("builder")}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          + New study
        </button>
      </div>

      <Panel title="Your studies">
        <div className="divide-y divide-slate-100">
          {studies.map((study) => (
            <div
              key={study.name}
              className="grid gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[1fr_180px_100px_100px] md:items-center"
            >
              <div>
                <p className="font-medium">{study.name}</p>
                <p className="mt-1 text-sm text-slate-500">{study.design}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Participants</p>
                <p className="mt-1 text-sm font-medium">{study.n}</p>
              </div>

              <Status type={study.type}>{study.status}</Status>

              <button
                type="button"
                className="text-left text-sm font-semibold text-cyan-800"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   STUDY BUILDER
   ========================================================= */

function StudyBuilder({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  const [step, setStep] = useState(1);

  const steps = [
    "Overview",
    "Consent",
    "Measures",
    "Ambulatory",
    "Recruitment",
    "Publish",
  ];

  return (
    <div className="space-y-5">
      <Panel title="Study creation">
        <div className="flex flex-wrap gap-2">
          {steps.map((label, index) => {
            const number = index + 1;

            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(number)}
                className={`rounded-full border px-3 py-2 text-xs font-medium ${
                  step === number
                    ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                {number}. {label}
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title={steps[step - 1]}
          description={`Study builder · Step ${step} of ${steps.length}`}
        >
          {step === 1 && (
            <div className="space-y-5">
              <label className="block">
                <span className="text-sm font-medium">Study title</span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                  defaultValue="Daily Stress in University Students"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Participant-facing description
                </span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
                  defaultValue="A 14-day research study examining stress, context and academic experiences in everyday life."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-medium">Study design</span>
                  <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                    <option>Ambulatory / longitudinal</option>
                    <option>Cross-sectional survey</option>
                    <option>Repeated measures</option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-medium">
                    Target sample size
                  </span>
                  <input
                    type="number"
                    defaultValue={120}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="font-medium">Participant consent</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add the approved participant information sheet and consent
                  statements for this study.
                </p>
              </div>

              {[
                "I confirm that I have read the participant information.",
                "I voluntarily agree to participate.",
                "I understand how my study data will be handled.",
              ].map((item) => (
                <label
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <input type="checkbox" className="mt-1" defaultChecked />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm leading-6 text-slate-500">
                Add questionnaires from the PsyLattice library or create
                custom research measures.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Perceived Stress Scale",
                  "Daily Academic Context",
                  "Demographics",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                  >
                    <span className="text-sm font-medium">{item}</span>
                    <Status type="success">Added</Status>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => changeScreen("library")}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              >
                Browse questionnaire library
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-sm leading-6 text-slate-500">
                Configure repeated real-world assessment windows and
                participant prompts.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  ["Morning", "08:00–10:00"],
                  ["Midday", "12:00–14:00"],
                  ["Afternoon", "16:00–18:00"],
                  ["Evening", "21:00"],
                ].map(([name, time]) => (
                  <div
                    key={name}
                    className="flex justify-between rounded-xl border border-slate-200 p-4"
                  >
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-slate-400">{time}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => changeScreen("ambulatory")}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
              >
                Open protocol builder
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-500">
                Create participant channels and recruitment links after the
                study is approved for deployment.
              </p>

              <div className="rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-medium">Planned study URL</p>
                <code className="mt-2 block rounded-lg bg-slate-50 p-3 text-xs">
                  psylattice.study/DS14-2026
                </code>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="font-medium text-emerald-900">
                Ready for final review
              </p>
              <p className="mt-2 text-sm leading-6 text-emerald-800">
                In a future backend-enabled version, publishing would require
                final validation of permissions, consent documents and
                questionnaire rights.
              </p>
            </div>
          )}

          <div className="mt-7 flex justify-between border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
            >
              Back
            </button>

            <button
              type="button"
              onClick={() =>
                setStep((current) => Math.min(steps.length, current + 1))
              }
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
            >
              {step === steps.length ? "Review study" : "Continue"}
            </button>
          </div>
        </Panel>

        <Panel title="Study checklist">
          <div className="space-y-5">
            {[
              ["Study overview", "Complete", true],
              ["Ethics documentation", "Uploaded", true],
              ["Consent", "Version 1.2", true],
              ["Questionnaires", "3 selected", true],
              ["Ambulatory protocol", "4 prompts / day", true],
              ["Publish review", "Pending", false],
            ].map(([title, status, complete]) => (
              <div key={String(title)} className="flex gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                    complete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {complete ? <CheckIcon /> : "·"}
                </div>

                <div>
                  <p className="text-sm font-medium">{String(title)}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {String(status)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   QUESTIONNAIRE LIBRARY / MARKETPLACE
   ========================================================= */

function QuestionnaireLibrary() {
  const [filter, setFilter] = useState("All");

  const questionnaires = [
    {
      name: "Perceived Stress Scale",
      domain: "Stress",
      licence: "Free / authorised",
      type: "free",
      description:
        "Self-report measure with documented research usage status and scoring configuration.",
    },
    {
      name: "Student Wellbeing Measure",
      domain: "Wellbeing",
      licence: "Institution licensed",
      type: "institution",
      description:
        "Available through an institutional PsyLattice questionnaire licence.",
    },
    {
      name: "Licensed Assessment A",
      domain: "Clinical research",
      licence: "Paid licence",
      type: "paid",
      description:
        "Digital administration requires an appropriate research licence and any required qualifications.",
    },
    {
      name: "Daily Academic Context",
      domain: "Custom",
      licence: "Researcher created",
      type: "custom",
      description:
        "A custom contextual questionnaire created within your research workspace.",
    },
  ];

  return (
    <div className="space-y-5">
      <Panel
        title="Questionnaire marketplace & library"
        description="Find measures suitable for your research and track their usage permissions."
      >
        <div className="grid gap-3 md:grid-cols-[1fr_230px]">
          <input
            placeholder="Search questionnaires, constructs or authors..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option>All</option>
            <option>Free / open</option>
            <option>Paid</option>
            <option>Institution licensed</option>
          </select>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {questionnaires.map((item) => (
          <article
            key={item.name}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Status
                type={
                  item.type === "free"
                    ? "success"
                    : item.type === "paid"
                      ? "warning"
                      : item.type === "institution"
                        ? "accent"
                        : "neutral"
                }
              >
                {item.licence}
              </Status>

              <span className="text-xs text-slate-400">{item.domain}</span>
            </div>

            <h2 className="mt-5 text-xl font-semibold">{item.name}</h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {item.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {item.type === "paid" ? (
                <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                  View licence options
                </button>
              ) : (
                <button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                  Add to study
                </button>
              )}

              <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
                View details
              </button>
            </div>
          </article>
        ))}
      </div>

      <Panel title="Create or import questionnaire">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-medium">
              Need a questionnaire that is not in the library?
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Create your own research items or document an authorised
              questionnaire while recording authorship, source, scoring and
              usage rights.
            </p>
          </div>

          <button className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">
            + Create questionnaire
          </button>
        </div>
      </Panel>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-medium text-amber-900">
          Questionnaire licensing safeguard
        </p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-800">
          A questionnaire being available online does not automatically make
          it free to reproduce, digitally administer, score or distribute.
          PsyLattice should require documented usage rights before restricted
          measures are deployed.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   AMBULATORY PROTOCOL BUILDER
   ========================================================= */

function AmbulatoryBuilder() {
  const [duration, setDuration] = useState("14");
  const [prompts, setPrompts] = useState("4");

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title="Ambulatory assessment protocol"
          description="Design an EMA / ESM protocol for your participants."
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Protocol name</span>

              <input
                defaultValue="Daily Stress — 14 days"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-medium">Duration</span>

                <select
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </label>

              <label>
                <span className="text-sm font-medium">Prompts per day</span>

                <select
                  value={prompts}
                  onChange={(event) => setPrompts(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>
            </div>

            <div>
              <p className="text-sm font-medium">Prompt windows</p>

              <div className="mt-3 space-y-3">
                {[
                  ["Morning", "08:00", "10:00", "Random"],
                  ["Midday", "12:00", "14:00", "Random"],
                  ["Afternoon", "16:00", "18:00", "Random"],
                  ["Evening", "21:00", "21:00", "Fixed"],
                ].map(([name, start, end, type]) => (
                  <div
                    key={name}
                    className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_100px_100px_90px]"
                  >
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-slate-500">{start}</span>
                    <span className="text-xs text-slate-500">{end}</span>
                    <Status type="accent">{type}</Status>
                  </div>
                ))}
              </div>
            </div>

            <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
              + Add prompt window
            </button>
          </div>
        </Panel>

        <Panel title="Prompt content">
          <div className="space-y-5">
            {[
              ["Stress intensity", "0–10 slider", "Required"],
              ["Current activity", "Multiple choice", "Required"],
              ["Social context", "Multiple choice", "Optional"],
              ["Momentary mood", "0–10 scale", "Required"],
              ["Open note", "Short text", "Optional"],
              ["Wearable context", "Sleep + activity", "Optional"],
            ].map(([name, format, status]) => (
              <div key={name} className="flex justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-slate-400">{format}</p>
                </div>

                <span className="text-xs text-slate-400">{status}</span>
              </div>
            ))}

            <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Edit prompt questionnaire
            </button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Sampling modes">
          <div className="space-y-4">
            {[
              [
                "Random-time sampling",
                "Prompts appear randomly inside specified windows.",
              ],
              ["Fixed-time sampling", "Prompts are sent at an exact time."],
              [
                "Event-contingent",
                "Participants manually begin an assessment after a defined event.",
              ],
              [
                "Device-context assisted",
                "Future option using explicitly authorised contextual signals.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Protocol summary">
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">
              Participant schedule
            </p>

            <p className="mt-3 text-2xl font-semibold">
              {prompts} prompts / day
            </p>

            <p className="mt-1 text-sm text-slate-400">
              for {duration} consecutive days
            </p>

            <div className="mt-6 border-t border-slate-800 pt-5">
              <p className="text-sm text-slate-300">
                Estimated maximum:
              </p>

              <p className="mt-1 text-xl font-semibold">
                {Number(duration) * Number(prompts)} assessments
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   PARTICIPANTS
   ========================================================= */

function Participants() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled" value="93" detail="Daily Stress study" />
        <StatCard label="Active today" value="88" detail="Received a prompt" />
        <StatCard label="Compliance" value="81%" detail="Study average" />
        <StatCard label="Withdrawn" value="3" detail="Protocol status" />
      </div>

      <Panel title="Participant management">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Participant ID</th>
                <th className="pb-3 font-medium">Study day</th>
                <th className="pb-3 font-medium">Compliance</th>
                <th className="pb-3 font-medium">Last response</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {[
                ["PL-001", "10 / 14", "92%", "21 min ago", "Active"],
                ["PL-002", "9 / 14", "68%", "3h ago", "Review"],
                ["PL-003", "12 / 14", "86%", "45 min ago", "Active"],
                ["PL-004", "7 / 14", "51%", "1 day ago", "Low compliance"],
                ["PL-005", "11 / 14", "79%", "56 min ago", "Active"],
              ].map(([id, day, compliance, response, status]) => (
                <tr key={id}>
                  <td className="py-4 font-medium">{id}</td>
                  <td className="py-4 text-slate-500">{day}</td>
                  <td className="py-4 text-slate-500">{compliance}</td>
                  <td className="py-4 text-slate-500">{response}</td>
                  <td className="py-4">
                    <Status
                      type={
                        status === "Active"
                          ? "success"
                          : status === "Review"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {status}
                    </Status>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Participant actions">
        <div className="flex flex-wrap gap-2">
          <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
            Send protocol reminder
          </button>

          <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
            View participant timeline
          </button>

          <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
            Record withdrawal
          </button>
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Researcher communications must later follow the approved study
          protocol and ethics procedures.
        </p>
      </Panel>
    </div>
  );
}

/* =========================================================
   PARTICIPANT LINKS
   ========================================================= */

function ParticipantLinks() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Panel
        title="Recruitment links"
        description="Create separate channels for participant recruitment."
      >
        <div className="divide-y divide-slate-100">
          {[
            [
              "Main study link",
              "psylattice.study/DS14-2026",
              "Active",
            ],
            [
              "Psychology cohort",
              "psylattice.study/DS14-PSY",
              "Active",
            ],
            ["Pilot participants", "psylattice.study/DS14-PILOT", "12 / 15"],
          ].map(([name, url, status]) => (
            <div
              key={name}
              className="flex flex-col justify-between gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <code className="mt-1 block text-xs text-slate-400">{url}</code>
              </div>

              <Status type={status === "Active" ? "success" : "neutral"}>
                {status}
              </Status>
            </div>
          ))}
        </div>

        <button className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          + Create recruitment link
        </button>
      </Panel>

      <Panel title="Participant experience preview">
        <div className="mx-auto max-w-sm overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 p-2">
          <div className="rounded-[22px] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 font-semibold text-cyan-800">
                Ψ
              </div>

              <div>
                <p className="text-sm font-semibold">PsyLattice Study</p>
                <p className="text-xs text-slate-400">Participant portal</p>
              </div>
            </div>

            <div className="mt-7">
              <p className="text-xs text-slate-400">Study</p>
              <p className="mt-1 font-semibold">
                Daily Stress in University Students
              </p>
              <p className="mt-1 text-xs text-slate-500">Day 8 of 14</p>
            </div>

            <div className="mt-5 rounded-xl bg-cyan-50 p-4">
              <p className="text-xs text-cyan-800">Due now</p>
              <p className="mt-1 font-medium">Midday check-in</p>
              <p className="mt-1 text-xs text-slate-500">
                Usually takes less than one minute.
              </p>
            </div>

            <button className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Start check-in
            </button>

            <div className="mt-6">
              <ProgressBar
                label="Study completion"
                value={57}
                text="Day 8 / 14"
              />
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-slate-400">
          Participants receive a separate study interface. They never enter
          the researcher dashboard or access other participant data.
        </p>
      </Panel>
    </div>
  );
}

/* =========================================================
   DATA DASHBOARD
   ========================================================= */

function DataDashboard({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Responses" value="2,846" detail="EMA observations" />
        <StatCard label="Participants" value="93" detail="Enrolled" />
        <StatCard label="Compliance" value="81%" detail="Average completion" />
        <StatCard label="Flags" value="7" detail="Need review" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Data completeness">
          <div className="space-y-6">
            <ProgressBar
              label="Baseline questionnaires"
              value={96}
              text="96%"
            />
            <ProgressBar
              label="Ambulatory prompts"
              value={81}
              text="81%"
            />
            <ProgressBar
              label="Wearable summaries"
              value={73}
              text="73%"
            />
            <ProgressBar
              label="Final assessment"
              value={48}
              text="Study ongoing"
            />
          </div>
        </Panel>

        <Panel title="Quality checks">
          <div className="space-y-5">
            {[
              ["Missing >20% of responses", "4 participants"],
              ["Very short response latency", "2 participants"],
              ["Duplicate identifier signal", "1 participant"],
              ["Consent mismatch", "0 participants"],
            ].map(([label, result], index) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-sm">{label}</span>

                <Status
                  type={
                    index < 3
                      ? "warning"
                      : "success"
                  }
                >
                  {result}
                </Status>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Latest incoming observations">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs text-slate-400">
              <tr>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Participant</th>
                <th className="pb-3 font-medium">Prompt</th>
                <th className="pb-3 font-medium">Stress</th>
                <th className="pb-3 font-medium">Activity</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {[
                ["13:31", "PL-041", "Midday", "7", "Studying"],
                ["13:28", "PL-018", "Midday", "4", "Lunch"],
                ["13:21", "PL-072", "Midday", "6", "Class"],
                ["13:16", "PL-006", "Midday", "3", "Socialising"],
              ].map((row) => (
                <tr key={`${row[0]}-${row[1]}`}>
                  {row.map((cell) => (
                    <td key={cell} className="py-4 text-slate-600 first:font-medium first:text-slate-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => changeScreen("explorer")}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
          >
            Open Data Explorer
          </button>

          <button
            onClick={() => changeScreen("exports")}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Export dataset
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   DATA EXPLORER
   ========================================================= */

function DataExplorer() {
  const [view, setView] = useState("Ambulatory observations");

  return (
    <div className="space-y-5">
      <Panel title="Dataset explorer">
        <div className="grid gap-3 md:grid-cols-[1fr_240px]">
          <input
            placeholder="Search participant ID or variable..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />

          <select
            value={view}
            onChange={(event) => setView(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option>Ambulatory observations</option>
            <option>Baseline questionnaires</option>
            <option>Participant summaries</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs text-slate-400">
              <tr>
                <th className="pb-3">Participant</th>
                <th className="pb-3">Day</th>
                <th className="pb-3">Prompt</th>
                <th className="pb-3">Stress</th>
                <th className="pb-3">Mood</th>
                <th className="pb-3">Activity</th>
                <th className="pb-3">Sleep h</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {[
                ["PL001", "10", "Morning", "4", "7", "Commuting", "7.1"],
                ["PL001", "10", "Midday", "7", "5", "Studying", "7.1"],
                ["PL002", "9", "Morning", "6", "5", "Class", "5.8"],
                ["PL003", "12", "Afternoon", "3", "8", "Socialising", "7.7"],
              ].map((record, index) => (
                <tr key={index}>
                  {record.map((value) => (
                    <td key={value} className="py-4 text-slate-600">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Variable dictionary">
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            [
              "stress_now",
              "Current stress rating",
              "Integer · 0–10",
            ],
            [
              "mood_now",
              "Current positive mood",
              "Integer · 0–10",
            ],
            [
              "activity_now",
              "Current activity category",
              "Categorical",
            ],
            [
              "sleep_duration",
              "Previous-night sleep duration",
              "Numeric · hours",
            ],
            [
              "pss_total",
              "Baseline perceived stress total",
              "Computed score",
            ],
          ].map(([variable, label, type]) => (
            <div
              key={variable}
              className="rounded-xl border border-slate-200 p-4"
            >
              <code className="text-sm font-semibold text-cyan-800">
                {variable}
              </code>

              <p className="mt-2 text-sm">{label}</p>
              <p className="mt-1 text-xs text-slate-400">{type}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   EXPORTS
   ========================================================= */

function ExportData() {
  const [format, setFormat] = useState("CSV");

  const formats = ["CSV", "XLSX", "JSON", "SPSS-ready", "R-ready"];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel
          title="Create research export"
          description="Prepare a structured dataset for analysis."
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Dataset</span>

              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Full research dataset</option>
                <option>Ambulatory observations only</option>
                <option>Questionnaire responses only</option>
                <option>Participant-level summaries</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Participant IDs</span>

              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Pseudonymous study IDs</option>
                <option>Fully anonymous export</option>
              </select>
            </label>

            <div>
              <p className="text-sm font-medium">File format</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {formats.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFormat(item)}
                    className={`rounded-full border px-3 py-2 text-xs font-medium ${
                      format === item
                        ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Generate {format} export
            </button>
          </div>
        </Panel>

        <Panel title="Included automatically">
          <div className="space-y-5">
            {[
              ["Data file", "Selected participant observations"],
              ["Codebook", "Variable names, labels and value coding"],
              ["Study metadata", "Protocol version and export date"],
              ["Missing-value guide", "Configured missing-data codes"],
            ].map(([name, description]) => (
              <div key={name} className="flex gap-3">
                <span className="mt-1 text-emerald-700">
                  <CheckIcon />
                </span>

                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-slate-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Export history">
        <div className="divide-y divide-slate-100">
          {[
            ["09 Aug · 13:02", "CSV", "2,846 rows · pseudonymous"],
            ["08 Aug · 18:41", "XLSX", "Participant-level summary"],
            ["05 Aug · 09:20", "R-ready", "Baseline dataset"],
          ].map(([date, formatName, description]) => (
            <div
              key={date}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">
                  {formatName} export
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {date} · {description}
                </p>
              </div>

              <button className="text-xs font-semibold text-cyan-800">
                Download
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   ETHICS
   ========================================================= */

function EthicsConsent() {
  return (
    <div className="space-y-5">
      <Panel title="Ethics & study documentation">
        <div className="divide-y divide-slate-100">
          {[
            ["Ethics approval", "Approved protocol · valid until Mar 2027"],
            ["Participant information sheet", "Version 1.4"],
            ["Consent form", "Version 2.0"],
            ["Data management plan", "Updated 01 Aug 2026"],
          ].map(([name, detail]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status type="success">Current</Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Consent configuration">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Questionnaire responses",
              "Required for study participation",
              "Required",
            ],
            [
              "Ambulatory assessments",
              "Required for study protocol",
              "Required",
            ],
            [
              "Wearable sleep & activity",
              "Additional optional data source",
              "Optional",
            ],
            [
              "Future research reuse",
              "Separate consent required",
              "Optional",
            ],
          ].map(([name, description, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <Status type={status === "Required" ? "accent" : "neutral"}>
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   TEAM
   ========================================================= */

function TeamPermissions() {
  return (
    <div className="space-y-5">
      <Panel title="Research team">
        <div className="divide-y divide-slate-100">
          {[
            ["Priyangshu Das", "Study owner", "Full access"],
            ["Dr. R. Sen", "Supervisor", "Review + export"],
            ["A. Kumar", "Research assistant", "Recruitment only"],
          ].map(([name, role, permission]) => (
            <div
              key={name}
              className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_180px_150px] sm:items-center"
            >
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-slate-500">{role}</p>
              <Status>{permission}</Status>
            </div>
          ))}
        </div>

        <button className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">
          + Invite collaborator
        </button>
      </Panel>

      <Panel title="Permission model">
        <div className="space-y-5">
          {[
            [
              "Participant recruitment information",
              "Owner + explicitly approved research staff",
              "Restricted",
            ],
            [
              "Pseudonymous research dataset",
              "Approved project team",
              "Study scoped",
            ],
            [
              "Data export",
              "Owner / authorised analyst",
              "Controlled",
            ],
            [
              "Protocol editing after launch",
              "Requires a versioned study change",
              "Versioned",
            ],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex justify-between gap-5 rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {detail}
                </p>
              </div>

              <span className="text-xs font-medium text-slate-500">
                {status}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   MAIN RESEARCH WORKSPACE
   ========================================================= */

export default function ResearcherWorkspace() {
  const [screen, setScreen] = useState<Screen>("dashboard");

  const currentNavigation = navigation.find((item) => item.id === screen)!;

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return <Dashboard changeScreen={setScreen} />;

      case "studies":
        return <Studies changeScreen={setScreen} />;

      case "builder":
        return <StudyBuilder changeScreen={setScreen} />;

      case "library":
        return <QuestionnaireLibrary />;

      case "ambulatory":
        return <AmbulatoryBuilder />;

      case "participants":
        return <Participants />;

      case "links":
        return <ParticipantLinks />;

      case "data":
        return <DataDashboard changeScreen={setScreen} />;

      case "explorer":
        return <DataExplorer />;

      case "exports":
        return <ExportData />;

      case "ethics":
        return <EthicsConsent />;

      case "team":
        return <TeamPermissions />;

      default:
        return <Dashboard changeScreen={setScreen} />;
    }
  }

  const descriptions: Record<Screen, string> = {
    dashboard:
      "Manage your studies, recruitment, ambulatory protocols and research data.",
    studies:
      "Create, organise and monitor your active and completed research projects.",
    builder:
      "Build a complete study workflow from protocol design to participant deployment.",
    library:
      "Find free, institution-licensed or appropriately licensed psychological measures.",
    ambulatory:
      "Design repeated real-world EMA and ESM assessment protocols.",
    participants:
      "Monitor enrolment, study progress and protocol compliance.",
    links:
      "Create participant-specific recruitment channels and study links.",
    data:
      "Monitor incoming responses, completeness and data-quality signals.",
    explorer:
      "Inspect participant observations and study variables before analysis.",
    exports:
      "Prepare clean research datasets for statistical analysis.",
    ethics:
      "Manage research approval, participant information and consent versions.",
    team:
      "Control who can access, edit and export information within your studies.",
  };

  const groups: ("Research" | "Data" | "Governance")[] = [
    "Research",
    "Data",
    "Governance",
  ];

  return (
    <main className="min-h-screen bg-[#f6f8f8] text-slate-950">
      {/* Header */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 lg:px-7">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-lg font-semibold text-cyan-800"
            >
              Ψ
            </Link>

            <div>
              <p className="font-semibold tracking-tight">
                PsyLattice Research
              </p>

              <p className="text-xs text-slate-400">Researcher workspace</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Status type="accent">Researcher</Status>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
              PD
            </div>

            <Link
              href="/signin"
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Sign out
            </Link>
          </div>

          <select
            value={screen}
            onChange={(event) => setScreen(event.target.value as Screen)}
            className="max-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm lg:hidden"
          >
            {navigation.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[245px_minmax(0,1fr)]">
        {/* Sidebar */}

        <aside className="hidden border-r border-slate-200 bg-white p-4 lg:block">
          {groups.map((group) => (
            <div key={group} className="mb-6">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
                {group}
              </p>

              <nav className="space-y-1">
                {navigation
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const active = item.id === screen;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setScreen(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                          active
                            ? "bg-cyan-50 font-semibold text-cyan-900"
                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? "bg-cyan-700" : "bg-slate-300"
                          }`}
                        />

                        {item.label}
                      </button>
                    );
                  })}
              </nav>
            </div>
          ))}

          <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs font-medium text-cyan-200">
              Research prototype
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              All participant records and study data displayed here are
              fictional.
            </p>
          </div>
        </aside>

        {/* Main content */}

        <section className="min-w-0 p-5 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1450px]">
            <div className="mb-7">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Status type="accent">Researcher workspace</Status>

                <span className="text-xs text-slate-400">
                  Frontend prototype
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                {screen === "dashboard"
                  ? "Good afternoon, Priyangshu."
                  : currentNavigation.label}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {descriptions[screen]}
              </p>
            </div>

            {renderScreen()}
          </div>
        </section>
      </div>
    </main>
  );
}