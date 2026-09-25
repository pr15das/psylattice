import {
  authenticateMobileRequest,
  isResponse,
  isUuid,
  mobileData,
  mobileError,
  readJsonObject,
  type MobileAuthContext,
} from "./participantApi";
import { consumeMobileRateLimit } from "./rateLimit";
import { researcherAssetHandlers, type ResearcherRateScope } from "./researcherAssets";

type Authenticate = (request: Request) => Promise<MobileAuthContext | Response>;
type CountRows = { count: number }[];
type StudyRow = {
  id: string;
  title: string;
  status: string;
  target_sample_size: number | null;
  created_at: string;
  updated_at: string;
  participants: CountRows;
  measures: CountRows;
  testLinks: CountRows;
  liveLinks: CountRows;
};

type StudyDetailRow = StudyRow & { participant_description: string | null };
type CreatedStudyRow = Omit<StudyRow, "participants" | "measures" | "testLinks" | "liveLinks"> & {
  participant_description: string | null;
};
type ParticipantRow = {
  id: string;
  public_id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
};
type LinkRow = {
  id: string;
  name: string;
  token: string;
  is_test_link: boolean;
  status: "active" | "paused" | "closed";
  access_mode: "open" | "participant_code";
  max_participants: number | null;
  starts_at: string | null;
  ends_at: string | null;
  allow_multiple_submissions: boolean;
  created_at: string;
};
type StudyContext = { params: Promise<{ id: string }> };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_RANGE_END = 2_147_483_647;
const STUDY_COLUMNS = `
  id, title, status, target_sample_size, created_at, updated_at,
  participants:study_participants(count),
  measures:study_measures(count),
  testLinks:study_links!study_links_study_id_fkey(count),
  liveLinks:study_links!study_links_study_id_fkey(count)
`;

function positiveInteger(params: URLSearchParams, key: string, fallback: number) {
  const raw = params.get(key);
  if (raw === null) return fallback;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

function pagination(params: URLSearchParams) {
  const page = positiveInteger(params, "page", 1);
  const requestedLimit = positiveInteger(params, "limit", DEFAULT_LIMIT);
  if (page === null || requestedLimit === null) return null;
  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const offset = (page - 1) * limit;
  // Include one lookahead row, while keeping PostgREST's range in integer bounds.
  if (!Number.isSafeInteger(offset) || offset + limit > MAX_RANGE_END) return null;
  return { page, limit, offset };
}

function embeddedCount(rows: CountRows) {
  return rows[0]?.count ?? 0;
}

function ownedStudyProjection({ supabase, userId }: MobileAuthContext, columns = STUDY_COLUMNS) {
  return supabase
    .from("research_studies")
    .select(columns)
    .eq("owner_user_id", userId)
    .eq("participants.owner_user_id", userId)
    .eq("participants.is_test", false)
    .neq("participants.status", "withdrawn")
    .eq("measures.owner_user_id", userId)
    .eq("testLinks.owner_user_id", userId)
    .eq("testLinks.is_test_link", true)
    .eq("liveLinks.owner_user_id", userId)
    .eq("liveLinks.is_test_link", false);
}

function studyDto(study: StudyRow) {
  return {
    id: study.id,
    title: study.title,
    status: study.status,
    participantCount: embeddedCount(study.participants),
    targetSampleSize: study.target_sample_size,
    measureCount: embeddedCount(study.measures),
    hasTestLink: embeddedCount(study.testLinks) > 0,
    hasLiveLink: embeddedCount(study.liveLinks) > 0,
    createdAt: study.created_at,
    updatedAt: study.updated_at,
  };
}

export function researcherHandlers(authenticate: Authenticate = authenticateMobileRequest) {
  async function read(
    request: Request,
    allowedParams: string[],
    query: (auth: MobileAuthContext, params: URLSearchParams) => Promise<Response>,
    scope: ResearcherRateScope = "researcherReads"
  ) {
    try {
      const auth = await authenticate(request);
      if (isResponse(auth)) return auth;
      const params = new URL(request.url).searchParams;
      // This allowlist also rejects every client-supplied ownership selector.
      if (
        [...params.keys()].some((key) => !allowedParams.includes(key)) ||
        allowedParams.some((key) => params.getAll(key).length > 1)
      ) {
        return mobileError("VALIDATION_FAILED", 400);
      }
      if (!consumeMobileRateLimit(scope, auth.userId)) {
        return mobileError("RATE_LIMITED", 429);
      }
      return await query(auth, params);
    } catch {
      return mobileError("SERVER_ERROR");
    }
  }

  return {
    ...researcherAssetHandlers(read, pagination),

    async studyDetail(request: Request, { params }: StudyContext) {
      return read(request, [], async (auth) => {
        const { id } = await params;
        if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
        const { data, error } = await ownedStudyProjection(
          auth,
          `${STUDY_COLUMNS}, participant_description`
        )
          .eq("id", id)
          .limit(1)
          .maybeSingle()
          .overrideTypes<StudyDetailRow, { merge: false }>();

        if (error) return mobileError("SERVER_ERROR");
        // Missing and inaccessible studies use the same existing public error.
        if (!data) return mobileError("FORBIDDEN");
        return mobileData({ ...studyDto(data), description: data.participant_description });
      });
    },

    async participants(request: Request, { params }: StudyContext) {
      return read(request, ["page", "limit"], async ({ supabase, userId }, queryParams) => {
        const { id } = await params;
        if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
        const window = pagination(queryParams);
        if (!window) return mobileError("VALIDATION_FAILED", 400);

        // Finish ownership verification before querying any participant rows.
        const study = await supabase
          .from("research_studies")
          .select("id")
          .eq("owner_user_id", userId)
          .eq("id", id)
          .limit(1)
          .maybeSingle();
        if (study.error) return mobileError("SERVER_ERROR");
        if (!study.data) return mobileError("FORBIDDEN");

        const { page, limit, offset } = window;
        // The web LIVE roster retains withdrawn records; TEST records stay separate.
        const { data, error } = await supabase
          .from("study_participants")
          .select("id, public_id, status, enrolled_at, completed_at")
          .eq("owner_user_id", userId)
          .eq("study_id", id)
          .eq("is_test", false)
          .order("enrolled_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + limit)
          .overrideTypes<ParticipantRow[], { merge: false }>();
        if (error || data === null) return mobileError("SERVER_ERROR");
        return mobileData({
          items: data.slice(0, limit).map((participant) => ({
            id: participant.id,
            publicId: participant.public_id,
            status: participant.status,
            enrolledAt: participant.enrolled_at,
            completedAt: participant.completed_at,
          })),
          page,
          limit,
          hasMore: data.length > limit,
        });
      });
    },

    async links(request: Request, { params }: StudyContext) {
      return read(request, ["page", "limit"], async ({ supabase, userId }, queryParams) => {
        const { id } = await params;
        if (!isUuid(id)) return mobileError("VALIDATION_FAILED", 400);
        const window = pagination(queryParams);
        if (!window) return mobileError("VALIDATION_FAILED", 400);

        // Verify the study before exposing any shareable recruitment tokens.
        const study = await supabase
          .from("research_studies")
          .select("id")
          .eq("owner_user_id", userId)
          .eq("id", id)
          .limit(1)
          .maybeSingle();
        if (study.error) return mobileError("SERVER_ERROR");
        if (!study.data) return mobileError("FORBIDDEN");

        const { page, limit, offset } = window;
        // The web retains multiple links of both kinds, including paused/closed links.
        const { data, error } = await supabase
          .from("study_links")
          .select("id, name, token, is_test_link, status, access_mode, max_participants, starts_at, ends_at, allow_multiple_submissions, created_at")
          .eq("owner_user_id", userId)
          .eq("study_id", id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + limit)
          .overrideTypes<LinkRow[], { merge: false }>();
        if (error || data === null) return mobileError("SERVER_ERROR");
        return mobileData({
          items: data.slice(0, limit).map((link) => ({
            id: link.id,
            name: link.name,
            token: link.token,
            canonicalPath: `/study/${encodeURIComponent(link.token)}`,
            isTestLink: link.is_test_link,
            status: link.status,
            accessMode: link.access_mode,
            participantLimit: link.max_participants,
            startsAt: link.starts_at,
            endsAt: link.ends_at,
            allowMultipleSubmissions: link.allow_multiple_submissions,
            createdAt: link.created_at,
          })),
          page,
          limit,
          hasMore: data.length > limit,
        });
      });
    },

    async summary(request: Request) {
      return read(request, [], async ({ supabase, userId }) => {
        const ownedStudies = () =>
          supabase
            .from("research_studies")
            .select("id", { count: "exact", head: true })
            .eq("owner_user_id", userId);

        // Match the web recruitment counts: live participants, excluding withdrawn.
        // The inner join verifies study ownership as well as participant ownership.
        const results = await Promise.all([
          ownedStudies(),
          ownedStudies().eq("status", "active"),
          ownedStudies().eq("status", "draft"),
          supabase
            .from("study_participants")
            .select("id, research_studies!inner()", { count: "exact", head: true })
            .eq("owner_user_id", userId)
            .eq("research_studies.owner_user_id", userId)
            .eq("is_test", false)
            .neq("status", "withdrawn"),
        ]);
        if (results.some((result) => result.error || result.count === null)) {
          return mobileError("SERVER_ERROR");
        }
        return mobileData({
          totalStudies: results[0].count,
          activeStudies: results[1].count,
          draftStudies: results[2].count,
          totalParticipants: results[3].count,
        });
      });
    },

    async createStudy(request: Request) {
      return read(request, [], async ({ supabase, userId }) => {
        const body = await readJsonObject(request);
        if (isResponse(body)) return body;
        if (
          Object.keys(body).some((key) => !["title", "description"].includes(key)) ||
          typeof body.title !== "string" ||
          body.title.trim().length === 0 ||
          (Object.hasOwn(body, "description") && typeof body.description !== "string")
        ) {
          return mobileError("VALIDATION_FAILED", 400);
        }

        // Web saveStudyDraft trims edges; neither web nor schema sets a text maximum.
        const { data, error } = await supabase
          .from("research_studies")
          .insert({
            owner_user_id: userId,
            title: body.title.trim(),
            participant_description: typeof body.description === "string" ? body.description.trim() || null : null,
            status: "draft",
          })
          .select("id, title, participant_description, status, target_sample_size, created_at, updated_at")
          .single()
          .overrideTypes<CreatedStudyRow, { merge: false }>();
        if (error) return mobileError(error.code === "42501" ? "FORBIDDEN" : "SERVER_ERROR");
        if (!data) return mobileError("SERVER_ERROR");

        // A shell has no related rows: reuse the study DTO without a post-write read.
        return mobileData({
          ...studyDto({ ...data, participants: [], measures: [], testLinks: [], liveLinks: [] }),
          description: data.participant_description,
        }, 201);
      }, "researcherMutations");
    },

    async studies(request: Request) {
      return read(request, ["page", "limit"], async ({ supabase, userId }, params) => {
        const window = pagination(params);
        if (!window) return mobileError("VALIDATION_FAILED", 400);
        const { page, limit, offset } = window;

        // Left embeddings return only counts and retain studies with no children.
        // Explicit FK hints disambiguate the two aliases of study_links.
        const { data, error } = await ownedStudyProjection({ supabase, userId })
          .order("updated_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + limit)
          .overrideTypes<StudyRow[], { merge: false }>();

        if (error || data === null) return mobileError("SERVER_ERROR");
        return mobileData({
          items: data.slice(0, limit).map(studyDto),
          page,
          limit,
          hasMore: data.length > limit,
        });
      });
    },
  };
}

export const mobileResearcherHandlers = researcherHandlers();
