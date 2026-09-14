"use client";

import { useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Database,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Table2,
  Upload,
  Variable,
} from "lucide-react";

export type AnalysisWorkspaceView = "data" | "variables" | "analyses";

export type AnalysisWorkspaceVariableLevel =
  | "continuous"
  | "ordinal"
  | "nominal"
  | "boolean"
  | "datetime"
  | "id"
  | "text";

export type AnalysisWorkspaceVariable = {
  name: string;
  label: string;
  source: string;
  level: AnalysisWorkspaceVariableLevel;
  rowCount: number;
  validCount: number;
  missingCount: number;
  distinctCount: number;
  numericRatio: number;
};

type StudyOption = { value: string; label: string };
type DatasetOption = {
  value: string;
  label: string;
  eyebrow?: string;
  description?: string;
  recommended?: boolean;
};

type PrepareAction = "filter" | "transform" | "compute" | "analyse";

type Props = {
  view: AnalysisWorkspaceView;
  onViewChange: (view: AnalysisWorkspaceView) => void;
  rows: Array<Record<string, unknown>>;
  variables: AnalysisWorkspaceVariable[];
  datasetLabel: string;
  studyTitle?: string;
  sourceMode: "study" | "csv";
  onSourceModeChange: (mode: "study" | "csv") => void;
  csvName?: string;
  onImportCsv: (file: File) => void | Promise<void>;
  onImportXlsx: (file: File) => void | Promise<void>;
  csvError?: string;
  studyOptions?: StudyOption[];
  selectedStudyId?: string;
  onStudyChange?: (value: string) => void;
  datasetOptions?: DatasetOption[];
  selectedDatasetValue?: string;
  onDatasetChange?: (value: string) => void;
  includeTestData?: boolean;
  onIncludeTestDataChange?: (value: boolean) => void;
  identityModeLabel?: string;
  onCellChange: (rowIndex: number, variableName: string, value: string) => void;
  onVariableLabelChange: (variableName: string, label: string) => void;
  onVariableLevelChange: (
    variableName: string,
    level: AnalysisWorkspaceVariableLevel
  ) => void;
  onAddVariable?: () => void;
  onDeleteVariable?: (variableName: string) => void;
  onPrepareAction?: (action: PrepareAction, variableName: string) => void;
  onResetWorkspaceEdits: () => void;
  workspaceEditCount: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

const LEVELS: Array<{ value: AnalysisWorkspaceVariableLevel; label: string }> = [
  { value: "continuous", label: "Continuous" },
  { value: "ordinal", label: "Ordinal" },
  { value: "nominal", label: "Nominal" },
  { value: "boolean", label: "Boolean" },
  { value: "datetime", label: "Date / time" },
  { value: "id", label: "ID / cluster" },
  { value: "text", label: "Text" },
];

function displayValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function levelBadge(level: AnalysisWorkspaceVariableLevel) {
  if (level === "continuous") return "123";
  if (level === "ordinal") return "1<2";
  if (level === "nominal") return "ABC";
  if (level === "boolean") return "T/F";
  if (level === "datetime") return "DATE";
  if (level === "id") return "ID";
  return "TXT";
}

function roleLabel(level: AnalysisWorkspaceVariableLevel) {
  if (level === "id") return "Identifier / cluster";
  if (level === "datetime") return "Time / ordering";
  if (level === "continuous" || level === "ordinal") return "Analysis variable";
  if (level === "nominal" || level === "boolean") return "Factor / grouping";
  return "Text / metadata";
}

function actionButtonClass(primary = false) {
  return primary
    ? "rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-semibold text-white shadow-[0_3px_10px_rgba(15,23,42,.1)] transition hover:-translate-y-px"
    : "rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-slate-950";
}

export default function AnalysisDataWorkspace({
  view,
  onViewChange,
  rows,
  variables,
  datasetLabel,
  studyTitle = "",
  sourceMode,
  onSourceModeChange,
  csvName = "",
  onImportCsv,
  onImportXlsx,
  csvError = "",
  studyOptions = [],
  selectedStudyId = "",
  onStudyChange,
  datasetOptions = [],
  selectedDatasetValue = "",
  onDatasetChange,
  includeTestData = false,
  onIncludeTestDataChange,
  identityModeLabel = "Pseudonymous · direct identifiers hidden",
  onCellChange,
  onVariableLabelChange,
  onVariableLevelChange,
  onAddVariable,
  onDeleteVariable,
  onPrepareAction,
  onResetWorkspaceEdits,
  workspaceEditCount,
  isFullscreen = false,
  onToggleFullscreen,
}: Props) {
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const xlsxInputRef = useRef<HTMLInputElement | null>(null);
  const [dataSearch, setDataSearch] = useState("");
  const [rowSearch, setRowSearch] = useState("");
  const [variableSearch, setVariableSearch] = useState("");
  const [selectedVariableName, setSelectedVariableName] = useState("");
  const [selectedCell, setSelectedCell] = useState<{
    rowIndex: number;
    variableName: string;
  } | null>(null);

  const selectedVariable =
    variables.find((variable) => variable.name === selectedVariableName) ||
    variables[0] ||
    null;

  const visibleColumns = useMemo(() => {
    const q = dataSearch.trim().toLowerCase();
    const base = q
      ? variables.filter(
          (variable) =>
            variable.name.toLowerCase().includes(q) ||
            variable.label.toLowerCase().includes(q)
        )
      : variables;
    return base.slice(0, 60);
  }, [dataSearch, variables]);

  const visibleVariables = useMemo(() => {
    const q = variableSearch.trim().toLowerCase();
    if (!q) return variables;
    return variables.filter((variable) =>
      [variable.name, variable.label, variable.source, variable.level]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [variableSearch, variables]);

  const shownRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase();
    const indexed = rows.map((row, rowIndex) => ({ row, rowIndex }));
    if (!q) return indexed.slice(0, 200);

    return indexed
      .filter(({ row }) =>
        visibleColumns.some((variable) =>
          displayValue(row[variable.name]).toLowerCase().includes(q)
        )
      )
      .slice(0, 200);
  }, [rows, rowSearch, visibleColumns]);

  const validCells = variables.reduce(
    (sum, variable) => sum + variable.validCount,
    0
  );
  const totalCells = Math.max(1, rows.length * Math.max(1, variables.length));
  const completeness = Math.round((validCells / totalCells) * 100);

  function prepare(action: PrepareAction, variableName?: string) {
    const target = variableName || selectedVariable?.name;
    if (!target) return;
    onPrepareAction?.(action, target);
  }

  function handleGridPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    if (!selectedCell) return;
    const raw = event.clipboardData.getData("text/plain");
    if (!raw) return;

    const matrix = raw
      .replace(/\r/g, "")
      .split("\n")
      .filter((line, index, all) => !(index === all.length - 1 && line === ""))
      .map((line) => line.split("\t"));

    if (matrix.length === 0) return;
    const startColumn = visibleColumns.findIndex(
      (variable) => variable.name === selectedCell.variableName
    );
    if (startColumn < 0) return;

    event.preventDefault();

    matrix.forEach((cells, rowOffset) => {
      const targetRow = selectedCell.rowIndex + rowOffset;
      if (targetRow >= rows.length) return;

      cells.forEach((value, columnOffset) => {
        const variable = visibleColumns[startColumn + columnOffset];
        if (!variable) return;
        onCellChange(targetRow, variable.name, value);
      });
    });
  }

  function confirmDelete(variableName: string) {
    if (!onDeleteVariable) return;
    const ok = window.confirm(
      `Remove ${variableName} from this Analysis Lab working view? The source study data will not be changed.`
    );
    if (ok) onDeleteVariable(variableName);
  }

  return (
    <div
      className={`overflow-hidden border border-slate-300/70 bg-white ${
        isFullscreen
          ? "fixed inset-0 z-[200] flex h-screen min-h-0 flex-col rounded-none border-0 shadow-none"
          : "rounded-[30px] shadow-[0_2px_5px_rgba(15,23,42,.035),0_18px_46px_rgba(15,23,42,.075),0_46px_100px_rgba(15,23,42,.055)]"
      }`}
    >
      <div className="shrink-0 border-b border-slate-200/80 bg-[linear-gradient(110deg,#ffffff_0%,#f5fcfe_48%,#f9f7ff_100%)] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.09em] text-cyan-800">
                Analysis Lab
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-semibold text-slate-500">
                Data · Variables · Analyses
              </span>
            </div>
            <h2 className="mt-2 truncate text-[18px] font-semibold tracking-[-.025em] text-slate-950">
              {sourceMode === "csv" ? csvName || "Imported dataset" : datasetLabel}
            </h2>
            <p className="mt-1 truncate text-[10px] text-slate-400">
              {studyTitle ? `${studyTitle} · ` : ""}
              {identityModeLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_3px_12px_rgba(15,23,42,.05)]">
              <button
                type="button"
                onClick={() => onSourceModeChange("study")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[9px] font-semibold ${
                  sourceMode === "study"
                    ? "bg-slate-950 text-white"
                    : "text-slate-500"
                }`}
              >
                <Database className="h-3.5 w-3.5" /> PsyLattice data
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sourceMode === "csv" && rows.length > 0)
                    onSourceModeChange("csv");
                  else csvInputRef.current?.click();
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[9px] font-semibold ${
                  sourceMode === "csv"
                    ? "bg-slate-950 text-white"
                    : "text-slate-500"
                }`}
              >
                <Upload className="h-3.5 w-3.5" /> Import CSV
              </button>
            </div>

            <button
              type="button"
              onClick={() => xlsxInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[9px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Import XLSX
            </button>

            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-semibold text-slate-600 shadow-[0_3px_12px_rgba(15,23,42,.04)] hover:border-cyan-200 hover:text-slate-950"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
                {isFullscreen ? "Exit full screen" : "Full screen"}
              </button>
            )}

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onImportCsv(file);
                event.currentTarget.value = "";
              }}
            />
            <input
              ref={xlsxInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onImportXlsx(file);
                event.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        {sourceMode === "study" && (
          <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(180px,.8fr)_minmax(300px,1.4fr)_auto] lg:items-center">
            <select
              value={selectedStudyId}
              onChange={(event) => onStudyChange?.(event.target.value)}
              disabled={!onStudyChange || studyOptions.length === 0}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-700 disabled:opacity-50"
            >
              {studyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedDatasetValue}
              onChange={(event) => onDatasetChange?.(event.target.value)}
              disabled={!onDatasetChange || datasetOptions.length === 0}
              className="h-10 w-full rounded-xl border border-cyan-200 bg-white px-3 text-[10px] font-semibold text-slate-800 disabled:opacity-50"
            >
              {datasetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.recommended ? "Recommended · " : ""}
                  {option.label}
                </option>
              ))}
            </select>

            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={includeTestData}
                disabled={!onIncludeTestDataChange}
                onChange={(event) =>
                  onIncludeTestDataChange?.(event.target.checked)
                }
              />
              TEST data
            </label>
          </div>
        )}

        {csvError && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] leading-4 text-rose-700">
            {csvError}
          </p>
        )}
      </div>

      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
            {([
              ["data", "Data", Table2],
              ["variables", "Variables", Variable],
              ["analyses", "Analyses", BarChart3],
            ] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => onViewChange(value)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[9px] font-semibold transition ${
                  view === value
                    ? "bg-white text-slate-950 shadow-[0_3px_10px_rgba(15,23,42,.08)]"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[8px] font-semibold text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              {rows.length.toLocaleString()} rows
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              {variables.length.toLocaleString()} variables
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              {completeness}% complete
            </span>
            {workspaceEditCount > 0 && (
              <button
                type="button"
                onClick={onResetWorkspaceEdits}
                className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800"
              >
                <RotateCcw className="h-3 w-3" /> Reset {workspaceEditCount} workspace edits
              </button>
            )}
          </div>
        </div>
      </div>

      {view === "data" ? (
        <div
          className={`${
            isFullscreen ? "flex min-h-0 flex-1 flex-col" : "min-h-[620px]"
          } bg-slate-50/45`}
          onPaste={handleGridPaste}
        >
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-900">Data View</p>
                <p className="mt-1 text-[9px] text-slate-400">
                  Spreadsheet-style working data. Click a column to inspect it. Paste tabular data from Excel/Sheets into the selected cell. All edits stay local to this Analysis Lab session.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="relative block w-full sm:w-[220px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={dataSearch}
                    onChange={(event) => setDataSearch(event.target.value)}
                    placeholder="Find a column..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[10px] text-slate-700 outline-none focus:border-cyan-300"
                  />
                </label>
                <label className="relative block w-full sm:w-[220px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={rowSearch}
                    onChange={(event) => setRowSearch(event.target.value)}
                    placeholder="Find rows in view..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[10px] text-slate-700 outline-none focus:border-cyan-300"
                  />
                </label>
                {onAddVariable && (
                  <button type="button" onClick={onAddVariable} className={actionButtonClass()}>
                    + Variable
                  </button>
                )}
              </div>
            </div>

            {selectedVariable && (
              <div className="mt-3 grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/45 p-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(150px,.5fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-cyan-200 bg-white px-1.5 py-0.5 text-[7px] font-bold text-cyan-800">
                      {levelBadge(selectedVariable.level)}
                    </span>
                    <p className="truncate text-[10px] font-semibold text-slate-900">
                      {selectedVariable.label}
                    </p>
                    <span className="truncate font-mono text-[8px] text-slate-400">
                      {selectedVariable.name}
                    </span>
                  </div>
                  <p className="mt-1 text-[8px] text-slate-500">
                    {roleLabel(selectedVariable.level)} · {selectedVariable.validCount.toLocaleString()} valid · {selectedVariable.missingCount.toLocaleString()} missing · {selectedVariable.distinctCount.toLocaleString()} distinct
                  </p>
                </div>

                <select
                  value={selectedVariable.level}
                  onChange={(event) =>
                    onVariableLevelChange(
                      selectedVariable.name,
                      event.target.value as AnalysisWorkspaceVariableLevel
                    )
                  }
                  className="h-9 rounded-xl border border-cyan-200 bg-white px-3 text-[9px] font-semibold text-slate-700"
                >
                  {LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onViewChange("variables")}
                    className={actionButtonClass()}
                  >
                    Variable View
                  </button>
                  <button type="button" onClick={() => prepare("filter")} className={actionButtonClass()}>
                    Filter
                  </button>
                  <button type="button" onClick={() => prepare("transform")} className={actionButtonClass()}>
                    Transform
                  </button>
                  <button type="button" onClick={() => prepare("compute")} className={actionButtonClass()}>
                    Compute
                  </button>
                  <button type="button" onClick={() => prepare("analyse")} className={actionButtonClass(true)}>
                    Analyse
                  </button>
                </div>
              </div>
            )}
          </div>

          {rows.length === 0 || visibleColumns.length === 0 ? (
            <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
              <div>
                <FileSpreadsheet className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-[12px] font-semibold text-slate-700">No table to display</p>
                <p className="mt-1 text-[9px] text-slate-400">Choose a PsyLattice dataset or import a CSV/XLSX file.</p>
              </div>
            </div>
          ) : (
            <div className={`${isFullscreen ? "min-h-0 flex-1" : "max-h-[690px]"} overflow-auto`}>
              <table className="min-w-max border-separate border-spacing-0 text-left text-[9px]">
                <thead className="sticky top-0 z-20 bg-slate-100">
                  <tr>
                    <th className="sticky left-0 z-30 min-w-[54px] border-b border-r border-slate-200 bg-slate-100 px-2 py-2 text-center text-[8px] font-semibold text-slate-400">#</th>
                    {visibleColumns.map((variable) => {
                      const selected = selectedVariable?.name === variable.name;
                      return (
                        <th
                          key={variable.name}
                          onClick={() => setSelectedVariableName(variable.name)}
                          className={`min-w-[150px] max-w-[220px] cursor-pointer border-b border-r px-3 py-2 align-bottom transition ${
                            selected
                              ? "border-cyan-300 bg-cyan-50"
                              : "border-slate-200 bg-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`rounded-md border px-1.5 py-0.5 text-[7px] font-bold ${selected ? "border-cyan-200 bg-white text-cyan-800" : "border-slate-200 bg-white text-slate-500"}`}>
                              {levelBadge(variable.level)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[9px] font-semibold text-slate-800" title={variable.label}>{variable.label}</p>
                              <p className="truncate text-[7px] font-normal text-slate-400" title={variable.name}>{variable.name}</p>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {shownRows.map(({ row, rowIndex }) => (
                    <tr key={rowIndex} className="group bg-white hover:bg-cyan-50/30">
                      <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-[8px] font-semibold text-slate-400 group-hover:bg-cyan-50">{rowIndex + 1}</td>
                      {visibleColumns.map((variable) => {
                        const cellSelected =
                          selectedCell?.rowIndex === rowIndex &&
                          selectedCell.variableName === variable.name;
                        return (
                          <td
                            key={variable.name}
                            className={`border-b border-r p-0 ${
                              cellSelected
                                ? "border-cyan-300 bg-cyan-50"
                                : "border-slate-200 bg-white group-hover:bg-cyan-50/20"
                            }`}
                          >
                            <input
                              value={displayValue(row[variable.name])}
                              onFocus={() => {
                                setSelectedCell({ rowIndex, variableName: variable.name });
                                setSelectedVariableName(variable.name);
                              }}
                              onChange={(event) =>
                                onCellChange(rowIndex, variable.name, event.target.value)
                              }
                              className="h-8 w-full min-w-[150px] bg-transparent px-2.5 text-[9px] text-slate-700 outline-none focus:bg-cyan-50 focus:ring-1 focus:ring-inset focus:ring-cyan-300"
                              title={displayValue(row[variable.name])}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-2.5 text-[8px] text-slate-400">
            {rowSearch.trim()
              ? `Showing up to 200 matching rows from ${rows.length.toLocaleString()} total rows. `
              : `Working grid renders up to 200 rows and 60 visible variables at once. `}
            All rows remain available to the statistical engine. Select a cell and paste a rectangular block copied from Excel or Google Sheets to update the local working view.
          </div>
        </div>
      ) : (
        <div className={`${isFullscreen ? "flex min-h-0 flex-1 flex-col" : "min-h-[620px]"} bg-slate-50/45`}>
          <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[12px] font-semibold text-slate-900">Variable View</p>
                <p className="mt-1 text-[9px] text-slate-400">
                  One row per variable. Edit labels and measurement levels here; use the compact actions to prepare or analyse the selected variable.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="relative block w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={variableSearch}
                    onChange={(event) => setVariableSearch(event.target.value)}
                    placeholder="Search variables..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-[10px] text-slate-700 outline-none focus:border-cyan-300"
                  />
                </label>
                {onAddVariable && (
                  <button type="button" onClick={onAddVariable} className={actionButtonClass()}>
                    + Variable
                  </button>
                )}
              </div>
            </div>

            {selectedVariable && (
              <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[7px] font-bold text-slate-600">{levelBadge(selectedVariable.level)}</span>
                    <p className="truncate text-[10px] font-semibold text-slate-900">{selectedVariable.label}</p>
                    <span className="truncate font-mono text-[8px] text-slate-400">{selectedVariable.name}</span>
                  </div>
                  <p className="mt-1 text-[8px] text-slate-500">{roleLabel(selectedVariable.level)} · {selectedVariable.validCount.toLocaleString()} valid · {selectedVariable.missingCount.toLocaleString()} missing · {selectedVariable.distinctCount.toLocaleString()} distinct</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => prepare("filter")} className={actionButtonClass()}>Filter</button>
                  <button type="button" onClick={() => prepare("transform")} className={actionButtonClass()}>Transform</button>
                  <button type="button" onClick={() => prepare("compute")} className={actionButtonClass()}>Compute</button>
                  <button type="button" onClick={() => prepare("analyse")} className={actionButtonClass(true)}>Analyse</button>
                </div>
              </div>
            )}
          </div>

          <div className={`${isFullscreen ? "min-h-0 flex-1" : "max-h-[700px]"} overflow-auto`}>
            <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-[9px]">
              <thead className="sticky top-0 z-20 bg-slate-100 text-[8px] uppercase tracking-[.06em] text-slate-400">
                <tr>
                  {[
                    "Name",
                    "Label",
                    "Measurement",
                    "Valid",
                    "Missing",
                    "Distinct",
                    "",
                  ].map((header, index) => (
                    <th key={`${header}-${index}`} className="border-b border-r border-slate-200 px-3 py-2.5 font-semibold">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleVariables.map((variable) => {
                  const selected = selectedVariable?.name === variable.name;
                  return (
                    <tr
                      key={variable.name}
                      onClick={() => setSelectedVariableName(variable.name)}
                      className={`cursor-pointer ${selected ? "bg-cyan-50/65" : "bg-white hover:bg-cyan-50/30"}`}
                    >
                      <td className="border-b border-r border-slate-200 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md border px-1.5 py-0.5 text-[7px] font-bold ${selected ? "border-cyan-200 bg-white text-cyan-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{levelBadge(variable.level)}</span>
                          <span className="font-mono text-[9px] font-semibold text-slate-800">{variable.name}</span>
                        </div>
                      </td>
                      <td className="border-b border-r border-slate-200 p-1.5">
                        <input
                          value={variable.label}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => onVariableLabelChange(variable.name, event.target.value)}
                          className="h-8 min-w-[220px] w-full rounded-lg border border-transparent bg-transparent px-2 text-[9px] text-slate-700 outline-none hover:border-slate-200 focus:border-cyan-300 focus:bg-white"
                        />
                      </td>
                      <td className="border-b border-r border-slate-200 p-1.5">
                        <select
                          value={variable.level}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => onVariableLevelChange(variable.name, event.target.value as AnalysisWorkspaceVariableLevel)}
                          className="h-8 min-w-[135px] rounded-lg border border-slate-200 bg-white px-2 text-[9px] font-semibold text-slate-700"
                        >
                          {LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-r border-slate-200 px-3 py-2.5 font-semibold text-slate-700">{variable.validCount.toLocaleString()}</td>
                      <td className="border-b border-r border-slate-200 px-3 py-2.5 text-slate-500">{variable.missingCount.toLocaleString()}</td>
                      <td className="border-b border-r border-slate-200 px-3 py-2.5 text-slate-500">{variable.distinctCount.toLocaleString()}</td>
                      <td className="border-b border-slate-200 px-2 py-1.5 text-right">
                        {onDeleteVariable && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              confirmDelete(variable.name);
                            }}
                            className="rounded-lg border border-transparent px-2 py-1.5 text-[8px] font-semibold text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-2.5 text-[8px] leading-4 text-slate-400">
            Variable labels, measurement levels, added columns and removals apply only to this Analysis Lab working view. Use Reset workspace edits to restore the source dataset.
          </div>
        </div>
      )}
    </div>
  );
}
