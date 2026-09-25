import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/PsyLatticeCopilot.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/PsyLatticeCopilot.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const marker = "psylattice.ai-environment-three-button-proportions.v3.70-20-10";
if (source.includes(marker)) {
  console.log("70/20/10 proportions are already installed.");
  process.exit(0);
}

const backup = `${target}.before-ai-environment-three-button-proportions-v3.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

const candidates = [
  'className="grid grid-cols-[9fr_10fr] gap-2 pb-2"',
  'className="grid grid-cols-2 gap-2 pb-2"',
];

let found = "";
for (const candidate of candidates) {
  if (source.includes(candidate)) {
    found = candidate;
    break;
  }
}

if (!found) {
  console.error(
    "Could not find the current model/environment row proportions. No file was written.",
  );
  process.exit(1);
}

// Parent split is 70 : 30.
// Inside the 30% right section, the selector component uses 2 : 1,
// producing final widths of approximately 70 : 20 : 10.
source = source.replace(
  found,
  `className="grid grid-cols-[7fr_3fr] gap-2 pb-2" data-layout="${marker}"`,
);

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("70/20/10 AI header proportions installed successfully.");
console.log("Final widths: AI Model 70% · Environment 20% · Manage 10%.");
