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

const backup = `${target}.before-bibliography-exact-cursor-fix.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

let changes = 0;

// ---------------------------------------------------------------------------
// 1. Make bibliography markup safe to insert at an exact contenteditable caret.
// ---------------------------------------------------------------------------
// A DIV/H2/P bibliography inserted into the middle of a paragraph can be
// normalized/re-parented by Safari/contenteditable. That is what makes it jump
// to the beginning of a page.
//
// The new wrapper uses inline-valid SPAN elements styled as blocks. It can be
// inserted at the exact Range without the browser relocating it.
const oldBibliographyHtmlStart = source.indexOf("  function bibliographyHtml(");
const insertCitationStart = source.indexOf(
  "  async function insertStructuredCitation(",
  oldBibliographyHtmlStart,
);

if (oldBibliographyHtmlStart < 0 || insertCitationStart < 0) {
  console.error("Could not find bibliographyHtml() boundaries.");
  process.exit(1);
}

const newBibliographyHelpers = String.raw`  function bibliographyInnerHtml(
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
  source.slice(0, oldBibliographyHtmlStart) +
  newBibliographyHelpers +
  source.slice(insertCitationStart);

changes += 1;
console.log("Fixed: bibliography markup no longer uses movable block DOM elements.");

// ---------------------------------------------------------------------------
// 2. Replace the full bibliography insertion function.
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

const newBibliographyFunction = String.raw`  async function insertOrRefreshBibliography() {
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

    // Restore the user's exact saved thesis position FIRST.
    // This uses the global-character-offset cursor system installed by the
    // exact cursor fix.
    const target = restoreCitationInsertionPoint();
    if (!target) {
      throw new Error("The bibliography insertion point is unavailable.");
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      throw new Error("The bibliography insertion point could not be restored.");
    }

    const range = selection.getRangeAt(0).cloneRange();

    // Insert a tiny anchor at the live caret before touching an existing
    // bibliography. This means even if an old bibliography is above the
    // current caret, removing it cannot shift our insertion address.
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

    // If a bibliography already exists elsewhere, the Bibliography button
    // now MOVES/refreshes it to the user's current caret instead of silently
    // keeping the old top-of-page location.
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

    // Put the caret immediately after the inserted bibliography.
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
  newBibliographyFunction +
  source.slice(bibliographyEnd);

changes += 1;
console.log("Fixed: Bibliography button now inserts/moves at the exact saved caret.");

// ---------------------------------------------------------------------------
// 3. Style switching must update a bibliography in place, not replace its
// wrapper with the old DIV/H2/P markup.
// ---------------------------------------------------------------------------
const styleStart = source.indexOf("  async function applyCitationStyle(");
if (styleStart < 0) {
  console.error("Could not find applyCitationStyle().");
  process.exit(1);
}

const styleEndCandidates = [
  source.indexOf("\n  async function ", styleStart + 10),
  source.indexOf("\n  function ", styleStart + 10),
].filter((value) => value > styleStart);

const styleEnd = styleEndCandidates.length
  ? Math.min(...styleEndCandidates)
  : source.length;

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
  // Some local variants may already assign innerHTML differently. Don't
  // destructively guess if the exact old replacement block is not present.
  console.log(
    "Note: style-switch bibliography replacement block differed from the expected version; insertion fix was still applied.",
  );
}

// Final safety checks.
if (!source.includes('data-psylattice-bibliography-anchor')) {
  console.error("Safety check failed: bibliography caret anchor is missing.");
  process.exit(1);
}

if (!source.includes(
  'setNotice("Bibliography inserted at the selected cursor position.")',
)) {
  console.error("Safety check failed: new bibliography function is missing.");
  process.exit(1);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Bibliography exact-cursor fix installed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
