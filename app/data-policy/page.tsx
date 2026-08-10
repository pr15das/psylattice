import PublicInfoPage from "@/components/PublicInfoPage";

export default function DataPolicyPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Data Policy"
      description="PsyLattice is being designed to separate psychological information according to its purpose, ownership, permissions and authorised use."
      notice="Pre-launch draft — detailed retention, governance and regulatory requirements will be finalised before production deployment."
      sections={[
        {
          title: "Data separation",
          content: (
            <p>
              Personal, research and clinical workflows are designed as
              distinct environments. Information should not automatically move
              between these environments simply because they exist within the
              same platform.
            </p>
          ),
        },
        {
          title: "Personal assessment data",
          content: (
            <p>
              Self-assessment and monitoring information belongs within the
              user's personal workspace unless the user explicitly participates
              in an authorised sharing or research workflow.
            </p>
          ),
        },
        {
          title: "Research data",
          content: (
            <p>
              Research information should be handled according to the study
              protocol, participant consent, institutional requirements and
              appropriate ethical approval.
            </p>
          ),
        },
        {
          title: "Professional access",
          content: (
            <p>
              Professional access to individual information should require both
              appropriate professional authorisation and an established basis
              for accessing that individual's information.
            </p>
          ),
        },
        {
          title: "Data exports",
          content: (
            <p>
              Export capabilities should respect workspace permissions and
              applicable privacy controls. Research exports should support
              appropriate pseudonymisation or de-identification workflows where
              required.
            </p>
          ),
        },
        {
          title: "Sensitive information",
          content: (
            <p>
              Psychological assessment and health-related information may be
              sensitive. PsyLattice therefore requires stronger governance than
              an ordinary consumer website before such information is processed
              at production scale.
            </p>
          ),
        },
      ]}
    />
  );
}