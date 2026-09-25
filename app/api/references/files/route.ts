import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { authenticatedBillingUser } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_PDF_BYTES = 32 * 1024 * 1024;
const MAX_PDF_PAGES = 400;
const MAX_EXTRACTED_CHARS = 5_000_000;
const EXTRACTION_TIMEOUT_MS = 30_000;

function safeFileName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 140);

  return cleaned || "reference.pdf";
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("PDF text extraction timed out."));
      }, milliseconds);
      timer.unref?.();
    }),
  ]);
}

export async function POST(request: NextRequest) {
  let uploadedPath: string | null = null;

  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const referenceId = String(formData.get("reference_id") || "").trim();
    const file = formData.get("file");

    if (!referenceId) {
      return NextResponse.json(
        { ok: false, error: "Choose a reference before attaching a PDF." },
        { status: 400 },
      );
    }

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json(
        { ok: false, error: "Choose a PDF file to upload." },
        { status: 400 },
      );
    }

    const lowerName = file.name.toLowerCase();
    if (file.type !== "application/pdf" && !lowerName.endsWith(".pdf")) {
      return NextResponse.json(
        { ok: false, error: "Reference attachments must be PDF files." },
        { status: 400 },
      );
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: "PDF reference attachments are limited to 32 MB.",
        },
        { status: 413 },
      );
    }

    const supabase = await createClient();

    const { data: reference, error: referenceError } = await supabase
      .from("reference_items")
      .select("id, title")
      .eq("id", referenceId)
      .eq("owner_user_id", user.id)
      .single();

    if (referenceError || !reference) {
      return NextResponse.json(
        { ok: false, error: "That reference could not be found." },
        { status: 404 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const hash = createHash("sha256").update(bytes).digest("hex");
    const finalName = safeFileName(file.name);
    const storagePath = `${user.id}/${referenceId}/${randomUUID()}-${finalName}`;
    uploadedPath = storagePath;

    let extractionStatus: "ready" | "failed" = "failed";
    let extractedText = "";
    let pageCount: number | null = null;
    let extractionError: string | null = null;

    try {
      const pdf = await withTimeout(
        getDocumentProxy(bytes, {
          maxImageSize: 16_777_216,
        }),
        EXTRACTION_TIMEOUT_MS,
      );

      pageCount = pdf.numPages;

      if (pdf.numPages > MAX_PDF_PAGES) {
        throw new Error(
          `PDF has ${pdf.numPages} pages. PsyLattice currently extracts up to ${MAX_PDF_PAGES} pages per reference file.`,
        );
      }

      const extracted = await withTimeout(
        extractText(pdf, { mergePages: true }),
        EXTRACTION_TIMEOUT_MS,
      );

      const merged = Array.isArray(extracted.text)
        ? extracted.text.join("\n\n")
        : extracted.text;

      extractedText = merged
        .replace(/\u0000/g, "")
        .replace(/\r\n/g, "\n")
        .trim()
        .slice(0, MAX_EXTRACTED_CHARS);

      pageCount = extracted.totalPages;

      if (extractedText.length > 0) {
        extractionStatus = "ready";
      } else {
        extractionError =
          "The PDF uploaded successfully, but no machine-readable text was found. It may be image-only or scanned.";
      }
    } catch (error) {
      extractionError =
        error instanceof Error
          ? error.message
          : "The PDF uploaded, but text extraction failed.";
    }

    const { error: storageError } = await supabase.storage
      .from("reference-files")
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
        cacheControl: "3600",
      });

    if (storageError) throw storageError;

    const { data: fileRow, error: fileInsertError } = await supabase
      .from("reference_files")
      .insert({
        owner_user_id: user.id,
        reference_id: referenceId,
        storage_bucket: "reference-files",
        storage_path: storagePath,
        file_name: finalName,
        mime_type: "application/pdf",
        size_bytes: file.size,
        sha256: hash,
        extraction_status: extractionStatus,
      })
      .select("*")
      .single();

    if (fileInsertError) throw fileInsertError;

    if (extractionStatus === "ready" && extractedText) {
      const { error: textInsertError } = await supabase
        .from("reference_file_text")
        .insert({
          owner_user_id: user.id,
          reference_file_id: fileRow.id,
          reference_id: referenceId,
          plain_text: extractedText,
          page_count: pageCount,
          char_count: extractedText.length,
          extraction_method: "unpdf",
          extraction_metadata: {
            truncated_at_chars:
              extractedText.length >= MAX_EXTRACTED_CHARS
                ? MAX_EXTRACTED_CHARS
                : null,
          },
        });

      if (textInsertError) {
        await supabase
          .from("reference_files")
          .update({ extraction_status: "failed" })
          .eq("id", fileRow.id)
          .eq("owner_user_id", user.id);

        extractionStatus = "failed";
        extractionError =
          "The PDF was stored, but PsyLattice could not save its extracted text.";
      } else {
        await supabase
          .from("reference_items")
          .update({ ai_index_status: "pending" })
          .eq("id", referenceId)
          .eq("owner_user_id", user.id);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        file: {
          ...fileRow,
          extraction_status: extractionStatus,
        },
        extraction: {
          status: extractionStatus,
          page_count: pageCount,
          char_count: extractedText.length,
          message: extractionError,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Reference PDF upload failed:", error);

    if (uploadedPath) {
      try {
        const supabase = await createClient();
        await supabase.storage.from("reference-files").remove([uploadedPath]);
      } catch {
        // Best-effort cleanup only.
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "PsyLattice could not upload this reference PDF.",
      },
      { status: 500 },
    );
  }
}
