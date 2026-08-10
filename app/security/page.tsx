import PublicInfoPage from "@/components/PublicInfoPage";

export default function SecurityPage() {
  return (
    <PublicInfoPage
      eyebrow="Security"
      title="Sensitive information requires careful architecture."
      description="PsyLattice is being built around restricted access, role separation and privacy-conscious handling of psychological information."
      sections={[
        {
          title: "Role-based workspaces",
          content: (
            <p>
              Personal, researcher and clinician accounts operate within
              separate workspaces. Access to a workspace is determined by
              authenticated account information rather than simply by which
              interface a user selects.
            </p>
          ),
        },
        {
          title: "Professional verification",
          content: (
            <p>
              Researcher and clinician accounts are designed to require
              verification before professional tools become available.
              Professional access should not be granted solely because someone
              selects a professional role during registration.
            </p>
          ),
        },
        {
          title: "Database access controls",
          content: (
            <>
              <p>
                PsyLattice is being designed so that users can access only
                information permitted for their account and role.
              </p>

              <p>
                Database-level access rules are intended to provide an
                additional layer of protection beyond the visible website
                interface.
              </p>
            </>
          ),
        },
        {
          title: "Authentication",
          content: (
            <p>
              Account authentication, email confirmation and secure session
              management are used to establish authenticated access before
              protected PsyLattice workspaces can be entered.
            </p>
          ),
        },
        {
          title: "Future safeguards",
          content: (
            <p>
              Before handling sensitive production data at scale, PsyLattice
              will require further security review, logging, backup procedures,
              administrative controls, incident-response processes and
              appropriate privacy and regulatory review.
            </p>
          ),
        },
        {
          title: "Report a security concern",
          content: (
            <p>
              A dedicated security reporting channel will be published before
              public production use of the platform.
            </p>
          ),
        },
      ]}
    />
  );
}