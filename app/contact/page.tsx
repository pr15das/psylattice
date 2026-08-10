import PublicInfoPage from "@/components/PublicInfoPage";

export default function ContactPage() {
  return (
    <PublicInfoPage
      eyebrow="Contact"
      title="Get in touch with PsyLattice."
      description="Questions about the platform, research collaboration, professional access or privacy can be directed through the appropriate contact channel."
      sections={[
        {
          title: "General enquiries",
          content: (
            <p>
              Email: priyangshu152002net@gmail.com
              <br></br>
              Phone: +39 3513117164 , +91 7086615792
            </p>
          ),
        },
        {
          title: "Research collaboration",
          content: (
            <p>
              Universities, laboratories and researchers interested in
              evaluating PsyLattice or contributing to research pilots will be
              able to request information through a dedicated research
              channel.
            </p>
          ),
        },
        {
          title: "Professional enquiries",
          content: (
            <p>
              Verification and professional-access enquiries for clinicians
              and other authorised professionals will be handled separately
              from general account support.
            </p>
          ),
        },
        {
          title: "Privacy and data requests",
          content: (
            <p>
              A dedicated channel for privacy questions and data-related
              requests will be provided before production processing of
              personal information begins.
            </p>
          ),
        },
      ]}
    />
  );
}