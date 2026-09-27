"use client";

import {
  BookOpenCheck,
  BrainCircuit,
  ClipboardCheck,
  FlaskConical,
  Loader2,
  Save,
  ShieldCheck,
  Trash2,
  Users,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import StudyReviewManager from "@/components/StudyReviewManager";

type Payload = {
  access: {
    role: string | null;
    canEdit: boolean;
    canManageStructure: boolean;
  };
  study: {
    id: string;
    title: string;
    participant_description: string | null;
    design: string;
    target_sample_size: number;
    status: string;
    components: unknown;
  };
  structure: {
    consentVersions: Array<{
      id: string;
      version_label: string;
      consent_method: string;
      is_current: boolean;
    }>;
    demographics: { total: number; directIdentifiers: number };
    measures: Array<{
      id: string;
      questionnaire_name: string;
      questionnaire_acronym: string | null;
      measurement_point: string;
      required: boolean;
    }>;
    followups: Array<{ id: string; name: string; position: number; status: string }>;
    cognitiveTasks: Array<{ id: string; task_id: string; position: number; required: boolean }>;
    ambulatoryProtocols: Array<{
      id: string;
      name: string;
      duration_days: number;
      is_enabled: boolean;
    }>;
    structureLock: {
      participantCount: number;
      locked: boolean;
    };
  };
  ownerEntitlements: {
    planName: string;
    participantLimit: number;
    currentParticipants: number;
    remainingParticipants: number;
  };
};

export default function SharedStudyBuilder({ studyId }: { studyId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingMeasureId, setRemovingMeasureId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [participantDescription, setParticipantDescription] = useState("");
  const [design, setDesign] = useState("cross-sectional");
  const [targetSampleSize, setTargetSampleSize] = useState("100");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/research/shared-study?study_id=${encodeURIComponent(studyId)}`,
        { cache: "no-store", credentials: "include" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Shared Study Builder could not be loaded.");
      }
      setData(payload);
      setTitle(payload.study.title || "");
      setParticipantDescription(payload.study.participant_description || "");
      setDesign(payload.study.design || "cross-sectional");
      setTargetSampleSize(String(payload.study.target_sample_size || 100));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Shared Study Builder could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  async function saveCore(event: React.FormEvent) {
    event.preventDefault();
    if (!data?.access.canEdit || saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/research/shared-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operation: "update_core",
          studyId,
          title,
          participantDescription,
          design,
          targetSampleSize: Number(targetSampleSize),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "The study could not be saved.");
      }
      setData((current) =>
        current ? { ...current, study: { ...current.study, ...payload.study } } : current,
      );
      setNotice("Study details saved to the owner's study.");
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The study could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeMeasure(
    measureId: string,
    label: string,
  ) {
    if (
      !data?.access.canEdit ||
      !data.access.canManageStructure ||
      removingMeasureId
    ) {
      return;
    }

    if (
      !window.confirm(
        `Remove ${label} from this study?\n\nThis is only allowed before participant enrolment and will be audit logged.`,
      )
    ) {
      return;
    }

    const reason = window.prompt(
      "Reason for removing this measure:",
      "Study design revision",
    );
    if (!reason?.trim()) return;

    setRemovingMeasureId(measureId);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/research/shared-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operation: "remove_measure",
          studyId,
          measureId,
          reason: reason.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "The measure could not be removed.");
      }
      setNotice(`${label} removed and logged.`);
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The measure could not be removed.",
      );
    } finally {
      setRemovingMeasureId("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white text-[10px] text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
        Loading shared Study Builder…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] text-rose-700">
        {error || "This shared study could not be loaded."}
      </div>
    );
  }

  const cards = [
    {
      label: "Consent",
      value: data.structure.consentVersions.length,
      note: "versions",
      icon: ClipboardCheck,
    },
    {
      label: "Demographics",
      value: data.structure.demographics.total,
      note: `${data.structure.demographics.directIdentifiers} direct-ID fields`,
      icon: Users,
    },
    {
      label: "Measures",
      value: data.structure.measures.length,
      note: "questionnaire administrations",
      icon: BookOpenCheck,
    },
    {
      label: "Cognitive",
      value: data.structure.cognitiveTasks.length,
      note: "tasks",
      icon: BrainCircuit,
    },
    {
      label: "Ambulatory",
      value: data.structure.ambulatoryProtocols.length,
      note: "protocols",
      icon: Waves,
    },
    {
      label: "Follow-ups",
      value: data.structure.followups.length,
      note: "waves",
      icon: FlaskConical,
    },
  ];

  return (
    <div className="space-y-4">
      <form
        onSubmit={saveCore}
        className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold text-slate-950">Study core</p>
            <p className="mt-1 text-[9px] leading-4 text-slate-500">
              This edits the same owner study. High-risk structural changes require a
              separate owner-granted permission and are audit logged.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StudyReviewManager
              studyId={studyId}
              currentScreen="builder"
              sourceRef="study:core"
              sourceLabel={`Study Builder · ${data.study.title}`}
              defaultCategory="study_design"
              buttonLabel="Review study"
              triggerVariant="inline"
            />
            {data.access.canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-semibold text-white disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="lg:col-span-2">
            <span className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
              Study title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              readOnly={!data.access.canEdit}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-slate-900 outline-none read-only:bg-slate-50 focus:border-cyan-300"
            />
          </label>

          <label>
            <span className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
              Design
            </span>
            <select
              value={design}
              onChange={(event) => setDesign(event.target.value)}
              disabled={!data.access.canEdit}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] text-slate-700 outline-none disabled:bg-slate-50 focus:border-cyan-300"
            >
              <option value="cross-sectional">Cross-sectional</option>
              <option value="longitudinal">Longitudinal</option>
              <option value="experimental">Experimental</option>
              <option value="mixed">Mixed / multi-component</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            <span className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
              Target sample size
            </span>
            <input
              type="number"
              min={1}
              value={targetSampleSize}
              onChange={(event) => setTargetSampleSize(event.target.value)}
              readOnly={!data.access.canEdit}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] text-slate-700 outline-none read-only:bg-slate-50 focus:border-cyan-300"
            />
            <p className="mt-1 text-[7.5px] text-slate-400">
              Owner capacity: {data.ownerEntitlements.participantLimit}
            </p>
          </label>

          <label className="lg:col-span-2">
            <span className="text-[8px] font-bold uppercase tracking-[.1em] text-slate-400">
              Participant description
            </span>
            <textarea
              value={participantDescription}
              onChange={(event) => setParticipantDescription(event.target.value)}
              readOnly={!data.access.canEdit}
              rows={4}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] leading-5 text-slate-700 outline-none read-only:bg-slate-50 focus:border-cyan-300"
            />
          </label>
        </div>

        {(error || notice) && (
          <div className="mt-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[8.5px] text-rose-700">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[8.5px] text-emerald-700">
                {notice}
              </div>
            )}
          </div>
        )}
      </form>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[9px] font-semibold text-slate-700">
                    {card.label}
                  </p>
                  <p className="text-[17px] font-semibold text-slate-950">
                    {card.value}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[8px] text-slate-400">{card.note}</p>
            </div>
          );
        })}
      </section>

      {data.structure.measures.length > 0 && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-900">Study measures</p>
              <p className="mt-1 text-[8px] leading-4 text-slate-400">
                Structural removal is allowed only before the first participant enrolls.
              </p>
            </div>
            {data.access.canManageStructure && (
              <span
                className={`rounded-full border px-2.5 py-1 text-[7.5px] font-semibold ${
                  data.structure.structureLock.locked
                    ? "border-slate-200 bg-slate-50 text-slate-500"
                    : "border-violet-200 bg-violet-50 text-violet-700"
                }`}
              >
                {data.structure.structureLock.locked
                  ? `Locked · ${data.structure.structureLock.participantCount} participant(s)`
                  : "Structural changes unlocked"}
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {data.structure.measures.map((measure) => {
              const label =
                measure.questionnaire_acronym || measure.questionnaire_name;
              const canRemove =
                data.access.canEdit &&
                data.access.canManageStructure &&
                !data.structure.structureLock.locked;

              return (
                <div
                  key={measure.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/55 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[9px] font-semibold text-slate-800">
                        {label}
                      </p>
                      <p className="mt-1 text-[7.5px] text-slate-400">
                        {measure.questionnaire_name} · {measure.measurement_point}
                        {measure.required ? " · required" : ""}
                      </p>
                    </div>
                    {data.access.canManageStructure && (
                      <button
                        type="button"
                        disabled={!canRemove || Boolean(removingMeasureId)}
                        onClick={() => void removeMeasure(measure.id, label)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[7.5px] font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {removingMeasureId === measure.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-violet-200 bg-violet-50/55 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-violet-700" />
          <p className="text-[8.5px] leading-4 text-violet-800">
            Measure removal requires Structural changes permission and locks once
            participant enrolment begins. Consent, cognitive-task, schedule and EMA
            structural changes remain owner-controlled.
          </p>
        </div>
      </div>
    </div>
  );
}
