import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/PsyLatticeCopilot.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/PsyLatticeCopilot.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const marker = "psylattice.ai-environment-three-button-row.v1";
if (source.includes(marker)) {
  console.log("Three-button AI header row is already installed.");
  process.exit(0);
}

const backup = `${target}.before-ai-environment-three-button-row.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

// The Step 5A UI currently renders the environment selector ABOVE the model
// selector. Remove that wrapper first.
const environmentBlock = `              <div className="pb-2">
                <ResearchAiEnvironmentSelector
                  activeEnvironmentId={activeEnvironment?.id || ""}
                  preferredStudyId={preferredStudyId}
                  onChange={setActiveEnvironment}
                />
              </div>

`;

if (!source.includes(environmentBlock)) {
  console.error(
    "Could not find the current Step 5A environment-selector wrapper. No file was written.",
  );
  process.exit(1);
}

source = source.replace(environmentBlock, "");

// Convert the existing model-selector wrapper into the left half of a two-column row.
// Right half will contain the Environment + Manage component.
const modelWrapper = `              <div className="relative pb-2">
                <button
                  type="button"
                  onClick={() => setModelOpen((value) => !value)}`;

const rowWrapper = `              {/* ${marker} */}
              <div className="grid grid-cols-2 gap-2 pb-2">
                <div className="relative min-w-0">
                  <button
                  type="button"
                  onClick={() => setModelOpen((value) => !value)}`;

if (!source.includes(modelWrapper)) {
  console.error(
    "Could not find the current AI model selector. No file was written.",
  );
  process.exit(1);
}

source = source.replace(modelWrapper, rowWrapper);

// Make the model button visually balanced with the new 52px dark environment button.
source = source.replace(
  `className="research-assistant-model-switcher group/model relative flex min-h-[56px] w-full items-center gap-3 rounded-2xl`,
  `className="research-assistant-model-switcher group/model relative flex h-[52px] w-full items-center gap-2.5 rounded-xl`,
);

// Slightly tighten the model button padding now that it shares one row.
source = source.replace(
  `px-3.5 py-2.5 text-left shadow-[0_10px_28px`,
  `px-3 py-2 text-left shadow-[0_10px_28px`,
);

// Close the left model column, add the right environment half, then close the grid.
// This exact boundary is immediately before the tab navigation.
const navBoundary = `              </div>

              <nav className="flex border-b border-slate-200">`;

const newBoundary = `                </div>

                <div className="min-w-0">
                  <ResearchAiEnvironmentSelector
                    activeEnvironmentId={activeEnvironment?.id || ""}
                    preferredStudyId={preferredStudyId}
                    onChange={setActiveEnvironment}
                  />
                </div>
              </div>

              <nav className="flex border-b border-slate-200">`;

if (!source.includes(navBoundary)) {
  console.error(
    "Could not find the model-selector closing boundary. No file was written.",
  );
  process.exit(1);
}

source = source.replace(navBoundary, newBoundary);

// Safety checks.
for (const required of [
  marker,
  'className="grid grid-cols-2 gap-2 pb-2"',
  "<ResearchAiEnvironmentSelector",
  'h-[52px]',
]) {
  if (!source.includes(required)) {
    console.error(`Safety check failed: ${required}`);
    process.exit(1);
  }
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Three-button AI header row installed successfully.");
console.log("Modified: components/PsyLatticeCopilot.tsx");
