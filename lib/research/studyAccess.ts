export type StudyAccessType = "owner" | "collaborator";

export type StudyAccessContext = {
  allowed: boolean;
  accessType: StudyAccessType | null;
  role: string | null;
  studyId: string;
  studyTitle: string;
  ownerUserId: string | null;
  studyStatus: string | null;
  permissions: Record<string, boolean>;
};

export type AccessibleStudy = {
  study_id: string;
  title: string;
  status: string;
  owner_user_id: string;
  access_type: StudyAccessType;
  role: string;
  permissions: Record<string, boolean>;
  updated_at: string;
};

export async function loadAccessibleStudies(): Promise<AccessibleStudy[]> {
  const response = await fetch("/api/research/access", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || "Study access could not be loaded.");
  }

  return Array.isArray(payload.studies) ? payload.studies : [];
}

export async function loadStudyAccess(
  studyId: string,
): Promise<StudyAccessContext> {
  const response = await fetch(
    `/api/research/access?study_id=${encodeURIComponent(studyId)}`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.ok || !payload?.access) {
    throw new Error(payload?.error || "Study access could not be loaded.");
  }

  const access = payload.access as Record<string, unknown>;

  return {
    allowed: access.allowed === true,
    accessType:
      access.access_type === "owner" || access.access_type === "collaborator"
        ? access.access_type
        : null,
    role: typeof access.role === "string" ? access.role : null,
    studyId:
      typeof access.study_id === "string" ? access.study_id : studyId,
    studyTitle:
      typeof access.study_title === "string"
        ? access.study_title
        : "Untitled study",
    ownerUserId:
      typeof access.owner_user_id === "string" ? access.owner_user_id : null,
    studyStatus:
      typeof access.study_status === "string" ? access.study_status : null,
    permissions:
      access.permissions &&
      typeof access.permissions === "object" &&
      !Array.isArray(access.permissions)
        ? (access.permissions as Record<string, boolean>)
        : {},
  };
}

export function canUseStudyModule(
  access: Pick<StudyAccessContext, "allowed" | "permissions"> | null | undefined,
  module: string,
) {
  return Boolean(access?.allowed && access.permissions?.[module] === true);
}

export function canEditStudy(
  access: Pick<StudyAccessContext, "allowed" | "permissions"> | null | undefined,
) {
  return Boolean(access?.allowed && access.permissions?.can_edit === true);
}

export function canCommentOnStudy(
  access: Pick<StudyAccessContext, "allowed" | "permissions"> | null | undefined,
) {
  return Boolean(access?.allowed && access.permissions?.can_comment === true);
}

export function canReviewStudy(
  access: Pick<StudyAccessContext, "allowed" | "permissions"> | null | undefined,
) {
  return Boolean(access?.allowed && access.permissions?.can_review === true);
}
