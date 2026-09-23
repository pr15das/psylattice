"use client";

import {
  BookOpen,
  Check,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CITATION_STYLES,
  formatBibliographyEntryText,
  formatCitationText,
  type CitationMode,
  type CitationReference,
  type CitationStyleId,
} from "@/lib/references/citationEngine";

type InsertMode = "citation" | "reference";

type ThesisCitationPanelProps = {
  open: boolean;
  documentId: string;
  style: CitationStyleId;
  onClose: () => void;
  onStyleChange: (style: CitationStyleId) => Promise<void> | void;
  onInsertCitation: (payload: {
    references: CitationReference[];
    mode: CitationMode;
    locator: string;
    locatorLabel: string;
    prefix: string;
    suffix: string;
  }) => Promise<void> | void;
  onInsertReference: (payload: {
    references: CitationReference[];
  }) => Promise<void> | void;
};

function authorLabel(reference: CitationReference) {
  const authors = reference.authors || [];
  const families = authors
    .map((author) => author.family || author.literal || author.given || "")
    .filter(Boolean);

  if (!families.length) return "No author";
  if (families.length === 1) return families[0];
  if (families.length === 2) return `${families[0]} & ${families[1]}`;
  return `${families[0]} et al.`;
}

export default function ThesisCitationPanel({
  open,
  documentId,
  style,
  onClose,
  onStyleChange,
  onInsertCitation,
  onInsertReference,
}: ThesisCitationPanelProps) {
  const [references, setReferences] = useState<CitationReference[]>([]);
  const [usedReferenceIds, setUsedReferenceIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [insertMode, setInsertMode] = useState<InsertMode>("citation");
  const [mode, setMode] = useState<CitationMode>("parenthetical");
  const [locator, setLocator] = useState("");
  const [locatorLabel, setLocatorLabel] = useState("p.");
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentId]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again.");
      }

      const [referenceResult, citationResult] = await Promise.all([
        supabase
          .from("reference_items")
          .select(
            "id,item_type,title,authors,editors,published_year,container_title,publisher,publisher_place,volume,issue,page,edition,doi,url",
          )
          .eq("owner_user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1000),
        supabase
          .from("research_document_citations")
          .select("reference_ids")
          .eq("owner_user_id", user.id)
          .eq("document_id", documentId),
      ]);

      if (referenceResult.error) throw referenceResult.error;
      if (citationResult.error) throw citationResult.error;

      setReferences((referenceResult.data || []) as CitationReference[]);

      const used = new Set<string>();
      for (const row of citationResult.data || []) {
        for (const id of (row.reference_ids || []) as string[]) {
          used.add(id);
        }
      }
      setUsedReferenceIds(used);
    } catch (caught) {
      console.error("Citation library load failed:", caught);
      setError(
        caught instanceof Error
          ? caught.message
          : "PsyLattice could not load your references.",
      );
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return references;

    return references.filter((reference) => {
      const authors = (reference.authors || [])
        .map(
          (author) =>
            `${author.family || ""} ${author.given || ""} ${author.literal || ""}`,
        )
        .join(" ");

      return [
        reference.title,
        authors,
        reference.container_title || "",
        reference.doi || "",
        reference.published_year ? String(reference.published_year) : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [references, search]);

  const selectedReferences = selectedIds
    .map((id) => references.find((reference) => reference.id === id))
    .filter((reference): reference is CitationReference => Boolean(reference));

  const preview = useMemo(() => {
    if (!selectedReferences.length) return "";

    if (insertMode === "reference") {
      const previewNumberMap = new Map(
        selectedReferences.map((reference, index) => [
          reference.id,
          index + 1,
        ]),
      );

      return selectedReferences
        .map((reference) =>
          formatBibliographyEntryText(style, reference, previewNumberMap),
        )
        .join("\n\n");
    }

    if (mode === "narrative" && selectedReferences.length > 1) {
      return "Narrative citations support one reference at a time.";
    }

    return formatCitationText({
      style,
      references: selectedReferences,
      mode,
      locator,
      locatorLabel,
      prefix,
      suffix,
    });
  }, [
    insertMode,
    locator,
    locatorLabel,
    mode,
    prefix,
    selectedReferences,
    style,
    suffix,
  ]);

  function toggleReference(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  async function insertSelected() {
    if (!selectedReferences.length) {
      setError("Select at least one reference.");
      return;
    }

    if (
      insertMode === "citation" &&
      mode === "narrative" &&
      selectedReferences.length > 1
    ) {
      setError("Narrative citation currently supports one reference at a time.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (insertMode === "citation") {
        await onInsertCitation({
          references: selectedReferences,
          mode,
          locator,
          locatorLabel,
          prefix,
          suffix,
        });
      } else {
        await onInsertReference({
          references: selectedReferences,
        });
      }

      setSelectedIds([]);
      setLocator("");
      setPrefix("");
      setSuffix("");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : insertMode === "citation"
            ? "The citation could not be inserted."
            : "The reference could not be inserted.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[82px] z-[9999] flex justify-end bg-slate-950/25 backdrop-blur-[1.5px]">
      <button
        type="button"
        className="min-w-0 flex-1 cursor-default"
        onClick={onClose}
        aria-label="Close citation panel"
      />

      <aside className="flex h-full w-full max-w-[490px] flex-col border-l border-slate-200 bg-white shadow-[-24px_0_80px_rgba(15,23,42,0.20)]">
        <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 shrink-0 text-cyan-700" />
                <h2 className="truncate text-[15px] font-semibold text-slate-950">
                  References
                </h2>
              </div>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                Insert in-text citations or complete formatted references from your library.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4">
            <label className="block">
              <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Citation / reference style
              </span>
              <select
                value={style}
                onChange={(event) =>
                  void onStyleChange(event.target.value as CitationStyleId)
                }
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-300"
              >
                {CITATION_STYLES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="shrink-0 border-b border-slate-100 bg-white p-4">
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setInsertMode("citation")}
              className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
                insertMode === "citation"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Citation
            </button>
            <button
              type="button"
              onClick={() => setInsertMode("reference")}
              className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
                insertMode === "reference"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Full reference
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, author, DOI, journal…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-cyan-300 focus:bg-white"
            />
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
              Loading references…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-3 text-xs font-semibold text-slate-700">
                No matching references
              </p>
              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                Add papers in Reference Manager first.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((reference) => {
                const selected = selectedIds.includes(reference.id);
                const used = usedReferenceIds.has(reference.id);

                return (
                  <button
                    key={reference.id}
                    type="button"
                    onClick={() => toggleReference(reference.id)}
                    className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition ${
                      selected ? "bg-cyan-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-cyan-600 bg-cyan-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected ? <Check className="h-3 w-3" /> : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold leading-4 text-slate-800">
                        {reference.title}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-500">
                        {authorLabel(reference)}
                        {reference.published_year
                          ? ` · ${reference.published_year}`
                          : ""}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[9px] text-slate-400">
                        {reference.container_title ? (
                          <span className="max-w-[260px] truncate">
                            {reference.container_title}
                          </span>
                        ) : null}
                        {reference.doi ? <span>· DOI</span> : null}
                        {used ? (
                          <span className="rounded-full bg-violet-50 px-1.5 py-0.5 font-semibold text-violet-700">
                            Cited
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-5 pt-3">
          {selectedReferences.length > 0 ? (
            <div className="mb-3 max-h-24 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Preview
                </span>
              </div>
              <p className="whitespace-pre-wrap text-[10px] leading-4 text-slate-600">
                {preview}
              </p>
            </div>
          ) : null}

          {insertMode === "citation" ? (
            <>
              <label className="block">
                <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Citation mode
                </span>
                <select
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as CitationMode)
                  }
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none"
                >
                  <option value="parenthetical">Parenthetical</option>
                  <option value="narrative">Narrative</option>
                </select>
              </label>

              <div className="mt-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      Page / location
                    </p>
                    <p className="mt-0.5 text-[9px] leading-3.5 text-slate-400">
                      Optional. Use this only when pointing to a specific place in the source.
                    </p>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-[96px_minmax(0,1fr)] gap-2">
                  <select
                    value={locatorLabel}
                    onChange={(event) => setLocatorLabel(event.target.value)}
                    className="h-9 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 text-[10px] outline-none"
                    aria-label="Location type"
                  >
                    <option value="p.">Page (p.)</option>
                    <option value="pp.">Pages (pp.)</option>
                    <option value="para.">Paragraph</option>
                    <option value="ch.">Chapter</option>
                    <option value="sec.">Section</option>
                  </select>

                  <input
                    value={locator}
                    onChange={(event) => setLocator(event.target.value)}
                    placeholder="e.g. 42 or 42–44"
                    className="h-9 min-w-0 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-cyan-300"
                    aria-label="Page or location number"
                  />
                </div>

                <p className="mt-1.5 text-[9px] leading-3.5 text-slate-400">
                  Example: Page + 42 produces a citation pointing specifically to page 42.
                  Leave both fields alone for a normal source-level citation.
                </p>
              </div>

              <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2">
                <summary className="cursor-pointer text-[10px] font-semibold text-slate-600">
                  Prefix / suffix <span className="font-normal text-slate-400">(optional)</span>
                </summary>

                <p className="mt-2 text-[9px] leading-3.5 text-slate-400">
                  Prefix is text placed before the citation, such as “see”. Suffix is
                  extra text placed after it, such as “for a review”.
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="min-w-0">
                    <span className="mb-1 block text-[9px] font-medium text-slate-500">
                      Prefix
                    </span>
                    <input
                      value={prefix}
                      onChange={(event) => setPrefix(event.target.value)}
                      placeholder="e.g. see"
                      className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px]"
                    />
                  </label>

                  <label className="min-w-0">
                    <span className="mb-1 block text-[9px] font-medium text-slate-500">
                      Suffix
                    </span>
                    <input
                      value={suffix}
                      onChange={(event) => setSuffix(event.target.value)}
                      placeholder="e.g. for a review"
                      className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px]"
                    />
                  </label>
                </div>
              </details>
            </>
          ) : (
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/55 px-3 py-2.5 text-[10px] leading-4 text-cyan-900/80">
              Inserts the selected source(s) as complete formatted reference entries
              at the exact Thesis Builder cursor position.
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 pr-16">
            <button
              type="button"
              onClick={() => void insertSelected()}
              disabled={busy || selectedIds.length === 0}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {insertMode === "citation"
                ? "Insert citation"
                : selectedIds.length > 1
                  ? "Insert references"
                  : "Insert reference"}
            </button>

            <p className="min-w-0 text-[10px] text-slate-400">
              {selectedIds.length} selected
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
