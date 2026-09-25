import fs from "node:fs";
import path from "node:path";

const target = path.resolve(process.cwd(), "components/ResearchWritingWorkspace.tsx");
const marker = "psylattice.study-scoped-thesis.v1";

if (!fs.existsSync(target)) {
  console.error("Could not find components/ResearchWritingWorkspace.tsx");
  process.exit(1);
}

let source = fs.readFileSync(target, "utf8");

if (source.includes(marker)) {
  console.log("Study-scoped Thesis Builder v1 is already installed.");
  process.exit(0);
}

const backup = `${target}.before-study-scoped-thesis-v1.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`Backup created: ${path.relative(process.cwd(), backup)}`);
}

function replaceOnce(find, replacement, label) {
  if (!source.includes(find)) {
    console.error(`Patch stopped: could not find ${label}. No partial file was written.`);
    process.exit(1);
  }
  source = source.replace(find, replacement);
}

// 1. Add study_id to the live document type.
replaceOnce(
`  folder_id: string | null;
  title: string;`,
`  folder_id: string | null;
  study_id: string | null;
  title: string;`,
"DocumentRow folder/title fields",
);

// 2. Add reusable study-scope types.
replaceOnce(
`type RevisionRow = {`,
`type StudyScopeStudy = {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
  eligible: boolean;
  coveredByStudyPass: boolean;
};

type StudyScopeApiResponse = {
  ok?: boolean;
  error?: string;
  account?: {
    plan?: string;
    planName?: string;
    hasPro?: boolean;
    hasAnyStudyPass?: boolean;
    mediaUploadsAllowed?: boolean;
    maxSimultaneousStudies?: number;
  };
  eligibleStudies?: StudyScopeStudy[];
};

type RevisionRow = {`,
"RevisionRow type anchor",
);

// 3. Add study-scope state.
replaceOnce(
`  const [userId, setUserId] = useState("");
  const [folders, setFolders] = useState<FolderRow[]>([]);`,
`  const [userId, setUserId] = useState("");
  // ${marker}
  const [studyScopeStudies, setStudyScopeStudies] = useState<StudyScopeStudy[]>([]);
  const [studyScopePlanName, setStudyScopePlanName] = useState("Research plan");
  const [mediaUploadsAllowed, setMediaUploadsAllowed] = useState(false);
  const [studyScopeLoading, setStudyScopeLoading] = useState(true);
  const [studyLinkSaving, setStudyLinkSaving] = useState(false);
  const [folders, setFolders] = useState<FolderRow[]>([]);`,
"userId/folder state anchor",
);

// 4. Every DocumentRow select must include study_id.
const oldSelect =
  "id,owner_user_id,folder_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at";
const newSelect =
  "id,owner_user_id,folder_id,study_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at";

if (!source.includes(oldSelect)) {
  console.error("Patch stopped: could not find Research Writing document select fields. No partial file was written.");
  process.exit(1);
}
source = source.split(oldSelect).join(newSelect);

// 5. Load reusable account/study scope once for Thesis Builder.
replaceOnce(
`  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) || null,
    [documents, selectedDocumentId]
  );

  useEffect(() => {
    if (!copilotBridge) return;`,
`  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) || null,
    [documents, selectedDocumentId]
  );

  const selectedStudyScope = useMemo(
    () =>
      selectedDocument?.study_id
        ? studyScopeStudies.find((study) => study.id === selectedDocument.study_id) || null
        : null,
    [selectedDocument, studyScopeStudies],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadStudyScope() {
      setStudyScopeLoading(true);
      try {
        const response = await fetch("/api/research/study-scope", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        const payload = (await response.json().catch(() => ({}))) as StudyScopeApiResponse;
        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Study scope could not be loaded.");
        }
        if (cancelled) return;
        setStudyScopeStudies(payload.eligibleStudies || []);
        setStudyScopePlanName(payload.account?.planName || "Research plan");
        setMediaUploadsAllowed(payload.account?.mediaUploadsAllowed === true);
      } catch (scopeError) {
        if (!cancelled) {
          setStudyScopeStudies([]);
          setMediaUploadsAllowed(false);
          console.warn("Could not load Thesis Builder study scope:", scopeError);
        }
      } finally {
        if (!cancelled) setStudyScopeLoading(false);
      }
    }

    void loadStudyScope();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!copilotBridge) return;`,
"selectedDocument/copilot effect anchor",
);

// 6. Make local Thesis copilot bridge explicitly study-scoped.
replaceOnce(
`      publicContext: {
        selected_document: selectedDocument ? {`,
`      publicContext: {
        study_id: selectedDocument?.study_id || null,
        selected_document: selectedDocument ? {
          study_id: selectedDocument.study_id,`,
"Thesis publicContext selected document",
);

replaceOnce(
`        document_index: documents.slice(0, 60).map((document) => ({`,
`        document_index: (selectedDocument?.study_id
          ? documents.filter((document) => document.study_id === selectedDocument.study_id)
          : []
        ).slice(0, 60).map((document) => ({
          study_id: document.study_id,`,
"Thesis document_index",
);

replaceOnce(
`        note: "Current Thesis Builder workspace. Unsaved current-document text is included in this browser context and is sent only when Thesis permission is enabled in Unified Copilot.",`,
`        note: "Study-scoped Thesis Builder workspace. When a document is linked to a study, Unified Copilot receives only Thesis Builder documents linked to that same study. Unsaved current-document text is sent only when Thesis permission is enabled.",`,
"Thesis context note",
);

// 7. Add the study-link mutation just before saveDocument().
replaceOnce(
`  async function saveDocument() {`,
`  async function updateDocumentStudy(nextStudyId: string) {
    if (!selectedDocument || !userId || studyLinkSaving) return;

    const normalizedStudyId = nextStudyId.trim();
    if (
      normalizedStudyId &&
      !studyScopeStudies.some((study) => study.id === normalizedStudyId)
    ) {
      setError("That study is not available under your current research plan.");
      return;
    }

    setStudyLinkSaving(true);
    setError("");
    setNotice("");

    const supabase = createClient();
    const { data, error: linkError } = await supabase
      .from("research_writing_documents")
      .update({ study_id: normalizedStudyId || null })
      .eq("id", selectedDocument.id)
      .eq("owner_user_id", userId)
      .select("${newSelect}")
      .single();

    if (linkError || !data) {
      setError(linkError?.message || "This document could not be linked to the study.");
      setStudyLinkSaving(false);
      return;
    }

    setDocuments((current) =>
      current.map((row) => (row.id === data.id ? (data as DocumentRow) : row)),
    );
    setNotice(
      normalizedStudyId
        ? "Document linked to study. Research Assistant will use it only inside that study environment."
        : "Document study link removed.",
    );
    setStudyLinkSaving(false);
  }

  async function saveDocument() {`,
"saveDocument function anchor",
);

// The template string above intentionally contains ${newSelect}; resolve it in the
// patcher itself to the actual TypeScript select string.
source = source.replace("${newSelect}", newSelect);

// 8. Image uploads are a Pro entitlement. Keep text editing intact for Study Pass.
replaceOnce(
`  async function insertImageFile(file: File) {
    if (!editorRef.current || imageUploading) return;
    setImageUploading(true);`,
`  function requestImageUpload() {
    if (!mediaUploadsAllowed) {
      setError(
        \`Image uploads in Thesis Builder are available on Researcher Pro. \${studyScopePlanName} can still use the full text/document workflow for its permitted study.\`,
      );
      return;
    }
    imageInputRef.current?.click();
  }

  async function insertImageFile(file: File) {
    if (!editorRef.current || imageUploading) return;
    if (!mediaUploadsAllowed) {
      setError(
        \`Image uploads in Thesis Builder are available on Researcher Pro. \${studyScopePlanName} does not include Thesis Builder media uploads.\`,
      );
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    setImageUploading(true);`,
"insertImageFile function",
);

// Replace direct picker opens, if present, with the entitlement-aware helper.
source = source.split("imageInputRef.current?.click()").join("requestImageUpload()");

// Undo the self-recursion created inside requestImageUpload by the global replacement.
source = source.replace(
`    requestImageUpload();
  }

  async function insertImageFile`,
`    imageInputRef.current?.click();
  }

  async function insertImageFile`,
);

// 9. Add a clear study selector in the document header, immediately after Folder.
replaceOnce(
`                  <select value={selectedDocument.folder_id || "root"} onChange={(event) => void moveDocument(event.target.value)} className="h-8 max-w-[200px] rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-500">
                    <option value="root">Unfiled</option>
                    {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                  </select>
                  <button type="button" onClick={() => void togglePin()}`,
`                  <select value={selectedDocument.folder_id || "root"} onChange={(event) => void moveDocument(event.target.value)} className="h-8 max-w-[200px] rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-500">
                    <option value="root">Unfiled</option>
                    {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                  </select>

                  <div
                    className="flex h-8 max-w-[245px] items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/70 px-2"
                    title="Study scope for this Thesis Builder file"
                  >
                    <span className="shrink-0 text-[8px] font-bold uppercase tracking-[0.1em] text-violet-600">
                      Study
                    </span>
                    <select
                      value={selectedDocument.study_id || ""}
                      disabled={studyScopeLoading || studyLinkSaving}
                      onChange={(event) => void updateDocumentStudy(event.target.value)}
                      className="min-w-0 flex-1 border-0 bg-transparent text-[10px] font-semibold text-slate-700 outline-none disabled:opacity-50"
                      aria-label="Study linked to this Thesis Builder document"
                    >
                      <option value="">Not linked</option>
                      {studyScopeStudies.map((study) => (
                        <option key={study.id} value={study.id}>
                          {study.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedStudyScope && (
                    <span className="hidden rounded-full border border-violet-100 bg-white px-2 py-1 text-[8px] font-medium text-violet-700 2xl:inline-flex">
                      {selectedStudyScope.coveredByStudyPass ? "Study Pass scope" : "Study-scoped"}
                    </span>
                  )}

                  <button type="button" onClick={() => void togglePin()}`,
"document header folder selector",
);

// 10. Add a subtle study badge to each document card.
replaceOnce(
`                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] text-slate-500">{FORMAT_PRESETS[documentRow.format_style]?.shortLabel || "Free form"}</span>
                      {documentRow.pinned && <span className="text-[10px] text-amber-500">★</span>}`,
`                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] text-slate-500">{FORMAT_PRESETS[documentRow.format_style]?.shortLabel || "Free form"}</span>
                      {documentRow.study_id && (
                        <span className="max-w-[118px] truncate rounded-full bg-violet-50 px-2 py-1 text-[9px] text-violet-700">
                          {studyScopeStudies.find((study) => study.id === documentRow.study_id)?.title || "Linked study"}
                        </span>
                      )}
                      {documentRow.pinned && <span className="text-[10px] text-amber-500">★</span>}`,
"document card format badge",
);

// Safety.
for (const required of [
  marker,
  "study_id: string | null;",
  'fetch("/api/research/study-scope"',
  "async function updateDocumentStudy",
  "function requestImageUpload",
  "selectedDocument?.study_id || null",
]) {
  if (!source.includes(required)) {
    console.error(`Safety check failed: ${required}`);
    process.exit(1);
  }
}

fs.writeFileSync(target, source, "utf8");
console.log("Patched: components/ResearchWritingWorkspace.tsx");
console.log("Study-scoped Thesis Builder v1 installed.");
