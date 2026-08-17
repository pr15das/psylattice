import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

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

function publicRpcClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "A public Supabase key is not configured. Expected NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_KEY."
    );
  }

  // psylattice_public_study is granted to anon/authenticated, not service_role.
  // Use the same public role as the participant browser for this RPC.
  return createClient(supabaseUrl, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
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

async function authenticatedResearcherContext(request: NextRequest) {
  const token = bearerToken(request);
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "A public Supabase key is not configured for researcher authentication."
    );
  }

  // Use the researcher's own JWT for authorization-sensitive database reads.
  // Those reads therefore obey the same RLS policies as Data Explorer itself.
  const authClient = createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return null;
  return { user, client: authClient };
}

async function authenticatedResearcher(request: NextRequest) {
  const context = await authenticatedResearcherContext(request);
  return context?.user || null;
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
      if (!user) {
        return NextResponse.json(
          { ok: false, stage: "researcher_auth", error: "Researcher authentication is required. Please refresh the page and sign in again." },
          { status: 401 }
        );
      }

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

      const { data, error } = await supabase.storage
        .from(QUESTIONNAIRE_BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data?.token) {
        return NextResponse.json(
          {
            ok: false,
            stage: "signed_upload_ticket",
            error: error?.message || "Could not create the media upload ticket.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        stage: "signed_upload_ticket",
        bucket: QUESTIONNAIRE_BUCKET,
        path,
        token: data.token,
        storage_ref: storageRef(QUESTIONNAIRE_BUCKET, path),
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

      const { data, error } = await supabase.storage
        .from(ref.bucket)
        .createSignedUrl(ref.path, 60 * 60);

      if (error || !data?.signedUrl) {
        return jsonError(error?.message || "Could not create the media preview URL.", 500);
      }

      return NextResponse.json({ ok: true, signedUrl: data.signedUrl });
    }


    if (action === "researcher_participant_read") {
      const researcher = await authenticatedResearcherContext(request);
      if (!researcher) {
        return jsonError(
          "Researcher authentication is required. Please refresh the page and sign in again.",
          401
        );
      }

      const responseId = String(body.responseId || "").trim();
      const disposition = body.disposition === "download" ? "download" : "view";

      if (!responseId) {
        return jsonError("The participant upload response could not be identified.");
      }

      // Authorize with the exact same authenticated/RLS path that Data Explorer
      // uses. If this signed-in researcher cannot SELECT this response through
      // RLS, the API refuses to sign the private file.
      const { data: responseRow, error: responseError } = await researcher.client
        .from("research_responses")
        .select(
          "id, measure_session_id, participant_id, study_id, study_measure_id, item_id, response"
        )
        .eq("id", responseId)
        .maybeSingle();

      if (responseError || !responseRow) {
        return jsonError(
          "This participant upload is not available to the signed-in researcher.",
          403
        );
      }

      // Do not perform a second questionnaire-item lookup here. Data Explorer
      // has already identified this exact RLS-readable response as a participant
      // upload from its stored response metadata. The secure file-access decision
      // is therefore bound to the exact research_responses.id, the private
      // storage://study-uploads reference saved in that row, and the study/measure/
      // item identifiers encoded in the current participant-upload path. This
      // avoids false negatives when questionnaire metadata/version visibility
      // differs from the immutable stored research response.

      const metadata =
        responseRow.response &&
        typeof responseRow.response === "object" &&
        !Array.isArray(responseRow.response)
          ? (responseRow.response as Record<string, unknown>)
          : null;

      const ref = parseStorageRef(metadata?.storage_ref);
      const metadataBucket =
        typeof metadata?.bucket === "string" ? metadata.bucket : "";
      const metadataPath =
        typeof metadata?.path === "string" ? metadata.path : "";
      const fileName = safeName(
        typeof metadata?.name === "string" ? metadata.name : "participant-upload.bin"
      );
      const mimeType = normaliseMime(metadata?.mime_type);
      const rawSize = metadata?.size;
      const size =
        typeof rawSize === "number" && Number.isFinite(rawSize)
          ? rawSize
          : typeof rawSize === "string" && Number.isFinite(Number(rawSize))
            ? Number(rawSize)
            : null;

      if (!ref || ref.bucket !== PARTICIPANT_BUCKET) {
        return jsonError("The stored participant upload reference is invalid.", 403);
      }

      if (
        (metadataBucket && metadataBucket !== ref.bucket) ||
        (metadataPath && metadataPath !== ref.path)
      ) {
        return jsonError("The participant upload metadata is inconsistent.", 403);
      }

      // Current participant uploads intentionally do not expose participant IDs
      // or raw session tokens in Storage paths. Validate the V9 path contract:
      // study_id/sessions/<hashed-session>/study_measure_id/item_id/file
      const expectedStudyPrefix = `${responseRow.study_id}/sessions/`;
      const expectedMeasureItemSegment =
        `/${responseRow.study_measure_id}/${responseRow.item_id}/`;

      if (
        !ref.path.startsWith(expectedStudyPrefix) ||
        !ref.path.includes(expectedMeasureItemSegment)
      ) {
        return jsonError("The participant upload path does not match this response.", 403);
      }

      const { data, error } = await supabase.storage
        .from(PARTICIPANT_BUCKET)
        .createSignedUrl(
          ref.path,
          5 * 60,
          disposition === "download" ? { download: fileName } : undefined
        );

      if (error || !data?.signedUrl) {
        return jsonError(
          error?.message || "Could not create secure participant file access.",
          500
        );
      }

      return NextResponse.json(
        {
          ok: true,
          signedUrl: data.signedUrl,
          name: fileName,
          mimeType,
          size,
          expiresIn: 5 * 60,
          disposition,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    if (action === "participant_upload") {
      const studyToken = String(body.studyToken || "").trim();
      const sessionToken = String(body.sessionToken || "").trim();
      const studyMeasureId = String(body.studyMeasureId || "").trim();
      const itemId = String(body.itemId || "").trim();
      const fileName = safeName(String(body.fileName || "upload.bin"));
      const mime = normaliseMime(body.contentType);
      const fileSize = Number(body.fileSize || 0);

      if (!studyToken || !sessionToken) {
        return jsonError("The participant study session could not be verified.", 401);
      }

      // IMPORTANT: use the same token/session contract as the participant
      // runner instead of independently querying participant_sessions through
      // the privileged client. This keeps upload authorization aligned with
      // the exact RPCs the participant page already uses successfully.
      const publicSupabase = publicRpcClient();

      const [{ data: resumeData, error: resumeError }, { data: publicStudy, error: publicStudyError }] =
        await Promise.all([
          publicSupabase.rpc("psylattice_resume_participation", {
            p_token: studyToken,
            p_session_token: sessionToken,
          }),
          publicSupabase.rpc("psylattice_public_study", {
            p_token: studyToken,
          }),
        ]);

      if (
        resumeError ||
        !resumeData?.ok ||
        String(resumeData.session_status || "") !== "in_progress"
      ) {
        return jsonError(
          String(
            resumeData?.error ||
              resumeError?.message ||
              "This participant session is not active."
          ),
          401
        );
      }

      if (publicStudyError || !publicStudy?.ok) {
        return jsonError(
          String(
            publicStudy?.error ||
              publicStudyError?.message ||
              "This study could not be verified."
          ),
          403
        );
      }

      const studyId = String(publicStudy?.study?.id || "").trim();
      const measures = Array.isArray(publicStudy?.measures)
        ? publicStudy.measures
        : [];

      const measure = measures.find(
        (candidate: { study_measure_id?: unknown }) =>
          String(candidate?.study_measure_id || "") === studyMeasureId
      );

      if (!studyId || !measure) {
        return jsonError("This questionnaire is not part of the active study.", 403);
      }

      const items = Array.isArray(measure?.items) ? measure.items : [];
      const item = items.find(
        (candidate: { id?: unknown }) => String(candidate?.id || "") === itemId
      ) as { id?: unknown; response_type?: unknown } | undefined;

      const responseType = String(item?.response_type || "");
      if (!item || !PARTICIPANT_RESPONSE_TYPES.has(responseType)) {
        return jsonError("This question does not accept participant file uploads.", 403);
      }

      if (!Number.isFinite(fileSize) || fileSize <= 0) {
        return jsonError("The selected file is empty or invalid.");
      }
      if (fileSize > participantMaxBytes(responseType)) {
        return jsonError("The selected file is larger than the limit for this response type.");
      }
      if (!isAllowedParticipantMime(responseType, mime)) {
        return jsonError("That file type is not allowed for this response.");
      }

      // Never put the raw participant session token in a Storage path.
      const sessionFolder = createHash("sha256")
        .update(sessionToken)
        .digest("hex")
        .slice(0, 24);

      const path = `${studyId}/sessions/${sessionFolder}/${studyMeasureId}/${itemId}/${crypto.randomUUID()}-${fileName}`;

      // Privileged client is used only for private Storage signing.
      const { data, error } = await supabase.storage
        .from(PARTICIPANT_BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data?.token) {
        return jsonError(
          error?.message || "Could not create the participant upload ticket.",
          500
        );
      }

      return NextResponse.json({
        ok: true,
        bucket: PARTICIPANT_BUCKET,
        path,
        token: data.token,
        storage_ref: storageRef(PARTICIPANT_BUCKET, path),
      });
    }

    if (action === "participant_read") {
      const studyToken = String(body.studyToken || "").trim();
      const itemId = String(body.itemId || "").trim();
      const ref = parseStorageRef(body.storageRef);

      if (!studyToken) {
        return jsonError("The study media token is missing.", 401);
      }

      if (!itemId) {
        return jsonError("The questionnaire item is missing.");
      }

      if (!ref || ref.bucket !== QUESTIONNAIRE_BUCKET) {
        return jsonError("Invalid questionnaire media reference.");
      }

      // IMPORTANT: use the exact same authorization contract as the participant
      // page itself. If psylattice_public_study(p_token) allows the questionnaire
      // to load, the media endpoint should make its decision from that same
      // filtered public payload instead of independently re-deriving participant
      // session / recruitment-link state.
      //
      // This also means the endpoint never trusts an arbitrary storage path: the
      // requested storage:// reference must be present on the exact item returned
      // by psylattice_public_study for this token before a signed URL is issued.
      const publicSupabase = publicRpcClient();
      const { data: publicStudy, error: publicStudyError } =
        await publicSupabase.rpc("psylattice_public_study", {
          p_token: studyToken,
        });

      if (publicStudyError || !publicStudy?.ok) {
        return jsonError(
          String(
            publicStudy?.error ||
              publicStudyError?.message ||
              "This study questionnaire could not be verified."
          ),
          403
        );
      }

      const measures = Array.isArray(publicStudy.measures)
        ? publicStudy.measures
        : [];

      let publicItem: {
        id?: unknown;
        media_config?: unknown;
        response_options?: unknown;
      } | null = null;

      for (const measure of measures) {
        const items = Array.isArray(measure?.items) ? measure.items : [];
        const found = items.find(
          (candidate: { id?: unknown }) => String(candidate?.id || "") === itemId
        );

        if (found) {
          publicItem = found;
          break;
        }
      }

      if (!publicItem) {
        return jsonError("This questionnaire item is not part of this study.", 403);
      }

      const requestedRef = storageRef(ref.bucket, ref.path);
      if (!referencedMediaValues(publicItem).includes(requestedRef)) {
        return jsonError(
          "This media file is not referenced by this questionnaire item.",
          403
        );
      }

      const { data, error } = await supabase.storage
        .from(ref.bucket)
        .createSignedUrl(ref.path, 60 * 60);

      if (error || !data?.signedUrl) {
        return jsonError(
          error?.message || "Could not create the questionnaire media URL.",
          500
        );
      }

      return NextResponse.json(
        { ok: true, signedUrl: data.signedUrl },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return jsonError("Unknown media ticket action.");
  } catch (error) {
    console.error("PsyLattice media ticket error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Unexpected media service error.",
      500
    );
  }
}
