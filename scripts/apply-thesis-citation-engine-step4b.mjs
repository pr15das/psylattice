import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes('import ThesisCitationPanel from "@/components/ThesisCitationPanel";')) {
  console.log("Step 4B citation patch is already installed.");
  process.exit(0);
}

const backup = `${target}.before-citation-engine-step4b.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

function replaceOnce(label, before, after) {
  if (!source.includes(before)) {
    console.error(`Patch stopped: could not find ${label}.`);
    console.error("No partial file was written.");
    process.exit(1);
  }
  source = source.replace(before, after);
  console.log(`Patched: ${label}`);
}

replaceOnce(
  "BookOpen icon import",
  `  Bold,
  Check,`,
  `  Bold,
  BookOpen,
  Check,`,
);

replaceOnce(
  "citation imports",
  `import { publishCopilotContext, deactivateCopilotContext } from "@/lib/research/copilotBridge";`,
  `import { publishCopilotContext, deactivateCopilotContext } from "@/lib/research/copilotBridge";
import ThesisCitationPanel from "@/components/ThesisCitationPanel";
import {
  buildCitationNumberMap,
  defaultCitationStyleForPaperFormat,
  formatBibliographyEntries,
  formatCitationText,
  type CitationMode,
  type CitationReference,
  type CitationStyleId,
} from "@/lib/references/citationEngine";`,
);

replaceOnce(
  "citation state",
  `  const [exporting, setExporting] = useState(false);

  const [tableMenuOpen, setTableMenuOpen] = useState(false);`,
  `  const [exporting, setExporting] = useState(false);

  const [citationPanelOpen, setCitationPanelOpen] = useState(false);
  const [citationStyle, setCitationStyle] = useState<CitationStyleId>("apa7");

  const [tableMenuOpen, setTableMenuOpen] = useState(false);`,
);

replaceOnce(
  "citation style loading effect",
  `  useEffect(() => {
    if (!selectedDocument) {
      setTitle("");`,
  `  useEffect(() => {
    if (!selectedDocumentId || !userId) return;

    let cancelled = false;

    async function loadCitationStyle() {
      const supabase = createClient();
      const { data, error: styleError } = await supabase
        .from("research_document_citation_settings")
        .select("citation_style")
        .eq("owner_user_id", userId)
        .eq("document_id", selectedDocumentId)
        .maybeSingle();

      if (cancelled) return;

      if (styleError) {
        console.warn("Could not load citation style:", styleError);
        return;
      }

      setCitationStyle(
        (data?.citation_style as CitationStyleId | undefined) ||
          defaultCitationStyleForPaperFormat(
            documents.find((document) => document.id === selectedDocumentId)
              ?.format_style,
          ),
      );
    }

    void loadCitationStyle();

    return () => {
      cancelled = true;
    };
  }, [documents, selectedDocumentId, userId]);

  useEffect(() => {
    if (!selectedDocument) {
      setTitle("");`,
);

const citationFunctions = fs.readFileSync(
  path.resolve(process.cwd(), "scripts/thesis-citation-functions-step4b.txt"),
  "utf8",
);

replaceOnce(
  "citation functions",
  `  async function snapshotRevision(reason: string) {`,
  citationFunctions + `  async function snapshotRevision(reason: string) {`,
);

replaceOnce(
  "paper-format-to-citation-style sync",
  `    setFormatStyle(nextFormat);
    setSettings(nextSettings);
    setDirty(true);
    setNotice(\`${"${FORMAT_PRESETS[nextFormat].shortLabel}"} page formatting applied.\`);`,
  `    setFormatStyle(nextFormat);
    setSettings(nextSettings);
    setDirty(true);

    const matchingCitationStyle =
      nextFormat === "ieee_conference"
        ? "ieee"
        : nextFormat === "apa7_student" || nextFormat === "apa7_professional"
          ? "apa7"
          : null;

    if (matchingCitationStyle && matchingCitationStyle !== citationStyle) {
      void applyCitationStyle(matchingCitationStyle);
    }

    setNotice(\`${"${FORMAT_PRESETS[nextFormat].shortLabel}"} page formatting applied.\`);`,
);

replaceOnce(
  "citation toolbar button",
  `                  <ToolbarButton
                    title="Export paper"
                    onClick={() => {
                      if (!selectedDocument) return;
                      setExportPageSize(settings.page_size);
                      setApplyExportSizeToCanvas(false);
                      setExportOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold"><Download className="h-3.5 w-3.5" /> Export</span>
                  </ToolbarButton>
                  <span className="mx-1 h-6 w-px bg-slate-200" />`,
  `                  <ToolbarButton
                    title="Export paper"
                    onClick={() => {
                      if (!selectedDocument) return;
                      setExportPageSize(settings.page_size);
                      setApplyExportSizeToCanvas(false);
                      setExportOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold"><Download className="h-3.5 w-3.5" /> Export</span>
                  </ToolbarButton>

                  <ToolbarButton
                    title="Citations and bibliography"
                    active={citationPanelOpen}
                    onClick={() => {
                      captureFormattingSelection();
                      setCitationPanelOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
                      <BookOpen className="h-3.5 w-3.5" />
                      Cite
                    </span>
                  </ToolbarButton>

                  <span className="mx-1 h-6 w-px bg-slate-200" />`,
);

replaceOnce(
  "citation panel render",
  `      {importOpen && (`,
  `      <ThesisCitationPanel
        open={citationPanelOpen}
        documentId={selectedDocumentId}
        style={citationStyle}
        onClose={() => setCitationPanelOpen(false)}
        onStyleChange={(nextStyle) => applyCitationStyle(nextStyle)}
        onInsertCitation={(payload) => insertStructuredCitation(payload)}
        onInsertBibliography={() => insertOrRefreshBibliography()}
      />

      {importOpen && (`,
);

fs.writeFileSync(target, source, "utf8");

console.log("");
console.log("Step 4B citation engine installed successfully.");
console.log("Modified: components/ResearchWritingWorkspace.tsx");
console.log("Added toolbar action: Cite");
