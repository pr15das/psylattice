import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  commitMediaPath,
  releaseMediaReservation,
  reserveMediaUpload,
  ResourceEntitlementError,
} from "@/lib/billing/resources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUESTIONNAIRE_BUCKET = "questionnaire-media";
const PARTICIPANT_BUCKET = "study-uploads";
const MAX_STIMULUS_BYTES = 100 * 1024 * 1024;

const PARTICIPANT_RESPONSE_TYPES = new Set([
  "file_upload",
  "image_upload",
  "audio_response",
  "video_response",
]);

function adminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured."
    );
  }

  return createClient(supabaseUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}


function resourceUploadError(error: unknown) {
  if (!(error instanceof ResourceEntitlementError)) return null;

  if (error.code === "MEDIA_UPLOAD_LOCKED") {
    return jsonError(
      "Custom media and participant file uploads require Pro Monthly or Pro Annual.",
      403,
    );
  }
  if (error.code === "MEDIA_LIMIT_EXHAUSTED") {
    return jsonError(
      "Your PsyLattice media storage allowance is full. Add storage or change plan before uploading more media.",
      402,
    );
  }
  if (error.code === "MEDIA_STUDY_FORBIDDEN") {
    return jsonError("This study is not available to this researcher account.", 403);
  }
  if (error.code === "MEDIA_INVALID_SIZE" || error.code === "MEDIA_INVALID_PATH") {
    return jsonError(error.message, 400);
  }

  return jsonError("PsyLattice could not verify the media allowance right now.", 503);
}

function bearerToken(request: NextRequest) {
  return (
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    ""
  );
}

function safeName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);

  return cleaned || "upload.bin";
}

function parseStorageRef(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(/^storage:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], path: match[2] };
}

function storageRef(bucket: string, path: string) {
  return `storage://${bucket}/${path}`;
}

function normaliseMime(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isAllowedResearcherMedia(mime: string, mediaKind: string) {
  if (mediaKind === "option_image") return mime.startsWith("image/");
  return (
    mime.startsWith("image/") ||
    mime.startsWith("audio/") ||
    mime.startsWith("video/")
  );
}

function participantMaxBytes(responseType: string) {
  if (responseType === "image_upload") return 20 * 1024 * 1024;
  if (responseType === "audio_response") return 50 * 1024 * 1024;
  if (responseType === "video_response") return 100 * 1024 * 1024;
  return 50 * 1024 * 1024;
}

function isAllowedParticipantMime(responseType: string, mime: string) {
  if (!mime) return false;
  if (responseType === "image_upload") return mime.startsWith("image/");
  if (responseType === "audio_response") return mime.startsWith("audio/");
  if (responseType === "video_response") return mime.startsWith("video/");

  if (responseType === "file_upload") {
    if (
      mime.startsWith("image/") ||
      mime.startsWith("audio/") ||
      mime.startsWith("video/") ||
      mime.startsWith("text/")
    ) {
      return true;
    }

    return new Set([
      "application/pdf",
      "application/json",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/rtf",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
    ]).has(mime);
  }

  return false;
}

async function authenticatedResearcher(request: NextRequest) {
  const token = bearerToken(request);
  if (!token) return null;

  const supabase = adminClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

async function activeParticipantSession(sessionToken: string) {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("participant_sessions")
    .select("id, participant_id, study_id, owner_user_id, status, phase")
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (error || !data || data.status !== "in_progress") return null;
  return data;
}

function referencedMediaValues(item: {
  media_config?: unknown;
  response_options?: unknown;
}) {
  const values: string[] = [];
  const media = item.media_config as Record<string, unknown> | null;
  if (media && typeof media.url === "string") values.push(media.url);

  if (Array.isArray(item.response_options)) {
    for (const option of item.response_options) {
      if (
        option &&
        typeof option === "object" &&
        typeof (option as Record<string, unknown>).media_url === "string"
      ) {
        values.push((option as Record<string, unknown>).media_url as string);
      }
    }
  }

  return values;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const supabase = adminClient();

    if (action === "researcher_upload") {
      const user = await authenticatedResearcher(request);
      if (!user) return jsonError("Researcher authentication is required.", 401);

      const fileName = safeName(String(body.fileName || "upload.bin"));
      const mime = normaliseMime(body.contentType);
      const fileSize = Number(body.fileSize || 0);
      const mediaKind = String(body.mediaKind || "question_media");

      if (!Number.isFinite(fileSize) || fileSize <= 0) {
        return jsonError("The selected file is empty or invalid.");
      }
      if (fileSize > MAX_STIMULUS_BYTES) {
        return jsonError("Research media must be 100 MB or smaller.");
      }
      if (!isAllowedResearcherMedia(mime, mediaKind)) {
        return jsonError(
          mediaKind === "option_image"
            ? "Image-choice options accept image files only."
            : "Question media must be an image, audio file, or video."
        );
      }

      const path = `researchers/${user.id}/${new Date()
        .toISOString()
        .slice(0, 10)}/${crypto.randomUUID()}-${fileName}`;

      let reservationId = "";
      try {
        const reservation = await reserveMediaUpload({
          userId: user.id,
          studyId: null,
          bucket: QUESTIONNAIRE_BUCKET,
          objectPath: path,
          bytes: fileSize,
          mediaKind,
        });
        reservationId = reservation.reservationId;
      } catch (error) {
        return resourceUploadError(error) || jsonError("PsyLattice could not verify the media allowance right now.", 503);
      }

      const { data, error } = await supabase.storage
        .from(QUESTIONNAIRE_BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data?.token) {
        await releaseMediaReservation(user.id, reservationId).catch(() => undefined);
        console.error("Could not create researcher media upload ticket:", error);
        return jsonError("Could not create the media upload ticket.", 500);
      }

      return NextResponse.json({
        ok: true,
        bucket: QUESTIONNAIRE_BUCKET,
        path,
        token: data.token,
        storage_ref: storageRef(QUESTIONNAIRE_BUCKET, path),
        reservation_id: reservationId,
      });
    }

    if (action === "researcher_read") {
      const user = await authenticatedResearcher(request);
      if (!user) return jsonError("Researcher authentication is required.", 401);

      const ref = parseStorageRef(body.storageRef);
      if (
        !ref ||
        ref.bucket !== QUESTIONNAIRE_BUCKET ||
        !ref.path.startsWith(`researchers/${user.id}/`)
      ) {
        return jsonError("This questionnaire media reference is not accessible.", 403);
      }

      await commitMediaPath(user.id, ref.bucket, ref.path).catch(() => undefined);

      const { data, error } = await supabase.storage
        .from(ref.bucket)
        .createSignedUrl(ref.path, 60 * 60);

      if (error || !data?.signedUrl) {
        console.error("Could not create researcher media preview URL:", error);
        return jsonError("Could not create the media preview URL.", 500);
      }

      return NextResponse.json({ ok: true, signedUrl: data.signedUrl });
    }

    if (action === "participant_upload") {
      const sessionToken = String(body.sessionToken || "");
      const studyMeasureId = String(body.studyMeasureId || "");
      const itemId = String(body.itemId || "");
      const fileName = safeName(String(body.fileName || "upload.bin"));
      const mime = normaliseMime(body.contentType);
      const fileSize = Number(body.fileSize || 0);

      const session = await activeParticipantSession(sessionToken);
      if (!session) return jsonError("This participant session is not active.", 401);

      const { data: measure, error: measureError } = await supabase
        .from("study_measures")
        .select("id, questionnaire_version_id")
        .eq("id", studyMeasureId)
        .eq("study_id", session.study_id)
        .maybeSingle();

      if (measureError || !measure) {
        return jsonError("This questionnaire is not part of the active study.", 403);
      }

      const { data: item, error: itemError } = await supabase
        .from("questionnaire_items")
        .select("id, version_id, response_type")
        .eq("id", itemId)
        .eq("version_id", measure.questionnaire_version_id)
        .maybeSingle();

      if (itemError || !item || !PARTICIPANT_RESPONSE_TYPES.has(item.response_type)) {
        return jsonError("This question does not accept participant file uploads.", 403);
      }

      if (!Number.isFinite(fileSize) || fileSize <= 0) {
        return jsonError("The selected file is empty or invalid.");
      }
      if (fileSize > participantMaxBytes(item.response_type)) {
        return jsonError("The selected file is larger than the limit for this response type.");
      }
      if (!isAllowedParticipantMime(item.response_type, mime)) {
        return jsonError("That file type is not allowed for this response.");
      }

      const path = `${session.study_id}/${session.participant_id}/${session.id}/${studyMeasureId}/${itemId}/${crypto.randomUUID()}-${fileName}`;

      let reservationId = "";
      try {
        const reservation = await reserveMediaUpload({
          userId: session.owner_user_id,
          studyId: session.study_id,
          bucket: PARTICIPANT_BUCKET,
          objectPath: path,
          bytes: fileSize,
          mediaKind: `participant_${item.response_type}`,
        });
        reservationId = reservation.reservationId;
      } catch (error) {
        return resourceUploadError(error) || jsonError("PsyLattice could not verify the media allowance right now.", 503);
      }

      const { data, error } = await supabase.storage
        .from(PARTICIPANT_BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data?.token) {
        await releaseMediaReservation(session.owner_user_id, reservationId).catch(() => undefined);
        console.error("Could not create participant media upload ticket:", error);
        return jsonError("Could not create the participant upload ticket.", 500);
      }

      return NextResponse.json({
        ok: true,
        bucket: PARTICIPANT_BUCKET,
        path,
        token: data.token,
        storage_ref: storageRef(PARTICIPANT_BUCKET, path),
        reservation_id: reservationId,
      });
    }

    if (action === "participant_read") {
      const sessionToken = String(body.sessionToken || "");
      const itemId = String(body.itemId || "");
      const ref = parseStorageRef(body.storageRef);

      if (!ref || ref.bucket !== QUESTIONNAIRE_BUCKET) {
        return jsonError("Invalid questionnaire media reference.");
      }

      const session = await activeParticipantSession(sessionToken);
      if (!session) return jsonError("This participant session is not active.", 401);

      const { data: item, error: itemError } = await supabase
        .from("questionnaire_items")
        .select("id, version_id, media_config, response_options")
        .eq("id", itemId)
        .maybeSingle();

      if (itemError || !item) {
        return jsonError("Questionnaire media could not be verified.", 404);
      }

      const { data: attachedMeasure, error: measureError } = await supabase
        .from("study_measures")
        .select("id")
        .eq("study_id", session.study_id)
        .eq("questionnaire_version_id", item.version_id)
        .limit(1)
        .maybeSingle();

      if (measureError || !attachedMeasure) {
        return jsonError("This media is not part of the active study.", 403);
      }

      const requestedRef = storageRef(ref.bucket, ref.path);
      if (!referencedMediaValues(item).includes(requestedRef)) {
        return jsonError("This media is not referenced by the requested question.", 403);
      }

      const { data, error } = await supabase.storage
        .from(ref.bucket)
        .createSignedUrl(ref.path, 60 * 60);

      if (error || !data?.signedUrl) {
        console.error("Could not create questionnaire media URL:", error);
        return jsonError("Could not create the questionnaire media URL.", 500);
      }

      return NextResponse.json({ ok: true, signedUrl: data.signedUrl });
    }

    return jsonError("Unknown media ticket action.");
  } catch (error) {
    console.error("PsyLattice media ticket error:", error);
    const entitlementResponse = resourceUploadError(error);
    if (entitlementResponse) return entitlementResponse;
    return jsonError("Unexpected media service error.", 500);
  }
}
