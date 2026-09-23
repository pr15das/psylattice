import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "app/researcher/page.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find app/researcher/page.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes('import ReferenceManager from "@/components/ReferenceManager";')) {
  console.log("Reference Manager navigation patch is already installed.");
  process.exit(0);
}

const backup = `${target}.before-reference-manager-step2.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

function replaceOnce(label, before, after) {
  if (!source.includes(before)) {
    console.error(`Patch stopped: could not find the expected ${label} block.`);
    console.error("Your Research page may differ from the current main branch.");
    console.error("No partial file was written.");
    process.exit(1);
  }
  source = source.replace(before, after);
}

replaceOnce(
  "Reference Manager import",
  'import ResearchWritingWorkspace from "@/components/ResearchWritingWorkspace";',
  'import ResearchWritingWorkspace from "@/components/ResearchWritingWorkspace";\nimport ReferenceManager from "@/components/ReferenceManager";',
);

replaceOnce(
  "Screen type",
  '  | "cognitive"\n  | "writing"',
  '  | "cognitive"\n  | "references"\n  | "writing"',
);

replaceOnce(
  "Research navigation",
  '  { id: "cognitive", label: "Cognitive Lab", group: "Research" },\n  { id: "writing", label: "Thesis Builder", group: "Research" },',
  '  { id: "cognitive", label: "Cognitive Lab", group: "Research" },\n  { id: "references", label: "Reference Manager", group: "Research" },\n  { id: "writing", label: "Thesis Builder", group: "Research" },',
);

replaceOnce(
  "sidebar icon map",
  '  cognitive: BrainCircuit,\n  writing: FileText,',
  '  cognitive: BrainCircuit,\n  references: BookOpen,\n  writing: FileText,',
);

replaceOnce(
  "screen renderer",
  '      case "cognitive":\n        return <CognitiveLab />;\n\n      case "writing":',
  '      case "cognitive":\n        return <CognitiveLab />;\n\n      case "references":\n        return <ReferenceManager />;\n\n      case "writing":',
);

replaceOnce(
  "screen description",
  '    cognitive:\n      "Create reusable cognitive task definitions, start from PsyLattice templates, and prepare versioned tasks for experiments and longitudinal research.",\n    writing:',
  '    cognitive:\n      "Create reusable cognitive task definitions, start from PsyLattice templates, and prepare versioned tasks for experiments and longitudinal research.",\n    references:\n      "Build a global research library, organise papers into collections, verify DOI metadata, and link references across studies without duplicating them.",\n    writing:',
);

fs.writeFileSync(target, source, "utf8");

console.log("Reference Manager navigation installed successfully.");
console.log("Modified: app/researcher/page.tsx");
console.log("Added screen: Reference Manager");
