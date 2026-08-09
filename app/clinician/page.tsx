"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

type Screen =
  | "dashboard"
  | "clients"
  | "overview"
  | "assessments"
  | "ambulatory"
  | "wearables"
  | "timeline"
  | "notes"
  | "care"
  | "appointments"
  | "messages"
  | "reports"
  | "permissions"
  | "settings";

const navigation: {
  id: Screen;
  label: string;
  group: "Clinical" | "Monitoring" | "Care" | "Governance";
}[] = [
  { id: "dashboard", label: "Dashboard", group: "Clinical" },
  { id: "clients", label: "Clients", group: "Clinical" },
  { id: "overview", label: "Client Overview", group: "Clinical" },

  { id: "assessments", label: "Assessments", group: "Monitoring" },
  { id: "ambulatory", label: "Ambulatory Monitoring", group: "Monitoring" },
  { id: "wearables", label: "Wearables & Physiology", group: "Monitoring" },
  { id: "timeline", label: "Progress Timeline", group: "Monitoring" },

  { id: "notes", label: "Professional Notes", group: "Care" },
  { id: "care", label: "Care Pathway", group: "Care" },
  { id: "appointments", label: "Appointments", group: "Care" },
  { id: "messages", label: "Messages", group: "Care" },

  { id: "reports", label: "Reports", group: "Governance" },
  { id: "permissions", label: "Consent & Data Access", group: "Governance" },
  { id: "settings", label: "Clinical Settings", group: "Governance" },
];

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
  children: ReactNode;
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

function Status({
  children,
  type = "neutral",
}: {
  children: ReactNode;
  type?: "neutral" | "success" | "warning" | "accent";
}) {
  const styles = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    accent: "bg-cyan-50 text-cyan-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[type]}`}
    >
      {children}
    </span>
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
      <div className="mb-2 flex justify-between gap-3 text-sm">
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

function PersonAvatar({
  initials,
  large = false,
}: {
  initials: string;
  large?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-cyan-50 font-semibold text-cyan-800 ${
        large ? "h-12 w-12" : "h-10 w-10"
      }`}
    >
      {initials}
    </div>
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
        <StatCard label="Assigned clients" value="24" detail="3 need review" />
        <StatCard label="Today's sessions" value="5" detail="Next at 14:30" />
        <StatCard label="New results" value="7" detail="Since yesterday" />
        <StatCard label="Follow-ups" value="4" detail="Due this week" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title="Needs your review"
          description="Recent information requiring professional attention."
        >
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-5 py-4 first:pt-0">
              <div className="flex items-center gap-3">
                <PersonAvatar initials="MS" />

                <div>
                  <p className="text-sm font-medium">Maya S.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    New stress assessment + 3 days of ambulatory data
                  </p>
                </div>
              </div>

              <Status type="warning">Review</Status>
            </div>

            <div className="flex items-center justify-between gap-5 py-4">
              <div className="flex items-center gap-3">
                <PersonAvatar initials="AK" />

                <div>
                  <p className="text-sm font-medium">Arjun K.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Follow-up task due today
                  </p>
                </div>
              </div>

              <Status>Due</Status>
            </div>

            <div className="flex items-center justify-between gap-5 py-4 pb-0">
              <div className="flex items-center gap-3">
                <PersonAvatar initials="LP" />

                <div>
                  <p className="text-sm font-medium">Lina P.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Wearable-data permission changed
                  </p>
                </div>
              </div>

              <Status type="accent">Update</Status>
            </div>
          </div>

          <button
            type="button"
            onClick={() => changeScreen("overview")}
            className="mt-5 flex items-center gap-2 text-sm font-semibold"
          >
            Open Maya's record
            <ArrowIcon />
          </button>
        </Panel>

        <Panel title="Today">
          <div className="divide-y divide-slate-100">
            {[
              ["10:00", "Arjun K.", "Follow-up", "Complete"],
              ["14:30", "Maya S.", "Initial consultation", "Upcoming"],
              ["16:00", "Lina P.", "Online session", "Upcoming"],
            ].map(([time, name, type, status]) => (
              <div
                key={`${time}-${name}`}
                className="grid grid-cols-[60px_1fr_auto] gap-3 py-4 first:pt-0 last:pb-0"
              >
                <p className="text-sm font-semibold">{time}</p>

                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-slate-400">{type}</p>
                </div>

                <Status type={status === "Complete" ? "success" : "neutral"}>
                  {status}
                </Status>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Recent incoming information">
          <div className="space-y-5">
            {[
              [
                "13:14",
                "Maya S.",
                "Momentary stress 8 / 10 while studying",
                "EMA",
              ],
              [
                "12:42",
                "Lina P.",
                "Wearable sharing preference changed",
                "Consent",
              ],
              [
                "11:50",
                "Arjun K.",
                "Follow-up questionnaire completed",
                "Assessment",
              ],
            ].map(([time, person, text, type]) => (
              <div key={`${time}-${person}`} className="flex gap-4">
                <div className="w-12 shrink-0 text-xs text-slate-400">
                  {time}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{person}</p>
                    <Status>{type}</Status>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Clinical workspace principle">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <p className="font-medium">Data supports professional judgment.</p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              PsyLattice organises assessments, ambulatory information and
              authorised physiological context. It does not independently
              diagnose a disorder or select treatment.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   CLIENTS
   ========================================================= */

function Clients({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  const clients = [
    {
      initials: "MS",
      name: "Maya S.",
      id: "CL-1042",
      detail: "New assessment and ambulatory data available.",
      status: "Needs review",
      type: "warning" as const,
    },
    {
      initials: "AK",
      name: "Arjun K.",
      id: "CL-1018",
      detail: "Follow-up due today.",
      status: "Follow-up",
      type: "accent" as const,
    },
    {
      initials: "LP",
      name: "Lina P.",
      id: "CL-1093",
      detail: "Wearable permission changed.",
      status: "Consent update",
      type: "neutral" as const,
    },
    {
      initials: "SR",
      name: "Sofia R.",
      id: "CL-0974",
      detail: "No pending professional tasks.",
      status: "Stable",
      type: "success" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <Panel title="Find clients">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            placeholder="Search name or client ID..."
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700"
          />

          <select className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <option>All assigned clients</option>
            <option>Needs review</option>
            <option>Active monitoring</option>
            <option>Follow-up due</option>
          </select>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {clients.map((client) => (
          <button
            type="button"
            key={client.id}
            onClick={() => changeScreen("overview")}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex items-start gap-4">
              <PersonAvatar initials={client.initials} large />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{client.name}</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      {client.id}
                    </p>
                  </div>

                  <Status type={client.type}>{client.status}</Status>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {client.detail}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   CLIENT OVERVIEW
   ========================================================= */

function ClientOverview({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <PersonAvatar initials="MS" large />

          <div>
            <h2 className="text-xl font-semibold">Maya S.</h2>
            <p className="mt-1 text-sm text-slate-500">
              CL-1042 · Assigned to you
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Status type="accent">Active monitoring</Status>
          <Status>Next session · 14 Aug</Status>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Latest stress score"
          value="21"
          detail="Moderate screening range"
        />

        <StatCard
          label="EMA completion"
          value="82%"
          detail="Past 14 days"
        />

        <StatCard
          label="Average sleep"
          value="6h 18m"
          detail="Past 7 days"
        />

        <StatCard
          label="Next session"
          value="14 Aug"
          detail="14:30"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Integrated snapshot">
          <div className="divide-y divide-slate-100">
            {[
              [
                "Self-report",
                "Latest stress score is lower than the previous administration.",
                "Assessment",
              ],
              [
                "Ambulatory",
                "Higher stress has frequently been reported during afternoon study periods.",
                "EMA",
              ],
              [
                "Wearable context",
                "Shorter sleep on 4 of the past 7 nights.",
                "Authorised",
              ],
              [
                "Care activity",
                "Initial consultation scheduled.",
                "Clinical",
              ],
            ].map(([title, description, status]) => (
              <div
                key={title}
                className="flex items-start justify-between gap-5 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                </div>

                <Status>{status}</Status>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Professional actions">
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => changeScreen("notes")}
              className="rounded-xl bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-white"
            >
              Add professional note
            </button>

            <button
              type="button"
              onClick={() => changeScreen("assessments")}
              className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold"
            >
              Review assessments
            </button>

            <button
              type="button"
              onClick={() => changeScreen("ambulatory")}
              className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold"
            >
              Open ambulatory data
            </button>

            <button
              type="button"
              onClick={() => changeScreen("care")}
              className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold"
            >
              Care pathway
            </button>
          </div>
        </Panel>
      </div>

      <Panel title="Current client-authorised access">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <p className="font-medium">Data permissions</p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            This demo client currently authorises access to self-assessments,
            ambulatory reports, sleep, activity and daily resting-heart-rate
            summaries. Continuous heart-rate and HRV information are not
            shared.
          </p>

          <button
            type="button"
            onClick={() => changeScreen("permissions")}
            className="mt-4 text-sm font-semibold text-cyan-900"
          >
            Review permissions
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   ASSESSMENTS
   ========================================================= */

function Assessments() {
  const [note, setNote] = useState(
    "Stress score has reduced compared with the previous administration. Review alongside current academic context and momentary reports.",
  );

  return (
    <div className="space-y-5">
      <Panel title="Assessment history">
        <div className="divide-y divide-slate-100">
          {[
            [
              "09 Aug 2026",
              "Perceived Stress Scale",
              "Score 21",
              "Awaiting review",
            ],
            [
              "26 Jul 2026",
              "Perceived Stress Scale",
              "Score 25",
              "Reviewed",
            ],
            [
              "12 Jul 2026",
              "Wellbeing Check",
              "Baseline recorded",
              "Reviewed",
            ],
            [
              "19 Jun 2026",
              "Sleep Self-Check",
              "Initial baseline",
              "Historical",
            ],
          ].map(([date, title, result, status]) => (
            <div
              key={`${date}-${title}`}
              className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[130px_1fr_150px_130px] md:items-center"
            >
              <span className="text-xs text-slate-400">{date}</span>

              <span className="text-sm font-medium">{title}</span>

              <span className="text-sm text-slate-500">{result}</span>

              <Status
                type={
                  status === "Awaiting review"
                    ? "warning"
                    : status === "Reviewed"
                      ? "success"
                      : "neutral"
                }
              >
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Repeated score view">
          <div className="space-y-6">
            <ProgressBar label="26 Jul" value={63} text="25" />
            <ProgressBar label="09 Aug" value={53} text="21" />
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            Repeated measurements are shown descriptively. Clinical meaning
            requires professional interpretation and additional context.
          </p>
        </Panel>

        <Panel title="Professional interpretation">
          <label>
            <span className="text-sm font-medium">Review note</span>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-cyan-700"
            />
          </label>

          <button className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Save interpretation
          </button>
        </Panel>
      </div>

      <Panel title="Assign an assessment">
        <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
          <label>
            <span className="text-sm font-medium">Assessment</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Perceived Stress Scale</option>
              <option>Wellbeing Check</option>
              <option>Sleep Self-Check</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Due</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>In 7 days</option>
              <option>In 14 days</option>
              <option>In 30 days</option>
            </select>
          </label>

          <button className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold">
            Assign
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   AMBULATORY MONITORING
   ========================================================= */

function Ambulatory() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prompts sent" value="56" detail="Past 14 days" />
        <StatCard label="Completed" value="46" detail="82% completion" />
        <StatCard label="Mean stress" value="5.4 / 10" detail="Momentary reports" />
        <StatCard label="High ratings" value="9" detail="Ratings ≥ 8" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel title="Recent moments">
          <div className="divide-y divide-slate-100">
            {[
              [
                "Today · 12:42",
                "8 / 10",
                "Studying",
                "Deadline approaching",
                "High",
              ],
              ["Today · 09:11", "4 / 10", "Commuting", "Alone", "Moderate"],
              [
                "Yesterday · 20:31",
                "3 / 10",
                "Home",
                "Socialising",
                "Lower",
              ],
              [
                "Yesterday · 16:08",
                "7 / 10",
                "Library",
                "Studying",
                "Elevated",
              ],
            ].map(([time, stress, location, context, level]) => (
              <div
                key={time}
                className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[130px_80px_1fr_auto]"
              >
                <p className="text-xs text-slate-400">{time}</p>
                <p className="text-sm font-semibold">{stress}</p>
                <div>
                  <p className="text-sm">{location}</p>
                  <p className="mt-1 text-xs text-slate-400">{context}</p>
                </div>
                <Status
                  type={
                    level === "High"
                      ? "warning"
                      : level === "Lower"
                        ? "success"
                        : "neutral"
                  }
                >
                  {level}
                </Status>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Context summary">
          <div className="space-y-6">
            <ProgressBar
              label="Academic / studying"
              value={72}
              text="Most frequent context"
            />

            <ProgressBar label="Alone" value={58} text="58% of reports" />

            <ProgressBar
              label="Elevated stress during study"
              value={61}
              text="Descriptive subset"
            />
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            These are descriptive associations only and should not be
            presented as causal conclusions.
          </p>
        </Panel>
      </div>

      <Panel title="Current ambulatory protocol">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Morning", "08:00–10:00", "Random"],
            ["Midday", "12:00–14:30", "Random"],
            ["Afternoon", "16:00–18:30", "Random"],
            ["Evening", "20:30", "Fixed"],
          ].map(([name, time, type]) => (
            <div
              key={name}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p className="text-sm font-medium">{name}</p>
              <p className="mt-2 text-xs text-slate-400">{time}</p>
              <div className="mt-3">
                <Status type="accent">{type}</Status>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   WEARABLES
   ========================================================= */

function Wearables() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
        <p className="font-medium">Physiological information is contextual.</p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          PsyLattice displays only signals explicitly authorised by the
          client. Wearable information supplements self-report data and does
          not independently establish a psychological diagnosis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sleep" value="6h 18m" detail="7-day average" />
        <StatCard label="Activity" value="7,420" detail="Average steps" />
        <StatCard label="Resting HR" value="64 bpm" detail="Daily summary" />
        <StatCard label="HRV" value="Not shared" detail="Permission off" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Data coverage">
          <div className="space-y-6">
            <ProgressBar label="Sleep" value={92} text="92% coverage" />
            <ProgressBar label="Activity" value={96} text="96% coverage" />
            <ProgressBar
              label="Resting heart rate"
              value={74}
              text="74% coverage"
            />
          </div>
        </Panel>

        <Panel title="Current permissions">
          <div className="divide-y divide-slate-100">
            {[
              ["Sleep", "Duration and timing summaries", "Authorised"],
              ["Activity", "Daily movement summaries", "Authorised"],
              ["Resting HR", "Daily summary only", "Authorised"],
              ["HRV", "Not shared by client", "Unavailable"],
            ].map(([name, description, status]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {description}
                  </p>
                </div>

                <Status
                  type={status === "Authorised" ? "success" : "neutral"}
                >
                  {status}
                </Status>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   TIMELINE
   ========================================================= */

function Timeline() {
  const events = [
    {
      date: "09 Aug",
      title: "New stress assessment",
      detail: "Score 21 · professional review pending",
      type: "Assessment",
    },
    {
      date: "08 Aug",
      title: "Elevated EMA reports",
      detail: "Three high stress reports during academic activity",
      type: "Ambulatory",
    },
    {
      date: "02 Aug",
      title: "Follow-up note",
      detail: "Monitoring continued for another two weeks",
      type: "Clinical",
    },
    {
      date: "26 Jul",
      title: "Previous stress assessment",
      detail: "Score 25 · reviewed",
      type: "Assessment",
    },
    {
      date: "24 Jul",
      title: "Ambulatory protocol started",
      detail: "Four prompts per day",
      type: "Monitoring",
    },
  ];

  return (
    <div className="space-y-5">
      <Panel title="Longitudinal record">
        <div className="space-y-0">
          {events.map((event, index) => (
            <div key={`${event.date}-${event.title}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="mt-1 h-3 w-3 rounded-full bg-cyan-700" />

                {index < events.length - 1 && (
                  <div className="h-20 w-px bg-slate-200" />
                )}
              </div>

              <div className="pb-7">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs text-slate-400">{event.date}</p>
                  <Status>{event.type}</Status>
                </div>

                <p className="mt-2 font-medium">{event.title}</p>
                <p className="mt-1 text-sm text-slate-500">{event.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Timeline filters">
        <div className="flex flex-wrap gap-2">
          {[
            "All",
            "Assessments",
            "Ambulatory",
            "Wearables",
            "Sessions",
            "Notes",
          ].map((item, index) => (
            <button
              key={item}
              className={`rounded-full border px-3 py-2 text-xs font-medium ${
                index === 0
                  ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   NOTES
   ========================================================= */

function Notes() {
  const [note, setNote] = useState(
    "Reviewed latest self-assessment and ambulatory entries. Discuss contextual pattern during scheduled consultation.",
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Panel title="New professional note">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Note type</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Assessment review</option>
              <option>Session note</option>
              <option>Follow-up</option>
              <option>Referral</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Professional note</span>

            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 min-h-40 w-full rounded-xl border border-slate-200 p-4 text-sm leading-6 outline-none focus:border-cyan-700"
            />
          </label>

          <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            Professional notes will later be timestamped, attributed to the
            authenticated professional and included in the audit trail.
          </div>

          <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            Save professional note
          </button>
        </div>
      </Panel>

      <Panel title="Recent notes">
        <div className="divide-y divide-slate-100">
          {[
            ["09 Aug · 11:32", "Assessment review", "Dr. Sharma"],
            ["02 Aug · 16:05", "Follow-up note", "Dr. Sharma"],
            ["26 Jul · 10:18", "Initial triage", "Counselling service"],
          ].map(([date, type, author]) => (
            <div
              key={date}
              className="py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{type}</p>
                <Status>{author}</Status>
              </div>

              <p className="mt-1 text-xs text-slate-400">{date}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   CARE PATHWAY
   ========================================================= */

function CarePathway() {
  return (
    <div className="space-y-5">
      <Panel title="Current support pathway">
        <div className="flex flex-wrap items-center gap-2">
          <Status type="success">1 · Request ✓</Status>
          <span className="text-slate-300">→</span>
          <Status type="success">2 · Review ✓</Status>
          <span className="text-slate-300">→</span>
          <Status type="accent">3 · Consultation</Status>
          <span className="text-slate-300">→</span>
          <Status>4 · Follow-up</Status>
        </div>

        <div className="mt-7 divide-y divide-slate-100">
          {[
            [
              "Support request",
              "Submitted 26 Jul",
              "Complete",
            ],
            [
              "Initial professional review",
              "Reviewed by counselling service",
              "Complete",
            ],
            [
              "Consultation",
              "14 Aug · 14:30",
              "Scheduled",
            ],
            [
              "Follow-up plan",
              "To be determined by professional",
              "Pending",
            ],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status
                type={
                  status === "Complete"
                    ? "success"
                    : status === "Scheduled"
                      ? "accent"
                      : "neutral"
                }
              >
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Record professional decision">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Next action</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Continue current support</option>
              <option>Schedule follow-up</option>
              <option>Refer to another service</option>
              <option>Close current pathway</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Follow-up interval</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>1 week</option>
              <option>2 weeks</option>
              <option>4 weeks</option>
            </select>
          </label>
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-medium">
            Professional rationale
          </span>

          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-4 text-sm"
            placeholder="Record the professional basis for the decision..."
          />
        </label>

        <button className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
          Record decision
        </button>
      </Panel>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="font-medium text-amber-900">
          Human decision required
        </p>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-800">
          Referral, escalation, diagnosis and treatment decisions remain
          professional actions. PsyLattice may organise information or surface
          workflow tasks, but does not make these decisions autonomously.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   APPOINTMENTS
   ========================================================= */

function Appointments() {
  return (
    <div className="space-y-5">
      <Panel title="Upcoming appointments">
        <div className="divide-y divide-slate-100">
          {[
            [
              "14 Aug · 14:30",
              "Maya S.",
              "Initial consultation · In person",
              "Confirmed",
            ],
            [
              "14 Aug · 16:00",
              "Lina P.",
              "Follow-up · Online",
              "Confirmed",
            ],
            [
              "15 Aug · 10:30",
              "Arjun K.",
              "Follow-up · In person",
              "Pending",
            ],
          ].map(([time, person, type, status]) => (
            <div
              key={`${time}-${person}`}
              className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[150px_1fr_200px_auto] md:items-center"
            >
              <p className="text-sm font-semibold">{time}</p>
              <p className="text-sm font-medium">{person}</p>
              <p className="text-sm text-slate-500">{type}</p>
              <Status
                type={status === "Confirmed" ? "success" : "warning"}
              >
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Follow-up tasks">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Maya S.",
              "Review ambulatory entries before consultation",
              "14 Aug",
            ],
            ["Arjun K.", "Send agreed follow-up questionnaire", "Today"],
            [
              "Lina P.",
              "Acknowledge changed data permission",
              "Today",
            ],
          ].map(([person, task, due]) => (
            <div
              key={`${person}-${task}`}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{person}</p>
                <p className="mt-1 text-sm text-slate-500">{task}</p>
              </div>

              <Status>{due}</Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Schedule appointment">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="text-sm font-medium">Client</span>
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Maya S.</option>
              <option>Arjun K.</option>
              <option>Lina P.</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Type</span>
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>Follow-up</option>
              <option>Initial consultation</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Mode</span>
            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>In person</option>
              <option>Online</option>
            </select>
          </label>

          <div className="flex items-end">
            <button className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Schedule
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   MESSAGES
   ========================================================= */

function Messages() {
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Panel title="Conversations">
        <div className="divide-y divide-slate-100">
          {[
            ["Maya S.", "Question about tomorrow's check-in", "12m"],
            ["Arjun K.", "Follow-up questionnaire", "1h"],
            ["Lina P.", "Data-sharing preference updated", "Today"],
          ].map(([person, preview, time]) => (
            <button
              key={person}
              className="w-full py-4 text-left first:pt-0 last:pb-0"
            >
              <div className="flex justify-between gap-3">
                <p className="text-sm font-medium">{person}</p>
                <span className="text-xs text-slate-400">{time}</span>
              </div>

              <p className="mt-1 text-xs text-slate-500">{preview}</p>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Maya S.">
        <div className="min-h-[380px] space-y-4">
          <div className="max-w-md rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm leading-6">
              Do I need to complete the evening check-in if I'm travelling?
            </p>
            <p className="mt-2 text-xs text-slate-400">12:22</p>
          </div>

          <div className="ml-auto max-w-md rounded-2xl rounded-tr-sm bg-slate-950 p-4 text-white">
            <p className="text-sm leading-6">
              Complete it if practical. Missing an occasional prompt is okay,
              and we can review the overall pattern later.
            </p>
            <p className="mt-2 text-xs text-slate-400">12:28</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 border-t border-slate-100 pt-5">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a secure message..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />

          <button
            type="button"
            onClick={() => setMessage("")}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Send
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   REPORTS
   ========================================================= */

function Reports() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel
          title="Create professional report"
          description="Prepare a structured summary from authorised information."
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">Report type</span>

              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Longitudinal assessment summary</option>
                <option>Monitoring summary</option>
                <option>Referral summary</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">Period</span>

              <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Custom range</option>
              </select>
            </label>

            <div className="space-y-3">
              {[
                "Assessment history",
                "Ambulatory summary",
                "Authorised wearable summaries",
                "Professional notes",
              ].map((item, index) => (
                <label key={item} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked={index !== 2}
                  />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>

            <button className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Generate draft report
            </button>
          </div>
        </Panel>

        <Panel title="Professional review required">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
            <p className="font-medium">Reports remain professional documents.</p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              PsyLattice may organise authorised information into a draft,
              but a qualified professional must review and finalise the
              report. The system does not autonomously generate definitive
              diagnosis or treatment recommendations.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Previous reports">
        <div className="divide-y divide-slate-100">
          {[
            ["02 Aug 2026", "Monitoring summary", "PDF", "Finalised"],
            [
              "26 Jul 2026",
              "Initial assessment summary",
              "PDF",
              "Finalised",
            ],
          ].map(([date, name, format, status]) => (
            <div
              key={date}
              className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr_100px_auto] sm:items-center"
            >
              <span className="text-xs text-slate-400">{date}</span>
              <span className="text-sm font-medium">{name}</span>
              <span className="text-xs text-slate-500">{format}</span>
              <Status type="success">{status}</Status>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   PERMISSIONS
   ========================================================= */

function Permissions() {
  return (
    <div className="space-y-5">
      <Panel title="Client-authorised data">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Self-assessment responses",
              "Available for current support pathway",
              "Authorised",
            ],
            [
              "Ambulatory assessment",
              "Momentary responses + context",
              "Authorised",
            ],
            [
              "Sleep",
              "Duration and timing summaries",
              "Authorised",
            ],
            ["Activity", "Daily activity summaries", "Authorised"],
            [
              "Resting heart rate",
              "Daily summary",
              "Authorised",
            ],
            ["Heart-rate variability", "Not shared", "Unavailable"],
            [
              "AI Guide conversations",
              "Not shared with clinician by default",
              "Private",
            ],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status
                type={
                  status === "Authorised"
                    ? "success"
                    : status === "Private"
                      ? "accent"
                      : "neutral"
                }
              >
                {status}
              </Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Minimum necessary access">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="font-medium">
            Professional access should be intentionally narrow.
          </p>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
            Clinicians should only see assigned clients and data sources
            authorised for the relevant workflow. Permission changes should
            later take effect immediately and be included in the audit trail.
          </p>
        </div>
      </Panel>

      <Panel title="Sharing history">
        <div className="divide-y divide-slate-100">
          {[
            [
              "09 Aug · 12:42",
              "Client removed HRV sharing permission",
            ],
            [
              "26 Jul · 10:01",
              "Client authorised ambulatory-data access",
            ],
            [
              "26 Jul · 10:01",
              "Client authorised assessment sharing",
            ],
          ].map(([date, action]) => (
            <div
              key={`${date}-${action}`}
              className="flex gap-5 py-4 first:pt-0 last:pb-0"
            >
              <span className="w-28 shrink-0 text-xs text-slate-400">
                {date}
              </span>

              <span className="text-sm">{action}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   SETTINGS
   ========================================================= */

function Settings() {
  return (
    <div className="space-y-5">
      <Panel title="Professional account">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Professional verification",
              "Counselling psychologist",
              "Verified",
            ],
            [
              "Organisation",
              "University Wellbeing Service",
              "Connected",
            ],
            ["Assigned service", "Student counselling", "Active"],
          ].map(([name, value, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{value}</p>
              </div>

              <Status type="success">{status}</Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Clinical workflow">
        <div className="divide-y divide-slate-100">
          {[
            [
              "New client assignment",
              "Coordinator approval required",
              "Controlled",
            ],
            [
              "Automated diagnosis",
              "Not available in PsyLattice",
              "Disabled",
            ],
            [
              "Automated treatment selection",
              "Not available in PsyLattice",
              "Disabled",
            ],
            [
              "After-hours messaging",
              "Show service availability notice",
              "Enabled",
            ],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status>{status}</Status>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Security">
        <div className="divide-y divide-slate-100">
          {[
            ["Two-factor authentication", "Enabled", "Secure"],
            [
              "Sensitive-action logging",
              "All relevant clinical actions",
              "Enabled",
            ],
            ["Session timeout", "15 minutes inactive", "Policy"],
            ["Last account access", "Today · 08:42", "Expected"],
          ].map(([name, detail, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>

              <Status type={status === "Secure" ? "success" : "neutral"}>
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
   MAIN CLINICIAN WORKSPACE
   ========================================================= */

export default function ClinicianWorkspace() {
  const [screen, setScreen] = useState<Screen>("dashboard");

  const activeNavigation = navigation.find((item) => item.id === screen)!;

  const descriptions: Record<Screen, string> = {
    dashboard:
      "A concise view of your caseload, professional reviews, appointments and follow-up tasks.",

    clients:
      "View only clients assigned to you or explicitly shared through an authorised professional workflow.",

    overview:
      "One longitudinal view across assessments, real-world monitoring and authorised contextual information.",

    assessments:
      "Review repeated questionnaire results alongside professional interpretation.",

    ambulatory:
      "Review momentary reports with their time and real-world context.",

    wearables:
      "View only physiological and behavioural summaries explicitly authorised by the client.",

    timeline:
      "Bring assessments, ambulatory observations and professional actions together across time.",

    notes:
      "Create professional records with authorship and future audit visibility.",

    care:
      "Document human professional decisions, referrals and follow-up pathways.",

    appointments:
      "Manage upcoming sessions and outstanding professional tasks.",

    messages:
      "Communicate with clients within an authorised professional workflow.",

    reports:
      "Prepare structured professional summaries from authorised information.",

    permissions:
      "Review exactly which client data sources you are authorised to access.",

    settings:
      "Manage professional workflow, verification and security settings.",
  };

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return <Dashboard changeScreen={setScreen} />;

      case "clients":
        return <Clients changeScreen={setScreen} />;

      case "overview":
        return <ClientOverview changeScreen={setScreen} />;

      case "assessments":
        return <Assessments />;

      case "ambulatory":
        return <Ambulatory />;

      case "wearables":
        return <Wearables />;

      case "timeline":
        return <Timeline />;

      case "notes":
        return <Notes />;

      case "care":
        return <CarePathway />;

      case "appointments":
        return <Appointments />;

      case "messages":
        return <Messages />;

      case "reports":
        return <Reports />;

      case "permissions":
        return <Permissions />;

      case "settings":
        return <Settings />;

      default:
        return <Dashboard changeScreen={setScreen} />;
    }
  }

  const groups: ("Clinical" | "Monitoring" | "Care" | "Governance")[] = [
    "Clinical",
    "Monitoring",
    "Care",
    "Governance",
  ];

  return (
    <main className="min-h-screen bg-[#f6f8f8] text-slate-950">
      {/* TOPBAR */}

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
                PsyLattice Clinical
              </p>
              <p className="text-xs text-slate-400">
                Professional workspace
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Status type="accent">Verified clinician</Status>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold">
              AS
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
            onChange={(event) =>
              setScreen(event.target.value as Screen)
            }
            className="max-w-[210px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm lg:hidden"
          >
            {navigation.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* SIDEBAR */}

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
              Clinical prototype
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Every client name, assessment result and professional record
              shown here is fictional demo data.
            </p>
          </div>
        </aside>

        {/* CONTENT */}

        <section className="min-w-0 p-5 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1450px]">
            <div className="mb-7">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Status type="accent">Clinician workspace</Status>

                <span className="text-xs text-slate-400">
                  Frontend prototype
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                {screen === "dashboard"
                  ? "Good afternoon, Dr. Sharma."
                  : activeNavigation.label}
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