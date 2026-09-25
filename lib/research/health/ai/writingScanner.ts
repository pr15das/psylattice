import type {
  ThesisAuditParagraph,
  ThesisWritingAuditContext,
} from "@/lib/research/health/ai/types";

const MAX_AUDIT_CHARS = 95_000;
const MAX_PARAGRAPHS = 170;
const MAX_PARAGRAPH_CHARS = 1_900;

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ");
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isLikelyNonProse(value: string) {
  const text = normalize(value);
  if (!text) return true;
  if (/^(references|bibliography|contents|appendix|table|figure)\b/i.test(text))
    return true;
  if (/^(https?:\/\/|doi:|10\.\d{4,9}\/)/i.test(text)) return true;
  if (text.length < 55) return true;
  return false;
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
    const text = normalize(buffer.join(" "));
    if (text) {
      paragraphs.push({
        paragraphIndex,
        lineStart,
        lineEnd,
        text,
      });
      paragraphIndex += 1;
    }
    buffer = [];
    lineStart = 0;
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (line.trim()) {
      if (!lineStart) lineStart = lineNumber;
      buffer.push(line.trim());
      return;
    }

    if (buffer.length > 0) flush(lineNumber - 1);
  });

  if (buffer.length > 0) flush(lines.length);
  return paragraphs;
}

export function buildThesisWritingAuditContext(args: {
  studyId: string;
  studyTitle: string;
  studyDesign: string | null;
  documents: Array<{
    id: string;
    title: string;
    content_text: string | null;
  }>;
}): ThesisWritingAuditContext {
  const paragraphs: ThesisAuditParagraph[] = [];
  let documentCount = 0;
  let auditedChars = 0;
  let truncated = false;

  for (const document of args.documents) {
    const raw = cleanText(document.content_text);
    if (!raw.trim()) continue;
    documentCount += 1;

    for (const paragraph of extractParagraphs(raw)) {
      if (isLikelyNonProse(paragraph.text)) continue;

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
    studyDesign: args.studyDesign,
    paragraphs,
    documentCount,
    auditedChars,
    truncated,
  };
}

export function normalizeWritingQuote(value: string) {
  return normalize(value)
    .replace(/^["“”']+|["“”']+$/g, "")
    .slice(0, 360);
}

export function writingParagraphContainsQuote(
  paragraph: string,
  quote: string,
) {
  const haystack = normalize(paragraph).toLocaleLowerCase();
  const needle = normalizeWritingQuote(quote).toLocaleLowerCase();
  return Boolean(needle) && haystack.includes(needle);
}
