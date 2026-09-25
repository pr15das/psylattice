import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/PsyLatticeCopilot.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/PsyLatticeCopilot.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");
const backup = `${target}.before-ts17001-hotfix.bak`;

if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

const rowRegex =
  /<div className="grid grid-cols-2 gap-2 pb-2"(?:\s+data-layout="[^"]*")+>/;

const match = source.match(rowRegex);

if (!match) {
  console.error(
    "Could not find the AI Model / Environment 50-50 header row with duplicated data-layout attributes. No file was written.",
  );
  process.exit(1);
}

const replacement =
  '<div className="grid grid-cols-2 gap-2 pb-2" data-layout="psylattice.ai-environment-50-50.v1">';

source = source.replace(rowRegex, replacement);

const remainingDuplicate = source.match(
  /<[^>]*\bdata-layout="[^"]*"[^>]*\bdata-layout="[^"]*"[^>]*>/,
);

if (remainingDuplicate) {
  console.error(
    "A JSX element still contains duplicate data-layout attributes. No file was written.",
  );
  process.exit(1);
}

fs.writeFileSync(target, source, "utf8");

console.log("Fixed components/PsyLatticeCopilot.tsx");
console.log("Removed duplicate JSX data-layout attributes.");
console.log("Kept final layout marker: psylattice.ai-environment-50-50.v1");
