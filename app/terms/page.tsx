import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Terms of Use"
      description="These Terms of Use explain the rules that apply when you access or use PsyLattice, including PsyLattice Self, Research, Clinical, study participation and Luna AI features."
      notice="Pre-launch legal draft — this version is designed to cover the intended PsyLattice product and pricing model, but it should be reviewed by qualified counsel before commercial, clinical or research launch."
      sections={[
        {
          title: "1. About these Terms",
          content: (
            <div className="space-y-4">
              <p>
                These Terms of Use (the “Terms”) govern access to and use of
                PsyLattice, including its websites, applications, workspaces,
                study links, assessments, monitoring tools, research tools,
                clinician features, Luna AI features and related services
                (collectively, the “Services”).
              </p>
              <p>
                By creating an account, purchasing a subscription or study,
                accessing a study as a participant, or otherwise using the
                Services, you agree to these Terms. If you do not agree, you
                should not use the Services.
              </p>
              <p>
                “PsyLattice”, “we”, “us” and “our” refer to the operator of the
                PsyLattice platform. The final production version of these Terms
                will identify the legal entity operating PsyLattice, its
                registered address and formal contact details.
              </p>
            </div>
          ),
        },
        {
          title: "2. What PsyLattice is",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice is a psychological measurement and support platform
                with separate experiences for individuals, researchers,
                clinicians and study participants.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>PsyLattice Self</strong> supports structured
                  self-assessment, repeated monitoring, self-regulation,
                  progress review and Luna AI guidance.
                </li>
                <li>
                  <strong>PsyLattice Research</strong> supports study design,
                  questionnaires, ambulatory assessment, participant collection,
                  study monitoring and research-data export.
                </li>
                <li>
                  <strong>PsyLattice Clinical</strong> supports authorised
                  clinician-client workflows, including assigned assessments,
                  monitoring and selected information sharing.
                </li>
                <li>
                  <strong>Study participation</strong> allows invited
                  participants to complete research procedures through a study
                  link without purchasing a PsyLattice subscription.
                </li>
              </ul>
            </div>
          ),
        },
        {
          title: "3. PsyLattice is not an emergency or diagnostic service",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice does not independently diagnose mental-health or
                medical conditions, prescribe medication, provide emergency
                services or replace assessment, diagnosis, treatment or clinical
                judgment by an appropriately qualified professional.
              </p>
              <p>
                Scores, summaries, trends, AI-generated information and other
                outputs may support reflection or professional discussion, but
                they must not be treated as a definitive diagnosis or as the
                sole basis for high-stakes medical or mental-health decisions.
              </p>
              <p>
                PsyLattice is not continuously monitored by emergency personnel.
                You must not rely on the platform, Luna, alerts, questionnaires,
                monitoring features or clinician dashboards to detect or respond
                to an emergency in real time. If you believe that you or another
                person is in immediate danger, use the emergency services
                available in your location.
              </p>
            </div>
          ),
        },
        {
          title: "4. Eligibility and age",
          content: (
            <div className="space-y-4">
              <p>
                Unless PsyLattice expressly provides a dedicated minor-specific
                workflow, Self, Researcher and Clinician accounts are intended
                for adults who are legally capable of entering into these Terms.
              </p>
              <p>
                Research involving minors, or clinical use involving minors,
                may only be conducted where PsyLattice expressly supports the
                required workflow and the responsible researcher or clinician
                has obtained all legally and ethically required permissions,
                consent or authorisation from a parent, guardian or other
                authorised person.
              </p>
            </div>
          ),
        },
        {
          title: "5. Accounts and account security",
          content: (
            <div className="space-y-4">
              <p>
                You must provide accurate information when creating or updating
                an account. You are responsible for maintaining the
                confidentiality of your login credentials and for activity that
                occurs through your account, except where applicable law provides
                otherwise.
              </p>
              <p>
                You must not share professional accounts with another person,
                impersonate another user, create accounts using false identity or
                credentials, or attempt to access a workspace or information for
                which you do not have permission.
              </p>
              <p>
                Please notify PsyLattice promptly if you believe your account or
                access credentials have been compromised.
              </p>
            </div>
          ),
        },
        {
          title: "6. Professional verification",
          content: (
            <div className="space-y-4">
              <p>
                Researcher and clinician access may require identity,
                institutional, educational, professional or licence verification.
                Verification does not constitute an endorsement by PsyLattice of
                the individual’s competence, research quality or professional
                services.
              </p>
              <p>
                False, expired, misleading or unverifiable professional
                information may result in restricted access, suspension or
                removal of professional features.
              </p>
            </div>
          ),
        },
        {
          title: "7. PsyLattice Self subscriptions",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice Self is a paid subscription unless a free trial,
                sponsored licence or other offer is expressly displayed. Current
                prices are shown on the Pricing page and at checkout before you
                purchase.
              </p>
              <p>
                At the current intended launch pricing, Self is planned at
                ₹59 per month or ₹590 per year in India and €4.99 per month or
                €49.90 per year in Europe. Prices may be revised before or after
                launch. The price shown to you at checkout is the price that
                applies to that purchase.
              </p>
              <p>
                If your subscription is recurring, it renews automatically for
                the billing period shown at checkout until cancelled. You can
                cancel future renewal through the account or billing controls
                made available by PsyLattice. Cancellation normally takes effect
                at the end of the current paid period unless applicable law or a
                specific offer provides otherwise.
              </p>
            </div>
          ),
        },
        {
          title: "8. Clinician accounts and client subscriptions",
          content: (
            <div className="space-y-4">
              <p>
                The intended basic PsyLattice Clinician account is free. A
                clinician may invite clients, assign supported assessments or
                monitoring and review information that a client has authorised
                for sharing.
              </p>
              <p>
                A clinician’s client may need an active PsyLattice Self
                subscription to access client-facing paid features. A clinician
                or clinic may also be offered the option to purchase or sponsor
                access for a client.
              </p>
              <p>
                PsyLattice may introduce optional paid professional,
                organisational or institutional features in the future. A free
                account will not be converted into a paid subscription without a
                clear purchase or billing authorisation.
              </p>
            </div>
          ),
        },
        {
          title: "9. Researcher accounts",
          content: (
            <div className="space-y-4">
              <p>
                The intended basic Researcher account is free. Researchers may
                use supported tools to prepare, configure, preview and test
                studies without paying a recurring researcher subscription.
              </p>
              <p>
                A study fee is required when a researcher activates a study for
                real participant data collection, unless PsyLattice expressly
                provides a free or sponsored study allocation.
              </p>
            </div>
          ),
        },
        {
          title: "10. Live research study pricing and participant limits",
          content: (
            <div className="space-y-4">
              <p>
                The intended launch structure provides two standard live-study
                tiers. The exact price displayed at checkout controls.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Standard Study:</strong> currently planned at ₹49 in
                  India or €3.99 in Europe for one live study with up to 500
                  participants.
                </li>
                <li>
                  <strong>Large Study:</strong> currently planned at ₹99 in India
                  or €7.99 in Europe for one live study with up to 1,000
                  participants.
                </li>
                <li>
                  <strong>More than 1,000 participants:</strong> requires a
                  larger-study or institutional arrangement if offered by
                  PsyLattice.
                </li>
              </ul>
              <p>
                Test and preview sessions do not count toward a live participant
                allocation. Unless otherwise stated in the study setup, a unique
                participant who starts a live study may count toward the study’s
                participant limit even if that participant does not complete the
                entire study.
              </p>
              <p>
                When the purchased participant limit is reached, PsyLattice may
                prevent additional participants from starting the study until an
                eligible upgrade or larger-study arrangement is purchased.
              </p>
            </div>
          ),
        },
        {
          title: "11. Research participants do not pay",
          content: (
            <div className="space-y-4">
              <p>
                A person invited to participate in a PsyLattice research study
                does not need to purchase PsyLattice Self or pay a participation
                fee to complete that study.
              </p>
              <p>
                Participation in a research study is separate from purchasing or
                using PsyLattice Self. Researchers must not represent a paid
                PsyLattice subscription as a condition of research participation
                unless the study design lawfully requires a separately supplied
                service and this has been clearly disclosed and approved where
                required.
              </p>
            </div>
          ),
        },
        {
          title: "12. What counts as a live study",
          content: (
            <div className="space-y-4">
              <p>
                A study becomes live when it is activated for genuine participant
                recruitment or data collection rather than preview or internal
                testing. A paid study activation applies to that study project
                and its purchased participant limit.
              </p>
              <p>
                Researchers should finalise material study content before
                recruitment. If a researcher changes measures, consent text,
                scoring, procedures or other material study elements after
                launch, the researcher is responsible for determining whether a
                new protocol version, renewed consent, amended ethics approval or
                separate study is required.
              </p>
              <p>
                Artificially duplicating or splitting a single research project
                for the primary purpose of avoiding a participant limit or
                applicable study fee is not permitted.
              </p>
            </div>
          ),
        },
        {
          title: "13. Researcher responsibilities",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice provides research infrastructure; it does not assume
                the researcher’s ethical, scientific, institutional or legal
                responsibilities. Researchers are responsible for their study
                design and use of the platform, including where applicable:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>obtaining ethics or institutional approval;</li>
                <li>providing accurate participant information;</li>
                <li>obtaining valid informed consent;</li>
                <li>using an appropriate legal basis for processing data;</li>
                <li>protecting vulnerable participants;</li>
                <li>responding appropriately to study-related risk;</li>
                <li>maintaining required study documentation;</li>
                <li>complying with research, privacy and professional rules;</li>
                <li>
                  obtaining licences or permissions for questionnaires,
                  copyrighted instruments and other study material; and
                </li>
                <li>
                  checking exported data, scoring and analysis before relying on
                  them in research conclusions or publications.
                </li>
              </ul>
            </div>
          ),
        },
        {
          title: "14. Questionnaire and instrument rights",
          content: (
            <div className="space-y-4">
              <p>
                The availability of a questionnaire, reference, link, scoring
                description or other resource in PsyLattice does not automatically
                mean that the instrument is free of copyright, licensing,
                attribution, translation, commercial-use or redistribution
                restrictions.
              </p>
              <p>
                Researchers and professionals remain responsible for confirming
                that their intended use is permitted. PsyLattice may restrict,
                remove or change access to instrument content when required by a
                rights holder, licence condition or legal requirement.
              </p>
            </div>
          ),
        },
        {
          title: "15. Clinician responsibilities",
          content: (
            <div className="space-y-4">
              <p>
                Clinicians remain responsible for their own professional
                judgment, competence, record-keeping, informed consent, duty of
                care, licensing and compliance with the laws and professional
                standards that apply to their practice.
              </p>
              <p>
                PsyLattice must not be used as a substitute for clinical
                assessment where direct professional evaluation is required. A
                clinician should independently review information before relying
                on a score, trend, AI-generated summary, automated flag or other
                platform output.
              </p>
              <p>
                Unless expressly stated otherwise, PsyLattice is not intended to
                function as a complete electronic health record, emergency
                monitoring system or substitute for the clinician’s required
                clinical records.
              </p>
            </div>
          ),
        },
        {
          title: "16. Client-controlled sharing",
          content: (
            <div className="space-y-4">
              <p>
                A clinician invitation does not by itself give the clinician
                unrestricted access to a client’s PsyLattice account. Client
                information is shared according to the permissions and features
                presented in the platform.
              </p>
              <p>
                Where supported, clients may authorise or withdraw sharing of
                categories such as assessment results, monitoring summaries,
                assigned activities or progress information. Some information may
                need to remain available where retention is required by law,
                research integrity or another valid obligation.
              </p>
              <p>
                Private areas such as personal reflections or Luna conversations
                are not to be treated as automatically shared with a clinician
                unless the product clearly indicates that sharing is enabled and
                the user has authorised it.
              </p>
            </div>
          ),
        },
        {
          title: "17. Luna AI",
          content: (
            <div className="space-y-4">
              <p>
                Luna is an AI-assisted feature intended to help users navigate
                PsyLattice, reflect on information and understand available
                self-assessment or platform features. Luna is not a doctor,
                psychologist, psychotherapist, emergency responder or substitute
                for professional care.
              </p>
              <p>
                AI systems can misunderstand context, generate inaccurate or
                incomplete information and produce outputs that should not be
                relied on without appropriate judgment. Users should verify
                important information independently, particularly where health,
                safety, research or professional decisions are involved.
              </p>
              <p>
                Luna access may be subject to daily, monthly, technical or fair-use
                limits. The allowance displayed in the applicable plan or product
                interface applies. Unused usage allowances do not have monetary
                value unless expressly stated otherwise.
              </p>
              <p>
                Data handling associated with Luna, including use of external AI
                service providers where applicable, will be described in the
                PsyLattice Privacy Policy and related notices.
              </p>
            </div>
          ),
        },
        {
          title: "18. Assessments, scores and psychological information",
          content: (
            <div className="space-y-4">
              <p>
                Questionnaire scores and interpretations may depend on the
                instrument, version, scoring method, response completeness,
                population, administration conditions and licensing or manual
                requirements. A displayed score does not necessarily have a
                clinical meaning.
              </p>
              <p>
                PsyLattice may provide score ranges, summaries or contextual
                information where supported, but users and professionals remain
                responsible for determining whether an instrument is appropriate
                for their purpose and whether qualified interpretation is
                required.
              </p>
            </div>
          ),
        },
        {
          title: "19. Wearables and third-party data",
          content: (
            <div className="space-y-4">
              <p>
                Where PsyLattice offers wearable or third-party integrations,
                availability may depend on the external provider, device,
                permissions and region. Wearable and consumer-device data may be
                incomplete, delayed or inaccurate and should not be treated as a
                medical-grade measurement unless expressly stated.
              </p>
              <p>
                Third-party services may have their own terms, privacy policies,
                fees and availability conditions. PsyLattice is not responsible
                for third-party services outside its reasonable control.
              </p>
            </div>
          ),
        },
        {
          title: "20. Payments, taxes and billing",
          content: (
            <div className="space-y-4">
              <p>
                Prices, billing period, currency and any applicable taxes or
                charges will be shown before purchase. Where applicable law
                requires taxes to be included in the displayed total, the
                checkout will present the total payable accordingly.
              </p>
              <p>
                Payments may be processed by third-party payment providers. You
                authorise the applicable payment provider to charge the payment
                method you select for purchases and recurring renewals that you
                approve.
              </p>
              <p>
                If payment fails, access to paid features may be restricted after
                any applicable retry or grace period. Free researcher, clinician
                or participant access is not automatically converted into paid
                access merely because a payment method is stored elsewhere on the
                platform.
              </p>
            </div>
          ),
        },
        {
          title: "21. Cancellation, refunds and statutory consumer rights",
          content: (
            <div className="space-y-4">
              <p>
                You may cancel future renewal of a recurring Self subscription
                through the billing controls made available by PsyLattice.
                Except where applicable law, a specific offer or a refund policy
                states otherwise, cancellation does not normally create a
                prorated refund for an already-started paid billing period.
              </p>
              <p>
                A one-time research study fee is intended to pay for activation
                of a live data-collection allocation. Once the study has been
                activated for real data collection or participant data have been
                collected, the study fee is generally non-refundable except where
                required by law, where PsyLattice has made a billing error or
                where an expressly stated refund policy applies.
              </p>
              <p>
                Nothing in these Terms removes mandatory consumer rights. Where
                your jurisdiction provides a statutory withdrawal, cancellation,
                refund or conformity right that cannot lawfully be excluded,
                that right continues to apply. Region-specific checkout notices
                may provide additional instructions.
              </p>
            </div>
          ),
        },
        {
          title: "22. Privacy and personal data",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may process sensitive psychological, health-related,
                research and professional information. How personal data are
                collected, used, disclosed, retained and protected is described
                in the PsyLattice Privacy Policy and Data Policy.
              </p>
              <p>
                These Terms do not replace any consent notice, research
                participant information sheet, clinician-client privacy notice,
                data-processing agreement or other privacy documentation that may
                apply to a particular use of PsyLattice.
              </p>
              <p>
                Where a researcher, clinician, clinic, university or other
                organisation uses PsyLattice, the legal roles and responsibilities
                of PsyLattice and that organisation in relation to personal data
                may vary according to the workflow and applicable law. Relevant
                contractual or data-processing documentation may therefore apply
                in addition to these Terms.
              </p>
              <p>
                Please review the{" "}
                <Link
                  href="/privacy"
                  className="font-medium underline underline-offset-2"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/data-policy"
                  className="font-medium underline underline-offset-2"
                >
                  Data Policy
                </Link>
                .
              </p>
            </div>
          ),
        },
        {
          title: "23. Consent is specific to the workflow",
          content: (
            <div className="space-y-4">
              <p>
                Agreeing to these Terms does not automatically constitute consent
                to every form of personal-data processing, research participation,
                clinician sharing, optional integration or AI use.
              </p>
              <p>
                Where separate consent or authorisation is required, PsyLattice
                or the responsible researcher, clinician or organisation must
                obtain it through the appropriate workflow. Users may be able to
                withdraw optional permissions where supported, subject to lawful
                retention requirements and processing already carried out on a
                valid basis.
              </p>
            </div>
          ),
        },
        {
          title: "24. Data retention, deletion and export",
          content: (
            <div className="space-y-4">
              <p>
                Data may be retained for different periods depending on the
                workspace, account status, study requirements, professional
                obligations, user choices, contractual arrangements and
                applicable law. Detailed retention rules will be described in
                the Privacy Policy and Data Policy.
              </p>
              <p>
                Researchers should regularly export and securely retain research
                data needed for their own records rather than treating PsyLattice
                as the sole permanent archive for a study.
              </p>
              <p>
                Account deletion or study closure may not immediately remove all
                information from backups, audit records, legally required records
                or datasets that must be retained for research integrity or other
                lawful purposes.
              </p>
            </div>
          ),
        },
        {
          title: "25. Security",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice is intended to use reasonable technical and
                organisational safeguards appropriate to the nature of the
                Services. No online service can guarantee absolute security.
              </p>
              <p>
                You must not attempt to bypass authentication, access controls,
                rate limits, study restrictions or other security measures.
                Unauthorised vulnerability testing, exploitation, credential
                theft, malware distribution or interference with the Services is
                prohibited.
              </p>
            </div>
          ),
        },
        {
          title: "26. Acceptable use",
          content: (
            <div className="space-y-4">
              <p>You must not use PsyLattice to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>break applicable law or another person’s rights;</li>
                <li>harass, exploit, threaten or deceive another person;</li>
                <li>impersonate a clinician, researcher or other professional;</li>
                <li>
                  conduct research without approvals or consent where they are
                  required;
                </li>
                <li>
                  upload or distribute questionnaires, manuals, scoring keys or
                  other material without the necessary rights;
                </li>
                <li>
                  use PsyLattice to make unlawful discriminatory or solely
                  automated high-stakes decisions about individuals;
                </li>
                <li>
                  collect data that are unnecessary for the stated research or
                  professional purpose;
                </li>
                <li>send spam, malicious code or abusive automated traffic;</li>
                <li>
                  scrape, copy or systematically extract platform content except
                  through authorised export or API functionality;
                </li>
                <li>
                  reverse engineer or interfere with the Services except where a
                  right to do so cannot lawfully be restricted; or
                </li>
                <li>
                  use the Services in a way that creates unreasonable security,
                  safety, infrastructure or legal risk.
                </li>
              </ul>
            </div>
          ),
        },
        {
          title: "27. User content",
          content: (
            <div className="space-y-4">
              <p>
                You retain rights you already hold in lawful content you submit
                to PsyLattice, such as study descriptions, custom questionnaire
                content, notes or other materials. You are responsible for
                ensuring that you have the rights and permissions needed to
                submit that content.
              </p>
              <p>
                You grant PsyLattice the limited rights necessary to host,
                process, reproduce, transmit and technically modify submitted
                content for the purpose of operating, securing and providing the
                Services, subject to the Privacy Policy and applicable law.
              </p>
            </div>
          ),
        },
        {
          title: "28. PsyLattice intellectual property",
          content: (
            <div className="space-y-4">
              <p>
                The PsyLattice software, design, branding, interfaces, original
                documentation and other platform materials are owned by or
                licensed to PsyLattice, except for third-party materials and user
                content.
              </p>
              <p>
                These Terms provide a limited, revocable, non-exclusive,
                non-transferable right to use the Services for their intended
                purpose. They do not transfer ownership of PsyLattice
                intellectual property to the user.
              </p>
            </div>
          ),
        },
        {
          title: "29. Feedback",
          content: (
            <p>
              If you voluntarily provide ideas, suggestions or feedback about
              PsyLattice, you allow PsyLattice to use that feedback to improve or
              develop the Services without an obligation to compensate you,
              provided that this does not grant PsyLattice rights over your
              confidential research data or personal information beyond what is
              otherwise permitted.
            </p>
          ),
        },
        {
          title: "30. Service availability and changes",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may add, change, improve, restrict or discontinue
                features where reasonably necessary for security, legal,
                technical, product or operational reasons. Maintenance,
                third-party outages and other events may temporarily interrupt
                access.
              </p>
              <p>
                Where a material change affects a paid entitlement, PsyLattice
                will provide notice where reasonably possible and where required
                by law. We will not impose a new recurring charge without the
                billing authorisation required for that charge.
              </p>
            </div>
          ),
        },
        {
          title: "31. Beta and pre-release features",
          content: (
            <div className="space-y-4">
              <p>
                Features identified as beta, preview, experimental or pre-release
                may be incomplete, change without notice or contain errors. They
                should not be relied on for critical clinical, research or
                operational decisions unless PsyLattice expressly states that the
                feature is production-ready for that purpose.
              </p>
            </div>
          ),
        },
        {
          title: "32. Suspension and termination",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may restrict, suspend or terminate access where there
                is a material or repeated breach of these Terms, fraud,
                non-payment, misuse of professional credentials, security risk,
                unlawful activity, harm to other users or a legal requirement to
                do so.
              </p>
              <p>
                Where appropriate and legally permitted, PsyLattice may provide
                notice or an opportunity to correct a problem before termination.
                Immediate restriction may be necessary for serious security,
                safety, fraud or legal risks.
              </p>
              <p>
                Users may stop using PsyLattice at any time. Ending an account
                does not automatically cancel obligations or charges that arose
                before termination, and data handling after termination remains
                subject to the Privacy Policy, Data Policy and applicable law.
              </p>
            </div>
          ),
        },
        {
          title: "33. Disclaimers",
          content: (
            <div className="space-y-4">
              <p>
                To the fullest extent permitted by law, PsyLattice does not
                guarantee that the Services will be uninterrupted, error-free or
                suitable for every clinical, personal or research purpose.
              </p>
              <p>
                Researchers, clinicians and users remain responsible for
                reviewing outputs, maintaining appropriate independent records
                and using professional or scientific judgment where required.
              </p>
              <p>
                Nothing in these Terms excludes warranties, guarantees or other
                rights that cannot lawfully be excluded.
              </p>
            </div>
          ),
        },
        {
          title: "34. Limitation of liability",
          content: (
            <div className="space-y-4">
              <p>
                To the fullest extent permitted by applicable law, PsyLattice’s
                liability for losses arising from the Services may be limited in
                the final production Terms. Any limitation will not apply where
                liability cannot lawfully be excluded or limited, including where
                applicable for fraud, wilful misconduct, gross negligence, death
                or personal injury caused by negligence, or mandatory consumer
                rights.
              </p>
              <p>
                The final production version should contain jurisdiction-specific
                liability language reviewed by qualified counsel rather than a
                blanket exclusion that may be unenforceable.
              </p>
            </div>
          ),
        },
        {
          title: "35. Responsibility for third-party claims",
          content: (
            <div className="space-y-4">
              <p>
                Professional and organisational users may be responsible for
                losses or claims arising from their unlawful study content,
                unlicensed instruments, breach of participant rights, misuse of
                client information or other conduct that violates these Terms or
                applicable law.
              </p>
              <p>
                Any final indemnity clause for commercial or institutional users
                should be tailored to the applicable jurisdiction and contract
                type before production launch.
              </p>
            </div>
          ),
        },
        {
          title: "36. Changes to these Terms",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may update these Terms as the Services, laws or
                business model change. The updated version will identify its
                effective date.
              </p>
              <p>
                Where a change materially affects existing users’ rights or paid
                Services, notice will be provided where required by law or where
                reasonably appropriate. Continued use after an updated version
                becomes effective may constitute acceptance where legally valid;
                where fresh consent is required, PsyLattice will request it.
              </p>
            </div>
          ),
        },
        {
          title: "37. Governing law and disputes",
          content: (
            <div className="space-y-4">
              <p>
                The governing law, courts and any alternative dispute-resolution
                process will be specified in the final production Terms once the
                PsyLattice operating legal entity and launch jurisdictions are
                finalised.
              </p>
              <p>
                Nothing in the final Terms should remove mandatory rights that a
                consumer has under the law of the country in which those rights
                apply.
              </p>
            </div>
          ),
        },
        {
          title: "38. Contact and complaints",
          content: (
            <div className="space-y-4">
              <p>
                Users should be able to contact PsyLattice regarding account,
                billing, privacy, research, clinical-access or platform concerns.
                Final production Terms should include the operator’s legal name,
                postal address, support contact, privacy contact and any legally
                required grievance or representative details.
              </p>
              <p>
                For now, the public contact route is available through the{" "}
                <Link
                  href="/contact"
                  className="font-medium underline underline-offset-2"
                >
                  Contact page
                </Link>
                .
              </p>
            </div>
          ),
        },
        {
          title: "39. Entire agreement and severability",
          content: (
            <div className="space-y-4">
              <p>
                These Terms, together with any policies, checkout terms,
                professional agreements, data-processing terms or other documents
                expressly incorporated into them, form the agreement governing
                the relevant use of PsyLattice.
              </p>
              <p>
                If a provision is found unenforceable, the remaining provisions
                should continue to apply to the extent permitted by law. Failure
                to enforce a provision on one occasion does not automatically
                waive the right to enforce it later.
              </p>
            </div>
          ),
        },
        {
          title: "40. Before production launch",
          content: (
            <div className="space-y-4">
              <p>
                Before PsyLattice accepts real commercial payments or is used as
                a production clinical or research service, this draft should be
                reviewed against the final technical implementation and by
                qualified legal counsel for the jurisdictions in which PsyLattice
                operates.
              </p>
              <p>The final review should specifically confirm:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>the PsyLattice legal entity and business address;</li>
                <li>governing law, dispute and complaint procedures;</li>
                <li>consumer cancellation and withdrawal disclosures;</li>
                <li>subscription renewal and payment flows;</li>
                <li>privacy, data protection and international transfers;</li>
                <li>clinical and health-related regulatory positioning;</li>
                <li>research data roles and data-processing agreements;</li>
                <li>age and minor-consent workflows;</li>
                <li>professional verification and clinician eligibility;</li>
                <li>security, incident and breach-response obligations;</li>
                <li>questionnaire licensing and content rights; and</li>
                <li>liability, insurance and jurisdiction-specific clauses.</li>
              </ul>
            </div>
          ),
        },
      ]}
    />
  );
}
