import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");
const helperPath = path.resolve(
  process.cwd(),
  "scripts/citation-exact-cursor-helper-v2.txt",
);

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

if (!fs.existsSync(helperPath)) {
  console.error("Could not find scripts/citation-exact-cursor-helper-v2.txt");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");
const helper = fs.readFileSync(helperPath, "utf8");

if (!source.includes("<ThesisCitationPanel")) {
  console.error("The Step 4B citation system is not installed.");
  process.exit(1);
}

const backup = `${target}.before-citation-exact-cursor-fix-v2.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

const startMarkers = [
  "  const citationSelectionRef = useRef<Range | null>(null);",
  "  const citationCaretOffsetRef = useRef<number | null>(null);",
];

let start = -1;
for (const marker of startMarkers) {
  start = source.indexOf(marker);
  if (start >= 0) break;
}

const endMarker = "  async function loadDocumentCitationRows() {";
const end = source.indexOf(endMarker);

if (start < 0) {
  console.error("Could not find the existing citation cursor helper.");
  console.error("No file was written.");
  process.exit(1);
}

if (end < 0 || end <= start) {
  console.error("Could not find the citation-function boundary.");
  console.error("No file was written.");
  process.exit(1);
}

source = source.slice(0, start) + helper + source.slice(end);

// Make sure the Cite button explicitly preserves the current caret before
// opening the drawer. Older Step 4B builds may already contain this.
const oldClick = `                    onClick={() => {
                      captureFormattingSelection();
                      setCitationPanelOpen(true);
                    }}`;

const newClick = `                    onClick={() => {
                      rememberCitationInsertionPoint();
                      captureFormattingSelection();
                      setCitationPanelOpen(true);
                    }}`;

if (source.includes(oldClick)) {
  source = source.replace(oldClick, newClick);
  console.log("Updated Cite toolbar caret capture.");
} else if (source.includes(newClick)) {
  console.log("Cite toolbar caret capture already present.");
} else {
  console.log(
    "Cite toolbar click block differs from the expected version; cursor helper was still replaced.",
  );
}

// Safety checks.
if (source.includes("citationSelectionRef")) {
  console.error(
    "Safety check failed: the old DOM Range citationSelectionRef helper still exists.",
  );
  process.exit(1);
}

if (!source.includes("citationCaretOffsetRef")) {
  console.error("Safety check failed: numeric caret memory was not installed.");
  process.exit(1);
}

if (!source.includes("function restoreCitationInsertionPoint(): HTMLDivElement | null")) {
  console.error("Safety check failed: exact-cursor restore helper is missing.");
  process.exit(1);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Exact citation cursor fix v2 installed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
console.log("The old cloned-DOM-Range approach has been removed.");
console.log("PsyLattice now remembers a stable global text offset in the paper.");
