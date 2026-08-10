import PublicInfoPage from "@/components/PublicInfoPage";

export default function AboutPage() {
  return (
    <PublicInfoPage
      eyebrow="About PsyLattice"
      title="Psychological measurement, connected."
      description="PsyLattice is being developed as a connected platform for psychological self-assessment, research workflows, real-world monitoring and qualified professional review."
      sections={[
        {
          title: "Why PsyLattice",
          content: (
            <>
              <p>
                Psychological information is often fragmented across
                questionnaires, research platforms, daily monitoring tools and
                professional systems.
              </p>

              <p>
                PsyLattice is designed to bring these workflows into a
                structured ecosystem while keeping personal, research and
                professional environments appropriately separated.
              </p>
            </>
          ),
        },
        {
          title: "Three distinct workspaces",
          content: (
            <>
              <p>
                <strong className="text-slate-900">PsyLattice Self</strong>{" "}
                supports individuals using structured self-assessment,
                ambulatory monitoring, progress tracking and self-regulation
                tools.
              </p>

              <p>
                <strong className="text-slate-900">
                  PsyLattice Research
                </strong>{" "}
                is designed for researchers creating psychological studies,
                questionnaire protocols and real-world assessment workflows.
              </p>

              <p>
                <strong className="text-slate-900">
                  PsyLattice Clinical
                </strong>{" "}
                is intended for verified professionals reviewing authorised
                assessment and longitudinal information within a structured
                professional workspace.
              </p>
            </>
          ),
        },
        {
          title: "Responsible by design",
          content: (
            <>
              <p>
                PsyLattice is being designed as a psychological measurement and
                support platform rather than an automated diagnostic system.
              </p>

              <p>
                Clinical interpretation, diagnosis and treatment decisions
                should remain with appropriately qualified professionals.
              </p>
            </>
          ),
        },
        {
          title: "Current stage",
          content: (
            <p>
              PsyLattice is currently under development. Features, policies,
              verification procedures and data governance mechanisms will
              continue to evolve as the platform progresses through testing and
              validation.
            </p>
          ),
        },
      ]}
    />
  );
}