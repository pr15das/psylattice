"use client";

import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

/*
  PSYLATTICE TERMS AND CONDITIONS
  Last updated: 21 September 2026

  IMPORTANT IMPLEMENTATION NOTE:
  This is a comprehensive production-oriented legal draft, not a substitute
  for advice from counsel. Before commercial launch, counsel should confirm:
  - operator legal name, registered/principal address and tax details;
  - governing-law / venue wording for the final operating entity;
  - consumer cancellation and withdrawal flows in each launch market;
  - privacy/data-processing documents and data-controller / processor roles;
  - workshop cancellation/refund operations;
  - institutional and "lifetime" licence wording;
  - liability cap and indemnity wording;
  - clinical / health-product positioning if those features are enabled.
*/

const UPDATED = "21 September 2026";

export default function TermsPage() {
  return (
    <PublicInfoPage
      eyebrow="Legal"
      title="Terms and Conditions"
      description="These Terms and Conditions govern access to and use of PsyLattice, including research tools, participant experiences, AI-assisted features, workshops, institutional access, desktop software, paid plans and any supported clinical or self-guided features."
      notice={`Last updated ${UPDATED}. These Terms should be read together with the Privacy Policy, Data Policy, any checkout terms, workshop registration terms, institutional order form, data-processing agreement or other written agreement that expressly applies to your use of PsyLattice. Mandatory rights under applicable law are not excluded by these Terms.`}
      sections={[
        {
          title: "1. Agreement to these Terms",
          content: (
            <div className="space-y-4">
              <p>
                These Terms and Conditions (the “Terms”) form a legally binding
                agreement governing access to and use of PsyLattice websites,
                applications, mobile experiences, research workspaces, study links,
                participant interfaces, Cognitive Lab, ambulatory and longitudinal
                assessment tools, Analysis Lab, Thesis Builder, AI-assisted features,
                workshops, downloadable or desktop software, institutional services
                and other services made available under the PsyLattice name
                (collectively, the “Services”).
              </p>
              <p>
                By creating an account, accepting an invitation, activating a study,
                purchasing a plan or Study Pass, registering for a workshop, using an
                institutional licence, downloading supported software, participating
                in a study through PsyLattice, or otherwise accessing the Services,
                you agree to these Terms to the extent applicable to your role.
              </p>
              <p>
                If you are using the Services on behalf of a university, company,
                clinic, laboratory, research group or other organisation, you
                represent that you are authorised to act for that organisation where
                such authority is required. If you do not agree to these Terms, do not
                use the Services.
              </p>
            </div>
          ),
        },
        {
          title: "2. Who operates PsyLattice",
          content: (
            <div className="space-y-4">
              <p>
                “PsyLattice”, “we”, “us” and “our” refer to the person or legal entity
                identified as the operator of PsyLattice on the Contact page, legal
                notice, invoice, checkout page or applicable institutional agreement.
                The legal operator may change as the business is incorporated,
                reorganised or transferred, subject to applicable law and appropriate
                notice.
              </p>
              <p>
                If a separate written agreement identifies a different contracting
                entity for a particular institutional, workshop, enterprise or
                professional arrangement, that agreement controls for that
                arrangement to the extent of any conflict.
              </p>
            </div>
          ),
        },
        {
          title: "3. Order of documents and conflicts",
          content: (
            <div className="space-y-4">
              <p>
                These Terms are the general terms for the Services. Additional terms
                may apply to a particular purchase, workshop, university licence,
                pilot, enterprise deployment, data-processing arrangement, feature,
                promotion or beta programme.
              </p>
              <p>
                Unless a document expressly states otherwise, the order of priority is:
                (1) a signed institutional or enterprise agreement; (2) a signed data
                processing or other specialised agreement for the specific subject
                matter it covers; (3) a specific order form or checkout entitlement;
                (4) specific workshop or event terms; and (5) these Terms.
              </p>
              <p>
                The Privacy Policy and Data Policy govern personal-data handling and
                data lifecycle matters. They supplement these Terms rather than
                replacing them.
              </p>
            </div>
          ),
        },
        {
          title: "4. What PsyLattice is",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice is a technology platform intended to support structured
                psychological and behavioural research workflows. Depending on the
                features made available to your account, PsyLattice may support study
                design, questionnaire workflows, Cognitive Lab tasks, batteries,
                ecological momentary assessment (“EMA”), experience sampling,
                longitudinal measurement, participant management, wearable or sensor
                context, statistical analysis, exports, research writing and
                contextual AI assistance.
              </p>
              <p>
                PsyLattice may also provide separate self-guided or professional
                experiences, including PsyLattice Self, Luna or similar AI guidance,
                and clinician-client workflows. Those features apply only where they
                are expressly enabled and presented to the user.
              </p>
              <p>
                PsyLattice is infrastructure and software. It is not the researcher,
                research sponsor, ethics committee, university, healthcare provider,
                therapist, publisher, statistical consultant of record or legal
                adviser for a user unless a separate written agreement expressly says
                otherwise.
              </p>
            </div>
          ),
        },
        {
          title: "5. No emergency, diagnostic or medical service",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice is not an emergency service. The Services are not
                continuously monitored by emergency personnel and must not be relied
                upon to detect, prevent or respond to an emergency in real time.
              </p>
              <p>
                Unless a specific regulated feature is expressly identified otherwise,
                PsyLattice does not independently diagnose medical or mental-health
                conditions, prescribe medication, provide psychotherapy, provide
                medical treatment or replace assessment and judgment by an
                appropriately qualified professional.
              </p>
              <p>
                Questionnaire results, scores, trends, AI-generated explanations,
                statistical results, alerts and summaries may assist reflection,
                research or professional discussion, but must not be treated as a
                definitive diagnosis or as the sole basis for a high-stakes medical,
                mental-health, employment, insurance, educational or legal decision.
              </p>
              <p>
                If you believe you or another person is in immediate danger, contact
                the emergency services or an appropriate emergency resource available
                in your location rather than relying on PsyLattice.
              </p>
            </div>
          ),
        },
        {
          title: "6. Eligibility, legal capacity and minors",
          content: (
            <div className="space-y-4">
              <p>
                Accounts intended for researchers, professionals, administrators,
                institutional purchasers and individual paid users are generally
                intended for persons who have legal capacity to enter into a contract.
                Additional age requirements may be displayed for specific features or
                regions.
              </p>
              <p>
                Research involving minors or other participants who cannot provide
                legally sufficient consent may only use PsyLattice where the
                responsible researcher and institution have determined that the
                workflow is lawful and ethically appropriate and have obtained all
                required parental permission, guardian authorisation, assent, consent,
                approvals and safeguards.
              </p>
              <p>
                PsyLattice does not independently determine whether a participant has
                legal capacity to consent to a particular study. That responsibility
                remains with the researcher, institution or other party responsible
                for the study.
              </p>
            </div>
          ),
        },
        {
          title: "7. Accounts, credentials and security",
          content: (
            <div className="space-y-4">
              <p>
                You must provide accurate information and keep account information
                reasonably current. You are responsible for protecting your password,
                authentication credentials, recovery methods and devices used to
                access the Services.
              </p>
              <p>
                You must not share a professional or administrator account with
                another person, impersonate another user, falsely claim professional
                credentials, bypass access controls or access another user’s workspace
                without authorisation.
              </p>
              <p>
                You must promptly notify PsyLattice if you reasonably believe that
                your account, credentials, study link, administrative access or
                institution-managed workspace has been compromised.
              </p>
              <p>
                PsyLattice may require re-authentication, password reset, identity
                verification or other reasonable security steps where suspicious or
                high-risk activity is detected.
              </p>
            </div>
          ),
        },
        {
          title: "8. Professional, researcher and institutional verification",
          content: (
            <div className="space-y-4">
              <p>
                Some researcher, clinician, university, institutional, administrative
                or professional features may require verification of identity,
                affiliation, educational status, professional registration, licence,
                domain ownership or other credentials.
              </p>
              <p>
                Verification means only that PsyLattice has completed the checks
                described for that workflow. It is not an endorsement, certification
                or warranty of the person’s competence, ethical conduct, research
                quality, qualifications, professional services or current legal
                authority to practise.
              </p>
              <p>
                False, expired, misleading or unverifiable credentials may result in
                restricted features, suspension or termination.
              </p>
            </div>
          ),
        },
        {
          title: "9. Researcher role and responsibility",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice provides research infrastructure; it does not assume the
                researcher’s scientific, ethical, institutional or legal
                responsibilities. The researcher, principal investigator, sponsor or
                institution remains responsible for the study.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>selecting an appropriate research question and design;</li>
                <li>obtaining ethics, IRB, REC, institutional or other approvals;</li>
                <li>providing accurate participant information;</li>
                <li>obtaining valid informed consent or other required permission;</li>
                <li>establishing a lawful basis for collection and use of data;</li>
                <li>protecting minors, vulnerable participants and at-risk groups;</li>
                <li>determining appropriate inclusion and exclusion criteria;</li>
                <li>responding to adverse events and study-related risks;</li>
                <li>maintaining protocol, consent and regulatory documentation;</li>
                <li>ensuring lawful recruitment and compensation practices;</li>
                <li>obtaining rights to instruments, media and other study content;</li>
                <li>checking scoring, transformations, exports and analyses;</li>
                <li>preserving data and records required by the institution or law;</li>
                <li>making final scientific interpretations and publication claims.</li>
              </ul>
              <p>
                The fact that PsyLattice technically permits a workflow does not mean
                that the workflow is ethically approved, scientifically valid or
                legally permitted in the researcher’s jurisdiction.
              </p>
            </div>
          ),
        },
        {
          title: "10. Ethics approval, consent and protocol changes",
          content: (
            <div className="space-y-4">
              <p>
                Researchers must determine whether their study requires approval by an
                ethics committee, institutional review board, research ethics
                committee, data protection office, sponsor, university or other
                authority. PsyLattice does not provide or imply such approval.
              </p>
              <p>
                Researchers are responsible for ensuring that the participant
                information sheet, consent process, withdrawal process and any
                debriefing materials accurately reflect the actual study.
              </p>
              <p>
                If a researcher materially changes a live study after recruitment has
                started—including its measures, randomisation, intervention,
                participant burden, consent text, data categories, scoring, incentives
                or risk profile—the researcher must determine whether a protocol
                amendment, new version, renewed consent, re-approval or separate study
                is required.
              </p>
            </div>
          ),
        },
        {
          title: "11. Research participants",
          content: (
            <div className="space-y-4">
              <p>
                A research participant may be able to use a study link or participant
                companion without purchasing a personal PsyLattice subscription.
                Participation in a research study is separate from becoming a paying
                PsyLattice customer.
              </p>
              <p>
                The responsible researcher or institution determines the study
                purpose, eligibility criteria, consent materials, recruitment,
                incentives, withdrawal arrangements and study-specific contact
                details. Questions about the scientific study should normally be
                directed to that researcher or institution.
              </p>
              <p>
                PsyLattice is responsible for operating the platform functions it
                provides, but is not responsible for the researcher’s scientific
                claims, participant recruitment statements, compensation promises,
                ethics compliance or decisions about an individual participant unless
                the issue is directly caused by PsyLattice’s own breach of applicable
                obligations.
              </p>
            </div>
          ),
        },
        {
          title: "12. Study links, sessions and participant limits",
          content: (
            <div className="space-y-4">
              <p>
                Study links may be unique, reusable, tokenised, access-controlled or
                otherwise configured depending on the study. Researchers are
                responsible for distributing links in a manner appropriate to the
                study and for avoiding publication of private or restricted links
                where that would compromise the protocol.
              </p>
              <p>
                Participant limits may be measured using unique participants,
                allocations, started live sessions or another method displayed for the
                relevant product. A participant or session may count toward a limit
                once genuine live data collection has started even if the participant
                does not complete the study.
              </p>
              <p>
                Preview, sandbox and test sessions are intended for genuine testing.
                They must not be used as a method of avoiding paid live-study,
                participant or usage limits.
              </p>
            </div>
          ),
        },
        {
          title: "13. Questionnaires, scales and third-party instruments",
          content: (
            <div className="space-y-4">
              <p>
                A questionnaire, scale, scoring description, citation, manual,
                reference or other resource appearing in PsyLattice may be owned by a
                third party and may be subject to copyright, licence, attribution,
                translation, commercial-use, qualification, administration or
                redistribution restrictions.
              </p>
              <p>
                Availability in the interface does not itself grant the user a
                licence. Researchers and professionals remain responsible for
                confirming that their intended use is permitted and for purchasing or
                obtaining any required rights.
              </p>
              <p>
                PsyLattice may modify, disable or remove an instrument or resource if
                required by a rights holder, licence term, legal requirement or
                product decision. PsyLattice is not liable for a user’s unauthorised
                use of a third-party instrument.
              </p>
            </div>
          ),
        },
        {
          title: "14. Cognitive tasks and behavioural measures",
          content: (
            <div className="space-y-4">
              <p>
                Cognitive tasks and behavioural measures may be affected by browser
                timing, display characteristics, device performance, keyboard or
                touchscreen latency, operating-system scheduling, network conditions,
                participant environment and other technical factors.
              </p>
              <p>
                Researchers are responsible for determining whether a PsyLattice task
                is suitable for the precision and validity requirements of their
                study, piloting the task, documenting administration conditions and
                accounting for device or environment variability where relevant.
              </p>
              <p>
                PsyLattice does not warrant that a browser-based or consumer-device
                task is equivalent to specialised laboratory hardware unless that
                equivalence is expressly stated and validated for the relevant
                configuration.
              </p>
            </div>
          ),
        },
        {
          title: "15. Ambulatory, longitudinal, EMA and experience-sampling research",
          content: (
            <div className="space-y-4">
              <p>
                Repeated and real-world assessments depend on participant availability,
                device notifications, operating-system behaviour, network access,
                permissions, battery state and participant compliance. Notifications
                may be delayed, suppressed or missed.
              </p>
              <p>
                Researchers must design schedules and contingencies that do not assume
                guaranteed delivery at an exact second unless PsyLattice expressly
                provides such a guarantee for the relevant feature.
              </p>
              <p>
                PsyLattice is not responsible for missing responses caused by
                participant non-compliance, disabled notifications, device-level
                restrictions, unsupported hardware, loss of connectivity or other
                circumstances outside PsyLattice’s reasonable control.
              </p>
            </div>
          ),
        },
        {
          title: "16. Wearables, sensors and external health data",
          content: (
            <div className="space-y-4">
              <p>
                Where supported, wearable, health-platform or sensor integrations may
                depend on third-party devices, operating systems, permissions,
                regional availability, APIs and user configuration.
              </p>
              <p>
                Consumer wearable or sensor data may be incomplete, delayed,
                duplicated, estimated or inaccurate. Such data must not be treated as
                medical-grade measurements unless the relevant device, workflow and
                use are expressly identified as such.
              </p>
              <p>
                PsyLattice is not responsible for the accuracy, continued availability,
                certification or operation of third-party hardware or external data
                sources outside its reasonable control.
              </p>
            </div>
          ),
        },
        {
          title: "17. Analysis Lab and statistical outputs",
          content: (
            <div className="space-y-4">
              <p>
                Analysis Lab may calculate descriptive statistics, correlations,
                effect sizes, regressions, generalised linear models, mixed models,
                analysis of variance, visualisations and other supported analyses.
              </p>
              <p>
                Statistical output depends on the supplied data, selected options,
                coding decisions, assumptions, missing-data handling, model
                specification and implementation. A technically computed result is
                not a guarantee that the chosen analysis is scientifically
                appropriate.
              </p>
              <p>
                Users must independently review important results before publication,
                submission, grading, clinical use or other consequential reliance.
                Where appropriate, users should compare results against established
                software, documentation or qualified statistical advice.
              </p>
              <p>
                PsyLattice is not responsible for conclusions that arise from
                incorrect data entry, inappropriate variable coding, invalid model
                selection, violated assumptions, misunderstood output or user-edited
                data unless the relevant harm is directly caused by a defect for
                which liability cannot lawfully be excluded or limited.
              </p>
            </div>
          ),
        },
        {
          title: "18. AI-assisted features",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may provide AI-assisted features such as Research AI,
                Analyst AI, writing assistance, PsyLattice AI, Luna or integrations
                with third-party AI models. AI may help explain interfaces, draft
                text, summarise information, discuss analyses, assist writing or
                provide contextual guidance.
              </p>
              <p>
                AI-generated content can be inaccurate, incomplete, fabricated,
                misleading, biased or inappropriate for the user’s purpose. AI output
                is not a substitute for independent verification, professional
                judgment, statistical review, scientific responsibility, legal advice
                or clinical judgment.
              </p>
              <p>
                Users are responsible for reviewing AI-generated text, calculations,
                references, interpretations and recommendations before using them in a
                thesis, paper, report, clinical context, participant communication,
                publication or professional decision.
              </p>
              <p>
                AI access may be subject to model availability, plan entitlements,
                token, cost, rolling, daily, monthly, rate, safety, abuse-prevention
                and fair-use limits. A paid plan does not create a right to unlimited
                AI usage unless expressly stated in a written entitlement, and even an
                “unlimited” entitlement remains subject to reasonable anti-abuse,
                security and technical safeguards.
              </p>
            </div>
          ),
        },
        {
          title: "19. Permission-controlled AI context",
          content: (
            <div className="space-y-4">
              <p>
                Where PsyLattice offers permission controls for AI access to a study,
                document, analysis, dataset or other workspace material, the AI should
                receive that context only according to the permission state and
                technical workflow presented to the user.
              </p>
              <p>
                Users remain responsible for deciding whether the relevant material is
                appropriate to provide to an AI feature, including whether they are
                permitted to disclose participant, confidential, copyrighted,
                institutional or personal information.
              </p>
              <p>
                The Privacy Policy and Data Policy describe applicable processing,
                third-party AI providers and data handling in more detail.
              </p>
            </div>
          ),
        },
        {
          title: "20. Thesis Builder, writing assistance and academic integrity",
          content: (
            <div className="space-y-4">
              <p>
                Thesis Builder and writing assistance are tools for drafting,
                organising, formatting and revising academic work. They do not
                guarantee that a thesis, dissertation, paper, assignment, ethics
                submission or publication meets the requirements of a university,
                journal, supervisor, examiner, funding body or professional
                association.
              </p>
              <p>
                Users must comply with the academic-integrity, authorship,
                acknowledgement, AI-use, citation and disclosure rules that apply to
                their institution or publication.
              </p>
              <p>
                PsyLattice is not responsible for plagiarism, fabricated citations,
                undisclosed AI use, academic misconduct, examination penalties,
                rejection, failed assessment, delayed graduation or publication
                decisions resulting from the user’s content or use of AI-generated
                material.
              </p>
            </div>
          ),
        },
        {
          title: "21. PsyLattice workshops and training — general terms",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may offer live, online, in-person, hybrid, university-hosted
                or recorded workshops, classes, demonstrations, bootcamps, research
                training sessions and other educational events (“Workshops”).
              </p>
              <p>
                Workshops are educational services. Unless expressly stated in writing,
                a Workshop is not a university course, degree, diploma, regulated
                professional qualification, clinical training programme, licence to
                practise, continuing-professional-development accreditation or
                guarantee of academic credit.
              </p>
              <p>
                Workshop descriptions, dates, instructors, modules, software features,
                exercises, examples and learning outcomes may be updated where
                reasonably necessary. PsyLattice may use illustrative or synthetic
                examples rather than real participant data.
              </p>
            </div>
          ),
        },
        {
          title: "22. Workshop registration, fees and access",
          content: (
            <div className="space-y-4">
              <p>
                Workshop places may be limited and are not confirmed until the
                registration requirements stated for the event are completed. The fee,
                currency, taxes, included platform access, access duration, attendance
                format and any institution-specific arrangement shown at registration
                or on the applicable order form control for that Workshop.
              </p>
              <p>
                A Workshop fee may include temporary access to specified PsyLattice
                features, exercises, sample projects, recordings or materials. Any
                temporary account, paid feature, AI allowance or workshop-only access
                expires at the time stated in the Workshop offer and does not create a
                permanent entitlement.
              </p>
              <p>
                Unless expressly stated otherwise, attendees are responsible for their
                own compatible device, browser, internet connection, electricity,
                travel, accommodation, meals, visas, insurance and other personal
                costs associated with attendance.
              </p>
            </div>
          ),
        },
        {
          title: "23. Workshop educational outcomes and certificates",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may describe intended learning outcomes, but does not
                guarantee that every attendee will master a particular statistical,
                methodological, experimental, programming or research skill.
              </p>
              <p>
                Attendance does not guarantee improved grades, thesis approval,
                publication, employment, admission, funding, research success,
                certification or professional competence.
              </p>
              <p>
                If a certificate is offered, it is normally a certificate of
                attendance or completion only. PsyLattice may require minimum
                attendance, completion of activities or accurate registration
                information before issuing it. A certificate is not academic credit,
                professional registration or accreditation unless the Workshop
                expressly states otherwise.
              </p>
            </div>
          ),
        },
        {
          title: "24. Workshop conduct and participant responsibilities",
          content: (
            <div className="space-y-4">
              <p>
                Attendees must behave respectfully and must not harass instructors,
                staff or other attendees, disrupt the session, compromise accounts or
                networks, distribute malware, misuse demonstration systems or record
                restricted material.
              </p>
              <p>
                PsyLattice may remove an attendee from a Workshop where reasonably
                necessary for safety, harassment, serious disruption, cheating,
                credential sharing, unlawful conduct, security risk or material breach
                of these Terms. A refund may be refused where removal results from the
                attendee’s serious misconduct, subject to applicable law.
              </p>
              <p>
                Attendees must not upload or display confidential participant data,
                patient information, unpublished proprietary datasets or other
                sensitive information in a public classroom or demonstration unless
                they have authority to do so and appropriate safeguards are in place.
              </p>
            </div>
          ),
        },
        {
          title: "25. Workshop recordings, photographs and privacy",
          content: (
            <div className="space-y-4">
              <p>
                If a Workshop will be recorded for delivery, quality, replay or
                educational purposes, PsyLattice will provide appropriate notice.
                Attendees must not make their own audio, video or screen recording of
                the Workshop unless permission is given.
              </p>
              <p>
                PsyLattice will not treat registration alone as permission to use an
                identifiable attendee’s image, voice, testimonial or personal story in
                public advertising where separate consent is required. Promotional
                use may be requested through a separate consent process.
              </p>
              <p>
                Attendees should avoid disclosing unnecessary personal or sensitive
                information in chat, Q&amp;A, shared screens or group discussions.
                Information voluntarily shared with other attendees may be seen or
                repeated by them, and PsyLattice cannot fully control independent
                conduct by third parties.
              </p>
            </div>
          ),
        },
        {
          title: "26. Workshop research demonstrations",
          content: (
            <div className="space-y-4">
              <p>
                A classroom demonstration, practice survey, mock study, synthetic
                dataset or example participant flow is educational and is not
                automatically an approved research project.
              </p>
              <p>
                If students, instructors or institutions intend to use Workshop
                activity for genuine research, publication, thesis data, participant
                recruitment or other systematic data collection, the responsible
                researcher must separately determine and satisfy all ethics, consent,
                privacy and institutional requirements.
              </p>
              <p>
                PsyLattice is not responsible for a Workshop attendee treating a
                demonstration as ethically approved live research without the
                necessary approvals.
              </p>
            </div>
          ),
        },
        {
          title: "27. Workshop cancellation, rescheduling and refunds",
          content: (
            <div className="space-y-4">
              <p>
                A Workshop may have event-specific cancellation and refund rules shown
                at registration. Those specific rules control where they are more
                specific than this section.
              </p>
              <p>
                If PsyLattice cancels a paid Workshop and does not provide a
                substantially equivalent replacement, the attendee will ordinarily be
                offered a refund of the Workshop fee paid to PsyLattice or another
                remedy required by applicable law. PsyLattice is not responsible for
                independently booked travel, accommodation, visa, wage, opportunity
                or other consequential costs unless applicable law requires otherwise
                or PsyLattice expressly agreed in writing to cover them.
              </p>
              <p>
                PsyLattice may reschedule a Workshop, change venue, replace an
                instructor or move between in-person and online delivery where
                reasonably necessary. If the change is material, attendees will be
                given the options required by the event terms and applicable law.
              </p>
              <p>
                If an attendee cancels, misses a Workshop, arrives late or cannot
                attend because of personal device, travel, internet or scheduling
                issues, eligibility for a refund or transfer is governed by the
                cancellation policy shown at registration and any mandatory consumer
                rights.
              </p>
            </div>
          ),
        },
        {
          title: "28. Workshop materials and intellectual property",
          content: (
            <div className="space-y-4">
              <p>
                Slides, exercises, templates, teaching notes, recordings, diagrams,
                sample studies, demonstrations and other Workshop materials are owned
                by or licensed to PsyLattice or the identified third-party owner.
              </p>
              <p>
                Unless expressly stated otherwise, registration grants the attendee a
                limited, personal, non-exclusive, non-transferable right to use
                supplied materials for their own learning and internal academic work.
                Materials may not be resold, republished, publicly uploaded,
                redistributed as a competing course or used to train a commercial
                model without permission.
              </p>
              <p>
                Attendees retain ownership of original work they create, subject to
                rights in any PsyLattice templates, software, third-party materials or
                pre-existing content incorporated into that work.
              </p>
            </div>
          ),
        },
        {
          title: "29. University, institutional and sponsored Workshops",
          content: (
            <div className="space-y-4">
              <p>
                A university or organisation may sponsor or host a Workshop, purchase
                seats, provide a venue, distribute access codes or impose additional
                academic or conduct requirements. That organisation may have a
                separate agreement with PsyLattice.
              </p>
              <p>
                PsyLattice is not responsible for statements, grading decisions,
                attendance requirements, credit decisions, disciplinary actions or
                other independent decisions made by the host institution.
              </p>
              <p>
                Where an institution pays for attendance, any refund may be made to
                the institution rather than directly to the attendee if the
                institution was the purchaser.
              </p>
            </div>
          ),
        },
        {
          title: "30. Researcher Free, Study Pass and recurring plans",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may offer free plans, one-time Study Passes, recurring
                Researcher plans, add-ons, participant packs, AI allowances, storage,
                messaging or other paid entitlements. Current prices and included
                features are shown on the Pricing page, order form or checkout.
              </p>
              <p>
                The price, currency, billing period, participant allocation,
                live-study allowance, collection period, media entitlement, AI
                allowance and other terms displayed at the time of purchase control
                that purchase unless a signed agreement states otherwise.
              </p>
              <p>
                A Study Pass is a one-time entitlement for the identified study unless
                the purchase page expressly says otherwise. A recurring plan renews
                only where recurring billing is clearly disclosed and authorised.
              </p>
            </div>
          ),
        },
        {
          title: "31. University and institutional licences",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may offer university, laboratory, department, classroom,
                enterprise or other institutional licences. The permitted number of
                administrators, researchers, students, devices, workspaces, active
                studies, participants, offline installations or other entitlements is
                determined by the applicable order form or written agreement.
              </p>
              <p>
                The purchasing institution is responsible for authorised-user
                management, internal access decisions, use by its staff or students
                and compliance with any institution-specific restrictions.
              </p>
              <p>
                Institutional access must not be resold, sublicensed, shared outside
                the authorised institution or used to operate an unrelated commercial
                service unless the agreement expressly permits it.
              </p>
            </div>
          ),
        },
        {
          title: "32. Meaning of a “lifetime” licence",
          content: (
            <div className="space-y-4">
              <p>
                If PsyLattice expressly sells an entitlement described as “lifetime”,
                “one-time” or similar, “lifetime” does not mean the natural lifetime of
                an individual and does not guarantee that every feature, external
                provider or cloud service will exist forever.
              </p>
              <p>
                Unless a written order states otherwise, a lifetime licence means the
                right to use the licensed core software or institutional entitlement
                for as long as PsyLattice materially offers and supports that licensed
                product line, subject to these Terms, security requirements, legal
                changes and technical compatibility.
              </p>
              <p>
                Third-party AI models, email delivery, SMS, paid messaging, premium
                storage, external APIs, additional cloud compute, payment-provider
                costs or other metered services may remain separately chargeable even
                where a core platform or desktop licence is described as lifetime or
                unlimited.
              </p>
            </div>
          ),
        },
        {
          title: "33. “Unlimited” usage and fair use",
          content: (
            <div className="space-y-4">
              <p>
                Where a plan is described as providing “unlimited” participants, AI,
                studies or another resource, that description means PsyLattice does
                not impose the ordinary metered plan cap identified for standard use.
                It does not permit abusive automation, denial-of-service behaviour,
                credential sharing, resale, scraping, bulk model exploitation or use
                that threatens service stability, security or third-party terms.
              </p>
              <p>
                PsyLattice may apply reasonable rate limits, concurrency limits,
                anti-fraud safeguards, model-specific technical limits or temporary
                restrictions to protect the Services. If ordinary legitimate use is
                materially affected, PsyLattice will use reasonable efforts to work
                with the affected customer.
              </p>
            </div>
          ),
        },
        {
          title: "34. Add-ons, marketplace items and extra capacity",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may offer add-ons for participant capacity, AI usage,
                storage, email, notifications, study duration, media, models or other
                resources. Add-ons may be attached to an account, plan, study or
                institution as stated at purchase.
              </p>
              <p>
                Unless expressly stated otherwise, unused add-on capacity has no cash
                value, is not transferable between unrelated accounts and does not
                automatically roll over after the stated validity period.
              </p>
            </div>
          ),
        },
        {
          title: "35. Payments, payment processors and taxes",
          content: (
            <div className="space-y-4">
              <p>
                Prices, currency, billing frequency and applicable taxes or fees are
                shown before purchase. You authorise the selected payment provider to
                process the payment method you choose for the transaction and for
                recurring renewals that you expressly authorise.
              </p>
              <p>
                Payment processing may be performed by a third-party payment service.
                PsyLattice may receive transaction identifiers, payment status and
                limited billing information needed to reconcile purchases and support
                users, while payment-card handling may be performed by the payment
                provider.
              </p>
              <p>
                You are responsible for taxes that apply to you except taxes imposed
                on PsyLattice’s own income. Institutional purchasers must provide
                accurate invoicing and tax information where required.
              </p>
            </div>
          ),
        },
        {
          title: "36. Recurring billing, cancellation and failed payments",
          content: (
            <div className="space-y-4">
              <p>
                A recurring subscription renews for the billing period shown at
                checkout until cancelled. Cancellation stops future renewal and
                normally takes effect at the end of the current paid period unless the
                applicable offer or law provides otherwise.
              </p>
              <p>
                If payment fails, PsyLattice may retry payment where authorised,
                provide a grace period, restrict paid-only features or move the account
                to an eligible free/read-only state. Existing research responses will
                not be intentionally altered merely because a subscription ends.
              </p>
              <p>
                Users should export records needed for long-term retention before a
                paid entitlement expires.
              </p>
            </div>
          ),
        },
        {
          title: "37. Refunds and mandatory consumer rights",
          content: (
            <div className="space-y-4">
              <p>
                Refund eligibility is determined by the purchase type, the refund
                policy displayed at checkout, whether the service has been activated
                or materially consumed, and applicable law.
              </p>
              <p>
                A one-time Study Pass, Workshop, add-on or other digital entitlement
                may become non-refundable after activation, live data collection,
                substantial use, delivery of digital materials or another point
                disclosed before purchase, except where applicable law requires a
                refund.
              </p>
              <p>
                Nothing in these Terms removes a statutory cancellation, withdrawal,
                conformity, refund or other consumer right that cannot lawfully be
                excluded. Region-specific checkout notices may provide additional
                rights or procedures.
              </p>
              <p>
                Where a jurisdiction provides a cooling-off period for a digital
                service or digital content, the user may be asked to expressly request
                immediate performance and acknowledge any lawful effect that immediate
                performance has on the right of withdrawal.
              </p>
            </div>
          ),
        },
        {
          title: "38. Changes to prices and entitlements",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may change future prices, packaging, limits and feature
                availability. A price change does not retroactively change a completed
                one-time purchase.
              </p>
              <p>
                For recurring subscriptions, material price changes will be
                communicated as required by applicable law and will normally apply to
                a future renewal rather than an already-paid billing period.
              </p>
              <p>
                PsyLattice may improve, replace or retire features where reasonably
                necessary for security, law, product quality, provider availability
                or technical reasons. Where a material change substantially reduces a
                paid entitlement, PsyLattice will provide the notice or remedy
                required by applicable law and any applicable agreement.
              </p>
            </div>
          ),
        },
        {
          title: "39. Privacy and personal data",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may process account, research, participant, professional,
                psychological, behavioural, health-related and technical information.
                The Privacy Policy and Data Policy describe how personal data is
                collected, used, disclosed, retained, protected and otherwise
                processed.
              </p>
              <p>
                Agreeing to these Terms is not automatically consent to every type of
                personal-data processing, research participation, clinician sharing,
                optional integration, marketing or AI use. Separate consent,
                permission or another legal basis may be required for a particular
                workflow.
              </p>
              <p>
                Where a researcher, clinician, university, clinic or other
                organisation uses PsyLattice, the data-protection roles of PsyLattice
                and that organisation may differ by workflow. A data-processing
                agreement or other privacy terms may therefore apply in addition to
                these Terms.
              </p>
              <p>
                Please review the{" "}
                <Link href="/privacy" className="font-medium underline underline-offset-2">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/data-policy" className="font-medium underline underline-offset-2">
                  Data Policy
                </Link>
                .
              </p>
            </div>
          ),
        },
        {
          title: "40. Research data, ownership and permitted processing",
          content: (
            <div className="space-y-4">
              <p>
                As between PsyLattice and the user, users retain the rights they
                already hold in lawful research data, study content, documents and
                other material they submit, subject to third-party rights and
                applicable law.
              </p>
              <p>
                You grant PsyLattice the limited rights reasonably necessary to host,
                store, process, transmit, transform, back up, secure and otherwise
                handle submitted content to provide the Services, comply with lawful
                obligations and enforce these Terms.
              </p>
              <p>
                PsyLattice does not obtain ownership of a researcher’s thesis,
                participant dataset or original research merely because it is stored
                or processed through the Services.
              </p>
            </div>
          ),
        },
        {
          title: "41. Data retention, export and deletion",
          content: (
            <div className="space-y-4">
              <p>
                Retention periods may differ by account, study, plan, legal
                requirement, institutional agreement, backup schedule, dispute,
                security need and research-integrity obligation.
              </p>
              <p>
                Researchers should regularly export and securely retain data needed
                for their own records. PsyLattice should not be treated as the sole
                permanent archive for a research project unless a written agreement
                expressly provides archival obligations.
              </p>
              <p>
                Account deletion, study closure or termination may not immediately
                remove information from backups, security logs, audit records, legal
                holds or records that must be retained by law or for legitimate
                research-integrity purposes.
              </p>
            </div>
          ),
        },
        {
          title: "42. Security responsibilities",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice will use reasonable technical and organisational safeguards
                appropriate to the nature of the Services. No internet-connected
                system can guarantee absolute security.
              </p>
              <p>
                Users must not attempt to bypass authentication, role permissions,
                rate limits, study restrictions, security controls or technical
                safeguards. Unauthorised exploitation, credential theft, malware,
                destructive testing or interference with the Services is prohibited.
              </p>
              <p>
                Researchers and institutions must also apply reasonable security on
                their own devices, exported datasets, shared links, credentials and
                downstream systems.
              </p>
            </div>
          ),
        },
        {
          title: "43. Offline and desktop software",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may offer desktop or offline software. Offline operation
                may require periodic licensing checks, updates, supported operating
                systems or installation on an authorised number of devices.
              </p>
              <p>
                The customer is responsible for local device security, backups,
                operating-system compatibility and data stored only on the customer’s
                device. PsyLattice cannot restore local-only information that was
                never transmitted to or backed up by PsyLattice.
              </p>
              <p>
                A desktop licence does not grant a right to bypass licensing controls,
                reverse engineer protected components, redistribute installers or
                share a device entitlement beyond the licensed scope, except where
                applicable law provides a non-waivable right.
              </p>
            </div>
          ),
        },
        {
          title: "44. Third-party services and integrations",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may depend on or integrate with hosting, database,
                authentication, payment, email, notification, AI, cloud, wearable,
                app-store, analytics, video-conferencing or other third-party
                services.
              </p>
              <p>
                Third-party services may have their own terms, privacy policies,
                outages, limits, regional restrictions and changes. PsyLattice is not
                responsible for acts, omissions or outages of independent third
                parties outside PsyLattice’s reasonable control.
              </p>
              <p>
                Where PsyLattice selects and contracts with a provider to perform part
                of the Services, this section does not remove any responsibility that
                applicable law requires PsyLattice to retain for that provider’s
                processing or performance.
              </p>
            </div>
          ),
        },
        {
          title: "45. Acceptable use",
          content: (
            <div className="space-y-4">
              <p>You must not use PsyLattice to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>violate applicable law or another person’s rights;</li>
                <li>harass, exploit, threaten, deceive or unlawfully discriminate;</li>
                <li>impersonate a researcher, clinician, institution or professional;</li>
                <li>conduct research without required approval or consent;</li>
                <li>collect unnecessary or unlawfully obtained personal data;</li>
                <li>upload material for which you lack required rights or licences;</li>
                <li>make unlawful solely automated high-stakes decisions;</li>
                <li>send spam, malware, credential attacks or abusive traffic;</li>
                <li>scrape or systematically extract platform content without permission;</li>
                <li>evade plan, participant, AI, storage or study limits;</li>
                <li>resell access unless an agreement expressly allows it;</li>
                <li>reverse engineer or interfere with protected systems except where law permits;</li>
                <li>use the Services in a way that creates unreasonable safety, security or infrastructure risk.</li>
              </ul>
            </div>
          ),
        },
        {
          title: "46. Account restriction, suspension, banning and termination",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may warn, restrict, suspend, ban or terminate an account or
                specific workspace where reasonably necessary because of a material or
                repeated breach, fraud, non-payment, security risk, unlawful activity,
                harassment, misuse of credentials, infringement, abuse of free or
                unlimited entitlements, threat to participants or other serious risk.
              </p>
              <p>
                A suspension may last for a stated period or until a specified issue
                is resolved. During a suspension or ban, access to workspaces may be
                blocked and the user may be directed to the Contact page.
              </p>
              <p>
                Where appropriate and legally permitted, PsyLattice may provide notice
                and an opportunity to correct the issue. Immediate restriction may be
                necessary for serious security, safety, fraud, legal or participant
                protection concerns.
              </p>
              <p>
                Suspension or termination does not automatically erase data, cancel
                accrued charges or remove obligations that arose before termination.
                Where appropriate, users may contact PsyLattice to request review of
                an account restriction.
              </p>
            </div>
          ),
        },
        {
          title: "47. Intellectual property in PsyLattice",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice software, source and object code, interfaces, original
                graphics, branding, logos, product design, documentation, training
                materials, proprietary workflows and other platform materials are
                owned by or licensed to PsyLattice, except for user content and
                identified third-party materials.
              </p>
              <p>
                These Terms grant only a limited, revocable, non-exclusive,
                non-transferable right to use the Services for their intended purpose
                during the applicable entitlement. No ownership of PsyLattice
                intellectual property is transferred to the user.
              </p>
            </div>
          ),
        },
        {
          title: "48. User content and feedback",
          content: (
            <div className="space-y-4">
              <p>
                You are responsible for ensuring that you have the rights and
                permissions needed for content you upload or create in PsyLattice.
              </p>
              <p>
                If you voluntarily provide product ideas, suggestions or feedback, you
                permit PsyLattice to use that feedback to improve, market or develop
                its products without an obligation to compensate you. This does not
                grant PsyLattice ownership of your confidential research data or
                personal information.
              </p>
            </div>
          ),
        },
        {
          title: "49. Service availability, maintenance and no general SLA",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice aims to provide reliable Services but does not guarantee
                uninterrupted or error-free availability unless a separate written
                service-level agreement expressly provides an uptime or support
                commitment.
              </p>
              <p>
                Maintenance, emergency fixes, security incidents, infrastructure
                failures, third-party outages, internet conditions, provider changes
                and other events may temporarily interrupt access.
              </p>
              <p>
                PsyLattice may perform maintenance or updates without advance notice
                where urgent security or technical circumstances reasonably require
                it.
              </p>
            </div>
          ),
        },
        {
          title: "50. Beta, preview and experimental features",
          content: (
            <div className="space-y-4">
              <p>
                Features marked beta, preview, experimental, early access or similar
                may be incomplete, unstable, changed or withdrawn. They may contain
                errors and should not be the sole basis for critical research,
                clinical, academic or operational decisions.
              </p>
              <p>
                Unless expressly stated otherwise, beta features are provided without
                a commitment that they will become permanent production features.
              </p>
            </div>
          ),
        },
        {
          title: "51. What PsyLattice accepts responsibility for",
          content: (
            <div className="space-y-4">
              <p>
                Subject to these Terms and applicable law, PsyLattice is responsible
                for operating the Services with the level of care and skill required
                by applicable law and for performing the contractual obligations it
                expressly undertakes.
              </p>
              <p>
                Where a paid feature materially fails because of an issue within
                PsyLattice’s reasonable control, PsyLattice may, as appropriate,
                investigate, correct the defect, restore supported access, re-perform
                the affected service, provide a service credit or refund amounts where
                required by the contract or applicable law.
              </p>
              <p>
                PsyLattice remains responsible for liabilities that applicable law
                does not permit it to exclude or limit. Nothing in these Terms is
                intended to exclude liability for fraud or fraudulent
                misrepresentation, wilful misconduct, or death or personal injury
                caused by negligence where such exclusion is prohibited, or to remove
                mandatory consumer, privacy or data-protection rights.
              </p>
            </div>
          ),
        },
        {
          title: "52. Matters for which PsyLattice is not responsible",
          content: (
            <div className="space-y-4">
              <p>
                To the fullest extent permitted by law, PsyLattice is not responsible
                for loss, harm or failure caused by matters outside PsyLattice’s
                contractual responsibility or reasonable control, including:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>a researcher’s study design, ethics approval or lack of approval;</li>
                <li>invalid, incomplete or misleading participant consent;</li>
                <li>unlawful recruitment, incentives or treatment of participants;</li>
                <li>research misconduct, fabrication, falsification or plagiarism;</li>
                <li>use of unlicensed questionnaires, media, manuals or third-party content;</li>
                <li>incorrect user-supplied data, coding, labels, formulas or configuration;</li>
                <li>scientifically inappropriate statistical model selection or interpretation;</li>
                <li>AI hallucinations, fabricated citations or unverified AI-generated claims;</li>
                <li>academic penalties, thesis rejection, failed assessment or journal rejection;</li>
                <li>loss of funding, employment, admission, publication or research opportunity;</li>
                <li>participant withdrawal, non-compliance, no-shows or incomplete responses;</li>
                <li>device, browser, operating-system, network or notification limitations;</li>
                <li>third-party AI, payment, cloud, wearable, email or messaging outages;</li>
                <li>consumer wearable or sensor inaccuracies;</li>
                <li>loss of local-only data that the user failed to back up;</li>
                <li>unauthorised access caused by user credential sharing or insecure user devices;</li>
                <li>decisions or conduct of universities, supervisors, clinicians, sponsors or institutions;</li>
                <li>travel, accommodation or opportunity costs connected with a Workshop;</li>
                <li>failure to achieve a Workshop learning, academic or professional outcome;</li>
                <li>events of force majeure or other circumstances outside reasonable control.</li>
              </ul>
              <p>
                This section does not exclude responsibility to the extent a loss was
                directly caused by PsyLattice’s own breach and applicable law does not
                permit that responsibility to be excluded.
              </p>
            </div>
          ),
        },
        {
          title: "53. Disclaimer of warranties",
          content: (
            <div className="space-y-4">
              <p>
                To the fullest extent permitted by applicable law and except for
                express commitments in these Terms or a written agreement, the
                Services are provided on an “as available” basis.
              </p>
              <p>
                PsyLattice does not warrant that every feature will be uninterrupted,
                error-free, compatible with every device, suitable for every study,
                accepted by every ethics committee, scientifically valid for every
                population, sufficient for regulatory compliance or capable of
                producing a particular research, academic, clinical or commercial
                outcome.
              </p>
              <p>
                Nothing in this section excludes a warranty, conformity obligation or
                statutory guarantee that cannot lawfully be excluded.
              </p>
            </div>
          ),
        },
        {
          title: "54. Exclusion of indirect and consequential losses",
          content: (
            <div className="space-y-4">
              <p>
                To the fullest extent permitted by law, PsyLattice will not be liable
                for indirect, incidental, special, exemplary, punitive or
                consequential losses, or for loss of profit, revenue, business,
                goodwill, reputation, opportunity, expected savings, funding,
                publication opportunity, academic progression or data, except where
                such exclusion is prohibited by applicable law.
              </p>
              <p>
                For data loss, users are expected to maintain reasonable independent
                exports or backups appropriate to the importance of the data. This
                does not excuse PsyLattice from obligations it expressly undertakes or
                from liability that cannot lawfully be limited.
              </p>
            </div>
          ),
        },
        {
          title: "55. Liability cap",
          content: (
            <div className="space-y-4">
              <p>
                To the fullest extent permitted by applicable law, PsyLattice’s total
                aggregate liability arising out of or relating to the affected paid
                Service will not exceed the amount actually paid by the claimant to
                PsyLattice for that affected Service during the twelve months
                immediately preceding the event giving rise to the claim.
              </p>
              <p>
                For a one-time Workshop, Study Pass or other one-time purchase, the
                relevant amount is the amount paid for that purchase. For a free
                Service, any liability cap should be interpreted only to the extent
                permitted by applicable law and does not remove mandatory statutory
                remedies.
              </p>
              <p>
                This cap does not apply to liability that cannot lawfully be capped,
                including mandatory consumer rights and any category of liability for
                which applicable law prohibits limitation.
              </p>
            </div>
          ),
        },
        {
          title: "56. Professional and organisational indemnity",
          content: (
            <div className="space-y-4">
              <p>
                To the extent permitted by law, a professional, researcher,
                commercial customer or organisation agrees to defend, indemnify and
                hold PsyLattice harmless from third-party claims, losses and reasonable
                costs arising from that customer’s unlawful study, unlicensed content,
                violation of participant rights, breach of confidentiality, misuse of
                personal data, infringement of intellectual property, material breach
                of these Terms or unlawful conduct.
              </p>
              <p>
                This obligation does not apply to the extent the claim was caused by
                PsyLattice’s own breach, negligence or unlawful conduct. PsyLattice
                will provide reasonable notice of a covered claim and will not settle
                a claim in a manner imposing a non-monetary admission on the
                indemnifying party without reasonable consultation.
              </p>
              <p>
                This section is intended primarily for professional and organisational
                users and does not override mandatory consumer protections.
              </p>
            </div>
          ),
        },
        {
          title: "57. Force majeure",
          content: (
            <div className="space-y-4">
              <p>
                Neither party is responsible for delay or failure caused by events
                beyond its reasonable control, such as widespread internet or cloud
                outages, natural disasters, war, civil disorder, government action,
                labour disruption, power failure, epidemic, platform-wide cyberattack
                or failure of a critical external provider, except for obligations
                that applicable law does not allow to be suspended.
              </p>
              <p>
                The affected party should use reasonable efforts to reduce the impact
                and resume performance when reasonably possible.
              </p>
            </div>
          ),
        },
        {
          title: "58. Complaints, support and transaction disputes",
          content: (
            <div className="space-y-4">
              <p>
                Users may contact PsyLattice regarding account access, billing,
                transaction identifiers, payments, privacy, research features,
                Workshop issues, suspension, institutional access or technical
                problems through the{" "}
                <Link href="/contact" className="font-medium underline underline-offset-2">
                  Contact page
                </Link>
                .
              </p>
              <p>
                A billing complaint should include the account email, transaction or
                order identifier where available, approximate date and nature of the
                issue. Do not send full payment-card details through ordinary support
                messages.
              </p>
              <p>
                Where applicable law requires a designated grievance officer,
                consumer contact, data-protection contact or representative, the
                relevant details will be published in the legal or privacy notices.
              </p>
            </div>
          ),
        },
        {
          title: "59. Notices",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may provide operational or legal notices through the
                Services, account dashboard, email address associated with the account
                or another reasonable method.
              </p>
              <p>
                Users are responsible for maintaining a working contact email for
                important account and billing notices.
              </p>
            </div>
          ),
        },
        {
          title: "60. Changes to these Terms",
          content: (
            <div className="space-y-4">
              <p>
                PsyLattice may update these Terms to reflect changes in the Services,
                law, security requirements, business structure, pricing model or
                operating practices. The updated version will display a revised
                effective or last-updated date.
              </p>
              <p>
                Where required by law or reasonably appropriate for a material change,
                PsyLattice will provide advance notice. Changes will not be applied
                retroactively in a manner prohibited by law.
              </p>
              <p>
                If fresh consent or express acceptance is legally required, PsyLattice
                will request it. Otherwise, continued use after the effective date may
                constitute acceptance where legally valid.
              </p>
            </div>
          ),
        },
        {
          title: "61. Governing law and disputes",
          content: (
            <div className="space-y-4">
              <p>
                Unless a separate written agreement provides otherwise, these Terms
                and non-consumer disputes relating to PsyLattice are intended to be
                governed by the laws of India, without regard to conflict-of-law
                principles.
              </p>
              <p>
                Subject to mandatory jurisdiction rules, non-consumer disputes will be
                subject to the competent courts at Guwahati, Assam, India, unless the
                parties agree in writing to another dispute-resolution procedure.
              </p>
              <p>
                If you are a consumer, nothing in this section deprives you of
                mandatory consumer protections, rights or jurisdiction available under
                the law that applies to you and that cannot lawfully be waived by
                contract.
              </p>
            </div>
          ),
        },
        {
          title: "62. Entire agreement, assignment, waiver and severability",
          content: (
            <div className="space-y-4">
              <p>
                These Terms together with the documents expressly incorporated into
                them form the agreement governing the relevant use of PsyLattice,
                except where a signed agreement has priority under Section 3.
              </p>
              <p>
                A user may not assign or transfer contractual rights to another party
                without permission where consent is reasonably required. PsyLattice
                may transfer these Terms as part of an incorporation, reorganisation,
                financing, merger, acquisition, asset transfer or similar transaction,
                subject to applicable law and continued protection of mandatory user
                rights.
              </p>
              <p>
                Failure to enforce a provision on one occasion does not waive the
                right to enforce it later. If a provision is held unenforceable, the
                remainder of the Terms continues to apply to the fullest extent
                permitted by law.
              </p>
            </div>
          ),
        },
        {
          title: "63. Contact",
          content: (
            <div className="space-y-4">
              <p>
                Questions about these Terms, billing, Workshop conditions, account
                restrictions or general platform issues may be submitted through the{" "}
                <Link href="/contact" className="font-medium underline underline-offset-2">
                  PsyLattice Contact page
                </Link>
                .
              </p>
              <p>
                The final production legal notice and Contact page should identify the
                operator’s legal name, principal or registered address, support
                contact, privacy contact, applicable registration information and any
                grievance or representative details required by law.
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
