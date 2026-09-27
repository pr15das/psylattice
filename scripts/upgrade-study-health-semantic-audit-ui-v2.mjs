import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/StudyHealthPanel.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/StudyHealthPanel.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes('data-psylattice-semantic-audit-panel="v2"')) {
  console.log("Study Health semantic audit UI v2 is already installed.");
  process.exit(0);
}

const oldButton = `          <button
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

if (!source.includes(oldButton)) {
  console.error(
    "Semantic audit UI v2 patch stopped: expected v1 button block was not found.",
  );
  process.exit(1);
}

source = source.replace(oldButton, "");

const gridAnchor = `        <div className="grid gap-4 lg:grid-cols-[210px_minmax(0,1fr)]">`;
if (!source.includes(gridAnchor)) {
  console.error(
    "Semantic audit UI v2 patch stopped: Study Health grid anchor was not found.",
  );
  process.exit(1);
}

const auditPanel = `        <div
          data-psylattice-semantic-audit-panel="v2"
          className="mb-4 overflow-hidden rounded-3xl border border-violet-200/80 bg-violet-50/70 p-4 shadow-[0_10px_30px_rgba(124,58,237,0.08)] sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-700">
                <Sparkles className="h-3.5 w-3.5" />
                Semantic AI review
              </div>
              <div className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                AI citation review for your linked Thesis text
              </div>
              <p className="mt-1 max-w-3xl text-[11px] leading-5 text-slate-600 sm:text-[12px]">
                Use AI as a separate quality-review layer. The current audit flags likely uncited scholarly claims and highlights the exact excerpt location. This does not change your deterministic readiness score.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-600 sm:text-[11px]">
                <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1">
                  Thesis files: {report.metrics.writing.linkedDocuments}
                </span>
                <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1">
                  Linked references: {report.metrics.writing.linkedReferences}
                </span>
                <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1">
                  Active AI findings: {report.capabilities.semanticAiAudits.activeFindings}
                </span>
                <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1">
                  {report.capabilities.semanticAiAudits.latestRunAt
                    ? "Audit available"
                    : "Not run yet"}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                data-psylattice-semantic-audit="v2"
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
                className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
              >
                <Sparkles
                  className={\`h-4 w-4 \${auditRunning ? "animate-pulse" : ""}\`}
                />
                {auditRunning ? "Running AI citation audit…" : "Run AI citation audit"}
              </button>
              <div className="text-[10px] leading-4 text-slate-500 sm:max-w-[180px] sm:text-right">
                {report.metrics.writing.documentsWithText === 0
                  ? "Add saved Thesis text first. The AI audit only runs on study-linked Thesis content."
                  : "Next phases can extend this panel into reference-aware and semantic writing audits."}
              </div>
            </div>
          </div>
        </div>

${gridAnchor}`;

source = source.replace(gridAnchor, auditPanel);

fs.writeFileSync(target, source, "utf8");
console.log(
  "Installed Study Health semantic audit UI v2 into components/StudyHealthPanel.tsx",
);
