import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ReferenceAuditItem,
  ThesisAuditParagraph,
} from "@/lib/research/health/ai/types";

const MAX_LIBRARY_METADATA_ITEMS = 180;
const MAX_REFERENCE_ITEMS_FOR_AUDIT = 24;
const MAX_EXTRACTED_TEXT_PER_REFERENCE = 3_500;

type ReferenceAuthor = {
  given?: string | null;
  family?: string | null;
  literal?: string | null;
};

type ReferenceRow = {
  id: string;
  title: string;
  authors: ReferenceAuthor[] | null;
  published_year: number | null;
  container_title: string | null;
  doi: string | null;
  abstract: string | null;
  keywords: string[] | null;
  updated_at: string;
};

function words(value: string) {
  return new Set(
    value
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(
        (word) =>
          word.length >= 4 &&
          ![
            "this",
            "that",
            "with",
            "from",
            "were",
            "have",
            "been",
            "into",
            "their",
            "there",
            "these",
            "those",
            "than",
            "also",
            "between",
            "within",
            "using",
            "used",
            "study",
            "research",
            "results",
            "participants",
            "analysis",
          ].includes(word),
      ),
  );
}

function authorsText(authors: ReferenceAuthor[] | null | undefined) {
  return (authors || [])
    .map(
      (author) =>
        author.family ||
        author.literal ||
        author.given ||
        "",
    )
    .filter(Boolean)
    .join(", ");
}

function overlapScore(
  corpusWords: Set<string>,
  reference: ReferenceRow,
  linked: boolean,
) {
  const referenceWords = words(
    [
      reference.title,
      reference.abstract || "",
      (reference.keywords || []).join(" "),
      reference.container_title || "",
    ].join(" "),
  );

  let overlap = 0;
  for (const word of referenceWords) {
    if (corpusWords.has(word)) overlap += 1;
  }

  const titleWords = words(reference.title || "");
  let titleOverlap = 0;
  for (const word of titleWords) {
    if (corpusWords.has(word)) titleOverlap += 1;
  }

  return overlap + titleOverlap * 2 + (linked ? 20 : 0);
}

export async function loadReferenceAuditContext(args: {
  supabase: SupabaseClient;
  userId: string;
  studyId: string;
  paragraphs: ThesisAuditParagraph[];
  permitted: boolean;
}): Promise<{
  permitted: boolean;
  totalLibraryItems: number;
  suppliedItems: ReferenceAuditItem[];
  linkedItems: number;
  extractedTextItems: number;
}> {
  if (!args.permitted) {
    return {
      permitted: false,
      totalLibraryItems: 0,
      suppliedItems: [],
      linkedItems: 0,
      extractedTextItems: 0,
    };
  }

  const [referenceResult, linkResult] = await Promise.all([
    args.supabase
      .from("reference_items")
      .select(
        "id,title,authors,published_year,container_title,doi,abstract,keywords,updated_at",
      )
      .eq("owner_user_id", args.userId)
      .order("updated_at", { ascending: false })
      .limit(MAX_LIBRARY_METADATA_ITEMS),

    args.supabase
      .from("reference_study_links")
      .select("reference_id")
      .eq("owner_user_id", args.userId)
      .eq("study_id", args.studyId),
  ]);

  if (referenceResult.error) throw referenceResult.error;
  if (linkResult.error) throw linkResult.error;

  const rows = (referenceResult.data || []) as ReferenceRow[];
  const linkedIds = new Set(
    (linkResult.data || []).map((row) => String(row.reference_id)),
  );

  const corpus = args.paragraphs.map((paragraph) => paragraph.text).join(" ");
  const corpusWords = words(corpus);

  const ranked = [...rows]
    .map((reference) => ({
      reference,
      linked: linkedIds.has(reference.id),
      score: overlapScore(
        corpusWords,
        reference,
        linkedIds.has(reference.id),
      ),
    }))
    .sort((a, b) => {
      if (a.linked !== b.linked) return a.linked ? -1 : 1;
      return b.score - a.score;
    })
    .slice(0, MAX_REFERENCE_ITEMS_FOR_AUDIT);

  const selectedIds = ranked.map((row) => row.reference.id);

  const textResult =
    selectedIds.length > 0
      ? await args.supabase
          .from("reference_file_text")
          .select("reference_id,plain_text,char_count,page_count")
          .eq("owner_user_id", args.userId)
          .in("reference_id", selectedIds)
          .order("char_count", { ascending: false })
          .limit(MAX_REFERENCE_ITEMS_FOR_AUDIT * 2)
      : { data: [], error: null };

  if (textResult.error) throw textResult.error;

  const textByReference = new Map<string, string>();
  for (const row of textResult.data || []) {
    const referenceId = String(row.reference_id);
    if (textByReference.has(referenceId)) continue;

    const text = String(row.plain_text || "")
      .replace(/\u0000/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_EXTRACTED_TEXT_PER_REFERENCE);

    if (text) textByReference.set(referenceId, text);
  }

  const suppliedItems: ReferenceAuditItem[] = ranked.map(
    ({ reference, linked }) => {
      const extractedText = textByReference.get(reference.id) || null;

      return {
        id: reference.id,
        title: reference.title || "Untitled reference",
        authorsText: authorsText(reference.authors),
        publishedYear: reference.published_year,
        containerTitle: reference.container_title,
        doi: reference.doi,
        abstract: reference.abstract
          ? String(reference.abstract).slice(0, 2_500)
          : null,
        keywords: Array.isArray(reference.keywords)
          ? reference.keywords.slice(0, 20)
          : [],
        linkedToStudy: linked,
        extractedText,
        extractedTextAvailable: Boolean(extractedText),
      };
    },
  );

  return {
    permitted: true,
    totalLibraryItems: rows.length,
    suppliedItems,
    linkedItems: suppliedItems.filter((item) => item.linkedToStudy).length,
    extractedTextItems: suppliedItems.filter(
      (item) => item.extractedTextAvailable,
    ).length,
  };
}
