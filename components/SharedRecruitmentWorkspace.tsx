"use client";

import {
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import StudyReviewManager from "@/components/StudyReviewManager";

type LinkRow = {
  id: string;
  name: string;
  token: string;
  access_mode: "open" | "participant_code";
  max_participants: number | null;
  starts_at: string | null;
  ends_at: string | null;
  allow_multiple_submissions: boolean;
  is_test_link: boolean;
  status: "active" | "paused" | "closed";
  created_at: string;
  participant_count: number;
};

type Payload = {
  access: {
    role: string | null;
    canEdit: boolean;
    canCloseRecruitment: boolean;
  };
  study: { title: string; status: string | null };
  ownerEntitlements: {
    planName: string;
    activeStudies: number;
    remainingActiveSlots: number;
    participantLimit: number;
    currentParticipants: number;
    remainingParticipants: number;
  };
  links: LinkRow[];
};

export default function SharedRecruitmentWorkspace({
  studyId,
}: {
  studyId: string;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("Participant link");
  const [limit, setLimit] = useState("50");
  const [isTest, setIsTest] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/research/shared-recruitment?study_id=${encodeURIComponent(studyId)}`,
        { cache: "no-store", credentials: "include" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Recruitment could not be loaded.");
      }
      setData(payload);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Recruitment could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  function publicUrl(token: string) {
    if (typeof window === "undefined") return `/study/${token}`;
    return `${window.location.origin}/study/${token}`;
  }

  async function createLink(event: React.FormEvent) {
    event.preventDefault();
    if (!data?.access.canEdit || busy) return;

    setBusy("create");
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/research/shared-recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operation: "create_link",
          studyId,
          name,
          participantLimit: Number(limit),
          isTest,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "The participant link could not be created.");
      }
      setNotice(
        `${isTest ? "TEST" : "LIVE"} participant link created under the study owner's capacity.`,
      );
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The participant link could not be created.",
      );
    } finally {
      setBusy("");
    }
  }

  async function setStatus(link: LinkRow, status: "active" | "paused") {
    if (!data?.access.canEdit || busy) return;
    setBusy(link.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/research/shared-recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operation: "set_status",
          studyId,
          linkId: link.id,
          status,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "The link could not be updated.");
      }
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The link could not be updated.",
      );
    } finally {
      setBusy("");
    }
  }

  async function closeLink(link: LinkRow) {
    if (
      !data?.access.canEdit ||
      !data.access.canCloseRecruitment ||
      busy ||
      link.status === "closed"
    ) {
      return;
    }

    if (
      !window.confirm(
        `Permanently close "${link.name}"?\n\nThis link cannot be resumed from Shared Workspace and the action will be audit logged.`,
      )
    ) {
      return;
    }

    const reason = window.prompt(
      "Reason for closing this link:",
      "Recruitment complete",
    );
    if (!reason?.trim()) return;

    setBusy(link.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/research/shared-recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operation: "close_link",
          studyId,
          linkId: link.id,
          reason: reason.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "The link could not be closed.");
      }
      setNotice(`"${link.name}" permanently closed and logged.`);
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "The link could not be closed.",
      );
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white text-[10px] text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
        Loading shared recruitment…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] text-rose-700">
        {error || "Recruitment could not be loaded."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-cyan-700" />
              <p className="text-[12px] font-semibold text-slate-950">
                Participant links
              </p>
            </div>
            <p className="mt-1 text-[8.5px] leading-4 text-slate-500">
              Links belong to the owner's study. Participant capacity and simultaneous
              study activation are checked against the owner's plan.
            </p>
          </div>
          <StudyReviewManager
            studyId={studyId}
            currentScreen="recruitment"
            sourceRef="recruitment:links"
            sourceLabel="Recruitment · Participant links"
            defaultCategory="recruitment"
            buttonLabel="Review recruitment"
            triggerVariant="inline"
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
            <p className="text-[7.5px] font-bold uppercase tracking-[.08em] text-slate-400">
              Owner participant capacity
            </p>
            <p className="mt-1 text-[16px] font-semibold text-slate-950">
              {data.ownerEntitlements.participantLimit}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
            <p className="text-[7.5px] font-bold uppercase tracking-[.08em] text-slate-400">
              Current participants
            </p>
            <p className="mt-1 text-[16px] font-semibold text-slate-950">
              {data.ownerEntitlements.currentParticipants}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
            <p className="text-[7.5px] font-bold uppercase tracking-[.08em] text-slate-400">
              Remaining capacity
            </p>
            <p className="mt-1 text-[16px] font-semibold text-slate-950">
              {data.ownerEntitlements.remainingParticipants}
            </p>
          </div>
        </div>
      </section>

      {data.access.canEdit && (
        <form
          onSubmit={createLink}
          className="rounded-[24px] border border-cyan-200 bg-cyan-50/35 p-5"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-cyan-700" />
            <p className="text-[11px] font-semibold text-slate-900">
              Create participant link
            </p>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_150px_150px_auto] lg:items-end">
            <label>
              <span className="text-[8px] font-bold uppercase tracking-[.08em] text-slate-400">
                Name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] outline-none focus:border-cyan-300"
              />
            </label>
            <label>
              <span className="text-[8px] font-bold uppercase tracking-[.08em] text-slate-400">
                Limit
              </span>
              <input
                type="number"
                min={1}
                value={limit}
                disabled={isTest}
                onChange={(event) => setLimit(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] outline-none focus:border-cyan-300"
              />
            </label>
            <label>
              <span className="text-[8px] font-bold uppercase tracking-[.08em] text-slate-400">
                Link type
              </span>
              <select
                value={isTest ? "test" : "live"}
                onChange={(event) => setIsTest(event.target.value === "test")}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px]"
              >
                <option value="test">TEST</option>
                <option value="live">LIVE</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={busy === "create"}
              className="inline-flex h-[39px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-[9px] font-semibold text-white disabled:opacity-50"
            >
              {busy === "create" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Create
            </button>
          </div>
        </form>
      )}

      {(error || notice) && (
        <div>
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[9px] text-rose-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700">
              {notice}
            </div>
          )}
        </div>
      )}

      <section className="space-y-2">
        {data.links.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-7 text-center text-[9px] text-slate-400">
            No participant links have been created for this study yet.
          </div>
        ) : (
          data.links.map((link) => (
            <div
              key={link.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[10px] font-semibold text-slate-900">
                      {link.name}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[7px] font-semibold ${
                        link.is_test_link
                          ? "border-violet-200 bg-violet-50 text-violet-700"
                          : "border-cyan-200 bg-cyan-50 text-cyan-700"
                      }`}
                    >
                      {link.is_test_link ? "TEST" : "LIVE"}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[7px] font-semibold text-slate-500">
                      {link.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[8px] text-slate-400">
                    {link.is_test_link
                      ? `${link.participant_count} test participant${
                          link.participant_count === 1 ? "" : "s"
                        }`
                      : `${link.participant_count} / ${
                          link.max_participants ?? "unlimited"
                        } participants`}
                  </p>
                  <code className="mt-2 block truncate text-[8px] text-slate-500">
                    {publicUrl(link.token)}
                  </code>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(publicUrl(link.token));
                      setNotice("Participant link copied.");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[8px] font-semibold text-slate-600"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                  <a
                    href={`/study/${link.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[8px] font-semibold text-slate-600"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </a>
                  {data.access.canEdit && link.status !== "closed" && (
                    <button
                      type="button"
                      disabled={busy === link.id}
                      onClick={() =>
                        void setStatus(
                          link,
                          link.status === "active" ? "paused" : "active",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-2 text-[8px] font-semibold text-cyan-700 disabled:opacity-50"
                    >
                      {busy === link.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : link.status === "active" ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      {link.status === "active" ? "Pause" : "Resume"}
                    </button>
                  )}
                  {data.access.canEdit &&
                    data.access.canCloseRecruitment &&
                    link.status !== "closed" && (
                      <button
                        type="button"
                        disabled={busy === link.id}
                        onClick={() => void closeLink(link)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-[8px] font-semibold text-rose-700 disabled:opacity-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Close permanently
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <div className="rounded-2xl border border-violet-200 bg-violet-50/55 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 text-violet-700" />
          <p className="text-[8.5px] leading-4 text-violet-800">
            Creating a shared LIVE link never uses the collaborator's own study slot or
            participant add-ons. Permanent closure requires its own advanced permission
            and is written to the collaboration audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
