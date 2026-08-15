import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appOrigin(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.PSYLATTICE_APP_URL ||
    request.nextUrl.origin
  ).replace(/\/+$/, "");
}

function notificationHtml({
  senderName,
  targetUrl,
}: {
  senderName: string;
  targetUrl: string;
}) {
  const safeName = escapeHtml(senderName);
  const safeUrl = escapeHtml(targetUrl);

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
          You have a new secure message
        </h1>

        <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">
          ${safeName} sent you a new message in PsyLattice.
          For privacy, the message content is not included in this email.
        </p>

        <a
          href="${safeUrl}"
          style="display:inline-block;background:#020617;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 18px;border-radius:12px;"
        >
          Open secure messages
        </a>

        <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:26px 0 0;">
          PsyLattice secure messaging is intended for non-urgent communication.
          You can turn message email notifications off from the Messages screen.
        </p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

export async function POST(request: NextRequest) {
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
          "Message email environment variables are incomplete.",
      },
      { status: 500 }
    );
  }

  const authorization =
    request.headers.get("authorization") || "";

  const accessToken = authorization.replace(
    /^Bearer\s+/i,
    ""
  );

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const service = createClient(
    supabaseUrl,
    serviceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const {
    data: authenticatedUser,
    error: authError,
  } = await service.auth.getUser(accessToken);

  if (
    authError ||
    !authenticatedUser.user
  ) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let payload: {
    messageId?: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const messageId =
    payload.messageId?.trim();

  if (!messageId) {
    return NextResponse.json(
      {
        ok: false,
        error: "Message ID is required.",
      },
      { status: 400 }
    );
  }

  const {
    data: message,
    error: messageError,
  } = await service
    .from("clinical_messages")
    .select(
      "id, connection_id, sender_id, created_at"
    )
    .eq("id", messageId)
    .maybeSingle();

  if (
    messageError ||
    !message
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          messageError?.message ||
          "Message not found.",
      },
      { status: 404 }
    );
  }

  if (
    message.sender_id !==
    authenticatedUser.user.id
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Only the sender can trigger this notification.",
      },
      { status: 403 }
    );
  }

  const {
    data: connection,
    error: connectionError,
  } = await service
    .from(
      "clinician_client_connections"
    )
    .select(
      "id, clinician_id, client_id, status"
    )
    .eq("id", message.connection_id)
    .maybeSingle();

  if (
    connectionError ||
    !connection
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          connectionError?.message ||
          "Connection not found.",
      },
      { status: 404 }
    );
  }

  const senderIsClinician =
    connection.clinician_id ===
    message.sender_id;

  const recipientId =
    senderIsClinician
      ? connection.client_id
      : connection.clinician_id;

  const recipientRole =
    senderIsClinician
      ? "client"
      : "clinician";

  const {
    data: preference,
    error: preferenceError,
  } = await service
    .from(
      "clinical_message_notification_preferences"
    )
    .select(
      "email_notifications_enabled"
    )
    .eq("user_id", recipientId)
    .maybeSingle();

  if (preferenceError) {
    console.error(
      "Could not load message notification preference:",
      preferenceError
    );
  }

  if (
    preference?.email_notifications_enabled ===
    false
  ) {
    return NextResponse.json({
      ok: true,
      sent: false,
      skipped: "recipient_disabled_email_notifications",
    });
  }

  const {
    data: recipientUserData,
    error: recipientUserError,
  } =
    await service.auth.admin.getUserById(
      recipientId
    );

  if (
    recipientUserError ||
    !recipientUserData.user?.email
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          recipientUserError?.message ||
          "Recipient email is unavailable.",
      },
      { status: 500 }
    );
  }

  const {
    data: senderProfile,
  } = await service
    .from("profiles")
    .select("full_name")
    .eq(
      "id",
      authenticatedUser.user.id
    )
    .maybeSingle();

  const senderName =
    senderProfile?.full_name?.trim() ||
    authenticatedUser.user.user_metadata
      ?.full_name?.trim?.() ||
    authenticatedUser.user.email?.split(
      "@"
    )[0] ||
    (senderIsClinician
      ? "Your clinician"
      : "Your client");

  const targetUrl =
    recipientRole === "clinician"
      ? `${appOrigin(
          request
        )}/clinical?screen=messages`
      : `${appOrigin(
          request
        )}/self?screen=messages`;

  const resend = new Resend(
    resendApiKey
  );

  const {
    data: emailData,
    error: emailError,
  } = await resend.emails.send(
    {
      from: emailFrom,
      to: [
        recipientUserData.user.email,
      ],
      subject: `New secure message from ${senderName}`,
      html: notificationHtml({
        senderName,
        targetUrl,
      }),
      text:
        `You have a new secure message from ${senderName} in PsyLattice.\n\n` +
        `For privacy, the message content is not included in this email.\n\n` +
        `Open secure messages: ${targetUrl}`,
    },
    {
      idempotencyKey:
        `psylattice-clinical-message/${message.id}`,
    }
  );

  if (emailError) {
    return NextResponse.json(
      {
        ok: false,
        error: emailError.message,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    sent: true,
    email_id: emailData?.id || null,
  });
}
