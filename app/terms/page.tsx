import PublicInfoPage from "@/components/PublicInfoPage";

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Terms of Use"
      description="These draft terms describe the intended boundaries for use of the PsyLattice platform during development."
      notice="Pre-launch draft — these terms are not intended to serve as final production Terms of Use."
      sections={[
        {
          title: "Purpose of PsyLattice",
          content: (
            <p>
              PsyLattice is being developed as a platform for psychological
              measurement, self-assessment, research workflows and authorised
              professional support.
            </p>
          ),
        },
        {
          title: "Not a substitute for professional care",
          content: (
            <p>
              PsyLattice is not intended to independently diagnose mental
              health conditions, prescribe treatment or replace evaluation by
              appropriately qualified professionals.
            </p>
          ),
        },
        {
          title: "Account responsibilities",
          content: (
            <p>
              Users are responsible for providing accurate account information,
              protecting their login credentials and using the platform only
              through the access permissions assigned to their account.
            </p>
          ),
        },
        {
          title: "Professional accounts",
          content: (
            <p>
              Researcher and clinician access may require verification.
              Providing false or misleading professional credentials may result
              in access being refused or removed.
            </p>
          ),
        },
        {
          title: "Research use",
          content: (
            <p>
              Researchers remain responsible for obtaining appropriate ethical
              approvals, participant consent and permissions required for the
              studies they conduct through the platform.
            </p>
          ),
        },
        {
          title: "Changes to the platform",
          content: (
            <p>
              PsyLattice remains under active development. Features,
              eligibility requirements and platform functionality may change
              as development continues.
            </p>
          ),
        },
      ]}
    />
  );
}