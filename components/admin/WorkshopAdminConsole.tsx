"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CircleDollarSign,
  Download,
  ExternalLink,
  Eye,
  LoaderCircle,
  RefreshCcw,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

type AdminSession = { userId: string; email: string; role: "admin" | "super_admin" };
type Registration = Record<string, any> & {
  id: string;
  user_id: string;
  status: string;
  full_name: string;
  contact_email: string;
  institution_name: string;
  quoted_amount_paise: number;
  razorpay_payment_id: string | null;
  workshop_reference: string | null;
  payment_verified_at: string | null;
  completed_at: string | null;
  certificate_issued_at: string | null;
  workshop?: { title: string; cohort_label: string } | null;
};

type Payload = {
  ok?: boolean;
  error?: string;
  registrations?: Registration[];
  counts?: Record<string, number>;
};

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(paise || 0) / 100);
}

function dateTime(value: unknown) {
  if (!value) return "—";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function statusTone(status: string) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "paid") return "border-cyan-200 bg-cyan-50 text-cyan-800";
  if (status === "pending_payment") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "refunded") return "border-violet-200 bg-violet-50 text-violet-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function statusLabel(status: string) {
  if (status === "pending_payment") return "Payment pending";
  if (status === "paid") return "Paid";
  if (status === "completed") return "Completed";
  if (status === "refunded") return "Refunded";
  if (status === "cancelled") return "Cancelled";
  return status;
}

export default function WorkshopAdminConsole({ initialAdmin }: { initialAdmin: AdminSession }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (search.trim()) params.set("q", search.trim());
      params.set("limit", "250");

      const query = params.toString();
      const endpoint = query
        ? `/api/admin/workshops/registrations?${query}`
        : "/api/admin/workshops/registrations";

      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const payload = (await response.json().catch(() => ({}))) as Payload;
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Workshop registrations could not be loaded.");
      setRegistrations(payload.registrations || []);
      setCounts(payload.counts || {});
    } catch (cause) {
      console.error("Workshop admin list request failed:", cause);
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message && message !== "The string did not match the expected pattern."
          ? message
          : "Workshop registrations could not be loaded. Refresh once; if this persists, check the dev terminal for the API error.",
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setCompleted(row: Registration, completed: boolean) {
    if (busyId) return;
    setBusyId(row.id);
    setError("");
    try {
      const response = await fetch("/api/admin/workshops/completion", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          registrationId: String(row.id || ""),
          completed,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Workshop completion could not be updated.");
      }
      await load();
    } catch (cause) {
      console.error("Workshop completion request failed:", cause);
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Workshop completion could not be updated.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const cards = useMemo(
    () => [
      ["Registrations", counts.total || 0, UsersRound],
      ["Paid", counts.paid || 0, CircleDollarSign],
      ["Completed", counts.completed || 0, CheckCircle2],
    ] as const,
    [counts],
  );

  return (
    <main className="min-h-screen bg-[#f5f9f8] text-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <PsyLatticeLogo />
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-800">Admin</p>
              <h1 className="text-lg font-bold tracking-[-.025em]">Workshop management</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 md:inline">{initialAdmin.email} · {initialAdmin.role}</span>
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-cyan-200 hover:text-cyan-900">
              <ArrowLeft className="h-4 w-4" />
              Main admin
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map(([label, value, Icon]) => (
            <div key={label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_32px_rgba(15,23,42,.05)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-[-.04em]">{value}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800"><Icon className="h-5 w-5" /></span>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-5 rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,.05)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold">Workshop participants</h2>
              <p className="mt-1 text-xs text-slate-500">Search payments, references and participant records. Mark complete attendance to issue a certificate.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none">
                <option value="all">All registrations</option>
                <option value="pending_payment">Payment pending</option>
                <option value="paid">Paid</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="flex min-w-[280px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setSearch(searchInput.trim()); }} placeholder="Name, email, reference, Payment ID" className="min-h-10 w-full bg-transparent text-sm outline-none" />
              </div>
              <button onClick={() => setSearch(searchInput.trim())} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Search</button>
              <button onClick={() => void load()} className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-slate-600"><RefreshCcw className="h-4 w-4" /></button>
            </div>
          </div>

          {error ? <div className="m-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center"><LoaderCircle className="h-6 w-6 animate-spin text-cyan-700" /></div>
          ) : registrations.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No workshop registrations match this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Participant</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Institution</th>
                    <th className="px-5 py-3">Complete attendance</th>
                    <th className="px-5 py-3">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.map((row) => {
                    const completed = row.status === "completed" && Boolean(row.certificate_issued_at);
                    return (
                      <tr key={row.id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-950">{row.full_name}</p>
                          <p className="mt-1 text-xs text-slate-500">{row.contact_email}</p>
                          <p className="mt-1 text-[11px] text-slate-400">Registered {dateTime(row.created_at)}</p>
                          <button
                            type="button"
                            onClick={() => setSelectedRegistration(row)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-900"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View details
                          </button>
                        </td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(row.status)}`}>{statusLabel(row.status)}</span></td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold">{money(row.quoted_amount_paise)}</p>
                          <p className="mt-1 max-w-[190px] break-all font-mono text-[10px] text-slate-500">{row.razorpay_payment_id || "—"}</p>
                        </td>
                        <td className="px-5 py-4"><p className="font-mono text-xs font-semibold text-slate-700">{row.workshop_reference || "—"}</p></td>
                        <td className="px-5 py-4"><p className="max-w-[190px] text-xs font-medium text-slate-700">{row.institution_name || "—"}</p></td>
                        <td className="px-5 py-4">
                          <label className={`inline-flex items-center gap-3 rounded-xl border px-3 py-2 text-xs font-semibold ${row.status === "paid" || row.status === "completed" ? "cursor-pointer border-slate-200 bg-white text-slate-700" : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"}`}>
                            <input type="checkbox" checked={completed} disabled={busyId === row.id || (row.status !== "paid" && row.status !== "completed")} onChange={(event) => void setCompleted(row, event.target.checked)} className="h-4 w-4 accent-emerald-600" />
                            {busyId === row.id ? "Updating…" : completed ? "Completed" : "Mark complete"}
                          </label>
                        </td>
                        <td className="px-5 py-4">
                          {completed && row.workshop_reference ? (
                            <div className="flex flex-col gap-2">
                              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800"><BadgeCheck className="h-3.5 w-3.5" /> Issued</span>
                              <a href={`/api/workshops/certificate/${encodeURIComponent(row.workshop_reference)}/download`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-800 hover:underline"><Download className="h-3.5 w-3.5" /> Download</a>
                              <a href={`/workshops#certificate-verification`} target="_blank" className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:underline"><ExternalLink className="h-3 w-3" /> Public checker</a>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Not issued</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedRegistration ? (
        <div className="fixed inset-0 z-[120] flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Close participant details"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedRegistration(null)}
          />
          <aside className="relative h-full w-full max-w-[560px] overflow-y-auto border-l border-slate-200 bg-white shadow-[-24px_0_70px_rgba(15,23,42,.18)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-800">Workshop registration</p>
                <h2 className="mt-1 text-xl font-bold tracking-[-.03em] text-slate-950">{selectedRegistration.full_name}</h2>
                <p className="mt-1 text-xs text-slate-500">{selectedRegistration.contact_email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegistration(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Full name", selectedRegistration.full_name],
                  ["Age", selectedRegistration.age],
                  ["Email ID", selectedRegistration.contact_email],
                  ["Contact number", selectedRegistration.contact_number],
                  ["Current city / town", selectedRegistration.current_city],
                  ["State / region", selectedRegistration.state_region],
                  ["Country", selectedRegistration.country],
                  ["Institution / organization", selectedRegistration.institution_name],
                  ["Educational qualification", selectedRegistration.educational_qualification],
                  ["Current programme / course", selectedRegistration.current_programme_course],
                  ["Year / semester", selectedRegistration.year_semester || "—"],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl border border-slate-200 bg-[#f8fbfb] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[.13em] text-slate-400">{label}</p>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-850">{String(value ?? "—")}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[22px] border border-cyan-100 bg-cyan-50/50 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[.13em] text-cyan-800">Workshop record</p>
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <p><span className="font-semibold text-slate-800">Status:</span> {statusLabel(selectedRegistration.status)}</p>
                  <p><span className="font-semibold text-slate-800">Workshop Reference:</span> <span className="font-mono">{selectedRegistration.workshop_reference || "—"}</span></p>
                  <p><span className="font-semibold text-slate-800">Razorpay Payment ID:</span> <span className="break-all font-mono">{selectedRegistration.razorpay_payment_id || "—"}</span></p>
                  <p><span className="font-semibold text-slate-800">Amount:</span> {money(selectedRegistration.quoted_amount_paise)}</p>
                  <p><span className="font-semibold text-slate-800">Registered:</span> {dateTime(selectedRegistration.created_at)}</p>
                  <p><span className="font-semibold text-slate-800">Payment verified:</span> {dateTime(selectedRegistration.payment_verified_at)}</p>
                  <p><span className="font-semibold text-slate-800">Completed:</span> {dateTime(selectedRegistration.completed_at)}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
