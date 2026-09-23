"use client";

import {
  BookOpen,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe2,
  Library,
  Link2,
  Loader2,
  Maximize2,
  Minimize2,
  NotebookPen,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";

type ReferenceAuthor = {
  given?: string | null;
  family?: string | null;
  literal?: string | null;
  orcid?: string | null;
};

type ReferenceItem = {
  id: string;
  owner_user_id: string;
  item_type: string;
  title: string;
  authors: ReferenceAuthor[];
  editors: ReferenceAuthor[];
  published_year: number | null;
  published_date: string | null;
  container_title: string | null;
  publisher: string | null;
  publisher_place: string | null;
  volume: string | null;
  issue: string | null;
  page: string | null;
  edition: string | null;
  doi: string | null;
  url: string | null;
  isbn: string | null;
  issn: string | null;
  pmid: string | null;
  abstract: string | null;
  language: string | null;
  keywords: string[];
  citation_key: string | null;
  raw_csl: Record<string, unknown>;
  source_metadata: Record<string, unknown>;
  source_kind: string;
  metadata_verified_at: string | null;
  ai_index_status: string;
  created_at: string;
  updated_at: string;
};

type ReferenceCollection = {
  id: string;
  owner_user_id: string;
  parent_collection_id: string | null;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
};

type ReferenceCollectionItem = {
  owner_user_id: string;
  collection_id: string;
  reference_id: string;
  created_at: string;
};

type ReferenceStudyLink = {
  id: string;
  owner_user_id: string;
  reference_id: string;
  study_id: string;
  linked_by: "manual" | "ai" | "import";
  created_at: string;
};

type ReferenceFile = {
  id: string;
  owner_user_id: string;
  reference_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string | null;
  extraction_status: "not_requested" | "pending" | "ready" | "failed";
  created_at: string;
  updated_at: string;
};

type ReferenceNoteType =
  | "general"
  | "key_findings"
  | "method_sample"
  | "limitations"
  | "study_relevance"
  | "literature_review";

type ReferenceNote = {
  id: string;
  owner_user_id: string;
  reference_id: string;
  study_id: string | null;
  note_type: ReferenceNoteType;
  content: string;
  created_at: string;
  updated_at: string;
};

type ResearchStudy = {
  id: string;
  title: string;
  status: string;
};

type ReferenceDraft = {
  item_type: string;
  title: string;
  authors_text: string;
  published_year: string;
  container_title: string;
  publisher: string;
  volume: string;
  issue: string;
  page: string;
  doi: string;
  url: string;
  abstract: string;
  keywords_text: string;
};

type CollectionTreeNode = ReferenceCollection & {
  children: CollectionTreeNode[];
};

const EMPTY_DRAFT: ReferenceDraft = {
  item_type: "article-journal",
  title: "",
  authors_text: "",
  published_year: "",
  container_title: "",
  publisher: "",
  volume: "",
  issue: "",
  page: "",
  doi: "",
  url: "",
  abstract: "",
  keywords_text: "",
};

const ITEM_TYPES = [
  ["article-journal", "Journal article"],
  ["paper-conference", "Conference paper"],
  ["book", "Book"],
  ["chapter", "Book chapter"],
  ["thesis", "Thesis / dissertation"],
  ["report", "Report"],
  ["dataset", "Dataset"],
  ["webpage", "Web page"],
  ["other", "Other"],
] as const;

const NOTE_TYPES: {
  value: ReferenceNoteType;
  label: string;
  placeholder: string;
}[] = [
  {
    value: "general",
    label: "General",
    placeholder: "Your general notes, thoughts, reminders or questions about this reference…",
  },
  {
    value: "key_findings",
    label: "Key findings",
    placeholder: "Record the main findings, effects, results or conclusions you want to remember…",
  },
  {
    value: "method_sample",
    label: "Method & sample",
    placeholder: "Note the design, sample, measures, procedure, analyses or methodological details…",
  },
  {
    value: "limitations",
    label: "Limitations",
    placeholder: "Record limitations, caveats, weaknesses or issues you may want to discuss later…",
  },
  {
    value: "study_relevance",
    label: "Why it matters",
    placeholder: "Explain how this paper relates to your current study, hypotheses, design or interpretation…",
  },
  {
    value: "literature_review",
    label: "Literature review draft",
    placeholder: "Draft a paragraph or synthesis you may later move into your Review of Literature / Thesis Builder…",
  },
];

function cleanDoi(value: string | null | undefined) {
  if (!value) return "";
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .trim()
    .toLowerCase();
}

function parseAuthors(value: string): ReferenceAuthor[] {
  return value
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const comma = entry.indexOf(",");
      if (comma >= 0) {
        const family = entry.slice(0, comma).trim();
        const given = entry.slice(comma + 1).trim();
        return {
          family: family || null,
          given: given || null,
        };
      }

      const parts = entry.split(/\s+/).filter(Boolean);
      if (parts.length <= 1) {
        return { literal: entry };
      }

      return {
        given: parts.slice(0, -1).join(" "),
        family: parts.at(-1) || null,
      };
    });
}

function authorsToText(authors: ReferenceAuthor[] | null | undefined) {
  return (authors || [])
    .map((author) => {
      if (author.literal) return author.literal;
      if (author.family && author.given) return `${author.family}, ${author.given}`;
      return author.family || author.given || "";
    })
    .filter(Boolean)
    .join("; ");
}

function formatAuthors(authors: ReferenceAuthor[] | null | undefined) {
  const list = (authors || [])
    .map((author) => author.family || author.literal || author.given || "")
    .filter(Boolean);

  if (list.length === 0) return "No author";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} & ${list[1]}`;
  return `${list[0]} et al.`;
}

function humanType(type: string) {
  return ITEM_TYPES.find(([value]) => value === type)?.[1] || "Reference";
}

function buildCollectionTree(collections: ReferenceCollection[]) {
  const byParent = new Map<string | null, ReferenceCollection[]>();

  for (const collection of collections) {
    const parent = collection.parent_collection_id || null;
    const list = byParent.get(parent) || [];
    list.push(collection);
    byParent.set(parent, list);
  }

  for (const [, list] of byParent) {
    list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
  }

  function build(parent: string | null): CollectionTreeNode[] {
    return (byParent.get(parent) || []).map((collection) => ({
      ...collection,
      children: build(collection.id),
    }));
  }

  return build(null);
}

type FlattenedCollection = {
  collection: CollectionTreeNode;
  depth: number;
};

function flattenCollectionTree(
  nodes: CollectionTreeNode[],
  depth = 0,
): FlattenedCollection[] {
  return nodes.flatMap<FlattenedCollection>((node) => [
    { collection: node, depth },
    ...flattenCollectionTree(node.children, depth + 1),
  ]);
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function ModalShell({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.28)]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur-xl">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.025em] text-slate-950">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function ReferenceManager() {
  const [userId, setUserId] = useState("");
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [collections, setCollections] = useState<ReferenceCollection[]>([]);
  const [collectionItems, setCollectionItems] = useState<ReferenceCollectionItem[]>([]);
  const [studyLinks, setStudyLinks] = useState<ReferenceStudyLink[]>([]);
  const [studies, setStudies] = useState<ResearchStudy[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [referenceNotes, setReferenceNotes] = useState<ReferenceNote[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortMode, setSortMode] = useState<"updated" | "year" | "title">("updated");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingReferenceId, setEditingReferenceId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReferenceDraft>(EMPTY_DRAFT);

  const [doiOpen, setDoiOpen] = useState(false);
  const [doiValue, setDoiValue] = useState("");

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importText, setImportText] = useState("");
  const [importFormat, setImportFormat] = useState<"auto" | "bibtex" | "ris">("auto");

  const [collectionOpen, setCollectionOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionParentId, setCollectionParentId] = useState<string | null>(null);

  const [noteScope, setNoteScope] = useState("global");
  const [noteType, setNoteType] = useState<ReferenceNoteType>("literature_review");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSavedAt, setNoteSavedAt] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const collectionTree = useMemo(
    () => buildCollectionTree(collections),
    [collections],
  );
  const flatCollections = useMemo(
    () => flattenCollectionTree(collectionTree),
    [collectionTree],
  );

  const selectedReference = useMemo(
    () => references.find((reference) => reference.id === selectedReferenceId) || null,
    [references, selectedReferenceId],
  );

  const referenceCollectionIds = useMemo(() => {
    if (!selectedReferenceId) return new Set<string>();
    return new Set(
      collectionItems
        .filter((row) => row.reference_id === selectedReferenceId)
        .map((row) => row.collection_id),
    );
  }, [collectionItems, selectedReferenceId]);

  const selectedReferenceStudyIds = useMemo(() => {
    if (!selectedReferenceId) return new Set<string>();
    return new Set(
      studyLinks
        .filter((row) => row.reference_id === selectedReferenceId)
        .map((row) => row.study_id),
    );
  }, [studyLinks, selectedReferenceId]);

  const selectedReferenceFiles = useMemo(
    () =>
      selectedReferenceId
        ? referenceFiles.filter(
            (file) => file.reference_id === selectedReferenceId,
          )
        : [],
    [referenceFiles, selectedReferenceId],
  );

  const selectedLinkedStudies = useMemo(
    () =>
      studies.filter((study) =>
        selectedReferenceStudyIds.has(study.id),
      ),
    [studies, selectedReferenceStudyIds],
  );

  const countsByCollection = useMemo(() => {
    const counts = new Map<string, number>();
    for (const link of collectionItems) {
      counts.set(link.collection_id, (counts.get(link.collection_id) || 0) + 1);
    }
    return counts;
  }, [collectionItems]);

  const unfiledCount = useMemo(() => {
    const filed = new Set(collectionItems.map((row) => row.reference_id));
    return references.filter((reference) => !filed.has(reference.id)).length;
  }, [collectionItems, references]);

  const filteredReferences = useMemo(() => {
    const query = search.trim().toLowerCase();
    const inSelectedCollection =
      selectedCollection === "all"
        ? null
        : selectedCollection === "unfiled"
          ? new Set(
              references
                .filter(
                  (reference) =>
                    !collectionItems.some(
                      (row) => row.reference_id === reference.id,
                    ),
                )
                .map((reference) => reference.id),
            )
          : new Set(
              collectionItems
                .filter((row) => row.collection_id === selectedCollection)
                .map((row) => row.reference_id),
            );

    const next = references.filter((reference) => {
      if (inSelectedCollection && !inSelectedCollection.has(reference.id)) return false;
      if (typeFilter !== "all" && reference.item_type !== typeFilter) return false;

      if (!query) return true;

      const haystack = [
        reference.title,
        formatAuthors(reference.authors),
        reference.container_title || "",
        reference.doi || "",
        String(reference.published_year || ""),
        reference.keywords?.join(" ") || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    next.sort((a, b) => {
      if (sortMode === "title") return a.title.localeCompare(b.title);
      if (sortMode === "year") {
        return (b.published_year || 0) - (a.published_year || 0) || a.title.localeCompare(b.title);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return next;
  }, [
    references,
    collectionItems,
    selectedCollection,
    search,
    typeFilter,
    sortMode,
  ]);

  useEffect(() => {
    void loadReferenceLibrary();
  }, []);

  useEffect(() => {
    if (!isFullScreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFullScreen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullScreen]);

  useEffect(() => {
    if (
      noteScope !== "global" &&
      !selectedReferenceStudyIds.has(noteScope)
    ) {
      setNoteScope("global");
    }
  }, [noteScope, selectedReferenceId, selectedReferenceStudyIds]);

  useEffect(() => {
    if (!selectedReferenceId) {
      setNoteDraft("");
      setNoteSavedAt(null);
      return;
    }

    const studyId = noteScope === "global" ? null : noteScope;
    const existing = referenceNotes.find(
      (note) =>
        note.reference_id === selectedReferenceId &&
        note.study_id === studyId &&
        note.note_type === noteType,
    );

    setNoteDraft(existing?.content || "");
    setNoteSavedAt(existing?.updated_at || null);
  }, [
    noteScope,
    noteType,
    referenceNotes,
    selectedReferenceId,
  ]);

  async function loadReferenceLibrary() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again to open your Reference Manager.");
      }

      setUserId(user.id);

      const [
        referenceResult,
        collectionResult,
        collectionItemResult,
        studyResult,
        studyLinkResult,
        fileResult,
        noteResult,
      ] = await Promise.all([
        supabase
          .from("reference_items")
          .select("*")
          .eq("owner_user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("reference_collections")
          .select("*")
          .eq("owner_user_id", user.id)
          .order("position", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("reference_collection_items")
          .select("*")
          .eq("owner_user_id", user.id),
        supabase
          .from("research_studies")
          .select("id, title, status")
          .eq("owner_user_id", user.id)
          .order("updated_at", { ascending: false }),
        supabase
          .from("reference_study_links")
          .select("*")
          .eq("owner_user_id", user.id),
        supabase
          .from("reference_files")
          .select("*")
          .eq("owner_user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("reference_notes")
          .select("*")
          .eq("owner_user_id", user.id)
          .order("updated_at", { ascending: false }),
      ]);

      const firstError =
        referenceResult.error ||
        collectionResult.error ||
        collectionItemResult.error ||
        studyResult.error ||
        studyLinkResult.error ||
        fileResult.error ||
        noteResult.error;

      if (firstError) throw firstError;

      const nextReferences = (referenceResult.data || []) as ReferenceItem[];
      setReferences(nextReferences);
      setCollections((collectionResult.data || []) as ReferenceCollection[]);
      setCollectionItems(
        (collectionItemResult.data || []) as ReferenceCollectionItem[],
      );
      setStudies((studyResult.data || []) as ResearchStudy[]);
      setStudyLinks((studyLinkResult.data || []) as ReferenceStudyLink[]);
      setReferenceFiles((fileResult.data || []) as ReferenceFile[]);
      setReferenceNotes((noteResult.data || []) as ReferenceNote[]);

      if (!selectedReferenceId && nextReferences.length > 0) {
        setSelectedReferenceId(nextReferences[0].id);
      }
    } catch (caught) {
      console.error("Reference Manager load failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not load your Reference Library.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function openNewReference() {
    clearMessages();
    setEditingReferenceId(null);
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  }

  function openEditReference(reference: ReferenceItem) {
    clearMessages();
    setEditingReferenceId(reference.id);
    setDraft({
      item_type: reference.item_type,
      title: reference.title,
      authors_text: authorsToText(reference.authors),
      published_year: reference.published_year
        ? String(reference.published_year)
        : "",
      container_title: reference.container_title || "",
      publisher: reference.publisher || "",
      volume: reference.volume || "",
      issue: reference.issue || "",
      page: reference.page || "",
      doi: reference.doi || "",
      url: reference.url || "",
      abstract: reference.abstract || "",
      keywords_text: (reference.keywords || []).join(", "),
    });
    setEditorOpen(true);
  }

  async function saveReference(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    const title = draft.title.trim();
    if (!title) {
      setError("A reference title is required.");
      return;
    }

    const parsedYear = draft.published_year.trim()
      ? Number(draft.published_year)
      : null;

    if (
      parsedYear !== null &&
      (!Number.isInteger(parsedYear) || parsedYear < 1000 || parsedYear > 9999)
    ) {
      setError("Enter a valid four-digit publication year.");
      return;
    }

    const payload = {
      owner_user_id: userId,
      item_type: draft.item_type,
      title,
      authors: parseAuthors(draft.authors_text),
      published_year: parsedYear,
      container_title: draft.container_title.trim() || null,
      publisher: draft.publisher.trim() || null,
      volume: draft.volume.trim() || null,
      issue: draft.issue.trim() || null,
      page: draft.page.trim() || null,
      doi: cleanDoi(draft.doi) || null,
      url: draft.url.trim() || null,
      abstract: draft.abstract.trim() || null,
      keywords: draft.keywords_text
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean),
      source_kind: editingReferenceId ? undefined : "manual",
    };

    setBusy(true);
    try {
      const supabase = createClient();

      if (editingReferenceId) {
        const { source_kind: _sourceKind, ...updatePayload } = payload;
        const { data, error: updateError } = await supabase
          .from("reference_items")
          .update(updatePayload)
          .eq("id", editingReferenceId)
          .eq("owner_user_id", userId)
          .select("*")
          .single();

        if (updateError) throw updateError;

        setReferences((current) =>
          current.map((reference) =>
            reference.id === editingReferenceId
              ? (data as ReferenceItem)
              : reference,
          ),
        );
        setSelectedReferenceId(editingReferenceId);
        setNotice("Reference updated.");
      } else {
        const { data, error: insertError } = await supabase
          .from("reference_items")
          .insert(payload)
          .select("*")
          .single();

        if (insertError) throw insertError;

        const inserted = data as ReferenceItem;
        setReferences((current) => [inserted, ...current]);
        setSelectedReferenceId(inserted.id);

        if (
          selectedCollection !== "all" &&
          selectedCollection !== "unfiled"
        ) {
          const { data: collectionLink, error: linkError } = await supabase
            .from("reference_collection_items")
            .insert({
              owner_user_id: userId,
              collection_id: selectedCollection,
              reference_id: inserted.id,
            })
            .select("*")
            .single();

          if (linkError) throw linkError;

          setCollectionItems((current) => [
            collectionLink as ReferenceCollectionItem,
            ...current,
          ]);
        }

        setNotice("Reference added to your library.");
      }

      setEditorOpen(false);
    } catch (caught) {
      console.error("Reference save failed:", caught);
      const message =
        caught && typeof caught === "object" && "code" in caught && caught.code === "23505"
          ? "That DOI is already in your Reference Library."
          : caught instanceof Error
            ? caught.message
            : "PsyLattice could not save this reference.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteReference(reference: ReferenceItem) {
    const confirmed = window.confirm(
      `Delete “${reference.title}” from your Reference Library?\n\nThis removes the library item, its study/folder links and any attached PDFs. It does not delete your research study.`,
    );
    if (!confirmed) return;

    clearMessages();
    setBusy(true);

    try {
      const supabase = createClient();
      const attachedFiles = referenceFiles.filter(
        (file) => file.reference_id === reference.id,
      );

      if (attachedFiles.length > 0) {
        const { error: storageDeleteError } = await supabase.storage
          .from("reference-files")
          .remove(attachedFiles.map((file) => file.storage_path));

        if (storageDeleteError) throw storageDeleteError;
      }

      const { error: deleteError } = await supabase
        .from("reference_items")
        .delete()
        .eq("id", reference.id)
        .eq("owner_user_id", userId);

      if (deleteError) throw deleteError;

      setReferences((current) =>
        current.filter((item) => item.id !== reference.id),
      );
      setCollectionItems((current) =>
        current.filter((item) => item.reference_id !== reference.id),
      );
      setStudyLinks((current) =>
        current.filter((item) => item.reference_id !== reference.id),
      );
      setReferenceFiles((current) =>
        current.filter((item) => item.reference_id !== reference.id),
      );
      setReferenceNotes((current) =>
        current.filter((item) => item.reference_id !== reference.id),
      );

      if (selectedReferenceId === reference.id) {
        const fallback = references.find((item) => item.id !== reference.id);
        setSelectedReferenceId(fallback?.id || null);
      }

      setNotice("Reference deleted.");
    } catch (caught) {
      console.error("Reference delete failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not delete this reference.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addByDoi(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    const normalized = cleanDoi(doiValue);
    if (!normalized) {
      setError("Enter a DOI first.");
      return;
    }

    const alreadySaved = references.find(
      (reference) => cleanDoi(reference.doi) === normalized,
    );

    if (alreadySaved) {
      setSelectedReferenceId(alreadySaved.id);
      setDoiOpen(false);
      setDoiValue("");
      setNotice("That DOI is already in your library. I opened the saved reference.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(
        `/api/references/doi?doi=${encodeURIComponent(normalized)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok || !payload?.reference) {
        throw new Error(payload?.error || "PsyLattice could not resolve that DOI.");
      }

      const metadata = payload.reference as Record<string, unknown>;
      const supabase = createClient();

      const insertPayload = {
        owner_user_id: userId,
        item_type: String(metadata.item_type || "article-journal"),
        title: String(metadata.title || "Untitled reference"),
        authors: Array.isArray(metadata.authors) ? metadata.authors : [],
        editors: Array.isArray(metadata.editors) ? metadata.editors : [],
        published_year:
          typeof metadata.published_year === "number"
            ? metadata.published_year
            : null,
        published_date:
          typeof metadata.published_date === "string"
            ? metadata.published_date
            : null,
        container_title:
          typeof metadata.container_title === "string"
            ? metadata.container_title
            : null,
        publisher:
          typeof metadata.publisher === "string" ? metadata.publisher : null,
        volume: typeof metadata.volume === "string" ? metadata.volume : null,
        issue: typeof metadata.issue === "string" ? metadata.issue : null,
        page: typeof metadata.page === "string" ? metadata.page : null,
        doi: typeof metadata.doi === "string" ? metadata.doi : normalized,
        url: typeof metadata.url === "string" ? metadata.url : null,
        isbn: typeof metadata.isbn === "string" ? metadata.isbn : null,
        issn: typeof metadata.issn === "string" ? metadata.issn : null,
        abstract:
          typeof metadata.abstract === "string" ? metadata.abstract : null,
        language:
          typeof metadata.language === "string" ? metadata.language : null,
        raw_csl:
          metadata.raw_csl && typeof metadata.raw_csl === "object"
            ? metadata.raw_csl
            : {},
        source_metadata:
          metadata.source_metadata && typeof metadata.source_metadata === "object"
            ? metadata.source_metadata
            : {},
        source_kind: "doi",
        metadata_verified_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from("reference_items")
        .insert(insertPayload)
        .select("*")
        .single();

      if (insertError) throw insertError;

      const inserted = data as ReferenceItem;
      setReferences((current) => [inserted, ...current]);
      setSelectedReferenceId(inserted.id);

      if (
        selectedCollection !== "all" &&
        selectedCollection !== "unfiled"
      ) {
        const { data: collectionLink, error: linkError } = await supabase
          .from("reference_collection_items")
          .insert({
            owner_user_id: userId,
            collection_id: selectedCollection,
            reference_id: inserted.id,
          })
          .select("*")
          .single();

        if (linkError) throw linkError;
        setCollectionItems((current) => [
          collectionLink as ReferenceCollectionItem,
          ...current,
        ]);
      }

      setDoiOpen(false);
      setDoiValue("");
      setNotice("Reference metadata verified by DOI and added to your library.");
    } catch (caught) {
      console.error("DOI import failed:", caught);
      const message =
        caught && typeof caught === "object" && "code" in caught && caught.code === "23505"
          ? "That DOI is already in your Reference Library."
          : caught instanceof Error
            ? caught.message
            : "PsyLattice could not add this DOI.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }


  async function uploadPdf(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    if (!selectedReference) {
      setError("Select a reference before attaching a PDF.");
      return;
    }

    if (!pdfFile) {
      setError("Choose a PDF file first.");
      return;
    }

    setBusy(true);

    try {
      const formData = new FormData();
      formData.set("reference_id", selectedReference.id);
      formData.set("file", pdfFile);

      const response = await fetch("/api/references/files", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok || !payload?.file) {
        throw new Error(payload?.error || "PsyLattice could not upload this PDF.");
      }

      setReferenceFiles((current) => [
        payload.file as ReferenceFile,
        ...current,
      ]);

      setReferences((current) =>
        current.map((reference) =>
          reference.id === selectedReference.id
            ? {
                ...reference,
                ai_index_status:
                  payload?.extraction?.status === "ready"
                    ? "pending"
                    : reference.ai_index_status,
              }
            : reference,
        ),
      );

      setPdfOpen(false);
      setPdfFile(null);

      if (payload?.extraction?.status === "ready") {
        const pages = payload?.extraction?.page_count
          ? ` (${payload.extraction.page_count} pages)`
          : "";
        setNotice(
          `PDF attached and machine-readable full text extracted${pages}. It is ready for the later AI indexing step.`,
        );
      } else {
        setNotice(
          payload?.extraction?.message ||
            "PDF attached. Full-text extraction was not available for this file.",
        );
      }
    } catch (caught) {
      console.error("Reference PDF upload failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not upload this PDF.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openReferencePdf(file: ReferenceFile) {
    clearMessages();

    try {
      const supabase = createClient();
      const { data, error: signedUrlError } = await supabase.storage
        .from(file.storage_bucket || "reference-files")
        .createSignedUrl(file.storage_path, 60);

      if (signedUrlError || !data?.signedUrl) {
        throw signedUrlError || new Error("Could not create a secure PDF link.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      console.error("Reference PDF open failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not open this PDF.",
      );
    }
  }

  async function deleteReferencePdf(file: ReferenceFile) {
    const confirmed = window.confirm(
      `Remove “${file.file_name}” from this reference?`,
    );
    if (!confirmed) return;

    clearMessages();
    setBusy(true);

    try {
      const supabase = createClient();

      const { error: storageDeleteError } = await supabase.storage
        .from(file.storage_bucket || "reference-files")
        .remove([file.storage_path]);

      if (storageDeleteError) throw storageDeleteError;

      const { error: rowDeleteError } = await supabase
        .from("reference_files")
        .delete()
        .eq("id", file.id)
        .eq("owner_user_id", userId);

      if (rowDeleteError) throw rowDeleteError;

      setReferenceFiles((current) =>
        current.filter((item) => item.id !== file.id),
      );
      setNotice("PDF attachment removed.");
    } catch (caught) {
      console.error("Reference PDF delete failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not remove this PDF.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function importReferences(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    if (!importFile && !importText.trim()) {
      setError("Choose a BibTeX/RIS file or paste reference data.");
      return;
    }

    setBusy(true);

    try {
      const formData = new FormData();
      if (importFile) formData.set("file", importFile);
      if (importText.trim()) formData.set("text", importText);
      if (importFormat !== "auto") formData.set("format", importFormat);

      const response = await fetch("/api/references/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload?.error || "PsyLattice could not import these references.",
        );
      }

      const importedCount = Array.isArray(payload.imported)
        ? payload.imported.length
        : 0;
      const skippedCount = Array.isArray(payload.skipped)
        ? payload.skipped.length
        : 0;
      const errorCount = Array.isArray(payload.errors)
        ? payload.errors.length
        : 0;

      setImportOpen(false);
      setImportFile(null);
      setImportText("");
      setImportFormat("auto");
      await loadReferenceLibrary();

      const summary = [
        `${importedCount} imported`,
        skippedCount ? `${skippedCount} duplicate${skippedCount === 1 ? "" : "s"} skipped` : "",
        errorCount ? `${errorCount} could not be imported` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      setNotice(`Reference import complete: ${summary}.`);
    } catch (caught) {
      console.error("Reference import failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not import these references.",
      );
    } finally {
      setBusy(false);
    }
  }

  function openNewCollection(parentId?: string | null) {
    clearMessages();
    setCollectionName("");
    setCollectionParentId(
      parentId !== undefined
        ? parentId
        : selectedCollection !== "all" && selectedCollection !== "unfiled"
          ? selectedCollection
          : null,
    );
    setCollectionOpen(true);
  }

  async function createCollection(event: FormEvent) {
    event.preventDefault();
    clearMessages();

    const name = collectionName.trim();
    if (!name) {
      setError("Give the collection a name.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("reference_collections")
        .insert({
          owner_user_id: userId,
          parent_collection_id: collectionParentId,
          name,
          position: 0,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      const inserted = data as ReferenceCollection;
      setCollections((current) => [...current, inserted]);
      setSelectedCollection(inserted.id);
      setCollectionOpen(false);
      setCollectionName("");
      setNotice("Collection created.");
    } catch (caught) {
      console.error("Collection create failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not create this collection.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function renameCollection(collection: ReferenceCollection) {
    const nextName = window.prompt("Rename collection", collection.name)?.trim();
    if (!nextName || nextName === collection.name) return;

    clearMessages();
    setBusy(true);

    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase
        .from("reference_collections")
        .update({ name: nextName })
        .eq("id", collection.id)
        .eq("owner_user_id", userId)
        .select("*")
        .single();

      if (updateError) throw updateError;

      setCollections((current) =>
        current.map((item) =>
          item.id === collection.id ? (data as ReferenceCollection) : item,
        ),
      );
      setNotice("Collection renamed.");
    } catch (caught) {
      console.error("Collection rename failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not rename this collection.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteCollection(collection: ReferenceCollection) {
    const childCount = collections.filter(
      (item) => item.parent_collection_id === collection.id,
    ).length;

    const confirmed = window.confirm(
      childCount > 0
        ? `Delete “${collection.name}” and its nested collections?\n\nReferences will remain in your global library.`
        : `Delete “${collection.name}”?\n\nReferences will remain in your global library.`,
    );

    if (!confirmed) return;

    clearMessages();
    setBusy(true);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("reference_collections")
        .delete()
        .eq("id", collection.id)
        .eq("owner_user_id", userId);

      if (deleteError) throw deleteError;

      await loadReferenceLibrary();
      if (selectedCollection === collection.id) {
        setSelectedCollection("all");
      }
      setNotice("Collection deleted. Your references remain in My Library.");
    } catch (caught) {
      console.error("Collection delete failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not delete this collection.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyAbstract() {
    if (!selectedReference?.abstract?.trim()) return;

    try {
      await navigator.clipboard.writeText(selectedReference.abstract);
      setNotice("Abstract copied to clipboard.");
      setError("");
    } catch {
      setError("Your browser could not copy the abstract automatically.");
    }
  }

  async function saveCurrentNote() {
    if (!selectedReference) return;

    clearMessages();
    setNoteSaving(true);

    try {
      const supabase = createClient();
      const studyId = noteScope === "global" ? null : noteScope;
      const existing = referenceNotes.find(
        (note) =>
          note.reference_id === selectedReference.id &&
          note.study_id === studyId &&
          note.note_type === noteType,
      );
      const content = noteDraft.trimEnd();

      if (!content.trim()) {
        if (existing) {
          const { error: deleteError } = await supabase
            .from("reference_notes")
            .delete()
            .eq("id", existing.id)
            .eq("owner_user_id", userId);

          if (deleteError) throw deleteError;

          setReferenceNotes((current) =>
            current.filter((note) => note.id !== existing.id),
          );
        }

        setNoteDraft("");
        setNoteSavedAt(null);
        setNotice("The empty note was removed.");
        return;
      }

      if (existing) {
        const { data, error: updateError } = await supabase
          .from("reference_notes")
          .update({ content })
          .eq("id", existing.id)
          .eq("owner_user_id", userId)
          .select("*")
          .single();

        if (updateError) throw updateError;

        const saved = data as ReferenceNote;
        setReferenceNotes((current) =>
          current.map((note) => (note.id === saved.id ? saved : note)),
        );
        setNoteSavedAt(saved.updated_at);
      } else {
        const { data, error: insertError } = await supabase
          .from("reference_notes")
          .insert({
            owner_user_id: userId,
            reference_id: selectedReference.id,
            study_id: studyId,
            note_type: noteType,
            content,
          })
          .select("*")
          .single();

        if (insertError) throw insertError;

        const saved = data as ReferenceNote;
        setReferenceNotes((current) => [saved, ...current]);
        setNoteSavedAt(saved.updated_at);
      }

      setNotice("Reference note saved.");
    } catch (caught) {
      console.error("Reference note save failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not save this note.",
      );
    } finally {
      setNoteSaving(false);
    }
  }

  async function copyCurrentNote() {
    if (!noteDraft.trim()) {
      setError("There is no note text to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(noteDraft);
      setNotice("Note copied to clipboard.");
    } catch {
      setError("Your browser could not copy the note automatically.");
    }
  }

  async function toggleCollectionMembership(collectionId: string) {
    if (!selectedReference) return;

    clearMessages();
    setBusy(true);

    try {
      const supabase = createClient();
      const exists = referenceCollectionIds.has(collectionId);

      if (exists) {
        const { error: deleteError } = await supabase
          .from("reference_collection_items")
          .delete()
          .eq("owner_user_id", userId)
          .eq("collection_id", collectionId)
          .eq("reference_id", selectedReference.id);

        if (deleteError) throw deleteError;

        setCollectionItems((current) =>
          current.filter(
            (row) =>
              !(
                row.collection_id === collectionId &&
                row.reference_id === selectedReference.id
              ),
          ),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("reference_collection_items")
          .insert({
            owner_user_id: userId,
            collection_id: collectionId,
            reference_id: selectedReference.id,
          })
          .select("*")
          .single();

        if (insertError) throw insertError;

        setCollectionItems((current) => [
          data as ReferenceCollectionItem,
          ...current,
        ]);
      }
    } catch (caught) {
      console.error("Collection membership update failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not update this collection.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleStudyLink(studyId: string) {
    if (!selectedReference) return;

    clearMessages();
    setBusy(true);

    try {
      const supabase = createClient();
      const exists = selectedReferenceStudyIds.has(studyId);

      if (exists) {
        const { error: deleteError } = await supabase
          .from("reference_study_links")
          .delete()
          .eq("owner_user_id", userId)
          .eq("study_id", studyId)
          .eq("reference_id", selectedReference.id);

        if (deleteError) throw deleteError;

        setStudyLinks((current) =>
          current.filter(
            (row) =>
              !(
                row.study_id === studyId &&
                row.reference_id === selectedReference.id
              ),
          ),
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("reference_study_links")
          .insert({
            owner_user_id: userId,
            study_id: studyId,
            reference_id: selectedReference.id,
            linked_by: "manual",
          })
          .select("*")
          .single();

        if (insertError) throw insertError;

        setStudyLinks((current) => [
          data as ReferenceStudyLink,
          ...current,
        ]);
      }
    } catch (caught) {
      console.error("Study reference link update failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not update the study link.",
      );
    } finally {
      setBusy(false);
    }
  }

  function CollectionTree({
    nodes,
    depth = 0,
  }: {
    nodes: CollectionTreeNode[];
    depth?: number;
  }) {
    return (
      <>
        {nodes.map((node) => {
          const selected = selectedCollection === node.id;
          return (
            <div key={node.id}>
              <div
                className={`group flex items-center gap-1 rounded-xl pr-1 transition ${
                  selected
                    ? "bg-cyan-50 text-cyan-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCollection(node.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
                >
                  {node.children.length > 0 ? (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  ) : (
                    <span className="w-3.5 shrink-0" />
                  )}
                  {selected ? (
                    <FolderOpen className="h-4 w-4 shrink-0 text-cyan-700" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <span className="truncate text-sm font-medium">{node.name}</span>
                  <span className="ml-auto text-[11px] text-slate-400">
                    {countsByCollection.get(node.id) || 0}
                  </span>
                </button>

                <div className="hidden items-center gap-0.5 group-hover:flex">
                  <button
                    type="button"
                    onClick={() => openNewCollection(node.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-cyan-700"
                    title="New subcollection"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => renameCollection(node)}
                    className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                    title="Rename collection"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCollection(node)}
                    className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-rose-600"
                    title="Delete collection"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {node.children.length > 0 ? (
                <CollectionTree nodes={node.children} depth={depth + 1} />
              ) : null}
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] ${
        isFullScreen
          ? "fixed inset-0 z-[140] h-[100dvh] w-screen rounded-none border-0"
          : "min-h-[780px] rounded-[30px] border border-slate-200/90 xl:h-[calc(100dvh-105px)]"
      }`}
    >
      <div className="shrink-0 border-b border-slate-100 bg-gradient-to-r from-white via-white to-cyan-50/40 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                <Library className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-slate-950">
                  Reference Manager
                </h2>
                <p className="mt-0.5 text-[12px] text-slate-500">
                  One global research library. Organise once, reuse across studies.
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setDoiOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-800"
              >
                <Link2 className="h-4 w-4" />
                Add by DOI
              </button>

              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-800"
              >
                <Upload className="h-4 w-4" />
                Import RIS / BibTeX
              </button>

              <button
                type="button"
                onClick={() => setPdfOpen(true)}
                disabled={!selectedReference}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Paperclip className="h-4 w-4" />
                Attach PDF
              </button>

              <button
                type="button"
                onClick={openNewReference}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add reference
              </button>

              <button
                type="button"
                onClick={() => openNewCollection()}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-2.5 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100/70"
              >
                <FolderPlus className="h-4 w-4" />
                New collection
              </button>
            </div>

            <span className="hidden h-8 w-px shrink-0 bg-slate-200 xl:block" aria-hidden="true" />

            <button
              type="button"
              onClick={() => setIsFullScreen((current) => !current)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/60 hover:text-cyan-800"
              title={isFullScreen ? "Exit full screen (Esc)" : "Full screen"}
              aria-label={isFullScreen ? "Exit full screen" : "Open full screen"}
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">
            {notice}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-700" />
            Loading your Reference Library…
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 xl:grid-cols-[250px_minmax(0,1fr)_390px] 2xl:grid-cols-[250px_minmax(0,1fr)_410px]">
          {/* Collections */}
          <aside className="min-h-0 border-b border-slate-100 bg-slate-50/70 p-4 xl:overflow-y-auto xl:border-b-0 xl:border-r">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                Library
              </p>
              <button
                type="button"
                onClick={() => openNewCollection()}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-cyan-700"
                title="New collection"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCollection("all")}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  selectedCollection === "all"
                    ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white/80"
                }`}
              >
                <BookOpen className="h-4 w-4 text-cyan-700" />
                My Library
                <span className="ml-auto text-[11px] text-slate-400">
                  {references.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCollection("unfiled")}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                  selectedCollection === "unfiled"
                    ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:bg-white/80"
                }`}
              >
                <FileText className="h-4 w-4 text-slate-400" />
                Unfiled
                <span className="ml-auto text-[11px] text-slate-400">
                  {unfiledCount}
                </span>
              </button>
            </div>

            <div className="mt-5 border-t border-slate-200/80 pt-4">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                  Collections
                </p>
                <span className="text-[10px] text-slate-400">
                  {collections.length}
                </span>
              </div>

              {collectionTree.length > 0 ? (
                <div className="space-y-0.5">
                  <CollectionTree nodes={collectionTree} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openNewCollection()}
                  className="w-full rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-5 text-center text-xs leading-5 text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700"
                >
                  Create your first collection
                </button>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-3.5">
              <p className="text-xs font-semibold text-violet-900">
                Built for study-aware AI
              </p>
              <p className="mt-1.5 text-[11px] leading-4.5 text-violet-700/80">
                Collections organise your library for you. Later, PsyLattice AI can
                search the full permitted library regardless of which folder a paper
                is stored in.
              </p>
            </div>
          </aside>

          {/* Reference list */}
          <main className="min-h-0 min-w-0 border-b border-slate-100 xl:overflow-y-auto xl:border-b-0 xl:border-r">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 p-4 backdrop-blur-xl">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search title, author, DOI, journal, keyword…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-50"
                  />
                </div>

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-300"
                >
                  <option value="all">All types</option>
                  {ITEM_TYPES.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <select
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(event.target.value as typeof sortMode)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-300"
                >
                  <option value="updated">Recently updated</option>
                  <option value="year">Newest publication</option>
                  <option value="title">Title A–Z</option>
                </select>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {filteredReferences.length}
                  </span>{" "}
                  {filteredReferences.length === 1 ? "reference" : "references"}
                </p>
                {busy ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating…
                  </span>
                ) : null}
              </div>
            </div>

            {filteredReferences.length === 0 ? (
              <div className="flex min-h-[480px] items-center justify-center p-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
                    <Library className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {references.length === 0
                      ? "Your Reference Library is ready"
                      : "No references match this view"}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-slate-500">
                    {references.length === 0
                      ? "Add a DOI, import BibTeX/RIS, or create a reference manually. Attach PDFs whenever you want PsyLattice to prepare full text for later AI retrieval."
                      : "Try another collection, clear the filters, or search with fewer terms."}
                  </p>

                  {references.length === 0 ? (
                    <div className="mt-5 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDoiOpen(true)}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700"
                      >
                        Add DOI
                      </button>
                      <button
                        type="button"
                        onClick={openNewReference}
                        className="rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white"
                      >
                        Add manually
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReferences.map((reference) => {
                  const selected = selectedReferenceId === reference.id;
                  const linkedStudyCount = studyLinks.filter(
                    (link) => link.reference_id === reference.id,
                  ).length;
                  const attachedFileCount = referenceFiles.filter(
                    (file) => file.reference_id === reference.id,
                  ).length;

                  return (
                    <button
                      key={reference.id}
                      type="button"
                      onClick={() => setSelectedReferenceId(reference.id)}
                      className={`w-full px-5 py-4 text-left transition sm:px-6 ${
                        selected
                          ? "bg-cyan-50/55"
                          : "bg-white hover:bg-slate-50/65"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                            selected
                              ? "border-cyan-200 bg-white text-cyan-700"
                              : "border-slate-200 bg-slate-50 text-slate-400"
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="min-w-0 flex-1 text-[14px] font-semibold leading-5 text-slate-950">
                              {reference.title}
                            </h3>
                            {reference.published_year ? (
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                {reference.published_year}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 text-[12px] text-slate-600">
                            {formatAuthors(reference.authors)}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                            <span>{humanType(reference.item_type)}</span>
                            {reference.container_title ? (
                              <>
                                <span>•</span>
                                <span className="max-w-[340px] truncate">
                                  {reference.container_title}
                                </span>
                              </>
                            ) : null}
                            {reference.doi ? (
                              <>
                                <span>•</span>
                                <span>DOI</span>
                              </>
                            ) : null}
                            {linkedStudyCount > 0 ? (
                              <>
                                <span>•</span>
                                <span className="font-medium text-cyan-700">
                                  {linkedStudyCount}{" "}
                                  {linkedStudyCount === 1 ? "study" : "studies"}
                                </span>
                              </>
                            ) : null}
                            {attachedFileCount > 0 ? (
                              <>
                                <span>•</span>
                                <span className="font-medium text-violet-700">
                                  {attachedFileCount} PDF{attachedFileCount === 1 ? "" : "s"}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </main>

          {/* Details */}
          <aside className="min-h-0 bg-white p-5 xl:overflow-y-auto xl:[scrollbar-gutter:stable]">
            {selectedReference ? (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-cyan-700">
                      Selected reference
                    </p>
                    <h3 className="mt-2 text-[15px] font-semibold leading-5 text-slate-950">
                      {selectedReference.title}
                    </h3>
                  </div>

                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEditReference(selectedReference)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                      title="Edit reference"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReference(selectedReference)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete reference"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">Author</span>
                    <span className="font-medium text-slate-700">
                      {authorsToText(selectedReference.authors) || "—"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">Year</span>
                    <span className="text-slate-700">
                      {selectedReference.published_year || "—"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">Source</span>
                    <span className="text-slate-700">
                      {selectedReference.container_title || "—"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-16 shrink-0 text-slate-400">DOI</span>
                    <span className="min-w-0 break-all text-slate-700">
                      {selectedReference.doi || "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedReference.doi ? (
                    <a
                      href={`https://doi.org/${selectedReference.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-800"
                    >
                      <Globe2 className="h-3.5 w-3.5" />
                      Open DOI
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}

                  {selectedReference.url ? (
                    <a
                      href={selectedReference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-800"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Source
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>

                {selectedReference.abstract ? (
                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Abstract
                      </p>
                      <button
                        type="button"
                        onClick={copyAbstract}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-800"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>
                    <p className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/55 px-3 py-2.5 pr-2 text-xs leading-5 text-slate-600">
                      {selectedReference.abstract}
                    </p>
                  </div>
                ) : null}

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <NotebookPen className="h-4 w-4 text-violet-600" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Research notes
                        </p>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
                        Keep reading notes and literature-review writing attached to the source.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copyCurrentNote}
                      disabled={!noteDraft.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Note context
                      </span>
                      <select
                        value={noteScope}
                        onChange={(event) => setNoteScope(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-violet-300"
                      >
                        <option value="global">General library note</option>
                        {selectedLinkedStudies.map((study) => (
                          <option key={study.id} value={study.id}>
                            {study.title}
                          </option>
                        ))}
                      </select>
                    </label>

                    {selectedLinkedStudies.length === 0 ? (
                      <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
                        Link this reference to a study below to create study-specific notes.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {NOTE_TYPES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setNoteType(item.value)}
                        className={`whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[10px] font-semibold transition ${
                          noteType === item.value
                            ? "border-violet-300 bg-violet-50 text-violet-800"
                            : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={noteType === "literature_review" ? 9 : 7}
                    maxLength={100000}
                    placeholder={
                      NOTE_TYPES.find((item) => item.value === noteType)?.placeholder
                    }
                    className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/45 px-3.5 py-3 text-[12px] leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
                  />

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-400">
                      {noteDraft.length.toLocaleString()} characters
                      {noteSavedAt ? (
                        <span>
                          {" · "}Saved{" "}
                          {new Date(noteSavedAt).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={saveCurrentNote}
                      disabled={noteSaving}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-800 disabled:opacity-50"
                    >
                      {noteSaving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <NotebookPen className="h-3.5 w-3.5" />
                      )}
                      Save note
                    </button>
                  </div>

                  <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/55 px-3 py-2.5">
                    <p className="text-[10px] leading-4 text-violet-700/80">
                      Literature Review Draft is your own writing space. In the citation
                      step, PsyLattice will be able to send this text to Thesis Builder
                      together with a structured citation instead of plain author-year text.
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        PDFs & full text
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-400">
                        Machine-readable PDF text will power the later AI retrieval layer.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPdfOpen(true)}
                      className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900"
                    >
                      + Attach
                    </button>
                  </div>

                  {selectedReferenceFiles.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {selectedReferenceFiles.map((file) => (
                        <div
                          key={file.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                        >
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-slate-700">
                                {file.file_name}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                                <span className="text-slate-400">
                                  {file.size_bytes
                                    ? `${(file.size_bytes / (1024 * 1024)).toFixed(1)} MB`
                                    : "PDF"}
                                </span>
                                <span
                                  className={`rounded-full border px-2 py-0.5 font-semibold ${
                                    file.extraction_status === "ready"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : file.extraction_status === "failed"
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-slate-200 bg-white text-slate-500"
                                  }`}
                                >
                                  {file.extraction_status === "ready"
                                    ? "Full text ready"
                                    : file.extraction_status === "failed"
                                      ? "PDF saved · text unavailable"
                                      : "Processing"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openReferencePdf(file)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-800"
                            >
                              Open PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteReferencePdf(file)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:border-rose-200 hover:text-rose-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPdfOpen(true)}
                      className="mt-3 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-3 py-4 text-xs text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700"
                    >
                      Attach a research PDF
                    </button>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Collections
                    </p>
                    <button
                      type="button"
                      onClick={() => openNewCollection()}
                      className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900"
                    >
                      + New
                    </button>
                  </div>

                  {flatCollections.length > 0 ? (
                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
                      {flatCollections.map(({ collection, depth }) => {
                        const checked = referenceCollectionIds.has(collection.id);
                        return (
                          <button
                            key={collection.id}
                            type="button"
                            onClick={() => toggleCollectionMembership(collection.id)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 transition hover:bg-slate-50"
                            style={{ paddingLeft: `${8 + depth * 14}px` }}
                          >
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                checked
                                  ? "border-cyan-600 bg-cyan-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {checked ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <Folder className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">{collection.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      No collections yet.
                    </p>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Use in studies
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-slate-400">
                        Link once; the reference remains global.
                      </p>
                    </div>
                  </div>

                  {studies.length > 0 ? (
                    <div className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
                      {studies.map((study) => {
                        const checked = selectedReferenceStudyIds.has(study.id);
                        return (
                          <button
                            key={study.id}
                            type="button"
                            onClick={() => toggleStudyLink(study.id)}
                            className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                checked
                                  ? "border-cyan-600 bg-cyan-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {checked ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-medium text-slate-700">
                                {study.title}
                              </span>
                              <span className="mt-0.5 block text-[10px] capitalize text-slate-400">
                                {study.status.replaceAll("_", " ")}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Create a research study to link references to a study environment.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center text-center">
                <div className="max-w-[230px]">
                  <Library className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Select a reference
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">
                    Details, PDFs, research notes, collections and study links will appear here.
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {editorOpen ? (
        <ModalShell
          title={editingReferenceId ? "Edit reference" : "Add reference"}
          description="Create a clean bibliographic record now. Citation-style rendering comes in the Thesis Builder integration step."
          onClose={() => setEditorOpen(false)}
        >
          <form onSubmit={saveReference} className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Reference type">
                <select
                  value={draft.item_type}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      item_type: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-cyan-300"
                >
                  {ITEM_TYPES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Publication year">
                <input
                  value={draft.published_year}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      published_year: event.target.value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="2026"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
                />
              </Field>
            </div>

            <Field label="Title">
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Full title of the paper, book or source"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
                required
              />
            </Field>

            <Field label="Authors">
              <input
                value={draft.authors_text}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    authors_text: event.target.value,
                  }))
                }
                placeholder="Smith, John; Rossi, Maria; Chen, Li"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
              />
              <span className="mt-1.5 block text-[11px] text-slate-400">
                Separate authors with semicolons. “Surname, Given” is recommended.
              </span>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Journal / source">
                <input
                  value={draft.container_title}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      container_title: event.target.value,
                    }))
                  }
                  placeholder="Journal name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300"
                />
              </Field>

              <Field label="Publisher">
                <input
                  value={draft.publisher}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      publisher: event.target.value,
                    }))
                  }
                  placeholder="Publisher"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Volume">
                <input
                  value={draft.volume}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      volume: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300"
                />
              </Field>
              <Field label="Issue">
                <input
                  value={draft.issue}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      issue: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300"
                />
              </Field>
              <Field label="Pages">
                <input
                  value={draft.page}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      page: event.target.value,
                    }))
                  }
                  placeholder="101–118"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="DOI">
                <input
                  value={draft.doi}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      doi: event.target.value,
                    }))
                  }
                  placeholder="10.xxxx/..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300"
                />
              </Field>

              <Field label="URL">
                <input
                  value={draft.url}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300"
                />
              </Field>
            </div>

            <Field label="Keywords">
              <input
                value={draft.keywords_text}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    keywords_text: event.target.value,
                  }))
                }
                placeholder="sleep, working memory, EMA"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300"
              />
            </Field>

            <Field label="Abstract">
              <textarea
                value={draft.abstract}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    abstract: event.target.value,
                  }))
                }
                rows={5}
                placeholder="Optional abstract"
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingReferenceId ? "Save changes" : "Add reference"}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {doiOpen ? (
        <ModalShell
          title="Add by DOI"
          description="PsyLattice verifies the DOI against scholarly metadata before saving the reference."
          onClose={() => setDoiOpen(false)}
        >
          <form onSubmit={addByDoi} className="p-6">
            <Field label="DOI">
              <input
                value={doiValue}
                onChange={(event) => setDoiValue(event.target.value)}
                placeholder="10.1037/..."
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
              />
            </Field>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              You can paste a DOI, a <span className="font-medium">doi.org</span>{" "}
              link, or text beginning with <span className="font-medium">doi:</span>.
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDoiOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Fetch reference
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {pdfOpen && selectedReference ? (
        <ModalShell
          title="Attach research PDF"
          description={`Attach a PDF to “${selectedReference.title}”. PsyLattice will store it privately and extract machine-readable text for later AI retrieval.`}
          onClose={() => {
            setPdfOpen(false);
            setPdfFile(null);
          }}
        >
          <form onSubmit={uploadPdf} className="space-y-4 p-6">
            <Field label="PDF file">
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setPdfFile(event.target.files?.[0] || null)
                }
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
            </Field>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              Maximum 32 MB. PsyLattice extracts up to 400 pages and stores the PDF in a private per-user bucket. Image-only scans can still be stored, but may not yield searchable full text yet.
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setPdfOpen(false);
                  setPdfFile(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !pdfFile}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
                Attach PDF
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {importOpen ? (
        <ModalShell
          title="Import references"
          description="Bring an existing library into PsyLattice using BibTeX or RIS. Duplicate DOIs are skipped automatically."
          onClose={() => {
            setImportOpen(false);
            setImportFile(null);
            setImportText("");
            setImportFormat("auto");
          }}
        >
          <form onSubmit={importReferences} className="space-y-5 p-6">
            <Field label="Import format">
              <select
                value={importFormat}
                onChange={(event) =>
                  setImportFormat(
                    event.target.value as "auto" | "bibtex" | "ris",
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-300"
              >
                <option value="auto">Detect automatically</option>
                <option value="bibtex">BibTeX (.bib)</option>
                <option value="ris">RIS (.ris)</option>
              </select>
            </Field>

            <Field label="Upload file">
              <input
                type="file"
                accept=".bib,.ris,text/plain,application/x-research-info-systems"
                onChange={(event) =>
                  setImportFile(event.target.files?.[0] || null)
                }
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
            </Field>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                or paste
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <Field label="BibTeX / RIS data">
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                rows={10}
                placeholder="@article{...} or TY  - JOUR ..."
                className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-xs leading-5 outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
              />
            </Field>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
              Up to 500 references per import. PsyLattice stores one global copy of each reference; study links remain separate.
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  setImportOpen(false);
                  setImportFile(null);
                  setImportText("");
                  setImportFormat("auto");
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || (!importFile && !importText.trim())}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import references
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {collectionOpen ? (
        <ModalShell
          title="New collection"
          description="Collections and subcollections organise the library without duplicating references."
          onClose={() => setCollectionOpen(false)}
        >
          <form onSubmit={createCollection} className="space-y-4 p-6">
            <Field label="Collection name">
              <input
                value={collectionName}
                onChange={(event) => setCollectionName(event.target.value)}
                placeholder="e.g. Sleep & Cognition"
                autoFocus
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-50"
              />
            </Field>

            <Field label="Parent collection">
              <select
                value={collectionParentId || ""}
                onChange={(event) =>
                  setCollectionParentId(event.target.value || null)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-cyan-300"
              >
                <option value="">Top level</option>
                {flatCollections.map(({ collection, depth }) => (
                  <option key={collection.id} value={collection.id}>
                    {"— ".repeat(depth)}
                    {collection.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => setCollectionOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                Create collection
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
}
