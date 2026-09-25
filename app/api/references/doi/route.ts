import { NextRequest, NextResponse } from "next/server";
import { authenticatedBillingUser } from "@/lib/billing/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeDoi(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim()
    .toLowerCase();
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function firstString(value: unknown) {
  if (!Array.isArray(value)) return null;
  const first = value.find((item) => typeof item === "string" && item.trim());
  return typeof first === "string" ? first.trim() : null;
}

function datePartsToIso(parts: unknown) {
  if (!Array.isArray(parts) || !Array.isArray(parts[0])) return null;
  const row = parts[0] as unknown[];
  const year = Number(row[0]);
  const month = Number(row[1] || 1);
  const day = Number(row[2] || 1);

  if (!Number.isInteger(year) || year < 1000 || year > 9999) return null;

  const safeMonth = Math.min(12, Math.max(1, month));
  const safeDay = Math.min(31, Math.max(1, day));

  return `${String(year).padStart(4, "0")}-${String(safeMonth).padStart(
    2,
    "0",
  )}-${String(safeDay).padStart(2, "0")}`;
}

function publicationYear(message: Record<string, unknown>) {
  const candidates = [
    message.published,
    message["published-print"],
    message["published-online"],
    message.issued,
    message.created,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      "date-parts" in candidate
    ) {
      const parts = (candidate as { "date-parts"?: unknown })["date-parts"];
      if (Array.isArray(parts) && Array.isArray(parts[0])) {
        const year = Number(parts[0][0]);
        if (Number.isInteger(year) && year >= 1000 && year <= 9999) {
          return year;
        }
      }
    }
  }

  return null;
}

function publicationDate(message: Record<string, unknown>) {
  const candidates = [
    message.published,
    message["published-print"],
    message["published-online"],
    message.issued,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      "date-parts" in candidate
    ) {
      const iso = datePartsToIso(
        (candidate as { "date-parts"?: unknown })["date-parts"],
      );
      if (iso) return iso;
    }
  }

  return null;
}

function mapCrossrefType(value: unknown) {
  const type = typeof value === "string" ? value : "";

  const map: Record<string, string> = {
    "journal-article": "article-journal",
    "proceedings-article": "paper-conference",
    proceedings: "paper-conference",
    book: "book",
    "book-chapter": "chapter",
    "book-section": "chapter",
    dissertation: "thesis",
    report: "report",
    dataset: "dataset",
    posted: "other",
    reference: "other",
  };

  return map[type] || "article-journal";
}

function mapPeople(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((person) => {
      if (!person || typeof person !== "object") return null;

      const row = person as Record<string, unknown>;
      const given = text(row.given);
      const family = text(row.family);
      const name = text(row.name);
      const orcid = text(row.ORCID);

      if (!given && !family && !name) return null;

      return {
        given,
        family,
        literal: name,
        orcid: orcid?.replace(/^https?:\/\/orcid\.org\//i, "") || null,
      };
    })
    .filter(Boolean);
}

function stripJats(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    const doi = normalizeDoi(request.nextUrl.searchParams.get("doi") || "");

    if (!doi || !/^10\.\d{4,9}\/\S+$/i.test(doi)) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid DOI." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "PsyLattice/1.0 (https://psylattice.com)",
        },
        cache: "no-store",
      },
    );

    if (response.status === 404) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No verified Crossref record was found for that DOI. You can still add the reference manually.",
        },
        { status: 404 },
      );
    }

    if (!response.ok) {
      throw new Error(`Crossref lookup failed with status ${response.status}.`);
    }

    const payload = (await response.json()) as {
      message?: Record<string, unknown>;
    };
    const message = payload.message;

    if (!message) {
      throw new Error("The DOI metadata provider returned an empty record.");
    }

    const title =
      firstString(message.title) ||
      firstString(message["short-title"]) ||
      "Untitled reference";

    const reference = {
      item_type: mapCrossrefType(message.type),
      title,
      authors: mapPeople(message.author),
      editors: mapPeople(message.editor),
      published_year: publicationYear(message),
      published_date: publicationDate(message),
      container_title: firstString(message["container-title"]),
      publisher: text(message.publisher),
      volume: text(message.volume),
      issue: text(message.issue),
      page: text(message.page),
      doi: normalizeDoi(text(message.DOI) || doi),
      url: text(message.URL) || `https://doi.org/${doi}`,
      isbn: firstString(message.ISBN),
      issn: firstString(message.ISSN),
      abstract: stripJats(message.abstract),
      language: text(message.language),
      raw_csl: {
        id: normalizeDoi(text(message.DOI) || doi),
        type: mapCrossrefType(message.type),
        title,
        author: mapPeople(message.author),
        editor: mapPeople(message.editor),
        issued: message.issued || message.published || null,
        "container-title": firstString(message["container-title"]),
        publisher: text(message.publisher),
        volume: text(message.volume),
        issue: text(message.issue),
        page: text(message.page),
        DOI: normalizeDoi(text(message.DOI) || doi),
        URL: text(message.URL) || `https://doi.org/${doi}`,
      },
      source_metadata: {
        provider: "crossref",
        crossref_type: text(message.type),
        member: message.member || null,
        prefix: message.prefix || null,
        indexed: message.indexed || null,
        reference_count: message["reference-count"] || null,
        is_referenced_by_count: message["is-referenced-by-count"] || null,
      },
    };

    return NextResponse.json(
      { ok: true, reference },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Reference DOI lookup failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "PsyLattice could not retrieve this DOI.",
      },
      { status: 500 },
    );
  }
}
