"use client";

import {
  BrainCircuit,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type ResearchAiEnvironment = {
  id: string;
  study_id: string;
  name: string;
  study_title: string;
  study_status: string;
  created_at?: string;
  updated_at?: string;
};

type EligibleStudy = {
  id: string;
  title: string;
  status: string;
  eligible: boolean;
  already_has_environment: boolean;
  covered_by_study_pass: boolean;
};

type Capacity = {
  limit: number;
  used: number;
  remaining: number;
  plan: string;
  planName: string;
  hasPro: boolean;
  hasAnyStudyPass: boolean;
};

type Props = {
  activeEnvironmentId: string;
  preferredStudyId?: string;
  onChange: (environment: ResearchAiEnvironment | null) => void;
};

const ACTIVE_KEY = "psylattice.ai.environment.active.v1";

function titleCaseStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ResearchAiEnvironmentSelector({
  activeEnvironmentId,
  preferredStudyId = "",
  onChange,
}: Props) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [environments, setEnvironments] = useState<ResearchAiEnvironment[]>([]);
  const [eligibleStudies, setEligibleStudies] = useState<EligibleStudy[]>([]);
  const [capacity, setCapacity] = useState<Capacity | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyStudyId, setBusyStudyId] = useState("");
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const active =
    environments.find((environment) => environment.id === activeEnvironmentId) ||
    null;

  const creatableStudies = useMemo(
    () =>
      eligibleStudies.filter(
        (study) => study.eligible && !study.already_has_environment,
      ),
    [eligibleStudies],
  );

  useEffect(() => {
    void load();

    function closeOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setSelectorOpen(false);
        setManageOpen(false);
        setCreating(false);
      }
    }

    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(preferNewId = "") {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/research-ai/environments", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "AI environments could not be loaded.");
      }

      const nextEnvironments =
        (payload.environments || []) as ResearchAiEnvironment[];

      setEnvironments(nextEnvironments);
      setEligibleStudies((payload.eligibleStudies || []) as EligibleStudy[]);
      setCapacity(payload.capacity as Capacity);

      let next: ResearchAiEnvironment | null = null;

      if (preferNewId) {
        next =
          nextEnvironments.find(
            (environment) => environment.id === preferNewId,
          ) || null;
      }

      if (!next && activeEnvironmentId) {
        next =
          nextEnvironments.find(
            (environment) => environment.id === activeEnvironmentId,
          ) || null;
      }

      if (!next && typeof window !== "undefined") {
        const stored = window.localStorage.getItem(ACTIVE_KEY) || "";
        if (stored) {
          next =
            nextEnvironments.find(
              (environment) => environment.id === stored,
            ) || null;
        }
      }

      if (!next && preferredStudyId) {
        next =
          nextEnvironments.find(
            (environment) => environment.study_id === preferredStudyId,
          ) || null;
      }

      if (!next && nextEnvironments.length === 1) {
        next = nextEnvironments[0];
      }

      if (next) {
        selectEnvironment(next, false);
      } else if (activeEnvironmentId) {
        onChange(null);
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "AI environments could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectEnvironment(
    environment: ResearchAiEnvironment | null,
    closePanels = true,
  ) {
    if (typeof window !== "undefined") {
      if (environment) {
        window.localStorage.setItem(ACTIVE_KEY, environment.id);
      } else {
        window.localStorage.removeItem(ACTIVE_KEY);
      }
    }

    onChange(environment);

    if (closePanels) {
      setSelectorOpen(false);
      setManageOpen(false);
      setCreating(false);
    }
  }

  async function createEnvironment(study: EligibleStudy) {
    if (busyStudyId) return;

    setBusyStudyId(study.id);
    setError("");

    try {
      const response = await fetch("/api/research-ai/environments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ study_id: study.id }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok || !payload?.environment) {
        throw new Error(payload?.error || "AI environment could not be created.");
      }

      const nextEnvironments =
        (payload.environments || []) as ResearchAiEnvironment[];

      setEnvironments(nextEnvironments);
      setEligibleStudies((payload.eligibleStudies || []) as EligibleStudy[]);
      setCapacity(payload.capacity as Capacity);

      const created = payload.environment as ResearchAiEnvironment;
      selectEnvironment(created);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "AI environment could not be created.",
      );
    } finally {
      setBusyStudyId("");
    }
  }

  async function deleteEnvironment(environment: ResearchAiEnvironment) {
    const confirmed = window.confirm(
      `Delete the AI environment for “${environment.study_title}”?\n\nIts saved Research Assistant conversations and Research Plan history for this environment will also be deleted. Your study and research data are not deleted.`,
    );

    if (!confirmed) return;

    setBusyStudyId(environment.study_id);
    setError("");

    try {
      const response = await fetch(
        `/api/research-ai/environments?environment_id=${encodeURIComponent(
          environment.id,
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "AI environment could not be deleted.");
      }

      const nextEnvironments =
        (payload.environments || []) as ResearchAiEnvironment[];

      setEnvironments(nextEnvironments);
      setEligibleStudies((payload.eligibleStudies || []) as EligibleStudy[]);
      setCapacity(payload.capacity as Capacity);

      if (environment.id === activeEnvironmentId) {
        selectEnvironment(null, false);
      }
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "AI environment could not be deleted.",
      );
    } finally {
      setBusyStudyId("");
    }
  }


  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setSelectorOpen((value) => !value);
            setManageOpen(false);
            setCreating(false);
          }}
          className="group flex h-[52px] w-full min-w-0 items-center gap-2 rounded-xl border border-violet-200/80 bg-[linear-gradient(135deg,rgba(250,248,255,.98),rgba(244,247,255,.98))] px-2.5 py-1.5 pr-11 text-left shadow-[0_7px_20px_rgba(76,29,149,.07)] transition hover:border-violet-300 hover:shadow-[0_10px_26px_rgba(76,29,149,.10)]"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-100 bg-white text-violet-700 shadow-sm">
            <BrainCircuit className="h-3.5 w-3.5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[6.5px] font-bold uppercase tracking-[.12em] text-violet-600">
              Environment
            </span>

            <span className="mt-px block truncate text-[8.5px] font-semibold text-slate-900">
              {loading
                ? "Loading…"
                : active
                  ? active.study_title
                  : "Current study (temporary)"}
            </span>

            <span className="mt-px block truncate text-[6.5px] text-slate-500">
              {active ? "Saved study AI" : "Temporary mode"}
            </span>
          </span>

          {loading ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin text-violet-600" />
          ) : (
            <ChevronDown
              className={`h-3 w-3 shrink-0 text-slate-400 transition group-hover:text-violet-600 ${
                selectorOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setManageOpen((value) => !value);
            setSelectorOpen(false);
            setCreating(false);
          }}
          title="Manage AI environments"
          aria-label="Manage AI environments"
          className={`absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border shadow-sm transition ${
            manageOpen
              ? "border-violet-300 bg-violet-100 text-violet-700"
              : "border-violet-100 bg-white/95 text-slate-400 hover:border-violet-200 hover:text-violet-700"
          }`}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {selectorOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_54px_rgba(15,23,42,.22)]">
          <div className="p-2">
            <button
              type="button"
              onClick={() => selectEnvironment(null)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                !active
                  ? "bg-violet-50 text-slate-950"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                {!active ? (
                  <Check className="h-3.5 w-3.5 text-violet-700" />
                ) : (
                  <BrainCircuit className="h-3.5 w-3.5 text-slate-400" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-semibold">
                  Current study (temporary)
                </span>
                <span className="mt-0.5 block text-[7.5px] text-slate-400">
                  Uses the study currently open in the workspace
                </span>
              </span>
            </button>

            {environments.length ? (
              <div className="mt-1 space-y-1">
                {environments.map((environment) => {
                  const selected = environment.id === activeEnvironmentId;

                  return (
                    <button
                      key={environment.id}
                      type="button"
                      onClick={() => selectEnvironment(environment)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                        selected
                          ? "bg-violet-50 text-slate-950"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                        {selected ? (
                          <Check className="h-3.5 w-3.5 text-violet-700" />
                        ) : (
                          <BrainCircuit className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[9px] font-semibold">
                          {environment.study_title}
                        </span>
                        <span className="mt-0.5 block text-[7.5px] text-slate-400">
                          Saved environment ·{" "}
                          {titleCaseStatus(environment.study_status)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-4 text-center">
                <p className="text-[9px] font-semibold text-slate-700">
                  No saved AI environments yet
                </p>
                <p className="mt-1 text-[8px] leading-3.5 text-slate-400">
                  Use Manage to create one for an eligible study.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectorOpen(false);
                setManageOpen(true);
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[8px] font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800"
            >
              <Settings2 className="h-3 w-3" />
              Manage environments
            </button>
          </div>
        </div>
      ) : null}

      {manageOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+7px)] z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,.24)]">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-slate-900">
                Manage AI environments
              </p>
              <p className="mt-0.5 text-[8px] leading-3.5 text-slate-400">
                Create or remove saved study environments. Switching stays in the
                compact selector above.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setManageOpen(false);
                setCreating(false);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close environment manager"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {capacity ? (
            <div className="border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[8px] font-semibold text-slate-600">
                    {capacity.planName}
                  </p>
                  <p className="mt-0.5 text-[7.5px] text-slate-400">
                    {capacity.limit
                      ? `${capacity.used} of ${capacity.limit} saved environment${
                          capacity.limit === 1 ? "" : "s"
                        } used`
                      : "Saved AI environments are not included on this plan"}
                  </p>
                </div>

                {capacity.limit ? (
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[8px] font-bold text-violet-800">
                    {capacity.used}/{capacity.limit}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="max-h-[300px] overflow-y-auto p-2.5">
            {environments.length ? (
              <div className="space-y-1.5">
                {environments.map((environment) => {
                  const selected = environment.id === activeEnvironmentId;
                  const busy = busyStudyId === environment.study_id;

                  return (
                    <div
                      key={environment.id}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                        selected
                          ? "border-violet-200 bg-violet-50/70"
                          : "border-slate-100 bg-white"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                        {selected ? (
                          <Check className="h-3.5 w-3.5 text-violet-700" />
                        ) : (
                          <BrainCircuit className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => selectEnvironment(environment)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className="block truncate text-[9px] font-semibold text-slate-800">
                          {environment.study_title}
                        </span>
                        <span className="mt-0.5 block text-[7.5px] text-slate-400">
                          {titleCaseStatus(environment.study_status)}
                          {selected ? " · Active" : ""}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(busyStudyId)}
                        onClick={() => void deleteEnvironment(environment)}
                        title="Delete AI environment"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-40"
                      >
                        {busy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center">
                <p className="text-[9px] font-semibold text-slate-700">
                  No saved AI environments yet
                </p>
                <p className="mt-1 text-[8px] leading-3.5 text-slate-400">
                  Create one below for an eligible study.
                </p>
              </div>
            )}

            {capacity &&
            capacity.remaining > 0 &&
            creatableStudies.length > 0 ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setCreating((value) => !value)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-[8px] font-semibold text-violet-800 transition hover:bg-violet-100/70"
                >
                  <Plus className="h-3 w-3" />
                  {creating ? "Hide available studies" : "Create new environment"}
                </button>

                {creating ? (
                  <div className="mt-2 space-y-1.5">
                    {creatableStudies.map((study) => (
                      <button
                        type="button"
                        key={study.id}
                        disabled={Boolean(busyStudyId)}
                        onClick={() => void createEnvironment(study)}
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/40 disabled:opacity-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[9px] font-semibold text-slate-800">
                            {study.title}
                          </span>
                          <span className="mt-0.5 block text-[7.5px] text-slate-400">
                            {titleCaseStatus(study.status)}
                            {study.covered_by_study_pass
                              ? " · Covered by Study Pass"
                              : ""}
                          </span>
                        </span>

                        {busyStudyId === study.id ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-700" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 shrink-0 text-cyan-700" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {capacity && capacity.limit > 0 && capacity.remaining === 0 ? (
              <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5 text-[8px] leading-3.5 text-violet-800">
                All available AI environment slots are currently in use.
              </div>
            ) : null}

            {capacity && capacity.limit === 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[8px] leading-3.5 text-slate-500">
                Saved study AI environments require a Study Pass or Pro.
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="border-t border-rose-100 bg-rose-50 px-3.5 py-2.5 text-[8px] leading-3.5 text-rose-700">
              {error}
            </div>
          ) : null}
        </div>
      ) : null}

      {!manageOpen && !selectorOpen && error ? (
        <div className="mt-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[8px] leading-3.5 text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
