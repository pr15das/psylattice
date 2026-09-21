"use client";

import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

const LAST_UPDATED = "21 September 2026";

export default function PrivacyPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="This Privacy Policy explains how PsyLattice collects, uses, stores, shares and protects personal data across the website, research platform, participant experiences, AI-assisted tools, mobile and desktop software, workshops and supported professional services."
      notice={`Last updated ${LAST_UPDATED}. This Privacy Policy should be read together with the PsyLattice Terms and Conditions, Data Policy, any study-specific participant information and consent materials, Workshop notices, institutional agreements and any other privacy notice that applies to a particular workflow.`}
      sections={[
        {
          title: "1. Scope of this Privacy Policy",
          content: (
            <div className="space-y-4">
              <p>
                This Privacy Policy applies to personal data processed through
                PsyLattice websites, applications, account services, Research
                workspaces, study links, participant interfaces, Cognitive Lab,
                ambulatory and longitudinal assessment features, Analysis Lab,
                Thesis Builder, AI-assisted features, participant companion
                applications, supported wearable or sensor integrations, desktop
                or offline software, Workshops and other services made available
                under the PsyLattice name (collectively, the “Services”).
              </p>
              <p>
                Different rules may apply depending on whether you are a website
                visitor, registered user, researcher, study participant, student,
                Workshop attendee, institutional administrator, professional,
                client or user of another PsyLattice service.
              </p>
              <p>
                A study-specific participant information sheet, consent form,
                institutional privacy notice, data-processing agreement or other
                specialised notice may provide additional information. Those
                notices supplement this Policy for the relevant workflow.
              </p>
            </div>
          ),
        },
        {
          title: "2. Who is responsible for your personal data",
          content: (
            <div className="space-y-4">
              <p>
                The person or legal entity identified as the operator of
                PsyLattice in the{" "}
                <Link
                  href="/terms"
                  className="font-medium underline underline-offset-2"
                >
                  Terms and Conditions
                </Link>{" "}
                and on the{" "}
                <Link
                  href="/contact"
                  className="font-medium underline underline-offset-2"
                >
                  Contact page
                </Link>{" "}
                is responsible for personal data where PsyLattice decides why and
                how that data is processed. Depending on the applicable law, this
                role may be described as a data controller, Data Fiduciary or
                equivalent responsible party.
              </p>
              <p>
                In university, research, clinic or institutional workflows, the
                researcher or organisation may instead determine the purpose,
                categories of data, participant population, retention and use of
                the data. In those cases, PsyLattice may act as a processor,
                service provider or similar party acting on documented
                instructions.
              </p>
              <p>
                PsyLattice may remain independently responsible for separate
                processing necessary for its own account administration,
                security, fraud prevention, billing, legal compliance and
                operation of the Services.
              </p>
            </div>
          ),
        },
        {
          title: "3. Our privacy principles",
          content: (
            <div className="space-y-4">
              <p>PsyLattice is designed around the following principles:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  collect and process only information reasonably needed for a
                  defined purpose;
                </li>
                <li>
                  separate access between users, studies, roles and workspaces
                  where appropriate;
                </li>
                <li>
                  use permission-controlled access for sensitive context and AI
                  features;
                </li>
                <li>
                  provide meaningful information about what is collected and why;
                </li>
                <li>
                  support pseudonymous research workflows where direct identity
                  is not necessary;
                </li>
                <li>
                  apply reasonable technical and organisational security
                  safeguards;
                </li>
                <li>
                  avoid using sensitive psychological, research or health data
                  for behavioural advertising;
                </li>
                <li>
                  retain information only for as long as justified by the
                  purpose, contract, research requirements or law.
                </li>
              </ul>
            </div>
          ),
        },
        {
          title: "4. Categories of people whose data we may process",
          content: (
            <div className="space-y-4">
              <p>Depending on the Services used, PsyLattice may process data relating to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>website visitors;</li>
                <li>registered PsyLattice users;</li>
                <li>researchers and research-team members;</li>
                <li>
                  study participants, including participants who do not create a
                  standard PsyLattice account;
                </li>
                <li>students and Workshop attendees;</li>
                <li>university or institutional administrators;</li>
                <li>professionals and, where enabled, their clients;</li>
                <li>users of Self, Luna or other personal-support features;</li>
                <li>people who contact support, sales or privacy channels;</li>
                <li>
                  individuals whose information is lawfully imported into a
                  workspace by an authorised user.
                </li>
              </ul>
            </div>
          ),
        },
        {
          title: "5. Account and profile information",
          content: (
            <div className="space-y-4">
              <p>
                When you create or use an account, we may process information
                such as your name, email address, authentication identifiers,
                account ID, institution, role, designation, country, profile
                preferences, account status and workspace access information.
              </p>
              <p>
                We may also process security and account-management information
                such as email-verification state, login timestamps, password
                reset events, session metadata, administrative actions, plan
                status, suspension status or ban status.
              </p>
              <p>
                You should never send PsyLattice your password, recovery code,
                API secret or full authentication credential through ordinary
                support messages.
              </p>
            </div>
          ),
        },
        {
          title: "6. Research workspace and study information",
          content: (
            <div className="space-y-4">
              <p>
                Researchers may create or upload study titles, descriptions,
                hypotheses, variables, protocols, schedules, questionnaires,
                consent text, task settings, recruitment information, analysis
                settings, research notes, datasets, documents and other study
                materials.
              </p>
              <p>
                PsyLattice processes this content to provide the requested
                research workspace and, where PsyLattice acts on behalf of a
                researcher or institution, according to that party’s lawful
                instructions and the applicable agreement.
              </p>
            </div>
          ),
        },
        {
          title: "7. Research participant information",
          content: (
            <div className="space-y-4">
              <p>
                A participant may be able to participate through a study link,
                code, token or participant companion without creating a standard
                PsyLattice account.
              </p>
              <p>
                Depending on the study design, participant data may include a
                participant or session identifier, consent status, timestamps,
                questionnaire answers, demographic information, study events,
                task responses, reaction times, accuracy, repeated self-reports,
                longitudinal responses, EMA or experience-sampling responses,
                completion status and other information selected by the
                researcher.
              </p>
              <p>
                A researcher may also choose to collect direct identifiers such
                as a name, email address, phone number or externally assigned
                participant code where that is lawful and necessary.
              </p>
              <p>
                Participants should read the information and consent materials
                for the specific study because those materials explain the
                research purpose, responsible researcher, study-specific data,
                withdrawal procedure and other information that cannot be fully
                described in this general Policy.
              </p>
            </div>
          ),
        },
        {
          title: "8. Questionnaire, assessment and psychological information",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may process questionnaire answers, assessment
                responses, scores, subscale values, repeated self-reports,
                behavioural measures, progress information and related
                psychological or research information when a user or study uses
                those features.
              </p>
              <p>
                Some information may reveal or relate to health, mental health,
                behaviour or other legally protected characteristics. Such data
                should be collected only where appropriate for the relevant
                purpose and with the legal, ethical and institutional safeguards
                required for that workflow.
              </p>
            </div>
          ),
        },
        {
          title: "9. Cognitive-task and behavioural data",
          content: (
            <div className="space-y-4">
              <p>
                Cognitive Lab or related features may process task configuration,
                stimuli presented, trial information, response choices, response
                times, accuracy, omissions and derived measures.
              </p>
              <p>
                Where relevant, technical information about the browser, device
                or session may also be processed to run the task, troubleshoot
                problems or help the researcher interpret the data.
              </p>
            </div>
          ),
        },
        {
          title: "10. EMA, ambulatory and longitudinal information",
          content: (
            <div className="space-y-4">
              <p>
                Repeated-measurement features may process scheduled prompts,
                completion timestamps, repeated responses, contextual entries,
                study events and related information across days or longer
                periods.
              </p>
              <p>
                Researchers determine the content and frequency of their study
                assessments. Notifications should contain only the information
                reasonably needed to direct the participant to the assigned task
                and should avoid exposing sensitive responses on a lock screen
                where possible.
              </p>
            </div>
          ),
        },
        {
          title: "11. Wearables, Health Connect and sensor data",
          content: (
            <div className="space-y-4">
              <p>
                Where supported and enabled, PsyLattice may process authorised
                wearable, Health Connect or sensor data such as activity, sleep,
                heart-rate or other supported measurements, depending on the
                study configuration and permissions granted.
              </p>
              <p>
                Device permission is separate from research consent. Allowing an
                operating system to share a data type does not by itself mean
                that the participant has consented to every research use of that
                data.
              </p>
              <p>
                Before sensitive device information is requested, the relevant
                study or application should explain the data type, purpose,
                frequency, storage, retention and whether the researcher receives
                raw values, summaries or derived trigger events.
              </p>
              <p>
                Revoking an optional device permission stops future collection
                through that permission, although information already lawfully
                collected may remain subject to research, legal or retention
                obligations.
              </p>
            </div>
          ),
        },
        {
          title: "12. Documents, files, media and thesis content",
          content: (
            <div className="space-y-4">
              <p>
                Supported workflows may allow users to upload documents,
                datasets, images, audio, video, study materials or thesis files.
                These files may contain personal or confidential information
                chosen by the user.
              </p>
              <p>
                PsyLattice processes uploaded material to store, display,
                analyse, transform, export or otherwise provide the feature the
                user requested.
              </p>
              <p>
                Users should avoid uploading personal or confidential
                information that is unnecessary for their intended purpose.
              </p>
            </div>
          ),
        },
        {
          title: "13. Analysis Lab and export information",
          content: (
            <div className="space-y-4">
              <p>
                Analysis Lab may process variables, datasets, model selections,
                transformations, statistical outputs, graphs, tables and derived
                results.
              </p>
              <p>
                PsyLattice may also process limited export metadata such as the
                study, export type, format, timestamp, row count, identity mode
                or whether direct identifiers were included, where that
                information is used for accountability, security or workspace
                history.
              </p>
              <p>
                Once a researcher exports a dataset, the exported copy is under
                the researcher or institution’s control. They are responsible
                for the security, storage, sharing and deletion of that copy.
              </p>
            </div>
          ),
        },
        {
          title: "14. AI prompts, conversations and authorised context",
          content: (
            <div className="space-y-4">
              <p>
                When a user uses an AI-assisted feature, PsyLattice may process
                the prompt, conversation history, selected model, usage metadata
                and any workspace context that the user has authorised for the
                request.
              </p>
              <p>
                Authorised context may include a study description, statistical
                result, document, thesis text, dataset summary or other
                workspace information. Where the product provides separate
                permission controls, granting access to one category of context
                does not automatically grant access to every other category.
              </p>
              <p>
                For example, where Thesis Builder includes a separate document
                access permission, document content should be available to the
                AI only when the relevant permission is enabled.
              </p>
            </div>
          ),
        },
        {
          title: "15. Cloud AI and local or offline AI",
          content: (
            <div className="space-y-4">
              <p>
                A cloud AI feature may send the prompt and authorised context
                needed for the request to the selected AI service provider.
                Different models may have different processing locations,
                technical safeguards and retention arrangements.
              </p>
              <p>
                Local or offline AI may process information on the user’s device
                or within another locally controlled environment, depending on
                the implementation. If a user later enables cloud sync, cloud AI
                or another networked feature, the information needed for that
                feature may leave the local device.
              </p>
              <p>
                PsyLattice does not use private participant data, sensitive
                psychological data, private thesis content or private AI
                conversations to train a general-purpose model for unrelated
                customers unless a separate, explicit and lawful opt-in
                programme is introduced and clearly presented.
              </p>
            </div>
          ),
        },
        {
          title: "16. Payment and billing information",
          content: (
            <div className="space-y-4">
              <p>
                If you buy a subscription, Study Pass, Workshop, add-on,
                institutional entitlement or other paid service, PsyLattice may
                process the purchaser’s name, email, billing information, tax
                information, selected product, amount, currency, payment status,
                order identifier, transaction identifier, subscription status
                and invoice information.
              </p>
              <p>
                Payment-card or bank details may be collected directly by a
                payment processor rather than stored by PsyLattice. PsyLattice
                may receive limited payment and transaction information needed
                to activate entitlements, reconcile payments and handle support
                or disputes.
              </p>
            </div>
          ),
        },
        {
          title: "17. Workshop and training information",
          content: (
            <div className="space-y-4">
              <p>
                Workshop registration may involve your name, email, institution,
                programme, role, payment or sponsorship status, attendance,
                questions, submitted exercises, certificate details and
                communications relating to the event.
              </p>
              <p>
                If a university or organisation registers or sponsors attendees,
                it may provide registration information to PsyLattice and may
                receive appropriate attendance or completion information where
                this forms part of the arrangement and attendees have been
                appropriately informed.
              </p>
              <p>
                If a Workshop is recorded, attendees will receive appropriate
                notice. Registration alone is not treated as permission for
                PsyLattice to use an identifiable attendee’s image, voice,
                testimonial or personal story in public advertising where
                separate permission is required.
              </p>
            </div>
          ),
        },
        {
          title: "18. Support, complaints and account administration",
          content: (
            <div className="space-y-4">
              <p>
                When you contact PsyLattice, we may process your name, contact
                details, account identifier, transaction ID, the content of the
                request, attachments you choose to send and information
                reasonably necessary to investigate or resolve the issue.
              </p>
              <p>
                Support staff should request only information reasonably needed
                for the issue. Do not send passwords, full payment-card details
                or unrelated participant or clinical datasets through ordinary
                support channels.
              </p>
            </div>
          ),
        },
        {
          title: "19. Device, technical and usage information",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may process technical information such as IP address,
                browser type, device type, operating system, app version,
                language, timestamps, session identifiers, error logs,
                performance information, referring pages and security events.
              </p>
              <p>
                This information may be used to operate the Services,
                troubleshoot errors, maintain security, investigate abuse,
                measure reliability and understand how product features are
                functioning.
              </p>
            </div>
          ),
        },
        {
          title: "20. Cookies, browser storage and similar technologies",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may use cookies, local storage, session storage,
                authentication tokens and similar technologies for sign-in,
                security, preferences, shopping-cart state, session continuity
                and other core functionality.
              </p>
              <p>
                If PsyLattice uses non-essential analytics, advertising or
                similar technologies for which applicable law requires consent,
                those technologies should be activated only after the required
                choice and should be manageable through an appropriate consent
                control.
              </p>
            </div>
          ),
        },
        {
          title: "21. Where personal data comes from",
          content: (
            <div className="space-y-4">
              <p>PsyLattice may receive personal data:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>directly from you;</li>
                <li>
                  from a researcher, university, clinic, employer or other
                  organisation using PsyLattice;
                </li>
                <li>
                  from another authorised user who invites you to a study or
                  workspace;
                </li>
                <li>from a device or service you choose to connect;</li>
                <li>from authentication or payment providers;</li>
                <li>from technical logs generated through use of the Services;</li>
                <li>
                  from data or files lawfully uploaded by an authorised user.
                </li>
              </ul>
              <p>
                An organisation that provides PsyLattice with personal data is
                responsible for having an appropriate basis to do so and for
                providing any notice required by applicable law.
              </p>
            </div>
          ),
        },
        {
          title: "22. Why we process personal data",
          content: (
            <div className="space-y-4">
              <p>Depending on the workflow, PsyLattice may process personal data to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>create, authenticate and administer accounts;</li>
                <li>
                  provide research, participant, analysis, writing and AI
                  functionality;
                </li>
                <li>
                  run questionnaires, cognitive tasks and longitudinal
                  protocols;
                </li>
                <li>deliver authorised reminders and notifications;</li>
                <li>
                  support wearable or sensor integrations chosen by the user or
                  study;
                </li>
                <li>
                  process purchases, subscriptions, Workshop registrations and
                  invoices;
                </li>
                <li>provide support and respond to complaints;</li>
                <li>prevent fraud, abuse and unauthorised access;</li>
                <li>
                  protect users, participant data, accounts and platform
                  security;
                </li>
                <li>maintain reliability and diagnose technical problems;</li>
                <li>comply with legal, tax and accounting requirements;</li>
                <li>establish, exercise or defend legal claims;</li>
                <li>
                  improve the Services using appropriately limited,
                  de-identified or aggregated information where suitable.
                </li>
              </ul>
            </div>
          ),
        },
        {
          title: "23. Legal bases under the GDPR and similar laws",
          content: (
            <div className="space-y-4">
              <p>
                Where the GDPR or a similar legal framework applies, the legal
                basis depends on the activity. PsyLattice may rely on one or
                more of the following:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Contract</strong> where processing is necessary to
                  provide an account, subscription, Workshop or feature
                  requested by the user.
                </li>
                <li>
                  <strong>Legitimate interests</strong> where appropriate for
                  security, fraud prevention, service operation, support or
                  improvement after considering the rights and interests of the
                  individual.
                </li>
                <li>
                  <strong>Consent</strong> for optional activities where consent
                  is the appropriate basis, such as certain integrations,
                  marketing choices or optional data access.
                </li>
                <li>
                  <strong>Legal obligation</strong> where processing is needed
                  for tax, accounting, regulatory or other legal requirements.
                </li>
                <li>
                  Another lawful basis applicable to a particular research,
                  health or institutional workflow.
                </li>
              </ul>
              <p>
                Where special-category data is processed under the GDPR, an
                additional condition under Article 9 or applicable Member State
                law is required. The responsible controller must determine the
                appropriate condition and safeguards for the particular
                processing.
              </p>
            </div>
          ),
        },
        {
          title: "24. Processing under India’s data-protection framework",
          content: (
            <div className="space-y-4">
              <p>
                Where India’s Digital Personal Data Protection Act, 2023 and
                applicable rules apply, PsyLattice processes digital personal
                data for lawful purposes on a basis recognised by applicable
                law, including valid consent or another permitted use where
                available.
              </p>
              <p>
                Where consent is the basis, the relevant notice should describe
                the personal data and specified purpose in clear language and
                provide a practical method to withdraw consent and exercise the
                rights that apply.
              </p>
              <p>
                The Indian framework has phased commencement dates for different
                provisions. PsyLattice applies obligations according to the law
                in force for the relevant processing activity.
              </p>
            </div>
          ),
        },
        {
          title: "25. Sensitive, health and special-category information",
          content: (
            <div className="space-y-4">
              <p>
                Psychological, health, biometric, genetic or other sensitive
                information may receive additional legal protection. A
                researcher or user should not collect sensitive data merely
                because the platform technically permits a field to be created.
              </p>
              <p>
                The party responsible for the processing must have the legal
                basis, special-category condition, consent, research safeguard
                or other authority required by applicable law.
              </p>
              <p>
                Sensitive participant, psychological and health information is
                not used by PsyLattice for unrelated behavioural advertising.
              </p>
            </div>
          ),
        },
        {
          title: "26. Research controller and processor roles",
          content: (
            <div className="space-y-4">
              <p>
                In many researcher-led studies, the researcher, university,
                sponsor or institution determines the scientific purpose,
                participant population, variables, retention period and research
                use of the data. That party may therefore be the controller,
                Data Fiduciary or equivalent responsible party for the research
                processing.
              </p>
              <p>
                PsyLattice may process that data as a processor or service
                provider. A data-processing agreement may describe documented
                instructions, confidentiality, security, subprocessors,
                international transfers, deletion or return of data and
                assistance with privacy rights.
              </p>
              <p>
                PsyLattice may separately act as an independent controller or
                Data Fiduciary for its own account management, billing,
                security, fraud prevention and legal compliance.
              </p>
            </div>
          ),
        },
        {
          title: "27. Consent is specific to the activity",
          content: (
            <div className="space-y-4">
              <p>
                Accepting the PsyLattice Terms does not automatically mean that
                a user has consented to research participation, wearable access,
                professional sharing, marketing, Workshop publicity, every AI
                data flow or every form of personal-data processing.
              </p>
              <p>
                Where consent is required, it should be obtained for the
                relevant purpose. Withdrawing consent does not make earlier
                lawful processing unlawful, and some data may still need to be
                retained where another valid legal basis or obligation applies.
              </p>
            </div>
          ),
        },
        {
          title: "28. Children and minors",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice does not assume that a person is legally able to
                consent to research or sensitive-data processing merely because
                the person can access a study link.
              </p>
              <p>
                Researchers and institutions conducting research involving
                children or minors are responsible for determining the
                applicable age threshold, obtaining parental or guardian
                permission and assent where required, and applying appropriate
                ethical safeguards.
              </p>
              <p>
                Where applicable law requires verifiable parental consent or
                imposes special restrictions on processing children’s data,
                those requirements must be implemented before collecting the
                relevant information.
              </p>
            </div>
          ),
        },
        {
          title: "29. Sharing with researchers and authorised organisations",
          content: (
            <div className="space-y-4">
              <p>
                Research participant data may be made available to the
                researcher, authorised research team, university, sponsor or
                other organisation identified for the study according to the
                study design, permissions and applicable agreement.
              </p>
              <p>
                PsyLattice does not give every researcher access to every
                participant or every study. Access is intended to be restricted
                to the relevant workspace, study, role, invitation or token.
              </p>
              <p>
                Once data is exported or otherwise placed under an
                organisation’s control, that organisation is responsible for
                its downstream access and handling.
              </p>
            </div>
          ),
        },
        {
          title: "30. Institutional administrators and sponsored access",
          content: (
            <div className="space-y-4">
              <p>
                If your account or Workshop access is provided, paid for or
                managed by a university, employer, laboratory, clinic or other
                organisation, authorised administrators may receive account,
                licence, seat, attendance, usage or access information needed to
                manage that arrangement.
              </p>
              <p>
                Institutional sponsorship does not automatically give an
                administrator unrestricted access to private research content,
                thesis drafts, private AI conversations, personal reflections or
                participant-level data unless the product role, institutional
                agreement and applicable law authorise that access.
              </p>
            </div>
          ),
        },
        {
          title: "31. Service providers and subprocessors",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may use service providers for functions such as cloud
                hosting, databases, authentication, file storage, content
                delivery, payment processing, email, push notifications,
                security, monitoring, analytics, customer support and AI model
                access.
              </p>
              <p>
                Providers receive information only as reasonably necessary for
                the function they perform and are subject to contractual,
                confidentiality, security or data-protection obligations as
                appropriate.
              </p>
              <p>
                Where PsyLattice acts as a processor for an institution,
                subprocessor arrangements may also be governed by the applicable
                data-processing agreement.
              </p>
            </div>
          ),
        },
        {
          title: "32. AI service providers",
          content: (
            <div className="space-y-4">
              <p>
                If a user invokes a cloud AI model, the prompt and authorised
                context needed for that request may be sent to the selected AI
                provider. Different AI providers may use different processing
                locations, technical safeguards and limited retention practices.
              </p>
              <p>
                PsyLattice seeks to configure AI providers, where technically
                and contractually available, so submitted business and
                research content is not used for unrelated provider model
                training.
              </p>
              <p>
                Users should not provide participant-identifying or otherwise
                sensitive information to an AI feature unless that use is
                permitted by the relevant study, institution and applicable
                law.
              </p>
            </div>
          ),
        },
        {
          title: "33. Payment providers",
          content: (
            <div className="space-y-4">
              <p>
                Independent payment providers may process card details, bank
                information, fraud signals, payment credentials and transaction
                information under their own privacy terms and legal
                obligations.
              </p>
              <p>
                PsyLattice may receive transaction IDs, order status,
                subscription status and other limited payment information needed
                to activate purchases, reconcile accounts and resolve billing
                issues.
              </p>
            </div>
          ),
        },
        {
          title: "34. Advertising, sponsorships and free access",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may support parts of a free service through
                advertising or sponsorships. Sensitive research, questionnaire,
                psychological, health, wearable, thesis or private
                AI-conversation data is not used by PsyLattice to target
                behavioural advertisements.
              </p>
              <p>
                Advertising may be contextual to the page, product category or
                other non-sensitive context. Any use of non-essential
                advertising technologies remains subject to applicable consent
                and privacy requirements.
              </p>
            </div>
          ),
        },
        {
          title: "35. We do not sell sensitive user or research data",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice does not operate as a data broker and does not sell
                research participant datasets, private psychological
                information, health data, thesis content or private AI
                conversations to third parties for their own unrelated use.
              </p>
              <p>
                If a future activity would legally constitute a “sale” or
                “sharing” of personal information under an applicable law,
                PsyLattice would provide any required disclosure and choice
                before engaging in that activity.
              </p>
            </div>
          ),
        },
        {
          title: "36. Legal disclosures, fraud and safety",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may disclose information where reasonably necessary
                to comply with applicable law, a valid court order, lawful
                government request, regulatory obligation or legal process, or
                to establish, exercise or defend legal claims.
              </p>
              <p>
                We may also disclose limited information where reasonably
                necessary to investigate fraud, abuse, serious security
                incidents, threats to safety or material violations of the
                Terms, subject to applicable law.
              </p>
            </div>
          ),
        },
        {
          title: "37. International data transfers",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice and its service providers may process information in
                more than one country. The location may depend on the user,
                hosting configuration, institution, selected AI provider,
                payment provider or other feature.
              </p>
              <p>
                Where personal data is transferred internationally, PsyLattice
                will use a transfer mechanism or safeguard required by
                applicable law.
              </p>
              <p>
                Institutions with mandatory data-residency requirements should
                confirm those requirements with PsyLattice before collecting
                regulated or restricted data.
              </p>
            </div>
          ),
        },
        {
          title: "38. EEA transfer safeguards",
          content: (
            <div className="space-y-4">
              <p>
                Where the GDPR applies to a transfer outside the European
                Economic Area, safeguards may include an adequacy decision,
                approved Standard Contractual Clauses or another transfer
                mechanism permitted by Chapter V of the GDPR.
              </p>
              <p>
                Supplementary technical, contractual or organisational measures
                may also be used where appropriate.
              </p>
            </div>
          ),
        },
        {
          title: "39. Data residency",
          content: (
            <div className="space-y-4">
              <p>
                A standard PsyLattice account does not guarantee that every
                category of data remains in a particular country unless such a
                commitment is expressly stated in the product, order form or
                written agreement.
              </p>
              <p>
                If a university, clinic or research sponsor requires a specific
                hosting region or localisation arrangement, that requirement
                should be agreed before collecting restricted data.
              </p>
            </div>
          ),
        },
        {
          title: "40. Retention generally",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice does not retain every category of personal data for
                the same period. Retention depends on the purpose, account
                status, plan, study instructions, contractual obligations,
                applicable law, security needs, dispute periods and whether the
                information has been anonymised or de-identified.
              </p>
              <p>
                Where there is no longer a valid purpose or legal reason to keep
                personal data, it should be deleted, anonymised or otherwise
                placed beyond ordinary use according to the relevant retention
                process.
              </p>
            </div>
          ),
        },
        {
          title: "41. Research data retention",
          content: (
            <div className="space-y-4">
              <p>
                Study data may remain available while a study is active and for
                a period afterwards to support analysis, export, research
                integrity, contractual obligations or the responsible
                institution’s retention requirements.
              </p>
              <p>
                Expiry of a Study Pass or subscription does not necessarily mean
                participant responses must immediately be destroyed. A study may
                move into a non-collecting or read-only state while retention
                and export follow the Data Policy, institutional instructions
                and applicable law.
              </p>
              <p>
                Researchers should maintain their own secure copies of records
                their institution requires them to preserve.
              </p>
            </div>
          ),
        },
        {
          title: "42. AI data retention",
          content: (
            <div className="space-y-4">
              <p>
                Retention of AI prompts, responses and authorised context may
                differ by feature and selected model. Some conversation history
                may be stored in PsyLattice to provide continuity, while other
                requests may be transient or subject to provider retention
                controls.
              </p>
              <p>
                Where a feature stores AI history, the product should make that
                state reasonably clear and provide appropriate deletion or
                workspace controls.
              </p>
            </div>
          ),
        },
        {
          title: "43. Workshop records and recordings",
          content: (
            <div className="space-y-4">
              <p>
                Workshop registration, attendance, payment and certificate
                records may be retained for administration, support, fraud
                prevention, accounting, tax, certification and legal purposes.
              </p>
              <p>
                Recordings, attendee chat or submitted exercises should be kept
                only for the period justified by the stated Workshop purpose
                and access model.
              </p>
            </div>
          ),
        },
        {
          title: "44. Backups, security logs and audit records",
          content: (
            <div className="space-y-4">
              <p>
                Security, access and audit information may be retained separately
                where reasonably necessary to investigate incidents, preserve
                platform integrity, comply with law or demonstrate security
                controls.
              </p>
              <p>
                Backups may retain information for a limited period after the
                primary copy is deleted. Backup data is generally isolated from
                ordinary product use and is overwritten or expired according to
                the applicable backup cycle.
              </p>
            </div>
          ),
        },
        {
          title: "45. Account deletion and study deletion",
          content: (
            <div className="space-y-4">
              <p>
                Account deletion may remove or de-identify information that no
                longer needs to be retained. Some records may remain where
                required for billing, tax, fraud prevention, security, legal
                claims, regulatory obligations or research integrity.
              </p>
              <p>
                A researcher deleting an account does not automatically mean
                that every participant record can lawfully or ethically be
                deleted. Research data may remain subject to institutional,
                ethics or legal retention requirements.
              </p>
              <p>
                Where PsyLattice acts as processor for an institution, deletion
                of institutional study data may require instructions from the
                responsible organisation.
              </p>
            </div>
          ),
        },
        {
          title: "46. Offline and desktop data",
          content: (
            <div className="space-y-4">
              <p>
                Desktop or offline versions may store project information or
                local AI data on the user’s device. Information that remains
                local and is never synchronised to PsyLattice servers is
                controlled primarily by the user’s device and local security
                practices.
              </p>
              <p>
                PsyLattice cannot delete or restore local-only files on a device
                it cannot access. Users are responsible for local backups,
                device access controls, encryption and secure disposal of
                devices containing sensitive data.
              </p>
            </div>
          ),
        },
        {
          title: "47. Security measures",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice uses or intends to use safeguards appropriate to the
                nature and risk of the data, including authentication, access
                controls, owner- or role-based permissions, encrypted network
                transport, database security controls, restricted service
                credentials, logging, monitoring, rate limits, backups and
                incident-response procedures where appropriate.
              </p>
              <p>
                Public study participation should use study- or session-scoped
                access rather than broad database permissions. Private backend
                service credentials should not be exposed in public client
                applications.
              </p>
              <p>
                No online service can guarantee absolute security. Users and
                institutions must also protect their devices, credentials,
                exported files and sharing practices.
              </p>
            </div>
          ),
        },
        {
          title: "48. Personal data breaches",
          content: (
            <div className="space-y-4">
              <p>
                If PsyLattice becomes aware of a personal data breach, it will
                investigate, contain and remediate the incident as appropriate.
              </p>
              <p>
                Where applicable law requires notification, PsyLattice will
                notify affected individuals, responsible institutional
                controllers and/or relevant authorities within the legally
                required timeframe.
              </p>
              <p>
                When PsyLattice acts as processor for an institution, breach
                notification and cooperation may also be governed by the
                applicable data-processing agreement.
              </p>
            </div>
          ),
        },
        {
          title: "49. Your privacy rights",
          content: (
            <div className="space-y-4">
              <p>
                Your rights depend on your location, the type of data and
                whether PsyLattice or another organisation is the responsible
                controller or Data Fiduciary.
              </p>
              <p>
                Depending on applicable law, you may have rights to receive
                information about processing, access personal data, correct
                inaccurate information, request deletion, withdraw consent,
                object to or restrict certain processing, receive certain data
                in portable form, nominate another person where legally
                provided, and complain to a regulator.
              </p>
              <p>
                Privacy rights are not always absolute. For example, information
                may need to be retained for legal obligations, research
                integrity, security or defence of legal claims.
              </p>
            </div>
          ),
        },
        {
          title: "50. Rights under India’s DPDP framework",
          content: (
            <div className="space-y-4">
              <p>
                Where India’s Digital Personal Data Protection framework applies
                and the relevant provisions are in force, a Data Principal may
                have rights including access to information about processing,
                correction, completion, updating or erasure of personal data,
                grievance redressal, withdrawal of consent where consent is the
                basis, nomination and other rights provided by applicable law.
              </p>
              <p>
                PsyLattice will provide the mechanisms required by the law as
                the relevant provisions apply to its processing.
              </p>
            </div>
          ),
        },
        {
          title: "51. Rights under the GDPR",
          content: (
            <div className="space-y-4">
              <p>
                Where the GDPR applies, you may have the right to be informed,
                access your personal data, correct inaccurate data, request
                erasure, restrict processing, receive certain data in portable
                form, object to certain processing and withdraw consent where
                consent is the legal basis.
              </p>
              <p>
                You may also lodge a complaint with the competent
                data-protection authority. Withdrawal of consent does not affect
                processing that was lawful before withdrawal.
              </p>
            </div>
          ),
        },
        {
          title: "52. How to exercise your rights",
          content: (
            <div className="space-y-4">
              <p>
                You may use available account controls or contact PsyLattice
                through the{" "}
                <Link
                  href="/contact"
                  className="font-medium underline underline-offset-2"
                >
                  Contact page
                </Link>{" "}
                to make a privacy request.
              </p>
              <p>
                We may need to verify your identity before fulfilling a request
                so personal data is not disclosed, changed or deleted at the
                request of an unauthorised person.
              </p>
              <p>
                If your request concerns data collected for a
                researcher- or university-led study, PsyLattice may direct or
                forward the request to the responsible researcher or institution
                where that party is the controller. PsyLattice will provide
                assistance where required by law or contract.
              </p>
            </div>
          ),
        },
        {
          title: "53. Research withdrawal and privacy deletion are different",
          content: (
            <div className="space-y-4">
              <p>
                Withdrawing from a research study, withdrawing consent for
                future research activity, deleting a PsyLattice account and
                requesting erasure of personal data are different actions.
              </p>
              <p>
                Study materials should explain what happens when a participant
                withdraws and whether data already collected can or must remain
                in the research dataset. The responsible researcher or
                institution determines that position subject to the approved
                protocol and applicable law.
              </p>
            </div>
          ),
        },
        {
          title: "54. Marketing communications",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may send service communications needed for account
                security, billing, study administration or important product
                changes. These are different from optional marketing
                communications.
              </p>
              <p>
                Promotional email or similar marketing will be sent only where
                there is an appropriate legal basis. Users can use the available
                unsubscribe mechanism for optional marketing.
              </p>
            </div>
          ),
        },
        {
          title: "55. Push notifications",
          content: (
            <div className="space-y-4">
              <p>
                If you enable push notifications, PsyLattice may process a
                device registration token, account or participant identifier and
                task or notification identifiers needed to deliver the message.
              </p>
              <p>
                Sensitive questionnaire answers, health values or diagnoses
                should not be included in ordinary notification text unless a
                particular workflow requires it and appropriate safeguards have
                been implemented.
              </p>
              <p>
                Users can change notification permissions through their device
                or operating-system controls where supported.
              </p>
            </div>
          ),
        },
        {
          title: "56. Automated decision-making and profiling",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice is not designed to make solely automated high-stakes
                decisions about a person’s medical care, employment, insurance,
                education or legal rights merely from an AI output or
                questionnaire score.
              </p>
              <p>
                Researchers may configure study branching, eligibility rules,
                randomisation or scoring. The responsible researcher must ensure
                that those rules are lawful, ethically appropriate and
                accurately disclosed where required.
              </p>
              <p>
                If PsyLattice introduces automated decision-making that produces
                legal or similarly significant effects, this Policy and the
                relevant workflow will be updated with the disclosures and
                rights required by applicable law.
              </p>
            </div>
          ),
        },
        {
          title: "57. Product analytics and service improvement",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may use limited technical, usage and performance
                information to understand reliability, fix errors and improve
                the Services.
              </p>
              <p>
                Where practical, product improvement should use aggregated,
                de-identified or otherwise minimised information rather than
                sensitive participant-level research content.
              </p>
              <p>
                Private participant responses, health information, thesis text
                and private AI conversations are not treated as general
                marketing analytics merely because they are stored in the
                platform.
              </p>
            </div>
          ),
        },
        {
          title: "58. De-identified and aggregated information",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may create aggregated or de-identified information for
                reliability, security, product measurement and improvement where
                the information is no longer reasonably linked to an identifiable
                person under applicable law.
              </p>
              <p>
                We do not describe information as anonymous where identifiers or
                combinations of data still make individuals reasonably
                identifiable.
              </p>
            </div>
          ),
        },
        {
          title: "59. Third-party links and external resources",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may link to journals, questionnaire publishers,
                university resources, payment pages, external documentation or
                other third-party services.
              </p>
              <p>
                A link from PsyLattice does not mean PsyLattice controls the
                third party’s privacy practices. Users should review the privacy
                terms of external services they choose to use.
              </p>
            </div>
          ),
        },
        {
          title: "60. Business transfers and changes of ownership",
          content: (
            <div className="space-y-4">
              <p>
                If PsyLattice is incorporated, reorganised, financed, merged,
                acquired or transfers all or part of its business, personal data
                may be transferred as part of that transaction where lawful and
                subject to appropriate confidentiality and data-protection
                safeguards.
              </p>
              <p>
                If the identity of the responsible controller materially changes,
                affected users will receive any notice required by applicable
                law.
              </p>
            </div>
          ),
        },
        {
          title: "61. Changes to this Privacy Policy",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may update this Policy when the Services, data
                practices, service providers, legal requirements or
                organisational structure change.
              </p>
              <p>
                The latest version will display an updated date. Where a material
                change requires advance notice, consent or another action,
                PsyLattice will provide it before the new processing takes
                effect where required by applicable law.
              </p>
            </div>
          ),
        },
        {
          title: "62. Privacy contact and complaints",
          content: (
            <div className="space-y-4">
              <p>
                Privacy questions, requests and complaints can be submitted
                through the{" "}
                <Link
                  href="/contact"
                  className="font-medium underline underline-offset-2"
                >
                  PsyLattice Contact page
                </Link>
                .
              </p>
              <p>
                The production legal notice should identify the responsible
                operator, postal address, privacy or grievance contact and any
                Data Protection Officer, EU representative or other statutory
                representative required by applicable law.
              </p>
              <p>
                Where applicable, you may also have the right to complain to the
                competent privacy or data-protection authority in your
                jurisdiction.
              </p>
            </div>
          ),
        },
        {
          title: "63. Related legal documents",
          content: (
            <div className="space-y-4">
              <p>
                This Privacy Policy should be read together with the{" "}
                <Link
                  href="/terms"
                  className="font-medium underline underline-offset-2"
                >
                  Terms and Conditions
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
              <p>
                Research participants should also read the participant
                information and consent materials for their specific study.
                Workshop attendees and institutional users should review any
                additional privacy notice or written agreement provided for the
                relevant service.
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
