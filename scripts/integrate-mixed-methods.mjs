import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, "app", "researcher", "page.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find app/researcher/page.tsx");
  process.exit(1);
}

const original = fs.readFileSync(target, "utf8");
let source = original;

function fail(message) {
  console.error(`Mixed Methods integration stopped: ${message}`);
  console.error("No file was changed.");
  process.exit(1);
}

function replaceOnce(anchor, replacement, label) {
  if (!source.includes(anchor)) {
    fail(`Could not find ${label}.`);
  }
  source = source.replace(anchor, replacement);
}

// 1) Import MixedMethodsLab.
if (!source.includes('from "@/components/MixedMethodsLab"')) {
  const importAnchors = [
    'import QualitativeResearchLab from "@/components/QualitativeResearchLab";',
    'import AnalysisLab from "@/components/AnalysisLab";',
  ];
  const anchor = importAnchors.find((value) => source.includes(value));

  if (!anchor) {
    fail("the QualitativeResearchLab / AnalysisLab import anchor");
  }

  source = source.replace(
    anchor,
    `${anchor}\nimport MixedMethodsLab from "@/components/MixedMethodsLab";`,
  );
}

// 2) Add mixed to Screen union.
if (!/(?:\|\s*"mixed"|["']mixed["']\s*\|)/.test(source)) {
  replaceOnce(
    '  | "analysis"',
    '  | "analysis"\n  | "mixed"',
    'the Screen union analysis entry',
  );
}

// 3) Add navigation item.
if (!source.includes('{ id: "mixed", label: "Mixed Methods"')) {
  replaceOnce(
    '  { id: "analysis", label: "Analysis Lab", group: "Data" },',
    '  { id: "analysis", label: "Analysis Lab", group: "Data" },\n  { id: "mixed", label: "Mixed Methods", group: "Data" },',
    'the Analysis Lab navigation entry',
  );
}

// 4) Add sidebar icon.
if (!/\bmixed:\s*Workflow,/.test(source)) {
  replaceOnce(
    '  analysis: BarChart3,',
    '  analysis: BarChart3,\n  mixed: Workflow,',
    'the Analysis Lab sidebar icon entry',
  );
}

// 5) Add the actual render branch to renderScreen().
// The researcher workspace uses a switch(screen), not a ternary chain.
if (!/case\s+["']mixed["']\s*:/.test(source)) {
  const switchAnchor =
`      case "analysis":
        return <AnalysisLabWorkspace changeScreen={setScreen} />;`;

  if (source.includes(switchAnchor)) {
    source = source.replace(
      switchAnchor,
`${switchAnchor}

      case "mixed":
        return <MixedMethodsLab />;`,
    );
  } else {
    // Slightly more tolerant fallback for formatting differences.
    const analysisCasePattern =
      /(\s*case\s+["']analysis["']\s*:\s*\n\s*return\s+<AnalysisLabWorkspace\b[^;]*\/>\s*;)/;

    const match = source.match(analysisCasePattern);
    if (!match) {
      fail('the `case "analysis"` branch inside renderScreen()');
    }

    source = source.replace(
      match[1],
      `${match[1]}

      case "mixed":
        return <MixedMethodsLab />;`,
    );
  }
}

// 6) Add the production description.
// `descriptions` is Record<Screen, string>, so this entry is required for type safety.
if (!/^\s*mixed:\s*["'`]/m.test(source)) {
  const descriptionAnchor =
`    analysis:
      "Run deterministic statistical analyses on PsyLattice study data or an external dataset in a dedicated analysis workspace.",`;

  if (source.includes(descriptionAnchor)) {
    source = source.replace(
      descriptionAnchor,
`${descriptionAnchor}
    mixed:
      "Integrate participant-level quantitative results with qualitative cases, themes, framework summaries and coded evidence.",`,
    );
  } else {
    // Formatting-tolerant fallback inside the descriptions object.
    const descriptionPattern =
      /(\s*analysis:\s*\n?\s*["'`]Run deterministic statistical analyses[\s\S]*?workspace\.["'`],)/;

    const match = source.match(descriptionPattern);
    if (!match) {
      fail("the Analysis Lab description entry");
    }

    source = source.replace(
      match[1],
      `${match[1]}
    mixed:
      "Integrate participant-level quantitative results with qualitative cases, themes, framework summaries and coded evidence.",`,
    );
  }
}

if (source === original) {
  console.log("Mixed Methods is already fully integrated. No changes needed.");
  process.exit(0);
}

// Sanity checks BEFORE writing.
const requiredChecks = [
  ['MixedMethodsLab import', source.includes('from "@/components/MixedMethodsLab"')],
  ['Screen union', /(?:\|\s*"mixed"|["']mixed["']\s*\|)/.test(source)],
  ['navigation', source.includes('{ id: "mixed", label: "Mixed Methods"')],
  ['sidebar icon', /\bmixed:\s*Workflow,/.test(source)],
  ['renderScreen switch case', /case\s+["']mixed["']\s*:/.test(source)],
  ['description', /^\s*mixed:\s*["'`]/m.test(source)],
];

const missing = requiredChecks.filter(([, ok]) => !ok).map(([name]) => name);
if (missing.length) {
  fail(`sanity check failed for: ${missing.join(", ")}`);
}

const backup = `${target}.before-mixed-methods`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
}

fs.writeFileSync(target, source, "utf8");

console.log("Mixed Methods integrated successfully.");
console.log("Updated: app/researcher/page.tsx");
console.log("Backup: app/researcher/page.tsx.before-mixed-methods");
console.log("Next: npm run build");
