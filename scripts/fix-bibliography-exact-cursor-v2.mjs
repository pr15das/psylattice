import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (!source.includes("async function insertOrRefreshBibliography()")) {
  console.error("Could not find the Step 4B bibliography function.");
  process.exit(1);
}

if (!source.includes("function restoreCitationInsertionPoint")) {
  console.error(
    "The exact citation-cursor helper is not installed yet. Install the cursor fix first.",
  );
  process.exit(1);
}

const backup = `${target}.before-bibliography-exact-cursor-fix-v2.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

let changes = 0;

// ---------------------------------------------------------------------------
// 1. Make bibliography markup safe for insertion at an exact contenteditable
// caret. Safari may relocate DIV/H2/P blocks when inserted inside a paragraph.
// ---------------------------------------------------------------------------
const bibliographyHtmlStart = source.indexOf("  function bibliographyHtml(");
const citationFunctionStart = source.indexOf(
  "  async function insertStructuredCitation(",
  bibliographyHtmlStart,
);

if (bibliographyHtmlStart < 0 || citationFunctionStart < 0) {
  console.error("Could not find bibliographyHtml() boundaries.");
  process.exit(1);
}

const bibliographyHelpers = String.raw`  function bibliographyInnerHtml(
    entries: ReturnType<typeof formatBibliographyEntries>,
  ) {
    return \`<span data-psylattice-bibliography-title="true" style="display:block;font-weight:700;margin:0 0 0.55em 0;">References</span>\${entries
      .map(
        (entry) =>
          \`<span data-psylattice-reference-id="\${escapeHtml(
            entry.reference.id,
          )}" style="display:block;margin:0 0 0.45em 0;">\${escapeHtml(
            entry.text,
          )}</span>\`,
      )
      .join("")}\`;
  }

  function bibliographyHtml(
    entries: ReturnType<typeof formatBibliographyEntries>,
  ) {
    return \`<span data-psylattice-bibliography="true" contenteditable="false" style="display:block;">\${bibliographyInnerHtml(
      entries,
    )}</span>\`;
  }

`;

source =
  source.slice(0, bibliographyHtmlStart) +
  bibliographyHelpers +
  source.slice(citationFunctionStart);

changes += 1;
console.log("Fixed: bibliography markup now uses contenteditable-safe span blocks.");

// ---------------------------------------------------------------------------
// 2. Replace bibliography insertion with exact saved-caret insertion.
// ---------------------------------------------------------------------------
const bibliographyStart = source.indexOf(
  "  async function insertOrRefreshBibliography() {",
);
const bibliographyEnd = source.indexOf(
  "  async function applyCitationStyle(",
  bibliographyStart,
);

if (bibliographyStart < 0 || bibliographyEnd < 0) {
  console.error("Could not find insertOrRefreshBibliography() boundaries.");
  process.exit(1);
}

const bibliographyFunction = String.raw`  async function insertOrRefreshBibliography() {
    if (!selectedDocument || !userId) {
      throw new Error("Open a Thesis Builder document first.");
    }

    const rows = await loadDocumentCitationRows();
    const referenceEntryRows = await loadDocumentReferenceEntryRows();

    if (!rows.length) {
      throw new Error(
        "This document does not contain any structured citations yet.",
      );
    }

    const orderedIds: string[] = [];
    for (const row of rows) {
      for (const id of (row.reference_ids || []) as string[]) {
        if (!orderedIds.includes(id)) orderedIds.push(id);
      }
    }

    const references = await loadCitationReferences(orderedIds);

    const numberMap = buildCitationNumberMap([
      ...rows.map((row) => ({
        reference_ids: (row.reference_ids || []) as string[],
        created_at: row.created_at,
      })),
      ...referenceEntryRows.map((row) => ({
        reference_ids: (row.reference_ids || []) as string[],
        created_at: row.created_at,
      })),
    ]);

    const entries = formatBibliographyEntries({
      style: citationStyle,
      references,
      numberMap,
    });

    const target = restoreCitationInsertionPoint();
    if (!target) {
      throw new Error("The bibliography insertion point is unavailable.");
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      throw new Error("The bibliography insertion point could not be restored.");
    }

    const range = selection.getRangeAt(0).cloneRange();

    // Pin the user's exact live caret before changing/removing any existing
    // bibliography elsewhere in the document.
    const anchor = document.createElement("span");
    anchor.dataset.psylatticeBibliographyAnchor = "true";
    anchor.textContent = "\u200B";

    range.deleteContents();
    range.insertNode(anchor);

    const existing = orderedPageElements()
      .map((page) =>
        page.querySelector<HTMLElement>(
          '[data-psylattice-bibliography="true"]',
        ),
      )
      .find(Boolean);

    if (existing && !existing.contains(anchor)) {
      existing.remove();
    }

    const holder = document.createElement("div");
    holder.innerHTML = bibliographyHtml(entries);
    const bibliography = holder.firstElementChild as HTMLElement | null;

    if (!bibliography) {
      anchor.remove();
      throw new Error("PsyLattice could not create the bibliography block.");
    }

    anchor.replaceWith(bibliography);

    const after = document.createRange();
    after.setStartAfter(bibliography);
    after.collapse(true);

    selection.removeAllRanges();
    selection.addRange(after);

    editorRef.current = target;
    citationCaretOffsetRef.current = captureCaretOffset();

    captureEditor(undefined, true);
    setNotice("Bibliography inserted at the selected cursor position.");
  }

`;

source =
  source.slice(0, bibliographyStart) +
  bibliographyFunction +
  source.slice(bibliographyEnd);

changes += 1;
console.log("Fixed: Bibliography now inserts/moves at the exact saved caret.");

// ---------------------------------------------------------------------------
// 3. Style changes should update the existing bibliography in place.
// ---------------------------------------------------------------------------
const styleStart = source.indexOf("  async function applyCitationStyle(");
if (styleStart < 0) {
  console.error("Could not find applyCitationStyle().");
  process.exit(1);
}

const nextAsync = source.indexOf("\n  async function ", styleStart + 10);
const nextPlain = source.indexOf("\n  function ", styleStart + 10);
const styleEnds = [nextAsync, nextPlain].filter((value) => value > styleStart);
const styleEnd = styleEnds.length ? Math.min(...styleEnds) : source.length;

let styleBlock = source.slice(styleStart, styleEnd);

const oldStyleUpdate = `      const container = document.createElement("div");
      container.innerHTML = bibliographyHtml(entries);
      const next = container.firstElementChild;
      if (next) bibliography.replaceWith(next);`;

const newStyleUpdate = `      bibliography.innerHTML = bibliographyInnerHtml(entries);`;

if (styleBlock.includes(oldStyleUpdate)) {
  styleBlock = styleBlock.replace(oldStyleUpdate, newStyleUpdate);
  source =
    source.slice(0, styleStart) +
    styleBlock +
    source.slice(styleEnd);
  changes += 1;
  console.log("Fixed: citation-style switching updates bibliography in place.");
} else if (styleBlock.includes(newStyleUpdate)) {
  console.log("OK: style switching already updates bibliography in place.");
} else {
  console.log(
    "Note: local style-switch block differs from the expected version; insertion fix is still safe to apply.",
  );
}

// Correct safety checks.
// `anchor.dataset.psylatticeBibliographyAnchor = "true"` serializes to
// data-psylattice-bibliography-anchor in the DOM, but the SOURCE CODE contains
// the camelCase dataset property, not the kebab-case attribute string.
if (!source.includes("anchor.dataset.psylatticeBibliographyAnchor")) {
  console.error("Safety check failed: bibliography caret anchor logic is missing.");
  process.exit(1);
}

if (!source.includes(
  'setNotice("Bibliography inserted at the selected cursor position.")',
)) {
  console.error("Safety check failed: exact-cursor bibliography function is missing.");
  process.exit(1);
}

if (!source.includes("bibliographyInnerHtml")) {
  console.error("Safety check failed: safe bibliography markup helper is missing.");
  process.exit(1);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Bibliography exact-cursor fix v2 installed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
console.log(`Applied ${changes} targeted change(s).`);
