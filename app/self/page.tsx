"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

type Screen =
  | "dashboard"
  | "ai"
  | "assessments"
  | "monitoring"
  | "regulation"
  | "progress"
  | "wearables"
  | "notifications"
  | "privacy";

const navigation: {
  id: Screen;
  label: string;
}[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "ai", label: "AI Guide" },
  { id: "assessments", label: "Self-Assessments" },
  { id: "monitoring", label: "Daily Monitoring" },
  { id: "regulation", label: "Self-Regulation" },
  { id: "progress", label: "Progress" },
  { id: "wearables", label: "Wearables" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & Sharing" },
];

function Icon({
  children,
  dark = false,
}: {
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
        dark
          ? "bg-slate-950 text-white"
          : "border border-cyan-100 bg-cyan-50 text-cyan-800"
      }`}
    >
      {children}
    </div>
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

      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

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
        <h2 className="font-semibold text-slate-950">{title}</h2>

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
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
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
          label="Today's check-ins"
          value="2 / 3"
          detail="One remaining today"
        />

        <StatCard
          label="Current stress"
          value="5.2 / 10"
          detail="Average today"
        />

        <StatCard
          label="Active plan"
          value="Day 8"
          detail="14-day regulation plan"
        />

        <StatCard
          label="Wearable connection"
          value="Connected"
          detail="Sleep + activity"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Panel
          title="Today"
          description="Your assessments and regulation activities."
        >
          <div className="divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-5 py-4 pt-0">
              <div className="flex items-center gap-3">
                <Icon>✓</Icon>

                <div>
                  <p className="font-medium">Morning check-in</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Completed at 09:05
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Done
              </span>
            </div>

            <div className="flex items-center justify-between gap-5 py-4">
              <div className="flex items-center gap-3">
                <Icon>○</Icon>

                <div>
                  <p className="font-medium">Midday check-in</p>
                  <p className="mt-1 text-sm text-slate-500">
                    A short momentary assessment
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => changeScreen("monitoring")}
                className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
              >
                Check in
              </button>
            </div>

            <div className="flex items-center justify-between gap-5 py-4 pb-0">
              <div className="flex items-center gap-3">
                <Icon>↻</Icon>

                <div>
                  <p className="font-medium">Evening reflection</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Scheduled for 20:30
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-400">Later</span>
            </div>
          </div>
        </Panel>

        <Panel title="Latest self-assessment">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-xs text-slate-400">Perceived Stress</p>

            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xl font-semibold">Moderate range</p>

              <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                Score 21
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Completed four days ago. This is a self-assessment result and
              not a clinical diagnosis.
            </p>

            <button
              type="button"
              onClick={() => changeScreen("assessments")}
              className="mt-5 flex items-center gap-2 text-sm font-semibold"
            >
              View assessments
              <ArrowIcon />
            </button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Ask PsyLattice AI">
          <div className="flex gap-4">
            <Icon dark>AI</Icon>

            <div>
              <p className="font-medium">Not sure what to assess?</p>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Describe what you have been experiencing. The AI Guide can
                help you explore an appropriate self-assessment or monitoring
                approach.
              </p>

              <button
                type="button"
                onClick={() => changeScreen("ai")}
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open AI Guide
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Your self-regulation plan">
          <p className="font-medium">Reduce study-related stress</p>

          <p className="mt-1 text-sm text-slate-500">
            Two-week plan combining check-ins, reminders and short regulation
            practices.
          </p>

          <div className="mt-5 space-y-4">
            <ProgressBar
              label="Plan completion"
              value={57}
              text="8 of 14 days"
            />

            <ProgressBar
              label="Daily consistency"
              value={74}
              text="74%"
            />
          </div>

          <button
            type="button"
            onClick={() => changeScreen("regulation")}
            className="mt-5 flex items-center gap-2 text-sm font-semibold"
          >
            Open plan
            <ArrowIcon />
          </button>
        </Panel>
      </div>

      <Panel title="Recent pattern">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <div className="flex items-start gap-4">
            <Icon>↗</Icon>

            <div>
              <p className="font-medium">Something worth noticing</p>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Your higher stress check-ins have recently appeared after
                longer uninterrupted study periods. This is only a pattern in
                your recent data — not evidence of cause.
              </p>

              <button
                type="button"
                onClick={() => changeScreen("progress")}
                className="mt-4 text-sm font-semibold text-cyan-900"
              >
                Review the underlying data
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   AI GUIDE
   ========================================================= */

function AIGuide({
  changeScreen,
}: {
  changeScreen: (screen: Screen) => void;
}) {
  type GuideMessage = {
    from: "ai" | "user";
    text: string;
  };

  const [message, setMessage] = useState("");

  const [messages, setMessages] =
    useState<GuideMessage[]>([
      {
        from: "ai",
        text:
          "Hi. I’m the PsyLattice AI Guide. I can help you explore what you may want to assess, reflect on patterns you’ve been noticing, or understand psychological concepts. What would you like to explore?",
      },
    ]);

  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  async function sendMessage() {
    const text = message.trim();

    if (!text || sending) {
      return;
    }

    const userMessage: GuideMessage = {
      from: "user",
      text,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    // Show the user's message immediately.
    setMessages(updatedMessages);

    // Clear the text box.
    setMessage("");

    // Show loading state.
    setSending(true);
    setChatError("");

    try {
      const response = await fetch(
        "/api/ai-guide",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            messages: updatedMessages.map(
              (item) => ({
                role:
                  item.from === "user"
                    ? "user"
                    : "assistant",

                content: item.text,
              })
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "The AI Guide could not respond."
        );
      }

      const aiMessage: GuideMessage = {
        from: "ai",
        text: data.reply,
      };

      setMessages((previous) => [
        ...previous,
        aiMessage,
      ]);
    } catch (error) {
      console.error(
        "AI Guide request failed:",
        error
      );

      setChatError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      {/* MAIN CHAT */}
      <Panel
        title="PsyLattice AI Guide"
        description="A conversational guide for assessment navigation and reflection."
      >
        <div className="flex min-h-[560px] flex-col">
          {/* Messages */}
          <div className="max-h-[520px] flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((item, index) =>
              item.from === "ai" ? (
                <div
                  key={index}
                  className="flex max-w-[88%] gap-3"
                >
                  <Icon dark>AI</Icon>

                  <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {item.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  key={index}
                  className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-slate-950 px-4 py-3 text-white"
                >
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {item.text}
                  </p>
                </div>
              )
            )}

            {/* Thinking indicator */}
            {sending && (
              <div className="flex max-w-[88%] gap-3">
                <Icon dark>AI</Icon>

                <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />

                    <span className="ml-1 text-xs text-slate-400">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {chatError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">
                  {chatError}
                </p>
              </div>
            )}
          </div>

          {/* Safety line */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-center text-[11px] leading-5 text-slate-400">
              PsyLattice AI Guide provides
              informational and navigational
              support. It does not provide
              diagnosis, treatment, or emergency
              services.
            </p>
          </div>

          {/* Message input */}
          <div className="mt-4 flex items-end gap-2">
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Tell PsyLattice what you've been noticing..."
              rows={2}
              maxLength={4000}
              disabled={sending}
              className="min-h-[52px] min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-50"
            />

            <button
              type="button"
              onClick={() =>
                void sendMessage()
              }
              disabled={
                sending || !message.trim()
              }
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            Press Enter to send · Shift + Enter
            for a new line
          </p>
        </div>
      </Panel>

      {/* RIGHT SIDEBAR */}
      <div className="space-y-5">
        <Panel title="What the AI Guide can do">
          <div className="space-y-5">
            {[
              [
                "Explore self-assessments",
                "Help identify areas you may want to assess.",
              ],
              [
                "Suggest monitoring",
                "Discuss when repeated daily check-ins may help reveal patterns.",
              ],
              [
                "Explain concepts",
                "Explain psychological ideas in clear, accessible language.",
              ],
              [
                "Prepare for therapy",
                "Help organise information you may choose to discuss with a qualified professional.",
              ],
            ].map(([title, text]) => (
              <div
                key={title}
                className="flex gap-3"
              >
                <span className="mt-1 text-cyan-700">
                  <CheckIcon />
                </span>

                <div>
                  <p className="text-sm font-medium">
                    {title}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Assessment catalogue">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
            <p className="text-sm font-medium text-cyan-950">
              Assessment recommendations are
              being developed carefully.
            </p>

            <p className="mt-2 text-xs leading-5 text-cyan-900/70">
              The AI Guide can currently help you
              identify an area to explore. Direct
              questionnaire recommendations will
              later be connected to PsyLattice's
              approved assessment catalogue.
            </p>

            <button
              type="button"
              onClick={() =>
                changeScreen("assessments")
              }
              className="mt-4 rounded-xl border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold text-cyan-900"
            >
              Browse assessments
            </button>
          </div>
        </Panel>

        <Panel title="Important boundary">
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-sm leading-6 text-amber-900">
              The AI Guide supports navigation,
              education, and reflection. It does
              not diagnose psychiatric disorders,
              prescribe treatment, or replace a
              qualified professional.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   ASSESSMENTS
   ========================================================= */

function Assessments() {
  const assessments = [
    {
      name: "Perceived Stress Scale",
      category: "Stress",
      time: "~3 min",
      suggested: true,
      description:
        "A structured self-report measure focused on perceived stress.",
    },
    {
      name: "Wellbeing Check",
      category: "Wellbeing",
      time: "~2 min",
      suggested: false,
      description:
        "A brief reflection on general positive wellbeing and daily functioning.",
    },
    {
      name: "Sleep Self-Check",
      category: "Sleep",
      time: "~4 min",
      suggested: false,
      description:
        "Review recent sleep quality and habits alongside optional wearable context.",
    },
    {
      name: "Emotion Regulation Check",
      category: "Regulation",
      time: "~5 min",
      suggested: false,
      description:
        "Reflect on common strategies used when responding to emotional experiences.",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[
          "Suggested for you",
          "Stress",
          "Wellbeing",
          "Sleep",
          "Emotion regulation",
        ].map((item, index) => (
          <button
            key={item}
            type="button"
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              index === 0
                ? "border-cyan-200 bg-cyan-50 text-cyan-800"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {assessments.map((item) => (
          <article
            key={item.name}
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  item.suggested
                    ? "bg-cyan-50 text-cyan-800"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                {item.suggested ? "AI suggested" : item.category}
              </span>

              <span className="text-xs text-slate-400">{item.time}</span>
            </div>

            <h2 className="mt-5 text-xl font-semibold">{item.name}</h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {item.description}
            </p>

            <button
              type="button"
              className={`mt-6 rounded-xl px-4 py-2.5 text-sm font-semibold ${
                item.suggested
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700"
              }`}
            >
              Start assessment
            </button>
          </article>
        ))}
      </div>

      <Panel title="Completed assessments">
        <div className="divide-y divide-slate-100">
          {[
            ["Perceived Stress Scale", "05 Aug 2026", "Score 21"],
            ["Wellbeing Check", "28 Jul 2026", "Completed"],
            ["Sleep Self-Check", "19 Jul 2026", "Completed"],
          ].map(([name, date, result]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{date}</p>
              </div>

              <span className="text-xs font-medium text-cyan-800">
                {result}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   MONITORING
   ========================================================= */

function Monitoring() {
  const [stress, setStress] = useState(6);
  const [activity, setActivity] = useState("Studying");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Protocol" value="7 days" detail="Stress monitoring" />
        <StatCard label="Prompts" value="3 / day" detail="Brief assessments" />
        <StatCard label="Completed" value="82%" detail="Past 5 days" />
        <StatCard label="Next prompt" value="16:20" detail="Afternoon window" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel
          title="Momentary check-in"
          description="Usually takes less than one minute."
        >
          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium">
                How stressed do you feel right now?
              </p>

              <span className="rounded-lg bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800">
                {stress} / 10
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="10"
              value={stress}
              onChange={(event) => setStress(Number(event.target.value))}
              className="mt-5 w-full accent-cyan-800"
            />
          </div>

          <div className="mt-7">
            <p className="font-medium">What are you doing right now?</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {["Studying", "Resting", "Socialising", "Commuting"].map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActivity(item)}
                    className={`rounded-full border px-3 py-2 text-xs font-medium ${
                      activity === item
                        ? "border-cyan-700 bg-cyan-50 text-cyan-800"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>

          <label className="mt-7 block">
            <span className="font-medium">Optional note</span>

            <textarea
              placeholder="Anything important about this moment?"
              className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-cyan-700"
            />
          </label>

          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Save check-in
          </button>
        </Panel>

        <Panel title="Your monitoring schedule">
          <div className="divide-y divide-slate-100">
            {[
              ["Morning", "08:00–10:00", "One random prompt"],
              ["Afternoon", "15:00–17:00", "One random prompt"],
              ["Evening", "20:00–22:00", "Reflection"],
            ].map(([title, time, description]) => (
              <div
                key={title}
                className="flex items-center justify-between gap-4 py-5 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>

                <span className="text-xs font-medium text-slate-400">
                  {time}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-sm leading-6 text-slate-500">
              PsyLattice can vary the exact notification time inside your
              selected windows, helping capture ordinary experiences rather
              than only planned moments.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   SELF REGULATION
   ========================================================= */

function Regulation() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Current plan">
          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
            Day 8 of 14
          </span>

          <h2 className="mt-4 text-2xl font-semibold">
            Reduce study-related stress
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            A simple regulation plan built around your self-assessment and
            recent check-in pattern.
          </p>

          <div className="mt-7">
            <ProgressBar
              label="Overall completion"
              value={57}
              text="8 of 14 days"
            />
          </div>

          <div className="mt-7 divide-y divide-slate-100">
            {[
              ["2-minute regulation practice", "6 of 8 days", "Daily"],
              ["Short movement break", "5 of 8 days", "Daily"],
              ["Evening reflection", "7 of 8 days", "Daily"],
            ].map(([title, completion, cadence]) => (
              <div
                key={title}
                className="flex justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-xs text-slate-400">{completion}</p>
                </div>

                <span className="text-xs text-slate-400">{cadence}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Today">
          <div className="divide-y divide-slate-100">
            {[
              ["Reset", "2-minute paced breathing", "2 min"],
              ["Move", "Take a short movement break", "5 min"],
              ["Reflect", "What helped most today?", "Tonight"],
            ].map(([title, description, duration]) => (
              <div
                key={title}
                className="flex justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>

                <span className="text-xs text-slate-400">{duration}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Start today's practice
          </button>
        </Panel>
      </div>

      <Panel title="AI-assisted adaptation">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <p className="font-medium">Adjust the plan, not the diagnosis.</p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            The AI Guide could later help you change reminder timing, choose
            another regulation exercise or add a self-check based on your
            preferences and routine.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   PROGRESS
   ========================================================= */

function Progress() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Stress baseline"
          value="21"
          detail="Latest assessment"
        />

        <StatCard
          label="Daily average"
          value="5.1 / 10"
          detail="Past 7 days"
        />

        <StatCard
          label="Check-in consistency"
          value="82%"
          detail="Completed prompts"
        />

        <StatCard label="Plan progress" value="57%" detail="8 of 14 days" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="What changed?">
          <div className="space-y-6">
            <ProgressBar
              label="Daily stress average"
              value={51}
              text="5.1 / 10"
            />

            <ProgressBar
              label="Regulation consistency"
              value={74}
              text="74%"
            />

            <ProgressBar
              label="Sleep target consistency"
              value={63}
              text="63%"
            />
          </div>
        </Panel>

        <Panel title="Patterns to inspect">
          <div className="space-y-5">
            {[
              [
                "Study duration",
                "Higher stress often follows longer uninterrupted study periods.",
              ],
              [
                "Sleep",
                "Shorter sleep nights sometimes precede higher morning stress.",
              ],
              [
                "Movement",
                "Some check-ins following activity are associated with lower reported stress.",
              ],
            ].map(([title, description]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-700" />

                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            PsyLattice should describe associations conservatively. These
            patterns do not establish causation.
          </p>
        </Panel>
      </div>

      <Panel title="Assessment timeline">
        <div className="space-y-6">
          {[
            [
              "05 Aug 2026",
              "Perceived Stress Scale",
              "Score 21 · moderate screening range",
            ],
            [
              "28 Jul 2026",
              "Wellbeing Check",
              "Personal baseline recorded",
            ],
            [
              "19 Jul 2026",
              "Sleep Self-Check",
              "Initial sleep baseline recorded",
            ],
          ].map(([date, title, description], index) => (
            <div key={`${date}-${index}`} className="flex gap-4">
              <div className="mt-1 flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-cyan-700" />

                {index < 2 && (
                  <div className="mt-2 h-12 w-px bg-slate-200" />
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400">{date}</p>
                <p className="mt-1 font-medium">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{description}</p>
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
      <Panel
        title="Connected wearable data"
        description="Wearable information provides additional context to your self-reports."
      >
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm leading-6 text-slate-500">
            You control which signals PsyLattice can use. Wearable data does
            not independently determine your psychological state.
          </p>
        </div>

        <div className="mt-5 divide-y divide-slate-100">
          {[
            ["Sleep", "Duration and timing summaries", "Connected"],
            ["Activity", "Steps and activity summaries", "Connected"],
            ["Resting heart rate", "Daily summary", "Connected"],
            ["Heart-rate variability", "Not currently shared", "Off"],
          ].map(([name, description, status]) => (
            <div
              key={name}
              className="flex items-center justify-between gap-5 py-4"
            >
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  status === "Connected"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Today's signals">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Sleep" value="6h 42m" detail="Last night" />
            <StatCard label="Activity" value="6,820" detail="Steps today" />
          </div>
        </Panel>

        <Panel title="How PsyLattice uses them">
          <div className="space-y-5">
            {[
              [
                "Context",
                "Compare self-reported experiences with authorised daily signals.",
              ],
              [
                "Reflection",
                "Help you inspect recurring patterns across time.",
              ],
              [
                "Reminders",
                "Potentially time nudges around routines you explicitly enable.",
              ],
              [
                "Therapist summary",
                "Include selected summaries only when you choose.",
              ],
            ].map(([title, description]) => (
              <div key={title}>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function Notifications() {
  return (
    <div className="space-y-5">
      <Panel title="Your reminder rhythm">
        <div className="divide-y divide-slate-100">
          {[
            ["Morning check-in", "One prompt between 08:00–10:00"],
            ["Afternoon check-in", "One prompt between 15:00–17:00"],
            ["Evening reflection", "20:30"],
            ["Self-regulation reminder", "After a long study period"],
          ].map(([title, description]) => (
            <div
              key={title}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <div className="relative h-6 w-11 rounded-full bg-cyan-700">
                <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Quiet hours">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Start</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>22:30</option>
              <option>23:00</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">End</span>

            <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option>08:00</option>
              <option>07:30</option>
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-2xl bg-cyan-50 p-4">
          <p className="font-medium text-cyan-950">Useful, not intrusive.</p>

          <p className="mt-2 text-sm leading-6 text-cyan-900/70">
            You remain in control of reminder timing, frequency and quiet
            hours.
          </p>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   PRIVACY
   ========================================================= */

function Privacy() {
  return (
    <div className="space-y-5">
      <Panel title="Your privacy">
        <div className="divide-y divide-slate-100">
          {[
            [
              "Self-assessment data",
              "Private to your personal account",
              "Private",
            ],
            [
              "AI Guide conversations",
              "Used only within your personal workflow",
              "Private",
            ],
            [
              "Wearable signals",
              "Sleep, activity and resting heart rate",
              "3 signals",
            ],
            [
              "Therapist sharing",
              "No automatic sharing",
              "You control it",
            ],
          ].map(([title, description, status]) => (
            <div
              key={title}
              className="flex items-center justify-between gap-5 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-slate-400">{description}</p>
              </div>

              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                {status}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Therapist sharing">
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
          <p className="font-medium">
            Nothing is automatically sent to a therapist.
          </p>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            You choose which assessments, progress summaries, ambulatory
            trends or wearable summaries appear in a therapist summary.
          </p>

          <button
            type="button"
            className="mt-5 rounded-xl border border-cyan-200 bg-white px-4 py-2.5 text-sm font-semibold text-cyan-900"
          >
            Prepare therapist summary
          </button>
        </div>
      </Panel>

      <Panel title="Data controls">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-xl border border-slate-200 p-4 text-left"
          >
            <p className="text-sm font-medium">Download my data</p>
            <p className="mt-1 text-xs text-slate-400">
              Request a portable copy of your PsyLattice information.
            </p>
          </button>

          <button
            type="button"
            className="rounded-xl border border-slate-200 p-4 text-left"
          >
            <p className="text-sm font-medium">Consent centre</p>
            <p className="mt-1 text-xs text-slate-400">
              Review optional data and sharing permissions.
            </p>
          </button>
        </div>
      </Panel>
    </div>
  );
}

/* =========================================================
   MAIN SELF WORKSPACE
   ========================================================= */

export default function SelfWorkspace() {
  const router = useRouter();

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [fullName, setFullName] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/signin");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Could not load profile:", profileError.message);

        setFullName(user.email?.split("@")[0] || "User");
        return;
      }

      setFullName(
        profile?.full_name?.trim() ||
          user.email?.split("@")[0] ||
          "User",
      );
    }

    void loadProfile();
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out failed:", error.message);
      setSigningOut(false);
      return;
    }

    router.replace("/signin");
    router.refresh();
  }

  const firstName =
    fullName.trim().split(/\s+/)[0] || "there";

  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "PL";

  const activeNavigation = navigation.find(
    (item) => item.id === screen,
  )!;

  function renderScreen() {
    switch (screen) {
      case "dashboard":
        return <Dashboard changeScreen={setScreen} />;

      case "ai":
        return <AIGuide changeScreen={setScreen} />;

      case "assessments":
        return <Assessments />;

      case "monitoring":
        return <Monitoring />;

      case "regulation":
        return <Regulation />;

      case "progress":
        return <Progress />;

      case "wearables":
        return <Wearables />;

      case "notifications":
        return <Notifications />;

      case "privacy":
        return <Privacy />;

      default:
        return <Dashboard changeScreen={setScreen} />;
    }
  }

  function getDescription() {
    switch (screen) {
      case "dashboard":
        return "A clear view of your self-assessments, daily monitoring and self-regulation.";

      case "ai":
        return "Explore suitable self-checks and monitoring approaches through guided conversation.";

      case "assessments":
        return "Structured questionnaires for personal reflection and repeated self-checks.";

      case "monitoring":
        return "Short assessments delivered during everyday life.";

      case "regulation":
        return "Turn what you notice into simple, trackable actions.";

      case "progress":
        return "Review changes across assessments, check-ins and daily routines.";

      case "wearables":
        return "Optionally combine your self-reports with authorised wearable summaries.";

      case "notifications":
        return "Control how and when PsyLattice reminds you to check in.";

      case "privacy":
        return "Control your data and exactly what you choose to share.";
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f6f8f8] text-slate-950">
      {/* TOP BAR */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-20 items-center justify-between gap-4 px-5 lg:px-7">
          {/* Logo */}

   <div>
  <PsyLatticeLogo size={38} />

  <p className="mt-0 pl-[50px] text-xs text-slate-400">
    Personal workspace
  </p>
</div>

          {/* Desktop account controls */}

          <div className="hidden items-center gap-3 sm:flex">
            <span className="rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800">
              For myself
            </span>

            <div
              title={fullName || "PsyLattice user"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
            >
              {initials}
            </div>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>

          {/* Mobile navigation */}

          <select
            value={screen}
            onChange={(event) =>
              setScreen(event.target.value as Screen)
            }
            className="max-w-[190px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm lg:hidden"
          >
            {navigation.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div
  className={`grid h-[calc(100vh-80px)] transition-[grid-template-columns] duration-300 ${
    sidebarCollapsed
      ? "lg:grid-cols-[80px_minmax(0,1fr)]"
      : "lg:grid-cols-[240px_minmax(0,1fr)]"
  }`}
>
        {/* SIDEBAR */}

        <aside className="hidden h-full overflow-y-auto border-r border-slate-200 bg-white lg:flex lg:flex-col">
  {/* Collapse button */}
  <div
    className={`flex border-b border-slate-100 p-3 ${
      sidebarCollapsed
        ? "justify-center"
        : "justify-end"
    }`}
  >
    <button
      type="button"
      onClick={() =>
        setSidebarCollapsed(
          (previous) => !previous
        )
      }
      title={
        sidebarCollapsed
          ? "Expand sidebar"
          : "Collapse sidebar"
      }
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className={`h-4 w-4 transition-transform duration-300 ${
          sidebarCollapsed
            ? "rotate-180"
            : ""
        }`}
        aria-hidden="true"
      >
        <path
          d="M12.5 5.5 8 10l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  </div>

  {/* Personal space */}
  {!sidebarCollapsed && (
    <p className="px-7 pb-3 pt-5 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
      Personal space
    </p>
  )}

  <nav
    className={`space-y-1 ${
      sidebarCollapsed
        ? "px-3 pt-4"
        : "px-4"
    }`}
  >
    {navigation.slice(0, 8).map((item) => {
      const active = item.id === screen;

      return (
        <button
          key={item.id}
          type="button"
          title={
            sidebarCollapsed
              ? item.label
              : undefined
          }
          onClick={() => setScreen(item.id)}
          className={`flex w-full items-center rounded-xl py-2.5 text-sm transition ${
            sidebarCollapsed
              ? "justify-center px-2"
              : "gap-3 px-3 text-left"
          } ${
            active
              ? "bg-cyan-50 font-semibold text-cyan-900"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center ${
              sidebarCollapsed
                ? "h-8 w-8 rounded-lg text-[11px] font-semibold"
                : ""
            } ${
              sidebarCollapsed && active
                ? "bg-cyan-100 text-cyan-900"
                : ""
            }`}
          >
            {sidebarCollapsed ? (
              item.id === "dashboard" ? (
                "D"
              ) : item.id === "ai" ? (
                "AI"
              ) : item.id === "assessments" ? (
                "A"
              ) : item.id === "monitoring" ? (
                "M"
              ) : item.id === "regulation" ? (
                "R"
              ) : item.id === "progress" ? (
                "P"
              ) : item.id === "wearables" ? (
                "W"
              ) : (
                "N"
              )
            ) : (
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  active
                    ? "bg-cyan-700"
                    : "bg-slate-300"
                }`}
              />
            )}
          </span>

          {!sidebarCollapsed && (
  <div className="flex items-center gap-2">
    <span>{item.label}</span>

    {item.id === "ai" && (
      <span className="rounded-full border border-yellow-500 bg-yellow-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-yellow-500">
        New
      </span>
    )}
  </div>
)}
        </button>
      );
    })}
  </nav>

  <div className="mx-4 my-5 h-px bg-slate-100" />

  {/* Account */}
  {!sidebarCollapsed && (
    <p className="px-7 pb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-400">
      Account
    </p>
  )}

  <div
    className={
      sidebarCollapsed
        ? "px-3"
        : "px-4"
    }
  >
    <button
      type="button"
      title={
        sidebarCollapsed
          ? "Privacy & Sharing"
          : undefined
      }
      onClick={() => setScreen("privacy")}
      className={`flex w-full items-center rounded-xl py-2.5 text-sm ${
        sidebarCollapsed
          ? "justify-center px-2"
          : "gap-3 px-3 text-left"
      } ${
        screen === "privacy"
          ? "bg-cyan-50 font-semibold text-cyan-900"
          : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {sidebarCollapsed ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold">
          P
        </span>
      ) : (
        <>
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              screen === "privacy"
                ? "bg-cyan-700"
                : "bg-slate-300"
            }`}
          />

          Privacy & Sharing
        </>
      )}
    </button>
  </div>

  {/* Bottom info card */}
  {!sidebarCollapsed && (
    <div className="mt-auto p-4">
      <div className="rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-medium text-cyan-200">
          PsyLattice
        </p>

        <p className="mt-2 text-xs leading-5 text-slate-400">
          The account itself is now authenticated.
          Assessment and monitoring information
          shown here is still demo data.
        </p>
      </div>
    </div>
  )}
</aside>

        {/* CONTENT */}

        <section className="min-w-0 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[11px] font-medium text-cyan-800">
                    Personal / Self
                  </span>

                  <span className="text-xs text-slate-400">
                    Authenticated workspace
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                  {screen === "dashboard"
                    ? `Good afternoon, ${firstName}.`
                    : activeNavigation.label}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {getDescription()}
                </p>
              </div>
            </div>

            {renderScreen()}
          </div>
        </section>
      </div>
    </main>
  );
}