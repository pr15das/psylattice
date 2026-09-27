"use client";

import {
  CheckCircle2,
  FlaskConical,
  Loader2,
  Search,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StudyReviewManager from "@/components/StudyReviewManager";

type Participant = {
  public_id: string;
  status: string;
  is_test: boolean;
  consented_at: string | null;
  demographic_status: string | null;
  measures_status: string | null;
  completed_at: string | null;
  enrolled_at: string;
  link_name: string;
  link_type: string;
  sessions: number;
  completed_sessions: number;
  responses: number;
};

type Payload = {
  access: {
    role: string | null;
    canEdit: boolean;
    canWithdrawParticipants: boolean;
  };
  study: { title: string };
  privacy: {
    identityMode: string;
    participantCodesIncluded: boolean;
    directDemographicsIncluded: boolean;
  };
  participants: Participant[];
};

function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SharedParticipantsWorkspace({
  studyId,
}: {
  studyId: string;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "test">("all");
  const [loading, setLoading] = useState(true);
  const [busyParticipant, setBusyParticipant] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/research/shared-participants?study_id=${encodeURIComponent(studyId)}`,
        { cache: "no-store", credentials: "include" },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Participants could not be loaded.");
      }
      setData(payload);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Participants could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyId]);

  async function withdrawParticipant(participant: Participant) {
    if (
      !data?.access.canEdit ||
      !data.access.canWithdrawParticipants ||
      busyParticipant ||
      participant.status === "withdrawn"
    ) {
      return;
    }

    if (
      !window.confirm(
        `Withdraw ${participant.public_id}?\n\nCollected data is retained, active sessions are abandoned, and the action is audit logged.`,
      )
    ) {
      return;
    }

    const reason = window.prompt(
      "Reason for withdrawal:",
      "Participant withdrawn from study",
    );
    if (!reason?.trim()) return;

    setBusyParticipant(participant.public_id);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/research/shared-participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operation: "withdraw_participant",
          studyId,
          publicId: participant.public_id,
          reason: reason.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "The participant could not be withdrawn.");
      }
      setNotice(`${participant.public_id} withdrawn and logged.`);
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The participant could not be withdrawn.",
      );
    } finally {
      setBusyParticipant("");
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.participants || []).filter((participant) => {
      if (filter === "test" && !participant.is_test) return false;
      if (filter === "live" && participant.is_test) return false;
      if (!needle) return true;
      return `${participant.public_id} ${participant.status} ${participant.link_name}`
        .toLowerCase()
        .includes(needle);
    });
  }, [data, query, filter]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 rounded-[24px] border border-slate-200 bg-white text-[10px] text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-cyan-700" />
        Loading shared participants…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[10px] text-rose-700">
        {error || "Participants could not be loaded."}
      </div>
    );
  }

  const live = data.participants.filter((p) => !p.is_test).length;
  const test = data.participants.filter((p) => p.is_test).length;
  const completed = data.participants.filter((p) => p.completed_at).length;
  const withdrawn = data.participants.filter((p) => p.status === "withdrawn").length;

  return (
    <div className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-700" />
              <p className="text-[12px] font-semibold text-slate-950">
                Participant roster
              </p>
            </div>
            <p className="mt-1 text-[8.5px] leading-4 text-slate-500">
              Shared Workspace shows pseudonymous participant records only. Participant
              codes and direct identifying demographics are not returned.
            </p>
          </div>
          <StudyReviewManager
            studyId={studyId}
            currentScreen="participants"
            sourceRef="participants:roster"
            sourceLabel="Participants · Shared roster"
            defaultCategory="participants"
            buttonLabel="Review participants"
            triggerVariant="inline"
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
            <p className="text-[8px] text-slate-400">LIVE</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-950">{live}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
            <p className="text-[8px] text-slate-400">TEST</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-950">{test}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
            <p className="text-[8px] text-slate-400">Completed</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-950">
              {completed}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
            <p className="text-[8px] text-slate-400">Withdrawn</p>
            <p className="mt-1 text-[18px] font-semibold text-slate-950">
              {withdrawn}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pseudonymous ID, status or link"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[10px] outline-none focus:border-cyan-300"
            />
          </label>
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as "all" | "live" | "test")
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[9px] font-semibold text-slate-600"
          >
            <option value="all">All participants</option>
            <option value="live">LIVE only</option>
            <option value="test">TEST only</option>
          </select>
        </div>
      </section>

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

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[650px] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="min-w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="text-[7.5px] font-bold uppercase tracking-[.08em] text-slate-400">
                <th className="px-4 py-3">Participant</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Consent</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Responses</th>
                <th className="px-4 py-3">Completed</th>
                {data.access.canWithdrawParticipants && (
                  <th className="px-4 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((participant) => (
                <tr key={participant.public_id} className="text-[9px] text-slate-600 hover:bg-cyan-50/25">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                    {participant.public_id}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[7px] font-semibold ${
                        participant.is_test
                          ? "border-violet-200 bg-violet-50 text-violet-700"
                          : "border-cyan-200 bg-cyan-50 text-cyan-700"
                      }`}
                    >
                      {participant.is_test ? "TEST" : "LIVE"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{participant.status}</td>
                  <td className="max-w-[180px] truncate px-4 py-3">
                    {participant.link_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {participant.consented_at ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {participant.completed_sessions}/{participant.sessions}
                  </td>
                  <td className="px-4 py-3">{participant.responses}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {date(participant.completed_at)}
                  </td>
                  {data.access.canWithdrawParticipants && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {participant.status === "withdrawn" ? (
                        <span className="text-[7.5px] font-semibold text-slate-400">
                          Withdrawn
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={!data.access.canEdit || Boolean(busyParticipant)}
                          onClick={() => void withdrawParticipant(participant)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[7.5px] font-semibold text-rose-700 disabled:opacity-40"
                        >
                          {busyParticipant === participant.public_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserMinus className="h-3 w-3" />
                          )}
                          Withdraw
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <div className="p-7 text-center text-[9px] text-slate-400">
            No participants match this view.
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-violet-200 bg-violet-50/55 px-4 py-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-700" />
          <p className="text-[8.5px] leading-4 text-violet-800">
            Participant withdrawal now requires its own owner-granted advanced permission.
            Collected research data is retained, any active session is abandoned, and the
            action is audit logged. Direct identifiers and participant codes remain owner-controlled.
          </p>
        </div>
      </div>
    </div>
  );
}
