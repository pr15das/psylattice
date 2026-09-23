import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/PsyLatticeCopilot.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/PsyLatticeCopilot.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

const VERSION_MARKER = "psylattice.study-ai-environments.step5a.v2";
if (source.includes(VERSION_MARKER)) {
  console.log("Step 5A v2 is already installed in PsyLatticeCopilot.tsx.");
  process.exit(0);
}

const backup = `${target}.before-study-ai-environments-step5a-v2.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

function fail(label) {
  console.error(`Patch stopped: could not safely patch ${label}.`);
  console.error("No partial file was written.");
  process.exit(1);
}

function replaceOnce(label, before, after) {
  const index = source.indexOf(before);
  if (index < 0) fail(label);
  if (source.indexOf(before, index + before.length) >= 0) {
    fail(`${label} (matched more than once)`);
  }
  source = source.slice(0, index) + after + source.slice(index + before.length);
  console.log(`Patched: ${label}`);
}

function replaceRegexOnce(label, regex, replacement) {
  const matches = [...source.matchAll(regex)];
  if (matches.length !== 1) {
    fail(`${label} (expected 1 match, found ${matches.length})`);
  }
  source = source.replace(regex, replacement);
  console.log(`Patched: ${label}`);
}

function insertBeforeOnce(label, needle, insertion) {
  const index = source.indexOf(needle);
  if (index < 0) fail(label);
  source = source.slice(0, index) + insertion + source.slice(index);
  console.log(`Patched: ${label}`);
}

// Marker comment.
source = source.replace(
  `"use client";`,
  `"use client";\n\n// ${VERSION_MARKER}`,
);

// 1. Imports.
if (!source.includes("\n  BookOpen,\n")) {
  replaceOnce(
    "BookOpen icon import",
    "  BrainCircuit,\n  Check,",
    "  BrainCircuit,\n  BookOpen,\n  Check,",
  );
}

if (!source.includes('ResearchAiEnvironmentSelector from "@/components/ResearchAiEnvironmentSelector"')) {
  replaceOnce(
    "AI environment selector import",
    '} from "@/lib/research/copilotBridge";',
    `} from "@/lib/research/copilotBridge";
import ResearchAiEnvironmentSelector, {
  type ResearchAiEnvironment,
} from "@/components/ResearchAiEnvironmentSelector";`,
  );
}

// 2. Reference Library permission.
if (!source.includes("referenceLibrary: boolean;")) {
  replaceOnce(
    "Reference Library permission type",
    "  thesis: boolean;\n  cognitive: boolean;",
    "  thesis: boolean;\n  referenceLibrary: boolean;\n  cognitive: boolean;",
  );
}

if (!source.includes('key: "referenceLibrary"')) {
  insertBeforeOnce(
    "Reference Library permission option",
    `  {
    key: "cognitive",
    title: "Cognitive Lab",`,
    `  {
    key: "referenceLibrary",
    title: "Reference Library",
    detail:
      "Saved bibliographic metadata, abstracts and permitted extracted paper text from your global Reference Manager.",
    icon: BookOpen,
  },
`,
  );
}

if (!/referenceLibrary:\s*false,/.test(source)) {
  replaceRegexOnce(
    "Reference Library default permission",
    /(\n\s*thesis:\s*true,\n)(\s*cognitive:\s*true,)/g,
    `$1  referenceLibrary: false,\n$2`,
  );
}

// 3. Scoped browser preference / Research Plan storage.
// Current branch stores chat history in Supabase already; only permissions + session plan
// need local environment scoping.
if (!source.includes("function scopedEnvironmentStorageKey(")) {
  replaceOnce(
    "environment storage helper",
    'const HISTORY_NUDGE_INTERVAL = 12;',
    `const HISTORY_NUDGE_INTERVAL = 12;

function scopedEnvironmentStorageKey(base: string, scope = "default") {
  return \`\${base}.\${scope || "default"}\`;
}`,
  );
}

replaceRegexOnce(
  "readPermissions scope",
  /function readPermissions\(\): Permissions \{/g,
  'function readPermissions(scope = "default"): Permissions {',
);

replaceOnce(
  "readPermissions storage key",
  "window.localStorage.getItem(PERMISSION_KEY)",
  "window.localStorage.getItem(scopedEnvironmentStorageKey(PERMISSION_KEY, scope))",
);

replaceRegexOnce(
  "savePermissions scope",
  /function savePermissions\(value: Permissions\) \{/g,
  'function savePermissions(value: Permissions, scope = "default") {',
);

replaceOnce(
  "savePermissions storage key",
  "window.localStorage.setItem(PERMISSION_KEY, JSON.stringify(value));",
  `window.localStorage.setItem(
    scopedEnvironmentStorageKey(PERMISSION_KEY, scope),
    JSON.stringify(value),
  );`,
);

replaceRegexOnce(
  "readPlan scope",
  /function readPlan\(\): ResearchPlan \| null \{/g,
  'function readPlan(scope = "default"): ResearchPlan | null {',
);

replaceOnce(
  "readPlan storage key",
  "window.sessionStorage.getItem(PLAN_KEY)",
  "window.sessionStorage.getItem(scopedEnvironmentStorageKey(PLAN_KEY, scope))",
);

replaceRegexOnce(
  "savePlan scope",
  /function savePlan\(plan: ResearchPlan \| null\) \{/g,
  'function savePlan(plan: ResearchPlan | null, scope = "default") {',
);

replaceOnce(
  "savePlan scoped body",
  `    if (!plan) window.sessionStorage.removeItem(PLAN_KEY);
    else window.sessionStorage.setItem(PLAN_KEY, JSON.stringify(plan));`,
  `    const key = scopedEnvironmentStorageKey(PLAN_KEY, scope);
    if (!plan) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(plan));`,
);

// 4. Environment state.
if (!source.includes("const [activeEnvironment, setActiveEnvironment]")) {
  replaceOnce(
    "environment state",
    `  const [verifiedState, setVerifiedState] = useState<VerifiedWorkspaceState>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);`,
    `  const [verifiedState, setVerifiedState] = useState<VerifiedWorkspaceState>({});
  const [activeEnvironment, setActiveEnvironment] =
    useState<ResearchAiEnvironment | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);`,
  );
}

if (!source.includes('const environmentScope = activeEnvironment?.id || "default";')) {
  replaceOnce(
    "environment scope",
    `  const historyPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {`,
    `  const historyPanelRef = useRef<HTMLDivElement | null>(null);

  const environmentScope = activeEnvironment?.id || "default";
  const environmentStudyId = activeEnvironment?.study_id || "";

  function copilotHistoryUrl(
    mode: "latest" | "list" | "conversation",
    values: Record<string, string> = {},
  ) {
    const params = new URLSearchParams({ mode, ...values });
    if (activeEnvironment?.id) {
      params.set("environment_id", activeEnvironment.id);
    }
    return \`/api/psylattice-copilot?\${params.toString()}\`;
  }

  useEffect(() => {`,
  );
}

// 5. Replace the current mount-only history initialization with environment-aware restoration.
replaceRegexOnce(
  "environment-aware history initialization",
  /  useEffect\(\(\) => \{\n    const next = readPermissions\(\);\n    setPermissions\(next\);\n    setResearchPlan\(readPlan\(\)\);\n    if \(!next\.confirmed\) setTab\("permissions"\);\n\n    \/\/ Saved Research Assistant history belongs[\s\S]*?    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n  \}, \[\]\);/g,
  `  useEffect(() => {
    const next = readPermissions(environmentScope);
    setPermissions(next);
    setResearchPlan(readPlan(environmentScope));
    setConversationId("");
    setMessages([]);
    setHistoryConversations([]);
    setPinnedMessages([]);
    setHistoryStats({ conversationCount: 0, messageCount: 0, warning: false });
    setVerifiedState({});
    setHistoryNote("");
    setHistoryPanelOpen(false);
    setDraft("");
    if (!next.confirmed) setTab("permissions");

    // Saved chat history is server-persistent, but it is now restored only
    // inside the selected AI environment.
    void resumeSavedConversation();

    // Safari/auth hydration retry, scoped to the same environment.
    const retry = window.setTimeout(() => void resumeSavedConversation(true), 900);
    return () => window.clearTimeout(retry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentScope]);`,
);

replaceRegexOnce(
  "environment-scoped Research Plan persistence",
  /  useEffect\(\(\) => \{\n    savePlan\(researchPlan\);\n  \}, \[researchPlan\]\);/g,
  `  useEffect(() => {
    savePlan(researchPlan, environmentScope);
  }, [environmentScope, researchPlan]);`,
);

// 6. Environment identity and cross-study context isolation.
replaceOnce(
  "environment identity in allowed context",
  `      workspace: {
        current_screen: currentScreen,
        current_screen_label: surfaceLabel(currentScreen),
      },`,
  `      workspace: {
        current_screen: currentScreen,
        current_screen_label: surfaceLabel(currentScreen),
        ai_environment_id: activeEnvironment?.id || null,
        ai_environment_study_id: activeEnvironment?.study_id || null,
        ai_environment_name: activeEnvironment?.study_title || null,
      },`,
);

replaceOnce(
  "cross-study context filter",
  `    >) {
      if (!permissionForSurface(surface, permissions)) continue;
      const item: Record<string, unknown> = {`,
  `    >) {
      if (!permissionForSurface(surface, permissions)) continue;
      if (
        environmentStudyId &&
        envelope.studyId &&
        envelope.studyId !== environmentStudyId
      ) {
        continue;
      }
      const item: Record<string, unknown> = {`,
);

replaceOnce(
  "Reference Library permission in context",
  `      thesis: permissions.thesis,
      cognitive: permissions.cognitive,`,
  `      thesis: permissions.thesis,
      reference_library: permissions.referenceLibrary,
      cognitive: permissions.cognitive,`,
);

replaceOnce(
  "allowedContext dependencies",
  "  }, [contexts, currentScreen, onNavigate, permissions, pinnedMessages]);",
  `  }, [
    activeEnvironment,
    contexts,
    currentScreen,
    environmentStudyId,
    onNavigate,
    permissions,
    pinnedMessages,
  ]);`,
);

// 7. The selected AI environment owns the primary study.
replaceRegexOnce(
  "environment-pinned primary study",
  /  const primaryStudy = useMemo\(\(\) => \{\n    const values = Object\.values\(contexts\) as PsyLatticeCopilotContextEnvelope\[\];\n    const active = values\.find\(\(item\) => item\.active && item\.studyId\);\n    if \(active\?\.studyId\) return \{ id: active\.studyId, title: active\.studyTitle \|\| "" \};\n    if \(preferredStudyId\) return \{ id: preferredStudyId, title: "" \};\n    const stale = values\.find\(\(item\) => item\.studyId\);\n    return stale\?\.studyId \? \{ id: stale\.studyId, title: stale\.studyTitle \|\| "" \} : null;\n  \}, \[contexts, preferredStudyId\]\);/g,
  `  const primaryStudy = useMemo(() => {
    if (activeEnvironment?.study_id) {
      return {
        id: activeEnvironment.study_id,
        title: activeEnvironment.study_title || activeEnvironment.name || "",
      };
    }

    const values = Object.values(contexts) as PsyLatticeCopilotContextEnvelope[];
    const active = values.find((item) => item.active && item.studyId);
    if (active?.studyId) return { id: active.studyId, title: active.studyTitle || "" };
    if (preferredStudyId) return { id: preferredStudyId, title: "" };
    const stale = values.find((item) => item.studyId);
    return stale?.studyId ? { id: stale.studyId, title: stale.studyTitle || "" } : null;
  }, [activeEnvironment, contexts, preferredStudyId]);`,
);

// 8. Environment-scoped history URLs.
replaceOnce(
  "history list URL",
  'fetch("/api/psylattice-copilot?mode=list", { method: "GET", cache: "no-store" })',
  'fetch(copilotHistoryUrl("list"), { method: "GET", cache: "no-store" })',
);

replaceOnce(
  "latest history URL",
  'fetch("/api/psylattice-copilot?mode=latest", { method: "GET", cache: "no-store" })',
  'fetch(copilotHistoryUrl("latest"), { method: "GET", cache: "no-store" })',
);

replaceRegexOnce(
  "saved conversation URL",
  /fetch\(`\/api\/psylattice-copilot\?mode=conversation&id=\$\{encodeURIComponent\(targetConversationId\)\}`, \{/g,
  'fetch(copilotHistoryUrl("conversation", { id: targetConversationId }), {',
);

// 9. Environment ID on POST operations.
source = source.replace(
  `body: JSON.stringify({
          operation: pinned ? "pin_message" : "unpin_message",
          message_id: message.id,
        }),`,
  `body: JSON.stringify({
          operation: pinned ? "pin_message" : "unpin_message",
          environment_id: activeEnvironment?.id || undefined,
          message_id: message.id,
        }),`,
);

source = source.replace(
  `body: JSON.stringify({ operation: "delete_conversation", conversation_id: conversation.id }),`,
  `body: JSON.stringify({
          operation: "delete_conversation",
          environment_id: activeEnvironment?.id || undefined,
          conversation_id: conversation.id,
        }),`,
);

source = source.replace(
  `body: JSON.stringify({ operation: "delete_unpinned_history" }),`,
  `body: JSON.stringify({
          operation: "delete_unpinned_history",
          environment_id: activeEnvironment?.id || undefined,
        }),`,
);

source = source.replace(
  `          operation: "save_plan_state",
          save_history: true,
          conversation_id: targetConversationId,`,
  `          operation: "save_plan_state",
          save_history: true,
          environment_id: activeEnvironment?.id || undefined,
          conversation_id: targetConversationId,`,
);

source = source.replace(
  `          operation: "clear_plan_state",
          save_history: true,
          conversation_id: conversationId,`,
  `          operation: "clear_plan_state",
          save_history: true,
          environment_id: activeEnvironment?.id || undefined,
          conversation_id: conversationId,`,
);

// Exactly two user AI requests: ordinary chat + Research Plan.
const requestNeedle = `          study_id: primaryStudy?.id || undefined,
          current_screen: currentScreen,`;
const requestCount = source.split(requestNeedle).length - 1;
if (requestCount !== 2) {
  fail(`environment ID on AI requests (expected 2 matches, found ${requestCount})`);
}
source = source.replaceAll(
  requestNeedle,
  `          study_id: primaryStudy?.id || undefined,
          environment_id: activeEnvironment?.id || undefined,
          current_screen: currentScreen,`,
);
console.log("Patched: environment ID on chat + Research Plan requests");

// 10. Scoped permission persistence.
replaceOnce(
  "confirm environment permissions",
  "    savePermissions(next);\n    setTab(\"chat\");",
  "    savePermissions(next, environmentScope);\n    setTab(\"chat\");",
);

replaceOnce(
  "persist environment permissions",
  "    savePermissions(permissions);\n    if (!conversationId && !historyLoading) void resumeSavedConversation();",
  `    savePermissions(permissions, environmentScope);
    if (!conversationId && !historyLoading) void resumeSavedConversation();`,
);

replaceOnce(
  "reset environment Research Plan",
  "    savePlan(null);\n    if (conversationId) {",
  "    savePlan(null, environmentScope);\n    if (conversationId) {",
);

// 11. Count only context sources actually allowed into this environment.
replaceRegexOnce(
  "environment-scoped connected context count",
  /  const connectedContextCount = \(Object\.entries\(contexts\) as Array<\n    \[string, PsyLatticeCopilotContextEnvelope\]\n  >\)\.filter\(\(\[surface\]\) => permissionForSurface\(surface, permissions\)\)\.length;/g,
  `  const connectedContextCount = (Object.entries(contexts) as Array<
    [string, PsyLatticeCopilotContextEnvelope]
  >).filter(
    ([surface, envelope]) =>
      permissionForSurface(surface, permissions) &&
      (!environmentStudyId ||
        !envelope.studyId ||
        envelope.studyId === environmentStudyId),
  ).length;`,
);

// 12. Environment selector UI above model selector.
if (!source.includes("<ResearchAiEnvironmentSelector")) {
  replaceOnce(
    "AI environment selector UI",
    `              <div className="relative pb-2">
                <button`,
    `              <div className="pb-2">
                <ResearchAiEnvironmentSelector
                  activeEnvironmentId={activeEnvironment?.id || ""}
                  preferredStudyId={preferredStudyId}
                  onChange={setActiveEnvironment}
                />
              </div>

              <div className="relative pb-2">
                <button`,
  );
}

// 13. Better empty state wording.
replaceOnce(
  "environment chat empty state",
  `<p className="text-[12px] font-semibold text-slate-900">One conversation across your research workflow.</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          Research Assistant follows the permitted study, data, analysis and thesis context as you move through PsyLattice. Last-known module context stays available for this page session and is marked as a snapshot when it is no longer live.
                        </p>`,
  `<p className="text-[12px] font-semibold text-slate-900">
                          {activeEnvironment
                            ? \`Dedicated AI environment · \${activeEnvironment.study_title}\`
                            : "Current-study Research Assistant"}
                        </p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          {activeEnvironment
                            ? "Chat history, Research Plan and permissions are isolated to this study. Live context explicitly belonging to another study is blocked from this environment."
                            : "This keeps the existing current-study Research Assistant behavior. Create or select a paid study AI environment when you want a persistent isolated research context."}
                        </p>`,
);

// Final safety checks.
for (const required of [
  VERSION_MARKER,
  "ResearchAiEnvironmentSelector",
  "referenceLibrary: boolean",
  "referenceLibrary: false",
  "environmentScope",
  "environment_id: activeEnvironment?.id",
  "copilotHistoryUrl",
]) {
  if (!source.includes(required)) fail(`final safety check: ${required}`);
}

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Step 5A v2 client patch installed successfully.");
console.log("Modified: components/PsyLatticeCopilot.tsx");
