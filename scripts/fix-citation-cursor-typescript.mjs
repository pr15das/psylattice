import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const backup = `${target}.before-citation-cursor-typescript-fix.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

let changes = 0;

// The Thesis Builder editor ref is HTMLDivElement.
// The cursor helper introduced closest<HTMLElement>(), which is broader than
// HTMLDivElement and TypeScript correctly rejected assignments back to editorRef.current.
//
// Narrow every research-paper-editor closest() lookup to HTMLDivElement.
const oldClosest = 'closest<HTMLElement>(".research-paper-editor")';
const newClosest = 'closest<HTMLDivElement>(".research-paper-editor")';

const count = source.split(oldClosest).length - 1;

if (count > 0) {
  source = source.split(oldClosest).join(newClosest);
  changes += count;
  console.log(`Fixed ${count} editor target type annotation(s).`);
} else {
  console.log("No HTMLElement editor target annotations found.");
}

// Also make the helper return type explicit if the function is present.
const oldSignature = '  function restoreCitationInsertionPoint() {';
const newSignature =
  '  function restoreCitationInsertionPoint(): HTMLDivElement | null {';

if (source.includes(oldSignature)) {
  source = source.replace(oldSignature, newSignature);
  changes += 1;
  console.log("Added explicit HTMLDivElement return type.");
} else if (source.includes(newSignature)) {
  console.log("Return type already fixed.");
}

// Safety check: if our helper still has an HTMLElement closest for the editor,
// refuse to write rather than leave the same build error behind.
if (source.includes(oldClosest)) {
  console.error("Safety check failed: an HTMLElement editor target still remains.");
  process.exit(1);
}

if (changes === 0) {
  console.log("");
  console.log("The citation cursor TypeScript fix appears to be already installed.");
  process.exit(0);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Citation cursor TypeScript fix installed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
