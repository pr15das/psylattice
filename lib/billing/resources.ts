import "server-only";

import { createClient } from "@supabase/supabase-js";

export type ResourceEntitlementCode =
  | "MEDIA_UPLOAD_LOCKED"
  | "MEDIA_LIMIT_EXHAUSTED"
  | "MEDIA_STUDY_FORBIDDEN"
  | "MEDIA_INVALID_SIZE"
  | "MEDIA_INVALID_PATH"
  | "EMAIL_LIMIT_EXHAUSTED"
  | "EMAIL_STUDY_FORBIDDEN"
  | "RESOURCE_CONFIG";

export class ResourceEntitlementError extends Error {
  code: ResourceEntitlementCode;

  constructor(code: ResourceEntitlementCode, message: string) {
    super(message);
    this.name = "ResourceEntitlementError";
    this.code = code;
  }
}

type MediaSnapshot = {
  effectivePlan: string;
  uploadsAllowed: boolean;
  includedBytes: number;
  purchasedExtraBytes: number;
  effectiveStorageBytes: number;
  usedBytes: number;
  remainingBytes: number;
  remainingPercent: number;
  exhausted: boolean;
};

type EmailSnapshot = {
  effectivePlan: string;
  included: number;
  purchasedExtra: number;
  effectiveAllowance: number;
  used: number;
  remaining: number;
  remainingPercent: number;
  exhausted: boolean;
};

export type PublicResourceBudgetSnapshot = {
  studyPassCount: number;
  media: MediaSnapshot;
  participantEmails: EmailSnapshot;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new ResourceEntitlementError(
      "RESOURCE_CONFIG",
      "PsyLattice resource accounting is not configured.",
    );
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function booleanValue(value: unknown) {
  return value === true;
}

function resourceError(error: unknown): ResourceEntitlementError {
  const raw =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message || "")
      : error instanceof Error
        ? error.message
        : String(error || "");

  if (raw.includes("PL_MEDIA_UPLOAD_LOCKED")) {
    return new ResourceEntitlementError(
      "MEDIA_UPLOAD_LOCKED",
      "Custom media and participant file uploads require Pro Monthly or Pro Annual.",
    );
  }
  if (raw.includes("PL_MEDIA_LIMIT_EXHAUSTED")) {
    return new ResourceEntitlementError(
      "MEDIA_LIMIT_EXHAUSTED",
      "Your PsyLattice media storage allowance is full.",
    );
  }
  if (raw.includes("PL_MEDIA_STUDY_FORBIDDEN")) {
    return new ResourceEntitlementError(
      "MEDIA_STUDY_FORBIDDEN",
      "This study is not available to the researcher account that owns the storage allowance.",
    );
  }
  if (raw.includes("PL_MEDIA_INVALID_SIZE")) {
    return new ResourceEntitlementError(
      "MEDIA_INVALID_SIZE",
      "The requested upload size is invalid.",
    );
  }
  if (raw.includes("PL_MEDIA_INVALID_PATH")) {
    return new ResourceEntitlementError(
      "MEDIA_INVALID_PATH",
      "The requested storage path is invalid.",
    );
  }
  if (raw.includes("PL_EMAIL_LIMIT_EXHAUSTED")) {
    return new ResourceEntitlementError(
      "EMAIL_LIMIT_EXHAUSTED",
      "The participant email allowance is exhausted.",
    );
  }
  if (raw.includes("PL_EMAIL_STUDY_FORBIDDEN")) {
    return new ResourceEntitlementError(
      "EMAIL_STUDY_FORBIDDEN",
      "This study is not available to the researcher account that owns the email allowance.",
    );
  }

  return new ResourceEntitlementError(
    "RESOURCE_CONFIG",
    "PsyLattice could not verify the resource allowance.",
  );
}

export async function getPublicResourceBudgetSnapshot(
  userId: string,
  studyId?: string | null,
): Promise<PublicResourceBudgetSnapshot> {
  const admin = adminClient();
  const { data, error } = await admin.rpc("psylattice_resource_budget_snapshot", {
    p_user_id: userId,
    p_study_id: studyId || null,
  });

  if (error) throw resourceError(error);

  const row = (data || {}) as Record<string, unknown>;
  const media = (row.media || {}) as Record<string, unknown>;
  const email = (row.participantEmails || {}) as Record<string, unknown>;

  return {
    studyPassCount: Math.max(0, Math.floor(numberValue(row.studyPassCount))),
    media: {
      effectivePlan: String(media.effectivePlan || "free"),
      uploadsAllowed: booleanValue(media.uploadsAllowed),
      includedBytes: Math.max(0, numberValue(media.includedBytes)),
      purchasedExtraBytes: Math.max(0, numberValue(media.purchasedExtraBytes)),
      effectiveStorageBytes: Math.max(0, numberValue(media.effectiveStorageBytes)),
      usedBytes: Math.max(0, numberValue(media.usedBytes)),
      remainingBytes: Math.max(0, numberValue(media.remainingBytes)),
      remainingPercent: Math.max(0, Math.min(100, numberValue(media.remainingPercent))),
      exhausted: booleanValue(media.exhausted),
    },
    participantEmails: {
      effectivePlan: String(email.effectivePlan || "free"),
      included: Math.max(0, numberValue(email.included)),
      purchasedExtra: Math.max(0, numberValue(email.purchasedExtra)),
      effectiveAllowance: Math.max(0, numberValue(email.effectiveAllowance)),
      used: Math.max(0, numberValue(email.used)),
      remaining: Math.max(0, numberValue(email.remaining)),
      remainingPercent: Math.max(0, Math.min(100, numberValue(email.remainingPercent))),
      exhausted: booleanValue(email.exhausted),
    },
  };
}

export async function reserveMediaUpload(input: {
  userId: string;
  studyId?: string | null;
  bucket: string;
  objectPath: string;
  bytes: number;
  mediaKind: string;
}) {
  const admin = adminClient();
  const { data, error } = await admin.rpc("psylattice_reserve_media_upload", {
    p_user_id: input.userId,
    p_study_id: input.studyId || null,
    p_bucket: input.bucket,
    p_object_path: input.objectPath,
    p_bytes: Math.floor(input.bytes),
    p_media_kind: input.mediaKind,
  });

  if (error) throw resourceError(error);

  const row = (data || {}) as Record<string, unknown>;
  return {
    reservationId: String(row.reservationId || ""),
    remainingBytes: Math.max(0, numberValue(row.remainingBytes)),
    remainingPercent: Math.max(0, Math.min(100, numberValue(row.remainingPercent))),
  };
}

export async function releaseMediaReservation(userId: string, reservationId: string) {
  if (!reservationId) return;
  const admin = adminClient();
  const { error } = await admin.rpc("psylattice_release_media_reservation", {
    p_user_id: userId,
    p_reservation_id: reservationId,
  });
  if (error) throw resourceError(error);
}

export async function commitMediaPath(userId: string, bucket: string, objectPath: string) {
  const admin = adminClient();
  const { error } = await admin.rpc("psylattice_commit_media_path", {
    p_user_id: userId,
    p_bucket: bucket,
    p_object_path: objectPath,
  });
  if (error) throw resourceError(error);
}

export async function reserveParticipantEmail(input: {
  userId: string;
  studyId: string;
  notificationId: string;
  referenceType?: string | null;
}) {
  const admin = adminClient();
  const { data, error } = await admin.rpc("psylattice_reserve_participant_email", {
    p_user_id: input.userId,
    p_study_id: input.studyId,
    p_notification_id: input.notificationId,
    p_reference_type: input.referenceType || null,
  });

  if (error) throw resourceError(error);

  const row = (data || {}) as Record<string, unknown>;
  return {
    usageId: String(row.usageId || ""),
    alreadyReserved: booleanValue(row.alreadyReserved),
    remaining: Math.max(0, numberValue(row.remaining)),
    remainingPercent: Math.max(0, Math.min(100, numberValue(row.remainingPercent))),
  };
}

export async function completeParticipantEmail(userId: string, usageId: string) {
  if (!usageId) return;
  const admin = adminClient();
  const { error } = await admin.rpc("psylattice_complete_participant_email", {
    p_user_id: userId,
    p_usage_id: usageId,
  });
  if (error) throw resourceError(error);
}

export async function refundParticipantEmail(userId: string, usageId: string) {
  if (!usageId) return;
  const admin = adminClient();
  const { error } = await admin.rpc("psylattice_refund_participant_email", {
    p_user_id: userId,
    p_usage_id: usageId,
  });
  if (error) throw resourceError(error);
}
