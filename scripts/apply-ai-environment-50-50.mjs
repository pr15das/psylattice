import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/PsyLatticeCopilot.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/PsyLatticeCopilot.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const marker = "psylattice.ai-environment-50-50.v1";
if (source.includes(marker)) {
  console.log("50/50 AI + Environment layout is already installed.");
  process.exit(0);
}

const backup = `${target}.before-ai-environment-50-50.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

const candidates = [
  'className="grid grid-cols-[7fr_3fr] gap-2 pb-2"',
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
    "Could not find the current AI model/environment row. No file was written.",
  );
  process.exit(1);
}

source = source.replace(
  found,
  `className="grid grid-cols-2 gap-2 pb-2" data-layout="${marker}"`,
);

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("50/50 AI + Environment header installed successfully.");
console.log("Model selector: 50%");
console.log("Environment selector: 50%");
console.log("Manage is now embedded as a small settings button inside Environment.");
