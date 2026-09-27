"use client";

import {
  Check,
  Download,
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StudyReviewManager from "@/components/StudyReviewManager";

type DatasetOption = {
  value: string;
  label: string;
};

type CodebookRow = {
  variable: string;
  label: string;
  type: string;
  source: string;
  notes: string;
};

type DatasetPayload = {
  value: string;
  label: string;
  rows: Array<Record<string, unknown>>;
  codebook: CodebookRow[];
  totalRows: number;
  truncated: boolean;
  directIdentifiersIncluded: boolean;
  identityMode: string;
};

type ExportHistoryItem = {
  id: string;
  action: string;
  metadata: {
    format?: string;
    datasets?: string[];
    row_counts?: Record<string, number>;
    filename?: string | null;
    include_test_data?: boolean;
  } | null;
  created_at: string;
};

const DATASET_DESCRIPTIONS: Record<string, string> = {
  analysis_wide:
    "Participant-level analysis table with pseudonymous IDs and integrated study variables.",
  demographics:
    "Long-format non-identifying demographic responses. Direct-identifier questions stay excluded.",
  questionnaire_responses:
    "Item-level questionnaire responses with study phase and scoring helpers.",
  questionnaire_scores:
    "Computed questionnaire scores in long format.",
  cognitive_sessions:
    "Cognitive task session summaries and timing-quality fields.",
  cognitive_trials:
    "Raw cognitive trial rows including condition, correctness, reaction time and JSON payloads.",
  ambulatory_checkins:
    "EMA/ESM check-in timing and trigger metadata.",
  ambulatory_wide:
    "EMA/ESM check-ins with response items expanded into analysis columns.",
};

function safeFilename(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "psylattice-shared-export";
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function csvEscape(value: unknown) {
  const text = cellText(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function buildCsv(rows: Array<Record<string, unknown>>) {
  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row || {}))),
  );
  const header = columns.map(csvEscape).join(",");
  const body = rows.map((row) =>
    columns.map((column) => csvEscape(row[column])).join(","),
  );
  return [header, ...body].join("\r\n");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SharedExportWorkspace({
  studyId,
}: {
  studyId: string;
}) {
  const [options, setOptions] = useState<DatasetOption[]>([]);
  const [selected, setSelected] = useState<string[]>([
    "analysis_wide",
    "questionnaire_scores",
  ]);
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const [includeTestData, setIncludeTestData] = useState(false);
  const [includeCodebook, setIncludeCodebook] = useState(true);
  const [studyTitle, setStudyTitle] = useState("Shared study");
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadBootstrap() {
    setLoading(true);
    setError("");

    try {
      const [dataResponse, historyResponse] = await Promise.all([
        fetch(
          `/api/research/shared-data?study_id=${encodeURIComponent(
            studyId,
          )}&dataset=analysis_wide&purpose=export&include_test=false`,
          { cache: "no-store", credentials: "include" },
        ),
        fetch(
          `/api/research/shared-export-log?study_id=${encodeURIComponent(studyId)}`,
          { cache: "no-store", credentials: "include" },
        ),
      ]);

      const dataPayload = await dataResponse.json().catch(() => ({}));
      if (!dataResponse.ok || !dataPayload?.ok) {
        throw new Error(
          dataPayload?.error || "Shared exports could not be loaded.",
        );
      }

      const historyPayload = await historyResponse.json().catch(() => ({}));

      setOptions(Array.isArray(dataPayload.options) ? dataPayload.options : []);
      setStudyTitle(dataPayload.study?.title || "Shared study");
      if (historyResponse.ok && historyPayload?.ok) {
        setHistory(
          Array.isArray(historyPayload.exports) ? historyPayload.exports : [],
        );
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Shared exports could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  const selectedOptions = useMemo(
    () => options.filter((option) => selected.includes(option.value)),
    [options, selected],
  );

  function toggleDataset(value: string) {
    setError("");
    setNotice("");

    setSelected((current) => {
      if (current.includes(value)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== value);
      }
      if (format === "csv") return [value];
      return [...current, value];
    });
  }

  function changeFormat(next: "xlsx" | "csv") {
    setFormat(next);
    setError("");
    setNotice("");
    if (next === "csv" && selected.length > 1) {
      setSelected([selected[0]]);
    }
  }

  async function fetchDataset(value: string) {
    const params = new URLSearchParams({
      study_id: studyId,
      dataset: value,
      purpose: "export",
      include_test: includeTestData ? "true" : "false",
    });

    const response = await fetch(`/api/research/shared-data?${params}`, {
      cache: "no-store",
      credentials: "include",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.ok || !payload?.dataset) {
      throw new Error(
        payload?.error || `The ${value} dataset could not be prepared.`,
      );
    }
    return payload.dataset as DatasetPayload;
  }

  async function recordExport(
    filename: string,
    datasets: DatasetPayload[],
  ) {
    const rowCounts = Object.fromEntries(
      datasets.map((dataset) => [dataset.value, dataset.rows.length]),
    );

    const response = await fetch("/api/research/shared-export-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        studyId,
        format,
        datasets: datasets.map((dataset) => dataset.value),
        rowCounts,
        includeTestData,
        includeCodebook: format === "xlsx" && includeCodebook,
        filename,
      }),
    });

    if (!response.ok) {
      console.warn("Shared export audit log could not be recorded.");
    }
  }

  async function generateExport() {
    if (busy || selectedOptions.length === 0) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const datasets: DatasetPayload[] = [];
      for (const option of selectedOptions) {
        datasets.push(await fetchDataset(option.value));
      }

      const base = safeFilename(studyTitle);
      const stamp = new Date().toISOString().slice(0, 10);

      if (format === "csv") {
        const dataset = datasets[0];
        const filename = `${base}-${safeFilename(dataset.value)}-${stamp}.csv`;
        const csv = buildCsv(dataset.rows);
        triggerDownload(
          new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
          filename,
        );
        await recordExport(filename, datasets);
        setNotice(
          dataset.truncated
            ? `CSV downloaded. This dataset exceeds the Shared Workspace browser export cap, so the file contains the first ${dataset.rows.length.toLocaleString()} rows.`
            : "CSV downloaded and recorded in the collaboration activity log.",
        );
      } else {
        const filename = `${base}-shared-research-export-${stamp}.xlsx`;
        const metadataRows = [
          { field: "Study", value: studyTitle },
          { field: "Workspace", value: "PsyLattice Shared Workspace" },
          { field: "Exported at", value: new Date().toISOString() },
          { field: "Identity mode", value: "Pseudonymous" },
          { field: "Direct identifiers", value: "Excluded" },
          { field: "TEST data included", value: includeTestData ? "Yes" : "No" },
          {
            field: "Selected datasets",
            value: datasets.map((dataset) => dataset.label).join(" | "),
          },
          {
            field: "Truncation warning",
            value: datasets.some((dataset) => dataset.truncated)
              ? "One or more datasets exceeded the Shared Workspace browser export cap. See each dataset's metadata below."
              : "None",
          },
          ...datasets.map((dataset) => ({
            field: `${dataset.label} rows`,
            value: `${dataset.rows.length} returned / ${dataset.totalRows} available${dataset.truncated ? " (truncated)" : ""}`,
          })),
        ];

        const sheets: Array<{
          name: string;
          kind: "meta" | "clean" | "raw" | "codebook";
          description: string;
          rows: Array<Record<string, unknown>>;
        }> = [
          {
            name: "Export README",
            kind: "meta",
            description:
              "PsyLattice Shared Workspace export metadata and privacy boundary.",
            rows: metadataRows,
          },
        ];

        for (const dataset of datasets) {
          sheets.push({
            name: dataset.label,
            kind:
              dataset.value === "cognitive_trials" ||
              dataset.value === "questionnaire_responses"
                ? "raw"
                : "clean",
            description: `${dataset.label} · Shared Workspace · direct identifiers excluded`,
            rows: dataset.rows,
          });

          if (includeCodebook && dataset.codebook.length > 0) {
            sheets.push({
              name: `${dataset.value} codebook`,
              kind: "codebook",
              description: `Variable dictionary for ${dataset.label}`,
              rows: dataset.codebook as unknown as Array<Record<string, unknown>>,
            });
          }
        }

        const response = await fetch("/api/research/export-xlsx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            workbookTitle: `${studyTitle} · Shared research export`,
            filename,
            sheets,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            payload?.error || "The Excel workbook could not be generated.",
          );
        }

        const blob = await response.blob();
        triggerDownload(blob, filename);
        await recordExport(filename, datasets);

        setNotice(
          datasets.some((dataset) => dataset.truncated)
            ? "Workbook downloaded. One or more very large datasets were truncated to the Shared Workspace browser export cap; the Export README sheet records this clearly."
            : "Workbook downloaded and recorded in the collaboration activity log.",
        );
      }

      const historyResponse = await fetch(
        `/api/research/shared-export-log?study_id=${encodeURIComponent(studyId)}`,
        { cache: "no-store", credentials: "include" },
      );
      const historyPayload = await historyResponse.json().catch(() => ({}));
      if (historyResponse.ok && historyPayload?.ok) {
        setHistory(
          Array.isArray(historyPayload.exports) ? historyPayload.exports : [],
        );
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "PsyLattice could not generate this shared export.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white text-[10px] text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
        Loading shared export controls…
      </div>
    );
  }

  if (error && options.length === 0) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50/60 p-5 text-[10px] text-rose-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileDown className="h-4 w-4 text-cyan-700" />
              <p className="text-[12px] font-semibold text-slate-950">
                Shared research export
              </p>
            </div>
            <p className="mt-1 max-w-3xl text-[8.5px] leading-4 text-slate-500">
              Export permission is independent from Data Explorer. The owner can grant
              export access without exposing direct identifiers or consuming any of your
              own study slots, participant capacity or AI budget.
            </p>
          </div>

          <StudyReviewManager
            studyId={studyId}
            currentScreen="exports"
            sourceRef="exports:shared"
            sourceLabel="Shared research exports"
            defaultCategory="data"
            buttonLabel="Review exports"
            triggerVariant="inline"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeFormat("xlsx")}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[9px] font-semibold transition ${
              format === "xlsx"
                ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel workbook
          </button>
          <button
            type="button"
            onClick={() => changeFormat("csv")}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[9px] font-semibold transition ${
              format === "csv"
                ? "border-cyan-300 bg-cyan-50 text-cyan-800"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-900">
              Choose datasets
            </p>
            <p className="mt-1 text-[8px] text-slate-400">
              {format === "xlsx"
                ? "Excel can contain multiple datasets plus their codebooks."
                : "CSV exports one dataset at a time."}
            </p>
          </div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[7.5px] font-semibold text-violet-700">
            direct identifiers excluded
          </span>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {options.map((option) => {
            const active = selected.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleDataset(option.value)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-cyan-300 bg-cyan-50/55"
                    : "border-slate-200 bg-white hover:border-cyan-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      active
                        ? "border-cyan-500 bg-cyan-500 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-800">
                      {option.label}
                    </p>
                    <p className="mt-1 text-[7.5px] leading-4 text-slate-400">
                      {DATASET_DESCRIPTIONS[option.value] ||
                        "Study-linked research dataset."}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8.5px] font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={includeTestData}
              onChange={(event) => setIncludeTestData(event.target.checked)}
            />
            Include TEST data
          </label>

          {format === "xlsx" && (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[8.5px] font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={includeCodebook}
                onChange={(event) => setIncludeCodebook(event.target.checked)}
              />
              Include codebooks
            </label>
          )}
        </div>
      </section>

      <section className="rounded-[24px] border border-cyan-200 bg-cyan-50/35 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-900">
              Ready to export {selectedOptions.length} dataset
              {selectedOptions.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-[8px] leading-4 text-slate-500">
              Every successful shared export is written to the study collaboration
              activity log so the owner can see that an export occurred.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void generateExport()}
            disabled={busy || selectedOptions.length === 0}
            className="inline-flex min-w-[155px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[9px] font-semibold text-white disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {busy
              ? "Preparing…"
              : format === "xlsx"
                ? "Download workbook"
                : "Download CSV"}
          </button>
        </div>
      </section>

      {(error || notice) && (
        <div>
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[9px] text-rose-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[9px] text-emerald-700">
              {notice}
            </div>
          )}
        </div>
      )}

      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold text-slate-900">
              Your recent shared exports
            </p>
            <p className="mt-1 text-[8px] text-slate-400">
              Audit history for this collaborator account and study.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBootstrap()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[8px] font-semibold text-slate-500"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-[8.5px] text-slate-400">
              No shared exports have been generated by this account yet.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/45 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-[8.5px] font-semibold text-slate-700">
                    {item.metadata?.filename || "Shared research export"}
                  </p>
                  <p className="mt-0.5 text-[7.5px] text-slate-400">
                    {(item.metadata?.datasets || []).join(", ") || "dataset"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[7.5px] text-slate-400">
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1 font-semibold uppercase text-slate-500">
                    {item.metadata?.format || "export"}
                  </span>
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-violet-200 bg-violet-50/55 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-700" />
          <p className="text-[8.5px] leading-4 text-violet-800">
            Shared exports are pseudonymous by design. Granting Export access does not
            grant access to participant codes or direct-identifier demographics. Export
            permission can be revoked independently by the owner at any time.
          </p>
        </div>
      </div>
    </div>
  );
}
