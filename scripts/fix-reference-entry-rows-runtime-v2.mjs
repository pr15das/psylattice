import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (!source.includes("referenceEntryRows")) {
  console.log("No referenceEntryRows usage was found. Nothing to repair.");
  process.exit(0);
}

const backup = `${target}.before-referenceEntryRows-runtime-fix-v2.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

function functionBlock(name) {
  const startNeedle = `  async function ${name}(`;
  const start = source.indexOf(startNeedle);

  if (start < 0) {
    return null;
  }

  const nextFunction = source.indexOf("\n  async function ", start + startNeedle.length);
  const nextPlainFunction = source.indexOf("\n  function ", start + startNeedle.length);

  const candidates = [nextFunction, nextPlainFunction].filter((value) => value >= 0);
  const end = candidates.length ? Math.min(...candidates) : source.length;

  return {
    start,
    end,
    text: source.slice(start, end),
  };
}

let changes = 0;

function ensureReferenceEntryRows(name) {
  const block = functionBlock(name);

  if (!block) {
    console.log(`Skipped: ${name} was not found.`);
    return;
  }

  if (!block.text.includes("referenceEntryRows")) {
    console.log(`OK: ${name} does not use referenceEntryRows.`);
    return;
  }

  if (
    block.text.includes(
      "const referenceEntryRows = await loadDocumentReferenceEntryRows();",
    )
  ) {
    console.log(`OK: ${name} already declares referenceEntryRows.`);
    return;
  }

  const citationRowsNeedle = "    const rows = await loadDocumentCitationRows();";
  const namedCitationRowsNeedle =
    "    const citationRows = await loadDocumentCitationRows();";

  let nextBlock = block.text;

  if (nextBlock.includes(citationRowsNeedle)) {
    nextBlock = nextBlock.replace(
      citationRowsNeedle,
      `${citationRowsNeedle}
    const referenceEntryRows = await loadDocumentReferenceEntryRows();`,
    );
  } else if (nextBlock.includes(namedCitationRowsNeedle)) {
    nextBlock = nextBlock.replace(
      namedCitationRowsNeedle,
      `${namedCitationRowsNeedle}
    const referenceEntryRows = await loadDocumentReferenceEntryRows();`,
    );
  } else {
    console.error(
      `Could not safely repair ${name}: no citation-row load anchor was found.`,
    );
    process.exit(1);
  }

  source =
    source.slice(0, block.start) +
    nextBlock +
    source.slice(block.end);

  changes += 1;
  console.log(`Fixed: ${name} now declares referenceEntryRows.`);
}

// The previous Step 4B.1 patch used a broad text replacement.
// It could add `referenceEntryRows.map(...)` to the first citation number-map,
// which is insertStructuredCitation(), without declaring referenceEntryRows there.
// This is the exact source of:
//   Can't find variable: referenceEntryRows
//
// Repair every citation-related function that may legitimately use it.
ensureReferenceEntryRows("insertStructuredCitation");
ensureReferenceEntryRows("insertStructuredReferenceEntries");
ensureReferenceEntryRows("insertOrRefreshBibliography");
ensureReferenceEntryRows("applyCitationStyle");

// Final safety scan: inspect all async function blocks that still contain
// referenceEntryRows and fail rather than leaving a hidden runtime error.
const asyncFunctionRegex = /^  async function ([A-Za-z0-9_]+)\(/gm;
const functionNames = [];
let match;

while ((match = asyncFunctionRegex.exec(source)) !== null) {
  functionNames.push(match[1]);
}

const unsafe = [];

for (const name of functionNames) {
  const block = functionBlock(name);
  if (!block) continue;

  if (
    block.text.includes("referenceEntryRows") &&
    !block.text.includes(
      "const referenceEntryRows = await loadDocumentReferenceEntryRows();",
    )
  ) {
    unsafe.push(name);
  }
}

if (unsafe.length) {
  console.error("");
  console.error(
    `Safety check failed. Undefined referenceEntryRows may remain in: ${unsafe.join(", ")}`,
  );
  console.error("No repaired file was written.");
  process.exit(1);
}

if (changes === 0) {
  console.log("");
  console.log("All referenceEntryRows declarations are already correct.");
  process.exit(0);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Runtime repair completed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
console.log(
  'Fixed error: "Can\\'t find variable: referenceEntryRows"',
);
