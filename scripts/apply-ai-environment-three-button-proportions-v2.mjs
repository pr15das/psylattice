import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/PsyLatticeCopilot.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/PsyLatticeCopilot.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const marker = "psylattice.ai-environment-three-button-proportions.v2";
if (source.includes(marker)) {
  console.log("Three-button proportions v2 are already installed.");
  process.exit(0);
}

const backup = `${target}.before-ai-environment-three-button-proportions-v2.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

const oldGrid = 'className="grid grid-cols-2 gap-2 pb-2"';
const newGrid =
  `className="grid grid-cols-[9fr_10fr] gap-2 pb-2" data-layout="${marker}"`;

if (!source.includes(oldGrid)) {
  console.error(
    "Could not find the current 50/50 model-versus-environment row. No file was written.",
  );
  process.exit(1);
}

source = source.replace(oldGrid, newGrid);

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Three-button proportions v2 installed successfully.");
console.log("Final ratio: AI model 9fr · Environment 6fr · Manage 4fr.");
console.log("Approximate widths: 47% · 32% · 21%.");
