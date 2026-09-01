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
  ChevronDown,
  ChevronRight,
  FilePlus2,
  FileText,
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
  Minimize2,
  PanelRightOpen,
  Pilcrow,
  Redo2,
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
  margin_in: number;
  page_size: "letter" | "a4";
  first_line_indent_in: number;
  paragraph_spacing_pt: number;
  text_align: "left" | "justify";
  columns: 1 | 2;
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
  editor_settings: Partial<EditorSettings> | null;
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
  editor_settings: Partial<EditorSettings> | null;
  created_at: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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
  margin_in: 1,
  page_size: "letter",
  first_line_indent_in: 0.5,
  paragraph_spacing_pt: 0,
  text_align: "left",
  columns: 1,
};

const FORMAT_PRESETS: Record<FormatStyle, FormatPreset> = {
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
      margin_in: 0.75,
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

function normalizeSettings(value: Partial<EditorSettings> | null | undefined, format: FormatStyle): EditorSettings {
  return { ...FORMAT_PRESETS[format].settings, ...(value || {}) } as EditorSettings;
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
  const [paginationRevision, setPaginationRevision] = useState(0);
  const [pageHtml, setPageHtml] = useState<string[]>([""]);
  const [navigatorCollapsed, setNavigatorCollapsed] = useState(false);
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
  const [formatStyle, setFormatStyle] = useState<FormatStyle>("apa7_student");
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);

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

  // Collapsing the file navigator is the dedicated paper-focus mode.
  // The parent Researcher page uses this signal to remove its large page header.
  useEffect(() => {
    onFocusModeChange?.(navigatorCollapsed);
  }, [navigatorCollapsed, onFocusModeChange]);

  useEffect(() => {
    return () => onFocusModeChange?.(false);
  }, [onFocusModeChange]);

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

  const currentPreset = FORMAT_PRESETS[formatStyle];

  function pageGeometry(targetSettings: EditorSettings = settings) {
    const width = targetSettings.page_size === "a4" ? 794 : 816;
    const height = targetSettings.page_size === "a4" ? 1123 : 1056;
    const margin = Math.max(0.35, targetSettings.margin_in) * 96;
    return {
      width,
      height,
      margin,
      contentWidth: Math.max(240, width - margin * 2),
      contentHeight: Math.max(320, height - margin * 2),
    };
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
      pageRefs.current = {};
      setPageHtml([""]);
      setPaginationRevision((current) => current + 1);
      return;
    }
    const nextFormat = selectedDocument.format_style || "apa7_student";
    const nextSettings = normalizeSettings(selectedDocument.editor_settings, nextFormat);
    const nextHtml = selectedDocument.content_html || "";
    setTitle(selectedDocument.title);
    setContentHtml(nextHtml);
    setContentText(selectedDocument.content_text || "");
    setFormatStyle(nextFormat);
    setSettings(nextSettings);
    setDirty(false);
    window.localStorage.setItem("psylattice-writing-document-id", selectedDocument.id);
    window.requestAnimationFrame(() => replaceVisiblePages(nextHtml, nextSettings, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocument]);

  async function saveDocument(silent = false) {
    if (!selectedDocument || !userId || saving) return;
    setSaving(true);
    if (!silent) setNotice("");
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
    if (!silent) setNotice("Saved");
    setSaving(false);
  }

  useEffect(() => {
    if (!dirty || !selectedDocumentId) return;
    const timer = window.setTimeout(() => void saveDocument(true), 1100);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, title, contentHtml, formatStyle, settings, selectedDocumentId]);

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

  function insertTable() {
    const rows = Math.max(1, Math.min(20, Number(window.prompt("Rows", "3") || 0)));
    const columns = Math.max(1, Math.min(12, Number(window.prompt("Columns", "3") || 0)));
    if (!Number.isFinite(rows) || !Number.isFinite(columns)) return;
    const cells = Array.from({ length: rows }, (_, row) =>
      `<tr>${Array.from({ length: columns }, (_, column) => `<${row === 0 ? "th" : "td"}>${row === 0 ? `Heading ${column + 1}` : "Cell"}</${row === 0 ? "th" : "td"}>`).join("")}</tr>`
    ).join("");
    execCommand("insertHTML", `<table><tbody>${cells}</tbody></table><p><br></p>`);
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

  async function createDocument() {
    if (!userId) return;
    const folderId = selectedFolderId !== "all" && selectedFolderId !== "root" ? selectedFolderId : null;
    const supabase = createClient();
    const preset = FORMAT_PRESETS.apa7_student;
    const { data, error: createError } = await supabase
      .from("research_writing_documents")
      .insert({
        owner_user_id: userId,
        folder_id: folderId,
        title: "Untitled paper",
        document_type: "paper",
        format_style: "apa7_student",
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
    const nextSettings = FORMAT_PRESETS[nextFormat].settings;
    const currentHtml = combinedEditorHtml();
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
    setNotice("Revision restored. Saving…");
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
    padding: `${geometry.margin}px`,
    boxSizing: "border-box",
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
    <div className="relative isolate overflow-visible rounded-[30px] border border-slate-200/90 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.07)]">
      {error && <div className="border-b border-red-200 bg-red-50/70 px-5 py-3 text-xs text-red-700">{error}</div>}
      {notice && <div className="border-b border-cyan-100 bg-cyan-50/60 px-5 py-2.5 text-xs text-cyan-900">{notice}</div>}

      <div className={`grid min-h-[760px] ${navigatorCollapsed ? "xl:grid-cols-[minmax(0,1fr)]" : "xl:grid-cols-[240px_250px_minmax(0,1fr)]"}`}>
        <aside className={`${navigatorCollapsed ? "hidden" : ""} border-b border-slate-200 bg-slate-50/70 p-4 xl:border-b-0 xl:border-r`}>
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

        <section className={`${navigatorCollapsed ? "hidden" : ""} border-b border-slate-200 p-4 xl:border-b-0 xl:border-r`}>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-cyan-400" />
            </div>
            <button type="button" onClick={() => void createDocument()} title="New document" className="rounded-xl bg-slate-950 p-2.5 text-white shadow-sm"><FilePlus2 className="h-4 w-4" /></button>
          </div>

          <div className="mt-4 max-h-[690px] space-y-2 overflow-y-auto pr-1">
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
                onClick={() => setSelectedDocumentId(documentRow.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${documentRow.id === selectedDocumentId ? "border-cyan-300 bg-cyan-50/70" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <div className="flex items-start gap-2">
                  <FileText className={`mt-0.5 h-4 w-4 shrink-0 ${documentRow.id === selectedDocumentId ? "text-cyan-700" : "text-slate-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold text-slate-800">{documentRow.title}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">{documentRow.content_text || "Empty document"}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] text-slate-500">{FORMAT_PRESETS[documentRow.format_style]?.shortLabel || "Custom"}</span>
                      {documentRow.pinned && <span className="text-[10px] text-amber-500">★</span>}
                    </div>
                    <p className="mt-2 text-[9px] text-slate-400">{relativeDate(documentRow.updated_at)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <main className="relative min-w-0 bg-[#eef3f6]">
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
            <div className="min-h-[760px]">
              <div className={navigatorCollapsed ? "sticky top-[82px] z-30" : "contents"}>
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
                  {chatUseDocument && <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1.5 text-[9px] font-semibold text-cyan-900">AI paper access on</span>}
                  <button type="button" onClick={() => void saveDocument(false)} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : dirty ? "Save" : "Saved"}</button>
                  <button type="button" onClick={() => void deleteDocument(selectedDocument)} title="Delete document" className="rounded-lg border border-red-100 bg-white p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              <div className={`${navigatorCollapsed ? "" : "sticky top-[82px] z-20"} border-b border-slate-200 bg-white/96 px-4 py-2.5 backdrop-blur-xl`}>
                <div className="flex flex-wrap items-center gap-1.5">
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

                  <select value={settings.font_family} onChange={(event) => { setSettings((current) => ({ ...current, font_family: event.target.value })); setDirty(true); execCommand("fontName", event.target.value); window.setTimeout(schedulePagination, 0); }} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-600" title="Font family">
                    {FONT_FAMILIES.map((font) => <option key={font} value={font}>{font}</option>)}
                  </select>
                  <select defaultValue="3" onChange={(event) => execCommand("fontSize", event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-600" title="Selection font size">
                    {FONT_SIZE_COMMANDS.map((size) => <option key={size.value} value={size.value}>{size.label} pt</option>)}
                  </select>
                  <select defaultValue="p" onChange={(event) => execCommand("formatBlock", event.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-600" title="Paragraph style">
                    <option value="p">Normal</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option>
                  </select>

                  <span className="mx-1 h-6 w-px bg-slate-200" />
                  <ToolbarButton title="Bold" onClick={() => execCommand("bold")}><Bold className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Italic" onClick={() => execCommand("italic")}><Italic className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Underline" onClick={() => execCommand("underline")}><Underline className="h-3.5 w-3.5" /></ToolbarButton>
                  <ToolbarButton title="Strikethrough" onClick={() => execCommand("strikeThrough")}><Strikethrough className="h-3.5 w-3.5" /></ToolbarButton>
                  <label title="Text colour" className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-500"><Type className="h-3.5 w-3.5" /><input type="color" defaultValue="#0f172a" onChange={(event) => execCommand("foreColor", event.target.value)} className="h-4 w-5 border-0 bg-transparent p-0" /></label>
                  <label title="Highlight" className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-500"><Highlighter className="h-3.5 w-3.5" /><input type="color" defaultValue="#fff59d" onChange={(event) => execCommand("hiliteColor", event.target.value)} className="h-4 w-5 border-0 bg-transparent p-0" /></label>

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
                  <ToolbarButton title="Insert table" onClick={insertTable}><Table2 className="h-3.5 w-3.5" /></ToolbarButton>
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
                          onInput={() => captureEditor(pageIndex, false)}
                          onBlur={() => captureEditor(pageIndex, true)}
                          onPaste={(event) => {
                            editorRef.current = pageRefs.current[pageIndex] || null;
                            const pastedHtml = event.clipboardData.getData("text/html");
                            if (!pastedHtml) return;
                            event.preventDefault();
                            execCommand("insertHTML", sanitizeHtml(pastedHtml));
                            schedulePagination();
                          }}
                          data-placeholder={pageIndex === 0 ? "Start writing your paper…" : ""}
                          className="research-paper-editor"
                          style={pageContentStyle}
                        />
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

      {navigatorCollapsed && selectedDocument && (
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
        .research-paper-editor:empty::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }
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
        .research-paper-editor table { width: 100%; border-collapse: collapse; margin: 1em 0; column-span: all; }
        .research-paper-editor th, .research-paper-editor td { border: 1px solid #94a3b8; padding: 6px 8px; text-align: left; vertical-align: top; }
        .research-paper-editor th { background: #f8fafc; font-weight: 700; }
        .research-paper-editor hr { border: 0; border-top: 1px solid #cbd5e1; margin: 1em 0; column-span: all; }
        .research-paper-editor img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}
