export type NormalizedReferenceImport = {
  item_type: string;
  title: string;
  authors: {
    given?: string | null;
    family?: string | null;
    literal?: string | null;
  }[];
  editors?: {
    given?: string | null;
    family?: string | null;
    literal?: string | null;
  }[];
  published_year: number | null;
  container_title: string | null;
  publisher: string | null;
  volume: string | null;
  issue: string | null;
  page: string | null;
  doi: string | null;
  url: string | null;
  isbn: string | null;
  issn: string | null;
  abstract: string | null;
  language: string | null;
  keywords: string[];
  citation_key: string | null;
  raw_csl: Record<string, unknown>;
  source_metadata: Record<string, unknown>;
};

function cleanText(value: string | undefined | null) {
  if (!value) return null;
  const cleaned = value
    .replace(/\s+/g, " ")
    .replace(/\\&/g, "&")
    .replace(/\\%/g, "%")
    .replace(/\\_/g, "_")
    .trim();
  return cleaned || null;
}

export function normalizeDoi(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim()
    .toLowerCase();
  return cleaned || null;
}

function yearFrom(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/\b(1[0-9]{3}|20[0-9]{2}|21[0-9]{2})\b/);
  return match ? Number(match[1]) : null;
}

function stripOuter(value: string) {
  let current = value.trim();
  let changed = true;

  while (changed && current.length >= 2) {
    changed = false;
    if (
      (current.startsWith("{") && current.endsWith("}")) ||
      (current.startsWith('"') && current.endsWith('"'))
    ) {
      current = current.slice(1, -1).trim();
      changed = true;
    }
  }

  return current;
}

function parsePerson(value: string) {
  const cleaned = cleanText(stripOuter(value));
  if (!cleaned) return null;

  if (cleaned.includes(",")) {
    const [family, ...rest] = cleaned.split(",");
    return {
      family: cleanText(family),
      given: cleanText(rest.join(",")),
    };
  }

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { literal: cleaned };
  }

  return {
    given: parts.slice(0, -1).join(" "),
    family: parts[parts.length - 1],
  };
}

function parsePeople(value: string | null | undefined) {
  if (!value) return [];
  return value
    .split(/\s+and\s+/i)
    .map((person) => parsePerson(person))
    .filter(Boolean) as {
      given?: string | null;
      family?: string | null;
      literal?: string | null;
    }[];
}

function bibTypeToItemType(type: string) {
  const map: Record<string, string> = {
    article: "article-journal",
    inproceedings: "paper-conference",
    conference: "paper-conference",
    proceedings: "paper-conference",
    book: "book",
    inbook: "chapter",
    incollection: "chapter",
    phdthesis: "thesis",
    mastersthesis: "thesis",
    techreport: "report",
    report: "report",
    misc: "other",
    online: "webpage",
  };
  return map[type.toLowerCase()] || "other";
}

function splitTopLevelFields(body: string) {
  const fields: string[] = [];
  let start = 0;
  let braces = 0;
  let quoted = false;
  let escaped = false;

  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"' && braces === 0) {
      quoted = !quoted;
      continue;
    }

    if (!quoted) {
      if (char === "{") braces += 1;
      if (char === "}") braces = Math.max(0, braces - 1);

      if (char === "," && braces === 0) {
        fields.push(body.slice(start, i));
        start = i + 1;
      }
    }
  }

  fields.push(body.slice(start));
  return fields.map((field) => field.trim()).filter(Boolean);
}

function readBibEntries(input: string) {
  const entries: { type: string; key: string; body: string }[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const at = input.indexOf("@", cursor);
    if (at < 0) break;

    const header = input.slice(at).match(/^@([A-Za-z]+)\s*([({])/);
    if (!header) {
      cursor = at + 1;
      continue;
    }

    const type = header[1];
    const open = header[2];
    const close = open === "{" ? "}" : ")";
    const openIndex = at + header[0].length - 1;

    let depth = 0;
    let quoted = false;
    let escaped = false;
    let end = -1;

    for (let i = openIndex; i < input.length; i += 1) {
      const char = input[i];

      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        quoted = !quoted;
        continue;
      }

      if (!quoted) {
        if (char === open) depth += 1;
        if (char === close) {
          depth -= 1;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
    }

    if (end < 0) break;

    const inside = input.slice(openIndex + 1, end).trim();
    const comma = inside.indexOf(",");
    if (comma > 0) {
      entries.push({
        type,
        key: inside.slice(0, comma).trim(),
        body: inside.slice(comma + 1).trim(),
      });
    }

    cursor = end + 1;
  }

  return entries;
}

export function parseBibTeX(input: string): NormalizedReferenceImport[] {
  const entries = readBibEntries(input);

  return entries
    .map((entry) => {
      const fields: Record<string, string> = {};

      for (const rawField of splitTopLevelFields(entry.body)) {
        const equals = rawField.indexOf("=");
        if (equals < 0) continue;

        const key = rawField.slice(0, equals).trim().toLowerCase();
        const value = stripOuter(rawField.slice(equals + 1).trim());
        fields[key] = value;
      }

      const title = cleanText(fields.title);
      if (!title) return null;

      const pages = cleanText(fields.pages)?.replace(/--/g, "–") || null;
      const keywords = (fields.keywords || fields.keyword || "")
        .split(/[,;]/)
        .map((value) => cleanText(value))
        .filter(Boolean) as string[];

      const doi = normalizeDoi(fields.doi);
      const containerTitle =
        cleanText(fields.journal) ||
        cleanText(fields.booktitle) ||
        cleanText(fields.school) ||
        null;

      return {
        item_type: bibTypeToItemType(entry.type),
        title,
        authors: parsePeople(fields.author),
        editors: parsePeople(fields.editor),
        published_year: yearFrom(fields.year || fields.date),
        container_title: containerTitle,
        publisher: cleanText(fields.publisher),
        volume: cleanText(fields.volume),
        issue: cleanText(fields.number),
        page: pages,
        doi,
        url: cleanText(fields.url) || (doi ? `https://doi.org/${doi}` : null),
        isbn: cleanText(fields.isbn),
        issn: cleanText(fields.issn),
        abstract: cleanText(fields.abstract),
        language: cleanText(fields.language),
        keywords,
        citation_key: cleanText(entry.key),
        raw_csl: {},
        source_metadata: {
          provider: "bibtex",
          bibtex_type: entry.type,
          raw_fields: fields,
        },
      } satisfies NormalizedReferenceImport;
    })
    .filter(Boolean) as NormalizedReferenceImport[];
}

function risTypeToItemType(type: string | null) {
  const map: Record<string, string> = {
    JOUR: "article-journal",
    JFULL: "article-journal",
    CONF: "paper-conference",
    CPAPER: "paper-conference",
    BOOK: "book",
    CHAP: "chapter",
    THES: "thesis",
    RPRT: "report",
    DATA: "dataset",
    WEB: "webpage",
  };
  return type ? map[type.toUpperCase()] || "other" : "other";
}

function risPeople(values: string[]) {
  return values
    .map((value) => parsePerson(value))
    .filter(Boolean) as {
      given?: string | null;
      family?: string | null;
      literal?: string | null;
    }[];
}

export function parseRIS(input: string): NormalizedReferenceImport[] {
  const records: Record<string, string[]>[] = [];
  let current: Record<string, string[]> | null = null;

  const lines = input.replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const match = line.match(/^([A-Z0-9]{2})\s*-\s?(.*)$/);

    if (!match) {
      if (current && line.trim()) {
        const keys = Object.keys(current);
        const lastKey = keys[keys.length - 1];
        if (lastKey && current[lastKey]?.length) {
          const last = current[lastKey].length - 1;
          current[lastKey][last] = `${current[lastKey][last]} ${line.trim()}`;
        }
      }
      continue;
    }

    const tag = match[1];
    const value = match[2].trim();

    if (tag === "TY") {
      current = { TY: [value] };
      continue;
    }

    if (!current) current = {};

    if (tag === "ER") {
      records.push(current);
      current = null;
      continue;
    }

    current[tag] = [...(current[tag] || []), value];
  }

  if (current && Object.keys(current).length > 0) {
    records.push(current);
  }

  return records
    .map((record) => {
      const first = (...tags: string[]) => {
        for (const tag of tags) {
          const value = record[tag]?.find(Boolean);
          if (value) return value;
        }
        return null;
      };

      const title = cleanText(first("TI", "T1", "CT"));
      if (!title) return null;

      const startPage = cleanText(first("SP"));
      const endPage = cleanText(first("EP"));
      const page =
        startPage && endPage
          ? `${startPage}–${endPage}`
          : startPage || endPage || null;

      const doi = normalizeDoi(first("DO"));
      const serial = cleanText(first("SN"));

      return {
        item_type: risTypeToItemType(first("TY")),
        title,
        authors: risPeople([...(record.AU || []), ...(record.A1 || [])]),
        editors: risPeople(record.ED || []),
        published_year: yearFrom(first("PY", "Y1", "DA")),
        container_title: cleanText(first("JO", "JF", "T2", "JA")),
        publisher: cleanText(first("PB")),
        volume: cleanText(first("VL")),
        issue: cleanText(first("IS")),
        page,
        doi,
        url: cleanText(first("UR")) || (doi ? `https://doi.org/${doi}` : null),
        isbn: serial && /-/.test(serial) && serial.replace(/\D/g, "").length >= 10 ? serial : null,
        issn: serial && (!/-/.test(serial) || serial.replace(/\D/g, "").length <= 9) ? serial : null,
        abstract: cleanText(first("AB", "N2")),
        language: cleanText(first("LA")),
        keywords: (record.KW || []).map((value) => value.trim()).filter(Boolean),
        citation_key: cleanText(first("ID")),
        raw_csl: {},
        source_metadata: {
          provider: "ris",
          ris_type: first("TY"),
          raw_fields: record,
        },
      } satisfies NormalizedReferenceImport;
    })
    .filter(Boolean) as NormalizedReferenceImport[];
}

export function detectReferenceFormat(
  fileName: string | null | undefined,
  explicit: string | null | undefined,
  content: string,
) {
  const wanted = explicit?.toLowerCase();
  if (wanted === "bibtex" || wanted === "bib") return "bibtex";
  if (wanted === "ris") return "ris";

  const lowerName = (fileName || "").toLowerCase();
  if (lowerName.endsWith(".bib")) return "bibtex";
  if (lowerName.endsWith(".ris")) return "ris";

  if (/^\s*@\w+\s*[({]/m.test(content)) return "bibtex";
  if (/^\s*TY\s*-\s*/m.test(content)) return "ris";

  return null;
}
