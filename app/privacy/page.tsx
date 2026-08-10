import PublicInfoPage from "@/components/PublicInfoPage";

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="This page describes the privacy principles currently guiding the development of PsyLattice."
      notice="Pre-launch draft — this is not the final PsyLattice Privacy Policy. A jurisdiction-appropriate privacy policy must be reviewed before production use involving personal or psychological data."
      sections={[
        {
          title: "Our approach",
          content: (
            <p>
              PsyLattice is being designed around data minimisation,
              transparency, appropriate access controls and meaningful user
              control over psychological information.
            </p>
          ),
        },
        {
          title: "Information PsyLattice may process",
          content: (
            <>
              <p>
                Depending on the workspace and features used, information may
                include account details, questionnaire responses, assessment
                results, repeated self-reports, study participation information
                and user-selected profile information.
              </p>

              <p>
                Optional features may later involve information from connected
                devices or information intentionally shared with researchers or
                authorised professionals.
              </p>
            </>
          ),
        },
        {
          title: "Why information is processed",
          content: (
            <p>
              Information should be processed only for defined platform
              purposes such as providing requested assessments, presenting
              results, supporting authorised research workflows, maintaining
              account functionality and enabling explicitly authorised
              professional access.
            </p>
          ),
        },
        {
          title: "Sharing and access",
          content: (
            <p>
              PsyLattice is designed so that information is not automatically
              exposed across Self, Research and Clinical workspaces. Sharing
              mechanisms should depend on the user's permissions, consent and
              the purpose of the relevant workflow.
            </p>
          ),
        },
        {
          title: "Retention and deletion",
          content: (
            <p>
              Production retention periods and deletion procedures will be
              defined before public deployment and will depend on the purpose
              for which particular information is processed and applicable
              legal requirements.
            </p>
          ),
        },
        {
          title: "Policy updates",
          content: (
            <p>
              This draft will be replaced with a complete privacy policy before
              PsyLattice begins production processing of sensitive
              psychological information.
            </p>
          ),
        },
      ]}
    />
  );
}