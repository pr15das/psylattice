import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const helperStart = source.indexOf("  function bibliographyInnerHtml(");
const helperEnd = source.indexOf(
  "  async function insertStructuredCitation(",
  helperStart,
);

if (helperStart < 0 || helperEnd < 0) {
  console.error("Could not find the bibliography helper block.");
  console.error("No file was modified.");
  process.exit(1);
}

const backup = `${target}.before-bibliography-build-syntax-fix-v3.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

// The previous bibliography patch accidentally wrote escaped backticks (\`)
// directly into TypeScript source. Turbopack therefore parsed:
//
//     return \`<span ...
//
// as an invalid escape sequence.
//
// Rebuild these two helpers without nested template literals at all.
const replacement = [
  '  function bibliographyInnerHtml(',
  '    entries: ReturnType<typeof formatBibliographyEntries>,',
  '  ) {',
  '    return [',
  '      \'<span data-psylattice-bibliography-title="true" style="display:block;font-weight:700;margin:0 0 0.55em 0;">References</span>\',',
  '      ...entries.map(',
  '        (entry) =>',
  '          \'<span data-psylattice-reference-id="\' +',
  '          escapeHtml(entry.reference.id) +',
  '          \'" style="display:block;margin:0 0 0.45em 0;">\' +',
  '          escapeHtml(entry.text) +',
  '          "</span>",',
  '      ),',
  '    ].join("");',
  '  }',
  '',
  '  function bibliographyHtml(',
  '    entries: ReturnType<typeof formatBibliographyEntries>,',
  '  ) {',
  '    return (',
  '      \'<span data-psylattice-bibliography="true" contenteditable="false" style="display:block;">\' +',
  '      bibliographyInnerHtml(entries) +',
  '      "</span>"',
  '    );',
  '  }',
  '',
].join("\n");

source =
  source.slice(0, helperStart) +
  replacement +
  source.slice(helperEnd);

// Safety checks.
if (source.includes("return \\`<span data-psylattice-bibliography")) {
  console.error("Safety check failed: malformed escaped backtick still remains.");
  process.exit(1);
}

if (!source.includes("function bibliographyInnerHtml(")) {
  console.error("Safety check failed: bibliographyInnerHtml is missing.");
  process.exit(1);
}

if (!source.includes("function bibliographyHtml(")) {
  console.error("Safety check failed: bibliographyHtml is missing.");
  process.exit(1);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Bibliography build syntax fix installed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
console.log("The malformed escaped-backtick bibliography helpers were replaced.");
