import Link from "next/link";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";
import {
  ClipboardCheck,
  Sparkles,
  Activity,
  Target,
  Watch,
  FileText,
} from "lucide-react";

const solutions = [
  {
    number: "01",
    label: "For individuals",
    title: "PsyLattice Self",
    description:
      "Understand your psychological patterns through structured self-assessments, real-world check-ins and guided self-regulation.",
    features: [
      "Validated self-assessment questionnaires",
      "AI-guided assessment discovery",
      "Ambulatory assessments",
      "Self-regulation tools",
      "Progress tracking",
      "Optional wearable integration",
    ],
  },
  {
    number: "02",
    label: "For researchers",
    title: "PsyLattice Research",
    description:
      "Design psychological studies, deploy questionnaires and ambulatory protocols, manage participants and export research-ready data.",
    features: [
      "Questionnaire library",
      "Study builder",
      "EMA / ESM protocols",
      "Participant dashboards",
      "Research data monitoring",
      "CSV, XLSX and analysis-ready exports",
    ],
  },
  {
    number: "03",
    label: "For professionals",
    title: "PsyLattice Clinical",
    description:
      "Bring assessments, everyday monitoring and authorised physiological context together in a structured professional workspace.",
    features: [
      "Assigned client dashboard",
      "Assessment history",
      "Ambulatory monitoring",
      "Wearable summaries",
      "Longitudinal progress",
      "Professional notes and follow-up",
    ],
  },
];

const process = [
  {
    number: "01",
    title: "Measure",
    description:
      "Collect psychological information through validated questionnaires, repeated self-report and real-world assessments.",
  },
  {
    number: "02",
    title: "Observe",
    description:
      "Understand how experiences change across time, situations and everyday routines.",
  },
  {
    number: "03",
    title: "Understand",
    description:
      "Organise scores, patterns and longitudinal information into clear, interpretable views.",
  },
  {
    number: "04",
    title: "Act",
    description:
      "Support self-regulation, research decisions or qualified professional review.",
  },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0"
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

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f7faf9]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <PsyLatticeLogo />

          <nav className="hidden items-center gap-8 text-sm text-slate-600 lg:flex">
            <a
              href="#platform"
              className="transition-colors hover:text-slate-950"
            >
              Platform
            </a>

            <a
              href="#solutions"
              className="transition-colors hover:text-slate-950"
            >
              Solutions
            </a>

            <a
              href="#research"
              className="transition-colors hover:text-slate-950"
            >
              Research
            </a>

            <a
              href="#security"
              className="transition-colors hover:text-slate-950"
            >
              Security
            </a>

            <a
              href="#about"
              className="transition-colors hover:text-slate-950"
            >
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white sm:block"
            >
              Sign in
            </Link>

            <Link
              href="/signin"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Get started
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 -z-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-100/40 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-24 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pb-32 lg:pt-32">
          <div className="flex flex-col justify-center">
            <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
              A unified psychological measurement ecosystem
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[72px]">
              Psychological
              <br />
              measurements,
              <br />
              <span className="text-cyan-800">connected.</span>
            </h1>
  <Link
  href="/self?screen=ai"
  className="ai-orbit-button mt-7"
>
  <span className="text-cyan-300">
    ✦
  </span>

  <span>Now equipped with AI</span>

  <span className="ai-orbit-arrow">
    →
  </span>
</Link>
           <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
  PsyLattice connects psychological self-assessment, ambulatory
  measurement, research workflows and professional monitoring
  within one carefully structured platform.

</p>


            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Explore PsyLattice
                <ArrowIcon />
              </Link>

              <a
                href="#solutions"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-medium text-slate-800 transition hover:border-slate-400"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CheckIcon />
                Non-diagnostic by design
              </span>

              <span className="flex items-center gap-2">
                <CheckIcon />
                Role-based workspaces
              </span>

              <span className="flex items-center gap-2">
                <CheckIcon />
                Privacy-conscious architecture
              </span>
            </div>
          </div>

          {/* Hero dashboard visual */}
          <div className="relative flex items-center justify-center">
            <div className="absolute h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />

            <div className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.32)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <PsyLatticeLogo size={36} />

                  <div>
                    <p className="text-sm font-semibold">
                      Personal workspace
                    </p>

                    <p className="text-xs text-slate-400">
                      Monday, 9 August
                    </p>
                  </div>
                </div>

                <div className="h-9 w-9 rounded-full bg-slate-100" />
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-6">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                    Your overview
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Good afternoon.
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Here is your psychological self-check overview.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Check-ins</p>

                    <p className="mt-2 text-2xl font-semibold">
                      2 / 3
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      completed today
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Current plan
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                      Day 8
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      stress regulation
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Latest self-assessment
                      </p>

                      <p className="mt-1 font-medium">
                        Perceived Stress
                      </p>
                    </div>

                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                      Moderate range
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[58%] rounded-full bg-cyan-700" />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-950 p-5 text-white">
                  <p className="text-xs text-slate-400">
                    PsyLattice AI Guide
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Not sure what to assess? Describe what you have been
                    experiencing and explore suitable self-checks.
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-cyan-200">
                    Start a conversation
                    <ArrowIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform intro */}
      <section
        id="platform"
        className="border-y border-slate-200 bg-white py-20"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
                One platform
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em]">
                Built around different psychological workflows.
              </h2>
            </div>

            <div className="flex items-center">
              <p className="max-w-3xl text-xl leading-9 text-slate-600">
                PsyLattice is not a single questionnaire app. It provides
                distinct environments for individuals, researchers and
                qualified professionals, built on a shared psychological
                measurement foundation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three domains */}
      <section
        id="solutions"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32"
      >
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
            PsyLattice workspaces
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Three users.
            <br />
            Three distinct experiences.
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Workspace selection happens before sign-in. Each user sees only
            the tools appropriate to their role and permissions.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {solutions.map((solution) => (
            <article
              key={solution.title}
              className="group flex min-h-[560px] flex-col rounded-[24px] border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-400">
                  {solution.number}
                </span>

                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  {solution.label}
                </span>
              </div>

              <div className="mt-12">
                <h3 className="text-2xl font-semibold tracking-tight">
                  {solution.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-600">
                  {solution.description}
                </p>
              </div>

              <div className="my-7 h-px bg-slate-100" />

              <ul className="space-y-3">
                {solution.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                  >
                    <span className="mt-1 text-cyan-700">
                      <CheckIcon />
                    </span>

                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signin"
                className="mt-auto flex items-center gap-2 pt-8 text-sm font-semibold text-slate-950"
              >
                Enter workspace
                <ArrowIcon />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Self feature */}
      <section className="bg-slate-950 py-24 text-white lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              PsyLattice Self
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Understand yourself beyond a single score.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Combine structured questionnaires with short assessments across
              everyday life to understand how experiences vary over time and
              context.
            </p>
          </div>
<div className="grid gap-4 sm:grid-cols-2">
  {[
    {
      title: "Self-Assessments",
      text: "Structured psychological self-checks.",
      icon: ClipboardCheck,
    },
    {
      title: "AI Guide",
      text: "Navigate appropriate assessments without automated diagnosis.",
      icon: Sparkles,
    },
    {
      title: "Daily Monitoring",
      text: "Capture experiences as they occur in everyday life.",
      icon: Activity,
    },
    {
      title: "Self-Regulation",
      text: "Turn reflection into small, trackable routines.",
      icon: Target,
    },
    {
      title: "Wearables",
      text: "Optionally add sleep, activity and physiological context.",
      icon: Watch,
    },
    {
      title: "Therapist Summary",
      text: "Prepare selected information to discuss with your therapist.",
      icon: FileText,
    },
  ].map((item) => {
    const FeatureIcon = item.icon;

    return (
      <div
        key={item.title}
        className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition duration-300 hover:border-slate-700 hover:bg-slate-900"
      >
        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-900/60 bg-cyan-950/50 text-cyan-300 transition group-hover:border-cyan-800 group-hover:bg-cyan-950">
          <FeatureIcon
            size={19}
            strokeWidth={1.8}
          />
        </div>

        <h3 className="font-medium text-white">
          {item.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {item.text}
        </p>
      </div>
    );
  })}
</div>
        </div>
      </section>

      {/* Research */}
      <section
        id="research"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32"
      >
        <div className="grid gap-16 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              PsyLattice Research
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Psychological research, from study design to dataset.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-600">
              Researchers can assemble questionnaire studies and ambulatory
              protocols, distribute participant links, monitor completion and
              export structured data.
            </p>

            <Link
              href="/signin"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold"
            >
              Explore Research
              <ArrowIcon />
            </Link>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/40 sm:p-6">
            <div className="border-b border-slate-100 pb-5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Active study
              </p>

              <div className="mt-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    Daily Stress in University Students
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    14-day ambulatory protocol
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Live
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-4">
              {[
                ["93", "Participants"],
                ["81%", "Compliance"],
                ["2,846", "Responses"],
                ["7", "Data flags"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-xl bg-slate-50 px-4 py-4"
                >
                  <p className="text-xl font-semibold">
                    {value}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-medium">
                Study workflow
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {[
                  "Measures",
                  "EMA protocol",
                  "Participants",
                  "Export",
                ].map((item, index) => (
                  <div key={item}>
                    <div className="mb-2 flex items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-800">
                        {index + 1}
                      </span>

                      {index < 3 && (
                        <div className="ml-2 hidden h-px flex-1 bg-slate-200 sm:block" />
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              How PsyLattice works
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em]">
              Measure. Observe. Understand. Act.
            </h2>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-4">
            {process.map((step) => (
              <div
                key={step.number}
                className="bg-white p-7"
              >
                <p className="text-sm text-cyan-800">
                  {step.number}
                </p>

                <h3 className="mt-10 text-xl font-semibold">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section
        id="security"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32"
      >
        <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800">
              Privacy & security
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em]">
              Sensitive information requires careful design.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [
                "Role-based access",
                "Personal, research and clinical information remain within appropriately authorised workflows.",
              ],
              [
                "Granular sharing",
                "Users control which optional information is shared with professionals or studies.",
              ],
              [
                "Auditability",
                "Sensitive professional and administrative actions can be recorded in access logs.",
              ],
              [
                "Human clinical responsibility",
                "Clinical interpretation, diagnosis and treatment decisions remain with qualified professionals.",
              ],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="h-9 w-9 rounded-xl bg-cyan-50" />

                <h3 className="mt-6 font-semibold">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="about"
        className="px-6 pb-20 lg:px-8"
      >
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[30px] bg-cyan-900 px-7 py-14 text-white sm:px-10 lg:px-14 lg:py-16">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Start with PsyLattice
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                A connected foundation for psychological measurement.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-cyan-100/80">
                Choose the workspace designed for your role and begin building
                a clearer view of psychological information over time.
              </p>
            </div>

            <Link
              href="/signin"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-cyan-950 transition hover:bg-cyan-50"
            >
              Choose your workspace
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col justify-between gap-10 md:flex-row">
            <div>
              <PsyLatticeLogo />

              <p className="mt-5 max-w-sm text-sm leading-6 text-slate-500">
                A modular platform for psychological assessment, research,
                real-world monitoring and professional support.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-16 gap-y-8 text-sm sm:grid-cols-3">
              <div>
                <p className="font-semibold">
                  Platform
                </p>

                <div className="mt-4 space-y-3 text-slate-500">
                  <p>Self</p>
                  <p>Research</p>
                  <p>Clinical</p>
                </div>
              </div>

              <div>
                <p className="font-semibold">
                  Company
                </p>

              <div>
  

  <div className="mt-4 space-y-3 text-slate-500">
    <Link
      href="/about"
      className="block transition hover:text-slate-950"
    >
      About
    </Link>

    <Link
      href="/security"
      className="block transition hover:text-slate-950"
    >
      Security
    </Link>

    <Link
      href="/contact"
      className="block transition hover:text-slate-950"
    >
      Contact
    </Link>
  </div>
</div>
              </div>

              <div>
                <p className="font-semibold">
                  Legal
                </p>

               <div>
 

  <div className="mt-4 space-y-3 text-slate-500">
    <Link
      href="/privacy"
      className="block transition hover:text-slate-950"
    >
      Privacy
    </Link>

    <Link
      href="/terms"
      className="block transition hover:text-slate-950"
    >
      Terms
    </Link>

    <Link
      href="/data-policy"
      className="block transition hover:text-slate-950"
    >
      Data policy
    </Link>
  </div>
</div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
            <p>
              © 2026 PsyLattice. Concept platform.
            </p>

            <p>
              Designed for responsible psychological measurement.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
