import fs from "node:fs";
import path from "node:path";

const panelPath = path.resolve(
  process.cwd(),
  "components/StudyHealthPanel.tsx",
);
const enginePath = path.resolve(
  process.cwd(),
  "lib/research/health/engine.ts",
);

if (!fs.existsSync(panelPath)) {
  console.error("Could not find components/StudyHealthPanel.tsx");
  process.exit(1);
}

if (!fs.existsSync(enginePath)) {
  console.error("Could not find lib/research/health/engine.ts");
  process.exit(1);
}

let source = fs.readFileSync(panelPath, "utf8");

if (!source.includes('data-psylattice-semantic-audit-panel="v2"')) {
  console.error(
    "Reference-aware UI patch stopped: semantic audit UI v2 was not found.",
  );
  process.exit(1);
}

if (source.includes('data-psylattice-reference-aware-audit="v3"')) {
  console.log("Reference-aware Study Health UI v3 is already installed.");
  process.exit(0);
}

const stateAnchor =
  '  const [auditMessage, setAuditMessage] = useState("");';

if (!source.includes(stateAnchor)) {
  console.error(
    "Reference-aware UI patch stopped: audit state anchor was not found.",
  );
  process.exit(1);
}

source = source.replace(
  stateAnchor,
  `${stateAnchor}
  const [includeReferenceLibrary, setIncludeReferenceLibrary] = useState(false);`,
);

const requestAnchor = `        body: JSON.stringify({
          studyId,
          auditType: "thesis_citation_coverage",
        }),`;

if (!source.includes(requestAnchor)) {
  console.error(
    "Reference-aware UI patch stopped: semantic audit request anchor was not found.",
  );
  process.exit(1);
}

source = source.replace(
  requestAnchor,
  `        body: JSON.stringify({
          studyId,
          auditType: "thesis_citation_coverage",
          includeReferenceLibrary,
        }),`,
);

const activeFindingsChip = `                <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1">
                  Active AI findings: {report.capabilities.semanticAiAudits.activeFindings}
                </span>`;

if (!source.includes(activeFindingsChip)) {
  console.error(
    "Reference-aware UI patch stopped: semantic audit status chips were not found.",
  );
  process.exit(1);
}

source = source.replace(
  activeFindingsChip,
  `${activeFindingsChip}
                <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1">
                  Reference context: {report.capabilities.semanticAiAudits.referenceLibraryPermitted
                    ? \`\${report.capabilities.semanticAiAudits.referenceItemsSupplied} supplied\`
                    : "not used"}
                </span>`,
);

const buttonWrapperAnchor = `            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">`;

if (!source.includes(buttonWrapperAnchor)) {
  console.error(
    "Reference-aware UI patch stopped: semantic audit action area was not found.",
  );
  process.exit(1);
}

source = source.replace(
  buttonWrapperAnchor,
  `            <div
              data-psylattice-reference-aware-audit="v3"
              className="flex shrink-0 flex-col items-stretch gap-3"
            >
              <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-violet-200 bg-white/80 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={includeReferenceLibrary}
                  onChange={(event) =>
                    setIncludeReferenceLibrary(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="max-w-[260px] text-[10px] leading-4.5 text-slate-600">
                  <strong className="block text-[11px] text-slate-800">
                    Allow Reference Manager context for this audit
                  </strong>
                  When enabled, PsyLattice may inspect your saved reference metadata, abstracts and available extracted PDF text to suggest candidate sources worth reviewing. It does not assume a saved source supports a claim.
                </span>
              </label>

              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">`,
);

const closingActionArea = `              <div className="text-[10px] leading-4 text-slate-500 sm:max-w-[180px] sm:text-right">
                {report.metrics.writing.documentsWithText === 0
                  ? "Add saved Thesis text first. The AI audit only runs on study-linked Thesis content."
                  : "Next phases can extend this panel into reference-aware and semantic writing audits."}
              </div>
            </div>`;

if (!source.includes(closingActionArea)) {
  console.error(
    "Reference-aware UI patch stopped: semantic audit action closing block was not found.",
  );
  process.exit(1);
}

source = source.replace(
  closingActionArea,
  `              <div className="text-[10px] leading-4 text-slate-500 sm:max-w-[180px] sm:text-right">
                {report.metrics.writing.documentsWithText === 0
                  ? "Add saved Thesis text first. The AI audit only runs on study-linked Thesis content."
                  : includeReferenceLibrary
                    ? "Reference Manager access is granted only for this explicit audit request."
                    : "Run Thesis citation review without Reference Manager context."}
              </div>
              </div>
            </div>`,
);

// Make the readiness card and four key metric cards visually stronger without
// changing layout or introducing a heavy dashboard look.
source = source.replace(
  'className={`rounded-[22px] border ${tone.ring} bg-white p-4 shadow-[0_6px_22px_rgba(15,23,42,.045)]`}',
  'className={`rounded-[22px] border border-slate-800 bg-[linear-gradient(145deg,#172033,#0f172a)] p-4 text-white shadow-[0_10px_28px_rgba(15,23,42,.18)]`}',
);

source = source.replace(
  'className="text-[9px] font-semibold uppercase tracking-[.11em] text-slate-400"',
  'className="text-[9px] font-semibold uppercase tracking-[.11em] text-slate-300"',
);

source = source.replace(
  'className={`text-[38px] font-semibold leading-none tracking-[-.05em] ${tone.text}`}',
  'className="text-[38px] font-semibold leading-none tracking-[-.05em] text-white"',
);

source = source.replace(
  'className="mb-1 text-[15px] font-semibold text-slate-400"',
  'className="mb-1 text-[15px] font-semibold text-slate-300"',
);

source = source.replace(
  'className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"',
  'className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"',
);

source = source.replace(
  'className={`h-full rounded-full ${tone.bar}`}',
  'className="h-full rounded-full bg-cyan-400"',
);

source = source.replace(
  'className="mt-3 text-[11px] leading-4.5 text-slate-500"',
  'className="mt-3 text-[11px] leading-4.5 text-slate-300"',
);

source = source.replace(
  'className="mt-4 border-t border-slate-100 pt-3"',
  'className="mt-4 border-t border-white/10 pt-3"',
);

source = source.replace(
  'className="text-[10px] font-semibold text-slate-600"',
  'className="text-[10px] font-semibold text-slate-200"',
);

source = source.replace(
  'className="mt-1 text-[10px] leading-4 text-slate-400"',
  'className="mt-1 text-[10px] leading-4 text-slate-300"',
);

// Only the four metric cards use this exact class block in the v1 panel.
source = source.replaceAll(
  'className="rounded-2xl border border-slate-200 bg-white p-4"',
  'className="rounded-2xl border border-slate-300 bg-[linear-gradient(145deg,#f8fafc,#eef2f7)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.07)]"',
);

fs.writeFileSync(panelPath, source, "utf8");

let engine = fs.readFileSync(enginePath, "utf8");

const semanticCapabilityAnchor = `        truncated: semanticAudit.truncated,
        note: semanticAudit.note,`;

if (!engine.includes(semanticCapabilityAnchor)) {
  console.error(
    "Reference-aware engine patch stopped: semantic capability anchor was not found.",
  );
  process.exit(1);
}

engine = engine.replace(
  semanticCapabilityAnchor,
  `        truncated: semanticAudit.truncated,
        referenceLibraryPermitted:
          semanticAudit.referenceLibraryPermitted,
        referenceItemsSupplied:
          semanticAudit.referenceItemsSupplied,
        note: semanticAudit.note,`,
);

fs.writeFileSync(enginePath, engine, "utf8");

console.log(
  "Installed reference-aware semantic audit v3 and stronger Study Health metric styling.",
);
