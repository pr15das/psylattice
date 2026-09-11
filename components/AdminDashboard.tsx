"use client";

import Link from "next/link";
import {
  BadgeIndianRupee,
  BookOpenCheck,
  ChevronRight,
  CircleDollarSign,
  Crown,
  FileClock,
  FlaskConical,
  LayoutDashboard,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PsyLatticeLogo from "@/components/PsyLatticeLogo";

type Tab = "overview" | "users" | "payments" | "admins" | "audit";

type PsyLatticeAdminSession = {
  userId: string;
  email: string;
  role: "admin" | "super_admin";
};
type AnyRow = Record<string, any>;

type OverviewPayload = {
  ok: boolean;
  metrics?: Record<string, number>;
  recentPayments?: AnyRow[];
  recentAudit?: AnyRow[];
  error?: string;
};

type UsersPayload = {
  ok: boolean;
  users?: AnyRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  error?: string;
};

type DetailPayload = {
  ok: boolean;
  account?: AnyRow;
  studies?: AnyRow[];
  studyEntitlements?: AnyRow[];
  payments?: AnyRow[];
  adminGrants?: AnyRow[];
  error?: string;
};

function money(paise: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(paise || 0)) / 100);
}

function date(value: unknown) {
  if (!value) return "—";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
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

function planLabel(plan: unknown) {
  const value = String(plan || "free");
  if (value === "pro-monthly") return "Pro Monthly";
  if (value === "pro-annual") return "Pro Annual";
  if (value === "study-pass") return "Study Pass";
  return "Free";
}

function planTone(plan: unknown) {
  const value = String(plan || "free");
  if (value === "pro-annual") return "border-violet-200 bg-violet-50 text-violet-800";
  if (value === "pro-monthly") return "border-cyan-200 bg-cyan-50 text-cyan-800";
  if (value === "study-pass") return "border-sky-200 bg-sky-50 text-sky-800";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "PsyLattice admin request failed.");
  return payload;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "PsyLattice admin action failed.");
  return payload;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950">{value}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-800">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.025em] text-slate-950">{title}</h2>
          {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export default function AdminDashboard({
  initialAdmin,
}: {
  initialAdmin: PsyLatticeAdminSession;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [users, setUsers] = useState<AnyRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [payments, setPayments] = useState<AnyRow[]>([]);
  const [admins, setAdmins] = useState<AnyRow[]>([]);
  const [audit, setAudit] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [reason, setReason] = useState("");
  const [manualPlan, setManualPlan] = useState("pro-monthly");
  const [durationDays, setDurationDays] = useState("30");
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRole, setAdminRole] = useState("admin");
  const [adminReason, setAdminReason] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOverview(await getJson<OverviewPayload>("/api/admin/overview"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Admin overview could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (planFilter !== "all") params.set("plan", planFilter);
      params.set("pageSize", "100");
      const result = await getJson<UsersPayload>(`/api/admin/users?${params.toString()}`);
      setUsers(result.users || []);
      setUsersTotal(result.total || 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Users could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search, planFilter]);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getJson<{ ok: boolean; payments: AnyRow[] }>("/api/admin/payments?limit=150");
      setPayments(result.payments || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payments could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getJson<{ ok: boolean; admins: AnyRow[] }>("/api/admin/admins");
      setAdmins(result.admins || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Admin members could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getJson<{ ok: boolean; audit: AnyRow[] }>("/api/admin/audit?limit=150");
      setAudit(result.audit || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Audit log could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (userId: string) => {
    setDetailLoading(true);
    setActionMessage("");
    try {
      const result = await getJson<DetailPayload>(`/api/admin/users/${encodeURIComponent(userId)}`);
      setDetail(result);
      const firstStudy = result.studies?.[0]?.id;
      setSelectedStudyId(firstStudy ? String(firstStudy) : "");
    } catch (cause) {
      setDetail({ ok: false, error: cause instanceof Error ? cause.message : "User details could not be loaded." });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab === "users") void loadUsers();
    if (tab === "payments") void loadPayments();
    if (tab === "admins") void loadAdmins();
    if (tab === "audit") void loadAudit();
  }, [tab, loadUsers, loadPayments, loadAdmins, loadAudit]);

  useEffect(() => {
    if (!selectedUserId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedUserId);
  }, [selectedUserId, loadDetail]);

  const metrics = overview?.metrics || {};
  const selectedEntitlement = useMemo(() => {
    if (!selectedStudyId || !detail?.studyEntitlements) return null;
    return detail.studyEntitlements.find((row) => row.study_id === selectedStudyId) || null;
  }, [detail, selectedStudyId]);

  async function refreshAllAfterAction() {
    if (selectedUserId) await loadDetail(selectedUserId);
    await Promise.all([loadOverview(), loadUsers()]);
  }

  async function applyPlan() {
    if (!selectedUserId) return;
    setActionBusy(true);
    setActionMessage("");
    try {
      await postJson(`/api/admin/users/${selectedUserId}/plan`, {
        plan: manualPlan,
        durationDays: Number(durationDays || 30),
        reason,
      });
      setActionMessage("Plan access updated.");
      setReason("");
      await refreshAllAfterAction();
    } catch (cause) {
      setActionMessage(cause instanceof Error ? cause.message : "Plan update failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function setStudyPass(active: boolean) {
    if (!selectedUserId || !selectedStudyId) return;
    setActionBusy(true);
    setActionMessage("");
    try {
      await postJson(`/api/admin/users/${selectedUserId}/study-pass`, {
        studyId: selectedStudyId,
        active,
        reason,
      });
      setActionMessage(active ? "Study Pass granted." : "Study Pass revoked.");
      setReason("");
      await refreshAllAfterAction();
    } catch (cause) {
      setActionMessage(cause instanceof Error ? cause.message : "Study Pass update failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function changeCapacity(amount: number, mode: "add" | "reset" = "add") {
    if (!selectedUserId || !selectedStudyId) return;
    setActionBusy(true);
    setActionMessage("");
    try {
      await postJson(`/api/admin/users/${selectedUserId}/capacity`, {
        studyId: selectedStudyId,
        amount,
        mode,
        reason,
      });
      setActionMessage(mode === "reset" ? "Extra participant capacity reset." : `Added ${amount} participant slots.`);
      setReason("");
      await refreshAllAfterAction();
    } catch (cause) {
      setActionMessage(cause instanceof Error ? cause.message : "Capacity update failed.");
    } finally {
      setActionBusy(false);
    }
  }

  async function setAdminMember(action: "set" | "remove", email: string, role = adminRole) {
    setActionBusy(true);
    setActionMessage("");
    try {
      await postJson("/api/admin/admins", {
        action,
        email,
        role,
        reason: action === "set" ? adminReason : `Admin access removed by ${initialAdmin.email}`,
      });
      setAdminEmail("");
      setAdminReason("");
      setActionMessage(action === "set" ? "Admin role updated." : "Admin access removed.");
      await loadAdmins();
    } catch (cause) {
      setActionMessage(cause instanceof Error ? cause.message : "Admin role update failed.");
    } finally {
      setActionBusy(false);
    }
  }

  const nav: Array<{ id: Tab; label: string; icon: typeof Users }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "payments", label: "Payments", icon: CircleDollarSign },
    { id: "admins", label: "Admins", icon: ShieldCheck },
    { id: "audit", label: "Audit log", icon: FileClock },
  ];

  return (
    <main className="min-h-screen bg-[#f4f8f9] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-3 sm:px-7">
          <div className="flex items-center gap-3">
            <PsyLatticeLogo size={38} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold">PsyLattice Admin</p>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-800">
                  {initialAdmin.role === "super_admin" ? "Super Admin" : "Admin"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Accounts, billing access and platform operations</p>
            </div>
          </div>
          <Link
            href="/researcher"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-900"
          >
            Research workspace <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.05)] lg:sticky lg:top-[86px]">
          <p className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Admin console</p>
          <div className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-xs font-semibold transition ${
                    active ? "bg-cyan-50 text-cyan-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${active ? "bg-cyan-800 text-white" : "bg-slate-100 text-slate-500"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-700">Signed in as</p>
            <p className="mt-1 truncate text-[10px] text-slate-500">{initialAdmin.email}</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white px-6 py-7 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-800">
                  Platform operations
                </span>
                <h1 className="mt-4 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">
                  {tab === "overview" ? "PsyLattice at a glance" : nav.find((item) => item.id === tab)?.label}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  Admin controls affect account and billing entitlements only. They do not grant automatic access to researchers' private study responses, thesis content or participant data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (tab === "overview") void loadOverview();
                  if (tab === "users") void loadUsers();
                  if (tab === "payments") void loadPayments();
                  if (tab === "admins") void loadAdmins();
                  if (tab === "audit") void loadAudit();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-cyan-200 hover:text-cyan-900"
              >
                <RefreshCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          )}
          {actionMessage && (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">{actionMessage}</div>
          )}

          {tab === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Users} label="Accounts" value={String(metrics.totalAccounts || 0)} detail="All current PsyLattice accounts" />
                <MetricCard icon={Crown} label="Paying access" value={String(metrics.payingAccounts || 0)} detail="Study Pass or active Pro access" />
                <MetricCard icon={FlaskConical} label="Active studies" value={String(metrics.activeStudies || 0)} detail="Research studies currently active" />
                <MetricCard icon={BadgeIndianRupee} label="30-day revenue" value={money(metrics.revenue30dPaise)} detail="Verified paid checkout records" />
                <MetricCard icon={Sparkles} label="Pro Monthly" value={String(metrics.proMonthlyAccounts || 0)} detail="Current monthly Pro access" />
                <MetricCard icon={BookOpenCheck} label="Pro Annual" value={String(metrics.proAnnualAccounts || 0)} detail="Current annual Pro access" />
                <MetricCard icon={CircleDollarSign} label="Lifetime revenue" value={money(metrics.lifetimeRevenuePaise)} detail={`${metrics.successfulPayments || 0} successful payments`} />
                <MetricCard icon={FileClock} label="Failed payments" value={String(metrics.failedPayments || 0)} detail="Checkout records marked failed" />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Section title="Recent payments" description="Latest marketplace and subscription checkout records.">
                  {(overview?.recentPayments || []).length === 0 ? (
                    <EmptyState text="No payment records yet." />
                  ) : (
                    <div className="space-y-2">
                      {(overview?.recentPayments || []).map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800">{row.user?.full_name || row.user?.email || row.user_id}</p>
                            <p className="mt-1 text-[10px] text-slate-500">{row.status} · {dateTime(row.paid_at || row.created_at)}</p>
                          </div>
                          <p className="text-sm font-bold text-slate-950">{money(row.amount_paise)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
                <Section title="Recent admin activity" description="Every privilege or entitlement change is recorded.">
                  {(overview?.recentAudit || []).length === 0 ? (
                    <EmptyState text="No admin actions yet." />
                  ) : (
                    <div className="space-y-2">
                      {(overview?.recentAudit || []).map((row) => (
                        <div key={row.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                          <p className="text-xs font-semibold text-slate-800">{String(row.action || "admin_action").replaceAll("_", " ")}</p>
                          <p className="mt-1 text-[10px] leading-4 text-slate-500">{row.reason || "No reason supplied"} · {dateTime(row.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </div>
            </>
          )}

          {tab === "users" && (
            <Section
              title="User management"
              description={`${usersTotal} account${usersTotal === 1 ? "" : "s"} match the current filters.`}
              action={
                <div className="flex flex-wrap gap-2">
                  <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                    <option value="all">All plans</option>
                    <option value="free">Free</option>
                    <option value="study-pass">Study Pass</option>
                    <option value="pro-monthly">Pro Monthly</option>
                    <option value="pro-annual">Pro Annual</option>
                  </select>
                </div>
              }
            >
              <div className="mb-4 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void loadUsers()}
                    placeholder="Search name, email, institution or account ID"
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-300"
                  />
                </div>
                <button onClick={() => void loadUsers()} className="rounded-2xl bg-slate-950 px-5 text-xs font-semibold text-white">Search</button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Studies</th>
                      <th className="px-4 py-3">Payments</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {users.map((row) => (
                      <tr key={row.user_id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{row.full_name || "Unnamed account"}</p>
                          <p className="mt-0.5 text-[10px] text-slate-500">{row.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold ${planTone(row.effective_plan)}`}>{planLabel(row.effective_plan)}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.active_studies || 0} active · {row.total_studies || 0} total</td>
                        <td className="px-4 py-3 text-slate-600">{row.successful_payments || 0} · {money(row.total_paid_paise)}</td>
                        <td className="px-4 py-3 text-slate-500">{date(row.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setSelectedUserId(String(row.user_id))} className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:border-cyan-200 hover:text-cyan-900">Manage</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <div className="p-6"><EmptyState text="No accounts match these filters." /></div>}
              </div>
            </Section>
          )}

          {tab === "payments" && (
            <Section title="Payment history" description="Server-side Razorpay checkout ledger. Transaction IDs are available for support and reconciliation.">
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                    <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Transaction</th><th className="px-4 py-3">Date</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3"><p className="font-semibold">{row.user?.full_name || row.user?.email || "Unknown"}</p><p className="mt-0.5 text-[10px] text-slate-400">{row.user?.email}</p></td>
                        <td className="px-4 py-3 capitalize text-slate-600">{row.status}</td>
                        <td className="px-4 py-3 font-semibold">{money(row.amount_paise)}</td>
                        <td className="max-w-[240px] truncate px-4 py-3 font-mono text-[10px] text-slate-500">{row.razorpay_payment_id || row.razorpay_order_id || row.razorpay_subscription_id || "—"}</td>
                        <td className="px-4 py-3 text-slate-500">{dateTime(row.paid_at || row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && <div className="p-6"><EmptyState text="No billing records yet." /></div>}
              </div>
            </Section>
          )}

          {tab === "admins" && (
            <div className="space-y-6">
              {initialAdmin.role === "super_admin" && (
                <Section title="Add or change an administrator" description="Super Admins can grant or remove PsyLattice admin privileges. Normal Admins cannot create other admins.">
                  <div className="grid gap-3 md:grid-cols-[1.2fr_.6fr_1.5fr_auto]">
                    <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="user@example.com" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                    <select value={adminRole} onChange={(e) => setAdminRole(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="admin">Admin</option><option value="super_admin">Super Admin</option></select>
                    <input value={adminReason} onChange={(e) => setAdminReason(e.target.value)} placeholder="Reason for access" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                    <button disabled={actionBusy} onClick={() => void setAdminMember("set", adminEmail)} className="rounded-xl bg-slate-950 px-5 py-3 text-xs font-semibold text-white disabled:opacity-50">Apply</button>
                  </div>
                </Section>
              )}
              <Section title="Current administrators" description="Admin membership is separate from normal workspace roles and is checked server-side on every admin route.">
                <div className="space-y-2">
                  {admins.map((row) => (
                    <div key={row.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                      <div><p className="text-sm font-semibold">{row.account?.full_name || row.account?.email || row.user_id}</p><p className="mt-0.5 text-[10px] text-slate-500">{row.account?.email} · since {date(row.created_at)}</p></div>
                      <div className="flex items-center gap-2"><span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[9px] font-bold uppercase text-cyan-800">{String(row.role).replace("_", " ")}</span>{initialAdmin.role === "super_admin" && row.user_id !== initialAdmin.userId && <button onClick={() => void setAdminMember("remove", row.account?.email || "", row.role)} className="rounded-xl border border-rose-200 px-3 py-2 text-[10px] font-semibold text-rose-700">Remove</button>}</div>
                    </div>
                  ))}
                  {admins.length === 0 && <EmptyState text="No admin members found." />}
                </div>
              </Section>
            </div>
          )}

          {tab === "audit" && (
            <Section title="Admin audit trail" description="Plan changes, Study Pass grants, capacity grants and admin-role changes are recorded here.">
              <div className="space-y-2">
                {audit.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-900">{String(row.action || "admin_action").replaceAll("_", " ")}</p>
                      <p className="text-[10px] text-slate-400">{dateTime(row.created_at)}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">{row.actor?.full_name || row.actor?.email || row.actor_user_id} → {row.target?.full_name || row.target?.email || row.target_user_id || "platform"}</p>
                    {row.reason && <p className="mt-2 text-[10px] leading-4 text-slate-500">Reason: {row.reason}</p>}
                  </div>
                ))}
                {audit.length === 0 && <EmptyState text="No admin actions have been recorded yet." />}
              </div>
            </Section>
          )}
        </div>
      </div>

      {selectedUserId && (
        <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[560px] overflow-y-auto border-l border-slate-200 bg-white shadow-[-24px_0_70px_rgba(15,23,42,0.16)]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-md">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-800">Account operations</p><h2 className="mt-1 text-xl font-bold">Manage user</h2></div>
            <button onClick={() => setSelectedUserId(null)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
          </div>

          <div className="space-y-5 p-5">
            {detailLoading && <EmptyState text="Loading account…" />}
            {!detailLoading && detail?.error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{detail.error}</div>}
            {!detailLoading && detail?.account && (
              <>
                <div className="rounded-[24px] border border-cyan-200 bg-gradient-to-br from-white to-cyan-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xl font-bold">{detail.account.full_name || "Unnamed account"}</p><p className="mt-1 text-xs text-slate-500">{detail.account.email}</p></div>
                    <span className={`rounded-full border px-3 py-1 text-[9px] font-bold ${planTone(detail.account.effective_plan)}`}>{planLabel(detail.account.effective_plan)}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-white/80 p-3"><p className="text-slate-400">Member since</p><p className="mt-1 font-semibold">{date(detail.account.created_at)}</p></div><div className="rounded-xl bg-white/80 p-3"><p className="text-slate-400">Total paid</p><p className="mt-1 font-semibold">{money(detail.account.total_paid_paise)}</p></div></div>
                </div>

                <Section title="Complimentary plan access" description="Use this for pilots, university arrangements, support corrections or internal testing. Paid Razorpay subscriptions cannot be overwritten here.">
                  <div className="space-y-3">
                    <select value={manualPlan} onChange={(e) => setManualPlan(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"><option value="free">Free</option><option value="pro-monthly">Pro Monthly</option><option value="pro-annual">Pro Annual</option></select>
                    {manualPlan !== "free" && <label className="block"><span className="text-xs font-semibold text-slate-600">Access duration (days)</span><input value={durationDays} onChange={(e) => setDurationDays(e.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" /></label>}
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason required for the audit log" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                    <button disabled={actionBusy} onClick={() => void applyPlan()} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white disabled:opacity-50">{actionBusy ? "Applying…" : "Apply plan access"}</button>
                  </div>
                </Section>

                <Section title="Study-level access" description="Grant or revoke a Study Pass and add complimentary participant capacity to one of this user's studies.">
                  {(detail.studies || []).length === 0 ? <EmptyState text="This account has no research studies yet." /> : <div className="space-y-3">
                    <select value={selectedStudyId} onChange={(e) => setSelectedStudyId(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm">{(detail.studies || []).map((study) => <option key={study.id} value={study.id}>{study.title || "Untitled study"} · {study.status}</option>)}</select>
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p>Study Pass: <strong>{selectedEntitlement?.study_pass_active ? "Active" : "Not active"}</strong></p><p className="mt-1">Extra participant capacity: <strong>+{Number(selectedEntitlement?.participant_bonus || 0)}</strong></p></div>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason required for Study Pass/capacity changes" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
                    <div className="grid grid-cols-2 gap-2"><button disabled={actionBusy} onClick={() => void setStudyPass(true)} className="rounded-xl bg-cyan-800 px-3 py-3 text-xs font-semibold text-white">Grant Study Pass</button><button disabled={actionBusy} onClick={() => void setStudyPass(false)} className="rounded-xl border border-slate-200 px-3 py-3 text-xs font-semibold text-slate-700">Revoke Study Pass</button></div>
                    <div className="grid grid-cols-4 gap-2">{[100, 200, 500].map((amount) => <button key={amount} disabled={actionBusy} onClick={() => void changeCapacity(amount)} className="rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2.5 text-[10px] font-semibold text-cyan-900">+{amount}</button>)}<button disabled={actionBusy} onClick={() => void changeCapacity(0, "reset")} className="rounded-xl border border-slate-200 px-2 py-2.5 text-[10px] font-semibold text-slate-600">Reset</button></div>
                  </div>}
                </Section>

                <Section title="Recent payments" description={`${detail.account.successful_payments || 0} successful payments on this account.`}>
                  {(detail.payments || []).length === 0 ? <EmptyState text="No payment records for this account." /> : <div className="space-y-2">{(detail.payments || []).slice(0, 10).map((payment) => <div key={payment.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3"><div><p className="text-xs font-semibold capitalize">{payment.status} · {payment.checkout_kind}</p><p className="mt-1 max-w-[320px] truncate font-mono text-[9px] text-slate-400">{payment.razorpay_payment_id || payment.razorpay_order_id || payment.razorpay_subscription_id || payment.id}</p></div><p className="text-sm font-bold">{money(payment.amount_paise)}</p></div>)}</div>}
                </Section>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
