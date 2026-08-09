"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Workspace = "self" | "researcher" | "clinician";

const workspaces = [
  {
    id: "self" as Workspace,
    label: "For Myself",
    eyebrow: "Personal",
    description:
      "Self-assessments, everyday monitoring, AI guidance, self-regulation and progress tracking.",
    features: [
      "Self-assessment questionnaires",
      "Ambulatory assessments",
      "AI assessment guide",
      "Self-regulation tools",
      "Wearable integration",
    ],
  },
  {
    id: "researcher" as Workspace,
    label: "Researcher",
    eyebrow: "Research",
    description:
      "Create studies, deploy questionnaires and ambulatory protocols, manage participants and analyse research data.",
    features: [
      "Questionnaire library",
      "Study builder",
      "EMA / ESM protocols",
      "Participant management",
      "Research data exports",
    ],
  },
  {
    id: "clinician" as Workspace,
    label: "Clinician",
    eyebrow: "Professional",
    description:
      "Review authorised client assessments, longitudinal monitoring and professional support workflows.",
    features: [
      "Client dashboard",
      "Assessment monitoring",
      "Ambulatory data",
      "Professional notes",
      "Follow-up and reporting",
    ],
  },
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

export default function SignInPage() {
  const router = useRouter();

  const [workspace, setWorkspace] = useState<Workspace>("self");

  const selected = workspaces.find((item) => item.id === workspace)!;

  function handleContinue() {
    if (workspace === "self") {
      router.push("/self");
    }

    if (workspace === "researcher") {
      router.push("/researcher");
    }

    if (workspace === "clinician") {
      router.push("/clinician");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-950">
      {/* Header */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-lg font-semibold text-cyan-800">
              Ψ
            </div>

            <div>
              <div className="font-semibold">PsyLattice</div>

              <div className="text-xs text-slate-400">
                Psychological measurement, connected.
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            Back to website
          </Link>
        </div>
      </header>

      {/* Main */}

      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl gap-12 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        {/* Left */}

        <div className="flex flex-col justify-center">
          <div className="max-w-lg">
            <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800">
              Secure workspace entry
            </span>

            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Choose your
              <br />
              PsyLattice workspace.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              PsyLattice separates personal, research and professional
              workflows from the moment you enter the platform.
            </p>
          </div>

          <div className="mt-10 space-y-5">
            <div className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-800">
                <CheckIcon />
              </div>

              <div>
                <p className="font-medium">Distinct workspaces</p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Personal users do not see research or clinical tools.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-800">
                <CheckIcon />
              </div>

              <div>
                <p className="font-medium">Role-based architecture</p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Real role verification and permissions will later be enforced
                  securely by the backend.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-800">
                <CheckIcon />
              </div>

              <div>
                <p className="font-medium">Privacy-conscious design</p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Psychological and research information stays within its
                  authorised workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              Prototype notice
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Workspace selection currently demonstrates the intended user
              experience only. Selecting “Clinician” or “Researcher” does not
              yet grant verified professional permissions.
            </p>
          </div>
        </div>

        {/* Sign-in card */}

        <div className="flex items-center">
          <div className="w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800">
                Sign in
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                What are you using PsyLattice for?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select your workspace before entering your account.
              </p>
            </div>

            {/* Workspace choices */}

            <div className="mt-7 grid gap-3">
              {workspaces.map((item) => {
                const active = workspace === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWorkspace(item.id)}
                    className={`w-full rounded-2xl border p-5 text-left transition ${
                      active
                        ? "border-cyan-700 bg-cyan-50/70 ring-1 ring-cyan-700"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className={`text-xs font-medium uppercase tracking-[0.13em] ${
                            active ? "text-cyan-800" : "text-slate-400"
                          }`}
                        >
                          {item.eyebrow}
                        </p>

                        <h3 className="mt-1 text-lg font-semibold">
                          {item.label}
                        </h3>
                      </div>

                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          active
                            ? "border-cyan-700"
                            : "border-slate-300"
                        }`}
                      >
                        {active && (
                          <div className="h-2.5 w-2.5 rounded-full bg-cyan-700" />
                        )}
                      </div>
                    </div>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Selected workspace details */}

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-400">
                {selected.label} includes
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {selected.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <span className="text-cyan-700">
                      <CheckIcon />
                    </span>

                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Login */}

            <div className="my-7 h-px bg-slate-100" />

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Email address</span>

                <input
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Password</span>

                  <button
                    type="button"
                    className="text-xs font-medium text-cyan-800"
                  >
                    Forgot password?
                  </button>
                </div>

                <input
                  type="password"
                  placeholder="Enter your password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <button
                type="button"
                onClick={handleContinue}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Continue to {selected.label}
                <ArrowIcon />
              </button>

              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Continue with institution sign-in
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to PsyLattice?{" "}
              <button
                type="button"
                className="font-semibold text-cyan-800"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}