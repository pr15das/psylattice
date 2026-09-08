"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  ChevronRight,
  FilePlus2,
  FileText,
  FileUp,
  Download,
  ImagePlus,
  Settings2,
  Folder,
  FolderOpen,
  FolderPlus,
  Highlighter,
  History,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
  MessageSquareText,
  Maximize2,
  Minimize2,
  PanelRightOpen,
  Pilcrow,
  Redo2,
  Ruler,
  Save,
  Search,
  Send,
  Sparkles,
  Strikethrough,
  Table2,
  Trash2,
  Type,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FolderRow = {
  id: string;
  owner_user_id: string;
  parent_folder_id: string | null;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type DocumentType = "paper" | "outline" | "notes" | "review" | "proposal" | "general";
type FormatStyle =
  | "freeform"
  | "apa7_student"
  | "apa7_professional"
  | "mla9"
  | "chicago_turabian"
  | "ieee_conference"
  | "custom";

type EditorSettings = {
  font_family: string;
  font_size_pt: number;
  line_spacing: number;
  margin_top_in: number;
  margin_right_in: number;
  margin_bottom_in: number;
  margin_left_in: number;
  page_size: "letter" | "a4";
  first_line_indent_in: number;
  paragraph_spacing_pt: number;
  text_align: "left" | "justify";
  columns: 1 | 2;
};

type StoredEditorSettings = Partial<EditorSettings> & {
  /** Legacy Thesis Builder 1H and earlier stored one shared margin value. */
  margin_in?: number;
};

type DocumentRow = {
  id: string;
  owner_user_id: string;
  folder_id: string | null;
  title: string;
  document_type: DocumentType;
  format_style: FormatStyle;
  content_html: string;
  content_text: string;
  editor_settings: StoredEditorSettings | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

type RevisionRow = {
  id: string;
  document_id: string;
  owner_user_id: string;
  revision_reason: string;
  title_snapshot: string;
  content_html: string;
  content_text: string;
  format_style: FormatStyle;
  editor_settings: StoredEditorSettings | null;
  created_at: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ExportFormat = "pdf" | "docx";
type ImageWrapMode =
  | "inline"
  | "square"
  | "tight"
  | "through"
  | "top_bottom"
  | "behind"
  | "front";
type ImageAlignment = "left" | "center" | "right";
type SelectedTableCell = { tableId: string; row: number; column: number } | null;
type MarginSide = "top" | "right" | "bottom" | "left";

type FormatPreset = {
  id: FormatStyle;
  label: string;
  shortLabel: string;
  settings: EditorSettings;
  guidelines: string[];
  structure: string[];
  caution?: string;
  sourceLabel: string;
  sourceUrl: string;
};

const DEFAULT_SETTINGS: EditorSettings = {
  font_family: "Times New Roman",
  font_size_pt: 12,
  line_spacing: 2,
  margin_top_in: 1,
  margin_right_in: 1,
  margin_bottom_in: 1,
  margin_left_in: 1,
  page_size: "letter",
  first_line_indent_in: 0.5,
  paragraph_spacing_pt: 0,
  text_align: "left",
  columns: 1,
};

const FREEFORM_SETTINGS: EditorSettings = {
  font_family: "Times New Roman",
  font_size_pt: 12,
  line_spacing: 1,
  margin_top_in: 0,
  margin_right_in: 0,
  margin_bottom_in: 0,
  margin_left_in: 0,
  page_size: "letter",
  first_line_indent_in: 0,
  paragraph_spacing_pt: 0,
  text_align: "left",
  columns: 1,
};

const EDITOR_COLOR_SWATCHES = [
  "#0f172a",
  "#334155",
  "#64748b",
  "#94a3b8",
  "#ffffff",
  "#991b1b",
  "#dc2626",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#16a34a",
  "#059669",
  "#0891b2",
  "#0284c7",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#a21caf",
  "#db2777",
  "#ffe4e6",
  "#fef3c7",
  "#fef9c3",
  "#dcfce7",
  "#cffafe",
  "#dbeafe",
  "#ede9fe",
];

const FORMAT_PRESETS: Record<FormatStyle, FormatPreset> = {
  freeform: {
    id: "freeform",
    label: "Free form · Design it yourself",
    shortLabel: "Free form",
    settings: { ...FREEFORM_SETTINGS },
    guidelines: [
      "No academic style preset is enforced in Free form.",
      "Choose your own font, size, spacing, margins, page size, alignment, columns, tables, figures and visual layout.",
      "Use an APA, MLA, Chicago/Turabian, IEEE or institution-specific preset later if you want PsyLattice to apply a formal manuscript setup.",
    ],
    structure: ["No required section order. Build the document structure you want."],
    sourceLabel: "Free-form document",
    sourceUrl: "",
  },
  apa7_student: {
    id: "apa7_student",
    label: "APA 7 · Student paper",
    shortLabel: "APA 7 Student",
    settings: { ...DEFAULT_SETTINGS },
    guidelines: [
      "1-inch margins on every side.",
      "Double-space the paper, including the title page, headings, quotations and references.",
      "Use a legible APA-permitted font. PsyLattice uses 12-point Times New Roman as this preset's conventional default.",
      "Left-align body text; do not fully justify it.",
      "Indent the first line of body paragraphs by 0.5 inch.",
      "Student papers normally use page numbers at the top right and do not require a running head unless the instructor asks for one.",
    ],
    structure: ["Title page", "Paper title", "Introduction", "Method / main sections as appropriate", "Results", "Discussion", "References"],
    sourceLabel: "APA student-paper setup guide",
    sourceUrl: "https://www.apa.org/ed/precollege/psn/2020/09/apa-style-student-papers",
  },
  apa7_professional: {
    id: "apa7_professional",
    label: "APA 7 · Professional paper",
    shortLabel: "APA 7 Professional",
    settings: { ...DEFAULT_SETTINGS },
    guidelines: [
      "1-inch margins and double spacing are used throughout.",
      "Use a consistent legible APA-permitted font; this preset uses 12-point Times New Roman.",
      "Left-align body text and use a 0.5-inch first-line paragraph indent.",
      "Professional manuscripts normally include a title page, abstract where appropriate, page numbers, and may require a running head depending on submission requirements.",
      "Journal-specific author instructions override the generic preset.",
    ],
    structure: ["Title page", "Abstract", "Keywords", "Introduction", "Method", "Results", "Discussion", "References", "Tables / figures as required"],
    sourceLabel: "APA Style guidance",
    sourceUrl: "https://www.apa.org/ed/precollege/psn/2020/09/apa-style-student-papers",
  },
  mla9: {
    id: "mla9",
    label: "MLA 9 · Research paper",
    shortLabel: "MLA 9",
    settings: { ...DEFAULT_SETTINGS },
    guidelines: [
      "Use 1-inch margins.",
      "Double-space the entire paper, including quotations, notes and Works Cited.",
      "Use an easily readable typeface at a standard size; this preset uses 12-point Times New Roman.",
      "Keep the right margin ragged rather than fully justified.",
      "Indent the first line of each paragraph by 0.5 inch.",
      "MLA papers commonly use a first-page heading and a running header with surname and page number.",
    ],
    structure: ["First-page heading", "Centered paper title", "Main text", "Notes if used", "Works Cited"],
    sourceLabel: "MLA Style Center · Formatting a Research Paper",
    sourceUrl: "https://style.mla.org/app/uploads/sites/3/2020/12/Formatting-a-Research-Paper_v3_-The-MLA-Style-Center.pdf",
  },
  chicago_turabian: {
    id: "chicago_turabian",
    label: "Chicago / Turabian · Academic paper",
    shortLabel: "Chicago / Turabian",
    settings: { ...DEFAULT_SETTINGS },
    guidelines: [
      "One-inch margins are a typical manuscript default.",
      "Use a clear readable font. This preset uses 12-point Times New Roman.",
      "Academic manuscripts are commonly double-spaced unless an institution or publisher specifies otherwise.",
      "Use first-line paragraph indents and avoid extra blank space between ordinary paragraphs.",
      "Institutional thesis/dissertation requirements override general Chicago/Turabian defaults.",
    ],
    structure: ["Title page", "Main text / chapters", "Footnotes or endnotes if using notes-bibliography", "Bibliography / References", "Appendices as needed"],
    sourceLabel: "Chicago Manual of Style · Manuscript Preparation",
    sourceUrl: "https://www.chicagomanualofstyle.org/book/ed18/part1/ch02/toc.html",
  },
  ieee_conference: {
    id: "ieee_conference",
    label: "IEEE · Conference manuscript",
    shortLabel: "IEEE Conference",
    settings: {
      font_family: "Times New Roman",
      font_size_pt: 10,
      line_spacing: 1,
      margin_top_in: 0.75,
      margin_right_in: 0.75,
      margin_bottom_in: 0.75,
      margin_left_in: 0.75,
      page_size: "letter",
      first_line_indent_in: 0.18,
      paragraph_spacing_pt: 0,
      text_align: "justify",
      columns: 2,
    },
    guidelines: [
      "IEEE conference papers use the official conference template and a standard two-column layout.",
      "This PsyLattice preset approximates the writing canvas for drafting; the official Word/LaTeX template remains authoritative for final submission.",
      "Keep the title, author information, abstract, index terms, headings, references, figures and tables consistent with the target conference template.",
    ],
    structure: ["Title and authors", "Abstract", "Index Terms", "I. Introduction", "Methods / technical sections", "Results", "Conclusion", "Acknowledgment if needed", "References"],
    caution: "Final IEEE submissions should be transferred to or checked against the exact official template for the conference.",
    sourceLabel: "IEEE conference paper templates",
    sourceUrl: "https://events.ieee.org/planning-basics/ieee-conference-publications/publishing-information-for-ieee-conference-authors/",
  },
  custom: {
    id: "custom",
    label: "Custom / institution-specific",
    shortLabel: "Custom",
    settings: { ...DEFAULT_SETTINGS },
    guidelines: [
      "Use this mode when a journal, university, department or supervisor gives its own formatting rules.",
      "Adjust font, size, spacing and page settings manually from the toolbar.",
      "Institution-specific instructions should always override a generic style preset.",
    ],
    structure: ["Use the section order required by the target institution or journal."],
    sourceLabel: "Institution-specific instructions",
    sourceUrl: "",
  },
};

const FONT_FAMILIES = ["Times New Roman", "Arial", "Calibri", "Georgia", "Verdana", "Courier New"];
const FONT_SIZE_COMMANDS = [
  { label: "8", value: "1" },
  { label: "10", value: "2" },
  { label: "12", value: "3" },
  { label: "14", value: "4" },
  { label: "18", value: "5" },
  { label: "24", value: "6" },
  { label: "32", value: "7" },
];

function normalizeSettings(value: StoredEditorSettings | null | undefined, format: FormatStyle): EditorSettings {
  const preset = FORMAT_PRESETS[format].settings;
  const stored = value || {};
  const legacyMargin = typeof stored.margin_in === "number" ? stored.margin_in : undefined;
  const hasDirectionalMargins =
    typeof stored.margin_top_in === "number" ||
    typeof stored.margin_right_in === "number" ||
    typeof stored.margin_bottom_in === "number" ||
    typeof stored.margin_left_in === "number";

  // Free-form documents created before 1I inherited the old academic 1-inch
  // margin silently. Treat that legacy shared value as no margin so existing
  // Free-form papers become genuinely free-form. Formal presets preserve their
  // legacy shared margin by mapping it onto all four sides.
  const fallbackMargin = format === "freeform" ? 0 : legacyMargin ?? preset.margin_top_in;
  const next: EditorSettings = {
    ...preset,
    ...stored,
    margin_top_in: hasDirectionalMargins ? stored.margin_top_in ?? preset.margin_top_in : fallbackMargin,
    margin_right_in: hasDirectionalMargins ? stored.margin_right_in ?? preset.margin_right_in : fallbackMargin,
    margin_bottom_in: hasDirectionalMargins ? stored.margin_bottom_in ?? preset.margin_bottom_in : fallbackMargin,
    margin_left_in: hasDirectionalMargins ? stored.margin_left_in ?? preset.margin_left_in : fallbackMargin,
    // Free form must not inherit the historical 0.5-inch academic paragraph
    // indent from older documents/settings. Margins control the writable page
    // area; they must never create an extra gap on the first line.
    first_line_indent_in: format === "freeform" ? 0 : stored.first_line_indent_in ?? preset.first_line_indent_in,
  };

  // Never carry the legacy field back into the live settings object.
  delete (next as EditorSettings & { margin_in?: number }).margin_in;
  return next;
}

function sanitizeHtml(html: string) {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const node = parser.parseFromString(html, "text/html");
  node.querySelectorAll("script, iframe, object, embed, form, input, button, textarea, select, meta, link, style").forEach((element) => element.remove());
  node.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;
      if (name.startsWith("on")) element.removeAttribute(attribute.name);
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) element.removeAttribute(attribute.name);
    });
  });
  return node.body.innerHTML;
}

function stripHtml(html: string) {
  if (typeof window === "undefined") return html.replace(/<[^>]+>/g, " ");
  const node = document.createElement("div");
  node.innerHTML = html;
  return (node.innerText || node.textContent || "").replace(/\u00a0/g, " ").trim();
}

function relativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeFilename(value: string) {
  const cleaned = value.trim().replace(/[\/:*?"<>|]+/g, "-").replace(/\s+/g, " ");
  return cleaned || "PsyLattice thesis";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function ToolbarButton({ title, children, onClick, active = false }: { title: string; children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs transition ${
        active ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function FolderTree({
  folders,
  documents,
  selectedFolderId,
  expanded,
  onToggle,
  onSelect,
  onCreateChild,
  onRename,
  onDelete,
}: {
  folders: FolderRow[];
  documents: DocumentRow[];
  selectedFolderId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onCreateChild: (folder: FolderRow) => void;
  onRename: (folder: FolderRow) => void;
  onDelete: (folder: FolderRow) => void;
}) {
  const children = useMemo(() => {
    const map = new Map<string | null, FolderRow[]>();
    folders.forEach((folder) => {
      const key = folder.parent_folder_id || null;
      map.set(key, [...(map.get(key) || []), folder]);
    });
    map.forEach((rows) => rows.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name)));
    return map;
  }, [folders]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    documents.forEach((doc) => {
      if (doc.folder_id) map.set(doc.folder_id, (map.get(doc.folder_id) || 0) + 1);
    });
    return map;
  }, [documents]);

  function renderBranch(parentId: string | null, depth: number): React.ReactNode {
    return (children.get(parentId) || []).map((folder) => {
      const hasChildren = (children.get(folder.id) || []).length > 0;
      const open = expanded.has(folder.id);
      const active = selectedFolderId === folder.id;
      return (
        <div key={folder.id}>
          <div
            className={`group flex items-center rounded-xl ${active ? "bg-cyan-50" : "hover:bg-white"}`}
            style={{ paddingLeft: `${Math.min(depth, 8) * 14}px` }}
          >
            <button
              type="button"
              onClick={() => hasChildren && onToggle(folder.id)}
              className="flex h-8 w-7 items-center justify-center text-slate-400"
              aria-label={open ? "Collapse folder" : "Expand folder"}
            >
              {hasChildren ? open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={() => onSelect(folder.id)} className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-1 text-left">
              {open ? <FolderOpen className="h-4 w-4 shrink-0 text-cyan-700" /> : <Folder className="h-4 w-4 shrink-0 text-slate-500" />}
              <span className={`truncate text-xs ${active ? "font-semibold text-cyan-950" : "text-slate-600"}`}>{folder.name}</span>
              <span className="ml-auto text-[10px] text-slate-400">{counts.get(folder.id) || 0}</span>
            </button>
            <div className="hidden items-center pr-1 group-hover:flex">
              <button type="button" onClick={() => onCreateChild(folder)} title="New subfolder" className="p-1 text-slate-400 hover:text-cyan-700"><FolderPlus className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => onRename(folder)} title="Rename folder" className="p-1 text-slate-400 hover:text-slate-700">✎</button>
              <button type="button" onClick={() => onDelete(folder)} title="Delete folder" className="p-1 text-slate-400 hover:text-red-600">×</button>
            </div>
          </div>
          {open && renderBranch(folder.id, depth + 1)}
        </div>
      );
    });
  }

  return <>{renderBranch(null, 0)}</>;
}

type ResearchWritingWorkspaceProps = {
  onFocusModeChange?: (focused: boolean) => void;
};

export default function ResearchWritingWorkspace({
  onFocusModeChange,
}: ResearchWritingWorkspaceProps) {
  // editorRef always points at the page the researcher most recently focused.
  // pageRefs holds every visible paper page so save/AI/export can reconstruct one
  // lossless HTML document without storing page boundaries in the database.
  const editorRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const paginationTimerRef = useRef<number | null>(null);
  // Selection used by toolbar popovers. Native colour inputs steal focus from a
  // contenteditable element, so we keep an exact cloned Range and restore it
  // before applying text colour/highlight commands.
  const formattingSelectionRef = useRef<Range | null>(null);
  const formattingColorInputActiveRef = useRef(false);
  const [paginationRevision, setPaginationRevision] = useState(0);
  const [pageHtml, setPageHtml] = useState<string[]>([""]);
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [paperZoom, setPaperZoom] = useState(100);
  const [userId, setUserId] = useState("");
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [contentText, setContentText] = useState("");
  const [formatStyle, setFormatStyle] = useState<FormatStyle>("freeform");
  const [settings, setSettings] = useState<EditorSettings>(FREEFORM_SETTINGS);
  const [marginMenuOpen, setMarginMenuOpen] = useState(false);
  const [textColorMenuOpen, setTextColorMenuOpen] = useState(false);
  const [highlightColorMenuOpen, setHighlightColorMenuOpen] = useState(false);
  const [fontSizeMenuOpen, setFontSizeMenuOpen] = useState(false);
  const [selectionFontSizeValue, setSelectionFontSizeValue] = useState("3");
  const [textColorValue, setTextColorValue] = useState("#0f172a");
  const [highlightColorValue, setHighlightColorValue] = useState("#fff59d");

  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisions, setRevisions] = useState<RevisionRow[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMinimized, setAiMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatSending, setChatSending] = useState(false);
  // Session-scoped permission. It is deliberately not persisted to localStorage.
  // Once enabled, chat questions include the current paper until the researcher
  // explicitly switches access off or leaves/reloads Thesis Builder.
  const [chatUseDocument, setChatUseDocument] = useState(false);
  const [consentPrompt, setConsentPrompt] = useState<null | { kind: "enable_chat_access" | "restructure"; format?: FormatStyle }>(null);
  const [aiToast, setAiToast] = useState("");

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTitle, setImportTitle] = useState("");
  const [importFolderId, setImportFolderId] = useState("root");
  const [importing, setImporting] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [exportPageSize, setExportPageSize] = useState<"letter" | "a4">("letter");
  const [applyExportSizeToCanvas, setApplyExportSizeToCanvas] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableColumns, setTableColumns] = useState(3);
  const [selectedTableCell, setSelectedTableCell] = useState<SelectedTableCell>(null);
  const [selectedTableWidth, setSelectedTableWidth] = useState(100);

  const [imageMenuOpen, setImageMenuOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState("");
  const [selectedImageWidth, setSelectedImageWidth] = useState(60);
  const [selectedImageWrap, setSelectedImageWrap] = useState<ImageWrapMode>("inline");
  const [selectedImageAlign, setSelectedImageAlign] = useState<ImageAlignment>("center");
  const [imageUploading, setImageUploading] = useState(false);

  // Collapsing the file navigator is the dedicated paper-focus mode.
  // The parent Researcher page uses this signal to remove its large page header.
  useEffect(() => {
    onFocusModeChange?.(navigatorCollapsed || fullScreenMode);
  }, [navigatorCollapsed, fullScreenMode, onFocusModeChange]);

  useEffect(() => {
    return () => onFocusModeChange?.(false);
  }, [onFocusModeChange]);

  useEffect(() => {
    if (!fullScreenMode) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullScreenMode(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [fullScreenMode]);

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  const enterFullScreenMode = useCallback(() => {
    setFullScreenMode(true);
    setPaperZoom((current) => Math.max(current, 100));
  }, []);

  const exitFullScreenMode = useCallback(() => {
    setFullScreenMode(false);
  }, []);

  const enterFocusMode = useCallback(() => {
    setNavigatorCollapsed(true);
    setPaperZoom((current) => Math.max(current, 110));
  }, []);

  const exitFocusMode = useCallback(() => {
    setNavigatorCollapsed(false);
  }, []);

  function changePaperZoom(delta: number) {
    setPaperZoom((current) => Math.min(160, Math.max(60, current + delta)));
  }

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) || null,
    [documents, selectedDocumentId]
  );

  useEffect(() => {
    formattingSelectionRef.current = null;
    setTextColorMenuOpen(false);
    setHighlightColorMenuOpen(false);
    setFontSizeMenuOpen(false);
  }, [selectedDocumentId]);

  const currentPreset = FORMAT_PRESETS[formatStyle];

  function folderPathLabel(folderId: string | null) {
    if (!folderId || folderId === "root") return "Unfiled";
    const names: string[] = [];
    const seen = new Set<string>();
    let current = folders.find((folder) => folder.id === folderId) || null;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      names.unshift(current.name);
      current = current.parent_folder_id
        ? folders.find((folder) => folder.id === current?.parent_folder_id) || null
        : null;
    }
    return names.join(" / ") || "Unfiled";
  }

  function pageGeometry(targetSettings: EditorSettings = settings) {
    const width = targetSettings.page_size === "a4" ? 794 : 816;
    const height = targetSettings.page_size === "a4" ? 1123 : 1056;
    const top = Math.max(0, targetSettings.margin_top_in) * 96;
    const right = Math.max(0, targetSettings.margin_right_in) * 96;
    const bottom = Math.max(0, targetSettings.margin_bottom_in) * 96;
    const left = Math.max(0, targetSettings.margin_left_in) * 96;
    return {
      width,
      height,
      top,
      right,
      bottom,
      left,
      contentWidth: Math.max(120, width - left - right),
      contentHeight: Math.max(160, height - top - bottom),
    };
  }

  function clampMargin(value: number) {
    return Math.max(0, Math.min(3.5, Math.round(value * 20) / 20));
  }

  function marginValue(side: MarginSide) {
    if (side === "top") return settings.margin_top_in;
    if (side === "right") return settings.margin_right_in;
    if (side === "bottom") return settings.margin_bottom_in;
    return settings.margin_left_in;
  }

  function updateMargin(
    side: "top" | "right" | "bottom" | "left",
    value: number
  ) {
    const next = {
      ...settings,
      [`margin_${side}_in`]: clampMargin(value),
    } as EditorSettings;
    const html = combinedEditorHtml();
    setSettings(next);
    setDirty(true);
    window.requestAnimationFrame(() => replaceVisiblePages(html, next, true));
  }

  function setAllMargins(value: number) {
    const margin = clampMargin(value);
    const next: EditorSettings = {
      ...settings,
      margin_top_in: margin,
      margin_right_in: margin,
      margin_bottom_in: margin,
      margin_left_in: margin,
    };
    const html = combinedEditorHtml();
    setSettings(next);
    setDirty(true);
    window.requestAnimationFrame(() => replaceVisiblePages(html, next, true));
  }

  function resetMarginsToPreset() {
    const preset = FORMAT_PRESETS[formatStyle].settings;
    const next: EditorSettings = {
      ...settings,
      margin_top_in: preset.margin_top_in,
      margin_right_in: preset.margin_right_in,
      margin_bottom_in: preset.margin_bottom_in,
      margin_left_in: preset.margin_left_in,
    };
    const html = combinedEditorHtml();
    setSettings(next);
    setDirty(true);
    window.requestAnimationFrame(() => replaceVisiblePages(html, next, true));
  }

  function orderedPageElements() {
    return Object.entries(pageRefs.current)
      .map(([index, node]) => [Number(index), node] as const)
      .filter((entry): entry is readonly [number, HTMLDivElement] => Boolean(entry[1]))
      .sort((a, b) => a[0] - b[0])
      .map(([, node]) => node);
  }

  function combinedEditorHtml() {
    const nodes = orderedPageElements();
    if (nodes.length === 0) return contentHtml;
    return nodes.map((node) => node.innerHTML).join("");
  }

  function combinedEditorText() {
    const nodes = orderedPageElements();
    if (nodes.length === 0) return contentText;
    return nodes.map((node) => node.innerText).join("\n").trim();
  }

  function captureCaretOffset() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    let offset = 0;
    for (const page of orderedPageElements()) {
      if (page.contains(range.startContainer)) {
        const before = document.createRange();
        before.selectNodeContents(page);
        try {
          before.setEnd(range.startContainer, range.startOffset);
          return offset + before.toString().length;
        } catch {
          return offset;
        }
      }
      offset += page.textContent?.length || 0;
    }
    return null;
  }

  function restoreCaretOffset(globalOffset: number | null) {
    if (globalOffset === null) return;
    let remaining = globalOffset;
    for (const page of orderedPageElements()) {
      const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const length = node.textContent?.length || 0;
        if (remaining <= length) {
          const range = document.createRange();
          range.setStart(node, Math.max(0, Math.min(remaining, length)));
          range.collapse(true);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          page.focus();
          editorRef.current = page;
          return;
        }
        remaining -= length;
        node = walker.nextNode();
      }
    }
    const lastPage = orderedPageElements().at(-1);
    if (lastPage) {
      lastPage.focus();
      editorRef.current = lastPage;
      document.execCommand("selectAll", false);
      const selection = window.getSelection();
      selection?.collapseToEnd();
    }
  }

  function paginateHtml(rawHtml: string, targetSettings: EditorSettings = settings) {
    const safe = sanitizeHtml(rawHtml || "");
    if (typeof document === "undefined" || !safe.trim()) return [safe];

    const source = document.createElement("div");
    source.innerHTML = safe;
    const nodes = Array.from(source.childNodes).map((node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        const paragraph = document.createElement("p");
        paragraph.textContent = node.textContent;
        return paragraph;
      }
      return node;
    }).filter((node) => !(node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()));

    if (nodes.length === 0) return [""];

    const geometry = pageGeometry(targetSettings);
    const measure = document.createElement("div");
    measure.className = "research-paper-editor research-paper-measure";
    Object.assign(measure.style, {
      position: "fixed",
      visibility: "hidden",
      pointerEvents: "none",
      left: "-100000px",
      top: "0",
      width: `${targetSettings.columns === 2 ? (geometry.contentWidth - 26) / 2 : geometry.contentWidth}px`,
      fontFamily: targetSettings.font_family,
      fontSize: `${targetSettings.font_size_pt}pt`,
      lineHeight: String(targetSettings.line_spacing),
      textAlign: targetSettings.text_align,
      boxSizing: "border-box",
    });
    document.body.appendChild(measure);

    const maxFlowHeight = geometry.contentHeight * targetSettings.columns;
    const pages: string[] = [];
    let hasContent = false;

    const finishPage = () => {
      pages.push(measure.innerHTML);
      measure.innerHTML = "";
      hasContent = false;
    };

    for (const sourceNode of nodes) {
      const clone = sourceNode.cloneNode(true);
      measure.appendChild(clone);
      const overflowed = measure.scrollHeight > maxFlowHeight + 2;
      if (overflowed && hasContent) {
        measure.removeChild(clone);
        finishPage();
        measure.appendChild(clone);
        hasContent = true;
      } else {
        hasContent = true;
      }
    }
    if (hasContent || pages.length === 0) finishPage();
    measure.remove();
    return pages.length ? pages : [""];
  }

  function replaceVisiblePages(rawHtml: string, targetSettings: EditorSettings = settings, preserveCaret = false) {
    const caret = preserveCaret ? captureCaretOffset() : null;
    const nextPages = paginateHtml(rawHtml, targetSettings);
    pageRefs.current = {};
    setPageHtml(nextPages);
    setPaginationRevision((current) => current + 1);
    window.requestAnimationFrame(() => {
      editorRef.current = pageRefs.current[0] || null;
      if (preserveCaret) restoreCaretOffset(caret);
    });
  }

  function schedulePagination() {
    if (paginationTimerRef.current !== null) window.clearTimeout(paginationTimerRef.current);
    paginationTimerRef.current = window.setTimeout(() => {
      paginationTimerRef.current = null;
      replaceVisiblePages(combinedEditorHtml(), settings, true);
    }, 180);
  }

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents
      .filter((document) => {
        if (selectedFolderId === "root") return !document.folder_id;
        if (selectedFolderId !== "all") return document.folder_id === selectedFolderId;
        return true;
      })
      .filter((document) => !query || `${document.title} ${document.content_text}`.toLowerCase().includes(query))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [documents, selectedFolderId, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      setError("Your Thesis Builder could not be authenticated.");
      setLoading(false);
      return;
    }
    setUserId(auth.user.id);
    const [folderResult, documentResult] = await Promise.all([
      supabase.from("research_writing_folders").select("id,owner_user_id,parent_folder_id,name,position,created_at,updated_at").order("position").order("name"),
      supabase.from("research_writing_documents").select("id,owner_user_id,folder_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at").order("updated_at", { ascending: false }),
    ]);
    const firstError = folderResult.error || documentResult.error;
    if (firstError) {
      setError(firstError.message || "The Thesis Builder could not be loaded.");
      setLoading(false);
      return;
    }
    const nextFolders = (folderResult.data || []) as FolderRow[];
    const nextDocuments = (documentResult.data || []) as DocumentRow[];
    setFolders(nextFolders);
    setDocuments(nextDocuments);
    setExpandedFolders(new Set(nextFolders.filter((f) => !f.parent_folder_id).map((f) => f.id)));
    const preferred = window.localStorage.getItem("psylattice-writing-document-id") || "";
    const preferredExists = nextDocuments.some((document) => document.id === preferred);
    const nextId = preferredExists ? preferred : nextDocuments[0]?.id || "";
    setSelectedDocumentId(nextId);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedDocument) {
      setTitle("");
      setContentHtml("");
      setContentText("");
      setSelectedImageId("");
      setSelectedTableCell(null);
      pageRefs.current = {};
      setPageHtml([""]);
      setPaginationRevision((current) => current + 1);
      return;
    }
    const nextFormat = selectedDocument.format_style || "freeform";
    const nextSettings = normalizeSettings(selectedDocument.editor_settings, nextFormat);
    const nextHtml = selectedDocument.content_html || "";
    setTitle(selectedDocument.title);
    setContentHtml(nextHtml);
    setContentText(selectedDocument.content_text || "");
    setFormatStyle(nextFormat);
    setSettings(nextSettings);
    setExportPageSize(nextSettings.page_size);
    setSelectedImageId("");
    setSelectedTableCell(null);
    setDirty(false);
    window.localStorage.setItem("psylattice-writing-document-id", selectedDocument.id);
    window.requestAnimationFrame(() => replaceVisiblePages(nextHtml, nextSettings, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocument]);

  async function saveDocument() {
    if (!selectedDocument || !userId || saving) return;
    setSaving(true);
    setNotice("");
    setError("");
    const supabase = createClient();
    const safeHtml = sanitizeHtml(combinedEditorHtml());
    const safeText = combinedEditorText();
    const nextTitle = title.trim() || "Untitled document";
    const { data, error: saveError } = await supabase
      .from("research_writing_documents")
      .update({
        title: nextTitle,
        content_html: safeHtml,
        content_text: safeText,
        format_style: formatStyle,
        editor_settings: settings,
      })
      .eq("id", selectedDocument.id)
      .eq("owner_user_id", userId)
      .select("id,owner_user_id,folder_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at")
      .single();
    if (saveError || !data) {
      setError(saveError?.message || "This document could not be saved.");
      setSaving(false);
      return;
    }
    setDocuments((current) => current.map((row) => (row.id === data.id ? (data as DocumentRow) : row)));
    setContentHtml(safeHtml);
    setContentText(safeText);
    setDirty(false);
    setNotice("Saved");
    setSaving(false);
  }

  // Intentionally no autosave. Draft changes remain local until the researcher
  // explicitly presses Save. Reloading or reopening the document restores the
  // last saved database version.

  function captureEditor(pageIndex?: number, forceRepaginate = false) {
    if (typeof pageIndex === "number" && pageRefs.current[pageIndex]) {
      editorRef.current = pageRefs.current[pageIndex];
    }
    setContentHtml(combinedEditorHtml());
    setContentText(combinedEditorText());
    setDirty(true);
    const activePage = typeof pageIndex === "number" ? pageRefs.current[pageIndex] : editorRef.current;
    if (forceRepaginate || (activePage && activePage.scrollHeight > activePage.clientHeight + 2)) {
      schedulePagination();
    }
  }

  function captureFormattingSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const page = orderedPageElements().find((candidate) =>
      candidate.contains(range.commonAncestorContainer)
    );
    if (!page) return;
    editorRef.current = page;
    formattingSelectionRef.current = range.cloneRange();
  }

  function restoreFormattingSelection() {
    const stored = formattingSelectionRef.current;
    if (!stored) return false;

    const page = orderedPageElements().find((candidate) =>
      candidate.contains(stored.commonAncestorContainer)
    );
    if (!page) {
      formattingSelectionRef.current = null;
      return false;
    }

    page.focus({ preventScroll: true });
    editorRef.current = page;
    const selection = window.getSelection();
    if (!selection) return false;
    try {
      selection.removeAllRanges();
      selection.addRange(stored.cloneRange());
      return true;
    } catch {
      formattingSelectionRef.current = null;
      return false;
    }
  }

  function applyPreservedFormatting(command: "foreColor" | "hiliteColor", value: string) {
    restoreFormattingSelection();
    if (!editorRef.current) return;
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    captureFormattingSelection();
    captureEditor();
  }

  // Native <select> controls steal focus from contenteditable in Safari. Font
  // size therefore uses the same saved-Range flow as colour/highlight so the
  // exact selected text remains selected while the size menu is open.
  function applyPreservedFontSize(value: string) {
    restoreFormattingSelection();
    if (!editorRef.current) return;
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("fontSize", false, value);
    captureFormattingSelection();
    captureEditor();
  }

  function execCommand(command: string, value?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    captureEditor();
  }

  function createLink() {
    const url = window.prompt("Paste a link URL");
    if (url?.trim()) execCommand("createLink", url.trim());
  }

  function elementInPages<T extends Element>(selector: string): T | null {
    for (const page of orderedPageElements()) {
      const match = page.querySelector<T>(selector);
      if (match) return match;
    }
    return null;
  }

  function currentTableFrame() {
    if (!selectedTableCell) return null;
    return elementInPages<HTMLElement>(`[data-psylattice-table-id="${selectedTableCell.tableId}"]`);
  }

  function currentImageFrame() {
    if (!selectedImageId) return null;
    return elementInPages<HTMLElement>(`[data-psylattice-image-id="${selectedImageId}"]`);
  }

  function insertTable(rows = tableRows, columns = tableColumns) {
    const safeRows = Math.max(1, Math.min(30, Number(rows) || 1));
    const safeColumns = Math.max(1, Math.min(12, Number(columns) || 1));
    const tableId = crypto.randomUUID();
    const cells = Array.from({ length: safeRows }, (_, row) =>
      `<tr>${Array.from({ length: safeColumns }, (_, column) =>
        `<${row === 0 ? "th" : "td"}>${row === 0 ? `Heading ${column + 1}` : "Cell"}</${row === 0 ? "th" : "td"}>`
      ).join("")}</tr>`
    ).join("");
    execCommand(
      "insertHTML",
      `<div class="research-table-frame" data-psylattice-table-id="${tableId}" style="width:100%;max-width:100%;position:relative;margin:1em 0;clear:both;" contenteditable="false"><table contenteditable="true"><tbody>${cells}</tbody></table><span class="research-table-resize-handle" contenteditable="false" title="Drag to resize table">↘</span></div><p><br></p>`
    );
    setSelectedTableCell({ tableId, row: 0, column: 0 });
    setSelectedTableWidth(100);
    setTableMenuOpen(true);
    window.setTimeout(schedulePagination, 0);
  }

  function ensureTableFrame(table: HTMLTableElement) {
    const existing = table.closest<HTMLElement>(".research-table-frame");
    if (existing?.dataset.psylatticeTableId) return existing;
    const frame = document.createElement("div");
    frame.className = "research-table-frame";
    frame.dataset.psylatticeTableId = crypto.randomUUID();
    frame.setAttribute("contenteditable", "false");
    Object.assign(frame.style, {
      width: "100%",
      maxWidth: "100%",
      position: "relative",
      margin: "1em 0",
      clear: "both",
    });
    const parent = table.parentNode;
    if (!parent) return null;
    parent.insertBefore(frame, table);
    frame.appendChild(table);
    table.setAttribute("contenteditable", "true");
    const handle = document.createElement("span");
    handle.className = "research-table-resize-handle";
    handle.setAttribute("contenteditable", "false");
    handle.title = "Drag to resize table";
    handle.textContent = "↘";
    frame.appendChild(handle);
    return frame;
  }

  function mutateSelectedTable(mutator: (table: HTMLTableElement, frame: HTMLElement) => void) {
    const frame = currentTableFrame();
    const table = frame?.querySelector<HTMLTableElement>("table") || null;
    if (!frame || !table) return;
    mutator(table, frame);
    captureEditor();
    window.setTimeout(schedulePagination, 0);
  }

  function addTableRow() {
    mutateSelectedTable((table) => {
      const columnCount = Math.max(1, table.rows[0]?.cells.length || table.rows[table.rows.length - 1]?.cells.length || 1);
      const row = table.insertRow(-1);
      for (let index = 0; index < columnCount; index += 1) {
        const cell = row.insertCell(-1);
        cell.textContent = "Cell";
      }
    });
  }

  function addTableColumn() {
    mutateSelectedTable((table) => {
      Array.from(table.rows).forEach((row, rowIndex) => {
        const tag = rowIndex === 0 && row.cells[0]?.tagName === "TH" ? "th" : "td";
        const cell = document.createElement(tag);
        cell.textContent = rowIndex === 0 ? `Heading ${row.cells.length + 1}` : "Cell";
        row.appendChild(cell);
      });
    });
  }

  function deleteTableRow() {
    const selection = selectedTableCell;
    if (!selection) return;
    mutateSelectedTable((table) => {
      if (table.rows.length <= 1) return;
      table.deleteRow(Math.min(selection.row, table.rows.length - 1));
      setSelectedTableCell((current) => current ? { ...current, row: Math.max(0, Math.min(current.row, table.rows.length - 1)) } : current);
    });
  }

  function deleteTableColumn() {
    const selection = selectedTableCell;
    if (!selection) return;
    mutateSelectedTable((table) => {
      const maxColumns = Math.max(0, ...Array.from(table.rows).map((row) => row.cells.length));
      if (maxColumns <= 1) return;
      Array.from(table.rows).forEach((row) => {
        if (row.cells.length > selection.column) row.deleteCell(selection.column);
      });
      setSelectedTableCell((current) => current ? { ...current, column: Math.max(0, current.column - (current.column >= maxColumns - 1 ? 1 : 0)) } : current);
    });
  }

  function toggleTableHeaderRow() {
    mutateSelectedTable((table) => {
      const row = table.rows[0];
      if (!row) return;
      const shouldBecomeHeader = Array.from(row.cells).some((cell) => cell.tagName !== "TH");
      Array.from(row.cells).forEach((cell) => {
        const replacement = document.createElement(shouldBecomeHeader ? "th" : "td");
        replacement.innerHTML = cell.innerHTML;
        Array.from(cell.attributes).forEach((attribute) => replacement.setAttribute(attribute.name, attribute.value));
        cell.replaceWith(replacement);
      });
    });
  }

  function setTableWidthPercent(value: number) {
    const width = Math.max(25, Math.min(100, Math.round(value)));
    setSelectedTableWidth(width);
    mutateSelectedTable((_table, frame) => {
      frame.style.width = `${width}%`;
    });
  }

  function deleteSelectedTable() {
    const frame = currentTableFrame();
    if (!frame) return;
    if (!window.confirm("Delete this table?")) return;
    frame.remove();
    setSelectedTableCell(null);
    setTableMenuOpen(false);
    captureEditor();
    schedulePagination();
  }

  function applyImageLayout(
    wrap: ImageWrapMode = selectedImageWrap,
    align: ImageAlignment = selectedImageAlign,
    width: number = selectedImageWidth
  ) {
    const frame = currentImageFrame();
    if (!frame) return;
    const safeWidth = Math.max(10, Math.min(100, Math.round(width)));
    const image = frame.querySelector<HTMLImageElement>("img");
    frame.dataset.wrap = wrap;
    frame.dataset.align = align;
    frame.dataset.width = String(safeWidth);
    frame.style.width = `${safeWidth}%`;
    frame.style.maxWidth = "100%";
    frame.style.float = "none";
    frame.style.clear = "none";
    frame.style.position = "relative";
    frame.style.zIndex = "auto";
    frame.style.left = "auto";
    frame.style.right = "auto";
    frame.style.transform = "none";
    frame.style.margin = "12px auto";
    frame.style.display = "block";
    frame.style.shapeOutside = "none";
    frame.style.shapeMargin = "0";

    if (wrap === "inline") {
      frame.style.display = "inline-block";
      frame.style.verticalAlign = "middle";
      frame.style.margin = "0 6px";
    } else if (wrap === "square" || wrap === "tight" || wrap === "through") {
      frame.style.float = align === "right" ? "right" : "left";
      frame.style.margin = align === "right" ? "8px 0 12px 16px" : "8px 16px 12px 0";
      if ((wrap === "tight" || wrap === "through") && image?.src) {
        frame.style.shapeOutside = `url("${image.src.replaceAll('"', '%22')}")`;
        frame.style.shapeMargin = wrap === "tight" ? "6px" : "0px";
      }
    } else if (wrap === "top_bottom") {
      frame.style.clear = "both";
      frame.style.margin = align === "left" ? "12px auto 12px 0" : align === "right" ? "12px 0 12px auto" : "12px auto";
    } else if (wrap === "behind" || wrap === "front") {
      frame.style.position = "absolute";
      frame.style.zIndex = wrap === "behind" ? "0" : "20";
      frame.style.pointerEvents = "auto";
      if (align === "left") frame.style.left = "0";
      if (align === "right") frame.style.right = "0";
      if (align === "center") {
        frame.style.left = "50%";
        frame.style.transform = "translateX(-50%)";
      }
      frame.style.margin = "0";
    }

    setSelectedImageWrap(wrap);
    setSelectedImageAlign(align);
    setSelectedImageWidth(safeWidth);
    captureEditor();
    window.setTimeout(schedulePagination, 0);
  }

  function syncSelectedImage(frame: HTMLElement) {
    const imageId = frame.dataset.psylatticeImageId || "";
    if (!imageId) return;
    const width = Number.parseFloat(frame.dataset.width || frame.style.width || "60") || 60;
    setSelectedImageId(imageId);
    setSelectedImageWidth(Math.max(10, Math.min(100, width)));
    setSelectedImageWrap((frame.dataset.wrap as ImageWrapMode) || "top_bottom");
    setSelectedImageAlign((frame.dataset.align as ImageAlignment) || "center");
    setImageMenuOpen(true);
  }

  function deleteSelectedImage() {
    const frame = currentImageFrame();
    if (!frame) return;
    if (!window.confirm("Delete this image?")) return;
    frame.remove();
    setSelectedImageId("");
    setImageMenuOpen(false);
    captureEditor(undefined, true);
    window.setTimeout(schedulePagination, 0);
    setNotice("Image deleted.");
  }

  function caretRangeAtPoint(x: number, y: number): Range | null {
    const doc = document as Document & {
      caretRangeFromPoint?: (clientX: number, clientY: number) => Range | null;
      caretPositionFromPoint?: (clientX: number, clientY: number) => { offsetNode: Node; offset: number } | null;
    };
    if (doc.caretRangeFromPoint) return doc.caretRangeFromPoint(x, y);
    const position = doc.caretPositionFromPoint?.(x, y);
    if (!position) return null;
    const range = document.createRange();
    range.setStart(position.offsetNode, position.offset);
    range.collapse(true);
    return range;
  }

  function editorAtPoint(x: number, y: number) {
    const hit = document.elementFromPoint(x, y) as HTMLElement | null;
    return hit?.closest<HTMLElement>(".research-paper-editor") || null;
  }

  async function imageFileToDataUrl(file: File) {
    if (!file.type.startsWith("image/")) throw new Error("Choose a PNG, JPEG, WEBP or other browser-supported image.");
    if (file.size > 12 * 1024 * 1024) throw new Error("Images must be 12 MB or smaller.");
    const original = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("That image could not be read."));
      reader.readAsDataURL(file);
    });
    const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("That image could not be decoded."));
      image.src = original;
    });
    const maxDimension = 2400;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.naturalWidth || 1, bitmap.naturalHeight || 1));
    if (scale >= 0.999) return original;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(bitmap.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return original;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    return canvas.toDataURL(mime, mime === "image/jpeg" ? 0.9 : undefined);
  }

  async function insertImageFile(file: File) {
    if (!editorRef.current || imageUploading) return;
    setImageUploading(true);
    setError("");
    try {
      const src = await imageFileToDataUrl(file);
      const imageId = crypto.randomUUID();
      const alt = escapeHtml(file.name.replace(/\.[^.]+$/, ""));
      execCommand(
        "insertHTML",
        `<span class="research-image-frame" data-psylattice-image-id="${imageId}" data-wrap="top_bottom" data-align="center" data-width="60" contenteditable="false" title="Drag image to reposition" style="display:block;position:relative;width:60%;max-width:100%;margin:12px auto;clear:both;"><img src="${src}" alt="${alt}" draggable="false" style="display:block;width:100%;height:auto;max-width:100%;pointer-events:none;"><span class="research-image-resize-handle" contenteditable="false" title="Drag to resize image">↘</span></span><p><br></p>`
      );
      setSelectedImageId(imageId);
      setSelectedImageWidth(60);
      setSelectedImageWrap("top_bottom");
      setSelectedImageAlign("center");
      setImageMenuOpen(true);
      setNotice("Image inserted. Drag the picture itself to reposition it, drag ↘ to resize, or use Picture layout for wrapping.");
      window.setTimeout(schedulePagination, 0);
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "The image could not be inserted.");
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  function handleEditorClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const imageFrame = target.closest<HTMLElement>("[data-psylattice-image-id]");
    if (imageFrame?.dataset.psylatticeImageId) {
      syncSelectedImage(imageFrame);
      return;
    }

    const cell = target.closest<HTMLTableCellElement>("td,th");
    const table = target.closest<HTMLTableElement>("table");
    if (table) {
      const frame = ensureTableFrame(table);
      if (frame?.dataset.psylatticeTableId) {
        const row = cell?.parentElement instanceof HTMLTableRowElement ? cell.parentElement.rowIndex : 0;
        const column = cell?.cellIndex ?? 0;
        setSelectedTableCell({ tableId: frame.dataset.psylatticeTableId, row, column });
        setSelectedTableWidth(Math.round(Number.parseFloat(frame.style.width || "100")) || 100);
        setTableMenuOpen(true);
        captureEditor();
      }
      return;
    }
  }

  function handleEditorPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const imageHandle = target.closest<HTMLElement>(".research-image-resize-handle");
    const tableHandle = target.closest<HTMLElement>(".research-table-resize-handle");
    const resizeFrame = imageHandle?.closest<HTMLElement>("[data-psylattice-image-id]") || tableHandle?.closest<HTMLElement>("[data-psylattice-table-id]");

    // Existing direct resize behaviour for images and tables.
    if (resizeFrame && (imageHandle || tableHandle)) {
      event.preventDefault();
      event.stopPropagation();
      const editor = resizeFrame.closest<HTMLElement>(".research-paper-editor");
      if (!editor) return;
      const startX = event.clientX;
      const startWidth = resizeFrame.getBoundingClientRect().width;
      const editorWidth = Math.max(1, editor.getBoundingClientRect().width);
      const minPercent = imageHandle ? 10 : 25;
      const move = (moveEvent: PointerEvent) => {
        const nextPixels = Math.max(editorWidth * minPercent / 100, Math.min(editorWidth, startWidth + moveEvent.clientX - startX));
        const percent = Math.max(minPercent, Math.min(100, Math.round((nextPixels / editorWidth) * 100)));
        resizeFrame.style.width = `${percent}%`;
        if (imageHandle) {
          resizeFrame.dataset.width = String(percent);
          setSelectedImageWidth(percent);
        } else {
          setSelectedTableWidth(percent);
        }
      };
      const up = () => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        captureEditor();
        window.setTimeout(schedulePagination, 0);
      };
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up, { once: true });
      return;
    }

    // Drag the image itself to move it. Flowing wrap modes are dropped at the
    // nearest text caret; front/behind modes are freely positioned on a page.
    const imageFrame = target.closest<HTMLElement>("[data-psylattice-image-id]");
    if (!imageFrame) return;
    syncSelectedImage(imageFrame);
    event.preventDefault();
    event.stopPropagation();

    const startEditor = imageFrame.closest<HTMLElement>(".research-paper-editor");
    if (!startEditor) return;
    const wrap = (imageFrame.dataset.wrap as ImageWrapMode) || "top_bottom";
    const freePosition = wrap === "front" || wrap === "behind";
    const startX = event.clientX;
    const startY = event.clientY;
    let lastX = startX;
    let lastY = startY;
    let moved = false;
    const previousTransform = imageFrame.style.transform;

    imageFrame.classList.add("research-image-dragging");

    const move = (moveEvent: PointerEvent) => {
      lastX = moveEvent.clientX;
      lastY = moveEvent.clientY;
      const dx = lastX - startX;
      const dy = lastY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;

      if (freePosition) {
        const oldPointerEvents = imageFrame.style.pointerEvents;
        imageFrame.style.pointerEvents = "none";
        const destinationEditor = editorAtPoint(lastX, lastY) || startEditor;
        imageFrame.style.pointerEvents = oldPointerEvents || "auto";
        if (destinationEditor !== imageFrame.parentElement && destinationEditor !== imageFrame.closest(".research-paper-editor")) {
          destinationEditor.appendChild(imageFrame);
        }
        const editorRect = destinationEditor.getBoundingClientRect();
        const frameRect = imageFrame.getBoundingClientRect();
        const left = Math.max(0, Math.min(Math.max(0, editorRect.width - frameRect.width), lastX - editorRect.left - frameRect.width / 2));
        const top = Math.max(0, Math.min(Math.max(0, editorRect.height - frameRect.height), lastY - editorRect.top - 18));
        imageFrame.style.position = "absolute";
        imageFrame.style.float = "none";
        imageFrame.style.clear = "none";
        imageFrame.style.left = `${Math.round(left)}px`;
        imageFrame.style.top = `${Math.round(top)}px`;
        imageFrame.style.right = "auto";
        imageFrame.style.transform = "none";
        imageFrame.style.margin = "0";
        imageFrame.dataset.freeX = String(Math.round(left));
        imageFrame.dataset.freeY = String(Math.round(top));
      } else {
        imageFrame.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
    };

    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      imageFrame.classList.remove("research-image-dragging");

      if (moved && !freePosition) {
        imageFrame.style.transform = previousTransform || "none";
        const oldPointerEvents = imageFrame.style.pointerEvents;
        imageFrame.style.pointerEvents = "none";
        const range = caretRangeAtPoint(lastX, lastY);
        imageFrame.style.pointerEvents = oldPointerEvents || "auto";
        if (range) {
          const container = range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
          const destinationEditor = container?.closest<HTMLElement>(".research-paper-editor");
          if (destinationEditor && !imageFrame.contains(range.startContainer)) {
            range.insertNode(imageFrame);
            applyImageLayout(wrap, (imageFrame.dataset.align as ImageAlignment) || "center", Number(imageFrame.dataset.width || 60));
          }
        }
      } else if (!moved) {
        imageFrame.style.transform = previousTransform;
      }

      captureEditor(undefined, true);
      window.setTimeout(schedulePagination, 0);
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up, { once: true });
  }

  function plainTextToHtml(text: string) {
    const normalized = text.replace(/\r\n?/g, "\n").trim();
    if (!normalized) return "";
    return normalized
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
      .join("");
  }

  async function importExistingDocument() {
    if (!importFile || !userId || importing) return;
    if (!confirmDiscardUnsavedChanges()) return;
    setImporting(true);
    setError("");
    setNotice("");
    try {
      const extension = importFile.name.split(".").pop()?.toLowerCase() || "";
      let importedHtml = "";
      if (extension === "docx") {
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml({ arrayBuffer: await importFile.arrayBuffer() });
        importedHtml = result.value || "";
      } else if (extension === "html" || extension === "htm") {
        importedHtml = await importFile.text();
      } else if (extension === "txt" || extension === "md" || extension === "markdown") {
        importedHtml = plainTextToHtml(await importFile.text());
      } else {
        throw new Error("Import currently supports Word .docx, HTML, Markdown and plain-text documents.");
      }
      const safeHtml = sanitizeHtml(importedHtml);
      const safeText = stripHtml(safeHtml);
      const targetFolder = importFolderId === "root" ? null : importFolderId;
      const nextTitle = importTitle.trim() || importFile.name.replace(/\.[^.]+$/, "") || "Imported paper";
      const supabase = createClient();
      const { data, error: importError } = await supabase
        .from("research_writing_documents")
        .insert({
          owner_user_id: userId,
          folder_id: targetFolder,
          title: nextTitle,
          document_type: "paper",
          format_style: "freeform",
          content_html: safeHtml,
          content_text: safeText,
          editor_settings: FREEFORM_SETTINGS,
        })
        .select("id,owner_user_id,folder_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at")
        .single();
      if (importError || !data) throw new Error(importError?.message || "The imported paper could not be saved.");
      setDocuments((current) => [data as DocumentRow, ...current]);
      setSelectedDocumentId(data.id);
      setSelectedFolderId(targetFolder || "root");
      setImportOpen(false);
      setImportFile(null);
      setImportTitle("");
      setNotice(`Imported ${importFile.name} into ${folderPathLabel(targetFolder)}.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "The document could not be imported.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function exportCurrentDocument() {
    if (!selectedDocument || exporting) return;
    setExporting(true);
    setError("");
    try {
      const filename = safeFilename(title || selectedDocument.title);
      if (applyExportSizeToCanvas && settings.page_size !== exportPageSize) {
        const nextSettings = { ...settings, page_size: exportPageSize };
        setSettings(nextSettings);
        setDirty(true);
        window.setTimeout(() => replaceVisiblePages(combinedEditorHtml(), nextSettings, true), 0);
      }
      if (exportFormat === "docx") {
        // html-docx-js-typescript builds Word files around the legacy altChunk
        // mechanism. Those files can download successfully yet open as blank in
        // some Word/Office environments. Use dom-docx instead so the exported
        // document contains native editable OOXML paragraphs/tables/images.
        const { convertHtmlToDocx } = await import("dom-docx/browser");
        const exportSettings: EditorSettings = { ...settings, page_size: exportPageSize };
        const docxPages = paginateHtml(combinedEditorHtml(), exportSettings);
        const docxHtml = docxPages
          .map((page, index) => `${page}${index < docxPages.length - 1 ? '<div style="break-after:page"></div>' : ''}`)
          .join("");

        const exportRoot = document.createElement("div");
        exportRoot.className = "research-paper-editor";
        Object.assign(exportRoot.style, {
          position: "fixed",
          left: "-100000px",
          top: "0",
          width: `${Math.max(1, pageGeometry(exportSettings).contentWidth)}px`,
          backgroundColor: "#ffffff",
          color: "#0f172a",
          fontFamily: exportSettings.font_family,
          fontSize: `${exportSettings.font_size_pt}pt`,
          lineHeight: String(exportSettings.line_spacing),
          textAlign: exportSettings.text_align,
          pointerEvents: "none",
          zIndex: "-1",
        });
        exportRoot.innerHTML = sanitizeHtml(docxHtml);
        exportRoot.querySelectorAll(".research-image-resize-handle,.research-table-resize-handle").forEach((node) => node.remove());
        document.body.appendChild(exportRoot);

        try {
          if (document.fonts?.ready) await document.fonts.ready;
          const blob = await convertHtmlToDocx(exportRoot.innerHTML, {
            styleSource: "computed",
            root: exportRoot,
            pageSize: exportPageSize,
            orientation: "portrait",
            margins: {
              top: exportSettings.margin_top_in,
              right: exportSettings.margin_right_in,
              bottom: exportSettings.margin_bottom_in,
              left: exportSettings.margin_left_in,
            },
            defaultFont: {
              family: exportSettings.font_family,
              sizePt: exportSettings.font_size_pt,
            },
            metadata: {
              title: title || selectedDocument.title || "PsyLattice thesis",
              creator: "PsyLattice Thesis Builder",
            },
          });
          downloadBlob(blob, `${filename}.docx`);
        } finally {
          exportRoot.remove();
        }
      } else {
        // Tailwind 4 and modern browsers can expose colours as oklch()/oklab()/color(),
        // which the html2canvas bundled inside html2pdf.js cannot parse. Render the
        // already-paginated Thesis Builder pages with html2canvas-pro instead; it
        // supports modern CSS colour functions and keeps PDF page boundaries aligned
        // with the Thesis Builder's own pagination.
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import("html2canvas-pro"),
          import("jspdf"),
        ]);

        const exportSettings: EditorSettings = { ...settings, page_size: exportPageSize };
        const exportGeometry = pageGeometry(exportSettings);
        const pdfPages = paginateHtml(combinedEditorHtml(), exportSettings);
        const pageWidthIn = exportPageSize === "a4" ? 8.27 : 8.5;
        const pageHeightIn = exportPageSize === "a4" ? 11.69 : 11;

        const mount = document.createElement("div");
        Object.assign(mount.style, {
          position: "fixed",
          left: "-100000px",
          top: "0",
          width: `${exportGeometry.width}px`,
          background: "#ffffff",
          pointerEvents: "none",
          zIndex: "-1",
        });
        document.body.appendChild(mount);

        try {
          if (document.fonts?.ready) await document.fonts.ready;

          const pdf = new jsPDF({
            unit: "in",
            format: exportPageSize === "a4" ? "a4" : "letter",
            orientation: "portrait",
            compress: true,
          });

          for (let pageIndex = 0; pageIndex < pdfPages.length; pageIndex += 1) {
            const page = document.createElement("div");
            Object.assign(page.style, {
              width: `${exportGeometry.width}px`,
              height: `${exportGeometry.height}px`,
              padding: `${exportGeometry.top}px ${exportGeometry.right}px ${exportGeometry.bottom}px ${exportGeometry.left}px`,
              boxSizing: "border-box",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              color: "#0f172a",
            });

            const content = document.createElement("div");
            content.className = "research-paper-editor";
            Object.assign(content.style, {
              width: "100%",
              height: `${exportGeometry.contentHeight}px`,
              overflow: "hidden",
              fontFamily: exportSettings.font_family,
              fontSize: `${exportSettings.font_size_pt}pt`,
              lineHeight: String(exportSettings.line_spacing),
              textAlign: exportSettings.text_align,
              columnCount: String(exportSettings.columns),
              columnGap: exportSettings.columns === 2 ? "0.28in" : "normal",
              columnFill: exportSettings.columns === 2 ? "auto" : "balance",
              outline: "none",
            });
            content.innerHTML = pdfPages[pageIndex] || "";

            // Editing-only controls must never appear in the exported document.
            content
              .querySelectorAll(".research-image-resize-handle, .research-table-resize-handle")
              .forEach((element) => element.remove());
            content.querySelectorAll("[contenteditable]").forEach((element) => element.removeAttribute("contenteditable"));
            content.querySelectorAll("[title]").forEach((element) => element.removeAttribute("title"));

            page.appendChild(content);
            mount.appendChild(page);

            const images = Array.from(content.querySelectorAll("img"));
            await Promise.all(
              images.map((image) =>
                image.complete
                  ? Promise.resolve()
                  : new Promise<void>((resolve) => {
                      const finish = () => resolve();
                      image.addEventListener("load", finish, { once: true });
                      image.addEventListener("error", finish, { once: true });
                    })
              )
            );

            const canvas = await html2canvas(page, {
              scale: 2,
              useCORS: true,
              backgroundColor: "#ffffff",
              logging: false,
              width: exportGeometry.width,
              height: exportGeometry.height,
              windowWidth: exportGeometry.width,
              windowHeight: exportGeometry.height,
            });

            if (pageIndex > 0) {
              pdf.addPage(exportPageSize === "a4" ? "a4" : "letter", "portrait");
            }
            pdf.addImage(
              canvas.toDataURL("image/jpeg", 0.98),
              "JPEG",
              0,
              0,
              pageWidthIn,
              pageHeightIn,
              undefined,
              "FAST"
            );
            page.remove();
          }

          pdf.save(`${filename}.pdf`);
        } finally {
          mount.remove();
        }
      }
      setExportOpen(false);
      setNotice(`Exported ${filename}.${exportFormat}.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "The paper could not be exported.");
    } finally {
      setExporting(false);
    }
  }

  async function createFolder(parentFolderId: string | null = null) {
    if (!userId) return;
    const parentName = parentFolderId ? folders.find((folder) => folder.id === parentFolderId)?.name : null;
    const name = window.prompt(parentName ? `New folder inside “${parentName}”` : "New top-level folder name");
    if (!name?.trim()) return;
    const supabase = createClient();
    const { data, error: createError } = await supabase
      .from("research_writing_folders")
      .insert({ owner_user_id: userId, parent_folder_id: parentFolderId, name: name.trim(), position: folders.length })
      .select("id,owner_user_id,parent_folder_id,name,position,created_at,updated_at")
      .single();
    if (createError || !data) {
      setError(createError?.message || "The folder could not be created.");
      return;
    }
    setFolders((current) => [...current, data as FolderRow]);
    if (parentFolderId) setExpandedFolders((current) => new Set(current).add(parentFolderId));
    setSelectedFolderId(data.id);
  }

  async function renameFolder(folder: FolderRow) {
    const name = window.prompt("Rename folder", folder.name);
    if (!name?.trim() || name.trim() === folder.name) return;
    const supabase = createClient();
    const { data, error: renameError } = await supabase
      .from("research_writing_folders")
      .update({ name: name.trim() })
      .eq("id", folder.id)
      .select("id,owner_user_id,parent_folder_id,name,position,created_at,updated_at")
      .single();
    if (renameError || !data) {
      setError(renameError?.message || "The folder could not be renamed.");
      return;
    }
    setFolders((current) => current.map((row) => (row.id === folder.id ? (data as FolderRow) : row)));
  }

  function descendantFolderIds(rootId: string) {
    const result = new Set<string>([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      folders.forEach((folder) => {
        if (folder.parent_folder_id && result.has(folder.parent_folder_id) && !result.has(folder.id)) {
          result.add(folder.id);
          changed = true;
        }
      });
    }
    return result;
  }

  async function deleteFolder(folder: FolderRow) {
    const count = documents.filter((document) => document.folder_id && descendantFolderIds(folder.id).has(document.folder_id)).length;
    if (!window.confirm(`Delete “${folder.name}” and its subfolders?\n\n${count ? `${count} document(s) inside will be moved to Unfiled rather than deleted.` : "No documents will be deleted."}`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("research_writing_folders").delete().eq("id", folder.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await load();
    setSelectedFolderId("all");
  }

  function confirmDiscardUnsavedChanges() {
    if (!dirty) return true;
    return window.confirm(
      "This paper has unsaved changes. Continue without saving and return to its last saved version?"
    );
  }

  function openDocument(documentId: string) {
    if (documentId === selectedDocumentId) return;
    if (!confirmDiscardUnsavedChanges()) return;
    setSelectedDocumentId(documentId);
  }

  async function createDocument() {
    if (!userId || !confirmDiscardUnsavedChanges()) return;
    const folderId = selectedFolderId !== "all" && selectedFolderId !== "root" ? selectedFolderId : null;
    const supabase = createClient();
    const preset = FORMAT_PRESETS.freeform;
    const { data, error: createError } = await supabase
      .from("research_writing_documents")
      .insert({
        owner_user_id: userId,
        folder_id: folderId,
        title: "Untitled paper",
        document_type: "paper",
        format_style: "freeform",
        editor_settings: preset.settings,
      })
      .select("id,owner_user_id,folder_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at")
      .single();
    if (createError || !data) {
      setError(createError?.message || "The document could not be created.");
      return;
    }
    setDocuments((current) => [data as DocumentRow, ...current]);
    setSelectedDocumentId(data.id);
  }

  async function deleteDocument(documentRow: DocumentRow) {
    if (!window.confirm(`Delete “${documentRow.title}”? This deletes its saved revision history too.`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("research_writing_documents").delete().eq("id", documentRow.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    const remaining = documents.filter((row) => row.id !== documentRow.id);
    setDocuments(remaining);
    setSelectedDocumentId(remaining[0]?.id || "");
  }

  async function moveDocument(folderId: string) {
    if (!selectedDocument) return;
    const nextFolder = folderId === "root" ? null : folderId;
    const supabase = createClient();
    const { data, error: moveError } = await supabase
      .from("research_writing_documents")
      .update({ folder_id: nextFolder })
      .eq("id", selectedDocument.id)
      .select("id,owner_user_id,folder_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at")
      .single();
    if (moveError || !data) {
      setError(moveError?.message || "The document could not be moved.");
      return;
    }
    setDocuments((current) => current.map((row) => (row.id === data.id ? (data as DocumentRow) : row)));
  }

  async function togglePin() {
    if (!selectedDocument) return;
    const supabase = createClient();
    const { data, error: pinError } = await supabase
      .from("research_writing_documents")
      .update({ pinned: !selectedDocument.pinned })
      .eq("id", selectedDocument.id)
      .select("id,owner_user_id,folder_id,title,document_type,format_style,content_html,content_text,editor_settings,pinned,created_at,updated_at")
      .single();
    if (pinError || !data) {
      setError(pinError?.message || "The document could not be updated.");
      return;
    }
    setDocuments((current) => current.map((row) => (row.id === data.id ? (data as DocumentRow) : row)));
  }

  function applyFormatPreset(nextFormat: FormatStyle) {
    const currentHtml = combinedEditorHtml();

    if (nextFormat === "freeform") {
      // Free form is intentionally non-destructive: leaving a formal preset
      // stops preset enforcement but preserves the researcher's current layout.
      setFormatStyle("freeform");
      setDirty(true);
      setGuidelinesOpen(false);
      setConsentPrompt(null);
      setNotice("Free form enabled. Your current paper layout is preserved and can now be designed manually.");
      return;
    }

    const nextSettings = FORMAT_PRESETS[nextFormat].settings;
    setFormatStyle(nextFormat);
    setSettings(nextSettings);
    setDirty(true);
    setNotice(`${FORMAT_PRESETS[nextFormat].shortLabel} page formatting applied.`);
    setGuidelinesOpen(true);
    window.requestAnimationFrame(() => replaceVisiblePages(currentHtml, nextSettings, true));
    if (combinedEditorText().trim()) {
      setConsentPrompt({ kind: "restructure", format: nextFormat });
    }
  }

  async function snapshotRevision(reason: string) {
    if (!selectedDocument || !userId) return;
    const supabase = createClient();
    const html = sanitizeHtml(combinedEditorHtml());
    const text = combinedEditorText();
    await supabase.from("research_writing_revisions").insert({
      document_id: selectedDocument.id,
      owner_user_id: userId,
      revision_reason: reason,
      title_snapshot: title.trim() || selectedDocument.title,
      content_html: html,
      content_text: text,
      format_style: formatStyle,
      editor_settings: settings,
    });
  }

  async function loadRevisions() {
    if (!selectedDocument) return;
    const supabase = createClient();
    const { data, error: historyError } = await supabase
      .from("research_writing_revisions")
      .select("id,document_id,owner_user_id,revision_reason,title_snapshot,content_html,content_text,format_style,editor_settings,created_at")
      .eq("document_id", selectedDocument.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (historyError) {
      setError(historyError.message);
      return;
    }
    setRevisions((data || []) as RevisionRow[]);
    setHistoryOpen(true);
  }

  async function restoreRevision(revision: RevisionRow) {
    if (!selectedDocument || !window.confirm("Restore this revision? The current document will first be saved as a recovery snapshot.")) return;
    await snapshotRevision("before_revision_restore");
    const nextSettings = normalizeSettings(revision.editor_settings, revision.format_style);
    setTitle(revision.title_snapshot);
    setContentHtml(revision.content_html);
    setContentText(revision.content_text);
    setFormatStyle(revision.format_style);
    setSettings(nextSettings);
    replaceVisiblePages(revision.content_html, nextSettings, false);
    setDirty(true);
    setHistoryOpen(false);
    setNotice("Revision restored. Click Save to keep this version.");
  }

  function showAiAccessToast(enabled = true) {
    setAiToast(
      enabled
        ? "AI document access is on. Your current paper will be included with Writing AI questions until you turn access off or leave Thesis Builder."
        : "AI document access is off. New Writing AI questions will not include your paper."
    );
    window.setTimeout(() => setAiToast(""), 5200);
  }

  async function callWritingAssistant(payload: Record<string, unknown>) {
    const response = await fetch("/api/writing-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { ok?: boolean; reply?: string; html?: string; error?: string };
    if (!response.ok || !data.ok) throw new Error(data.error || "The Writing Assistant could not respond.");
    return data;
  }

  async function sendChat(question: string) {
    if (!selectedDocument || !question.trim() || chatSending) return;
    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: question.trim() }];
    setChatMessages(nextMessages);
    setChatDraft("");
    setChatSending(true);
    setError("");
    try {
      const data = await callWritingAssistant({
        action: "chat",
        document_id: selectedDocument.id,
        messages: nextMessages,
        document_title: title,
        allow_document_access: chatUseDocument,
        document_text: chatUseDocument ? combinedEditorText() : undefined,
        format_style: formatStyle,
      });
      setChatMessages((current) => [...current, { role: "assistant", content: data.reply || "" }]);
    } catch (chatError) {
      setError(chatError instanceof Error ? chatError.message : "The Writing Assistant could not respond.");
    } finally {
      setChatSending(false);
    }
  }

  async function restructureWithAi(targetFormat: FormatStyle) {
    if (!selectedDocument || chatSending) return;
    setChatSending(true);
    setError("");
    try {
      await snapshotRevision(`before_ai_restructure_${targetFormat}`);
      const data = await callWritingAssistant({
        action: "restructure",
        document_id: selectedDocument.id,
        document_title: title,
        // Restructure is an explicit, consented document operation.
        allow_document_access: true,
        document_text: combinedEditorText(),
        format_style: targetFormat,
      });
      const nextHtml = sanitizeHtml(data.html || "");
      if (!nextHtml.trim()) throw new Error("The Writing Assistant returned no structured document.");
      const targetSettings = FORMAT_PRESETS[targetFormat].settings;
      setContentHtml(nextHtml);
      setContentText(stripHtml(nextHtml));
      replaceVisiblePages(nextHtml, targetSettings, false);
      setDirty(true);
      setNotice(`${FORMAT_PRESETS[targetFormat].shortLabel} structure applied. A recovery revision was saved first.`);
    } catch (restructureError) {
      setError(restructureError instanceof Error ? restructureError.message : "The document could not be restructured.");
    } finally {
      setChatSending(false);
    }
  }

  async function allowAiAccess() {
    const pending = consentPrompt;
    if (!pending) return;
    setConsentPrompt(null);
    if (pending.kind === "enable_chat_access") {
      setChatUseDocument(true);
      showAiAccessToast(true);
      return;
    }
    if (pending.kind === "restructure" && pending.format) {
      setAiToast("AI is reading the current paper for this formatting restructure.");
      window.setTimeout(() => setAiToast(""), 4200);
      await restructureWithAi(pending.format);
    }
  }

  function toggleChatDocumentAccess() {
    if (chatUseDocument) {
      setChatUseDocument(false);
      showAiAccessToast(false);
      return;
    }
    setConsentPrompt({ kind: "enable_chat_access" });
  }

  function requestChatSend() {
    const question = chatDraft.trim();
    if (!question) return;
    void sendChat(question);
  }

  const geometry = pageGeometry(settings);
  const zoomScale = paperZoom / 100;
  const zoomedPageFrameStyle: React.CSSProperties = {
    width: `${Math.round(geometry.width * zoomScale)}px`,
    height: `${Math.round(geometry.height * zoomScale)}px`,
  };
  const pageStyle: React.CSSProperties = {
    width: `${geometry.width}px`,
    height: `${geometry.height}px`,
    padding: `${geometry.top}px ${geometry.right}px ${geometry.bottom}px ${geometry.left}px`,
    boxSizing: "border-box",
    position: "relative",
    transform: `scale(${zoomScale})`,
    transformOrigin: "top left",
  };
  const pageContentStyle: React.CSSProperties = {
    width: "100%",
    height: `${geometry.contentHeight}px`,
    overflow: "hidden",
    fontFamily: settings.font_family,
    fontSize: `${settings.font_size_pt}pt`,
    lineHeight: settings.line_spacing,
    textAlign: settings.text_align,
    columnCount: settings.columns,
    columnGap: settings.columns === 2 ? "0.28in" : undefined,
    columnFill: settings.columns === 2 ? "auto" : undefined,
    outline: "none",
  };

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">Loading Thesis Builder…</div>;
  }

  return (
    <div className={fullScreenMode
      ? "fixed inset-0 z-[110] isolate flex h-[100dvh] flex-col overflow-hidden bg-white"
      : "relative isolate overflow-visible rounded-[30px] border border-slate-200/90 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]"
    }>
      {error && <div className="border-b border-red-200 bg-red-50/70 px-5 py-3 text-xs text-red-700">{error}</div>}
      {notice && <div className="border-b border-cyan-100 bg-cyan-50/60 px-5 py-2.5 text-xs text-cyan-900">{notice}</div>}

      <div className={`grid ${fullScreenMode ? "min-h-0 flex-1" : "min-h-[760px]"} ${navigatorCollapsed ? "xl:grid-cols-[minmax(0,1fr)]" : "xl:grid-cols-[240px_250px_minmax(0,1fr)]"}`}>
        <aside className={`${navigatorCollapsed ? "hidden" : ""} border-b border-slate-200 bg-slate-50 p-4 xl:sticky xl:self-start xl:overflow-y-auto xl:border-b-0 xl:border-r ${fullScreenMode ? "xl:top-0 xl:h-full xl:max-h-[100dvh]" : "xl:top-[82px] xl:h-[calc(100vh-98px)] xl:max-h-[calc(100vh-98px)]"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Research files</p>
              <p className="mt-1 text-xs text-slate-400">Folders can contain folders.</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => void createFolder(null)} title="New top-level folder" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm hover:text-cyan-800"><FolderPlus className="h-4 w-4" /></button>
              <button type="button" onClick={enterFocusMode} title="Focus on paper" className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-500 shadow-sm hover:text-cyan-800">‹</button>
            </div>
          </div>

          <div className="mt-5 space-y-1">
            <button type="button" onClick={() => setSelectedFolderId("all")} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs ${selectedFolderId === "all" ? "bg-cyan-50 font-semibold text-cyan-950" : "text-slate-600 hover:bg-white"}`}>
              <FolderOpen className="h-4 w-4" /> All documents <span className="ml-auto text-[10px] text-slate-400">{documents.length}</span>
            </button>
            <button type="button" onClick={() => setSelectedFolderId("root")} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs ${selectedFolderId === "root" ? "bg-cyan-50 font-semibold text-cyan-950" : "text-slate-600 hover:bg-white"}`}>
              <Folder className="h-4 w-4" /> Unfiled <span className="ml-auto text-[10px] text-slate-400">{documents.filter((d) => !d.folder_id).length}</span>
            </button>
            <FolderTree
              folders={folders}
              documents={documents}
              selectedFolderId={selectedFolderId}
              expanded={expandedFolders}
              onToggle={(id) => setExpandedFolders((current) => {
                const next = new Set(current);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
              })}
              onSelect={setSelectedFolderId}
              onCreateChild={(folder) => void createFolder(folder.id)}
              onRename={(folder) => void renameFolder(folder)}
              onDelete={(folder) => void deleteFolder(folder)}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/65 p-3">
            <p className="text-[11px] font-semibold text-cyan-950">Private research workspace</p>
            <p className="mt-1 text-[10px] leading-4 text-cyan-900/70">Documents are researcher-owned. The AI assistant does not automatically read them.</p>
          </div>
        </aside>

        <section className={`${navigatorCollapsed ? "hidden" : ""} border-b border-slate-200 bg-white p-4 xl:sticky xl:self-start xl:overflow-hidden xl:border-b-0 xl:border-r ${fullScreenMode ? "xl:top-0 xl:h-full xl:max-h-[100dvh]" : "xl:top-[82px] xl:max-h-[calc(100vh-98px)]"}`}>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-cyan-400" />
            </div>
            <button type="button" onClick={() => void createDocument()} title="New document" className="rounded-xl bg-slate-950 p-2.5 text-white shadow-sm"><FilePlus2 className="h-4 w-4" /></button>
          </div>

          <div className={`mt-4 space-y-2 overflow-y-auto pr-1 ${fullScreenMode ? "max-h-[calc(100dvh-92px)]" : "max-h-[calc(100vh-174px)]"}`}>
            {filteredDocuments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <FileText className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-xs font-semibold text-slate-700">No documents here</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">Create a paper or choose another folder.</p>
              </div>
            ) : filteredDocuments.map((documentRow) => (
              <button
                key={documentRow.id}
                type="button"
                onClick={() => openDocument(documentRow.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${documentRow.id === selectedDocumentId ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <div className="flex items-start gap-2">
                  <FileText className={`mt-0.5 h-4 w-4 shrink-0 ${documentRow.id === selectedDocumentId ? "text-cyan-700" : "text-slate-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold text-slate-800">{documentRow.title}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">{documentRow.content_text || "Empty document"}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] text-slate-500">{FORMAT_PRESETS[documentRow.format_style]?.shortLabel || "Free form"}</span>
                      {documentRow.pinned && <span className="text-[10px] text-amber-500">★</span>}
                    </div>
                    <p className="mt-2 text-[9px] text-slate-400">{relativeDate(documentRow.updated_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <main className={`relative min-w-0 bg-[#eef3f6] ${fullScreenMode ? "h-full min-h-0 overflow-y-auto" : ""}`}>
          {!selectedDocument ? (
            <div className="flex min-h-[760px] items-center justify-center p-8">
              <div className="max-w-sm rounded-[26px] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <FileText className="mx-auto h-9 w-9 text-cyan-700" />
                <h2 className="mt-4 text-lg font-semibold text-slate-950">Create your first research document</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Write papers, proposals, reviews and notes inside the same Research workspace.</p>
                <button type="button" onClick={() => void createDocument()} className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white">New document</button>
              </div>
            </div>
          ) : (
            <div className={fullScreenMode ? "min-h-full" : "min-h-[760px]"}>
              <div className={`sticky ${fullScreenMode ? "top-0" : "top-[82px]"} z-40 shadow-[0_8px_22px_rgba(15,23,42,0.045)]`}>
              <div className="border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {navigatorCollapsed && (
                    <button
                      type="button"
                      onClick={exitFocusMode}
                      className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-sm hover:text-cyan-800"
                      title="Show folders and documents"
                    >
                      › Files
                    </button>
                  )}
                  <input
                    value={title}
                    onChange={(event) => { setTitle(event.target.value); setDirty(true); }}
                    className="min-w-[220px] flex-1 border-0 bg-transparent px-2 py-1 text-sm font-semibold text-slate-900 outline-none"
                    aria-label="Document title"
                  />
                  <select value={selectedDocument.folder_id || "root"} onChange={(event) => void moveDocument(event.target.value)} className="h-8 max-w-[200px] rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-500">
                    <option value="root">Unfiled</option>
                    {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                  </select>
                  <button type="button" onClick={() => void togglePin()} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-500">{selectedDocument.pinned ? "★ Pinned" : "☆ Pin"}</button>
                  <button type="button" onClick={() => void loadRevisions()} title="Version history" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500"><History className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setGuidelinesOpen(true)} title="Format guidelines" className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500"><PanelRightOpen className="h-4 w-4" /></button>
                  <button
                    type="button"
                    onClick={fullScreenMode ? exitFullScreenMode : enterFullScreenMode}
                    title={fullScreenMode ? "Exit full screen" : "Open full-screen Thesis Builder"}
                    aria-label={fullScreenMode ? "Exit full-screen Thesis Builder" : "Open full-screen Thesis Builder"}
                    className={`rounded-lg border p-2 transition ${fullScreenMode ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-500 hover:text-cyan-800"}`}
                  >
                    {fullScreenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  {chatUseDocument && <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[9px] font-semibold text-cyan-900">AI paper access on</span>}
                  <button type="button" onClick={() => void saveDocument()} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : dirty ? "Save" : "Saved"}</button>
                  <button type="button" onClick={() => void deleteDocument(selectedDocument)} title="Delete document" className="rounded-lg border border-red-100 bg-white p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="border-b border-slate-200 bg-white/97 px-4 py-2.5 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-1.5">
                  <ToolbarButton
                    title="Import existing work"
                    onClick={() => {
                      setImportFolderId(selectedFolderId !== "all" ? selectedFolderId : "root");
                      setImportFile(null);
                      setImportTitle("");
                      setImportOpen(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold"><FileUp className="h-3.5 w-3.5" /> Import</span>
                  </ToolbarButton>
                  <ToolbarButton
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
                  <span className="mx-1 h-6 w-px bg-slate-200" />

                  <div className="mr-1 flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50/60 px-2 py-1">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-700" />
                    <select
                      value={formatStyle}
                      onChange={(event) => applyFormatPreset(event.target.value as FormatStyle)}
                      className="h-7 max-w-[190px] border-0 bg-transparent px-1 text-[10px] font-semibold text-cyan-950 outline-none"
                      title="Paper format"
                    >
                      {Object.values(FORMAT_PRESETS).map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
                    </select>
                  </div>

                  <div className="relative">
                    <ToolbarButton
                      title="Adjust page margins"
                      onClick={() => setMarginMenuOpen((value) => !value)}
                      active={marginMenuOpen}
                    >
                      <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold"><Ruler className="h-3.5 w-3.5" /> Margins</span>
                    </ToolbarButton>
                    {marginMenuOpen && (
                      <div
                        className="absolute left-0 top-10 z-50 w-[360px] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
                        onMouseDown={(event) => event.stopPropagation()}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold text-slate-900">Page margins</p>
                            <p className="mt-1 text-[9px] leading-4 text-slate-400">Adjust each edge live. These changes remain unsaved until you click Save.</p>
                          </div>
                          <button type="button" onClick={() => setMarginMenuOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {[0, 0.5, 0.75, 1].map((value) => (
                            <button key={value} type="button" onClick={() => setAllMargins(value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-semibold text-slate-600 hover:border-cyan-300 hover:bg-cyan-50">All {value}"</button>
                          ))}
                          <button type="button" onClick={resetMarginsToPreset} className="rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[9px] font-semibold text-cyan-800">Reset to {currentPreset.shortLabel}</button>
                        </div>

                        <div className="mt-4 grid gap-3">
                          {([
                            ["top", "Top"],
                            ["right", "Right"],
                            ["bottom", "Bottom"],
                            ["left", "Left"],
                          ] as Array<[MarginSide, string]>).map(([side, label]) => {
                            const value = marginValue(side);
                            return (
                              <div key={side} className="grid grid-cols-[52px_1fr_64px] items-center gap-2">
                                <span className="text-[9px] font-semibold text-slate-500">{label}</span>
                                <input
                                  type="range"
                                  min={0}
                                  max={3.5}
                                  step={0.05}
                                  value={value}
                                  onChange={(event) => updateMargin(side, Number(event.target.value))}
                                  className="w-full accent-cyan-700"
                                />
                                <label className="flex items-center rounded-lg border border-slate-200 bg-white px-2">
                                  <input
                                    type="number"
                                    min={0}
                                    max={3.5}
                                    step={0.05}
                                    value={value}
                                    onChange={(event) => updateMargin(side, Number(event.target.value))}
                                    className="w-full border-0 bg-transparent py-1.5 text-right text-[9px] font-semibold text-slate-700 outline-none"
                                  />
                                  <span className="ml-1 text-[9px] text-slate-400">in</span>
                                </label>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2 text-[9px] leading-4 text-cyan-900">
                          The dashed cyan box on each page is the current writable area. Free form defaults to 0-inch margins; academic presets start at their recommended values but can still be overridden here.
                        </div>
                      </div>
                    )}
                  </div>

                  <select value={settings.font_family} onChange={(event) => { setSettings((current) => ({ ...current, font_family: event.target.value })); setDirty(true); execCommand("fontName", event.target.value); window.setTimeout(schedulePagination, 0); }} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-600" title="Font family">
                    {FONT_FAMILIES.map((font) => <option key={font} value={font}>{font}</option>)}
                  </select>
                  <div className="relative">
                    <ToolbarButton
                      title="Selection font size"
                      active={fontSizeMenuOpen}
                      onClick={() => {
                        captureFormattingSelection();
                        setTextColorMenuOpen(false);
                        setHighlightColorMenuOpen(false);
                        setFontSizeMenuOpen((value) => !value);
                      }}
                    >
                      <span className="whitespace-nowrap text-[10px] font-medium">
                        {FONT_SIZE_COMMANDS.find((size) => size.value === selectionFontSizeValue)?.label || "12"} pt
                      </span>
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </ToolbarButton>
                    {fontSizeMenuOpen && (
                      <div
                        className="absolute left-0 top-10 z-[80] w-[118px] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <p className="px-2 pb-1.5 text-[9px] font-semibold text-slate-500">Font size</p>
                        <div className="space-y-0.5">
                          {FONT_SIZE_COMMANDS.map((size) => (
                            <button
                              key={size.value}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setSelectionFontSizeValue(size.value);
                                applyPreservedFontSize(size.value);
                                setFontSizeMenuOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[10px] transition hover:bg-slate-50 ${
                                selectionFontSizeValue === size.value
                                  ? "bg-cyan-50 font-semibold text-cyan-900"
                                  : "text-slate-600"
                              }`}
                            >
                              <span>{size.label} pt</span>
                              {selectionFontSizeValue === size.value && <Check className="h-3 w-3" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <select defaultValue="p" onChange={(event) => execCommand("formatBlock", event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-600" title="Paragraph style">
                    <option value="p">Normal</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option>
                  </select>

                  <span className="mx-1 h-6 w-px bg-slate-200" />
                  <ToolbarButton title="Bold" onClick={() => execCommand("bold")}><Bold className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Italic" onClick={() => execCommand("italic")}><Italic className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Underline" onClick={() => execCommand("underline")}><Underline className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Strikethrough" onClick={() => execCommand("strikeThrough")}><Strikethrough className="h-3.5 w-3.5" /></ToolbarButton>
                  <div className="relative">
                    <ToolbarButton
                      title="Text colour"
                      active={textColorMenuOpen}
                      onClick={() => {
                        captureFormattingSelection();
                        setHighlightColorMenuOpen(false);
                        setFontSizeMenuOpen(false);
                        setTextColorMenuOpen((value) => !value);
                      }}
                    >
                      <Type className="h-3.5 w-3.5" />
                      <span
                        className="ml-1 h-1.5 w-4 rounded-full ring-1 ring-slate-200"
                        style={{ backgroundColor: textColorValue }}
                      />
                    </ToolbarButton>
                    {textColorMenuOpen && (
                      <div
                        className="absolute left-0 top-10 z-[80] w-[222px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-900">Text colour</p>
                            <p className="mt-0.5 text-[8px] text-slate-400">Your selected text stays selected.</p>
                          </div>
                          <button
                            type="button"
                            onMouseDown={(event) => { event.preventDefault(); setTextColorMenuOpen(false); }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-7 gap-1.5">
                          {EDITOR_COLOR_SWATCHES.map((color) => (
                            <button
                              key={`text-${color}`}
                              type="button"
                              title={color}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setTextColorValue(color);
                                applyPreservedFormatting("foreColor", color);
                                setTextColorMenuOpen(false);
                              }}
                              className="h-6 w-6 rounded-md border border-slate-200 shadow-sm transition hover:scale-110 hover:ring-2 hover:ring-cyan-200"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <span className="text-[9px] font-medium text-slate-500">Custom colour</span>
                          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1">
                            <span className="h-4 w-4 rounded border border-slate-200" style={{ backgroundColor: textColorValue }} />
                            <input
                              type="color"
                              value={textColorValue}
                              onMouseDown={(event) => {
                                event.stopPropagation();
                                captureFormattingSelection();
                                formattingColorInputActiveRef.current = true;
                              }}
                              onChange={(event) => {
                                const color = event.target.value;
                                setTextColorValue(color);
                                applyPreservedFormatting("foreColor", color);
                              }}
                              onBlur={() => { formattingColorInputActiveRef.current = false; }}
                              className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <ToolbarButton
                      title="Highlight"
                      active={highlightColorMenuOpen}
                      onClick={() => {
                        captureFormattingSelection();
                        setTextColorMenuOpen(false);
                        setFontSizeMenuOpen(false);
                        setHighlightColorMenuOpen((value) => !value);
                      }}
                    >
                      <Highlighter className="h-3.5 w-3.5" />
                      <span
                        className="ml-1 h-1.5 w-4 rounded-full ring-1 ring-slate-200"
                        style={{ backgroundColor: highlightColorValue }}
                      />
                    </ToolbarButton>
                    {highlightColorMenuOpen && (
                      <div
                        className="absolute left-0 top-10 z-[80] w-[222px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-semibold text-slate-900">Highlight</p>
                            <p className="mt-0.5 text-[8px] text-slate-400">Choose a colour without losing selection.</p>
                          </div>
                          <button
                            type="button"
                            onMouseDown={(event) => { event.preventDefault(); setHighlightColorMenuOpen(false); }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-7 gap-1.5">
                          {EDITOR_COLOR_SWATCHES.map((color) => (
                            <button
                              key={`highlight-${color}`}
                              type="button"
                              title={color}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setHighlightColorValue(color);
                                applyPreservedFormatting("hiliteColor", color);
                                setHighlightColorMenuOpen(false);
                              }}
                              className="h-6 w-6 rounded-md border border-slate-200 shadow-sm transition hover:scale-110 hover:ring-2 hover:ring-cyan-200"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <span className="text-[9px] font-medium text-slate-500">Custom highlight</span>
                          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1">
                            <span className="h-4 w-4 rounded border border-slate-200" style={{ backgroundColor: highlightColorValue }} />
                            <input
                              type="color"
                              value={highlightColorValue}
                              onMouseDown={(event) => {
                                event.stopPropagation();
                                captureFormattingSelection();
                                formattingColorInputActiveRef.current = true;
                              }}
                              onChange={(event) => {
                                const color = event.target.value;
                                setHighlightColorValue(color);
                                applyPreservedFormatting("hiliteColor", color);
                              }}
                              onBlur={() => { formattingColorInputActiveRef.current = false; }}
                              className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <span className="mx-1 h-6 w-px bg-slate-200" />
                  <ToolbarButton title="Align left" onClick={() => execCommand("justifyLeft")}><AlignLeft className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Center" onClick={() => execCommand("justifyCenter")}><AlignCenter className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Align right" onClick={() => execCommand("justifyRight")}><AlignRight className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Justify" onClick={() => execCommand("justifyFull")}><AlignJustify className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Bullets" onClick={() => execCommand("insertUnorderedList")}><ListIcon className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Numbered list" onClick={() => execCommand("insertOrderedList")}><ListOrdered className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Decrease indent" onClick={() => execCommand("outdent")}><IndentDecrease className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Increase indent" onClick={() => execCommand("indent")}><IndentIncrease className="h-3.5 w-3.5" /></ToolbarButton>

                  <select value={String(settings.line_spacing)} onChange={(event) => { setSettings((current) => ({ ...current, line_spacing: Number(event.target.value) })); setDirty(true); window.setTimeout(schedulePagination, 0); }} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-600" title="Document line spacing">
                    <option value="1">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2.0</option>
                  </select>

                  <span className="mx-1 h-6 w-px bg-slate-200" />
                  <ToolbarButton title="Add link" onClick={createLink}><LinkIcon className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Remove link" onClick={() => execCommand("unlink")}>Unlink</ToolbarButton>
                  <div className="relative">
                    <ToolbarButton title="Table maker and editor" onClick={() => setTableMenuOpen((value) => !value)} active={tableMenuOpen || Boolean(selectedTableCell)}><Table2 className="h-3.5 w-3.5" /></ToolbarButton>
                    {tableMenuOpen && (
                      <div className="absolute right-0 top-10 z-50 w-[310px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-between gap-3">
                          <div><p className="text-[11px] font-semibold text-slate-900">Table designer</p><p className="mt-0.5 text-[9px] text-slate-400">Create or edit the selected table.</p></div>
                          <button type="button" onClick={() => setTableMenuOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="mt-3 rounded-xl bg-slate-50 p-3">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">New table</p>
                          <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                            <label className="text-[9px] text-slate-500">Rows<input type="number" min={1} max={30} value={tableRows} onChange={(event) => setTableRows(Math.max(1, Math.min(30, Number(event.target.value) || 1)))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px]" /></label>
                            <label className="text-[9px] text-slate-500">Columns<input type="number" min={1} max={12} value={tableColumns} onChange={(event) => setTableColumns(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px]" /></label>
                            <button type="button" onClick={() => insertTable()} className="self-end rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-semibold text-white">Insert</button>
                          </div>
                        </div>
                        {selectedTableCell && (
                          <div className="mt-3 space-y-3">
                            <div className="flex flex-wrap gap-1.5">
                              <button type="button" onClick={addTableRow} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600">+ Row</button>
                              <button type="button" onClick={addTableColumn} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600">+ Column</button>
                              <button type="button" onClick={deleteTableRow} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] text-slate-500">− Row</button>
                              <button type="button" onClick={deleteTableColumn} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] text-slate-500">− Column</button>
                              <button type="button" onClick={toggleTableHeaderRow} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[9px] text-slate-500">Header row</button>
                            </div>
                            <label className="block text-[9px] text-slate-500">Table width · {selectedTableWidth}%<input type="range" min={25} max={100} step={1} value={selectedTableWidth} onChange={(event) => setTableWidthPercent(Number(event.target.value))} className="mt-1 w-full accent-cyan-700" /></label>
                            <p className="text-[9px] leading-4 text-slate-400">You can also drag the ↘ handle at the lower-right corner of a selected table.</p>
                            <button type="button" onClick={deleteSelectedTable} className="w-full rounded-lg border border-red-200 px-3 py-2 text-[9px] font-semibold text-red-700">Delete table</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void insertImageFile(file); }} />
                  <ToolbarButton title="Upload picture" onClick={() => imageInputRef.current?.click()} active={imageUploading}><ImagePlus className="h-3.5 w-3.5" /></ToolbarButton>
                  <div className="relative">
                    <ToolbarButton title="Picture layout and text wrapping" onClick={() => setImageMenuOpen((value) => !value)} active={imageMenuOpen || Boolean(selectedImageId)}><Settings2 className="h-3.5 w-3.5" /></ToolbarButton>
                    {imageMenuOpen && (
                      <div className="absolute right-0 top-10 z-50 w-[330px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold text-slate-900">Picture layout</p><p className="mt-0.5 text-[9px] text-slate-400">Select an image in the paper, then choose wrapping.</p></div><button type="button" onClick={() => setImageMenuOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button></div>
                        {!selectedImageId ? (
                          <button type="button" onClick={() => imageInputRef.current?.click()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-[10px] font-semibold text-white"><ImagePlus className="h-3.5 w-3.5" /> Upload picture</button>
                        ) : (
                          <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                ["inline", "In line with text"], ["square", "Square"], ["tight", "Tight"], ["through", "Through"], ["top_bottom", "Top & bottom"], ["behind", "Behind text"], ["front", "In front of text"],
                              ].map(([value, label]) => <button key={value} type="button" onClick={() => applyImageLayout(value as ImageWrapMode, selectedImageAlign, selectedImageWidth)} className={`rounded-lg border px-2 py-2 text-[9px] font-medium ${selectedImageWrap === value ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 text-slate-600"}`}>{label}</button>)}
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500">Position</p>
                              <div className="mt-1.5 grid grid-cols-3 gap-1.5">{(["left", "center", "right"] as ImageAlignment[]).map((value) => <button key={value} type="button" onClick={() => applyImageLayout(selectedImageWrap, value, selectedImageWidth)} className={`rounded-lg border px-2 py-1.5 text-[9px] capitalize ${selectedImageAlign === value ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 text-slate-600"}`}>{value}</button>)}</div>
                            </div>
                            <label className="block text-[9px] text-slate-500">Image width · {selectedImageWidth}%<input type="range" min={10} max={100} value={selectedImageWidth} onChange={(event) => applyImageLayout(selectedImageWrap, selectedImageAlign, Number(event.target.value))} className="mt-1 w-full accent-cyan-700" /></label>
                            <div className="rounded-xl border border-cyan-100 bg-cyan-50/55 px-2.5 py-2 text-[9px] leading-4 text-cyan-900">Drag the <strong>picture itself</strong> to move it. Inline/Square/Tight/Through/Top &amp; bottom drop at the nearest text position. Behind/In front can be freely placed anywhere on the paper. Drag ↘ to resize.</div>
                            <button type="button" onClick={deleteSelectedImage} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[9px] font-semibold text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete image</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <ToolbarButton title="Horizontal rule" onClick={() => execCommand("insertHorizontalRule")}><Pilcrow className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Undo" onClick={() => execCommand("undo")}><Undo2 className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Redo" onClick={() => execCommand("redo")}><Redo2 className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Clear formatting" onClick={() => execCommand("removeFormat")}>Clear</ToolbarButton>
                </div>
              </div>
              </div>

              <div className="overflow-x-auto overflow-y-visible p-5 sm:p-7">
                <div className="mx-auto flex w-max flex-col items-center gap-8 pb-16">
                  {pageHtml.map((html, pageIndex) => (
                    <div key={`${selectedDocument.id}-${paginationRevision}-${pageIndex}`} className="group/page">
                      <div className="mb-2 flex items-center justify-between px-2 text-[10px] font-medium text-slate-400" style={{ width: `${Math.round(geometry.width * zoomScale)}px` }}>
                        <span>Page {pageIndex + 1} of {pageHtml.length}</span>
                        <span>{settings.page_size === "a4" ? "A4" : "Letter"} · {paperZoom}%</span>
                      </div>
                      <div style={zoomedPageFrameStyle}>
                      <div
                        className="research-paper-sheet bg-white text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.13)] ring-1 ring-slate-200 transition group-hover/page:shadow-[0_24px_68px_rgba(15,23,42,0.16)]"
                        style={pageStyle}
                      >
                        <div
                          ref={(node) => {
                            pageRefs.current[pageIndex] = node;
                            if (node && node.dataset.paginationRevision !== String(paginationRevision)) {
                              node.innerHTML = html;
                              node.dataset.paginationRevision = String(paginationRevision);
                              if (pageIndex === 0 && !editorRef.current) editorRef.current = node;
                            }
                          }}
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={() => { editorRef.current = pageRefs.current[pageIndex] || null; }}
                          onClick={handleEditorClick}
                          onPointerDown={handleEditorPointerDown}
                          onMouseUp={captureFormattingSelection}
                          onKeyUp={captureFormattingSelection}
                          onInput={() => captureEditor(pageIndex, false)}
                          onBlur={() => {
                            if (formattingColorInputActiveRef.current) return;
                            captureEditor(pageIndex, true);
                          }}
                          onPaste={(event) => {
                            editorRef.current = pageRefs.current[pageIndex] || null;
                            const pastedHtml = event.clipboardData.getData("text/html");
                            if (!pastedHtml) return;

                            const safeHtml = sanitizeHtml(pastedHtml);
                            const isAnalysisTable = safeHtml.includes(
                              'data-psylattice-analysis-table="true"'
                            );

                            event.preventDefault();
                            execCommand("insertHTML", safeHtml);

                            if (isAnalysisTable) {
                              window.setTimeout(() => {
                                const page = pageRefs.current[pageIndex];
                                page
                                  ?.querySelectorAll<HTMLTableElement>(
                                    '[data-psylattice-analysis-table="true"] table[data-psylattice-analysis-output="true"]'
                                  )
                                  .forEach((table) => {
                                    ensureTableFrame(table);
                                  });
                                captureEditor(pageIndex, false);
                                schedulePagination();
                              }, 0);
                              return;
                            }

                            schedulePagination();
                          }}
                          data-placeholder={pageIndex === 0 ? "Start writing your paper…" : ""}
                          className="research-paper-editor"
                          style={pageContentStyle}
                        />
                        {marginMenuOpen && (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute border border-dashed border-cyan-400/80"
                            style={{
                              top: `${geometry.top}px`,
                              right: `${geometry.right}px`,
                              bottom: `${geometry.bottom}px`,
                              left: `${geometry.left}px`,
                            }}
                          />
                        )}
                      </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex w-full items-center justify-between px-2 text-[10px] text-slate-400">
                    <span>{contentText.trim() ? `${contentText.trim().split(/\s+/).length.toLocaleString()} words` : "0 words"} · {pageHtml.length} page{pageHtml.length === 1 ? "" : "s"}</span>
                    <span>{currentPreset.shortLabel} · {settings.font_family} {settings.font_size_pt} pt · {settings.line_spacing}× spacing</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {importOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={(event) => event.target === event.currentTarget && !importing && setImportOpen(false)}>
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Import existing work</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Bring an existing paper into Thesis Builder</h3><p className="mt-2 text-xs leading-5 text-slate-500">Choose the source file, the title PsyLattice should use, and exactly which visual folder should contain it.</p></div>
              <button type="button" disabled={importing} onClick={() => setImportOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500 disabled:opacity-40"><X className="h-4 w-4" /></button>
            </div>
            <input ref={importInputRef} type="file" accept=".docx,.html,.htm,.md,.markdown,.txt" className="hidden" onChange={(event) => { const file = event.target.files?.[0] || null; setImportFile(file); if (file) setImportTitle(file.name.replace(/\.[^.]+$/, "")); }} />
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
                <button type="button" onClick={() => importInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200"><FileUp className="h-4 w-4 text-cyan-700" /> {importFile ? "Choose a different file" : "Choose file"}</button>
                <p className="mt-3 text-center text-[10px] text-slate-400">Word .docx · HTML · Markdown · TXT</p>
                {importFile && <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3 py-2.5"><p className="truncate text-xs font-semibold text-cyan-950">{importFile.name}</p><p className="mt-1 text-[9px] text-cyan-800/70">{Math.max(1, Math.round(importFile.size / 1024)).toLocaleString()} KB</p></div>}
              </div>
              <label className="block"><span className="text-[10px] font-semibold text-slate-600">Document title</span><input value={importTitle} onChange={(event) => setImportTitle(event.target.value)} placeholder="Paper title" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-cyan-400" /></label>
              <label className="block"><span className="text-[10px] font-semibold text-slate-600">Place inside folder</span><select value={importFolderId} onChange={(event) => setImportFolderId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-cyan-400"><option value="root">Unfiled</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folderPathLabel(folder.id)}</option>)}</select></label>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-[9px] leading-4 text-slate-500">Imported Word documents are converted into editable Thesis Builder content. Complex Word-only objects may need a quick visual check after import.</div>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={importing} onClick={() => setImportOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">Cancel</button><button type="button" disabled={!importFile || importing} onClick={() => void importExistingDocument()} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-35">{importing ? "Importing…" : "Import into Thesis Builder"}</button></div>
          </div>
        </div>
      )}

      {exportOpen && selectedDocument && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={(event) => event.target === event.currentTarget && !exporting && setExportOpen(false)}>
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Export</p><h3 className="mt-1 text-xl font-semibold text-slate-950">Export “{title || selectedDocument.title}”</h3><p className="mt-2 text-xs leading-5 text-slate-500">Choose a file format and output paper size. Export uses the current paper text, tables, images and formatting.</p></div><button type="button" disabled={exporting} onClick={() => setExportOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500"><X className="h-4 w-4" /></button></div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setExportFormat("pdf")} className={`rounded-2xl border p-4 text-left ${exportFormat === "pdf" ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white"}`}><p className="text-sm font-semibold text-slate-900">PDF</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Submission-ready paged document.</p></button>
              <button type="button" onClick={() => setExportFormat("docx")} className={`rounded-2xl border p-4 text-left ${exportFormat === "docx" ? "border-cyan-300 bg-cyan-50" : "border-slate-200 bg-white"}`}><p className="text-sm font-semibold text-slate-900">Word (.docx)</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Continue editing in Microsoft Word.</p></button>
            </div>
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Paper size</p>
              <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setExportPageSize("letter")} className={`rounded-xl border px-3 py-3 text-left ${exportPageSize === "letter" ? "border-cyan-300 bg-cyan-50" : "border-slate-200"}`}><p className="text-xs font-semibold text-slate-800">US Letter</p><p className="mt-1 text-[9px] text-slate-400">8.5 × 11 in</p></button><button type="button" onClick={() => setExportPageSize("a4")} className={`rounded-xl border px-3 py-3 text-left ${exportPageSize === "a4" ? "border-cyan-300 bg-cyan-50" : "border-slate-200"}`}><p className="text-xs font-semibold text-slate-800">A4</p><p className="mt-1 text-[9px] text-slate-400">210 × 297 mm</p></button></div>
            </div>
            <label className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-[10px] text-slate-600"><span>Use this paper size in the Thesis Builder canvas too</span><input type="checkbox" checked={applyExportSizeToCanvas} onChange={(event) => setApplyExportSizeToCanvas(event.target.checked)} /></label>
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={exporting} onClick={() => setExportOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">Cancel</button><button type="button" disabled={exporting} onClick={() => void exportCurrentDocument()} className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-40"><Download className="h-4 w-4" /> {exporting ? "Exporting…" : `Export ${exportFormat === "pdf" ? "PDF" : "Word"}`}</button></div>
          </div>
        </div>
      )}

      {guidelinesOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[1px]" onMouseDown={(event) => event.target === event.currentTarget && setGuidelinesOpen(false)}>
          <aside className="h-full w-full max-w-[410px] overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Format guide</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">{currentPreset.label}</h3>
              </div>
              <button type="button" onClick={() => setGuidelinesOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-800">Formatting</p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600">{currentPreset.guidelines.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />{item}</li>)}</ul>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-800">Typical structure</p>
              <ol className="mt-3 space-y-2 text-xs text-slate-600">{currentPreset.structure.map((item, index) => <li key={`${item}-${index}`} className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-500">{index + 1}</span><span className="pt-0.5">{item}</span></li>)}</ol>
            </div>
            {currentPreset.caution && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">{currentPreset.caution}</div>}
            <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
              <p className="text-[11px] font-semibold text-cyan-950">PsyLattice preset boundary</p>
              <p className="mt-1 text-[10px] leading-4 text-cyan-900/70">Formatting presets are a drafting aid. A journal, university, department, supervisor or conference can impose additional or different requirements.</p>
              {currentPreset.sourceUrl && <a href={currentPreset.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[10px] font-semibold text-cyan-800 underline">Open {currentPreset.sourceLabel}</a>}
            </div>
          </aside>
        </div>
      )}

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4" onMouseDown={(event) => event.target === event.currentTarget && setHistoryOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5"><div><p className="text-xs font-semibold text-slate-950">Version history</p><p className="mt-1 text-[10px] text-slate-400">Recovery snapshots are created before AI restructuring and revision restores.</p></div><button type="button" onClick={() => setHistoryOpen(false)} className="rounded-xl border border-slate-200 p-2 text-slate-500"><X className="h-4 w-4" /></button></div>
            <div className="max-h-[64vh] overflow-y-auto p-4">
              {revisions.length === 0 ? <div className="rounded-2xl bg-slate-50 p-7 text-center text-xs text-slate-400">No saved recovery revisions yet.</div> : revisions.map((revision) => (
                <div key={revision.id} className="mb-2 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold text-slate-800">{revision.title_snapshot}</p><p className="mt-1 text-[10px] text-slate-400">{revision.revision_reason.replaceAll("_", " ")} · {relativeDate(revision.created_at)}</p></div><button type="button" onClick={() => void restoreRevision(revision)} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-[10px] font-semibold text-cyan-900">Restore</button></div>
                  <p className="mt-3 line-clamp-2 text-[10px] leading-4 text-slate-500">{revision.content_text || "Empty revision"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {consentPrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-md rounded-[26px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800"><Sparkles className="h-5 w-5" /></div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{consentPrompt.kind === "enable_chat_access" ? "Allow AI to read the current paper?" : "Allow AI to restructure this paper?"}</h3>
            {consentPrompt.kind === "enable_chat_access" ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">While this switch is on, PsyLattice will include the current paper text with every Writing AI question you send. You will not be asked again for each message. Access stays on only for this Thesis Builder session and ends when you switch it off or leave/reload the workspace.</p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-500">PsyLattice will send the current paper text once so the assistant can reorganize the existing writing for <strong>{FORMAT_PRESETS[consentPrompt.format || formatStyle].shortLabel}</strong>. It is instructed not to invent findings, citations, references or facts.</p>
            )}
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConsentPrompt(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">Cancel</button><button type="button" onClick={() => void allowAiAccess()} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white">{consentPrompt.kind === "enable_chat_access" ? "Allow document access" : "Allow restructure"}</button></div>
          </div>
        </div>
      )}

      {aiToast && <div className="fixed right-5 top-5 z-[80] max-w-sm rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-xs leading-5 text-cyan-950 shadow-xl"><div className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" /><span>{aiToast}</span></div></div>}

      {(navigatorCollapsed || fullScreenMode) && selectedDocument && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-700/70 bg-slate-950/95 p-1.5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.28)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => changePaperZoom(-10)}
            disabled={paperZoom <= 60}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium hover:bg-white/10 disabled:opacity-30"
            title="Zoom out"
            aria-label="Zoom paper out"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setPaperZoom(100)}
            className="min-w-[64px] rounded-full px-2 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10"
            title="Reset zoom to 100%"
          >
            {paperZoom}%
          </button>
          <button
            type="button"
            onClick={() => changePaperZoom(10)}
            disabled={paperZoom >= 160}
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium hover:bg-white/10 disabled:opacity-30"
            title="Zoom in"
            aria-label="Zoom paper in"
          >
            +
          </button>
        </div>
      )}

      {selectedDocument && !aiOpen && (
        <button type="button" onClick={() => { setAiOpen(true); setAiMinimized(false); }} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-[0_16px_45px_rgba(15,23,42,0.28)]"><Sparkles className="h-4 w-4 text-cyan-300" /> Writing AI{chatUseDocument ? " · Paper access on" : ""}</button>
      )}

      {selectedDocument && aiOpen && (
        <div className={`fixed bottom-5 right-5 z-50 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl transition-all ${aiMinimized ? "h-14 w-56" : "h-[620px] w-[390px] max-w-[calc(100vw-40px)]"}`}>
          <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-slate-950 px-4 text-white">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /><div><p className="text-xs font-semibold">PsyLattice Writing AI</p>{!aiMinimized && <p className={`text-[9px] ${chatUseDocument ? "text-cyan-300" : "text-slate-400"}`}>Document access {chatUseDocument ? "on" : "off"}</p>}</div></div>
            <div className="flex items-center gap-1"><button type="button" onClick={() => setAiMinimized((value) => !value)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><Minimize2 className="h-4 w-4" /></button><button type="button" onClick={() => setAiOpen(false)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><X className="h-4 w-4" /></button></div>
          </div>
          {!aiMinimized && <div className="flex h-[566px] flex-col">
            <div className="border-b border-slate-100 bg-cyan-50/50 px-4 py-2.5 text-[10px] leading-4 text-cyan-900"><strong>Realtime review: Off.</strong> {chatUseDocument ? "Document access is on, so each question includes the current paper until you turn access off." : "Document access is off, so questions are sent without the paper."}</div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chatMessages.length === 0 && <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">Ask for help with clarity, academic tone, section organization, argument structure, wording, or how to improve a paragraph. Turn on <strong>Use current paper</strong> only when you want the assistant to read it.</div>}
              {chatMessages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[92%] rounded-2xl px-3.5 py-3 text-xs leading-5 ${message.role === "user" ? "ml-auto bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}>{message.content}</div>)}
              {chatSending && <div className="rounded-2xl bg-slate-100 px-3.5 py-3 text-xs text-slate-400">Writing Assistant is thinking…</div>}
            </div>
            <div className="border-t border-slate-200 p-3">
              <button type="button" onClick={toggleChatDocumentAccess} className={`mb-2 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-[10px] ${chatUseDocument ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-500"}`}><span>Allow AI to read current paper</span><span className={`rounded-full px-2 py-0.5 font-semibold ${chatUseDocument ? "bg-cyan-100 text-cyan-900" : "bg-slate-100 text-slate-500"}`}>{chatUseDocument ? "On" : "Off"}</span></button>
              <div className="flex gap-2"><textarea value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); requestChatSend(); } }} placeholder="Ask the Writing AI…" className="min-h-[70px] min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-cyan-400" /><button type="button" onClick={requestChatSend} disabled={!chatDraft.trim() || chatSending} className="self-end rounded-xl bg-slate-950 p-3 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button></div>
              <button type="button" onClick={() => setChatMessages([])} className="mt-2 text-[9px] text-slate-400 hover:text-slate-700">New chat</button>
            </div>
          </div>}
        </div>
      )}

      <style jsx global>{`
        .research-paper-editor { position: relative; }
        .research-paper-editor:empty::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }
        .research-image-frame { box-sizing: border-box; border: 1px solid transparent; border-radius: 4px; cursor: grab; touch-action: none; user-select: none; }
        .research-image-frame:hover { border-color: #67e8f9; box-shadow: 0 0 0 2px rgba(103,232,249,.16); }
        .research-image-frame.research-image-dragging { cursor: grabbing; border-color: #06b6d4; box-shadow: 0 0 0 3px rgba(6,182,212,.16), 0 14px 35px rgba(15,23,42,.14); opacity: .96; }
        .research-image-frame img { pointer-events: none; user-select: none; }
        .research-image-resize-handle, .research-table-resize-handle { position: absolute; right: -7px; bottom: -7px; z-index: 30; display: flex; width: 18px; height: 18px; cursor: nwse-resize; align-items: center; justify-content: center; border: 1px solid #0891b2; border-radius: 5px; background: white; color: #0e7490; font-size: 10px; line-height: 1; box-shadow: 0 2px 8px rgba(15,23,42,.12); user-select: none; }
        .research-table-frame { box-sizing: border-box; }
        .research-table-frame:hover { outline: 1px solid #67e8f9; outline-offset: 4px; }
        .research-paper-editor h1 { margin: 1.2em 0 .55em; font-size: 1.65em; font-weight: 700; line-height: 1.2; break-after: avoid; }
        .research-paper-editor h2 { margin: 1.1em 0 .5em; font-size: 1.35em; font-weight: 700; line-height: 1.25; break-after: avoid; }
        .research-paper-editor h3 { margin: 1em 0 .45em; font-size: 1.12em; font-weight: 700; break-after: avoid; }
        .research-paper-editor p, .research-paper-editor div { margin-top: 0; margin-bottom: ${settings.paragraph_spacing_pt}pt; }
        .research-paper-editor p { text-indent: ${settings.first_line_indent_in}in; }
        .research-paper-editor h1 + p, .research-paper-editor h2 + p, .research-paper-editor h3 + p, .research-paper-editor blockquote p, .research-paper-editor li p { text-indent: 0; }
        .research-paper-editor ul { list-style: disc; padding-left: 1.4em; margin: .5em 0; }
        .research-paper-editor ol { list-style: decimal; padding-left: 1.4em; margin: .5em 0; }
        .research-paper-editor blockquote { margin: .8em 0 .8em .5in; }
        .research-paper-editor a { color: #0e7490; text-decoration: underline; }
        .research-paper-editor table { width: 100%; border-collapse: collapse; margin: 0; column-span: all; table-layout: auto; }
        .research-paper-editor th, .research-paper-editor td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; vertical-align: top; }
        .research-paper-editor th { background: #f8fafc; font-weight: 700; }

        /* Analysis Lab tables paste as publication-style tables rather than generic editor grids. */
        .research-paper-editor [data-psylattice-analysis-table="true"] {
          display: block;
          width: 100%;
          max-width: 100%;
          margin: .35em 0 1em;
          break-inside: avoid-page;
          page-break-inside: avoid;
        }
        .research-paper-editor [data-psylattice-analysis-table="true"] .research-table-frame {
          width: 100% !important;
          max-width: 100% !important;
          margin: .35em 0 .25em !important;
        }
        .research-paper-editor [data-psylattice-analysis-table="true"] table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
          border: 0 !important;
          border-collapse: collapse !important;
          background: transparent !important;
        }
        .research-paper-editor [data-psylattice-analysis-table="true"] th,
        .research-paper-editor [data-psylattice-analysis-table="true"] td {
          border: 0 !important;
          background: transparent !important;
          padding: 5px 6px !important;
          font-size: .88em;
          line-height: 1.3;
          overflow-wrap: anywhere;
          word-break: normal;
        }
        .research-paper-editor [data-psylattice-analysis-table="true"] thead th {
          border-top: 1.5px solid currentColor !important;
          border-bottom: 1px solid currentColor !important;
          font-weight: 600;
        }
        .research-paper-editor [data-psylattice-analysis-table="true"] tbody tr:last-child td {
          border-bottom: 1.5px solid currentColor !important;
        }
        .research-paper-editor [data-psylattice-analysis-table="true"] th:not(:first-child),
        .research-paper-editor [data-psylattice-analysis-table="true"] td:not(:first-child) {
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .research-paper-editor [data-psylattice-analysis-table="true"] .research-table-resize-handle {
          opacity: 0;
          transition: opacity .16s ease;
        }
        .research-paper-editor [data-psylattice-analysis-table="true"]:hover .research-table-resize-handle,
        .research-paper-editor [data-psylattice-analysis-table="true"] .research-table-frame:hover .research-table-resize-handle {
          opacity: 1;
        }
        .research-paper-editor hr { border: 0; border-top: 1px solid #cbd5e1; margin: 1em 0; column-span: all; }
        .research-paper-editor img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}
