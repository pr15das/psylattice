import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/PsyLatticeCopilot.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/PsyLatticeCopilot.tsx");
  process.exit(1);
}

const originalSource = fs.readFileSync(target, "utf8");

if (originalSource.includes('data-psylattice-suggestions="v1"')) {
  console.log("Research Assistant Suggestions v1 is already integrated.");
  process.exit(0);
}

const importAnchor = `import ResearchAiEnvironmentSelector, {
  type ResearchAiEnvironment,
} from "@/components/ResearchAiEnvironmentSelector";`;

if (!originalSource.includes(importAnchor)) {
  console.error(
    "Suggestions integration stopped: ResearchAiEnvironmentSelector import anchor was not found. No file was changed.",
  );
  process.exit(1);
}

const tabBlockPattern = /const TAB_OPTIONS: Array<\{[\s\S]*?\n\];/;
const tabMatch = originalSource.match(tabBlockPattern);

if (!tabMatch) {
  console.error(
    "Suggestions integration stopped: TAB_OPTIONS could not be found. No file was changed.",
  );
  process.exit(1);
}

const updatedTabs = tabMatch[0]
  .replace(
    /value:\s*"chat"\s*\|\s*"plan"\s*\|\s*"context"\s*\|\s*"permissions"/,
    'value: "chat" | "plan" | "suggestions" | "permissions"',
  )
  .replace(
    /\{\s*value:\s*"context",\s*label:\s*"Context",\s*icon:\s*Database\s*\}/,
    '{ value: "suggestions", label: "Suggestions", icon: Sparkles }',
  );

if (updatedTabs === tabMatch[0]) {
  console.error(
    "Suggestions integration stopped: the existing Context tab definition did not match the expected shape. No file was changed.",
  );
  process.exit(1);
}

const tabStatePattern =
  /useState<"chat"\s*\|\s*"plan"\s*\|\s*"context"\s*\|\s*"permissions">\("chat"\)/;

if (!tabStatePattern.test(originalSource)) {
  console.error(
    "Suggestions integration stopped: active tab state could not be found. No file was changed.",
  );
  process.exit(1);
}

// PsyLatticeCopilot uses the state names `tab` and `setTab`.
// The previous integration script searched for `activeTab` / `setActiveTab`,
// which do not exist in this component and caused the Context JSX isolation failure.
const contextStart = originalSource.indexOf('{tab === "context" && (');
const permissionsStart = originalSource.indexOf(
  '{tab === "permissions" && (',
  contextStart >= 0 ? contextStart : 0,
);

if (contextStart < 0 || permissionsStart < 0 || permissionsStart <= contextStart) {
  console.error(
    "Suggestions integration stopped: existing Context-tab JSX could not be isolated. No file was changed.",
  );
  process.exit(1);
}

let source = originalSource;

source = source.replace(
  importAnchor,
  `${importAnchor}\nimport ResearchAiSuggestions from "@/components/ResearchAiSuggestions";`,
);

source = source.replace(tabMatch[0], updatedTabs);
source = source.replace(
  tabStatePattern,
  'useState<"chat" | "plan" | "suggestions" | "permissions">("chat")',
);

// The old Context panel was the only caller of clearCopilotContexts().
// Remove that now-unused import while keeping the live context subscription and
// permission machinery untouched.
source = source.replace(/\n\s*clearCopilotContexts,/, "");

const replacementContextStart = source.indexOf('{tab === "context" && (');
const replacementPermissionsStart = source.indexOf(
  '{tab === "permissions" && (',
  replacementContextStart >= 0 ? replacementContextStart : 0,
);

if (
  replacementContextStart < 0 ||
  replacementPermissionsStart < 0 ||
  replacementPermissionsStart <= replacementContextStart
) {
  console.error(
    "Suggestions integration stopped: Context-tab JSX moved unexpectedly during preparation. No file was changed.",
  );
  process.exit(1);
}

const suggestionsJsx = `{tab === "suggestions" && (
              <section data-psylattice-suggestions="v1" className="min-h-0 flex-1 overflow-y-auto">
                <ResearchAiSuggestions
                  studyId={primaryStudy?.id || ""}
                  studyTitle={primaryStudy?.title || ""}
                  researchPlan={researchPlan}
                  navigationEnabled={permissions.navigationActions}
                  onNavigate={(target) =>
                    executeAction({
                      type: "navigate",
                      target,
                      label: "Open",
                    })
                  }
                  onOpenResearchPlan={() => setTab("plan")}
                />
              </section>
            )}

            `;

source =
  source.slice(0, replacementContextStart) +
  suggestionsJsx +
  source.slice(replacementPermissionsStart);

if (!source.includes('data-psylattice-suggestions="v1"')) {
  console.error(
    "Suggestions integration stopped: Suggestions JSX was not inserted. No file was changed.",
  );
  process.exit(1);
}

fs.writeFileSync(target, source, "utf8");

console.log(
  "Integrated Research Assistant Suggestions v1. Context is now Suggestions; permissions and underlying context machinery are unchanged.",
);
