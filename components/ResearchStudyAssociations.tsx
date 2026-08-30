"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  buildAssociation,
  numericAnalysisVariables,
  type AssociationMethod,
} from "@/lib/research/studyAssociations";

type Props = {
  rows: Record<string, unknown>[];
  rowsWithTest?: Record<string, unknown>[];
};

function label(value: string) {
  return value
    .replace(/^q\d+_/, "")
    .replace(/^cog_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fmt(value: number | null, digits = 3) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function fmtP(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value < 0.001) return "< .001";
  return `= ${value.toFixed(3).replace(/^0/, "")}`;
}

function ScatterPlot({
  points,
  xLabel,
  yLabel,
}: {
  points: Array<{ x: number; y: number }>;
  xLabel: string;
  yLabel: string;
}) {
  if (points.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[22px] border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        At least two complete pairs are needed for a plot.
      </div>
    );
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  let xMin = Math.min(...xs);
  let xMax = Math.max(...xs);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  if (xMin === xMax) { xMin -= 0.5; xMax += 0.5; }
  if (yMin === yMax) { yMin -= 0.5; yMax += 0.5; }

  const width = 620;
  const height = 300;
  const left = 48;
  const right = 18;
  const top = 18;
  const bottom = 48;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const xScale = (x: number) => left + ((x - xMin) / (xMax - xMin)) * plotW;
  const yScale = (y: number) => top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_5px_18px_rgba(15,23,42,0.045)]">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${yLabel} by ${xLabel} scatter plot`}>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const x = left + fraction * plotW;
          const y = top + fraction * plotH;
          return (
            <g key={fraction}>
              <line x1={x} y1={top} x2={x} y2={top + plotH} stroke="#e2e8f0" strokeWidth="1" />
              <line x1={left} y1={y} x2={left + plotW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            </g>
          );
        })}
        <line x1={left} y1={top + plotH} x2={left + plotW} y2={top + plotH} stroke="#94a3b8" strokeWidth="1.2" />
        <line x1={left} y1={top} x2={left} y2={top + plotH} stroke="#94a3b8" strokeWidth="1.2" />
        {points.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}-${index}`}
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r="4.5"
            fill="#0891b2"
            fillOpacity="0.72"
            stroke="#ffffff"
            strokeWidth="1"
          />
        ))}
        <text x={left} y={height - 10} fontSize="10" fill="#64748b">{xMin.toFixed(2)}</text>
        <text x={left + plotW} y={height - 10} textAnchor="end" fontSize="10" fill="#64748b">{xMax.toFixed(2)}</text>
        <text x={8} y={top + plotH} fontSize="10" fill="#64748b">{yMin.toFixed(2)}</text>
        <text x={8} y={top + 10} fontSize="10" fill="#64748b">{yMax.toFixed(2)}</text>
        <text x={left + plotW / 2} y={height - 12} textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">{xLabel}</text>
        <text x="14" y={top + plotH / 2} textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569" transform={`rotate(-90 14 ${top + plotH / 2})`}>{yLabel}</text>
      </svg>
    </div>
  );
}

export default function ResearchStudyAssociations({ rows, rowsWithTest }: Props) {
  const [includeTestData, setIncludeTestData] = useState(false);
  const activeRows = includeTestData && rowsWithTest ? rowsWithTest : rows;
  const variables = useMemo(() => numericAnalysisVariables(activeRows), [activeRows]);
  const [method, setMethod] = useState<AssociationMethod>("pearson");
  const [x, setX] = useState("");
  const [y, setY] = useState("");

  useEffect(() => {
    setX((current) => variables.some((item) => item.column === current) ? current : variables[0]?.column || "");
    setY((current) => variables.some((item) => item.column === current && item.column !== (variables[0]?.column || "")) ? current : variables[1]?.column || "");
  }, [variables.map((item) => item.column).join("|")]);

  if (variables.length < 2) return null;

  const result = x && y && x !== y ? buildAssociation(activeRows, x, y, method) : null;

  return (
    <section className="rounded-[28px] border border-slate-300/70 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.04),0_14px_34px_rgba(15,23,42,0.075)] sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200 bg-white text-cyan-700 shadow-[0_5px_16px_rgba(8,145,178,0.10)]">
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Study associations</p>
              <h3 className="mt-0.5 text-lg font-semibold text-slate-950">Relate two participant-level variables.</h3>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Select variables explicitly. PsyLattice uses pairwise complete cases and reports the valid N; it does not remove outliers, transform values or test every possible pair automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {rowsWithTest && rowsWithTest.length !== rows.length && (
            <button
              type="button"
              onClick={() => setIncludeTestData((current) => !current)}
              className={`rounded-full border px-3 py-2 text-[10px] font-semibold transition ${
                includeTestData
                  ? "border-cyan-200 bg-cyan-50 text-cyan-900 shadow-[0_4px_12px_rgba(8,145,178,0.08)]"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {includeTestData ? "TEST included" : "Include TEST"}
            </button>
          )}
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
          {(["pearson", "spearman"] as AssociationMethod[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMethod(item)}
              className={`rounded-full px-3 py-2 text-[10px] font-semibold capitalize transition ${
                method === item
                  ? "border border-cyan-200 bg-white text-cyan-900 shadow-[0_4px_12px_rgba(8,145,178,0.10)]"
                  : "text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">X variable</span>
          <select value={x} onChange={(event) => setX(event.target.value)} className="mt-1.5 w-full rounded-full border border-slate-300/80 bg-white px-4 py-3 text-xs shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            {variables.map((item) => <option key={item.column} value={item.column} disabled={item.column === y}>{label(item.column)} · n {item.valid}</option>)}
          </select>
        </label>
        <label>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Y variable</span>
          <select value={y} onChange={(event) => setY(event.target.value)} className="mt-1.5 w-full rounded-full border border-slate-300/80 bg-white px-4 py-3 text-xs shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
            {variables.map((item) => <option key={item.column} value={item.column} disabled={item.column === x}>{label(item.column)} · n {item.valid}</option>)}
          </select>
        </label>
      </div>

      {result && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[.78fr_1.22fr]">
          <div className="space-y-3">
            <div className="rounded-[24px] border border-cyan-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(8,145,178,0.08)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">{method} correlation</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">{fmt(result.coefficient, 3)}</span>
                <span className="pb-1 text-xs font-semibold text-slate-400">{method === "pearson" ? "r" : "ρ"}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan-600"
                  style={{ width: `${result.coefficient === null ? 0 : Math.abs(result.coefficient) * 100}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-lg font-semibold text-slate-950">{result.n}</p>
                  <p className="mt-1 text-[9px] text-slate-400">Valid pairs</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-lg font-semibold text-slate-950">{result.missingPairs}</p>
                  <p className="mt-1 text-[9px] text-slate-400">Rows missing X or Y</p>
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-[11px] leading-5 text-slate-600">
                <strong className="text-slate-900">p {fmtP(result.pTwoSided)}</strong>
                {method === "pearson" && result.ci95 && (
                  <> · 95% CI [{fmt(result.ci95[0], 3)}, {fmt(result.ci95[1], 3)}]</>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 text-[11px] leading-5 text-slate-500">
              {method === "pearson"
                ? "Pearson r summarizes linear association; its 95% CI uses Fisher’s z transformation."
                : "Spearman ρ is Pearson correlation on average ranks. The two-sided p-value uses the usual t approximation; a CI is not displayed in this first implementation."}
            </div>
          </div>

          <ScatterPlot
            points={result.points}
            xLabel={label(x)}
            yLabel={label(y)}
          />
        </div>
      )}
    </section>
  );
}
