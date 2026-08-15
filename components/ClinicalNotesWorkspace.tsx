"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

type NotesClient = {
  connection_id: string;
  client_id: string;
  client_name: string;
};

type NoteFolder = {
  id: string;
  clinician_id: string;
  client_id: string;
  connection_id: string | null;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type ClinicalNote = {
  id: string;
  clinician_id: string;
  client_id: string;
  connection_id: string | null;
  folder_id: string | null;
  title: string;
  note_type:
    | "session"
    | "progress"
    | "assessment"
    | "care"
    | "administrative"
    | "general";
  session_at: string | null;
  content_html: string;
  content_text: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

const noteTypeOptions: Array<{
  value: ClinicalNote["note_type"];
  label: string;
}> = [
  { value: "session", label: "Session note" },
  { value: "progress", label: "Progress note" },
  { value: "assessment", label: "Assessment note" },
  { value: "care", label: "Care / treatment note" },
  { value: "administrative", label: "Administrative note" },
  { value: "general", label: "General note" },
];

const fontFamilies = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Courier New",
  "Inter",
];

const fontSizes = [
  { label: "10", value: "1" },
  { label: "12", value: "2" },
  { label: "14", value: "3" },
  { label: "16", value: "4" },
  { label: "18", value: "5" },
  { label: "24", value: "6" },
  { label: "32", value: "7" },
];

function localDateTimeValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000
  );

  return local.toISOString().slice(0, 16);
}

function humanDate(value: string | null) {
  if (!value) return "No session date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No session date";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sanitizeClinicalNoteHtml(html: string) {
  if (typeof window === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    html,
    "text/html"
  );

  documentNode
    .querySelectorAll(
      "script, iframe, object, embed, form, input, button, textarea, select, meta, link, style"
    )
    .forEach((node) => node.remove());

  documentNode
    .querySelectorAll("*")
    .forEach((element) => {
      Array.from(element.attributes).forEach(
        (attribute) => {
          const name =
            attribute.name.toLowerCase();
          const value = attribute.value;

          if (name.startsWith("on")) {
            element.removeAttribute(
              attribute.name
            );
            return;
          }

          if (
            (name === "href" ||
              name === "src") &&
            /^\s*javascript:/i.test(value)
          ) {
            element.removeAttribute(
              attribute.name
            );
          }
        }
      );
    });

  return documentNode.body.innerHTML;
}

function ToolbarButton({
  title,
  children,
  onClick,
}: {
  title: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

export default function ClinicalNotesWorkspace({
  client,
}: {
  client: NotesClient;
}) {
  const editorRef =
    useRef<HTMLDivElement | null>(null);

  const [folders, setFolders] = useState<
    NoteFolder[]
  >([]);
  const [notes, setNotes] = useState<
    ClinicalNote[]
  >([]);
  const [selectedFolderId, setSelectedFolderId] =
    useState<string>("all");
  const [selectedNoteId, setSelectedNoteId] =
    useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] =
    useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState<
    string | null
  >(null);
  const [noteType, setNoteType] =
    useState<ClinicalNote["note_type"]>(
      "session"
    );
  const [sessionAt, setSessionAt] =
    useState("");
  const [pinned, setPinned] = useState(false);
  const [draftHtml, setDraftHtml] =
    useState("");
  const [draftText, setDraftText] =
    useState("");

  const [newFolderName, setNewFolderName] =
    useState("");
  const [creatingFolder, setCreatingFolder] =
    useState(false);
  const [navigatorCollapsed, setNavigatorCollapsed] =
    useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(
      "psylattice-clinical-notes-navigator-collapsed"
    );

    if (saved === "true") {
      setNavigatorCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "psylattice-clinical-notes-navigator-collapsed",
      String(navigatorCollapsed)
    );
  }, [navigatorCollapsed]);

  const selectedNote = useMemo(
    () =>
      notes.find(
        (note) => note.id === selectedNoteId
      ) || null,
    [notes, selectedNoteId]
  );

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notes
      .filter((note) => {
        if (
          selectedFolderId === "unfiled" &&
          note.folder_id
        ) {
          return false;
        }

        if (
          selectedFolderId !== "all" &&
          selectedFolderId !== "unfiled" &&
          note.folder_id !== selectedFolderId
        ) {
          return false;
        }

        if (!query) return true;

        return [
          note.title,
          note.content_text,
          note.note_type,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }

        return (
          new Date(b.updated_at).getTime() -
          new Date(a.updated_at).getTime()
        );
      });
  }, [notes, selectedFolderId, search]);

  function openNote(note: ClinicalNote) {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setFolderId(note.folder_id);
    setNoteType(note.note_type);
    setSessionAt(
      localDateTimeValue(note.session_at)
    );
    setPinned(note.pinned);
    setDraftHtml(note.content_html || "");
    setDraftText(note.content_text || "");
    setDirty(false);
    setErrorMessage("");
    setMessage("");
    setLastSavedAt(note.updated_at);

    requestAnimationFrame(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML =
          sanitizeClinicalNoteHtml(
            note.content_html || ""
          );
      }
    });
  }

  async function loadWorkspace() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const [
      folderResult,
      noteResult,
    ] = await Promise.all([
      supabase
        .from("clinical_note_folders")
        .select(
          "id, clinician_id, client_id, connection_id, name, position, created_at, updated_at"
        )
        .eq("client_id", client.client_id)
        .order("position", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("clinical_notes")
        .select(
          "id, clinician_id, client_id, connection_id, folder_id, title, note_type, session_at, content_html, content_text, pinned, created_at, updated_at"
        )
        .eq("client_id", client.client_id)
        .order("pinned", {
          ascending: false,
        })
        .order("updated_at", {
          ascending: false,
        }),
    ]);

    if (folderResult.error) {
      console.error(
        "Could not load clinical note folders:",
        folderResult.error
      );
    }

    if (noteResult.error) {
      console.error(
        "Could not load clinical notes:",
        noteResult.error
      );
      setErrorMessage(
        noteResult.error.message ||
          "Professional notes could not be loaded."
      );
      setLoading(false);
      return;
    }

    const nextFolders =
      (folderResult.data || []) as NoteFolder[];
    const nextNotes =
      (noteResult.data || []) as ClinicalNote[];

    setFolders(nextFolders);
    setNotes(nextNotes);

    if (nextNotes.length > 0) {
      const current =
        nextNotes.find(
          (note) =>
            note.id === selectedNoteId
        ) || nextNotes[0];

      openNote(current);
    } else {
      setSelectedNoteId("");
      setTitle("");
      setFolderId(null);
      setNoteType("session");
      setSessionAt("");
      setPinned(false);
      setDraftHtml("");
      setDraftText("");
      setLastSavedAt(null);

      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    setSelectedFolderId("all");
    setSelectedNoteId("");
    setSearch("");
    void loadWorkspace();
  }, [
    client.client_id,
    client.connection_id,
  ]);

  function captureEditor() {
    const editor = editorRef.current;

    if (!editor) return;

    const html =
      sanitizeClinicalNoteHtml(
        editor.innerHTML
      );
    const text =
      editor.innerText.replace(
        /\n{3,}/g,
        "\n\n"
      );

    setDraftHtml(html);
    setDraftText(text);
    setDirty(true);
  }

  function execCommand(
    command: string,
    value?: string
  ) {
    const editor = editorRef.current;

    if (!editor) return;

    editor.focus();

    document.execCommand(
      command,
      false,
      value
    );

    captureEditor();
  }

  function createLink() {
    const url = window.prompt(
      "Enter the URL to link to:"
    );

    if (!url) return;

    const safeUrl = /^https?:\/\//i.test(url)
      ? url
      : `https://${url}`;

    execCommand("createLink", safeUrl);
  }

  async function createNote() {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "The note could not be created."
      );
      return;
    }

    const targetFolderId =
      selectedFolderId !== "all" &&
      selectedFolderId !== "unfiled"
        ? selectedFolderId
        : null;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("clinical_notes")
      .insert({
        clinician_id: user.id,
        client_id: client.client_id,
        connection_id:
          client.connection_id,
        folder_id: targetFolderId,
        title: "Untitled note",
        note_type: "session",
        session_at: now,
        content_html: "",
        content_text: "",
        pinned: false,
      })
      .select(
        "id, clinician_id, client_id, connection_id, folder_id, title, note_type, session_at, content_html, content_text, pinned, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The note could not be created."
      );
      return;
    }

    const note = data as ClinicalNote;

    setNotes((current) => [
      note,
      ...current,
    ]);
    openNote(note);
  }

  async function saveNote({
    quiet = false,
  }: {
    quiet?: boolean;
  } = {}) {
    if (!selectedNoteId || saving) {
      return;
    }

    const cleanTitle =
      title.trim() || "Untitled note";

    setSaving(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("clinical_notes")
      .update({
        title: cleanTitle,
        folder_id: folderId,
        note_type: noteType,
        session_at: sessionAt
          ? new Date(sessionAt).toISOString()
          : null,
        content_html:
          sanitizeClinicalNoteHtml(
            draftHtml
          ),
        content_text: draftText,
        pinned,
      })
      .eq("id", selectedNoteId)
      .select(
        "id, clinician_id, client_id, connection_id, folder_id, title, note_type, session_at, content_html, content_text, pinned, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The note could not be saved."
      );
      setSaving(false);
      return;
    }

    const saved = data as ClinicalNote;

    setNotes((current) =>
      current.map((note) =>
        note.id === saved.id
          ? saved
          : note
      )
    );
    setTitle(saved.title);
    setDirty(false);
    setLastSavedAt(saved.updated_at);
    setSaving(false);

    if (!quiet) {
      setMessage("Note saved.");
      window.setTimeout(
        () => setMessage(""),
        1600
      );
    }
  }

  useEffect(() => {
    if (
      !dirty ||
      !selectedNoteId ||
      saving
    ) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        void saveNote({ quiet: true });
      },
      1200
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    dirty,
    selectedNoteId,
    title,
    folderId,
    noteType,
    sessionAt,
    pinned,
    draftHtml,
    draftText,
  ]);

  function markMetadataDirty() {
    setDirty(true);
    setMessage("");
  }

  async function deleteNote() {
    if (!selectedNote) return;

    const confirmed = window.confirm(
      `Delete "${selectedNote.title}" permanently?`
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("clinical_notes")
      .delete()
      .eq("id", selectedNote.id);

    if (error) {
      setErrorMessage(
        error.message ||
          "The note could not be deleted."
      );
      return;
    }

    const remaining = notes.filter(
      (note) =>
        note.id !== selectedNote.id
    );

    setNotes(remaining);

    if (remaining.length > 0) {
      openNote(remaining[0]);
    } else {
      setSelectedNoteId("");
      setTitle("");
      setDraftHtml("");
      setDraftText("");
      setLastSavedAt(null);

      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
  }

  async function createFolder() {
    const cleanName =
      newFolderName.trim();

    if (!cleanName) return;

    setCreatingFolder(true);
    setErrorMessage("");

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "The folder could not be created."
      );
      setCreatingFolder(false);
      return;
    }

    const { data, error } = await supabase
      .from("clinical_note_folders")
      .insert({
        clinician_id: user.id,
        client_id: client.client_id,
        connection_id:
          client.connection_id,
        name: cleanName,
        position: folders.length,
      })
      .select(
        "id, clinician_id, client_id, connection_id, name, position, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The folder could not be created."
      );
      setCreatingFolder(false);
      return;
    }

    const folder = data as NoteFolder;

    setFolders((current) => [
      ...current,
      folder,
    ]);
    setSelectedFolderId(folder.id);
    setNewFolderName("");
    setCreatingFolder(false);
  }

  async function renameFolder(
    folder: NoteFolder
  ) {
    const nextName = window.prompt(
      "Rename folder:",
      folder.name
    );

    if (
      !nextName ||
      nextName.trim() === folder.name
    ) {
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("clinical_note_folders")
      .update({
        name: nextName.trim(),
      })
      .eq("id", folder.id)
      .select(
        "id, clinician_id, client_id, connection_id, name, position, created_at, updated_at"
      )
      .single();

    if (error || !data) {
      setErrorMessage(
        error?.message ||
          "The folder could not be renamed."
      );
      return;
    }

    setFolders((current) =>
      current.map((candidate) =>
        candidate.id === folder.id
          ? (data as NoteFolder)
          : candidate
      )
    );
  }

  async function deleteFolder(
    folder: NoteFolder
  ) {
    const count = notes.filter(
      (note) =>
        note.folder_id === folder.id
    ).length;

    const confirmed = window.confirm(
      count > 0
        ? `Delete "${folder.name}"? Its ${count} note${
            count === 1 ? "" : "s"
          } will move to Unfiled.`
        : `Delete "${folder.name}"?`
    );

    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("clinical_note_folders")
      .delete()
      .eq("id", folder.id);

    if (error) {
      setErrorMessage(
        error.message ||
          "The folder could not be deleted."
      );
      return;
    }

    setFolders((current) =>
      current.filter(
        (candidate) =>
          candidate.id !== folder.id
      )
    );

    setNotes((current) =>
      current.map((note) =>
        note.folder_id === folder.id
          ? {
              ...note,
              folder_id: null,
            }
          : note
      )
    );

    if (
      selectedFolderId === folder.id
    ) {
      setSelectedFolderId("all");
    }

    if (folderId === folder.id) {
      setFolderId(null);
      setDirty(true);
    }
  }

  const wordCount =
    draftText.trim() === ""
      ? 0
      : draftText
          .trim()
          .split(/\s+/)
          .filter(Boolean).length;

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div
        className={`grid min-h-[720px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-[grid-template-columns] duration-200 ${
          navigatorCollapsed
            ? "xl:grid-cols-[minmax(0,1fr)]"
            : "xl:grid-cols-[230px_300px_minmax(0,1fr)]"
        }`}
      >
        {/* FOLDERS */}
        {!navigatorCollapsed && (
        <aside className="border-b border-slate-200 bg-slate-50/70 p-4 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Folders
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {client.client_name}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const input =
                  document.getElementById(
                    "new-clinical-note-folder"
                  );

                input?.focus();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-600"
              title="New folder"
            >
              +
            </button>
          </div>

          <div className="mt-4 space-y-1">
            <button
              type="button"
              onClick={() =>
                setSelectedFolderId("all")
              }
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${
                selectedFolderId === "all"
                  ? "bg-cyan-50 font-semibold text-cyan-950"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>All notes</span>
              <span className="text-xs text-slate-400">
                {notes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSelectedFolderId(
                  "unfiled"
                )
              }
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${
                selectedFolderId ===
                "unfiled"
                  ? "bg-cyan-50 font-semibold text-cyan-950"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              <span>Unfiled</span>
              <span className="text-xs text-slate-400">
                {
                  notes.filter(
                    (note) => !note.folder_id
                  ).length
                }
              </span>
            </button>

            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`group flex items-center rounded-xl ${
                  selectedFolderId ===
                  folder.id
                    ? "bg-cyan-50"
                    : "hover:bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFolderId(
                      folder.id
                    )
                  }
                  className={`min-w-0 flex-1 px-3 py-2.5 text-left text-sm ${
                    selectedFolderId ===
                    folder.id
                      ? "font-semibold text-cyan-950"
                      : "text-slate-600"
                  }`}
                >
                  <span className="block truncate">
                    {folder.name}
                  </span>
                </button>

                <span className="mr-1 text-[10px] text-slate-400">
                  {
                    notes.filter(
                      (note) =>
                        note.folder_id ===
                        folder.id
                    ).length
                  }
                </span>

                <button
                  type="button"
                  title="Rename folder"
                  onClick={() =>
                    void renameFolder(folder)
                  }
                  className="hidden px-1 py-2 text-xs text-slate-400 group-hover:block"
                >
                  ✎
                </button>

                <button
                  type="button"
                  title="Delete folder"
                  onClick={() =>
                    void deleteFolder(folder)
                  }
                  className="mr-2 hidden px-1 py-2 text-xs text-red-400 group-hover:block"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4">
            <input
              id="new-clinical-note-folder"
              value={newFolderName}
              onChange={(event) =>
                setNewFolderName(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void createFolder();
                }
              }}
              placeholder="New folder name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-cyan-700"
            />

            <button
              type="button"
              disabled={
                creatingFolder ||
                !newFolderName.trim()
              }
              onClick={() =>
                void createFolder()
              }
              className="mt-2 w-full rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              {creatingFolder
                ? "Creating..."
                : "Create folder"}
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
            <p className="text-[11px] font-semibold text-cyan-950">
              Private clinician record
            </p>
            <p className="mt-1 text-[10px] leading-4 text-cyan-900/70">
              Professional Notes are clinician-authored and are not exposed through the client sharing controls.
            </p>
          </div>
        </aside>
        )}

        {/* NOTE LIST */}
        {!navigatorCollapsed && (
        <section className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search notes..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-cyan-700"
            />

            <button
              type="button"
              onClick={() => void createNote()}
              className="shrink-0 rounded-xl bg-cyan-800 px-3 py-2.5 text-xs font-semibold text-white"
            >
              + Note
            </button>
          </div>

          <div className="mt-4 max-h-[650px] space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <p className="p-4 text-sm text-slate-400">
                Loading notes...
              </p>
            ) : filteredNotes.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  No notes here yet
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Create a note or choose another folder.
                </p>
              </div>
            ) : (
              filteredNotes.map((note) => {
                const folder =
                  folders.find(
                    (candidate) =>
                      candidate.id ===
                      note.folder_id
                  ) || null;

                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() =>
                      openNote(note)
                    }
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      note.id ===
                      selectedNoteId
                        ? "border-cyan-300 bg-cyan-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                        {note.title}
                      </p>

                      {note.pinned && (
                        <span
                          title="Pinned"
                          className="text-xs text-amber-500"
                        >
                          ★
                        </span>
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                      {note.content_text ||
                        "Empty note"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">
                        {
                          noteTypeOptions.find(
                            (option) =>
                              option.value ===
                              note.note_type
                          )?.label
                        }
                      </span>

                      {folder && (
                        <span className="rounded-full bg-cyan-50 px-2 py-1 text-[9px] font-medium text-cyan-700">
                          {folder.name}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[9px] text-slate-400">
                      Updated{" "}
                      {shortDate(
                        note.updated_at
                      )}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>
        )}

        {/* EDITOR */}
        <main className="min-w-0">
          {!selectedNote ? (
            <div className="flex min-h-[720px] items-center justify-center p-8">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-lg font-semibold text-cyan-800">
                  N
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  Start a professional note
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create session folders, keep notes organised by client and use the rich editor for structured clinical documentation.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void createNote()
                  }
                  className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Create first note
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[720px] flex-col">
              <div className="border-b border-slate-200 p-4">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <input
                      value={title}
                      onChange={(event) => {
                        setTitle(
                          event.target.value
                        );
                        markMetadataDirty();
                      }}
                      placeholder="Note title"
                      className="w-full border-0 bg-transparent text-xl font-semibold text-slate-950 outline-none"
                    />

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={folderId || ""}
                        onChange={(event) => {
                          setFolderId(
                            event.target.value ||
                              null
                          );
                          markMetadataDirty();
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600"
                      >
                        <option value="">
                          Unfiled
                        </option>
                        {folders.map(
                          (folder) => (
                            <option
                              key={folder.id}
                              value={folder.id}
                            >
                              {folder.name}
                            </option>
                          )
                        )}
                      </select>

                      <select
                        value={noteType}
                        onChange={(event) => {
                          setNoteType(
                            event.target
                              .value as ClinicalNote["note_type"]
                          );
                          markMetadataDirty();
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600"
                      >
                        {noteTypeOptions.map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          )
                        )}
                      </select>

                      <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500">
                        Session
                        <input
                          type="datetime-local"
                          value={sessionAt}
                          onChange={(event) => {
                            setSessionAt(
                              event.target.value
                            );
                            markMetadataDirty();
                          }}
                          className="bg-transparent outline-none"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNavigatorCollapsed(
                          (current) => !current
                        )
                      }
                      title={
                        navigatorCollapsed
                          ? "Show folders and note list"
                          : "Hide folders and note list"
                      }
                      aria-label={
                        navigatorCollapsed
                          ? "Show folders and note list"
                          : "Hide folders and note list"
                      }
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      {navigatorCollapsed
                        ? "☰ Show navigator"
                        : "⇤ Focus editor"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPinned(
                          (current) =>
                            !current
                        );
                        markMetadataDirty();
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        pinned
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {pinned
                        ? "★ Pinned"
                        : "☆ Pin"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void saveNote()
                      }
                      disabled={
                        saving || !dirty
                      }
                      className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {saving
                        ? "Saving..."
                        : dirty
                          ? "Save"
                          : "Saved"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void deleteNote()
                      }
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                  <span>
                    {humanDate(
                      selectedNote.session_at
                    )}
                  </span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>
                    {saving
                      ? "Saving changes..."
                      : dirty
                        ? "Unsaved changes"
                        : lastSavedAt
                          ? `Saved ${new Date(
                              lastSavedAt
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}`
                          : "Saved"}
                  </span>
                  {message && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-emerald-600">
                        {message}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* RICH TOOLBAR */}
              <div className="sticky top-20 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    defaultValue="Arial"
                    onChange={(event) =>
                      execCommand(
                        "fontName",
                        event.target.value
                      )
                    }
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    title="Font"
                  >
                    {fontFamilies.map(
                      (font) => (
                        <option
                          key={font}
                          value={font}
                        >
                          {font}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    defaultValue="3"
                    onChange={(event) =>
                      execCommand(
                        "fontSize",
                        event.target.value
                      )
                    }
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    title="Font size"
                  >
                    {fontSizes.map(
                      (size) => (
                        <option
                          key={size.value}
                          value={size.value}
                        >
                          {size.label}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    defaultValue="p"
                    onChange={(event) =>
                      execCommand(
                        "formatBlock",
                        event.target.value
                      )
                    }
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600"
                    title="Paragraph style"
                  >
                    <option value="p">
                      Normal
                    </option>
                    <option value="h1">
                      Heading 1
                    </option>
                    <option value="h2">
                      Heading 2
                    </option>
                    <option value="h3">
                      Heading 3
                    </option>
                    <option value="blockquote">
                      Quote
                    </option>
                  </select>

                  <span className="mx-1 h-6 w-px bg-slate-200" />

                  <ToolbarButton
                    title="Bold"
                    onClick={() =>
                      execCommand("bold")
                    }
                  >
                    <span className="font-black">
                      B
                    </span>
                  </ToolbarButton>

                  <ToolbarButton
                    title="Italic"
                    onClick={() =>
                      execCommand("italic")
                    }
                  >
                    <span className="italic">
                      I
                    </span>
                  </ToolbarButton>

                  <ToolbarButton
                    title="Underline"
                    onClick={() =>
                      execCommand(
                        "underline"
                      )
                    }
                  >
                    <span className="underline">
                      U
                    </span>
                  </ToolbarButton>

                  <ToolbarButton
                    title="Strikethrough"
                    onClick={() =>
                      execCommand(
                        "strikeThrough"
                      )
                    }
                  >
                    <span className="line-through">
                      S
                    </span>
                  </ToolbarButton>

                  <label
                    title="Text colour"
                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-500"
                  >
                    A
                    <input
                      type="color"
                      defaultValue="#0f172a"
                      onChange={(event) =>
                        execCommand(
                          "foreColor",
                          event.target.value
                        )
                      }
                      className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
                    />
                  </label>

                  <label
                    title="Highlight colour"
                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-500"
                  >
                    ▰
                    <input
                      type="color"
                      defaultValue="#fef08a"
                      onChange={(event) =>
                        execCommand(
                          "hiliteColor",
                          event.target.value
                        )
                      }
                      className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
                    />
                  </label>

                  <span className="mx-1 h-6 w-px bg-slate-200" />

                  <ToolbarButton
                    title="Align left"
                    onClick={() =>
                      execCommand(
                        "justifyLeft"
                      )
                    }
                  >
                    ≡
                  </ToolbarButton>

                  <ToolbarButton
                    title="Align centre"
                    onClick={() =>
                      execCommand(
                        "justifyCenter"
                      )
                    }
                  >
                    ≣
                  </ToolbarButton>

                  <ToolbarButton
                    title="Align right"
                    onClick={() =>
                      execCommand(
                        "justifyRight"
                      )
                    }
                  >
                    ≡
                  </ToolbarButton>

                  <ToolbarButton
                    title="Justify"
                    onClick={() =>
                      execCommand(
                        "justifyFull"
                      )
                    }
                  >
                    ☰
                  </ToolbarButton>

                  <ToolbarButton
                    title="Bulleted list"
                    onClick={() =>
                      execCommand(
                        "insertUnorderedList"
                      )
                    }
                  >
                    • List
                  </ToolbarButton>

                  <ToolbarButton
                    title="Numbered list"
                    onClick={() =>
                      execCommand(
                        "insertOrderedList"
                      )
                    }
                  >
                    1. List
                  </ToolbarButton>

                  <ToolbarButton
                    title="Decrease indent"
                    onClick={() =>
                      execCommand("outdent")
                    }
                  >
                    ←
                  </ToolbarButton>

                  <ToolbarButton
                    title="Increase indent"
                    onClick={() =>
                      execCommand("indent")
                    }
                  >
                    →
                  </ToolbarButton>

                  <span className="mx-1 h-6 w-px bg-slate-200" />

                  <ToolbarButton
                    title="Add link"
                    onClick={createLink}
                  >
                    Link
                  </ToolbarButton>

                  <ToolbarButton
                    title="Remove link"
                    onClick={() =>
                      execCommand("unlink")
                    }
                  >
                    Unlink
                  </ToolbarButton>

                  <ToolbarButton
                    title="Horizontal line"
                    onClick={() =>
                      execCommand(
                        "insertHorizontalRule"
                      )
                    }
                  >
                    ―
                  </ToolbarButton>

                  <ToolbarButton
                    title="Undo"
                    onClick={() =>
                      execCommand("undo")
                    }
                  >
                    ↶
                  </ToolbarButton>

                  <ToolbarButton
                    title="Redo"
                    onClick={() =>
                      execCommand("redo")
                    }
                  >
                    ↷
                  </ToolbarButton>

                  <ToolbarButton
                    title="Clear formatting"
                    onClick={() =>
                      execCommand(
                        "removeFormat"
                      )
                    }
                  >
                    Clear
                  </ToolbarButton>
                </div>
              </div>

              <div className="relative flex-1 bg-slate-50/40 p-4 sm:p-6">
                {navigatorCollapsed && (
                  <button
                    type="button"
                    onClick={() =>
                      setNavigatorCollapsed(false)
                    }
                    title="Show folders and note list"
                    className="absolute left-3 top-3 z-10 hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 shadow-sm hover:bg-slate-50 xl:block"
                  >
                    ☰ Notes
                  </button>
                )}

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={captureEditor}
                  onBlur={captureEditor}
                  data-placeholder="Start writing your professional note..."
                  className={`clinical-rich-note-editor mx-auto min-h-[560px] rounded-2xl border border-slate-200 bg-white px-8 py-9 text-[15px] leading-7 text-slate-800 shadow-sm outline-none transition-[max-width] duration-200 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50 ${
                    navigatorCollapsed
                      ? "max-w-[1180px]"
                      : "max-w-[900px]"
                  }`}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        .clinical-rich-note-editor:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }

        .clinical-rich-note-editor h1 {
          margin: 1.2em 0 0.55em;
          font-size: 1.9em;
          font-weight: 700;
          line-height: 1.2;
        }

        .clinical-rich-note-editor h2 {
          margin: 1.1em 0 0.5em;
          font-size: 1.5em;
          font-weight: 700;
          line-height: 1.3;
        }

        .clinical-rich-note-editor h3 {
          margin: 1em 0 0.45em;
          font-size: 1.2em;
          font-weight: 700;
        }

        .clinical-rich-note-editor p,
        .clinical-rich-note-editor div {
          margin: 0.45em 0;
        }

        .clinical-rich-note-editor ul {
          margin: 0.6em 0;
          padding-left: 1.6em;
          list-style: disc;
        }

        .clinical-rich-note-editor ol {
          margin: 0.6em 0;
          padding-left: 1.6em;
          list-style: decimal;
        }

        .clinical-rich-note-editor blockquote {
          margin: 0.8em 0;
          border-left: 3px solid #a5f3fc;
          padding-left: 1em;
          color: #475569;
        }

        .clinical-rich-note-editor a {
          color: #0e7490;
          text-decoration: underline;
        }

        .clinical-rich-note-editor hr {
          margin: 1.4em 0;
          border: 0;
          border-top: 1px solid #cbd5e1;
        }
      `}</style>
    </div>
  );
}
