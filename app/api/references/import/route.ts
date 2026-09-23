import { NextRequest, NextResponse } from "next/server";
import { authenticatedBillingUser } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";
import {
  detectReferenceFormat,
  normalizeDoi,
  parseBibTeX,
  parseRIS,
  type NormalizedReferenceImport,
} from "@/lib/references/importers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_ITEMS = 500;

function normalizeTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function safeSourceKind(format: string) {
  return format === "ris" ? "ris" : "bibtex";
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");
    const pastedValue = formData.get("text");
    const explicitFormat =
      typeof formData.get("format") === "string"
        ? String(formData.get("format"))
        : null;

    let content = "";
    let fileName: string | null = null;

    if (fileValue instanceof File && fileValue.size > 0) {
      if (fileValue.size > MAX_IMPORT_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            error: "Reference import files are limited to 2 MB.",
          },
          { status: 413 },
        );
      }

      fileName = fileValue.name;
      content = await fileValue.text();
    } else if (typeof pastedValue === "string" && pastedValue.trim()) {
      if (Buffer.byteLength(pastedValue, "utf8") > MAX_IMPORT_BYTES) {
        return NextResponse.json(
          {
            ok: false,
            error: "Pasted reference data is limited to 2 MB.",
          },
          { status: 413 },
        );
      }
      content = pastedValue;
    }

    if (!content.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Upload a .bib/.ris file or paste reference data.",
        },
        { status: 400 },
      );
    }

    const format = detectReferenceFormat(fileName, explicitFormat, content);

    if (!format) {
      return NextResponse.json(
        {
          ok: false,
          error: "PsyLattice could not identify this as BibTeX or RIS data.",
        },
        { status: 400 },
      );
    }

    const parsed =
      format === "bibtex" ? parseBibTeX(content) : parseRIS(content);

    if (parsed.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No valid references were found in this import.",
        },
        { status: 400 },
      );
    }

    if (parsed.length > MAX_IMPORT_ITEMS) {
      return NextResponse.json(
        {
          ok: false,
          error: `Import up to ${MAX_IMPORT_ITEMS} references at a time.`,
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: existing, error: existingError } = await supabase
      .from("reference_items")
      .select("id, title, published_year, doi")
      .eq("owner_user_id", user.id);

    if (existingError) throw existingError;

    const existingDois = new Set(
      (existing || [])
        .map((row) => normalizeDoi(row.doi))
        .filter(Boolean) as string[],
    );

    const existingTitleYears = new Set(
      (existing || []).map(
        (row) =>
          `${normalizeTitle(String(row.title || ""))}|${
            row.published_year ?? ""
          }`,
      ),
    );

    const imported: { id: string; title: string }[] = [];
    const skipped: { title: string; reason: string }[] = [];
    const errors: { title: string; error: string }[] = [];

    for (const reference of parsed) {
      const doi = normalizeDoi(reference.doi);
      const titleKey = `${normalizeTitle(reference.title)}|${
        reference.published_year ?? ""
      }`;

      if (doi && existingDois.has(doi)) {
        skipped.push({
          title: reference.title,
          reason: "DOI already exists in your library.",
        });
        continue;
      }

      if (!doi && existingTitleYears.has(titleKey)) {
        skipped.push({
          title: reference.title,
          reason: "A matching title and year already exist in your library.",
        });
        continue;
      }

      const payload = {
        owner_user_id: user.id,
        item_type: reference.item_type,
        title: reference.title,
        authors: reference.authors,
        editors: reference.editors || [],
        published_year: reference.published_year,
        container_title: reference.container_title,
        publisher: reference.publisher,
        volume: reference.volume,
        issue: reference.issue,
        page: reference.page,
        doi,
        url: reference.url,
        isbn: reference.isbn,
        issn: reference.issn,
        abstract: reference.abstract,
        language: reference.language,
        keywords: reference.keywords,
        citation_key: reference.citation_key,
        raw_csl: reference.raw_csl,
        source_metadata: reference.source_metadata,
        source_kind: safeSourceKind(format),
        metadata_verified_at: null,
      };

      const { data, error } = await supabase
        .from("reference_items")
        .insert(payload)
        .select("id, title")
        .single();

      if (error) {
        errors.push({
          title: reference.title,
          error: error.message,
        });
        continue;
      }

      imported.push({
        id: String(data.id),
        title: String(data.title),
      });

      if (doi) existingDois.add(doi);
      existingTitleYears.add(titleKey);
    }

    return NextResponse.json(
      {
        ok: true,
        format,
        parsed: parsed.length,
        imported,
        skipped,
        errors,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Reference import failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "PsyLattice could not import these references.",
      },
      { status: 500 },
    );
  }
}
