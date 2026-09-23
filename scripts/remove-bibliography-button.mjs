import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const backup = `${target}.before-remove-bibliography-button.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

let changes = 0;

// Remove the Bibliography callback passed into ThesisCitationPanel.
// This disconnects the bibliography feature from the UI completely.
const propLine =
  '        onInsertBibliography={() => insertOrRefreshBibliography()}\n';

if (source.includes(propLine)) {
  source = source.replace(propLine, "");
  changes += 1;
  console.log("Removed ThesisCitationPanel bibliography callback.");
} else {
  console.log("Bibliography callback was already absent.");
}

// Optional cleanup: the old bibliography function may remain in the file.
// We deliberately leave it untouched so we don't risk destabilising the
// citation/reference insertion paths. With no UI callback, users cannot invoke it.

if (changes > 0) {
  fs.writeFileSync(target, source, "utf8");
  console.log("");
  console.log("Bibliography UI removal installed successfully.");
  console.log("Modified: components/ResearchWritingWorkspace.tsx");
} else {
  console.log("");
  console.log("No ResearchWritingWorkspace changes were needed.");
}
