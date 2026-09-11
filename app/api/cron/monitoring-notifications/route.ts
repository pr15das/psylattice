import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  completeParticipantEmail,
  refundParticipantEmail,
  reserveParticipantEmail,
  ResourceEntitlementError,
} from "@/lib/billing/resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QueueRow = {
  id: string;
  target_kind: "self_user" | "research_participant";
  user_id: string | null;
  participant_id: string | null;
  reference_type: string;
  reference_id: string | null;
  scheduled_for: string;
  expires_at: string | null;
  title: string;
  body: string;
  url: string;
  status: string;
  attempts: number;
  delivery_channel?: string | null;
};

function authorised(request: NextRequest) {
  const configured = process.env.CRON_SECRET;

  if (!configured) {
    return false;
  }

  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  return bearer === configured;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function absoluteUrl(request: NextRequest, path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PSYLATTICE_APP_URL;

  const origin =
    configured?.replace(/\/+$/, "") ||
    request.nextUrl.origin;

  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

function emailHtml({
  title,
  body,
  url,
}: {
  title: string;
  body: string;
  url: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);
  const safeUrl = escapeHtml(url);

  return `
<!doctype html>
<html>
  <body style="margin:0;background:#f6f8f8;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:22px;padding:30px;">
        <div style="font-size:14px;font-weight:700;color:#0e7490;margin-bottom:18px;">
          PsyLattice
        </div>

        <h1 style="font-size:24px;line-height:1.3;margin:0 0 14px;">
          ${safeTitle}
        </h1>

        <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">
          ${safeBody}
        </p>

        <a
          href="${safeUrl}"
          style="display:inline-block;background:#020617;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 18px;border-radius:12px;"
        >
          Open PsyLattice
        </a>

        <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:26px 0 0;">
          This reminder was sent because email reminders are enabled for this PsyLattice monitoring or study protocol.
        </p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey =
    process.env.RESEND_API_KEY;
  const emailFrom =
    process.env.PSYLATTICE_EMAIL_FROM;

  if (
    !supabaseUrl ||
    !serviceRole ||
    !resendApiKey ||
    !emailFrom
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Email reminder environment variables are incomplete.",
      },
      { status: 500 }
    );
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const resend = new Resend(resendApiKey);

  // Create any research follow-up invitations/reminders that have
  // become due since the last cron run. If the follow-up migration
  // has not been installed yet, email delivery for the existing
  // Self / ambulatory queue still continues.
  const { error: followupSyncError } = await supabase.rpc(
    "psylattice_sync_due_followup_invitations"
  );

  if (followupSyncError) {
    const missingFunction =
      followupSyncError.message
        ?.toLowerCase()
        .includes("psylattice_sync_due_followup_invitations") ||
      followupSyncError.code === "PGRST202";

    if (!missingFunction) {
      console.error(
        "Could not sync due follow-up invitations:",
        followupSyncError
      );
    }
  }

  const nowIso = new Date().toISOString();

  const { data: queueData, error: queueError } =
    await supabase
      .from("psylattice_notification_queue")
      .select(
        "id, target_kind, user_id, participant_id, reference_type, reference_id, scheduled_for, expires_at, title, body, url, status, attempts, delivery_channel"
      )
      .eq("status", "pending")
      .eq("delivery_channel", "email")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", {
        ascending: true,
      })
      .limit(100);

  if (queueError) {
    return NextResponse.json(
      {
        ok: false,
        error: queueError.message,
      },
      { status: 500 }
    );
  }

  const queue = (queueData || []) as QueueRow[];

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const notification of queue) {
    if (
      notification.expires_at &&
      new Date(notification.expires_at).getTime() <
        Date.now()
    ) {
      await supabase
        .from("psylattice_notification_queue")
        .update({
          status: "cancelled",
          last_error:
            "Reminder expired before email delivery.",
        })
        .eq("id", notification.id);

      skipped += 1;
      continue;
    }

    let recipientEmail = "";
    let participantBilling: { userId: string; studyId: string } | null = null;
    let emailUsageId = "";

    if (
      notification.target_kind === "self_user" &&
      notification.user_id
    ) {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.admin.getUserById(
        notification.user_id
      );

      if (userError) {
        await supabase
          .from("psylattice_notification_queue")
          .update({
            status: "failed",
            attempts:
              (notification.attempts || 0) + 1,
            last_error:
              userError.message,
          })
          .eq("id", notification.id);

        failed += 1;
        continue;
      }

      recipientEmail =
        userData.user?.email || "";

      const { data: preference } =
        await supabase
          .from("psylattice_email_preferences")
          .select("monitoring_reminders_enabled")
          .eq("user_id", notification.user_id)
          .maybeSingle();

      if (
        !preference?.monitoring_reminders_enabled
      ) {
        await supabase
          .from("psylattice_notification_queue")
          .update({
            status: "cancelled",
            last_error:
              "Email reminders are disabled by the Self user.",
          })
          .eq("id", notification.id);

        skipped += 1;
        continue;
      }
    } else if (
      notification.target_kind ===
        "research_participant" &&
      notification.participant_id
    ) {
      const isFollowupEmail =
        notification.reference_type ===
          "followup_invitation" ||
        notification.reference_type ===
          "followup_reminder";

      if (isFollowupEmail) {
        const {
          data: contact,
          error: contactError,
        } = await supabase
          .from("study_followup_contacts")
          .select("email, consented, withdrawn_at")
          .eq(
            "participant_id",
            notification.participant_id
          )
          .maybeSingle();

        if (contactError) {
          await supabase
            .from("psylattice_notification_queue")
            .update({
              status: "failed",
              attempts:
                (notification.attempts || 0) + 1,
              last_error:
                contactError.message,
            })
            .eq("id", notification.id);

          failed += 1;
          continue;
        }

        if (
          !contact ||
          !contact.consented ||
          contact.withdrawn_at ||
          !contact.email
        ) {
          await supabase
            .from("psylattice_notification_queue")
            .update({
              status: "cancelled",
              last_error:
                "The participant has not consented to follow-up email contact.",
            })
            .eq("id", notification.id);

          skipped += 1;
          continue;
        }

        recipientEmail = contact.email;
      } else {
        const {
          data: contact,
          error: contactError,
        } = await supabase
          .from(
            "study_participant_notification_contacts"
          )
          .select(
            "email, email_reminders_enabled"
          )
          .eq(
            "participant_id",
            notification.participant_id
          )
          .maybeSingle();

        if (contactError) {
          await supabase
            .from("psylattice_notification_queue")
            .update({
              status: "failed",
              attempts:
                (notification.attempts || 0) + 1,
              last_error:
                contactError.message,
            })
            .eq("id", notification.id);

          failed += 1;
          continue;
        }

        if (
          !contact ||
          !contact.email_reminders_enabled
        ) {
          await supabase
            .from("psylattice_notification_queue")
            .update({
              status: "cancelled",
              last_error:
                "Participant email reminders are disabled or no contact email is available.",
            })
            .eq("id", notification.id);

          skipped += 1;
          continue;
        }

        recipientEmail = contact.email || "";
      }

      const { data: participant, error: participantError } = await supabase
        .from("study_participants")
        .select("study_id, owner_user_id")
        .eq("id", notification.participant_id)
        .maybeSingle();

      if (participantError || !participant?.study_id || !participant?.owner_user_id) {
        console.error("Could not resolve participant billing owner:", participantError);
        await supabase
          .from("psylattice_notification_queue")
          .update({
            status: "failed",
            attempts: (notification.attempts || 0) + 1,
            last_error: "The research participant billing owner could not be resolved.",
          })
          .eq("id", notification.id);

        failed += 1;
        continue;
      }

      participantBilling = {
        userId: String(participant.owner_user_id),
        studyId: String(participant.study_id),
      };
    }

    if (!recipientEmail) {
      await supabase
        .from("psylattice_notification_queue")
        .update({
          status: "failed",
          attempts:
            (notification.attempts || 0) + 1,
          last_error:
            "No recipient email address is available.",
        })
        .eq("id", notification.id);

      failed += 1;
      continue;
    }

    if (participantBilling) {
      try {
        const reservation = await reserveParticipantEmail({
          userId: participantBilling.userId,
          studyId: participantBilling.studyId,
          notificationId: notification.id,
          referenceType: notification.reference_type,
        });
        emailUsageId = reservation.usageId;
      } catch (error) {
        if (error instanceof ResourceEntitlementError && error.code === "EMAIL_LIMIT_EXHAUSTED") {
          const retryAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          await supabase
            .from("psylattice_notification_queue")
            .update({
              status: "pending",
              scheduled_for: retryAt,
              attempts: (notification.attempts || 0) + 1,
              last_error: "Participant email allowance exhausted. Delivery will retry after the allowance is expanded.",
            })
            .eq("id", notification.id);

          skipped += 1;
          continue;
        }

        console.error("Could not reserve participant email allowance:", error);
        await supabase
          .from("psylattice_notification_queue")
          .update({
            status: "failed",
            attempts: (notification.attempts || 0) + 1,
            last_error: "PsyLattice could not verify the participant email allowance.",
          })
          .eq("id", notification.id);

        failed += 1;
        continue;
      }
    }

    const targetUrl = absoluteUrl(
      request,
      notification.url
    );

    const {
      data: emailData,
      error: emailError,
    } = await resend.emails.send(
      {
        from: emailFrom,
        to: [recipientEmail],
        subject: notification.title,
        html: emailHtml({
          title: notification.title,
          body: notification.body,
          url: targetUrl,
        }),
        text: `${notification.title}\n\n${notification.body}\n\nOpen PsyLattice: ${targetUrl}`,
      },
      {
        idempotencyKey:
          `psylattice-reminder/${notification.id}`,
      }
    );

    if (emailError) {
      if (participantBilling && emailUsageId) {
        await refundParticipantEmail(participantBilling.userId, emailUsageId).catch((refundError) => {
          console.error("Could not refund failed participant email reservation:", refundError);
        });
      }

      await supabase
        .from("psylattice_notification_queue")
        .update({
          status: "failed",
          attempts:
            (notification.attempts || 0) + 1,
          last_error:
            emailError.message,
        })
        .eq("id", notification.id);

      failed += 1;
      continue;
    }

    if (participantBilling && emailUsageId) {
      await completeParticipantEmail(participantBilling.userId, emailUsageId).catch((completionError) => {
        // The provider already accepted the email. Keep the reservation counted
        // rather than risking an under-charge; a later support reconciliation can
        // safely complete the ledger row.
        console.error("Could not complete participant email usage record:", completionError);
      });
    }

    const sentAt = new Date().toISOString();

    await supabase
      .from("psylattice_notification_queue")
      .update({
        status: "sent",
        attempts:
          (notification.attempts || 0) + 1,
        sent_at: sentAt,
        last_error: null,
      })
      .eq("id", notification.id);

    if (
      notification.reference_type ===
        "research_prompt" &&
      notification.reference_id
    ) {
      await supabase
        .from(
          "study_ambulatory_prompt_instances"
        )
        .update({
          notification_sent_at: sentAt,
          updated_at: sentAt,
        })
        .eq(
          "id",
          notification.reference_id
        );
    }

    if (
      notification.reference_id &&
      notification.reference_type ===
        "followup_invitation"
    ) {
      await supabase
        .from("study_followup_invitations")
        .update({
          status: "sent",
          sent_at: sentAt,
          updated_at: sentAt,
        })
        .eq("id", notification.reference_id)
        .neq("status", "completed");
    }

    if (
      notification.reference_id &&
      notification.reference_type ===
        "followup_reminder"
    ) {
      const {
        data: invitation,
      } = await supabase
        .from("study_followup_invitations")
        .select("reminder_count")
        .eq("id", notification.reference_id)
        .maybeSingle();

      await supabase
        .from("study_followup_invitations")
        .update({
          reminder_count:
            Number(invitation?.reminder_count || 0) + 1,
          last_reminded_at: sentAt,
          updated_at: sentAt,
        })
        .eq("id", notification.reference_id);
    }

    sent += 1;
  }

  return NextResponse.json({
    ok: true,
    processed: queue.length,
    sent,
    failed,
    skipped,
  });
}
