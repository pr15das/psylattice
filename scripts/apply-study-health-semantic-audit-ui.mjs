import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/StudyHealthPanel.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/StudyHealthPanel.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes('data-psylattice-semantic-audit="v1"')) {
  console.log("Study Health semantic audit UI v1 is already installed.");
  process.exit(0);
}

const stateAnchor = `  const [error, setError] = useState("");`;
if (!source.includes(stateAnchor)) {
  console.error(
    "Semantic audit UI patch stopped: StudyHealthPanel state anchor was not found.",
  );
  process.exit(1);
}

source = source.replace(
  stateAnchor,
  `${stateAnchor}
  const [auditRunning, setAuditRunning] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");`,
);

const effectAnchor = `  useEffect(() => {
    void loadHealth("load");`;

if (!source.includes(effectAnchor)) {
  console.error(
    "Semantic audit UI patch stopped: StudyHealthPanel load effect anchor was not found.",
  );
  process.exit(1);
}

const runFunction = `  async function runSemanticAudit() {
    if (!studyId || auditRunning) return;

    setAuditRunning(true);
    setAuditMessage("");

    try {
      const response = await fetch("/api/research/study-health/semantic-audit", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyId,
          auditType: "thesis_citation_coverage",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.error || "The semantic citation audit could not be completed.",
        );
      }

      const provider =
        payload?.provider && payload?.providerModel
          ? \` · \${payload.provider} / \${payload.providerModel}\`
          : "";

      setAuditMessage(
        \`\${payload.message || "Semantic citation audit completed."}\${provider}\`,
      );
      await loadHealth("refresh");
    } catch (failure) {
      setAuditMessage(
        failure instanceof Error
          ? failure.message
          : "The semantic citation audit could not be completed.",
      );
    } finally {
      setAuditRunning(false);
    }
  }

`;

source = source.replace(effectAnchor, runFunction + effectAnchor);

const refreshButtonAnchor = `          <button
            type="button"
            disabled={refreshing}
            onClick={() => void loadHealth("refresh")}`;

if (!source.includes(refreshButtonAnchor)) {
  console.error(
    "Semantic audit UI patch stopped: Study Health Refresh button anchor was not found.",
  );
  process.exit(1);
}

const auditButton = `          <button
            type="button"
            data-psylattice-semantic-audit="v1"
            disabled={
              auditRunning ||
              report.metrics.writing.documentsWithText === 0
            }
            onClick={() => void runSemanticAudit()}
            title={
              report.metrics.writing.documentsWithText === 0
                ? "Link a Thesis Builder document with saved text before running the semantic citation audit."
                : "Run an explicit AI citation-review audit. This uses your account-wide AI allowance and does not change the deterministic readiness score."
            }
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[10px] font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Sparkles
              className={\`h-3.5 w-3.5 \${auditRunning ? "animate-pulse" : ""}\`}
            />
            {auditRunning ? "Auditing Thesis…" : "Run AI citation audit"}
          </button>

`;

source = source.replace(
  refreshButtonAnchor,
  auditButton + refreshButtonAnchor,
);

const contentAnchor = `      <div className="p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">`;

if (!source.includes(contentAnchor)) {
  console.error(
    "Semantic audit UI patch stopped: Study Health content anchor was not found.",
  );
  process.exit(1);
}

const messageBlock = `      <div className="p-5 sm:p-6">
        {auditMessage ? (
          <div className="mb-4 rounded-2xl border border-violet-200/80 bg-violet-50/60 px-4 py-3 text-[11px] leading-5 text-violet-800">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{auditMessage}</span>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">`;

source = source.replace(contentAnchor, messageBlock);

fs.writeFileSync(target, source, "utf8");
console.log(
  "Installed Study Health semantic citation audit UI v1 into components/StudyHealthPanel.tsx",
);
