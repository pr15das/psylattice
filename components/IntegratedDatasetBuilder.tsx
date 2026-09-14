"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildIntegratedDatasetPreview,
  detectIntegratedDatasetSources,
  integratedGrainLabel,
  type IntegratedDatasetGrain,
  type IntegratedDatasetPreview,
  type IntegratedDatasetSources,
} from "@/lib/research/integratedDataset";

type IntegratedDatasetBuilderProps = {
  studyTitle?: string;
  sources: IntegratedDatasetSources;
  onPreviewReady?: (preview: IntegratedDatasetPreview) => void;
};

function shortValue(value: unknown, maxLength = 72) {
  if (value === null || value === undefined) return "";
  const text =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return text.length > maxLength
    ? `${text.slice(0, maxLength - 1)}…`
    : text;
}

export default function IntegratedDatasetBuilder({
  studyTitle,
  sources,
  onPreviewReady,
}: IntegratedDatasetBuilderProps) {
  const detection = useMemo(
    () => detectIntegratedDatasetSources(sources),
    [sources]
  );

  const [open, setOpen] = useState(false);
  const [grain, setGrain] = useState<IntegratedDatasetGrain>(
    detection.recommendedGrain
  );
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(30);
  const [preventReuse, setPreventReuse] = useState(true);
  const [allowDerivedDateMatching, setAllowDerivedDateMatching] =
    useState(false);
  const [preview, setPreview] =
    useState<IntegratedDatasetPreview | null>(null);

  useEffect(() => {
    setGrain(detection.recommendedGrain);
    setPreview(null);
  }, [
    detection.recommendedGrain,
    detection.participantRows,
    detection.ambulatoryRows,
    detection.participantDayRows,
    detection.cognitiveRows,
  ]);

  if (!detection.canBuild) return null;

  const sourceCards = [
    {
      label: "Participant-level",
      value: detection.participantRows,
      detail: "Demographics, questionnaires and participant summaries",
    },
    {
      label: "EMA / ESM",
      value: detection.ambulatoryRows,
      detail: "Analysis-ready ambulatory check-ins",
    },
    {
      label: "Cognitive",
      value: detection.cognitiveRows,
      detail: "Cognitive task sessions",
    },
  ].filter((source) => source.value > 0);

  function buildPreview() {
    const next = buildIntegratedDatasetPreview(sources, {
      grain,
      timeWindowMinutes,
      preventCognitiveReuse: preventReuse,
      allowDerivedDateMatching,
    });

    setPreview(next);
    onPreviewReady?.(next);
  }

  return (
    <section className="overflow-hidden rounded-[26px] border border-cyan-200/80 bg-white shadow-[0_2px_5px_rgba(15,23,42,0.035),0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="relative overflow-hidden border-b border-cyan-100/80 px-5 py-5 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,.13),transparent_38%),radial-gradient(circle_at_92%_0%,rgba(139,92,246,.08),transparent_32%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.08em] text-cyan-800">
                Related study data detected
              </span>
              <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[9px] font-semibold text-slate-500">
                {detection.availableSourceCount} compatible sources
              </span>
            </div>

            <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.02em] text-slate-950">
              Build an integrated analysis dataset
            </h3>

            <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-slate-500">
              {studyTitle ? `${studyTitle} contains` : "This study contains"} data
              that can be brought into one analysis frame while preserving the
              selected unit of analysis and showing how repeated observations
              were matched.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="shrink-0 rounded-full bg-slate-950 px-5 py-2.5 text-[11px] font-semibold text-white shadow-[0_5px_16px_rgba(15,23,42,.16)] transition hover:-translate-y-px"
          >
            {open ? "Close builder" : "Build integrated dataset →"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
        {sourceCards.map((source) => (
          <div
            key={source.label}
            className="rounded-2xl border border-slate-200 bg-slate-50/65 p-4"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
              {source.label}
            </p>
            <p className="mt-2 text-[22px] font-semibold tracking-[-.03em] text-slate-950">
              {source.value.toLocaleString()}
            </p>
            <p className="mt-1 text-[9px] leading-4 text-slate-400">
              {source.detail}
            </p>
          </div>
        ))}
      </div>

      {open && (
        <div className="border-t border-slate-100 p-5 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.09em] text-slate-400">
                1 · Choose the row unit
              </p>

              <div className="mt-3 space-y-2">
                {detection.availableGrains.map((option) => {
                  const active = grain === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setGrain(option);
                        setPreview(null);
                      }}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        active
                          ? "border-cyan-300 bg-cyan-50/70"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-800">
                            {integratedGrainLabel(option)}
                          </p>
                          <p className="mt-1 text-[9px] leading-4 text-slate-400">
                            {option === "participant"
                              ? "One row per participant."
                              : option === "participant_day"
                                ? "Repeated longitudinal rows at participant-day level."
                                : option === "checkin"
                                  ? "One row per EMA / ESM occasion with optional nearby cognitive-session linkage."
                                  : "One row per cognitive administration with optional nearby EMA / ESM linkage."}
                          </p>
                        </div>
                        <span
                          className={`h-3.5 w-3.5 rounded-full border ${
                            active
                              ? "border-cyan-700 bg-cyan-700 ring-2 ring-cyan-100"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {(grain === "checkin" || grain === "cognitive_session") && (
                <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/55 p-4">
                  <p className="text-[10px] font-semibold text-violet-900">
                    Nearest-time matching
                  </p>
                  <p className="mt-1 text-[9px] leading-4 text-violet-700/80">
                    Exact protocol links are preferred when present. Otherwise,
                    PsyLattice can pair observations from the same participant
                    only when their timestamps fall inside this window.
                  </p>

                  <label className="mt-3 block">
                    <span className="text-[9px] font-semibold uppercase tracking-[.07em] text-violet-700/70">
                      Maximum difference
                    </span>
                    <select
                      value={timeWindowMinutes}
                      onChange={(event) => {
                        setTimeWindowMinutes(Number(event.target.value));
                        setPreview(null);
                      }}
                      className="mt-2 w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-[10px] font-semibold text-slate-700"
                    >
                      {[10, 15, 30, 45, 60, 120].map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes} minutes
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="mt-3 flex items-start gap-2 text-[9px] leading-4 text-violet-800">
                    <input
                      type="checkbox"
                      checked={preventReuse}
                      onChange={(event) => {
                        setPreventReuse(event.target.checked);
                        setPreview(null);
                      }}
                      className="mt-0.5"
                    />
                    Never reuse the same matched observation in another row.
                  </label>
                </div>
              )}

              {grain === "participant_day" &&
                detection.cognitiveRows > 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <p className="text-[10px] font-semibold text-amber-900">
                      Cognitive day matching needs review
                    </p>
                    <p className="mt-1 text-[9px] leading-4 text-amber-800/80">
                      Cognitive sessions currently expose timestamps rather than
                      a participant-local date. Leave this off for the safest
                      preview, or explicitly allow UTC date derivation and
                      review the warning.
                    </p>

                    <label className="mt-3 flex items-start gap-2 text-[9px] leading-4 text-amber-900">
                      <input
                        type="checkbox"
                        checked={allowDerivedDateMatching}
                        onChange={(event) => {
                          setAllowDerivedDateMatching(event.target.checked);
                          setPreview(null);
                        }}
                        className="mt-0.5"
                      />
                      Allow transparent derived-date cognitive matching.
                    </label>
                  </div>
                )}

              <button
                type="button"
                onClick={buildPreview}
                className="mt-4 w-full rounded-full bg-cyan-800 px-5 py-3 text-[11px] font-semibold text-white shadow-[0_5px_16px_rgba(8,145,178,.18)] transition hover:-translate-y-px hover:bg-cyan-900"
              >
                Preview integrated dataset
              </button>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.09em] text-slate-400">
                2 · Review before analysis
              </p>

              {!preview ? (
                <div className="mt-3 flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700">
                      Nothing has been combined yet
                    </p>
                    <p className="mt-2 max-w-sm text-[9px] leading-4 text-slate-400">
                      Choose the row unit and matching rules, then build a
                      preview. PsyLattice will show row counts, repeated
                      structure and match quality before the dataset is used.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Rows", preview.diagnostics.rowCount],
                      ["Participants", preview.diagnostics.participantCount],
                      ["Variables", preview.diagnostics.variableCount],
                      [
                        "Matched",
                        preview.diagnostics.exactMatches +
                          preview.diagnostics.timeWindowMatches +
                          preview.diagnostics.derivedDateMatches,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <p className="text-[8px] font-semibold uppercase tracking-[.08em] text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1.5 text-[17px] font-semibold text-slate-900">
                          {Number(value).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/65 p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-cyan-800">
                        {integratedGrainLabel(preview.grain)}
                      </span>
                      {preview.diagnostics.repeatedObservations && (
                        <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-violet-800">
                          Repeated observations detected
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <p className="text-[9px] text-slate-500">
                        Exact links:{" "}
                        <span className="font-semibold text-slate-800">
                          {preview.diagnostics.exactMatches}
                        </span>
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Time-window links:{" "}
                        <span className="font-semibold text-slate-800">
                          {preview.diagnostics.timeWindowMatches}
                        </span>
                      </p>
                      <p className="text-[9px] text-slate-500">
                        Derived-date links:{" "}
                        <span className="font-semibold text-slate-800">
                          {preview.diagnostics.derivedDateMatches}
                        </span>
                      </p>
                    </div>
                  </div>

                  {preview.grain === "participant" && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/65 px-4 py-3">
                      <p className="text-[9px] font-semibold text-cyan-900">
                        First-class participant dataset available
                      </p>
                      <p className="mt-1 text-[8px] leading-4 text-cyan-800/75">
                        Choose “Integrated analysis — one row per participant” in Data Explorer, Analysis Lab, or Export Data to use this deterministic participant-level table.
                      </p>
                    </div>
                  )}

                  {preview.diagnostics.warnings.map((warning) => (
                    <div
                      key={warning}
                      className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3"
                    >
                      <p className="text-[9px] leading-4 text-amber-900">
                        {warning}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {preview && preview.rows.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-800">
                    Integrated preview
                  </p>
                  <p className="mt-1 text-[9px] text-slate-400">
                    Showing the first {Math.min(20, preview.rows.length)} of{" "}
                    {preview.rows.length.toLocaleString()} rows.
                  </p>
                </div>
                {preview.recommendedGroupVariable && (
                  <span className="rounded-full border border-violet-200 bg-white px-2.5 py-1 text-[8px] font-semibold text-violet-800">
                    Mixed-model group candidate ·{" "}
                    {preview.recommendedGroupVariable}
                  </span>
                )}
              </div>

              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-max text-left text-[9px]">
                  <thead className="sticky top-0 border-b border-slate-100 bg-white text-[8px] uppercase tracking-[.06em] text-slate-400">
                    <tr>
                      {preview.columns.slice(0, 24).map((column) => (
                        <th
                          key={column}
                          className="whitespace-nowrap px-3 py-2.5 font-semibold"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.rows.slice(0, 20).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {preview.columns.slice(0, 24).map((column) => (
                          <td
                            key={column}
                            className="max-w-[260px] whitespace-nowrap px-3 py-2.5 text-slate-600"
                            title={shortValue(row[column], 500)}
                          >
                            {shortValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.columns.length > 24 && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[8px] text-slate-400">
                  Preview shows the first 24 of{" "}
                  {preview.columns.length.toLocaleString()} variables.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
