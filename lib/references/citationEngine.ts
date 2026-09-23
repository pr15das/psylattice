export type CitationStyleId = "apa7" | "ieee" | "vancouver" | "harvard";
export type CitationMode = "parenthetical" | "narrative";

export type CitationAuthor = {
  given?: string | null;
  family?: string | null;
  literal?: string | null;
};

export type CitationReference = {
  id: string;
  item_type: string;
  title: string;
  authors: CitationAuthor[];
  editors?: CitationAuthor[];
  published_year: number | null;
  container_title: string | null;
  publisher: string | null;
  publisher_place?: string | null;
  volume: string | null;
  issue: string | null;
  page: string | null;
  edition?: string | null;
  doi: string | null;
  url: string | null;
};

export type CitationRowLike = {
  reference_ids: string[];
  created_at?: string;
};

export const CITATION_STYLES: {
  id: CitationStyleId;
  label: string;
  description: string;
}[] = [
  {
    id: "apa7",
    label: "APA 7",
    description: "Author-date citations with an APA-style reference list.",
  },
  {
    id: "ieee",
    label: "IEEE",
    description: "Bracketed numeric citations ordered by first appearance.",
  },
  {
    id: "vancouver",
    label: "Vancouver",
    description: "Numeric citations ordered by first appearance.",
  },
  {
    id: "harvard",
    label: "Harvard",
    description: "Author-date citations with a Harvard-style reference list.",
  },
];

function clean(value: string | null | undefined) {
  return (value || "").trim();
}

function authorFamily(author: CitationAuthor) {
  return clean(author.family) || clean(author.literal) || clean(author.given) || "Unknown";
}

function initials(given: string | null | undefined, spaced = true) {
  const parts = clean(given)
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "";

  return parts
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(spaced ? " " : "");
}

function apaAuthor(author: CitationAuthor) {
  if (author.literal && !author.family) return clean(author.literal);
  const family = authorFamily(author);
  const init = initials(author.given, true);
  return init ? `${family}, ${init}` : family;
}

function numericAuthor(author: CitationAuthor) {
  if (author.literal && !author.family) return clean(author.literal);
  const family = authorFamily(author);
  const init = initials(author.given, false).replaceAll(".", "");
  return init ? `${family} ${init}` : family;
}

function harvardAuthor(author: CitationAuthor) {
  if (author.literal && !author.family) return clean(author.literal);
  const family = authorFamily(author);
  const init = initials(author.given, false);
  return init ? `${family}, ${init}` : family;
}

function joinApaAuthors(authors: CitationAuthor[]) {
  const values = authors.map(apaAuthor).filter(Boolean);
  if (!values.length) return "Unknown author";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]}, & ${values[1]}`;
  if (values.length <= 20) {
    return `${values.slice(0, -1).join(", ")}, & ${values.at(-1)}`;
  }
  return `${values.slice(0, 19).join(", ")}, … ${values.at(-1)}`;
}

function joinNumericAuthors(authors: CitationAuthor[], max = 6) {
  const values = authors.map(numericAuthor).filter(Boolean);
  if (!values.length) return "Unknown author";
  if (values.length <= max) return values.join(", ");
  return `${values.slice(0, max).join(", ")}, et al.`;
}

function joinHarvardAuthors(authors: CitationAuthor[]) {
  const values = authors.map(harvardAuthor).filter(Boolean);
  if (!values.length) return "Unknown author";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  if (values.length === 3) return `${values[0]}, ${values[1]} and ${values[2]}`;
  return `${values[0]} et al.`;
}

function inTextAuthorApa(reference: CitationReference, narrative: boolean) {
  const authors = reference.authors || [];
  if (!authors.length) return shortTitle(reference.title);

  if (authors.length === 1) return authorFamily(authors[0]);
  if (authors.length === 2) {
    const conjunction = narrative ? " and " : " & ";
    return `${authorFamily(authors[0])}${conjunction}${authorFamily(authors[1])}`;
  }

  return `${authorFamily(authors[0])} et al.`;
}

function inTextAuthorHarvard(reference: CitationReference) {
  const authors = reference.authors || [];
  if (!authors.length) return shortTitle(reference.title);
  if (authors.length === 1) return authorFamily(authors[0]);
  if (authors.length === 2) return `${authorFamily(authors[0])} and ${authorFamily(authors[1])}`;
  return `${authorFamily(authors[0])} et al.`;
}

function shortTitle(title: string) {
  const cleaned = clean(title);
  if (!cleaned) return "Untitled";
  const words = cleaned.split(/\s+/);
  return words.length > 5 ? `${words.slice(0, 5).join(" ")}…` : cleaned;
}

function year(reference: CitationReference) {
  return reference.published_year ? String(reference.published_year) : "n.d.";
}

function locatorText(locator?: string | null, locatorLabel?: string | null) {
  const value = clean(locator);
  if (!value) return "";
  const label = clean(locatorLabel) || "p.";
  return `${label} ${value}`;
}

export function buildCitationNumberMap(rows: CitationRowLike[]) {
  const map = new Map<string, number>();
  let next = 1;

  for (const row of rows) {
    for (const referenceId of row.reference_ids || []) {
      if (!map.has(referenceId)) {
        map.set(referenceId, next);
        next += 1;
      }
    }
  }

  return map;
}

function ensureNumbers(
  references: CitationReference[],
  numberMap?: Map<string, number>,
) {
  const next = new Map(numberMap || []);
  let number = Math.max(0, ...Array.from(next.values())) + 1;

  for (const reference of references) {
    if (!next.has(reference.id)) {
      next.set(reference.id, number);
      number += 1;
    }
  }

  return next;
}

export function formatCitationText({
  style,
  references,
  mode = "parenthetical",
  locator,
  locatorLabel,
  prefix,
  suffix,
  numberMap,
}: {
  style: CitationStyleId;
  references: CitationReference[];
  mode?: CitationMode;
  locator?: string | null;
  locatorLabel?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  numberMap?: Map<string, number>;
}) {
  const refs = references.filter(Boolean);
  if (!refs.length) return "";

  const prefixText = clean(prefix);
  const suffixText = clean(suffix);
  const locatorValue = locatorText(locator, locatorLabel);

  let core = "";

  if (style === "apa7") {
    if (mode === "narrative" && refs.length === 1) {
      const reference = refs[0];
      core = `${inTextAuthorApa(reference, true)} (${year(reference)}${locatorValue ? `, ${locatorValue}` : ""})`;
    } else {
      const parts = refs.map(
        (reference) => `${inTextAuthorApa(reference, false)}, ${year(reference)}`,
      );
      core = `(${parts.join("; ")}${locatorValue ? `, ${locatorValue}` : ""})`;
    }
  } else if (style === "harvard") {
    if (mode === "narrative" && refs.length === 1) {
      const reference = refs[0];
      core = `${inTextAuthorHarvard(reference)} (${year(reference)}${locatorValue ? `, ${locatorValue}` : ""})`;
    } else {
      const parts = refs.map(
        (reference) => `${inTextAuthorHarvard(reference)} ${year(reference)}`,
      );
      core = `(${parts.join("; ")}${locatorValue ? `, ${locatorValue}` : ""})`;
    }
  } else {
    const numbers = ensureNumbers(refs, numberMap);
    const values = refs
      .map((reference) => numbers.get(reference.id))
      .filter((value): value is number => typeof value === "number");

    if (style === "ieee") {
      core = values.map((value) => `[${value}]`).join(", ");
      if (locatorValue) core = `${core}, ${locatorValue}`;
    } else {
      core = `(${values.join(",")})`;
      if (locatorValue) core = `${core} ${locatorValue}`;
    }
  }

  return [prefixText, core, suffixText].filter(Boolean).join(" ");
}

function doiUrl(reference: CitationReference) {
  const doi = clean(reference.doi)
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "");

  return doi ? `https://doi.org/${doi}` : clean(reference.url);
}

function pageRange(reference: CitationReference) {
  return clean(reference.page);
}

function journalDetailsApa(reference: CitationReference) {
  const journal = clean(reference.container_title);
  const volume = clean(reference.volume);
  const issue = clean(reference.issue);
  const pages = pageRange(reference);

  const journalAndVolume = [journal, volume].filter(Boolean).join(", ");
  const issueText = issue ? `(${issue})` : "";
  const pageText = pages ? `, ${pages}` : "";

  return `${journalAndVolume}${issueText}${pageText}`.trim();
}

function journalDetailsNumeric(reference: CitationReference) {
  const journal = clean(reference.container_title);
  const yearValue = reference.published_year ? String(reference.published_year) : "";
  const volume = clean(reference.volume);
  const issue = clean(reference.issue);
  const pages = pageRange(reference);

  let output = journal;
  if (yearValue) output += `${output ? ". " : ""}${yearValue}`;
  if (volume) output += `;${volume}`;
  if (issue) output += `(${issue})`;
  if (pages) output += `:${pages}`;
  return output;
}

export function formatBibliographyEntryText(
  style: CitationStyleId,
  reference: CitationReference,
  numberMap?: Map<string, number>,
) {
  const title = clean(reference.title) || "Untitled";
  const source = clean(reference.container_title);
  const publisher = clean(reference.publisher);
  const url = doiUrl(reference);

  if (style === "apa7") {
    const authors = joinApaAuthors(reference.authors || []);
    const details = journalDetailsApa(reference);
    const parts = [
      `${authors} (${year(reference)}).`,
      `${title}.`,
      details ? `${details}.` : "",
      publisher && !source ? `${publisher}.` : "",
      url,
    ].filter(Boolean);
    return parts.join(" ");
  }

  if (style === "harvard") {
    const authors = joinHarvardAuthors(reference.authors || []);
    const volume = clean(reference.volume);
    const issue = clean(reference.issue);
    const pages = pageRange(reference);

    const sourceBits = [
      source ? `'${title}', ${source}` : `'${title}'`,
      volume ? `vol. ${volume}` : "",
      issue ? `no. ${issue}` : "",
      pages ? `pp. ${pages}` : "",
    ].filter(Boolean);

    const parts = [
      `${authors} (${year(reference)})`,
      sourceBits.join(", ") + ".",
      publisher && !source ? `${publisher}.` : "",
      url,
    ].filter(Boolean);

    return parts.join(" ");
  }

  const numbers = ensureNumbers([reference], numberMap);
  const number = numbers.get(reference.id) || 1;
  const authors = joinNumericAuthors(reference.authors || []);
  const details = journalDetailsNumeric(reference);

  if (style === "ieee") {
    const parts = [
      `[${number}]`,
      authors ? `${authors},` : "",
      `"${title},"`,
      details ? `${details}.` : "",
      publisher && !source ? `${publisher}.` : "",
      url,
    ].filter(Boolean);
    return parts.join(" ");
  }

  const parts = [
    `${number}.`,
    authors ? `${authors}.` : "",
    `${title}.`,
    details ? `${details}.` : "",
    publisher && !source ? `${publisher}.` : "",
    url,
  ].filter(Boolean);
  return parts.join(" ");
}

export function formatBibliographyEntries({
  style,
  references,
  numberMap,
}: {
  style: CitationStyleId;
  references: CitationReference[];
  numberMap?: Map<string, number>;
}) {
  const unique = Array.from(
    new Map(references.map((reference) => [reference.id, reference])).values(),
  );

  if (style === "apa7" || style === "harvard") {
    unique.sort((a, b) => {
      const aName = authorFamily(a.authors?.[0] || {});
      const bName = authorFamily(b.authors?.[0] || {});
      return aName.localeCompare(bName) || a.title.localeCompare(b.title);
    });
  } else {
    const numbers = ensureNumbers(unique, numberMap);
    unique.sort(
      (a, b) =>
        (numbers.get(a.id) || Number.MAX_SAFE_INTEGER) -
        (numbers.get(b.id) || Number.MAX_SAFE_INTEGER),
    );
  }

  return unique.map((reference) => ({
    reference,
    text: formatBibliographyEntryText(style, reference, numberMap),
  }));
}

export function defaultCitationStyleForPaperFormat(
  formatStyle: string | null | undefined,
): CitationStyleId {
  if (formatStyle === "ieee_conference") return "ieee";
  if (formatStyle === "apa7_student" || formatStyle === "apa7_professional") {
    return "apa7";
  }
  return "apa7";
}
