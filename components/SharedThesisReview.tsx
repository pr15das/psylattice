"use client";

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Eraser,
  FileText,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  LockKeyhole,
  Pencil,
  Pilcrow,
  Pin,
  Redo2,
  Save,
  Search,
  ShieldCheck,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  Unlink,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import StudyReviewManager from "@/components/StudyReviewManager";

type ThesisDocument = {
  id: string;
  owner_user_id: string;
  study_id: string;
  title: string;
  document_type: string;
  format_style: string;
  content_html: string;
  content_text: string;
  editor_settings: Record<string, unknown> | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

type Access = {
  accessType: "owner" | "collaborator" | null;
  role: string | null;
  canEdit: boolean;
  canComment: boolean;
  canReview: boolean;
  studyTitle: string;
};

function words(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function pretty(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sanitizeBrowserHtml(html: string) {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const node = parser.parseFromString(html, "text/html");
  node
    .querySelectorAll(
      "script, iframe, object, embed, form, input, button, textarea, select, meta, link, base, style",
    )
    .forEach((element) => element.remove());
  node.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;
      if (name.startsWith("on")) element.removeAttribute(attribute.name);
      if (
        (name === "href" || name === "src") &&
        /^\s*(javascript:|data:text\/html)/i.test(value)
      ) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return node.body.innerHTML;
}

function plainTextFromHtml(html: string) {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const node = document.createElement("div");
  node.innerHTML = html;
  return (node.innerText || node.textContent || "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function safeDocumentHtml(document: ThesisDocument) {
  const body = document.content_html?.trim()
    ? sanitizeBrowserHtml(document.content_html)
    : `<div style="white-space:pre-wrap">${escapeHtml(
        document.content_text || "",
      )}</div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html,body{margin:0;padding:0;background:#fff;color:#0f172a}
  body{font-family:Georgia,"Times New Roman",serif;font-size:16px;line-height:1.7;padding:48px 56px}
  img{max-width:100%;height:auto}
  table{border-collapse:collapse;max-width:100%}
  td,th{border:1px solid #cbd5e1;padding:6px 8px}
  a{color:#0e7490}
  @media(max-width:720px){body{padding:28px 24px}}
</style>
</head>
<body>${body}</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const COLLAB_FONT_FAMILIES = [
  "Times New Roman",
  "Arial",
  "Calibri",
  "Georgia",
  "Verdana",
  "Courier New",
];

const COLLAB_FONT_SIZES = [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32];

const COLLAB_BLOCK_STYLES = [
  { label: "Normal", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Quote", value: "blockquote" },
];

const COLLAB_LINE_SPACING = [1, 1.15, 1.5, 2];

function EditorButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
    >
      {children}
    </button>
  );
}

export default function SharedThesisReview({ studyId }: { studyId: string }) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [documents, setDocuments] = useState<ThesisDocument[]>([]);
  const [access, setAccess] = useState<Access | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftHtml, setDraftHtml] = useState("");
  const savedRangeRef = useRef<Range | null>(null);
  const [fontFamily, setFontFamily] = useState("Times New Roman");
  const [fontSize, setFontSize] = useState(12);
  const [blockStyle, setBlockStyle] = useState("p");
  const [lineSpacing, setLineSpacing] = useState("1");
  const [textColor, setTextColor] = useState("#111827");
  const [highlightColor, setHighlightColor] = useState("#fff59d");
  const [showParagraphMarks, setShowParagraphMarks] = useState(false);

  async function loadDocuments(preferredId?: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/research/shared-thesis?study_id=${encodeURIComponent(studyId)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        },
      );

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.error || "Shared Thesis Builder could not be loaded.",
        );
      }

      const nextDocuments = Array.isArray(payload.documents)
        ? (payload.documents as ThesisDocument[])
        : [];

      setDocuments(nextDocuments);
      setAccess(payload.access || null);
      setSelectedDocumentId((current) => {
        const wanted = preferredId || current;
        if (wanted && nextDocuments.some((item) => item.id === wanted)) {
          return wanted;
        }
        return nextDocuments[0]?.id || "";
      });
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Shared Thesis Builder could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const filteredDocuments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return documents;
    return documents.filter((document) =>
      `${document.title} ${document.document_type} ${document.format_style}`
        .toLowerCase()
        .includes(needle),
    );
  }, [documents, query]);

  const selected =
    documents.find((document) => document.id === selectedDocumentId) || null;

  useEffect(() => {
    if (!selected || editing) return;
    setDraftTitle(selected.title || "Untitled paper");
    setDraftHtml(sanitizeBrowserHtml(selected.content_html || ""));
  }, [selected, editing]);

  function beginEditing() {
    if (!selected || !access?.canEdit) return;
    setError("");
    setNotice("");
    setDraftTitle(selected.title || "Untitled paper");
    setDraftHtml(
      sanitizeBrowserHtml(
        selected.content_html ||
          `<p>${escapeHtml(selected.content_text || "")}</p>`,
      ),
    );
    setEditing(true);

    window.setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = sanitizeBrowserHtml(
          selected.content_html ||
            `<p>${escapeHtml(selected.content_text || "")}</p>`,
        );
        editorRef.current.focus();
      }
    }, 0);
  }

  function cancelEditing() {
    setEditing(false);
    setError("");
    if (selected) {
      setDraftTitle(selected.title || "Untitled paper");
      setDraftHtml(sanitizeBrowserHtml(selected.content_html || ""));
    }
  }

  function captureSelection() {
    if (!editorRef.current || typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const common =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as Element)
        : range.commonAncestorContainer.parentElement;
    if (common && editorRef.current.contains(common)) {
      savedRangeRef.current = range.cloneRange();
    }
  }

  function restoreSelection() {
    if (!savedRangeRef.current || typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
  }

  function syncDraftFromEditor() {
    if (!editorRef.current) return;
    setDraftHtml(sanitizeBrowserHtml(editorRef.current.innerHTML));
    captureSelection();
  }

  function runCommand(command: string, value?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    syncDraftFromEditor();
  }

  function applyFontFamily(value: string) {
    setFontFamily(value);
    runCommand("fontName", value);
  }

  function applyFontSize(pointSize: number) {
    if (!editorRef.current) return;
    setFontSize(pointSize);
    editorRef.current.focus();
    restoreSelection();

    // execCommand's fontSize only accepts 1..7. Use 7 as a temporary marker,
    // then convert only those generated font tags to the requested point size.
    document.execCommand("fontSize", false, "7");
    editorRef.current.querySelectorAll<HTMLFontElement>('font[size="7"]').forEach((font) => {
      font.removeAttribute("size");
      font.style.fontSize = `${pointSize}pt`;
    });
    syncDraftFromEditor();
  }

  function applyBlockStyle(value: string) {
    setBlockStyle(value);
    runCommand("formatBlock", `<${value}>`);
  }

  function applyTextColor(value: string) {
    setTextColor(value);
    runCommand("foreColor", value);
  }

  function applyHighlightColor(value: string) {
    setHighlightColor(value);
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    const ok = document.execCommand("hiliteColor", false, value);
    if (!ok) document.execCommand("backColor", false, value);
    syncDraftFromEditor();
  }

  function selectedBlocks() {
    if (!editorRef.current || typeof window === "undefined") {
      return [] as HTMLElement[];
    }

    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return [];

    const range = selection.getRangeAt(0);
    const selector = "p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,div";
    const blocks = Array.from(
      editorRef.current.querySelectorAll<HTMLElement>(selector),
    ).filter((element) => {
      try {
        return range.intersectsNode(element);
      } catch {
        return false;
      }
    });

    if (blocks.length) return blocks;

    const start =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as Element)
        : range.startContainer.parentElement;

    const closest = start?.closest<HTMLElement>(selector);
    return closest && editorRef.current.contains(closest) ? [closest] : [];
  }

  function applyLineSpacing(value: string) {
    setLineSpacing(value);
    const blocks = selectedBlocks();
    blocks.forEach((block) => {
      block.style.lineHeight = value;
    });
    syncDraftFromEditor();
  }

  function createLink() {
    if (!editorRef.current) return;
    const url = window.prompt("Paste the link URL:");
    if (!url?.trim()) return;

    editorRef.current.focus();
    restoreSelection();
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      const safe = url.trim().replaceAll('"', "&quot;");
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`,
      );
    } else {
      document.execCommand("createLink", false, url.trim());
    }
    syncDraftFromEditor();
  }

  function insertTable() {
    if (!editorRef.current) return;
    const rowInput = window.prompt("Number of rows:", "2");
    if (rowInput === null) return;
    const columnInput = window.prompt("Number of columns:", "2");
    if (columnInput === null) return;

    const rows = Math.max(1, Math.min(20, Number.parseInt(rowInput, 10) || 2));
    const columns = Math.max(
      1,
      Math.min(12, Number.parseInt(columnInput, 10) || 2),
    );

    const body = Array.from({ length: rows }, () =>
      `<tr>${Array.from(
        { length: columns },
        () =>
          '<td style="border:1px solid #cbd5e1;padding:6px 8px;min-width:70px"><br></td>',
      ).join("")}</tr>`,
    ).join("");

    runCommand(
      "insertHTML",
      `<table style="border-collapse:collapse;width:100%;margin:12px 0"><tbody>${body}</tbody></table><p><br></p>`,
    );
  }

  async function saveChanges() {
    if (!selected || !access?.canEdit || saving) return;

    const currentHtml = sanitizeBrowserHtml(
      editorRef.current?.innerHTML || draftHtml,
    );
    const currentText = plainTextFromHtml(currentHtml);

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/research/shared-thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operation: "save_document",
          studyId,
          documentId: selected.id,
          expectedUpdatedAt: selected.updated_at,
          title: draftTitle,
          contentHtml: currentHtml,
          contentText: currentText,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok) {
        if (response.status === 409 && payload?.code === "DOCUMENT_CHANGED") {
          throw new Error(
            payload.error ||
              "This document changed elsewhere. Reload it before saving.",
          );
        }
        throw new Error(
          payload?.error || "This shared Thesis document could not be saved.",
        );
      }

      const updated = payload.document as ThesisDocument;
      setDocuments((current) =>
        current.map((document) =>
          document.id === updated.id ? updated : document,
        ),
      );
      setDraftHtml(sanitizeBrowserHtml(updated.content_html || ""));
      setDraftTitle(updated.title || "Untitled paper");
      setEditing(false);
      setNotice(
        `Saved · your ${access.role || "collaborator"} edit was recorded in the study audit history.`,
      );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "This shared Thesis document could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white text-[10px] text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
        Loading shared Thesis documents…
      </div>
    );
  }

  if (error && !documents.length) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50/55 p-5">
        <div className="flex items-start gap-3">
          <LockKeyhole className="mt-0.5 h-4 w-4 text-rose-700" />
          <div>
            <p className="text-[12px] font-semibold text-rose-800">
              Thesis review unavailable
            </p>
            <p className="mt-1 text-[10px] leading-5 text-rose-700/80">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_10px_36px_rgba(15,23,42,.055)]">
      <div className="grid min-h-[680px] lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/55 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-700" />
              <div>
                <p className="text-[11px] font-semibold text-slate-900">
                  Thesis collaboration
                </p>
                <p className="mt-0.5 text-[8px] text-slate-400">
                  {documents.length} linked document
                  {documents.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find document"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[9px] outline-none focus:border-cyan-300"
              />
            </label>
          </div>

          <div className="max-h-[610px] overflow-y-auto p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredDocuments.length === 0 ? (
              <p className="p-4 text-[9px] leading-4 text-slate-400">
                No study-linked Thesis documents match this view.
              </p>
            ) : (
              filteredDocuments.map((document) => {
                const active = selected?.id === document.id;
                return (
                  <button
                    key={document.id}
                    type="button"
                    disabled={editing}
                    onClick={() => setSelectedDocumentId(document.id)}
                    className={`mb-1 flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-cyan-200 bg-cyan-50/75"
                        : "border-transparent hover:border-slate-200 hover:bg-white"
                    } disabled:cursor-not-allowed disabled:opacity-55`}
                  >
                    <FileText
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        active ? "text-cyan-700" : "text-slate-400"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-[9.5px] font-semibold text-slate-800">
                          {document.title || "Untitled paper"}
                        </span>
                        {document.pinned && (
                          <Pin className="h-3 w-3 shrink-0 text-violet-500" />
                        )}
                      </span>
                      <span className="mt-1 block text-[7.5px] text-slate-400">
                        {pretty(document.document_type)} ·{" "}
                        {words(document.content_text || "")} words
                      </span>
                    </span>
                    <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-slate-300" />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {!selected ? (
            <div className="flex min-h-[680px] items-center justify-center p-8 text-center">
              <div>
                <FileText className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-[11px] font-semibold text-slate-700">
                  No linked Thesis document yet
                </p>
                <p className="mt-1 max-w-sm text-[9px] leading-4 text-slate-400">
                  When the owner links a Thesis Builder document to this study,
                  it will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        maxLength={240}
                        className="w-full max-w-xl rounded-xl border border-cyan-200 bg-cyan-50/45 px-3 py-2 text-[14px] font-semibold text-slate-950 outline-none focus:border-cyan-400"
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-[15px] font-semibold text-slate-950">
                          {selected.title || "Untitled paper"}
                        </h2>
                        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[8px] font-semibold text-cyan-700">
                          {access?.canEdit ? "Collaborative document" : "Review mode"}
                        </span>
                      </div>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[8px] text-slate-400">
                      <span>{pretty(selected.format_style)}</span>
                      <span>{words(selected.content_text || "")} words</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Updated {shortDate(selected.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!editing && access?.canEdit && (
                      <button
                        type="button"
                        onClick={beginEditing}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-semibold text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit document
                      </button>
                    )}

                    {editing && (
                      <>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={cancelEditing}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-semibold text-slate-600 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={saving || !draftTitle.trim()}
                          onClick={() => void saveChanges()}
                          className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-3 py-2 text-[9px] font-semibold text-white disabled:opacity-50"
                        >
                          {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save changes
                        </button>
                      </>
                    )}

                    {!editing && (
                      <StudyReviewManager
                        studyId={studyId}
                        currentScreen="writing"
                        sourceRef={`thesis:${selected.id}`}
                        sourceLabel={`Thesis Builder · ${
                          selected.title || "Untitled paper"
                        }`}
                        defaultCategory="writing"
                        buttonLabel="Review this document"
                        triggerVariant="inline"
                      />
                    )}
                  </div>
                </div>

                {(error || notice) && (
                  <div className="mt-3">
                    {error && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[8.5px] leading-4 text-rose-700">
                        {error}
                      </div>
                    )}
                    {notice && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[8.5px] leading-4 text-emerald-700">
                        {notice}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editing ? (
                <>
                  <div className="border-b border-slate-200 bg-slate-50/75 px-4 py-3 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="relative">
                        <select
                          value={fontFamily}
                          onMouseDown={captureSelection}
                          onChange={(event) => applyFontFamily(event.target.value)}
                          className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-[10px] font-medium text-slate-700 outline-none hover:border-cyan-200 focus:border-cyan-300"
                        >
                          {COLLAB_FONT_FAMILIES.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </label>

                      <label className="relative">
                        <select
                          value={fontSize}
                          onMouseDown={captureSelection}
                          onChange={(event) =>
                            applyFontSize(Number(event.target.value))
                          }
                          className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-[10px] font-medium text-slate-700 outline-none hover:border-cyan-200 focus:border-cyan-300"
                        >
                          {COLLAB_FONT_SIZES.map((size) => (
                            <option key={size} value={size}>
                              {size} pt
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </label>

                      <label className="relative">
                        <select
                          value={blockStyle}
                          onMouseDown={captureSelection}
                          onChange={(event) => applyBlockStyle(event.target.value)}
                          className="h-9 appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-[10px] font-medium text-slate-700 outline-none hover:border-cyan-200 focus:border-cyan-300"
                        >
                          {COLLAB_BLOCK_STYLES.map((style) => (
                            <option key={style.value} value={style.value}>
                              {style.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </label>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <EditorButton title="Bold" onClick={() => runCommand("bold")}>
                        <Bold className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton title="Italic" onClick={() => runCommand("italic")}>
                        <Italic className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton title="Underline" onClick={() => runCommand("underline")}>
                        <Underline className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton
                        title="Strikethrough"
                        onClick={() => runCommand("strikeThrough")}
                      >
                        <Strikethrough className="h-3.5 w-3.5" />
                      </EditorButton>

                      <label
                        title="Text color"
                        onMouseDown={captureSelection}
                        className="relative flex h-8 min-w-10 cursor-pointer flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50"
                      >
                        T
                        <span
                          className="mt-0.5 h-1 w-5 rounded-full"
                          style={{ backgroundColor: textColor }}
                        />
                        <input
                          type="color"
                          value={textColor}
                          onChange={(event) => applyTextColor(event.target.value)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                          aria-label="Text color"
                        />
                      </label>

                      <label
                        title="Highlight color"
                        onMouseDown={captureSelection}
                        className="relative flex h-8 min-w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-2 transition hover:border-cyan-200 hover:bg-cyan-50"
                      >
                        <span className="text-[13px]">✎</span>
                        <span
                          className="ml-1 h-2 w-4 rounded-sm border border-slate-200"
                          style={{ backgroundColor: highlightColor }}
                        />
                        <input
                          type="color"
                          value={highlightColor}
                          onChange={(event) =>
                            applyHighlightColor(event.target.value)
                          }
                          className="absolute inset-0 cursor-pointer opacity-0"
                          aria-label="Highlight color"
                        />
                      </label>

                      <span className="mx-1 h-6 w-px bg-slate-200" />

                      <EditorButton
                        title="Align left"
                        onClick={() => runCommand("justifyLeft")}
                      >
                        <AlignLeft className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton
                        title="Align center"
                        onClick={() => runCommand("justifyCenter")}
                      >
                        <AlignCenter className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton
                        title="Align right"
                        onClick={() => runCommand("justifyRight")}
                      >
                        <AlignRight className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton
                        title="Justify"
                        onClick={() => runCommand("justifyFull")}
                      >
                        <AlignJustify className="h-3.5 w-3.5" />
                      </EditorButton>

                      <EditorButton
                        title="Bullet list"
                        onClick={() => runCommand("insertUnorderedList")}
                      >
                        <List className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton
                        title="Numbered list"
                        onClick={() => runCommand("insertOrderedList")}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                      </EditorButton>

                      <EditorButton
                        title="Decrease indent"
                        onClick={() => runCommand("outdent")}
                      >
                        <IndentDecrease className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton
                        title="Increase indent"
                        onClick={() => runCommand("indent")}
                      >
                        <IndentIncrease className="h-3.5 w-3.5" />
                      </EditorButton>

                      <label className="relative">
                        <select
                          value={lineSpacing}
                          onMouseDown={captureSelection}
                          onChange={(event) => applyLineSpacing(event.target.value)}
                          title="Line spacing"
                          className="h-8 appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 text-[9px] font-medium text-slate-600 outline-none hover:border-cyan-200 focus:border-cyan-300"
                        >
                          {COLLAB_LINE_SPACING.map((spacing) => (
                            <option key={spacing} value={String(spacing)}>
                              {spacing}×
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                      </label>

                      <span className="mx-1 h-6 w-px bg-slate-200" />

                      <EditorButton title="Add link" onClick={createLink}>
                        <LinkIcon className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton title="Remove link" onClick={() => runCommand("unlink")}>
                        <Unlink className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton title="Insert table" onClick={insertTable}>
                        <Table2 className="h-3.5 w-3.5" />
                      </EditorButton>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        title="Show paragraph marks"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => setShowParagraphMarks((value) => !value)}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 transition ${
                          showParagraphMarks
                            ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50"
                        }`}
                      >
                        <Pilcrow className="h-3.5 w-3.5" />
                      </button>

                      <EditorButton title="Undo" onClick={() => runCommand("undo")}>
                        <Undo2 className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton title="Redo" onClick={() => runCommand("redo")}>
                        <Redo2 className="h-3.5 w-3.5" />
                      </EditorButton>
                      <EditorButton
                        title="Clear formatting"
                        onClick={() => runCommand("removeFormat")}
                      >
                        <Eraser className="h-3.5 w-3.5" />
                        <span className="ml-1 text-[9px] font-medium">Clear</span>
                      </EditorButton>
                    </div>
                  </div>

                  <div className="bg-slate-100/65 p-4 sm:p-6">
                    <style>{`
                      .shared-collab-rich-editor.show-paragraph-marks p::after,
                      .shared-collab-rich-editor.show-paragraph-marks h1::after,
                      .shared-collab-rich-editor.show-paragraph-marks h2::after,
                      .shared-collab-rich-editor.show-paragraph-marks h3::after,
                      .shared-collab-rich-editor.show-paragraph-marks blockquote::after {
                        content: " ¶";
                        color: #94a3b8;
                        font-weight: 400;
                      }
                    `}</style>
                    <div className="mx-auto max-w-[950px] rounded-[20px] border border-cyan-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.08)]">
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(event) => {
                          setDraftHtml(
                            sanitizeBrowserHtml(
                              (event.currentTarget as HTMLDivElement).innerHTML,
                            ),
                          );
                          captureSelection();
                        }}
                        onMouseUp={captureSelection}
                        onKeyUp={captureSelection}
                        onFocus={captureSelection}
                        className={`shared-collab-rich-editor min-h-[760px] px-8 py-10 font-serif text-[16px] leading-[1.7] text-slate-900 outline-none sm:px-14 sm:py-12 [&_img]:max-w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_th]:border [&_th]:border-slate-300 [&_th]:p-2 ${
                          showParagraphMarks ? "show-paragraph-marks" : ""
                        }`}
                        dangerouslySetInnerHTML={{
                          __html:
                            draftHtml ||
                            sanitizeBrowserHtml(selected.content_html || ""),
                        }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-100/65 p-4 sm:p-6">
                  <div className="mx-auto max-w-[950px] overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,.08)]">
                    <iframe
                      key={`${selected.id}:${selected.updated_at}`}
                      title={`Review ${selected.title}`}
                      sandbox=""
                      srcDoc={safeDocumentHtml(selected)}
                      className="h-[760px] w-full border-0 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 bg-cyan-50/45 px-5 py-3 sm:px-6">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" />
                  <p className="text-[8.5px] leading-4 text-slate-500">
                    {access?.canEdit ? (
                      <>
                        You have owner-granted edit access. Every collaborative save
                        checks for newer changes before writing and snapshots the
                        previous document into the collaboration audit history.
                      </>
                    ) : (
                      <>
                        This document is read-only under your current collaboration
                        permissions. Use Review Manager to leave study-owned feedback.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
