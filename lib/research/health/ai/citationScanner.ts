import type {
  ThesisAuditParagraph,
  ThesisCitationAuditContext,
} from "@/lib/research/health/ai/types";

const MAX_AUDIT_CHARS = 80_000;
const MAX_PARAGRAPHS = 140;
const MAX_PARAGRAPH_CHARS = 1_600;

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ");
}

function normalizedWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function paragraphHasCitationMarker(text: string) {
  const value = normalizedWhitespace(text);

  const authorDateParenthetical =
    /\((?=[^)]{0,180}\b(?:19|20)\d{2}[a-z]?\b)[^)]{1,220}\)/i;
  const authorDateNarrative =
    /\b[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’.-]+(?:\s+(?:&|and)\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’.-]+|\s+et\s+al\.)?\s*\((?:19|20)\d{2}[a-z]?\)/;
  const numericBracket =
    /\[\s*\d{1,4}(?:\s*[,;–—-]\s*\d{1,4})*\s*\]/;
  const superscriptNumeric = /[¹²³⁴⁵⁶⁷⁸⁹⁰]{1,4}/;

  return (
    authorDateParenthetical.test(value) ||
    authorDateNarrative.test(value) ||
    numericBracket.test(value) ||
    superscriptNumeric.test(value)
  );
}

function candidateParagraph(text: string) {
  const value = normalizedWhitespace(text);
  const words = value.split(/\s+/).filter(Boolean);

  if (words.length < 14) return false;
  if (value.length < 90) return false;
  if (paragraphHasCitationMarker(value)) return false;

  if (/^(references|bibliography|table|figure|appendix|contents)\b/i.test(value))
    return false;
  if (/^(https?:\/\/|doi:|10\.\d{4,9}\/)/i.test(value)) return false;

  return true;
}

type RawParagraph = {
  paragraphIndex: number;
  lineStart: number;
  lineEnd: number;
  text: string;
};

function extractParagraphs(raw: string): RawParagraph[] {
  const lines = raw.split("\n");
  const paragraphs: RawParagraph[] = [];

  let buffer: string[] = [];
  let lineStart = 0;
  let paragraphIndex = 0;

  const flush = (lineEnd: number) => {
    const text = normalizedWhitespace(buffer.join(" "));
    if (!text) {
      buffer = [];
      lineStart = 0;
      return;
    }

    paragraphs.push({
      paragraphIndex,
      lineStart,
      lineEnd,
      text,
    });

    paragraphIndex += 1;
    buffer = [];
    lineStart = 0;
  };

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1;
    if (line.trim()) {
      if (!lineStart) lineStart = lineNumber;
      buffer.push(line.trim());
      return;
    }

    if (buffer.length > 0) {
      flush(lineNumber - 1);
    }
  });

  if (buffer.length > 0) {
    flush(lines.length);
  }

  return paragraphs;
}

export function buildThesisCitationAuditContext(args: {
  studyId: string;
  studyTitle: string;
  documents: Array<{
    id: string;
    title: string;
    content_text: string | null;
  }>;
}): Omit<ThesisCitationAuditContext, "referenceLibrary"> {
  const paragraphs: ThesisAuditParagraph[] = [];
  let auditedChars = 0;
  let truncated = false;
  let documentCount = 0;

  for (const document of args.documents) {
    const raw = cleanText(document.content_text);
    if (!raw.trim()) continue;
    documentCount += 1;

    const documentParagraphs = extractParagraphs(raw);

    for (const paragraph of documentParagraphs) {
      if (!candidateParagraph(paragraph.text)) continue;

      const clipped = paragraph.text.slice(0, MAX_PARAGRAPH_CHARS);
      if (
        paragraphs.length >= MAX_PARAGRAPHS ||
        auditedChars + clipped.length > MAX_AUDIT_CHARS
      ) {
        truncated = true;
        break;
      }

      paragraphs.push({
        documentId: document.id,
        documentTitle: document.title || "Untitled Thesis document",
        paragraphIndex: paragraph.paragraphIndex,
        lineStart: paragraph.lineStart,
        lineEnd: paragraph.lineEnd,
        text: clipped,
      });
      auditedChars += clipped.length;
    }

    if (truncated) break;
  }

  return {
    studyId: args.studyId,
    studyTitle: args.studyTitle,
    paragraphs,
    documentCount,
    auditedChars,
    truncated,
  };
}

export function normalizeAuditQuote(value: string) {
  return normalizedWhitespace(value)
    .replace(/^["“”']+|["“”']+$/g, "")
    .slice(0, 320);
}

export function paragraphContainsQuote(paragraph: string, quote: string) {
  const haystack = normalizedWhitespace(paragraph).toLocaleLowerCase();
  const needle = normalizeAuditQuote(quote).toLocaleLowerCase();
  return Boolean(needle) && haystack.includes(needle);
}
