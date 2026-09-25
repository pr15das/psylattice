import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");
const helperPath = path.resolve(
  process.cwd(),
  "scripts/citation-cursor-helper-step4b2.txt",
);

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

if (!fs.existsSync(helperPath)) {
  console.error("Could not find scripts/citation-cursor-helper-step4b2.txt");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");
const helper = fs.readFileSync(helperPath, "utf8");

if (!source.includes("<ThesisCitationPanel")) {
  console.error("Step 4B is not installed in ResearchWritingWorkspace.tsx.");
  process.exit(1);
}

const backup = `${target}.before-citation-cursor-ui-fix.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

let changed = 0;

function replaceOnce(label, before, after) {
  if (source.includes(after)) {
    console.log(`Already fixed: ${label}`);
    return;
  }

  if (!source.includes(before)) {
    console.error(`Patch stopped: could not find ${label}.`);
    console.error("No file was written.");
    process.exit(1);
  }

  source = source.replace(before, after);
  changed += 1;
  console.log(`Fixed: ${label}`);
}

// Add robust selection memory before citation functions.
if (!source.includes("function rememberCitationInsertionPoint()")) {
  const anchor = "  async function loadDocumentCitationRows() {";

  if (!source.includes(anchor)) {
    console.error("Patch stopped: citation-function anchor was not found.");
    process.exit(1);
  }

  source = source.replace(anchor, helper + anchor);
  changed += 1;
  console.log("Fixed: persistent Thesis Builder cursor memory");
} else {
  console.log("Already fixed: persistent Thesis Builder cursor memory");
}

// When opening the citation drawer, explicitly preserve the latest editor range.
replaceOnce(
  "Cite toolbar cursor capture",
  `                    onClick={() => {
                      captureFormattingSelection();
                      setCitationPanelOpen(true);
                    }}`,
  `                    onClick={() => {
                      rememberCitationInsertionPoint();
                      captureFormattingSelection();
                      setCitationPanelOpen(true);
                    }}`,
);

// Replace every old insertion target block used by structured citations,
// full references, and bibliography-at-cursor with the robust saved range.
const oldInsertionBlock = `    restoreFormattingSelection();

    const target = editorRef.current || orderedPageElements().at(-1);
    if (!target) throw new Error("The writing cursor could not be restored.");

    target.focus({ preventScroll: true });
    editorRef.current = target;`;

const newInsertionBlock = `    const target = restoreCitationInsertionPoint();
    if (!target) throw new Error("The writing cursor could not be restored.");`;

const occurrences = source.split(oldInsertionBlock).length - 1;
if (occurrences > 0) {
  source = source.split(oldInsertionBlock).join(newInsertionBlock);
  changed += occurrences;
  console.log(
    `Fixed: ${occurrences} citation/reference insertion cursor target(s)`,
  );
} else if (source.includes(newInsertionBlock)) {
  console.log("Already fixed: citation/reference insertion cursor targets");
} else {
  console.error(
    "Patch stopped: could not find the old citation insertion-target block.",
  );
  process.exit(1);
}

// The previous Step 4B.1 patch could accidentally add referenceEntryRows to
// bibliography numbering without declaring it in that function. The screen
// recording shows exactly this Safari runtime error:
// "Can't find variable: referenceEntryRows"
const bibliographyStart = source.indexOf(
  "  async function insertOrRefreshBibliography() {",
);
const bibliographyEnd = source.indexOf(
  "  async function applyCitationStyle(",
  bibliographyStart,
);

if (bibliographyStart >= 0 && bibliographyEnd > bibliographyStart) {
  let block = source.slice(bibliographyStart, bibliographyEnd);

  if (
    block.includes("referenceEntryRows") &&
    !block.includes("const referenceEntryRows =")
  ) {
    const rowsLine = "    const rows = await loadDocumentCitationRows();";

    if (!block.includes(rowsLine)) {
      console.error(
        "Patch stopped: bibliography rows declaration could not be found.",
      );
      process.exit(1);
    }

    block = block.replace(
      rowsLine,
      `${rowsLine}
    const referenceEntryRows = await loadDocumentReferenceEntryRows();`,
    );

    source =
      source.slice(0, bibliographyStart) +
      block +
      source.slice(bibliographyEnd);

    changed += 1;
    console.log(
      "Fixed: Safari runtime error \"Can't find variable: referenceEntryRows\"",
    );
  } else {
    console.log("Already fixed: bibliography referenceEntryRows declaration");
  }
} else {
  console.error("Patch stopped: bibliography function boundaries were not found.");
  process.exit(1);
}

if (changed === 0) {
  console.log("");
  console.log("All Step 4B cursor/runtime fixes are already installed.");
  process.exit(0);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Citation cursor/runtime fix installed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
