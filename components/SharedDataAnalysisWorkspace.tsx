"use client";

import {
  BarChart3,
  ChevronDown,
  Database,
  Loader2,
  Search,
  ShieldCheck,
  Table2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AnalysisLab from "@/components/AnalysisLab";
import StudyReviewManager from "@/components/StudyReviewManager";

type Mode = "explorer" | "analysis";

type DatasetOption = {
  value: string;
  label: string;
};

type CodebookVariable = {
  variable: string;
  label: string;
  type: string;
  source: string;
  notes: string;
};

type DatasetPayload = {
  value: string;
  label: string;
  identityMode: string;
  directIdentifiersIncluded: boolean;
  includeTestData: boolean;
  rows: Array<Record<string, unknown>>;
  codebook: CodebookVariable[];
  totalRows: number;
  truncated: boolean;
};

const DESCRIPTION: Record<string, string> = {
  analysis_wide:
    "One row per participant with non-identifying demographics, questionnaire variables/scores and cognitive summary fields.",
  demographics:
    "Long-format non-identifying demographic responses. Direct-identifier questions are never exposed here.",
  questionnaire_responses:
    "One row per questionnaire response with analysis helpers and study phase.",
  questionnaire_scores:
    "Computed questionnaire scores in long format.",
  cognitive_sessions:
    "One row per study cognitive administration with summary and timing fields.",
  cognitive_trials:
    "Trial-level cognitive data with response/stimulus payloads preserved as JSON text.",
  ambulatory_checkins:
    "One row per EMA / ESM check-in with timing and trigger metadata.",
  ambulatory_wide:
    "One row per EMA / ESM check-in with response items expanded into columns.",
};

function shortValue(value: unknown, max = 80) {
  if (value === null || value === undefined) return "";
  let text = "";
  if (typeof value === "string") text = value;
  else if (typeof value === "number" || typeof value === "boolean") text = String(value);
  else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function SharedDataAnalysisWorkspace({
  studyId,
  mode,
}: {
  studyId: string;
  mode: Mode;
}) {
  const [datasetType, setDatasetType] = useState("analysis_wide");
  const [includeTestData, setIncludeTestData] = useState(false);
  const [dataset, setDataset] = useState<DatasetPayload | null>(null);
  const [options, setOptions] = useState<DatasetOption[]>([]);
  const [studyTitle, setStudyTitle] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          study_id: studyId,
          dataset: datasetType,
          purpose: mode,
          include_test: includeTestData ? "true" : "false",
        });
        const response = await fetch(`/api/research/shared-data?${params}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error || "Shared study data could not be loaded.");
        }
        if (cancelled) return;

        setDataset(payload.dataset || null);
        setOptions(Array.isArray(payload.options) ? payload.options : []);
        setStudyTitle(payload.study?.title || "Shared study");
      } catch (failure) {
        if (!cancelled) {
          setDataset(null);
          setError(
            failure instanceof Error
              ? failure.message
              : "Shared study data could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [studyId, datasetType, includeTestData, mode]);

  const filteredRows = useMemo(() => {
    const rows = dataset?.rows || [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        shortValue(value, 500).toLowerCase().includes(needle),
      ),
    );
  }, [dataset, query]);

  const columns = useMemo(
    () =>
      Array.from(
        new Set((dataset?.rows || []).flatMap((row) => Object.keys(row))),
      ),
    [dataset],
  );

  if (loading && !dataset) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white text-[10px] text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
        Loading shared research data…
      </div>
    );
  }

  if (error && !dataset) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50/55 p-5 text-[10px] text-rose-700">
        {error}
      </div>
    );
  }

  if (!dataset) return null;

  if (mode === "analysis") {
    return (
      <div className="space-y-4">
        <div className="rounded-[22px] border border-cyan-200 bg-cyan-50/45 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" />
              <p className="max-w-3xl text-[8.5px] leading-4 text-slate-600">
                This is the real PsyLattice Analysis Lab running against a pseudonymous
                server-projected copy of the owner's study data. Direct identifiers are
                excluded. Statistical computation happens in the same Analysis Lab
                component as the owner workspace, so future statistical tests added
                globally appear here automatically.
              </p>
            </div>
            <StudyReviewManager
              studyId={studyId}
              currentScreen="analysis"
              sourceRef={`analysis:${dataset.value}`}
              sourceLabel={`Analysis Lab · ${dataset.label}`}
              defaultCategory="analysis"
              buttonLabel="Review analysis"
              triggerVariant="inline"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] text-rose-700">
            {error}
          </div>
        )}

        <AnalysisLab
          rows={dataset.rows}
          codebook={dataset.codebook}
          datasetLabel={dataset.label}
          studyTitle={studyTitle}
          datasetKey={`shared:${studyId}:${dataset.value}:${includeTestData ? "test" : "live"}`}
          studyOptions={[{ value: studyId, label: studyTitle }]}
          selectedStudyId={studyId}
          datasetOptions={options.map((option) => ({
            ...option,
            eyebrow:
              option.value === "analysis_wide"
                ? "Recommended"
                : "Shared study dataset",
            description: DESCRIPTION[option.value] || "",
            recommended: option.value === "analysis_wide",
          }))}
          selectedDatasetValue={datasetType}
          onDatasetChange={setDatasetType}
          includeTestData={includeTestData}
          onIncludeTestDataChange={setIncludeTestData}
          identityModeLabel="Pseudonymous · direct identifiers hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,.75fr)_minmax(260px,1fr)_auto] lg:items-end">
          <label>
            <span className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
              Shared dataset
            </span>
            <div className="relative mt-1.5">
              <select
                value={datasetType}
                onChange={(event) => setDatasetType(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-8 text-[10px] font-semibold text-slate-800 outline-none focus:border-cyan-300"
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          <label>
            <span className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
              Search rows
            </span>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the current dataset"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none focus:border-cyan-300"
              />
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={includeTestData}
              onChange={(event) => setIncludeTestData(event.target.checked)}
            />
            Include TEST data
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-3 rounded-xl bg-slate-50/70 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[9px] font-semibold text-slate-700">
              {dataset.label}
            </p>
            <p className="mt-0.5 text-[8px] leading-4 text-slate-400">
              {DESCRIPTION[dataset.value] || ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[7px] font-semibold text-cyan-700">
              {dataset.totalRows.toLocaleString()} rows
            </span>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[7px] font-semibold text-violet-700">
              identifiers hidden
            </span>
            <StudyReviewManager
              studyId={studyId}
              currentScreen="explorer"
              sourceRef={`dataset:${dataset.value}`}
              sourceLabel={`Data Explorer · ${dataset.label}`}
              defaultCategory="data"
              buttonLabel="Review dataset"
              triggerVariant="inline"
            />
          </div>
        </div>

        {dataset.truncated && (
          <p className="mt-2 text-[8px] text-violet-700">
            The source contains {dataset.totalRows.toLocaleString()} rows. This browser
            view is limited to the first 50,000 rows.
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-cyan-700" />
            <p className="text-[10px] font-semibold text-slate-900">
              Data preview
            </p>
          </div>
          <p className="text-[8px] text-slate-400">
            {filteredRows.length.toLocaleString()} matching rows
          </p>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-6 text-[9px] text-slate-400">
            No rows match the current dataset/search.
          </div>
        ) : (
          <div className="max-h-[650px] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="min-w-max text-left text-[9px]">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="whitespace-nowrap border-b border-slate-200 px-3 py-2.5 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.slice(0, 500).map((row, index) => (
                  <tr key={index} className="hover:bg-cyan-50/25">
                    {columns.map((column) => (
                      <td
                        key={column}
                        title={shortValue(row[column], 1000)}
                        className="max-w-[300px] whitespace-nowrap px-3 py-2.5 text-slate-600"
                      >
                        {shortValue(row[column], 70) || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredRows.length > 500 && (
          <div className="border-t border-slate-100 px-4 py-2.5 text-[8px] text-slate-400">
            Previewing the first 500 matching rows. Analysis Lab receives the full
            shared dataset returned by the secure study endpoint.
          </div>
        )}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-cyan-700" />
          <p className="text-[10px] font-semibold text-slate-900">
            Variable dictionary
          </p>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {dataset.codebook.slice(0, 120).map((variable) => (
            <div
              key={variable.variable}
              className="rounded-xl border border-slate-200 bg-slate-50/45 p-3"
            >
              <code className="text-[9px] font-semibold text-cyan-800">
                {variable.variable}
              </code>
              <p className="mt-1 text-[8px] font-medium text-slate-700">
                {variable.label}
              </p>
              <p className="mt-1 text-[7.5px] text-slate-400">
                {variable.type} · {variable.source}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
